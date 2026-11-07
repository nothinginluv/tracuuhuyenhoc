import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildChartContext, type BirthInput } from '../../calendar-core/src/index.ts';
import { buildBaziChart } from '../src/chart.ts';
import type { Gender } from '../src/constants.ts';

const INPUT: BirthInput = {
  year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: 'Hà Nội',
};

const ctx = buildChartContext(INPUT, 'chuan-tq');
const chart = (gender: Gender) =>
  buildBaziChart(ctx, { gender, luckCount: 8 });

test('tứ trụ lấy nguyên từ calendar-core', () => {
  const c = chart('nam');
  assert.deepEqual(
    [c.pillars.year.vi, c.pillars.month.vi, c.pillars.day.vi, c.pillars.hour.vi],
    ['Canh Ngọ', 'Tân Tỵ', 'Canh Thìn', 'Giáp Thân'],
  );
  assert.equal(c.dayMaster.zh, '庚');
  assert.equal(c.dayMaster.element, 'kim');
  assert.equal(c.dayMaster.yinYang, 'duong');
});

test('thập thần của 4 can, can ngày là nhật chủ', () => {
  const c = chart('nam');
  assert.deepEqual(
    c.stems.map((s) => s.tenGod?.id ?? null),
    ['ty-kiep', 'kiep-tai', null, 'thien-tai'],
  );
  assert.equal(c.dayMaster.vi, 'Canh');
});

test('tàng can và thập thần tàng can của từng chi', () => {
  const c = chart('nam');

  const year = c.branches[0]!; // 午: 丁 己
  assert.deepEqual(year.hidden.map((h) => h.zh), ['丁', '己']);
  assert.deepEqual(year.hidden.map((h) => h.tenGod.id), ['chinh-quan', 'chinh-an']);

  const month = c.branches[1]!; // 巳: 丙 庚 戊
  assert.deepEqual(month.hidden.map((h) => h.tenGod.id), ['that-sat', 'ty-kiep', 'thien-an']);

  const day = c.branches[2]!; // 辰: 戊 乙 癸
  assert.deepEqual(day.hidden.map((h) => h.tenGod.id), ['thien-an', 'chinh-tai', 'thuong-quan']);

  const hour = c.branches[3]!; // 申: 庚 壬 戊
  assert.deepEqual(hour.hidden.map((h) => h.tenGod.id), ['ty-kiep', 'thuc-than', 'thien-an']);
});

test('đếm ngũ hành 8 chữ và toàn bộ tàng can', () => {
  const c = chart('nam');
  assert.deepEqual(c.elementCounts, { moc: 1, hoa: 2, tho: 1, kim: 4, thuy: 0 });
  assert.equal(Object.values(c.elementCounts).reduce((a, b) => a + b, 0), 8);

  // 午(2) + 巳(3) + 辰(3) + 申(3) = 11 can tàng.
  assert.deepEqual(c.hiddenElementCounts, { moc: 1, hoa: 2, tho: 4, kim: 2, thuy: 2 });
  assert.equal(Object.values(c.hiddenElementCounts).reduce((a, b) => a + b, 0), 11);
});

test('nam dương đi thuận, nữ dương đi nghịch; vận đầu tiến/lùi từ trụ tháng', () => {
  const nam = chart('nam');
  assert.equal(nam.qiYun.direction, 'thuan');
  assert.equal(nam.luck[0]!.pillar.zh, '壬午'); // 辛巳 + 1
  assert.equal(nam.luck.length, 8);
  assert.equal(nam.luck[1]!.pillar.zh, '癸未');

  const nu = chart('nu');
  assert.equal(nu.qiYun.direction, 'nghich');
  assert.equal(nu.luck[0]!.pillar.zh, '庚辰'); // 辛巳 − 1
  assert.equal(nu.luck[1]!.pillar.zh, '己卯');
});

test('tuổi khởi vận nằm giữa hai tiết khí và các vận cách nhau 10 năm', () => {
  const c = chart('nam');
  assert.ok(c.qiYun.daysToJie > 0);
  assert.ok(Math.abs(c.qiYun.startAgeYears - c.qiYun.daysToJie / 3) < 1e-9);
  for (let i = 1; i < c.luck.length; i++) {
    assert.ok(Math.abs(c.luck[i]!.fromAge - c.luck[i - 1]!.toAge) < 1e-9);
    assert.ok(Math.abs(c.luck[i]!.toAge - c.luck[i]!.fromAge - 10) < 1e-9);
  }
});

test('mọi trích dẫn engine khai báo đều có trong content/quotes.jsonl', () => {
  const lines = readFileSync(new URL('../../../content/quotes.jsonl', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { id: string });
  const ids = new Set(lines.map((q) => q.id));

  const c = chart('nam');
  // Nhãn nguồn của cả 4 nhóm công thức.
  assert.deepEqual(Object.values(c.citations).sort(), [
    'q_bz_0004', 'q_bz_0005', 'q_bz_0006', 'q_bz_0007', 'q_bz_0008',
  ]);
  for (const id of Object.values(c.citations)) {
    assert.ok(ids.has(id), `thiếu trích dẫn ${id}`);
  }
});

test('giới tính không hợp lệ bị từ chối', () => {
  assert.throws(() => buildBaziChart(ctx, { gender: 'khac' as Gender }), RangeError);
});

test('số đại vận ngoài miền bị từ chối', () => {
  assert.throws(() => buildBaziChart(ctx, { gender: 'nam', luckCount: 0 }), RangeError);
  assert.throws(() => buildBaziChart(ctx, { gender: 'nam', luckCount: 13 }), RangeError);
});
