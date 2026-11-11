/**
 * Cung trên lá số + bảng chi tiết trượt từ cạnh phải.
 *
 * · `PalaceCard` là một nút thật (không phải div bấm được) để bàn phím và
 *   trình đọc màn hình dùng được như mọi nút khác. Mở bảng thì `aria-expanded`.
 * · `PalacePanel` là `role="dialog" aria-modal="true"`: khoá cuộn nền, Escape
 *   đóng, Tab quay vòng trong bảng, đóng xong trả focus về đúng ô vừa bấm.
 *   Trên điện thoại bảng trượt từ đáy lên.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Palace, PlacedStar } from '../../../../packages/tuvi-engine/src/index.ts';

const HUA_SHORT: Record<string, string> = {
  loc: 'Lộc',
  quyen: 'Quyền',
  khoa: 'Khoa',
  ky: 'Kỵ',
};

const HUA_ORDER: Record<string, number> = { loc: 0, quyen: 1, khoa: 2, ky: 3 };

function StarRow({ star, main }: { star: PlacedStar; main: boolean }) {
  return (
    <span className={main ? 'star star-main' : 'star star-aux'}>
      <span className="star-vi">{star.vi}</span>
      {star.mutagen && <span className={`hua hua-${star.mutagen}`}>{HUA_SHORT[star.mutagen]}</span>}
    </span>
  );
}

export function PalaceCard({
  palace,
  onOpen,
  expanded,
}: {
  palace: Palace;
  /** Nhận chính nút vừa bấm để bảng trả focus về đúng chỗ khi đóng. */
  onOpen: (trigger: HTMLButtonElement) => void;
  expanded: boolean;
}) {
  const main = [...palace.mainStars].sort(
    (a, b) => (HUA_ORDER[a.mutagen ?? 'z'] ?? 9) - (HUA_ORDER[b.mutagen ?? 'z'] ?? 9),
  );
  const aux = [...palace.auxStars].sort((a, b) => a.vi.localeCompare(b.vi, 'vi'));

  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label={`Cung ${palace.nameVi}, ${palace.stemVi} ${palace.branchVi} — mở chi tiết`}
      className={`palace pos-${palace.branch}${palace.isSoul ? ' is-soul' : ''}${
        palace.isBody ? ' is-body' : ''
      }${expanded ? ' is-open' : ''}`}
    >
      <span className="palace-head">
        <span className="palace-name">{palace.nameVi}</span>
        <span className="palace-ganzhi">
          {palace.stemVi} {palace.branchVi}
        </span>
      </span>
      <span className="palace-branch" aria-hidden="true">
        {palace.branchVi}
      </span>
      <span className="palace-main">
        {main.map((s) => (
          <StarRow key={s.id} star={s} main />
        ))}
      </span>
      <span className="palace-aux">
        {aux.map((s) => (
          <StarRow key={s.id} star={s} main={false} />
        ))}
      </span>
      <span className="palace-tags">
        {palace.isSoul && <span className="tag tag-soul">Mệnh</span>}
        {palace.isBody && <span className="tag tag-body">Thân</span>}
        <span className="palace-open-hint" aria-hidden="true">
          Chi tiết
        </span>
      </span>
    </button>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PalacePanel({
  open,
  title,
  subtitle,
  onClose,
  onPrev,
  onNext,
  returnFocus,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** Phần tử nhận lại focus khi đóng (nút cung vừa bấm). */
  returnFocus?: HTMLElement | null;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Khoá cuộn nền + trả focus về ô đã mở khi đóng.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
    // Chỉ chạy theo trạng thái mở: `returnFocus` đọc tại thời điểm mở.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape đóng, Tab quay vòng trong bảng.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="palace-panel-layer">
      <div className="palace-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="palace-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="palace-panel-title"
        aria-describedby={subtitle ? 'palace-panel-sub' : undefined}
      >
        <header className="palace-panel-head">
          <div className="palace-panel-heading">
            <p className="eyebrow">Chi tiết cung</p>
            <h2 id="palace-panel-title">{title}</h2>
            {subtitle ? (
              <p id="palace-panel-sub" className="palace-panel-sub">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="palace-panel-close"
            onClick={onClose}
            aria-label="Đóng chi tiết cung"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="palace-panel-body">{children}</div>

        <footer className="palace-panel-foot">
          <button type="button" className="palace-panel-nav" onClick={onPrev} disabled={!onPrev}>
            ← Cung trước
          </button>
          <button type="button" className="palace-panel-nav" onClick={onNext} disabled={!onNext}>
            Cung sau →
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
