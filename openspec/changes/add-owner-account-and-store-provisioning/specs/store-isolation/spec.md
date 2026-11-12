# Cô lập dữ liệu giữa các cửa hàng

## MODIFIED Requirements

### Requirement: Cô lập enforce ở tầng database

Chính sách bảo mật mức dòng SHALL enforce ranh giới cửa hàng ở tầng database, không dựa vào tầng ứng dụng.

Chính sách SHALL giữ nguyên nhánh hiện tại: phiên của tài khoản kỹ thuật cửa hàng truy cập được dữ liệu của chính cửa hàng đó. Thay đổi này MUST NOT buộc các thiết bị đã ghép phải ghép lại.

Cập nhật 2026-11-05: không thêm nhánh cho chủ, vì không còn phiên đăng nhập của chủ (quyết định 23). Mọi thao tác của chủ đi qua hàm phía server.

Mã truy vết: REQ-ISOLATION-01.

#### Scenario: Bỏ qua tầng ứng dụng

- **WHEN** một yêu cầu được gửi thẳng tới database bằng danh tính của cửa hàng A nhưng nhắm tới dữ liệu của cửa hàng B
- **THEN** chính sách phía database từ chối yêu cầu đó

#### Scenario: Thiết bị của cửa hàng khác

- **WHEN** một phiên tài khoản kỹ thuật của cửa hàng A truy vấn dữ liệu của cửa hàng B
- **THEN** chính sách phía database trả về rỗng bất kể tầng ứng dụng gửi gì

#### Scenario: Thiết bị đã ghép không bị ảnh hưởng bởi thay đổi này

- **WHEN** điều kiện trạng thái được áp dụng cho quán còn `active`
- **THEN** thiết bị đã ghép vẫn dùng danh tính hợp lệ hiện có để truy cập theo các quyền của quán

### Requirement: Phạm vi hiện tại của mô hình cô lập

Ranh giới cô lập SHALL ở mức cửa hàng. Mô hình này MUST NOT được hiểu là tính năng quản lý chuỗi nhiều chi nhánh. Quyền đọc và ghi của nhân viên trong cùng một quán vẫn theo mô hình phân quyền nhân viên hiện hành.

Một tài khoản chủ SHALL sở hữu được nhiều cửa hàng, và lược đồ dữ liệu MUST NOT chứa ràng buộc nào khiến điều đó bất khả thi. Việc sở hữu nhiều cửa hàng chỉ là quan hệ dữ liệu; hệ thống vẫn MUST NOT cung cấp thực đơn dùng chung, báo cáo hợp nhất hay màn chuyển đổi cửa hàng đang làm việc.

Mã truy vết: REQ-ISOLATION-02.

#### Scenario: Một chủ sở hữu nhiều quán

- **WHEN** một người sở hữu hai quán
- **THEN** hai quán là hai cửa hàng tách biệt với hai Store Key khác nhau, cùng trỏ về một tài khoản chủ, và hệ thống không cung cấp màn hình tổng hợp chung cho cả hai

#### Scenario: Lược đồ không khóa cứng ở một cửa hàng

- **WHEN** kiểm tra ràng buộc trên trường chủ sở hữu của bảng cửa hàng
- **THEN** không tồn tại ràng buộc duy nhất nào trên trường đó

#### Scenario: Nhân viên trong cùng cửa hàng

- **WHEN** hai nhân viên cùng một cửa hàng cùng đăng nhập
- **THEN** cả hai thuộc cùng ranh giới quán. Database vẫn kiểm phiên và quyền của từng nhân viên trước khi trả dữ liệu hoặc cho ghi

## REMOVED Requirements

### Requirement: Khóa cửa hàng ở tầng ứng dụng

**Reason**: Requirement này phát biểu rõ rằng hệ thống không được tuyên bố có enforce trạng thái cửa hàng ở tầng database. Change này chuyển việc enforce xuống tầng database nên phát biểu cũ không còn đúng. Thay bằng requirement mới bên dưới.

**Migration**: Thay `is_active` bằng enum `active` / `suspended` theo quyết định 9. Kiểm điều kiện dữ liệu cũ ở bước migration của T06 trước khi áp dụng ràng buộc.

