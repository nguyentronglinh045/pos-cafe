export type RotationStatus = "pending" | "applied" | "completed";

export type RotationError =
  | "AUTH_REQUIRED" | "EMPLOYEE_SESSION_REQUIRED" | "PIN_CHANGE_REQUIRED" | "OWNER_ROLE_REQUIRED"
  | "STORE_SUSPENDED" | "STORE_NAME_MISMATCH" | "A_REQUEST_INVALID" | "A_REQUEST_ID_STALE"
  | "A_REQUEST_ID_REUSED" | "A_SEND_UNAVAILABLE" | "A_ATTEMPT_ID_REUSED" | "A_OTP_FORMAT_INVALID"
  | "A_OTP_INVALID" | "A_OTP_EXPIRED" | "A_OTP_UNAVAILABLE" | "A_OTP_ATTEMPTS_EXCEEDED"
  | "CREATE_VERIFY_UNAVAILABLE";

export type RotationOtpRequest = { storeName: string; requestId: string };
export type RotationConfirmation = { storeName: string; challengeRef: string; attemptId: string; code: string };
type Denied = { kind: "error"; code: RotationError; serverNow?: number };
type Status = { kind: "status"; status: RotationStatus };

export type RotationOtpResult =
  | { kind: "receipt"; challengeRef: string; serverNow: number; resendNotBefore: number }
  | Status | Denied;
export type RotationConfirmResult =
  | { kind: "key"; storeKey: string }
  | { kind: "uncertain" }
  | Status | Denied;

export interface IOwnerRecoveryPort {
  requestRotationOtp(input: RotationOtpRequest): Promise<RotationOtpResult>;
  confirmRotation(input: RotationConfirmation): Promise<RotationConfirmResult>;
}

export type ForgotStoreKeyAccepted = { kind: "accepted"; confirmReceipt?: () => Promise<void> };
export type ForgotStoreKeyResult = ForgotStoreKeyAccepted | { kind: "invalid_email" | "unavailable" };

export interface IForgotStoreKeyPort {
  request(email: string): Promise<ForgotStoreKeyResult>;
}
