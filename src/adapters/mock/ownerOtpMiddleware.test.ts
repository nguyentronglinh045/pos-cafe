// @vitest-environment node
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer as createViteServer } from "vite";
import { expect, it, vi } from "vitest";
import { mockOwnerOtp } from "../../../scripts/mock-owner-otp";
import { newOwnerRequestId } from "@/core/ownerCreateInput";
import type { VerifyCreateInput } from "@/domain/ownerCreate";
import { checkMockOwnerPin, mockOwnerOtpPort, pairMockOwnerStore } from "./ownerOtpPort";
import { createMockOwnerProvisioning } from "./ownerProvisioningModel";

type Wire = {
  origin: string;
  post: (route: string, body: unknown, headers?: Record<string, string>) => Promise<Response>;
};

async function withMockHttp(
  createModel: typeof createMockOwnerProvisioning,
  run: (wire: Wire) => Promise<void>,
  { dataMode, projectConfig = false, production = false }: {
    dataMode?: string; projectConfig?: boolean; production?: boolean;
  } = {},
) {
  vi.stubEnv("VITE_DATA_MODE", dataMode);
  if (projectConfig) vi.stubEnv("NODE_ENV", production ? "production" : "development");
  let vite: Awaited<ReturnType<typeof createViteServer>> | undefined;
  let server: ReturnType<typeof createServer> | undefined;
  try {
    vite = await createViteServer({
      configFile: projectConfig ? undefined : false,
      mode: production ? "production" : "example", // Loads the repository's .env.example as Vite mode env.
      plugins: projectConfig ? [] : [mockOwnerOtp(createModel)],
      cacheDir: "node_modules/.vite-owner-http-test",
      server: { middlewareMode: true, watch: null, ws: false },
      optimizeDeps: { noDiscovery: true },
    });
    expect(vite.config.env.VITE_DATA_MODE).toBe(dataMode ?? "mock");
    expect(vite.config.env.DEV).toBe(!production);
    server = createServer(vite.middlewares);
    const address = await new Promise<AddressInfo>((resolve, reject) => {
      server!.once("error", reject).listen(0, "127.0.0.1", () => resolve(server!.address() as AddressInfo));
    });
    const origin = `http://127.0.0.1:${address.port}`;
    const nativeFetch = globalThis.fetch;
    // Give the browser-relative URL an origin while retaining the real HTTP transport.
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => nativeFetch(new URL(url, origin), init));
    const post: Wire["post"] = (route, body, headers) => nativeFetch(
      `${origin}/__pos_owner_mock/${route}`,
      { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) },
    );
    await run({ origin, post });
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    server?.closeAllConnections();
    if (server?.listening) await new Promise<void>(resolve => server!.close(() => resolve()));
    await vite?.close();
  }
}

const form = {
  email: "qa@example.com", displayName: "Quán QA", address: "", ownerPin: "038251", seedDemo: false,
};
const mockRoutes = ["request-otp", "verify", "status", "confirm-key", "pair", "owner-pin"];

it("nối port với mock HTTP, phát lại cùng biên nhận và chặn burst ID", async () => {
  await withMockHttp(() => createMockOwnerProvisioning({ sendOutcomeLimit: 3 }), async ({ post }) => {
    const input = () => ({ ...form, requestId: newOwnerRequestId(Date.now()), intentId: crypto.randomUUID() });
    const send = (body: ReturnType<typeof input>) => post("request-otp", body);
    const first = input();
    const [accepted, duplicate] = await Promise.all([
      mockOwnerOtpPort.requestCreateStoreOtp(first),
      mockOwnerOtpPort.requestCreateStoreOtp(first),
    ]);
    expect(accepted.result).toEqual({
      ok: true,
      receipt: {
        challengeRef: expect.any(String),
        emailDisplay: first.email,
        resendNotBefore: expect.any(Number),
        serverNow: expect.any(Number),
      },
    });
    expect(duplicate.result).toEqual(accepted.result);
    const conflict = await send({ ...first, intentId: crypto.randomUUID() });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ ok: false, code: "A_REQUEST_ID_REUSED" });
    for (let i = 0; i < 2; i++) {
      const limited = await send(input());
      expect(limited.status).toBe(202);
      await limited.json();
    }
    const overflow = await Promise.all(Array.from({ length: 12 }, () => send(input())));
    for (const response of overflow) {
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ ok: false, code: "A_SEND_UNAVAILABLE" });
    }
    const replay = await send(first);
    expect(replay.status).toBe(202);
    expect(replay.headers.get("Cache-Control")).toBe("no-store");
    expect(replay.headers.has("Set-Cookie")).toBe(false);
    expect(await replay.json()).toEqual(accepted.result);
    expect(Number(replay.headers.get("X-POS-Mock-Now"))).toBeGreaterThanOrEqual(accepted.serverTime);
  });
});

