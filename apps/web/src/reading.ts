/**
 * Tầng luận giải — ghép nguyên văn đã kiểm với lá số đang xem.
 *
 * Nguyên tắc: ở đây **không có câu nào do giao diện tự viết**. Mỗi mục trả về
 * `claim_vi` + `quote_id` của một câu đã qua `scripts/verify-quotes.mjs` và
 * `scripts/verify-content.mjs`. Phần mô tả cấu trúc (cung nào, tuổi nào, sao nào)
 * là kết quả của engine, không phải nhận định vận mệnh.
 */
import brightnessRaw from '../../../content/brightness.json';
import dahanRaw from '../../../content/dahan.json';
import palaceRulesRaw from '../../../content/palace-rules.json';
import readingRulesRaw from '../../../content/reading-rules.json';
import starInPalaceRaw from '../../../content/star-in-palace.json';
import dayMastersRaw from '../../../content/day-masters.json';
import tenGodsRaw from '../../../content/ten-gods.json';
import {
  PALACE_NAMES,
  daHanCycles,
  type DaHan,
  type DaHanStep,
  type Palace,
  type PlacedStar,
  type TuViChart,
  type TuViGender,
} from '../../../packages/tuvi-engine/src/index.ts';
import {
  PILLAR_NAMES,
  tenGod,
  type BaziChart,
  type TenGodId,
} from '../../../packages/bazi-engine/src/index.ts';
import { HUA_REFS, starRef, type HuaRef, type StarRef } from './stars.ts';
import { QUOTES, type Quote } from './quotes-data.ts';

// ── Bảng độ sáng ─────────────────────────────────────────────
export type BrightnessLevel = { vi: string; tone: string; zh?: string };

type BrightnessEntry = {
  quote_id: string;
  source_label_zh: string;
  levels: Record<string, string>;
  no_fall: boolean;
  unspecified: number[];
};

const BRIGHTNESS = brightnessRaw as {
  levels: Record<string, BrightnessLevel>;
  stars: Record<string, BrightnessEntry>;
};

export type Brightness = {
  /** null khi nguồn không chép cung này. */
  level: BrightnessLevel | null;
  quote: Quote | undefined;
  /** Câu nguồn có ghi "không hãm" / "không thất hãm" cho cả bảng. */
  noFall: boolean;
};

export function brightnessOf(starId: string, branch: number): Brightness | null {
  const entry = BRIGHTNESS.stars[starId];
  if (!entry) return null;
  const zh = entry.levels[String(branch)];
  return {
    level: zh ? (BRIGHTNESS.levels[zh] ?? null) : null,
    quote: QUOTES[entry.quote_id],
    noFall: entry.no_fall,
  };
}

// ── Đại hạn ──────────────────────────────────────────────────
type DahanDoc = {
  direction_quote: string;
  ten_year_quote: string;
  fortune_quote: string;
  structure_quote: string;
  start_age: Record<string, string>;
};

const DAHAN = dahanRaw as DahanDoc;

export const DAHAN_QUOTES = {
  direction: QUOTES[DAHAN.direction_quote],
  tenYear: QUOTES[DAHAN.ten_year_quote],
  fortune: QUOTES[DAHAN.fortune_quote],
  /** Câu luận theo cung — lấy từ `reading-rules.json` (cùng một nguồn). */
  structure: QUOTES[(readingRulesRaw as ReadingRulesDoc).rules.ptc?.quote_id ?? ''],
  startAge: (n: number) => QUOTES[DAHAN.start_age[String(n)]],
};

// ── Tử Vi ────────────────────────────────────────────────────
export type ReadingStar = {
  star: PlacedStar;
  ref: StarRef | undefined;
  brightness: Brightness | null;
  hua: HuaRef | undefined;
};

export type PalaceReading = {
  palace: Palace;
  dahan: DaHanStep;
  stars: ReadingStar[];
  /** Tam hợp (chi +4, +8) và đối cung (chi +6). */
  triads: Palace[];
};

export type TuViReading = {
  chart: TuViChart;
  dahan: DaHan;
  palaces: PalaceReading[];
  soul: PalaceReading;
  body: PalaceReading;
};

const HUA_ORDER: Record<string, number> = { loc: 0, quyen: 1, khoa: 2, ky: 3 };

function readingStar(star: PlacedStar, branch: number): ReadingStar {
  return {
    star,
    ref: starRef(star.id),
    brightness: brightnessOf(star.id, branch),
    hua: star.mutagen ? HUA_REFS.find((h) => h.id === star.mutagen) : undefined,
  };
}

