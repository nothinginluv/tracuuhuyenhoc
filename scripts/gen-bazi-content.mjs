#!/usr/bin/env node
/**
 * Sinh nội dung Bát Tự cho tầng luận giải:
 *   · `content/day-masters.json` — mười thiên can, nguyên văn 三命通會 卷02
 *     (論天干隂陽生死).
 *   · `content/ten-gods.json` — định nghĩa thập thần, nguyên văn 淵海子平.
 *
 * Chạy: node scripts/gen-bazi-content.mjs
 *
 * Chữ Hán không được gõ tay: script cắt thẳng từ corpus đã pin hash.
 *
 * Mỗi câu có ba bản dịch, cùng một nguồn, không thêm nhận định:
 *   claim_vi — bản dịch đầy đủ, giữ chữ của nguồn (hiện khi bấm "§").
 *   short_vi — một dòng cho người mới.
 *   plain_vi — cùng nội dung, viết như lời giảng cho người không biết thuật ngữ.
 *
 * Câu trích được khoá theo **nguyên văn** (`text_zh`): nếu kho đã có đúng câu đó thì
 * chỉ cập nhật bản dịch tại chỗ, không cấp id mới. Nhờ vậy chạy lại nhiều lần vẫn
 * không nhân đôi id.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { TEN_GODS as TEN_GOD_DEFS } from '../packages/bazi-engine/src/ten-gods.ts';

const SAN = 'corpus/sanming-tonghui.txt';
const YUAN = 'corpus/yuanhai-ziping.txt';
const QUOTES = 'content/quotes.jsonl';

const san = readFileSync(SAN, 'utf8');
const yuan = readFileSync(YUAN, 'utf8');
const segOf = (file, idx) => {
  const path = file.replace(/\.txt$/, '.segments.json');
  const segments = JSON.parse(readFileSync(path, 'utf8')).segments;
  return segments.find((s) => idx >= s.start && idx < s.end)?.locator ?? '?';
};

/** Cắt từ `anchor` tới hết `until`. */
function pick(text, anchor, until) {
  const i = text.indexOf(anchor);
  if (i === -1) throw new Error(`Không thấy đoạn: ${anchor}`);
  const j = text.indexOf(until, i + anchor.length);
  if (j === -1) throw new Error(`Không thấy mốc kết: ${until}`);
  return { text: text.slice(i, j + until.length).replace(/\s*\n\s*/g, ''), at: i };
}

/**
 * Mười can — 三命通會 卷02, 論天干隂陽生死.
 * `short` = một dòng người mới đọc hiểu ngay; `plain` = bản giảng không dùng thuật ngữ.
 */
