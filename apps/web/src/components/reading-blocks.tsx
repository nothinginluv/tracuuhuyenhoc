/**
 * Khối luận giải dùng chung cho tab Tử Vi và tab Bát Tự.
 *
 * Mỗi khối chỉ chứa: dữ liệu engine (cung, sao, tuổi, thần) + câu của nguồn + nút "§"
 * mở nguyên văn. Câu hiển thị phụ thuộc chế độ đọc (xem `glossary.tsx`):
 *   · Dễ hiểu      → `plain_vi`: lời giảng không thuật ngữ;
 *   · Sát nguyên văn → `claim_vi`: bản dịch giữ chữ của nguồn.
 * Không có câu nào do giao diện tự viết.
 */
import { BRANCHES_VI } from '../../../../packages/tuvi-engine/src/index.ts';
import { TEN_GODS, type TenGodId } from '../../../../packages/bazi-engine/src/index.ts';
import { Cite } from '../quotes.tsx';
import type { Quote } from '../quotes-data.ts';
import { GlossaryTerm, quoteLine, useReadingMode } from '../glossary.tsx';
import {
  DAHAN_QUOTES,
  starQuote,
  type BaziReading,
  type PalaceReading,
  type ReadingStar,
  type TuViReading,
} from '../reading.ts';

export function HuaChip({ hua }: { hua: NonNullable<ReadingStar['hua']> }) {
  return (
    <span className={`hua hua-${hua.id}`} title={`${hua.def.zh} — ${hua.def.vi}`}>
      {hua.def.vi.replace('Hoá ', '')}
    </span>
  );
}

export function BrightnessChip({ item }: { item: ReadingStar }) {
  const b = item.brightness;
  if (!b) return <span className="chip chip-thieu">chưa có bảng độ sáng</span>;
  if (b.level) {
    return (
      <span className={`chip chip-${b.level.tone}`}>
        <GlossaryTerm term={b.level.vi}>{b.level.vi}</GlossaryTerm>
      </span>
    );
  }
  if (b.noFall) {
    return (
      <span className="chip chip-sang" title="Nguồn ghi cả bảng không có cung hãm: sao này không xuống mức yếu nhất ở đâu cả.">
        Không hãm
      </span>
    );
  }
  return <span className="chip chip-thieu">nguồn không chép cung này</span>;
}

function StarLine({ item }: { item: ReadingStar }) {
  const { mode } = useReadingMode();
  const quote = starQuote(item.ref);
  const line = quoteLine(quote, mode);
  const short = mode === 'plain' ? undefined : quote?.short_vi;
  return (
    <li className="reading-star">
      <div className="reading-star-head">
        <strong>{item.star.vi}</strong>
        <BrightnessChip item={item} />
        {item.hua && <HuaChip hua={item.hua} />}
      </div>
      {quote ? (
        <>
          {short && <p className="reading-claim reading-claim-short">{short}</p>}
          <p className="reading-claim">{line}</p>
          <div className="cite-row">
            <Cite id={quote.id} />
            {item.brightness?.quote && <Cite id={item.brightness.quote.id} />}
            {item.hua?.cited[0] && <Cite id={item.hua.cited[0].quote.id} />}
          </div>
        </>
      ) : (
        <p className="tiny muted">
          Kho văn bản chưa có câu định nghĩa cho sao này — không suy diễn thay.
        </p>
      )}
    </li>
  );
}

/** Câu "ở cung này thì thuận/trắc trở" lấy từ kho quy tắc theo cung. */
function PalaceRule({ quote, tone }: { quote?: Quote; tone: 'good' | 'bad' }) {
  const { mode } = useReadingMode();
  if (!quote) return null;
  const line = quoteLine(quote, mode);
  return (
    <div className={`palace-rule palace-rule-${tone}`}>
      <div className="palace-rule-head">
        <span className="palace-rule-tag">{tone === 'good' ? 'Thuận' : 'Trắc trở'}</span>
        <span className="tiny muted">
          theo sách: sao nào ở cung này thì {tone === 'good' ? 'dễ thông' : 'dễ vướng'}
        </span>
      </div>
      <p className="reading-claim">{line}</p>
      <div className="cite-row">
        <Cite id={quote.id} />
      </div>
    </div>
  );
}

