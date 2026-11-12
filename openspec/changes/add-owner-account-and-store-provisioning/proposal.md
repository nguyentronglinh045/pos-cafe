> **Đối chiếu xuất bản 25/10/2026.** Giữ quyết định owner-account đã ghi; các artifact còn placeholder chưa được điền trong lượt này (cập nhật 2026-11-05: đã điền). Role owner/forced-PIN hiện có không chứng minh email provisioning/recovery đã được thực hiện. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Tài khoản chủ cửa hàng và kiểm soát việc tạo cửa hàng

**Liên kết quyết định ngày 22/09/2026:** [force-default-pin-change](../force-default-pin-change/proposal.md) là dependency được chủ dự án giao trước phát hành permission model, chỉ owner tạo quán và operator recovery. Đây là biện pháp chuyển tiếp, chưa phải implementation của email owner/provisioning trong proposal này. Khi owner tự đặt PIN lúc tạo quán ở giai đoạn sau, có thể bỏ PIN tạm bootstrap; nếu recovery còn cấp PIN tạm thì phải giữ cờ bắt buộc đổi trước quyền vận hành. Các mô tả hiện trạng lịch sử bên dưới cần được khảo sát lại khi change email/provisioning bắt đầu, không dùng để khẳng định candidate ngày 22/09.

## Cập nhật 2026-11-05 — đọc trước

Chủ dự án đã chốt lại cách hoạt động. Tóm tắt:

- Chủ vào POS bằng PIN như mọi nhân viên. **Không có đăng nhập web riêng cho chủ.**
- Mã gửi qua email chỉ dùng để xác nhận từng thao tác: tạo quán, quên PIN chủ, cấp lại Store Key, đổi email, chuyển quyền, reset dữ liệu.
- Các thao tác của chủ làm trên POS, trong mục Cài đặt, và chỉ tài khoản chủ quán mới thấy.
- Mỗi email làm chủ tối đa 5 quán, không giới hạn số lần tạo trong ngày.
- Toàn bộ các luồng khôi phục, chuyển quyền và reset được đặc tả trong tuần 5 vì liên quan đến luồng chung (chốt 2026-11-04); giai đoạn triển khai không đổi.
- Tạo quán xong, màn hình cho sao chép Store Key; thư gửi kèm chỉ là hỗ trợ.

Các phần bên dưới viết trước ngày này được giữ làm lịch sử lập luận. Chỗ nào mâu thuẫn thì theo các quyết định 14, 20 và từ 22 trở đi.

| Quyết định cũ | Tình trạng |
| --- | --- |
| 2. Tách hai loại danh tính | Giữ ý tách danh tính; tài khoản chủ không còn đăng nhập được (quyết định 23) |
| 5. Vai trò chủ quán gắn với tài khoản chủ | Giữ. Vai trò chỉ đổi người qua chuyển quyền (quyết định 28); quên PIN đi qua mã email (quyết định 26) |
| 7. Mặt web tối thiểu của chủ | **Thay bởi** quyết định 23, 24 |
| 8. Quên Store Key | Giữ: gửi về email đã đăng ký, không cần mã; chủ dự án xác nhận lại 2026-11-05 |
| 9. Xóa dữ liệu cũ | Giữ; làm trên staging, không đụng database gốc (quyết định 44) |
| 10. Mã một lần, không mật khẩu | Giữ mã 6 số và không mật khẩu; mã không dùng để đăng nhập (quyết định 23) |
| 11. Khóa quán ở database | Giữ phần khóa; không còn nhánh chủ, nên ngoại lệ đọc trạng thái áp cho thiết bị đã ghép (quyết định 23) |
| 14. Hạn mức | Đã sửa: bỏ giới hạn 3 lần tạo mỗi ngày |
| 15. Đường gửi email | Giữ các mức; thông tin SMTP đặt ở hàm phía server, không cấu hình vào Supabase Auth (quyết định 31) |
| 16. Ba lớp rào chắn | Giữ; thứ tự bước ở quyết định 30 |
| 17. Đổi email và chuyển quyền | Giữ nhu cầu; cách làm ở quyết định 27, 28 |
| 18. Chia giai đoạn | Giữ; reset xếp ở giai đoạn 2 trong kế hoạch, chưa thực hiện ngay (quyết định 36) |
| 19. Cấp lại key chỉ trong phiên chủ, POS không có lối vào | **Thay bởi** quyết định 24 |
| 20. Các ngưỡng | Đã sửa: bỏ giới hạn tạo quán theo ngày và hạn phiên chủ; giới hạn gửi mã tính riêng từng loại (quyết định 25) |
| 21. Chừa đường nhiều cửa hàng | Giữ; bỏ ý mặt web hiển thị danh sách quán (quyết định 23); hành động của chủ trên POS lấy quán từ phiên của máy, không nhận qua tham số; chỉ truy vấn nội bộ mới nhận quán làm tham số |

## Why

Hiện tại bất kỳ ai mở ứng dụng cũng tạo được cửa hàng mới: chỉ cần nhập tên hiển thị và Admin PIN rồi bấm xác nhận. Không có bước xác minh danh tính nào ở trước.

Nguyên nhân nằm ở mô hình xác thực. Mỗi cửa hàng là một tài khoản Supabase Auth với email tổng hợp dạng `store{N}@store.pos.local`, mật khẩu chính là phần bí mật trong Store Key, và dự án bắt buộc phải tắt xác nhận email thì luồng tạo cửa hàng mới chạy được. Vì email là email giả nên không có gì để xác minh, và cũng không có kênh nào liên hệ được chủ cửa hàng.

Ba khoảng trống cùng một gốc:

1. **Không có danh tính thật của chủ cửa hàng.** Không kiểm soát được ai đang dùng hệ thống, không giới hạn được số cửa hàng, không chống được việc tạo hàng loạt.
2. **Tạo cửa hàng không nguyên tử.** Luồng hiện tại là một lời gọi đăng ký tài khoản cộng ba lần ghi bảng rời nhau ở phía client. Hỏng giữa chừng sẽ để lại tài khoản xác thực mồ côi không gắn với cửa hàng nào, và người dùng không có cách tự khắc phục.
3. **Mất Store Key là mất cửa hàng.** Phần bí mật đóng vai trò mật khẩu và không được lưu ở bảng nghiệp vụ nào, nên không có đường khôi phục. Với một quán thật thì đây là rủi ro mất toàn bộ dữ liệu kinh doanh.

Baseline spec `store-onboarding` đang mô tả đúng hành vi hiện tại, nên spec đó cũng phải đổi theo. Change này sửa `docs/requirements.md` ở FR-01 và FR-02, và mở rộng phạm vi bảo đảm của NFR-02.

Change này không lật một quyết định đã chốt: mô hình Store Key ghép thiết bị vẫn giữ nguyên. Nó bổ sung một tầng danh tính nằm trên, không thay thế tầng hiện có.

## What Changes

- Thêm khái niệm **tài khoản chủ cửa hàng** dùng email thật, bắt buộc xác thực email trước khi được phép tạo cửa hàng.
- **Tách hai loại danh tính.** Tài khoản kỹ thuật (service account) của cửa hàng giữ nguyên vai trò cho Store Key và cho thiết bị POS tại quán. Tài khoản chủ là một bản ghi riêng theo email, dùng để biết quán thuộc về ai và gửi mã xác nhận về đâu; nó không đăng nhập được. Xem quyết định số 23.
- Gắn cửa hàng với chủ qua trường định danh chủ sở hữu trên bản ghi cửa hàng. Chính sách bảo mật mức dòng giữ nguyên nhánh hiện có cho thiết bị, nên thiết bị đã ghép không bị ảnh hưởng.
- Chuyển việc tạo cửa hàng sang một lời gọi phía server chạy trọn vẹn trong một lần, thay cho chuỗi thao tác rời phía client. Lời gọi này kiểm tra mã xác minh email, kiểm tra hạn mức, tạo tài khoản kỹ thuật, ghi bản ghi cửa hàng, cấu hình cửa hàng và nhân viên chủ quán, rồi trả Store Key về để hiển thị kèm nút sao chép. Tạo xong hệ thống gửi thêm Store Key tới email chủ như một hỗ trợ kèm theo (quyết định số 22).
- Giới hạn số cửa hàng trên mỗi tài khoản chủ, enforce ở phía server. Không giới hạn số lần tạo trong ngày (quyết định số 14).
- Thêm trạng thái vòng đời cho cửa hàng. Không có trạng thái chờ xác thực, vì cửa hàng chỉ được tạo sau khi mã xác minh đúng; xem quyết định số 23.
- **Lưu phần bí mật của Store Key ở dạng mã hóa**, với khóa giải mã giữ trong môi trường của hàm chạy phía server chứ không nằm trong database. Nhờ vậy Store Key khôi phục lại được thay vì chỉ cấp mới.
- Thêm **hai chức năng khôi phục tách biệt**, phục vụ hai nhu cầu khác nhau:
  - **Quên Store Key**: chủ không nhớ key, không nghi ngờ bị lộ. Hệ thống giải mã và gửi lại **đúng key hiện tại** về email đã xác thực, kèm tên và địa chỉ cửa hàng. Store Key không đổi, các thiết bị đã ghép không bị ảnh hưởng.
  - **Cấp lại Store Key**: chủ nghi key đã lộ, ví dụ nhân viên nghỉ việc, mất thiết bị, key bị chụp ảnh. Hệ thống sinh phần bí mật mới, đổi mật khẩu tài khoản kỹ thuật rồi gửi Store Key mới. Key cũ không ghép được nữa, và mọi thiết bị đã ghép bị đăng xuất, phải ghép lại. Đây là thao tác có chủ ý, kèm cảnh báo rõ hậu quả.
- Mã gửi qua email dùng để xác nhận từng thao tác quan trọng, không dùng để đăng nhập. Chủ vào POS bằng PIN như mọi nhân viên, và làm các thao tác của mình trong mục Cài đặt. Xem quyết định số 23, 24.
- Thêm luồng **đổi email của tài khoản chủ** và luồng **chuyển quyền sở hữu cửa hàng** cho một người khác. Xem quyết định số 17, 27, 28.
- Thêm luồng **quên PIN của chủ quán** qua email đã đăng ký. Đây là đường tự phục vụ duy nhất khi chủ quên PIN; nhân viên quên PIN thì nhờ chủ quán hoặc người có quyền `employee.manage` đặt lại. Xem quyết định số 26.
- Thêm luồng **reset dữ liệu quán**, đưa quán về rỗng và chỉ chừa chủ quán. Xem quyết định số 29.
- Ghi nhật ký các thao tác quản trị cửa hàng: tạo cửa hàng, cấp lại Store Key, đổi trạng thái, đặt lại PIN chủ, đổi email, chuyển quyền, reset dữ liệu.

