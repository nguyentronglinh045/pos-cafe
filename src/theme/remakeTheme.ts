import { createTheme } from "@mui/material/styles";
import palette from "../../ui-remake/palette-a-v1.json";
export const remakeFontFamily = '"Be Vietnam Pro", sans-serif';
export type RemakeColors = typeof palette.colors;

/** One semantic source for runtime CSS, Tailwind variables and MUI (including portals). */
export function createRemakeTheme(colors: RemakeColors = palette.colors) {
  const variables = {
    ...colors,
    "--rail": colors["--surface"],
    "--drawer-overlay": "color-mix(in srgb, var(--ink) 20%, transparent)"
  };
  const theme = createTheme({
    palette: {
      primary: {
        main: colors["--primary"],
        dark: colors["--primary-active"],
        light: colors["--primary-soft"],
        contrastText: colors["--primary-ink"]
      },
      background: {
        default: colors["--bg"],
        paper: colors["--surface"]
      },
      text: {
        primary: colors["--ink"],
        secondary: colors["--muted"]
      },
      divider: colors["--line"],
      success: {
        main: colors["--success"]
      },
      warning: {
        main: colors["--warning"]
      },
      error: {
        main: colors["--danger"]
      }
    },
    typography: {
      fontFamily: remakeFontFamily,
      button: {
        textTransform: "none",
        fontWeight: 600
      }
    },
    shape: {
      borderRadius: 8
    }
  });
  return {
    variables,
    theme
  };
}
export const remakeTheme = createRemakeTheme();
