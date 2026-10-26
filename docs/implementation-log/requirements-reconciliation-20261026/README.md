# Metadata R06 — 26/10/2026

Consumer: [R06-A/B/C](../../spec-reconciliation.md#r06-detail), [handoff N4](../../workflow/tasks/docs-requirements-reconciliation-2026-10-26.md). Đây là evidence mới, không sửa hoặc thay N1/N2 hay kết quả runtime cũ.

## Nguồn, thao tác và giới hạn identity

- Source code `711a22e71983e3d6aa17799649af05ce4c762555`, docs khảo sát `669a27158032d585bef986be2145d6fc8d26a412`.
- MCP `supabase_pos_cafe`, SELECT-only. Probe trả role `supabase_read_only_user`, transaction_read_only `on`; PostgreSQL không cung cấp setting project_ref/URL trong hai key đã thử.
- Đọc riêng `projectRef` từ JSON comment của bảng marker bootstrap: `ineckiashpwloncxnbqx`. Binding này phù hợp staging đã được chủ dự án chỉ định; bộ tool không có project URL/provider API để xác thực endpoint độc lập. Không coi comment là chứng thực mật mã hoặc kiểm full target provenance. Không đọc row marker/binding đầy đủ hay dữ liệu Auth/nghiệp vụ.
- Không RPC nghiệp vụ, đổi cờ inactive, tạo/xóa data, DDL, recovery hoặc chạy test. Tất cả kết luận thực thi bên dưới là đọc source/catalog, không runtime PASS.

## Kết quả chọn lọc

14 body function/overload khớp source theo MD5 `pg_proc.prosrc`, chuẩn hóa bỏ CR. Fingerprint chỉ đối chiếu text, không checksum bảo mật; không nhận matching body là matching toàn bộ dependencies, ownership, grants, policies hoặc triển khai app. Metadata có security_definer/volatility/configuration và effective EXECUTE của ba role đã hỏi, được quan sát riêng.

| Function / overload quan sát | Source khớp body |
| --- | --- |
| `private.assert_store_owner()` | [permission-identity.sql:24](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L24) |
| `private.permission_current_employee(p_lock boolean)` | [permission-identity.sql:159](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L159) |
| `private.permission_initial_seed_status_json(p_store uuid)` | [permission-seed.sql:6](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-seed.sql#L6) |
| `private.permission_read_guard(required text[])` | [permission-read.sql:5](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-read.sql#L5) |
| `private.permission_store_mutex(sid uuid)` | [permission-identity.sql:129](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L129) |
| `public.permission_begin_initial_seed(p_request jsonb)` | [permission-seed.sql:101](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-seed.sql#L101) |
| `public.permission_get_initial_seed_status()` | [permission-seed.sql:89](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-seed.sql#L89) |
| `public.permission_get_store_session()` | [permission-identity.sql:523](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L523) |
| `public.permission_run_initial_seed_stage(p_request jsonb)` | [permission-seed.sql:129](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-seed.sql#L129) |
| `public.permission_start_session(p_employee_id uuid, p_pin text)` | [permission-identity.sql:226](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L226) |
| `private.is_verified_admin()` | [016_activate_write_protocol.sql:183](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/016_activate_write_protocol.sql#L183) |
| `private.permission_identity_lock(sid uuid, eid uuid, all_sessions boolean)` | [permission-identity.sql:146](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L146) |
| `public.clear_demo_data(p_employee_id uuid)` | [016_activate_write_protocol.sql:237](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/migrations/016_activate_write_protocol.sql#L237) |
| `public.clear_demo_data(p_request_id uuid, p_confirmation boolean)` | [permission-changes.sql:269](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-changes.sql#L269) |

Query bổ sung hỏi cả ba tên public `seed_demo_employee`, `seed_demo_menu`, `seed_demo_floor`: không có row cho chúng. `clear_demo_data(uuid,boolean)` có EXECUTE cho anon/authenticated; overload một UUID không có cho ba role đã hỏi. Source bản mới có guard session ở đầu; N4 chưa gọi để kiểm bypass/deny, không kết luận anonymous được xóa dữ liệu. Grant của helper private không tự đồng nghĩa quyền gọi REST.

`public.stores.is_active`: boolean NOT NULL DEFAULT true. RLS bật, FORCE RLS false; ba policy `tenant_select/admin_insert/admin_update` tồn tại. Authenticated SELECT/UPDATE bảng và UPDATE is_active đều false tại thời điểm đọc. Biểu thức policy ghi trong metadata, nhưng chưa kiểm hết helper/dependency hoặc mọi role. Đặc biệt tồn tại policy không thay quyền truy cập bảng, và ACL/policy không chứng minh luồng app xử lý trạng thái inactive.

## Hồ sơ và recipe tái kiểm

- [metadata.json](metadata.json): năm SELECT, raw MCP result và rows đã parse; gồm probe, identity comment, nhóm function chính, catalog stores và function bổ sung. Không chứa secret hoặc row nghiệp vụ.
- [function-comparison.json](function-comparison.json): 14 body, metadata riêng và source match/path/line.
- [manifest.json](manifest.json): SHA256 của hai file dữ liệu; không dùng self-hash.

Tái kiểm: xác minh kết nối đích và chế độ chỉ đọc; chạy đúng SELECT đã lưu; lấy `git show <code>:<path>` từ source ghim; lấy body giữa dollar quotes của CREATE FUNCTION, bỏ CR và tính MD5 UTF-8 rồi đối chiếu prosrc. Không gọi function để “thử cho chắc”. Nếu cần test hành vi, tạo task kiểm riêng và môi trường đã được giao; không cập nhật PASS vào gói catalog này.

Review và bảo toàn ghi tại handoff; metadata này không đóng backend/PIN, Storage/Realtime, khóa store, reseed hoặc owner G05/G06.
