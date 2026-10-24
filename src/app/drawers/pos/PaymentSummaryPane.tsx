import { formatVnd } from "@/core/money";
import type { OrderDetail } from "@/domain";
import type { PayableLine, PaymentSelection } from "@/features/pos";
import { PaymentIcon } from "./PaymentIcon";
interface PaymentSummaryPaneProps {
  order?: OrderDetail | null;
  locationLabel: string;
  payableLines: PayableLine[];
  selection: PaymentSelection;
  selectAllChecked: boolean;
  amountDue: number;
  orderClosed: boolean;
  orderTotal: number;
  isError: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleLine: (orderItemId: string) => void;
  onCycleLineQuantity: (orderItemId: string) => void;
  onReloadOrder: () => void;
  onPrintProvisional: () => void;
}
export function PaymentSummaryPane({
  order,
  locationLabel,
  payableLines,
  selection,
  selectAllChecked,
  amountDue,
  orderClosed,
  orderTotal,
  isError,
  onToggleSelectAll,
  onToggleLine,
  onCycleLineQuantity,
  onReloadOrder,
  onPrintProvisional
}: PaymentSummaryPaneProps) {
  const selectedCount = payableLines.reduce((sum, line) => sum + (selection[line.orderItemId] ?? 0), 0);
  const itemCount = payableLines.reduce((sum, line) => sum + line.quantity, 0);
  return <section className="card invoice" data-testid="b03-invoice">
    <div className="section-title"><span className="section-icon"><PaymentIcon name="receipt" /></span><div><h2>Chi tiết hóa đơn</h2><p className="muted">{`${payableLines.length} dòng món · ${itemCount} món trong đơn`}</p></div><span className="tag">{`${locationLabel} · Khách lẻ`}</span></div>
    <div className="selection"><label className="checkbox-label"><input className="check" type="checkbox" aria-label="Chọn tất cả món thanh toán" data-testid="pay-select-all" checked={selectAllChecked} disabled={orderClosed || payableLines.length === 0} onChange={event => onToggleSelectAll(event.target.checked)} /><span>Chọn tất cả</span></label><small data-testid="b03-selected-count">{`${selectedCount} món đã chọn`}</small></div>
    <div className="items overflow-y-auto" data-testid="payment-order-items">{payableLines.length === 0 ? <p className="payment-empty">Chưa có món trong đơn.</p> : payableLines.map(line => {
        const selected = selection[line.orderItemId] ?? 0;
        return <article className="line" key={line.orderItemId} data-testid="pay-item-line" data-unit-total={line.unitTotal} data-line-quantity={line.quantity} data-selected-quantity={selected}>
        <input className="check" type="checkbox" aria-label={`Chọn thanh toán ${line.name}`} data-testid="pay-item-checkbox" checked={selected > 0} disabled={orderClosed} onChange={() => onToggleLine(line.orderItemId)} />
        <div><h3 data-testid="b03-name">{line.name}</h3>{(line.optionText || line.note) && <p>{[line.optionText, line.note ? `Ghi chú: ${line.note}` : ""].filter(Boolean).join(" · ")}</p>}<div className="unit" data-testid="b03-unit">{`${formatVnd(line.unitTotal)} / món`}</div></div>
        <div><p className="amount money" data-testid="b03-line-money">{formatVnd(line.unitTotal * selected)}</p><div className="line-actions"><span data-testid="pay-item-quantity" style={{
                display: "contents"
              }}><span className="quantity" data-testid="b03-quantity">{`${selected}/${line.quantity}`}</span></span><button type="button" className="icon-button" aria-label={`Tăng số lượng thanh toán ${line.name}`} data-testid="pay-item-plus" disabled={orderClosed} onClick={() => onCycleLineQuantity(line.orderItemId)}><PaymentIcon name="plus" /></button></div></div>
      </article>;
      })}</div>
    <div className="totals" data-testid="payment-order-summary" data-amount-due={amountDue} data-order-total={orderTotal}>
      {orderClosed && <div className="closed-notice" data-testid="payment-closed-state"><strong>Đơn đã được cập nhật</strong><p>Tải lại để xem trạng thái mới nhất.</p><button type="button" onClick={onReloadOrder}>Tải lại đơn</button></div>}
      <div className="row"><span>Tổng đơn</span><strong className="money" data-testid="payment-order-total-value">{formatVnd(orderTotal)}</strong></div>
      <div className="grand"><span>Thanh toán lần này</span><strong className="money" data-testid="payment-amount-due-value" data-amount={amountDue}>{formatVnd(amountDue)}</strong></div>
      <button type="button" className="provisional quiet" data-testid="print-provisional-button" disabled={!order || isError} onClick={onPrintProvisional}><PaymentIcon name="print" /> In tạm tính</button>
    </div>
  </section>;
}
