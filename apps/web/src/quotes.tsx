/**
 * Trích dẫn — hiển thị đúng câu chữ Hán đã qua cổng kiểm `scripts/verify-quotes.mjs`.
 *
 * Chỉ dùng ở trang "Nguồn & phương pháp" và tab Cách tính; trang đọc lá số
 * không hiện khối nguồn để không rối mắt.
 */
import { quoteLine } from './glossary.tsx';
import { QUOTES, SOURCE_LABEL, SOURCE_LINK, quoteSource } from './quotes-data.ts';

/** Một dòng "Nguồn" mở ra để đọc nguyên văn. */
export function Cite({ id }: { id: string }) {
  const q = QUOTES[id];
  if (!q) return <span className="cite cite-missing">[{id}]</span>;
  const line = quoteLine(q);
  return (
    <details className="cite">
      <summary>
        <span className="cite-mark">§</span>
        {quoteSource(id)}
      </summary>
      <div className="cite-body">
        <p className="cite-zh">{q.text_zh}</p>
        <p className="cite-vi">{line}</p>
        {q.plain_vi && <p className="cite-literal">Bản sát chữ: {q.claim_vi}</p>}
        <p className="cite-meta">
          <a href={SOURCE_LINK[q.source]} target="_blank" rel="noreferrer noopener">
            {SOURCE_LABEL[q.source] ?? q.source} trên Wikisource
          </a>
          <span> · mã {q.id}</span>
        </p>
      </div>
    </details>
  );
}
