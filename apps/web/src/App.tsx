import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PROVINCES,
  type PresetName,
} from '../../../packages/calendar-core/src/index.ts';
import type { Gender } from '../../../packages/bazi-engine/src/index.ts';
import { computeCharts, type ComputeResult } from './engine.ts';
import { BirthForm } from './components/BirthForm.tsx';
import { DEFAULT_FORM, PRESET_INFO, parseForm, type FormValues } from './form.ts';
import { TuViChartView } from './components/TuViChartView.tsx';
import { BaziView } from './components/BaziView.tsx';
import { CalcTrace, WarningList } from './components/CalcTrace.tsx';
import { MethodPage } from './components/MethodPage.tsx';
import { StarReference } from './components/StarReference.tsx';
import { formatDate, formatTime, lunarShort, yearName } from './format.ts';

type Tab = 'tuvi' | 'bazi' | 'calc';
type Page = 'lookup' | 'stars' | 'method';

const PRESET_KEYS = Object.keys(PRESET_INFO) as PresetName[];

function readInitial(): { values: FormValues; active: boolean } | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const y = Number(p.get('y'));
  if (!y) return null;
  const m = Number(p.get('m'));
  const d = Number(p.get('d'));
  if (!m || !d) return null;
  const h = Number(p.get('h') ?? 12);
  const mi = Number(p.get('mi') ?? 0);
  const presetRaw = p.get('preset');
  const preset = PRESET_KEYS.includes(presetRaw as PresetName)
    ? (presetRaw as PresetName)
    : DEFAULT_FORM.preset;
  const genderRaw = p.get('gender');
  const gender: Gender = genderRaw === 'nu' ? 'nu' : 'nam';
  const provinceRaw = p.get('province') ?? '';
  const province = PROVINCES.some((x) => x.code === provinceRaw) ? provinceRaw : '';
  const ziRaw = p.get('zi');
  const ziBoundary: FormValues['ziBoundary'] =
    ziRaw === 'late' || ziRaw === 'early' ? ziRaw : '';
  const hourstemRaw = p.get('hourstem');
  const hourStemRule: FormValues['hourStemRule'] =
    hourstemRaw === 'current-day' || hourstemRaw === 'next-day' ? hourstemRaw : '';
  const leapRaw = p.get('leap');
  const leapMonthRule =
    leapRaw === 'as-month' || leapRaw === 'as-next' || leapRaw === 'split'
      ? leapRaw
      : DEFAULT_FORM.leapMonthRule;

  return {
    values: {
      year: String(y),
      month: String(m),
      day: String(d),
      hour: String(h),
      minute: String(mi),
      province,
      district: p.get('district') ?? '',
      gender,
      preset,
      ziBoundary,
      hourStemRule,
      leapMonthRule,
    },
    active: true,
  };
}

function syncUrl(values: FormValues): void {
  const p = new URLSearchParams();
  p.set('y', values.year);
  p.set('m', values.month);
  p.set('d', values.day);
  p.set('h', values.hour);
  p.set('mi', values.minute);
  if (values.province) p.set('province', values.province);
  if (values.district) p.set('district', values.district);
  p.set('gender', values.gender);
  p.set('preset', values.preset);
  if (values.ziBoundary) p.set('zi', values.ziBoundary);
  if (values.hourStemRule) p.set('hourstem', values.hourStemRule);
  if (values.leapMonthRule !== 'split') p.set('leap', values.leapMonthRule);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
}

type ComputedWith = {
  gender: Gender;
  preset: PresetName;
  ziBoundary: FormValues['ziBoundary'];
  hourStemRule: FormValues['hourStemRule'];
  leapMonthRule: FormValues['leapMonthRule'];
};

