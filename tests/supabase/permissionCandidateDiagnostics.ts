import type { Page, Request, Response, TestInfo } from "@playwright/test";
import pg from "pg";
import { STORE_IDS } from "../../scripts/permission-identity-runtime.mjs";
import { assertActivatedCandidate, candidateEnvironment } from "./permissionCandidateEnvironment.ts";

// Only these finite values leave the private test process. Names remain in
// memory for equality comparisons; a worker restart deliberately loses them.
let persistedName: string | undefined;
const yes = (value: boolean) => value ? 2 : 1;
const equal = (left: string | undefined, right: string | undefined) => left === undefined || right === undefined ? 0 : yes(left === right);
export const diagnosticFields = ["dbReadState", "apiReadState", "dbSuffix", "apiSuffix", "apiEqualsDb", "dbEqualsPersist", "apiEqualsPersist",
  "dbEqualsPreclear", "apiEqualsPreclear", "inputSuffix", "inputEqualsPreclear", "drawerVisible", "inputVisible", "cancelDialog", "savePending",
  "drawerCount", "inputCount", "sectionOrdinal", "queryState", "dirty", "requestFailedCount", "settingsReadPending"] as const;
type Observation = Record<typeof diagnosticFields[number], number> & { checkpointOrdinal: number };
const blank = (checkpointOrdinal: number) => Object.assign(Object.fromEntries(diagnosticFields.map(key => [key, 0])), { checkpointOrdinal }) as Observation;

// Read-only, exact fixture/store guard, no application mutation or new session.
// A refused or unavailable probe remains ERROR; it never changes the test result.
async function readOwnedSettings(): Promise<string> {
  const env = candidateEnvironment();
  const db = new pg.Client({ connectionString: env.dsn, connectionTimeoutMillis: 1_000, query_timeout: 1_000, statement_timeout: 1_000 });
  db.on("error", () => {}); // An unavailable diagnostic connection cannot crash the worker.
  const deadline = setTimeout(() => { void db.end().catch(() => {}); }, 2_000);
  try {
    await db.connect();
    await db.query("begin isolation level repeatable read read only");
    await assertActivatedCandidate(db, env);
    const result = await db.query("select display_name from public.store_settings where store_id=$1", [STORE_IDS[0]]);
    if (result.rows.length !== 1 || typeof result.rows[0].display_name !== "string") throw new Error("CANDIDATE_DIAGNOSTIC_READ_REFUSED");
    await db.query("commit");
    return result.rows[0].display_name;
  } finally { clearTimeout(deadline); await db.end().catch(() => {}); }
}

function rpcName(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== "http://127.0.0.1:62421" || parsed.search || parsed.hash) return null;
    return /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(parsed.pathname)?.[1] ?? null;
  } catch { return null; }
}

export function readCandidateDom(preclear: string | undefined) {
  const all = (id: string) => [...document.querySelectorAll(`[data-testid="${id}"]`)];
  const visible = (element: Element | undefined) => !!element && !!element.getClientRects().length && getComputedStyle(element).visibility !== "hidden";
  const flag = (value: boolean) => value ? 2 : 1;
  const count = (elements: Element[]) => Math.min(elements.length, 2) + 1;
  const drawers = all("settings-drawer"), inputs = all("settings-name-input"), drawer = drawers[0], input = inputs[0] as HTMLInputElement | undefined;
  const save = all("save-settings-button")[0];
  const section = all("settings-section-info")[0]?.classList.contains("border-pos-primaryLine") ? 1
    : all("settings-section-demo")[0]?.classList.contains("border-pos-primaryLine") ? 2
    : all("settings-section-bill")[0]?.classList.contains("border-pos-primaryLine") ? 3 : 0;
  return { drawerCount: count(drawers), inputCount: count(inputs), drawerVisible: flag(visible(drawer)), inputVisible: flag(visible(input)),
    inputSuffix: input ? flag(/E2E$/.test(input.value)) : 0, inputEqualsPreclear: input && preclear !== undefined ? flag(input.value === preclear) : 0,
    sectionOrdinal: section, cancelDialog: flag([...document.querySelectorAll("h3")].some(element => element.textContent === "Bỏ thay đổi?" && visible(element))),
    dirty: drawer ? flag(all("settings-dirty-badge").length > 0) : 0,
    savePending: save ? flag(save.textContent === "Đang lưu...") : 0,
    queryState: all("settings-error-state").length ? 2 : drawer && [...drawer.querySelectorAll("p")].some(element => element.textContent === "Đang tải cài đặt...") ? 1 : 0 };
}

