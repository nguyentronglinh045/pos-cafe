type Fields = Record<string, unknown>;
type Phase = "dispatch" | "probe" | "publish" | "finish";
type Outcome = "confirmed" | "transport_not_called" | "ambiguous" | "probe_failed" | "database_failed";

export type RotationAuth = {
  changePassword(storeId: string, password: string): Promise<boolean>;
  verifyPassword(storeId: string, storeNo: number, password: string): Promise<boolean>;
};

type Dependencies = {
  auth: RotationAuth;
  rpc(name: string, args?: Fields): Promise<unknown>;
  decryptCandidate(ciphertext: string, version: number, binding: string): Promise<string>;
  accessTokenTtlSeconds: number;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
const asFields = (value: unknown): Fields =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};

export const rotationCandidateBinding = (storeId: string, attemptId: string) =>
  JSON.stringify(["store-key-rotation", storeId, attemptId]);

// The database claim is the only authority to start a password update.
export async function runStoreKeyRotation(deps: Dependencies, target?: string, expectedRotationId?: string) {
  const storeId = target ?? await deps.rpc("owner_next_store_key_rotation");
  if (!isId(storeId)) return null;

  const job = asFields(await deps.rpc("owner_claim_store_key_rotation", {
    p_store: storeId, ...(expectedRotationId ? { p_expected_rotation: expectedRotationId } : {}),
  }));
  const { id, generation, attempt, dispatchToken, runToken, phase } = job;
  if (job.storeId !== storeId || !isId(id) || !isId(dispatchToken) || !isId(runToken)
    || typeof generation !== "string" || !/^[1-9][0-9]*$/.test(generation)
    || typeof attempt !== "number" || !Number.isSafeInteger(attempt) || attempt < 1
    || (phase !== "dispatch" && phase !== "probe" && phase !== "publish" && phase !== "finish")) return null;
  const args = {
    p_store: storeId, p_rotation: id, p_generation: generation, p_attempt: attempt,
    p_dispatch: dispatchToken, p_run: runToken,
  };
  async function report(outcome: Outcome) {
    const stored = asFields(await deps.rpc("owner_report_store_key_rotation", { ...args, p_outcome: outcome }));
    return stored.status === "confirmed" || stored.status === "recorded" ? stored.status : null;
  }

  if (phase === "publish" || phase === "finish") {
    let value: Fields;
    try {
      value = asFields(await deps.rpc("owner_advance_store_key_rotation", {
        ...args, p_access_token_ttl_seconds: phase === "publish" ? deps.accessTokenTtlSeconds : null,
      }));
    } catch {
      return await report("database_failed");
    }
    if (value.ok === false) return await report("database_failed");
    return value.status === "applied" || value.status === "completed" ? value.status : null;
  }

  let password: string;
  try {
    if (typeof job.ciphertext !== "string" || typeof job.version !== "number" || !isId(job.acceptedAttemptId)) {
      throw new Error("Missing rotation envelope");
    }
    password = await deps.decryptCandidate(job.ciphertext, job.version,
      rotationCandidateBinding(storeId, job.acceptedAttemptId));
    if (!/^[A-Z0-9]{32}$/.test(password)) throw new Error("Invalid rotation envelope");
  } catch {
    return await report(phase === "dispatch" ? "transport_not_called" : "probe_failed");
  }

  if (phase === "probe" && (typeof job.storeNo !== "number" || !Number.isSafeInteger(job.storeNo)
    || job.storeNo < 1)) return await report("probe_failed");
  let confirmed = false;
  try {
    confirmed = phase === "dispatch" ? await deps.auth.changePassword(storeId, password)
      : await deps.auth.verifyPassword(storeId, job.storeNo as number, password);
  } catch {
    // A transport or response failure never grants another password update.
  }
  return await report(confirmed ? "confirmed" : phase === "dispatch" ? "ambiguous" : "probe_failed");
}
