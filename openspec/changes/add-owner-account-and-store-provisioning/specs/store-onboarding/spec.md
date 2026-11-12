# Khởi tạo cửa hàng

Cập nhật 2026-11-05. Mã `REQ-…` dùng để đối chiếu trong `traceability.md`.

## MODIFIED Requirements

### Requirement: Tạo cửa hàng mới

Việc tạo cửa hàng SHALL yêu cầu xác minh email bằng mã gửi riêng cho lần tạo đó (REQ-OWNER-01). Hệ thống MUST NOT cho phép tạo cửa hàng mà không có bước này, và MUST NOT mở phiên đăng nhập web sau bước này.

Việc tạo cửa hàng SHALL chạy hoàn toàn ở phía server. Hệ thống MUST NOT cho máy người dùng tự tạo tài khoản kỹ thuật của quán hoặc gọi thẳng các hàm giữ số quán và khởi tạo quán. Phần ghi dữ liệu quán (bản ghi cửa hàng kèm chủ sở hữu và trạng thái, cấu hình, nhân viên vai trò `owner` với PIN chủ đã nhập) SHALL nằm trong một giao dịch database. PIN chủ do chủ tự đặt nên không bắt buộc đổi ở lần đăng nhập đầu.

Đường provisioning nội bộ SHALL chỉ chạy cho yêu cầu đã được server chấp nhận và còn giữ chỗ hạn mức. Khi luồng mới đã đạt vòng staging đầu tiên, tắt đăng ký Auth công khai và SHALL kiểm lại luồng mới với cấu hình này trước khi nghiệm thu giai đoạn 1 (quyết định 45).

Đầu vào SHALL gồm tên hiển thị bắt buộc, địa chỉ tùy chọn và PIN của chủ quán. Cửa hàng tạo ra MUST mặc định là cửa hàng trống, chỉ gồm bản ghi cửa hàng, cấu hình cửa hàng và một nhân viên vai trò `owner`.

Mã truy vết: REQ-STORE-01 (tạo cửa hàng), REQ-STORE-06 (dữ liệu mẫu).

#### Scenario: Tạo cửa hàng trống

- **WHEN** một người đã nhập đúng mã xác minh, với tên hiển thị hợp lệ và PIN chủ quán
- **THEN** hệ thống tạo cửa hàng mới gắn với email đó, sinh Store Key theo định dạng `STORE_NO-SECRET`, tạo nhân viên vai trò `owner` với PIN vừa nhập, và không tạo dữ liệu danh mục, món, khu hay bàn nào

#### Scenario: Gọi thẳng hàm tạo quán

- **WHEN** một máy chưa có yêu cầu tạo quán được chấp nhận gọi thẳng hàm khởi tạo cửa hàng
- **THEN** hệ thống từ chối và không tạo bản ghi nào

Khi chủ chọn dữ liệu mẫu, hệ thống SHALL ghi nhận công việc cần chạy cùng giao dịch tạo quán và server SHALL tự khởi chạy lần đầu sau khi giao dịch commit, không cần ghép thiết bị, đăng nhập POS hoặc giữ trang tạo quán mở (quyết định 50). Quán và kết quả tạo, gồm Store Key theo REQ-STORE-04, MUST NOT chờ việc tạo dữ liệu mẫu. Khi không chọn, hệ thống MUST NOT khởi chạy seed.

#### Scenario: Tùy chọn khởi tạo dữ liệu mẫu

- **WHEN** chủ bật tùy chọn khởi tạo dữ liệu mẫu (mặc định tắt) khi tạo cửa hàng
- **THEN** server tự seed thêm bộ dữ liệu demo gọn gồm danh mục, món, một khu với vài bàn và một tài khoản thu ngân demo, kể cả khi chủ đóng trang và chưa đăng nhập ở thiết bị nào

#### Scenario: Ghép máy khác khi server đang tạo dữ liệu mẫu

- **WHEN** chủ ghép và đăng nhập POS từ một thiết bị khác trong lúc công việc phía server đang chờ hoặc đang chạy
- **THEN** thiết bị đã ghép đăng nhập được và hiển thị “Đang chuẩn bị dữ liệu mẫu…”. Server SHALL giữ nghiệp vụ POS đóng cho mọi thiết bị của quán. Khi server xác nhận cả bộ mẫu đã được ghi, thiết bị tải dữ liệu rồi tự mở POS. Đăng nhập MUST NOT khởi chạy thêm một lượt seed

