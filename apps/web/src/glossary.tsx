/**
 * Chú thích thuật ngữ tại chỗ và câu đọc lấy từ nguồn đã kiểm.
 *
 * · `GlossaryTerm` — bọc một từ chuyên môn; rê chuột hoặc bấm để xem nghĩa
 *   tiếng Việt (nghĩa lấy từ `content/glossary.json`, phần biên soạn).
 * · `quoteLine` — câu hiển thị: ưu tiên lời giảng không thuật ngữ (`plain_vi`),
 *   chỉ khi kho chưa có mới dùng bản dịch sát chữ (`claim_vi`).
 */
import type { ReactNode } from 'react';
import glossaryRaw from '../../../content/glossary.json';
import type { Quote } from './quotes-data.ts';

const GLOSSARY = (glossaryRaw as { terms: Record<string, string> }).terms;

export function glossaryOf(term: string): string | undefined {
  return GLOSSARY[term.toLowerCase()];
}

/** Từ chuyên môn có trong bảng tra — dùng để bọc chú thích. */
export function GlossaryTerm({ children, term }: { children?: ReactNode; term: string }) {
  const text = term.toLowerCase();
  const def = GLOSSARY[text];
  if (!def) return <>{children ?? term}</>;
  return (
    <span className="term" tabIndex={0} title={def} aria-label={`${children ?? term}: ${def}`}>
      {children ?? term}
      <span className="term-def" role="tooltip">
        {def}
      </span>
    </span>
  );
}

/** Câu hiển thị của một trích dẫn. */
export function quoteLine(quote: Quote | undefined): string | undefined {
  if (!quote) return undefined;
  return quote.plain_vi ?? quote.claim_vi;
}
