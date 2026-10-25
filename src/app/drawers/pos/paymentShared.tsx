import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { OrderDetail } from "@/domain";
import { formatVnd } from "@/core/money";
import { PaymentIcon } from "./PaymentIcon";
export const keypadKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "00", "0"] as const;
export type PaymentMethodOption = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  active: boolean;
};
export const getOrderTypeLabel = (order?: Pick<OrderDetail, "orderType"> | null) => order?.orderType === "takeaway" ? "Mang đi" : "Tại bàn";
export const formatAmountInputValue = (rawDigits: string) => {
  const normalized = rawDigits.replace(/\D/g, "").replace(/^0+(?=\d)/, "") || "0";
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
export function PaymentHeader({
  meta,
  onClose,
  action
}: {
  meta?: string;
  onClose: () => void;
  action?: ReactNode;
}) {
  return <header className="header" data-testid="b03-header">
    <button type="button" className="back" data-testid="payment-close-button" onClick={onClose}><PaymentIcon name="back" /> <span>Quay lại</span></button>
    <div className="header-title"><h1 id="b03-title" data-testid="b03-title">Thanh toán đơn hàng</h1>{meta && <p className="meta" data-testid="b03-meta">{meta}</p>}</div>
    {action}<button type="button" className="icon-button quiet" aria-label="Đóng thanh toán" data-testid="b03-close" onClick={onClose}><PaymentIcon name="close" /></button>
  </header>;
}
export function PaymentState({
  testId,
  icon,
  children
}: {
  testId: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return <div className="payment-state" data-testid={testId}>{icon}{children}</div>;
}
export function QuickAmountButtons({
  total,
  receivedAmount,
  onSelect
}: {
  total: number;
  receivedAmount: number;
  onSelect: (value: number) => void;
}) {
  const options = [{
    label: "Đúng tiền",
    value: total
  }, {
    label: "+20k",
    value: total + 20000
  }, {
    label: "+50k",
    value: total + 50000
  }, {
    label: "200k",
    value: 200000
  }, {
    label: "500k",
    value: 500000
  }];
  return <div className="quick">{options.map((option, index) => <button type="button" key={option.label} data-testid={`b03-quick-${index}`} className={receivedAmount === option.value ? "chosen" : undefined} onClick={() => onSelect(option.value)}>{option.label}</button>)}</div>;
}
export function PaymentFooter({
  label,
  amount,
  disabled,
  title,
  onPay,
  onClose
}: {
  label: string;
  amount: number;
  disabled: boolean;
  title?: string;
  onPay: () => void;
  onClose: () => void;
}) {
  return <footer className="footer" data-testid="b03-footer">
    <button type="button" className="primary footer-pay" data-testid="pay-button-footer" disabled={disabled} title={title} onClick={onPay}><PaymentIcon name="check" /> <span data-testid="b03-pay-label">{`${label} (${formatVnd(amount)})`}</span></button>
    <button type="button" className="quiet footer-back" data-testid="b03-back-footer" onClick={onClose}><PaymentIcon name="back" /> Quay lại</button>
  </footer>;
}
