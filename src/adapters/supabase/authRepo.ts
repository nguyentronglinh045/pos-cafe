
import type { IAuthRepo } from "@/ports";
import type { StoreSession } from "@/domain";
import { AppError } from "@/core/appError";
import { throwIfError } from "./errors";
import { parseStoreKey, storeEmailForNo } from "./storeKey";
import type { SupabaseAnyClient } from "./repoShared";
import { clearEmployeeCredential } from "./employeeCredential";
import { writeError } from "@/core/writeErrors";

export class SupabaseAuthRepo implements IAuthRepo {
  private readonly localSignOuts = new Set<{ sessionRemoved: boolean }>();

  constructor(private readonly client: SupabaseAnyClient) {}

  private async requirePermissionContract(): Promise<void> {
    const { data, error } = await this.client.rpc("permission_get_contract");
    if (error || data?.permissionContractVersion !== 2 || data?.writeProtocolVersion !== 1) throw writeError("WRITE_PROTOCOL_UNSUPPORTED");
  }

  async pairStore(storeKey: string): Promise<void> {
    clearEmployeeCredential(this.client);
    const parsed = parseStoreKey(storeKey);
    const { error } = await this.client.auth.signInWithPassword({
      email: storeEmailForNo(parsed.storeNo),
      password: parsed.secret,
    });
    throwIfError(error, "AUTH_REQUIRED");

    const session = await this.getStoreSession();

    if (!session || session.storeNo !== parsed.storeNo) {
      await this.signOutLocally();
      throw new AppError("AUTH_REQUIRED", "Store Key không đúng.");
    }
  }

  async unpairStore(): Promise<void> {
    clearEmployeeCredential(this.client);
    const { error } = await this.signOutLocally();
    throwIfError(error, "AUTH_REQUIRED");
  }

  onStoreSessionLost(listener: () => void): () => void {
    const { data: { subscription } } = this.client.auth.onAuthStateChange(event => {
      if (event !== "SIGNED_OUT") return;
      if (this.localSignOuts.size === 0) listener();
      for (const attempt of this.localSignOuts) attempt.sessionRemoved = true;
    });
    return () => subscription.unsubscribe();
  }

  private async signOutLocally() {
    const attempt = { sessionRemoved: false };
    this.localSignOuts.add(attempt);
    try {
      const result = await this.client.auth.signOut({ scope: "local" });
      // Loading the SDK session during sign-out can fail to refresh and already
      // remove it. An observed SIGNED_OUT confirms the local unpair in that case.
      return attempt.sessionRemoved ? { error: null } : result;
    } catch (error) {
      if (!attempt.sessionRemoved) throw error;
      return { error: null };
    } finally {
      this.localSignOuts.delete(attempt);
    }
  }

  async getStoreSession(): Promise<StoreSession | null> {
    const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
    throwIfError(sessionError, "AUTH_REQUIRED");

    const storeId = sessionData.session?.user.id;

    if (!storeId) {
      return null;
    }

    await this.requirePermissionContract();
    const { data, error } = await this.client.rpc("permission_get_store_session");
    throwIfError(error, "AUTH_REQUIRED");
    if (!data || data.ok !== true || data.data?.storeId !== storeId || !Number.isInteger(data.data?.storeNo)) {
      return null;
    }
    return {
      storeId: data.data.storeId,
      storeNo: data.data.storeNo,
      ...(data.data.status === "active" || data.data.status === "suspended" ? { status: data.data.status } : {}),
    };
  }
}
