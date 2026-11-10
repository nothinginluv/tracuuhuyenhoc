#!/usr/bin/env node
/**
 * Sinh `content/brightness.json`, `content/dahan.json` + các câu trích độ sáng / đại hạn
 * từ corpus đã pin.
 *
 * Chạy: node scripts/gen-tuvi-brightness.mjs
 *
 * Vì sao phải sinh bằng script: chữ Hán trong bảng độ sáng là nguyên văn 紫微斗數全書
 * 卷三, không được gõ tay. Script đọc thẳng `corpus/ziwei-quanshu.txt`, cắt đúng dòng
 * của từng sao rồi mới ghi ra JSON. Muốn đổi nội dung thì phải đổi corpus + hash.
 *
 * Idempotent: chạy lại chỉ ghi lại JSON, không nhân đôi câu trích.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CORPUS = 'corpus/ziwei-quanshu.txt';
const SEGMENTS = 'corpus/ziwei-quanshu.segments.json';
const QUOTES = 'content/quotes.jsonl';
const OUT = 'content/brightness.json';

const text = readFileSync(CORPUS, 'utf8');
const segments = JSON.parse(readFileSync(SEGMENTS, 'utf8')).segments;
const segOf = (idx) => segments.find((s) => idx >= s.start && idx < s.end)?.locator ?? '?';

/** Thứ tự địa chi, khớp `BRANCHES_ZH` của tuvi-engine. */
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCH_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const branchIndex = new Map(BRANCHES.map((z, i) => [z, i]));

const LEVELS = {
  庙: { vi: 'Miếu', tone: 'sang' },
  廟: { vi: 'Miếu', tone: 'sang' },
  旺: { vi: 'Vượng', tone: 'sang' },
  利: { vi: 'Lợi', tone: 'sang' },
  地: { vi: 'Địa', tone: 'sang' },
  平: { vi: 'Bình', tone: 'trung' },
  陷: { vi: 'Hãm', tone: 'toi' },
};

/** Nhãn trong corpus → id sao của engine. */
const STARS = [
  ['ziwei', '紫微'],
  ['tianfu', '天府'],
  ['tianxiang', '天相'],
  ['tianliang', '天梁'],
  ['tiantong', '天同'],
  ['tianji', '天机'],
  ['taiyang', '太阳'],
  ['taiyin', '太阴'],
  ['wenchang', '文昌'],
  ['wenqu', '文曲'],
  ['wuqu', '武曲'],
  ['tanlang', '贪狠'],
  ['lianzhen', '廉贞'],
  ['jumen', '巨门'],
  ['qisha', '七杀'],
  ['pojun', '破军'],
  ['qingyang', '擎羊'],
  ['tuoluo', '陀罗'],
  ['huoxing', '火星'],
  ['lingxing', '铃星'],
  ['lucun', '禄存'],
];

