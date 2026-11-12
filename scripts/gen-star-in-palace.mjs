#!/usr/bin/env node
/**
 * Sinh nội dung "sao tại từng cung" từ 紫微斗數全書 **卷二中 các mục theo cung**:
 *
 *   二 兄弟 · 三 妻妾 · 四 子女 · 五 财帛 · 六 疾厄 · 七 迁移 ·
 *   八 奴仆 · 九 官禄 · 十 田宅 · 十一 福德 · 十二 父母
 *
 * Mỗi mục trong sách là một dòng/đoạn cho một chính tinh: "Tử Vi ở cung Phu Thê
 * thì…". Script cắt đúng đoạn đó (không gõ tay chữ Hán), gắn với id sao của
 * engine và id cung theo đúng thứ tự `PALACE_NAMES` (Mệnh = 0).
 *
 * Không cắt mục 一 命宫: cung Mệnh đã dùng câu định nghĩa sao ở 卷一 (諸星問答論).
 *
 * Chạy: node scripts/gen-star-in-palace.mjs
 * Idempotent: khoá theo nguyên văn.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ZW = 'corpus/ziwei-quanshu.txt';
const QUOTES = 'content/quotes.jsonl';

const PALACES = [
  { id: 1, key: 'xiong', zh: '兄弟', vi: 'Huynh Đệ', section: '二 兄弟', start: 47430, end: 48364 },
  { id: 2, key: 'the', zh: '妻妾', vi: 'Phu Thê', section: '三 妻妾', start: 48364, end: 49308 },
  { id: 3, key: 'tu', zh: '子女', vi: 'Tử Nữ', section: '四 子女', start: 49308, end: 50615 },
  { id: 4, key: 'tai', zh: '財帛', vi: 'Tài Bạch', section: '五 财帛', start: 50615, end: 51688 },
  { id: 5, key: 'tat', zh: '疾厄', vi: 'Tật Ách', section: '六 疾厄', start: 51688, end: 52522 },
  { id: 6, key: 'di', zh: '遷移', vi: 'Thiên Di', section: '七 迁移', start: 52522, end: 53443 },
  { id: 7, key: 'no', zh: '奴僕', vi: 'Giao Hữu', section: '八 奴仆', start: 53443, end: 54337 },
  { id: 8, key: 'quan', zh: '官祿', vi: 'Sự Nghiệp', section: '九 官禄', start: 54337, end: 55605 },
  { id: 9, key: 'dien', zh: '田宅', vi: 'Điền Trạch', section: '十 田宅', start: 55605, end: 56505 },
  { id: 10, key: 'phuc', zh: '福德', vi: 'Phúc Đức', section: '十一 福德', start: 56505, end: 57430 },
  { id: 11, key: 'phu', zh: '父母', vi: 'Phụ Mẫu', section: '十二 父母', start: 57430, end: 58586 },
];

/** 14 chính tinh — thứ tự trong sách. */
const STARS = [
  ['ziwei', '紫微'],
  ['tianji', '天机'],
  ['taiyang', '太阳'],
  ['wuqu', '武曲'],
  ['tiantong', '天同'],
  ['lianzhen', '廉贞'],
  ['tianfu', '天府'],
  ['taiyin', '太阴'],
  ['tanlang', '贪狼'],
  ['jumen', '巨门'],
  ['tianxiang', '天相'],
  ['tianliang', '天梁'],
  ['qisha', '七杀'],
  ['pojun', '破军'],
];

/**
 * Các dòng mở đầu bằng tên sao khác (phụ tinh, sao lưu niên…) hoặc tiêu đề thơ:
 * gặp là kết thúc đoạn của chính tinh đang đọc. Phụ tinh chưa đưa vào bản này
 * (xem README) nên chỉ dùng làm mốc cắt.
 */
const OTHER_HEADS = [
  '文昌', '文曲', '左辅', '右弼', '禄存', '擎羊', '陀罗', '火星', '铃星',
  '天魁', '天钺', '魁钺', '羊陀', '羊玲', '羊铃', '斗君', '岁君', '天马',
  '地空', '地劫', '天空', '天伤', '天使', '天刑', '天姚', '天哭', '天虚',
  '定公卿', '定两官府', '定文官', '定武官', '定曹吏', '辅弼星缠', '昌曲二曜',
  '文官昌曲', '将军武曜', '太阳化官',
];

