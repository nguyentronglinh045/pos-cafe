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

### Quyết định tiếp tục sau blocker

Chủ dự án đã trả lời rõ trong chat: **“Sửa bộ đo rồi tiếp tục merge”**. Quyền bổ sung chỉ xử lý đúng lỗi báo nhầm, giữ baseline/ngưỡng/coverage/protection. Commit B01/B02 `678a9a81febe641377f282708810cb4dea54fb98` thêm hai guard `getClientRects().length` trong detector và negative controls dưới cha display:none; cập nhật đúng hai trusted hashes tương ứng. Selftest trước sửa25FAIL→sau sửa23PASS, đủ14rules/16controls; zero-size/icon thật vẫn bị phát hiện. Audit tooling23tests và policy2tests PASS; cả R-UI/RI tự đối chiếu64pins và APPROVE đúng SHA.

Audit trên678a9a8: **48/48 COMPLETE,0error,6warn+7info, exit0**.13 nhóm clipping floor còn lại là nhãn/duplicate cố ý visually-hidden, không xóa khỏi report/baseline. Snapshot `audit-678a9a8/`; không biến gate PASS thành nghiệm thu toàn hệ thống. Push tự tạo CI40164221288(pull_request)/40164218948(push); chờ check bắt buộc. Nhánh B03 nhận đúng cùng ba file ở merge commit `5b4d5a44e4eb1b017ca17eb96d9703d4b94366b5`, không đổi app so6f22106; audit B03 source5b4d5a4 đang chạy. Các đoạn blocker/FAIL dưới đây là lịch sử trước quyền bổ sung, không phải trạng thái đã bỏ việc merge.

B01/B02 đã hòa giải 8 file conflict: playwright config; OrderCartPane, OrderDrawer, OrderMenuPane; FloorWorkspace + test; LeftNav + test. Giữ theme/bố cục B01/B02 và ghép các bảo vệ quyền từ main, không đổi backend/migrations/financial protocol. Code merge candidate `76e974c5ff52c65baee5e15b4fc8d096801dc2b0`; PR11 head `b2ecad04294793c3884f1dfb192904dc72440709` bổ sung đúng một trusted hash cho smoke helper đã review.

Các finding B01/B02 đã đóng: display query dùng purpose display thay settings.manage; giữ pay-only routing cho bàn và thẻ đơn; bỏ response mở bàn sau session/permission change hoặc refetch error; CSS portrait không lấn hướng dẫn xoay; keyboard focus bỏ qua drawer bị authority gate ẩn. Harness UI chuyển sang candidate permission runtime, query keys hiện hành; hidden action và unavailable-menu filtering theo contract main, không phục hồi hành vi legacy để làm test xanh.

Build PASS; unit1198/112files PASS; một run browser52PASS trên source76e974c. Audit48/48 COMPLETE nhưng detector FAIL ở19 nhóm floor:6 error zero-size/empty-icon thuộc panel đóng display:none và13 warning/info clipping thuộc nhãn/duplicate visually-hidden. R-UI đã xem ba ảnh annotated và phân loại false positive; RI review source/evidence/quyền/lifecycle, không nhận là đã tự xem ảnh audit. Không cập nhật baseline. [Review độc lập và delta hash](../../implementation-log/ui-main-docs-integration-review-2026-10-25.md).

Hai run GitHub tự động40162525408/40162523116 ở76e974c FAIL vì trusted hash smoke helper cũ. Delta b2ecad0 đã được cả hai reviewer APPROVE. Run tự động [40163017450](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40163017450) sau push b2ecad0 **FAIL tại ui-audit**; build/unit/tooling/node-tools/smoke đều PASS (smoke44PASS/37skip theo applicability). Run pull_request dùng synthetic merge source `6e9b6acf4fe0371e239aae7b84c143e3c05822ba`, prHead b2ecad0; không gọi đây là local run6f22106. Public diagnostic chỉ có COMMAND_FAILED/REPORT_MISSING/RESULT_INVALID, không xuất raw findings, nên chưa khẳng định sáu lỗi local là toàn bộ nguyên nhân CI. Run push40163012918 và PR13 auto runs40163670416/40163668896 kiểm trạng thái riêng, không suy ra PASS.

