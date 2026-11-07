/**
 * Ví dụ Bát Tự: tứ trụ, tàng can, thập thần, khởi vận, đại vận.
 *
 *   node packages/bazi-engine/examples/demo.ts
 */
import { buildChartContext, type BirthInput } from '../../calendar-core/src/index.ts';
import { buildBaziChart, type Gender } from '../src/index.ts';

const CASES: { label: string; input: BirthInput; gender: Gender }[] = [
  {
    label: 'Nam — Hà Nội 15/05/1990 14:30',
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: 'Hà Nội' },
    gender: 'nam',
  },
  {
    label: 'Nữ — Hải Phòng 01/06/1984 08:00',
    input: { year: 1984, month: 6, day: 1, hour: 8, minute: 0, province: 'Hải Phòng' },
    gender: 'nu',
  },
  {
    label: 'Nam — Sài Gòn 20/11/2001 19:00',
    input: { year: 2001, month: 11, day: 20, hour: 19, minute: 0, province: 'Thành phố Hồ Chí Minh' },
    gender: 'nam',
  },
];

const pad = (s: string, n: number): string => s + ' '.repeat(Math.max(0, n - [...s].length));

for (const { label, input, gender } of CASES) {
  const ctx = buildChartContext(input, 'chuan-tq');
  const chart = buildBaziChart(ctx, { gender });

  console.log(`\n════ ${label}`);
  console.log(
    `   tứ trụ   ${chart.stems
      .map((s, i) => `${pad(`${s.vi} ${s.zh}`, 12)}${pad(s.tenGod?.vi ?? 'Nhật chủ', 12)}`)
      .join('')}`,
  );
  console.log(
    `   cung     ${['Năm', 'Tháng', 'Ngày', 'Giờ'].map((n) => pad(n, 24)).join('')}`,
  );
  for (const b of chart.branches) {
    const hidden = b.hidden.map((h) => `${h.zh}(${h.tenGod.vi})`).join(' ');
    console.log(`   ${pad(b.zh, 2)} ${pad(b.elementVi, 5)} ${hidden}`);
  }
  console.log(
    `   ngũ hành 8 chữ   ${Object.entries(chart.elementCounts)
      .map(([e, n]) => `${e}:${n}`)
      .join('  ')}`,
  );
  console.log(
    `   ngũ hành tàng   ${Object.entries(chart.hiddenElementCounts)
      .map(([e, n]) => `${e}:${n}`)
      .join('  ')}`,
  );
  console.log(
    `   khởi vận  ${chart.qiYun.direction === 'thuan' ? 'thuận' : 'nghịch'}` +
      ` · ${chart.qiYun.startAge.years} tuổi ${chart.qiYun.startAge.months} tháng ${chart.qiYun.startAge.days} ngày` +
      ` (${chart.qiYun.daysToJie.toFixed(2)} ngày ${chart.qiYun.reference === 'next' ? 'tới tiết kế' : 'từ tiết trước'})`,
  );
  console.log(
    `   đại vận  ${chart.luck
      .map((l) => `${l.pillar.zh}(${l.fromAge.toFixed(0)}–${l.toAge.toFixed(0)})`)
      .join('  ')}`,
  );
  console.log(
    `   nguồn    nhật chủ ${chart.citations.dayMaster} · tàng can ${chart.citations.hiddenStems}` +
      ` · thập thần ${chart.citations.tenGods} · đại vận ${chart.citations.luckDirection}`,
  );
  for (const note of chart.notes) console.log(`   ! ${note}`);
}
