import test from 'node:test';
import assert from 'node:assert/strict';
import { luckCycles, luckDirection, pillarFromCycle, qiYun } from '../src/luck.ts';

const DAY = 86_400_000;
const birth = Date.UTC(2000, 0, 1, 12, 0);

test('chiều đại vận: dương nam / âm nữ thuận, còn lại nghịch', () => {
  for (let stem = 0; stem < 10; stem++) {
    const duong = stem % 2 === 0;
    assert.equal(luckDirection(stem, 'nam'), duong ? 'thuan' : 'nghich', `can ${stem} nam`);
    assert.equal(luckDirection(stem, 'nu'), duong ? 'nghich' : 'thuan', `can ${stem} nữ`);
  }
});

const base = {
  yearStem: 0, // Giáp — dương
  birthEpochMs: birth,
  previousJieEpochMs: birth - 15 * DAY,
  nextJieEpochMs: birth + 3 * DAY,
};

test('3 ngày tới tiết kế tiếp → khởi vận đúng 1 năm', () => {
  const q = qiYun({ ...base, gender: 'nam' });
  assert.equal(q.direction, 'thuan');
  assert.equal(q.reference, 'next');
  assert.equal(q.daysToJie, 3);
  assert.equal(q.startAgeYears, 1);
  assert.deepEqual(q.startAge, { years: 1, months: 0, days: 0 });
});

test('1,5 ngày tới tiết trước → 6 tháng (nghịch)', () => {
  const q = qiYun({
    ...base,
    gender: 'nu',
    previousJieEpochMs: birth - 1.5 * DAY,
  });
  assert.equal(q.direction, 'nghich');
  assert.equal(q.reference, 'previous');
  assert.deepEqual(q.startAge, { years: 0, months: 6, days: 0 });
  assert.ok(Math.abs(q.startAgeYears - 0.5) < 1e-12);
});

test('1 giờ = 5 ngày theo quy ước 3 ngày = 1 năm', () => {
  const q = qiYun({ ...base, gender: 'nam', nextJieEpochMs: birth + 60 * 60_000 });
  assert.deepEqual(q.startAge, { years: 0, months: 0, days: 5 });
});

test('mốc tiết không hợp lệ bị từ chối', () => {
  assert.throws(() => qiYun({ ...base, gender: 'nam', nextJieEpochMs: birth - DAY }), RangeError);
  assert.throws(
    () => qiYun({ ...base, gender: 'nu', previousJieEpochMs: birth + DAY }),
    RangeError,
  );
});

test('đại vận thuận tiến 1 bước từ trụ tháng, mỗi vận 10 năm', () => {
  const luck = luckCycles(30, { direction: 'thuan', startAgeYears: 3.5 }, 3);
  assert.deepEqual(luck.map((l) => l.pillar.cycleIndex), [31, 32, 33]);
  assert.deepEqual(luck.map((l) => l.fromAge), [3.5, 13.5, 23.5]);
  assert.deepEqual(luck.map((l) => l.toAge), [13.5, 23.5, 33.5]);
  assert.deepEqual(luck.map((l) => l.index), [1, 2, 3]);
});

test('đại vận nghịch lùi 1 bước, và vận đầu không phải trụ tháng', () => {
  const luck = luckCycles(30, { direction: 'nghich', startAgeYears: 2 }, 3);
  assert.deepEqual(luck.map((l) => l.pillar.cycleIndex), [29, 28, 27]);
  assert.ok(luck.every((l) => l.pillar.cycleIndex !== 30));
});

test('vòng 60 Giáp Tý khi tiến/lùi qua biên', () => {
  const forward = luckCycles(59, { direction: 'thuan', startAgeYears: 0 }, 2);
  assert.deepEqual(forward.map((l) => l.pillar.cycleIndex), [0, 1]);
  const backward = luckCycles(0, { direction: 'nghich', startAgeYears: 0 }, 2);
  assert.deepEqual(backward.map((l) => l.pillar.cycleIndex), [59, 58]);
});

test('số đại vận ngoài 1–12 bị từ chối', () => {
  assert.throws(() => luckCycles(0, { direction: 'thuan', startAgeYears: 0 }, 0), RangeError);
  assert.throws(() => luckCycles(0, { direction: 'thuan', startAgeYears: 0 }, 13), RangeError);
});

test('trụ từ chỉ số vòng 60', () => {
  assert.deepEqual(pillarFromCycle(0), {
    cycleIndex: 0, stem: 0, branch: 0, zh: '甲子', vi: 'Giáp Tý',
  });
  assert.equal(pillarFromCycle(59).zh, '癸亥');
  assert.equal(pillarFromCycle(60).zh, '甲子');
});
