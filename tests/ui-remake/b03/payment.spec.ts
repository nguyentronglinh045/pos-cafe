import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { loginAsAdmin } from "../../smoke/helpers";
const matrix = [[568, 320], [844, 390], [981, 320], [1024, 600], [1024, 768], [1440, 900], [1920, 1080], [2560, 1080], [759, 390], [760, 390], [761, 390], [1099, 600], [1100, 600], [1101, 600], [568, 479], [568, 480], [568, 481], [1024, 479], [1024, 480], [1024, 481]];
async function fixture(page: Page, state = "full", width = 568, height = 320) {
  await page.setViewportSize({
    width,
    height
  });
  await page.goto(`/tests/ui-remake/b03/harness.html?case=${state}`);
  await expect(page.getByTestId("payment-drawer")).toBeVisible();
  if (!["missing", "loading", "error", "empty"].includes(state)) await expect(page.getByTestId("payment-amount-due-value")).not.toHaveAttribute("data-amount", "0");
  await page.evaluate(() => document.fonts.ready);
}
async function geometry(page: Page, all = true) {
  await page.mouse.move(-1, -1);
  await page.locator(':root:not(:has([data-rht-toaster] > div)) [data-testid="payment-drawer"]').waitFor({
    timeout: 15000
  });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const failures = await page.getByTestId("payment-drawer").evaluate((root, all) => {
    const errors: string[] = [],
      rect = root.getBoundingClientRect();
    if (rect.x < -1 || rect.y < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) errors.push("drawer outside viewport");
    if (document.documentElement.scrollWidth > innerWidth + 1) errors.push("document overflow");
    const positions = [root, ...Array.from(root.querySelectorAll("*"))].map(e => ({
      e,
      x: e.scrollLeft,
      y: e.scrollTop
    }));
    const controls = root.querySelectorAll<HTMLElement>(all ? "button,input" : '[data-testid="pay-button-footer"],[data-testid="b03-close"],[data-testid="payment-received-amount"]');
    for (const e of controls) {
      if (!e.getClientRects().length) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) errors.push(`${e.dataset.testid}: target${r.width}x${r.height}`);
      if (parseFloat(getComputedStyle(e).fontSize) < 12) errors.push(`${e.dataset.testid}: font<12`);
      if (e.matches(":disabled")) continue;
      e.scrollIntoView({
        block: "center",
        inline: "nearest"
      });
      const b = e.getBoundingClientRect(),
        hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      if (!hit || !e.contains(hit)) errors.push(`${e.dataset.testid}: occluded`);
    }
    for (const e of root.querySelectorAll<HTMLElement>(".body,.cashier,.amount-box,.row,.grand,.line")) if (e.scrollWidth > e.clientWidth + 1) errors.push(`${e.className}: horizontal clipping`);
    positions.forEach(({
      e,
      x,
      y
    }) => {
      e.scrollLeft = x;
      e.scrollTop = y;
    });
    return errors;
  }, all);
  expect(failures).toEqual([]);
}
for (const [width, height] of matrix) test(`matrix ${width}x${height} full/change/partial`, async ({
  page
}, info) => {
  await page.setViewportSize({
    width: 1920,
    height: 1080
  });
  await page.goto("/");
  await loginAsAdmin(page);
  await page.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02").click();
  await page.getByTestId("submit-order-button-footer").click();
  await expect(page.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "125000");
  await page.setViewportSize({
    width,
    height
  });
  await geometry(page);
  await page.getByTestId("payment-received-amount").fill("200000");
  await expect(page.getByTestId("payment-change-summary-value")).toContainText("75.000");
  await geometry(page);
  await page.getByTestId("pay-select-all").uncheck();
  await page.getByTestId("pay-item-checkbox").first().check();
  await expect(page.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "29000");
  await page.getByTestId("payment-received-amount").fill("50000");
  await geometry(page);
  await page.getByTestId("b03-meta").click();
  await page.screenshot({
    path: info.outputPath("partial.png")
  });
});
test("fluid width sweep and exact breakpoint edges", async ({
  page
}, info) => {
  test.setTimeout(180000);
  await fixture(page);
  const data = [];
  const widths = [...new Set([...Array.from({
    length: 43
  }, (_, i) => 568 + i * 32), 1920, 759, 760, 761, 1099, 1100, 1101])].sort((a, b) => a - b);
  for (const height of [320, 390, 600]) for (const width of widths.filter(w => w > height)) {
    await page.setViewportSize({
      width,
      height
    });
    await geometry(page, false);
    data.push({
      width,
      height,
      pass: true
    });
  }
  await fs.writeFile(info.outputPath("sweep.json"), JSON.stringify(data, null, 2));
});
for (const state of ["missing", "loading", "error", "empty", "paid", "void", "deny", "cashier"]) test(`state ${state}`, async ({
  page
}, info) => {
  await fixture(page, state);
  await geometry(page);
  if (["missing", "loading", "error", "empty", "paid", "void", "deny"].includes(state)) await expect(page.getByTestId("pay-button-footer")).toBeDisabled();
  if (state === "error") {
    await page.evaluate(() => (window as any).b03.retry());
    await page.getByRole("button", {
      name: "Thử tải lại",
      exact: true
    }).click();
    await expect(page.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "125000");
  }
  if (state === "cashier") await expect(page.getByTestId("pay-button-footer")).toBeEnabled();
  if (state === "empty") await expect(page.getByText("Chưa có món trong đơn.")).toBeVisible();
  if (state === "paid" || state === "void") await expect(page.getByTestId("payment-closed-state")).toBeVisible();
  await page.screenshot({
    path: info.outputPath(`${state}.png`)
  });
});
test("keyboard focus, receipt overlay, Escape and touch controls", async ({
  page,
  context
}) => {
  await fixture(page);
  await expect(page.getByTestId("payment-close-button")).toHaveAccessibleName("Quay lại");
  await page.getByTestId("b03-back-footer").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("payment-close-button")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByTestId("b03-back-footer")).toBeFocused();
  await page.getByTestId("print-provisional-button").click();
  const receipt = page.getByTestId("receipt-preview");
  await expect(receipt).toBeVisible();
  for (const button of await receipt.getByRole("button").all()) {
    const rect = await button.boundingBox();
    expect(rect?.width).toBeGreaterThanOrEqual(44);
    expect(rect?.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByTestId("receipt-print-button").focus();
  await page.keyboard.press("Tab");
  await expect(receipt.locator("button").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(receipt).toBeHidden();
  await expect(page.getByTestId("print-provisional-button")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("payment-drawer")).toBeHidden();
  const touch = await context.browser()!.newContext({
    hasTouch: true,
    viewport: {
      width: 568,
      height: 320
    },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh", colorScheme: "light", reducedMotion: "reduce"
  });
  try {
    const p = await touch.newPage();
    await p.goto(new URL("/tests/ui-remake/b03/harness.html",page.url()).href);
    await p.getByTestId("pay-select-all").tap();
    await p.getByTestId("pay-item-checkbox").first().tap();
    await p.getByTestId("pay-item-plus").first().tap();
    await expect(p.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "58000");
    await geometry(p);
  } finally {
    await touch.close();
  }
});
test("authority gate keeps hidden payment dialogs out of keyboard handling", async ({ page }) => {
  await fixture(page);
  await page.evaluate(() => (window as any).b03.gate());
  await expect(page.getByTestId("payment-drawer")).toBeHidden();
  await page.getByTestId("gate-retry").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("gate-next")).toBeFocused();
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => (window as any).b03.store.getState().drawer)).toBe("payment");
});
test("receipt authority recovery rebinds keyboard focus for provisional and initial receipts", async ({ page }) => {
  for (const initial of [false, true]) {
    await fixture(page);
    await page.getByTestId(initial ? "pay-button-footer" : "print-provisional-button").click();
    const receipt = page.getByTestId("receipt-preview");
    await expect(receipt).toBeVisible();
    await page.evaluate(() => (window as any).b03.gate());
    await expect(receipt).toBeHidden();
    await page.getByTestId("gate-retry").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("gate-next")).toBeFocused();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => !!(window as any).b03.store.getState().receiptPreview)).toBe(true);
    await page.evaluate(() => (window as any).b03.restoreAuthority());
    await expect(receipt).toBeVisible();
    await page.getByTestId("receipt-print-button").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("receipt-close-header")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(receipt).toBeHidden();
  }
});
test("stress: 100 lines, long labels, quantity999 and large money", async ({
  page
}, info) => {
  await fixture(page, "stress");
  await expect(page.getByTestId("pay-item-line")).toHaveCount(100);
  await geometry(page);
  await page.getByTestId("pay-item-checkbox").last().scrollIntoViewIfNeeded();
  await expect(page.getByTestId("pay-item-checkbox").last()).toBeInViewport();
  await page.getByTestId("payment-received-amount").fill("999999999");
  await expect(page.getByTestId("pay-button-footer")).toBeDisabled();
  await geometry(page);
  await page.setViewportSize({
    width: 761,
    height: 390
  });
  await geometry(page);
  await page.screenshot({
    path: info.outputPath("stress.png")
  });
});
test("money input, quick options, insufficient and refetch intent", async ({
  page
}) => {
  await fixture(page);
  const amount = page.getByTestId("payment-received-amount");
  await amount.fill("200000");
  await page.getByTestId("b03-quick-1").click();
  await expect(amount).toHaveValue("145.000");
  await amount.fill("124999");
  await expect(page.getByTestId("payment-insufficient-warning")).toContainText("1");
  await expect(page.getByTestId("pay-button-footer")).toBeDisabled();
  await amount.fill("999999999999");
  await expect(amount).toHaveValue("999.999.999");
  await page.getByTestId("payment-key-delete").click();
  await expect(amount).toHaveValue("99.999.999");
  await page.getByTestId("pay-select-all").uncheck();
  await page.evaluate(() => (window as any).b03.remote());
  await expect(page.getByTestId("pay-select-all")).not.toBeChecked();
  await expect(page.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "0");
});
test("offline, pending, unknown and conflict keep recovery/close reachable", async ({
  page,
  context
}) => {
  await fixture(page);
  await context.setOffline(true);
  await expect(page.getByTestId("write-attempt-notice")).toBeVisible();
  await expect(page.getByTestId("pay-button-footer")).toBeDisabled();
  await geometry(page);
  await context.setOffline(false);
  for (const state of ["pending", "unknown", "conflict"]) {
    await fixture(page, state);
    await page.getByTestId("print-receipt-checkbox").uncheck();
    await page.getByTestId("pay-button-footer").click();
    if (state !== "conflict") await expect(page.getByTestId("pay-button-footer")).toBeDisabled();
    if (state === "unknown") await expect(page.getByTestId("write-attempt-notice")).toBeVisible();
    await geometry(page);
  }
});
test("full success receipt remains keyboard accessible after drawer unmount", async ({
  page
}) => {
  await fixture(page);
  await page.getByTestId("pay-button-footer").click();
  await expect(page.getByTestId("payment-drawer")).toBeHidden();
  const receipt = page.getByTestId("receipt-preview");
  await expect(receipt).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/ui-remake/);
  for (const button of await receipt.getByRole("button").all()) {
    const rect = await button.boundingBox();
    expect(rect?.width).toBeGreaterThanOrEqual(44);
    expect(rect?.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByTestId("receipt-print-button").focus();
  await page.keyboard.press("Tab");
  await expect(receipt.locator("button").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(receipt).toBeHidden();
});
test("software keyboard visual viewport keeps amount and footer reachable", async ({
  page
}) => {
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), {
      width: 844,
      height: 600,
      offsetTop: 0
    });
    Object.defineProperty(window, "visualViewport", {
      value: viewport
    });
    Object.assign(window, {
      b03VisualViewport: viewport
    });
  });
  await fixture(page, "full", 844, 600);
  await page.evaluate(() => {
    const v = (window as any).b03VisualViewport;
    v.height = 320;
    v.dispatchEvent(new Event("resize"));
  });
  await expect.poll(() => page.getByTestId("payment-drawer").evaluate(e => e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(320);
  await page.getByTestId("payment-received-amount").scrollIntoViewIfNeeded();
  const input = await page.getByTestId("payment-received-amount").boundingBox();
  expect(input!.y).toBeGreaterThanOrEqual(0);
  expect(input!.y + input!.height).toBeLessThanOrEqual(320);
  await page.getByTestId("b03-back-footer").scrollIntoViewIfNeeded();
  const footer = await page.getByTestId("pay-button-footer").boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(320);
});
test("one source palette edit propagates to CSS Tailwind and MUI", async ({
  page
}) => {
  const values = [];
  for (const suffix of ["", "?mutate=1"]) {
    await page.goto("/tests/ui-remake/b03/theme.html" + suffix);
    await expect(page.getByTestId("theme-mui")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    values.push(await page.evaluate(() => ({
      css: getComputedStyle(document.querySelector('[data-testid="theme-css"]')!).backgroundColor,
      mui: getComputedStyle(document.querySelector('[data-testid="theme-mui"]')!).backgroundColor
    })));
  }
  expect(values[0].css).toBe(values[0].mui);
  expect(values[1].css).toBe(values[1].mui);
  expect(values[1].css).not.toBe(values[0].css);
});
test("200 percent browser zoom equivalent and visual keyboard viewport", async ({
  page
}) => {
  await fixture(page, "full", 1136, 640);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.getByTestId("payment-received-amount").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("payment-received-amount")).toBeInViewport();
  await expect(page.getByTestId("pay-button-footer")).toBeInViewport();
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
  await page.setViewportSize({
    width: 844,
    height: 320
  });
  await page.getByTestId("payment-received-amount").focus();
  await page.getByTestId("payment-received-amount").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("payment-received-amount")).toBeInViewport();
  await expect(page.getByTestId("pay-button-footer")).toBeInViewport();
});
