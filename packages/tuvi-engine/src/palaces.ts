/**
 * Cung Mệnh, cung Thân và 12 cung.
 *
 * 安命身宮訣:
 *   「寅起正月，順數至生月，逆數生時為命宮。
 *     寅起正月，順數至生月，順數生時為身宮。」
 *
 * 定十二宮訣:
 *   「由命宮逆數：兄弟、夫妻、子女、財帛、疾厄、遷移、奴僕、事業、田宅、福德、父母。」
 */
import { BRANCHES_VI, BRANCHES_ZH, PALACE_NAMES, mod } from './constants.ts';

/** Cung Dần là gốc của phép đếm tháng. */
const YIN = 2;

/** Cung Mệnh: từ Dần tiến (tháng − 1), rồi lùi theo giờ. */
export function soulPalaceBranch(month: number, hourBranch: number): number {
  return mod(YIN + (month - 1) - hourBranch, 12);
}

/** Cung Thân: từ Dần tiến (tháng − 1), rồi tiến theo giờ. */
export function bodyPalaceBranch(month: number, hourBranch: number): number {
  return mod(YIN + (month - 1) + hourBranch, 12);
}

/**
 * Can của cung Dần theo 五虎遁:
 *   「甲己年生起丙寅，乙庚年生起戊寅，丙辛年生起庚寅，
 *     丁壬年生起壬寅，戊癸年生起甲寅。」
 */
export function yinPalaceStem(yearStem: number): number {
  return mod((mod(yearStem, 5) * 2 + 2), 10);
}

/** Can của một cung bất kỳ: can Dần tiến thêm (chi − Dần) vòng theo 12 chi. */
export function palaceStem(yearStem: number, branch: number): number {
  return mod(yinPalaceStem(yearStem) + mod(branch - YIN, 12), 10);
}

export type PalaceName = { zh: string; vi: string };

/**
 * Tên cung tại một chi. Cung Mệnh lùi dần: Mệnh, Huynh Đệ, Phu Thê, …
 * nên tên cung = PALACE_NAMES[(Mệnh − chi) mod 12].
 */
export function palaceNameAt(soulBranch: number, branch: number): PalaceName {
  const offset = mod(soulBranch - branch, 12);
  return PALACE_NAMES[offset];
}

/** Nhãn "Tý (子)" cho một chi. */
export function branchLabel(branch: number): string {
  const b = mod(branch, 12);
  return `${BRANCHES_VI[b]} (${BRANCHES_ZH[b]})`;
}
