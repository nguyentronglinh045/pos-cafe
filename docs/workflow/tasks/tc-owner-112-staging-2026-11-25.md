# TC-OWNER-112 · Gỡ ghép thiết bị trước PIN

**Kết quả cuối ngày 25/11/2026.** TC-OWNER-112 đạt trên Vercel staging ở `e362c1d` trong 17,5 giây. Nút trên màn chọn nhân viên hiển thị “Gỡ ghép thiết bị này”, đúng nhãn trong đặc tả.

## Kết quả trước bản sửa

Kiểm trên web POS Cafe dùng Supabase staging ngày 25/11/2026. [Tiêu chí trên docs@7040e31d](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#gỡ-ghép-một-thiết-bị). Biên nhận của bản trước sửa là [lượt phát hành 44859420195 trên 209aecc](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/44859420195). UI của lượt kiểm hiển thị nhãn gỡ ghép trùng với source ở mốc này.

Bundle frontend trước bản sửa là `/assets/index-d2cCukSx.js`, HTTP 200, SHA-256 `3d202e480821309e10c291839f145375f8ad5036a597322a9ebac75bc69761c8`. Kiểm nội dung bundle xác nhận địa chỉ backend trùng đích staging và có chuỗi “Đổi quán / Gỡ ghép”.

Linh chuẩn bị quán thử và hai lần đăng nhập. A là Chrome thường của profile sinh viên, ở màn Chọn nhân viên của cửa hàng #0032. B là Chrome ẩn danh, hiển thị tên “Quán thử TC-OWNER-112” và vai trò Chủ quán. Đây là bằng chứng UI ở hai vùng lưu trữ trình duyệt độc lập. Linh xác nhận A chờ ở màn chọn nhân viên và B đã vào POS bằng Chủ quán.

| Tiêu chí | Kết quả và bằng chứng |
| --- | --- |
| A gỡ trước PIN | **Đạt về hành vi.** A hiển thị “Chọn nhân viên”, “Mở khoá” bị vô hiệu. Bấm một lần vào “← Đổi quán / Gỡ ghép”. A về màn bắt đầu có lựa chọn “Đã có quán” để ghép máy. Nhãn nút khác “Gỡ ghép thiết bị này” trong đặc tả. |
| Auth từ chối gia hạn phiên A cũ | **Chưa xác minh trực tiếp.** A đã rời màn chọn nhân viên. Lượt này chưa ghi được yêu cầu làm mới của chính phiên A cũ và phản hồi Auth sau thao tác gỡ. |
| B gia hạn bằng chính phiên đã mở | **FAIL.** Network cửa sổ ẩn danh ghi hai dòng cho `token?grant_type=refresh_token`. Preflight trả 200, yêu cầu fetch gia hạn trả 400 Bad Request. Chưa xác minh mã lỗi chi tiết trong phản hồi. |
| B sử dụng POS | **Chỉ đạt ngay sau khi gỡ A.** B mở Báo cáo hôm nay bằng Chủ quán, thấy doanh thu 0 đồng và 0 đơn đã thanh toán. Hai yêu cầu fetch đọc báo cáo và danh sách đơn trả HTTP 200. Khi kiểm lại sau lỗi gia hạn, B đã về màn “POS quán cà phê” có nút “Đã có quán”, mất khả năng làm việc liên tục theo quyền cũ. |
| A ghép lại bằng Store Key hiện hành và yêu cầu PIN | Chưa chạy trong lượt Chrome thường + ẩn danh. Đạt trong lượt hai profile bên dưới. |

**Kết luận lượt thường và ẩn danh trước bản sửa: FAIL.** Tiêu chí duy trì phiên độc lập của B thất bại.

Phạm vi là hành vi gỡ ghép trên staging. Hai nhánh đơn vị của adapter trong testplan và các luồng quên/đổi Store Key nằm ngoài lượt chạy. Biên bản chỉ ghi nhãn màn hình, loại yêu cầu và kết quả đã lọc.

## Lượt hai profile Chrome thường ngày 25/11/2026

Theo lựa chọn mới của Linh, A dùng profile sinh viên và B dùng profile cá nhân. Mỗi profile có một tab staging. Codex ghép riêng từng profile bằng Store Key hiện hành của cửa hàng #0032. B vào POS bằng Chủ quán và hiển thị tên “Quán thử TC-OWNER-112”. Mốc 13:53–13:54 lấy từ đồng hồ trên giao diện khi ghép và gỡ.

| Tiêu chí | Kết quả lượt hai profile |
| --- | --- |
| Nút gỡ trước PIN trên A | Đạt về hành vi. Từ màn chọn nhân viên, khi nút “Mở khoá” đang bị vô hiệu, bấm “← Đổi quán / Gỡ ghép” đưa A về “Đã có quán”. |
| Auth từ chối gia hạn phiên A cũ | Chưa có quan sát trực tiếp trên máy chủ cho chính phiên A vừa gỡ. |
| B dùng POS ngay sau khi gỡ A | Đạt ở thời điểm mở báo cáo. B hiển thị Báo cáo hôm nay, doanh thu 0 ₫, 0 đơn. |
| B gia hạn và dùng POS sau gia hạn | **FAIL.** Lần gia hạn tự động xuất hiện trong Network giữa 14:51 và 14:52, khoảng 58 phút sau khi gỡ A. Yêu cầu fetch `token?grant_type=refresh_token` từ bundle `index-d2cCukSx.js` trả `400 Bad Request`. POS báo “Phiên nhân viên không còn hợp lệ. Vui lòng đăng nhập lại.” Đóng Báo cáo để thấy B đã về màn bắt đầu với nút “Đã có quán”. |
| A ghép lại và yêu cầu PIN | Đạt. Cùng Store Key ghép lại A vào cửa hàng #0032. Sau khi chọn Chủ quán, A hiển thị bàn phím PIN và “Mở khoá” bị vô hiệu khi PIN trống. |

**Kết luận lượt hai profile Chrome thường: FAIL.** B mất phiên khi gia hạn. Phép đo dùng phiên B sẵn có và cơ chế tự gia hạn của ứng dụng. Chưa xác minh mã lỗi chi tiết của Auth hoặc phản hồi gia hạn riêng của phiên A cũ.

## Nguyên nhân và phạm vi đề xuất sửa

- **Nguyên nhân ở adapter Supabase.** Nút trên màn chọn nhân viên đi qua `useUnpairStoreMutation` và `unpairStoreSession` để gọi `SupabaseAuthRepo.unpairStore()`. Adapter gọi `auth.signOut()` không truyền phạm vi. Lúc chẩn đoán, bundle có SHA-256 ở trên chứa lời gọi này và đầu remote `main` khớp `209aecc`. [Nút và mutation](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/app/screens/PasscodeScreen.tsx#L121-L129) · [Luồng gỡ qua port](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/features/session/sessionFlow.ts#L59-L62) · [Adapter](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L36-L39).
- **Tác động lên B.** Store Key của cùng quán đưa hai máy vào hai phiên của cùng một tài khoản Auth quán. SDK khóa phiên bản `2.108.1` dùng `global` làm mặc định. Auth thu hồi khả năng gia hạn của mọi phiên thuộc tài khoản đó. B vẫn dùng JWT đã được cấp để đọc POS cho đến khi cần gia hạn. Quan sát HTTP 400 sau khoảng 58 phút khớp với cơ chế này. Chưa ghi mã lỗi chi tiết của lần gia hạn staging. [Đăng nhập quán](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L19-L25) · [SDK 2.108.1](https://github.com/supabase/supabase-js/blob/v2.108.1/packages/core/auth-js/src/GoTrueClient.ts#L3901-L3926) · [Phạm vi đăng xuất Supabase](https://supabase.com/docs/guides/auth/signout#sign-out-and-scopes).
- **Cùng lỗi ở nhánh dọn sau ghép.** Nếu Auth đã đăng nhập thành công mà phiên quán trả về rỗng hoặc sai số quán, `pairStore()` cũng gọi `signOut()` không truyền phạm vi rồi báo `AUTH_REQUIRED`. Đây là phát hiện từ đọc mã, chưa quan sát nhánh đó trên staging. [Nhánh dọn](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/src/adapters/supabase/authRepo.ts#L27-L33) · [Hai ca đơn vị trong testplan](https://github.com/nguyentronglinh045/pos-cafe/blob/7040e31d/openspec/changes/add-owner-account-and-store-provisioning/testplan.md#L182).

Đề xuất truyền `{ scope: "local" }` ở hai lời gọi. Phạm vi này yêu cầu Auth thu hồi phiên hiện tại trên máy chủ. Giữ việc dọn credential nhân viên và cách trả lỗi hiện có. Phần kiểm hồi quy gồm nhánh gỡ và hai nhánh dọn sau ghép. Ca tích hợp bấm nút thật trên A trước PIN, xác minh Auth từ chối gia hạn A cũ và B gia hạn thành công rồi dùng POS trước khi ghép lại A. Các ca một thiết bị hiện có kiểm được thao tác gỡ và ghép lại. Bước dọn trực tiếp qua `/logout?scope=local` của smoke không đi qua adapter của nút. [Nguồn xử lý phạm vi tại Auth](https://github.com/supabase/auth/blob/v2.197.0/internal/api/logout.go#L43-L65) · [Ca UI một thiết bị](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/tests/supabase/ownerPinOnboarding.spec.ts#L384-L392) · [Smoke dọn phiên](https://github.com/nguyentronglinh045/pos-cafe/blob/209aecc/tests/supabase/pos-cafe-supabase.spec.ts#L80-L90).

Mốc chẩn đoán đã rà mã nguồn và bundle trước khi sửa. Kết quả triển khai và kiểm hồi quy được ghi trong phần “Bản sửa và kiểm lại”.

### Rà soát độc lập

Hai subagent duyệt phần chẩn đoán trong biên bản (SHA-256 trước mục này `08c0182a73324b19f22df0dc1a52774e6298521ec5f7f07bead2f88a2a4cb5cb`) và dòng T08 của kế hoạch (SHA-256 `e31a3d0f534a92bc81e17b1e4478abe182ac8aacf8ca3a272e0c11691067af98`).

- **Auth và phạm vi sửa — APPROVE.** Đã kiểm bundle, mã `209aecc`, SDK `2.108.1` và testplan. Lưu ý `local` yêu cầu thu hồi ở máy chủ cho phiên hiện tại. SDK có thể chấp nhận một số phản hồi lỗi rồi xóa phiên phía máy khách, nên vẫn cần kiểm trực tiếp trường hợp A cũ.
- **Bằng chứng staging và kiểm thử — APPROVE.** Đã kiểm độc lập bundle, đối chiếu quan sát B và các ca hiện có. Lượt hai profile đã ghép lại A trước khi quan sát B tự gia hạn. Điều này không đổi kết quả FAIL của B. Lượt nghiệm thu sau sửa vẫn cần quan sát A và B trước khi ghép lại A theo testplan.

## Bản sửa và kiểm lại

Linh yêu cầu sửa, push, rà bản đã push rồi triển khai lên Vercel để kiểm lại. Phần Auth dùng `scope: "local"` ở hai lời gọi. Ca TC-OWNER-112 chạy trên hai context độc lập của Chromium và tua riêng đồng hồ B tới gần hạn JWT để SDK tự gửi yêu cầu thật. Supabase staging vẫn dùng cấu hình thời gian phiên hiện hành. [PR #41](https://github.com/nguyentronglinh045/pos-cafe/pull/41).

| Kiểm chứng trên candidate `dcf3b10` | Kết quả |
| --- | --- |
| Vitest tập trung và build | 10/10 test đạt và build đạt trên commit đã push. |
| Frontend local và Supabase staging | TC-OWNER-112 đạt trong 14,1 giây. Nút gỡ trả logout 204 với phạm vi local. Auth từ chối gia hạn A cũ và không cấp JWT. B tự gia hạn 200, nhận phiên mới và đọc báo cáo 200 với quyền cũ. A ghép lại và vẫn cần PIN. B đã dọn cả phiên nhân viên lẫn phiên Auth. |
| Rà độc lập sau push | Hai subagent APPROVE trên `dcf3b101f16fba0877e0541ffcf277fe5d18f884`. Rà Auth xác minh blob và ca unit. Rà kiểm thử xác minh giữ thông tin dọn nếu A cấp phiên bất ngờ và dọn riêng phiên nhân viên B trước logout Auth. |
| GitHub | Hai lượt CI của PR đạt. PR đã merge vào `main` tại `7014d3fa2527a65d4d7a1628e84a197c09e0418b`. So sánh cây tệp với candidate đã duyệt không có khác biệt. |
| Vercel staging | **Đạt TC-OWNER-112 trong 16,2 giây** trực tiếp trên tên miền staging của Vercel. Hai context Chromium thực hiện cùng các bước ở trên với máy chủ Auth thật. [CI main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45576241133) và [workflow phát hành](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45578255269) đạt. |

Biên nhận Vercel trả `READY` cho deployment `dpl_EqSybVqX99KqMry3AfGZaTV7VxfM`, source `7014d3fa2527a65d4d7a1628e84a197c09e0418b`, dữ liệu staging. Bundle live `/assets/index-DOULYeke.js`, SHA-256 `4d52edfa45193ba6ed7bb5bc9a4be1083c19feb575836b7ea6912e1e77bddf6f`, chứa lời gọi gỡ ghép với phạm vi `local`.

Kết quả sau sửa áp dụng cho hành vi gỡ ghép trong TC-OWNER-112. Lượt sau triển khai dùng hai context Chromium do Playwright tạo. Lượt hai profile Chrome trên máy Linh là phép kiểm trước bản sửa.

### Lượt kiểm lại trực tiếp trên Vercel

Ngày 25/11/2026, theo yêu cầu của Linh, chạy lại TC-OWNER-112 trên Vercel với hai context Chromium mới. Biên nhận phát hành, SHA-256 của bundle đang phục vụ và cây nguồn của bài test khớp `7014d3f`. Playwright trả **1 test đạt trong 14,7 giây**. A gỡ trước PIN, logout phạm vi local trả 204 và Auth từ chối gia hạn A cũ với HTTP 400. B gia hạn 200, đọc báo cáo 200 với quyền Chủ quán, rồi A ghép lại bằng key hiện hành và vẫn yêu cầu PIN. Đồng hồ thử chỉ tua phía B. Ca đạt gồm các bước dọn phiên của fixture.

### Đồng bộ nhãn nút

Ngày 25/11/2026, theo yêu cầu của Linh, đổi nhãn tại màn chọn nhân viên thành “Gỡ ghép thiết bị này” theo UC-OWNER-14 và cập nhật bốn vị trí tìm nút trong các bài kiểm. Build và 8 ca Vitest đạt. Audit màn chọn nhân viên trên ba viewport ghi 0 finding. TC-OWNER-112 đạt trong 16,6 giây với frontend local và Supabase staging. Subagent rà độc lập và duyệt đúng commit `55127a8`. PR #42 merge vào `main` tại `e362c1d` sau khi CI đạt. [PR #42](https://github.com/nguyentronglinh045/pos-cafe/pull/42).

[CI của main](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45591281819) và [workflow phát hành Vercel](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/45602302184) đạt. Biên nhận Vercel ghi `READY` cho deployment `dpl_CsGUkwvj4aK5CcHX2rA7FtkwRUi1`, source `e362c1dc6125a44f1fa46020b588d44ac3ebf2ae` và dữ liệu staging. Bundle live `/assets/index-CmLcPGqH.js` trả HTTP 200, SHA-256 `247fef598d283e3c425289e7489f689060b2e984aa4b2dca71590cd5ce079879`, có nhãn mới và thao tác gỡ dùng phạm vi `local`.

Playwright chạy trực tiếp trên Vercel với hai context Chromium mới, tìm đúng nhãn mới bằng so khớp chính xác rồi bấm trước PIN. **TC-OWNER-112 đạt trong 17,5 giây**. Auth từ chối gia hạn phiên A cũ với HTTP 400. B gia hạn thành công và đọc báo cáo với HTTP 200. A ghép lại bằng Store Key hiện hành và vẫn yêu cầu PIN.
