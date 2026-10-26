> **Điểm đọc ngày25/10/2026:** baseline này cần đọc cùng [đối chiếu store-settings và delta hiện hành](../../../docs/spec-reconciliation.md#store-settings). Banner chỉ dẫn nguồn; nội dung yêu cầu phía dưới được giữ nguyên, không là xác nhận nghiệm thu/runtime.

> **Quyết định26/10/2026:** R06-B hoãn khôi phục mẫu sau xóa khỏi phạm vi triển khai hiện tại. SHALL “Khởi tạo lại dữ liệu mẫu” phía dưới được giữ như yêu cầu lịch sử/chưa đáp ứng; không coi clear-demo hoặc retry ban đầu là đã thực hiện reseed. [Hồ sơ quyết định](../../../docs/spec-reconciliation.md#r06-decisions).

# Cài đặt và bảo trì dữ liệu cửa hàng

> Phạm vi nguồn: baseline đặc tả lịch sử, chưa đồng bộ đầy đủ main711a22e. Đọc [trạng thái OpenSpec](../../README.md#trạng-thái-đọc-ngày-25102026) và change liên quan trước khi dùng làm hợp đồng runtime hiện hành. Requirement dưới đây được giữ nguyên để truy vết.


## Purpose

Cho quản lý cập nhật thông tin nhận diện của cửa hàng dùng trên hóa đơn, và chủ động khởi tạo lại hoặc xóa bộ dữ liệu mẫu một cách an toàn khi demo hoặc kiểm thử. Truy vết: FR-20.

## Requirements

### Requirement: Cấu hình thông tin cửa hàng

Hệ thống SHALL cho sửa tên hiển thị, địa chỉ, chân trang hóa đơn và múi giờ của cửa hàng, và SHALL cho xem trước phần thông tin sẽ in trên hóa đơn.

#### Scenario: Đổi chân trang hóa đơn

- **WHEN** quản lý đổi chân trang hóa đơn và lưu
- **THEN** bản xem trước và các hóa đơn in sau đó dùng chân trang mới

#### Scenario: Múi giờ quyết định ngày kinh doanh

- **WHEN** múi giờ của cửa hàng được đặt
- **THEN** ngày kinh doanh dùng trong báo cáo và lịch sử được xác định theo múi giờ đó

### Requirement: Khởi tạo lại dữ liệu mẫu

Hệ thống SHALL cho quản lý khởi tạo bộ dữ liệu mẫu từ màn cài đặt. Thao tác này MUST chỉ dành cho vai trò `admin` và MUST idempotent: chạy lại sau khi đã xóa sẽ hồi sinh đúng các bản ghi mẫu thay vì tạo bản trùng.

#### Scenario: Seed lại sau khi đã xóa dữ liệu mẫu

- **WHEN** quản lý xóa dữ liệu mẫu rồi khởi tạo lại
- **THEN** các bản ghi mẫu cũ được khôi phục và không xuất hiện bản ghi trùng

#### Scenario: Thu ngân mở màn bảo trì dữ liệu

- **WHEN** một nhân viên `cashier` mở màn cài đặt
- **THEN** các thao tác bảo trì dữ liệu mẫu không khả dụng

### Requirement: Xóa dữ liệu mẫu có kiểm soát

Hệ thống SHALL cho quản lý xóa bộ dữ liệu mẫu theo đúng bộ đã seed. Thao tác này MUST bị chặn khi cửa hàng còn đơn đang mở.

#### Scenario: Xóa dữ liệu mẫu khi còn đơn mở

- **WHEN** quản lý xóa dữ liệu mẫu trong lúc còn ít nhất một đơn đang mở
- **THEN** hệ thống chặn thao tác và nêu lý do còn đơn đang bán

### Requirement: Giới hạn đã biết của cài đặt thanh toán

Phần cài đặt phương thức thanh toán và mã QR SHALL chỉ là bản xem trước giao diện cục bộ. Hệ thống MUST NOT lưu các cài đặt này xuống database và MUST NOT tuyên bố có xử lý thanh toán mã QR thật.

#### Scenario: Sửa cài đặt mã QR rồi tải lại trang

- **WHEN** quản lý sửa phần cài đặt mã QR rồi tải lại trang
- **THEN** thay đổi không được giữ lại
