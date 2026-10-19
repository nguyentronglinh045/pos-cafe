# Thực hiện

- [x] Khảo sát scope, chat Claude, palette hiện có và công cụ đo hiện tại.
- [x] Ghi D1–D4: bộ đo+push,568×320CSSpx,BeVietnamPro,A v1.
- [x] Tạo worktree code/docs sạch, xác định budget và phạm vi payload riêng.
- [x] Soạn workflow, template, chuẩn palette/font, spec/design/testplan/traceability.
- [x] Implement metrics/capture/config/runner, font local/OFL, positive/negative fixtures; không sửa UI app.
- [x] Chạy final candidate tests và CLI selftest, kiểm ảnh/bằng chứng/source/env, forward-test workflow.
- [x] Hai reviewer không phải tác giả APPROVE final candidate và đóng findings.
- [x] Commit/push riêng code/docs, tạo PR để nhóm dùng; đọc lại remoteSHA và link.
- [x] Lưu biên bản/handoff cùng lệnh tái hiện, giới hạn, review và trạng thái phát hành.

## Bổ sung theo D5–D6 ngày 19/10/2026

- [x] Chốt ngoại lệ tài liệu vận hành đi cùng code; ghi quyền merge PR#7→main, PR#8→docs sau kiểm kỹ.
- [x] Chuyển 4MD vận hành vào ui-remake; docs giữ con trỏ/spec/biên bản; cập nhật AGENTS/CLAUDE và mọi link đang dùng.
- [x] Kiểm lại source cuối: 76tests/selftest, link/anchor/schema/palette, help và không có bản gốc trùng.
- [x] Hai reviewer APPROVE candidate mới, đóng finding ownership cũ.
- [x] Push lại hai PR, đọc remote/checks/diff đúng HEAD; hai CI mới của code0479955 SUCCESS, docs không có CI riêng.
- [x] Merge PR#7 vào main theo D6; readback mergefc7d454, ancestry/tree và4file vận hành trên GitHub khớp candidate.
- Kết quả thực thi merge PR#8 và readback cuối của cả hai nhánh được ghi tại [metadata/biên bản hậu merge PR#8](https://github.com/nguyentronglinh045/pos-cafe/pull/8), theo recipe exacthead/base/tree/ancestry trong [biên bản](../../../docs/implementation-log/stitch-ui-workflow-2026-10-19.md). Không tự nhận bước chứa chính commit tài liệu này đã merge trước thực thi.

Không tự đổi gate hiện hữu, update baseline, deploy, DB write hoặc chấp nhận màn remake nào. Quyền merge chỉ cho đúng hai PR workflow này sau đủ kiểm chứng; không gom WIP khác.

## Slice D7 — CI và publish ui-audit, pilot để riêng

- [x] Khảo sát readiness, chọn ranh giới source main và ghi D7/SUI09–10/T17–23/traceability.
- [x] Thêm12phaseCI/strictUIcalibrationreader, fullChromiumchannel và channel-bound approval.
- [x] Publish audit portable13state×3vp; giữ detector/baseline lịch sử, siếtselftest23/14/16 và lifecycle/CLI/outputguards.
- [x] Freeze codeb581; đồng bộ19trusted policy hashes canonical; fresh133Node/100UItests và11/23-14-16calibration trên đúng candidate; xử lý CI7f closeFAIL bằng drain request trong deadline cũ.
- [x] Operational audit39target trên main/mock sourceb581 COMPLETE/setup0/sourcepreserved; đọc report/19ảnh/phân loại42nhóm/6newerror; không sửa app/updatebaseline.
- [x] Hai reviewer độc lập APPROVE codeb581/docs041 D7 theo hai scope, xử lý findings; metadata review ghi sau không đổi nội dung.
- [x] Push [PR#9→main](https://github.com/nguyentronglinh045/pos-cafe/pull/9) và [PR#10→docs](https://github.com/nguyentronglinh045/pos-cafe/pull/10), xác minh source/base/12phaseCI; code đã merge exactheadguard2da0d7e, readback tree/ancestry/canonicalfiles khớp.
- [x] CI39202923597 trên main2da0d7e sau merge SUCCESS đủ12phase/sourcepreserved; lưu kết quả/handoff và tài nguyên. Fixturecleanup đã được cho phép nhưng automaticreview chặn trước thực thi, không xóa.
- Kết quả merge/readback PR#10→docs được ghi tại [metadata hậu thực thi PR#10](https://github.com/nguyentronglinh045/pos-cafe/pull/10), gồm state/mergeSHA/tree/ancestry/files. Không tự nhận chính commit chứa checklist này đã merge trước thực thi.

Pilot Stitch→màn app thật, nghiệm thu UI thực và production vẫn ngoài D7. Audit command được chạy để kiểm vận hành công cụ; findings của app không tự mở quyền sửa hoặc chấp nhận chúng.
