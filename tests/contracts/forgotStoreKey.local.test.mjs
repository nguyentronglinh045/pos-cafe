import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import pg from "pg";
import { makeOwnerHandler } from "../../supabase/functions/owner-provisioning/handler.ts";
import { rotationCandidateBinding } from "../../supabase/functions/owner-provisioning/rotation.ts";

const dsn = process.env.POS_CAFE_T08_TEST_DSN;
const target = dsn && new URL(dsn);
if (!target || target.protocol !== "postgresql:" || target.hostname !== "127.0.0.1"
  || target.search || target.hash || !/^\/pos_cafe_t06_contract_t08forgot[a-z0-9]*$/.test(target.pathname)) {
  throw new Error("Set POS_CAFE_T08_TEST_DSN to an isolated loopback forgotten-key contract database");
}
const value = async (db, sql, args = []) => (await db.query(sql, args)).rows[0]?.value;
const open = async () => {
  const db = new pg.Client({ connectionString: dsn });
  await db.connect();
  return db;
};
const encoder = new TextEncoder();
const notice = "Việc đổi key vẫn đang hoàn tất.";
const nowId = () => {
  const stamp = Date.now().toString(16).padStart(12, "0");
  return `${stamp.slice(0, 8)}-${stamp.slice(8)}-7${randomUUID().slice(15)}`;
};

function rpcClient(db, observed) {
  let tail = Promise.resolve();
  return (name, args = {}) => {
    assert.match(name, /^owner_[a-z_]+$/);
    const params = Object.keys(args).map((arg, i) => {
      assert.match(arg, /^p_[a-z_]+$/);
      return `${arg} => $${i + 1}`;
    }).join(",");
    observed.push(name);
    const current = tail.then(() => value(db, `select public.${name}(${params}) as value`, Object.values(args)));
    tail = current.catch(() => undefined);
    return current;
  };
}

async function encrypt(cipher, secret, binding) {
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(binding) },
    cipher, encoder.encode(secret));
  return Buffer.concat([iv, Buffer.from(encrypted)]);
}

async function ownerFixture(db) {
  const owner = randomUUID();
  const email = `${owner}@invalid.test`;
  await db.query("insert into private.owner_accounts(id,canonical_email) values($1,$2)", [owner, email]);
  return { owner, email };
}

