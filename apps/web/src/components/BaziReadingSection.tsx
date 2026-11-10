import type { BaziChart } from '../../../../packages/bazi-engine/src/index.ts';
import { TEN_GODS } from '../../../../packages/bazi-engine/src/index.ts';
import { buildBaziReading, luckTenGod } from '../reading.ts';
import { GlossaryTerm } from '../glossary.tsx';
import { DayMasterBlock } from './reading-blocks.tsx';

const ELEMENTS = [
  ['moc', 'Mộc'],
  ['hoa', 'Hoả'],
  ['tho', 'Thổ'],
  ['kim', 'Kim'],
  ['thuy', 'Thuỷ'],
] as const;

/** Phần luận giải nằm ngay trong tab Bát Tự: nhật chủ, thập thần, đại vận. */
export function BaziReadingSection({ chart }: { chart: BaziChart }) {
  const reading = buildBaziReading(chart);

  return (
    <div className="reading-phase" aria-labelledby="bazi-reading-title">
      <div className="reading-phase-head">
        <p className="eyebrow">Luận giải</p>
        <h3 id="bazi-reading-title">Nhật chủ, thập thần và các vận</h3>
        <p className="muted">
          Đọc theo thứ tự: can ngày nói về bạn là người thế nào; các thần đi kèm nói về cách bạn
          làm việc và cách tiền bạc, công việc đến; mỗi vận 10 năm đổi một lần. Từ còn lạ thì rê
          chuột hoặc bấm để xem nghĩa.
        </p>
      </div>

      <DayMasterBlock reading={reading} />

      <div className="mini-card">
        <h3>Các vận 10 năm</h3>
        <div className="luck-scroll">
          <table className="luck-table">
            <thead>
              <tr>
                <th>Vận</th>
                <th>Can chi</th>
                <th>Thần đi kèm</th>
                <th>Tuổi</th>
              </tr>
            </thead>
            <tbody>
              {chart.luck.map((l) => (
                <tr key={l.index}>
                  <td className="muted">{l.index}</td>
                  <td>{l.pillar.vi}</td>
                  <td>
                    <GlossaryTerm term="thập thần">
                      {TEN_GODS[luckTenGod(chart, l.pillar.stem)].vi}
                    </GlossaryTerm>
                  </td>
                  <td>
                    {l.fromAge.toFixed(1)}–{l.toAge.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted">
          Thần đi kèm của can vận tính với can ngày. Tuổi là số năm kể từ lúc sinh, không phải
          tuổi mụ.
        </p>
      </div>

      <div className="mini-card">
        <h3>Đếm ngũ hành</h3>
        <table className="luck-table reading-elements">
          <thead>
            <tr>
              <th>Hành</th>
              <th>8 chữ nổi</th>
              <th>
                <GlossaryTerm term="tàng can">Tàng can</GlossaryTerm>
              </th>
            </tr>
          </thead>
          <tbody>
            {ELEMENTS.map(([key, label]) => (
              <tr key={key}>
                <td>{label}</td>
                <td>{chart.elementCounts[key]}</td>
                <td>{chart.hiddenElementCounts[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tiny muted">
          Bảng này chỉ <strong>đếm số lần xuất hiện</strong>, chưa nói bạn mạnh hay yếu.{' '}
          <GlossaryTerm term="vượng suy">Vượng suy</GlossaryTerm> phải xét tháng lệnh và cách các
          hành phối hợp — nguồn hiện có chưa đủ để kết luận minh bạch.
        </p>
      </div>
    </div>
  );
}
