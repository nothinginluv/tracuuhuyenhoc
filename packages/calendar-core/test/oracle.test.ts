/**
 * Đối chứng với `lunar-javascript` — thư viện độc lập, dùng bảng tiết khí và
 * thuật toán âm lịch khác.
 *
 * Không phải "kiểm tra đúng/sai" tuyệt đối: nó là một oracle thứ hai. Chỗ nào
 * khác, ta phải giải thích được VÌ SAO — và ghi lại thành test, không sửa cho khớp.
 *
 * Ba khác biệt đã biết:
 *   1. Tiết khí: lunar-javascript chia theo NGÀY, ta chia theo INSTANT.
 *   2. Can giờ 23:00–23:59: nó lấy can ngày kế tiếp, ta lấy can ngày hiện tại.
 *   3. Không so múi giờ: nó luôn là UTC+8.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Solar } from 'lunar-javascript';
import { lunarAtInstant } from '../src/lunar.ts';
import { computePillars } from '../src/context.ts';
import { jieBefore, termAfter } from '../src/solar-terms.ts';

const BJT = 8 * 3_600_000;

type Oracle = {
  lunarMonth: number;
  lunarDay: number;
  leap: boolean;
  year: string;
  month: string;
  day: string;
  hour: string;
};

function oracle(y: number, m: number, d: number, h: number, mi = 0): Oracle {
  const l = Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar();
  return {
    lunarMonth: Math.abs(l.getMonth()),
    lunarDay: l.getDay(),
    leap: l.getMonth() < 0,
    year: l.getYearInGanZhiByLiChun(),
    month: l.getMonthInGanZhi(),
    day: l.getDayInGanZhi(),
    hour: l.getTimeInGanZhi(),
  };
}

const wall = (y: number, m: number, d: number, h: number, mi = 0) => ({
  year: y, month: m, day: d, hour: h, minute: mi,
});
const instantOf = (y: number, m: number, d: number, h: number, mi = 0) =>
  Date.UTC(y, m - 1, d, h, mi) - BJT;

test('âm lịch khớp oracle trên gần 4.000 ngày mẫu (1900–2026)', () => {
  let checked = 0;
  for (let y = 1900; y <= 2026; y += 2) {
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 8, 15, 22, 28]) {
        const inst = instantOf(y, m, d, 12);
        const ours = lunarAtInstant(inst, 8);
        const theirs = oracle(y, m, d, 12);
        assert.deepEqual(
          [ours.month, ours.day, ours.leap],
          [theirs.lunarMonth, theirs.lunarDay, theirs.leap],
          `lệch âm lịch ${d}/${m}/${y}`,
        );
        checked++;
      }
    }
  }
  assert.ok(checked > 3_800, `chỉ kiểm ${checked} ngày`);
});

test('trụ ngày và trụ giờ khớp oracle ngoài khung 23:00–23:59', () => {
  let checked = 0;
  for (let y = 1900; y <= 2026; y += 5) {
    for (let m = 1; m <= 12; m += 2) {
      for (const [d, h] of [[3, 0], [9, 6], [17, 12], [25, 18], [27, 22]] as const) {
        const o = oracle(y, m, d, h);
        const p = computePillars({
          instantMs: instantOf(y, m, d, h),
          wall: wall(y, m, d, h),
          ziBoundary: 'late',
        }).pillars;
        assert.equal(p.day.zh, o.day, `trụ ngày ${d}/${m}/${y} ${h}h`);
        assert.equal(p.hour.zh, o.hour, `trụ giờ ${d}/${m}/${y} ${h}h`);
        checked++;
      }
    }
  }
  assert.ok(checked > 700, `chỉ kiểm ${checked} mốc`);
});

test('trụ năm/tháng khớp oracle khi cách mốc tiết khí hơn 2 ngày', () => {
  let checked = 0;
  const skipped: string[] = [];
  for (let y = 1900; y <= 2026; y += 2) {
    for (let m = 1; m <= 12; m++) {
      for (const d of [5, 20]) {
        const inst = instantOf(y, m, d, 12);
        const jie = jieBefore(inst);
        const next = termAfter(inst);
        const farFromTerm =
          inst - jie.epoch > 2 * 86_400_000 &&
          (next == null || next.epoch - inst > 2 * 86_400_000);
        if (!farFromTerm) {
          skipped.push(`${d}/${m}/${y}`);
          continue;
        }
        const o = oracle(y, m, d, 12);
        const p = computePillars({ instantMs: inst, wall: wall(y, m, d, 12), ziBoundary: 'late' }).pillars;
        assert.equal(p.year.zh, o.year, `trụ năm ${d}/${m}/${y}`);
        assert.equal(p.month.zh, o.month, `trụ tháng ${d}/${m}/${y}`);
        checked++;
      }
    }
  }
  assert.ok(checked > 700, `chỉ kiểm ${checked} mốc`);
});

test('khác biệt #1 — oracle chia tiết khí theo ngày, ta theo instant', () => {
  // 04/02/2024: Lập Xuân lúc 16:27:07 giờ Bắc Kinh.
  const o = oracle(2024, 2, 4, 10);
  const p = computePillars({
    instantMs: instantOf(2024, 2, 4, 10),
    wall: wall(2024, 2, 4, 10),
    ziBoundary: 'late',
  }).pillars;
  assert.equal(o.month, '丙寅', 'oracle đã sang tháng Dần dù mới 10:00');
  assert.equal(p.month.zh, '乙丑', 'ta vẫn ở tháng Sửu vì chưa tới 16:27');
  assert.notEqual(p.month.zh, o.month);
});

test('khác biệt #2 — oracle lấy can ngày kế tiếp cho giờ Tý 23:30', () => {
  const o = oracle(2024, 3, 1, 23, 30);
  const current = computePillars({
    instantMs: instantOf(2024, 3, 1, 23, 30),
    wall: wall(2024, 3, 1, 23, 30),
    ziBoundary: 'late',
    hourStemRule: 'current-day',
  }).pillars;
  const next = computePillars({
    instantMs: instantOf(2024, 3, 1, 23, 30),
    wall: wall(2024, 3, 1, 23, 30),
    ziBoundary: 'late',
    hourStemRule: 'next-day',
  }).pillars;

  // Trụ ngày: cả ba bên đều thống nhất (Tý muộn).
  assert.equal(o.day, '甲子');
  assert.equal(current.day.zh, '甲子');
  assert.equal(next.day.zh, '甲子');

  // Trụ giờ: preset `lunar-js` tái lập đúng oracle.
  assert.equal(o.hour, '丙子');
  assert.equal(next.hour.zh, o.hour);
  assert.equal(current.hour.zh, '甲子');
  assert.notEqual(current.hour.zh, o.hour);
});
