/**
 * Khởi vận và đại vận.
 *
 * Chiều (三命通會, 卷11):
 *   「如陽男陰女從生月順行，陰男陽女從生月逆行。」
 *
 * Thời lượng (淵海子平, 珞琭子消息賦):
 *   「運行則一辰十載。折除乃三日為年；折除者乃一年二十四氣，七十二候。」
 *   → mỗi vận 10 năm; 3 ngày = 1 năm, 1 ngày = 4 tháng, 1 giờ = 5 ngày.
 *
 * Đây là quy ước 子平 phổ biến. Có phái đếm theo ngày tròn, có phái dùng 虚歲;
 * engine trả tuổi dạng **số năm kể từ lúc sinh** để nơi hiển thị tự quyết định.
 */
import { BRANCHES_VI, BRANCHES_ZH, STEMS_VI, STEMS_ZH, mod, type Gender } from './constants.ts';

export const LUCK_DIRECTION_QUOTE = 'q_bz_0006';
export const QIYUN_RULE_QUOTE = 'q_bz_0007';

const MINUTE_MS = 60_000;

/** 3 ngày = 1 năm. */
const MINUTES_PER_YEAR = 3 * 24 * 60;
/** 1 ngày = 4 tháng. */
const MINUTES_PER_MONTH = (24 * 60) / 4;
/** 1 tháng = 30 ngày (theo quy ước 3 ngày = 1 năm). */
const MINUTES_PER_DAY = MINUTES_PER_MONTH / 30;

export type LuckDirection = 'thuan' | 'nghich';

/** Dương nam / âm nữ đi thuận; âm nam / dương nữ đi nghịch. */
export function luckDirection(yearStem: number, gender: Gender): LuckDirection {
  const duong = mod(yearStem, 10) % 2 === 0;
  const forward = (duong && gender === 'nam') || (!duong && gender === 'nu');
  return forward ? 'thuan' : 'nghich';
}

export type QiYunInput = {
  yearStem: number;
  gender: Gender;
  birthEpochMs: number;
  /** Tiết khí (節) đã qua gần nhất. */
  previousJieEpochMs: number;
  /** Tiết khí (節) kế tiếp. */
  nextJieEpochMs: number;
};

export type QiYun = {
  direction: LuckDirection;
  /** Mốc dùng để đếm: tiết kế tiếp (thuận) hay tiết trước (nghịch). */
  reference: 'next' | 'previous';
  /** Khoảng cách tới mốc, tính bằng ngày (có phần lẻ). */
  daysToJie: number;
  /** Tuổi khởi vận dạng số thực, tính bằng năm kể từ lúc sinh. */
  startAgeYears: number;
  /** Cùng tuổi đó, tách năm/tháng/ngày theo quy ước 3 ngày = 1 năm. */
  startAge: { years: number; months: number; days: number };
  quote: typeof QIYUN_RULE_QUOTE;
};

export function qiYun(input: QiYunInput): QiYun {
  const direction = luckDirection(input.yearStem, input.gender);
  const reference = direction === 'thuan' ? 'next' : 'previous';
  const deltaMs =
    direction === 'thuan'
      ? input.nextJieEpochMs - input.birthEpochMs
      : input.birthEpochMs - input.previousJieEpochMs;

  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new RangeError(
      `Khoảng cách tới tiết khí không hợp lệ (${deltaMs} ms): kiểm tra lại mốc tiết đã truyền.`,
    );
  }

  const totalMinutes = deltaMs / MINUTE_MS;
  const min = Math.round(totalMinutes);

  const years = Math.floor(min / MINUTES_PER_YEAR);
  let rest = min % MINUTES_PER_YEAR;
  const months = Math.floor(rest / MINUTES_PER_MONTH);
  rest %= MINUTES_PER_MONTH;
  const days = Math.floor(rest / MINUTES_PER_DAY);

  return {
    direction,
    reference,
    daysToJie: totalMinutes / (24 * 60),
    startAgeYears: totalMinutes / MINUTES_PER_YEAR,
    startAge: { years, months, days },
    quote: QIYUN_RULE_QUOTE,
  };
}

export type LuckPillar = {
  cycleIndex: number;
  stem: number;
  branch: number;
  zh: string;
  vi: string;
};

export function pillarFromCycle(cycleIndex: number): LuckPillar {
  const k = mod(cycleIndex, 60);
  const stem = k % 10;
  const branch = k % 12;
  return {
    cycleIndex: k,
    stem,
    branch,
    zh: `${STEMS_ZH[stem]}${BRANCHES_ZH[branch]}`,
    vi: `${STEMS_VI[stem]} ${BRANCHES_VI[branch]}`,
  };
}

export type LuckCycle = {
  /** Vận thứ 1, 2, … */
  index: number;
  /** Tuổi bắt đầu, tính bằng năm kể từ lúc sinh (có phần lẻ). */
  fromAge: number;
  toAge: number;
  pillar: LuckPillar;
};

/**
 * Đại vận: bắt đầu từ trụ tháng tiến (thuận) hoặc lùi (nghịch) một bước,
 * mỗi bước 10 năm. Không lấy chính trụ tháng làm vận đầu.
 */
export function luckCycles(
  monthCycleIndex: number,
  qiyun: Pick<QiYun, 'direction' | 'startAgeYears'>,
  count = 10,
): LuckCycle[] {
  if (!Number.isInteger(count) || count < 1 || count > 12) {
    throw new RangeError(`Số đại vận phải trong 1–12, nhận ${count}`);
  }
  const step = qiyun.direction === 'thuan' ? 1 : -1;
  const round2 = (n: number): number => Math.round(n * 100) / 100;
  const out: LuckCycle[] = [];
  for (let i = 0; i < count; i++) {
    const fromAge = qiyun.startAgeYears + i * 10;
    out.push({
      index: i + 1,
      fromAge: round2(fromAge),
      toAge: round2(fromAge + 10),
      pillar: pillarFromCycle(monthCycleIndex + step * (i + 1)),
    });
  }
  return out;
}