/** Bản dịch nghĩa của chính dòng độ sáng (không thêm nhận định nào khác). */
const CLAIM = {
  ziwei: 'Tử Vi: miếu ở Sửu, Mùi, Ngọ; vượng ở Dần, Thân, Mão, Dậu, Tỵ, Hợi; bình ở Tý; không có cung hãm.',
  tianfu: 'Thiên Phủ: miếu ở Tý, Sửu, Mùi, Dần, Thìn, Tuất; vượng ở Ngọ, Dậu; địa ở Mão, Tỵ, Thân, Hợi; không có cung hãm.',
  tianxiang: 'Thiên Tướng: miếu ở Tý, Ngọ, Sửu, Dần, Thân; địa ở Thìn, Tuất, Tỵ, Hợi, Mùi; hãm ở Mão, Dậu.',
  tianliang: 'Thiên Lương: miếu ở Tý, Ngọ, Dần, Mão, Thìn, Tuất; vượng ở Sửu, Mùi; địa ở Dậu; hãm ở Thân, Tỵ, Hợi.',
  tiantong: 'Thiên Đồng: miếu ở Tỵ, Hợi; vượng ở Tý, Thân; hãm ở Ngọ.',
  tianji: 'Thiên Cơ: miếu ở Tý, Ngọ; vượng ở Thìn, Dậu; hãm ở Sửu, Mùi.',
  taiyang: 'Thái Dương: miếu ở Mão; vượng ở Dần, Thìn, Tỵ, Ngọ; hãm ở Tý.',
  taiyin: 'Thái Âm: miếu ở Hợi, Tý, Sửu; vượng ở Dần, Dậu, Tuất; hãm ở Mão, Thìn, Tỵ.',
  wenchang: 'Văn Xương: miếu ở Tỵ, Dậu, Sửu; địa ở Thân, Tý, Thìn; hãm ở Dần, Ngọ, Tuất.',
  wenqu: 'Văn Khúc: miếu ở Tỵ, Dậu, Sửu; địa ở Thân, Tý, Thìn; hãm ở Dần, Ngọ, Tuất.',
  wuqu: 'Vũ Khúc: miếu ở Thìn, Tuất, Sửu, Mùi; vượng ở Tý, Ngọ; bình ở Tỵ, Hợi; không có cung thất hãm.',
  tanlang: 'Tham Lang: miếu ở Thìn, Tuất, Sửu, Mùi; vượng ở Tý, Ngọ; hãm ở Tỵ, Hợi.',
  lianzhen: 'Liêm Trinh: miếu ở Dần, Thân; lợi ở Thìn, Tuất, Sửu, Mùi; hãm ở Tỵ, Hợi.',
  jumen: 'Cự Môn: miếu ở Dần, Thân, Mão, Dậu; vượng ở Tý, Ngọ, Tỵ, Hợi; hãm ở Thìn, Tuất.',
  qisha: 'Thất Sát: miếu ở Thìn, Tuất, Sửu, Mùi, Dần, Thân; vượng ở Tý, Ngọ, Mão, Dậu; bình ở Tỵ, Hợi; không có cung hãm.',
  pojun: 'Phá Quân: miếu ở Tý, Ngọ; vượng ở Thìn, Tuất, Sửu, Mùi; hãm ở Mão, Dậu.',
  qingyang: 'Kình Dương: miếu ở Thìn, Tuất, Sửu, Mùi; hãm ở Tý, Ngọ, Mão, Dậu.',
  tuoluo: 'Đà La: miếu ở Thìn, Tuất, Sửu, Mùi; hãm ở Dần, Thân, Tỵ, Hợi.',
  huoxing: 'Hoả Tinh: miếu ở Dần, Ngọ, Tuất; địa ở Tỵ, Dậu, Sửu; hãm ở Thân, Tý, Thìn.',
  lingxing: 'Linh Tinh: miếu ở Dần, Ngọ, Tuất; địa ở Tỵ, Dậu, Sửu; hãm ở Thân, Tý, Thìn.',
  lucun: 'Lộc Tồn: mười hai cung đều vào miếu.',
};

/** Dòng bảng độ sáng của một sao: "紫微 庙丑未午 旺寅申卯酉巳亥 平子 无陷". */
function findLine(label) {
  const probe = `${label} `;
  let idx = text.indexOf(probe);
  while (idx !== -1) {
    const nl = text.indexOf('\n', idx);
    const line = text.slice(idx, nl === -1 ? text.length : nl).trim();
    const rest = line.slice(label.length).trim();
    if (/^(庙|廟|旺|平|地|利|陷)/.test(rest) || rest.includes('十二宫中皆入庙')) return { line, idx };
    idx = text.indexOf(probe, idx + 1);
  }
  return null;
}

function parseLine(line, label) {
  const levels = {};
  let noFall = false;
  const tokens = line.slice(label.length).trim().split(/\s+/);
  for (const token of tokens) {
    if (token === '无陷' || token === '无失陷') {
      noFall = true;
      continue;
    }
    if (token === '十二宫中皆入庙') {
      for (let b = 0; b < 12; b += 1) levels[b] = '庙';
      continue;
    }
    const m = token.match(/^(庙|廟|旺|平|地|利|陷)([子丑寅卯辰巳午未申酉戌亥]+)$/);
    if (!m) throw new Error(`Không đọc được token "${token}" trong dòng: ${line}`);
    for (const ch of m[2]) levels[branchIndex.get(ch)] = m[1] === '廟' ? '庙' : m[1];
  }
  return { levels, noFall };
}

