# Test plan workflow và bộ đo

Đây là tooling/process, không có use case sản phẩm mới. Command đầy đủ và candidate thực được lưu ở biên bản cuối; không suy test cấu hình là execution.

| TC | Steps/dữ liệu | Expected |
| --- | --- | --- |
| T01 | Đối chiếu rawStitch có role filters trướcPIN với roster id/name | Intake ghi mismatch, không tạo role fields/API/màn mới; workflow templates chứa deviation/authorization |
| T02 | Review raw/normalized/referenceApproval và template | Hai nguồn tách biệt; actual không làm reference; source/contract hashes được owner bind |
| T03 | Unit đổi reference hash, threshold, selector, viewport, clock, browser sau approval | Mọi thay đổi tác động contract đều invalidate approval; title/metadata không tạo hash đệ quy |
| T04 | Metrics equality,1pixel tại vùng critical trên ảnh phần lớn bằng nhau, alpha/channel boundaries | Count/mẫu số đúng; critical fail dù whole ratio nhỏ; threshold/region boundary đúng |
| T05 | Anchors đổi từng x/y/w/h, font/color, thiếu/thừa/duplicate/nonfinite | Có finding tương ứng; max geometry delta; invalid input không được giảm coverage |
| T06 | Config portrait,319pxheight,568×320minimum, duplicateid, region ngoàiảnh, credentials/remoteURL, huge matrix | Minimum hợp lệ; invalid bị từ chối trước capture/ghi vô hạn |
| T07 | Browserfixture normal, fallback/unloaded font, font đã load từ BeVietnamProTTF | Font gate chỉ PASS khi declared/loaded và firstfamily của anchors đúng |
| T08 | Transparent overlay pixel-identical,20pxcontrol, offscreen dưới fold, nestedscroll, root/internal overflow | Overlay/tiny/rootoverflow FAIL; control reachable sau scroll và internalcanvas hợp lệ không bị nhận sai; scroll phục hồi |
| T09 | Brokenimage, missing/duplicate/hiddenready, changingcapture | ERROR/block, không coi là tín hiệu fidelity pass; decode/readiness cần đủ |
| T10 | CLI selftest11case:5positive(min568,phone844,tablet1024,desktop1440,longVietnamese) và6negative | Đối chứng PASS khi5casePASS,6caseFAIL đúng lý do; không ERROR/SKIP; productAcceptance NOT_ASSESSED |
| T11 | Read final JSON/MD + mở ảnh reference/actual/diff/overlay | Count,thresholds,geometry,tokens,font,source/env/contract có thật; ảnh sạch, ảnhdiff nêu vùnglệch |
| T12 | Run output path đã tồn tại; kiểm source/reference drift; actualnormalization; missingapproval | Không overwrite/source mutation; actual không bị recolor để che lỗi; drift/error không PASS |
| T13 | Forward-test workflow trên tình huống đầu vào Stitch và nguồn chưa đủ/missingaudit | Agent tạo đúng intake/plan; không remake app/tự duyệt threshold; NOT_RUN của productgate không biến PASS |
| T14 | Review public payload paths/diff/license/links/code-docs split, commandhelp | Không privateClaude/rawlogs/secrets/unrelateddirty changes; tài liệu dùng được từ clone/branch rõ |
| T15 | Review responsive matrix beyond min + breakpoint±1/browsers/zoom/touch/CTA rules | Phạm vi/ngoại lệ/mẫu số rõ; không gọi sampling bằng mọi thiết bị; viewport chưa códesign không cófidelity giả |
| T16 | Hai reviewer độc lập kiểm candidate; push/readback branches/PR | Cả hai APPROVE phạm vi; push đúng source reviewed, no merge/deploy; remote SHA khớp |

T04–T09 là unit/browsercontrols; T10–T12 CLI/integration; T01/T02/T13/T14/T15 là review kịch bản/quy trình. Không chạy flow tài chính/DB trên production để chứng minh task tooling. Gate build/unit/smoke/ui-audit sản phẩm chỉ áp khi task remake thật sửa UI; lượt này không có app UI change.
