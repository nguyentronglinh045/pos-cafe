# Tài khoản chủ cửa hàng

Cập nhật 2026-11-05. Chủ quán được nhận diện bằng email thật. Không có mật khẩu và không có đăng nhập web riêng cho chủ: chủ vào POS bằng PIN như mọi nhân viên, còn các thao tác quan trọng phải xác nhận thêm bằng mã gửi về email. Mã `REQ-…` dùng để đối chiếu trong `traceability.md`.

## ADDED Requirements

### Requirement: REQ-OWNER-01 — Xác minh email riêng cho mỗi lần tạo quán

Mỗi lần tạo quán, kể cả quán thứ hai trở đi của cùng một chủ, hệ thống SHALL yêu cầu xác minh email bằng mã gửi riêng cho đúng lần tạo đó. Bước xác minh chỉ cho phép tạo đúng quán với đúng thông tin đã nhập; nó MUST NOT mở phiên đăng nhập web, MUST NOT phát token hay cookie. PIN POS, Store Key và việc email đã từng được xác minh trước đây MUST NOT thay cho mã của lần này.

#### Scenario: Quán thứ hai vẫn cần mã mới

- **WHEN** chủ đã có một quán bắt đầu tạo quán thứ hai
- **THEN** hệ thống gửi mã mới cho lần tạo này và không chấp nhận PIN POS hay Store Key của quán cũ thay cho mã

### Requirement: REQ-OWNER-02 — Gửi mã tạo quán

Hệ thống SHALL nhận yêu cầu gửi mã gồm email, thông tin tạo quán và hai mã định danh do máy người dùng sinh ra. Email SHALL là ký tự ASCII, tối đa 254 byte, phần trước dấu @ tối đa 64 byte; được bỏ khoảng trắng đầu cuối và đổi về chữ thường, nhưng giữ nguyên dấu chấm và phần `+tag`. Tên quán SHALL dài 1–120 ký tự sau khi bỏ khoảng trắng đầu cuối, địa chỉ 0–500 ký tự, tùy chọn dữ liệu mẫu là có hoặc không, PIN chủ đúng 6 chữ số.

Khi email đã đủ điều kiện gửi, chưa đủ điều kiện gửi (đang chờ hết 10 phút hoặc đã hết lượt), hay yêu cầu tạo quán đã được chấp nhận, phản hồi SHALL giống hệt nhau về dạng, để người ngoài không dò được email nào đã có quán. Các lỗi về mã định danh (`A_REQUEST_ID_STALE`, `A_REQUEST_ID_REUSED`, `CREATE_INTENT_ID_REUSED`) và lỗi hệ thống (`A_SEND_UNAVAILABLE`) chỉ phụ thuộc mã định danh hoặc tình trạng hệ thống, không phụ thuộc PIN hay việc email đã có quán hay chưa.

Với mã tạo quán, server SHALL ghi một thư chờ có OTP mã hóa cùng giao dịch phát mã (quyết định 52). Tác vụ gửi SHALL có thể tiếp tục với thư chưa được nhận gửi nếu tiến trình ban đầu dừng, với cùng OTP và hạn gốc. Ngay trước khi cho phép bắt đầu SMTP, server SHALL kiểm lại quyền gửi và hiệu lực của mã. Mỗi bản ghi thư được nhận gửi tối đa một lần. Khi đã nhận gửi mà chưa rõ kết quả, tác vụ MUST NOT tự gửi lại. Phản hồi yêu cầu mã vẫn dùng dạng chung và thời gian chờ tính từ lần phát gốc.

#### Scenario: Bấm gửi lại trong 10 phút

- **WHEN** người dùng yêu cầu mã tạo quán lần nữa cho cùng email trước khi hết 10 phút kể từ lần phát
- **THEN** hệ thống trả phản hồi cùng dạng, không gửi thư, không tính lượt, và nút Gửi lại vẫn bị khóa tới mốc hẹn

#### Scenario: Tiến trình dừng trước khi nhận gửi OTP

- **WHEN** giao dịch phát mã đã commit, mã còn hiệu lực và thư chưa được nhận gửi
- **THEN** tác vụ gửi nhận thư chờ và gửi mã cũ, giữ nguyên hạn và lượt phát đã tính

#### Scenario: Tiến trình mất kết quả sau khi nhận gửi OTP

- **WHEN** một tiến trình đã nhận gửi thư và dừng mà chưa ghi được kết quả
- **THEN** khi hết hạn xử lý, server ghi trạng thái chưa rõ và giữ lượt đã tính. Yêu cầu lặp không cấp quyền gửi mới. Người dùng có thể xin mã mới theo giới hạn thông thường sau mốc hẹn

### Requirement: REQ-OWNER-03 — Kiểm mã trước, kiểm thông tin sau

Hệ thống SHALL kiểm mã trước. Trước khi mã được xác nhận đúng, mọi phản hồi, dữ liệu lưu, số lượt, thư và bộ đếm sai MUST NOT phụ thuộc giá trị PIN hay nội dung thông tin tạo quán, ngoài việc kiểm đúng dạng. Lý do: nếu kiểm PIN trước thì người không có mã vẫn dò được PIN.

