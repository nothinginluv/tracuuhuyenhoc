/**
 * tuvi-engine — an sao Tử Vi Đẩu Số từ lịch âm Trung Quốc.
 *
 * Đầu vào duy nhất cần thiết: năm/tháng/ngày âm lịch (TQ) + chi giờ sinh.
 * Thường lấy từ `calendar-core` bằng `tuViBirthFromContext()`.
 */
export {
  buildTuViChart,
  effectiveMonth,
  hourBranchOf,
  tuViBirthFromContext,
} from './chart.ts';
export type {
  LeapMonthRule,
  Palace,
  PlacedStar,
  SoulStarBasis,
  TuViBirth,
  TuViChart,
  TuViOptions,
} from './chart.ts';

export { ziweiBranch, tianfuBranch, mainStarBranches, ZIWEI_SERIES, TIANFU_SERIES } from './main-stars.ts';
export type { MainStarPositions } from './main-stars.ts';

export { auxStarBranches } from './aux-stars.ts';
export type { AuxInput, AuxStarPositions } from './aux-stars.ts';

export { bureauOf, branchNumber, stemNumber } from './bureau.ts';
export type { Bureau, BureauNumber } from './bureau.ts';

export {
  soulPalaceBranch,
  bodyPalaceBranch,
  yinPalaceStem,
  palaceStem,
  palaceNameAt,
} from './palaces.ts';

export { MUTAGEN_TABLES, DEFAULT_MUTAGEN_TABLE, mutagensOf } from './mutagen.ts';
export type { Mutagen, MutagenTable, MutagenTableId } from './mutagen.ts';

export { STAR_DEFS, PALACE_NAMES, HUA, STEMS_ZH, STEMS_VI, BRANCHES_ZH, BRANCHES_VI } from './constants.ts';
export type { HuaKey, StarDef, StarGroup, StarId } from './constants.ts';
