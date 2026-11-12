// @vitest-environment node
import { expect, it } from "vitest";
import { newOwnerRequestId } from "@/core/ownerCreateInput";
import type { OwnerCreateForm } from "@/domain/ownerCreate";
import { createMockOwnerProvisioning } from "./ownerProvisioningModel";
import { createMockPermissionRuntime } from "./permissionRuntime";
import { createMockPermissionState } from "./permissionState";

const minute = 60_000;
const email = "owner.a@example.com";
const ip = "192.0.2.10";
const baseForm: OwnerCreateForm = {
  email, displayName: "Quán A", address: "", seedDemo: false, ownerPin: "638251",
};
const fourStores = [
  { email, status: "active" },
  { email, status: "active" },
  { email, status: "active" },
  { email, status: "suspended" },
] as const;
const alternateCode = (code: string) => code === "000000" ? "000001" : "000000";
const error = (code: string) => ({ ok: false, code });

function fixture(options: Omit<NonNullable<Parameters<typeof createMockOwnerProvisioning>[0]>, "now"> = {}) {
  let time = Date.UTC(2026, 10, 10, 3);
  const app = createMockOwnerProvisioning({ ...options, now: () => time });
  const id = (offset = 0) => newOwnerRequestId(time + offset);
  function issue(createInput = baseForm) {
    const intentId = crypto.randomUUID();
    expect(app.requestCreateStoreOtp({ ...createInput, intentId, requestId: id() }, ip).ok).toBe(true);
    const mail = app.readTestMailbox().find(message => message.intentId === intentId);
    if (!mail) throw new Error("Fixture expected a newly delivered OTP");
    return { attemptId: id(), intentId, code: mail.code, createInput };
  }
  return { app, issue, id, advance: (ms: number) => { time += ms; } };
}

it("TC-OWNER-12/17/21: rejects malformed or unavailable proof before reserving a slot", () => {
  const { app, issue, id } = fixture();
  const input = issue();
  expect(app.verifyAndAcceptCreate({ ...input, createInput: undefined })).toEqual(error("A_REQUEST_INVALID"));
  for (const code of ["01234a", "12345", "1234567", " 12345", "１２３４５６"]) {
    expect(app.verifyAndAcceptCreate({ ...input, attemptId: id(), code })).toEqual(error("A_OTP_FORMAT_INVALID"));
  }
  const blockedIntent = crypto.randomUUID();
  expect(app.requestCreateStoreOtp({ ...baseForm, requestId: id(), intentId: blockedIntent }, ip).ok).toBe(true);
  expect(app.verifyAndAcceptCreate({ ...input, intentId: blockedIntent, attemptId: id() }))
    .toEqual(error("A_OTP_UNAVAILABLE"));
  expect(app.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "unconfirmed" });
  expect(app.usedSlots(email)).toBe(0);
  expect(app.readOperations()).toEqual([]);
  for (let i = 0; i < 4; i++) {
    expect(app.verifyAndAcceptCreate({ ...input, attemptId: id(), code: alternateCode(input.code) }))
      .toEqual(error("A_OTP_INVALID"));
  }
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "accepted" });
});

it("TC-OWNER-15: accepted intent stays bound to its original email after OTP data expires", () => {
  const { app, issue, id, advance } = fixture();
  const input = issue();
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "accepted" });
  advance(100 * minute);
  const foreign = { ...baseForm, email: "other@example.com", intentId: input.intentId, requestId: id() };
  expect(app.requestCreateStoreOtp(foreign, ip)).toEqual(error("CREATE_INTENT_ID_REUSED"));
  expect(app.requestCreateStoreOtp({ ...foreign, email }, ip).ok).toBe(true);
  expect(app.readTestMailbox()).toEqual([]);
  expect(app.readOperations()).toHaveLength(1);
});