## Capabilities

### New Capabilities

- `owner-account`: tài khoản chủ theo email, không mật khẩu và không đăng nhập; mã xác nhận theo từng loại thao tác; hạn mức số cửa hàng; quên và cấp lại Store Key; quên PIN chủ; đổi email; chuyển quyền; reset dữ liệu; nhật ký thao tác quản trị.

### Modified Capabilities

- `store-onboarding`: việc tạo cửa hàng yêu cầu mã xác minh email của đúng lần tạo đó, chạy hoàn toàn phía server; Store Key hiển thị kèm nút sao chép, gửi thêm qua thư và khôi phục lại được.
- `store-isolation`: không thêm nhánh cho chủ vì không còn phiên chủ; trạng thái tạm ngưng được enforce ở tầng database. Xem quyết định số 11, 23.
- `employee-session`: không đổi bước chọn nhân viên và nhập PIN, nhưng ghi rõ ranh giới giữa chủ cửa hàng, thiết bị đã ghép và nhân viên đang vận hành.

## Impact

- Thêm một thành phần hàm chạy phía server vào kiến trúc triển khai. Kho mã hiện chưa có thành phần loại này, nên phát sinh bước triển khai và biến môi trường mới.
- Khóa quyền quản trị của nền tảng backend chỉ tồn tại phía server, không bao giờ xuống trình duyệt.
- Thêm một khóa mã hóa dùng cho phần bí mật của Store Key, giữ trong biến môi trường của hàm chạy phía server. Cần quy trình xoay khóa và phương án khi mất khóa, vì mất khóa nghĩa là không khôi phục được Store Key của mọi cửa hàng, chỉ còn đường cấp lại.
- Bảng cửa hàng thêm trường lưu phần bí mật đã mã hóa.
- Cần một đường gửi email riêng của dự án, mức tối thiểu là một tài khoản Gmail với App Password, phục vụ toàn bộ các luồng dùng email. Xem quyết định số 15.
- Bảng cửa hàng thêm trường định danh chủ sở hữu và trường trạng thái; thêm bảng nhật ký thao tác quản trị. Kéo theo migration.
- Chính sách bảo mật mức dòng thêm điều kiện trạng thái trên các bảng nghiệp vụ; không thêm nhánh cho chủ.
- Màn tạo cửa hàng và màn ghép thiết bị hiện tại phải thiết kế lại. Màn nhập PIN và mục Cài đặt của POS có thêm các lối của chủ quán. Không có mặt web riêng cho chủ.
- Luồng tạo cửa hàng hiện tại phải viết lại, không phải sửa nhỏ: nó đang để máy người dùng tự tạo tài khoản và tự sinh Store Key, trong khi mô hình mới làm các việc đó ở phía server.
- Cập nhật `docs/requirements.md` (FR-01, FR-02, NFR-02), `docs/features.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/screens.md`, `docs/limitations.md`, `pos-cafe-context.md`.
- Quy tắc PERM-13 của `redesign-permission-model` có thêm một ngoại lệ cho chuyển quyền.

## Ngoài phạm vi

- Quản lý nhiều cửa hàng cho một chủ, gồm màn chuyển đổi cửa hàng đang làm việc và báo cáo tổng hợp. Việc đó thuộc `add-multi-store-ownership` và `add-cross-store-reporting`. Change này chỉ dựng nền dữ liệu để các việc đó không phải làm lại phần dữ liệu chủ sở hữu.
- Thiết kế lại mô hình quyền của nhân viên trong cửa hàng. Việc đó thuộc `redesign-permission-model`.
- Siết ranh giới bảo mật per-employee xuống tầng database. Việc đó thuộc `enforce-permissions-at-database`.
- Luồng nhận cửa hàng cho dữ liệu tạo bằng luồng cũ, và mọi nhánh xử lý cửa hàng không có chủ sở hữu. Xem quyết định số 9: dữ liệu cũ bị xóa thay vì chuyển đổi.
- Xác thực bằng số điện thoại, đăng nhập qua nhà cung cấp bên thứ ba và xác thực hai lớp.
- Thanh toán, gói dịch vụ và tính phí thuê bao.
- Màn quản trị hệ thống dành cho nhà cung cấp dịch vụ. Việc đó tách thành `add-provider-admin-console`; xem quyết định số 12. Change này chỉ chuẩn bị nền là trường trạng thái, việc enforce trạng thái ở tầng database và bảng nhật ký.

## Phụ thuộc

- Phụ thuộc `redesign-permission-model`, vì change đó đưa vào vai trò chủ quán.
- Quy tắc PERM-13 của `redesign-permission-model` cấm mọi đường đổi vai trò chủ quán. Luồng chuyển quyền ở đây là ngoại lệ duy nhất: chạy ở hàm phía server, dưới mã xác nhận. Ghi ngoại lệ này vào PERM-13 khi đưa hai change vào đặc tả chính; nếu `redesign-permission-model` được lưu trữ trước thì change này thêm một delta MODIFIED cho `employee-management`.
- `add-multi-store-ownership` nên làm **sau** change này. Change này đã đưa vào khái niệm chủ sở hữu, nên nếu làm ngược thứ tự thì phần đó sẽ phải viết hai lần.
- `expand-e2e-coverage` nên có trước, vì thay đổi luồng vào ứng dụng chạm vào mọi kịch bản kiểm thử.

## Câu hỏi phải chốt trước khi làm

1. ~~Thiết bị tại quán có bắt buộc phải được chủ kích hoạt không?~~ **Đã trả lời ở quyết định số 13: giữ nguyên, không kích hoạt, không giới hạn số thiết bị.**
2. ~~Mỗi tài khoản chủ được tạo tối đa bao nhiêu cửa hàng?~~ **Đã trả lời ở quyết định số 14: trần 5, không giới hạn số lần tạo trong ngày, nới được từ màn nhà cung cấp. Sửa lại ngày 2026-11-04.**
3. ~~Các cửa hàng đã tồn tại chưa có chủ sở hữu xử lý thế nào?~~ **Đã trả lời ở quyết định số 9: xóa sạch, không chuyển đổi.** Câu hỏi gốc: Ba hướng: cho nhận cửa hàng bằng Store Key cộng email rồi xác thực, gán thủ công, hoặc coi là dữ liệu demo cũ và không xử lý.
4. ~~Chức năng cấp lại Store Key cần rào chắn tới mức nào?~~ **Đã trả lời ở quyết định số 16: ba lớp gồm cảnh báo, gõ lại tên cửa hàng, và mã một lần mới.**
5. ~~Dùng dịch vụ gửi email mặc định hay cấu hình nhà cung cấp riêng?~~ **Đã trả lời ở quyết định số 15: đường gửi riêng của dự án, chọn theo bốn mức vì không có ngân sách tiền; mức tối thiểu là Gmail với App Password.**
6. ~~Có cần màn quản trị hệ thống cho nhà cung cấp dịch vụ không?~~ **Đã trả lời ở quyết định số 12: có làm, nhưng tách thành change riêng `add-provider-admin-console`.**
7. ~~Trạng thái tạm ngưng của cửa hàng enforce ở tầng nào?~~ **Đã trả lời ở quyết định số 11: enforce ở tầng database, kèm ngoại lệ cho thiết bị đã ghép đọc trạng thái.**
8. ~~Có cần luồng đổi email chủ và luồng chuyển quyền sở hữu không?~~ **Đã trả lời ở quyết định số 17: làm cả hai trong change này.**
9. ~~Xác thực email dùng đường dẫn xác nhận hay mã dùng một lần?~~ **Đã trả lời ở quyết định số 10: mã một lần, không mật khẩu.** Câu hỏi gốc: Mã dùng một lần hợp với thiết bị tại quán hơn nhưng cần thêm màn nhập mã.
10. ~~Nếu chủ không hoàn tất xác thực email thì cửa hàng ở trạng thái chờ được giữ bao lâu trước khi dọn?~~ **Không còn áp dụng:** cửa hàng chỉ được tạo sau khi mã xác minh đúng, nên không tồn tại cửa hàng ở trạng thái chờ xác thực.
11. ~~Store Key được gửi tới chủ bằng cách nào, và đặt nút quên Store Key ở đâu?~~ **Đã trả lời ở quyết định số 8: gửi thẳng trong email, một luồng dùng chung ở hai lối vào.** Câu hỏi gốc: Hai điểm cần chốt: gửi thẳng Store Key trong nội dung email, hay gửi một đường dẫn mà chủ phải bấm mới xem được key trên trang web, để credential không nằm vĩnh viễn trong hộp thư và trong các thư chuyển tiếp. Và nút quên Store Key đặt công khai ngay màn ghép thiết bị chỉ cần nhập email, hay bắt đăng nhập tài khoản chủ trước. Nếu để công khai thì phản hồi phải chung chung, không tiết lộ email có tồn tại trong hệ thống hay không, và phải giới hạn tần suất gửi.
12. ~~Tài khoản chủ có màn quản trị riêng trên web không, hay chủ muốn quản trị cửa hàng thì vẫn phải ghép thiết bị và đăng nhập bằng PIN như mọi nhân viên khác?~~ **Đã trả lời ở quyết định số 23, 24: không có mặt web riêng; chủ đăng nhập POS bằng PIN.** Trước đó quyết định số 7 giữ mặt web ở mức tối thiểu.

Các câu nghiệp vụ ngày 2026-11-05 đã được trả lời ở quyết định 32–44. Signup, F5, ranh giới mock/staging, xử lý kết quả chưa rõ và điều hướng FE được chốt tiếp ở quyết định 45–49. Cách reset và thu hồi phiên thuộc giai đoạn 2. Nếu kiểm tra T05 cho thấy hạn mức thực tế của nhà gửi không đủ cho cả OTP và thư Store Key, cần chốt phương án đường gửi hoặc ngân sách thư trước phần tích hợp phụ thuộc.

**Đã chốt ranh giới T06:** REQ-STORE-03 chỉ yêu cầu giữ trạng thái chưa rõ, giữ suất và chống tạo trùng cho lượt tạo dở. Tự động đối soát, dọn tài khoản kỹ thuật dở dang và cảnh báo vận hành cho lượt đó nằm ngoài đồ án theo quyết định 48.

## Quyết định đã chốt

Ghi ngày 2026-08-28, theo trao đổi với người dùng.

