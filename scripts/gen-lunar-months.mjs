// Sinh data/lunar-months.json: ngày bắt đầu của từng tháng âm lịch 1899–2102.
//
// Nguồn ngày: lunar-javascript (寿星天文历) — đây là chuẩn lịch Trung Quốc mà dự án
// viện dẫn, nên lịch âm TQ lấy trực tiếp từ đó thay vì tự tính.
//
// Nguồn instant: công thức Meeus (src/new-moon.ts). Chỉ dùng để biết điểm sóc rơi
// vào ngày nào dưới múi giờ KHÁC UTC+8 — không dùng để quyết định ngày của lịch TQ.
import { writeFileSync } from 'node:fs';
import { Solar } from 'lunar-javascript';
import { jdFromDate } from '../packages/calendar-core/src/jdn.ts';
import { localDayNumber, newMoonInstantMs, newMoonIndexAtOrBefore } from '../packages/calendar-core/src/new-moon.ts';

const FROM_YEAR = 1899;
const TO_YEAR = 2102;

const starts = [];
let lastKey = null;
let mmeusMisses = 0;

for (let y = FROM_YEAR; y <= TO_YEAR; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 31; d++) {
      const probe = new Date(Date.UTC(y, m - 1, d));
      if (probe.getUTCMonth() !== m - 1) break;
      const lunar = Solar.fromYmd(y, m, d).getLunar();
      if (lunar.getDay() !== 1) continue;

      const monthRaw = lunar.getMonth();
      const key = `${lunar.getYear()}:${monthRaw}`;
      if (key === lastKey) continue;
      lastKey = key;

      const jdn = jdFromDate(d, m, y);

      // Tìm điểm sóc mà Meeus cho là rơi đúng ngày này (giờ Bắc Kinh).
      let utcMs = null;
      const k0 = newMoonIndexAtOrBefore(jdn, 8);
      for (const k of [k0, k0 + 1, k0 - 1, k0 + 2, k0 - 2]) {
        const inst = newMoonInstantMs(k);
        if (localDayNumber(inst, 8) === jdn) {
          utcMs = inst;
          break;
        }
      }
      if (utcMs == null) mmeusMisses++;

      starts.push({
        jdn,
        year: lunar.getYear(),
        month: Math.abs(monthRaw),
        leap: monthRaw < 0,
        utcMs: utcMs == null ? null : Math.round(utcMs),
      });
    }
  }
}

// Kiểm tra tính hợp lệ.
let prev = -Infinity;
let prevYear = null;
let leapCount = 0;
const problems = [];
for (const s of starts) {
  if (s.jdn <= prev) problems.push(`thứ tự sai tại ${s.jdn}`);
  prev = s.jdn;
  if (s.year < prevYear) problems.push(`năm lùi tại ${s.year}`);
  prevYear = s.year;
  if (s.leap) leapCount++;
}
if (problems.length) {
  console.error('Vấn đề:', problems.slice(0, 5).join('; '));
  process.exit(1);
}

const span = (starts.at(-1).jdn - starts[0].jdn) / 365.2425;
const expectedLeaps = Math.floor(span / 2.715); // ~7 tháng nhuận mỗi 19 năm
if (Math.abs(leapCount - expectedLeaps) > 12) {
  console.error(`Số tháng nhuận bất thường: ${leapCount} (kỳ vọng ~${expectedLeaps})`);
  process.exit(1);
}

writeFileSync(
  'packages/calendar-core/data/lunar-months.json',
  JSON.stringify(
    {
      $comment:
        'Ngày bắt đầu từng tháng âm lịch, lịch Trung Quốc (UTC+8). jdn = Julian Day Number của ngày mùng 1. utcMs = instant điểm sóc theo Meeus, dùng để suy ngày bắt đầu dưới múi giờ khác; null nếu Meeus lệch ngày.',
      version: 1,
      source: 'lunar-javascript 1.x (寿星天文历) — ngày; Meeus ch.49 — instant',
      fromYear: FROM_YEAR,
      toYear: TO_YEAR,
      count: starts.length,
      starts,
    },
    null,
    0,
  ) + '\n',
  'utf8',
);

console.log(`tháng âm lịch: ${starts.length} (${FROM_YEAR}–${TO_YEAR})`);
console.log(`tháng nhuận: ${leapCount}`);
console.log(`Meeus không khớp ngày: ${mmeusMisses}`);
console.log(`tháng đầu: ${JSON.stringify(starts[0])}`);
console.log(`tháng cuối: ${JSON.stringify(starts.at(-1))}`);
