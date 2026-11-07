#!/usr/bin/env node
/**
 * Cổng kiểm trích dẫn. Chặn deploy nếu bất kỳ câu trích nào không nằm verbatim
 * trong corpus đã pin hash.
 *
 *   node scripts/verify-quotes.mjs
 *   node scripts/verify-quotes.mjs --quotes=tests/fixtures/fake-quotes.jsonl --expect-fail
 *
 * Ba tầng:
 *   1. exact       — khớp chính xác (bỏ khoảng trắng + dấu câu)  → pass
 *   2. variant     — chỉ khớp sau khi quy dị thể (OpenCC)        → cần người duyệt
 *   3. not found   — không khớp                                  → lỗi, chặn build
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import * as OpenCC from 'opencc-js';

const ROOT = process.cwd();
const toSimp = OpenCC.Converter({ from: 'tw', to: 'cn' });

// Bỏ khoảng trắng + dấu câu, giữ nguyên chữ Hán (KHÔNG quy đổi giản/phồn ở bước này).
const PUNCT_RE =
  /[\s\u3000\u00a0，。、；：？！「」『』（）《》〈〉【】·—…“”‘’"'.,;:?!()\[\]{}\-_|/\\~^*+=<>–]/g;
const normalize = (s) => s.normalize('NFC').replace(PUNCT_RE, '');

const QuoteSchema = z.object({
  id: z.string().regex(/^q_(tv|bz)_\d{4}$/, 'id phải dạng q_tv_0001 / q_bz_0001'),
  source: z.string().min(2),
  locator: z.string().min(2),
  text_zh: z.string().min(8, 'câu trích quá ngắn (<8 chữ) để kiểm chứng'),
  claim_vi: z.string().min(4).optional(),
});

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
);

const quotesPath = args.quotes ?? 'content/quotes.jsonl';
const expectFail = args['expect-fail'] === true;

const registry = JSON.parse(readFileSync('content/sources.json', 'utf8')).sources;
const lock = JSON.parse(readFileSync('corpus/corpus.lock.json', 'utf8'));

const errors = [];
const warnings = [];
let exactCount = 0;
let variantCount = 0;

if (!existsSync(quotesPath)) {
  console.error(`Không thấy file trích dẫn: ${quotesPath}`);
  process.exit(1);
}

// 1. Corpus phải khớp hash đã pin.
const corpusCache = new Map();
for (const [key, meta] of Object.entries(lock)) {
  const p = `corpus/${key}.txt`;
  if (!existsSync(p)) {
    errors.push(`thiếu ${p}`);
    continue;
  }
  const buf = readFileSync(p);
  const actual = createHash('sha256').update(buf).digest('hex');
  if (actual !== meta.sha256) {
    errors.push(
      `corpus/${key}.txt lệch hash so với lock (${actual.slice(0, 12)}… ≠ ${meta.sha256.slice(0, 12)}…)`,
    );
  }
  corpusCache.set(key, {
    raw: buf.toString('utf8'),
    norm: normalize(buf.toString('utf8')),
    simp: toSimp(normalize(buf.toString('utf8'))),
    segments: existsSync(`corpus/${key}.segments.json`)
      ? JSON.parse(readFileSync(`corpus/${key}.segments.json`, 'utf8')).segments
      : [],
  });
}

// 2. Từng câu trích.
const lines = readFileSync(quotesPath, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

for (const [i, line] of lines.entries()) {
  let raw;
  try {
    raw = JSON.parse(line);
  } catch {
    errors.push(`dòng ${i + 1}: JSON hỏng`);
    continue;
  }

  const parsed = QuoteSchema.safeParse(raw);
  if (!parsed.success) {
    errors.push(
      `dòng ${i + 1}: schema lỗi — ${parsed.error.issues.map((x) => x.message).join('; ')}`,
    );
    continue;
  }
  const q = parsed.data;
  const id = q.id;

  if (!registry[q.source]) {
    errors.push(`${id}: nguồn "${q.source}" không có trong content/sources.json`);
    continue;
  }
  const corpus = corpusCache.get(q.source);
  if (!corpus) {
    errors.push(`${id}: chưa tải corpus cho nguồn "${q.source}" (chạy npm run corpus:fetch)`);
    continue;
  }

  const nq = normalize(q.text_zh);

  if (corpus.norm.includes(nq)) {
    exactCount++;
  } else if (corpus.simp.includes(toSimp(nq))) {
    variantCount++;
    warnings.push(`${id}: chỉ khớp sau khi quy dị thể → CẦN NGƯỜI DUYỆT`);
  } else {
    errors.push(`${id}: QUOTE_NOT_FOUND trong ${q.source}`);
    continue;
  }

  // 3. Locator phải đúng: câu trích phải nằm trong quyển đã khai báo.
  if (q.locator !== '全篇') {
    const seg = corpus.segments.find((s) => s.locator === q.locator);
    if (!seg) {
      errors.push(`${id}: locator "${q.locator}" không tồn tại trong ${q.source}`);
    } else {
      const segNorm = normalize(corpus.raw.slice(seg.start, seg.end));
      if (!segNorm.includes(nq)) {
        errors.push(`${id}: câu trích không nằm trong ${q.locator} của ${q.source}`);
      }
    }
  }
}

// 4. Báo cáo.
console.log(`\nTrích dẫn: ${lines.length} · khớp chính xác: ${exactCount} · cần duyệt: ${variantCount}`);
if (warnings.length) {
  console.log('\nCảnh báo:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log('\nLỗi:');
  for (const e of errors) console.log(`  ✗ ${e}`);
}

const failed = errors.length > 0;

if (expectFail) {
  if (failed) {
    console.log(`\n✓ Self-test đạt: cổng kiểm đã chặn ${errors.length} lỗi như mong đợi.`);
    process.exit(0);
  }
  console.log('\n✗ Self-test HỎNG: cổng kiểm đã cho lọt dữ liệu sai. Script vô dụng.');
  process.exit(1);
}

if (failed) {
  console.log('\n✗ Chặn build: sửa các lỗi trên trước khi deploy.');
  process.exit(1);
}
console.log('\n✓ Cổng kiểm đạt.');
