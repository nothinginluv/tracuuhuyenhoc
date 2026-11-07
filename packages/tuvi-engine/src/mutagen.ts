/**
 * Tứ Hoá (四化).
 *
 * 安四化星訣 (Nam phái):
 *   「甲廉破武陽，乙機梁紫陰，丙同機昌廉，丁陰同機巨，戊貪陰右機。
 *     己武貪梁曲，庚陽武陰同，辛巨陽曲昌，壬梁紫左武，癸破巨陰貪。」
 *
 * Bảng được tách khỏi code để thêm phái khác chỉ là thêm dữ liệu, không sửa thuật toán.
 */
import { HUA } from './constants.ts';
import type { HuaKey, StarId } from './constants.ts';

export type MutagenTable = {
  /** Tên phái, hiện lên giao diện. */
  id: string;
  label: string;
  /** Theo can năm 0–9, mỗi dòng là [Hoá Lộc, Hoá Quyền, Hoá Khoa, Hoá Kỵ]. */
  byYearStem: readonly (readonly [StarId, StarId, StarId, StarId])[];
  source: string;
};

export const MUTAGEN_TABLES = {
  'nam-phai': {
    id: 'nam-phai',
    label: 'Nam phái (南派)',
    byYearStem: [
      ['lianzhen', 'pojun', 'wuqu', 'taiyang'], // 甲 廉破武陽
      ['tianji', 'tianliang', 'ziwei', 'taiyin'], // 乙 機梁紫陰
      ['tiantong', 'tianji', 'wenchang', 'lianzhen'], // 丙 同機昌廉
      ['taiyin', 'tiantong', 'tianji', 'jumen'], // 丁 陰同機巨
      ['tanlang', 'taiyin', 'youbi', 'tianji'], // 戊 貪陰右機
      ['wuqu', 'tanlang', 'tianliang', 'wenqu'], // 己 武貪梁曲
      ['taiyang', 'wuqu', 'taiyin', 'tiantong'], // 庚 陽武陰同
      ['jumen', 'taiyang', 'wenqu', 'wenchang'], // 辛 巨陽曲昌
      ['tianliang', 'ziwei', 'zuofu', 'wuqu'], // 壬 梁紫左武
      ['pojun', 'jumen', 'taiyin', 'tanlang'], // 癸 破巨陰貪
    ],
    source: '紫微研習社《安星訣》安四化星訣 — 南派四化',
  },
} as const satisfies Record<string, MutagenTable>;

export type MutagenTableId = keyof typeof MUTAGEN_TABLES;

export const DEFAULT_MUTAGEN_TABLE: MutagenTableId = 'nam-phai';

export type Mutagen = {
  star: StarId;
  hua: HuaKey;
  zh: string;
  vi: string;
};

const HUA_ORDER: readonly HuaKey[] = ['loc', 'quyen', 'khoa', 'ky'];

/** Bốn sao hoá của một can năm, theo thứ tự Lộc – Quyền – Khoa – Kỵ. */
export function mutagensOf(
  yearStem: number,
  tableId: MutagenTableId = DEFAULT_MUTAGEN_TABLE,
): Mutagen[] {
  const table = MUTAGEN_TABLES[tableId];
  const row = table.byYearStem[((yearStem % 10) + 10) % 10];
  return HUA_ORDER.map((hua, i) => ({
    star: row[i],
    hua,
    zh: HUA[hua].zh,
    vi: HUA[hua].vi,
  }));
}
