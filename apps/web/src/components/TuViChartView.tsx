import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BRANCHES_VI,
  STAR_DEFS,
  STEMS_VI,
  type Palace,
  type TuViChart,
  type TuViGender,
} from '../../../../packages/tuvi-engine/src/index.ts';
import { hourBranchName, hourRange } from '../format.ts';
import { buildTuViReading, palaceRules } from '../reading.ts';
import { PalaceCard, PalacePanel } from './PalaceCard.tsx';
import { PalaceDetail } from './reading-blocks.tsx';
import { TuViReadingSection } from './TuViReadingSection.tsx';

const HUA_SHORT: Record<string, string> = {
  loc: 'Lộc',
  quyen: 'Quyền',
  khoa: 'Khoa',
  ky: 'Kỵ',
};

const HUA_ORDER: Record<string, number> = { loc: 0, quyen: 1, khoa: 2, ky: 3 };

const LEAP_LABEL: Record<TuViChart['options']['leapMonthRule'], string> = {
  split: 'Nhuận: chia đôi',
  'as-month': 'Nhuận: giữ tháng',
  'as-next': 'Nhuận: dồn tháng sau',
};

type Props = { chart: TuViChart; calendarLabel?: string; gender: TuViGender };

export function TuViChartView({ chart, calendarLabel = 'Âm lịch TQ', gender }: Props) {
  const byBranch = new Map(chart.palaces.map((p) => [p.branch, p]));
  const soulPalace = chart.palaces.find((p) => p.isSoul);
  const bodyPalace = chart.palaces.find((p) => p.isBody);
  const cycle = ((chart.birth.lunarYear - 4) % 60 + 60) % 60;
  const yearVi = `${STEMS_VI[cycle % 10]} ${BRANCHES_VI[cycle % 12]}`;

  // Luận giải tính một lần, dùng cho cả bảng trượt lẫn khối đọc bên dưới.
  const reading = useMemo(() => buildTuViReading(chart, gender), [chart, gender]);
  const rules = useMemo(() => palaceRules(), []);

  const [openBranch, setOpenBranch] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  // Chỉ nhắc "vuốt ngang" khi lá số thật sự rộng hơn khung nhìn.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setShowHint(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [chart]);

  // 12 cung đi nghịch từ cung Mệnh — đúng thứ tự tên cung trong lá số.
  const ordered = useMemo<Palace[]>(() => {
    const soulBranch = chart.soul.branch;
    return Array.from({ length: 12 }, (_, i) => chart.palaces[(soulBranch - i + 12) % 12]!);
  }, [chart]);

  const openIndex = openBranch === null ? -1 : ordered.findIndex((p) => p.branch === openBranch);
  const openReading = openBranch === null ? null : reading.palaces[openBranch];
  const openPalace = openBranch === null ? null : byBranch.get(openBranch);

  const step = (delta: number) => {
    if (openIndex < 0) return;
    const next = ordered[(openIndex + delta + 12) % 12];
    if (next) setOpenBranch(next.branch);
  };

  const cell = (branch: number) => {
    const p = byBranch.get(branch);
    if (!p) return null;
    return (
      <PalaceCard
        key={branch}
        palace={p}
        expanded={openBranch === branch}
        onOpen={(trigger) => {
          triggerRef.current = trigger;
          setOpenBranch(branch);
        }}
      />
    );
  };

  return (
    <section className="tuvi">
      <div className="chart-head">
        <div>
          <h2>Lá số Tử Vi Đẩu Số</h2>
          <p className="muted">
            ngày {chart.birth.lunarDay} tháng {chart.birth.lunarMonth}
            {chart.birth.lunarLeap ? ' nhuận' : ''} năm {yearVi} · giờ{' '}
            {hourBranchName(chart.birth.hourBranch)} ({hourRange(chart.birth.hourBranch)})
          </p>
        </div>
        <div className="chart-badges">
          <span className="chip chip-key">{chart.bureau.vi}</span>
          <span className="chip">{chart.year.vi}</span>
          {chart.birth.lunarLeap && <span className="chip">{LEAP_LABEL[chart.options.leapMonthRule]}</span>}
        </div>
      </div>

      {showHint && (
        <p className="scroll-hint" aria-hidden="true">
          Vuốt ngang để xem đủ 12 cung
        </p>
      )}
      <div className="tuvi-scroll" ref={scrollRef}>
        <div className="tuvi-grid" role="group" aria-label="Mười hai cung trong lá số">
          {Array.from({ length: 12 }, (_, b) => cell(b))}
          <div className="tuvi-center">
            <div className="center-title">Tử Vi</div>
            <dl className="center-dl">
              <div>
                <dt>{calendarLabel}</dt>
                <dd>
                  {chart.birth.lunarDay}/{chart.birth.lunarMonth}
                  {chart.birth.lunarLeap ? ' nhuận' : ''} · {yearVi}
                </dd>
              </div>
              <div>
                <dt>Giờ sinh</dt>
                <dd>
                  {hourBranchName(chart.birth.hourBranch)} ({hourRange(chart.birth.hourBranch)})
                </dd>
              </div>
              <div>
                <dt>Ngũ hành cục</dt>
                <dd>{chart.bureau.vi}</dd>
              </div>
              <div>
                <dt>Mệnh chủ</dt>
                <dd>{STAR_DEFS[chart.soulStar].vi}</dd>
              </div>
              <div>
                <dt>Thân chủ</dt>
                <dd>{STAR_DEFS[chart.bodyStar].vi}</dd>
              </div>
              <div>
                <dt>Mệnh / Thân</dt>
                <dd>
                  {soulPalace ? `${soulPalace.stemVi} ${soulPalace.branchVi}` : '—'} /{' '}
                  {bodyPalace ? bodyPalace.branchVi : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="tuvi-below">
        <div className="mini-card">
          <h3>Tứ Hoá năm {chart.year.vi}</h3>
          <ul className="hua-list">
            {[...chart.mutagens]
              .sort((a, b) => (HUA_ORDER[a.hua] ?? 9) - (HUA_ORDER[b.hua] ?? 9))
              .map((m) => (
                <li key={m.star}>
                  <span className={`hua hua-${m.hua}`}>{m.vi}</span>
                  <span>{STAR_DEFS[m.star].vi}</span>
                  <span className="muted">cung {BRANCHES_VI[m.branch]}</span>
                </li>
              ))}
          </ul>
          <p className="tiny muted">
            Bảng Tứ Hoá Nam phái. Các phái khác có thể gán khác — xem mục “Phương pháp”.
          </p>
        </div>

        <div className="mini-card">
          <h3>Ghi chú an sao</h3>
          {chart.notes.length === 0 ? (
            <p className="muted">Không có quy tắc đặc biệt nào được áp dụng.</p>
          ) : (
            <ul className="notes">
              {chart.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <p className="tiny muted">
            Tháng nhuận:{' '}
            {chart.birth.leapRuleApplied
              ? `đã đổi tháng an sao sang ${chart.birth.monthUsed}.`
              : chart.birth.lunarLeap
                ? `giữ tháng ${chart.birth.monthUsed}.`
                : 'không áp dụng.'}
          </p>
        </div>
      </div>

      <TuViReadingSection chart={chart} gender={gender} reading={reading} />

      <PalacePanel
        open={openReading !== null}
        title={openPalace ? `Cung ${openPalace.nameVi}` : ''}
        subtitle={
          openPalace && openReading
            ? `${openPalace.stemVi} ${openPalace.branchVi} · đại hạn ${openReading.dahan.fromAge}–${openReading.dahan.toAge}`
            : undefined
        }
        onClose={() => setOpenBranch(null)}
        onPrev={openIndex > 0 ? () => step(-1) : undefined}
        onNext={openIndex >= 0 && openIndex < 11 ? () => step(1) : undefined}
        returnFocus={triggerRef.current}
      >
        {openReading && (
          <div className="reading-palace-body palace-panel-detail">
            <PalaceDetail reading={openReading} rules={rules.get(openReading.palace.branch)} />
          </div>
        )}
      </PalacePanel>
    </section>
  );
}
