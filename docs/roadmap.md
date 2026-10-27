# Lộ trình phát triển

## Khung thời gian đồ án — xác nhận 2026-10-25

Chủ dự án xác nhận **15 tuần thực hiện từ 2026-10-05**, sau đó **tuần 16 bảo vệ trực tiếp với giảng viên**. Nếu tính các tuần 7 ngày liên tiếp: tuần 3 là 2026-10-19 – 2026-10-25; tuần 15 là 2027-01-11 – 2027-01-17; tuần 16 là 2027-01-18 – 2027-01-24. Ngày26/10/2026 thuộc tuần4 theo cùng phép tính. Chưa xác nhận ngày bảo vệ cụ thể, hạn nộp báo cáo riêng hoặc lịch nghỉ/điều chỉnh của trường.

Đầu ra cần đạt: **các chức năng đã đăng ký chạy được trên Vercel và có thể chứng minh chạy kiểm thử ở local**; chủ dự án cũng nêu định hướng bảo toàn các tính năng của đợt trước. [Hồ sơ Q07–Q09](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-thesis-01--thời-gian-và-mức-hoàn-thành-đồ-án) giữ nguồn và phần chưa rõ. Chưa tự phân bổ lại công việc theo tuần hoặc nhận toàn hệ thống đã đạt; các gate triển khai/kiểm thử hiện hành vẫn áp dụng.

<a id="priority-g01-g10-20261027"></a>
## Ưu tiên hiện hành — 27/10/2026

**Tập trung G01–G10; dành công việc chuyên biệt của G11–G12 cho khoảng hai tuần cuối hoặc bước cuối cùng**, theo [quyết định trực tiếp của chủ dự án](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-thesis-02). Chưa ấn định ngày bắt đầu giai đoạn cuối hoặc đổi hạn nộp.

Docs phục vụ phát triển vẫn cập nhật theo từng phần: spec, quyết định, kiến trúc, kết quả kiểm, giới hạn và bàn giao. Giữ nguồn/bằng chứng phát sinh để dùng cho báo cáo sau này; việc hoàn thiện học thuật/trích dẫn, Word/slide và dàn trang thuộc giai đoạn cuối. Các nguyên liệu G11/G12 đã chuẩn bị tiếp tục được giữ.

