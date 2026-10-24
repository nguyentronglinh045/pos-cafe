import "./remakeFonts.css";
import { GlobalStyles, ThemeProvider } from "@mui/material";
import { useLayoutEffect, type ReactNode } from "react";
import { remakeFontFamily, remakeTheme } from "./remakeTheme";
let activeScopes = 0;
let originalScope = false;
export function RemakeThemeProvider({
  children
}: {
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    if (activeScopes === 0) originalScope = document.body.classList.contains("ui-remake");
    activeScopes++;
    document.body.classList.add("ui-remake");
    return () => {
      activeScopes--;
      if (activeScopes === 0 && !originalScope) document.body.classList.remove("ui-remake");
    };
  }, []);
  return <ThemeProvider theme={remakeTheme.theme}>
    <GlobalStyles styles={{
      ":root:has(body.ui-remake)": remakeTheme.variables,
      ".ui-remake": {
        ...remakeTheme.variables,
        color: "var(--ink)",
        background: "var(--bg)",
        fontFamily: remakeFontFamily,
        fontSize: 14,
        lineHeight: 1.5
      }
    }} />
    {children}
  </ThemeProvider>;
}
