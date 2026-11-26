import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { classifyAuthCreateError } from "./auth-create-error.ts";
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

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function rotationConfig(): Parameters<typeof makeOwnerHandler>[0]["rotation"] {
  const configured = Deno.env.get("POS_CAFE_STORE_ROTATION_ACCESS_TOKEN_TTL_SECONDS");
  if (configured === undefined) return undefined;
  const accessTokenTtlSeconds = Number(configured);
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!anonKey || !/^[1-9]\d*$/.test(configured) || !Number.isSafeInteger(accessTokenTtlSeconds)
    || accessTokenTtlSeconds > 2147483647) throw new Error("Invalid store rotation configuration");
  const boundedFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, signal: AbortSignal.timeout(12_000), redirect: "error" });
  return {
    accessTokenTtlSeconds,
    async identifyStore(jwt) {
      const verifier = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: boundedFetch },
      });
      const result = await verifier.auth.getUser(jwt);
      return result.error ? null : result.data.user?.id ?? null;
    },
    auth: {
      async changePassword(storeId, password) {
        let sent = false;
        const writer = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (input, init) => {
            if (sent) return Promise.reject(new Error("Duplicate Auth transport prevented"));
            sent = true;
            return boundedFetch(input, init);
          } },
        });
        const { data, error } = await writer.auth.admin.updateUserById(storeId, { password });
        return !error && data.user?.id === storeId;
      },
      async verifyPassword(storeId, storeNo, password) {
        const isolated = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          global: { fetch: boundedFetch },
        });
        const { data, error } = await isolated.auth.signInWithPassword({
          email: `store${storeNo}@store.pos.local`, password,
        });
        const jwt = data.session?.access_token;
        if (!jwt) return false;
        let matches = false;
        let cleaned = false;
        try {
          if (!error && data.user?.id === storeId) {
            const store = await isolated.rpc("permission_get_store_session");
            matches = !store.error && store.data?.ok === true && store.data.data?.storeId === storeId
              && store.data.data?.storeNo === storeNo;
          }
        } finally {
          const result = await isolated.auth.admin.signOut(jwt, "local");
          cleaned = !result.error;
        }
        return matches && cleaned;
      },
    },
  };
}
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
    if (result.error) return { kind: classifyAuthCreateError(result.error) };
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
  forgotStoreKey: Deno.env.get("POS_CAFE_FORGOT_STORE_KEY_ENABLED") === "1",
  rotation: rotationConfig(),
  schedule(work) {
    edgeRuntime?.waitUntil(work().catch(() => undefined));
  },
});

Deno.serve(handler);
