// @ts-check
/**
 * Global setup — runs once before all tests.
 * Logs in as the demo admin and saves auth state to storageState.json
 * so every spec file can reuse the authenticated session.
 *
 * Pre-conditions:
 *   - Frontend running on FACT_URL (default: http://localhost:3000)
 *     If Vite bumped to a different port (e.g. 3004), set:
 *       FACT_URL=http://localhost:3004 npm test
 *   - Backend running on port BACKEND_PORT (default: 5001), OR
 *     let Playwright start it automatically via webServer config.
 *   - Database seeded: cd backend && npm run db:seed
 */

const { chromium } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const BASE_URL      = process.env.FACT_URL     || 'http://localhost:3000';
const BACKEND_PORT  = process.env.BACKEND_PORT || '5001';
const STORAGE_STATE = path.join(__dirname, 'storageState.json');

// JWT default expiry is 15m — reuse storageState if < 12 minutes old
const REUSE_MAX_AGE_MS = 12 * 60 * 1000;

const DEMO_EMAIL    = process.env.DEMO_EMAIL    || 'admin@factos.com';
const DEMO_COMPANY  = process.env.DEMO_COMPANY  || 'Medanta Super Specialty Hospital';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';

/** Quick TCP check: is something listening on port? */
function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = require('net').createConnection(parseInt(port), '127.0.0.1');
    sock.setTimeout(2000);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', ()  => resolve(false));
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
  });
}

/** Check if storageState.json is recent enough to reuse. */
function canReuseStorageState() {
  try {
    const stat = fs.statSync(STORAGE_STATE);
    return (Date.now() - stat.mtimeMs) < REUSE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

module.exports = async function globalSetup() {
  // Verify frontend is reachable
  const fePort = new URL(BASE_URL).port || '80';
  const feUp   = await isPortOpen(fePort || 3000);
  if (!feUp) {
    throw new Error(
      `[global-setup] Frontend not reachable at ${BASE_URL}.\n` +
      `  Start it: cd frontend && npm run dev\n` +
      `  Or override URL: FACT_URL=http://localhost:3004 npm test`
    );
  }

  // Reuse existing storageState if it's fresh (avoids hitting rate limiter)
  if (canReuseStorageState()) {
    console.log('[global-setup] Reusing recent storageState.json (< 12 min old) — skipping login');
    return;
  }

  // Warn if backend not reachable (tests will degrade gracefully)
  const beUp = await isPortOpen(BACKEND_PORT);
  if (!beUp) {
    console.warn(
      `[global-setup] ⚠ Backend not reachable on port ${BACKEND_PORT}.\n` +
      `  API tests will receive 502/network errors — start: cd backend && npm run dev`
    );
  }

  console.log(`[global-setup] Logging in at ${BASE_URL}/login as ${DEMO_EMAIL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30_000 });

  await page.fill('[placeholder="Enter username"]',      DEMO_EMAIL);
  await page.fill('[placeholder="Enter company name"]', DEMO_COMPANY);
  await page.fill('[type="password"]',                  DEMO_PASSWORD);

  // If backend is up, expect a real login redirect
  if (beUp) {
    await page.click('button[type="submit"]');
    // Wait for navigation away from /login (redirect to / or any post-login route)
    await page.waitForFunction(
      () => !window.location.pathname.startsWith('/login'),
      { timeout: 25_000 }
    );
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('[global-setup] Landed at:', currentUrl);
    console.log('[global-setup] ✓ Logged in successfully');
  } else {
    // Backend down — submit anyway so we get whatever state the app enters
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.warn('[global-setup] Backend offline — saving partial auth state');
  }

  await context.storageState({ path: STORAGE_STATE });
  console.log('[global-setup] Auth state saved →', STORAGE_STATE);

  await browser.close();
};
