/**
 * Julian Day Number — trục thời gian thiên văn, không phụ thuộc múi giờ.
 * Dùng để tính can chi ngày và làm nền cho thuật toán âm lịch.
 */

/** Ngày dương lịch -> JDN (12:00 trưa). */
export function jdFromDate(d: number, m: number, y: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jd =
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045;
  if (jd < 2299161) {
    jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
  }
  return jd;
}

/** JDN -> ngày dương lịch. */
export function jdToDate(jd: number): { d: number; m: number; y: number } {
  let a: number;
  let b: number;
  let c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((146097 * b) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * m + 2) / 5) + 1,
    m: m + 3 - 12 * Math.floor(m / 10),
    y: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

/** Chỉ số can chi của ngày (0 = Giáp Tý). Kiểm chứng: 2024-02-04 -> 戊戌 (34). */
export function dayCycleIndex(jdn: number): number {
  return (((jdn + 49) % 60) + 60) % 60;
}

/** Ngày dương lịch -> số ngày kể từ epoch Unix (bỏ giờ). */
export function epochDayFromDate(y: number, m: number, d: number): number {
  return jdFromDate(d, m, y) - 2440588;
}

export function dateFromEpochDay(epochDay: number): { d: number; m: number; y: number } {
  return jdToDate(epochDay + 2440588);
}
