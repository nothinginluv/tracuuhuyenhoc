/** Danh mục 63 tỉnh/thành trước sáp nhập 01/07/2025. */
import data from '../data/provinces_pre2025.json' with { type: 'json' };
import type { Region } from './vn-tz-history.ts';

export type Province = {
  code: string;
  name: string;
  capital: string;
  lat: number;
  lon: number;
  mien_1960_1975: 'bac' | 'nam' | 'chia';
};

type ProvincesFile = { count: number; provinces: Province[] };

const FILE = data as unknown as ProvincesFile;

export const PROVINCES: readonly Province[] = FILE.provinces;

const BY_CODE = new Map(PROVINCES.map((p) => [p.code, p]));
const BY_NAME = new Map(PROVINCES.map((p) => [p.name, p]));

export function provinceByCode(code: string): Province | undefined {
  return BY_CODE.get(code);
}

export function provinceByName(name: string): Province | undefined {
  return BY_NAME.get(name);
}

/**
 * Miền để tra múi giờ lịch sử.
 * Tỉnh "chia" (Quảng Trị) bắt buộc phải chỉ định huyện; nếu không, trả null.
 */
export function regionOf(p: Province, district?: string): Region | null {
  if (p.mien_1960_1975 === 'chia') {
    if (!district) return null;
    // Vĩnh Linh nằm ở bắc vĩ tuyến 17 (bờ bắc sông Bến Hải).
    return /vĩnh\s*linh/i.test(district) ? 'bac' : 'nam';
  }
  return p.mien_1960_1975;
}
