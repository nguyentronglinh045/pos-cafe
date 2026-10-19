# D7 — CI bộ đo và publish audit

Ngày19/10/2026, chủ dự án giao hoàn thiện CI và xuất bản ui-audit, kiểm kỹ rồi push/merge đúng hai nhánh; pilot màn thật là task riêng. [Spec/quyết định](../../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md) và [biên bản](../../implementation-log/ui-validation-ci-audit-2026-10-19.md) là nguồn status/evidence của slice này.

Code branch `workflow/ui-validation-ci` base mainfc7d454, [PR#9→main](https://github.com/nguyentronglinh045/pos-cafe/pull/9); docs branch `workflow/ui-validation-ci-docs` base docs81e1f99. Các worktree nguồn gốc có WIP giữ nguyên. Phạm vi: CI12phase với unit/calibration mới, publish detector/audit tương thích main, không đổi src/baseline/deploy.

Checkpoint: C9 đạt132script/100UItests và hai calibration; operational COMPLETE39/39, setup0, source/baselinepreserved. Có42nhóm findings, [đã phân loại đầy đủ](../../implementation-log/ui-audit-classification-2026-10-19.md); exit1 do6nhóm error mới, không nhận appPASS hoặc tự sửa UI. Đã sửa vòng Vite watcher/discovery qua fixture backlink; giữ dữ liệu, không xóa để qua test.

CI Linux C9/030 fail ui-tools; diagnostic hữu hạn xác định HTMLHTTP200/generatedwatch0/serverclosed1 nhưng chưa thấy appmodule trong snapshot. Candidate cuối `7f51a4f2ce2c034c70969c938c5272aa7a630e6a` sửa probe tải JS app thực trước kiểm sourcewatch trong cùng2giây; không nới assertion/timeout/resource/privacy. Fresh133script/100UItests và11/23-14-16calibration PASS; operational7f chạy mới COMPLETE39/39/setup0/sourcepreserved, cùng42nhóm đã phân loại. Hai reviewer APPROVE code7f và nội dung classifier source7f.

[PR CI39201005242](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39201005242) SUCCESS đủ12phase. Pushcheck cùng tên trước đó đã hủy vẫn bị GitHub strict protection tính là chặn; đang rerun `39201000345` attempt2, không bypass policy. Chưa merge code/docs trước đủ hai check và review docs. Kết quả merge/readback sẽ ghi sau thực thi; pilot màn thật vẫn task riêng.
