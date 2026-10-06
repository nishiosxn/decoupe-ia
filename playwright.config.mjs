import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173/decoupe-ia/',
    channel: process.env.CI ? undefined : 'chrome',
    headless: true,
    actionTimeout: 15000,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:4173/decoupe-ia/',
    reuseExistingServer: !process.env.CI,
  },
});