1. **Cơ chế kiểm soát việc tạo cửa hàng: xác thực email của chủ.** Không dùng mã kích hoạt do nhà cung cấp phát, không dùng duyệt thủ công, không dùng mã dùng một lần qua số điện thoại.
2. **Kiến trúc danh tính: tách hai tài khoản.** Service account của cửa hàng giữ nguyên cho việc ghép thiết bị bằng Store Key; tài khoản chủ dùng email thật đã xác thực. Bản ghi cửa hàng giữ nguyên định danh hiện tại và chỉ thêm trường trỏ tới chủ, nên không phải chuyển đổi dữ liệu của cửa hàng đang chạy.
3. **Provisioning chạy phía server bằng hàm chạy ở biên**, không làm phía client. Lý do quyết định là các luồng khôi phục ở mục 4 và mục 6: giải mã phần bí mật của Store Key và đổi mật khẩu của một tài khoản khác đều bắt buộc dùng khóa mà trình duyệt không được phép giữ. Hai phương án phía client vì vậy không đáp ứng được. Lợi ích kèm theo là việc tạo cửa hàng trở thành một lời gọi duy nhất nên nguyên tử, và hạn mức cùng giới hạn tần suất enforce được ở nơi client không lách được.
4. **Email chủ là kênh khôi phục truy cập nâng cao**, trước mắt là các trường hợp quên hoặc mất Store Key, và quên PIN của vai trò chủ quán. Mọi việc khôi phục đi qua đúng kênh này, không mở kênh thứ hai.

5. **Vai trò chủ quán gắn cứng với tài khoản chủ.** Mỗi cửa hàng có đúng một nhân viên vai trò chủ quán, và bản ghi đó phải thuộc về chủ sở hữu tài khoản đã xác thực email. Không cho phép ủy quyền vai trò này cho người khác. Quyết định và lý do đầy đủ ghi ở mục câu 11 trong `redesign-permission-model`; change này chịu trách nhiệm phần ràng buộc gắn kết giữa hai tầng.

   Hệ quả trực tiếp: **câu hỏi số 8 ở trên mất quyền chọn ở vế chuyển quyền sở hữu.** Vì chỉ chủ sở hữu mới giữ được vai trò chủ quán, cửa hàng sẽ kẹt cứng khi chủ nghỉ, bán quán hoặc mất quyền truy cập email. Luồng chuyển quyền sở hữu vì vậy là bắt buộc, không còn là tùy chọn cắt được. Vế đổi email chủ vẫn để mở.

   Mỗi cửa hàng có một chủ sở hữu ở tầng phần mềm. Đây là quyết định thiết kế chứ không phải hạn chế: phần mềm quản lý vận hành cửa hàng, không ghi nhận quan hệ góp vốn và không phân xử tranh chấp giữa các bên. Kể cả quán hùn vốn thì vẫn có một người đứng ra làm chủ và chịu trách nhiệm, phần góp vốn thỏa thuận bên ngoài phần mềm. Lý do đầy đủ ghi ở mục câu 11 trong `redesign-permission-model`.

6. **Store Key lưu ở dạng mã hóa và khôi phục lại được.** Chọn hướng này thay vì chỉ cho cấp key mới, vì Store Key là bí mật dùng chung của cửa hàng chứ không phải mật khẩu cá nhân: nó vốn đã nằm trên nhiều thiết bị và thường được ghi ra giấy tại quầy. Bắt cả quán ghép lại toàn bộ thiết bị chỉ vì chủ quên key là hình phạt không tương xứng với rủi ro.

   Cách lưu: phần bí mật mã hóa trong database, khóa giải mã giữ trong môi trường của hàm chạy phía server. Người lấy được bản dump database vẫn không đọc được key vì thiếu khóa; phải chiếm được cả môi trường chạy của hàm.

   Giữ **hai chức năng tách biệt**, không gộp:

   | Chức năng | Dùng khi | Store Key | Thiết bị đã ghép |
   | --- | --- | --- | --- |
   | Quên Store Key | Chủ không nhớ, không nghi lộ | Giữ nguyên | Không ảnh hưởng |
   | Cấp lại Store Key | Nghi lộ: nhân viên nghỉ việc, mất thiết bị, key bị chụp ảnh | Đổi mới | Phải ghép lại toàn bộ |

   Bỏ hẳn chức năng cấp lại thì cửa hàng bị lộ key không có cách tự cứu, nên phải giữ; chỉ là nó chuyển thành thao tác hiếm và có chủ ý, thay vì là hệ quả bắt buộc của việc quên.

   Nội dung email khôi phục gồm Store Key kèm tên và địa chỉ cửa hàng. Hiện mỗi chủ một cửa hàng nên email liệt kê một dòng; cấu trúc dữ liệu đã cho phép nhiều cửa hàng nên về sau liệt kê nhiều dòng mà không phải sửa.

   Hệ quả với spec: requirement về bảo mật Store Key trong `store-onboarding` phải phát biểu lại, vì ý định gốc của nó là không khôi phục được.

7. **Mặt web của tài khoản chủ giữ ở mức tối thiểu** (lịch sử; **thay bởi quyết định 23, 24 từ 2026-11-05**).

   Lý do: chủ ghép được điện thoại của mình bằng Store Key rồi đăng nhập bằng PIN chủ quán như một thiết bị bình thường, nên báo cáo, cài đặt cửa hàng và quản lý nhân viên đều thao tác được từ xa qua đường đó. Dựng lại các màn đó trên web là nhân đôi giao diện mà không thêm năng lực. Chính sách bảo mật vì vậy chỉ cần mở nhánh chủ ở phạm vi hẹp thay vì trên nhiều bảng nghiệp vụ.

   Hệ quả cần nói rõ trên giao diện: cấp lại Store Key sẽ đăng xuất luôn thiết bị của chính chủ, chủ phải ghép lại bằng key mới.

8. **Quên Store Key: gửi thẳng key trong email, một luồng dùng chung ở hai lối vào.** Chủ dự án xác nhận lại 2026-11-05: gửi về email đã đăng ký, không cần mã.

   Nội dung email chứa luôn Store Key kèm tên và địa chỉ cửa hàng, không dùng đường dẫn trung gian. Chọn hướng này vì chủ thường đang đứng tại quán và cần dùng ngay; bắt bấm thêm một đường dẫn là thêm bước cho một việc vốn đã gấp.

   Đánh đổi đã cân nhắc và chấp nhận: Store Key nằm lại trong hộp thư và trong mọi thư chuyển tiếp. Giảm nhẹ bằng ba việc: giới hạn tần suất gửi, không bao giờ ghi Store Key vào nhật ký hệ thống, và trong email nhắc chủ dùng chức năng cấp lại nếu nghi hộp thư đã bị lộ.

   Hai lối vào, **dùng chung một thành phần giao diện**: nút ở màn tạo cửa hàng và ghép thiết bị, và nút ở màn Cài đặt trong ứng dụng. Cả hai mở cùng một hộp thoại: nhập email, gửi, xong. Lối vào ở màn Cài đặt phục vụ đúng tình huống hay gặp là chủ cần ghép thêm một thiết bị mới nhưng không nhớ key.

   Lối vào công khai ở màn ghép thiết bị bắt buộc trả về phản hồi chung chung, không tiết lộ email có tồn tại trong hệ thống hay không. Hệ thống chỉ gửi khi email khớp một tài khoản chủ đã xác thực, và chỉ gửi các cửa hàng thuộc chính chủ đó.

9. **Không chuyển đổi dữ liệu cũ. Xóa sạch và bắt đầu lại.**

   Các cửa hàng tạo bằng luồng cũ không được gắn chủ sở hữu, không có luồng nhận cửa hàng, và không được giữ lại. Khi triển khai change này, dữ liệu hiện có trên môi trường thật bị xóa toàn bộ.

   Chọn xóa thay vì bỏ qua, dù bỏ qua tốn ít công hơn. Lý do: bỏ qua buộc trường chủ sở hữu phải cho phép rỗng, kéo theo quyết định 5 không áp dụng được cho nhóm cửa hàng cũ, và hệ thống tồn tại hai mô hình danh tính song song mà mọi đoạn code lẫn mọi trang tài liệu đều phải xử lý cả hai. Xóa sạch thì trường chủ sở hữu bắt buộc ngay từ đầu, mọi bất biến ở các quyết định trên đứng vững, và không phát sinh nhánh nào cho dữ liệu cũ.

   Phạm vi thu hẹp được nhờ quyết định này: không cần màn nhận cửa hàng, không cần trường chủ sở hữu cho phép rỗng, không cần cửa sổ thời gian nhận cửa hàng, không cần nhánh xử lý cửa hàng không có chủ ở bất kỳ đâu.

    **Ghi chú chuyển đổi ngày 11/11/2026:** Chủ dự án chọn dùng quán thử tạo mới cho T06 và có thể bỏ hai quán fixture cũ vì đồ án chưa vận hành thực tế. Đích áp dụng là staging theo quyết định 44. Chuẩn bị và kiểm migration trước; tại lần chuyển đổi được duyệt, dọn dữ liệu cũ trước khi áp ràng buộc bắt buộc có chủ. Xem `design.md` và cổng xóa trong `tasks.md`.

   Điều kiện bắt buộc khi thực hiện, vì đây là thao tác không hoàn tác được:

   - Xác nhận rõ ràng từ chủ dự án trước khi chạy, không suy đoán.
   - Sao lưu toàn bộ database và kho ảnh trước khi xóa.
   - Ghi lại thời điểm thực hiện và phạm vi đã xóa.
   - Dựng lại dữ liệu demo theo `docs/demo-runbook.md` sau khi xóa, và chụp lại ảnh màn hình cho báo cáo nếu ảnh cũ không còn khớp.

   Hệ quả cần thông báo: mọi Store Key hiện có mất hiệu lực và mọi thiết bị đã ghép phải ghép lại từ đầu.

10. **Xác thực bằng mã một lần sáu chữ số, và tài khoản chủ không có mật khẩu.**

    Không dùng đường dẫn xác nhận. Lý do: chủ thường đăng ký trên tablet hoặc máy tính đặt tại quán nhưng đọc mail trên điện thoại; bấm link ở điện thoại thì phiên xác thực nằm ở điện thoại còn thiết bị đang thao tác không nhận được gì, buộc quay lại đăng nhập lần nữa. Nhập mã giữ toàn bộ thao tác trên đúng một màn hình, và không phải cấu hình đường dẫn quay về cho từng môi trường.

    Bỏ hẳn mật khẩu cho tài khoản chủ. Kéo theo ba đơn giản hóa: không có luồng quên mật khẩu, không có ràng buộc độ mạnh mật khẩu, và **đăng ký lần đầu trùng luôn với đăng nhập các lần sau** — cùng một màn nhập email rồi nhập mã, tài khoản được tạo ở lần nhập mã đúng đầu tiên. Đánh đổi là mỗi lần đăng nhập đều phải mở hộp thư, chấp nhận được vì chủ chỉ dùng mặt web khi tạo cửa hàng hoặc khi khôi phục.

    Rủi ro không đổi so với phương án có mật khẩu: mất quyền truy cập hộp thư là mất tài khoản. Cả hai phương án đều quy về hộp thư.

    Ràng buộc bắt buộc, quan trọng hơn vì cùng một điểm cuối vừa đăng nhập vừa tạo tài khoản: giới hạn tần suất gửi mã theo email và theo địa chỉ mạng, đặt hạn dùng ngắn cho mã, giới hạn số lần nhập sai, và trả phản hồi chung chung không tiết lộ email đã tồn tại hay chưa.

    Hệ quả về vòng đời cửa hàng: vì chủ phải xác thực xong mới có phiên, và phải có phiên mới tạo được cửa hàng, nên **không tồn tại cửa hàng ở trạng thái chờ xác thực**. Trạng thái đó bị loại khỏi thiết kế, và câu hỏi số 10 ở trên không còn áp dụng.

    Lưu ý phạm vi: quyết định này chỉ áp dụng cho tài khoản chủ. Service account của cửa hàng vẫn đăng nhập bằng phần bí mật trong Store Key như cũ, và nhân viên vẫn dùng PIN như cũ.

