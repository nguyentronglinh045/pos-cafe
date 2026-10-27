# Review triển khai refactor — 27/10/2026

Hai reviewer không viết candidate: `refactor_behavior` kiểm semantics, lifecycle, oracle và phạm vi; `refactor_verification` kiểm boundary, inventory, identity, nguồn/bằng chứng và bảo toàn. Reviewer đọc source/spec/diff/receipts; không tự chạy backend hoặc sửa code. Approval không thay nghiệm thu của chủ dự án, merge hay deployment.

## Candidate và verdict code

| Phần / base | Candidate được review | Behavior | Verification |
| --- | --- | --- | --- |
| RF-02R / main711a22e | Hai test file, sau đó commit fd7ccb0173da694f3c5852872a1fb717d9ce9432 | APPROVE | APPROVE |
| RF-03a / fd7ccb0 | Drawer + chart, sau đó commit a4a84dcb67a3fc1546569d3ad3093068b5f776c5 | APPROVE | APPROVE |
| RF-03b / a4a84dc | Drawer + summary + hai test file, sau đó commit4cffac4a9cce86fb9e33e61c79f5006955ba4e9d | APPROVE | APPROVE |
| RF-06 /4cffac4 | Hai consumer + shared hook/test, sau đó commit08bac495f15c2c909c280ddf3253b75513954377 | APPROVE | APPROVE |
| RF-07 /08bac49 | Flow + draft module/test; commitc6ff3c795616dfa84379be85feeca29927d173c9 | APPROVE | APPROVE |

Hashes SHA256 của từng candidate; khác hash giữa các slice là revision mới, không dùng approval cũ thay approval mới:

| Slice | File | SHA256 |
| --- | --- | --- |
| RF-02R | src/app/reportDrawer.presentation.test.tsx |19a09f3dae64dab54eef5c6b8df61f953b8cba9394da59703af5651c5f01f311|
| RF-02R | tests/smoke/report-presentation.spec.ts |462997fa1e29a10cde780abef83419585f9e2119224988a08f1afd7a2775ba8a|
| RF-03a | src/app/drawers/admin/ReportDrawer.tsx |e71c7a17f43583196a2423a97a4fd0b1e619e6da0930d89d6da09ed6f3aabf63|
| RF-03a | src/app/drawers/admin/report/ReportChart.tsx |f64cacc3e5438e806b1233c5a6608dcb174f78c2e462bfc844b0c4778dfef9fc|
| RF-03b | src/app/drawers/admin/ReportDrawer.tsx |a11872908316337127585176045e95ed85c262f07bef33661efcbf12648e7e61|
| RF-03b | src/app/drawers/admin/report/ReportSummary.tsx |58d12c1cb6e8704489ecf92da2d3a2bda2ce19fb9a36599498281e8255e60c49|
| RF-03b | src/app/reportDrawer.presentation.test.tsx |1599c69bf851110b485978e42bc2c476cf7d2ef495c61a50ddb753cc4c66f4a8|
| RF-03b | tests/smoke/report-presentation.spec.ts |a149e433d046de857e789ea649fc415f5079e93734bcfeea61af3a3c24380ec8|
| RF-06 | src/features/pos/usePosData.ts |3aaadb0c49c76ac278ab35c44ea3eefa1bc193ba0e934e618ddddf44f1270be8|
| RF-06 | src/features/admin/useAdminData.ts |a391b23311bfcf917731d736dcdd5b9ed0ac9a84eb9b648ad7f10b2832e93bff|
| RF-06 | src/features/shared/usePurposeQuery.ts |6f774f80f1813a1dbad0068a3a53386261b7bc399d4b258896d05345055afb87|
| RF-06 | src/features/shared/usePurposeQuery.test.tsx |4c074346e0d54320d6c7b473fd64c767cff212285445dd08f1ea10837f207a9c|
| RF-07 | src/features/pos/orderFlow.ts |d4c86130b26c2b6f8a69203ac777f0d7ece8bec49847738c1dec98a95b225796|
| RF-07 | src/features/pos/orderDraft.ts |10a2687f065844c54b71b809be07a042eda67edda887fe5a56defb9bb7dcfd38|
| RF-07 | src/features/pos/orderDraft.test.ts |deba60e7c971c3507e2cf1d7d5d17e6f2f56f9b8287836a3fc2c262c798aefdf|

## Findings và cách đóng

