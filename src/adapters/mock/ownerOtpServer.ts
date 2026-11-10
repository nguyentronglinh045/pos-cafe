import { createHmac, randomBytes, randomInt, randomUUID } from "node:crypto";
import { ownerRequestIdTimestamp, parseOwnerCreateForm, UUID_V4, UUID_V7 } from "../../core/ownerCreateInput";
import type { CreateStoreOtpReceipt, CreateStoreOtpResponse, OwnerCreateForm } from "../../domain/ownerCreate";

const minute = 60_000;
const day = 24 * 60 * minute;
const vietnamDay = (ms: number) => Math.floor((ms + 7 * 60 * minute) / day);

export function createMockOwnerOtpServer(
  now = Date.now,
  maxOutcomes = 4_000,
  acceptedOwner: (intentId: string) => string | undefined = () => undefined,
  makeCode = () => String(randomInt(1_000_000)).padStart(6, "0"),
) {
  const commitmentKey = randomBytes(32);
  const outbox: Array<{ email: string; code: string; intentId: string; issuedAt: number }> = [];
  const sends: Array<{ email: string; ip: string; at: number }> = [];
  const outcomes = new Map<string, {
    email: string; intentId: string; expiresAt: number; receipt: CreateStoreOtpReceipt;
  }>();
  const intents = new Map<string, {
    email: string; commitment: string; expiresAt: number;
    challenge: { reference: string; code: string; expiresAt: number };
  }>();

  const commitForm = (form: OwnerCreateForm) =>
    createHmac("sha256", commitmentKey).update(JSON.stringify(form)).digest("hex");

  function matchesIntentForm(intentId: string, form: OwnerCreateForm) {
    return intents.get(intentId)?.commitment === commitForm(form);
  }

  function request(input: unknown, ip: string): CreateStoreOtpResponse {
    const parsed = parseOwnerCreateForm(input);
    if (!parsed.ok) return { ok: false, code: parsed.code };
    const { requestId: rawRequestId, intentId: rawIntentId } = input as Record<string, unknown>;
    if (typeof rawRequestId !== "string" || !UUID_V7.test(rawRequestId)
      || typeof rawIntentId !== "string" || !UUID_V4.test(rawIntentId)) {
      return { ok: false, code: "A_REQUEST_INVALID" };
    }
    const requestId = rawRequestId.toLowerCase();
    const intentId = rawIntentId.toLowerCase();
    const { form } = parsed;
    const { email } = form;
    const time = now();
    // Normal FIFO expiry. Check the individual entry below as well for clock jumps.
    let oldest = outcomes.entries().next();
    while (!oldest.done && oldest.value[1].expiresAt <= time) {
      outcomes.delete(oldest.value[0]);
      oldest = outcomes.entries().next();
    }
    intents.forEach((record, id) => { if (record.expiresAt <= time) intents.delete(id); });
    while (sends[0]?.at < time - day) sends.shift();
    while (outbox[0]?.issuedAt <= time - 10 * minute) outbox.shift();

    const previous = outcomes.get(requestId);
    if (previous && previous.expiresAt > time) {
      return previous.email === email && previous.intentId === intentId
        ? { ok: true, receipt: { ...previous.receipt } }
        : { ok: false, code: "A_REQUEST_ID_REUSED" };
    }
    if (previous) outcomes.delete(requestId);
    const timestamp = ownerRequestIdTimestamp(requestId);
    if (Math.abs(time - timestamp) > 30 * minute) {
      return { ok: false, code: "A_REQUEST_ID_STALE", serverNow: time };
    }
    const intent = intents.get(intentId);
    const operationOwner = acceptedOwner(intentId);
    const boundOwner = operationOwner ?? intent?.email;
    if (boundOwner !== undefined && boundOwner !== email) return { ok: false, code: "CREATE_INTENT_ID_REUSED" };
    // Reject new work before any send if a receipt cannot be retained for 90 minutes.
    if (outcomes.size >= maxOutcomes) return { ok: false, code: "A_SEND_UNAVAILABLE" };

    const own = sends.filter(send => send.email === email);
    const last = own[own.length - 1];
    const cooldown = (last?.at ?? -Infinity) + 10 * minute;
    const today = sends.filter(send => vietnamDay(send.at) === vietnamDay(time));
    const eligible = operationOwner === undefined && cooldown <= time
      && own.filter(send => send.at > time - 15 * minute).length < 3
      && today.filter(send => send.email === email).length < 10
      && sends.filter(send => send.ip === ip && send.at > time - 60 * minute).length < 10
      && today.length < 400;
    const receipt: CreateStoreOtpReceipt = {
      challengeRef: randomUUID(),
      emailDisplay: email,
      resendNotBefore: cooldown > time ? cooldown : time + 10 * minute,
      serverNow: time,
    };
    if (eligible) {
      const code = makeCode();
      intents.set(intentId, {
        email,
        commitment: intent?.commitment ?? commitForm(form),
        expiresAt: time + 100 * minute,
        challenge: { reference: receipt.challengeRef, code, expiresAt: time + 10 * minute },
      });
      sends.push({ email, ip, at: time });
      outbox.push({ email, intentId, issuedAt: time, code });
    }
    outcomes.set(requestId, { email, intentId, expiresAt: time + 90 * minute, receipt });
    return { ok: true, receipt: { ...receipt } };
  }

  function readChallenge(intentId: string) {
    const intent = intents.get(intentId);
    if (intent && intent.expiresAt > now()) return { email: intent.email, ...intent.challenge };
  }

  return { request, readChallenge, matchesIntentForm, readTestMailbox: () => outbox.map(mail => ({ ...mail })) };
}
