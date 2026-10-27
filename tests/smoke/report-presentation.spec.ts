import { expect, test } from "@playwright/test";
import { loginAsAdmin, waitForTransientOverlays } from "./helpers";

test("report chart preserves selection, tooltip, ranges and compact landscape layout", async ({ page }, testInfo) => {
  // The existing paid mock bill is dated 11 June, 09:15 UTC (16h in the store).
  // Fix wall time only: chart animation and Playwright timers continue normally.
  await page.clock.setFixedTime(new Date("2026-06-11T05:00:00.000Z"));
  await page.goto("/");
  if (testInfo.project.name === "portrait") {
    // POS requires landscape after login; cover the rotation journey, with no skip.
    await page.setViewportSize({ width: 844, height: 390 });
  }
  await loginAsAdmin(page);
  await waitForTransientOverlays(page);
  await page.getByTestId("nav-report").click();
  const report = page.getByTestId("report");
  const summary = page.getByTestId("report-summary");
  await expect(summary).toHaveAttribute("data-revenue", "77000");
  await expect(summary).toHaveAttribute("data-paid-orders", "1");
  await expect(summary).toContainText(/1 đơn · TB 77\.000\s₫/);
  await expect(report.getByRole("button", { name: "Xuất" })).toBeDisabled();
  const chart = report.locator(".recharts-responsive-container");
  const bar = report.locator(".recharts-bar-rectangle path");
  await expect(bar).toHaveCount(1);
  await expect(chart).toHaveCSS("height", "210px");
  await expect(bar).toHaveAttribute("fill", "#f59e0b");
  await bar.hover();
  const tooltip = report.locator(".recharts-default-tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("16h");
  await expect(tooltip).toContainText(/77\.000\s₫/);
  await page.screenshot({ path: testInfo.outputPath("report-overview-tooltip.png") });

  await bar.click();
  await expect(report.getByText("Mốc 16h", { exact: true })).toBeVisible();
  await expect(bar).toHaveAttribute("fill", "#0b5d57");
  await bar.click();
  await expect(report.getByText("Mốc 16h", { exact: true })).toBeHidden();
  await expect(bar).toHaveAttribute("fill", "#f59e0b");

  await page.getByTestId("report-section-hourly").click();
  await expect(chart).toHaveCSS("height", "260px");
  await report.getByRole("row", { name: /16h/ }).click();
  await expect(bar).toHaveAttribute("fill", "#0b5d57");
  await report.getByRole("button", { name: "Tuỳ chọn" }).click();
  await expect(report.getByText("Mốc 16h", { exact: true })).toBeVisible();
  await page.getByTestId("report-from-date").fill("2026-06-10");
  await expect(report.getByText("Mốc 16h", { exact: true })).toBeHidden();
  await expect(summary).toHaveAttribute("data-revenue", "77000");
  await report.getByRole("button", { name: "Hôm nay", exact: true }).click();
  await page.getByTestId("report-section-top").click();
  // The fixture has one of each item; the permission projection breaks ties by name.
  await report.getByRole("button", { name: /Bạc xỉu/ }).click();
  await expect(report.getByRole("button", { name: "Đóng chi tiết" })).toBeVisible();
  await page.getByTestId("report-section-orders").click();
  await expect(report.getByRole("button", { name: "Đóng chi tiết" })).toBeHidden();
  await expect(report.getByRole("table")).toContainText("77K");

  await page.getByTestId("report-close-button").click();
  await page.getByTestId("nav-report").click();
  await expect(chart).toHaveCSS("height", "210px");
  await expect(page.getByTestId("report-from-date")).toBeHidden();
  await expect(report.getByRole("button", { name: "Đóng chi tiết" })).toBeHidden();
  await page.setViewportSize({ width: 568, height: 320 });
  await summary.scrollIntoViewIfNeeded();
  await expect(summary).toBeInViewport();
  await expect(summary).toContainText("Doanh thu hôm nay");
  await expect(summary).toContainText(/1 đơn · TB 77\.000\s₫/);
  const summaryBox = await summary.boundingBox();
  expect(summaryBox).not.toBeNull();
  expect(summaryBox!.x).toBeGreaterThanOrEqual(0);
  expect(summaryBox!.x + summaryBox!.width).toBeLessThanOrEqual(568);
  expect(await summary.locator(".tabular-nums").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("report-summary-568x320.png") });
  // Resize recreates animated SVG paths; scroll the stable container instead.
  await chart.scrollIntoViewIfNeeded();
  await expect(bar).toBeInViewport();
  const geometry = await chart.boundingBox();
  expect(geometry).not.toBeNull();
  expect(geometry!.width).toBeGreaterThan(200);
  expect(geometry!.x).toBeGreaterThanOrEqual(0);
  expect(geometry!.x + geometry!.width).toBeLessThanOrEqual(568);
  await page.screenshot({ path: testInfo.outputPath("report-568x320.png") });
  await bar.click();
  await expect(report.getByText("Mốc 16h", { exact: true })).toBeVisible();
  await page.getByTestId("report-close-button").click();
  await expect(report).toBeHidden();
});
