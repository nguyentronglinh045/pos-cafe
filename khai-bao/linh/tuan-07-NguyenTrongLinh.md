# Khai báo sử dụng AI — Nguyễn Trọng Linh — Tuần 07

### AI-T07-LINH-02 — Sửa TC-OWNER-29(b,c)/105(5) và TC-OWNER-30

**Yêu cầu đã giao**

Sửa các ca về hoàn suất và phản hồi khi tạo quán, kiểm trước trên PostgreSQL cô lập. Linh sau đó duyệt áp riêng bản sửa này lên staging và chạy hồi quy.

**AI đã làm**

AI sửa RPC và Edge handler, bổ sung kiểm thử phân loại lỗi Auth, cập nhật thiết kế và hồ sơ T06. AI chạy Deno và SQL trên local, diễn tập trước khi triển khai, kiểm năm nhánh SQL bằng giao dịch hoàn tác và đối chiếu trạng thái trên staging.

### AI-T07-LINH-08 — Đối chiếu phần việc và spec còn thiếu ở tuần 7/15

**Yêu cầu đã giao**

Đối chiếu tiến độ tuần 7 với phạm vi, mục tiêu và cam kết của đồ án. Xác định các việc còn dở hoặc chưa có đặc tả đủ để triển khai.

**AI đã làm**

AI rà yêu cầu, thiết kế, ca sử dụng, kế hoạch kiểm thử và ma trận truy vết. AI lập hai báo cáo về phần việc còn thiếu và mức sẵn sàng của đặc tả, kèm đề xuất thứ tự xử lý. Các đề xuất ở mốc khảo sát còn chờ quyết định.

### AI-T07-LINH-09 — Cảnh báo thư Store Key hết hạn gửi trong TC-OWNER-44(c)

**Yêu cầu đã giao**

Áp riêng thay đổi cho TC-OWNER-44(c) lên staging, chạy hồi quy và kiểm tra cảnh báo trong Edge Logs.

**AI đã làm**

AI sửa worker và RPC để phát một cảnh báo khi trạng thái gửi thư Store Key trở thành chưa xác định. AI kiểm hai loại thư, hạn mức và tranh khóa trên local, sau đó quan sát hai lượt Cron trên staging, đối chiếu cảnh báo với đúng thư và khôi phục dữ liệu thử.

### AI-T07-LINH-10 — Hồi quy TC-47(d) và TC-92 theo tiêu chí đã chốt

**Yêu cầu đã giao**

Trên PostgreSQL cô lập, kiểm phản hồi và định danh quán khi gọi lại sau commit. Kiểm quyền xóa và ràng buộc mỗi quán có đúng một chủ.

**AI đã làm**

AI viết bộ chạy Deno với dữ liệu thử riêng, mô phỏng mất phản hồi và đối soát hai lần gọi lại. AI kiểm quyền xóa, ràng buộc cuối giao dịch và chỉ mục ngăn tạo chủ thứ hai. Hai bước kiểm local đạt, kết quả được ghi vào hồ sơ T06.

### AI-T07-LINH-11 — TC-OWNER-09 seed hai phiên và mất phản hồi sau commit

**Yêu cầu đã giao**

Kiểm việc tạo dữ liệu mẫu từ hai thiết bị, kể cả trường hợp giao dịch đã ghi thành công nhưng thiết bị mất phản hồi.

**AI đã làm**

AI viết công cụ nối kịch bản Playwright với PostgreSQL và chạy trong hai phiên Chromium. AI kiểm hai thứ tự tranh khóa, quyền của phiên và dữ liệu sau khi gọi lại. Lượt cuối đạt 3/3 trên local với cơ sở dữ liệu thật của môi trường thử và bước ghép thiết bị/PIN giả lập.

### AI-T07-LINH-13 — Kiểm dữ liệu thử và xác minh ghép quán T06

**Yêu cầu đã giao**

Kiểm kê dữ liệu staging ở chế độ chỉ đọc trước khi quyết định giữ hay dọn. Linh chọn giữ ba quán thử, yêu cầu rà bằng chứng ghép thiết bị và xác định môi trường mà bài kiểm sử dụng.

**AI đã làm**

AI kiểm kê quán, tài khoản, phiên và dữ liệu phụ thuộc, lập báo cáo và cập nhật checklist theo quyết định giữ quán. AI kiểm bố cục quán demo từ frontend local nối staging, đối chiếu kết quả từ chối thông tin ghép và phiên cũ, rồi cập nhật bằng chứng cho các mục 9.5, 8.7, 8.8 và 0.3.

### AI-T07-LINH-14 — Đồng bộ tài liệu và đối chiếu checklist T06

**Yêu cầu đã giao**

Chọn nhóm việc ngắn nhất trong ba nhóm còn lại của T06 và thực hiện đối chiếu tài liệu theo bằng chứng hiện có.

**AI đã làm**

AI cập nhật tài liệu yêu cầu, kiến trúc, dữ liệu, màn hình, tính năng, giới hạn và kiểm thử. AI đối chiếu 50 mục có bằng chứng lịch sử cùng 7 mục tài liệu, kiểm 72 liên kết và chạy OpenSpec. Sau review, AI sửa các liên kết và giữ mục 0.3 mở tại thời điểm đối chiếu.

### AI-T07-LINH-15 — Chuyển smoke Supabase sang ghép quán thử theo mục 7.5

**Yêu cầu đã giao**

Chuyển năm ca smoke sang ghép một quán thử đã có bằng Store Key, chạy trên staging và hoàn nguyên quyền thu ngân. Giải thích nơi thực thi các tệp SQL liên quan.

**AI đã làm**

