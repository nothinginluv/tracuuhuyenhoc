/**
 * Giờ mặt trời thật (真太陽時).
 *
 * Hai thành phần:
 *   1. Hiệu chỉnh kinh độ: mỗi độ lệch so với kinh tuyến gốc của múi giờ = 4 phút.
 *   2. Equation of time: chênh lệch giữa mặt trời trung bình và mặt trời thật,
 *      dao động ±16 phút theo mùa.
 *
 * Công thức EoT theo NOAA (xấp xỉ, sai số < 1 phút trong 1900–2100).
 */

const DAY_MS = 86_400_000;

/** Ngày trong năm (1..365/366), theo giờ UTC. */
function dayOfYear(instantMs: number): number {
  const d = new Date(instantMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.floor((instantMs - start) / DAY_MS) + 1;
}

/** Equation of time (phút). Dương = mặt trời thật nhanh hơn đồng hồ. */
export function equationOfTimeMinutes(instantMs: number): number {
  const n = dayOfYear(instantMs);
  const B = (2 * Math.PI * (n - 81)) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** Hiệu chỉnh kinh độ (phút). Kinh tuyến gốc của múi giờ = 15° × offset. */
export function longitudeCorrectionMinutes(lon: number, tzOffsetHours: number): number {
  return (lon - 15 * tzOffsetHours) * 4;
}

export type TrueSolarResult = {
  /** Tổng hiệu chỉnh so với giờ đồng hồ (phút). */
  totalCorrectionMin: number;
  longitudeMin: number;
  eotMin: number;
  /** Giờ mặt trời thật, đã chuẩn hoá về 0..1439. */
  minutesOfDay: number;
  /** Số ngày lệch so với ngày dân sự (có thể −1, 0, +1). */
  dayShift: number;
};

/**
 * @param civilMinutes giờ:phút dân sự tính bằng phút từ 00:00
 * @param tzOffsetHours độ lệch múi giờ dân sự đang dùng
 */
export function trueSolarTime(
  instantMs: number,
  civilMinutes: number,
  lon: number,
  tzOffsetHours: number,
): TrueSolarResult {
  const longitudeMin = longitudeCorrectionMinutes(lon, tzOffsetHours);
  const eotMin = equationOfTimeMinutes(instantMs);
  const totalCorrectionMin = longitudeMin + eotMin;
  const raw = civilMinutes + totalCorrectionMin;
  const dayShift = Math.floor(raw / 1440);
  const minutesOfDay = ((raw % 1440) + 1440) % 1440;
  return { totalCorrectionMin, longitudeMin, eotMin, minutesOfDay, dayShift };
}
