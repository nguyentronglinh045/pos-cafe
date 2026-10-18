import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// CI installs the full Chromium browser. Keep application smoke cases and
// viewport projects unchanged while selecting that installed browser channel.
export default defineConfig({
  ...base,
  use: { ...base.use, channel: 'chromium' },
  projects: base.projects?.map(project => ({
    ...project, use: { ...project.use, channel: 'chromium' },
  })),
});
