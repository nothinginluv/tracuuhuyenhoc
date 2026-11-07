#!/usr/bin/env node
/**
 * Cổng kiểm Tầng B — nội dung định nghĩa tinh diệu, tứ hoá, mười hai cung.
 *
 * Kiểm hai lớp:
 *   1. Mọi `quote_id` trong content/*.json phải tồn tại trong content/quotes.jsonl
 *      (và câu Hán tương ứng đã qua cổng verify-quotes).
 *   2. Mọi từ khoá hiển thị trên giao diện (ngũ hành, đẩu, cung chủ, vai trò) phải
 *      xuất hiện nguyên văn trong chính các câu trích của mục đó.
 *
 * Nhờ vậy không có chip nào do giao diện tự bịa ra: bỏ câu trích thì chip mất theo.
 */
import { readFileSync } from 'node:fs';
import { HUA, STAR_DEFS } from '../packages/tuvi-engine/src/constants.ts';

const errors = [];
const warnings = [];

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
);
const starsPath = args.stars ?? 'content/stars.json';
const expectFail = args['expect-fail'] === true;

const quotes = new Map();
for (const [i, line] of readFileSync('content/quotes.jsonl', 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .entries()) {
  let q;
  try {
    q = JSON.parse(line);
  } catch {
    errors.push(`quotes.jsonl dòng ${i + 1}: JSON hỏng`);
    continue;
  }
  if (quotes.has(q.id)) errors.push(`quotes.jsonl: trùng id ${q.id}`);
  quotes.set(q.id, q);
}

const usedQuotes = new Set();
let tokenChecks = 0;

const checkToken = (where, corpus, label, token) => {
  if (!token?.zh) {
    errors.push(`${where}: ${label} thiếu "zh"`);
    return;
  }
  tokenChecks++;
  if (!corpus.includes(token.zh)) {
    errors.push(
      `${where}: ${label} "${token.zh}" không xuất hiện trong câu trích — không được hiển thị`,
    );
  }
  if (!token.vi?.trim()) errors.push(`${where}: ${label} "${token.zh}" thiếu bản dịch "vi"`);
};

/** Đọc và kiểm chung một mục nội dung; trả về phần chữ Hán của các câu trích. */
function readQuotes(where, refs, { min = 2, needDefinition = true } = {}) {
  const texts = [];
  let hasDefinition = false;
  const local = new Set();
  for (const ref of refs ?? []) {
    const q = quotes.get(ref.quote_id);
    if (!q) {
      errors.push(`${where}: quote_id "${ref.quote_id}" không có trong content/quotes.jsonl`);
      continue;
    }
    if (q.source !== 'ziwei-quanshu') {
      errors.push(`${where}: "${ref.quote_id}" lấy từ ${q.source}, không phải ziwei-quanshu`);
    }
    if (!q.claim_vi || q.claim_vi.trim().length < 8) {
      errors.push(`${where}: "${ref.quote_id}" thiếu claim_vi để hiển thị tiếng Việt`);
    }
    if (local.has(ref.quote_id)) errors.push(`${where}: lặp quote ${ref.quote_id}`);
    local.add(ref.quote_id);
    usedQuotes.add(ref.quote_id);
    if (ref.role === 'definition') hasDefinition = true;
    texts.push(q.text_zh);
  }
  if ((refs ?? []).length < min) {
    errors.push(`${where}: cần ít nhất ${min} câu trích`);
  }
  if (needDefinition && !hasDefinition) {
    errors.push(`${where}: thiếu câu trích role="definition"`);
  }
  return texts.join('');
}

// ── Tinh diệu ─────────────────────────────────────────────────
const starsDoc = JSON.parse(readFileSync(starsPath, 'utf8'));
const stars = starsDoc.stars ?? [];
const seenStars = new Set();

for (const [index, star] of stars.entries()) {
  const where = `stars.json[${index}] (${star.id ?? '?'})`;

  if (!star.id) {
    errors.push(`${where}: thiếu id`);
    continue;
  }
  if (seenStars.has(star.id)) {
    errors.push(`${where}: trùng id`);
    continue;
  }
  seenStars.add(star.id);

  const def = STAR_DEFS[star.id];
  if (!def) {
    errors.push(`${where}: id không có trong STAR_DEFS của tuvi-engine`);
    continue;
  }

  const corpus = readQuotes(where, star.quotes);
  for (const el of star.elements ?? []) checkToken(where, corpus, 'ngũ hành', el);
  if (star.dou) checkToken(where, corpus, 'đẩu', star.dou);
  for (const d of star.domains ?? []) checkToken(where, corpus, 'cung chủ', d);
  for (const r of star.roles ?? []) checkToken(where, corpus, 'vai trò', r);
}

for (const id of Object.keys(STAR_DEFS)) {
  if (STAR_DEFS[id].group === 'main' && !seenStars.has(id)) {
    errors.push(`thiếu định nghĩa cho chính tinh "${STAR_DEFS[id].zh}" (${id})`);
  }
}

// ── Tứ Hoá ────────────────────────────────────────────────────
const huaDoc = JSON.parse(readFileSync('content/hua.json', 'utf8'));
const huaEntries = huaDoc.entries ?? [];
const seenHua = new Set();

for (const [index, entry] of huaEntries.entries()) {
  const where = `hua.json[${index}] (${entry.id ?? '?'})`;
  if (!entry.id) {
    errors.push(`${where}: thiếu id`);
    continue;
  }
  if (!HUA[entry.id]) {
    errors.push(`${where}: id không có trong HUA của tuvi-engine`);
    continue;
  }
  if (seenHua.has(entry.id)) {
    errors.push(`${where}: trùng id`);
    continue;
  }
  seenHua.add(entry.id);

  const corpus = readQuotes(where, entry.quotes);
  for (const el of entry.elements ?? []) checkToken(where, corpus, 'ngũ hành', el);
  for (const r of entry.roles ?? []) checkToken(where, corpus, 'vai trò', r);
}

for (const id of Object.keys(HUA)) {
  if (!seenHua.has(id)) errors.push(`thiếu nội dung cho "${HUA[id].zh}" (${id})`);
}

// ── Mười hai cung ─────────────────────────────────────────────
const palaceDoc = JSON.parse(readFileSync('content/palaces.json', 'utf8'));
const palaces = palaceDoc.palaces ?? [];

const orderQuote = quotes.get(palaceDoc.order_quote);
if (!orderQuote) {
  errors.push(`palaces.json: order_quote "${palaceDoc.order_quote}" không tồn tại`);
} else {
  usedQuotes.add(orderQuote.id);
  for (const p of palaces) {
    if (p.zh && !orderQuote.text_zh.includes(p.zh)) {
      errors.push(`palaces.json: cung "${p.zh}" không có trong câu thứ tự 12 cung`);
    }
  }
}

const strengthQuote = quotes.get(palaceDoc.strength_quote);
const strong = palaceDoc.strong ?? [];
const weak = palaceDoc.weak ?? [];
if (!strengthQuote) {
  errors.push(`palaces.json: strength_quote "${palaceDoc.strength_quote}" không tồn tại`);
} else {
  usedQuotes.add(strengthQuote.id);
  for (const name of [...strong, ...weak]) {
    if (!strengthQuote.text_zh.includes(name)) {
      errors.push(`palaces.json: "${name}" không có trong câu cường nhược`);
    }
  }
}

const femaleQuote = quotes.get(palaceDoc.strength_female_quote);
if (!femaleQuote) {
  errors.push(`palaces.json: strength_female_quote "${palaceDoc.strength_female_quote}" không tồn tại`);
} else {
  usedQuotes.add(femaleQuote.id);
}

const allNames = [...strong, ...weak];
if (allNames.length === 0) {
  errors.push('palaces.json: thiếu danh sách cường/nhược');
}
if (new Set(allNames).size !== allNames.length) {
  errors.push('palaces.json: cường/nhược bị trùng tên cung');
}

const seenPalaces = new Set();
for (const [index, p] of palaces.entries()) {
  const where = `palaces.json[${index}] (${p.id ?? '?'})`;
  if (!p.id || !p.zh || !p.vi) {
    errors.push(`${where}: thiếu id/zh/vi`);
    continue;
  }
  if (seenPalaces.has(p.id)) {
    errors.push(`${where}: trùng id`);
    continue;
  }
  seenPalaces.add(p.id);

  if (p.scope_quote) {
    const q = quotes.get(p.scope_quote);
    if (!q) {
      errors.push(`${where}: scope_quote "${p.scope_quote}" không tồn tại`);
    } else {
      usedQuotes.add(q.id);
      if (q.source !== 'ziwei-quanshu') {
        errors.push(`${where}: "${p.scope_quote}" lấy từ ${q.source}, không phải ziwei-quanshu`);
      }
      if (!q.text_zh.includes(p.zh)) {
        errors.push(`${where}: câu phạm vi không nhắc tới cung "${p.zh}"`);
      }
    }
  } else if (!p.note_vi || p.note_vi.trim().length < 20) {
    errors.push(`${where}: không có scope_quote thì phải có note_vi giải thích`);
  }
}

if (palaces.length !== 12) {
  errors.push(`palaces.json: phải có đủ 12 cung (đang ${palaces.length})`);
}

// ── Kết quả ───────────────────────────────────────────────────
console.log(
  `\nTinh diệu: ${stars.length} · Tứ Hoá: ${huaEntries.length} · Cung: ${palaces.length}` +
    ` · câu trích dùng: ${usedQuotes.size} · khoá đối chiếu: ${tokenChecks}`,
);
if (warnings.length) {
  console.log('\nCảnh báo:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log('\nLỗi:');
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (expectFail) {
    console.log(`\n✓ Self-test đạt: cổng chặn ${errors.length} lỗi như mong đợi.`);
    process.exit(0);
  }
  console.log('\n✗ Chặn build: nội dung Tầng B chưa khớp nguồn.');
  process.exit(1);
}
if (expectFail) {
  console.log('\n✗ Self-test HỎNG: cổng đã cho lọt dữ liệu sai.');
  process.exit(1);
}
console.log('\n✓ Mọi câu và mọi từ khoá đều khớp câu trích đã kiểm.\n');
