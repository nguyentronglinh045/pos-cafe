# Use case

Cập nhật 2026-11-05. Mã lỗi khai ở `design.md`. Dữ liệu ví dụ dùng email `owner.a@example.com`. Mã `REQ-…` ở `specs/`.

## UC-OWNER-01 — Chủ yêu cầu mã để tạo quán

- **Tác nhân:** người muốn tạo quán (chủ mới hoặc chủ đã có quán). Ảnh hưởng: hộp thư email đó.
- **Mục tiêu:** nhận mã xác minh cho đúng quán mình đang tạo.
- **Tiền điều kiện:** mở màn tạo quán; không cần đăng nhập.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| email | chuỗi | Có | ASCII, ≤ 254 byte, phần trước @ ≤ 64 byte; bỏ khoảng trắng đầu cuối, đổi sang chữ thường; giữ dấu chấm và +tag | `owner.a@example.com` |
| displayName | chuỗi | Có | 1–120 ký tự sau khi bỏ khoảng trắng đầu cuối | `Quán A` |
| address | chuỗi | Không | 0–500 ký tự sau khi bỏ khoảng trắng đầu cuối | `` |
| seedDemo | boolean | Có | `true`/`false`, mặc định `false` | `false` |
| ownerPin | chuỗi | Có | Đúng 6 chữ số `0-9` | `638251` |
| requestId | UUID v7 | Có (máy sinh) | Mới mỗi lần bấm Gửi mã; giữ khi gửi lại do mất phản hồi | — |
| intentId | UUID v4 | Có (máy sinh) | Mới khi email, tên, địa chỉ, seed hoặc PIN đổi. Đổi riêng requestId khi gửi lại không đổi intent | — |

- **Luồng chính:** 1. Người dùng nhập thông tin, bấm "Gửi mã". 2. Máy giữ form và mã định danh trong bộ nhớ trang rồi gửi. 3. Server kiểm dạng, kiểm giới hạn và ghi nhận phát mã cùng một thư chờ có OTP mã hóa nếu được phép. 4. Server trả `202`. 5. Máy giữ biên nhận trong bộ nhớ, chuyển sang màn nhập mã, khóa nút "Gửi lại" tới `resendNotBefore`. 6. Tác vụ gửi nhận thư chờ còn hiệu lực và chuyển cho nhà cung cấp.
- **Luồng thay thế:** 3a. Email đang trong 600 giây hoặc hết lượt gửi: server không phát mã, vẫn trả `202` cùng dạng. 4a. Mất phản hồi: máy gửi lại cùng `requestId` trong 60 giây, nhận đúng kết quả cũ. 6a. Tiến trình dừng trước khi nhận gửi: tác vụ gửi xử lý thư đang chờ trong hạn gốc. 6b. Kết quả sau khi nhận gửi chưa rõ: server giữ trạng thái chưa rõ sau khi hết hạn xử lý. Máy vẫn dùng biên nhận và mốc hẹn cũ để xin mã mới khi đủ điều kiện.
- **Luồng ngoại lệ:** email sai ⇒ `A_EMAIL_INVALID` "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại."; trường khác sai ⇒ `A_REQUEST_INVALID`; ID cũ chưa từng ghi nhận ⇒ `A_REQUEST_ID_STALE`, máy tự sửa và gửi lại một lần; `requestId` dùng với email/intent khác ⇒ `A_REQUEST_ID_REUSED`; `intentId` đã gắn email khác ⇒ `CREATE_INTENT_ID_REUSED`; lỗi hệ thống trước ghi nhận ⇒ `A_SEND_UNAVAILABLE` "Chưa tiếp nhận được yêu cầu gửi mã. Vui lòng thử lại."
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | `challengeRef`, `emailDisplay`, `resendNotBefore`, `serverNow` |
| Trạng thái hệ thống | Biên nhận, intent và mã khi được phát, một bản ghi thư chờ cho mã đó |
| Thông báo | "Nếu email hợp lệ, mã xác minh sẽ được gửi tới hộp thư. Mã có hiệu lực 10 phút." |
| Tác dụng phụ | Tối đa một thư OTP; tính lượt gửi khi phát |

- **Tiêu chí chấp nhận:** phản hồi không phụ thuộc email đã có quán hay đang bị chặn; không thư thứ hai trong 600 giây; gửi lại cùng `requestId` không tạo thư hay lượt gửi; PIN không ảnh hưởng gì quan sát được.
- **Truy vết:** REQ-OWNER-01, 02, 04, 06, 07.

## UC-OWNER-02 — Chủ nhập mã và tạo quán

- **Tác nhân:** người đã nhận mã. Ảnh hưởng: hạn mức của chủ; hệ thống Auth/DB.
- **Mục tiêu:** tạo đúng quán đã nhập và nhận Store Key.
- **Tiền điều kiện:** có biên nhận của UC-OWNER-01 với cùng intentId; mã còn hiệu lực.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| code | chuỗi | Có | Đúng 6 chữ số `0-9`, giữ số 0 đầu | `012345` |
| createInput | đối tượng | Có | Như UC-OWNER-01, phải trùng lúc gửi mã | — |
| intentId | UUID v4 | Có | Lấy từ biên nhận | — |
| attemptId | UUID v7 | Có (máy sinh) | Mới cho lần nhập mới sau khi lần trước có kết quả cuối. Bỏ qua bấm đúp, giữ ID khi chờ hoặc gửi lại do mất phản hồi | — |

