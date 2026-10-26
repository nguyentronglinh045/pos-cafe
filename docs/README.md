# Tài liệu POS Cafe

Kho tri thức để AI tra cứu tính năng, thiết kế, quyết định và bằng chứng, kết hợp đối chiếu mã nguồn khi có implementation liên quan. Nội dung đồng thời là đầu vào để tổng hợp báo cáo sau này. [Mục đích và nguồn xác nhận](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-docs-01--ai-là-đối-tượng-khai-thác-trực-tiếp-chủ-yếu). **Nguồn code đối chiếu: `main@711a22e71983e3d6aa17799649af05ce4c762555`, ngày 25/10/2026.** Đây là trạng thái mã đã tích hợp; không phải xác nhận bản đang chạy trên cửa hàng thật.

[Rà soát theo 12 mục tiêu tốt nghiệp — 25/10/2026](workflow/tasks/docs-thesis-audit-2026-10-25.md): hiện trạng, khoảng thiếu, lỗi tài liệu và thứ tự chỉnh lý đề xuất; chưa là nghiệm thu sản phẩm.

## Đường đọc chính

1. [Tổng quan](project-overview.md): bài toán, người dùng, mục tiêu và trạng thái.
2. [Tính năng](features.md) và [phạm vi](phase-scope.md): luồng vận hành, phần có trên main, phần chưa làm.
3. [Chỉ mục quyết định](workflow/decisions.md) → [Kiến trúc](architecture.md) → [dữ liệu](data-model.md): trách nhiệm các lớp, quyền, giao dịch và đồng bộ.
4. [Kiểm chứng](testing.md) và [giới hạn](limitations.md): kết quả nào thuộc nguồn nào, điều gì còn chưa được nghiệm thu.
5. [Lộ trình](roadmap.md): ưu tiên hiện tại và dependency của việc tiếp theo.

## Tra cứu theo công việc

| Cần làm | Nguồn chuẩn |
| --- | --- |
| Tính năng A đang ở đâu, có gì còn thiếu? | [Danh mục tính năng và mục tiêu](features.md#danh-mục-tra-cứu) → FR/spec/decision/evidence |
| Spec và code khác nhau, đọc cái nào? | [Đối chiếu 16 capability và delta](spec-reconciliation.md) |
| Phần tiểu luận cũ còn được bảo toàn không? | [Ma trận21 FR/8 NFR](regression-map.md): scenario/UC → ca kiểm → evidence/khoảng thiếu; không suy danh mục là PASS |
| Viết yêu cầu, tìm mã FR/NFR | [Requirements](requirements.md); hợp đồng chi tiết ở [OpenSpec](../openspec/README.md) |
| Hiểu màn hình và quyền mở màn | [Screens](screens.md) |
| Giải thích lựa chọn công nghệ | [Chỉ mục quyết định và nguồn chốt](workflow/decisions.md), [Tech stack](tech-stack.md); [trang giải thích kiến trúc hiện hành](architecture-explainer.html) có bản đồ tầng, ranh giới quyền và luồng đọc/thanh toán ghim source; không là bằng chứng runtime |
| Tra nghĩa thuật ngữ, bảng/cột và ràng buộc | [Thuật ngữ](glossary.md) → [Mô hình/ERD](data-model.md) → [Từ điển dữ liệu](data-dictionary.md); mô hình source và [đối chiếu catalog staging](implementation-log/staging-schema-20261026/README.md); không thay nghiệm thu backend |
| Hiểu luồng tiền, retry/recovery, PIN/quyền và realtime | [Tám sơ đồ luồng hiện hành](critical-flows.md), kèm ranh giới transaction và nguồn code/DB; [bộ SVG đã render](figures/README.md) gồm ERD/luồng |
| Hòa giải seed, Settings và trạng thái khóa cửa hàng | [R06-A/B/C](spec-reconciliation.md#r06-detail): yêu cầu gốc → code/metadata → quyết định26/10 và phần còn phải làm |
| Tìm cơ sở học thuật cho một luận điểm | [C01–C11 và thẻ nguồn R/S](references.md#claims): phần đã đọc, vị trí và giới hạn |
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

Khi nguồn mâu thuẫn: yêu cầu/quyết định đã duyệt xác định điều phải làm; source xác định điều đã hiện thực; evidence xác định điều đã kiểm. Không dùng một loại thay cho loại khác. Bộ spec/evidence WIP được hòa giải tại [hồ sơ xuất bản](workflow/tasks/docs-wip-publication-2026-10-25.md); catalog lịch sử giữ source và giới hạn riêng. [WIP đã đối chiếu và đồng bộ](workflow/tasks/docs-worktree-sync-2026-10-25.md), sau đó [worktree docs cuối đã được xóa](workflow/tasks/docs-worktree-cleanup-2026-10-25.md). Tài liệu/hướng dẫn vẫn đọc được từ nhánh docs bằng Git hoặc GitHub;16 snapshot khác và lịch sử local giữ riêng để xem xét, không tự coi là bản chuẩn mới hơn.

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

## Cập nhật một chủ đề sau khi có thay đổi

1. Khóa nguồn code và docs, kiểm WIP; không dùng ngày file làm bằng chứng mới hơn.
2. Sửa mô tả/trạng thái ở features, nối FR/NFR và spec delta; chỉ sửa expected khi có quyết định phù hợp.
3. Ghi quyết định/lý do ở hồ sơ chính, cập nhật chỉ mục quyết định và bảng reconciliation nếu thay thế một phần cũ.
4. Ghi evidence theo source/môi trường hoặc nhãn thiếu ở testing; không sao chép test counts sang mọi trang.
5. Kiểm liên kết/nguồn, review theo workflow, cập nhật handoff và trạng thái checklist. Phát hành/cleanup chỉ trong phạm vi được giao.

[Lượt áp dụng ngày25/10](workflow/tasks/docs-knowledge-reconciliation-2026-10-25.md) dùng quy trình này cho danh mục/decision/spec/evidence, giữ lịch sử và danh sách đề nghị tổ chức lại riêng; không thêm gate hoặc bộ artifact mới cho sửa nhỏ.

## Điểm vào sau tổ chức26/10

[CI/CD](../openspec/changes/setup-project-ci-cd/proposal.md#điểm-vào-hiện-hành--26102026) · [Các đợt UI](ui-evolution.md) · [Enforcement còn lại](../openspec/changes/enforce-permissions-at-database/proposal.md) · [Lịch sử kế hoạch](roadmap-history.md) · [Checkpoint kiểm thử](testing-history.md). [Handoff26/10](workflow/tasks/docs-reorganization-2026-10-26.md) ghi quyền xử lý, nội dung thay thế và kiểm/review.
