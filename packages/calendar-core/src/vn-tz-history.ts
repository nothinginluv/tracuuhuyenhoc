/**
 * Múi giờ lịch sử Việt Nam.
 *
 * KHÔNG dùng Intl / tzdata: IANA chỉ có Asia/Ho_Chi_Minh và nó mô hình lịch sử
 * miền NAM (UTC+8 tới 1975). Với người sinh ở miền Bắc trước 1975, Intl trả +8
 * trong khi thực tế là +7 — lệch 1 giờ, đủ để đổi trụ giờ.
 *
 * Bảng dùng ở đây:
 *   trước 01/01/1960            : cả nước UTC+7
 *   01/01/1960 – 12/06/1975     : Bắc UTC+7, Nam UTC+8
 *   từ 13/06/1975               : cả nước UTC+7
 *
 * Ranh giới lấy theo mức ngày (không theo giờ) — sai số tối đa 1 giờ trong đúng
 * ngày chuyển múi giờ, và được ghi nhận như một hạn chế đã biết.
 */

export type Region = 'bac' | 'nam';

/** Mốc UTC (00:00) bắt đầu giai đoạn miền Nam dùng UTC+8. */
const NAM_8_START = Date.UTC(1960, 0, 1);
/** Mốc UTC (00:00) bắt đầu giai đoạn cả nước trở lại UTC+7. */
const NAM_8_END = Date.UTC(1975, 5, 13);

export const TZ_HISTORY_NOTES = {
  south8Start: '1960-01-01',
  south8End: '1975-06-12',
  source: 'Time in Vietnam (Wikipedia); IANA tz mailing list — Hanoi: UTC+7, Saigon: UTC+8 tới 1975',
} as const;

/** Độ lệch múi giờ (giờ) của một địa điểm tại một instant. */
export function vnTzOffsetHours(instantMs: number, region: Region): number {
  if (instantMs < NAM_8_START || instantMs >= NAM_8_END) return 7;
  return region === 'nam' ? 8 : 7;
}

/** Miền theo vĩ độ — dùng khi không có dữ liệu tỉnh. */
export function regionFromLatitude(lat: number): Region {
  return lat < 17 ? 'nam' : 'bac';
}
