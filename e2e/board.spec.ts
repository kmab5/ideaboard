import { test, expect } from '@playwright/test';
import { hasCredentials, login, createStoryAndOpenBoard, deleteStory } from './helpers';

// Board operations need a real session and database.
test.describe('board operations', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run board tests');

  let storyTitle = '';

  test.beforeEach(async ({ page }) => {
    await login(page);
    storyTitle = await createStoryAndOpenBoard(page);
  });

  test.afterEach(async ({ page }) => {
    if (storyTitle) await deleteStory(page, storyTitle);
  });

  test('creates a note on the canvas', async ({ page }) => {
    await page.getByRole('button', { name: /add note|new note/i }).first().click();
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 15_000 });
  });

  test('edits note content and renders Markdown', async ({ page }) => {
    await page.getByRole('button', { name: /add note|new note/i }).first().click();

    const node = page.locator('.react-flow__node').first();
    await expect(node).toBeVisible({ timeout: 15_000 });

    // Double-click the body to enter edit mode, type Markdown, then blur.
    await node.dblclick();
    const textarea = node.locator('textarea').first();
    await textarea.fill('**bold text**');
    await page.locator('.react-flow__pane').click({ position: { x: 10, y: 10 } });

    await expect(node.locator('strong')).toHaveText(/bold text/i, { timeout: 10_000 });
  });

  test('note content survives a reload (auto-save)', async ({ page }) => {
    await page.getByRole('button', { name: /add note|new note/i }).first().click();

    const node = page.locator('.react-flow__node').first();
    await expect(node).toBeVisible({ timeout: 15_000 });

    const marker = `persisted-${Date.now()}`;
    await node.dblclick();
    await node.locator('textarea').first().fill(marker);
    await page.locator('.react-flow__pane').click({ position: { x: 10, y: 10 } });

    // Give the debounced save a moment, then reload.
    await page.waitForTimeout(2500);
    await page.reload();

    await expect(page.locator('.react-flow__node').first()).toContainText(marker, {
      timeout: 20_000,
    });
  });

  test('undo removes a newly created note', async ({ page }) => {
    await page.getByRole('button', { name: /add note|new note/i }).first().click();
    await expect(page.locator('.react-flow__node')).toHaveCount(1, { timeout: 15_000 });

    await page.locator('.react-flow__pane').click({ position: { x: 20, y: 20 } });
    await page.keyboard.press('Control+z');

    await expect(page.locator('.react-flow__node')).toHaveCount(0, { timeout: 10_000 });
  });

  test('creates a component and sees it in the panel', async ({ page }) => {
    await page.getByRole('button', { name: /components/i }).first().click();

    const panel = page.getByRole('heading', { name: /^components$/i });
    await expect(panel).toBeVisible({ timeout: 10_000 });

    // Open the create dialog (the + button in the panel header).
    await page.getByRole('button', { name: /add component|new component|plus/i }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/name/i).first().fill('trust');
    await dialog.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText('@trust')).toBeVisible({ timeout: 10_000 });
  });

  test('canvas persists across navigation', async ({ page }) => {
    await page.getByRole('button', { name: /add note|new note/i }).first().click();
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 15_000 });

    await page.waitForTimeout(2000);
    await page.goto('/stories');
    await page.goBack();

    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 20_000 });
  });
});
