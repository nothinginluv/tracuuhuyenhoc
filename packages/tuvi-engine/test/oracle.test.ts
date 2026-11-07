/**
 * Đối chứng với `iztro` — một thư viện Tử Vi phổ biến, độc lập với code này.
 *
 * Mục đích: bắt lỗi an sao, không phải chứng minh "đúng tuyệt đối". Mọi khác biệt
 * về quy ước đều nằm ngoài phép so sánh này và được ghi rõ bên dưới.
 *
 * - Bỏ 封誥: ta theo 口诀 寅起子逆數, iztro 順數 (khác biệt có chủ ý).
 * - Bỏ giờ 23:00 (Tý muộn): iztro tăng ngày âm lịch, ta thì không.
 * - iztro trả chữ giản thể và dùng 臺, phải chuyển bằng OpenCC rồi chuẩn hoá.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { astro } from 'iztro';
import * as OpenCC from 'opencc-js';
import { buildTuViChart, hourBranchOf } from '../src/chart.ts';
import { STAR_DEFS } from '../src/constants.ts';
import { solarToLunar } from '../../calendar-core/src/index.ts';

const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' });
const tr = (s: string): string => s2t(s).replace(/臺/g, '台');

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const BUREAU_OF: Record<string, number> = {
  水二局: 2, 木三局: 3, 金四局: 4, 土五局: 5, 火六局: 6,
};

/** Các sao ta an; 封誥 cố tình để ngoài. */
const COMPARED: Set<string> = new Set(
  Object.values(STAR_DEFS)
    .filter((s) => s.id !== 'fenggao')
    .map((s) => s.zh as string),
);

type TheirPalace = { name: string; isBody: boolean; stars: string[] };

function theirChart(y: number, m: number, d: number, timeIndex: number) {
  const a = astro.bySolar(`${y}-${m}-${d}`, timeIndex, '男', true, 'zh-CN');
  const palaces = new Map<number, TheirPalace>();
  for (const p of a.palaces) {
    const br = BRANCHES.indexOf(p.earthlyBranch);
    const stars = [...(p.majorStars ?? []), ...(p.minorStars ?? []), ...(p.adjectiveStars ?? [])]
      .map((s: { name: string }) => tr(s.name))
      .filter((n: string) => COMPARED.has(n));
    palaces.set(br, { name: tr(p.name), isBody: p.isBodyPalace, stars });
  }
  return {
    lunar: a.rawDates.lunarDate as {
      lunarYear: number; lunarMonth: number; lunarDay: number; isLeap: boolean;
    },
    bureau: BUREAU_OF[a.fiveElementsClass],
    soulBranch: [...palaces.entries()].find(([, v]) => v.name === '命宮')?.[0],
    bodyBranch: [...palaces.entries()].find(([, v]) => v.isBody)?.[0],
    palaces,
    soulStar: tr(a.soul),
    bodyStar: tr(a.body),
  };
}

test('an sao khớp iztro: 880 lá số (1930–2020, nhiều tháng/ngày/giờ)', () => {
  let checked = 0;
  for (let y = 1930; y <= 2020; y += 9) {
    for (let m = 1; m <= 12; m += 3) {
      for (const d of [2, 11, 21, 28]) {
        for (const h of [0, 5, 11, 17, 22]) {
          const lunar = solarToLunar(d, m, y, 8);
          const timeIndex = h === 0 ? 0 : Math.floor((h + 1) / 2);
          const them = theirChart(y, m, d, timeIndex);

          // iztro và ta phải chuyển dương → âm giống nhau; nếu khác thì bỏ qua
          // (đây là khác biệt lịch pháp, không phải lỗi an sao).
          if (
            them.lunar.lunarYear !== lunar.year ||
            them.lunar.lunarMonth !== lunar.month ||
            them.lunar.lunarDay !== lunar.day ||
            them.lunar.isLeap !== lunar.leap
          ) {
            continue;
          }

          const who = `${d}/${m}/${y} ${h}h`;
          const us = buildTuViChart(
            {
              lunarYear: lunar.year,
              lunarMonth: lunar.month,
              lunarDay: lunar.day,
              lunarLeap: lunar.leap,
              hourBranch: hourBranchOf(h),
            },
            { leapMonthRule: 'split' },
          );

          assert.equal(us.bureau.number, them.bureau, `${who}: ngũ hành cục`);
          assert.equal(us.soul.branch, them.soulBranch, `${who}: cung Mệnh`);
          assert.equal(us.body.branch, them.bodyBranch, `${who}: cung Thân`);
          assert.equal(STAR_DEFS[us.soulStar].zh, them.soulStar, `${who}: sao chủ Mệnh`);
          assert.equal(STAR_DEFS[us.bodyStar].zh, them.bodyStar, `${who}: sao chủ Thân`);

          for (const p of us.palaces) {
            const mine = [...p.mainStars, ...p.auxStars].map((s) => s.zh).filter((n) => COMPARED.has(n));
            const theirs = them.palaces.get(p.branch)!.stars;
            assert.deepEqual(
              [...mine].sort(),
              [...theirs].sort(),
              `${who} cung ${BRANCHES[p.branch]}`,
            );
          }
          checked++;
        }
      }
    }
  }
  assert.ok(checked > 500, `chỉ kiểm tra được ${checked} lá số`);
});
