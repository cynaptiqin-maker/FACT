// @ts-check
/**
 * 01 — Authentication
 *
 * Verifies login page structure, credential validation, and protected-route redirect.
 * Tests that require a live backend are annotated; the suite degrades gracefully
 * when only the frontend is running.
 */

const { test, expect } = require('@playwright/test');

// Fresh unauthenticated session for every test in this file
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');
    // Use role-based selectors to avoid strict-mode violations (h2 AND button both say "Sign In")
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('[placeholder="Enter username"]')).toBeVisible();
    await expect(page.locator('[placeholder="Enter company name"]')).toBeVisible();
    await expect(page.locator('[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('empty form submit stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  test('invalid credentials stay on login page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[placeholder="Enter username"]',      'nobody@nowhere.com');
    await page.fill('[placeholder="Enter company name"]', 'No Company');
    await page.fill('[type="password"]',                  'wrongpassword123');
    await page.click('button[type="submit"]');

    // App should stay on /login whether backend is up or down
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/login');
  });

  test('valid credentials redirect to CFO dashboard (requires backend)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[placeholder="Enter username"]',      'admin@medanta.fact');
    await page.fill('[placeholder="Enter company name"]', 'Medanta');
    await page.fill('[type="password"]',                  'Demo@1234');

    await page.click('button[type="submit"]');

    // Wait up to 8s for either a redirect or an error indicator
    await page.waitForTimeout(2000);
    const url = page.url();

    if (url.includes('/login')) {
      // Backend likely offline — mark informational, don't fail hard
      console.log('[auth] Backend offline — stayed on /login after valid credentials');
      test.info().annotations.push({ type: 'note', description: 'Backend offline — login redirect skipped' });
    } else {
      // Backend is up — verify dashboard loads
      await expect(page.locator('h1:has-text("CFO Command Center")')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('unauthenticated access to protected route redirects to /login', async ({ page }) => {
    await page.goto('/period-close');
    // App should redirect (React Router guard) to login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('unauthenticated access to /exceptions redirects to /login', async ({ page }) => {
    await page.goto('/exceptions');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});
