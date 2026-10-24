import { defineConfig } from '@playwright/test';
const out = process.env.B02_EVIDENCE_DIR ?? `artifacts/ui-remake/b02-responsive-${Date.now()}`;
export default defineConfig({
  testDir: './tests/ui-remake/b02', testMatch: '**/*.spec.ts', timeout: 60_000,
  workers: 2, fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5182', channel: 'chromium', reducedMotion:'reduce', trace: 'retain-on-failure' },
  reporter: [['list'], ['json', { outputFile: `${out}/results.json` }]],
  outputDir: `${out}/traces`,
});
