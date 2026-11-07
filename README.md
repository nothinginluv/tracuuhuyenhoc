# tracuuhuyenhoc

Tra cứu **Tử Vi Đẩu Số** và **Bát Tự / Tứ Trụ** — công cụ tính toán minh bạch, mọi kết luận có dẫn nguồn, mọi quy ước được công khai.

> Nguyên tắc: **không tuyên bố "đúng"**, chỉ trình bày *"phái A nói X (nguồn), phái B nói Y (nguồn)"* — và cho người dùng thấy **vì sao** một lá số ra khác app khác.

## Trạng thái

Đã xong **lõi lịch**, **engine an sao Tử Vi**, **engine Bát Tự**, **nội dung Tầng B** và **web app** — chạy được, có test, có đối chứng với thư viện độc lập. Còn thiếu bước đẩy lên GitHub/Vercel (cần tài khoản).

| Hạng mục | Trạng thái |
|---|---|
| Corpus Tầng A (3 bộ văn bản cổ) | ✅ pin sha256 |
| Cổng kiểm trích dẫn | ✅ 3 tầng + self-test âm · **91 câu** |
| Bảng tiết khí 1899–2101 | ✅ 4.872 instant UTC |
| Bảng tháng âm lịch 1899–2102 | ✅ 2.523 tháng, khớp chuẩn TQ 100% |
| 63 tỉnh pre-2025 + múi giờ lịch sử | ✅ |
| `calendar-core`: instant → tứ trụ | ✅ 74 test |
| Engine an sao Tử Vi (`tuvi-engine`) | ✅ 39 test · khớp `iztro` 880 lá số |
| Engine Bát Tự (`bazi-engine`) | ✅ 30 test · khớp `lunar-javascript` |
| Nội dung Tầng B (30 sao · 4 hoá · 12 cung) | ✅ 82 câu · 97 khoá đối chiếu nguyên văn |
| Web app (`apps/web`) | ✅ React 19 + Vite · kiểm nhập liệu có test · ErrorBoundary · a11y |
| CI + deploy | ✅ GitHub Actions · `vercel.json` headers/CSP · OG/SEO |

## Chạy thử

```bash
npm install
npm run dev         # web app tại http://localhost:5173
npm run build       # build tĩnh ra dist/web
npm run preview     # xem bản build

npm run demo        # 6 ca lịch: Hà Nội 1990, Sài Gòn 1972, Quảng Trị 1970…
npm run demo:tuvi   # 3 lá số Tử Vi đầy đủ 12 cung
npm run demo:bazi   # 3 lá Bát Tự: tàng can, thập thần, đại vận
npm test            # 157 test (calendar-core + tuvi-engine + bazi-engine + web)
npm run typecheck   # tsc --noEmit, strict
npm run quotes:verify   # mọi câu Hán phải là chuỗi con thật của corpus đã pin
npm run content:verify  # mọi câu/cụm từ của Tầng B phải khớp câu trích
npm run content:selftest # chứng minh cổng Tầng B chặn được dữ liệu sai
npm run check       # typecheck + quotes + content + selftest + test
```

## Web app

`apps/web` là giao diện duy nhất — **không tự tính gì**, mọi con số đều đi qua `engine.ts` → ba gói lõi.

