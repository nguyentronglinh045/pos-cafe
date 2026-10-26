# N2 — Đối chiếu function và signal trên staging

Ngày26/10/2026. Mục đích: gắn [tám sơ đồ hiện hành](../../critical-flows.md) với source code và một phép kiểm DB đích có phạm vi rõ. Không là bằng chứng chạy nghiệp vụ hoặc nghiệm thu backend.

## Đích, quyền và kết quả

- Project staging `ineckiashpwloncxnbqx`; MCP `supabase_pos_cafe`, endpoint `https://mcp.supabase.com/mcp?project_ref=ineckiashpwloncxnbqx&read_only=true&features=database,docs`.
- Dùng OAuth hiện có sau lượt chủ dự án đăng nhập lại N1. Codex CLI App Server gọi MCP với session ephemeral, không model turn; process tắt sau capture. Không đổi config file, đọc token thủ công hoặc truy cập DB gốc.
- Probe: `supabase_read_only_user`, `transaction_read_only=on`, PostgreSQL17.11. Thời điểm server probe `2026-10-26 04:09:29.187573+00`; timestamp client riêng trong raw không dùng làm bằng chứng hai đồng hồ đồng bộ.
- **28/28 function/overload được chọn có fingerprint body khớp source main711a22e.** So MD5 của pg_proc.prosrc với nội dung giữa dollar quotes trong SQL nguồn, bỏ CR hai phía, giữ mọi ký tự khác. Đây là fingerprint văn bản để phát hiện lệch, không phải chữ ký mật mã hay phép kiểm thực thi. Không trả body từ DB, chỉ hash và metadata.
- Publication `supabase_realtime` trả đúng `public.store_change_signals` và `public.permission_catalog_signals`. Query trigger trả13dòng enabled:10trigger signal nghiệp vụ,1trigger signal catalog và2trigger quản lý catalog_state. Không nhận13dòng đều là signal trigger; không chạy subscriber để chứng minh delivery.

[So sánh và nguồn từng function](function-comparison.json) giữ name/signature/hash/path/line; [metadata](metadata.json) giữ kết quả giải mã; [queries](queries.json) giữ chính xác SELECT. [Manifest SHA256](manifest.json) liên kết raw, query và bản giải mã. Evidence N1 về35bảng/332cột và marker nằm [riêng](../staging-schema-20261026/README.md), không được sửa hoặc tính là đã chạy lại.

## Phủ sơ đồ nào

| Hình | Function/metadata được đối chiếu |
| --- | --- |
| F01/F02 | prepare_write, apply_write, lock_write_input; get_write_capabilities, register/execute và dispatcher; checkpoint/quyền tài chính, operation_view, tạo initial print grant |
| F03/F04 | register/get/cancel/list, hai overload execute_write_operation và dispatcher; coordinator/recovery UI đối chiếu từ code, không chạy UI |
| F05/F06 | permission_start_session, revoke_session, current_employee, identity_lock, check_required_pin_session, complete_required_pin_change |
| F07 | permission_get_revision, permission_get_authority, current_employee; lifecycle client đọc từ source |
| F08 | emit_store_change_signal, emit_permission_catalog_signal, permission_read_guard, get_floor_operational/get_open_order_detail; publication/trigger |

Một body khớp không chứng minh mọi function nó gọi, header/owner/config/ACL/RLS hoặc dữ liệu phụ thuộc đều tương đương. Các metadata header hiện tại có trong response để truy vết, không tuyên bố đã so sánh toàn bộ chúng với source. Không suy việc code hiện diện thành activation/deployment acceptance.

## Cách thu thập và tái hiện

Bốn lần execute_sql: một SELECT probe kết nối, ba SELECT catalog về fingerprint/publication/trigger; không RPC nghiệp vụ, không SELECT bảng nghiệp vụ/credential. Discovery giữ đúng năm tool read-only và endpoint đã kiểm. Query metadata là các request riêng, không snapshot transaction duy nhất cho toàn lượt.

Khi tái hiện, xác minh lại endpoint/read_only, probe role/transaction trước; gọi các SELECT trong queries.json qua execute_sql, lưu raw mới, so body hash với đúng source commit. Không thực hiện SQL file nguồn hoặc chạy activation để làm hash khớp. Không dùng timestamp/counts trong evidence này làm kết quả của lần chạy sau.

## Giới hạn và bảo toàn

Không kiểm E2E, lost-ACK, race, tiền, quyền bằng bypass, TTL thực, print hay realtime trên thiết bị. Không thay gate, SHALL, code, schema, config, dữ liệu hoặc evidence cũ. Mermaid chỉ kiểm quan hệ/nhánh và tập cấu trúc cú pháp sử dụng, chưa full renderer/parser hoặc visual QA. [Handoff N2](../../workflow/tasks/docs-critical-flows-2026-10-26.md) giữ review; checklist ngoài repo và chỉ cập nhật đầu ra docs.
