import { createHmac, randomBytes, randomInt, randomUUID } from "node:crypto";
import { ownerRequestIdTimestamp, parseOwnerCreateForm, UUID_V4, UUID_V7 } from "../../core/ownerCreateInput";
import type {
  ConfirmStoreKeyResponse, CreateOperationStatus, CreateVerifyError, GetCreateStatusResponse,
  MockProvisionedStore, OwnerCreateForm, VerifyCreateResponse,
} from "../../domain/ownerCreate";
import { createMockOwnerOtpServer } from "./ownerOtpServer";

const minute = 60_000;
const freshWindow = 30 * minute;
const futureLimit = 120 * minute;
const attemptRetention = 90 * minute;
const wrongLimit = 5;
const maxPassiveOutcomes = 4_000;
const maxReplayIdsPerOperation = 64;

type OperationStatus = Exclude<CreateOperationStatus, "unknown">;
type ErrorCode = Exclude<CreateVerifyError, "A_REQUEST_ID_STALE">;
type Failure = Extract<VerifyCreateResponse, { ok: false }>;
type Operation = {
  attemptId: string; intentId: string; email: string; status: OperationStatus; deadline: number; authRef?: string;
};
type AcceptedProof = {
  displayName: string; address: string; seedDemo: boolean; pinDigest: string;
  otpDigest: string; expiresAt: number; wrongReceives: number; closed: boolean;
  store?: MockProvisionedStore & { storeKey: string };
};
type KeyMail = { email: string; displayName: string; address: string; storeKey: string; status: "queued" | "sent" | "failed" };
type Rejection = {
  intentId: string; email: string; result: Failure; retainThrough: number;
  comparedCode?: string; challengeRef?: string; skewMarker?: string;
};
type Fixture = {
  now?: () => number;
  processingMs?: number;
  storeLimit?: number;
  sendOutcomeLimit?: number;
  autoComplete?: boolean;
  fixtureOtp?: () => string;
  failKeyMail?: boolean;
  existingStores?: readonly { email: string; status: "active" | "suspended" }[];
};

const reject = <Code extends ErrorCode | "CONFIRM_REJECTED">(code: Code) => ({ ok: false as const, code });

