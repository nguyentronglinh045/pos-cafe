# Phiên làm việc của nhân viên

## ADDED Requirements

### Requirement: Ba tầng danh tính tách bạch

Hệ thống SHALL phân biệt rõ ba tầng danh tính, mỗi tầng có cơ chế xác thực riêng và không tầng nào thay thế được tầng nào:

| Tầng | Là ai | Xác thực bằng | Dùng ở đâu |
| --- | --- | --- | --- |
| Chủ cửa hàng | Người đứng tên cửa hàng | Mã xác nhận gửi về email thật, cho từng thao tác; không mật khẩu, không phiên đăng nhập | Bước xác nhận của các thao tác quan trọng |
| Thiết bị đã ghép | Một máy đặt tại quán | Phần bí mật trong Store Key | Ứng dụng POS |
| Nhân viên | Người đang trực máy | PIN | Ứng dụng POS, sau khi thiết bị đã ghép |

Thiết bị tại quán MUST NOT lưu mã xác nhận hay bất kỳ bằng chứng nào của chủ. Thiết bị đã ghép và PIN chủ quán MUST NOT tự thay được mã xác nhận gửi về email.

Một người có thể đồng thời là chủ cửa hàng và là nhân viên vai trò `owner` của cửa hàng đó. Hai vai trò này SHALL được xác thực riêng: vào POS bằng PIN trên thiết bị đã ghép; thao tác quan trọng thì nhập thêm mã gửi về email.

Mã truy vết: REQ-SESSION-01.

#### Scenario: Chủ thao tác nghiệp vụ tại quán

- **WHEN** chủ muốn xem báo cáo và sửa thực đơn
- **THEN** chủ ghép thiết bị của mình bằng Store Key rồi đăng nhập bằng PIN của vai trò `owner`

#### Scenario: Mã xác nhận không mở khóa thiết bị

- **WHEN** một người nhận mã xác nhận tạo quán trên một thiết bị chưa ghép
- **THEN** thiết bị đó vẫn chưa có phiên cửa hàng và vẫn phải nhập Store Key để ghép

#### Scenario: Biết PIN chủ là chưa đủ

- **WHEN** một thiết bị đã ghép có nhân viên vai trò `owner` đang đăng nhập nhưng không có mã gửi về email
- **THEN** thiết bị đó không thực hiện được cấp lại Store Key, đổi email, chuyển quyền hay reset dữ liệu

### Requirement: Bản ghi nhân viên vai trò chủ quán gắn với tài khoản chủ

Mỗi cửa hàng SHALL có đúng một nhân viên vai trò `owner`. Liên kết với tài khoản chủ nằm ở bản ghi cửa hàng (`stores.owner_account_id`), bản ghi nhân viên không lưu liên kết riêng. Vai trò `owner` chỉ đổi người qua luồng chuyển quyền (REQ-OWNER-13). Đây là ngoại lệ duy nhất của quy tắc cấm đổi vai trò chủ quán trong `redesign-permission-model` (PERM-13). Hệ thống MUST NOT cho phép xóa hoặc vô hiệu hóa nhân viên đang giữ vai trò `owner`.

PIN của nhân viên vai trò `owner`, khi đã quên, SHALL tự đặt lại được bằng mã gửi về email chủ (REQ-OWNER-11); khôi phục do người vận hành thực hiện là việc riêng. Các vai trò khác, kể cả vai trò có quyền `employee.manage`, MUST NOT tác động lên bản ghi này.

Khi cửa hàng được chuyển sang chủ mới, vai trò `owner` MUST chuyển sang tài khoản được chọn trong cùng một giao dịch; chủ cũ thành tài khoản thường; mỗi người giữ PIN của mình (quyết định 28).

Mã truy vết: REQ-SESSION-02.

#### Scenario: Không xóa được nhân viên chủ quán

- **WHEN** một nhân viên vai trò `manager` có quyền `employee.manage` thử xóa hoặc vô hiệu hóa nhân viên vai trò `owner`
- **THEN** hệ thống từ chối với mã có sẵn `OWNER_PROTECTED`

#### Scenario: Cửa hàng luôn có đúng một chủ quán

- **WHEN** kiểm tra danh sách nhân viên của một cửa hàng bất kỳ
- **THEN** có đúng một nhân viên vai trò `owner`, và bản ghi cửa hàng trỏ tới tài khoản chủ sở hữu

#### Scenario: Chuyển quyền sở hữu kéo theo bản ghi chủ quán

- **WHEN** một cửa hàng được chuyển sang chủ mới
- **THEN** tài khoản được chọn thành vai trò `owner` và chủ cũ thành tài khoản thường trong cùng giao dịch, không có khoảnh khắc nào cửa hàng có hai hoặc không có chủ quán
