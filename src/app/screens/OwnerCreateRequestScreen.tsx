import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { newOwnerRequestId, ownerCreateOtpMessage, parseOwnerCreateForm } from "@/core/ownerCreateInput";
import type { CreateLookupStatus, CreateStoreOtpReceipt, OwnerCreateForm, RequestCreateStoreOtp } from "@/domain/ownerCreate";
import type { IStoreProvisioningPort } from "@/ports/storeProvisioning";
import { useAppStore } from "../useAppStore";
import { useOwnerCreateCloseout } from "./useOwnerCreateCloseout";

const blankForm: OwnerCreateForm = { email: "", displayName: "", address: "", seedDemo: false, ownerPin: "" };
const invalidInputMessage = {
  email: ownerCreateOtpMessage("A_EMAIL_INVALID"),
  displayName: "Tên quán phải có từ 1 đến 120 ký tự.",
  address: "Địa chỉ tối đa 500 ký tự.",
  ownerPin: "PIN chủ quán phải gồm đúng 6 chữ số từ 0 đến 9.",
  seedDemo: ownerCreateOtpMessage("A_REQUEST_INVALID"),
};

type SendAttempt = { input: RequestCreateStoreOtp; formKey: string };

const createStatusMessage: Record<CreateLookupStatus, string> = {
  accepted: "Đang tạo quán.",
  unknown: "Chưa xác định kết quả tạo quán. Vui lòng kiểm tra lại.",
  unconfirmed: "Chưa xác định kết quả tạo quán. Vui lòng kiểm tra lại.",
  created: "Đã tạo quán. Vui lòng kiểm tra email để tìm Store Key.",
  failed: "Không tạo được quán. Lượt tạo đã được hoàn lại, bạn có thể tạo lại bằng yêu cầu mới.",
  not_accepted: "Yêu cầu này chưa tạo quán. Bạn có thể bắt đầu lại.",
};

