/**
 * Design system "Vũ Trụ Tử Vi" — điểm vào duy nhất.
 *
 * · `tokens`   — thang đo / biến CSS ánh xạ sang JS.
 * · `ThemeProvider` — light / dark / system.
 * · `ui.css`   — style cho các component base (import ở `main.tsx`).
 * · `../components/ui` — Button, Card, Input, Select…
 */

export * from './tokens.ts';
export {
  ThemeProvider,
  useTheme,
  useIsDark,
  useRawTheme,
  type Theme,
  type ResolvedTheme,
} from './ThemeProvider.tsx';
