import { isIP } from "node:net";
import { rotationCandidateBinding, runStoreKeyRotation, type RotationAuth } from "./rotation.ts";

type Fields = Record<string, unknown>;
type Form = { email: string; displayName: string; address: string; seedDemo: boolean; ownerPin: string };
export type OwnerDependencies = {
  rpc(name: string, params?: Fields): Promise<unknown>;
  createAuth(input: { email: string; password: string; dispatchToken: string }): Promise<
    { kind: "created"; userId: string } | { kind: "no_effect" | "rejected" | "unknown" }
  >;
  sendMail(input: { to: string; subject: string; body: string; id: string }): Promise<MailOutcome>;
  hmacKey: CryptoKey;
  otpEncryptionKey: CryptoKey;
  storeEncryptionKey: CryptoKey | null;
  ingressKey: CryptoKey;
  workerKey: CryptoKey;
  clock(): number;
  forgotStoreKey?: boolean;
  rotation?: {
    auth: RotationAuth;
    accessTokenTtlSeconds: number;
    identifyStore?(jwt: string): Promise<string | null>;
    warn?(event: string, data: Fields): void;
  };
  schedule?(work: () => Promise<unknown>): void;
};
type MailOutcome = "submitted" | "rejected" | "failed_before_submit" | "unknown";
const text = new TextEncoder();
const decoder = new TextDecoder();
const uuid4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uuid7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const otpPattern = /^[0-9]{6}$/;
const statuses = ["accepted", "unknown", "created", "failed", "unconfirmed", "not_accepted"];
const errors = new Set([
  "A_EMAIL_INVALID", "A_REQUEST_INVALID", "A_REQUEST_ID_STALE", "A_REQUEST_ID_REUSED",
  "CREATE_INTENT_ID_REUSED", "A_SEND_UNAVAILABLE", "CREATE_VERIFY_UNAVAILABLE",
  "A_OTP_FORMAT_INVALID", "A_OTP_INVALID", "A_OTP_EXPIRED", "A_OTP_UNAVAILABLE",
  "A_OTP_ATTEMPTS_EXCEEDED", "A_ATTEMPT_ID_REUSED", "CREATE_INTENT_CONFLICT",
  "OWNER_STORE_LIMIT_REACHED", "CONFIRM_REJECTED",
  "AUTH_REQUIRED", "EMPLOYEE_SESSION_REQUIRED", "OWNER_ROLE_REQUIRED", "PIN_CHANGE_REQUIRED",
  "STORE_SUSPENDED", "STORE_NAME_MISMATCH",
]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-pos-employee-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { ...cors, "Cache-Control": "no-store" } });
}

function error(code: string, serverNow?: number): Response {
  const status = code === "AUTH_REQUIRED" || code === "EMPLOYEE_SESSION_REQUIRED" ? 401
    : ["OWNER_ROLE_REQUIRED","STORE_SUSPENDED","PIN_CHANGE_REQUIRED"].includes(code) ? 403
    : code.endsWith("_UNAVAILABLE") && !code.startsWith("A_OTP_") ? 503
    : ["A_REQUEST_ID_REUSED","CREATE_INTENT_ID_REUSED","A_ATTEMPT_ID_REUSED",
      "CREATE_INTENT_CONFLICT","OWNER_STORE_LIMIT_REACHED","CONFIRM_REJECTED"].includes(code) ? 409 : 400;
  return response({ ok: false, code, ...(serverNow === undefined ? {} : { serverNow }) }, status);
}

function record(value: unknown): Fields {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};
}

