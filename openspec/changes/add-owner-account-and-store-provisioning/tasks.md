# Danh sách việc

Cập nhật 19/11/2026 sau khi [PR #37 vào main](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-pr37-main-2026-11-19). Mốc rà checklist trước đó là [đối chiếu T06 ngày 17/11](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-doi-chieu-tai-lieu-2026-11-17). Dấu kiểm giai đoạn 1 gắn với nguồn và môi trường đã thực hiện trong hồ sơ. Hồi quy trên bộ bản vá cuối được theo dõi riêng. Đặc tả giai đoạn 2 đã viết, phạm vi triển khai theo T08/T09. Chủ thao tác trên POS theo quyết định 23, 24.

Chia hai giai đoạn theo quyết định 18. Giai đoạn 1 đưa luồng tạo quán có OTP và chặn đường tạo cũ. Các chức năng khôi phục dành cho chủ ở giai đoạn 2. Tự động đối soát lượt tạo quán dở dang nằm sau đồ án theo quyết định 48.

Thứ tự tổng thể xem `docs/roadmap.md` và `docs/workflow/g01-g10-plan.md`. Reset dữ liệu xếp ở giai đoạn 2 trong kế hoạch, chưa thực hiện ngay (quyết định 36).

---

# Giai đoạn 1 — Danh tính và kiểm soát việc tạo cửa hàng

## 0. Cổng trước khi code thực tế và thứ tự test

- [x] 0.1 Rà và chốt ma trận expected FE trong `testplan.md` trước khi viết code thực tế. Bao gồm lỗi OTP, thời gian chờ, F5, chống tạo trùng, nhận Store Key, ghép máy và PIN.
- [x] 0.2 Khi được giao code, hiện thực FE/ports/mock với OTP lấy từ hộp thư giả, chạy qua cổng mock trước khi nối FE với staging. Giữ cấu hình signup hiện tại.
- [x] 0.3 Sau khi mock đạt, T05 sẵn sàng và hoàn tất cổng chuyển đổi mục 8, chạy vòng staging với OTP thật, Auth/DB thật; sau đó chạy mục 1c.5. Lưu hai kết quả theo cấu hình, nguồn và fixture.

  TC-104 ngày 12–13/11 ghi hai vòng staging liên quan 1c.5, cấu hình trước/sau, nguồn và fixture. Ngày 17/11 bổ sung chứng cứ 8.7–8.8 để chốt ô tổng. [Hồ sơ T06](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-87-88-2026-11-17).

## 1. Đường gửi email — làm ngay, không có việc nào phải chờ duyệt

Mốc phải đạt là mức 1 ở quyết định 15. Mức 3 là phần thưởng nếu xin được tên miền, **không** phải điều kiện.

Khi triển khai đường gửi OTP và Store Key, hàm phía server sẽ đọc hai key trong **Edge Functions → Secrets** của project staging `ineckiashpwloncxnbqx`. Thư mặc định của Supabase Auth có cấu hình riêng.

| Key | Giá trị nhập trong Secrets |
| --- | --- |
| `POS_CAFE_SMTP_USER` | Địa chỉ Gmail đầy đủ của hộp thư gửi của dự án |
| `POS_CAFE_SMTP_APP_PASSWORD` | App Password được tạo trên cùng tài khoản Gmail gửi |

Ngày 11/11/2026, chủ dự án xác nhận đã lưu cả hai key. Phép thử Edge trên staging đã xác thực SMTP và thư vào Hộp thư đến. Hộp thư gửi hiện tại là Gmail chính của chủ dự án. Có thể thay bằng hộp thư riêng sau. [Hồ sơ T06](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md)

- [ ] 1.1 Tạo một tài khoản Gmail riêng của dự án, không dùng tài khoản cá nhân
- [ ] 1.2 Bật xác thực hai bước cho tài khoản đó, rồi tạo App Password
- [x] 1.3 Xác minh TLS tới `smtp.gmail.com:465` từ Edge Function trên staging và xác thực SMTP bằng hai Secrets trên. Giữ App Password trong Secrets của Edge. [Giới hạn Edge Functions](https://supabase.com/docs/guides/functions/limits#other-limits--restrictions)
- [x] 1.4 Gửi thử và xác nhận thư đến Hộp thư đến của Gmail
- [x] 1.5 Ghi lại hạn mức nhà gửi và kiểm nhu cầu gồm cả OTP, thư Store Key sau tạo và thư đang chờ. Trần 400 lượt theo quyết định 39 không bao gồm thư Store Key. Nếu ngân sách thật không đủ, báo đánh đổi và chốt phương án trước tích hợp phụ thuộc.

### 1b. Nâng lên mức 3, chạy song song và không chặn gì

- [ ] 1b.1 Kiểm tra chương trình cấp tên miền `.id.vn` hoặc `.io.vn` miễn phí còn hiệu lực không, nộp hồ sơ nếu có
- [ ] 1b.2 Đăng ký GitHub Student Developer Pack bằng email trường, nhận tên miền kèm theo
- [ ] 1b.3 Xin được tên miền thì xác minh nó ở nhà cung cấp gửi email và cấu hình bản ghi xác thực người gửi
- [ ] 1b.4 Chuyển thông tin SMTP sang tên miền mới, chạy lại phép thử ở mục 1.4
- [ ] 1b.5 Không xin được trước tuần 14 thì giữ mức 1 và ghi lý do vào `docs/limitations.md`

## 1c. Chặn thư mẫu của Supabase Auth

- [ ] 1c.1 Đối chiếu tài liệu chính thức của Supabase, chọn cơ chế chặn
- [ ] 1c.2 Cài cơ chế chặn trước khi phát hành giai đoạn 1; xác nhận Store Key và POS vẫn hoạt động
- [x] 1c.3 Ghi vào `docs/limitations.md` rủi ro đã chấp nhận khi cơ chế chặn bị tắt
- [x] 1c.4 Kiểm thử: TC-OWNER-78
- [x] 1c.5 Sau vòng staging đầu tiên đạt, tắt signup công khai trên đúng project staging rồi chạy lại TC-OWNER-104. Kiểm signup trực tiếp bị từ chối, Admin API vẫn tạo được tài khoản kỹ thuật và ma trận FE cơ bản vẫn đạt. Ghi cấu hình trước/sau và điều kiện nếu phải quay lại bản cũ.

## 2. Lược đồ và migration

Mục này chuẩn bị và kiểm gói migration trên lane cô lập đã được phép. Chỉ áp lên staging ở mục 8, sau khi xác nhận đã dọn dữ liệu cũ và bảng `stores` rỗng.

- [x] 2.0 Xác nhận cấu hình ứng dụng, CLI và hàm phía server đều trỏ tới staging, không còn trỏ database gốc

  Đường Preview, Edge và công cụ cutover dùng trong T06 đã xác minh đúng đích. Ngày 19/11, Supabase CLI xác nhận checkout PR #37 có đúng một project liên kết với staging. [Biên nhận CLI](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-cli-staging-linked-2026-11-19).
- [x] 2.1 Thêm enum `store_status` gồm `active` và `suspended`
- [x] 2.2 Thêm enum `store_admin_action` gồm các giá trị ở `design.md`
- [x] 2.3 Tạo bảng `owner_accounts`
- [x] 2.4 Thêm cột `owner_account_id` vào `stores`, bắt buộc, **không** đặt ràng buộc duy nhất
- [x] 2.5 Thêm cột `status` vào `stores`, bỏ cột `is_active`
- [x] 2.6 Thêm cột `key_secret_encrypted` và `key_encryption_version` vào `stores`
- [x] 2.7 Tạo các bảng `otp_challenges`, `otp_request_outcomes`, `otp_attempts`, `create_intents`, `create_operations`, `auth_create_dispatches`, `mail_dispatches`, `store_admin_log` theo `design.md`
- [x] 2.8 Viết kiểm thử khẳng định không tồn tại ràng buộc duy nhất nào trên `stores.owner_account_id`

## 3. Quyền dữ liệu và khóa quán ở database

- [x] 3.1 Áp điều kiện `stores.status = 'active'` tại RLS và các checkpoint của RPC nghiệp vụ theo ma trận trong `design.md`. Giữ ACL đóng bảng thô. Kiểm dưới khóa trạng thái của quán sau các lần đợi liên quan.
- [x] 3.2 Trả đúng `storeId`, `storeNo`, `status` qua `permission_get_store_session` cho thiết bị đã ghép của chính quán. Cập nhật hợp đồng adapter đang dùng RPC này.
- [x] 3.3 Xác nhận nhánh thiết bị đã ghép giữ nguyên; không thêm nhánh chủ
- [x] 3.4 Các bảng mới của `design.md` không cấp quyền cho máy người dùng; các cột bí mật mới trên `stores` không cho thiết bị đọc
- [x] 3.5 Thu hồi quyền của máy người dùng trên `permission_reserve_store_no` và hàm khởi tạo quán
- [x] 3.6 Kiểm TC-OWNER-95 và TC-OWNER-111 trên lane DB contract/tích hợp cô lập. Kiểm gọi thẳng các hàm ở 3.5 bị từ chối. Đổi trạng thái và `store_status_changed` commit cùng giao dịch với tác nhân nội bộ có quyền. Kiểm cạnh tranh và rollback.
- [x] 3.7 Chặn Storage staging và GET/revalidate qua cổng ảnh hiện hành khi quán tạm ngưng. Giữ ảnh công khai đời cũ trong phần giới hạn, giữ ACL của bucket private và RLS của tín hiệu theo quán.

## 4. Hàm phía server

- [x] 4.1 Dựng khung hàm tại `supabase/functions/`
- [x] 4.2 Khai báo biến môi trường cho khóa quản trị nền tảng, khóa mã hóa Store Key, khóa băm mã xác nhận, khóa riêng mã hóa OTP chờ gửi và thông tin SMTP. Chỉ môi trường server giữ các giá trị này
- [x] 4.3 Viết tiện ích mã hóa và giải mã phần bí mật, có mang định danh phiên bản khóa
- [ ] 4.4 Dựng phần gửi và kiểm mã dùng chung theo thứ tự ở `design.md`: giới hạn theo email riêng từng loại thao tác, giới hạn theo địa chỉ mạng và trần toàn dự án tính chung

  Đã có phần OTP tạo quán và bằng chứng TC-103. Các loại thao tác của chủ ở giai đoạn 2 còn theo mục 11b.
- [x] 4.5 Cài hạn mức 5 cửa hàng, đọc từ cấu hình chứ không phải hằng số trong mã, kiểm sau khi mã đúng; không giới hạn số lần tạo trong ngày
- [x] 4.6 Hành động `requestCreateStoreOtp`, `verifyAndAcceptCreate`, `getCreateStatus`, `confirmStoreKeySaved`. Ghi liên kết chỉ tra cho ID mới cùng intent đã được chấp nhận dưới khóa, tối đa 64 mỗi operation. Sửa mock theo quyết định 54 để lượt đã bị từ chối giữ kết quả cũ ở cả gửi lại và tra sau F5. Kiểm TC-OWNER-109. Điểm vào provisioning nội bộ chỉ xử lý operation đã chấp nhận và có giữ chỗ; tách quyền hỏi trạng thái khỏi nhận key hoặc ghi.
- [x] 4.7 Giữ số riêng cho từng lần chọn số của operation. Chỉ cho lượt gốc còn hạn đổi số sau khi đã xác nhận xung đột Auth không có tác dụng phụ. Mỗi số chỉ cấp một quyền phát lệnh Auth. Điểm ghi quán đọc số và UUID từ bản ghi nội bộ, đối chiếu với bản ghi Auth thực, kiểm lại quyền của lượt rồi ghi quán, kết quả, audit, thư chờ và workflow mẫu trong cùng giao dịch. Kiểm TC-OWNER-27/30/41/47/105
- [x] 4.8 Xử lý lượt tạo dở trong phạm vi đồ án: giữ suất, trả `unknown` khi hết hạn kể cả nếu lượt gốc dừng trước khi ghi trạng thái, từ chối ghi muộn và giữ tham chiếu Auth. Tra/gửi lại chỉ đọc hoặc nhận kết quả theo contract, không khởi chạy tạo lại. Kiểm các ca crash và quota trước nghiệm thu.
- [x] 4.9 Ghi `store_created` vào `store_admin_log`
- [x] 4.10 Kiểm TC-OWNER-103/105/106/108: kiểm hạn OTP sau khóa challenge và khóa hạn mức, đếm riêng lượt gửi, lần sai và suất quán; chặn bypass; chỉ trả Store Key theo REQ-STORE-04, giữ bí mật server; kiểm Auth đến muộn trước khi trả quota.
- [x] 4.11 Dùng tác vụ gửi thư độc lập cho bản ghi Store Key `queued` của quán đã `created`. Kiểm TC-OWNER-44 ngay cả khi lượt tạo dừng sau commit và trước khi gửi. Kiểm TC-OWNER-110 để tách phản hồi gốc khỏi gửi lại, tra trạng thái và thư. Mock cần mô phỏng một lời gọi xác minh gốc còn chờ khi quán commit sau hạn OTP. Thư lỗi không làm hỏng quán và không hoàn suất.
- [ ] 4.12 Đối chiếu tài liệu Supabase về tạo user bằng API quản trị và `app_metadata` trước khi tạo tài khoản thật

  TC-40 đã có bằng chứng Admin API và dấu dispatch. Chưa tìm thấy biên nhận đối chiếu tài liệu trước lần tạo thật đầu tiên.
- [x] 4.13 Tách phần gửi thư và phần lưu trữ khỏi các quy tắc, để chạy test trên máy với database giả và đường gửi thư giả; hàm thật không có chế độ test, không có mã xác nhận dùng chung, có kiểm cận dưới của các giá trị cấu hình
- [x] 4.14 Ghi workflow seed cùng giao dịch tạo quán. Server nhận lần đầu sau commit, kể cả khi mất kích hoạt. Ghi cả bộ mẫu và `completed` trong một giao dịch, có audit tác nhân hệ thống. Tuần tự hóa thử lại, bỏ mẫu và ghi mẫu theo cùng workflow, chặn lượt cũ. Chỉ mở nghiệp vụ phía server khi có `completed` hoặc `skipped` đã xác nhận. Kiểm TC-OWNER-03/09
- [x] 4.15 Ghi đúng một thư OTP tạo quán có bản mã cùng giao dịch phát mã. Tác vụ server nhặt thư `queued` còn hiệu lực, nhận đúng một lượt, xóa bản mã khi nhận hoặc khi mã mất hiệu lực. Kiểm mất kích hoạt, mất kết quả SMTP và nhiều tiến trình tranh gửi ở TC-OWNER-107

## 5. Ports và adapters

- [ ] 5.1 Thêm `IOwnerActionPort` và `IStoreProvisioningPort` vào `src/ports`, khai bằng type của `domain`
- [ ] 5.2 Thêm type tương ứng vào `src/domain`
- [x] 5.3 Hiện thực adapter Supabase gọi hàm phía server
- [x] 5.4 Hiện thực adapter mock đóng vai server, database và thư, đủ để dựng mọi kịch bản mà không cần hàm thật; thời gian là cấu hình, ví dụ 10 phút xuống 15 giây; test đọc được mã
- [ ] 5.5 Nối hai port mới vào `AppPorts` và `src/app/runtimePorts.ts`
- [x] 5.6 Chạy `src/architectureBoundaries.test.ts`, xác nhận không vi phạm ranh giới

`IStoreProvisioningPort`, kiểu tạo quán và wiring hiện hành đã có. Phần `IOwnerActionPort` cho thao tác giai đoạn 2 trong 5.1/5.2/5.5 còn mở. Kết quả 5.6 đến từ CI lịch sử đạt ở lượt chạy lại, với lỗi lượt đầu còn theo dõi.

## 6. Màn hình giai đoạn 1

- [x] 6.1 Màn tạo quán: nhập email, tên hiển thị bắt buộc, địa chỉ tùy chọn, PIN chủ quán, tùy chọn dữ liệu mẫu
- [x] 6.2 Màn nhập mã, kèm xử lý hết hạn, quá số lần sai và khóa nút Gửi lại tới mốc hẹn
- [x] 6.3 F5 bỏ form và biên nhận gửi mã. Sau Xác nhận chỉ lưu `attemptId` qua F5 để tra trạng thái; nếu lỗi lưu thì cảnh báo và vẫn cho làm tiếp. Giữ đồng hồ theo giờ server trong trang còn mở.
- [x] 6.4 Thông báo khi chạm trần cửa hàng, kèm hướng dẫn liên hệ nhà cung cấp
- [x] 6.5 Màn kết quả tạo quán: hiển thị Store Key kèm nút sao chép và nút "Tôi đã lưu Store Key", nhắc chủ sao chép và lưu lại ngay
- [x] 6.6 Xóa mã tra khi người dùng rời kết quả cuối; giữ khi còn chưa rõ. Bỏ form khi F5 theo quyết định 46, không có bản nháp lưu lâu cần TTL.
- [x] 6.7 Sau ghép máy và đăng nhập, hiển thị màn chờ hoặc màn lỗi theo trạng thái server. Chỉ chủ có phiên bình thường thấy hai lựa chọn ở màn lỗi. Khi server xác nhận sẵn sàng, tải dữ liệu rồi tự mở POS. Kiểm TC-OWNER-03/09

## 7. Gỡ luồng tạo cửa hàng cũ

PR #37 đã đưa 7.1, 7.2 và 7.4 vào `main` ngày 19/11. Sáu ca hồi quy của phạm vi 7.4 đạt trên cùng cây nguồn. [Biên nhận tích hợp](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-pr37-main-2026-11-19).

- [x] 7.1 Gỡ luồng tạo cửa hàng phía client ở `src/app/screens/CreateStoreScreen.tsx`, gồm đường `auth.signUp` và gọi bootstrap trực tiếp
- [x] 7.2 Cập nhật `src/adapters/supabase/authRepo.ts` cho khớp hợp đồng mới
- [x] 7.3 Xác nhận màn ghép thiết bị bằng Store Key giữ nguyên hành vi, theo quyết định 13
- [x] 7.4 Cập nhật các kiểm thử đang dựa vào luồng tạo cửa hàng cũ
- [x] 7.5 Sửa `tests/supabase/pos-cafe-supabase.spec.ts`: bỏ bước tạo quán, ghép vào quán thử tạo sẵn trên staging với Store Key qua biến môi trường

  Ngày 17/11, `npm run smoke:supabase` đạt 5/5 với quán thử `0004` trên Supabase staging. Hậu kiểm thấy 0 đơn mở và quyền thu ngân đã trở lại trạng thái ban đầu. [Kết quả và biên nhận](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-smoke-75-2026-11-17).

## 8. Cổng chặn — chuyển đổi staging trước vòng tích hợp

> Không được vượt qua mục này nếu chưa đủ điều kiện. Đây là thao tác không hoàn tác được.

- [x] 8.1 Trình danh sách quán, cách xử lý tài khoản Auth kỹ thuật và phiên cũ, dữ liệu phụ thuộc sẽ xóa trên đúng staging, lịch chuyển đổi và cách phục hồi. **Chốt phạm vi và lần thực thi với chủ dự án.** Lựa chọn dùng quán mới ngày 11/11/2026 không thay cho xác nhận này
- [x] 8.2 Sao lưu toàn bộ database
- [x] 8.3 Sao lưu toàn bộ kho ảnh
- [ ] 8.4 Sao lưu khóa mã hóa Store Key nếu đã cấu hình, cất tách khỏi bản sao lưu database; xác nhận đường phục hồi trước khi chuyển đổi

  Điều kiện sao lưu khóa trước cutover không áp dụng cho lược đồ cũ chưa có khóa này. Khóa mới được sao lưu DPAPI tách khỏi dump sau khi cấu hình.
- [x] 8.5 Chặn ghi từ ứng dụng và luồng tạo quán cũ, rồi xóa đúng phạm vi đã duyệt trên staging. Giữ cấu hình signup công khai theo quyết định 45
- [x] 8.6 Ghi thời điểm và phạm vi đã xóa; kiểm `stores` rỗng. Nếu còn quán hoặc chưa xác nhận được kết quả, dừng trước khi áp lược đồ cuối
- [x] 8.7 Áp migration mục 2. Kiểm `owner_account_id NOT NULL`, đường tạo quán cũ không ghi được và dùng fixture tạo mới cho vòng staging. Dựng dữ liệu demo theo `docs/demo-runbook.md`

  Migration, hậu kiểm khóa luồng cũ và fixture mới đã có. Ngày 17/11 đã đọc lại dữ liệu demo của `0004` và `0029`, rồi mở POS của `0004` từ app local nối staging. Projection và màn hình khớp một khu, bốn bàn với nền mặc định và bảy decor. [Đối chiếu 8.7–8.8](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-87-88-2026-11-17).
- [x] 8.8 Kiểm Store Key và phiên cũ không còn truy cập POS của các quán đã xóa. Thông báo thiết bị dùng key cũ phải ghép lại bằng key mới

  Cutover đã dọn quán, Auth, phiên và refresh token cũ. Ngày 17/11 Auth staging từ chối cả ba Store Key cũ và cả ba lần làm mới phiên trong backup trước cutover. Đã báo Linh, người nhận phiên demo trong hồ sơ, gỡ ghép và dùng Store Key hiện hành nếu mở lại máy hoặc tab cũ. [Đối chiếu 8.7–8.8](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-87-88-2026-11-17).

## 9. Kiểm thử giai đoạn 1

Chạy các ca trong `testplan.md` thuộc giai đoạn 1 theo mục Cách chạy của file đó. Nhóm bảo mật và quyền là bắt buộc.

- [x] 9.1 Chạy nhóm luồng chính TC-OWNER-01…10 ([đối chiếu nhóm ngày 16/11](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-checklist-9-2026-11-16) và [hồi quy TC-09 ngày 17/11](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#tc09-local-2026-11-17))
- [x] 9.2 Chạy nhóm luồng ngoại lệ TC-OWNER-11…30 ([hồi quy TC-29(b,c)/30 trên DB cô lập ngày 16/11/2026](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#tc29bc-30-local-2026-11-16))
- [x] 9.3 Chạy nhóm biên TC-OWNER-31…36 ([bằng chứng DB cô lập và mock ngày 16/11/2026](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#t06-checklist-9-2026-11-16))
- [x] 9.4 Chạy nhóm bảo mật TC-OWNER-37…48, cùng TC-OWNER-78, 80, 81, 82, 91…95, 101 ([hồi quy TC-47(d) và TC-92 theo tiêu chí chốt ngày 17/11/2026](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#tc47d-92-local-2026-11-17))
- [x] 9.5 Test tay trên staging, chỉ trên quán thử: các ca được liệt kê ở mục Cách chạy; tạo cửa hàng từ đầu tới lúc ghép được thiết bị; xử lý quán thử theo quyết định của chủ dự án. Linh xác nhận giữ `0005/0017/0018` hoàn tất phần xử lý dữ liệu thử của 9.5. [Bằng chứng test tay và kiểm kê](../../../docs/workflow/tasks/g01-g10-t06-staging-inventory-2026-11-17.md) · [Quyết định đóng 9.5 ngày 17/11](../../../docs/workflow/tasks/g01-g10-t06-cleanup-preflight-2026-11-17.md#t06-retention-decision-2026-11-17)
- [x] 9.6 Chạy TC-OWNER-103…111 theo lane trong testplan. Hai vòng staging TC-OWNER-104 đã chạy và phần TC-105(5) đã kiểm trên DB cô lập ([đối chiếu](../../../docs/workflow/tasks/g01-g10-t06-owner-implementation-2026-11-11.md#tc29bc-30-local-2026-11-16)).

## 10. Tài liệu giai đoạn 1

- [x] 10.1 Cập nhật `docs/requirements.md`: FR-01, FR-02, mở rộng phạm vi NFR-02
- [x] 10.2 Cập nhật `docs/architecture.md`: thêm thành phần chạy phía server
- [x] 10.3 Cập nhật `docs/data-model.md`: cột mới và bảng mới
- [x] 10.4 Cập nhật `docs/screens.md`: màn tạo quán và màn kết quả
- [x] 10.5 Cập nhật `docs/limitations.md`: rủi ro mất khóa mã hóa, Store Key nằm lại trong hộp thư, thư mặc định của Supabase Auth khi cơ chế chặn bị tắt và lượt tạo chưa rõ có thể giữ suất đến khi xác minh riêng theo quyết định 48.
- [x] 10.6 Cập nhật `pos-cafe-context.md` và `docs/features.md`
- [x] 10.7 Cập nhật tiến độ trong `docs/roadmap.md`, ghi ngày

---

# Giai đoạn 2 — Khôi phục và vòng đời quyền sở hữu

## 11. Quên Store Key

- [x] 11.1 Hành động `forgotStoreKey`, không cần đăng nhập, không cần mã
- [x] 11.2 Luôn trả phản hồi chung chung, không tiết lộ email có tồn tại hay không
- [x] 11.3 Giới hạn 3 lần mỗi giờ tính theo email, cộng giới hạn theo địa chỉ mạng và trần toàn dự án; trả phản hồi trước rồi mới tra chủ và gửi thư; bỏ quán ở `pending` ra khỏi thư; từ `applied` cho phép gửi key hiện tại
- [x] 11.4 Dựng email liệt kê dạng danh sách: tên cửa hàng, địa chỉ lấy từ `store_settings`, Store Key
- [x] 11.5 Thêm câu nhắc dùng chức năng cấp lại nếu nghi hộp thư đã bị lộ
- [x] 11.6 Một thành phần giao diện dùng chung, gắn ở hai lối vào: màn ghép thiết bị và mục Cài đặt
- [ ] 11.7 Kiểm thử: TC-OWNER-49…51, 100
- [x] 11.7a Lát Quên Store Key đã hiện thực và kiểm cục bộ trên PostgreSQL với SMTP giả và UI mock. [Phạm vi và bằng chứng local](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#kiem-quen-store-key-20261126).
- [x] 11.7b Kiểm staging một quán từ màn Ghép thiết bị. Hộp thư đăng ký nhận đúng key hiện hành và tab đã ghép tải lại bằng cùng phiên Auth. [Bằng chứng staging](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#staging-quen-store-key-20261126).
- [x] 11.7c TC-OWNER-49 đạt trên staging cho email đứng tên hai quán. Hai lối vào có cùng lời giải thích. Một yêu cầu từ Cài đặt gửi đúng hai key và giữ phiên Auth, phiên nhân viên của quán đã ghép. [Bằng chứng hai quán](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#tc-owner-49-hai-quan-staging-20261126).
- [x] 11.7d Chạy lại TC-OWNER-50/51 và đối chiếu bốn nhánh TC-OWNER-100 trên PostgreSQL cô lập với SMTP giả, cùng Git tree của `e3021ef`. [Kết quả theo tiêu chí](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#tc-owner-50-51-100-20261126).
- [x] 11.7e TC-OWNER-50 và 51 đạt qua Cài đặt, Supabase staging và Gmail trên Protected Preview `e3021ef`. Alias có 0 thư. Email đăng ký có đúng ba thư, yêu cầu thứ tư trong một giờ vẫn trả cùng thông báo và phát sinh 0 thư thêm. [Bằng chứng staging](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#tc-owner-50-51-100-20261126).
- [x] 11.7f Sửa thứ tự TC-OWNER-100(c) và kiểm lại ca đồng thời, độ trễ với SMTP giả. Worker chỉ nhận email sau khi trình duyệt đọc phản hồi, hiện thông báo chung và xác nhận biên nhận. [Kiểm lại bản sửa](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#tc-owner-100c-receipt-20261126).
- [x] 11.7g Chốt theo bộ bằng chứng Linh duyệt ngày 26/11/2026, gồm PostgreSQL cô lập với SMTP giả và Protected Preview `0aa9345`. Bằng chứng TC-OWNER-49…51 trên Protected Preview thuộc `e3021ef`. [Quyết định nghiệm thu 11.7g](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#chot-nghiem-thu-117g-20261126).
  - [x] Chốt sửa và phát hành trên Protected Preview `0aa9345`. Worker chạy lúc xác nhận đang dừng và tạo 0 thư. Sau xác nhận, đúng một thư được gửi cho hộp thư thử. Alias có cùng thông báo và 0 thư.
  - **Chưa chạy trên hosted** · TC-OWNER-100(a), (b), (d) ở ngưỡng hạn mức dùng chung và phần SMTP chậm, so độ trễ phản hồi của TC-OWNER-100(c).

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
- [ ] 12.8 Hiện thực state machine `store_key_rotations` theo `design.md`: thế hệ key, tối đa một lượt `pending`/`applied`, dispatch attempt/token bất biến, chỉ tạo attempt mới sau `no_effect` đã chứng minh, xác minh kết quả `ambiguous` bằng key ứng viên, công bố ở `applied` và hoàn tất bằng DB. Sau 6 lỗi liên tiếp ghi một cảnh báo đã lọc và dừng claim tự động theo A. Cảnh báo hội tụ dùng `session_warning_until` từ TTL Auth. Phần tích hợp mail và thao tác chủ thực hiện M-A theo quyết định 60.
- [x] 12.8a Nền DB và kiểm hợp đồng local. Candidate riêng gồm schema, RPC nội bộ, audit và outbox rotation. Nối xác nhận OTP, worker Auth/SMTP và thao tác chủ ở các lát kế tiếp theo quyết định 59–60. [Bằng chứng lát 12.8a](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#hiện-thực-và-kiểm-lát-128a-ngày-25112026).
- [x] 12.8b Backend đổi key kiểm local. Gateway phát mã theo IP đã ký. Edge xác thực phiên quán và DB kiểm phiên chủ. Dùng mã OTP cùng giao dịch tạo rotation. Worker tiếp tục Auth, công bố key và gửi thư hỗ trợ. Kiểm trên DB thật cô lập với Auth và SMTP giả. [Bằng chứng 12.8b](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#kiem-backend-128b-20261126).
- [ ] 12.9 Kiểm thử: TC-OWNER-52…55, 87, 113…115. Mục tự về màn ghép và nghiệm thu UI vẫn thuộc 12.9, không suy đạt từ phép đo Auth 12.10
- [x] 12.9a UI Đổi Store Key và ghép lại máy A đạt trên Protected Preview `cd3e3e3` với OTP/SMTP thật. #0038 ghi B tự về màn ghép. #0039 xác nhận ghép một chạm trên A và nhập lại PIN vào POS trên A/B. TC-OWNER-52 đầy đủ tiếp tục theo mục 12.9. [Lượt #0038](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#staging-doi-store-key-0038-20261127) · [Lượt #0039](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#staging-doi-store-key-0039-20261127).
- [x] 12.10 Đối chiếu tài liệu Supabase về thu hồi phiên: đổi mật khẩu bằng API quản trị có chặn được việc làm mới token không, và đăng xuất theo tài khoản làm thế nào khi không có JWT của máy. Ghi hạn token thực tế của project. Nếu không chặn được thì người giữ key cũ không bị đẩy ra; phải báo chủ dự án

Mốc 25/11/2026 của 12.10: trên staging Auth `v2.198.0`, JWT 3.600 giây theo cấu hình và hai mẫu cấp thật. Admin đổi mật khẩu thành công trên quán thử #0033, key cũ bị từ chối, key mới ghép được, hai phiên Auth cũ không gia hạn được. Đã kiểm hai thao tác Auth cho worker chạy lại và khôi phục key fixture. Còn nghiệm thu UI ở 12.9 và tích hợp xử lý đồng thời ở 12.8. [Biên bản mục 12.10](../../../docs/workflow/tasks/g01-g10-t08-session-review-2026-11-24.md#kiem-auth-1210-20261125).

## Gỡ ghép riêng một thiết bị

- [x] Áp dụng phạm vi phiên hiện tại cho thao tác gỡ ghép và cho nhánh dọn phiên vừa tạo khi thông tin quán không khớp. Hai nhánh dọn đạt ở test adapter. Hành vi gỡ ghép trên hai phiên đạt theo TC-OWNER-112 trên Vercel staging ở `7014d3f`. [Biên bản kiểm thử](../../../docs/workflow/tasks/tc-owner-112-staging-2026-11-25.md).

Nhãn “Gỡ ghép thiết bị này” theo UC-OWNER-14 đã được triển khai và kiểm trực tiếp trên Vercel staging ở `e362c1d`.

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