11. **Trạng thái tạm ngưng cửa hàng được enforce ở tầng database**, không dừng ở tầng ứng dụng như hiện nay.

    Chi phí thấp bất thường ở thời điểm này: change đã phải sửa chính sách bảo mật mức dòng để thêm nhánh chủ sở hữu, nên thêm một điều kiện kiểm tra trạng thái là phần việc nhỏ đi kèm. Đổi lại đóng được đúng khoảng trống mà baseline spec `store-isolation` đang tự khai là chưa làm.

    Ngoại lệ bắt buộc: chính sách vẫn cho chủ **đọc bản ghi cửa hàng và trạng thái** của mình, chỉ chặn dữ liệu nghiệp vụ. Nếu chặn sạch thì giao diện chỉ báo lỗi chung chung và chủ không phân biệt được cửa hàng bị tạm ngưng với hệ thống hỏng.

    Hệ quả với spec: requirement khóa cửa hàng trong `store-isolation` phải sửa, vì nó đang ghi rõ hệ thống không được tuyên bố có enforce trạng thái này ở tầng database.

12. **Màn quản trị cho nhà cung cấp dịch vụ tách thành change riêng**, không làm trong change này.

    Chủ dự án muốn có một màn để nhà cung cấp quản lý các cửa hàng, gồm vô hiệu hóa và xóa cửa hàng. Việc đó là một tầng danh tính thứ tư bên cạnh chủ, thiết bị và nhân viên, và nó phá vỡ nguyên tắc cô lập dữ liệu giữa các cửa hàng, nên cần proposal riêng với phần phân tích riêng. Xem `add-provider-admin-console`.

    Change này chỉ chuẩn bị nền: trường trạng thái cửa hàng, việc enforce trạng thái ở tầng database, và bảng nhật ký thao tác quản trị cửa hàng.

13. **Giữ nguyên luồng ghép thiết bị: đúng Store Key là ghép được, không có bước duyệt.**

    Không bắt chủ kích hoạt từng thiết bị mới, và không giới hạn số thiết bị ghép đồng thời. Không theo dõi danh sách thiết bị đang ghép.

    Lý do: đây là tầng thấp nhất trong ba tầng danh tính, vốn thiết kế cho thiết bị đặt cố định tại quán và do người trong quán vận hành. Thêm bước duyệt tạo ra điểm nghẽn thật khi phải thay máy giữa giờ cao điểm, để đổi lấy một rủi ro đã có đường xử lý là chức năng cấp lại Store Key. Cái mà phần phản biện đặt vấn đề là gate ở bước tạo cửa hàng, và phần đó đã được trả lời bằng xác thực email ở quyết định số 1.

    Hạn chế đã biết, phải ghi vào tài liệu: Store Key rò rỉ thì bất kỳ ai cũng ghép được thiết bị cho tới khi chủ chủ động cấp lại key. Quyết định số 6 làm Store Key tồn tại lâu hơn và đi qua thêm một kênh là email, nên rủi ro này lớn hơn trước một chút, và chức năng cấp lại là biện pháp bù duy nhất.

    Requirement ghép thiết bị bằng Store Key trong `store-onboarding` giữ nguyên, không sửa.

14. **Hạn mức 5 cửa hàng trên mỗi tài khoản chủ; không giới hạn số lần tạo trong ngày.** Sửa lại theo chủ dự án: chốt 2026-11-03, xác nhận lại 2026-11-04; bản trước có thêm giới hạn 3 lần tạo mỗi ngày.

    Mỗi email chỉ làm chủ tối đa 5 cửa hàng. Trong một ngày được tạo đủ cả 5 cửa hàng; đủ 5 rồi thì không tạo thêm được. Cùng với xác thực email ở quyết định số 1, trần này là biện pháp chống việc tạo cửa hàng hàng loạt. Đánh đổi đã chấp nhận: việc tạo dồn dập trong ngày chỉ còn bị trần 5 chặn.

    Con số 5 là giá trị cấu hình phía server, không phải hằng số nằm rải trong mã, nên nới về sau không kéo theo migration.

    Ghi lại lý do không chọn trần bằng 1, vì đây là điểm dễ hiểu nhầm. Câu hỏi "một chủ được mấy cửa hàng" thoạt nhìn giống câu hỏi "sản phẩm có làm quản lý chuỗi không", nhưng là hai việc khác nhau:

    - Toàn bộ tài liệu nền thống nhất rằng đây **không** phải bài toán quản lý chuỗi đa chi nhánh, gồm `pos-cafe-context.md`, mục ngoài phạm vi của `docs/requirements.md`, `docs/phase-scope.md` và `docs/limitations.md`.
    - Nhưng baseline spec `store-isolation` **đã đặc tả sẵn** kịch bản một chủ sở hữu nhiều quán: hai quán là hai cửa hàng tách biệt với hai Store Key khác nhau, và hệ thống không cung cấp màn hình tổng hợp chung. Tức nhiều cửa hàng cho một chủ vốn nằm trong phạm vi hiện tại.

    Cái ngoài phạm vi là quản lý chuỗi, tức thực đơn dùng chung, giá thống nhất, báo cáo tổng hợp và màn chuyển đổi cửa hàng. Vì vậy đặt trần bằng 1 sẽ mâu thuẫn với một kịch bản đã đặc tả, còn trần lớn hơn 1 đúng ở cả hai hướng phát triển. Quyết định về quản lý chuỗi vẫn để mở ở câu hỏi số 1 của `add-multi-store-ownership` và không chặn change này.

    Khi chạm hạn mức, giao diện thông báo rõ đã đạt số cửa hàng tối đa và hướng dẫn liên hệ nhà cung cấp để nới. Việc nới hạn mức theo từng tài khoản được đưa vào `add-provider-admin-console`. Làm rõ ngày 2026-11-04: trong phạm vi đồ án vẫn giữ trần 5; khi vận hành thực tế có thể nới theo nhu cầu.

15. **Không dùng dịch vụ gửi email mặc định của nền tảng backend cho bản chạy thật. Chọn cách gửi theo bốn mức, dưới ràng buộc không có ngân sách tiền.** Sửa lại ngày 2026-09-07.

    Quyết định số 10 làm email trở thành đường vào bắt buộc và lặp lại, chứ không còn là thao tác một lần lúc đăng ký. Email hiện gánh ba luồng: mã đăng nhập của chủ ở mỗi lần đăng nhập, gửi lại Store Key, và đặt lại PIN của vai trò chủ quán. Dịch vụ mặc định giới hạn tần suất ở mức vài email mỗi giờ và nhà cung cấp khuyến cáo không dùng cho môi trường thật, nên trần đó chạm ngay trong lúc phát triển.

    **Ràng buộc mới, chưa được ghi ở bản trước:** đồ án **không có ngân sách tiền**. Bản trước mặc định việc mua tên miền là đương nhiên, và đó là giả định sai. Mọi lựa chọn dưới đây phải dùng được ở gói miễn phí.

    Bốn mức, xếp theo thời gian bỏ ra chứ không theo chất lượng:

    | Mức | Cách | Dùng cho |
    | --- | --- | --- |
    | 0 | Dịch vụ tích hợp sẵn của nền tảng backend | Chỉ dùng khi phát triển và tự kiểm thử. Vài email mỗi giờ |
    | 1 | SMTP của một tài khoản Gmail riêng của dự án, dùng App Password | **Mức tối thiểu chấp nhận được cho bản chạy thật của đồ án** |
    | 2 | Nhà cung cấp gửi email có gói miễn phí, xác minh **một địa chỉ gửi** thay vì cả tên miền | Khi cần hạn mức cao hơn hoặc cần thống kê gửi |
    | 3 | Nhà cung cấp gửi email cộng **tên miền riêng đã xác minh** | Mức mong muốn, chỉ làm nếu xin được tên miền miễn phí |

    **Mức 1 là mốc phải đạt.** Lý do chọn nó làm mốc thay vì mức 3: rủi ro thật cần chặn là mã một lần rơi vào thư rác, vì quyết định 10 đã bỏ mật khẩu nên không có đường đăng nhập thay thế. Gửi qua SMTP của Gmail được Google ký DKIM trên `gmail.com`, nên khả năng vào hộp thư chính đã tốt. Thứ mức 3 thêm vào chủ yếu là địa chỉ gửi mang tên dự án, tức giá trị hình thức.

    Đánh đổi của mức 1, ghi rõ để không nói quá: địa chỉ gửi là một Gmail chứ không phải địa chỉ mang tên cửa hàng, và trần gửi khoảng vài trăm thư mỗi ngày. Cả hai đều không cản trở đồ án.

    Yêu cầu bắt buộc, áp cho mọi mức từ 1 trở lên:

    - Gửi được tới địa chỉ email bất kỳ, không giới hạn ở địa chỉ của chính tài khoản gửi.
    - Hạn mức đủ cho cả giai đoạn phát triển lẫn buổi demo.
    - Kiểm tra thực tế khả năng vào hộp thư chính với ít nhất một nhà cung cấp hộp thư phổ biến, trước ngày demo.
    - Tài khoản gửi phải là tài khoản **riêng của dự án**, không dùng tài khoản cá nhân, vì thông tin đăng nhập của nó nằm trong biến môi trường.

    Đường nâng cấp lên mức 3 nếu xin được tên miền miễn phí: chương trình cấp tên miền `.id.vn` hoặc `.io.vn` cho người Việt trẻ, hoặc tên miền kèm theo GitHub Student Developer Pack. Cả hai đều phải chờ duyệt nên **không được để chúng chặn tiến độ**; nộp hồ sơ song song, duyệt kịp thì nâng cấp, không kịp thì giữ mức 1.

    Việc nâng cấp rẻ vì `design.md` đã đặt phần gửi email sau một port: đổi mức chỉ là đổi cấu hình SMTP, không sửa dòng nào trong `src`.

