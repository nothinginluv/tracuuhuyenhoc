import type {
  BirthInput,
  HourStemRule,
  PresetName,
  ZiBoundary,
} from '../../../packages/calendar-core/src/index.ts';
import type { Gender } from '../../../packages/bazi-engine/src/index.ts';
import type { LeapMonthRule } from '../../../packages/tuvi-engine/src/index.ts';

export type FormValues = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  province: string;
  district: string;
  gender: Gender;
  preset: PresetName;
  ziBoundary: '' | ZiBoundary;
  hourStemRule: '' | HourStemRule;
  leapMonthRule: LeapMonthRule;
};

export const DEFAULT_FORM: FormValues = {
  year: '1990',
  month: '1',
  day: '1',
  hour: '12',
  minute: '0',
  province: '',
  district: '',
  gender: 'nam',
  preset: 'chuan-tq',
  ziBoundary: '',
  hourStemRule: '',
  leapMonthRule: 'split',
};

export const PRESET_INFO: Record<
  PresetName,
  { label: string; detail: string }
> = {
  'chuan-tq': {
    label: 'Chuẩn Trung Quốc (mặc định)',
    detail: 'Giờ Bắc Kinh UTC+8 · Tý muộn (đổi ngày 00:00) · can giờ theo ngày hiện tại · phái Tam Hợp',
  },
  'vn-dia-phuong': {
    label: 'Giờ Việt Nam tại nơi sinh',
    detail: 'Dùng múi giờ lịch sử: Bắc +7, Nam +8 (1960 – 12/06/1975), sau đó cả nước +7',
  },
  'vn-mat-troi': {
    label: 'Giờ mặt trời thật',
    detail: 'Hiệu chỉnh theo kinh độ và equation of time — cùng một giờ đồng hồ có thể lệch canh giờ',
  },
  'lunar-js': {
    label: 'Khớp lunar-javascript',
    detail: 'Giờ Bắc Kinh, nhưng 23:00–23:59 lấy can giờ của ngày kế tiếp',
  },
};

/** Mã tỉnh Quảng Trị trong bảng 63 tỉnh trước sáp nhập. */
export const QUANG_TRI = '30';

const NOW = new Date();

function isIntIn(value: string, lo: number, hi: number): boolean {
  if (!/^\d+$/.test(value)) return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= lo && n <= hi;
}

export function parseForm(v: FormValues): { input: BirthInput; error: string | null } {
  const empty = {} as BirthInput;
  if (!isIntIn(v.year, 1900, NOW.getFullYear())) {
    return { input: empty, error: 'Năm sinh phải là số từ 1900 đến năm nay.' };
  }
  if (!isIntIn(v.month, 1, 12)) {
    return { input: empty, error: 'Tháng sinh phải từ 1 đến 12.' };
  }
  if (!isIntIn(v.day, 1, 31)) {
    return { input: empty, error: 'Ngày sinh phải từ 1 đến 31.' };
  }
  if (!isIntIn(v.hour, 0, 23)) {
    return { input: empty, error: 'Giờ sinh phải từ 0 đến 23.' };
  }
  if (!isIntIn(v.minute, 0, 59)) {
    return { input: empty, error: 'Phút sinh phải từ 0 đến 59.' };
  }

  const year = Number(v.year);
  const month = Number(v.month);
  const day = Number(v.day);
  const today = Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const chosen = Date.UTC(year, month - 1, day);
  if (chosen > today) {
    return { input: empty, error: 'Ngày sinh không thể ở tương lai.' };
  }

  const input: BirthInput = {
    year,
    month,
    day,
    hour: Number(v.hour),
    minute: Number(v.minute),
  };
  if (v.province) input.province = v.province;
  if (v.province === QUANG_TRI) {
    input.district = v.district || 'Huyện khác (nam vĩ tuyến 17)';
  }
  return { input, error: null };
}
