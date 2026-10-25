# T04: kết quả lượt được cấp và chẩn đoán riêng — 24/10/2026

**Whole T04 vẫn FAIL. Đã tách và chạy độc lập phần lỗi, rồi tái hiện được lỗi khởi tạo origin của helper bằng Chromium local. Phương án sửa tiếp theo đã cụ thể; chưa áp dụng vào candidate, chưa chạy thêm cloud, chưa merge/deploy.**

## Các lượt đã thực hiện

| Source / lượt | Kết quả | Phạm vi |
| --- | --- | --- |
| 34db1b13 — [fresh CI40067504649/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40067504649) | PASS18 | Đủ prerequisite của lượt whole được cấp |
| 34db1b13 — [whole T0440068845295/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40068845295) | FAIL | First9 stages/275required PASS; cả6Candidate tests PASS; fail phép đo ảnh; next9 NOT_RUN |
| c4166715 — [fresh CI40071662442/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40071662442) | PASS18 | Source mới chứa segment và diagnostics hữu hạn; hai actual CI/LIGHT/Linux/fresh PIN reviews APPROVE |
| c4166715 — [segment40073087518/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40073087518) | DIAGNOSTIC_FAIL | Nguyên6Candidate tests PASS một lần; fail step28/predicate65; không phải whole T04 |

Lượt whole được cấp đã dùng đủ; fallback theo chỉ đạo chia nhỏ có publication1/CI1/segment1, đều đã dùng đúng một lần. Không auto-retry. Acceptance35/760,12obligations/34contexts,A18/D19 giữ nguyên; không ghép PASS từ hai backend thành whole PASS. Bảy service profiles khác vẫn HELD.

Source hiện tại sạch **c4166715574dbf16a151d9ed7c272a3a43035231**, tree b2e0e4ecdd03201497d48fa97caf912bd3bae947; fingerprint1aed310c58c59cb5f6f72e32f88bd4ad83ff39aa0083d0217c83acb233279f85; lock85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18. [Packet](t04-image-diagnostic-packet01.json), [source reviews](t04-image-diagnostic-source-reviews01.json), [actual CI/photo reviews](t04-image-diagnostic-light-reviews01.json).

## Lỗi thực tế đã khoanh được

[Receipt và giải mã](t04-image-diagnostic-observed-failure01.json) xác nhận parent phase5/helper phase3, **step28/predicate65** tại [helper:378](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:378). Điều kiện là HTTP200 **và** browser đã dùng cache **và** bytes đúng PNG. Ít nhất một toán hạng sai; receipt cloud hiện chưa tách ba toán hạng, nên không gọi cache miss là quan sát trực tiếp của run này.

Trước đó, cold-fetch status/hash và giải mã PNG đã qua. Mask16769519 xác nhận19observations: publication, PNG decode, origin200/304, cả hai đường lỗi storage/lookup503, upload fault và cleanup/sentinel. Warm cache chưa chứng minh; fresh-after-unlink và các mốc59/60/61 chưa chạy tới. Observe/restore cũng chưa tới; resets=[] không phải restore PASS.

Reader nhận đủ35.111B/VALID/capped0,798innerfacts/793collector projection. Hai reviewer độc lập [APPROVE integrity và giới hạn kết luận](t04-image-diagnostic-terminal-reviews01.json). Lỗi ảnh menu/clear-demo trước đây đã qua trong cả whole và segment, sáu tests đều một attempt; đây không phải bằng chứng chúng lại fail.

## Nguyên nhân helper đã tái hiện bằng phép thử nhỏ

[Recipe02](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/t04-image-warm-cache-probe02.mjs) SHA41aed420e47f9eedbd0df88794c00f0fbc857c656e6a6c722e648218944a79a1 và [kết quả02](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/t04-image-warm-cache-probe02.json) SHA443887ece00e51b0a1e0cdff29c176e1cb88fcee8a6f56a5ee6cbff3123ad0c7 chạy bằng Node24.16.0/Playwright1.60.0/Chromium148.0.7778.96 đã có. HTTP server chỉ127.0.0.1, cùng PNG/cache headers/CORS, không DB/hosted network/cài đặt. Browser và cả hai server đã đóng.

| Control | GET tới server ở lần hai | HTTP/bytes | Cache/CDP và predicate |
| --- | --- | --- | --- |
| Cách cũ: about:blank + setContent | 1 | 200/đúng | Không cache; warm predicate FAIL |
| Trang HTTP khác origin với endpoint ảnh | 0 | 200/đúng | Có cache; warm predicate PASS |
| HTTP khác origin + no-store | 1 | 200/đúng | Không cache; negative control FAIL đúng |
| Mở URL404 JSON/no-store thuộc API rồi setContent | 0 | 200/đúng | Có cache; phương án bootstrap PASS |

