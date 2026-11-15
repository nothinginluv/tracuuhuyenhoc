/**
 * Tầng luận giải — ghép nguyên văn đã kiểm với lá số đang xem.
 *
 * Nguyên tắc: ở đây **không có câu nào do giao diện tự viết**. Mỗi mục trả về
 * `claim_vi` + `quote_id` của một câu đã qua `scripts/verify-quotes.mjs` và
 * `scripts/verify-content.mjs`. Phần mô tả cấu trúc (cung nào, tuổi nào, sao nào)
 * là kết quả của engine, không phải nhận định vận mệnh.
 */
import brightnessRaw from '../../../content/brightness.json';
import starInPalaceRaw from '../../../content/star-in-palace.json';
import dayMastersRaw from '../../../content/day-masters.json';
import tenGodsRaw from '../../../content/ten-gods.json';
import {
  PALACE_NAMES,
  STAR_DEFS,
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

// ── Câu gọn cho một cung ─────────────────────────────────────
/**
 * Câu của sách theo cung viết theo lối "…; cùng X: …; hãm địa: …". Đọc nguyên
 * cả câu thì nặng, mà phần lớn mệnh đề lại nói về sao không có trong cung.
 *
 * Hàm dưới đây **chỉ bỏ mệnh đề**, không viết lại chữ nào: mỗi mệnh đề còn lại
 * là một đoạn nguyên văn của câu đã kiểm. Mệnh đề bị bỏ khi:
 *   · nhắc tới sao không đóng trong cung, hoặc nhóm sao mà cung không đủ;
 *   · gắn với mức sáng (miếu/vượng/hãm…) khác mức sáng thật của sao;
 *   · gắn với một chi khác chi của cung đang đọc — vd "ở Thân", "(Ngọ)";
 *   · đặt điều kiện chung (cát tinh, sát tinh, Tuần, Triệt…) mà không nêu sao cụ thể;
 *   · là ghi chú biên tập của bản dịch ("Sách thêm một câu…"), không phải lời sách.
 *
 * Câu được lấy theo **tiền tố**: gặp mệnh đề đầu tiên không áp dụng được thì
 * dừng, không nhảy qua nó. Nhờ vậy một mệnh đề không bao giờ mất điều kiện
 * đứng trước nó — vd "hãm địa: nhiều tai; đàn bà chủ tàn tật" mà bỏ vế đầu thì
 * vế sau thành câu nói chung, sai nghĩa.
 */
const GROUP_ALIASES: { label: string; ids: string[] }[] = [
  { label: 'Tả Hữu', ids: ['zuofu', 'youbi'] },
  { label: 'Xương Khúc', ids: ['wenchang', 'wenqu'] },
  { label: 'Không Kiếp', ids: ['dikong', 'dijie'] },
  { label: 'Kình Đà', ids: ['qingyang', 'tuoluo'] },
  { label: 'Hoả Linh', ids: ['huoxing', 'lingxing'] },
  { label: 'Khôi Việt', ids: ['tiankui', 'tianyue'] },
];

const BRIGHT_START: { key: string; ok: (level: string) => boolean }[] = [
  // Nguồn dùng "miếu vượng" như một cụm; cả hai đều là trạng thái sáng.
  { key: 'miếu vượng', ok: (l) => l === 'Miếu' || l === 'Vượng' },
  { key: 'miếu', ok: (l) => l === 'Miếu' || l === 'Vượng' },
  { key: 'vượng', ok: (l) => l === 'Miếu' || l === 'Vượng' },
  { key: 'hãm địa', ok: (l) => l === 'Hãm' },
  { key: 'hãm cung', ok: (l) => l === 'Hãm' },
  { key: 'hãm', ok: (l) => l === 'Hãm' },
  { key: 'bình hoà', ok: (l) => l === 'Bình' },
  { key: 'bình', ok: (l) => l === 'Bình' },
  { key: 'đắc địa', ok: (l) => l !== 'Hãm' },
  { key: 'lạc hãm', ok: (l) => l === 'Hãm' },
];

const GENERIC_CONDITIONS = ['cát tinh', 'sát tinh', 'tuần', 'triệt', 'sao hao', 'hao tinh'];

const META_STARTS = ['sách thêm', 'sách chép', 'sách ghi', 'bản dịch', 'nguồn:'];

const BRANCH_NAMES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/** Các chi được nêu như một điều kiện vị trí trong mệnh đề. */
function branchMentions(body: string): string[] {
  const found: string[] = [];
  for (const b of BRANCH_NAMES) {
    const patterns = [
      new RegExp(`[([{]\\s*${b}\\s*[)\\]}]`),
      new RegExp(`(?:^|[\\s(])(?:ở|cư|tại|đóng(?:\\s+ở|\\s+tại)?|vào)\\s+(?:cung\\s+)?${b}(?=[\\s,;:.!?)]|$)`),
    ];
    if (patterns.some((re) => re.test(body))) found.push(b);
  }
  return found;
}

/** Mức sáng mà mệnh đề đòi hỏi, nếu có (xét phần đầu mệnh đề). */
function leadingBrightness(body: string): { ok: (level: string) => boolean } | null {
  const head = body.slice(0, 48).toLowerCase();
  for (const b of BRIGHT_START) {
    const re = new RegExp(`(?:^|[\\s:,(])${b.key}(?=[\\s:,.!?)]|$)`);
    if (re.test(head)) return b;
  }
  return null;
}

function mentionedStarIds(body: string): string[] {
  const ids: string[] = [];
  for (const [id, def] of Object.entries(STAR_DEFS)) {
    if ((def as { vi: string }).vi && body.includes((def as { vi: string }).vi)) ids.push(id);
  }
  for (const group of GROUP_ALIASES) {
    if (body.includes(group.label)) ids.push(...group.ids);
  }
  return ids;
}

const HUA_WORDS: { key: string; id: string }[] = [
  { key: 'hoá lộc', id: 'loc' },
  { key: 'hóa lộc', id: 'loc' },
  { key: 'hoá quyền', id: 'quyen' },
  { key: 'hóa quyền', id: 'quyen' },
  { key: 'hoá khoa', id: 'khoa' },
  { key: 'hóa khoa', id: 'khoa' },
  { key: 'hoá kỵ', id: 'ky' },
  { key: 'hóa kỵ', id: 'ky' },
];

/** Bỏ các mệnh đề không áp dụng được cho cung đang đọc. */
export function compactQuote(
  text: string,
  present: Set<string>,
  brightnessVi: string | null,
  huaIds: Set<string>,
  branchVi: string | null,
): string {
  const segments: { body: string; sep: string }[] = [];
  const re = /([;.])\s+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    segments.push({ body: text.slice(last, m.index), sep: m[1]! });
    last = m.index + m[0].length;
  }
  segments.push({ body: text.slice(last), sep: '' });

  let out = '';
  let prevSep = '';
  for (const seg of segments) {
    // Ghi chú biên tập trong ngoặc ("bản chép …") là chú thích của người dịch,
    // không phải lời sách — bỏ phần ngoặc, giữ nguyên phần còn lại.
    const body = seg.body.replace(/\s*\((?:bản chép|nguyên chép)[^)]*\)/gi, '').trim();
    if (!body) continue;
    const lower = body.toLowerCase();

    if (META_STARTS.some((p) => lower.startsWith(p))) break;

    // Câu vừa nêu mức sáng vừa nêu mức tối là cặp điều kiện đối nhau, không
    // tách được thành một câu đúng — dừng ở đây.
    if (/hãm/.test(lower) && /(miếu|vượng)/.test(lower)) break;

    const bright = leadingBrightness(body);
    if (bright && !bright.ok(brightnessVi ?? '')) break;

    const branches = branchMentions(body);
    if (branches.length > 0 && !branches.includes(branchVi ?? '')) break;

    const mentioned = mentionedStarIds(body);
    if (mentioned.length > 0) {
      // "thêm A, B, C" là điều kiện đủ cả nhóm; "A hoặc B" mới là một trong hai.
      const anyStar = lower.includes('hoặc') || /\bhay\b/.test(lower);
      const ok = anyStar
        ? mentioned.some((id) => present.has(id))
        : mentioned.every((id) => present.has(id));
      if (!ok) break;
    }
    if (mentioned.length === 0 && GENERIC_CONDITIONS.some((g) => lower.includes(g))) break;

    const huaMentioned = HUA_WORDS.filter((h) => lower.includes(h.key));
    if (huaMentioned.length > 0 && !huaMentioned.some((h) => huaIds.has(h.id))) break;

    if (out) out += prevSep === '.' ? '. ' : '; ';
    out += body;
    prevSep = seg.sep;
  }

  if (out && !/[.!?]$/.test(out)) out += '.';
  return out;
}

/** Câu ngắn nhất còn trung thành với nguồn cho một sao trong một cung. */
export function starPalaceLine(item: ReadingStar, reading: PalaceReading): string | undefined {
  const at = starInPalaceData(reading.palace).quote(item.star.id);
  if (at) {
    const present = new Set(reading.stars.map((s) => s.star.id));
    const hua = new Set<string>();
    for (const s of reading.stars) {
      if (s.hua) hua.add(s.hua.id);
    }
    const compact = compactQuote(
      at.claim_vi,
      present,
      item.brightness?.level?.vi ?? null,
      hua,
      reading.palace.branchVi,
    );
    if (compact) return compact;
  }
  const def = starQuote(item.ref);
  return def ? (def.plain_vi ?? def.claim_vi) : undefined;
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
