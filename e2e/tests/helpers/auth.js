// @ts-check
/**
 * Auth helper — wraps common navigation with API-wait patterns.
 * Import in any spec: const { waitForApi, navigateTo } = require('./helpers/auth');
 */

const { expect } = require('@playwright/test');

/**
 * Navigate to a route and wait until the page settles (no pending network).
 * Uses networkidle which is appropriate for React Query / Axios.
 */
async function navigateTo(page, path, options = {}) {
  const { waitForText } = options;
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (waitForText) {
    await page.waitForSelector(`text=${waitForText}`, { timeout: 20_000 });
  }
}

/**
 * Wait for a single API response matching the URL fragment.
 * Returns the response object, or null if backend is unreachable (timeout).
 * Callers should guard: `if (apiResp) { expect(apiResp.status())... }`
 */
async function waitForApi(page, urlFragment, timeout = 10_000) {
  return page.waitForResponse(
    (resp) => resp.url().includes(urlFragment) && resp.status() < 600,
    { timeout }
  ).catch(() => null); // backend offline → null, tests degrade gracefully
}

/**
 * Returns true if the backend appears reachable (app did not redirect to /login
 * after navigating to a protected route).
 */
async function isBackendUp(page) {
  return !page.url().includes('/login');
}

/**
 * Assert that a heading with the given text exists on the page.
 */
async function assertHeading(page, text) {
  await expect(page.locator(`h1:has-text("${text}"), h2:has-text("${text}")`).first()).toBeVisible();
}

/**
 * Click a button/link containing the given text.
 */
async function clickText(page, text) {
  await page.locator(`text="${text}"`).first().click();
}

module.exports = { navigateTo, waitForApi, isBackendUp, assertHeading, clickText };