/** Câu trích đại hạn: quy tắc + tuổi khởi của 5 cục + đoạn luận 10 năm. */
function pick(anchor, { until = '\n', includeEnd = false, join = true } = {}) {
  const i = text.indexOf(anchor);
  if (i === -1) throw new Error(`Không thấy đoạn: ${anchor}`);
  const end = text.indexOf(until, i);
  const raw = text.slice(i, end === -1 ? text.length : end + (includeEnd ? until.length : 0)).trim();
  const line = join ? raw.replace(/\s*\n\s*/g, '') : raw;
  return { text: line, locator: segOf(i), at: i };
}

const DAHAN = [
  {
    id: 'q_tv_0110',
    key: 'dahan-rule',
    pick: () => pick('阳男阴女从命前一宫起顺行'),
    claim_vi:
      'Nam dương nữ âm: khởi từ cung trước Mệnh mà đi thuận, tức cung Phụ Mẫu. Nam âm nữ dương: khởi từ cung sau Mệnh mà đi nghịch, tức cung Huynh Đệ.',
  },
  {
    id: 'q_tv_0111',
    key: 'cuc-thuy-nhi',
    pick: () => pick('坎水宫中二岁行', { until: '。', includeEnd: true }),
    claim_vi: 'Cục Thuỷ nhị khởi đại hạn từ 2 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  {
    id: 'q_tv_0112',
    key: 'cuc-moc-tam',
    pick: () => pick('生逢木宫三岁起', { until: '。', includeEnd: true }),
    claim_vi: 'Cục Mộc tam khởi đại hạn từ 3 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  {
    id: 'q_tv_0113',
    key: 'cuc-kim-tu',
    pick: () => pick('紫微金宫四岁花', { until: '。', includeEnd: true }),
    claim_vi: 'Cục Kim tứ khởi đại hạn từ 4 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  {
    id: 'q_tv_0114',
    key: 'cuc-tho-ngu',
    pick: () => pick('戌土五龙居其中', { until: '。', includeEnd: true }),
    claim_vi: 'Cục Thổ ngũ khởi đại hạn từ 5 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  {
    id: 'q_tv_0115',
    key: 'cuc-hoa-luc',
    pick: () => pick('离火宫中六岁奇', { until: '。', includeEnd: true }),
    claim_vi: 'Cục Hoả lục khởi đại hạn từ 6 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  {
    id: 'q_tv_0116',
    key: 'dahan-ten-years',
    pick: () =>
      pick('如宫分星缠全吉庙旺得地', {
        until: '若限内有擎羊陀罗火铃空劫忌星为伴，成败不一。',
        includeEnd: true,
      }),
    claim_vi:
      'Nếu cung hạn toàn sao tốt miếu vượng đắc địa, không có Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không, Kiếp: mười năm yên ổn, người và của đều tốt. Nếu trong hạn có các sao ấy làm bạn thì thành bại không đều.',
  },
  {
    id: 'q_tv_0117',
    key: 'dahan-nam-bac-dau',
    pick: () => pick('阳男阴女南斗为福', { until: '。', includeEnd: true }),
    claim_vi: 'Nam dương nữ âm lấy Nam Đẩu làm phúc; nam âm nữ dương lấy Bắc Đẩu làm phúc.',
  },
];

// ── Dựng bảng độ sáng ─────────────────────────────────────────
const quotes = readFileSync(QUOTES, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);
const existing = new Set(quotes.map((l) => JSON.parse(l).id));

let nextId = 89;
const stars = {};
const added = [];

for (const [id, label] of STARS) {
  const hit = findLine(label);
  if (!hit) throw new Error(`Không thấy dòng độ sáng của ${label}`);
  const { levels, noFall } = parseLine(hit.line, label);
  const quoteId = `q_tv_${String(nextId).padStart(4, '0')}`;
  nextId += 1;

  stars[id] = {
    quote_id: quoteId,
    source_label_zh: label,
    levels,
    no_fall: noFall,
    unspecified: BRANCHES.map((_, b) => b).filter((b) => !(b in levels)),
  };

  if (!existing.has(quoteId)) {
    added.push({
      id: quoteId,
      source: 'ziwei-quanshu',
      text_zh: hit.line,
      claim_vi: CLAIM[id],
      locator: segOf(hit.idx),
    });
  }
}