Mỗi mã tạo quán SHALL có một bộ đếm sai dùng chung cho mã sai, mã đúng nhưng thông tin khác lúc gửi mã và lần dùng lại ID khác ràng buộc được tính theo thiết kế. Mã đúng nhưng thông tin khác SHALL bị từ chối và tăng đếm. Lỗi này giữ mã chưa dùng, nhưng hệ thống MUST vô hiệu mã nếu đó là lần sai thứ năm. Dưới khóa của mã, lần thứ năm SHALL ghi mức đếm 5 và vô hiệu mã trong cùng giao dịch, vẫn trả mã lỗi của lần đó. Lần xác minh mới khi mã đã bị khóa và còn trong cửa sổ 10 phút SHALL trả `A_OTP_ATTEMPTS_EXCEEDED`. Gửi lại đúng yêu cầu đã lưu tuân theo REQ-OWNER-04 và MUST NOT tăng đếm.

Chỉ lần xác minh đúng mã còn hiệu lực của đúng intent, đúng thông tin và còn hạn mức mới SHALL tạo yêu cầu được chấp nhận. Server MUST dùng giờ thực của database sau khi lấy các khóa cần cho kết quả xác minh, kể cả khóa hạn mức theo email nếu đi đến bước đó. Từ đúng thời điểm hết hạn, mã SHALL bị từ chối `A_OTP_EXPIRED` ở lần xác minh mới, kể cả khi lời gọi đến trước hạn. Lỗi hết hạn MUST NOT tăng đếm sai, tiêu thụ mã hoặc giữ chỗ. Việc dùng mã, giữ chỗ và ghi yêu cầu tạo quán SHALL nằm trong cùng một giao dịch database. Mỗi yêu cầu tạo quán tạo ra tối đa một quán.

Gửi mã, mở/tải lại trang, tra trạng thái, nhập sai hoặc gửi lại yêu cầu đã ghi nhận MUST NOT tự khởi tạo thêm quán hoặc tài khoản kỹ thuật. Thay ID, tab hay địa chỉ mạng MUST NOT đặt lại bộ đếm sai của cùng mã.

#### Scenario: Đổi PIN sau khi gửi mã

- **WHEN** người dùng nhập đúng mã nhưng PIN khác PIN đã nhập lúc gửi mã
- **THEN** hệ thống trả `CREATE_INTENT_CONFLICT`, tăng bộ đếm sai và không tạo quán. Nếu bộ đếm đạt 5, mã mất hiệu lực ngay

#### Scenario: OTP tạo quán hết hạn lúc chờ khóa

- **WHEN** lần xác minh mới đến trước hạn, nhưng chỉ lấy được khóa cần thiết vào đúng hoặc sau mốc hết hạn
- **THEN** hệ thống trả `A_OTP_EXPIRED`. Bộ đếm sai, việc dùng mã, số chỗ giữ và số yêu cầu tạo quán không đổi

### Requirement: REQ-OWNER-04 — Gửi lại an toàn khi mất phản hồi

Gửi lại đúng yêu cầu cũ SHALL nhận lại đúng kết quả đã lưu, không tạo thêm thư, mã, lượt tính, quán hay lần tạo nào. "Đúng yêu cầu cũ" nghĩa là cùng mã định danh, cùng loại thao tác và cùng đối tượng; với lần nhập mã đã được so thì còn phải cùng mã. PIN và thông tin tạo quán MUST NOT nằm trong phần so này, để việc gửi lại không thành cách dò PIN. Cùng mã định danh nhưng khác các phần trên SHALL bị từ chối.

Ngoại lệ: chuyển quyền và reset hủy chính phiên đang gọi, nên gửi lại sau đó nhận `EMPLOYEE_SESSION_REQUIRED` thay vì kết quả cũ. Thao tác không chạy lần hai, và người dùng đăng nhập lại để thấy kết quả.

Riêng tạo quán, một ID đã có kết quả từ chối SHALL giữ kết quả đó khi gửi lại đúng yêu cầu cũ, kể cả khi lượt khác của cùng intent đã được chấp nhận. Gửi sai ràng buộc vẫn bị từ chối theo quy tắc gửi lại.

Nếu ID khớp phạm vi của yêu cầu đã được chấp nhận và chưa có kết quả riêng, hệ thống SHALL ghi liên kết chỉ tra khi ID còn trong cửa sổ hợp lệ và operation còn chỗ liên kết. Chỉ trả trạng thái sau khi ghi thành công. ID đã có liên kết tiếp tục đọc trạng thái hiện tại khi gửi lại đúng phạm vi. Mỗi operation có tối đa 64 liên kết ngoài lần Xác nhận đã được chấp nhận. Lượt vượt trần SHALL nhận lỗi tạm thời `CREATE_VERIFY_UNAVAILABLE` và MUST NOT ghi kết quả cuối. Liên kết chỉ tra giữ cùng operation trong giai đoạn 1.

Lần Xác nhận đã được chấp nhận dùng đường gửi lại theo REQ-STORE-04. Nếu cửa sổ nhận lại Store Key đã đóng, chỉ trả trạng thái. Với liên kết chỉ tra, mọi mã/PIN đúng dạng trong cùng phạm vi đều nhận cùng trạng thái. Hệ thống MUST NOT so hoặc đếm lỗi OTP/PIN ở nhánh chỉ tra, cấp quyền chạy provisioning, trả Store Key hoặc số quán. Kết quả lưu để gửi lại chỉ chứa kết quả hoặc tham chiếu nội bộ.