/** In-memory contract model for Node tests. Worker controls are local fixture actions. */
export function createMockOwnerProvisioning({
  now = Date.now, processingMs = 10 * minute, storeLimit = 5, sendOutcomeLimit, existingStores = [],
  autoComplete = false, fixtureOtp, failKeyMail = false,
}: Fixture = {}) {
  const byIntent = new Map<string, Operation>();
  const byAttempt = new Map<string, Operation>();
  const replayedOperations = new Map<string, Operation>();
  const replayIdCounts = new WeakMap<Operation, number>();
  // OTP failures and skew markers are already bounded per issued challenge.
  const rejections = new Map<string, Rejection>();
  // Bound outcomes that can be generated without using an OTP attempt.
  const passiveRejections = new Map<string, Rejection>();
  const skewMarkers = new Set<string>();
  const wrongByChallenge = new Map<string, { count: number; expiresAt: number }>();
  const otp = createMockOwnerOtpServer(now, sendOutcomeLimit, intentId => byIntent.get(intentId)?.email, fixtureOtp);
  const proofKey = randomBytes(32);
  const proof = (code: string) => createHmac("sha256", proofKey).update(code).digest("hex");
  const acceptedProofs = new WeakMap<Operation, AcceptedProof>();
  const storesByKey = new Map<string, AcceptedProof>();
  const keyMail: KeyMail[] = [];
  let nextStoreNo = 42;
  const storedOwners = existingStores.map(store => store.email.trim().toLowerCase());

  function usedSlots(email: string) {
    const owned = storedOwners.filter(owner => owner === email).length;
    return owned + [...byIntent.values()].filter(op => op.email === email && op.status !== "failed").length;
  }

  function statusOf(op: Operation, time: number): { status: OperationStatus | "unknown" } {
    return { status: op.status === "accepted" && time >= op.deadline ? "unknown" : op.status };
  }

  function receiptIsOpen(proof: AcceptedProof, time: number) {
    return !proof.closed && time < proof.expiresAt && proof.wrongReceives < wrongLimit;
  }

  function checkReceipt(op: Operation, accepted: AcceptedProof, code: string, form: OwnerCreateForm) {
    const matches = accepted.otpDigest === proof(code) && otp.matchesIntentForm(op.intentId, form);
    if (!matches) accepted.wrongReceives += 1;
    return matches;
  }

  function resultForAttempt(op: Operation, attemptId: string, time: number, code: string, form: OwnerCreateForm): VerifyCreateResponse {
    const accepted = acceptedProofs.get(op);
    if (op.status === "created" && op.attemptId === attemptId && accepted?.store && receiptIsOpen(accepted, time)
      && checkReceipt(op, accepted, code, form)) {
      return { status: "created", storeNo: accepted.store.storeNo, storeKey: accepted.store.storeKey };
    }
    return statusOf(op, time);
  }

  function prune(time: number) {
    for (const cache of [rejections, passiveRejections]) {
      for (const [id, row] of cache) {
        if (row.retainThrough >= time) continue;
        cache.delete(id);
        if (row.skewMarker) skewMarkers.delete(row.skewMarker);
      }
    }
    for (const [ref, row] of wrongByChallenge) {
      if (row.expiresAt <= time) wrongByChallenge.delete(ref);
    }
  }

  function verifyAndAcceptCreate(input: unknown): VerifyCreateResponse {
    if (!input || typeof input !== "object") return reject("A_REQUEST_INVALID");
    const { attemptId: rawAttempt, intentId: rawIntent, code, createInput } = input as Record<string, unknown>;
    const parsed = parseOwnerCreateForm(createInput);
    if (typeof rawAttempt !== "string" || !UUID_V7.test(rawAttempt)
      || typeof rawIntent !== "string" || !UUID_V4.test(rawIntent) || !parsed.ok) {
      return reject("A_REQUEST_INVALID");
    }
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) return reject("A_OTP_FORMAT_INVALID");
    const attemptId = rawAttempt.toLowerCase();
    const intentId = rawIntent.toLowerCase();
    const { form } = parsed;
    const { email } = form;
    const time = now();
    const skew = ownerRequestIdTimestamp(attemptId) - time;
    if (skew > futureLimit) return reject("A_REQUEST_INVALID");

    prune(time);
    const stale = { ok: false, code: "A_REQUEST_ID_STALE", serverNow: time } as const;
    const linked = byAttempt.get(attemptId) ?? replayedOperations.get(attemptId);
    const previous = rejections.get(attemptId) ?? passiveRejections.get(attemptId);
    const bound = linked ?? previous;
    const operation = byIntent.get(intentId);
    const challenge = otp.readChallenge(previous?.intentId ?? intentId);
    const wrong = challenge ? wrongByChallenge.get(challenge.reference)?.count ?? 0 : 0;
    const countWrong = () => {
      if (challenge && time < challenge.expiresAt && wrong < wrongLimit
        && !byIntent.has(previous?.intentId ?? intentId)) {
        wrongByChallenge.set(challenge.reference, { count: wrong + 1, expiresAt: challenge.expiresAt });
      }
    };

    if (bound && (bound.email !== email || bound.intentId !== intentId)) {
      if (previous?.comparedCode && previous.challengeRef === challenge?.reference) countWrong();
      return reject("A_ATTEMPT_ID_REUSED");
    }
    if (linked) return resultForAttempt(linked, attemptId, time, code, form);
    if (previous?.skewMarker) return { ...previous.result };
    if (previous) {
      if (!previous.comparedCode || previous.comparedCode === proof(code)) return { ...previous.result };
      if (previous.challengeRef === challenge?.reference) countWrong();
      return reject("A_ATTEMPT_ID_REUSED");
    }
    if (operation?.email === email) {
      if (skew < -freshWindow) return stale;
      const replayIdCount = replayIdCounts.get(operation) ?? 0;
      if (skew > freshWindow || replayIdCount >= maxReplayIdsPerOperation) {
        return reject("CREATE_VERIFY_UNAVAILABLE");
      }
      // A replay may read the same operation but does not become its accepted attempt.
      replayedOperations.set(attemptId, operation);
      replayIdCounts.set(operation, replayIdCount + 1);
      return statusOf(operation, time);
    }

    if (skew < -freshWindow) return stale;

    const remember = (
      cache: Map<string, Rejection>, result: Failure, comparedCode?: string, skewMarker?: string,
    ) => {
      cache.set(attemptId, {
        intentId, email, result, comparedCode, skewMarker, challengeRef: challenge?.reference,
        retainThrough: Math.max(time + attemptRetention, time + skew + freshWindow),
      });
      return { ...result };
    };

    if (skew > freshWindow) {
      if (!challenge || challenge.email !== email || time >= challenge.expiresAt || wrong >= wrongLimit
        || skewMarkers.has(challenge.reference)) return reject("CREATE_VERIFY_UNAVAILABLE");
      skewMarkers.add(challenge.reference);
      return remember(rejections, stale, undefined, challenge.reference);
    }
    const rememberPassive = (reason: ErrorCode, comparedCode?: string) => {
      if (passiveRejections.size >= maxPassiveOutcomes) return reject("CREATE_VERIFY_UNAVAILABLE");
      return remember(passiveRejections, reject(reason), comparedCode);
    };
    if (!challenge || challenge.email !== email || operation) return rememberPassive("A_OTP_UNAVAILABLE");
    if (time >= challenge.expiresAt) return rememberPassive("A_OTP_EXPIRED");
    if (wrong >= wrongLimit) return rememberPassive("A_OTP_ATTEMPTS_EXCEEDED");

    const rememberWrong = (reason: ErrorCode) => {
      countWrong();
      return remember(rejections, reject(reason), proof(code));
    };
    if (challenge.code !== code) return rememberWrong("A_OTP_INVALID");
    if (!otp.matchesIntentForm(intentId, form)) return rememberWrong("CREATE_INTENT_CONFLICT");
    if (usedSlots(email) >= storeLimit) return rememberPassive("OWNER_STORE_LIMIT_REACHED", proof(code));

    // Both indexes are written in the same synchronous turn as the quota check.
    const newOperation: Operation = { attemptId, intentId, email, status: "accepted", deadline: time + processingMs };
    acceptedProofs.set(newOperation, {
      displayName: form.displayName, address: form.address, seedDemo: form.seedDemo,
      pinDigest: proof(`pin:${form.ownerPin}`), otpDigest: proof(code),
      expiresAt: challenge.expiresAt, wrongReceives: 0, closed: false,
    });
    byIntent.set(intentId, newOperation);
    byAttempt.set(attemptId, newOperation);
    if (autoComplete) {
      worker.recordAuthCreated(attemptId, randomUUID());
      worker.complete(attemptId);
      worker.deliverQueuedKeys();
    }
    return resultForAttempt(newOperation, attemptId, time, code, form);
  }

  function confirmStoreKeySaved(input: unknown): ConfirmStoreKeyResponse {
    if (!input || typeof input !== "object") return reject("A_REQUEST_INVALID");
    const { attemptId, intentId, code, createInput } = input as Record<string, unknown>;
    const parsed = parseOwnerCreateForm(createInput);
    if (typeof attemptId !== "string" || !UUID_V7.test(attemptId)
      || typeof intentId !== "string" || !UUID_V4.test(intentId)
      || typeof code !== "string" || !/^\d{6}$/.test(code) || !parsed.ok) return reject("A_REQUEST_INVALID");
    const op = byIntent.get(intentId.toLowerCase());
    const accepted = op && acceptedProofs.get(op);
    if (!op || !accepted?.store || op.email !== parsed.form.email) return reject("CONFIRM_REJECTED");
    if (!receiptIsOpen(accepted, now())) return { status: "closed" };
    if (op.attemptId !== attemptId.toLowerCase() || !checkReceipt(op, accepted, code, parsed.form)) {
      return reject("CONFIRM_REJECTED");
    }
    accepted.closed = true;
    return { status: "closed" };
  }

  function getCreateStatus(input: unknown): GetCreateStatusResponse {
    if (!input || typeof input !== "object") return reject("A_REQUEST_INVALID");
    const keys = Object.keys(input);
    if (keys.length !== 1 || keys[0] !== "attemptId") return reject("A_REQUEST_INVALID");
    const { attemptId: rawAttempt } = input as Record<string, unknown>;
    if (typeof rawAttempt !== "string" || !UUID_V7.test(rawAttempt)) return reject("A_REQUEST_INVALID");
    const attemptId = rawAttempt.toLowerCase();
    const time = now();
    const skew = ownerRequestIdTimestamp(attemptId) - time;
    if (skew > futureLimit) return reject("A_REQUEST_INVALID");
    const op = byAttempt.get(attemptId) ?? replayedOperations.get(attemptId);
    if (op) return statusOf(op, time);
    const recorded = rejections.get(attemptId) ?? passiveRejections.get(attemptId);
    const final = (recorded && recorded.retainThrough >= time) || skew < -freshWindow;
    return { status: final ? "not_accepted" : "unconfirmed" };
  }

  function liveOperation(attemptId: string) {
    const op = byAttempt.get(attemptId);
    return op?.status === "accepted" && now() < op.deadline ? op : undefined;
  }

  const worker = {
    recordAuthCreated(attemptId: string, authRef: string) {
      const op = liveOperation(attemptId);
      if (!op || op.authRef || !authRef) return false;
      op.authRef = authRef;
      return true;
    },
    complete(attemptId: string) {
      const op = liveOperation(attemptId);
      if (!op?.authRef) return false;
      const accepted = acceptedProofs.get(op);
      if (!accepted) return false;
      const storeNo = nextStoreNo++;
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const storeKey = `${storeNo}-${Array.from({ length: 32 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
      accepted.store = {
        storeId: randomUUID(), storeNo, storeKey,
        displayName: accepted.displayName, address: accepted.address, seedDemo: accepted.seedDemo,
      };
      storesByKey.set(storeKey, accepted);
      op.status = "created";
      keyMail.push({ email: op.email, displayName: accepted.displayName, address: accepted.address, storeKey, status: "queued" });
      return true;
    },
    deliverQueuedKeys() {
      for (const mail of keyMail) {
        if (mail.status === "queued") mail.status = failKeyMail ? "failed" : "sent";
      }
    },
    failDefinitively(attemptId: string) {
      const op = liveOperation(attemptId);
      if (!op || op.authRef) return false;
      op.status = "failed";
      return true;
    },
  };

  function pairMockStore(storeKey: unknown): MockProvisionedStore | undefined {
    const store = typeof storeKey === "string" ? storesByKey.get(storeKey)?.store : undefined;
    if (!store) return undefined;
    const { storeId, storeNo, displayName, address, seedDemo } = store;
    return { storeId, storeNo, displayName, address, seedDemo };
  }

  function checkMockOwnerPin(storeKey: unknown, pin: unknown) {
    return typeof storeKey === "string" && typeof pin === "string" && /^\d{6}$/.test(pin)
      && storesByKey.get(storeKey)?.pinDigest === proof(`pin:${pin}`);
  }

  return {
    readServerTime: now,
    requestCreateStoreOtp: otp.request,
    readTestMailbox: otp.readTestMailbox,
    verifyAndAcceptCreate,
    getCreateStatus,
    confirmStoreKeySaved,
    pairMockStore,
    checkMockOwnerPin,
    worker,
    readOperations: () => [...byAttempt.values()].map(op => ({ ...op })),
    readStoreKeyMail: () => keyMail.map(mail => ({ ...mail })),
    usedSlots,
  };
}