const doc = {
  version: 1,
  $comment:
    'Bảng độ sáng sao theo 12 cung, sinh từ 紫微斗數全書 卷三 (论诸星同垣各司所宜). Chạy scripts/gen-tuvi-brightness.mjs để dựng lại; scripts/verify-content.mjs đối chiếu ngược từng ô với câu trích. Ô nào nguồn không chép thì để trống, giao diện ghi "không chép".',
  source: 'ziwei-quanshu',
  locator: '卷三',
  levels: LEVELS,
  stars,
};

writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n', 'utf8');

// ── Thêm câu trích đại hạn ────────────────────────────────────
const dahanMeta = {};
for (const entry of DAHAN) {
  const hit = entry.pick();
  dahanMeta[entry.key] = { quote_id: entry.id, locator: hit.locator };
  if (!existing.has(entry.id)) {
    added.push({
      id: entry.id,
      source: 'ziwei-quanshu',
      text_zh: hit.text,
      claim_vi: entry.claim_vi,
      locator: hit.locator,
    });
  }
}

/** Quy tắc đọc lá số dùng chung (không thuộc riêng đại hạn). */
const RULES = [
  {
    id: 'q_tv_0118',
    anchor: '四正吉星定為貴',
    until: '觀賤觀榮。',
    includeEnd: true,
    claim_vi:
      'Bốn chính cung có sao tốt thì quý; ba phương có sát xung thì ít lạ. Đối chiếu để xét hung cát, hợp chiếu để xem sang hèn.',
  },
];

for (const entry of RULES) {
  const hit = pick(entry.anchor, { until: entry.until, includeEnd: entry.includeEnd });
  if (!existing.has(entry.id)) {
    added.push({
      id: entry.id,
      source: 'ziwei-quanshu',
      text_zh: hit.text,
      claim_vi: entry.claim_vi,
      locator: hit.locator,
    });
  }
  dahanMeta[entry.id] = hit.locator;
}

if (added.length) {
  const lines = [...quotes, ...added.map((q) => JSON.stringify(q))];
  writeFileSync(QUOTES, lines.join('\n') + '\n', 'utf8');
}

// ── Ghép quy tắc đại hạn thành một tệp nội dung ───────────────
const dahanDoc = {
  version: 1,
  $comment:
    'Quy tắc an đại hạn (大限) và cách đọc mười năm, sinh từ 紫微斗數全書 卷二/卷三. ' +
    'Mọi con số ở đây đều lấy từ chính câu trích; scripts/verify-content.mjs đối chiếu lại.',
  source: 'ziwei-quanshu',
  direction_quote: 'q_tv_0110',
  ten_year_quote: 'q_tv_0116',
  fortune_quote: 'q_tv_0117',
  structure_quote: 'q_tv_0118',
  /** Số tuổi khởi đại hạn theo ngũ hành cục (2–6). */
  start_age: {
    2: 'q_tv_0111',
    3: 'q_tv_0112',
    4: 'q_tv_0113',
    5: 'q_tv_0114',
    6: 'q_tv_0115',
  },
};
writeFileSync('content/dahan.json', JSON.stringify(dahanDoc, null, 2) + '\n', 'utf8');

console.log(`brightness.json: ${Object.keys(stars).length} sao`);
for (const [id, s] of Object.entries(stars)) {
  const known = 12 - s.unspecified.length;
  console.log(
    `  ${id.padEnd(9)} ${known}/12 cung` +
      (s.no_fall ? ' · nguồn ghi "không hãm"' : '') +
      (known < 12 ? ` · thiếu: ${s.unspecified.map((b) => BRANCH_VI[b]).join(', ')}` : ''),
  );
}
console.log(`quotes thêm mới: ${added.length}`);
for (const q of added) console.log(`  ${q.id} ${q.locator} ${q.text_zh.slice(0, 24)}…`);
console.log(JSON.stringify(dahanMeta));
