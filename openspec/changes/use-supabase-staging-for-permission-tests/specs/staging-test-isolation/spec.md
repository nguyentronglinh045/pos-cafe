> **Đối chiếu xuất bản 25/10/2026.** Hồ sơ thiết kế và checkpoint staging lịch sử; không mở lại bootstrap/grant/cutoff. Routing hoặc local PASS không thay SQL/hosted/full acceptance; task này chỉ xuất bản tài liệu. [Nguồn, trạng thái và giới hạn](../../../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# ADDED — Staging test isolation

## Requirement STG-01 — Cách ly đích
Hệ thống SHALL chỉ cho phép exact project staging đã chốt, origin HTTPS `https://<ref>.supabase.co`; ref là20chữ thường a–z, khác DB gốc. URL có credentials, port, path, query, fragment hoặc origin khác SHALL bị từ chối trước network bằng `STAGING_TARGET_REFUSED`. Project gốc SHALL không nhận SQL/API từ workflow này.

Scenario: ref gốc, URL gốc hoặc ref/URL lệch → số network request bằng0. Response HTTP3xx chỉ có thể biết sau GET vào exact staging origin; request chuyển hướng tiếp theo phải bằng0 và kết quả phải bị từ chối.

## Requirement STG-02 — Credential riêng
Hệ thống SHALL nhận duy nhất file private được chỉ định rõ bằng đường dẫn tuyệt đối; không tự load env khác. Public manifest/report SHALL không chứa password, key, DSN hoặc response body. Thiếu/sai input → `STAGING_INPUT_REFUSED`; provider/network lỗi → mã hữu hạn, không log lỗi thô.

## Requirement STG-03 — Coverage không mất
Hệ thống SHALL xuất inventory mọi stage/file/full-name/project/required row từ catalog cùng hash nguồn, số tổng và phân loại lane. Tổng35stage/760row là baseline khảo sát; manifest/inventory gốc726permission occurrences/111PIN mappings vẫn giữ riêng, không được thay thế lẫn nhau. Row không có hosted proof SHALL tiếp tục required và pending/isolated. Thiếu/đổi row → `STAGING_COVERAGE_DRIFT`.

## Requirement STG-04 — Mutation có identity
Preflight đầu tiên SHALL chỉ đọc, không SQL/seed/reset. Mọi bootstrap sau này SHALL có provider project identity, exact reviewed SQL hash, nguồn, chứng minh target mới/empty và marker kiểm lại trong cùng DB connection. `postgres` database name đơn lẻ không là identity. Chưa có chứng minh → `STAGING_MUTATION_NOT_ADMITTED`. Không nới guard reset local hoặc giả Auth/Storage catalog để qua test hosted.

## Requirement STG-05 — Lifecycle và thời gian
Hệ thống SHALL kiểm deadline trước mỗi operation, có timeout hữu hạn, không retry tự động; remote preflight tối đa2GET trong1attempt. Không mutation mới từ22:30, không test mới từ22:45; hard stop trước23:00+07 ngày21/10. Sai/hết hạn → `STAGING_DEADLINE`. V3 cũ SHALL giữ nguyên CLOSED/hash/count; scope mới SHALL không dispatch CI/backend cũ.

Cap1attempt SHALL được claim exclusive theo workstream ở vị trí cố định, độc lập receipt path và manifest, trước network. Claim đã tiêu → `STAGING_ATTEMPT_USED`; không tự xóa/reset khi đổi source/output hoặc gặp lỗi.

Bổ sung theo quyết định owner sau S05FAIL,21/10: đúng1attempt/2GET thêm bằng grant `REST_PROBE_REMEDIATION_01`. Hệ thống SHALL đối chiếu grant exactpolicy, target và SHA256 claim cũ; claim cũ bất biến, slot mới fixed/exclusive trước network, không phụ thuộc receipt/manifest. Thiếu/sai grant hoặc predecessor → `STAGING_GRANT_REFUSED`; slot mới đã tiêu → `STAGING_ATTEMPT_USED`. Không thay deadline hoặc tự mở lượt thứ ba.

## Requirement STG-06 — Bằng chứng trung thực
Mỗi receipt SHALL bind baseline source, fingerprints của source/tool/config, target ref, operation, start/end UTC, status và phạm vi đã chạy. Offline guard PASS không là hosted connection/migration/business PASS. Tốc độ SHALL chỉ báo từ đo thực; lane hosted/isolated cùng giữ toàn bộ tiêu chí hiện hành.

Source fingerprint riêng SHALL bao phủ actual git HEAD, nội dung mọi file tracked và4file staging mới, gồm app/SQL/fixture/lock; kiểm trước/sau mỗiGET. Coverage hash không thay source fingerprint. Lệch → `STAGING_SOURCE_DRIFT` trước request kế tiếp.

Preflight sửa SHALL kiểm Auth2xx và REST routing qua resource dành riêng `__permission_staging_probe_20261021__` với `select=*&limit=0`, bắt buộc404/JSONcode`PGRST205`. Không dùng OpenAPI root hoặc coi mọi401/404 là PASS. Body tối đa4096bytes, timeout5giây gồm đọc body; receipt chỉ giữ code/classification allowlist và luôn `restDataAccessVerified=false`. PASS này không chứng minh quyền đọc dữ liệu hoặc nghiệp vụ. Reviewer SHALL kiểm method/path/role/expected theo nguồn provider hiện hành trước remote của contract mới.