Lệnh merge bình thường `gh pr merge 11 --repo nguyentronglinh045/pos-cafe --merge --match-head-commit b2ecad04294793c3884f1dfb192904dc72440709` bị từ chối: **the base branch policy prohibits the merge**. Không dùng --admin/--auto, không đổi protection/workflow/baseline, không dispatch/rerun thủ công. Chưa merge PR11/12/13/14, chưa retarget PR13, chưa xóa source branch; companion docs giữ chờ đúng thứ tự code→docs.

Blocker chuyển cho chủ dự án: tiếp tục sửa đúng false-positive detector trong phạm vi hậu quả merge hay giữ PR để xử lý CI ở lượt khác theo ưu tiên ban đầu. R-UI đã kiểm read-only đề xuất guard `getClientRects().length` trước hai vòng interactive/icon: phần tử không render do cha display:none bị loại, phần tử thực0-size vẫn được phát hiện; selftest23 và effective-target controls không giảm. Đây mới là đề xuất, chưa sửa detector/fixture/pins, chưa coi CI đã hết lỗi.

Log local tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/code/artifacts/ui-integration-20261025/`. B01/B02 evidence đóng băng: `b01-b02-76e974c.log`, `b01-b02-unit-final.log`, `b01-b02-build-final.log`, `audit-76e974c/`. Source/evidence cuối của B03, merge SHA và kết quả review sẽ ghi ở checkpoint cuối; các lần test trung gian không được gộp thành PASS candidate cuối.

Số 642/645 unit, 149/186 browser, fidelity ngày 22–24/10 và audit trong #12/#14 chỉ là lịch sử gắn source/ngày của tác giả. Hardware/tablet/phone thật, printer, browser zoom thật và Supabase/backend thật chưa kiểm trong lượt tích hợp. Không nâng trạng thái này thành đã nghiệm thu/phát hành sau merge.

### B03 — checkpoint tích hợp

Candidate `6f2210663cdde35952747ad1e1a2af45e1231be3`, tree `2db84c20cb0574f205cdd51e90f52b9cc7ca1294`, gồm B03 gốc, B01/B02 đã hòa giải và hash kiểm chứng b2ecad0. Sáu conflict đã giải: ReceiptPreview, PaymentDrawer, PaymentSummaryPane, paymentShared, instantPay.test, useAppStore. Giữ initial receipt grant, ReceiptPrintClick, payment.take, kiểm session/lifetime, payload/K và selection/full/split hiện hành; không thay core/features/adapters/SQL.

Hai reviewer phát hiện RI-B03-1 tại candidate80aa5a: authority unavailable→verified làm receipt portal dựng DOM mới nhưng hook bàn phím giữ DOM cũ. Bản6f22106 bind hook lại theo presence, không đổi print controller; thêm tên truy cập Quay lại khi nhãn bị ẩn ở màn hẹp. Regression kiểm cả phiếu tạm tính và hóa đơn ban đầu qua gate→restore→Tab/Escape; reviewer độc lập tái hiện hết lỗi.

| Source | Kiểm | Kết quả, giới hạn |
| --- | --- | --- |
| 6f22106 | build; unit | PASS;1201 tests/113files PASS |
| 6f22106 | B03 + integration browser mục tiêu |25PASS, gồm568×320/844×390/1920×1080, full/split, state/error/offline/recovery và focus |
| 80aa5a (trước delta focus/name) | phone-landscape smoke |9PASS/7scope-skip hiện hữu; không gọi đây là run6f22106 |
| 80aa5a | trusted policy tests |2PASS, đủ64 trusted-file bindings; không nới gate |
| 80aa5a | audit48/48 |COMPLETE,19FP floor, không finding B03; đây là source trước delta focus/name |
| 6f22106 | audit48/48 |COMPLETE,19 nhóm floor:4zero-size+2empty-icon error,6clipped-text warn,7clipped-text-vertical info; detector FAIL, phân loại FP sau xem ảnh; baseline giữ nguyên |

Log có prefix `b03-6f22106-` và `b03-80aa5a-` trong thư mục evidence local ở trên; audit cuối tại `audit-6f22106/` với report/status/ba ảnh annotated. Cả hai reviewer APPROVE code6f22106 trong phạm vi UI/quyền/tiền/lifecycle; branch13 đã push source này, base vẫn nhánh11 chờ merge. Build có cảnh báo bundle lớn hơn500kB; chưa mở tối ưu bundle trong phạm vi merge này. Trạng thái mergePR13/14 và cleanup ghi sau khi check/merge hoàn tất.

### Recipe local của checkpoint

Môi trường Windows/PowerShell, Node và node_modules/browser đã có sẵn trong code checkout; không cài gói. Build/unit/audit chạy ở `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`. Audit tự mở/đóng mock server5178; Vite5191 phục vụ browser fixture cũng đã dừng sau kiểm. Evidence lần mới phải chọn output directory mới.

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run ui-audit:selftest
npm.cmd run ui-audit
# Trong tiến trình riêng cho browser fixture, dừng khi xong:
$env:VITE_DATA_MODE='mock'; $env:VITE_SUPABASE_URL=''; $env:VITE_SUPABASE_ANON_KEY=''
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5191 --strictPort
# Browser (tiến trình khác, source6f22106):
$env:WEEK03_EVIDENCE_DIR='artifacts/ui-integration-20261025/<ten-run-moi>'
node node_modules/@playwright/test/cli.js test -c playwright.week03.config.ts --project=B03 --project=integration -g '568x320|844x390|1920x1080|state |keyboard focus|money input|offline|full success|journey|software keyboard|authority gate|authority recovery' --workers=2
```

