# Tài liệu POS Cafe

Điểm bắt đầu để hiểu dự án và viết báo cáo. **Nguồn code đối chiếu: `main@711a22e71983e3d6aa17799649af05ce4c762555`, ngày 25/10/2026.** Đây là trạng thái mã đã tích hợp; không phải xác nhận bản đang chạy trên cửa hàng thật.

## Đường đọc chính

1. [Tổng quan](project-overview.md): bài toán, người dùng, mục tiêu và trạng thái.
2. [Tính năng](features.md) và [phạm vi](phase-scope.md): luồng vận hành, phần có trên main, phần chưa làm.
3. [Kiến trúc](architecture.md) → [dữ liệu](data-model.md): trách nhiệm các lớp, quyền, giao dịch và đồng bộ.
4. [Kiểm chứng](testing.md) và [giới hạn](limitations.md): kết quả nào thuộc nguồn nào, điều gì còn chưa được nghiệm thu.
5. [Lộ trình](roadmap.md): ưu tiên hiện tại và dependency của việc tiếp theo.

## Tra cứu theo công việc

| Cần làm | Nguồn chuẩn |
| --- | --- |
| Viết yêu cầu, tìm mã FR/NFR | [Requirements](requirements.md); hợp đồng chi tiết ở [OpenSpec](../openspec/README.md) |
| Hiểu màn hình và quyền mở màn | [Screens](screens.md) |
| Giải thích lựa chọn công nghệ | [Tech stack](tech-stack.md); [trang học kiến trúc](architecture-explainer.html) là tài liệu giảng giải, không phải bản kiểm chứng runtime |
| Viết khóa luận | [Bản đồ nguồn báo cáo](report-source-map.md) |
| Phát triển và kiểm thử | [CLAUDE.md](../CLAUDE.md), [chiến lược test](test-strategy.md), [quy trình task](workflow/README.md) |
| Tiếp tục công việc đang mở | [Chỉ mục task](workflow/tasks/README.md) |
| Demo | [Runbook](demo-runbook.md), đọc giới hạn fixture/môi trường trước khi chạy |
| Truy vết quyết định/kết quả cũ | [Implementation log](implementation-log/README.md), [archive](archive/README.md) |

## Đọc đúng trạng thái

- **Đã tích hợp:** có trong source main nêu trên. Code chứng minh cấu trúc/hành vi được hiện thực, không tự chứng minh triển khai hoặc nghiệm thu.
- **Đã kiểm chứng:** có kết quả gắn source, lệnh, môi trường và phạm vi cụ thể tại [testing](testing.md).
- **Đã nghiệm thu:** cần quyết định chấp nhận đúng phạm vi; không suy từ merge hay một bộ test xanh.
- **Đã phát hành:** cần version và môi trường đích được xác minh riêng. Backend acceptance, migration và live activation của đợt phân quyền/UI vẫn HOLD.

Khi nguồn mâu thuẫn: yêu cầu/quyết định đã duyệt xác định điều phải làm; source xác định điều đã hiện thực; evidence xác định điều đã kiểm. Không dùng một loại thay cho loại khác. Bộ spec/evidence WIP được hòa giải tại [hồ sơ xuất bản](workflow/tasks/docs-wip-publication-2026-10-25.md); catalog lịch sử giữ source và giới hạn riêng. Bản local gốc vẫn giữ để chờ quyết định dọn, không tự coi là bản chuẩn mới hơn.

## Quy tắc duy trì

| Nội dung | Nơi giữ và cách cập nhật |
| --- | --- |
| Kiến thức hiện hành | Các trang theo chủ đề ở `docs/`; sửa đoạn đã lỗi thời, không nối checkpoint trái nghĩa vào cuối trang |
| Yêu cầu, quyết định feature | `openspec/changes/<change>/`; theo [bộ artifact bắt buộc](../openspec/SPEC-STANDARD.md). Proposal khảo sát không phải spec sẵn sàng code |
| Quyết định/quy trình chung | `docs/workflow/`; một hồ sơ chính, các nơi khác dẫn link |
| Trạng thái task | Một handoff trong `docs/workflow/tasks/` và một dòng chỉ mục; cập nhật phần hiện hành, giữ checkpoint cũ có nhãn lịch sử |
| Kết quả và review | Hồ sơ có source tại `implementation-log/`, `reviews/` hoặc package evidence được task dẫn tới; không nhân bản số test khắp các trang |
| Hướng dẫn đi cùng công cụ | Trên `main`, cạnh công cụ; docs giữ đường dẫn, không giữ bản operator thứ hai |
| Output phát sinh | Mặc định ngoài knowledge base. Chỉ lưu evidence cần chứng minh kết luận, có consumer, source và recipe; không tự đưa toàn thư mục output vào Git |
| Lịch sử | Giữ quyết định, giới hạn và bằng chứng cần truy vết. Archive không đồng nghĩa vô giá trị; xóa/chuyển bằng chứng cần danh sách và quyết định retention cụ thể |

Không đưa source ứng dụng vào docs hoặc merge nhánh docs vào main. Nhánh docs hiện có Markdown, HTML giảng giải và evidence JSON/ảnh/ZIP; không còn đúng khi gọi nó là “Markdown only”. Mỗi lần đổi chủ đề, sửa bản chuẩn và các link liên quan, kiểm link/source, review độc lập rồi xuất bản. Tránh tạo thêm báo cáo chỉ để lặp lại một handoff.