16. **Cấp lại Store Key đòi ba lớp rào chắn.**

    Đây là thao tác có bán kính ảnh hưởng lớn nhất trong hệ thống: nó đăng xuất toàn bộ thiết bị của cửa hàng cùng lúc, và quán ngừng bán cho tới khi ghép lại từng máy.

    Ba lớp, theo thứ tự người dùng gặp:

    1. Cảnh báo nói rõ hậu quả, với nút xác nhận tách khỏi nút mở hộp thoại.
    2. Gõ lại tên cửa hàng để xác nhận, buộc người dùng dừng lại và đọc.
    3. Nhập một mã một lần mới gửi tới email chủ.

    Lớp thứ ba là lớp quan trọng nhất và không được cắt: nó chặn tình huống mà hai lớp đầu không chạm tới, là **phiên đăng nhập bỏ ngỏ trên máy dùng chung**. Phiên tồn tại lâu, nên nếu chỉ có cảnh báo và gõ xác nhận thì người ngồi vào máy sau vẫn cấp lại key được. Toàn bộ mô hình bảo mật của change này đặt trên việc kiểm soát hộp thư, nên thao tác phá nhiều nhất phải đòi một bằng chứng mới về đúng thứ đó.

    Ma sát chấp nhận được vì đây là thao tác hiếm: trường hợp thường gặp là quên Store Key, và luồng đó đã tách riêng ở quyết định số 6, không đụng tới thiết bị nào.

17. **Làm cả luồng đổi email chủ và luồng chuyển quyền sở hữu, ngay trong change này.**

    Lý do đổi email chủ đáng làm sớm, dù thoạt nhìn là tiện ích nhỏ: **chuyển quyền sở hữu cũng yêu cầu chủ đăng nhập được**, tức vẫn còn truy cập email. Nếu chủ mất hẳn email thì cả hai luồng đều vô dụng và cửa hàng kẹt cứng, chỉ còn đường nhà cung cấp can thiệp tay. Đổi email chủ vì vậy là biện pháp phòng ngừa cho đúng tình huống không tự cứu được: chủ di chuyển sang địa chỉ mới trước khi mất địa chỉ cũ.

    Luồng đổi email: chủ đang đăng nhập nhập địa chỉ mới, hệ thống gửi mã tới **địa chỉ mới**, nhập mã đúng thì đổi, đồng thời gửi thư thông báo về địa chỉ cũ để chủ phát hiện nếu không phải mình thực hiện. Tái dùng nguyên cơ chế mã một lần ở quyết định số 10, không dựng thêm cơ chế nào.

    Luồng chuyển quyền sở hữu: chủ hiện tại chỉ định địa chỉ email của chủ mới, người nhận xác thực để tiếp nhận. Chi tiết luồng và các ràng buộc đi kèm, gồm việc bản ghi nhân viên vai trò chủ quán phải chuyển theo, để lại cho bước thiết kế.

    Vẫn còn một tình huống ngoài tầm với của change này: chủ mất hẳn quyền truy cập email. Lối thoát duy nhất khi đó là nhà cung cấp gán lại chủ sở hữu, và việc đó thuộc `add-provider-admin-console`.

18. **Giữ một change duy nhất, chia giai đoạn ở `tasks.md`.**

    Đã cân nhắc tách change này làm hai vì proposal dài gấp gần bốn lần mức thường của kho, và **quyết định không tách**. Lý do: độ dài không phải tiêu chí tách change. Ranh giới đúng là cái gì duyệt và giao độc lập được, mà toàn bộ quyết định ở đây đã được chốt cùng một lượt nên không có hai vòng phê duyệt riêng. Tách ra còn làm hỏng mạch lý lẽ: quyết định số 3 chọn hàm phía server một phần vì nhu cầu khôi phục, và quyết định số 6 có phần lưu trữ thuộc giai đoạn đầu nhưng phần luồng thuộc giai đoạn sau.

    Việc giao theo giai đoạn không cần tách proposal: `tasks.md` là nơi quy định thứ tự. Hai giai đoạn, với một điểm dừng an toàn ở giữa:

    **Giai đoạn 1, danh tính và kiểm soát việc tạo cửa hàng.** Tài khoản chủ với mã một lần; tạo cửa hàng qua hàm phía server; hạn mức và giới hạn tần suất; trường chủ sở hữu, trường trạng thái và cột bí mật mã hóa; chính sách bảo mật thêm nhánh chủ và điều kiện trạng thái; ràng buộc gắn vai trò chủ quán với tài khoản chủ; bảng nhật ký; cấu hình nhà cung cấp gửi email; xóa dữ liệu cũ.

    Kết thúc giai đoạn 1 thì hệ thống chạy đầy đủ và đã trả lời trọn vấn đề ai cũng tạo được cửa hàng. Phần thiếu duy nhất là khôi phục, mà hiện tại cũng chưa có, nên dừng ở đây không làm hệ thống tệ hơn trước.

    **Giai đoạn 2, khôi phục và vòng đời quyền sở hữu.** Quên Store Key; cấp lại Store Key kèm ba lớp rào chắn; đặt lại PIN của vai trò chủ quán; đổi email chủ; chuyển quyền sở hữu.

    Delta spec chia theo capability cho rõ, không dồn hết vào `owner-account`.

19. **Cấp lại Store Key chỉ khả dụng khi phiên tài khoản chủ đang đăng nhập.** Chốt 2026-08-31. Lịch sử; **thay bởi quyết định 24 từ 2026-11-05**.

    Nút cấp lại chỉ hiện trên mặt web của tài khoản chủ, sau khi chủ đã đăng nhập bằng mã một lần gửi tới email đã xác thực. Ứng dụng POS tại quán không có lối vào nào cho chức năng này, kể cả với nhân viên vai trò `owner`.

    Hệ quả: **không thêm quyền nào vào danh mục quyền hành động.** `access-control` không nằm trong danh sách capability bị change này sửa. **Đính chính 15/09:** danh mục của `redesign-permission-model` hiện là mười lăm quyền do Q12/Q12a thêm receipt.reprint; quyết định 19 ở đây vẫn không thêm quyền Store Key rotation.

    Điều này cũng giải quyết một mâu thuẫn giữa hai tài liệu: proposal của `redesign-permission-model` liệt kê cấp lại Store Key vào nhóm quyền dành riêng cho chủ quán, trong khi `specs/access-control/spec.md` của chính change đó chỉ ghi `data.wipe`. Spec đúng, proposal sai; proposal đã được sửa lại cho khớp.

    Lý do chọn hướng này thay vì mở thêm lối vào trong ứng dụng: lớp rào chắn thứ ba ở quyết định 16 là một mã một lần mới gửi tới email chủ, nên thao tác này vốn đã đòi phiên chủ. Đặt nút ở nơi không có phiên chủ chỉ tạo ra một đường dẫn vòng về đúng chỗ đó.

    Luồng quên Store Key **không** đổi: nó vẫn có hai lối vào theo quyết định 8, gồm màn ghép thiết bị và màn Cài đặt trong ứng dụng, vì nó không đụng tới thiết bị nào.

20. **Chốt các ngưỡng bảo mật và giới hạn tần suất.** Chốt 2026-08-31.

    Quyết định 10 và 14 yêu cầu có các giới hạn này nhưng không nêu con số. Không có số thì không viết được requirement kiểm chứng được.

    | Tham số | Giá trị |
    | --- | --- |
    | Hạn dùng mã một lần | 10 phút |
    | Độ dài mã | 6 chữ số |
    | Số lần nhập sai tối đa mỗi mã | 5, quá thì hủy mã và bắt yêu cầu mã mới |
    | Gửi mã, theo email và theo từng loại thao tác | 3 lần mỗi 15 phút, 10 lần mỗi ngày (quyết định 25) |
    | Gửi mã, theo địa chỉ mạng | 10 lần mỗi giờ |
    | Gửi email quên Store Key | 3 lần mỗi giờ, tính theo email; cộng giới hạn theo địa chỉ mạng và trần toàn dự án, tính chung mọi loại (quyết định 39) |
    | Trần số cửa hàng mỗi tài khoản chủ | 5 |
    | Thời gian chờ giữa hai lần gửi mã, theo email và từng loại thao tác | 10 phút (giới hạn 3 lần mỗi 15 phút vì thế không chạm tới; vẫn giữ làm lớp phòng vệ). Tính riêng từng loại: chốt 2026-11-05 |
    | Trần gửi mã toàn dự án | 400 lần mỗi ngày theo giờ Việt Nam (chủ dự án chọn 2026-11-03); tính chung mọi loại thao tác (quyết định 39) |
    | ~~Hạn phiên đăng nhập của chủ~~ | Bỏ theo quyết định 23 |

    Sửa lại ngày 2026-11-04: bỏ dòng giới hạn tạo cửa hàng 3 lần mỗi ngày, theo quyết định 14.

    Toàn bộ để ở dạng cấu hình phía server, giống trần 5 cửa hàng ở quyết định 14: đổi giá trị không kéo theo migration và không phải sửa mã rải rác.

    Hạn phiên 7 ngày từng trả lời rủi ro phiên bỏ ngỏ trên máy dùng chung; nay không còn phiên chủ nên không cần.

21. **Chừa sẵn đường mở rộng sang nhiều cửa hàng, nhưng không làm tính năng chuỗi trong phạm vi này.** Chốt 2026-08-31.

    Quản lý chuỗi vẫn ngoài phạm vi, đúng như `pos-cafe-context.md`, `docs/requirements.md`, `docs/phase-scope.md` và `docs/limitations.md` đang ghi. Change này không làm thực đơn dùng chung, giá thống nhất, báo cáo tổng hợp hay màn chuyển đổi cửa hàng.

    Nhưng cấu trúc dữ liệu và giao diện MUST NOT khóa cứng ở một cửa hàng, để khi được hỏi thì trả lời được là chưa làm chứ không phải không làm được. Cụ thể:

    - Quan hệ chủ và cửa hàng là quan hệ một nhiều ở tầng lược đồ. **Không** đặt ràng buộc duy nhất trên trường chủ sở hữu.
    - Mặt web của chủ hiển thị **danh sách** cửa hàng, kể cả khi danh sách chỉ có một dòng.
    - Email quên Store Key liệt kê theo dạng danh sách, đúng như quyết định 6 đã nêu.
    - Mọi truy vấn phía server nhận định danh cửa hàng làm tham số, không suy ra từ "cửa hàng duy nhất của chủ này".
    - Bảng nhật ký thao tác quản trị gắn với từng cửa hàng, không gắn với tài khoản chủ.

    Baseline spec `store-isolation` đã đặc tả sẵn kịch bản một chủ sở hữu hai quán và nói rõ hệ thống không cung cấp màn tổng hợp chung. Quyết định này giữ nguyên phát biểu đó và chỉ bổ sung ràng buộc rằng lược đồ không được đi ngược lại nó.

    Phần còn thiếu để thành tính năng chuỗi, ghi ra để trả lời được khi bị hỏi: màn chuyển đổi cửa hàng đang làm việc, báo cáo hợp nhất nhiều cửa hàng, danh mục dùng chung giữa các cửa hàng, và quan hệ nhân viên làm ở nhiều cửa hàng. Bốn việc đó nằm ở `add-multi-store-ownership` và `add-cross-store-reporting`.

