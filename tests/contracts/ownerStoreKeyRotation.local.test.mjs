import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import pg from "pg";
import { makeOwnerHandler } from "../../supabase/functions/owner-provisioning/handler.ts";
import { rotationCandidateBinding, runStoreKeyRotation } from "../../supabase/functions/owner-provisioning/rotation.ts";

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

  await t.test("one dispatch under contention, recovery by probe, and stale writes rejected across generations", async () => {
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
    const secondDispatch = await claim(workerA, store);
    assert.equal(secondDispatch.phase, "dispatch");
    assert.equal(secondDispatch.ciphertext, "03");
    assert.notEqual(secondDispatch.dispatchToken, first.dispatchToken);
    async function rejectPreviousWorkerWrites() {
      assert.equal(await report(workerA, first, "transport_not_called"), null);
      assert.equal(await report(workerB, probe, "confirmed"), null);
      assert.equal(await advance(workerA, publish), null);
      assert.equal(await advance(workerB, finish), null);
    }
    await rejectPreviousWorkerWrites();
    assert.deepEqual(await storeKey(db, store), { generation: 1, ciphertext: "02" });

    expectStatus(await report(workerA, secondDispatch, "confirmed"), "confirmed");
    const secondPublish = await claim(workerB, store);
    assert.equal(secondPublish.phase, "publish");
    expectStatus(await advance(workerB, secondPublish), "applied");
    await rejectPreviousWorkerWrites();
    assert.deepEqual(await storeKey(db, store), { generation: 2, ciphertext: "03" });

    const secondFinish = await claim(workerA, store);
    assert.equal(secondFinish.phase, "finish");
    expectStatus(await advance(workerA, secondFinish, null), "completed");
    await rejectPreviousWorkerWrites();
    assert.deepEqual(await storeKey(db, store), { generation: 2, ciphertext: "03" });
    assert.equal(await value(db, "select count(*)::int as value from private.store_admin_log where store_id=$1", [store]), 2);
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

  await t.test("TC-OWNER-113 worker contention and late handoff across generations", { timeout: 10_000 }, async () => {
    const { store, owner } = await fixture(db);
    const r1 = await begin(db, store, owner);
    const candidate = new Map([["02", "B".repeat(32)], ["03", "C".repeat(32)]]);
    const dispatchTokens = [];
    const updates = [];
    const probes = [];
    const firstUpdate = Promise.withResolvers();
    const releaseFirst = Promise.withResolvers();
    let current;
    const observe = (name, _args, result) => {
      if (name === "owner_claim_store_key_rotation" && result?.phase === "dispatch") {
        dispatchTokens.push(result.dispatchToken);
      }
    };
    const deps = {
      accessTokenTtlSeconds: 3600,
      async decryptCandidate(ciphertext) { return candidate.get(ciphertext); },
      auth: {
        async changePassword(id, password) {
          assert.equal(id, store);
          updates.push(dispatchTokens.at(-1));
          current = password;
          if (updates.length === 1) {
            firstUpdate.resolve();
            await releaseFirst.promise;
          }
          return true;
        },
        async verifyPassword(id, _number, password) {
          assert.equal(id, store);
          probes.push(updates.length);
          return current === password;
        },
      },
    };
    const wa = { ...deps, rpc: rpcClient(workerA, observe) };
    const wb = { ...deps, rpc: rpcClient(workerB, observe) };
    const run = (worker, rotation) => runStoreKeyRotation(worker, store, rotation.id);
    const noEffect = { ...wa, async decryptCandidate() { throw new Error("Fixture fails before transport"); } };
    assert.equal(await run(noEffect, r1), "recorded");
    assert.deepEqual(updates, []);
    assert.equal(await run(wb, r1), null);
    await forceDue(db, r1.id);

    const oldWorker = run(wa, r1);
    let lateReport;
    try {
      await Promise.race([firstUpdate.promise, oldWorker.then(() => assert.fail("Expected a dispatched update"))]);
      assert.equal(await run(wb, r1), null);
      assert.equal(dispatchTokens.length, 2);
      assert.notEqual(dispatchTokens[0], dispatchTokens[1]);
      assert.deepEqual(updates, [dispatchTokens[1]]);
      assert.deepEqual(await begin(db, store, owner), r1);
      assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });

      await expireRun(db, r1.id);
      assert.equal(await run(wb, r1), "confirmed");
      assert.deepEqual(probes, [1]);
      assert.equal(await run(wb, r1), "applied");
      expectStatus(await begin(db, store, owner), "applied");
      assert.deepEqual(await storeKey(db, store), { generation: 1, ciphertext: "02" });
      assert.ok(current === candidate.get("02"));
      assert.equal(await run(wb, r1), "completed");

      const r2 = await begin(db, store, owner, randomUUID(), "03");
      assert.equal(r2.generation, 2);
      assert.equal(await run(wb, r1), null);
      assert.deepEqual(updates, [dispatchTokens[1]]);
      assert.equal(await run(wb, r2), "confirmed");
      assert.deepEqual(await storeKey(db, store), { generation: 1, ciphertext: "02" });
      assert.equal(await run(wb, r2), "applied");
      assert.equal(await run(wb, r1), null);
      assert.equal(await run(wb, r2), "completed");
      assert.equal(await run(wb, r1), null);
      assert.deepEqual(updates, dispatchTokens.slice(1));
      assert.equal(updates.length, 2);
      assert.deepEqual(probes, [1]);
      assert.deepEqual(await storeKey(db, store), { generation: 2, ciphertext: "03" });
      assert.ok(current === candidate.get("03"));
    } finally {
      releaseFirst.resolve();
      lateReport = await oldWorker;
    }
    assert.equal(lateReport, null);
  });

  await t.test("TC-OWNER-87 lost dispatch before Auth stops after six negative probes", async () => {
    const { store, owner } = await fixture(db);
    const rotation = await begin(db, store, owner);
    const abandoned = await claim(workerA, store);
    assert.equal(abandoned.phase, "dispatch");
    const phases = [];
    const rpc = rpcClient(workerB, (name, _args, result) => {
      if (name === "owner_claim_store_key_rotation" && result) {
        assert.equal(result.dispatchToken, abandoned.dispatchToken);
        phases.push(result.phase);
      }
    });
    let updates = 0;
    let probes = 0;
    const run = () => runStoreKeyRotation({
      rpc, accessTokenTtlSeconds: 3600,
      async decryptCandidate() { return "B".repeat(32); },
      auth: {
        async changePassword() { updates++; return false; },
        async verifyPassword() { probes++; return false; },
      },
    }, store, rotation.id);
    assert.equal(await run(), null);
    await expireRun(db, rotation.id);
    for (let i = 0; i < 6; i++) {
      await forceDue(db, rotation.id);
      assert.equal(await run(), "recorded");
      assert.equal(await value(db, `select count(*)::int as value from private.store_key_rotation_alerts
        where rotation_id=$1 and phase='probe' and outcome='probe_failed'`, [rotation.id]), Number(i === 5));
    }
    await forceDue(db, rotation.id);
    assert.equal(await run(), null);
    assert.equal(updates, 0);
    assert.equal(probes, 6);
    assert.deepEqual(phases, Array(6).fill("probe"));
    expectStatus(await begin(db, store, owner), "pending");
    assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
    assert.equal(await value(db, "select count(*)::int as value from private.mail_dispatches where rotation_id=$1",
      [rotation.id]), 0);
    assert.equal(await value(db, "select count(*)::int as value from private.store_admin_log where store_id=$1", [store]), 0);
  });

  for (const boundary of ["lost Auth response", "lost before confirmed report"]) {
    await t.test(`TC-OWNER-55/87 probe recovers from ${boundary}`, async () => {
      const { store, owner } = await fixture(db);
      const rotation = await begin(db, store, owner);
      const calls = [];
      const password = "B".repeat(32);
      let current;
      const dbRpc = rpcClient(workerA);
      const deps = {
        rpc: dbRpc, accessTokenTtlSeconds: 3600,
        async decryptCandidate() { return password; },
        auth: {
          async changePassword(_id, candidate) {
            calls.push("change");
            current = candidate;
            if (boundary === "lost Auth response") throw new Error(boundary);
            return true;
          },
          async verifyPassword(_id, _number, candidate) { calls.push("probe"); return current === candidate; },
        },
      };
      if (boundary === "lost before confirmed report") {
        const interrupted = { ...deps, rpc(name, args) {
          if (name === "owner_report_store_key_rotation" && args.p_outcome === "confirmed") throw new Error(boundary);
          return dbRpc(name, args);
        } };
        await assert.rejects(runStoreKeyRotation(interrupted, store, rotation.id), { message: boundary });
        await expireRun(db, rotation.id);
      } else {
        assert.equal(await runStoreKeyRotation(deps, store, rotation.id), "recorded");
        await forceDue(db, rotation.id);
      }
      const resume = () => runStoreKeyRotation({ ...deps, rpc: rpcClient(workerB) }, store, rotation.id);
      assert.deepEqual(calls, ["change"]);
      assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
      assert.equal(await resume(), "confirmed");
      assert.deepEqual(await storeKey(db, store), { generation: 0, ciphertext: "01" });
      assert.equal(await resume(), "applied");
      assert.equal(await resume(), "completed");
      assert.deepEqual(calls, ["change", "probe"]);
      assert.deepEqual(await storeKey(db, store), { generation: 1, ciphertext: "02" });
      assert.equal(await value(db, "select count(*)::int as value from private.store_key_rotation_dispatches where rotation_id=$1",
        [rotation.id]), 1);
      assert.equal(await value(db, "select count(*)::int as value from private.mail_dispatches where rotation_id=$1",
        [rotation.id]), 1);
      assert.equal(await value(db, "select count(*)::int as value from private.store_admin_log where store_id=$1", [store]), 1);
    });
  }

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

  await t.test("rotation mail has one claimant and reports the warning for its current generation", async () => {
    const { store, owner } = await fixture(db);
    const claimMail = (worker) => value(worker, "select public.owner_claim_rotation_key_mail() as value");
    const authorize = (worker, mail) => value(worker,
      "select public.owner_authorize_rotation_key_submit($1,$2) as value", [mail.id, mail.claimToken]);
    const finishMail = (worker, mail) => value(worker,
      "select public.owner_finish_rotation_key_mail($1,$2,'submitted') as value", [mail.id, mail.claimToken]);

    async function completeRotation(secret) {
      const rotation = await begin(db, store, owner, randomUUID(), secret);
      expectStatus(rotation, "pending");
      const dispatch = await claim(workerA, store);
      expectStatus(await report(workerA, dispatch, "confirmed"), "confirmed");
      const publish = await claim(workerA, store);
      expectStatus(await advance(workerA, publish), "applied");
      const finish = await claim(workerA, store);
      expectStatus(await advance(workerA, finish, null), "completed");
      const mailId = await value(db, `update private.mail_dispatches
        set queued_at=(select min(queued_at)-interval '1 second' from private.mail_dispatches
          where kind='rotation_store_key' and status='queued')
        where rotation_id=$1 and kind='rotation_store_key' returning id as value`, [rotation.id]);
      assert.ok(mailId);
      return { rotation, mailId };
    }

    const first = await completeRotation("02");
    const blockedPid = await value(workerB, "select pg_backend_pid() as value");
    await workerA.query("begin");
    let winner;
    let contender;
    try {
      winner = await claimMail(workerA);
      assert.equal(winner?.id, first.mailId);
      contender = claimMail(workerB);
      await assertBlocked(db, blockedPid);
    } finally {
      await workerA.query("commit");
      if (contender) assert.equal(await contender, null);
    }
    assert.match(JSON.stringify(await begin(db, store, owner)), /CREATE_VERIFY_UNAVAILABLE/);
    assert.deepEqual(await authorize(workerA, winner), { allowed: true, warnSessions: true });
    assert.equal(await authorize(workerB, winner), null);
    assert.equal(await finishMail(workerA, winner), true);

    const second = await completeRotation("03");
    assert.notEqual(second.mailId, first.mailId);
    assert.equal(await value(db, "select private.owner_rotation_key_mail_current($1) as value", [first.mailId]), false);
    assert.equal(await authorize(workerB, winner), null);
    await db.query(`update private.store_key_rotations
      set applied_at=statement_timestamp()-interval '61 minutes',
          session_warning_until=statement_timestamp()-interval '1 minute' where id=$1`, [second.rotation.id]);
    const current = await claimMail(workerB);
    assert.equal(current?.id, second.mailId);
    assert.equal(current?.generation, "2");
    assert.deepEqual(await authorize(workerB, current), { allowed: true, warnSessions: false });
    assert.equal(await finishMail(workerB, current), true);
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

  await t.test("OTP, owner authorization, lost HTTP response after applied and replay through the Edge handler", async (t) => {
    const { store, owner, email } = await fixture(db);
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
    const legacyMail = await createLegacyMail(db, { store, owner, email });
    const operation = await value(db, `update private.mail_dispatches set status='failed_before_submit'
      where id=$1 returning operation_id as value`, [legacyMail]);
    const oldSecret = "Z".repeat(32);
    const encoder = new TextEncoder();
    const nonce = randomBytes(12);
    const oldCiphertext = await crypto.subtle.encrypt({
      name: "AES-GCM", iv: nonce, additionalData: encoder.encode(operation),
    }, key, encoder.encode(oldSecret));
    await db.query("update public.stores set key_secret_encrypted=$2 where id=$1",
      [store, Buffer.concat([nonce, Buffer.from(oldCiphertext)])]);
    const [ipB, ipC, ipD] = randomBytes(3);
    const ip = `10.${ipB}.${ipC}.${ipD}`;
    const messages = [];
    const updates = [];
    const alerts = [];
    let probes = 0;
    let startedChange;
    let continueChange;
    const started = new Promise((resolve) => { startedChange = resolve; });
    const releaseChange = new Promise((resolve) => { continueChange = resolve; });
    const handler = makeOwnerHandler({
      rpc: rpcClient(workerA),
      createAuth: () => assert.fail("T06 provisioning must not run"),
      async sendMail(message) { messages.push(message); return "submitted"; },
      hmacKey: signer, ingressKey: signer, workerKey: signer, otpEncryptionKey: key, storeEncryptionKey: key,
      forgotStoreKey: true,
      clock: Date.now,
      rotation: { accessTokenTtlSeconds: 3600, identifyStore: async (jwt) => jwt === "a.b.c" ? store : null,
        warn: (event, payload) => alerts.push([event, payload]),
        auth: { async changePassword(id, candidate) {
          updates.push([id, candidate]);
          startedChange();
          await releaseChange;
          return true;
        },
          verifyPassword() {
            probes++;
            assert.fail("No probe necessary after the Admin acknowledgement");
          } },
      },
    });
    async function invokeResponse(input, additions = {}, signed = false) {
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
      return handler(new Request("http://localhost/owner", { method: "POST", body: raw, headers }));
    }
    async function invoke(input, additions = {}, signed = false) {
      const result = await invokeResponse(input, additions, signed);
      return { status: result.status, body: await result.json() };
    }
    async function requestForgot() {
      const prepared = await invokeResponse({ action: "prepareForgotStoreKey", email }, {}, true);
      assert.equal(prepared.status, 202);
      assert.deepEqual(await prepared.json(), { ok: true });
      const receipt = prepared.headers.get("x-pos-cafe-forgot-receipt");
      assert.ok(receipt);
      assert.deepEqual(await invoke({ action: "confirmForgotStoreKeyReceipt", receipt }, {}, true),
        { status: 202, body: { ok: true } });
      return receipt;
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
    let applied;
    let serverError;
    const transport = createServer(async (request, reply) => {
      try {
        assert.equal(request.url, "/owner");
        assert.equal(request.method, "POST");
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const response = await handler(new Request("http://localhost/owner", {
          method: request.method, headers: request.headers, body: Buffer.concat(chunks),
        }));
        applied = { status: response.status, body: await response.json() };
      } catch (error) {
        serverError = error;
      } finally {
        // The handler has finished, but the client receives no response headers or body.
        reply.destroy();
      }
    });
    transport.listen(0, "127.0.0.1");
    t.after(() => new Promise(resolve => transport.close(resolve)));
    await once(transport, "listening");
    const firstRequest = fetch(`http://127.0.0.1:${transport.address().port}/owner`, {
      method: "POST",
      headers: { authorization: "Bearer a.b.c", "x-pos-employee-token": token, "content-type": "application/json" },
      body: JSON.stringify(good),
      signal: AbortSignal.timeout(10_000),
    }).then(
      () => null,
      error => error,
    );
    const pendingRequest = { ...input, requestId: timedId() };
    try {
      const authStarted = await Promise.race([started.then(() => true), firstRequest.then(() => false)]);
      assert.ok(authStarted, "Auth transport was never called");
      assert.deepEqual(await invoke(pendingRequest, {}, true), { status: 200, body: { status: "pending" } });
      const pendingForgot = await requestForgot();
      assert.equal((await invoke({ action: "processOwnerWork" }, {}, true)).status, 200);
      assert.equal(messages.length, 1);
      assert.equal(await value(db, `select (receipt_confirmed_at is not null and canonical_email is null) as value
        from private.forgot_store_key_requests where id=$1`, [pendingForgot]), true);
      assert.equal(await value(db, "select count(*)::int as value from private.mail_dispatches where kind='forgot_store_key' and canonical_email=$1",
        [email]), 0);
    } finally { continueChange(); }
    const lost = await firstRequest;
    if (serverError) throw serverError;
    assert.equal(lost?.cause?.code, "UND_ERR_SOCKET");
    assert.equal(applied?.status, 200);
    assert.equal(applied.body.status, "applied");
    assert.equal(updates.length, 1);
    assert.equal(updates[0][0], store);
    assert.ok(applied.body.storeKey.endsWith("-" + updates[0][1]));
    assert.equal(await value(db, "select status as value from private.store_key_rotations where store_id=$1", [store]),
      "applied");
    assert.deepEqual((await invoke(good)).body, { status: "applied" });
    assert.equal((await invoke({ ...good, code: wrong.code })).body.code, "A_ATTEMPT_ID_REUSED");
    assert.equal((await invoke({ ...good, challengeRef: randomUUID() })).body.code, "A_ATTEMPT_ID_REUSED");
    const appliedRequest = { ...input, requestId: timedId() };
    assert.deepEqual(await invoke(appliedRequest, {}, true), { status: 200, body: { status: "applied" } });
    await requestForgot();
    // Other fixtures can leave an older rotation mail ahead of this one in the shared test queue.
    const queueSize = await value(db, `select count(*)::int as value from private.mail_dispatches
      where kind='rotation_store_key' and status='queued'`);
    const supportForStore = () => messages.slice(1).filter((message) => message.to === email);
    for (let i = 0; i < queueSize && supportForStore().length < 2; i++) {
      assert.equal((await invoke({ action: "processOwnerWork" }, {}, true)).status, 200);
    }
    const support = supportForStore();
    assert.equal(support.length, 2);
    const rotationMail = support.find((message) => message.body.includes("Phiên bản key:"));
    const forgotMail = support.find((message) => message.body.includes("Nếu nghi hộp thư đã bị lộ"));
    assert.ok(rotationMail?.body.includes(applied.body.storeKey));
    assert.ok(forgotMail?.body.includes(applied.body.storeKey));
    assert.ok(support.every((message) => !message.body.includes(oldSecret)));
    assert.match(rotationMail.body, /Việc đổi key vẫn đang hoàn tất/);
    assert.equal(await value(db, `select count(*)::int as value from private.mail_dispatches m
      join private.key_mail_bindings b on b.mail_id=m.id where b.store_id=$1 and b.generation=1
      and m.kind='forgot_store_key' and m.status='submitted'`, [store]), 1);
    assert.deepEqual((await invoke(good)).body, { status: "completed" });
    assert.deepEqual(await invoke(pendingRequest, {}, true), { status: 200, body: { status: "completed" } });
    assert.deepEqual(await invoke(appliedRequest, {}, true), { status: 200, body: { status: "completed" } });
    assert.equal(updates.length, 1);
    assert.equal(probes, 0);
    assert.deepEqual(await value(db, `
      select jsonb_build_object(
        'generation', s.key_generation,
        'rotations', (select count(*) from private.store_key_rotations where store_id=s.id),
        'audit', (select count(*) from private.store_admin_log where store_id=s.id and action='store_key_regenerated'),
        'keyMail', (select count(*) from private.mail_dispatches m
          join private.store_key_rotations r on r.id=m.rotation_id
          where r.store_id=s.id and m.kind='rotation_store_key' and m.status='submitted')
      ) as value from public.stores s where s.id=$1`, [store]),
    { generation: 1, rotations: 1, audit: 1, keyMail: 1 });

    await db.query(`update private.otp_challenges set issued_at=now()-interval '11 minutes',
      expires_at=now()-interval '1 minute' where id=$1`, [confirm.challengeRef]);
    const another = await invoke({ ...input, requestId: timedId() }, {}, true);
    assert.notEqual(another.body.receipt.challengeRef, first.body.receipt.challengeRef);
    await invoke({ action: "processOwnerWork" }, {}, true);
    const secondCode = /là ([0-9]{6})\./.exec(messages.at(-1).body)?.[1];
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

    await t.test("rotation mail alert remains available after a lost sweep response", async () => {
      const mailId = await value(db, `update private.mail_dispatches m set status='unknown'
        from private.store_key_rotations r where m.rotation_id=r.id and r.store_id=$1 returning m.id as value`, [store]);
      // Discard the first sweep response. A later worker must still see the durable mail alert.
      await value(workerA, "select public.owner_sweep_rotation_key_mail() as value");
      await invoke({ action: "processOwnerWork" }, {}, true);
      const relevant = () => alerts.filter(([, payload]) => payload.mailId === mailId);
      assert.equal(relevant().length, 1);
      assert.equal(relevant()[0][0], "owner_provisioning.rotation_key_mail_needs_review");
      assert.deepEqual(Object.keys(relevant()[0][1]).sort(), ["alertId", "mailId"]);
      await invoke({ action: "processOwnerWork" }, {}, true);
      assert.equal(relevant().length, 1);
    });
  });
});
