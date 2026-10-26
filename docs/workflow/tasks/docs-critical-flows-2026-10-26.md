# N2 — Sơ đồ các luồng quan trọng

Ngày26/10/2026. [Bộ sơ đồ](../../critical-flows.md) · [Evidence DB bổ sung](../../implementation-log/critical-flows-20261026/README.md) · [N1 trước đó](docs-data-model-2026-10-26.md).

## Đề bài và quyền thực hiện

Chủ dự án yêu cầu push phần docs đã review rồi làm phần2; nhấn mạnh cả session chỉ cập nhật docs theo thực tế code và DB, không sửa/refactor code. Đã push đúng tip đã review `319afc6631c15d0fc799cbd8270ad64a211976a6` lên origin/docs và kiểm remote sau push; main remote vẫn `711a22e71983e3d6aa17799649af05ce4c762555`. Push này xuất bản N1 và đối chiếu schema staging; không thay gate backend/triển khai sản phẩm.

Phạm vi N2: bốn nhóm trong checklist local — thanh toán/tách đơn; mất phản hồi–thử lại–khôi phục; phiên/PIN/quyền; signal–đọc lại dữ liệu. Chỉ đọc source và metadata staging qua MCP, cập nhật tài liệu. Không migration, thay dữ liệu, gọi RPC nghiệp vụ, test app/backend, refactor, cài dependency/lab hoặc sửa yêu cầu/acceptance. N2 tạo candidate và commit docs local sau review; chưa nhận phần việc này là quyền push mới.

## Nguồn và đầu ra

Docs base `319afc6631c15d0fc799cbd8270ad64a211976a6`; code main711a22e ghim đầy đủ trong mỗi nguồn. Main local ở `5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP, không dùng để trộn vào mô tả đã xuất bản. Không checkout/switch/stash/reset/clean hoặc tạo worktree docs; commit bằng index riêng.

1. critical-flows.md có tám sơ đồ F01–F08, bốn nhóm, ngày/trạng thái/phạm vi DB, nguồn, nhánh lỗi và diễn giải ranh giới transaction.
2. README/architecture/task index thêm đường đọc; report-source-map ánh xạ từng hình sang luận điểm và giới hạn khi viết báo cáo.
3. Evidence mới ghi fingerprint28function/overload, publication và trigger staging; raw cũ của N1 giữ nguyên.
4. Checklist vẫn ở `D:/Workspace/pos-cafe-docs-priorities.local.md`, ngoài Git. Chỉ tích N2 khi kiểm/review đạt; P1-03/N3–N5/H1–H4 giữ mở.

## Các điểm implementation phải giữ đúng

- Thanh toán tất cả đóng đơn cũ; trả một phần tạo đơn paid mới giữ số cũ, đơn nguồn giữ ID/open, nhận số tiếp theo. Không biến thành partial payment trên cùng một đơn.
- Register và execute là hai transaction. Lỗi đã xử lý trong apply rollback subtransaction trước khi ghi rejected; không nhận mọi lỗi/network timeout là rejected.
- RetryCurrent get rồi execute cả terminal; resume chỉ execute khi get lại còn pending. Unknown là trạng thái client, không có trong DB enum. Get/list ứng dụng có thể materialize expiry; không nhầm với MCP SELECT catalog.
- Required-PIN session5phút không có authority nghiệp vụ; normal12giờ. Đổi PIN thành công thu hồi phiên và về đăng nhập; mất ACK không chứng minh rollback.
- Realtime chỉ signal; projection được đọc lại và kiểm phiên/quyền. Join-only menu vẫn có giới hạn, poll5giây không áp dụng mọi query.

## Kiểm chứng và giới hạn

MCP khóa vào stagingineckiashpwloncxnbqx/read_only=true, role supabase_read_only_user và transaction_read_only=on. Bốn execute_sql chỉ đọc catalog/settings: một probe, ba query metadata; không gọi RPC nghiệp vụ hoặc đọc dòng người dùng. Fingerprint body của28function/overload được chọn khớp source; publication chỉ hai bảng signal. Metadata không chứng minh mọi dependency/config/grant/policy đúng, runtime PASS hoặc giao nhận realtime.

Kiểm offline đối chiếu source/nhánh, liên kết/anchor, raw→metadata và hash manifest; kiểm cấu trúc Mermaid theo tập cú pháp sử dụng. Không chạy renderer/parser Mermaid đầy đủ hoặc tạo ảnh; không thử lại preview HTML đã bị policy chặn. Hai review độc lập bắt buộc: tính đúng luồng/code/DB và preservation/phạm vi/truy vết. Receipt cuối ghi candidate, verdict, số kiểm và commit. Đường đọc cho chủ dự án: F01/F02 → F03/F04 → F05–F07 → F08; chưa nhận chủ dự án đã đọc/hiểu hoặc nghiệm thu sản phẩm.

## Findings và xử lý trong review

Candidate đầu `ac32b4e1876f58445e3e1cf4ddee3d10ed8b4c4c`: reviewer knowledge phát hiện **N2-K01, chặn** — nhãn F07 gộp mọi bundle không nhất quán vào unavailable, trong khi validate/adapter có thể trả EMPLOYEE_SESSION_REQUIRED và kết thúc phiên. Đã sửa hình theo ba nhóm lỗi: protocol không hỗ trợ → compatibility block; nhóm phiên → expire; lỗi còn lại/deadline → unavailable. Đoạn giải thích ghi rõ các mã và revision freshness. Reviewer preservation APPROVE candidate đầu trong scope của mình, đề xuất không chặn làm rõ câu về protocol; đã sửa thành điều kiện “Nếu phiên bản hợp đồng không được hỗ trợ…”. Candidate sau sửa cần cả hai reviewer xác nhận lại; receipt cuối ghi verdict trên candidate cuối.

## Bước tiếp theo

N3 là nguồn học thuật theo luận điểm; N4/N5 và việc xuất hình/visual QA làm theo phạm vi được giao tiếp. Chưa có yêu cầu triển khai code hoặc thay chính sách nghiệp vụ trong lượt này.
