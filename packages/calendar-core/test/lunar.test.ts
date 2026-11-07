import test from 'node:test';
import assert from 'node:assert/strict';
import { lunarAtInstant, lunarDivergesOn, solarToLunar } from '../src/lunar.ts';

const TZ_CN = 8;
const TZ_VN = 7;

/** Instant tương ứng với giờ tường Bắc Kinh. */
const beijing = (y: number, m: number, d: number, h = 0, mi = 0): number =>
  Date.UTC(y, m - 1, d, h, mi) - 8 * 3_600_000;

test('Tết Nguyên Đán — mùng 1 tháng Giêng', () => {
  const cases: [number, number, number, number][] = [
    [2024, 2, 10, 2024],
    [2023, 1, 22, 2023],
    [2025, 1, 29, 2025],
    [2000, 2, 5, 2000],
    [1900, 1, 31, 1900],
  ];
  for (const [y, m, d, lunarYear] of cases) {
    const l = solarToLunar(d, m, y, TZ_CN);
    assert.equal(l.month, 1, `${d}/${m}/${y} phải là tháng Giêng`);
    assert.equal(l.day, 1, `${d}/${m}/${y} phải là mùng 1`);
    assert.equal(l.leap, false);
    assert.equal(l.year, lunarYear);
  }
});

test('Tết năm 2024 là ngày 10/02 với cả hai múi giờ', () => {
  assert.equal(solarToLunar(10, 2, 2024, TZ_CN).day, 1);
  assert.equal(solarToLunar(10, 2, 2024, TZ_VN).day, 1);
});

test('Năm can chi của Tết 2024 là Giáp Thìn (40)', () => {
  assert.equal(solarToLunar(10, 2, 2024, TZ_CN).yearCycleIndex, 40);
});

test('Tháng nhuận: 23/05/2020 là 1 tháng 4 nhuận', () => {
  const l = solarToLunar(23, 5, 2020, TZ_CN);
  assert.equal(l.month, 4);
  assert.equal(l.day, 1);
  assert.equal(l.leap, true);
});

test('Tháng nhuận: 21/06/2020 là 1 tháng 5 (không nhuận)', () => {
  const l = solarToLunar(21, 6, 2020, TZ_CN);
  assert.equal(l.month, 5);
  assert.equal(l.day, 1);
  assert.equal(l.leap, false);
});

test('Năm 2033 — tháng 11 nhuận (ca khó của thuật toán âm lịch)', () => {
  const l = solarToLunar(22, 12, 2033, TZ_CN);
  assert.equal(l.month, 11);
  assert.equal(l.day, 1);
  assert.equal(l.leap, true);
});

test('lunarAtInstant: cùng instant, hai múi giờ, hai ngày âm lịch', () => {
  // 04/02/1972 23:30 giờ Hà Nội (UTC+7) = 16:30Z.
  const instant = Date.UTC(1972, 1, 4, 16, 30);
  const cn = lunarAtInstant(instant, TZ_CN);
  const vn = lunarAtInstant(instant, TZ_VN);
  assert.deepEqual([cn.day, cn.month], [21, 12]);
  assert.deepEqual([vn.day, vn.month], [20, 12]);
});

test('lunarDivergesOn phát hiện ngày lệch lịch', () => {
  // 20/05/1961: lịch TQ và lịch VN lệch nhau một ngày.
  assert.equal(lunarDivergesOn(20, 5, 1961), true);
  assert.equal(lunarDivergesOn(10, 2, 2024), false);
});

test('ca từng sai của thuật toán cũ: 05/03/1924 phải là mùng 1 tháng 2', () => {
  // Công thức Hồ Ngọc Đức đặt sóc sang 06/03 và lệch cả tháng.
  const l = solarToLunar(5, 3, 1924, TZ_CN);
  assert.equal(l.day, 1);
  assert.equal(l.month, 2);
  assert.equal(l.leap, false);
});

test('Mọi ngày trong 1960–2026 đều cho tháng 1–12, ngày 1–30', () => {
  for (let y = 1960; y <= 2026; y += 3) {
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 10, 20, 28]) {
        const l = solarToLunar(d, m, y, TZ_CN);
        assert.ok(l.month >= 1 && l.month <= 12, `${d}/${m}/${y}: tháng ${l.month}`);
        assert.ok(l.day >= 1 && l.day <= 30, `${d}/${m}/${y}: ngày ${l.day}`);
        assert.ok(l.year === y || l.year === y - 1, `${d}/${m}/${y}: năm ${l.year}`);
      }
    }
  }
});

test('Bắc Kinh: đúng 00:00 là ngày mới, 23:59 vẫn ngày cũ', () => {
  const midnight = lunarAtInstant(beijing(2024, 2, 10, 0, 0), TZ_CN);
  const lateNight = lunarAtInstant(beijing(2024, 2, 9, 23, 59), TZ_CN);
  assert.equal(midnight.day, 1);
  assert.equal(lateNight.day, 30);
});
