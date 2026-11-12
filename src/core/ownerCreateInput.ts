import type { OwnerCreateForm } from "../domain/ownerCreate";

export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ownerRequestIdTimestamp(id: string): number {
  return Number.parseInt(id.slice(0, 13).replace("-", ""), 16);
}

export function parseOwnerCreateForm(input: unknown):
  | { ok: true; form: OwnerCreateForm }
  | { ok: false; code: "A_EMAIL_INVALID" | "A_REQUEST_INVALID"; field: keyof OwnerCreateForm } {
  if (!input || typeof input !== "object") {
    return { ok: false, code: "A_REQUEST_INVALID", field: "displayName" };
  }
  const value = input as Record<string, unknown>;
  const rawEmail = typeof value.email === "string" ? value.email.trim() : "";
  const email = rawEmail.toLowerCase();
  const parts = email.split("@");
  const [local, domain] = parts;
  const localPattern = /^[a-z0-9.!#$%&'*+/=?^_\x60{|}~-]+$/;
  const labelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (!/^[\x21-\x7e]+$/.test(rawEmail) || parts.length !== 2 || email.length > 254 || local.length > 64 || !localPattern.test(local)
    || local.startsWith(".") || local.endsWith(".") || local.includes("..")
    || !domain.includes(".") || !domain.split(".").every(label => labelPattern.test(label))) {
    return { ok: false, code: "A_EMAIL_INVALID", field: "email" };
  }
  const displayName = typeof value.displayName === "string" ? value.displayName.trim() : "";
  if (!displayName || Array.from(displayName).length > 120) {
    return { ok: false, code: "A_REQUEST_INVALID", field: "displayName" };
  }
  const address = typeof value.address === "string" ? value.address.trim() : "";
  if ((value.address !== undefined && typeof value.address !== "string") || Array.from(address).length > 500) {
    return { ok: false, code: "A_REQUEST_INVALID", field: "address" };
  }
  if (typeof value.ownerPin !== "string" || !/^\d{6}$/.test(value.ownerPin)) {
    return { ok: false, code: "A_REQUEST_INVALID", field: "ownerPin" };
  }
  if (typeof value.seedDemo !== "boolean") {
    return { ok: false, code: "A_REQUEST_INVALID", field: "seedDemo" };
  }
  return { ok: true, form: { email, displayName, address, ownerPin: value.ownerPin, seedDemo: value.seedDemo } };
}

export function newOwnerRequestId(timestamp: number): string {
  const random = crypto.randomUUID();
  const time = Math.floor(timestamp).toString(16).padStart(12, "0");
  return `${time.slice(0, 8)}-${time.slice(8)}-7${random.slice(15)}`;
}

export function ownerCreateOtpMessage(code: string): string {
  switch (code) {
    case "A_EMAIL_INVALID": return "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.";
    case "A_REQUEST_INVALID":
    case "A_REQUEST_ID_REUSED":
    case "CREATE_INTENT_ID_REUSED":
      return "Yêu cầu không hợp lệ. Vui lòng tải lại trang rồi thử lại.";
    case "A_REQUEST_ID_STALE": return "Thời gian trên thiết bị chưa khớp. Vui lòng thử lại.";
    default: return "Chưa tiếp nhận được yêu cầu gửi mã. Vui lòng thử lại.";
  }
}