it("a full unavailable-OTP replay cache does not block verification of a live challenge", () => {
  const { app, issue, id } = fixture();
  const input = issue();
  const unavailable = () => ({ ...input, attemptId: id(), intentId: crypto.randomUUID() });
  const first = unavailable();
  expect(app.verifyAndAcceptCreate(first)).toEqual(error("A_OTP_UNAVAILABLE"));
  for (let i = 1; i < 4_000; i++) {
    const result = app.verifyAndAcceptCreate(unavailable());
    if (!("code" in result) || result.code !== "A_OTP_UNAVAILABLE") throw new Error("Expected an unavailable OTP");
  }
  const overflow = unavailable();
  expect(app.verifyAndAcceptCreate(overflow)).toEqual(error("CREATE_VERIFY_UNAVAILABLE"));
  expect(app.getCreateStatus({ attemptId: overflow.attemptId })).toEqual({ status: "unconfirmed" });
  expect(app.verifyAndAcceptCreate(first)).toEqual(error("A_OTP_UNAVAILABLE"));
  expect(app.getCreateStatus({ attemptId: first.attemptId })).toEqual({ status: "not_accepted" });
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "accepted" });
  expect(app.usedSlots(email)).toBe(1);
});

it("quota refusals cannot fill replay capacity for wrong OTPs or bypass the five-attempt lock", () => {
  const { app, issue, id, advance } = fixture({ existingStores: [...fourStores, { email, status: "active" }] });
  const fullOwner = issue();
  for (let i = 0; i < 4_000; i++) {
    const result = app.verifyAndAcceptCreate({ ...fullOwner, attemptId: id() });
    if (!("code" in result) || result.code !== "OWNER_STORE_LIMIT_REACHED") throw new Error("Expected a quota refusal");
  }
  advance(89 * minute);
  const locked = issue({ ...baseForm, email: "locked@example.com" });
  const unrelated = issue({ ...baseForm, email: "unrelated@example.com" });
  for (let i = 0; i < 5; i++) {
    expect(app.verifyAndAcceptCreate({ ...locked, attemptId: id(), code: alternateCode(locked.code) }))
      .toEqual(error("A_OTP_INVALID"));
  }
  expect(app.verifyAndAcceptCreate(locked)).toEqual(error("CREATE_VERIFY_UNAVAILABLE"));
  expect(app.verifyAndAcceptCreate(unrelated)).toEqual({ status: "accepted" });
  advance(2 * minute);
  expect(app.verifyAndAcceptCreate(locked)).toEqual(error("A_OTP_ATTEMPTS_EXCEEDED"));
  expect(app.usedSlots(locked.createInput.email)).toBe(0);
});

it("TC-OWNER-18/20/37: compares OTP first, replays an error and locks on the fifth wrong attempt", () => {
  const { app, issue, id } = fixture();
  const input = issue();
  const code = alternateCode(input.code);
  const wrong = { ...input, code };
  const differentPin = { ...baseForm, ownerPin: "111111" };
  expect(app.verifyAndAcceptCreate(wrong)).toEqual(error("A_OTP_INVALID"));
  expect(app.verifyAndAcceptCreate({ ...wrong, createInput: differentPin })).toEqual(error("A_OTP_INVALID"));
  expect(app.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "not_accepted" });
  for (let i = 0; i < 4; i++) {
    expect(app.verifyAndAcceptCreate({ ...wrong, attemptId: id(), createInput: differentPin }))
      .toEqual(error("A_OTP_INVALID"));
  }
  expect(app.verifyAndAcceptCreate({ ...input, attemptId: id() })).toEqual(error("A_OTP_ATTEMPTS_EXCEEDED"));
  expect(app.usedSlots(email)).toBe(0);
  expect(app.readOperations()).toEqual([]);
  expect(app.readTestMailbox()).toHaveLength(1);
});

it("TC-OWNER-22/23: correct OTP with a changed PIN fails; a changed proof cannot replay an attempt", () => {
  const { app, issue, id } = fixture();
  const input = issue();
  const changedPin = { ...input, createInput: { ...baseForm, ownerPin: "111111" } };
  expect(app.verifyAndAcceptCreate(changedPin)).toEqual(error("CREATE_INTENT_CONFLICT"));
  expect(app.usedSlots(email)).toBe(0);
  expect(app.verifyAndAcceptCreate(input)).toEqual(error("CREATE_INTENT_CONFLICT"));
  expect(app.verifyAndAcceptCreate({ ...input, code: alternateCode(input.code) }))
    .toEqual(error("A_ATTEMPT_ID_REUSED"));
  expect(app.verifyAndAcceptCreate({ ...input, intentId: crypto.randomUUID() }))
    .toEqual(error("A_ATTEMPT_ID_REUSED"));
  expect(app.verifyAndAcceptCreate({ ...input, attemptId: id() })).toEqual({ status: "accepted" });
  expect(app.readOperations()).toHaveLength(1);
});

