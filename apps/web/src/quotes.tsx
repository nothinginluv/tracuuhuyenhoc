/**
 * Trích dẫn — hiển thị đúng câu chữ Hán đã qua cổng kiểm `scripts/verify-quotes.mjs`.
 *
 * Không có câu nào do giao diện tự viết ra. Muốn thêm trích dẫn: thêm vào
 * `content/quotes.jsonl`, chạy `npm run quotes:verify`, rồi mới dùng id ở đây.
 */
import raw from '../../../content/quotes.jsonl?raw';
import { locatorVi } from './locator.ts';

export { locatorVi };

export type Quote = {
  id: string;
  source: string;
  text_zh: string;
  claim_vi: string;
  locator: string;
};

export const QUOTES: Record<string, Quote> = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const q = JSON.parse(line) as Quote;
      return [q.id, q];
    }),
);

export const SOURCE_LABEL: Record<string, string> = {
  'ziwei-quanshu': 'Tử Vi Đẩu Số Toàn Thư',
  'sanming-tonghui': 'Tam Mệnh Thông Hội',
  'yuanhai-ziping': 'Uyên Hải Tử Bình',
};

export const SOURCE_LINK: Record<string, string> = {
  'ziwei-quanshu': 'https://zh.wikisource.org/wiki/紫微斗數全書',
  'sanming-tonghui': 'https://zh.wikisource.org/wiki/三命通會_(四庫全書本)',
  'yuanhai-ziping': 'https://zh.wikisource.org/wiki/淵海子平',
};

export function quoteSource(id: string): string {
  const q = QUOTES[id];
  if (!q) return 'Nguồn chưa xác minh';
  const label = SOURCE_LABEL[q.source] ?? q.source;
  return `${label} · ${locatorVi(q.locator)}`;
}

/** Một dòng "Nguồn" mở ra để đọc nguyên văn. */
export function Cite({ id }: { id: string }) {
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
        <p className="cite-vi">{q.claim_vi}</p>
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