Mã định danh chưa từng được ghi nhận mà có thời điểm tạo lệch quá 30 phút so với đồng hồ database SHALL bị từ chối `A_REQUEST_ID_STALE` trong trường hợp thông thường. Bản ghi phục vụ gửi lại SHALL được giữ ít nhất 90 phút, nên yêu cầu quá cũ không bao giờ bị coi nhầm là yêu cầu mới.

Riêng Xác nhận tạo quán, ID lệch về tương lai quá 2 giờ MUST bị từ chối `A_REQUEST_INVALID`. Trong khoảng lệch trên 30 phút tới 2 giờ, mỗi mã xác nhận còn hiệu lực SHALL cho tối đa một dấu từ chối giờ lệch. Yêu cầu tranh dấu khác MUST NOT được tạo quán và nhận lỗi tạm thời `CREATE_VERIFY_UNAVAILABLE`. Dấu đã ghi SHALL tiếp tục được giữ tới khi ID cũ hơn đồng hồ database quá 30 phút, kể cả sau 90 phút. ID đã có dấu MUST NOT được nhận thành lượt mới khi đồng hồ tiến vào cửa sổ hợp lệ.

#### Scenario: Gửi lại sau khi mất phản hồi

- **WHEN** lời gọi xác minh đã xong nhưng phản hồi bị mất, và máy gửi lại đúng yêu cầu đó sau 30 phút
- **THEN** hệ thống trả kết quả đã lưu, không tăng bộ đếm sai và không tạo gì mới

#### Scenario: Gửi lại lượt bị từ chối sau khi lượt khác đã được chấp nhận

- **WHEN** lần Xác nhận B đã bị từ chối, lần A sau đó được chấp nhận cho cùng intent, và B gửi lại đúng yêu cầu đã lưu
- **THEN** server trả lỗi đã lưu. Tra trạng thái bằng B trả `not_accepted`. B không gắn với yêu cầu do A mở

### Requirement: REQ-OWNER-05 — Mỗi email làm chủ tối đa 5 quán

Mỗi email SHALL đứng tên tối đa 5 quán. Con số này SHALL là giá trị cấu hình phía server. Hệ thống MUST NOT giới hạn số lần tạo quán trong ngày: một ngày có thể tạo đủ 5 quán, đủ 5 thì không tạo thêm được.

Số đếm SHALL gồm các quán đang đứng tên, kể cả quán bị tạm ngưng, và các yêu cầu tạo quán đang xử lý hoặc chưa rõ kết quả. Việc kiểm và giữ chỗ SHALL diễn ra sau khi mã và thông tin đã đúng; MUST NOT kiểm ở bước gửi mã, vì như vậy sẽ lộ số quán của một email cho người ngoài. Chỗ đã giữ chỉ được trả lại khi việc tạo thất bại chắc chắn.

Trong phạm vi đồ án giữ trần 5. Khi vận hành thực tế có thể nới theo nhu cầu, qua nhà cung cấp.

#### Scenario: Đủ 5 quán

- **WHEN** chủ đã có 5 quán nhập đúng mã để tạo quán thứ sáu
- **THEN** hệ thống dừng lại, thông báo "Bạn đã có đủ 5 quán. Liên hệ nhà cung cấp nếu cần nới hạn mức." và mã không bị tiêu thụ

#### Scenario: Tạo đủ 5 quán trong một ngày

- **WHEN** một email chưa có quán nào tạo lần lượt 5 quán trong cùng một ngày, mỗi lần gửi mã cách nhau ít nhất 10 phút
- **THEN** cả 5 lần đều được chấp nhận

### Requirement: REQ-OWNER-06 — F5 bỏ form, giữ mã tra sau Xác nhận

Form và biên nhận gửi mã chỉ SHALL tồn tại trong bộ nhớ trang. Tải lại SHALL bỏ toàn bộ form và biên nhận gửi mã, không phục hồi màn nhập mã, không tự gửi lại thư hay yêu cầu xác minh. Thời gian chờ gửi mã trên server vẫn tính bình thường.

Khi người dùng bấm Xác nhận với đầu vào đúng dạng, trình duyệt SHALL ghi duy nhất mã định danh `attemptId` của lần nhập để tra trạng thái, trước khi gửi yêu cầu. Dữ liệu giữ qua F5 MUST NOT có email, tên quán, địa chỉ, tùy chọn seed, PIN, OTP, Store Key hay biên nhận gửi mã. Mã tra chỉ cho phép hỏi trạng thái, không cấp quyền tạo, chạy lại, ghép máy hoặc nhận Store Key. Mỗi tab MUST NOT xóa hay ghi đè mã tra trong lúc chờ phản hồi hoặc kết quả còn chưa rõ.

Giao diện cho phép mở Tạo quán ở nhiều tab. Mỗi tab tra bằng mã lưu trong bộ nhớ phiên của nó. Form, OTP và màn kết quả không đồng bộ giữa các tab. Nếu trình duyệt sao chép bộ nhớ phiên khi mở tab, tab mới chỉ tra lại cùng ID đã sao chép. Một lượt có thể vẫn hiển thị kết quả bị từ chối dù lượt khác đã tạo quán. `not_accepted` chỉ mô tả ID được tra.

