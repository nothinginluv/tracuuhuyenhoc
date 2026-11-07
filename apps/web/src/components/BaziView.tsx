import {
  ELEMENT_VI,
  PILLAR_NAMES,
  STEM_ELEMENT,
  type BaziChart,
  type Gender,
} from '../../../../packages/bazi-engine/src/index.ts';
import type { ChartContext } from '../../../../packages/calendar-core/src/index.ts';
import { Cite } from '../quotes.tsx';
import { ELEMENT_CLASS } from '../format.ts';

const ROLE_LABEL: Record<string, string> = {
  'ban-khi': 'Bản khí',
  'trung-khi': 'Trung khí',
  'du-khi': 'Dư khí',
};

const ELEMENTS = ['moc', 'hoa', 'tho', 'kim', 'thuy'] as const;

function ElementBars({ counts, max }: { counts: Record<string, number>; max: number }) {
  return (
    <div className="bars">
      {ELEMENTS.map((e) => (
        <div className="bar-row" key={e}>
          <span className={`bar-label ${ELEMENT_CLASS[e]}`}>
            {ELEMENT_VI[e]} <span className="zh">{e === 'moc' ? '木' : e === 'hoa' ? '火' : e === 'tho' ? '土' : e === 'kim' ? '金' : '水'}</span>
          </span>
          <span className="bar-track">
            <span
              className={`bar-fill ${ELEMENT_CLASS[e]}`}
              style={{ width: `${Math.min(100, (counts[e] / max) * 100)}%` }}
            />
          </span>
          <span className="bar-count">{counts[e]}</span>
        </div>
      ))}
    </div>
  );
}

type Props = { chart: BaziChart; ctx: ChartContext; gender: Gender };

