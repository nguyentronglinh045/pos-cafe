import { formatVnd } from "@/core/money";
import { PaymentIcon } from "./PaymentIcon";
import { QuickAmountButtons, formatAmountInputValue, keypadKeys, type PaymentMethodOption } from "./paymentShared";
interface PaymentCashierPaneProps {
  cashierName: string;
  paymentMethods: PaymentMethodOption[];
  receivedAmount: number;
  receivedAmountInput: string;
  insufficient: boolean;
  changeAmount: number;
  orderTotal: number;
  printReceipt: boolean;
  onTogglePrint: (checked: boolean) => void;
  onAmountChange: (value: string) => void;
  onSetReceivedAmount: (value: number) => void;
  onAppendKey: (key: string) => void;
  onDeleteDigit: () => void;
}
export function PaymentCashierPane({
  cashierName,
  paymentMethods,
  receivedAmount,
  receivedAmountInput,
  insufficient,
  changeAmount,
  orderTotal,
  printReceipt,
  onTogglePrint,
  onAmountChange,
  onSetReceivedAmount,
  onAppendKey,
  onDeleteDigit
}: PaymentCashierPaneProps) {
  return <section className="card cashier" data-testid="payment-cashier-console">
    <div className="section-title"><div><h2>Phương thức thanh toán</h2><p className="muted">{`${cashierName} kiểm tra và nhập số tiền khách đưa`}</p></div></div>
    <div className="methods" data-testid="payment-method-list">{paymentMethods.map(method => <button type="button" key={method.id} className={`method${method.active ? " active" : ""}`} disabled={!method.active} data-testid={`b03-method-${method.id}`}>
      <span className="symbol"><PaymentIcon name={method.id as "cash" | "card" | "transfer" | "qr"} /></span><span><strong>{method.label}</strong><small>{method.description}</small></span>
    </button>)}</div>
    <div className="cash-inputs"><div className="amount-box" data-testid="b03-amount-box">
      <label className="amount-label" htmlFor="payment-received-amount">Tiền khách đưa</label>
      <div className="input-row"><input id="payment-received-amount" data-testid="payment-received-amount" data-amount={receivedAmount} value={formatAmountInputValue(receivedAmountInput)} onChange={event => onAmountChange(event.target.value)} inputMode="numeric" autoComplete="off" /><span>VND</span></div>
      {insufficient ? <div className="insufficient" role="status" data-testid="payment-insufficient-warning" data-shortfall={Math.abs(changeAmount)}>Còn thiếu {formatVnd(Math.abs(changeAmount))}.</div> : <QuickAmountButtons total={orderTotal} receivedAmount={receivedAmount} onSelect={onSetReceivedAmount} />}
      <div className={`change${insufficient ? " is-insufficient" : ""}`} data-testid="b03-change"><span>{insufficient ? "Còn thiếu" : "Tiền trả lại khách"}<small className="money" data-testid="b03-change-equation">{`${formatVnd(receivedAmount)} − ${formatVnd(orderTotal)}`}</small></span><strong className="money" data-testid="payment-change-summary-value">{formatVnd(Math.abs(changeAmount))}</strong></div>
    </div><div className="keypad" data-testid="payment-keypad">{keypadKeys.map(key => <button type="button" key={key} data-testid={`payment-key-${key}`} onClick={() => onAppendKey(key)}>{key}</button>)}<button type="button" data-testid="payment-key-delete" aria-label="Xóa một số" onClick={onDeleteDigit}><PaymentIcon name="delete" /></button></div></div>
    <label className="checkbox-label print"><input className="check" type="checkbox" aria-label="In hóa đơn sau khi thanh toán" checked={printReceipt} onChange={event => onTogglePrint(event.target.checked)} data-testid="print-receipt-checkbox" /><PaymentIcon name="print" /><span>In hóa đơn sau khi thanh toán</span></label>
    <p className="cashier-note">Chọn món và số lượng bên trái để thanh toán một phần.</p>
  </section>;
}