const DAY_MASTERS = [
  [
    '甲', 'Giáp', '甲木乃十干之首', '謂之陽木',
    'Giáp là can Mộc dương, đứng đầu mười can, chủ bốn mùa và sinh dưỡng vạn vật. Trên trời là sấm, là rồng; dưới đất là xà nhà, là cột lớn — nên gọi là Dương Mộc.',
    'Giống cây gỗ lớn, cột nhà: đứng đầu, gánh việc.',
    'Giáp giống cây gỗ lớn, thân thẳng, gánh được việc nặng. Đứng đầu mười can, tính ngay thẳng, thích là nơi người khác nương vào.',
  ],
  [
    '乙', 'Ất', '乙木繼甲之後', '謂之陰木',
    'Ất là can Mộc âm, nối tiếp Giáp, sinh sôi vạn vật không ngừng. Trên trời là gió, dưới đất là cây — nên gọi là Âm Mộc.',
    'Giống cây leo, cỏ mềm: mềm dẻo, dễ thích nghi.',
    'Ất giống cây dây leo, cây nhỏ: mềm, bám vào thứ khác mà phát triển, khéo thích nghi chứ không cố cứng như Giáp.',
  ],
  [
    '丙', 'Bính', '丙火麗乎中天', '謂之陽火',
    'Bính là can Hoả dương, toả sáng giữa trời, chiếu khắp sáu hướng. Trên trời là mặt trời, là chớp; dưới đất là lò, là nơi nấu luyện — nên gọi là Dương Hoả.',
    'Giống mặt trời: toả sáng, rộng rãi, dễ nổi bật.',
    'Bính giống mặt trời: chiếu sáng cho mọi người, hào phóng, thích cho đi. Nhưng mặt trời cũng không tự giữ lại được gì cho mình.',
  ],
  [
    '丁', 'Đinh', '丁火繼丙之後', '謂之隂火',
    'Đinh là can Hoả âm, nối tiếp Bính, là tinh hoa của vạn vật và biểu tượng văn minh. Trên trời là các ngôi sao, dưới đất là đèn lửa — nên gọi là Âm Hoả.',
    'Giống ngọn đèn: sáng nhỏ mà bền, tinh tế.',
    'Đinh giống ngọn đèn: sáng nhỏ mà ấm, soi được chỗ tối, cần dầu (nuôi dưỡng) để cháy lâu. Tính tế nhị, chú ý tiểu tiết.',
  ],
  [
    '戊', 'Mậu', '戊土洪濛未判', '謂之陽土',
    'Mậu là can Thổ dương: khi trời đất còn chưa phân rõ thì nó là khối giữ giữa; khi đã phân thì nó chở che vạn vật, tụ ở trung tâm và lan ra bốn phía. Trên trời là sương mù, dưới đất là núi — nên gọi là Dương Thổ.',
    'Giống núi đá, thành luỹ: trầm, vững, chịu được sức nặng.',
    'Mậu giống ngọn núi có thể chặn gió, che cho người khác. Điềm tĩnh, đáng tin, nhưng đôi khi nặng nề và khó đổi thói quen.',
  ],
  [
    '己', 'Kỷ', '己土繼戊之後', '謂之陰土',
    'Kỷ là can Thổ âm, nối tiếp Mậu, là nguyên khí của trời và là đất thật. Khí trong bốc lên thì hoà cùng trời đất; khí đục lắng xuống thì sinh thành vạn vật. Thiếu đất này thì ba cõi trời - đất - người không đủ — nên gọi là Âm Thổ.',
    'Giống đất vườn: nuôi dưỡng, bao dung, hay nhường nhịn.',
    'Kỷ giống đất vườn: mềm, tơi, gieo gì mọc nấy. Bao dung, hay nhường nhịn, dễ chịu thiệt nếu không giữ mình.',
  ],
  [
    '庚', 'Canh', '庚金掌天地肅殺之權', '謂之陽金',
    'Canh là can Kim dương, nắm quyền se lạnh của trời đất, chủ việc binh đao ở nhân gian. Trên trời là gió sương, dưới đất là sắt thép — nên gọi là Dương Kim.',
    'Giống sắt thô, lưỡi kiếm: quyết đoán, cần rèn mới thành tài.',
    'Canh giống thanh sắt thô: cứng, chém gọn, nhưng phải qua lửa rèn mới thành dụng cụ. Quyết định nhanh, ghét sự rườm rà.',
  ],
  [
    '辛', 'Tân', '辛金繼庚之後', '謂之陰金',
    'Tân là can Kim âm, nối tiếp Canh, đứng đầu năm loại kim và là nguyên của tám loại đá. Trên trời là trăng, là mặt trời (chữ gốc ghi 日月); dưới đất là vàng, là khoáng trong núi đá — nên gọi là Âm Kim.',
    'Giống vàng, ngọc: tinh xảo, cầu toàn.',
    'Tân giống đồ trang sức bằng vàng: đẹp, tinh, cần được nâng niu. Khéo tay, kỹ tính, ưa cái đẹp và sự gọn gàng.',
  ],
  [
    '壬', 'Nhâm', '壬水喜陽土而為堤岸之助', '謂之陽水',
    'Nhâm là can Thuỷ dương; thích Thổ dương làm bờ đê che chắn, sợ Mộc âm hút khí. Trên trời là mây, dưới đất là đầm hồ — nên gọi là Dương Thuỷ.',
    'Giống sông lớn: bao la, cần bờ mới không tràn.',
    'Nhâm giống dòng sông lớn: chảy mạnh, đi xa, chở được nhiều; nhưng không có bờ thì dễ ngập. Cần kỷ luật và định hướng.',
  ],
  [
    '癸', 'Quý', '癸水繼壬之後', '謂之陰水',
    'Quý là can Thuỷ âm, nối tiếp Nhâm, là mối cuối vòng một tuần mười can: khí âm dương thành ở chỗ tận cùng rồi lại quay về chỗ bắt đầu. Nước này trong đục chia khắp bốn phương, có công thấm xuống giúp đất và sinh dưỡng vạn vật. Trên trời là mưa móc, dưới đất là mạch suối — nên gọi là Âm Thuỷ.',
    'Giống mưa, mạch nước ngầm: lặng lẽ, thấm sâu.',
    'Quý giống mưa và suối ngầm: không ồn ào nhưng thấm vào từng chỗ, nuôi cây từ gốc. Nhạy cảm, chú ý việc nhỏ, hay lo xa.',
  ],
];