export function BaziView({ chart, ctx, gender }: Props) {
  const yearYang = ctx.pillars.year.stem % 2 === 0;
  const directionLabel = chart.qiYun.direction === 'thuan' ? 'thuận' : 'nghịch';
  const qi = chart.qiYun;

  return (
    <section className="bazi">
      <div className="chart-head">
        <div>
          <h2>Lá số Bát Tự</h2>
          <p className="muted">
            Tứ trụ lấy theo tiết khí (instant UTC), không theo ngày dương lịch.
          </p>
        </div>
        <div className="chart-badges">
          <span className="chip chip-key">
            Nhật chủ {chart.dayMaster.vi} {chart.dayMaster.elementVi}
          </span>
          <span className="chip">{gender === 'nam' ? 'Nam' : 'Nữ'}</span>
        </div>
      </div>

      <div className="bazi-grid">
        <div className="day-master">
          <div className="dm-eyebrow">Nhật chủ · 日主</div>
          <div className={`dm-stem ${ELEMENT_CLASS[chart.dayMaster.element]}`}>
            {chart.dayMaster.vi}
            <span className="dm-zh">{chart.dayMaster.zh}</span>
          </div>
          <div className="dm-meta">
            {chart.dayMaster.yinYang === 'duong' ? 'Dương' : 'Âm'} ·{' '}
            {chart.dayMaster.elementVi} ({chart.dayMaster.elementZh})
          </div>
          <p className="tiny muted">
            Can ngày là chủ thể của cả lá số; mọi thập thần đều tính tương quan với can này.
          </p>
          <Cite id={chart.citations.dayMaster} />
        </div>

        <div className="pillars">
          {chart.stems.map((stem) => {
            const branch = chart.branches.find((b) => b.pillar === stem.pillar)!;
            return (
              <div className="pillar" key={stem.pillar}>
                <div className="pillar-label">
                  {PILLAR_NAMES[stem.pillar].vi}
                  <span className="zh">{PILLAR_NAMES[stem.pillar].zh}</span>
                </div>
                <div className="ten-god">
                  {stem.pillar === 'day' ? 'Nhật chủ' : stem.tenGod?.vi ?? '—'}
                </div>
                <div className={`big-char ${ELEMENT_CLASS[stem.element]}`}>
                  {stem.vi}
                  <span className="big-zh">{stem.zh}</span>
                </div>
                <div className={`big-char branch ${ELEMENT_CLASS[branch.element]}`}>
                  {branch.vi}
                  <span className="big-zh">{branch.zh}</span>
                </div>
                <div className={`pillar-element ${ELEMENT_CLASS[stem.element]}`}>
                  {stem.elementVi} · {stem.yinYang === 'duong' ? 'Dương' : 'Âm'}
                </div>
                <div className="hidden">
                  <div className="hidden-title">Tàng can</div>
                  {branch.hidden.map((h) => (
                    <div className="hidden-row" key={`${h.stem}-${h.role}`}>
                      <span className={`hidden-stem ${ELEMENT_CLASS[STEM_ELEMENT[h.stem]]}`}>
                        {h.vi} <span className="zh">{h.zh}</span>
                      </span>
                      <span className="hidden-god">{h.tenGod.vi}</span>
                      <span className="hidden-role">{ROLE_LABEL[h.role] ?? h.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bazi-two">
        <div className="mini-card">
          <h3>Ngũ hành</h3>
          <div className="bars-title">8 chữ nổi (4 can + 4 chi)</div>
          <ElementBars counts={chart.elementCounts} max={8} />
          <div className="bars-title">Tàng can (mỗi can tàng tính 1)</div>
          <ElementBars
            counts={chart.hiddenElementCounts}
            max={Math.max(1, ...Object.values(chart.hiddenElementCounts))}
          />
          <p className="tiny muted">
            Đếm số lượng, không phải “thiếu / vượng”. Muốn luận vượng suy phải xét tháng lệnh và
            tổ hợp — nằm ngoài phạm vi phiên bản máy tính này.
          </p>
        </div>

        <div className="mini-card">
          <h3>Khởi vận</h3>
          <dl className="kv">
            <div>
              <dt>Chiều</dt>
              <dd>
                {yearYang ? 'Dương' : 'Âm'} {gender === 'nam' ? 'nam' : 'nữ'} →{' '}
                <strong>{directionLabel}</strong>
              </dd>
            </div>
            <div>
              <dt>Mốc đếm</dt>
              <dd>
                {qi.reference === 'next' ? 'tiết kế tiếp' : 'tiết đã qua'} · cách{' '}
                {qi.daysToJie.toFixed(2)} ngày
              </dd>
            </div>
            <div>
              <dt>Khởi vận</dt>
              <dd>
                {qi.startAge.years} năm {qi.startAge.months} tháng {qi.startAge.days} ngày sau sinh
              </dd>
            </div>
            <div>
              <dt>Quy đổi</dt>
              <dd>3 ngày = 1 năm · 1 ngày = 4 tháng · 1 giờ = 5 ngày</dd>
            </div>
          </dl>
          <p className="tiny muted">
            Tuổi ghi theo số năm kể từ lúc sinh, <em>không</em> phải 虚歲.
          </p>
          <Cite id={chart.citations.qiYunRule} />
          <Cite id={chart.citations.luckDirection} />
        </div>
      </div>

      <div className="luck">
        <h3>Đại vận</h3>
        <div className="luck-scroll">
          <table className="luck-table">
            <thead>
              <tr>
                <th>Vận</th>
                <th>Can chi</th>
                <th>Từ tuổi</th>
                <th>Đến tuổi</th>
              </tr>
            </thead>
            <tbody>
              {chart.luck.map((l) => (
                <tr key={l.index}>
                  <td className="muted">{l.index}</td>
                  <td>
                    <span className={`luck-pillar ${ELEMENT_CLASS[STEM_ELEMENT[l.pillar.stem]]}`}>
                      {l.pillar.vi}
                    </span>{' '}
                    <span className="zh">{l.pillar.zh}</span>
                  </td>
                  <td>{l.fromAge.toFixed(1)}</td>
                  <td>{l.toAge.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted">
          Vận đầu tiên là trụ tháng tiến/lùi một bước — không lấy chính trụ tháng.
        </p>
      </div>

      <div className="sources">
        <h3>Nguồn của các quy tắc</h3>
        <div className="cite-row">
          <Cite id={chart.citations.hiddenStems} />
          <Cite id={chart.citations.tenGods} />
          <Cite id={chart.citations.luckDirection} />
          <Cite id={chart.citations.qiYunRule} />
        </div>
        <ul className="notes">
          {chart.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
