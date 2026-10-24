import type { Page, Request, Response, TestInfo, Frame } from "@playwright/test";
import pg from "pg";
import { STORE_IDS } from "../../scripts/permission-identity-runtime.mjs";
import { assertActivatedCandidate, candidateEnvironment } from "./permissionCandidateEnvironment.ts";

// Only these finite values leave the private test process. Each test owns its
// memory-only comparison baseline; a previous case cannot supply its precondition.
const yes = (value: boolean) => value ? 2 : 1;
const equal = (left: string | undefined, right: string | undefined) => left === undefined || right === undefined ? 0 : yes(left === right);
export const diagnosticFields = ["dbReadState", "apiReadState", "dbSuffix", "apiSuffix", "apiEqualsDb", "dbEqualsPersist", "apiEqualsPersist",
  "dbEqualsPreclear", "apiEqualsPreclear", "inputSuffix", "inputEqualsPreclear", "drawerVisible", "inputVisible", "cancelDialog", "savePending",
  "drawerCount", "inputCount", "sectionOrdinal", "queryState", "dirty", "requestFailedCount", "settingsReadPending"] as const;
type Observation = Record<typeof diagnosticFields[number], number> & { checkpointOrdinal: number };
const blank = (checkpointOrdinal: number) => Object.assign(Object.fromEntries(diagnosticFields.map(key => [key, 0])), { checkpointOrdinal }) as Observation;
type ImageTarget = { phaseOrdinal: 1 | 2; itemId: string; url: string };
export const imageDiagnosticFields = ["phaseOrdinal", "observed", "selectionCount", "selectionMatches", "imageCount", "srcMatches", "decoded"] as const;
const unknownImage = (phaseOrdinal: number) => ({ phaseOrdinal, observed: 0, selectionCount: 0, selectionMatches: 0, imageCount: 0, srcMatches: 0, decoded: 0 });
export const consumerDiagnosticFields = ["phaseOrdinal", "observed", "cardCount", "nativeImgCount", "roleImgCount", "placeholderCount", "placeholderVisible"] as const;
const unknownConsumer = (phaseOrdinal: number) => ({ phaseOrdinal, observed: 0, cardCount: 0, nativeImgCount: 0, roleImgCount: 0, placeholderCount: 0, placeholderVisible: 0 });
export async function readCandidateConsumerDom(page: Page, itemId: string, phaseOrdinal: number) {
  const card = page.getByTestId(`menu-item-${itemId}`), n = await card.count();
  const row = { ...unknownConsumer(phaseOrdinal), observed: 1, cardCount: Math.min(n, 2) + 1 };
  if (n !== 1) return row;
  const placeholder = card.getByTestId("menu-image-placeholder");
  const [native, role, fallback] = await Promise.all([card.locator("img").count(), card.getByRole("img").count(), placeholder.count()]);
  row.nativeImgCount = Math.min(native, 2) + 1; row.roleImgCount = Math.min(role, 2) + 1;
  row.placeholderCount = Math.min(fallback, 2) + 1;
  if (fallback === 1) row.placeholderVisible = await placeholder.isVisible() ? 2 : 1;
  if (await card.count() !== 1) throw new Error("CANDIDATE_CONSUMER_CARD_CHANGED");
  return row;
}

