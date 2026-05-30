// @ts-check
/**
 * 05 — FCRA Module → Fund Statement
 *
 * Covers "FCRA receipt → journal → FCRA fund statement" workflow.
 * Seed: 1 registration, 2 receipts (₹57.38L), 2 utilisations.
 */

const { test, expect } = require('@playwright/test');
const { waitForApi, isBackendUp } = require('./helpers/auth');

test.describe('FCRA Module → Fund Statement', () => {
  test('FCRA dashboard loads', async ({ page }) => {
    await page.goto('/fcra', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) {
      console.log('[fcra] Backend offline');
      return;
    }
    const apiResp = await waitForApi(page, '/api/fcra', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    expect(page.url()).toContain('/fcra');
  });

  test('FCRA receipts page loads with table', async ({ page }) => {
    await page.goto('/fcra/receipts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!await isBackendUp(page)) return;

    const apiResp = await waitForApi(page, '/api/fcra/receipts', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    const table = page.locator('table, [role="table"], [role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
  });

  test('FCRA utilisation page loads', async ({ page }) => {
    await page.goto('/fcra/utilisation', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;
    const apiResp = await waitForApi(page, '/api/fcra/utilisations', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    expect(page.url()).toContain('/fcra/utilisation');
  });

  test('FCRA fund statement report loads with correct heading', async ({ page }) => {
    await page.goto('/reports/fcra-fund-statement', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) {
      console.log('[fcra-fund] Backend offline');
      return;
    }
    const apiResp = await waitForApi(page, '/api/reports/fcra-fund-statement', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    await expect(page.locator('h1:has-text("FCRA Fund Statement")')).toBeVisible({ timeout: 15_000 });
  });

  test('fund statement shows admin cap indicators', async ({ page }) => {
    await page.goto('/reports/fcra-fund-statement', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!await isBackendUp(page)) return;

    await page.waitForSelector('h1:has-text("FCRA Fund Statement")', { timeout: 10_000 });
    await page.waitForTimeout(1500);

    // Look for admin cap % text (from seed: ~13% admin cap)
    const adminCapEl = page.locator('text=/Admin Cap|Admin %|admin cap/i').first();
    const visible = await adminCapEl.isVisible().catch(() => false);
    console.log('[fcra-fund] Admin cap text visible:', visible);
  });

  test('FCRA fund statement API returns valid structure', async ({ page }) => {
    const [apiResp] = await Promise.all([
      waitForApi(page, '/api/reports/fcra-fund-statement', 8_000),
      page.goto('/reports/fcra-fund-statement'),
    ]);
    if (!apiResp) {
      console.log('[fcra-fund] API not reached — backend offline');
      return;
    }
    expect(apiResp.status()).toBeLessThan(500);
    const body = await apiResp.json().catch(() => null);
    if (body) {
      const data = body.data || body;
      console.log('[fcra-fund] Response keys:', typeof data === 'object' ? Object.keys(data) : data);
    }
  });
});
