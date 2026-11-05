# Khởi tạo cửa hàng

Cập nhật 2026-11-05. Mã `REQ-…` dùng để đối chiếu trong `traceability.md`.

## MODIFIED Requirements

### Requirement: Tạo cửa hàng mới

Việc tạo cửa hàng SHALL yêu cầu xác minh email bằng mã gửi riêng cho lần tạo đó (REQ-OWNER-01). Hệ thống MUST NOT cho phép tạo cửa hàng mà không có bước này, và MUST NOT mở phiên đăng nhập web sau bước này.

Việc tạo cửa hàng SHALL chạy hoàn toàn ở phía server. Hệ thống MUST NOT cho máy người dùng tự tạo tài khoản kỹ thuật của quán hoặc gọi thẳng các hàm giữ số quán và khởi tạo quán. Phần ghi dữ liệu quán (bản ghi cửa hàng kèm chủ sở hữu và trạng thái, cấu hình, nhân viên vai trò `owner` với PIN chủ đã nhập) SHALL nằm trong một giao dịch database. PIN chủ do chủ tự đặt nên không bắt buộc đổi ở lần đăng nhập đầu.

Đầu vào SHALL gồm tên hiển thị bắt buộc, địa chỉ tùy chọn và PIN của chủ quán. Cửa hàng tạo ra MUST mặc định là cửa hàng trống, chỉ gồm bản ghi cửa hàng, cấu hình cửa hàng và một nhân viên vai trò `owner`.

Mã truy vết: REQ-STORE-01 (tạo cửa hàng), REQ-STORE-06 (dữ liệu mẫu).

#### Scenario: Tạo cửa hàng trống

- **WHEN** một người đã nhập đúng mã xác minh, với tên hiển thị hợp lệ và PIN chủ quán
- **THEN** hệ thống tạo cửa hàng mới gắn với email đó, sinh Store Key theo định dạng `STORE_NO-SECRET`, tạo nhân viên vai trò `owner` với PIN vừa nhập, và không tạo dữ liệu danh mục, món, khu hay bàn nào

#### Scenario: Gọi thẳng hàm tạo quán

- **WHEN** một máy chưa có yêu cầu tạo quán được chấp nhận gọi thẳng hàm khởi tạo cửa hàng
- **THEN** hệ thống từ chối và không tạo bản ghi nào

#### Scenario: Tùy chọn khởi tạo dữ liệu mẫu

- **WHEN** chủ bật tùy chọn khởi tạo dữ liệu mẫu (mặc định tắt) khi tạo cửa hàng
- **THEN** sau khi cửa hàng đã tạo xong, hệ thống seed thêm bộ dữ liệu demo gọn gồm danh mục, món, một khu với vài bàn và một tài khoản thu ngân demo

#### Scenario: Seed dữ liệu mẫu thất bại

- **WHEN** việc seed dữ liệu mẫu thất bại sau khi cửa hàng đã được tạo
- **THEN** cửa hàng vẫn tồn tại và vào được, hạn mức không được trả lại, POS hiển thị cảnh báo kèm hành động thử lại, và chủ có thể seed lại từ màn Cài đặt

### Requirement: Bảo mật Store Key

Store Key SHALL gồm phần số cửa hàng công khai được sinh theo sequence và phần bí mật đóng vai trò credential, 32 ký tự `A-Z0-9` sinh ở server. Hệ thống MUST NOT cho phép truy cập cửa hàng chỉ bằng số cửa hàng.

Phần bí mật SHALL được lưu ở **dạng mã hóa** trong database, với khóa giải mã giữ trong môi trường của hàm chạy phía server và MUST NOT nằm trong database. Hệ thống MUST NOT lưu phần bí mật ở dạng thô, và MUST NOT để khóa giải mã xuống trình duyệt.

Phát biểu này thay cho yêu cầu cũ là không lưu phần bí mật dưới mọi hình thức sau khi hoàn tất. Lý do đổi: Store Key là bí mật dùng chung của cửa hàng, vốn nằm trên nhiều thiết bị và thường được ghi ra giấy tại quầy, nên mất key phải khôi phục được thay vì buộc cả quán ghép lại toàn bộ thiết bị. Đánh đổi được chấp nhận có điều kiện: người lấy được bản dump database vẫn không đọc được key vì thiếu khóa giải mã.

Store Key, phần bí mật, PIN và mã xác nhận MUST NOT xuất hiện trong bất kỳ nhật ký nào của hệ thống. Dữ liệu tạm cần cho việc tạo quán (hash PIN, bí mật đã mã hóa) SHALL bị xóa khỏi bản ghi yêu cầu khi quán đã tạo xong hoặc khi thất bại.

Mã truy vết: REQ-STORE-05.

#### Scenario: Đoán số cửa hàng không đủ để vào

- **WHEN** người dùng nhập một số cửa hàng có thật nhưng phần bí mật sai
- **THEN** hệ thống từ chối ghép thiết bị và không tiết lộ thông tin nào của cửa hàng đó

#### Scenario: Lộ bản sao database

- **WHEN** một người có được toàn bộ nội dung database nhưng không có khóa giải mã
- **THEN** người đó không khôi phục được phần bí mật của bất kỳ Store Key nào

