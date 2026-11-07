import test from 'node:test';
import assert from 'node:assert/strict';
import { BirthInputError, buildChartContext } from '../src/context.ts';

const SG = 'Thành phố Hồ Chí Minh';
const HN = 'Hà Nội';

test('Hà Nội 15/05/1990 14:30 — toàn bộ chuỗi tính', () => {
  const c = buildChartContext(
    { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: HN },
    'chuan-tq',
  );
  assert.equal(c.utcIso, '1990-05-15T07:30:00.000Z');
  assert.equal(c.tz.offsetHours, 7);
  assert.equal(c.tz.region, 'bac');
  // Đồng hồ Bắc Kinh nhanh hơn 1 giờ.
  assert.equal(c.clock.wall.hour, 15);
  assert.equal(c.clock.shiftMinutes, 60);
  assert.deepEqual([c.lunar.cn.day, c.lunar.cn.month], [21, 4]);
  assert.deepEqual(
    [c.pillars.year.vi, c.pillars.month.vi, c.pillars.day.vi, c.pillars.hour.vi],
    ['Canh Ngọ', 'Tân Tỵ', 'Canh Thìn', 'Giáp Thân'],
  );
  assert.equal(c.pillars.year.zh, '庚午');
  assert.equal(c.pillars.day.zh, '庚辰');
  assert.equal(c.pillars.hour.zh, '甲申');
});

test('1972: cùng instant, Sài Gòn (UTC+8) và Hà Nội (UTC+7) — khác trụ ngày', () => {
  const sg = buildChartContext(
    { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: SG },
    'chuan-tq',
  );
  const hn = buildChartContext(
    { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: HN },
    'chuan-tq',
  );

  assert.equal(sg.tz.offsetHours, 8);
  assert.equal(hn.tz.offsetHours, 7);
  assert.equal(sg.utcIso, '1972-02-04T15:30:00.000Z');
  assert.equal(hn.utcIso, '1972-02-04T16:30:00.000Z');

  // Sài Gòn: 23:30 cùng ngày; Hà Nội: 00:30 hôm sau theo giờ Bắc Kinh.
  assert.equal(sg.clock.wall.hour, 23);
  assert.equal(hn.clock.wall.hour, 0);
  assert.equal(hn.clock.wall.day, 5);

  assert.equal(sg.pillars.day.zh, '乙丑');
  assert.equal(hn.pillars.day.zh, '丙寅');
  assert.notEqual(sg.pillars.day.vi, hn.pillars.day.vi);
});

test('Hà Nội 1972 23:30: ba quy ước cho ba trụ giờ khác nhau', () => {
  const base = { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: SG };
  const cn = buildChartContext(base, 'chuan-tq');
  const local = buildChartContext(base, 'vn-dia-phuong');
  const solar = buildChartContext(base, 'vn-mat-troi');

  // Sài Gòn 1972 dùng UTC+8 nên giờ Bắc Kinh trùng giờ dân sự.
  assert.equal(cn.clock.wall.hour, 23);
  assert.equal(local.clock.wall.hour, 23);

  // Giờ mặt trời thật lùi ~67 phút → 22:23, canh Hợi.
  assert.ok(solar.clock.shiftMinutes < -55 && solar.clock.shiftMinutes > -75, `nhận ${solar.clock.shiftMinutes}`);
  assert.equal(solar.clock.wall.hour, 22);
  assert.equal(solar.pillars.hour.vi.split(' ')[1], 'Hợi');

  // Giờ Tý vẫn là Tý với hai quy ước còn lại.
  assert.equal(cn.pillars.hour.vi.split(' ')[1], 'Tý');
  assert.equal(local.pillars.hour.vi.split(' ')[1], 'Tý');
});

test('hai quy ước can giờ cho kết quả khác nhau đúng ở 23:00–23:59', () => {
  const input = { year: 2024, month: 3, day: 1, hour: 23, minute: 30, province: HN };
  const current = buildChartContext(input, { clock: 'birthplace', hourStemRule: 'current-day' });
  const next = buildChartContext(input, { clock: 'birthplace', hourStemRule: 'next-day' });
  assert.equal(current.clock.wall.hour, 23);
  assert.equal(current.pillars.hour.zh, '甲子');
  assert.equal(next.pillars.hour.zh, '丙子');
  // Trụ ngày không đổi — chỉ can giờ đổi.
  assert.equal(current.pillars.day.zh, next.pillars.day.zh);
});

test('phát hiện lệch lịch âm TQ/VN và gắn cảnh báo', () => {
  const hn = buildChartContext(
    { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: HN },
    'chuan-tq',
  );
  assert.equal(hn.lunar.diverges, true);
  assert.ok(hn.warnings.some((w) => w.code === 'calendar-divergence'));

  const sg = buildChartContext(
    { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: SG },
    'chuan-tq',
  );
  assert.equal(sg.lunar.diverges, false);
});

