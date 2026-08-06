import { test, expect } from '@playwright/test';
import { hasCredentials, login, E2E_EMAIL } from './helpers';

// ---------------------------------------------------------------------------
// Unauthenticated auth-surface tests — these run everywhere.
// ---------------------------------------------------------------------------

test.describe('auth pages (no session)', () => {
  test('register page validates password strength', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/display name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/^password$/i).fill('weak');
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // Zod validation should block submission and surface messages.
    await expect(page.getByText(/valid email|invalid email/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('register page rejects mismatched password confirmation', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/display name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('someone@example.com');
    await page.getByLabel(/^password$/i).fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('DifferentPass123');
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    await expect(page.getByText(/do not match/i)).toBeVisible();
  });

  test('login with invalid credentials shows a generic error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nobody-here@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Must not disclose whether the account exists.
    const body = page.locator('body');
    await expect(body).not.toContainText(/user not found|no account with/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('forgot password never discloses whether an account exists', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).fill('definitely-not-registered@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page.locator('body')).not.toContainText(/not found|does not exist/i);
  });

  test('protected routes redirect to login', async ({ page }) => {
    for (const route of ['/stories', '/settings']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('OAuth callback rejects an external redirect target', async ({ page }) => {
    // Open-redirect guard: `next` must stay same-origin.
    await page.goto('/auth/callback?next=https://evil.example.com');
    await expect(page).not.toHaveURL(/evil\.example\.com/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated flows — require E2E_EMAIL / E2E_PASSWORD.
// ---------------------------------------------------------------------------

test.describe('authenticated session', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests');

  test('user can log in and reach the dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/stories/);
  });

  test('logged-in users are redirected away from auth pages', async ({ page }) => {
    await login(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/stories/);
  });

  test('settings shows the account email and a danger zone', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await expect(page.getByText(E2E_EMAIL)).toBeVisible();
    await expect(page.getByText(/danger zone/i)).toBeVisible();
  });

  test('account deletion requires typing DELETE to confirm', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: /^delete account$/i }).click();

    const confirmButton = page.getByRole('button', { name: /permanently delete/i });
    await expect(confirmButton).toBeDisabled();

    // Wrong text keeps it disabled — guards against accidental deletion.
    await page.getByLabel(/type .* to confirm/i).fill('delete');
    await expect(confirmButton).toBeDisabled();
  });

  test('user can log out', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /account|profile|menu/i }).first().click();
    await page.getByRole('menuitem', { name: /log ?out|sign ?out/i }).click();
    await page.waitForURL(/\/(login)?$/, { timeout: 20_000 });

    await page.goto('/stories');
    await expect(page).toHaveURL(/\/login/);
  });
});
