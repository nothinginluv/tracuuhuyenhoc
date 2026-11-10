#!/usr/bin/env node
/**
 * Thêm bản giảng dễ hiểu (`short_vi`, `plain_vi`) cho các câu trích đã có bản sát chữ
 * nhưng chưa có bản cho người mới.
 *
 * Nguyên tắc: `plain_vi` chỉ diễn giải đúng nội dung `claim_vi` — không thêm nhận định,
 * không thêm lời khuyên, không đổi nghĩa. Câu nào nguồn không chép thì vẫn để trống.
 *
 * Chạy: node scripts/add-plain-quotes.mjs
 * Idempotent: câu nào đã có `plain_vi` thì bỏ qua (trừ khi --force để ghi đè theo bảng dưới).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const QUOTES = 'content/quotes.jsonl';
const force = process.argv.includes('--force');

const quotes = readFileSync(QUOTES, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l));

/**
 * Mỗi mục: id → { short, plain }.
 * `short` = một dòng tóm ý; `plain` = lời giảng không thuật ngữ, chỉ nói lại điều câu Hán nói.
 */
const PATCH = {
  // ── Bát Tự: tàng can, thập thần, khởi vận ──────────────────
  q_bz_0001: {
    short: 'Giáp là Mộc dương, đứng đầu mười can, chủ bốn mùa sinh dưỡng vạn vật.',
    plain:
      'Giáp Mộc đứng đầu mười can, chủ tể bốn mùa và sinh dưỡng vạn vật. Trên trời là sấm, là rồng; dưới đất là xà nhà, là cột — nên gọi là Dương Mộc.',
  },
  q_bz_0002: {
    short: 'Tý tàng Quý; Sửu tàng Quý, Tân, Kỷ.',
    plain:
      'Hai chi đầu tiên: Tý giấu can Quý Thuỷ; Sửu giấu ba can Quý Thuỷ, Tân Kim và Kỷ Thổ. Đó là phần "khí bên trong" của hai chi này.',
  },
  q_bz_0003: {
    short: 'Kim vượng gặp Hoả mới thành đồ dùng.',
    plain:
      'Kim mạnh mà gặp Hoả thì mới rèn thành đồ dùng được. Đây là nguyên lý chế hoá: mạnh quá thì cần cái khắc nó để tạo hình.',
  },
  q_bz_0004: {
    short: 'Bài ca liệt kê can tàng trong 12 địa chi.',
    plain:
      'Bài tàng can ca: mỗi địa chi giấu một hoặc vài can — Tý tàng Quý; Sửu tàng Quý, Tân, Kỷ; Dần tàng Giáp, Bính, Mậu; Mão tàng Ất; Thìn tàng Ất, Mậu, Quý; Tỵ tàng Canh, Bính, Mậu; Ngọ tàng Đinh, Kỷ; Mùi tàng Ất, Kỷ, Đinh; Thân tàng Canh, Nhâm, Mậu; Dậu tàng Tân; Tuất tàng Tân, Đinh, Mậu; Hợi tàng Nhâm, Giáp.',
  },
  q_bz_0005: {
    short: 'Năm quan hệ thập thần, mỗi cặp chia âm dương.',
    plain:
      'Năm quan hệ giữa các can với can ngày: (1) khắc ta — quan và sát; (2) ta khắc — tài; (3) sinh ta — ấn; (4) ta sinh — thực và thương; (5) cùng loại — kiếp tài và dương nhận. Mỗi cặp lại chia theo âm dương.',
  },
  q_bz_0006: {
    short: 'Dương nam âm nữ đi thuận, âm nam dương nữ đi nghịch.',
    plain:
      'Nam sinh năm dương hoặc nữ sinh năm âm thì vận đi thuận từ trụ tháng; nam sinh năm âm hoặc nữ sinh năm dương thì đi nghịch.',
  },
  q_bz_0007: {
    short: 'Mỗi vận 10 năm; 3 ngày tính thành 1 năm.',
    plain:
      'Mỗi vận kéo dài mười năm. Khi tính tuổi khởi vận, ba ngày được quy thành một năm (một năm có 24 tiết khí, 72 hậu).',
  },
  q_bz_0008: {
    short: 'Lấy can ngày làm chủ thể; năm là gốc, tháng là mầm, ngày là hoa, giờ là quả.',
    plain:
      'Cách xem Tử Bình: lấy can ngày làm chủ thể của lá số; trụ năm là gốc, trụ tháng là mầm, trụ ngày là hoa, trụ giờ là quả.',
  },

  // ── Định nghĩa 14 chính tinh ────────────────────────────────
  q_tv_0001: {
    short: 'Tử Vi: sao tôn quý nhất, chủ tạo hoá và chủ mệnh người.',
    plain:
      'Tử Vi thuộc hành Thổ, được coi là ngôi vua giữa trời. Trong lá số, nó chủ về việc tạo hoá và chủ mệnh của người xem — là sao quan trọng nhất.',
  },
  q_tv_0002: {
    short: 'Mở bài Thái Vi phú: môn Đẩu Số rất sâu kín, khó nói hết.',
    plain:
      'Câu mở đầu sách: môn Tử Vi cực kỳ sâu kín, lý lẽ khó sáng tỏ; dù sách có đặt trăm câu hỏi thì vẫn còn điều nói chưa hết.',
  },
  q_tv_0003: {
    short: 'Thiên Phủ: sao thứ nhất Nam Đẩu, chủ về tiền của.',
    plain:
      'Thiên Phủ thuộc Thổ, là sao đứng đầu Nam Đẩu. Nó là chủ của tiền tài — giống như kho của trong lá số.',
  },
  q_tv_0004: {
    short: 'Tử Vi không có Tả Phụ, Hữu Bật thì là “vua cô đơn”.',
    plain:
      'Tử Vi mà không có Tả Phụ và Hữu Bật đi kèm thì gọi là "vua cô đơn" — ví như viên ngọc đẹp nhưng không có ai giữ, nên chưa đủ tốt.',
  },
  q_tv_0005: {
    short: 'Thiên Cơ: sao thứ ba Nam Đẩu, chủ thêm thọ và làm điều thiện.',
    plain:
      'Thiên Cơ thuộc Mộc, là sao thứ ba của Nam Đẩu. Nó chủ việc tăng tuổi thọ và hướng tới điều thiện.',
  },
  q_tv_0006: {
    short: 'Thiên Cơ: hoá khí là “thiện”, tuỳ đất mà hành sự.',
    plain:
      'Sao Thiên Cơ khi hiện ra được gọi là "thiện"; nó hành xử tuỳ theo cung đóng và có khả năng giải được thế thuận nghịch cho các sao khác.',
  },
  q_tv_0007: {
    short: 'Thái Dương: Hoả, tinh hoa Mặt Trời.',
    plain: 'Thái Dương thuộc Hoả, là tinh hoa của Mặt Trời — ánh sáng, sự sống, ban ngày.',
  },
  q_tv_0008: {
    short: 'Thái Dương: biểu tượng tạo hoá, chủ khí quý, làm được văn lẫn võ.',
    plain:
      'Thái Dương là biểu tượng của tạo hoá; trong lá số, nó cho thấy người có khí chất quý, có thể theo đường văn hoặc đường võ.',
  },
  q_tv_0009: {
    short: 'Vũ Khúc: sao thứ sáu Bắc Đẩu, Kim, chủ cung Tài Bạch.',
    plain:
      'Vũ Khúc là sao thứ sáu của Bắc Đẩu, thuộc Kim. Nó là chủ của cung Tài Bạch (tiền của) — sao thiên về tài chính, hành động.',
  },
  q_tv_0010: {
    short: 'Vũ Khúc đồng cung Thiên Phủ thì thọ; quyền trải 12 cung.',
    plain:
      'Vũ Khúc mà nằm cùng Thiên Phủ thì chủ thọ; quyền của nó trải khắp mười hai cung, tuỳ chỗ đóng mà có miếu, vượng hay hãm.',
  },
  q_tv_0011: {
    short: 'Thiên Đồng: Thuỷ, sao thứ tư phương Nam, chủ Phúc Đức.',
    plain:
      'Thiên Đồng thuộc Thuỷ, là sao thứ tư của Nam Đẩu. Nó là chủ của cung Phúc Đức — nơi nói về phần phúc của người.',
  },
  q_tv_0012: {
    short: 'Thiên Đồng: ưa gặp sao tốt, người thanh liêm, dung mạo thanh kỳ.',
    plain:
      'Khi Thiên Đồng hoá thành phúc, nó ưa gặp các sao tốt để thêm phúc lành; người có nó thường thanh liêm và có dung mạo khác thường.',
  },
  q_tv_0013: {
    short: 'Liêm Trinh: Hoả, sao thứ năm Bắc Đẩu.',
    plain: 'Liêm Trinh thuộc Hoả, là sao thứ năm của Bắc Đẩu.',
  },
  q_tv_0014: {
    short: 'Liêm Trinh: giữ phẩm trật và quyền lệnh.',
    plain:
      'Trong các sao, Liêm Trinh giữ phẩm trật (thứ bậc); trong lá số, nó giữ quyền lệnh — như người nắm luật lệ.',
  },
  q_tv_0015: {
    short: 'Thiên Phủ: chủ Tài Bạch, gặp cát thì nền giàu sang.',
    plain:
      'Thiên Phủ là chủ của cung Tài Bạch; trong đẩu nó giữ quyền phúc. Gặp sao tốt thì đều là nền của sự giàu sang — thường được luận ngang hàng với Văn Xương.',
  },
  q_tv_0016: {
    short: 'Thái Âm: tinh hoa Thuỷ, chủ Điền Trạch, hoá phú.',
    plain:
      'Thái Âm là tinh hoa của Thuỷ, là chủ của cung Điền Trạch (nhà cửa, đất đai). Nó hoá thành "phú" (giàu) và làm thành cặp với Thái Dương.',
  },
  q_tv_0017: {
    short: 'Thái Âm: người thông minh tuấn tú, tính đoan nhã.',
    plain:
      'Người có sao này thường thông minh, tuấn tú; bẩm tính đoan trang, nhã nhặn và thuần lành.',
  },
  q_tv_0018: {
    short: 'Tham Lang: thần giải ách của Bắc Đẩu, sao thứ nhất.',
    plain:
      'Tham Lang là thần giải ách (gỡ tai nạn) của Bắc Đẩu, và là sao đứng đầu Bắc Đẩu.',
  },
  q_tv_0019: {
    short: 'Tham Lang: Thuỷ, hoá Đào Hoa, chủ hoạ phúc.',
    plain:
      'Tham Lang thuộc Thuỷ; khi hiện ra thì gọi là Đào Hoa, làm chuẩn mực, và là sao chủ về hoạ phúc — cả điều may mắn lẫn rủi ro đều qua nó.',
  },
  q_tv_0020: {
    short: 'Cự Môn: Thuỷ và Kim, sao thứ hai Bắc Đẩu, hoá “ám”.',
    plain:
      'Cự Môn thuộc cả Thuỷ và Kim, là sao thứ hai của Bắc Đẩu, là sao âm tinh. Khi hiện ra thì gọi là "ám" — nặng về che phủ, thị phi.',
  },
  q_tv_0021: {
    short: 'Cự Môn ở Mệnh/Thân: một đời vướng thị phi.',
    plain:
      'Cự Môn đóng ở cung Mệnh hoặc Thân thì cả đời dễ chuốc chuyện thị phi, lời ra tiếng vào.',
  },
  q_tv_0022: {
    short: 'Thiên Tướng: Thuỷ, sao thứ năm Nam Đẩu.',
    plain: 'Thiên Tướng thuộc Thuỷ, là sao thứ năm của Nam Đẩu.',
  },
  q_tv_0023: {
    short: 'Thiên Tướng: giữ tước vị, hoá “ấn”, văn tinh của Quan Lộc.',
    plain:
      'Thiên Tướng là sao giữ tước vị, chủ phúc lành. Khi hiện ra thì gọi là "ấn" (ấn tín); đây là văn tinh của cung Quan Lộc, phò tá cho ngôi vua (Tử Vi).',
  },
  q_tv_0024: {
    short: 'Thiên Lương: Thổ, sao thứ hai Nam Đẩu.',
    plain: 'Thiên Lương thuộc Thổ, là sao thứ hai của Nam Đẩu.',
  },
  q_tv_0025: {
    short: 'Thiên Lương: chủ thọ và phúc, chủ mệnh cha mẹ.',
    plain:
      'Thiên Lương chủ về tuổi thọ; khi hiện ra gọi là "ấm" và "phúc thọ". Nó làm chủ mệnh của cha mẹ và có khả năng biến sự bạo ngược thành hoà lành.',
  },
  q_tv_0026: {
    short: 'Thất Sát: sao thứ sáu Nam Đẩu, Hoả và Kim.',
    plain: 'Thất Sát là sao thứ sáu của Nam Đẩu, thuộc cả Hoả và Kim.',
  },
  q_tv_0027: {
    short: 'Thất Sát: thượng tướng trong đẩu, sao cô độc của thành bại.',
    plain:
      'Thất Sát như vị thượng tướng trong các sao, đồng thời là sao cô độc — thành hay bại đều khắc nghiệt, một mình mà chịu.',
  },
  q_tv_0028: {
    short: 'Phá Quân: Thuỷ, sao thứ bảy Bắc Đẩu, chủ vợ chồng, con, tôi tớ.',
    plain:
      'Phá Quân thuộc Thuỷ, là sao thứ bảy của Bắc Đẩu. Nó giữ các việc về vợ chồng, con cái và người hầu.',
  },
  q_tv_0029: {
    short: 'Phá Quân: sát khí trên trời, sao hao trong số.',
    plain:
      'Phá Quân trên trời là sát khí; trong lá số là sao hao (hao tổn). Vì thế khi hiện ra gọi là "hao".',
  },
  q_tv_0030: {
    short: 'Văn Xương: chủ khoa cử, người nhớ rộng biết nhiều.',
    plain:
      'Văn Xương chủ về khoa cử. Đóng ở Mệnh/Thân thì người thanh nhàn nho nhã, thanh tú khôi ngô, nhớ rộng biết nhiều, xử sự linh hoạt; một lần thi đỗ mà mặc áo đỏ đai tía, phúc thọ vẹn toàn.',
  },
  q_tv_0031: {
    short: 'Văn Xương: dẫu bị sát tinh xung phá cũng không hạ tiện.',
    plain:
      'Dù Văn Xương bị bốn sao sát xung phá, người cũng không đến mức hạ tiện — nền tảng học thức vẫn đỡ lại.',
  },
  q_tv_0032: {
    short: 'Văn Khúc: Thuỷ, sao thứ tư Bắc Đẩu, chủ khoa giáp văn chương.',
    plain:
      'Văn Khúc thuộc Thuỷ, là sao thứ tư của Bắc Đẩu. Nó chủ về khoa cử và văn chương.',
  },
  q_tv_0033: {
    short: 'Văn Khúc: cùng Văn Xương phối hợp thì thành khách khoa bảng.',
    plain:
      'Văn Khúc cũng thuộc Thuỷ, đi cùng Văn Xương thì hợp; trong lá số tốt thì rất hay, đóng ở Mệnh/Thân thì người dễ thành đạt trong khoa bảng.',
  },
  q_tv_0034: {
    short: 'Tả Phụ: sao phò tá ngôi vua, đóng Mệnh/Thân thì nhiều phúc.',
    plain:
      'Tả Phụ là sao chủ tể phò tá ngôi Đế. Đóng ở Mệnh hoặc Thân thì các cung đều được giáng phúc.',
  },
  q_tv_0035: {
    short: 'Tả Phụ: người dung mạo đôn hậu, phóng khoáng.',
    plain:
      'Người có Tả Phụ thường có dung mạo đôn hậu, phóng khoáng và phong lưu.',
  },
  q_tv_0036: {
    short: 'Tả Phụ Thổ, Hữu Bật Thuỷ; thiếu “vua” thì vô dụng.',
    plain:
      'Tả Phụ vốn thuộc Thổ, Hữu Bật lấy Thuỷ làm gốc. Hai sao này thiếu "vua" (Tử Vi) thì vô dụng — nên chúng cần gặp nhau ở tam hợp.',
  },
  q_tv_0037: {
    short: 'Hữu Bật: đóng Mệnh/Thân thì thông văn chương.',
    plain:
      'Hữu Bật là sao phò tá ngôi vua; đóng ở Mệnh hoặc Thân thì người tinh thông văn chương.',
  },
  q_tv_0038: {
    short: 'Tử Vi cùng Thiên Phủ ở một cung: tài quan đều đẹp.',
    plain:
      'Khi Tử Vi và Thiên Phủ cùng đóng một cung và có các sao tốt kèm theo thì tiền tài và công danh đều đẹp, văn võ song toàn.',
  },
  q_tv_0039: {
    short: 'Thiên Khôi, Thiên Việt: sao quý nhân, vào Mệnh thì phú quý.',
    plain:
      'Thiên Khôi và Thiên Việt là các sao chủ khoa trong đẩu. Vào Mệnh thì "ngồi quý hướng quý" — hoặc được Tả Hữu và các sao tốt tụ họp, không đâu là không phú quý.',
  },
  q_tv_0040: {
    short: 'Khôi ở Mệnh, Việt ở Thân: thay nhau giữ.',
    plain:
      'Nếu Thiên Khôi đóng ở cung Mệnh và Thiên Việt đóng ở cung Thân, hai sao thay nhau mà trấn giữ — càng vững.',
  },
  q_tv_0041: {
    short: 'Từ Tử Vi đến Tả Hữu là 18 sao chính; Khôi, Việt, Thiên Mã là sao tốt nhưng không vào chính tinh.',
    plain:
      'Từ Tử Vi đến Tả Phụ, Hữu Bật là mười tám sao chính của Nam Bắc Đẩu. Thiên Khôi, Thiên Việt, Thiên Mã cũng là sao tốt nhưng không được xếp vào nhóm chính tinh.',
  },
  q_tv_0042: {
    short: 'Lộc Tồn: sao thứ ba Bắc Đẩu, chủ tước lộc và thọ.',
    plain:
      'Lộc Tồn là sao thứ ba của Bắc Đẩu, được gọi là "chỗ ở của người chân thật"; nó chủ về tước lộc và giữ nền thọ của người.',
  },
  q_tv_0043: {
    short: 'Trong 12 cung, chỉ Mệnh/Thân, Điền Trạch, Tài Bạch là cốt yếu — chủ giàu.',
    plain:
      'Trong mười hai cung, chỉ ba chỗ quan trọng nhất: Mệnh/Thân, Điền Trạch và Tài Bạch; chúng chủ về sự giàu.',
  },
  q_tv_0044: {
    short: 'Lộc Tồn thuộc Thổ, sao tước lộc và thọ.',
    plain: 'Lộc Tồn thuộc Thổ, thuộc Bắc Đẩu, là sao chủ tước lộc và tuổi thọ.',
  },
  q_tv_0045: {
    short: 'Thiên Mã: mỗi cung có cách chế hoá riêng; đóng Mệnh/Thân gọi là “dịch mã”.',
    plain:
      'Các cung đều có cách chế hoá riêng. Sao Thiên Mã đóng ở Mệnh hoặc Thân thì gọi là "dịch mã" — người hay đi lại, thay đổi.',
  },
  q_tv_0046: {
    short: 'Thiên Mã cùng Lộc Tồn: “lộc mã giao trì”.',
    plain:
      'Thiên Mã mà cùng cung với Lộc Tồn thì gọi là "lộc mã giao trì" (lộc và ngựa gặp nhau) — tiền và đường đi đều thuận; còn gọi là "chiết tiên mã".',
  },
  q_tv_0047: {
    short: 'Khôi, Việt và Thiên Mã đều thuộc Hoả.',
    plain: 'Thiên Khôi, Thiên Việt và Thiên Mã đều thuộc hành Hoả.',
  },
  q_tv_0048: {
    short: 'Kình Dương: sao phụ Bắc Đẩu, tính thô bạo.',
    plain:
      'Kình Dương là sao phụ của Bắc Đẩu. Đóng ở Mệnh hoặc Thân thì người tính thô, hành xử dễ bạo.',
  },
  q_tv_0049: {
    short: 'Kình Dương: cô đơn, coi người thân như xa lạ.',
    plain:
      'Kình Dương khiến người ta đơn độc, coi người thân như xa lạ; ân nghĩa dễ trở thành oán trách.',
  },
  q_tv_0050: {
    short: 'Kình Dương thuộc Kim, sao nổi của Bắc Đẩu, hoá hình.',
    plain: 'Kình Dương thuộc Kim, là sao nổi của Bắc Đẩu, hoá thành "hình" (hình phạt, va chạm).',
  },
  q_tv_0051: {
    short: 'Đà La: sao phụ Bắc Đẩu, lòng dạ không ngay.',
    plain:
      'Đà La là sao phụ của Bắc Đẩu. Đóng ở Mệnh hoặc Thân thì lòng dạ không ngay thẳng.',
  },
  q_tv_0052: {
    short: 'Đà La: lệ ngầm, tính mạnh, làm việc hay do dự.',
    plain:
      'Đà La khiến người ta dễ có lệ ngầm (nước mắt khó nói), tính mạnh mẽ và hay mạnh mẽ, làm việc hay tiến thoái do dự.',
  },
  q_tv_0053: {
    short: 'Đà La thuộc Kim, sao phụ Bắc Đẩu, hoá kỵ.',
    plain: 'Đà La thuộc Kim, là sao phụ của Bắc Đẩu, hoá thành "kỵ" (vướng mắc).',
  },
  q_tv_0054: {
    short: 'Hoả Tinh: sao nổi của Nam Đẩu.',
    plain: 'Hoả Tinh là sao nổi (phụ) của Nam Đẩu.',
  },
  q_tv_0055: {
    short: 'Hoả Tinh: đại sát tướng, không nên gặp ở Mệnh/Thân.',
    plain:
      'Hoả Tinh là đại sát tướng, được gọi là sao sát của Nam Đẩu. Nếu nó trấn ở cung Mệnh/Thân thì các cung khác không nên gặp nó.',
  },
  q_tv_0056: {
    short: 'Hoả Tinh thuộc Hoả, sao phụ Nam Đẩu.',
    plain: 'Hoả Tinh thuộc Hoả, là sao phụ của Nam Đẩu.',
  },
  q_tv_0057: {
    short: 'Linh Tinh: sao phụ Nam Đẩu.',
    plain: 'Linh Tinh là sao phụ của Nam Đẩu.',
  },
  q_tv_0058: {
    short: 'Linh Tinh: đại sát, khiến người trầm tư.',
    plain:
      'Linh Tinh là đại sát tướng, là sao từ của Nam Đẩu; đóng ở Mệnh/Thân thì người có tính trầm tư.',
  },
  q_tv_0059: {
    short: 'Linh Tinh thuộc Hoả, sao phụ Nam Đẩu.',
    plain: 'Linh Tinh thuộc Hoả, là sao phụ của Nam Đẩu.',
  },
  q_tv_0060: {
    short: 'Hoả Tinh, Linh Tinh đóng Mệnh/Thân: gặp tốt thành tốt.',
    plain:
      'Hoả Tinh và Linh Tinh cùng đóng ở Mệnh hoặc Thân: gặp sao tốt thì thành tốt, gặp sao xấu thì thành xấu.',
  },
  q_tv_0061: {
    short: 'Hoả, Linh: thường không nên gặp, dễ mất của.',
    plain:
      'Nói chung hai sao Hoả và Linh đều không nên gặp ở cung quan trọng: sẽ chủ mất của; gặp ở đại hạn/tiểu hạn thì chắc chắn xấu.',
  },
  q_tv_0062: {
    short: 'Địa Không, Địa Kiếp thuộc Hoả; Thiên Thương, Thiên Sứ thuộc Thuỷ.',
    plain: 'Địa Không và Địa Kiếp thuộc Hoả; Thiên Thương và Thiên Sứ thuộc Thuỷ.',
  },
  q_tv_0063: {
    short: 'Thiên Hình ở Mệnh/Thân: không làm sư thì cô khắc.',
    plain:
      'Thiên Hình đóng ở Mệnh hoặc Thân thì người ta không đi tu làm sư làm đạo, thì cũng chủ cô khắc — không chết non thì nghèo.',
  },
  q_tv_0064: {
    short: 'Thiên Hình: cha mẹ anh em không toàn vẹn; gặp miếu thì tốt.',
    plain:
      'Khi Thiên Hình ở Mệnh/Thân, cha mẹ và anh em dễ không toàn vẹn. Gặp ở đại hạn/tiểu hạn thì chủ xuất gia, dính kiện tụng, tù tội, mất của; nhưng nếu ở cung miếu thì tốt.',
  },
  q_tv_0065: {
    short: 'Thiên Diêu ở Mệnh/Thân: dễ đa nghi, nặng tình dục.',
    plain:
      'Thiên Diêu đóng ở Mệnh hoặc Thân thì người có tâm tính hay đa nghi, ngoại hình ưa nhìn, phong lưu và nặng về tình dục.',
  },
  q_tv_0066: {
    short: 'Thiên Diêu: gặp miếu vượng thì giàu sang, nhiều người hầu.',
    plain:
      'Thiên Diêu ở cung miếu hoặc vượng thì người ta giàu sang, có nhiều người hầu; đóng ở Hợi thì người có học thức.',
  },
  q_tv_0067: {
    short: 'Hoá Lộc: thần phúc đức, đóng Mệnh/Thân hay Quan Lộc.',
    plain:
      'Hoá Lộc là thần phúc đức. Đóng ở Mệnh/Thân và Quan Lộc; gặp Hoá Khoa, Hoá Quyền thì thường làm quan lớn.',
  },
  q_tv_0068: {
    short: 'Hoá Lộc thuộc Thổ, thích gặp Lộc Tồn.',
    plain: 'Hoá Lộc thuộc Thổ, thích gặp Lộc Tồn để được tiếp sức.',
  },
  q_tv_0069: {
    short: 'Hoá Quyền: thần nắm sinh sát, gặp Khoa, Lộc thì làm tướng.',
    plain:
      'Hoá Quyền là thần nắm quyền sinh sát. Đóng ở Mệnh/Thân; gặp Hoá Khoa và Hoá Lộc thì người ra tướng vào tướng.',
  },
  q_tv_0070: {
    short: 'Hoá Quyền thuộc Mộc, thích gặp Cự Môn và Vũ Khúc.',
    plain: 'Hoá Quyền thuộc Mộc, thích gặp Cự Môn và Vũ Khúc.',
  },
  q_tv_0071: {
    short: 'Hoá Khoa: sao văn mặc, gặp Quyền, Lộc thì làm quan.',
    plain:
      'Hoá Khoa là sao trên thiên giới về thi cử, chủ về văn mặc. Đóng ở Mệnh/Thân, gặp Hoá Quyền và Hoá Lộc thì được quý như quan đại thần.',
  },
  q_tv_0072: {
    short: 'Hoá Khoa thuộc Thuỷ, thích gặp Khôi, Việt.',
    plain: 'Hoá Khoa thuộc Thuỷ, thích gặp Thiên Khôi và Thiên Việt.',
  },
  q_tv_0073: {
    short: 'Hoá Kỵ: sinh chuyện, đóng Mệnh/Thân thì một đời không thuận.',
    plain:
      'Hoá Kỵ là thần hay sinh chuyện. Đóng ở Mệnh/Thân thì cả đời không thuận; gặp ở tiểu hạn thì năm đó không yên; ở đại hạn thì mười năm phải hối hận.',
  },
  q_tv_0074: {
    short: 'Hoá Kỵ thuộc Thuỷ, tức sao Kế Đô.',
    plain: 'Hoá Kỵ thuộc Thuỷ, đó chính là sao Kế Đô.',
  },
  q_tv_0075: {
    short: 'Thứ tự 12 cung: Mệnh, Huynh Đệ, Phu Thê, Tử Nữ, Tài Bạch…',
    plain:
      'Thứ tự mười hai cung: 1 Mệnh, 2 Huynh Đệ, 3 Phu Thê (vợ chồng), 4 Tử Nữ, 5 Tài Bạch, 6 Tật Ách, 7 Thiên Di, 8 Giao Hữu (tôi tớ), 9 Quan Lộc, 10 Điền Trạch, 11 Phúc Đức, 12 Phụ Mẫu.',
  },
  q_tv_0076: {
    short: 'Mệnh nam: Tài Bạch, Quan Lộc, Phúc Đức, Thiên Di, Điền Trạch mạnh.',
    plain:
      'Mệnh nam: các cung Tài Bạch, Quan Lộc, Phúc Đức, Thiên Di, Điền Trạch là cung mạnh; Tử Nữ, Giao Hữu, Huynh Đệ, Phụ Mẫu là cung yếu.',
  },
  q_tv_0077: {
    short: 'Việc đầu tiên: xem cung Mệnh tốt xấu, miếu vượng hay hoá Kỵ.',
    plain:
      'Việc đầu tiên khi xem lá số: xem cung Mệnh hung cát, miếu vượng, hoá cát hay hoá kỵ, cùng sinh khắc.',
  },
  q_tv_0078: {
    short: 'Thứ ba: xem Thiên Di, Tài Bạch, Quan Lộc — ba cung tam hợp.',
    plain:
      'Thứ ba: xem ba cung Thiên Di, Tài Bạch, Quan Lộc — là ba cung tam hợp với Mệnh — xem các sao ở đó có bị hình xung khắc phá không.',
  },
  q_tv_0079: {
    short: 'Xem cung Tử Nữ: trước hết xem sao chủ có mấy con.',
    plain: 'Khi xem cung Tử Nữ, trước hết xem sao chủ ở đó nói có bao nhiêu con.',
  },
  q_tv_0080: {
    short: 'Xem Tật Ách: sao Mệnh hãm + sát tinh, rồi xem cung Tật Ách.',
    plain:
      'Trước hết xem sao ở cung Mệnh có bị rơi xuống hãm địa, có bị Kình Dương, Đà La, Hoả, Linh, Không, Kiếp, Hoá Kỵ trấn hay không; rồi xem các sao ở cung Tật Ách tốt xấu, miếu hãm thế nào mà đoán.',
  },
  q_tv_0081: {
    short: 'Xem Phúc Đức: quyền lộc hay kiếp không, đối chiếu Tài Bạch.',
    plain:
      'Thứ tư: xem cung Phúc Đức có Hoá Quyền, Hoá Lộc hay Kiếp Không, miếu hãm ra sao — vì Phúc Đức đối ứng với Tài Bạch.',
  },
  q_tv_0082: {
    short: 'Cung cha mẹ: Thái Dương là cha, Thái Âm là mẹ.',
    plain: 'Khi xem cung Phụ Mẫu: lấy Thái Dương làm cha, lấy Thái Âm làm mẹ.',
  },
  q_tv_0083: {
    short: 'Mệnh nữ: chồng, con, tài, điền, phúc là cung mạnh.',
    plain:
      'Mệnh nữ: các cung chồng, con, Tài Bạch, Điền Trạch và Phúc Đức là cung mạnh; các cung còn lại đều yếu.',
  },
  q_tv_0084: {
    short: 'An Hồng Loan: từ Mão khởi Tý đếm nghịch đến chi năm sinh.',
    plain:
      'Cách an Hồng Loan: từ cung Mão khởi Tý, đếm nghịch đến chi năm sinh thì được cung Hồng Loan; cung đối diện là Thiên Hỷ. Người trẻ gặp thì có tin vui hôn nhân; người già gặp thì có thể mất vợ; ba mươi năm đầu là sao tốt, năm mươi năm sau không nên gặp.',
  },
  q_tv_0085: {
    short: 'Hồng Loan, Thiên Hỷ thuộc Thuỷ; Thái Tuế thuộc Hoả.',
    plain: 'Hồng Loan và Thiên Hỷ thuộc Thuỷ; sao Thái Tuế (đương niên) thuộc Hoả.',
  },
  q_tv_0086: {
    short: 'An Tam Thai, Bát Toạ theo ngày sinh và Tả Phụ, Hữu Bật.',
    plain:
      'Cách an Tam Thai và Bát Toạ: Tam Thai theo Tả Phụ — đặt ngày mùng một ở cung có Tả Phụ rồi đếm thuận đến ngày sinh; Bát Toạ theo Hữu Bật — đặt mùng một ở cung có Hữu Bật rồi đếm nghịch đến ngày sinh.',
  },
  q_tv_0087: {
    short: 'Võ chức: Vũ Khúc, Thất Sát ở Mệnh miếu vượng, có Tam Thai, Bát Toạ.',
    plain:
      'Luận về võ nghiệp: nếu Vũ Khúc, Thất Sát đóng ở Mệnh trong cung miếu vượng, lại có Tam Thai, Bát Toạ thêm Hoá Quyền, Hoá Lộc và Thiên Khôi, Thiên Việt cùng chiếu thì chủ làm võ quan.',
  },
  q_tv_0088: {
    short: 'Cung Tử Nữ có Bát Toạ, thêm sao tốt miếu vượng: sinh quý tử.',
    plain:
      'Cung Tử Nữ có sao Bát Toạ, thêm các sao tốt ở cung miếu vượng thì chủ sinh con quý, quyền lực không nhỏ.',
  },

  // ── Bảng độ sáng (11–18 là bảng sao, không cần giải) ────────
  q_tv_0111: {
    short: 'Cục Thuỷ nhị: đại hạn khởi tuổi 2.',
    plain:
      'Cục Thuỷ nhị khởi đại hạn từ 2 tuổi; phần còn lại của câu là cách an sao theo ngày sinh.',
  },
  q_tv_0112: {
    short: 'Cục Mộc tam: đại hạn khởi tuổi 3.',
    plain:
      'Cục Mộc tam khởi đại hạn từ 3 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  q_tv_0113: {
    short: 'Cục Kim tứ: đại hạn khởi tuổi 4.',
    plain:
      'Cục Kim tứ khởi đại hạn từ 4 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  q_tv_0114: {
    short: 'Cục Thổ ngũ: đại hạn khởi tuổi 5.',
    plain:
      'Cục Thổ ngũ khởi đại hạn từ 5 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  q_tv_0115: {
    short: 'Cục Hoả lục: đại hạn khởi tuổi 6.',
    plain:
      'Cục Hoả lục khởi đại hạn từ 6 tuổi; phần còn lại là cách an sao theo ngày sinh.',
  },
  q_tv_0116: {
    short: 'Đại hạn: cung toàn sao tốt thì 10 năm yên; có sát tinh thì lộn xộn.',
    plain:
      'Cung đang chịu đại hạn mà chỉ có sao tốt miếu vượng, không có Kình Dương, Đà La, Hoả, Linh, Không, Kiếp thì mười năm yên, người và của đều tốt. Có sao xấu chen vào thì thành bại lẫn lộn.',
  },
  q_tv_0117: {
    short: 'Nam dương, nữ âm lấy Nam Đẩu làm phúc; ngược lại lấy Bắc Đẩu.',
    plain:
      'Nam sinh năm dương hoặc nữ sinh năm âm thì lấy nhóm sao Nam Đẩu làm phúc cho mình; nam sinh năm âm và nữ sinh năm dương thì lấy nhóm sao Bắc Đẩu.',
  },
  q_tv_0118: {
    short: 'Đọc một cung phải đọc cùng tam hợp và đối cung.',
    plain:
      'Cổ nhân không nhìn riêng từng cung. Một cung luôn được đọc cùng hai cung tam hợp và cung đối diện: cái gì ở bốn cung đó hợp lại mới thành hình rõ.',
  },
};

let patched = 0;
let skipped = 0;
for (const q of quotes) {
  const patch = PATCH[q.id];
  if (!patch) continue;
  if (!force && q.plain_vi && q.short_vi) {
    skipped++;
    continue;
  }
  if (!patch.plain) continue;
  q.short_vi = q.short_vi ?? patch.short;
  q.plain_vi = q.plain_vi ?? patch.plain;
  patched++;
}

// Giữ nguyên thứ tự đang có trong tệp: chỉ thêm trường, không sắp lại.
writeFileSync(QUOTES, quotes.map((q) => JSON.stringify(q)).join('\n') + '\n', 'utf8');

const withPlain = quotes.filter((q) => q.plain_vi).length;
console.log(`đã thêm bản giảng: ${patched} · bỏ qua (đã có): ${skipped}`);
console.log(`tổng câu: ${quotes.length} · có bản dễ hiểu: ${withPlain}`);
