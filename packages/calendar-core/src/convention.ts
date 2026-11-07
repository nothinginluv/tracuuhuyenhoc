/** Quy ước tính — mọi lựa chọn có tranh cãi đều nằm ở đây, không giấu trong code. */

/** Đồng hồ dùng để xác định NGÀY và GIỜ của lá số. */
export type Clock =
  /** Giờ Bắc Kinh (UTC+8) — quy ước "chuẩn Trung Quốc". */
  | 'china'
  /** Giờ dân sự tại nơi sinh, dùng múi giờ lịch sử (VN 1960–1975 có khác biệt Bắc/Nam). */
  | 'birthplace'
  /** Giờ mặt trời thật tại kinh độ nơi sinh. */
  | 'true-solar';

/** Ranh giới ngày trong giờ Tý (23:00–01:00). */
export type ZiBoundary =
  /** Đổi ngày lúc 00:00. 23:00–23:59 = Tý muộn, ngày KHÔNG đổi. */
  | 'late'
  /** Đổi ngày lúc 23:00. Toàn bộ 23:00–01:00 thuộc ngày mới. */
  | 'early';

export type TuViSchool = 'tam-hop' | 'trung-chau';

/**
 * Can của trụ giờ khi sinh 23:00–23:59 (Tý muộn).
 *
 * - `current-day`: suy từ can ngày hiện tại. Khớp sách cổ và phần lớn sách Việt.
 * - `next-day`: suy từ can ngày kế tiếp (coi giờ Tý đã thuộc ngày mới).
 *   Đây là cách `lunar-javascript` và nhiều phần mềm Trung Quốc làm.
 *
 * Chỉ có ý nghĩa khi `ziBoundary === 'late'`; với Tý sớm, ngày đã đổi sẵn.
 */
export type HourStemRule = 'current-day' | 'next-day';

export type Convention = {
  clock: Clock;
  ziBoundary: ZiBoundary;
  hourStemRule: HourStemRule;
  tuViSchool: TuViSchool;
};

export const PRESETS = {
  /** Mặc định: khớp phần mềm Trung Quốc và văn bản gốc. */
  'chuan-tq': { clock: 'china', ziBoundary: 'late', hourStemRule: 'current-day', tuViSchool: 'tam-hop' },
  /** Giờ dân sự tại nơi sinh, có xử lý múi giờ lịch sử. */
  'vn-dia-phuong': { clock: 'birthplace', ziBoundary: 'late', hourStemRule: 'current-day', tuViSchool: 'tam-hop' },
  /** Giờ mặt trời thật theo kinh độ. */
  'vn-mat-troi': { clock: 'true-solar', ziBoundary: 'late', hourStemRule: 'current-day', tuViSchool: 'tam-hop' },
  /** Khớp `lunar-javascript`: giờ Tý 23:00 lấy can ngày kế tiếp. */
  'lunar-js': { clock: 'china', ziBoundary: 'late', hourStemRule: 'next-day', tuViSchool: 'tam-hop' },
} satisfies Record<string, Convention>;

export type PresetName = keyof typeof PRESETS;

export const DEFAULT_PRESET: PresetName = 'chuan-tq';

export function resolveConvention(
  spec: PresetName | Partial<Convention> | undefined,
): Convention {
  if (!spec) return PRESETS[DEFAULT_PRESET];
  if (typeof spec === 'string') {
    const p = PRESETS[spec];
    if (!p) throw new Error(`Preset không tồn tại: ${spec}`);
    return { ...p };
  }
  return { ...PRESETS[DEFAULT_PRESET], ...spec };
}

export const CONVENTION_LABELS: Record<Clock, string> = {
  china: 'Giờ Bắc Kinh (UTC+8)',
  birthplace: 'Giờ dân sự nơi sinh (múi giờ lịch sử)',
  'true-solar': 'Giờ mặt trời thật',
};

export const ZI_LABELS: Record<ZiBoundary, string> = {
  late: 'Tý muộn — đổi ngày lúc 00:00',
  early: 'Tý sớm — đổi ngày lúc 23:00',
};

export const HOUR_STEM_LABELS: Record<HourStemRule, string> = {
  'current-day': 'Can giờ suy từ can ngày hiện tại (23:00–23:59)',
  'next-day': 'Can giờ suy từ can ngày kế tiếp (23:00–23:59)',
};
