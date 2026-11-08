/**
 * Lắp lá Bát Tự từ ngữ cảnh lịch.
 *
 * Tứ trụ do `calendar-core` tính (năm/tháng theo instant tiết khí); engine này chỉ
 * thêm tàng can, thập thần và đại vận — tất cả đều là phép suy ra từ can ngày và
 * khoảng cách tiết khí, không phải luận đoán.
 */
import { jieAfter, type ChartContext, type Pillar, type Pillars } from '../../calendar-core/src/index.ts';
import {
  BRANCH_ELEMENT,
  BRANCHES_VI,
  BRANCHES_ZH,
  ELEMENT_VI,
  ELEMENT_ZH,
  STEM_ELEMENT,
  STEMS_VI,
  STEMS_ZH,
  isYang,
  type Element,
  type Gender,
} from './constants.ts';
import {
  HIDDEN_STEMS_QUOTE,
  hiddenStems,
  type HiddenStem,
} from './hidden-stems.ts';
import {
  TEN_GODS_QUOTE,
  tenGod,
  type TenGodDef,
} from './ten-gods.ts';
import {
  LUCK_DIRECTION_QUOTE,
  QIYUN_RULE_QUOTE,
  luckCycles,
  qiYun,
  type LuckCycle,
  type QiYun,
} from './luck.ts';

export type PillarKey = 'year' | 'month' | 'day' | 'hour';

/** 淵海子平: 「取日干为主，以年为根，以月为苗，以日为花，以时为果」 */
export const DAY_MASTER_QUOTE = 'q_bz_0008';

export const PILLAR_KEYS: readonly PillarKey[] = ['year', 'month', 'day', 'hour'];

export const PILLAR_NAMES: Record<PillarKey, { zh: string; vi: string }> = {
  year: { zh: '年柱', vi: 'Trụ năm' },
  month: { zh: '月柱', vi: 'Trụ tháng' },
  day: { zh: '日柱', vi: 'Trụ ngày' },
  hour: { zh: '時柱', vi: 'Trụ giờ' },
};

export type StemAnalysis = {
  pillar: PillarKey;
  stem: number;
  zh: string;
  vi: string;
  element: Element;
  elementZh: string;
  elementVi: string;
  yinYang: 'duong' | 'am';
  /** null ở trụ ngày: đó chính là nhật chủ. */
  tenGod: TenGodDef | null;
};

export type BranchAnalysis = {
  pillar: PillarKey;
  branch: number;
  zh: string;
  vi: string;
  element: Element;
  elementZh: string;
  elementVi: string;
  hidden: (HiddenStem & { tenGod: TenGodDef })[];
};

export type BaziOptions = {
  gender: Gender;
  /** Số đại vận cần liệt kê (1–12). */
  luckCount?: number;
};

export type BaziChart = {
  pillars: Pillars;
  /** Can ngày — chủ thể của cả lá số. */
  dayMaster: Omit<StemAnalysis, 'tenGod'>;
  stems: StemAnalysis[];
  branches: BranchAnalysis[];
  /** Đếm ngũ hành của 8 chữ nổi (4 can + 4 chi, chi tính hành của chính nó). */
  elementCounts: Record<Element, number>;
  /** Đếm ngũ hành của toàn bộ tàng can (mỗi can tàng tính 1). */
  hiddenElementCounts: Record<Element, number>;
  qiYun: QiYun;
  luck: LuckCycle[];
  citations: {
    dayMaster: string;
    hiddenStems: string;
    tenGods: string;
    luckDirection: string;
    qiYunRule: string;
  };
  notes: string[];
};

const emptyCounts = (): Record<Element, number> => ({
  moc: 0, hoa: 0, tho: 0, kim: 0, thuy: 0,
});

const elementInfo = (e: Element) => ({ element: e, elementZh: ELEMENT_ZH[e], elementVi: ELEMENT_VI[e] });

function analyzeStem(pillar: PillarKey, p: Pillar, dayStem: number): StemAnalysis {
  const e = STEM_ELEMENT[p.stem];
  return {
    pillar,
    stem: p.stem,
    zh: STEMS_ZH[p.stem],
    vi: STEMS_VI[p.stem],
    ...elementInfo(e),
    yinYang: isYang(p.stem) ? 'duong' : 'am',
    tenGod: pillar === 'day' ? null : tenGod(dayStem, p.stem),
  };
}

function analyzeBranch(pillar: PillarKey, p: Pillar, dayStem: number): BranchAnalysis {
  const e = BRANCH_ELEMENT[p.branch];
  return {
    pillar,
    branch: p.branch,
    zh: BRANCHES_ZH[p.branch],
    vi: BRANCHES_VI[p.branch],
    ...elementInfo(e),
    hidden: hiddenStems(p.branch).map((h) => ({ ...h, tenGod: tenGod(dayStem, h.stem) })),
  };
}

export function buildBaziChart(ctx: ChartContext, options: BaziOptions): BaziChart {
  const { gender } = options;
  if (gender !== 'nam' && gender !== 'nu') {
    throw new RangeError(`Giới tính phải là "nam" hoặc "nữ", nhận "${String(gender)}"`);
  }
  const luckCount = options.luckCount ?? 10;

  const { pillars } = ctx;
  const nextJie = jieAfter(ctx.instantMs);
  if (!nextJie) {
    throw new RangeError('Thiếu mốc tiết khí kế tiếp — không tính được khởi vận.');
  }

  const dayStem = pillars.day.stem;
  const stems = PILLAR_KEYS.map((k) => analyzeStem(k, pillars[k], dayStem));
  const branches = PILLAR_KEYS.map((k) => analyzeBranch(k, pillars[k], dayStem));

  const elementCounts = emptyCounts();
  for (const s of stems) elementCounts[s.element]++;
  for (const b of branches) elementCounts[b.element]++;

  const hiddenElementCounts = emptyCounts();
  for (const b of branches) {
    for (const h of b.hidden) hiddenElementCounts[STEM_ELEMENT[h.stem]]++;
  }

  const dayMaster = (() => {
    const { tenGod: _ignored, ...rest } = stems[2]!;
    return rest;
  })();

  const qi = qiYun({
    yearStem: pillars.year.stem,
    gender,
    birthEpochMs: ctx.instantMs,
    previousJieEpochMs: ctx.jie.current.epoch,
    nextJieEpochMs: nextJie.epoch,
  });

  const luck = luckCycles(pillars.month.cycleIndex, qi, luckCount);

  const notes: string[] = [
    'Tuổi khởi vận là số năm kể từ lúc sinh (không phải tuổi mụ).',
    'Đại vận đi từ trụ tháng: thuận thì tiến, nghịch thì lùi; vận đầu không phải trụ tháng.',
  ];

  return {
    pillars,
    dayMaster,
    stems,
    branches,
    elementCounts,
    hiddenElementCounts,
    qiYun: qi,
    luck,
    citations: {
      dayMaster: DAY_MASTER_QUOTE,
      hiddenStems: HIDDEN_STEMS_QUOTE,
      tenGods: TEN_GODS_QUOTE,
      luckDirection: LUCK_DIRECTION_QUOTE,
      qiYunRule: QIYUN_RULE_QUOTE,
    },
    notes,
  };
}
