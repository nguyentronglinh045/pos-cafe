import pg from "npm:pg@8.23.0";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const digest = "\\x" + "11".repeat(32);
const idAt = (time: number) => {
  const stamp = time.toString(16).padStart(12,"0");
  return `${stamp.slice(0,8)}-${stamp.slice(8)}-7${crypto.randomUUID().slice(15)}`;
};

for (const held of ["challenge", "quota"] as const) {
  Deno.test(`OTP expires while waiting for ${held} lock`, async () => {
    const connectionString = Deno.env.get("POS_CAFE_T06_TEST_DSN");
    if (!connectionString) throw new Error("Missing local test DSN");
    const target = new URL(connectionString);
    if (target.protocol !== "postgresql:" || target.hostname !== "127.0.0.1" || target.search || target.hash
      || !/^\/pos_cafe_t06_contract(?:_[a-z0-9]+)?$/.test(target.pathname)) throw new Error("Non-fixture DSN");
    const admin = new pg.Client({ connectionString });
    const blocker = new pg.Client({ connectionString });
    const verifier = new pg.Client({ connectionString });
    await Promise.all([admin.connect(), blocker.connect(), verifier.connect()]);
    const intent = crypto.randomUUID();
    const challenge = crypto.randomUUID();
    const attempt = idAt(Date.now());
    const email = `clock+${challenge}@invalid.test`;
    try {
      await admin.query("begin");
      await admin.query("insert into private.create_intents(intent_id,canonical_email,input_digest,created_at) values($1,$2,$3,clock_timestamp())",
        [intent,email,digest]);
      const expiry = (await admin.query(
        "with t as (select clock_timestamp() + interval '3 seconds' as deadline) " +
        "insert into private.otp_challenges(id,intent_id,canonical_email,source_ip,issued_at,expires_at,otp_digest) " +
        "select $1,$2,$3,'192.0.2.9',deadline - interval '10 minutes',deadline,$4 from t returning expires_at",
        [challenge,intent,email,digest],
      )).rows[0].expires_at;
      await admin.query("update private.create_intents set current_challenge_id=$1 where intent_id=$2",[challenge,intent]);
      await admin.query("commit");
      await blocker.query("begin");
      if (held === "challenge") {
        await blocker.query("select id from private.otp_challenges where id=$1 for update",[challenge]);
      } else {
        await blocker.query("select pg_advisory_xact_lock(hashtextextended('owner-store-quota:' || $1,0))",[email]);
      }
      const pid = (await verifier.query("select pg_backend_pid() as id")).rows[0].id;
      await verifier.query("set statement_timeout='10s'");
      const pending = verifier.query(
        "select public.owner_verify_create($1,$2,$3,$4,$4,'Café','',false,'123456') as result",
        [attempt,intent,email,digest],
      );
      let waiting = false;
      for (let probe=0; probe<40 && !waiting; probe += 1) {
        waiting = (await admin.query(
          "select wait_event_type = 'Lock' as waiting from pg_stat_activity where pid=$1",[pid],
        )).rows[0]?.waiting === true;
        if (!waiting) await pause(25);
      }
      if (!waiting) throw new Error("Verification did not reach the expected DB wait");
      await admin.query("select pg_sleep(greatest(extract(epoch from $1::timestamptz - clock_timestamp()),0) + 0.1)",[expiry]);
      await blocker.query("commit");
      const result = (await pending).rows[0].result;
      if (result.code !== "A_OTP_EXPIRED") throw new Error("Verification accepted an expired code after waiting");
      const state = (await admin.query(
        "select failed_attempts, status, (select count(*)::int from private.create_operations where intent_id=$2) operations " +
        "from private.otp_challenges where id=$1",[challenge,intent],
      )).rows[0];
      if (state.status !== "active" || state.failed_attempts !== 0 || state.operations !== 0) throw new Error("Expiration changed state");
    } finally {
      await blocker.query("rollback");
      await verifier.end();
      await admin.query("rollback");
      await admin.query("delete from private.otp_attempts where attempt_id=$1",[attempt]);
      await admin.query("update private.create_intents set current_challenge_id=null where intent_id=$1",[intent]);
      await admin.query("delete from private.otp_challenges where id=$1",[challenge]);
      await admin.query("delete from private.create_intents where intent_id=$1",[intent]);
      await Promise.all([admin.end(), blocker.end()]);
    }
  });
}
