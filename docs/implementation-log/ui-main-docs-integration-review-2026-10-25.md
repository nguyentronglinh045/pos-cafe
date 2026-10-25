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

Run browser trung gian49PASS/3FAIL dùng nhầm ID manager để đăng nhập cashier; sửa helper sang cashier13, rerun3PASS đúng76e974c. Không cộng hai run thành một run52PASS. Run source đóng băng bổ sung và audit cuối ghi riêng tại handoff khi hoàn thành.

Docs checkpoint đã được cả hai reviewer đọc: diễn đạt đúng lệnh merge mới, CI tự kích hoạt so với thủ công, giữ backend/deploy holds và phân biệt evidence lịch sử. Docs cuối có kết quả merge/branch cleanup sẽ được review delta trước khi bàn giao hoàn tất. B03 chưa được duyệt trong biên bản B01/B02 này.
