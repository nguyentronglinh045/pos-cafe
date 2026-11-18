import type { Request } from "@playwright/test";
import type { EmployeeAdminView, EmployeeAuditEntry } from "../../src/domain";

// A dispatched POST can still commit after the UI times out. Only a terminal RPC
// reply lets cleanup accept an unchanged baseline without finding an applied audit.
export async function cashierUpdateConfirmed(request: Pick<Request, "response">, targetId: string): Promise<boolean> {
  async function readReply() {
    const response = await request.response();
    if (!response?.ok()) return false;
    const reply = await response.json();
    if (reply?.ok === false) return typeof reply.error?.code === "string";
    return reply?.ok === true && ["applied", "replayed", "noop"].includes(reply.outcome) && reply.data?.id === targetId;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      readReply().catch(() => false),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), 5_000); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Playwright serializes this function into the owner page. Keep runtime imports inside it.
export async function restoreCashierOverrides({ original, requestId, responseConfirmed }: {
  original: Pick<EmployeeAdminView, "id" | "permissionRevision" | "overrides">;
  requestId: string;
  responseConfirmed: boolean;
}): Promise<void> {
  const runtimeUrl = "/src/app/runtimePorts.ts";
  const { createAppPortsFromViteEnv }: typeof import("../../src/app/runtimePorts") = await import(/* @vite-ignore */ runtimeUrl);
  const { employeeAdmin, authority } = createAppPortsFromViteEnv().permission!;
  const originalOverrides = JSON.stringify(original.overrides);
  const settledEmployee = responseConfirmed ? await employeeAdmin.getEmployee(original.id) : undefined;
  if (settledEmployee && JSON.stringify(settledEmployee.overrides) === originalOverrides) return;

  let applied: EmployeeAuditEntry | undefined;
  let cursor: string | undefined;
  const visited = new Set<string>();
  while (!applied) {
    const page = await employeeAdmin.listAudit({ targetId: original.id, outcome: "applied", limit: 10, cursor });
    applied = page.rows.find(row => row.targetId === original.id && row.outcome === "applied" && row.requestId === requestId);
    if (applied) break;
    if (!page.nextCursor || visited.has(page.nextCursor)) {
      throw new Error("Could not verify the smoke permission update in the cashier audit. Check the fixture manually.");
    }
    cursor = page.nextCursor;
    visited.add(cursor);
  }

  // With a lost reply, read after seeing the audit so a pre-commit baseline cannot win.
  const current = settledEmployee ?? await employeeAdmin.getEmployee(original.id);
  const currentOverrides = JSON.stringify(current.overrides);
  if (currentOverrides === originalOverrides) return;
  if (current.permissionRevision !== original.permissionRevision + 1 ||
      applied.actualAfter?.permissionRevision !== current.permissionRevision ||
      JSON.stringify(applied.actualAfter.overrides) !== currentOverrides) {
    throw new Error("The cashier no longer matches the smoke audit. Check the fixture before restoring permissions.");
  }
  const { catalog } = await authority.getAuthority();
  const restored = await employeeAdmin.updateEmployee({
    requestId: crypto.randomUUID(), targetId: original.id, expectedRevision: current.permissionRevision,
    expectedCatalogRevision: catalog.revision, patch: { overrides: original.overrides },
  });
  if (!restored.ok || JSON.stringify((await employeeAdmin.getEmployee(original.id)).overrides) !== originalOverrides) {
    throw new Error("Could not confirm restoration of the original cashier overrides. Check the fixture manually.");
  }
}
