import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockPorts, createSeededMockState } from "@/adapters/mock";
import type { Employee } from "@/domain";
import { PortsContext } from "@/features/shared/portsContext";
import { useAppStore } from "../useAppStore";
import { FloorWorkspace } from "./FloorWorkspace";

const admin: Employee = { id: "6b7bd350-7db2-4160-8471-cca2668c070d", name: "Quản lý", role: "admin", isActive: true };

const renderWorkspace = (configureState?: (state: ReturnType<typeof createSeededMockState>) => void) => {
  const state = createSeededMockState();
  configureState?.(state);
  const ports = createMockPorts(state);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  useAppStore.setState({
    screen: "passcode",
    currentEmployee: admin,
    activeAreaId: null,
    activeCategoryId: null,
    drawer: null,
    orderContext: null,
    paymentOrderId: null,
    draftItems: [],
  });

  const view = render(
    <PortsContext.Provider value={ports}>
      <QueryClientProvider client={queryClient}>
        <FloorWorkspace />
      </QueryClientProvider>
    </PortsContext.Provider>,
  );
  return { ...view, ports };
};

afterEach(() => {
  cleanup();
  useAppStore.setState({
    screen: "landing",
    currentEmployee: null,
    activeAreaId: null,
    activeCategoryId: null,
    drawer: null,
    orderContext: null,
    paymentOrderId: null,
    draftItems: [],
  });
});

describe("FloorWorkspace", () => {
  it("uses cached context, then refetches before opening a table without a cached order", async () => {
    const { ports } = renderWorkspace();
    await screen.findByTestId("floor-order-7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
    const read = vi.spyOn(ports.order, "listOpenOrders");
    fireEvent.click(screen.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02"));
    expect(read).not.toHaveBeenCalled();
    expect(useAppStore.getState().orderContext).toMatchObject({ orderId: "7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c", tableId: "a254abd0-b883-4d5c-85c1-89f660409e02", orderType: "dine_in" });
    useAppStore.getState().closeDrawer();
    const initial = await ports.order.listOpenOrders();
    read.mockResolvedValue([{ ...initial[0], tableId: "7b035353-73d6-44bc-8ec4-1ab9951f7a58" }]);
    fireEvent.click(screen.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58"));
    await waitFor(() => expect(useAppStore.getState().orderContext).toMatchObject({ orderId: initial[0].id, tableId: "7b035353-73d6-44bc-8ec4-1ab9951f7a58", orderType: "dine_in" }));
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("filters status and live orders without changing floor data", async () => {
    const { ports } = renderWorkspace();
    await screen.findByTestId("floor-order-7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
    const before = await ports.floorPlan.getFloorPlan();
    fireEvent.click(screen.getByTestId("floor-filter-empty"));
    expect(screen.queryByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("floor-filter-occupied"));
    expect(screen.queryByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58")).not.toBeInTheDocument();
    expect(await ports.floorPlan.getFloorPlan()).toEqual(before);
  });

  it("renders the selected table background while keeping the status border", async () => {
    renderWorkspace((state) => {
      state.floorPlan.tables[0].backgroundAssetKey = "/floor-assets/tables/table-bg-11.png";
    });

    const table = await screen.findByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58");
    expect(table.getAttribute("style")).toContain('/floor-assets/tables/table-bg-11.png');
    expect(table).toHaveAttribute("data-table-status", "empty");
  });

  it("renders catalog decoration images on the POS floor", async () => {
    renderWorkspace((state) => {
      state.floorPlan.decorItems.push({
        id: "decor-seat-image",
        areaId: state.floorPlan.areas[0].id,
        kind: "image",
        label: "Ghế 29",
        assetKey: "/floor-assets/decor/deco-seat-29.png",
        posX: 500,
        posY: 320,
        width: 120,
        height: 120,
        rotation: 0,
        zIndex: 2,
        isLocked: false,
      });
    });

    const decor = await screen.findByTestId("decor-decor-seat-image");
    expect(within(decor).getByRole("img", { name: "Ghế 29" })).toHaveAttribute(
      "src",
      "/floor-assets/decor/deco-seat-29.png",
    );
  });

  it("renders the approved floor heading and accessible refresh control", async () => {
    renderWorkspace();

    expect(await screen.findByTestId("floor-view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sơ đồ bàn" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo đơn nhanh" })).not.toBeInTheDocument();
    expect(screen.getByTestId("floor-refresh-button")).toHaveAccessibleName("Làm mới");
  });
});
