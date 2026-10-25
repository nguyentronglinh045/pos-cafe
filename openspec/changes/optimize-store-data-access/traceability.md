> **Đối chiếu xuất bản 25/10/2026.** Kế hoạch15/09, chưa xác nhận toàn change đã triển khai. Lô A được duyệt trước đo; store_pulse/60s là lựa chọn ghi nhận, nhưng ngưỡng20MB, lịch và ranh giới còn mở. Ước lượng request/egress bên dưới dựa raw repos/polling cũ, không là số đo main711a22e đang dùng projections/foreground polling. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Ma trận truy vết

| Requirement | Use case | Test case |
| --- | --- | --- |
| **LOAD-01** — Kiểm tra thay đổi theo chu kỳ 5 giây, tải đầy khi version khác | UC-LOAD-01, UC-LOAD-02 | TC-LOAD-02, TC-LOAD-03, TC-LOAD-08, TC-LOAD-09, TC-LOAD-13, TC-LOAD-14, TC-LOAD-17 |
| **LOAD-02** — Lưới an toàn tải đầy vô điều kiện mỗi 60 giây | UC-LOAD-02, UC-LOAD-03 | TC-LOAD-02, TC-LOAD-11 |
| **LOAD-03** — Một lời gọi cho mỗi nhóm dữ liệu đọc | UC-LOAD-04 | TC-LOAD-04, TC-LOAD-05, TC-LOAD-12, TC-LOAD-15 |
| **LOAD-04** — Bộ đếm version phản ánh đủ mọi đường ghi | UC-LOAD-03, UC-LOAD-05 | TC-LOAD-01, TC-LOAD-10, TC-LOAD-16, TC-LOAD-17 |
| **LOAD-05** — Tối ưu policy không được nới cô lập cửa hàng | không có use case, xem giải trình bên dưới | TC-LOAD-07, TC-LOAD-18, TC-LOAD-19, TC-LOAD-20, TC-LOAD-21 |
| **LOAD-06** — Gộp tín hiệu thời gian thực | UC-LOAD-01 | TC-LOAD-06 |
| **LOAD-07** — Trần chi phí đọc đo được | UC-LOAD-02 | Mục "Đo lường kèm theo" trong `testplan.md` |

## Giải trình cho requirement không có use case

**LOAD-05** không có use case riêng. Nó là một ràng buộc bảo toàn: việc viết lại biểu thức policy phải giữ nguyên **chính xác** tập dòng mà mỗi cửa hàng đọc và ghi được. Không có tác nhân nào "thực hiện" ràng buộc này theo nghĩa một luồng thao tác — người dùng không làm gì khác đi trước và sau khi nó được áp.

Nó vẫn kiểm chứng được, và có **năm** test case, trong đó bốn thuộc nhóm bảo mật bắt buộc. Đây đúng diện được phép theo điều kiện sửa ngày 2026-09-07 của `openspec/SPEC-STANDARD.md`: có test case, và có giải trình.

Phần hành vi người dùng quan sát được của việc đụng RLS đã nằm ở UC-LOAD-01 và UC-LOAD-04, vì mọi lượt tải dữ liệu đều đi qua policy.

## Tổng kết

| Chỉ số | Ngưỡng | Hiện tại |
| --- | --- | --- |
| Số requirement chưa có **test case** nào | Phải bằng 0 | **0** |
| Số use case chưa có **test case** nào | Phải bằng 0 | **0** |
| Số requirement chưa có **use case** nào | Nên bằng 0, được khác 0 kèm giải trình | **1** — LOAD-05, đã giải trình ở trên |

## Phủ theo nhóm test bắt buộc

| Nhóm | Requirement được phủ |
| --- | --- |
| Luồng chính | LOAD-01, LOAD-03, LOAD-04, LOAD-05, LOAD-06 |
| Luồng ngoại lệ | LOAD-01, LOAD-02, LOAD-03, LOAD-04 |
| Biên | LOAD-01, LOAD-03, LOAD-04 |
| Bảo mật và quyền | LOAD-05 |

LOAD-07 không thuộc bốn nhóm này vì nó là điều kiện đo lường, không phải hành vi xanh hay đỏ. Nó được đóng bằng bảng số đo trong `docs/testing.md` chứ không bằng một test case.

## Ánh xạ sang mã yêu cầu nền

| Mã trong change | Mã trong `docs/requirements.md` |
| --- | --- |
| LOAD-01, LOAD-02, LOAD-06 | NFR-05 — khả năng khôi phục đồng bộ online. Phát biểu được làm chặt hơn, không bị nới |
| LOAD-03 | NFR-05, và gián tiếp FR-21 |
| LOAD-04 | FR-21 — đồng bộ thay đổi chính giữa nhiều thiết bị |
| LOAD-05 | NFR-02 — cô lập dữ liệu giữa cửa hàng. Giữ nguyên, không đổi |
| LOAD-07 | **NFR-09 — mã mới.** "Chi phí đọc lúc chạy có trần đo được". Phải thêm vào `docs/requirements.md` khi archive change |
