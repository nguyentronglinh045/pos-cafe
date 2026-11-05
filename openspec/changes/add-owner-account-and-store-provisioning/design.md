# Thiết kế tài khoản chủ cửa hàng và kiểm soát việc tạo cửa hàng

## Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Mã xác nhận (OTP) | Mã 6 chữ số gửi qua email, dùng một lần, cho đúng một thao tác |
| Loại thao tác (`purpose`) | Mã được phát cho việc gì: tạo quán, quên PIN chủ, cấp lại key, đổi email, chuyển quyền, reset |
| Intent | Một bộ thông tin tạo quán cụ thể gồm email, tên, địa chỉ, tùy chọn dữ liệu mẫu và PIN. Đổi bất kỳ trường nào là intent mới |
| Dấu vân tay thông tin | Giá trị băm có khóa của bộ thông tin trên; dùng để so mà không phải lưu PIN |
| Yêu cầu tạo quán (operation) | Việc tạo quán đã được chấp nhận sau khi mã đúng; mỗi intent có tối đa một |
| Mã định danh (`requestId`, `attemptId`) | Do máy sinh cho mỗi lần bấm, giúp server nhận ra đây là gửi lại chứ không phải yêu cầu mới. Không phải mật khẩu |
| Khoảng nhận lại Store Key | Khoảng thời gian ngắn sau khi tạo quán, trong đó trang còn mở có thể nhận lại key nếu mất phản hồi |
| Tài khoản kỹ thuật | Tài khoản Supabase Auth của quán (service account), dùng cho Store Key và thiết bị đã ghép |
| Xác nhận chính chủ | Bản ghi server cho biết người đang đăng nhập vừa nhập đúng mã của email đã đăng ký; có hiệu lực 10 phút, cho đúng phiên đó và đúng một thao tác. Đây không phải mã hay mật khẩu để mang đi nơi khác |
| Phiên bình thường | Phiên nhân viên dùng để vận hành quán (mục đích `normal`), khác phiên 5 phút chỉ để đổi PIN bắt buộc (`required_pin_change`) |
| Dấu hiệu server | Thông tin trong `app_metadata` của tài khoản kỹ thuật, cho biết tài khoản này do đúng yêu cầu nào tạo ra |
| Tiến trình đối soát | Việc chạy định kỳ ở server, hoàn tất hoặc dọn dẹp các yêu cầu chưa xong |
| Thẻ lượt chạy | Số tăng dần cấp cho mỗi lượt xử lý, ngăn lượt cũ chạy chậm ghi đè lượt mới |

## Context

Động cơ và phạm vi xem `proposal.md`, phần Why và phần Quyết định đã chốt. Phần này chỉ nêu hiện trạng kỹ thuật cần thiết để giải thích cách làm.

Bốn ràng buộc từ kho mã quyết định phần lớn thiết kế dưới đây:

1. **Bảng `stores` dùng chính `auth.users.id` làm khóa chính.** Mỗi cửa hàng *là* một tài khoản xác thực. Vì vậy chủ không thể là một hàng khác trong cùng bảng đó; chủ được lưu ở bảng riêng, và quan hệ chủ–cửa hàng là một cột trên `stores`.
2. **Bảng `stores` đã có cột `email`** giữ email tổng hợp dạng `store{N}@store.pos.local`, và cột `is_active` dạng boolean. Cột trạng thái mới thay chỗ `is_active`.
3. **Địa chỉ cửa hàng đã có sẵn** ở `store_settings.address`, không phải thêm trường. Email khôi phục đọc từ đó.
4. **Kho mã chưa có thành phần nào chạy phía server.** `src/adapters/supabase` là adapter gọi thẳng từ trình duyệt, và `src/architectureBoundaries.test.ts` cấm thư mục đó chạm `window`/`document`. Hàm phía server là thành phần triển khai mới, nằm ngoài cây `src`.

## Goals / Non-Goals

**Goals**

- Không ai tạo được cửa hàng nếu chưa xác thực email thật.
- Phần ghi dữ liệu quán là một giao dịch; hỏng giữa chừng thì được làm tiếp hoặc dọn sạch, không để lại rác vĩnh viễn.
- Mất Store Key khôi phục được, không phải cấp mới và bắt cả quán ghép lại.
- Thiết bị đã ghép không bị ảnh hưởng bởi thay đổi này.
- Lược đồ không khóa cứng ở một cửa hàng mỗi chủ.

**Non-Goals**

- Không làm mặt web riêng cho chủ. Quyết định 23, 24.
- Không làm tính năng chuỗi cửa hàng. Quyết định 21.
- Không làm màn quản trị cho nhà cung cấp. Quyết định 12, tách sang `add-provider-admin-console`.
- Không chuyển đổi dữ liệu cũ. Quyết định 9.

## Decisions

### 1. Tài khoản chủ là một bản ghi riêng, không phải tài khoản đăng nhập

Sửa lại ngày 2026-11-05. `stores.id` đã tham chiếu `auth.users.id`, nên mỗi cửa hàng là một tài khoản xác thực. Chủ không thể là một hàng khác trong cùng bảng đó, nên được lưu ở bảng riêng `owner_accounts`, xác định bằng email đã chuẩn hóa. Quan hệ sở hữu là cột `owner_account_id` trên `stores`.

Bản ghi này chỉ dùng để biết quán thuộc về ai, đếm hạn mức và biết gửi mã về đâu. Nó không có mật khẩu và không đăng nhập được. Cách này giữ nguyên định danh cửa hàng, nên không thiết bị nào phải ghép lại.

Bản trước của mục này cho chủ một tài khoản Supabase Auth riêng để đăng nhập web. Hướng đó không còn dùng vì quyết định 23 bỏ đăng nhập web của chủ.

### 2. Toàn bộ việc ghi nhạy cảm đi qua một hàm chạy phía server

Ba việc bắt buộc phải ở phía server vì trình duyệt không được giữ khóa tương ứng:

- Giải mã phần bí mật của Store Key. Cần khóa mã hóa.
- Đổi mật khẩu tài khoản kỹ thuật của cửa hàng. Cần khóa quản trị của nền tảng backend.
- Tạo tài khoản kỹ thuật mới khi tạo cửa hàng. Cùng khóa quản trị.

Đặt tại `supabase/functions/`, chạy Deno, cùng nền tảng backend đang dùng nên không thêm hạ tầng lạ. Hai biến môi trường mới: khóa quản trị của nền tảng và khóa mã hóa Store Key. Cả hai MUST NOT bao giờ xuống client.

Vì đã có một hàm phía server, hạn mức và giới hạn tần suất cũng enforce ở đó, nơi client không lách được. Đây là lợi ích kèm theo mà quyết định 3 đã nêu.

### 3. Ranh giới với `src`: hàm phía server nằm sau một port như mọi thứ khác

Tầng `features` MUST NOT biết rằng có hàm chạy phía server. Thêm một port mới trong `src/ports` khai bằng type của `domain`, và một adapter trong `src/adapters/supabase` gọi tới hàm đó.

Nhờ vậy `src/architectureBoundaries.test.ts` tiếp tục canh được, và mock adapter dựng được toàn bộ kịch bản mà không cần hàm thật.

