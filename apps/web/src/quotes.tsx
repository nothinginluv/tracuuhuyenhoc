/**
 * Trích dẫn — hiển thị đúng câu chữ Hán đã qua cổng kiểm `scripts/verify-quotes.mjs`.
 *
 * Tệp này **chỉ chứa component**. Dữ liệu (`QUOTES`, `SOURCE_LABEL`, `SOURCE_LINK`,
 * `quoteSource`) nằm ở `quotes-data.ts` và được import trực tiếp từ đó — không
 * re-export ở đây, để Fast Refresh của Vite vẫn hot-swap được.
 */
import { quoteLine, useReadingMode } from './glossary.tsx';
import { QUOTES, SOURCE_LABEL, SOURCE_LINK, quoteSource } from './quotes-data.ts';

/** Một dòng "Nguồn" mở ra để đọc nguyên văn. */
export function Cite({ id }: { id: string }) {
  const { mode } = useReadingMode();
  const q = QUOTES[id];
  if (!q) return <span className="cite cite-missing">[{id}]</span>;
  return (
    <details className="cite">
      <summary>
        <span className="cite-mark">§</span>
        {quoteSource(id)}
      </summary>
      <div className="cite-body">
        <p className="cite-label">Nguyên văn gốc</p>
        <p className="cite-zh">{q.text_zh}</p>
        {q.short_vi && <p className="cite-short">{q.short_vi}</p>}
        <p className="cite-vi">{quoteLine(q, mode)}</p>
        {mode === 'plain' && q.plain_vi && (
          <p className="cite-literal">
            <span className="cite-label">Bản sát chữ</span> {q.claim_vi}
          </p>
        )}
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
