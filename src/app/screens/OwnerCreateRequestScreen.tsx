import { Button, Checkbox, CircularProgress, FormControlLabel, TextField } from "@mui/material";
import {
  Ban, CheckCircle2, Clock, Copy, Database, HelpCircle, Home, KeyRound, Loader2, Mail, MailCheck,
  RefreshCw, ShieldCheck, Smartphone, Store, TriangleAlert, XCircle, type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { newOwnerRequestId, ownerCreateOtpMessage, parseOwnerCreateForm } from "@/core/ownerCreateInput";
import type { CreateLookupStatus, CreateStoreOtpReceipt, OwnerCreateForm, RequestCreateStoreOtp } from "@/domain/ownerCreate";
import type { IStoreProvisioningPort } from "@/ports/storeProvisioning";
import { useAppStore } from "../useAppStore";
import { AsideItem, FrameHeading, OwnerCreateFrame } from "./OwnerCreateFrame";
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

type Tone = "info" | "warning" | "success" | "danger" | "muted";
const statusView: Record<CreateLookupStatus, { title: string; tone: Tone; icon: LucideIcon }> = {
  accepted: { title: "Đang xử lý", tone: "info", icon: Clock },
  unknown: { title: "Chưa rõ kết quả", tone: "warning", icon: HelpCircle },
  unconfirmed: { title: "Chưa rõ kết quả", tone: "warning", icon: HelpCircle },
  created: { title: "Quán đã sẵn sàng", tone: "success", icon: MailCheck },
  failed: { title: "Tạo quán thất bại", tone: "danger", icon: XCircle },
  not_accepted: { title: "Chưa được chấp nhận", tone: "muted", icon: Ban },
};

const toneClass: Record<Tone, string> = {
  info: "border-pos-primaryLine bg-pos-primarySoft text-pos-primary",
  warning: "border-amber-200 bg-amber-50 text-pos-warning",
  success: "border-green-200 bg-green-50 text-pos-success",
  danger: "border-red-200 bg-red-50 text-pos-danger",
  muted: "border-pos-line bg-pos-surface2 text-pos-muted",
};

const fieldHint: Partial<Record<keyof OwnerCreateForm, string>> = {
  email: "Mã xác minh và Store Key sẽ được gửi tới địa chỉ này.",
  ownerPin: "6 chữ số, dùng để đăng nhập với vai trò chủ quán.",
};

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="m-0 flex items-start gap-2 rounded-pos border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-normal text-pos-danger">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="m-0 flex items-start gap-2 rounded-pos border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-normal text-pos-ink">
      <TriangleAlert size={16} className="mt-0.5 shrink-0 text-pos-warning" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

const buttonClass = "min-h-11";
const fieldSx = { "& .MuiInputBase-root": { minHeight: 44 } };
const otpSx = {
  "& .MuiInputBase-input": {
    textAlign: "center", fontFamily: "ui-monospace, Consolas, monospace", fontWeight: 700,
    fontSize: "clamp(22px, 4vw, 28px)", letterSpacing: "0.45em", paddingLeft: "0.45em",
  },
};

export function OwnerCreateRequestScreen({ port }: { port: IStoreProvisioningPort }) {
  const isMock = port.isMock === true;
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

  if (closeout.attemptId) {
    const view = closeout.status ? statusView[closeout.status] : statusView.unconfirmed;
    const StatusIcon = closeout.busy ? Loader2 : view.icon;
    const tone: Tone = closeout.busy ? "info" : view.tone;
    return (
      <OwnerCreateFrame testId="owner-create-closeout" step={3} isMock={isMock}
        aside={closeout.storeKey ? (
          <>
            <AsideItem icon={ShieldCheck} title="Lưu ở nơi an toàn">
              Dán vào trình quản lý mật khẩu hoặc ghi ra giấy và cất riêng. Không gửi Store Key qua nhóm chat chung.
            </AsideItem>
            <AsideItem icon={KeyRound} title="Chỉ hiện một lần">
              Tải lại trang chỉ tra được trạng thái, không hiện lại Store Key. Bản sao còn lại nằm trong email chủ quán.
            </AsideItem>
            <AsideItem icon={Smartphone} title="Dùng cho mọi thiết bị">
              Mỗi máy POS của quán ghép một lần bằng Store Key này.
            </AsideItem>
          </>
        ) : (
          <>
            {closeout.terminal ? (
              <AsideItem icon={KeyRound} title="Lượt tra đã có kết quả cuối">
                Rời màn hoặc bắt đầu lượt mới sẽ xóa mã tra của lượt này.
              </AsideItem>
            ) : (
              <AsideItem icon={KeyRound} title="Mã tra được giữ trên tab này">
                Khi chưa có kết quả cuối, bạn có thể về Trang đầu hoặc sang Ghép thiết bị. Mở lại Tạo quán mới sẽ tra đúng lượt cũ.
              </AsideItem>
            )}
            <AsideItem icon={RefreshCw} title="Tải lại không gửi lại yêu cầu">
              F5 chỉ đọc trạng thái của lượt đã xác nhận, không tạo thêm quán.
            </AsideItem>
            <AsideItem icon={Mail} title="Store Key nằm trong email">
              Khi quán đã tạo, kiểm tra hộp thư chủ quán để lấy Store Key.
            </AsideItem>
          </>
        )}>
        <FrameHeading title={closeout.storeKey ? "Đã tạo quán" : "Trạng thái tạo quán"}
          description={closeout.storeKey
            ? "Sao chép và lưu Store Key trước khi tiếp tục. Bạn cần mã này để ghép thiết bị."
            : "Kết quả của lượt tạo quán bạn vừa xác nhận."} />
        {closeout.notice && <NoticeBanner>{closeout.notice}</NoticeBanner>}
        {closeout.storeKey ? (
          <>
            <div className="grid gap-3 rounded-pos border border-pos-primaryLine bg-pos-primarySoft p-4">
              <div className="flex items-center gap-2 text-pos-success">
                <CheckCircle2 size={18} aria-hidden />
                <span className="text-xs font-bold uppercase tracking-[0.06em] text-pos-muted">Store Key</span>
              </div>
              <code className="break-all rounded-md border border-pos-line bg-pos-surface px-3 py-3 font-mono text-[clamp(16px,2.4vw,20px)] font-bold leading-snug tracking-[0.04em] text-pos-ink"
                data-testid="owner-created-store-key">{closeout.storeKey}</code>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Button variant="outlined" className={buttonClass} startIcon={<Copy size={16} aria-hidden />}
                  onClick={() => void copyStoreKey()} data-testid="owner-copy-store-key">Sao chép Store Key</Button>
                {copyMessage && <p role="status" className="m-0 text-sm text-pos-ink">{copyMessage}</p>}
              </div>
            </div>
            <p className="m-0 text-sm leading-normal text-pos-muted">
              Bấm nút dưới đây sau khi đã lưu. Màn Ghép thiết bị sẽ mở với ô Store Key trống để bạn tự dán mã.
            </p>
            <Button variant="contained" size="large" fullWidth className={buttonClass} disabled={closeout.busy}
              startIcon={closeout.busy ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={() => void closeout.confirmSaved(() => setScreen("storePairing"))}
              data-testid="owner-key-saved">Tôi đã lưu Store Key</Button>
          </>
        ) : (
          <>
            <div className={`flex items-start gap-3 rounded-pos border p-4 ${toneClass[tone]}`}>
              <StatusIcon size={22} className={`mt-0.5 shrink-0 ${closeout.busy ? "animate-spin" : ""}`} aria-hidden />
              <div className="grid gap-1">
                <strong className="text-base text-pos-ink">{closeout.busy ? "Đang kiểm tra" : view.title}</strong>
                <p role="status" className="m-0 text-sm leading-normal text-pos-ink" data-testid="owner-lookup-status">
                  {closeout.busy ? "Đang kiểm tra yêu cầu…" : createStatusMessage[closeout.status ?? "unconfirmed"]}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 [&>*]:flex-[1_1_180px]">
              {!closeout.terminal && <Button variant="contained" className={buttonClass} disabled={closeout.busy}
                startIcon={<RefreshCw size={16} aria-hidden />}
                onClick={() => void closeout.checkAgain()} data-testid="owner-check-status">Kiểm tra lại</Button>}
              {closeout.canRetryProof && (!closeout.terminal || closeout.status === "created") && (
                <Button variant="outlined" className={buttonClass} disabled={closeout.busy}
                  onClick={() => void closeout.retryProof(rebase)}>
                  {closeout.status === "created" ? "Nhận lại Store Key" : "Thử lại xác minh"}
                </Button>
              )}
              {closeout.terminal && <Button variant="contained" className={buttonClass} onClick={startAgain}
                data-testid="owner-start-again">Bắt đầu lượt mới</Button>}
            </div>
            <div className="grid gap-2 border-t border-pos-line pt-4">
              <p className="m-0 text-[13px] text-pos-muted">
                {closeout.terminal ? "Rời màn này sẽ kết thúc lượt tra." : "Rời màn vẫn giữ mã tra. Quay lại Tạo quán mới để xem tiếp."}
              </p>
              <div className="flex flex-wrap gap-2 [&>*]:flex-[1_1_160px]">
                <Button variant="outlined" color="inherit" className={buttonClass} disabled={closeout.busy}
                  startIcon={<Home size={16} aria-hidden />}
                  onClick={() => leaveLookup("landing")} data-testid="owner-lookup-home">Trang đầu</Button>
                <Button variant="outlined" color="inherit" className={buttonClass} disabled={closeout.busy}
                  startIcon={<Smartphone size={16} aria-hidden />}
                  onClick={() => leaveLookup("storePairing")} data-testid="owner-lookup-pair">Ghép thiết bị</Button>
              </div>
            </div>
          </>
        )}
        {closeout.error && <ErrorBanner>{closeout.error}</ErrorBanner>}
      </OwnerCreateFrame>
    );
  }

  const fieldMessage = (field: keyof OwnerCreateForm) => fieldError === field ? error : fieldHint[field];
  const fieldHelperProps = (field: keyof OwnerCreateForm) => fieldError === field ? { role: "alert" } : undefined;
  const generalError = fieldError ? "" : error || closeout.error;
  const showFixtureCode = isMock && import.meta.env.DEV && import.meta.env.VITE_OWNER_CREATE_FIXTURE === "1";

  return (
    <OwnerCreateFrame testId="owner-create-request" step={receipt ? 2 : 1} isMock={isMock}
      back={{ onClick: () => setScreen("landing"), disabled: sending }}
      aside={receipt ? (
        <>
          <AsideItem icon={Mail} title="Không thấy email?">
            Kiểm tra mục Thư rác hoặc Quảng cáo. Mã có hiệu lực 10 phút.
          </AsideItem>
          <AsideItem icon={Clock} title="Gửi lại có thời gian chờ">
            Nút Gửi lại mở khi hết đếm ngược theo giờ máy chủ.
          </AsideItem>
          <AsideItem icon={ShieldCheck} title="Nhập sai nhiều lần">
            Sau 5 lần sai, mã bị hủy và bạn cần yêu cầu mã mới.
          </AsideItem>
        </>
      ) : (
        <>
          <AsideItem icon={MailCheck} title="1 · Xác minh email">
            Gửi mã 6 số tới email chủ quán để xác nhận bạn là người tạo quán.
          </AsideItem>
          <AsideItem icon={KeyRound} title="2 · Nhận Store Key">
            Sau khi xác minh, quán được tạo và Store Key hiện một lần để bạn lưu.
          </AsideItem>
          <AsideItem icon={Store} title="3 · Ghép thiết bị">
            Dán Store Key vào từng máy POS, rồi đăng nhập bằng PIN chủ quán.
          </AsideItem>
          <p className="m-0 text-xs leading-normal text-pos-muted">Tải lại trang sẽ xóa thông tin đang nhập.</p>
        </>
      )}>
      <FrameHeading headingRef={heading} title={receipt ? "Xác minh email" : "Tạo quán mới"}
        description={receipt
          ? "Nhập mã 6 số vừa gửi tới email chủ quán."
          : isMock ? "Nhập thông tin quán và email chủ quán. Chỉ dùng dữ liệu giả."
          : "Nhập thông tin quán và email chủ quán."} />
      {/* In the verify state the send form is display:contents so the OTP form can sit
          between the receipt and the resend button without merging the two handlers. */}
      <div className="grid gap-4">
      <form onSubmit={send} noValidate className={receipt ? "contents" : "grid gap-4"} autoComplete="off">
        {receipt ? (
          <div className="order-1 grid gap-1 rounded-pos border border-pos-line bg-pos-surface2 px-4 py-3" data-testid="owner-create-otp-receipt">
            <span className="text-xs font-bold uppercase tracking-[0.06em] text-pos-muted">Đã gửi tới</span>
            <p className="m-0 break-all text-[15px] font-semibold text-pos-ink">{receipt.emailDisplay}</p>
            <p role="status" className="m-0 text-[13px] leading-normal text-pos-muted">Nếu email hợp lệ, mã xác minh sẽ được gửi tới hộp thư. Mã có hiệu lực 10 phút.</p>
          </div>
        ) : (
          <>
            <TextField size="small" sx={fieldSx} label="Email chủ quán" type="email" required disabled={sending} fullWidth
              error={fieldError === "email"} value={form.email}
              helperText={fieldMessage("email")} FormHelperTextProps={fieldHelperProps("email")}
              inputProps={{ "data-testid": "owner-create-email" }}
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <TextField size="small" sx={fieldSx} label="Tên quán" required disabled={sending} fullWidth
                error={fieldError === "displayName"} value={form.displayName}
                helperText={fieldMessage("displayName")} FormHelperTextProps={fieldHelperProps("displayName")}
                inputProps={{ "data-testid": "owner-create-name" }}
                onChange={e => setForm({ ...form, displayName: e.target.value })} />
              <TextField size="small" sx={fieldSx} label="Địa chỉ (tùy chọn)" disabled={sending} fullWidth
                error={fieldError === "address"} value={form.address}
                helperText={fieldMessage("address")} FormHelperTextProps={fieldHelperProps("address")}
                onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <TextField size="small" sx={fieldSx} label="PIN chủ quán" type="password" required disabled={sending} fullWidth
              error={fieldError === "ownerPin"} value={form.ownerPin}
              helperText={fieldMessage("ownerPin")} FormHelperTextProps={fieldHelperProps("ownerPin")}
              inputProps={{ inputMode: "numeric", autoComplete: "new-password", "data-testid": "owner-create-pin" }}
              onChange={e => setForm({ ...form, ownerPin: e.target.value })} />
            <div className={`rounded-pos border px-3 py-2 ${fieldError === "seedDemo" ? "border-red-300" : "border-pos-line"} bg-pos-surface2`}>
              <FormControlLabel className="m-0 items-start" label={
                <span className="grid gap-0.5 py-2 text-sm text-pos-ink">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Database size={15} className="text-pos-primary" aria-hidden />Khởi tạo dữ liệu mẫu
                  </span>
                  <span className="text-xs leading-normal text-pos-muted">Thêm vài món, sơ đồ bàn mẫu để thử nhanh. Bỏ trống nếu muốn quán trống.</span>
                </span>
              } control={
                <Checkbox size="small" checked={form.seedDemo} disabled={sending}
                  onChange={e => setForm({ ...form, seedDemo: e.target.checked })} />
              } />
              {fieldError === "seedDemo" && <p role="alert" className="m-0 pb-2 text-xs text-pos-danger">{error}</p>}
            </div>
          </>
        )}
        {generalError && <div className="order-3"><ErrorBanner>{generalError}</ErrorBanner></div>}
        <Button type="submit" variant={receipt ? "outlined" : "contained"} size="large" fullWidth className={`${buttonClass} order-4`}
          disabled={sending || (!!receipt && seconds > 0)}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : receipt && seconds > 0 ? <Clock size={16} aria-hidden /> : undefined}
          data-testid="owner-create-send">
          {sending ? "Đang gửi…" : receipt ? (seconds ? `Gửi lại sau ${seconds} giây` : "Gửi lại") : "Gửi mã"}
        </Button>
      </form>
      {receipt && (
        <form onSubmit={confirmCode} className="order-2 grid gap-3" noValidate>
          {showFixtureCode && (
            <p className="m-0 rounded-pos border border-dashed border-pos-line px-3 py-2 text-[13px] text-pos-muted">
              Xem thử local · Mã fixture: <strong className="font-mono text-pos-ink">012345</strong>
            </p>
          )}
          <TextField label="Mã xác minh" value={code} disabled={sending} fullWidth sx={otpSx}
            helperText="6 chữ số, có thể bắt đầu bằng số 0."
            inputProps={{ inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6, "data-testid": "owner-create-otp" }}
            onChange={event => setCode(event.target.value)} />
          <Button type="submit" variant="contained" size="large" fullWidth className={buttonClass} disabled={sending}
            data-testid="owner-create-verify">Xác nhận</Button>
        </form>
      )}
      </div>
    </OwnerCreateFrame>
  );
}
