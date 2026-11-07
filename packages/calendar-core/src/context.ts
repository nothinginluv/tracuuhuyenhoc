/**
 * Lắp ráp toàn bộ ngữ cảnh của một lá số: instant → đồng hồ → âm lịch → tứ trụ.
 *
 * Nguyên tắc xuyên suốt: người dùng nhập GIỜ ĐỒNG HỒ tại nơi sinh (đó là thứ duy
 * nhất họ biết). Từ đó suy ra instant vật lý. Mọi thứ còn lại — ngày nào, giờ nào,
 * tháng nào — đều là hệ quả của một quy ước, và quy ước đó nằm trong `Convention`,
 * không giấu trong code.
 */
import { dayCycleIndex, jdFromDate, jdToDate } from './jdn.ts';
import { lunarAtInstant, type LunarDate } from './lunar.ts';
import { JIE_TO_MONTH_OFFSET, jieBefore, termAfter, termEpoch, type Term } from './solar-terms.ts';
import { regionFromLatitude, vnTzOffsetHours, type Region } from './vn-tz-history.ts';
import { trueSolarTime } from './true-solar.ts';
import { provinceByCode, provinceByName, regionOf, type Province } from './provinces.ts';
import {
  CONVENTION_LABELS,
  resolveConvention,
  type Clock,
  type Convention,
  type HourStemRule,
  type PresetName,
  type ZiBoundary,
} from './convention.ts';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const STEMS_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const BRANCHES_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const mod = (n: number, m: number): number => ((n % m) + m) % m;

// ─────────────────────────────────────────────────────────── kiểu dữ liệu

export type BirthInput = {
  /** Ngày dương lịch trên đồng hồ nơi sinh. */
  year: number;
  /** 1–12. */
  month: number;
  /** 1–31. */
  day: number;
  /** 0–23. */
  hour: number;
  /** 0–59. */
  minute?: number;
  /** Mã tỉnh (vd "01") hoặc tên tỉnh (vd "Hà Nội"). */
  province?: string;
  /** Bắt buộc với tỉnh bị chia (Quảng Trị 1960–1975): "Vĩnh Linh" hoặc tên huyện khác. */
  district?: string;
  /** Ghi đè toạ độ chính xác (độ thập phân). */
  latitude?: number;
  longitude?: number;
  /** Ghi đè múi giờ dân sự tại nơi sinh, tính bằng giờ. */
  utcOffsetHours?: number;
};

export type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type Pillar = {
  /** Chỉ số 0–59 trong vòng Giáp Tý. */
  cycleIndex: number;
  /** 0–9 (0 = Giáp). */
  stem: number;
  /** 0–11 (0 = Tý). */
  branch: number;
  /** Dạng tiếng Việt, vd "Giáp Tý". */
  vi: string;
  /** Dạng chữ Hán, vd "甲子". */
  zh: string;
};

export type Pillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
};

export type WarningCode =
  | 'calendar-divergence'
  | 'zi-boundary'
  | 'jie-proximity'
  | 'tz-boundary'
  | 'coords-approximate'
  | 'historical-tz-note'
  | 'leap-month'
  | 'zi-day-shift';

export type Warning = {
  code: WarningCode;
  /** "info" = thông tin; "warn" = có thể đổi kết quả. */
  severity: 'info' | 'warn';
  message: string;
};

