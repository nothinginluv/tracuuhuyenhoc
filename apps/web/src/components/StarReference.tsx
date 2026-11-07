import {
  ELEMENT_COLOR,
  HUA_REFS,
  PALACE_META,
  PALACE_REFS,
  STAR_REFS,
  type HuaRef,
  type PalaceRef,
  type StarRef,
} from '../stars.ts';
import { Cite } from '../quotes.tsx';

function MetaChip({ label, zh, tone }: { label: string; zh?: string; tone?: string }) {
  return (
    <span className={tone ? `meta-chip el-${tone}` : 'meta-chip'}>
      {label}
      {zh && <span className="zh"> {zh}</span>}
    </span>
  );
}

function CitedBlocks({ cited }: { cited: { role: string; quote: { id: string; claim_vi: string } }[] }) {
  return (
    <>
      {cited.map((c, i) => (
        <div className={i === 0 ? 'star-block' : 'star-block star-block-reading'} key={c.quote.id}>
          <span className="star-block-label">
            {c.role === 'definition'
              ? 'Định nghĩa'
              : i === 1
                ? 'Nguyên văn bàn thêm'
                : 'Nguyên văn bổ sung'}
          </span>
          <p>{c.quote.claim_vi}</p>
          <Cite id={c.quote.id} />
        </div>
      ))}
    </>
  );
}

function StarCard({ star }: { star: StarRef }) {
  return (
    <article className="star-card" id={`sao-${star.id}`}>
      <header className="star-card-head">
        <div className="star-card-name">
          <h3>{star.def.vi}</h3>
          <span className="zh">{star.def.zh}</span>
        </div>
        <span className={star.def.group === 'main' ? 'tag tag-main' : 'tag'}>
          {star.def.group === 'main' ? 'Chính tinh' : 'Phụ tinh'}
        </span>
      </header>

      <div className="star-meta">
        {star.elements.map((el) => (
          <MetaChip key={el.zh} label={el.vi} zh={el.zh} tone={ELEMENT_COLOR[el.zh]} />
        ))}
        {star.dou && <MetaChip label={star.dou.vi} zh={star.dou.zh} />}
        {(star.domains ?? []).map((d) => (
          <MetaChip key={d.zh} label={`chủ ${d.vi}`} zh={d.zh} />
        ))}
        {star.roles.map((r) => (
          <MetaChip key={r.zh} label={r.vi} zh={r.zh} />
        ))}
      </div>

      <CitedBlocks cited={star.cited} />
    </article>
  );
}

function HuaCard({ hua }: { hua: HuaRef }) {
  return (
    <article className="star-card hua-card" id={`hoa-${hua.id}`}>
      <header className="star-card-head">
        <div className="star-card-name">
          <h3>{hua.def.vi}</h3>
          <span className="zh">{hua.def.zh}</span>
        </div>
        <span className="tag">Biến thái</span>
      </header>

      <div className="star-meta">
        {hua.elements.map((el) => (
          <MetaChip key={el.zh} label={el.vi} zh={el.zh} tone={ELEMENT_COLOR[el.zh]} />
        ))}
        {hua.roles.map((r) => (
          <MetaChip key={r.zh} label={r.vi} zh={r.zh} />
        ))}
      </div>

      <CitedBlocks cited={hua.cited} />
    </article>
  );
}

function PalaceCard({ palace }: { palace: PalaceRef }) {
  return (
    <article className={`palace-card${palace.strength ? ` is-${palace.strength}` : ''}`}>
      <header className="palace-card-head">
        <span className="palace-order">{palace.index + 1}</span>
        <div className="star-card-name">
          <h3>{palace.vi}</h3>
          <span className="zh">{palace.zh}</span>
        </div>
        {palace.strength && (
          <span className={palace.strength === 'strong' ? 'tag tag-main' : 'tag'}>
            {palace.strength === 'strong' ? 'Cung mạnh' : 'Cung yếu'}
          </span>
        )}
      </header>

      {palace.scope ? (
        <div className="star-block">
          <p>{palace.scope.claim_vi}</p>
          <Cite id={palace.scope.id} />
        </div>
      ) : (
        <p className="palace-note">{palace.note_vi}</p>
      )}
    </article>
  );
}

