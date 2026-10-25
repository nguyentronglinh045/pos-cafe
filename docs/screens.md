# Màn hình và luồng vào

Bản đồ màn theo `main@711a22e`, đối chiếu 25/10/2026. Quyền và dữ liệu nêu dưới đây là contract trong code, chưa thay nghiệm thu backend. [Features](features.md) mô tả nghiệp vụ; [handoff UI](workflow/tasks/ui-main-docs-integration-2026-10-25.md) giữ kết quả và giới hạn thiết bị thật.

Nguồn chung: [App.tsx:73](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/App.tsx#L73), [PasscodeScreen:42](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/screens/PasscodeScreen.tsx#L42), [registry:22](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/shell/AppShell.tsx#L22), [quyền mở màn:17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/permissionUi.ts#L17).

## 1. Landing

Chọn ghép quán hoặc tạo quán. Đây là pre-login, chưa có authority nhân viên.

## 2. Store Pairing

Nhập Store Key để ghép thiết bị; xử lý key sai/lỗi backend trước khi vào chọn nhân viên. Số cửa hàng đơn lẻ không thay secret.

## 3. Create Store Form & Success

Tạo quán, lựa chọn dữ liệu mẫu, hiển thị Store Key/PIN tạm và yêu cầu lưu thông tin. Owner mới phải đổi PIN trước POS; không coi đây là email ownership provisioning.

## 4. Passcode

Đọc roster tối thiểu, chọn nhân viên và nhập PIN. Phiên normal vào shell; required_pin_change vào bước đổi PIN. Kitchen không được bật trong catalog.

## 5. Rotate Guidance

Màn hướng dẫn xoay thiết bị khi portrait; landscape là luồng POS vận hành.

## 6. App Shell / Left Rail

Điều hướng theo authority/catalog. Khi chưa verified, shell bị che và không tương tác; drawer mở theo quyền của purpose, không theo bảng admin/cashier cũ.

## 7. POS Floor View

B01: sơ đồ theo khu/tầng, dải khu cuộn ngang, bàn/decor và đơn đang mở. floor.view cho dữ liệu vận hành; mở đơn/thanh toán kiểm quyền thích hợp, kể cả nhánh chỉ có quyền thu tiền.

## 8. Order Drawer

B02: menu và giỏ hàng, modifier/số lượng/ghi chú, nháp và gửi đơn. Gọi thêm giữ giá dòng cũ, phần mới lấy quote hiện tại; có trạng thái stale/closed, dirty và lệnh chưa rõ kết quả.

## 9. Payment Drawer

B03: console tiền mặt và danh sách món chọn trả. Mặc định chọn tất cả; chọn một dòng khởi tạo một sản phẩm, nút + xoay vòng đến giới hạn. Chặn khi thiếu tiền, không chọn món, hết quyền hoặc order lỗi/đóng; refetch không tự biến lựa chọn rỗng thành trả toàn bộ. Split tạo đơn paid độc lập, phần còn lại giữ mở; selection về rỗng để lần tiếp theo chọn chủ động.

## 10. Takeaway Drawer

Liệt kê đơn mang đi đang mở, tạo/mở đơn và chuyển thanh toán theo quyền. Đơn kết thúc xem ở history.

## 11. Order History Drawer

orderHistory.view cho danh sách/chi tiết; lọc ngày/trạng thái/loại và phân trang. Số thứ tự hiển thị theo bộ lọc, khác số bill. Void-paid và reprint kiểm quyền riêng; đơn void không in lại như paid.

## 12. Employees Drawer

employee.manage và employee.permission.edit có trách nhiệm khác nhau. Catalog cung cấp manager/cashier/waiter cho editor; owner được bảo vệ. Có form hồ sơ/PIN/overrides và lỗi revision/ceiling. Không nhận toàn bộ dirty-exit đã đồng nhất với các editor khác.

## 13. Menu Editor Drawer

menu.manage: danh mục/món/modifier, liên kết dùng chung và changeset. Ảnh món dùng staging/gateway; kiểm định dạng/kích thước và xử lý save/cancel theo contract, không upload raw qua legacy.

## 14. Floor Editor Drawer

floor.manage: khu, bàn, decor, kéo/resize/xoay, khóa và lưu changeset. Giữ logical stage1600×900, catalog asset, tombstone; không sửa trạng thái bàn do order/payment sở hữu.

## 15. Report Drawer

report.view: doanh thu, đơn paid, average ticket, top món, giờ và số/tiền paid-rồi-void theo business date. Report summary không cấp quyền xem history detail; export chưa hoạt động.

## 16. General Settings Drawer

settings.manage: thông tin quán/hóa đơn; timezone có ràng buộc owner. Purpose display phục vụ tên quán không đòi quyền quản trị settings.

## 17. Clear Demo Dialog

data.clearDemo là owner-only. Có xác nhận và điều kiện dữ liệu; chỉ dọn phần demo theo contract, không xóa tài chính/K/R1/audit hoặc dữ liệu tự tạo.

## 18. Kitchen Queue (Future-only, không đăng ký trong app)

Không có drawer kitchen trong registry. Phiếu gửi bếp chỉ preview; chưa là kitchen workflow/queue/backend.

## 19. Payment Settings / QR Drawer

settings.manage mở form preview bank/QR cục bộ; chưa persist thành xử lý thanh toán điện tử. Không coi nút lưu local là giao dịch provider.

## Drawer/Popup Contract

Portal primitives giữ lớp hiển thị; consumer quyết định đóng/dirty-exit. Authority không verified phải chặn tương tác. Không lấy ảnh/bố cục phase cũ để mô tả UI remake mới. Nguồn chi tiết: [PortalDrawer.tsx:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/components/PortalDrawer.tsx#L1), [PaymentDrawer.tsx:47](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/pos/PaymentDrawer.tsx#L47), [EmployeesDrawer.tsx:150](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/EmployeesDrawer.tsx#L150), [settings/clear contract](data-model.md).