22. **Màn kết quả cho sao chép Store Key; luôn gửi thêm Store Key tới email chủ như một hỗ trợ kèm theo.** Chốt 2026-11-03, chủ dự án xác nhận lại 2026-11-04 và làm rõ cùng ngày.

    Tạo xong, màn kết quả hiển thị Store Key kèm nút sao chép; đây là đường giao chính. Hệ thống luôn gửi thêm Store Key tới email đã xác thực của chủ, kèm tên và địa chỉ cửa hàng như email ở quyết định 8, và thư này chỉ là hỗ trợ kèm theo. Lý do gửi thêm: nếu phản hồi bị mất đúng lúc đó thì chủ có cửa hàng mà không thấy key trên màn hình.

    Thư gửi sau khi cửa hàng đã tạo xong và nằm ngoài phạm vi chạy trọn vẹn của `createStore`: gửi thư lỗi không làm hỏng cửa hàng đã tạo và không hoàn hạn mức.

    Đã cân nhắc và loại hai hướng. Chỉ gửi khi người dùng bấm yêu cầu: thêm một lối vào công khai, mà vẫn không dùng được khi trình duyệt đã mất dữ liệu của lần tạo. Dựa hoàn toàn vào luồng quên Store Key: luồng đó nằm ở giai đoạn 2 trong `tasks.md`, nên giai đoạn 1 sẽ không có đường lấy lại key.

    Đánh đổi đã chấp nhận: mỗi lần tạo có thêm một thư, và Store Key nằm trong hộp thư kể cả khi chủ đã thấy nó trong phản hồi. Giảm nhẹ: không ghi Store Key vào nhật ký; khi luồng cấp lại Store Key đã có thì thư nhắc dùng luồng đó nếu nghi hộp thư bị lộ.

23. **Không có đăng nhập web riêng cho chủ; mã email chỉ dùng xác nhận từng thao tác.** Chốt 2026-11-03.

    Chủ dự án nêu rõ: mã gửi về mail chỉ dùng khi tạo cửa hàng, quên passcode, reset dữ liệu và chuyển quyền sở hữu; còn thông thường chỉ cần nhập passcode. Passcode ở đây là PIN cá nhân trên POS, dùng cho cả chủ và nhân viên.

    Mỗi lần tạo quán, kể cả quán thứ hai của cùng chủ, đều phải xác minh email bằng mã riêng. Bước đó chỉ cho phép tạo đúng quán đó, không mở phiên đăng nhập và không cho xem dữ liệu các quán khác. PIN, Store Key hay việc email đã từng xác minh không thay được mã của lần này.

    Email chủ vẫn là căn cứ để biết quán thuộc về ai và đếm hạn mức, nên vẫn có bảng tài khoản chủ, nhưng tài khoản này không có mật khẩu và không đăng nhập được.

24. **Thao tác của chủ làm trên POS, trong mục Cài đặt, chỉ tài khoản chủ quán thấy.** Chốt 2026-11-05.

    Cấp lại Store Key, đổi email, chuyển quyền và reset dữ liệu nằm trong mục Cài đặt. Không thêm quyền vào danh mục quyền: cứ là tài khoản chủ quán thì thấy, người khác không thấy, kể cả người có quyền quản lý cài đặt. Server kiểm lại vai trò, không tin giao diện.

    Biết PIN chủ là chưa đủ: mỗi thao tác đều gửi một mã 6 số về email đã đăng ký, có mã mới làm tiếp. Vì thế người ngồi vào máy đang đăng nhập bằng tài khoản chủ quán vẫn bị chặn ở bước nhập mã.

    Đã cân nhắc và loại phương án trang web riêng: phải làm thêm màn hình, và mã sẽ phải mở danh sách quán để chọn.

25. **Thời gian chờ và giới hạn gửi mã tính riêng cho từng loại thao tác.** Chốt 2026-11-05.

    Ví dụ quên PIN và chuyển quyền tính riêng, không chờ lẫn nhau. Đã cân nhắc và loại phương án tính chung theo email: vừa tạo quán xong muốn đặt lại PIN sẽ phải đợi hết 10 phút.

    Đánh đổi: một email có thể nhận nhiều thư hơn trong cùng một khoảng thời gian. Giới hạn theo địa chỉ mạng và trần toàn dự án vẫn tính chung cho mọi loại (quyết định 39), vì chúng bảo vệ sức chứa gửi thư của dự án.

26. **Quên PIN qua email chỉ dành cho chủ quán.** Chốt 2026-11-03, nhắc lại 2026-11-05.

    Trên màn nhập PIN của máy đã ghép, chọn tài khoản chủ quán thì có lối "Quên mã PIN"; mã gửi về email đã đăng ký; nhập đúng mã thì đặt PIN mới. Nhân viên quên PIN phải nhờ chủ quán hoặc người có quyền `employee.manage` đặt lại trong phần quản lý nhân viên, thường là quản lý; không có đường tự khôi phục qua email cho nhân viên. Phần người đặt lại được chủ dự án nói rõ thêm ngày 2026-11-05.

27. **Đổi email phải xác nhận cả email đã đăng ký và email mới.** Chốt 2026-11-05.

    Trong mục Cài đặt: nhập email đã đăng ký, nhập mã gửi về email đó, nhập email mới, nhập mã gửi về email mới. Sau khi đổi, email cũ nhận thư báo. POS không hiển thị email đã đăng ký.

    Xác nhận email đã đăng ký để người chỉ biết PIN chủ không chiếm được quán. Xác nhận email mới để gõ sai địa chỉ không làm mọi mã về sau đi sai chỗ. Nhược điểm đã chấp nhận: mất hẳn hộp thư cũ thì không tự đổi được; lối thoát khi đó là nhà cung cấp can thiệp, thuộc `add-provider-admin-console`.

28. **Chuyển quyền là đổi vai trò giữa hai tài khoản POS.** Chốt 2026-11-05.

    Ví dụ chủ A nhượng quán cho B. A phải tạo sẵn tài khoản POS cho B. Rồi A làm theo thứ tự: vào màn chuyển quyền; nhập email đã đăng ký để xác nhận chính chủ, POS không hiển thị email này; nhập mã gửi về email đó; chọn tài khoản POS của B; nhập email mới, khác email cũ; nhập mã gửi về email mới. Sau khi mã của email mới đúng, database kiểm email đó đang đứng tên bao nhiêu quán; đủ 5 thì dừng và thông báo.

    Khi hoàn tất, B là chủ quán, A thành tài khoản thường (thu ngân, quyết định 33), ai giữ PIN nấy (B đổi PIN ở lần đăng nhập đầu, quyết định 32), Store Key và các máy đã ghép không đổi. Nếu cần, B tự xóa tài khoản A khỏi POS; hệ thống không can thiệp. Đánh đổi: A vẫn biết Store Key; nếu B lo ngại thì dùng chức năng cấp lại Store Key.

    Đã cân nhắc và loại hai phương án: một tài khoản chủ dùng chung PIN, vì không tách được chủ cũ và chủ mới; và bắt cấp lại key ngay khi chuyển, vì cả quán phải ghép lại máy. Bước xác nhận email mới được làm ngay trên màn hình POS đang chuyển quyền, không cần trang web riêng.

29. **Reset dữ liệu đưa quán về rỗng, chỉ chừa chủ quán.** Chốt 2026-11-05.

    Xóa đơn, thanh toán, hóa đơn, số liệu báo cáo, thực đơn, khu và bàn, mọi nhân viên trừ chủ quán; cấu hình còn lại về mặc định. Giữ tên và địa chỉ quán, Store Key, các máy đã ghép, tài khoản chủ quán và nhật ký quản trị. Giữ nhật ký để còn dấu vết ai đã reset và lúc nào.

    Mục đích và giới hạn số lần ở quyết định 43. Đây là thao tác không khôi phục được và khác với xóa dữ liệu mẫu đã có, vốn không đụng tới dữ liệu tài chính. Về bản chất là đưa dữ liệu về rỗng; cách hiện thực chi tiết bàn thêm khi triển khai.

30. **Cấp lại Store Key và reset dữ liệu đi theo bốn bước.** Chốt 2026-11-05.

    Thứ tự: đọc cảnh báo, gõ lại tên quán, bấm gửi mã, nhập mã. Đặt việc gửi mã sau khi đã gõ tên quán để bấm nhầm không tốn thư và không tính lượt. Đây là ba lớp rào chắn của quyết định 16, áp dụng thêm cho reset.

31. **Chặn thư mẫu của Supabase Auth trước khi phát hành; nếu cơ chế chặn bị tắt thì chấp nhận rủi ro.** Chốt 2026-11-03, phần cơ chế bị tắt chốt 2026-11-04.

    Đây là các thư mẫu do Supabase Auth tự gửi, như xác nhận đăng ký hay đặt lại mật khẩu. Hệ thống không dùng các thư này, nhưng người có khóa công khai vẫn kích hoạt được, gây phiền cho hộp thư của nhóm và tạo tài khoản rác. Các thư này không mang quyền gì của chủ quán.

    Việc chặn được đưa vào giai đoạn triển khai, trước khi phát hành giai đoạn 1. Nếu cơ chế chặn bị tắt, dự án chấp nhận rủi ro còn lại và không coi đó là điều kiện chặn phát hành; ghi vào giới hạn của hệ thống. Thư mẫu này khác với thư Store Key: thư Store Key đi đường gửi riêng của dự án.

32. **Người nhận quyền phải đổi PIN ở lần đăng nhập đầu; không được chọn tài khoản mẫu có PIN công khai.** Chốt 2026-11-05.

    A là người tạo tài khoản POS cho B nên có thể biết PIN của B. Nếu giữ nguyên, sau khi chuyển quyền A vẫn đăng nhập được bằng PIN đó với quyền chủ quán, kể cả khi B đã xóa tài khoản A; riêng các thao tác cần mã email thì A không làm được.

    Mỗi người vẫn giữ PIN của mình như quyết định 28, chỉ thêm một bước đổi PIN cho B, dùng lại cờ buộc đổi PIN đã có. Nếu A vào trước và đổi PIN thì A có quyền chủ quán trên POS, trừ các thao tác cần mã email, cho tới khi B dùng "Quên mã PIN" qua email mới để lấy lại; lúc đó phiên của A hết hiệu lực. Đã cân nhắc và loại phương án giữ nguyên và chấp nhận rủi ro.