/**
 * Toàn bộ nội dung một cung: câu "thuận / trắc trở", chính tinh, phụ tinh
 * (kèm độ sáng và tứ hoá) và tam hợp — đối cung.
 *
 * Dùng chung cho khung đọc trong trang luận giải và cho bảng trượt mở từ lá
 * số, để hai chỗ không bao giờ lệch nội dung. `headingLevel` chỉ đổi cấp tiêu
 * đề con cho khớp cấp của khung chứa (khung đọc đã có tiêu đề cung riêng).
 */
export function PalaceDetail({
  reading,
  rules,
  headingLevel = 4,
}: {
  reading: PalaceReading;
  rules?: { good?: Quote; bad?: Quote };
  headingLevel?: 4 | 5;
}) {
  const { stars, triads } = reading;
  const H = headingLevel === 5 ? 'h5' : 'h4';
  const main = stars.filter((s) => s.star.group === 'main');
  const aux = stars.filter((s) => s.star.group === 'aux');

  return (
    <>
      {rules && (
        <div className="palace-rules">
          <PalaceRule quote={rules.good} tone="good" />
          <PalaceRule quote={rules.bad} tone="bad" />
        </div>
      )}

      {stars.length === 0 ? (
        <p className="muted">Cung này không có sao nào trong 38 sao engine an được.</p>
      ) : (
        <>
          {main.length === 0 ? (
            <>
              <H>Chính tinh</H>
              <p className="muted">
                Không có chính tinh tại cung. Các sao ở tam hợp và đối cung dưới đây là phần bổ
                trợ — nguồn không nói riêng về trường hợp vô chính tinh tại đây.
              </p>
            </>
          ) : (
            <>
              <H>Chính tinh</H>
              <ul className="reading-stars">
                {main.map((s) => (
                  <StarLine key={s.star.id} item={s} />
                ))}
              </ul>
            </>
          )}

          {aux.length > 0 && (
            <>
              <H>Phụ tinh</H>
              <ul className="reading-stars reading-stars-aux">
                {aux.map((s) => (
                  <StarLine key={s.star.id} item={s} />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <H>
        <GlossaryTerm term="tam phương tứ chính">Tam hợp · đối cung</GlossaryTerm>
      </H>
      <ul className="reading-triads">
        {triads.map((p, i) => {
          const label = ['Tam hợp', 'Đối cung', 'Tam hợp'][i];
          const names = p.mainStars.map((s) => s.vi).join(', ') || 'không có chính tinh';
          return (
            <li key={p.branch}>
              <span className="muted">{label}</span> {p.nameVi} ({BRANCHES_VI[p.branch]}) —{' '}
              {names}
            </li>
          );
        })}
      </ul>
      <p className="tiny muted">
        Ba cung hợp chiếu và cung đối được liệt kê theo cấu trúc; câu luận về cách cục cụ thể
        chưa có trong kho văn bản nên không thêm nhận định.
      </p>
    </>
  );
}

export type PalaceRules = Map<number, { good?: Quote; bad?: Quote }>;

export function DaHanSection({ reading }: { reading: TuViReading }) {
  const { mode } = useReadingMode();
  const { chart, dahan } = reading;
  return (
    <div className="mini-card reading-dahan">
      <h3>Đại hạn — mười năm một cung</h3>
      <p className="muted">
        Chiều {dahan.direction === 'thuan' ? 'thuận' : 'nghịch'} · khởi từ cung{' '}
        {chart.palaces[dahan.startBranch]!.nameVi} · tuổi khởi {dahan.startAge}. Mỗi hạn 10 năm,
        đủ 12 cung.
      </p>
      <div className="luck-scroll">
        <table className="luck-table reading-dahan-table">
          <thead>
            <tr>
              <th>Hạn</th>
              <th>Tuổi</th>
              <th>Cung</th>
              <th>Chi</th>
              <th>Chính tinh</th>
            </tr>
          </thead>
          <tbody>
            {dahan.steps.map((s) => {
              const p = chart.palaces[s.branch]!;
              return (
                <tr key={s.index} className={p.isSoul ? 'is-soul' : ''}>
                  <td className="muted">{s.index}</td>
                  <td>
                    {s.fromAge}–{s.toAge}
                  </td>
                  <td>{s.palaceVi}</td>
                  <td>{s.branchVi}</td>
                  <td>{p.mainStars.map((x) => x.vi).join(', ') || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sources">
        <h4>Quy tắc &amp; cách đọc mười năm</h4>
        <div className="cite-row">
          {DAHAN_QUOTES.direction && <Cite id={DAHAN_QUOTES.direction.id} />}
          {DAHAN_QUOTES.startAge(dahan.startAge) && (
            <Cite id={DAHAN_QUOTES.startAge(dahan.startAge)!.id} />
          )}
          {DAHAN_QUOTES.tenYear && <Cite id={DAHAN_QUOTES.tenYear.id} />}
        </div>
        {DAHAN_QUOTES.tenYear && (
          <p className="reading-claim">{quoteLine(DAHAN_QUOTES.tenYear, mode)}</p>
        )}
        <p className="tiny muted">
          Tuổi ghi đúng như con số trong sách (khởi từ số của{' '}
          <GlossaryTerm term="cục">ngũ hành cục</GlossaryTerm>), không phải tuổi dương lịch. Đại
          hạn nói về cung nào, không phải lời dự báo từng năm; lưu niên chưa có trong bản này.
        </p>
      </div>
    </div>
  );
}

function GodItem({
  id,
  quote,
  places,
}: {
  id: TenGodId;
  quote?: Quote;
  places: string[];
}) {
  const { mode } = useReadingMode();
  return (
    <li className="reading-god">
      <div className="reading-star-head">
        <strong>{TEN_GODS[id].vi}</strong>
        <span className="tiny muted">{places.join(' · ')}</span>
      </div>
      {quote ? (
        <>
          {quote.short_vi && <p className="reading-claim reading-claim-short">{quote.short_vi}</p>}
          <p className="reading-claim">{quoteLine(quote, mode)}</p>
          <div className="cite-row">
            <Cite id={quote.id} />
          </div>
        </>
      ) : (
        <p className="tiny muted">Kho văn bản chưa có định nghĩa riêng cho thần này.</p>
      )}
    </li>
  );
}

export function DayMasterBlock({ reading }: { reading: BaziReading }) {
  const { mode } = useReadingMode();
  const { chart } = reading;
  const line = quoteLine(reading.dayMasterQuote, mode);
  return (
    <>
      <div className="mini-card reading-daymaster">
        <h3>Bản tính nhật chủ</h3>
        <p className="reading-daymaster-char">
          {chart.dayMaster.vi} · {chart.dayMaster.elementVi} ·{' '}
          {chart.dayMaster.yinYang === 'duong' ? 'Dương' : 'Âm'}
        </p>
        {reading.dayMasterQuote && (
          <>
            {reading.dayMasterQuote.short_vi && mode === 'plain' && (
              <p className="reading-claim reading-claim-short">
                {reading.dayMasterQuote.short_vi}
              </p>
            )}
            <p className="reading-claim">{line}</p>
            <div className="cite-row">
              <Cite id={reading.dayMasterQuote.id} />
            </div>
          </>
        )}
        <p className="tiny muted">
          Đây là mô tả bản tính của can ngày, không phải lời phán về tính cách hay số phận.
        </p>
      </div>

      <div className="mini-card">
        <h3>
          <GlossaryTerm term="thập thần">Thập thần</GlossaryTerm> trong lá số
        </h3>
        {reading.gods.length === 0 ? (
          <p className="muted">Không có thập thần nào ngoài nhật chủ.</p>
        ) : (
          <ul className="reading-stars reading-gods">
            {reading.gods.map((g) => (
              <GodItem key={g.id} id={g.id} quote={g.quote} places={g.places} />
            ))}
          </ul>
        )}
        {reading.missingGods.length > 0 && (
          <p className="tiny muted">
            Kho văn bản chưa có định nghĩa riêng cho:{' '}
            {reading.missingGods.map((id) => TEN_GODS[id].vi).join(', ')}. Các thần này vẫn hiện
            tên khi xuất hiện, nhưng không kèm câu luận.
          </p>
        )}
      </div>
    </>
  );
}
