// Dev-only isolated integration fixture. Vite's production entry never imports this file.
// Real OrderDrawer, hooks, guards, mock ports and query client; no replica UI.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { createMockPorts, createSeededMockState } from '@/adapters/mock';
import { PortsContext } from '@/features/shared/portsContext';
import { OrderDrawer } from '@/app/drawers/pos/OrderDrawer';
import { useAppStore } from '@/app/useAppStore';
import '@/tailwind.css';

const scenario = new URLSearchParams(location.search).get('case') ?? 'clean';
const state = createSeededMockState(), ports = createMockPorts(state);
const order = state.orders.find(o => o.orderNo === 24)!;
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
let failMenu = scenario === 'menu-error', failOrder = scenario === 'order-error';
const getMenu = ports.menu.getMenu.bind(ports.menu), getOrder = ports.order.getOrder.bind(ports.order);
ports.menu.getMenu = async () => {
  if (scenario === 'menu-loading') return new Promise(() => {});
  if (failMenu) throw new Error('Lỗi menu mô phỏng');
  return getMenu();
};
ports.order.getOrder = async id => {
  if (scenario === 'order-loading') return new Promise(() => {});
  if (failOrder) throw new Error('Lỗi đơn mô phỏng');
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
await ports.auth.pairStore('0001-X8F3QA');
const employee = state.employees.find(e => e.role === (scenario === 'cashier' ? 'cashier' : 'admin'))!;
const session = await ports.employee.startSession(employee.id, state.pins[employee.id]);
if (scenario === 'deny') session.employee.permissionOverrides = {grants:[],denies:['payment.take','order.update']};
useAppStore.getState().setCurrentEmployee(session.employee);
useAppStore.getState().openOrder({orderId:scenario==='new'?null:order.id,tableId:order.tableId,orderType:'dine_in'});
function Host() {
  const drawer = useAppStore(s=>s.drawer), receipt=useAppStore(s=>s.receiptPreview);
  return <>{drawer==='order'?<OrderDrawer/>:<p data-testid="fixture-destination">{drawer ?? 'floor'}</p>}{receipt && <p data-testid="fixture-receipt">{receipt.variant}</p>}<Toaster/></>;
}
Object.assign(window, { b02: {
  state, ports, client, store:useAppStore,
  retry:()=>{failMenu=false;failOrder=false;},
  remote:()=>{order.lockVersion++;client.setQueryData(['orders','detail',order.id],structuredClone(order));},
  price:()=>{state.menu.menuItems[2].price+=1000;},
  historical:()=>{state.menu.menuItems[0].price=51000;client.setQueryData(['menu'],structuredClone(state.menu));},
  denyUpdate:()=>{const employee=useAppStore.getState().currentEmployee!;useAppStore.getState().setCurrentEmployee({...employee,permissionOverrides:{grants:[],denies:['order.update']}});},
}});
createRoot(document.getElementById('root')!).render(<ThemeProvider theme={createTheme()}><CssBaseline/><PortsContext.Provider value={ports}><QueryClientProvider client={client}><Host/></QueryClientProvider></PortsContext.Provider></ThemeProvider>);
