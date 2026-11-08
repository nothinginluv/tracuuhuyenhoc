/**
 * calendar-core — lõi tính lịch của tracuuhuyenhoc.
 *
 * Mọi thứ ở đây là hàm thuần: cùng đầu vào → cùng đầu ra, không đọc đồng hồ hệ
 * thống, không phụ thuộc múi giờ máy chạy.
 *
 * Thứ tự khái niệm:
 *   BirthInput (giờ đồng hồ nơi sinh)
 *     → buildChartContext → instant UTC
 *     → đồng hồ quy ước (Bắc Kinh / nơi sinh / mặt trời thật)
 *     → tứ trụ + âm lịch TQ & VN + cảnh báo
 */
export {
  buildChartContext,
  computePillars,
  resolveOffset,
  wallFromInstant,
  wallToUtcMs,
  shiftWallDays,
  formatWall,
  BirthInputError,
} from './context.ts';
export type {
  BirthInput,
  ChartContext,
  Pillar,
  Pillars,
  PillarOptions,
  WallTime,
  Warning,
  WarningCode,
} from './context.ts';

export {
  PRESETS,
  DEFAULT_PRESET,
  resolveConvention,
  CONVENTION_LABELS,
  ZI_LABELS,
  HOUR_STEM_LABELS,
} from './convention.ts';
export type {
  Clock,
  Convention,
  HourStemRule,
  PresetName,
  TuViSchool,
  ZiBoundary,
} from './convention.ts';

export { dayCycleIndex, epochDayFromDate, dateFromEpochDay, jdFromDate, jdToDate } from './jdn.ts';

export { solarToLunar, lunarAtInstant, lunarDivergesOn, LUNAR_TABLE_RANGE } from './lunar.ts';
export type { LunarDate } from './lunar.ts';

export {
  deltaTSeconds,
  newMoonJde,
  newMoonInstantMs,
  localDayNumber,
  newMoonIndexAtOrBefore,
} from './new-moon.ts';

export {
  TERM_ORDER,
  TERM_ZH,
  TERM_FROM,
  TERM_TO,
  TERM_COUNT,
  JIE_KEYS,
  JIE_TO_MONTH_OFFSET,
  TERM_VI,
  assertYearSupported,
  termBefore,
  termAfter,
  termEpoch,
  jieBefore,
  jieAfter,
} from './solar-terms.ts';
export type { Term, TermKey } from './solar-terms.ts';

export {
  PROVINCES,
  provinceByCode,
  provinceByName,
  regionOf,
} from './provinces.ts';
export type { Province } from './provinces.ts';

export {
  vnTzOffsetHours,
  regionFromLatitude,
  TZ_HISTORY_NOTES,
} from './vn-tz-history.ts';
export type { Region } from './vn-tz-history.ts';

export {
  equationOfTimeMinutes,
  longitudeCorrectionMinutes,
  trueSolarTime,
} from './true-solar.ts';
export type { TrueSolarResult } from './true-solar.ts';
