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
| Tiến trình đối soát | Việc chạy định kỳ ở server, hoàn tất hoặc dọn dẹp các yêu cầu chưa xong. Đối soát tạo quán thuộc phần sau đồ án |
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
- Phần ghi dữ liệu quán là một giao dịch. Nếu không xác định được kết quả, giữ trạng thái chưa rõ, suất và bằng chứng để đối soát sau.
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

Điều kiện `stores.status = 'active'` bổ sung cho RLS ở các đường dữ liệu nghiệp vụ còn được cấp quyền và cho các điểm kiểm quyền tại DB. RLS một mình không đủ khi hàm chạy với quyền của vai trò có thể bỏ qua RLS. Baseline đã thu quyền trên bảng và view nghiệp vụ, giữ nguyên các ACL đó. [Danh sách thu quyền bảng thô](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-read.sql#L358) · [PostgreSQL Row Security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

| Đường hiện hành | Hợp đồng khi quán tạm ngưng | Căn cứ tại baseline |
| --- | --- | --- |
| Đọc phiên quán | `permission_get_store_session()` lấy `auth.uid()` làm ID quán, trả đúng `storeId`, `storeNo`, `status` của chính quán. Không nhận ID đích hay đòi token nhân viên. Không trả Store Key, email chủ, thiết lập hoặc dữ liệu nghiệp vụ | [RPC hiện trả ID và số quán](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-identity.sql#L523) |
| Danh sách nhân viên trước PIN, mở phiên, authority, đổi PIN và PIN bắt buộc | Chặn khi quán tạm ngưng, kể cả đường chỉ có phiên thiết bị hoặc phiên PIN hạn chế. Kiểm session hợp lệ và vai trò theo hợp đồng cũ của từng RPC. Thu hồi phiên hiện tại để đăng xuất vẫn được phép, không trả dữ liệu nghiệp vụ | [Nhóm RPC phiên nhân viên](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-identity.sql#L159) |
| Đọc nghiệp vụ | Chặn menu, sơ đồ bàn, đơn mở, lịch sử, báo cáo, cấu hình, danh sách quản trị và hóa đơn. Kiểm sau các điểm đợi khóa theo từng projection, trước khi trả kết quả | [Guard của nhóm đọc](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-read.sql#L5) · [Quản trị nhân viên](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-administration.sql#L209) |
| Ghi nghiệp vụ và kết quả ghi | Chặn đăng ký, execute mọi overload, cancel, get/list operation, hóa đơn/in, menu, sơ đồ, cài đặt, xóa mẫu, quản trị nhân viên và các đường seed do thiết bị gọi. Chặn trước khi tạo tác dụng phụ hoặc trả kết quả đã lưu | [Checkpoint tài chính](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-financial.sql#L5) · [Ghi cấu hình](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-changes.sql#L250) · [Quyền in](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-print.sql#L50) · [Seed](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-seed.sql#L89) |
| Realtime và Storage | Tín hiệu theo quán giữ RLS cùng quán và thêm điều kiện active cho SELECT và sự kiện INSERT/UPDATE. Publication chỉ phát INSERT/UPDATE của hai bảng tín hiệu. Tín hiệu catalog toàn cục chỉ là metadata. Các đường ảnh private `begin_upload`, `mark_ready`, `read_staging`, `discard_upload` và finalize giữ guard hiện hành và kiểm active theo đúng quán | [RLS/publication tín hiệu](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-signals.sql#L14) · [RPC ảnh](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-images.sql#L54) |
| GET ảnh công khai | `permission_menu_image_public_lookup` xác định quán từ bản ghi asset đã công bố và chỉ cho quán active. Gateway kiểm lookup trước đọc Storage và trước revalidate. Khi tạm ngưng trả 404 cùng dạng ảnh không có, `no-store`. Ảnh đã tải/cache và URL Storage công khai đời cũ không thuộc cổng này | [Lookup hiện chỉ kiểm publication](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-images.sql#L177) · [GET và revalidate](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/functions/menu-image-public/index.ts#L15) · [Supabase Storage public buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) |

**Ảnh private.** Gateway kiểm RPC trước khi upload, đọc staging hoặc xóa theo yêu cầu client. Nếu tạm ngưng sau khi đã cho bắt đầu upload nhưng trước `mark_ready`, byte đã vào bucket vẫn private. `mark_ready` và finalize phải kiểm trạng thái mới trước khi đổi metadata hoặc công bố ảnh. [Gateway ảnh hiện hành](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/functions/menu-image-gateway/index.ts)

**Realtime.** Policy tín hiệu dùng một hàm boolean trong schema riêng, có `SECURITY DEFINER`, `search_path` cố định và quyền gọi tối thiểu để policy hoạt động. Hàm đọc trạng thái đúng quán từ `auth.uid()`, không nhận ID đích, không cấp SELECT `stores` cho `authenticated`. Tín hiệu hiện phát bằng upsert. Supabase Postgres Changes không áp RLS cho DELETE. Chỉ cấu hình publication tín hiệu phát INSERT/UPDATE sau khi kiểm nó chỉ chứa đúng hai bảng tín hiệu của baseline. Nếu topology thực khác, tách đường tín hiệu khỏi phần publication bị ảnh hưởng trước khi nghiệm thu. Không dựa vào filter ở client để chặn DELETE hay TRUNCATE. [Supabase Realtime và DELETE](https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records) · [Baseline phát tín hiệu](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-signals.sql#L28)

**Thứ tự khóa.** Đổi trạng thái lấy khóa ghi hàng `stores` và chỉ ghi trạng thái cùng audit trong giao dịch này. Đường nghiệp vụ giữ ít nhất khóa chia sẻ trên cùng hàng đến hết giao dịch. Tái dùng khóa đã có trong `permission_store_mutex` hoặc checkpoint tài chính. Đường cần cập nhật `stores`, gồm seed, lấy mức khóa ghi cần thiết tại vị trí khóa hàng quán để tránh nâng khóa muộn. Worker seed nội bộ cũng kiểm active trước khi commit dữ liệu nghiệp vụ. Đọc trạng thái bằng câu SQL mới sau khi lấy khóa, tại điểm kiểm quyền hiện hành sau các lần đợi liên quan và trước khi trả dữ liệu hoặc ghi. Giữ thứ tự khóa riêng của đường tài chính và projection. Không thêm một mutex độc quyền vào cuối chuỗi khóa. Nếu suspend commit trước checkpoint, yêu cầu nhận `STORE_SUSPENDED`. Giao dịch nghiệp vụ đã giữ khóa chia sẻ có thể hoàn tất trước khi suspend lấy được khóa ghi. Với I/O ngoài DB, kiểm quyền trước I/O, nhả khóa DB trước khi gọi mạng và kiểm lại tại bước DB ghi nghiệp vụ. [Khóa hiện có](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-identity.sql#L129) · [Khóa hàng PostgreSQL](https://www.postgresql.org/docs/17/explicit-locking.html#LOCKING-ROWS)

**Đường vận hành.** Chỉ điểm ghi nội bộ với tác nhân đã được xác thực mới đổi trạng thái. Ghi `store_status_changed` cùng giao dịch với trạng thái, gồm quán, trạng thái cũ/mới, thời điểm DB và tham chiếu tác nhân tin cậy. Gửi lại khi đã cùng trạng thái không thêm audit. Giai đoạn 1 kiểm bằng tác nhân nội bộ có quyền trong fixture cô lập, giữ quyền thiết bị và nhân viên ở mức từ chối. Màn nhà cung cấp, quy tắc thu hồi phiên, cache của app và chính sách khôi phục đầy đủ thuộc phần R06-C/T10 còn mở. Ngoại lệ Quên Store Key giữ theo quyết định 34 khi tính năng đó được triển khai. RPC contract/probe toàn cục chỉ trả metadata. Tra operation tạo quán giữ phạm vi chỉ trạng thái theo quyết định 54. Giữ bảng owner, OTP, outbox và audit ngoài quyền trực tiếp của client. [Quyền Data API](https://supabase.com/docs/guides/api/securing-your-api)

### 6. Trạng thái cửa hàng dùng enum, không dùng boolean

`is_active` boolean chỉ diễn đạt được hai trạng thái và không mở rộng được. Đổi sang enum `store_status` gồm `active` và `suspended`.

Chọn enum thay vì giữ boolean vì `add-provider-admin-console` sẽ cần thêm trạng thái, và đổi kiểu cột sau khi đã có dữ liệu thật đắt hơn nhiều so với đổi ngay bây giờ khi dữ liệu cũ đằng nào cũng bị xóa theo quyết định 9.

### 7. Mã xác nhận: tự quản lý trong hàm phía server

Sửa lại ngày 2026-11-05. Bản trước dùng luồng mã của nền tảng. Hướng hiện tại là dự án tự quản lý mã, vì mã cần gắn với đúng một thao tác và đúng thông tin đã nhập, cần giới hạn riêng từng loại thao tác, và luồng mã của nền tảng gắn với đăng nhập, trong khi chủ không còn đăng nhập. Đánh đổi: dự án phải tự lo băm mã, hạn dùng, đếm số lần sai và dọn mã cũ.

Mã do server sinh ngẫu nhiên. Phần xác minh lưu giá trị băm có khóa. Riêng thư chờ cho OTP tạo quán lưu bản mã tạm theo quyết định 52. Khóa băm và khóa giải mã nằm ngoài database. Thư đi qua đường gửi riêng của dự án theo quyết định 15 và 31.

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

Tên và kiểu dưới đây là đề xuất, chốt khi viết migration. Không chuyển đổi quán cũ sang mô hình chủ mới theo quyết định 9. Chuẩn bị và kiểm migration trước; chỉ áp lược đồ bắt buộc có chủ trên staging sau bước chuyển đổi ở [Migration Plan](#migration-plan).

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
| `otp_attempts` | Lưu kết quả lần nhập hoặc liên kết tra trạng thái của lần Xác nhận khác | `attempt_id` (duy nhất), phạm vi, tham chiếu challenge gốc và giá trị băm nếu đã so mã, kết quả. Nhánh chỉ tra tạo quán dùng một loại kết quả riêng với FK `operation_id` có index. Liên kết bất biến, không lưu OTP, PIN hay Store Key. Bảng riêng tư, chỉ server được truy cập |
| `create_intents` | Một bộ thông tin tạo quán đã gửi mã | `intent_id` (duy nhất), email, dấu vân tay của thông tin tạo quán (ghi một lần), trạng thái |
| `create_operations` | Yêu cầu tạo quán đã được chấp nhận | `id`, chủ, intent (duy nhất), `accepted_attempt_id` (duy nhất), trạng thái (`accepted`, `unknown`, `created`, `failed`), mã lý do, thẻ lượt chạy và hạn lượt chạy, bước đang làm, dữ liệu tạm (hash PIN, bí mật mã hóa, số quán), hạn nhận lại Store Key và dấu đóng quyền giao tách khỏi hết hạn OTP. Bảng riêng tư, không cấp quyền cho máy người dùng |
| `private.store_no_reservations` (mở rộng) | Giữ số cho mỗi lần chọn số trong một operation | Mã bản giữ số, `operation_id`, thứ tự chọn số, `store_no`. Cặp operation và thứ tự duy nhất. Số quán duy nhất trên các bản giữ số |
| `auth_create_dispatches` | Giữ độc quyền phát lệnh tạo tài khoản kỹ thuật | Một bản ghi cho mỗi bản giữ số, dấu hiệu server, thẻ lượt chạy nhận quyền phát, trạng thái `claimed`, `created`, `no_effect`, `unknown` và UUID tài khoản Auth đã xác minh. Một UUID đã xác minh chỉ gắn với một bản ghi phát lệnh. Bảng riêng tư, không chứa Store Key |
| `owner_action_proofs` | Xác nhận chính chủ cho đổi email và chuyển quyền | `id`, loại thao tác, quán, tài khoản chủ, phiên nhân viên, hạn, trạng thái (`active`, `used`, `cancelled`, `replaced`). Mỗi quán và mỗi loại có tối đa một bản ghi `active`; tạo bản ghi mới thì bản ghi trước chuyển `replaced` và mã email mới của nó bị hủy |
| `store_key_rotations` | Việc cấp lại Store Key đang làm dở | quán, trạng thái (`pending`, `applied`, `completed`), bí mật mới đã mã hóa, thẻ lượt chạy. Mỗi quán có tối đa một bản ghi `pending`, nhờ ràng buộc duy nhất có điều kiện |
| `mail_dispatches` | Theo dõi việc gửi thư | loại thư, đối tượng, trạng thái (`queued`, `sending`, `submitted`, `rejected`, `failed_before_submit`, `provider_limited`, `unknown`). Thư OTP tạo quán có đúng một bản ghi theo `challenge_id`, cùng hạn gốc và bản mã tạm khi `queued` |
| `store_admin_log` | Nhật ký quản trị | `store_id`, `action`, `actor_owner_account_id`, `detail`, `created_at` |

`action` trong nhật ký gồm: `store_created`, `store_key_regenerated`, `store_status_changed`, `owner_pin_reset`, `owner_email_changed`, `ownership_transferred`, `store_data_reset`. `detail` MUST NOT chứa Store Key, phần bí mật, mã xác nhận hay PIN; kiểm bằng kiểm thử. Bảng gắn với `store_id`, nên nhật ký không mất khi đổi chủ hoặc reset.

Thư đang `sending` mà lượt gửi hết hạn thì coi là `unknown`, không gửi lại và báo người vận hành theo quy tắc của đường gửi thư. Trạng thái gửi thư và kết quả provisioning là hai việc riêng.

## Hợp đồng hàm phía server

Một hàm, nhiều hành động. Gộp vì tất cả dùng chung phần gửi và kiểm mã, giới hạn tần suất và ghi nhật ký. Mọi hành động của chủ nhận quán từ phiên của máy đang gọi (`auth.uid()`), không nhận từ tham số.

| Hành động | Ai gọi được | Việc chính |
| --- | --- | --- |
| `requestCreateStoreOtp` | Ai cũng gọi được | Gửi mã tạo quán. Phản hồi chung một dạng |
| `verifyAndAcceptCreate` | Ai cũng gọi được, phải có mã đúng | Kiểm mã, kiểm thông tin, kiểm hạn mức, ghi yêu cầu, rồi tạo quán |
| `getCreateStatus` | Ai cũng gọi được, cần `attemptId` đúng dạng | Chỉ đọc trạng thái của lần Xác nhận, không nhận OTP/PIN, không trả số quán, Store Key hay dữ liệu chủ |
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
4. Với thao tác của chủ: lấy khóa theo quán rồi lặp lại bước 2 dưới khóa. Khóa theo email, địa chỉ mạng và trần toàn dự án để giữ lượt phát, rồi đọc lại mã định danh dưới khóa. Khóa email để giữ lượt phát có miền khóa riêng với khóa email dùng để giữ suất quán. Trong hai miền này, giao dịch phát mã chỉ lấy khóa giữ lượt phát. Hai yêu cầu cùng mã định danh, khác email: yêu cầu sau bị ràng buộc duy nhất chặn lại và nhận `A_REQUEST_ID_REUSED`.
5. Kiểm thời gian chờ, lượt theo email cùng loại thao tác (trừ mã reset), lượt theo IP và toàn dự án. Với tạo quán, intent đã được chấp nhận cũng không phát mã lại. Thay mã hiện hành của intent dùng cùng khóa intent với xác minh. Nếu cần khóa challenge cũ và intent, lấy khóa challenge trước. Không đủ điều kiện thì ghi kết quả "bị chặn", không tạo mã, không tính lượt.
6. Đủ điều kiện thì tạo mã, ghi kết quả và bản ghi thư trong cùng giao dịch. Với OTP tạo quán, lưu bản mã vào thư `queued` và để tác vụ gửi nhận việc sau commit. Mỗi bản ghi chỉ được cấp quyền gửi một lần. Thư lỗi không làm mất lượt đã tính.

Riêng tạo quán, đây chỉ là cổng phát OTP. Khóa và cập nhật giới hạn email, IP, dự án trong cùng giao dịch khi chấp nhận phát, kể cả với nhiều yêu cầu đồng thời. Lấy IP từ dữ liệu đã được gateway xác thực, bỏ qua giá trị người gọi tự khai. Mọi yêu cầu đã chạm giới hạn có phản hồi chung và không phát mã, kể cả khi đổi intent, đổi tab hoặc dùng `requestId` mới. Thư OTP đã được chấp nhận phát tính một lượt dù provider báo lỗi. Đường hỏi trạng thái và xác minh không phát OTP.

### Nhận thư OTP tạo quán đang chờ

- **Ghi trước khi gửi.** Cùng giao dịch ghi biên nhận, hash xác minh và lượt phát, tạo đúng một thư `queued` theo challenge. OTP trong thư chờ dùng mã hóa xác thực với khóa riêng của server, tách khóa băm OTP và khóa Store Key. Gắn bản mã với challenge và địa chỉ nhận đã ghi để phát hiện dùng nhầm nội dung. Quyền đọc bản mã chỉ dành cho tác vụ gửi phía server. API, nhật ký và hàng đợi phía client không chứa OTP thô.
- **Nhặt lại sau khi tiến trình dừng.** Tác vụ gửi tìm thư OTP `queued` đã commit, kể cả khi tín hiệu kích hoạt ban đầu bị mất. Khi cần cả hai khóa, luôn khóa challenge trước bản ghi thư. Dưới khóa, kiểm lại trạng thái `queued` và hiệu lực của mã theo giờ DB rồi chuyển sang `sending`, giao bản mã cho đúng tiến trình nhận việc và xóa nó khỏi bản ghi cùng giao dịch. Nếu hết hạn hoặc challenge đã dùng, bị hủy hay bị thay, đóng thư với lý do nội bộ và xóa bản mã. Lần gọi lại API chỉ trả biên nhận, không nhận việc gửi.
- **Kiểm lần cuối trước SMTP.** Ngay trước khi gửi, kiểm lại challenge và bản ghi thư theo cùng thứ tự khóa. Dùng giờ DB để kiểm challenge còn hiệu lực và quyền nhận gửi đúng tiến trình, chưa hết hạn. Chỉ ghi một lần cho phép bắt đầu gửi. Nếu quyền vẫn hợp lệ nhưng mã đã hết hạn, dùng, hủy hoặc bị thay, ghi `failed_before_submit`. Tiến trình đã mất quyền dừng và để trạng thái `unknown` do tác vụ dọn xác định. Chỉ tiến trình nhận được xác nhận cho phép mới bắt đầu SMTP sau khi giao dịch đã commit và nhả khóa, trong thời hạn đã kiểm. Thư đã chuyển sang SMTP có thể đến sau khi mã mất hiệu lực. Lần xác minh vẫn dùng trạng thái và hạn gốc của mã.
- **Lưu kết quả gửi.** Phản hồi SMTP xác nhận tiếp nhận cho phép ghi `submitted`. Tiến trình dừng hoặc mất phản hồi sau khi nhận việc thì chuyển `unknown` khi hết hạn xử lý, kể cả nếu có thể đã dừng trước khi gọi SMTP. `sending` và `unknown` không quay về `queued`. Người dùng nhận biên nhận `202` chung. Hạn mã, thời gian chờ xin mã mới và lượt phát vẫn tính từ lần phát gốc.
- **Dọn nội dung nhạy cảm.** Bản mã còn chờ sau khi mã hết hạn không được giải mã để gửi. Tác vụ dọn loại bỏ bản mã của thư đã hết hiệu lực kể cả khi không có lượt gửi. Chỉ giữ metadata thư để đếm và đối soát theo thời gian lưu bên dưới.

### Thứ tự khi kiểm mã

Áp dụng cho mọi loại thao tác. Tất cả nằm trong một giao dịch. Với OTP tạo quán, đọc `clock_timestamp()` sau khi đã lấy khóa liên quan, bằng bước đọc riêng sau lệnh lấy khóa. Dùng mốc đọc đó cho các điều kiện thời gian của cùng quyết định dưới khóa. Nếu nhánh chấp nhận phải đợi thêm khóa hạn mức, đọc lại giờ DB sau khóa đó và kiểm lại hạn OTP trước khi quyết định giữ suất hoặc trả lỗi hạn mức. So với `expires_at` của lần phát gốc. `db_now >= expires_at` là hết hạn. Quy tắc này dùng cho lần xác minh mới và cho quyết định có tính thêm lần sai khi dùng lại ID. Kết quả đã lưu được đọc theo nhánh gửi lại bên dưới. [Đồng hồ PostgreSQL](https://www.postgresql.org/docs/16/functions-datetime.html)

1. Kiểm dạng dữ liệu. Với thao tác của chủ: kiểm phiên bình thường còn hiệu lực (`permission_current_employee`, mục đích `normal`), hết thì trả `EMPLOYEE_SESSION_REQUIRED`, còn đang ở bước buộc đổi PIN thì trả `PIN_CHANGE_REQUIRED`; kiểm đúng vai trò `owner`, sai thì trả `OWNER_ROLE_REQUIRED`; với quên PIN: kiểm máy đã ghép; quán đang tạm ngưng thì trả `STORE_SUSPENDED`. Người không đủ điều kiện không thể làm hết lần thử của chủ. Vì bước này đứng trước việc tra kết quả cũ, gửi lại sau chuyển quyền hoặc reset nhận `EMPLOYEE_SESSION_REQUIRED`: chính thao tác đã hủy phiên, mã đã dùng nên không chạy lần hai.
2. Giữ chỗ mã định danh lần nhập (`attempt_id`). Riêng tạo quán, đọc ràng buộc đã ghi của ID từ `otp_attempts` và `create_operations.accepted_attempt_id` ngay dưới khóa ID. Các đường ghi kết quả, chấp nhận operation và ghi liên kết chỉ tra đều dùng khóa này và đọc lại ràng buộc trước khi ghi. Nếu ID đã có ràng buộc, chỉ chọn challenge gốc nếu có và intent gốc làm đích khóa, theo thứ tự challenge rồi intent. Quy tắc này áp dụng cả khi phạm vi khớp và intent đã được phát mã khác. ID chưa ràng buộc chọn challenge hiện hành và intent của yêu cầu. Đọc lại challenge hiện hành dưới khóa intent. Nếu tham chiếu đã đổi khi ID mới đang đợi khóa, thử lại giao dịch theo cùng thứ tự khóa trước khi ghi hiệu ứng. Với thao tác khác, lấy khóa theo quán, khóa mã và đối tượng rồi đọc lại bản ghi lần nhập. Lặp lại việc kiểm ở bước 1 dưới khóa, vì thao tác trước có thể vừa đổi chủ, hủy phiên hoặc hủy mã. Không đạt thì trả lỗi và không lưu kết quả cho lần nhập này, để lần gửi sau kiểm lại từ đầu.
3. Riêng tạo quán: xử lý ID lệch phạm vi và kết quả từ chối đã lưu ở bước 4 trước khi xét operation. Nếu ID là `accepted_attempt_id` đúng phạm vi, đọc trạng thái operation và chỉ kiểm bằng chứng nhận lại Store Key khi cửa sổ còn mở. Nếu ID đã có liên kết chỉ tra đúng phạm vi, đọc trạng thái hiện tại qua liên kết. Nếu ID chưa ghi nhận và phạm vi khớp một operation đã có, dùng nhánh ghi liên kết tra trạng thái bên dưới. Hai nhánh chỉ tra bỏ qua so OTP/PIN và giữ nguyên các bộ đếm.
4. Các lần nhập còn lại đã có kết quả: cùng loại thao tác, đối tượng và mã (nếu lần trước đã so mã) thì trả lại kết quả cũ, kể cả sau khi mã hết hạn hoặc bị khóa. Với tạo quán, nếu ID đã gắn với một lần đã so mã mà lời gọi đổi mã hoặc đổi phạm vi đã ràng buộc, trả `A_ATTEMPT_ID_REUSED`. Chỉ tính một lần sai cho challenge gốc đã gắn với lần nhập đó nếu challenge vẫn là bản ghi hiện hành, còn hiệu lực và intent gốc chưa có operation được chấp nhận. Xét điều kiện dưới khóa challenge gốc và intent gốc theo giờ DB. Đọc tham chiếu challenge hiện hành qua intent đã khóa. Khi mã đã được thay, từ chối yêu cầu sai ràng buộc và giữ nguyên cả hai bộ đếm. Giữ nguyên kết quả và ràng buộc đã lưu của ID. Nếu ID chưa có kết quả so mã, việc dùng sai phạm vi vẫn bị từ chối mà không tính sai. Kết quả lưu của tạo quán chỉ có trạng thái và tham chiếu nội bộ. Với thao tác khác, dùng lại ID với mã khác vẫn trả `A_ATTEMPT_ID_REUSED` và tăng đếm của mã gốc nếu mã còn hiệu lực.
5. Mã hết hạn, đã hủy, đã dùng hoặc không tồn tại thì trả lỗi tương ứng và không đếm. Mã tạo quán còn trong hạn nhưng đã bị vô hiệu do đủ số sai trả `A_OTP_ATTEMPTS_EXCEEDED`. Các trường hợp sau cũng coi như không tồn tại: quán trong mã khác quán của máy gọi; mã gửi về email đã đăng ký mà email trong mã khác email chủ hiện tại; mã gửi tới email mới mà xác nhận chính chủ của nó đã dùng, đã hủy hoặc đã bị thay, hoặc tài khoản của xác nhận đó không còn là chủ quán này. Việc này kiểm ở lúc nhập mã, nên mã được phát đồng thời với lúc xác nhận bị hủy cũng không dùng được. Mã tạo quán gắn với intent, không so với chủ nào.
6. **So mã trước.** Sai thì trả `A_OTP_INVALID` và tính một lần sai. Lần thứ năm vô hiệu mã. Lúc này chưa so PIN, nên phản hồi giống hệt dù PIN đúng hay sai.
7. Mã đúng mới so thông tin đi kèm. Khác lúc gửi mã thì trả lỗi tương ứng và tính một lần sai. Với tạo quán, lỗi là `CREATE_INTENT_CONFLICT`. Giao dịch không đánh dấu đã dùng và vô hiệu mã nếu số đếm vừa đạt 5.
8. Kiểm điều kiện riêng của thao tác (hạn mức khi tạo quán hoặc nhận quyền, email mới chưa thuộc ai khi đổi email). Không đạt thì dừng, không dùng mã và không tăng đếm sai.
9. Dùng mã và ghi nhận thao tác. Lưu lại kết quả. Giao dịch lỗi thì trả một lỗi tạm thời chung, không phụ thuộc mã đúng hay sai.

Với tạo quán, ba nhánh tính sai dùng cùng một bộ đếm trên challenge. Lần sai thứ năm ghi số đếm 5, vô hiệu mã và ghi kết quả của lần nhập mới trong cùng giao dịch. Nếu lần thứ năm là dùng sai ID đã gắn, giữ kết quả gốc của ID. Trả lỗi của nhánh gây lần sai sau khi ghi thành công. Dưới khóa, lần xác minh mới tiếp theo nhận `A_OTP_ATTEMPTS_EXCEEDED` khi vẫn trong hạn. Từ mốc hết hạn, lần mới nhận `A_OTP_EXPIRED`. Đổi ID, tab, IP hoặc sang ngày mới không đặt lại số sai. Một lần xác minh đúng mã và đúng thông tin khi đã có bốn lỗi vẫn được xét hạn mức nếu OTP còn hạn.

**Điểm chặn tạo quán.** Sau khi kiểm đúng mã của intent và đúng thông tin, lấy khóa giữ suất quán theo email chuẩn hóa kể cả khi chủ chưa có bản ghi. Trong hai miền khóa theo email, giao dịch xác minh chỉ lấy khóa giữ suất quán. Sau khi lấy khóa, kiểm lại hạn OTP bằng giờ DB như trên. Nếu còn hạn, dùng một câu SQL với cùng snapshot để đếm tổng quán active/suspended và operation accepted/unknown, kể cả `accepted` đã quá hạn xử lý. Hai truy vấn rời ở READ COMMITTED có thể nhìn lệch lúc worker chuyển suất đang giữ thành quán. Khi đủ 5, trả `OWNER_STORE_LIMIT_REACHED` và giữ mã chưa dùng. Khi còn chỗ, một giao dịch dùng mã, giữ một chỗ, ghi duy nhất một operation theo intent và liên kết `attemptId` đã chấp nhận. Chuyển sang `created` và ghi quán trong cùng giao dịch để không đếm hai lần. Worker nội bộ chỉ xử lý operation hợp lệ có giữ chỗ và chỉ được cấp quyền gọi Auth admin, giữ số và bootstrap từ phía server. Không có bước tạo Auth hay giữ số ở API gửi mã, API tra trạng thái hoặc trên trình duyệt. Lần gửi lại của cùng operation chỉ đọc hoặc nhận lại kết quả, không tự khởi chạy worker khác. Bộ đếm nhập sai gắn với mã; đổi attempt ID, tab hay IP không đặt lại bộ đếm đó.

Thứ tự khóa để tránh kẹt lẫn nhau: mã định danh lần nhập, quán (`private.permission_store_mutex`, trong `supabase/candidate/permission-identity.sql`), mã xác nhận, intent, các tài khoản chủ theo thứ tự `id`, yêu cầu tạo quán. Hai thao tác cùng lúc trên một quán chạy lần lượt; thao tác sau lặp lại việc kiểm dưới khóa: nếu thao tác trước đã hủy phiên của người gọi (chuyển quyền, reset) thì trả `EMPLOYEE_SESSION_REQUIRED`; nếu phiên còn mà mã đã bị hủy (đổi email) thì trả `A_OTP_UNAVAILABLE`. Mọi thời gian đều theo đồng hồ database; đồng hồ máy người dùng chỉ để hiển thị đếm ngược.

### Sau khi mã đúng

- **Quên PIN:** trong một giao dịch: ghi PIN mới; xóa cờ buộc đổi PIN nếu có, vì PIN này do chính chủ đặt qua mã email; hủy các phiên của tài khoản chủ; ghi nhật ký.
- **Đổi email:** trong một giao dịch, dưới khóa quán đang gọi và khóa tài khoản chủ: đổi email; hủy các mã và xác nhận chính chủ còn dở của chủ này ở mọi quán; đóng quyền giao và nhận lại Store Key của các operation liên quan, kể cả khi OTP đã hết hạn; ghi nhật ký và thư báo `queued`. Thư gửi sau giao dịch; dừng giữa chừng thì tiến trình đối soát gửi tiếp. Thao tác này ảnh hưởng mọi quán của chủ nhưng chỉ giữ khóa của một quán; nếu đụng khóa với thao tác ở quán khác, database hủy một bên và người dùng thử lại. Email mới thuộc một bản ghi chủ không còn quán nào và không có yêu cầu tạo quán đang chạy thì không bị chặn: giao dịch giải phóng email của bản ghi đó, nhật ký cũ vẫn giữ.
- **Chuyển quyền:** trong một giao dịch: kiểm lại tài khoản được chọn còn hợp lệ, không thì trả `TRANSFER_EMPLOYEE_INVALID` và chưa dùng mã; hủy mã và xác nhận còn dở của quán; đóng quyền giao và nhận lại Store Key của operation liên quan, kể cả khi OTP đã hết hạn; tạo bản ghi chủ nếu email mới chưa có; đổi `owner_account_id`; đổi A thành `cashier` rồi đổi B thành `owner`, đúng thứ tự này vì có ràng buộc mỗi quán một `owner` (`employees_one_owner`, trong `supabase/candidate/permission-identity.sql`); cùng lúc đặt cờ buộc đổi PIN `pin_change_required` cho B; bỏ các quyền riêng của cả hai; hủy phiên của A và B; tăng `permission_revision`; ghi nhật ký và hai thư báo `queued`. A đang ở phiên bình thường nên không mang cờ buộc đổi PIN, vì vậy không vướng ràng buộc `employees_pin_change_owner`. Tài khoản mẫu có PIN công khai nhận biết theo định danh cố định của dữ liệu mẫu (`demo.employee.demo-emp-cashier`, trong `supabase/candidate/permission-seed.sql`), kể cả khi PIN của nó đã đổi.
- **Reset:** trong một giao dịch: hủy phiên của mọi nhân viên, gồm cả người đang thao tác; hủy mã và xác nhận còn dở của quán; đưa dữ liệu về rỗng; đóng luồng dữ liệu mẫu của quán (`private.initial_seed_workflows`, trong `supabase/candidate/permission-identity.sql`) để POS không nhắc thử lại và không tự chạy, kể cả khi lúc đó dữ liệu mẫu chưa chạy hoặc vừa lỗi; đồng bộ `seed_status`; tăng tín hiệu thay đổi của quán (`store_change_signals`) để các máy tải lại; ghi danh sách ảnh cần xóa và nhật ký. Ảnh trong kho ảnh xóa sau giao dịch theo danh sách đó; lỗi thì tiến trình đối soát thử lại. Hủy phiên trước để nhân viên không ghi thêm được. Hàm thanh toán hiện không giữ khóa theo quán (`supabase/candidate/permission-financial.sql`), nên khi triển khai phải chặn giao dịch đến muộn, ví dụ cho hàm đó giữ khóa quán.
- **Cấp lại Store Key:** đổi mật khẩu Auth và ghi database không gói chung được, nên làm từng bước: (1) trong một giao dịch: dùng mã, ghi `store_key_rotations` ở `pending` kèm bí mật mới đã mã hóa, lấy thẻ lượt chạy, đóng quyền giao và nhận lại Store Key của operation liên quan, kể cả khi OTP đã hết hạn; (2) đặt mật khẩu mới bằng API quản trị, làm lại nhiều lần vẫn cho cùng kết quả, vì luôn dùng cùng một bí mật; (3) trong một giao dịch: chuyển `applied`, thay bí mật trên `stores`, xóa bí mật khỏi bản ghi cấp lại, ghi nhật ký, thư `queued`; (4) thu hồi phiên của tài khoản kỹ thuật, làm lại nhiều lần vẫn cho cùng kết quả, rồi chuyển `completed`; hiển thị key mới, gửi thư. Dừng giữa chừng thì tiến trình đối soát làm tiếp: `pending` từ bước 2 với cùng bí mật, `applied` từ bước 4; thư đã `queued` vẫn được gửi. Đối soát một bản ghi `applied` bị kẹt có thể đăng xuất cả máy vừa ghép bằng key mới; việc này an toàn, máy đó chỉ cần đăng nhập lại bằng key mới. Trong lúc `pending`: yêu cầu cấp lại khác trả `unknown`, không tạo bản ghi mới và không dùng mã; đổi email, chuyển quyền và reset trả `CREATE_VERIFY_UNAVAILABLE`, chưa dùng mã; thư quên Store Key bỏ quán này ra, vì key trên `stores` có thể đã hết tác dụng và thư cấp lại sẽ tới sau. Từ `applied` trở đi các thao tác này không bị chặn nữa, vì key mới đã dùng được. Auth lỗi lặp lại: sau 6 lần đối soát liên tiếp không thành, hệ thống báo người vận hành và giữ nguyên trạng thái, vì ở `pending` chưa biết Auth đang giữ mật khẩu nào; các thao tác trên vẫn bị chặn tới khi người vận hành chạy lại. Token đang dùng của các máy còn hiệu lực tới khi hết hạn, mặc định 1 giờ theo tài liệu Supabase, hoặc tới khi người dùng đăng xuất (quyết định 42). Điều này chỉ đúng nếu bước thu hồi phiên chặn được việc làm mới token; tài liệu Supabase mô tả đăng xuất bằng JWT của chính phiên đó, còn tiến trình đối soát không có JWT, nên phải đối chiếu khi triển khai (`tasks.md` mục 12.10).

### Thời gian lưu

Bản ghi gửi lại (`otp_request_outcomes`, `otp_attempts`) giữ ít nhất 90 phút. Hash xác minh và metadata thư OTP giữ tới hết ngày theo giờ Việt Nam chứa thời điểm phát, cộng 48 giờ, để đếm lượt theo ngày và đối chiếu. Bản mã OTP tạo quán được xóa riêng khi nhận việc hoặc khi mã mất hiệu lực. Intent chưa được chấp nhận giữ 90 phút sau hạn của mã cuối. Yêu cầu tạo quán đã chấp nhận, liên kết tra trạng thái của các lần Xác nhận, nhật ký và bản ghi thư Store Key không xóa trong giai đoạn 1. Tác vụ dọn kết quả gửi lại thông thường bỏ qua các liên kết chỉ tra trong `otp_attempts`. Xác nhận chính chủ hết tác dụng sau 10 phút. Chỉ triển khai dọn bản ghi phía server sau khi xác nhận các thời hạn này.

### Tra trạng thái sau F5 và nhận lại Store Key

- **Trên máy:** giữ form, biên nhận gửi mã, OTP và PIN trong bộ nhớ trang. Ngay trước khi gửi Xác nhận hợp lệ, ghi `attemptId` vào `sessionStorage` của tab. Giá trị duy nhất được lưu là UUID v7 này, sinh với nguồn ngẫu nhiên mật mã. Mỗi tab khóa Xác nhận ngay khi gửi, giữ nguyên ID trong lúc còn chờ hoặc chưa rõ; bấm đúp bị bỏ qua, retry truyền tải khi trang còn mở dùng đúng lần nhập cũ. Sau F5 chỉ gọi `getCreateStatus` nếu có mã tra. Nếu trình duyệt sao chép `sessionStorage` sang tab khác, tab đó có thể tra cùng ID và vẫn chỉ nhận trạng thái. [HTML Standard về Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html) Giữ ID cho đến khi có kết quả cuối rồi người dùng rời kết quả hoặc bắt đầu lần nhập mới. Nếu ghi lỗi, giữ trong bộ nhớ và báo `STORAGE_UNAVAILABLE`.
- **Tra trạng thái:** đầu vào chỉ là `attemptId`. Đọc operation gắn qua `accepted_attempt_id` hoặc liên kết chỉ tra của lần nhập đó (kể cả khi bản ghi gửi lại thông thường đã dọn), trả `accepted`, `unknown`, `created` hoặc `failed`. Khi operation còn lưu `accepted` nhưng đã quá hạn xử lý, trả `unknown` từ phép đọc, không cần tiến trình nền đổi trạng thái. Gửi lại xác minh của operation dùng cùng cách tính. Nếu chưa thấy operation và chưa thể loại trừ request đến muộn, trả `unconfirmed` và cho kiểm tra lại. Chỉ trả `not_accepted` khi có kết quả cuối từ chối lần nhập đó hoặc ID cũ hơn 30 phút và không có operation. Cả tra và xác minh lần đầu phải lấy cùng khóa lần nhập. Sau khi có khóa, dùng câu SQL mới ở READ COMMITTED để đọc kết quả và giờ DB thực. [Snapshot ở mức READ COMMITTED](https://www.postgresql.org/docs/16/transaction-iso.html#XACT-READ-COMMITTED) Phản hồi chỉ chứa enum trạng thái. Không chạy worker, so bí mật, đếm sai, phát thư hoặc đổi quota. UI chờ thao tác kiểm tra lại của người dùng.
- **Trang vẫn mở:** gửi lại xác minh chỉ có thể trả Store Key cho `attemptId` được chấp nhận, đúng intent và đủ bằng chứng trong cửa sổ nhận lại. Với liên kết chỉ tra hoặc cửa sổ đã đóng, chỉ trả trạng thái. `confirmStoreKeySaved` với phạm vi đúng và cửa sổ đã đóng trả `closed`. Khi cửa sổ còn mở, lời gọi xác nhận đã lưu từ ID khác trả `CONFIRM_REJECTED` trước khi so OTP/PIN. Hai nhánh này giữ nguyên cửa sổ và số lần nhận lại sai. Khi cửa sổ còn mở và đúng lần nhập được chấp nhận, kiểm đủ bằng chứng và dùng bộ đếm nhận lại riêng, đóng cửa sổ sau 5 lần sai. Sai OTP hoặc sai thông tin ở nhánh nhận lại chỉ trả trạng thái. Nhánh xác nhận đã lưu trả `CONFIRM_REJECTED`. Kết quả `created` lưu để gửi lại không tự mang key.

### Giao Store Key trong phản hồi Xác nhận gốc

Chỉ nhánh vừa xác minh OTP còn hạn và commit ghi nhận operation mới giữ quyền giao gốc trong bộ nhớ của chính lượt xử lý HTTP đó. Phạm vi gồm operation, intent và `accepted_attempt_id` do server xác định sau commit. Quyền kết thúc khi lời gọi trả kết quả, timeout hoặc mất khả năng trả phản hồi. Không ghi quyền thành token, phản hồi gửi lại hoặc dữ liệu trình duyệt. Cùng `attemptId` ở lời gọi khác đi qua nhánh gửi lại, kể cả khi hai lời gọi chạy đồng thời.

Để quyết định giao key, lời gọi gốc lấy khóa hàng của đúng operation và đọc dấu đóng bằng câu SQL mới ở READ COMMITTED sau khi có khóa. Các thao tác thu hồi lấy cùng khóa khi ghi dấu, trong cùng giao dịch với thao tác thu hồi. Dấu đóng do xác nhận đã lưu, đủ số sai, đổi email, đổi chủ hoặc cấp lại key tách khỏi hạn OTP và chỉ chuyển một chiều. Nếu thu hồi commit trước điểm quyết định dưới khóa thì chỉ trả trạng thái. Nếu điểm quyết định giao thắng khóa trước và giao dịch kiểm đã hoàn tất, phản hồi được phép mang key đã được duyệt. Nhả khóa trước khi gửi HTTP. Thu hồi sau điểm quyết định chỉ chặn các lần giao chưa được duyệt. Chỉ đưa số quán và Store Key gắn với kết quả ghi quán của lần tạo đã được xác nhận commit vào phản hồi còn quyền giao. Không lấy key mới cấp ở lượt khác. Đường gọi lại điểm ghi quán của R02 vẫn chỉ đọc trạng thái. Nếu lời gọi gốc chỉ còn kết quả đọc lại đó, trả trạng thái. Phản hồi có key không được ghi vào bộ nhớ đệm hoặc nhật ký.

Hết hạn OTP đóng cửa sổ nhận lại, kể cả khi quán chưa commit. Việc đó giữ nguyên quyền giao gốc và hạn xử lý của operation. Nếu OTP đã hết hạn nhưng quyền giao gốc vẫn còn, trả `created` kèm key. Bấm "Tôi đã lưu Store Key" khi cửa sổ hết hạn nhận `closed` theo quy tắc hiện hành và vẫn mở màn Ghép thiết bị. Nếu đã trả `accepted` hoặc `unknown`, lời gọi kết thúc. Tiến trình nội bộ có thể còn chạy theo hạn đã cấp, và thư xử lý độc lập sau commit. [Giới hạn lời gọi Edge Functions](https://supabase.com/docs/guides/functions/limits)

### Liên kết tra trạng thái cho lần Xác nhận khác

Gọi A là `accepted_attempt_id` của operation. B là ID của lượt Xác nhận khác gửi lên cùng phạm vi tạo quán. Xác minh B dùng khóa ID rồi khóa challenge và intent theo thứ tự kiểm mã. Phạm vi lấy từ intent đã được ghi, gồm đúng intent ID và email chuẩn hóa lúc gửi mã. Dưới khóa intent, đọc lại operation bằng câu SQL mới ở READ COMMITTED. Nếu B chưa có ràng buộc, còn trong cửa sổ ±30 phút theo giờ DB sau khóa và operation đã có, ghi một liên kết chỉ tra tới operation trong cùng giao dịch trước khi trả trạng thái. Không so OTP/PIN của B và không ghi nội dung form. Nếu chưa thấy operation dưới khóa, xử lý theo luồng xác minh thường. Khi đã ghi liên kết, gửi lại đúng phạm vi dùng cùng liên kết kể cả sau cửa sổ 30 phút.

Mỗi operation giữ tối đa 64 liên kết chỉ tra ngoài A. Đếm các dòng đã ghi theo `operation_id` bằng câu SQL mới sau khi lấy khóa intent ở READ COMMITTED. Giữ khóa đến khi ghi liên kết và commit. Cùng ID chỉ ghi một lần. Nếu hết chỗ, hoặc B chưa ghi có giờ tương lai trên 30 phút tới 2 giờ, trả `CREATE_VERIFY_UNAVAILABLE` và không ghi kết quả cuối. ID chưa ghi quá cũ nhận `A_REQUEST_ID_STALE`. API tra của ID chưa ghi chỉ dùng quy tắc tuổi ID hiện hành. Nếu đã tra `not_accepted` vì ID quá cũ, xác minh đến muộn dùng cùng khóa ID và vẫn từ chối theo tuổi tại thời điểm lấy khóa. Trần 64 áp dụng riêng cho từng operation.

`getCreateStatus(B)` chỉ đọc trạng thái hiện tại qua liên kết, kể cả sau khi dọn các kết quả gửi lại thường. Lỗi từ chối đã ghi là kết quả của chính B. Gửi lại đúng yêu cầu khi bản ghi còn lưu trả lỗi đó, kể cả nếu A đã mở operation. Nếu B từng so mã và lời gọi đổi mã, trả `A_ATTEMPT_ID_REUSED` theo bước 4. Tra B đã bị từ chối trả `not_accepted`, kể cả sau khi dọn bản ghi thường vì lúc đó ID đã quá cửa sổ. Liên kết B không có quyền chạy worker, xác nhận đã lưu Store Key, nhận Store Key hay đọc thông tin quán/chủ. Quyền kiểm bằng chứng nhận lại vẫn gắn với A. [Supabase Data API và quyền truy cập](https://supabase.com/docs/guides/api/securing-your-api)

### Yêu cầu quá cũ

Máy người dùng tạo `request_id` và `attempt_id` dạng UUID v7. Khi Xác nhận tạo quán, lấy thời điểm cho ID từ giờ server trong phản hồi gửi mã cộng thời gian đơn điệu đã trôi qua trên trang. Tra và xác minh lần đầu dùng giờ DB sau khóa lần nhập. Bản ghi gửi lại thông thường giữ ít nhất 90 phút. ID chưa ghi và đã cũ hơn 30 phút bị từ chối `A_REQUEST_ID_STALE` mà không cần ghi dấu, vì lúc tra sẽ nhận `not_accepted` theo tuổi. Ghi giờ server trong lỗi lệch giờ. Chỉ khi trang còn mở và đã nhận kết quả từ chối cuối thì mới tự chỉnh và thử một lần bằng ID mới.

Riêng Xác nhận tạo quán với ID lệch về tương lai: quá 2 giờ là đầu vào ngoài phạm vi của cả xác minh lẫn API tra, trả `A_REQUEST_INVALID`. Trong khoảng trên 30 phút đến 2 giờ, lần Xác nhận đúng dạng gắn với intent đang có mã còn hiệu lực có thể ghi **tối đa một dấu từ chối trên mỗi challenge**, bằng ràng buộc duy nhất và dưới khóa. Dấu chỉ giữ ID, phạm vi lần nhập, lý do `A_REQUEST_ID_STALE` và thời điểm, không so/lưu OTP hoặc PIN. ID khác tranh dấu đã có trả lỗi tạm thời `CREATE_VERIFY_UNAVAILABLE`, không ghi thêm và không chấp nhận tạo quán. Giữ dấu ít nhất 90 phút và đến khi ID cũ hơn DB quá 30 phút, Chỉ dọn khi cả hai điều kiện cùng đúng. Với ID lệch đúng 2 giờ, giữ dấu ở phút 150 và dọn được từ lần quét đầu sau phút 150. Dấu chặn chính ID đó khi thử gắn với intent khác. Chỉ dấu đã ghi mới biểu thị kết quả cuối; API tra không ghi dấu hoặc cấp quyền. Hai ngưỡng ở đây chỉ giới hạn dữ liệu phục vụ xử lý lệch giờ, tách khỏi các bộ đếm OTP, gửi thư và suất quán.

### Tạo quán sau khi mã đúng

Auth, database và email là ba hệ thống tách nhau nên không gói chung một giao dịch được. Hàm làm từng bước và ghi lại đã tới đâu:

1. Khóa yêu cầu, lấy lượt chạy (tăng thẻ lượt chạy), so lại dấu vân tay thông tin.
2. Ghi dữ liệu tạm: tên, địa chỉ, tùy chọn dữ liệu mẫu, hash PIN, bí mật đã mã hóa, số quán.
3. Tạo tài khoản kỹ thuật bằng API quản trị, có dấu hiệu gắn với yêu cầu này.
4. Trong một giao dịch: tạo quán, cấu hình, nhân viên `owner`, liên kết chủ, nhật ký, bản ghi thư `queued` và workflow dữ liệu mẫu; chuyển yêu cầu sang `created`; ghi cửa sổ nhận lại key chỉ nếu OTP gốc còn hạn; xóa dữ liệu tạm. Nếu chọn dữ liệu mẫu thì ghi workflow `pending`. Nếu không chọn thì ghi `skipped` và quán trống sẵn sàng. Quán được ghi cùng lúc chuyển trạng thái nên phép đếm hạn mức không bao giờ thiếu hay thừa.
5. Trả kết quả theo quyền giao trong phản hồi gốc ngay khi xác nhận quán đã commit, không đợi thư hay dữ liệu mẫu. Server kích hoạt seed lần đầu sau commit nếu đã chọn. Tác vụ gửi thư định kỳ độc lập chỉ nhặt bản ghi Store Key `queued` của quán đã commit `created`, kể cả khi lượt tạo đã dừng ngay sau commit. Tác vụ giữ độc quyền gửi bằng chuyển `queued` → `sending` trong giao dịch trước khi gọi đường gửi thư. Bản ghi đã `sending` mà kết quả chưa rõ tuân theo quy tắc thư, không phát lại. Tác vụ gửi thư không chạy provisioning, seed, tra Auth, dọn tài khoản hoặc hoàn suất.

Hạn lượt chạy mặc định là 10 phút kể từ khi ghi nhận operation, tính bằng giờ DB. Sau hạn, lượt cũ mất quyền ghi quán hoặc trả suất. Nếu Auth trả xác nhận rõ ràng email số quán đã bị người khác chiếm, lượt gốc còn hạn có thể bỏ qua và chọn số khác. Ba số liên tiếp bị chiếm và không để lại tác dụng phụ thì thất bại.

**Giữ số phía server.** Điểm vào nội bộ đọc operation đã được chấp nhận, kiểm suất đang giữ và thẻ còn hiệu lực dưới khóa operation. Server cấp số từ sequence hiện có và gắn bản giữ số với operation. Gọi lại cùng lần chọn số đọc đúng bản giữ số đã có. Chỉ lượt gốc còn hạn mới được chuyển sang lần chọn kế tiếp, sau khi lần trước có `no_effect` do xung đột email đã xác nhận. Số cũ không cấp lại. Số quán có thể bị nhảy số. Gỡ quyền gọi cấp số và bootstrap cũ từ trình duyệt theo `tasks.md` mục 3.5.

**Rào phát lệnh Auth.** Trước mỗi lệnh, dưới khóa operation, worker phải chứng minh thẻ lượt chạy còn hiệu lực và ghi `claimed` cho đúng số quán. Chỉ lượt vừa claim được quyền gửi đúng một lệnh, tắt retry tự động của transport. Worker cũ chưa claim bị từ chối ngay khi mất lease. Nếu đã claim rồi mất lease thì claim vẫn giữ nguyên, vì lệnh có thể chưa rời worker hoặc đang đến Auth. Không lấy lại claim, đổi số hoặc phát lệnh tạo thứ hai khi claim cũ còn mơ hồ.

**Liên kết kết quả Auth.** Dấu hiệu trong `app_metadata` liên kết operation và bản phát lệnh. Server đối chiếu dấu hiệu và email kỹ thuật với bản giữ số trước khi lưu UUID Auth vào đúng bản phát lệnh. `created` ở bản phát lệnh chỉ xác nhận tài khoản kỹ thuật. Chỉ phân loại lỗi trùng email thành `no_effect` khi có phản hồi dứt khoát của chính lệnh đã phát và đã xác minh rằng mã lỗi đó không tạo tài khoản. Kiểm mã trùng thực tế của Admin API trên môi trường kiểm thử được giao. Lỗi mạng, timeout hoặc phản hồi không khớp giữ kết quả chưa rõ. Nhả khóa giao dịch trước khi gọi Auth và kiểm lại quyền xử lý khi ghi kết quả.

**Ghi quán trong một giao dịch.** Điểm vào nội bộ nhận `operation_id` và thẻ lượt chạy. Dưới khóa operation, nó đọc dữ liệu đã chấp nhận và bản phát lệnh `created` tương ứng. Chỉ dùng số đã giữ và UUID Auth từ bản ghi đó. Đọc và khóa bản ghi `auth.users` theo UUID trong cùng giao dịch, đối chiếu email kỹ thuật và dấu hiệu trong `raw_app_meta_data` với đúng bản phát lệnh và bản giữ số. Kiểm lại thẻ và thời hạn bằng giờ DB sau khi lấy các khóa, trước khi ghi. Khi UUID không có hoặc dữ liệu không khớp, giữ kết quả chưa rõ và suất. Trình duyệt không cấp UUID, số quán, chủ hay hash PIN cho bước này. Giao dịch ghi một quán với `stores.id` bằng UUID Auth, cấu hình, owner với PIN đã xác minh, audit, thư Store Key `queued` và workflow dữ liệu mẫu `pending` hoặc `skipped`. Ghi `created` và liên kết kết quả cùng giao dịch. Khi nhận lại lời gọi ghi quán sau khi giao dịch đã commit, chỉ đọc trạng thái đã lưu. Nếu giao dịch rollback sau khi Auth thành công, giữ tham chiếu Auth và suất theo REQ-STORE-03. Store Key dùng số quán cuối cùng đã commit. Đường đọc kết quả tuân theo REQ-STORE-04.

**Bằng chứng để hoàn suất.** Lượt gốc còn hạn có thể ghi `failed` và hoàn suất trong một giao dịch khi biết chắc chưa phát lệnh Auth hoặc đã nhận phản hồi cuối xác định không có tác dụng phụ. Khi Auth trả thành công có đúng dấu hiệu server, ghi `created` cho lệnh Auth rồi tiếp tục cùng tài khoản. Nếu đã hoặc có thể đã sinh tài khoản mà chưa ghi được quán, giữ `unknown` và suất. Timeout, mất lease, hoặc một lần tra Auth không thấy tài khoản đều chưa đủ để hoàn suất. Phần ghi quán dở trong giao dịch vẫn rollback như thường.

**Sau đồ án (quyết định 48).** Dùng operation, bước cuối, claim và dấu hiệu Auth đã lưu để thiết kế tiến trình tự đối soát, tiếp tục hoặc dọn tài khoản kỹ thuật dở dang, và cảnh báo. Trước khi tự hoàn suất, tiến trình tương lai phải chứng minh lệnh Auth đã kết thúc và không còn tác dụng phụ, kể cả khi cần xóa rồi xác nhận đúng tài khoản đã vắng mặt. Trong đồ án, lượt có thể giữ trạng thái chưa rõ quá hạn xử lý; phép tra chỉ đọc. Không triển khai tác vụ nền cho các ca này. Thư Store Key cho quán đã `created` vẫn đi theo đường gửi riêng và dùng bản ghi thư duy nhất.

### Dữ liệu mẫu chạy từ server sau commit

Quyết định 50 giao lần chạy đầu cho server. Tái dùng `private.initial_seed_workflows` để lưu yêu cầu và quyền chạy. Điểm vào nội bộ đọc quán từ workflow và kiểm quán đã được tạo, còn hoạt động và có yêu cầu seed. Tác vụ server vẫn nhặt được workflow `pending` nếu tiến trình tạo quán dừng sau commit. Lần chạy đầu độc lập với trang tạo, Store Key và phiên PIN. Chỉ server có quyền bắt đầu. Nhật ký lần chạy tự động nhận diện tác nhân hệ thống.

`employee_admin_audit.actor_type` hiện chỉ nhận `employee` hoặc `operator`, và helper seed nhân viên nhận bản ghi người gọi rồi ghi audit kiểu `employee`. Trước khi hiện thực, chốt cách mở rộng hợp đồng audit cho tác nhân hệ thống hoặc dùng bản ghi audit hệ thống riêng, vẫn liên kết đúng quán và bước seed. Không dùng danh tính của owner hoặc một operator giả để qua ràng buộc cũ. [Ràng buộc audit](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-identity.sql#L47) · [Helper hiện hành](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-seed.sql#L17)

Quyết định 51 đặt việc ghi cả bộ mẫu trong một giao dịch PostgreSQL riêng sau giao dịch tạo quán. Dưới khóa workflow, server kiểm quyền chạy và trạng thái quán. Giao dịch ghi danh mục, món, sơ đồ bàn, nhân viên mẫu và kết quả `completed` cùng lúc. Nếu có lỗi, toàn bộ thay đổi mẫu hoàn tác. Server ghi `needs_retry` sau khi xác nhận kết quả hoàn tác và lượt cũ không còn quyền ghi. Nếu mất phản hồi, server đọc trạng thái đã lưu dưới khóa để phân biệt đã commit với đã hoàn tác. Chỉ một lượt có quyền ghi. Thử lại chạy cả bộ trong giao dịch mới.

POS ghép và đăng nhập được, sau đó đọc trạng thái workflow. `pending` và `in_progress` hiển thị “Đang chuẩn bị dữ liệu mẫu…”. `needs_retry` hiển thị “Chưa thể tạo dữ liệu mẫu.” Chủ đã đăng nhập bằng phiên bình thường thấy **Thử lại** và **Bỏ dữ liệu mẫu và vào quán trống** tại màn lỗi. Với quán mới T06, màn lỗi thay vị trí nút thử lại ở thông báo chung theo R06-A. Khi server xác nhận `completed` hoặc `skipped`, POS tải dữ liệu và mở màn nghiệp vụ. Khi kết nối gián đoạn hoặc trạng thái chưa xác định, POS cho kiểm tra lại trạng thái và vẫn giữ nghiệp vụ đóng.

API đọc cho mọi phiên nhân viên bình thường của chính quán chỉ trả `waiting`, `failed` hoặc `ready`. Các trạng thái này lần lượt tương ứng với đang chờ hoặc đang chạy, cần thử lại, và đã `completed` hoặc `skipped`. Server giữ nội bộ ID workflow và thẻ lượt chạy. [Hàm đọc hiện hành](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-seed.sql#L89) kiểm owner, nên phần hiện thực cần cung cấp trạng thái đọc tối thiểu cho phiên nhân viên hợp lệ và giữ kiểm quyền owner riêng cho hai thao tác trên màn lỗi.

Server kiểm điều kiện mở POS cả ở các điểm vào nghiệp vụ. Việc ghép máy, đăng nhập và xem trạng thái vẫn dùng xác thực thông thường. Khi nhận yêu cầu bỏ mẫu, server kiểm phiên owner bình thường và dùng cùng khóa workflow với tác vụ seed. Chỉ chuyển `needs_retry` sang `skipped` nếu kết quả đã rõ, lượt cũ mất quyền ghi, chưa có bộ mẫu commit và dữ liệu nghiệp vụ của quán còn trống. Thao tác bỏ mẫu chỉ đóng workflow. Nếu commit thành công trước khi yêu cầu bỏ mẫu được xử lý, trả trạng thái `completed` đã lưu để POS mở với bộ mẫu. Nếu kết quả còn chưa rõ, giữ trạng thái hiện tại và chỉ cho kiểm tra lại. Lượt cũ không thể ghi sau khi workflow đóng.

Seed chỉ dành cho quán đã `created`, không xử lý yêu cầu tạo quán `unknown` theo quyết định 48. Seed chậm hoặc lỗi không đổi kết quả tạo, thư Store Key hay hạn mức. Reset hoặc đóng workflow theo quy tắc hiện hành không tự kích hoạt seed lại.

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
| `A_OTP_EXPIRED` | 400 | Đã đến mốc 10 phút | "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới." |
| `A_OTP_ATTEMPTS_EXCEEDED` | 400 | Mã đã bị hủy sau 5 lần sai | "Mã xác minh đã bị hủy sau 5 lần nhập sai. Vui lòng đợi đủ 10 phút từ lúc gửi mã rồi yêu cầu mã mới." |
| `A_OTP_UNAVAILABLE` | 400 | Không có mã phù hợp | "Không thể xác minh mã này. Nếu bạn vừa yêu cầu mã, vui lòng đợi đủ 10 phút từ lần gửi trước rồi yêu cầu mã mới." |
| `A_ATTEMPT_ID_REUSED` | 409 | Lần nhập dùng lại với mã khác | "Yêu cầu xác minh này đã được dùng cho một mã khác. Vui lòng nhập lại mã." |
| `CREATE_INTENT_CONFLICT` | 409 | Mã đúng, thông tin khác lúc gửi mã | "Thông tin tạo quán đã thay đổi so với lúc gửi mã. Kiểm tra lại PIN và thông tin, hoặc bắt đầu yêu cầu mới." |
| `OWNER_STORE_LIMIT_REACHED` | 409 | Đã đủ 5 quán | "Bạn đã có đủ 5 quán. Liên hệ nhà cung cấp nếu cần nới hạn mức." |
| `RECIPIENT_STORE_LIMIT_REACHED` | 409 | Email mới đã đủ 5 quán | "Email này đã đứng tên đủ 5 quán nên chưa nhận thêm được quán này." |
| `CREATE_VERIFY_UNAVAILABLE` | 503 | Chưa xác nhận được kết quả giao dịch | "Chưa xác nhận được kết quả. Vui lòng thử lại." |
| `CONFIRM_REJECTED` | 409 | Xác nhận đã lưu khi cửa sổ còn mở nhưng sai lần Xác nhận, mã hoặc thông tin | "Không xác nhận được. Kiểm tra lại mã và thông tin tạo quán." |
| `INITIAL_SEED_NOT_READY` | 409 | Gọi nghiệp vụ trước khi quán sẵn sàng hoặc thao tác trên lượt seed chưa có kết quả rõ | "Quán đang chờ chuẩn bị dữ liệu. Vui lòng kiểm tra trạng thái." |
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

- **Màn tạo quán:** nhập thông tin, nhập mã, phần kết quả hiển thị Store Key kèm nút sao chép và nút "Tôi đã lưu Store Key". Bấm nút lưu mở Ghép thiết bị với ô trống. Màn tra chưa rõ cho rời về trang đầu hoặc Ghép thiết bị mà vẫn giữ mã tra, và mở lại Tạo quán trong tab thì hiện lượt cũ. Không cần đăng nhập.
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
| Signup công khai của Supabase còn bật trong giai đoạn chuyển tiếp nên có thể chiếm trước email theo số quán | Dấu hiệu server ngăn nhận nhầm; bỏ qua số đã bị chiếm. Tắt signup sau vòng staging đầu tiên và chạy lại hồi quy theo quyết định 45 |
| Thư mặc định của Supabase Auth khi cơ chế chặn bị tắt | Chấp nhận rủi ro; thư không mang quyền chủ. Quyết định 31 |
| Reset xóa dữ liệu không khôi phục được | Bốn bước xác nhận; nhật ký giữ lại; không có bước xuất dữ liệu. Quyết định 29, 30, 43 |
| Thêm một thành phần triển khai mới, tăng bề mặt vận hành | Đặt trong cùng nền tảng backend đang dùng, không thêm nhà cung cấp thứ ba |

## Migration Plan

Chủ dự án xác nhận ngày 11/11/2026 sẽ dùng quán thử tạo mới cho T06, có thể bỏ hai quán fixture cũ `0001` và `0002` vì đồ án chưa vận hành thực tế. Đây là lựa chọn trình tự thiết kế theo quyết định 9; phạm vi và lần chạy xóa dữ liệu phải được xác nhận ở cổng thực thi.

Chuẩn bị migration và kiểm trên lane cô lập đã được phép trước khi thay đổi staging. Phép kiểm phải phân biệt schema cũ có quán với điểm áp lược đồ cuối khi bảng `stores` đã rỗng. Không gán email giả cho quán cũ để vượt ràng buộc `owner_account_id`.

Trình tự thực thi trên staging (quyết định 44):

1. Xác minh đích và phạm vi xóa cụ thể, gồm quán, tài khoản Auth kỹ thuật, phiên và dữ liệu phụ thuộc; xác nhận với chủ dự án ở cổng xóa. Sao lưu đầy đủ database và kho ảnh, sao lưu tách riêng khóa mã hóa nếu đã cấu hình và xác nhận đường phục hồi trước khi tiếp tục.
2. Trong cửa sổ chuyển đổi, chặn ghi từ ứng dụng và luồng tạo quán cũ. Xóa dữ liệu cũ trong phạm vi đã chốt, ghi thời điểm và phạm vi thực tế. Kiểm `stores` đã rỗng; nếu còn quán hoặc không xác nhận được kết quả, dừng ở cổng này để xử lý, không áp migration cuối.
3. Áp migration lược đồ có `owner_account_id NOT NULL`. Kiểm ràng buộc bắt buộc có chủ, đường tạo cũ không ghi được quán và key/phiên cũ không còn truy cập POS của quán đã xóa trước khi mở lại ứng dụng. Không tắt signup công khai ở bước này; quyết định 45 giữ hai vòng staging trước và sau khi tắt.
4. Dựng lại các quán thử theo luồng tạo mới; kiểm OTP, ghép thiết bị, PIN, dữ liệu mẫu và hồi quy vai trò trên fixture mới. Dùng `docs/demo-runbook.md` để chuẩn bị dữ liệu và cập nhật ảnh nếu cần.

Không chạy reset ứng dụng ở giai đoạn 2 thay cho chuyển đổi này. Cả hai việc có phạm vi và cổng kiểm riêng.

## Open Questions

Các quyết định hiện hành xem `proposal.md`, quyết định 32–56. Nếu T05 không chứng minh được ngân sách đường gửi thực, ghi phương án và xin quyết định trước tích hợp phụ thuộc.

Việc thực hiện, không phải câu hỏi:

- Dựng đường gửi email ở mức 1 của quyết định 15: tài khoản Gmail riêng của dự án, App Password, thông tin SMTP đặt trong biến môi trường của hàm phía server.
- Nộp hồ sơ xin tên miền miễn phí để nâng lên mức 3. Không chặn tiến độ.
- Xin xác nhận của chủ dự án trước khi xóa dữ liệu cũ.
- Đối chiếu tài liệu chính thức của Supabase rằng tạo user bằng API quản trị với email đã xác nhận không gửi thư, và `app_metadata` chỉ server ghi được, trước khi tạo tài khoản kỹ thuật thật.
- Chốt cách đưa dữ liệu về rỗng khi reset, gồm dữ liệu chỉ thêm không sửa của sổ thanh toán. Chủ dự án nói có thể bàn thêm.
- Đối chiếu tài liệu Supabase về thu hồi phiên và làm mới token (`tasks.md` mục 12.10).
- Tắt signup đúng thứ tự và chạy lại ma trận FE, Admin API, chặn signup trực tiếp (`tasks.md` mục 1c.5).
- Cài tra trạng thái qua F5 chỉ bằng mã lần Xác nhận (`tasks.md` mục 6.3).
- Trỏ cấu hình ứng dụng, CLI và hàm phía server sang staging (`tasks.md` mục 2.0).
