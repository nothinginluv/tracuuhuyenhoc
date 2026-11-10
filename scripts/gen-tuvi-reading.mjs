#!/usr/bin/env node
/**
 * Sinh nội dung luận giải Tử Vi **theo cung** và **theo vận**:
 *
 *   · `content/palace-rules.json` — 12 cung, mỗi cung hai câu:
 *       tốt —「X年太岁并小限到X宫入庙化吉」: sao nào ở cung này thì thuận;
 *       xấu —「X年太岁并小限到X宫不入庙化凶」: sao nào ở cung này thì trắc trở.
 *   · `content/reading-rules.json` — quy tắc đọc vận:
 *       带 (lưu niên), 小限 (tiểu hạn), 大限 theo cung, tam phương tứ chính.
 *
 * Nguyên văn 紫微斗數全書, cắt bằng script (không gõ tay chữ Hán).
 *
 * Chạy: node scripts/gen-tuvi-reading.mjs
 *
 * Mỗi câu có claim_vi (bản dịch đầy đủ), short_vi (một dòng), plain_vi (lời giảng
 * không dùng thuật ngữ). Idempotent: khoá theo nguyên văn.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ZW = 'corpus/ziwei-quanshu.txt';
const QUOTES = 'content/quotes.jsonl';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCH_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const text = readFileSync(ZW, 'utf8');
const segOf = (idx) => {
  const segs = JSON.parse(readFileSync('corpus/ziwei-quanshu.segments.json', 'utf8')).segments;
  return segs.find((s) => idx >= s.start && idx < s.end)?.locator ?? '?';
};

const quotes = readFileSync(QUOTES, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const nextId = () =>
  `q_tv_${String(Math.max(0, ...quotes.map((q) => Number(q.id.slice(5)))) + 1).padStart(4, '0')}`;

const upsert = (text_zh, claim_vi, locator, short_vi, plain_vi) => {
  const existing = quotes.find((q) => q.text_zh === text_zh);
  if (existing) {
    Object.assign(existing, { claim_vi, short_vi, plain_vi });
    return { id: existing.id, added: false };
  }
  const quote = {
    id: nextId(),
    source: 'ziwei-quanshu',
    text_zh,
    claim_vi,
    locator,
    short_vi,
    plain_vi,
  };
  quotes.push(quote);
  return { id: quote.id, added: true };
};

let added = 0;
const save = (res) => {
  if (res.added) added++;
  return res.id;
};

/** Cắt từ `anchor` tới (không gồm) `until`. */
function slice(anchor, until) {
  const i = text.indexOf(anchor);
  if (i === -1) throw new Error(`Không thấy đoạn: ${anchor}`);
  const j = text.indexOf(until, i + anchor.length);
  if (j === -1) throw new Error(`Không thấy mốc: ${until} (sau ${anchor})`);
  const raw = text
    .slice(i, j)
    .replace(/^=+/, '')
    .replace(/=+$/, '')
    .replace(/\n?={2,}\n?/g, '\n')
    .trim();
  return { text: raw, at: i };
}

/** Một đoạn trong phần "chạy đủ 12 chi": từ tiêu đề "X年太岁..." tới "所值吉凶星". */
function branchSlice(branch, kind) {
  const head = `${branch}年太岁并小限到${branch}宫${kind}`;
  const i = text.indexOf(head);
  if (i === -1) throw new Error(`Không thấy đoạn: ${head}`);
  const j = text.indexOf('所值吉凶星', i + head.length);
  if (j === -1) throw new Error(`Không thấy mốc "所值吉凶星" sau ${head}`);
  return { text: text.slice(i, j).trim(), at: i };
}

