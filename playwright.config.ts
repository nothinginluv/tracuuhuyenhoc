import { defineConfig, devices } from '@playwright/test';

/**
 * E2E cho luồng chính: nhập ngày sinh → lá số → khung đọc 12 cung → dẫn nguồn.
 *
 * Chạy: `npm run e2e` (tự dựng dev server nếu chưa có). CI cần
 * `npx playwright install --with-deps chromium` trước.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