Khi kết quả chưa rõ, giao diện SHALL cho về trang đầu hoặc mở màn Ghép thiết bị mà vẫn giữ mã tra. Nếu mở lại Tạo quán trong cùng tab, hệ thống SHALL hiện lượt tra cũ trước khi cho bắt đầu lượt mới.

#### Scenario: Tải lại sau khi một lượt Xác nhận khác đã mở yêu cầu tạo quán

- **WHEN** server đã ghi liên kết chỉ tra của lần Xác nhận khác và tab tải lại, kể cả khi phản hồi bị mất
- **THEN** tab tra trạng thái hiện tại bằng ID của chính nó. Phản hồi chỉ chứa trạng thái và không mở lại việc tạo quán

#### Scenario: Tải lại trước khi bấm Xác nhận

- **WHEN** người dùng tải lại sau khi yêu cầu mã nhưng chưa bấm Xác nhận
- **THEN** form trống, không có mã tra và không có thư mới

#### Scenario: Tải lại sau khi bấm Xác nhận

- **WHEN** người dùng tải lại sau khi gửi Xác nhận, kể cả khi phản hồi bị mất
- **THEN** form trống, máy chỉ tra trạng thái bằng `attemptId`, không gọi xác minh và không nhận lại Store Key

#### Scenario: Không ghi được mã tra

- **WHEN** trình duyệt không ghi được `attemptId`
- **THEN** vẫn cho làm tiếp bằng bộ nhớ trang và cảnh báo `STORAGE_UNAVAILABLE` rằng tải lại có thể làm mất đường tra

### Requirement: REQ-OWNER-07 — Quy tắc chung của mã xác nhận theo từng loại thao tác

Mã xác nhận SHALL gồm 6 chữ số, hết hạn tại đúng mốc 10 phút từ khi phát, bị vô hiệu ngay khi bộ đếm sai của mã đạt 5 và chỉ dùng được một lần. Với mã tạo quán, REQ-OWNER-03 quy định các lỗi tính vào bộ đếm. Mỗi mã SHALL chỉ dùng được cho đúng loại thao tác và đúng đối tượng mà nó được phát. Các loại thao tác gồm: tạo quán, quên PIN chủ, cấp lại Store Key, đổi email (xác nhận email đã đăng ký), đổi email (xác nhận email mới), chuyển quyền (xác nhận email đã đăng ký), chuyển quyền (xác nhận email mới), reset dữ liệu.

Mỗi mã SHALL gắn với đúng đối tượng của nó: quán, tài khoản chủ, và với mã gửi tới email mới thì gắn cả địa chỉ đó. Khi kiểm mã, server MUST so quán trong mã với quán của máy đang gọi. Với mã gửi về email đã đăng ký, server MUST so email trong mã với email chủ hiện tại. Với mã gửi tới email mới, server MUST kiểm bước xác nhận email đã đăng ký gắn với mã chưa được dùng, chưa bị hủy, chưa bị thay, và tài khoản của bước đó đang là chủ quán này. Không đạt thì coi như không có mã. Mã tạo quán gắn với intent, không so với chủ nào.

Mỗi bước xác nhận email đã đăng ký SHALL chỉ có một mã email mới còn hiệu lực; khi mã cho địa chỉ khác thực sự được phát thì mã trước bị hủy. Tạo bước xác nhận mới thì bước trước cùng loại của quán và mã email mới của nó bị hủy.

Thời gian chờ 10 phút giữa hai lần gửi và giới hạn theo email (3 lần mỗi 15 phút, 10 lần mỗi ngày theo giờ Việt Nam) SHALL tính **riêng cho từng loại thao tác**. Giới hạn theo địa chỉ mạng (10 lần mỗi giờ) và trần toàn dự án (400 lần gửi mỗi ngày theo giờ Việt Nam) SHALL tính chung cho mọi loại, vì hai giới hạn này bảo vệ sức chứa gửi thư của cả dự án chứ không nhằm vào một thao tác (quyết định 39). Thời gian chờ tính theo email và loại thao tác, không theo quán. Trong 10 phút kể từ lần phát, hệ thống MUST NOT gửi thêm thư cho cùng email và cùng loại thao tác, kể cả khi mã đã dùng hoặc đã bị hủy. Ngoại lệ: mã reset dữ liệu không có thời gian chờ và không có giới hạn theo email (quyết định 43); gửi mã mới thì mã trước bị hủy, và giới hạn theo địa chỉ mạng cùng trần toàn dự án vẫn áp dụng. Lượt đã chấp nhận phát vẫn tính khi gửi thư lỗi. Vì đã có thời gian chờ 10 phút, giới hạn 3 lần mỗi 15 phút trên thực tế không chạm tới; vẫn giữ làm lớp phòng vệ. Phản hồi của các lời gọi này MUST NOT chứa email chủ.

Khi quán đổi chủ hoặc chủ đổi email, các mã và bước xác nhận còn dở của quán và của email cũ MUST bị hủy.

#### Scenario: Hai loại thao tác không chờ lẫn nhau