Recipe smoke source80aa5a: `node node_modules/@playwright/test/cli.js test --project=phone-landscape --workers=2`. Recipe policy source80aa5a: `node --test scripts/permission-full-target-policy.test.mjs`. Không có WSL/Docker/DB clone local, không deploy/migration. Dung lượng checkpoint25/10: C còn191.821.479.936 bytes, D98.885.505.024 bytes; artifacts lượt tích hợp khoảng8,1MB và reference tách khoảng5,2MB (kích thước file logic, chưa đo allocated riêng). Giữ evidence cuối; không tự xóa worktree hoặc temp.

## Dependency và tiếp tục

NC-UI đang thực hiện theo thứ tự #11+#12 rồi #13+#14. NC-00 chỉ chốt nguồn/bảo toàn cho phạm vi UI; NC-10 cập nhật theo từng cặp. NC-01 CI diagnosis chưa tự đóng bằng test mock local; NC-02/03 phải rebind theo main cuối. NC-04…08/11 và các backend hold chưa được mở. Sau merge, xóa đúng remote source branches và local source branches khi merged/reachable, không checked out, không WIP/commit riêng; không xóa thư mục để ép xóa branch.

Walkthrough code/test: chưa thực hiện cùng chủ dự án; bàn giao sẽ chỉ các điểm đọc chính, không coi đã được người dùng nghiệm thu.

Điểm đọc cho walkthrough trên source6f22106:

- [FloorWorkspace: routing theo quyền và response lifetime](https://github.com/nguyentronglinh045/pos-cafe/blob/6f2210663cdde35952747ad1e1a2af45e1231be3/src/app/shell/FloorWorkspace.tsx#L64).
- [PaymentDrawer: capture lifetime và initial receipt grant](https://github.com/nguyentronglinh045/pos-cafe/blob/6f2210663cdde35952747ad1e1a2af45e1231be3/src/app/drawers/pos/PaymentDrawer.tsx#L176).
- [ReceiptPreview: presence, eligibility và print controller](https://github.com/nguyentronglinh045/pos-cafe/blob/6f2210663cdde35952747ad1e1a2af45e1231be3/src/app/components/ReceiptPreview.tsx#L278).
- Browser regression: `tests/ui-remake/b03/payment.spec.ts`; luồng liên màn: `tests/ui-remake/integration/journey.spec.ts`. Lệnh ở log/evidence được chạy với mock, không là kịch bản nghiệm thu backend.
