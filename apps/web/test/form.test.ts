import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FORM, QUANG_TRI, parseForm, type FormValues } from '../src/form.ts';

const form = (patch: Partial<FormValues> = {}): FormValues => ({ ...DEFAULT_FORM, ...patch });

test('ngày giờ hợp lệ → BirthInput không có tỉnh', () => {
  const { input, error } = parseForm(form());
  assert.equal(error, null);
  assert.deepEqual(input, { year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
});

test('chấp nhận số có số 0 đứng trước', () => {
  const { input, error } = parseForm(form({ month: '01', day: '09', hour: '05', minute: '07' }));
  assert.equal(error, null);
  assert.equal(input.month, 1);
  assert.equal(input.day, 9);
  assert.equal(input.hour, 5);
  assert.equal(input.minute, 7);
});

test('tỉnh được truyền vào input', () => {
  const { input, error } = parseForm(form({ province: '01' }));
  assert.equal(error, null);
  assert.equal(input.province, '01');
  assert.equal(input.district, undefined);
});

test('Quảng Trị 1960–1975 không chọn huyện → mặc định nam vĩ tuyến 17', () => {
  const { input, error } = parseForm(form({ year: '1965', province: QUANG_TRI }));
  assert.equal(error, null);
  assert.equal(input.district, 'Huyện khác (nam vĩ tuyến 17)');
});

test('Quảng Trị giữ huyện người dùng chọn', () => {
  const { input, error } = parseForm(
    form({ year: '1965', province: QUANG_TRI, district: 'Vĩnh Linh (bắc vĩ tuyến 17)' }),
  );
  assert.equal(error, null);
  assert.equal(input.district, 'Vĩnh Linh (bắc vĩ tuyến 17)');
});

test('tỉnh khác Quảng Trị bỏ qua district', () => {
  const { input, error } = parseForm(form({ province: '01', district: 'X' }));
  assert.equal(error, null);
  assert.equal(input.district, undefined);
});

test('năm trước 1900 bị chặn', () => {
  const { error } = parseForm(form({ year: '1899' }));
  assert.match(error ?? '', /1900/);
});

test('tháng ngoài 1–12 bị chặn', () => {
  assert.match(parseForm(form({ month: '0' })).error ?? '', /Tháng/);
  assert.match(parseForm(form({ month: '13' })).error ?? '', /Tháng/);
});

test('ngày ngoài 1–31 bị chặn', () => {
  assert.match(parseForm(form({ day: '0' })).error ?? '', /Ngày/);
  assert.match(parseForm(form({ day: '32' })).error ?? '', /Ngày/);
});

test('giờ ngoài 0–23 bị chặn', () => {
  assert.match(parseForm(form({ hour: '24' })).error ?? '', /Giờ/);
});

test('phút ngoài 0–59 bị chặn', () => {
  assert.match(parseForm(form({ minute: '60' })).error ?? '', /Phút/);
});

test('chữ không phải số bị chặn', () => {
  assert.match(parseForm(form({ year: 'abc' })).error ?? '', /Năm/);
});

test('năm tương lai bị chặn', () => {
  const next = String(new Date().getFullYear() + 1);
  assert.match(parseForm(form({ year: next })).error ?? '', /Năm/);
});

test('khi lỗi, input rỗng để không tính nhầm', () => {
  const { input, error } = parseForm(form({ month: '13' }));
  assert.ok(error);
  assert.equal(Object.keys(input).length, 0);
});
