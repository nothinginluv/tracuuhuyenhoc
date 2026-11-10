/**
 * Chú thích thuật ngữ tại chỗ + chế độ hiển thị câu luận giải.
 *
 * · `GlossaryTerm` — bọc một từ chuyên môn; hover/bấm để xem nghĩa bằng tiếng Việt.
 *   Nghĩa lấy từ `content/glossary.json` (phần biên soạn, không phải trích dẫn).
 * · `useReadingMode` — "Dễ hiểu" (mặc định) hiện lời giảng không thuật ngữ;
 *   "Nguyên văn dịch" hiện bản dịch sát chữ của nguồn. Cả hai đều mở được câu Hán.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import glossaryRaw from '../../../content/glossary.json';
import type { Quote } from './quotes.tsx';

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

// ── Chế độ hiển thị ─────────────────────────────────────────
export type ReadingMode = 'plain' | 'literal';

type ReadingModeValue = { mode: ReadingMode; setMode: (m: ReadingMode) => void };

const ReadingModeContext = createContext<ReadingModeValue>({
  mode: 'plain',
  setMode: () => {},
});

const STORAGE_KEY = 'tracuuhuyenhoc:che-do-luan-giai';

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ReadingMode>(() => {
    if (typeof window === 'undefined') return 'plain';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'literal' ? 'literal' : 'plain';
  });

  const setMode = (m: ReadingMode) => {
    setModeState(m);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, m);
  };

  return (
    <ReadingModeContext.Provider value={{ mode, setMode }}>{children}</ReadingModeContext.Provider>
  );
}

export function useReadingMode(): ReadingModeValue {
  return useContext(ReadingModeContext);
}

/** Nút chuyển giữa "Dễ hiểu" và "Nguyên văn dịch". */
export function ReadingModeToggle({ label = 'Cách đọc' }: { label?: string }) {
  const { mode, setMode } = useReadingMode();
  return (
    <div className="reading-mode" role="group" aria-label={label}>
      <span className="reading-mode-label">{label}</span>
      <div className="segmented">
        <button
          type="button"
          aria-pressed={mode === 'plain'}
          onClick={() => setMode('plain')}
        >
          Dễ hiểu
        </button>
        <button
          type="button"
          aria-pressed={mode === 'literal'}
          onClick={() => setMode('literal')}
        >
          Sát nguyên văn
        </button>
      </div>
    </div>
  );
}

/** Câu hiển thị theo chế độ đang chọn. Luôn có câu sát chữ để tra cứu. */
export function quoteLine(quote: Quote | undefined, mode: ReadingMode): string | undefined {
  if (!quote) return undefined;
  return mode === 'plain'
    ? (quote.plain_vi ?? quote.claim_vi)
    : quote.claim_vi;
}
