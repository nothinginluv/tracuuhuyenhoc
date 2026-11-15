/**
 * Khối luận giải dùng chung cho tab Tử Vi và tab Bát Tự.
 *
 * Nguyên tắc: giao diện **không tự viết câu luận nào**. Mỗi câu hiện ra là một
 * đoạn nguyên văn của câu đã kiểm trong `content/quotes.jsonl`; chỗ sách im
 * lặng thì ghi rõ là im lặng.
 *
 * Bản gọn: mỗi cung chỉ còn sao chính và câu của sao ấy tại cung. Sao phụ, độ
 * sáng, tứ hoá, tam hợp và khối nguồn không hiện ở đây.
 */
import { TEN_GODS } from '../../../../packages/bazi-engine/src/index.ts';
import type { Quote } from '../quotes-data.ts';
import { quoteLine } from '../glossary.tsx';
import {
  starPalaceLine,
  type BaziReading,
  type PalaceReading,
  type TuViReading,
} from '../reading.ts';

/**
 * Nội dung một cung: tên cung, can chi, đại hạn, rồi từng sao chính kèm câu
 * của sách cho sao ấy tại cung này.
 */
export function PalaceReadingView({ reading }: { reading: PalaceReading }) {
  const main = reading.stars.filter((s) => s.star.group === 'main');

  return (
    <div className="palace-read">
      {main.length === 0 ? (
        <p className="muted">
          Cung này không có sao chính. Sách luận theo sao, nên mục này không có câu riêng.
        </p>
      ) : (
        <ul className="palace-lines">
          {main.map((item) => {
            const line = starPalaceLine(item, reading);
            return (
              <li key={item.star.id}>
                <span className="star-name">{item.star.vi}</span>
                {line ? (
                  <span>{line}</span>
                ) : (
                  <span className="muted">Sách chưa chép câu cho sao này tại cung này.</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Đại hạn: mỗi cung mười năm, kèm cung ứng với năm nay. */
export function DaHanSection({ reading }: { reading: TuViReading }) {
  const { chart, dahan } = reading;
  const year = new Date().getFullYear();
  const branch = (((year - 4) % 12) + 12) % 12;
  const nowPalace = chart.palaces[branch]!;

  return (
    <section className="dahan" aria-labelledby="dahan-title">
      <h3 id="dahan-title">Đại hạn</h3>
      <p className="muted">
        Mười năm một cung, đi {dahan.direction === 'thuan' ? 'thuận' : 'nghịch'} từ cung{' '}
        {chart.palaces[dahan.startBranch]!.nameVi}, tuổi khởi {dahan.startAge}. Năm {year} ứng
        cung {nowPalace.nameVi}.
      </p>
      <div className="table-scroll">
        <table className="table-plain">
          <thead>
            <tr>
              <th>Tuổi</th>
              <th>Cung</th>
              <th>Sao chính</th>
            </tr>
          </thead>
          <tbody>
            {dahan.steps.map((s) => {
              const p = chart.palaces[s.branch]!;
              return (
                <tr key={s.index} className={p.isSoul ? 'is-soul' : ''}>
                  <td>{s.fromAge}–{s.toAge}</td>
                  <td>
                    {s.palaceVi}
                    {p.isBody ? ' · Thân' : ''}
                  </td>
                  <td>{p.mainStars.map((x) => x.vi).join(', ') || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GodLine({ quote, name }: { quote?: Quote; name: string }) {
  const line = quoteLine(quote);
  return (
    <li>
      <strong>{name}</strong>
      {line ? <span> — {line}</span> : <span className="muted"> — sách chưa có câu riêng.</span>}
    </li>
  );
}

/**
 * Nhật chủ và thập thần. Chỉ hiện những thần có mặt ngay trên bốn can; thần
 * chỉ nằm trong tàng can không đưa vào đây để mục đọc không dài.
 */
export function DayMasterBlock({ reading }: { reading: BaziReading }) {
  const { chart } = reading;
  const line = quoteLine(reading.dayMasterQuote);
  const visible = reading.gods.filter((g) => g.places.some((p) => !p.includes('tàng')));

  return (
    <section className="bazi-read" aria-labelledby="bazi-read-title">
      <h3 id="bazi-read-title">
        Nhật chủ {chart.dayMaster.vi} · {chart.dayMaster.elementVi}
      </h3>
      {line ? (
        <p className="reading-line">{line}</p>
      ) : (
        <p className="muted">Sách chưa chép câu cho can ngày này.</p>
      )}

      <h4>Thập thần trên bốn can</h4>
      {visible.length === 0 ? (
        <p className="muted">Không có thần nào ngoài nhật chủ.</p>
      ) : (
        <ul className="god-lines">
          {visible.map((g) => (
            <GodLine key={g.id} name={TEN_GODS[g.id].vi} quote={g.quote} />
          ))}
        </ul>
      )}
    </section>
  );
}
