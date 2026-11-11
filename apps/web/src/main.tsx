import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ReadingModeProvider } from './glossary.tsx';
import { ThemeProvider } from './design-system/ThemeProvider.tsx';
import './styles.css';
import './design-system/ui.css';

/* Đặt theme trước khi React render để tránh nháy màu.
   Cùng quy tắc với ThemeProvider: mặc định theo hệ điều hành. */
(function initTheme() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem('tracuuhuyenhoc:theme');
  } catch {
    /* chế độ riêng tư có thể chặn đọc */
  }
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = saved === 'dark' || ((!saved || saved === 'system') && systemDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy #root');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ReadingModeProvider>
          <App />
        </ReadingModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
