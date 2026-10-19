# D7 — CI bộ đo và publish audit

Ngày19/10/2026, chủ dự án giao hoàn thiện CI và xuất bản ui-audit, kiểm kỹ rồi push/merge đúng hai nhánh; pilot màn thật là task riêng. [Spec/quyết định](../../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md) và [biên bản](../../implementation-log/ui-validation-ci-audit-2026-10-19.md) là nguồn status/evidence của slice này.

Code branch `workflow/ui-validation-ci` base mainfc7d454, [PR#9→main](https://github.com/nguyentronglinh045/pos-cafe/pull/9); docs branch `workflow/ui-validation-ci-docs` base docs81e1f99. Các worktree nguồn gốc có WIP giữ nguyên. Phạm vi: CI12phase với unit/calibration mới, publish detector/audit tương thích main, không đổi src/baseline/deploy.

Checkpoint: C9 đạt132script/100UItests và hai calibration; operational COMPLETE39/39, setup0, source/baselinepreserved. Có42nhóm findings, [đã phân loại đầy đủ](../../implementation-log/ui-audit-classification-2026-10-19.md); exit1 do6nhóm error mới, không nhận appPASS hoặc tự sửa UI. Đã sửa vòng Vite watcher/discovery qua fixture backlink; giữ dữ liệu, không xóa để qua test.

CI Linux C9/030 fail ui-tools; diagnostic hữu hạn xác định HTMLHTTP200/generatedwatch0/serverclosed1 nhưng chưa thấy appmodule trong snapshot. Candidate7f sửa probe tải JS app thực trước kiểm sourcewatch trong cùng2giây; fresh133script/100UItests/calibration PASS và operational39/39/setup0/sourcepreserved,42nhóm đã phân loại. PR CI7f SUCCESS nhưng pushattempt2 FAIL tại close3giây: sourcewatch đã đạt, closed0/timeoutOrdinal2. Không dùng PRPASS thay pushFAIL.

Candidate `b581afeb0e68da468b7d4b642778e905984ffa8d` thêm publicwaitForRequestsIdle trong phần còn lại của2giâyHTTP trước snapshot/teardown; không đổi assertions/optimizer/timeout/resource/privacy. Fresh133script/100UItests và11/23-14-16calibration PASS, hai reviewer APPROVE codeexactb581. Operationalb581 mới COMPLETE39/39/setup0/sourcepreserved,42nhóm/20mới/6newerror,19ảnh đã kiểm và classifier được cập nhật đúngsource/times; không appPASS hoặc đổibaseline. [Push CI39202240244](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202240244) và [PR CI39202244254](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202244254) đều SUCCESS đủ12phase.

PR#9 đã MERGED→main lúc05:07:39Z, mergeSHA `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`; exactheadguard, ancestry/tree/canonicalfiles đã readback khớp reviewedb581. [CI main39202923597](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202923597) đang chạy. Docs11Markdown đang chờ finalreview/push/merge riêng; không gom WIP gốc. Kết quả docsmerge/readback ghi tại PR sau thực thi; pilot màn thật vẫn task riêng.

Chủ dự án cho phép dọn20fixturetạm đã liệt kê; lệnh bị automatic approval review chặn “blocked by policy”, chưa xóa/thu hồi dung lượng và không thử bypass. Giữ report/ảnh cuối, dependencies và các fixture mới; [biên bản](../../implementation-log/ui-validation-ci-audit-2026-10-19.md#tài-nguyên-và-dọn-fixture) có scope/manifest.
