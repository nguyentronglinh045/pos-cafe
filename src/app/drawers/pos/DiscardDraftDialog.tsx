import { Button } from "@mui/material";
import { PortalPopup } from "../../components/PortalPopup";
import { useOrderDialogFocus } from "./useOrderDialogFocus";

export function DiscardDraftDialog({ onKeep, onDiscard }: { onKeep(): void; onDiscard(): void }) {
  useOrderDialogFocus('[data-testid="b02-discard-dialog"]', onKeep);
  return <PortalPopup placement="Centered" viewport="workspace" overlayClassName="b02-popup-overlay">
    <div data-testid="b02-discard-dialog" className="b02-popup grid max-h-[86dvh] w-[min(360px,88vw)] gap-3 overflow-auto rounded-pos bg-pos-surface p-6 [&_h3]:m-0 [&_p]:m-0 [&_p]:text-sm [&_p]:text-pos-muted">
      <h3>Bỏ đơn chưa gửi?</h3><p>Các món vừa chọn sẽ không được lưu.</p>
      <div className="flex flex-wrap justify-end gap-2.5 [&_.MuiButton-root]:min-w-24">
        <Button variant="outlined" onClick={onKeep}>Tiếp tục chỉnh sửa</Button>
        <Button variant="contained" color="error" onClick={onDiscard}>Bỏ đơn</Button>
      </div>
    </div>
  </PortalPopup>;
}
