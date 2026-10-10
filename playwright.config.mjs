import { defineConfig } from "@playwright/test";
const externalURL = process.env.TEST_BASE_URL;
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  timeout: 600000,
  use: {
    baseURL: externalURL || "http://127.0.0.1:4173/decoupe-ia/",
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    actionTimeout: 15000,
  },
  webServer: externalURL ? undefined : {
    command: "npm run dev",
    url: "http://127.0.0.1:4173/decoupe-ia/",
    reuseExistingServer: !process.env.CI,
  },
});
