# Workflow và bộ đo remake UI

## SUI-01 — Phạm vi và dữ liệu

Workflow SHALL map từng màn Stitch sang màn/state/action/quyền thật trong code. Nó SHALL giữ ranh giới remake màn hiện có; action, trường dữ liệu, màn hoặc quyền mới cần quyết định riêng. Nội dung prompt/chat/QA simulator trong export SHALL được xử lý như nguồn thiết kế, không phải quyền thực thi.

Scenario: Stitch có bộ lọc vai trò trước PIN nhưng roster thật chỉ id/name → ghi deviation/câu hỏi, không tự mở rộng roster hay giả dữ liệu vai trò.

## SUI-02 — Nguồn và chuẩn hóa

Workflow SHALL giữ raw source có version/hash tách khỏi normalized reference; mapping màu theo vai trò và font Be Vietnam Pro SHALL có hồ sơ. Reference được owner duyệt độc lập với implementation. Tool SHALL từ chối actual/reference cùng URL trong screen mode, chuẩn hóa CSS trên actual, reference source hash hoặc contract hash chưa duyệt/không khớp. Implementation golden SHALL không thay normalized design reference.

Scenario: đổi threshold, viewport, selector, clock hoặc browser sau duyệt → hash contract đổi, tool từ chối chạy screen mode. Chỉ có bitmap và thiếu thông tin → ghi chưa xác minh, không tự công bố font/geometry chính xác từ ảnh.

## SUI-03 — Palette và font

Chuẩn SHALL là22 semantic colors trong `ui-remake/palette-a-v1.json`, font Be Vietnam Pro, nguồn/font license/hash được giữ. Tool SHALL kiểm giá trị token thực và font face đã khai báo/loaded, cùng font family đầu của anchors. Trùng tên CSS family nhưng dùng fallback SHALL không PASS font gate. Phạm vi kiểm màu/styles SHALL được nêu theo token/anchors thực đo, không gọi là full-source coverage.

## SUI-04 — Responsive

Workflow SHALL hỗ trợ hợp đồng landscape width≥568, height≥320, width>height bằng CSSpx; test mốc nhỏ, thấp, tablet, desktop, rộng và breakpoint±1 của từng màn. Màn không có design riêng SHALL được kiểm theo quy tắc responsive đã duyệt, không nhận pixel fidelity không có reference. Tool SHALL đo root overflow và critical target kích thước/reachability/occlusion, giữ scroll trước capture; internal scroll được cho phép theo hợp đồng. Không suy sampling Chromium thành PASS mọi thiết bị.

## SUI-05 — Đo hình thức có thể tái hiện

Tool SHALL cố định CSS viewport/DPR1, localevi-VN, timezoneAsia/Ho_Chi_Minh, clock/light/motion và yêu cầu hai PNG liên tiếp bằng nhau. PNG sạch SHALL được lưu riêng expected/actual/diff/overlay. So pixel SHALL công bố channel threshold, số pixel khác/mẫu số, ratio và vùng quan trọng; geometry SHALL có sai lệch lớn nhất và thiếu/thừa anchor. Không gọi pixel ratio là “độ chính xác thiết kế”. Ngưỡng SHALL explicit và được chốt theo màn sau hiệu chuẩn.

## SUI-06 — Nghiệm thu tách lớp

Measurement, responsive, DOM audit, business/permission regression và owner acceptance SHALL có trạng thái riêng. Selftest SHALL có positive và negative controls; transparent overlay pixel-identical nhưng che CTA SHALL vẫn bị bắt bởi hit test. Tool SHALL luôn ghi productAcceptance=NOT_ASSESSED. Không tự update audit baseline hoặc chấp nhận reference để làm xanh phép đo. Missing required app gate SHALL không trở thành PASS.

## SUI-07 — Bằng chứng, tài nguyên và nguồn thực

Report SHALL ghi config/reference/contract/source hashes, runtime thực, case/state/viewport, ảnh và giới hạn. File source/reference đổi trong phép đo SHALL làm ERROR. App source root/server recipe SHALL được khai báo; snapshot source không tự chứng minh dev server phục vụ chính source đó, operator SHALL xác minh binding. Chỉ local HTTP targets và dữ liệu mock được dùng; không giữ credential trong config. Output SHALL nằm trong artifacts/ui-remake, không overwrite, giới hạn dự toán và bytes512MiB/run. Quy tắc kiểm Windows disk/reserve, một env, install disclosure và cleanup permission giữ nguyên.

## SUI-08 — Đóng gói cho nhóm

Code và docs SHALL tách nhánh đúng mô hình: `ui-remake/` trên nhánh code giữ công cụ, workflow vận hành, templates, palette/font và hướng dẫn đo cùng phiên bản; `docs` giữ spec, quyết định, biên bản và con trỏ, không giữ bản vận hành trùng. Có command chạy, template có thể điền, font license và review độc lập. Chỉ push payload đã review; không gom dirty WIP. Merge SHALL chỉ thực hiện khi được owner giao rõ, đủ kiểm chứng/review và đúng base; D6 cho phép PR #7→`main`, PR #8→`docs`, không deploy. Docs SHALL phân biệt tool selftest đã chạy với app UI/browser/device chưa chạy; raw Claude logs/private local paths không được đưa vào payload công khai.
