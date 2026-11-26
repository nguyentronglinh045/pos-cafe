import type { SupabaseClient } from "@supabase/supabase-js";
import type { IForgotStoreKeyPort, IOwnerRecoveryPort, RotationError, RotationStatus } from "@/ports/ownerRecovery";
import { employeeCredential } from "./employeeCredential";

const errors: readonly RotationError[] = [
  "AUTH_REQUIRED", "EMPLOYEE_SESSION_REQUIRED", "PIN_CHANGE_REQUIRED", "OWNER_ROLE_REQUIRED",
  "STORE_SUSPENDED", "STORE_NAME_MISMATCH", "A_REQUEST_INVALID", "A_REQUEST_ID_STALE",
  "A_REQUEST_ID_REUSED", "A_SEND_UNAVAILABLE", "A_ATTEMPT_ID_REUSED", "A_OTP_FORMAT_INVALID",
  "A_OTP_INVALID", "A_OTP_EXPIRED", "A_OTP_UNAVAILABLE", "A_OTP_ATTEMPTS_EXCEEDED",
  "CREATE_VERIFY_UNAVAILABLE",
];
const statuses: readonly RotationStatus[] = ["pending", "applied", "completed"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function createForgotStoreKeyPort(fetchImpl: typeof fetch = fetch): IForgotStoreKeyPort {
  return {
    async request(email) {
      try {
        const response = await fetchImpl("/api/owner-otp", {
          method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error",
          headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "forgotStoreKey", email }),
          signal: AbortSignal.timeout(18_000),
        });
        const body = fields(await response.json());
        if (response.status === 202 && body.ok === true) return "accepted";
        if (response.status === 400 && body.code === "A_EMAIL_INVALID") return "invalid_email";
      } catch { /* Gateway and transport errors share one UI state. */ }
      return "unavailable";
    },
  };
}

export function createOwnerRecoveryPort({ client, url, publicKey, fetchImpl = fetch }: {
  client: SupabaseClient; url: string; publicKey: string; fetchImpl?: typeof fetch;
}): IOwnerRecoveryPort {
  const endpoint = new URL("/functions/v1/owner-provisioning", url);
  async function invoke(action: "requestRotateStoreKeyOtp" | "verifyAndRotateStoreKey", input: object) {
    const credential = employeeCredential(client);
    const token = credential.token;
    const generation = credential.generation;
    const isCurrent = () => credential.generation === generation && credential.token === token;
    if (!token) return { body: { code: "EMPLOYEE_SESSION_REQUIRED" }, status: 401 };
    const { data, error } = await client.auth.getSession();
    const jwt = data.session?.access_token;
    if (error || !jwt) return { body: { code: "AUTH_REQUIRED" }, status: 401 };
    if (!isCurrent()) return { body: { code: "EMPLOYEE_SESSION_REQUIRED" }, status: 401 };
    const issue = action === "requestRotateStoreKeyOtp";
    const response = await fetchImpl(issue ? "/api/owner-otp" : endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", authorization: `Bearer ${jwt}`, "x-pos-employee-token": token,
        ...(!issue ? { apikey: publicKey } : {}) },
      body: JSON.stringify({ action, ...input }),
      signal: AbortSignal.timeout(issue ? 18_000 : 45_000),
    });
    const body = fields(await response.json());
    if (!isCurrent()) return { body: { code: "EMPLOYEE_SESSION_REQUIRED" }, status: 401 };
    return { body, status: response.status };
  }

  function denied(body: Record<string, unknown>, fallback: RotationError) {
    return { kind: "error" as const, code: errors.find((code) => code === body.code) ?? fallback,
      ...(typeof body.serverNow === "number" && Number.isFinite(body.serverNow) ? { serverNow: body.serverNow } : {}) };
  }

  return {
    async requestRotationOtp(input) {
      try {
        const { body, status } = await invoke("requestRotateStoreKeyOtp", input);
        const receipt = fields(body.receipt);
        if (status === 202 && body.ok === true && typeof receipt.challengeRef === "string" && uuid.test(receipt.challengeRef)
          && typeof receipt.serverNow === "number" && Number.isFinite(receipt.serverNow)
          && typeof receipt.resendNotBefore === "number" && Number.isFinite(receipt.resendNotBefore)
          && receipt.resendNotBefore >= receipt.serverNow) {
          return { kind: "receipt", challengeRef: receipt.challengeRef, serverNow: receipt.serverNow,
            resendNotBefore: receipt.resendNotBefore };
        }
        const rotation = statuses.find((entry) => entry === body.status);
        if (status === 200 && rotation) return { kind: "status", status: rotation };
        return denied(body, "A_SEND_UNAVAILABLE");
      } catch {
        return denied({}, "A_SEND_UNAVAILABLE");
      }
    },
    async confirmRotation(input) {
      try {
        const { body, status } = await invoke("verifyAndRotateStoreKey", input);
        const rotation = statuses.find((entry) => entry === body.status);
        if (status === 200 && rotation === "applied" && typeof body.storeKey === "string"
          && /^[0-9]{4,10}-[A-Z0-9]{32}$/.test(body.storeKey)) return { kind: "key", storeKey: body.storeKey };
        if ((status === 200 || status === 202) && rotation) return { kind: "status", status: rotation };
        if (!errors.some((entry) => entry === body.code)) return { kind: "uncertain" };
        return denied(body, "CREATE_VERIFY_UNAVAILABLE");
      } catch {
        return { kind: "uncertain" };
      }
    },
  };
}
