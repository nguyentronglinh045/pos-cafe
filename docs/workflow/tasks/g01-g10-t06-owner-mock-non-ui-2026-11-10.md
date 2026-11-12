# T06 · Đánh giá non-UI luồng OTP tạo quán

Ngày 2026-11-10. Kết quả áp dụng cho mô hình chạy trong bộ nhớ bằng Node trên worktree code local, base `f2b486e8998dd5577f3e79eefe70b908da1e3d62`, với [đặc tả owner local](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md). Test lấy OTP trực tiếp từ hộp thư giả của bộ gửi hiện có. Đồng hồ giả giúp kiểm ở đúng mốc. Thao tác worker chỉ dùng để đặt tình huống trong test.

## Kết quả

| Phần kiểm | Kết quả trên mock |
| --- | --- |
| Gửi OTP và giới hạn phát mã | 8 test hồi quy đạt, gồm gọi port thật qua HTTP loopback cho bước gửi. |
| Dạng mã, mã sai và số lần thử | Lỗi sai dạng không làm mất lượt nhập. Mã sai được so trước PIN. Gửi lại cùng lần nhập trả kết quả cũ. Trong ca TC-OWNER-22, lần nhập cũ đã so OTP và intent chưa được chấp nhận. Đổi OTP hoặc intent trên ID đó trả `A_ATTEMPT_ID_REUSED`. Sai lần thứ 5 làm mã mất hiệu lực. |
| Mã đúng, thông tin khác và hết hạn | Mã đúng với PIN đã đổi bị từ chối. Lần nhập mới với thông tin gốc có thể giữ suất. OTP hết hiệu lực tại mốc 10 phút. Dùng OTP thành công vẫn phải đợi đủ 10 phút mới xin mã khác. |
| Hạn mức và chống trùng | Xác minh trùng tạo một operation trong mô hình. Quán tạm ngưng vẫn chiếm suất. Chủ có thể tạo đủ 5 quán cùng ngày, lượt thứ 6 bị chặn sau khi mã đúng. Thất bại chắc chắn hoàn đúng một suất. Chuyển từ đang tạo sang đã tạo vẫn chỉ tính một suất. |
| TC-OWNER-08, hai nhánh trước và sau khi có tham chiếu Auth | Tra trước hạn trả `accepted`. Sau hạn, lần tra chỉ mang `attemptId`, lần tra lại và replay xác minh cũ đều trả `unknown`. Bản ghi vẫn là `accepted`, suất thứ 5 vẫn bị giữ. Tra hoặc replay không sinh operation hay thư OTP mới. Hành động worker đến muộn bị từ chối trong mô hình. |
| Tra cứu và thời điểm yêu cầu đến | Ca chưa thấy yêu cầu trả `unconfirmed`, rồi trả trạng thái operation khi xác minh tới. ID cũ hơn 30 phút hoặc bị từ chối cuối trả `not_accepted`. Phản hồi tra thành công chỉ có trường `status`. Dấu từ chối ID tương lai vẫn còn ở phút 150. Sau mốc, lần quét dọn dấu và ID cũ bị từ chối theo tuổi. |
| Các lỗi phát hiện khi review | Ràng buộc intent–email của operation vẫn giữ sau khi bản ghi OTP hết thời gian lưu. Dù bộ nhớ replay đầy vì 4.000 yêu cầu không có challenge hoặc bị từ chối do đủ hạn mức, OTP đúng của lượt khác vẫn xác minh được. Bộ đếm sai vẫn tăng và khóa mã sau lần sai thứ 5. |

**Mốc Node proof trước khi nối HTTP xác minh và tra cứu:** 28 test đạt trên manifest `v3-code.sha256` của lượt `owner-provisioning-non-ui-20261110`. Gồm 15 test mô hình xác minh, quota và tra cứu, 8 test hồi quy gửi OTP và 5 test ranh giới kiến trúc. Build đạt và Vite báo cảnh báo kích thước bundle. Kết quả TC-OWNER-08 là phần hành vi server mô phỏng, dùng checklist Claude cho biến thể (b).

## Bổ sung cổng HTTP mock local

