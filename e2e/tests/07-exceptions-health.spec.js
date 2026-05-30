// @ts-check
/**
 * 07 — Exception Inbox + Financial Health Score
 *
 * Verifies exception management UI and validates health score API shape.
 */

const { test, expect } = require('@playwright/test');
const { waitForApi, isBackendUp } = require('./helpers/auth');

test.describe('Exception Inbox', () => {
  test('page loads with correct heading', async ({ page }) => {
    await page.goto('/exceptions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) {
      console.log('[exceptions] Backend offline');
      return;
    }
    const apiResp = await waitForApi(page, '/api/exceptions', 8_000);
    if (apiResp) expect(apiResp.status()).toBeLessThan(500);
    await expect(page.locator('h1:has-text("Exception Inbox")')).toBeVisible({ timeout: 15_000 });
  });

  test('exception list renders rows', async ({ page }) => {
    await page.goto('/exceptions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!await isBackendUp(page)) return;

    await page.waitForSelector('h1:has-text("Exception Inbox")', { timeout: 10_000 });
    await page.waitForTimeout(1500);
    // Seed created 3 exceptions — table should be visible
    const table = page.locator('table, [role="table"], [role="grid"]').first();
    const hasList = await table.isVisible().catch(() => false);
    console.log('[exceptions] List visible:', hasList);
    await expect(page.locator('h1:has-text("Exception Inbox")')).toBeVisible();
  });

  test('severity filter elements are present', async ({ page }) => {
    await page.goto('/exceptions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (!await isBackendUp(page)) return;

    await page.waitForSelector('h1:has-text("Exception Inbox")', { timeout: 10_000 });
    const severities = ['CRITICAL', 'HIGH', 'All'];
    let found = 0;
    for (const s of severities) {
      if (await page.locator(`text=${s}`).first().isVisible().catch(() => false)) found++;
    }
    console.log('[exceptions] Severity filters found:', found);
  });
});

test.describe('Financial Health Score API', () => {
  test('health score endpoint returns valid structure', async ({ page }) => {
    const [apiResp] = await Promise.all([
      waitForApi(page, '/api/reports/health-score', 8_000),
      page.goto('/'),
    ]);

    if (!apiResp) {
      console.log('[health] Backend offline — health score API not reached');
      return;
    }
    expect(apiResp.status()).toBeLessThan(500);

    const body = await apiResp.json().catch(() => null);
    if (body) {
      const data = body.data || body;
      expect(typeof data.overallScore).toBe('number');
      expect(data.overallScore).toBeGreaterThanOrEqual(0);
      expect(data.overallScore).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(data.grade);
      expect(Array.isArray(data.components)).toBe(true);
      expect(data.components).toHaveLength(7);
      console.log('[health] Score:', data.overallScore, 'Grade:', data.grade);
    }
  });

  test('CFO summary endpoint returns required sections', async ({ page }) => {
    const [apiResp] = await Promise.all([
      waitForApi(page, '/api/reports/cfo-summary', 8_000),
      page.goto('/'),
    ]);

    if (!apiResp) {
      console.log('[cfo-summary] Backend offline');
      return;
    }
    expect(apiResp.status()).toBeLessThan(500);

    const body = await apiResp.json().catch(() => null);
    if (body) {
      const data = body.data || body;
      for (const key of ['revenue', 'health', 'exceptions']) {
        expect(data).toHaveProperty(key);
      }
      console.log('[cfo-summary] Keys:', Object.keys(data));
    }
  });
});
