import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { PROVINCES } from '../../../packages/calendar-core/src/provinces.ts';
import type { PresetName } from '../../../packages/calendar-core/src/index.ts';
import type { Gender } from '../../../packages/bazi-engine/src/index.ts';
import type { ComputeResult } from './engine.ts';
import { BirthForm } from './components/BirthForm.tsx';
import { DEFAULT_FORM, PRESET_INFO, parseForm, type FormValues } from './form.ts';
import { formatDate, formatTime, lunarShort, yearName } from './format.ts';
import { copyUrl } from './share.ts';

// Ba tab kết quả tách khỏi gói chính: lần đầu mở chỉ tải biểu mẫu.
const TuViChartView = lazy(() =>
  import('./components/TuViChartView.tsx').then((m) => ({ default: m.TuViChartView })),
);
const BaziView = lazy(() =>
  import('./components/BaziView.tsx').then((m) => ({ default: m.BaziView })),
);
const CalcTrace = lazy(() =>
  import('./components/CalcTrace.tsx').then((m) => ({ default: m.CalcTrace })),
);
const MethodPage = lazy(() =>
  import('./components/MethodPage.tsx').then((m) => ({ default: m.MethodPage })),
);

type Tab = 'tuvi' | 'bazi' | 'calc';
type Page = 'lookup' | 'method';

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
  const provinceRaw = p.get('province');
  const province: string =
    provinceRaw && PROVINCES.some((x) => x.code === provinceRaw) ? provinceRaw : '';
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
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'tuvi', label: 'Tử Vi' },
  { id: 'bazi', label: 'Bát Tự' },
  { id: 'calc', label: 'Cách tính' },
];

export function App() {
  const initial = useMemo(readInitial, []);
  const [page, setPage] = useState<Page>('lookup');
  const [values, setValues] = useState<FormValues>(initial?.values ?? DEFAULT_FORM);
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [computedWith, setComputedWith] = useState<ComputedWith | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('tuvi');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [announce, setAnnounce] = useState('');
  const resultsRef = useRef<HTMLElement>(null);
  const shouldFocus = useRef(false);

  const computeFor = async (v: FormValues) => {
    setBusy(true);
    setError(null);
    const parsed = parseForm(v);
    if (parsed.error) {
      setError(parsed.error);
      setResult(null);
      setBusy(false);
      return;
    }
    try {
      // Nạp engine + bảng lịch khi thực sự cần: lần đầu mở trang chỉ tải biểu mẫu.
      const { computeCharts } = await import('./engine.ts');
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
      setComputedWith({ gender: v.gender, preset: v.preset });
      setTab('tuvi');
      setEditing(false);
      syncUrl(v);
      setAnnounce('Đã an lá số.');
      shouldFocus.current = true;
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Tự tính lại khi mở một URL có chia sẻ lá số.
  useEffect(() => {
    if (initial?.active) void computeFor(initial.values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kết quả vào DOM thì đưa focus tới vùng kết quả để trình đọc màn hình đọc tiếp.
  useEffect(() => {
    if (!result || !shouldFocus.current) return;
    shouldFocus.current = false;
    const el = resultsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }, [result]);

  const submit = () => void computeFor(values);

  const shareCopy = async () => {
    const outcome = await copyUrl(window.location.href);
    setAnnounce(outcome.message);
    window.setTimeout(() => setAnnounce(''), 2500);
  };

  const openMethod = () => {
    setPage('method');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showForm = page === 'lookup' && (!result || editing);
  const showResult = page === 'lookup' && Boolean(result) && !editing;

  return (
    <div className="app">
      <header className="site-head">
        <button className="brand" onClick={() => setPage('lookup')}>
          <span className="brand-name">Tra Cứu Huyền Học</span>
          <span className="brand-sub">Tử Vi · Bát Tự</span>
        </button>
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <main className="lookup">
        {showForm && (
          <BirthForm
            values={values}
            onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            onSubmit={submit}
            onCancel={result ? () => setEditing(false) : undefined}
            error={error}
            busy={busy}
          />
        )}

        {busy && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true" />
            <span>Đang an lá số…</span>
          </div>
        )}

        {showResult && result && (
          <section
            id="ket-qua"
            className="result"
            ref={resultsRef}
            tabIndex={-1}
            aria-label="Kết quả lá số"
          >
            <header className="result-head">
              <div>
                <h1>Lá số của bạn</h1>
                <p className="result-meta">
                  {computedWith?.gender === 'nu' ? 'Nữ' : 'Nam'} ·{' '}
                  {formatTime(result.ctx.civilWall.hour, result.ctx.civilWall.minute)}{' '}
                  {formatDate(
                    result.ctx.civilWall.year,
                    result.ctx.civilWall.month,
                    result.ctx.civilWall.day,
                  )}{' '}
                  · Âm lịch {lunarShort(result.ctx.lunar.cn)} {yearName(result.ctx.lunar.cn)}
                </p>
              </div>
              <div className="result-actions">
                <button type="button" className="link-btn" onClick={shareCopy}>
                  Chép liên kết
                </button>
                <button type="button" className="link-btn" onClick={() => setEditing(true)}>
                  Đổi ngày sinh
                </button>
              </div>
            </header>

            <div className="tabs" role="tablist" aria-label="Nội dung lá số">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  aria-label={t.label}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              className="tab-view"
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
            >
              <Suspense fallback={<p className="page-loading">Đang mở…</p>}>
                {tab === 'tuvi' &&
                  (result.tuvi ? (
                    <TuViChartView
                      chart={result.tuvi}
                      gender={computedWith?.gender ?? values.gender}
                    />
                  ) : (
                    <div className="empty">
                      <h2>Không dựng được lá số Tử Vi</h2>
                      <p>{result.tuviError}</p>
                      <p className="muted">Bát Tự vẫn xem được bình thường.</p>
                    </div>
                  ))}
                {tab === 'bazi' && <BaziView chart={result.bazi} />}
                {tab === 'calc' && (
                  <CalcTrace ctx={result.ctx} tuvi={result.tuvi} bazi={result.bazi} />
                )}
              </Suspense>
            </div>
          </section>
        )}

        {page === 'method' && (
          <Suspense fallback={<p className="page-loading">Đang mở…</p>}>
            <MethodPage onBack={() => setPage('lookup')} />
          </Suspense>
        )}
      </main>

      <footer className="site-foot">
        <span>Không phải lời khuyên y tế, tài chính hay pháp lý.</span>
        <button type="button" className="link-btn" onClick={openMethod}>
          Nguồn &amp; phương pháp
        </button>
      </footer>
    </div>
  );
}
