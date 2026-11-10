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
import { TEN_GODS } from '../packages/bazi-engine/src/ten-gods.ts';

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
    if (ref.role === 'definition' || ref.role === 'rule') hasDefinition = true;
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

// ── Bảng độ sáng sao ─────────────────────────────────────────
/**
 * Kiểm ngược từng ô của `content/brightness.json` với câu trích gốc.
 *
 * Bộ đọc ở đây cố ý viết lại độc lập với `scripts/gen-tuvi-brightness.mjs`:
 * nếu generator hiểu sai dòng nguồn thì cổng này phải bắt được, chứ không lặp lại
 * cùng một lỗi.
 */
const brightnessDoc = JSON.parse(readFileSync('content/brightness.json', 'utf8'));
const BRANCH_CHARS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const LEVEL_CHARS = new Set(['庙', '廟', '旺', '平', '地', '利', '陷']);

function parseBrightnessLine(label, text) {
  const rest = text.startsWith(label) ? text.slice(label.length).trim() : null;
  if (rest === null) return null;
  const levels = {};
  let noFall = false;
  for (const token of rest.split(/\s+/)) {
    if (!token) continue;
    if (token === '无陷' || token === '无失陷') {
      noFall = true;
      continue;
    }
    if (token === '十二宫中皆入庙') {
      BRANCH_CHARS.forEach((_, i) => {
        levels[i] = '庙';
      });
      continue;
    }
    const m = token.match(/^(庙|廟|旺|平|地|利|陷)([子丑寅卯辰巳午未申酉戌亥]+)$/);
    if (!m) return null;
    for (const ch of m[2]) {
      const idx = BRANCH_CHARS.indexOf(ch);
      if (idx === -1) return null;
      levels[idx] = m[1] === '廟' ? '庙' : m[1];
    }
  }
  return { levels, noFall };
}

let brightnessCells = 0;
for (const [id, star] of Object.entries(brightnessDoc.stars ?? {})) {
  const where = `brightness.json (${id})`;
  const q = quotes.get(star.quote_id);
  if (!q) {
    errors.push(`${where}: quote_id "${star.quote_id}" không tồn tại`);
    continue;
  }
  usedQuotes.add(q.id);
  if (q.source !== 'ziwei-quanshu') {
    errors.push(`${where}: câu trích không phải ziwei-quanshu`);
  }
  const parsed = parseBrightnessLine(star.source_label_zh ?? '', q.text_zh);
  if (!parsed) {
    errors.push(`${where}: câu trích không phải dòng bảng độ sáng của "${star.source_label_zh}"`);
    continue;
  }
  const declared = Object.fromEntries(
    Object.entries(star.levels ?? {}).map(([k, v]) => [Number(k), v]),
  );
  const expected = Object.fromEntries(
    Object.entries(parsed.levels).map(([k, v]) => [Number(k), v]),
  );
  if (JSON.stringify(declared) !== JSON.stringify(expected)) {
    errors.push(`${where}: bảng độ sáng không khớp câu trích`);
  }
  if (Boolean(star.no_fall) !== parsed.noFall) {
    errors.push(`${where}: cờ "không hãm" không khớp câu trích`);
  }
  const accounted = new Set([
    ...Object.keys(expected).map(Number),
    ...(star.unspecified ?? []),
  ]);
  for (let b = 0; b < 12; b++) {
    if (!accounted.has(b)) errors.push(`${where}: cung ${BRANCH_CHARS[b]} chưa được xếp loại`);
  }
  brightnessCells += Object.keys(expected).length;
}

