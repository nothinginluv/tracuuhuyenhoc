/** Hằng số dùng chung: can, chi, tên sao, tên cung. */

export const STEMS_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;

export const BRANCHES_ZH = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;
export const BRANCHES_VI = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
] as const;

/** 12 cung, theo thứ tự nghịch từ cung Mệnh. */
export const PALACE_NAMES = [
  { zh: '命宮', vi: 'Mệnh' },
  { zh: '兄弟', vi: 'Huynh Đệ' },
  { zh: '夫妻', vi: 'Phu Thê' },
  { zh: '子女', vi: 'Tử Nữ' },
  { zh: '財帛', vi: 'Tài Bạch' },
  { zh: '疾厄', vi: 'Tật Ách' },
  { zh: '遷移', vi: 'Thiên Di' },
  { zh: '交友', vi: 'Giao Hữu' },
  { zh: '官祿', vi: 'Sự Nghiệp' },
  { zh: '田宅', vi: 'Điền Trạch' },
  { zh: '福德', vi: 'Phúc Đức' },
  { zh: '父母', vi: 'Phụ Mẫu' },
] as const;

export type StarGroup = 'main' | 'aux';

export type StarDef = {
  id: string;
  zh: string;
  vi: string;
  group: StarGroup;
};

export const STAR_DEFS = {
  // ── 14 chính tinh ─────────────────────────────────────────
  ziwei: { id: 'ziwei', zh: '紫微', vi: 'Tử Vi', group: 'main' },
  tianji: { id: 'tianji', zh: '天機', vi: 'Thiên Cơ', group: 'main' },
  taiyang: { id: 'taiyang', zh: '太陽', vi: 'Thái Dương', group: 'main' },
  wuqu: { id: 'wuqu', zh: '武曲', vi: 'Vũ Khúc', group: 'main' },
  tiantong: { id: 'tiantong', zh: '天同', vi: 'Thiên Đồng', group: 'main' },
  lianzhen: { id: 'lianzhen', zh: '廉貞', vi: 'Liêm Trinh', group: 'main' },
  tianfu: { id: 'tianfu', zh: '天府', vi: 'Thiên Phủ', group: 'main' },
  taiyin: { id: 'taiyin', zh: '太陰', vi: 'Thái Âm', group: 'main' },
  tanlang: { id: 'tanlang', zh: '貪狼', vi: 'Tham Lang', group: 'main' },
  jumen: { id: 'jumen', zh: '巨門', vi: 'Cự Môn', group: 'main' },
  tianxiang: { id: 'tianxiang', zh: '天相', vi: 'Thiên Tướng', group: 'main' },
  tianliang: { id: 'tianliang', zh: '天梁', vi: 'Thiên Lương', group: 'main' },
  qisha: { id: 'qisha', zh: '七殺', vi: 'Thất Sát', group: 'main' },
  pojun: { id: 'pojun', zh: '破軍', vi: 'Phá Quân', group: 'main' },

  // ── Phụ tinh ──────────────────────────────────────────────
  zuofu: { id: 'zuofu', zh: '左輔', vi: 'Tả Phụ', group: 'aux' },
  youbi: { id: 'youbi', zh: '右弼', vi: 'Hữu Bật', group: 'aux' },
  wenchang: { id: 'wenchang', zh: '文昌', vi: 'Văn Xương', group: 'aux' },
  wenqu: { id: 'wenqu', zh: '文曲', vi: 'Văn Khúc', group: 'aux' },
  tiankui: { id: 'tiankui', zh: '天魁', vi: 'Thiên Khôi', group: 'aux' },
  tianyue: { id: 'tianyue', zh: '天鉞', vi: 'Thiên Việt', group: 'aux' },
  lucun: { id: 'lucun', zh: '祿存', vi: 'Lộc Tồn', group: 'aux' },
  qingyang: { id: 'qingyang', zh: '擎羊', vi: 'Kình Dương', group: 'aux' },
  tuoluo: { id: 'tuoluo', zh: '陀羅', vi: 'Đà La', group: 'aux' },
  tianma: { id: 'tianma', zh: '天馬', vi: 'Thiên Mã', group: 'aux' },
  huoxing: { id: 'huoxing', zh: '火星', vi: 'Hoả Tinh', group: 'aux' },
  lingxing: { id: 'lingxing', zh: '鈴星', vi: 'Linh Tinh', group: 'aux' },
  dikong: { id: 'dikong', zh: '地空', vi: 'Địa Không', group: 'aux' },
  dijie: { id: 'dijie', zh: '地劫', vi: 'Địa Kiếp', group: 'aux' },
  tianxing: { id: 'tianxing', zh: '天刑', vi: 'Thiên Hình', group: 'aux' },
  tianyao: { id: 'tianyao', zh: '天姚', vi: 'Thiên Diêu', group: 'aux' },
  hongluan: { id: 'hongluan', zh: '紅鸞', vi: 'Hồng Loan', group: 'aux' },
  tianxi: { id: 'tianxi', zh: '天喜', vi: 'Thiên Hỷ', group: 'aux' },
  santai: { id: 'santai', zh: '三台', vi: 'Tam Thai', group: 'aux' },
  bazuo: { id: 'bazuo', zh: '八座', vi: 'Bát Toạ', group: 'aux' },
  enguang: { id: 'enguang', zh: '恩光', vi: 'Ân Quang', group: 'aux' },
  tiangui: { id: 'tiangui', zh: '天貴', vi: 'Thiên Quý', group: 'aux' },
  taifu: { id: 'taifu', zh: '台輔', vi: 'Thai Phụ', group: 'aux' },
  fenggao: { id: 'fenggao', zh: '封誥', vi: 'Phong Cáo', group: 'aux' },
} as const satisfies Record<string, StarDef>;

export type StarId = keyof typeof STAR_DEFS;

/** Bốn hoá. */
export const HUA = {
  loc: { zh: '化祿', vi: 'Hoá Lộc' },
  quyen: { zh: '化權', vi: 'Hoá Quyền' },
  khoa: { zh: '化科', vi: 'Hoá Khoa' },
  ky: { zh: '化忌', vi: 'Hoá Kỵ' },
} as const;

export type HuaKey = keyof typeof HUA;

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export function branchLabel(branch: number): string {
  return `${BRANCHES_VI[branch]} (${BRANCHES_ZH[branch]})`;
}
