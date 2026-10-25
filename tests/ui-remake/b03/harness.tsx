// Dev-only isolated fixture: real B03, hooks, guards, mock repositories and receipt preview.
// Vite's production entry does not import this module.
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { activateCandidateUi, createCandidateRuntimeFixture } from "@/test/candidateRuntimeFixture";
import { PortsContext } from "@/features/shared/portsContext";
import { PaymentDrawer } from "@/app/drawers/pos/PaymentDrawer";
import { ReceiptPreviewPopup } from "@/app/components/ReceiptPreview";
import { useAppStore } from "@/app/useAppStore";
import { AppError } from "@/core/appError";
import { permissionQueryKey, usePermissionSession } from "@/features/shared/permissionSession";
import "@/tailwind.css";
const scenario = new URLSearchParams(location.search).get("case") ?? "full";
const fixture = await createCandidateRuntimeFixture({ role: scenario === "cashier" || scenario === "deny" ? "cashier" : "owner", overrides: scenario === "deny" ? {grants:[],denies:["payment.take"]} : undefined });
const state = fixture.business, ports = fixture.ports;
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
const getOrder = ports.permission!.read.getOpenOrderDetail.bind(ports.permission!.read),
  execute = ports.write.execute.bind(ports.write);
ports.permission!.read.getOpenOrderDetail = async id => {
  if (scenario === "loading") return new Promise(() => {});
  if (failOrder) throw new AppError("NOT_FOUND", "Không tìm thấy đơn trong cửa hàng này.");
  if (scenario === "paid" || scenario === "void") return structuredClone(order); // Closed-response presentation fixture, not a server contract.
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
activateCandidateUi(fixture);
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
    gate:()=>{usePermissionSession.getState().setStatus("unavailable");const gate=document.createElement("div");gate.innerHTML='<button data-testid="gate-retry">Thử lại</button><button data-testid="gate-next">Khóa</button>';document.body.append(gate);},
    restoreAuthority:()=>{document.querySelector('[data-testid="gate-retry"]')?.parentElement?.remove();usePermissionSession.getState().setStatus("verified");},
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
      client.setQueryData(permissionQueryKey("open-order",order.id), structuredClone(order));
    },
    restoreExecute: () => {
      ports.write.execute = execute;
    }
  }
});
createRoot(document.getElementById("root")!).render(<ThemeProvider theme={createTheme()}><CssBaseline /><PortsContext.Provider value={ports}><QueryClientProvider client={client}><Host /></QueryClientProvider></PortsContext.Provider></ThemeProvider>);