33. **Sau khi chuyển quyền, chủ cũ thành thu ngân (`cashier`) và mất các quyền riêng.** Chốt 2026-11-05.

    Đây là vai trò ít quyền quản trị mà vẫn làm việc được ở quầy. Chủ mới có thể đổi lại vai trò, hoặc xóa tài khoản đó.

34. **Quán đang tạm ngưng không làm được các thao tác của chủ, trừ quên Store Key.** Chốt 2026-11-05.

    Áp dụng cho quên PIN, cấp lại Store Key, đổi email, chuyển quyền và reset dữ liệu. Tạm ngưng nghĩa là quán đang không được vận hành, nên không đổi chủ, đổi key hay xóa dữ liệu trong lúc đó. Quên Store Key vẫn dùng được vì chỉ gửi thư về email chủ, không thay đổi gì.

35. **Bước xác nhận email đã đăng ký có hiệu lực 10 phút.** Chốt 2026-11-05.

    Đây là bước chặn người chỉ biết PIN chủ. Chọn 10 phút để bằng hạn của mã. Quá hạn thì làm lại từ bước nhập email đã đăng ký.

36. **Reset dữ liệu xếp ở giai đoạn 2 trong kế hoạch, chưa thực hiện ngay.** Chốt 2026-11-05.

    Hiện chỉ đặc tả ở mức kế hoạch: yêu cầu, luồng và test case đã viết, nhưng chưa làm cho tới khi được giao triển khai giai đoạn 2.

37. **Không ghi được biên nhận trên máy vẫn cho làm tiếp, kèm cảnh báo.** Chốt 2026-11-05.

    Lỗi lưu trữ của trình duyệt không nên chặn việc tạo quán. Máy giữ dữ liệu trong bộ nhớ và cảnh báo "Tải lại có thể làm mất bước đang thực hiện". Đánh đổi: nếu tải lại trang lúc đó, người dùng quay về màn nhập thông tin và phải đợi hết thời gian chờ mới có mã mới. Đã cân nhắc và loại phương án dừng lại.

38. **Sau khi tải lại trang, máy giữ sẵn tên quán, địa chỉ và tùy chọn dữ liệu mẫu; PIN luôn phải nhập lại.** Chốt 2026-11-05, thay bởi quyết định 46 ngày 2026-11-10. Quyết định 37 chỉ còn áp dụng lúc lưu mã tra trạng thái sau Xác nhận.

    Giúp người dùng không phải gõ lại, và tránh gõ khác đi làm thành một lần tạo mới. Đánh đổi: người dùng chung máy có thể thấy các thông tin này cho tới khi chúng được xóa; đây không phải thông tin bí mật. PIN, mã và Store Key không bao giờ được lưu.

39. **Giới hạn theo địa chỉ mạng và trần toàn dự án tính chung mọi loại thao tác; thời gian chờ và lượt gửi theo email thì tính riêng từng loại.** Chốt 2026-11-05.

    Hai nhóm giới hạn này làm hai việc khác nhau:

    | Giới hạn | Đếm theo | Bảo vệ điều gì |
    | --- | --- | --- |
    | Chờ 10 phút; 3 lần mỗi 15 phút; 10 lần mỗi ngày | Email và từng loại thao tác, trừ mã reset | Hộp thư của một người khỏi bị gửi dồn, mà thao tác này không chặn thao tác kia |
    | 10 lần mỗi giờ | Địa chỉ mạng, chung mọi loại | Một máy không gửi thư hàng loạt tới nhiều email |
    | 400 lần mỗi ngày | Toàn dự án, chung mọi loại | Sức chứa của đường gửi thư duy nhất của dự án |

    Ví dụ: chủ vừa nhận mã quên PIN vẫn nhận được mã chuyển quyền ngay, vì đó là hai loại khác nhau; nhưng cả hai lần đều được đếm vào 10 lần của địa chỉ mạng đó và 400 lần của dự án. Mỗi lần chấp nhận gửi mã tính một lần vào cả hai giới hạn. Với quên Store Key, giới hạn theo địa chỉ mạng đếm mọi yêu cầu đúng dạng, trước khi xét giới hạn theo email, kể cả khi email không có quán, để không ai suy ra được email nào có quán qua số thư nhận được; trần toàn dự án chỉ đếm thư thực sự gửi. Thư báo sau thao tác, thư Store Key khi tạo quán và thư key mới sau khi cấp lại không tính.

    Lý do tính chung: mọi loại mã đều đi qua một đường gửi thư. Nếu tách riêng thì tổng số thư thực tế có thể vượt sức chứa, và người muốn gửi nhiều thư chỉ cần đổi loại thao tác để né giới hạn. Đánh đổi: nhiều người dùng chung một địa chỉ mạng, ví dụ cùng mạng của quán, có thể chạm 10 lần mỗi giờ; khi đó phản hồi vẫn như thường nhưng không có thư, và người dùng thử lại sau. Các con số 10 và 400 đã có từ trước; quyết định này chỉ chốt việc tính chung cho các loại thao tác mới.

40. **Dùng các câu thông báo đã viết trong `usecases.md`.** Chốt 2026-11-05.

    Các câu này trước đó được ghi là đề xuất. Đổi chữ sau này không ảnh hưởng luồng.

41. **Kiểm thử theo hai tầng: giả lập tự động trên máy, rồi test tay trên staging.** Chốt 2026-11-05.

    Không có project riêng khác cho test. Tầng đầu giả lập database và đường gửi thư, để giao diện chạy như đã kết nối Supabase; thời gian được rút ngắn, ví dụ 10 phút xuống 15 giây, để không tốn thời gian chờ. Tầng sau là test tay trên staging, với thư thật và thời gian thật: người kiểm đọc mã trong hộp thư rồi nhập.

    Khi test tay chỉ thao tác trên quán thử, nhận biết bằng email chủ có nhãn `+`; sao lưu trước lần đầu chạy reset và chuyển quyền; kiểm thêm một quán thử khác không bị ảnh hưởng.

    Đánh đổi: giả lập không chứng minh được chính sách bảo mật, giao dịch và đồng thời ở database, kiểm phiên và vai trò ở server, nên các ca đó chỉ tính đạt khi test tay trên staging; ca phải tạo lỗi cố ý thì chỉ chứng minh được quy tắc. Đã cân nhắc và loại các phương án: thêm một project riêng có bảng thư thử, vì chủ dự án chọn dùng staging làm nơi duy nhất; đọc Gmail thật trong test, vì chậm, dễ lỗi và phải để mật khẩu trong môi trường chạy test; dịch vụ bắt thư, vì không có ngân sách; mã cố định, vì nguy hiểm nếu lọt lên bản thật.

42. **Sau khi cấp lại Store Key, chấp nhận token cũ còn dùng được tới khi hết hạn hoặc khi người dùng đăng xuất.** Chốt 2026-11-05.

    Theo tài liệu Supabase, token mặc định sống 1 giờ. Key cũ không ghép thêm được máy nào, nhưng máy đang giữ token vẫn truy cập được trong khoảng đó. Ghi vào giới hạn của hệ thống. Đã cân nhắc và loại hai phương án: rút hạn token xuống khoảng 15 phút, vì phải đổi cấu hình cả dự án; và kiểm phiên ở mỗi truy vấn, vì phức tạp và chậm hơn. Điều kiện: bước thu hồi phiên phải chặn được việc làm mới token; việc này đối chiếu khi triển khai.

43. **Reset dùng để bỏ dữ liệu demo rồi tự nhập dữ liệu của quán; không giới hạn số lần, không có thời gian chờ.** Chốt 2026-11-05.

    Trường hợp thường gặp: chủ tạo quán có chọn dữ liệu demo, sau đó muốn tự nhập dữ liệu của mình. Vì vậy mã reset không có thời gian chờ 10 phút và không có giới hạn theo email; gửi mã mới thì mã trước bị hủy. Giới hạn theo địa chỉ mạng và trần toàn dự án vẫn áp dụng vì tính chung mọi loại thao tác (quyết định 39), nên lần gửi thứ 11 trong một giờ từ cùng địa chỉ không có thư; chủ dự án xác nhận. Đánh đổi: người biết PIN chủ và đang đăng nhập có thể thử 50 mã mỗi giờ từ một địa chỉ; chấp nhận vì chủ sẽ thấy nhiều thư lạ trong hộp thư. Sau reset, dữ liệu mẫu không tự có lại. Không có bước xuất dữ liệu trước khi xóa; màn cảnh báo ghi rõ dữ liệu không khôi phục được.

44. **Dùng project staging làm database của dự án; không dùng database gốc nữa.** Chốt 2026-11-05.

    Từ ngày này dự án dùng staging `ineckiashpwloncxnbqx` cho phát triển và kiểm thử, không dùng database gốc `kfqjdfwxhkdwihjobpny`. Sau này có thể dùng luôn staging làm database chính; khi đó phải xem lại quy tắc test tay ở quyết định 41, vì lúc đó có dữ liệu thật. Quyết định này chưa đổi cấu hình nào; việc trỏ cấu hình sang staging làm khi triển khai.

45. **Chốt tiêu chí FE trước code; chạy mock trước khi nối staging; tắt signup công khai sau khi luồng mới chạy ổn rồi chạy lại hồi quy.** Chủ dự án xác nhận trong chat rà PR #18 ngày 2026-11-10. Vòng mock dùng dữ liệu và hộp thư giả, giữ cấu hình signup hiện tại. Trên staging dùng OTP và database thật, sau đó tắt signup và chạy lại cùng ma trận FE cơ bản, kiểm cả việc gọi thẳng signup bị chặn và Admin API vẫn tạo tài khoản kỹ thuật. Đánh đổi: thêm một vòng hồi quy nhưng phát hiện được phụ thuộc cũ vào signup. Nếu phải quay về bản cũ cần xử lý cấu hình signup cùng bản code, vì đường tạo cũ gọi `auth.signUp`. Chi tiết cổng ở testplan và tasks.

46. **F5 bỏ form; sau khi bấm Xác nhận chỉ giữ mã tra trạng thái.** Chủ dự án xác nhận trong chat rà PR #18 ngày 2026-11-10, thay quyết định 38. Chọn form trong bộ nhớ và chỉ lưu `attemptId` trước khi gửi Xác nhận. Đánh đổi: sau F5 phải nhập lại form và có thể phải chờ hết thời gian gửi mã. Nếu yêu cầu đã đi tới server, người dùng vẫn có đường xem tiến độ. Mã tra chỉ trả trạng thái, không có quyền tạo quán hoặc lấy Store Key.

