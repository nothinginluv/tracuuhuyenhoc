import test from 'node:test';
import assert from 'node:assert/strict';
import { dateFromEpochDay, dayCycleIndex, epochDayFromDate, jdFromDate, jdToDate } from '../src/jdn.ts';

test('jdFromDate: mốc chuyển lịch Julius → Gregory', () => {
  assert.equal(jdFromDate(4, 10, 1582), 2299160); // ngày cuối lịch Julius
  assert.equal(jdFromDate(15, 10, 1582), 2299161); // ngày đầu lịch Gregory
});

test('jdFromDate / jdToDate khứ hồi trên 200 năm', () => {
  for (let y = 1900; y <= 2100; y += 7) {
    for (let m = 1; m <= 12; m += 5) {
      for (const d of [1, 15, 28]) {
        const back = jdToDate(jdFromDate(d, m, y));
        assert.deepEqual(back, { d, m, y }, `${d}/${m}/${y}`);
      }
    }
  }
});

test('dayCycleIndex: 2024-02-04 là 戊戌 (34)', () => {
  assert.equal(dayCycleIndex(jdFromDate(4, 2, 2024)), 34);
});

test('dayCycleIndex: 1900-01-01 là 甲戌 (10)', () => {
  assert.equal(dayCycleIndex(jdFromDate(1, 1, 1900)), 10);
});

test('dayCycleIndex luôn nằm trong 0–59', () => {
  for (let jd = 2_415_000; jd < 2_500_000; jd += 97) {
    const i = dayCycleIndex(jd);
    assert.ok(i >= 0 && i < 60, `jd=${jd} → ${i}`);
  }
});

test('epochDayFromDate khớp mốc Unix', () => {
  assert.equal(epochDayFromDate(1970, 1, 1), 0);
  assert.deepEqual(dateFromEpochDay(0), { d: 1, m: 1, y: 1970 });
  assert.equal(epochDayFromDate(2024, 2, 4), 19_757);
});
