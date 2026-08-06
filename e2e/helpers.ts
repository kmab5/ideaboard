import { type Page, expect } from '@playwright/test';

/**
 * Credentials for the authenticated suites. E2E runs need a real Supabase
 * project, so these tests are skipped unless credentials are supplied:
 *
 *   E2E_EMAIL=you@example.com E2E_PASSWORD='...' pnpm test:e2e
 *
 * Use a dedicated throwaway account — the board suite creates and deletes
 * stories.
 */
export const E2E_EMAIL = process.env.E2E_EMAIL ?? '';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';
export const hasCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD);

/** Log in through the real login form and wait for the dashboard. */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(E2E_EMAIL);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/stories/, { timeout: 20_000 });
}

/**
 * Create a story and open its board. Returns the story title so the test can
 * find and clean it up afterwards.
 */
export async function createStoryAndOpenBoard(page: Page): Promise<string> {
  const title = `E2E ${Date.now()}`;

  await page.goto('/stories');
  await page.getByRole('button', { name: /new story|create story/i }).first().click();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/title/i).fill(title);
  await dialog.getByRole('button', { name: /create/i }).click();

  // The app navigates to the new board.
  await page.waitForURL(/\/board\//, { timeout: 20_000 });
  await expect(page.locator('.react-flow')).toBeVisible({ timeout: 20_000 });

  return title;
}

/** Delete a story from the dashboard, ignoring failures during cleanup. */
export async function deleteStory(page: Page, title: string) {
  try {
    await page.goto('/stories');
    const card = page.locator('[data-testid="story-card"]', { hasText: title }).first();
    if (!(await card.count())) return;

    await card.getByRole('button', { name: /options|menu|more/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.getByRole('button', { name: /delete|confirm/i }).last().click();
  } catch {
    // Cleanup is best-effort; a failure here shouldn't fail the test run.
  }
}
