import test from 'node:test';
import assert from 'node:assert/strict';
import { auxStarBranches, type AuxInput } from '../src/aux-stars.ts';

const base: AuxInput = { month: 1, day: 1, hourBranch: 0, yearStem: 0, yearBranch: 0 };

test('tháng 1, ngày 1, giờ Tý, năm Giáp Tý — toàn bộ phụ tinh', () => {
  assert.deepEqual(auxStarBranches(base), {
    zuofu: 4, // 辰上順正月
    youbi: 10, // 戌上逆正月
    wenchang: 10, // 戌上逆時 (Tý)
    wenqu: 4, // 辰上順時 (Tý)
    tiankui: 1, // 甲 → 丑
    tianyue: 7, // 甲 → 未
    lucun: 2, // 甲 → 寅
    qingyang: 3, // 祿前
    tuoluo: 1, // 祿後
    tianma: 2, // 申子辰 → 寅
    huoxing: 2, // 申子辰 → 寅
    lingxing: 10, // 申子辰 → 戌
    dikong: 11, // 亥上逆時
    dijie: 11, // 亥上順時
    tianxing: 9, // 酉起正月
    tianyao: 1, // 丑起正月
    hongluan: 3, // 卯上起子
    tianxi: 9, // 對宮
    santai: 4, // 左輔初一
    bazuo: 10, // 右弼初一
    enguang: 9, // 文昌初一退一
    tiangui: 3, // 文曲初一退一
    taifu: 6, // 午起子
    fenggao: 2, // 寅起子
  });
});

test('安魁鉞: 甲戊庚 丑未, 乙己 子申, 丙丁 亥酉, 辛 午寅, 壬癸 卯巳', () => {
  const pairs = [
    [1, 7], [0, 8], [11, 9], [11, 9], [1, 7],
    [0, 8], [1, 7], [6, 2], [3, 5], [3, 5],
  ];
  for (let s = 0; s < 10; s++) {
    const a = auxStarBranches({ ...base, yearStem: s });
    assert.deepEqual([a.tiankui, a.tianyue], pairs[s], `can ${s}`);
  }
});

test('安祿存: 擎羊 luôn tiến 1, 陀羅 luôn lùi 1 từ Lộc Tồn', () => {
  for (let s = 0; s < 10; s++) {
    const a = auxStarBranches({ ...base, yearStem: s });
    assert.equal(a.qingyang, (a.lucun + 1) % 12, `can ${s}`);
    assert.equal(a.tuoluo, (a.lucun + 11) % 12, `can ${s}`);
  }
});

test('安天馬: 寅午戌 → Thân, 申子辰 → Dần, 巳酉丑 → Hợi, 亥卯未 → Tỵ', () => {
  const groups: Record<number, number[]> = {
    8: [2, 6, 10], // Dần Ngọ Tuất → Thân
    2: [8, 0, 4], // Thân Tý Thìn → Dần
    11: [5, 9, 1], // Tỵ Dậu Sửu → Hợi
    5: [11, 3, 7], // Hợi Mão Mùi → Tỵ
  };
  for (const [want, branches] of Object.entries(groups)) {
    for (const b of branches) {
      assert.equal(auxStarBranches({ ...base, yearBranch: b }).tianma, Number(want), `chi năm ${b}`);
    }
  }
});

test('安火鈴: cả hai đều tiến theo giờ từ vị trí giờ Tý', () => {
  for (let yb = 0; yb < 12; yb++) {
    const atZi = auxStarBranches({ ...base, yearBranch: yb, hourBranch: 0 });
    for (let h = 0; h < 12; h++) {
      const a = auxStarBranches({ ...base, yearBranch: yb, hourBranch: h });
      assert.equal(a.huoxing, (atZi.huoxing + h) % 12, `chi năm ${yb} giờ ${h}`);
      assert.equal(a.lingxing, (atZi.lingxing + h) % 12, `chi năm ${yb} giờ ${h}`);
    }
  }
});

test('輔弼 và 昌曲 đối xứng qua trục, 空劫 cũng đối xứng', () => {
  const mod = (n: number): number => ((n % 12) + 12) % 12;
  for (let m = 1; m <= 12; m++) {
    const a = auxStarBranches({ ...base, month: m });
    // 左輔 từ Thìn tiến, 右弼 từ Tuất lùi → luôn đối xứng qua trục Sửu–Mùi.
    assert.equal(mod(a.zuofu + a.youbi), 2, `tháng ${m}`);
  }
  for (let h = 0; h < 12; h++) {
    const a = auxStarBranches({ ...base, hourBranch: h });
    assert.equal(mod(a.wenchang + a.wenqu), 2, `giờ ${h}: 昌曲`);
    assert.equal(mod(a.dikong + a.dijie), 10, `giờ ${h}: 空劫`);
  }
});

test('三台/八座, 恩光/天貴, 紅鸞/天喜 đúng khoảng cách', () => {
  const mod = (n: number): number => ((n % 12) + 12) % 12;
  for (let d = 1; d <= 30; d++) {
    const a = auxStarBranches({ ...base, day: d });
    assert.equal(a.santai, mod(a.zuofu + d - 1), `ngày ${d}: 三台`);
    assert.equal(a.bazuo, mod(a.youbi - (d - 1)), `ngày ${d}: 八座`);
    assert.equal(a.enguang, mod(a.wenchang + d - 2), `ngày ${d}: 恩光`);
    assert.equal(a.tiangui, mod(a.wenqu + d - 2), `ngày ${d}: 天貴`);
  }
  for (let yb = 0; yb < 12; yb++) {
    const a = auxStarBranches({ ...base, yearBranch: yb });
    assert.equal(a.tianxi, mod(a.hongluan + 6), `chi năm ${yb}`);
  }
});

test('mọi phụ tinh luôn nằm trong 0–11', () => {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 30; d += 7) {
      for (let h = 0; h < 12; h += 5) {
        for (let yb = 0; yb < 12; yb += 3) {
          const a = auxStarBranches({ ...base, month: m, day: d, hourBranch: h, yearBranch: yb });
          for (const [id, branch] of Object.entries(a)) {
            assert.ok(Number.isInteger(branch) && branch >= 0 && branch < 12, `${id} ${branch}`);
          }
        }
      }
    }
  }
});
