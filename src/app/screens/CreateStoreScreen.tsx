import { Button } from "@mui/material";
import { useAppStore } from "../useAppStore";
import { usePorts } from "@/features/shared/portsContext";
import { OwnerCreateRequestScreen } from "./OwnerCreateRequestScreen";

export function CreateStoreScreen() {
  const { storeProvisioning } = usePorts();
  return storeProvisioning
    ? <OwnerCreateRequestScreen port={storeProvisioning} />
    : <CreateStorePreviewNotice />;
}

function CreateStorePreviewNotice() {
  const setScreen = useAppStore(state => state.setScreen);
  return (
    <main data-testid="create-store-preview-notice" className="grid min-h-[100dvh] place-items-center bg-pos-bg p-6 text-pos-ink">
      <section className="grid w-full max-w-md gap-4 rounded-pos border border-pos-line bg-pos-surface p-6">
        <h1 className="m-0 text-xl font-semibold">Tạo quán trên Protected Preview</h1>
        <p className="m-0 text-sm text-pos-muted">Mở bản Protected Preview do nhóm cung cấp để xác minh email và tạo quán. Nếu đã có Store Key, bạn có thể ghép thiết bị tại đây.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="contained" onClick={() => setScreen("storePairing")}>Ghép thiết bị</Button>
          <Button onClick={() => setScreen("landing")}>Quay lại</Button>
        </div>
      </section>
    </main>
  );
}
