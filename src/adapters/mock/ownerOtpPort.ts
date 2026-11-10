import {
  createLookupErrors, createLookupStatuses, createOperationStatuses, createVerifyErrors,
  type CreateLookupStatus, type CreateStoreOtpResponse, type CreateVerifyError, type MockProvisionedStore,
} from "@/domain/ownerCreate";
import { AppError } from "@/core/appError";
import type { IStoreProvisioningPort } from "@/ports/storeProvisioning";
import { createErrorHttpCode, createStatusHttpCode } from "./ownerMockHttp";

async function post(route: string, input: object, successCodes: number[]) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 60_000);
  try {
    const response = await fetch(`/__pos_owner_mock/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: abort.signal,
    });
    const serverTime = Number(response.headers.get("X-POS-Mock-Now"));
    if (![...successCodes, 400, 409, 503].includes(response.status)
      || !Number.isSafeInteger(serverTime) || serverTime <= 0) {
      throw new Error("Mock provisioning endpoint unavailable");
    }
    return { data: await response.json() as unknown, httpStatus: response.status, serverTime };
  } finally {
    clearTimeout(timeout);
  }
}

function includes<T extends string>(values: readonly T[], candidate: unknown): candidate is T {
  return typeof candidate === "string" && values.some(value => value === candidate);
}

function readStatusReply<Status extends CreateLookupStatus | "closed", Code extends CreateVerifyError | "CONFIRM_REJECTED">(
  { data, httpStatus }: Awaited<ReturnType<typeof post>>,
  statuses: readonly Status[],
  errors: readonly Code[],
  verify = false,
) {
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    const fields = Object.keys(body).length;
    if (fields === 1 && includes(statuses, body.status) && createStatusHttpCode(body.status, verify) === httpStatus) {
      return { status: body.status };
    }
    if (body.ok === false && includes(errors, body.code) && createErrorHttpCode(body.code) === httpStatus) {
      if (body.code === "A_REQUEST_ID_STALE") {
        if (fields === 3 && typeof body.serverNow === "number" && Number.isSafeInteger(body.serverNow) && body.serverNow > 0) {
          return { ok: false as const, code: body.code as Extract<Code, "A_REQUEST_ID_STALE">, serverNow: body.serverNow };
        }
      } else if (fields === 2) {
        return { ok: false as const, code: body.code as Exclude<Code, "A_REQUEST_ID_STALE"> };
      }
    }
  }
  throw new Error("Invalid mock provisioning response");
}

export const mockOwnerOtpPort: IStoreProvisioningPort = {
  async requestCreateStoreOtp(input) {
    const { data, serverTime } = await post("request-otp", input, [202]);
    return { result: data as CreateStoreOtpResponse, serverTime };
  },
  async verifyAndAcceptCreate(input) {
    const reply = await post("verify", input, [200, 202]);
    const body = reply.data as Record<string, unknown> | null;
    if (reply.httpStatus === 200 && body?.status === "created" && Object.keys(body).length === 3
      && typeof body.storeNo === "number" && Number.isSafeInteger(body.storeNo) && body.storeNo > 0
      && typeof body.storeKey === "string" && /^\d+-[A-Z0-9]{32}$/.test(body.storeKey)
      && body.storeKey.startsWith(`${body.storeNo}-`)) {
      return { status: "created", storeNo: body.storeNo, storeKey: body.storeKey };
    }
    return readStatusReply(reply, createOperationStatuses, createVerifyErrors, true);
  },
  async getCreateStatus({ attemptId }) {
    return readStatusReply(await post("status", { attemptId }, [200]), createLookupStatuses, createLookupErrors);
  },
  async confirmStoreKeySaved(input) {
    return readStatusReply(await post("confirm-key", input, [200]), ["closed"], [...createLookupErrors, "CONFIRM_REJECTED"]);
  },
};

export async function pairMockOwnerStore(storeKey: string): Promise<MockProvisionedStore> {
  const { data, httpStatus } = await post("pair", { storeKey }, [200]);
  const store = (data as { store?: Partial<MockProvisionedStore> } | null)?.store;
  if (httpStatus !== 200 || !store || typeof store.storeId !== "string" || typeof store.storeNo !== "number"
    || typeof store.displayName !== "string" || typeof store.address !== "string" || typeof store.seedDemo !== "boolean") {
    throw new AppError("AUTH_REQUIRED", "Store Key không hợp lệ hoặc bản mock đã khởi động lại.");
  }
  return { storeId: store.storeId, storeNo: store.storeNo, displayName: store.displayName, address: store.address, seedDemo: store.seedDemo };
}

export async function checkMockOwnerPin(storeKey: string, pin: string): Promise<boolean> {
  const { data, httpStatus } = await post("owner-pin", { storeKey, pin }, [200]);
  return httpStatus === 200 && (data as { ok?: boolean } | null)?.ok === true;
}