- **Form**: ngày/tháng/năm dạng `dd/mm/yyyy` (không phụ thuộc định dạng locale của trình duyệt), giờ 24h, 63 tỉnh pre-2025, giới tính.
- **Quảng Trị 1960–1975**: hiện thêm ô chọn huyện, vì hai bờ vĩ tuyến 17 khác múi giờ (+7 vs +8).
- **Tuỳ chỉnh quy ước**: preset, ranh giới Tý (sớm/muộn), can giờ 23:00–23:59, quy tắc tháng nhuận — tất cả ghi vào URL để chia sẻ đúng lá số đang xem.
- **Kết quả**: chip tóm tắt (giờ, âm lịch TQ, tứ trụ, preset), danh sách cảnh báo, ba tab **Tử Vi · Bát Tự · Cách tính**.
- **Hai lá Tử Vi**: khi lịch TQ (+8) và lịch VN (+7) cho hai ngày âm khác nhau, thanh chọn cho phép xem lá chính (TQ) và lá đối chiếu (VN) — đây thường là lý do app Việt và app TQ ra khác.
- **Trang Phương pháp**: chuỗi tính, bảng preset, quy tắc Tử Vi/Bát Tự, giới hạn, nguồn + trích dẫn mở được tại chỗ.
- **Trang Tinh diệu**: 14 chính tinh + 16 phụ tinh + 4 Tứ Hoá + 12 cung, mỗi mục mở được nguyên văn và nguồn.
- **Nhập liệu có test**: `parseForm` tách riêng khỏi component, 14 test cho biên ngày/giờ, năm 1900, tương lai và Quảng Trị.
- **A11y**: `role="status" aria-live="polite"` thông báo khi lập lá số; focus chuyển tới `#ket-qua` sau khi kết quả vào DOM.
- **ErrorBoundary**: lỗi render hiện thông báo + nút tải lại, không để màn hình trắng.

Cấu trúc:

```
apps/web/
  index.html
  src/        main.tsx · App.tsx · engine.ts · form.ts · format.ts · quotes.tsx · stars.ts · styles.css
  src/components/
              BirthForm · TuViChartView · BaziView · CalcTrace · MethodPage · StarReference · ErrorBoundary
  test/       form.test.ts (14 test)
  public/     favicon.svg · og.svg · og.png · robots.txt · sitemap.xml
```

Thiết kế lấy từ `docs/mock-cach-tinh.html`: giấy ấm, chữ serif, số mono, không font ngoài, không tracking.

### Giới hạn của bản web

- Chỉ **Tử Vi + Bát Tự**, chưa có tầng luận giải vận mệnh — chỉ an sao, tàng can, thập thần, đại vận.
- Năm sinh **1900–nay**. Sinh trước Tết 1900 vẫn xem được Bát Tự nhưng không an được Tử Vi (năm âm < 1900).
- Toạ độ lấy theo **tỉnh lỵ**, sai số ~4 phút mỗi độ kinh tuyến khi dùng giờ mặt trời thật.
- Không hỗ trợ Việt kiều / nơi sinh ngoài Việt Nam trong bản này.

## calendar-core

Biến giờ đồng hồ người dùng nhập thành một lá số, và nói rõ nó đã diễn giải gì.

```ts
import { buildChartContext } from './packages/calendar-core/src/index.ts';

const c = buildChartContext(
  { year: 1972, month: 2, day: 4, hour: 23, minute: 30, province: 'Hà Nội' },
  'chuan-tq',
);

c.utcIso;          // "1972-02-04T16:30:00.000Z"
c.tz.offsetHours;  // 7  (miền Bắc 1960–1975)
c.clock.wall;      // { year: 1972, month: 2, day: 5, hour: 0, minute: 30 } — giờ Bắc Kinh
c.lunar.cn;        // 21/12  ← lịch TQ
c.lunar.vn;        // 20/12  ← lịch VN, lệch
c.pillars.day.vi;  // "Bính Dần"
c.warnings;        // mảng cảnh báo tiếng Việt
```

### Chuỗi tính

```
BirthInput (giờ đồng hồ nơi sinh)
  → toạ độ + miền  (63 tỉnh; Quảng Trị 1960–1975 phải hỏi huyện)
  → múi giờ lịch sử, giải 2 lượt (offset phụ thuộc instant, instant phụ thuộc offset)
  → instant UTC
  → đồng hồ quy ước: Bắc Kinh (+8) | nơi sinh | mặt trời thật
  → tứ trụ (năm/tháng theo instant tiết khí; ngày/giờ theo đồng hồ đã quy ước)
  → âm lịch TQ (+8) và VN (+7)
  → cảnh báo
```

### Vì sao không dùng thư viện có sẵn

