# Tích hợp UI B01–B03 vào main và docs — 25/10/2026

## Quyền và phạm vi đang thực hiện

Chủ dự án giao trong chat kế hoạch ngày 25/10/2026: **“tạo cho tôi session mới xử lý phần merge UI vào main và docs. lưu ý: sau khi merge xong cần xóa nhánh đó đi để dễ quản lý. phần này ưu tiên merge và xử lý hậu quả sau merge, chưa cần ci lúc này”**. Chat thực hiện nhận trực tiếp bàn giao từ chat `01a1711a-d488-7832-baf8-560e04578494`.

Quyết định này thay giới hạn chỉ lập kế hoạch của NC-UI và giới hạn không merge của các biên bản tác giả ngày 22–24/10 **cho đúng #11/#12/#13/#14**. Không mở refactor toàn dự án, dọn worktree, deploy frontend, migration, live activation hay nghiệm thu backend đang hoãn. Không gửi comment/review GitHub để báo tiến độ. Review độc lập vẫn bắt buộc: `review_ui` (UI/nghiệp vụ/accessibility) và `review_integrity` (quyền/tiền/lifecycle/evidence), không sửa candidate.

CI không là việc chủ động trong lượt này: không dispatch/rerun, không đổi workflow/protection. Push/PR/merge có thể tự chạy POS light CI. Nếu protection chặn merge, phải báo blocker và xin quyết định tối thiểu; không bypass. Các workflow frontend-preview, frontend-release và backend chỉ có workflow_dispatch, giữ hold. Kiểm mock local phục vụ hòa giải không chứng minh backend hoặc toàn hệ thống PASS.

## Nguồn và bảo toàn

| Nguồn đầu lượt | SHA | Trạng thái xác minh |
| --- | --- | --- |
| origin/main | `0dd63ea81b27a38800044a55a7f9c8f12f87cad0` | protection bắt buộc `Build, unit, tooling and mock UI` |
| origin/docs | `4125687a289f41e45bbc9924b2ae3709dbafbca1` | không protected |
| #11 → main | `bbd5be763196b12db45281d6314e2e835cdc0785` | Draft, conflict; 59 files |
| #12 → docs | `f6d54d182c42f0c13eb832b6411affefbd4c9f03` | Draft; 269 files, bao gồm evidence lịch sử |
| #13 → nhánh #11 | `a2a619a1144c71e1a73f6328071c422e5750cc2e` | Draft; 32 files; chờ #11 rồi retarget main |
| #14 → docs | `59a9d8cb0dcaae6eda3463977df5bb6ca013d0fc` | Draft; 19 files |

Không thay WIP tại `D:/Workspace/pos-cafe` (main@5156820) hoặc `D:/Workspace/pos-cafe-docs` (docs@0fe967d). Checkout code sạch được tận dụng: `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, trước thao tác ở a028cc5, tree `12e8e64bd3df60ee3b1be55ec42f3cd5de35b746` bằng origin/main. Nhánh cũ vẫn giữ; checkout chuyển sang nhánh nguồn #11. Docs làm tại `D:/Workspace/pos-cafe-ui-integration-docs-20261025`, không đè checkout docs đang bẩn. Bản kế hoạch chuẩn hóa được đưa từ file WIP đã được giao đọc vào checkout docs này; không gom các WIP khác.

C đầu lượt trống 192.107.458.560 bytes; D 99.045.609.472 bytes. Dùng node_modules/browser sẵn có; không cài/tải SDK/runtime/package, không WSL/Docker. Checkout docs và reference/test output dự kiến dưới 1 GB, vẫn áp dụng trần task 20 GiB và giữ 30 GiB trống trên C/D. Không xóa temp/worktree nếu chưa được phép.

## Hòa giải và kiểm tra

B01/B02 đã hòa giải 8 file conflict: playwright config; OrderCartPane, OrderDrawer, OrderMenuPane; FloorWorkspace + test; LeftNav + test. Giữ theme/bố cục B01/B02 và ghép các bảo vệ quyền từ main, không đổi backend/migrations/financial protocol. Code merge candidate `76e974c5ff52c65baee5e15b4fc8d096801dc2b0`; PR11 head `b2ecad04294793c3884f1dfb192904dc72440709` bổ sung đúng một trusted hash cho smoke helper đã review.

Các finding B01/B02 đã đóng: display query dùng purpose display thay settings.manage; giữ pay-only routing cho bàn và thẻ đơn; bỏ response mở bàn sau session/permission change hoặc refetch error; CSS portrait không lấn hướng dẫn xoay; keyboard focus bỏ qua drawer bị authority gate ẩn. Harness UI chuyển sang candidate permission runtime, query keys hiện hành; hidden action và unavailable-menu filtering theo contract main, không phục hồi hành vi legacy để làm test xanh.

Build PASS; unit1198/112files PASS; một run browser52PASS trên source76e974c. Audit48/48 COMPLETE nhưng detector FAIL ở19 nhóm floor:6 error zero-size/empty-icon thuộc panel đóng display:none và13 warning/info clipping thuộc nhãn/duplicate visually-hidden. Cả hai reviewer đã xem ba ảnh annotated và phân loại false positive; không cập nhật baseline. [Review độc lập và delta hash](../../implementation-log/ui-main-docs-integration-review-2026-10-25.md).

Hai run GitHub tự động40162525408/40162523116 ở76e974c FAIL vì trusted hash smoke helper cũ. Delta b2ecad0 đã được cả hai reviewer APPROVE;40163017450(pull_request)/40163012918(push) là run tự kích hoạt sau push, đang chờ kết quả ở checkpoint này. Không dispatch/rerun thủ công. Chưa merge PR11, chưa retarget PR13, chưa xóa source branch.

Log local tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/code/artifacts/ui-integration-20261025/`. B01/B02 evidence đóng băng: `b01-b02-76e974c.log`, `b01-b02-unit-final.log`, `b01-b02-build-final.log`, `audit-76e974c/`. Source/evidence cuối của B03, merge SHA và kết quả review sẽ ghi ở checkpoint cuối; các lần test trung gian không được gộp thành PASS candidate cuối.

Số 642/645 unit, 149/186 browser, fidelity ngày 22–24/10 và audit trong #12/#14 chỉ là lịch sử gắn source/ngày của tác giả. Hardware/tablet/phone thật, printer, browser zoom thật và Supabase/backend thật chưa kiểm trong lượt tích hợp. Không nâng trạng thái này thành đã nghiệm thu/phát hành sau merge.

## Dependency và tiếp tục

NC-UI đang thực hiện theo thứ tự #11+#12 rồi #13+#14. NC-00 chỉ chốt nguồn/bảo toàn cho phạm vi UI; NC-10 cập nhật theo từng cặp. NC-01 CI diagnosis chưa tự đóng bằng test mock local; NC-02/03 phải rebind theo main cuối. NC-04…08/11 và các backend hold chưa được mở. Sau merge, xóa đúng remote source branches và local source branches khi merged/reachable, không checked out, không WIP/commit riêng; không xóa thư mục để ép xóa branch.

Walkthrough code/test: chưa thực hiện cùng chủ dự án; bàn giao sẽ chỉ các điểm đọc chính, không coi đã được người dùng nghiệm thu.