Tên port đặt theo việc chứ không theo hạ tầng, ví dụ `IOwnerActionPort` và `IStoreProvisioningPort`, để sau này đổi cách triển khai không phải đổi tên.

### 4. Store Key: mã hóa đối xứng, khóa nằm ngoài database

Cột mới trên `stores` lưu phần bí mật đã mã hóa. Khóa giải mã nằm trong biến môi trường của hàm phía server.

Ngưỡng bảo mật đạt được, phát biểu chính xác để không nói quá: **người lấy được bản dump database không đọc được key**, vì thiếu khóa. Người chiếm được cả môi trường chạy của hàm thì đọc được. Đây là đánh đổi có ý thức của quyết định 6.

**Xoay khóa và mất khóa.** Thiết kế phải trả lời được hai tình huống:

- *Xoay khóa*: lưu kèm mỗi bản ghi một định danh phiên bản khóa. Khi xoay, khóa mới dùng cho bản ghi mới, và có một tác vụ giải mã bằng khóa cũ rồi mã hóa lại bằng khóa mới, ở mọi nơi còn giữ bí mật: `stores`, dữ liệu tạm của yêu cầu tạo quán và `store_key_rotations` chưa xong. Không có định danh phiên bản thì không xoay được mà không dừng hệ thống.
- *Mất khóa*: không khôi phục được Store Key của bất kỳ cửa hàng nào. Đường duy nhất còn lại là cấp lại key cho từng cửa hàng, tức mọi thiết bị phải ghép lại. Phải ghi vào `docs/limitations.md` và phải sao lưu khóa tách khỏi bản sao lưu database.

### 5. Chính sách bảo mật: giữ nguyên nhánh thiết bị, không thêm nhánh chủ

Sửa lại ngày 2026-11-05. Chính sách hiện tại cấp quyền theo `auth.uid() = store_id` và được giữ nguyên, nên thiết bị đã ghép không bị ảnh hưởng.

Bản trước thêm nhánh `owner_id = auth.uid()` cho phiên web của chủ. Không còn phiên đó (quyết định 23) nên không thêm nhánh này. Mọi thao tác của chủ đi qua hàm phía server; hàm tự kiểm vai trò và mã xác nhận.

Điều kiện trạng thái `status = 'active'` vẫn thêm vào chính sách của mọi bảng nghiệp vụ, đúng như quyết định 11. Ngoại lệ: thiết bị đã ghép vẫn đọc được bản ghi và trạng thái của chính quán mình, để giao diện báo đúng lý do khi quán bị tạm ngưng.

### 6. Trạng thái cửa hàng dùng enum, không dùng boolean

`is_active` boolean chỉ diễn đạt được hai trạng thái và không mở rộng được. Đổi sang enum `store_status` gồm `active` và `suspended`.

Chọn enum thay vì giữ boolean vì `add-provider-admin-console` sẽ cần thêm trạng thái, và đổi kiểu cột sau khi đã có dữ liệu thật đắt hơn nhiều so với đổi ngay bây giờ khi dữ liệu cũ đằng nào cũng bị xóa theo quyết định 9.

### 7. Mã xác nhận: tự quản lý trong hàm phía server

Sửa lại ngày 2026-11-05. Bản trước dùng luồng mã của nền tảng. Hướng hiện tại là dự án tự quản lý mã, vì mã cần gắn với đúng một thao tác và đúng thông tin đã nhập, cần giới hạn riêng từng loại thao tác, và luồng mã của nền tảng gắn với đăng nhập, trong khi chủ không còn đăng nhập. Đánh đổi: dự án phải tự lo băm mã, hạn dùng, đếm số lần sai và dọn mã cũ.

Mã do server sinh ngẫu nhiên; database chỉ lưu giá trị băm có khóa, nên lộ database cũng không đọc được mã. Thư đi qua đường gửi riêng của dự án (quyết định 15), không qua thư mặc định của Supabase Auth (quyết định 31).

### 8. Hai luồng khôi phục Store Key tách hẳn nhau

Không dùng chung điểm cuối, không dùng chung màn hình. Lý do: mức ảnh hưởng khác nhau rất xa, gộp lại thì một lần bấm nhầm làm cả quán ngừng bán.

| | Quên Store Key | Cấp lại Store Key |
| --- | --- | --- |
| Cần đăng nhập POS | Không | **Có, tài khoản chủ quán** |
| Cần mã xác nhận | Không, vì key chỉ đi vào hộp thư của chủ | **Có** |
| Lối vào | Màn ghép thiết bị, mục Cài đặt | Chỉ mục Cài đặt |
| Rào chắn | Giới hạn tần suất, phản hồi chung chung | Cảnh báo, gõ tên quán, nhập mã |
| Store Key | Giữ nguyên | Đổi mới |
| Thiết bị đã ghép | Không ảnh hưởng | Phải ghép lại toàn bộ |

## Lược đồ dữ liệu

Tên và kiểu dưới đây là đề xuất, chốt khi viết migration. Không có bước chuyển đổi dữ liệu vì dữ liệu cũ bị xóa theo quyết định 9.

**Bảng `stores`, thêm cột**

| Cột | Ghi chú |
| --- | --- |
| `owner_account_id` | Bắt buộc. **Không** đặt ràng buộc duy nhất, vì một chủ có nhiều quán (quyết định 21) |
| `status` | `active` hoặc `suspended`, thay `is_active` |
| `key_secret_encrypted`, `key_encryption_version` | Phần bí mật của Store Key đã mã hóa và phiên bản khóa. Không cấp quyền đọc cho thiết bị đã ghép: hiện thiết bị có quyền đọc cả bảng `stores` (migration 016), nên phải giới hạn theo cột |

**Bảng mới**

| Bảng | Dùng để | Trường chính |
| --- | --- | --- |
| `owner_accounts` | Biết email nào là chủ | `id`, `canonical_email` (duy nhất) |
| `otp_challenges` | Lưu mã đã phát | `id`, `purpose` (loại thao tác), đối tượng (intent; hoặc quán và tài khoản chủ; với mã của email mới thì thêm xác nhận chính chủ, địa chỉ mới và tài khoản POS được chọn), `canonical_email`, thời điểm phát, hạn, giá trị băm của mã, số lần sai, trạng thái. Mỗi email và mỗi loại thao tác có tối đa một mã còn hiệu lực |
| `otp_request_outcomes` | Trả lại đúng kết quả khi gửi lại yêu cầu gửi mã | `request_id` (duy nhất), email, đối tượng, kết quả, `challenge_ref`, mốc hẹn. Giữ ít nhất 90 phút |
| `otp_attempts` | Trả lại đúng kết quả khi gửi lại lần nhập mã | `attempt_id` (duy nhất), đối tượng, giá trị băm của mã nếu đã so mã, mã đã đối chiếu, kết quả. Giữ ít nhất 90 phút; không sửa sau khi ghi |
| `create_intents` | Một bộ thông tin tạo quán đã gửi mã | `intent_id` (duy nhất), email, dấu vân tay của thông tin tạo quán (ghi một lần), trạng thái |
| `create_operations` | Yêu cầu tạo quán đã được chấp nhận | `id`, chủ, intent, trạng thái (`accepted`, `unknown`, `compensating`, `created`, `failed`), mã lý do, thẻ lượt chạy và hạn lượt chạy, bước đang làm, dữ liệu tạm (hash PIN, bí mật mã hóa, số quán), trạng thái khoảng nhận lại Store Key. Bảng riêng tư, không cấp quyền cho máy người dùng |
| `owner_action_proofs` | Xác nhận chính chủ cho đổi email và chuyển quyền | `id`, loại thao tác, quán, tài khoản chủ, phiên nhân viên, hạn, trạng thái (`active`, `used`, `cancelled`, `replaced`). Mỗi quán và mỗi loại có tối đa một bản ghi `active`; tạo bản ghi mới thì bản ghi trước chuyển `replaced` và mã email mới của nó bị hủy |
| `store_key_rotations` | Việc cấp lại Store Key đang làm dở | quán, trạng thái (`pending`, `applied`, `completed`), bí mật mới đã mã hóa, thẻ lượt chạy. Mỗi quán có tối đa một bản ghi `pending`, nhờ ràng buộc duy nhất có điều kiện |
| `mail_dispatches` | Theo dõi việc gửi thư | loại thư, đối tượng, trạng thái (`queued`, `sending`, `submitted`, `rejected`, `failed_before_submit`, `provider_limited`, `unknown`) |
| `store_admin_log` | Nhật ký quản trị | `store_id`, `action`, `actor_owner_account_id`, `detail`, `created_at` |

