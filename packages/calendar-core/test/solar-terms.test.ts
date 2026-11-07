import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JIE_KEYS,
  JIE_TO_MONTH_OFFSET,
  TERM_COUNT,
  TERM_FROM,
  TERM_ORDER,
  TERM_TO,
  assertYearSupported,
  jieBefore,
  jieAfter,
  termAfter,
  termBefore,
  termEpoch,
} from '../src/solar-terms.ts';

test('Lập Xuân 2024 = 2024-02-04T08:27:07Z (mốc kiểm chứng)', () => {
  assert.equal(termEpoch(2024, 'lichun'), Date.UTC(2024, 1, 4, 8, 27, 7));
});

test('bảng phủ 1899–2101, đủ 24 tiết mỗi năm', () => {
  assert.equal(TERM_FROM, 1899);
  assert.equal(TERM_TO, 2101);
  assert.equal(TERM_ORDER.length, 24);
  assert.equal(TERM_COUNT, (TERM_TO - TERM_FROM + 1) * 24);
});

test('mỗi năm: 24 tiết tăng dần theo thời gian', () => {
  for (let y = 1899; y <= 2101; y++) {
    let prev = -Infinity;
    for (const { key } of TERM_ORDER) {
      const e = termEpoch(y, key);
      assert.ok(e > prev, `${y}/${key} không tăng dần`);
      prev = e;
    }
  }
});

test('termBefore trả tiết gần nhất đã qua', () => {
  const lichun = termEpoch(2024, 'lichun');
  assert.equal(termBefore(lichun).key, 'lichun');
  assert.equal(termBefore(lichun - 1).key, 'dahan');
  assert.equal(termBefore(lichun + 1).key, 'lichun');
});

test('termAfter trả tiết kế tiếp', () => {
  const lichun = termEpoch(2024, 'lichun');
  assert.equal(termAfter(lichun)?.key, 'yushui');
  assert.equal(termAfter(lichun - 1)?.key, 'lichun');
});

test('jieBefore bỏ qua các "khí", chỉ trả 12 "tiết"', () => {
  const lichun = termEpoch(2024, 'lichun');
  // Ngay sau Lập Xuân, tiết trước vẫn là Lập Xuân (không phải Vũ Thuỷ — Vũ Thuỷ là khí).
  assert.equal(jieBefore(lichun).key, 'lichun');
  assert.equal(jieBefore(termEpoch(2024, 'yushui')).key, 'lichun');
  assert.equal(jieBefore(termEpoch(2024, 'jingzhe')).key, 'jingzhe');
  assert.equal(jieBefore(termEpoch(2024, 'chunfen')).key, 'jingzhe');
});

test('jieAfter cũng bỏ qua "khí" — dùng cho khởi vận', () => {
  const lichun = termEpoch(2024, 'lichun');
  assert.equal(jieAfter(lichun)?.key, 'jingzhe');
  // Sau Lập Xuân, tiết kế tiếp là Kinh Trập; Vũ Thuỷ (khí) và Xuân Phân (khí) bị bỏ qua.
  assert.equal(jieAfter(termEpoch(2024, 'yushui'))?.key, 'jingzhe');
  assert.equal(jieAfter(termEpoch(2024, 'chunfen'))?.key, 'qingming');
  // Ngay trước Lập Xuân, tiết kế tiếp là chính Lập Xuân.
  assert.equal(jieAfter(lichun - 1)?.key, 'lichun');
});

test('12 tiết có ánh xạ tháng đầy đủ và đúng thứ tự', () => {
  assert.equal(JIE_KEYS.length, 12);
  assert.equal(new Set(JIE_KEYS).size, 12);
  const offsets = JIE_KEYS.map((k) => JIE_TO_MONTH_OFFSET[k]);
  assert.deepEqual(
    [...offsets].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  );
  // Lập Xuân mở tháng Dần (offset 0); Tiểu Hàn mở tháng Sửu (offset 11).
  assert.equal(JIE_TO_MONTH_OFFSET.lichun, 0);
  assert.equal(JIE_TO_MONTH_OFFSET.xiaohan, 11);
});

test('assertYearSupported chặn năm ngoài bảng', () => {
  assert.doesNotThrow(() => assertYearSupported(1900));
  assert.doesNotThrow(() => assertYearSupported(2101));
  assert.throws(() => assertYearSupported(1898), RangeError);
  assert.throws(() => assertYearSupported(2102), RangeError);
});

test('termBefore ném lỗi khi ra ngoài phạm vi bảng', () => {
  assert.throws(() => termBefore(Date.UTC(1800, 0, 1)), RangeError);
});
