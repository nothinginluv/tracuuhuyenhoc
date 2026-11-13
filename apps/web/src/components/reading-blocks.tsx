/**
 * Khối luận giải dùng chung cho tab Tử Vi và tab Bát Tự.
 *
 * Mỗi khối chỉ chứa: dữ liệu engine (cung, sao, tuổi, thần) + câu của nguồn + nút "§"
 * mở nguyên văn. Câu hiển thị phụ thuộc chế độ đọc (xem `glossary.tsx`):
 *   · Dễ hiểu      → `plain_vi`: lời giảng không thuật ngữ;
 *   · Sát nguyên văn → `claim_vi`: bản dịch giữ chữ của nguồn.
 * Không có câu nào do giao diện tự viết.
 */
import { BRANCHES_VI, STAR_DEFS, type Palace } from '../../../../packages/tuvi-engine/src/index.ts';
import { TEN_GODS, type TenGodId } from '../../../../packages/bazi-engine/src/index.ts';
import { Cite } from '../quotes.tsx';
import type { Quote } from '../quotes-data.ts';
import { GlossaryTerm, quoteLine, useReadingMode } from '../glossary.tsx';
import {
  DAHAN_QUOTES,
  starInPalaceData,
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

/** Một câu luận kèm nhãn nhỏ phía trên (nguồn nào, ở đâu). */
function ClaimBlock({ label, text, at }: { label?: string; text: string; at?: boolean }) {
  return (
    <p className={at ? 'reading-claim reading-claim-at' : 'reading-claim'}>
      {label && <span className="reading-claim-label">{label}</span>}
      {text}
    </p>
  );
}

/**
 * Một sao trong một cung.
 *
 * Thứ tự đọc: câu **theo cung** (卷二: "Tử Vi ở cung Phu Thê thì…") trước, rồi
 * câu **định nghĩa chung** của sao (卷一). Cung Mệnh không có câu theo cung —
 * câu định nghĩa chung của 卷一 vốn nói về người có sao ấy tại Mệnh, nên chỉ
 * hiện một câu và không dán nhãn "định nghĩa chung".
 */
function StarLine({
  item,
  palace,
  at,
  head,
}: {
  item: ReadingStar;
  palace: Palace;
  at?: Quote;
  head?: { zh: string; vi: string };
}) {
  const { mode } = useReadingMode();
  const quote = starQuote(item.ref);
  const line = quoteLine(quote, mode);
  const atLine = quoteLine(at, mode);
  const short = mode === 'plain' ? undefined : quote?.short_vi;
  const atLabel = head
    ? `Tại cung ${palace.nameVi} · câu chung cho ${head.vi}`
    : `Tại cung ${palace.nameVi}`;
  return (
    <li className="reading-star">
      <div className="reading-star-head">
        <strong>{item.star.vi}</strong>
        <BrightnessChip item={item} />
        {item.hua && <HuaChip hua={item.hua} />}
      </div>
      {at || quote ? (
        <>
          {!at && short && <p className="reading-claim reading-claim-short">{short}</p>}
          {at && atLine && <ClaimBlock label={atLabel} text={atLine} at />}
          {quote && line && (
            <ClaimBlock label={at ? 'Định nghĩa chung' : undefined} text={line} />
          )}
          <div className="cite-row">
            {at && <Cite id={at.id} />}
            {quote && <Cite id={quote.id} />}
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
  const atData = starInPalaceData(reading.palace);
  // Sách có mục riêng cho 14 chính tinh và 11 phụ tinh ở từng cung trừ cung
  // Mệnh; vài mục nguồn không chép (xem `missing`/`auxMissing` trong
  // content/star-in-palace.json). Chỉ báo khi sao ấy thật sự đóng tại cung này
  // — nếu không thì là nhiễu.
  const mainIds = new Set<string>(main.map((s) => s.star.id));
  const notWritten = atData.missing
    .filter((id) => mainIds.has(id))
    .map((id) => (STAR_DEFS as Record<string, { vi: string } | undefined>)[id]?.vi)
    .filter((vi): vi is string => Boolean(vi));
  const auxIds = new Set<string>(aux.map((s) => s.star.id));
  const auxNotWritten = atData.auxMissing
    .filter((id) => auxIds.has(id))
    .map((id) => (STAR_DEFS as Record<string, { vi: string } | undefined>)[id]?.vi)
    .filter((vi): vi is string => Boolean(vi));

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
                  <StarLine
                    key={s.star.id}
                    item={s}
                    palace={reading.palace}
                    at={atData.quote(s.star.id)}
                    head={atData.head(s.star.id)}
                  />
                ))}
              </ul>
              {notWritten.length > 0 && (
                <p className="tiny muted">
                  Sách không chép mục riêng cho {notWritten.join(', ')} tại cung{' '}
                  {reading.palace.nameVi} — câu hiện có là định nghĩa chung của sao.
                </p>
              )}
            </>
          )}

          {aux.length > 0 && (
            <>
              <H>Phụ tinh</H>
              <ul className="reading-stars reading-stars-aux">
                {aux.map((s) => (
                  <StarLine
                    key={s.star.id}
                    item={s}
                    palace={reading.palace}
                    at={atData.quote(s.star.id)}
                    head={atData.head(s.star.id)}
                  />
                ))}
              </ul>
              <p className="tiny muted">
                Sách chép mục riêng theo cung cho 11 phụ tinh — Thiên Khôi, Thiên Việt chỉ có ở
                cung Phu Thê. Sao còn lại dùng câu định nghĩa chung.
              </p>
              {auxNotWritten.length > 0 && (
                <p className="tiny muted">
                  Sách không chép mục riêng cho {auxNotWritten.join(', ')} tại cung{' '}
                  {reading.palace.nameVi} — câu hiện có là định nghĩa chung của sao.
                </p>
              )}
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
