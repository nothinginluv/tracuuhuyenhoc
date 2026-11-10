/**
 * Đại hạn (大限) — mười năm một cung.
 *
 * Quy tắc (紫微斗數全書 卷二):
 *   「阳男阴女从命前一宫起顺行，是父母宫。阴男阳女从命后一宫起逆行，是兄弟宫。」
 * Tuổi khởi (卷二):
 *   Thuỷ nhị 2 · Mộc tam 3 · Kim tứ 4 · Thổ ngũ 5 · Hoả lục 6.
 *
 * "顺行" ở đây đi theo thứ tự cung 命 → 父母 → 福德 → …, tức chi tăng dần; "逆行"
 * đi 命 → 兄弟 → 夫妻 → …, tức chi giảm dần. Chỉ là phép đếm, không phải luận đoán;
 * câu chữ và tuổi khởi nằm trong `content/dahan.json` để cổng nội dung đối chiếu.
 */
import { BRANCHES_VI, BRANCHES_ZH, mod } from './constants.ts';
import type { TuViChart } from './chart.ts';

export type TuViGender = 'nam' | 'nu';

export type DaHanDirection = 'thuan' | 'nghich';

export type DaHanStep = {
  /** Hạn thứ 1 … 12. */
  index: number;
  branch: number;
  branchZh: string;
  branchVi: string;
  palaceZh: string;
  palaceVi: string;
  /** Tuổi bắt đầu, tính theo con số trong nguồn (không phải tuổi dương lịch). */
  fromAge: number;
  /** Tuổi kết thúc (bao gồm): fromAge + 9. */
  toAge: number;
};

export type DaHan = {
  direction: DaHanDirection;
  /** Tuổi khởi đại hạn = số của ngũ hành cục. */
  startAge: number;
  startBranch: number;
  steps: DaHanStep[];
};

/** Dương nam / âm nữ đi thuận; âm nam / dương nữ đi nghịch. */
export function daHanDirection(chart: TuViChart, gender: TuViGender): DaHanDirection {
  if (gender !== 'nam' && gender !== 'nu') {
    throw new RangeError(`Giới tính phải là "nam" hoặc "nữ", nhận "${String(gender)}"`);
  }
  const duong = mod(chart.year.stem, 10) % 2 === 0;
  const forward = (duong && gender === 'nam') || (!duong && gender === 'nu');
  return forward ? 'thuan' : 'nghich';
}

/**
 * Mười hai đại hạn, mỗi hạn 10 năm, bắt đầu từ cung Phụ Mẫu (thuận) hoặc
 * Huynh Đệ (nghịch) và đi đủ một vòng 12 cung.
 */
export function daHanCycles(chart: TuViChart, gender: TuViGender): DaHan {
  const direction = daHanDirection(chart, gender);
  const step = direction === 'thuan' ? 1 : -1;
  const startAge = chart.bureau.number;
  const startBranch = mod(chart.soul.branch + step, 12);

  const steps: DaHanStep[] = [];
  for (let i = 0; i < 12; i++) {
    const branch = mod(startBranch + step * i, 12);
    const palace = chart.palaces[branch];
    const fromAge = startAge + i * 10;
    steps.push({
      index: i + 1,
      branch,
      branchZh: BRANCHES_ZH[branch],
      branchVi: BRANCHES_VI[branch],
      palaceZh: palace.nameZh,
      palaceVi: palace.nameVi,
      fromAge,
      toAge: fromAge + 9,
    });
  }

  return { direction, startAge, startBranch, steps };
}

/** Đại hạn chứa tuổi `age`; null khi tuổi nằm ngoài vòng 12 hạn. */
export function daHanAt(dahan: DaHan, age: number): DaHanStep | null {
  return dahan.steps.find((s) => age >= s.fromAge && age <= s.toAge) ?? null;
}
