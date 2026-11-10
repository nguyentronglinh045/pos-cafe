import { createMockPermissionRuntime, createMockPermissionState } from "@/adapters/mock";
import { checkMockOwnerPin, mockOwnerOtpPort, pairMockOwnerStore } from "@/adapters/mock/ownerOtpPort";
import { createSupabaseBrowserClient, createSupabasePorts } from "@/adapters/supabase";
import type { AppPorts } from "@/ports";
import { usePermissionSession } from "@/features/shared/permissionSession";

export type AppDataMode = "mock" | "supabase";

export type RuntimePortEnv = {
  mode?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  ownerCreateMock?: boolean;
  ownerCreateFixture?: boolean;
};

const hasSupabaseEnv = (env: RuntimePortEnv): boolean => Boolean(env.supabaseUrl && env.supabaseAnonKey);

export class OwnerCreateMockConfigError extends Error {}

export const resolveAppDataMode = (env: RuntimePortEnv): AppDataMode => {
  if (env.mode === "mock" || env.mode === "supabase") {
    return env.mode;
  }

  return hasSupabaseEnv(env) ? "supabase" : "mock";
};

export const createAppPorts = (env: RuntimePortEnv = {}): AppPorts => {
  if (env.ownerCreateMock && env.mode !== "mock") {
    throw new OwnerCreateMockConfigError("Bản xem thử tạo quán yêu cầu cấu hình mock.");
  }
  const mode = resolveAppDataMode(env);

  if (mode === "supabase") {
    return createSupabasePorts(
      createSupabaseBrowserClient({
        url: env.supabaseUrl,
        anonKey: env.supabaseAnonKey,
        isCompatibilityBlocked: () => usePermissionSession.getState().compatibilityBlocked,
      }), env.supabaseUrl,
    );
  }

  const state = createMockPermissionState({ demoCredentials: true });
  state.paired = false;
  const runtime = createMockPermissionRuntime(state, env.ownerCreateMock ? {
    pair: pairMockOwnerStore, checkPin: checkMockOwnerPin,
    failSeedMenuAttempts: env.ownerCreateFixture ? 1 : 0,
  } : undefined);
  return {
    permission: {
      authority: runtime.authority,
      employeeAdmin: runtime.employeeAdmin,
      read: runtime.read,
      session: runtime.session,
      initialSeed: runtime.initialSeed,
      changes: runtime.changes,
      signals: runtime.signals,
      menuImages: runtime.menuImages,
      print: runtime.print,
    },
    write: runtime.write,
    auth: runtime.auth,
    ...(env.mode === "mock" && env.ownerCreateMock ? { storeProvisioning: mockOwnerOtpPort } : {}),
    seed: runtime.seed,
    print: runtime.legacyPrint,
  };
};

let viteEnvPorts: AppPorts | null = null;

export const createAppPortsFromViteEnv = (): AppPorts => {
  const ownerCreateMock = new URLSearchParams(window.location.search).get("owner-create-mock") === "1";
  if (ownerCreateMock && !import.meta.env.DEV) {
    throw new OwnerCreateMockConfigError("Bản xem thử tạo quán chỉ chạy trên máy phát triển.");
  }
  return (viteEnvPorts ??= createAppPorts({
    mode: import.meta.env.VITE_DATA_MODE,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    ownerCreateMock,
    ownerCreateFixture: import.meta.env.DEV && import.meta.env.VITE_OWNER_CREATE_FIXTURE === "1",
  }));
};
