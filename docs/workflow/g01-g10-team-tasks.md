# Phiếu công việc nhẹ cho Ngọc và Lâm

Đọc cùng [bảng G01–G10](g01-g10-plan.md#board); trạng thái chuẩn giữ ở bảng đó. Hai người hỗ trợ được chủ dự án xác nhận27/10/2026: **Võ Văn Ngọc**, **Trần Thị Lâm**. Đây là gợi ý phân công để có đóng góp thật, vừa sức; chưa giao trực tiếp hoặc ghi nhận ai đã làm xong. Linh nhận và kiểm kết quả, chịu phần code/DB/permission/payment/deploy.

<a id="principles"></a>
## Cách giao việc để mỗi bạn có thể giải thích kết quả

Mỗi gói bắt đầu bằng nguồn đọc hoặc build/URL/fixture do Linh cung cấp, một danh sách nhỏ cần kiểm và một đầu ra. Có thể dùng AI để giải thích thuật ngữ, sắp xếp phiếu và rà chỗ thiếu; người thực hiện phải tự đọc/quan sát, sửa dữ kiện và chỉ nhận việc mình đã làm. Gói 60–90 phút là đề xuất để bắt đầu, không ghi thành giờ công thực tế.

Chat [Rà soát code và báo cáo tuần](codex://threads/01a16def-37c8-77d0-88e5-af5e502cbf21) ghi nhận giảng viên yêu cầu mỗi sinh viên tự viết phần báo cáo và minh chứng dùng link đầy đủ. Vì vậy giữ phiếu công việc/số liệu/ảnh để mỗi bạn tự diễn đạt; không cung cấp đoạn báo cáo ngôi “em” để nộp thay. Có minh chứng không bảo đảm được giảng viên chấp nhận; nội dung phải giải thích được.

<a id="week4"></a>
## Gói bắt đầu trong tuần4

| Người / gói | Việc cụ thể | Đầu ra để Linh nhận | Điều kiện và ranh giới |
| --- | --- | --- | --- |
| Ngọc — N01 | Đọc bốn luồng bàn → gọi món → thanh toán → mang đi trong nguồn Linh giao; viết 6–8 kịch bản thao tác ngắn và câu hỏi chỗ chưa rõ | Một bảng bước thao tác/kết quả mong đợi/nguồn; đủ cả bốn luồng, ít nhất một lỗi/biên và một trường hợp thiếu quyền. Chưa chạy phải ghi “kịch bản chuẩn bị”, không PASS | Làm được trước khi có môi trường. Linh chốt expected theo spec; Ngọc không tự quyết định nghiệp vụ. |
| Ngọc — N02 | Tự chạy gói đã được Linh duyệt trên build test và thiết bị thật; quan sát chạm, bàn phím ảo, nội dung tràn, drawer/selection | Phiếu từng ca PASS/FAIL/NOT_RUN, thiết bị/browser/orientation/source; ảnh cho lỗi/điểm cần đối chiếu và tối đa3 vấn đề ưu tiên có bước tái hiện | Chỉ bắt đầu khi có URL/build, dữ liệu giả và tài khoản/role thử do Linh cấp. Chỉ tiền giả, không giao dịch/dữ liệu thật. Quan sát UX không thay phép kiểm server. |
| Lâm — L01 | Đi theo 12–15 liên kết được Linh chọn: đường đọc bốn màn, spec, kết quả test và nguồn code; mở từng link, đối chiếu tiêu đề/phạm vi/source | Bảng URL đầy đủ → mở được/không mở được/thiếu quyền → nội dung khớp/chưa rõ → đề nghị sửa; ghi ngày và lỗi cụ thể | Không cần đọc hiểu thuật toán. Link bị từ chối quyền khác link hỏng. Không ghi “đã kiểm toàn dự án” từ mẫu nhỏ. |
| Lâm — L02 | Nhờ AI lập bản nháp inventory cho tối đa15 entry point npm/script/config/operator guide do Linh chọn, rồi đối chiếu từng tên với nguồn | Bảng tên/mục đích theo nguồn/đường gọi thấy được/chưa biết; danh sách link hoặc hướng dẫn khó hiểu. Đây là input T03 | Không kết luận file thừa chỉ vì không tìm thấy import; không xóa/di chuyển/chạy script lạ hoặc sửa cấu hình. Linh kiểm consumer/trust trước mọi quyết định. |

**Giao trước:** N01 cho Ngọc, L01 cho Lâm. Nếu chưa có test build, Ngọc hoàn thiện kịch bản và câu hỏi; không yêu cầu tự dựng backend. Nếu nguồn L01 có link private, Linh cung cấp phần đã redacted hoặc ghi “chưa truy cập”, không xin/chia sẻ service key.

Nguồn gợi ý: [features](../features.md#danh-mục-tra-cứu), [screens](../screens.md), [regression map](../regression-map.md), [testing](../testing.md), [refactor closeout](tasks/refactor-safety-2026-10-25/merge-20261027.md#closure-20261027). Linh giới hạn phần cần đọc cho từng gói, không giao đọc hết docs.

<a id="later"></a>
## Gói theo tính năng mới

- **N03 — Ngọc:** khi T06/T08/T09 có build, thử theo kịch bản email/OTP/tạo quán/khôi phục do Linh duyệt bằng tài khoản thử do chính bạn kiểm soát. Ghi thời điểm/thông báo và bước gây nhầm; không chụp OTP/Store Key/email nhạy cảm vào hồ sơ công khai. Khi T12 sẵn sàng, hỗ trợ thao tác thiết bị thứ hai theo cue của Linh, ghi thời gian quan sát và trạng thái; Linh thiết kế phép đo và phân tích kỹ thuật.
- **L03 — Lâm:** rà hướng dẫn thao tác tương ứng bằng góc nhìn người mới: chỗ thiếu bước, nhãn khác UI, cách báo lỗi, link/ảnh sai phiên bản. Có thể kiểm email vào inbox/spam trên tài khoản thử của mình khi Linh đã cấu hình và giao phép thử; không tự cấu hình SMTP, quản lý App Password hoặc gửi email hàng loạt.
- Gói tiếp theo chọn theo feature đã sẵn sàng; không giao cùng một bảng cho hai người chỉ để nhân số đầu việc. Có thể đổi người khi phù hợp, ghi lại người thực hiện thật.

<a id="input"></a>
## Phiếu Linh phải cung cấp trước phần chạy thử

| Trường | Nội dung cần điền |
| --- | --- |
| Gói/người | N02, N03 hoặc L03; tên người nhận; mục tiêu của lần thử |
| Source/môi trường | Commit hoặc build ID, URL, mode mock/staging; ngày và người cấp |
| Dữ liệu/tài khoản thử | Tên fixture/store/role được phép dùng; bí mật trao kênh riêng, không đưa vào docs |
| Kịch bản | Các bước, input và expected đã được Linh đối chiếu spec; hành động nào được phép |
| Phạm vi ảnh/log | Chụp gì, bỏ/che gì, nơi lưu; không đưa credential, OTP, Store Key hoặc dữ liệu khách thật |
| Dừng khi | URL/build không khớp; gặp dữ liệu thật; yêu cầu quyền/cài đặt ngoài gói; thao tác không hiểu; kết quả sai cần ghi rồi báo Linh |
| Nơi trả kết quả | File/phiếu riêng do Linh chọn, không sửa cùng file chuẩn trong lúc AI đang cập nhật |

N01/L01/L02 chỉ đọc và chuẩn bị không cần tài khoản quản trị. Người hỗ trợ không tự sửa code/test expected, reset DB, apply migration, đổi quyền, deploy hoặc nhận gate backend đạt.

<a id="result"></a>
## Mẫu ghi kết quả thực hiện

```markdown
# Kết quả gói <N01/N02/L01/...>
- Người làm / ngày / thời gian thực tế:
- Đầu vào: link tài liệu, commit/build và môi trường (nếu có):
- Phần tự thực hiện:
- AI hỗ trợ phần nào:
- Chưa thực hiện / lý do:

| ID | Mục/ca đã kiểm | Bước hoặc phép đối chiếu | Mong đợi + nguồn | Kết quả quan sát thật | PASS/FAIL/NOT_RUN hoặc trạng thái link | Minh chứng |
| --- | --- | --- | --- | --- | --- | --- |

- Vấn đề cần Linh kiểm: vị trí, bước tái hiện, ảnh/link; không đoán nguyên nhân code.
- Điều còn chưa hiểu / câu hỏi:
- Linh xác minh: chưa kiểm / đã kiểm phạm vi nào, ngày và link phản hồi.
```

Với N01, cột thực chạy ghi “chưa chạy”; với L02, không dùng PASS để chứng nhận script chạy được. URL phải đầy đủ, không rút SHA thành dấu “…”. Mỗi bạn giữ nguyên phiếu gốc; bản tổng hợp ghi rõ ai thực hiện và ai kiểm.

<a id="handoff"></a>
## Khi nào gói được nhận?

1. Đầu ra đúng phạm vi và có nguồn đủ để Linh lặp lại/đối chiếu; không điền kết quả bằng suy đoán của AI.
2. Người thực hiện giải thích được ít nhất một ca/mục đã kiểm, một kết quả và phần chưa biết. Không bắt tạo “lỗi” nếu thử đúng không có lỗi.
3. Linh đọc phiếu, kiểm lại điểm quan trọng, sửa phân loại nếu cần và phản hồi. Sau đó Linh/AI cập nhật hàng task, link kết quả và người làm thật trong bảng G01–G10.
4. Khi dùng làm đầu vào task kỹ thuật, workflow/review tương ứng vẫn áp dụng. Phiếu người hỗ trợ không thay reviewer độc lập hoặc nghiệm thu tiền/quyền/backend.
5. Báo cáo tuần do từng sinh viên tự viết từ kết quả thật. AI có thể giúp kiểm số liệu/link và chỉ chỗ chưa rõ; không tính phần lên kế hoạch hoặc đọc tài liệu là đã triển khai/chạy thử.
