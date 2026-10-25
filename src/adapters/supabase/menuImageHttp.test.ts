import { describe, expect, it } from "vitest";
import { bearer, cors, failure, json, PUBLIC_CACHE, rpcData, UUID } from "../../../supabase/functions/_shared/menuImageHttp";

describe("menu image HTTP helpers", () => {
  it("parses strict bearer/UUID values and exact successful RPC envelopes", () => {
    expect(bearer(new Request("http://local", { headers: { Authorization: "Bearer token" } }))).toBe("token");
    expect(bearer(new Request("http://local", { headers: { Authorization: "Basic token" } }))).toBeNull();
    expect(UUID.test("90000000-0000-4000-8000-000000000045")).toBe(true);
    expect(rpcData({ ok: true, data: { objectKey: "derived" } })).toEqual({ objectKey: "derived" });
    expect(rpcData({ ok: false, data: { objectKey: "derived" } })).toBeNull();
  });
  it("marks every JSON error no-store and keeps the exact public cache contract separate", async () => {
    const response = failure(404, "NOT_FOUND");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
    expect(json(200, { ok: true }).headers.get("cache-control")).toBe("no-store");
    expect(PUBLIC_CACHE).toBe("private, max-age=60, must-revalidate");
  });
  it("allows browser SDK and image headers on preflight and actual error responses", () => {
    const requestedHeaders = new Headers({
      authorization: "Bearer synthetic", apikey: "synthetic", "x-client-info": "supabase-js-web/2.108.1",
      "content-type": "application/json", "x-pos-employee-token": "synthetic", "if-none-match": '"asset"',
    });
    for (const response of [new Response(null, { headers: cors }), failure(401, "AUTH_REQUIRED")]) {
      const allowedHeaders = new Set(response.headers.get("access-control-allow-headers")?.split(",").map(header => header.trim().toLowerCase()));
      for (const name of requestedHeaders.keys()) expect(allowedHeaders.has(name), name).toBe(true);
      expect(response.headers.get("access-control-allow-methods")?.split(",")).toEqual(expect.arrayContaining(["GET", "POST", "DELETE", "OPTIONS"]));
    }
  });
});

