// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Allow overriding via env vars so CI and local dev are both covered.
// Default: frontend on 3000, backend on 5001 (matches vite.config.js proxy).
const FACT_URL     = process.env.FACT_URL     || 'http://localhost:3000';
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '5001', 10);

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',

  // Finance workflows have order dependencies — run serially
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['line'],
  ],

  use: {
    baseURL: FACT_URL,
    storageState: 'storageState.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // One-time login — saves auth state to storageState.json
  globalSetup: './global-setup.js',

  // Auto-start backend if not already running.
  // reuseExistingServer=true means: if something is already on BACKEND_PORT, skip launch.
  // Set SKIP_BACKEND_SERVER=1 to suppress this when you manage servers externally.
  webServer: process.env.SKIP_BACKEND_SERVER ? [] : [
    {
      command: 'npm run dev',
      cwd: '../backend',
      port: BACKEND_PORT,
      reuseExistingServer: true,
      timeout: 90_000,
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        NODE_ENV: 'test',
      },
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