`action` trong nhật ký gồm: `store_created`, `store_key_regenerated`, `store_status_changed`, `owner_pin_reset`, `owner_email_changed`, `ownership_transferred`, `store_data_reset`. `detail` MUST NOT chứa Store Key, phần bí mật, mã xác nhận hay PIN; kiểm bằng kiểm thử. Bảng gắn với `store_id`, nên nhật ký không mất khi đổi chủ hoặc reset.

Hai trường hợp đặc biệt khi gửi thư: thư đang `sending` mà lượt chạy hết hạn thì coi là `unknown`, không gửi lại và báo người vận hành; yêu cầu `compensating` được tính như `unknown` khi đếm hạn mức.

## Hợp đồng hàm phía server

Một hàm, nhiều hành động. Gộp vì tất cả dùng chung phần gửi và kiểm mã, giới hạn tần suất và ghi nhật ký. Mọi hành động của chủ nhận quán từ phiên của máy đang gọi (`auth.uid()`), không nhận từ tham số.

| Hành động | Ai gọi được | Việc chính |
| --- | --- | --- |
| `requestCreateStoreOtp` | Ai cũng gọi được | Gửi mã tạo quán. Phản hồi chung một dạng |
| `verifyAndAcceptCreate` | Ai cũng gọi được, phải có mã đúng | Kiểm mã, kiểm thông tin, kiểm hạn mức, ghi yêu cầu, rồi tạo quán |
| `confirmStoreKeySaved` | Người vừa tạo quán | Đóng khoảng nhận lại Store Key |
| `forgotStoreKey` | Ai cũng gọi được | Trả phản hồi chung một dạng trước, rồi mới tra chủ, giải mã key và gửi thư. Có giới hạn theo email; giới hạn theo địa chỉ mạng và trần toàn dự án tính chung |
| `requestOwnerActionOtp` | Tài khoản chủ quán đang đăng nhập; riêng quên PIN chỉ cần máy đã ghép | Gửi mã theo loại thao tác. Phản hồi không chứa email |
| `verifyOwnerProof` | Tài khoản chủ quán | Nhận email đã đăng ký và mã, ghi xác nhận chính chủ cho đổi email hoặc chuyển quyền |
| `regenerateStoreKey` | Tài khoản chủ quán, có mã | Các bước ở mục "Sau khi mã đúng" bên dưới |
| `resetOwnerPin` | Máy đã ghép, có mã | Ghi lại PIN của nhân viên vai trò `owner` |
| `changeOwnerEmail` | Tài khoản chủ quán, có xác nhận chính chủ và mã của email mới | Đổi email của chủ, hủy mã và xác nhận còn dở, gửi thư báo |
| `transferOwnership` | Tài khoản chủ quán, có xác nhận chính chủ và mã của email mới | Kiểm hạn mức của email mới, đổi chủ và đổi vai trò trong một giao dịch, gửi thư báo |
| `resetStoreData` | Tài khoản chủ quán, có mã | Đưa dữ liệu quán về rỗng trong một giao dịch, ghi nhật ký |

### Các giới hạn gửi mã

| Giới hạn | Đếm theo | Bảo vệ điều gì |
| --- | --- | --- |
| Chờ 10 phút giữa hai lần gửi; 3 lần mỗi 15 phút; 10 lần mỗi ngày | Email và từng loại thao tác, trừ mã reset | Hộp thư của một người khỏi bị gửi dồn, mà thao tác này không chặn thao tác kia |
| 10 lần mỗi giờ | Địa chỉ mạng, chung mọi loại | Một máy không gửi thư hàng loạt tới nhiều email |
| 400 lần mỗi ngày | Toàn dự án, chung mọi loại | Sức chứa của đường gửi thư duy nhất của dự án |

Ví dụ: chủ vừa nhận mã quên PIN vẫn nhận được mã chuyển quyền ngay, vì đó là hai loại khác nhau; nhưng cả hai lần đều được đếm vào 10 lần của địa chỉ mạng đó và 400 lần của dự án. Mỗi lần chấp nhận gửi mã tính một lần vào cả hai giới hạn chung. Với quên Store Key, giới hạn theo địa chỉ mạng đếm mọi yêu cầu đúng dạng, trước khi xét giới hạn theo email, kể cả khi email không có quán, để không ai suy ra được email nào có quán qua số thư nhận được; trần toàn dự án chỉ đếm thư thực sự gửi. Thư báo sau thao tác, thư Store Key khi tạo quán và thư key mới sau khi cấp lại không tính. Lý do đầy đủ ở quyết định 39.

Thời gian chờ tính theo email và loại thao tác, không theo quán. Vì vậy tạo đủ 5 quán mất ít nhất 40 phút, và chủ nhiều quán làm cùng một loại thao tác ở hai quán phải cách nhau 10 phút. Ngoại lệ là mã reset: không có thời gian chờ và không có giới hạn theo email, gửi mã mới thì mã trước bị hủy, kể cả mã reset của quán khác cùng chủ (quyết định 43).

### Mỗi mã gắn với gì

| Loại thao tác | Gắn với | Gửi tới |
| --- | --- | --- |
| Tạo quán | Intent | Email người dùng nhập |
| Quên PIN chủ, cấp lại Store Key, reset dữ liệu | Quán | Email chủ hiện tại |
| Đổi email, xác nhận chính chủ | Quán, tài khoản chủ | Email chủ hiện tại, nếu khớp email người dùng nhập |
| Đổi email, xác nhận email mới | Xác nhận chính chủ, địa chỉ mới | Email mới |
| Chuyển quyền, xác nhận chính chủ | Quán, tài khoản chủ | Email chủ hiện tại, nếu khớp email người dùng nhập |
| Chuyển quyền, xác nhận email mới | Xác nhận chính chủ, tài khoản POS được chọn, địa chỉ mới | Email mới |

