import test from 'node:test';
import assert from 'node:assert/strict';
import { computePillars, type WallTime } from '../src/context.ts';

const bjWall = (y: number, m: number, d: number, h: number, mi = 0): WallTime => ({ year: y, month: m, day: d, hour: h, minute: mi });
const bjInstant = (y: number, m: number, d: number, h: number, mi = 0): number =>
  Date.UTC(y, m - 1, d, h, mi) - 8 * 3_600_000;

const run = (y: number, m: number, d: number, h: number, mi = 0, zi: 'late' | 'early' = 'late') =>
  computePillars({ instantMs: bjInstant(y, m, d, h, mi), wall: bjWall(y, m, d, h, mi), ziBoundary: zi }).pillars;

const str = (p: { vi: string }) => p.vi;

test('04/02/2024 16:30 (sau Lập Xuân) → Giáp Thìn / Bính Dần / Mậu Tuất / Canh Thân', () => {
  const p = run(2024, 2, 4, 16, 30);
  assert.equal(str(p.year), 'Giáp Thìn');
  assert.equal(str(p.month), 'Bính Dần');
  assert.equal(str(p.day), 'Mậu Tuất');
  assert.equal(str(p.hour), 'Canh Thân');
});

test('04/02/2024 16:00 (trước Lập Xuân 16:27) → vẫn là Quý Mão / Ất Sửu', () => {
  const p = run(2024, 2, 4, 16, 0);
  assert.equal(str(p.year), 'Quý Mão');
  assert.equal(str(p.month), 'Ất Sửu');
  // Trụ ngày không đổi — cùng một ngày dương lịch.
  assert.equal(str(p.day), 'Mậu Tuất');
});

test('ranh giới tiết khí là instant, không phải ngày', () => {
  const before = run(2024, 2, 4, 16, 27); // 16:27:00 < 16:27:07
  const after = run(2024, 2, 4, 16, 28);
  assert.equal(str(before.month), 'Ất Sửu');
  assert.equal(str(after.month), 'Bính Dần');
  assert.equal(str(before.year), 'Quý Mão');
  assert.equal(str(after.year), 'Giáp Thìn');
});

test('Tý muộn: 23:30 ngày 01/03/2024 vẫn thuộc ngày 01/03', () => {
  const p = run(2024, 3, 1, 23, 30, 'late');
  assert.equal(str(p.day), 'Giáp Tý');
  // Can giờ suy từ can ngày hiện tại (Giáp) → Giáp Tý.
  assert.equal(str(p.hour), 'Giáp Tý');
});

test('quy ước can giờ "ngày kế tiếp" cho 23:30 ra canh Tý khác can', () => {
  const current = computePillars({
    instantMs: bjInstant(2024, 3, 1, 23, 30),
    wall: bjWall(2024, 3, 1, 23, 30),
    ziBoundary: 'late',
    hourStemRule: 'current-day',
  }).pillars;
  const next = computePillars({
    instantMs: bjInstant(2024, 3, 1, 23, 30),
    wall: bjWall(2024, 3, 1, 23, 30),
    ziBoundary: 'late',
    hourStemRule: 'next-day',
  }).pillars;
  assert.equal(current.hour.zh, '甲子');
  assert.equal(next.hour.zh, '丙子');
  assert.equal(current.day.zh, next.day.zh);
});

test('Tý sớm: 23:30 ngày 01/03/2024 đã sang ngày 02/03', () => {
  const p = run(2024, 3, 1, 23, 30, 'early');
  assert.equal(str(p.day), 'Ất Sửu');
  // Can giờ suy từ can ngày MỚI (Ất → Bính Tý).
  assert.equal(str(p.hour), 'Bính Tý');
});

test('Tý sớm 23:30 trùng kết quả với Tý muộn 00:30 hôm sau', () => {
  const early = run(2024, 3, 1, 23, 30, 'early');
  const late = run(2024, 3, 2, 0, 30, 'late');
  assert.deepEqual(
    [early.year.vi, early.month.vi, early.day.vi, early.hour.vi],
    [late.year.vi, late.month.vi, late.day.vi, late.hour.vi],
  );
});

test('12 canh giờ: mỗi canh 2 tiếng, bắt đầu 23:00', () => {
  const expected = [
    'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ',
    'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
  ];
  for (let h = 0; h < 24; h++) {
    const p = run(2024, 6, 1, h, 30);
    const want = expected[Math.floor((h + 1) / 2) % 12];
    assert.equal(p.hour.vi.split(' ')[1], want, `giờ ${h}:30`);
  }
});

test('五虎遁: tháng Dần của năm Giáp/Kỷ là Bính Dần', () => {
  const jan = run(1984, 2, 10, 12); // sau Lập Xuân, trong tháng Dần
  assert.equal(str(jan.year), 'Giáp Tý');
  assert.equal(str(jan.month), 'Bính Dần');
  const mao = run(1984, 3, 10, 12); // sau Kinh Trập → tháng Mão
  assert.equal(str(mao.month), 'Đinh Mão');
});

test('五鼠遁: ngày Giáp, giờ Tý là Giáp Tý', () => {
  // 01/03/2024 là ngày Giáp Tý.
  const p = run(2024, 3, 1, 0, 30);
  assert.equal(str(p.day), 'Giáp Tý');
  assert.equal(str(p.hour), 'Giáp Tý');
});

test('trụ tháng và trụ giờ luôn có can chi hợp lệ (k ≡ can mod 10, k ≡ chi mod 12)', () => {
  for (let y = 1900; y <= 2026; y += 2) {
    for (let h = 0; h < 24; h += 5) {
      const p = run(y, 7, 15, h);
      for (const [name, v] of Object.entries(p)) {
        assert.equal(v.cycleIndex % 10, v.stem, `${y} ${name}: can`);
        assert.equal(v.cycleIndex % 12, v.branch, `${y} ${name}: chi`);
      }
    }
  }
});

test('trụ năm đổi tại Lập Xuân, không đổi ngày 01/01', () => {
  const jan1 = run(2024, 1, 1, 12);
  const feb3 = run(2024, 2, 3, 12);
  const feb5 = run(2024, 2, 5, 12);
  assert.equal(str(jan1.year), 'Quý Mão');
  assert.equal(str(feb3.year), 'Quý Mão');
  assert.equal(str(feb5.year), 'Giáp Thìn');
});

test('tháng Sửu (Tiểu Hàn → Lập Xuân) vẫn thuộc năm trước', () => {
  const p = run(2024, 1, 10, 12);
  assert.equal(str(p.year), 'Quý Mão');
  assert.equal(str(p.month), 'Ất Sửu');
});
