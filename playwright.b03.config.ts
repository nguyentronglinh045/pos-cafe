import { defineConfig } from "@playwright/test";
const out = process.env.B03_EVIDENCE_DIR ?? `artifacts/ui-remake/b03-responsive-${Date.now()}`;
export default defineConfig({
  testDir: "./tests/ui-remake/b03", testMatch: "**/*.spec.ts", timeout: 60_000,
  workers: 2, fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:5183", channel: "chromium", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", colorScheme: "light", reducedMotion: "reduce", trace: "retain-on-failure" },
  reporter: [["list"], ["json", { outputFile: `${out}/results.json` }]], outputDir: `${out}/traces`,
});