- **WHEN** chủ vừa nhận mã quên PIN và ngay sau đó bắt đầu chuyển quyền
- **THEN** hệ thống vẫn gửi mã chuyển quyền, vì hai loại thao tác tính thời gian chờ riêng

#### Scenario: Mã của loại này không dùng cho loại khác

- **WHEN** người dùng nhập mã quên PIN vào bước xác nhận reset dữ liệu
- **THEN** hệ thống từ chối và không có gì thay đổi

#### Scenario: Mã của quán này không dùng cho quán khác

- **WHEN** một máy của quán B gửi mã được phát cho quán A
- **THEN** hệ thống coi như không có mã và không có gì thay đổi

### Requirement: REQ-OWNER-08 — Thao tác của chủ quán nằm trong Cài đặt trên POS

Cấp lại Store Key, đổi email, chuyển quyền và reset dữ liệu SHALL nằm trong mục Cài đặt của POS và SHALL chỉ hiện với tài khoản chủ quán đang đăng nhập bằng PIN. Hệ thống MUST NOT thêm quyền mới vào danh mục quyền cho các thao tác này; điều kiện duy nhất là vai trò `owner`. Server MUST kiểm lại vai trò, không chỉ dựa vào việc giao diện có hiện nút hay không. Mỗi thao tác vẫn phải nhập mã gửi về email đã đăng ký: biết PIN chủ là chưa đủ. Mục Cài đặt MUST NOT hiển thị email chủ đã đăng ký, kể cả dạng che bớt.

Mỗi quán SHALL chỉ chạy một thao tác của chủ tại một thời điểm; thao tác đến sau chờ thao tác trước xong rồi mới kiểm lại điều kiện. Khi quán đang tạm ngưng, các thao tác này SHALL bị từ chối với `STORE_SUSPENDED`; quên Store Key vẫn dùng được.

Hệ thống MUST NOT có mặt web riêng cho chủ để làm các việc này.

#### Scenario: Quản lý không thấy các thao tác của chủ

- **WHEN** nhân viên vai trò `manager` có quyền quản lý cài đặt mở mục Cài đặt
- **THEN** các thao tác của chủ quán không hiện ra, và gọi thẳng vào server cũng bị từ chối với `OWNER_ROLE_REQUIRED`

### Requirement: REQ-OWNER-09 — Quên Store Key

Hệ thống SHALL cung cấp luồng quên Store Key: người dùng nhập email, hệ thống gửi về đúng email đó danh sách các quán đang đứng tên, mỗi dòng gồm tên quán, địa chỉ và Store Key hiện tại. Luồng này không cần mã xác nhận, vì key chỉ đi vào hộp thư của chủ. Store Key MUST NOT đổi và các máy đã ghép MUST NOT bị ảnh hưởng.

Luồng này SHALL có hai lối vào dùng chung một thành phần giao diện: màn ghép thiết bị và mục Cài đặt. Hệ thống SHALL giới hạn 3 lần gửi mỗi giờ theo email. Giới hạn theo địa chỉ mạng và trần toàn dự án ở REQ-OWNER-07 cũng áp dụng: giới hạn theo địa chỉ mạng đếm mọi yêu cầu đúng dạng, trước khi xét giới hạn theo email, kể cả khi email không có quán, để không ai suy ra được email nào có quán qua số thư nhận được; trần toàn dự án chỉ đếm thư thực sự gửi. Phản hồi SHALL giống nhau dù email có quán hay không; việc tra chủ, giải mã key và gửi thư SHALL làm sau khi đã trả phản hồi để thời gian phản hồi không để lộ. Quán đang có lần cấp lại Store Key làm dở SHALL được bỏ khỏi thư, vì key đó có thể đã hết tác dụng; thư cấp lại sẽ tới sau. Store Key MUST NOT xuất hiện trong nhật ký.

#### Scenario: Chủ quên key và cần ghép thêm máy

- **WHEN** chủ nhập đúng email đã đăng ký vào hộp thoại quên Store Key
- **THEN** hệ thống gửi thư chứa Store Key hiện tại của các quán, và các máy đang ghép vẫn hoạt động bình thường

#### Scenario: Email không có quán nào

- **WHEN** một người nhập email không đứng tên quán nào
- **THEN** phản hồi giống hệt trường hợp có quán, và không có thư nào được gửi

### Requirement: REQ-OWNER-10 — Cấp lại Store Key