/** Bản dịch sát nghĩa, viết ở đây (không sinh tự động). */
const VI = {
  // ── 1. Huynh Đệ ────────────────────────────────────────────
  xiong: {
    ziwei:
      'Tử Vi: được nhờ anh/chị lớn. Cùng Thiên Phủ thì ba người, cùng Thiên Tướng ba bốn người, cùng Phá Quân cũng ba người — có thể khác mẹ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp thì có khắc, có khi không hoà.',
    tianji:
      'Thiên Cơ miếu vượng: hai người; cùng Cự Môn: hai người; hãm địa: mỗi người một ý, không đồng lòng; cùng Thiên Lương: hai người; cùng Thái Âm: hai ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh tuy có anh chị em nhưng vẫn khắc.',
    taiyang:
      'Thái Dương miếu vượng: ba người; cùng Cự Môn mà không sát tinh: ba người; cùng Thái Âm: năm người; hãm địa: không hoà, không nhờ được; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp thì càng khắc, số giảm một nửa.',
    wuqu:
      'Vũ Khúc miếu vượng: hai người nhưng không hợp; hãm cung thêm sát tinh: chỉ một người; cùng Thiên Tướng: hai người; cùng Phá Quân hoặc Thất Sát: một người, không hoà thuận; thêm Xương Khúc, Tả Hữu: ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cô đơn.',
    tiantong:
      'Thiên Đồng nhập miếu: bốn năm người; cùng Thiên Lương: hai ba người; cùng Cự Môn mà không sát tinh: ba người; cùng Thái Âm: bốn năm người; hãm địa: chỉ hai người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp, Hoá Kỵ: ít, nên ở riêng, không hoà.',
    lianzhen:
      'Liêm Trinh nhập miếu: hai người; cùng Tham Lang dễ sinh oán; cùng Thiên Tướng: hai người; cùng Thất Sát: một người; cùng Thiên Phủ thêm Tả Hữu, Xương Khúc: ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có khắc và không hoà. Sách thêm một câu: anh chị em tình cảm hoà hợp nhưng không nhiều.',
    tianfu:
      'Thiên Phủ: năm người; cùng Tử Vi thêm Tả Hữu, Xương Khúc: sáu bảy người; cùng Liêm Trinh: ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chỉ hai người.',
    taiyin:
      'Thái Âm nhập miếu: năm người; cùng Thái Dương: cũng năm sáu người; cùng Thiên Cơ: hai người; gặp Hoá Khoa, Hoá Quyền: bốn năm người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: giảm một nửa, lại khắc, nên ở riêng.',
    tanlang:
      'Tham Lang miếu vượng: hai người; hãm địa: nên mỗi người một nơi; cùng Liêm Trinh: không hoà; cùng Tử Vi: ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cô đơn.',
    jumen:
      'Cự Môn miếu vượng: hai người; hãm địa: có người khác mẹ, nên ở riêng; cùng Thái Dương thêm Tả Hữu, Xương Khúc: ba người; cùng Thiên Cơ: hai người nhưng trái ý, không đồng lòng; cùng Thiên Đồng: hai ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cô khắc.',
    tianxiang:
      'Thiên Tướng ở mức hoà: hai ba người; gặp sát tinh: không có ai; cùng Tử Vi: ba bốn người; cùng Vũ Khúc: hai người; cùng Liêm Trinh: hai người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cô đơn.',
    tianliang:
      'Thiên Lương miếu vượng: hai người, hoà thuận; hoặc nhiều người khác mẹ và không hoà; hãm cung: không có ai; cùng Thiên Đồng: ba người; cùng Thiên Cơ: hai người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: ít.',
    qisha:
      'Thất Sát chủ cô khắc: chỉ khi ở cung Tý, Ngọ, Dần, Thân mới có ba người, cũng không hoà, nên mỗi người một nơi; thêm Xương Khúc, Tả Hữu thì tốt hơn.',
    pojun:
      'Phá Quân nhập miếu: ba người; hãm địa thêm sát tinh: cô đơn; cùng Vũ Khúc: hai người; cùng Tử Vi: hai người; cùng Liêm Trinh: một người; thêm Xương Khúc, Tả Hữu: ba người hoà thuận; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cô đơn.',
  },

  // ── 2. Phu Thê ─────────────────────────────────────────────
  the: {
    ziwei:
      'Tử Vi: lấy vợ/chồng muộn thì sống với nhau đến già, bản tính cứng. Cùng Thiên Phủ: hoà đến già; cùng Thiên Tướng: người phối ngẫu trẻ hơn; cùng Phá Quân: khắc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh cũng khắc; cùng Tham Lang mà có cát tinh thì khỏi khắc.',
    tianji:
      'Thiên Cơ: nên lấy người trẻ mà tính cương cường; vợ có thể lấy chồng lớn tuổi; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh chủ chia lìa; lấy muộn thì tốt; cùng Thiên Lương nên lấy người lớn tuổi; cùng Thái Âm: người phối ngẫu đẹp và giúp được mình.',
    taiyang:
      'Thái Dương miếu vượng: cưới muộn thì tốt, cưới sớm thì khắc; nhờ vợ/chồng mà được quý; cùng Thiên Lương thêm Tả Hữu: cưới được người hiền minh; cùng Thái Âm: người phối ngẫu giúp mình; cùng Cự Môn mà không có Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp thì không khắc — có bốn sát tinh ấy, nhất là Không Kiếp, thì khắc; gặp sao hao thì hôn nhân không theo lễ.',
    wuqu:
      'Vũ Khúc: khắc, nên cưới muộn; cùng tuổi thì cũng xứng đôi; thêm cát tinh thì nhờ vợ/chồng mà được tiền; cưới xấu thì vì vợ/chồng mà mất của; cùng Tham Lang: cưới muộn thì không khắc; cùng Thất Sát: khắc hai ba lần vợ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: càng khắc.',
    tiantong:
      'Thiên Đồng: cưới muộn thì hoà đến già; chồng nên lớn tuổi, vợ nên trẻ; thêm bốn sát tinh: không hoà, chia lìa; cùng Cự Môn thêm bốn sát tinh: cũng khắc; cùng Thái Âm: người phối ngẫu đẹp; cùng Thiên Lương: vợ chồng rất tốt.',
    lianzhen:
      'Liêm Trinh: dễ nhiều đời vợ/chồng; cùng Tham Lang càng khắc; cùng Thất Sát cũng khắc và không hoà; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh chủ chia lìa; cùng Thiên Phủ thì hoà đến già, người tính cứng cũng không khắc.',
    tianfu:
      'Thiên Phủ: vợ chồng thương yêu nhau, người phối ngẫu quý; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cưới muộn thì khỏi khắc, cưới muộn thì hoà đến già.',
    taiyin:
      'Thái Âm nhập miếu: trai gái đều đẹp đôi; thêm Xương Khúc: rất đẹp; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp, Hao, Kỵ: tuy không khắc nhưng chủ chia lìa; cùng Thái Dương: hoà đến già; cùng Thiên Đồng: người phối ngẫu giúp mình; cùng Thiên Cơ: tốt đẹp, nên lấy người trẻ.',
    tanlang:
      'Tham Lang: trai gái đều không đẹp đôi, dễ ba lần lấy vợ/chồng; nhập miếu nên cưới muộn; cùng Liêm Trinh chủ khắc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh chủ chia lìa; cùng Tử Vi thì phải lấy người lớn tuổi mới xứng.',
    jumen:
      'Cự Môn: nên lấy người lớn tuổi, dễ khắc và không hoà; cùng Thái Dương mà không có bốn sát tinh: hoà đến già; cùng Thiên Cơ: người phối ngẫu đẹp và giúp mình; cùng Thiên Đồng: người phối ngẫu thông minh, ngang sức; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chắc khắc hai đời vợ hoặc chia lìa.',
    tianxiang:
      'Thiên Tướng: người phối ngẫu đẹp, hiền; chồng nên lớn tuổi; có thể kết hôn trong họ hàng; cùng Tử Vi: hoà đến già; cùng Vũ Khúc: ít hoà; cùng Liêm Trinh nhập miếu: khỏi khắc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khắc.',
    tianliang:
      'Thiên Lương: vợ nên lớn tuổi, đẹp; cùng Thiên Đồng: hoà khí; cùng Thiên Cơ: cưới được người đẹp hiền; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: hay không thuận.',
    qisha:
      'Thất Sát: khắc sớm; cùng Vũ Khúc cũng khắc; cưới muộn thì khỏi khắc; cùng Liêm Trinh chủ chia lìa; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khắc ba đời vợ.',
    pojun:
      'Phá Quân: trai gái đều khắc, chia lìa, mỗi người một nơi; cùng Vũ Khúc: khắc ba lần; cùng Liêm Trinh cũng khắc và không hoà; cùng Tử Vi: nên lấy người lớn tuổi.',
  },

  // ── 3. Tử Nữ ───────────────────────────────────────────────
  tu: {
    ziwei:
      'Tử Vi miếu vượng: ba trai hai gái; thêm Tả Hữu, Xương Khúc: năm người; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chỉ một đôi, hoặc phần lớn do vợ lẽ sinh, hoặc nhận con nuôi làm trưởng; cùng Phá Quân: ba người; cùng Thiên Phủ thêm cát tinh: bốn năm người; thêm Xương Khúc, Tả Hữu: có con quý; nếu đứng một mình lại thêm Không Kiếp: như vua lẻ ngôi, cô độc.',
    tianji:
      'Thiên Cơ miếu vượng: hai người, hoặc sinh thêm ngoài giá thú; cùng Cự Môn: một người; cùng Thiên Lương ở cung Dần: hai ba người; ở Thân: gái nhiều trai ít, chỉ một con trai; cùng Thái Âm: hai ba người; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không có con.',
    taiyang:
      'Thái Dương nhập miếu: ba trai hai gái, con muộn thì quý; cùng Cự Môn: ba người; cùng Thái Âm: năm người; hãm địa: có ba con nhưng không nên người; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chỉ còn một con để nương tựa lúc cuối.',
    wuqu:
      'Vũ Khúc: chủ một con, có khi sinh được nhiều; cùng Phá Quân chủ khắc, chỉ một người; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: tuyệt tự; cùng Tham Lang: muộn mới có hai con; cùng Thiên Tướng: trước nhận con ngoài, sau sinh một con; cùng Thất Sát: cô độc hoặc con tàn tật.',
    tiantong:
      'Thiên Đồng miếu vượng: năm con, có con quý; cùng Cự Môn: ba người; cùng Thái Âm: năm người; ở Ngọ hãm địa: giảm một nửa; cùng Thiên Lương: trước gái sau trai, hai con; đóng ở Thân: chỉ còn một con nương tựa; ở Dần thêm cát tinh: ba con; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có khắc, con ít, cuối đời chỉ một con.',
    lianzhen:
      'Liêm Trinh: một con; cùng Thiên Phủ: chủ ba con quý; nếu cùng Tham Lang, Phá Quân, Thất Sát: cô độc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không con; cùng Thiên Tướng: hai con.',
    tianfu:
      'Thiên Phủ: năm con; cùng Vũ Khúc: hai người; cùng Tử Vi: bốn năm người; cùng Liêm Trinh: ba người; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chỉ ba người.',
    taiyin:
      'Thái Âm: ba gái hai trai, trước gái sau trai; miếu vượng: có con quý; hãm địa: giảm nửa, con yếu ớt hoặc chỉ đẹp mã mà không nên người; cùng Thái Dương: năm người; cùng Thiên Cơ: hai người; cùng Thiên Đồng: năm người; miếu địa không khắc, hãm cung có khắc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: con ít.',
    tanlang:
      'Tham Lang miếu vượng: hai con, sớm có khắc; cùng Tử Vi: hai người; cùng Liêm Trinh: con ít; nếu chiếm tinh thì hai người; cùng Vũ Khúc: ba người, trước khó sau dễ.',
    jumen:
      'Cự Môn nhập miếu: hai con (bản chép “二入”), trước khó sau dễ; cùng Thái Dương: một hai con, dễ nuôi; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: con ít; cùng Thiên Cơ: một người; có cát tinh cùng cung: hai người; thêm Không Kiếp: không con.',
    tianxiang:
      'Thiên Tướng: không có Kình Dương, Đà La, Hoả Tinh, Linh Tinh cùng cung thì hai con nên người; có sát tinh: trước nhận con nuôi làm trưởng, sau sinh một hai con; cùng Tử Vi và có Xương Khúc, Tả Hữu: ba bốn người; cùng Vũ Khúc: ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chắc khắc, nên để vợ lẽ sinh.',
    tianliang:
      'Thiên Lương miếu vượng: hai con; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khắc sớm; cùng Thiên Đồng thêm Xương Khúc, Tả Hữu, cát tinh: ba người; cùng Thiên Cơ: hai người; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không con.',
    qisha:
      'Thất Sát: chủ cô độc, chỉ một con; cùng Tử Vi thêm cát tinh: ba người; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không con; dù có cũng không nên người, ắt ngang ngược phá nhà.',
    pojun:
      'Phá Quân nhập miếu: ba con, tính cương cường; cùng Tử Vi: ba người; cùng Vũ Khúc thêm Xương Khúc, Tả Hữu: ba người; cùng Liêm Trinh: một người; gặp Kình Dương mà có chế: ít con; không chế mà gặp Không Kiếp, Hoả Tinh, Đà La: ít con.',
  },

  // ── 4. Tài Bạch ────────────────────────────────────────────
  tai: {
    ziwei:
      'Tử Vi: đầy đủ, kho đầy; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không vượng; cùng Phá Quân: trước khó sau dễ; cùng Thiên Tướng: tiền của tích được; cùng Thiên Phủ: giàu suốt đời, giữ được; thêm Tả Hữu: quan về tiền của; cùng Thất Sát thêm cát tinh: tiền của phát mạnh.',
    tianji:
      'Thiên Cơ: nhọc lòng mới ra tiền; cùng Cự Môn: cầu tài trong chỗ ồn ào; cùng Thiên Lương: khéo tính kế, được tiền ngoài; cùng Thái Âm mà hãm cung: thành bại; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cả đời có thành có bại.',
    taiyang:
      'Thái Dương nhập miếu: đầy đủ; hãm cung: nhọc mà không thành; cùng Thái Âm thêm Tả Hữu, cát tinh: phát tài không nhỏ; cùng Lộc Tồn: nhọc lòng mà được tiền, rất giàu; cùng Cự Môn: sớm thành bại, giữa đời chưa đầy.',
    wuqu:
      'Vũ Khúc: đầy đủ, hoá cát thì có gia tài vạn lượng; không có cát tinh thì kiếm tiền trong chỗ ồn ào; cùng Phá Quân: đi đông về tây, trước không sau có; cùng Thiên Tướng: tiền của dồi dào, gặp quý nhân mà sinh tài, gây dựng được nhà; cùng Thất Sát: tay trắng làm nên; cùng Tham Lang: ba mươi năm sau mới phát; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: không tụ được, rất sợ Không Vong.',
    tiantong:
      'Thiên Đồng: tay trắng làm ra tiền, muộn mới phát; cùng Cự Môn: tiền của lúc được lúc mất; cùng Thiên Lương: tiền rất vượng; thêm bốn sát tinh, Không Kiếp: người làm nghề tầng lớp thấp cũng sinh tài gây dựng nhà.',
    lianzhen:
      'Liêm Trinh: ở cung Thân, Dần thì sinh tài trong chỗ ồn ào; hãm cung: trước khó sau dễ; cùng Tham Lang: phát mạnh rồi mất mạnh; gặp Hoả Tinh, Kình Dương: rất dễ phát tiền ngang; cùng Thất Sát: cầu tài trong chỗ ồn ào; cùng Thiên Tướng: đầy đủ kho đầy; nếu gặp Hao, Kiếp, Thiên Không: thường mất tiền nơi công quyền.',
    tianfu:
      'Thiên Phủ: giàu có; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có thành có bại; cùng Tử Vi: tích được nhiều; cùng Liêm Trinh, Vũ Khúc thêm Hoá Quyền, Hoá Lộc: ông giàu xa hoa.',
    taiyin:
      'Thái Âm nhập miếu: giàu đầy kho; hãm cung: thành bại không tụ; cùng Thái Dương: trước ít sau nhiều; cùng Thiên Cơ: tay trắng làm ra tiền, gây dựng nhà; cùng Thiên Đồng: tiền vượng, nuôi được thân; cùng Lộc Tồn và Tả Hữu: chủ rất giàu.',
    tanlang:
      'Tham Lang miếu vượng: phát mạnh; hãm địa: nghèo; cùng Tử Vi: giữ được cái sẵn có, về sau gia sản càng đầy; gặp Hoả Tinh: ba mươi năm đầu thành bại, ba mươi năm sau phát mạnh.',
    jumen:
      'Cự Môn: tay trắng sinh tài gây nhà, nên cầu tài nơi ồn ào; người khí cao thì mất mạnh; cùng Thái Dương nhập miếu: giữ được cơ nghiệp; cùng Thiên Cơ: tiền nuôi thân, làm nhiều nghề; cùng Thiên Đồng: tay trắng gây nhà, người nghề thấp thì tốt; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: mất tiền nhiều cách.',
    tianxiang:
      'Thiên Tướng: giàu đủ; cùng Tử Vi: tiền vào mạnh; cùng Vũ Khúc thêm bốn sát tinh: trăm nghề sinh tài; cùng Liêm Trinh: buôn bán sinh tài; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp, Hao, Kỵ: thành bại, không tích được.',
    tianliang:
      'Thiên Lương: giàu đủ; nhập miếu: phú quý bậc trên; hãm cung: nhọc nhằn kiếm ăn; cùng Thiên Đồng: tay trắng sinh tài, giỏi hơn tổ nghiệp; cùng Thiên Cơ: nhọc lòng ra sức mà phát không nhiều, phải thay đổi mới gây được nhà; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: trước khó sau dễ, chỉ đủ ăn.',
    pojun:
      'Phá Quân ở cung Tý, Ngọ: thường có vàng bạc châu báu tích được; cung Thìn, Tuất vượng: tiền cũng thịnh; hãm cung: phá mất nghiệp tổ, không tụ; cùng Vũ Khúc đóng ở Tỵ, Hợi: đi đông về tây; cùng Tử Vi: trước mất sau có; cùng Liêm Trinh: nhọc nhằn sinh tài, trước khó sau thành; thêm Không Kiếp: rất nghèo.',
  },

  // ── 5. Tật Ách ─────────────────────────────────────────────
  tat: {
    ziwei:
      'Tử Vi: tai nạn ít; cùng Thiên Phủ: cũng ít; cùng Thiên Tướng: nhọc nhằn da thịt; nếu thêm Phá Quân: khí huyết không hoà; cùng Kình Dương, Linh Tinh: chủ bệnh ngầm; thêm Không Kiếp: chủ bệnh lâu, bệnh tim khí.',
    tianji:
      'Thiên Cơ: thuở nhỏ nhiều tai; hãm địa: đầu mặt bị thương, có sẹo; cùng Cự Môn: bệnh khí huyết; cùng Thiên Lương: bệnh phần dưới; cùng Thái Âm: bệnh mụn nhọt; thêm Hoả Tinh, Kình Dương ở hãm cung: bệnh mắt, tay chân yếu.',
    taiyang:
      'Thái Dương: bệnh đau đầu; cùng Thái Âm thêm Hoá Kỵ, Kình Dương, Đà La: chủ mắt bị thương; hãm cung cũng chủ bệnh mắt, kém sáng.',
    wuqu:
      'Vũ Khúc: thuở nhỏ nhiều tai, tay chân đầu mặt bị thương; cùng Kình Dương, Đà La: cả đời thường có tai; cùng Thiên Tướng: sinh bệnh ngầm; cùng Thất Sát: bệnh máu; cùng Tham Lang mà miếu vượng: không bệnh; hãm địa thêm bốn sát tinh: bệnh mắt, tay chân, trĩ, lở ngứa.',
    tiantong:
      'Thiên Đồng nhập miếu: ít tai; cùng Cự Môn: bệnh tim khí; cùng Thái Âm thêm Hoả Tinh, Kình Dương: bệnh khí huyết; cùng Thiên Lương thêm bốn sát tinh: bệnh tim khí.',
    lianzhen:
      'Liêm Trinh: thuở nhỏ tai nạn, mụn nhọt, bệnh lưng chân; nhập miếu thêm cát tinh: yên; gặp Tham Lang cùng cung, hãm địa: bệnh mắt, nhiều tai; cùng Thất Sát, Phá Quân, Thiên Phủ: ít tai.',
    tianfu:
      'Thiên Phủ: ít tai, gặp nạn thì có cứu; cùng Tử Vi: ít tai; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có bệnh phong; cùng Liêm Trinh thêm Kiếp, sát, Không Vong: nửa đường tàn tật.',
    taiyin:
      'Thái Âm miếu vượng: không tai; hãm địa: nhiều tai, chủ bệnh nhọc tổn; đàn bà chủ tàn tật nặng; nếu cùng Thái Dương thêm cát tinh: đẹp, cả đời ít tai; Kình Dương, Đà La, Hoả Tinh, Linh Tinh: bệnh mắt; thêm Không Kiếp: bệnh phong; cùng Thiên Đồng thêm Kình Dương, Đà La, hãm cung: bệnh nặng; cùng Hoả Tinh, Linh Tinh: nhiều tai.',
    jumen:
      'Cự Môn: thuở nhỏ tai nạn mủ máu; cùng Thái Dương: đau đầu, ung nhọt; cùng Thiên Đồng: bệnh phần dưới, chủ phong; thêm Hoả Tinh, Kình Dương: bệnh do rượu; thêm Hoá Kỵ: lo bệnh tai mắt.',
    tianxiang:
      'Thiên Tướng: ít tai; mặt vàng phù, bệnh khí huyết; cùng Tử Vi: ít tai; cùng Vũ Khúc thêm bốn sát tinh: mặt bị thương; cùng Liêm Trinh thêm Không Kiếp: tay chân bị thương.',
    qisha:
      'Thất Sát: nhỏ nhiều tai, lớn lên chủ bệnh trĩ; cùng Vũ Khúc thêm bốn sát tinh: tay chân tàn tật; cùng Liêm Trinh: bệnh mắt; thêm Kình Dương: tay chân có tàn tật.',
    pojun:
      'Phá Quân: nhỏ bị lở ngứa, mủ máu, vàng gầy; cùng Vũ Khúc: bệnh mắt; cùng Tử Vi: ít tai; cùng Liêm Trinh thêm Kình Dương, Hoả Tinh: tay chân tàn tật.',
  },

  // ── 6. Thiên Di ────────────────────────────────────────────
  di: {
    ziwei:
      'Tử Vi cùng Tả Hữu: ra ngoài có quý nhân nâng đỡ, phát phúc; cùng Thiên Phủ: đi lại thông đạt; cùng Thiên Tướng: ở ngoài phát tài; cùng Phá Quân: quý nhân thương, kẻ tiểu nhân không đủ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: ở ngoài không yên.',
    tianji:
      'Thiên Cơ: ra ngoài gặp quý nhân, ở nhà có thị phi; cùng Cự Môn: động thì tốt; cùng Thiên Lương: ra ngoài như ý; cùng Thái Âm: bận rộn mà tốt; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: ở ngoài nhiều thị phi, thân không yên.',
    taiyang:
      'Thái Dương: nên ra ngoài phát phúc, không chịu yên một chỗ; cùng Thái Âm: ra ngoài bận mà tốt; cùng Cự Môn: nhọc lòng; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: ở ngoài thân tâm không nhàn.',
    wuqu:
      'Vũ Khúc: tiền vào trong chỗ ồn ào, không nên yên một chỗ; cùng Tham Lang: làm thương nhân lớn; cùng Thất Sát, Phá Quân: thân tâm không yên; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: ở ngoài chuốc thị phi.',
    tiantong:
      'Thiên Đồng: ra ngoài có quý nhân nâng đỡ; cùng Cự Môn: nhọc lòng; cùng Thái Âm: vất vả; cùng Thiên Lương: quý nhân thương; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: ở ngoài ít như ý.',
    lianzhen:
      'Liêm Trinh: ra ngoài thông đạt, gần quý nhân, ở nhà ít ngày; cùng Tham Lang: đứng được trong chỗ ồn ào; cùng Thất Sát: ở ngoài kiếm được nhiều tiền; cùng Thiên Tướng: động thì tốt; thêm Kình Dương, Đà La và ba phương có hung sát: chết ngoài đường.',
    tianfu:
      'Thiên Phủ: ra ngoài có quý nhân nâng đỡ; cùng Tử Vi: phát phúc; cùng Liêm Trinh, Vũ Khúc: kiếm tiền trong chỗ ồn ào, làm thương nhân lớn.',
    taiyin:
      'Thái Âm nhập miếu: ra ngoài gặp quý nhân, phát tài; hãm cung: chuốc thị phi; cùng Thái Dương: rất tốt; cùng Thái Âm (bản chép trùng tên): thiếu yên tĩnh; cùng Thiên Đồng ở miếu vượng: ra ngoài tay trắng sinh tài, gây dựng nhà.',
    tanlang:
      'Tham Lang đứng một mình: ở ngoài nhọc nhằn, trong chỗ ồn ào phát tiền ngang; cùng Liêm Trinh thêm bốn sát tinh: ở ngoài gian nan; cùng Vũ Khúc: làm thương nhân lớn; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp, Hao, sát: lưu niên bị cướp bóc.',
    jumen:
      'Cự Môn: ra ngoài nhọc lòng không yên, với người không đủ, nhiều thị phi; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: càng nặng.',
    tianxiang:
      'Thiên Tướng: ra ngoài có quý nhân nâng đỡ; cùng Tử Vi: tốt lành; cùng Vũ Khúc: ở ngoài phát tài; cùng Liêm Trinh thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: chuốc thị phi, kẻ tiểu nhân không đủ.',
    tianliang:
      'Thiên Lương: ra ngoài gần quý nhân, được quý nhân thành tựu; cùng Thiên Đồng: phúc dày; cùng Thiên Cơ: đi theo đường nghề thuật.',
    qisha:
      'Thất Sát: ở ngoài nhiều ngày, ở nhà ít; cùng Vũ Khúc: động thì tốt; cùng Liêm Trinh: ở ngoài sinh tài; cùng Tử Vi: ở ngoài nhiều như ý; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: lại nhọc lòng không yên hoặc lang bạt chân trời.',
    pojun:
      'Phá Quân: ra ngoài nhọc lòng không yên; nhập miếu: ở ngoài hiển hách; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: chạy vạy khéo léo trên đường; thêm Văn Xương, Văn Khúc, Vũ Khúc cùng hội: người làm nghề hát xướng.',
  },

  // ── 7. Giao Hữu ────────────────────────────────────────────
  no: {
    ziwei:
      'Tử Vi: thành hàng, được lực; vượng: chủ sinh tài; thêm Kình Dương, Hoả Tinh, Linh Tinh, Đà La: thiếu lực; cùng Phá Quân: trước khó sau có người; cùng Thiên Tướng: được lực; thêm Không Kiếp: chuốc oán, bỏ đi.',
    tianji:
      'Thiên Cơ nhập miếu: được lực; hãm, Không: oán chủ; cùng Thiên Lương: muộn mới có; cùng Thái Âm: thiếu lực; cùng Cự Môn thêm cát tinh: có người ở; thêm Kình, Đà, Hoả Tinh, Linh Tinh, Không Kiếp: rất khó.',
    taiyang:
      'Thái Dương nhập miếu vượng: chủ phát; hãm cung: không phần, có cũng oán chủ, sẽ bỏ đi; cùng Thái Âm: có nhiều người; cùng Cự Môn: có nhiều người oán; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: người ở phản chủ.',
    wuqu:
      'Vũ Khúc cung vượng: không ít, một lời trăm tiếng dạ; cùng Thiên Phủ: nhiều người hầu; cùng Phá Quân: chuốc oán, sẽ bỏ đi, cuối đời mới có; cùng Thiên Tướng: được lực; cùng Thất Sát: phản chủ; cùng Tham Lang: thiếu lực.',
    tiantong:
      'Thiên Đồng: được lực, vượng; cùng Cự Môn: trước khó sau dễ; cùng Thái Âm: được lực; cùng Thiên Lương: giúp chủ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: có người ở phản chủ; nếu gặp Không Kiếp: oán chủ, bỏ đi.',
    lianzhen:
      'Liêm Trinh hãm địa: người ở phản chủ, cuối đời mới có; nhập miếu: một lời trăm tiếng dạ; cùng Tham Lang: thiếu lực; cùng Thất Sát: phản chủ; cùng Thiên Đồng: nhiều người hầu; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: không vượng, sẽ bỏ đi.',
    tianfu:
      'Thiên Phủ: được lực, một lời trăm tiếng dạ; cùng Tử Vi: giúp chủ gây nhà; cùng Vũ Khúc: có người ở; thêm Đà La, Kình Dương, Hoả Tinh, Linh Tinh, Không Kiếp: phần nhiều phản chủ, bỏ đi.',
    taiyin:
      'Thái Âm miếu địa: được lực, thành hàng; cùng Thái Dương: nhiều người hầu; cùng Thiên Cơ: thiếu lực; cùng Thiên Đồng: vượng chủ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: tuy có mà bỏ đi; hãm địa: không có ai.',
    tanlang:
      'Tham Lang: đầu tiên khó có người, dễ có người ở phá chủ; hãm địa: không có; cùng Liêm Trinh: cũng ít; cùng Tử Vi: có người hầu, thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có mà khó nuôi.',
    jumen:
      'Cự Môn nhập miếu: đầu đời không được lực, chuốc thị phi, không ở lâu; cùng Thái Dương: giúp chủ giữ nhà; cùng Thiên Đồng: một lòng; cùng Thiên Đồng (bản chép lặp): cuối đời mới có.',
    tianxiang:
      'Thiên Tướng: cuối đời mới có; cùng Tử Vi: nhiều người hầu; cùng Vũ Khúc: oán chủ; cùng Liêm Trinh: cuối đời có thể có, thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: thiếu lực, bỏ đi.',
    tianliang:
      'Thiên Lương: người ở nhiều, vượng chủ; cùng Thiên Đồng: có người ở giữ nhà; cùng Thiên Cơ: không đồng lòng.',
    qisha:
      'Thất Sát: người ở lấn chủ, có đứa ở cương cường, phần nhiều trộm của nhà; cùng Vũ Khúc: phản chủ; cùng Liêm Trinh: thiếu lực; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khó có người.',
    pojun:
      'Phá Quân nhập miếu: được lực; hãm cung: chuốc oán, phản chủ; cùng Vũ Khúc: trái lòng; cùng Tử Vi: được lực; cùng Liêm Trinh: thiếu lực; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khó có người.',
  },

  // ── 8. Sự Nghiệp ───────────────────────────────────────────
  quan: {
    ziwei:
      'Tử Vi miếu vượng gặp Tả Hữu, Xương Khúc, Khôi Việt: hiển hách, đến tước hầu bá; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: bình thường; cùng Thiên Phủ: quyền quý, danh lợi vẹn cả; cùng Thiên Tướng: quyền quý trong ngoài, thanh chính; cùng Phá Quân: yên thân trong chỗ ồn ào.',
    tianji:
      'Thiên Cơ nhập miếu: quyền quý; hội Văn Khúc: tốt; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh mới nên; cùng Thiên Lương: bậc tài văn võ; cùng Thái Âm: tiếng vang tới biên cương; hãm cung: mất chức, lui về làm việc nhỏ.',
    taiyang:
      'Thái Dương nhập miếu: văn võ đều tốt; không có Kình Dương, Đà La, Hoả Tinh, Linh Tinh thì tốt; cùng Thái Âm: quý hiển; cùng Tả Hữu, Xương Khúc, Khôi Việt, thêm Khoa, Lộc, Quyền: ắt địa vị nhất phẩm.',
    wuqu:
      'Vũ Khúc nhập miếu, cùng Xương Khúc, Tả Hữu: võ nghiệp hiển hách, người thường cũng phát phúc; hội Khoa, Quyền, Lộc: quan về tiền của; cùng Tham Lang: quan tham ô; cùng Phá Quân: xuất thân quân ngũ; cùng Thất Sát: lập công danh ngang; hãm cung và gặp Đà, Linh, Kiếp, Kỵ: không có phần công danh.',
    tiantong:
      'Thiên Đồng nhập miếu: văn võ đều nên; không Kình Dương, Đà La, Hoả Tinh, Linh Tinh thì tốt; cùng Cự Môn: trước nhỏ sau lớn; cùng Thái Dương, Xương Khúc, Khoa, Quyền, Lộc: tư chất đẹp; cùng Thái Âm: quyền quý; hãm cung: phải luận là viên chức nhỏ.',
    lianzhen:
      'Liêm Trinh nhập miếu: võ chức có quyền quý nhưng không bền; cùng Tham Lang: quyền quý trong chỗ ồn ào; cùng Tử Vi hội ba phương: chức văn; cùng Thất Sát: xuất thân quân ngũ; cùng Thiên Tướng, Thiên Phủ: áo gấm phú quý.',
    tianfu:
      'Thiên Phủ nhập miếu: văn võ đều tốt; không Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không, Hao: toàn mỹ; cùng Tử Vi: văn võ có tiếng; cùng Liêm Trinh, Vũ Khúc: quyền quý; gặp Không Kiếp: bình thường.',
    taiyin:
      'Thái Âm nhập miếu: nhiều quý; hãm địa: khí cao, phá ngang, khó hiển đạt; hội Thái Dương, Xương Khúc, Tả Hữu: quý đến tam phẩm; cùng Thiên Đồng: văn võ đều nên; cùng Thiên Cơ: tiến thân trong chỗ ồn ào, làm chức nhỏ.',
    tanlang:
      'Tham Lang nhập miếu gặp Hoả Tinh, Linh Tinh: nắm đại quyền võ; cùng Tử Vi: văn võ có quyền, quý không nhỏ; hãm cung: quan tham ô; thêm Kình Dương, Đà La, Không Kiếp: bình thường.',
    jumen:
      'Cự Môn nhập miếu: võ chức có quyền quý, người văn không bền; cùng Thái Dương: có tiến có lui, nhập miếu thì lâu dài; cùng Thiên Cơ ở cung Mão: tốt đẹp; ở Dậu: tuy đẹp nhưng không trọn; hãm cung: chuốc hối hận; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: càng không đẹp, mất chức.',
    tianxiang:
      'Thiên Tướng nhập miếu: văn võ đều nên, hưởng lộc ngàn chuông; hãm địa: thành bại; cùng Tử Vi: quyền quý; cùng Xương Khúc, Tả Hữu: quyền hiển vinh quý; cùng Vũ Khúc: chức ở biên cương; cùng Liêm Trinh: quyền quý hiển hách; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: bị giáng chức.',
    tianliang:
      'Thiên Lương miếu (Ngọ) hội Tả Hữu, Khôi Việt: bậc tài văn võ; cùng Thiên Đồng: quyền quý không nhỏ; cùng Thiên Cơ: hiển quý hiển hách; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: bình thường.',
    qisha:
      'Thất Sát miếu vượng: võ nghiệp hiển hách, quyền quý không nhỏ, không nên làm văn; cùng Vũ Khúc: quyền quý; cùng Liêm Trinh: công danh hiển đạt.',
    pojun:
      'Phá Quân miếu vượng: võ nghiệp hiển hách; cùng Vũ Khúc thêm Quyền, Lộc; có Văn Xương, Văn Khúc: hiển đạt; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: bình thường; cùng Tử Vi: tiếng vang; cùng Liêm Trinh: người văn không bền, làm việc nhỏ là đẹp nhất.',
  },

  // ── 9. Điền Trạch ──────────────────────────────────────────
  dien: {
    ziwei:
      'Tử Vi: ruộng vườn thịnh, tự mua được, vượng; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có mua có mất; cùng Phá Quân: mất nghiệp tổ; cùng Thiên Tướng: có cơ nghiệp sẵn; được Tả Hữu, Xương Khúc.',
    tianji:
      'Thiên Cơ: mất nghiệp tổ, tự gây dựng; cùng Cự Môn ở cung Mão: có ruộng; ở Dậu: không giữ nghiệp tổ, trước lớn sau nhỏ; cùng Thiên Lương: có của, cuối đời giàu; cùng Thái Âm: tự mua, vượng.',
    taiyang:
      'Thái Dương nhập miếu: được nghiệp tổ, đầu vượng sau lắng; cùng Thái Âm thêm cát tinh: nhiều ruộng; cùng Cự Môn ở Dần: thịnh vượng; ở Thân: mất nghiệp tổ nhưng không phải không có ruộng; hãm địa gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không có gì.',
    wuqu:
      'Vũ Khúc đứng một mình ở cung vượng: được nghiệp lớn của ông cha; hãm địa: lui về sau mới thành; cùng Phá Quân, Đại Hao: phá tan gia sản, có cũng không bền; cùng Thiên Tướng: trước thấy mất sau mới có; cùng Thất Sát: lòng không muốn; cùng Thiên Phủ: giữ được cơ nghiệp; cùng Tham Lang: muộn mới mua; gặp Hoả Tinh, Linh Tinh: rất tốt, ruộng vườn thịnh; cùng Không Kiếp: có tiến có lui.',
    tiantong:
      'Thiên Đồng: trước ít sau nhiều, tự mua rất vượng; cùng Cự Môn: ruộng ít; cùng Thái Âm nhập miếu: rất giàu; cùng Thiên Lương: trước mất sau có; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không, Kỵ: không có gì.',
    lianzhen:
      'Liêm Trinh: phá nghiệp tổ; cùng Tham Lang: có nghiệp tổ nhưng không bền; cùng Thất Sát: tự mua; cùng Thiên Phủ: giữ được cơ nghiệp; cùng Thiên Tướng: trước không sau có.',
    tianfu:
      'Thiên Phủ: ruộng vườn thịnh, giữ nghiệp tổ, tự mua vượng; cùng Tử Vi: rất giàu; cùng Liêm Trinh, Vũ Khúc: giữ nghiệp tổ, vinh thịnh; gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: càng ít, có thành bại.',
    taiyin:
      'Thái Âm nhập miếu: nhiều ruộng; hãm địa thêm Kỵ và Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không có ruộng; cùng Thiên Cơ: tự tạo lập; cùng Thiên Đồng: tay trắng tự mua; cùng Tả Hữu, Quyền, Lộc và Lộc Tồn: chủ nhiều ruộng.',
    tanlang:
      'Tham Lang hãm cung: mất nghiệp tổ, cả đời ít ruộng; miếu vượng: có nghiệp tổ, cũng mất dần nhưng tự mua được; cùng Liêm Trinh: không phần; cùng Tử Vi: có nghiệp tổ; cùng Vũ Khúc: muộn mua; gặp Hoả Tinh, Linh Tinh: giữ nghiệp tổ, có tự tạo nhưng e lửa cháy nhà.',
    jumen:
      'Cự Môn miếu vượng: phát mạnh, mua sắm; hãm địa: không phần, vì ruộng đất mà chuốc thị phi; cùng Thái Dương: trước không sau có; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không có nhà cửa ruộng vườn.',
    tianxiang:
      'Thiên Tướng miếu vượng: có phần; cùng Tử Vi: tự mua; cùng Vũ Khúc: không phần; cùng Liêm Trinh thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: nghiệp tổ lìa tan.',
    tianliang:
      'Thiên Lương nhập miếu vượng: có nghiệp tổ; cùng Thiên Đồng: trước khó sau dễ; cùng Thiên Cơ mà không gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: rốt cuộc có nhà cửa.',
    pojun:
      'Phá Quân ở cung Tý, Ngọ: giữ nghiệp tổ vinh thịnh nhưng có tiến lui; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: mất nghiệp tổ, ruộng ít; cùng Tử Vi: có cơ nghiệp sẵn; cùng Liêm Trinh: trước phá sau mua; gặp Hao, Kỵ: không có gì.',
  },

  // ── 10. Phúc Đức ───────────────────────────────────────────
  phuc: {
    ziwei:
      'Tử Vi: phúc dày, hưởng an lạc; cùng Thiên Phủ, Thiên Tướng: cả đời được tốt; cùng Phá Quân: nhọc lòng, không yên; thêm Kình Dương, Đà La, Linh Tinh, Không Kiếp: phúc mỏng; cùng Thiên Cơ: hưởng phúc cả đời.',
    tianji:
      'Thiên Cơ: trước nhọc sau nhàn; cùng Cự Môn: nhọc sức, không yên; cùng Thiên Lương: hưởng phúc; cùng Thái Âm: chủ vui vẻ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chạy vạy không yên.',
    taiyang:
      'Thái Dương: bận rộn mà phát phúc; cùng Thái Âm: vui vẻ; cùng Cự Môn: nhọc sức, không yên; cùng Thiên Lương: vui vẻ; đàn bà hội cát tinh: lấy được chồng hiền minh, hưởng phúc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp, Kỵ, Hao: cả đời không đẹp.',
    wuqu:
      'Vũ Khúc: nhọc lòng nhọc sức; nhập miếu: yên ổn hưởng phúc; cùng Phá Quân: đi đông về tây, không yên; cùng Thiên Tướng: tuổi già an khang; cùng Thất Sát: không được an; cùng Tham Lang: cuối đời hưởng phúc; gặp Hoả Tinh, Linh Tinh: nhàn; thêm Kình Dương, Đà La: nhọc lòng mới được.',
    tiantong:
      'Thiên Đồng: vui vẻ, có phúc có thọ; cùng Cự Môn: nhiều lo ít mừng; cùng Thái Âm: hưởng phúc; cùng Thiên Lương: thanh nhàn vui vẻ.',
    lianzhen:
      'Liêm Trinh đứng một mình: trong bận rộn sinh phúc; cùng Thiên Tướng: có phúc có thọ; cùng Thiên Phủ: an lạc không lo; cùng Phá Quân: không giữ yên, nhọc lòng nhọc sức; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: nhọc khổ cả đời, cuối đời mới như ý.',
    tianfu:
      'Thiên Phủ: yên tĩnh hưởng phúc; cùng Tử Vi: vui vẻ; cùng Liêm Trinh: thân yên mà lòng bận; cùng Vũ Khúc: đầu đời càng vất vả, trung niên an lạc hưởng phúc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp, Hao, Kỵ: nhọc khổ qua ngày.',
    taiyin:
      'Thái Âm nhập miếu: hưởng phúc vui vẻ; cùng Thái Dương: rất đẹp; người tu hành cũng thanh khiết hưởng phúc; cùng Thiên Cơ: lòng bận; cùng Thiên Đồng: yên ổn không lo; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: có lo có mừng, không được yên.',
    tanlang:
      'Tham Lang: nhọc lòng không yên; cùng Liêm Trinh: phúc mỏng; cùng Tử Vi: cuối đời vui vẻ.',
    jumen:
      'Cự Môn: nhọc sức không yên; cùng Thái Dương: có lo có mừng; cùng Thiên Cơ: lòng bận không yên; cùng Thiên Đồng: hưởng phúc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cả đời nhiều lo.',
    tianxiang:
      'Thiên Tướng: yên nhàn, hưởng phúc có thọ; cùng Tử Vi: vui vẻ; cùng Thiên Cơ: bận mà tốt; cùng Thái Dương: phúc thọ vẹn đôi, thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: không được yên lòng.',
    qisha:
      'Thất Sát nhập miếu: hưởng phúc; hãm địa thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: nhọc lòng nhọc sức; cùng Vũ Khúc: không an; cùng Liêm Trinh: vất vả; cùng Tử Vi: trước nhọc sau nhàn, cuối đời mới như ý; đàn bà đứng một mình ở cung Phúc Đức thì ắt phải làm thân tôi đòi.',
    pojun:
      'Phá Quân: nhọc lòng nhọc sức; cùng Vũ Khúc: không an; cùng Liêm Trinh: vất vả; cùng Tử Vi: an lạc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: bận tâm, không được yên.',
  },

  // ── 11. Phụ Mẫu ────────────────────────────────────────────
  phu: {
    ziwei:
      'Tử Vi: không khắc; cùng Thiên Phủ: cũng không hình; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cũng khắc; cùng Thiên Tướng: không hình; cùng Tham Lang mà không sát tinh: cũng không hình; cùng Phá Quân: khắc sớm.',
    tianji:
      'Thiên Cơ miếu vượng: không hình; hãm địa gặp Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: ở nhờ họ khác, phải nhận cha mẹ lần hai, hoặc đi ở rể; cùng Thái Âm: khỏi hình; cùng Thiên Lương: không hình; đều cần không có sát tinh, nếu có sát tinh thì không khỏi hình thương; cùng Cự Môn: khắc sớm.',
    taiyang:
      'Thái Dương nhập miếu: không khắc; hãm địa: khắc cha; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khắc cha mẹ sớm; cùng Thái Âm: xem như không có; Kình Dương, Đà La tụ lại: cha mẹ đều bị hình muộn; cùng Cự Môn thêm bốn sát tinh, Không Kiếp: khắc sớm; cùng Thiên Lương: không hình.',
    wuqu:
      'Vũ Khúc: khắc sớm; mất nghiệp tổ mà không hình; cùng Tham Lang: hình khắc; cùng Thất Sát: có hình; cùng Thiên Tướng thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: hình thương.',
    tiantong:
      'Thiên Đồng đứng một mình miếu vượng: không hình; thêm bốn sát tinh: phải nhận cha mẹ lần hai; cùng Cự Môn: không hoà; cùng Thái Âm: cha mẹ vẹn cả; cùng Thiên Lương: không hình hoặc mất nghiệp tổ; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cha mẹ không vẹn toàn.',
    lianzhen:
      'Liêm Trinh: khó làm cha mẹ, phải nhận lần hai; cùng Tham Lang: khắc sớm; cùng Thất Sát: cô khắc; cùng Thiên Phủ: khỏi hình; cùng Phá Quân: khắc sớm; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cha mẹ không vẹn toàn.',
    tianfu:
      'Thiên Phủ: cha mẹ vẹn cả; cùng Tử Vi: cũng không hình; cùng Liêm Trinh, Vũ Khúc ở miếu vượng: không hình; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: chủ thương tổn.',
    taiyin:
      'Thái Âm nhập miếu: không khắc; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: khắc mẹ, không thì đi ở nhà khác, bỏ nghiệp tổ; cùng Thái Dương mà không bốn sát tinh: cha mẹ vẹn cả; cùng Thiên Cơ: không hình; cùng Thiên Đồng: rất tốt.',
    tanlang:
      'Tham Lang hãm địa: sớm bỏ nghiệp tổ, phải nhận cha mẹ lần hai, đi ở rể; cùng Liêm Trinh: khắc sớm, chủ cô đơn; cùng Tử Vi mà không sát tinh thêm: vẹn cả.',
    jumen:
      'Cự Môn hãm địa: thương khắc, bỏ nghiệp tổ, đi ở nhà khác; cùng Thái Dương: ít hoà; cùng Thiên Cơ: phải nhận lần hai; cùng Thiên Đồng: hoặc mất nghiệp tổ mà không hình; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cha mẹ không vẹn toàn.',
    tianxiang:
      'Thiên Tướng miếu vượng: không hình; cùng Tử Vi: không hình khắc; cùng Liêm Trinh: cũng hình; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: khắc sớm.',
    tianliang:
      'Thiên Lương hãm địa: thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh: cô khắc, bỏ nghiệp tổ, đi ở rể, đổi tên gửi người, phải nuôi dưỡng mới khỏi hình; cùng Thiên Đồng thêm bốn sát tinh: có hình, không sát tinh thì không hình; cùng Thiên Cơ: không hình; cùng Thái Dương: khắc muộn; thêm bốn sát tinh, Không Kiếp: cũng khắc sớm.',
    qisha:
      'Thất Sát: khắc sớm, lìa tổ, anh em ruột thịt cô độc; cùng Vũ Khúc: cũng hình; cùng Liêm Trinh: khắc sớm; cùng Tử Vi thêm cát tinh: không hình; thêm Kình Dương, Đà La, Hoả Tinh, Linh Tinh, Không Kiếp: cha mẹ không vẹn toàn.',
    pojun:
      'Phá Quân: khắc sớm, lìa tổ; đổi tên gửi nuôi thì khỏi hình; cùng Vũ Khúc: khắc sớm; cùng Liêm Trinh: cũng khắc sớm; cùng Tử Vi: không hình.',
  },
};

