import { useQueries } from "@tanstack/react-query";
import type { OrderHistoryFilter, ReportFilter } from "@/domain";
import type { ReportSummaryFilter } from "@/ports/permissions";
import { usePermissionPorts } from "@/features/shared/portsContext";
import { permissionQueryKey, permissionRead, sessionHasPermission, usePermissionSession } from "@/features/shared/permissionSession";
import { usePurposeQuery } from "@/features/shared/usePurposeQuery";

export { usePurposeQuery } from "@/features/shared/usePurposeQuery";
const useOperationalFloor = () => {
  const ports = usePermissionPorts();
  return usePurposeQuery("floor", ["floor.view"], [], () => ports.read.getFloorOperational(), true, true);
};
export const useMenuQuery = () => {
  const ports = usePermissionPorts();
  return usePurposeQuery("pos-menu", ["order.create", "order.update"], [], () => ports.read.getPosMenu());
};
export const useFloorPlanQuery = () => { const query = useOperationalFloor(); return { ...query, data: query.data?.floorPlan }; };
export const useOpenOrdersQuery = () => { const query = useOperationalFloor(); return { ...query, data: query.data?.openOrders }; };
export const useTakeawayOpenOrdersQuery = () => {
  const query = useOperationalFloor(); return { ...query, data: query.data?.openOrders.filter(order => order.orderType === "takeaway") };
};
export const useOrderDetailQuery = (orderId: string | null) => {
  const ports = usePermissionPorts();
  return usePurposeQuery("open-order", ["order.update", "order.voidOpen", "payment.take"], [orderId], () => ports.read.getOpenOrderDetail(orderId!), !!orderId, true);
};
export const useOrderHistoryDetailQuery = (orderId: string | null) => {
  const ports = usePermissionPorts();
  return usePurposeQuery("history-detail", ["orderHistory.view"], [orderId], () => ports.read.getOrderHistoryDetail(orderId!), !!orderId);
};
export const useOrderHistoryQuery = (filter: OrderHistoryFilter) => {
  const ports = usePermissionPorts();
  return usePurposeQuery("history", ["orderHistory.view"], [filter], () => ports.read.listOrderHistory(filter));
};
export const useCoreReportQuery = (filter: ReportFilter) => {
  const ports = usePermissionPorts();
  return usePurposeQuery("report", ["report.view"], [filter], () => ports.read.getSalesReport(filter));
};
export const useCoreReportsQuery = (filters: ReportFilter[]) => {
  const ports = usePermissionPorts(), session = usePermissionSession();
  return useQueries({ queries: filters.map(filter => ({
    queryKey: permissionQueryKey("report", filter), queryFn: () => permissionRead(["report.view"], () => ports.read.getSalesReport(filter)),
    enabled: sessionHasPermission("report.view", session), refetchOnWindowFocus: false, refetchOnReconnect: false,
  })) });
};
export const useReportOrdersQuery = (filter: ReportSummaryFilter) => {
  const ports = usePermissionPorts();
  return usePurposeQuery("report-orders", ["report.view"], [filter], () => ports.read.listReportOrders(filter));
};
export const useStoreDisplayQuery = () => {
  const ports = usePermissionPorts();
  return usePurposeQuery("display", [], [], () => ports.read.getStoreDisplay());
};