Middleware dùng chung một mô hình cho ba thao tác gửi OTP, xác minh và tra trạng thái. `verify` trả HTTP 202 khi nhận lượt đang xử lý; `status` trả HTTP 200 cùng trường `status` khi tra thành công. Hai mã HTTP này là quy ước của adapter mock local. Endpoint chỉ bật khi Vite báo `DEV=true` và `VITE_DATA_MODE=mock`. Middleware chấp nhận POST JSON từ kết nối loopback trực tiếp, host local và origin cùng nguồn nếu có.

**35 test Node đạt trên manifest `v3-code.sha256` của lượt `owner-mock-http-20261110`**, gồm 16 test mô hình, 7 test gửi OTP trực tiếp, 5 test ranh giới kiến trúc và 7 test adapter/middleware. Build và OpenSpec strict đạt. Test HTTP dùng Vite middleware qua loopback trong một tiến trình Node. Ca cổng `DEV` nạp `vite.config.ts` của dự án ở cả hai cấu hình.

| Phần kiểm | Kết quả |
| --- | --- |
| Xác minh qua HTTP | Mã sai trả 400. Dùng lại ID đã ghi cho mã khác trả 409. ID cũ trả thời gian server để client có thể chỉnh giờ. Hai request đồng thời có payload giống nhau đều nhận `accepted`, chỉ giữ một lượt trong mock. Mã xác minh phụ chỉ tra được operation đã gắn, kể cả sau 91 phút, và bị từ chối nếu dùng cho intent khác. |
| Giới hạn và trạng thái cuối của mã tra | Mock giới hạn 64 mã phụ trên mỗi operation. Test mô hình xác nhận một operation dùng hết mã phụ thì operation khác vẫn thử lại được và mã đã cấp vẫn tra được. Test HTTP xác nhận mã đã bị từ chối vẫn tra ra `not_accepted` dù lượt xác minh khác của cùng intent thành công. |
| TC-OWNER-08(b) qua HTTP | Fixture bỏ phản hồi xác minh sau khi mock nhận lượt. Các lời gọi tra sau đó chỉ gửi mã tra. Tra trước hạn trả `accepted`, sau hạn trả `unknown`. Replay xác minh dùng lại cùng ID. Số operation, thư OTP và suất giữ nguyên. |
| Tra cứu và bí mật | Adapter chỉ gửi `attemptId` kể cả khi bên gọi truyền thêm trường. Endpoint từ chối tra có OTP. Adapter từ chối phản hồi tra có Store Key và các cặp mã HTTP với body sai hợp đồng, gồm 503 mang lỗi ID cuối cùng. Lỗi tra tạm thời 503 thử lại được với cùng ID. |
| Phạm vi cổng local | `DEV=false` và cấu hình Supabase đều tắt endpoint. Test chặn host/origin ngoài local, query có OTP và đường mailbox. Fixture đọc mã trực tiếp trong Node. Phạm vi này dựa vào kết nối trực tiếp, chưa đo khi có proxy trên loopback. |

## Phần còn chờ

- **Node mock:** chưa kiểm lỗi giao dịch, Store Key và đóng cửa sổ nhận lại, thư Store Key, hoặc retry seed theo R06-A. Trạng thái `created` trong mô hình chỉ dùng để kiểm chuyển trạng thái và đếm suất.
- **FE:** UI hiện mới nối bước gửi OTP. Sau khi có phần Store Key và màn hình, kiểm F5, `sessionStorage`, rời tra cứu giữ mã và màn ghép với ô trống theo quyết định 49.
- **DB/Auth và SMTP:** các test cùng lượt trong một tiến trình Node không kiểm được khóa/giao dịch DB thật, race giữa các tiến trình, phản hồi Auth đến muộn hoặc tác dụng phụ nhà gửi. Các phần đó cần môi trường T05 và cổng staging riêng.

## Lệnh chạy lại

```powershell
Set-Location 'D:/Workspace/pos-cafe-owner-mock-local'
npm.cmd test -- --environment node src/adapters/mock/ownerProvisioningModel.test.ts src/adapters/mock/ownerOtpServer.test.ts src/adapters/mock/ownerOtpMiddleware.test.ts src/architectureBoundaries.test.ts --reporter verbose
npm.cmd run build
```
