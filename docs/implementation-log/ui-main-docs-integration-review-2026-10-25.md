# Review tích hợp UI — 25/10/2026

Phạm vi/quyền: [handoff](../workflow/tasks/ui-main-docs-integration-2026-10-25.md). Hai reviewer không tham gia sửa candidate; chỉ đọc và chạy kiểm mục tiêu, không deploy/backend.

## Kết quả merge và bàn giao

Cả R-UI và RI **APPROVE docs `a8e2447d9eae81a815dd7151de97bb7607ece5a4`**, xác minh audit cuối cf8e30448/48,0findings,source preserved và strict PASS48; kiểm đúng merge/cleanup cặp đầu và attribution các FAIL lịch sử. Code cf8e304 đã được cả hai APPROVE ở biên bản bên dưới.

Sau cả hai required checks40166453117/40166451739 SUCCESS, #13 merge vào main711a22e lúc05:57:39UTC; #14 merge vào docs8114a25 lúc05:57:45UTC. Tree main/docs merge bằng candidate tương ứng cf8e304/a8e2447. Đã kiểm ancestry/SHA/checkout sạch, detach hai checkout rồi xóa local+remote hai nhánh B03; cùng hai nhánh B01/B02 trước đó, cả bốn refs đều vắng. Không xóa worktree hoặc thay WIP gốc. Receipt này chỉ cập nhật metadata thao tác đã xảy ra; không thêm application changes, tests hay acceptance.

## B01/B02 — candidate 76e974c

Code `76e974c5ff52c65baee5e15b4fc8d096801dc2b0`; tree `f55df173fa28ad990a7fe7a17d1b2ed71768ad71`; parents #11 `bbd5be7` và main `0dd63ea`. Verdict giới hạn tích hợp #11/#12, không xác nhận fidelity, phần cứng, backend/live hoặc toàn hệ thống.

| Reviewer | Trọng tâm | Verdict |
| --- | --- | --- |
| R-UI / `review_ui` | UI, nghiệp vụ, focus, responsive, audit classification, docs authorization | APPROVE đúng SHA trên |
| RI / `review_integrity` | Quyền, tài chính, continuation/lifecycle, source/evidence | APPROVE đúng SHA trên |

R-UI tự kiểm browser trên localhost5191: cashier568×320 thấy `POS Demo`, nav-settings vắng; panel đóng display:none, mở có Close44×44; keyboard focus và xoay320×568 ẩn app-shell, chiều cao document bằng viewport568. Đọc build/unit1198/112files, portrait1 và cashier3 PASS. Xem đủ ảnh floor desktop/tablet/mobile: 19 nhóm đều false positive, gồm6 nhóm zero-size/empty-icon trên panel đóng bị display:none,13 nhóm clipping ở nhãn/duplicate cố ý visually hidden. Không đổi baseline.

RI đối chiếu diff main→candidate, guards/query purposes/write paths và các log build/unit/floor/cashier. Main core/features/adapters/SQL không đổi; kitchen requiredPermission, ReceiptPrintClick/grants và write protocol được giữ. Không xác nhận backend hoặc UI fidelity.

| Finding chặn vòng đầu | Cách đóng và bằng chứng |
| --- | --- |
| Shell/floor lấy tên quán bằng settings.manage | Dùng useStoreDisplayQuery; cashier test không gọi settings admin, vẫn có tên quán |
| Mở thẻ đơn đi thẳng order dù chỉ có payment.take | Cùng routing pay-only cho bàn và thẻ đơn; component regression |
| Response refetch muộn mở draft sau đổi phiên/quyền hoặc error | Capture view lifetime, kiểm error và quyền hiện thời;9 floor tests bao gồm3 trường hợp late response |
| CSS `.ui-remake .app-frame` thắng portrait:hidden | Utility portrait !hidden; smoke portrait sau login PASS và reviewer browser xác nhận |
| Hidden drawer bắt Tab/Escape phía sau authority gate | Bỏ root/controls aria-hidden/inert/visibility:hidden; browser authority-gate test PASS |
| UI harness vẫn dùng legacy ports/permission/query keys | Chuyển candidate fixture và purpose keys; direct submitOrderAndPrint sau revoke trả FORBIDDEN, order không đổi |

Run browser trung gian49PASS/3FAIL dùng nhầm ID manager để đăng nhập cashier; sửa helper sang cashier13, rerun3PASS đúng76e974c. Không cộng hai run này. Sau đó chạy riêng một run đóng băng `b01-b02-76e974c.log`: **52 PASS**, source76e974c. Audit cùng source đủ48/48 COMPLETE,19 nhóm finding (detector FAIL), R-UI xem ảnh và phân loại false positive; RI kiểm source/evidence/quyền/lifecycle, không tự phân loại ảnh audit. Không đổi baseline.

