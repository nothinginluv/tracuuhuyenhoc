/**
 * bazi-engine — tàng can, thập thần, khởi vận và đại vận từ tứ trụ.
 *
 * Đầu vào: `ChartContext` của `calendar-core` (đã xử lý múi giờ, tiết khí, giờ Tý).
 */
export { buildBaziChart, PILLAR_KEYS, PILLAR_NAMES, DAY_MASTER_QUOTE } from './chart.ts';
export type {
  BaziChart,
  BaziOptions,
  BranchAnalysis,
  PillarKey,
  StemAnalysis,
} from './chart.ts';

export { hiddenStems, mainHiddenStem, HIDDEN_STEMS_QUOTE } from './hidden-stems.ts';
export type { HiddenRole, HiddenStem } from './hidden-stems.ts';

export {
  tenGod,
  relationLabel,
  TEN_GODS,
  TEN_GOD_GROUPS,
  TEN_GODS_QUOTE,
} from './ten-gods.ts';
export type { TenGodDef, TenGodGroup, TenGodId } from './ten-gods.ts';

export {
  luckDirection,
  qiYun,
  luckCycles,
  pillarFromCycle,
  LUCK_DIRECTION_QUOTE,
  QIYUN_RULE_QUOTE,
} from './luck.ts';
export type { LuckCycle, LuckDirection, LuckPillar, QiYun, QiYunInput } from './luck.ts';

export {
  STEMS_ZH,
  STEMS_VI,
  BRANCHES_ZH,
  BRANCHES_VI,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  ELEMENT_ZH,
  ELEMENT_VI,
  isYang,
  mod,
} from './constants.ts';
export type { Element, Gender } from './constants.ts';
