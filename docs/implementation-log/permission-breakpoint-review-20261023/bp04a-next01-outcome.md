# BP4A-NEXT01 — dừng tại chênh lệch count của @types/pg

Ngày 23/10/2026, Asia/Bangkok. **R1 FAIL_OR_UNKNOWN; install/build/full unit NOT_RUN.** Đây là kết quả lượt đã được owner duyệt, không phải bằng chứng ứng dụng đã đạt gate.

## Quyền, nguồn và thời gian

Owner trả lời “Duyệt toàn lượt 60 phút (khuyến nghị)” tại `request_user_input_async call_2470b0ddccbc488dab91fc80e6ee2dbf item0`. [Grant gốc](bp04a-next01-owner-grant.json) ghi nhận lúc **11:54:18**, hạn **12:54:18**, readiness trước **12:09:18**. Thời điểm ghi nhận không khẳng định thời điểm owner bấm chính xác.

Grant gắn [kế hoạch](../../workflow/tasks/permission-bp4a-next-local-run-2026-10-23.md), SHA256 `0add4c37ad1991767e2b9e631610d35da247d4f7977385f25f3febecd4a3c98e`. Source sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`, Node24.16.0/npm11.13.0. Không sửa app, lock, config coverage; không push/CI/backend/DB/deploy.

## Kết quả từng breakpoint

| Bước | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| R0 | PASS readiness | Recipe mới, logging firstFailure/countFailure, các cap và namespace được hai reviewer APPROVE trước R1; [admission](bp04a-next01-admission01.json) ghi exact hashes và phạm vi review. |
| Controls collector | PASS13/13 | [Report](bp04a-next01-collector-controls01.json), 11:59:58.395–.469; toàn bộ fake transport, không HTTP thật hoặc unit app. Không chạy lại 309 archive/23 parser controls cũ để tăng số PASS. |
| R1 archive | FAIL_OR_UNKNOWN | [Receipt](bp04a-next01-local01.json), **12:04:50.728–12:04:51.644**, exit1. Zero archive được nhận PASS; firstFailure ở `node_modules/@types/pg`; ba worker còn lại bị peer abort. |
| R2 install/native | NOT_RUN | Không bắt đầu npm ci hoặc native probe. |
| R3 build | NOT_RUN | Không có build nguồn mới. |
| R4 unit/coverage | NOT_RUN | Chưa chạy 110 file; chưa có số coverage nguồn mới. Giữ threshold lines≥90% và toàn bộ suite. |

Từ T0 đến R1 khoảng10phút33giây, chủ yếu chuẩn bị/kiểm offline/review. R1 dừng sau khoảng0,916giây. Đây là dừng theo điều kiện lỗi đã duyệt, không phải timeout build hoặc cạn token.

## Lỗi xác định được và điều chưa xác định

Package `@types/pg@8.23.1` tải HTTP200, body5.484B. `archivePartial.firstFailure` ghi `stage=COUNTS`, `code=BP4_COUNTS_FILES`, `metric=regularFiles`, **expected9/actual7**. Thứ tự kiểm trong [parser](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-archive-inspect.mjs:29) cho thấy SRI của lock, gzip/tar, checksum, path/root/type và tổng byte19.802 đã qua trước điều kiện count tại dòng31. Đây là kết luận từ receipt kết hợp đúng parser hash, không phải một lượt parse lại archive đã giữ.

Nguồn expected9 là fact registry đã thu trước lượt này tại [package-size facts](D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/bp4-package-size-facts01.json:53), SHA256 `1c00b0b0a3fb3279cad9ddb072cef74d8508a01215b46a92c2f4f3171a7c21f9`: metadata khớp SRI/tarball lock, `unpackedSize=19802`, `fileCount=9`. Receipt mới không phải lần refresh metadata.

[Tài liệu npm registry](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#dist) định nghĩa `fileCount` loại trừ thư mục. Npm CLI cài trên máy có [counter entryCount](D:/tools/nodejs/node_modules/npm/lib/utils/tar.js:58) tăng cho mọi entry được node-tar phát ra; đó là trường khác, chưa chứng minh registry của package này dùng cùng cách đếm. Không đổi regularFiles sang physical tar headers hoặc tự kết luận 9=7file+2directory.

[Snapshot chỉ đọc](bp04a-next01-stop-observation01.json) thấy owner checkout đã có đúng version8.23.1, 7file thường, tổng19.802B. Đây là bằng chứng hỗ trợ, **không chứng minh byte/SRI của tarball vừa tải**, không được dùng owner node_modules để thay cài đặt task. Archive lỗi chỉ tồn tại trong RAM và không được giữ lại; chưa có inventory header hay parser tham chiếu trên cùng bytes. Chưa phân xử được metadata/publisher khác hợp đồng hay sai lệch parser trên exact archive; cũng chưa thể gán nguyên nhân này cho lượt FAIL01 cũ thiếu chi tiết.

## Lịch sử và trạng thái sau dừng

- Archive preflight dùng **2/2 lifetime attempts**: FAIL01 cũ và NEXT01 hiện tại. Không reset marker/grant; npm ci/build/unit vẫn0 invocation. Grant yêu cầu sau R1 FAIL/UNKNOWN dừng phụ thuộc, không tự sửa recipe rồi retry. Thời gian còn lại không tự mở lại lượt chạy.
- Root `stopReason=BP4_UNCLASSIFIED_STOP` còn generic; nguyên nhân cụ thể được giữ trong `archivePartial.firstFailure`. Cần đọc trường đó, không bỏ qua hoặc trình bày peer abort là ba lỗi gốc khác.
- [Observation sau dừng](bp04a-next01-stop-observation01.json) lúc12:12:35: source/lock sạch; sáu phase03 ledger hashes giữ nguyên; không có main03 đang chạy, node_modules/dist/cache/temp/coverage mới hoặc dependent phase markers.
- Storage receipt12:04:51: root51.602.088B, tăng292.958B từ baseline gốc; retained333.440.260B; C/D trống193.699.999.744/98.505.256.960B. Snapshot12:12:35 vẫn trên30GiB free. Các số tree là logical bytes, không phải allocated disk. Bốn link hiện hữu vẫn được ghi, không phải publication admission.
- Không cài mới nên dự trù1–2GiB chưa được sử dụng; không tạo runtime thay thế, không dọn fixture/cache. Không hạ coverage hoặc nhận evidence cũ thành PASS nguồn mới.

## Bước tiếp theo đề nghị

Giữ STOP. [Đề xuất chẩn đoán riêng](../../workflow/tasks/permission-bp4a-archive-count-diagnosis-2026-10-23.md) chỉ lấy tối đa một exact archive nhỏ, giữ nguyên bytes/SRI và đối chiếu hai cách đọc; **chưa cho chạy lại 46 archive hoặc cài/build/unit**. Chỉ sau khi có dữ liệu mới mới chốt cách sửa và ngân sách thực thi. Không waive count để làm xanh.

Raw copies có [manifest hashes](bp04a-next01-evidence-manifest.json); operations được pin tại chỗ, không chép executable source vào docs. Hướng đọc: grant → admission/controls → firstFailure → snapshot → proposal. Walkthrough này đã cung cấp; chưa có xác nhận owner đã đọc/nghiệm thu. Outcome và proposal phải có hai review độc lập cuối trước bàn giao; verdict lưu riêng, không biến approval tài liệu thành approval chạy.
