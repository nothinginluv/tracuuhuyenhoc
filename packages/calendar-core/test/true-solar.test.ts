import test from 'node:test';
import assert from 'node:assert/strict';
import {
  equationOfTimeMinutes,
  longitudeCorrectionMinutes,
  trueSolarTime,
} from '../src/true-solar.ts';

const DAY_MS = 86_400_000;

test('equation of time nằm trong khoảng ±17 phút quanh năm', () => {
  const start = Date.UTC(2024, 0, 1);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < 366; i++) {
    const v = equationOfTimeMinutes(start + i * DAY_MS);
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  assert.ok(min > -17 && min < -12, `min=${min}`);
  assert.ok(max > 12 && max < 17, `max=${max}`);
});

test('equation of time: giữa tháng 2 mặt trời chậm ~14 phút', () => {
  const v = equationOfTimeMinutes(Date.UTC(2024, 1, 11));
  assert.ok(v > -16 && v < -12, `nhận ${v}`);
});

test('equation of time: đầu tháng 11 mặt trời nhanh ~16 phút', () => {
  const v = equationOfTimeMinutes(Date.UTC(2024, 10, 3));
  assert.ok(v > 14 && v < 17, `nhận ${v}`);
});

test('hiệu chỉnh kinh độ: 4 phút mỗi độ', () => {
  assert.equal(longitudeCorrectionMinutes(105, 7), 0);
  assert.equal(longitudeCorrectionMinutes(120, 8), 0);
  assert.ok(Math.abs(longitudeCorrectionMinutes(106.7, 8) - -53.2) < 1e-9);
  assert.ok(Math.abs(longitudeCorrectionMinutes(105.85, 7) - 3.4) < 1e-9);
});

test('giờ mặt trời thật: Sài Gòn 23:30 ngày 04/02/1972 rơi vào canh Hợi', () => {
  // 23:30 giờ UTC+8 = 15:30Z.
  const instant = Date.UTC(1972, 1, 4, 15, 30);
  const r = trueSolarTime(instant, 23 * 60 + 30, 106.7, 8);
  assert.ok(r.totalCorrectionMin < -55 && r.totalCorrectionMin > -75, `nhận ${r.totalCorrectionMin}`);
  assert.equal(r.dayShift, 0);
  const hourBranch = Math.floor((Math.floor(r.minutesOfDay / 60) + 1) / 2) % 12;
  assert.equal(hourBranch, 11, `phải là Hợi, nhận ${hourBranch}`);
});

test('giờ mặt trời thật có thể lùi sang ngày hôm trước', () => {
  // 00:05 ngày 12/02/2024 giờ Hà Nội, kinh độ 102°E (lệch −12 phút so với 105°E).
  const instant = Date.UTC(2024, 1, 11, 17, 5);
  const r = trueSolarTime(instant, 5, 102, 7);
  assert.equal(r.dayShift, -1);
  assert.ok(r.minutesOfDay > 23 * 60, 'gần nửa đêm hôm trước');
});

test('minutesOfDay luôn chuẩn hoá về 0–1439', () => {
  for (let civil = 0; civil < 1440; civil += 37) {
    for (const lon of [102.1, 105.8, 109.5]) {
      const r = trueSolarTime(Date.UTC(2024, 6, 1), civil, lon, 7);
      assert.ok(r.minutesOfDay >= 0 && r.minutesOfDay < 1440);
      assert.ok(r.dayShift >= -1 && r.dayShift <= 1);
    }
  }
});
