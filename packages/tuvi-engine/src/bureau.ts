/**
 * Ngũ Hành Cục (五行局).
 *
 * Lấy từ 定五行局訣:
 *   「甲乙丙丁一到五，子丑午未一來數，寅卯申酉二上走，辰巳戌亥三為足。
 *     干支相加多減五，五行木金水火土。」
 *
 * Cách tính này tương đương với tra 納音 của can chi cung Mệnh — có test đối chiếu
 * với bảng 60 Giáp Tý.
 */
import { mod } from './constants.ts';

export type BureauNumber = 2 | 3 | 4 | 5 | 6;

export type Bureau = {
  /** Số cục: 2, 3, 4, 5, 6. */
  number: BureauNumber;
  element: 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';
  zh: string;
  vi: string;
};

const BUREAU_BY_NUMBER: Record<BureauNumber, Bureau> = {
  2: { number: 2, element: 'thuy', zh: '水二局', vi: 'Thuỷ Nhị Cục' },
  3: { number: 3, element: 'moc', zh: '木三局', vi: 'Mộc Tam Cục' },
  4: { number: 4, element: 'kim', zh: '金四局', vi: 'Kim Tứ Cục' },
  5: { number: 5, element: 'tho', zh: '土五局', vi: 'Thổ Ngũ Cục' },
  6: { number: 6, element: 'hoa', zh: '火六局', vi: 'Hoả Lục Cục' },
};

/** Số của can: 甲乙 1, 丙丁 2, 戊己 3, 庚辛 4, 壬癸 5. */
export function stemNumber(stem: number): number {
  return Math.floor(mod(stem, 10) / 2) + 1;
}

/** Số của chi: 子午丑未 1, 寅申卯酉 2, 辰巳戌亥 3. */
export function branchNumber(branch: number): number {
  return [1, 1, 2, 2, 3, 3, 1, 1, 2, 2, 3, 3][mod(branch, 12)];
}

/** Ngũ Hành Cục từ can chi của cung Mệnh. */
export function bureauOf(stem: number, branch: number): Bureau {
  let sum = stemNumber(stem) + branchNumber(branch);
  if (sum > 5) sum -= 5;
  // 1 → Mộc 3, 2 → Kim 4, 3 → Thuỷ 2, 4 → Hoả 6, 5 → Thổ 5.
  const number = ({ 1: 3, 2: 4, 3: 2, 4: 6, 5: 5 } as const)[sum as 1 | 2 | 3 | 4 | 5];
  return BUREAU_BY_NUMBER[number];
}
