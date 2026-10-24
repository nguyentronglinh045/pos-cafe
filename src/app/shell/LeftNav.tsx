import toast from "react-hot-toast";
import { canAccessModule, type AppModule } from "@/core/guards";
import { useAppStore, type DrawerModule } from "../useAppStore";
import { RemakeIcon } from "../components/RemakeIcon";

export function LeftNav({ storeName = "" }: { storeName?: string }) {
  const currentEmployee = useAppStore((s) => s.currentEmployee);
  const drawer = useAppStore((s) => s.drawer);
  const closeDrawer = useAppStore((s) => s.closeDrawer);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const setCurrentEmployee = useAppStore((s) => s.setCurrentEmployee);
  const setScreen = useAppStore((s) => s.setScreen);
  const roleLabel: Record<string, string> = { admin: "Quản lý", cashier: "Thu ngân", kitchen: "Bếp" };
  const currentRoleLabel = currentEmployee ? roleLabel[currentEmployee.role] ?? currentEmployee.role : "";
  const signedInLabel = currentEmployee ? `Đang đăng nhập: ${currentEmployee.name} · ${currentRoleLabel}` : "";
  const guardedOpen = (module: Exclude<DrawerModule, null>, guard: AppModule) => {
    if (!canAccessModule(currentEmployee, guard)) { toast.error("Nhân viên không có quyền dùng chức năng này."); return; }
    openDrawer(module);
  };
  const entries: { module: Exclude<DrawerModule, null> | null; id: string; label: string; icon: string; guard?: AppModule }[] = [
    { module: null, id: "floor", label: "Sơ đồ bàn", icon: "floor" },
    { module: "writeRecovery", id: "write-recovery", label: "Tra cứu thao tác", icon: "order" },
    { module: "takeaway", id: "takeaway", label: "Bán mang đi", icon: "order" },
    { module: "orderHistory", id: "order-history", label: "Lịch sử đơn", icon: "order", guard: "orderHistory" },
    { module: "menuEditor", id: "menu-editor", label: "Thực đơn", icon: "coffee", guard: "menuEditor" },
    { module: "employees", id: "employees", label: "Nhân viên", icon: "users", guard: "employees" },
    { module: "floorEditor", id: "floor-editor", label: "Sơ đồ cửa hàng", icon: "floor", guard: "floorEditor" },
    { module: "report", id: "report", label: "Báo cáo", icon: "chart", guard: "report" },
    { module: "paymentSettings", id: "payment-settings", label: "Cấu hình thanh toán", icon: "order", guard: "settings" },
    { module: "settings", id: "settings", label: "Cài đặt", icon: "settings", guard: "settings" },
  ];
  return <aside className="sidebar" data-testid="b01-sidebar">
    <div className="brand"><span className="brand-mark"><RemakeIcon name="coffee"/></span><div className="brand-copy"><strong>POS Café</strong><p><span className="status-dot"/><span title={storeName}>{storeName}</span></p><small>Không gian bán hàng</small></div></div>
    <nav className="navigation" aria-label="POS modules">
      {entries.map(({ module, id, label, icon, guard }) => <button key={id} className="nav-button" data-testid={`nav-${id}`} aria-label={label} title={label} aria-current={drawer === module ? "page" : undefined} disabled={guard ? !canAccessModule(currentEmployee, guard) : false} onClick={() => module === null ? closeDrawer() : guard ? guardedOpen(module, guard) : openDrawer(module)}>
        <RemakeIcon name={icon}/><span className="nav-label">{label}</span>
      </button>)}
    </nav>
    <footer className="sidebar-footer">
      {currentEmployee && <div className="session" data-testid="left-nav-session" data-employee-id={currentEmployee.id} data-role={currentEmployee.role} aria-label={signedInLabel} title={signedInLabel}>
        <span className="avatar">{currentEmployee.name.trim().charAt(0).toUpperCase() || "?"}</span><div className="session-copy"><strong>{currentEmployee.name}</strong><span>{currentRoleLabel}</span></div>
      </div>}
      <button className="nav-button lock-button" data-testid="nav-lock" aria-label="Khoá" title="Khoá" onClick={() => { setCurrentEmployee(null); closeDrawer(); setScreen("passcode"); }}><RemakeIcon name="lock"/><span className="nav-label">Khoá</span></button>
    </footer>
  </aside>;
}
