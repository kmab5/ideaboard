import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests require a running app with valid Supabase credentials, so they are
 * NOT part of the default CI job. Run locally with:
 *   pnpm build && pnpm start   # in one terminal
 *   pnpm test:e2e              # in another
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