Mỗi xác nhận chính chủ chỉ có một mã email mới còn hiệu lực; khi mã cho địa chỉ khác thực sự được phát thì mã trước bị hủy; yêu cầu bị chặn thì mã trước vẫn dùng được. Xác nhận chính chủ chỉ cần còn hạn lúc yêu cầu mã của email mới. Từ lúc đó mã của email mới có 10 phút riêng, và người gửi phải vẫn ở đúng phiên đã tạo xác nhận.

### Thứ tự khi gửi mã

1. Kiểm dạng dữ liệu. Sai dạng thì trả lỗi ngay, không ghi gì.
2. Với thao tác của chủ: kiểm phiên bình thường còn hiệu lực (`permission_current_employee`, mục đích `normal`), hết thì trả `EMPLOYEE_SESSION_REQUIRED`, còn đang ở bước buộc đổi PIN thì trả `PIN_CHANGE_REQUIRED`; kiểm đúng vai trò `owner`, sai thì trả `OWNER_ROLE_REQUIRED`; với quên PIN: kiểm máy đã ghép; quán đang tạm ngưng thì trả `STORE_SUSPENDED`. Kiểm cả khi gửi lại. Mã gửi tới email mới còn phải có xác nhận chính chủ, thiếu thì trả `OWNER_PROOF_REQUIRED`.
3. Tra mã định danh yêu cầu. Đã có và trùng email, loại thao tác, đối tượng thì trả lại kết quả cũ (PIN không nằm trong phần so); đã có mà khác thì từ chối; chưa có mà thời điểm tạo lệch quá 30 phút thì từ chối.
4. Với thao tác của chủ: lấy khóa theo quán rồi lặp lại bước 2 dưới khóa. Khóa theo email, địa chỉ mạng và trần toàn dự án, rồi đọc lại mã định danh dưới khóa. Hai yêu cầu cùng mã định danh, khác email: yêu cầu sau bị ràng buộc duy nhất chặn lại và nhận `A_REQUEST_ID_REUSED`.
5. Kiểm thời gian chờ và lượt gửi theo email cùng loại thao tác, trừ mã reset. Không đủ điều kiện thì ghi kết quả "bị chặn", không tạo mã, không tính lượt.
6. Đủ điều kiện thì tạo mã, ghi kết quả và bản ghi thư trong cùng giao dịch. Sau khi lưu xong mới gửi thư, đúng một lần, không gửi lại. Thư lỗi không làm mất lượt đã tính.

### Thứ tự khi kiểm mã

Áp dụng cho mọi loại thao tác. Tất cả nằm trong một giao dịch.

1. Kiểm dạng dữ liệu. Với thao tác của chủ: kiểm phiên bình thường còn hiệu lực (`permission_current_employee`, mục đích `normal`), hết thì trả `EMPLOYEE_SESSION_REQUIRED`, còn đang ở bước buộc đổi PIN thì trả `PIN_CHANGE_REQUIRED`; kiểm đúng vai trò `owner`, sai thì trả `OWNER_ROLE_REQUIRED`; với quên PIN: kiểm máy đã ghép; quán đang tạm ngưng thì trả `STORE_SUSPENDED`. Người không đủ điều kiện không thể làm hết lần thử của chủ. Vì bước này đứng trước việc tra kết quả cũ, gửi lại sau chuyển quyền hoặc reset nhận `EMPLOYEE_SESSION_REQUIRED`: chính thao tác đã hủy phiên, mã đã dùng nên không chạy lần hai.
2. Giữ chỗ mã định danh lần nhập (`attempt_id`). Lấy khóa theo quán, rồi khóa mã đang xét và đối tượng của nó. Đọc lại bản ghi lần nhập dưới khóa. Lặp lại việc kiểm ở bước 1 dưới khóa, vì thao tác trước có thể vừa đổi chủ, hủy phiên hoặc hủy mã. Không đạt thì trả lỗi và không lưu kết quả cho lần nhập này, để lần gửi sau kiểm lại từ đầu.
3. Lần nhập này đã có kết quả: cùng loại thao tác, đối tượng và mã (nếu lần trước đã so mã) thì trả lại kết quả cũ. Khác mã, trong khi mã kia còn hiệu lực thì tăng đếm sai của mã đó và trả `A_ATTEMPT_ID_REUSED`. Nhờ vậy không thể dò mã bằng cách gửi lại mà không bị đếm.
4. Yêu cầu đã được chấp nhận trước đó (ví dụ tạo quán đã nhận): chỉ trả trạng thái, không so mã, không đếm.
5. Mã hết hạn, đã hủy, đã dùng hoặc không tồn tại: trả lỗi tương ứng, không đếm. Các trường hợp sau cũng coi như không tồn tại: quán trong mã khác quán của máy gọi; mã gửi về email đã đăng ký mà email trong mã khác email chủ hiện tại; mã gửi tới email mới mà xác nhận chính chủ của nó đã dùng, đã hủy hoặc đã bị thay, hoặc tài khoản của xác nhận đó không còn là chủ quán này. Việc này kiểm ở lúc nhập mã, nên mã được phát đồng thời với lúc xác nhận bị hủy cũng không dùng được. Mã tạo quán gắn với intent, không so với chủ nào.
6. **So mã trước.** Sai: tăng đếm, lần thứ năm hủy mã. Lúc này chưa so PIN, nên phản hồi giống hệt dù PIN đúng hay sai.
7. Mã đúng mới so thông tin đi kèm. Khác lúc gửi mã: tăng đếm, không dùng mã.
8. Kiểm điều kiện riêng của thao tác (hạn mức khi tạo quán hoặc nhận quyền, email mới chưa thuộc ai khi đổi email). Không đạt: dừng, không dùng mã.
9. Dùng mã và ghi nhận thao tác. Lưu lại kết quả. Giao dịch lỗi thì trả một lỗi tạm thời chung, không phụ thuộc mã đúng hay sai.

Thứ tự khóa để tránh kẹt lẫn nhau: mã định danh lần nhập, quán (`private.permission_store_mutex`, trong `supabase/candidate/permission-identity.sql`), mã xác nhận, intent, các tài khoản chủ theo thứ tự `id`, yêu cầu tạo quán. Hai thao tác cùng lúc trên một quán chạy lần lượt; thao tác sau lặp lại việc kiểm dưới khóa: nếu thao tác trước đã hủy phiên của người gọi (chuyển quyền, reset) thì trả `EMPLOYEE_SESSION_REQUIRED`; nếu phiên còn mà mã đã bị hủy (đổi email) thì trả `A_OTP_UNAVAILABLE`. Mọi thời gian đều theo đồng hồ database; đồng hồ máy người dùng chỉ để hiển thị đếm ngược.

### Sau khi mã đúng

