import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
import { clearEmployeeCredential, employeeCredential } from "./employeeCredential";
import { createForgotStoreKeyPort, createOwnerRecoveryPort } from "./ownerRecoveryPort";

const url = "https://fixture.invalid";
const challengeRef = "98765432-1234-4234-8234-987654321098";
const request = { storeName: "Quán thử", requestId: "fixture-request" };
const confirmation = { storeName: request.storeName, challengeRef, code: "540218", attemptId: "fixture-attempt" };
const storeKey = `0001-${"K".repeat(32)}`;

it("sends email only to the gateway and exposes a uniform acceptance", async () => {
  const fetchImpl = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ ok: true, storeKey, address: "fixture" }, { status: 202 }))
    .mockResolvedValueOnce(Response.json({ ok: false, code: "A_EMAIL_INVALID" }, { status: 400 }))
    .mockRejectedValueOnce(new Error("fixture transport error"));
  const port = createForgotStoreKeyPort(fetchImpl);
  expect(await port.request("fixture@invalid.test")).toBe("accepted");
  expect(await port.request("invalid")).toBe("invalid_email");
  expect(await port.request("fixture@invalid.test")).toBe("unavailable");
  const [target, options] = fetchImpl.mock.calls[0];
  expect(target).toBe("/api/owner-otp");
  expect(options?.credentials).toBe("same-origin");
  expect(new Headers(options?.headers).has("authorization")).toBe(false);
  expect(new Headers(options?.headers).has("x-pos-employee-token")).toBe(false);
  expect(JSON.parse(String(options?.body))).toEqual({ action: "forgotStoreKey", email: "fixture@invalid.test" });
});

function setup(fetchImpl: typeof fetch) {
  const client = {
    auth: { getSession: async () => ({ data: { session: { access_token: "fixture.jwt.token" } }, error: null }) },
  } as unknown as SupabaseClient;
  employeeCredential(client).token = "fixture-employee-token";
  return { client, port: createOwnerRecoveryPort({ client, url, publicKey: "fixture-publishable-key", fetchImpl }) };
}

it("routes issue through the signed gateway and confirmation to Edge with current credentials", async () => {
  const fetchImpl = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ ok: true, receipt: {
      challengeRef, serverNow: 10, resendNotBefore: 20, emailDisplay: "must-not-surface@example.invalid",
    } }, { status: 202 }))
    .mockResolvedValueOnce(Response.json({ status: "applied", storeKey }))
    .mockResolvedValueOnce(Response.json({ status: "pending", storeKey }));
  const { port } = setup(fetchImpl);
  expect(await port.requestRotationOtp(request)).toEqual({ kind: "receipt", challengeRef, serverNow: 10, resendNotBefore: 20 });
  expect(await port.confirmRotation(confirmation)).toEqual({ kind: "key", storeKey });
  expect(await port.confirmRotation(confirmation)).toEqual({ kind: "status", status: "pending" });
  expect(fetchImpl.mock.calls.map(([target]) => String(target))).toEqual([
    "/api/owner-otp", url + "/functions/v1/owner-provisioning", url + "/functions/v1/owner-provisioning",
  ]);
  const issue = fetchImpl.mock.calls[0][1];
  const verify = fetchImpl.mock.calls[1][1];
  expect(new Headers(issue?.headers).get("authorization")).toBe("Bearer fixture.jwt.token");
  expect(new Headers(verify?.headers).get("x-pos-employee-token")).toBe("fixture-employee-token");
  expect(new Headers(issue?.headers).has("apikey")).toBe(false);
  expect(new Headers(verify?.headers).get("apikey")).toBe("fixture-publishable-key");
  expect(JSON.parse(String(verify?.body))).toEqual({ action: "verifyAndRotateStoreKey", ...confirmation });
});

it("drops a late Store Key after the employee credential changes and surfaces an interrupted confirmation", async () => {
  let deliver: (response: Response) => void = () => { throw new Error("Unexpected early response"); };
  const fetchImpl = vi.fn<typeof fetch>()
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { deliver = resolve; }))
    .mockRejectedValueOnce(new Error("connection reset"));
  const { client, port } = setup(fetchImpl);
  const flow = port.confirmRotation(confirmation);
  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  clearEmployeeCredential(client);
  deliver(Response.json({ status: "applied", storeKey }));
  expect(await flow).toEqual({ kind: "error", code: "EMPLOYEE_SESSION_REQUIRED" });
  employeeCredential(client).token = "a-new-token";
  expect(await port.confirmRotation(confirmation)).toEqual({ kind: "uncertain" });
});
