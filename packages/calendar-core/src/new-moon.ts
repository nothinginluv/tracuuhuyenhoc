/**
 * Thiên văn cho điểm sóc (new moon).
 *
 * Không phải nguồn chân lý của lịch âm — lịch âm Trung Quốc lấy theo 寿星天文历
 * (bảng dựng sẵn trong data/lunar-months.json). Ở đây chỉ cần:
 *   - instant của điểm sóc, để biết nó rơi vào ngày nào dưới một múi giờ bất kỳ;
 *   - ΔT (TT − UT).
 *
 * Công thức: Meeus, Astronomical Algorithms, ch. 49. Sai số cỡ vài giây đến vài
 * phút tuỳ thời kỳ — đủ để tách múi giờ, không đủ để tự quyết định lịch.
 */

const UNIX_EPOCH_JD = 2_440_587.5;
const MS_PER_DAY = 86_400_000;
const SYNODIC = 29.530588861;
const RAD = Math.PI / 180;

/** ΔT tính bằng giây, theo Espenak & Meeus (NASA). */
export function deltaTSeconds(year: number): number {
  if (year < 1920) {
    const t = year - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (year < 1941) {
    const t = year - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (year < 1961) {
    const t = year - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (year < 1986) {
    const t = year - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (year < 2005) {
    const t = year - 2000;
    return (
      63.86 +
      0.3345 * t -
      0.060374 * t ** 2 +
      0.0017275 * t ** 3 +
      0.000651814 * t ** 4 +
      0.00002373599 * t ** 5
    );
  }
  if (year < 2050) {
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u - 0.5628 * (2150 - year);
}

/** Julian Ephemeris Day của điểm sóc thứ k (k = 0 là sóc đầu năm 2000), đơn vị TT. */
export function newMoonJde(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  let jde =
    2451550.09766 +
    SYNODIC * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * RAD;
  const Mp =
    (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * RAD;
  const F =
    (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * RAD;

  jde +=
    -0.4072 * Math.sin(Mp) +
    0.17241 * E * Math.sin(M) +
    0.01608 * Math.sin(2 * Mp) +
    0.01039 * Math.sin(2 * F) +
    0.00739 * E * Math.sin(Mp - M) -
    0.00514 * E * Math.sin(Mp + M) +
    0.00208 * E * E * Math.sin(2 * M) -
    0.00111 * Math.sin(Mp - 2 * F) -
    0.00057 * Math.sin(Mp + 2 * F) +
    0.00056 * E * Math.sin(2 * Mp + M) -
    0.00042 * Math.sin(3 * Mp) +
    0.00042 * E * Math.sin(M + 2 * F) +
    0.00038 * E * Math.sin(M - 2 * F) -
    0.00024 * E * Math.sin(2 * Mp - M) -
    0.00017 * Math.sin(Om) -
    0.00007 * Math.sin(Mp + 2 * M) +
    0.00004 * Math.sin(2 * Mp - 2 * F) +
    0.00004 * Math.sin(3 * M) +
    0.00003 * Math.sin(Mp + M - 2 * F) +
    0.00003 * Math.sin(2 * Mp + 2 * F) -
    0.00003 * Math.sin(Mp + M + 2 * F) +
    0.00003 * Math.sin(Mp - M + 2 * F) -
    0.00002 * Math.sin(Mp - M - 2 * F) -
    0.00002 * Math.sin(3 * Mp + M) +
    0.00002 * Math.sin(4 * Mp);

  // Hiệu chỉnh hành tinh bổ sung (Meeus 49.1).
  const A: [number, number][] = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.00011],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.00006],
    [154.84 + 7.30686 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.00004],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [angle, coeff] of A) jde += coeff * Math.sin(angle * RAD);

  return jde;
}

/** Instant (epoch ms, UTC) của điểm sóc thứ k. */
export function newMoonInstantMs(k: number): number {
  const approxYear = 2000 + k / 12.3685;
  const jdUt = newMoonJde(k) - deltaTSeconds(approxYear) / 86_400;
  return (jdUt - UNIX_EPOCH_JD) * MS_PER_DAY;
}

/** Ngày Julian địa phương chứa một instant, dưới múi giờ tz. */
export function localDayNumber(epochMs: number, tz: number): number {
  return Math.floor(epochMs / MS_PER_DAY + UNIX_EPOCH_JD + 0.5 + tz / 24);
}

/** Giờ:phút UTC của một instant, dùng để chẩn đoán. */
export function utcClock(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(11, 19);
}

/** Chỉ số k của điểm sóc muộn nhất không sau `dayNumber` (theo múi giờ tz). */
export function newMoonIndexAtOrBefore(dayNumber: number, tz: number): number {
  let k = Math.round((dayNumber - 2451550.09766) / SYNODIC);
  let guard = 0;
  while (localDayNumber(newMoonInstantMs(k), tz) > dayNumber && guard++ < 20) k--;
  guard = 0;
  while (localDayNumber(newMoonInstantMs(k + 1), tz) <= dayNumber && guard++ < 20) k++;
  return k;
}