it("TC-OWNER-22: changed proofs on the same rejected attempt count against the original challenge", () => {
  const { app, issue, id } = fixture();
  const input = issue();
  expect(app.verifyAndAcceptCreate({ ...input, createInput: { ...baseForm, ownerPin: "111111" } }))
    .toEqual(error("CREATE_INTENT_CONFLICT"));
  for (let i = 0; i < 4; i++) {
    expect(app.verifyAndAcceptCreate({ ...input, code: alternateCode(input.code) }))
      .toEqual(error("A_ATTEMPT_ID_REUSED"));
  }
  expect(app.verifyAndAcceptCreate({ ...input, attemptId: id() })).toEqual(error("A_OTP_ATTEMPTS_EXCEEDED"));
  expect(app.usedSlots(email)).toBe(0);
});

it("TC-OWNER-19/31/32: expires at ten minutes and using OTP does not shorten cooldown", () => {
  const early = fixture();
  const live = early.issue();
  early.advance(10 * minute - 1);
  expect(early.app.verifyAndAcceptCreate(live)).toEqual({ status: "accepted" });
  const before = early.app.readTestMailbox();
  expect(early.app.requestCreateStoreOtp({ ...baseForm, requestId: early.id(), intentId: crypto.randomUUID() }, ip).ok).toBe(true);
  expect(early.app.readTestMailbox()).toEqual(before);
  early.advance(1);
  early.issue();
  expect(early.app.readTestMailbox()).toHaveLength(1);

  const late = fixture();
  const expired = late.issue();
  late.advance(10 * minute);
  expect(late.app.verifyAndAcceptCreate(expired)).toEqual(error("A_OTP_EXPIRED"));
  expect(late.app.usedSlots(email)).toBe(0);
});

it("TC-OWNER-45/46: duplicate verify calls accept one operation and bind the attempt to its scope", async () => {
  const { app, issue, id } = fixture();
  const first = issue();
  const other = issue({ ...baseForm, email: "owner.b@example.com" });
  const competing = { ...other, attemptId: first.attemptId };
  const result = await Promise.all([
    Promise.resolve().then(() => app.verifyAndAcceptCreate(first)),
    Promise.resolve().then(() => app.verifyAndAcceptCreate(first)),
    Promise.resolve().then(() => app.verifyAndAcceptCreate(competing)),
  ]);
  expect(result).toEqual([{ status: "accepted" }, { status: "accepted" }, error("A_ATTEMPT_ID_REUSED")]);
  expect(app.verifyAndAcceptCreate({ ...first, attemptId: id(), code: alternateCode(first.code) }))
    .toEqual({ status: "accepted" });
  expect(app.readOperations()).toHaveLength(1);
  expect(app.usedSlots(email)).toBe(1);
  expect(app.usedSlots(other.createInput.email)).toBe(0);
  expect(app.readTestMailbox()).toHaveLength(2);
});

it("TC-OWNER-48: filling one operation's replay IDs leaves another operation's retry available", () => {
  const { app, issue, id, advance } = fixture();
  const first = issue();
  const second = issue({ ...baseForm, email: "owner.b@example.com" });
  expect(app.verifyAndAcceptCreate(first)).toEqual({ status: "accepted" });
  expect(app.verifyAndAcceptCreate(second)).toEqual({ status: "accepted" });
  expect(app.worker.failDefinitively(second.attemptId)).toBe(true);
  const firstReplay = { ...first, attemptId: id() };
  expect(app.verifyAndAcceptCreate(firstReplay)).toEqual({ status: "accepted" });
  for (let i = 1; i < 64; i++) {
    expect(app.verifyAndAcceptCreate({ ...first, attemptId: id() })).toEqual({ status: "accepted" });
  }
  expect(app.verifyAndAcceptCreate({ ...first, attemptId: id() })).toEqual(error("CREATE_VERIFY_UNAVAILABLE"));
  expect(app.verifyAndAcceptCreate({ ...second, attemptId: id() })).toEqual({ status: "failed" });
  advance(151 * minute);
  expect(app.getCreateStatus({ attemptId: firstReplay.attemptId })).toEqual({ status: "unknown" });
  expect(app.verifyAndAcceptCreate({ ...second, attemptId: id() })).toEqual({ status: "failed" });
  expect(app.readOperations()).toHaveLength(2);
});

