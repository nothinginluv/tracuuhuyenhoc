/**
 * Ví dụ chạy engine: in ra toàn bộ chuỗi tính cho vài ca sinh.
 *
 *   node packages/calendar-core/examples/demo.ts
 */
import { buildChartContext, type BirthInput } from '../src/index.ts';

const CASES: { label: string; input: BirthInput; preset: 'chuan-tq' | 'vn-dia-phuong' | 'vn-mat-troi' }[] = [
  {
    label: 'Hà Nội 1990 — ca thường',
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: 'Hà Nội' },
    preset: 'chuan-tq',
  },
  {
    label: 'Sài Gòn 1972 23:30 — giờ Tý, miền Nam UTC+8',
    input: { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: 'Thành phố Hồ Chí Minh' },
    preset: 'chuan-tq',
  },
  {
    label: 'Hà Nội 1972 23:30 — cùng instant, nhưng UTC+7',
    input: { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: 'Hà Nội' },
    preset: 'chuan-tq',
  },
  {
    label: 'Hà Nội 1972 23:30 — giờ mặt trời thật',
    input: { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: 'Hà Nội' },
    preset: 'vn-mat-troi',
  },
  {
    label: 'Quảng Trị 1970 — Vĩnh Linh (bờ bắc vĩ tuyến 17)',
    input: { year: 1970, month: 6, day: 1, hour: 12, province: 'Quảng Trị', district: 'Vĩnh Linh' },
    preset: 'vn-dia-phuong',
  },
  {
    label: 'Quảng Trị 1970 — Đông Hà (bờ nam vĩ tuyến 17)',
    input: { year: 1970, month: 6, day: 1, hour: 12, province: 'Quảng Trị', district: 'Đông Hà' },
    preset: 'vn-dia-phuong',
  },
];

const pad = (s: string, n: number): string => s + ' '.repeat(Math.max(0, n - [...s].length));

for (const { label, input, preset } of CASES) {
  const c = buildChartContext(input, preset);
  const p = c.pillars;
  console.log(`\n── ${label}`);
  console.log(`   quy ước   ${preset} · ${c.conventionLabel}`);
  console.log(`   instant   ${c.utcIso}   (UTC+${c.tz.offsetHours}, ${c.tz.region ?? 'không rõ miền'})`);
  console.log(`   giờ dùng  ${pad(`${String(c.clock.wall.hour).padStart(2, '0')}:${String(c.clock.wall.minute).padStart(2, '0')}`, 6)} ${c.clock.wall.day}/${c.clock.wall.month}/${c.clock.wall.year} (lệch ${c.clock.shiftMinutes} phút)`);
  console.log(`   âm lịch   TQ ${c.lunar.cn.day}/${c.lunar.cn.month}${c.lunar.cn.leap ? ' nhuận' : ''} · VN ${c.lunar.vn.day}/${c.lunar.vn.month}${c.lunar.vn.leap ? ' nhuận' : ''}${c.lunar.diverges ? '  ← lệch' : ''}`);
  console.log(
    `   tứ trụ    ${[p.year, p.month, p.day, p.hour].map((x) => `${pad(x.vi, 10)}${x.zh}`).join('  ')}`,
  );
  console.log(`   tiết khí  ${c.jie.current.zh} (đã qua ${c.jie.minutesSince} phút) → ${c.jie.next?.zh ?? '—'}`);
  for (const w of c.warnings) console.log(`   [${w.severity}] ${w.message}`);
}
