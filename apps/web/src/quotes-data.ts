/**
 * Dữ liệu trích dẫn — tách khỏi `quotes.tsx` để Fast Refresh của Vite không phải
 * tải lại cả trang mỗi khi sửa tệp này (một tệp vừa export hằng số, vừa export
 * component thì HMR không phân giải được).
 *
 * Không có câu nào do giao diện tự viết ra. Muốn thêm trích dẫn: thêm vào
 * `content/quotes.jsonl`, chạy `npm run quotes:verify`, rồi mới dùng id ở đây.
 *
 * Mỗi câu có ba bản cùng một nguồn: `claim_vi` (sát chữ), `short_vi` (một dòng),
 * `plain_vi` (lời giảng không thuật ngữ).
 */
import raw from '../../../content/quotes.jsonl?raw';
import { locatorVi } from './locator.ts';

export type Quote = {
  id: string;
  source: string;
  text_zh: string;
  claim_vi: string;
  /** Một dòng tóm ý (nếu có). */
  short_vi?: string;
  /** Lời giảng không thuật ngữ (nếu có) — dùng cho chế độ "Dễ hiểu". */
  plain_vi?: string;
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