| Vấn đề | Cách xử lý |
|---|---|
| `Intl` / tzdata chỉ có `Asia/Ho_Chi_Minh` mô hình **miền Nam** (+8 tới 1975) | bảng múi giờ tự viết, tách Bắc/Nam |
| So giờ Việt Nam với bảng tiết khí giờ Bắc Kinh → lệch 1 giờ | tiết khí lưu dạng **instant UTC**, so sánh trực tiếp |
| Công thức âm lịch Hồ Ngọc Đức sai tới hàng chục phút | ngày tháng lấy từ bảng chuẩn TQ; thiên văn chỉ dùng để tách múi giờ |
| Thư viện chia tiết khí **theo ngày**, không theo giờ | tự tính, giữ nguyên instant |

### Ba khác biệt đã biết với `lunar-javascript`

Đây không phải bug — là quy ước, và có test riêng cho từng cái:

1. **Tiết khí theo instant.** 04/02/2024 10:00 giờ Bắc Kinh: thư viện đã sang `丙寅`, ta vẫn ở `乙丑` vì Lập Xuân là 16:27.
2. **Can giờ 23:00–23:59.** Mặc định lấy can **ngày hiện tại** (`甲子`); thư viện lấy can **ngày kế tiếp** (`丙子`). Đổi bằng `hourStemRule: 'next-day'` hoặc preset `lunar-js`.
3. **Múi giờ.** Thư viện luôn là UTC+8; ta phân biệt lịch TQ (+8) và lịch VN (+7).

Ngoài ba điểm đó, kết quả khớp: âm lịch **0 lệch / 12.060 ngày** (1900–2100), trụ ngày và trụ giờ khớp trên toàn dải ngoài khung 23:00–23:59.

### Cảnh báo tự sinh

`calendar-divergence` · `zi-boundary` · `zi-day-shift` · `jie-proximity` · `tz-boundary` · `coords-approximate` · `historical-tz-note` · `leap-month`

## tuvi-engine

An sao Tử Vi từ lịch âm Trung Quốc. Đầu vào là ngày âm + chi giờ; thường lấy từ `calendar-core`:

```ts
import { buildChartContext } from './packages/calendar-core/src/index.ts';
import { buildTuViChart, tuViBirthFromContext } from './packages/tuvi-engine/src/index.ts';

const ctx = buildChartContext(
  { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: 'Hà Nội' },
  'chuan-tq',
);
const chart = buildTuViChart(tuViBirthFromContext(ctx));

chart.soul;         // { branch: 9, zh: '乙酉', … }   ← cung Mệnh
chart.bureau;       // { number: 2, zh: '水二局' }
chart.palaces[9];   // { nameZh: '命宮', mainStars: [...], auxStars: [...] }
chart.mutagens;     // 4 sao hoá, mỗi cái kèm cung
```

Hiện an **14 chính tinh + 24 phụ tinh + 12 cung + Ngũ Hành Cục + Tứ Hoá Nam phái + sao chủ Mệnh/Thân**. Chưa có tầng luận giải — phần đó thuộc nội dung, mỗi câu phải qua cổng trích dẫn.

### Đối chứng

So từng cung với `iztro` trên **880 lá số** (1930–2020, nhiều tháng/ngày/giờ): **0 lệch** về Ngũ Hành Cục, cung Mệnh, cung Thân, 14 chính tinh, 24 phụ tinh, sao chủ Mệnh, sao chủ Thân.

Hai khác biệt **có chủ ý**, đều có test riêng:

1. **封誥** — ta theo 口诀 *寅起子逆數*, `iztro` chạy *順*. Test `封誥 theo 口诀 寅起子逆數` khoá hành vi của ta.
2. **Tý muộn** — 23:00–23:59, `iztro` tăng ngày âm lịch (đổi cả sao Tử Vi), ta giữ ngày hiện tại theo preset `chuan-tq`.

### Quy ước là tham số, không giấu trong code

```ts
buildTuViChart(birth, {
  leapMonthRule: 'split',   // 'split' | 'as-month' | 'as-next'
  mutagenTable: 'nam-phai', // bảng tứ hoá tách khỏi thuật toán
  soulStarBasis: 'soul-palace', // hoặc 'year-branch'
});
```

Tháng nhuận mặc định `split` (ngày 1–15 tính tháng nhuận, 16–30 sang tháng sau) — giống `iztro` `fixLeap: true` và phần mềm TQ thông dụng. Đổi quy tắc thì lá số đổi, và `chart.notes` nói rõ đã đổi vì đâu.

