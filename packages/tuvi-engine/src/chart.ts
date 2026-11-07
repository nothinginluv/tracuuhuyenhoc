/**
 * Lắp lá số Tử Vi từ một thời điểm sinh.
 *
 * Toàn bộ vị trí sao ở đây là kết quả của 安星訣, không phải suy diễn. Phần luận
 * giải (sao nào nói gì) nằm ở tầng nội dung, mỗi câu phải có trích dẫn.
 *
 * Quy ước có tranh cãi (tháng nhuận, bảng tứ hoá, gốc tính sao chủ) đều là tham
 * số, không giấu trong code.
 */
import {
  BRANCHES_VI,
  BRANCHES_ZH,
  PALACE_NAMES,
  STAR_DEFS,
  STEMS_VI,
  STEMS_ZH,
  mod,
  type HuaKey,
  type StarId,
} from './constants.ts';
import { bureauOf, type Bureau } from './bureau.ts';
import { bodyPalaceBranch, palaceStem, soulPalaceBranch } from './palaces.ts';
import { mainStarBranches } from './main-stars.ts';
import { auxStarBranches } from './aux-stars.ts';
import { DEFAULT_MUTAGEN_TABLE, mutagensOf, type MutagenTableId } from './mutagen.ts';
import type { ChartContext } from '../../calendar-core/src/index.ts';

export type LeapMonthRule =
  /** Ngày 1–15 tính theo tháng nhuận, ngày 16–30 tính sang tháng sau (中州派 / phần mềm TQ). */
  | 'split'
  /** Tháng nhuận giữ nguyên số tháng. */
  | 'as-month'
  /** Tháng nhuận tính là tháng kế tiếp. */
  | 'as-next';

export type SoulStarBasis =
  /** Tra sao chủ theo chi cung Mệnh (mặc định của đa số sách). */
  | 'soul-palace'
  /** Tra theo chi năm sinh (một số phái). */
  | 'year-branch';

export type TuViOptions = {
  leapMonthRule?: LeapMonthRule;
  mutagenTable?: MutagenTableId;
  soulStarBasis?: SoulStarBasis;
};

export type TuViBirth = {
  lunarYear: number;
  /** Tháng âm lịch như in trên lịch (1–12), kể cả tháng nhuận. */
  lunarMonth: number;
  lunarDay: number;
  lunarLeap: boolean;
  /** Chi giờ sinh, 0 = Tý. */
  hourBranch: number;
};

export type PlacedStar = {
  id: StarId;
  zh: string;
  vi: string;
  group: 'main' | 'aux';
  branch: number;
  mutagen?: HuaKey;
};

export type Palace = {
  branch: number;
  branchZh: string;
  branchVi: string;
  stem: number;
  stemZh: string;
  stemVi: string;
  nameZh: string;
  nameVi: string;
  isSoul: boolean;
  isBody: boolean;
  mainStars: PlacedStar[];
  auxStars: PlacedStar[];
};

export type TuViChart = {
  birth: TuViBirth & {
    /** Tháng dùng để an sao, sau khi áp quy tắc tháng nhuận. */
    monthUsed: number;
    /** true khi quy tắc tháng nhuận thực sự làm đổi tháng. */
    leapRuleApplied: boolean;
  };
  year: {
    stem: number;
    branch: number;
    zh: string;
    vi: string;
    /** Năm âm lịch trong vòng 60 Giáp Tý. */
    cycleIndex: number;
  };
  soul: { branch: number; stem: number; zh: string; vi: string };
  body: { branch: number; zh: string; vi: string };
  bureau: Bureau;
  /** Sao chủ Mệnh (命主). */
  soulStar: StarId;
  /** Sao chủ Thân (身主). */
  bodyStar: StarId;
  palaces: Palace[];
  stars: PlacedStar[];
  mutagens: { star: StarId; hua: HuaKey; zh: string; vi: string; branch: number }[];
  options: Required<TuViOptions>;
  notes: string[];
};

/** Chi giờ từ giờ đồng hồ 0–23. 23:00 và 00:00 đều là Tý. */
export function hourBranchOf(hour: number): number {
  return Math.floor((mod(hour, 24) + 1) / 2) % 12;
}