// ── Cắt nguyên văn ───────────────────────────────────────────
const text = readFileSync(ZW, 'utf8');
const segments = JSON.parse(readFileSync('corpus/ziwei-quanshu.segments.json', 'utf8')).segments;
const segOf = (idx) => segments.find((s) => idx >= s.start && idx < s.end)?.locator ?? '?';

const mainHeads = STARS.map(([id, zh]) => ({ id, zh }));

function extract(palace) {
  const body = text.slice(palace.start, palace.end).split(/\r?\n/);
  const entries = new Map();
  let current = null;
  let offset = palace.start;
  for (const raw of body) {
    const at = offset;
    offset += raw.length + 1;
    const line = raw.trim();
    if (!line || line.startsWith('===')) continue;
    if (OTHER_HEADS.some((h) => line.startsWith(h))) {
      current = null;
      continue;
    }
    const head = mainHeads.find((h) => line.startsWith(h.zh));
    if (head) {
      // "X同…" là câu nối của mục trước (X ở cùng cung), không phải mục mới.
      if (/^同/.test(line.slice(head.zh.length)) && current) {
        current.text += line;
        continue;
      }
      if (!entries.has(head.id)) {
        current = { id: head.id, text: line, at };
        entries.set(head.id, current);
        continue;
      }
      if (current) current.text += line;
      continue;
    }
    if (current) current.text += line;
  }
  return entries;
}

