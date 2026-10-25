# T04 — kết quả lượt sửa cuối, 24/10/2026

**T04 chưa đạt acceptance. Đã xác nhận sửa được lỗi warm-cache, nhưng diagnostic dừng ở phép đo thời gian. Dừng retry và chuyển sang phương án tách browser measurement khỏi luồng guard đồng bộ.**

Source: `4e78a8c11d2d895ccebaccd2b2f7d3b2c69bcb3e`, fingerprint `7086be12b292e0b17ef7e2eceef9beac7c5ef057a8d96cd978edcf5cb3c6d6c3`. Checkout sạch, nhánh review đã cập nhật; main vẫn `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`. Không merge/deploy. Lượt này đã dùng một publication, một fresh CI, một fixed diagnostic; không chạy thêm whole hoặc tự retry.

## Kết quả thực tế

| Phần | Kết quả và giới hạn |
| --- | --- |
| Local | 120 tests PASS; browser HTTP thật xác nhận opaque-origin lỗi, stable/cross-origin cache hit, no-store/unlink controls và59/60/61 với guard nhẹ; reporter7 nhóm/20 mutations; policy/preview28 tests PASS. |
| Fresh CI | [40081353958/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40081353958) PASS18,15m37s; unit1177, node1042; LIGHT6 stages/343 required/510 actual; Linux29 filesystem controls +5 realfile routes và61s browser control bắt buộc qua producer đúng source đã PASS. Inner timing/raw logs không export công khai. |
| Review | Hai review độc lập cho source/local proof, commit/packet, CI/Linux và ba ảnh PIN mới; không dùng evidence source cũ làm PASS bản sửa. |
| Backend diagnostic | [40082616309/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40082616309) **DIAGNOSTIC_FAIL**,11m19s; full6 Candidate tests PASS đúng một attempt;21/24 image observations hoàn tất, gồm warm-cache và fresh-after-unlink. |
| Điểm fail | Helper step30, predicate67. Mẫu target59.000ms được ghi nhận phát request tại60.657ms; giới hạn là59.000 ≤ elapsed <59.750ms. Muộn1.657ms so với target và vượt cận trên907ms. |
| Chưa chứng minh | Oracle cache59 chưa được kiểm vì predicate67 ném lỗi trước; fetch60/61 chưa chạy. `imageMeasurement=null`, `resets=[]`; observe/restore/verify của lifecycle chưa tới. Không có whole/full35 PASS. |
| Receipt và cleanup | ReceiptVALID35.212B, uncapped;801 inner facts/796 projected facts. Helper cleanupFailed0, inner/outercleanuptrue, cleanupFailurenull; không đồng nghĩa toàn bộ lifecycle restoration oracle đã PASS. |
| Tài nguyên | Một loop đã RECLAIMED/unlinked; thu hồi đo được19.327.389.696B. Outside568.946.688B +reserve16.777.216B <1GiB. Terminal API xác nhận0 artifacts cho diagnostic. |

Các dấu chấm trong số milliseconds/bytes ở bảng là dấu phân tách hàng nghìn. Request lỗi tương ứng **60,657 giây**, target **59 giây**.

## Nguyên nhân và bản sửa đã được xác nhận

Helper cũ tạo trang bằng `about:blank` + `setContent`, giữ opaque origin. Probe Chromium thực đã cho thấy warm fetch vẫn200/đúng bytes nhưng không dùng cache; stable HTTP origin cho cache hit. Bản sửa dùng chung bootstrap HTTP origin thật, xác minh URL/origin/no redirect/404/no-store trên route invalidUUID không prewarm asset. Current cloud mask xác nhận exact warm predicate65 và fresh-after-unlink66 đã qua. Operand cloud65 của lượt cũ chưa được xuất riêng, nên không nhận mình đã quan sát trực tiếp operand lịch sử.

Đồng thời sửa bounded page/context/browser cleanup để lỗi đóng tài nguyên không giữ harness vô hạn hoặc che lỗi đầu tiên; thêm ba warm operand facts hữu hạn qua đường reporter→file thật→outer→collector. Review bắt lỗi policy65pins vượt cap64: giữ cap, giữ61pins cũ và3browserpins mới; thêm regression actualpolicy và65negative. Giữ nguyên70 predicates, reader, timing loop, retries/deadlines, receipt128KiB và attachment16KiB. Bound tính lại T04=103.793B, service=107.891B.

