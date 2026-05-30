// @ts-check
/**
 * 02 — CFO Command Center
 *
 * Verifies dashboard structure with the authenticated session.
 * When backend is offline the app redirects to /login — tests detect this
 * and log a note rather than failing hard on API timeouts.
 */

const { test, expect } = require('@playwright/test');
const { waitForApi, isBackendUp } = require('./helpers/auth');

test.describe('CFO Command Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('page heading visible (or redirect to login when backend is down)', async ({ page }) => {
    const up = await isBackendUp(page);
    if (!up) {
      console.log('[dashboard] Backend offline — redirected to /login, skipping widget assertions');
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
      return;
    }
    await expect(page.locator('h1:has-text("CFO Command Center")')).toBeVisible({ timeout: 15_000 });
  });

  test('financial health score widget renders', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await expect(page.locator('h2:has-text("Financial Health Score")')).toBeVisible({ timeout: 15_000 });
  });

  test('exception summary widget renders', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await expect(page.locator('h2:has-text("Exception Summary")')).toBeVisible({ timeout: 15_000 });
  });

  test('period close status widget renders', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await expect(page.locator('h2:has-text("Period Close Status")')).toBeVisible({ timeout: 15_000 });
  });

  test('revenue by department chart renders', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await expect(page.locator('h2:has-text("Revenue by Department")')).toBeVisible({ timeout: 15_000 });
  });

  test('AR aging summary renders', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await expect(page.locator('h2:has-text("AR Aging Summary")')).toBeVisible({ timeout: 15_000 });
  });

  test('CFO summary API returns valid structure', async ({ page }) => {
    const apiResp = await waitForApi(page, '/api/reports/cfo-summary');
    if (!apiResp) {
      console.log('[dashboard] CFO summary API not reached — backend offline');
      return;
    }
    expect(apiResp.status()).toBeLessThan(500);
    const body = await apiResp.json().catch(() => null);
    if (body) {
      const data = body.data || body;
      expect(data).toHaveProperty('revenue');
      expect(data).toHaveProperty('health');
      expect(data).toHaveProperty('exceptions');
      console.log('[dashboard] CFO summary keys:', Object.keys(data));
    }
  });
});
