/**
 * Âm lịch có tham số múi giờ.
 *
 * Ngày tháng âm lịch lấy từ `data/lunar-months.json` — bảng dựng từ 寿星天文历
 * (qua lunar-javascript), tức đúng chuẩn lịch Trung Quốc mà dự án viện dẫn.
 *
 * Vì sao không tự tính bằng công thức Hồ Ngọc Đức: dạng sóc rút gọn của nó sai
 * tới hàng chục phút, đủ để lệch một ngày khi sóc rơi sát nửa đêm. Ca thật đã
 * gặp: 05/03/1924 lệch đúng 1 ngày so với lịch Trung Quốc.
 *
 * Vì sao vẫn cần thiên văn: ngày bắt đầu tháng phụ thuộc múi giờ. Với UTC+7
 * (Việt Nam), tháng có thể bắt đầu sớm hơn UTC+8 một ngày. Instant điểm sóc
 * (Meeus) cho biết điều đó mà không cần bảng riêng cho từng múi giờ.
 */
import data from '../data/lunar-months.json' with { type: 'json' };
import { jdFromDate } from './jdn.ts';
import { localDayNumber } from './new-moon.ts';

export type LunarDate = {
  year: number;
  month: number;
  day: number;
  leap: boolean;
  /** Chỉ số 0–59 của năm âm lịch trong vòng Giáp Tý. */
  yearCycleIndex: number;
};

type MonthStart = {
  /** Julian Day Number của ngày mùng 1, theo giờ Bắc Kinh (UTC+8). */
  jdn: number;
  year: number;
  month: number;
  leap: boolean;
  /** Instant điểm sóc (epoch ms). null khi công thức Meeus lệch ngày. */
  utcMs: number | null;
};

type MonthsFile = {
  fromYear: number;
  toYear: number;
  count: number;
  starts: MonthStart[];
};

const FILE = data as unknown as MonthsFile;
const STARTS: readonly MonthStart[] = FILE.starts;

export const LUNAR_TABLE_RANGE = { fromYear: FILE.fromYear, toYear: FILE.toYear, months: FILE.count };

/** Ngày bắt đầu tháng dưới một múi giờ. Chỉ lệch 0 hoặc −1 ngày so với UTC+8. */
function startDayIn(entry: MonthStart, tz: number): number {
  if (tz === 8 || entry.utcMs == null) return entry.jdn;
  const beijing = localDayNumber(entry.utcMs, 8);
  return entry.jdn + (localDayNumber(entry.utcMs, tz) - beijing);
}

const startCache = new Map<number, number[]>();

function startsForTz(tz: number): number[] {
  const hit = startCache.get(tz);
  if (hit) return hit;
  const arr = STARTS.map((e) => startDayIn(e, tz));
  startCache.set(tz, arr);
  return arr;
}

/** Chỉ số tháng chứa `dayNumber` (JDN địa phương), hoặc −1 nếu ngoài bảng. */
function findMonthIndex(dayNumber: number, tz: number): number {
  const arr = startsForTz(tz);
  let lo = 0;
  let hi = arr.length - 1;
  if (dayNumber < arr[0]) return -1;
  if (dayNumber > arr[hi] + 30) return -1;
  let idx = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= dayNumber) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return idx;
}

/**
 * Dương lịch → âm lịch.
 * @param tz múi giờ dạng số giờ (Việt Nam 7, Trung Quốc 8, miền Nam VN 1960–1975 là 8).
 */
export function solarToLunar(d: number, m: number, y: number, tz: number): LunarDate {
  const day = jdFromDate(d, m, y);
  const idx = findMonthIndex(day, tz);
  if (idx < 0) {
    throw new RangeError(
      `Ngày ${d}/${m}/${y} nằm ngoài bảng tháng âm lịch (${FILE.fromYear}–${FILE.toYear})`,
    );
  }

  const entry = STARTS[idx];
  const start = startsForTz(tz)[idx];
  const dayOfMonth = day - start + 1;
  if (dayOfMonth < 1 || dayOfMonth > 30) {
    throw new Error(`Ngày ${d}/${m}/${y} cho ra ngày âm lịch vô lý: ${dayOfMonth}`);
  }

  return {
    year: entry.year,
    month: entry.month,
    day: dayOfMonth,
    leap: entry.leap,
    yearCycleIndex: (((entry.year - 4) % 60) + 60) % 60,
  };
}

/**
 * Âm lịch tại một instant, dưới một múi giờ cho trước.
 *
 * Đây là hàm đúng để dùng: điểm sóc và điểm tiết đều là instant, nên "hôm nay là
 * mùng mấy âm lịch" chỉ trả lời được khi biết múi giờ đang xét.
 */
export function lunarAtInstant(instantMs: number, tzOffsetHours: number): LunarDate {
  const d = new Date(instantMs + tzOffsetHours * 3_600_000);
  return solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear(), tzOffsetHours);
}

/**
 * Hai lịch âm có lệch nhau vào cùng một ngày dương lịch không?
 *
 * Lưu ý: đây là so sánh "cùng ngày dương lịch, hai múi giờ". Khác với so sánh
 * "cùng instant, hai múi giờ" (dùng trong `buildChartContext`), vốn lệch thường
 * xuyên hơn vì một instant có thể rơi vào hai ngày dương lịch khác nhau.
 */
export function lunarDivergesOn(d: number, m: number, y: number): boolean {
  const vn = solarToLunar(d, m, y, 7);
  const cn = solarToLunar(d, m, y, 8);
  return vn.year !== cn.year || vn.month !== cn.month || vn.day !== cn.day || vn.leap !== cn.leap;
}
