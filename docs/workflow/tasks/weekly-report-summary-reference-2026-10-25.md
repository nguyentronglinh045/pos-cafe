# Tóm tắt tham khảo báo cáo Tuần 3

Người dùng ngày25/10 yêu cầu giọng văn bớt máy móc, viết dạng tóm tắt để xem. Đây là nội dung AI hỗ trợ rút gọn từ dữ kiện đã đối chiếu trong [báo cáo nguồn](weekly-report-linh-2026-10-24.md), chỉ xuất trong chat; không nhận là lời sinh viên tự viết hoặc bản đã đủ điều kiện nộp lại. Giữ yêu cầu tự viết của GVHD trong [hồ sơ từ chối](weekly-report-rejection-2026-10-25.md). Không sửa web/code, không chạy test hoặc phát sinh claim hiện trạng mới ngày25/10.

## Nội dung tham khảo

Bản tóm tắt tham khảo để bạn tự diễn đạt lại:

**Nguyễn Trọng Linh — 24TX810010**

**Công việc tuần 3**

Tuần này em tập trung đưa phần phân quyền vào nhánh `main` và kiểm tra một số luồng trên Supabase staging. Phần đã tích hợp gồm 15 quyền cho bốn vai trò: chủ quán, quản lý, thu ngân và phục vụ. Các tình huống đã kiểm tra gồm giới hạn quyền của thu ngân, tách biệt dữ liệu giữa hai cửa hàng, thu hồi phiên và thay đổi quyền khi nhân viên đang đăng nhập. Ngoài ra, em kiểm tra luồng bán mang đi, thanh toán tiền mặt với dữ liệu mẫu và xử lý ảnh món trên staging.

CI trước merge ghi nhận 1.189 unit/component test đạt. Tuy nhiên, CI sau merge vẫn còn một lỗi kiểm thử giao diện thanh toán trên điện thoại ngang. Các kết quả kiểm tra staging thuộc phiên bản được thử ngày 23/10; kiểm thử backend đầy đủ của bản `main` cuối tuần vẫn chưa hoàn tất và phiên bản phân quyền mới chưa được phát hành production.

Minh chứng: [PR tích hợp phân quyền](https://github.com/nguyentronglinh045/pos-cafe/pull/6), [CI trước merge](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40088569310), [CI sau merge](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40089941679).

**Kế hoạch tuần 4**

Tuần tới em ưu tiên rà soát và sắp xếp lại dự án. Em sẽ kiểm tra những phần mã trùng lặp, logic chồng chéo và các script, cấu hình hoặc tài liệu không còn cần thiết; đồng thời làm rõ trách nhiệm của từng mô-đun để giữ kiến trúc thống nhất. Sau mỗi đợt chỉnh lý, em sẽ kiểm tra lại các luồng gọi món, thanh toán và phân quyền, rồi cập nhật tài liệu cho khớp với mã nguồn.

## Kiểm chứng

Đây là tóm tắt, không thay đổi các số liệu hoặc source boundaries của hồ sơ trước. Bỏ chi tiết về PIN và từng thao tác ảnh thay vì nhận toàn bộ UI/backend đã PASS. Khai báo AI của bản nộp phải giữ đúng thực tế; bản tóm tắt này không phải chứng cứ sinh viên đã tự viết. Các link dùng URL nguyên vẹn. Chờ reviewer kiểm delta biên tập.

Review: `/root/weekly_report_review` APPROVE SHA256 `FF5A3D056C9E208AEEA75022245173368C8B4A2EFB3DA5F594BB0A9C5BB7176B`, không finding chặn. Đã kiểm văn bản và source boundaries theo hồ sơ trước; không sửa file/chạy kiểm thử. Metadata sau freeze; nội dung tham khảo giữ nguyên.