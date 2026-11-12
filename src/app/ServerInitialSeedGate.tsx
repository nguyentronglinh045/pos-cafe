import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { IInitialSeedRepo } from "@/ports";
import { usePermissionSession } from "@/features/shared/permissionSession";
import { toToastError } from "./appErrors";

export function ServerInitialSeedGate({ seed, children }: { seed: IInitialSeedRepo; children: ReactNode }) {
  const generation = usePermissionSession((state) => state.generation);
  const owner = usePermissionSession((state) => state.bundle?.snapshot.role === "owner");
  const readiness = useQuery({
    queryKey: ["server-initial-seed", generation],
    queryFn: () => seed.getReadiness!(),
    refetchInterval: (query) => query.state.data === "waiting" ? 3000 : false,
  });
  const action = useMutation({
    mutationFn: (operation: "retry" | "skip") => operation === "retry" ? seed.retryAll!() : seed.skipAll!(),
    onSettled: () => readiness.refetch(),
  });

  if (readiness.data === "ready") return <>{children}</>;

  const needsRetry = readiness.data === "failed";
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-pos-bg p-6 text-pos-ink">
      <section className="grid max-w-md gap-3 rounded-pos border border-pos-line bg-pos-surface p-6" aria-live="polite">
        <h1 className="text-xl font-semibold">
          {needsRetry ? "Chưa tạo xong dữ liệu mẫu" : readiness.isError ? "Chưa đọc được trạng thái quán" : "Đang chuẩn bị dữ liệu mẫu"}
        </h1>
        {needsRetry && !owner && <p className="text-sm text-pos-muted">Chờ chủ quán xử lý dữ liệu mẫu.</p>}
        {action.error && <p role="alert" className="text-sm">{toToastError(action.error)}</p>}
        {needsRetry && owner && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={action.isPending} className="rounded-pos border border-pos-line px-3 py-2"
              onClick={() => action.mutate("retry")}>Thử lại</button>
            <button type="button" disabled={action.isPending} className="rounded-pos border border-pos-line px-3 py-2"
              onClick={() => action.mutate("skip")}>Bỏ dữ liệu mẫu và vào quán trống</button>
          </div>
        )}
        <button type="button" disabled={readiness.isFetching || action.isPending} className="justify-self-start text-sm underline"
          onClick={() => void readiness.refetch()}>Kiểm tra lại</button>
      </section>
    </main>
  );
}
