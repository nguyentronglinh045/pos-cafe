import type { CreateLookupStatus, CreateStoreOtpError, CreateVerifyError } from "../../domain/ownerCreate";

export function createStatusHttpCode(status: CreateLookupStatus | "closed", verify: boolean) {
  return verify && status === "accepted" ? 202 : 200;
}

export function createErrorHttpCode(code: CreateStoreOtpError | CreateVerifyError | "CONFIRM_REJECTED") {
  switch (code) {
    case "A_REQUEST_ID_REUSED":
    case "CREATE_INTENT_ID_REUSED":
    case "A_ATTEMPT_ID_REUSED":
    case "CREATE_INTENT_CONFLICT":
    case "OWNER_STORE_LIMIT_REACHED":
    case "CONFIRM_REJECTED":
      return 409;
    case "A_SEND_UNAVAILABLE":
    case "CREATE_VERIFY_UNAVAILABLE":
      return 503;
    default:
      return 400;
  }
}
