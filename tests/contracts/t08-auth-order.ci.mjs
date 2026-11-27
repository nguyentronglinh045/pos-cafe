import { spawn, spawnSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { resolve, sep } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { exerciseRotationAuthProbe } from "./t08-owner55-auth.ci.mjs";

const temp = process.env.RUNNER_TEMP;
const binary = process.env.T08_AUTH_BIN;
if (process.platform !== "linux" || process.env.GITHUB_ACTIONS !== "true"
  || process.env.RUNNER_ENVIRONMENT !== "github-hosted"
  || process.env.GITHUB_REPOSITORY_ID !== "1263057386"
  || process.env.GITHUB_REF !== "refs/heads/test/t08-owner55-auth-20261127"
  || !temp || !binary || !resolve(binary).startsWith(resolve(temp, "t08-auth") + sep)) {
  throw new Error("Use the designated GitHub-hosted Auth contract job.");
}

const origin = "http://127.0.0.1:55442";
const ttl = 3600;
const secret = randomBytes(48).toString("hex");
const authEnv = {
  PATH: process.env.PATH,
  GOTRUE_API_HOST: "127.0.0.1",
  GOTRUE_API_PORT: "55442",
  PORT: "55442",
  API_EXTERNAL_URL: origin,
  GOTRUE_SITE_URL: origin,
  GOTRUE_DB_DRIVER: "postgres",
  GOTRUE_DB_DATABASE_URL: "postgresql://postgres:t08-ci-fixture-only@127.0.0.1:55482/t08_auth_contract?sslmode=disable&search_path=auth",
  GOTRUE_DB_NAMESPACE: "auth",
  DB_NAMESPACE: "auth",
  GOTRUE_JWT_SECRET: secret,
  GOTRUE_JWT_AUD: "authenticated",
  GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated",
  GOTRUE_JWT_ADMIN_ROLES: "service_role",
  GOTRUE_JWT_EXP: String(ttl),
  GOTRUE_EXTERNAL_EMAIL_ENABLED: "true",
  GOTRUE_EXTERNAL_PHONE_ENABLED: "false",
  GOTRUE_DISABLE_SIGNUP: "true",
  GOTRUE_DB_MAX_POOL_SIZE: "5",
  GOTRUE_LOG_LEVEL: "error",
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
function roleToken(role) {
  const unsigned = encode({ alg: "HS256", typ: "JWT" }) + "." + encode({
    role, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 600,
  });
  return unsigned + "." + createHmac("sha256", secret).update(unsigned).digest("base64url");
}
const adminToken = roleToken("service_role");
const hasToken = (data) => typeof data?.access_token === "string" || typeof data?.refresh_token === "string";
const refreshDenials = new Set(["refresh_token_not_found", "refresh_token_already_used", "session_not_found"]);
function check(condition, message) {
  if (!condition) throw new Error(message);
}
async function request(path, payload, { method = "POST", admin = false } = {}) {
  const headers = { "content-type": "application/json" };
  if (admin) headers.authorization = "Bearer " + adminToken;
  const response = await fetch(origin + path, {
    method, headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000), redirect: "error",
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
function claim(reply) {
  check(reply.status === 200 && typeof reply.body?.access_token === "string"
    && typeof reply.body?.refresh_token === "string", "Expected an Auth session.");
  let data;
  try {
    data = JSON.parse(Buffer.from(reply.body.access_token.split(".")[1], "base64url").toString());
  } catch {
    throw new Error("Auth returned an unreadable access token.");
  }
  check(typeof data.session_id === "string" && Number.isInteger(data.iat) && data.exp - data.iat === ttl,
    "Session claims or access TTL did not match.");
  return data;
}
const refresh = (token) => request("/token?grant_type=refresh_token", { refresh_token: token });
function checkRejectedRefresh(reply) {
  check((reply.status === 400 || reply.status === 401) && !hasToken(reply.body)
    && refreshDenials.has(reply.body?.error_code), "Revoked session refresh was not rejected as expected.");
}

async function createFixture() {
  const email = "t08-" + randomBytes(8).toString("hex") + "@example.test";
  const previous = randomBytes(20).toString("hex");
  const current = randomBytes(20).toString("hex");
  const created = await request("/admin/users", { email, password: previous, email_confirm: true }, { admin: true });
  check(created.status === 200 && /^[0-9a-f-]{36}$/i.test(created.body?.id),
    "Fixture creation failed (HTTP " + created.status + ").");
  const login = (password) => request("/token?grant_type=password", { email, password });
  const update = () => request("/admin/users/" + created.body.id, { password: current }, { method: "PUT", admin: true });
  return { previous, current, login, update };
}

async function exercise(kind, before) {
  const { previous, current, login, update } = await createFixture();
  const first = await login(previous);
  const second = await login(previous);
  const earlier = [claim(first), claim(second)];
  check(earlier[0].session_id !== earlier[1].session_id, "Baseline sessions are not independent.");
  const perform = kind === "password grant" ? () => login(previous) : () => refresh(first.body.refresh_token);
  let priorResultToken;
  if (before) {
    const prior = await perform();
    earlier.push(claim(prior));
    priorResultToken = prior.body.refresh_token;
  }
  const updated = await update();
  check(updated.status === 200, "Admin password update failed (HTTP " + updated.status + ").");
  const rotationCompleted = Math.floor(Date.now() / 1000);
  if (!before) {
    const later = await perform();
    if (kind === "password grant") {
      check(later.status === 400 && later.body?.error_code === "invalid_credentials" && !hasToken(later.body),
        "Previous password was not rejected as expected.");
    } else {
      checkRejectedRefresh(later);
    }
  }
  const oldTokens = [priorResultToken, second.body.refresh_token, first.body.refresh_token].filter(Boolean);
  for (const token of new Set(oldTokens)) checkRejectedRefresh(await refresh(token));
  await delay(1100);
  const fresh = await login(current);
  const freshClaim = claim(fresh);
  check(freshClaim.iat > rotationCompleted && earlier.every((item) => item.session_id !== freshClaim.session_id),
    "Current password did not yield a distinct session issued after rotation.");
  await delay(1100);
  const renewed = await refresh(fresh.body.refresh_token);
  const renewedClaim = claim(renewed);
  check(renewedClaim.session_id === freshClaim.session_id && renewedClaim.iat > freshClaim.iat
    && renewedClaim.exp > freshClaim.exp && renewed.body.refresh_token !== fresh.body.refresh_token,
  "Refresh did not advance the new session as expected.");
  console.log("PASS sequential HTTP: " + kind + " " + (before ? "before" : "after") + " update; TTL " + ttl);
}

async function exerciseOverlappingRefresh() {
  const { previous, current, login, update } = await createFixture();
  const prior = await Promise.all([login(previous), login(previous)]);
  const priorClaims = prior.map(claim);
  check(priorClaims[0].session_id !== priorClaims[1].session_id, "Baseline sessions are not independent.");

  const [first, second, updated] = await Promise.all([
    refresh(prior[0].body.refresh_token),
    refresh(prior[1].body.refresh_token),
    update(),
  ]);
  check(updated.status === 200, "Admin password update failed during concurrent HTTP submission.");
  const baselineTokens = prior.map((reply) => reply.body.refresh_token);
  const latestTokens = [...baselineTokens];
  const outcomes = [first, second].map((reply, index) => {
    if (reply.status !== 200) {
      checkRejectedRefresh(reply);
      return "denied";
    }
    check(claim(reply).session_id === priorClaims[index].session_id,
      "An overlapping refresh changed its session identity.");
    latestTokens[index] = reply.body.refresh_token;
    return "token returned, later denied";
  });
  // Probe newest tokens first so retrying a superseded token cannot affect this check.
  for (const token of new Set([...latestTokens, ...baselineTokens])) checkRejectedRefresh(await refresh(token));

  const fresh = await login(current);
  const freshClaim = claim(fresh);
  check(priorClaims.every((entry) => entry.session_id !== freshClaim.session_id),
    "Current password reused a revoked session.");
  check(claim(await refresh(fresh.body.refresh_token)).session_id === freshClaim.session_id,
    "The new session could not renew.");
  console.log("PASS concurrent HTTP refresh and Admin submission: " + outcomes.join(", "));
}

const migration = spawnSync(binary, ["migrate"], { env: authEnv, stdio: "ignore", timeout: 60_000 });
check(migration.status === 0, "Auth migration failed.");
const service = spawn(binary, [], { env: authEnv, stdio: "ignore" });
try {
  let healthy = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      healthy = (await fetch(origin + "/health", { signal: AbortSignal.timeout(500) })).ok;
      if (healthy) break;
    } catch { /* Startup is asynchronous. */ }
    await delay(150);
  }
  check(healthy, "Auth service is unhealthy.");
  if (process.argv.includes("--tc-owner-55")) {
    const deps = { origin, ttl, adminToken, anonToken: roleToken("anon"), request, claim, refresh, checkRejectedRefresh };
    await exerciseRotationAuthProbe(deps);
    await exerciseRotationAuthProbe({ ...deps, strictContract: true });
  } else {
    for (const kind of ["password grant", "refresh"]) {
      for (const before of [true, false]) {
        try {
          await exercise(kind, before);
        } catch (error) {
          console.error("FAIL " + kind + " " + (before ? "before" : "after") + " update: " + error.message);
          process.exitCode = 1;
        }
      }
    }
    try {
      await exerciseOverlappingRefresh();
    } catch (error) {
      console.error("FAIL concurrent HTTP refresh and Admin submission: " + error.message);
      process.exitCode = 1;
    }
  }
} finally {
  service.kill("SIGTERM");
}