- **Luồng chính:** 1. Người dùng nhập mã, bấm "Xác nhận". Máy ghi mã tra `attemptId` trước khi gửi. 2. Server kiểm mã đúng intent và còn hạn theo giờ DB sau khóa, rồi kiểm thông tin. Sau khi lấy khóa hạn mức theo email, server kiểm lại hạn mã, xét hạn mức, rồi dùng mã, giữ chỗ và ghi yêu cầu trong một giao dịch. 3. Worker nội bộ tạo tài khoản kỹ thuật, quán, nhân viên `owner`. 4. Khi xác nhận commit, lời gọi Xác nhận gốc còn quyền giao trả `created` kèm số quán và Store Key, kể cả khi OTP đã hết hạn trong lúc tạo. 5. Màn kết quả hiển thị Store Key kèm nút sao chép và nút "Tôi đã lưu Store Key". 6. Thư chứa Store Key tới email chủ như một hỗ trợ kèm theo.
- **Luồng thay thế:** 1a. Không ghi được mã tra: báo `STORAGE_UNAVAILABLE` "Chưa lưu được biên nhận trên thiết bị. Tải lại có thể làm mất bước đang thực hiện.", giữ trong bộ nhớ trang và vẫn gửi. 3a. Nếu chọn dữ liệu mẫu, giao dịch ghi thêm việc đang chờ; server tự chạy sau commit kể cả khi người dùng đóng trang hoặc chưa đăng nhập POS. Bước 4 không chờ công việc này. 4a. Tạo quán chưa xong khi kết thúc lời gọi: nếu còn trả được phản hồi thì trả `accepted` hoặc `unknown`. Nếu lượt xử lý vẫn commit trong hạn, thư được gửi độc lập. Xem UC-OWNER-03. 4b. Nếu quyền giao gốc đã đóng hoặc chỉ còn đường đọc lại kết quả ghi quán, trả trạng thái. 5a. Người dùng bấm "Tôi đã lưu Store Key": đóng khoảng nhận lại nếu còn mở rồi mở màn Ghép thiết bị với ô Store Key trống. Nếu đã hết hạn, phản hồi `closed` vẫn cho chuyển màn.
- **Luồng ngoại lệ:** `CREATE_PROOF_REQUIRED` "Cần xác minh email cho lần tạo quán này." khi gọi tạo quán mà không qua bước mã; `A_OTP_FORMAT_INVALID` "Mã xác minh phải gồm đúng 6 chữ số từ 0 đến 9."; `A_OTP_INVALID` "Mã xác minh không đúng. Vui lòng kiểm tra và nhập lại."; `A_OTP_EXPIRED` "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới."; `A_OTP_ATTEMPTS_EXCEEDED` "Mã xác minh đã bị hủy sau 5 lần nhập sai. Vui lòng đợi đủ 10 phút từ lúc gửi mã rồi yêu cầu mã mới."; `A_OTP_UNAVAILABLE`; `CREATE_INTENT_CONFLICT`; `OWNER_STORE_LIMIT_REACHED` "Bạn đã có đủ 5 quán. Liên hệ nhà cung cấp nếu cần nới hạn mức."; `A_ATTEMPT_ID_REUSED`; `A_REQUEST_ID_STALE`; `CREATE_VERIFY_UNAVAILABLE` "Chưa xác nhận được kết quả. Vui lòng thử lại."; trạng thái `failed` "Không tạo được quán. Lượt tạo đã được hoàn lại, bạn có thể tạo lại bằng yêu cầu mới."
- **Mốc hết hạn và lần sai:** Mã hết hạn lúc chờ khóa được trả `A_OTP_EXPIRED`. Lần sai thứ năm vô hiệu mã, kể cả khi mã đúng nhưng thông tin tạo quán bị đổi. Lần thứ năm vẫn báo lỗi tương ứng. Lần xác minh mới tiếp theo báo `A_OTP_ATTEMPTS_EXCEEDED` khi còn trong cửa sổ 10 phút.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | `status`. Lời gọi gốc có quyền giao kèm `storeNo` và `storeKey` khi `created` |
| Trạng thái hệ thống | Mã đã dùng; yêu cầu tạo quán; quán, cấu hình, nhân viên `owner`, liên kết chủ; hạn mức +1 |
| Thông báo | "Đã tạo quán. Hãy sao chép và lưu Store Key để ghép máy POS." |
| Tác dụng phụ | Một thư Store Key; nhật ký "tạo cửa hàng"; server tự chạy seed nếu chọn, tách khỏi kết quả tạo quán |

- **Tiêu chí chấp nhận:** một mã tạo tối đa một quán; mã sai hay thông tin khác đều bị đếm và tối đa 5 lần; không phiên web; PIN POS/Store Key không thay mã; ownerAccountId, storeId, ownerEmployeeId khác nhau; nhân viên `owner` có đúng PIN đã nhập.
- **Truy vết:** REQ-OWNER-01, 02, 03, 04, 05, 06, 07, 16; REQ-STORE-01, 02, 04, 05, 06; REQ-SESSION-01.

## UC-OWNER-03 — Nhận lại kết quả khi mất phản hồi