AI viết lại bài smoke, sửa cấu hình chạy và mở rộng phép đo Realtime. AI kiểm số phiếu, lịch sử và báo cáo, phân quyền, hủy đơn, thanh toán tách và Realtime. Sau khi sửa các vấn đề từ lượt đầu, năm ca đạt 5/5 trên staging. AI đối soát đơn mở, quyền thu ngân và phiên thử sau khi chạy.

### AI-T07-LINH-16 — Kiểm hồi quy bản vá T06 và sửa pin CI

**Yêu cầu đã giao**

Giữ các tệp SQL trong gói sửa SQL/Edge và hồ sơ T06. Kiểm gói nguồn trên cơ sở dữ liệu thử riêng, giữ kết quả và cách tái hiện trước khi dọn.

**AI đã làm**

AI sửa giá trị băm mà CI dùng để kiểm package.json, đối chiếu sáu tệp SQL/Edge và lập hướng dẫn tái hiện. Kiểm pin đạt 2/2. AI chạy kiểm kiểu, các ca Deno, 12 ca hồi quy lỗi và một ca tranh chấp trên PostgreSQL local với Auth/SMTP giả lập. Lỗi kiểm ranh giới kiến trúc của CI còn mở ở mốc này.

### AI-T07-LINH-18 — Điều tra lỗi CI architectureBoundaries trên hai PR T06

**Yêu cầu đã giao**

Điều tra lỗi trên PR #30 và #32, đối chiếu đúng phiên bản và tái hiện trước khi sửa. Bổ sung loại lỗi và thời lượng ca kiểm, giữ nguyên timeout và độ phủ.

**AI đã làm**

AI đối chiếu nguồn, runner và reporter, dùng hai phép thử đối chứng để phân biệt lỗi timeout với vi phạm kiến trúc. AI bổ sung reporter và test hồi quy. Một lượt CI sau đó ghi nhận timeout 5.059 ms, còn các lượt lỗi cũ thiếu số liệu để kết luận nguyên nhân. Bản sửa cách quét ở PR #36 đã vào main, CI sau merge đạt 18/18 bước và 1.280/1.280 ca unit.

### AI-T07-LINH-19 — Review độc lập PR #30 và #32 trước khi merge

**Yêu cầu đã giao**

Rà hai PR và báo các điểm chặn để Linh quyết định thứ tự merge. Sau khi Linh duyệt #32, cập nhật #30, sửa bước hoàn nguyên quyền thu ngân và chạy hồi quy.

**AI đã làm**

AI rà SQL/Edge, smoke và tương tác giữa hai PR. AI phát hiện bước dọn có thể báo đạt trước khi xác minh quyền đã khôi phục. Sau khi merge #32 theo quyết định của Linh, AI sửa #30, thêm mười ca hồi quy và kiểm hai tình huống bằng Chromium với RPC giả lập. Hai lượt CI cuối đạt 18/18 bước. Ở mốc này, #30 còn chờ Linh duyệt và bản sửa chưa chạy smoke trên staging.

### AI-T07-LINH-20 — Đối chiếu hồ sơ T06 sau khi mã đã vào main

**Yêu cầu đã giao**

Đánh giá thứ tự xử lý PR #31, #33 và #34. Sau các quyết định merge của Linh, đối chiếu lại những điểm tài liệu còn thiếu và trình bản cập nhật.

**AI đã làm**

AI đối chiếu bằng chứng với mã đã vào main, sửa mô tả trạng thái tích hợp và phân biệt gói sáu tệp SQL/Edge với toàn bộ thay đổi của PR #32. AI kiểm liên kết, diff và OpenSpec, cập nhật giới hạn hồi quy ứng viên cùng bằng chứng timeout của đúng lượt CI. Linh duyệt các cập nhật tài liệu ở PR #33 và #35. Lượt đối chiếu dùng kết quả CI đã có.

### AI-T07-LINH-21 — Gỡ luồng tạo quán cũ và hồi quy ứng viên T06

**Yêu cầu đã giao**

Gỡ luồng tạo quán cũ, sửa hai nhãn Preview, chuyển các ca PIN còn áp dụng sang môi trường cô lập. Xác minh liên kết CLI với staging và chạy các ca còn thiếu trên đúng phiên bản ứng viên trước khi trình merge.

**AI đã làm**

AI gỡ signup và bootstrap phía client, sửa giao diện, bổ sung hai ca OTP giả lập và chuyển năm ca giữ phiên PIN sang dữ liệu thử cô lập. AI cấu hình runner GitHub để kiểm đúng phiên bản. Sáu ca hồi quy PIN và phục hồi dữ liệu mẫu đạt trên ứng viên. Năm ca smoke staging đạt trên phiên bản đã ghép quán thử có sẵn. AI xác minh liên kết CLI, cập nhật hồ sơ và đối chiếu CI sau khi Linh duyệt merge PR #37. CI trên main đạt 18/18 bước.

### AI-T07-LINH-22 — Chặn thư Auth mặc định và kiểm chứng thứ tự tra cứu trước cutover T06

**Yêu cầu đã giao**

Xử lý mục 1c.1–1c.2, rà lại bằng chứng cho mục 4.12 và báo phần còn thiếu. Linh chốt giữ thay đổi ở local.

**AI đã làm**

AI chọn Send Email Hook, viết hàm SQL ứng viên và cập nhật hồ sơ T06. AI đối chiếu thời điểm tra cứu với lần tạo quán đầu tiên, kiểm năm loại sự kiện và quyền thực thi trên PostgreSQL local. Việc bật hook, kiểm giao thư và ghép thiết bị sau thay đổi trên staging còn chờ thực hiện.
