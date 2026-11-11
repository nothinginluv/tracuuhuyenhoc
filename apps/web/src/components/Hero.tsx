/**
 * Bìa trang — "cổng vào" lá số.
 *
 * Toàn bộ phần này là dẫn nhập: không chứa dữ liệu, không tự luận gì. Ba con số
 * trong danh sách là ba bảo đảm của dự án (lịch kiểm chứng, quy ước công khai,
 * dẫn nguồn). Nút chính chỉ cuộn tới biểu mẫu — mọi tính toán vẫn ở đó.
 *
 * Chuyển động: sao trôi (canvas) + la bàn dịch nhẹ theo cuộn. Cả hai tắt khi
 * người dùng chọn `prefers-reduced-motion`.
 */

import { useEffect, useRef, type MouseEvent } from 'react';
import { LuopanArt } from './Ornaments.tsx';
import { StarField } from './StarField.tsx';

export function Hero({ onMethod }: { onMethod: () => void }) {
  const artRef = useRef<HTMLDivElement>(null);

  /**
   * Cuộn tới biểu mẫu theo chiều cao thật của header.
   *
   * Không để trình duyệt tự nhảy `#bieu-mau`: header dính cao 65px trên desktop
   * nhưng cao hơn nhiều trên điện thoại (thanh tab xuống dòng), và thẻ biểu mẫu
   * còn kéo lên đè mép bìa bằng margin âm. Tính theo phần tử thật thì mọi kích
   * thước đều đúng. Không có JS thì `href` vẫn hoạt động như một neo thường.
   */
  const scrollToForm = (event: MouseEvent<HTMLAnchorElement>) => {
    const form = document.querySelector<HTMLElement>('#bieu-mau .form');
    if (!form) return; // Để trình duyệt xử lý như bình thường.

    event.preventDefault();
    const header = document.querySelector('.site-head')?.getBoundingClientRect().height ?? 0;
    const top = form.getBoundingClientRect().top + window.scrollY - header - 16;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#bieu-mau');
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = artRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const shift = Math.min(window.scrollY, 420) * 0.06;
      el.style.setProperty('--hero-shift', `${shift.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero">
      <StarField className="hero-stars" />
      <div className="hero-art" aria-hidden="true" ref={artRef}>
        <LuopanArt className="luopan" />
      </div>
      <div className="hero-inner">
        <p className="eyebrow">Tử Vi Đẩu Số · Bát Tự / Tứ Trụ</p>
        <h1>
          Lá số minh bạch.
          <br />
          <span className="hero-accent">Không phán.</span>
        </h1>
        <p className="hero-lede">
          Mỗi con số đều có đường đi: từ giờ trên đồng hồ, qua múi giờ lịch sử, tiết khí, âm lịch
          — đến ngôi sao. Chỗ nào có tranh cãi, chúng tôi cho bạn chọn và ghi rõ.
        </p>

        <div className="hero-actions">
          <a className="hero-cta" href="#bieu-mau" onClick={scrollToForm}>
            Lập lá số của bạn
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 5v14M6 13l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <button type="button" className="hero-cta hero-cta--ghost" onClick={onMethod}>
            Xem cách tính
          </button>
        </div>

        <ul className="hero-facts">
          <li>
            <span className="hero-fact-no">01</span>
            <strong>Lịch có kiểm chứng</strong>
            <small>Tiết khí theo UTC · bảng dựng cho 1899–2102</small>
          </li>
          <li>
            <span className="hero-fact-no">02</span>
            <strong>Quy ước công khai</strong>
            <small>Đổi được từng lựa chọn, khác biệt đều ghi rõ</small>
          </li>
          <li>
            <span className="hero-fact-no">03</span>
            <strong>Dẫn nguồn nguyên văn</strong>
            <small>Mỗi câu Hán qua cổng kiểm SHA-256</small>
          </li>
        </ul>
      </div>
    </section>
  );
}
