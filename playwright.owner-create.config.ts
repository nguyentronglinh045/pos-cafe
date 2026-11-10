import { defineConfig } from "@playwright/test";
import smoke, { smokeWebServer } from "./playwright.config";

export default defineConfig({
  ...smoke,
  testDir: "./tests/owner-create",
  workers: 1,
  projects: smoke.projects?.filter(project => project.name !== "demo-runbook"),
  webServer: {
    ...smokeWebServer,
    env: { ...smokeWebServer.env, VITE_OWNER_CREATE_FIXTURE: "1" },
  },
});
