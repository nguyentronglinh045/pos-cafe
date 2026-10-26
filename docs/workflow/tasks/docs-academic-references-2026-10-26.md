# N3 — Tài liệu tham khảo theo luận điểm

Ngày26/10/2026. [Nguồn chuẩn](../../references.md) · [Bản đồ báo cáo](../../report-source-map.md) · [N2 trước đó](docs-critical-flows-2026-10-26.md).

## Đề bài và quyền thực hiện

Chủ dự án yêu cầu push phần2 đã review rồi làm phần3, bổ sung tài liệu tham khảo học thuật theo từng luận điểm; chỉ docs, không sửa code hoặc DB. Đã push đúng tip N2 `d75e41ec40a3287da054b023594fb087d412d983` lên origin/docs và kiểm remote khớp. Gói N3 được viết, kiểm/review và commit local; chưa xem yêu cầu push N2 là quyền push phần mới.

Docs base d75e41e; nguồn code ghim main`711a22e71983e3d6aa17799649af05ce4c762555`, main local HEAD`5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP được giữ. Không checkout/switch/stash/reset/clean, tạo worktree docs hoặc sửa index chính. Dùng snapshot ngoài repo và index riêng để ghi nhánh docs.

## Phạm vi và quyết định biên tập

1. Chọn tám nguồn nền tảng: sáu bài báo học thuật (Parnas, Härder/Reuter, Birrell/Nelson, Sandhu và cộng sự, Saltzer/Schroeder, Inozemtseva/Holmes), một technical report của Cockburn và một đoạn sách Vernon. Không gọi cả tám là bài báo phản biện.
2. NIST/OWASP là hai chuẩn đối chiếu riêng; không dùng để nhận tuân thủ. Có C01–C11 → vị trí nguồn → chỗ áp dụng → giới hạn. Tám thẻ R và hai thẻ S là danh mục chuẩn duy nhất, những trang khác chỉ liên kết.
3. Giữ26nguồn đề xuất cũ trong backlog, thu hẹp phần “dùng ở đâu” thành câu hỏi đọc. Không xóa evidence hoặc requirement. Bỏ suy diễn quá mức về exactly-once, isolation, OCC, fitness functions và PIN; không thay quyết định nghiệp vụ.
4. Kiểu IEEE/APA và mẫu trường chưa biết; dùng metadata trung tính, không chặn việc đọc. Các nguồn có trang PDF không nhất thiết có pagination ấn bản; ghi riêng, không đoán. Phần chưa đọc không được tự thành danh mục cuối.
5. Checklist `D:/Workspace/pos-cafe-docs-priorities.local.md` giữ ngoài Git. N3 chỉ tích sau kiểm/review. P1-03, N4/N5, H1–H4 giữ mở; chưa render/xuất hình Mermaid hoặc visual QA HTML.

## Cách đọc và kiểm nguồn

Đọc nguồn gốc tác giả/nhà xuất bản, bản bài báo do trường hoặc NIST lưu, chuẩn chính thức. R01 đọc bản HTML số hóa có cảnh báo sai khác; R06 đọc text bản tác giả revised1995, không gán trang tạp chí1996. R02/R07 và S01/S02 đọc HTML/Markdown. Với R03/R04/R05/R08 đọc đoạn PDF liên quan và kiểm ảnh trang được nêu trong thẻ; không nhận đã đọc toàn bộ sách/bài.

Một số endpoint DOI/ACM và tải PDF bị403/406/timeout; dùng bản tác giả/trường truy cập công khai và ghi đúng bản đọc. Helland Queue vẫn ở backlog, không nhận đã đọc khi truy cập lỗi. Web screenshot không cung cấp ảnh trong phiên; dùng PyMuPDF/Poppler có sẵn để xem các PDF tải được, không cài gói. PDF/ảnh đọc nằm ngoài Git phục vụ review, chỉ metadata và diễn giải ngắn được đưa vào docs; không xuất bản lại toàn văn.

Đối chiếu các liên hệ với architecture/testing/F01–F08 và source ghim. Không gọi MCP/SQL, thay DB, chạy app/test/backend/lab hoặc nhận metadata staging cũ thành kiểm mới. Giữ nguyên mọi evidence cũ, spec/testplan và gate. N3 chỉ thêm cơ sở diễn giải; các gap hiện thực/nghiệm thu vẫn theo tài liệu hiện trạng.

Kiểm trước review: diff whitespace, liên kết nội bộ/anchor, tham chiếu source ghim (path/line), đủ11claim/10thẻ, bảo toàn tên33nguồn cũ (7nguồn chuyển sang thẻ,26nguồn backlog), thay đổi chỉ các Markdown được chọn và checklist tickN3/append. Hai reviewer chỉ đọc: tính đúng nguồn/claim và preservation/phạm vi. Receipt sau review ghi kết quả thật, không coi kế hoạch là PASS.

## Đường đọc cho chủ dự án và phần còn lại

Đọc bảng C01–C11 trước, mở thẻ R/S khi cần giải thích; dùng source map để lấy đầu vào báo cáo. Đã cung cấp đường đọc, chưa nhận chủ dự án đã đọc/hiểu hoặc nghiệm thu. N4/N5 làm khi được giao tiếp; mẫu trường, nguồn backlog cần cho luận điểm mới, hình xuất bản và bằng chứng sản phẩm còn riêng.

## Receipt hoàn tất đầu ra N3 — 26/10/2026

Hai reviewer độc lập **APPROVE** candidate `060f4176e542c1f4d6bff428320dfb7c1dfa6f22`, base `d75e41ec40a3287da054b023594fb087d412d983`, checklist SHA256 `db287fc0f2c7d9077aa266cfadf982eb81a747e3591c103e2c4f2d23c0dfd181`.

| Reviewer | Phạm vi và kết quả |
| --- | --- |
| `/root/review_knowledge` | C01–C11, các nguồn R/S, vị trí đọc và giới hạn; đối chiếu nguồn gốc online cùng các đoạn code ghim trọng yếu. APPROVE, không có finding chặn. |
| `/root/review_preservation` | Authorization, preservation, provenance, navigation và checklist; giữ đủ 33 nguồn cũ, bốn PDF local khớp hash, link/source hợp lệ. APPROVE, không có finding. |

Candidate đầu `8c1b0457200ed1b734915799ab1735c712c134c1` đã được cả hai duyệt. Một điểm biên tập không chặn do tác giả tự phát hiện và reviewer knowledge xác nhận: đổi “sách NIST/ASVS” thành “chuẩn NIST/ASVS”. Hai reviewer đã kiểm delta và xác nhận lại candidate cuối; không còn finding.

Kiểm cuối đúng candidate: **8 Markdown, 231 liên kết nội bộ, 75 tham chiếu code ghim, 11 luận điểm, 10 thẻ nguồn, 26 nguồn backlog**; diff-check sạch. Diff chỉ trong allowlist docs; main WIP, mọi spec/requirement và evidence cũ giữ nguyên. Checklist chỉ tích N3 và thêm nhật ký. Sau verdict chỉ bổ sung metadata receipt này, không đổi nội dung đã duyệt.

Không nhận đã đọc toàn văn mọi sách/bài, kiểm bản in gốc R01, mọi trang ảnh PDF, runtime/DB/bảo mật hoặc tuân thủ. N3 hoàn tất đầu ra tài liệu, commit local và **chưa push**. Phần N2 đã xuất bản tại d75e41e theo yêu cầu ở đầu lượt. P1-03/N4/N5/H1–H4, mẫu trích dẫn và evidence sản phẩm còn theo trạng thái riêng.
