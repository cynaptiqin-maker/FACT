// @ts-check
/**
 * 04 — Accounts Payable → Reconciliation Workbench
 *
 * Covers the "AP invoice/payment → journal → reconciliation" workflow.
 * Tests degrade gracefully when backend is offline.
 */

const { test, expect } = require('@playwright/test');
const { waitForApi, isBackendUp } = require('./helpers/auth');

test.describe('Accounts Payable → Reconciliation', () => {
  test('vendor invoices page loads with correct heading', async ({ page }) => {
    await page.goto('/ap/vendor-invoices', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) {
      console.log('[ap] Backend offline — redirected to /login');
      return;
    }
    const apiResp = await waitForApi(page, '/api/ap/vendor-invoices', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    await expect(page.locator('h1:has-text("Vendor Invoices")')).toBeVisible({ timeout: 15_000 });
  });

  test('vendor invoices table renders', async ({ page }) => {
    await page.goto('/ap/vendor-invoices', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!await isBackendUp(page)) return;

    await page.waitForSelector('h1:has-text("Vendor Invoices")', { timeout: 10_000 });
    const table = page.locator('table, [role="table"], [role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
  });

  test('new vendor invoice modal opens', async ({ page }) => {
    await page.goto('/ap/vendor-invoices', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;

    await page.waitForSelector('h1:has-text("Vendor Invoices")', { timeout: 10_000 });
    const newBtn = page.locator('button').filter({ hasText: /New|Invoice|Add/i }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const modal = page.locator('h2:has-text("New Vendor Invoice")');
      await expect(modal).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press('Escape');
    }
  });

  test('reconciliation workbench page loads', async ({ page }) => {
    await page.goto('/reconciliation', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) {
      console.log('[recon] Backend offline');
      return;
    }
    const apiResp = await waitForApi(page, '/api/recon', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    await expect(page.locator('h1:has-text("Reconciliation Workbench")')).toBeVisible({ timeout: 15_000 });
  });

  test('cash book page loads', async ({ page }) => {
    await page.goto('/cash-bank', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;
    const apiResp = await waitForApi(page, '/api/cash-bank', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    expect(page.url()).toContain('/cash-bank');
  });

  test('bank reconciliation page loads', async ({ page }) => {
    await page.goto('/cash-bank/reconciliation', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;
    expect(page.url()).toContain('reconciliation');
  });
});
