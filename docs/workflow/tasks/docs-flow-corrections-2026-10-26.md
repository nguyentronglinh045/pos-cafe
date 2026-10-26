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
