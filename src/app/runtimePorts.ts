import { createMockPermissionRuntime, createMockPermissionState } from "@/adapters/mock";
import { checkMockOwnerPin, mockOwnerOtpPort, pairMockOwnerStore } from "@/adapters/mock/ownerOtpPort";
import { createSupabaseBrowserClient, createSupabasePorts } from "@/adapters/supabase";
import { createOwnerProvisioningPort } from "@/adapters/supabase/ownerProvisioningPort";
import { createForgotStoreKeyPort, createOwnerRecoveryPort } from "@/adapters/supabase/ownerRecoveryPort";
import { ownerRecoveryFixture } from "@/adapters/mock/ownerRecoveryFixture";
import type { AppPorts } from "@/ports";
import { usePermissionSession } from "@/features/shared/permissionSession";

export type AppDataMode = "mock" | "supabase";

export type RuntimePortEnv = {
  mode?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  ownerCreateMock?: boolean;
  ownerCreateFixture?: boolean;
  ownerProvisioning?: boolean;
  ownerRecovery?: boolean;
  forgotStoreKey?: boolean;
  ownerRecoveryMock?: boolean;
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
    const client = createSupabaseBrowserClient({
      url: env.supabaseUrl, anonKey: env.supabaseAnonKey,
      isCompatibilityBlocked: () => usePermissionSession.getState().compatibilityBlocked,
    });
    const ports = createSupabasePorts(client, env.supabaseUrl);
    if (!env.supabaseUrl || !env.supabaseAnonKey) return ports;
    const connection = { url: env.supabaseUrl, publicKey: env.supabaseAnonKey };
    return {
      ...ports,
      ...(env.ownerProvisioning ? { storeProvisioning: createOwnerProvisioningPort(connection) } : {}),
      ...(env.ownerRecovery ? { ownerRecovery: createOwnerRecoveryPort({ ...connection, client }) } : {}),
      ...(env.forgotStoreKey ? { forgotStoreKey: createForgotStoreKeyPort() } : {}),
    };
  }

  const state = createMockPermissionState({ demoCredentials: true });
  state.paired = false;
  const runtime = createMockPermissionRuntime(state, env.ownerCreateMock ? {
    pair: pairMockOwnerStore, checkPin: checkMockOwnerPin,
    failSeedMenuAttempts: env.ownerCreateFixture ? 1 : 0,
  } : undefined);
  const recovery = env.mode === "mock" && env.ownerRecoveryMock ? ownerRecoveryFixture(state, runtime.auth) : undefined;
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
    auth: recovery?.auth ?? runtime.auth,
    ...(recovery ? { ownerRecovery: recovery.port, forgotStoreKey: { request: async () => "accepted" } } : {}),
    ...(env.mode === "mock" && env.ownerCreateMock ? { storeProvisioning: mockOwnerOtpPort } : {}),
    seed: runtime.seed,
    print: runtime.legacyPrint,
  };
};

let viteEnvPorts: AppPorts | null = null;

export const createAppPortsFromViteEnv = (): AppPorts => {
  const params = new URLSearchParams(window.location.search);
  const ownerCreateMock = params.get("owner-create-mock") === "1";
  if (ownerCreateMock && !import.meta.env.DEV) {
    throw new OwnerCreateMockConfigError("Bản xem thử tạo quán chỉ chạy trên máy phát triển.");
  }
  return (viteEnvPorts ??= createAppPorts({
    mode: import.meta.env.VITE_DATA_MODE,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    ownerCreateMock,
    ownerCreateFixture: import.meta.env.DEV && import.meta.env.VITE_OWNER_CREATE_FIXTURE === "1",
    ownerProvisioning: import.meta.env.VITE_OWNER_PROVISIONING === "1",
    ownerRecovery: import.meta.env.VITE_OWNER_RECOVERY === "1",
    forgotStoreKey: import.meta.env.VITE_FORGOT_STORE_KEY === "1",
    ownerRecoveryMock: import.meta.env.DEV && params.get("owner-recovery-mock") === "1",
  }));
};
