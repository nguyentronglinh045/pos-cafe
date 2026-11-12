# T06 · Bàn giao UI tạm cho luồng tạo quán mock

Ngày 2026-11-10. Mục đích của UI tạm là chạy luồng và kiểm hành vi theo [đặc tả](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md). Thiết kế giao diện chính thức sẽ được giao riêng.

## Các màn cần làm lại

| Màn hoặc trạng thái | Phần UI giao thành viên | Hành vi cần giữ |
| --- | --- | --- |
| Form **Tạo quán mới** | Bố cục, nhãn/hướng dẫn nhập, trạng thái lỗi trường, vị trí tùy chọn dữ liệu mẫu | Giữ validation và các trường email, tên, địa chỉ, PIN chủ, tùy chọn seed. F5 bỏ dữ liệu đang nhập. |
| **Xác minh email** | Bố cục ô OTP, lỗi, loading và đếm ngược gửi lại. Dòng mã fixture chỉ phục vụ xem thử local. | Mã 6 số kể cả số 0 đầu, giữ ID khi retry cùng yêu cầu, khóa gửi lại đến giờ server. |
| **Trạng thái tạo quán** | Bố cục cho đang xử lý, chưa rõ, đã tạo, thất bại, chưa được chấp nhận, lỗi tra tạm thời và lỗi lưu mã tra | Sau F5 chỉ dùng `attemptId`. Rời qua Trang đầu hoặc Ghép thiết bị khi chưa rõ vẫn giữ mã. Vào lại tra đúng lượt cũ. Rời kết quả cuối thì bỏ mã. |
| **Đã tạo quán** | Khối hiển thị Store Key, hướng dẫn lưu, phản hồi sao chép và nút xác nhận đã lưu | Giữ nút sao chép và **Tôi đã lưu Store Key**. Xác nhận thành công mở màn ghép với ô trống. Tra cứu sau F5 không nhận lại key. |

Điểm nối giao diện nằm ở [OwnerCreateRequestScreen.tsx](https://github.com/nguyentronglinh045/pos-cafe/blob/a1292b415e3e9756cb13e490ec30dcc162b49fbd/src/app/screens/OwnerCreateRequestScreen.tsx). Logic giữ mã tra và xử lý retry ở [useOwnerCreateCloseout.ts](https://github.com/nguyentronglinh045/pos-cafe/blob/a1292b415e3e9756cb13e490ec30dcc162b49fbd/src/app/screens/useOwnerCreateCloseout.ts). Màn Ghép thiết bị, màn PIN và thông báo retry seed của POS dùng component hiện có. R06-A vẫn đặt retry tại thông báo chung sau khi owner đăng nhập bằng PIN.

## Mở preview local

Lấy nhánh [`owner-mock-ui-handoff-20261110`](https://github.com/nguyentronglinh045/pos-cafe/tree/owner-mock-ui-handoff-20261110). Nếu chưa có checkout riêng, có thể clone và cài dependencies theo lockfile:

```powershell
git clone --branch owner-mock-ui-handoff-20261110 --single-branch https://github.com/nguyentronglinh045/pos-cafe.git pos-cafe-owner-ui
Set-Location ./pos-cafe-owner-ui
npm.cmd ci
```

Từ thư mục gốc checkout code, chạy:

```powershell
$env:VITE_DATA_MODE = 'mock'
$env:VITE_OWNER_CREATE_FIXTURE = '1'
npm.cmd run dev -- --host 127.0.0.1 --port 5179 --strictPort
```

Mở [preview](http://127.0.0.1:5179/?owner-create-mock=1) rồi chọn **Tạo quán mới**. Dùng email giả mới, PIN thử, và OTP `012345`. Bật dữ liệu mẫu nếu cần kiểm nhánh lỗi menu một lần, rồi ghép thiết bị, đăng nhập owner và bấm **Thử lại dữ liệu mẫu**. Khi chạy lại trong vòng 10 phút, dùng email thử khác hoặc đợi hết cooldown. Fixture phục vụ loopback ở Vite dev mock.

Chạy `npm.cmd run smoke:owner-create` để kiểm riêng fixture closeout trên năm kích thước. Lệnh tự bật OTP fixture và khởi động Vite riêng. Nhóm hồi quy gửi mã chạy riêng với `npm.cmd run smoke -- tests/smoke/owner-create-otp-phase1.spec.ts --workers=1`. Hai lệnh cần chạy tuần tự vì dùng chung cổng.

## Giới hạn bằng chứng

- Provisioning, hộp thư OTP và thư Store Key đều mô phỏng trong bộ nhớ Vite. Dữ liệu POS mock sau ghép nằm trong runtime của trình duyệt. Reset dev server làm mất quán thử.
- Preview dùng PIN đã đặt lúc tạo quán để đăng nhập owner. Đổi PIN và thu hồi phiên giữa các thiết bị thuộc luồng quản lý phiên riêng.
- Phần mail mock kiểm hàng đợi một bản ghi và nhánh gửi thất bại. Hành vi SMTP thật, ràng buộc DB/Auth và chống tranh chấp giữa tiến trình thuộc staging.
- Smoke kiểm một phản hồi xác minh bị mất sau khi mock đã tạo quán, retry cùng ID và F5 qua HTTP. Các phản hồi `unknown` và `failed` được đưa vào UI bằng fixture, còn hành vi operation tương ứng được kiểm riêng bằng Node.
- UI này phục vụ kiểm hành vi. Checklist thiết kế chính thức nằm ở bảng trên.
