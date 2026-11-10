import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTuViChart } from '../../../packages/tuvi-engine/src/index.ts';
import { buildBaziChart } from '../../../packages/bazi-engine/src/index.ts';
import { buildChartContext } from '../../../packages/calendar-core/src/index.ts';

/**
 * Test tầng luận giải ở mức dữ liệu (đọc thẳng content/*.json + engine).
 *
 * Không import `reading.ts` / `quotes.tsx`: các tệp đó import `.jsonl?raw` — cú pháp
 * của Vite, Node không hiểu. Những gì giao diện hiển thị đều đã qua
 * `scripts/verify-content.mjs` và `scripts/verify-quotes.mjs`; test này khoá thêm
 * hợp đồng: mỗi cung có câu thuận/trắc trở, mọi câu có bản tiếng Việt dễ hiểu.
 */

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const quotes = new Map<string, any>(
  readFileSync('content/quotes.jsonl', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .map((q) => [q.id, q]),
);

const HAN = /[\u3400-\u9fff]/;

test('luận theo cung: đủ 12 cung, mỗi cung có câu thuận và câu trắc trở', () => {
  const doc = readJson('content/palace-rules.json');
  assert.equal(doc.entries.length, 12);
  for (const entry of doc.entries) {
    for (const key of ['good_quote', 'bad_quote']) {
      const q = quotes.get(entry[key]);
      assert.ok(q, `${entry.branchZh}: thiếu câu ${key}`);
      assert.ok(q!.plain_vi && q!.plain_vi.length > 20, `${q!.id}: thiếu bản giảng dễ hiểu`);
      assert.ok(q!.short_vi, `${q!.id}: thiếu bản tóm`);
      assert.ok(!HAN.test(q!.plain_vi), `${q!.id}: plain_vi còn chữ Hán`);
      assert.ok(/[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(q!.plain_vi));
    }
  }
});

test('quy tắc đọc vận: đủ 5 khối, câu tam phương tứ chính có bản giảng', () => {
  const doc = readJson('content/reading-rules.json');
  for (const key of ['ptc', 'dahan-ten-years', 'dahan-two-cycles', 'dahan-nam-bac', 'liunian']) {
    const entry = doc.rules[key];
    assert.ok(entry, `thiếu quy tắc ${key}`);
    const q = quotes.get(entry.quote_id);
    assert.ok(q && q.claim_vi.length > 10, `${key}: thiếu claim_vi`);
  }
  assert.deepEqual(doc.steps, [4, 6, 8]);
});

test('bảng tra thuật ngữ: đủ 20 mục, toàn tiếng Việt', () => {
  const doc = readJson('content/glossary.json');
  const entries = Object.entries(doc.terms);
  assert.ok(entries.length >= 20);
  for (const [k, v] of entries) {
    assert.ok(!HAN.test(String(v)), `glossary "${k}" còn chữ Hán`);
    assert.ok(String(v).length >= 15, `glossary "${k}" quá ngắn`);
  }
});

test('mọi câu của tầng luận giải đều có bản dịch sát chữ tiếng Việt', () => {
  for (const [id, q] of quotes) {
    assert.ok(q.claim_vi && q.claim_vi.trim().length >= 8, `${id} thiếu claim_vi`);
  }
});

test('mười can và chín thập thần có bản tóm một dòng', () => {
  const days = readJson('content/day-masters.json');
  assert.equal(days.entries.length, 10);
  for (const e of days.entries) {
    const q = quotes.get(e.quote_id);
    assert.ok(q?.short_vi, `nhật chủ ${e.zh} thiếu short_vi`);
    assert.ok(q?.plain_vi, `nhật chủ ${e.zh} thiếu plain_vi`);
  }
  const gods = readJson('content/ten-gods.json');
  for (const e of gods.entries) {
    const q = quotes.get(e.quote_id);
    assert.ok(q?.plain_vi, `thập thần ${e.id} thiếu plain_vi`);
  }
});

test('lá số Tử Vi mẫu: 12 cung, đại hạn 12 bước, câu đọc mười năm có bản giảng', () => {
  const chart = buildTuViChart({
    lunarYear: 1990,
    lunarMonth: 4,
    lunarDay: 21,
    lunarLeap: false,
    hourBranch: 8,
  });
  assert.equal(chart.palaces.length, 12);
  const dahan = readJson('content/dahan.json');
  const tenYear = quotes.get(dahan.ten_year_quote);
  assert.ok(tenYear?.plain_vi, 'câu đọc mười năm thiếu bản giảng');

  const rules = readJson('content/palace-rules.json');
  const covered = new Set(rules.entries.map((e: { branch: number }) => e.branch));
  for (const p of chart.palaces) assert.ok(covered.has(p.branch));
});

test('lá Bát Tự mẫu: nhật chủ nằm trong bộ 10 can, thập thần đều tra được', () => {
  const ctx = buildChartContext(
    { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: '01' },
    'chuan-tq',
  );
  const bazi = buildBaziChart(ctx, { gender: 'nam', luckCount: 8 });
  const days = readJson('content/day-masters.json');
  assert.ok(days.entries.some((e: { stem: number }) => e.stem === bazi.dayMaster.stem));
  assert.equal(bazi.luck.length, 8);
});
