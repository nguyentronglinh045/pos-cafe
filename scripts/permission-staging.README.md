# Kiểm tra Supabase staging riêng

Công cụ này chỉ xuất inventory/fingerprint và kiểm tra kết nối HTTP đọc. Chưa có SQL, seed, reset hoặc hosted business adapter. Không dùng kết quả của nó thay full backend gate. Kế hoạch và review ở nhánh docs: `openspec/changes/use-supabase-staging-for-permission-tests/`.

## Trước khi dùng

- Chỉ project staging mới đã quan sát và duyệt ref; project gốc `kfqjdfwxhkdwihjobpny` bị chặn.
- Không sửa `.env`, `.env.local`, Supabase CLI link hoặc guard local. Không cài package để chạy tool; chỉ cần Node hiện có.
- Manifest công khai gồm đúng các trường trong ví dụ bên dưới. Thay ref bằng actual staging ref; hash inventory/manifest dùng canonical JSON của module, không hash file pretty-printed.
- Private config nằm ngoài code và docs, được owner giữ quyền truy cập riêng, chứa đúng `projectRef` và `anonKey`. Chỉ nhận anon JWT đúng ref hoặc publishable key; không nhận service-role/secret key. Công cụ không cấu hình ACL Windows thay owner và không lưu credential vào receipt.
- Lượt21/10 dừng mở preflight từ22:45+07, không tự đổi deadline để chạy lại. Không có retry tự động.

## Kiểm local và xuất inventory

```powershell
node --test scripts/permission-staging.test.mjs
node scripts/permission-staging-cli.mjs inventory D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-20261021\inventory.json
node scripts/permission-staging-cli.mjs source D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-20261021\source-fingerprint.json
```

Thư mục output phải có sẵn. File mới ghi exclusive, không ghi đè evidence. Inventory giữ35stage/760runtime identities cùng hashes các test/config/input gốc. 726PERM occurrence và111PINmapping ở manifest gốc có ngữ nghĩa khác; không lấy760 thay837.

```json
{
  "version": "permission-staging-v1",
  "projectRef": "ACTUAL_STAGING_REF_REQUIRED",
  "apiOrigin": "https://ACTUAL_STAGING_REF_REQUIRED.supabase.co",
  "baselineSource": "90e30f2b2b0f046c549b268b32f1840ad99c2409",
  "coverageSha256": "SHA256_FROM_INVENTORY_OUTPUT",
  "sourceFingerprintSha256": "SHA256_FROM_SOURCE_OUTPUT",
  "deadlineUtc": "2026-10-21T16:00:00.000Z",
  "scope": "READ_ONLY_PREFLIGHT",
  "acknowledgement": "STAGING_ONLY_NO_PRODUCTION"
}
```

Hash canonical manifest được lấy bằng `inventoryHash(manifest)` từ module, review cùng actual ref. Không tạo manifest chạy được bằng ref giả trong ví dụ. Private JSON có dạng `{"projectRef":"ACTUAL_STAGING_REF_REQUIRED","anonKey":"OWNER_PRIVATE_INPUT"}`; không paste key vào chat/docs.

## Preflight thực sau review implementation

```powershell
node scripts/permission-staging-cli.mjs preflight ABSOLUTE_MANIFEST_JSON ABSOLUTE_PRIVATE_CONFIG_JSON EXPECTED_CANONICAL_MANIFEST_SHA256 ABSOLUTE_NEW_RECEIPT_JSON
```

Mọi đường dẫn phải tuyệt đối. Công cụ gửi tối đa2GET, mỗi request tối đa5giây, chỉ vào exact staging origin; không follow redirect, không lưu body. Lỗi local có0network calls; lỗi request đầu dừng request thứ hai. Receipt ghi hashes, target, thời gian và trạng thái, luôn `mutationReady=false` và `businessTestsRun=false`. Actual HTTP PASS chỉ chứng minh hai endpoint nhận key ở thời điểm đó, chưa chứng minh identity DB, schema, quyền hoặc nghiệp vụ.

Fingerprint riêng bao phủ actual git HEAD, nội dung mọi file tracked và4file staging mới, gồm app/SQL/fixture/lock. Kiểm lại trước và sau mỗiGET; coverage hash giữ riêng.15helper recovery untracked có trước không thuộc candidate này. Nếu có thay đổi source/HEAD, manifest cũ bị từ chối.

Cap1attempt thực được claim độc lập output tại `D:/Workspace/pos-cafe-permission-run-20261020/evidence/staging-20261021/remote-preflight.claim.json`, exclusive trước network. Đổi receipt path hoặc manifest không mở thêm lượt. Claim đã tiêu vẫn giữ khi request lỗi/process dừng; không tự xóa để retry. Đây là guard ứng dụng cho workstream Windows hiện tại, không phải quota hệ điều hành. Synthetic transport phải chỉ định attempt store riêng và receipt luôn ghi synthetic; actual transport không cho thay store.

Bootstrap và full hosted suite phải có adapter/proof và review riêng theo kế hoạch. Không chạy local fixture/reset/migration glob trên staging. Giữ nguyên ledger CI/backend cũ CLOSED; tool này không dispatch các workflow đó.