/** 命主 — theo chi cung Mệnh. */
const SOUL_STAR_BY_BRANCH: readonly StarId[] = [
  'tanlang', 'jumen', 'lucun', 'wenqu', 'lianzhen', 'wuqu',
  'pojun', 'wuqu', 'lianzhen', 'wenqu', 'lucun', 'jumen',
];

/**
 * 身主 — theo chi năm sinh: 子午 Hoả Tinh, 丑未 Thiên Tướng, 寅申 Thiên Lương,
 * 卯酉 Thiên Đồng, 辰戌 Văn Xương, 巳亥 Thiên Cơ.
 */
const BODY_STAR_BY_BRANCH: readonly StarId[] = [
  'huoxing', 'tianxiang', 'tianliang', 'tiantong', 'wenchang', 'tianji',
  'huoxing', 'tianxiang', 'tianliang', 'tiantong', 'wenchang', 'tianji',
];

const DEFAULTS: Required<TuViOptions> = {
  leapMonthRule: 'split',
  mutagenTable: DEFAULT_MUTAGEN_TABLE,
  soulStarBasis: 'soul-palace',
};

function validate(birth: TuViBirth): void {
  const { lunarYear, lunarMonth, lunarDay, hourBranch } = birth;
  if (!Number.isInteger(lunarYear) || lunarYear < 1900 || lunarYear > 2101) {
    throw new RangeError(`Năm âm lịch phải trong 1900–2101, nhận ${lunarYear}`);
  }
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError(`Tháng âm lịch phải trong 1–12, nhận ${lunarMonth}`);
  }
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
    throw new RangeError(`Ngày âm lịch phải trong 1–30, nhận ${lunarDay}`);
  }
  if (!Number.isInteger(hourBranch) || hourBranch < 0 || hourBranch > 11) {
    throw new RangeError(`Chi giờ phải trong 0–11, nhận ${hourBranch}`);
  }
}

/** Tháng dùng để an sao sau khi áp quy tắc tháng nhuận. */
export function effectiveMonth(
  birth: Pick<TuViBirth, 'lunarMonth' | 'lunarDay' | 'lunarLeap'>,
  rule: LeapMonthRule,
): { month: number; applied: boolean } {
  if (!birth.lunarLeap || rule === 'as-month') {
    return { month: birth.lunarMonth, applied: false };
  }
  if (rule === 'as-next') {
    return { month: mod(birth.lunarMonth, 12) + 1, applied: true };
  }
  // 'split': nửa đầu tháng nhuận tính là tháng đó, nửa sau tính sang tháng sau.
  return birth.lunarDay <= 15
    ? { month: birth.lunarMonth, applied: false }
    : { month: mod(birth.lunarMonth, 12) + 1, applied: true };
}