## bazi-engine

Từ tứ trụ của `calendar-core`, suy ra tàng can, thập thần, khởi vận và đại vận.

```ts
import { buildChartContext } from './packages/calendar-core/src/index.ts';
import { buildBaziChart } from './packages/bazi-engine/src/index.ts';

const ctx = buildChartContext(
  { year: 1990, month: 5, day: 15, hour: 14, minute: 30, province: 'Hà Nội' },
  'chuan-tq',
);
const bazi = buildBaziChart(ctx, { gender: 'nam' });

bazi.dayMaster;         // { zh: '庚', element: 'kim', … }
bazi.stems[0].tenGod;   // Tỷ Kiên
bazi.branches[2].hidden;// 辰 → 戊(Thiên Ấn) 乙(Chính Tài) 癸(Thương Quan)
bazi.elementCounts;     // { moc: 1, hoa: 2, tho: 1, kim: 4, thuy: 0 }
bazi.qiYun.startAge;    // { years: 7, months: 2, days: 16 }
bazi.luck[0].pillar;    // 壬午
```

Mỗi nhóm công thức đều khai báo `quote_id`:

| Phần | Trích dẫn | Câu gốc |
|---|---|---|
| Nhật chủ | `q_bz_0008` | 取日干为主，以年为根，以月为苗，以日为花，以时为果 |
| Tàng can | `q_bz_0004` | 地支藏遁歌 đầy đủ 12 chi |
| Thập thần | `q_bz_0005` | 一曰官…五曰同类之阴阳… |
| Chiều đại vận | `q_bz_0006` | 陽男陰女從生月順行，陰男陽女從生月逆行 |
| Khởi vận | `q_bz_0007` | 一辰十載…三日為年 |

### Đối chứng

So với `lunar-javascript` trên vài trăm lá (1950–2020, cả nam/nữ): khớp **tứ trụ, thập thần can, thập thần tàng can, chiều đại vận và 5 trụ đại vận đầu**. Tuổi khởi vận chỉ lệch ≤ 20 "ngày ảo" (1 ngày ảo = 12 phút thực) do hai bên làm tròn khác nhau.

### Quy ước công khai

- **Tuổi khởi vận** trả dạng số năm kể từ lúc sinh, **không phải 虚歲** — nơi hiển thị tự quyết định.
- **Đại vận** đi từ trụ tháng: thuận tiến, nghịch lùi; vận đầu **không** phải trụ tháng.
- **Thứ tự tàng can** là 本氣 → 中氣 → 餘氣 (bản khí đứng đầu). Riêng chi 巳 có sách xếp 丙戊庚, sách khác 丙庚戊; bảng đang dùng 丙庚戊.
- **Khởi vận** theo 3 ngày = 1 năm, 1 ngày = 4 tháng, 1 giờ = 5 ngày. Phái đếm ngày tròn sẽ ra số khác.

## Corpus và trích dẫn

| key | Văn bản | Quyển | Dùng cho |
|---|---|---|---|
| `ziwei-quanshu` | 紫微斗數全書 | 3 | Tử Vi |
| `sanming-tonghui` | 三命通會 (四庫全書本) | 12 | Bát Tự |
| `yuanhai-ziping` | 淵海子平 | 1 | Bát Tự |

Nguồn: Wikisource. Không scrape `ctext.org` (điều khoản cấm tải tự động). `corpus/corpus.lock.json` giữ **sha256 + URL + thời điểm tải**; sửa lén corpus làm cổng kiểm fail.

### Quy trình quote-first

1. Chọn câu từ corpus, trích **nguyên văn chữ Hán**.
2. Ghi vào `content/quotes.jsonl` kèm `source` + `locator`.
3. `npm run quotes:verify` khẳng định câu đó là **chuỗi con thật** và **nằm đúng quyển**.
4. Chỉ khi qua cổng kiểm mới được viết bài tham chiếu `quote_id`.

| Tầng | Nghĩa | Hành động |
|---|---|---|
| exact | Khớp sau khi bỏ khoảng trắng + dấu câu | Pass |
| variant | Chỉ khớp sau khi quy dị thể (OpenCC) | **Cần người duyệt** |
| not found | Không khớp | **Chặn build** |

