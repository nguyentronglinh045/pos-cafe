import type { ComponentType } from "react";
import { useStoreDisplayQuery } from "@/features/pos/usePosData";
import { RemakeThemeProvider } from "@/theme/RemakeThemeProvider";
import { useAppStore, type DrawerModule } from "../useAppStore";
import { EmployeesStubDrawer } from "../drawers/admin/EmployeesDrawer";
import { FloorEditorDrawer } from "../drawers/admin/FloorEditorDrawer";
import { GeneralSettingsDrawer } from "../drawers/admin/GeneralSettingsDrawer";
import { MenuEditorDrawer } from "../drawers/admin/MenuEditorDrawer";
import { OrderHistoryDrawer } from "../drawers/admin/OrderHistoryDrawer";
import { PaymentSettingsDrawer } from "../drawers/admin/PaymentSettingsDrawer";
import { ReportDrawer } from "../drawers/admin/ReportDrawer";
import { OrderDrawer } from "../drawers/pos/OrderDrawer";
import { PaymentDrawer } from "../drawers/pos/PaymentDrawer";
import { TakeawayDrawer } from "../drawers/pos/TakeawayDrawer";
import { WriteRecoveryDrawer } from "../drawers/pos/WriteRecoveryDrawer";
import { ReceiptPreviewPopup } from "../components/ReceiptPreview";
import { FloorWorkspace } from "./FloorWorkspace";
import { LeftNav } from "./LeftNav";
import { usePermissionSession } from "@/features/shared/permissionSession";
import { drawerAllowed } from "../permissionUi";

const DRAWER_REGISTRY: Record<NonNullable<DrawerModule>, ComponentType> = {
  order: OrderDrawer,
  payment: PaymentDrawer,
  takeaway: TakeawayDrawer,
  writeRecovery: WriteRecoveryDrawer,
  menuEditor: MenuEditorDrawer,
  floorEditor: FloorEditorDrawer,
  report: ReportDrawer,
  orderHistory: OrderHistoryDrawer,
  employees: EmployeesStubDrawer,
  settings: GeneralSettingsDrawer,
  paymentSettings: PaymentSettingsDrawer,
};

export function AppShell() {
  const settings = useStoreDisplayQuery();
  const drawer = useAppStore((state) => state.drawer);
  const context = useAppStore(state => state.orderContext);
  const authority = usePermissionSession();
  const ActiveDrawer = drawer && drawerAllowed(authority.bundle, drawer, context) ? DRAWER_REGISTRY[drawer] : null;

  return (
    <RemakeThemeProvider><main
      className="app-frame [@media(orientation:portrait)]:!hidden"
      data-testid="app-shell"
      style={authority.status !== "verified" ? { visibility: "hidden", pointerEvents: "none" } : undefined}
      aria-hidden={authority.status !== "verified"}
    >
      <LeftNav storeName={settings.data?.displayName} />

      <>
        <FloorWorkspace />
        {ActiveDrawer ? <ActiveDrawer /> : null}
        <ReceiptPreviewPopup />
      </>
    </main></RemakeThemeProvider>
  );
}