it("xác minh qua HTTP, mất phản hồi và chỉ tra mã cũ qua hạn", async () => {
  let time = Date.UTC(2026, 10, 10, 3);
  let lookupUnavailable = false;
  const model = createMockOwnerProvisioning({ now: () => time, processingMs: 15_000 });
  await withMockHttp(() => ({
    ...model,
    getCreateStatus(input) {
      if (lookupUnavailable) throw new Error("fixture failure with internal detail");
      return model.getCreateStatus(input);
    },
  }), async ({ post }) => {
    const attemptId = newOwnerRequestId(time);
    const intentId = crypto.randomUUID();
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId })).toEqual({ status: "unconfirmed" });
    const sent = await mockOwnerOtpPort.requestCreateStoreOtp({ ...form, requestId: newOwnerRequestId(time), intentId });
    expect(sent.result.ok).toBe(true);
    expect(sent.serverTime).toBe(time);
    const [{ code }] = model.readTestMailbox();
    const input = { attemptId, intentId, code, createInput: form };
    const loopbackFetch = globalThis.fetch;
    let dropped = false;
    const verifyRequests: VerifyCreateInput[] = [];
    const lookups: unknown[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      if (url === "/__pos_owner_mock/verify") verifyRequests.push(JSON.parse(String(init.body)));
      if (url === "/__pos_owner_mock/status") {
        lookups.push(JSON.parse(String(init.body)));
        expect(init.credentials).toBe("omit");
      }
      const response = await loopbackFetch(url, init);
      if (url === "/__pos_owner_mock/verify" && !dropped) {
        dropped = true;
        expect(response.status).toBe(202);
        expect(await response.json()).toEqual({ status: "accepted" });
        throw new Error("fixture lost verify response");
      }
      return response;
    });
    await expect(mockOwnerOtpPort.verifyAndAcceptCreate(input)).rejects.toThrow("fixture lost verify response");
    expect(verifyRequests).toEqual([input]);
    expect(model.worker.recordAuthCreated(attemptId, "fixture-auth")).toBe(true);
    const before = model.readOperations();
    const mailbox = model.readTestMailbox();
    expect(await mockOwnerOtpPort.getCreateStatus(input)).toEqual({ status: "accepted" });
    lookupUnavailable = true;
    const failure = await post("status", { attemptId });
    expect(failure.status).toBe(503);
    expect(await failure.json()).toEqual({ ok: false, code: "CREATE_VERIFY_UNAVAILABLE" });
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId }))
      .toEqual({ ok: false, code: "CREATE_VERIFY_UNAVAILABLE" });
    lookupUnavailable = false;
    time += 15_000;
    const lookup = await post("status", { attemptId });
    expect(lookup.status).toBe(200);
    expect(lookup.headers.get("Cache-Control")).toBe("no-store");
    expect(lookup.headers.has("Set-Cookie")).toBe(false);
    expect(await lookup.json()).toEqual({ status: "unknown" });
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId })).toEqual({ status: "unknown" });
    expect(lookups).toEqual([{ attemptId }, { attemptId }, { attemptId }]);
    expect(verifyRequests).toEqual([input]);
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate(input)).toEqual({ status: "unknown" });
    expect(verifyRequests).toEqual([input, input]);
    expect(model.readOperations()).toEqual(before);
    expect(model.readTestMailbox()).toEqual(mailbox);
    expect(model.usedSlots(form.email)).toBe(1);
  });
});

