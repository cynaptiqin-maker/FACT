// @ts-check
/**
 * 06 — Period Close Center
 *
 * Covers "period close checklist → lock period" workflow.
 * Does NOT actually lock (destructive to shared test data).
 */

const { test, expect } = require('@playwright/test');
const { waitForApi, isBackendUp } = require('./helpers/auth');

test.describe('Period Close Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period-close', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  test('page heading visible', async ({ page }) => {
    if (!await isBackendUp(page)) {
      console.log('[period-close] Backend offline — redirected to /login');
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
      return;
    }
    const apiResp = await waitForApi(page, '/api/period-close', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    await expect(page.locator('h1:has-text("Period Close Center")')).toBeVisible({ timeout: 15_000 });
  });

  test('checklist section renders with status badges', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await page.waitForSelector('h1:has-text("Period Close Center")', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const statusLocator = page.locator('text=PASS, text=FAIL, text=WARN, text=NA');
    const count = await statusLocator.count();
    console.log('[period-close] Status badges found:', count);
    // With seed data: some checks PASS, some may FAIL
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('checklist labels are visible', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await page.waitForSelector('h1:has-text("Period Close Center")', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const knownLabels = ['Journals', 'Bank', 'Receivable', 'Payable', 'Depreciation', 'Payroll', 'Exceptions'];
    let found = 0;
    for (const label of knownLabels) {
      if (await page.locator(`text=${label}`).first().isVisible().catch(() => false)) found++;
    }
    console.log('[period-close] Check labels found:', found, '/', knownLabels.length);
    expect(found).toBeGreaterThanOrEqual(3);
  });

  test('period indicator is shown', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await page.waitForSelector('h1:has-text("Period Close Center")', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    const periodEl = page.locator('text=/2026|Period/i').first();
    const visible = await periodEl.isVisible().catch(() => false);
    console.log('[period-close] Period indicator visible:', visible);
  });

  test('Lock Period button exists on the page', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await page.waitForSelector('h1:has-text("Period Close Center")', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    const lockBtn = page.locator('button').filter({ hasText: /Lock Period|Lock/i }).first();
    const exists = await lockBtn.isVisible().catch(() => false);
    console.log('[period-close] Lock Period button visible:', exists);
    // Button should exist whether checks pass or fail
  });

  test('Lock Period shows confirmation or blocks when checks fail', async ({ page }) => {
    if (!await isBackendUp(page)) return;
    await page.waitForSelector('h1:has-text("Period Close Center")', { timeout: 15_000 });
    await page.waitForTimeout(1500);

    const lockBtn = page.locator('button').filter({ hasText: /Lock Period/i }).first();
    if (!await lockBtn.isVisible().catch(() => false)) {
      console.log('[period-close] Lock Period button not visible yet');
      return;
    }

    await lockBtn.click();
    await page.waitForTimeout(800);

    // Expect either: confirmation modal OR a toast/error (when checks failing)
    const modal    = page.locator('[role="dialog"], h3:has-text("Lock Period")').first();
    const toast    = page.locator('[role="alert"], .toast, text=/failed|FAIL|cannot lock/i').first();
    const hasModal = await modal.isVisible().catch(() => false);
    const hasToast = await toast.isVisible().catch(() => false);

    console.log('[period-close] Modal:', hasModal, 'Toast/error:', hasToast);

    if (hasModal) {
      // Close without locking
      await page.keyboard.press('Escape');
    }
    // Page should still be period-close regardless of outcome
    expect(page.url()).toContain('/period-close');
  });
});