// ── 1. Luận theo cung ───────────────────────────────────────
const GOOD = {
  子: ['Tử Vi ở Tý là ngoại lệ: kém hơn chỗ khác.', 'Khi cung Tý là nơi các sao kể trên hợp lại thì việc dễ thông. Riêng Tử Vi đứng ở Tý lại yếu hơn ở các cung khác.'],
  丑: ['Thiên Cơ, Thiên Tướng, Thái Âm, Thiên Lương… ở Sửu thì thuận.', 'Cung Sửu có nhóm sao kể trên thì công việc, tiền bạc dễ thành.'],
  寅: ['Tử Vi, Thái Dương, Vũ Khúc, Thiên Lương, Thất Sát ở Dần thì tốt.', 'Cung Dần có các sao kể trên thì công danh và tiền của cùng thuận.'],
  卯: ['Tử Vi, Thiên Cơ, Thái Dương, Thiên Phủ, Thiên Đồng, Vũ Khúc ở Mão thì vượng.', 'Cung Mão có các sao kể trên thì an nhàn, thuận việc.'],
  辰: ['Tử Vi, Tham Lang, Thất Sát, Thiên Cơ, Thái Dương… ở Thìn thì thịnh.', 'Cung Thìn có nhóm sao kể trên thì tiền của và công danh đều khá.'],
  巳: ['Tử Vi, Thiên Phủ, Thiên Đồng, Cự Môn… ở Tỵ thì có phúc.', 'Cung Tỵ có nhóm sao kể trên thì dễ có phúc. Nhưng Thái Âm hay Thiên Cơ ở đây lại là hao tài — một cung không thể chỉ nhìn một sao.'],
  午: ['Tử Vi, Thái Dương, Vũ Khúc, Thiên Đồng… ở Ngọ thì vào tiền.', 'Cung Ngọ có nhóm sao kể trên thì tiền của vào đều; đây là vùng đất lửa nên các sao dương mạnh lên.'],
  未: ['Tử Vi, Thiên Cơ, Thiên Phủ, Thiên Tướng, Thiên Lương, Thái Âm ở Mùi thì có phúc.', 'Cung Mùi có nhóm sao kể trên dễ ra tiền và có phúc.'],
  申: ['Liêm Trinh, Phá Quân, Tử Vi, Cự Môn, Thiên Cơ ở Thân thì phát.', 'Cung Thân có nhóm sao kể trên thì dễ phát.'],
  酉: ['Tử Vi, Thiên Cơ, Thái Âm ở Dậu thì vào tiền.', 'Cung Dậu có Tử Vi, Thiên Cơ hoặc Thái Âm thì việc sinh lợi dễ hơn.'],
  戌: ['Tử Vi, Thái Âm, Vũ Khúc, Thiên Cơ, Cự Môn ở Tuất thì phát.', 'Cung Tuất có nhóm sao kể trên thì có của và có tiếng.'],
  亥: ['Tử Vi, Thiên Đồng, Cự Môn, Thiên Lương, Thiên Tướng ở Hợi thì tốt.', 'Cung Hợi có nhóm sao kể trên thì công danh và tài lộc cùng đẹp.'],
};

const BAD = {
  子: ['Tử Vi tại Tý lại là chỗ trái ý.', 'Cung Tý có Tử Vi thì dễ hao tiền, trái ý — sao mạnh ở cung khác lại yếu ở đây.'],
  丑: ['Thái Âm, Thái Dương, Thiên Cơ, Thiên Đồng, Liêm Trinh ở Sửu trắc trở.', 'Cung Sửu có nhóm sao kể trên thì dễ gặp việc trái ý hoặc lôi thôi.'],
  寅: ['Liêm Trinh, Tham Lang, Phá Quân ở Dần dễ sinh chuyện.', 'Cung Dần có Liêm Trinh, Tham Lang hoặc Phá Quân thì dễ vướng giấy tờ, thị phi.'],
  卯: ['Liêm Trinh, Thái Âm ở Mão thì hao tài.', 'Cung Mão có Liêm Trinh hoặc Thái Âm thì dễ hao tiền.'],
  辰: ['Tham Lang, Vũ Khúc, Thiên Đồng, Cự Môn, Liêm Trinh ở Thìn thì khó.', 'Cung Thìn có nhóm sao kể trên thì dễ gặp việc kém; Liêm Trinh ở đây nặng nhất.'],
  巳: ['Cự Môn, Tham Lang, Thái Âm, Phá Quân ở Tỵ lôi thôi.', 'Cung Tỵ có nhóm sao kể trên thì dễ vướng thị phi và việc bất ngờ.'],
  午: ['Tham Lang ở Ngọ dễ hao tài.', 'Cung Ngọ có Tham Lang thì dễ mất tiền, có thị phi.'],
  未: ['Thái Dương, Thiên Đồng, Vũ Khúc ở Mùi dễ gặp chuyện.', 'Cung Mùi có Thái Dương, Thiên Đồng hoặc Vũ Khúc thì dễ gặp chuyện bất ngờ, có khi dính pháp lý.'],
  申: ['Thiên Cơ, Cự Môn, Liêm Trinh, Thiên Đồng, Tham Lang ở Thân sinh chuyện.', 'Cung Thân có nhóm sao kể trên thì dễ gặp việc trái ý, thị phi.'],
  酉: ['Thái Dương, Vũ Khúc, Thiên Tướng, Liêm Trinh, Thiên Phủ ở Dậu không thuận.', 'Cung Dậu có nhóm sao kể trên thì việc lớn không thuận.'],
  戌: ['Tham Lang, Thiên Đồng, Thiên Cơ, Cự Môn… ở Tuất không thuận.', 'Cung Tuất có nhóm sao kể trên thì việc làm dễ kẹt.'],
  亥: ['Liêm Trinh, Vũ Khúc, Thái Dương ở Hợi không thuận.', 'Cung Hợi có Liêm Trinh, Vũ Khúc hoặc Thái Dương thì công việc dễ lệch ý.'],
};

