/**
 * Tầng B — định nghĩa tinh diệu, tứ hoá, mười hai cung.
 *
 * Dữ liệu nằm ở `content/*.json`; mỗi mục đều trỏ tới `quote_id` trong
 * `content/quotes.jsonl`. `scripts/verify-content.mjs` kiểm rằng mọi từ khoá
 * hiển thị (ngũ hành, đẩu, cung chủ, vai trò) đều nằm nguyên văn trong câu
 * trích tương ứng — giao diện không được tự thêm chữ nào.
 */
import raw from '../../../content/stars.json';
import huaRaw from '../../../content/hua.json';
import palaceRaw from '../../../content/palaces.json';
import {
  HUA,
  STAR_DEFS,
  type HuaKey,
  type StarDef,
} from '../../../packages/tuvi-engine/src/index.ts';
import { QUOTES, type Quote } from './quotes.tsx';

export type Label = { zh: string; vi: string };
export type StarQuoteRole = 'definition' | 'reading';

type QuoteRef = { quote_id: string; role: StarQuoteRole };
type Content = {
  elements: Label[];
  roles: Label[];
  quotes: QuoteRef[];
  dou?: Label | null;
  domains?: Label[];
};

export type Cited = { role: StarQuoteRole; quote: Quote };

function cite(quotes: QuoteRef[]): Cited[] {
  return quotes
    .map((ref) => ({ role: ref.role, quote: QUOTES[ref.quote_id] as Quote | undefined }))
    .filter((x): x is Cited => Boolean(x.quote));
}

// ── Tinh diệu ────────────────────────────────────────────────
type StarContent = Content & { id: string };
export type StarRef = StarContent & {
  def: StarDef;
  cited: Cited[];
};

const STAR_DATA = raw as { stars: StarContent[] };

export const STAR_REFS: StarRef[] = STAR_DATA.stars
  .map((content) => {
    const def = STAR_DEFS[content.id as keyof typeof STAR_DEFS] as StarDef | undefined;
    if (!def) return null;
    return { ...content, def, cited: cite(content.quotes) };
  })
  .filter((x): x is StarRef => x !== null);

const BY_ID = new Map(STAR_REFS.map((s) => [s.id, s]));

export function starRef(id: string): StarRef | undefined {
  return BY_ID.get(id);
}

// ── Tứ Hoá ───────────────────────────────────────────────────
type HuaContent = Content & { id: HuaKey };
export type HuaRef = HuaContent & {
  def: { zh: string; vi: string };
  cited: Cited[];
};

const HUA_DATA = huaRaw as { entries: HuaContent[] };

export const HUA_REFS: HuaRef[] = HUA_DATA.entries
  .filter((entry) => Boolean(HUA[entry.id]))
  .map((entry) => ({
    ...entry,
    def: HUA[entry.id],
    cited: cite(entry.quotes),
  }));

// ── Mười hai cung ────────────────────────────────────────────
type PalaceContent = {
  id: string;
  zh: string;
  vi: string;
  scope_quote?: string;
  note_vi?: string;
};

type PalaceDoc = {
  order_quote: string;
  strength_quote: string;
  strength_female_quote: string;
  strong: string[];
  weak: string[];
  palaces: PalaceContent[];
};

const PALACE_DATA = palaceRaw as PalaceDoc;
const STRONG = new Set(PALACE_DATA.strong);
const WEAK = new Set(PALACE_DATA.weak);

export type PalaceRef = PalaceContent & {
  index: number;
  scope?: Quote;
  strength: 'strong' | 'weak' | null;
};

export const PALACE_REFS: PalaceRef[] = PALACE_DATA.palaces.map((p, index) => ({
  ...p,
  index,
  scope: p.scope_quote ? (QUOTES[p.scope_quote] as Quote | undefined) : undefined,
  strength: STRONG.has(p.zh) ? 'strong' : WEAK.has(p.zh) ? 'weak' : null,
}));

export const PALACE_META = {
  order: QUOTES[PALACE_DATA.order_quote] as Quote | undefined,
  strength: QUOTES[PALACE_DATA.strength_quote] as Quote | undefined,
  strengthFemale: QUOTES[PALACE_DATA.strength_female_quote] as Quote | undefined,
  strong: PALACE_DATA.strong,
  weak: PALACE_DATA.weak,
};

export const ELEMENT_COLOR: Record<string, string> = {
  木: 'moc',
  火: 'hoa',
  土: 'tho',
  金: 'kim',
  水: 'thuy',
};
