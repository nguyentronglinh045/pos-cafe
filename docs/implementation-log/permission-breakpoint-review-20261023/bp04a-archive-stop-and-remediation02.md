# BP4A follow-up — guard đạt, archive preflight dừng

23/10/2026, Asia/Bangkok. **Đã dừng; BP4A chưa hoàn tất.** [Quyết định bổ sung](bp04a-guard-amendment02.json) cho phép sửa riêng fixture, một orphan control tối đa 30 giây và chỉ tiếp tục quota local chưa dùng khi control PASS. Hạn vẫn **11:30:43**, không tự retry sau lỗi tiếp theo, không sửa main recipe/helper hoặc source/lock trong quyền này. [Lịch sử dừng01](bp04a-outcome-and-guard-remediation.md) giữ nguyên.

## Thực thi được phép và kết quả

Recipe02 cuối `operations/check-bp4-job-orphan02.mjs` SHA256 `7cacc8dd1eb3574b5597660462538993fc1bc4119a1ee1cd638ddae16365a564` đã được cả hai reviewer authority/evidence APPROVE trước chạy. Review đóng một race có thật: worker phải ghi `.pending`, đóng file rồi rename sang READY để parent không đọc JSON chưa hoàn chỉnh. Không thay main recipe/helper/FAIL01. Node syntax check đạt.

Lệnh một lần: `D:/tools/nodejs/node.exe D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/check-bp4-job-orphan02.mjs --run`, cwd checkout code. [Receipt control02](bp04a-guard-orphan02.json) ghi **PASS**, 11:05:32.236–11:05:34.581. Worker `39088` đã gửi READY; root `16600` xác nhận nonce, PID/parent PID và liveness trước exit. [Proof](bp04a-guard-orphan02.proof.json): root=0, wrapper=1 theo expected rejection, orphan=true, releaseVerified=true, activeProcesses=0, worker PID đã hết. Đây là bằng chứng thực cho nhánh orphan trong control02, không nhận thành application/backend PASS.

Sau PASS, coordinator chạy main recipe đã duyệt đúng một lần:

`D:/tools/nodejs/node.exe D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local.mjs --run D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/bp4a-owner-grant01.json`

[Receipt actual01](bp04a-local01.json) ghi 11:05:41.669–11:05:42.674, exit 1. Archive preflight **FAIL_OR_UNKNOWN**, tổng 5.484 body bytes đã nhận, **0/46** archive được xác minh xong. Đã tiêu **1/1 archive preflight**; install/build/unit đều **NOT_RUN/0 lượt**. Main recipe dừng tất cả bước sau và không retry. Không có node_modules/cache/install/build/unit marker mới. Source sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock không đổi, sáu ledger phase03 không đổi; push/CI/backend/DB/deploy đều 0.

Snapshot trong actual receipt: C 192.689.225.728 byte trống, D 98.505.895.936; retained 333.107.983 byte, tăng root 53.045 byte so với baseline. Các giới hạn không bị chạm; link chỉ bỏ qua để thống kê, chưa có publication admission. [Quan sát sau chạy](bp04a-followup-observation02.json) xác nhận không còn root/worker/command của control02 và không có node_modules/npm-cache-bp4. Control/readiness/proof/config và marker gốc được giữ, không xóa hoặc ghi đè lần FAIL.

## Lỗi cụ thể đã tìm được và giới hạn chẩn đoán

Có lỗi tương thích trong chính recipe do agent chuẩn bị: [safeName](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local.mjs:58) chỉ cho phép `package` hoặc `package/...`. [Quan sát chỉ đọc cache sẵn có](bp04a-cache-root-observation02.json) xác minh SRI của sáu archive đúng lock, nhưng root lần lượt là `aria-query/`, `chai/`, `d3-array/`… [Ba archive bổ sung đúng SRI](bp04a-cache-root-version-observation02.json) còn có `node/`, `react v18.3/`, `react-dom v18.3/`. Đây là archive hợp lệ của các package `@types`, không phải traversal. Parser hiện tại sẽ từ chối chúng.