export type ChartContext = {
  input: BirthInput;
  convention: Convention;
  conventionLabel: string;
  /** Instant vật lý của thời điểm sinh. */
  instantMs: number;
  utcIso: string;
  /** Giờ dân sự đã nhập, không diễn giải gì thêm. */
  civilWall: WallTime;
  tz: {
    offsetHours: number;
    /** Miền dùng để tra múi giờ lịch sử. null khi không xác định được tỉnh. */
    region: Region | null;
    province: string | null;
    /** true khi múi giờ lấy từ bảng lịch sử, false khi người dùng ghi đè. */
    fromTable: boolean;
    /** Điểm đại diện tỉnh lỵ, không phải nơi sinh chính xác. */
    approximateCoords: boolean;
  };
  geo: {
    latitude: number | null;
    longitude: number | null;
  };
  clock: {
    used: Clock;
    label: string;
    /** Giờ dùng để an sao — sau khi đổi đồng hồ / đổi ngày. */
    wall: WallTime;
    /** Tổng dịch chuyển so với giờ dân sự đã nhập, tính bằng phút. */
    shiftMinutes: number;
    /** Dịch chuyển ngày do giờ mặt trời thật (thường −1, 0, +1). */
    solarDayShift: number;
    /** Dịch chuyển ngày do quy ước Tý sớm. */
    ziDayShift: number;
    solarCorrection: { totalMin: number; longitudeMin: number; eotMin: number } | null;
  };
  lunar: {
    /** Lịch âm Trung Quốc (UTC+8) — chuẩn dùng để an sao Tử Vi. */
    cn: LunarDate;
    /** Lịch âm Việt Nam hiện đại (UTC+7). */
    vn: LunarDate;
    /** Hai lịch cho ra ngày khác nhau tại instant này. */
    diverges: boolean;
  };
  pillars: Pillars;
  jie: {
    current: Term;
    next: Term | null;
    minutesSince: number;
    minutesUntilNext: number | null;
  };
  warnings: Warning[];
};

export class BirthInputError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BirthInputError';
    this.code = code;
  }
}

// ─────────────────────────────────────────────────── tiện ích thời gian