export function buildTuViReading(chart: TuViChart, gender: TuViGender): TuViReading {
  const dahan = daHanCycles(chart, gender);
  const dahanAt = new Map(dahan.steps.map((s) => [s.branch, s]));

  const palaces: PalaceReading[] = chart.palaces.map((palace) => {
    const stars = [...palace.mainStars, ...palace.auxStars]
      .map((star) => readingStar(star, palace.branch))
      .sort((a, b) => {
        if (a.star.group !== b.star.group) return a.star.group === 'main' ? -1 : 1;
        return (HUA_ORDER[a.star.mutagen ?? 'z'] ?? 9) - (HUA_ORDER[b.star.mutagen ?? 'z'] ?? 9);
      });
    return {
      palace,
      dahan: dahanAt.get(palace.branch)!,
      stars,
      triads: [4, 6, 8].map((step) => chart.palaces[(palace.branch + step) % 12]!),
    };
  });

  return {
    chart,
    dahan,
    palaces,
    soul: palaces[chart.soul.branch]!,
    body: palaces[chart.body.branch]!,
  };
}

/** Câu luận của một sao, ưu tiên role "reading" rồi "definition". */
export function starQuote(ref: StarRef | undefined): Quote | undefined {
  if (!ref) return undefined;
  return (
    ref.cited.find((c) => c.role === 'reading')?.quote ??
    ref.cited.find((c) => c.role === 'definition')?.quote ??
    ref.cited[0]?.quote
  );
}

/**
 * Câu "ở cung này thì thuận / trắc trở": lấy từ 論太歲小限星辰庙陷遇十二宫中吉凶.
 * Trả về map theo chi của cung.
 */
export type PalaceRulePair = { good?: Quote; bad?: Quote };

let palaceRuleCache: Map<number, PalaceRulePair> | null = null;

export function palaceRules(): Map<number, PalaceRulePair> {
  if (palaceRuleCache) return palaceRuleCache;
  const doc = palaceRulesRaw as {
    entries: { branch: number; good_quote: string; bad_quote: string }[];
  };
  palaceRuleCache = new Map(
    doc.entries.map((e) => [
      e.branch,
      { good: QUOTES[e.good_quote], bad: QUOTES[e.bad_quote] },
    ]),
  );
  return palaceRuleCache;
}

/**
 * Câu "sao này ở cung này thì sao" — lấy từ các mục theo cung ở 卷二
 * (二 兄弟 … 十二 父母). Cung Mệnh không có trong bảng: ở đó dùng câu định
 * nghĩa sao của 卷一, vốn đã nói về người có sao ấy tại Mệnh.
 */
type StarInPalaceDoc = {
  palaces: {
    id: number;
    zh: string;
    vi: string;
    locator: string;
    stars: Record<string, string>;
    missing: string[];
    aux: Record<string, string>;
    auxMissing: string[];
    /** Câu dùng chung cho một mục gộp, ví dụ mục "文昌文曲" ở Huynh Đệ. */
    heads?: Record<string, { zh: string; vi: string }>;
  }[];
};

const STAR_IN_PALACE = starInPalaceRaw as unknown as StarInPalaceDoc;
const STAR_IN_PALACE_BY_ID = new Map(STAR_IN_PALACE.palaces.map((p) => [p.id, p]));

/**
 * Mục của một cung. `stars`/`aux` đã là câu trích; `missing` là chính tinh mà
 * sách không chép mục riêng ở cung đó, `auxMissing` là phụ tinh cùng tình
 * trạng — giao diện phải nói rõ "nguồn không chép", không được coi là thiếu
 * bản dịch.
 */
export function starInPalaceData(palace: Palace): {
  quote: (starId: string) => Quote | undefined;
  head: (starId: string) => { zh: string; vi: string } | undefined;
  missing: string[];
  auxMissing: string[];
  locator?: string;
} {
  const index = PALACE_NAMES.findIndex((p) => p.vi === palace.nameVi);
  const entry = STAR_IN_PALACE_BY_ID.get(index);
  if (!entry) {
    return { quote: () => undefined, head: () => undefined, missing: [], auxMissing: [] };
  }
  const quoteAt = (starId: string) => QUOTES[entry.stars[starId] ?? entry.aux?.[starId] ?? ''];
  return {
    quote: quoteAt,
    head: (starId) => {
      const q = quoteAt(starId);
      return q ? entry.heads?.[q.id] : undefined;
    },
    missing: entry.missing,
    auxMissing: entry.auxMissing ?? [],
    locator: entry.locator,
  };
}