### Delta hash kiểm chứng — b2ecad0

PR11 head `b2ecad04294793c3884f1dfb192904dc72440709` chỉ sửa một trusted hash trong `ci/release-policy.json`, trỏ đúng byte của `tests/smoke/helpers.ts` đã được review tại76e974c. Hash mới `110b8b8327acf2198a324aea1adb292a4b84bab1cd45ae903359a9bce5a6577f`; cũ `b82ac51cd36395d757b8e2ce630558ec7ee0ac8922ca6b88e57e22a2e48c6ad5`. Helper vẫn đo geometry dương và fit hoặc overflow ngang có thật, không nới ngưỡng gate. R-UI và RI đều **APPROVE delta này**, tự đối chiếu đủ64 trusted files. Không đổi workflow, branch protection, baseline hoặc productionEnabled:false.

Hai run tự động40162525408(pull_request) và40162523116(push) ở76e974c FAIL vì hash trên còn trỏ bản main cũ; build/unit1198/tooling567PASS,1defer trước lỗi node-tools. Sau pushb2ecad0, GitHub tự tạo40163017450(pull_request) và40163012918(push); chưa dispatch/rerun thủ công. Kết quả cuối và merge ghi trong handoff, không suy ra check PASS từ local tests.

Docs checkpoint đã được cả hai reviewer đọc: diễn đạt đúng lệnh merge mới, CI tự kích hoạt so với thủ công, giữ backend/deploy holds và phân biệt evidence lịch sử. Docs cuối có kết quả merge/branch cleanup sẽ được review delta trước khi bàn giao hoàn tất. B03 chưa được duyệt trong biên bản B01/B02 này.

## B03 — candidate6f22106

Checkpoint này được bổ sung bởi detector678a9a8 và mergeB03 5b4d5a4 bên dưới; phần app của6f22106 không đổi.

Code `6f2210663cdde35952747ad1e1a2af45e1231be3`; tree `2db84c20cb0574f205cdd51e90f52b9cc7ca1294`. RI **APPROVE** phạm vi quyền/tiền/lifecycle; R-UI **APPROVE** code/UI đúng SHA này sau khi các finding đã đóng. Không thay core/features/adapters/SQL. Audit coverage/phân loại được ghi riêng, không biến approval code thành product/backend acceptance.

| Finding | Đóng bằng |
| --- | --- |
| RI-B03-1: receipt authority unavailable→verified dựng DOM mới nhưng focus hook giữ root cũ, Tab thoát/Escape không đóng | Hook rebind theo presence; giữ nguyên controller in/grant/eligibility. Regression cho cả tạm tính và hóa đơn ban đầu. RI tự kiểm844×390; R-UI568×320, mỗi loại hai chu kỳ, Tab/ShiftTab/Escape đúng. |
| Back mất tên truy cập khi CSS ẩn span ở≤760px | aria-label Quay lại, browser assertion và reviewer xác nhận. |

R-UI xem ảnh partial568×320/844×390/1920×1080: layout có cuộn, header/footer còn rõ, partial29k/received50k/change21k nhất quán; controls ở761×390 chạm được. Audit80aa5a đủ48/48 COMPLETE,19 nhóm floor giống B01/B02 đã xem đủ ba ảnh; không finding B03. Run này trước delta focus/name, không dùng làm bằng chứng source6f22106.

Build6f22106 PASS, unit1201/113files PASS, browser mục tiêu25PASS. Full audit6f22106 đủ48/48 COMPLETE,19 nhóm floor (6error/6warn/7info); detector FAIL, baseline giữ nguyên. Report/status/ảnh annotated tại snapshot `audit-6f22106/` trong evidence local; phân loại giống hai checkpoint trước. Các run23/24browser và1201unit trên source trước được giữ riêng, không cộng dồn vào run cuối. Không xác nhận fidelity/backend/live/phần cứng/zoom thật.

## Detector sau quyết định tiếp tục của chủ dự án

R-UI và RI đều **APPROVE `678a9a81febe641377f282708810cb4dea54fb98`**. Đúng ba file thay đổi: detector, demo-buggy negative controls, hai hash canonical của chúng trong policy. Hai reviewer tự kiểm64/64hashes; RI chạy Chromium so detector cũ/mới trên cùng fixture:25→23, chỉ bỏ hai hidden descendants,23 finding thực còn lại giữ nguyên. Selftest23findings/14rules/16controls và tooling23/policy2PASS. Baseline, ngưỡng, coverage, workflow, protection, productionEnabled:false giữ nguyên.