- **Tác nhân:** người vừa xác nhận mã nhưng không nhận được phản hồi.
- **Mục tiêu:** biết quán đã tạo chưa và lấy được Store Key.
- **Tiền điều kiện:** đã gửi `verifyAndAcceptCreate`.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| attemptId | UUID v7 | Có | Đúng `attemptId` đã gửi, kể cả sau tải lại | — |
| intentId | UUID v4 | Chỉ khi gửi lại từ trang còn mở | Lấy từ biên nhận trong bộ nhớ | — |
| code | chuỗi | Chỉ khi gửi lại từ trang còn mở | 6 chữ số `0-9`, mã đã nhập | `012345` |
| createInput | đối tượng | Chỉ khi gửi lại từ trang còn mở | Như UC-OWNER-01, thông tin ban đầu | — |
- **Luồng chính:** 1. Máy gửi lại cùng `attemptId`. 2. Nếu lần nhập đã bị từ chối, server trả lỗi đã lưu. Nếu là lượt đã chấp nhận hoặc có liên kết chỉ tra, server trả trạng thái hiện tại. 3. Chỉ lượt được chấp nhận với đủ bằng chứng mới nhận Store Key khi `created` và khoảng nhận lại còn mở.
- **Luồng thay thế:** 1a. Đã tải lại trang: chuyển sang UC-OWNER-04, chỉ hỏi trạng thái bằng `attemptId` cũ; nếu đã tạo, hướng người dùng kiểm tra email để tìm Store Key. 3a. Khoảng nhận lại đã đóng: chỉ trạng thái, kể cả khi gửi lại cùng ID của lời gọi gốc. Nếu quán đã tạo, kiểm tra email.
- **Luồng ngoại lệ:** với đúng lần Xác nhận đã được chấp nhận, sai mã hoặc thông tin khi khoảng nhận lại còn mở ⇒ chỉ trạng thái, cộng số lần nhận lại sai; xác nhận đã lưu sai ⇒ `CONFIRM_REJECTED` "Không xác nhận được. Kiểm tra lại mã và thông tin tạo quán."; trạng thái `unknown` "Chưa xác định kết quả tạo quán. Kiểm tra yêu cầu cũ trước khi tạo yêu cầu mới."
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Trạng thái; Store Key chỉ khi đủ bằng chứng và khoảng nhận lại còn mở |
| Trạng thái hệ thống | Có thể thêm liên kết chỉ tra cho ID mới cùng intent. Lượt được chấp nhận có thể đổi số lần nhận lại sai hoặc đóng khoảng nhận lại |
| Thông báo | Như trên |
| Tác dụng phụ | Không thư mới, không quán mới |

- **Tiêu chí chấp nhận:** không ID/biên nhận nào đơn lẻ nhận được Store Key; gửi lại không tạo quán thứ hai; mất mọi bằng chứng ⇒ Store Key đi qua thư khi quán tạo xong. Nếu thư lỗi sau khi khoảng nhận lại đã đóng, luồng này không giao lại Store Key (giới hạn đã biết; đường còn lại là quên Store Key).
- **Truy vết:** REQ-OWNER-04, 06; REQ-STORE-03, 04.

## UC-OWNER-04 — Tải lại trang và tra trạng thái nếu đã Xác nhận

- **Tác nhân:** người đang ở giữa luồng tạo quán.
- **Mục tiêu:** mở form trống và biết tiến độ nếu đã gửi Xác nhận.
- **Tiền điều kiện:** trang tạo quán được tải lại trong cùng tab.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| attemptId | UUID v7 | Chỉ khi đã lưu lúc Xác nhận | Mã tra duy nhất trong tab, không nhận thông tin form | `0192e000-0000-7000-8000-000000000001` |
- **Luồng chính:** 1. Trang bỏ toàn bộ form và biên nhận gửi mã. 2. Nếu có `attemptId`, gọi `getCreateStatus` với đúng mã này. ID đã có liên kết theo dõi operation. ID của lượt đã bị từ chối trả `not_accepted` cho chính lượt đó. 3. Hiển thị trạng thái, cho kiểm tra lại nếu kết quả chưa rõ. 4. Sau khi người dùng rời kết quả cuối, xóa mã tra.
- **Luồng thay thế:** Không có mã tra: hiện form trống. Khi kết quả còn chưa rõ, người dùng có thể kiểm tra lại, về trang đầu hoặc mở Ghép thiết bị. Hai đường rời màn vẫn giữ mã tra. Mở lại Tạo quán trong cùng tab thì quay về màn tra lượt cũ, chưa mở form lượt mới. Sau kết quả cuối có thể bắt đầu lượt mới với giới hạn gửi mã hiện hành.
- **Giới hạn khi mở nhiều tab:** mỗi tab hiển thị kết quả của lượt riêng. Tab đang xem lượt bị từ chối không tự chuyển sang kết quả của tab đã tạo quán.
- **Luồng ngoại lệ:** nếu ID lưu sai dạng, xóa riêng ID hỏng, về form trống; đường API nhận ID sai dạng trả `A_REQUEST_INVALID` "Yêu cầu không hợp lệ. Vui lòng tải lại trang rồi thử lại.". Lỗi tra tạm thời ⇒ `CREATE_VERIFY_UNAVAILABLE` "Chưa xác nhận được kết quả. Vui lòng thử lại.", giữ mã tra. Nếu lúc Xác nhận không ghi được mã tra (UC-OWNER-02) thì sau F5 chỉ có form trống.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Không có nếu chưa Xác nhận. Nếu tra: enum `unconfirmed`, `not_accepted`, `accepted`, `unknown`, `created`, `failed` |
| Trạng thái hệ thống | Chỉ đọc |
| Thông báo | `unconfirmed`/`unknown`: "Chưa xác định kết quả tạo quán. Vui lòng kiểm tra lại."; `accepted`: "Đang tạo quán."; `not_accepted`: "Yêu cầu này chưa tạo quán. Bạn có thể bắt đầu lại."; `created`: "Đã tạo quán. Vui lòng kiểm tra email để tìm Store Key."; `failed`: theo UC-OWNER-02 |
| Tác dụng phụ | Không thư, không lượt gửi, không gửi lại lệnh tạo quán |
- **Tiêu chí chấp nhận:** F5 luôn bỏ form; trước Xác nhận không có gì để tra; sau Xác nhận chỉ dùng mã đã lưu để tra; không trả key, số quán hay dữ liệu chủ; khi chưa rõ không tự gửi yêu cầu khác.
- **Truy vết:** REQ-OWNER-04, 06; REQ-STORE-04.

