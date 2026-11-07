/**
 * Ví dụ an sao Tử Vi từ một ngày sinh dương lịch.
 *
 *   node packages/tuvi-engine/examples/demo.ts
 */
import { buildChartContext, type BirthInput } from '../../calendar-core/src/index.ts';
import { buildTuViChart, tuViBirthFromContext } from '../src/index.ts';
import { HUA, STAR_DEFS } from '../src/constants.ts';

const CASES: { label: string; input: BirthInput }[] = [
  {
    label: 'Hà Nội 15/05/1990 14:30',
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: 'Hà Nội' },
  },
  {
    label: 'Huế 12/04/2023 (tháng nhuận 2, ngày 22) 08:00',
    input: { year: 2023, month: 4, day: 12, hour: 8, minute: 0, province: 'Thừa Thiên Huế' },
  },
  {
    label: 'Sài Gòn 04/02/1972 23:30 (Tý muộn)',
    input: { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: 'Thành phố Hồ Chí Minh' },
  },
];

const pad = (s: string, n: number): string => s + ' '.repeat(Math.max(0, n - [...s].length));

for (const { label, input } of CASES) {
  const ctx = buildChartContext(input, 'chuan-tq');
  const chart = buildTuViChart(tuViBirthFromContext(ctx));

  console.log(`\n════ ${label}`);
  console.log(
    `   âm lịch TQ  ${chart.birth.lunarDay}/${chart.birth.lunarMonth}${chart.birth.lunarLeap ? ' nhuận' : ''}` +
      ` · năm ${chart.year.zh} (${chart.year.vi})`,
  );
  console.log(`   tứ trụ      ${[ctx.pillars.year, ctx.pillars.month, ctx.pillars.day, ctx.pillars.hour].map((p) => p.vi).join(' · ')}`);
  console.log(
    `   cung Mệnh   ${pad(chart.soul.zh, 4)} ${pad(chart.soul.vi, 8)}` +
      ` · cung Thân ${chart.body.zh} · ${chart.bureau.zh} (${chart.bureau.vi})`,
  );
  console.log(
    `   sao chủ     Mệnh ${STAR_DEFS[chart.soulStar].zh} (${STAR_DEFS[chart.soulStar].vi})` +
      ` · Thân ${STAR_DEFS[chart.bodyStar].zh} (${STAR_DEFS[chart.bodyStar].vi})`,
  );
  console.log(
    `   tứ hoá      ${chart.mutagens.map((m) => `${m.zh} ${HUA[m.hua].vi}`).join(' · ')}`,
  );

  console.log('   ┌────────────────────────────────────────────');
  for (const p of chart.palaces) {
    const stars = [...p.mainStars, ...p.auxStars]
      .map((s) => s.zh + (s.mutagen ? `(${HUA[s.mutagen].vi})` : ''))
      .join(' ');
    console.log(
      `   │ ${pad(`${p.stemZh}${p.branchZh}`, 4)} ${pad(p.nameZh, 4)}${p.isSoul ? '·M' : ' '}${p.isBody ? '·T' : ' '} ${stars}`,
    );
  }
  console.log('   └────────────────────────────────────────────');
  for (const note of chart.notes) console.log(`   ! ${note}`);
}
