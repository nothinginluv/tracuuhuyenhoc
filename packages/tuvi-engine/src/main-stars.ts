/**
 * Vị trí 14 chính tinh.
 *
 * 起紫微星訣:
 *   「六五四三二，酉午亥辰丑，局數除日數，商數宮前走；
 *     若見數無餘，便要起虎口，日數小於局，還直宮中守。」
 *
 * Nghĩa: chia ngày cho số cục, lấy thương làm bước tiến từ Dần; phần bù để chia hết
 * (dư) quyết định tiến hay lùi — dư chẵn thì tiến, dư lẻ thì lùi, đúng bằng số dư.
 *
 * 安紫微諸星訣:
 *   「紫微逆去天機星，隔一太陽武曲辰，連接天同空二宮，廉貞居處方是真。」
 * 安天府諸星訣:
 *   「天府順行有太陰，貪狼而後巨門臨，隨來天相天梁繼，七殺空三是破軍。」
 */
import { mod } from './constants.ts';

const YIN = 2;

/** Vị trí sao Tử Vi từ ngày âm lịch và số cục. */
export function ziweiBranch(day: number, bureauNumber: number): number {
  const quotient = Math.ceil(day / bureauNumber);
  const remainder = quotient * bureauNumber - day;
  const base = YIN + (quotient - 1);
  return mod(remainder % 2 === 0 ? base + remainder : base - remainder, 12);
}

/**
 * Sao Thiên Phủ đối xứng với Tử Vi qua trục Dần–Thân:
 * Tử Vi và Thiên Phủ cùng cung khi ở Dần hoặc Thân.
 */
export function tianfuBranch(ziwei: number): number {
  return mod(4 - ziwei, 12);
}

/** Vị trí 6 sao hệ Tử Vi (đi nghịch). */
export const ZIWEI_SERIES: readonly { id: string; offset: number }[] = [
  { id: 'ziwei', offset: 0 },
  { id: 'tianji', offset: -1 },
  { id: 'taiyang', offset: -3 },
  { id: 'wuqu', offset: -4 },
  { id: 'tiantong', offset: -5 },
  { id: 'lianzhen', offset: -8 },
];

/** Vị trí 8 sao hệ Thiên Phủ (đi thuận). */
export const TIANFU_SERIES: readonly { id: string; offset: number }[] = [
  { id: 'tianfu', offset: 0 },
  { id: 'taiyin', offset: 1 },
  { id: 'tanlang', offset: 2 },
  { id: 'jumen', offset: 3 },
  { id: 'tianxiang', offset: 4 },
  { id: 'tianliang', offset: 5 },
  { id: 'qisha', offset: 6 },
  { id: 'pojun', offset: 10 },
];

export type MainStarPositions = Record<string, number>;

/** Vị trí cả 14 chính tinh, khoá theo id sao. */
export function mainStarBranches(day: number, bureauNumber: number): MainStarPositions {
  const ziwei = ziweiBranch(day, bureauNumber);
  const tianfu = tianfuBranch(ziwei);
  const out: MainStarPositions = {};
  for (const { id, offset } of ZIWEI_SERIES) out[id] = mod(ziwei + offset, 12);
  for (const { id, offset } of TIANFU_SERIES) out[id] = mod(tianfu + offset, 12);
  return out;
}