/** Thập thần — 淵海子平. `tai` dùng chung cho Chính Tài và Thiên Tài. */
const TEN_GODS = [
  [
    ['chinh-quan'], '正官者，甲见辛之类', '成其道也。',
    'Chính Quan: như Giáp gặp Tân. Âm gặp dương là quan, dương gặp âm là quỷ; âm dương phối hợp mới thành đạo.',
    'Uy tín chính danh: dễ được quý trọng.',
    'Chính Quan là uy tín chính thống: người làm ra nó thường được công nhận, ở đúng chỗ, đúng phận. Như người có chức vụ được giao thật quyền.',
  ],
  [
    ['that-sat'], '偏官者，盖甲木见庚金之类', '二男不可并处』是也。',
    'Thiên Quan (tức Thất Sát): như Giáp gặp Canh. Dương gặp dương, âm gặp âm nên gọi là thiên quan, không thành đôi lứa — như kinh nói “hai người nữ không ở chung, hai người nam không cùng chỗ”.',
    'Áp lực mạnh: khó nhọc nhưng rèn được nghị lực.',
    'Thiên Quan (Thất Sát) là áp lực mạnh, kiểu hai dương gặp nhau. Người có nó dễ gặp thử thách, va chạm; vượt qua được thì thành nghị lực.',
  ],
  [
    ['thuc-than'], '食神者，生我财神之谓也', '故谓之『食神』。',
    'Thực Thần là cái sinh ra tài của ta; như Giáp thuộc Mộc, Bính thuộc Hoả, gọi là hao khí, nên gọi là Thực Thần.',
    'Dưỡng chất nuôi tài: ăn ngon, sống đủ đầy.',
    'Thực Thần là thứ sinh ra tiền của cho mình — ví dụ tay nghề sinh ra thu nhập. Người có nó thường dễ có ăn, sung túc, tính thoải mái.',
  ],
  [
    ['thuong-quan'], '伤官者，其验如神', '其祸不可胜言。',
    'Thương Quan: nghiệm như thần. Thương Quan cốt phải thương cho hết; thương không hết, quan lại thừa vượng thì hoạ khôn kể.',
    'Tài hoa lộ ra, khó chịu khuôn phép.',
    'Thương Quan là tài lộ ra ngoài: giỏi, sắc sảo, nói thẳng, khó ngồi yên trong khuôn khổ. Tài giỏi mà lỡ đụng quyền lực thì dễ sinh chuyện.',
  ],
  [
    ['chinh-tai'], '何谓之正财？犹如正官之意', '吾妻之财也。',
    'Thế nào là Chính Tài? Cũng như nghĩa của Chính Quan: âm thấy tài dương, dương thấy tài âm. Đại để Chính Tài là của cải của vợ ta.',
    'Của cải chính đáng, gắn với vợ/chồng chính.',
    'Chính Tài là phần của cải do chính mình làm ra và giữ được, gắn với người bạn đời chính thức. Sách nói muốn hưởng được nó thì thân phải đủ khoẻ.',
  ],
  [
    ['thien-tai'], '何谓之偏财？盖阳见阳财', '祸患百出。',
    'Thế nào là Thiên Tài? Dương thấy tài dương, âm thấy tài âm. Nhưng Thiên Tài là của cải của mọi người, chỉ sợ anh chị em tranh đoạt thì phúc không toàn; nếu có quan tinh thì hoạ hoạn trăm đường.',
    'Của đến từ ngoài, bất ngờ, dễ bị chia.',
    'Thiên Tài là phần tiền không chỉ do mình làm ra: đến từ cơ hội, từ người khác, hoặc nhiều nguồn cùng lúc. Sách nói nó dễ bị anh chị em, bạn bè chia mất nên không bền bằng Chính Tài.',
  ],
  [
    ['chinh-an'], '正印者，乃生我之身也', '。',
    'Chính Ấn là cái sinh ra thân ta.',
    'Nền đỡ: người che chở, học vấn.',
    'Chính Ấn là nguồn nuôi mình: mẹ, thầy, bằng cấp, chỗ dựa. Người có nó dễ được nâng đỡ, học hành thuận.',
  ],
  [
    ['thien-an'], '倒食者，冲财神之谓也', '用食神亦忌见之。',
    'Đảo Thực (tức Thiên Ấn): gọi là xung tài thần, tên khác là “Thôn Đạm Sát”. Dùng tài thần rất kỵ thấy nó, dùng thực thần cũng kỵ thấy nó.',
    'Nghĩ nhiều, thiên về lý thuyết.',
    'Thiên Ấn (Đảo Thực) là nguồn nuôi kỳ lạ: vẫn cho mình chỗ dựa nhưng theo cách ngăn bớt cái đang nuôi mình. Người có nó hay nghĩ sâu, có khi tự làm khó mình.',
  ],
  [
    ['ty-kiep'], '比肩者，兄弟也', '寅卯亦然。',
    'Tỷ Kiên là anh em. Như Giáp thấy Giáp là anh, Ất là em; Dần Mão cũng vậy.',
    'Ngang vai: bạn bè, anh em, tự lực.',
    'Tỷ Kiên là người ngang hàng với mình: anh em, bạn bè, người cùng vai. Có nó thì mạnh phần tự lập, nhưng cũng dễ san sẻ phần của mình.',
  ],
  [
    ['kiep-tai'], '五曰同类之阴阳，曰劫财', '甲乙见甲乙是也。',
    'Thứ năm là đồng loại mà khác âm dương: gọi là Kiếp Tài, gọi là Dương Nhận; Giáp Ất thấy Giáp Ất là vậy.',
    'Cùng hành khác âm dương: như Giáp gặp Ất.',
    'Kiếp Tài là sao cùng hành với mình nhưng khác âm dương — như Giáp gặp Ất. Sách xếp nó chung nhóm với Dương Nhận và chỉ định nghĩa tới đó, không chép thêm lời luận riêng; ở đây không thêm.',
  ],
];

