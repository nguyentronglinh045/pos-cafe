### Đối tượng và môi trường sử dụng

POS Cafe là ứng dụng web tiếng Việt dành cho quán cà phê nhỏ. Người dùng truy cập bằng trình duyệt trên máy tính hoặc thiết bị di động có kết nối mạng. Giao diện ưu tiên màn hình ngang. Hệ thống phục vụ bốn vai trò gồm chủ cửa hàng, quản lý, thu ngân và nhân viên phục vụ. Mỗi cửa hàng có dữ liệu và quyền truy cập riêng.

### Phạm vi chức năng

- **Vận hành bán hàng.** Xem sơ đồ và trạng thái bàn. Lập và cập nhật đơn tại bàn hoặc đơn mang đi, chọn món, số lượng và tùy chọn. Thanh toán bằng tiền mặt cho cả đơn hoặc cho các món được chọn, tính số tiền còn thiếu hoặc tiền thối, xem và in hóa đơn qua trình duyệt. Tra cứu lịch sử đơn và xem báo cáo doanh thu theo quyền. Thiết kế lại giao diện sơ đồ bàn, gọi món, thanh toán và bán mang đi.
- **Quản trị và phân quyền.** Quản lý thực đơn, sơ đồ bàn, nhân viên và quyền sử dụng. Phân quyền theo vai trò và từng thao tác, kiểm tra quyền tại tầng cơ sở dữ liệu và kiểm chứng việc cô lập dữ liệu giữa các cửa hàng.
- **Tài khoản chủ cửa hàng và thiết bị.** Xác minh email và kiểm soát quyền tạo cửa hàng. Ghép thiết bị bằng Store Key và đăng nhập POS bằng PIN. Yêu cầu chủ cửa hàng đổi PIN mặc định trong lần đăng nhập đầu tiên. Phạm vi gồm lấy lại hoặc cấp lại Store Key, khôi phục PIN chủ, đổi email và chuyển quyền sở hữu cửa hàng.
- **Tính nhất quán và đồng bộ.** Chống ghi trùng khi gửi lại yêu cầu thanh toán, tra cứu và khôi phục giao dịch khi kết quả xử lý chưa rõ. Đồng bộ dữ liệu theo thời gian thực và kiểm tra việc cập nhật trạng thái bàn, đơn hàng giữa các thiết bị trực tuyến của cùng cửa hàng.

### Triển khai, kiểm thử và tài liệu

Đề tài xây dựng chiến lược kiểm thử, chuẩn bị bộ kiểm thử chạy cục bộ và dùng môi trường thử nghiệm (staging) để kiểm tra tích hợp với hệ thống phía máy chủ. Các ca kiểm thử tập trung vào luồng nghiệp vụ, phân quyền, chống ghi trùng, đồng bộ và hồi quy các chức năng đã có.

Đầu ra dự kiến gồm bản web triển khai trên Vercel, minh chứng kiểm thử, hồ sơ sao lưu và thử phục hồi dữ liệu, kết quả kiểm tra bảo mật và kiểm thử hiệu năng. Hồ sơ đồ án gồm tài liệu yêu cầu, thiết kế, báo cáo và tài liệu tham khảo học thuật về kiến trúc phần mềm, cơ sở dữ liệu, phân quyền và kiểm thử.

### Giới hạn của đề tài

Các nội dung ngoài phạm vi gồm chế độ ngoại tuyến, thanh toán QR qua ngân hàng, tích hợp máy in chuyên dụng, hệ thống điều phối đơn cho bếp, quản lý kho, chương trình khách hàng thân thiết và quản lý chuỗi cửa hàng.
