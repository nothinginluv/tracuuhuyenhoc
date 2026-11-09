import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locatorVi } from '../src/locator.ts';

test('quyển ghi bằng số Hán → quyển N', () => {
  assert.equal(locatorVi('卷一'), 'quyển 1');
  assert.equal(locatorVi('卷二'), 'quyển 2');
  assert.equal(locatorVi('卷三'), 'quyển 3');
  assert.equal(locatorVi('卷十二'), 'quyển 12');
  assert.equal(locatorVi('卷二十'), 'quyển 20');
});

test('quyển ghi bằng số Ả Rập → giữ số, bỏ số 0 đứng trước', () => {
  assert.equal(locatorVi('卷02'), 'quyển 2');
  assert.equal(locatorVi('卷11'), 'quyển 11');
  assert.equal(locatorVi('卷 7'), 'quyển 7');
});

test('toàn thiên và khoảng trắng thừa', () => {
  assert.equal(locatorVi('全篇'), 'toàn thiên');
  assert.equal(locatorVi('  全篇 '), 'toàn thiên');
  assert.equal(locatorVi(' 卷一 '), 'quyển 1');
});

test('không nhận dạng được → không bịa vị trí', () => {
  assert.equal(locatorVi(''), 'không rõ vị trí');
  assert.equal(locatorVi('phụ lục'), 'không rõ vị trí');
  assert.equal(locatorVi('卷'), 'không rõ vị trí');
  assert.equal(locatorVi('卷甲'), 'không rõ vị trí');
});
