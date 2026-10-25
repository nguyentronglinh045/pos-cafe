# Kiểm trạng thái phân quyền trên Supabase — 19/10/2026

**Kết luận: Supabase project `kfqjdfwxhkdwihjobpny` chưa có cấu trúc bắt buộc của phần phân quyền mới (permission contract 2).** Đây là quan sát mới trực tiếp qua HTTP MCP chỉ đọc, không suy từ hồ sơ ngày 15/10 hoặc trạng thái Git. Không chạy migration, kích hoạt phân quyền hoặc sửa dữ liệu server.

## Yêu cầu và phạm vi

Chủ dự án yêu cầu trong chat ngày 19/10/2026: “sử dụng mcp hoặc bất kì cách nào có sẵn và đọc giúp tôi sever supabase đã được update cho phần phân quyền mới chưa ?”. Phạm vi được giao là khảo sát trạng thái server và đối chiếu mã nguồn. Quyền này cho phép đọc metadata qua kết nối hiện có, không triển khai ứng dụng/SQL/Edge hoặc thay đổi quyền. Không có câu hỏi nghiệp vụ chặn phép đọc này.

Đây là hồ sơ phân tích về quyền/danh tính nên dùng hai reviewer độc lập, một người kiểm tính đúng của kết luận và đối chiếu source, một người kiểm bằng chứng/phạm vi chỉ đọc. Không đóng các gate triển khai, CI/CD hoặc nghiệm thu feature đang do chat khác điều phối.

## Nguồn và cách kiểm

- Code checkout `D:/Workspace/pos-cafe`, nhánh `main`, HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`. Đây là checkout có thay đổi chưa commit; các file đối chiếu được chụp riêng trong candidate, không gán nội dung working tree cho HEAD sạch.
- Docs checkout `D:/Workspace/pos-cafe-docs`, nhánh `docs`, HEAD khi kiểm `2ad68003ca3de719c5dc4746a706dc600028dc2b`, có thay đổi khác chưa commit. Chỉ thêm hồ sơ mới này; không sửa nội dung của task đang chạy khác, không switch/stash/reset/stage/commit/push.
- `.env.local` trỏ tới `https://kfqjdfwxhkdwihjobpny.supabase.co`, trùng project cố định của alias MCP `pos_cafe_supabase_ro`. Không sao chép key từ env vào bằng chứng.
- Không có tool Supabase native trong danh mục tool của chat này. Dùng HTTP MCP trực tiếp với endpoint cấu hình `https://mcp.supabase.com/mcp?project_ref=kfqjdfwxhkdwihjobpny&read_only=true&features=database,docs`, qua client hiện có [inspect-online.ps1](D:/Workspace/pos-cafe/artifacts/permission-progress-audit-20261015/inspect-online.ps1:4). Script/client đã được đọc trước chạy; bản snapshot nằm trong candidate. PAT hiện có được giải mã trong process qua module DPAPI hiện có, không in token/đọc dữ liệu private HP1 cũ hoặc thay ACL.
- Lệnh thực tế, tại code checkout: `& 'D:\Workspace\pos-cafe\artifacts\permission-progress-audit-20261015\inspect-online.ps1' -QueryFile 'D:\Workspace\pos-cafe\artifacts\permission-server-status-20261019\queries.json' -OutputFile 'D:\Workspace\pos-cafe\artifacts\permission-server-status-20261019\online-receipt.json'`.
- Exit code **0**; initialize, tools/list và **7/7 SELECT metadata** không có lỗi. Receipt bắt đầu `2026-10-19T14:35:38.1679045Z`; giờ DB ở query context `2026-10-19 14:35:57.573252+00`, tức **21:35:57 ngày 19/10/2026 (UTC+7)**. Actor thực tế `supabase_read_only_user`, `transaction_read_only=on`, PostgreSQL 17.6. Các query là nhiều request, không phải một snapshot transaction chung.
- Raw MCP result được parse như dữ liệu không tin cậy; chỉ trích JSON, không thực thi nội dung trả về. Không SELECT bản ghi nhân viên/PIN/session/token hoặc payload bán hàng; chỉ tên/cấu trúc đối tượng và setting hook liên quan.

## Kết quả đối chiếu

