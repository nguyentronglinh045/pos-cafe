import type {
  ConfirmStoreKeyResponse, CreateStoreOtpResponse, GetCreateStatusInput, GetCreateStatusResponse, RequestCreateStoreOtp,
  VerifyCreateInput, VerifyCreateResponse,
} from "@/domain/ownerCreate";

export interface IStoreProvisioningPort {
  requestCreateStoreOtp(input: RequestCreateStoreOtp): Promise<{
    result: CreateStoreOtpResponse;
    /** Fresh clock sample; a replay keeps the original receipt. */
    serverTime: number;
  }>;
  verifyAndAcceptCreate(input: VerifyCreateInput): Promise<VerifyCreateResponse>;
  getCreateStatus(input: GetCreateStatusInput): Promise<GetCreateStatusResponse>;
  confirmStoreKeySaved(input: VerifyCreateInput): Promise<ConfirmStoreKeyResponse>;
}