const palaceEntries = [];
for (const [index, branch] of BRANCHES.entries()) {
  const good = branchSlice(branch, '入庙化吉');
  const bad = branchSlice(branch, '不入庙化凶');

  const goodId = save(
    upsert(
      good.text,
      `Cung ${BRANCH_VI[index]}: sách liệt kê sao nào cư cung ${BRANCH_VI[index]} thì thuận (入庙化吉), kèm can năm sinh được hưởng.`,
      segOf(good.at),
      `Ở cung ${BRANCH_VI[index]}: ${GOOD[branch][0]}`,
      GOOD[branch][1],
    ),
  );
  const badId = save(
    upsert(
      bad.text,
      `Cung ${BRANCH_VI[index]}: sách liệt kê sao nào cư cung ${BRANCH_VI[index]} thì trắc trở (不入庙化凶), kèm can năm sinh bị ảnh hưởng.`,
      segOf(bad.at),
      `Ở cung ${BRANCH_VI[index]}: ${BAD[branch][0]}`,
      BAD[branch][1],
    ),
  );

  palaceEntries.push({
    branch: index,
    branchZh: branch,
    branchVi: BRANCH_VI[index],
    good_quote: goodId,
    bad_quote: badId,
  });
}

writeFileSync(
  'content/palace-rules.json',
  JSON.stringify(
    {
      version: 1,
      $comment:
        'Luận theo cung, sinh từ 紫微斗數全書 (論太歲小限星辰庙陷遇十二宫中吉凶). ' +
        'Mỗi cung một câu thuận và một câu trắc trở. Chạy scripts/gen-tuvi-reading.mjs để dựng lại.',
      source: 'ziwei-quanshu',
      locator: '論太歲小限星辰庙陷遇十二宫中吉凶',
      entries: palaceEntries,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

// ── 2. Quy tắc đọc vận ──────────────────────────────────────
const RULES = [
  {
    key: 'dahan-ten-years',
    marker: '论大限十年祸福何如',
    until: '===论二限太岁吉凶===',
    claim:
      'Cách đọc mười năm: cung hạn toàn sao tốt, không có sao xấu thì yên ổn; có sát tinh thì thành bại lẫn lộn. Còn xét cung Hợi Tý Ngọ và bốn mùa, cùng lưu niên, tiểu hạn.',
    short: 'Đại hạn đọc theo cung: sao tốt thì yên, có sát tinh thì lộn xộn.',
    plain:
      'Mỗi mười năm rơi vào một cung. Cung đó có sao tốt mà không có sao xấu thì dễ yên; có sao xấu chen vào thì thành bại lẫn lộn. Sách còn chia theo vùng đất (Dần Thân Tỵ Hợi hay Thìn Tuất Sửu Mùi) để nói tiếp.',
  },
  {
    key: 'dahan-two-cycles',
    marker: '论二限太岁吉凶===',
    until: '===论行限分南北斗===',
    claim:
      'Xét đại hạn, tiểu hạn và lưu niên riêng từng cái; cả hai cùng xấu thì mới xấu. Còn xét hai hạn chồng nhau, hạn với lưu niên, và lưu niên xung hạn.',
    short: 'Đại hạn, tiểu hạn, lưu niên phải xét cùng nhau.',
    plain:
      'Đừng lấy một hạn mà kết luận. Phải xem ba lớp: đại hạn (10 năm), tiểu hạn (1 năm theo cách an riêng), lưu niên (can chi năm đang xét). Ba lớp cùng xấu mới nói là xấu.',
  },
  {
    key: 'dahan-nam-bac',
    marker: '论行限分南北斗===',
    until: '===论流年太岁吉凶星杀===',
    claim:
      'Nam dương nữ âm lấy Nam Đẩu làm phúc. Sao Nam Đẩu ứng vào nửa sau của đại hạn (5 năm cuối); Bắc Đẩu ứng vào nửa trước.',
    short: 'Nam Đẩu ứng nửa sau 10 năm, Bắc Đẩu ứng nửa đầu.',
    plain:
      'Trong một đại hạn 10 năm, sách chia làm hai nửa: nhóm sao Bắc Đẩu nói về 5 năm đầu, nhóm sao Nam Đẩu nói về 5 năm sau. Tức là một hạn không đọc như nhau suốt 10 năm.',
  },
  {
    key: 'liunian',
    marker: '论流年太岁吉凶星杀===',
    until: '===论阴骘延寿===',
    claim:
      'Lưu niên xét theo ba phương và cung đối chiếu của nó; lưu niên vào cung Mệnh thì ảnh hưởng rõ hơn cả. Ta chỉ liệt kê cung lưu niên và các cung đối chiếu, không tự luận.',
    short: 'Lưu niên vào cung Mệnh thì ảnh hưởng rõ nhất.',
    plain:
      'Mỗi năm có một con giáp. Con giáp đó rơi vào một trong 12 cung của lá số — đó là cung lưu niên của năm ấy. Sách nói lưu niên vào cung Mệnh thì rõ hơn ở cung khác; và luôn phải nhìn cả cung đối diện và hai cung tam hợp.',
  },
  {
    key: 'ptc',
    marker: '四正吉星定為貴',
    until: '觀賤觀榮。',
    claim:
      'Bốn chính cung có sao tốt thì quý; ba phương mà sát khí chầu về thì ít lạ. Đối cung để xét hung cát, cung hợp chiếu để xem sang hèn.',
    short: 'Xét cung nào thì phải xét cùng tam hợp và đối cung.',
    plain:
      'Cổ nhân không nhìn riêng từng cung. Một cung luôn được đọc cùng hai cung tam hợp và cung đối diện: cái gì ở bốn cung đó hợp lại mới thành hình rõ.',
  },
];

const ruleEntries = {};
for (const rule of RULES) {
  const hit = slice(rule.marker, rule.until);
  ruleEntries[rule.key] = {
    quote_id: save(upsert(hit.text, rule.claim, segOf(hit.at), rule.short, rule.plain)),
    locator: segOf(hit.at),
  };
}

writeFileSync(
  'content/reading-rules.json',
  JSON.stringify(
    {
      version: 1,
      $comment:
        'Quy tắc đọc vận và tam phương tứ chính, sinh từ 紫微斗數全書. ' +
        'Chạy scripts/gen-tuvi-reading.mjs để dựng lại.',
      source: 'ziwei-quanshu',
      steps: [4, 6, 8],
      rules: ruleEntries,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

writeFileSync(QUOTES, quotes.map((q) => JSON.stringify(q)).join('\n') + '\n', 'utf8');
console.log(`palace-rules.json: ${palaceEntries.length} cung · reading-rules.json: ${RULES.length} quy tắc`);
console.log(`câu mới: ${added} · tổng kho: ${quotes.length}`);
