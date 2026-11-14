import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ReadingModeProvider } from './glossary.tsx';
import './styles.css';
import './design-system/ui.css';

/* Chỉ chế độ sáng — không đọc `prefers-color-scheme`, không đặt `data-theme`. */

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
