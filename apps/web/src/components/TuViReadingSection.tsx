/**
 * Phần đọc lá số: 12 cung (khung tab) và đại hạn.
 *
 * Trang lá số giữ cung đang chọn để bấm một ô trên lá số cũng mở đúng cung ở
 * khung đọc này.
 */
import type { TuViReading } from '../reading.ts';
import { ReadingPanel } from './ReadingPanel.tsx';
import { DaHanSection } from './reading-blocks.tsx';

type Props = {
  reading: TuViReading;
  active: number;
  onPick: (branch: number) => void;
};

export function TuViReadingSection({ reading, active, onPick }: Props) {
  return (
    <section className="reading" id="doc-12-cung" aria-labelledby="doc-title">
      <h3 id="doc-title">Đọc 12 cung</h3>
      <p className="muted">Chọn một cung để đọc câu của sách cho sao chính tại cung đó.</p>

      <ReadingPanel reading={reading} active={active} onPick={onPick} />

      <DaHanSection reading={reading} />
    </section>
  );
}
