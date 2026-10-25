import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { activateCandidateUi, createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import { formatVnd } from "@/core/money";
import type { MockState } from "@/adapters/mock";
import type { Employee } from "@/domain";
import { PortsContext } from "@/features/shared/portsContext";
import { App } from "./App";
import { useAppStore } from "./useAppStore";

const admin: Employee = { id: "30000000-0000-4000-8000-000000000011", name: "Chủ cửa hàng", role: "admin", isActive: true };

// toHaveTextContent chuẩn hoá NBSP của Intl thành khoảng trắng thường.
const vnd = (amount: number) => formatVnd(amount).replace(/ /g, " ");

// Mở thẳng drawer thanh toán của 7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c: Cà phê sữa ×2 (29k) + Bạc xỉu (32k) + Croissant (35k) = 125k.
const renderPaymentDrawer = async (employee: Employee = admin, configure?: (state: MockState) => void) => {
  const fixture = await createCandidateRuntimeFixture({ role: employee.role === "cashier" ? "cashier" : "owner",
    overrides: employee.permissionOverrides ? { grants: employee.permissionOverrides.grants, denies: employee.permissionOverrides.denies } : undefined });
  const { business: state, ports } = fixture;
  configure?.(state);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  activateCandidateUi(fixture);
  useAppStore.setState({
    screen: "passcode",
    currentEmployee: fixture.rosterEmployee,
    activeAreaId: null,
    activeCategoryId: null,
    drawer: "payment",
    orderContext: null,
    paymentOrderId: "7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c",
    draftItems: [],
  });

  render(
    <PortsContext.Provider value={ports}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </PortsContext.Provider>,
  );

  return { ports, state };
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

describe("Instant pay selection UI", () => {
  it("defaults to select-all and routes a full payment through payOrder", async () => {
    const user = userEvent.setup();
    const { ports } = await renderPaymentDrawer();
    const paySpy = vi.spyOn(ports.write, "execute");
    const payItemsSpy = vi.spyOn(ports.write, "register");

    await screen.findByTestId("b03-meta");
    const selectAll = await screen.findByTestId("pay-select-all");
    await waitFor(() => expect(selectAll).toBeChecked());
    expect(screen.getByTestId("payment-amount-due-value")).toHaveTextContent(vnd(125000));
    expect(screen.getByTestId("pay-button")).toHaveTextContent("Hoàn tất thanh toán");

    await waitFor(() => expect(screen.getByTestId("pay-button")).toBeEnabled());
    await user.click(screen.getByTestId("pay-button"));

    await waitFor(() => expect(paySpy).toHaveBeenCalledTimes(1));
    expect(payItemsSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ kind: "pay_order" }));
    await waitFor(() => expect(screen.queryByTestId("payment-drawer")).not.toBeInTheDocument());
  });

  it("pays a partial selection and keeps the drawer open on the remaining items", async () => {
    const user = userEvent.setup();
    const { ports } = await renderPaymentDrawer();
    const paySpy = vi.spyOn(ports.write, "execute");
    const payItemsSpy = vi.spyOn(ports.write, "register");

    await screen.findByTestId("b03-meta");
    const selectAll = await screen.findByTestId("pay-select-all");
    await waitFor(() => expect(selectAll).toBeChecked());

    // Bỏ "Chọn tất cả" -> chưa chọn gì, không thể thanh toán.
    await user.click(selectAll);
    expect(screen.getByTestId("pay-button")).toBeDisabled();
    expect(screen.getByTestId("payment-amount-due-value")).toHaveTextContent(vnd(0));

    // Tick dòng Cà phê sữa -> mặc định chọn 1; nút "+" tăng dần và xoay vòng khi chạm trần.
    await user.click(screen.getAllByTestId("pay-item-checkbox")[0]);
    expect(screen.getAllByTestId("pay-item-quantity")[0]).toHaveTextContent("1/2");
    expect(screen.getByTestId("payment-amount-due-value")).toHaveTextContent(vnd(29000));
    await user.click(screen.getAllByTestId("pay-item-plus")[0]);
    expect(screen.getAllByTestId("pay-item-quantity")[0]).toHaveTextContent("2/2");
    await user.click(screen.getAllByTestId("pay-item-plus")[0]);
    expect(screen.getAllByTestId("pay-item-quantity")[0]).toHaveTextContent("1/2");
    expect(screen.getByTestId("payment-amount-due-value")).toHaveTextContent(vnd(29000));
    expect(screen.getByTestId("pay-button")).toHaveTextContent("Thanh toán món đã chọn");

    await user.click(screen.getByTestId("pay-button-footer"));
    await waitFor(() => expect(payItemsSpy).toHaveBeenCalledTimes(1));
    expect(paySpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ kind: "pay_order_items" }));

    // Món được chọn đã TÁCH thành đơn #24 paid riêng; đơn gốc còn lại trên bàn,
    // drawer giữ nguyên và selection rỗng, không tự tạo ý định trả phần còn lại (96k).
    expect(screen.getByTestId("payment-drawer")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("payment-amount-due-value")).toHaveTextContent(vnd(0)),
    );
    await waitFor(() =>
      expect(screen.getByTestId("payment-order-total-value")).toHaveTextContent(vnd(96000)),
    );
    await waitFor(() => expect(screen.getByTestId("pay-select-all")).not.toBeChecked());
    expect(screen.getAllByTestId("pay-item-line")).toHaveLength(3);
    // Đơn tách nhận đúng tham số: kế thừa cách chọn món và có newOrderId client cấp.
    expect(payItemsSpy.mock.calls[0][1]).toMatchObject({
      orderId: "7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c",
      lines: [expect.objectContaining({ orderItemId: "3c00b7a3-016f-45a3-8f96-664314c26b4a", quantity: 1 })],
    });
    expect((payItemsSpy.mock.calls[0][1] as import("@/domain").SplitWritePayload).newOrderId).toBeTruthy();
  });

  it("does not mount the payment drawer when the employee lacks payment.take", async () => {
    await renderPaymentDrawer({
      id: "22828322-623b-42e7-8a28-a2bdf367c364",
      name: "Thu ngân",
      role: "cashier",
      isActive: true,
      permissionOverrides: { grants: [], denies: ["payment.take"] },
    });

    await waitFor(() => expect(screen.queryByTestId("payment-drawer")).not.toBeInTheDocument());
    expect(screen.queryByTestId("pay-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pay-button-footer")).not.toBeInTheDocument();
  });
  it("preserves historical option surcharges in a split and its receipt", async () => {
    const user = userEvent.setup();
    const { ports, state } = await renderPaymentDrawer(admin, state => {
      const order = state.orders[0];
      order.items = [order.items[0]];
      order.items[0].options[0].priceDelta = 7000;
      order.items[0].options[0].quantity = 2;
      order.total = 86000;
    });
    const execute = vi.spyOn(ports.write, "execute");
    await waitFor(() => expect(screen.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "86000"));
    await user.click(screen.getByTestId("pay-select-all"));
    await user.click(screen.getByTestId("pay-item-checkbox"));
    expect(screen.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "43000");
    await user.clear(screen.getByTestId("payment-received-amount"));
    await user.type(screen.getByTestId("payment-received-amount"), "50000");
    await user.click(screen.getByTestId("pay-button-footer"));
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(execute.mock.calls[0][1]).toMatchObject({kind:"pay_order_items",receivedAmount:50000,lines:[expect.objectContaining({quantity:1})]});
    await waitFor(() => expect(screen.getByTestId("receipt-document")).toHaveAttribute("data-total", "43000"));
    expect(screen.getByTestId("receipt-document")).toHaveAttribute("data-change-amount", "7000");
    expect(state.orders.find(order => order.id === "7e2f462b-e6ff-491a-85f8-9f4eb53d9c4c")?.total).toBe(43000);
    await waitFor(() => expect(screen.getByTestId("payment-amount-due-value")).toHaveAttribute("data-amount", "0"));
  });

});
