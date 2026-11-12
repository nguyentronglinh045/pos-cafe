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
