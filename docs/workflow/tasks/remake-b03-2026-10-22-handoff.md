# B03 — Bàn giao remake màn thanh toán

Ngày22/10/2026. Đã hiện thực và kiểm chứng local trên hai nhánh riêng; chưa commit/push/mở PR, merge hoặc deploy.

## Mở demo

- Ứng dụng thật ở http://127.0.0.1:5183/ . Ghép quán mẫu0001-X8F3QA, chọn quản lý và PIN123456 nếu chưa đăng nhập; mở bànB02→Thanh toán. Đây là dữ liệu mock.
- Reference độc lập đã duyệt: http://127.0.0.1:4177/v3/normalized.html?state=change .

Demo B01/B02 đang có được giữ nguyên. Server đối chiếu main gốc5179 đã dừng; các browser/gate do runner tạo đã đóng. App5183/reference4177 được giữ cho chủ dự án xem. Không có cài đặt/download/cleanup; base-main.tar và các WIP khác được giữ.

## Kết quả trên cùng source

| Gate | Kết quả |
| --- | --- |
| TypeScript/Vite build | PASS; chỉ có cảnh báo chunk lớn |
| Unit/component |643đạt,67files,0skip/0fail |
| Tool tests / selftest / calibration |79 /11 /29 đạt đúng kỳ vọng |
| Fidelity |3state FHD đạt,0pixel khác sau channel16,geometry0px |
| Responsive |37tests đạt;20viewport×3state và145lượt sweep,0skip/fail/flaky |
| Mock smoke |35đạt/31skip theo phạm vi project/0fail/0flaky |
| UI audit |Selftest23/14/16đạt; app39/39complete,exit1:29nhóm/51occurrences ngoàiB03 |
| Review cuối |R1 vàR2 APPROVE đúng source/package |

22nhóm audit là lỗi thật ngoàiB03,7nhóm false positive do sr-only. Cả7key chưa có baseline đã tái hiện trên main gốc, không phải căn cứ kết luận hồi quy B03. Không có finding payment trong ma trận audit đã chạy; không tuyên bố toàn app sạch. Danh sách đầy đủ có state/selector/đo/ảnh và lý do ở audit-classification.md/json của gói. Baseline chưa cập nhật.

## Nhánh, bằng chứng và PR nháp

- Code: ui/remake-b03-20261022, base main2da0d7e10d65ed4e79c8628d65220582a6cbd32b; source`058995f4d5de99c1b48cba541293b1f0e39d9a534c645e4fa1d482b4870b23af`.
- Docs: ui-remake-b03-docs-20261022, base docs4125687a289f41e45bbc9924b2ae3709dbafbca1.
- Remote đã xác minh ở intake:https://github.com/nguyentronglinh045/pos-cafe.git .
- Package: artifacts/ui-remake/b03-implementation-review, manifest`a68b5a24406e0adcf876855073e7404160882d14312d66c4b7d1e5a01312392e`;284records, snapshot592filecode/451filedocs. Các bản docs trong base package là lúc khóa trước review cuối; closure addendum chứa kết luận review và trạng thái checklist/PR nháp sau review, không thay mã nguồn hoặc hợp đồng đo.
- Closure: artifacts/ui-remake/b03-final-closure; archive cuối chứa cả base package và closure.
- PR nháp:[code→main](remake-b03-2026-10-22-pr-main.md) và[spec/biên bản→docs](remake-b03-2026-10-22-pr-docs.md). Chưa tự gán Git identity: user.name/email chưa cấu hình; chưa có xác thực GitHub được kiểm chứng trong task.

Giữ nghiệp vụ, payload, quyền và dữ liệu; đổi UI hóa đơn/thu tiền, semantic theme/font, cuộn/focus/receipt presentation. Review chi tiết ở [review cuối](remake-b03-2026-10-22-review-final.md), [validation](remake-b03-2026-10-22-validation.md) và [audit](remake-b03-2026-10-22-audit.md). Hướng dẫn vận hành canonical ở nhánh main:ui-remake/tasks/b03/README.md.

## Giới hạn còn lại

CSS zoom200% và VisualViewport chỉ mô phỏng. Browser zoom thực, bàn phím/thiết bị vật lý, Supabase production/RLS và máy in native chưa kiểm. Các test mock không chứng minh backend production. Chủ dự án đã duyệt normalized reference và bước capture; chưa nghiệm thu UI ứng dụng. Merge/deploy cần được giao riêng.