/** Quy tắc đọc vận — tam phương, đại hạn, tiểu hạn, lưu niên. */
type ReadingRulesDoc = {
  steps: number[];
  rules: Record<string, { quote_id: string; locator: string }>;
};

const RULES_DOC = readingRulesRaw as ReadingRulesDoc;

export const READING_RULES = {
  ptc: QUOTES[RULES_DOC.rules.ptc?.quote_id ?? ''],
  dahanTenYears: QUOTES[RULES_DOC.rules['dahan-ten-years']?.quote_id ?? ''],
  twoCycles: QUOTES[RULES_DOC.rules['dahan-two-cycles']?.quote_id ?? ''],
  namBac: QUOTES[RULES_DOC.rules['dahan-nam-bac']?.quote_id ?? ''],
  liuNian: QUOTES[RULES_DOC.rules.liunian?.quote_id ?? ''],
  /** Bước tam hợp / đối cung theo chi. */
  steps: RULES_DOC.steps ?? [4, 6, 8],
};

const BRANCH_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/**
 * Chi của một năm dương lịch — dùng cho cung lưu niên.
 * Công thức là phép đếm lịch, không phải luận đoán.
 */
export function liuNianStep(year: number): { branch: number; branchVi: string } {
  const branch = (((year - 4) % 12) + 12) % 12;
  return { branch, branchVi: BRANCH_VI[branch]! };
}

// ── Bát Tự ───────────────────────────────────────────────────
type DayMasterEntry = { stem: number; zh: string; vi: string; quote_id: string };
type TenGodEntry = { id: TenGodId; quote_id: string };

const DAY_MASTERS = (dayMastersRaw as { entries: DayMasterEntry[] }).entries;
const TEN_GOD_CONTENT = (tenGodsRaw as { entries: TenGodEntry[]; missing: TenGodId[] }).entries;
const TEN_GOD_MISSING = new Set((tenGodsRaw as { missing: TenGodId[] }).missing);

const DAY_MASTER_BY_STEM = new Map(DAY_MASTERS.map((e) => [e.stem, e]));
const GOD_QUOTE = new Map(TEN_GOD_CONTENT.map((e) => [e.id, e.quote_id]));

export type GodReading = {
  id: TenGodId;
  /** Câu định nghĩa; undefined khi kho văn bản chưa có. */
  quote: Quote | undefined;
  /** Các trụ / tàng can nơi thần này xuất hiện. */
  places: string[];
};

export type BaziReading = {
  chart: BaziChart;
  dayMasterEntry: DayMasterEntry;
  dayMasterQuote: Quote | undefined;
  gods: GodReading[];
  missingGods: TenGodId[];
};

export function godReading(id: TenGodId): Quote | undefined {
  const quoteId = GOD_QUOTE.get(id);
  if (!quoteId) return undefined;
  return QUOTES[quoteId];
}

const GOD_ORDER: TenGodId[] = [
  'ty-kiep',
  'kiep-tai',
  'thuc-than',
  'thuong-quan',
  'chinh-tai',
  'thien-tai',
  'chinh-quan',
  'that-sat',
  'chinh-an',
  'thien-an',
];

export function buildBaziReading(chart: BaziChart): BaziReading {
  const dayMasterEntry = DAY_MASTER_BY_STEM.get(chart.dayMaster.stem)!;
  const byGod = new Map<TenGodId, string[]>();
  const add = (id: TenGodId, place: string) => {
    const list = byGod.get(id) ?? [];
    list.push(place);
    byGod.set(id, list);
  };

  for (const stem of chart.stems) {
    if (stem.tenGod) add(stem.tenGod.id, PILLAR_NAMES[stem.pillar].vi);
  }
  for (const branch of chart.branches) {
    for (const hidden of branch.hidden) {
      add(hidden.tenGod.id, `${PILLAR_NAMES[branch.pillar].vi} · tàng ${hidden.vi}`);
    }
  }

  const gods: GodReading[] = [...byGod.entries()]
    .map(([id, places]) => ({
      id,
      quote: godReading(id),
      places: [...new Set(places)],
    }))
    .sort((a, b) => GOD_ORDER.indexOf(a.id) - GOD_ORDER.indexOf(b.id));

  return {
    chart,
    dayMasterEntry,
    dayMasterQuote: QUOTES[dayMasterEntry.quote_id],
    gods,
    missingGods: [...TEN_GOD_MISSING],
  };
}

/** Thập thần của can trong từng đại vận (để hiện bên cạnh vận). */
export function luckTenGod(chart: BaziChart, stem: number): TenGodId {
  return tenGod(chart.dayMaster.stem, stem).id;
}