Lỗi còn lại đã xác nhận là **phát request muộn**, không phải bằng chứng ảnh còn được cache sai sau TTL. Code chạy full synchronous envelope/physical checks trong timing loop và ngay trước browser fetch: [helper gate](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:145), [browserGet](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:300), [timing](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:389), [Linux checks](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-adapter.mjs:167), [physical checks](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:207). Đây là cơ chế có thể làm trễ dispatch; chưa có phân rã thời gian guard/IPC/scheduler để quy toàn bộ1.657ms cho một thành phần.

Mask16770047 cho21 observation completed. Ba warm operand fields bằng0 tại step30 do reset ở bước mới, nghĩa làUNKNOWN; không phủ nhận warm-cache đã PASS. Phép đo elapsed dùng `requestAt − cold.completedAt` trong cùng renderer, không trộn clock Node với browser.

## Hướng đi thay thế đã review

Giữ bản sửa origin. Tách riêng phần đo cache59/60/61 sang browser worker; controller tiếp tục full guard và giữ DB credentials/orchestration. Cùng physical backend/checkpoint/source/run/attempt/deadline, vẫn750ms, đủ45s cleanup; không tăng cửa sổ hoặc ghép các backend thành whole PASS. Child ghi timestamp thật trong cùng renderer và trả receipt hữu hạn có binding; guard failure hủy child và luôn từ chối PASS, nhưng không ghi đè lỗi measurement đầu tiên. Restore chỉ chạy sau child đã settled hoặc được xác minh termination.

Trước backend, chạy các control độc lập có guard chậm/guard fail, body timeout, close treo và receipt sai binding/thiếu/duplicate/out-of-order; sau đó hai review lifecycle/acceptance. Cách này tách vấn đề đo thời gian khỏi luồng controller đang bị các subprocess đồng bộ giữ lại. Chỉ thêm các timing facts hữu hạn cần thiết khi triển khai để đo dispatch lag và thời gian guard; bỏ instrumentation tạm khi xác nhận fix. Phần này **mới là kế hoạch đã review, chưa triển khai hoặc chạy**. [Kế hoạch chi tiết](t04-final-origin-fallback-20261024.md) và [hai review](t04-final-origin-fallback-reviews01.json).

Nếu không đủ thời gian để làm và xác nhận worker, giữ T04 **BLOCKED**, nhánh review chưa merge/deploy. Không hạ acceptance hoặc gọi phần hoãn làPASS. Chín stage sau image của whole trước vẫn chưa được xác minh; diagnostic riêng không chứng minh tương tác với chín stage đầu đã bỏ qua.

## Bằng chứng và trạng thái bàn giao

- [Observed failure](t04-final-origin-observed-failure01.json), [receipt](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/cloud-t04-image02.json), [safe log](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/cloud-t04-image02.log), [terminal artifact API](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/cloud-t04-image02-artifacts-api.json).
- [Manifest source/local](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/t04-final-origin-author-manifest02.json), [source reviews](t04-final-origin-source-reviews01.json), [packet](t04-final-origin-packet01.json), [actual CI/photo gate](t04-final-origin-light-reviews01.json).
- Không thêm console debug tạm vào product. Ba warm facts chỉ thuộc failure diagnostics hữu hạn của harness; chúng vẫn được giữ khi timing chưa được sửa xong. Thí nghiệm renderer-scheduler/browser01 không ship và không dùng làm final-source proof.
- Local controls tiếp tục giữ theo chỉ đạo “tạm chưa xóa”; không có thao tác xóa mới. [Kiểm kê có phạm vi của control mới](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/t04-final-origin-retained-controls01.json):4dirs/65files/281.417B logic, không phải tổng mọi artifact của task, chưa đo allocated size.
- Walkthrough cung cấp qua phần nguyên nhân, các line anchors và kế hoạch trên; chưa có xác nhận người dùng đã đọc/hiểu code. Independent review báo cáo cuối được ghi riêng, không biến thành runtime PASS.
