import pg from "npm:pg@8.23.0";
import { classifyAuthCreateError } from "./auth-create-error.ts";
import { makeOwnerHandler, type OwnerDependencies } from "./handler.ts";

const encoder = new TextEncoder();
const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes),
  (byte) => byte.toString(16).padStart(2, "0")).join("");

function idAt(time: number) {
  const stamp = time.toString(16).padStart(12, "0");
  return `${stamp.slice(0, 8)}-${stamp.slice(8)}-7${crypto.randomUUID().slice(15)}`;
}

function same(actual: unknown, expected: unknown, description: string) {
  if (actual !== expected) throw new Error(description);
}

async function hmacKey() {
  return await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

Deno.test("TC-OWNER-29(b): only confirmed Admin API refusals release the seat", () => {
  same(classifyAuthCreateError({ status: 403, code: "not_admin" }), "rejected", "Admin API denied before create");
  same(classifyAuthCreateError({ status: 422, code: "weak_password" }), "rejected", "password rejected before create");
  same(classifyAuthCreateError({ status: 422, code: "email_exists" }), "no_effect", "collision needs DB corroboration");
  for (const error of [{}, { status: 504 }, { status: 503, code: "not_admin" }, { status: 403 },
    { status: 422, code: "validation_failed" }]) {
    same(classifyAuthCreateError(error), "unknown", "unproved outcome must keep the seat");
  }
});

Deno.test("signed OTP request through PostgreSQL, fake SMTP/Auth, create store and audit seed", async (test) => {
  const connectionString = Deno.env.get("POS_CAFE_T06_TEST_DSN");
  if (!connectionString) throw new Error("Set POS_CAFE_T06_TEST_DSN to the local fixture");
  const target = new URL(connectionString);
  if (target.protocol !== "postgresql:" || target.hostname !== "127.0.0.1" ||
    target.search || target.hash || !/^\/pos_cafe_t06_contract(?:_[a-z0-9]+)?$/.test(target.pathname)) {
    throw new Error("T06 contract fixture must be local and dedicated");
  }
  const db = new pg.Client({ connectionString });
  await db.connect();
  try {
    await db.query("begin");
    const smtp: { to: string; subject: string; body: string; id: string }[] = [];
    let createAuthCalls = 0;
    let beforeAuthClaim: ((id: string) => Promise<void>) | undefined;
    const deps: OwnerDependencies = {
      async rpc(name, values = {}) {
        if (!/^owner_[a-z_]+$/.test(name) || Object.keys(values).some((key) => !/^p_[a-z_]+$/.test(key))) {
          throw new Error("Unexpected T06 test RPC");
        }
        if (name === "owner_claim_create_auth") await beforeAuthClaim?.(String(values.p_operation_id));
        const fields = Object.keys(values).map((key, index) => `${key} => $${index + 1}`).join(",");
        const result = await db.query(`select public.${name}(${fields}) as value`, Object.values(values));
        return result.rows[0].value;
      },
      async createAuth({ email, password, dispatchToken }) {
        createAuthCalls += 1;
        const id = crypto.randomUUID();
        if (!/^[A-Z0-9]{32}$/.test(password)) throw new Error("Unexpected technical secret format");
        await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)", [
          id, email, JSON.stringify({ pos_cafe_create_dispatch: dispatchToken }),
        ]);
        return { kind: "created", userId: id };
      },
      sendMail(message) {
        smtp.push(message);
        return Promise.resolve("submitted");
      },
      hmacKey: await hmacKey(),
      otpEncryptionKey: await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt","decrypt"]),
      storeEncryptionKey: await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt","decrypt"]),
      ingressKey: await hmacKey(),
      workerKey: await hmacKey(),
      clock: Date.now,
    };
    const handle = makeOwnerHandler(deps);
    async function call(value: object, headers: Record<string,string> = {}) {
      const result = await handle(new Request("http://127.0.0.1/owner", { method: "POST",
        headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(value) }));
      same(result.headers.get("cache-control"), "no-store", "response cache policy");
      return { status: result.status, body: await result.json() };
    }
    async function work() {
      const time = String(Date.now());
      const signature = toHex(await crypto.subtle.sign("HMAC", deps.workerKey, encoder.encode(`owner-work-v1\n${time}`)));
      return await call({ action: "processOwnerWork" }, { "x-pos-cafe-time": time, "x-pos-cafe-worker-signature": signature });
    }

    const form = { email: `test+${crypto.randomUUID()}@invalid.test`, displayName: "Quán kiểm thử",
      address: "Địa chỉ thử", seedDemo: true, ownerPin: "123456" };
    const intentId = crypto.randomUUID();
    const request = { action: "requestCreateStoreOtp", ...form, intentId, requestId: idAt(Date.now()) };
    same((await call(request, { "x-forwarded-for": "192.0.2.1" })).body.code, "A_SEND_UNAVAILABLE", "unsigned IP rejected");
    same((await call({ action: "processOwnerWork" })).status, 403, "worker authentication");
    async function signIssue(input: object) {
      const time = String(Date.now());
      const ip = "192.0.2.35";
      const digest = toHex(await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(input))));
      const signature = toHex(await crypto.subtle.sign("HMAC", deps.ingressKey,
        encoder.encode(`pos-cafe-otp-v1\n${time}\n${ip}\n${digest}`)));
      return { "x-pos-cafe-ip": ip, "x-pos-cafe-time": time, "x-pos-cafe-signature": signature };
    }
    const ingress = await signIssue(request);
    const first = await call(request, ingress);
    same(first.status, 202, "signed request");
    same((await call({ ...request, ownerPin: "654321" }, ingress)).status, 503, "signature binds payload");
    same((await call(request, ingress)).body.receipt.challengeRef, first.body.receipt.challengeRef, "issuance replay");
    await work();
    same(smtp.length, 1, "one OTP email after worker scan");
    same(smtp[0].to, form.email, "OTP recipient");
    const code = smtp[0].body.match(/\b[0-9]{6}\b/)?.[0];
    if (!code) throw new Error("OTP mail format");
    const attemptId = idAt(Date.now());
    const created = await call({ action: "verifyAndAcceptCreate", attemptId, intentId, code, createInput: form });
    same(created.body.status, "created", "original call created");
    if (!/^[1-9][0-9]*-[A-Z0-9]{32}$/.test(created.body.storeKey)) throw new Error("original key missing");
    const status = await call({ action: "getCreateStatus", attemptId });
    same(JSON.stringify(status.body), '{"status":"created"}', "status does not disclose the key");
    const replay = await call({ action: "verifyAndAcceptCreate", attemptId, intentId, code, createInput: form });
    same(replay.body.storeKey, created.body.storeKey, "proof replay within window");
    const saved = await call({ action: "confirmStoreKeySaved", attemptId, intentId, code, createInput: form });
    same(saved.body.status, "closed", "key closeout");
    const after = await call({ action: "verifyAndAcceptCreate", attemptId, intentId, code, createInput: form });
    same(JSON.stringify(after.body), '{"status":"created"}', "closed proof yields status only");
    const pending = (await db.query(
      "select s.id, e.id as employee_id from public.stores s join public.employees e on e.store_id=s.id " +
      "where s.store_no=$1 and e.role='owner'", [created.body.storeNo],
    )).rows[0];
    await db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: pending.id, role: "authenticated" })]);
    await db.query("set local role authenticated");
    const pendingSession = (await db.query("select public.permission_start_session($1,$2) as value", [pending.employee_id, form.ownerPin])).rows[0].value;
    await db.query("select set_config('request.headers',$1,true)", [JSON.stringify({ "x-pos-employee-token": pendingSession.token })]);
    same(JSON.stringify((await db.query("select public.owner_get_seed_readiness() as value")).rows[0].value.data),
      '{"status":"waiting"}', "pending seed exposes a minimal readiness state");
    same((await db.query("select public.owner_retry_initial_seed() as value")).rows[0].value.error.code,
      "INITIAL_SEED_NOT_READY", "retry cannot race an unresolved seed");
    same((await db.query("select public.owner_skip_initial_seed() as value")).rows[0].value.error.code,
      "INITIAL_SEED_NOT_READY", "skip cannot race an unresolved seed");
    same((await db.query("select public.permission_get_pos_menu() as value")).rows[0].value.error.code,
      "INITIAL_SEED_NOT_READY", "pending seed blocks business data");
    await db.query("reset role");
    await test.step("TC-OWNER-44(c): one warning for an expired Store Key claim and no resend", async () => {
      await db.query("savepoint store_key_timeout");
      const originalWarn = console.warn;
      try {
        const claimed = (await db.query("select public.owner_claim_store_key_mail() as value")).rows[0].value;
        same(claimed.state, "claimed", "Store Key worker claimed the queued mail");
        same((await db.query("select public.owner_authorize_store_key_submit($1,$2) as value",
          [claimed.id, claimed.claimToken])).rows[0].value, true, "SMTP had been authorized");
        await db.query("update private.mail_dispatches set claim_expires_at=clock_timestamp()-interval '1 second' where id=$1",
          [claimed.id]);
        const otp = (await db.query(
          "update private.mail_dispatches set status='sending', claim_token=gen_random_uuid(), " +
          "claim_expires_at=clock_timestamp()-interval '1 second', resolved_at=null " +
          "where kind='create_store_otp' and canonical_email=$1 returning id", [form.email],
        )).rows[0];
        const quota = async () => (await db.query(
          "select o.status, s.id::text as store, " +
          "(select count(*)::int from public.stores where owner_account_id=o.owner_account_id) as stores, " +
          "(select count(*)::int from private.create_operations where owner_account_id=o.owner_account_id " +
          "and status in ('accepted','unknown')) as holds " +
          "from private.create_operations o join public.stores s on s.id=o.created_store_id " +
          "where o.accepted_attempt_id=$1", [attemptId],
        )).rows[0];
        const before = await quota();
        const smtpBefore = smtp.length;
        const authBefore = createAuthCalls;
        const warnings: unknown[][] = [];
        console.warn = (...args) => warnings.push(args);
        same((await work()).status, 200, "sweep handles expired claims");
        same((await work()).status, 200, "repeat sweep completes");
        const mail = (await db.query(
          "select id, status, resolved_at is not null as resolved from private.mail_dispatches where id in ($1,$2)",
          [claimed.id, otp.id],
        )).rows;
        same(mail.length, 2, "both stale claims exist");
        for (const row of mail) {
          same(row.status, "unknown", "stale sending becomes unknown");
          same(row.resolved, true, "sweep records the resolution time");
        }
        same(JSON.stringify(warnings), JSON.stringify([
          ["owner_provisioning.store_key_mail_claim_expired", { mailId: claimed.id }],
        ]), "one warning with only the Store Key mail ID across both sweeps");
        same(smtp.length, smtpBefore, "neither expired claim is resent");
        same(createAuthCalls, authBefore, "sweep does not call Auth");
        same(JSON.stringify(await quota()), JSON.stringify(before), "created store and quota stay intact");
      } finally {
        console.warn = originalWarn;
        await db.query("rollback to savepoint store_key_timeout");
        await db.query("release savepoint store_key_timeout");
      }
    });
    await work();
    await work();
    same(smtp.length, 2, "one OTP and one Store Key email");
    if (!smtp[1].body.includes(created.body.storeKey)) throw new Error("Store Key mail mismatch");
    const audit = await db.query(
      "select a.actor_type, a.actor_key = o.id::text as bound from public.employee_admin_audit a " +
      "join private.create_operations o on o.created_store_id=a.store_id where o.accepted_attempt_id=$1", [attemptId],
    );
    same(audit.rowCount, 1, "one seed employee audit");
    same(audit.rows[0].actor_type, "system", "system audit actor");
    same(audit.rows[0].bound, true, "audit operation binding");
    same(JSON.stringify((await db.query("select public.owner_get_seed_readiness() as value")).rows[0].value.data),
      '{"status":"ready"}', "committed seed is ready");

    const store = (await db.query(
      "select s.id, e.id as employee_id from public.stores s join public.employees e on e.store_id=s.id " +
      "where s.store_no=$1 and e.role='owner'", [created.body.storeNo],
    )).rows[0];
    await db.query("set constraints all immediate");
    await db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: store.id, role: "authenticated" })]);
    await db.query("set local role authenticated");
    const session = (await db.query("select public.permission_start_session($1,$2) as value", [store.employee_id, form.ownerPin])).rows[0].value;
    if (!session.token) throw new Error("owner session did not open with selected PIN");
    await db.query("select set_config('request.headers',$1,true)", [JSON.stringify({ "x-pos-employee-token": session.token })]);
    const active = (await db.query("select public.permission_get_pos_menu() as value")).rows[0].value;
    same(active.ok, true, "active store menu control");
    if ((await db.query("select count(*)::int as count from public.store_change_signals")).rows[0].count < 1) {
      throw new Error("active store signal control");
    }
    await db.query("reset role");
    await db.query("select public.owner_set_store_status($1,'suspended','local-contract')", [store.id]);
    await db.query("select public.owner_set_store_status($1,'suspended','local-contract')", [store.id]);
    await db.query("set local role authenticated");
    const suspended = (await db.query("select public.permission_get_store_session() as value")).rows[0].value;
    same(suspended.data.status, "suspended", "device can read its store status");
    same(Object.keys(suspended.data).sort().join(","), "status,storeId,storeNo", "store status shape");
    for (const sql of ["public.permission_get_pos_menu()", "public.permission_list_roster()", "public.get_write_capabilities()"]) {
      same((await db.query(`select ${sql} as value`)).rows[0].value.error.code, "STORE_SUSPENDED", "old session denied by RPC");
    }
    same((await db.query("select count(*)::int as count from public.store_change_signals")).rows[0].count, 0, "suspended store signals filtered");
    await db.query("reset role");
    same((await db.query("select count(*)::int as count from private.store_admin_log where store_id=$1 and action='store_status_changed'", [store.id])).rows[0].count, 1, "one audit event for transition");
    await test.step("TC-OWNER-29(a)/47(b): missing PIN hash fails before Auth", async () => {
      const createInput = { ...form, email: `pin-guard+${crypto.randomUUID()}@invalid.test`, seedDemo: false };
      const intentId = crypto.randomUUID();
      const issue = { action: "requestCreateStoreOtp", ...createInput, intentId, requestId: idAt(Date.now()) };
      same((await call(issue, await signIssue(issue))).status, 202, "OTP request accepted");
      await work();
      const mail = smtp.find(message => message.to === createInput.email);
      const code = mail?.body.match(/\b[0-9]{6}\b/)?.[0];
      if (!code) throw new Error("Missing synthetic OTP");

      const authCallsBefore = createAuthCalls;
      let operationId: string | undefined;
      beforeAuthClaim = async (id) => {
        const update = await db.query("update private.create_operations set owner_pin_hash=null " +
          "where id=$1 and status='accepted' and owner_pin_hash is not null", [id]);
        same(update.rowCount, 1, "inject missing PIN on the accepted operation");
        operationId = id;
      };
      const verify = { action: "verifyAndAcceptCreate", attemptId: idAt(Date.now()), intentId, code, createInput };
      try {
        same(JSON.stringify((await call(verify)).body), '{"status":"failed"}', "original proof fails without a dispatch");
      } finally {
        beforeAuthClaim = undefined;
      }
      if (!operationId) throw new Error("Missing-PIN fixture did not reach the Auth claim");
      for (const body of [verify, { ...verify, attemptId: idAt(Date.now()) },
        { action: "getCreateStatus", attemptId: verify.attemptId }]) {
        same(JSON.stringify((await call(body)).body), '{"status":"failed"}', "failed result is stable");
      }
      same(createAuthCalls, authCallsBefore, "Auth was never called");
      const state = (await db.query(
        "select status, reason_code, resolved_at is not null resolved, " +
        "owner_pin_hash is null and store_secret_encrypted is null and store_secret_encryption_version is null cleared, " +
        "created_store_id is null no_store, " +
        "(select count(*)::int from private.store_no_reservations r where r.operation_id=o.id) reservations, " +
        "(select count(*)::int from private.mail_dispatches m where m.operation_id=o.id) key_mail, " +
        "(select count(*)::int from private.create_operations p where p.owner_account_id=o.owner_account_id " +
        "and p.status in ('accepted','unknown')) held_slots " +
        "from private.create_operations o where o.id=$1", [operationId],
      )).rows[0];
      same(JSON.stringify(state), JSON.stringify({
        status: "failed", reason_code: "C_PIN_NOT_PERSISTED", resolved: true, cleared: true, no_store: true,
        reservations: 0, key_mail: 0, held_slots: 0,
      }), "failed operation clears temporary state and releases its seat");
    });
  } finally {
    await db.query("rollback");
    await db.end();
  }
});