47. **Chấp nhận trường hợp mất cả phản hồi và thư Store Key trên các quán thử giai đoạn 1.** Chủ dự án xác nhận trong chat rà PR #18 ngày 2026-11-10. Vẫn giao key trên màn hình và gửi thư như quyết định 22. Giai đoạn 2 giữ luồng Quên Store Key. Đánh giá lại khi chuyển sang quán sử dụng thực tế.

48. **Giữ an toàn khi chưa rõ kết quả tạo quán. Hoãn tự động đối soát, dọn dẹp và cảnh báo provisioning tới sau đồ án.** Chủ dự án xác nhận trong chat rà PR #18 ngày 2026-11-10, thay cam kết kết thúc hữu hạn trước đây trong REQ-STORE-03 và bỏ mốc cảnh báo 1 giờ cho ca này. Trong đồ án, giữ mã lượt, trạng thái `unknown`, suất và rào một operation mỗi intent. Khi phát hiện lỗi có bằng chứng chắc chắn chưa để lại tác dụng phụ, vẫn kết thúc `failed` và hoàn suất. Nếu chưa rõ, lượt có thể kẹt và giữ suất cho tới khi được xác minh riêng. Chủ dự án chọn chấp nhận đánh đổi này cho quán thử thay vì triển khai bộ phục hồi tự động ngay. Lưu liên kết Auth và dấu hiệu server để có thể làm bộ đối soát sau. Quyết định này chỉ áp dụng cho kết quả tạo quán, giữ nghĩa vụ gửi thư Store Key của lượt tạo thành công và đường tra kết quả sau F5.

49. **Cho rời màn tra khi chưa rõ, và ghép máy thủ công sau khi lưu Store Key.** Chủ dự án xác nhận trong chat rà PR #18 ngày 2026-11-10. Từ màn tra, có thể về trang đầu hoặc ghép thiết bị, vẫn giữ mã tra. Mở lại Tạo quán trong cùng tab thì mở lượt cũ, chưa mở form lượt mới. Sau khi bấm “Tôi đã lưu Store Key”, chuyển tới màn Ghép thiết bị với ô trống. Chủ dự án xác nhận lại retry seed theo R06-A, dùng thông báo chung sau khi owner đăng nhập.

50. **Khi chủ chọn dữ liệu mẫu, server tự khởi chạy lần đầu ngay sau khi tạo quán thành công.** Chủ dự án chốt trong chat T06 ngày 2026-11-11. Phương án còn lại là đợi phiên owner đầu tiên như cơ chế hiện hành. Chạy từ server giảm phụ thuộc vào việc chủ có mở POS hoặc dùng cùng thiết bị sau khi tạo. Server ghi việc cần làm cùng giao dịch tạo quán và xử lý sau commit. Kết quả tạo và Store Key được trả độc lập với seed. Quyết định 51 quy định cách mở POS, xử lý lỗi và thử lại.

51. **Chỉ mở POS khi dữ liệu mẫu đã sẵn sàng hoặc server xác nhận quán trống.** Chủ dự án chốt trong chat T06 ngày 2026-11-11 để tránh phát sinh nghiệp vụ trên dữ liệu mẫu dở dang. Toàn bộ bộ mẫu được ghi trong một giao dịch riêng sau khi tạo quán. Máy ghép sớm đăng nhập được để xem màn chờ. Nếu seed lỗi, giao dịch hoàn tác toàn bộ. Chủ chọn **Thử lại** cả bộ hoặc **Bỏ dữ liệu mẫu và vào quán trống** sau khi server xác nhận lượt cũ đã kết thúc, không còn quyền ghi và quán trống. Cách này thay việc thử lại theo từng bước và vị trí thông báo R06-A cho quán mới theo T06. Đánh đổi là lần thử lại ghi lại cả bộ mẫu và máy ghép sớm chờ thêm trước khi sử dụng POS.

52. **Tự tiếp tục gửi thư OTP tạo quán còn chờ.** Chủ dự án chốt trong chat T06 ngày 2026-11-11. Cùng giao dịch ghi nhận mã, server ghi một thư chờ chứa OTP được mã hóa. Nếu tiến trình dừng trước khi nhận việc, tác vụ gửi thư lấy lại chính bản ghi đó khi mã còn hiệu lực. Việc nhận gửi chỉ cấp một lần. Nếu đã nhận việc mà mất kết quả, giữ trạng thái chưa rõ và không tự phát lại. Thời hạn mã và mốc xin mã mới tính từ lần phát gốc. Phương án còn lại là đợi đủ 10 phút rồi xin mã mới mỗi khi tiến trình dừng. Phương án đã chọn phục hồi được thư chưa có người xử lý, đổi lại cần giữ bản mã tạm và quản lý khóa giải mã phía server.

53. **Tính thời hạn OTP tạo quán sau khóa DB và vô hiệu ở lần sai thứ năm.** Chủ dự án chốt trong chat T06 ngày 2026-11-11 rằng mã đúng nhưng thông tin tạo quán bị đổi cũng khóa mã nếu đó là lần sai thứ năm. Dùng một bộ đếm của mã cho các lỗi được tính theo thiết kế. Lần thứ năm trả lỗi đã gây lần sai, lần xác minh mới tiếp theo báo mã bị khóa khi còn trong hạn. Giữ kết quả của lần nhập cũ khi gửi lại đúng yêu cầu đã lưu. Mã hết hạn theo giờ thực của DB sau khi lấy khóa, kể cả khi lời gọi đến sớm hơn và phải chờ khóa hạn mức. Cách này áp dụng cùng giới hạn cho các lỗi được tính. Người nhập nhầm thông tin ở lượt sai cuối phải xin mã mới theo thời gian chờ hiện hành.

54. **Cho mở nhiều tab và giữ kết quả riêng của từng lần Xác nhận.** Chủ dự án chốt trong chat T06 ngày 2026-11-11. Mỗi tab có form, OTP và trạng thái riêng. Một lượt từng bị từ chối giữ kết quả cũ kể cả khi lượt khác đã tạo quán. Nếu lần Xác nhận mới cùng intent đến sau khi đã có operation, server ghi liên kết chỉ tra trước khi trả trạng thái để F5 tra được bằng ID của lần đó. Server giữ tối đa 64 liên kết mỗi operation theo mô hình mock, xuyên qua dọn các kết quả gửi lại thường trong giai đoạn 1. Một intent vẫn chỉ mở một operation và một suất. Store Key vẫn dành cho luồng giao đã xác thực và thư của chủ. Cho phép nhiều tab đơn giản hóa giao diện. Đánh đổi là các tab có thể hiển thị kết quả khác nhau vì chúng đang tra các lượt khác nhau.

55. **Vẫn giao Store Key qua phản hồi Xác nhận gốc nếu OTP hết hạn trong lúc tạo quán.** Chủ dự án chốt trong chat T06 ngày 2026-11-11. Nếu OTP đã được xác minh trong hạn, quán commit trong hạn xử lý và lời gọi gốc còn trả được kết quả của lần ghi, phản hồi `created` kèm Store Key. Quyền giao nằm trong lần xử lý gốc. Gửi lại cùng ID hoặc F5 sau hạn OTP chỉ nhận trạng thái. Thư được xếp cùng giao dịch ghi quán và gửi độc lập sau commit. Phương án chỉ gửi email sau hạn khiến chủ có thể không nhận được key dù đang chờ màn kết quả nếu thư lỗi. Quyết định 47 vẫn áp dụng cho quán thử giai đoạn 1 khi cả phản hồi và thư đều mất.

56. **Kiểm trạng thái quán tại các RPC nghiệp vụ và cổng ảnh hiện hành.** R07 ngày 2026-11-11 làm rõ quyết định 11, 12 và 23 theo baseline quyền hiện hành. Phiên đã mở vẫn bị chặn khi quán tạm ngưng. Thiết bị đã ghép đọc được đúng ID, số và trạng thái quán của mình. Đổi trạng thái và audit commit cùng nhau. Chủ dự án chốt chặn lượt tải ảnh mới qua cổng hiện hành, gồm cả revalidate. Ảnh đã tải và URL Storage công khai đời cũ nằm ngoài cổng này. Việc quản trị nhà cung cấp và phần còn mở của R06-C/T10 theo phạm vi riêng.

57. **Ghi tác nhân hệ thống cho lần tự tạo dữ liệu mẫu.** Chủ dự án chốt ngày 2026-11-11. Ghi `system` và ID operation tạo quán đã chọn dữ liệu mẫu. Lần chủ chủ động bấm Thử lại dùng tác nhân của phiên chủ đã xác thực. Hai cách ghi giúp phân biệt một lượt tự chạy với thao tác thực tế của người dùng.

58. **Cổng tin cậy ký IP cho yêu cầu phát OTP.** Chủ dự án chốt ngày 2026-11-11. Route server của Vercel đọc địa chỉ từ `x-vercel-forwarded-for`, ký IP, thời điểm và hash body rồi chuyển đúng body sang Edge. Edge kiểm chữ ký và mốc giờ trước khi gọi RPC phát OTP. Giữ giới hạn 10 lượt/IP/giờ, bỏ các header chuyển tiếp do caller gửi. Khóa ký chỉ đặt ở Vercel server và Supabase Edge. [Vercel request headers](https://vercel.com/docs/headers/request-headers)

### Phân tích chống lạm dụng tạo quán, cập nhật 2026-11-10

Ba số đếm có đơn vị riêng: lượt phát OTP theo email/IP/dự án, lần nhập sai theo từng mã, và số quán đã có hoặc đang giữ chỗ theo email. Việc bấm Gửi mã hoặc nhận thư không giữ chỗ quán. Việc chấp nhận tạo quán đòi đúng mã của intent, đúng thông tin và còn chỗ. Server tiêu thụ mã và giữ chỗ trong cùng giao dịch, trước mọi thay đổi Auth. Gửi lại cùng yêu cầu hoặc gọi hỏi trạng thái không phát thư hay tạo quán thêm. Thiết kế này giữ quyết định 14, 20, 23 và 39.

Đổi IP không né được giới hạn email, còn đổi email không né được giới hạn IP và toàn dự án. Nhiều hộp thư hoặc nhiều địa chỉ cùng về một hộp thư vẫn có thể là nhiều email theo quy tắc hiện hành giữ dấu chấm và `+tag`. Bởi vậy trần 5 là theo email chuẩn hóa, và giới hạn 400 là ngân sách lượt gửi đã nêu trong quyết định 39. Thư Store Key đi thêm sau khi tạo và không nằm trong 400 lượt này. T05 phải đối chiếu tổng lưu lượng thực (gồm thư Store Key, thư còn trong hàng đợi và giới hạn nhà gửi), ưu tiên kiểm khả năng giao OTP. Bất kỳ thay đổi nào về chính sách alias, CAPTCHA, trần tạo theo ngày hoặc ngân sách gửi đã chốt đều cần quyết định riêng nếu bằng chứng cho thấy cần.