export function StarReference({ onBack }: { onBack: () => void }) {
  const main = STAR_REFS.filter((s) => s.def.group === 'main');
  const aux = STAR_REFS.filter((s) => s.def.group !== 'main');

  return (
    <main className="method stars-page">
      <div className="method-head">
        <div className="eyebrow">Tầng B · Tinh diệu</div>
        <h1>Định nghĩa sao, nguyên văn.</h1>
        <p className="sub">
          {main.length} chính tinh, {aux.length} phụ tinh, 4 hoá và 12 cung — mỗi mục cắt từ{' '}
          <span className="zh">紫微斗數全書</span>. Ngũ hành, đẩu, cung chủ, vai trò đều là từ khoá
          xuất hiện trong chính câu trích; không có chữ nào do giao diện tự thêm.
        </p>
        <button type="button" className="link-btn" onClick={onBack}>
          ← Về trang tra cứu
        </button>
      </div>

      <h2 className="stars-subhead">Chính tinh</h2>
      <div className="stars-grid">
        {main.map((star) => (
          <StarCard key={star.id} star={star} />
        ))}
      </div>

      {aux.length > 0 && (
        <>
          <h2 className="stars-subhead">Phụ tinh</h2>
          <div className="stars-grid">
            {aux.map((star) => (
              <StarCard key={star.id} star={star} />
            ))}
          </div>
        </>
      )}

      <h2 className="stars-subhead">Tứ Hoá</h2>
      <p className="stars-lede">
        Bốn biến thái của sao theo can năm sinh. Tên gọi do can quyết định, không phải sao riêng.
      </p>
      <div className="stars-grid">
        {HUA_REFS.map((hua) => (
          <HuaCard key={hua.id} hua={hua} />
        ))}
      </div>

      <h2 className="stars-subhead">Mười hai cung</h2>
      <p className="stars-lede">
        Thứ tự cung theo nguyên văn <span className="zh">安十二宮例</span>. Cường nhược có bảng riêng
        cho mệnh nam và mệnh nữ; bảng nam được gắn nhãn trên từng cung.
      </p>
      {PALACE_META.order && <Cite id={PALACE_META.order.id} />}
      <div className="palace-grid">
        {PALACE_REFS.map((palace) => (
          <PalaceCard key={palace.id} palace={palace} />
        ))}
      </div>
      <div className="palace-strength">
        <h3>Cường nhược</h3>
        {PALACE_META.strength && (
          <>
            <p>{PALACE_META.strength.claim_vi}</p>
            <Cite id={PALACE_META.strength.id} />
          </>
        )}
        {PALACE_META.strengthFemale && (
          <>
            <p>{PALACE_META.strengthFemale.claim_vi}</p>
            <Cite id={PALACE_META.strengthFemale.id} />
          </>
        )}
      </div>

      <div className="stars-note card">
        <h2>Đọc thế nào cho đúng</h2>
        <p>
          Đây là <strong>định nghĩa cơ học</strong> — sao thuộc hành nào, thuộc đẩu nào, chủ cung
          nào, nguyên văn nói gì thêm. Không phải lời luận giải trọn vẹn: muốn luận phải xét cung
          vị, tam phương tứ chính, miếu vượng hãm và tổ hợp sao, những thứ nằm ngoài phạm vi phiên
          bản này.
        </p>
        <p className="tiny muted">
          Mục nào không có là vì corpus Tầng A chưa có câu định nghĩa tương ứng — chúng tôi không
          viết thay nguồn. Muốn bổ sung: thêm câu vào <code>content/quotes.jsonl</code>, chạy{' '}
          <code>npm run quotes:verify</code>, rồi khai báo trong <code>content/*.json</code>.
        </p>
      </div>
    </main>
  );
}