## UC-OWNER-05 — Chủ đã có quán tạo thêm quán

- **Tác nhân:** chủ đã sở hữu 1–5 quán.
- **Mục tiêu:** tạo quán tiếp theo, hoặc biết đã đủ hạn mức.
- **Tiền điều kiện:** như UC-OWNER-01/02.
- **Đầu vào:** như bảng đầu vào của UC-OWNER-01 và UC-OWNER-02 (cùng kiểu, cùng ràng buộc).
- **Luồng chính:** như UC-OWNER-01/02; quán mới cùng ownerAccountId, storeId/ownerEmployeeId/Store Key mới.
- **Luồng thay thế:** không giới hạn số lần tạo trong ngày; mỗi lần gửi mã cách nhau ít nhất 10 phút.
- **Luồng ngoại lệ:** đủ 5 (gồm quán đang tạo) ⇒ `OWNER_STORE_LIMIT_REACHED` sau khi mã đúng; mã không bị tiêu thụ.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | `created` + storeNo + Store Key; hoặc `OWNER_STORE_LIMIT_REACHED` |
| Trạng thái hệ thống | Quán mới, hạn mức +1; hoặc không đổi (mã không bị dùng) |
| Thông báo | "Bạn đã có đủ 5 quán. Liên hệ nhà cung cấp nếu cần nới hạn mức." khi đủ |
| Tác dụng phụ | Một thư Store Key khi tạo |
- **Tiêu chí chấp nhận:** quán `suspended` vẫn tính; hai lần tạo không bao giờ vượt 5; phản hồi gửi mã không lộ số quán.
- **Truy vết:** REQ-OWNER-01, 05; REQ-ISOLATION-02.

## UC-OWNER-06 — Tra kết quả khi lượt tạo quán dừng giữa chừng

- **Tác nhân:** người đã Xác nhận tạo quán. Tiến trình tạo gốc ghi kết quả nếu còn chạy.
- **Mục tiêu:** biết lượt cũ đã hoàn tất, đã thất bại chắc chắn hay còn chưa rõ, và tránh tạo quán thứ hai.
- **Tiền điều kiện:** server đã chấp nhận yêu cầu tạo quán, nhưng trang chưa nhận kết quả cuối.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| attemptId | UUID v7 | Có | Mã tra đã lưu khi Xác nhận, như UC-OWNER-04 | `0192e000-0000-7000-8000-000000000001` |
- **Luồng chính:** 1. Người dùng kiểm tra lại bằng mã tra. 2. Server đọc operation gốc. 3. Nếu chưa rõ hoặc đã hết hạn xử lý mà vẫn đang `accepted`, trả `unknown` và giữ suất. 4. Lần tra tiếp theo tiếp tục đọc cùng operation.
- **Luồng thay thế:** Nếu lượt gốc còn hạn, có thể trả `accepted`. Nếu lượt gốc đã ghi quán thành công thì trả `created`, thư Store Key đi qua đường gửi bình thường. Nếu lượt gốc xác định chắc chắn thất bại và không có tác dụng phụ thì ghi `failed` và hoàn suất.
- **Luồng ngoại lệ:** lỗi tra tạm thời ⇒ `CREATE_VERIFY_UNAVAILABLE` "Chưa xác nhận được kết quả. Vui lòng thử lại.", giữ mã tra. ID sai dạng ⇒ `A_REQUEST_INVALID` theo UC-OWNER-04. Lượt hết hạn không được ghi kết quả muộn; nếu đã hoặc có thể đã có tài khoản Auth thì giữ `unknown` và suất.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Enum trạng thái `accepted`, `unknown`, `created`, `failed` |
| Trạng thái hệ thống | Tra cứu chỉ đọc. Chỉ lượt gốc có đủ bằng chứng mới ghi kết quả cuối trong phạm vi đồ án |
| Thông báo | Khi chưa rõ: "Chưa xác định kết quả tạo quán. Vui lòng kiểm tra lại." |
| Tác dụng phụ | Không phát thư, chạy lại provisioning hay thay đổi suất khi tra |
- **Tiêu chí chấp nhận:** giữ suất khi chưa rõ, một operation mỗi intent, không tạo thêm tài khoản hay quán do tra hoặc gửi lại, và lưu đủ tham chiếu để đối soát sau đồ án.
- **Truy vết:** REQ-OWNER-05; REQ-STORE-01, 02, 03, 04.

