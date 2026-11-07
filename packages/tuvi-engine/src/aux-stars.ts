/**
 * Vị trí phụ tinh.
 *
 * Mỗi bảng dưới đây là một câu trong 安星訣; giữ nguyên câu chữ Hán ở chú thích để
 * đối chiếu được với văn bản gốc.
 */
import { mod } from './constants.ts';

export type AuxInput = {
  /** Tháng âm lịch đã áp quy tắc tháng nhuận (1–12). */
  month: number;
  /** Ngày âm lịch (1–30). */
  day: number;
  /** Chi của giờ sinh (0 = Tý). */
  hourBranch: number;
  /** Can của năm âm lịch (0 = Giáp). */
  yearStem: number;
  /** Chi của năm âm lịch (0 = Tý). */
  yearBranch: number;
};

/**
 * 安魁鉞訣: 「甲戊庚之年丑未，乙己之年子申，辛年午寅，壬癸之年卯巳，丙丁之年亥酉。」
 * Mỗi dòng: [Thiên Khôi, Thiên Việt].
 */
const KUI_YUE: readonly (readonly [number, number])[] = [
  [1, 7], // 甲 丑 未
  [0, 8], // 乙 子 申
  [11, 9], // 丙 亥 酉
  [11, 9], // 丁 亥 酉
  [1, 7], // 戊 丑 未
  [0, 8], // 己 子 申
  [1, 7], // 庚 丑 未
  [6, 2], // 辛 午 寅
  [3, 5], // 壬 卯 巳
  [3, 5], // 癸 卯 巳
];

/** 定祿存: 甲寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子。 */
const LU_CUN: readonly number[] = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];

/** 安天馬訣: 寅午戌→申，申子辰→寅，巳酉丑→亥，亥卯未→巳. */
const TIAN_MA: readonly number[] = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];

/**
 * 安火鈴訣: 「申子辰人寅戌揚，寅午戌人丑卯方。巳酉丑人卯戌位，亥卯未人酉戌房。」
 * 起火鈴二曜先據年支定「子時」位，再順數至生時。
 * Mỗi dòng: [Hoả Tinh tại Tý, Linh Tinh tại Tý].
 */
const HUO_LING: readonly (readonly [number, number])[] = [
  [2, 10], // 子 (申子辰)
  [3, 10], // 丑 (巳酉丑)
  [1, 3], // 寅 (寅午戌)
  [9, 10], // 卯 (亥卯未)
  [2, 10], // 辰 (申子辰)
  [3, 10], // 巳 (巳酉丑)
  [1, 3], // 午 (寅午戌)
  [9, 10], // 未 (亥卯未)
  [2, 10], // 申 (申子辰)
  [3, 10], // 酉 (巳酉丑)
  [1, 3], // 戌 (寅午戌)
  [9, 10], // 亥 (亥卯未)
];

export type AuxStarPositions = Record<string, number>;

export function auxStarBranches(input: AuxInput): AuxStarPositions {
  const { month, day, hourBranch, yearStem, yearBranch } = input;
  const m = month - 1;
  const d = day - 1;

  // 安輔弼、昌曲、空劫訣:
  // 「辰上順正尋左輔，戌上逆正右弼當，辰上順時文曲位，戌上逆時覓文昌，
  //   亥上子時順安劫，逆回便是地空亡。」
  const zuofu = mod(4 + m, 12);
  const youbi = mod(10 - m, 12);
  const wenchang = mod(10 - hourBranch, 12);
  const wenqu = mod(4 + hourBranch, 12);
  const dijie = mod(11 + hourBranch, 12);
  const dikong = mod(11 - hourBranch, 12);

  const [tiankui, tianyue] = KUI_YUE[mod(yearStem, 10)];
  const lucun = LU_CUN[mod(yearStem, 10)];

  // 「祿前羊刃當，祿後陀羅府。」
  const qingyang = mod(lucun + 1, 12);
  const tuoluo = mod(lucun - 1, 12);

  const tianma = TIAN_MA[mod(yearBranch, 12)];

  const [huoStart, lingStart] = HUO_LING[mod(yearBranch, 12)];
  const huoxing = mod(huoStart + hourBranch, 12);
  const lingxing = mod(lingStart + hourBranch, 12);

  // 安天刑天姚訣: 「天刑從酉起正月，順至生月便安之。天姚丑宮起正月，順到生月即停留。」
  const tianxing = mod(9 + m, 12);
  const tianyao = mod(1 + m, 12);

  // 安紅鸞天喜訣: 「卯上起子逆數之，數到當生太歲支。坐守此宮紅鸞位，對宮天喜不差移。」
  const hongluan = mod(3 - yearBranch, 12);
  const tianxi = mod(hongluan + 6, 12);

  // 安三台八座訣: 「由左輔之宮位起初一，順行至生日安三台。
  //                 由右弼之宮位起初一，逆行至生日安八座。」
  const santai = mod(zuofu + d, 12);
  const bazuo = mod(youbi - d, 12);

  // 安恩光天貴訣: 「由文昌之宮位起初一，順行至生日再退一步起恩光。
  //                 由文曲之宮位起初一，順行至生日再退一步起天貴。」
  const enguang = mod(wenchang + d - 1, 12);
  const tiangui = mod(wenqu + d - 1, 12);

  // 安台輔封誥訣: 「台輔午起子順到時，封誥寅宮起子逆到時。」
  const taifu = mod(6 + hourBranch, 12);
  const fenggao = mod(2 - hourBranch, 12);

  return {
    zuofu, youbi, wenchang, wenqu,
    tiankui, tianyue, lucun, qingyang, tuoluo, tianma,
    huoxing, lingxing, dikong, dijie,
    tianxing, tianyao, hongluan, tianxi,
    santai, bazuo, enguang, tiangui, taifu, fenggao,
  };
}
