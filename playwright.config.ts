import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 1 e2e configuration with screenshots, video, and traces for feature
 * documentation. Artifacts land in e2e/artifacts/.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    process.env.CI ? ['github'] : ['list'],
    ['html', { outputFolder: 'e2e/artifacts/report', open: 'never' }],
  ],
  outputDir: 'e2e/artifacts/test-results',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
    {
      name: 'feature-tour',
      testMatch: /feature-tour\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        video: 'on',
        screenshot: 'on',
        trace: 'on',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