- **Quên PIN:** trong một giao dịch: ghi PIN mới; xóa cờ buộc đổi PIN nếu có, vì PIN này do chính chủ đặt qua mã email; hủy các phiên của tài khoản chủ; ghi nhật ký.
- **Đổi email:** trong một giao dịch, dưới khóa quán đang gọi và khóa tài khoản chủ: đổi email; hủy các mã và xác nhận chính chủ còn dở của chủ này ở mọi quán; đóng khoảng nhận lại Store Key còn mở; ghi nhật ký và thư báo `queued`. Thư gửi sau giao dịch; dừng giữa chừng thì tiến trình đối soát gửi tiếp. Thao tác này ảnh hưởng mọi quán của chủ nhưng chỉ giữ khóa của một quán; nếu đụng khóa với thao tác ở quán khác, database hủy một bên và người dùng thử lại. Email mới thuộc một bản ghi chủ không còn quán nào và không có yêu cầu tạo quán đang chạy thì không bị chặn: giao dịch giải phóng email của bản ghi đó, nhật ký cũ vẫn giữ.
- **Chuyển quyền:** trong một giao dịch: kiểm lại tài khoản được chọn còn hợp lệ, không thì trả `TRANSFER_EMPLOYEE_INVALID` và chưa dùng mã; hủy mã và xác nhận còn dở của quán; đóng khoảng nhận lại Store Key nếu còn mở; tạo bản ghi chủ nếu email mới chưa có; đổi `owner_account_id`; đổi A thành `cashier` rồi đổi B thành `owner`, đúng thứ tự này vì có ràng buộc mỗi quán một `owner` (`employees_one_owner`, trong `supabase/candidate/permission-identity.sql`); cùng lúc đặt cờ buộc đổi PIN `pin_change_required` cho B; bỏ các quyền riêng của cả hai; hủy phiên của A và B; tăng `permission_revision`; ghi nhật ký và hai thư báo `queued`. A đang ở phiên bình thường nên không mang cờ buộc đổi PIN, vì vậy không vướng ràng buộc `employees_pin_change_owner`. Tài khoản mẫu có PIN công khai nhận biết theo định danh cố định của dữ liệu mẫu (`demo.employee.demo-emp-cashier`, trong `supabase/candidate/permission-seed.sql`), kể cả khi PIN của nó đã đổi.
- **Reset:** trong một giao dịch: hủy phiên của mọi nhân viên, gồm cả người đang thao tác; hủy mã và xác nhận còn dở của quán; đưa dữ liệu về rỗng; đóng luồng dữ liệu mẫu của quán (`private.initial_seed_workflows`, trong `supabase/candidate/permission-identity.sql`) để POS không nhắc thử lại và không tự chạy, kể cả khi lúc đó dữ liệu mẫu chưa chạy hoặc vừa lỗi; đồng bộ `seed_status`; tăng tín hiệu thay đổi của quán (`store_change_signals`) để các máy tải lại; ghi danh sách ảnh cần xóa và nhật ký. Ảnh trong kho ảnh xóa sau giao dịch theo danh sách đó; lỗi thì tiến trình đối soát thử lại. Hủy phiên trước để nhân viên không ghi thêm được. Hàm thanh toán hiện không giữ khóa theo quán (`supabase/candidate/permission-financial.sql`), nên khi triển khai phải chặn giao dịch đến muộn, ví dụ cho hàm đó giữ khóa quán.
- **Cấp lại Store Key:** đổi mật khẩu Auth và ghi database không gói chung được, nên làm từng bước: (1) trong một giao dịch: dùng mã, ghi `store_key_rotations` ở `pending` kèm bí mật mới đã mã hóa, lấy thẻ lượt chạy, đóng khoảng nhận lại Store Key; (2) đặt mật khẩu mới bằng API quản trị, làm lại nhiều lần vẫn cho cùng kết quả, vì luôn dùng cùng một bí mật; (3) trong một giao dịch: chuyển `applied`, thay bí mật trên `stores`, xóa bí mật khỏi bản ghi cấp lại, ghi nhật ký, thư `queued`; (4) thu hồi phiên của tài khoản kỹ thuật, làm lại nhiều lần vẫn cho cùng kết quả, rồi chuyển `completed`; hiển thị key mới, gửi thư. Dừng giữa chừng thì tiến trình đối soát làm tiếp: `pending` từ bước 2 với cùng bí mật, `applied` từ bước 4; thư đã `queued` vẫn được gửi. Đối soát một bản ghi `applied` bị kẹt có thể đăng xuất cả máy vừa ghép bằng key mới; việc này an toàn, máy đó chỉ cần đăng nhập lại bằng key mới. Trong lúc `pending`: yêu cầu cấp lại khác trả `unknown`, không tạo bản ghi mới và không dùng mã; đổi email, chuyển quyền và reset trả `CREATE_VERIFY_UNAVAILABLE`, chưa dùng mã; thư quên Store Key bỏ quán này ra, vì key trên `stores` có thể đã hết tác dụng và thư cấp lại sẽ tới sau. Từ `applied` trở đi các thao tác này không bị chặn nữa, vì key mới đã dùng được. Auth lỗi lặp lại: sau 6 lần đối soát liên tiếp không thành, hệ thống báo người vận hành và giữ nguyên trạng thái, vì ở `pending` chưa biết Auth đang giữ mật khẩu nào; các thao tác trên vẫn bị chặn tới khi người vận hành chạy lại. Token đang dùng của các máy còn hiệu lực tới khi hết hạn, mặc định 1 giờ theo tài liệu Supabase, hoặc tới khi người dùng đăng xuất (quyết định 42). Điều này chỉ đúng nếu bước thu hồi phiên chặn được việc làm mới token; tài liệu Supabase mô tả đăng xuất bằng JWT của chính phiên đó, còn tiến trình đối soát không có JWT, nên phải đối chiếu khi triển khai (`tasks.md` mục 12.10).

### Thời gian lưu

Bản ghi gửi lại (`otp_request_outcomes`, `otp_attempts`) giữ ít nhất 90 phút. Mã và bản ghi thư OTP giữ tới hết ngày theo giờ Việt Nam chứa thời điểm phát, cộng 48 giờ, để đếm lượt theo ngày và đối chiếu. Intent chưa được chấp nhận giữ 90 phút sau hạn của mã cuối. Yêu cầu tạo quán đã chấp nhận, nhật ký và bản ghi thư Store Key không xóa trong giai đoạn 1. Xác nhận chính chủ hết tác dụng sau 10 phút. Máy người dùng chỉ xóa biên nhận khi quán đã tạo xong hoặc đã thất bại, người dùng đã rời luồng, đã qua 90 phút và đã qua mốc hẹn gửi lại; đồng hồ máy không phải bằng chứng. Bản nháp tên quán, địa chỉ và tùy chọn dữ liệu mẫu gắn với từng luồng và xóa cùng lúc với biên nhận. Luồng bỏ dở chưa có kết quả thì hai bản ghi này còn nằm trên máy; thời hạn xóa chốt khi triển khai. Việc dọn dữ liệu chỉ bật sau khi các con số này được duyệt khi triển khai.

### Yêu cầu quá cũ

Máy người dùng tạo `request_id` và `attempt_id` dạng UUID v7, có sẵn thời điểm tạo. Bản ghi giữ ít nhất 90 phút. Mã định danh đã có bản ghi luôn nhận lại kết quả cũ. Mã định danh không còn bản ghi mà thời điểm tạo lệch quá 30 phút thì bị từ chối. Bản ghi chỉ bị xóa sau 90 phút, lúc đó thời điểm tạo chắc chắn đã cũ hơn 30 phút, nên yêu cầu cũ không bao giờ bị coi nhầm là yêu cầu mới. Khi bị từ chối vì đồng hồ lệch, phản hồi kèm giờ của server; máy tự chỉnh và gửi lại một lần với mã định danh mới, an toàn vì lần trước chưa làm gì.