it.each([false, true])("TC-OWNER-08: lookup after deadline is read-only (Auth reference present: %s)", authCreated => {
  const { app, issue, advance, id } = fixture({ processingMs: 15_000, existingStores: fourStores });
  const input = issue();
  // The client loses the verify response. A fresh caller only knows this ID.
  const attemptId = input.attemptId;
  app.verifyAndAcceptCreate(input);
  if (authCreated) expect(app.worker.recordAuthCreated(attemptId, "mock-auth-O1")).toBe(true);
  const before = app.readOperations();
  expect(before).toEqual([expect.objectContaining({ status: "accepted" })]);
  expect(app.getCreateStatus({ attemptId })).toEqual({ status: "accepted" });
  advance(15_001);
  const mailbox = app.readTestMailbox();
  expect(app.getCreateStatus({ attemptId })).toEqual({ status: "unknown" });
  expect(app.getCreateStatus({ attemptId })).toEqual({ status: "unknown" });
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "unknown" });
  expect(app.worker.recordAuthCreated(attemptId, "late-auth")).toBe(false);
  expect(app.worker.complete(attemptId)).toBe(false);
  expect(app.worker.failDefinitively(attemptId)).toBe(false);
  expect(app.readOperations()).toEqual(before);
  expect(app.readTestMailbox()).toEqual(mailbox);
  expect(app.usedSlots(email)).toBe(5);

  advance(10 * minute);
  const next = issue();
  expect(app.verifyAndAcceptCreate(next)).toEqual(error("OWNER_STORE_LIMIT_REACHED"));
  expect(app.requestCreateStoreOtp({ ...baseForm, intentId: input.intentId, requestId: id() }, ip).ok).toBe(true);
  expect(app.readTestMailbox()).toEqual([expect.objectContaining({ intentId: next.intentId })]);
  expect(app.readOperations()).toEqual(before);
});

it("TC-OWNER-29/33/48: definite failure releases once; completion converts one reserved slot", () => {
  const { app, issue, advance, id } = fixture({ processingMs: 20 * minute, existingStores: fourStores });
  const first = issue();
  expect(app.verifyAndAcceptCreate(first)).toEqual({ status: "accepted" });
  advance(10 * minute);
  const next = issue();
  expect(app.verifyAndAcceptCreate(next)).toEqual(error("OWNER_STORE_LIMIT_REACHED"));
  expect(app.worker.failDefinitively(first.attemptId)).toBe(true);
  expect(app.worker.failDefinitively(first.attemptId)).toBe(false);
  expect(app.getCreateStatus({ attemptId: first.attemptId })).toEqual({ status: "failed" });
  expect(app.verifyAndAcceptCreate({ ...first, attemptId: id() })).toEqual({ status: "failed" });
  expect(app.usedSlots(email)).toBe(4);
  expect(app.verifyAndAcceptCreate(next)).toEqual(error("OWNER_STORE_LIMIT_REACHED"));
  const retry = { ...next, attemptId: id() };
  expect(app.verifyAndAcceptCreate(retry)).toEqual({ status: "accepted" });
  expect(app.worker.recordAuthCreated(retry.attemptId, "mock-auth-O2")).toBe(true);
  expect(app.worker.failDefinitively(retry.attemptId)).toBe(false);
  expect(app.usedSlots(email)).toBe(5);
  expect(app.worker.complete(retry.attemptId)).toBe(true);
  expect(app.worker.complete(retry.attemptId)).toBe(false);
  expect(app.getCreateStatus({ attemptId: retry.attemptId })).toEqual({ status: "created" });
  expect(app.verifyAndAcceptCreate(retry)).toMatchObject({ status: "created", storeKey: expect.any(String) });
  expect(app.usedSlots(email)).toBe(5);
});

