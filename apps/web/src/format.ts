/** Định dạng hiển thị — không tính toán, chỉ đổi cách viết. */
import { BRANCHES_VI, STEMS_VI } from '../../../packages/bazi-engine/src/index.ts';
import type { LunarDate } from '../../../packages/calendar-core/src/index.ts';

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function formatDate(year: number, month: number, day: number): string {
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

export function formatTime(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** Can chi của năm âm lịch, vd "Giáp Thìn". */
export function yearName(lunar: Pick<LunarDate, 'yearCycleIndex'>): string {
  return `${STEMS_VI[lunar.yearCycleIndex % 10]} ${BRANCHES_VI[lunar.yearCycleIndex % 12]}`;
}

export function lunarLabel(lunar: LunarDate): string {
  return `ngày ${lunar.day} tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${yearName(lunar)}`;
}

export function lunarShort(lunar: LunarDate): string {
  return `${pad2(lunar.day)}/${pad2(lunar.month)}${lunar.leap ? ' nhuận' : ''}`;
}

export function hourBranchName(branch: number): string {
  return BRANCHES_VI[branch] ?? '—';
}

/** Khoảng thời gian của canh giờ, vd "23:00–00:59". */
export function hourRange(branch: number): string {
  const start = (branch * 2 + 23) % 24;
  const end = (start + 1) % 24;
  return `${pad2(start)}:00–${pad2(end)}:59`;
}

export const ELEMENT_CLASS: Record<string, string> = {
  moc: 'el-moc',
  hoa: 'el-hoa',
  tho: 'el-tho',
  kim: 'el-kim',
  thuy: 'el-thuy',
};

export const CLOCK_DESCRIPTION: Record<string, string> = {
  china: 'Giờ Bắc Kinh (UTC+8) — quy ước chuẩn Trung Quốc',
  birthplace: 'Giờ dân sự tại nơi sinh, dùng bảng múi giờ lịch sử Việt Nam',
  'true-solar': 'Giờ mặt trời thật tại kinh độ nơi sinh',
};

export function shiftLabel(minutes: number): string {
  if (minutes === 0) return '0 phút';
  const sign = minutes > 0 ? '+' : '−';
  return `${sign}${Math.abs(minutes)} phút`;
}
