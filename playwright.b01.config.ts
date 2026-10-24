import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui-remake", timeout: 60_000, workers: 2, fullyParallel: true,
  outputDir: "artifacts/b01-responsive/output",
  reporter: [["list"], ["json", { outputFile: "artifacts/b01-responsive/results.json" }]],
  use: { baseURL: "http://127.0.0.1:5176", channel: "chromium", viewport: { width: 1920, height: 1080 },
    locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", colorScheme: "light", reducedMotion: "reduce", hasTouch: true,
    screenshot: "only-on-failure", trace: "off" },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5176 --strictPort", url: "http://127.0.0.1:5176",
    reuseExistingServer: false, env: { VITE_DATA_MODE: "mock", VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "" } },
});
