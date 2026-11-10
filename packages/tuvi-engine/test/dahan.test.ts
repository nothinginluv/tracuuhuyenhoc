import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTuViChart, type TuViBirth } from '../src/chart.ts';
import { daHanAt, daHanCycles, daHanDirection } from '../src/dahan.ts';

const birth = (over: Partial<TuViBirth> = {}): TuViBirth => ({
  lunarYear: 1990, // Canh Ngọ — dương
  lunarMonth: 4,
  lunarDay: 21,
  lunarLeap: false,
  hourBranch: 8,
  ...over,
});

test('chiều đại hạn: dương nam / âm nữ thuận, âm nam / dương nữ nghịch', () => {
  const duong = buildTuViChart(birth()); // Canh = dương
  const am = buildTuViChart(birth({ lunarYear: 1985 })); // Ất Sửu = âm
  assert.equal(daHanDirection(duong, 'nam'), 'thuan');
  assert.equal(daHanDirection(duong, 'nu'), 'nghich');
  assert.equal(daHanDirection(am, 'nam'), 'nghich');
  assert.equal(daHanDirection(am, 'nu'), 'thuan');
});

test('giới tính ngoài miền báo lỗi', () => {
  const chart = buildTuViChart(birth());
  // @ts-expect-error — kiểm tra dữ liệu sai từ JavaScript
  assert.throws(() => daHanCycles(chart, 'khac'), /nam.*nữ/);
});

test('hạn đầu là cung Phụ Mẫu (thuận) hoặc Huynh Đệ (nghịch)', () => {
  const chart = buildTuViChart(birth());
  const nam = daHanCycles(chart, 'nam');
  assert.equal(nam.direction, 'thuan');
  assert.equal(nam.steps[0]!.branch, (chart.soul.branch + 1) % 12);
  assert.equal(nam.steps[0]!.palaceZh, '父母');

  const nu = daHanCycles(chart, 'nu');
  assert.equal(nu.direction, 'nghich');
  assert.equal(nu.steps[0]!.branch, (chart.soul.branch + 11) % 12);
  assert.equal(nu.steps[0]!.palaceZh, '兄弟');
});

test('tuổi khởi bằng số cục, mỗi hạn 10 năm, đủ 12 cung', () => {
  const chart = buildTuViChart(birth()); // Thuỷ nhị cục
  assert.equal(chart.bureau.number, 2);
  for (const gender of ['nam', 'nu'] as const) {
    const dahan = daHanCycles(chart, gender);
    assert.equal(dahan.startAge, chart.bureau.number);
    assert.equal(dahan.steps.length, 12);
    assert.deepEqual(
      new Set(dahan.steps.map((s) => s.branch)).size,
      12,
      'mỗi cung đúng một hạn',
    );
    dahan.steps.forEach((s, i) => {
      assert.equal(s.index, i + 1);
      assert.equal(s.fromAge, chart.bureau.number + i * 10);
      assert.equal(s.toAge, s.fromAge + 9);
      assert.equal(s.palaceVi, chart.palaces[s.branch]!.nameVi);
      assert.equal(s.palaceZh, chart.palaces[s.branch]!.nameZh);
    });
  }
});

test('mọi cục 2–6 đều khởi đúng tuổi của cục đó', () => {
  const seen = new Set<number>();
  for (let y = 1984; y < 1996; y++) {
    const chart = buildTuViChart(birth({ lunarYear: y }));
    const dahan = daHanCycles(chart, 'nam');
    assert.equal(dahan.startAge, chart.bureau.number);
    seen.add(chart.bureau.number);
  }
  assert.deepEqual([...seen].sort(), [2, 3, 4, 5, 6]);
});

test('daHanAt tìm đúng hạn theo tuổi, ngoài vòng thì null', () => {
  const dahan = daHanCycles(buildTuViChart(birth()), 'nam');
  assert.equal(daHanAt(dahan, dahan.startAge)?.index, 1);
  assert.equal(daHanAt(dahan, dahan.startAge + 9)?.index, 1);
  assert.equal(daHanAt(dahan, dahan.startAge + 10)?.index, 2);
  assert.equal(daHanAt(dahan, 1), null);
  assert.equal(daHanAt(dahan, 200), null);
});
