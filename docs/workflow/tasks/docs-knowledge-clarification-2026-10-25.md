# Làm rõ mục đích kho docs và nguồn quyết định — 25/10/2026

## Phạm vi và nguồn xác nhận

Chủ dự án yêu cầu hỏi theo nhóm, ghi nhận câu trả lời và cập nhật docs cho phù hợp. Nội dung được biên tập thành thông tin dự án, không chép nguyên văn hội thoại. Nguồn là câu trả lời trong chat ngày25/10/2026 cho ba câu hỏi về người đọc docs,12 mục tiêu tốt nghiệp và quá trình lựa chọn kiến trúc.

Đây là hồ sơ đang được bổ sung trong quá trình làm rõ. Ngày25/10 là ngày xác nhận thông tin, không tự là ngày ra quyết định kiến trúc ban đầu hoặc ngày giảng viên phê duyệt mục tiêu. Checklist theo dõi vẫn giữ local, không đưa lên Git. Việc cập nhật tài liệu không mở refactor, triển khai chức năng, chạy backend hoặc thay gate nghiệm thu.

## DEC-DOCS-01 — AI là đối tượng khai thác trực tiếp chủ yếu

- **Trạng thái:** đã xác nhận ngày25/10/2026 bởi chủ dự án.
- **Mục đích:** nhánh docs lưu kiến thức về tính năng, quy tắc, thiết kế, quyết định và bằng chứng của dự án. Khi người dùng hỏi về một tính năng, AI tìm thông tin liên quan trong docs và đối chiếu với mã nguồn trên nhánh code khi có implementation phù hợp.
- **Vai trò với báo cáo:** docs cung cấp nguyên liệu có nguồn để tổng hợp báo cáo về sau; bản thân kho tài liệu không phải bản báo cáo tốt nghiệp.
- **Hệ quả biên tập:** ưu tiên tiêu đề/chỉ mục theo tính năng và chủ đề; mỗi nội dung có trạng thái, nguồn và liên kết tới spec, quyết định, code hoặc evidence liên quan. AI cần tìm đúng phần thông tin mà không phải đọc lại toàn bộ nhật ký.
- **Ranh giới nguồn:** yêu cầu và quyết định đã duyệt xác định điều mong muốn; code xác định phần đã hiện thực; evidence xác định điều đã kiểm. Tính năng mới có spec chưa có code vẫn được mô tả với trạng thái thích hợp. Những quy tắc phân biệt nguồn này kế thừa [workflow](../README.md), không phải một cơ chế ưu tiên code hơn requirement mới.
- **Phần chưa chốt:** chưa lựa chọn công cụ tìm kiếm, định dạng dữ liệu mới hay cơ chế tự động hóa nào từ xác nhận này. Cách bố trí file cụ thể tiếp tục theo checklist chỉnh lý và nguồn hiện có.

## DEC-DOCS-02 — Khung12 mục tiêu tốt nghiệp được giảng viên xác nhận

