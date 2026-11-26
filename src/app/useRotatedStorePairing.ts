import { useQueryClient } from "@tanstack/react-query";
import { usePorts } from "@/features/shared/portsContext";
import { usePermissionSession } from "@/features/shared/permissionSession";
import { pairStoreForSession } from "@/features/session/sessionFlow";
import { sessionQueryKeys } from "@/features/session/useSessionFlow";
import { useAppStore } from "./useAppStore";

export function useRotatedStorePairing() {
  const ports = usePorts();
  const queryClient = useQueryClient();

  async function moveToPairing({ storeKey, notice }: { storeKey?: string; notice?: string }) {
    const before = usePermissionSession.getState();
    const owner = before.bundle?.snapshot;
    const app = useAppStore.getState();
    if (app.rePairingStore || before.status !== "verified" || owner?.role !== "owner") return;
    app.beginRotatedStorePairing(notice);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await ports.auth.unpairStore();
      if (storeKey) {
        const session = await pairStoreForSession(ports, storeKey);
        if (session.storeId !== owner.storeId || session.status === "suspended") {
          throw new Error("Rotated key did not pair the current store");
        }
        await queryClient.cancelQueries({ queryKey: sessionQueryKeys.storeSession });
        queryClient.setQueryData(sessionQueryKeys.storeSession, { status: "paired", session });
        app.finishRotatedStorePairing("passcode");
        return;
      }
    } catch {
      if (storeKey) {
        try { await ports.auth.unpairStore(); } catch { /* Allow manual pairing even if Auth is unavailable. */ }
      }
    }
    await queryClient.cancelQueries({ queryKey: sessionQueryKeys.storeSession });
    queryClient.setQueryData(sessionQueryKeys.storeSession, { status: "unpaired", session: null });
    app.finishRotatedStorePairing("storePairing",
      notice ?? "Chưa ghép được máy này. Hãy dùng Store Key mới trong email đã đăng ký để thử lại.");
  }

  return {
    pair: (storeKey: string) => moveToPairing({ storeKey }),
    requireStorePairing: (notice: string) => moveToPairing({ notice }),
    requireEmployeePin(notice: string) {
      const app = useAppStore.getState();
      app.setCurrentEmployee(null);
      app.setScreen("passcode");
      app.setSessionNotice(notice);
      const protectedQueries = { queryKey: ["permission"] };
      void queryClient.cancelQueries(protectedQueries);
      queryClient.removeQueries(protectedQueries);
      void ports.permission?.session.revokeSession().catch(() => {});
    },
  };
}