Full audit678a9a8 sau approval code:48/48 COMPLETE,13warning/infoFP,0error, exit0. Đây là kết quả mới, không viết lại các audit FAIL cũ. B03 merge5b4d5a4 chỉ nhận cùng delta detector/pins, không thay app; review xác minh ancestry/tree và audit cuối ghi riêng khi hoàn tất.

Cả hai reviewer **APPROVE B03 `5b4d5a44e4eb1b017ca17eb96d9703d4b94366b5`**: parents6f22106+678a9a8, đúng ba file delta đã duyệt, app tree không đổi. Audit5b4d5a4 đủ48/48 COMPLETE,13warning/infoFP,0error; R-UI xem đủ ba ảnh. StrictCI vẫn bác13unknown findings nên đây chưa là PASS CI.

Cả hai reviewer **APPROVE `da743bd8743701d8a08bc4f52e4b27202338547d`**: guard chính xác mẫu sr-only, chỉ trong hai luật clipping; không bỏ subtree hay control khỏi audit. Test Chromium mới có direct/nested sr-only negatives, horizontal/vertical real clipping và hai near-miss positives. RED trước sửa; GREEN24tooltests sau sửa, selftest vẫn23/14/16 và policy2PASS. RI tự chạy browser regression, R-UI đọc nguồn/đối chứng; cả hai tự đối chiếu64canonicalhashes. Chỉ pin audit.js đổi ở delta này. Không đổi baseline/ngưỡng/coverage/normalizer/workflow/protection/production hold. Full audit/CI mới cần kết quả riêng.

Cả hai reviewer **APPROVE B03 `7e75dd809b2c21baa9d5b4eaafd11c91bd1c0e86`**, tree `c2717098bb6a145c7a2da4b1d957ec9442ffa3bb`: parents5b4d5a4+da743bd và đúng ba file delta đã duyệt; application tree không đổi so6f22106. Sau approval delta, audit7e75dd8 hoàn tất48/48,0findings,sourcepreserved; gọi đúng strict `uiCounts` PASS48/0fail/0skip. Auditda743bd cũng48/48,0findings và strict normalizerPASS. Hai snapshot `audit-da743bd/`, `audit-7e75dd8/` chỉ có report/status mới: không sao chép ảnh floor cũ để giả làm ảnh lượt0finding. CI GitHub vẫn cần check riêng trên merge/source SHA hiện hành.

## Cặp đầu đã merge; delta B03 cuối

#11 main3cd7111 và #12 docs6196ed7 đã merge sau check bắt buộc. Cả hai reviewer **APPROVE0febe55158eca3d0f9cfdbeeab9ab02b80b92fe0**: parents7e75dd8+3cd7111, treec2717098 không đổi. Không nhận tree-equivalence là lần chạy test mới.

Cả hai reviewer **APPROVE `cf8e304869ad0e92c491736790f59bff1b6f9dcc`**, tree `395953d26e9702e307c49ed62a3a7773575be00d`:

- Bốn key applicability đổi line/title theo test B03 hiện hữu;37entries và project-scope giữ nguyên. Pin tương ứng cập nhật canonical bytes; cả hai tự kiểm64/64hashes.
- Eager-count nhân viên đổi sang poll cùng điều kiện>3; không nới acceptance hay thay số hàng mong đợi.
- Toast thông báo không bắt pointer event để tránh che primary action rồi pause vô hạn khi hover; status/live semantics,nội dung,thời lượng giữ nguyên. Tất cả call-site hiện là thông báo, không có toast CTA. R-UI tự kiểm touch/focus; RI kiểm không đổi quyền/payment/write/receipt.
- Regression dùng productionAppProviders, toast Infinity và action bị phủ: RED trước sửa, GREEN sau sửa ở568×320/844×390/1366×768; toast vẫn hiện sau click. Root đã xem ảnh RED; không force-click/ẩn overlay trong test.
- BuildPASS;1201unit/113filesPASS;26browserPASS;81smoke gồm44PASS/37skip. Hai reviewer tự đối chiếu normalizer trên cùng report: map cũ bị bác, map mới PASS81; không gọi failed69run làPASS. Auditcf8e304 sau review hoàn tất48/48 COMPLETE,0findings,source trước/sau giữ nguyên; strict `uiCounts` PASS48/0fail/0skip. RequiredCI GitHub vẫn cần kết quả riêng.
