import { test, expect } from '@playwright/test';

// Smoke tests that don't require an authenticated session. These exercise the
// public surface (landing + auth pages) and the middleware redirect for
// protected routes.

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/IdeaBoard/i);
});

test('login page renders the sign-in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('forgot-password page renders', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
});

test('protected route redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/stories');
  await expect(page).toHaveURL(/\/login/);
});
