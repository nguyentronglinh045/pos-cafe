import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMediaQuery } from "@mui/material";
import toast from "react-hot-toast";
import type { FloorTable, OrderSummary } from "@/domain";
import { formatCompactVnd, formatVndShort } from "@/core/money";
import { useFloorPlanQuery, useOpenOrdersQuery } from "@/features/pos";
import { useStoreSettingsQuery } from "@/features/admin/useAdminData";
import { useAppStore } from "../useAppStore";
import { toToastError } from "../appErrors";
import { getLabelBoost, getObjectBoost, stageStyle } from "../floorStage";
import { ScaledFloorStage } from "../components/ScaledFloorStage";
import { FloorDecorVisual } from "../components/FloorDecorVisual";
import { getFloorTableBackgroundAsset } from "../floorTableBackgroundAssets";
import { RemakeIcon } from "../components/RemakeIcon";
import { FloorAreaChooser } from "./FloorAreaChooser";
import "./floorAreaSelector.css";

type TableFilter = "all" | "empty" | "occupied";
const nodeTransform = (rotation = 0, boost = 1) => ({ transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${boost})`, transformOrigin: "center" });

export function FloorWorkspace() {
  const activeAreaId = useAppStore((s) => s.activeAreaId);
  const setActiveAreaId = useAppStore((s) => s.setActiveAreaId);
  const openOrder = useAppStore((s) => s.openOrder);
  const drawer = useAppStore((s) => s.drawer);
  const floorPlanQuery = useFloorPlanQuery();
  const openOrdersQuery = useOpenOrdersQuery();
  const settings = useStoreSettingsQuery();
  const [tableFilter, setTableFilter] = useState<TableFilter>("all");
  const [ordersOpen, setOrdersOpen] = useState(false);
  const compactOrders = useMediaQuery("(max-width: 1279px)");
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const firstArea = floorPlanQuery.data?.areas[0]?.id;
    if (!activeAreaId && firstArea) setActiveAreaId(firstArea);
  }, [activeAreaId, floorPlanQuery.data, setActiveAreaId]);
  useEffect(() => { if (!compactOrders || drawer) setOrdersOpen(false); }, [compactOrders, drawer]);
  useLayoutEffect(() => {
    if (!ordersOpen || !compactOrders) return;
    const background = [...document.querySelectorAll<HTMLElement>(".sidebar,.workspace-header,.workspace")];
    const previous = background.map((element) => element.inert);
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    background.forEach((element) => { element.inert = true; });
    return () => {
      background.forEach((element, index) => { element.inert = previous[index]; });
      if (!useAppStore.getState().drawer) toggleRef.current?.focus();
    };
  }, [ordersOpen, compactOrders]);

  const floorPlan = floorPlanQuery.data;
  const orders = openOrdersQuery.data ?? [];
  const areaId = activeAreaId ?? floorPlan?.areas[0]?.id ?? null;
  const allTables = floorPlan?.tables.filter((t) => t.areaId === areaId) ?? [];
  const decorItems = floorPlan?.decorItems.filter((d) => d.areaId === areaId) ?? [];
  const isOccupied = (tableId: string) => allTables.find((t) => t.id === tableId)?.status === "occupied" || orders.some((o) => o.tableId === tableId);
  const openTableOrder = async (table: FloorTable, cachedOrder?: OrderSummary) => {
    if (cachedOrder) { openOrder({ orderId: cachedOrder.id, tableId: table.id, orderType: "dine_in" }); return; }
    const refreshed = await openOrdersQuery.refetch();
    const freshOrder = refreshed.data?.find((order) => order.tableId === table.id);
    openOrder({ orderId: freshOrder?.id ?? null, tableId: table.id, orderType: "dine_in" });
  };
  const filteredTables = allTables.filter((t) => tableFilter === "empty" ? !isOccupied(t.id) : tableFilter === "occupied" ? isOccupied(t.id) : true);
  const dineInOrders = orders.filter((o) => o.orderType === "dine_in");
  const takeawayOrders = orders.filter((o) => o.orderType === "takeaway");
  const area = floorPlan?.areas.find((a) => a.id === areaId);
  const messageState = floorPlanQuery.isLoading || floorPlanQuery.isError || allTables.length === 0 || filteredTables.length === 0;
  const onPanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!compactOrders || !ordersOpen) return;
    if (event.key === "Escape") { event.preventDefault(); setOrdersOpen(false); }
    if (event.key === "Tab") {
      const controls = [...panelRef.current!.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  const orderCard = (order: OrderSummary) => {
    const table = floorPlan?.tables.find((t) => t.id === order.tableId);
    const name = order.orderType === "takeaway" ? "Mang đi" : table?.name ?? order.tableId ?? "";
    return <button key={order.id} className="order-card" data-testid={`floor-order-${order.id}`} onClick={() => { setOrdersOpen(false); openOrder({ orderId: order.id, tableId: order.orderType === "takeaway" ? null : order.tableId, orderType: order.orderType }); }}>
      <span className="order-card-top"><strong title={name}>{name}</strong><span className="order-number">#{order.orderNo}</span></span>
      <span className="order-card-bottom"><span className="order-status"><span className="status-dot"/>Đang phục vụ</span><strong className="order-total" title={formatVndShort(order.total)}>{formatVndShort(order.total)}</strong></span>
      <span className="order-card-hint">Mở đơn hàng <span aria-hidden="true">→</span></span>
    </button>;
  };

  return <>
    <header className="workspace-header" data-testid="floor-header"><div className="breadcrumb"><span><RemakeIcon name="store"/></span><strong title={settings.data?.displayName}>{settings.data?.displayName ?? ""}</strong><span className="breadcrumb-divider">›</span><span className="header-context">Vận hành bán hàng</span></div><div className="header-actions"><span className="sync-label">Tự động cập nhật</span><button ref={toggleRef} className="secondary-button orders-toggle" data-testid="floor-orders-toggle" aria-controls="floor-order-panel" aria-expanded={ordersOpen} onClick={() => setOrdersOpen(true)}>Đơn đang mở <span>({orders.length})</span></button></div></header>
    <div className="workspace">
      <section className="floor-card" data-testid="floor-view">
        <div className="floor-toolbar" data-testid="floor-toolbar">
          <div className="floor-title"><h1>Sơ đồ bàn</h1><p>Chọn bàn để xem và quản lý đơn hàng.</p></div>
          <div className="status-filters" aria-label="Trạng thái bàn">{(["all", "empty", "occupied"] as TableFilter[]).map((f) => <button key={f} data-testid={`floor-filter-${f}`} aria-pressed={tableFilter === f} onClick={() => setTableFilter(f)}>{f !== "all" && <span className={`status-dot ${f}-dot`} aria-hidden="true"/>}{f === "all" ? "Tất cả" : f === "empty" ? "Trống" : "Đang phục vụ"}</button>)}</div>
          <button className="icon-button refresh-button" data-testid="floor-refresh-button" aria-label="Làm mới" title="Làm mới dữ liệu" onClick={() => { void floorPlanQuery.refetch(); void openOrdersQuery.refetch(); toast.success("Đã làm mới dữ liệu"); }}><RemakeIcon name="refresh"/></button>
        </div>
        <div className="area-navigation" data-testid="floor-area-summary"><FloorAreaChooser areas={floorPlan?.areas ?? []} tables={floorPlan?.tables ?? []} activeAreaId={areaId} onSelect={setActiveAreaId}/><div className="area-metrics"><strong className="b01-area-only" title={area?.name}>{area?.name ?? ""}</strong><span>{`${allTables.reduce((sum, t) => sum + t.seats, 0)} chỗ ngồi`}</span><strong className="occupancy">{`${allTables.length ? Math.round(allTables.filter((t) => isOccupied(t.id)).length / allTables.length * 100) : 0}% sử dụng`}</strong></div></div>
        {messageState ? <div className="state-message" data-testid={floorPlanQuery.isError ? "floor-error-state" : "floor-message"}>
          {floorPlanQuery.isLoading ? <p>Đang tải sơ đồ...</p> : floorPlanQuery.isError ? <><span className="error-icon" aria-hidden="true">!</span><p>Không tải được sơ đồ bàn.</p><p>{toToastError(floorPlanQuery.error)}</p><button className="secondary-button" onClick={() => void floorPlanQuery.refetch()}>Thử tải lại</button></> : <p>{allTables.length === 0 ? "Chưa có bàn. Vào Sơ đồ để tạo bàn." : "Không có bàn phù hợp với bộ lọc."}</p>}
        </div> : <ScaledFloorStage testId="floor-stage" viewportTestId="floor-canvas-viewport" minScale={0.6}>
          {({ scale }) => {
            const boost = getObjectBoost(scale), labelBoost = getLabelBoost(scale * boost);
            return <>
              {decorItems.map((d) => <div key={d.id} className="b01-decoration" data-testid={`decor-${d.id}`} style={{ ...stageStyle(d.posX, d.posY, d.width, d.height), ...nodeTransform(d.rotation) }}><FloorDecorVisual assetKey={d.assetKey} kind={d.kind} label={d.label} fallbackLabel={d.assetKey} labelBoost={getLabelBoost(scale)}/></div>)}
              {filteredTables.map((t) => {
                const order = orders.find((o) => o.tableId === t.id), occupied = isOccupied(t.id), bg = getFloorTableBackgroundAsset(t.backgroundAssetKey);
                const hitBoost = Math.max(boost, 44.1 / (Math.min(t.width, t.height) * scale));
                return <button key={t.id} className={`b01-table${t.shape === "round" ? " round" : ""}`} aria-label={`${t.name}${order ? " " + formatCompactVnd(order.total) : ""}`} title={t.name} data-testid={`table-${t.id}`} data-table-status={occupied ? "occupied" : "empty"} data-status={occupied ? "occupied" : "empty"} data-order-total={order?.total ?? 0} style={{ ...stageStyle(t.posX, t.posY, t.width, t.height), ...nodeTransform(t.rotation, hitBoost), backgroundImage: bg ? `url("${bg.assetKey}")` : undefined }} onClick={() => void openTableOrder(t, order)}>
                  <span className="table-label" style={{ transform: `scale(${labelBoost})`, maxWidth: `${100 / labelBoost}%` }}><strong data-floor-label="name">{t.name}</strong>{order && <small data-floor-label="price">{formatCompactVnd(order.total)}</small>}</span>
                </button>;
              })}
            </>;
          }}
        </ScaledFloorStage>}
        <footer className="floor-footer"><span>Chọn bàn để mở giao diện gọi món</span><span>{filteredTables.length}/{allTables.length} bàn</span></footer>
      </section>
    </div>
    <aside ref={panelRef} id="floor-order-panel" className={`order-panel${ordersOpen ? " open" : ""}`} data-testid="floor-open-orders" aria-label="Đơn đang mở" role={ordersOpen && compactOrders ? "dialog" : undefined} aria-modal={ordersOpen && compactOrders ? true : undefined} onKeyDown={onPanelKeyDown}>
      <header className="order-panel-header"><h2>Đơn đang mở <span className="count-badge">{orders.length}</span></h2><button className="icon-button close-orders" aria-label="Đóng danh sách đơn" onClick={() => setOrdersOpen(false)}>×</button></header>
      <div className="order-list">
        {openOrdersQuery.isLoading ? <p>Đang tải đơn đang mở...</p> : openOrdersQuery.isError ? <div className="state-message" data-testid="floor-orders-error-state"><p>Không tải được đơn đang mở.</p><button className="secondary-button" onClick={() => void openOrdersQuery.refetch()}>Thử lại</button></div> : <>
          {dineInOrders.length === 0 ? <p className="order-group-label">Chưa có đơn tại bàn.</p> : <><p className="order-group-label">Tại bàn · {dineInOrders.length}</p>{dineInOrders.map(orderCard)}</>}
          {takeawayOrders.length > 0 && <><p className="order-group-label">Mang đi · {takeawayOrders.length}</p>{takeawayOrders.map(orderCard)}</>}
        </>}
      </div>
      <footer className="order-panel-footer">Chọn một đơn để tiếp tục phục vụ.</footer>
    </aside>
  </>;
}