`@types/pg` nằm trong bốn item đầu được tải song song nhưng exact archive chưa có trong cache và buffer của lượt lỗi chỉ giữ RAM. [Catch](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local.mjs:85) bỏ mất item/stage/exception. Vì vậy **chưa chứng minh chính @types/pg hoặc kiểm tra root gây lỗi actual01**; mạng, checksum hoặc assert khác chưa được loại trừ từ receipt. Không tải lại để hợp thức hóa chẩn đoán và không biến giả thuyết thành kết luận runtime.

Hai lần dừng gần đây đều liên quan công cụ kiểm chứng do agent chuẩn bị, chưa có application test nào được chạy trong BP4A. Review code đã bỏ sót các tình huống tương thích Windows/archive thực tế; guard không thay thế được control phù hợp môi trường. Coordinator chịu trách nhiệm chuẩn bị fixture/recipe và giữ kết luận đúng mức bằng chứng.

## Đề xuất breakpoint sửa recipe, chưa cấp quyền

Đề nghị dùng phần thời gian còn lại **chỉ để sửa recipe và kiểm offline**, dừng muộn nhất 11:30:43; tối đa 20 phút kể từ ghi nhận grant mới nếu owner đồng ý, lấy mốc nào đến trước. Không xin thêm network preflight/cài/build/unit trong slice này, không chạy cho bằng được trước hạn. Kết quả là candidate recipe có hash, controls và hai review để lượt thực thi tiếp có đầu vào rõ.

1. Giữ nguyên recipe/evidence01 và các marker đã dùng. Tạo bản sửa có thể truy vết bằng diff/snapshot trong operations, chưa mở đường thực thi hoặc thay grant/deadline/quota. Không sửa code app, lock, coverage, helper Job hoặc acceptance.
2. Sửa giả định tên root: mọi entry thực phải nằm dưới **một thư mục root tương đối, không rỗng, thống nhất**, được kiểm segment an toàn; không buộc tên root là `package` hoặc chỉ basename. Kiểm cache độc lập còn thấy `node/`, `react v18.3/`, `react-dom v18.3/`; chỉ thêm basename sẽ vẫn thiếu định dạng hợp lệ. Giữ kiểm relative path/traversal, backslash/colon/NUL, type, checksum, SRI, bound gzip/tar, metadata size/count và dung lượng. SRI ràng buộc exact archive; tên root không được dùng để bỏ các kiểm an toàn còn lại.
3. Kiểm offline bằng Node built-ins trên **309 archive đúng SRI đã có trong cache**, không tải thêm: bao gồm package chuẩn, các root @types và root có hậu tố phiên bản, PAX/long-path đúng phạm vi; thêm negative controls cho traversal/absolute/backslash/mixed roots/link/sai checksum/truncated/bomb/size-count mismatch. Không cài hoặc gọi suite app. Dùng module/parser side-effect-free để kiểm logic thật mà không khởi động main recipe; không mirror implementation bằng assertions vô nghĩa.
4. Ghi chẩn đoán từng item: lockPath/package, bước FETCH/SRI/TAR/COUNTS, bytes, HTTP status nếu có, expected/actual counts và lỗi gốc đầu tiên. Peer bị abort phải được phân biệt với nguyên nhân đầu tiên. Không giữ lỗi chung duy nhất `BP4A_STOP`, không ghi secret.
5. Hai reviewer kiểm exact final diff/hash và offline evidence. Bàn giao rõ điều đã sửa, chưa chứng minh và chưa chạy. Không gọi local controls là full unit/build PASS; giữ nguyên full permission gate.

Muốn chạy lại archive sau đó cần quyết định mới cấp **một attempt bổ sung có ghi lịch sử** cùng cửa sổ thực thi phù hợp; không reset 1/1 đã tiêu, không xóa marker để tái dùng lượt cũ, không tự kéo hạn 11:30:43. Các lượt install/build/unit chưa dùng vẫn chưa tạo quyền sau khi deadline hết. Phần source app/main/DB vẫn phải chờ full gate và quyền tương ứng.

Lựa chọn đề xuất: **cho sửa recipe + kiểm offline trong hạn cũ (khuyến nghị)**, hoặc **giữ dừng và chỉ lưu hồ sơ**. Lý do cần owner chọn: amendment vừa cấp giới hạn sửa fixture, loại trừ sửa main recipe và yêu cầu dừng ở FAIL tiếp theo.
