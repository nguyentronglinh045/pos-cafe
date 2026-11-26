import { AppError } from "@/core/appError";
import type { IAuthRepo } from "@/ports";
import type { IOwnerRecoveryPort, RotationConfirmation, RotationOtpResult } from "@/ports/ownerRecovery";
import type { MockPermissionState } from "./permissionState";

/** Development fixture used by the rendered UI checks. It does not send mail. */
export function ownerRecoveryFixture(state: MockPermissionState, auth: IAuthRepo) {
  const otp = "540218";
  let receipt: Extract<RotationOtpResult, { kind: "receipt" }> | undefined;
  let latestKey: string | undefined;
  let accepted: RotationConfirmation | undefined;
  const pair = auth.pairStore.bind(auth);
  const guardedAuth: IAuthRepo = {
    async pairStore(key) {
      if (latestKey && key.trim().toUpperCase() !== latestKey) throw new AppError("AUTH_REQUIRED", "Store Key không đúng.");
      await pair(key);
    },
    getStoreSession: () => auth.getStoreSession(),
    unpairStore: () => auth.unpairStore(),
  };
  const port: IOwnerRecoveryPort = {
    async requestRotationOtp(input) {
      if (input.storeName !== state.business.settings.displayName) return { kind: "error", code: "STORE_NAME_MISMATCH" };
      const now = Date.now();
      if (!receipt || receipt.resendNotBefore <= now) {
        receipt = { kind: "receipt", challengeRef: crypto.randomUUID(), serverNow: now, resendNotBefore: now + 600_000 };
      }
      return receipt;
    },
    async confirmRotation(input) {
      if (input.attemptId === accepted?.attemptId) {
        return input.code === accepted.code && input.challengeRef === accepted.challengeRef
          ? { kind: "status", status: "completed" } : { kind: "error", code: "A_ATTEMPT_ID_REUSED" };
      }
      if (input.storeName !== state.business.settings.displayName) return { kind: "error", code: "STORE_NAME_MISMATCH" };
      if (input.challengeRef !== receipt?.challengeRef) return { kind: "error", code: "A_OTP_UNAVAILABLE" };
      if (Date.now() >= receipt.resendNotBefore) return { kind: "error", code: "A_OTP_EXPIRED" };
      if (input.code !== otp) return { kind: "error", code: "A_OTP_INVALID" };
      if (!state.business.session) return { kind: "error", code: "AUTH_REQUIRED" };
      latestKey = `${String(state.business.session.storeNo).padStart(4, "0")}-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;
      accepted = input;
      receipt = undefined;
      return { kind: "key", storeKey: latestKey };
    },
  };
  return { port, auth: guardedAuth };
}
