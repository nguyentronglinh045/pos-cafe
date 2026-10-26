# Hoàn thiện gói đầu vào báo cáo — 26/10/2026

## Phạm vi và nguồn

Chủ dự án yêu cầu “làm tiếp phần tiếp theo đi” sau lượt kiến trúc; session tiếp tục chỉ cập nhật docs theo nguồn thực tế, không sửa code/DB/refactor. Phần độc lập tiếp theo là hoàn thiện đường tra cứu và chú thích phục vụ viết báo cáo; Word/slide theo mẫu trường và kiểm sản phẩm không được tự mở từ yêu cầu này. Quyền kiểm/review rồi push docs đã được giao trong session.

Docs nền `fece5ec3fe0edfb6e1d8e52064c30e9c866d7b13` khớp remote; code source vẫn `711a22e71983e3d6aa17799649af05ce4c762555`. Local main HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP giữ nguyên; không checkout/stash/reset/clean hoặc tạo worktree docs. Source/hình/evidence gốc được dẫn lại, không chạy lại app, DB, browser hay renderer. Không bổ sung nguồn học thuật chưa đọc hoặc lập danh sách chờ mới.

## Kết quả

- [Report source map](../../report-source-map.md) nối chủ đề với yêu cầu/quyết định, hiện trạng/hình/cơ sở và evidence/giới hạn. Các mục tiêu vẫn tra G01–G12 ở features; không tạo bộ requirement hoặc danh mục tài liệu tham khảo cạnh tranh.
- [Gallery](../../figures/README.md#chu-thich) có đủ chú thích cho 18 hình hiện hành, hướng dẫn giữ ranh giới FK, transaction, phiên/quyền, signal và nguồn O/W/S/L. Chỉ bổ sung văn bản; Mermaid/SVG/manifest/config không đổi.
- Sửa mô tả G11/G12 chưa theo kịp các gói N3/hình; sửa câu ERD-06 còn ghi chưa hòa giải R06 dù đã có quyết định. Không đổi requirement, scope PIN/owner hoặc bằng chứng nghiệm thu.
- testing/README/index dẫn tới đầu vào hiện hành. Tách rõ các việc tiếp theo: mẫu trường/Word/slide/nhãn dàn trang; screenshot và evidence runtime; chi tiết N4/owner khi chọn triển khai; kiểm HTML H1–H4. FIN-WIP-02 còn mở.

## Rà điều kiện P1-03

Checklist local xác định P1-03 là chuẩn bị nguyên liệu có cấu trúc: thống nhất thuật ngữ; kiến trúc/dữ liệu/luồng; nối luận điểm với requirement/decision/evidence/hình/nguồn học thuật và chỉ rõ phần thiếu. Điều kiện gốc loại Word/slide/đánh số chương/văn phong luận văn khỏi cấu trúc bắt buộc của kho docs; phần P0-04/N5 cũng không bắt chạy sản phẩm chỉ để hoàn tất bản đồ tài liệu.

| Điều kiện đầu vào | Nơi đáp ứng / giới hạn |
| --- | --- |
| Thuật ngữ và mô hình có nguồn | [Glossary](../../glossary.md), [architecture](../../architecture.md), [data model](../../data-model.md), [dictionary](../../data-dictionary.md). Mô hình source khác metadata đích và runtime. |
| Hình kiến trúc/dữ liệu/luồng có thể truy lại | [18 hình](../../figures/README.md) và ba manifest; các receipt trước giữ parser/render/visual/semantic review đúng candidate. Lượt này không mượn chúng làm lần kiểm hình mới. |
| Chủ đề/luận điểm nối tới nguồn sử dụng | [Source map](../../report-source-map.md), [quyết định](../decisions.md), [C01–C11](../../references.md#claims) với vị trí đã đọc. Không nhận đã đọc toàn nguồn hoặc hoàn tất format trích dẫn trường. |
| Kết quả và phần thiếu không phải suy từ code | [Testing](../../testing.md), [21 FR/8 NFR](../../regression-map.md), [spec reconciliation](../../spec-reconciliation.md), [limitations](../../limitations.md). Giữ PASS/FAIL/NOT_RUN theo nguồn và các gate mở. |
| Bước tiếp theo có điều kiện rõ | [Bảng phần còn lại](../../report-source-map.md#ngoai-docs). Không tự điền kết quả đo, usecase owner còn khung hoặc vượt từ chối preview HTML. |

Vì các điều kiện trên thuộc kho tài liệu đã có đầu ra, candidate checklist tích **P1-03 hoàn tất phần chuẩn bị nguồn**. Đây là điều chỉnh trạng thái theo tiêu chí gốc, không hạ tiêu chí hoặc nhận Word/sản phẩm hoàn tất. Các receipt cũ nói P1-03 còn mở giữ nguyên ngày/bối cảnh; N4/H1–H4 và FIN-WIP-02 không được đóng. Việc cập nhật kiến thức sau thay đổi code/DB vẫn tiếp diễn.

## Kiểm và review

Kiểm diff/đường dẫn/anchor/source ref, đủ 18 ID/chú thích và liên kết SVG hiện hành; đối chiếu hình/manifest và khối Mermaid nguyên byte với docs nền; refs, HEAD/index/status main và source snapshot không đổi. Checklist ngoài Git chỉ đổi tick P1-03, giữ mọi tick khác và lịch sử, thêm bản ghi giải thích tiêu chí; không sửa file live trước review. Không có lượt test app/DB hoặc render/preview mới.

Hai reviewer độc lập: (1) tính đúng của mapping/chú thích/phạm vi và cơ sở đóng P1-03; (2) bảo toàn nguồn/hình/evidence, liên kết và checklist. Cần cả hai APPROVE đúng candidate cuối; receipt metadata bổ sung sau verdict. Không coi việc có sẵn bộ hình là tự thông qua review lượt này.

Chưa tạo báo cáo hoặc khẳng định chủ dự án đã đọc/hiểu toàn bộ nguồn. Khi viết báo cáo, đường đọc đã chuẩn bị là chủ đề → quyết định/hiện trạng → hình/cơ sở → evidence/giới hạn.