export function wallFromInstant(instantMs: number, offsetHours: number): WallTime {
  const d = new Date(instantMs + offsetHours * HOUR_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** Cộng/trừ ngày trên lịch dương, giữ nguyên giờ. */
export function shiftWallDays(wall: WallTime, days: number): WallTime {
  if (days === 0) return wall;
  const { d, m, y } = jdToDate(jdFromDate(wall.day, wall.month, wall.year) + days);
  return { ...wall, year: y, month: m, day: d };
}

export function wallToUtcMs(wall: WallTime): number {
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, 0, 0);
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function formatWall(w: WallTime): string {
  return `${pad2(w.hour)}:${pad2(w.minute)} ${pad2(w.day)}/${pad2(w.month)}/${w.year}`;
}

// ────────────────────────────────────────────────── kiểm tra đầu vào

function validateInput(input: BirthInput): void {
  const ints: [keyof BirthInput, number, number, number][] = [
    ['year', input.year, 1900, 2100],
    ['month', input.month, 1, 12],
    ['day', input.day, 1, 31],
    ['hour', input.hour, 0, 23],
  ];
  for (const [name, value, lo, hi] of ints) {
    if (!Number.isInteger(value) || value < lo || value > hi) {
      throw new BirthInputError('invalid-input', `${name} phải là số nguyên trong ${lo}–${hi}, nhận ${value}`);
    }
  }
  const minute = input.minute ?? 0;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new BirthInputError('invalid-input', `minute phải là số nguyên trong 0–59, nhận ${minute}`);
  }
  // Ngày không tồn tại (31/02) sẽ bị Date chuẩn hoá — phát hiện bằng cách so lại.
  const probe = new Date(Date.UTC(input.year, input.month - 1, input.day));
  if (probe.getUTCDate() !== input.day || probe.getUTCMonth() !== input.month - 1) {
    throw new BirthInputError(
      'invalid-date',
      `Ngày ${input.day}/${input.month}/${input.year} không tồn tại trên lịch dương`,
    );
  }
}

// ────────────────────────────────────────────── giải múi giờ (2 lượt)

type OffsetResolution = {
  offsetHours: number;
  instantMs: number;
  stable: boolean;
  /** Các mốc múi giờ đã thử, dùng để cảnh báo quanh ranh giới đổi giờ. */
  tried: number[];
};

/**
 * Múi giờ phụ thuộc instant, mà instant lại phụ thuộc múi giờ. Giải bằng lặp
 * điểm bất động: đoán → tính instant → tra lại → nếu đổi thì lặp.
 *
 * Không hội tụ chỉ xảy ra trong đúng khoảng vài giờ quanh mốc đổi múi giờ
 * (01/01/1960 và 13/06/1975) — khi đó trả về kèm cờ `stable: false`.
 */
export function resolveOffset(hourWallMs: number, region: Region): OffsetResolution {
  let offset = vnTzOffsetHours(hourWallMs, region);
  const tried: number[] = [offset];
  for (let i = 0; i < 4; i++) {
    const instant = hourWallMs - offset * HOUR_MS;
    const next = vnTzOffsetHours(instant, region);
    if (next === offset) {
      return { offsetHours: offset, instantMs: instant, stable: true, tried };
    }
    offset = next;
    tried.push(offset);
  }
  return {
    offsetHours: tried[0],
    instantMs: hourWallMs - tried[0] * HOUR_MS,
    stable: false,
    tried,
  };
}

// ─────────────────────────────────────────────────────────── tứ trụ

function pillarOf(cycleIndex: number): Pillar {
  const stem = mod(cycleIndex, 10);
  const branch = mod(cycleIndex, 12);
  return {
    cycleIndex: mod(cycleIndex, 60),
    stem,
    branch,
    vi: `${STEMS_VI[stem]} ${BRANCHES_VI[branch]}`,
    zh: `${STEMS_ZH[stem]}${BRANCHES_ZH[branch]}`,
  };
}

export type PillarOptions = {
  /** Instant dùng để so với tiết khí (trụ năm, trụ tháng). */
  instantMs: number;
  /** Giờ đã quy ước, dùng để xác định ngày và canh giờ. */
  wall: WallTime;
  ziBoundary: ZiBoundary;
  /** Mặc định `current-day`. */
  hourStemRule?: HourStemRule;
};

/**
 * Tứ trụ từ một mốc thời gian đã quy ước.
 *
 * - Trụ năm: đổi tại instant Lập Xuân, không phải 01/01.
 * - Trụ tháng: đổi tại 12 "tiết" (節), so theo instant.
 * - Trụ ngày: vòng 60 hoa giáp trên JDN; Tý sớm cộng 1 ngày khi 23:00–23:59.
 * - Trụ giờ: 五鼠遁 từ can ngày.
 */
export function computePillars({ instantMs, wall, ziBoundary, hourStemRule = 'current-day' }: PillarOptions): {
  pillars: Pillars;
  jie: { current: Term; next: Term | null; minutesSince: number; minutesUntilNext: number | null };
  ziDayShift: number;
} {
  // 1. Ngày hiệu dụng.
  let jdn = jdFromDate(wall.day, wall.month, wall.year);
  const ziDayShift = ziBoundary === 'early' && wall.hour === 23 ? 1 : 0;
  jdn += ziDayShift;

  // 2. Trụ năm — mốc là instant Lập Xuân.
  const lichun = termEpoch(wall.year, 'lichun');
  const solarYear = instantMs >= lichun ? wall.year : wall.year - 1;
  const yearIndex = mod(solarYear - 4, 60);

  // 3. Trụ tháng — mốc là "tiết" gần nhất đã qua.
  const jie = jieBefore(instantMs);
  const monthOffset = JIE_TO_MONTH_OFFSET[jie.key]; // 0 = Dần
  const monthBranch = mod(monthOffset + 2, 12);
  // 五虎遁: Giáp/Kỷ năm khởi tháng Dần bằng Bính.
  const yearStem = mod(yearIndex, 10);
  const monthStem = mod(yearStem * 2 + 2 + monthOffset, 10);
  const monthIndex = cycleOf(monthStem, monthBranch);

  // 4. Trụ ngày.
  const dayIndex = dayCycleIndex(jdn);

  // 5. Trụ giờ — 五鼠遁.
  const hourBranch = Math.floor((wall.hour + 1) / 2) % 12;
  // Tý muộn + quy ước "ngày kế tiếp": can giờ lấy từ can của ngày mai.
  const stemSourceIndex = hourStemRule === 'next-day' && ziDayShift === 0 && wall.hour === 23
    ? dayIndex + 1
    : dayIndex;
  const hourStem = mod(mod(stemSourceIndex, 10) * 2 + hourBranch, 10);

  const next = termAfter(instantMs);

  return {
    pillars: {
      year: pillarOf(yearIndex),
      month: pillarOf(monthIndex),
      day: pillarOf(dayIndex),
      hour: pillarOf(cycleOf(hourStem, hourBranch)),
    },
    jie: {
      current: jie,
      next,
      minutesSince: Math.round((instantMs - jie.epoch) / MINUTE_MS),
      minutesUntilNext: next ? Math.round((next.epoch - instantMs) / MINUTE_MS) : null,
    },
    ziDayShift: wall.hour === 23 ? ziDayShift : 0,
  };
}

/**
 * Chỉ số 60 của một can chi từ can và chi đã biết.
 * Nghiệm của hệ: k ≡ stem (mod 10), k ≡ branch (mod 12).
 */
function cycleOf(stem: number, branch: number): number {
  for (let k = stem; k < 60; k += 10) {
    if (k % 12 === branch) return k;
  }
  throw new Error(`Không có can chi hợp lệ cho can ${stem}, chi ${branch}`);
}

// ──────────────────────────────────────────────────── tra tỉnh / miền

type GeoResolution = {
  province: Province | null;
  region: Region | null;
  latitude: number | null;
  longitude: number | null;
  approximateCoords: boolean;
};

function resolveGeo(input: BirthInput): GeoResolution {
  let province: Province | null = null;
  if (input.province) {
    province = provinceByCode(input.province) ?? provinceByName(input.province) ?? null;
    if (!province) {
      throw new BirthInputError('unknown-province', `Không có tỉnh "${input.province}" trong danh mục 63 tỉnh`);
    }
  }

  let region: Region | null = null;
  if (province) {
    region = regionOf(province, input.district);
    if (region === null) {
      throw new BirthInputError(
        'district-required',
        `${province.name} bị chia đôi ở vĩ tuyến 17 trong giai đoạn 1960–1975. ` +
          'Cần biết huyện nơi sinh (ví dụ "Vĩnh Linh") để chọn đúng múi giờ.',
      );
    }
  } else if (input.latitude != null) {
    region = regionFromLatitude(input.latitude);
  }

  const hasOwnCoords = input.latitude != null && input.longitude != null;
  if (input.latitude != null && !Number.isFinite(input.latitude)) {
    throw new BirthInputError('invalid-input', 'latitude phải là số');
  }
  if (input.longitude != null && !Number.isFinite(input.longitude)) {
    throw new BirthInputError('invalid-input', 'longitude phải là số');
  }

  const latitude = input.latitude ?? province?.lat ?? null;
  const longitude = input.longitude ?? province?.lon ?? null;

  return {
    province,
    region,
    latitude,
    longitude,
    approximateCoords: !hasOwnCoords && province != null,
  };
}

// ──────────────────────────────────────────────────── dựng ngữ cảnh

export function buildChartContext(
  input: BirthInput,
  conventionSpec?: PresetName | Partial<Convention>,
): ChartContext {
  validateInput(input);
  const convention = resolveConvention(conventionSpec);
  const warnings: Warning[] = [];

  const civilWall: WallTime = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute ?? 0,
  };
  const civilWallMs = wallToUtcMs(civilWall);

  // ── 1. Toạ độ + miền ──────────────────────────────────────
  const geo = resolveGeo(input);
  if (geo.approximateCoords) {
    const split = geo.province?.mien_1960_1975 === 'chia';
    warnings.push({
      code: 'coords-approximate',
      severity: 'info',
      message: split
        ? `${geo.province!.name} vắt qua vĩ tuyến 17 và toạ độ đang dùng là của tỉnh lỵ ${geo.province!.capital}. ` +
          'Nơi sinh thực tế có thể cách xa hàng chục km — hãy nhập kinh độ chính xác nếu biết, vì giờ mặt trời thật sai ~4 phút mỗi độ.'
        : `Toạ độ lấy theo tỉnh lỵ ${geo.province!.capital} (${geo.latitude!.toFixed(2)}°, ${geo.longitude!.toFixed(2)}°). ` +
          'Nếu biết nơi sinh chính xác, nhập kinh độ để giờ mặt trời thật chuẩn hơn (sai số ~4 phút mỗi độ).',
    });
  }
  if (!geo.province && input.utcOffsetHours == null) {
    warnings.push({
      code: 'historical-tz-note',
      severity: 'info',
      message: 'Không có tỉnh nơi sinh — mặc định múi giờ UTC+7 cho giai đoạn 1960–1975.',
    });
  }

  // ── 2. Múi giờ + instant ──────────────────────────────────
  let offsetHours: number;
  let instantMs: number;
  let fromTable: boolean;

  if (input.utcOffsetHours != null) {
    offsetHours = input.utcOffsetHours;
    instantMs = civilWallMs - offsetHours * HOUR_MS;
    fromTable = false;
  } else {
    const region: Region = geo.region ?? 'bac';
    const resolved = resolveOffset(civilWallMs, region);
    offsetHours = resolved.offsetHours;
    instantMs = resolved.instantMs;
    fromTable = true;
    if (!resolved.stable || resolved.tried.length > 2) {
      warnings.push({
        code: 'tz-boundary',
        severity: 'warn',
        message:
          `Thời điểm sinh nằm sát mốc đổi múi giờ (${resolved.tried.join(' → ')} giờ). ` +
          'Múi giờ lịch sử không xác định dứt khoát trong khoảng vài giờ quanh mốc này; ' +
          'nên kiểm tra lại giờ sinh ghi trên giấy tờ.',
      });
    }
    if (region === 'nam' && instantMs >= Date.UTC(1960, 0, 1) && instantMs < Date.UTC(1975, 5, 13)) {
      warnings.push({
        code: 'historical-tz-note',
        severity: 'info',
        message:
          'Miền Nam Việt Nam dùng UTC+8 (giờ Hồng Kông) từ 1960 đến 12/06/1975. ' +
          'Giờ trên giấy tờ giai đoạn này thường đã là giờ UTC+8, không phải UTC+7.',
      });
    }
  }

  // ── 3. Đồng hồ dùng để an sao ─────────────────────────────
  let usedWall: WallTime;
  let solarCorrection: ChartContext['clock']['solarCorrection'] = null;
  let solarDayShift = 0;
  let shiftMinutes = 0;

  switch (convention.clock) {
    case 'china': {
      usedWall = wallFromInstant(instantMs, 8);
      shiftMinutes = Math.round((8 - offsetHours) * 60);
      break;
    }
    case 'birthplace': {
      usedWall = civilWall;
      break;
    }
    case 'true-solar': {
      if (geo.longitude == null) {
        throw new BirthInputError(
          'longitude-required',
          'Quy ước giờ mặt trời thật cần kinh độ nơi sinh. Hãy chọn tỉnh hoặc nhập kinh độ.',
        );
      }
      const civilMinutes = civilWall.hour * 60 + civilWall.minute;
      const solar = trueSolarTime(instantMs, civilMinutes, geo.longitude, offsetHours);
      solarCorrection = {
        totalMin: Math.round(solar.totalCorrectionMin * 10) / 10,
        longitudeMin: Math.round(solar.longitudeMin * 10) / 10,
        eotMin: Math.round(solar.eotMin * 10) / 10,
      };
      solarDayShift = solar.dayShift;
      shiftMinutes = Math.round(solar.totalCorrectionMin);
      const base = shiftWallDays(civilWall, solar.dayShift);
      usedWall = {
        ...base,
        hour: Math.floor(solar.minutesOfDay / 60),
        minute: Math.floor(solar.minutesOfDay % 60),
      };
      break;
    }
  }

  // ── 4. Tứ trụ ─────────────────────────────────────────────
  const { pillars, jie, ziDayShift } = computePillars({
    instantMs,
    wall: usedWall,
    ziBoundary: convention.ziBoundary,
    hourStemRule: convention.hourStemRule,
  });

  // ── 5. Âm lịch: Trung Quốc (+8) và Việt Nam (+7) ─────────
  const lunarCn = lunarAtInstant(instantMs, 8);
  const lunarVn = lunarAtInstant(instantMs, 7);
  const diverges =
    lunarCn.year !== lunarVn.year ||
    lunarCn.month !== lunarVn.month ||
    lunarCn.day !== lunarVn.day ||
    lunarCn.leap !== lunarVn.leap;

  if (diverges) {
    warnings.push({
      code: 'calendar-divergence',
      severity: 'warn',
      message:
        `Lịch âm Trung Quốc (UTC+8) và Việt Nam (UTC+7) cho hai ngày khác nhau tại instant này: ` +
        `TQ ${lunarCn.day}/${lunarCn.month}${lunarCn.leap ? ' nhuận' : ''}, VN ${lunarVn.day}/${lunarVn.month}${lunarVn.leap ? ' nhuận' : ''}. ` +
        'Lá số Tử Vi an theo lịch Trung Quốc; nếu thấy khác app Việt Nam, đây là lý do.',
    });
  }

  // ── 6. Cảnh báo quy ước ──────────────────────────────────
  if (usedWall.hour === 23 || usedWall.hour < 1) {
    const clock = `${pad2(usedWall.hour)}:${pad2(usedWall.minute)}`;
    let detail: string;
    if (convention.ziBoundary === 'late') {
      detail =
        usedWall.hour === 23
          ? `Quy ước Tý muộn: ngày chỉ đổi lúc 00:00, nên ${clock} vẫn thuộc ngày ${pad2(usedWall.day)}/${pad2(usedWall.month)}. ` +
            'Chọn "Tý sớm" sẽ cho trụ ngày khác.'
          : `Quy ước Tý muộn: ngày đã đổi lúc 00:00, nên ${clock} đã thuộc ngày ${pad2(usedWall.day)}/${pad2(usedWall.month)}. ` +
            'Chọn "Tý sớm" không đổi gì ở khung 00:00–00:59.';
    } else {
      detail = `Quy ước Tý sớm: ngày đã đổi từ 23:00, nên ${clock} thuộc ngày ${pad2(usedWall.day)}/${pad2(usedWall.month)}.`;
    }
    warnings.push({ code: 'zi-boundary', severity: 'info', message: `Sinh trong giờ Tý (${clock}). ${detail}` });
  }

  if (ziDayShift === 1) {
    warnings.push({
      code: 'zi-day-shift',
      severity: 'info',
      message: 'Quy ước Tý sớm đã cộng 1 ngày vào trụ ngày cho giờ sinh 23:00–23:59.',
    });
  }

  if (Math.abs(jie.minutesSince) < 120 || (jie.minutesUntilNext != null && jie.minutesUntilNext < 120)) {
    const term = jie.minutesSince < 0 || (jie.minutesUntilNext ?? Infinity) < 120 ? jie.next ?? jie.current : jie.current;
    warnings.push({
      code: 'jie-proximity',
      severity: 'warn',
      message:
        `Sinh cách mốc tiết khí "${term.zh}" chưa tới 2 giờ. Trụ tháng (và có thể cả trụ năm) rất nhạy với ` +
        'sai số giờ sinh — chỉ cần lệch vài phút là đổi tháng.',
    });
  }

  if (lunarCn.leap || lunarVn.leap) {
    warnings.push({
      code: 'leap-month',
      severity: 'info',
      message: `Tháng âm lịch là tháng nhuận (${lunarCn.leap ? 'theo lịch TQ' : 'theo lịch VN'}). ` +
        'An sao Tử Vi tháng nhuận có nhiều trường phái xử lý khác nhau.',
    });
  }

  return {
    input,
    convention,
    conventionLabel: CONVENTION_LABELS[convention.clock],
    instantMs,
    utcIso: new Date(instantMs).toISOString(),
    civilWall,
    tz: {
      offsetHours,
      region: geo.region,
      province: geo.province?.name ?? null,
      fromTable,
      approximateCoords: geo.approximateCoords,
    },
    geo: { latitude: geo.latitude, longitude: geo.longitude },
    clock: {
      used: convention.clock,
      label: CONVENTION_LABELS[convention.clock],
      wall: usedWall,
      shiftMinutes,
      solarDayShift,
      ziDayShift,
      solarCorrection,
    },
    lunar: { cn: lunarCn, vn: lunarVn, diverges },
    pillars,
    jie,
    warnings,
  };
}