export function OwnerCreateRequestScreen({ port }: { port: IStoreProvisioningPort }) {
  const setScreen = useAppStore(state => state.setScreen);
  const [form, setForm] = useState(blankForm);
  const [receipt, setReceipt] = useState<CreateStoreOtpReceipt | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<keyof OwnerCreateForm>();
  const [code, setCode] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const closeout = useOwnerCreateCloseout(port);
  const intent = useRef<{ id: string; formKey: string } | null>(null);
  const retry = useRef<SendAttempt | null>(null);
  const sendingRef = useRef(false);
  const timeBasis = useRef<{ server: number; local: number } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const showingReceipt = receipt !== null;

  const serverNow = () => {
    const basis = timeBasis.current;
    return basis ? basis.server + performance.now() - basis.local : Date.now();
  };
  const rebase = (server: number) => { timeBasis.current = { server, local: performance.now() }; };
  useEffect(() => {
    if (!receipt) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((receipt.resendNotBefore - serverNow()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [receipt]);
  useEffect(() => {
    if (showingReceipt) heading.current?.focus();
  }, [showingReceipt]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current || (receipt && serverNow() < receipt.resendNotBefore)) return;
    const parsed = parseOwnerCreateForm(form);
    if (!parsed.ok) {
      setFieldError(parsed.field);
      setError(invalidInputMessage[parsed.field]);
      return;
    }
    const formKey = JSON.stringify(parsed.form);
    if (intent.current?.formKey !== formKey) intent.current = { id: crypto.randomUUID(), formKey };
    const freshAttempt = (): SendAttempt => ({
      input: { ...parsed.form, intentId: intent.current!.id, requestId: newOwnerRequestId(serverNow()) },
      formKey,
    });
    let attempt = retry.current?.formKey === formKey ? retry.current : freshAttempt();
    sendingRef.current = true;
    setSending(true);
    setError("");
    setFieldError(undefined);
    try {
      let response = await port.requestCreateStoreOtp(attempt.input);
      if (!response.result.ok && response.result.code === "A_REQUEST_ID_STALE") {
        timeBasis.current = { server: response.serverTime, local: performance.now() };
        attempt = freshAttempt();
        response = await port.requestCreateStoreOtp(attempt.input);
      }
      const { result, serverTime } = response;
      if (!result.ok) {
        retry.current = result.code === "A_SEND_UNAVAILABLE" ? attempt : null;
        setError(ownerCreateOtpMessage(result.code));
        return;
      }
      retry.current = null;
      rebase(serverTime);
      setSeconds(Math.max(0, Math.ceil((result.receipt.resendNotBefore - serverNow()) / 1000)));
      setReceipt(result.receipt);
      setCode("");
    } catch {
      retry.current = attempt;
      setError("Chưa nhận được phản hồi gửi mã. Vui lòng thử lại.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function confirmCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current || closeout.busy || !receipt || !intent.current) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Mã xác minh phải gồm đúng 6 chữ số từ 0 đến 9.");
      return;
    }
    const parsed = parseOwnerCreateForm(form);
    if (!parsed.ok) return;
    setError("");
    void closeout.verify({
      attemptId: newOwnerRequestId(serverNow()), intentId: intent.current.id, code, createInput: parsed.form,
    }, rebase);
  }

  function startAgain() {
    closeout.reset();
    setForm(blankForm);
    setReceipt(null);
    setSeconds(0);
    setCode("");
    setError("");
    setFieldError(undefined);
    intent.current = null;
    retry.current = null;
  }

  async function copyStoreKey() {
    if (!closeout.storeKey) return;
    try {
      await navigator.clipboard.writeText(closeout.storeKey);
      setCopyMessage("Đã sao chép Store Key.");
    } catch {
      setCopyMessage("Chưa sao chép được. Hãy chọn và sao chép Store Key bên trên.");
    }
  }

  const leaveLookup = (destination: "landing" | "storePairing") => {
    if (closeout.terminal) closeout.reset();
    setScreen(destination);
  };

  if (closeout.attemptId) return (
    <main className="box-border grid min-h-[100dvh] place-items-center bg-pos-bg p-4" data-testid="owner-create-closeout">
      <section className="grid w-[min(480px,100%)] gap-3 rounded-pos border border-pos-line bg-pos-surface p-5">
        <h1 className="m-0 text-xl">{closeout.storeKey ? "Đã tạo quán" : "Trạng thái tạo quán"}</h1>
        <p className="m-0 text-sm text-pos-muted">Giao diện tạm · Dữ liệu mock</p>
        {closeout.notice && <p role="alert" className="m-0 text-sm">{closeout.notice}</p>}
        {closeout.storeKey ? (
          <>
            <p className="m-0">Hãy sao chép và lưu Store Key để ghép thiết bị.</p>
            <code className="break-all" data-testid="owner-created-store-key">{closeout.storeKey}</code>
            <Button onClick={() => void copyStoreKey()} data-testid="owner-copy-store-key">Sao chép Store Key</Button>
            {copyMessage && <p role="status" className="m-0">{copyMessage}</p>}
            <Button variant="contained" disabled={closeout.busy}
              onClick={() => void closeout.confirmSaved(() => setScreen("storePairing"))}
              data-testid="owner-key-saved">Tôi đã lưu Store Key</Button>
          </>
        ) : (
          <>
            <p role="status" className="m-0" data-testid="owner-lookup-status">
              {closeout.busy ? "Đang kiểm tra yêu cầu…" : createStatusMessage[closeout.status ?? "unconfirmed"]}
            </p>
            {!closeout.terminal && <Button variant="contained" disabled={closeout.busy}
              onClick={() => void closeout.checkAgain()} data-testid="owner-check-status">Kiểm tra lại</Button>}
            {closeout.canRetryProof && (!closeout.terminal || closeout.status === "created") && (
              <Button disabled={closeout.busy} onClick={() => void closeout.retryProof(rebase)}>
                {closeout.status === "created" ? "Nhận lại Store Key" : "Thử lại xác minh"}
              </Button>
            )}
            {closeout.terminal && <Button onClick={startAgain} data-testid="owner-start-again">Bắt đầu lượt mới</Button>}
            <div className="flex flex-wrap gap-2">
              <Button disabled={closeout.busy} onClick={() => leaveLookup("landing")} data-testid="owner-lookup-home">Trang đầu</Button>
              <Button disabled={closeout.busy} onClick={() => leaveLookup("storePairing")} data-testid="owner-lookup-pair">Ghép thiết bị</Button>
            </div>
          </>
        )}
        {closeout.error && <p role="alert" className="m-0 text-sm text-red-700">{closeout.error}</p>}
      </section>
    </main>
  );

  return (
    <main className="box-border grid min-h-[100dvh] place-items-center bg-pos-bg p-4" data-testid="owner-create-request">
      <section className="grid w-[min(480px,100%)] gap-4 rounded-pos border border-pos-line bg-pos-surface p-5">
        <div>
          <button type="button" onClick={() => setScreen("landing")} disabled={sending}
            className="min-h-8 border-0 bg-transparent px-0 text-sm font-semibold text-pos-primary">
            Quay lại
          </button>
          <h1 ref={heading} tabIndex={-1} className="m-0 text-xl">{receipt ? "Xác minh email" : "Tạo quán mới"}</h1>
          <p className="mb-0 text-sm text-pos-muted">Giao diện tạm · Chỉ dùng dữ liệu giả.</p>
        </div>
        <form onSubmit={send} noValidate className="grid gap-4" autoComplete="off">
          {receipt ? (
            <div data-testid="owner-create-otp-receipt">
              <p className="m-0 break-all text-sm">{receipt.emailDisplay}</p>
              <p role="status">Nếu email hợp lệ, mã xác minh sẽ được gửi tới hộp thư. Mã có hiệu lực 10 phút.</p>
            </div>
          ) : (
            <>
              <TextField size="small" label="Email chủ quán" type="email" required disabled={sending}
                error={fieldError === "email"} value={form.email}
                inputProps={{ "data-testid": "owner-create-email" }}
                onChange={e => setForm({ ...form, email: e.target.value })} />
              <TextField size="small" label="Tên quán" required disabled={sending}
                error={fieldError === "displayName"} value={form.displayName}
                inputProps={{ "data-testid": "owner-create-name" }}
                onChange={e => setForm({ ...form, displayName: e.target.value })} />
              <TextField size="small" label="Địa chỉ (tùy chọn)" disabled={sending}
                error={fieldError === "address"} value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })} />
              <TextField size="small" label="PIN chủ quán" type="password" required disabled={sending}
                error={fieldError === "ownerPin"} value={form.ownerPin}
                inputProps={{ inputMode: "numeric", autoComplete: "new-password", "data-testid": "owner-create-pin" }}
                onChange={e => setForm({ ...form, ownerPin: e.target.value })} />
              <FormControlLabel label="Khởi tạo dữ liệu mẫu" control={
                <Checkbox size="small" checked={form.seedDemo} disabled={sending}
                  onChange={e => setForm({ ...form, seedDemo: e.target.checked })} />
              } />
            </>
          )}
          {(error || closeout.error) && <p role="alert" className="m-0 text-sm text-red-700">{error || closeout.error}</p>}
          <Button type="submit" variant="contained" disabled={sending || (!!receipt && seconds > 0)}
            data-testid="owner-create-send">
            {sending ? "Đang gửi…" : receipt ? (seconds ? `Gửi lại sau ${seconds} giây` : "Gửi lại") : "Gửi mã"}
          </Button>
        </form>
        {receipt && (
          <form onSubmit={confirmCode} className="grid gap-3" noValidate>
            {import.meta.env.DEV && import.meta.env.VITE_OWNER_CREATE_FIXTURE === "1" && (
              <p className="m-0 text-sm">Mã cho fixture local: <strong>012345</strong></p>
            )}
            <TextField size="small" label="Mã xác minh" value={code} disabled={sending}
              inputProps={{ inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6, "data-testid": "owner-create-otp" }}
              onChange={event => setCode(event.target.value)} />
            <Button type="submit" variant="contained" disabled={sending} data-testid="owner-create-verify">Xác nhận</Button>
          </form>
        )}
      </section>
    </main>
  );
}
