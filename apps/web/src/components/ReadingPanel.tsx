/**
 * Khung đọc 12 cung: danh mục bên trái, nội dung một cung bên phải.
 *
 * Trước đây mỗi cung là một khối sổ xuống — mở cung nào là cả trang dài thêm
 * và cả 12 khối nội dung vẫn nằm trong DOM. Khung này chỉ dựng nội dung của
 * cung đang chọn:
 *   · desktop (≥900px): danh mục dọc 12 cung + nội dung;
 *   · hẹp hơn: danh mục thành dải cuộn ngang, nội dung nằm dưới.
 *
 * Dùng đúng mẫu tab của WAI-ARIA: `tablist` → `tab` → `tabpanel`, roving
 * tabindex, phím ←/→/↑/↓/Home/End. Nội dung lấy từ `PalaceDetail` — cùng một
 * nguồn với bảng trượt trên lá số nên hai chỗ không thể lệch.
 */

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { TuViReading } from '../reading.ts';
import { PalaceDetail, type PalaceRules } from './reading-blocks.tsx';

type Props = { reading: TuViReading; rules?: PalaceRules };

export function ReadingPanel({ reading, rules }: Props) {
  const uid = useId();
  const tabId = (branch: number) => `${uid}-tab-${branch}`;
  const panelId = `${uid}-panel`;

  // Thứ tự tên cung đi nghịch từ cung Mệnh — giống bảng trượt.
  const ordered = useMemo(() => {
    const soulBranch = reading.soul.palace.branch;
    return Array.from({ length: 12 }, (_, i) => reading.palaces[(soulBranch - i + 12) % 12]!);
  }, [reading]);

  const soulBranch = reading.soul.palace.branch;
  const [picked, setPicked] = useState<number | null>(null);
  const active = picked !== null && reading.palaces[picked] ? picked : soulBranch;
  const index = ordered.findIndex((p) => p.palace.branch === active);
  const current = ordered[index] ?? ordered[0]!;

  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const indexRef = useRef<HTMLDivElement>(null);

  const focusTab = (i: number) => {
    const target = (i + 12) % 12;
    setPicked(ordered[target]!.palace.branch);
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
    if (!next) return;
    setPicked(next.palace.branch);

    // Giữ ô vừa chọn trong tầm mắt của danh mục, nhưng chỉ cuộn danh mục —
    // không kéo cả trang (người dùng đang đọc ở dưới).
    const strip = indexRef.current;
    const tab = tabsRef.current[(index + delta + 12) % 12];
    if (!strip || !tab) return;
    const tabRect = tab.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({
      left: strip.scrollLeft + tabRect.left - stripRect.left - (stripRect.width - tabRect.width) / 2,
      top: strip.scrollTop + tabRect.top - stripRect.top - (stripRect.height - tabRect.height) / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="reading-panel">
      <div
        className="reading-panel-index"
        role="tablist"
        aria-label="Mười hai cung trong lá số"
        ref={indexRef}
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
              onClick={() => setPicked(p.palace.branch)}
            >
              <span className="reading-tab-name">
                {p.palace.nameVi}
                {p.palace.isBody && <span className="tag tag-body">Thân</span>}
              </span>
              <span className="reading-tab-meta">
                {p.palace.stemVi} {p.palace.branchVi} · hạn {p.dahan.fromAge}–{p.dahan.toAge}
              </span>
              <span className="reading-tab-stars">{mainNames || 'không có chính tinh'}</span>
            </button>
          );
        })}
      </div>

      <div
        className="reading-panel-view"
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(active)}
        tabIndex={0}
      >
        <header className="reading-panel-head">
          <p className="eyebrow">Cung {index + 1} / 12</p>
          <h4>
            {current.palace.nameVi}
            {current.palace.isBody && <span className="tag tag-body">Thân</span>}
          </h4>
          <p className="reading-panel-meta">
            {current.palace.stemVi} {current.palace.branchVi} · đại hạn{' '}
            {current.dahan.fromAge}–{current.dahan.toAge}
          </p>
        </header>

        <PalaceDetail reading={current} rules={rules?.get(current.palace.branch)} headingLevel={5} />

        <footer className="reading-panel-foot">
          <button
            type="button"
            className="rp-nav"
            onClick={() => step(-1)}
            disabled={index === 0}
          >
            ← Cung trước
          </button>
          <button type="button" className="rp-nav" onClick={() => step(1)} disabled={index === 11}>
            Cung sau →
          </button>
        </footer>
      </div>
    </div>
  );
}