export function App() {
  const initial = useMemo(readInitial, []);
  const [page, setPage] = useState<Page>('lookup');
  const [values, setValues] = useState<FormValues>(initial?.values ?? DEFAULT_FORM);
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [computedWith, setComputedWith] = useState<ComputedWith | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('tuvi');
  const [tuviVariant, setTuviVariant] = useState<'cn' | 'vn'>('cn');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const resultsRef = useRef<HTMLElement>(null);
  const shouldFocus = useRef(false);

  const computeFor = (v: FormValues, focus: boolean) => {
    setBusy(true);
    setError(null);
    const parsed = parseForm(v);
    if (parsed.error) {
      setError(parsed.error);
      setResult(null);
      setAnnounce('');
      setBusy(false);
      return;
    }
    try {
      const res = computeCharts(parsed.input, {
        preset: v.preset,
        gender: v.gender,
        convention: {
          ...(v.ziBoundary ? { ziBoundary: v.ziBoundary } : {}),
          ...(v.hourStemRule ? { hourStemRule: v.hourStemRule } : {}),
        },
        tuvi: { leapMonthRule: v.leapMonthRule },
      });
      setResult(res);
      setComputedWith({
        gender: v.gender,
        preset: v.preset,
        ziBoundary: v.ziBoundary,
        hourStemRule: v.hourStemRule,
        leapMonthRule: v.leapMonthRule,
      });
      setTuviVariant('cn');
      setTab('tuvi');
      syncUrl(v);
      setAnnounce('Đã lập lá số. Kết quả gồm Tử Vi, Bát Tự và cách tính chi tiết.');
      if (focus) shouldFocus.current = true;
    } catch (err) {
      setResult(null);
      setAnnounce('');
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Tự tính lại khi mở một URL có chia sẻ lá số.
  useEffect(() => {
    if (initial?.active) computeFor(initial.values, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sau khi kết quả được gắn vào DOM, đưa focus tới vùng kết quả
  // để trình đọc màn hình đọc tiếp từ đầu lá số.
  useEffect(() => {
    if (!result || !shouldFocus.current) return;
    shouldFocus.current = false;
    const el = resultsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }, [result]);

  const submit = () => computeFor(values, true);

  const go = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <header className="site-head">
        <button className="brand" onClick={() => go('lookup')}>
          <span className="brand-mark" aria-hidden="true">☯</span>
          <span className="brand-text">
            Tra Cứu Huyền Học
            <small>Tử Vi · Bát Tự · minh bạch</small>
          </span>
        </button>
        <nav className="site-nav">
          <button aria-pressed={page === 'lookup'} onClick={() => go('lookup')}>
            Tra cứu
          </button>
          <button aria-pressed={page === 'stars'} onClick={() => go('stars')}>
            Tinh diệu
          </button>
          <button aria-pressed={page === 'method'} onClick={() => go('method')}>
            Phương pháp
          </button>
        </nav>
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      {page === 'method' ? (
        <MethodPage onBack={() => go('lookup')} />
      ) : page === 'stars' ? (
        <StarReference onBack={() => go('lookup')} />
      ) : (
        <main className="lookup">
          <section className="hero">
            <div className="eyebrow">Tử Vi Đẩu Số · Bát Tự / Tứ Trụ</div>
            <h1>
              Lá số minh bạch.
              <br />
              Không phán.
            </h1>
            <p>
              Mỗi con số đều có đường đi: từ giờ trên đồng hồ, qua múi giờ lịch sử, tiết khí, âm
              lịch — đến ngôi sao. Chỗ nào có tranh cãi, chúng tôi cho bạn chọn và ghi rõ.
            </p>
          </section>

          <BirthForm
            values={values}
            onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            onSubmit={submit}
            error={error}
            busy={busy}
          />

          {result && (
            <section
              id="ket-qua"
              className="result"
              ref={resultsRef}
              tabIndex={-1}
              aria-label="Kết quả lá số"
            >
              <div className="result-head">
                <div className="result-summary">
                  <span className="chip">
                    {formatTime(result.ctx.civilWall.hour, result.ctx.civilWall.minute)} ·{' '}
                    {formatDate(
                      result.ctx.civilWall.year,
                      result.ctx.civilWall.month,
                      result.ctx.civilWall.day,
                    )}
                  </span>
                  <span className="chip chip-key">
                    Âm lịch TQ {lunarShort(result.ctx.lunar.cn)} · {yearName(result.ctx.lunar.cn)}
                  </span>
                  <span className="chip">
                    Tứ trụ {result.ctx.pillars.year.vi} {result.ctx.pillars.month.vi}{' '}
                    {result.ctx.pillars.day.vi} {result.ctx.pillars.hour.vi}
                  </span>
                  <span className="chip">{PRESET_INFO[computedWith?.preset ?? values.preset].label}</span>
                  {computedWith?.ziBoundary && (
                    <span className="chip">
                      Tý {computedWith.ziBoundary === 'early' ? 'sớm (23:00)' : 'muộn (00:00)'}
                    </span>
                  )}
                  {computedWith?.hourStemRule && (
                    <span className="chip">
                      Can giờ {computedWith.hourStemRule === 'next-day' ? 'ngày kế' : 'ngày hiện tại'}
                    </span>
                  )}
                </div>
                <div className="tabs" role="tablist" aria-label="Nội dung lá số">
                  <button
                    role="tab"
                    aria-selected={tab === 'tuvi'}
                    className={tab === 'tuvi' ? 'active' : ''}
                    onClick={() => setTab('tuvi')}
                  >
                    Tử Vi
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === 'bazi'}
                    className={tab === 'bazi' ? 'active' : ''}
                    onClick={() => setTab('bazi')}
                  >
                    Bát Tự
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === 'calc'}
                    className={tab === 'calc' ? 'active' : ''}
                    onClick={() => setTab('calc')}
                  >
                    Cách tính
                  </button>
                </div>
              </div>

              <WarningList ctx={result.ctx} />

              {tab === 'tuvi' && (
                result.tuvi ? (
                  <>
                    {result.ctx.lunar.diverges && result.tuviVn && (
                      <div className="variant-bar">
                        <div>
                          <strong>Hai lịch cho hai ngày âm khác nhau.</strong>{' '}
                          <span>
                            Lá số chính an theo lịch Trung Quốc (UTC+8). Bản đối chiếu an theo lịch
                            Việt Nam (UTC+7) — thường là lý do ứng dụng Việt và ứng dụng Trung Quốc
                            ra khác.
                          </span>
                        </div>
                        <div className="segmented" role="group" aria-label="Chọn lịch an sao">
                          <button
                            type="button"
                            aria-pressed={tuviVariant === 'cn'}
                            onClick={() => setTuviVariant('cn')}
                          >
                            Lịch TQ (chính)
                          </button>
                          <button
                            type="button"
                            aria-pressed={tuviVariant === 'vn'}
                            onClick={() => setTuviVariant('vn')}
                          >
                            Lịch VN (đối chiếu)
                          </button>
                        </div>
                      </div>
                    )}
                    <TuViChartView
                      chart={
                        tuviVariant === 'vn' && result.tuviVn ? result.tuviVn : result.tuvi
                      }
                      calendarLabel={tuviVariant === 'vn' ? 'Âm lịch VN' : 'Âm lịch TQ'}
                    />
                  </>
                ) : (
                  <div className="empty">
                    <h2>Không dựng được lá số Tử Vi</h2>
                    <p>{result.tuviError}</p>
                    <p className="muted">
                      Bát Tự vẫn xem được bình thường. Tử Vi cần năm âm lịch từ 1900 trở đi; sinh
                      trước Tết 1900 sẽ không có lá số.
                    </p>
                  </div>
                )
              )}
              {tab === 'bazi' && (
                <BaziView
                  chart={result.bazi}
                  ctx={result.ctx}
                  gender={computedWith?.gender ?? values.gender}
                />
              )}
              {tab === 'calc' && (
                <CalcTrace ctx={result.ctx} tuvi={result.tuvi} bazi={result.bazi} />
              )}
            </section>
          )}

          {!result && !error && (
            <section className="intro-grid">
              <div className="intro-card">
                <h2>Vì sao lá số có thể khác ứng dụng khác?</h2>
                <p>
                  Vì mỗi ứng dụng chọn một quy ước: giờ Bắc Kinh hay giờ nơi sinh, Tý sớm hay Tý
                  muộn, tháng nhuận chia đôi hay giữ nguyên, năm đổi tại Tết hay Lập Xuân. Ở đây bạn
                  thấy và đổi được từng lựa chọn.
                </p>
                <button className="link-btn" onClick={() => setPage('method')}>
                  Đọc phương pháp →
                </button>
              </div>
              <div className="intro-card">
                <h2>Chỉ tính, không đoán</h2>
                <p>
                  Phiên bản này an sao, lập tứ trụ, tính tàng can, thập thần và đại vận. Chưa có
                  lời luận giải vận mệnh — mọi câu chữ Hán dùng làm căn cứ đều mở ra đọc được
                  nguyên văn.
                </p>
                <button className="link-btn" onClick={() => setPage('method')}>
                  Xem nguồn &amp; giới hạn →
                </button>
              </div>
            </section>
          )}

          <footer className="site-foot">
            <p>
              Kết quả là phép tính theo quy ước đã công bố, không phải lời khuyên về y tế, tài
              chính hay pháp lý.
            </p>
            <p className="tinier">
              Lõi lịch và phần an sao có bộ kiểm thử đối chứng độc lập · trích dẫn qua cổng kiểm
              SHA-256 · <code>npm run check</code>
            </p>
          </footer>
        </main>
      )}
    </div>
  );
}