it("giữ hợp đồng lỗi và chống tạo trùng qua hai request xác minh đồng thời", async () => {
  const time = Date.UTC(2026, 10, 10, 3);
  const model = createMockOwnerProvisioning({ now: () => time });
  const id = () => newOwnerRequestId(time);
  await withMockHttp(() => model, async ({ post }) => {
    const intentId = crypto.randomUUID();
    await mockOwnerOtpPort.requestCreateStoreOtp({ ...form, requestId: id(), intentId });
    const [{ code }] = model.readTestMailbox();
    const input = { attemptId: id(), intentId, code, createInput: form };
    const badCode = code === "000000" ? "000001" : "000000";
    const wrong = await post("verify", { ...input, code: badCode });
    expect(wrong.status).toBe(400);
    expect(await wrong.json()).toEqual({ ok: false, code: "A_OTP_INVALID" });
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "not_accepted" });
    const reused = await post("verify", input);
    expect(reused.status).toBe(409);
    expect(await reused.json()).toEqual({ ok: false, code: "A_ATTEMPT_ID_REUSED" });
    const stale = await mockOwnerOtpPort.verifyAndAcceptCreate({ ...input, attemptId: newOwnerRequestId(time - 30 * 60_000 - 1) });
    expect(stale).toEqual({ ok: false, code: "A_REQUEST_ID_STALE", serverNow: time });
    expect(model.readOperations()).toEqual([]);

    const fresh = { ...input, attemptId: id() };
    const replies = await Promise.all([post("verify", fresh), post("verify", fresh)]);
    expect(replies.map(reply => reply.status)).toEqual([202, 202]);
    expect(await Promise.all(replies.map(reply => reply.json()))).toEqual([{ status: "accepted" }, { status: "accepted" }]);
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate({ ...input, code: badCode })).toEqual({ ok: false, code: "A_OTP_INVALID" });
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "not_accepted" });
    expect(model.readOperations()).toHaveLength(1);
    expect(model.readTestMailbox()).toHaveLength(1);
  });
});

it("mã replay qua HTTP tra được lượt gốc nhưng không thể chuyển sang intent khác", async () => {
  let time = Date.UTC(2026, 10, 10, 3);
  const model = createMockOwnerProvisioning({ now: () => time });
  const id = () => newOwnerRequestId(time);
  await withMockHttp(() => model, async ({ post }) => {
    async function issue(createInput: typeof form) {
      const intentId = crypto.randomUUID();
      const sent = await mockOwnerOtpPort.requestCreateStoreOtp({ ...createInput, requestId: id(), intentId });
      expect(sent.result.ok).toBe(true);
      const mail = model.readTestMailbox().find(row => row.intentId === intentId);
      if (!mail) throw new Error("Fixture expected an OTP");
      return { attemptId: id(), intentId, code: mail.code, createInput };
    }
    const first = await issue(form);
    const second = await issue({ ...form, email: "other@example.com" });
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate(first)).toEqual({ status: "accepted" });
    const replayId = id();
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate({ ...first, attemptId: replayId })).toEqual({ status: "accepted" });
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId: replayId })).toEqual({ status: "accepted" });
    const conflict = await post("verify", { ...second, attemptId: replayId });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ ok: false, code: "A_ATTEMPT_ID_REUSED" });
    expect(model.readOperations()).toEqual([expect.objectContaining({ attemptId: first.attemptId })]);
    expect(model.worker.recordAuthCreated(replayId, "not-the-original-attempt")).toBe(false);
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate(second)).toEqual({ status: "accepted" });
    time += 91 * 60_000;
    expect(await mockOwnerOtpPort.getCreateStatus({ attemptId: replayId })).toEqual({ status: "unknown" });
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate({ ...second, attemptId: replayId }))
      .toEqual({ ok: false, code: "A_ATTEMPT_ID_REUSED" });
  });
});

