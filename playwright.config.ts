import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  workers: 1, // one shared local DB
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI === undefined ? 0 : 1,
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://localhost:5173/lola/",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx vite --port 5173 --strictPort",
    url: "http://localhost:5173/lola/",
    reuseExistingServer: process.env.CI === undefined,
  },
});
