import { randomBytes, randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { deterministicUuid } from "../../src/adapters/supabase/deterministicId.ts";

const targets = {
  "pos-cafe-perm-g2a-20261009": { api: "http://127.0.0.1:59521", proof: "permission_pin_ack_fixture_identity", name: /^G2a ACK [AB]$/ },
  "pos-cafe-perm-g2b-20261009": { api: "http://127.0.0.1:59621", proof: "permission_pin_race_fixture_identity", name: /^G2b Race [AB]$/ },
  "pos-cafe-perm-g2c-20261009": { api: "http://127.0.0.1:59721", proof: "permission_pin_expiry_fixture_identity", name: /^G2c Expiry Wait$/ },
} as const;

type FixtureEnvironment = { project: string; api: string; marker: string; anonKey: string };
type Fields = Record<string, unknown>;
const record = (value: unknown): Fields =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The standalone PIN labs use the isolated pre-T06 database fixture. Only setup
// speaks its bootstrap contract. The browser pairs to the prepared store.
export async function provisionRestrictedPinFixture(env: FixtureEnvironment, displayName: string) {
  const target = targets[env.project as keyof typeof targets];
  if (!target || target.api !== env.api || !target.name.test(displayName)) {
    throw new Error("PIN_FIXTURE_TARGET_REFUSED");
  }

  async function post(path: string, body: Fields, token = env.anonKey): Promise<Response> {
    try {
      const response = await fetch(new URL(path, env.api), {
        method: "POST",
        headers: {
          apikey: env.anonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-pos-permission-contract": "2",
        },
        body: JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return response;
    } catch {
      // Keep transport details and credentials outside Playwright errors.
    }
    throw new Error("PIN_FIXTURE_REQUEST_FAILED");
  }

  const proof = await post(`/rest/v1/rpc/${target.proof}`, {});
  const binding = record(await proof.json());
  if (binding.project !== env.project || binding.marker !== env.marker || binding.database !== "postgres"
    || proof.headers.get("x-pos-permission-hook") !== "strict") {
    throw new Error("PIN_FIXTURE_BINDING_REFUSED");
  }

  const reservation = record(await (await post("/rest/v1/rpc/permission_reserve_store_no", {
    p_create_attempt_id: randomUUID(),
  })).json());
  const storeNo = record(reservation.data).storeNo;
  if (reservation.ok !== true || typeof storeNo !== "number" || !Number.isInteger(storeNo)
    || storeNo < 1 || storeNo > 2147483647) throw new Error("PIN_FIXTURE_RESERVATION_INVALID");

  const secret = randomBytes(8).toString("hex").toUpperCase();
  const auth = record(await (await post("/auth/v1/signup", {
    email: `store${storeNo}@store.pos.local`, password: secret,
  })).json());
  const storeId = record(auth.user).id;
  const token = auth.access_token;
  if (typeof storeId !== "string" || !uuid.test(storeId) || typeof token !== "string" || !token) {
    throw new Error("PIN_FIXTURE_ACCOUNT_INVALID");
  }

  const ownerId = await deterministicUuid(storeId, "owner.primary");
  try {
    const bootstrap = record(await (await post("/rest/v1/rpc/permission_bootstrap_store", {
      p_request: {
        requestId: await deterministicUuid(storeId, "permission.bootstrap.v1"),
        ownerId, storeNo, displayName, address: "", seedDemo: false,
      },
    }, token)).json());
    const created = record(bootstrap.data);
    if (bootstrap.ok !== true || bootstrap.outcome !== "applied" || created.storeId !== storeId
      || created.ownerId !== ownerId || created.storeNo !== storeNo || created.seedRequested !== false) {
      throw new Error("PIN_FIXTURE_BOOTSTRAP_INVALID");
    }
  } finally {
    await post("/auth/v1/logout?scope=local", {}, token);
  }
  return { identity: { storeId, ownerId }, storeKey: `${String(storeNo).padStart(4, "0")}-${secret}` };
}

export async function pairRestrictedPinFixture(page: Page, api: string, storeKey: string) {
  if (!Object.values(targets).some(target => target.api === api)) {
    throw new Error("PIN_FIXTURE_TARGET_REFUSED");
  }
  // The pre-T06 sandbox has the authenticated seed-status RPC. Translate only
  // its unseeded fixture state so the current UI can open the POS after login.
  await page.route(`${api}/rest/v1/rpc/owner_get_seed_readiness`, async route => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const response = await route.fetch({
      url: `${api}/rest/v1/rpc/permission_get_initial_seed_status`, maxRedirects: 0,
    });
    if (!response.ok()) {
      await route.fulfill({ response });
      return;
    }
    const status = record(await response.json());
    if (status.ok === true && record(status.data).status === "skipped") {
      const headers = response.headers();
      delete headers["content-length"];
      delete headers["content-encoding"];
      delete headers["transfer-encoding"];
      await route.fulfill({ status: response.status(), headers, json: { ok: true, data: { status: "ready" } } });
      return;
    }
    await route.fulfill({ response });
  });
  await page.goto("/");
  await page.getByTestId("landing-screen").waitFor();
  await page.getByTestId("go-store-pairing").click();
  await page.getByTestId("store-key-input").fill(storeKey);
  await page.getByTestId("go-passcode").click();
  await page.getByTestId("passcode-screen").waitFor({ timeout: 15_000 });
}