it("Store Key đã lưu vẫn ghép được, lookup không có key và dùng PIN đã đặt", async () => {
  const time = Date.UTC(2026, 10, 10, 3);
  const model = createMockOwnerProvisioning({ now: () => time, autoComplete: true });
  await withMockHttp(() => model, async ({ post }) => {
    const intentId = crypto.randomUUID();
    await mockOwnerOtpPort.requestCreateStoreOtp({ ...form, intentId, requestId: newOwnerRequestId(time) });
    const [{ code }] = model.readTestMailbox();
    const input = { attemptId: newOwnerRequestId(time), intentId, code, createInput: form };
    const created = await mockOwnerOtpPort.verifyAndAcceptCreate(input);
    if (!("storeKey" in created)) throw new Error("Expected Store Key");
    expect(await mockOwnerOtpPort.confirmStoreKeySaved(input)).toEqual({ status: "closed" });
    expect(await mockOwnerOtpPort.verifyAndAcceptCreate(input)).toEqual({ status: "created" });
    expect(await mockOwnerOtpPort.getCreateStatus(input)).toEqual({ status: "created" });
    expect(await pairMockOwnerStore(created.storeKey)).toEqual({
      storeId: expect.any(String), storeNo: created.storeNo, displayName: form.displayName, address: "", seedDemo: false,
    });
    const unsupported = await post("change-owner-pin", { storeKey: created.storeKey, currentPin: form.ownerPin, newPin: "129473" });
    expect(unsupported.status).toBe(404);
    expect(await checkMockOwnerPin(created.storeKey, form.ownerPin)).toBe(true);
    expect(await checkMockOwnerPin(created.storeKey, "129473")).toBe(false);
  });
});

it("chỉ phục vụ mock local, từ chối tra cứu mang OTP hoặc đi từ origin khác", async () => {
  const buildModel = vi.fn(createMockOwnerProvisioning);
  await withMockHttp(buildModel, async ({ post }) => {
    for (const route of mockRoutes) {
      const disabled = await post(route, {});
      expect(disabled.status).toBe(404);
      await disabled.arrayBuffer();
    }
    expect(buildModel).not.toHaveBeenCalled();
  }, { dataMode: "supabase" });

  await withMockHttp(buildModel, async ({ origin, post }) => {
    const attemptId = newOwnerRequestId(Date.now());
    const allowed = await post("status", { attemptId }, { Origin: origin });
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toEqual({ status: "unconfirmed" });
    const invalid = await post("status", { attemptId, code: "012345" });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ ok: false, code: "A_REQUEST_INVALID" });
    for (const [route, headers] of [
      ["status", { Origin: "https://untrusted.example" }],
      ["status", { Host: "untrusted.example", Origin: "http://untrusted.example" }],
      ["status?code=012345", {}],
      ["mailbox", {}],
    ] as const) {
      const denied = await post(route, { attemptId }, headers);
      expect(denied.status).toBe(404);
      expect(await denied.text()).toBe("");
    }
  });
});

it("cấu hình Vite của dự án chỉ bật HTTP mock khi DEV=true", async () => {
  const attemptId = newOwnerRequestId(Date.now());
  await withMockHttp(createMockOwnerProvisioning, async ({ post }) => {
    const enabled = await post("status", { attemptId });
    expect(enabled.status).toBe(200);
    expect(await enabled.json()).toEqual({ status: "unconfirmed" });
  }, { projectConfig: true, dataMode: "mock" });
  await withMockHttp(createMockOwnerProvisioning, async ({ post }) => {
    for (const route of mockRoutes) {
      const disabled = await post(route, { attemptId });
      expect(disabled.status).toBe(404);
      await disabled.arrayBuffer();
    }
  }, { projectConfig: true, production: true, dataMode: "mock" });
});

it("adapter từ chối trường thừa và cặp mã HTTP với body sai hợp đồng", async () => {
  const now = Date.now();
  const attemptId = newOwnerRequestId(now);
  const verify = () => mockOwnerOtpPort.verifyAndAcceptCreate({
    attemptId, intentId: crypto.randomUUID(), code: "012345", createInput: form,
  });
  const lookup = () => mockOwnerOtpPort.getCreateStatus({ attemptId });
  try {
    for (const [request, status, body] of [
      [lookup, 200, { status: "created", storeKey: "fixture-key" }],
      [lookup, 503, { ok: false, code: "A_REQUEST_INVALID" }],
      [verify, 503, { ok: false, code: "A_REQUEST_ID_STALE", serverNow: now }],
      [verify, 200, { status: "accepted" }],
    ] as const) {
      vi.stubGlobal("fetch", async () => Response.json(body, {
        status, headers: { "X-POS-Mock-Now": String(now) },
      }));
      await expect(request()).rejects.toThrow("Invalid mock provisioning response");
    }
  } finally {
    vi.unstubAllGlobals();
  }
});
