import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cloneElement, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoreReport } from "@/domain";
import type { IPermissionReadRepo, ReportOrderSummary } from "@/ports/permissions";
import { PortsContext } from "@/features/shared/portsContext";
import { activateCandidateUi, createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import { App } from "./App";
import { useAppStore } from "./useAppStore";

// JSDOM has no layout. Keep the real chart/event implementation; only supply
// container geometry. Browser smoke separately checks SVG hit testing/tooltip.
vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children, height }: { children: ReactElement; height: number }) =>
    cloneElement(children as ReactElement<{ width: number; height: number }>, { width: 600, height }),
}));

const today = "2026-10-27";
const dailyReport = (businessDate: string): CoreReport => ({
  businessDate, revenue: 90000, paidOrders: 3, averageTicket: 30000,
  topItemName: "Latte", voidCount: 1, voidAmount: 20000,
  hourlyRevenue: [{ label: "08", revenue: 30000 }, { label: "09", revenue: 60000 }],
});
const order: ReportOrderSummary = {
  id: "report-order-fixture", orderNo: 7, businessDate: today,
  orderType: "dine_in", total: 60000, status: "paid", tableName: "B01",
};
const clients: QueryClient[] = [];
type Configure = (read: IPermissionReadRepo) => void;

async function openReport(configure?: Configure) {
  const fixture = await createCandidateRuntimeFixture();
  const read = fixture.ports.permission!.read;
  const reports = vi.spyOn(read, "getSalesReport").mockImplementation(async ({ businessDate }) => dailyReport(businessDate));
  const orders = vi.spyOn(read, "listReportOrders").mockResolvedValue([order]);
  configure?.(read);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  activateCandidateUi(fixture);
  useAppStore.setState({ screen: "passcode", drawer: "report", activeAreaId: null, activeCategoryId: null,
    orderContext: null, paymentOrderId: null, draftItems: [] });
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(<PortsContext.Provider value={fixture.ports}>
      <QueryClientProvider client={client}><App /></QueryClientProvider>
    </PortsContext.Provider>);
  });
  return { ...view, reports, orders };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  // UTC is still the 26th: the store's Asia/Saigon business day must be the 27th.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-26T18:00:00.000Z"));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  useAppStore.setState({ screen: "landing", currentEmployee: null, drawer: null,
    activeAreaId: null, activeCategoryId: null, orderContext: null, paymentOrderId: null, draftItems: [] });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Report presentation contract before extraction", () => {
  it("keeps totals and chart/table hour selection in sync, with repeat clicks clearing selection", async () => {
    const user = userEvent.setup();
    const { reports, orders } = await openReport();
    await waitFor(() => expect(screen.getByTestId("report-summary")).toHaveAttribute("data-revenue", "90000"));
    expect(reports).toHaveBeenCalledWith({ businessDate: today });
    expect(orders).toHaveBeenCalledWith({ fromDate: today, toDate: today });
    expect(screen.getByTestId("report-summary")).toHaveAttribute("data-paid-orders", "3");
    expect(screen.getByTestId("report-summary")).toHaveAttribute("data-void-count", "1");
    expect(screen.getByTestId("report-summary")).toHaveAttribute("data-void-amount", "20000");
    await user.click(screen.getByTestId("report-section-hourly"));
    const row = await screen.findByRole("row", { name: /08h/ });
    const colors = () => [...document.querySelectorAll(".recharts-bar-rectangle path")].map((node) => node.getAttribute("fill"));
    await waitFor(() => expect(colors()).toEqual(["#0F766E", "#f59e0b"]));
    await user.click(row);
    expect(screen.getByText("Mốc 08h")).toBeInTheDocument();
    await waitFor(() => expect(colors()).toEqual(["#0b5d57", "#f59e0b"]));
    await user.click(row);
    expect(screen.queryByText("Mốc 08h")).not.toBeInTheDocument();
    await waitFor(() => expect(colors()).toEqual(["#0F766E", "#f59e0b"]));
    const bar = await waitFor(() => {
      const nodes = document.querySelectorAll(".recharts-bar-rectangle path");
      expect(nodes).toHaveLength(2);
      return nodes[1];
    });
    fireEvent.click(bar);
    expect(await screen.findByText("Mốc 09h")).toBeInTheDocument();
    await waitFor(() => expect(document.querySelectorAll(".recharts-bar-rectangle path")[1]).toHaveAttribute("fill", "#0b5d57"));
    await user.click(screen.getByRole("button", { name: "Đóng chi tiết" }));
    expect(screen.queryByText("Mốc 09h")).not.toBeInTheDocument();
  });

  it("clears selection on any section click and toggles item details without opening history", async () => {
    const user = userEvent.setup();
    await openReport();
    const item = await screen.findByRole("button", { name: /Latte/ });
    await user.click(item);
    expect(screen.getByRole("button", { name: "Đóng chi tiết" })).toBeInTheDocument();
    await user.click(item);
    expect(screen.queryByRole("button", { name: "Đóng chi tiết" })).not.toBeInTheDocument();
    await user.click(item);
    await user.click(screen.getByTestId("report-section-overview"));
    expect(screen.queryByRole("button", { name: "Đóng chi tiết" })).not.toBeInTheDocument();
    await user.click(screen.getByTestId("report-section-top"));
    await user.click(screen.getByRole("button", { name: /Latte/ }));
    await user.click(screen.getByTestId("report-section-orders"));
    expect(screen.queryByRole("button", { name: "Đóng chi tiết" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("B01")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất" })).toBeDisabled();
  });

  it("retains selection for the same date bounds and clears it when normalized bounds change", async () => {
    const user = userEvent.setup();
    const { orders, reports } = await openReport();
    await user.click(await screen.findByRole("button", { name: /Latte/ }));
    await user.click(screen.getByRole("button", { name: "Tuỳ chọn" }));
    expect(screen.getByRole("button", { name: "Đóng chi tiết" })).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("report-from-date"), { target: { value: "2026-10-29" } });
    await waitFor(() => expect(orders).toHaveBeenLastCalledWith({ fromDate: today, toDate: "2026-10-29" }));
    expect(screen.queryByRole("button", { name: "Đóng chi tiết" })).not.toBeInTheDocument();
    await waitFor(() => expect(reports).toHaveBeenCalledWith({ businessDate: "2026-10-29" }));
    await user.click(screen.getByRole("button", { name: "Tháng này" }));
    await waitFor(() => expect(orders).toHaveBeenLastCalledWith({ fromDate: "2026-10-01", toDate: today }));
    await waitFor(() => expect(reports).toHaveBeenCalledWith({ businessDate: "2026-10-01" }));
  });

  it.each(["daily", "orders"] as const)("waits for the %s source before showing the chart", async (source) => {
    const daily = deferred<CoreReport>();
    const projection = deferred<ReportOrderSummary[]>();
    await openReport((read) => {
      if (source === "daily") vi.mocked(read.getSalesReport).mockReturnValue(daily.promise);
      else vi.mocked(read.listReportOrders).mockReturnValue(projection.promise);
    });
    await waitFor(() => expect(screen.getByTestId("report-summary")).toBeInTheDocument());
    expect(screen.queryByText("Doanh thu theo giờ")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có đơn đã thanh toán trong khoảng này.")).not.toBeInTheDocument();
    await act(async () => { daily.resolve(dailyReport(today)); projection.resolve([order]); });
    expect(await screen.findByText("Doanh thu theo giờ")).toBeInTheDocument();
  });

  it.each(["daily", "orders"] as const)("retries both sources after a %s failure without showing a partial chart", async (source) => {
    const user = userEvent.setup();
    const { reports, orders } = await openReport((read) => {
      const target = source === "daily" ? vi.mocked(read.getSalesReport) : vi.mocked(read.listReportOrders);
      target.mockRejectedValueOnce(new Error("report fixture unavailable"));
    });
    const retry = await screen.findByRole("button", { name: "Tải lại" });
    expect(screen.queryByText("Doanh thu theo giờ")).not.toBeInTheDocument();
    const reportCalls = reports.mock.calls.length;
    const orderCalls = orders.mock.calls.length;
    await user.click(retry);
    expect(await screen.findByText("Doanh thu theo giờ")).toBeInTheDocument();
    expect(reports.mock.calls.length).toBe(reportCalls + 1);
    expect(orders.mock.calls.length).toBe(orderCalls + 1);
  });

  it("refreshes empty today data and offers return to today for another range", async () => {
    const user = userEvent.setup();
    const { reports, orders } = await openReport((read) => {
      vi.mocked(read.getSalesReport).mockImplementation(async ({ businessDate }) => ({
        ...dailyReport(businessDate), revenue: 0, paidOrders: 0, topItemName: "-", hourlyRevenue: [],
      }));
      vi.mocked(read.listReportOrders).mockResolvedValue([]);
    });
    await waitFor(() => expect(reports).toHaveBeenCalledTimes(1));
    const report = within(screen.getByTestId("report"));
    await user.click(await report.findByRole("button", { name: "Làm mới" }));
    await waitFor(() => expect(reports).toHaveBeenCalledTimes(2));
    expect(orders).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("button", { name: "7 ngày" }));
    await user.click(await screen.findByRole("button", { name: "Xem hôm nay" }));
    expect(await report.findByRole("button", { name: "Làm mới" })).toBeInTheDocument();
  });

  it("retries every day and the order projection when one day in a seven-day range fails", async () => {
    const user = userEvent.setup();
    let failOneDay = true;
    const { reports, orders } = await openReport((read) => {
      vi.mocked(read.getSalesReport).mockImplementation(async ({ businessDate }) => {
        if (businessDate === "2026-10-24" && failOneDay) {
          failOneDay = false;
          throw new Error("daily fixture unavailable");
        }
        return dailyReport(businessDate);
      });
    });
    await screen.findByText("Doanh thu theo giờ");
    await user.click(screen.getByRole("button", { name: "7 ngày" }));
    const retry = await screen.findByRole("button", { name: "Tải lại" });
    reports.mockClear();
    orders.mockClear();
    await user.click(retry);
    expect(await screen.findByText("Doanh thu theo ngày")).toBeInTheDocument();
    expect(reports.mock.calls.map(([filter]) => filter.businessDate).sort()).toEqual([
      "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", today,
    ]);
    expect(orders).toHaveBeenCalledExactlyOnceWith({ fromDate: "2026-10-21", toDate: today });
  });
});
