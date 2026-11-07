/**
 * 24 tiết khí — bảng instant UTC dựng sẵn (1900–2100).
 *
 * Nguồn: lunar-javascript (寿星天文历) tính theo giờ Bắc Kinh, quy đổi sang UTC
 * bằng cách trừ 8 giờ lúc sinh bảng (scripts/gen-solar-terms.mjs).
 *
 * Nguyên tắc: tiết khí là một INSTANT. Không bao giờ so giờ Việt Nam với bảng
 * giờ Bắc Kinh — làm vậy sẽ lệch đúng 1 giờ ở mọi ca sinh trong khoảng đó.
 */
import data from '../data/solar-terms.json' with { type: 'json' };

export type TermKey =
  | 'xiaohan' | 'dahan' | 'lichun' | 'yushui' | 'jingzhe' | 'chunfen'
  | 'qingming' | 'guyu' | 'lixia' | 'xiaoman' | 'mangzhong' | 'xiazhi'
  | 'xiaoshu' | 'dashu' | 'liqiu' | 'chushu' | 'bailu' | 'qiufen'
  | 'hanlu' | 'shuangjiang' | 'lidong' | 'xiaoxue' | 'daxue' | 'dongzhi';

export type Term = { key: TermKey; zh: string; epoch: number };

type TermsFile = {
  from: number;
  to: number;
  order: { key: TermKey; zh: string }[];
  years: Record<string, number[]>;
};

const FILE = data as unknown as TermsFile;

export const TERM_ORDER = FILE.order;
export const TERM_ZH = new Map<TermKey, string>(FILE.order.map((o) => [o.key, o.zh]));
export const TERM_FROM = FILE.from;
export const TERM_TO = FILE.to;

/** 12 "tiết" (節) — mốc đổi tháng can chi. Khác với 12 "khí". */
export const JIE_KEYS: TermKey[] = [
  'lichun', 'jingzhe', 'qingming', 'lixia', 'mangzhong', 'xiaoshu',
  'liqiu', 'bailu', 'hanlu', 'lidong', 'daxue', 'xiaohan',
];

/** Tháng can chi thứ mấy sau tháng Dần (0 = Dần). */
export const JIE_TO_MONTH_OFFSET: Record<string, number> = {
  lichun: 0, jingzhe: 1, qingming: 2, lixia: 3, mangzhong: 4, xiaoshu: 5,
  liqiu: 6, bailu: 7, hanlu: 8, lidong: 9, daxue: 10, xiaohan: 11,
};

/** Bảng phẳng đã sắp xếp để tìm kiếm nhị phân. */
const FLAT: Term[] = (() => {
  const out: Term[] = [];
  for (const [yearStr, arr] of Object.entries(FILE.years)) {
    void yearStr;
    arr.forEach((epoch, i) => {
      const o = FILE.order[i];
      out.push({ key: o.key, zh: o.zh, epoch });
    });
  }
  out.sort((a, b) => a.epoch - b.epoch);
  return out;
})();

export const TERM_COUNT = FLAT.length;

export function assertYearSupported(y: number): void {
  if (y < TERM_FROM || y > TERM_TO) {
    throw new RangeError(`Năm ${y} ngoài phạm vi hỗ trợ ${TERM_FROM}–${TERM_TO}`);
  }
}

/** Tiết gần nhất có instant <= epochMs. */
export function termBefore(epochMs: number): Term {
  let lo = 0;
  let hi = FLAT.length - 1;
  if (epochMs < FLAT[0].epoch) throw new RangeError('Trước phạm vi bảng tiết khí');
  if (epochMs >= FLAT[hi].epoch) {
    if (epochMs > FLAT[hi].epoch + 40 * 86_400_000) throw new RangeError('Sau phạm vi bảng tiết khí');
    return FLAT[hi];
  }
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (FLAT[mid].epoch <= epochMs) lo = mid;
    else hi = mid - 1;
  }
  return FLAT[lo];
}

/** Tiết kế tiếp có instant > epochMs. */
export function termAfter(epochMs: number): Term | null {
  const prev = termBefore(epochMs);
  const idx = FLAT.indexOf(prev);
  return idx >= 0 && idx + 1 < FLAT.length ? FLAT[idx + 1] : null;
}

/** Instant của một tiết trong một năm dương lịch. */
export function termEpoch(year: number, key: TermKey): number {
  const arr = FILE.years[String(year)];
  if (!arr) throw new RangeError(`Không có dữ liệu tiết khí năm ${year}`);
  const i = FILE.order.findIndex((o) => o.key === key);
  return arr[i];
}

/** Tiết gần nhất <= epochMs, giới hạn trong các "tiết" (mốc tháng). */
export function jieBefore(epochMs: number): Term {
  const prev = termBefore(epochMs);
  if (JIE_KEYS.includes(prev.key)) return prev;
  // tiết trước đó là "khí" → lùi thêm một bước
  const idx = FLAT.indexOf(prev);
  for (let i = idx - 1; i >= 0; i--) {
    if (JIE_KEYS.includes(FLAT[i].key)) return FLAT[i];
  }
  throw new RangeError('Không tìm được tiết trước');
}

/** Tiết kế tiếp > epochMs, giới hạn trong các "tiết" (mốc tháng). */
export function jieAfter(epochMs: number): Term | null {
  let t = termAfter(epochMs);
  while (t && !JIE_KEYS.includes(t.key)) t = termAfter(t.epoch);
  return t;
}