function emailOf(value: unknown): string | null {
  const rawEmail = typeof value === "string" ? value.trim() : "";
  const email = rawEmail.toLowerCase();
  const [local, domain, extra] = email.split("@");
  if (!/^[\x21-\x7e]+$/.test(rawEmail) || !local || !domain || extra !== undefined || email.length > 254 || local.length > 64
    || !/^[a-z0-9.!#$%&'*+/=?^_\x60{|}~-]+$/.test(local)
    || local.startsWith(".") || local.endsWith(".") || local.includes("..")
    || !domain.includes(".") || !domain.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return null;
  }
  return email;
}

function formOf(value: unknown): Form | "A_EMAIL_INVALID" | "A_REQUEST_INVALID" {
  const fields = record(value);
  const email = emailOf(fields.email);
  if (!email) return "A_EMAIL_INVALID";
  const displayName = typeof fields.displayName === "string" ? fields.displayName.trim() : "";
  const address = typeof fields.address === "string" ? fields.address.trim() : "";
  if (!displayName || [...displayName].length > 120 || [...address].length > 500
    || (fields.address !== undefined && typeof fields.address !== "string")
    || typeof fields.seedDemo !== "boolean"
    || typeof fields.ownerPin !== "string" || !otpPattern.test(fields.ownerPin)
    || displayName.includes("\0") || address.includes("\0")) return "A_REQUEST_INVALID";
  return { email, displayName, address, seedDemo: fields.seedDemo, ownerPin: fields.ownerPin };
}

function hex(value: ArrayBuffer | Uint8Array): string {
  return Array.from(value instanceof ArrayBuffer ? new Uint8Array(value) : value,
    (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array<ArrayBuffer> {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error("Invalid hexadecimal value");
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function hmac(key: CryptoKey, value: string): Promise<string> {
  return hex(await crypto.subtle.sign("HMAC", key, text.encode(value)));
}

async function encrypt(key: CryptoKey, plaintext: string, binding: string): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, additionalData: text.encode(binding) }, key, text.encode(plaintext),
  );
  return hex(nonce) + hex(ciphertext);
}

async function decrypt(key: CryptoKey, encoded: unknown, version: unknown, binding: string): Promise<string> {
  if (version !== 1 || typeof encoded !== "string") throw new Error("Unknown encryption envelope");
  const bytes = fromHex(encoded);
  return decoder.decode(await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.slice(0, 12), additionalData: text.encode(binding) }, key, bytes.slice(12),
  ));
}

function newOtp(): string {
  const random = new Uint32Array(1);
  const limit = Math.floor(2 ** 32 / 1_000_000) * 1_000_000;
  do crypto.getRandomValues(random); while (random[0] >= limit);
  return String(random[0] % 1_000_000).padStart(6, "0");
}

function newStoreSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  while (result.length < 32) {
    for (const byte of crypto.getRandomValues(new Uint8Array(40))) {
      if (byte < 252) result += alphabet[byte % alphabet.length];
      if (result.length === 32) break;
    }
  }
  return result;
}

export async function verifyIngress(request: Request, raw: string, deps: OwnerDependencies): Promise<string | null> {
  const ip = request.headers.get("x-pos-cafe-ip");
  const time = request.headers.get("x-pos-cafe-time");
  const signature = request.headers.get("x-pos-cafe-signature");
  if (!ip || !isIP(ip) || !time || !/^\d{13}$/.test(time) || Math.abs(Number(time) - deps.clock()) > 30_000
    || !signature || !/^[a-f0-9]{64}$/.test(signature)) return null;
  const bodyDigest = hex(await crypto.subtle.digest("SHA-256", text.encode(raw)));
  const valid = await crypto.subtle.verify("HMAC", deps.ingressKey, fromHex(signature),
    text.encode(`pos-cafe-otp-v1\n${time}\n${ip}\n${bodyDigest}`));
  return valid ? ip : null;
}

