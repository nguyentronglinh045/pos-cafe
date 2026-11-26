import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import pg from "pg";
import { makeOwnerHandler } from "../../supabase/functions/owner-provisioning/handler.ts";
import { rotationCandidateBinding } from "../../supabase/functions/owner-provisioning/rotation.ts";

const dsn = process.env.POS_CAFE_T08_TEST_DSN;
const target = dsn && new URL(dsn);
if (!target || target.protocol !== "postgresql:" || target.hostname !== "127.0.0.1"
  || target.search || target.hash || !/^\/pos_cafe_t06_contract_t08[a-z0-9]*$/.test(target.pathname)) {
  throw new Error("Set POS_CAFE_T08_TEST_DSN to an isolated loopback T08 contract database");
}
const open = async () => {
  const client = new pg.Client({ connectionString: dsn });
  await client.connect();
  return client;
};
const value = async (db, sql, args = []) => (await db.query(sql, args)).rows[0]?.value;
const begin = (db, store, owner, attempt = randomUUID(), secret = "02") => value(db,
  "select private.owner_begin_store_key_rotation($1,$2,$3,decode($4,'hex'),1) as value",
  [store, owner, attempt, secret]);
const claim = (db, store) => value(db, "select public.owner_claim_store_key_rotation($1) as value", [store]);
const identity = (job) => [job.storeId, job.id, job.generation, job.attempt, job.dispatchToken, job.runToken];
const report = (db, job, outcome) => value(db,
  "select public.owner_report_store_key_rotation($1,$2,$3,$4,$5,$6,$7) as value", [...identity(job), outcome]);
const advance = (db, job, ttl = 3600) => value(db,
  "select public.owner_advance_store_key_rotation($1,$2,$3,$4,$5,$6,$7) as value", [...identity(job), ttl]);
const forceDue = (db, id) => db.query(
  "update private.store_key_rotations set next_attempt_at=clock_timestamp() where id=$1", [id]);
const expireRun = (db, id) => db.query(
  "update private.store_key_rotations set run_expires_at=clock_timestamp()-interval '1 second' where id=$1", [id]);
const storeKey = (db, store) => value(db,
  "select jsonb_build_object('generation',key_generation,'ciphertext',encode(key_secret_encrypted,'hex')) as value from public.stores where id=$1",
  [store]);
const expectStatus = (payload, status) => assert.equal(payload?.status, status);
const digest = (text) => createHash("sha256").update(text).digest();
function timedId() {
  const stamp = Date.now().toString(16).padStart(12, "0");
  return `${stamp.slice(0, 8)}-${stamp.slice(8)}-7${randomUUID().slice(15)}`;
}

function rpcClient(db, observe = () => {}) {
  let tail = Promise.resolve();
  return (name, args = {}) => {
    assert.match(name, /^owner_[a-z_]+$/);
    const params = Object.keys(args).map((key, i) => {
      assert.match(key, /^p_[a-z_]+$/);
      return `${key} => $${i + 1}`;
    }).join(",");
    const task = tail.then(async () => {
      const result = await value(db, `select public.${name}(${params}) as value`, Object.values(args));
      await observe(name, args, result);
      return result;
    });
    tail = task.catch(() => {});
    return task;
  };
}