## UC-OWNER-07 — Chờ dữ liệu mẫu và xử lý lỗi

- **Tác nhân:** người đã ghép thiết bị và đăng nhập quán mới. Chủ với phiên bình thường có quyền thử lại hoặc bỏ mẫu.
- **Mục tiêu:** mở POS khi có bộ mẫu hoàn chỉnh hoặc quán trống đã được xác nhận.
- **Tiền điều kiện:** quán `created` và `seedDemo = true`.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Lựa chọn trên màn lỗi | `retry` hoặc `skip` | Khi chủ chọn một thao tác | Phiên owner bình thường và workflow đã xác nhận cần thử lại | `retry` |
- **Luồng chính:** 1. Sau đăng nhập, máy đọc trạng thái từ server. 2. Trong lúc chờ hoặc đang chạy, POS hiện “Đang chuẩn bị dữ liệu mẫu…”. 3. Khi server xác nhận cả bộ mẫu đã commit, máy tải dữ liệu và tự mở POS.
- **Luồng thay thế:** Giao dịch seed hoàn tác toàn bộ sau lỗi. Màn lỗi hiện “Chưa thể tạo dữ liệu mẫu.” Chủ bấm **Thử lại** để server chạy lại cả bộ, hoặc **Bỏ dữ liệu mẫu và vào quán trống**. Với lựa chọn bỏ mẫu, server chỉ mở POS sau khi xác nhận lượt cũ đã kết thúc, không còn quyền ghi và quán còn trống. Nếu lượt đã thành công, máy mở POS với bộ mẫu đã commit.
- **Luồng ngoại lệ:** Seed lỗi tiếp ⇒ `PERMISSION_UPDATE_UNAVAILABLE`, giữ màn lỗi. Gọi nghiệp vụ trước khi quán sẵn sàng hoặc thao tác khi chưa xác định được kết quả ⇒ `INITIAL_SEED_NOT_READY` “Quán đang chờ chuẩn bị dữ liệu. Vui lòng kiểm tra trạng thái.” Thiết bị mất kết nối cho kiểm tra lại trạng thái. Phiên hết hạn ⇒ `EMPLOYEE_SESSION_REQUIRED` “Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại.” Phiên không phải owner gọi thử lại hoặc bỏ mẫu ⇒ `OWNER_ROLE_REQUIRED` “Chỉ tài khoản chủ quán mới thực hiện được thao tác này.”
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Trạng thái seed |
| Trạng thái hệ thống | Workflow `completed` khi cả bộ mẫu commit, hoặc `skipped` khi server xác nhận quán trống |
| Thông báo | Màn chờ hoặc màn lỗi cho đến khi server xác nhận quán sẵn sàng |
| Tác dụng phụ | Một bộ mẫu hoàn chỉnh hoặc quán trống sẵn sàng |
- **Tiêu chí chấp nhận:** Trạng thái sẵn sàng do server xác nhận cho mọi máy. Lỗi seed giữ quán và hạn mức. Hai lựa chọn trên màn lỗi chỉ dành cho chủ và không sinh lượt ghi trùng hay mở quán trên dữ liệu dở dang.
- **Truy vết:** REQ-STORE-06.

## UC-OWNER-08 — Chủ quên Store Key

- **Tác nhân:** chủ quán. Ảnh hưởng: hộp thư của chủ.
- **Mục tiêu:** lấy lại Store Key hiện tại để ghép thêm máy.
- **Tiền điều kiện:** không cần đăng nhập, không cần mã.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| email | chuỗi | Có | Như UC-OWNER-01 | `owner.a@example.com` |

- **Luồng chính:** 1. Chủ bấm "Quên Store Key" ở màn ghép thiết bị hoặc mục Cài đặt. 2. Nhập email, bấm gửi. 3. Hệ thống trả phản hồi chung. 4. Nếu email đứng tên quán, thư chứa danh sách quán và key tới hộp thư.
- **Luồng thay thế:** 4a. Email không đứng tên quán nào: phản hồi giống hệt, không có thư. 4b. Quán đang có lần cấp lại Store Key làm dở: được bỏ khỏi thư; thư cấp lại sẽ tới sau.
- **Luồng ngoại lệ:** email sai dạng ⇒ `A_EMAIL_INVALID` "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại."; quá 3 lần trong một giờ, hoặc hết giới hạn theo địa chỉ mạng và trần toàn dự án: phản hồi vẫn giống hệt, không có thư thêm. Giới hạn theo địa chỉ mạng đếm mọi yêu cầu đúng dạng, trước khi xét giới hạn theo email, kể cả yêu cầu cho email không có quán.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Không có dữ liệu riêng |
| Trạng thái hệ thống | Không đổi; Store Key giữ nguyên |
| Thông báo | "Nếu email này đứng tên quán, thư chứa Store Key đã được gửi." |
| Tác dụng phụ | Một thư; không ghi key vào nhật ký |

- **Tiêu chí chấp nhận:** phản hồi không cho biết email có quán hay không; máy đã ghép không bị ảnh hưởng.
- **Truy vết:** REQ-OWNER-09.

## UC-OWNER-09 — Chủ cấp lại Store Key

