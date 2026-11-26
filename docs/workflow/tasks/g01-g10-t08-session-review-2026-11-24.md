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
