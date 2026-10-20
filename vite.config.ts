import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // This SPA has one HTML entry. Tool fixtures are not app entry points and
  // can contain deliberate root backlinks for path-containment tests.
  optimizeDeps: { entries: ["index.html"] },
  server: {
    watch: {
      // Tool fixtures include deliberate path-escape junctions. Generated
      // evidence must never enter Vite's recursive source watcher.
      ignored: ["**/artifacts/**", "**/ui-audit/out/**", "**/ui-audit/report.{json,md}"],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
