# Screenshots

> Cập nhật điều hướng 25/10/2026: Các chỉ mục current trong thư mục này là bộ ảnh/checklist lịch sử, không đại diện đầy đủ main711a22e. Evidence UI mới nằm trong package được [handoff tích hợp](../workflow/tasks/ui-main-docs-integration-2026-10-25.md) dẫn tới; không coi tên current là đã cập nhật hôm nay.


## Folder Này Chứa Gì

Folder này giữ chỉ mục Markdown cho screenshot/UI baseline. Nhánh docs có thể giữ evidence ảnh/JSON/ZIP có source, consumer và lý do retention theo [chính sách chung](../README.md); không còn đúng khi gọi toàn nhánh là Markdown-only.

- `current/`: ghi chú về bộ screenshot gần nhất; ảnh cần refresh nên tạo ngoài nhánh `docs` hoặc lưu ở artefact báo cáo riêng.

## Khi Nào Nên Đọc

- Khi cần biết bộ màn nào nên chụp lại để hiểu UI hiện tại.
- Khi chuẩn bị prompt cho Gemini/Stitch/Figma/agent redesign.
- Khi so sánh trước/sau UI rework.

## Quy Tắc Duy Trì

- Không đưa hàng loạt output ảnh/prototype vào knowledge base. Ảnh dùng cho báo cáo mặc định lưu trong artefact báo cáo; evidence cần giữ trên docs phải có source, phạm vi, consumer và retention rõ theo chính sách chung.
- Giữ nguyên evidence lịch sử đã được nhận vào docs. Di chuyển/xóa cần kiểm consumer và duyệt phạm vi; không xóa binary để làm khớp quy tắc cũ.
- Khi UI core thay đổi đáng kể, chụp lại floor, order, payment và takeaway trước; với scope hiện tại cần giữ thêm baseline cho Employees Drawer hai pane, modifier picker, transform handles, instant pay và flow hủy đơn paid/report sau hủy. Không đưa kitchen vào bộ current cho đến khi feature được mở lại.
- Screenshot dùng trong báo cáo phải ghi baseline commit/ngày và lưu ngoài nhánh `docs`; bộ 2026-06-20 không phải evidence UI cho `main@b7b7262`.
