export type OwnerCreateForm = {
  email: string;
  displayName: string;
  address: string;
  seedDemo: boolean;
  ownerPin: string;
};

export type RequestCreateStoreOtp = OwnerCreateForm & {
  requestId: string;
  intentId: string;
};

export type CreateStoreOtpReceipt = {
  challengeRef: string;
  emailDisplay: string;
  resendNotBefore: number;
  serverNow: number;
};

export type CreateStoreOtpError =
  | "A_EMAIL_INVALID"
  | "A_REQUEST_INVALID"
  | "A_REQUEST_ID_STALE"
  | "A_REQUEST_ID_REUSED"
  | "CREATE_INTENT_ID_REUSED"
  | "A_SEND_UNAVAILABLE";

export type CreateStoreOtpResponse =
  | { ok: true; receipt: CreateStoreOtpReceipt }
  | { ok: false; code: CreateStoreOtpError; serverNow?: number };

export type GetCreateStatusInput = { attemptId: string };

export type VerifyCreateInput = GetCreateStatusInput & {
  intentId: string;
  code: string;
  createInput: OwnerCreateForm;
};

export const createOperationStatuses = ["accepted", "unknown", "created", "failed"] as const;
export const createLookupStatuses = [...createOperationStatuses, "unconfirmed", "not_accepted"] as const;
export type CreateOperationStatus = typeof createOperationStatuses[number];
export type CreateLookupStatus = typeof createLookupStatuses[number];

export const createLookupErrors = ["A_REQUEST_INVALID", "CREATE_VERIFY_UNAVAILABLE"] as const;
export const createVerifyErrors = [
  ...createLookupErrors, "A_OTP_FORMAT_INVALID", "A_OTP_INVALID", "A_OTP_EXPIRED",
  "A_OTP_ATTEMPTS_EXCEEDED", "A_OTP_UNAVAILABLE", "A_ATTEMPT_ID_REUSED",
  "CREATE_INTENT_CONFLICT", "OWNER_STORE_LIMIT_REACHED", "A_REQUEST_ID_STALE",
] as const;
export type CreateLookupError = typeof createLookupErrors[number];
export type CreateVerifyError = typeof createVerifyErrors[number];

export type VerifyCreateResponse =
  | { status: CreateOperationStatus }
  | { status: "created"; storeNo: number; storeKey: string }
  | { ok: false; code: Exclude<CreateVerifyError, "A_REQUEST_ID_STALE"> }
  | { ok: false; code: "A_REQUEST_ID_STALE"; serverNow: number };

export type GetCreateStatusResponse = { status: CreateLookupStatus } | { ok: false; code: CreateLookupError };

export type ConfirmStoreKeyResponse =
  | { status: "closed" }
  | { ok: false; code: CreateLookupError | "CONFIRM_REJECTED" };

export type MockProvisionedStore = {
  storeId: string; storeNo: number; displayName: string; address: string; seedDemo: boolean;
};
