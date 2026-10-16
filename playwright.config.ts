import { defineConfig, devices } from "@playwright/test";

// Run via `npm run e2e` (scripts/slot.sh): this worktree's own Vite on its slot's e2e port,
// talking to its slot's Supabase. Never reuse a running server: it may belong to another slot.
const port = process.env.LOLA_E2E_PORT ?? "5273";
const baseURL = `http://localhost:${port}/lola/`;

export default defineConfig({
  testDir: "e2e",
  workers: 1, // one local DB per slot
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI === undefined ? 0 : 1,
  use: {
    ...devices["Pixel 7"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
