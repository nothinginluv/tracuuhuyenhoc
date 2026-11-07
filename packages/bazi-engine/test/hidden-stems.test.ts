import test from 'node:test';
import assert from 'node:assert/strict';
import { hiddenStems, mainHiddenStem } from '../src/hidden-stems.ts';

test('bản khí của 12 chi', () => {
  const expected = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]; // 癸 己 甲 乙 戊 丙 丁 己 庚 辛 戊 壬
  for (let b = 0; b < 12; b++) {
    assert.equal(mainHiddenStem(b).stem, expected[b], `chi ${b}`);
    assert.equal(mainHiddenStem(b).role, 'ban-khi');
  }
});

test('thành viên tàng can khớp 地支藏遁歌', () => {
  const expected = [
    [9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4],
    [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0],
  ];
  for (let b = 0; b < 12; b++) {
    assert.deepEqual(
      hiddenStems(b).map((h) => h.stem),
      expected[b],
      `chi ${b}`,
    );
  }
});

test('tổng số can tàng là 28, mỗi chi 1–3 can', () => {
  let total = 0;
  for (let b = 0; b < 12; b++) {
    const h = hiddenStems(b);
    assert.ok(h.length >= 1 && h.length <= 3, `chi ${b}: ${h.length}`);
    total += h.length;
  }
  assert.equal(total, 28);
});

test('thứ tự vai trò: bản khí → trung khí → dư khí', () => {
  const roles = hiddenStems(4).map((h) => h.role); // Thìn: 戊 乙 癸
  assert.deepEqual(roles, ['ban-khi', 'trung-khi', 'du-khi']);
  assert.deepEqual(hiddenStems(4).map((h) => h.roleZh), ['本氣', '中氣', '餘氣']);
  // Chi chỉ có một can thì không có trung/dư khí.
  assert.deepEqual(hiddenStems(0).map((h) => h.role), ['ban-khi']);
});

test('chỉ số chi được chuẩn hoá vòng 12', () => {
  assert.deepEqual(
    hiddenStems(12).map((h) => h.stem),
    hiddenStems(0).map((h) => h.stem),
  );
  assert.deepEqual(
    hiddenStems(-1).map((h) => h.stem),
    hiddenStems(11).map((h) => h.stem),
  );
});