async function fixture(db, account) {
  const owner = account?.owner ?? randomUUID();
  const store = randomUUID();
  const email = `${owner}@invalid.test`;
  await db.query("begin");
  try {
    await db.query("insert into auth.users(id) values($1)", [store]);
    if (!account) {
      await db.query("insert into private.owner_accounts(id,canonical_email) values($1,$2)", [owner, email]);
    }
    await db.query(`insert into public.stores(id,store_no,owner_account_id,key_secret_encrypted,key_encryption_version)
      values($1,nextval('public.store_no_seq'),$2,'\\x01',1)`, [store, owner]);
    await db.query(`insert into public.employees(id,store_id,name,role,passcode_hash)
      values(gen_random_uuid(),$1,'Fixture Owner','owner',extensions.crypt('123456',extensions.gen_salt('bf',4)))`, [store]);
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
  return { owner, store, email };
}

async function createLegacyMail(db, shop) {
  return value(db, `with intent as (
    insert into private.create_intents(intent_id,canonical_email,input_digest,created_at)
    values (gen_random_uuid(),$1,extensions.digest('t08-fixture','sha256'),now()) returning intent_id
  ), challenge as (
    insert into private.otp_challenges(id,intent_id,canonical_email,source_ip,issued_at,expires_at,otp_digest,status)
    select gen_random_uuid(),intent_id,$1,'127.0.0.1',now(),now()+interval '10 minutes',
      extensions.digest('t08-fixture','sha256'),'used' from intent returning id,intent_id
  ), operation as (
    insert into private.create_operations(intent_id,accepted_attempt_id,owner_account_id,accepted_challenge_id,
      status,accepted_at,lease_expires_at,resolved_at,display_name,address,seed_demo,created_store_id,receipt_expires_at)
    select intent_id,gen_random_uuid(),$2,id,'created',now(),now()+interval '10 minutes',now(),
      'Fixture Store','',false,$3,now()+interval '1 hour' from challenge returning id
  )
  insert into private.mail_dispatches(kind,canonical_email,operation_id,queued_at)
  select 'store_key',$1,id,now() from operation returning id as value`, [shop.email, shop.owner, shop.store]);
}

async function assertBlocked(db, pid) {
  for (let i = 0; i < 100; i++) {
    if (await value(db, "select cardinality(pg_blocking_pids($1))>0 as value", [pid])) return;
    await delay(10);
  }
  assert.fail("Expected PostgreSQL to report a blocked connection");
}

test("T08 store key rotation PostgreSQL contracts", async (t) => {
  const db = await open();
  const workerA = await open();
  const workerB = await open();
  t.after(async () => Promise.all([db.end(), workerA.end(), workerB.end()]));
  const fixtureDb = await value(db, "select current_database() as value");
  assert.equal(`/${fixtureDb}`, target.pathname);
  await Promise.all([workerA.query("set role service_role"), workerB.query("set role service_role")]);

  await t.test("service-only worker RPCs and private begin", async () => {
    const { store, owner } = await fixture(db);
    for (const role of ["anon", "authenticated"]) {
      await db.query(`set role ${role}`);
      try {
        await assert.rejects(claim(db, store), { code: "42501" });
        await assert.rejects(db.query("select key_generation from public.stores"), { code: "42501" });
      } finally {
        await db.query("reset role");
      }
    }
    await assert.rejects(begin(workerA, store, owner), { code: "42501" });
    await assert.rejects(workerA.query("select * from private.store_key_rotations"), { code: "42501" });
    const wrongOwner = await begin(db, store, randomUUID());
    assert.match(JSON.stringify(wrongOwner), /OWNER_ROLE_REQUIRED/);
    await db.query("update public.stores set status='suspended' where id=$1", [store]);
    assert.match(JSON.stringify(await begin(db, store, owner)), /STORE_SUSPENDED/);
  });

  await t.test("one dispatch under real contention, stale token rejected, lost response resumes with probe", async () => {
    const { store, owner } = await fixture(db);
    const attempt = randomUUID();
    const rotation = await begin(db, store, owner, attempt);
    assert.deepEqual(await begin(db, store, owner, attempt, "99"), rotation);
    assert.deepEqual(await begin(db, store, owner, randomUUID(), "98"), rotation);
    assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
    const another = await fixture(db);
    assert.match(JSON.stringify(await begin(db, another.store, another.owner, attempt)), /A_ATTEMPT_ID_REUSED/);

    const pid = await value(workerB, "select pg_backend_pid() as value");
    await workerA.query("begin");
    const first = await claim(workerA, store);
    assert.equal(first.phase, "dispatch");
    assert.equal(first.ciphertext, "02");
    const second = claim(workerB, store);
    try {
      await assertBlocked(db, pid);
    } finally {
      await workerA.query("commit");
      assert.equal(await second, null);
    }
    await expireRun(db, rotation.id);
    const probe = await claim(workerB, store);
    assert.equal(probe.phase, "probe");
    assert.equal(probe.attempt, first.attempt);
    assert.equal(probe.dispatchToken, first.dispatchToken);
    assert.equal(await report(workerA, first, "confirmed"), null);
    assert.equal(await report(workerB, probe, "transport_not_called"), null);
    expectStatus(await report(workerB, probe, "confirmed"), "confirmed");
    const publish = await claim(workerA, store);
    assert.equal(publish.phase, "publish");
    assert.equal("ciphertext" in publish, false);
    assert.equal(await advance(workerB, { ...publish, dispatchToken: randomUUID() }), null);
    assert.match(JSON.stringify(await advance(workerA, publish, null)), /A_REQUEST_INVALID/);

    // Force an error after the store update and audit insert. Every effect must roll back.
    await db.query("begin");
    try {
      await db.query(`alter table private.mail_dispatches add constraint fixture_reject_rotation
        check (kind <> 'rotation_store_key') not valid`);
      await assert.rejects(advance(db, publish), { code: "23514" });
    } finally {
      await db.query("rollback");
    }
    assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
    assert.equal(await value(db, "select count(*)::int as value from private.store_admin_log where store_id=$1", [store]), 0);
    expectStatus(await advance(workerA, publish), "applied");
    assert.equal(await advance(workerA, publish), null);
    assert.deepEqual(await storeKey(db, store), { generation: 1, ciphertext: "02" });
    expectStatus(await begin(db, store, owner), "applied");
    const finish = await claim(workerB, store);
    assert.equal(finish.phase, "finish");
    assert.equal("ciphertext" in finish, false);
    expectStatus(await advance(workerB, finish, null), "completed");
    assert.equal(await advance(workerB, finish), null);
    assert.equal(await value(db, `select (session_warning_until-applied_at=interval '1 hour'
      and candidate_encrypted is null) as value from private.store_key_rotations where id=$1`, [rotation.id]), true);
    assert.equal(await value(db, `select count(*)::int as value from private.mail_dispatches m
      join private.key_mail_bindings b on b.mail_id=m.id
      where m.rotation_id=$1 and m.status='queued' and b.store_id=$2 and b.generation=1 and b.owner_account_id=$3`,
    [rotation.id, store, owner]), 1);
    assert.equal(await value(db, "select count(*)::int as value from private.store_admin_log where store_id=$1", [store]), 1);
    const next = await begin(db, store, owner, randomUUID(), "03");
    assert.equal(next.generation, 2);
    assert.equal(await value(db, "select status as value from private.mail_dispatches where rotation_id=$1", [rotation.id]),
      "failed_before_submit");
    assert.equal(await report(workerA, first, "transport_not_called"), null);
    assert.equal(await advance(workerB, finish), null);
    assert.equal((await claim(workerA, store)).ciphertext, "03");
  });

  await t.test("proven no effect makes a new attempt, ambiguity stops after six probe failures", async () => {
    const { store, owner } = await fixture(db);
    const rotation = await begin(db, store, owner);
    const first = await claim(workerA, store);
    assert.deepEqual(await report(workerA, first, "transport_not_called"),
      { status: "recorded", phase: "dispatch", failureCount: 1, alert: false });
    assert.equal(await claim(workerB, store), null);
    await forceDue(db, rotation.id);
    const retry = await claim(workerB, store);
    assert.equal(retry.phase, "dispatch");
    assert.equal(retry.attempt, 2);
    assert.notEqual(retry.dispatchToken, first.dispatchToken);
    assert.equal(retry.ciphertext, first.ciphertext);
    assert.equal(await report(workerA, first, "confirmed"), null);
    assert.equal(await report(workerB, retry, "unknown_4xx"), null);
    expectStatus(await report(workerB, retry, "ambiguous"), "recorded");
    for (let index = 1; index <= 6; index++) {
      await forceDue(db, rotation.id);
      const work = await claim(workerA, store);
      assert.equal(work.phase, "probe");
      assert.equal(work.dispatchToken, retry.dispatchToken);
      assert.deepEqual(await report(workerA, work, "probe_failed"),
        { status: "recorded", phase: "probe", failureCount: index, alert: index === 6 });
      assert.equal(await report(workerA, work, "probe_failed"), null);
    }
    await forceDue(db, rotation.id);
    assert.equal(await claim(workerA, store), null);
    assert.equal(await claim(workerB, store), null);
    assert.deepEqual(await begin(db, store, owner), rotation);
    assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
    assert.equal(await value(db, "select count(*)::int as value from private.store_key_rotation_dispatches where rotation_id=$1",
      [rotation.id]), 2);
    // The last report can commit even if its response is lost. Alert delivery has a separate lease.
    const missed = await value(workerA, "select public.owner_claim_store_key_rotation_alert() as value");
    assert.equal(missed.rotationId, rotation.id);
    assert.equal(missed.phase, "probe");
    assert.equal(await value(workerB, "select public.owner_claim_store_key_rotation_alert() as value"), null);
    await db.query("update private.store_key_rotation_alerts set claim_expires_at=now()-interval '1 second' where id=$1",
      [missed.id]);
    const retried = await value(workerB, "select public.owner_claim_store_key_rotation_alert() as value");
    assert.equal(retried.id, missed.id);
    assert.notEqual(retried.claimToken, missed.claimToken);
    const ack = (worker, alert) => value(worker, "select public.owner_finish_store_key_rotation_alert($1,$2) as value",
      [alert.id, alert.claimToken]);
    assert.equal(await ack(workerA, missed), false);
    assert.equal(await ack(workerB, retried), true);
    assert.equal(await value(workerA, "select public.owner_claim_store_key_rotation_alert() as value"), null);
  });

  await t.test("rotation start respects key mail fence and prunes only the affected queued recovery binding", async () => {
    const first = await fixture(db);
    const second = await fixture(db, first);
    const mail = await value(db, `insert into private.mail_dispatches(kind,canonical_email,queued_at)
      values('forgot_store_key',$1,clock_timestamp()) returning id as value`, [first.email]);
    for (const entry of [first, second]) {
      await db.query(`insert into private.key_mail_bindings(mail_id,store_id,generation,owner_account_id,purpose)
        values($1,$2,0,$3,'forgot_key')`, [mail, entry.store, entry.owner]);
    }
    const setMailState = (state) => db.query(`update private.mail_dispatches
      set status=$1,claim_token=gen_random_uuid(),claim_expires_at=clock_timestamp()+interval '1 minute' where id=$2`,
    [state, mail]);
    for (const state of ["sending", "unknown"]) {
      await setMailState(state);
      assert.match(JSON.stringify(await begin(db, first.store, first.owner)), /CREATE_VERIFY_UNAVAILABLE/);
      assert.equal(await claim(workerA, first.store), null);
    }
    await setMailState("queued");
    expectStatus(await begin(db, second.store, second.owner), "pending");
    assert.equal(await value(db, "select status as value from private.mail_dispatches where id=$1", [mail]), "queued");
    assert.deepEqual((await db.query("select store_id from private.key_mail_bindings where mail_id=$1", [mail])).rows,
      [{ store_id: first.store }]);
    await setMailState("submitted");
    expectStatus(await begin(db, first.store, first.owner), "pending");
  });

  await t.test("legacy T06 mail and rotation admission serialize in both lock orders", async () => {
    const mailWins = await fixture(db);
    const mailId = await createLegacyMail(db, mailWins);
    const claimLegacy = (client) => value(client, "select public.owner_claim_store_key_mail() as value");
    const dbPid = await value(db, "select pg_backend_pid() as value");
    await workerA.query("begin");
    let legacy;
    let rotation;
    try {
      legacy = await claimLegacy(workerA);
      assert.equal(legacy.id, mailId);
      rotation = begin(db, mailWins.store, mailWins.owner);
      await assertBlocked(workerB, dbPid);
    } finally {
      await workerA.query("commit");
    }
    assert.match(JSON.stringify(await rotation), /CREATE_VERIFY_UNAVAILABLE/);
    assert.equal(await value(db, "select delivery_closed_at as value from private.create_operations where id=$1",
      [legacy.operationId]), null);
    assert.equal(await value(workerA, "select public.owner_authorize_store_key_submit($1,$2) as value",
      [legacy.id, legacy.claimToken]), true);
    assert.equal(await value(workerA, "select public.owner_finish_store_key_mail($1,$2,'submitted') as value",
      [legacy.id, legacy.claimToken]), true);
    expectStatus(await begin(db, mailWins.store, mailWins.owner), "pending");

    const rotationWins = await fixture(db);
    const queued = await createLegacyMail(db, rotationWins);
    await db.query("begin");
    try {
      expectStatus(await begin(db, rotationWins.store, rotationWins.owner), "pending");
      assert.equal(await claimLegacy(workerA), null);
    } finally {
      await db.query("commit");
    }
    assert.equal(await claimLegacy(workerA), null);
    assert.equal(await value(db, "select status as value from private.mail_dispatches where id=$1", [queued]),
      "failed_before_submit");
    assert.equal(await value(db, `select delivery_closed_at is not null as value
      from private.create_operations where created_store_id=$1`, [rotationWins.store]), true);

    const unknownMail = await fixture(db);
    const unknownId = await createLegacyMail(db, unknownMail);
    const unknownClaim = await claimLegacy(workerA);
    assert.equal(unknownClaim.id, unknownId);
    assert.equal(await value(workerA, "select public.owner_authorize_store_key_submit($1,$2) as value",
      [unknownClaim.id, unknownClaim.claimToken]), true);
    assert.equal(await value(workerA, "select public.owner_finish_store_key_mail($1,$2,'unknown') as value",
      [unknownClaim.id, unknownClaim.claimToken]), true);
    assert.match(JSON.stringify(await begin(db, unknownMail.store, unknownMail.owner)), /CREATE_VERIFY_UNAVAILABLE/);
    assert.equal(await claim(workerA, unknownMail.store), null);
  });

  await t.test("signed worker drives the real DB state machine and probes a lost Auth response", async () => {
    const { store, owner } = await fixture(db);
    const attempt = randomUUID();
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const workerKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    const password = "B".repeat(32);
    const enc = new TextEncoder();
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({
      name: "AES-GCM", iv: nonce, additionalData: enc.encode(rotationCandidateBinding(store, attempt)),
    }, key, enc.encode(password));
    const encrypted = Buffer.concat([nonce, Buffer.from(ciphertext)]).toString("hex");
    const rotate = await begin(db, store, owner, attempt, encrypted);
    // Other test rotations are isolated from this worker by their due times.
    await db.query("update private.store_key_rotations set next_attempt_at=now()+interval '1 day' where id<>$1", [rotate.id]);
    const storeNo = await value(db, "select store_no as value from public.stores where id=$1", [store]);
    const calls = [];
    const outcomes = [];
    const mailBodies = [];
    let current;
    const handler = makeOwnerHandler({
      rpc: rpcClient(workerA, async (name, args, result) => {
        if (name === "owner_report_store_key_rotation") outcomes.push(args.p_outcome);
        if (name === "owner_claim_rotation_key_mail" && result?.storeId === store) {
          // Simulate the warning deadline crossing between claim and SQL authorization.
          await db.query(`update private.store_key_rotations set applied_at=now()-interval '2 hours',
            session_warning_until=now()-interval '1 hour' where id=$1`, [rotate.id]);
        }
      }),
      createAuth: () => assert.fail("T06 provisioning must not run"),
      async sendMail(message) { mailBodies.push(message.body); return "submitted"; },
      hmacKey: workerKey, ingressKey: workerKey, workerKey, otpEncryptionKey: key, storeEncryptionKey: key,
      clock: Date.now,
      rotation: {
        accessTokenTtlSeconds: 3600,
        warn: () => assert.fail("No alert expected"),
        auth: {
          async changePassword(id, candidate) {
            calls.push(["change", id, candidate]);
            current = candidate;
            throw new Error("Simulated lost Auth response");
          },
          async verifyPassword(id, number, candidate) {
            calls.push(["probe", id, number, candidate]);
            return current === candidate;
          },
        },
      },
    });
    async function work(signed = true) {
      const time = String(Date.now());
      const bytes = await crypto.subtle.sign("HMAC", workerKey, enc.encode(`owner-work-v1\n${time}`));
      const res = await handler(new Request("http://localhost/owner", {
        method: "POST",
        body: JSON.stringify({ action: "processOwnerWork" }),
        headers: signed ? {
          "x-pos-cafe-time": time, "x-pos-cafe-worker-signature": Buffer.from(bytes).toString("hex"),
        } : undefined,
      }));
      assert.equal(res.status, signed ? 200 : 403);
      assert.deepEqual(await res.json(), { ok: signed });
    }

    await work(false);
    assert.deepEqual(calls, []);
    await work();
    assert.deepEqual(outcomes, ["ambiguous"]);
    assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
    await forceDue(db, rotate.id);
    await work();
    assert.deepEqual(outcomes, ["ambiguous", "confirmed"]);
    await work();
    assert.deepEqual(await storeKey(db, store), { generation: 1, ciphertext: encrypted });
    await work();
    await work();
    assert.equal(await value(db, "select status as value from private.store_key_rotations where id=$1", [rotate.id]),
      "completed");
    assert.deepEqual(calls, [["change", store, password], ["probe", store, storeNo, password]]);
    assert.equal(mailBodies.length, 1);
    assert.doesNotMatch(mailBodies[0], /Việc đổi key vẫn đang hoàn tất/);
  });

  await t.test("OTP, owner authorization, Auth, key delivery and replay through the Edge handler", async () => {
    const { store, email } = await fixture(db);
    const name = "Fixture Rotation";
    await db.query("update public.stores set name=$2 where id=$1", [store, name]);
    const token = randomBytes(32).toString("base64url");
    await db.query(`insert into private.employee_sessions(token_hash,store_id,employee_id,issued_at,expires_at,employee_revision)
      select $1,$2,id,now(),now()+interval '12 hours',permission_revision
      from public.employees where store_id=$2 and role='owner'`, [digest(token), store]);
    const cashierToken = randomBytes(32).toString("base64url");
    const cashierId = randomUUID();
    await db.query(`insert into public.employees(id,store_id,name,role,passcode_hash)
      values($1,$2,'Fixture Cashier','cashier',extensions.crypt('123456',extensions.gen_salt('bf',4)))`, [cashierId, store]);
    await db.query(`insert into private.employee_sessions(token_hash,store_id,employee_id,issued_at,expires_at,employee_revision)
      select $1,$2,id,now(),now()+interval '12 hours',permission_revision
      from public.employees where id=$3`, [digest(cashierToken), store, cashierId]);
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const signer = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    const [ipB, ipC, ipD] = randomBytes(3);
    const ip = `10.${ipB}.${ipC}.${ipD}`;
    const messages = [];
    const updates = [];
    const alerts = [];
    let startedChange;
    let continueChange;
    const started = new Promise((resolve) => { startedChange = resolve; });
    const releaseChange = new Promise((resolve) => { continueChange = resolve; });
    const handler = makeOwnerHandler({
      rpc: rpcClient(workerA),
      createAuth: () => assert.fail("T06 provisioning must not run"),
      async sendMail(message) { messages.push(message); return "submitted"; },
      hmacKey: signer, ingressKey: signer, workerKey: signer, otpEncryptionKey: key, storeEncryptionKey: key,
      clock: Date.now,
      rotation: { accessTokenTtlSeconds: 3600, identifyStore: async (jwt) => jwt === "a.b.c" ? store : null,
        warn: (event, payload) => alerts.push([event, payload]),
        auth: { async changePassword(id, candidate) {
          updates.push([id, candidate]);
          startedChange();
          await releaseChange;
          return true;
        },
          verifyPassword: () => assert.fail("No probe necessary after the Admin acknowledgement") },
      },
    });
    async function invoke(input, additions = {}, signed = false) {
      const raw = JSON.stringify(input);
      const headers = { authorization: "Bearer a.b.c", "x-pos-employee-token": token, ...additions };
      if (signed) {
        const time = String(Date.now());
        const payload = input.action === "processOwnerWork" ? `owner-work-v1\n${time}`
          : `pos-cafe-otp-v1\n${time}\n${ip}\n${digest(raw).toString("hex")}`;
        const signedBytes = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(payload));
        Object.assign(headers, { "x-pos-cafe-time": time, "x-pos-cafe-ip": ip,
          [input.action === "processOwnerWork" ? "x-pos-cafe-worker-signature" : "x-pos-cafe-signature"]:
            Buffer.from(signedBytes).toString("hex") });
      }
      const result = await handler(new Request("http://localhost/owner", { method: "POST", body: raw, headers }));
      return { status: result.status, body: await result.json() };
    }
    const input = { action: "requestRotateStoreKeyOtp", requestId: timedId(), storeName: name };
    assert.equal((await invoke(input, {}, false)).body.code, "A_SEND_UNAVAILABLE");
    assert.deepEqual(await invoke(input, { authorization: "Bearer a.b.d" }, true),
      { status: 401, body: { ok: false, code: "AUTH_REQUIRED" } });
    assert.deepEqual(await invoke(input, { "x-pos-employee-token": "x".repeat(43) }, true),
      { status: 401, body: { ok: false, code: "EMPLOYEE_SESSION_REQUIRED" } });
    assert.deepEqual(await invoke(input, { "x-pos-employee-token": cashierToken }, true),
      { status: 403, body: { ok: false, code: "OWNER_ROLE_REQUIRED" } });
    await db.query("update public.stores set status='suspended' where id=$1", [store]);
    assert.deepEqual(await invoke(input, {}, true), { status: 403, body: { ok: false, code: "STORE_SUSPENDED" } });
    await db.query("update public.stores set status='active' where id=$1", [store]);
    assert.equal(await value(db, `select has_function_privilege('authenticated',
      'public.owner_verify_rotation_otp(uuid,bytea,text,uuid,uuid,bytea,bytea,integer)','execute') as value`), false);
    assert.equal((await invoke({ ...input, storeName: "Bad name" }, {}, true)).body.code, "STORE_NAME_MISMATCH");
    const first = await invoke(input, {}, true);
    assert.equal(first.status, 202);
    assert.deepEqual(Object.keys(first.body.receipt).sort(), ["challengeRef", "resendNotBefore", "serverNow"]);
    assert.deepEqual(await invoke(input, {}, true), first);
    const waitRequest = { ...input, requestId: timedId() };
    const cappedReceipt = await invoke(waitRequest, {}, true);
    assert.equal(cappedReceipt.body.receipt.challengeRef, waitRequest.requestId);
    assert.equal((await invoke({ action: "processOwnerWork" }, {}, true)).status, 200);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].to, email);
    const code = /là ([0-9]{6})\./.exec(messages[0].body)?.[1];
    assert.ok(code);
    const confirm = { action: "verifyAndRotateStoreKey", storeName: name, challengeRef: first.body.receipt.challengeRef };
    const wrong = { ...confirm, code: code === "000000" ? "000001" : "000000", attemptId: timedId() };
    assert.equal((await invoke(wrong)).body.code, "A_OTP_INVALID");
    assert.equal((await invoke(wrong)).body.code, "A_OTP_INVALID");
    assert.equal(await value(db, "select failed_attempts as value from private.otp_challenges where id=$1",
      [confirm.challengeRef]), 1);
    const good = { ...confirm, code, attemptId: timedId() };
    const inFlight = invoke(good);
    await Promise.race([started, inFlight.then(() => assert.fail("Auth transport was never called"))]);
    const pendingRequest = { ...input, requestId: timedId() };
    try {
      assert.deepEqual(await invoke(pendingRequest, {}, true), { status: 200, body: { status: "pending" } });
    } finally { continueChange(); }
    const applied = await inFlight;
    assert.equal(applied.body.status, "applied");
    assert.equal(updates.length, 1);
    assert.equal(updates[0][0], store);
    assert.ok(applied.body.storeKey.endsWith("-" + updates[0][1]));
    assert.deepEqual((await invoke(good)).body, { status: "applied" });
    assert.equal((await invoke({ ...good, code: wrong.code })).body.code, "A_ATTEMPT_ID_REUSED");
    assert.equal((await invoke({ ...good, challengeRef: randomUUID() })).body.code, "A_ATTEMPT_ID_REUSED");
    const appliedRequest = { ...input, requestId: timedId() };
    assert.deepEqual(await invoke(appliedRequest, {}, true), { status: 200, body: { status: "applied" } });
    assert.equal((await invoke({ action: "processOwnerWork" }, {}, true)).status, 200);
    assert.equal(messages.length, 2);
    assert.equal(messages[1].to, email);
    assert.ok(messages[1].body.includes(applied.body.storeKey));
    assert.match(messages[1].body, /Việc đổi key vẫn đang hoàn tất/);
    assert.deepEqual((await invoke(good)).body, { status: "completed" });
    assert.deepEqual(await invoke(pendingRequest, {}, true), { status: 200, body: { status: "completed" } });
    assert.deepEqual(await invoke(appliedRequest, {}, true), { status: 200, body: { status: "completed" } });
    assert.equal(updates.length, 1);

    await db.query(`update private.otp_challenges set issued_at=now()-interval '11 minutes',
      expires_at=now()-interval '1 minute' where id=$1`, [confirm.challengeRef]);
    const another = await invoke({ ...input, requestId: timedId() }, {}, true);
    assert.notEqual(another.body.receipt.challengeRef, first.body.receipt.challengeRef);
    await invoke({ action: "processOwnerWork" }, {}, true);
    const secondCode = /là ([0-9]{6})\./.exec(messages[2].body)?.[1];
    assert.ok(secondCode);
    const badOtp = { ...confirm, challengeRef: another.body.receipt.challengeRef,
      code: secondCode === "000000" ? "000001" : "000000", attemptId: "" };
    for (let n = 1; n <= 5; n++) {
      badOtp.attemptId = timedId();
      assert.equal((await invoke(badOtp)).body.code, "A_OTP_INVALID");
    }
    assert.equal((await invoke(badOtp)).body.code, "A_OTP_INVALID");
    assert.equal((await invoke({ ...badOtp, attemptId: timedId() })).body.code, "A_OTP_ATTEMPTS_EXCEEDED");
    assert.equal(updates.length, 1);
    assert.equal(await value(db, "select failed_attempts as value from private.otp_challenges where id=$1",
      [badOtp.challengeRef]), 5);

    // Prior T06 issues count against the same IP ceiling even if a different purpose was used.
    await db.query(`update private.otp_challenges set issued_at=now()-interval '11 minutes',
      expires_at=now()-interval '1 minute' where id=$1`, [badOtp.challengeRef]);
    await db.query(`with intents as (
      insert into private.create_intents(intent_id,canonical_email,input_digest,created_at)
      select gen_random_uuid(),gen_random_uuid()::text||'@invalid.test',extensions.digest('legacy','sha256'),now()
        from generate_series(1,8) returning intent_id,canonical_email
    ) insert into private.otp_challenges(id,intent_id,canonical_email,source_ip,issued_at,expires_at,otp_digest,status)
      select gen_random_uuid(),intent_id,canonical_email,$1::inet,now(),now()+interval '10 minutes',
        extensions.digest('legacy','sha256'),'used' from intents`, [ip]);
    const sharedCap = { ...input, requestId: timedId() };
    assert.equal((await invoke(sharedCap, {}, true)).body.receipt.challengeRef, sharedCap.requestId);
    assert.equal(await value(db,`select count(*)::int as value from private.rotation_otp_scope where store_id=$1`,[store]),2);

    const mailId = await value(db, `update private.mail_dispatches m set status='unknown'
      from private.store_key_rotations r where m.rotation_id=r.id and r.store_id=$1 returning m.id as value`, [store]);
    // Discard the first sweep response. A later worker must still see the durable mail alert.
    await value(workerA, "select public.owner_sweep_rotation_key_mail() as value");
    await invoke({ action: "processOwnerWork" }, {}, true);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], "owner_provisioning.rotation_key_mail_needs_review");
    assert.deepEqual(Object.keys(alerts[0][1]).sort(), ["alertId", "mailId"]);
    assert.equal(alerts[0][1].mailId, mailId);
    await invoke({ action: "processOwnerWork" }, {}, true);
    assert.equal(alerts.length, 1);
  });
});
