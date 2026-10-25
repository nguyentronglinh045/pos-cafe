# Tuần 3: tích hợp riêng B01 và B02

Ngày 24/10/2026. Phạm vi được chủ dự án chốt: chỉ B01 và B02, repo nguyentronglinh045/pos-cafe, tác giả commit và người tạo PR 24tx610002-VoVanNgoc. Màu/font/reference đã duyệt giữ nguyên. Hai runtimecontract app5191/ref4185 được duyệt qua phản hồi “Duyệt hai hợp đồng runtime B01–B02”. Không merge/deploy.

B01 cần dãy chọn khu vực ổn định khi nhiều lầu, tên dài và màn ngang nhỏ; B02 cần giao diện gọi món/giỏ hàng theo thiết kế đã duyệt. Tách hai màn từ gói ba màn đã review sang worktree mới trên main2da0d7e, không đưa remakeB03 vào PR. Nhánh code ui/week03-b01-b02-20261024; companiondocs ui-week03-b01-b02-docs-20261024 trên docs4125687.

Tiếp nối thiết kế đã báo cáo tuần2; nhãn commit/PR mới dùng Tuan3 thống nhất. Không sửa lịch sử commit thiết kế cũ hoặc tạo báo cáo tuần1 khi chưa có nội dung được cung cấp. B03/ReceiptPreview và các file nghiệp vụ tài chính giữ nguyên main.

Quyết định màu Palette A v1 và Be Vietnam Pro không hỏi lại. Runtime mới có quyết định riêng, không chép approval/hash cũ. Chạy lại gate trên source hai màn, không nhận PASS ba màn thay thế. Các vấn đề ngoài slice được phân loại, không tự sửa hoặc updatebaseline. Kiểm thử máy thật thủ công hiện NOT_RUN do nativewindowcapturetimeout; PR ở trạng thái draft cho tới khi người phụ trách kiểm tra mẫu trên thiết bị thực tế.
