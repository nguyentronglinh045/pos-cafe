import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RemakeThemeProvider } from "./RemakeThemeProvider";

afterEach(() => { cleanup(); document.body.classList.remove("ui-remake"); });

it("retains the shared theme while a receipt scope outlives its drawer scope", () => {
  const view = render(<><RemakeThemeProvider key="drawer">drawer</RemakeThemeProvider><RemakeThemeProvider key="receipt">receipt</RemakeThemeProvider></>);
  expect(document.body).toHaveClass("ui-remake");
  view.rerender(<>{null}<RemakeThemeProvider key="receipt">receipt</RemakeThemeProvider></>);
  expect(document.body).toHaveClass("ui-remake");
  view.unmount();
  expect(document.body).not.toHaveClass("ui-remake");
});

it("preserves a scope that existed before the provider mounted", () => {
  document.body.classList.add("ui-remake");
  const view = render(<RemakeThemeProvider>preview</RemakeThemeProvider>);
  view.unmount();
  expect(document.body).toHaveClass("ui-remake");
});
