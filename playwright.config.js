import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4173" },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
  webServer: {
    command: "python3 -m http.server 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
