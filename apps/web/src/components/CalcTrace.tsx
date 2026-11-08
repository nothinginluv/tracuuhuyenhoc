import { formatWall, type ChartContext } from '../../../../packages/calendar-core/src/index.ts';
import type { BaziChart } from '../../../../packages/bazi-engine/src/index.ts';
import type { TuViChart } from '../../../../packages/tuvi-engine/src/index.ts';
import { Cite } from '../quotes.tsx';
import {
  CLOCK_DESCRIPTION,
  formatDate,
  formatTime,
  hourBranchName,
  hourRange,
  lunarLabel,
  lunarShort,
  shiftLabel,
  yearName,
} from '../format.ts';

const REGION_LABEL: Record<string, string> = {
  bac: 'miền Bắc',
  nam: 'miền Nam',
};

function termStamp(epochMs: number): string {
  const iso = new Date(epochMs).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export function WarningList({ ctx }: { ctx: ChartContext }) {
  if (ctx.warnings.length === 0) return null;
  return (
    <ul className="warnings">
      {ctx.warnings.map((w, i) => (
        <li key={`${w.code}-${i}`} className={`warning warning-${w.severity}`}>
          <span className="warning-kind">{w.severity === 'warn' ? 'Cần lưu ý' : 'Thông tin'}</span>
          <span>{w.message}</span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  ctx: ChartContext;
  tuvi: TuViChart | null;
  bazi: BaziChart;
};

export function CalcTrace({ ctx, tuvi, bazi }: Props) {
  const tz = ctx.tz;
  const offsetLabel = `UTC${tz.offsetHours >= 0 ? '+' : '−'}${Math.abs(tz.offsetHours)}`;

  return (
    <section className="trace">
      <div className="chart-head">
        <div>
          <h2>Cách tính ra lá số này</h2>
          <p className="muted">
            Từ giờ trên đồng hồ đến từng con số. Quy ước nào đang dùng đều ghi ngay tại đây.
          </p>
        </div>
        <div className="chart-badges">
          <span className="chip chip-key">{ctx.conventionLabel}</span>
          <span className="chip">
            {ctx.convention.ziBoundary === 'late' ? 'Tý muộn 00:00' : 'Tý sớm 23:00'}
          </span>
          <span className="chip">
            Can giờ {ctx.convention.hourStemRule === 'next-day' ? 'ngày kế' : 'ngày hiện tại'}
          </span>
        </div>
      </div>

      <div className="trace-card">
        <ol className="steps">
          <li className="step done">
            <div className="label">
              Ngày giờ đã nhập
              <small>Giờ đồng hồ tại nơi sinh — thứ duy nhất người dùng biết chắc.</small>
            </div>
            <div className="val">
              {formatTime(ctx.civilWall.hour, ctx.civilWall.minute)}
              <br />
              {formatDate(ctx.civilWall.year, ctx.civilWall.month, ctx.civilWall.day)}
            </div>
          </li>

          <li className="step done">
            <div className="label">
              Nơi sinh
              <small>
                {tz.province ?? 'Không chọn tỉnh'}
                {tz.region ? ` · ${REGION_LABEL[tz.region]}` : ''}
                {tz.approximateCoords ? ' · toạ độ tỉnh lỵ (xấp xỉ)' : ''}
              </small>
            </div>
            <div className="val">
              {ctx.geo.latitude != null && ctx.geo.longitude != null
                ? `${ctx.geo.latitude.toFixed(2)}°, ${ctx.geo.longitude.toFixed(2)}°`
                : '—'}
            </div>
          </li>

          <li className="step done">
            <div className="label">
              Múi giờ lịch sử
              <small>
                {tz.fromTable
                  ? `Tra bảng Việt Nam${tz.region ? ` (${REGION_LABEL[tz.region]})` : ''}`
                  : 'Người dùng ghi đè hoặc không xác định được vùng'}
              </small>
            </div>
            <div className="val">{offsetLabel}</div>
          </li>

          <li className="step done">
            <div className="label">
              Thời điểm vật lý (UTC)
              <small>Mọi phép so với tiết khí và điểm sóc đều dùng mốc này.</small>
            </div>
            <div className="val">{ctx.utcIso.replace('T', ' ').slice(0, 19)}Z</div>
          </li>

          <li className="step alt">
            <div className="label">
              Đồng hồ dùng để an sao
              <small>
                {CLOCK_DESCRIPTION[ctx.clock.used]} · dịch {shiftLabel(ctx.clock.shiftMinutes)}
                {ctx.clock.solarCorrection
                  ? ` (kinh độ ${shiftLabel(Math.round(ctx.clock.solarCorrection.longitudeMin))}, EoT ${shiftLabel(Math.round(ctx.clock.solarCorrection.eotMin))})`
                  : ''}
              </small>
            </div>
            <div className="val">
              {formatWall(ctx.clock.wall)}
              <br />
              <span className="muted">giờ {hourBranchName(Math.floor((ctx.clock.wall.hour + 1) / 2) % 12)}</span>
            </div>
          </li>

          <li className="step done">
            <div className="label">
              Âm lịch Trung Quốc (UTC+8)
              <small>Chuẩn dùng để an sao Tử Vi và xác định năm âm lịch.</small>
            </div>
            <div className="val">
              {lunarShort(ctx.lunar.cn)}
              <br />
              <span className="muted">{yearName(ctx.lunar.cn)}</span>
            </div>
          </li>

          <li className={`step ${ctx.lunar.diverges ? 'alt' : 'done'}`}>
            <div className="label">
              Âm lịch Việt Nam (UTC+7)
              <small>
                {ctx.lunar.diverges
                  ? 'Lệch với lịch TQ tại thời điểm này — đây là lý do một số ứng dụng ra lá số khác.'
                  : 'Trùng với lịch Trung Quốc tại thời điểm này.'}
              </small>
            </div>
            <div className="val">
              {lunarShort(ctx.lunar.vn)}
              <br />
              <span className="muted">{yearName(ctx.lunar.vn)}</span>
            </div>
          </li>

          <li className="step done">
            <div className="label">
              Tiết khí gần nhất / kế tiếp
              <small>
                So theo thời điểm UTC, không so giờ Việt Nam với bảng giờ Bắc Kinh.
              </small>
            </div>
            <div className="val">
              {ctx.jie.current.vi} · {termStamp(ctx.jie.current.epoch)}
              <br />
              <span className="muted">
                {ctx.jie.next ? `${ctx.jie.next.vi} · ${termStamp(ctx.jie.next.epoch)}` : '—'}
              </span>
            </div>
          </li>

          <li className="step done">
            <div className="label">
              Tứ trụ
              <small>Năm đổi tại Lập Xuân; tháng đổi tại 12 “tiết”; ngày theo vòng 60; giờ theo phép Ngũ Thử Độn.</small>
            </div>
            <div className="val">
              {ctx.pillars.year.vi} · {ctx.pillars.month.vi}
              <br />
              {ctx.pillars.day.vi} · {ctx.pillars.hour.vi}
            </div>
          </li>

          {tuvi ? (
            <li className="step done">
              <div className="label">
                An sao Tử Vi
                <small>
                  Năm âm lịch {tuvi.birth.lunarYear} ({yearName(ctx.lunar.cn)}) · tháng an sao{' '}
                  {tuvi.birth.monthUsed}
                  {tuvi.birth.leapRuleApplied ? ' (đã đổi do tháng nhuận)' : ''} · ngày{' '}
                  {tuvi.birth.lunarDay} · giờ {hourBranchName(tuvi.birth.hourBranch)} (
                  {hourRange(tuvi.birth.hourBranch)})
                </small>
              </div>
              <div className="val">
                {tuvi.bureau.vi}
                <br />
                Mệnh {tuvi.soul.vi} · Thân {tuvi.body.vi}
              </div>
            </li>
          ) : (
            <li className="step alt">
              <div className="label">
                An sao Tử Vi
                <small>Không dựng được với thời điểm này (xem cảnh báo bên dưới).</small>
              </div>
              <div className="val">—</div>
            </li>
          )}

          <li className="step done">
            <div className="label">
              Bát Tự — khởi vận
              <small>
                {bazi.qiYun.direction === 'thuan' ? 'Đi thuận' : 'Đi nghịch'} · đếm{' '}
                {bazi.qiYun.reference === 'next' ? 'tới tiết kế tiếp' : 'từ tiết trước'} ·{' '}
                {bazi.qiYun.daysToJie.toFixed(2)} ngày
              </small>
            </div>
            <div className="val">
              {bazi.qiYun.startAge.years} năm {bazi.qiYun.startAge.months} tháng{' '}
              {bazi.qiYun.startAge.days} ngày
              <br />
              <span className="muted">sau sinh (không phải tuổi mụ)</span>
            </div>
          </li>
        </ol>

        <div className="trace-result">
          <span>⇒</span> Âm lịch TQ <b>{lunarLabel(ctx.lunar.cn)}</b> · tứ trụ{' '}
          <b>
            {ctx.pillars.year.vi} {ctx.pillars.month.vi} {ctx.pillars.day.vi} {ctx.pillars.hour.vi}
          </b>
        </div>
      </div>

      <WarningList ctx={ctx} />

      <div className="sources">
        <h3>Căn cứ</h3>
        <div className="cite-row">
          <Cite id="q_bz_0008" />
          <Cite id="q_bz_0004" />
          <Cite id="q_bz_0005" />
          <Cite id="q_bz_0006" />
          <Cite id="q_bz_0007" />
        </div>
      </div>
    </section>
  );
}