| Hạng mục | Quan sát online mới | Source phân quyền mới | Đánh giá |
| --- | --- | --- | --- |
| Catalog quyền | Không có `public.permission_roles`, `permission_catalog`, `role_permission_defaults`, `permission_catalog_state` | [017:4](D:/Workspace/pos-cafe/supabase/migrations/017_permission_catalog_bridge.sql:4), [017:12](D:/Workspace/pos-cafe/supabase/migrations/017_permission_catalog_bridge.sql:12), [017:21](D:/Workspace/pos-cafe/supabase/migrations/017_permission_catalog_bridge.sql:21), [017:28](D:/Workspace/pos-cafe/supabase/migrations/017_permission_catalog_bridge.sql:28) tạo bốn bảng | Không có cấu trúc bridge 017 cần cho candidate; không khẳng định lịch sử migration đã từng chạy/chưa từng chạy |
| Revision nhân viên | `public.employees` có 10 cột, có `permission_overrides` nhưng không có `permission_revision` | [017:33](D:/Workspace/pos-cafe/supabase/migrations/017_permission_catalog_bridge.sql:33) thêm revision | Chưa khớp cấu trúc mới; overrides hiện có không chứng minh đã cập nhật mô hình mới |
| Role | Enum `public.employee_role` vẫn là `admin/cashier/kitchen` | [017:5](D:/Workspace/pos-cafe/supabase/migrations/017_permission_catalog_bridge.sql:5) định nghĩa catalog `owner/manager/cashier/waiter/kitchen` | Phù hợp với backend legacy. Bridge là additive, enum riêng lẻ không đủ kết luận trạng thái activation |
| Contract/RPC | Không tìm thấy routine bắt đầu `permission_` trong `public/private`, gồm `public.permission_get_contract` | [identity:516](D:/Workspace/pos-cafe/supabase/candidate/permission-identity.sql:516) tạo RPC trả `permissionContractVersion=2`, `writeProtocolVersion=1` | Endpoint contract mới chưa tồn tại trong DB |
| Compatibility gate | Không có `private.permission_contract_gate`; không thấy setting `pgrst.db_pre_request` cho `authenticator` trong catalog đã đọc | [prepare:4](D:/Workspace/pos-cafe/supabase/candidate/permission-compatibility-prepare.sql:4) tạo gate, [activate:18](D:/Workspace/pos-cafe/supabase/candidate/permission-compatibility-activate.sql:18) bật strict | Chưa có gate candidate trong DB. Không dùng absence của setting catalog để khẳng định mọi cấu hình provider bên ngoài |
| Signals | Không có `employee_admin_audit`, `store_change_signals`, `permission_catalog_signals` trong `public`; publication `supabase_realtime` vẫn có 12 bảng, không có hai bảng signal mới | Candidate cần cơ chế phân quyền/revision/invalidation tương ứng | Chưa có các đối tượng hỗ trợ được kiểm; không kiểm Realtime delivery thực tế |

Frontend working tree hiện gọi `permission_get_contract` và từ chối khi contract khác 2 hoặc write protocol khác 1 tại [authRepo.ts:29](D:/Workspace/pos-cafe/src/adapters/supabase/authRepo.ts:29); request REST đính header contract `2` tại [client.ts:23](D:/Workspace/pos-cafe/src/adapters/supabase/client.ts:23). Vì RPC contract và catalog mới thiếu, DB quan sát được **chưa đáp ứng yêu cầu tương thích của frontend mới này**. Nhận định không nói frontend nào đang được deploy trên Vercel.

Không có `supabase_migrations.schema_migrations` trong catalog hiện tại. Không báo số migration cuối hoặc thời điểm migration chưa có nguồn kiểm chứng. Các cấu trúc quan sát đủ để kết luận phần phân quyền mới chưa hiện diện theo contract mong đợi, không đủ dựng lịch sử triển khai.

## Bằng chứng, giới hạn và bàn giao

- [7 query](D:/Workspace/pos-cafe/artifacts/permission-server-status-20261019/queries.json), [receipt MCP gốc](D:/Workspace/pos-cafe/artifacts/permission-server-status-20261019/online-receipt.json), [kết quả chuẩn hóa](D:/Workspace/pos-cafe/artifacts/permission-server-status-20261019/online-normalized.json).
- [Candidate manifest](D:/Workspace/pos-cafe/artifacts/permission-server-status-20261019/candidate-manifest.json) liệt kê SHA256/bytes và snapshot source/report. [normalize-and-freeze.py](D:/Workspace/pos-cafe/artifacts/permission-server-status-20261019/normalize-and-freeze.py) parse lại receipt và kiểm tính nhất quán metadata; PASS của script là kiểm bằng chứng, không phải test hành vi phân quyền.
- Không cài/tải dependency hoặc browser, không tạo runtime/WSL/Docker, không gọi nghiệp vụ/DML/DDL/grant/lock, không kiểm Edge deployment/secrets/Storage hoặc chạy full backend tests. Không dùng Playwright trong lượt này.
- Trước ghi evidence nhỏ, C còn khoảng 185,09 GiB và D khoảng 92,09 GiB; không có thao tác lớn. Giữ gói bằng chứng và recipe nhỏ để tái hiện, không xóa dữ liệu hoặc coi chúng là temp hết nhu cầu.
- Kết quả cần báo người dùng: **chưa cập nhật Supabase cho phần phân quyền mới**; đã xác nhận trực tiếp bằng MCP chỉ đọc ngày 19/10/2026. Việc nâng cấp server là task triển khai riêng với các gate/ủy quyền hiện hành, chưa được yêu cầu trong chat này.
- Review độc lập cho candidate và metadata verdict được lưu riêng tại `docs/reviews/2026-10-19-permission-server-status.md`. Trạng thái tại lúc freeze: đang chờ review, không tuyên bố bàn giao hoàn tất trước hai APPROVE.
