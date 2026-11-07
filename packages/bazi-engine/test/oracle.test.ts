/**
 * Đối chứng Bát Tự với `lunar-javascript` (寿星天文历).
 *
 * Thư viện này tính theo giờ Bắc Kinh, nên đầu vào được lấy từ `ctx.clock.wall`
 * (giờ quy ước +8) — đúng bằng giờ engine dùng. Bỏ các ca mà tứ trụ lệch do
 * thư viện chia tiết khí theo ngày (đã ghi ở calendar-core).
 *
 * Khởi vận: hai bên dùng cùng quy tắc 3 ngày = 1 năm nhưng làm tròn khác nhau,
 * nên chỉ so trong dung sai 20 "ngày ảo" (1 ngày ảo = 12 phút thực).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'lunar-javascript';
import * as OpenCC from 'opencc-js';
import { buildChartContext, type BirthInput } from '../../calendar-core/src/index.ts';
import { buildBaziChart } from '../src/chart.ts';
import type { Gender } from '../src/constants.ts';

const { Solar } = pkg as unknown as {
  Solar: {
    fromYmdHms(
      y: number, m: number, d: number, h: number, mi: number, s: number,
    ): { getLunar(): { getEightChar(): EightChar } };
  };
};

type EightChar = {
  getYear(): string;
  getMonth(): string;
  getDay(): string;
  getTime(): string;
  getYearShiShenGan(): string;
  getMonthShiShenGan(): string;
  getDayShiShenGan(): string;
  getTimeShiShenGan(): string;
  getYearShiShenZhi(): string[];
  getMonthShiShenZhi(): string[];
  getDayShiShenZhi(): string[];
  getTimeShiShenZhi(): string[];
  getYun(gender: number): {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getDaYun(): { getGanZhi(): string }[];
  };
};

const virtualDays = (a: { years: number; months: number; days: number }): number =>
  a.years * 360 + a.months * 30 + a.days;

/** Thư viện trả chữ giản thể; thập thần của ta viết phồn thể. */
const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' });
const tr = (s: string[] | string): string[] | string =>
  Array.isArray(s) ? s.map((x) => s2t(x)) : s2t(s);

test('khớp lunar-javascript: tứ trụ, thập thần, tàng can, chiều và trụ đại vận', () => {
  let checked = 0;

  for (let y = 1950; y <= 2020; y += 10) {
    for (const m of [2, 5, 8, 11]) {
      for (const d of [3, 12, 21]) {
        for (const h of [5, 10, 15, 20]) {
          for (const gender of ['nam', 'nu'] as Gender[]) {
            const input: BirthInput = { year: y, month: m, day: d, hour: h, province: 'Hà Nội' };
            const ctx = buildChartContext(input, 'chuan-tq');
            const c = buildBaziChart(ctx, { gender, luckCount: 5 });

            const w = ctx.clock.wall;
            const them = Solar.fromYmdHms(w.year, w.month, w.day, w.hour, w.minute, 0)
              .getLunar()
              .getEightChar();

            // Thư viện chia tiết khí theo ngày → bỏ ca lệch trụ.
            if (
              them.getYear() !== c.pillars.year.zh ||
              them.getMonth() !== c.pillars.month.zh ||
              them.getTime() !== c.pillars.hour.zh
            ) {
              continue;
            }

            const who = `${d}/${m}/${y} ${h}h ${gender}`;
            assert.equal(them.getDay(), c.pillars.day.zh, `${who}: trụ ngày`);

            // Thập thần can (can ngày của thư viện là "日主").
            assert.equal(tr(them.getYearShiShenGan()), c.stems[0]!.tenGod!.zh, `${who}: can năm`);
            assert.equal(tr(them.getMonthShiShenGan()), c.stems[1]!.tenGod!.zh, `${who}: can tháng`);
            assert.equal(tr(them.getTimeShiShenGan()), c.stems[3]!.tenGod!.zh, `${who}: can giờ`);

            // Tàng can + thập thần tàng can.
            const theirZhi = [
              them.getYearShiShenZhi(),
              them.getMonthShiShenZhi(),
              them.getDayShiShenZhi(),
              them.getTimeShiShenZhi(),
            ];
            for (let i = 0; i < 4; i++) {
              assert.deepEqual(
                c.branches[i]!.hidden.map((x) => x.tenGod.zh),
                tr(theirZhi[i]!),
                `${who}: tàng can chi ${i}`,
              );
            }

            const yun = them.getYun(gender === 'nam' ? 1 : 0);
            assert.equal(
              yun.getDaYun().slice(1, 6).map((x) => x.getGanZhi()).join(','),
              c.luck.map((x) => x.pillar.zh).join(','),
              `${who}: đại vận`,
            );

            const theirAge = {
              years: yun.getStartYear(),
              months: yun.getStartMonth(),
              days: yun.getStartDay(),
            };
            assert.ok(
              Math.abs(virtualDays(c.qiYun.startAge) - virtualDays(theirAge)) <= 20,
              `${who}: tuổi khởi vận ${JSON.stringify(c.qiYun.startAge)} vs ${JSON.stringify(theirAge)}`,
            );
            checked++;
          }
        }
      }
    }
  }

  assert.ok(checked > 200, `chỉ kiểm tra được ${checked} lá số`);
});
