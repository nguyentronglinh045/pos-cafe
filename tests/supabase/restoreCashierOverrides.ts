import type { EmployeeAdminView } from "../../src/domain";

// Playwright serializes this function into the owner page. Keep runtime imports inside it.
export async function restoreCashierOverrides({ original, requestId }: {
  original: Pick<EmployeeAdminView, "id" | "permissionRevision" | "overrides">;
  requestId: string;
}): Promise<void> {
  const runtimeUrl = "/src/app/runtimePorts.ts";
  const { createAppPortsFromViteEnv }: typeof import("../../src/app/runtimePorts") = await import(/* @vite-ignore */ runtimeUrl);
  const { employeeAdmin, authority } = createAppPortsFromViteEnv().permission!;
  const current = await employeeAdmin.getEmployee(original.id);
  const originalOverrides = JSON.stringify(original.overrides);
  const currentOverrides = JSON.stringify(current.overrides);
  if (currentOverrides === originalOverrides) return;

  if (current.permissionRevision !== original.permissionRevision + 1) {
    throw new Error("The cashier revision changed outside the smoke test. Check the fixture before restoring permissions.");
  }

  let cursor: string | undefined;
  const visited = new Set<string>();
  for (;;) {
    const page = await employeeAdmin.listAudit({ targetId: original.id, outcome: "applied", limit: 10, cursor });
    const applied = page.rows.find(row => row.targetId === original.id && row.outcome === "applied" && row.requestId === requestId);
    if (applied) {
      if (applied.actualAfter?.permissionRevision !== current.permissionRevision ||
          JSON.stringify(applied.actualAfter.overrides) !== currentOverrides) {
        throw new Error("The cashier no longer matches the smoke audit. Check the fixture before restoring permissions.");
      }
      break;
    }
    if (!page.nextCursor || visited.has(page.nextCursor)) {
      throw new Error("Could not verify the smoke permission update in the cashier audit. Check the fixture manually.");
    }
    cursor = page.nextCursor;
    visited.add(cursor);
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
