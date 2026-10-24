import type { SubmitOrderDraftItem } from "@/domain";
import type { CartLine } from "@/features/pos";
import { formatVnd } from "@/core/money";

type OrderCartPaneProps = {
  cartLines: CartLine[]; draftItems: SubmitOrderDraftItem[]; noteOpenId: string | null; total: number;
  showPaymentHint: boolean; primaryDisabled: boolean; primaryActionLabel: string; primaryActionTitle?: string;
  onAdjustQuantity: (lineId: string, delta: number) => void; onToggleNote: (lineId: string) => void;
  onUpdateNote: (lineId: string, note: string) => void; onPrimaryAction: () => void;
};
export function OrderCartPane({ cartLines, draftItems, noteOpenId, total, showPaymentHint, primaryDisabled, primaryActionLabel, primaryActionTitle, onAdjustQuantity, onToggleNote, onUpdateNote, onPrimaryAction }: OrderCartPaneProps) {
  const noteFor = (id: string) => draftItems.find(d => d.id === id)?.note ?? "";
  return <aside className="cart" data-testid="b02-cart"><header className="cart-header"><h2 style={{ font: "inherit" }}>Giỏ hàng</h2><span>{cartLines.length} món</span></header><div className="cart-lines" data-testid="b02-cart-scroll">{cartLines.length ? cartLines.map(line => {
    const draft = draftItems.find(d => d.id === line.id), saved = !!draft?.sourceItemId;
    return <section key={line.id} className={`cart-line${saved ? "" : " new-line"}`} data-testid="order-cart-line" data-source-item-id={draft?.sourceItemId} data-menu-item-id={draft?.menuItemId} data-quantity={line.quantity} data-unit-price={line.quantity > 0 ? line.total / line.quantity : 0} data-line-total={line.total}>
      <div className="line-top"><span className="line-name"><strong title={line.name}>{line.name}</strong></span><strong className="line-price" data-testid="b02-line-total">{formatVnd(line.total)}</strong></div>
      <div className="line-meta"><span className="line-state">{saved ? "Phần đã lưu" : "Phần gọi thêm"}</span><span data-testid="b02-unit-price">{formatVnd(line.total / line.quantity)} / món</span></div>
      {line.optionText && <p className="line-options">{line.optionText}</p>}{noteFor(line.id) && noteOpenId !== line.id && <p className="line-note">{noteFor(line.id)}</p>}
      <div className="line-controls"><span className="stepper"><button data-testid="order-cart-decrease" aria-label={`Giảm ${line.name}`} onClick={() => onAdjustQuantity(line.id, -1)}>−</button><span data-testid="order-cart-quantity">{line.quantity}</span><button data-testid="order-cart-increase" aria-label={`Tăng ${line.name}`} onClick={() => onAdjustQuantity(line.id, 1)}>+</button></span><button className="note-button" data-testid="b02-note" onClick={() => onToggleNote(line.id)}>Ghi chú</button></div>
      {noteOpenId === line.id && <input className="line-note-input" data-testid="b02-line-note" aria-label={`Ghi chú ${line.name}`} placeholder="VD: ít đá, không đường..." value={noteFor(line.id)} onChange={event => onUpdateNote(line.id, event.target.value)} autoFocus/>}
    </section>;
  }) : <p className="empty-message">Chọn món từ menu để tạo đơn.</p>}</div><footer className="cart-footer" data-testid="b02-footer">{showPaymentHint && <p className="payment-hint">Gửi đơn để lưu thay đổi trước khi thanh toán.</p>}<div className="summary-row"><span>Tạm tính</span><strong data-testid="b02-subtotal">{formatVnd(total)}</strong></div><div className="summary-row grand-total"><span>Tổng</span><strong data-testid="order-total-amount" data-amount={total}>{formatVnd(total)}</strong></div><button className="primary" data-testid="submit-order-button-footer" disabled={primaryDisabled} title={primaryActionTitle} onClick={onPrimaryAction}><span>{primaryActionLabel}</span></button></footer></aside>;
}
