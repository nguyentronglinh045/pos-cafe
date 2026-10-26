# Đối chiếu catalog staging với mô hình N1 — 26/10/2026

## Kết quả và giới hạn

**Đã đọc DB staging qua MCP và xác nhận cấu trúc trong phạm vi dưới đây.** Mô hình source N1 có đủ 35 bảng/332 cột trên staging. Catalog public/private có 36 bảng/335 cột vì thêm một marker bootstrap vận hành. Không dùng kết quả này thay kiểm thử nghiệp vụ, kiểm bảo mật hoặc nghiệm thu backend; gate backend hiện hành vẫn HOLD.

| Phép đối chiếu | Kết quả |
| --- | --- |
| Bảng/cột của inventory N1 | 35 bảng/332 cột, không thiếu/thừa cột trong 35 bảng |
| Kiểu và NULL | Khớp 332 cột; chuẩn hóa tên tương đương như timestamptz/timestamp with time zone |
| PK | Khớp bộ cột của cả 35 bảng N1; marker có PK riêng |
| FK | 69/69 khớp bảng/cột nguồn, bảng/cột đích và ON DELETE; không thiếu/thừa FK |
| UNIQUE constraint | 24/24 khớp bộ cột; không bao gồm unique index có predicate trong con số này |
| ERD rút gọn | 36/36 cạnh trong tám ERD có FK tương ứng; hình cố ý lược bớt FK tenant/actor |
| Catalog health flags | 206 constraint đều validated, 90 index đều valid, 62 user trigger không có trạng thái disabled; không suy chức năng đúng từ các cờ này |
| Bảng ngoài inventory | Chỉ `private.permission_staging_bootstrap_marker`, ba cột; có nguồn bootstrap riêng |

[Kết quả đối chiếu máy đọc](comparison.json), [inventory source N1](source-inventory.json), [các cạnh ERD N1](diagram-manifest.json), [catalog đã giải mã](metadata.json). Inventory là dữ liệu phân tích từ source `711a22e71983e3d6aa17799649af05ce4c762555`, đã qua review N1; không phải schema dựng trong DB local. Việc so sánh không chạy migration hoặc một schema engine để suy diễn DDL.

## Nhận diện đích và cách lấy evidence

Chủ dự án yêu cầu kiểm DB bằng MCP và xác nhận dùng staging trong chat ngày26/10/2026. Đích được ràng buộc bằng cấu hình đã kiểm: project `pos-cafe-permission-staging`, ref `ineckiashpwloncxnbqx`, MCP server `supabase_pos_cafe`, URL `https://mcp.supabase.com/mcp?project_ref=ineckiashpwloncxnbqx&read_only=true&features=database,docs`. Tên project theo hồ sơ setup, project_ref theo endpoint và xác nhận đích của chủ dự án; `current_database() = postgres` tự nó không chứng minh project nào.

Phiên chat không nạp tool Supabase trực tiếp. Dùng Codex CLI sẵn có `0.164.0-alpha.11.1`, App Server `mcpServerStatus/list` và `mcpServer/tool/call`; OAuth do CLI quản lý. Session tạm `ephemeral=true` chỉ làm ngữ cảnh kết nối MCP, không tạo model turn. Override chỉ trong process tắt các MCP cấu hình khác, kiểm lại config trước truy cập; không sửa file config, lấy token thủ công hoặc truy cập DB gốc. Process của lượt capture đã đóng sau khi đọc xong.

Lần discovery đầu đúng đích nhưng [lỗi refresh OAuth](raw/discovery-live.json); chủ dự án hoàn tất đăng nhập lại. [Discovery sau đăng nhập](raw/discovery-capture.json) có đúng năm tool read-only: execute_sql, list_tables, list_extensions, list_migrations, search_docs; không có apply_migration. Hai probe xác nhận `supabase_read_only_user`, `transaction_read_only=on`, PostgreSQL17.11. Thời điểm server của probe trước capture: `2026-10-26 03:53:14.053359+00`; timestamp client riêng trong raw được giữ nguyên, không giả định đồng hồ client/server đồng bộ để tính thời lượng.

Tổng thao tác DB trong lượt: **11 execute_sql** (hai probe kết nối, chín query catalog) và **1 list_migrations**. Các query catalog chỉ đọc hệ thống pg_catalog/pg_policies: bảng, cột/default, constraints, indexes, triggers, enums, policies, ACL bảng và chữ ký/cờ/grants function. Không SELECT dòng nghiệp vụ, tài khoản, PIN/token/MAC key, marker binding hoặc gọi function nghiệp vụ; không lấy function body. Query gốc ở [queries.json](queries.json), probe và phản hồi tool ở [manifest](manifest.json).