- **Tác nhân:** chủ quán đã đăng nhập POS bằng PIN. Ảnh hưởng: mọi máy của quán.
- **Mục tiêu:** làm key cũ hết hiệu lực khi nghi bị lộ.
- **Tiền điều kiện:** tài khoản vai trò `owner` đang đăng nhập; quán không bị tạm ngưng.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Tên quán gõ lại | chuỗi | Có | Trùng tên quán hiện tại sau khi bỏ khoảng trắng đầu cuối | `Quán A` |
| code | chuỗi | Có | 6 chữ số `0-9` | `012345` |
| requestId, attemptId | UUID v7 | Có (máy sinh) | Như UC-OWNER-01, 02 | — |

- **Luồng chính:** 1. Mở Cài đặt, chọn "Cấp lại Store Key". 2. Đọc cảnh báo. 3. Gõ lại tên quán. 4. Bấm gửi mã; mã tới email đã đăng ký. 5. Nhập mã. 6. Hệ thống đổi key, hiển thị key mới kèm nút sao chép. 7. Mọi máy, gồm máy đang thao tác, bị đăng xuất và phải ghép lại; token đang dùng có thể còn tác dụng tới khi hết hạn, mặc định khoảng 1 giờ, hoặc tới khi đăng xuất.
- **Luồng thay thế:** 6a. Mất phản hồi: gửi lại đúng lần nhập mã không sinh key lần hai; key mới có trong thư. Máy đã bị đăng xuất thì không gửi lại được, và key mới vẫn có trong thư. 6b. Dừng giữa chừng: trả trạng thái chưa rõ; tiến trình đối soát làm tiếp. 6c. Đang có lần cấp lại làm dở: chỉ trả trạng thái chưa rõ, không dùng mã.
- **Luồng ngoại lệ:** `EMPLOYEE_SESSION_REQUIRED` "Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại."; `PIN_CHANGE_REQUIRED` "Bạn cần đổi PIN trước khi sử dụng quán."; `STORE_NAME_MISMATCH` "Tên quán chưa đúng. Vui lòng gõ lại đúng tên quán."; `OWNER_ROLE_REQUIRED` "Chỉ tài khoản chủ quán mới thực hiện được thao tác này."; `STORE_SUSPENDED` "Quán đang tạm ngưng nên chưa thực hiện được thao tác này."; các lỗi mã như UC-OWNER-02.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Store Key mới |
| Trạng thái hệ thống | Bí mật mới đã mã hóa; mật khẩu tài khoản kỹ thuật đổi; key cũ không ghép được nữa |
| Thông báo | "Đã cấp lại Store Key. Hãy sao chép và ghép lại các máy." |
| Tác dụng phụ | Thư gửi kèm; nhật ký `store_key_regenerated`, không chứa key |

- **Tiêu chí chấp nhận:** không có mã thì key không đổi; key cũ không ghép được nữa; gửi lại không đổi key lần hai.
- **Truy vết:** REQ-OWNER-04, 07, 08, 10.

## UC-OWNER-10 — Chủ quên PIN

- **Tác nhân:** chủ quán. Ảnh hưởng: phiên của tài khoản chủ trên các máy.
- **Mục tiêu:** đặt PIN mới khi quên PIN.
- **Tiền điều kiện:** máy đã ghép với quán. Máy chưa ghép thì dùng UC-OWNER-08 trước.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| code | chuỗi | Có | 6 chữ số `0-9` | `012345` |
| PIN mới | chuỗi | Có | 6 chữ số `0-9`; nhập hai lần giống nhau | `482913` |
| requestId, attemptId | UUID v7 | Có (máy sinh) | Như UC-OWNER-01, 02 | — |

- **Luồng chính:** 1. Trên màn nhập PIN, chọn tài khoản chủ quán. 2. Bấm "Quên mã PIN". 3. Mã tới email đã đăng ký của quán. 4. Nhập mã và PIN mới. 5. PIN mới có hiệu lực ngay.
- **Luồng thay thế:** 4a. Mất phản hồi: gửi lại đúng lần nhập mã trả lại kết quả cũ; PIN không đổi lần hai.
- **Luồng ngoại lệ:** PIN mới sai dạng ⇒ `A_REQUEST_INVALID`; `STORE_SUSPENDED` "Quán đang tạm ngưng nên chưa thực hiện được thao tác này."; các lỗi mã như UC-OWNER-02. Nhân viên quên PIN: không có lối này, phải nhờ chủ quán hoặc người có quyền `employee.manage` đặt lại trong quản lý nhân viên. Người khác thử đổi PIN chủ ⇒ `OWNER_PROTECTED` "Không thể thay đổi chủ quán bằng thao tác này." (mã có sẵn).
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Xác nhận đã đổi |
| Trạng thái hệ thống | PIN chủ đổi; phiên cũ của tài khoản chủ hết hiệu lực |
| Thông báo | "Đã đặt PIN mới. Vui lòng đăng nhập lại." |
| Tác dụng phụ | Nhật ký `owner_pin_reset`, không chứa PIN |

- **Tiêu chí chấp nhận:** lối này chỉ có ở tài khoản chủ quán; PIN cũ hết hiệu lực; không có đường tự khôi phục cho nhân viên.
- **Truy vết:** REQ-OWNER-04, 07, 11; REQ-SESSION-02.

## UC-OWNER-11 — Chủ đổi email