### Tạo quán sau khi mã đúng

Auth, database và email là ba hệ thống tách nhau nên không gói chung một giao dịch được. Hàm làm từng bước và ghi lại đã tới đâu:

1. Khóa yêu cầu, lấy lượt chạy (tăng thẻ lượt chạy), so lại dấu vân tay thông tin.
2. Ghi dữ liệu tạm: tên, địa chỉ, tùy chọn dữ liệu mẫu, hash PIN, bí mật đã mã hóa, số quán.
3. Tạo tài khoản kỹ thuật bằng API quản trị, có dấu hiệu gắn với yêu cầu này.
4. Trong một giao dịch: tạo quán, cấu hình, nhân viên `owner`, liên kết chủ, nhật ký, bản ghi thư `queued`; chuyển yêu cầu sang `created`; xóa dữ liệu tạm. Quán được ghi cùng lúc chuyển trạng thái nên phép đếm hạn mức không bao giờ thiếu hay thừa.
5. Mở khoảng nhận lại Store Key, gửi thư, chạy seed nếu chọn.

Tiến trình đối soát nhặt yêu cầu quá hạn xử lý (ít nhất 10 phút) rồi làm tiếp từ bước đã ghi, hoặc dọn dẹp nếu không làm tiếp được: chuyển `compensating`, xóa tài khoản kỹ thuật có đúng dấu hiệu, chuyển `failed`, trả chỗ hạn mức. Thẻ lượt chạy ngăn lượt cũ chậm ghi đè lượt mới. Số quán có email đã bị người khác đăng ký thì bỏ qua và chọn số khác; hỏng ba số liên tiếp thì thất bại.

### Mã lỗi mới

Các mã này chưa có trong `AppErrorCode` (`src/core/appError.ts`) nên khai báo tại đây.

| Mã | HTTP | Khi nào | Thông báo |
| --- | --- | --- | --- |
| `A_EMAIL_INVALID` | 400 | Email sai dạng | "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại." |
| `A_REQUEST_INVALID` | 400 | Trường khác sai dạng | "Yêu cầu không hợp lệ. Vui lòng tải lại trang rồi thử lại." |
| `A_REQUEST_ID_STALE` | 400 | Mã định danh quá cũ, chưa có bản ghi | "Thời gian trên thiết bị chưa khớp. Đang thử lại…" |
| `A_REQUEST_ID_REUSED` | 409 | Mã định danh dùng lại với nội dung khác | "Yêu cầu không hợp lệ. Vui lòng tải lại trang rồi thử lại." |
| `CREATE_INTENT_ID_REUSED` | 409 | Intent đã gắn với email khác | "Yêu cầu không hợp lệ. Vui lòng tải lại trang rồi thử lại." |
| `A_SEND_UNAVAILABLE` | 503 | Lỗi hệ thống trước khi ghi nhận | "Chưa tiếp nhận được yêu cầu gửi mã. Vui lòng thử lại." |
| `A_OTP_FORMAT_INVALID` | 400 | Mã sai dạng | "Mã xác minh phải gồm đúng 6 chữ số từ 0 đến 9." |
| `A_OTP_INVALID` | 400 | Mã sai | "Mã xác minh không đúng. Vui lòng kiểm tra và nhập lại." |
| `A_OTP_EXPIRED` | 400 | Quá 10 phút | "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới." |
| `A_OTP_ATTEMPTS_EXCEEDED` | 400 | Mã đã bị hủy sau 5 lần sai | "Mã xác minh đã bị hủy sau 5 lần nhập sai. Vui lòng đợi đủ 10 phút từ lúc gửi mã rồi yêu cầu mã mới." |
| `A_OTP_UNAVAILABLE` | 400 | Không có mã phù hợp | "Không thể xác minh mã này. Nếu bạn vừa yêu cầu mã, vui lòng đợi đủ 10 phút từ lần gửi trước rồi yêu cầu mã mới." |
| `A_ATTEMPT_ID_REUSED` | 409 | Lần nhập dùng lại với mã khác | "Yêu cầu xác minh này đã được dùng cho một mã khác. Vui lòng nhập lại mã." |
| `CREATE_INTENT_CONFLICT` | 409 | Mã đúng, thông tin khác lúc gửi mã | "Thông tin tạo quán đã thay đổi so với lúc gửi mã. Kiểm tra lại PIN và thông tin, hoặc bắt đầu yêu cầu mới." |
| `OWNER_STORE_LIMIT_REACHED` | 409 | Đã đủ 5 quán | "Bạn đã có đủ 5 quán. Liên hệ nhà cung cấp nếu cần nới hạn mức." |
| `RECIPIENT_STORE_LIMIT_REACHED` | 409 | Email mới đã đủ 5 quán | "Email này đã đứng tên đủ 5 quán nên chưa nhận thêm được quán này." |
| `CREATE_VERIFY_UNAVAILABLE` | 503 | Chưa xác nhận được kết quả giao dịch | "Chưa xác nhận được kết quả. Vui lòng thử lại." |
| `CONFIRM_REJECTED` | 409 | Xác nhận đã lưu key nhưng mã hoặc thông tin sai | "Không xác nhận được. Kiểm tra lại mã và thông tin tạo quán." |
| `CREATE_PROOF_REQUIRED` | 403 | Gọi tạo quán khi chưa có yêu cầu được chấp nhận | "Cần xác minh email cho lần tạo quán này." |
| `OWNER_ROLE_REQUIRED` | 403 | Phiên còn hiệu lực nhưng không phải tài khoản chủ quán | "Chỉ tài khoản chủ quán mới thực hiện được thao tác này." |
| `STORE_NAME_MISMATCH` | 400 | Gõ sai tên quán ở bước xác nhận | "Tên quán chưa đúng. Vui lòng gõ lại đúng tên quán." |
| `NEW_EMAIL_UNAVAILABLE` | 409 | Email mới trùng email đang dùng; hoặc đã đứng tên chủ khác, hoặc đang có yêu cầu tạo quán chưa xong (hai trường hợp này báo sau khi mã đúng) | "Email này không dùng được. Vui lòng chọn email khác." |
| `TRANSFER_TARGET_INVALID` | 400 | Email mới trùng email chủ hiện tại | "Email mới phải khác email đang đăng ký." |
| `TRANSFER_EMPLOYEE_INVALID` | 400 | Tài khoản được chọn không hợp lệ | "Tài khoản này không nhận được quyền chủ. Vui lòng chọn tài khoản khác." |
| `OWNER_PROOF_REQUIRED` | 403 | Chưa qua bước xác nhận email đã đăng ký, hoặc xác nhận đã hết hạn | "Vui lòng xác nhận email đã đăng ký trước khi làm tiếp." |
| `STORE_SUSPENDED` | 403 | Quán đang tạm ngưng | "Quán đang tạm ngưng nên chưa thực hiện được thao tác này." |
| `STORAGE_UNAVAILABLE` | — | Máy không ghi được biên nhận; vẫn cho làm tiếp | "Chưa lưu được biên nhận trên thiết bị. Tải lại có thể làm mất bước đang thực hiện." |

