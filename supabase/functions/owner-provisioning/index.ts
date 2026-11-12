import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { makeOwnerHandler } from "./handler.ts";
import { sendOwnerMail } from "./smtp.ts";

async function key(name: string, usage: "hmac" | "cipher") {
  const encoded = Deno.env.get(name);
  if (!encoded) throw new Error("Missing owner provisioning configuration");
  const raw = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  if (raw.byteLength !== 32) throw new Error("Invalid owner provisioning configuration");
  return usage === "hmac"
    ? await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
    : await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const edgeRuntime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(work: Promise<unknown>): void } }).EdgeRuntime;
const handler = makeOwnerHandler({
  async rpc(name, args) {
    const result = await service.rpc(name, args);
    if (result.error) throw new Error("Owner provisioning RPC unavailable");
    return result.data;
  },
  async createAuth({ email, password, dispatchToken }) {
    const result = await service.auth.admin.createUser({
      email, password, email_confirm: true, app_metadata: { pos_cafe_create_dispatch: dispatchToken },
    });
    if (result.error?.code === "email_exists") return { kind: "no_effect" };
    return result.data.user?.id ? { kind: "created", userId: result.data.user.id } : { kind: "unknown" };
  },
  sendMail(message) {
    return sendOwnerMail(Deno.env.get("POS_CAFE_SMTP_USER")?.trim() ?? "",
      (Deno.env.get("POS_CAFE_SMTP_APP_PASSWORD") ?? "").replace(/\s+/g, ""), message);
  },
  hmacKey: await key("POS_CAFE_OWNER_PROOF_KEY", "hmac"),
  otpEncryptionKey: await key("POS_CAFE_OTP_OUTBOX_KEY", "cipher"),
  storeEncryptionKey: await key("POS_CAFE_STORE_KEY_ENCRYPTION_KEY", "cipher"),
  ingressKey: await key("POS_CAFE_OTP_INGRESS_KEY", "hmac"),
  workerKey: await key("POS_CAFE_OWNER_WORKER_KEY", "hmac"),
  clock: Date.now,
  schedule(work) {
    edgeRuntime?.waitUntil(work().catch(() => undefined));
  },
});

Deno.serve(handler);
