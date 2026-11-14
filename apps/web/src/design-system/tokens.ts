/**
 * Design tokens — "Sổ Thiên Văn".
 *
 * Nguồn sự thật duy nhất cho màu sắc / khoảng cách là `styles.css` (biến CSS).
 * File này chỉ ánh xạ những biến đó sang JS để dùng trong code (canvas, SVG,
 * tính toán inline) và giữ thang đo ở một chỗ. Đừng khai báo lại mã màu ở đây:
 * nếu cần đổi màu, sửa `styles.css`.
 */

/** Tên biến CSS đã có trong `styles.css`. */
export const cssVar = {
  ink: 'var(--ink)',
  inkSoft: 'var(--ink-soft)',
  muted: 'var(--muted)',
  faint: 'var(--faint)',
  paper: 'var(--paper)',
  paper2: 'var(--paper-2)',
  paper3: 'var(--paper-3)',
  paper4: 'var(--paper-4)',
  line: 'var(--line)',
  lineSoft: 'var(--line-soft)',
  lineStrong: 'var(--line-strong)',
  cinnabar: 'var(--cinnabar)',
  cinnabarDeep: 'var(--cinnabar-deep)',
  gold: 'var(--gold)',
  goldDeep: 'var(--gold-deep)',
  goldBright: 'var(--gold-bright)',
  jade: 'var(--jade)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  cream: 'var(--cream)',
  creamMuted: 'var(--cream-muted)',
} as const;

/** Bảng màu thô (chỉ để vẽ canvas/SVG cần giá trị thật). */
export const palette = {
  ink: '#1c1610',
  paper: '#f3ecdc',
  paper2: '#fbf6ea',
  cinnabar: '#9d2f20',
  gold: '#a3823f',
  jade: '#3e6450',
} as const;

/** Thang 4px — dùng cho padding/margin/gap. */
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const space = {
  xs: spacing[1],
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
  '2xl': spacing[12],
  '3xl': spacing[16],
} as const;

export const fontFamily = {
  serif: 'var(--serif)',
  sans: 'var(--sans)',
  mono: 'var(--mono)',
} as const;

/** Cỡ chữ theo bậc, kèm line-height đã chọn cho văn bản tiếng Việt. */
export const typeScale = {
  xs: { size: '0.75rem', lineHeight: '1.5' },
  sm: { size: '0.875rem', lineHeight: '1.55' },
  base: { size: '1rem', lineHeight: '1.62' },
  lg: { size: '1.125rem', lineHeight: '1.6' },
  xl: { size: '1.25rem', lineHeight: '1.5' },
  '2xl': { size: '1.5rem', lineHeight: '1.4' },
  '3xl': { size: '1.875rem', lineHeight: '1.3' },
  '4xl': { size: '2.25rem', lineHeight: '1.2' },
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const radius = {
  none: '0',
  sm: '2px',
  DEFAULT: 'var(--radius)',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const shadow = {
  card: 'var(--shadow-card)',
  none: 'none',
} as const;

/** Thời lượng chuyển động — tôn trọng `prefers-reduced-motion` ở tầng CSS. */
export const duration = {
  fast: '120ms',
  normal: '200ms',
  slow: '320ms',
} as const;

export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  emphasized: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
} as const;

/** Breakpoints đã chốt cho grid lá số. */
export const breakpoints = {
  xs: 360,
  sm: 480,
  md: 716,
  lg: 900,
  xl: 1140,
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 400,
  modal: 500,
  toast: 800,
} as const;

export const tokens = {
  cssVar,
  palette,
  spacing,
  space,
  fontFamily,
  typeScale,
  fontWeight,
  radius,
  shadow,
  duration,
  easing,
  breakpoints,
  zIndex,
} as const;
