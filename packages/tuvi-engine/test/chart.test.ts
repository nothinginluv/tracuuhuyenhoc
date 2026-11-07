import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTuViChart,
  effectiveMonth,
  hourBranchOf,
  type TuViBirth,
} from '../src/chart.ts';
import { STAR_DEFS, type StarId } from '../src/constants.ts';

const birth = (over: Partial<TuViBirth> = {}): TuViBirth => ({
  lunarYear: 1990,
  lunarMonth: 4,
  lunarDay: 21,
  lunarLeap: false,
  hourBranch: 8, // Thân
  ...over,
});

test('chi giờ: 23:00 và 00:00 đều là Tý, mỗi canh 2 tiếng', () => {
  assert.equal(hourBranchOf(23), 0);
  assert.equal(hourBranchOf(0), 0);
  assert.equal(hourBranchOf(1), 1);
  assert.equal(hourBranchOf(2), 1);
  assert.equal(hourBranchOf(3), 2);
  assert.equal(hourBranchOf(22), 11);
  for (let h = 0; h < 24; h++) {
    assert.equal(hourBranchOf(h), hourBranchOf((h + 24) % 24));
  }
});

test('tháng nhuận: quy tắc "split" chia đôi tháng', () => {
  assert.deepEqual(effectiveMonth({ lunarMonth: 2, lunarDay: 10, lunarLeap: true }, 'split'), {
    month: 2,
    applied: false,
  });
  assert.deepEqual(effectiveMonth({ lunarMonth: 2, lunarDay: 16, lunarLeap: true }, 'split'), {
    month: 3,
    applied: true,
  });
  // Tháng nhuận 12 → nửa sau sang tháng 1.
  assert.deepEqual(effectiveMonth({ lunarMonth: 12, lunarDay: 20, lunarLeap: true }, 'split'), {
    month: 1,
    applied: true,
  });
});

test('tháng nhuận: "as-month" giữ nguyên, "as-next" luôn tiến', () => {
  assert.deepEqual(effectiveMonth({ lunarMonth: 3, lunarDay: 2, lunarLeap: true }, 'as-month'), {
    month: 3,
    applied: false,
  });
  assert.deepEqual(effectiveMonth({ lunarMonth: 3, lunarDay: 2, lunarLeap: true }, 'as-next'), {
    month: 4,
    applied: true,
  });
  assert.deepEqual(effectiveMonth({ lunarMonth: 5, lunarDay: 9, lunarLeap: false }, 'as-next'), {
    month: 5,
    applied: false,
  });
});

test('lá số hợp lệ có đủ 12 cung theo thứ tự chi', () => {
  const chart = buildTuViChart(birth());
  assert.equal(chart.palaces.length, 12);
  chart.palaces.forEach((p, i) => {
    assert.equal(p.branch, i);
    assert.ok(p.nameZh.length > 0 && p.nameVi.length > 0);
  });
  assert.equal(chart.palaces[chart.soul.branch].nameZh, '命宮');
  assert.equal(chart.palaces[chart.soul.branch].isSoul, true);
  assert.equal(chart.palaces[chart.body.branch].isBody, true);
});

test('năm âm lịch 1990 là Canh Ngọ', () => {
  const chart = buildTuViChart(birth());
  assert.equal(chart.year.zh, '庚午');
  assert.equal(chart.year.vi, 'Canh Ngọ');
  assert.equal(chart.year.cycleIndex, (1990 - 4) % 60);
});

test('an đủ 14 chính tinh và 24 phụ tinh, mỗi sao đúng một lần', () => {
  const chart = buildTuViChart(birth());
  assert.equal(chart.stars.length, 38);
  const ids = new Set(chart.stars.map((s) => s.id));
  assert.equal(ids.size, 38);
  assert.equal(chart.stars.filter((s) => s.group === 'main').length, 14);
  assert.equal(chart.stars.filter((s) => s.group === 'aux').length, 24);

  // Mỗi sao nằm trong cung mang đúng id của nó (không lệch cung).
  for (const star of chart.stars) {
    const palace = chart.palaces[star.branch];
    assert.ok(
      [...palace.mainStars, ...palace.auxStars].some((s) => s.id === star.id),
      `${star.id} phải có mặt ở cung ${star.branch}`,
    );
  }
});