export function readCandidateImageDom(target: ImageTarget) {
  const cards = [...document.querySelectorAll('[data-testid^="menu-edit-card-"]')];
  const selected = cards.filter(card => card.classList.contains("border-pos-primary"));
  const images = [...document.querySelectorAll('[data-testid="menu-editor-detail-pane"] img')] as HTMLImageElement[];
  const image = images.length === 1 ? images[0] : undefined;
  const yes = (value: boolean) => value ? 2 : 1;
  return { phaseOrdinal: target.phaseOrdinal, observed: 1, selectionCount: Math.min(selected.length, 2) + 1,
    selectionMatches: yes(selected.length === 1 && selected[0].getAttribute("data-testid") === `menu-edit-card-${target.itemId}`),
    imageCount: Math.min(images.length, 2) + 1, srcMatches: image ? yes(image.getAttribute("src") === target.url) : 0,
    decoded: image ? yes(image.complete && image.naturalWidth > 0) : 0 };
}

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
  private persistedName: string | undefined;
  private imageTarget: ImageTarget | undefined;
  private consumerTarget: { phaseOrdinal: number; itemId: string } | undefined;
  private page: Page;
  private readSettings: () => Promise<string>;
  constructor(page: Page, readSettings: () => Promise<string> = readOwnedSettings) {
    this.page = page;
    this.readSettings = readSettings;
    page.on("request", this.onRequest);
    page.on("requestfailed", this.onRequestFailed);
    page.on("response", this.onResponse);
    page.on("framenavigated", this.onFrameNavigated);
  }
  mark(ordinal: number) { if (Number.isInteger(ordinal) && ordinal >= 1 && ordinal <= 31) this.milestoneOrdinal = ordinal; }
  expectMenuImage(phaseOrdinal: 1 | 2, itemId: string, url: string) { this.imageTarget = { phaseOrdinal, itemId, url }; }
  clearMenuImage() { this.imageTarget = undefined; }
  expectConsumerImage(phaseOrdinal: number, itemId: string) {
    if (Number.isInteger(phaseOrdinal) && phaseOrdinal >= 1 && phaseOrdinal <= 7) this.consumerTarget = { phaseOrdinal, itemId };
  }
  clearConsumerImage() { this.consumerTarget = undefined; }
  private onFrameNavigated = (frame: Frame) => {
    if (frame !== this.page.mainFrame()) return;
    this.generation++; this.apiState = 0; this.apiName = undefined; this.observedSettingsRead = false;
    this.pendingReads.clear(); this.readGenerations.clear();
  };
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
    if (checkpointOrdinal === 1 && dbName !== undefined) this.persistedName = dbName;
    if (checkpointOrdinal === 3 && dbName !== undefined) this.preclearName = dbName;
    row.dbSuffix = dbName === undefined ? 0 : yes(/E2E$/.test(dbName));
    row.dbEqualsPersist = equal(dbName, this.persistedName); row.dbEqualsPreclear = equal(dbName, this.preclearName);
    // Passive API observations only. Before seed the new page has no employee
    // session: UNKNOWN is intentional; diagnostics must not log in/mint one.
    row.apiReadState = this.pendingReads.size ? 0 : this.apiState;
    const apiName = row.apiReadState === 1 ? this.apiName : undefined;
    row.apiSuffix = apiName === undefined ? 0 : yes(/E2E$/.test(apiName));
    row.apiEqualsDb = equal(apiName, dbName); row.apiEqualsPersist = equal(apiName, this.persistedName); row.apiEqualsPreclear = equal(apiName, this.preclearName);
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
      // Successful cases leave no diagnostic attachment. Their complete result
      // identity/state/attempt still comes from the ordinary reporter inventory.
      if (!["failed", "timedOut", "interrupted"].includes(testInfo.status ?? "")) return;
      await this.checkpoint(5);
      let image: ReturnType<typeof unknownImage> | null = null;
      if (this.imageTarget) {
        image = unknownImage(this.imageTarget.phaseOrdinal);
        let timer: ReturnType<typeof setTimeout> | undefined;
        try { image = await Promise.race([this.page.evaluate(readCandidateImageDom, this.imageTarget),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("CANDIDATE_IMAGE_DIAGNOSTIC_UNAVAILABLE")), 1_000); })]); }
        catch { /* Closed/unavailable DOM stays UNKNOWN, never an observed zero. */ }
        finally { clearTimeout(timer); }
      }
      let consumer: ReturnType<typeof unknownConsumer> | null = null;
      if (this.consumerTarget) {
        const target = this.consumerTarget;
        consumer = unknownConsumer(target.phaseOrdinal);
        let timer: ReturnType<typeof setTimeout> | undefined;
        try { consumer = await Promise.race([readCandidateConsumerDom(this.page, target.itemId, target.phaseOrdinal),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("CANDIDATE_CONSUMER_DIAGNOSTIC_UNAVAILABLE")), 1_000); })]); }
        catch { /* Unavailable or nonsettling probes keep UNKNOWN. */ }
        finally { clearTimeout(timer); }
      }
      const ordinals = ["candidate activation supports owner roster, floor, payment and first receipt preview",
        "owner permission change reaches a live cashier context within five seconds", "owner creates waiter and real UI hides protected administration and reporting",
        "owner persists menu, floor and store settings changes through real candidate RPCs", "four active roles have protected navigation parity with server authorization",
        "owner clears demo data through UI and refetch preserves custom records"];
      await testInfo.attach("candidate-e2e-diagnostics", { body: Buffer.from(JSON.stringify({ schemaVersion: "candidate-e2e-diagnostics-v3",
        testOrdinal: ordinals.indexOf(testInfo.title) + 1, milestoneOrdinal: this.milestoneOrdinal, observations: this.observations, image, consumer })), contentType: "application/json" });
    } catch { /* Probe/attachment failures must never mask the original test. */ }
    finally {
      this.page.off("request", this.onRequest); this.page.off("requestfailed", this.onRequestFailed); this.page.off("response", this.onResponse);
      this.page.off("framenavigated", this.onFrameNavigated);
      // A response body can still be pending after its listener is removed.
      // Invalidate its captured generation before clearing private state.
      this.generation++; this.apiState = 0; this.observedSettingsRead = false; this.failedRequests = 0;
      this.apiName = undefined; this.preclearName = undefined; this.persistedName = undefined; this.imageTarget = undefined; this.consumerTarget = undefined;
      this.observations = []; this.pendingReads.clear(); this.readGenerations.clear(); this.responseTasks.clear();
    }
  }
}
