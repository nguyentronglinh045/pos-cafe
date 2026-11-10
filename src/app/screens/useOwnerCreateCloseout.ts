import { useEffect, useRef, useState } from "react";
import { newOwnerRequestId, UUID_V7 } from "@/core/ownerCreateInput";
import type { CreateLookupStatus, CreateVerifyError, VerifyCreateInput } from "@/domain/ownerCreate";
import type { IStoreProvisioningPort } from "@/ports/storeProvisioning";

export const ownerCreateAttemptStorage = "pos.ownerCreate.attemptId";
let tabAttemptId: string | null = null;
const retryMessage = "Chưa xác nhận được kết quả. Vui lòng thử lại.";

export function restoreOwnerCreateAttempt() {
  if (tabAttemptId) return tabAttemptId;
  try {
    const stored = window.sessionStorage.getItem(ownerCreateAttemptStorage);
    if (stored && UUID_V7.test(stored)) return stored;
    if (stored !== null) window.sessionStorage.removeItem(ownerCreateAttemptStorage);
  } catch { /* A denied storage API leaves only the in-memory value. */ }
  return null;
}

const verifyMessage: Partial<Record<CreateVerifyError, string>> = {
  A_OTP_INVALID: "Mã xác minh không đúng. Vui lòng kiểm tra và nhập lại.",
  A_OTP_FORMAT_INVALID: "Mã xác minh phải gồm đúng 6 chữ số từ 0 đến 9.",
  A_OTP_EXPIRED: "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.",
  A_OTP_ATTEMPTS_EXCEEDED: "Mã xác minh đã bị hủy sau 5 lần nhập sai. Vui lòng yêu cầu mã mới khi hết thời gian chờ.",
  A_OTP_UNAVAILABLE: "Không thể xác minh mã này. Vui lòng yêu cầu mã mới khi hết thời gian chờ.",
  A_ATTEMPT_ID_REUSED: "Yêu cầu xác minh đã được dùng. Vui lòng nhập lại mã.",
  CREATE_INTENT_CONFLICT: "Thông tin tạo quán đã thay đổi. Hãy kiểm tra hoặc bắt đầu yêu cầu mới.",
  OWNER_STORE_LIMIT_REACHED: "Bạn đã có đủ 5 quán. Liên hệ nhà cung cấp nếu cần nới hạn mức.",
};

export function useOwnerCreateCloseout(port: IStoreProvisioningPort) {
  const [attemptId, setAttemptId] = useState(restoreOwnerCreateAttempt);
  const [status, setStatus] = useState<CreateLookupStatus | null>(null);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const latch = useRef(false);
  const proof = useRef<VerifyCreateInput | null>(null);
  const restored = useRef(attemptId);

  function record(id: string | null) {
    tabAttemptId = id;
    setAttemptId(id);
    try {
      if (id) window.sessionStorage.setItem(ownerCreateAttemptStorage, id);
      else window.sessionStorage.removeItem(ownerCreateAttemptStorage);
      setNotice("");
    } catch {
      if (id) setNotice("Chưa lưu được biên nhận trên thiết bị. Tải lại có thể làm mất bước đang thực hiện.");
    }
  }

  function reset() {
    record(null);
    proof.current = null;
    setStatus(null);
    setStoreKey(null);
    setError("");
    setNotice("");
  }

  async function run(action: () => Promise<void>) {
    if (latch.current) return;
    latch.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch {
      setError(retryMessage);
    } finally {
      latch.current = false;
      setBusy(false);
    }
  }

  const lookup = (id: string) => run(async () => {
    const result = await port.getCreateStatus({ attemptId: id });
    if ("status" in result) {
      setStatus(result.status);
    } else if (result.code === "A_REQUEST_INVALID") {
      reset();
    } else {
      setError(retryMessage);
    }
  });

  useEffect(() => {
    const id = restored.current;
    restored.current = null;
    if (id) void lookup(id);
    // Reload or a remount after navigation performs one read of the saved ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = (input: VerifyCreateInput, rebase: (serverTime: number) => void) => run(async () => {
    if (proof.current?.attemptId !== input.attemptId) {
      setStatus(null);
      record(input.attemptId);
    }
    proof.current = input;
    let result = await port.verifyAndAcceptCreate(input);
    if ("code" in result && result.code === "A_REQUEST_ID_STALE") {
      rebase(result.serverNow);
      const corrected = { ...input, attemptId: newOwnerRequestId(result.serverNow) };
      record(corrected.attemptId);
      proof.current = corrected;
      result = await port.verifyAndAcceptCreate(corrected);
    }
    if ("status" in result) {
      setStatus(result.status);
      setStoreKey("storeKey" in result ? result.storeKey : null);
      if (result.status === "created" && !("storeKey" in result)) proof.current = null;
    } else if (result.code === "CREATE_VERIFY_UNAVAILABLE") {
      setError(retryMessage);
    } else {
      reset();
      setError(verifyMessage[result.code] ?? "Yêu cầu xác minh không hợp lệ. Vui lòng thử lại.");
    }
  });

  const confirmSaved = (onClosed: () => void) => run(async () => {
    if (!proof.current) return;
    const result = await port.confirmStoreKeySaved(proof.current);
    if ("status" in result) {
      reset();
      onClosed();
    } else {
      setError(result.code === "CONFIRM_REJECTED"
        ? "Không xác nhận được. Kiểm tra lại mã và thông tin tạo quán."
        : retryMessage);
    }
  });

  return {
    attemptId, status, storeKey, busy, notice, error, reset,
    terminal: status === "created" || status === "failed" || status === "not_accepted",
    canRetryProof: !!proof.current,
    checkAgain: () => attemptId && lookup(attemptId),
    verify,
    retryProof: (rebase: (serverTime: number) => void) => proof.current && verify(proof.current, rebase),
    confirmSaved,
  };
}