`npm run quotes:selftest` chứng minh cổng **chặn được** dữ liệu sai (4 ca, 4 lớp khác nhau). Nếu nó pass mà cổng không chặn gì, toàn bộ cơ chế "có nguồn" là vô nghĩa.

## Nội dung Tầng B — tinh diệu

Ba tệp nội dung, cùng một luật: mỗi câu, mỗi từ khoá đều phải rút từ trích dẫn đã kiểm.

| Tệp | Nội dung | Số mục |
|---|---|---|
| `content/stars.json` | 14 chính tinh + 16 phụ tinh, cắt từ 諸星問答論 (卷一) và bảng 分屬五行 (卷二) | 30 |
| `content/hua.json` | Tứ Hoá Lộc · Quyền · Khoa · Kỵ | 4 |
| `content/palaces.json` | 12 cung: thứ tự, cường nhược nam/nữ, phạm vi từng cung | 12 |

Mỗi mục trong `stars.json` gồm:

```json
{
  "id": "wuqu",
  "elements": [{ "zh": "金", "vi": "Kim" }],
  "dou":      { "zh": "北斗", "vi": "Bắc Đẩu" },
  "domains":  [{ "zh": "財帛宮", "vi": "Tài Bạch" }],
  "quotes":   [
    { "quote_id": "q_tv_0009", "role": "definition" },
    { "quote_id": "q_tv_0010", "role": "reading" }
  ]
}
```

Hai lớp kiểm, chạy trong `npm run check`:

1. **`quotes:verify`** — câu Hán trong `content/quotes.jsonl` phải là chuỗi con thật của corpus đã pin sha256, đúng quyển. Hiện **91/91 câu khớp chính xác**.
2. **`content:verify`** — mọi `quote_id` phải tồn tại; và **mỗi từ khoá hiển thị** (ngũ hành, đẩu, cung chủ, vai trò) phải xuất hiện nguyên văn trong chính các câu trích của mục đó. Bỏ câu trích thì chip biến mất theo, không thể "viết thêm cho đẹp".

Hiện trạng: **30 sao · 4 hoá · 12 cung · 82 câu trích được dùng · 97 khoá đối chiếu**.

`npm run content:selftest` chạy cùng cổng trên một fixture cố tình sai (quote không tồn tại, ngũ hành không có trong câu trích, id sao lạ) và đòi cổng phải chặn — hiện chặn đúng **16 lỗi** — để chứng minh cổng không phải đồ trang trí.

Trang **Tinh diệu** trên web đọc thẳng `content/*.json`, hiển thị bản dịch + mở được nguyên văn kèm nguồn. Đây là định nghĩa **cơ học**, không phải lời luận giải đầy đủ — muốn luận còn phải xét cung vị, tam phương tứ chính, miếu vượng hãm và tổ hợp sao.

Nguyên tắc khi corpus không có câu:

- Phụ tinh chưa có câu định nghĩa **không được bịa** — để trống kèm ghi chú.
- Cung không có câu định nghĩa chung hiển thị `note_vi` nói rõ "corpus luận theo từng sao, chưa có câu chung".
- Bảng cường nhược mệnh nữ hiển thị **nguyên văn** (dùng 夫君/子息), không tự ánh xạ sang 12 id cung.

## Dữ liệu dựng sẵn

| File | Nội dung | Nguồn |
|---|---|---|
| `data/solar-terms.json` | 4.872 instant UTC của 24 tiết khí | lunar-javascript (寿星天文历) |
| `data/lunar-months.json` | 2.523 ngày mùng 1 âm lịch + instant điểm sóc | ngày: 寿星天文历 · instant: Meeus ch.49 |
| `data/provinces_pre2025.json` | 63 tỉnh, tỉnh lỵ, toạ độ, miền 1960–1975 | tỉnh lỵ + đối chiếu Wikidata P625 |

Dựng lại: `npm run data:terms` · `npm run data:lunar` · `npm run data:provinces`.

## Quyết định đã chốt

