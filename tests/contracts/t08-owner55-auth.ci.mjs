import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire, registerHooks } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { rotationCandidateBinding } from "../../supabase/functions/owner-provisioning/rotation.ts";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function exerciseRotationAuthProbe({ origin, ttl, adminToken, anonToken, request, claim,
  refresh, checkRejectedRefresh }) {
  const storeNo = 20000 + randomBytes(2).readUInt16BE();
  const email = `store${storeNo}@store.pos.local`;
  const previous = randomBytes(16).toString("hex").toUpperCase();
  const candidate = randomBytes(16).toString("hex").toUpperCase();
  const created = await request("/admin/users", { email, password: previous, email_confirm: true }, { admin: true });
  check(created.status === 200 && typeof created.body?.id === "string", "Auth fixture creation failed.");
  const storeId = created.body.id;
  const rotationId = randomUUID();
  const attemptId = randomUUID();
  const dispatchToken = randomUUID();
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const aes = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv,
    additionalData: Buffer.from(rotationCandidateBinding(storeId, attemptId)) }, aes, Buffer.from(candidate));
  const offer = { id: rotationId, storeId, generation: "1", attempt: 1, dispatchToken,
    ciphertext: Buffer.concat([iv, Buffer.from(encrypted)]).toString("hex"), version: 1,
    acceptedAttemptId: attemptId, storeNo };
  const idleRpcs = new Set(["owner_sweep_mail", "owner_sweep_rotation_key_mail", "owner_claim_otp_mail",
    "owner_claim_store_key_mail", "owner_claim_rotation_otp_mail", "owner_claim_rotation_key_mail",
    "owner_claim_store_key_rotation_alert", "owner_next_initial_seed"]);
  const calls = [];
  let phase = "dispatch";
  let runToken;
  let probe;
  let bridgeError;

  function rpc(name, args, bearer) {
    if (name === "permission_get_store_session") {
      check(probe && bearer === `Bearer ${probe.body.access_token}`, "Lookup did not use the probe session.");
      calls.push("lookup");
      return { ok: true, data: { storeId, storeNo } };
    }
    check(bearer === `Bearer ${adminToken}`, "Worker RPC did not use service authorization.");
    if (idleRpcs.has(name)) return null;
    if (name === "owner_next_store_key_rotation") return phase === "completed" ? null : storeId;
    check(args.p_store === storeId, "Worker RPC lost its store identity.");
    if (name === "owner_claim_store_key_rotation") {
      check(phase !== "completed", "Worker claimed completed rotation.");
      runToken = randomUUID();
      return { ...offer, phase, runToken };
    }
    check(args.p_rotation === rotationId && args.p_generation === "1" && args.p_attempt === 1
      && args.p_dispatch === dispatchToken && args.p_run === runToken, "Worker RPC lost its dispatch identity.");
    if (name === "owner_report_store_key_rotation" && phase === "dispatch") {
      check(args.p_outcome === "ambiguous", "Lost Auth response was not reported as ambiguous.");
      phase = "probe";
      return { status: "recorded" };
    }
    if (name === "owner_report_store_key_rotation" && phase === "probe") {
      check(args.p_outcome === "confirmed", "Worker did not confirm the Auth probe.");
      phase = "publish";
      return { status: "confirmed" };
    }
    check(name === "owner_advance_store_key_rotation", "Unexpected worker RPC.");
    if (phase === "publish") {
      check(args.p_access_token_ttl_seconds === ttl, "Publish did not pass the configured TTL.");
      phase = "finish";
      return { status: "applied" };
    }
    check(phase === "finish" && args.p_access_token_ttl_seconds === null, "Unexpected finish checkpoint.");
    phase = "completed";
    return { status: "completed" };
  }

  const gateway = createServer(async (incoming, reply) => {
    try {
      const path = new URL(incoming.url, "http://127.0.0.1");
      const body = [];
      for await (const chunk of incoming) body.push(chunk);
      const payload = Buffer.concat(body);
      const bearer = incoming.headers.authorization;
      if (path.pathname.startsWith("/rest/v1/rpc/")) {
        const value = rpc(path.pathname.slice("/rest/v1/rpc/".length), JSON.parse(payload), bearer);
        reply.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(value));
        return;
      }

      const update = incoming.method === "PUT" && path.pathname === `/auth/v1/admin/users/${storeId}`;
      const passwordGrant = incoming.method === "POST" && path.pathname === "/auth/v1/token"
        && path.searchParams.get("grant_type") === "password";
      const logout = incoming.method === "POST" && path.pathname === "/auth/v1/logout";
      check(update || passwordGrant || logout, "Unexpected Auth transport.");
      if (logout) check(probe && bearer === `Bearer ${probe.body.access_token}`
        && path.searchParams.get("scope") === "local", "Logout did not target only the probe session.");
      const authReply = await fetch(origin + path.pathname.slice("/auth/v1".length) + path.search, {
        method: incoming.method, headers: { "content-type": "application/json", authorization: bearer },
        body: payload.length ? payload : undefined, redirect: "error", signal: AbortSignal.timeout(5_000),
      });
      const result = Buffer.from(await authReply.arrayBuffer());
      if (update) {
        check(authReply.status === 200 && JSON.parse(result).id === storeId, "GoTrue did not complete the update.");
        calls.push("update");
        // The isolated upstream has responded successfully. The Edge caller sees a lost response.
        reply.destroy();
        return;
      }
      if (passwordGrant) {
        probe = { status: authReply.status, body: JSON.parse(result) };
        check(probe.body.user?.id === storeId, "Password grant did not authenticate the fixture.");
        calls.push("password grant");
      } else {
        check(authReply.status === 204, "GoTrue did not accept local logout.");
        calls.push("local logout");
      }
      reply.writeHead(authReply.status, { "content-type": "application/json" }).end(result);
    } catch (error) {
      bridgeError ??= error instanceof Error ? error : new Error("Runner gateway failed.");
      reply.writeHead(500, { "content-type": "application/json" }).end("{}");
    }
  });
  gateway.listen(0, "127.0.0.1");
  await once(gateway, "listening");
  try {
    const sdk = createRequire(join(process.env.RUNNER_TEMP, "t08-auth-sdk", "package.json"));
    check(sdk("@supabase/supabase-js/package.json").version === "2.45.0", "Unexpected Edge SDK version.");
    const hooks = registerHooks({ resolve(specifier, context, next) {
      if (specifier === "npm:@supabase/supabase-js@2.45.0") {
        return next(pathToFileURL(sdk.resolve("@supabase/supabase-js")).href, context);
      }
      return next(specifier, context);
    } });
    let handler;
    const gatewayOrigin = `http://127.0.0.1:${gateway.address().port}`;
    const env = {
      SUPABASE_URL: gatewayOrigin, SUPABASE_SERVICE_ROLE_KEY: adminToken, SUPABASE_ANON_KEY: anonToken,
      POS_CAFE_STORE_ROTATION_ACCESS_TOKEN_TTL_SECONDS: String(ttl),
      POS_CAFE_OWNER_PROOF_KEY: key.toString("base64"), POS_CAFE_OTP_OUTBOX_KEY: key.toString("base64"),
      POS_CAFE_STORE_KEY_ENCRYPTION_KEY: key.toString("base64"), POS_CAFE_OTP_INGRESS_KEY: key.toString("base64"),
      POS_CAFE_OWNER_WORKER_KEY: key.toString("base64"),
    };
    globalThis.Deno = { env: { get: (name) => env[name] }, serve(value) { handler = value; } };
    try {
      await import("../../supabase/functions/owner-provisioning/index.ts");
    } finally {
      hooks.deregister();
      delete globalThis.Deno;
    }
    const work = async () => {
      const time = String(Date.now());
      const signature = createHmac("sha256", key).update(`owner-work-v1\n${time}`).digest("hex");
      const reply = await handler(new Request(gatewayOrigin, { method: "POST",
        headers: { "x-pos-cafe-time": time, "x-pos-cafe-worker-signature": signature },
        body: JSON.stringify({ action: "processOwnerWork" }),
      }));
      if (bridgeError) throw bridgeError;
      check(reply.status === 200 && (await reply.json()).ok === true, "Signed Edge worker failed.");
    };

    const login = (password) => request("/token?grant_type=password", { email, password });
    claim(await login(previous));
    await work();
    check(phase === "probe" && calls.join(",") === "update", "Dispatch did not recover as a single ambiguous update.");
    const old = await login(previous);
    check(old.status === 400 && old.body?.error_code === "invalid_credentials", "The old password still signed in.");
    const companion = await login(candidate);
    const companionId = claim(companion).session_id;
    await work();
    check(phase === "publish" && calls.join(",") === "update,password grant,lookup,local logout",
      "Unexpected Edge Auth calls after recovery.");
    check(claim(probe).session_id !== companionId, "Probe and companion sessions were not independent.");
    checkRejectedRefresh(await refresh(probe.body.refresh_token));
    check(claim(await refresh(companion.body.refresh_token)).session_id === companionId,
      "Local logout affected the independent companion session.");
    await work();
    await work();
    check(phase === "completed" && calls.join(",") === "update,password grant,lookup,local logout",
      "Database-only continuation produced additional Auth calls.");
    console.log("PASS TC-OWNER-55: one Admin update, one password grant, local logout HTTP 204, probe refresh denied, companion refresh accepted, no further Auth calls.");
  } finally {
    await new Promise((done) => gateway.close(done));
  }
}