async function limitedBody(request: Request): Promise<string> {
  if (!request.body) throw new Error("Missing body");
  const reader = request.body.getReader();
  let bytes = 0;
  let result = "";
  const bodyDecoder = new TextDecoder("utf-8", { fatal: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return result + bodyDecoder.decode();
      bytes += value.byteLength;
      if (bytes > 8192) {
        await reader.cancel();
        throw new Error("Body limit");
      }
      result += bodyDecoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

function dbError(result: Fields, fallback: string): Response {
  const code = typeof result.code === "string" && errors.has(result.code) ? result.code : fallback;
  return error(code, typeof result.serverNow === "number" ? result.serverNow : undefined);
}

function validStoreNo(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 2147483647;
}

async function proof(deps: OwnerDependencies, intent: string, form: Form, code: string): Promise<Fields> {
  return {
    p_intent_id: intent,
    p_email: form.email,
    p_input_digest: "\\x" + await hmac(deps.hmacKey,
      JSON.stringify(["intent", intent, form.email, form.displayName, form.address, form.seedDemo, form.ownerPin])),
    p_otp_digest: "\\x" + await hmac(deps.hmacKey, JSON.stringify(["otp", intent, code])),
  };
}

async function provision(deps: OwnerDependencies, operationId: string, leaseToken: string): Promise<Fields> {
  const bound = { p_operation_id: operationId, p_lease_token: leaseToken };
  if (!deps.storeEncryptionKey) {
    const failed = record(await deps.rpc("owner_fail_create_missing_config", bound));
    return { status: failed.status === "failed" ? "failed" : "unknown" };
  }
  const secret = newStoreSecret();
  const encrypted = await encrypt(deps.storeEncryptionKey, secret, operationId);
  for (;;) {
    const claim = record(await deps.rpc("owner_claim_create_auth", {
      ...bound, p_secret_encrypted: "\\x" + encrypted, p_key_version: 1,
    }));
    if (typeof claim.dispatchToken !== "string" || typeof claim.email !== "string") {
      return { status: claim.status === "failed" ? "failed" : "unknown" };
    }
    const auth = await deps.createAuth({ email: claim.email, password: secret, dispatchToken: claim.dispatchToken })
      .catch(() => ({ kind: "unknown" as const }));
    const recorded = record(await deps.rpc("owner_record_create_auth", {
      ...bound, p_dispatch_token: claim.dispatchToken, p_result: auth.kind,
      p_auth_user_id: auth.kind === "created" ? auth.userId : null,
    }));
    if (recorded.status === "failed") return { status: "failed" };
    if (recorded.authResult === "created") break;
    if (recorded.authResult !== "no_effect") return { status: "unknown" };
    if (auth.kind === "no_effect") console.warn("owner_provisioning.auth_email_collision", { operationId });
  }
  const committed = record(await deps.rpc("owner_commit_created_store", bound));
  if (committed.status === "created" && validStoreNo(committed.storeNo)) {
    deps.schedule?.(() => processMail(deps, "store_key"));
    if (committed.seedRequested === true) deps.schedule?.(() => deps.rpc("owner_run_initial_seed", { p_operation_id: operationId }));
  }
  if (committed.status === "created" && validStoreNo(committed.storeNo)
    && await deps.rpc("owner_authorize_original_delivery", bound) === true) {
    return { status: "created", storeNo: committed.storeNo, storeKey: `${committed.storeNo}-${secret}` };
  }
  return { status: committed.status === "created" ? "created" : "unknown" };
}

async function processMail(deps: OwnerDependencies, kind: "otp" | "rotation_otp" | "store_key" | "rotation_key") {
  const isOtp = kind === "otp" || kind === "rotation_otp";
  const key = isOtp ? deps.otpEncryptionKey : deps.storeEncryptionKey;
  if (!key) return;
  const claim = record(await deps.rpc(`owner_claim_${kind}_mail`));
  if (claim.state !== "claimed") return;
  if (typeof claim.id !== "string" || typeof claim.claimToken !== "string" || typeof claim.email !== "string") return;
  const args = { p_id: claim.id, p_claim_token: claim.claimToken };
  let outcome: MailOutcome = "failed_before_submit";
  try {
    let subject: string;
    let body: string;
    if (isOtp) {
      const otp = await decrypt(key, claim.otpEncrypted, claim.otpEncryptionVersion,
        kind === "otp" ? JSON.stringify(["otp-mail", claim.challengeId, claim.email])
          : JSON.stringify(["rotation-otp-mail", claim.challengeId, claim.storeId]));
      if (!otpPattern.test(otp)) throw new Error("Invalid OTP envelope");
      subject = "POS Cafe - Ma xac nhan";
      const purpose = kind === "otp" ? "tạo quán" : "đổi Store Key";
      body = `Mã xác nhận ${purpose} của bạn là ${otp}. Mã có hiệu lực trong 10 phút kể từ lúc phát.`;
    } else if (kind === "store_key") {
      if (!validStoreNo(claim.storeNo) || typeof claim.operationId !== "string") throw new Error("Invalid store mail");
      const secret = await decrypt(key, claim.storeSecretEncrypted,
        claim.keyEncryptionVersion, claim.operationId);
      subject = "POS Cafe - Store Key";
      body = `${String(claim.displayName ?? "")}\n${String(claim.address ?? "")}\nStore Key: ${claim.storeNo}-${secret}`;
    } else {
      if (!validStoreNo(claim.storeNo) || typeof claim.storeId !== "string" || typeof claim.acceptedAttemptId !== "string"
        || typeof claim.generation !== "string" || typeof claim.appliedAt !== "string") throw new Error("Invalid rotation mail");
      const secret = await decrypt(key, claim.storeSecretEncrypted, claim.keyEncryptionVersion,
        rotationCandidateBinding(claim.storeId, claim.acceptedAttemptId));
      subject = "POS Cafe - Store Key";
      body = `Store Key: ${String(claim.storeNo).padStart(4, "0")}-${secret}\nPhiên bản key: ${claim.generation}\nĐổi lúc: ${claim.appliedAt}`;
    }
    const checkedAt = performance.now();
    const decision = await deps.rpc(`owner_authorize_${kind}_submit`, args);
    const permit = record(decision);
    const approved = kind === "store_key" ? decision === true
      : permit.allowed === true && (!isOtp || (typeof permit.serverNow === "number" && typeof permit.deadline === "number"
        && permit.deadline - permit.serverNow > performance.now() - checkedAt));
    if (approved) {
      if (kind === "rotation_key" && permit.warnSessions === true) {
        body += "\nViệc đổi key vẫn đang hoàn tất. Máy vừa ghép bằng key mới có thể phải ghép lại.";
      }
      outcome = "unknown";
      outcome = await deps.sendMail({ to: claim.email, subject, body, id: claim.id });
    }
  } finally {
    await deps.rpc(`owner_finish_${kind}_mail`, { ...args, p_status: outcome });
  }
}

async function processForgotKeyWork(deps: OwnerDependencies, cipher: CryptoKey) {
  for (let n = 0; n < 16; n++) {
    if (await deps.rpc("owner_prepare_forgot_key_mail") !== true) break;
  }
  for (let n = 0; n < 4; n++) {
    const started = performance.now();
    const claim = record(await deps.rpc("owner_claim_forgot_key_mail"));
    if (claim.state === "skipped") continue;
    if (claim.state !== "claimed" || typeof claim.id !== "string" || !uuid4.test(claim.id)
      || typeof claim.claimToken !== "string" || !uuid4.test(claim.claimToken)) break;
    const ids = { p_id: claim.id, p_claim_token: claim.claimToken };
    let outcome: MailOutcome = "failed_before_submit";
    try {
      const email = emailOf(claim.email);
      if (!email || !Array.isArray(claim.stores)) continue;
      const lines: string[] = [];
      for (const value of claim.stores) {
        const shop = record(value);
        if (!validStoreNo(shop.storeNo) || typeof shop.displayName !== "string" || typeof shop.address !== "string") continue;
        const initial = shop.generation === "0" && typeof shop.operationId === "string" && uuid.test(shop.operationId);
        const rotated = typeof shop.generation === "string" && /^[1-9]\d*$/.test(shop.generation)
          && typeof shop.storeId === "string" && uuid.test(shop.storeId)
          && typeof shop.acceptedAttemptId === "string" && uuid.test(shop.acceptedAttemptId);
        const binding = initial ? String(shop.operationId) : rotated
          ? rotationCandidateBinding(String(shop.storeId), String(shop.acceptedAttemptId)) : null;
        if (!binding) continue;
        const secret = await decrypt(cipher, shop.storeSecretEncrypted, shop.keyEncryptionVersion, binding).catch(() => null);
        if (!secret || !/^[A-Z0-9]{32}$/.test(secret)) continue;
        const number = initial ? String(shop.storeNo) : String(shop.storeNo).padStart(4, "0");
        lines.push([shop.displayName, shop.address, `Store Key: ${number}-${secret}`,
          ...(shop.warnSessions === true ? ["Việc đổi key vẫn đang hoàn tất. Máy vừa ghép bằng key mới có thể phải ghép lại."] : [])]
          .filter(Boolean).join("\n"));
      }
      // The SMTP transport has a 12-second deadline. Leave time inside the 60-second database claim.
      if (lines.length && performance.now() - started < 45_000) {
        outcome = "unknown";
        outcome = await deps.sendMail({ to: email, subject: "POS Cafe - Store Key",
          body: `${lines.join("\n\n")}\n\nNếu nghi hộp thư đã bị lộ, hãy dùng chức năng Đổi Store Key.`, id: claim.id });
      }
    } finally {
      await deps.rpc("owner_finish_forgot_key_mail", { ...ids, p_status: outcome });
    }
  }
}

function rotationWork(deps: OwnerDependencies, target?: string, expected?: string) {
  const config = deps.rotation;
  const cipher = deps.storeEncryptionKey;
  if (!config || !cipher) return Promise.resolve(null);
  return runStoreKeyRotation({
    rpc: (name, args) => deps.rpc(name, args),
    auth: config.auth, accessTokenTtlSeconds: config.accessTokenTtlSeconds,
    decryptCandidate: (encoded, version, binding) => decrypt(cipher, encoded, version, binding),
  }, target, expected);
}

async function reportRotationAlert(deps: OwnerDependencies) {
  const alert = record(await deps.rpc("owner_claim_store_key_rotation_alert"));
  if (typeof alert.id !== "string" || !uuid4.test(alert.id) ||
    typeof alert.claimToken !== "string" || !uuid4.test(alert.claimToken)) return;
  const warn = deps.rotation?.warn ?? ((event: string, data: Fields) => console.warn(event, data));
  if (typeof alert.mailId === "string" && uuid4.test(alert.mailId)) {
    const event = alert.mailKind === "forgot_store_key" ? "forgot_key_mail_needs_review" : "rotation_key_mail_needs_review";
    warn(`owner_provisioning.${event}`, { alertId: alert.id, mailId: alert.mailId });
  } else {
    if (typeof alert.rotationId !== "string" || !uuid4.test(alert.rotationId) ||
      typeof alert.storeId !== "string" || !uuid.test(alert.storeId) ||
      typeof alert.generation !== "string" || !/^[1-9]\d*$/.test(alert.generation) ||
      !["dispatch","probe","publish","finish"].includes(String(alert.phase)) ||
      !["transport_not_called","ambiguous","probe_failed","database_failed"].includes(String(alert.outcome))) return;
    warn("owner_provisioning.store_key_rotation_reconcile_failed",
      { alertId: alert.id, rotationId: alert.rotationId, storeId: alert.storeId,
        generation: alert.generation, phase: alert.phase, outcome: alert.outcome });
  }
  await deps.rpc("owner_finish_store_key_rotation_alert", { p_id: alert.id, p_claim_token: alert.claimToken });
}

async function handleRotation(deps: OwnerDependencies, request: Request, raw: string, input: Fields) {
  const issue = input.action === "requestRotateStoreKeyOtp";
  const jwt = request.headers.get("authorization")?.match(/^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/i)?.[1];
  const employeeToken = request.headers.get("x-pos-employee-token");
  const cipher = deps.storeEncryptionKey;
  if (!deps.rotation?.identifyStore || !cipher) return error(issue ? "A_SEND_UNAVAILABLE" : "CREATE_VERIFY_UNAVAILABLE");
  if (!jwt || jwt.length > 4096) return error("AUTH_REQUIRED");
  if (!employeeToken || !/^[A-Za-z0-9_-]{43}$/.test(employeeToken)) return error("EMPLOYEE_SESSION_REQUIRED");
  const name = typeof input.storeName === "string" ? input.storeName.trim() : "";
  if (!name || [...name].length > 120 || name.includes("\0")) return error("A_REQUEST_INVALID");
  const storeId = await deps.rotation.identifyStore(jwt);
  if (!storeId) return error("AUTH_REQUIRED");
  const common = {
    p_store: storeId, p_store_name: name,
    p_credential_hash: "\\x" + hex(await crypto.subtle.digest("SHA-256", text.encode(employeeToken))),
  };
  const digest = (challenge: string, otp: string) => hmac(deps.hmacKey,
    JSON.stringify(["rotation-otp", challenge, storeId, otp]));
  if (issue) {
    if (typeof input.requestId !== "string" || !uuid7.test(input.requestId)) return error("A_REQUEST_INVALID");
    const ip = await verifyIngress(request, raw, deps);
    if (!ip) return error("A_SEND_UNAVAILABLE");
    const challenge = crypto.randomUUID();
    const otp = newOtp();
    const result = record(await deps.rpc("owner_request_rotation_otp", {
      ...common, p_request_id: input.requestId, p_source_ip: ip, p_challenge_id: challenge,
      p_otp_digest: "\\x" + await digest(challenge, otp),
      p_otp_encrypted: "\\x" + await encrypt(deps.otpEncryptionKey, otp,
        JSON.stringify(["rotation-otp-mail", challenge, storeId])),
    }));
    if (result.status === "pending" || result.status === "applied" || result.status === "completed") {
      return response({ status: result.status });
    }
    if (typeof result.challengeRef !== "string" || typeof result.serverNow !== "number"
      || typeof result.resendNotBefore !== "number") return dbError(result, "A_SEND_UNAVAILABLE");
    if (result.dispatchNew === true) deps.schedule?.(() => processMail(deps, "rotation_otp"));
    return response({ ok: true, receipt: { challengeRef: result.challengeRef, serverNow: result.serverNow,
      resendNotBefore: result.resendNotBefore } }, 202);
  }
  if (typeof input.attemptId !== "string" || !uuid7.test(input.attemptId)
    || typeof input.challengeRef !== "string" || !uuid.test(input.challengeRef)) {
    return error("A_REQUEST_INVALID");
  }
  if (typeof input.code !== "string" || !otpPattern.test(input.code)) return error("A_OTP_FORMAT_INVALID");
  const candidate = newStoreSecret();
  const challenge = input.challengeRef.toLowerCase();
  const attempt = input.attemptId.toLowerCase();
  const result = record(await deps.rpc("owner_verify_rotation_otp", {
    ...common, p_attempt_id: attempt, p_challenge_id: challenge,
    p_otp_digest: "\\x" + await digest(challenge, input.code),
    p_ciphertext: "\\x" + await encrypt(cipher, candidate, rotationCandidateBinding(storeId, attempt)), p_version: 1,
  }));
  if (result.firstAcceptance === true && typeof result.rotationId === "string" && validStoreNo(result.storeNo)) {
    try {
      const dispatch = await rotationWork(deps, storeId, result.rotationId);
      if (dispatch === "confirmed" && await rotationWork(deps, storeId, result.rotationId) === "applied") {
        return response({ status: "applied", storeKey: `${String(result.storeNo).padStart(4, "0")}-${candidate}` });
      }
    } catch {
      // The committed rotation can be reconciled by the signed worker.
    }
    return response({ status: "pending" }, 202);
  }
  return result.status === "pending" || result.status === "applied" || result.status === "completed"
    ? response({ status: result.status }) : dbError(result, "CREATE_VERIFY_UNAVAILABLE");
}

export function makeOwnerHandler(deps: OwnerDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return response({ ok: false, code: "A_REQUEST_INVALID" }, 405);
    let raw: string;
    let input: Fields;
    try {
      raw = await limitedBody(request);
      input = record(JSON.parse(raw));
    } catch {
      return error("A_REQUEST_INVALID");
    }
    try {
      if (input.action === "processOwnerWork") {
        const time = request.headers.get("x-pos-cafe-time") ?? "";
        const signature = request.headers.get("x-pos-cafe-worker-signature") ?? "";
        const allowed = /^\d{13}$/.test(time) && Math.abs(Number(time) - deps.clock()) <= 30_000
          && /^[a-f0-9]{64}$/.test(signature)
          && await crypto.subtle.verify("HMAC", deps.workerKey, fromHex(signature), text.encode(`owner-work-v1\n${time}`));
        if (!allowed) return response({ ok: false }, 403);
        const expiredStoreKeyMails = await deps.rpc("owner_sweep_mail");
        if (deps.rotation) await deps.rpc("owner_sweep_rotation_key_mail");
        if (deps.forgotStoreKey) await deps.rpc("owner_sweep_forgot_key_mail");
        if (Array.isArray(expiredStoreKeyMails)) {
          for (const mailId of expiredStoreKeyMails) {
            if (typeof mailId === "string" && uuid4.test(mailId)) {
              console.warn("owner_provisioning.store_key_mail_claim_expired", { mailId });
            }
          }
        }
        const work: Promise<unknown>[] = [processMail(deps, "otp"), processMail(deps, "store_key")];
        if (deps.rotation && deps.storeEncryptionKey) {
          work.push(processMail(deps, "rotation_otp"), processMail(deps, "rotation_key"),
            rotationWork(deps).catch(() => console.warn("owner_provisioning.store_key_rotation_worker_unavailable")));
        }
        if (deps.forgotStoreKey && deps.storeEncryptionKey) work.push(processForgotKeyWork(deps, deps.storeEncryptionKey));
        await Promise.allSettled(work);
        if (deps.rotation || deps.forgotStoreKey) await reportRotationAlert(deps);
        const seed = await deps.rpc("owner_next_initial_seed");
        if (typeof seed === "string") await deps.rpc("owner_run_initial_seed", { p_operation_id: seed });
        return response({ ok: true });
      }

      if (input.action === "forgotStoreKey") {
        if (Object.keys(input).some((field) => field !== "action" && field !== "email")) return error("A_REQUEST_INVALID");
        const email = emailOf(input.email);
        if (!email) return error("A_EMAIL_INVALID");
        const ip = deps.forgotStoreKey && deps.storeEncryptionKey ? await verifyIngress(request, raw, deps) : null;
        if (!ip) return error("A_SEND_UNAVAILABLE");
        await deps.rpc("owner_enqueue_forgot_store_key", { p_email: email, p_source_ip: ip });
        return response({ ok: true }, 202);
      }

      if (input.action === "requestRotateStoreKeyOtp" || input.action === "verifyAndRotateStoreKey") {
        return await handleRotation(deps, request, raw, input);
      }
      if (input.action === "requestCreateStoreOtp") {
        if (typeof input.requestId !== "string" || !uuid7.test(input.requestId)
          || typeof input.intentId !== "string" || !uuid4.test(input.intentId)) return error("A_REQUEST_INVALID");
        const form = formOf(input);
        if (typeof form === "string") return error(form);
        const ip = await verifyIngress(request, raw, deps);
        if (!ip) return error("A_SEND_UNAVAILABLE");
        const intent = input.intentId.toLowerCase();
        const challengeId = crypto.randomUUID();
        const otp = newOtp();
        const result = record(await deps.rpc("owner_request_create_otp", {
          ...await proof(deps, intent, form, otp),
          p_request_id: input.requestId, p_source_ip: ip, p_challenge_id: challengeId,
          p_otp_encrypted: "\\x" + await encrypt(deps.otpEncryptionKey, otp,
            JSON.stringify(["otp-mail", challengeId, form.email])),
          p_otp_encryption_version: 1,
        }));
        if (result.ok === false) return dbError(result, "A_SEND_UNAVAILABLE");
        if (typeof result.challengeRef !== "string" || typeof result.serverNow !== "number"
          || typeof result.resendNotBefore !== "number") return error("A_SEND_UNAVAILABLE");
        if (result.dispatchNew === true) deps.schedule?.(() => processMail(deps, "otp"));
        return response({ ok: true, receipt: { challengeRef: result.challengeRef, serverNow: result.serverNow,
          resendNotBefore: result.resendNotBefore, emailDisplay: form.email } }, 202);
      }

      if (typeof input.attemptId !== "string" || !uuid7.test(input.attemptId)) return error("A_REQUEST_INVALID");
      if (input.action === "getCreateStatus") {
        if (Object.keys(input).some((key) => key !== "action" && key !== "attemptId")) return error("A_REQUEST_INVALID");
        const result = record(await deps.rpc("owner_get_create_status", { p_attempt_id: input.attemptId }));
        return typeof result.status === "string" && statuses.includes(result.status)
          ? response({ status: result.status }) : dbError(result, "CREATE_VERIFY_UNAVAILABLE");
      }
      if (input.action !== "verifyAndAcceptCreate" && input.action !== "confirmStoreKeySaved") return error("A_REQUEST_INVALID");
      if (typeof input.intentId !== "string" || !uuid4.test(input.intentId)) return error("A_REQUEST_INVALID");
      if (typeof input.code !== "string" || !otpPattern.test(input.code)) return error("A_OTP_FORMAT_INVALID");
      const form = formOf(input.createInput);
      if (typeof form === "string") return error("A_REQUEST_INVALID");
      const common = { ...await proof(deps, input.intentId.toLowerCase(), form, input.code), p_attempt_id: input.attemptId };
      if (input.action === "confirmStoreKeySaved") {
        const result = record(await deps.rpc("owner_confirm_key_saved", common));
        return result.status === "closed" ? response({ status: "closed" }) : dbError(result, "CREATE_VERIFY_UNAVAILABLE");
      }
      const result = record(await deps.rpc("owner_verify_create", {
        ...common, p_display_name: form.displayName, p_address: form.address,
        p_seed_demo: form.seedDemo, p_owner_pin: form.ownerPin,
      }));
      if (result.status === "accepted" && typeof result.operationId === "string" && typeof result.leaseToken === "string") {
        try {
          return response(await provision(deps, result.operationId, result.leaseToken));
        } catch {
          return response({ status: "unknown" });
        }
      }
      if (result.status === "created" && validStoreNo(result.storeNo) && typeof result.operationId === "string") {
        if (!deps.storeEncryptionKey) return error("CREATE_VERIFY_UNAVAILABLE");
        const secret = await decrypt(deps.storeEncryptionKey, result.storeSecretEncrypted,
          result.keyEncryptionVersion, result.operationId);
        return response({ status: "created", storeNo: result.storeNo, storeKey: `${result.storeNo}-${secret}` });
      }
      return typeof result.status === "string" && statuses.slice(0, 4).includes(result.status)
        ? response({ status: result.status }, result.status === "accepted" ? 202 : 200)
        : dbError(result, "CREATE_VERIFY_UNAVAILABLE");
    } catch {
      return error(input.action === "requestCreateStoreOtp" || input.action === "requestRotateStoreKeyOtp" || input.action === "forgotStoreKey"
        ? "A_SEND_UNAVAILABLE" : "CREATE_VERIFY_UNAVAILABLE");
    }
  };
}
