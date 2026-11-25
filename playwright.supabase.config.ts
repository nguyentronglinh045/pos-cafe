import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const hostedUnpair = process.env.SMOKE_SUPABASE_HOSTED_UNPAIR === "1";

export default defineConfig({
  testDir: "./tests/supabase",
  grep: hostedUnpair ? /TC-OWNER-112/ : undefined,
  timeout: 90_000,
  fullyParallel: false,
  use: {
    baseURL: hostedUnpair ? "https://pos-cafe-azure.vercel.app/" : "http://127.0.0.1:5174",
    trace: "on-first-retry",
  },
  webServer: hostedUnpair ? undefined : {
    command: "npm run dev -- --host 127.0.0.1 --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 90_000,
  },
  projects: [
    {
      name: "supabase-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
  ],
});
