import { useMemo } from 'react';
import { STAR_DEFS, type TuViChart, type TuViGender } from '../../../../packages/tuvi-engine/src/index.ts';
import { Cite } from '../quotes.tsx';
import { GlossaryTerm, quoteLine, useReadingMode } from '../glossary.tsx';
import {
  DAHAN_QUOTES,
  READING_RULES,
  buildTuViReading,
  liuNianStep,
  palaceRules,
  type TuViReading,
} from '../reading.ts';
import { ReadingPanel } from './ReadingPanel.tsx';

const HUA_ORDER: Record<string, number> = { loc: 0, quyen: 1, khoa: 2, ky: 3 };

type Props = { chart: TuViChart; gender: TuViGender; reading?: TuViReading };

/**
 * Phần luận giải nằm ngay dưới lá số Tử Vi: tổng quan + 12 cung (kèm câu "thuận /
 * trắc trở" theo cung) + lưu niên + đại hạn.
 */
export function TuViReadingSection({ chart, gender, reading: provided }: Props) {
  const { mode } = useReadingMode();
  const reading = useMemo(
    () => provided ?? buildTuViReading(chart, gender),
    [provided, chart, gender],
  );
  const { dahan } = reading;
  const rules = useMemo(() => palaceRules(), []);

  const currentYear = new Date().getFullYear();
  const liuNian = liuNianStep(currentYear);

  return (
    <div className="reading-phase" aria-labelledby="tuvi-reading-title">
      <div className="reading-phase-head">
        <p className="eyebrow">Luận giải</p>
        <h3 id="tuvi-reading-title">Đọc lá số theo 12 cung</h3>
        <p className="muted">
          Chọn một cung trong danh mục để đọc: câu ngắn về sao ở cung đó, chính tinh, phụ tinh,
          độ sáng và tứ hoá, kèm câu của từng sao. Nút “§” mở đúng đoạn chữ Hán trong sách; từ
          còn lạ thì rê chuột hoặc bấm vào để xem nghĩa.
        </p>
      </div>

      <div className="mini-card reading-overview">
        <h3>Tóm tắt trong một màn</h3>
        <dl className="kv">
          <div>
            <dt>
              <GlossaryTerm term="mệnh">Mệnh</GlossaryTerm>
            </dt>
            <dd>
              cung {reading.soul.palace.branchVi} · sao chính:{' '}
              {reading.soul.stars
                .filter((s) => s.star.group === 'main')
                .map((s) => `${s.star.vi} (${s.brightness?.level?.vi?.toLowerCase() ?? 'nguồn không chép'})`)
                .join(', ') || 'không có chính tinh'}
            </dd>
          </div>
          <div>
            <dt>
              <GlossaryTerm term="thân">Thân</GlossaryTerm>
            </dt>
            <dd>
              cung {reading.body.palace.branchVi} · sao chính:{' '}
              {reading.body.stars
                .filter((s) => s.star.group === 'main')
                .map((s) => s.star.vi)
                .join(', ') || 'không có chính tinh'}
            </dd>
          </div>
          <div>
            <dt>Sao chủ</dt>
            <dd>
              Mệnh {STAR_DEFS[chart.soulStar].vi} · Thân {STAR_DEFS[chart.bodyStar].vi}
            </dd>
          </div>
          <div>
            <dt>
              <GlossaryTerm term="tứ hoá">Tứ Hoá</GlossaryTerm> năm {chart.year.vi}
            </dt>
            <dd>
              {[...chart.mutagens]
                .sort((a, b) => (HUA_ORDER[a.hua] ?? 9) - (HUA_ORDER[b.hua] ?? 9))
                .map((m) => `${m.vi} ${STAR_DEFS[m.star].vi}`)
                .join(' · ')}
            </dd>
          </div>
          <div>
            <dt>
              <GlossaryTerm term="đại hạn">Đại hạn</GlossaryTerm>
            </dt>
            <dd>
              {dahan.direction === 'thuan' ? 'Đi thuận' : 'Đi nghịch'} từ cung{' '}
              {chart.palaces[dahan.startBranch]!.nameVi} · tuổi khởi {dahan.startAge} · mỗi hạn
              10 năm
            </dd>
          </div>
          <div>
            <dt>
              <GlossaryTerm term="lưu niên">Lưu niên</GlossaryTerm> {currentYear}
            </dt>
            <dd>
              năm {liuNian.branchVi} → cung {chart.palaces[liuNian.branch]!.nameVi}
              {chart.palaces[liuNian.branch]!.isSoul &&
                ' (đúng cung Mệnh — theo sách ảnh hưởng rõ nhất)'}
            </dd>
          </div>
        </dl>
        <div className="cite-row">
          {READING_RULES.ptc && <Cite id={READING_RULES.ptc.id} />}
          {DAHAN_QUOTES.direction && <Cite id={DAHAN_QUOTES.direction.id} />}
          {DAHAN_QUOTES.startAge(dahan.startAge) && (
            <Cite id={DAHAN_QUOTES.startAge(dahan.startAge)!.id} />
          )}
        </div>
      </div>

      {READING_RULES.ptc && (
        <div className="reading-tip">
          <p className="reading-claim">{quoteLine(READING_RULES.ptc, mode)}</p>
          <div className="cite-row">
            <Cite id={READING_RULES.ptc.id} />
          </div>
        </div>
      )}

      <ReadingPanel reading={reading} rules={rules} />

      <p className="tiny muted reading-limit">
        Chưa có, ghi rõ để không đoán: ảnh hưởng của từng sao tại từng cung (kiểu “Tử Vi tại Mệnh”)
        và tổ hợp sao; cách cục; tiểu hạn. Bản này đọc tới mức: sao nào ở cung nào, độ sáng tại
        cung đó, câu chung của cung, đại hạn và cung lưu niên.
      </p>
    </div>
  );
}