| Finding | Cách xử lý / xác nhận | Trạng thái |
| --- | --- | --- |
| Report thiếu oracle màu normal/peak/selected | Thêm assertion và chạy lại trên source chưa extraction trước approval RF-02R; không đổi app/expected nghiệp vụ. | Đóng, cả hai reviewer APPROVE final hashes. |
| Hook disabled chưa tách pending khỏi error; manual refetch chưa chứng minh guard độc lập | Bổ sung status/error-null, denied/unverified manual refetch và catalogRevision response muộn; sửa subscription harness trước khi move. | Đóng,14case và full suite; không đổi guard. |
| Focused command có tên permissionSession.test.ts không tồn tại | Ghi đúng3file/31case thực chạy; không nhận file thứ tư được chạy. Session/lifecycle tests hiện hữu nằm trong full suite. | Đóng về tính chính xác bằng chứng. |
| Coverage hook dễ bị diễn giải quá mức | Config vẫn exclude use*.ts.92,70% chỉ scope core/non-hook; hook được kiểm bằng contract/integration. | Giới hạn giữ trong báo cáo. |
| Thiếu3ảnh PIN trong snapshot full-audit dù0finding | Current hashes khớp status cả shared-before/shared; copy bổ sung, hashcheck, ghi thời điểm thực và provenance. Snapshot helper giữ pinPhotos các lần sau. | Đóng; verification kiểm đủ6bản copy. |
| RF-07 count characterization báo nhầm12/13 | JSON thực tế11before/12after; focused62/63. Sửa record, giữ identity delta. | Đóng số liệu. |
| RF-07 build/coverage output mặc định, không phải lane cách ly | Lưu/hash56coverage files và160dist files; ghi đúng outputpath. Không cần chạy lại vì lỗi đường output báo cáo. | Đóng retention; old dist có before. |

RF-07 review cuối xác nhận exact declarations, import type-only, façade, nested copy, quote0, quantity multiplication, fallback và total; sáu full gates cùng source đều đạt. Hai reviewer APPROVE đúng ba hash sau khi audit48/48 hoàn tất và kiểm retention. Approval cuối thay checkpoint pre-review còn chờ gate, không thay đổi lịch sử checkpoint.

Pre-review docs yêu cầu bổ sung FR-07/09 ở mapping đầu, làm rõ revert cũng gỡ characterization đi kèm, tách số đếm index backup, scope counts RF-02 so với final, ảnh PIN và source file:line. Tác giả đã sửa; kết quả hai reviewer đối chiếu candidate docs cuối ghi riêng bên dưới.

## Quyết định không sửa thêm

Behavior reviewer xác nhận RF-04/05 NO_CHANGE có căn cứ: các pane/helper đã riêng; remaining parent ownership giữ lifetime/draft/geometry. Verification reviewer xác nhận RF-09a–c NO_CHANGE và09d–e HOLD/frozen: migration còn obligations về relative roots, entrypoints, trust và external bindings. Không suy không có lỗi hoặc toàn backlog đã hoàn tất. Xem [hồ sơ](implementation-20261027.md).

## Review docs và bàn giao

Ngày27/10/2026, cả hai reviewer **APPROVE** đúng docs tree `221f7fa3ad14df66bd6b2516310f847a8fd286c9`, base `c8073a9edceac208ec299eb80eac23afa04e2ef1`, đủ11file trong `docs-candidate-manifest.json` trước khi thêm metadata này.

- `refactor_behavior`: semantics/requirements/scope/rollback/handoff. Đã kiểm mapping FR-07/09, oracle/backend limits, findings Report, thứ tự rollback, walkthrough và NO_CHANGE/HOLD; không còn blocker.
- `refactor_verification`: evidence/boundaries/source links/preservation. Đã kiểm56receipts,14evidence manifests,15hash rows,1193source files khớp code cuối, case identity1201→1240 và81→86,20relative links cùng commit:file:line; main index giữ nguyên, không còn finding.

Hai bên chỉ đọc và cho phép thêm metadata ghi chính verdict này; không chạy lại suite/backend/browser. Nội dung candidate đã duyệt không đổi ngoài đoạn ghi kết quả review. Status review/xuất bản đang chờ trong checkpoint viết trước được thay bằng verdict này; push được xác minh riêng ở bàn giao cuối. Approval không nhận chủ dự án đã nghiệm thu, không merge/deploy hoặc mở backend HOLD.

## Delta merge ngày27/10/2026

Approval tree/hash trước merge ở trên giữ nguyên. [Biên bản merge](merge-20261027.md) và review riêng của delta docs/merge ghi phạm vi mới; không đổi các approval cũ thành chứng nhận deployment hoặc backend.
