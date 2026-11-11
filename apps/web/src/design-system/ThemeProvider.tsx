/**
 * Theme provider — light / dark / system, không nháy màu khi tải.
 *
 * · Trước khi React mount, `index.html` (hoặc script inline) đã đặt sẵn
 *   `data-theme` để trang không chớp trắng.
 * · Lựa chọn lưu ở `tracuuhuyenhoc:theme`; `system` theo dõi
 *   `prefers-color-scheme` và cập nhật ngay khi hệ điều hành đổi.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'tracuuhuyenhoc:theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    /* localStorage bị chặn — rơi về "system". */
  }
  return 'system';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#1a140e' : '#f5efe3');
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải dùng bên trong <ThemeProvider>');
  return ctx;
}

export function useIsDark(): boolean {
  return useTheme().resolvedTheme === 'dark';
}

/** Giá trị theme thô: 'light' | 'dark' | 'system'. */
export function useRawTheme(): Theme {
  return useTheme().theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()));

  // Đồng bộ DOM + localStorage mỗi khi lựa chọn đổi.
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Bỏ qua: chế độ riêng tư có thể chặn ghi. */
    }
  }, [theme]);

  // Theo dõi hệ điều hành khi đang ở chế độ "system".
  useEffect(() => {
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      if (theme !== 'system') return;
      const resolved: ResolvedTheme = mql.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const resolved = resolveTheme(current);
      return resolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
