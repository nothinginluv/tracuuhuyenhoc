/** Phần đọc Bát Tự: nhật chủ, thập thần trên bốn can và đại vận. */
import { TEN_GODS, type BaziChart } from '../../../../packages/bazi-engine/src/index.ts';
import { buildBaziReading, luckTenGod } from '../reading.ts';
import { DayMasterBlock } from './reading-blocks.tsx';

export function BaziReadingSection({ chart }: { chart: BaziChart }) {
  const reading = buildBaziReading(chart);

  return (
    <div className="bazi-reading">
      <DayMasterBlock reading={reading} />

      <section className="bazi-luck" aria-labelledby="bazi-luck-title">
        <h3 id="bazi-luck-title">Đại vận</h3>
        <p className="muted">Mười năm một vận; thần là quan hệ của can vận với can ngày.</p>
        <div className="table-scroll">
          <table className="table-plain">
            <thead>
              <tr>
                <th>Tuổi</th>
                <th>Can chi</th>
                <th>Thần</th>
              </tr>
            </thead>
            <tbody>
              {chart.luck.map((l) => (
                <tr key={l.index}>
                  <td>
                    {l.fromAge.toFixed(0)}–{l.toAge.toFixed(0)}
                  </td>
                  <td>{l.pillar.vi}</td>
                  <td>{TEN_GODS[luckTenGod(chart, l.pillar.stem)].vi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
