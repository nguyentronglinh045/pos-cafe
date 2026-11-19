import { afterEach, expect, test, vi } from "vitest";
import type { Page, Route } from "@playwright/test";
import { pairRestrictedPinFixture, provisionRestrictedPinFixture } from "./restrictedPinFixture.ts";

const env = {
  project: "pos-cafe-perm-g2a-20261009",
  api: "http://127.0.0.1:59521",
  marker: "synthetic-marker",
  anonKey: "synthetic-anon",
};
const storeId = "80000000-0000-4000-8000-000000000001";

function fixtureResponses(outcome = "applied") {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (address, init) => {
    const url = new URL(String(address));
    expect(url.origin).toBe(env.api);
    expect(init?.redirect).toBe("error");
    const headers = new Headers(init?.headers);
    expect(headers.get("x-pos-permission-contract")).toBe("2");
    if (url.pathname.endsWith("fixture_identity")) {
      return Response.json({ project: env.project, marker: env.marker, database: "postgres" },
        { headers: { "x-pos-permission-hook": "strict" } });
    }
    if (url.pathname.endsWith("permission_reserve_store_no")) {
      return Response.json({ ok: true, data: { storeNo: 17 } });
    }
    if (url.pathname === "/auth/v1/signup") {
      expect(JSON.parse(String(init?.body)).email).toBe("store17@store.pos.local");
      return Response.json({ access_token: "setup-token", user: { id: storeId } });
    }
    expect(headers.get("authorization")).toBe("Bearer setup-token");
    if (url.pathname.endsWith("permission_bootstrap_store")) {
      const { p_request: request } = JSON.parse(String(init?.body));
      expect(request).toMatchObject({ storeNo: 17, seedDemo: false, displayName: "G2a ACK A" });
      return Response.json({ ok: true, outcome, data: {
        storeNo: 17, storeId, ownerId: request.ownerId, seedRequested: false,
      } });
    }
    expect(url.pathname + url.search).toBe("/auth/v1/logout?scope=local");
    return new Response(null, { status: 204 });
  });
}

afterEach(() => vi.restoreAllMocks());

test("PIN fixture proves the isolated target, provisions one store, and closes its setup session", async () => {
  const requests = fixtureResponses();
  const fixture = await provisionRestrictedPinFixture(env, "G2a ACK A");
  expect(fixture.identity.storeId).toBe(storeId);
  expect(fixture.storeKey).toMatch(/^0017-[0-9A-F]{16}$/);
  expect(requests.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
    "/rest/v1/rpc/permission_pin_ack_fixture_identity", "/rest/v1/rpc/permission_reserve_store_no",
    "/auth/v1/signup", "/rest/v1/rpc/permission_bootstrap_store", "/auth/v1/logout",
  ]);
});

test("PIN fixture refuses a hosted target or mismatched lab binding before allocating a store", async () => {
  const requests = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ...env, marker: "other" }));
  await expect(provisionRestrictedPinFixture({ ...env, api: "https://staging.invalid" }, "G2a ACK A"))
    .rejects.toThrow("PIN_FIXTURE_TARGET_REFUSED");
  expect(requests).not.toHaveBeenCalled();
  await expect(provisionRestrictedPinFixture(env, "G2a ACK A")).rejects.toThrow("PIN_FIXTURE_BINDING_REFUSED");
  expect(requests).toHaveBeenCalledOnce();
});

test("PIN fixture closes its setup session when the bootstrap verdict is invalid", async () => {
  const requests = fixtureResponses("replayed");
  await expect(provisionRestrictedPinFixture(env, "G2a ACK A")).rejects.toThrow("PIN_FIXTURE_BOOTSTRAP_INVALID");
  expect(new URL(String(requests.mock.calls.at(-1)?.[0])).pathname).toBe("/auth/v1/logout");
});

test.each([
  [{ ok: true, data: { status: "skipped" } }, true],
  [{ ok: true, data: { status: "pending" } }, false],
  [{ ok: false, code: "PIN_CHANGE_REQUIRED" }, false],
] as const)("PIN readiness bridge preserves the fixture verdict %j", async (body, ready) => {
  const page = {
    route: vi.fn<(url: string, handler: (route: Route) => Promise<void>) => Promise<void>>(),
    goto: vi.fn(),
    getByTestId: vi.fn().mockReturnValue({ waitFor: vi.fn(), click: vi.fn(), fill: vi.fn() }),
  };
  await pairRestrictedPinFixture(page as unknown as Page, env.api, "0017-SYNTHETIC");
  const [path, handler] = page.route.mock.calls[0];
  expect(path).toBe(env.api + "/rest/v1/rpc/owner_get_seed_readiness");
  const response = {
    ok: () => true, json: async () => body, status: () => 200,
    headers: () => ({ "content-length": "180", "access-control-allow-origin": "*" }),
  };
  const route = { request: () => ({ method: () => "POST" }), fetch: vi.fn(async () => response), fulfill: vi.fn() };
  await handler(route as unknown as Route);
  expect(route.fetch).toHaveBeenCalledWith({ url: env.api + "/rest/v1/rpc/permission_get_initial_seed_status", maxRedirects: 0 });
  expect(route.fulfill).toHaveBeenCalledWith(ready
    ? { status: 200, headers: { "access-control-allow-origin": "*" }, json: { ok: true, data: { status: "ready" } } }
    : { response });
});