test('Quảng Trị phải hỏi huyện khi sinh 1960–1975', () => {
  assert.throws(
    () => buildChartContext({ year: 1970, month: 6, day: 1, hour: 12, province: 'Quảng Trị' }, 'vn-dia-phuong'),
    (err: unknown) => err instanceof BirthInputError && err.code === 'district-required',
  );
});

test('Quảng Trị: hai bờ sông Bến Hải lệch 1 giờ', () => {
  const vinhLinh = buildChartContext(
    { year: 1970, month: 6, day: 1, hour: 12, province: 'Quảng Trị', district: 'Vĩnh Linh' },
    'vn-dia-phuong',
  );
  const dongHa = buildChartContext(
    { year: 1970, month: 6, day: 1, hour: 12, province: 'Quảng Trị', district: 'Đông Hà' },
    'vn-dia-phuong',
  );
  assert.equal(vinhLinh.tz.offsetHours, 7);
  assert.equal(dongHa.tz.offsetHours, 8);
  // Đông Hà dùng UTC+8 nên cùng giờ tường ứng với instant SỚM hơn 1 giờ.
  assert.equal(vinhLinh.instantMs - dongHa.instantMs, 3_600_000);
});

test('chấp nhận cả mã tỉnh và tên tỉnh', () => {
  const byCode = buildChartContext({ year: 2000, month: 1, day: 1, hour: 10, province: '01' }, 'chuan-tq');
  const byName = buildChartContext({ year: 2000, month: 1, day: 1, hour: 10, province: HN }, 'chuan-tq');
  assert.equal(byCode.tz.province, 'Hà Nội');
  assert.equal(byCode.instantMs, byName.instantMs);
});

test('từ chối ngày không tồn tại', () => {
  assert.throws(
    () => buildChartContext({ year: 2023, month: 2, day: 29, hour: 10 }, 'chuan-tq'),
    (err: unknown) => err instanceof BirthInputError && err.code === 'invalid-date',
  );
});

test('từ chối năm ngoài phạm vi và đầu vào vô lý', () => {
  assert.throws(
    () => buildChartContext({ year: 1899, month: 1, day: 1, hour: 0 }, 'chuan-tq'),
    (err: unknown) => err instanceof BirthInputError && err.code === 'invalid-input',
  );
  assert.throws(
    () => buildChartContext({ year: 2000, month: 1, day: 1, hour: 24 }, 'chuan-tq'),
    (err: unknown) => err instanceof BirthInputError,
  );
  assert.throws(
    () => buildChartContext({ year: 2000, month: 13, day: 1, hour: 0 }, 'chuan-tq'),
    (err: unknown) => err instanceof BirthInputError,
  );
});

test('giờ mặt trời thật cần kinh độ', () => {
  assert.throws(
    () => buildChartContext({ year: 2000, month: 1, day: 1, hour: 10 }, 'vn-mat-troi'),
    (err: unknown) => err instanceof BirthInputError && err.code === 'longitude-required',
  );
});

test('ghi đè múi giờ được tôn trọng', () => {
  const c = buildChartContext(
    { year: 1970, month: 6, day: 1, hour: 12, province: HN, utcOffsetHours: 8 },
    'vn-dia-phuong',
  );
  assert.equal(c.tz.offsetHours, 8);
  assert.equal(c.tz.fromTable, false);
  assert.equal(c.utcIso, '1970-06-01T04:00:00.000Z');
});

test('sinh sát mốc tiết khí có cảnh báo', () => {
  // 14:30 Hà Nội = 15:30 Bắc Kinh, chỉ 57 phút trước Lập Xuân 2024 (16:27).
  const c = buildChartContext(
    { year: 2024, month: 2, day: 4, hour: 14, minute: 30, province: HN },
    'chuan-tq',
  );
  assert.ok(c.warnings.some((w) => w.code === 'jie-proximity'));
});

test('sinh giữa năm không có cảnh báo tiết khí', () => {
  const c = buildChartContext({ year: 1995, month: 7, day: 1, hour: 12, province: HN }, 'chuan-tq');
  assert.equal(c.warnings.some((w) => w.code === 'jie-proximity'), false);
  assert.equal(c.warnings.some((w) => w.code === 'calendar-divergence'), false);
});

test('cảnh báo dùng tiếng Việt và mã ổn định', () => {
  const c = buildChartContext({ year: 2024, month: 2, day: 4, hour: 23, minute: 20, province: HN }, 'chuan-tq');
  assert.ok(c.warnings.length > 0);
  for (const w of c.warnings) {
    assert.match(w.code, /^[a-z-]+$/);
    assert.ok(w.message.length > 20);
    assert.ok(['info', 'warn'].includes(w.severity));
  }
});

test('preset không tồn tại bị từ chối', () => {
  assert.throws(
    () => buildChartContext({ year: 2000, month: 1, day: 1, hour: 0 }, 'khong-co' as never),
    /Preset không tồn tại/,
  );
});