| Hạng mục | Giá trị |
|---|---|
| Chuẩn lịch | Lịch âm **Trung Quốc** cho an sao; tiết khí so theo **instant UTC** |
| Giờ Tý | **Tý muộn** (đổi ngày 00:00), can giờ từ **can ngày hiện tại** |
| Phái Tử Vi | **Tam Hợp** mặc định; Trung Châu là data pack |
| Đơn vị hành chính | **63 tỉnh** pre-2025 làm input; 34 chỉ hiển thị |
| Năm sinh | 1900 – nay |
| Tỉnh bị chia | Hỏi **cấp huyện** (Quảng Trị 1960–1975) |
| Múi giờ lịch sử | Bảng tự viết — **không dùng `Intl`** |
| Hosting | Vercel, tính toán client-side, không DB |

## Cấu trúc

```
apps/web/
  index.html
  src/        main.tsx · App.tsx · engine.ts · form.ts · format.ts · quotes.tsx · stars.ts · styles.css
  src/components/
              BirthForm · TuViChartView · BaziView · CalcTrace · MethodPage · StarReference · ErrorBoundary
  test/       14 test (node:test) cho parseForm
  public/     favicon.svg · og.svg · og.png · robots.txt · sitemap.xml
.github/workflows/ci.yml
docs/         mock giao diện (mock-cach-tinh.html)
packages/calendar-core/
  src/        jdn · new-moon · lunar · solar-terms · vn-tz-history · true-solar · provinces · convention · context
  data/       solar-terms.json · lunar-months.json · provinces_pre2025.json
  test/       74 test (node:test)
  examples/   demo.ts
packages/tuvi-engine/
  src/        constants · bureau · palaces · main-stars · aux-stars · mutagen · chart
  test/       39 test (gồm đối chứng iztro 880 lá số)
  examples/   demo.ts
packages/bazi-engine/
  src/        constants · hidden-stems · ten-gods · luck · chart
  test/       30 test (gồm đối chứng lunar-javascript)
  examples/   demo.ts
corpus/       văn bản gốc đã làm sạch + lock hash + segments
content/      sources.json (sổ nguồn) · quotes.jsonl (91 câu) · stars.json · hua.json · palaces.json
scripts/      fetch-corpus · verify-quotes · verify-content · seed-quotes · gen-solar-terms · gen-lunar-months · gen-provinces
tests/        fixtures âm cho self-test
docs/         mock giao diện
```

## Triển khai

Đích: `tracuuhuyenhoc.vercel.app` — client-side hoàn toàn, không DB, không API.

Đã có sẵn:

- `vercel.json`: build `npm run build`, output `dist/web`, rewrite SPA.
- Header bảo mật: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, HSTS, COOP.
- Cache asset có hash 1 năm; `og.png` cache 1 ngày.
- SEO: canonical, OG/Twitter, `robots.txt`, `sitemap.xml`, `favicon.svg`, `og.png` 1200×630.
- `.github/workflows/ci.yml`: Node 24, `npm ci` → `npm run check` → `npm run build` trên mọi push/PR.

Các bước còn lại (cần tài khoản GitHub/Vercel):

```bash
git init && git add -A && git commit -m "tracuuhuyenhoc: lõi lịch, engine Tử Vi/Bát Tự, web minh bạch"
git remote add origin git@github.com:<user>/tracuuhuyenhoc.git
git push -u origin main
# Vercel: import repo, framework Vite, output dist/web
```

Sau khi deploy: kiểm header bằng `curl -I`, mở `/og.png`, chạy `npm run check` trong CI.

## Tiếp theo

1. Mở rộng Tầng B: luật sao-theo-cung (12 cung), tam phương tứ chính, 廟旺陷, 大限/流年/小限 — vẫn theo luật mỗi câu một `quote_id`.
2. Bát Tự: 旺衰, 用神, 神煞 — cần thêm corpus Tier-A tương ứng trước khi viết.
3. Code-split bundle (hiện ~569 KB minified / ~173 KB gzip; tách bảng lịch và engine).
4. E2E Playwright cho luồng nhập → kết quả → chia sẻ URL.
5. `git init` → commit → push GitHub → nối Vercel (xem mục Triển khai).
