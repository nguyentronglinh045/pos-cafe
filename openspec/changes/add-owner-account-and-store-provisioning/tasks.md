# Danh sách việc

Cập nhật 2026-11-05: chủ không còn đăng nhập web; thao tác của chủ làm trên POS (quyết định 23, 24). Đặc tả các luồng giai đoạn 2 đã viết trong đợt này; giai đoạn triển khai không đổi. Chưa có việc nào được giao triển khai.

Chia hai giai đoạn theo quyết định 18. Giai đoạn 1 đưa luồng tạo quán có OTP và chặn đường tạo cũ. Các chức năng khôi phục dành cho chủ ở giai đoạn 2. Tự động đối soát lượt tạo quán dở dang nằm sau đồ án theo quyết định 48.

Thứ tự tổng thể xem `docs/roadmap.md` và `docs/workflow/g01-g10-plan.md`. Reset dữ liệu xếp ở giai đoạn 2 trong kế hoạch, chưa thực hiện ngay (quyết định 36).

---

# Giai đoạn 1 — Danh tính và kiểm soát việc tạo cửa hàng

## 0. Cổng trước khi code thực tế và thứ tự test

- [ ] 0.1 Rà và chốt ma trận expected FE trong `testplan.md` trước khi viết code thực tế. Bao gồm lỗi OTP, thời gian chờ, F5, chống tạo trùng, nhận Store Key, ghép máy và PIN.
- [ ] 0.2 Khi được giao code, hiện thực FE/ports/mock với OTP lấy từ hộp thư giả, chạy qua cổng mock trước khi nối FE với staging. Giữ cấu hình signup hiện tại.
- [ ] 0.3 Sau khi mock đạt và T05 sẵn sàng, chạy vòng staging với OTP thật, Auth/DB thật; sau đó chạy mục 1c.5. Lưu hai kết quả theo cấu hình, nguồn và fixture.

## 1. Đường gửi email — làm ngay, không có việc nào phải chờ duyệt

Mốc phải đạt là mức 1 ở quyết định 15. Mức 3 là phần thưởng nếu xin được tên miền, **không** phải điều kiện.

