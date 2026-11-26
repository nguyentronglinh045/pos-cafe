import { Alert, Button, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { newOwnerRequestId } from "@/core/ownerCreateInput";
import { usePermissionSession } from "@/features/shared/permissionSession";
import type { IOwnerRecoveryPort, RotationConfirmation, RotationError, RotationOtpRequest, RotationStatus } from "@/ports/ownerRecovery";
import { useRotatedStorePairing } from "../../useRotatedStorePairing";

const otpPattern = /^[0-9]{6}$/;
const messages: Record<RotationError, string> = {
  AUTH_REQUIRED: "Phiên ghép thiết bị không còn hợp lệ. Vui lòng ghép lại.",
  EMPLOYEE_SESSION_REQUIRED: "Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại.",
  PIN_CHANGE_REQUIRED: "Bạn cần đổi PIN trước khi sử dụng quán.",
  OWNER_ROLE_REQUIRED: "Chỉ tài khoản chủ quán mới thực hiện được thao tác này.",
  STORE_SUSPENDED: "Quán đang tạm ngưng nên chưa thực hiện được thao tác này.",
  STORE_NAME_MISMATCH: "Tên quán chưa đúng. Vui lòng gõ lại đúng tên quán.",
  A_REQUEST_INVALID: "Yêu cầu không hợp lệ. Vui lòng tải lại trang rồi thử lại.",
  A_REQUEST_ID_STALE: "Thời gian trên thiết bị chưa khớp. Vui lòng thử lại.",
  A_REQUEST_ID_REUSED: "Yêu cầu gửi mã không hợp lệ. Vui lòng thử lại.",
  A_SEND_UNAVAILABLE: "Chưa tiếp nhận được yêu cầu gửi mã. Vui lòng thử lại.",
  A_ATTEMPT_ID_REUSED: "Mã lượt xác nhận đã được dùng cho nội dung khác. Vui lòng thử lại.",
  A_OTP_FORMAT_INVALID: "Mã xác minh phải gồm đúng 6 chữ số từ 0 đến 9.",
  A_OTP_INVALID: "Mã xác minh không đúng. Vui lòng kiểm tra và nhập lại.",
  A_OTP_EXPIRED: "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.",
  A_OTP_UNAVAILABLE: "Không có mã xác minh hợp lệ. Vui lòng yêu cầu mã mới.",
  A_OTP_ATTEMPTS_EXCEEDED: "Mã xác minh đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
  CREATE_VERIFY_UNAVAILABLE: "Chưa xác nhận được kết quả. Vui lòng thử lại.",
};

export function StoreKeyRotationPanel({ port, storeName }: { port: IOwnerRecoveryPort; storeName: string }) {
  const pairing = useRotatedStorePairing();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; deadline: number } | null>(null);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState<"issue" | "confirm" | null>(null);
  const [status, setStatus] = useState<RotationStatus | "uncertain" | null>(null);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const issueRequest = useRef<RotationOtpRequest | null>(null);
  const proof = useRef<RotationConfirmation | null>(null);
  const timeOffset = useRef(0);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const generation = usePermissionSession(state => state.generation);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!receipt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [receipt]);

  const stillOwner = () => {
    const state = usePermissionSession.getState();
    return mounted.current && state.generation === generation && state.status === "verified"
      && state.bundle?.snapshot.role === "owner";
  };
  const matchingName = !!storeName.trim() && name.trim() === storeName.trim();
  const wait = Math.max(0, Math.ceil(((receipt?.deadline ?? now) - now) / 1_000));
  const stamp = () => newOwnerRequestId(Date.now() + timeOffset.current);
  function start(kind: "issue" | "confirm") {
    if (inFlight.current || !stillOwner()) return false;
    inFlight.current = true;
    setBusy(kind);
    setMessage("");
    return true;
  }
  function finish() {
    inFlight.current = false;
    if (stillOwner()) setBusy(null);
  }

  function handleSessionError(error: RotationError, confirming: boolean) {
    if (error !== "AUTH_REQUIRED" && error !== "EMPLOYEE_SESSION_REQUIRED" && error !== "PIN_CHANGE_REQUIRED") return false;
    const notice = messages[error] + (confirming ? " Nếu lượt đổi đã thành công, hãy lấy key mới từ email đã đăng ký." : "");
    issueRequest.current = null;
    proof.current = null;
    setCode("");
    setReceipt(null);
    setStatus(null);
    if (error === "AUTH_REQUIRED") void pairing.requireStorePairing(notice);
    else pairing.requireEmployeePin(notice);
    return true;
  }

  async function issue(checkAgain = false) {
    if ((!checkAgain && (!matchingName || wait > 0)) || !start("issue")) return;
    const input = issueRequest.current ?? { storeName: name.trim(), requestId: stamp() };
    issueRequest.current = input;
    try {
      const result = await port.requestRotationOtp(input);
      if (!stillOwner()) return;
      if (result.kind === "receipt") {
        const receivedAt = Date.now();
        timeOffset.current = result.serverNow - receivedAt;
        setNow(receivedAt);
        setReceipt({ id: result.challengeRef, deadline: receivedAt + result.resendNotBefore - result.serverNow });
        setCode("");
        proof.current = null;
        issueRequest.current = null;
      } else if (result.kind === "status") {
        setStatus(result.status);
      } else if (!handleSessionError(result.code, false)) {
        if (result.serverNow !== undefined) timeOffset.current = result.serverNow - Date.now();
        if (result.code !== "A_SEND_UNAVAILABLE") issueRequest.current = null;
        setMessage(messages[result.code]);
      }
    } catch {
      if (stillOwner()) setMessage(messages.A_SEND_UNAVAILABLE);
    } finally { finish(); }
  }

  async function confirm(checkAgain = false) {
    const input = proof.current ?? (receipt && matchingName && otpPattern.test(code)
      ? { storeName: name.trim(), challengeRef: receipt.id, code, attemptId: stamp() } : null);
    if (!input || (!checkAgain && !wait) || !start("confirm")) return;
    proof.current = input;
    try {
      const result = await port.confirmRotation(input);
      if (!stillOwner()) return;
      if (result.kind === "key") {
        setStoreKey(result.storeKey);
        setCode("");
        proof.current = null;
      } else if (result.kind === "status") {
        setStatus(result.status);
        setCode("");
        if (result.status !== "pending") proof.current = null;
      } else if (result.kind === "uncertain" || result.code === "CREATE_VERIFY_UNAVAILABLE") {
        setStatus("uncertain");
        setCode("");
      } else if (!handleSessionError(result.code, true)) {
        if (result.serverNow !== undefined) timeOffset.current = result.serverNow - Date.now();
        proof.current = null;
        if (result.code === "A_OTP_EXPIRED") {
          setReceipt(null);
          setCode("");
        }
        setStatus(null);
        setMessage(messages[result.code]);
      }
    } catch {
      if (stillOwner()) {
        setStatus("uncertain");
        setCode("");
      }
    } finally { finish(); }
  }

  async function copy() {
    if (!storeKey || !stillOwner()) return;
    try {
      await navigator.clipboard.writeText(storeKey);
      if (stillOwner()) setCopyNotice("Đã sao chép Store Key.");
    } catch {
      if (stillOwner()) setCopyNotice("Không tự sao chép được. Bạn có thể chọn và sao chép key bên trên.");
    }
  }

  if (storeKey) return (
    <div className="grid min-w-0 gap-3 rounded-pos border border-pos-line bg-pos-surface p-4"
      data-testid="store-key-rotation-success">
      <p className="m-0 font-semibold">Đã đổi Store Key. Hãy sao chép key mới để ghép lại các máy.</p>
      <code aria-label="Store Key mới" className="select-all break-all rounded-pos bg-pos-surface2 p-3 text-sm">{storeKey}</code>
      <div className="flex flex-wrap gap-2">
        <Button variant="outlined" onClick={() => void copy()}>Sao chép</Button>
        <Button variant="contained" onClick={() => { if (stillOwner()) void pairing.pair(storeKey); }}>
          Dùng key mới trên máy này
        </Button>
      </div>
      {copyNotice && <p role="status" className="m-0 text-sm text-pos-muted">{copyNotice}</p>}
    </div>
  );

  if (status) return (
    <div className="grid min-w-0 justify-items-start gap-3 rounded-pos border border-pos-line bg-pos-surface p-4"
      data-testid="store-key-rotation-status">
      <p role="status" className="m-0 text-sm text-pos-ink">
        {status === "uncertain" ? "Chưa xác định kết quả đổi Store Key."
          : status === "pending" ? "Lượt đổi Store Key đang được xử lý." : "Lượt đổi Store Key đã tạo key mới."}
        {" Hãy kiểm tra email đã đăng ký để lấy key mới."}
      </p>
      {message && <p role="alert" className="m-0 text-sm text-pos-warning">{message}</p>}
      {(status === "pending" || status === "uncertain") && (proof.current || issueRequest.current) &&
        <Button variant="outlined" disabled={busy !== null}
          onClick={() => void (proof.current ? confirm(true) : issue(true))}>Kiểm tra lại</Button>}
    </div>
  );

  return (
    <form className="grid min-w-0 content-start gap-3 rounded-pos border border-pos-line bg-pos-surface p-4"
      onSubmit={(event) => { event.preventDefault(); void (receipt && wait ? confirm() : issue()); }}>
      <Alert severity="warning">
        Dùng khi bạn nghi Store Key đã lộ, chẳng hạn nhân viên đã nghỉ việc vẫn còn biết key.
        Sau khi đổi, key cũ không ghép thêm máy được. Mọi máy, kể cả máy này, sẽ phải ghép lại.
        Máy đang sử dụng có thể tiếp tục hoạt động đến khi phiên hiện tại hết hạn.
      </Alert>
      <TextField size="small" fullWidth label="Gõ lại tên quán" autoComplete="off" value={name}
        onChange={event => { setName(event.target.value); setMessage(""); issueRequest.current = null; }}
        disabled={!!receipt || busy !== null} inputProps={{ maxLength: 120, "data-testid": "rotation-store-name" }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outlined" disabled={!matchingName || !!wait || busy !== null}
          onClick={() => void issue()} data-testid="rotation-send-otp">
          {busy === "issue" ? "Đang gửi mã..." : receipt ? "Gửi lại mã" : "Gửi mã"}
        </Button>
        <span className="text-xs text-pos-muted">
          {wait ? `Có thể gửi lại sau ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}.`
            : "Mã được gửi tới email chủ quán đã đăng ký."}
        </span>
      </div>
      {receipt && <>
        <TextField size="small" fullWidth label="Mã xác nhận" autoComplete="one-time-code" value={code}
          onChange={event => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setMessage(""); proof.current = null; }}
          disabled={busy !== null || !wait}
          inputProps={{ inputMode: "numeric", maxLength: 6, "data-testid": "rotation-otp-input" }} />
        <Button type="submit" variant="contained" className="justify-self-start"
          disabled={busy !== null || !wait || !otpPattern.test(code)} data-testid="rotation-confirm">
          {busy === "confirm" ? "Đang xác nhận..." : "Tạo key mới"}
        </Button>
      </>}
      {message && <p role="alert" className="m-0 text-sm text-pos-warning">{message}</p>}
    </form>
  );
}
