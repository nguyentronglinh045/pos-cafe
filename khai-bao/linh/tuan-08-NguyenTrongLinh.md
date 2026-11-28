# Khai báo sử dụng AI — Nguyễn Trọng Linh — Tuần 08

### AI-T08-LINH-03 — Gỡ ghép thiết bị, Quên Store Key và Đổi Store Key (T08)

**Yêu cầu đã giao**

Linh giao khảo sát hiệu lực của khóa và phiên thiết bị khi cấp lại Store Key, trình các phương án và cập nhật đặc tả theo lựa chọn đã chốt. Linh yêu cầu phân biệt hai luồng gửi lại khóa hiện hành và tạo khóa mới. Với chức năng gỡ ghép, Linh giao sửa lỗi ảnh hưởng đến máy còn lại, đồng bộ nhãn nút và kiểm lại trên staging bằng hai phiên trình duyệt độc lập.

Linh giao triển khai và kiểm hai luồng Store Key bằng quán thử. Với luồng đổi khóa, Linh yêu cầu giữ bước xác minh quyền, kiểm chuyển tab, ghép lại và nhập PIN, đồng thời hoàn nguyên cấu hình thử sau khi kiểm. Linh chốt mục 11.7g và 12.9 theo phạm vi đã có bằng chứng, giao công bố hồ sơ và đưa các bộ kiểm bổ sung lên GitHub.

**AI đã làm**

Claude Code phân tích hiệu lực khóa và phiên. Codex đối chiếu với mã nguồn, viết đặc tả, thiết kế và kế hoạch kiểm. Codex sửa phạm vi đăng xuất và nhãn gỡ ghép. Ca TC-OWNER-112 đạt trên Vercel staging: phiên cũ của máy A bị từ chối gia hạn, máy B vẫn gia hạn và đọc được Báo cáo. [Hồ sơ kiểm thử gỡ ghép](https://github.com/nguyentronglinh045/pos-cafe/blob/a1a952374ea594865f9433684cacb613401dfd1e/docs/workflow/tasks/tc-owner-112-staging-2026-11-25.md)

Codex triển khai giao diện, xử lý phía máy chủ và các ca kiểm cho hai luồng Store Key. Ở luồng quên khóa, Codex bổ sung bước xác nhận từ trình duyệt để ứng dụng hiện phản hồi trước khi bộ xử lý nền gửi thư. Staging xác nhận thư gửi đúng khóa và phiên POS đang mở vẫn sử dụng được. Ở luồng đổi khóa, Codex chuẩn bị Protected Preview và sửa lỗi mất bước OTP hoặc màn kết quả khi chuyển tab. Các lượt kiểm xác nhận A ghép lại bằng một lần bấm, B tự về màn ghép và cả hai vào lại POS sau khi ghép bằng khóa mới và nhập PIN. Kết quả chỉ áp dụng cho các ca và môi trường ghi trong hồ sơ. [Hồ sơ T08](https://github.com/nguyentronglinh045/pos-cafe/blob/a1a952374ea594865f9433684cacb613401dfd1e/docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md)

Codex sửa phần tích hợp xác thực ở Edge và bổ sung các bộ kiểm cô lập cho thứ tự xử lý Auth, mất phản hồi và phục hồi lượt đổi khóa. Bản sửa Edge đã vào `main` và CI sau hợp nhất đạt 18/18 bước. Lượt chạy bộ kiểm Auth thật trong môi trường cô lập đạt 7/7 ca. Ba PR kiểm thử #55–57 đã vào `main`. Bộ kiểm phục hồi của PR #58 đã được đẩy lên nhánh riêng. [Bản sửa Edge](https://github.com/nguyentronglinh045/pos-cafe/pull/53) · [Kết quả kiểm Auth](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/46118346050) · [PR #58](https://github.com/nguyentronglinh045/pos-cafe/pull/58)

### AI-T08-LINH-04 — Sửa nhãn demo trong luồng tạo quán tuần 7

**Yêu cầu đã giao**

Linh giao tích hợp phần việc của Lâm và Ngọc theo đúng nhánh đích, giữ tác giả và nguồn minh chứng. Khi phát hiện nhãn demo xuất hiện trong luồng tạo quán thật, Linh yêu cầu sửa trước khi hợp nhất.

**AI đã làm**

Codex giới hạn nhãn và hướng dẫn dữ liệu giả trong chế độ mock, bổ sung kiểm thử hồi quy và giữ commit giao diện gốc của Lâm. Bản sửa đạt 6 ca Vitest tập trung, 10 ca smoke mock và 54 lượt kiểm trạng thái giao diện trước khi hợp nhất vào `main`. Codex cũng nhập các hồ sơ tuần 6–7 vào `docs` và bổ sung mục tra cứu minh chứng. [PR #46](https://github.com/nguyentronglinh045/pos-cafe/pull/46) · [Mục tra cứu hồ sơ tuần 6–7](https://github.com/nguyentronglinh045/pos-cafe/blob/a1a952374ea594865f9433684cacb613401dfd1e/docs/implementation-log/README.md#team-week-6-7)
