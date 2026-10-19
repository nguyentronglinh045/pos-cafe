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

## SUI-09 — CI kiểm công cụ UI (D7)

POS light CI SHALL chạy tất cả Node tests tracked của ui-remake và ui-audit sau khi Chromium đã được cài, với inventory tối thiểu bắt buộc; missing file, fail/skip/cancel/todo hoặc thiếu report SHALL không PASS. Hai calibration phase riêng SHALL kiểm ui-remake đủ11IDs duy nhất (5PASS/6FAIL có chủ đích,0ERROR), ui-audit đúng23findings/14required ruleclasses/16effective-target controls. Chúng SHALL kiểm structured report, source/config/reference/contract hashes, sourceHEAD thực và thời gian của invocation mới; exit0 hay chuỗi OK riêng lẻ không đủ.

CI SHALL dùng full Chromium channel đã có, không cài thêm headless-shell chỉ để chạy tool. Channel SHALL nằm trong evidence và contract reference approval; thay chính sách channel SHALL invalidate approval cũ. Summary công khai chỉ có finite counts/hashes/codes được cho phép, không raw paths/DOM/images. Các guard resource/source/privacy và gate build/unit/smoke hiện hữu SHALL giữ nguyên. Trusted checker hashes SHALL theo canonical Git blobs; productionEnabled SHALL vẫn false.

## SUI-10 — Publish rendered-UI audit trên main (D7)

Main SHALL có detector/runner/config/fixtures, scripts và operator guide ui-audit dùng được với source main hiện tại; không nhập WIP app/phân quyền chỉ để phục vụ fixture. Default matrix giữ13state legacy đã có đối ứng trên main ×3viewport lịch sử; ba fixturestate phụ thuộc code chưa publish SHALL được ghi ngoài ma trận main, không nhận là đã kiểm. Pilot remake thật và nghiệm thu app568×320 SHALL vẫn ngoài D7.

Vite dev watcher và dependency entry discovery SHALL không quét generated artifacts hoặc fixture backlink như source app. App SPA vẫn giữ `index.html` và toàn bộ source imports; kiểm Vite thật có fixture backlink SHALL hoàn tất trong thời hạn, HTTP phản hồi và watcher không đi vào artifact aliases.

Runner SHALL từ chối CLI/selection/matrix rỗng hoặc không hợp lệ trước capture; không tự dùng lại cổng có server không xác minh; luôn đóng browser/context và server do task tạo khi lỗi/timeout. Selftest SHALL fail nếu count22/24, mất requiredclass hoặc effective-target control hỏng. Baseline SHALL giữ bytes của checkout nguồn hiện có và 36 keys lịch sử, ghi riêng provenance Git LF lịch sử và CRLF hiện tại; không regenerate/update hoặc nhận nó thành nghiệm thu UI mới. Warnings SHALL được báo để phân loại; failOn mặc định vẫn chỉ error mới, không âm thầm nâng/hạ gate. Full audit mock trên source main là kiểm vận hành công cụ; findings thật SHALL báo riêng và không tự sửa src hay nhận fixturePASS thành appPASS.
