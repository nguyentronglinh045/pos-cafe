import { useAppStore } from "../../useAppStore";
import { useDialogFocus } from "../../components/useDialogFocus";
export function usePaymentDialogFocus(onClose: () => void) {
  const receipt = useAppStore(state => state.receiptPreview);
  useDialogFocus('[data-testid="payment-drawer"]', onClose, !receipt, "Thanh toán đơn hàng");
}