- **Tác nhân:** chủ quán đã đăng nhập POS bằng PIN. Ảnh hưởng: mọi quán đứng tên email đó.
- **Mục tiêu:** chuyển các quán sang email mới mà không mất đường khôi phục.
- **Tiền điều kiện:** tài khoản vai trò `owner` đang đăng nhập; quán không bị tạm ngưng.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Email đã đăng ký | chuỗi | Có | Như UC-OWNER-01. POS không hiển thị sẵn | `owner.a@example.com` |
| Mã của email đã đăng ký | chuỗi | Có | 6 chữ số `0-9` | `012345` |
| Email mới | chuỗi | Có | Như UC-OWNER-01; khác email đang dùng | `owner.new@example.com` |
| Mã của email mới | chuỗi | Có | 6 chữ số `0-9` | `654321` |
| requestId, attemptId | UUID v7 | Có (máy sinh) | Như UC-OWNER-01, 02 | — |

- **Luồng chính:** 1. Mở Cài đặt, chọn "Đổi email". 2. Nhập email đã đăng ký; mã tới email đó. 3. Nhập mã. 4. Nhập email mới; mã tới email mới. 5. Nhập mã. 6. Hệ thống đổi email; thư báo tới email cũ.
- **Luồng thay thế:** 2a. Email nhập vào không đúng: phản hồi giống hệt, không có thư. 5a. Mất phản hồi: gửi lại đúng lần nhập mã trả lại kết quả cũ, không đổi lần hai.
- **Luồng ngoại lệ:** `EMPLOYEE_SESSION_REQUIRED` "Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại."; `PIN_CHANGE_REQUIRED` "Bạn cần đổi PIN trước khi sử dụng quán."; `OWNER_PROOF_REQUIRED` "Vui lòng xác nhận email đã đăng ký trước khi làm tiếp."; `NEW_EMAIL_UNAVAILABLE` "Email này không dùng được. Vui lòng chọn email khác." khi trùng email đang dùng, hoặc sau khi mã đúng mà email đã đứng tên chủ khác hay đang có yêu cầu tạo quán chưa xong; `OWNER_ROLE_REQUIRED` "Chỉ tài khoản chủ quán mới thực hiện được thao tác này."; `STORE_SUSPENDED` "Quán đang tạm ngưng nên chưa thực hiện được thao tác này."; các lỗi mã như UC-OWNER-02. Gõ sai email mới: không nhận được mã, email của quán không đổi.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Xác nhận đã đổi; không chứa email |
| Trạng thái hệ thống | Email chủ đổi; mã và xác nhận còn dở của email cũ bị hủy |
| Thông báo | "Đã đổi email. Các mã xác nhận từ nay gửi tới email mới." |
| Tác dụng phụ | Thư báo về email cũ; nhật ký `owner_email_changed` |

- **Tiêu chí chấp nhận:** biết PIN nhưng không đọc được email đã đăng ký thì không đổi được; email mới phải nhận được mã mới đổi được; màn này không để lộ email nào đã có quán.
- **Truy vết:** REQ-OWNER-04, 07, 08, 12, 15.

## UC-OWNER-12 — Chủ chuyển quyền sở hữu quán

- **Tác nhân:** chủ hiện tại A đã đăng nhập POS. Ảnh hưởng: A và người nhận B.
- **Mục tiêu:** B thành chủ quán mà quán không phải ngừng bán.
- **Tiền điều kiện:** tài khoản vai trò `owner` đang đăng nhập; A đã tạo sẵn tài khoản POS cho B; quán không bị tạm ngưng.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Email đã đăng ký | chuỗi | Có | Như UC-OWNER-01. POS không hiển thị sẵn | `owner.a@example.com` |
| Mã của email đã đăng ký | chuỗi | Có | 6 chữ số `0-9` | `012345` |
| Tài khoản POS của người nhận | UUID nhân viên | Có | Đang hoạt động, cùng quán, không phải chủ quán, không phải tài khoản mẫu có PIN công khai | — |
| Email mới | chuỗi | Có | Như UC-OWNER-01; khác email đang đăng ký | `owner.b@example.com` |
| Mã của email mới | chuỗi | Có | 6 chữ số `0-9` | `654321` |
| requestId, attemptId | UUID v7 | Có (máy sinh) | Như UC-OWNER-01, 02 | — |