it("TC-OWNER-07/81: allows five creations on the same day and counts suspended stores", () => {
  const { app, issue, advance } = fixture();
  for (let count = 1; count <= 5; count++) {
    const input = issue();
    expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "accepted" });
    expect(app.worker.recordAuthCreated(input.attemptId, `auth-${count}`)).toBe(true);
    expect(app.worker.complete(input.attemptId)).toBe(true);
    expect(app.usedSlots(email)).toBe(count);
    advance(10 * minute);
  }
  expect(app.verifyAndAcceptCreate(issue())).toEqual(error("OWNER_STORE_LIMIT_REACHED"));
  const suspended = fixture({ existingStores: [...fourStores, { email, status: "active" }] });
  expect(suspended.app.verifyAndAcceptCreate(suspended.issue())).toEqual(error("OWNER_STORE_LIMIT_REACHED"));
});

it("TC-OWNER-106: lookup handles a late request, a final refusal and an expired unknown ID", () => {
  const { app, issue, advance, id } = fixture();
  const input = issue();
  expect(app.getCreateStatus({ attemptId: input.attemptId, code: input.code })).toEqual(error("A_REQUEST_INVALID"));
  expect(app.getCreateStatus({ attemptId: "malformed" })).toEqual(error("A_REQUEST_INVALID"));
  expect(app.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "unconfirmed" });
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "accepted" });
  expect(app.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "accepted" });
  const late = id(-30 * minute);
  expect(app.getCreateStatus({ attemptId: late })).toEqual({ status: "unconfirmed" });
  advance(1);
  expect(app.getCreateStatus({ attemptId: late })).toEqual({ status: "not_accepted" });
  expect(app.verifyAndAcceptCreate({ ...issue({ ...baseForm, email: "other@example.com" }), attemptId: late }))
    .toMatchObject(error("A_REQUEST_ID_STALE"));
  advance(91 * minute);
  expect(app.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "unknown" });
  expect(app.readOperations()).toHaveLength(1);
});

it("TC-OWNER-106: future attempt marker is singular and survives until its ID is stale", () => {
  const { app, issue, advance, id } = fixture();
  const input = issue();
  const ordinaryRefusal = { ...input, attemptId: id(), code: alternateCode(input.code) };
  expect(app.verifyAndAcceptCreate(ordinaryRefusal)).toEqual(error("A_OTP_INVALID"));
  const first = { ...input, attemptId: id(120 * minute) };
  expect(app.getCreateStatus({ attemptId: first.attemptId })).toEqual({ status: "unconfirmed" });
  expect(app.verifyAndAcceptCreate(first)).toMatchObject(error("A_REQUEST_ID_STALE"));
  expect(app.getCreateStatus({ attemptId: first.attemptId })).toEqual({ status: "not_accepted" });
  for (let i = 0; i < 19; i++) {
    expect(app.verifyAndAcceptCreate({ ...input, attemptId: id(31 * minute) })).toEqual(error("CREATE_VERIFY_UNAVAILABLE"));
    const tooFar = id(120 * minute + 1);
    expect(app.verifyAndAcceptCreate({ ...input, attemptId: tooFar })).toEqual(error("A_REQUEST_INVALID"));
    expect(app.getCreateStatus({ attemptId: tooFar })).toEqual(error("A_REQUEST_INVALID"));
  }
  advance(91 * minute);
  const next = issue();
  expect(app.verifyAndAcceptCreate(ordinaryRefusal)).toMatchObject(error("A_REQUEST_ID_STALE"));
  expect(app.verifyAndAcceptCreate({ ...next, attemptId: first.attemptId })).toEqual(error("A_ATTEMPT_ID_REUSED"));
  advance(59 * minute);
  expect(app.verifyAndAcceptCreate({ ...next, attemptId: first.attemptId })).toEqual(error("A_ATTEMPT_ID_REUSED"));
  advance(1);
  expect(app.verifyAndAcceptCreate({ ...next, attemptId: first.attemptId })).toMatchObject(error("A_REQUEST_ID_STALE"));
  expect(app.getCreateStatus({ attemptId: first.attemptId })).toEqual({ status: "not_accepted" });
  expect(app.usedSlots(email)).toBe(0);
  expect(app.readOperations()).toEqual([]);
});