test('tứ hoá Nam phái gắn đúng sao và đúng cung', () => {
  const chart = buildTuViChart(birth()); // năm Canh
  const byStar = new Map(chart.mutagens.map((m) => [m.star, m]));
  assert.equal(byStar.get('taiyang')?.hua, 'loc'); // 庚 陽武陰同
  assert.equal(byStar.get('wuqu')?.hua, 'quyen');
  assert.equal(byStar.get('taiyin')?.hua, 'khoa');
  assert.equal(byStar.get('tiantong')?.hua, 'ky');

  for (const m of chart.mutagens) {
    const star = chart.stars.find((s) => s.id === m.star)!;
    assert.equal(m.branch, star.branch);
    assert.equal(star.mutagen, m.hua);
  }
});

test('sao chủ Mệnh theo chi cung Mệnh, sao chủ Thân theo chi năm', () => {
  const chart = buildTuViChart(birth());
  // 1990-04-21 giờ Thân: cung Mệnh tại Dậu (9) → Văn Khúc; năm Ngọ (6) → Hoả Tinh.
  assert.equal(chart.soul.branch, 9);
  assert.equal(chart.soulStar, 'wenqu');
  assert.equal(chart.bodyStar, 'huoxing');
  assert.equal(STAR_DEFS[chart.soulStar].zh, '文曲');

  const byYear = buildTuViChart(birth(), { soulStarBasis: 'year-branch' });
  assert.equal(byYear.soulStar, 'pojun');
  assert.ok(byYear.notes.some((n) => n.includes('chi năm sinh')));
});

test('sao chủ Thân tra đúng bảng 12 chi năm sinh', () => {
  const expected = [
    'huoxing', 'tianxiang', 'tianliang', 'tiantong', 'wenchang', 'tianji',
    'huoxing', 'tianxiang', 'tianliang', 'tiantong', 'wenchang', 'tianji',
  ];
  for (let k = 0; k < 12; k++) {
    const chart = buildTuViChart(birth({ lunarYear: 1984 + k })); // 1984 = Giáp Tý
    assert.equal(chart.year.branch, k);
    assert.equal(chart.bodyStar, expected[k], `chi năm ${k}`);
  }
});

test('sao chủ Mệnh tra đúng bảng 12 chi cung Mệnh', () => {
  const expected = [
    'tanlang', 'jumen', 'lucun', 'wenqu', 'lianzhen', 'wuqu',
    'pojun', 'wuqu', 'lianzhen', 'wenqu', 'lucun', 'jumen',
  ];
  for (let m = 1; m <= 12; m++) {
    const chart = buildTuViChart(birth({ lunarMonth: m, hourBranch: 0 }));
    assert.equal(chart.soulStar, expected[chart.soul.branch], `cung Mệnh chi ${chart.soul.branch}`);
  }
});

test('tháng nhuận ghi chú rõ quy tắc đang dùng', () => {
  const split = buildTuViChart(birth({ lunarMonth: 2, lunarLeap: true, lunarDay: 20 }));
  assert.equal(split.birth.monthUsed, 3);
  assert.equal(split.birth.leapRuleApplied, true);
  assert.ok(split.notes.some((n) => n.includes('tháng nhuận')));
  assert.ok(split.notes.some((n) => n.includes('split')));

  const asMonth = buildTuViChart(
    birth({ lunarMonth: 2, lunarLeap: true, lunarDay: 20 }),
    { leapMonthRule: 'as-month' },
  );
  assert.equal(asMonth.birth.monthUsed, 2);
  assert.equal(asMonth.birth.leapRuleApplied, false);

  // Đổi quy tắc phải cho lá số khác — không được im lặng.
  assert.notEqual(split.soul.branch, asMonth.soul.branch);
});

test('封誥 theo 口诀 寅起子逆數 (khác iztro 順數)', () => {
  for (let h = 0; h < 12; h++) {
    const chart = buildTuViChart(birth({ hourBranch: h }));
    const star = chart.stars.find((s) => s.id === 'fenggao')!;
    assert.equal(star.branch, (2 - h + 12) % 12, `giờ ${h}`);
  }
});

test('đầu vào ngoài miền báo lỗi rõ ràng', () => {
  assert.throws(() => buildTuViChart(birth({ lunarYear: 1899 })), /1900–2101/);
  assert.throws(() => buildTuViChart(birth({ lunarMonth: 13 })), /1–12/);
  assert.throws(() => buildTuViChart(birth({ lunarDay: 31 })), /1–30/);
  assert.throws(() => buildTuViChart(birth({ hourBranch: 12 })), /0–11/);
  assert.throws(() => buildTuViChart(birth({ lunarDay: 1.5 })), RangeError);
});

test('mọi sao có id thuộc bảng STAR_DEFS', () => {
  const chart = buildTuViChart(birth());
  const known = new Set(Object.keys(STAR_DEFS) as StarId[]);
  for (const s of chart.stars) assert.ok(known.has(s.id));
});
