### Mục tiêu tổng quát

Xây dựng hệ thống web quản lý order cho quán cà phê có phân quyền theo vai trò. Hệ thống hỗ trợ nhân viên theo dõi trạng thái bàn, ghi nhận món khách gọi, xử lý đơn tại bàn và đơn mang đi, thanh toán và tra cứu đơn hàng. Chủ cửa hàng có thể quản lý thực đơn, nhân viên và theo dõi doanh thu của cửa hàng.

### Mục tiêu cụ thể

1. Xây dựng chiến lược kiểm thử và chuẩn bị môi trường thử nghiệm để kiểm tra các luồng nghiệp vụ, phân quyền và hồi quy của hệ thống.
2. Hoàn thiện cơ chế chống ghi trùng và khôi phục giao dịch thanh toán khi kết quả xử lý chưa rõ, chẳng hạn khi thiết bị mất kết nối trong lúc thanh toán.
3. Tổ chức lại mô hình phân quyền theo vai trò và quyền sử dụng để kiểm soát chức năng và thao tác mà từng người dùng được phép thực hiện.
4. Tăng cường kiểm tra quyền truy cập tại tầng cơ sở dữ liệu và bảo đảm dữ liệu được cô lập giữa các cửa hàng.
5. Hoàn thiện quản lý tài khoản chủ cửa hàng, xác thực email và kiểm soát quyền tạo cửa hàng.
6. Bổ sung các chức năng khôi phục quyền truy cập khi chủ cửa hàng quên Store Key hoặc PIN, cập nhật thông tin chủ cửa hàng và chuyển quyền sở hữu.
7. Bắt buộc chủ cửa hàng thay đổi mã PIN mặc định trong lần đăng nhập đầu tiên trước khi sử dụng các chức năng bán hàng.
8. Thiết kế lại giao diện các chức năng chính gồm sơ đồ bàn, gọi món, thanh toán và bán mang đi.
9. Bổ sung đồng bộ dữ liệu theo thời gian thực giữa các thiết bị khi có kết nối mạng.
10. Triển khai hệ thống trên Vercel, bổ sung sao lưu và kiểm tra khả năng phục hồi dữ liệu, tăng cường bảo mật và thực hiện kiểm thử hiệu năng.
11. Bổ sung tài liệu tham khảo học thuật về kiến trúc phần mềm, cơ sở dữ liệu, phân quyền và kiểm thử để làm cơ sở cho các quyết định thiết kế và kiểm chứng hệ thống.
12. Hoàn thiện báo cáo đồ án và tài liệu hệ thống, bao gồm đặc tả yêu cầu, thiết kế và kết quả kiểm thử.
