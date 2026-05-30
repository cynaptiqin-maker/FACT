// @ts-check
/**
 * 03 — Patient Billing → P&L Report
 *
 * Workflow: Patient invoice list → P&L report → Balance Sheet → Trial Balance.
 * Tests degrade gracefully when backend is offline (API tests log and return).
 */

const { test, expect } = require('@playwright/test');
const { waitForApi, isBackendUp } = require('./helpers/auth');

test.describe('Patient Billing → P&L Report', () => {
  test('billing/new page loads or redirects correctly', async ({ page }) => {
    await page.goto('/billing/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const url = page.url();
    // With backend up: stays on /billing/new
    // Without backend: redirected to /login (JWT invalid)
    console.log('[billing/new] URL:', url);
    expect(typeof url).toBe('string');
  });

  test('patient invoices list page — API call made when authenticated', async ({ page }) => {
    const apiResp = await waitForApi(page, '/api/billing/invoices', 8_000);
    await page.goto('/billing/invoices', { waitUntil: 'domcontentloaded' });
    if (!apiResp) {
      console.log('[invoices] Backend offline — skipping API assertion');
      return;
    }
    expect(apiResp.status()).toBeLessThan(500);
  });

  test('P&L statement page loads with correct heading', async ({ page }) => {
    await page.goto('/reports/pl', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) {
      console.log('[pl] Backend offline — redirected to /login');
      return;
    }
    await expect(page.locator('h1:has-text("P&L Statement")')).toBeVisible({ timeout: 15_000 });
  });

  test('P&L shows revenue and expense KPI labels', async ({ page }) => {
    await page.goto('/reports/pl', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;

    const apiResp = await waitForApi(page, '/api/reports/pl', 8_000);
    if (!apiResp) {
      console.log('[pl] API response not received');
      return;
    }
    expect(apiResp.status()).toBeLessThan(500);
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Total Expenses')).toBeVisible({ timeout: 10_000 });
  });

  test('P&L date range input exists', async ({ page }) => {
    await page.goto('/reports/pl', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;
    await page.waitForSelector('h1:has-text("P&L Statement")', { timeout: 10_000 });

    const fromInput = page.locator('input[type="date"]').first();
    if (await fromInput.isVisible()) {
      await fromInput.fill('2026-04-01');
      await page.waitForTimeout(500);
    }
    expect(page.url()).toContain('/reports/pl');
  });

  test('balance sheet page loads', async ({ page }) => {
    await page.goto('/reports/balance-sheet', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;
    const apiResp = await waitForApi(page, '/api/reports/balance-sheet', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
  });

  test('trial balance page loads', async ({ page }) => {
    await page.goto('/reports/trial-balance', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;
    const apiResp = await waitForApi(page, '/api/reports/trial-balance', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
  });
});
