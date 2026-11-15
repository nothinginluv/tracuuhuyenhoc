/**
 * Lá số Tử Vi: 12 ô cung quanh một ô giữa, rồi phần đọc 12 cung bên dưới.
 *
 * Bấm một ô cung sẽ mở đúng cung ấy ở khung đọc (và cuộn tới đó). Ô cung chỉ
 * ghi tên cung, can chi và tên sao chính — đủ để nhìn lá số, không thêm chú
 * thích kỹ thuật.
 */
import { useMemo, useState } from 'react';
import {
  BRANCHES_VI,
  STAR_DEFS,
  STEMS_VI,
  type TuViChart,
  type TuViGender,
} from '../../../../packages/tuvi-engine/src/index.ts';
import { hourBranchName, hourRange } from '../format.ts';
import { buildTuViReading } from '../reading.ts';
import { TuViReadingSection } from './TuViReadingSection.tsx';

/** Vị trí 12 cung theo lối lá số cổ: Tỵ ở góc trên trái, đi ngược chiều kim đồng hồ. */
const POSITION: Record<number, { row: number; col: number }> = {
  5: { row: 1, col: 1 },
  6: { row: 1, col: 2 },
  7: { row: 1, col: 3 },
  8: { row: 1, col: 4 },
  4: { row: 2, col: 1 },
  9: { row: 2, col: 4 },
  3: { row: 3, col: 1 },
  10: { row: 3, col: 4 },
  2: { row: 4, col: 1 },
  1: { row: 4, col: 2 },
  0: { row: 4, col: 3 },
  11: { row: 4, col: 4 },
};

type Props = { chart: TuViChart; gender: TuViGender };

export function TuViChartView({ chart, gender }: Props) {
  const reading = useMemo(() => buildTuViReading(chart, gender), [chart, gender]);
  const [picked, setPicked] = useState<number>(chart.soul.branch);

  const cycle = (((chart.birth.lunarYear - 4) % 60) + 60) % 60;
  const yearVi = `${STEMS_VI[cycle % 10]} ${BRANCHES_VI[cycle % 12]}`;

  const pick = (branch: number) => {
    setPicked(branch);
    document.getElementById('doc-12-cung')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="tuvi">
      <div className="chart-head">
        <h2>Lá số Tử Vi</h2>
        <p className="muted">
          ngày {chart.birth.lunarDay} tháng {chart.birth.lunarMonth}
          {chart.birth.lunarLeap ? ' nhuận' : ''} năm {yearVi} · giờ{' '}
          {hourBranchName(chart.birth.hourBranch)} ({hourRange(chart.birth.hourBranch)})
        </p>
      </div>

      <div className="chart-scroll">
        <div className="chart-grid" role="group" aria-label="Mười hai cung trong lá số">
          {chart.palaces.map((p) => {
            const pos = POSITION[p.branch]!;
            const selected = p.branch === picked;
            return (
              <button
                key={p.branch}
                type="button"
                onClick={() => pick(p.branch)}
                aria-pressed={selected}
                className={`chart-cell${p.isSoul ? ' is-soul' : ''}${selected ? ' is-picked' : ''}`}
                style={{ gridRow: pos.row, gridColumn: pos.col }}
              >
                <span className="cell-head">
                  <span className="cell-name">{p.nameVi}</span>
                  <span className="cell-ganzhi">
                    {p.stemVi} {p.branchVi}
                  </span>
                </span>
                <span className="cell-stars">
                  {p.mainStars.map((s) => s.vi).join(' · ') || '—'}
                </span>
                {(p.isSoul || p.isBody) && (
                  <span className="cell-tags">
                    {p.isSoul && <span className="tag">Mệnh</span>}
                    {p.isBody && <span className="tag">Thân</span>}
                  </span>
                )}
              </button>
            );
          })}

          <div className="chart-center" style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}>
            <p className="chart-center-title">Tử Vi</p>
            <dl>
              <div>
                <dt>Âm lịch</dt>
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
            </dl>
          </div>
        </div>
      </div>

      <TuViReadingSection reading={reading} active={picked} onPick={setPicked} />
    </section>
  );
}
