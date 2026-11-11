/**
 * Nền sao cho bìa — canvas 2D, không thư viện.
 *
 * Nguyên tắc để không phá hiệu năng:
 * · Số sao tính theo diện tích, tối đa 160; DPR chặn ở 2.
 * · Vòng vẽ dừng khi canvas ra khỏi khung nhìn hoặc tab bị ẩn.
 * · `prefers-reduced-motion` → vẽ một khung tĩnh, không chạy vòng lặp.
 * Toàn bộ là trang trí: `aria-hidden`, không nhận sự kiện chuột.
 */

import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  twinkle: number;
  drift: number;
};

const MAX_STARS = 160;
const AREA_PER_STAR = 11000;

export function StarField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let onScreen = true;
    let started = 0;

    const makeStars = () => {
      const count = Math.min(MAX_STARS, Math.max(28, Math.round((width * height) / AREA_PER_STAR)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.14 ? 1.6 + Math.random() * 0.9 : 0.5 + Math.random() * 0.7,
        base: 0.22 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.4 + Math.random() * 1.2,
        drift: 2 + Math.random() * 7,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      if (reduceMotion) draw(0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = time * 0.001;
      for (const s of stars) {
        const alpha = Math.max(0.08, s.base * (0.7 + 0.3 * Math.sin(t * s.twinkle + s.phase)));
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 214, 178, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.5) {
          // Quầng mờ cho vài sao lớn, vẽ bằng vòng tròn alpha thấp (rẻ hơn shadowBlur).
          ctx.beginPath();
          ctx.fillStyle = `rgba(216, 185, 120, ${alpha * 0.16})`;
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    let last = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!onScreen || document.hidden) return;
      if (!started) started = time;
      const dt = last ? Math.min(64, time - last) : 16;
      last = time;
      // Trôi chậm lên trên; hết mép thì quay lại đáy.
      for (const s of stars) {
        s.y -= (s.drift * dt) / 1000;
        if (s.y < -4) {
          s.y = height + 4;
          s.x = Math.random() * width;
        }
      }
      draw(time - started);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const intersection = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
      },
      { rootMargin: '120px' },
    );
    intersection.observe(canvas);

    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className ? `star-field ${className}` : 'star-field'} aria-hidden="true" />;
}