Hệ thống SHALL cho chủ quán cấp lại Store Key qua bốn bước theo thứ tự: (1) đọc cảnh báo nêu rõ mọi máy của quán sẽ bị đăng xuất và phải ghép lại; (2) gõ lại đúng tên quán; (3) bấm gửi mã, mã đi tới email đã đăng ký; (4) nhập mã. Khi mã đúng, hệ thống SHALL sinh phần bí mật mới, đổi mật khẩu tài khoản kỹ thuật của quán và lưu bí mật mới ở dạng mã hóa. Key cũ MUST NOT ghép thêm được máy nào nữa, và khoảng nhận lại Store Key còn mở MUST đóng. Mỗi quán SHALL chỉ có một lần cấp lại đang làm dở. Trong lúc key mới chưa ghi xong, yêu cầu cấp lại khác chỉ nhận trạng thái, còn đổi email, chuyển quyền và reset phải đợi, và thư quên Store Key bỏ quán này ra. Khi key mới đã ghi xong, các thao tác này làm được bình thường, kể cả khi còn bước thu hồi phiên. Nếu đổi mật khẩu lỗi lặp lại khi key mới chưa ghi xong, hệ thống SHALL báo người vận hành và giữ nguyên trạng thái chặn. Nếu thu hồi phiên lỗi lặp lại, hệ thống SHALL báo người vận hành nhưng không chặn. Vì đổi mật khẩu và ghi database không gói chung một giao dịch được, hệ thống SHALL ghi lại việc đang làm để tiến trình đối soát làm tiếp nếu dừng giữa chừng; key mới chỉ được hiện và gửi sau khi cả hai việc đã xong, trước đó trả trạng thái "chưa rõ". Phiên của các máy đang ghép SHALL bị thu hồi, và dừng trước bước này thì tiến trình đối soát làm tiếp; token đang dùng có thể còn tác dụng tới khi hết hạn, mặc định khoảng 1 giờ theo tài liệu Supabase, hoặc tới khi người dùng đăng xuất. Chủ dự án chấp nhận khoảng này và ghi vào giới hạn của hệ thống (quyết định 42).

Key mới SHALL hiện trên màn hình kèm nút sao chép, và được gửi thêm tới email chủ như một hỗ trợ kèm theo. Gửi lại đúng lần nhập mã khi mất phản hồi MUST NOT sinh key lần hai; lúc đó chỉ trả trạng thái, và key mới có trong thư.

#### Scenario: Cấp lại thành công

- **WHEN** chủ quán qua đủ bốn bước
- **THEN** key mới hiện trên màn hình, key cũ không ghép được nữa, và mọi máy đang ghép, gồm cả máy đang thao tác, phải ghép lại

#### Scenario: Biết PIN chủ nhưng không đọc được email

- **WHEN** một người biết PIN chủ làm tới bước nhập mã nhưng không đọc được hộp thư của chủ
- **THEN** Store Key không đổi

### Requirement: REQ-OWNER-11 — Quên PIN chỉ dành cho chủ quán

Trên màn nhập PIN của máy đã ghép, khi chọn tài khoản chủ quán, hệ thống SHALL hiện lối "Quên mã PIN". Hệ thống SHALL gửi mã tới email đã đăng ký của quán; nhập đúng mã thì chủ đặt PIN mới gồm 6 chữ số. PIN mới SHALL có hiệu lực ngay trên mọi máy đã ghép. Đây MUST là đường tự phục vụ duy nhất để đặt lại PIN chủ khi đã quên; khôi phục do người vận hành thực hiện là việc riêng. Các vai trò khác, kể cả vai trò có quyền quản lý nhân viên, MUST NOT tác động lên PIN của chủ quán.

Khi quán đang tạm ngưng, lối này SHALL bị từ chối với `STORE_SUSPENDED`. Phản hồi MUST NOT chứa email đã đăng ký, kể cả dạng che bớt.

Nhân viên MUST NOT có lối quên PIN qua email. Nhân viên quên PIN SHALL nhờ chủ quán hoặc người có quyền `employee.manage` đặt lại trong phần quản lý nhân viên.

#### Scenario: Chủ quên PIN

- **WHEN** chủ chọn "Quên mã PIN", nhập đúng mã gửi về email và đặt PIN mới
- **THEN** PIN mới có hiệu lực ngay, PIN cũ không còn dùng được

#### Scenario: Nhân viên quên PIN

- **WHEN** nhân viên không phải chủ quán chọn tài khoản của mình trên màn nhập PIN
- **THEN** không có lối "Quên mã PIN", và nhân viên phải nhờ chủ quán hoặc người có quyền `employee.manage` đặt lại

#### Scenario: Máy chưa ghép

- **WHEN** chủ quên cả Store Key và PIN trên một máy chưa ghép
- **THEN** chủ dùng luồng quên Store Key để ghép máy trước, rồi mới dùng luồng quên PIN

### Requirement: REQ-OWNER-12 — Đổi email chủ

Trong mục Cài đặt, chủ quán SHALL đổi email theo thứ tự: (1) nhập email đã đăng ký; (2) nhập mã gửi về email đó; (3) nhập email mới; (4) nhập mã gửi về email mới. Bước 3 và 4 MUST NOT làm được nếu chưa xong bước 2, và kết quả bước 2 chỉ có hiệu lực 10 phút, cho đúng phiên đăng nhập đó.

Phản hồi ở bước 1 SHALL giống nhau dù email nhập vào có đúng hay không, và chỉ khi đúng mới có thư. Email mới trùng email đang dùng SHALL bị từ chối ngay. Email mới đã đứng tên chủ khác, hoặc đang có yêu cầu tạo quán chưa xong, chỉ bị từ chối **sau** khi mã của email mới đúng, để không ai dùng màn này dò email nào đã có quán.

Việc đổi SHALL có hiệu lực với tất cả các quán đứng tên email đó. Sau khi đổi, hệ thống SHALL gửi thư báo về email cũ.

#### Scenario: Đổi email thành công

- **WHEN** chủ nhập đúng mã của email đã đăng ký rồi đúng mã của email mới
- **THEN** các quán chuyển sang email mới, và email cũ nhận thư báo