- **Luồng chính:** 1. Mở Cài đặt, vào màn chuyển quyền, đọc cảnh báo, gồm việc email mới phải là email của người nhận và người nhận phải tự đọc mã. 2. Nhập email đã đăng ký; mã tới email đó. 3. Nhập mã. 4. Chọn tài khoản POS của B. 5. Nhập email mới; mã tới email mới. 6. Nhập mã. 7. Database kiểm email mới đang đứng tên bao nhiêu quán. 8. Đổi chủ, đổi vai trò; thư báo tới hai email.
- **Luồng thay thế:** 2a. Email nhập vào không đúng: phản hồi giống hệt, không có thư. 8a. Email mới chưa có tài khoản chủ: tạo khi mã đúng. 8b. Mất phản hồi: phiên của A đã bị hủy nên gửi lại nhận `EMPLOYEE_SESSION_REQUIRED`; A đăng nhập lại và thấy mình là tài khoản thường. 8c. Lần đăng nhập đầu của B: phải đổi PIN (quyết định 32).
- **Luồng ngoại lệ:** quán không có tài khoản nào đủ điều kiện: màn hình báo "Quán chưa có tài khoản nào nhận được quyền chủ. Vui lòng tạo tài khoản POS cho người nhận trước.", không gửi mã; `EMPLOYEE_SESSION_REQUIRED` "Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại."; `PIN_CHANGE_REQUIRED` "Bạn cần đổi PIN trước khi sử dụng quán."; `OWNER_PROOF_REQUIRED` "Vui lòng xác nhận email đã đăng ký trước khi làm tiếp."; `RECIPIENT_STORE_LIMIT_REACHED` "Email này đã đứng tên đủ 5 quán nên chưa nhận thêm được quán này."; `TRANSFER_TARGET_INVALID` "Email mới phải khác email đang đăng ký."; `TRANSFER_EMPLOYEE_INVALID` "Tài khoản này không nhận được quyền chủ. Vui lòng chọn tài khoản khác.", kể cả khi tài khoản bị khóa trước lúc nhập mã; `OWNER_ROLE_REQUIRED`; `STORE_SUSPENDED`; các lỗi mã như UC-OWNER-02. Không nhập mã trong 10 phút: mã hết hạn, quán vẫn thuộc A.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Xác nhận đã chuyển; không chứa email |
| Trạng thái hệ thống | Quán đứng tên email mới; B là `owner`, A là tài khoản thường; mỗi người giữ PIN của mình; Store Key và máy đã ghép không đổi; phiên đang mở của A và B hết hiệu lực |
| Thông báo | "Đã chuyển quyền. Vui lòng đăng nhập lại." |
| Tác dụng phụ | Thư báo tới hai email; nhật ký `ownership_transferred` |

- **Tiêu chí chấp nhận:** chưa xác nhận đủ thì quán không đổi chủ; email mới đủ 5 quán thì dừng; quán luôn có đúng một chủ quán; A vẫn đăng nhập được với quyền thường, cho tới khi B xóa; mã về sau gửi tới email chủ mới.
- **Truy vết:** REQ-OWNER-04, 05, 07, 08, 13, 15; REQ-SESSION-02.

## UC-OWNER-13 — Chủ reset dữ liệu quán

- **Tác nhân:** chủ quán đã đăng nhập POS bằng PIN. Ảnh hưởng: mọi nhân viên và máy của quán.
- **Mục tiêu:** đưa quán về trạng thái rỗng để bắt đầu lại, thường là để bỏ dữ liệu demo rồi tự nhập dữ liệu của quán.
- **Tiền điều kiện:** tài khoản vai trò `owner` đang đăng nhập; quán không bị tạm ngưng.
- **Đầu vào:**

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| Tên quán gõ lại | chuỗi | Có | Trùng tên quán hiện tại sau khi bỏ khoảng trắng đầu cuối | `Quán A` |
| code | chuỗi | Có | 6 chữ số `0-9` | `012345` |
| requestId, attemptId | UUID v7 | Có (máy sinh) | Như UC-OWNER-01, 02 | — |

- **Luồng chính:** 1. Mở Cài đặt, chọn "Reset dữ liệu". 2. Đọc cảnh báo những gì bị xóa. 3. Gõ lại tên quán. 4. Bấm gửi mã; mã tới email đã đăng ký. 5. Nhập mã. 6. Hệ thống đưa dữ liệu về rỗng trong một giao dịch.
- **Luồng thay thế:** 4a. Bấm gửi mã lần nữa: không phải chờ; mã trước bị hủy. 6a. Mất phản hồi: phiên đã hết hiệu lực nên gửi lại nhận `EMPLOYEE_SESSION_REQUIRED`, không reset lần hai; đăng nhập lại thấy dữ liệu đã reset. 6b. Muốn reset lần nữa: làm lại từ bước 1; không có giới hạn riêng về số lần, giới hạn chung vẫn áp dụng.
- **Luồng ngoại lệ:** `EMPLOYEE_SESSION_REQUIRED` "Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại."; `PIN_CHANGE_REQUIRED` "Bạn cần đổi PIN trước khi sử dụng quán."; `STORE_NAME_MISMATCH`; `OWNER_ROLE_REQUIRED`; `STORE_SUSPENDED` "Quán đang tạm ngưng nên chưa thực hiện được thao tác này."; các lỗi mã như UC-OWNER-02, nhưng câu thông báo không bảo chờ 10 phút (`design.md`). Giao dịch lỗi ⇒ `CREATE_VERIFY_UNAVAILABLE`, dữ liệu giữ nguyên.
- **Đầu ra:**

| Đầu ra | Nội dung |
| --- | --- |
| Dữ liệu trả về | Xác nhận đã reset |
| Trạng thái hệ thống | Đơn, thanh toán, hóa đơn, báo cáo, thực đơn, khu và bàn, nhân viên khác đã xóa; cấu hình khác về mặc định. Giữ tên, địa chỉ, Store Key, máy đã ghép, tài khoản chủ và PIN, nhật ký quản trị |
| Thông báo | "Đã reset dữ liệu quán. Vui lòng đăng nhập lại." |
| Tác dụng phụ | Phiên của mọi nhân viên, gồm cả người đang thao tác, hết hiệu lực; nhật ký `store_data_reset` |

- **Tiêu chí chấp nhận:** không có mã thì không xóa gì; sau reset còn đúng một nhân viên là chủ quán; nhật ký còn nguyên; reset được nhiều lần, không có thời gian chờ, trong giới hạn chung; không tự tạo lại dữ liệu mẫu.
- **Truy vết:** REQ-OWNER-04, 07, 08, 14, 15.
