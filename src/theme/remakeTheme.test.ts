import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import palette from "../../ui-remake/palette-a-v1.json";
import { createRemakeTheme } from "./remakeTheme";

describe("shared remake theme", () => {
  it("derives CSS/Tailwind variables and MUI from the canonical semantic source", () => {
    const { variables, theme } = createRemakeTheme();
    for (const [token, color] of Object.entries(palette.colors)) expect(variables[token as keyof typeof palette.colors]).toBe(color);
    expect(theme.palette.primary.main).toBe(variables["--primary"]);
    expect(theme.palette.background.paper).toBe(variables["--surface"]);
    expect(theme.palette.text.primary).toBe(variables["--ink"]);
    expect(theme.palette.primary.contrastText).toBe(variables["--primary-ink"]);
    expect(theme.palette.text.secondary).toBe(variables["--muted"]);
    expect(theme.palette.warning.main).toBe(variables["--warning"]);
    expect(theme.typography.fontFamily).toContain("Be Vietnam Pro");
    expect(readFileSync("tailwind.config.ts", "utf8")).toContain('DEFAULT: "var(--primary)"');
  });

  it("propagates a common palette edit to CSS and MUI without modifying screens", () => {
    const colors = { ...palette.colors, "--primary": "#5B21B6", "--surface": "#FAFAF9", "--ink": "#292524" };
    const { variables, theme } = createRemakeTheme(colors);
    expect(variables["--primary"]).toBe(colors["--primary"]);
    expect(variables["--rail"]).toBe(colors["--surface"]);
    expect(palette.colors["--primary"]).not.toBe(colors["--primary"]);
    expect(theme.palette.primary.main).toBe(colors["--primary"]);
    expect(theme.palette.background.paper).toBe(variables["--surface"]);
    expect(theme.palette.text.primary).toBe(variables["--ink"]);
  });

  it("keeps literal colors out of the remade floor and order presentation", () => {
    for (const name of ["OrderDrawer.tsx", "OrderMenuPane.tsx", "OrderCartPane.tsx", "orderRemake.css"]) {
      expect(readFileSync(`src/app/drawers/pos/${name}`, "utf8"), name).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(\s*\d/i);
    }
  });
});
