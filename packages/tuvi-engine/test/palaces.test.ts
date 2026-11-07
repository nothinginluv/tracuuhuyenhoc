import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bodyPalaceBranch,
  palaceNameAt,
  palaceStem,
  soulPalaceBranch,
  yinPalaceStem,
} from '../src/palaces.ts';
import { PALACE_NAMES } from '../src/constants.ts';

test('安命身宮訣: 寅起正月, 命宮 lùi theo giờ, 身宮 tiến theo giờ', () => {
  assert.equal(soulPalaceBranch(1, 0), 2); // 正月 Tý → Dần
  assert.equal(soulPalaceBranch(1, 1), 1); // 正月 Sửu → Sửu
  assert.equal(soulPalaceBranch(2, 0), 3); // 二月 Tý → Mão
  assert.equal(soulPalaceBranch(12, 11), 2); // 十二月 Hợi → Dần

  assert.equal(bodyPalaceBranch(1, 0), 2);
  assert.equal(bodyPalaceBranch(1, 1), 3); // 正月 Sửu → Mão
  assert.equal(bodyPalaceBranch(12, 11), 0); // 十二月 Hợi → Tý
});

test('12 cung đi nghịch từ cung Mệnh', () => {
  const soul = 4; // Thìn
  const names = Array.from({ length: 12 }, (_, i) => palaceNameAt(soul, (soul - i + 12) % 12).vi);
  assert.deepEqual(
    names,
    PALACE_NAMES.map((p) => p.vi),
  );
  // Cung kế tiếp theo chiều thuận là cung trước đó trong danh sách.
  assert.equal(palaceNameAt(4, 3).vi, 'Huynh Đệ');
  assert.equal(palaceNameAt(4, 5).vi, 'Phụ Mẫu');
});

test('五虎遁: can cung Dần theo can năm', () => {
  const expected = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 丙戊庚壬甲 ...
  for (let s = 0; s < 10; s++) {
    assert.equal(yinPalaceStem(s), expected[s], `can năm ${s}`);
  }
});

test('can của cung phải cuộn vòng 12 chi, không tràn âm', () => {
  // Can Dần năm Giáp là Bính (2). Tý cách Dần 10 bước → 2 + 10 = 12 ≡ 2 (Bính).
  assert.equal(palaceStem(0, 0), 2); // Bính Tý
  assert.equal(palaceStem(0, 1), 3); // Đinh Sửu
  assert.equal(palaceStem(0, 2), 2); // Bính Dần
  assert.equal(palaceStem(0, 11), 1); // Ất Hợi
});

test('can 12 cung của một năm luôn đúng 60 Giáp Tý hợp lệ', () => {
  for (let s = 0; s < 10; s++) {
    for (let b = 0; b < 12; b++) {
      const stem = palaceStem(s, b);
      // Can và chi phải cùng tính chẵn lẻ trong vòng 60.
      assert.equal(Math.abs(stem - b) % 2, 0, `can ${stem} chi ${b}`);
    }
  }
});