#### Scenario: Gõ sai email mới

- **WHEN** chủ gõ sai địa chỉ email mới nên không nhận được mã
- **THEN** email của quán vẫn là email cũ, không có gì thay đổi

#### Scenario: Email mới đã thuộc chủ khác

- **WHEN** chủ nhập đúng mã gửi tới một email đang đứng tên chủ khác
- **THEN** hệ thống báo `NEW_EMAIL_UNAVAILABLE` và không đổi gì

#### Scenario: Bỏ qua bước xác nhận email đã đăng ký

- **WHEN** một người biết PIN chủ yêu cầu gửi mã tới email mới mà chưa qua bước 2
- **THEN** hệ thống từ chối với `OWNER_PROOF_REQUIRED` và không gửi thư

### Requirement: REQ-OWNER-13 — Chuyển quyền sở hữu quán

Chuyển quyền SHALL là đổi vai trò giữa hai tài khoản POS của cùng một quán. Ví dụ chủ A nhượng quán cho B: A phải tạo sẵn tài khoản POS cho B; sau khi xong, B là chủ quán, A thành tài khoản thường.

Trong mục Cài đặt, chủ quán SHALL chuyển quyền theo thứ tự: (1) vào màn chuyển quyền, đọc cảnh báo; (2) nhập email đã đăng ký để xác nhận chính chủ; POS MUST NOT hiển thị email này; (3) nhập mã gửi về email đó; (4) chọn tài khoản POS của người nhận; (5) nhập email mới, khác email hiện tại; (6) nhập mã gửi về email mới. Bước 4 trở đi MUST NOT làm được nếu chưa xong bước 3, và kết quả bước 3 chỉ có hiệu lực 10 phút, cho đúng phiên đăng nhập đó. Tài khoản được chọn SHALL đang hoạt động, thuộc quán này và không phải chủ quán; tài khoản mẫu có PIN công khai MUST NOT được chọn. Nếu quán không có tài khoản nào đủ điều kiện, màn hình SHALL báo cần tạo tài khoản POS cho người nhận trước, và chưa gửi mã nào. Màn hình SHALL cảnh báo rằng email mới phải là email của người nhận, và người nhận phải tự đọc mã.

Sau khi mã của email mới đúng, hệ thống SHALL kiểm email đó đang đứng tên bao nhiêu quán; đủ 5 thì dừng và báo rõ, quán vẫn thuộc chủ cũ. Nếu còn chỗ, và tài khoản được chọn vẫn hợp lệ, trong một giao dịch database hệ thống SHALL: chuyển quán sang đứng tên email mới; đổi A thành vai trò `cashier` và bỏ các quyền riêng của A; đổi tài khoản được chọn thành vai trò `owner`; hủy các phiên đang mở của hai tài khoản này; ghi nhật ký. Sau giao dịch, hai email nhận thư báo.

Mỗi người SHALL giữ PIN của mình. Vì A là người tạo tài khoản cho B nên A có thể biết PIN của B; để chặn việc này, B SHALL phải đổi PIN ở lần đăng nhập đầu sau khi nhận quyền. Store Key và các máy đã ghép không bị ảnh hưởng. Hệ thống MUST NOT tự xóa tài khoản của A; nếu cần, B tự xóa trong phần quản lý nhân viên. Mọi mã xác nhận về sau SHALL đi tới email của chủ mới. Mỗi quán chỉ có tối đa một lần chuyển quyền đang dở.

#### Scenario: Chuyển quyền thành công

- **WHEN** A qua đủ các bước và email mới chưa đủ 5 quán
- **THEN** quán đứng tên email mới, B là chủ quán, A là tài khoản thường, mỗi người vẫn đăng nhập bằng PIN của mình, Store Key giữ nguyên, và hai email đều nhận thư báo

#### Scenario: Email mới đã đủ 5 quán

- **WHEN** mã của email mới đúng nhưng email đó đã đứng tên 5 quán
- **THEN** hệ thống dừng, báo `RECIPIENT_STORE_LIMIT_REACHED`, và quán vẫn thuộc chủ cũ

#### Scenario: Chưa xác nhận email mới

- **WHEN** A đã xác nhận chính chủ nhưng chưa nhập được mã của email mới
- **THEN** quán vẫn thuộc A và mọi truy cập giữ nguyên

#### Scenario: A thử đăng nhập bằng PIN của B

- **WHEN** A dùng PIN của B để đăng nhập sau khi chuyển quyền
- **THEN** người đăng nhập phải đổi PIN ngay; B lấy lại tài khoản bằng lối "Quên mã PIN" qua email mới, và phiên của A hết hiệu lực

#### Scenario: B xóa tài khoản của A

- **WHEN** chuyển quyền đã xong và B muốn A không vào quán nữa
- **THEN** B xóa hoặc khóa tài khoản của A trong phần quản lý nhân viên, và phiên của A hết hiệu lực

### Requirement: REQ-OWNER-14 — Reset dữ liệu quán

