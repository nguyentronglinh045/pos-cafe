import {
  createLookupErrors, createLookupStatuses, createOperationStatuses, createVerifyErrors,
  type ConfirmStoreKeyResponse, type CreateStoreOtpError, type CreateStoreOtpResponse,
  type GetCreateStatusResponse, type VerifyCreateResponse,
} from "@/domain/ownerCreate";
import type { IStoreProvisioningPort } from "@/ports/storeProvisioning";

const sendErrors: readonly CreateStoreOtpError[] = [
  "A_EMAIL_INVALID", "A_REQUEST_INVALID", "A_REQUEST_ID_STALE", "A_REQUEST_ID_REUSED",
  "CREATE_INTENT_ID_REUSED", "A_SEND_UNAVAILABLE",
];

type Options = { url: string; publicKey: string; fetchImpl?: typeof fetch };
type Fields = Record<string, unknown>;

const record = (value: unknown): Fields =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};

export function createOwnerProvisioningPort({ url, publicKey, fetchImpl = fetch }: Options): IStoreProvisioningPort {
  const endpoint = new URL("/functions/v1/owner-provisioning", url);
  const invoke = async (action: string, input: object): Promise<{ body: Fields; serverTime: number }> => {
    const issue = action === "requestCreateStoreOtp";
    try {
      const result = await fetchImpl(issue ? "/api/owner-otp" : endpoint, {
        method: "POST", headers: issue ? { "content-type": "application/json" }
          : { "content-type": "application/json", apikey: publicKey },
        body: JSON.stringify({ action, ...input }), cache: "no-store",
        signal: AbortSignal.timeout(issue ? 18_000 : 100_000),
      });
      const date = Date.parse(result.headers.get("date") ?? "");
      return { body: record(await result.json()), serverTime: Number.isFinite(date) ? date : Date.now() };
    } catch {
      return { body: { ok: false, code: issue ? "A_SEND_UNAVAILABLE" : "CREATE_VERIFY_UNAVAILABLE" },
        serverTime: Date.now() };
    }
  };

  return {
    async requestCreateStoreOtp(input) {
      const { body, serverTime } = await invoke("requestCreateStoreOtp", input);
      const receipt = record(body.receipt);
      let result: CreateStoreOtpResponse;
      if (body.ok === true && typeof receipt.challengeRef === "string" && typeof receipt.emailDisplay === "string"
        && typeof receipt.resendNotBefore === "number" && typeof receipt.serverNow === "number") {
        result = { ok: true, receipt: { challengeRef: receipt.challengeRef, emailDisplay: receipt.emailDisplay,
          resendNotBefore: receipt.resendNotBefore, serverNow: receipt.serverNow } };
      } else {
        const code = sendErrors.find((value) => value === body.code) ?? "A_SEND_UNAVAILABLE";
        result = { ok: false, code, ...(typeof body.serverNow === "number" ? { serverNow: body.serverNow } : {}) };
      }
      return { result, serverTime };
    },
    async verifyAndAcceptCreate(input): Promise<VerifyCreateResponse> {
      const { body } = await invoke("verifyAndAcceptCreate", input);
      const status = createOperationStatuses.find((value) => value === body.status);
      if (status === "created" && typeof body.storeNo === "number" && typeof body.storeKey === "string") {
        return { status, storeNo: body.storeNo, storeKey: body.storeKey };
      }
      if (status) return { status };
      const code = createVerifyErrors.find((value) => value === body.code) ?? "CREATE_VERIFY_UNAVAILABLE";
      if (code === "A_REQUEST_ID_STALE") {
        return typeof body.serverNow === "number" ? { ok: false, code, serverNow: body.serverNow }
          : { ok: false, code: "CREATE_VERIFY_UNAVAILABLE" };
      }
      return { ok: false, code };
    },
    async getCreateStatus(input): Promise<GetCreateStatusResponse> {
      const { body } = await invoke("getCreateStatus", input);
      const status = createLookupStatuses.find((value) => value === body.status);
      if (status) return { status };
      return { ok: false, code: createLookupErrors.find((value) => value === body.code) ?? "CREATE_VERIFY_UNAVAILABLE" };
    },
    async confirmStoreKeySaved(input): Promise<ConfirmStoreKeyResponse> {
      const { body } = await invoke("confirmStoreKeySaved", input);
      if (body.status === "closed") return { status: "closed" };
      return { ok: false, code: body.code === "CONFIRM_REJECTED" ? "CONFIRM_REJECTED"
        : createLookupErrors.find((value) => value === body.code) ?? "CREATE_VERIFY_UNAVAILABLE" };
    },
  };
}