// ── Quy tắc đại hạn ──────────────────────────────────────────
const dahanDoc = JSON.parse(readFileSync('content/dahan.json', 'utf8'));
const DAHAN_NUMERAL = { 2: '二岁', 3: '三岁', 4: '四岁', 5: '五', 6: '六岁' };
const requireQuote = (where, id, mustInclude = [], source = 'ziwei-quanshu') => {
  const q = quotes.get(id);
  if (!q) {
    errors.push(`${where}: "${id}" không tồn tại`);
    return null;
  }
  usedQuotes.add(id);
  if (q.source !== source) errors.push(`${where}: "${id}" không phải ${source}`);
  if (!q.claim_vi || q.claim_vi.trim().length < 8) {
    errors.push(`${where}: "${id}" thiếu claim_vi`);
  }
  // Ba bản dịch phải cùng một nguồn, không thêm nhận định ngoài câu trích.
  for (const field of ['short_vi', 'plain_vi']) {
    const value = q[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.trim().length < 10) {
      errors.push(`${where}: "${id}" có ${field} quá ngắn`);
    }
  }
  for (const needle of mustInclude) {
    if (!q.text_zh.includes(needle)) {
      errors.push(`${where}: "${id}" không chứa "${needle}"`);
    }
  }
  return q;
};

requireQuote('dahan.json', dahanDoc.direction_quote, ['阳男阴女', '阴男阳女']);
requireQuote('dahan.json', dahanDoc.ten_year_quote, ['十年']);
requireQuote('dahan.json', dahanDoc.fortune_quote, ['南斗']);
requireQuote('dahan.json', dahanDoc.structure_quote, ['三方', '四正']);
for (const age of Object.keys(DAHAN_NUMERAL)) {
  requireQuote(`dahan.json start_age[${age}]`, dahanDoc.start_age?.[age], [DAHAN_NUMERAL[age]]);
}
if (Object.keys(dahanDoc.start_age ?? {}).length !== 5) {
  errors.push('dahan.json: phải có đủ 5 mức tuổi khởi đại hạn (2–6)');
}

// ── Bát Tự: nhật chủ + thập thần ─────────────────────────────
const dayDoc = JSON.parse(readFileSync('content/day-masters.json', 'utf8'));
const dayEntries = dayDoc.entries ?? [];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

if (dayEntries.length !== 10) {
  errors.push(`day-masters.json: phải có đủ 10 can (đang ${dayEntries.length})`);
}
const seenStems = new Set();
for (const entry of dayEntries) {
  const where = `day-masters.json[${entry.stem}]`;
  if (entry.stem < 0 || entry.stem > 9) errors.push(`${where}: stem ngoài 0–9`);
  if (seenStems.has(entry.stem)) errors.push(`${where}: trùng can`);
  seenStems.add(entry.stem);
  if (entry.zh !== STEMS[entry.stem]) {
    errors.push(`${where}: zh "${entry.zh}" không khớp can thứ ${entry.stem}`);
  }
  requireQuote(where, entry.quote_id, [entry.zh], 'sanming-tonghui');
}

const godDoc = JSON.parse(readFileSync('content/ten-gods.json', 'utf8'));
const godAlias = {
  'that-sat': ['七殺', '七杀', '偏官'],
  'thien-an': ['偏印', '倒食', '梟神', '枭神'],
  'thuong-quan': ['傷官', '伤官'],
  'chinh-tai': ['正財', '正财'],
  'thien-tai': ['偏財', '偏财'],
  'kiep-tai': ['劫財', '劫财', '陽刃', '阳刃'],
};
const seenGods = new Set();
for (const entry of godDoc.entries ?? []) {
  const ids = entry.ids ?? (entry.id ? [entry.id] : []);
  if (ids.length === 0) errors.push('ten-gods.json: mục không có id');
  for (const id of ids) {
    if (!TEN_GODS[id]) {
      errors.push(`ten-gods.json: "${id}" không có trong TEN_GODS của bazi-engine`);
      continue;
    }
    if (seenGods.has(id)) errors.push(`ten-gods.json: trùng thần "${id}"`);
    seenGods.add(id);
  }
  const needles = ids.flatMap((id) => godAlias[id] ?? [TEN_GODS[id]?.zh]).filter(Boolean);
  const q = requireQuote(
    `ten-gods.json (${ids.join('/')})`,
    entry.quote_id,
    [],
    'yuanhai-ziping',
  );
  if (q && needles.length && !needles.some((n) => q.text_zh.includes(n))) {
    errors.push(
      `ten-gods.json (${ids.join('/')}): câu trích không nhắc tới ${needles.join(' / ')}`,
    );
  }
}
for (const missing of godDoc.missing ?? []) {
  if (!TEN_GODS[missing]) errors.push(`ten-gods.json: missing "${missing}" không có trong TEN_GODS`);
  if (seenGods.has(missing)) errors.push(`ten-gods.json: "${missing}" vừa thiếu vừa có`);
}
for (const id of Object.keys(TEN_GODS)) {
  if (!seenGods.has(id) && !(godDoc.missing ?? []).includes(id)) {
    errors.push(`ten-gods.json: thần "${id}" chưa có nội dung và không được đánh dấu thiếu`);
  }
}

