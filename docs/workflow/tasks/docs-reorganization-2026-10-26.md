# Tổ chức lại năm nhóm tài liệu — 26/10/2026

## Quyền và nguồn

Chủ dự án: “xử lý cả5mục theo đề xuất, mục5cập nhật theo kiến trúc hiện hành; giữ nguyên evidence gốc, chưa refactor code; kiểm tra và review xong thì push nhánh docs”, cho phép tùy nội dung giữ/cập nhật/bỏ phần cũ. Đây là quyền chỉnh lý/publish tài liệu, không là deploy ứng dụng hoặc sửa requirement/acceptance.

Docs đầu vào `8bf74fd9b8e2c3962ecafbd9e5fde3ca830be0a2`, remote docs `9b4fd3acb626a27b3561f3e3d2bfd0d8cad51088`; main remote `711a22e71983e3d6aa17799649af05ce4c762555` được đối chiếu26/10. Main worktree HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP; không switch/stash/reset/clean hoặc đưa WIP vào mô tả đã xuất bản. Dùng Git blobs và index riêng, không tạo worktree docs. Các commit docs local có trước được giữ nguyên khi push nhánh.

## Năm đầu ra

| Mục | Xử lý thực tế | Giữ lại / không suy rộng |
| --- | --- | --- |
| CI/CD | Hai proposal cũ thành bảng đối chiếu phạm vi; setup là đầu mối, có trạng thái nguồn26/10. | Nguyên bản trong history cùng change; cache/schedule/rollback/migration và gate còn thiếu không mất. |
| UI | Một chỉ mục ui-evolution nối proposal tổng, Week03, B01/B02/B03 và integration. Proposal tổng cập nhật; batch thêm dẫn hướng. | Scope/reference/DEV/approval và raw từng batch giữ nguyên. Mang đi/owner/thiết bị thật còn giới hạn. |
| Database enforcement | Map năm nhóm yêu cầu và bảy câu hỏi gốc sang catalog15 hoặc phần dư. | Giữ G04, inventory ngoài scope, audit/retention và trạng thái store còn mở; không khẳng định đã an toàn toàn DB. |
| Roadmap/testing | Trang chính giữ trạng thái/lịch hiện hành; chuyển các đoạn lịch sử sang roadmap-history/testing-history. | Cùng thư mục nên link tương đối không đổi; neo cũ dẫn đến lịch sử. Counts, ngày, FAIL/NOT_RUN và lời quyết định giữ nguyên. |
| HTML kiến trúc | Thay ví dụ raw-repository bằng AppPorts/authority/purpose-query/write protocol, có sơ đồ và nguồn ghim. | Chỉ mô tả implementation; backend activation/acceptance và việc đổi DB thật chưa được chứng minh. Bản HTML cũ truy qua Git, không còn là đường đọc chính. |

Đã bỏ các mô tả lỗi thời/trùng khỏi đường đọc chính, không xóa file evidence. Không apply/archive OpenSpec như nghiệm thu xong. Các nguồn trước lượt này truy qua parent; history proposal giữ body nguyên byte. Nội dung học chung tám kiểu kiến trúc/quiz trong HTML cũ được thay bằng giải thích cụ thể của dự án, không coi đó là lịch sử phương án người dùng thực sự đã cân nhắc.

## Giới hạn và bàn giao

DDD và đúng source demo tiểu luận còn chưa xác minh; owner email, seed lại Settings, store-status enforcement, join-only sync và backend/service gates giữ nhãn còn thiếu. Không dùng task docs để tự giải quyết nghiệp vụ. Các link quan trọng đã chuyển sang nguồn trong repo hoặc ghim commit; raw local/đích dịch vụ chưa được kiểm lại.

HTML phục vụ chủ dự án/AI/người viết báo cáo: bản đồ trách nhiệm, luồng đọc, thanh toán và hồi phục; giao diện tài liệu gọn, xanh teal, font hệ thống, không tải dependency; có lựa chọn luồng và theme. Cung cấp đường đọc code từ entry → flow → port/adapter → server; chưa ghi người dùng đã đọc/hiểu.

Kiểm trước push: diff/links/anchors/source, body lịch sử và frozen evidence, WIP, controls/nội dung HTML và hai review độc lập đúng candidate. Không chạy app/backend, cài gói, tải image, tạo lab hoặc sửa code.

Kế hoạch xem HTML ở trình duyệt bị chặn: URL policy từ chối giao thức file://; không dùng đường vòng để vượt chính sách. Kiểm thay thế có phạm vi hẹp hơn bằng jsdom24.1.3 đã có trên máy, chạy offline, không phát request mạng: ba luồng/12bước, nút trước–sau/chọn bước, nguồn ghim, theme, print disclosure, fallback không JS và anchor. Không nhận kiểm DOM là kiểm layout/screenshot; render rộng/hẹp, chồng lấp và tương phản thực tế chưa được xác minh bằng trình duyệt. Reviewer phải đánh giá cả giới hạn này, không được suy PASS hiển thị.
