// Một lần: sinh quotes.jsonl mẫu từ corpus, tự xác định quyển chứa câu trích.
import { readFileSync, writeFileSync } from 'node:fs';

const cands = [
  {
    id: 'q_tv_0001',
    source: 'ziwei-quanshu',
    text_zh: '紫微屬土，乃中天之尊星為帝座，主掌造化樞機，人生主宰。',
    claim_vi:
      'Tử Vi thuộc Thổ, là sao tôn quý giữa trời, giữ ngôi Đế Tọa, chủ việc tạo hoá và chủ mệnh con người.',
  },
  {
    id: 'q_tv_0002',
    source: 'ziwei-quanshu',
    text_zh: '斗數至玄至微，理旨難明，雖設問於百篇之中，猶有言而未盡',
    claim_vi: 'Mở đầu Thái Vi phú: Đẩu Số cực kỳ huyền vi, lý lẽ khó sáng tỏ.',
  },
  {
    id: 'q_tv_0003',
    source: 'ziwei-quanshu',
    text_zh: '天府屬土，南斗主令第一星也。為財帛之主宰',
    claim_vi: 'Thiên Phủ thuộc Thổ, là sao thứ nhất của Nam Đẩu, chủ về tài bạch.',
  },
  {
    id: 'q_bz_0001',
    source: 'sanming-tonghui',
    text_zh: '甲木乃十干之首主宰四時生育萬物',
    claim_vi: 'Giáp Mộc đứng đầu thập can, chủ tể bốn mùa, sinh dưỡng vạn vật.',
  },
  {
    id: 'q_bz_0002',
    source: 'yuanhai-ziping',
    text_zh: '子宫癸水在其中，丑癸辛金己土同',
    claim_vi: 'Địa chi tàng can: Tý tàng Quý Thuỷ; Sửu tàng Quý, Tân, Kỷ.',
  },
  {
    id: 'q_bz_0003',
    source: 'yuanhai-ziping',
    text_zh: '金旺得火，方成器皿',
    claim_vi: 'Kim vượng gặp Hoả mới thành đồ dùng — nguyên lý chế hoá ngũ hành.',
  },
];

const segs = {};
for (const k of new Set(cands.map((c) => c.source))) {
  segs[k] = JSON.parse(readFileSync(`corpus/${k}.segments.json`, 'utf8')).segments;
}

const out = [];
for (const c of cands) {
  const text = readFileSync(`corpus/${c.source}.txt`, 'utf8');
  const idx = text.indexOf(c.text_zh);
  if (idx === -1) {
    console.error('FAIL not found:', c.id, c.text_zh);
    process.exit(1);
  }
  const seg = segs[c.source].find((s) => idx >= s.start && idx < s.end);
  out.push({ ...c, locator: seg ? seg.locator : '全篇' });
  console.log('ok', c.id, '->', seg?.locator ?? '?');
}

writeFileSync(
  'content/quotes.jsonl',
  out.map((o) => JSON.stringify(o)).join('\n') + '\n',
  'utf8',
);
console.log('wrote content/quotes.jsonl:', out.length, 'quotes');