Mốc mới sau bảng trạng thái26/10 bên dưới: [đợt refactor cấu trúc đã chọn đã hoàn tất](workflow/tasks/refactor-safety-2026-10-25/merge-20261027.md#closure-20261027) trên main052a7d1; CI sau merge PASS. Các phần NO_CHANGE/HOLD và mục tiêu sản phẩm chưa đạt vẫn theo hồ sơ riêng.

<a id="đang-ở-đâu--25102026"></a>
## Đang ở đâu — đối chiếu 26/10/2026

| Nhóm | Trạng thái hiện hành |
| --- | --- |
| Giao thức ghi v1 | Đã có implementation và nghiệm thu lịch sử phase 27; không lấy kết quả đó nhận toàn main mới PASS |
| Phân quyền | Runtime mới trên main711a22e; backend acceptance/toàn hệ thống còn HOLD; spec15/PIN/CI và evidence WIP đã hòa giải, giữ provenance theo từng nguồn |
| UI B01/B02/B03 | Đã merge; [handoff tích hợp](workflow/tasks/ui-main-docs-integration-2026-10-25.md) giữ checks/source |
| Chuẩn hóa | Danh mục/decision/spec/evidence đã chỉnh lý25/10; tổ chức năm nhóm tài liệu26/10 theo handoff riêng, chưa refactor code |
| Phát hành | Không mở deploy/migration/live activation trong lượt này |

[Đối chiếu 12 mục tiêu tốt nghiệp ngày 25/10/2026](workflow/tasks/docs-thesis-audit-2026-10-25.md) bổ sung góc nhìn theo đầu ra đồ án. Thứ tự ở hồ sơ đó là đề xuất, không tự thay deadline, cam kết nghiệp vụ hoặc mở refactor.

[Bảng hiện hành G01–G12](features.md#đối-chiếu-12-mục-tiêu-tốt-nghiệp) là đường tra cứu theo mục tiêu; [đối chiếu spec](spec-reconciliation.md) và [evidence](testing.md#bản-đồ-bằng-chứng) giữ khoảng thiếu cụ thể.

## Làm gì tiếp

1. Bắt đầu từ [bảng công việc G01–G10](workflow/g01-g10-plan.md#next); đây là nguồn trạng thái/dependency để tư vấn việc tiếp theo. Dùng [bảng G01–G12](features.md#đối-chiếu-12-mục-tiêu-tốt-nghiệp), [quyết định](workflow/decisions.md), [spec reconciliation](spec-reconciliation.md) và [testing](testing.md) để chọn từng phần G01–G10 theo dependency và khoảng thiếu đã xác minh.
2. Ưu tiên công việc sản phẩm/kiểm chứng trong G01–G10: tài khoản chủ/email, quyền và giao dịch, UI/mang đi, đồng bộ, triển khai/backup/bảo mật/hiệu năng. Mỗi phần cần phạm vi, expected, kiểm chứng và điều kiện môi trường phù hợp; các HOLD giữ nguyên cho đến khi được xử lý đúng phạm vi.
3. Cập nhật docs ngay theo từng phần G01–G10, giữ nguồn code/evidence và trạng thái đã làm/đã kiểm/đã nghiệm thu/đã phát hành riêng biệt. Không dồn cập nhật spec hoặc hồ sơ kỹ thuật đến cuối.
4. Khi tới khoảng hai tuần cuối hoặc bước cuối cùng, tập trung hoàn thiện G11/G12 từ nguồn đã tích lũy: học thuật/trích dẫn, báo cáo/slide và trình bày theo mẫu trường. Đây là thứ tự đã chốt; ngày cụ thể chưa được ấn định.

Khung thời gian hiện hành là xác nhận 2026-10-25 ở đầu trang. Lịch gốc bắt đầu 2026-08-28, hạn 2026-12-21 và bốn ngày đệm dưới đây được giữ để truy vết, không còn là lịch chính dùng cho đồ án. Chưa tự chuyển các tuần/công việc cũ sang ngày mới hoặc phân bổ lại quỹ giờ. Xác nhận thời gian mới không tự thay quyết định ngân sách dịch vụ miễn phí.


## Tra cứu mục cũ

Các điểm neo được giữ để liên kết cũ vẫn tới được đúng bối cảnh.

| Mục lịch sử | Nguồn nguyên bản |
| --- | --- |
| <a id="hồ-sơ-kế-hoạch-và-lý-do-xếp-thứ-tự"></a>Hồ sơ kế hoạch và lý do xếp thứ tự | [Đọc lịch sử](roadmap-history.md#hồ-sơ-kế-hoạch-và-lý-do-xếp-thứ-tự) |
| <a id="quy-ước-trạng-thái"></a>Quy Ước Trạng Thái | [Đọc lịch sử](roadmap-history.md#quy-ước-trạng-thái) |
| <a id="lịch-gốc-giai-đoạn-1--không-là-trạng-thái-thực-hiện-hiện-nay"></a>Lịch gốc giai đoạn 1 — không là trạng thái thực hiện hiện nay | [Đọc lịch sử](roadmap-history.md#lịch-gốc-giai-đoạn-1--không-là-trạng-thái-thực-hiện-hiện-nay) |
| <a id="cảnh-báo-lệch-lịch-chưa-xử-lý"></a>Cảnh báo lệch lịch, chưa xử lý | [Đọc lịch sử](roadmap-history.md#cảnh-báo-lệch-lịch-chưa-xử-lý) |
| <a id="ánh-xạ-sang-change"></a>Ánh xạ sang change | [Đọc lịch sử](roadmap-history.md#ánh-xạ-sang-change) |
| <a id="vì-sao-thứ-tự-này"></a>Vì sao thứ tự này | [Đọc lịch sử](roadmap-history.md#vì-sao-thứ-tự-này) |
| <a id="cổng-chặn-không-được-bỏ-qua"></a>Cổng chặn không được bỏ qua | [Đọc lịch sử](roadmap-history.md#cổng-chặn-không-được-bỏ-qua) |
| <a id="việc-chạy-song-song"></a>Việc chạy song song | [Đọc lịch sử](roadmap-history.md#việc-chạy-song-song) |
| <a id="lịch-sử-2026-08-30-đổi-nhóm-ca-làm-việc-lấy-nhóm-ngoại-tuyến"></a>Lịch sử 2026-08-30: đổi nhóm ca làm việc lấy nhóm ngoại tuyến | [Đọc lịch sử](roadmap-history.md#lịch-sử-2026-08-30-đổi-nhóm-ca-làm-việc-lấy-nhóm-ngoại-tuyến) |
| <a id="giai-đoạn-2--sau-khi-bảo-vệ"></a>Giai Đoạn 2 — Sau Khi Bảo Vệ | [Đọc lịch sử](roadmap-history.md#giai-đoạn-2--sau-khi-bảo-vệ) |
| <a id="nguyên-tắc-xếp-thứ-tự"></a>Nguyên Tắc Xếp Thứ Tự | [Đọc lịch sử](roadmap-history.md#nguyên-tắc-xếp-thứ-tự) |
| <a id="ghi-chú-khi-chuyển-sang-báo-cáo"></a>Ghi Chú Khi Chuyển Sang Báo Cáo | [Đọc lịch sử](roadmap-history.md#ghi-chú-khi-chuyển-sang-báo-cáo) |