export class CandidateDiagnostics {
  private observations: Observation[] = [];
  private milestoneOrdinal = 0;
  private generation = 0;
  private readGenerations = new Map<Request, number>();
  private pendingReads = new Set<Request>();
  private responseTasks = new Set<Promise<void>>();
  private failedRequests = 0;
  private observedSettingsRead = false;
  private apiState = 0;
  private apiName: string | undefined;
  private preclearName: string | undefined;
  private page: Page;
  private readSettings: () => Promise<string>;
  constructor(page: Page, readSettings: () => Promise<string> = readOwnedSettings) {
    this.page = page;
    this.readSettings = readSettings;
    page.on("request", this.onRequest);
    page.on("requestfailed", this.onRequestFailed);
    page.on("response", this.onResponse);
  }
  mark(ordinal: number) { if (Number.isInteger(ordinal) && ordinal >= 1 && ordinal <= 31) this.milestoneOrdinal = ordinal; }
  private onRequest = (request: Request) => {
    const name = rpcName(request.url());
    if (["update_store_settings", "permission_run_initial_seed_stage", "clear_demo_data"].includes(name ?? "")) {
      this.generation++; this.apiState = 0; this.apiName = undefined;
    }
    if (name === "permission_get_settings_admin") {
      this.observedSettingsRead = true;
      this.pendingReads.add(request); this.readGenerations.set(request, this.generation);
    }
  };
  private onRequestFailed = (request: Request) => {
    if (!rpcName(request.url())) return;
    this.failedRequests++;
    if (this.pendingReads.delete(request) && this.readGenerations.get(request) === this.generation) { this.apiState = 2; this.apiName = undefined; }
    this.readGenerations.delete(request);
  };
  private onResponse = (response: Response) => {
    if (rpcName(response.url()) !== "permission_get_settings_admin") return;
    const task = this.readResponse(response).catch(() => {}).finally(() => this.responseTasks.delete(task));
    this.responseTasks.add(task);
  };
  private async readResponse(response: Response) {
    const request = response.request(), generation = this.readGenerations.get(request);
    try {
      const bytes = await response.body();
      if (bytes.byteLength > 16_384) throw new Error("CANDIDATE_DIAGNOSTIC_RESPONSE_REFUSED");
      const value = JSON.parse(bytes.toString("utf8"));
      if (generation !== this.generation) return;
      if (!response.ok() || value?.ok !== true || typeof value?.data?.displayName !== "string") throw new Error("CANDIDATE_DIAGNOSTIC_RESPONSE_REFUSED");
      this.apiState = 1; this.apiName = value.data.displayName;
    } catch { if (generation === this.generation) { this.apiState = 2; this.apiName = undefined; } }
    finally { this.pendingReads.delete(request); this.readGenerations.delete(request); }
  }
  async checkpoint(checkpointOrdinal: 1 | 2 | 3 | 4 | 5) {
    if (this.observations.some(row => row.checkpointOrdinal === checkpointOrdinal)) return;
    const row = blank(checkpointOrdinal); this.observations.push(row);
    let dbName: string | undefined;
    if (checkpointOrdinal !== 5) {
      try { dbName = await this.readSettings(); row.dbReadState = 1; }
      catch { row.dbReadState = 2; }
    }
    if (checkpointOrdinal === 1 && dbName !== undefined) persistedName = dbName;
    if (checkpointOrdinal === 3 && dbName !== undefined) this.preclearName = dbName;
    row.dbSuffix = dbName === undefined ? 0 : yes(/E2E$/.test(dbName));
    row.dbEqualsPersist = equal(dbName, persistedName); row.dbEqualsPreclear = equal(dbName, this.preclearName);
    // Passive API observations only. Before seed the new page has no employee
    // session: UNKNOWN is intentional; diagnostics must not log in/mint one.
    row.apiReadState = this.pendingReads.size ? 0 : this.apiState;
    const apiName = row.apiReadState === 1 ? this.apiName : undefined;
    row.apiSuffix = apiName === undefined ? 0 : yes(/E2E$/.test(apiName));
    row.apiEqualsDb = equal(apiName, dbName); row.apiEqualsPersist = equal(apiName, persistedName); row.apiEqualsPreclear = equal(apiName, this.preclearName);
    row.requestFailedCount = Math.min(this.failedRequests, 2) + 1;
    row.settingsReadPending = this.observedSettingsRead ? yes(this.pendingReads.size > 0) : 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // The race returns data, never a delayed mutation of an already-exported row.
      const facts = await Promise.race([this.page.evaluate(readCandidateDom, this.preclearName),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("CANDIDATE_DIAGNOSTIC_DOM_UNAVAILABLE")), 1_000); })]);
      Object.assign(row, facts);
    }
    catch { /* Closed/timed-out page keeps UNKNOWN. */ }
    finally { clearTimeout(timer); }
    if (row.queryState === 0 && row.drawerVisible === 2 && this.observedSettingsRead)
      row.queryState = this.pendingReads.size ? 3 : this.apiState === 1 ? 4 : 0;
  }
  async finish(testInfo: TestInfo) {
    try {
      if (["failed", "timedOut", "interrupted"].includes(testInfo.status ?? "")) await this.checkpoint(5);
      const ordinals = ["candidate activation supports owner roster, floor, payment and first receipt preview",
        "owner permission change reaches a live cashier context within five seconds", "owner creates waiter and real UI hides protected administration and reporting",
        "owner persists menu, floor and store settings changes through real candidate RPCs", "four active roles have protected navigation parity with server authorization",
        "owner clears demo data through UI and refetch preserves custom records"];
      await testInfo.attach("candidate-e2e-diagnostics", { body: Buffer.from(JSON.stringify({ schemaVersion: "candidate-e2e-diagnostics-v1",
        testOrdinal: ordinals.indexOf(testInfo.title) + 1, milestoneOrdinal: this.milestoneOrdinal, observations: this.observations })), contentType: "application/json" });
    } catch { /* Probe/attachment failures must never mask the original test. */ }
    finally {
      this.page.off("request", this.onRequest); this.page.off("requestfailed", this.onRequestFailed); this.page.off("response", this.onResponse);
      this.apiName = undefined; this.preclearName = undefined;
    }
  }
}
