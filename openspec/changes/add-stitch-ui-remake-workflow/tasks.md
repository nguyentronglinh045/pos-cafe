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
