import { RemakeThemeProvider } from "@/theme/RemakeThemeProvider";
import "./orderRemake.css";
import { useOrderDialogFocus } from "./useOrderDialogFocus";
import { AlertTriangle } from "lucide-react";
import { Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { hasPermission } from "@/core/guards";
import type { EmployeePermission, PriceChangedDetails } from "@/domain";
import { AppError } from "@/core/appError";
import { PriceChangedNotice } from "./PriceChangedNotice";
import {
  adjustDraftQuantity,
  buildCartLines,
  calculateCartTotal,
  diffAddedPrintLines,
  getItemModifierGroups,
  getOrderPrimaryAction,
  getSubmitOrderPermission,
  isDraftChangedFromOrder,
  useOrderModifierPicker,
  useFloorPlanQuery,
  useMenuQuery,
  useOrderDetailQuery,
  useSubmitOrderMutation,
  useWriteAttempt,
} from "@/features/pos";
import { usePorts } from "@/features/shared/portsContext";
import { notifyUiError, toToastError } from "../../appErrors";
import { PortalDrawer } from "../../components/PortalDrawer";
import { DiscardDraftDialog } from "./DiscardDraftDialog";
import { useAppStore } from "../../useAppStore";
import { useViewLifetime } from "../../useViewLifetime";
import { ModifierPickerPopup } from "./ModifierPickerPopup";
import { OrderCartPane } from "./OrderCartPane";
import { OrderMenuPane } from "./OrderMenuPane";
import { useServerOrderDraft } from "./useServerOrderDraft";
import { WriteAttemptNotice } from "./WriteAttemptNotice";
import { clearDrawerExitGuard, registerDrawerExitGuard } from "../../drawerNavigation";

export function OrderDrawer() {
  const closeDrawer = useAppStore((state) => state.closeDrawer);
  useOrderDialogFocus('[data-testid="order-drawer"]', closeDrawer);
  const openPayment = useAppStore((state) => state.openPayment);
  const context = useAppStore((state) => state.orderContext);
  const captureView = useViewLifetime(context);
  const currentEmployee = useAppStore((state) => state.currentEmployee);
  const draftItems = useAppStore((state) => state.draftItems);
  const setDraftItems = useAppStore((state) => state.setDraftItems);
  const openReceiptPreview = useAppStore((state) => state.openReceiptPreview);
  const activeCategoryId = useAppStore((state) => state.activeCategoryId);
  const setActiveCategoryId = useAppStore((state) => state.setActiveCategoryId);
  const ports = usePorts();

  const [search, setSearch] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);

  const menuQuery = useMenuQuery();
  const floorPlanQuery = useFloorPlanQuery();
  const orderQuery = useOrderDetailQuery(context?.orderId ?? null);
  const submitMutation = useSubmitOrderMutation();
  const { blocked, coordinator } = useWriteAttempt();
  const { editingOrder, remoteConflict, acceptCurrent } = useServerOrderDraft(context, orderQuery.data);
  const priceChanged = submitMutation.error instanceof AppError && submitMutation.error.code === "PRICE_CHANGED"
    ? submitMutation.error.cause as PriceChangedDetails | undefined : undefined;

  useEffect(() => {
    const firstCategory = menuQuery.data?.categories[0]?.id;
    if (!activeCategoryId && firstCategory) setActiveCategoryId(firstCategory);
  }, [activeCategoryId, menuQuery.data, setActiveCategoryId]);


  const menu = menuQuery.data;
  const picker = useOrderModifierPicker(menu, draftItems, setDraftItems);
  const categoryId = activeCategoryId ?? menu?.categories[0]?.id ?? "";
  const allCategoryItems = menu?.menuItems.filter((item) => item.categoryId === categoryId) ?? [];
  const items = search
    ? (menu?.menuItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())) ?? [])
    : allCategoryItems;
  const orderDetail = editingOrder;
  const table = context?.tableId ? floorPlanQuery.data?.tables.find((candidate) => candidate.id === context.tableId) : null;
  const cartLines = useMemo(() => (menu ? buildCartLines(menu, draftItems) : []), [draftItems, menu]);
  const total = calculateCartTotal(cartLines);
  const draftChanged = isDraftChangedFromOrder(orderDetail, draftItems);
  useEffect(() => registerDrawerExitGuard((navigate) => {
    const attempt = coordinator.snapshot();
    if (draftChanged && (!attempt || attempt.status === "settled")) setPendingNavigation(() => navigate);
    else navigate();
  }), [draftChanged, coordinator]);
  const primaryAction = getOrderPrimaryAction(orderDetail, draftItems);
  const requiredPermission: EmployeePermission = primaryAction === "payment"
    ? "payment.take" : getSubmitOrderPermission(context ?? { orderId: null }, draftItems);
  const permissionDenied = primaryAction !== "closed" && !hasPermission(currentEmployee, requiredPermission);
  const permissionTitle = permissionDenied ? ({
    "order.create": "Không có quyền tạo đơn",
    "order.update": "Không có quyền sửa đơn",
    "order.voidOpen": "Không có quyền hủy đơn",
    "payment.take": "Không có quyền thanh toán",
    "order.voidPaid": "Không có quyền hủy đơn đã thanh toán",
  } satisfies Record<EmployeePermission, string>)[requiredPermission] : undefined;
  const submitDisabled =
    submitMutation.isPending || menuQuery.isError || orderQuery.isError || (!!context?.orderId && orderQuery.isLoading);
  const primaryDisabled =
    primaryAction === "closed"
      ? true
      : primaryAction === "payment"
        ? !orderDetail || submitMutation.isPending
        : submitDisabled;
  const primaryDisabledWithPermission = primaryDisabled || permissionDenied || blocked || remoteConflict || !!priceChanged;
  const primaryActionLabel = submitMutation.isPending
    ? "Đang gửi..."
    : primaryAction === "closed"
      ? orderDetail?.status === "paid"
        ? "Đã thanh toán"
        : "Đơn đã đóng"
      : primaryAction === "payment"
        ? "Thanh toán"
        : "In/Gửi đơn";

  const handleClose = closeDrawer;

  const adjustQuantity = (id: string, delta: number) => {
    try { setDraftItems(adjustDraftQuantity(draftItems, id, delta, menu)); }
    catch (error) { notifyUiError(error); }
  };

  const handleSubmitError = (error: unknown) => {
    const uiError = notifyUiError(error);
    if (uiError.action === "refreshMenu") {
      void menuQuery.refetch();
    }
    if (uiError.action === "reloadOrder") {
      if (context?.orderId) {
        void orderQuery.refetch();
      }
      void floorPlanQuery.refetch();
    }
  };

  const submitOrder = () => {
    if (!context || !currentEmployee || primaryDisabledWithPermission) return;

    // Chốt các món MỚI THÊM ngay tại thời điểm bấm gửi (dữ liệu trên máy) để in
    // phiếu gửi bếp — không phụ thuộc payload/refetch từ server.
    const addedLines = menu ? diffAddedPrintLines(menu, orderDetail, draftItems) : [];
    const isCurrent = captureView();

    submitMutation.mutate(
      {
        context,
        actor: currentEmployee,
        expectedVersion: orderDetail?.lockVersion ?? null,
        items: draftItems,
        menu,
      },
      {
        onSuccess: (result) => {
          if (!isCurrent()) return;
          if (result.initialSuccess && result.status !== "void" && addedLines.length > 0) {
            openReceiptPreview({
              variant: "kitchen",
              doc: {
                orderNo: result.orderNo,
                tableName: table?.name ?? null,
                orderType: context.orderType,
                lines: addedLines,
                total: addedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
              },
            });
          }
          toast.success(result.status === "void" ? "Đã huỷ đơn mở." : "Đã in/gửi đơn.");
          clearDrawerExitGuard();
          closeDrawer();
        },
        onError: (error) => { if (isCurrent()) handleSubmitError(error); },
      },
    );
  };

  const runPrimaryAction = () => {
    if (primaryAction === "closed") {
      toast("Đơn này đã được cập nhật trên thiết bị khác.");
      return;
    }

    if (primaryAction === "payment" && orderDetail) {
      openPayment(orderDetail.id);
      return;
    }

    submitOrder();
  };

  const updateNote = (id: string, note: string) => {
    setDraftItems(draftItems.map((draft) => (draft.id === id ? { ...draft, note: note || null } : draft)));
  };

  const orderTypeLabel = context?.orderType === "takeaway" ? "Mang đi" : `Bàn ${table?.name ?? "?"}`;
  const titleLabel = orderDetail ? `${orderTypeLabel} · Đơn #${orderDetail.orderNo}` : `${orderTypeLabel} · Đơn mới`;
  const orderStatusLabel = orderDetail?.status === "paid" ? "Đã thanh toán"
    : orderDetail?.status === "void" ? "Đã hủy" : orderDetail ? "Đã gửi" : "Chưa gửi";

  return <RemakeThemeProvider>
    <PortalDrawer testId="order-drawer" onOutsideClick={handleClose} panelClassName="b02-remake" overlayColor="var(--drawer-overlay)">
      <header className="order-header" data-testid="b02-header" aria-label={titleLabel}>
        <div className="heading"><h1>{`Gọi món — ${orderTypeLabel}`}</h1><p><span className="badge"><span className="dot"/>{context?.orderType === "takeaway" ? "Mang đi" : `${floorPlanQuery.data?.areas.find(area => area.id === table?.areaId)?.name ? floorPlanQuery.data.areas.find(area => area.id === table?.areaId)!.name + " · " : ""}Tại bàn`}</span><span>{orderDetail ? `Đơn #${orderDetail.orderNo}` : "Đơn mới"} · {orderStatusLabel}</span></p></div>
        <div className="header-actions"><button className="close" data-testid="order-close-button" onClick={handleClose}>Đóng</button>{orderDetail && draftChanged && primaryAction !== "closed" && <button className="payment-locked" disabled>Thanh toán</button>}<button className="primary" data-testid="submit-order-button" disabled={primaryDisabledWithPermission} title={permissionTitle} onClick={runPrimaryAction}><span>{primaryActionLabel}</span></button></div>
      </header>
      <div className="b02-notices" data-testid="b02-notices">
        <WriteAttemptNotice onApplied={() => {
          clearDrawerExitGuard();
          setDraftItems([]);
          closeDrawer();
        }}/>
        {remoteConflict && <div role="alert"><p>Đơn đã thay đổi trên server. Phần đang chỉnh sửa vẫn được giữ để bạn kiểm tra.</p><Button onClick={() => { acceptCurrent(); coordinator.leave(); }}>Bỏ bản đang sửa và dùng đơn trên server</Button></div>}
        {priceChanged && <PriceChangedNotice priceChanged={priceChanged} draftItems={draftItems} menu={menu} setDraftItems={setDraftItems} onReviewed={() => { submitMutation.reset(); coordinator.leave(); }}/>}
        {orderQuery.isError && <div className="b02-warning" data-testid="order-error-state"><AlertTriangle size={18}/><strong>Không tải được đơn hiện tại</strong><p>{toToastError(orderQuery.error)}</p><button onClick={() => void orderQuery.refetch()}>Thử lại</button></div>}
        {primaryAction === "closed" && <div className="b02-warning" data-testid="order-closed-state"><AlertTriangle size={18}/><strong>Đơn đã được cập nhật</strong><p>Thiết bị khác đã thanh toán hoặc đóng đơn này. Quay lại sơ đồ để xem trạng thái mới nhất.</p></div>}
      </div>
      <fieldset disabled={blocked} className="drawer-body">
        <OrderMenuPane categories={menu?.categories} items={items} allItems={menu?.menuItems} categoryId={categoryId} search={search} isLoading={menuQuery.isLoading} isError={menuQuery.isError} error={menuQuery.error} getMenuImageUrl={assetKey => ports.menuImages.getImageUrl(assetKey)} hasModifiers={itemId => !!menu && getItemModifierGroups(menu,itemId).length > 0} onSelectCategory={selectedCategoryId => { setActiveCategoryId(selectedCategoryId); setSearch(""); }} onSearchChange={setSearch} onRetry={() => void menuQuery.refetch()} onAddItem={picker.requestAdd}/>
        <OrderCartPane cartLines={cartLines} draftItems={draftItems} noteOpenId={noteOpenId} total={total} showPaymentHint={!!orderDetail && draftChanged && primaryAction !== "closed"} primaryDisabled={primaryDisabledWithPermission} primaryActionLabel={primaryActionLabel} primaryActionTitle={permissionTitle} onAdjustQuantity={adjustQuantity} onToggleNote={lineId => setNoteOpenId(noteOpenId === lineId ? null : lineId)} onUpdateNote={updateNote} onPrimaryAction={runPrimaryAction}/>
      </fieldset>
      {pendingNavigation && <DiscardDraftDialog onKeep={() => setPendingNavigation(null)} onDiscard={() => { const navigate = pendingNavigation; setPendingNavigation(null); navigate(); }}/>}
      {picker.modifierItem && menu && <ModifierPickerPopup menuItem={picker.modifierItem} groups={getItemModifierGroups(menu,picker.modifierItem.id)} onConfirm={picker.confirm} onClose={picker.cancel}/>}
    </PortalDrawer>
  </RemakeThemeProvider>;
}
