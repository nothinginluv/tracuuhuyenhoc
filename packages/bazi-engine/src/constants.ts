/**
 * Hằng số Bát Tự.
 *
 * Can/chi ở đây trùng với `calendar-core`, nhưng engine Bát Tự giữ bản riêng để
 * không phụ thuộc vào tầng lịch: đầu vào duy nhất là tứ trụ + khoảng cách tiết khí.
 */
export const STEMS_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;

export const BRANCHES_ZH = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;
export const BRANCHES_VI = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
] as const;

export type Element = 'moc' | 'hoa' | 'tho' | 'kim' | 'thuy';

export const ELEMENT_ZH: Record<Element, string> = {
  moc: '木', hoa: '火', tho: '土', kim: '金', thuy: '水',
};
export const ELEMENT_VI: Record<Element, string> = {
  moc: 'Mộc', hoa: 'Hoả', tho: 'Thổ', kim: 'Kim', thuy: 'Thuỷ',
};

/** Ngũ hành của 10 can, theo thứ tự Giáp → Quý. */
export const STEM_ELEMENT: readonly Element[] = [
  'moc', 'moc', 'hoa', 'hoa', 'tho', 'tho', 'kim', 'kim', 'thuy', 'thuy',
];

/** Ngũ hành của 12 chi, theo thứ tự Tý → Hợi. */
export const BRANCH_ELEMENT: readonly Element[] = [
  'thuy', 'tho', 'moc', 'moc', 'tho', 'hoa', 'hoa', 'tho', 'kim', 'kim', 'tho', 'thuy',
];

/** Chỉ số chẵn là dương (Giáp, Bính, …; Tý, Dần, …). */
export const isYang = (index: number): boolean => index % 2 === 0;

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export type Gender = 'nam' | 'nu';
