/**
 * Địa chi tàng can (地支藏干).
 *
 * Thành viên lấy đúng bài 地支藏遁歌 (淵海子平):
 *   「子宫癸水在其中，丑癸辛金己土同；寅宫甲木兼丙戊，卯宫乙木独相逢。
 *     辰藏乙戊三分癸，巳中庚金丙戊丛；午宫丁火并己土，未宫乙己丁共宗。
 *     申位庚金壬水戊，酉宫辛金独丰隆；戌宫辛金及丁戊，亥藏壬甲是真踪。」
 *
 * Bài thơ liệt kê theo thứ tự câu chữ, không phải theo độ mạnh. Bảng dưới sắp lại
 * theo 本氣 → 中氣 → 餘氣 (bản khí trước) — quy ước phổ biến khi luận thập thần.
 * Riêng 巳 có sách xếp 丙戊庚, sách khác 丙庚戊; ở đây giữ 丙庚戊 và ghi rõ.
 */
import { STEMS_VI, STEMS_ZH, mod } from './constants.ts';

export const HIDDEN_STEMS_QUOTE = 'q_bz_0004';

/** 0-based, theo thứ tự Tý → Hợi. */
const HIDDEN_STEMS: readonly (readonly number[])[] = [
  [9], // 子 癸
  [5, 9, 7], // 丑 己 癸 辛
  [0, 2, 4], // 寅 甲 丙 戊
  [1], // 卯 乙
  [4, 1, 9], // 辰 戊 乙 癸
  [2, 6, 4], // 巳 丙 庚 戊
  [3, 5], // 午 丁 己
  [5, 3, 1], // 未 己 丁 乙
  [6, 8, 4], // 申 庚 壬 戊
  [7], // 酉 辛
  [4, 7, 3], // 戌 戊 辛 丁
  [8, 0], // 亥 壬 甲
];

export type HiddenRole = 'ban-khi' | 'trung-khi' | 'du-khi';

export type HiddenStem = {
  stem: number;
  zh: string;
  vi: string;
  role: HiddenRole;
  roleZh: string;
};

const ROLE: readonly { role: HiddenRole; roleZh: string }[] = [
  { role: 'ban-khi', roleZh: '本氣' },
  { role: 'trung-khi', roleZh: '中氣' },
  { role: 'du-khi', roleZh: '餘氣' },
];

/** Can tàng trong một địa chi, bản khí đứng đầu. */
export function hiddenStems(branch: number): HiddenStem[] {
  const b = mod(branch, 12);
  return HIDDEN_STEMS[b].map((stem, i) => ({
    stem,
    zh: STEMS_ZH[stem],
    vi: STEMS_VI[stem],
    role: ROLE[i]!.role,
    roleZh: ROLE[i]!.roleZh,
  }));
}

/** Bản khí của địa chi — can mạnh nhất trong chi. */
export function mainHiddenStem(branch: number): HiddenStem {
  return hiddenStems(branch)[0]!;
}
