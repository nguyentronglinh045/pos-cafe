# BP4A — sửa recipe và kiểm offline

23/10/2026, Asia/Bangkok. **Phạm vi sửa/kiểm offline đã có kết quả PASS; BP4A install/build/unit vẫn chưa hoàn tất.** [Grant03](bp04a-offline-grant03.json) qua call_1664298b1b0441ff83fe34f0a241f135 ghi nhận 11:19:31, tối đa 20 phút nhưng dừng trước **11:30:43**. Không có cap lượt offline trong grant; các lượt dưới đây giữ riêng lịch sử. Không có network/preflight bổ sung, cài, build/unit app, push/CI/backend/DB/deploy.

Đã sửa chỉ trong operations, giữ nguyên source app sạch e42215044b4faf7e90f787ae8e975937ad3e4479, lock và evidence/recipe01. Parser được tách thành module không side effect; dùng đúng module đó cho controls và candidate recipe02. Cho phép một root tương đối thống nhất gồm cả root legacy có phiên bản; chuẩn hóa segment '.' vô hại, giữ chặn '..', absolute/drive/backslash/control chars, segment rỗng, mixed roots, file đứng ngay root, link/sparse, sai checksum/SRI, malformed/truncated và bound gzip/tar/counts. Không dedup entry sau chuẩn hóa để không đổi tổng byte/file. Recipe02 thêm lockPath, stage, byte/HTTP/counts và firstFailure phân biệt peer-aborted; phần HTTP/abort diagnostics mới chỉ được source-review, **chưa kiểm runtime mạng**. Main02 từ chối --run vô điều kiện, chưa phải recipe được admit để thực thi.

## Kiểm thực tế và bài học

Hai reviewer authority/evidence APPROVE đúng hash trước từng lượt. Node syntax checks đạt; không nhận syntax thành functional PASS. Lệnh mỗi lượt là D:/tools/nodejs/node.exe operations/check-bp4-archives-offlineNN.mjs PARSER_SHA256, cwd checkout code; đường dẫn recipe/hash chính xác ở [outcome JSON](bp04a-offline-outcome03.json).

- [Offline03](bp04a-offline-controls03.json): FAIL_OR_UNKNOWN, 93 archive đã kiểm, 0 synthetic control; phát hiện agent-base7.1.4 có package/./dist/index.js và package/dist/index.js. Coordinator kiểm header từ cache chỉ đọc, không fetch; nguồn parser lỗi đã lưu snapshot failed03 đúng hash.
- Sửa routine tương thích trong phạm vi grant: chuẩn hóa riêng '.', giữ ca dot thành positive có oracle bytes=3/files=1 và giữ các negative khác; không xóa/ghi đè FAIL03 hoặc reset ledger. Reviewer đã xác nhận grant cho phép vòng sửa/kiểm offline này, không tạo quyền retry archive mạng.
- [Offline04](bp04a-offline-controls04.json): **PASS 309/309 archive cache đúng SRI và 23/23 synthetic controls** (5 positive, 18 expected rejection), 2026-10-23T04:26:38.548Z–2026-10-23T04:26:39.180Z. Tổng 42.450.298 byte nén và 205.602.781 regular payload khớp facts trước đó. Các controls phủ root legacy, dot, PAX/GNU long path, traversal/absolute/drive/backslash/mixed-root/root-file, link/sparse/FIFO, PAX traversal/NUL, checksum, truncation, expanded bound, metadata size/count và SRI.

Thất bại03 là lỗi giả định format của công cụ do agent chuẩn bị, không phải lỗi source app; kiểm toàn cache đã bắt trường hợp đọc vài mẫu trước đó bỏ sót. Kết quả04 không xác định hồi tố item gây lỗi network actual01; receipt actual01 vẫn FAIL_OR_UNKNOWN.

## Handoff

[Outcome](bp04a-offline-outcome03.json) ghi hash toàn bộ source operations được giữ trên máy, source/lock, disk và ledger. Sáu ledger cũ không đổi; archive preflight mạng vẫn **1/1 đã tiêu**. Chưa cài/build/unit app, không giảm coverage; yêu cầu full src unit/lines ≥90% và full permission gate vẫn giữ nguyên. Recipe02 vẫn PREPARATION_ONLY: cần grant/cửa sổ mới, rebind admission/attempt mới giữ lịch sử, review trước khi chạy; không tự bỏ khóa để dùng grant cũ. **46 archive chưa cache chưa được kiểm thành công; chưa hứa lần thực tiếp theo PASS.**

Kết thúc ở breakpoint này. Giữ toàn bộ code/receipt/snapshot gọn để tiếp tục, không có dependency/runtime mới cần dọn. Giải thích thiết kế và giới hạn nằm trong tài liệu; chưa nhận owner đã đọc hoặc nghiệm thu.