async function addStore(db, cipher, actor, label, digit, sourceIp = "198.51.100.70") {
  const store = randomUUID();
  const op = randomUUID();
  const secret = digit.repeat(32);
  const encrypted = await encrypt(cipher, secret, op);
  await db.query("begin");
  try {
    await db.query("insert into auth.users(id) values($1)", [store]);
    const number = await value(db, `insert into public.stores(id,store_no,owner_account_id,key_secret_encrypted,key_encryption_version)
      values($1,nextval('public.store_no_seq'),$2,$3,1) returning store_no as value`, [store, actor.owner, encrypted]);
    await db.query(`insert into public.employees(id,store_id,name,role,passcode_hash)
      values(gen_random_uuid(),$1,'Fixture Owner','owner',extensions.crypt('123456',extensions.gen_salt('bf',4)))`, [store]);
    await db.query(`insert into public.store_settings(store_id,display_name,address) values($1,$2,$3)`, [store, label, `Address ${label}`]);
    await db.query(`with intent as (
      insert into private.create_intents(intent_id,canonical_email,input_digest,created_at)
      values(gen_random_uuid(),$1,extensions.digest('fixture','sha256'),now()) returning intent_id
    ), challenge as (
      insert into private.otp_challenges(id,intent_id,canonical_email,source_ip,issued_at,expires_at,otp_digest,status)
      select gen_random_uuid(),intent_id,$1,$5,now(),now()+interval '10 minutes',extensions.digest('fixture','sha256'),'used'
      from intent returning id,intent_id
    )
    insert into private.create_operations(id,intent_id,accepted_attempt_id,owner_account_id,accepted_challenge_id,
      status,accepted_at,lease_expires_at,resolved_at,display_name,address,seed_demo,created_store_id,receipt_expires_at)
    select $2,intent_id,gen_random_uuid(),$3,id,'created',now(),now()+interval '10 minutes',now(),
      'Old name','Old address',false,$4,now()+interval '1 hour' from challenge`, [actor.email, op, actor.owner, store, sourceIp]);
    await db.query("commit");
    return { store, number, key: `${number}-${secret}` };
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

const pending = (db, store, owner, attempt, ciphertext) => value(db,
  "select private.owner_begin_store_key_rotation($1,$2,$3,$4,1) as value", [store, owner, attempt, ciphertext]);
const claimRotation = (db, store) => value(db, "select public.owner_claim_store_key_rotation($1) as value", [store]);
const identity = (job) => [job.storeId, job.id, job.generation, job.attempt, job.dispatchToken, job.runToken];
const complete = async (db, store, action) => {
  const job = await claimRotation(db, store);
  return value(db, "select public.owner_advance_store_key_rotation($1,$2,$3,$4,$5,$6,$7) as value", [...identity(job), action]);
};

test("forgotten Store Key HTTP and worker contract with PostgreSQL and SMTP fixture", async (t) => {
  const db = await open();
  const workerDb = await open();
  t.after(() => Promise.all([db.end(), workerDb.end()]));
  assert.equal(await value(db, "select current_database() as value"), target.pathname.slice(1));
  await workerDb.query("set role service_role");

  const cipher = await crypto.subtle.importKey("raw", randomBytes(32), "AES-GCM", false, ["encrypt", "decrypt"]);
  const ingressRaw = randomBytes(32);
  const workerRaw = randomBytes(32);
  const importHmac = (bytes) => crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const observed = [];
  const messages = [];
  let deliver = async () => "submitted";
  const handler = makeOwnerHandler({
    rpc: rpcClient(workerDb, observed), forgotStoreKey: true,
    createAuth() { assert.fail("Forgetting a key must not change Auth"); },
    sendMail(message) { messages.push(message); return deliver(message); },
    hmacKey: await importHmac(randomBytes(32)), ingressKey: await importHmac(ingressRaw), workerKey: await importHmac(workerRaw),
    otpEncryptionKey: cipher, storeEncryptionKey: cipher, clock: Date.now,
  });

  async function request(email, ip, signed = true) {
    const body = JSON.stringify({ action: "forgotStoreKey", email });
    const time = String(Date.now());
    const digest = createHash("sha256").update(body).digest("hex");
    const signature = createHmac("sha256", ingressRaw).update(`pos-cafe-otp-v1\n${time}\n${ip}\n${digest}`).digest("hex");
    const reply = await handler(new Request("https://fixture.invalid", { method: "POST", body, headers: {
      "x-pos-cafe-ip": ip, "x-pos-cafe-time": time, "x-pos-cafe-signature": signed ? signature : "",
    } }));
    assert.equal(reply.headers.get("cache-control"), "no-store");
    return [reply.status, await reply.json()];
  }
  async function work() {
    const time = String(Date.now());
    const signature = createHmac("sha256", workerRaw).update(`owner-work-v1\n${time}`).digest("hex");
    const reply = await handler(new Request("https://fixture.invalid", { method: "POST", body: '{"action":"processOwnerWork"}',
      headers: { "x-pos-cafe-time": time, "x-pos-cafe-worker-signature": signature } }));
    assert.equal(reply.status, 200);
  }
  const accepted = [202, { ok: true }];
  const ipPrefix = `2001:db8:${randomBytes(2).toString("hex")}::`;

  await t.test("only service can enqueue, inspect or deliver", async () => {
    assert.equal(await value(db, `select to_regprocedure('public.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer)') is null as value`), true);
    for (const role of ["anon", "authenticated"]) {
      await db.query(`set role ${role}`);
      try {
        await assert.rejects(db.query("select public.owner_enqueue_forgot_store_key($1,$2)", ["none@invalid.test", "192.0.2.10"]), { code: "42501" });
        await assert.rejects(db.query("select public.owner_claim_forgot_key_mail()"), { code: "42501" });
        await assert.rejects(db.query("select * from private.forgot_store_key_requests"), { code: "42501" });
      } finally { await db.query("reset role"); }
    }
  });

  const actor = await ownerFixture(db);
  const first = await addStore(db, cipher, actor, "Fixture first", "A");
  const second = await addStore(db, cipher, actor, "Fixture second", "B");
  await db.query("update public.stores set status='suspended' where id=$1", [second.store]);

  await t.test("public receipt precedes owner lookup; valid owner gets one mail with both current keys", async () => {
    const before = observed.length;
    const unknown = `${randomUUID()}@invalid.test`;
    assert.deepEqual(await request("bad-address", "192.0.2.10"), [400, { ok: false, code: "A_EMAIL_INVALID" }]);
    assert.deepEqual(await request(actor.email, "192.0.2.10", false), [503, { ok: false, code: "A_SEND_UNAVAILABLE" }]);
    assert.deepEqual(await request(` ${actor.email.toUpperCase()} `, `${ipPrefix}10`), accepted);
    assert.deepEqual(await request(unknown, `${ipPrefix}10`), accepted);
    assert.deepEqual(observed.slice(before), ["owner_enqueue_forgot_store_key", "owner_enqueue_forgot_store_key"]);
    assert.equal(messages.length, 0);
    await work();
    assert.equal(messages.length, 1);
    assert.equal(messages[0].to === actor.email, true);
    for (const entry of ["Fixture first", "Address Fixture first", first.key, "Fixture second", "Address Fixture second", second.key, "Đổi Store Key"]) {
      assert.ok(messages[0].body.includes(entry), "Expected mail item is missing");
    }
    assert.equal(await value(db, "select sum(key_generation)::int as value from public.stores where id = any($1)", [[first.store, second.store]]), 0);
  });

  await t.test("email and shared IP limits remain indistinguishable", async () => {
    const count = messages.length;
    for (let i = 0; i < 3; i++) assert.deepEqual(await request(actor.email, `${ipPrefix}11`), accepted);
    await work();
    assert.equal(messages.length - count, 2);

    const ip = `${ipPrefix}71`;
    const other = await ownerFixture(db);
    await addStore(db, cipher, other, "Another fixture", "C", ip);
    for (let i = 0; i < 9; i++) assert.deepEqual(await request(`${randomUUID()}@invalid.test`, ip), accepted);
    assert.deepEqual(await request(other.email, ip), accepted);
    const skipped = await value(db, "select count(*)::int as value from private.forgot_store_key_requests where source_ip=$1", [ip]);
    assert.equal(skipped, 9);
    const otp = await value(workerDb, `select public.owner_request_create_otp($1,$2,$3,$4,$5,$6,$7,decode('01','hex'),1) as value`,
      [nowId(), randomUUID(), `${randomUUID()}@invalid.test`, ip, randomUUID(), randomBytes(32), randomBytes(32)]);
    assert.equal(otp.dispatchNew, false);
    const blockedCount = messages.length;
    await work();
    assert.equal(messages.length, blockedCount);
  });

  await t.test("unprocessed and queued requests expire from the original receipt time", async () => {
    const another = await ownerFixture(db);
    const shop = await addStore(db, cipher, another, "Expired intake fixture", "Z");
    const ip = `${ipPrefix}18`;
    const stale = await value(db, `insert into private.forgot_store_key_requests(source_ip,canonical_email,received_at)
      values($1,$2,now()-interval '91 minutes') returning id as value`, [ip, another.email]);
    assert.equal(await value(workerDb, "select public.owner_prepare_forgot_key_mail() as value"), false);
    const fresh = await value(db, `insert into private.forgot_store_key_requests(source_ip,canonical_email,received_at)
      values($1,$2,now()-interval '89 minutes') returning id as value`, [ip, another.email]);
    assert.equal(await value(workerDb, "select public.owner_prepare_forgot_key_mail() as value"), true);
    const queued = await value(db, `select m.id as value from private.mail_dispatches m
      join private.forgot_store_key_requests r on m.queued_at=r.received_at
      where r.id=$1 and m.kind='forgot_store_key' and m.status='queued' and m.canonical_email=$2`, [fresh, another.email]);
    assert.ok(queued, "The outbox did not retain the original receipt time");
    await db.query("update private.mail_dispatches set queued_at=now()-interval '91 minutes' where id=$1", [queued]);
    assert.equal(await value(workerDb, "select public.owner_claim_forgot_key_mail() as value"), null);
    assert.deepEqual(await request(`${randomUUID()}@invalid.test`, ip), accepted);
    const count = messages.length;
    await work();
    assert.equal(messages.length, count);
    assert.equal(await value(db, "select exists(select 1 from private.forgot_store_key_requests where id=$1) as value", [stale]), false);
    assert.equal(await value(db, "select exists(select 1 from private.mail_dispatches where id=$1) as value", [queued]), false);
    assert.equal(await value(db, "select exists(select 1 from private.key_mail_bindings where mail_id=$1) as value", [queued]), false);
    assert.equal(await value(db, "select private.owner_mail_ip_usage($1,clock_timestamp())::int as value", [ip]), 1);
    assert.equal(await value(db, `select count(*)::int as value from private.forgot_store_key_requests
      where source_ip=$1 and canonical_email is null and received_at>now()-interval '1 hour'`, [ip]), 1);
    assert.equal((await pending(db, shop.store, another.owner, randomUUID(), Buffer.from("01", "hex"))).status, "pending");
  });

  await t.test("expired terminal mail and bindings are removed while unknown mail keeps its fence", async () => {
    const another = await ownerFixture(db);
    const shop = await addStore(db, cipher, another, "Retention fixture", "W");
    const addMail = (status, age) => value(db, `insert into private.mail_dispatches
      (kind,canonical_email,status,queued_at,submit_authorized_at,resolved_at)
      values('forgot_store_key',$1,$2,now()-$3::interval,now()-$3::interval,now()-$3::interval) returning id as value`,
    [another.email, status, age]);
    const old = await addMail("submitted", "4 days");
    const recent = await addMail("submitted", "1 hour");
    const uncertain = await addMail("unknown", "4 days");
    await db.query(`insert into private.key_mail_bindings(mail_id,store_id,generation,owner_account_id,purpose)
      values($1,$3,0,$4,'forgot_key'),($2,$3,0,$4,'forgot_key')`, [old, uncertain, shop.store, another.owner]);
    await value(workerDb, "select public.owner_sweep_forgot_key_mail() as value");
    assert.equal(await value(db, "select exists(select 1 from private.mail_dispatches where id=$1) as value", [old]), false);
    assert.equal(await value(db, "select exists(select 1 from private.key_mail_bindings where mail_id=$1) as value", [old]), false);
    assert.equal(await value(db, "select exists(select 1 from private.mail_dispatches where id=$1) as value", [recent]), true);
    assert.equal(await value(db, "select exists(select 1 from private.key_mail_bindings where mail_id=$1) as value", [uncertain]), true);
    assert.equal((await pending(db, shop.store, another.owner, randomUUID(), Buffer.from("01", "hex"))).code, "CREATE_VERIFY_UNAVAILABLE");
  });

  await t.test("queued bindings lose the pending shop; applied key and warning are sent before completion", async () => {
    const another = await ownerFixture(db);
    const rotated = await addStore(db, cipher, another, "Rotated fixture", "D");
    const retained = await addStore(db, cipher, another, "Retained fixture", "E");
    const attempt = randomUUID();
    const secret = "R".repeat(32);
    const ciphertext = await encrypt(cipher, secret, rotationCandidateBinding(rotated.store, attempt));
    assert.deepEqual(await request(another.email, `${ipPrefix}12`), accepted);
    assert.equal(await value(db, "select public.owner_prepare_forgot_key_mail() as value"), true);
    const rotation = await pending(db, rotated.store, another.owner, attempt, ciphertext);
    assert.equal(rotation.status, "pending");
    await work();
    assert.ok(messages.at(-1).body.includes(retained.key));
    assert.ok(!messages.at(-1).body.includes(rotated.key));
    assert.deepEqual(await request(another.email, `${ipPrefix}12`), accepted);
    await work();
    assert.ok(!messages.at(-1).body.includes(rotated.key));

    const dispatch = await claimRotation(db, rotated.store);
    assert.equal(dispatch.phase, "dispatch");
    const report = await value(db, "select public.owner_report_store_key_rotation($1,$2,$3,$4,$5,$6,'confirmed') as value", identity(dispatch));
    assert.equal(report.status, "confirmed");
    assert.equal((await complete(db, rotated.store, 3600)).status, "applied");
    assert.deepEqual(await request(another.email, `${ipPrefix}12`), accepted);
    await work();
    assert.ok(messages.at(-1).body.includes(`${String(rotated.number).padStart(4, "0")}-${secret}`));
    assert.ok(messages.at(-1).body.includes(notice));
    assert.ok(!messages.at(-1).body.includes(rotated.key));
    assert.equal((await complete(db, rotated.store, null)).status, "completed");
    await db.query(`update private.mail_dispatches set submit_authorized_at=now()-interval '61 minutes'
      where canonical_email=$1 and kind='forgot_store_key'`, [another.email]);
    assert.deepEqual(await request(another.email, `${ipPrefix}12`), accepted);
    await work();
    assert.ok(messages.at(-1).body.includes(notice));
    await db.query(`update private.store_key_rotations set applied_at=now()-interval '2 hours',
      session_warning_until=now()-interval '1 hour' where id=$1`, [rotation.id]);
    assert.deepEqual(await request(another.email, `${ipPrefix}12`), accepted);
    await work();
    assert.ok(messages.at(-1).body.includes(`${String(rotated.number).padStart(4, "0")}-${secret}`));
    assert.ok(!messages.at(-1).body.includes(notice));
  });

  await t.test("stale owner and email bindings do not move keys to an old mailbox", async () => {
    const another = await ownerFixture(db);
    const successor = await ownerFixture(db);
    const removed = await addStore(db, cipher, another, "Transferred fixture", "X");
    const retained = await addStore(db, cipher, another, "Still owned fixture", "Y");
    assert.deepEqual(await request(another.email, `${ipPrefix}16`), accepted);
    assert.equal(await value(db, "select public.owner_prepare_forgot_key_mail() as value"), true);
    await db.query("update public.stores set owner_account_id=$1 where id=$2", [successor.owner, removed.store]);
    const count = messages.length;
    await work();
    assert.equal(messages.length, count + 1);
    assert.ok(messages.at(-1).body.includes(retained.key));
    assert.ok(!messages.at(-1).body.includes(removed.key));

    assert.deepEqual(await request(another.email, `${ipPrefix}16`), accepted);
    assert.equal(await value(db, "select public.owner_prepare_forgot_key_mail() as value"), true);
    await db.query("update private.owner_accounts set canonical_email=$1 where id=$2", [`${randomUUID()}@invalid.test`, another.owner]);
    await work();
    assert.equal(messages.length, count + 1);
  });

  await t.test("SMTP-busy and ambiguous sends fence rotation and never submit twice", async () => {
    const another = await ownerFixture(db);
    const shop = await addStore(db, cipher, another, "Transport fixture", "F");
    const attempt = randomUUID();
    const ciphertext = await encrypt(cipher, "S".repeat(32), rotationCandidateBinding(shop.store, attempt));
    deliver = async () => {
      assert.equal((await pending(db, shop.store, another.owner, attempt, ciphertext)).code, "CREATE_VERIFY_UNAVAILABLE");
      return "unknown";
    };
    const count = messages.length;
    try {
      assert.deepEqual(await request(another.email, `${ipPrefix}13`), accepted);
      await work();
    } finally { deliver = async () => "submitted"; }
    await work();
    assert.equal(messages.length - count, 1);
    assert.equal((await pending(db, shop.store, another.owner, attempt, ciphertext)).code, "CREATE_VERIFY_UNAVAILABLE");
    assert.equal(await value(db, "select count(*)::int as value from private.store_key_rotation_alerts where mail_id=$1", [messages.at(-1).id]), 1);
  });

  await t.test("interleaved workers only authorize one send and require its token to finish", async () => {
    const otherWorker = await open();
    const another = await ownerFixture(db);
    const shop = await addStore(db, cipher, another, "Worker contention fixture", "H");
    try {
      await otherWorker.query("set role service_role");
      assert.deepEqual(await request(another.email, `${ipPrefix}17`), accepted);
      assert.equal(await value(workerDb, "select public.owner_prepare_forgot_key_mail() as value"), true);
      const sql = "select public.owner_claim_forgot_key_mail() as value";
      const results = await Promise.all([value(workerDb, sql), value(otherWorker, sql)]);
      const claims = results.filter(result => result?.state === "claimed");
      assert.equal(claims.length, 1);
      const [job] = claims;
      const finish = "select public.owner_finish_forgot_key_mail($1,$2,'failed_before_submit') as value";
      assert.equal(await value(otherWorker, finish, [job.id, randomUUID()]), false);
      assert.equal(await value(workerDb, finish, [job.id, job.claimToken]), true);
      assert.equal(await value(otherWorker, finish, [job.id, job.claimToken]), false);
      assert.equal((await pending(db, shop.store, another.owner, randomUUID(), Buffer.from("01", "hex"))).status, "pending");
    } finally { await otherWorker.end(); }
  });

  await t.test("the shared project limit reserves the last real send and refuses later OTP/forgotten-key mail", async () => {
    const another = await ownerFixture(db);
    await addStore(db, cipher, another, "Project limit fixture", "G");
    const capFixtureEmail = `${randomUUID()}@invalid.test`;
    await db.query(`with midnight as (
      select date_trunc('day', clock_timestamp() at time zone 'Asia/Ho_Chi_Minh') as local_day
    ), remaining as (
      select 399 - private.owner_mail_project_usage(local_day at time zone 'Asia/Ho_Chi_Minh',
        (local_day + interval '1 day') at time zone 'Asia/Ho_Chi_Minh') as slots from midnight
    )
    insert into private.mail_dispatches(kind,canonical_email,status,queued_at,submit_authorized_at,resolved_at)
      select 'forgot_store_key',$1,'submitted',now(),now(),now() from remaining cross join lateral generate_series(1,slots)`,
    [capFixtureEmail]);
    try {
      const count = messages.length;
      assert.deepEqual(await request(another.email, `${ipPrefix}14`), accepted);
      assert.deepEqual(await request(another.email, `${ipPrefix}14`), accepted);
      await work();
      assert.equal(messages.length - count, 1);
      const result = await value(workerDb, `select public.owner_request_create_otp($1,$2,$3,$4,$5,$6,$7,decode('01','hex'),1) as value`,
        [nowId(), randomUUID(), `${randomUUID()}@invalid.test`, `${ipPrefix}15`, randomUUID(), randomBytes(32), randomBytes(32)]);
      assert.equal(result.dispatchNew, false);
    } finally {
      await db.query("delete from private.mail_dispatches where kind='forgot_store_key' and canonical_email=$1", [capFixtureEmail]);
    }
  });
});
