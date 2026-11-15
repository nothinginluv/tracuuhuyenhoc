/**
 * Khung đọc 12 cung: danh mục 12 cung + nội dung cung đang chọn.
 *
 * Mẫu tab của WAI-ARIA: `tablist` → `tab` → `tabpanel`, roving tabindex, phím
 * ←/→/↑/↓/Home/End. `active` do trang lá số giữ, để bấm một ô trên lá số cũng
 * mở đúng cung ở đây.
 */

import { useId, useMemo, useRef, type KeyboardEvent } from 'react';
import type { TuViReading } from '../reading.ts';
import { PalaceReadingView } from './reading-blocks.tsx';

type Props = {
  reading: TuViReading;
  active: number;
  onPick: (branch: number) => void;
};

export function ReadingPanel({ reading, active, onPick }: Props) {
  const uid = useId();
  const tabId = (branch: number) => `${uid}-tab-${branch}`;
  const panelId = `${uid}-panel`;

  // Thứ tự tên cung đi nghịch từ cung Mệnh.
  const ordered = useMemo(() => {
    const soulBranch = reading.soul.palace.branch;
    return Array.from({ length: 12 }, (_, i) => reading.palaces[(soulBranch - i + 12) % 12]!);
  }, [reading]);

  const index = ordered.findIndex((p) => p.palace.branch === active);
  const current = ordered[index] ?? ordered[0]!;

  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (i: number) => {
    const target = (i + 12) % 12;
    onPick(ordered[target]!.palace.branch);
    tabsRef.current[target]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(11);
        break;
      default:
        break;
    }
  };

  const step = (delta: number) => {
    const next = ordered[(index + delta + 12) % 12];
    if (next) onPick(next.palace.branch);
  };

  return (
    <div className="reading-panel">
      <div
        className="reading-index"
        role="tablist"
        aria-label="Mười hai cung trong lá số"
        onKeyDown={onKeyDown}
      >
        {ordered.map((p, i) => {
          const selected = p.palace.branch === active;
          const mainNames = p.stars
            .filter((s) => s.star.group === 'main')
            .map((s) => s.star.vi)
            .join(' · ');
          return (
            <button
              key={p.palace.branch}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(p.palace.branch)}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className="reading-tab"
              onClick={() => onPick(p.palace.branch)}
            >
              <span className="reading-tab-name">
                {p.palace.nameVi}
                {p.palace.isBody && <span className="tag">Thân</span>}
              </span>
              <span className="reading-tab-stars">{mainNames || 'không có sao chính'}</span>
            </button>
          );
        })}
      </div>

      <div
        className="reading-view"
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(current.palace.branch)}
        tabIndex={0}
      >
        <header className="reading-view-head">
          <h4>
            {current.palace.nameVi}
            {current.palace.isBody && <span className="tag">Thân</span>}
          </h4>
          <p className="muted">
            {current.palace.stemVi} {current.palace.branchVi} · đại hạn{' '}
            {current.dahan.fromAge}–{current.dahan.toAge}
          </p>
        </header>

        <PalaceReadingView reading={current} />

        <footer className="reading-view-foot">
          <button type="button" className="nav-btn" onClick={() => step(-1)} disabled={index === 0}>
            ← Cung trước
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={() => step(1)}
            disabled={index === 11}
          >
            Cung sau →
          </button>
        </footer>
      </div>
    </div>
  );
}