it("TC-OWNER-02/05/10/38: only the accepted proof can receive the same Store Key until saved", () => {
  const { app, issue, id } = fixture({ autoComplete: true });
  const input = issue({ ...baseForm, address: "12 Lê Lợi" });
  const created = app.verifyAndAcceptCreate(input);
  expect(created).toEqual({ status: "created", storeNo: 42, storeKey: expect.stringMatching(/^42-[A-Z0-9]{32}$/) });
  if (!("storeKey" in created)) throw new Error("Expected Store Key");
  expect(app.verifyAndAcceptCreate(input)).toEqual(created);
  expect(app.getCreateStatus({ attemptId: input.attemptId })).toEqual({ status: "created" });
  expect(app.verifyAndAcceptCreate({ ...input, attemptId: id() })).toEqual({ status: "created" });
  expect(app.confirmStoreKeySaved(input)).toEqual({ status: "closed" });
  expect(app.confirmStoreKeySaved({ ...input, attemptId: id(), code: alternateCode(input.code) })).toEqual({ status: "closed" });
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "created" });
  expect(app.readStoreKeyMail()).toEqual([{
    email, displayName: "Quán A", address: "12 Lê Lợi", storeKey: created.storeKey, status: "sent",
  }]);
  expect(app.usedSlots(email)).toBe(1);
});

it("TC-OWNER-26/82: five wrong receive proofs close the window without changing the creation", () => {
  const { app, issue } = fixture({ autoComplete: true });
  const input = issue();
  expect(app.verifyAndAcceptCreate(input)).toHaveProperty("storeKey");
  expect(app.confirmStoreKeySaved({ ...input, createInput: { ...baseForm, ownerPin: "111111" } }))
    .toEqual(error("CONFIRM_REJECTED"));
  for (let i = 0; i < 4; i++) {
    expect(app.verifyAndAcceptCreate({ ...input, code: alternateCode(input.code) })).toEqual({ status: "created" });
  }
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "created" });
  expect(app.confirmStoreKeySaved(input)).toEqual({ status: "closed" });
  expect(app.readStoreKeyMail()).toHaveLength(1);
});

it("TC-OWNER-36/44: worker finishing after OTP expiry queues one key mail; failure keeps the store", () => {
  const { app, issue, advance } = fixture({ failKeyMail: true });
  const input = issue();
  advance(10 * minute - 2_000);
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "accepted" });
  advance(7_000);
  expect(app.worker.recordAuthCreated(input.attemptId, "mock-auth")).toBe(true);
  expect(app.worker.complete(input.attemptId)).toBe(true);
  expect(app.worker.complete(input.attemptId)).toBe(false);
  expect(app.verifyAndAcceptCreate(input)).toEqual({ status: "created" });
  expect(app.readStoreKeyMail()).toEqual([expect.objectContaining({ status: "queued" })]);
  app.worker.deliverQueuedKeys();
  app.worker.deliverQueuedKeys();
  expect(app.readStoreKeyMail()).toEqual([expect.objectContaining({ status: "failed" })]);
  expect(app.usedSlots(email)).toBe(1);
});

