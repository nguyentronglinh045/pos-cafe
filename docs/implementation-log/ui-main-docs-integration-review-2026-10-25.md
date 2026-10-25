# Review tích hợp UI — 25/10/2026

Phạm vi/quyền: [handoff](../workflow/tasks/ui-main-docs-integration-2026-10-25.md). Hai reviewer không tham gia sửa candidate; chỉ đọc và chạy kiểm mục tiêu, không deploy/backend.

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

Code `6f2210663cdde35952747ad1e1a2af45e1231be3`; tree `2db84c20cb0574f205cdd51e90f52b9cc7ca1294`. RI **APPROVE** phạm vi quyền/tiền/lifecycle; R-UI **APPROVE** code/UI đúng SHA này sau khi các finding đã đóng. Không thay core/features/adapters/SQL. Audit coverage/phân loại được ghi riêng, không biến approval code thành product/backend acceptance.

| Finding | Đóng bằng |
| --- | --- |
| RI-B03-1: receipt authority unavailable→verified dựng DOM mới nhưng focus hook giữ root cũ, Tab thoát/Escape không đóng | Hook rebind theo presence; giữ nguyên controller in/grant/eligibility. Regression cho cả tạm tính và hóa đơn ban đầu. RI tự kiểm844×390; R-UI568×320, mỗi loại hai chu kỳ, Tab/ShiftTab/Escape đúng. |
| Back mất tên truy cập khi CSS ẩn span ở≤760px | aria-label Quay lại, browser assertion và reviewer xác nhận. |

R-UI xem ảnh partial568×320/844×390/1920×1080: layout có cuộn, header/footer còn rõ, partial29k/received50k/change21k nhất quán; controls ở761×390 chạm được. Audit80aa5a đủ48/48 COMPLETE,19 nhóm floor giống B01/B02 đã xem đủ ba ảnh; không finding B03. Run này trước delta focus/name, không dùng làm bằng chứng source6f22106.

Build6f22106 PASS, unit1201/113files PASS, browser mục tiêu25PASS. Full audit6f22106 đủ48/48 COMPLETE,19 nhóm floor (6error/6warn/7info); detector FAIL, baseline giữ nguyên. Report/status/ảnh annotated tại snapshot `audit-6f22106/` trong evidence local; phân loại giống hai checkpoint trước. Các run23/24browser và1201unit trên source trước được giữ riêng, không cộng dồn vào run cuối. Không xác nhận fidelity/backend/live/phần cứng/zoom thật.
