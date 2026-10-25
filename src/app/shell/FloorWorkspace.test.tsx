import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MockState } from "@/adapters/mock";
import { activateCandidateUi, createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import type { Employee } from "@/domain";
import { PortsContext } from "@/features/shared/portsContext";
import { useAppStore } from "../useAppStore";
import { FloorWorkspace } from "./FloorWorkspace";
import { usePermissionSession } from "@/features/shared/permissionSession";

const admin: Employee = { id: "30000000-0000-4000-8000-000000000011", name: "Chủ cửa hàng", role: "admin", isActive: true };

const renderWorkspace = async (configureState?: (state: MockState) => void, options: Parameters<typeof createCandidateRuntimeFixture>[0] = {}) => {
  const fixture = await createCandidateRuntimeFixture(options); const state = fixture.business; const ports = fixture.ports;
  const settingsAdmin = vi.spyOn(ports.permission!.read, "getSettingsAdmin");
  configureState?.(state);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  activateCandidateUi(fixture);
  useAppStore.setState({
    screen: "passcode",
    currentEmployee: fixture.actor,
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
  return { ...view, ports, fixture, settingsAdmin };
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
  it("routes payment-only table and order-card clicks to payment and reads public store display", async () => {
    const { fixture, settingsAdmin } = await renderWorkspace(undefined, { role: "cashier", overrides: { grants: [], denies: ["order.update"] } });
    const orderId = "7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c";
    await screen.findByText(fixture.business.settings.displayName);
    expect(settingsAdmin).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02"));
    expect(useAppStore.getState()).toMatchObject({ drawer: "payment", paymentOrderId: orderId });
    act(() => useAppStore.getState().closeDrawer());
    fireEvent.click(screen.getByTestId(`floor-order-${orderId}`));
    expect(useAppStore.getState()).toMatchObject({ drawer: "payment", paymentOrderId: orderId });
  });

  it.each(["session", "permission", "error"])("ignores a delayed floor response after %s loss", async reason => {
    const { ports, fixture } = await renderWorkspace();
    await screen.findByTestId("floor-order-7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
    const initial = await ports.permission!.read.getFloorOperational();
    let resolve!: (value: typeof initial) => void;
    let reject!: (reason: Error) => void;
    vi.spyOn(ports.permission!.read, "getFloorOperational").mockReturnValue(new Promise((yes, no) => { resolve = yes; reject = no; }));
    fireEvent.click(screen.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58"));
    await act(async () => {
      if (reason === "session") usePermissionSession.getState().clear();
      if (reason === "permission") {
        fixture.owner.overrides = { grants: [], denies: ["order.create"] };
        usePermissionSession.getState().apply(await fixture.runtime.authority.getAuthority());
      }
      if (reason === "error") reject(new Error("read failed")); else resolve(initial);
      await new Promise(done => setTimeout(done, 0));
    });
    expect(useAppStore.getState()).toMatchObject({ drawer: null, orderContext: null });
  });

  it("uses cached context, then refetches before opening a table without a cached order", async () => {
    const { ports } = await renderWorkspace();
    await screen.findByTestId("floor-order-7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
    const read = vi.spyOn(ports.permission!.read, "getFloorOperational");
    fireEvent.click(screen.getByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02"));
    expect(read).not.toHaveBeenCalled();
    expect(useAppStore.getState().orderContext).toMatchObject({ orderId: "7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c", tableId: "a254abd0-b883-4d5c-85c1-89f660409e02", orderType: "dine_in" });
    useAppStore.getState().closeDrawer();
    const initial = await ports.permission!.read.getFloorOperational();
    read.mockResolvedValue({ ...initial, openOrders: [{ ...initial.openOrders[0], tableId: "7b035353-73d6-44bc-8ec4-1ab9951f7a58" }] });
    fireEvent.click(screen.getByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58"));
    await waitFor(() => expect(useAppStore.getState().orderContext).toMatchObject({ orderId: initial.openOrders[0].id, tableId: "7b035353-73d6-44bc-8ec4-1ab9951f7a58", orderType: "dine_in" }));
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("filters status and live orders without changing floor data", async () => {
    const { ports } = await renderWorkspace();
    await screen.findByTestId("floor-order-7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c");
    const before = (await ports.permission!.read.getFloorOperational()).floorPlan;
    fireEvent.click(screen.getByTestId("floor-filter-empty"));
    expect(screen.queryByTestId("table-a254abd0-b883-4d5c-85c1-89f660409e02")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("floor-filter-occupied"));
    expect(screen.queryByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58")).not.toBeInTheDocument();
    expect((await ports.permission!.read.getFloorOperational()).floorPlan).toEqual(before);
  });

  it("renders the selected table background while keeping the status border", async () => {
    await renderWorkspace((state) => {
      state.floorPlan.tables[0].backgroundAssetKey = "/floor-assets/tables/table-bg-11.png";
    });

    const table = await screen.findByTestId("table-7b035353-73d6-44bc-8ec4-1ab9951f7a58");
    expect(table.getAttribute("style")).toContain('/floor-assets/tables/table-bg-11.png');
    expect(table).toHaveAttribute("data-table-status", "empty");
  });

  it("renders catalog decoration images on the POS floor", async () => {
    await renderWorkspace((state) => {
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
    await renderWorkspace();

    expect(await screen.findByTestId("floor-view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sơ đồ bàn" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo đơn nhanh" })).not.toBeInTheDocument();
    expect(screen.getByTestId("floor-refresh-button")).toHaveAccessibleName("Làm mới");
  });
});