it.each([1, 2])("R06-A: explicit retry preserves committed seed stages (%s menu failures)", async failures => {
  const { app, issue } = fixture({ autoComplete: true });
  const result = app.verifyAndAcceptCreate(issue({ ...baseForm, seedDemo: true }));
  if (!("storeKey" in result)) throw new Error("Expected Store Key");
  const state = createMockPermissionState();
  state.paired = false;
  const runtime = createMockPermissionRuntime(state, {
    async pair(key) {
      const store = app.pairMockStore(key);
      if (!store) throw new Error("Invalid Store Key");
      return store;
    },
    async checkPin(key, pin) { return app.checkMockOwnerPin(key, pin); },
    failSeedMenuAttempts: failures,
  });
  await expect(runtime.auth.createStore({ displayName: "Bypass", seedDemo: false }))
    .rejects.toMatchObject({ code: "CREATE_PROOF_REQUIRED" });
  expect(await runtime.auth.getStoreSession()).toBeNull();
  await expect(runtime.auth.pairStore("42-INVALID")).rejects.toThrow("Invalid Store Key");
  expect(await runtime.auth.getStoreSession()).toBeNull();
  await runtime.auth.pairStore(result.storeKey);
  const owner = state.employees[0];
  await expect(runtime.initialSeed.getStatus()).rejects.toMatchObject({ code: "EMPLOYEE_SESSION_REQUIRED" });
  await expect(runtime.session.startSession(owner.id, "111111")).rejects.toMatchObject({ code: "INVALID_PIN" });
  expect(await runtime.session.startSession(owner.id, baseForm.ownerPin)).toMatchObject({ kind: "normal", pinChangeRequired: false });
  const initial = await runtime.initialSeed.getStatus();
  const first = await runtime.initialSeed.begin({ mode: "initial", expectedWorkflowRevision: initial.workflowRevision });
  await runtime.initialSeed.runStage({ runGeneration: first.runGeneration, stage: "employee" });
  await expect(runtime.initialSeed.runStage({ runGeneration: first.runGeneration, stage: "menu" }))
    .rejects.toMatchObject({ code: "PERMISSION_UPDATE_UNAVAILABLE" });
  const failed = await runtime.initialSeed.getStatus();
  expect(failed).toMatchObject({ status: "needs_retry", autoEligible: false });
  const cashier = state.employees.find(row => row.role === "cashier");
  if (!cashier || !state.session) throw new Error("Expected owner session and committed cashier");
  cashier.name = "Thu ngân đã chỉnh";
  const second = app.verifyAndAcceptCreate(issue({ ...baseForm, email: "other@example.com" }));
  if (!("storeKey" in second)) throw new Error("Expected second Store Key");
  await runtime.auth.pairStore(second.storeKey);
  await runtime.auth.pairStore(result.storeKey);
  await runtime.session.startSession(owner.id, baseForm.ownerPin);
  expect(await runtime.initialSeed.getStatus()).toEqual(failed);
  if (!state.session) throw new Error("Expected owner session after re-pairing");
  state.session.expiresAt = state.now() - 1;
  await expect(runtime.initialSeed.begin({ mode: "retry", expectedWorkflowRevision: failed.workflowRevision }))
    .rejects.toMatchObject({ code: "EMPLOYEE_SESSION_REQUIRED" });
  await runtime.session.startSession(owner.id, baseForm.ownerPin);
  if (failures === 2) {
    await expect(runtime.seed.retrySeedDemo(state.storeId)).rejects.toMatchObject({ code: "PERMISSION_UPDATE_UNAVAILABLE" });
    expect((await runtime.initialSeed.getStatus()).stages[0]).toEqual(failed.stages[0]);
    expect(app.usedSlots(email)).toBe(1);
  }
  await runtime.seed.retrySeedDemo(state.storeId);
  const finished = await runtime.initialSeed.getStatus();
  expect(finished.status).toBe("completed");
  expect(finished.stages[0]).toEqual(failed.stages[0]);
  expect(state.employees.filter(row => row.role === "cashier")).toEqual([cashier]);
  expect(cashier.name).toBe("Thu ngân đã chỉnh");
  expect(app.usedSlots(email)).toBe(1);
  await expect(runtime.session.changeOwnPin({
    requestId: crypto.randomUUID(), expectedRevision: 0, currentPin: baseForm.ownerPin, newPin: "538271",
  })).rejects.toMatchObject({ code: "FORBIDDEN" });
  expect(app.checkMockOwnerPin(result.storeKey, baseForm.ownerPin)).toBe(true);
  expect(app.checkMockOwnerPin(result.storeKey, "538271")).toBe(false);
});