Chờ thêm CDP barrier không thay kết quả; server request count xác nhận đây không chỉ là cách đọc event quá sớm trong local control. Helper hiện tạo trang bằng newPage/setContent tại [dòng291](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:291), để origin là null. Lỗi môi trường đo này đã tái hiện độc lập; nó giải thích hợp lý predicate65 của cloud, nhưng không khôi phục toán hạng thực tế đã mất. Chưa có căn cứ quy lỗi cache cho ứng dụng hoặc kết luận các mốc60/61 đã đạt.

Thiếu regression cache qua HTTP server/browser thật với origin tương ứng là thiếu sót của harness/test review trước đây. Thêm diagnostics đã giúp chuyển từ runtime.measure UNKNOWN sang một điều kiện cụ thể, rồi dùng phép thử nhỏ tìm cơ chế lỗi; không cần chạy whole thêm để phỏng đoán.

## Phương án sửa tiếp theo — chưa triển khai

1. Dùng cùng một helper bootstrap cho page chính và fresh context ([dòng380](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:380)). Điều hướng tới URL cố định do backend synthetic sở hữu: http://127.0.0.1:62421/functions/v1/menu-image-public/not-a-uuid. Giữ deadline hiện tại; kiểm404/no-store, URL chính xác, không redirect và origin đúng, rồi mới setContent/recheck origin.
2. Invalid UUID bị từ chối [trước lookup/storage](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/supabase/functions/menu-image-public/index.ts:10), nên không tải trước ảnh đo. Không dùng page.route, cache override, persistent context hoặc nới warm assertion. Không phụ thuộc Vite5174 đã thuộc vòng đời Playwright của Candidate file.
3. Regression dùng **chính helper mới** qua HTTP/browser thật: cách cũ phải fail; bootstrap mới và cross-origin HTTP phải cho server GETcount1 trên hai lần fetch/CDP cachetrue; no-store vẫn không cache; fresh context sau unlink trả404; origin/status/cache/redirect sai phải bị từ chối.
4. Giữ nguyên cold/decode/warm, fresh-after-unlink, cửa sổ59/60/61 (750ms), fault/cleanup/restore và toàn bộ acceptance. Test/review source mới trước xác nhận runtime; không sử dụng CI/sourcec416 làm PASS cho bản sửa chưa có. Các toán hạng cache lỗi có thể thêm fact boolean/status hữu hạn nếu cần, không raw URL/header/body.

Phần này là fix plan đã có local proof cho cơ chế, **không phải bản sửa đã tích hợp**. Sau khi triển khai phải xác nhận lại segment, gồm phần sau warm hiện chưa tới; chỉ lúc đó mới quyết định đủ điều kiện chạy whole. Không có publication/CI/segment/whole tiếp theo được đặt lịch trong lượt này. Không tuyên bố “triệt để” từ một local control.

Không có console/raw debug log tạm trong candidate. Local probe recipe/kết quả là bằng chứng cần giữ. Diagnostics hữu hạn phục vụ lỗi còn mở; chưa gỡ chỉ vì local control PASS. Sau xác nhận fix cần bỏ instrumentation tạm nếu phát sinh, giữ bằng chứng và kiểm hồi quy cần thiết. Walkthrough điểm vào→origin→fetch/CDP→warm assertion được cung cấp ở trên; chưa có xác nhận chủ repo đã đọc/hiểu.

## Tài nguyên và dọn dữ liệu

Segment cleanup inner/outer thành công; một RECLAIMED/imageUnlinked, đo thu hồi19.327.373.312B trên runner. Outside568901632B+reserved16777216B dưới1GiB. Đây là guard vận hành, không phải OS quota. CI10 peak1403592704B dưới5GiB; current PG16 cleanup đo50741248B, terminal NOT_PRESENT là kiểm tra riêng.

[Checkpoint](t04-image-diagnostic-terminal-checkpoint01.json) lúc07:21:21UTC: C189414232064B,D98708328448B trống; retained619539067B logic dưới805306368B, không theo4symlinks; chưa đo allocated local. Probe02 chỉ thêm khoảng14KB recipe/kết quả. Không cài dependency/browser, không WSL/Docker local.

36thư mục cũ đã được cho phép nhưng automatic approval review từ chối Remove-Item trước execution với lý do “blocked by policy”; không thử đường vòng, không claim thu hồi. [Đường dẫn chưa xóa](unremoved-control-paths02.txt). Hai nhóm5+8control mới vẫn giữ vì câu hỏi riêng chưa được trả lời; không coi việc cho phép nhóm cũ là cho phép các nhóm này. Source và log kết quả được giữ.
