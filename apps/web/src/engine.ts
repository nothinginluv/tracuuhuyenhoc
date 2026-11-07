/**
 * Cầu nối duy nhất giữa giao diện và các engine.
 *
 * Giao diện không tự tính gì. Mọi con số hiển thị đều đến từ `calendar-core`,
 * `tuvi-engine`, `bazi-engine` — ba gói đã có test và đối chứng độc lập.
 */
import {
  PRESETS,
  buildChartContext,
  type BirthInput,
  type ChartContext,
  type Convention,
  type PresetName,
} from '../../../packages/calendar-core/src/index.ts';
import {
  buildTuViChart,
  hourBranchOf,
  tuViBirthFromContext,
  type TuViChart,
  type TuViOptions,
} from '../../../packages/tuvi-engine/src/index.ts';
import {
  buildBaziChart,
  type BaziChart,
  type Gender,
} from '../../../packages/bazi-engine/src/index.ts';

export type ConventionOverrides = Partial<
  Pick<Convention, 'clock' | 'ziBoundary' | 'hourStemRule' | 'tuViSchool'>
>;

export type ComputeOptions = {
  preset: PresetName;
  gender: Gender;
  /** Số đại vận liệt kê. */
  luckCount?: number;
  tuvi?: TuViOptions;
  /** Ghi đè từng quy ước sau khi đã lấy preset làm gốc. */
  convention?: ConventionOverrides;
};

export type ComputeResult = {
  ctx: ChartContext;
  /** null khi năm âm lịch nằm ngoài phạm vi an sao (trước Tết 1900). */
  tuvi: TuViChart | null;
  /** Lá số đối chiếu theo âm lịch Việt Nam (UTC+7); null khi hai lịch trùng nhau. */
  tuviVn: TuViChart | null;
  /** Lý do Tử Vi không dựng được; null khi thành công. */
  tuviError: string | null;
  bazi: BaziChart;
};

export function computeCharts(input: BirthInput, options: ComputeOptions): ComputeResult {
  const convention: Convention = { ...PRESETS[options.preset], ...options.convention };
  const ctx = buildChartContext(input, convention);
  const tuviOptions: TuViOptions = {
    leapMonthRule: 'split',
    mutagenTable: 'nam-phai',
    ...options.tuvi,
  };

  let tuvi: TuViChart | null = null;
  let tuviError: string | null = null;
  try {
    tuvi = buildTuViChart(tuViBirthFromContext(ctx), tuviOptions);
  } catch (err) {
    tuviError = err instanceof Error ? err.message : String(err);
  }

  let tuviVn: TuViChart | null = null;
  if (ctx.lunar.diverges) {
    try {
      tuviVn = buildTuViChart(
        {
          lunarYear: ctx.lunar.vn.year,
          lunarMonth: ctx.lunar.vn.month,
          lunarDay: ctx.lunar.vn.day,
          lunarLeap: ctx.lunar.vn.leap,
          hourBranch: hourBranchOf(ctx.clock.wall.hour),
        },
        tuviOptions,
      );
    } catch {
      tuviVn = null;
    }
  }

  const bazi = buildBaziChart(ctx, {
    gender: options.gender,
    luckCount: options.luckCount ?? 8,
  });

  return { ctx, tuvi, tuviVn, tuviError, bazi };
}