#### Scenario: Seed dữ liệu mẫu thất bại

- **WHEN** việc seed dữ liệu mẫu thất bại sau khi cửa hàng đã được tạo
- **THEN** giao dịch SHALL hoàn tác toàn bộ bộ mẫu. Quán vẫn tồn tại và vẫn tính vào hạn mức. Sau đăng nhập, màn lỗi SHALL giữ nghiệp vụ POS đóng. Chỉ phiên owner bình thường được chọn **Thử lại** cả bộ hoặc **Bỏ dữ liệu mẫu và vào quán trống**

#### Scenario: Chủ bỏ dữ liệu mẫu sau lỗi

- **WHEN** chủ yêu cầu bỏ dữ liệu mẫu sau khi một lượt thất bại
- **THEN** server SHALL xác nhận lượt cũ đã kết thúc và mất quyền ghi, chưa có bộ mẫu nào commit và quán đang trống. Chỉ khi xác nhận đủ, server SHALL kết thúc việc seed và mở quyền dùng quán trống cho các thiết bị. Nếu kết quả chưa rõ, màn chờ vẫn giữ nghiệp vụ đóng. Nếu đã commit thành công, hệ thống mở POS với dữ liệu mẫu đã lưu

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

### Requirement: REQ-STORE-03 — Giữ an toàn khi chưa rõ kết quả tạo quán

Tài khoản xác thực, database và email là ba hệ thống tách nhau nên không thể gói chung một giao dịch. Khi hết thời gian xử lý mà chưa đủ bằng chứng về kết quả, hệ thống SHALL trả trạng thái "chưa rõ" (`unknown`) và giữ suất. Quy tắc này SHALL áp dụng cả khi tiến trình đã dừng trước khi ghi trạng thái mới. Hệ thống MUST NOT tạo yêu cầu thay thế, chạy lại provisioning do gửi lại hay tra trạng thái, hoặc để hai lượt xử lý cùng ghi lên một yêu cầu. Chỉ chuyển `failed` và trả suất khi chắc chắn lượt thất bại và không còn tác dụng phụ chưa xử lý.

Tự động đối soát, tự dọn tài khoản kỹ thuật dở dang, cảnh báo tự động và cam kết mọi lượt chưa rõ kết thúc trong thời hạn hữu hạn thuộc phần sau đồ án theo quyết định 48. Hệ thống SHALL giữ mã lượt, trạng thái và tham chiếu Auth đủ để kiểm tra sau.

#### Scenario: Dừng giữa chừng sau khi tạo tài khoản kỹ thuật

- **WHEN** lời gọi tạo quán dừng sau khi đã tạo tài khoản kỹ thuật nhưng trước khi ghi cửa hàng
- **THEN** tra cứu sau khi hết thời gian xử lý trả `unknown`, suất vẫn giữ và gửi lại không tạo tài khoản kỹ thuật hay quán thứ hai

### Requirement: REQ-STORE-04 — Giao Store Key cho chủ

Lời gọi Xác nhận gốc là lần xử lý server đã xác minh OTP còn hạn và trực tiếp ghi nhận operation. Nếu chính lời gọi đó còn nhận được kết quả ghi quán đã xác nhận commit và còn trả được phản hồi, kết quả `created` SHALL kèm số quán và Store Key của lần tạo để người dùng sao chép. Hết hạn OTP trong lúc xử lý MUST NOT ngắt đường giao gốc. Server SHALL tuần tự hóa quyết định giao key và thao tác đóng quyền bằng cùng khóa operation. Nếu việc đóng quyền do xác nhận đã lưu, đủ số lần nhận lại hoặc thay đổi email, chủ quán hay Store Key đã commit trước điểm quyết định, chỉ trả trạng thái. Thu hồi sau điểm quyết định chỉ chặn các lần giao chưa được duyệt.

Quyền giao theo lời gọi gốc SHALL tồn tại trong đúng lần xử lý đã ghi nhận operation. Gửi lại cùng `attemptId`, tra trạng thái và lời gọi mới MUST NOT nhận quyền đó. Nếu phản hồi gốc mất hoặc lời gọi gốc đã kết thúc, mọi lần gửi lại chỉ dùng quy tắc khoảng nhận lại bên dưới. Hạn xử lý của operation vẫn theo REQ-STORE-03.

