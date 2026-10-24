import { AlertTriangle, Banknote, CreditCard, Landmark, QrCode, ReceiptText } from "lucide-react";
import { Button } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { hasPermission } from "@/core/guards";
import { formatVnd } from "@/core/money";
import type { PaymentSelection } from "@/features/pos";
import type { OrderDetail } from "@/domain";
import { buildPayableLines, clampSelection, fullSelection, isFullSelection, selectionAmount, useFloorPlanQuery, useOrderDetailQuery, usePayOrderItemsMutation, useWriteAttempt } from "@/features/pos";
import { notifyUiError, toToastError } from "../../appErrors";
import { PortalDrawer } from "../../components/PortalDrawer";
import { ticketFromOrderDetail } from "../../components/ReceiptPreview";
import { useAppStore } from "../../useAppStore";
import { useViewLifetime } from "../../useViewLifetime";
import { PaymentCashierPane } from "./PaymentCashierPane";
import { PaymentSummaryPane } from "./PaymentSummaryPane";
import { WriteAttemptNotice } from "./WriteAttemptNotice";
import { PaymentHeader, PaymentState, getOrderTypeLabel, PaymentFooter, type PaymentMethodOption } from "./paymentShared";
import { RemakeThemeProvider } from "@/theme/RemakeThemeProvider";
import { usePaymentDialogFocus } from "./usePaymentDialogFocus";
import "./paymentRemake.css";
import { usePaymentViewport } from "./usePaymentViewport";
export function PaymentDrawer() {
  return <RemakeThemeProvider><PaymentDrawerContent /></RemakeThemeProvider>;
}
function PaymentDrawerContent() {
  const closeDrawer = useAppStore(state => state.closeDrawer);
  usePaymentDialogFocus(closeDrawer);
  usePaymentViewport();
  const openReceiptPreview = useAppStore(state => state.openReceiptPreview);
  const paymentOrderId = useAppStore(state => state.paymentOrderId);
  const captureView = useViewLifetime(paymentOrderId);
  const currentEmployee = useAppStore(state => state.currentEmployee);
  const floorPlanQuery = useFloorPlanQuery();
  const orderQuery = useOrderDetailQuery(paymentOrderId);
  const payMutation = usePayOrderItemsMutation();
  const {
    blocked,
    attempt
  } = useWriteAttempt();
  const confirmedOrder = useRef<OrderDetail | null>(null);
  const order = attempt && attempt.status !== "settled" && confirmedOrder.current ? confirmedOrder.current : orderQuery.data;
  const [receivedAmountInput, setReceivedAmountInput] = useState("0");
  const [printReceipt, setPrintReceipt] = useState(true);

  // Instant pay: selection = món/số lượng trả lần này. Mặc định "Chọn tất cả".
  const payableLines = useMemo(() => order ? buildPayableLines(order) : [], [order]);
  const [selection, setSelection] = useState<PaymentSelection>({});
  const orderStamp = order ? `${order.id}:${order.lockVersion}` : null;
  const lastStampRef = useRef<string | null>(null);
  useEffect(() => {
    if (!order || !orderStamp || orderStamp === lastStampRef.current) return;
    const sameOrder = lastStampRef.current?.startsWith(`${order.id}:`) ?? false;
    lastStampRef.current = orderStamp;
    setSelection(previous => {
      // Refetch never turns an empty prior choice into a new full-payment intent.
      const next = sameOrder ? clampSelection(payableLines, previous) : fullSelection(payableLines);
      return next;
    });
  }, [order, orderStamp, payableLines]);
  const amountDue = selectionAmount(payableLines, selection);
  const selectAllChecked = isFullSelection(payableLines, selection);
  useEffect(() => {
    setReceivedAmountInput(String(amountDue));
  }, [order?.id, amountDue]);
  const table = order?.tableId ? floorPlanQuery.data?.tables.find(candidate => candidate.id === order.tableId) : null;
  const receivedAmount = Number.parseInt(receivedAmountInput || "0", 10) || 0;
  const orderTotal = order?.total ?? 0;
  const changeAmount = receivedAmount - amountDue;
  const insufficient = receivedAmount < amountDue;
  const orderClosed = !!order && order.status !== "open";
  const orderItemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const nothingSelected = !!order && !orderClosed && amountDue <= 0;
  const paymentPermissionDenied = !hasPermission(currentEmployee, "payment.take");
  const paymentPermissionTitle = paymentPermissionDenied ? "Không có quyền thanh toán" : undefined;
  const paymentDisabled = !order || orderClosed || orderQuery.isError || insufficient || nothingSelected || paymentPermissionDenied || blocked || payMutation.isPending;
  const paymentButtonLabel = orderClosed ? order.status === "paid" ? "Đơn đã thanh toán" : "Đơn đã đóng" : payMutation.isPending ? "Đang xử lý..." : selectAllChecked ? "Hoàn tất thanh toán" : "Thanh toán món đã chọn";
  const orderLocationLabel = table ? `Bàn ${table.name}` : getOrderTypeLabel(order);
  const headerMeta = [order ? orderLocationLabel : null, order ? `Đơn #${order.orderNo}` : null, order ? `${orderItemCount} món` : null].filter(Boolean);
  const paymentMethods = useMemo<PaymentMethodOption[]>(() => [{
    id: "cash",
    label: "Tiền mặt",
    description: "Đang chọn",
    icon: Banknote,
    active: true
  }, {
    id: "card",
    label: "Thẻ",
    description: "Chưa bật",
    icon: CreditCard,
    active: false
  }, {
    id: "transfer",
    label: "Chuyển khoản",
    description: "Chưa bật",
    icon: Landmark,
    active: false
  }, {
    id: "qr",
    label: "QR",
    description: "Chưa bật",
    icon: QrCode,
    active: false
  }], []);
  const setReceivedAmount = (value: number) => {
    setReceivedAmountInput(String(Math.max(0, Math.floor(value))));
  };
  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    setReceivedAmountInput(digits ? String(Number(digits)) : "0");
  };
  const appendKey = (key: string) => {
    setReceivedAmountInput(current => {
      const normalized = current.replace(/^0+(?=\d)/, "") || "0";
      const next = normalized === "0" ? key : `${normalized}${key}`;
      return String(Number(next.slice(0, 9)));
    });
  };
  const deleteLastDigit = () => {
    setReceivedAmountInput(current => current.length > 1 ? current.slice(0, -1) : "0");
  };
  const printProvisional = () => {
    if (!order) return;
    openReceiptPreview({
      presentation: "remake",
      variant: "ticket",
      doc: ticketFromOrderDetail(order, table?.name ?? null)
    });
  };
  const reloadOrder = () => {
    void orderQuery.refetch();
    void floorPlanQuery.refetch();
  };
  const toggleSelectAll = (checked: boolean) => {
    if (blocked) return;
    setSelection(checked ? fullSelection(payableLines) : {});
  };
  const toggleLine = (orderItemId: string) => {
    if (blocked) return;
    setSelection(previous => {
      const next = {
        ...previous
      };
      if (next[orderItemId]) {
        delete next[orderItemId];
        return next;
      }
      const line = payableLines.find(candidate => candidate.orderItemId === orderItemId);
      if (line) next[orderItemId] = 1;
      return next;
    });
  };

  // Nút "+": tăng số lượng trả lần này, chạm trần thì quay về 1 (một nút, hợp tablet).
  const cycleLineQuantity = (orderItemId: string) => {
    if (blocked) return;
    const line = payableLines.find(candidate => candidate.orderItemId === orderItemId);
    if (!line) return;
    setSelection(previous => {
      const current = previous[orderItemId] ?? 0;
      const next = current + 1 > line.quantity ? 1 : current + 1;
      return {
        ...previous,
        [orderItemId]: next
      };
    });
  };
  const payOrder = () => {
    if (!order || !currentEmployee || paymentDisabled) return;
    confirmedOrder.current = structuredClone(order);
    if (orderClosed) {
      toast("Đơn này đã được cập nhật trên thiết bị khác.");
      return;
    }
    const isCurrent = captureView();
    payMutation.mutate({
      order,
      actor: currentEmployee,
      receivedAmount,
      selection,
      printReceipt
    }, {
      onSuccess: result => {
        if (!isCurrent()) return;
        // In bill từ payload trả về ngay trong mutation (không chờ refetch).
        if (printReceipt && result.initialSuccess) {
          openReceiptPreview({
            presentation: "remake",
            variant: "receipt",
            doc: result.receipt
          });
        }
        if (result.mode === "full") {
          toast.success("Đã thanh toán. Bàn đã trống.");
          closeDrawer();
          return;
        }
        // Tách đơn: các món được chọn thành đơn #N đã thanh toán; đơn gốc còn lại trên bàn.
        toast.success(`Đã tách và thanh toán đơn #${result.orderNo} (${formatVnd(result.total)}). Bàn còn ${formatVnd(result.sourceTotal)}.`);
        // A new payment requires a new deliberate selection after this success.
        setSelection({});
        void orderQuery.refetch();
      },
      onError: error => {
        if (!isCurrent()) return;
        const uiError = notifyUiError(error);
        if (uiError.action === "reloadOrder") {
          void orderQuery.refetch();
          void floorPlanQuery.refetch();
        }
      }
    });
  };
  return <PortalDrawer testId="payment-drawer" onOutsideClick={closeDrawer} overlayColor="var(--bg)" overlayClassName="b03-backdrop" panelClassName="b03-remake panel">
      <WriteAttemptNotice />
      <PaymentHeader meta={headerMeta.join(" · ")} onClose={closeDrawer} action={<button type="button" className="primary header-pay" data-testid="pay-button" disabled={paymentDisabled} title={paymentPermissionTitle} onClick={payOrder}><span data-testid="b03-pay-header-label">{paymentButtonLabel}</span></button>} />
      <div className="body" data-testid="b03-body">
        {!paymentOrderId ? <PaymentState testId="payment-missing-state" icon={<ReceiptText />}><p>Không tìm thấy đơn.</p></PaymentState> : orderQuery.isLoading ? <PaymentState testId="payment-loading-state" icon={<ReceiptText />}><p>Đang tải đơn thanh toán...</p></PaymentState> : orderQuery.isError ? <PaymentState testId="payment-error-state" icon={<AlertTriangle />}><strong>Không tải được đơn thanh toán</strong><p>{toToastError(orderQuery.error)}</p><Button variant="contained" size="small" onClick={() => void orderQuery.refetch()}>Thử tải lại</Button></PaymentState> : <>
          <PaymentSummaryPane order={order} locationLabel={orderLocationLabel} payableLines={payableLines} selection={selection} selectAllChecked={selectAllChecked} amountDue={amountDue} orderClosed={orderClosed} orderTotal={orderTotal} isError={orderQuery.isError} onToggleSelectAll={toggleSelectAll} onToggleLine={toggleLine} onCycleLineQuantity={cycleLineQuantity} onReloadOrder={reloadOrder} onPrintProvisional={printProvisional} />
          <PaymentCashierPane cashierName={currentEmployee?.name ?? "Thu ngân"} paymentMethods={paymentMethods} receivedAmount={receivedAmount} receivedAmountInput={receivedAmountInput} insufficient={insufficient} changeAmount={changeAmount} orderTotal={amountDue} printReceipt={printReceipt} onTogglePrint={setPrintReceipt} onAmountChange={handleAmountChange} onSetReceivedAmount={setReceivedAmount} onAppendKey={appendKey} onDeleteDigit={deleteLastDigit} />
        </>}
      </div>
      <PaymentFooter label={paymentButtonLabel} amount={amountDue} disabled={paymentDisabled} title={paymentPermissionTitle} onPay={payOrder} onClose={closeDrawer} />
    </PortalDrawer>;
}
