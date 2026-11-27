import { Alert, Button, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { newOwnerRequestId } from "@/core/ownerCreateInput";
import { sessionHasPermission, usePermissionSession } from "@/features/shared/permissionSession";
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

export type RotationOtpReceipt = { id: string; deadline: number; storeName: string; timeOffset: number };

export function useRotationOtpRequest(scope: string | null) {
  const request = useRef<{ scope: string; input: RotationOtpRequest; inFlight: boolean } | null>(null);
  const [issuingScope, setIssuingScope] = useState<string | null>(null);

  useEffect(() => {
    if (request.current?.scope !== scope) request.current = null;
    setIssuingScope(current => current === scope ? current : null);
  }, [scope]);

  return {
    issuing: scope !== null && issuingScope === scope,
    begin(input: RotationOtpRequest) {
      if (!scope) return null;
      const previous = request.current?.scope === scope ? request.current : null;
      if (previous?.inFlight) return null;
      const next = previous?.input.storeName === input.storeName ? previous.input : input;
      request.current = { scope, input: next, inFlight: true };
      setIssuingScope(scope);
      return next;
    },
    finish(input: RotationOtpRequest, keepRequest: boolean) {
      if (request.current?.input !== input || request.current.scope !== scope) return false;
      request.current = keepRequest ? { ...request.current, inFlight: false } : null;
      setIssuingScope(null);
      return true;
    },
  };
}

type RotationViewStatus = RotationStatus | "uncertain";
type RotationOutcome = { kind: "key"; key: string } | { kind: "status"; status: RotationViewStatus };

export function useRotationResult(scope: string | null, isCurrentOwner: () => boolean) {
  const pending = useRef<{ scope: string } | null>(null);
  const [result, setResult] = useState<{ scope: string; outcome: RotationOutcome | null } | null>(null);

  useEffect(() => {
    setResult(current => current?.scope === scope ? current : null);
    return () => {
      if (pending.current?.scope === scope) pending.current = null;
    };
  }, [scope]);

  const scoped = result?.scope === scope ? result : null;
  return {
    outcome: scoped?.outcome ?? null,
    confirming: scoped !== null && scoped.outcome === null,
    clear() {
      pending.current = null;
      setResult(null);
    },
    begin() {
      if (!scope || !isCurrentOwner() || pending.current?.scope === scope) return null;
      const attempt = { scope };
      pending.current = attempt;
      setResult({ scope, outcome: null });
      return (outcome: RotationOutcome | null) => {
        if (pending.current !== attempt) return;
        pending.current = null;
        setResult(outcome && isCurrentOwner() ? { scope, outcome } : null);
      };
    },
  };
}

export function StoreKeyRotationPanel({ port, storeName, pendingOtp, setPendingOtp, otpRequest, rotationResult }: {
  port: IOwnerRecoveryPort;
  storeName: string;
  pendingOtp: RotationOtpReceipt | null;
  setPendingOtp: (receipt: RotationOtpReceipt | null) => void;
  otpRequest: ReturnType<typeof useRotationOtpRequest>;
  rotationResult: ReturnType<typeof useRotationResult>;
}) {
  const pairing = useRotatedStorePairing();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [attemptReceipt, setAttemptReceipt] = useState<RotationOtpReceipt | null>(null);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState<"issue" | "confirm" | null>(null);
  const [localStatus, setStatus] = useState<RotationViewStatus | null>(null);
  const [message, setMessage] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const issueRequest = useRef<RotationOtpRequest | null>(null);
  const proof = useRef<RotationConfirmation | null>(null);
  const timeOffset = useRef<number | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const generation = usePermissionSession(state => state.generation);
  const receipt = attemptReceipt ?? pendingOtp;
  const issuing = busy === "issue" || otpRequest.issuing;
  const { outcome, confirming } = rotationResult;
  const storeKey = outcome?.kind === "key" ? outcome.key : null;
  const status = localStatus ?? (outcome?.kind === "status" ? outcome.status : null);

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
    return mounted.current && state.generation === generation && state.bundle?.snapshot.role === "owner"
      && sessionHasPermission("settings.manage", state);
  };
  const enteredName = receipt?.storeName ?? name.trim();
  const matchingName = !!storeName.trim() && enteredName === storeName.trim();
  const wait = Math.max(0, Math.ceil(((receipt?.deadline ?? now) - now) / 1_000));
  const stamp = () => newOwnerRequestId(Date.now() + (timeOffset.current ?? receipt?.timeOffset ?? 0));
  function start(kind: "issue" | "confirm") {
    if (inFlight.current || confirming || !stillOwner()) return false;
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
    setAttemptReceipt(null);
    setPendingOtp(null);
    setStatus(null);
    if (error === "AUTH_REQUIRED") void pairing.requireStorePairing(notice);
    else pairing.requireEmployeePin(notice);
    return true;
  }

  async function issue(checkAgain = false) {
    if (issuing || (!checkAgain && (!matchingName || wait > 0)) || !start("issue")) return;
    const input = otpRequest.begin(issueRequest.current ?? { storeName: enteredName, requestId: stamp() });
    if (!input) { finish(); return; }
    issueRequest.current = input;
    let keepRequest = true;
    let issuedReceipt: RotationOtpReceipt | null = null;
    try {
      const result = await port.requestRotationOtp(input);
      keepRequest = result.kind === "status" || (result.kind === "error" && result.code === "A_SEND_UNAVAILABLE");
      if (result.kind === "receipt") {
        const receivedAt = Date.now();
        timeOffset.current = result.serverNow - receivedAt;
        issuedReceipt = { id: result.challengeRef, deadline: result.resendNotBefore - timeOffset.current,
          storeName: input.storeName, timeOffset: timeOffset.current };
        if (!stillOwner()) return;
        setNow(receivedAt);
        setAttemptReceipt(null);
        setCode("");
        proof.current = null;
        issueRequest.current = null;
      } else if (!stillOwner()) {
        return;
      } else if (result.kind === "status") {
        setStatus(result.status);
      } else if (!handleSessionError(result.code, false)) {
        if (result.serverNow !== undefined) timeOffset.current = result.serverNow - Date.now();
        if (result.code !== "A_SEND_UNAVAILABLE") issueRequest.current = null;
        setMessage(messages[result.code]);
      }
    } catch {
      if (stillOwner()) setMessage(messages.A_SEND_UNAVAILABLE);
    } finally {
      if (otpRequest.finish(input, keepRequest) && issuedReceipt) setPendingOtp(issuedReceipt);
      finish();
    }
  }

  async function confirm(checkAgain = false) {
    const input = proof.current ?? (receipt && matchingName && otpPattern.test(code)
      ? { storeName: enteredName, challengeRef: receipt.id, code, attemptId: stamp() } : null);
    if (!input || (!checkAgain && !wait) || !start("confirm")) return;
    const complete = rotationResult.begin();
    if (!complete) { finish(); return; }
    let outcome: RotationOutcome | null = null;
    proof.current = input;
    // Keep the OTP proof within this panel. The drawer can retain only the key
    // from the original successful response, scoped to this owner and store.
    setAttemptReceipt(receipt);
    setPendingOtp(null);
    try {
      const result = await port.confirmRotation(input);
      if (result.kind === "key") outcome = { kind: "key", key: result.storeKey };
      if (result.kind === "status") outcome = { kind: "status", status: result.status };
      if (result.kind === "uncertain" || (result.kind === "error" && result.code === "CREATE_VERIFY_UNAVAILABLE")) {
        outcome = { kind: "status", status: "uncertain" };
      }
      if (!stillOwner()) return;
      if (result.kind === "key") {
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
        setAttemptReceipt(null);
        if (result.code === "A_OTP_EXPIRED") {
          setName(enteredName);
          setCode("");
        } else if (receipt) {
          setPendingOtp({ ...receipt, timeOffset: timeOffset.current ?? receipt.timeOffset });
        }
        setStatus(null);
        setMessage(messages[result.code]);
      }
    } catch {
      outcome = { kind: "status", status: "uncertain" };
      if (stillOwner()) {
        setStatus("uncertain");
        setCode("");
      }
    } finally {
      complete(outcome);
      finish();
    }
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
      <TextField size="small" fullWidth label="Gõ lại tên quán" autoComplete="off" value={receipt?.storeName ?? name}
        onChange={event => { setName(event.target.value); setMessage(""); issueRequest.current = null; }}
        disabled={!!receipt || busy !== null || issuing || confirming} inputProps={{ maxLength: 120, "data-testid": "rotation-store-name" }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outlined" disabled={!matchingName || !!wait || busy !== null || issuing || confirming}
          onClick={() => void issue()} data-testid="rotation-send-otp">
          {issuing ? "Đang gửi mã..." : receipt ? "Gửi lại mã" : "Gửi mã"}
        </Button>
        <span className="text-xs text-pos-muted">
          {wait ? `Có thể gửi lại sau ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}.`
            : "Mã được gửi tới email chủ quán đã đăng ký."}
        </span>
      </div>
      {confirming && !receipt && <p role="status" className="m-0 text-sm text-pos-muted">Đang xác nhận mã.</p>}
      {receipt && <>
        <TextField size="small" fullWidth label="Mã xác nhận" autoComplete="one-time-code" value={code}
          onChange={event => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setMessage(""); proof.current = null; }}
          disabled={busy !== null || issuing || confirming || !wait}
          inputProps={{ inputMode: "numeric", maxLength: 6, "data-testid": "rotation-otp-input" }} />
        <Button type="submit" variant="contained" className="justify-self-start"
          disabled={busy !== null || issuing || confirming || !wait || !otpPattern.test(code)} data-testid="rotation-confirm">
          {busy === "confirm" ? "Đang xác nhận..." : "Tạo key mới"}
        </Button>
      </>}
      {message && <p role="alert" className="m-0 text-sm text-pos-warning">{message}</p>}
    </form>
  );
}
