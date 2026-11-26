import test from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { ownerOtpGateway } from "../api/owner-otp.js";

const body = { action: "requestCreateStoreOtp", requestId: "example" };
const key = Buffer.alloc(32, 73);
const project = "ineckiashpwloncxnbqx";
const publishableKey = "sb_publishable_synthetic_test_key";
const env = { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "preview", POS_CAFE_OTP_INGRESS_KEY: key.toString("base64"),
  POS_PREVIEW_DATA_MODE: "supabase", POS_PREVIEW_SUPABASE_URL: `https://${project}.supabase.co`,
  POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  POS_CAFE_OWNER_SUPABASE_PROJECT_REF: project, POS_CAFE_OWNER_SUPABASE_PUBLISHABLE_KEY: publishableKey };
const clock = () => 1794376800000;
const response = () => ({
  headers: {}, statusCode: 0, data: null,
  setHeader(key, value) { this.headers[key] = value; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.data = value; return this; },
});

test("OTP gateway refuses non-staging or mismatched Preview configuration before forwarding", async () => {
  for (const overrides of [
    { VERCEL_ENV: "production" }, { VERCEL_ENV: undefined }, { VERCEL_TARGET_ENV: "custom" },
    { POS_PREVIEW_DATA_MODE: "mock" },
    { POS_PREVIEW_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co" },
    { POS_CAFE_OWNER_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst" },
    { POS_CAFE_OWNER_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_other_test_key" },
    { POS_CAFE_OWNER_SUPABASE_PUBLISHABLE_KEY: "invalid-key", POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY: "invalid-key" },
  ]) {
    let invoked = false;
    const handler = ownerOtpGateway({ env: { ...env, ...overrides }, clock, fetchImpl() { invoked = true; } });
    const result = response();
    await handler({ method: "POST", body, headers: { "x-vercel-forwarded-for": "192.0.2.20" } }, result);
    assert.equal(invoked, false);
    assert.deepEqual(result.data, { ok: false, code: "A_SEND_UNAVAILABLE" });
    assert.equal(result.statusCode, 503);
  }
});

test("public demo accepts the approved Production main SHA and its dedicated credentials", async () => {
  const sha = "a".repeat(40);
  const prod = { VERCEL: "1", VERCEL_ENV: "production", VERCEL_TARGET_ENV: "production",
    VERCEL_GIT_COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: sha, POS_PUBLIC_DEMO_SHA: sha,
    POS_PUBLIC_DEMO_CLIENT_KEY: publishableKey, POS_PUBLIC_DEMO_OTP_INGRESS_KEY: key.toString("base64") };
  for (const [overrides, allowed] of [[{}, true], [{ VERCEL_GIT_COMMIT_SHA: "b".repeat(40) }, false],
    [{ VERCEL_GIT_COMMIT_REF: "dev" }, false], [{ VERCEL_TARGET_ENV: "preview" }, false],
    [{ POS_PUBLIC_DEMO_OTP_INGRESS_KEY: undefined }, false], [{ POS_PUBLIC_DEMO_CLIENT_KEY: "invalid" }, false]]) {
    let sent = false;
    const handler = ownerOtpGateway({ env: { ...prod, ...overrides }, clock, fetchImpl(url, options) {
      assert.equal(url, "https://" + project + ".supabase.co/functions/v1/owner-provisioning");
      assert.equal(options.headers.apikey, publishableKey);
      sent = true;
      return Promise.resolve(Response.json({ ok: false, code: "A_REQUEST_INVALID" }, { status: 400 }));
    } });
    const res = response();
    await handler({ method: "POST", body, headers: { "x-vercel-forwarded-for": "192.0.2.21" } }, res);
    assert.equal(sent, allowed);
    assert.equal(res.statusCode, allowed ? 400 : 503);
  }
});

test("OTP gateway signs only the Vercel-derived IP and the exact forwarded body", async () => {
  const handler = ownerOtpGateway({ env, clock, async fetchImpl(url, init) {
    assert.equal(url, `https://${project}.supabase.co/functions/v1/owner-provisioning`);
    assert.equal(init.headers["x-pos-cafe-ip"], "192.0.2.20");
    const digest = createHash("sha256").update(init.body).digest("hex");
    assert.equal(init.headers["x-pos-cafe-signature"], createHmac("sha256", key)
      .update(`pos-cafe-otp-v1\n${clock()}\n192.0.2.20\n${digest}`).digest("hex"));
    return Response.json({ ok: true, internal: "fixture", receipt: {
      challengeRef: "fixture-id", emailDisplay: "test@invalid.test", serverNow: 1000,
      resendNotBefore: 601000, internal: "fixture",
    } }, { status: 202 });
  }});
  const result = response();
  await handler({ method: "POST", body, headers: {
    "x-vercel-forwarded-for": "192.0.2.20", "x-forwarded-for": "192.0.2.21", "x-pos-cafe-ip": "192.0.2.22",
  } }, result);
  assert.equal(result.statusCode, 202);
  assert.deepEqual(result.data, { ok: true, receipt: { challengeRef: "fixture-id", emailDisplay: "test@invalid.test",
    serverNow: 1000, resendNotBefore: 601000 } });
  assert.equal(result.headers["Cache-Control"], "no-store");
});

test("OTP gateway refuses to trust general forwarding headers and does not act outside Vercel", async () => {
  for (const [environment, headers] of [[env, { "x-forwarded-for": "192.0.2.21" }],
    [{ ...env, VERCEL: "0" }, { "x-vercel-forwarded-for": "192.0.2.20" }]]) {
    let invoked = false;
    const handler = ownerOtpGateway({ env: environment, clock, fetchImpl() { invoked = true; } });
    const result = response();
    await handler({ method: "POST", body, headers }, result);
    assert.equal(invoked, false);
    assert.equal(result.statusCode, 503);
  }
});

test("forgot key forwards only the signed recovery fields and returns a generic receipt", async () => {
  const input = { action: "forgotStoreKey", email: "fixture@invalid.test", receiptProtocol: 1 };
  const receipt = "98765432-1234-4234-8234-987654321098";
  const confirm = { action: "confirmForgotStoreKeyReceipt", receipt };
  const ip = "192.0.2.45";
  const handler = ownerOtpGateway({ env, clock, async fetchImpl(_url, init) {
    const forwarded = JSON.parse(init.body);
    const preparing = forwarded.action === "prepareForgotStoreKey";
    assert.deepEqual(forwarded, preparing ? { action: "prepareForgotStoreKey", email: input.email } : confirm);
    assert.equal(init.headers.authorization, undefined);
    assert.equal(init.headers["x-pos-employee-token"], undefined);
    const digest = createHash("sha256").update(init.body).digest("hex");
    assert.equal(init.headers["x-pos-cafe-signature"], createHmac("sha256", key)
      .update(`pos-cafe-otp-v1\n${clock()}\n${ip}\n${digest}`).digest("hex"));
    return Response.json({ ok: true, address: "fixture", email: input.email, receipt: { storeKey: "fixture" } }, {
      status: 202, headers: { "x-pos-cafe-forgot-receipt": receipt },
    });
  } });
  const headers = { "x-vercel-forwarded-for": ip, authorization: "Bearer test.claim.signature", "x-pos-employee-token": "e".repeat(43) };
  const result = response();
  await handler({ method: "POST", body: input, headers }, result);
  assert.equal(result.statusCode, 202);
  assert.deepEqual(result.data, { ok: true });
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(result.headers["x-pos-cafe-forgot-receipt"], receipt);
  const confirmed = response();
  await handler({ method: "POST", body: { ...confirm, email: "must-not-forward@invalid.test" }, headers }, confirmed);
  assert.equal(confirmed.statusCode, 202);
  assert.deepEqual(confirmed.data, { ok: true });
  assert.equal(confirmed.headers["x-pos-cafe-forgot-receipt"], undefined);
  const sha = "a".repeat(40);
  const demo = ownerOtpGateway({ env: { VERCEL: "1", VERCEL_ENV: "production", VERCEL_TARGET_ENV: "production",
    VERCEL_GIT_COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: sha, POS_PUBLIC_DEMO_SHA: sha,
    POS_PUBLIC_DEMO_CLIENT_KEY: publishableKey, POS_PUBLIC_DEMO_OTP_INGRESS_KEY: key.toString("base64") },
  clock, fetchImpl() { assert.fail("Public demo must not forward forgotten-key requests"); } });
  for (const body of [input, confirm]) {
    const refused = response();
    await demo({ method: "POST", body, headers }, refused);
    assert.equal(refused.statusCode, 503);
  }
});

test("forgot key rejects an obsolete client and downstream success without a receipt", async () => {
  const headers = { "x-vercel-forwarded-for": "192.0.2.45" };
  const input = { action: "forgotStoreKey", email: "fixture@invalid.test" };
  let forwarded = 0;
  const gateway = ownerOtpGateway({ env, clock, async fetchImpl() {
    forwarded++;
    return Response.json({ ok: true }, { status: 202 });
  } });
  for (const body of [input, { ...input, receiptProtocol: 1 }]) {
    const result = response();
    await gateway({ method: "POST", body, headers }, result);
    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.data, { ok: false, code: "A_SEND_UNAVAILABLE" });
  }
  assert.equal(forwarded, 1);
});

test("rotation OTP forwards both credentials and never emits the registered email", async () => {
  const rotation = { action: "requestRotateStoreKeyOtp", storeName: "Fixture" };
  const headers = { "x-vercel-forwarded-for": "192.0.2.20", authorization: "Bearer test.claim.signature",
    "x-pos-employee-token": "e".repeat(43) };
  let requests = 0;
  const handler = ownerOtpGateway({ env, clock, async fetchImpl(_url, init) {
    requests++;
    assert.equal(init.headers.authorization, headers.authorization);
    assert.equal(init.headers["x-pos-employee-token"], headers["x-pos-employee-token"]);
    if (requests === 2) return Response.json({ ok: false, code: "OWNER_ROLE_REQUIRED" }, { status: 403 });
    if (requests === 3) return Response.json({ status: "pending", internal: "fixture" }, { status: 200 });
    return Response.json({ ok: true, receipt: { challengeRef: "fixture", serverNow: 1, resendNotBefore: 2,
      emailDisplay: "synthetic@invalid.test" } }, { status: 202 });
  } });
  const denied = response();
  await handler({ method: "POST", body: rotation, headers: { ...headers, "x-pos-employee-token": undefined } }, denied);
  assert.equal(denied.statusCode, 401);
  assert.deepEqual(denied.data, { ok: false, code: "EMPLOYEE_SESSION_REQUIRED" });
  const allowed = response();
  await handler({ method: "POST", body: rotation, headers }, allowed);
  assert.equal(requests, 1);
  assert.deepEqual(allowed.data, { ok: true, receipt: { challengeRef: "fixture", serverNow: 1, resendNotBefore: 2 } });
  const forbidden = response();
  await handler({ method: "POST", body: rotation, headers }, forbidden);
  assert.equal(forbidden.statusCode, 403);
  assert.deepEqual(forbidden.data, { ok: false, code: "OWNER_ROLE_REQUIRED" });
  const pending = response();
  await handler({ method: "POST", body: rotation, headers }, pending);
  assert.equal(pending.statusCode, 200);
  assert.deepEqual(pending.data, { status: "pending" });
});