SQL được gọi qua execute_sql với đối số query; migration ledger dùng list_migrations với đối số rỗng. Khi tái hiện cần khóa cùng project/read_only, kiểm role/transaction_read_only trước, dùng lại query và lưu thời điểm/kết quả mới; không dùng raw lịch sử làm kết quả mới. Chín catalog query là các transaction riêng, không là snapshot nhất quán tại một thời điểm.

## Khác biệt đã giải thích

### Marker vận hành staging

`private.permission_staging_bootstrap_marker` được khai báo tại [bootstrap source:72](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/scripts/permission-staging-bootstrap-sql.mjs#L72). Metadata khớp ba cột singleton:boolean PK/NOT NULL/CHECK, binding:jsonb NOT NULL, state:text NOT NULL/CHECK `COMMITTED_NOT_READY`. Không có FK/default. [Từ điển](../../data-dictionary.md#đối-chiếu-staging-và-bảng-vận-hành-ngoài-mô-hình-n1) ghi riêng để không hiểu 35 là tổng bảng của catalog staging. Không đọc dòng marker nên không kết luận giá trị binding hoặc trạng thái runtime từ CHECK.

### Migration ledger không phải danh sách file source

[Tool list_migrations](raw/raw-migrations.json) trả một entry: version `20261022092646`, name `permission_staging_bootstrap_b2e3122_20261022_1700`. Đây là tên entry được quan sát, không đủ chứng minh toàn bộ DB tương đương commit trong tên. Không coi việc ledger không liệt kê riêng 001–017 là thiếu schema: schema thực tế được kiểm độc lập bằng catalog. Không sửa ledger hoặc đề nghị replay migrations từ chênh lệch cách đóng gói này. Lịch sử triển khai xem [setup staging](../../workflow/tasks/permission-staging-setup-2026-10-22.md).

## Các ràng buộc đã kiểm thêm và phần chưa chứng minh

- Catalog có unique index employees_one_owner, CHECK employees_owner_active, hai constraint trigger employees_owner_boundary/stores_owner_boundary DEFERRABLE INITIALLY DEFERRED ở trạng thái enabled. Đây là metadata cài đặt, chưa chạy tình huống owner bị thiếu/trùng.
- Cột employees.role là text/FK sang permission_roles; ba bảng legacy_permission_* và enum employee_role không còn trong catalog public/private đã đọc. Không lấy sự hiện diện schema cuối làm chứng nhận activation đầy đủ.
- Đã thu thập 11 enum/36 giá trị, 39 policy và 165 function signatures/cờ/quyền EXECUTE. Đó là inventory để truy vết, chưa đối chiếu đầy đủ logic của từng function/policy với source hoặc chạy phép thử bypass.
- 24 bảng public có RLS enabled, không FORCE; 12 bảng private không bật RLS. ACL bảng quan sát không có grant trực tiếp cho PUBLIC/anon/authenticated trên private hoặc grant ghi cho các vai trò đó trên public. ACL bảng không chứng minh toàn bộ quyền hiệu lực qua schema, kế thừa role, column ACL hay SECURITY DEFINER RPC; chưa kết luận cô lập tenant an toàn hoặc có lỗ hổng từ riêng cờ RLS.
- Chưa so sánh đầy đủ tương đương mọi CHECK, default/generated expression, trigger/function body, mọi index predicate, cấu hình Auth/Storage/Realtime hoặc dữ liệu hiện có. Không chạy E2E, race, replay, recovery, RLS bypass, hiệu năng hay kiểm production. Các gate nghiệm thu giữ nguyên.
- Chưa render Mermaid đầy đủ; xác minh DB không gỡ giới hạn preview HTML hoặc xác minh bố cục hình.

Nguồn cách truy cập: [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp) (project_ref/read_only), [Codex App Server](https://learn.chatgpt.com/docs/app-server) (gọi MCP trên kết nối đã khởi tạo). Đây là hướng dẫn công cụ; kết quả DB lấy từ raw của lượt này.

## Bảo toàn và review

Chỉ thêm evidence mới và sửa đường đọc/N1 để phản ánh phép kiểm mới. Giữ nguyên evidence gốc, normative specs, app code/schema, main WIP và checklist local-only. Hai reviewer độc lập kiểm tính đúng dữ liệu/source và phạm vi/bằng chứng trước bàn giao; verdict ghi tại receipt handoff. Không push hoặc thay trạng thái feature thành đã nghiệm thu từ phép kiểm metadata.
