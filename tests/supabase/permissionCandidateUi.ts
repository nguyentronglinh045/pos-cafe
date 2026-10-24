import { expect, type Page } from "@playwright/test";

export interface CandidateDrawerDriver {
  visible(id: string): Promise<boolean>;
  clickClose(id: string, name: string): Promise<void>;
  hidden(id: string): Promise<void>;
  floorVisible(): Promise<void>;
}

// A visible floor is not evidence that its overlaid drawer has unmounted.
export async function closeCandidateDrawer(driver: CandidateDrawerDriver) {
  for (const [id, name] of [["menu-editor", "Thoát"], ["floor-editor", "Huỷ"], ["settings-drawer", "Huỷ"]]) {
    if (!await driver.visible(id)) continue;
    await driver.clickClose(id, name);
    await driver.hidden(id);
    await driver.floorVisible();
    return;
  }
  throw new Error("SUPPORTED_DRAWER_NOT_VISIBLE");
}

export const closeCandidateDrawerFromPage = (page: Page) => closeCandidateDrawer({
  visible: id => page.getByTestId(id).isVisible(),
  clickClose: (id, name) => page.getByTestId(id).locator("header").getByRole("button", { name, exact: true }).click(),
  hidden: async id => { await expect(page.getByTestId(id)).toBeHidden(); await expect(page.getByTestId(id)).toHaveCount(0); },
  floorVisible: async () => { await expect(page.getByTestId("floor-view")).toBeVisible(); },
});

export interface CandidateSaveDriver {
  completedLabel(button: string, label: string): Promise<void>;
  noDirtyBadge(badge: string): Promise<void>;
  disabled(button: string): Promise<void>;
}

// Pending alone also disables Save. The completed label AND absent dirty badge
// prove the application's mutation callback accepted its saved draft.
export async function waitForCandidateSave(driver: CandidateSaveDriver, rpc: string) {
  const controls: Record<string, [string, string, string]> = {
    apply_menu_changes: ["save-menu-button", "menu-dirty-badge", "Lưu menu"],
    apply_floor_changes: ["save-floor-button", "floor-dirty-badge", "Lưu sơ đồ"],
    update_store_settings: ["save-settings-button", "settings-dirty-badge", "Lưu cài đặt"],
  };
  const control = controls[rpc];
  if (!control) return;
  const [button, badge, label] = control;
  await driver.completedLabel(button, label);
  await driver.noDirtyBadge(badge);
  await driver.disabled(button);
}

export const waitForCandidateSaveFromPage = (page: Page, rpc: string) => waitForCandidateSave({
  completedLabel: async (button, label) => { await expect(page.getByTestId(button)).toHaveText(label); },
  noDirtyBadge: async badge => { await expect(page.getByTestId(badge)).toHaveCount(0); },
  disabled: async button => { await expect(page.getByTestId(button)).toBeDisabled(); },
}, rpc);

export interface CandidateSettingsPreconditionDriver {
  login(): Promise<void>;
  open(): Promise<void>;
  readName(): Promise<string>;
  fillName(name: string): Promise<void>;
  save(): Promise<void>;
  recordPersist(): Promise<void>;
  close(): Promise<void>;
  expectName(name: string): Promise<void>;
  resetToPasscode(): Promise<void>;
}

// Explicit per-test custom state, established through the normal owner UI/RPC
// before requesting initial seed. It cannot inherit an earlier case's success.
export async function establishCandidateClearSettings(driver: CandidateSettingsPreconditionDriver) {
  await driver.login(); await driver.open();
  const previous = await driver.readName();
  const name = previous === "Clear preservation A E2E" ? "Clear preservation B E2E" : "Clear preservation A E2E";
  await driver.fillName(name); await driver.save(); await driver.recordPersist();
  await driver.close(); await driver.open(); await driver.expectName(name); await driver.close();
  // Reload drops the memory-only employee session before the pending workflow
  // is requested. The existing second owner login runs the three seed stages.
  await driver.resetToPasscode();
  return name;
}
