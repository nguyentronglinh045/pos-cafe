# Sửa hình theo review ngữ nghĩa — 26/10/2026

## Phạm vi được giao

Sau khi đọc kết quả chat review chuyên trách, chủ dự án đồng ý đề xuất sửa F04, làm rõ chú thích và ghi riêng khác biệt WIP/DB trên docs. Lượt này cập nhật tài liệu theo code đã push, render các hình bị ảnh hưởng, review độc lập rồi xuất bản docs theo quy trình đang áp dụng. Không sửa/refactor code, tests, DB, cấu hình runtime hoặc expected của spec.

Nguồn bắt đầu: docs `27f8cfb89b52b2a562bf3c59d1806c3ccdd02c1a`, main `711a22e71983e3d6aa17799649af05ce4c762555`, local HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` + WIP. Remote khớp lúc bắt đầu; 544 file WIP có hash trong source manifest của chat review vẫn khớp. Dùng candidate và index riêng ngoài checkout, không tạo worktree hoặc đổi index chính. Checklist `D:/Workspace/pos-cafe-docs-priorities.local.md` giữ local-only.

## Kết quả tài liệu

- F04 sửa nhãn điểm rẽ và hai cạnh retry/lookup theo FIN-01. Các trường hợp get pending rồi execute applied/rejected/expired và replay terminal được lần lại bằng source; đây là kiểm control flow, không chạy RPC.
- F05/F07/F08 làm rõ nhánh PIN, response cũ và tính có điều kiện của signal/refetch. F01/F02/F04 ghi riêng khoảng hở trước begin của WIP. [Critical flows](../../critical-flows.md) vẫn mô tả O là nguồn chính.
- [Bộ hình](../../figures/README.md) trỏ bốn SVG r2; giữ nguyên 16 SVG/config/manifest cũ. Bốn `.mmd` mới khớp trang nguồn; manifest r2 giữ blob/hash và nguồn code. Bản xem PNG chỉ ở artifact local.
- [Hồ sơ review](../../reviews/diagram-semantics-20261026/INDEX.md) đưa kết luận và nguồn vào docs. Mười file báo cáo/manifest/receipt gốc được nhập nguyên byte, có import manifest; link local trong hồ sơ gốc là provenance, không giả rằng checkout khác có raw evidence. Raw source/test/catalog toàn bộ vẫn nằm ở artifact review gốc.

## Những phần không đóng

FIN-WIP-02 vẫn là finding code: W thiếu guard trước begin; sau begin guard coordinator/UI vẫn có hiệu lực. Kết quả 12 mock oracle đạt ở O/lỗi ở W thuộc lượt review trước, không được nhận là test mới hoặc 12 giao dịch W thành công. Hai lần chuẩn bị harness lỗi vẫn được ghi đúng trong hồ sơ gốc.

S staging khác L trong cấu hình frontend local; không đổi env/MCP hoặc kiểm giao dịch DB. Không suy ACK/signal có thứ tự giao nhận, mọi query có poll hoặc mọi stale response gây logout. Không đóng P1-03/N4/H1–H4, backend, deployment, hiệu năng hoặc hardware. Hình kiến trúc và dàn trang theo mẫu trường còn thiếu.

## Kiểm và bàn giao

Dùng lại Mermaid 12.2.0, Playwright/Chromium sẵn có; không cài/tải thêm dependency, browser, WSL hoặc Docker. Browser chỉ tạo trang trống để render Mermaid, chặn network và đóng trong finally; không mở HTML kiến trúc cũ. Kiểm parser/XML, hộp chữ, nguồn/hash, link/anchor, preserved artifacts và main/index/checklist; xem bốn PNG mới ở kích thước gốc. F05 được thêm điểm rẽ kết quả để tránh cạnh đi qua ô khác; F08 thêm nền nhãn par/opt để tránh đường xuyên chữ.

Hai phạm vi review cuối cần bao phủ ngữ nghĩa bốn hình/chú thích theo code và provenance/preservation/visual QA. Verdict/candidate/checklist thật được bổ sung vào receipt sau khi review; không suy APPROVE từ bản trước. Sau verdict chỉ thêm metadata receipt. Chủ dự án chưa được ghi là đã đọc hiểu/nghiệm thu hoặc hoàn thành báo cáo.

## Receipt review cuối — 26/10/2026

Phạm vi: toàn bộ 29 file từ docs `27f8cfb89b52b2a562bf3c59d1806c3ccdd02c1a` tới candidate `75cbd4d4a65e2b38a7f12529944d933d24e9c711`, tree `11d348edc6a0d9432b20707d8308c9b35ae88908`; checklist local SHA256 `f9c4faf931739b983add66a05108be0759279071cd33b9db23173c4f3b1c2fad`. Cả hai reviewer không sửa candidate và đều APPROVE đúng phiên bản này.

| Reviewer | Kiểm độc lập và verdict | Giới hạn |
| --- | --- | --- |
| `/root/review_knowledge` | **APPROVE**. Đối chiếu source `711a22e`: F04 xử lý kết quả execute khi retry, lookup/resume giữ nghĩa riêng; F05 phân nhánh applied/PIN-input/phiên-unknown; F07 phân biệt bỏ response cũ với deadline hiện hành đưa về unavailable; F08 signal có điều kiện, không bảo đảm thứ tự ACK và kiểm quyền sau response. Chú thích F01/F02/F04 và INDEX tách O/W, S/L, giữ FIN-WIP-02 mở. Đã xem bốn PNG; source/.mmd/SVG/PNG/hash khớp, chỉ bốn khối Mermaid đổi, mười file nhập giữ nguyên byte. Không có finding chặn. | Không chạy test/DB hoặc kiểm Word/PDF/A4; không nhận metadata/mock thành runtime PASS. |
| `/root/review_preservation` | **APPROVE**. Xem trực tiếp bốn PNG: chữ/nhánh/mũi tên rõ, không thấy cắt chữ hoặc đường xuyên chữ, nhãn par/opt F08 rõ. Kiểm hash/blob/dòng, SVG XML, mười file nhập nguyên byte, bộ hình/manifest cũ và evidence/spec/code giữ nguyên. 243 link nội bộ, 86 nguồn ghim, 73 link provenance local/dòng hợp lệ; diff-check sạch. 544 hash checkout khớp snapshot; main status/index và checklist live không đổi, mọi tick giữ nguyên. Không có finding chặn hoặc đề nghị sửa. | Không chạy lại renderer/test/DB hoặc kiểm Word/PDF/in; review ngữ nghĩa chi tiết thuộc reviewer còn lại. |

FIN-01 đã được xác nhận sửa trên bản F04 mới. ID-P3–P5 được thể hiện trong F08/F07/F05; không thay hành vi sản phẩm. FIN-WIP-02, nguồn DB L chưa được xác minh và các gate runtime vẫn mở. Verdict trên hồ sơ review trước sửa được giữ riêng trong bản nhập gốc; không thay cho hai verdict của candidate sửa này.

Sau verdict chỉ thêm metadata receipt này. Checklist vẫn ngoài Git; kết quả push thực tế được ghi sau xác minh ở receipt local, không suy review đồng nghĩa đã push hoặc chủ dự án đã nghiệm thu.