export function buildTuViChart(
  birth: TuViBirth,
  options: TuViOptions = {},
): TuViChart {
  validate(birth);
  const opts: Required<TuViOptions> = { ...DEFAULTS, ...options };

  const yearCycleIndex = mod(birth.lunarYear - 4, 60);
  const yearStem = mod(yearCycleIndex, 10);
  const yearBranch = mod(yearCycleIndex, 12);

  const { month: monthUsed, applied: leapRuleApplied } = effectiveMonth(birth, opts.leapMonthRule);

  const soulBranch = soulPalaceBranch(monthUsed, birth.hourBranch);
  const bodyBranch = bodyPalaceBranch(monthUsed, birth.hourBranch);
  const soulStem = palaceStem(yearStem, soulBranch);
  const bureau = bureauOf(soulStem, soulBranch);

  const main = mainStarBranches(birth.lunarDay, bureau.number);
  const aux = auxStarBranches({
    month: monthUsed,
    day: birth.lunarDay,
    hourBranch: birth.hourBranch,
    yearStem,
    yearBranch,
  });

  const mutagens = mutagensOf(yearStem, opts.mutagenTable);
  const mutagenByStar = new Map<StarId, HuaKey>();
  for (const m of mutagens) mutagenByStar.set(m.star, m.hua);

  // Gắn sao vào 12 cung, chính tinh trước phụ tinh.
  const byBranch: PlacedStar[][] = Array.from({ length: 12 }, () => []);
  const all: PlacedStar[] = [];

  const place = (id: StarId, branch: number): void => {
    const def = STAR_DEFS[id];
    const star: PlacedStar = {
      id,
      zh: def.zh,
      vi: def.vi,
      group: def.group,
      branch,
      mutagen: mutagenByStar.get(id),
    };
    byBranch[branch].push(star);
    all.push(star);
  };

  for (const id of Object.keys(STAR_DEFS) as StarId[]) {
    if (STAR_DEFS[id].group === 'main') place(id, main[id]);
  }
  for (const id of Object.keys(STAR_DEFS) as StarId[]) {
    if (STAR_DEFS[id].group === 'aux') place(id, aux[id]);
  }

  const palaces: Palace[] = [];
  for (let branch = 0; branch < 12; branch++) {
    const name = PALACE_NAMES[mod(soulBranch - branch, 12)];
    const stem = palaceStem(yearStem, branch);
    const starsHere = byBranch[branch];
    palaces.push({
      branch,
      branchZh: BRANCHES_ZH[branch],
      branchVi: BRANCHES_VI[branch],
      stem,
      stemZh: STEMS_ZH[stem],
      stemVi: STEMS_VI[stem],
      nameZh: name.zh,
      nameVi: name.vi,
      isSoul: branch === soulBranch,
      isBody: branch === bodyBranch,
      mainStars: starsHere.filter((s) => s.group === 'main'),
      auxStars: starsHere.filter((s) => s.group === 'aux'),
    });
  }

  const notes: string[] = [];
  if (birth.lunarLeap) {
    notes.push(
      leapRuleApplied
        ? `Sinh tháng nhuận, ngày ${birth.lunarDay} — theo quy tắc "${opts.leapMonthRule}", ` +
            `tháng an sao là ${monthUsed} thay vì ${birth.lunarMonth}. Đổi quy tắc sẽ cho lá số khác.`
        : `Sinh tháng nhuận, ngày ${birth.lunarDay} — theo quy tắc "${opts.leapMonthRule}", ` +
            `tháng an sao vẫn là ${monthUsed}.`,
    );
  }
  if (opts.soulStarBasis === 'year-branch') {
    notes.push('Sao chủ Mệnh đang tra theo chi năm sinh, không theo chi cung Mệnh.');
  }

  const soulStar =
    opts.soulStarBasis === 'soul-palace'
      ? SOUL_STAR_BY_BRANCH[soulBranch]
      : SOUL_STAR_BY_BRANCH[yearBranch];
  const bodyStar = BODY_STAR_BY_BRANCH[yearBranch];

  return {
    birth: { ...birth, monthUsed, leapRuleApplied },
    year: {
      stem: yearStem,
      branch: yearBranch,
      zh: `${STEMS_ZH[yearStem]}${BRANCHES_ZH[yearBranch]}`,
      vi: `${STEMS_VI[yearStem]} ${BRANCHES_VI[yearBranch]}`,
      cycleIndex: yearCycleIndex,
    },
    soul: {
      branch: soulBranch,
      stem: soulStem,
      zh: `${STEMS_ZH[soulStem]}${BRANCHES_ZH[soulBranch]}`,
      vi: `${STEMS_VI[soulStem]} ${BRANCHES_VI[soulBranch]}`,
    },
    body: {
      branch: bodyBranch,
      zh: BRANCHES_ZH[bodyBranch],
      vi: BRANCHES_VI[bodyBranch],
    },
    bureau,
    soulStar,
    bodyStar,
    palaces,
    stars: all,
    mutagens: mutagens.map((m) => ({
      ...m,
      branch: all.find((s) => s.id === m.star)!.branch,
    })),
    options: opts,
    notes,
  };
}

/**
 * Chuyển ngữ cảnh lịch (đã xử lý múi giờ, tiết khí, đồng hồ) thành đầu vào Tử Vi.
 *
 * Tử Vi dùng năm âm lịch (đổi tại Tết), không dùng năm tiết khí — nên lấy từ
 * `lunar.cn`, không lấy từ trụ năm.
 */
export function tuViBirthFromContext(ctx: ChartContext): TuViBirth {
  return {
    lunarYear: ctx.lunar.cn.year,
    lunarMonth: ctx.lunar.cn.month,
    lunarDay: ctx.lunar.cn.day,
    lunarLeap: ctx.lunar.cn.leap,
    hourBranch: hourBranchOf(ctx.clock.wall.hour),
  };
}
