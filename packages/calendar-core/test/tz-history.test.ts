import test from 'node:test';
import assert from 'node:assert/strict';
import { TZ_HISTORY_NOTES, regionFromLatitude, vnTzOffsetHours } from '../src/vn-tz-history.ts';

const at = (y: number, m: number, d: number, h = 12): number => Date.UTC(y, m - 1, d, h);

test('trước 1960: cả nước UTC+7', () => {
  assert.equal(vnTzOffsetHours(at(1959, 12, 31), 'bac'), 7);
  assert.equal(vnTzOffsetHours(at(1959, 12, 31), 'nam'), 7);
  assert.equal(vnTzOffsetHours(at(1900, 1, 1), 'nam'), 7);
});

test('1960–12/06/1975: Bắc +7, Nam +8', () => {
  assert.equal(vnTzOffsetHours(at(1960, 1, 1), 'bac'), 7);
  assert.equal(vnTzOffsetHours(at(1960, 1, 1), 'nam'), 8);
  assert.equal(vnTzOffsetHours(at(1972, 2, 4), 'bac'), 7);
  assert.equal(vnTzOffsetHours(at(1972, 2, 4), 'nam'), 8);
});

test('từ 13/06/1975: cả nước trở lại UTC+7', () => {
  assert.equal(vnTzOffsetHours(at(1975, 6, 12), 'nam'), 8);
  assert.equal(vnTzOffsetHours(at(1975, 6, 13), 'nam'), 7);
  assert.equal(vnTzOffsetHours(at(1976, 1, 1), 'nam'), 7);
  assert.equal(vnTzOffsetHours(at(2024, 2, 4), 'nam'), 7);
});

test('Tam giác Quảng Trị 1970: hai bờ sông Bến Hải khác múi giờ', () => {
  const t = at(1970, 6, 1);
  assert.equal(vnTzOffsetHours(t, 'bac'), 7); // Vĩnh Linh
  assert.equal(vnTzOffsetHours(t, 'nam'), 8); // Đông Hà, Đồng Hới (Quảng Bình cũng +7)
});

test('regionFromLatitude: vĩ tuyến 17 là ranh giới', () => {
  assert.equal(regionFromLatitude(16.9), 'nam');
  assert.equal(regionFromLatitude(17.0), 'bac');
  assert.equal(regionFromLatitude(21.0), 'bac');
});

test('ghi chú nguồn có mốc thời gian', () => {
  assert.equal(TZ_HISTORY_NOTES.south8Start, '1960-01-01');
  assert.equal(TZ_HISTORY_NOTES.south8End, '1975-06-12');
});