#### Scenario: Store Key khôi phục lại được

- **WHEN** chủ quên Store Key và dùng luồng quên Store Key
- **THEN** hệ thống giải mã và gửi lại đúng key hiện tại, và các thiết bị đã ghép không bị ảnh hưởng

## ADDED Requirements

### Requirement: REQ-STORE-02 — Tài khoản kỹ thuật của quán không gửi thư và không bị chiếm

Tài khoản kỹ thuật của quán SHALL được tạo bằng API quản trị, với email đã xác nhận sẵn và một dấu hiệu chỉ server ghi được, gắn với đúng yêu cầu tạo quán. Bước này MUST NOT gọi bất kỳ đường nào khiến Supabase Auth gửi thư, dù cơ chế chặn thư mặc định đang bật hay tắt. Hệ thống MUST NOT nhận hoặc xóa một tài khoản có cùng email mà không mang đúng dấu hiệu đó.

#### Scenario: Email theo số quán đã bị người khác đăng ký

- **WHEN** tài khoản `store42@store.pos.local` đã tồn tại mà không có dấu hiệu của yêu cầu đang xử lý
- **THEN** hệ thống không dùng và không xóa tài khoản đó, báo cho người vận hành và chuyển sang số quán khác

### Requirement: REQ-STORE-03 — Kết quả chưa rõ và việc dọn dẹp

Tài khoản xác thực, database và email là ba hệ thống tách nhau nên không thể gói chung một giao dịch. Khi chưa đủ bằng chứng về kết quả, hệ thống SHALL giữ trạng thái "chưa rõ" (`unknown`) và MUST NOT tự tạo yêu cầu thay thế. Một tiến trình đối soát phía server SHALL hoàn tất hoặc dọn dẹp mọi yêu cầu chưa xong trong thời hạn hữu hạn, ít nhất 10 phút, và hai lượt chạy MUST NOT cùng ghi lên một yêu cầu. Dọn dẹp xong SHALL chuyển yêu cầu sang thất bại (`failed`) và trả lại chỗ trong hạn mức. Tài khoản kỹ thuật có thể tồn tại tạm thời trong lúc xử lý nhưng MUST NOT bị bỏ lại vĩnh viễn.

#### Scenario: Dừng giữa chừng sau khi tạo tài khoản kỹ thuật

- **WHEN** lời gọi tạo quán dừng sau khi đã tạo tài khoản kỹ thuật nhưng trước khi ghi cửa hàng
- **THEN** tiến trình đối soát tìm lại đúng tài khoản đó theo dấu hiệu và hoàn tất tạo quán, không tạo tài khoản thứ hai

### Requirement: REQ-STORE-04 — Giao Store Key cho chủ

Tạo quán xong, màn kết quả SHALL hiển thị Store Key kèm nút sao chép; đây là đường giao chính. Hệ thống SHALL luôn gửi thêm Store Key tới email đã xác minh như một hỗ trợ kèm theo, tối đa một thư cho mỗi lần tạo. Thư gửi sau khi quán đã tạo xong: thư lỗi MUST NOT làm hỏng quán đã tạo và MUST NOT trả lại hạn mức.

Nếu phản hồi bị mất khi trang còn mở, máy SHALL nhận lại được Store Key bằng cách gửi lại đúng yêu cầu, kèm đủ mã và thông tin đã nhập, trong thời hạn của mã, tức 10 phút kể từ lúc phát. Khoảng thời gian này kết thúc sớm hơn nếu người dùng bấm "Tôi đã lưu Store Key", sau 5 lần nhận lại sai, khi quán đổi chủ, khi chủ đổi email, hoặc khi Store Key được cấp lại. Khi khoảng này đã đóng, hoặc khi mã định danh hay thông tin gửi kèm không đúng, hệ thống SHALL chỉ trả trạng thái và MUST NOT so mã hay PIN cho việc nhận lại. Không mã định danh hay biên nhận nào, đơn lẻ, nhận được Store Key.

Nếu thư cũng lỗi sau khi khoảng này đã đóng, luồng tạo quán không giao lại Store Key; đường còn lại là luồng quên Store Key hoặc hỗ trợ vận hành.

#### Scenario: Luôn gửi Store Key qua email

- **WHEN** việc tạo cửa hàng hoàn tất
- **THEN** giao diện hiển thị Store Key kèm nút sao chép, và hệ thống gửi thêm một email chứa Store Key, tên và địa chỉ cửa hàng tới email đã xác minh

#### Scenario: Gửi thư Store Key lỗi

- **WHEN** cửa hàng đã tạo xong nhưng email chứa Store Key không gửi được
- **THEN** cửa hàng vẫn tồn tại, vẫn tính vào hạn mức của chủ, và chủ vẫn sao chép được Store Key trên màn kết quả

#### Scenario: Mất phản hồi rồi tải lại trang

- **WHEN** quán đã tạo xong nhưng phản hồi bị mất và người dùng tải lại trang
- **THEN** giao diện chỉ hiển thị trạng thái đã tạo, còn Store Key đến qua thư đã gửi tới email chủ
