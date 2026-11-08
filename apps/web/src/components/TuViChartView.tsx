import {
  BRANCHES_VI,
  STAR_DEFS,
  STEMS_VI,
  type Palace,
  type PlacedStar,
  type TuViChart,
} from '../../../../packages/tuvi-engine/src/index.ts';
import { hourBranchName, hourRange } from '../format.ts';

const HUA_SHORT: Record<string, string> = {
  loc: 'Lộc',
  quyen: 'Quyền',
  khoa: 'Khoa',
  ky: 'Kỵ',
};

const HUA_ORDER: Record<string, number> = { loc: 0, quyen: 1, khoa: 2, ky: 3 };

const LEAP_LABEL: Record<TuViChart['options']['leapMonthRule'], string> = {
  split: 'Nhuận: chia đôi',
  'as-month': 'Nhuận: giữ tháng',
  'as-next': 'Nhuận: dồn tháng sau',
};

function StarRow({ star, main }: { star: PlacedStar; main: boolean }) {
  return (
    <span className={main ? 'star star-main' : 'star star-aux'}>
      <span className="star-vi">{star.vi}</span>
      {star.mutagen && (
        <span className={`hua hua-${star.mutagen}`}>{HUA_SHORT[star.mutagen]}</span>
      )}
    </span>
  );
}

function PalaceCell({ palace }: { palace: Palace }) {
  const main = [...palace.mainStars].sort(
    (a, b) => (HUA_ORDER[a.mutagen ?? 'z'] ?? 9) - (HUA_ORDER[b.mutagen ?? 'z'] ?? 9),
  );
  const aux = [...palace.auxStars].sort((a, b) => a.vi.localeCompare(b.vi, 'vi'));

  return (
    <div className={`palace pos-${palace.branch}${palace.isSoul ? ' is-soul' : ''}${palace.isBody ? ' is-body' : ''}`}>
      <div className="palace-head">
        <span className="palace-name">{palace.nameVi}</span>
        <span className="palace-ganzhi">
          {palace.stemVi} {palace.branchVi}
        </span>
      </div>
      <div className="palace-branch" aria-hidden="true">
        {palace.branchVi}
      </div>
      <div className="palace-main">
        {main.map((s) => (
          <StarRow key={s.id} star={s} main />
        ))}
      </div>
      <div className="palace-aux">
        {aux.map((s) => (
          <StarRow key={s.id} star={s} main={false} />
        ))}
      </div>
      <div className="palace-tags">
        {palace.isSoul && <span className="tag tag-soul">Mệnh</span>}
        {palace.isBody && <span className="tag tag-body">Thân</span>}
      </div>
    </div>
  );
}

type Props = { chart: TuViChart; calendarLabel?: string };

export function TuViChartView({ chart, calendarLabel = 'Âm lịch TQ' }: Props) {
  const byBranch = new Map(chart.palaces.map((p) => [p.branch, p]));
  const soulPalace = chart.palaces.find((p) => p.isSoul);
  const bodyPalace = chart.palaces.find((p) => p.isBody);
  const cycle = ((chart.birth.lunarYear - 4) % 60 + 60) % 60;
  const yearVi = `${STEMS_VI[cycle % 10]} ${BRANCHES_VI[cycle % 12]}`;

  const cell = (branch: number) => {
    const p = byBranch.get(branch);
    return p ? <PalaceCell key={branch} palace={p} /> : null;
  };

  return (
    <section className="tuvi">
      <div className="chart-head">
        <div>
          <h2>Lá số Tử Vi Đẩu Số</h2>
          <p className="muted">
            ngày {chart.birth.lunarDay} tháng {chart.birth.lunarMonth}
            {chart.birth.lunarLeap ? ' nhuận' : ''} năm {yearVi} · giờ{' '}
            {hourBranchName(chart.birth.hourBranch)} ({hourRange(chart.birth.hourBranch)})
          </p>
        </div>
        <div className="chart-badges">
          <span className="chip chip-key">{chart.bureau.vi}</span>
          <span className="chip">{chart.year.vi}</span>
          {chart.birth.lunarLeap && (
            <span className="chip">{LEAP_LABEL[chart.options.leapMonthRule]}</span>
          )}
        </div>
      </div>

      <div className="tuvi-scroll">
        <div className="tuvi-grid">
          {Array.from({ length: 12 }, (_, b) => cell(b))}
          <div className="tuvi-center">
            <div className="center-title">Tử Vi</div>
            <dl className="center-dl">
              <div>
                <dt>{calendarLabel}</dt>
                <dd>
                  {chart.birth.lunarDay}/{chart.birth.lunarMonth}
                  {chart.birth.lunarLeap ? ' nhuận' : ''} · {yearVi}
                </dd>
              </div>
              <div>
                <dt>Giờ sinh</dt>
                <dd>
                  {hourBranchName(chart.birth.hourBranch)} ({hourRange(chart.birth.hourBranch)})
                </dd>
              </div>
              <div>
                <dt>Ngũ hành cục</dt>
                <dd>
                  {chart.bureau.vi}
                </dd>
              </div>
              <div>
                <dt>Mệnh chủ</dt>
                <dd>
                  {STAR_DEFS[chart.soulStar].vi}
                </dd>
              </div>
              <div>
                <dt>Thân chủ</dt>
                <dd>
                  {STAR_DEFS[chart.bodyStar].vi}
                </dd>
              </div>
              <div>
                <dt>Mệnh / Thân</dt>
                <dd>
                  {soulPalace ? `${soulPalace.stemVi} ${soulPalace.branchVi}` : '—'} /{' '}
                  {bodyPalace ? bodyPalace.branchVi : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="tuvi-below">
        <div className="mini-card">
          <h3>Tứ Hoá năm {chart.year.vi}</h3>
          <ul className="hua-list">
            {[...chart.mutagens]
              .sort((a, b) => (HUA_ORDER[a.hua] ?? 9) - (HUA_ORDER[b.hua] ?? 9))
              .map((m) => (
                <li key={m.star}>
                  <span className={`hua hua-${m.hua}`}>{m.vi}</span>
                  <span>
                    {STAR_DEFS[m.star].vi}
                  </span>
                  <span className="muted">cung {BRANCHES_VI[m.branch]}</span>
                </li>
              ))}
          </ul>
          <p className="tiny muted">
            Bảng Tứ Hoá Nam phái. Các phái khác có thể gán khác — xem mục “Phương pháp”.
          </p>
        </div>

        <div className="mini-card">
          <h3>Ghi chú an sao</h3>
          {chart.notes.length === 0 ? (
            <p className="muted">Không có quy tắc đặc biệt nào được áp dụng.</p>
          ) : (
            <ul className="notes">
              {chart.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <p className="tiny muted">
            Tháng nhuận: {chart.birth.leapRuleApplied
              ? `đã đổi tháng an sao sang ${chart.birth.monthUsed}.`
              : chart.birth.lunarLeap
                ? `giữ tháng ${chart.birth.monthUsed}.`
                : 'không áp dụng.'}
          </p>
        </div>
      </div>
    </section>
  );
}
