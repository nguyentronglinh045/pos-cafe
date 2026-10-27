import { useQuery } from "@tanstack/react-query";
import type { PermissionCode } from "@/domain/permissions";
import { permissionQueryKey, permissionRead, sessionHasPermission, usePermissionSession } from "./permissionSession";

export function usePurposeQuery<T>(purpose: string, codes: readonly PermissionCode[], args: unknown[], read: () => Promise<T>, enabled = true, live = false) {
  const session = usePermissionSession();
  return useQuery({
    queryKey: permissionQueryKey(purpose, ...args), queryFn: () => permissionRead(codes, read),
    enabled: enabled && session.status === "verified" && !!session.bundle && (codes.length === 0 || codes.some(code => sessionHasPermission(code, session))),
    refetchInterval: live ? 5_000 : false, refetchIntervalInBackground: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
}