## ADDED Requirements

### Requirement: Khóa cửa hàng enforce ở tầng database

Bản ghi cửa hàng SHALL mang trạng thái `active` hoặc `suspended`. Database MUST chặn đọc và ghi nghiệp vụ của quán `suspended` qua các đường được cấp quyền, gồm RPC đọc, ghi và đọc lại kết quả thao tác, kể cả khi phiên thiết bị và phiên nhân viên đã mở trước lúc tạm ngưng. Điều kiện trạng thái SHALL được kiểm tra cả tại các chính sách truy cập bảng áp dụng và trong các RPC có đặc quyền. Các kiểm tra danh tính cửa hàng, phiên, vai trò và quyền nhân viên vẫn áp dụng.

Thiết bị đã ghép hợp lệ SHALL đọc được đúng `storeId`, `storeNo` và `status` của quán mình qua `permission_get_store_session`, kể cả khi quán đang bị tạm ngưng và không có phiên nhân viên. RPC MUST lấy danh tính cửa hàng từ phiên thiết bị. Không cấp quyền đọc bảng `stores` trực tiếp để phục vụ ngoại lệ này.

Khi cửa hàng chuyển trạng thái, thay đổi trạng thái và sự kiện `store_status_changed` SHALL commit cùng giao dịch. Nhật ký chứa cửa hàng, trạng thái trước/sau, thời điểm DB và định danh tác nhân nội bộ đã xác thực. Các danh tính thiết bị và nhân viên MUST NOT có quyền đổi trạng thái. Giao diện quản trị nhà cung cấp thuộc change riêng.

Tín hiệu nghiệp vụ theo quán SHALL áp điều kiện cùng quán và active cho SELECT và sự kiện INSERT/UPDATE. Publication tín hiệu MUST NOT phát DELETE/TRUNCATE cho client.

Lookup ở cổng ảnh món hiện hành MUST từ chối lượt đọc mới của quán `suspended` trước khi đọc Storage hoặc trả `304`. Đường ảnh công khai dùng cùng phản hồi 404 như ảnh không khả dụng. Phần ảnh đã tải, bộ nhớ đệm phía khách và URL Storage công khai đời cũ nằm ngoài khả năng thu hồi của cổng hiện hành.

Mã truy vết: REQ-ISOLATION-03.

#### Scenario: Thiết bị của cửa hàng bị tạm ngưng

- **WHEN** một thiết bị đã ghép của cửa hàng ở trạng thái `suspended` gọi thẳng vào database để đọc đơn hàng
- **THEN** truy cập bảng thô vẫn bị từ chối theo ACL. RPC nghiệp vụ với phiên hợp lệ nhận `STORE_SUSPENDED`, không trả dữ liệu nghiệp vụ

#### Scenario: Phiên đã mở gọi ghi sau khi quán tạm ngưng

- **WHEN** quán đã commit trạng thái `suspended` và phiên nhân viên mở trước đó gửi yêu cầu ghi hoặc tra một kết quả ghi
- **THEN** RPC chặn tại database và giữ nguyên dữ liệu, bản ghi thao tác và kết quả nghiệp vụ

#### Scenario: Chủ vẫn thấy vì sao cửa hàng không vào được

- **WHEN** một thiết bị đã ghép của cửa hàng đang bị tạm ngưng mở ứng dụng
- **THEN** thiết bị đọc được đúng ba trường phiên quán của mình. Giao diện biết quán `suspended`, trong khi dữ liệu nghiệp vụ vẫn bị chặn

#### Scenario: Đổi trạng thái để lại dấu vết

- **WHEN** trạng thái của một cửa hàng được đổi
- **THEN** nhật ký thao tác quản trị có một bản ghi cho cửa hàng đó kèm trạng thái trước/sau, thời điểm và tác nhân. Nếu giao dịch rollback, cả trạng thái và nhật ký giữ nguyên

#### Scenario: Mở ảnh món từ cổng ảnh hiện hành khi quán tạm ngưng

- **WHEN** một lượt tải ảnh mới hoặc revalidate tới cổng ảnh sau khi quán đã tạm ngưng
- **THEN** cổng trả 404 không lưu đệm, không trả byte ảnh hoặc `304`
