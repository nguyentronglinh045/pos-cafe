// Fixed operator wording from the accepted release/activation context contract.
// Preserve technical codes and Error.message; never project raw exceptions.
const messages = Object.freeze({
  "RELEASE_TARGET_NOT_EMPTY": "Đích phát hành còn dữ liệu quán. Đã dừng kích hoạt.",
  "TARGET_STORE_SET_MISMATCH": "Dữ liệu đích đã thay đổi. Đã dừng kích hoạt.",
  "TARGET_TENANT_SCHEMA_MISMATCH": "Lược đồ dữ liệu quán đã thay đổi. Đã dừng để rà soát.",
  "ACTIVATION_TARGET_NOT_EMPTY": "Đích phát hành còn dữ liệu quán. Đã dừng kích hoạt.",
  "ACTIVATION_STORE_SET_MISMATCH": "Dữ liệu đích đã thay đổi. Đã dừng kích hoạt.",
  "ACTIVATION_TENANT_SCHEMA_MISMATCH": "Lược đồ dữ liệu quán đã thay đổi. Đã dừng để rà soát.",
  "INVALID_TARGET_CONFIG": "Cấu hình đích phát hành không hợp lệ."
});
export function permissionOperatorFailure(code) {
 if (typeof code !== 'string' || !Object.hasOwn(messages, code)) return null;
 return { status: 'BLOCKED', code, operatorMessage: messages[code] };
}
export function attachPermissionOperatorMessage(error, code) {
 if (!(error instanceof Error)) throw Error('PERMISSION_OPERATOR_ERROR_REFUSED');
 const projection = permissionOperatorFailure(code);
 if (projection) Object.defineProperty(error, 'operatorMessage', { value: projection.operatorMessage, enumerable: true });
 return error;
}
