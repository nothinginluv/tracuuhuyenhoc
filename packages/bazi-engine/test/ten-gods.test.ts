import test from 'node:test';
import assert from 'node:assert/strict';
import { tenGod, relationLabel, TEN_GOD_GROUPS, TEN_GODS } from '../src/ten-gods.ts';

test('nhật chủ Giáp: 10 can cho đủ 10 thần', () => {
  const expected = [
    'ty-kiep', 'kiep-tai', 'thuc-than', 'thuong-quan', 'thien-tai',
    'chinh-tai', 'that-sat', 'chinh-quan', 'thien-an', 'chinh-an',
  ];
  for (let s = 0; s < 10; s++) {
    assert.equal(tenGod(0, s).id, expected[s], `Giáp gặp ${s}`);
  }
});

test('nhật chủ Ất: đảo cặp so với Giáp', () => {
  assert.equal(tenGod(1, 1).zh, '比肩');
  assert.equal(tenGod(1, 0).zh, '劫財');
  assert.equal(tenGod(1, 3).zh, '食神');
  assert.equal(tenGod(1, 2).zh, '傷官');
  assert.equal(tenGod(1, 5).zh, '偏財');
  assert.equal(tenGod(1, 4).zh, '正財');
  assert.equal(tenGod(1, 7).zh, '七殺');
  assert.equal(tenGod(1, 6).zh, '正官');
  assert.equal(tenGod(1, 9).zh, '偏印');
  assert.equal(tenGod(1, 8).zh, '正印');
});

test('mỗi nhật chủ có đúng 2 sao mỗi nhóm, tổng 10', () => {
  for (let day = 0; day < 10; day++) {
    const groups = new Map<string, number>();
    for (let s = 0; s < 10; s++) {
      const g = tenGod(day, s).group;
      groups.set(g, (groups.get(g) ?? 0) + 1);
    }
    assert.equal(groups.size, 5, `can ngày ${day}`);
    for (const [g, n] of groups) assert.equal(n, 2, `can ngày ${day} nhóm ${g}`);
  }
});

test('quan hệ sinh/khắc đúng: 甲 gặp 庚 là khắc ta, gặp 戊 là ta khắc', () => {
  assert.equal(tenGod(0, 6).id, 'that-sat'); // Kim khắc Mộc
  assert.equal(tenGod(0, 4).id, 'thien-tai'); // Mộc khắc Thổ
  assert.equal(tenGod(0, 2).id, 'thuc-than'); // Mộc sinh Hoả
  assert.equal(tenGod(0, 8).id, 'thien-an'); // Thuỷ sinh Mộc
  assert.match(relationLabel(0, 6), /khắc ta/);
  assert.match(relationLabel(0, 4), /ta khắc/);
  assert.match(relationLabel(0, 2), /ta sinh/);
  assert.match(relationLabel(0, 8), /sinh ta/);
});

test('nhãn thập thần có đủ chữ Hán và tiếng Việt', () => {
  for (const def of Object.values(TEN_GODS)) {
    assert.ok(def.zh.length >= 2);
    assert.ok(def.vi.length >= 3);
    assert.ok(def.group in TEN_GOD_GROUPS);
  }
});
