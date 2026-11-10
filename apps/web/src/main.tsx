import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ReadingModeProvider } from './glossary.tsx';
import './styles.css';

/* Khởi tạo chế độ tối trước khi React render để tránh nháy màu. */
(function initTheme() {
  const rootEl = document.documentElement;
  const saved = localStorage.getItem('tracuuhuyenhoc:theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && systemDark)) {
    rootEl.setAttribute('data-theme', 'dark');
  } else {
    rootEl.removeAttribute('data-theme');
  }
})();

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy #root');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ReadingModeProvider>
        <App />
      </ReadingModeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
