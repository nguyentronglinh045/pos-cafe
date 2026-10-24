# Kiểm tra Supabase staging riêng

Công cụ này chỉ xuất inventory/fingerprint và kiểm tra Auth/REST routing HTTP đọc. Chưa có SQL, seed, reset hoặc hosted business adapter. Không dùng kết quả của nó thay full backend gate. Kế hoạch và review ở nhánh docs: `openspec/changes/use-supabase-staging-for-permission-tests/`.

Lượt đầu21/10 đã FAIL: Auth200, REST OpenAPI root401. Supabase đã chặn anon/publishable trên `/rest/v1/` từ tháng3/2026; không dùng root làm healthcheck. Giữ nguyên receipt/claim cũ. Owner đã cấp đúng1lượt bổ sung để sửa probe và review; không coi grant này là quyền bootstrap hoặc thêm lần thử tiếp.

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

Mọi đường dẫn phải tuyệt đối. Công cụ gửi tối đa2GET, mỗi request tối đa5giây (gồm đọc body), chỉ vào exact staging origin; không follow redirect, không lưu body. Auth `/auth/v1/settings` phải2xx. REST dùng `/rest/v1/__permission_staging_probe_20261021__?select=*&limit=0`, bắt buộc404 cùng JSON `code=PGRST205`; không chấp nhận mọi404/401. JSON đọc tối đa4096bytes, chỉ lưu code/classification allowlist. Lỗi local có0network calls; lỗi request đầu dừng request thứ hai. Receipt luôn `restDataAccessVerified=false`, `mutationReady=false`, `businessTestsRun=false`. PASS chỉ chứng minh Auth reachability và REST router/schema-cache nhận request cho resource không tồn tại; chưa chứng minh đọc dữ liệu, identity DB, schema, quyền hoặc nghiệp vụ.

Hợp đồng chính thức: [Supabase OpenAPI restriction](https://supabase.com/changelog/42949-breaking-change-removing-access-to-openapi-spec-via-the-anon-key), [PostgREST PGRST205](https://docs.postgrest.org/en/stable/references/errors.html#group-2-schema-cache). Trước lần remote của contract mới, reviewer phải đối chiếu method/path/role/expected với nguồn chính thức; mock2xx không thay được bước đó.

Fingerprint riêng bao phủ actual git HEAD, nội dung mọi file tracked và4file staging mới, gồm app/SQL/fixture/lock. Kiểm lại trước và sau mỗiGET; coverage hash giữ riêng.15helper recovery untracked có trước không thuộc candidate này. Nếu có thay đổi source/HEAD, manifest cũ bị từ chối.

Claim gốc đã tiêu tại `D:/Workspace/pos-cafe-permission-run-20261020/evidence/staging-20261021/remote-preflight.claim.json` và giữ bất biến. Grant bổ sung `REST_PROBE_REMEDIATION_01` phải nằm tại cùng thư mục, file `rest-probe-remediation01.grant.json`, khớp đúng policy được pin trong code và SHA256 claim gốc. Chỉ target `ineckiashpwloncxnbqx` được dùng grant này. Slot mới cố định `remote-preflight-remediation01.claim.json`, ghi exclusive trước network, không phụ thuộc receipt path/manifest. Không xóa claim hoặc tự mở grant tiếp khi lỗi. Đây là guard ứng dụng cho workstream Windows hiện tại, không phải quota hệ điều hành. Synthetic transport phải chỉ định attempt store riêng và receipt luôn ghi synthetic; actual transport không cho thay store.

Bootstrap và full hosted suite phải có adapter/proof và review riêng theo kế hoạch. Không chạy local fixture/reset/migration glob trên staging. Giữ nguyên ledger CI/backend cũ CLOSED; tool này không dispatch các workflow đó.