Hệ thống SHALL xếp một thư Store Key tới email đã xác minh cùng giao dịch ghi quán, tối đa một thư cho mỗi lần tạo. Thư được gửi sau commit. Trả phản hồi gốc độc lập với kết quả gửi thư. Thư lỗi MUST NOT làm hỏng quán đã tạo hoặc trả lại hạn mức.

Bấm "Tôi đã lưu Store Key" SHALL mở màn Ghép thiết bị với ô Store Key trống và chưa ghép máy.

Nếu phản hồi bị mất khi trang còn mở, máy SHALL nhận lại được Store Key bằng cách gửi lại đúng yêu cầu, kèm đủ mã và thông tin đã nhập, trong thời hạn của mã, tức 10 phút kể từ lúc phát. Khoảng thời gian này kết thúc sớm hơn nếu người dùng bấm "Tôi đã lưu Store Key", sau 5 lần nhận lại sai, khi quán đổi chủ, khi chủ đổi email, hoặc khi Store Key được cấp lại. Khi cửa sổ đã đóng hoặc mã định danh không phải lần Xác nhận được chấp nhận, hệ thống SHALL chỉ trả trạng thái và MUST NOT so mã hay PIN. Khi đúng lần Xác nhận và còn cửa sổ, lần xin nhận lại có mã hay thông tin sai MUST NOT nhận key và SHALL tính vào bộ đếm nhận lại riêng. Không mã định danh hay biên nhận nào, đơn lẻ, nhận được Store Key.

Nếu thư cũng lỗi sau khi khoảng này đã đóng, luồng tạo quán không giao lại Store Key; đường còn lại là luồng quên Store Key hoặc hỗ trợ vận hành.

Lần Xác nhận chỉ được gắn để tra trạng thái theo REQ-OWNER-04 MUST NOT nhận Store Key hoặc đóng khoảng nhận lại bằng nút "Tôi đã lưu Store Key", kể cả khi gửi đủ OTP và thông tin tạo quán. Khi cửa sổ còn mở, lời gọi xác nhận đã lưu bằng ID đó SHALL trả `CONFIRM_REJECTED`. Nếu cửa sổ đã đóng và phạm vi khớp, lời gọi trả `closed`. Cả hai trường hợp MUST NOT so OTP/PIN hoặc thay đổi bộ đếm nhận lại.

Khi tải lại, chỉ mã tra trạng thái được giữ theo REQ-OWNER-06. Đường hỏi trạng thái MUST NOT nhận hoặc so PIN/mã, trả số quán hay dữ liệu chủ, hoặc trả Store Key. Trên quán thử giai đoạn 1, chấp nhận trường hợp mất cả đường nhận lại và thư Store Key theo quyết định 47.

#### Scenario: Luôn gửi Store Key qua email

- **WHEN** việc tạo cửa hàng hoàn tất
- **THEN** hệ thống xếp một email chứa Store Key, tên và địa chỉ cửa hàng tới email đã xác minh

#### Scenario: OTP hết hạn khi lời gọi Xác nhận gốc còn đang tạo quán

- **WHEN** lời gọi gốc xác minh và ghi nhận operation trước hạn OTP, nhận được kết quả ghi quán đã commit sau hạn OTP nhưng trong hạn xử lý, và vẫn còn trả được phản hồi
- **THEN** nếu quyền giao vẫn còn, phản hồi gốc kèm Store Key. Gửi lại và tra trạng thái sau hạn OTP chỉ nhận trạng thái

#### Scenario: Gửi thư Store Key lỗi

- **WHEN** cửa hàng đã tạo xong nhưng email chứa Store Key không gửi được
- **THEN** cửa hàng vẫn tồn tại và vẫn tính vào hạn mức của chủ. Nếu phản hồi gốc giao được Store Key, chủ vẫn sao chép được key trên màn kết quả

#### Scenario: Mất phản hồi rồi tải lại trang

- **WHEN** quán đã tạo xong nhưng phản hồi bị mất và người dùng tải lại trang
- **THEN** giao diện chỉ hiển thị trạng thái đã tạo. Chủ xem Store Key trong thư nếu thư đến được