Với mã reset không có thời gian chờ, hai câu trên đổi thành: `A_OTP_ATTEMPTS_EXCEEDED` "Mã xác minh đã bị hủy sau 5 lần nhập sai. Vui lòng yêu cầu mã mới."; `A_OTP_UNAVAILABLE` "Không thể xác minh mã này. Vui lòng yêu cầu mã mới."

`OWNER_PROTECTED` là mã có sẵn khi người khác cố đổi, xóa hoặc khóa chủ quán qua phần quản lý nhân viên: "Không thể thay đổi chủ quán bằng thao tác này." (`src/core/permissionErrors.ts`). Hai mã có sẵn khác được dùng lại cho thao tác của chủ: `EMPLOYEE_SESSION_REQUIRED` khi phiên đã hết hiệu lực, "Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại."; `PIN_CHANGE_REQUIRED` khi tài khoản đang phải đổi PIN. Câu hiện có trên main là "Bạn cần đổi PIN tạm trước khi sử dụng quán."; người vừa nhận quyền không dùng PIN tạm nên thấy câu "Bạn cần đổi PIN trước khi sử dụng quán."

Trạng thái kết quả, không phải lỗi: `unknown` — "Chưa xác định kết quả tạo quán. Kiểm tra yêu cầu cũ trước khi tạo yêu cầu mới."; với cấp lại Store Key là "Chưa xác định kết quả cấp lại Store Key. Vui lòng kiểm tra email hoặc thử lại sau."; `failed` — "Không tạo được quán. Lượt tạo đã được hoàn lại, bạn có thể tạo lại bằng yêu cầu mới.". Mã lý do thất bại nội bộ (`C_PIN_NOT_PERSISTED`, `C_AUTH_REJECTED`, `C_STORE_NO_UNAVAILABLE`, `C_STORE_WRITE_REJECTED`, `C_CONFIG_MISSING`) chỉ ghi nhật ký vận hành, không hiện cho người dùng. Seed dùng mã có sẵn `PERMISSION_UPDATE_UNAVAILABLE` và `EMPLOYEE_SESSION_REQUIRED`.

## Các loại thư

| Thư | Gửi tới | Nội dung |
| --- | --- | --- |
| Mã xác nhận theo từng thao tác | Email đã đăng ký; riêng đổi email và chuyển quyền còn gửi tới email mới | Mã 6 chữ số, hạn 10 phút, nói rõ đang xác nhận thao tác gì |
| Store Key khi tạo quán xong | Email chủ | Hỗ trợ kèm theo; đường giao chính là màn kết quả có nút sao chép. Tên, địa chỉ và Store Key của quán vừa tạo. Quyết định 22 |
| Quên Store Key | Email chủ | Danh sách quán: tên, địa chỉ, Store Key. Nhắc dùng chức năng cấp lại nếu nghi hộp thư bị lộ |
| Key mới sau khi cấp lại | Email chủ | Hỗ trợ kèm theo; đường giao chính là màn hình |
| Báo đổi email | **Email cũ** | Báo email của quán đã đổi |
| Báo chuyển quyền | Email chủ cũ và chủ mới | Báo quán đã đổi chủ |

Email quên Store Key liệt kê dạng danh sách ngay từ đầu, kể cả khi chỉ có một dòng. Quyết định 21.

## Kiểm thử

Dự án dùng project staging làm database duy nhất, không có project riêng khác cho test (quyết định 41, 44). Vì vậy:

- Phần gửi thư và phần lưu trữ của hàm phía server được tách khỏi các quy tắc, để chạy test trên máy với database giả và đường gửi thư giả.
- Bản giả lập trong `src/adapters/mock` đóng vai server, database và thư, để giao diện chạy như đã kết nối Supabase. Test đọc mã từ bản giả lập.
- Mọi khoảng thời gian trong bản giả lập là cấu hình và được rút ngắn, ví dụ 10 phút xuống 15 giây.
- Hàm thật không có chế độ test, không có mã xác nhận dùng chung và không có lối trả mã ra ngoài. Hàm thật kiểm cận dưới của các giá trị cấu hình, ví dụ hạn mã và thời gian chờ không dưới 10 phút, để giá trị rút ngắn không lọt lên bản thật.
- Trên staging là test tay: người kiểm đọc mã trong hộp thư rồi nhập.

Cách chạy và danh sách ca phải test tay ghi ở `testplan.md`.

## Giao diện

Sửa lại ngày 2026-11-05. Không có mặt web riêng cho chủ (quyết định 23, 24).

- **Màn tạo quán:** nhập thông tin, nhập mã, phần kết quả hiển thị Store Key kèm nút sao chép và nút "Tôi đã lưu Store Key". Không cần đăng nhập.
- **Màn ghép thiết bị:** có lối quên Store Key.
- **Màn nhập PIN:** khi chọn tài khoản chủ quán thì có lối "Quên mã PIN".
- **Mục Cài đặt của POS:** với tài khoản chủ quán có thêm cấp lại Store Key, đổi email, chuyển quyền, reset dữ liệu và lối quên Store Key. Không thêm quyền vào danh mục.

## Chỗ đã chừa sẵn cho nhiều cửa hàng

Ghi tách riêng để trả lời được khi bị hỏi tại buổi bảo vệ.

**Đã mở sẵn, không phải làm gì thêm**

- `stores.owner_account_id` là khóa ngoại thường, không có ràng buộc duy nhất.
- Email khôi phục đã là danh sách.
- Nhật ký gắn theo cửa hàng nên không rối khi một chủ có nhiều cửa hàng.
- Hành động của chủ lấy cửa hàng từ phiên của máy đang gọi, nên một chủ có nhiều cửa hàng vẫn đúng; không có chỗ nào suy ra "cửa hàng duy nhất của chủ này".
- Trần 5 cửa hàng là cấu hình, nới không cần migration.
- Baseline spec `store-isolation` đã đặc tả sẵn kịch bản một chủ hai quán.

**Còn thiếu để thành tính năng chuỗi**

- Màn chuyển đổi cửa hàng đang làm việc trong ứng dụng POS.
- Báo cáo hợp nhất nhiều cửa hàng.
- Danh mục dùng chung giữa các cửa hàng.
- Quan hệ nhân viên làm ở nhiều cửa hàng.
- Đăng nhập của chủ. Quyết định 23 bỏ đăng nhập web của chủ, nên màn chuyển đổi cửa hàng và báo cáo hợp nhất sẽ cần thêm liên kết giữa tài khoản chủ với Auth và một nhánh chính sách bảo mật cho chủ.

Các việc đó nằm ở `add-multi-store-ownership` và `add-cross-store-reporting`. Bảng tài khoản chủ và cột chủ trên bản ghi cửa hàng dùng lại được; riêng việc đăng nhập của chủ phải thêm mới.

## Risks / Trade-offs