const queries = readFileSync(QUOTES, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const quotes = queries;

const byText = new Map(quotes.map((q) => [q.text_zh, q]));
const nextId = () => {
  const n = Math.max(0, ...quotes.map((q) => Number(q.id.slice(5)))) + 1;
  return `q_bz_${String(n).padStart(4, '0')}`;
};
/**
 * Cùng nguyên văn có thể xuất hiện hai lần: bản rút gọn dùng để kiểm tra và bản đầy đủ
 * của tầng luận giải. Chỉ nâng cấp bản đầy đủ (nguyên văn dài hơn 20 chữ); bản rút gọn giữ nguyên.
 */
const isGenerated = (q) =>
  (q.source === 'sanming-tonghui' || q.source === 'yuanhai-ziping') &&
  [...q.text_zh].length >= 20;

/**
 * Tra bản đã có theo nguyên văn. Với câu ngắn (dưới 20 chữ) chỉ chấp nhận bản rút gọn,
 * để không bao giờ nâng cấp nhầm bản kiểm tra.
 */
const findGenerated = (text_zh) => {
  const long = [...text_zh].length >= 20;
  return quotes.find((q) => q.text_zh === text_zh && (long ? isGenerated(q) : !isGenerated(q)));
};

/**
 * Ghi một câu theo nguyên văn: có rồi thì cập nhật bản dịch, chưa có thì thêm.
 * Trả về id cuối cùng.
 */
const upsert = (source, text_zh, claim_vi, locator, short_vi, plain_vi) => {
  const existing = findGenerated(text_zh);
  if (existing) {
    if (existing.source !== source) throw new Error(`${existing.id}: nguồn không khớp`);
    Object.assign(existing, { claim_vi, short_vi, plain_vi });
    return { id: existing.id, added: false };
  }
  const quote = { id: nextId(), source, text_zh, claim_vi, locator, short_vi, plain_vi };
  quotes.push(quote);
  byText.set(text_zh, quote);
  return { id: quote.id, added: true };
};

let added = 0;

const dayEntries = [];
for (const [index, [zh, vi, anchor, until, claim, short, plain]] of DAY_MASTERS.entries()) {
  const hit = pick(san, anchor, until);
  const res = upsert('sanming-tonghui', hit.text, claim, segOf(SAN, hit.at), short, plain);
  if (res.added) added++;
  dayEntries.push({ stem: index, zh, vi, quote_id: res.id, short_vi: short });
}

writeFileSync(
  'content/day-masters.json',
  JSON.stringify(
    {
      version: 2,
      $comment:
        'Mười thiên can — bản tính nhật chủ. Nguyên văn 三命通會 卷02 (論天干隂陽生死), ' +
        'sinh bằng scripts/gen-bazi-content.mjs. claim_vi là bản dịch đầy đủ; `short_vi` là một dòng; ' +
        '`plain_vi` trong quotes.jsonl là bản giảng không dùng thuật ngữ.',
      source: 'sanming-tonghui',
      locator: '卷02',
      entries: dayEntries,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

const godEntries = [];
for (const [ids, anchor, until, claim, short, plain] of TEN_GODS) {
  const hit = pick(yuan, anchor, until);
  const res = upsert('yuanhai-ziping', hit.text, claim, segOf(YUAN, hit.at), short, plain);
  if (res.added) added++;
  for (const id of ids) godEntries.push({ id, quote_id: res.id, short_vi: short });
}

const godCovered = new Set(godEntries.map((e) => e.id));
const godMissing = Object.keys(TEN_GOD_DEFS).filter((id) => !godCovered.has(id));

writeFileSync(
  'content/ten-gods.json',
  JSON.stringify(
    {
      version: 2,
      $comment:
        'Định nghĩa thập thần, nguyên văn 淵海子平, sinh bằng scripts/gen-bazi-content.mjs. ' +
        'Thần nào kho văn bản không có định nghĩa riêng thì ghi ở "missing", giao diện không lấp bằng suy diễn.',
      source: 'yuanhai-ziping',
      entries: godEntries,
      missing: godMissing,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

writeFileSync(QUOTES, quotes.map((q) => JSON.stringify(q)).join('\n') + '\n', 'utf8');

const ids = quotes.map((q) => q.id);
if (new Set(ids).size !== ids.length) throw new Error('quotes.jsonl bị trùng id');
const targets = [...dayEntries, ...godEntries].map((e) => e.quote_id);
const missing = targets.filter((id) => !quotes.find((q) => q.id === id && q.plain_vi));
if (missing.length) throw new Error(`thiếu bản giảng cho: ${[...new Set(missing)].join(', ')}`);

console.log(`day-masters.json: ${dayEntries.length} can`);
console.log(`ten-gods.json: ${godEntries.length} thần`);
console.log(`câu thêm mới: ${added} · tổng: ${quotes.length}`);
