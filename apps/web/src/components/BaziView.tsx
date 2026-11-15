/**
 * Lá số Bát Tự gọn: bốn trụ (can, chi, thần) rồi phần đọc nhật chủ — thập thần
 * — đại vận. Tàng can, bảng đếm ngũ hành và các ghi chú kỹ thuật không hiện ở
 * đây; phần ấy nằm trong tab Cách tính.
 */
import {
  PILLAR_NAMES,
  type BaziChart,
} from '../../../../packages/bazi-engine/src/index.ts';
import { ELEMENT_CLASS } from '../format.ts';
import { BaziReadingSection } from './BaziReadingSection.tsx';

export function BaziView({ chart }: { chart: BaziChart }) {
  return (
    <section className="bazi">
      <div className="chart-head">
        <h2>Lá số Bát Tự</h2>
        <p className="muted">
          Tứ trụ lấy theo tiết khí · nhật chủ {chart.dayMaster.vi} {chart.dayMaster.elementVi}
        </p>
      </div>

      <div className="pillars">
        {chart.stems.map((stem) => {
          const branch = chart.branches.find((b) => b.pillar === stem.pillar)!;
          return (
            <div className="pillar" key={stem.pillar}>
              <p className="pillar-label">{PILLAR_NAMES[stem.pillar].vi}</p>
              <p className="ten-god">
                {stem.pillar === 'day' ? 'Nhật chủ' : stem.tenGod?.vi ?? '—'}
              </p>
              <p className="pillar-chars">
                <span className={ELEMENT_CLASS[stem.element]}>{stem.vi}</span>
                <span className={ELEMENT_CLASS[branch.element]}>{branch.vi}</span>
              </p>
            </div>
          );
        })}
      </div>

      <BaziReadingSection chart={chart} />
    </section>
  );
}