- **Trạng thái:** chủ dự án xác nhận ngày25/10/2026 rằng danh sách12 mục tiêu đã được giảng viên xác nhận và là định hướng đích của đồ án.
- **Nguồn và mức xác minh:** đây là thông tin do chủ dự án cung cấp; lượt này chưa đối chiếu một văn bản xác nhận trực tiếp của giảng viên. Không tự ghi thêm ngày phê duyệt, trọng số chấm điểm, tiêu chí đạt hoặc deadline.
- **Áp dụng:** dùng đúng danh sách G01–G12 trong [bản rà soát](docs-thesis-audit-2026-10-25.md#đối-chiếu-12-mục-tiêu) để đối chiếu tiến độ và khoảng thiếu. Danh sách bao gồm kiểm thử/môi trường, chống trùng/khôi phục thanh toán, vai trò/quyền, kiểm quyền DB, tài khoản chủ/email/tạo quán, recovery/chuyển sở hữu, đổi PIN mặc định, UI, realtime, vận hành/backup/bảo mật/hiệu năng, nguồn học thuật và báo cáo/tài liệu.
- **Giới hạn:** xác nhận mục tiêu không tự xác nhận mọi chi tiết nghiệp vụ trong từng proposal, không thay các quyết định phạm vi đã chốt và không chứng nhận mục tiêu đã hoàn thành. Nếu diễn giải mục tiêu mâu thuẫn với spec đang có, phải chỉ ra và làm rõ phần mâu thuẫn.
- **Hệ quả biên tập:** bảng mục tiêu cần chỉ ra phần đã có, bằng chứng, phần còn thiếu và câu hỏi đang mở; không tự chuyển một mục tiêu sang tùy chọn hoặc hoãn chỉ để khớp hiện trạng code.

## DEC-ARCH-01 — Nguồn của quyết định lựa chọn kiến trúc

- **Trạng thái xác nhận:** chủ dự án xác nhận ngày25/10/2026 rằng mình là người đưa ra quyết định cuối cùng về lựa chọn kiến trúc dựa trên thông tin AI cung cấp.
- **Điều đã biết:** quá trình có sự tham gia hỗ trợ thông tin của AI và quyết định cuối cùng của chủ dự án. Xác nhận này áp dụng cho lựa chọn kiến trúc đang được hỏi, không mở rộng thành việc chủ dự án đã duyệt mọi quyết định kỹ thuật trong kho.
- **Nguồn tài liệu cần đối chiếu:** [tech-stack](../../tech-stack.md#architectural-pattern-hexagonal-architecture--ports--adapters) và [architecture](../../architecture.md#hexagonal-architecture--ports--adapters) mô tả lựa chọn Ports & Adapters theo hướng Hexagonal. Các lý do và đánh đổi đã ghi ở đó tiếp tục là nội dung từ tài liệu hiện có.
- **Chưa được xác nhận trong câu trả lời này:** AI nào/người nào đề xuất ban đầu; thời điểm lựa chọn ban đầu; các phương án thực sự đã được cân nhắc; mức ưu tiên của từng lý do; các đánh đổi chủ dự án đã chấp nhận khi đó. Không coi việc xác nhận người quyết định là xác nhận toàn bộ các chi tiết này.
- **Hệ quả biên tập:** bổ sung nguồn chủ thể ra quyết định; tiếp tục hỏi và đối chiếu hồ sơ cũ trước khi hoàn thiện phần lý do/phương án. Phân tích bổ sung hiện nay phải ghi rõ hồi cứu, không trình bày như một thử nghiệm hay quyết định đã xảy ra trong quá khứ.

## Các câu hỏi tiếp theo về kiến trúc

| Mã | Nội dung cần làm rõ | Trạng thái |
| --- | --- | --- |
| Q04 | Kết quả hoặc ưu tiên nào có vai trò quyết định khi lựa chọn kiến trúc? Những lý do đang ghi có phản ánh đúng động cơ lúc đó không? | Chưa trả lời |
| Q05 | Những phương án nào thực sự đã được đưa ra so sánh, và vì sao không chọn chúng? | Chưa trả lời |
| Q06 | Những đánh đổi nào được nêu và chủ dự án đã chấp nhận khi quyết định? | Chưa trả lời |

Ba câu này chặn việc kết luận đầy đủ về lý do lựa chọn kiến trúc, không chặn cập nhật đối tượng sử dụng docs hoặc khung mục tiêu đã được xác nhận. Không yêu cầu người dùng tự kiểm code để trả lời các câu hỏi về hiện trạng kỹ thuật.

## Ghi nhận cập nhật

Đợt này bổ sung hồ sơ xác nhận; đồng bộ phần mục đích ở docs README, nguồn mục tiêu ở project-overview và chủ thể quyết định ở tech-stack; thêm đường vào task index. Không tích hoàn tất P0-01/P0-02 vì danh mục tính năng, chỉ mục quyết định và các chi tiết kiến trúc còn phải thực hiện tiếp.

### Review đợt ghi nhận đầu

- Reviewer độc lập: `/root/review_preservation`; toàn bộ5file docs và delta checklist local.
- Docs candidate đầu `53d52e8e43bff44b639eae8eb0b7dba5d7d55c39` và candidate sau rebase `2bbfa2c3c6592bdfe5c3a3008dbe2cf398e34b9e`: **APPROVE**, không finding. Đã kiểm tính trung thực với câu trả lời, phạm vi xác nhận, ngày hồi cứu, trạng thái Q04–06, diff và link/anchor; không chạy ứng dụng/backend.
- Checklist candidate đầu `e706da317202427f18fb89b6ec855363be4725a8ae7b936aeab9362746109c6c`: CHANGES_REQUESTED do câu metadata review cũ chưa giới hạn checkpoint. Đã sửa riêng câu đó; candidate `6a07e1a5d69587c307e9ddf221854df87176cc8341980c369fbd96d9d1f4bd4a` được **APPROVE**, finding đóng, không còn finding khác. Checklist không nằm trong commit docs.
- Rebase chỉ giữ thêm hồ sơ đánh giá main và dòng chỉ mục từ công việc đồng thời; reviewer xác nhận4file nội dung và mục chỉ mục của lượt này không đổi, không review lại nội dung công việc kia.
- Kiểm tác giả: `git diff --check` PASS;65link tương đối trong5file sửa không có lỗi path/anchor. Sau APPROVE chỉ bổ sung metadata review này và metadata tương ứng ở checklist.
- Đợt ghi nhận đã được kiểm; hồ sơ vẫn mở để nhận câu trả lời tiếp theo. Verdict không chứng nhận đã hoàn tất P0–P2 hoặc mở quyền triển khai/phát hành.
