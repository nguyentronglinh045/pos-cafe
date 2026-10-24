// Isolated browser proof for the same theme factory used by the real drawer.
import React from "react";
import { createRoot } from "react-dom/client";
import { Button, GlobalStyles, ThemeProvider } from "@mui/material";
import { createRemakeTheme } from "@/theme/remakeTheme";
import palette from "../../../ui-remake/palette-a-v1.json";
import "@/theme/remakeFonts.css";
import "@/tailwind.css";
const changed = new URLSearchParams(location.search).has("mutate");
const colors = changed ? {
  ...palette.colors,
  "--primary": "#5B21B6",
  "--surface": "#FAFAF9",
  "--ink": "#292524"
} : palette.colors;
const {
  variables,
  theme
} = createRemakeTheme(colors);
createRoot(document.getElementById("root")!).render(<ThemeProvider theme={theme}><GlobalStyles styles={{
    ":root": variables
  }} /><button data-testid="theme-css" className="bg-pos-primary text-white">CSS và Tailwind</button><Button data-testid="theme-mui" variant="contained">MUI cùng nguồn</Button></ThemeProvider>);
