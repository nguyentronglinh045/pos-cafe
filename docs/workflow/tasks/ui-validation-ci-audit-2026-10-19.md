# D7 — CI bộ đo và publish ui-audit

Ngày 19/10/2026, chủ dự án giao hoàn thiện CI, publish ui-audit, kiểm kỹ rồi push/merge code vào `main`, hồ sơ vào `docs`. Pilot màn Stitch thật là task riêng. [Spec/quyết định](../../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md) và [biên bản](../../implementation-log/ui-validation-ci-audit-2026-10-19.md) giữ hợp đồng, lịch sử chẩn đoán và bằng chứng chi tiết.

[PR #9](https://github.com/nguyentronglinh045/pos-cafe/pull/9) đã merge vào `main` lúc 05:07:39Z, commit `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. Tree sau merge khớp candidate đã review `b581afeb0e68da468b7d4b642778e905984ffa8d`; ancestry và ba canonical blobs đã xác minh. Hướng dẫn vận hành nằm trên code: [ui-remake](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/README.md), [ui-audit](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-audit/README.md).

Hai CI trước merge đều SUCCESS, đủ 12 phase: [push](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202240244), [PR](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202244254). Fresh local đạt 133 script tests, 100 UI tool tests và hai calibration (11 controls; audit 23 findings/14 lớp/16 controls), không fail/skip. [CI main sau merge](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202923597) cũng SUCCESS đủ 12 phase trên exact main2da0d7e; source preserved và fingerprint khớp hai lượt trước merge. Unit 637 PASS; tooling 1 manual-deferred và smoke 31 not-applicable giữ đúng profile, không tuyên bố đã kiểm backend/phân quyền đầy đủ.

Operational audit mới trên b581 COMPLETE 39/39, setup failures 0, source/baseline giữ nguyên. Có 42 nhóm findings, 20 nhóm mới gồm 6 nhóm error mới; đã kiểm 19 ảnh và [phân loại đầy đủ](../../implementation-log/ui-audit-classification-2026-10-19.md): 32 nhóm đo thật theo rule, 3 cảnh báo biên, 7 dương tính giả sr-only. Exit 1 phản ánh findings; không nhận thành app PASS hoặc nghiệm thu UI. Không sửa app, detector hoặc baseline.

Hai reviewer không phải tác giả đã APPROVE code b581 và docs `041a58c35c1e9751b64a4962fea69452477a1176` theo hai scope. [PR #10 → docs](https://github.com/nguyentronglinh045/pos-cafe/pull/10) chỉ chứa 11 file Markdown; metadata review/execution được ghi sau thực tế. Kết quả merge/readback docs cuối sẽ ở PR #10, gồm exact head/base, merge SHA, tree, ancestry và canonical files. Không tự nhận chính commit bàn giao này đã merge trước thực thi.

Hai worktree gốc có WIP/commit khác được giữ nguyên; chỉ xuất bản các branch `workflow/ui-validation-ci` và `workflow/ui-validation-ci-docs`. Không deploy hoặc làm việc với backend/DB thật. Các FAIL/cancel trong quá trình chẩn đoán vẫn giữ trong biên bản, không thay bằng PASS mới.

Chủ dự án cho phép dọn 20 fixture tạm đã liệt kê; automatic approval review chặn lệnh với lý do “blocked by policy” trước thực thi. Chưa xóa hoặc thu hồi dung lượng, không thử bypass; giữ report/ảnh, dependencies và fixture mới. [Biên bản tài nguyên](../../implementation-log/ui-validation-ci-audit-2026-10-19.md#tài-nguyên-và-dọn-fixture) có scope/manifest.

Việc tiếp theo: pilot remake một màn thật theo workflow trên main, chọn scope và duyệt reference riêng. Các findings UI hiện tại cần task riêng nếu muốn sửa; không chạy `ui-audit:update` khi chưa có quyết định của chủ dự án.