Chủ quán SHALL reset dữ liệu qua bốn bước theo thứ tự: (1) đọc cảnh báo nêu rõ những gì bị xóa và không khôi phục được; (2) gõ lại đúng tên quán; (3) bấm gửi mã, mã đi tới email đã đăng ký; (4) nhập mã. Khi mã đúng, hệ thống SHALL đưa dữ liệu của quán về rỗng trong một giao dịch: đơn, thanh toán, hóa đơn, số liệu báo cáo, thực đơn, khu và bàn, mọi nhân viên trừ chủ quán; các cấu hình còn lại về mặc định. Phiên đang mở của mọi nhân viên, gồm cả người đang thao tác, SHALL hết hiệu lực.

Mục đích thường gặp là bỏ dữ liệu demo đã chọn lúc tạo quán để tự nhập dữ liệu của quán. Hệ thống MUST NOT đặt giới hạn riêng cho số lần reset và MUST NOT đặt thời gian chờ giữa các lần; giới hạn chung ở REQ-OWNER-07 vẫn áp dụng. Sau reset, hệ thống MUST NOT tự tạo lại dữ liệu mẫu và POS không nhắc thử lại việc tạo dữ liệu mẫu, kể cả khi lúc reset dữ liệu mẫu chưa chạy hoặc vừa lỗi. Không có bước xuất dữ liệu trước khi xóa; màn cảnh báo ghi rõ dữ liệu không khôi phục được.

Ảnh trong kho ảnh nằm ngoài database nên SHALL được xóa sau giao dịch; xóa lỗi thì thử lại và không ảnh hưởng kết quả reset. Hệ thống SHALL giữ lại: tên và địa chỉ quán, Store Key, các máy đã ghép, tài khoản chủ quán cùng PIN hiện tại, và nhật ký quản trị. Reset khác với thao tác xóa dữ liệu mẫu đã có: xóa dữ liệu mẫu không đụng tới dữ liệu tài chính và dữ liệu do quán tự tạo.

#### Scenario: Reset thành công

- **WHEN** chủ quán qua đủ bốn bước
- **THEN** quán còn đúng một nhân viên là chủ quán, không còn đơn hay thực đơn, và nhật ký có bản ghi reset

#### Scenario: Reset nhiều lần

- **WHEN** chủ quán vừa reset xong và muốn reset lần nữa ngay
- **THEN** hệ thống gửi mã mới mà không bắt chờ, và quán không tự có lại dữ liệu mẫu

#### Scenario: Máy khác đang đăng nhập

- **WHEN** một máy khác của quán đang có nhân viên đăng nhập lúc reset hoàn tất
- **THEN** máy đó vẫn ghép với quán nhưng phiên nhân viên hết hiệu lực và quay về màn nhập PIN

#### Scenario: Gõ sai tên quán

- **WHEN** chủ quán gõ tên không đúng ở bước 2
- **THEN** hệ thống báo `STORE_NAME_MISMATCH`, không gửi mã và không xóa gì

### Requirement: REQ-OWNER-15 — Nhật ký thao tác quản trị

Hệ thống SHALL ghi nhật ký các thao tác: tạo quán, cấp lại Store Key, đổi trạng thái quán, đặt lại PIN chủ, đổi email, chuyển quyền, reset dữ liệu. Mỗi bản ghi SHALL gắn với một quán, kèm thời điểm và loại thao tác. Nhật ký MUST NOT chứa Store Key, phần bí mật, mã xác nhận hay PIN ở bất kỳ dạng nào.

#### Scenario: Nhật ký đi theo quán

- **WHEN** một quán được chuyển sang chủ mới hoặc được reset dữ liệu
- **THEN** các bản ghi nhật ký trước đó vẫn còn và vẫn thuộc quán đó

### Requirement: REQ-OWNER-16 — Chặn thư mặc định của Supabase Auth

Trước khi phát hành giai đoạn 1, hệ thống SHALL có cơ chế chặn các thư mẫu do Supabase Auth tự gửi (xác nhận đăng ký, mã đăng nhập, đặt lại mật khẩu, đổi email, mời). Các thư của hệ thống trong tài liệu này đi đường gửi riêng của dự án, không dùng các thư mặc định đó. Nếu cơ chế chặn bị tắt, dự án chấp nhận rủi ro còn lại và không coi đây là điều kiện chặn phát hành: người ngoài có thể kích hoạt thư mẫu tới hộp thư của nhóm và tạo tài khoản rác, nhưng không có quyền gì của chủ quán.

#### Scenario: Thư mặc định không mang quyền chủ

- **WHEN** một người kích hoạt được thư mặc định của Supabase Auth
- **THEN** nội dung hay mã trong thư đó không dùng được cho bất kỳ thao tác nào của chủ quán

## Các yêu cầu đã bỏ so với bản trước

Ghi lại để biết vì sao tài liệu đổi; đây không phải yêu cầu của hệ thống.

- **Đăng nhập chủ bằng mã một lần:** chủ dự án chốt ngày 2026-11-03: đăng nhập thường bằng PIN POS; mã qua email chỉ dùng cho từng thao tác. Email chủ vẫn là căn cứ xác định sở hữu và hạn mức (REQ-OWNER-05).
- **Phiên đăng nhập của chủ có hạn 7 ngày:** không còn phiên web của chủ (quyết định 23).
- **Mặt web dành cho chủ:** các thao tác của chủ chuyển vào POS (quyết định 24).
- **Giới hạn 3 lần tạo cửa hàng mỗi ngày:** bỏ theo quyết định 14.
