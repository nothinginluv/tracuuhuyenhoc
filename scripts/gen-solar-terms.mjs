// Sinh data/solar-terms.json: thời điểm UTC của 24 tiết khí, 1899–2101.
// lunar-javascript tính tiết khí theo giờ Bắc Kinh (UTC+8) → trừ 8 giờ để ra instant UTC.
import { writeFileSync } from 'node:fs';
import { Solar } from 'lunar-javascript';

const FROM = 1899;
const TO = 2101;

// Thứ tự chuẩn, bắt đầu từ 小寒 (tiết đầu năm dương lịch).
const ORDER = [
  ['xiaohan', '小寒'], ['dahan', '大寒'],
  ['lichun', '立春'], ['yushui', '雨水'],
  ['jingzhe', '惊蛰'], ['chunfen', '春分'],
  ['qingming', '清明'], ['guyu', '谷雨'],
  ['lixia', '立夏'], ['xiaoman', '小满'],
  ['mangzhong', '芒种'], ['xiazhi', '夏至'],
  ['xiaoshu', '小暑'], ['dashu', '大暑'],
  ['liqiu', '立秋'], ['chushu', '处暑'],
  ['bailu', '白露'], ['qiufen', '秋分'],
  ['hanlu', '寒露'], ['shuangjiang', '霜降'],
  ['lidong', '立冬'], ['xiaoxue', '小雪'],
  ['daxue', '大雪'], ['dongzhi', '冬至'],
];

// Mỗi tháng dương lịch có đúng 2 tiết, tiết đầu rơi vào nửa đầu tháng.
// Dùng ngày để xác định tiết — không tin vào key của lunar-javascript
// (key chuyển sang pinyin ở các tiết thuộc năm kề).
const PAIRS = [
  ['xiaohan', 'dahan'], ['lichun', 'yushui'], ['jingzhe', 'chunfen'],
  ['qingming', 'guyu'], ['lixia', 'xiaoman'], ['mangzhong', 'xiazhi'],
  ['xiaoshu', 'dashu'], ['liqiu', 'chushu'], ['bailu', 'qiufen'],
  ['hanlu', 'shuangjiang'], ['lidong', 'xiaoxue'], ['daxue', 'dongzhi'],
];
const termKeyOf = (month, day) => PAIRS[month - 1][day < 15 ? 0 : 1];

const BJT_OFFSET_MS = 8 * 3600 * 1000;
const years = {};
const problems = [];

for (let y = FROM; y <= TO; y++) {
  const lunar = Solar.fromYmd(y, 7, 1).getLunar();
  const table = lunar.getJieQiTable();

  const byKey = new Map();
  for (const sol of Object.values(table)) {
    if (sol.getYear() !== y) continue; // chỉ lấy tiết trong năm dương lịch y
    const ascii = termKeyOf(sol.getMonth(), sol.getDay());
    const epoch =
      Date.UTC(
        sol.getYear(),
        sol.getMonth() - 1,
        sol.getDay(),
        sol.getHour(),
        sol.getMinute(),
        sol.getSecond(),
      ) - BJT_OFFSET_MS;
    const prev = byKey.get(ascii);
    if (prev != null && prev !== epoch) problems.push(`${y}: tiết ${ascii} xuất hiện hai lần`);
    byKey.set(ascii, epoch);
  }

  if (byKey.size !== 24) {
    problems.push(`${y}: chỉ có ${byKey.size}/24 tiết`);
    continue;
  }

  // Bảo đảm đúng thứ tự thời gian.
  const arr = ORDER.map(([k]) => byKey.get(k));
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= arr[i - 1]) problems.push(`${y}: thứ tự tiết khí sai tại ${ORDER[i][0]}`);
  }
  years[String(y)] = arr;
}

if (problems.length) {
  console.error('Vấn đề:', problems.slice(0, 10).join('; '));
  process.exit(1);
}

// Kiểm chứng mốc đã biết: Lập Xuân 2024 = 2024-02-04 08:27:07Z.
const lichun2024 = years['2024'][ORDER.findIndex(([k]) => k === 'lichun')];
const iso = new Date(lichun2024).toISOString();
if (iso !== '2024-02-04T08:27:07.000Z') {
  console.error('Mốc kiểm chứng sai: Lập Xuân 2024 =', iso, '(mong đợi 2024-02-04T08:27:07.000Z)');
  process.exit(1);
}

writeFileSync(
  'packages/calendar-core/data/solar-terms.json',
  JSON.stringify(
    {
      $comment:
        'Thời điểm UTC (epoch ms) của 24 tiết khí. Nguồn: lunar-javascript (许剑伟 寿星天文历), quy đổi từ giờ Bắc Kinh. Không dùng bảng giờ Bắc Kinh trực tiếp để so sánh.',
      version: 1,
      from: FROM,
      to: TO,
      order: ORDER.map(([k, zh]) => ({ key: k, zh })),
      years,
    },
    null,
    0,
  ) + '\n',
  'utf8',
);

console.log(`tiết khí: ${Object.keys(years).length} năm × 24 = ${Object.keys(years).length * 24}`);
console.log('Lập Xuân 2024:', iso);
