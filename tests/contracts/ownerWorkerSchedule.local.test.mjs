import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { stripTopLevelTransactions } from "../../scripts/permission-activation-steps.mjs";

test("scheduled worker request is authenticated and points only at the configured project", async () => {
  const dsn = process.env.POS_CAFE_T06_TEST_DSN;
  if (!dsn) throw new Error("Missing local fixture DSN");
  const target = new URL(dsn);
  assert.equal(target.protocol, "postgresql:");
  assert.equal(target.hostname, "127.0.0.1");
  assert.equal(target.search + target.hash, "");
  assert.match(target.pathname, /^\/pos_cafe_t06_contract(?:_[a-z0-9]+)?$/);
  const db = new pg.Client({ connectionString: dsn });
  const url = "https://abcdefghijklmnopqrst.supabase.co/functions/v1/owner-provisioning";
  const key = Buffer.alloc(32, 9);
  await db.connect();
  try {
    await db.query("begin");
    await db.query(`
      create schema vault;
      create schema net;
      create schema cron;
      create table vault.decrypted_secrets(name text primary key, decrypted_secret text not null);
      create temp table requests(url text, body jsonb, headers jsonb);
      create temp table schedules(name text, schedule text, command text);
      create function net.http_post(url text, body jsonb, headers jsonb, timeout_milliseconds integer)
      returns bigint language sql as $$
        insert into pg_temp.requests values($1,$2,$3);
        select 1::bigint;
      $$;
      create function cron.schedule(name text, schedule text, command text) returns bigint language sql as $$
        insert into pg_temp.schedules values($1,$2,$3);
        select 1::bigint;
      $$;
    `);
    await db.query(
      "insert into vault.decrypted_secrets values ('pos_cafe_owner_worker_url',$1)," +
      "('pos_cafe_owner_worker_key',$2),('pos_cafe_owner_worker_publishable_key','test-public')",
      [url, key.toString("base64")],
    );
    const script = readFileSync(new URL("../../supabase/candidate/owner-provisioning-worker-schedule.sql", import.meta.url), "utf8");
    await db.query(stripTopLevelTransactions(script));
    assert.deepEqual((await db.query("select * from pg_temp.schedules")).rows, [
      { name: "pos-cafe-owner-work", schedule: "* * * * *", command: "select private.owner_worker_tick();" },
    ]);
    await db.query("select private.owner_worker_tick()");
    const { rows: [request] } = await db.query("select * from pg_temp.requests");
    assert.equal(request.url, url);
    assert.deepEqual(request.body, { action: "processOwnerWork" });
    assert.equal(request.headers["x-pos-cafe-worker-signature"],
      createHmac("sha256", key).update(`owner-work-v1\n${request.headers["x-pos-cafe-time"]}`).digest("hex"));
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
