import type { Config } from "tailwindcss";
import { posCafeStyles } from "./tailwind.posCafeStyles";
import { remakeStyles } from "./tailwind.remakeStyles";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          soft: "var(--primary-soft)",
        },
        pos: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          surface2: "var(--surface-2)",
          line: "var(--line)",
          ink: "var(--ink)",
          muted: "var(--muted)",
          primary: "var(--primary)",
          primarySoft: "var(--primary-soft)",
          primaryLine: "var(--primary-line)",
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
          rail: "var(--rail)",
        },
      },
      borderRadius: {
        pos: "8px",
      },
    },
  },
  plugins: [posCafeStyles, remakeStyles],
} satisfies Config;
