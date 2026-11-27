# T08 · Máy đã ghép còn làm được gì sau khi cấp lại Store Key?

Cập nhật ngày 27/11/2026. [Kết quả Auth gửi đồng thời và gia hạn A/B](#kiem-auth-dong-thoi-va-refresh-ab-20261127).

Xem [kết quả mục 12.10 ngày 25/11/2026](#kiem-auth-1210-20261125) để biết kết quả đổi mật khẩu trên staging và các giới hạn. Phân tích ngày 24/11 bên dưới dùng nguồn Auth v2.197.0.

## Bốn lựa chọn đã chốt ngày 24/11/2026

Chủ dự án đã chốt phạm vi gỡ ghép, thời điểm giao key, cách ghép lại máy của chủ và môi trường kiểm như sau.

| Lựa chọn | Hành vi đã chọn |
| --- | --- |
| **1A · Gỡ ghép thiết bị này** | Bấm gỡ ngay từ màn chọn nhân viên, không cần PIN. Chỉ thu hồi phiên Auth hiện tại. Các máy đã ghép bằng phiên độc lập tiếp tục bán hàng. |
| **2A · Nhận key khi đang thu hồi** | Khi Auth đã đổi mật khẩu và POS đã lưu key mới (`applied`), chủ có thể nhận key qua email hoặc “Quên Store Key”. Báo rõ access JWT cũ/trạng thái client còn có thể đang hội tụ và máy vừa ghép có thể phải ghép lại; đây không phải bước Auth hậu kỳ của worker. |
| **3B · Ghép lại máy của chủ** | Sau khi cấp lại thành công, hiện key và nút sao chép. Khi chủ bấm **“Dùng key mới trên máy này”**, app dùng key đang hiển thị để ghép lại. Chủ nhập lại PIN nhân viên để vào POS. |
| **4A · Kế hoạch staging** | Khi đến bước kiểm, tạo một quán thử riêng, dùng hộp thư thử đọc được và hai phiên trình duyệt độc lập. |

Mục 12.10 vẫn mở cho TTL thực tế và cơ chế thu hồi. Bốn lựa chọn trên được ghi nhận ở mức quyết định sản phẩm và kế hoạch kiểm. Chưa có lượt chạy staging cho T08.

## Quên key và đổi key

Các nhãn giao diện đã được chốt ngày 24/11/2026. Mục “Quên Store Key?” có nút “Gửi key hiện tại qua email”. Mục “Đổi Store Key” có nút “Tạo key mới” ở bước xác nhận. Câu giải thích, cảnh báo tác động lên các máy và thông báo sau khi đổi nằm tại [UC-OWNER-08 và UC-OWNER-09](../../../openspec/changes/add-owner-account-and-store-provisioning/usecases.md#uc-owner-08--chủ-quên-store-key).

Trên `main@209aecc`, T06 cấp Store Key đầu tiên khi tạo quán, cho sao chép, xếp thư gửi tới email chủ đã xác minh và dùng key để ghép máy. Nút “Nhận lại Store Key” ở màn kết quả chỉ phục vụ đúng lần tạo quán khi còn đủ điều kiện giao key. Hai chức năng dưới đây có yêu cầu, use case và ca kiểm riêng. Các mục triển khai 11 và 12 còn mở. [Màn kết quả T06](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/app/screens/OwnerCreateRequestScreen.tsx#L153-L178) · [Worker gửi thư](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/functions/owner-provisioning/handler.ts#L268-L288) · [Checklist T08](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#L180).

| Nhu cầu của chủ | Hành vi theo đặc tả | Ảnh hưởng |
| --- | --- | --- |
| Quên key, muốn nhận lại để ghép máy | Ở màn ghép hoặc Cài đặt, nhập email. Hệ thống gửi key hiện tại về đúng email đang đứng tên quán. Nếu email đứng tên nhiều quán, thư liệt kê các quán đủ điều kiện. Không yêu cầu đăng nhập hay OTP. | Việc gửi lại giữ nguyên key và không đăng xuất các máy đã ghép. |
| Đổi key vì nghi lộ, mất máy hoặc nhân viên cũ còn biết key | Trong Cài đặt, chủ đã đăng nhập đọc cảnh báo, gõ tên quán và xác minh OTP qua email đã đăng ký. Hệ thống giữ số quán, sinh bí mật mới và gửi key mới cho chủ. | Sau khi đổi mật khẩu thành công, key cũ hết khả năng ghép mới. Mọi máy phải ghép lại. Với phiên cũ, áp dụng quyết định 42 và điều kiện kiểm ở mục 12.10. |

Đặc tả đã nêu ví dụ nhân viên nghỉ việc ngay trong lý do giữ riêng hai chức năng. Khóa tài khoản nhân viên là thao tác riêng để chặn PIN và phiên làm việc của người đó. [Bảng phân biệt trong proposal](https://github.com/nguyentronglinh045/pos-cafe/blob/4c1f338/openspec/changes/add-owner-account-and-store-provisioning/proposal.md#L152-L160) · [REQ-OWNER-09/10](https://github.com/nguyentronglinh045/pos-cafe/blob/4c1f338/openspec/changes/add-owner-account-and-store-provisioning/specs/owner-account/spec.md#L173-L199) · [Server kiểm nhân viên còn hoạt động](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/candidate/owner-provisioning-suspension.sql#L94-L102).

Đối chiếu ngày 24/11/2026 trên hai đầu nhánh đã xác nhận với remote, `main@209aecc` và `docs@4c1f338`. T06 đã có luồng tạo quán và ghép máy. Cấp lại key của **quán đang tồn tại** thuộc T08, còn chờ phụ thuộc. Cả mục 12.1–12.10 đang mở. Edge xử lý cấp key ban đầu và xác nhận đã lưu. Worker hiện xử lý thư và seed. Trên main chưa có action `regenerateStoreKey` hay bảng `store_key_rotations`. [Kế hoạch](../g01-g10-plan.md) · [Checklist cấp lại](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#12-cấp-lại-store-key) · [Edge và worker trên main](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/functions/owner-provisioning/handler.ts#L268-L329).

## Ba lớp xác thực

| Lớp | Dự án xử lý thế nào | Hệ quả khi cấp lại |
| --- | --- | --- |
| Store Key để ghép máy | App tách số quán và bí mật. Số quán xác định tài khoản Auth kỹ thuật, phần bí mật là mật khẩu. [Ghép máy](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L19-L31) | Sau khi Auth đã đổi mật khẩu, một lần ghép mới bắt đầu bằng bí mật cũ phải bị từ chối. |
| Phiên Supabase của máy | SDK lưu phiên và tự làm mới. Trong Supabase Auth v2.197.0, Admin API đặt mật khẩu gọi `UpdatePassword(tx, nil)` và xóa các phiên của tài khoản trong cùng giao dịch. Đây là phiên bản có nguồn cố định từng dùng cho lab của dự án. [Client POS](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/client.ts#L39-L59) · [Admin API](https://github.com/supabase/auth/blob/v2.197.0/internal/api/admin.go#L234-L271) · [Xử lý mật khẩu](https://github.com/supabase/auth/blob/v2.197.0/internal/models/user.go#L435-L462) | Refresh token gắn với phiên đã xóa không gia hạn được. Access JWT đã cấp vẫn có thể được một dịch vụ chấp nhận tới `exp` nếu dịch vụ chỉ kiểm JWT. Việc đổi mật khẩu theo ID không đòi JWT riêng của từng máy. |
| Phiên làm việc của nhân viên | Sau PIN, app giữ credential riêng trong bộ nhớ. RPC nghiệp vụ kiểm quán hoạt động, phiên nhân viên còn hạn, chưa thu hồi và quyền tương ứng. [Kiểm phiên](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/candidate/owner-provisioning-suspension.sql#L82-L105) · [Kiểm quyền giao dịch](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/candidate/permission-financial.sql#L33-L44) | Chỉ với JWT quán, máy có thể dùng các bước dành cho thiết bị đã ghép như lấy danh sách chọn nhân viên. Để thanh toán, hủy đơn hay xem báo cáo, nhân viên còn phải có phiên và quyền tương ứng. |

## Các nhận định cần hiệu chỉnh

- **Thời gian còn truy cập.** Với một JWT cụ thể tại thời điểm đổi mật khẩu thành công, khoảng còn lại tới hạn là `max(0, exp − thời điểm đổi thành công)`. Nếu TTL là 60 phút và token còn 4 phút thì cận là 4 phút. Một giờ là mặc định được Supabase mô tả. Chưa xác minh TTL staging tại thời điểm đối chiếu. SDK 2.108.1 dùng tick 30 giây, có xử lý riêng khi tab ẩn, khi đọc phiên và khi gặp lỗi có thể thử lại. Mốc 90 giây trong SDK không cho biết chính xác lúc UI chuyển màn. Khoảng “1–59 phút, trung bình 30 phút” thiếu dữ liệu quan sát. [Sessions](https://supabase.com/docs/guides/auth/sessions) · [Tick của SDK](https://github.com/supabase/supabase-js/blob/v2.108.1/packages/core/auth-js/src/GoTrueClient.ts#L5299-L5315) · [Sự kiện và credential POS](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/client.ts#L54-L60).
- **Ảnh và Realtime.** Ở cổng ảnh riêng, nếu Auth từ chối `getUser` vì phiên đã mất, gateway trả cho app `401 AUTH_REQUIRED`. Ảnh menu đã công khai đi qua endpoint khác, kiểm asset và tình trạng quán. Realtime truyền metadata báo có thay đổi ở quán và danh mục quyền để app đọc lại. Thời điểm kết nối dừng trên staging chưa đo. [Gateway riêng](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/functions/menu-image-gateway/index.ts#L19-L28) · [Ảnh công khai](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/functions/menu-image-public/index.ts#L9-L22) · [Tín hiệu](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/permissionSignalPort.ts#L25-L76).
- **Trạng thái dở dang.** Spec đã nêu hai trường hợp cùng mang nhãn `pending`. Auth có thể chưa đổi mật khẩu hoặc đã đổi xong trước khi POS kịp ghi `applied`. Chỉ trong trường hợp đầu, key cũ còn có thể ghép mới cho tới khi đổi thành công. Sau sáu lần đối soát lỗi, thiết kế yêu cầu báo người vận hành. Luồng này và tình huống đăng nhập trùng thời điểm đổi mật khẩu chưa có phép kiểm T08 trên staging. [Thiết kế](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#L264) · [TC-OWNER-87](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#5-khôi-phục-chuyển-quyền-và-reset).
- **Bước thu hồi cuối.** Một lần đọc danh sách phiên không chứng minh mọi đăng nhập đang xử lý đã kết thúc. `created_at` so với `applied` cũng không cho biết bí mật nào dùng để ghép máy. Ở bản Auth đã đọc, gửi lại cùng mật khẩu vẫn có thể đăng xuất cả máy vừa ghép đúng bằng key mới. Spec đã ghi nhận hệ quả này. Chưa đủ căn cứ kết luận bước 4 có thể chỉ xác minh, hay việc gọi lại đã giải quyết mọi trường hợp đồng thời. [Thiết kế bước 4](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#L264) · [Nguồn Auth](https://github.com/supabase/auth/blob/v2.197.0/internal/api/admin.go#L234-L271).

## Ý nghĩa với bốn phương án

1. **PA1** gần nhất với quyết định 42. Quyết định chấp nhận JWT cũ trong phần đời còn lại với điều kiện máy cũ không thể gia hạn. Vẫn cần cơ chế hoàn tất bước thu hồi và bằng chứng cho điều kiện đó. [Quyết định 42](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#L495).
2. **PA2** có thể thu hồi phiên nhân viên tại DB. Máy hiển thị màn PIN sau khi app nhận tín hiệu hoặc kiểm lại phiên. Nếu JWT quán còn dùng được, người có PIN hợp lệ có thể mở phiên nhân viên mới theo quyền của mình. Giao diện và quyết định ở server có thể thay đổi ở hai thời điểm khác nhau. [Xử lý tín hiệu](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/app/PermissionLifecycle.tsx#L59-L82).
3. **PA3** phù hợp để cân nhắc nếu mục tiêu mới là từ chối yêu cầu POS được bảo vệ ngay từ request đầu tiên sau khi phiên bị thu hồi. Hook PostgREST hiện kiểm phiên bản giao thức. Hồ sơ staging ngày 23/10 xác nhận hook từng chạy ở chế độ strict. Bổ sung tra phiên là thay đổi chính sách cho Data API dùng chung. Cần kiểm quyền đọc, phạm vi vai trò/đường gọi, xử lý lỗi và máy của chủ đang nhận key. Hook chỉ phát hiện phiên đã mất. Nút gỡ ghép hiện gọi `signOut()` với scope mặc định global nên cũng cần tính tác động lên các máy cùng quán. [Hook](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/candidate/permission-compatibility-prepare.sql#L31-L56) · [Hồ sơ staging H0](permission-staging-functional-2026-10-23.md#L20) · [Gỡ ghép](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L36-L39) · [Scope đăng xuất](https://supabase.com/docs/guides/auth/signout) · [Phạm vi pre-request](https://supabase.com/docs/guides/api/securing-your-api).
4. **PA4** rút ngắn TTL của JWT phát mới cho cả project và tăng tần suất refresh. Quyết định 42 đã cân nhắc và loại cách rút TTL. [Quyết định 42](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#L495).

**Trạng thái bằng chứng.** Ngày 17/11 staging đã từ chối ba key cũ và ba refresh token sau khi dọn tài khoản cũ trong cutover T06. T08 giữ nguyên tài khoản và chỉ đổi mật khẩu. Task 12.10 còn cần TTL thực và cách hoàn tất thu hồi theo tài khoản. TC-OWNER-52 còn cần kết quả hai máy trên cùng quán sau khi có luồng T08, gồm ghép lại, refresh, quyền POS và hiển thị/gửi key. Quyết định 42 vẫn là yêu cầu đã chốt. Phân tích ngày 24/11 chỉ đọc nguồn và bằng chứng trước đó. [Biên nhận T06](g01-g10-t06-owner-implementation-2026-11-11.md#L637) · [TC-OWNER-52](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#5-khôi-phục-chuyển-quyền-và-reset).

## Đối chiếu bổ sung ngày 24/11/2026

**Gỡ ghép trước PIN.** Nút “Đổi quán / Gỡ ghép” gọi thẳng thao tác gỡ và báo “Đã gỡ ghép thiết bị”. Khi Auth nhận yêu cầu từ phiên hợp lệ, scope mặc định `global` thu hồi các phiên của tài khoản kỹ thuật dùng chung cho quán. JWT đã phát và thời điểm mỗi màn hình nhận ra việc thu hồi có vòng đời riêng. Store Key vẫn dùng được để ghép lại. Smoke test đã ghi nhận hành vi global và dùng scope local để dọn phiên thử. Cả nhánh gỡ ghép lẫn nhánh dọn sau khi đăng nhập ghép thành công nhưng kiểm tra quán không khớp đều gọi `signOut()` mặc định, đã có trước T06. Quyết định ngày 24/11 giới hạn **gỡ ghép thông thường** trong phiên hiện tại. Khi triển khai cần rà cả hai chỗ gọi. Có thể đánh giá PA3 song song và ghi tác động liên máy trước khi áp dụng. [Màn chọn nhân viên](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/app/screens/PasscodeScreen.tsx#L74-L85) · [Hai chỗ gọi](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L19-L39) · [Smoke test](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/tests/supabase/pos-cafe-supabase.spec.ts#L75-L88) · [Phạm vi đăng xuất](https://supabase.com/docs/guides/auth/signout).

**Đăng nhập trùng lúc cấp lại.** Nguồn Auth v2.197.0 có căn cứ để giữ rủi ro đồng thời trong task 12.10. Dự án chưa có bằng chứng trên hosted rằng đổi mật khẩu một lần sẽ ngăn mọi phiên từ các đăng nhập đang xử lý tiếp tục gia hạn. Nếu một phiên như vậy tồn tại và vẫn hợp lệ, nó có thể làm mới qua hạn của JWT ban đầu. PA3 chỉ tra sự tồn tại của phiên nên vẫn chấp nhận phiên còn trong bảng. Chính sách phiên và việc thu hồi sau đó quyết định thời gian thực tế. Chưa xác lập được giới hạn thời gian xử lý đầu cuối trên hosted để dùng “chờ rồi đăng xuất lần hai” làm bảo đảm. API đăng xuất quản trị chuẩn nhận JWT của người dùng, trong khi worker được thiết kế để chạy khi không giữ JWT thiết bị. Nếu đổi cơ chế phải nêu cách worker hoàn tất bước này khi chạy lại. [Nguồn Supabase Auth đã đối chiếu](https://github.com/supabase/auth/tree/v2.197.0) · [Chính sách phiên](https://supabase.com/docs/guides/auth/sessions) · [Đăng xuất qua Admin API](https://supabase.com/docs/reference/javascript/auth-admin-signout).

**Giao key trong lúc đối soát.** Ở bước 3, thiết kế ghi key mới và xếp thư vào hàng đợi. Từ `applied`, thiết kế mở lại luồng quên key, đổi email, chuyển quyền và reset. Bản đặc tả ngày 24/11 ghi rõ thư quên key bỏ qua quán ở `pending` và có thể gửi key mới từ `applied`. Dời riêng màn hình và thư cấp lại tới bước 4 vẫn để ngỏ khả năng chủ nhận key qua thư **quên** Store Key. Nếu muốn tất cả các đường giao key cùng chờ `completed`, đó là thay đổi yêu cầu. Cần chốt cả cách chủ lấy lại key khi bước thu hồi lỗi kéo dài. TC-OWNER-87(h) hiện kỳ vọng key mới vẫn dùng được ở `applied`. [REQ-OWNER-09/10](../../../openspec/changes/add-owner-account-and-store-provisioning/specs/owner-account/spec.md#L173) · [Thiết kế bước 3–4](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#L264) · [TC-OWNER-87](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#5-khôi-phục-chuyển-quyền-và-reset).

**Tiêu chí kiểm.** FK của refresh token có `ON DELETE CASCADE`. Khi phiên đã bị thu hồi, điều cần xác minh là không được cấp bộ token mới. Auth v2.197.0 có các nhánh `refresh_token_not_found` và `session_not_found`. Câu “No Valid Session Found” chỉ ứng với một nhánh. Trong auth-js 2.108.1, “còn dưới 120 giây” là điều kiện xét ở một nhịp kiểm tự động. Việc một tab phát hiện mất phiên còn phụ thuộc lúc SDK thực sự chạy. Phép thử hai máy sau khi có T08 đã thuộc mục 12.9/TC-OWNER-52. Mục 12.10 vẫn mở cho cơ chế thu hồi, điều kiện đồng thời và TTL thực. [FK](https://github.com/supabase/auth/blob/v2.197.0/migrations/20220811173540_add_sessions_table.up.sql#L12-L22) · [Các nhánh lỗi](https://github.com/supabase/auth/blob/v2.197.0/internal/tokens/service.go#L210-L235) · [Tick của SDK](https://github.com/supabase/supabase-js/blob/v2.108.1/packages/core/auth-js/src/GoTrueClient.ts#L5299-L5315) · [Checklist 12.9 và 12.10](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#L208).

## Bàn giao cho lượt triển khai

1. Sửa và kiểm luồng “Gỡ ghép thiết bị này” theo UC-OWNER-14 và TC-OWNER-112. Ca này cần hai phiên độc lập trên cùng một quán thử. Sau khi gỡ A, kiểm phiên A cũ bị từ chối gia hạn trước khi ghép lại A. B vẫn phải gia hạn và thao tác được. [Use case gỡ ghép](../../../openspec/changes/add-owner-account-and-store-provisioning/usecases.md#uc-owner-14--gỡ-ghép-thiết-bị-này).
2. Khi mở T08 theo [kế hoạch G01–G10](../g01-g10-plan.md), có thể triển khai quên key theo mục 11 và kiểm TC-OWNER-49…51, 100. TC-OWNER-49 cần một email thử đứng tên hai quán. TC-OWNER-87 phân biệt thư quên key trong hai trạng thái `pending` và `applied`.
3. Trước khi chọn cơ chế thu hồi của luồng đổi key, hoàn tất mục 12.10. Cần biết TTL thực tế, khả năng gia hạn của các phiên cũ và cách worker hoàn tất bước thu hồi sau khi chạy lại. Nếu kết quả chưa bảo đảm điều kiện của quyết định 42 thì báo chủ dự án. Sau triển khai, kiểm TC-OWNER-52…55, 87, gồm nút “Dùng key mới trên máy này”, bước nhập PIN và khôi phục khi dở dang. [Checklist cấp lại](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#12-cấp-lại-store-key).

Các ca trên là kế hoạch kiểm. Giữ thông tin xác thực trong môi trường thử và lưu kết quả đã che bí mật.

**Kiểm tra tài liệu ngày 24/11/2026.** OpenSpec strict và kiểm tra diff đạt. Hai lượt rà độc lập về nghiệp vụ POS và phạm vi phiên Auth đã duyệt bản cuối. TC-OWNER-112 đã bổ sung hai nhánh dọn phiên của adapter. TC-OWNER-52 đã bổ sung điều kiện máy B tự về luồng ghép khi nhận biết mất phiên.

<a id="kiem-auth-1210-20261125"></a>

## Mục 12.10 · Kiểm Auth ngày 25/11/2026

**Trạng thái:** hoàn tất phép kiểm Auth tuần tự ở mục 12.10 trên quán thử #0033. Mục 12.9 và các ca UI T08 vẫn mở. Kết quả TC-OWNER-112 thuộc thao tác gỡ ghép một thiết bị. [Biên bản TC-OWNER-112](tc-owner-112-staging-2026-11-25.md).

| Kiểm chứng | Quan sát ngày 25/11 |
| --- | --- |
| Nguồn và đích | Remote `main@e362c1d`, `docs@746bb2b`. Vercel phục vụ bundle `index-CmLcPGqH.js` với SHA-256 `247fef598d283e3c425289e7489f689060b2e984aa4b2dca71590cd5ce079879` và cấu hình trỏ đúng Supabase staging. Máy A dùng URL deployment của cùng build trong profile sinh viên. Máy B dùng tên miền staging trong profile độc lập. [Lượt phát hành](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45602302184). |
| Cấu hình và phiên bản | Dashboard Authentication → Sessions hiển thị `Access token expiry time = 3600 seconds`. Auth health trả HTTP 200 và `v2.198.0`. Cả hai JWT của phép đo Auth có `exp − iat = 3600` giây và Auth trả `expires_in = 3600`. Frontend khóa `@supabase/auth-js` 2.108.1. [Lockfile](https://github.com/nguyentronglinh045/pos-cafe/blob/e362c1d/package-lock.json#L1128-L1134) · [Bản phát hành Auth](https://github.com/supabase/auth/releases/tag/v2.198.0). |
| Fixture 4A | Linh xác nhận bước tạo quán thử #0033. Thư Store Key của quán thử đã đến hộp thư đã dùng cho OTP. Truy vấn chỉ đọc đối chiếu tên và số quán, trạng thái `active`, liên kết `stores.id` với đúng tài khoản kỹ thuật, alias hộp thư thử và sự hiện diện của bản mã key. Key ban đầu có đường lấy lại từ thư. |
| Mốc nền trình duyệt A và B | Cả hai ghép #0033 bằng key ban đầu, mở POS bằng PIN Chủ quán và đọc Báo cáo hôm nay với 0 ₫, 0 đơn. Truy vấn chỉ đọc trên #0033 ghi 2 phiên Auth và 2 phiên nhân viên còn hạn. Sau khi Linh nạp credential qua PowerShell local, cả hai tab vẫn ở Báo cáo trước lúc đổi. |
| Ràng buộc trước khi đổi | Client phía server đăng nhập bằng key gốc qua password grant, xác nhận danh tính tài khoản kỹ thuật khớp `permission_get_store_session` của quán #0033 đang `active`. Admin GET trả HTTP 200, đúng ID và danh tính đã xác minh. Hai lần đăng nhập Auth thử bổ sung có hai `session_id` khác nhau. Đây là hai phiên dùng cho phép đo HTTP bên dưới. |

### Kết quả sau khi đổi mật khẩu thử

`t0` là thời điểm client nhận HTTP 200 từ Admin API lúc 19:27:25 ngày 25/11/2026 theo giờ Việt Nam. Các khoảng thời gian được đo từ mốc này và làm tròn. Trong lượt thử chỉ đặt mật khẩu Auth cho đúng quán #0033 rồi khôi phục mật khẩu ban đầu. Phép đo dùng password grant và bước kiểm quán giống adapter ghép của POS. [Adapter ghép](https://github.com/nguyentronglinh045/pos-cafe/blob/e362c1d/src/adapters/supabase/authRepo.ts#L19-L33).

| Phép kiểm | Kết quả staging |
| --- | --- |
| Ghép mới sau `t0` | Key ban đầu bị từ chối với HTTP 400 `invalid_credentials`, không cấp token. Key thử trả HTTP 200, cấp phiên cho cùng tài khoản và RPC nhận đúng quán #0033 đang hoạt động. |
| Hai phiên Auth có sẵn khi đổi | Cả hai access JWT vẫn gọi được `permission_get_store_session` với HTTP 200 ở khoảng `t0 + 1,1 s` và `t0 + 1,7 s`. Refresh của chính hai phiên đều trả HTTP 400 `refresh_token_not_found` và không cấp access token hay refresh token mới. |
| Thao tác POS trên A và B | Bấm **Làm mới** ở Báo cáo hôm nay trên A và B tại khoảng `t0 + 13,3 s` và `t0 + 14,0 s`. Cả hai màn hình vẫn hiện báo cáo, 0 ₫ và 0 đơn, không báo mất quyền. Ở lần kiểm kế tiếp khoảng `t0 + 114–115 s`, sau khi khôi phục fixture, cả hai vẫn hiện báo cáo khi bấm làm mới. Nút này gọi refetch trong source. Lượt trình duyệt ghi trạng thái UI, chưa gắn được HTTP riêng từng request của báo cáo hoặc mốc chuyển sang màn ghép. [Nút Làm mới](https://github.com/nguyentronglinh045/pos-cafe/blob/e362c1d/src/app/drawers/admin/ReportDrawer.tsx#L325-L342). |
| Admin đặt lại cùng bí mật thử | Lần gọi trả HTTP 200. Phiên vừa ghép bằng key thử bị từ chối refresh với HTTP 400 `refresh_token_not_found`. Key thử vẫn đăng nhập và nhận đúng quán. |
| JWT tạm của worker | Đăng nhập mới bằng key hiện hành rồi gọi logout `global` bằng JWT vừa cấp trả HTTP 204. Một phiên độc lập cũng ghép bằng key hiện hành ngay trước đó bị từ chối refresh với HTTP 400 `refresh_token_not_found`. |
| Khôi phục và hậu kiểm | Admin đặt lại mật khẩu ban đầu trả HTTP 200. Đăng nhập bằng key ban đầu trả HTTP 200 và RPC nhận đúng quán đang hoạt động. Logout cục bộ của phiên hậu kiểm trả HTTP 204. Truy vấn chỉ đọc sau đó thấy 0 dòng `auth.sessions` cho #0033. |

### Hành vi theo hợp đồng và nguồn đúng phiên bản

- `updateUserById(userId, { password })` là API phía server. Trên nguồn `v2.198.0`, bước đổi mật khẩu và xóa toàn bộ phiên Auth của tài khoản chạy cùng giao dịch. Kết quả ghép mới và refresh ở trên xác nhận hành vi tuần tự trên fixture. Ghép bằng key mới còn cần tài khoản và trạng thái quán hợp lệ. [API cập nhật người dùng](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid) · [Giao dịch Admin](https://github.com/supabase/auth/blob/v2.198.0/internal/api/admin.go#L234-L272) · [Thu hồi phiên](https://github.com/supabase/auth/blob/v2.198.0/internal/models/user.go#L497-L525).
- Access JWT đã cấp có thể vẫn được dịch vụ chỉ xác minh JWT chấp nhận. Với TTL 3.600 giây, thời gian danh nghĩa còn lại của từng JWT là `max(0, exp − thời điểm đổi xong)` theo đồng hồ máy chủ. Dịch vụ xác minh có thể có dung sai lệch đồng hồ. Tài liệu PostgREST 16 mô tả dung sai 30 giây, còn biên chấp nhận của staging chưa đo. Một yêu cầu POS còn phụ thuộc phiên nhân viên và quyền tương ứng. Trình duyệt có thể mất phiên sớm hơn khi SDK làm mới thất bại. Mốc hiển thị còn phụ thuộc tab, thao tác và thời điểm SDK chạy. [Vòng đời phiên](https://supabase.com/docs/guides/auth/sessions) · [Dung sai PostgREST](https://docs.postgrest.org/en/stable/references/auth.html#time-based-claims-validation) · [Client POS](https://github.com/nguyentronglinh045/pos-cafe/blob/e362c1d/src/adapters/supabase/client.ts#L39-L61) · [Kiểm phiên nhân viên](https://github.com/nguyentronglinh045/pos-cafe/blob/e362c1d/supabase/candidate/owner-provisioning-suspension.sql#L82-L105).
- **Đăng nhập trùng thời điểm:** `v2.198.0` đã có khóa hàng người dùng và kiểm lại hash trong giao dịch cấp phiên. Theo nguồn, nếu giao dịch đổi mật khẩu đi trước, đăng nhập đã xác minh hash cũ bị từ chối. Nếu giao dịch cấp phiên đi trước, lần đổi sẽ xóa phiên đó. Điều này xử lý tình huống cấp phiên bằng mật khẩu cũ đã nêu ở mốc `v2.197.0`. Một refresh hoàn tất trước khi phiên bị xóa có thể đã cấp JWT, dù phản hồi tới máy muộn hơn. Khả năng dùng JWT đó và khả năng refresh lần tiếp theo là hai kết quả riêng. Chưa đo đồng thời trên hosted, yêu cầu POS đang chạy hoặc nhiều lượt đối soát giao nhau. Giữ điều kiện của quyết định 42 tại cổng nghiệm thu. [Release v2.198.0](https://github.com/supabase/auth/releases/tag/v2.198.0) · [Giao dịch cấp phiên](https://github.com/supabase/auth/blob/v2.198.0/internal/api/token.go#L218-L249) · [Khóa khi refresh](https://github.com/supabase/auth/blob/v2.198.0/internal/tokens/service.go#L280-L310).

### Worker chạy lại và quyết định còn mở

`auth.admin.signOut(jwt, 'global')` cần access JWT hợp lệ của tài khoản đích. Các route Admin đã đối chiếu không có lệnh đăng xuất toàn bộ theo `userId` riêng. Worker có hai cách dùng API chính thức đã kiểm trên staging mà không giữ JWT thiết bị. API đặt mật khẩu theo ID có thể phát lại cùng bí mật nếu lượt cấp lại vẫn hiện hành và có rào ngăn lượt cũ ghi đè key mới hơn. Worker cũng có thể lấy đúng bí mật đã áp, đăng nhập trong client tạm phía server rồi đăng xuất `global` bằng JWT vừa cấp. Cả hai cách có thể thu hồi phiên vừa ghép bằng key mới. Việc đánh dấu `completed`, chặn lượt cũ và phục hồi sau khi worker mất phản hồi vẫn thuộc thiết kế 12.8, vì worker hiện chỉ xử lý thư và seed. [Admin sign-out](https://supabase.com/docs/reference/javascript/auth-admin-signout) · [Các route Auth](https://github.com/supabase/auth/blob/v2.198.0/internal/api/api.go#L376-L410) · [Đăng nhập mật khẩu](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) · [Worker hiện tại](https://github.com/nguyentronglinh045/pos-cafe/blob/e362c1d/supabase/functions/owner-provisioning/handler.ts#L268-L288).

Giữ điều kiện của quyết định 42 và lựa chọn 2A, 3B, 4A. Kết quả tuần tự hiện tại chưa đặt ra yêu cầu đổi quyết định sản phẩm. Nếu phép kiểm 12.8 phát hiện một trường hợp còn gia hạn được bằng phiên cũ, phải đưa trường hợp đó cho Linh chốt trước khi triển khai tiếp. Mục 12.9 kiểm máy A của chủ bấm “Dùng key mới trên máy này” rồi nhập PIN theo 3B. Máy B khi phát hiện mất phiên phải về màn ghép, tự nhập key mới rồi nhập PIN. Mục này cũng kiểm giao key từ `applied` theo 2A và cảnh báo máy vừa ghép có thể phải ghép lại. [TC-OWNER-52](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#5-khôi-phục-chuyển-quyền-và-reset) · [TC-OWNER-87](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#5-khôi-phục-chuyển-quyền-và-reset).

**Rà soát mốc kiểm từng phần trước khi đổi.** OpenSpec strict và `git diff --check` đạt. Hai subagent độc lập `APPROVE` phần Auth và phần bằng chứng/nghiệm thu trên blob kế hoạch `2e34302e`, biên bản `6c869ef1` và checklist `38956ca9`. Phạm vi duyệt ở mốc này gồm tài liệu, cấu hình và mốc nền hai máy.

**Rà soát kết quả mục 12.10.** Hai subagent độc lập `APPROVE` phần Auth và phần bằng chứng/nghiệm thu trên blob kế hoạch `e4608939`, biên bản `e69ff7ca` và checklist `4cea740b`. Phạm vi gồm phép đo tuần tự trên fixture, phục hồi và giới hạn bằng chứng. OpenSpec strict và `git diff --check` đạt.

## Thiết kế mục 12.8 · Worker tiếp tục lượt đổi key bị ngắt

**Trạng thái ngày 25/11/2026.** Linh chốt A + M-A. Lát nền DB 12.8a đã hiện thực và kiểm PostgreSQL cô lập ở worktree code riêng. Mục 12.9 vẫn mở.

### Kết luận thiết kế

1. `pending` giữ một bí mật ứng viên kín và một `generation` mới. Mỗi dispatch có attempt/token bất biến; chỉ một worker nhận bí mật cho đúng một lệnh `updateUserById`. Chỉ lỗi đã chứng minh `no_effect` mới được tạo attempt/token kế tiếp với cùng ứng viên. Timeout, 5xx, ngắt kết nối và lỗi ngoài allowlist là `ambiguous`: worker dùng password grant để xác minh, không phát lại Admin update mù quáng.
2. Lần đổi mật khẩu đầu là bước vừa áp mật khẩu vừa xóa refresh session theo Auth `v2.198.0`. Phiên tạm dùng để xác minh được đăng xuất `local`. Không dùng Admin đặt lại cùng mật khẩu hay `signOut(..., 'global')` như một bước hậu kỳ.
3. `applied` là điểm công bố: Auth đã xác nhận ứng viên, phiên xác minh đã dọn, và một giao dịch DB thay bản mã trên `stores`, tăng `key_generation`, ghi audit, xếp thư và đặt `session_warning_until = applied_at + access_token_ttl`. Từ đây key mới là key hiện hành; quên key có thể gửi theo 2A. Access JWT cũ vẫn theo quyết định 42 và TTL 3.600 giây; `completed` không tắt sớm cảnh báo hội tụ.
4. `completed` chỉ là CAS/đối soát DB bằng `rotation_id + generation`; không gọi Auth. Một lượt cũ vì vậy không thể đặt lại mật khẩu hoặc thu hồi phiên của lượt sau. Mất phản hồi ở `applied` chỉ lặp bước DB.
5. Mỗi quán có tối đa một rotation chưa `completed`. Yêu cầu đổi key thứ hai khi lượt trước `pending` hoặc `applied` chỉ nhận trạng thái lượt trước, không dùng OTP hay sinh key. Quyền từ `applied` áp dụng theo M-A đã chốt cho thư đang gửi hoặc chưa rõ kết quả.
6. Thư cấp lại gắn `rotation_id`. Thư quên key gắn từng quán, thế hệ và chủ. Lát SMTP sẽ kiểm lại thế hệ khi cấp quyền gửi. Thiết kế M-A hoãn đổi key, email và chủ khi thư ở `sending`/`unknown`. Thời điểm đến hộp thư sau lúc SMTP nhận là giới hạn Linh đã chấp nhận.
7. Sau lỗi liên tiếp thứ 6 trong cùng pha, worker ghi đúng một cảnh báo đã lọc và dừng tự claim. Không ghi key, token hay email vào log.

Thiết kế chi tiết nằm ở [design.md](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#sau-khi-mã-đúng). REQ-OWNER-10, UC-OWNER-09 và TC-OWNER-52/55/87 đã được đồng bộ. Ba ca mới là TC-OWNER-113 (hai worker/thế hệ), 114 (chỉ giao key hiện hành) và 115 (race Auth, phân biệt JWT cũ với JWT mới).

### Đối chiếu với source hiện có

- `main@e362c1d` chưa có `store_key_rotations`, action `regenerateStoreKey` hay port recovery. Worker `processOwnerWork` hiện chỉ sweep thư, xử lý OTP/Store Key mail và chạy một seed.
- Queue thư hiện có mẫu `FOR UPDATE SKIP LOCKED`, claim token và hạn 60 giây; rotation có thể tái dùng cách claim DB ngắn, nhưng dispatch Auth phải bất biến thay vì cho worker hết lease phát lại side effect.
- `IStoreProvisioningPort` chỉ phục vụ tạo quán. Lát T08 thêm `IOwnerRecoveryPort` riêng; không mở rộng port tạo quán thành port tổng hợp.

### Lát triển khai đầu tiên

Lát đầu chỉ gồm schema/RPC và kiểm PostgreSQL cô lập, chưa nối UI hay staging:

1. Migration candidate: `stores.key_generation`, `private.store_key_rotations`, `private.store_key_rotation_dispatches`, `mail_dispatches.rotation_id` nullable và `private.key_mail_bindings` không chứa bí mật, cùng FK/index/constraint; revoke/grant theo least privilege. Đây là nền outbox trung lập cho cả M-A/M-B, chưa thêm worker SMTP, payload/link hay hàng rào owner-action.
2. RPC thuần DB: tạo `pending`, claim một dispatch attempt, chỉ tạo attempt mới sau `no_effect` đã chứng minh, ghi kết quả/đếm lỗi, áp dụng `applied` cùng đúng một mail row + binding trung lập, hoàn tất `completed`. Kiểm ID, generation và attempt/token khi chuyển trạng thái. Thứ tự khóa là advisory key của quán → hàng `stores` ở chế độ ghi → rotation → dispatch → thư theo ID/audit. Luồng tạo lượt khóa attempt ID trước khóa quán.
3. Contract tests cho trạng thái/constraint, phân loại `no_effect`/`ambiguous`, hai worker xen kẽ, token cũ, R1/R2, crash ở từng ranh giới, lỗi thứ 6 và tính duy nhất/rollback của mail row + binding. Auth dùng spy/fake ở lát này; không được gọi staging để nhận lát DB là PASS. Các interleaving SMTP/owner-action của TC-OWNER-114 thực hiện ở lát tích hợp M-A.
4. Sau khi lát DB qua review mới nối worker/Auth và test TC-OWNER-113/115; sau đó mới thêm `IOwnerRecoveryPort`, API/adapter/mock, UI 3B và staging 4A.

### Các phương án đã trình trước khi Linh chốt

Đường tự động đã đủ hành vi cho lỗi thông thường và mất phản hồi sau khi Auth nhận lệnh. Còn một tình huống không thể tự phân biệt an toàn: worker commit `dispatched` rồi chết **trước** khi gửi HTTP, trong khi password grant ứng viên vẫn bị từ chối. Thiết kế dừng sau sáu lần và cảnh báo; không tự phát lệnh thứ hai vì tiến trình cũ có thể đến muộn.

Trước lát operator recovery cần Linh chốt một trong hai phạm vi:

- **A — Khuyến nghị:** giai đoạn đầu chỉ cảnh báo và giữ `pending`; operator dùng quy trình riêng để xác minh không còn lời gọi cũ rồi mới đóng attempt cũ, tạo attempt/token mới với cùng ứng viên. An toàn hơn, đổi lại quán bị chặn đổi email/chuyển quyền/reset cho tới khi xử lý.
- **B — Thêm recovery operator ngay trong lát worker:** xây action có audit để probe, xác nhận thời gian yên lặng và phát lại cùng ứng viên. Phạm vi/test lớn hơn; vẫn phải định nghĩa căn cứ nào đủ để khẳng định lời gọi cũ không còn chạy.

Quyết định này không đổi 42, 2A/3B/4A hoặc quy ước quên key gửi key hiện hành. Nó chỉ chặn phần operator recovery sau cảnh báo; schema, state machine an toàn, port và các ca tự động độc lập vẫn có thể triển khai trước sau khi bộ spec được duyệt.

Thư chứa key có một quyết định riêng vì SMTP không cho thu hồi thư đã nhận và không chứng minh thứ tự đến hộp thư:

- **M-A — Khuyến nghị:** ghi hàng rào bền vững khi mail `sending`; tạm chặn đổi key mới, đổi email và chuyển quyền tới khi `submitted` hoặc chắc chắn chưa submit. `unknown` cần operator. Khi còn `queued`, rotation mail giữ một row và bind lại sang owner/email hiện hành; forget binding không còn khớp bị loại, không chuyển hộp thư; tạo generation mới đóng binding generation cũ. Giữ hợp đồng email chứa key, nhưng ba thao tác có thể bị chờ; thư đã submit vẫn có giới hạn giao chậm và phải ghi generation/thời điểm.
- **M-B:** đổi email thành link một lần lấy key hiện hành lúc mở, vô hiệu khi đổi owner/email. Không chặn ba thao tác vì mail in-flight và bảo đảm key lấy ra là hiện hành, nhưng thay quyết định 8/hợp đồng “thư chứa key”, thêm endpoint/token/màn bảo mật.
- **M-C:** chỉ kiểm generation trước SMTP, không chặn. Ít phạm vi nhất nhưng thư cũ có thể đến sau thư mới, nên không đáp ứng bảo đảm mạnh và không được khuyến nghị.

### Linh chốt A + M-A ngày 25/11/2026

Linh chấp nhận các hạn chế và giao ghi rõ điểm mạnh, đánh đổi rồi triển khai khi sẵn sàng. A tránh tự phát lại lệnh Auth chưa rõ kết quả và giảm phần công cụ operator. Quán có thể kẹt ở `pending` sau sáu lỗi và phải chờ căn cứ xử lý thủ công. M-A giữ việc gửi key trực tiếp, giảm thay đổi với luồng email và chặn cuộc đua trước khi SMTP tiếp nhận. Đổi key khẩn, đổi email và chuyển quyền có thể phải chờ nếu thư đang gửi hoặc có kết quả chưa rõ. SMTP đã nhận có thể giao thư sau lượt đổi kế tiếp hoặc sau đổi email/chuyển quyền. Trường hợp sau có thể đưa key còn hiệu lực tới hộp thư cũ nếu quán chưa đổi key.

Thực hiện từ lát nền DB đã bàn giao, với schema riêng sau T06, RPC nội bộ và outbox chưa được worker hiện hành nhặt. Cổng cho mail/owner-action chuyển sang yêu cầu hiện thực và kiểm TC-OWNER-114 theo M-A. [Quyết định 59–60](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#quyết-định-đã-chốt).

### Hiện thực và kiểm lát 12.8a ngày 25/11/2026

Source nền `main@e362c1d`, nhánh local `feat/t08-store-key-rotation-db`. Candidate SQL `supabase/candidate/owner-store-key-rotation.sql` giữ riêng sau T06. Test nằm ở `tests/contracts/ownerStoreKeyRotation.local.test.mjs`. Điểm đọc code cho Linh đi từ `owner_begin_store_key_rotation` qua claim/report tới advance. Begin chỉ dùng trong DB để giao dịch OTP tương lai gọi. Claim phát đúng một quyền gửi cho mỗi attempt. Report giữ `ambiguous` khi cần probe và chốt ngưỡng sáu lỗi. Advance khóa quán và commit key, audit, mail và binding cùng giao dịch, sau đó đối soát DB để hoàn tất.

Kiểm trên PostgreSQL 16.15 loopback và Node 24.16.0, DB sạch dựng từ baseline T06 với Auth/Storage giả. `ownerProvisioning.setup.local.mjs` khởi tạo thành công. `psql -X -v ON_ERROR_STOP=1` áp candidate và chạy hồi quy `ownerProvisioning.local.sql` với exit 0. Hai lượt `node --test tests/contracts/ownerStoreKeyRotation.local.test.mjs` liên tiếp trên cùng fixture đều đạt năm ca và nhóm cha, sáu mục PASS, exit 0. Bộ ca kiểm deny quyền, hai kết nối tranh claim qua `pg_blocking_pids`, lease hết hạn và token cũ, rollback khi outbox lỗi, mốc cảnh báo độc lập, sáu lỗi và rào mail ở đầu lượt đổi. Ca thư T06 chạy cả hai thứ tự tranh khóa, kiểm trạng thái chưa rõ và việc đóng đường giao key khi rotation thắng. OpenSpec strict và kiểm whitespace của diff tài liệu đạt.

Các kết quả chỉ phủ phần DB của TC-OWNER-87/113/114. TC-OWNER-114 vẫn cần lớp SMTP và thao tác chủ. TC-OWNER-115 cần Auth thật. Còn nối OTP, worker Auth/SMTP, xử lý người vận hành và giao diện. Checklist 12.8 đầy đủ và 12.9 vẫn mở. Candidate chưa nối vào bundle triển khai T06.

**Rà độc lập lát 12.8a.** Hai reviewer AI trả `APPROVE` trên baseline `e362c1d`, blob SQL `66eaa352b240d54b6e57d0f3d2315f1cb2070561`, blob test `a5460d6c7b8b3e60f9c04941df4a9bf905677f3c` và diff docs `7918373b14dd3fb01851a0e52011ed843518e7ac` trước khi ghi kết quả review này.

| Phạm vi reviewer | Xử lý và kết quả |
| --- | --- |
| An toàn DB, quyền và cạnh tranh | Lượt đầu yêu cầu thêm race với thư T06, đồng bộ thứ tự khóa, cập nhật trạng thái M-A và bằng chứng local. Lượt cuối xác nhận đã xử lý bốn điểm, so lại delta kỳ vọng TC-OWNER-113 rồi `APPROVE`. |
| Hợp đồng, truy vết và nghiệm thu | Đối chiếu quyết định 59–60, SQL và test theo phạm vi DB, các gate Auth/SMTP/UI còn mở. Xác nhận delta cuối về cửa sổ `pending` trong TC-OWNER-113 và `APPROVE`. |

<a id="kiem-backend-128b-20261126"></a>

### Lát backend 12.8b ngày 26/11/2026

Linh giao tiếp tục triển khai sau lát 12.8a. Candidate đi từ gateway `api/owner-otp.js` tới Edge `owner-provisioning` rồi tới PostgreSQL. Ba file SQL `owner-store-key-rotation.sql`, `owner-store-key-rotation-otp.sql` và `owner-store-key-rotation-mail.sql` áp theo thứ tự sau nền T06. `POS_CAFE_STORE_ROTATION_ACCESS_TOKEN_TTL_SECONDS` bật riêng lane T08 khi đã có đủ SQL và TTL Auth được đối chiếu. Candidate giữ T06 chạy khi biến này chưa cấu hình.

- Phát OTP rotation qua địa chỉ IP do gateway ký. Handler gọi Auth để xác minh access JWT. RPC kiểm role owner, phiên nhân viên và tên quán sau khi khóa quán. Ledger thử thách dùng chung với T06 để giữ trần IP và trần ngày theo dự án. Rotation không gán thử thách vào `current_challenge_id` của luồng tạo quán. Phản hồi OTP không có email chủ.
- OTP cùng commit với rotation `pending`. Phản hồi gốc có thể mang key khi chính lời gọi đó đã công bố `applied`. Replay chỉ lấy trạng thái. Nếu bị ngắt, worker ký HMAC chọn lượt đến hạn. Sau kết quả Auth chưa rõ, worker xác minh đúng tài khoản quán rồi dọn phiên probe bằng logout local. Worker không cấp lại quyền phát mật khẩu cho attempt mơ hồ.
- Worker claim, kiểm lại binding và gửi thư hỗ trợ theo M-A. Thư ghi phiên bản key, mốc đổi và cảnh báo trong cửa sổ TTL. Trạng thái gửi chưa rõ giữ hàng rào đổi key. Hàng rào với đổi email và chuyển quyền sẽ nối khi các thao tác đó được hiện thực.
- Gateway và Edge giữ HTTP 401 cho phiên thiếu hoặc hết hiệu lực và HTTP 403 cho vai trò hoặc trạng thái quán bị từ chối. Yêu cầu phát mã trong khi đang đổi trả trạng thái lượt hiện hành. Attempt đã được chấp nhận gắn mã băm và thử thách gốc. Lần sai thứ năm khóa mã và vẫn trả lỗi sai mã. Lần nhập mới sau đó mới nhận lỗi đã chạm giới hạn.
- Hệ thống lưu đúng một bản ghi cảnh báo đã lọc cho lượt đổi chạm ngưỡng lỗi hoặc thư có kết quả không rõ. Worker nhận và xác nhận cảnh báo riêng. Nếu mất xác nhận, cảnh báo có thể được ghi lại vào log với cùng `alertId`. Mốc cảnh báo phiên trong thư được tính khi DB cho phép gửi.

Kiểm trên nhánh `feat/t08-store-key-rotation-db` nền `e362c1d`, PostgreSQL 16.15 loopback, Node 24.16.0 và Deno 2.9.6. Áp ba candidate từ fixture sạch và chạy hồi quy SQL T06 với exit 0. Deno kiểm kiểu Edge đạt, hồi quy T06 đạt 3 ca và 2 bước. Node contract T08 chạy hai lượt liên tiếp trên cùng fixture, mỗi lượt đạt 7 ca và nhóm cha, 8 mục PASS. Bộ thử chạy handler thật, DB thật và Auth/SMTP giả. Các ca bổ sung phủ ký riêng request, chủ/nhân viên, tên quán, trần IP dùng chung T06, OTP, trạng thái khi đổi, mốc cảnh báo thư, mất phản hồi Auth và nhận lại cảnh báo. Node gateway/release-policy 7 mục PASS.

Bản này chưa có UI/port, Quên Store Key và đường mở lượt thủ công. Ca Auth đồng thời TC-OWNER-115, SMTP thật và nghiệm thu UI trên staging vẫn `NOT_RUN`. Lượt 12.8b giữ toàn bộ thay đổi ở worktree local. Các tích hợp còn lại cần đủ trước khi dùng link staging để nghiệm thu trọn luồng.

**Review 12.8b.** Hai reviewer AI độc lập cùng `APPROVE` manifest code `c09d5ac53219aba42055d06e6a4b2e1f36bc7da5` và diff docs `d217c357a19d683c4cd8365d3922a960f027bfc6` trước khi ghi metadata này. Reviewer an toàn kiểm quyền OTP, khóa, quota và mail. Reviewer hợp đồng kiểm worker, Auth, gateway và phạm vi bằng chứng. Các finding đã sửa gồm HTTP 401/403, trạng thái của yêu cầu phát mã khi đang đổi, mốc cảnh báo lúc cấp quyền gửi, cảnh báo bền vững khi mất phản hồi, ràng buộc thử thách/mã của replay và mã lỗi lần sai thứ năm. Bản cuối có ca kiểm cho các điểm này và qua OpenSpec strict.

<a id="kiem-ui-doi-store-key-20261126"></a>

### Lát UI đổi Store Key và ghép lại máy của chủ ngày 26/11/2026

Linh giao bước tiếp theo sau backend 12.8b. Lát này nối Cài đặt với API đổi key và thực hiện 3B trên máy A. Trong Cài đặt, mục Đổi Store Key hiện cho phiên chủ đã xác minh của đúng quán đang ghép. Chủ đọc cảnh báo, gõ lại tên quán đã lưu, yêu cầu mã qua email rồi nhập mã. Port gửi yêu cầu phát mã qua gateway và gửi xác nhận tới Edge bằng phiên quán cùng phiên nhân viên hiện hành. Flag UI `VITE_OWNER_RECOVERY` mặc định tắt và độc lập với flag server.

Phản hồi gốc mang key `applied` mới mở phần hiển thị và sao chép key. Nếu xác nhận bị ngắt, nút “Kiểm tra lại” dùng lại thử thách, OTP và mã lượt xác nhận đã gửi. Phản hồi chỉ có trạng thái hướng chủ kiểm tra email. Form đổi key và thao tác ghép một chạm giữ OTP và key trong bộ nhớ của lượt thao tác. Kết quả đến sau khi mất quyền bị bỏ. Khi API báo phiên hết hiệu lực, app đóng luồng đổi, chuyển về ghép thiết bị nếu mất phiên quán hoặc màn PIN nếu mất phiên nhân viên. Nếu đã xác nhận mã thì lời nhắc đề cập email nhận key khi lượt đổi thành công. Khi chủ bấm “Dùng key mới trên máy này”, app dọn dữ liệu phiên ở UI, yêu cầu đăng xuất phiên cũ ở phạm vi thiết bị và dùng giá trị đang hiển thị để ghép lại. Ghép thành công chuyển sang nhập PIN. Ghép thất bại thì app yêu cầu dọn cả phiên vừa tạo dở, cho nhập key bằng tay và hướng dẫn lấy key từ email.

Kiểm local trên Windows với Node 24.16.0, Vitest 4.1.10, Playwright Test 1.62.1 và fixture chủ quán, OTP giả. Test adapter kiểm tuyến HTTP, cấu trúc phản hồi và thay phiên. Test UI kiểm dùng lại đúng mã yêu cầu phát OTP và đúng bộ dữ liệu xác nhận khi mất phản hồi, chỉnh thời gian khi mã yêu cầu quá cũ, mở yêu cầu mã mới khi server báo OTP hết hạn, bỏ key đến muộn sau khi mất quyền, xử lý phiên bị từ chối và dọn phiên mới tạo dở nếu ghép lại thất bại. Đây là kiểm một phần các nhánh của TC-OWNER-52/87.

| Lệnh ở worktree code | Kết quả |
| --- | --- |
| `npm test -- --maxWorkers=4` | Exit 0. 119 file, 1.267 ca đạt. |
| `npm run build` | Exit 0. TypeScript và Vite build đạt. Vite có cảnh báo nạp cấu hình và kích thước bundle. |
| `npm run smoke -- --workers=2 tests/smoke/store-key-rotation.spec.ts` | Exit 0. Bốn viewport desktop và landscape đạt từ Cài đặt qua đổi key, ghép lại, nhập PIN rồi vào POS. Ca portrait được skip vì Cài đặt yêu cầu màn hình ngang. |
| `npm run ui-audit:selftest` | Exit 0. 23 finding từ trang mẫu lỗi, đủ 14 quy tắc và 16 phép kiểm vùng bấm. |
| `npm run ui-audit -- --state <state>` với `store-key-rotation`, `store-key-rotation-otp` và `store-key-rotation-result` | Cả ba lệnh exit 0. 0 phát hiện trên 9 cặp trạng thái và viewport. |

Code và test dựa trên `main@a2fa0fa`, manifest `a80e2168ef1e97db5a736533e4d9aefabe2622de`. Bản vá gồm cả tệp mới, manifest và log kiểm giữ local trong `D:/Workspace/pos-cafe-t08-rotation-20261125/artifacts/t08-rotation-ui-20261126`. Lệnh `git apply --reverse --check` đã đối chiếu bản vá với worktree.

Mục 12.9 vẫn mở. Phần máy B tự về màn ghép khi phiên Auth mất khả năng refresh còn cần nối và kiểm. Chưa kiểm đồng thời Auth, SMTP thật, cảnh báo khi key được giao trong cửa sổ TTL và xác nhận A/B có `session_id` mới trên staging. Quên Store Key và thao tác operator còn mở. Lát này chưa bật hay deploy T08 trên staging.

**Hướng dẫn đọc code.** Theo luồng từ `GeneralSettingsDrawer` tới `StoreKeyRotationPanel`, qua `ownerRecoveryPort` ở hai lời gọi OTP và sang `useRotatedStorePairing` khi chủ bấm dùng key. Đối chiếu test retry với replay chỉ trả trạng thái và test ghép thất bại với màn nhập key. Chưa có lượt đọc code trực tiếp của Linh được ghi nhận.

**Review lát UI.** Hai reviewer AI độc lập cùng `APPROVE` manifest code `a80e2168ef1e97db5a736533e4d9aefabe2622de` và diff docs `2aad1387612b332da65e2429ba2ce136bd8d1468` trước khi ghi metadata này. Reviewer an toàn kiểm phiên, dữ liệu nhạy cảm và dọn phiên mới tạo dở. Hai phát hiện chặn đã được sửa bằng cách chuyển ngay sang màn ghép hoặc PIN theo loại phiên bị từ chối và bổ sung test xác nhận lần dọn sau khi đăng nhập đã tạo phiên. Reviewer hợp đồng kiểm lỗi, replay, thời gian, hành vi 3B và phạm vi nghiệm thu. Phép kiểm phát mã được bổ sung cho lệch đồng hồ và mất phản hồi. Cả hai đã kiểm lại phần điều chỉnh cuối cho OTP hết hạn và đối chiếu hồ sơ với phạm vi local.

## Hiện thực và kiểm thử Quên Store Key

<a id="kiem-quen-store-key-20261126"></a>

### Lát Quên Store Key ngày 26/11/2026

Linh giao hiện thực gửi lại key hiện hành về email đã đăng ký. Màn Ghép thiết bị và Cài đặt dùng chung hộp thoại, nhập email rồi nhận thông báo chung. Gateway bỏ mọi dữ liệu riêng khỏi phản hồi và không chuyển credential khi nhận `forgotStoreKey`. Worker xử lý yêu cầu đã xếp hàng bằng candidate `owner-store-key-forgot.sql`. Phần UI và backend có flag riêng, mặc định tắt. Ở mốc kiểm local này, luồng chưa bật trên staging.

Hàng chờ gửi theo email hiện hành có một binding cho mỗi quán. Lúc cấp quyền gửi, worker bỏ binding lệch chủ, địa chỉ thư hoặc thế hệ. Quán `pending` không xuất hiện. Từ `applied`, thư có key mới và cảnh báo nếu còn trong cửa sổ TTL, kể cả sau `completed`. Thư ghi tên, địa chỉ hiện hành và key của các quán còn hợp lệ. Luồng không thay Store Key hay gọi Auth. Kết quả gửi `unknown` giữ hàng rào của thư Store Key, không gửi lại tự động và phát cảnh báo bền vững bằng ID để người vận hành đối soát. Intake và thư còn `queued` hết hạn sau 90 phút kể từ khi nhận yêu cầu. Hàng thư có kết quả cuối và binding tương ứng được dọn theo lô sau ba ngày nếu không gắn cảnh báo. Ca SQL xác nhận các mốc dọn và việc giữ rào `unknown`.

Kiểm backend qua handler thật và PostgreSQL 16.15 loopback trong bản sao fixture T08, với SMTP giả. Các ca phủ quyền RPC và bảng riêng, phản hồi thống nhất trước khi tra chủ, nhiều quán kể cả quán tạm ngưng, giới hạn IP/email/dự án dùng chung, `pending` và `applied`, cảnh báo trước và sau TTL, binding cũ sau đổi chủ/email, và mất kết quả SMTP khi đang gửi. Nhánh đổi chủ/email dùng phép thay đổi dữ liệu fixture để kiểm bộ lọc của worker. Thao tác đổi chủ/email của sản phẩm vẫn cần triển khai và kiểm riêng.

Linh duyệt sửa UI Audit sau khi hai trạng thái trên ba viewport báo sáu dương tính giả `zero-size-interactive`. Ảnh và DOM xác định các phần tử được báo có chiều cao 0, nằm cạnh `.MuiDialog-container` và giữ vòng Tab. Bộ đo nhận diện đúng cấu trúc MUI đang render. Selftest bổ sung kiểm hai phần tử giữ focus, một nút thật kích thước 0 và một phần tử gắn marker sai chỗ. Baseline giữ nguyên. Hai trạng thái chạy lại đều exit 0 với tổng 0 phát hiện trên sáu cặp.

| Phép kiểm local | Kết quả |
| --- | --- |
| Áp SQL candidate và `node --test tests/contracts/forgotStoreKey.local.test.mjs` | Áp từ bản sao fixture đã có ba candidate rotation. Exit 0 cho SQL và 11 mục Node test, gồm nhóm cha. |
| Deno `check` Edge và `test` hồi quy T06 | Exit 0. Hồi quy T06 đạt 3 ca và 2 bước con trên DB loopback với Auth/SMTP giả. |
| Gateway, release-policy, UI Audit runtime và kiểm bằng chứng UI | Exit 0. 94 ca Node đạt. |
| `npm test -- --maxWorkers=4` và `npm run build` | Exit 0. 119 file, 1.268 ca qua Vitest. TypeScript/Vite build đạt với cảnh báo Vite. |
| `npm run smoke -- --workers=2 tests/smoke/forgot-store-key.spec.ts tests/smoke/store-key-rotation.spec.ts` | Exit 0. 8 lượt desktop/landscape đạt, 2 portrait bỏ qua theo phạm vi Cài đặt. Có kiểm vòng Tab trong hộp thoại. |
| `npm run ui-audit:selftest` và hai trạng thái `forgot-store-key-pairing`, `forgot-store-key-settings` | Exit 0. Selftest giữ 23 phát hiện mẫu, 14 quy tắc, 16 phép kiểm vùng bấm và đạt ca MUI bổ sung. Audit local đạt 6/6 cặp. |

Code và test dựa trên `main@a2fa0fa`, manifest `84c3a1488426c7fa5ef8c174275317573ef76e48`. Để chạy lại SQL trên cụm loopback đã dùng, tạo bản sao cô lập của fixture `pos_cafe_t06_contract_t08review`, áp `owner-store-key-forgot.sql` rồi đặt `POS_CAFE_T08_TEST_DSN` tới bản sao có tên bắt đầu bằng `pos_cafe_t06_contract_t08forgot`. Bản vá, manifest và log kiểm được giữ local. Bản vá đã qua `git apply --reverse --check`. OpenSpec strict đạt.

Phép kiểm local dùng SMTP giả. Hai lượt kiểm email và phiên thật trên staging nằm ở các mục bên dưới.

**Hướng dẫn đọc code.** Theo luồng từ `ForgotStoreKeyDialog` qua `createForgotStoreKeyPort`, `api/owner-otp.js` và nhánh `forgotStoreKey` của Edge. Đối chiếu `owner_enqueue_forgot_store_key` với test phản hồi trước tra chủ, và `owner_claim_forgot_key_mail` với các ca binding hết hiệu lực và quota. Chưa có lượt đọc code trực tiếp của Linh được ghi nhận.

**Review lát Quên Store Key.** Hai reviewer AI độc lập cùng `APPROVE` manifest source `84c3a1488426c7fa5ef8c174275317573ef76e48` và diff docs `2da5b3722d159eddfd365282ea9c491b3ed1bd47` trước metadata này. Reviewer an toàn kiểm quyền, quota, mốc lưu dữ liệu, chỉ mục dọn và rào khi SMTP chưa rõ. Reviewer hợp đồng kiểm luồng UI, thư hiện hành, cửa sổ TTL, tranh quyền gửi và phạm vi test. Các phát hiện về intake/queued hết hạn, dọn thư terminal theo lô, pin kiểm phát hành và danh mục UI Audit đã được xử lý. Candidate cuối được kiểm lại với đầy đủ các nhánh này.

<a id="staging-quen-store-key-20261126"></a>

### Triển khai staging Quên Store Key ngày 26/11/2026

Linh giao bật riêng Quên Store Key và kiểm nhận key hiện hành cùng khả năng giữ phiên máy đã ghép trên Chrome profile 24tx và nguyentronglinh045. Linh duyệt mở PR và merge khi đủ review và CI. T08 dùng schema chung với đổi key, cờ đổi key chưa bật. [PR #47](https://github.com/nguyentronglinh045/pos-cafe/pull/47)

- Preflight trong profile 24tx xác nhận đúng Supabase staging, RPC T06, cron `pos-cafe-owner-work` và quán thử #0033 `active`. Hai schema T08 và hai cờ Edge còn vắng trước lượt áp.
- Áp SQL bốn candidate trong một giao dịch, SHA-256 `5e28b77731a559f9425e0053beb9e11b0c6f70a48fba2bb796e76d4793841873`. SQL Editor xác nhận thành công. Hậu kiểm thấy schema, hai chỉ mục mail cần thiết, quyền chỉ `service_role` đối với RPC kiểm, và chưa có lượt quên key.
- Deploy hàm `owner-provisioning` với hai cờ còn vắng. Các tệp `index.ts`, `handler.ts` và `rotation.ts` đọc lại khớp source `4e81a78` sau chuẩn hóa xuống dòng. Hai tệp phụ trợ khớp nguồn trước khi deploy. Hành động đọc trạng thái T06 trả HTTP 200 `not_accepted` với mã thử chưa dùng đã cũ. Edge ghi POST 200 ở nhịp worker 10:33:02 sau khi deploy.
- Chỉ đặt `POS_CAFE_FORGOT_STORE_KEY_ENABLED=1`. Cờ TTL của đổi key tiếp tục vắng. Sau khi đặt cờ, Edge ghi POST 200 ở nhịp 10:36:03. Receipt này xác nhận backend và worker, chưa xác nhận thư thật.
- Rà phát hành trước commit `4e81a78` phát hiện request cần giữ cookie bảo vệ Vercel và runbook cần kiểm rõ trình tự bật cờ. Bản đã sửa giữ cookie same-origin ở phía browser, bỏ credential trong request chuyển tiếp ở gateway, kiểm backend theo thứ tự cờ tắt, SQL, Edge, worker, cờ Quên Store Key, Preview. Hai reviewer duyệt `4e81a78`.
- CI của `4e81a78` qua các pha sớm và dừng ở smoke do hai ca portrait mới được skip ngoài danh sách 37 ca cho phép. Bản `787e48d` kiểm lối vào Ghép thiết bị ở portrait và hướng dẫn xoay máy, rồi chạy các bước Cài đặt ở landscape. Không đổi danh sách skip. Chromium kiểm 10/10 lượt, hai reviewer duyệt commit này. Chờ CI chính thức trên PR và trên `main`.

Smoke local trên `787e48d` đạt 69 lượt, 37 lượt bỏ qua theo danh sách trước đó, 0 lỗi và 0 lượt không ổn định. UI Audit toàn bộ đạt 69 cặp trạng thái và viewport, 0 phát hiện. OpenSpec strict đạt.

CI của PR và push nhánh trên đúng head `787e48d` đều đạt. PR #47 merge thành `e3021ef`, có cùng Git tree đã rà `1aa061ae`. Tại mốc merge, push CI `45751813514`, attempt 1, đang chạy trên chính commit `main` này. Phép kiểm hành vi dùng Protected Preview của `e3021ef` sau khi CI và workflow deploy đạt.

Push CI `45751813514` attempt 1 qua smoke và dừng ở UI Audit với `COMMAND_FAILED`, `REPORT_MISSING`, `RESULT_INVALID`. Pha mất khoảng 339 giây, gồm ca PIN riêng và lượt toàn ma trận có giới hạn 330 giây. Dấu hiệu phù hợp với việc tiến trình chạm giới hạn, log công khai không xác nhận nguyên nhân. Đã chạy lại trên đúng commit `main`, giữ gate và phạm vi kiểm.

Push CI attempt 2 đạt trên đúng `e3021ef`. Workflow `45755385135` qua bước duyệt của môi trường `Preview` và xác nhận Vercel `READY` ở chế độ Supabase staging, auth readiness và permission contract đều đạt. Đối chiếu sau deploy xác nhận định tuyến production và cấu hình bảo vệ Preview giữ nguyên. [CI của main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45751813514/attempts/2) · [Workflow Preview](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45755385135)

Linh chỉ định dùng Chrome 24tx có quyền truy cập Protected Preview. Phép kiểm một quán dùng hai tab của profile này.

#### Phép kiểm staging một quán từ màn Ghép thiết bị

- Quán thử #0033 ở thế hệ key `0` và có 0 bản ghi phiên Auth trước khi ghép. Đối chiếu email đăng ký của quán với hộp thư 24tx. Ghép một tab bằng key từ thư gốc và thấy màn chọn nhân viên. Đọc lại Supabase được đúng một phiên Auth và chưa có thư `forgot_store_key` cho quán.
- Giữ tab đã ghép, gửi đúng một yêu cầu từ hộp thoại Ghép thiết bị ở tab còn lại. UI trả lời chung “Nếu email này đứng tên quán, thư chứa Store Key đã được gửi.” Gmail nhận một thư mới tại địa chỉ đăng ký. Giá trị key đầy đủ trong DOM khớp từng ký tự với key từ thư gốc đã ghép thành công, gồm cả số quán. Hậu kiểm có một thư `submitted` với binding đúng thế hệ.
- Tải lại tab đã ghép sau khi nhận thư. Ứng dụng mở màn chọn nhân viên và tải danh sách nhân viên của #0033 mà không yêu cầu ghép lại. Đối chiếu cùng định danh phiên Auth trước và sau qua dấu vân tay tính trong DB. Số phiên là 1 và thế hệ key là `0` ở cả hai mốc. Hồ sơ chỉ lưu kết quả so khớp.

Lượt #0033 kiểm một phần TC-OWNER-49 trên Preview `e3021ef`, tới màn chọn nhân viên. Lượt hai quán bên dưới bổ sung lối Cài đặt và phép kiểm POS sau khi đăng nhập Chủ quán. Các ca UI Đổi Store Key 12.9 giữ trạng thái hiện tại.

Hai reviewer AI độc lập duyệt phần bằng chứng staging và cập nhật OpenSpec ở phạm vi 11.7b. OpenSpec strict đạt.

#### Chuẩn bị ca một email đứng tên hai quán ngày 26/11/2026

Linh chỉ định dùng email chính của 24tx và cho phép đọc mã kiểm thử trong Gmail trên Chrome 24tx. Truy vấn staging trước lượt tạo xác nhận email chính đứng tên 0 quán. Tạo dữ liệu thử bằng luồng T06 trên một Protected Preview khác cùng Supabase staging để giữ phiên #0033 trên bản Preview nghiệm thu.

Linh nhập PIN thử và gửi mã lần lượt cho A và B. Codex xác nhận A qua Gmail 24tx. Với B, màn xác minh đã cho phép gửi lại và chưa thấy thư khớp lượt hiện tại, nên Codex gửi lại một mã rồi dùng thư mới để xác minh. Biên nhận tạo quán và thư ban đầu khớp key cho #0034 và #0035. Supabase xác nhận cả hai quán `active`, thế hệ key `0` và cùng đứng tên email chính 24tx.

Trên Preview nghiệm thu `e3021ef`, Codex gỡ ghép phiên thử #0033 của Chrome 24tx sau khi phép kiểm trước đã xong. Hộp thoại ở lối Ghép thiết bị giải thích gửi key đang dùng về email đăng ký và giữ phiên đã ghép. Codex đóng hộp thoại mà chưa gửi, ghép quán A #0034 bằng key từ thư gốc và mở bước PIN Chủ quán.

<a id="tc-owner-49-hai-quan-staging-20261126"></a>

#### TC-OWNER-49 hai quán từ Cài đặt

- Linh giao Codex đăng nhập bằng PIN thử đã cung cấp và ưu tiên phát hiện lỗi trong phạm vi ca hiện tại. Codex mở được Báo cáo từ phiên Chủ quán của #0034. Trước khi gửi, Supabase ghi nhận một phiên Auth, một phiên nhân viên còn hiệu lực, hai quán ở thế hệ key `0` và chưa có thư Quên Store Key cho email chính của 24tx.
- Hộp thoại **Cài đặt → Quên Store Key** có cùng lời giải thích và nút gửi như lối Ghép thiết bị. Gửi đúng một yêu cầu, nhận phản hồi chung. Đóng hộp thoại trở lại Cài đặt và phiên Chủ quán vẫn mở. Supabase ghi một thư `submitted` có hai binding `34:0` và `35:0`.
- Gmail nhận đúng một thư mới gửi đến địa chỉ chính đã đăng ký, xác nhận trong chi tiết người nhận. Mở đầy đủ thư và đối chiếu qua DOM. Hai mục đúng tên, địa chỉ và từng ký tự của key gốc tương ứng #0034, #0035. Gmail rút gọn phần quán B trong hội thoại cùng tiêu đề. Nút **Hiển thị nội dung bị rút gọn** hiển thị phần còn lại.
- Sau khi nhận thư, mở lại Báo cáo và chọn **7 ngày** bằng chính phiên POS đang mở. Không cần nhập lại PIN hoặc ghép lại. Supabase xác nhận dấu vân tay phiên Auth và phiên nhân viên của #0034 trùng trước/sau, cả hai quán vẫn ở thế hệ key `0`.

TC-OWNER-49 đạt trên Protected Preview `e3021ef` bằng Chrome 24tx. Không ghi PIN, OTP, key, địa chỉ email, mã phiên hay dấu vân tay vào hồ sơ. TC-OWNER-50, 51, 100 và UI Đổi Store Key 12.9 không thuộc lượt chạy này.

Hai reviewer AI độc lập duyệt bằng chứng và cập nhật OpenSpec ở phạm vi 11.7c. OpenSpec strict đạt.

<a id="tc-owner-50-51-100-20261126"></a>

### Kiểm TC-OWNER-50, 51 và 100 ngày 26/11/2026

Linh giao kiểm phần còn lại của mục 11.7 và dùng lại bằng chứng TC-OWNER-49. Nguồn kiểm là `main@e3021ef`, Git tree `1aa061ae`, trùng checkout `787e48d` dùng để chạy local. Hai run trên đúng SHA đạt. Host Protected Preview đối chiếu với log triển khai và mở đúng POS Cafe bằng Chrome 24tx. [CI lần 2](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45751813514/attempts/2) · [Workflow Preview](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45755385135)

**Kiểm điều kiện staging.** SQL Editor của Supabase staging xác nhận #0034 và #0035 cùng `active` dưới hộp thư thử được chỉ định. Địa chỉ cộng thẻ của cùng hộp thư có 0 chủ và 0 quán. Tại mốc kiểm, địa chỉ chính dùng 0/3 lượt gửi trong một giờ, IP có mức dùng cao nhất là 0/10 trong một giờ và dự án dùng 4/400 trong ngày Việt Nam. Có một lịch worker đang bật. Tìm trong Gmail theo tiêu đề, địa chỉ cộng thẻ và mốc bắt đầu cho 0 kết quả trước khi gửi. Linh mở phiên Chủ quán của #0034 bằng PIN thử. Codex dùng **Cài đặt → Quên Store Key** và kiểm lại các số đếm lúc 17:40 trước khi gửi. [Bằng chứng hộp thư đối chứng TC-OWNER-49](#tc-owner-49-hai-quan-staging-20261126)

**Kết quả staging.** Cả năm yêu cầu hiển thị “Nếu email này đứng tên quán, thư chứa Store Key đã được gửi.”, giống TC-OWNER-49. Trước lượt thứ tư cho email chính, SQL ghi 4 intake đã xử lý, 0 thư cho alias và 3 thư `submitted` cho email chính. Sau lượt thứ tư, SQL ghi 5 intake đã xử lý. Email chính vẫn có 3 `submitted`, thêm 1 `provider_limited` với `submit_authorized_at` trống và 0 thư đang chờ hoặc đang gửi. Dự án tăng từ 4 lên 7 lượt gửi/OTP trong ngày rồi giữ 7 sau lượt chặn. Bộ lọc Gmail theo tiêu đề, người nhận và mốc thời gian cho 0 thư của alias. Trong hội thoại của email chính có đúng 3 mục mới lúc 17:44, sau khi mở nhóm thư Gmail gộp. Yêu cầu thứ tư gửi lúc 17:49, hậu kiểm lúc 17:50 sau khi worker đã chặn và Gmail vẫn có đúng 3 mục trong cửa sổ thử.

Các số đếm đã che nằm trong `staging-117.json`, SHA-256 `5c6b07b3568e5b5cc50c3d6b07487ab313c0ca62716c1b71538ced07e7facece`. Bản preflight ban đầu nằm trong `preflight-117.json`, SHA-256 `cfa649cb80efb2f5cc51d7da6c2a6f07a03a5a072ed0a8d5893529ae1d861596`. Hai file nằm cùng thư mục với kết quả local bên dưới.

| Tiêu chí | PostgreSQL 16.15 cô lập và SMTP giả | Protected Preview và Gmail |
| --- | --- | --- |
| **50** · email 0 quán, phản hồi như TC-49, 0 thư | Email fixture chưa có quán nhận `202` và `{ "ok": true }`, giống email có quán. Sau khi worker chạy, chỉ email có quán nhận một lần gọi SMTP giả. | Đạt. Một yêu cầu qua Cài đặt cho alias 0 quán, dùng phản hồi chung như TC-49. Hậu kiểm ghi 0 bản ghi mail và Gmail có 0 thư. |
| **51** · yêu cầu thứ tư trong một giờ, cùng phản hồi, 0 thư thêm | Ba yêu cầu cùng email lần lượt hoàn tất `submitted`. Yêu cầu thứ tư trong cùng cửa sổ nhận cùng `202` và body. Worker lưu một `provider_limited` có `submit_authorized_at` trống, tổng lần gọi SMTP vẫn là 3. | Đạt. Gửi đúng bốn yêu cầu cho email đăng ký. Trước lượt bốn DB có 3 `submitted` trong một giờ. Sau lượt bốn có cùng phản hồi, thêm một bản ghi bị giới hạn và 0 thư mới. Gmail nhận đúng ba thư thử. |
| **100(a)** · IP đã hết lượt | Một lượt OTP của fixture và chín yêu cầu recovery dùng hết 10 lượt IP. Yêu cầu recovery cho email có quán trả cùng `202` và body, không thêm intake hoặc thư. | Chưa kích hoạt hạn mức IP dùng chung trên staging. |
| **100(b)** · dự án đã hết lượt | Fixture ở 399/400. Hai yêu cầu recovery nhận cùng `202` và body. Worker dùng lượt cuối cho đúng một thư và chặn yêu cầu còn lại. Sau khi xác nhận 400/400, gửi thêm một yêu cầu recovery và chạy worker. Phản hồi vẫn giống nhau, SMTP tăng 0, bộ đếm vẫn 400. OTP cũng bị chặn ở hạn mức chung. | Chưa kích hoạt hạn mức ngày của dự án dùng chung. |
| **100(c)** · trả lời trước khi gửi thư, so thời gian phản hồi | Khi SMTP giả đang chờ, cả hai loại yêu cầu trả cùng `202` và body qua cùng RPC intake. Một cặp đo cuối là 1,01 và 1,00 ms. Ở phép kiểm đồng thời, worker hoàn tất `submitted` trước khi handler trả `202`. Điều đó vi phạm thứ tự yêu cầu trong ca. Khả năng phân biệt theo độ trễ chưa được kết luận từ mẫu local này. | Chưa tái hiện thứ tự song song hoặc đo độ trễ hai nhóm trên staging. |
| **100(d)** · mười yêu cầu 0 quán, yêu cầu thứ 11 có quán | Mười email fixture riêng chưa có quán cùng IP nhận `202` và tạo đúng 10 intake. Yêu cầu thứ 11 dùng email có quán, cùng IP và cùng phản hồi. Tổng intake vẫn là 10, worker xử lý cả 10 và SMTP giả có 0 lượt. | Chưa dùng hết lượt IP dùng chung trên staging. |

Phép kiểm hồi quy nguyên bản đạt 11/11, gồm test cha. Bản chạy bổ sung đạt 15/15 assertion test, gồm test cha, bốn bước đích danh cho TC-OWNER-51, 100(c), 100(d) và assertions thêm ở bước quota dự án. Một test đạt vì tái hiện đúng trường hợp sai thứ tự của 100(c). Cả hai dùng Node `24.16.0`, handler thật và SQL đúng Git tree nguồn. Fixture PostgreSQL chạy loopback từ bản sao `pos_cafe_t06_contract_t08review` có ba candidate rotation, rồi áp `owner-store-key-forgot.sql`. File `artifacts/t08-forgot-store-key-20261126/check-117.mjs` trong checkout code local có SHA-256 `7513e159bb31ee9fd603875b8f7bb7338d3743e39598cf3aca9b8f92ea067313`. Kết quả đã lọc ID nội bộ nằm cùng thư mục trong `check-117-result.txt`.

Đường đối chiếu từ `src/adapters/supabase/ownerRecoveryPort.ts:21` và `api/owner-otp.js:37` qua handler nhận yêu cầu ở `supabase/functions/owner-provisioning/handler.ts:474`. SQL intake ở `supabase/candidate/owner-store-key-forgot.sql:40`, tra quán ở dòng 59 và kiểm hạn mức email/dự án ở dòng 115. Đối chiếu tiêu chí với `tests/contracts/forgotStoreKey.local.test.mjs:149` và bản chạy bổ sung kể trên.

**Phát hiện TC-OWNER-100(c).** Fixture giữ kết quả RPC ở adapter sau khi PostgreSQL đã commit hàng intake. Worker chạy độc lập trên hàng đã commit. SMTP giả hoàn tất và hàng mail chuyển `submitted` trong lúc Promise phản hồi công khai vẫn chờ. Sau khi nhả kết quả RPC, handler mới trả `202`. Điều này tái hiện với handler và SQL thật ở loopback. SMTP và độ trễ trả kết quả RPC được điều khiển trong fixture. Ở runtime, hàng có thể được worker lấy từ lúc commit còn gateway phải đợi Edge trả lời. Vì vậy một nhịp worker trùng cửa sổ này có thể gửi thư trước khi người dùng nhận phản hồi. Cần xem lại thời điểm worker được phép lấy yêu cầu so với hợp đồng trả lời công khai, rồi chạy lại ca đồng thời và phép đo độ trễ. Linh quyết định hướng sửa sau khi xem biên bản.

<a id="theo-doi-ui-quen-store-key-20261126"></a>

**Quan sát khi đổi tab trên staging.** Khi chuyển từ SQL Editor về POS Cafe, một số lần màn hình báo “Chưa xác minh được quyền. Kiểm tra kết nối và thử lại.” rồi tự trở về Cài đặt. Hộp thoại mở lại với trường email trống. Hai thao tác bấm trước khi gửi thành công tạo 0 intake theo hậu kiểm. Lượt thử tiếp tục bằng Enter sau khi form hiện ổn định. Cần kiểm vòng đời UI tại `src/app/PermissionLifecycle.tsx:99` nếu xử lý việc mất nội dung khi quay lại tab. Chưa xác định nguyên nhân gốc của hiện tượng.

**Bàn giao.** TC-OWNER-50/51 đạt staging. Mục 11.7 vẫn mở do TC-OWNER-100(c) có lỗi thứ tự tái hiện local và phần đo độ trễ còn mở. Các phép kích hoạt hạn mức IP/dự án hoặc làm chậm SMTP cần môi trường độc lập nếu kiểm hosted. Các bằng chứng trên thuộc lát Quên Store Key. Phần nghiệm thu Đổi Store Key tiếp tục theo mục 12.9.

#### Rà độc lập biên bản 11.7

Hai reviewer AI trả `APPROVE` cho bản tài liệu trên nền `6cef663`, SHA-256 của `docs-117-v3.patch` là `5c367181a438be02f3c07052124a8f5e9374abcb03c7297ad6be7a35b57aebca`, trước đoạn metadata này. Reviewer hợp đồng đối chiếu từng nhánh với test, SQL và handler. Reviewer bằng chứng đối chiếu phiên bản, số đếm staging, trạng thái checklist và thông tin đã che. Cả hai dùng bản trích và kết quả đã lưu để rà chỉ đọc. OpenSpec strict, `git diff --check` và kiểm ngược bản vá đều đạt.

| Phát hiện khi rà bản đầu | Xử lý đã được kiểm lại |
| --- | --- |
| **Chặn biên bản** · TC-OWNER-100(b) chỉ có recovery lúc còn một lượt, rồi OTP lúc đã hết. | Bổ sung yêu cầu recovery sau khi xác nhận 400/400. Worker không gửi thêm và phản hồi vẫn giống. |
| **Chặn biên bản** · TC-OWNER-100(c) chưa thử cạnh tranh tại lúc commit. Một cặp thời gian thiếu căn cứ kết luận về khả năng phân biệt. | Tái hiện worker `submitted` trước `202` trong điều kiện kiểm soát. Ghi lỗi thứ tự và giữ phần thời gian phản hồi mở ở cả local và hosted. |
| **Đề xuất** · Thêm dấu vân tay bản trích preflight. | Bổ sung SHA-256 của `preflight-117.json` và bản trích kết quả staging `staging-117.json`. |

<a id="tc-owner-100c-receipt-20261126"></a>

### Sửa và kiểm lại TC-OWNER-100(c) ngày 26/11/2026

Linh yêu cầu giữ tiêu chí hiện tại, sửa thứ tự trả lời và gửi thư, kiểm lại ca đồng thời và độ trễ rồi cập nhật mục 11.7. Hiện tượng mất nội dung khi đổi tab được theo dõi riêng. [Quan sát khi đổi tab](#theo-doi-ui-quen-store-key-20261126)

Ứng viên code local dựa trên `main@e3021ef`, nhánh `fix/t08-forgot-response-order-20261126`. Bản vá `receipt-final-code.patch` có SHA-256 `f3e8e65eb6b13cec3ac6acabe0717eecd194a68c0fc97caec1b8913b8896b360`, nằm trong `artifacts/t08-forgot-store-key-20261126/` của worktree code. Bản vá gồm candidate SQL nâng cấp, Edge, gateway, adapter trình duyệt, test và ghim hash phát hành.

Ở bước đầu, intake giữ email trong `pending_email`. Edge sinh UUID ngẫu nhiên và gateway trả nó trong header của cùng phản hồi `202` với body `{ "ok": true }`. Trình duyệt đọc xong body, gắn thông báo chung vào DOM rồi xác nhận UUID qua gateway. RPC xác nhận chuyển email sang cột mà worker đọc và ghi `receipt_confirmed_at`. Ràng buộc bảng chặn dữ liệu sẵn sàng thiếu mốc xác nhận. Trước bước xác nhận, worker chưa thể tra chủ, giải mã key hoặc gửi thư. Cả email có quán, email không có quán và yêu cầu bị giới hạn IP đều có cùng status, body và định dạng header. Xác nhận thiếu hàng hoặc xác nhận lặp trả cùng kết quả. Lượt chưa xác nhận vẫn giữ suất IP và tự hết hạn sau 90 phút. Nếu kết nối đứt khi xác nhận, adapter thử lại cùng biên nhận một lần trong nền. Thông báo chung đã hiện vẫn giữ nguyên. Nếu DB chưa nhận được xác nhận và thư chưa đến, người dùng có thể thử lại yêu cầu.

**Kiểm đồng thời.** Dùng HTTP gateway thật qua loopback, handler Edge và PostgreSQL 16.15 cô lập, SMTP giả. Giữ kết quả RPC sau khi intake commit và chạy worker trong lúc gateway còn chờ. Worker tạo 0 bản ghi thư và SMTP có 0 lượt. Sau khi client đọc xong `202`, worker chạy lần nữa và vẫn không gửi khi thiếu xác nhận hợp lệ. Xác nhận không có chữ ký bị từ chối. UUID không khớp nhận phản hồi chung và không phát sinh thư. Hai xác nhận hợp lệ đồng thời ở HTTP và một lượt lặp sau gửi chỉ sinh đúng một thư. Fixture tuần tự hóa các RPC trên kết nối worker. Vitest kiểm riêng hộp thoại bằng cách đọc thông báo trong DOM ngay khi callback xác nhận chạy. Bộ contract đạt 14/14 mục mỗi lượt trong ba lượt chạy, gồm test cha, hồi quy giới hạn email/IP/dự án và quyền RPC.

**Độ trễ.** Mỗi lượt bỏ 8 cặp làm nóng rồi đo 80 cặp HTTP. Hai địa chỉ cùng độ dài, dùng chung IP trong từng cặp. Phép đo đổi nhóm đi trước qua từng cặp và hoán đổi quyền sở hữu giữa hai nửa mỗi lượt để từng địa chỉ xuất hiện trong cả hai nhóm. SMTP giả được giữ mở suốt phép đo. Cả hai nhóm hoàn tất phản hồi và chỉ gọi cùng RPC intake. Đơn vị là ms.

| Lượt | Email có quán p50 / p95 | Email không có quán p50 / p95 | Trung vị chênh lệch ghép cặp | Số cặp nhóm có quán chậm hơn |
| --- | --- | --- | --- | --- |
| 1 | 1,48 / 1,86 | 1,45 / 1,86 | 0,00 | 41/80 |
| 2 | 1,52 / 2,06 | 1,47 / 1,89 | +0,03 | 43/80 |
| 3 | 1,43 / 3,00 | 1,49 / 1,87 | +0,01 | 42/80 |

Trong 240 cặp trên loopback, nhóm email có quán chậm hơn ở 126 cặp. Chênh lệch trung vị ghép cặp dao động từ 0,00 đến +0,03 ms và p95 thay đổi theo lượt. Phép đo bao phủ thời gian đến lúc client đọc xong phản hồi `202`, với gateway Node và handler Edge gọi trong cùng tiến trình fixture. Hosted còn phụ thuộc Vercel, Supabase và đường truyền của máy thử. [Chuẩn Fetch về đọc JSON](https://fetch.spec.whatwg.org/#dom-body-json)

**Hồi quy và nâng cấp.** Candidate SQL từ chối khi còn intake cũ nằm trong cửa sổ xử lý hoặc thư cũ đang chờ gửi. Các phép thử từ chối tự hoàn tác. Áp thành công trên bản sao đã có schema của PR #47, xác nhận địa chỉ legacy hết hạn được xóa khỏi hàng, RPC hai tham số đã nghỉ và DB từ chối hình dạng ghi legacy thiếu mốc xác nhận. Deno check đạt. Hồi quy Edge T06 đạt 3 ca và 2 bước con. Gateway và release tooling đạt 38/38. Vitest đạt 1.270/1.270, build đạt và smoke mock Quên Store Key đạt 5/5. UI Audit selftest đạt 23 phát hiện mẫu. Hai trạng thái Quên Store Key đạt 6 cặp giao diện và viewport, với 0 phát hiện. OpenSpec strict đạt. Bằng chứng đã lọc nằm trong `receipt-final-contract-run1.txt`, `receipt-final-contract-run2.txt`, `receipt-final-contract-run3.txt` và `receipt-v2-guard.txt` cạnh bản vá.

**Bàn giao từ lượt local.** Mục 11.7f đã kiểm xong local. TC-OWNER-49…51 đã chạy trên bản `e3021ef`. Bước 11.7g cần xác minh bản sửa trên Protected Preview được duyệt. Quy trình nâng cấp tạm dừng Quên Store Key, xác minh hàng cũ đã xử lý và áp SQL trước khi chuyển backend sang luồng biên nhận. Các Preview cũ sẽ báo chưa gửi được yêu cầu sau khi chuyển phiên bản.

#### Rà độc lập bản sửa TC-OWNER-100(c)

Hai reviewer AI trả `APPROVE` cho bản vá code `f3e8e65eb6b13cec3ac6acabe0717eecd194a68c0fc97caec1b8913b8896b360` và bản vá docs `084642c7bdbb3646076e1575575e037e8dfe45012a59c457d8c94b24e77ba4b7` trước đoạn metadata này. Reviewer hợp đồng kiểm thứ tự UI, gateway, worker và phép đo. Reviewer dữ liệu kiểm quyền RPC, thời hạn, quota, nâng cấp, hash phát hành và nguồn bằng chứng. Cả hai đối chiếu bản vá, log local và kiểm chỉ đọc.

| Phát hiện khi rà ứng viên đầu | Xử lý và phép kiểm lại |
| --- | --- |
| **Chặn** · Adapter đợi kết quả xác nhận trước khi báo thành công. Worker có thể gửi trước lúc hộp thoại hiện phản hồi chung. | Đưa xác nhận xuống effect sau khi thông báo có trong DOM. Test hộp thoại đọc đúng thông báo ngay khi callback xác nhận chạy. |
| **Theo dõi nâng cấp** · Lượt RPC cũ đang dở có thể dùng hình dạng ghi đã coi email là sẵn sàng. | Ràng buộc SQL từ chối hàng thiếu mốc xác nhận. Kiểm trực tiếp hình dạng cũ nhận lỗi `23514`. Candidate cũng từ chối nâng cấp khi còn hàng legacy đủ điều kiện và dọn địa chỉ intake cũ đã hết hạn. |
| **Làm rõ bằng chứng** · Hai xác nhận đồng thời ở HTTP dùng chung kết nối SQL nối tuần tự. | Biên bản ghi đúng tầng song song và giữ riêng ca worker chạy giữa lúc commit và lúc client đọc phản hồi. |

<a id="tc-owner-100c-hosted-20261126"></a>

### Phát hành và kiểm 11.7g trên Protected Preview ngày 26/11/2026

Linh giao dọn bản sao PostgreSQL của lượt kiểm cuối, phát hành bản sửa và cập nhật checklist theo kết quả hosted. Chỉ xóa DB bản sao của lượt kiểm cuối sau khi đối chiếu thư mục dữ liệu, OID và số kết nối bằng 0. PostgreSQL local đã dừng. Đo trên ổ D trước và sau cho thấy dung lượng trống tăng 15.753.216 byte. Bằng chứng kiểm thử local vẫn nằm trong thư mục của lượt sửa.

Hai lượt CI của commit ban đầu dừng ở kiểm hash runbook Preview. Commit `7870ab0` cập nhật đúng hash của runbook đã rà. Reviewer kiểm lại delta này. CI của PR và nhánh push ở lượt 1 đều đạt. PR #48 squash vào `main@0aa934507bcf0387c475953f2bc78ae60b1f3ed2` với Git tree `3827a60127a3b97ce9037c9a8eb2b589ec874f16`, khớp bản được duyệt. [PR #48](https://github.com/nguyentronglinh045/pos-cafe/pull/48) · [CI của PR](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45811849344) · [CI của nhánh push](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45811843756) · [CI của main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45814110518)

**Tiền kiểm staging.** Lúc 18:44:46 UTC+7, PostgreSQL có 0 hàng intake cũ còn địa chỉ, 0 thư recovery ở trạng thái queued, sending hoặc unknown. RPC enqueue cũ còn tồn tại, RPC xác nhận chưa có. Mức sử dụng lớn nhất theo IP trong giờ là 1/10, theo dự án trong ngày là 7/400. Cron worker hoạt động, cửa sổ lần chạy 18:44 có một HTTP 200 với `ok=true`. Trên Chrome 24tx đã xác nhận địa chỉ thử đứng tên #0034 và #0035, alias cùng hộp thư đứng tên 0 quán, địa chỉ chủ quán dùng 0/3 lượt gửi trong giờ. Bản tải Edge trước nâng cấp khớp đủ năm tệp deploy của `e3021ef` sau khi chuẩn hóa xuống dòng. Bản trích đã che nằm trong `receipt-release-checkpoint.json` và `receipt-hosted-edge-preflight.json`.

**Phát hành.** CI push `45814110518` lượt 1 đạt trên đúng SHA merge. Workflow `45816368026` lượt 1 qua bước duyệt môi trường Preview và báo `READY` cho cùng SHA. Biên nhận xác nhận chế độ Supabase staging, Auth readiness và permission contract đều đạt, định tuyến production và bảo vệ Preview không đổi. Host mở trong Chrome 24tx khớp host trên biên nhận. [CI lượt 1 của main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45814110518/attempts/1) · [Workflow Protected Preview](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45816368026)

Tạm dừng Quên Store Key lúc 19:05:57 UTC+7. Hậu kiểm trước SQL vẫn thấy 0 hàng cũ còn địa chỉ và 0 thư queued, sending hoặc unknown, với mức dùng IP tối đa 0/10 và dự án 7/400. Sau khi công cụ Chrome mất kết nối và kết nối lại, áp thành công candidate biên nhận lúc 19:12:01. Schema có đủ hai RPC `SECURITY DEFINER` theo hợp đồng, chỉ `service_role` được gọi, RPC enqueue cũ đã nghỉ và hai ràng buộc biên nhận được xác thực. Deploy Edge lúc 19:12:50. Đọc lại ZIP từ staging và so đủ năm tệp với Git tại SHA merge sau chuẩn hóa xuống dòng, cả năm khớp. Hành động đọc trạng thái T06 trả HTTP 200 `not_accepted` với UUID thử cũ. Cron worker có HTTP 200 `ok=true` ở nhịp 19:13 lúc recovery tạm dừng và ở nhịp 19:15 sau khi khôi phục cờ lúc 19:14:32.

**Ca đồng thời trên bản hosted.** Từ màn Ghép thiết bị, gửi một yêu cầu cho hộp thư thử #0034/#0035. Dùng breakpoint DevTools trên đúng tab đó để giữ lần gọi xác nhận. Khi tab đang dừng, UI đã hiện “Nếu email này đứng tên quán, thư chứa Store Key đã được gửi.” DB lúc 19:16:30 thấy một intake chỉ có `pending_email`, 0 xác nhận và 0 hàng thư. Worker chạy lúc 19:17:00 và trả HTTP 200 `ok=true`. Hậu kiểm lúc 19:17:25 vẫn có một intake chờ, 0 xác nhận và 0 hàng thư. Sau khi tiếp tục tab, DB ghi `receipt_confirmed_at` lúc 19:17:48.570, cấp quyền gửi lúc 19:18:01.205 và chốt `submitted` lúc 19:18:04.547. Một hàng thư gắn đúng hai quán #0034 và #0035. Gmail thấy một kết quả khớp bộ lọc thử sau mốc ban đầu có 0 kết quả. Không đọc nội dung key cho lượt kiểm này.

**Đối chiếu alias.** Gửi một yêu cầu bình thường cho alias đã xác nhận không đứng tên quán. UI hiện đúng cùng nội dung. Sau nhịp worker, DB thấy một intake đã xác nhận và xử lý, 0 hàng thư. Gmail cho bộ lọc thử của alias vẫn có 0 kết quả. Tổng lượt kiểm hosted là hai lần gửi form. Breakpoint và hai tab tìm Gmail đã được đóng sau kiểm.

| Tiêu chí | Kết quả trên bản sửa |
| --- | --- |
| TC-OWNER-100(a) · IP đã hết hạn mức giờ | Đã kiểm bằng PostgreSQL cô lập và SMTP giả ở 11.7f. Chưa kích hoạt ngưỡng 10/10 IP trên hosted. |
| TC-OWNER-100(b) · Dự án đã hết hạn mức ngày | Đã kiểm bằng PostgreSQL cô lập và SMTP giả ở 11.7f. Chưa kích hoạt ngưỡng 400/400 trên hosted. |
| TC-OWNER-100(c) · Phản hồi trước khi gửi và độ trễ | Đạt quan sát thứ tự trên Protected Preview với một lượt giữ ACK qua nhịp worker. Đã kiểm SMTP chậm và đo 240 cặp HTTP ở local. Phép đo độ trễ so sánh và SMTP chậm trên hosted còn mở. |
| TC-OWNER-100(d) · 10 yêu cầu alias và yêu cầu thứ 11 | Đã kiểm bằng PostgreSQL cô lập và SMTP giả ở 11.7f. Chưa dùng hết hạn mức IP trên hosted. |

**Checklist.** Đánh dấu phần kiểm bản sửa trên Protected Preview. Giữ 11.7g mở vì cần môi trường hosted độc lập cho hạn mức dùng chung và SMTP chậm, gồm so độ trễ HTTP. Kết quả TC-OWNER-49…51 đầy đủ vẫn gắn với `e3021ef`. Bản trích `receipt-hosted-117g.json` có SHA-256 `488b452a902e3e784e499803158bd212e812c1c1fb160b58bf2ca731fe073d5d`. Bản đối chiếu Edge `receipt-hosted-edge-after.json` có SHA-256 `71c24f2864e205ced9f4ec95dbb62ecc5cf04bf9d1dfd22b453e995e0103d271`. Thư mục bằng chứng ở worktree code là `artifacts/t08-forgot-store-key-20261126/`.

**Rà độc lập.** Hai reviewer AI trả `APPROVE` cho bản vá docs `26ec7388c7364d711b3f797f8aaad6d2b7656a97b96f3f9b84bdabf7ce1e2b4d` trước đoạn metadata này. Một reviewer đối chiếu tiêu chí, phạm vi local và trạng thái 11.7g. Reviewer còn lại đối chiếu SHA, CI, phê duyệt Preview, SQL, ACL, ZIP Edge, thời điểm worker và số đếm DB/Gmail trong bản trích đã che. Hai lượt rà đều chỉ đọc. OpenSpec strict và kiểm bản vá đạt.

<a id="chot-sua-phat-hanh-tc-owner-100c-20261126"></a>

#### Quyết định chốt phần sửa và phát hành ngày 26/11/2026

Linh chốt phần sửa và phát hành TC-OWNER-100(c) theo kết quả PR #48 và Protected Preview `0aa9345`. Linh giữ tiêu chí hiện tại và để 11.7g mở. Các ca hosted còn thiếu được ghi là **giới hạn kiểm chứng** và giữ trạng thái **Chưa chạy**. Phạm vi còn lại gồm TC-OWNER-100(a), (b), (d) ở ngưỡng hạn mức IP hoặc dự án và TC-OWNER-100(c) với SMTP chậm và so sánh độ trễ phản hồi. Chạy các ca này khi có môi trường hosted độc lập.

Reviewer AI độc lập trả `APPROVE` cho cập nhật docs `54f3835032137d69e887bc6a7008b9e37e2f7825ec7ec490d65255fef65ea5d7` trước khi thêm dòng này. Rà chỉ đọc, đối chiếu quyết định, checklist, tiêu chí TC-OWNER-100 và các liên kết. OpenSpec strict và kiểm bản vá đạt.

<a id="chot-nghiem-thu-117g-20261126"></a>

#### Quyết định nghiệm thu 11.7g ngày 26/11/2026

Linh duyệt chốt 11.7g theo bộ bằng chứng hiện có. Quyết định cập nhật phạm vi bằng chứng cần để đóng mục. Tiêu chí sản phẩm, code và hạn mức hiện hành giữ nguyên. Lượt này chỉ cập nhật tài liệu.

- **PostgreSQL cô lập với SMTP giả.** Bản sửa đã qua ba lượt kiểm, mỗi lượt đạt 14/14 mục. Bằng chứng gồm các ca TC-OWNER-100(a), (b), (d) ở ngưỡng hạn mức, ca đồng thời của 100(c) và phép đo 240 cặp HTTP khi SMTP giả đang chờ. [Kết quả kiểm lại bản sửa](#tc-owner-100c-receipt-20261126)
- **Protected Preview `0aa9345`.** Thông báo chung xuất hiện khi trình duyệt còn giữ bước xác nhận. Worker chạy và tạo 0 thư trong lúc đó. Sau xác nhận có một thư cho hộp thư thử. Alias nhận cùng thông báo và có 0 thư. [Bằng chứng Protected Preview](#tc-owner-100c-hosted-20261126)

**Giới hạn kiểm chứng trên hosted.** TC-OWNER-100(a), (b), (d) tại ngưỡng hạn mức IP hoặc dự án có trạng thái **Chưa chạy** trên hosted. Phần SMTP chậm và so độ trễ phản hồi của TC-OWNER-100(c) cũng **Chưa chạy** trên hosted. Kết quả độ trễ trong bộ bằng chứng nghiệm thu thuộc phép đo local.

Hai reviewer AI độc lập trả `APPROVE` cho Git tree `95b50fb28f6ee720adab3b3c3e8f86df6c928bcc` trước khi thêm dòng này. Phạm vi rà gồm hợp đồng nghiệm thu, bằng chứng theo phiên bản, trạng thái các ca hosted và nội dung công bố. OpenSpec strict và kiểm bản vá đạt.

## Tiền kiểm nghiệm thu 12.9 ngày 26/11/2026

Mục 12.9 giữ trạng thái **chưa chạy trên staging**. Đã xác nhận source CI, deployment Protected Preview và biên nhận Edge cho `0aa9345`. Chrome 24tx vào được Preview. Linh yêu cầu ưu tiên profile Chrome 24tx thường cho cả A và B. Dự kiến dùng bản Protected Preview có nút đổi key cho A và giữ URL Protected Preview hiện tại cho B nếu đường đọc phiên và ghép lại của B khớp source được nghiệm thu. Kiểm hai origin khác nhau, cùng project Supabase staging và hai `session_id` khác nhau trước khi bắt đầu. Chỉ cần đăng nhập Vercel ở cửa sổ ẩn danh nếu phải dùng cách đó. #0033 đang active, thế hệ 0, đọc được thư cấp key gốc và phù hợp phần hai máy. Nhánh receipt TC-OWNER-52 cần quán thử riêng có cửa sổ nhận key còn mở. Cờ rotation vắng, hàng đợi rotation trống và cron worker nền trả HTTP 200. Còn quyết định bật backend dùng chung và đường deploy Protected Preview bật giao diện Đổi Store Key. [Biên bản và ma trận TC](t08-rotation-12-9-preflight-2026-11-26.md).

Kiểm cục bộ trên Git tree của `0aa9345` đạt 17/17 Vitest, 5/5 lượt Playwright mock và 8/8 mục contract loopback PostgreSQL với Auth/SMTP giả. Quan sát trên staging giới hạn ở tiền kiểm. Chưa thay cờ, chưa phát OTP và chưa đổi key.

Hai reviewer AI độc lập cùng **APPROVE** biên bản tiền kiểm SHA-256 `D4184A5106D4CD02C480C3AAEAC8C4F0E65880FB2E588100ED143219B8ED8382`. Reviewer nghiệm thu đối chiếu đặc tả, test và mốc B. Reviewer triển khai đối chiếu receipt, cổng Preview, phạm vi project và cách hậu kiểm trả cờ. Bản đầu `2D7A3B36E3AE18A9164DE12E3C6266647AF3B2F9126E3CCE7EAB485F4377CCA8` bị yêu cầu sửa vì chưa nêu điều kiện cửa sổ receipt, các assertion còn thiếu và giới hạn của chụp hàng đợi khi đổi cờ. Review vòng cuối xác nhận các bổ sung. Kết quả review áp dụng cho biên bản tiền kiểm.

## Chuẩn bị Protected Preview cho 12.9 ngày 27/11/2026

Linh duyệt phương án A. Phạm vi là bật backend staging dùng chung trong thời gian nghiệm thu, chỉ đổi key của quán thử, kiểm hàng đợi và trả cờ. Bản giao diện dùng Protected Preview. Phạm vi được duyệt giữ quy tắc không merge `main` và không phát hành Production. Đã hỏi riêng quyền mở PR cấu hình Preview và merge sau review/CI để chạy đúng cổng.

Chrome 24tx thường đã mở bản `0aa9345` ở màn Ghép thiết bị cho máy B, dùng phiên Vercel sẵn có. Bản Preview của A chưa được triển khai. Cổng hiện hành yêu cầu đúng HEAD `main`, CI push và duyệt môi trường GitHub `Preview`. Biểu mẫu Vercel chỉ cho chọn ref. Gọi trực tiếp từ nhánh thử sẽ bỏ qua cổng GitHub hiện hành.

Candidate cục bộ nằm tại `D:/Workspace/pos-cafe-t08-preview-20261127`, nhánh `feat/t08-protected-rotation-preview-20261127` từ `0aa9345`. Năm tệp thay đổi gồm workflow, script, test, runbook và ba giá trị hash trong chính sách triển khai. Thêm lựa chọn `supabase_rotation` và cờ Config `POS_PREVIEW_OWNER_RECOVERY=1` chỉ thuộc Preview. Cờ mặc định vắng. Từng lượt Preview tạo build mới, tránh nhận lại bundle cùng SHA từng build với cấu hình khác. Chính sách giữ cổng HEAD main, CI, môi trường cần duyệt, scope Vercel và đối chiếu định tuyến Production. Mã ứng dụng và Edge giữ nguyên theo Git diff.

Kiểm Node tooling đạt 175/175 sau khi dùng bản LF nguyên từ Git cho `scripts/project-ci.mjs` trong lượt chạy Windows. Hai ca CI fixture đầu dừng vì trình kiểm cắt literal theo LF. Bản nguồn CI được trả lại trạng thái checkout và không nằm trong diff. Đối chiếu 67 hash tệp tin cậy đạt. Chưa có CI GitHub cho candidate và chưa thay cờ Vercel hay Supabase. Kết quả 12.9 staging chưa chạy.

Hai reviewer AI độc lập cùng APPROVE bản vá cấu hình Preview có SHA-256 diff `267d1fea18e667ba6db048643a884dc261c2ce85cc0c741e5e55303eafda5e6d`. Reviewer triển khai kiểm quyền, nguồn, CI, hash và phục hồi. Reviewer hợp đồng kiểm Config, biên nhận và hồi quy. Bản đầu cần sửa vì Vercel có thể tái sử dụng deployment giữa hai cấu hình cùng SHA và runbook chưa đủ hướng dẫn khôi phục khi build lỗi hoặc chưa rõ kết quả. Bản cuối yêu cầu build mới ở cả ba chế độ, có test cho cùng SHA và sửa runbook. Review chưa xác nhận deploy hoặc nghiệm thu staging.

Linh duyệt mở PR và merge riêng cấu hình sau khi CI đạt. [PR #50](https://github.com/nguyentronglinh045/pos-cafe/pull/50) đã merge vào `main@ed0b2fb`, cùng Git tree `ad14ea6e1591010fd5740b1a76f6ce11756b5329` với head `cf99972` đã rà. CI push nhánh `45921065416` đạt ở lượt 2. CI PR `45921085799` đạt ở lượt 3. Ba lượt lỗi dừng ở UI Audit sau 338–339 giây với `COMMAND_FAILED`, `REPORT_MISSING`, `RESULT_INVALID`. Các lượt chạy lại giữ đúng source và bộ ca. CI push `main` `45925992814` bắt đầu trên SHA merge. Lượt tiền kiểm tiếp theo thấy #0033 active, thế hệ 0, 0 phiên Auth, 0 rotation mở, 0 challenge còn hạn, 0 mail rotation tồn, 4 RPC worker/rotation kiểm có quyền chỉ `service_role` theo vai trò ứng dụng và một nhịp cron worker HTTP 200. Hai cờ UI/Edge còn vắng tại lần đọc này.

Tại mốc chờ CI push main, tab cấu hình Vercel mới trong Chrome 24tx chuyển tới trang đăng nhập. Cần Linh đăng nhập Vercel trực tiếp rồi kiểm tiếp. Chưa lưu biến Vercel, bật cờ Supabase hoặc khởi chạy luồng đổi key. Máy B đã được mở ở màn ghép trên Preview `0aa9345`.

## Chạy Protected Preview và tiền kiểm hosted ngày 27/11/2026

CI push main `45925992814/1` đạt trên `ed0b2fb`. Linh đăng nhập Vercel trực tiếp trong Chrome 24tx. Codex cấu hình `POS_PREVIEW_OWNER_RECOVERY=1` đúng Preview, dispatch workflow `45927829980` và duyệt đúng môi trường GitHub `Preview` trong phạm vi Linh đã giao. Biên nhận deployment `dpl_5kWyqM31t17hpgUuqhFcVvNoEXSo` xác nhận `READY`, `ownerRecovery=true`, Auth/permission readiness đạt và các trường bảo vệ, định tuyến Production khớp trước sau. `applicationSmoke=NOT_RUN` trong biên nhận. Sau build Codex bỏ biến opt-in và đọc lại thấy biến vắng, còn đúng ba biến Preview nền. [CI](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45925992814) · [Protected Preview](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45927829980).

Dùng quán thử riêng #0036 tạo bằng UI T06 để giữ nhánh receipt của TC-OWNER-52. Quán có alias thử đọc được trong Gmail 24tx. Hai URL riêng cùng Chrome 24tx, A ở `ed0b2fb`, B ở `0aa9345`. Chênh nguồn giữa hai SHA chỉ là cấu hình Preview, không gồm mã POS/Auth/Edge. Cả A và B vào POS #0036 với PIN. SQL đối chiếu đúng quán hoạt động, thế hệ 0, một owner alias khớp, hai hàng phiên Auth khác nhau, receipt tạo quán còn mở, 0 rotation đang mở, 0 challenge rotation còn hạn và 0 thư rotation tồn trước khi gửi. Truy vấn đầu dùng nhầm cột tên trên `stores`, đã sửa sang đối chiếu bằng số quán, alias, session và màn hình thực tế.

Máy A hiện cảnh báo đúng mô tả 3B/42. Nhập tên sai khóa nút Gửi mã, nhập đúng mở nút. Dashboard Auth vẫn TTL 3.600 giây. Codex bật opt-in Edge `POS_CAFE_STORE_ROTATION_ACCESS_TOKEN_TTL_SECONDS=3600` theo A, giữ cờ Quên Store Key, gửi một OTP đổi key. Gmail 24tx nhận đúng thư OTP mục đích đổi key. Ngay trước bàn giao, còn một challenge rotation và 0 lượt rotation mở, 0 thư rotation ở queued/sending/unknown, receipt ban đầu còn mở khoảng 339 giây, A/B vẫn có hai phiên và key ở thế hệ 0. Linh cần trực tiếp nhập OTP và bấm Tạo key mới. Lượt đổi key và hậu kiểm hàng đợi chưa hoàn thành. Tại checkpoint cờ Edge đang bật tạm.

### Form OTP mất sau khi chuyển tab

Linh xác nhận đã nhận OTP và báo không thấy ô nhập mã. Codex quay lại đúng origin của máy A. Lúc đầu màn hiện “Chưa xác minh được quyền. Kiểm tra kết nối và thử lại.” Khi quyền xác minh lại xong, Cài đặt mở mục Đổi Store Key với trường tên trống và không có ô mã. SQL cùng thời điểm thấy hai phiên Auth còn tồn tại, thế hệ key 0, không có rotation và một challenge còn hiệu lực. Cửa sổ nhận lại key tạo quán đã sát hạn còn khoảng 3 giây. Không dùng mã đã nhập vào chat và chưa có xác nhận đổi key từ UI.

Mã nguồn đối chiếu cho thấy `visibilitychange` hoặc focus gọi `hide`/`resume`, đặt status `unverified`. Trong lúc này điều kiện `canRotate` của Cài đặt đổi thành false và React tháo `StoreKeyRotationPanel`. Receipt chỉ ở state của panel. Khi quyền được xác minh lại, panel mới thiếu receipt nên ô mã biến mất. Cùng email có thể nhận challenge rotation mới sớm nhất 10 phút sau lần phát trước, còn tùy hạn mức. Đã hỏi Linh quyền sửa ứng dụng và bổ sung hồi quy cho bước đọc OTP khi đổi tab. Chuẩn bị chờ challenge thử hết hạn, đối chiếu hàng đợi và trả cờ Edge. [Điều kiện Drawer](https://github.com/nguyentronglinh045/pos-cafe/blob/ed0b2fb/src/app/drawers/admin/GeneralSettingsDrawer.tsx#L113-L116) · [Mount panel](https://github.com/nguyentronglinh045/pos-cafe/blob/ed0b2fb/src/app/drawers/admin/GeneralSettingsDrawer.tsx#L216-L217) · [Listener tab](https://github.com/nguyentronglinh045/pos-cafe/blob/ed0b2fb/src/app/PermissionLifecycle.tsx#L60-L66) · [Trạng thái xác minh](https://github.com/nguyentronglinh045/pos-cafe/blob/ed0b2fb/src/core/permissionLifecycle.ts#L57-L72) · [State receipt](https://github.com/nguyentronglinh045/pos-cafe/blob/ed0b2fb/src/app/drawers/admin/StoreKeyRotationPanel.tsx#L30-L35) · [Hạn mức gửi lại](https://github.com/nguyentronglinh045/pos-cafe/blob/ed0b2fb/supabase/candidate/owner-store-key-rotation-otp.sql#L156-L180).

Sau khi OTP hết hạn, SELECT xác nhận 0 challenge còn dùng được, 0 rotation đang mở, 0 thư rotation đang chờ/gửi/chưa rõ kết quả. Codex bỏ đúng cờ Edge đã bật tạm và đọc lại thấy cờ rotation vắng, cờ Quên Store Key còn có mặt. Sau mốc bỏ cờ, một nhịp cron worker mới trả HTTP 200 và số đếm ở trên vẫn bằng 0. Quán thử #0036 giữ thế hệ 0. Biến Config Vercel đã vắng từ sau khi build. Chưa bấm Tạo key mới, chưa kiểm ghép lại hoặc sự hội tụ của phiên Auth. TC-OWNER-53 đã quan sát nút bị vô hiệu hóa khi tên sai. TC-OWNER-52 còn lỗi form OTP khi chuyển tab. Các ca khác giữ mốc của biên bản tiền kiểm và chưa có PASS hosted từ lượt này.

Hai reviewer AI độc lập APPROVE biên bản checkpoint SHA-256 `E4CDF8BF7FDC95CB774D65458FAA8E784EEBB80C3B88E53E4C910314DFF207BA` trước khi thêm dòng review. Reviewer nghiệp vụ đối chiếu trạng thái UI, nguồn, cooldown và phạm vi ca. Reviewer triển khai đối chiếu CI, biên nhận và phạm vi hoàn nguyên. Kết quả này ghi nhận mốc đang mở của 12.9.

### Sửa lỗi mất ô OTP khi quay lại tab

Linh giao sửa lỗi, giữ bước xác minh quyền và chạy lại 12.9 trên Protected Preview. Linh đồng ý merge riêng PR sửa lỗi sau khi CI và hai review đạt. [PR #51](https://github.com/nguyentronglinh045/pos-cafe/pull/51) đề xuất head `915a17c40b58758d682945b049f46c92286f47ce`, Git tree `cc6cb139cadbdf63e194b037cc22dde58dfb9bd2`.

Cài đặt lưu receipt đang chờ OTP và khóa gửi trong bộ nhớ theo quán và thế hệ phiên chủ. Lớp xác minh vẫn ẩn form. Cùng phiên chủ, khi quyền được xác minh lại, ô OTP mở trống với thời hạn gửi lại cũ. Khi phiên, quán, quyền hoặc tên quán đổi, receipt cũ không được khôi phục. Mã đã nhập, lần xác nhận và key trả về vẫn theo vòng đời của panel. Trạng thái gián đoạn sau khi đã bấm xác nhận cần đối chiếu theo ca riêng của 12.9.

- Ca Playwright chuyển tab thất bại trên `ed0b2fb` tại assertion ô OTP hiện lại. Trên bản vá, 5/5 viewport đạt từ lúc ẩn form và xác minh lại quyền đến nhập OTP, đổi key mock, ghép lại A và nhập PIN. Sau khi quay lại, ca kiểm ô trống và nút gửi bị khóa theo thời hạn cũ.
- Vitest 30/30 đạt ở nhóm panel rotation, permission UI và permission lifecycle. Ca mới giữ một yêu cầu đang gửi qua lần xác minh, bao gồm phản hồi đến trước và sau khi quyền được xác minh lại. Đổi thế hệ phiên chủ xóa receipt. TypeScript và `git diff --check` đạt. UI Audit selftest đạt 23 phát hiện chuẩn. Bản `915a17c` có 0 phát hiện trong state `store-key-rotation-otp` trên desktop, tablet và mobile.
- Hai reviewer AI phát hiện nguy cơ yêu cầu thứ hai ghi đè receipt trước khi yêu cầu đầu hoàn tất. Codex bổ sung khóa gửi và phép thử phản hồi chậm, đồng thời loại receipt khi tên quán đổi. Hai reviewer duyệt diff SHA-256 `ba9eb5a11c7caefc87d139b15e9bbfd30f3bbd51e99098874b01883902cb9bda`, gồm phạm vi quyền và cảnh báo về giới hạn khôi phục sau xác nhận. Checkpoint này chưa có nghiệm thu hosted trên bản vá.

CI PR `45931552329/1` đạt ở cùng head. CI push nhánh `45931531495/1` đạt build, unit, PostgreSQL và smoke. UI Audit dừng sau khoảng 339 giây với `COMMAND_FAILED`, `REPORT_MISSING` và `RESULT_INVALID`. Cổng merge còn đóng. Codex kích hoạt chạy lại job trên đúng source và cùng bộ ca. Baseline staging cho thấy cờ rotation vắng, cờ Quên Store Key còn, không có challenge còn hiệu lực, rotation mở hay thư rotation tồn và một nhịp worker gần nhất HTTP 200. Đã gỡ ghép cục bộ máy B khỏi fixture #0036 để dành origin này cho fixture mới. Thế hệ key của #0036 vẫn là 0 tại mốc đọc.

CI push nhánh `45931531495/2` đạt. PR #51 merge vào `main@f2e60c10136b9a3b6c80407720f89506119fee73`, cùng tree `cc6cb139cadbdf63e194b037cc22dde58dfb9bd2` đã rà. CI push main `45934852379/1` bắt đầu trên đúng SHA. Cổng Preview chờ biên nhận CI này. [CI PR](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45931552329) · [CI nhánh](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45931531495) · [CI main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45934852379).

<a id="staging-doi-store-key-129-20261127"></a>

### Chạy lại 12.9 trên Protected Preview ngày 27/11/2026

CI push main `45934852379/1` đạt. Workflow `45936334605/1` xác nhận deployment `dpl_Vtozq5cCqg5b4tjChrxbEXwM6h58` ở trạng thái `READY` cho `f2e60c1`, `ownerRecovery=true`, Auth và permission readiness đạt. Sáu trường bảo vệ Vercel và định tuyến Production khớp trước sau. Receipt deploy ghi `applicationSmoke=NOT_RUN`. Phần dưới ghi lượt thao tác trực tiếp sau deploy. Biến Config `POS_PREVIEW_OWNER_RECOVERY` được gỡ sau build và đọc lại thấy vắng, còn đúng ba biến Preview nền. [CI main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45934852379) · [Protected Preview](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45936334605).

Dùng quán thử riêng #0037 tạo qua T06 và Gmail 24tx. A dùng deployment mới, B dùng Protected Preview `0aa9345`. Hai origin tách phiên Auth và trỏ cùng backend staging. Mã POS/Auth liên quan trực tiếp đến ghép thiết bị của B khớp A. Hai máy đều vào POS #0037 trước xác nhận. SQL trước khi bật cờ thấy quán active, thế hệ 0, hai hàng Auth session, receipt tạo quán còn hạn 205 giây, 0 rotation mở, 0 challenge còn dùng được, 0 thư rotation đang chờ/gửi/chưa rõ và cron worker HTTP 200. TTL Auth Dashboard là 3.600 giây. Cờ Edge rotation được bật tạm với đúng giá trị này.

- **Trước xác nhận.** A hiện cảnh báo về key cũ và phiên đang dùng. Tên sai khóa Gửi mã. Tên đúng cho gửi một OTP. Sau khi chuyển sang Gmail và trở lại A, ô OTP vẫn mở trống và nhập được, tên quán được giữ, nút gửi lại vẫn bị khóa theo thời hạn cũ. Gmail nhận đúng một OTP theo mục đích. Ngay trước bàn giao, SQL thấy một challenge còn hạn, 0 lượt đổi mở và 0 thư rotation đang chờ/gửi/chưa rõ. Receipt tạo quán còn khoảng 92 giây tại lần đọc này.
- **Xác nhận và thư.** Linh trực tiếp nhập mã, bấm Tạo key mới và báo đã thấy key trên A. Khi Codex nhận lại quyền, A đã về màn Đổi Store Key với tên trống. Màn key và nút Dùng key mới trên máy này đã biến mất. Không đo được chính xác chuyển trạng thái nào trong lúc bàn giao làm mất màn kết quả. Mã nguồn vẫn giữ kết quả key trong panel, vốn bị tháo khi quyền cần xác minh lại. Quán lên thế hệ 1, `applied` lúc 10:59:57 giờ Việt Nam, sau đó `completed`. SQL thấy đúng một audit `store_key_regenerated` với cấu trúc audit được đối chiếu mã nguồn, và đúng một thư rotation `submitted`. Gmail 24tx xếp thư vào Thư rác. Thư ghi thế hệ 1, thời điểm đổi và cảnh báo trong cửa sổ hội tụ. Hiệu `session_warning_until - applied_at` là 3.600 giây. SQL đọc receipt đã đóng và phép so sánh không xác nhận đóng trước hạn. Nhánh đóng trước hạn và yêu cầu nhận lại trả trạng thái chưa được chứng minh trong lượt này. [Mã dựng thư](https://github.com/nguyentronglinh045/pos-cafe/blob/f2e60c1/supabase/functions/owner-provisioning/handler.ts#L258-L280) · [Ghi audit và mốc TTL](https://github.com/nguyentronglinh045/pos-cafe/blob/f2e60c1/supabase/candidate/owner-store-key-rotation.sql#L340-L358).
- **A/B và key cũ.** Sau `completed` và trước khi ghép lại, SQL còn 0 hàng Auth session của #0037. Máy B vẫn mở được POS sau Làm mới trong thời gian access token cũ có thể còn hiệu lực. Để giảm thời gian chờ, Codex dùng Khoá → Gỡ ghép thiết bị này → Ghép thiết bị trên A và B. Một lượt ghép mới bằng key cũ trên A bị từ chối và vẫn ở màn Ghép thiết bị. Key từ thư rotation ghép thành công ở cả hai máy, vào màn PIN và chỉ vào POS sau nhập PIN. Hậu kiểm thấy hai hàng Auth session được tạo sau `applied`, cả hai có hàng refresh token chưa revoked, và 0 hàng phiên tạo trước hoặc tại `applied`. Lượt này chưa gọi refresh riêng cho token cũ hoặc token mới, chưa quan sát B tự quay về luồng ghép và chưa bấm được nút Dùng key mới trên máy này của bản hosted.
- **Hoàn nguyên.** Khi lượt đổi đã `completed` và SQL thấy 0 rotation `pending`/`applied`, 0 challenge còn hạn, 0 thư rotation `queued`/`sending`/`unknown`, Codex gỡ đúng cờ Edge rotation lúc 11:00:52. Đọc lại tên secret xác nhận cờ rotation vắng và cờ Quên Store Key còn. Sau mốc gỡ, cron worker mới trả HTTP 200, ba tổng số trên vẫn bằng 0. Cả A và B cuối lượt vào POS #0037, quán active thế hệ 1. Không có thao tác đổi key đối với demo chung hoặc quán khác.

| Ca | Kết quả hosted và phần còn thiếu |
| --- | --- |
| TC-OWNER-52 | Đạt quan sát cảnh báo, giữ ô OTP, Linh xác nhận và thấy key, key cũ bị từ chối, một thư và một audit, 0 phiên Auth cũ rồi hai phiên mới sau ghép thủ công và PIN. Còn nút ghép một chạm, sao chép, B tự về luồng ghép, refresh thực tế và replay receipt còn hạn. |
| TC-OWNER-53 | Staging quan sát nút gửi khóa với tên sai. Contract cô lập kiểm mã lỗi `STORE_NAME_MISMATCH`. |
| TC-OWNER-54 | Dùng bằng chứng contract cô lập cho lần sai thứ năm. Không tạo chuỗi sai OTP rotation trên staging. |
| TC-OWNER-55 | Staging đã dùng thư đúng key sau khi màn kết quả biến mất lúc bàn giao. Ca replay đúng attempt và mất phản hồi có bằng chứng cô lập. Chưa tiêm lỗi hoặc kiểm replay HTTP trên staging. |
| TC-OWNER-87 | Staging quan sát luồng bình thường từ đổi key tới `completed` và hàng đợi đã xử lý. Các điểm dừng, tranh việc và lỗi Auth dùng bằng chứng cô lập theo ma trận tiền kiểm. |
| TC-OWNER-113/114 | Staging quan sát một generation, một audit, một thư và TTL 3.600 giây. Ma trận hai worker/hai generation, gửi chậm và đổi quyền chủ còn thiếu bằng chứng tích hợp. |
| TC-OWNER-115 | Staging quan sát hai phiên cũ không còn trong Auth, hai phiên mới sau mốc `applied`, và B vẫn ở POS sau Làm mới trong khoảng access token cũ có thể còn hiệu lực. Chưa đọc claim `iat`/`exp`, chưa kiểm RPC bằng JWT cũ, chưa chạy race grant/refresh hoặc gọi refresh trực tiếp ở lượt này. |

**Kết luận.** Hồi quy mất ô OTP khi đổi tab đã đạt trên Protected Preview. Đổi key và ghép thủ công A/B đã quan sát thành công. 12.9 giữ mở vì các tiêu chí còn thiếu trong bảng và vì màn kết quả có thể biến mất sau xác nhận trước khi dùng nút ghép một chạm. Lần tạo #0037 đọc nhầm mã từ đoạn thu gọn trong thread Gmail trước khi dùng mã ở thư mới nhất. Một lần quan sát công cụ để lộ đoạn cuối của key thử do Gmail tách dòng. Biên bản và AI log che toàn bộ key, OTP, PIN, hộp thư và thông tin định danh phiên.

Hai reviewer AI độc lập **APPROVE** biên bản SHA-256 `DD32D9145261C7221D17089023B66CF7F0AF550940B2CDEAE4FAAC9CBAC2AF0B` trước dòng này. Reviewer nghiệm thu đối chiếu ma trận và giới hạn quan sát. Reviewer triển khai đối chiếu độc lập CI, receipt Preview, phạm vi mã, căn cứ hoàn nguyên và phân biệt hàng refresh với phép gọi refresh. Review đối chiếu hồ sơ và nguồn, không lặp tác vụ staging. OpenSpec strict và `git diff --check` đạt.

### Giữ màn kết quả khi quay lại tab và ghép lại sau mất phiên Auth

Linh giao sửa phần màn key biến mất sau xác nhận, giữ xác minh quyền, kiểm ghép một chạm ở A và B tự về màn ghép trên Protected Preview. Linh đồng ý merge riêng bản vá sau CI và hai review. Linh giao tắt Chrome và máy Windows sau khi hoàn tất xác minh, push và deploy. Bước xác nhận đổi key trên UI cần Linh thao tác trực tiếp khi Preview sẵn sàng.

Kết quả từ phản hồi xác nhận được giữ trong bộ nhớ của drawer theo quán, thế hệ phiên chủ và mục Đổi Store Key. Màn key và các nút vẫn qua quyền `settings.manage` đã xác minh. Thay phiên, mất phạm vi quán/chủ hoặc rời mục làm mất kết quả. Phản hồi mơ hồ hiện trạng thái hướng dẫn kiểm tra email sau khi xác minh lại. OTP và quyền thử lại bằng proof cũ ở trong panel hiện tại. Máy B có đường về thẳng màn Ghép thiết bị khi Supabase SDK phát `SIGNED_OUT`. Luồng gỡ ghép có chủ ý giữ phản hồi cũ, kể cả khi SDK đã xóa phiên trong lúc refresh rồi trả lỗi.

Playwright desktop tái hiện mất màn key trên `f2e60c1`. Candidate `bfe4c69644db1e900a87a2fce4251a59ad1e8624` đạt 5/5 smoke qua bước xác minh quyền và ghép một chạm trên mock. Vitest 47/47 bao gồm phản hồi thành công/mơ hồ trước và trong lần chuyển tab, bỏ kết quả sau khi rời mục hoặc thay phiên, sự kiện mất phiên B và truy vấn cũ trả muộn. TypeScript và `git diff --check` đạt. UI Audit state kết quả có 0 phát hiện trên ba viewport. Hai reviewer AI duyệt diff `18d51362f7ebd0103cca5fbac8b939fb725dda26f6d054c8553212d0e9894ba9` trong hai phạm vi vòng đời màn key và luồng mất phiên Auth. [PR #52](https://github.com/nguyentronglinh045/pos-cafe/pull/52).

Cổng Preview chờ các lượt CI push nhánh và PR, rồi CI push main trên SHA merge. Tại checkpoint này chưa tạo Protected Preview mới, chưa bật cờ Edge, chưa chạy hosted trên candidate và chưa tắt máy. Thời điểm B tự nhận mất phiên trên staging phụ thuộc SDK chạm thời điểm refresh. Giữ TTL dùng chung 3.600 giây theo quyết định 42.

CI đầu của PR và push nhánh phát hiện `compatibilityGate.test.tsx` và `restrictedAppGate.test.tsx` lỗi do App gắn trình nghe mới trước khi biết runtime có hỗ trợ sự kiện và test đã mock query. Delta `79408f8e8cfd7563caf805a46376762bded8d59e` chỉ gắn `StoreSessionLoss` khi cổng Auth có sự kiện, bên dưới cổng tương thích. Hai test đó và ba tệp test liên quan đạt 41/41 sau sửa. TypeScript và diff check đạt. Reviewer triển khai duyệt delta. Hai CI mới `45942660016` (nhánh) và `45942664404` (PR) dùng đúng head mới. [CI nhánh](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45942660016) · [CI PR](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45942664404).

Chạy toàn bộ Vitest cục bộ trên `79408f8` đạt 1.280/1.280 ca trong 120 tệp.

CI PR `45942664404/1` đạt trên `79408f8`. CI push nhánh `45942660016/1` đạt build, unit, PostgreSQL và smoke, rồi dừng ở UI Audit sau khoảng 338 giây với `COMMAND_FAILED`, `REPORT_MISSING` và `RESULT_INVALID`. Codex kích hoạt chạy lại trên cùng commit và giữ bộ kiểm. Cờ Preview và Edge chưa thay đổi trong lượt này.

CI push nhánh `45942660016/2` đạt. PR #52 merge thành `main@cd3e3e3d5058d7b77a353fc2b0ab456b4971c76c`, cùng tree `8f45b503489877b71fa7bcc16a66b6f1a3fc6f93` với head đã duyệt. CI push main `45945781701/1` bắt đầu. [CI main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45945781701).

CI push main lượt 1 đạt smoke, rồi UI Audit dừng sau khoảng 339 giây, cùng nhóm lỗi báo cáo thiếu như lượt nhánh. Chạy lại trên cùng SHA. Tiền kiểm Chrome 24tx đã vào Vercel và Supabase, đủ ba biến Preview nền, cờ hai nơi vắng, cờ Quên Store Key có mặt. SQL đọc 0 rotation mở, 0 challenge còn dùng được, 0 thư rotation tồn và một cron worker HTTP 200. Chưa thay staging hoặc tắt Chrome và máy.

CI push main `45945781701/2` đạt. Hai lượt Protected Preview dùng cùng SHA `cd3e3e3`, cùng CI và khác origin. B `45949049117/1`, deployment `dpl_3PWjcsCrSCTJh4BknFFB7PdnFaSo`, `ownerRecovery=false`. A `45949306981/1`, deployment `dpl_ASd5asQuZFGHtU6VUUi3TES7SAYt`, `ownerRecovery=true`. Cả hai `READY`, Auth/permission readiness đạt, cấu hình bảo vệ và định tuyến Production giữ nguyên. `applicationSmoke=NOT_RUN` trong biên nhận. Chrome 24tx mở được màn ghép ở cả hai origin. Đã gỡ biến Config Vercel sau build A, đọc lại thấy đủ ba biến Preview nền và cờ opt-in vắng. Edge rotation vẫn tắt. [Preview B](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45949049117) · [Preview A](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45949306981).

Quán thử riêng #0038 được tạo qua UI T06 và thư thử trong Chrome 24tx. Đã ghép A và B trên hai origin và nhập PIN vào POS thành công. A mở được Cài đặt → Đổi Store Key. SQL kiểm #0038 active, thế hệ 0, hai phiên Auth, receipt tạo quán còn khoảng 405 giây tại mốc đọc, 0 rotation mở, challenge rotation còn dùng và thư rotation tồn. Worker nền có một HTTP 200. Phiên cũ nhất của fixture được tạo lúc 13:06:39 giờ Việt Nam, B đã ghép trước A. Đây là mốc tạo phiên sử dụng để dự trù lần SDK thử gia hạn. Nếu B đã gia hạn khi chưa đổi key thì phải đối chiếu mốc mới. Chờ Linh sẵn sàng thao tác xác nhận trên A. Cờ Edge rotation vắng. Chưa phát OTP đổi key, đổi key, kiểm ghép một chạm hoặc B tự về màn ghép trên bản này. Chưa tắt Chrome và máy.

Hai reviewer AI độc lập **APPROVE** mốc chờ Linh, SHA-256 `FFDDC8AE840FA3715F224930BCAE05F17C43A44972341F85D005CA022135D17D` trước dòng này. Reviewer deploy đối chiếu độc lập CI và hai biên nhận. Reviewer nghiệm thu đối chiếu fixture, phạm vi và bước còn thiếu. Ba tổng số tiền kiểm lần lượt là 0 rotation mở, 0 challenge rotation còn dùng, 0 thư rotation `queued`/`sending`/`unknown`. Khi tiếp tục cần đọc lại hạn receipt tại thời điểm đổi.

<a id="staging-doi-store-key-0038-20261127"></a>

### Xác nhận đổi key và ghép một chạm quán #0038

Linh xác nhận sẵn sàng, yêu cầu gửi OTP cho #0038, kiểm A/B và trả cờ staging. Linh rút yêu cầu tắt Chrome và máy. Trước lượt đổi, hai origin cùng source `cd3e3e3` vẫn vào POS #0038. SQL đọc quán active, thế hệ 0, hai phiên Auth, phiên B tạo lúc 13:06:39 và chưa ghi refresh, receipt tạo quán đã hết hạn, 0 rotation mở, 0 challenge rotation còn hạn, 0 thư rotation ở trạng thái `queued`/`sending`/`unknown`, cron HTTP 200. TTL Auth hiện hành là 3.600 giây. Bật tạm Edge rotation lúc 13:43:02, gửi OTP từ A lúc 13:43:15 và xác nhận đã có đúng thư vào địa chỉ thử qua Chrome 24tx.

Linh trực tiếp xác nhận đổi key, chuyển sang Gmail và trở lại A. Linh báo vẫn thấy màn key mới. Codex nhận lại điều khiển, quan sát quyền được xác minh lại rồi thấy cùng màn key với nút Dùng key mới trên máy này. Codex bấm nút lúc 13:46:03. A vào màn PIN của #0038, nút Mở khoá đang vô hiệu hoá cho tới khi nhập PIN và màn key đã rời DOM. SQL ghi một phiên Auth được tạo sau `applied` và có hàng refresh chưa bị thu hồi. Không suy ra đã gọi refresh chỉ từ hàng này.

SQL ghi `applied` lúc 13:45:19, `completed`, quán active thế hệ 1, một audit, một thư rotation `submitted`, một phiên mới và 0 phiên Auth cũ. Thời hạn cảnh báo bằng 3.600 giây kể từ `applied`. Sau khi chắc chắn cả ba số đếm rotation mở, challenge còn hạn và thư rotation ở trạng thái `queued`/`sending`/`unknown` đều bằng 0, Codex gỡ cờ Edge lúc 13:46:52. Đọc lại Edge rotation vắng, cờ Quên Store Key còn. Một nhịp cron mới sau hoàn nguyên trả HTTP 200 và cả ba số vẫn bằng 0. Biến Vercel đã gỡ sau build như mốc trước. B còn ở POS khi đưa tab lên trước để theo dõi lần SDK tự thử gia hạn. Ở mốc này chưa có kết quả B tự về màn ghép. Thời điểm đều là giờ Việt Nam.

Lúc 14:04:21, B vẫn ở POS. Đến 14:04:45, B tự hiện màn Ghép thiết bị, POS biến mất và có thông báo “Phiên ghép thiết bị đã mất hiệu lực. Hãy dùng Store Key hiện hành để ghép lại.” Trong khoảng theo dõi giữ nguyên hồ sơ trình duyệt và đồng hồ, không tải lại, gỡ ghép thủ công hay gọi refresh trực tiếp. Thông báo là nhánh xử lý `onStoreSessionLost` của build B. Thời điểm phù hợp cửa sổ SDK tự thử gia hạn. Log giao diện không cho mã lỗi HTTP của lượt refresh. Sau quan sát này, Codex dùng key mới đã đọc từ màn kết quả A trước khi bấm ghép một chạm để ghép B. B vào màn PIN của #0038. Hậu kiểm SQL đọc đúng hai phiên Auth tạo sau `applied`, cả hai có hàng refresh chưa bị thu hồi, 0 phiên cũ. Không suy từ số đếm này sang phép gọi refresh thành công.

**Kết quả phạm vi Linh yêu cầu.** Đã kiểm trên staging việc giữ màn kết quả qua đổi tab, ghép một chạm trên A và B tự về màn ghép rồi ghép lại bằng key mới. Cả hai tab vẫn mở ở màn PIN của #0038. Phiên công cụ đã khởi tạo lại giữa hai lượt làm việc và không giữ PIN fixture, nên chưa nhập lại PIN sau khi ghép. Chrome và máy vẫn bật theo điều chỉnh của Linh. Cờ Edge rotation và biến Config Vercel đều vắng, cờ Quên Store Key còn, worker HTTP 200 và hàng đợi trống.

**Phạm vi còn mở của 12.9.** Lượt này không lặp phép thử key cũ, sao chép, kiểm refresh trực tiếp từng token, nhận thư giao key trong Gmail hay replay receipt còn hạn. Outbox xác nhận một thư rotation `submitted`. Biên bản #0037 vẫn là bằng chứng riêng cho key cũ bị từ chối và thư thật vào Thư rác. Các ca gián đoạn cưỡng bức, tranh worker và Auth race giữ phạm vi ở biên bản trước. Một lần đọc giao diện Chrome cấp cửa sổ hiện địa chỉ hộp thử và OTP đã dùng trong đầu ra công cụ. Bằng chứng trong biên bản và AI log đã che các giá trị đó.

Hai reviewer AI độc lập **APPROVE** hồ sơ. Reviewer nghiệm thu duyệt biên bản SHA-256 `68A76178EDF7D3C72136A997E3E1C911AD51C01DD2F7D0A283487D7DC4E39308` trước dòng này và đối chiếu các cập nhật kế hoạch, testplan. Reviewer triển khai đối chiếu CI, hai receipt, worker và bằng chứng Auth. Lần sửa câu chữ sau review làm rõ phạm vi đếm thư và trình tự dùng key. Hai review đọc hồ sơ và nguồn, không lặp thao tác staging. OpenSpec strict và diff check đạt.

<a id="staging-doi-store-key-0039-20261127"></a>

### Kiểm lại PIN, refresh và biên nhận tạo quán #0039

Ngày 27/11/2026, Linh giao kiểm ba tiêu chí còn thiếu và trực tiếp bấm “Tạo key mới” sau khi nhận OTP. Dùng lại Protected Preview A và B cùng source `main@cd3e3e3`, CI `45945781701/2`, biên nhận Preview A `45949306981/1` và B `45949049117/1`. Hai origin được bảo vệ riêng trên Chrome 24tx, kết nối cùng Supabase staging. Quán #0039 được tạo qua UI T06 bằng địa chỉ nhận thử riêng. Hai máy đã ghép bằng key ban đầu và nhập PIN trước rotation. Cấu hình ban đầu có 0 rotation còn mở, 0 challenge rotation còn hạn và 0 thư rotation ở trạng thái `queued`, `sending` hay `unknown`. Bật tạm Edge TTL 3.600 giây đã đối chiếu với Auth staging, dùng hộp thư thử, gõ đúng tên quán và gửi mã tại máy A lúc 14:27:18.

| Tiêu chí | Quan sát staging #0039 |
| --- | --- |
| Nhận lại key với biên nhận còn hạn | Gọi đúng thao tác Edge `verifyAndAcceptCreate` của nút “Nhận lại Store Key”, giữ nguyên proof đã chấp nhận và để biên nhận mở. Lúc 14:25:55, Edge HTTP 200 trả trạng thái `created` và đúng key ban đầu. Sau khi Linh đổi key, phát lại proof lúc 14:33:12 và 14:33:34, cả hai lần HTTP 200 chỉ trả `{"status":"created"}`. Hạn biên nhận là 14:34:25. SQL lúc còn 55 giây xác nhận rotation `completed`, thế hệ 1 và biên nhận đã đóng trước hạn. |
| Hai phiên Auth cũ và password grant | Hai phiên probe riêng của #0039 có `session_id` khác nhau và TTL 3.600 giây. Đổi key xong, password grant bằng key cũ trả HTTP 400 `invalid_credentials`. Gọi refresh từng token cũ trả HTTP 400 `refresh_token_not_found`, không có bộ token mới. |
| Hai phiên Auth mới và refresh | Hai password grant bằng key mới đều HTTP 200. Hai lần refresh đều HTTP 200, giữ `session_id` trong từng phiên, hai ID mới khác nhau và khác hai ID cũ. Mỗi lượt refresh cấp token mới, tăng `iat` và `exp`, giữ TTL 3.600 giây. Logout cục bộ hai phiên probe trả HTTP 204. |
| Ghép và nhập lại PIN | A bấm “Dùng key mới trên máy này”, vào màn PIN và mở POS với vai trò Chủ quán bằng PIN fixture. B gỡ ghép qua giao diện, nhập key mới rồi nhập PIN và mở POS. Mốc B **tự** về màn ghép thuộc lượt #0038 trên cùng build. Hậu kiểm #0039 ghi 0 phiên trước `applied` và 2 phiên có refresh token chưa thu hồi, sau khi đã dọn hai phiên probe. |
| Giao key qua email | Outbox có đúng một thư giao key rotation `submitted`. Gmail ở địa chỉ thử hiện một lần key mới trong thân thư, khớp với key từ A, kèm cảnh báo về phiên/ghép lại. |
| Trạng thái cấu hình cuối | Đã gỡ cờ Edge TTL lúc 14:34:21 sau khi rotation `completed` và cả ba tổng số hàng đợi về 0. Readback cờ rotation vắng và cờ Quên Store Key còn. Hậu kiểm ghi 0/0/0, hai lần cron `pos-cafe-owner-work` thành công và hai phản hồi HTTP 200 sau khi gỡ cờ. Hai Protected Preview được dùng lại. Hai tab POS A và B, Chrome và máy vẫn mở. |

**Phạm vi kết luận.** Ba tiêu chí Linh giao bổ sung đều có bằng chứng staging. Các phép gọi Auth trực tiếp dùng hai phiên probe do lượt kiểm tạo. Hồ sơ chưa có claim và refresh trực tiếp của chính phiên trình duyệt A/B. RPC đọc phiên bằng access JWT cũ trong probe bị HTTP 426 do thiếu header phiên bản `x-pos-permission-contract`. RPC với JWT mới cũng thiếu header, nên probe này bỏ kết luận về khả năng dùng access JWT cũ trước `exp`. Bằng chứng B tự về màn ghép, nhánh nhập lại PIN và phép đo trực tiếp có thể đối chiếu giữa hai lượt cùng build. Giữ 12.9 mở cho phần TC-OWNER-52 còn thiếu và phần ma trận lỗi, đồng thời, operator ở TC-OWNER-55/87/113–115 chưa có chứng cứ đầy đủ. TC-OWNER-53/54 thuộc các kiểm hồi quy đã ghi nhận. Lượt này dùng thao tác hợp lệ trên quán thử và không tạo gián đoạn staging.

Công cụ probe chỉ giữ proof và token trong bộ nhớ, xuất HTTP, lớp lỗi, TTL và phép so khớp. Đã xóa trạng thái công cụ khi xong. Một lần lọc danh sách Gmail ban đầu để lọt key thử #0038 trong đầu ra công cụ. Bằng chứng lưu lại đã che giá trị đó, OTP, PIN, email, token và ID phiên.

Hai reviewer AI độc lập **APPROVE** hồ sơ SHA-256 `50D8D263906699B7AAEA0B371E0BFD8A1685C9BB1C2CAF31E2EC6360EE4E55FD` trước dòng này. Reviewer nghiệm thu đối chiếu proof, thời hạn, hành vi A/B và trạng thái checklist. Reviewer triển khai đối chiếu CI và Preview, Auth, hàng đợi, worker và cấu hình cuối. Hai reviewer đọc hồ sơ và nguồn. OpenSpec strict và kiểm tra diff đạt.

<a id="kiem-hoi-quy-co-lap-129-20261127"></a>

### Kiểm hồi quy cô lập phần còn lại của 12.9

Ngày 27/11/2026, Linh giao push tài liệu liên quan trước rồi tiếp tục kiểm. Hồ sơ 12.8–12.10 và các lượt staging #0037–39 đã lên nhánh tài liệu `docs-t08-rotation-acceptance-20261127`, commit `756285b`, base `docs@027fd45`. Hai reviewer đã duyệt tree `8669a36b`. Lượt hồi quy dưới đây dùng checkout sạch `79408f8`, cùng Git tree `8f45b503489877b71fa7bcc16a66b6f1a3fc6f93` với `main@cd3e3e3`. Không có diff SQL và contract rotation giữa `0aa9345` và `cd3e3e3`.

| Lệnh tại worktree code | Môi trường | Kết quả và phạm vi |
| --- | --- | --- |
| `node --test tests/contracts/ownerStoreKeyRotation.local.test.mjs` | Node v24.16.0, PostgreSQL 16.15 loopback, bản sao database kiểm thử cục bộ, đã áp `owner-store-key-forgot-receipt.sql`, Auth và SMTP giả | Exit 0, Node báo 8/8 mục gồm suite cha và 7 tiểu ca. TC-OWNER-53 ghi lỗi tên, TC-OWNER-54 ghi khóa lượt nhập sau năm lần sai. Phần hồi quy TC-OWNER-55/87/113/114 gồm replay, mất phản hồi Auth, tranh claim và token cũ, ngưỡng sáu lỗi, hàng rào mail và hai thứ tự tranh chấp mail T06 với bắt đầu rotation. |
| `node node_modules/vitest/vitest.mjs run src/app/drawers/admin/StoreKeyRotationPanel.test.tsx src/adapters/supabase/authPermissionContract.test.ts` | Vitest 4.1.10, môi trường kiểm component và adapter | Exit 0, 24/24, 2 tệp. |
| `node node_modules/@playwright/test/cli.js test tests/smoke/store-key-rotation.spec.ts --workers=2 --retries=0 --trace=off --reporter=line` | Chromium local, Vite ở chế độ mock | Exit 0, 5/5. Kiểm lớp xác minh quyền, giữ form OTP và màn key khi chuyển tab, ghép một chạm và nhập lại PIN theo năm kích thước. Vite cảnh báo về import thiếu phần mở rộng với bộ nạp cấu hình tương lai. |

Database thử dừng sau khi chạy. Báo cáo Node đã che thông tin xác thực và giữ trong local notes. Bản sao cho phép tái hiện lần kiểm trong cùng môi trường. Lượt này giữ staging và Production ở cấu hình hiện hành. 12.9 vẫn mở. Ca TC-OWNER-115 cần Auth thật v2.198.0 trong môi trường cô lập để dựng thứ tự commit, cùng phần claim/refresh của chính phiên A/B và RPC dùng JWT cũ đúng contract trên staging.

Hai reviewer AI độc lập **APPROVE** checkpoint local. Reviewer nghiệm thu đối chiếu tiểu ca và giới hạn. Reviewer triển khai đối chiếu Git tree, remote, phạm vi loopback và trạng thái dừng PostgreSQL. OpenSpec strict và kiểm tra diff đạt.

<a id="kiem-auth-that-jwt-0040-20261127"></a>

### Kiểm thứ tự Auth thật và JWT cũ trên quán #0040

Ngày 27/11/2026, Linh giao tiếp tục 12.9 và trực tiếp xác nhận đổi key trên A. Hai Protected Preview A và B giữ source `cd3e3e3` tại hai origin khác nhau trong Chrome 24tx. Dùng quán thử #0040 tạo qua T06, hộp thử riêng và PIN thử. Cả hai máy vào POS trước đổi. Bật tạm TTL Edge 3.600 giây sau khi kiểm 0/0/0 lượt mở, challenge còn hạn, thư rotation chưa xử lý và có HTTP 200 gần nhất của worker. Gửi một OTP đổi key lúc 15:26:11. Hai lần nhận lại quyền trước đó vẫn thấy ô xác nhận trống và chưa có lượt đổi. Linh hoàn thành xác nhận trực tiếp sau khi Codex đưa mã vào clipboard để Linh tự dán và bấm nút trên A.

| Tiêu chí | Quan sát |
| --- | --- |
| Thứ tự HTTP trên Auth thật cô lập | Runner Linux GitHub Actions dùng archive Auth chính thức `v2.198.0` đã đối chiếu SHA-256 và image `postgres:16.15-bookworm`, chỉ dùng loopback và fixture tổng hợp. Run `45964444922/1` tại commit `b032e50` đạt 4/4. Phiên đã nhận token từ password grant hoặc refresh trước Admin update bị thu hồi sau update. Password grant và refresh bắt đầu sau Admin update bị từ chối với credential cũ. Phiên dùng key mới có ID khác, `iat` sau đổi, TTL 3.600 giây và refresh thành công. Mỗi ca bảo đảm thứ tự HTTP bằng phản hồi đã về. Ca giao dịch chồng lấn của TC-OWNER-115 vẫn thiếu. [Lượt Auth cô lập](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45964444922). |
| RPC đọc bằng access JWT cũ sau đổi | Trước đổi, cả hai phiên probe riêng của #0040 gọi `permission_get_store_session` với `x-pos-permission-contract: 2` thành công, đúng số quán. Sau đổi, JWT cũ còn hạn của cả hai phiên vẫn trả HTTP 200, `ok: true` và đúng quán, phù hợp quyết định 42. Hai refresh token cũ đều bị từ chối với HTTP 400 `refresh_token_not_found`. Password grant bằng key cũ HTTP 400 `invalid_credentials`. |
| Phiên mới sau đổi | Hai phiên probe mới độc lập. ID khác hai phiên cũ. RPC đúng quán trả HTTP 200. Refresh từng phiên mới HTTP 200, cùng ID phiên mới, tăng `iat` và `exp`, nhận refresh token mới. Probe đã logout cục bộ hai phiên mới, xóa trạng thái trong bộ nhớ và dừng. |
| Hai phiên trình duyệt | A bấm “Dùng key mới trên máy này” và vào màn PIN #0040. Có lúc đã nhập PIN và bấm mở khoá mà vẫn thấy màn PIN. Tải lại riêng tab A rồi nhập PIN thì vào POS. Chưa xác định nguyên nhân của lần mở khóa đầu. B hiện thông báo “Phiên ghép thiết bị đã mất hiệu lực” và form ghép trước thao tác ghép lại, rồi dùng key mới và PIN vào POS. SQL cuối đọc thế hệ 1, `completed`, 0 phiên trước `applied`, 2 phiên có refresh token chưa thu hồi. Hàng Auth và UI chứng minh kết quả ghép. CUA không thu được phản hồi Auth chứa claim/token của chính hai phiên trình duyệt; các phép gọi trực tiếp trong bảng là phiên probe. |
| Hoàn nguyên staging | SQL xác nhận #0040 `completed`, thế hệ 1, một thư giao key `submitted`, 0 rotation mở, 0 challenge còn hạn, 0 thư rotation chưa ổn định. Gỡ cờ lúc 15:37:07. Readback cờ rotation vắng, cờ Quên Store Key còn. Qua một nhịp cron, SQL đọc 0/0/0, một HTTP 200 và một lượt cron thành công. Hai tab A/B ở POS, Chrome và máy vẫn mở. |

[POS light CI của nhánh probe](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45964444920) báo `ui-audit` không có report hợp lệ, cùng nhóm tín hiệu với attempt 1 của CI main `45945781701`. Chưa xác định nguyên nhân. Run riêng của Auth đạt trên commit probe, còn kết quả nghiệm thu UI giữ gắn với deployment `cd3e3e3`. Hai tệp của runner chỉ nằm trên nhánh thử, chưa hợp nhất vào main.

**Trạng thái 12.9.** Đã bổ sung RPC dùng JWT cũ đúng header trên staging và bốn thứ tự HTTP trên Auth thật cô lập. Mục 12.9 vẫn mở cho claim/refresh trực tiếp của chính phiên trình duyệt A/B, ca giao dịch chồng lấn TC-OWNER-115 và phần bằng chứng lỗi, đồng thời, operator còn thiếu. Mã, key, PIN, email, token và thông tin phiên không có trong biên bản. Một lần gắn cửa sổ Chrome trước đó hiển thị email profile và URL Preview trong đầu ra công cụ. Không lưu giá trị vào biên bản.

Hai reviewer AI độc lập **APPROVE** hồ sơ SHA-256 `8A02BC22138EBAC33970F193D66FD7CB26F3F50C9A39C915B2568901D462F317` trước dòng này. Reviewer nghiệm thu đối chiếu kết quả RPC/refresh, phạm vi A/B và thứ tự HTTP. Reviewer triển khai đối chiếu CI, môi trường và việc hoàn nguyên. OpenSpec strict và kiểm tra diff đạt.

<a id="kiem-mat-http-worker-cu-20261127"></a>

### Kiểm thêm nhánh lỗi và worker cũ của 12.9

Ngày 27/11/2026, Linh hỏi phần còn thiếu có thể kiểm ngay hay cần ghi nhận là chưa kiểm. Hai phép thử hợp đồng chạy trên PostgreSQL 16.15 loopback, Node v24.16.0, Auth và SMTP giả. Source ứng dụng `cd3e3e3` giữ nguyên. Commit local `8fd6c3a` chỉ đổi `tests/contracts/ownerStoreKeyRotation.local.test.mjs`, Git tree `db162a26cef962658f6e0addcc5b23064ec7b512`. Chạy `node --test --test-reporter=tap tests/contracts/ownerStoreKeyRotation.local.test.mjs` với DSN database thử riêng. Exit 0, 7 tiểu ca đạt cùng nhóm cha, 0 lỗi và 0 bỏ qua. TAP đã lọc nằm trong Git local notes. Đã dừng PostgreSQL sau lượt kiểm.

| Phạm vi | Kết quả |
| --- | --- |
| TC-OWNER-55(b) · Mất phản hồi HTTP sau `applied` | Handler thật hoàn tất với HTTP 200 và DB ở `applied`. Server kiểm trên loopback ngắt socket trước khi client nhận header/body, client nhận `UND_ERR_SOCKET`. Gửi lại cùng attempt chỉ trả trạng thái. Worker đi tới `completed`. Có đúng một lần đổi mật khẩu, 0 lần probe, một lượt đổi, một audit, một thư key ở SMTP giả và generation 1. Thư chứa key khớp với kết quả handler ban đầu. |
| TC-OWNER-113 · RPC của worker R1 khi R2 tiến triển | Gửi lại báo cáo dispatch, báo cáo probe, ghi `applied` và hoàn tất bằng token R1 cũ khi R2 lần lượt `pending`, `applied` và `completed`. Mọi lời gọi cũ trả null. Key và generation giữ đúng ở từng mốc, R2 hoàn tất và có đúng hai audit cho hai lượt. Bằng chứng nằm ở lớp DB. Ma trận Auth spy toàn phần vẫn còn mở. |
| TC-OWNER-53 · Khóa nút khi gõ sai tên | Protected Preview A `cd3e3e3` với fixture #0040. Tên sai hoặc trống giữ nút Gửi mã vô hiệu. Tên đúng mở nút. Xóa lại nội dung nhập. Lượt này dừng ở điều kiện UI, 0 yêu cầu gửi OTP từ thao tác kiểm. Backend trả `STORE_NAME_MISMATCH` đã kiểm trong contract local. Cấu hình staging giữ trạng thái sau hoàn nguyên #0040. |

**Trạng thái 12.9.** Đã kiểm TC-OWNER-55(b) trong môi trường cô lập, bổ sung bước kiểm RPC worker cũ và xác nhận khóa nút sai tên trên Preview. Claim/refresh của chính phiên trình duyệt A/B và giao dịch Auth chồng lấn của TC-OWNER-115 tiếp tục ghi **Chưa kiểm** ở mức tiêu chí đó. Ma trận Auth spy và mail/operator còn phần thiếu bằng chứng. Lượt này chỉ thêm test và tài liệu, cũng chưa phát hiện lỗi sản phẩm mới.

Hai reviewer AI độc lập **APPROVE** test tree `db162a26cef962658f6e0addcc5b23064ec7b512` và hồ sơ SHA-256 `50CA17849EC36089DDF6A61D75BE38ECED544C709AFCF6EF4677F0EF915D2F3A` trước dòng này. OpenSpec strict và kiểm tra diff đạt.

<a id="kiem-dua-thu-va-moc-refresh-ab-20261127"></a>

### Kiểm đua nhận thư rotation và mốc gia hạn A/B

Ngày 27/11/2026, Linh giao tiếp tục. Test local `d9a1bd6` mở rộng `tests/contracts/ownerStoreKeyRotation.local.test.mjs` trên source ứng dụng `cd3e3e3`. Git tree `bca97158d1987b4f102b1f0215c1ca8360bfc1be`. Dùng Node v24.16.0 và PostgreSQL 16.15 loopback với database fixture cô lập. Chạy `node --test --test-reporter=tap tests/contracts/ownerStoreKeyRotation.local.test.mjs`, exit 0, 8 tiểu ca và nhóm cha đều đạt. TAP đã lọc giữ local. PostgreSQL đã dừng.

**TC-OWNER-114 ở lớp DB.** Hai worker tranh đúng thư rotation của fixture. `pg_blocking_pids` xác nhận worker B thực sự chờ trước khi A commit. Sau commit chỉ A nhận thư. Trong lúc `sending`, lượt đổi mới bị chặn. Quyền giao SMTP cấp đúng một lần. Sau khi ghi trạng thái giả lập `submitted`, quay được thế hệ kế tiếp. Kiểm DB xác nhận thư thế hệ cũ hết điều kiện gửi. Thư thế hệ mới không còn cảnh báo khi mô phỏng đã qua mốc 3.600 giây. Phép kiểm không gọi SMTP thật. Nhánh thư giao chậm và nhánh đổi email/chủ vẫn thiếu bằng chứng.

**Đối chiếu phiên thật của #0040.** Lúc 15:59:48, cả hai Protected Preview `cd3e3e3` vẫn hiển thị POS #0040. SQL chỉ đọc tổng hợp xác nhận thế hệ 1, đúng 2 phiên còn tồn tại, cả hai tạo sau `applied`, tạo lúc 15:35:29 và 15:37:43, 0/2 phiên có `refreshed_at` lớn hơn `created_at`. Kết quả này là mốc trước refresh. Với TTL 3.600 giây và điều kiện nhịp SDK, bắt đầu kiểm lại từ khoảng 16:34–16:36 nếu Chrome và SDK vẫn hoạt động. Cột `refreshed_at` là tín hiệu phía server. Đủ 2/2 tại mốc sau sẽ bổ sung bằng chứng gia hạn tự động của fixture. Phép đo trực tiếp request và so claim của chính A/B vẫn cần bằng chứng riêng để chốt tiêu chí. [Nguồn cập nhật thời điểm refresh](https://github.com/supabase/auth/blob/v2.198.0/internal/tokens/service.go#L612-L639) · [Nguồn chu kỳ SDK](https://github.com/supabase/supabase-js/blob/v2.108.1/packages/core/auth-js/src/GoTrueClient.ts#L5299-L5315).

Lượt này dùng SQL staging chỉ đọc, chưa phát OTP và giữ hai tab POS mở. Không ghi JWT, refresh token hoặc ID phiên vào hồ sơ. Mục 12.9 vẫn mở.

Hai reviewer AI độc lập **APPROVE** Git tree test `bca97158d1987b4f102b1f0215c1ca8360bfc1be` và hồ sơ sau khi sửa liên kết nguồn Auth. Dossier trước dòng này có SHA-256 `2204664203FADED5BD23BBE597C3E652C636946CFAC0BC7453D7D301F6032B38`. OpenSpec strict và kiểm tra diff đạt.

<a id="kiem-auth-dong-thoi-va-refresh-ab-20261127"></a>

### Auth HTTP đồng thời và gia hạn phiên A/B

Ngày 27/11/2026, Linh giao theo dõi tiếp. Lượt Auth cô lập trên nhánh test `test/t08-auth-order-20261127`, commit `c875e7e`, tree `e4418e59c52d808bb81b9206f5e669cdedbc35d3`. Job `45971400523/1` chạy Auth thật `v2.198.0` và PostgreSQL 16.15 loopback trên runner GitHub, giữ dữ liệu tổng hợp. Bốn ca HTTP tuần tự và một ca gửi đồng thời đạt. Trong ca đồng thời, hai refresh của hai phiên cũ và yêu cầu Admin đổi mật khẩu cùng được gửi trước khi chờ phản hồi. Hai refresh trả token. Sau khi cả ba phản hồi về, từng token mới nhất của phiên cũ bị từ chối trước khi thử lại token đời trước. Phiên dùng key mới có ID khác và gia hạn được. Lượt kiểm chỉ xác định thứ tự gửi/chờ HTTP. Không đo thứ tự commit hoặc tạo điểm chặn trong Auth. [Kết quả CI Auth](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45971400523).

Lúc 16:12:35, SQL chỉ đọc trên fixture #0040 xác nhận vẫn hai phiên tạo lúc 15:35:29 và 15:37:43. Cả hai chưa có mốc refresh trong hàng session. Audit PostgreSQL cho actor của fixture có 0 sự kiện `token_refreshed` sau baseline 15:59:48. Không truy xuất token hoặc ID phiên. Chờ cửa sổ SDK của từng tab. CUA đọc được DOM, chưa lấy được Resource Timing hoặc phản hồi HTTP cụ thể từ Chrome. [Nguồn SDK xử lý hiển thị tab](https://github.com/supabase/supabase-js/blob/v2.108.1/packages/core/auth-js/src/GoTrueClient.ts).

- Lúc 16:34:32, với A ở nền trước, SQL ghi 1/2 phiên có mốc refresh và vẫn cùng hai mốc tạo phiên ban đầu. Sau đó chuyển tab thuộc origin B lên nền trước qua tìm tab của Chrome. Thao tác này giữ phiên ghép hiện có.
- Lúc 16:36:44, SQL ghi 2/2 phiên có mốc refresh, với mốc tạo không đổi là 15:35:29 và 15:37:43. Cột `refreshed_at` có kiểu `timestamp without time zone` và dữ liệu UTC. Hai mốc 09:34:01 và 09:36:01 UTC tương ứng **16:34:01** và **16:36:01** giờ Việt Nam. Bản đọc đầu đã thực hiện chuyển múi giờ cho cột này theo kiểu timestamptz, nên kết luận giờ dùng hai giá trị UTC đã đối chiếu lại với kiểu cột. Audit PostgreSQL vẫn ghi 0 sự kiện sau baseline. Bằng chứng refresh thành công đến từ việc Auth cập nhật đúng hai hàng session. UI A/B vẫn ở POS #0040. Không phát OTP trong lượt theo dõi. [Nguồn ghi thời điểm refresh của Auth](https://github.com/supabase/auth/blob/v2.198.0/internal/tokens/service.go#L612-L639).
- POS light CI của nhánh kiểm cũng đạt ở run `45971400550/1`. Source ứng dụng ở staging giữ `cd3e3e3`. [POS light CI](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45971400550).

**Trạng thái 12.9.** Đã xác nhận phía server gia hạn thành công trên chính hai phiên A/B mới của #0040. Chưa thu response HTTP hoặc giá trị claim `iat`/`exp` từ chính hai tab. Ca Auth mới chứng minh kết quả của các yêu cầu HTTP gửi đồng thời, còn thứ tự commit có kiểm soát của TC-OWNER-115 vẫn mở. Mục 12.9 giữ mở cho các tiêu chí này và phần ma trận mail/operator còn thiếu. Một lần đọc danh sách tab Chrome hiển thị tên định danh dashboard và URL loopback của probe đã dừng trong đầu ra công cụ. Hồ sơ chỉ ghi số đếm và thời gian.

Hai reviewer AI độc lập **APPROVE** hồ sơ SHA-256 `3FC48C7A10F3B06360B15C1179F2ECAD4C9C1D5C843037ABCA04A98881740E15` trước dòng này. Reviewer nghiệm thu đối chiếu phạm vi A/B và thứ tự HTTP. Reviewer triển khai đối chiếu hai lượt CI, mốc UTC và nội dung đã che định danh. OpenSpec strict và kiểm tra diff đạt.

<a id="kiem-worker-113-87-55-co-lap-20261127"></a>

### Kiểm worker và khôi phục Store Key trên PostgreSQL cô lập

Ngày 27/11/2026, Linh giao kiểm TC-OWNER-113 trước, rồi TC-OWNER-87 và TC-OWNER-55 trên môi trường cô lập. Linh loại TC-OWNER-114 khỏi lượt kiểm. Source ứng dụng, Edge và candidate SQL trùng `main@cd3e3e3d5058d7b77a353fc2b0ab456b4971c76c`. Mã test nối từ `d9a1bd6` với Git blob `f56995a2de653bd3aa6d0a7a12fa67bb30d85e8a` của `tests/contracts/ownerStoreKeyRotation.local.test.mjs`.

Lượt cuối kết thúc lúc 20:10:49 UTC+7. Node `24.16.0` và `pg` `8.23.0` chạy trên Windows, kết nối PostgreSQL `16.15` tại loopback. DB `pos_cafe_t06_contract_t08worker113` tách từ seed T08 dùng candidate SQL rotation, OTP, mail và quên key, gồm cả migration xác nhận biên nhận quên key. Mỗi phép kiểm tạo quán và tài khoản tổng hợp. Handler, khóa PostgreSQL và HTTP loopback chạy thật. Auth và SMTP dùng bộ giả lập. Lệnh chạy từ worktree nhánh test như sau, với `POS_CAFE_T08_TEST_DSN` trỏ vào DB cô lập.

```sh
node --test --test-reporter=tap --test-skip-pattern='service-only|respects key mail|rotation mail has one|legacy T06 mail|signed worker drives|rotation mail alert remains' tests/contracts/ownerStoreKeyRotation.local.test.mjs
```

**Kết quả.** Exit `0`, 7 ca con đạt cùng bộ điều phối, 0 lỗi. TAP local `t08-worker-113-87-55-final-20261127.txt` có SHA-256 `A83DF799D86FB2C96390885BD78A178619C056DCF6B71DF50C722A7FA1EA9A15`. Bộ lọc lượt đầu chọn nhầm các ca ngoài phạm vi, gồm ca 114 có sẵn. Lượt đó bị loại khỏi kết luận. Lượt kiểm trọng tâm của 113 và lượt cuối đều loại ca 114.

| Ca | Kết quả đo được | Bằng chứng còn thiếu |
| --- | --- | --- |
| TC-OWNER-113 | Hai kết nối tranh khóa PostgreSQL, một claim thắng. Lỗi giải mã trước transport phát 0 lệnh Auth và cho phép token mới. Worker nhận lại lease gọi một probe sau lệnh đổi đã được ghi bởi Auth giả. R2 chỉ bắt đầu sau R1 `completed`. Khi R2 lần lượt `pending`, `applied`, `completed`, RPC ghi cũ bị từ chối và worker gọi lại với R1 không phát Auth update mới. Worker R1 đang đợi phản hồi cũng bị từ chối lúc báo kết quả muộn. Hai lần đổi hợp lệ khớp generation và bí mật mô phỏng sau `applied`. | Chưa ngắt worker thật ở mọi ranh giới RPC. Bộ giả đếm `changePassword` và `verifyPassword`. Chưa thu trace sign-out qua adapter Auth thật trong các lịch xen kẽ. |
| TC-OWNER-87 | Kiểm tiếp tục từ `pending` và dừng trước transport sau khi đã claim dispatch. Ở nhánh này, cả sáu probe âm tính giữ cùng token, lần sáu tạo một cảnh báo DB, lần bảy không gọi Auth. `stores` giữ generation cũ, 0 audit và 0 thư. Mất phản hồi Auth hoặc dừng trước khi ghi xác nhận đều phục hồi qua probe và đúng một Auth update giả. Sau khi ghi xác nhận, công bố key và hoàn tất chỉ qua DB. Yêu cầu đổi key lặp khi `pending` hoặc `applied` chỉ trả trạng thái theo phép kiểm HTTP. Yêu cầu quên key được xác nhận khi `pending` nhưng worker bỏ quán. Khi `applied`, thư lấy key hiện hành. | Chưa chạy ba thao tác đổi email, chuyển quyền và reset ở hai trạng thái. Chưa quan sát password grant/logout local thật, cảnh báo ở kênh operator hoặc từng loại phản hồi Auth qua transport thật. Bản đang kiểm chỉ ghi `no_effect` cho `transport_not_called`. Chưa có mã HTTP trong allowlist được hiện thực để kiểm nhánh này. |
| TC-OWNER-55 | Auth giả ghi một lần đổi rồi mất phản hồi, worker phục hồi bằng một probe. Ở đường Edge, socket loopback bị đóng sau khi handler ghi `applied` và tạo phản hồi `200`. Client gặp `UND_ERR_SOCKET`, gửi lại đúng attempt chỉ nhận trạng thái, worker hoàn tất mà tổng số gọi Auth vẫn là 1 update và 0 probe trên đường này. Thư rotation và thư Quên Store Key chứa key hiện hành và không chứa key cũ của fixture. DB có 1 rotation, 1 generation mới, 1 audit, 1 thư rotation và 1 thư quên key được yêu cầu riêng. | Chưa kiểm password grant và logout phiên tạm trên Auth thật trong ca mất phản hồi. Trạng thái `submitted` do SMTP giả trả về. Chưa đo giao thư thật trong ca này. |

Lượt này chưa đủ để đóng 12.9. PostgreSQL cô lập đã dừng sau phép kiểm, clone fixture giữ local để đối chiếu. Không dùng staging hoặc tạo bản triển khai trong lượt này. Hồ sơ lưu kết quả và số đếm, đã che các dữ liệu xác thực của fixture.

Hai reviewer AI độc lập **APPROVE** test blob `f56995a2de653bd3aa6d0a7a12fa67bb30d85e8a`, hồ sơ trước đoạn này `208977f791d55852656a41d280290a9e75302207`, testplan `fb54ee61177a2071085ea2a7b0c2fe0c0aa90adc` và kế hoạch `a0a92e1703867549a90e797e598da2ec42f3c079`. Một reviewer đối chiếu assertions và tiêu chí nghiệm thu. Reviewer còn lại kiểm nguồn, môi trường, TAP và phạm vi bàn giao. OpenSpec strict và kiểm tra diff đạt.
