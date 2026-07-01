import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pages',
  fullyParallel: true,
  webServer: {
    command: 'npx astro dev --port 4321 --host',
    url: 'http://localhost:4321/',
    reuseExistingServer: true,
    timeout: 30000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/report' }],
  ],
  snapshotPathTemplate: '{testDir}/../baseline/screenshots/{testFilePath}/{projectName}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:4321',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
    },
  ],
});