- [ ] 1.1 Tạo một tài khoản Gmail riêng của dự án, không dùng tài khoản cá nhân
- [ ] 1.2 Bật xác thực hai bước cho tài khoản đó, rồi tạo App Password
- [ ] 1.3 Xác minh TLS trực tiếp tới `smtp.gmail.com:465` từ Edge Function hosted trước khi chốt cấu hình. [Giới hạn hosted](https://supabase.com/docs/guides/functions/limits#other-limits--restrictions) chặn cổng 587. Giữ App Password trong bí mật của hàm server; thư Supabase Auth xử lý riêng.
- [ ] 1.4 Gửi thử tới ít nhất một nhà cung cấp hộp thư phổ biến, xác nhận vào hộp thư chính chứ không vào thư rác
- [ ] 1.5 Ghi lại hạn mức nhà gửi và kiểm nhu cầu gồm cả OTP, thư Store Key sau tạo và thư đang chờ. Trần 400 lượt theo quyết định 39 không bao gồm thư Store Key. Nếu ngân sách thật không đủ, báo đánh đổi và chốt phương án trước tích hợp phụ thuộc.

### 1b. Nâng lên mức 3, chạy song song và không chặn gì

- [ ] 1b.1 Kiểm tra chương trình cấp tên miền `.id.vn` hoặc `.io.vn` miễn phí còn hiệu lực không, nộp hồ sơ nếu có
- [ ] 1b.2 Đăng ký GitHub Student Developer Pack bằng email trường, nhận tên miền kèm theo
- [ ] 1b.3 Xin được tên miền thì xác minh nó ở nhà cung cấp gửi email và cấu hình bản ghi xác thực người gửi
- [ ] 1b.4 Chuyển thông tin SMTP sang tên miền mới, chạy lại phép thử ở mục 1.4
- [ ] 1b.5 Không xin được trước tuần 14 thì giữ mức 1 và ghi lý do vào `docs/limitations.md`

## 1c. Chặn thư mẫu của Supabase Auth

- [ ] 1c.1 Đối chiếu tài liệu chính thức của Supabase, chọn cơ chế chặn
- [ ] 1c.2 Cài cơ chế chặn trước khi phát hành giai đoạn 1; xác nhận Store Key và POS vẫn hoạt động
- [ ] 1c.3 Ghi vào `docs/limitations.md` rủi ro đã chấp nhận khi cơ chế chặn bị tắt
- [ ] 1c.4 Kiểm thử: TC-OWNER-78
- [ ] 1c.5 Sau vòng staging đầu tiên đạt, tắt signup công khai trên đúng project staging rồi chạy lại TC-OWNER-104. Kiểm signup trực tiếp bị từ chối, Admin API vẫn tạo được tài khoản kỹ thuật và ma trận FE cơ bản vẫn đạt. Ghi cấu hình trước/sau và điều kiện nếu phải quay lại bản cũ.

## 2. Lược đồ và migration

- [ ] 2.0 Xác nhận cấu hình ứng dụng, CLI và hàm phía server đều trỏ tới staging, không còn trỏ database gốc
- [ ] 2.1 Thêm enum `store_status` gồm `active` và `suspended`
- [ ] 2.2 Thêm enum `store_admin_action` gồm các giá trị ở `design.md`
- [ ] 2.3 Tạo bảng `owner_accounts`
- [ ] 2.4 Thêm cột `owner_account_id` vào `stores`, bắt buộc, **không** đặt ràng buộc duy nhất
- [ ] 2.5 Thêm cột `status` vào `stores`, bỏ cột `is_active`
- [ ] 2.6 Thêm cột `key_secret_encrypted` và `key_encryption_version` vào `stores`
- [ ] 2.7 Tạo các bảng `otp_challenges`, `otp_request_outcomes`, `otp_attempts`, `create_intents`, `create_operations`, `auth_create_dispatches`, `mail_dispatches`, `store_admin_log` theo `design.md`
- [ ] 2.8 Viết kiểm thử khẳng định không tồn tại ràng buộc duy nhất nào trên `stores.owner_account_id`

## 3. Chính sách bảo mật mức dòng

- [ ] 3.1 Thêm điều kiện `status = 'active'` vào chính sách của mọi bảng nghiệp vụ
- [ ] 3.2 Cho thiết bị đã ghép đọc được bản ghi và trạng thái của chính quán mình kể cả khi bị tạm ngưng
- [ ] 3.3 Xác nhận nhánh thiết bị đã ghép giữ nguyên; không thêm nhánh chủ
- [ ] 3.4 Các bảng mới của `design.md` không cấp quyền cho máy người dùng; các cột bí mật mới trên `stores` không cho thiết bị đọc
- [ ] 3.5 Thu hồi quyền của máy người dùng trên `permission_reserve_store_no` và hàm khởi tạo quán
- [ ] 3.6 Kiểm thử: thiết bị của quán `suspended` gọi thẳng database bị trả về rỗng; gọi thẳng các hàm ở 3.5 bị từ chối

## 4. Hàm phía server

- [ ] 4.1 Dựng khung hàm tại `supabase/functions/`
- [ ] 4.2 Khai báo biến môi trường: khóa quản trị nền tảng, khóa mã hóa Store Key, khóa băm mã xác nhận và thông tin SMTP; tất cả không bao giờ xuống máy người dùng
- [ ] 4.3 Viết tiện ích mã hóa và giải mã phần bí mật, có mang định danh phiên bản khóa
- [ ] 4.4 Dựng phần gửi và kiểm mã dùng chung theo thứ tự ở `design.md`: giới hạn theo email riêng từng loại thao tác, giới hạn theo địa chỉ mạng và trần toàn dự án tính chung
- [ ] 4.5 Cài hạn mức 5 cửa hàng, đọc từ cấu hình chứ không phải hằng số trong mã, kiểm sau khi mã đúng; không giới hạn số lần tạo trong ngày
- [ ] 4.6 Hành động `requestCreateStoreOtp`, `verifyAndAcceptCreate`, `getCreateStatus`, `confirmStoreKeySaved`. Điểm vào provisioning nội bộ chỉ xử lý operation đã chấp nhận và có giữ chỗ; tách quyền hỏi trạng thái khỏi nhận key hoặc ghi.
- [ ] 4.7 Tạo quán theo các bước ở `design.md`: thẻ lượt chạy, claim một lần cho lệnh Auth, dữ liệu tạm, tài khoản kỹ thuật có dấu hiệu, giao dịch ghi quán, thư gửi sau khi đã lưu
- [ ] 4.8 Xử lý lượt tạo dở trong phạm vi đồ án: giữ suất, trả `unknown` khi hết hạn kể cả nếu lượt gốc dừng trước khi ghi trạng thái, từ chối ghi muộn và giữ tham chiếu Auth. Tra/gửi lại chỉ đọc hoặc nhận kết quả theo contract, không khởi chạy tạo lại. Kiểm các ca crash và quota trước nghiệm thu.
- [ ] 4.9 Ghi `store_created` vào `store_admin_log`
- [ ] 4.10 Kiểm TC-OWNER-103/105/106: đếm riêng lượt gửi, lần sai và suất quán; chặn bypass; chỉ trả Store Key theo REQ-STORE-04, giữ bí mật server; kiểm Auth đến muộn trước khi trả quota.
- [ ] 4.11 Dùng tác vụ gửi thư độc lập cho bản ghi Store Key `queued` của quán đã `created`. Kiểm TC-OWNER-44 ngay cả khi lượt tạo dừng sau commit và trước khi gửi. Thư lỗi không làm hỏng quán và không hoàn suất.
- [ ] 4.12 Đối chiếu tài liệu Supabase về tạo user bằng API quản trị và `app_metadata` trước khi tạo tài khoản thật
- [ ] 4.13 Tách phần gửi thư và phần lưu trữ khỏi các quy tắc, để chạy test trên máy với database giả và đường gửi thư giả; hàm thật không có chế độ test, không có mã xác nhận dùng chung, có kiểm cận dưới của các giá trị cấu hình

## 5. Ports và adapters

- [ ] 5.1 Thêm `IOwnerActionPort` và `IStoreProvisioningPort` vào `src/ports`, khai bằng type của `domain`
- [ ] 5.2 Thêm type tương ứng vào `src/domain`
- [ ] 5.3 Hiện thực adapter Supabase gọi hàm phía server
- [ ] 5.4 Hiện thực adapter mock đóng vai server, database và thư, đủ để dựng mọi kịch bản mà không cần hàm thật; thời gian là cấu hình, ví dụ 10 phút xuống 15 giây; test đọc được mã
- [ ] 5.5 Nối hai port mới vào `AppPorts` và `src/app/runtimePorts.ts`
- [ ] 5.6 Chạy `src/architectureBoundaries.test.ts`, xác nhận không vi phạm ranh giới

## 6. Màn hình giai đoạn 1

- [ ] 6.1 Màn tạo quán: nhập email, tên hiển thị bắt buộc, địa chỉ tùy chọn, PIN chủ quán, tùy chọn dữ liệu mẫu
- [ ] 6.2 Màn nhập mã, kèm xử lý hết hạn, quá số lần sai và khóa nút Gửi lại tới mốc hẹn
- [ ] 6.3 F5 bỏ form và biên nhận gửi mã. Sau Xác nhận chỉ lưu `attemptId` qua F5 để tra trạng thái; nếu lỗi lưu thì cảnh báo và vẫn cho làm tiếp. Giữ đồng hồ theo giờ server trong trang còn mở.
- [ ] 6.4 Thông báo khi chạm trần cửa hàng, kèm hướng dẫn liên hệ nhà cung cấp
- [ ] 6.5 Màn kết quả tạo quán: hiển thị Store Key kèm nút sao chép và nút "Tôi đã lưu Store Key", nhắc chủ sao chép và lưu lại ngay
- [ ] 6.6 Xóa mã tra khi người dùng rời kết quả cuối; giữ khi còn chưa rõ. Bỏ form khi F5 theo quyết định 46, không có bản nháp lưu lâu cần TTL.

## 7. Gỡ luồng tạo cửa hàng cũ

- [ ] 7.1 Gỡ luồng tạo cửa hàng phía client ở `src/app/screens/CreateStoreScreen.tsx`, gồm đường `auth.signUp` và gọi bootstrap trực tiếp
- [ ] 7.2 Cập nhật `src/adapters/supabase/authRepo.ts` cho khớp hợp đồng mới
- [ ] 7.3 Xác nhận màn ghép thiết bị bằng Store Key giữ nguyên hành vi, theo quyết định 13
- [ ] 7.4 Cập nhật các kiểm thử đang dựa vào luồng tạo cửa hàng cũ
- [ ] 7.5 Sửa `tests/supabase/pos-cafe-supabase.spec.ts`: bỏ bước tạo quán, ghép vào quán thử tạo sẵn trên staging với Store Key qua biến môi trường

## 8. Cổng chặn — xóa dữ liệu cũ

> Không được vượt qua mục này nếu chưa đủ điều kiện. Đây là thao tác không hoàn tác được.

- [ ] 8.1 **Xin xác nhận rõ ràng của chủ dự án.** Không suy đoán, không mặc định là đã đồng ý. Nêu rõ staging đang giữ dữ liệu của các đợt kiểm thử trước
- [ ] 8.2 Sao lưu toàn bộ database
- [ ] 8.3 Sao lưu toàn bộ kho ảnh
- [ ] 8.4 Sao lưu khóa mã hóa Store Key, cất tách khỏi bản sao lưu database
- [ ] 8.5 Xóa dữ liệu cũ trên staging, không đụng database gốc
- [ ] 8.6 Ghi lại thời điểm thực hiện và phạm vi đã xóa
- [ ] 8.7 Dựng lại dữ liệu demo theo `docs/demo-runbook.md`
- [ ] 8.8 Thông báo mọi Store Key hiện có đã mất hiệu lực và mọi thiết bị phải ghép lại

## 9. Kiểm thử giai đoạn 1

Chạy các ca trong `testplan.md` thuộc giai đoạn 1 theo mục Cách chạy của file đó. Nhóm bảo mật và quyền là bắt buộc.

- [ ] 9.1 Chạy nhóm luồng chính TC-OWNER-01…10
- [ ] 9.2 Chạy nhóm luồng ngoại lệ TC-OWNER-11…30
- [ ] 9.3 Chạy nhóm biên TC-OWNER-31…36
- [ ] 9.4 Chạy nhóm bảo mật TC-OWNER-37…48, cùng TC-OWNER-78, 80, 81, 82, 91…95, 101
- [ ] 9.5 Test tay trên staging, chỉ trên quán thử: các ca được liệt kê ở mục Cách chạy; tạo cửa hàng từ đầu tới lúc ghép được thiết bị; dọn quán thử sau khi chủ dự án xác nhận
- [ ] 9.6 Chạy TC-OWNER-103…106 theo lane trong testplan. Hai vòng staging của TC-OWNER-104 bắt buộc trước khi đóng giai đoạn 1.

## 10. Tài liệu giai đoạn 1

- [ ] 10.1 Cập nhật `docs/requirements.md`: FR-01, FR-02, mở rộng phạm vi NFR-02
- [ ] 10.2 Cập nhật `docs/architecture.md`: thêm thành phần chạy phía server
- [ ] 10.3 Cập nhật `docs/data-model.md`: cột mới và bảng mới
- [ ] 10.4 Cập nhật `docs/screens.md`: màn tạo quán và màn kết quả
- [ ] 10.5 Cập nhật `docs/limitations.md`: rủi ro mất khóa mã hóa, Store Key nằm lại trong hộp thư, thư mặc định của Supabase Auth khi cơ chế chặn bị tắt và lượt tạo chưa rõ có thể giữ suất đến khi xác minh riêng theo quyết định 48.
- [ ] 10.6 Cập nhật `pos-cafe-context.md` và `docs/features.md`
- [ ] 10.7 Cập nhật tiến độ trong `docs/roadmap.md`, ghi ngày

---

# Giai đoạn 2 — Khôi phục và vòng đời quyền sở hữu

## 11. Quên Store Key

- [ ] 11.1 Hành động `forgotStoreKey`, không cần đăng nhập, không cần mã
- [ ] 11.2 Luôn trả phản hồi chung chung, không tiết lộ email có tồn tại hay không
- [ ] 11.3 Giới hạn 3 lần mỗi giờ tính theo email, cộng giới hạn theo địa chỉ mạng và trần toàn dự án; trả phản hồi trước rồi mới tra chủ và gửi thư; bỏ quán đang cấp lại key ra khỏi thư
- [ ] 11.4 Dựng email liệt kê dạng danh sách: tên cửa hàng, địa chỉ lấy từ `store_settings`, Store Key
- [ ] 11.5 Thêm câu nhắc dùng chức năng cấp lại nếu nghi hộp thư đã bị lộ
- [ ] 11.6 Một thành phần giao diện dùng chung, gắn ở hai lối vào: màn ghép thiết bị và mục Cài đặt
- [ ] 11.7 Kiểm thử: TC-OWNER-49…51, 100

## 11b. Gửi mã theo loại thao tác

- [ ] 11b.1 Hành động `requestOwnerActionOtp`: kiểm phiên hoặc máy đã ghép, kiểm quán tạm ngưng, gửi mã về email đã đăng ký; phản hồi không chứa email
- [ ] 11b.2 Gắn mỗi mã với đúng đối tượng theo bảng trong `design.md`
- [ ] 11b.3 Thời gian chờ và lượt gửi tính riêng từng loại thao tác; mã reset không có thời gian chờ và không có giới hạn theo email
- [ ] 11b.4 Kiểm thử: TC-OWNER-75, 76, 83, 97

## 12. Cấp lại Store Key

- [ ] 12.1 Hiện trong mục Cài đặt, chỉ với tài khoản chủ quán
- [ ] 12.2 Bước 1: cảnh báo nêu rõ hậu quả, gồm máy đang thao tác cũng bị đăng xuất
- [ ] 12.3 Bước 2: gõ lại đúng tên quán
- [ ] 12.4 Bước 3 và 4: gửi mã tới email đã đăng ký, nhập mã
- [ ] 12.5 Hành động `regenerateStoreKey`: sinh bí mật mới, đổi mật khẩu tài khoản kỹ thuật, mã hóa và ghi lại
- [ ] 12.6 Hiển thị key mới kèm nút sao chép; gửi thêm thư như một hỗ trợ
- [ ] 12.7 Ghi `store_key_regenerated` vào nhật ký, không kèm giá trị key
- [ ] 12.8 Tạo bảng `store_key_rotations`, mỗi quán tối đa một bản ghi `pending`; trong lúc này chặn các thao tác khác của chủ. Bước làm dở: ghi bảng này, đổi mật khẩu, ghi bí mật, đối soát làm tiếp; thu hồi phiên tài khoản kỹ thuật, dừng trước bước này thì đối soát làm tiếp; lỗi lặp lại thì báo người vận hành
- [ ] 12.9 Kiểm thử: TC-OWNER-52…55, 87
- [ ] 12.10 Đối chiếu tài liệu Supabase về thu hồi phiên: đổi mật khẩu bằng API quản trị có chặn được việc làm mới token không, và đăng xuất theo tài khoản làm thế nào khi không có JWT của máy. Ghi hạn token thực tế của project. Nếu không chặn được thì người giữ key cũ không bị đẩy ra; phải báo chủ dự án

## 13. Quên PIN của chủ quán

- [ ] 13.1 Lối "Quên mã PIN" trên màn nhập PIN, chỉ khi chọn tài khoản chủ quán
- [ ] 13.2 Hành động `resetOwnerPin`: có mã, không cần đăng nhập, cần máy đã ghép
- [ ] 13.3 Chặn mọi vai trò khác tác động lên PIN của nhân viên vai trò `owner`
- [ ] 13.4 Ghi `owner_pin_reset` vào nhật ký
- [ ] 13.5 Kiểm thử: TC-OWNER-56…59

## 14. Đổi email chủ

- [ ] 14.1 Hiện trong mục Cài đặt, chỉ với tài khoản chủ quán; không hiển thị email đã đăng ký
- [ ] 14.2 Nhập email đã đăng ký; phản hồi giống nhau dù đúng hay sai; chỉ gửi mã khi đúng
- [ ] 14.3 Tạo bảng `owner_action_proofs`. Hành động `verifyOwnerProof`: ghi xác nhận chính chủ, hiệu lực 10 phút
- [ ] 14.4 Nhập email mới; gửi mã tới email mới; thiếu xác nhận chính chủ thì từ chối
- [ ] 14.5 Hành động `changeOwnerEmail`: sau khi mã đúng mới kiểm email đã thuộc chủ khác; đổi cho mọi quán của chủ; hủy mã và xác nhận còn dở
- [ ] 14.6 Gửi thư báo về email cũ; ghi `owner_email_changed` vào nhật ký
- [ ] 14.7 Kiểm thử: TC-OWNER-60…64, 88, 96, 97, 99

## 15. Chuyển quyền sở hữu cửa hàng

- [ ] 15.0 Ghi ngoại lệ chuyển quyền vào quy tắc PERM-13 của `redesign-permission-model` khi đưa hai change vào đặc tả chính; nếu change đó được lưu trữ trước thì thêm delta MODIFIED cho `employee-management`
- [ ] 15.1 Dùng `owner_action_proofs` đã tạo ở 14.3; mỗi quán tối đa một lần chuyển đang dở
- [ ] 15.2 Màn chuyển quyền trong mục Cài đặt, chỉ với tài khoản chủ quán; không hiển thị email đã đăng ký
- [ ] 15.3 Nhập email đã đăng ký, nhập mã, ghi xác nhận chính chủ
- [ ] 15.4 Chọn tài khoản POS của người nhận trong danh sách nhân viên đang hoạt động, trừ chủ quán và tài khoản mẫu có PIN công khai; không có ai đủ điều kiện thì báo trước khi gửi mã
- [ ] 15.5 Cảnh báo người nhận phải tự nhập và tự đọc mã; nhập email mới, khác email hiện tại; gửi mã tới email mới; mỗi xác nhận chỉ có một mã email mới còn hiệu lực
- [ ] 15.6 Hành động `transferOwnership`: sau khi mã đúng mới kiểm hạn mức của email mới
- [ ] 15.7 Trong một giao dịch: kiểm lại tài khoản được chọn, đổi chủ, đổi A thành tài khoản thường rồi B thành `owner`, đặt cờ buộc đổi PIN cho B, hủy phiên của hai người, hủy mã còn dở, ghi `ownership_transferred`
- [ ] 15.8 Gửi thư báo tới hai email
- [ ] 15.9 Kiểm thử: TC-OWNER-65…69, 84, 88, 89, 90, 96, 97, 98, 99

## 15b. Reset dữ liệu quán

- [ ] 15b.1 Hiện trong mục Cài đặt, chỉ với tài khoản chủ quán; bốn bước theo quyết định 30
- [ ] 15b.2 Chốt cách đưa dữ liệu về rỗng, gồm dữ liệu chỉ thêm không sửa của sổ thanh toán
- [ ] 15b.3 Hành động `resetStoreData` trong một giao dịch; giữ những gì quyết định 29 liệt kê; không đặt giới hạn riêng cho số lần reset; không tự tạo lại dữ liệu mẫu, đóng luồng dữ liệu mẫu trong `private.initial_seed_workflows` và đồng bộ `seed_status`; báo cho các máy tải lại
- [ ] 15b.4 Hủy phiên của mọi nhân viên trước khi xóa, gồm cả người đang thao tác; các máy quay về màn nhập PIN; chặn giao dịch thanh toán đến muộn
- [ ] 15b.5 Ghi `store_data_reset` vào nhật ký
- [ ] 15b.6 Ghi danh sách ảnh cần xóa trong giao dịch; xóa sau giao dịch, lỗi thì tiến trình đối soát thử lại
- [ ] 15b.7 Kiểm thử: TC-OWNER-70…74, 85, 86, 102

## 16. Kiểm thử giai đoạn 2

- [ ] 16.1 Chạy các ca TC-OWNER-49…77, 79, 83…90, 96…100, 102 theo mục Cách chạy của `testplan.md`
- [ ] 16.2 Xoay khóa mã hóa: bản ghi mã hóa bằng khóa cũ vẫn giải mã được nhờ cột phiên bản
- [ ] 16.3 Sao lưu staging trước lần đầu chạy reset và chuyển quyền. Test tay trên staging, chỉ trên quán thử: quên key, cấp lại key, ghép lại thiết bị, quên PIN, đổi email, chuyển quyền, reset; dọn quán thử sau khi chủ dự án xác nhận

## 17. Tài liệu giai đoạn 2

- [ ] 17.1 Cập nhật `docs/features.md` và `docs/screens.md` cho các luồng khôi phục, chuyển quyền và reset
- [ ] 17.2 Ghi quy trình xoay khóa mã hóa vào tài liệu vận hành
- [ ] 17.3 Cập nhật `docs/demo-runbook.md` với kịch bản demo phần khôi phục
- [ ] 17.4 Cập nhật tiến độ trong `docs/roadmap.md`, ghi ngày
- [ ] 17.5 Cập nhật `docs/data-model.md` cho `owner_action_proofs`, `store_key_rotations`; cập nhật `docs/limitations.md`: token còn dùng được sau khi cấp lại key, chủ cũ còn biết Store Key, email thứ hai của người bán, giả lập không chứng minh được bảo mật
- [ ] 17.6 Chạy `openspec archive add-owner-account-and-store-provisioning` sau khi cả hai giai đoạn trong phạm vi xong. Khi archive, giữ liên kết tới mục hoãn sau đồ án.

## Sau đồ án — Đối soát tự động lượt tạo quán

Quyết định 48 hoãn tiến trình tự tìm lượt chưa rõ, xác minh Auth, tiếp tục hoặc dọn tài khoản kỹ thuật dở dang và cảnh báo vận hành. Mở lại khi có nhu cầu vận hành quán thật. Tái dùng operation, bước cuối, claim và dấu hiệu Auth đã lưu. Cần chốt thời hạn xử lý và bằng chứng để hoàn suất trước khi triển khai phần này.
