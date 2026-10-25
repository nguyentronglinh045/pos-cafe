import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import toast from "react-hot-toast";
import { AppProviders } from "@/app/AppProviders";
import "@/tailwind.css";

// Test-only fixture: production toast provider over a persistent footer action.
function UnderlyingAction() {
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    toast.success("Thông báo luôn hiển thị để kiểm tra vùng bấm.", { id: "action-overlap", duration: Infinity });
    return () => toast.remove("action-overlap");
  }, []);
  return <button data-testid="toast-underlying-action" onClick={() => setClicked(true)}
    style={{ position: "fixed", right: 16, bottom: 16, width: 280, height: 48 }}>
    {clicked ? "Đã bấm" : "Tiếp tục thanh toán"}
  </button>;
}
createRoot(document.getElementById("root")!).render(<AppProviders><UnderlyingAction /></AppProviders>);