| Rủi ro | Giảm nhẹ |
| --- | --- |
| Store Key nằm lại trong hộp thư sau khi gửi | Giới hạn tần suất với thư quên Store Key, không ghi vào nhật ký, email nhắc dùng chức năng cấp lại nếu nghi lộ. Quyết định 8 và 22 đã chấp nhận đánh đổi này |
| Mã xác nhận rơi vào thư rác thì không làm tiếp được thao tác | Gửi qua SMTP của một tài khoản Gmail riêng của dự án, được Google ký DKIM trên `gmail.com`. Kiểm tra thực tế khả năng vào hộp thư chính trước ngày demo. Quyết định 15 mức 1 |
| Mất khóa mã hóa là mất khả năng khôi phục Store Key của mọi cửa hàng | Sao lưu khóa tách khỏi bản sao lưu database; cột phiên bản khóa cho phép xoay |
| Store Key rò rỉ thì ai cũng ghép được thiết bị | Chức năng cấp lại là biện pháp bù duy nhất. Quyết định 13 đã ghi nhận hạn chế này |
| Chủ mất hẳn quyền truy cập email thì cửa hàng kẹt | Đổi email chủ là biện pháp phòng ngừa. Lối thoát cuối thuộc `add-provider-admin-console`. Quyết định 17 |
| Sau khi chuyển quyền, A vẫn là tài khoản thường và vẫn biết Store Key | Chủ dự án chấp nhận. B tự xóa tài khoản A, hoặc cấp lại Store Key nếu cần. Quyết định 28 |
| A tạo tài khoản cho B nên có thể biết PIN của B. Sau khi chuyển quyền, A có thể đăng nhập bằng PIN đó với quyền chủ quán, kể cả khi B đã xóa tài khoản A; các thao tác cần mã email vẫn không làm được | B phải đổi PIN ở lần đăng nhập đầu và không được chọn tài khoản mẫu có PIN công khai (quyết định 32). Nếu A vào trước và đổi PIN thì A có quyền chủ quán trên POS, trừ các thao tác cần mã email, cho tới khi B dùng "Quên mã PIN" qua email mới để lấy lại; lúc đó phiên của A hết hiệu lực |
| Sau khi cấp lại Store Key, người giữ key cũ vẫn dùng được tới khi token hết hạn, mặc định 1 giờ, hoặc tới khi đăng xuất | Chủ dự án chấp nhận, với điều kiện bước thu hồi phiên chặn được việc làm mới token (`tasks.md` mục 12.10). Key cũ không ghép thêm máy được; không rút hạn token vì phải đổi cấu hình cả dự án. Quyết định 42 |
| Mã reset không có thời gian chờ nên người biết PIN chủ có thể xin nhiều mã để đoán | Vẫn bị chặn ở 10 lần mỗi giờ theo địa chỉ mạng, mỗi mã 5 lần thử, tức 50 lần đoán mỗi giờ từ một địa chỉ. Chủ dự án chấp nhận, vì cần cả PIN và phiên đăng nhập, và chủ thấy thư lạ trong hộp thư. Quyết định 43 |
| Giả lập không chứng minh được chính sách bảo mật, giao dịch và đồng thời ở database | Các ca đó chỉ tính đạt khi test tay trên staging, chỉ trên quán thử. Quyết định 41 |
| Staging vừa là nơi phát triển vừa là nơi kiểm thử; câu lệnh reset hay chuyển quyền lỗi có thể ảnh hưởng quán khác | Sao lưu trước lần đầu chạy; có quán thử thứ hai để kiểm; chỉ thao tác trên quán thử. Nếu staging thành database chính thì phải xem lại các quy tắc này. Quyết định 41, 44 |
| A nhập một địa chỉ khác của chính mình vào ô email mới, nên vẫn giữ đường khôi phục | Màn hình cảnh báo người nhận phải tự nhập và tự đọc mã. POS không hiển thị email nên phần mềm không kiểm tra được thêm |
| Người ngoài cố tình làm hết lượt gửi mã của một email | Chỉ làm chậm việc gửi mã của đúng loại thao tác đó; không lộ gì và không cấp quyền |
| Người biết mã định danh của yêu cầu có thể làm hết lần thử mã hoặc đóng sớm khoảng nhận lại Store Key | Chỉ ảnh hưởng tính sẵn sàng; không lộ PIN, mã hay key. Store Key vẫn có trên màn hình và trong thư |
| Signup công khai của Supabase còn bật nên có thể chiếm trước email theo số quán | Dấu hiệu server ngăn nhận nhầm; bỏ qua số đã bị chiếm. Tắt signup là quyết định của chủ dự án khi triển khai |
| Thư mặc định của Supabase Auth khi cơ chế chặn bị tắt | Chấp nhận rủi ro; thư không mang quyền chủ. Quyết định 31 |
| Reset xóa dữ liệu không khôi phục được | Bốn bước xác nhận; nhật ký giữ lại; không có bước xuất dữ liệu. Quyết định 29, 30, 43 |
| Thêm một thành phần triển khai mới, tăng bề mặt vận hành | Đặt trong cùng nền tảng backend đang dùng, không thêm nhà cung cấp thứ ba |

## Migration Plan

Không có bước chuyển đổi dữ liệu. Quyết định 9 chọn xóa sạch.

Mọi bước chạy trên staging, không đụng database gốc (quyết định 44). Trình tự bắt buộc:

1. Xác nhận rõ ràng từ chủ dự án. Không suy đoán.
2. Sao lưu toàn bộ database và kho ảnh.
3. Chạy migration lược đồ.
4. Xóa dữ liệu cũ.
5. Ghi lại thời điểm và phạm vi đã xóa.
6. Dựng lại dữ liệu demo theo `docs/demo-runbook.md`.
7. Chụp lại ảnh màn hình cho báo cáo nếu ảnh cũ không còn khớp.

Bước 1 và bước 2 là cổng chặn, không được bỏ qua.

## Open Questions

Các câu hỏi đã được chủ dự án chốt hết; xem `proposal.md`, quyết định 32–44.

Việc thực hiện, không phải câu hỏi:

- Dựng đường gửi email ở mức 1 của quyết định 15: tài khoản Gmail riêng của dự án, App Password, thông tin SMTP đặt trong biến môi trường của hàm phía server.
- Nộp hồ sơ xin tên miền miễn phí để nâng lên mức 3. Không chặn tiến độ.
- Xin xác nhận của chủ dự án trước khi xóa dữ liệu cũ.
- Đối chiếu tài liệu chính thức của Supabase rằng tạo user bằng API quản trị với email đã xác nhận không gửi thư, và `app_metadata` chỉ server ghi được, trước khi tạo tài khoản kỹ thuật thật.
- Chốt cách đưa dữ liệu về rỗng khi reset, gồm dữ liệu chỉ thêm không sửa của sổ thanh toán. Chủ dự án nói có thể bàn thêm.
- Đối chiếu tài liệu Supabase về thu hồi phiên và làm mới token (`tasks.md` mục 12.10).
- Chủ dự án quyết định có tắt đăng ký công khai của Supabase không (`tasks.md` mục 1c.5).
- Chốt thời hạn xóa biên nhận và bản nháp của luồng bỏ dở (`tasks.md` mục 6.6).
- Trỏ cấu hình ứng dụng, CLI và hàm phía server sang staging (`tasks.md` mục 2.0).
