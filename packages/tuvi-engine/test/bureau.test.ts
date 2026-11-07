import test from 'node:test';
import assert from 'node:assert/strict';
import { bureauOf, branchNumber, stemNumber } from '../src/bureau.ts';

/** 30 cặp nạp âm của 60 Giáp Tý, theo thứ tự. */
const NAYIN_ELEMENT = [
  'kim', 'hoa', 'moc', 'tho', 'kim',
  'hoa', 'thuy', 'tho', 'kim', 'moc',
  'thuy', 'tho', 'hoa', 'moc', 'thuy',
  'kim', 'hoa', 'moc', 'tho', 'kim',
  'hoa', 'thuy', 'tho', 'kim', 'moc',
  'thuy', 'tho', 'hoa', 'moc', 'thuy',
] as const;

const ELEMENT_TO_BUREAU = { thuy: 2, moc: 3, kim: 4, tho: 5, hoa: 6 } as const;

test('ví dụ trong 定五行局訣: 丙子 Thuỷ, 辛未 Thổ, 庚申 Mộc', () => {
  assert.equal(bureauOf(2, 0).zh, '水二局'); // 丙子
  assert.equal(bureauOf(7, 7).zh, '土五局'); // 辛未
  assert.equal(bureauOf(6, 8).zh, '木三局'); // 庚申
});

test('Ngũ Hành Cục khớp nạp âm của cả 60 Giáp Tý', () => {
  for (let k = 0; k < 60; k++) {
    const stem = k % 10;
    const branch = k % 12;
    const expected = NAYIN_ELEMENT[Math.floor(k / 2)];
    assert.equal(
      bureauOf(stem, branch).number,
      ELEMENT_TO_BUREAU[expected],
      `Giáp Tý #${k} (${stem},${branch}) phải là ${expected}`,
    );
  }
});

test('số can và số chi đúng bảng', () => {
  assert.deepEqual(
    Array.from({ length: 10 }, (_, s) => stemNumber(s)),
    [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  );
  assert.deepEqual(
    Array.from({ length: 12 }, (_, b) => branchNumber(b)),
    [1, 1, 2, 2, 3, 3, 1, 1, 2, 2, 3, 3],
  );
});

test('mọi tổ hợp can chi đều cho một cục hợp lệ', () => {
  for (let s = 0; s < 10; s++) {
    for (let b = 0; b < 12; b++) {
      const bureau = bureauOf(s, b);
      assert.ok([2, 3, 4, 5, 6].includes(bureau.number));
      assert.match(bureau.zh, /^[水木金土火][二三四五六]局$/);
    }
  }
});
