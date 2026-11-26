# T08 · Máy đã ghép còn làm được gì sau khi cấp lại Store Key?

## Bốn lựa chọn đã chốt ngày 24/11/2026

Chủ dự án đã chốt phạm vi gỡ ghép, thời điểm giao key, cách ghép lại máy của chủ và môi trường kiểm như sau.

| Lựa chọn | Hành vi đã chọn |
| --- | --- |
| **1A · Gỡ ghép thiết bị này** | Bấm gỡ ngay từ màn chọn nhân viên, không cần PIN. Chỉ thu hồi phiên Auth hiện tại. Các máy đã ghép bằng phiên độc lập tiếp tục bán hàng. |
| **2A · Nhận key khi đang thu hồi** | Khi Auth đã đổi mật khẩu và POS đã lưu key mới (`applied`), chủ có thể nhận key qua email hoặc “Quên Store Key”. Báo rõ việc thu hồi phiên còn dở và máy vừa ghép có thể phải ghép lại. |
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
- **Trạng thái dở dang.** Spec đã nêu hai trường hợp cùng mang nhãn `pending`. Auth có thể chưa đổi mật khẩu hoặc đã đổi xong trước khi POS kịp ghi `applied`. Chỉ trong trường hợp đầu, key cũ còn có thể ghép mới cho tới khi đổi thành công. Sau sáu lần đối soát lỗi, thiết kế yêu cầu báo người vận hành. Luồng này và tình huống đăng nhập trùng thời điểm đổi mật khẩu chưa có phép kiểm T08 trên staging. [Thiết kế](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#L264) · [TC-OWNER-87](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#L165).
- **Bước thu hồi cuối.** Một lần đọc danh sách phiên không chứng minh mọi đăng nhập đang xử lý đã kết thúc. `created_at` so với `applied` cũng không cho biết bí mật nào dùng để ghép máy. Ở bản Auth đã đọc, gửi lại cùng mật khẩu vẫn có thể đăng xuất cả máy vừa ghép đúng bằng key mới. Spec đã ghi nhận hệ quả này. Chưa đủ căn cứ kết luận bước 4 có thể chỉ xác minh, hay việc gọi lại đã giải quyết mọi trường hợp đồng thời. [Thiết kế bước 4](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#L264) · [Nguồn Auth](https://github.com/supabase/auth/blob/v2.197.0/internal/api/admin.go#L234-L271).

## Ý nghĩa với bốn phương án

1. **PA1** gần nhất với quyết định 42. Quyết định chấp nhận JWT cũ trong phần đời còn lại với điều kiện máy cũ không thể gia hạn. Vẫn cần cơ chế hoàn tất bước thu hồi và bằng chứng cho điều kiện đó. [Quyết định 42](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#L495).
2. **PA2** có thể thu hồi phiên nhân viên tại DB. Máy hiển thị màn PIN sau khi app nhận tín hiệu hoặc kiểm lại phiên. Nếu JWT quán còn dùng được, người có PIN hợp lệ có thể mở phiên nhân viên mới theo quyền của mình. Giao diện và quyết định ở server có thể thay đổi ở hai thời điểm khác nhau. [Xử lý tín hiệu](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/app/PermissionLifecycle.tsx#L59-L82).
3. **PA3** phù hợp để cân nhắc nếu mục tiêu mới là từ chối yêu cầu POS được bảo vệ ngay từ request đầu tiên sau khi phiên bị thu hồi. Hook PostgREST hiện kiểm phiên bản giao thức. Hồ sơ staging ngày 23/10 xác nhận hook từng chạy ở chế độ strict. Bổ sung tra phiên là thay đổi chính sách cho Data API dùng chung. Cần kiểm quyền đọc, phạm vi vai trò/đường gọi, xử lý lỗi và máy của chủ đang nhận key. Hook chỉ phát hiện phiên đã mất. Nút gỡ ghép hiện gọi `signOut()` với scope mặc định global nên cũng cần tính tác động lên các máy cùng quán. [Hook](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/supabase/candidate/permission-compatibility-prepare.sql#L31-L56) · [Hồ sơ staging H0](permission-staging-functional-2026-10-23.md#L20) · [Gỡ ghép](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L36-L39) · [Scope đăng xuất](https://supabase.com/docs/guides/auth/signout) · [Phạm vi pre-request](https://supabase.com/docs/guides/api/securing-your-api).
4. **PA4** rút ngắn TTL của JWT phát mới cho cả project và tăng tần suất refresh. Quyết định 42 đã cân nhắc và loại cách rút TTL. [Quyết định 42](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#L495).

**Trạng thái bằng chứng.** Ngày 17/11 staging đã từ chối ba key cũ và ba refresh token sau khi dọn tài khoản cũ trong cutover T06. T08 giữ nguyên tài khoản và chỉ đổi mật khẩu. Task 12.10 còn cần TTL thực và cách hoàn tất thu hồi theo tài khoản. TC-OWNER-52 còn cần kết quả hai máy trên cùng quán sau khi có luồng T08, gồm ghép lại, refresh, quyền POS và hiển thị/gửi key. Quyết định 42 vẫn là yêu cầu đã chốt. Phân tích ngày 24/11 chỉ đọc nguồn và bằng chứng trước đó. [Biên nhận T06](g01-g10-t06-owner-implementation-2026-11-11.md#L637) · [TC-OWNER-52](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#L134).

## Đối chiếu bổ sung ngày 24/11/2026

**Gỡ ghép trước PIN.** Nút “Đổi quán / Gỡ ghép” gọi thẳng thao tác gỡ và báo “Đã gỡ ghép thiết bị”. Khi Auth nhận yêu cầu từ phiên hợp lệ, scope mặc định `global` thu hồi các phiên của tài khoản kỹ thuật dùng chung cho quán. JWT đã phát và thời điểm mỗi màn hình nhận ra việc thu hồi có vòng đời riêng. Store Key vẫn dùng được để ghép lại. Smoke test đã ghi nhận hành vi global và dùng scope local để dọn phiên thử. Cả nhánh gỡ ghép lẫn nhánh dọn sau khi đăng nhập ghép thành công nhưng kiểm tra quán không khớp đều gọi `signOut()` mặc định, đã có trước T06. Quyết định ngày 24/11 giới hạn **gỡ ghép thông thường** trong phiên hiện tại. Khi triển khai cần rà cả hai chỗ gọi. Có thể đánh giá PA3 song song và ghi tác động liên máy trước khi áp dụng. [Màn chọn nhân viên](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/app/screens/PasscodeScreen.tsx#L74-L85) · [Hai chỗ gọi](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L19-L39) · [Smoke test](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/tests/supabase/pos-cafe-supabase.spec.ts#L75-L88) · [Phạm vi đăng xuất](https://supabase.com/docs/guides/auth/signout).

**Đăng nhập trùng lúc cấp lại.** Nguồn Auth v2.197.0 có căn cứ để giữ rủi ro đồng thời trong task 12.10. Dự án chưa có bằng chứng trên hosted rằng đổi mật khẩu một lần sẽ ngăn mọi phiên từ các đăng nhập đang xử lý tiếp tục gia hạn. Nếu một phiên như vậy tồn tại và vẫn hợp lệ, nó có thể làm mới qua hạn của JWT ban đầu. PA3 chỉ tra sự tồn tại của phiên nên vẫn chấp nhận phiên còn trong bảng. Chính sách phiên và việc thu hồi sau đó quyết định thời gian thực tế. Chưa xác lập được giới hạn thời gian xử lý đầu cuối trên hosted để dùng “chờ rồi đăng xuất lần hai” làm bảo đảm. API đăng xuất quản trị chuẩn nhận JWT của người dùng, trong khi worker được thiết kế để chạy khi không giữ JWT thiết bị. Nếu đổi cơ chế phải nêu cách worker hoàn tất bước này khi chạy lại. [Nguồn Supabase Auth đã đối chiếu](https://github.com/supabase/auth/tree/v2.197.0) · [Chính sách phiên](https://supabase.com/docs/guides/auth/sessions) · [Đăng xuất qua Admin API](https://supabase.com/docs/reference/javascript/auth-admin-signout).

**Giao key trong lúc đối soát.** Ở bước 3, thiết kế ghi key mới và xếp thư vào hàng đợi. Từ `applied`, thiết kế mở lại luồng quên key, đổi email, chuyển quyền và reset. Bản đặc tả ngày 24/11 ghi rõ thư quên key bỏ qua quán ở `pending` và có thể gửi key mới từ `applied`. Dời riêng màn hình và thư cấp lại tới bước 4 vẫn để ngỏ khả năng chủ nhận key qua thư **quên** Store Key. Nếu muốn tất cả các đường giao key cùng chờ `completed`, đó là thay đổi yêu cầu. Cần chốt cả cách chủ lấy lại key khi bước thu hồi lỗi kéo dài. TC-OWNER-87(h) hiện kỳ vọng key mới vẫn dùng được ở `applied`. [REQ-OWNER-09/10](../../../openspec/changes/add-owner-account-and-store-provisioning/specs/owner-account/spec.md#L173) · [Thiết kế bước 3–4](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#L264) · [TC-OWNER-87](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#L165).

**Tiêu chí kiểm.** FK của refresh token có `ON DELETE CASCADE`. Khi phiên đã bị thu hồi, điều cần xác minh là không được cấp bộ token mới. Auth v2.197.0 có các nhánh `refresh_token_not_found` và `session_not_found`. Câu “No Valid Session Found” chỉ ứng với một nhánh. Trong auth-js 2.108.1, “còn dưới 120 giây” là điều kiện xét ở một nhịp kiểm tự động. Việc một tab phát hiện mất phiên còn phụ thuộc lúc SDK thực sự chạy. Phép thử hai máy sau khi có T08 đã thuộc mục 12.9/TC-OWNER-52. Mục 12.10 vẫn mở cho cơ chế thu hồi, điều kiện đồng thời và TTL thực. [FK](https://github.com/supabase/auth/blob/v2.197.0/migrations/20220811173540_add_sessions_table.up.sql#L12-L22) · [Các nhánh lỗi](https://github.com/supabase/auth/blob/v2.197.0/internal/tokens/service.go#L210-L235) · [Tick của SDK](https://github.com/supabase/supabase-js/blob/v2.108.1/packages/core/auth-js/src/GoTrueClient.ts#L5299-L5315) · [Checklist 12.9 và 12.10](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#L208).

## Bàn giao cho lượt triển khai

1. Sửa và kiểm luồng “Gỡ ghép thiết bị này” theo UC-OWNER-14 và TC-OWNER-112. Ca này cần hai phiên độc lập trên cùng một quán thử. Sau khi gỡ A, kiểm phiên A cũ bị từ chối gia hạn trước khi ghép lại A. B vẫn phải gia hạn và thao tác được. [Use case gỡ ghép](../../../openspec/changes/add-owner-account-and-store-provisioning/usecases.md#uc-owner-14--gỡ-ghép-thiết-bị-này).
2. Khi mở T08 theo [kế hoạch G01–G10](../g01-g10-plan.md), có thể triển khai quên key theo mục 11 và kiểm TC-OWNER-49…51, 100. TC-OWNER-49 cần một email thử đứng tên hai quán. TC-OWNER-87 phân biệt thư quên key trong hai trạng thái `pending` và `applied`.
3. Trước khi chọn cơ chế thu hồi của luồng đổi key, hoàn tất mục 12.10. Cần biết TTL thực tế, khả năng gia hạn của các phiên cũ và cách worker hoàn tất bước thu hồi sau khi chạy lại. Nếu kết quả chưa bảo đảm điều kiện của quyết định 42 thì báo chủ dự án. Sau triển khai, kiểm TC-OWNER-52…55, 87, gồm nút “Dùng key mới trên máy này”, bước nhập PIN và khôi phục khi dở dang. [Checklist cấp lại](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#12-cấp-lại-store-key).

Các ca trên là kế hoạch kiểm. Giữ thông tin xác thực trong môi trường thử và lưu kết quả đã che bí mật.

**Kiểm tra tài liệu ngày 24/11/2026.** OpenSpec strict và kiểm tra diff đạt. Hai lượt rà độc lập về nghiệp vụ POS và phạm vi phiên Auth đã duyệt bản cuối. TC-OWNER-112 đã bổ sung hai nhánh dọn phiên của adapter. TC-OWNER-52 đã bổ sung điều kiện máy B tự về luồng ghép khi nhận biết mất phiên.

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
