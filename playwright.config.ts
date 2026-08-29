import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";
const desktopViewport = { width: 1440, height: 1000 };

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: {
    // Linux distributions rasterize the same fallback CJK glyphs slightly
    // differently. This is just above the measured CI variance (1.38%).
    toHaveScreenshot: { maxDiffPixelRatio: 0.015 },
  },
  use: {
    baseURL,
    colorScheme: "light",
    viewport: desktopViewport,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: desktopViewport },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