// ── Luận theo cung + quy tắc đọc vận ────────────────────────
const palaceRulesDoc = JSON.parse(readFileSync('content/palace-rules.json', 'utf8'));
const palaceRuleEntries = palaceRulesDoc.entries ?? [];
if (palaceRuleEntries.length !== 12) {
  errors.push(`palace-rules.json: phải có đủ 12 cung (đang ${palaceRuleEntries.length})`);
}
for (const entry of palaceRuleEntries) {
  const where = `palace-rules.json (${entry.branchZh})`;
  const good = requireQuote(`${where} tốt`, entry.good_quote, [`${entry.branchZh}年太岁`]);
  const bad = requireQuote(`${where} xấu`, entry.bad_quote, [`${entry.branchZh}年太岁`]);
  for (const [label, q] of [
    ['tốt', good],
    ['xấu', bad],
  ]) {
    if (!q) continue;
    if (!q.plain_vi) errors.push(`${where} ${label}: thiếu bản giảng plain_vi`);
    if (!q.short_vi) errors.push(`${where} ${label}: thiếu bản tóm short_vi`);
  }
}

const readingRulesDoc = JSON.parse(readFileSync('content/reading-rules.json', 'utf8'));
const REQUIRED_RULES = ['ptc', 'dahan-ten-years', 'dahan-two-cycles', 'dahan-nam-bac', 'liunian'];
for (const key of REQUIRED_RULES) {
  const entry = readingRulesDoc.rules?.[key];
  if (!entry) {
    errors.push(`reading-rules.json: thiếu quy tắc "${key}"`);
    continue;
  }
  const q = requireQuote(`reading-rules.json (${key})`, entry.quote_id);
  if (q && !q.plain_vi) errors.push(`reading-rules.json (${key}): thiếu plain_vi`);
}
  if (JSON.stringify(readingRulesDoc.steps) !== JSON.stringify([4, 6, 8])) {
  errors.push('reading-rules.json: steps phải là [4, 6, 8] (tam hợp + đối cung)');
}
for (const id of ['q_tv_0116', 'q_tv_0117', 'q_tv_0110', 'q_tv_0118']) {
  const q = quotes.get(id);
  if (q && !q.plain_vi) errors.push(`"${id}" (đại hạn/tam phương) thiếu plain_vi`);
}
// ── Bảng tra thuật ngữ ──────────────────────────────────────
const glossaryDoc = JSON.parse(readFileSync('content/glossary.json', 'utf8'));
const terms = glossaryDoc.terms ?? {};
if (Object.keys(terms).length < 20) {
  errors.push('glossary.json: bảng tra quá ít thuật ngữ');
}
for (const [k, v] of Object.entries(terms)) {
  if (typeof v !== 'string' || v.trim().length < 15) {
    errors.push(`glossary.json: "${k}" có định nghĩa quá ngắn`);
  }
  if (/[一-龥]/.test(v)) {
    errors.push(`glossary.json: "${k}" còn chữ Hán trong phần giảng`);
  }
}

// ── Kết quả ───────────────────────────────────────────────────
console.log(
  `\nTinh diệu: ${stars.length} · Tứ Hoá: ${huaEntries.length} · Cung: ${palaces.length}` +
    ` · Độ sáng: ${Object.keys(brightnessDoc.stars ?? {}).length} sao / ${brightnessCells} ô` +
    ` · Nhật chủ: ${dayEntries.length} · Thập thần: ${seenGods.size}` +
    ` · Cung luận: ${palaceRuleEntries.length}×2 · Thuật ngữ: ${Object.keys(terms).length}` +
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