// ── Ghi câu trích ────────────────────────────────────────────
const quotes = readFileSync(QUOTES, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const nextId = () =>
  `q_tv_${String(Math.max(0, ...quotes.map((q) => Number(q.id.slice(5)))) + 1).padStart(4, '0')}`;

function upsert(text_zh, claim_vi, locator) {
  const existing = quotes.find((q) => q.text_zh === text_zh);
  if (existing) {
    existing.claim_vi = claim_vi;
    existing.locator = locator;
    return { id: existing.id, added: false };
  }
  const quote = { id: nextId(), source: 'ziwei-quanshu', text_zh, claim_vi, locator };
  quotes.push(quote);
  return { id: quote.id, added: true };
}

let added = 0;
const palaces = [];
for (const palace of PALACES) {
  const entries = extract(palace);
  const stars = {};
  const missing = [];
  for (const [starId, zh] of STARS) {
    const entry = entries.get(starId);
    if (!entry) {
      missing.push(starId);
      continue;
    }
    const vi = VI[palace.key]?.[starId];
    if (!vi) throw new Error(`${palace.key}.${starId}: chưa có bản dịch trong VI`);
    if (!entry.text.startsWith(zh)) throw new Error(`${palace.key}.${starId}: đoạn cắt sai sao`);
    const res = upsert(entry.text, vi, segOf(entry.at));
    if (res.added) added++;
    stars[starId] = res.id;
  }
  if (missing.length) {
    // Sách không chép mục cho sao này ở cung này — ghi ra để cổng kiểm biết là cố ý.
    console.log(`  ${palace.vi}: thiếu ${missing.join(', ')} (nguồn không chép)`);
  }
  palaces.push({
    id: palace.id,
    zh: palace.zh,
    vi: palace.vi,
    locator: `卷二 · ${palace.section}`,
    stars,
    missing,
  });
}

writeFileSync(
  'content/star-in-palace.json',
  JSON.stringify(
    {
      version: 1,
      $comment:
        'Chính tinh tại từng cung, sinh từ 紫微斗數全書 卷二 (các mục 二 兄弟 … 十二 父母). ' +
        'Cung Mệnh dùng câu định nghĩa sao ở 卷一. Chạy scripts/gen-star-in-palace.mjs để dựng lại.',
      source: 'ziwei-quanshu',
      palaces,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

writeFileSync(QUOTES, quotes.map((q) => JSON.stringify(q)).join('\n') + '\n', 'utf8');
console.log(
  `star-in-palace.json: ${palaces.length} cung · ${palaces.reduce((n, p) => n + Object.keys(p.stars).length, 0)} câu`,
);
console.log(`câu mới: ${added} · tổng kho: ${quotes.length}`);
