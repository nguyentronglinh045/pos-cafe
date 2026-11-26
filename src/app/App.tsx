import { useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { useStoreSessionQuery } from "@/features/session";
import { PermissionLifecycle } from "./PermissionLifecycle";
import { useAppStore } from "./useAppStore";
import { toToastError } from "./appErrors";
import { RotateGuidance } from "./screens/RotateGuidance";
import { LandingScreen } from "./screens/LandingScreen";
import { StorePairingScreen } from "./screens/StorePairingScreen";
import { CreateStoreScreen } from "./screens/CreateStoreScreen";
import { PasscodeScreen } from "./screens/PasscodeScreen";
import { RequiredPinChangeScreen } from "./screens/RequiredPinChangeScreen";
import { AppShell } from "./shell/AppShell";
import { requireCompatibilityUpdate } from "./compatibilityGate";
import { usePermissionSession } from "@/features/shared/permissionSession";
import { InitialSeedLifecycle } from "./InitialSeedLifecycle";
import { ServerInitialSeedGate } from "./ServerInitialSeedGate";
import { PortsContext } from "@/features/shared/portsContext";
import { restoreOwnerCreateAttempt } from "./screens/useOwnerCreateCloseout";

export function CompatibilityUpdateGate({ reload = () => window.location.reload() }: { reload?: () => void }) {
  return <main className="fixed inset-0 z-[3000] grid place-content-center gap-5 bg-pos-bg p-6 text-center" data-testid="compatibility-update-gate">
    <p role="alert" className="m-0 text-lg font-semibold">Phiên bản ứng dụng chưa tương thích. Vui lòng tải phiên bản mới trước khi tiếp tục.</p>
    <button className="rounded-pos bg-pos-primary px-5 py-3 font-bold text-white" onClick={reload}>Tải lại ứng dụng</button>
  </main>;
}

export function App() {
  const updateRequired = useAppStore((state) => state.updateRequired);
  if (updateRequired) return <CompatibilityUpdateGate />;
  return <ActiveApp />;
}

function ActiveApp() {
  const appPorts = useContext(PortsContext);
  const storeProvisioning = appPorts?.storeProvisioning;
  const seed = appPorts?.permission?.initialSeed;
  const serverSeed = seed?.getReadiness && seed.retryAll && seed.skipAll ? seed : undefined;
  const screen = useAppStore((state) => state.screen);
  const currentEmployee = useAppStore((state) => state.currentEmployee);
  const rePairingStore = useAppStore((state) => state.rePairingStore);
  const requiredPinSession = usePermissionSession(state => state.requiredPinSession);
  const setScreen = useAppStore((state) => state.setScreen);
  const setCurrentEmployee = useAppStore((state) => state.setCurrentEmployee);
  const storeSessionQuery = useStoreSessionQuery();
  const storeSession = storeSessionQuery.data?.session ?? null;

  useEffect(() => {
    if (storeProvisioning && restoreOwnerCreateAttempt()) setScreen("createStore");
  }, [setScreen, storeProvisioning]);

  useEffect(() => {
    if (rePairingStore || !storeSessionQuery.data) {
      return;
    }

    if (storeSessionQuery.data.status === "paired" && screen === "landing") {
      setScreen("passcode");
    }

    if (storeSessionQuery.data.status === "unpaired" && (screen === "passcode" || currentEmployee)) {
      setCurrentEmployee(null);
      setScreen("landing");
    }
  }, [currentEmployee, rePairingStore, screen, setCurrentEmployee, setScreen, storeSessionQuery.data]);

  useEffect(() => {
    if (!rePairingStore && storeSessionQuery.error) {
      if (requireCompatibilityUpdate(storeSessionQuery.error)) return;
      toast.error(toToastError(storeSessionQuery.error));
      setCurrentEmployee(null);
      setScreen("landing");
    }
  }, [rePairingStore, setCurrentEmployee, setScreen, storeSessionQuery.error]);

  if (!rePairingStore && storeSession?.status === "suspended") {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-pos-bg p-6 text-pos-ink">
        <section className="max-w-md rounded-pos border border-pos-line bg-pos-surface p-6">
          <h1 className="text-xl font-semibold">Quán đang tạm ngưng</h1>
          <p className="mt-2 text-sm text-pos-muted">Quán {storeSession.storeNo} chưa thể mở POS.</p>
          <button className="mt-4 rounded-pos border border-pos-line px-3 py-2 text-sm" type="button"
            disabled={storeSessionQuery.isFetching} onClick={() => void storeSessionQuery.refetch()}>
            Kiểm tra lại
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      {currentEmployee && <PermissionLifecycle />}
      {requiredPinSession ? (
        <RequiredPinChangeScreen />
      ) : currentEmployee ? (
        <>
          <RotateGuidance />
          {serverSeed ? <ServerInitialSeedGate seed={serverSeed}><AppShell /></ServerInitialSeedGate> : (
            <><InitialSeedLifecycle /><AppShell /></>
          )}
        </>
      ) : screen === "landing" ? (
        <LandingScreen ownerCreatePreview={!!storeProvisioning} />
      ) : screen === "storePairing" ? (
        <StorePairingScreen />
      ) : screen === "createStore" ? (
        <CreateStoreScreen />
      ) : (
        <PasscodeScreen />
      )}
    </>
  );
}
