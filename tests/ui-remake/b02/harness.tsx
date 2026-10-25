// Dev-only isolated integration fixture. Vite's production entry never imports this file.
// Real OrderDrawer, hooks, guards, mock ports and query client; no replica UI.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { activateCandidateUi, createCandidateRuntimeFixture } from '@/test/candidateRuntimeFixture';
import { permissionQueryKey, usePermissionSession } from '@/features/shared/permissionSession';
import { PortsContext } from '@/features/shared/portsContext';
import { OrderDrawer } from '@/app/drawers/pos/OrderDrawer';
import { useAppStore } from '@/app/useAppStore';
import { submitOrderAndPrint } from '@/features/pos/orderFlow';
import '@/tailwind.css';

const scenario = new URLSearchParams(location.search).get('case') ?? 'clean';
const fixture = await createCandidateRuntimeFixture({ role: scenario === 'cashier' || scenario === 'deny' ? 'cashier' : 'owner', overrides: scenario === 'deny' ? {grants:[],denies:['payment.take','order.update']} : undefined });
const state = fixture.business, ports = fixture.ports;
const order = state.orders.find(o => o.orderNo === 24)!;
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
let failMenu = scenario === 'menu-error', failOrder = scenario === 'order-error';
const getMenu = ports.permission!.read.getPosMenu.bind(ports.permission!.read), getOrder = ports.permission!.read.getOpenOrderDetail.bind(ports.permission!.read);
ports.permission!.read.getPosMenu = async () => {
  if (scenario === 'menu-loading') return new Promise(() => {});
  if (failMenu) throw new Error('Lỗi menu mô phỏng');
  return getMenu();
};
ports.permission!.read.getOpenOrderDetail = async id => {
  if (scenario === 'order-loading') return new Promise(() => {});
  if (failOrder) throw new Error('Lỗi đơn mô phỏng');
  if (scenario === 'paid' || scenario === 'void') return structuredClone(order); // Presentation-only closed response; protected runtime normally returns NOT_FOUND.
  return getOrder(id);
};
if (scenario === 'empty') state.menu.menuItems = [];
if (scenario === 'unavailable') state.menu.menuItems[2].isAvailable = false;
if (scenario === 'paid' || scenario === 'void') order.status = scenario;
if (scenario === 'stress') {
  const item = state.menu.menuItems[2];
  item.name = 'Món mẫu có tên dài '.repeat(8).slice(0, 120); item.price = 999999999;
  state.menu.categories.forEach(c => c.name = 'Danh mục dài '.repeat(12).slice(0,120));
  state.menu.menuItems = Array.from({length:100}, (_, i) => ({...item, id: crypto.randomUUID(), sortOrder:i}));
  order.items = Array.from({length:100}, (_, i) => ({...order.items[0], id:crypto.randomUUID(), menuItemId: state.menu.menuItems[i].id, itemName:state.menu.menuItems[i].name, options:[], note:'Ghi chú dài '.repeat(12).slice(0,120), quantity:i===0?999:1, unitPrice:item.price}));
}
activateCandidateUi(fixture);
useAppStore.getState().openOrder({orderId:scenario==='new'?null:order.id,tableId:order.tableId,orderType:'dine_in'});
function Host() {
  const drawer = useAppStore(s=>s.drawer), receipt=useAppStore(s=>s.receiptPreview);
  return <>{drawer==='order'?<OrderDrawer/>:<p data-testid="fixture-destination">{drawer ?? 'floor'}</p>}{receipt && <p data-testid="fixture-receipt">{receipt.variant}</p>}<Toaster/></>;
}
Object.assign(window, { b02: {
  state, ports, client, store:useAppStore,
  bypassSubmit:async()=>{try { await submitOrderAndPrint(ports,{context:useAppStore.getState().orderContext!,actor:fixture.actor,expectedVersion:order.lockVersion,items:useAppStore.getState().draftItems,menu:state.menu});return 'UNEXPECTED_SUCCESS'; } catch(error) { return (error as {code?:string}).code; }},
  gate:()=>{usePermissionSession.getState().setStatus("unavailable");const gate=document.createElement("div");gate.innerHTML='<button data-testid="gate-retry">Thử lại</button><button data-testid="gate-next">Khóa</button>';document.body.append(gate);},
  retry:()=>{failMenu=false;failOrder=false;},
  remote:()=>{order.lockVersion++;client.setQueryData(permissionQueryKey('open-order',order.id),structuredClone(order));},
  price:()=>{state.menu.menuItems[2].price+=1000;},
  historical:()=>{state.menu.menuItems[0].price=51000;client.setQueryData(permissionQueryKey('pos-menu'),structuredClone(state.menu));},
  denyUpdate:async()=>{fixture.owner.overrides={grants:[],denies:['order.update']};usePermissionSession.getState().apply(await fixture.runtime.authority.getAuthority());},
}});
createRoot(document.getElementById('root')!).render(<ThemeProvider theme={createTheme()}><CssBaseline/><PortsContext.Provider value={ports}><QueryClientProvider client={client}><Host/></QueryClientProvider></PortsContext.Provider></ThemeProvider>);
