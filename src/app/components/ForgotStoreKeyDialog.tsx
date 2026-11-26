import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ownerCreateOtpMessage, parseOwnerEmail } from "@/core/ownerCreateInput";
import type { ForgotStoreKeyAccepted, IForgotStoreKeyPort } from "@/ports/ownerRecovery";

export function ForgotStoreKeyDialog({ port, onClose }: { port: IForgotStoreKeyPort; onClose: () => void }) {
  const title = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState<ForgotStoreKeyAccepted | null>(null);
  const sending = useRef(false);

  useEffect(() => {
    // The status is already in the DOM when this effect releases the mail request.
    void accepted?.confirmReceipt?.();
  }, [accepted]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current || accepted) return;
    const canonical = parseOwnerEmail(email);
    if (!canonical) {
      setError(ownerCreateOtpMessage("A_EMAIL_INVALID"));
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    try {
      const result = await port.request(canonical);
      if (result.kind === "accepted") {
        setEmail("");
        setAccepted(result);
      } else {
        setError(result.kind === "invalid_email" ? ownerCreateOtpMessage("A_EMAIL_INVALID") : "Chưa gửi được yêu cầu. Vui lòng thử lại.");
      }
    } catch {
      setError("Chưa gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={title} data-testid="forgot-key-dialog">
      <form noValidate onSubmit={submit}>
        <DialogTitle id={title}>Quên Store Key?</DialogTitle>
        <DialogContent className="grid gap-3">
          {accepted ? <p role="status" className="m-0 text-sm">Nếu email này đứng tên quán, thư chứa Store Key đã được gửi.</p> : <>
            <p className="m-0 text-sm">Nhập email chủ quán đã đăng ký để nhận lại Store Key đang dùng. Việc gửi lại không đổi key hay đăng xuất các máy đã ghép.</p>
            <TextField autoFocus fullWidth type="email" size="small" autoComplete="email" label="Email chủ quán"
              value={email} disabled={pending} error={!!error} onChange={event => { setEmail(event.target.value); setError(""); }}
              inputProps={{ maxLength: 254, "data-testid": "forgot-key-email" }} />
            {error && <p role="alert" className="m-0 text-sm text-pos-warning">{error}</p>}
          </>}
        </DialogContent>
        <DialogActions className="flex-wrap">
          <Button onClick={onClose}>Đóng</Button>
          {!accepted && <Button variant="contained" type="submit" disabled={pending} data-testid="forgot-key-submit">
            {pending ? "Đang gửi yêu cầu..." : "Gửi key hiện tại qua email"}
          </Button>}
        </DialogActions>
      </form>
    </Dialog>
  );
}
