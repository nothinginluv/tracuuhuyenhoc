/**
 * Đổi vị trí trích dẫn trong dữ liệu (`卷一`, `全篇`) sang tiếng Việt khi hiển thị.
 *
 * Tách khỏi `quotes.tsx` để test được bằng Node thuần: file kia import JSON qua
 * cú pháp `?raw` của Vite, Node không hiểu.
 */

const CN_DIGIT: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

function cnNumber(text: string): number | null {
  if (/^[0-9]+$/.test(text)) return Number(text);
  if (!/^[一二三四五六七八九十]+$/.test(text)) return null;
  if (text === '十') return 10;
  // 十一 … 十九, 二十 … 九十九
  const tens = text.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/);
  if (tens) return (CN_DIGIT[tens[1]] ?? 1) * 10 + (CN_DIGIT[tens[2]] ?? 0);
  return CN_DIGIT[text] ?? null;
}

export function locatorVi(locator: string): string {
  if (locator.trim() === '全篇') return 'toàn thiên';
  const volume = /^卷\s*(\S+)$/.exec(locator.trim());
  if (volume) {
    const n = cnNumber(volume[1]);
    if (n !== null) return `quyển ${n}`;
  }
  return 'không rõ vị trí';
}
