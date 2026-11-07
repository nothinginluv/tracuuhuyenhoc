import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mainStarBranches,
  tianfuBranch,
  ziweiBranch,
  TIANFU_SERIES,
  ZIWEI_SERIES,
} from '../src/main-stars.ts';

test('起紫微: 水二局 các ngày đầu khớp bảng 紫微定位', () => {
  const expected = [1, 2, 2, 3, 3, 4]; // 丑 寅 寅 卯 卯 辰
  for (let day = 1; day <= 6; day++) {
    assert.equal(ziweiBranch(day, 2), expected[day - 1], `ngày ${day}`);
  }
});

test('起紫微: ngày 1 của mỗi cục', () => {
  // 日數小於局 → thương = 1, dư = cục − 1 → lùi (cục − 1) bước từ Dần.
  assert.equal(ziweiBranch(1, 2), 1); // 水二局 → 丑
  assert.equal(ziweiBranch(1, 3), 4); // 木三局 → 辰
  assert.equal(ziweiBranch(1, 4), 11); // 金四局 → Hợi
  assert.equal(ziweiBranch(1, 5), 6); // 土五局 → Ngọ
  assert.equal(ziweiBranch(1, 6), 9); // 火六局 → Dậu
});

test('起紫微: 30 ngày của 水二局 khớp bảng chuẩn', () => {
  const table = [
    1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8,
    9, 9, 10, 10, 11, 11, 0, 0, 1, 1, 2, 2, 3, 3, 4,
  ];
  for (let day = 1; day <= 30; day++) {
    assert.equal(ziweiBranch(day, 2), table[day - 1], `ngày ${day}`);
  }
});

test('天府 đối xứng với Tử Vi qua trục Dần–Thân', () => {
  for (let ziwei = 0; ziwei < 12; ziwei++) {
    const tianfu = tianfuBranch(ziwei);
    assert.equal((ziwei + tianfu) % 12, 4);
    assert.equal(tianfuBranch(tianfu), ziwei, 'phép đối xứng phải tự nghịch');
  }
  // Cùng cung tại Dần (2) và Thân (8).
  assert.equal(tianfuBranch(2), 2);
  assert.equal(tianfuBranch(8), 8);
});

test('hệ Tử Vi đi nghịch, hệ Thiên Phủ đi thuận', () => {
  assert.deepEqual(
    ZIWEI_SERIES.map((s) => s.offset),
    [0, -1, -3, -4, -5, -8],
  );
  assert.deepEqual(
    TIANFU_SERIES.map((s) => s.offset),
    [0, 1, 2, 3, 4, 5, 6, 10],
  );
});

test('14 chính tinh luôn nằm trong 0–11 và giữ đúng tương quan', () => {
  for (let day = 1; day <= 30; day++) {
    for (const bureau of [2, 3, 4, 5, 6]) {
      const stars = mainStarBranches(day, bureau);
      assert.equal(Object.keys(stars).length, 14);
      for (const [id, branch] of Object.entries(stars)) {
        assert.ok(Number.isInteger(branch) && branch >= 0 && branch < 12, `${id} ngày ${day} cục ${bureau}`);
      }
      // 紫微系: 天機 lùi 1, 太陽 lùi 3, …
      assert.equal(stars.tianji, (stars.ziwei + 11) % 12);
      assert.equal(stars.taiyang, (stars.ziwei + 9) % 12);
      assert.equal(stars.wuqu, (stars.ziwei + 8) % 12);
      assert.equal(stars.tiantong, (stars.ziwei + 7) % 12);
      assert.equal(stars.lianzhen, (stars.ziwei + 4) % 12);
      // 天府系: 太陰 tiến 1 … 破軍 tiến 10.
      assert.equal(stars.taiyin, (stars.tianfu + 1) % 12);
      assert.equal(stars.pojun, (stars.tianfu + 10) % 12);
    }
  }
});

test('ví dụ lá số 14/11 âm lịch, 水二局: Tử Vi và Thiên Phủ cùng ở Thân', () => {
  const stars = mainStarBranches(14, 2);
  assert.equal(stars.ziwei, 8);
  assert.equal(stars.tianfu, 8);
  assert.equal(stars.tianji, 7);
  assert.equal(stars.taiyin, 9);
  assert.equal(stars.pojun, 6);
});