Deno.test("an OTP permit delivered after its DB deadline never starts SMTP", async () => {
  const otpEncryptionKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const workerKey = await hmacKey();
  const challengeId = crypto.randomUUID();
  const email = "deadline@invalid.test";
  const nonce = new Uint8Array(12);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce,
    additionalData: encoder.encode(JSON.stringify(["otp-mail", challengeId, email])) }, otpEncryptionKey, encoder.encode("001234"));
  const claim = { state: "claimed", id: crypto.randomUUID(), claimToken: crypto.randomUUID(), challengeId,
    email, otpEncrypted: "00".repeat(12) + toHex(ciphertext), otpEncryptionVersion: 1 };
  let started = 0;
  let outcome: unknown;
  const handle = makeOwnerHandler({
    hmacKey: workerKey, workerKey, otpEncryptionKey, storeEncryptionKey: otpEncryptionKey, ingressKey: workerKey,
    clock: Date.now,
    async rpc(name, args) {
      if (name === "owner_claim_otp_mail") return claim;
      if (name === "owner_authorize_otp_submit") {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return { allowed: true, serverNow: 500, deadline: 501 };
      }
      if (name === "owner_finish_otp_mail") outcome = args?.p_status;
      return null;
    },
    async createAuth() { return { kind: "unknown" }; },
    async sendMail() { started += 1; return "submitted"; },
  });
  const time = String(Date.now());
  const signature = toHex(await crypto.subtle.sign("HMAC", workerKey, encoder.encode(`owner-work-v1\n${time}`)));
  await handle(new Request("http://127.0.0.1/owner", { method: "POST", body: '{"action":"processOwnerWork"}',
    headers: { "x-pos-cafe-time": time, "x-pos-cafe-worker-signature": signature } }));
  same(started, 0, "late permit did not invoke SMTP");
  same(outcome, "failed_before_submit", "known non-submission is recorded");
});
