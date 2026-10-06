import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/release",
  testMatch: "**/*.spec.js",
  globalSetup: "./tests/release/global-setup.mjs",
  timeout: 60000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5002", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "release-desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "release-mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
