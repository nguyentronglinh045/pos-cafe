// Dev-only isolated fixture: real B03, hooks, guards, mock repositories and receipt preview.
// Vite's production entry does not import this module.
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { createMockPorts, createSeededMockState } from "@/adapters/mock";
import { PortsContext } from "@/features/shared/portsContext";
import { PaymentDrawer } from "@/app/drawers/pos/PaymentDrawer";
import { ReceiptPreviewPopup } from "@/app/components/ReceiptPreview";
import { useAppStore } from "@/app/useAppStore";
import { AppError } from "@/core/appError";
import { posQueryKeys } from "@/features/shared/queryKeys";
import "@/tailwind.css";
const scenario = new URLSearchParams(location.search).get("case") ?? "full";
const state = createSeededMockState(),
  ports = createMockPorts(state);
const order = state.orders.find(o => o.orderNo === 24)!;
const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity
    },
    mutations: {
      retry: false
    }
  }
});
let failOrder = scenario === "error";
const getOrder = ports.order.getOrder.bind(ports.order),
  execute = ports.write.execute.bind(ports.write);
ports.order.getOrder = async id => {
  if (scenario === "loading") return new Promise(() => {});
  if (failOrder) throw new AppError("NOT_FOUND", "Không tìm thấy đơn trong cửa hàng này.");
  return getOrder(id);
};
if (scenario === "pending") ports.write.execute = async () => new Promise(() => {});
if (scenario === "unknown") ports.write.execute = async () => {
  throw new TypeError("Mạng mô phỏng không trả kết quả");
};
if (scenario === "conflict") ports.write.execute = async () => {
  throw new AppError("ORDER_VERSION_CONFLICT", "Đơn đã thay đổi. Hãy tải lại, kiểm tra rồi xác nhận một thao tác mới.");
};
if (scenario === "empty") {
  order.items = [];
  order.total = 0;
}
if (scenario === "paid" || scenario === "void") order.status = scenario;
if (scenario === "stress") {
  order.items = Array.from({
    length: 100
  }, (_, i) => ({
    ...order.items[0],
    id: crypto.randomUUID(),
    itemName: "Món có tên rất dài ".repeat(10).slice(0, 120),
    note: "Ghi chú dài có dấu ".repeat(10).slice(0, 120),
    options: [],
    quantity: i === 0 ? 999 : 1,
    unitPrice: 999999999
  }));
  order.total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
await ports.auth.pairStore("0001-X8F3QA");
const employee = state.employees.find(e => e.role === (scenario === "cashier" ? "cashier" : "admin"))!;
const session = await ports.employee.startSession(employee.id, state.pins[employee.id]);
if (scenario === "deny") session.employee.permissionOverrides = {
  grants: [],
  denies: ["payment.take"]
};
useAppStore.getState().setCurrentEmployee(session.employee);
useAppStore.setState({
  drawer: "payment",
  paymentOrderId: scenario === "missing" ? null : order.id
});
function Host() {
  const drawer = useAppStore(s => s.drawer);
  return <>{drawer === "payment" ? <PaymentDrawer /> : <button data-testid="fixture-destination">{drawer ?? "floor"}</button>}<ReceiptPreviewPopup /><Toaster /></>;
}
Object.assign(window, {
  b03: {
    state,
    ports,
    client,
    store: useAppStore,
    retry: () => {
      failOrder = false;
    },
    remote: () => {
      order.lockVersion++;
      order.items[0].quantity = 1;
      order.total = 96000;
      client.setQueryData(posQueryKeys.order(order.id), structuredClone(order));
    },
    restoreExecute: () => {
      ports.write.execute = execute;
    }
  }
});
createRoot(document.getElementById("root")!).render(<ThemeProvider theme={createTheme()}><CssBaseline /><PortsContext.Provider value={ports}><QueryClientProvider client={client}><Host /></QueryClientProvider></PortsContext.Provider></ThemeProvider>);
