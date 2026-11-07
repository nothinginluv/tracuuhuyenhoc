/**
 * Thập thần (十神).
 *
 * Năm quan hệ lấy từ 淵海子平《論日為主》:
 *   「一曰官，分之阴阳，曰官、曰杀，甲乙见庚辛也；二曰财，分之阴阳，曰正财、偏财，
 *     甲乙见戊己也；三曰生气之阴阳，曰印綬、曰倒食，甲乙见壬癸是也；四曰窃气之阴阳，
 *     曰食神、曰伤官，甲乙见丙丁是也；五曰同类之阴阳，曰劫财、曰阳刃，甲乙见甲乙是也。」
 *
 * Mỗi quan hệ chia hai theo âm/dương của can đích so với nhật chủ.
 */
import { ELEMENT_ZH, STEM_ELEMENT, isYang, mod, type Element } from './constants.ts';

export const TEN_GODS_QUOTE = 'q_bz_0005';

export type TenGodId =
  | 'ty-kiep'
  | 'kiep-tai'
  | 'thuc-than'
  | 'thuong-quan'
  | 'thien-tai'
  | 'chinh-tai'
  | 'that-sat'
  | 'chinh-quan'
  | 'thien-an'
  | 'chinh-an';

export type TenGodGroup = 'ty-kiep' | 'thuc-thuong' | 'tai' | 'quan-sat' | 'an';

export type TenGodDef = {
  id: TenGodId;
  zh: string;
  vi: string;
  group: TenGodGroup;
};

export const TEN_GODS: Record<TenGodId, TenGodDef> = {
  'ty-kiep': { id: 'ty-kiep', zh: '比肩', vi: 'Tỷ Kiên', group: 'ty-kiep' },
  'kiep-tai': { id: 'kiep-tai', zh: '劫財', vi: 'Kiếp Tài', group: 'ty-kiep' },
  'thuc-than': { id: 'thuc-than', zh: '食神', vi: 'Thực Thần', group: 'thuc-thuong' },
  'thuong-quan': { id: 'thuong-quan', zh: '傷官', vi: 'Thương Quan', group: 'thuc-thuong' },
  'thien-tai': { id: 'thien-tai', zh: '偏財', vi: 'Thiên Tài', group: 'tai' },
  'chinh-tai': { id: 'chinh-tai', zh: '正財', vi: 'Chính Tài', group: 'tai' },
  'that-sat': { id: 'that-sat', zh: '七殺', vi: 'Thất Sát', group: 'quan-sat' },
  'chinh-quan': { id: 'chinh-quan', zh: '正官', vi: 'Chính Quan', group: 'quan-sat' },
  'thien-an': { id: 'thien-an', zh: '偏印', vi: 'Thiên Ấn', group: 'an' },
  'chinh-an': { id: 'chinh-an', zh: '正印', vi: 'Chính Ấn', group: 'an' },
};

export const TEN_GOD_GROUPS: Record<TenGodGroup, { zh: string; vi: string }> = {
  'ty-kiep': { zh: '比劫', vi: 'Tỷ Kiếp' },
  'thuc-thuong': { zh: '食傷', vi: 'Thực Thương' },
  tai: { zh: '財', vi: 'Tài' },
  'quan-sat': { zh: '官殺', vi: 'Quan Sát' },
  an: { zh: '印', vi: 'Ấn' },
};

/** Vòng tương sinh: Mộc → Hoả → Thổ → Kim → Thuỷ → Mộc. */
const CYCLE: readonly Element[] = ['moc', 'hoa', 'tho', 'kim', 'thuy'];
const idx = (e: Element): number => CYCLE.indexOf(e);

/** a sinh b (cách 1 bước). */
const produces = (a: Element, b: Element): boolean => CYCLE[(idx(a) + 1) % 5] === b;
/** a khắc b (cách 2 bước). */
const controls = (a: Element, b: Element): boolean => CYCLE[(idx(a) + 2) % 5] === b;

/** Thập thần của một can, nhìn từ can ngày (nhật chủ). */
export function tenGod(dayStem: number, targetStem: number): TenGodDef {
  const day = mod(dayStem, 10);
  const target = mod(targetStem, 10);
  const de = STEM_ELEMENT[day];
  const te = STEM_ELEMENT[target];
  const samePolarity = isYang(day) === isYang(target);

  if (de === te) return TEN_GODS[samePolarity ? 'ty-kiep' : 'kiep-tai'];
  if (produces(de, te)) return TEN_GODS[samePolarity ? 'thuc-than' : 'thuong-quan'];
  if (controls(de, te)) return TEN_GODS[samePolarity ? 'thien-tai' : 'chinh-tai'];
  if (controls(te, de)) return TEN_GODS[samePolarity ? 'that-sat' : 'chinh-quan'];
  return TEN_GODS[samePolarity ? 'thien-an' : 'chinh-an'];
}

/** Mô tả quan hệ ngũ hành giữa can ngày và can đích, dạng đọc được. */
export function relationLabel(dayStem: number, targetStem: number): string {
  const de = STEM_ELEMENT[mod(dayStem, 10)];
  const te = STEM_ELEMENT[mod(targetStem, 10)];
  const samePolarity = isYang(dayStem) === isYang(targetStem);
  const yinYang = samePolarity ? 'đồng âm dương' : 'khác âm dương';
  if (de === te) return `đồng hành (${ELEMENT_ZH[de]}), ${yinYang}`;
  if (produces(de, te)) return `ta sinh (${ELEMENT_ZH[de]} → ${ELEMENT_ZH[te]}), ${yinYang}`;
  if (controls(de, te)) return `ta khắc (${ELEMENT_ZH[de]} → ${ELEMENT_ZH[te]}), ${yinYang}`;
  if (controls(te, de)) return `khắc ta (${ELEMENT_ZH[te]} → ${ELEMENT_ZH[de]}), ${yinYang}`;
  return `sinh ta (${ELEMENT_ZH[te]} → ${ELEMENT_ZH[de]}), ${yinYang}`;
}
