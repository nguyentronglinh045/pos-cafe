# Thesis Report Source Map

Nguồn phân tích/thiết kế bổ sung: [permission15](../openspec/changes/redesign-permission-model/proposal.md), [forced-PIN](../openspec/changes/force-default-pin-change/proposal.md), [catalog evidence](workflow/evidence/docs-wip-publication-20261025/catalog.md). [Danh mục học thuật](references.md) vẫn là đề xuất chưa xác minh bản in/số trang/quy cách; không dùng như tài liệu đã đọc hoặc trích dẫn cuối.

Nhánh `docs` là **nguồn dữ liệu để viết báo cáo**, không phải bản Word hoàn chỉnh. Nguồn implementation đối chiếu ngày **25/10/2026** là `main@711a22e`. Source code, expected của spec và kết quả kiểm là ba loại bằng chứng khác nhau; main không mặc nhiên là bản đã phát hành.

## Quy Tắc Cứng Cho AI Tổng Hợp Báo Cáo

Khi dùng nhánh này để viết báo cáo tiểu luận, AI **không được sao chép hoặc đưa trực tiếp artefact triển khai vào nội dung báo cáo**, gồm:

- Source code hoặc code snippet.
- Tên/đường dẫn file, folder và test file trong repository.
- Tên class, function, hook, component hoặc biến nội bộ.
- Commit hash, branch, pull request hoặc lịch sử Git.
- Tên/số từng migration như `001`–`013`, nội dung SQL hoặc migration ledger.
- Lệnh terminal, package config, environment variable hoặc chi tiết setup nội bộ.

Các artefact trên chỉ được dùng nội bộ để:

- Kiểm chứng một claim là đúng với code hiện hành.
- Suy ra bảng, trường, kiểu dữ liệu, PK/FK, quan hệ và constraint cuối cùng.
- Hiểu luồng nghiệp vụ, transaction, phân quyền, kiểm thử và giới hạn.
- Hỗ trợ triển khai hoặc bảo trì dự án, không phải làm nội dung báo cáo.

Khi chuyển thông tin sang báo cáo, AI phải diễn đạt ở mức **bài toán, yêu cầu, thiết kế, kiến trúc, mô hình dữ liệu, thuật toán/luồng nghiệp vụ và kết quả kiểm thử**. Dùng văn xuôi, bảng, ERD, flowchart hoặc pseudocode khái quát; không thay bằng code thật.

Riêng chương cơ sở dữ liệu:

- Trình bày trạng thái schema cuối cùng, không kể lịch sử từng migration.
- Nêu bảng, trường quan trọng, kiểu dữ liệu, PK/FK, cardinality, constraint và quy tắc nghiệp vụ.
- Có thể nói một câu rằng schema được quản lý bằng SQL migration có phiên bản; không liệt kê tên/số/file migration.

Chỉ được đưa code/file/migration vào **phụ lục** khi người dùng yêu cầu rõ hoặc mẫu báo cáo bắt buộc. Trước khi làm vậy phải hỏi lại người dùng và chỉ trích phần tối thiểu cần thiết.

## Phân biệt vai trò nguồn

| Câu hỏi | Nguồn dùng để trả lời |
| --- | --- |
| Hệ thống cần làm gì? | Requirement và quyết định đã được duyệt; [spec reconciliation](spec-reconciliation.md) phân biệt baseline/delta. |
| Đã hiện thực thế nào? | Code/SQL đúng source; [features](features.md) và architecture là tổng hợp có nguồn. |
| Đã kiểm điều gì, ở đâu? | Evidence có source, lệnh, môi trường, kết quả và phần thiếu tại [testing](testing.md#bản-đồ-bằng-chứng). |
| Vì sao chọn? | [Chỉ mục quyết định](workflow/decisions.md) dẫn hồ sơ gốc; phân biệt người chốt với phân tích hồi cứu. |
| Đã nghiệm thu hoặc phát hành chưa? | Quyết định chấp nhận và receipt triển khai đúng source/đích; không suy từ code/CI. |

Không có thứ tự “code thắng spec” áp cho mọi câu hỏi. Khi nguồn khác nhau, phân loại requirement thay đổi, tài liệu cũ, thiếu implementation hoặc thiếu bằng chứng; giữ lịch sử và cập nhật bản tổng hợp đúng vai trò nguồn. [12 mục tiêu hiện hành](features.md#đối-chiếu-12-mục-tiêu-tốt-nghiệp) và [hồi quy tiểu luận](regression-map.md) là hai góc nhìn cùng bộ FR/NFR.

## Ánh Xạ Sang Cấu Trúc Báo Cáo

| Phần báo cáo gợi ý | Nguồn chính |
| --- | --- |
| Mở đầu, bài toán, mục tiêu | [project-overview.md](project-overview.md) |
| Phạm vi và đối tượng sử dụng | [requirements.md](requirements.md), [phase-scope.md](phase-scope.md) |
| Khảo sát/chức năng hệ thống | [features.md](features.md), [screens.md](screens.md) |
| Phân tích yêu cầu và traceability | [requirements.md](requirements.md) |
| Thiết kế kiến trúc | [architecture.md](architecture.md), [tech-stack.md](tech-stack.md) |
| Thiết kế cơ sở dữ liệu | [data-model.md](data-model.md) |
| Cài đặt và quyết định kỹ thuật | [Quyết định](workflow/decisions.md), [implementation log](implementation-log/README.md) |
| Kiểm thử và đánh giá | [testing.md](testing.md), [demo-runbook.md](demo-runbook.md) |
| Kế hoạch và trình tự thực hiện | [roadmap.md](roadmap.md) |
| Hạn chế và hướng phát triển | [limitations.md](limitations.md), [roadmap.md](roadmap.md) giai đoạn 2 |
| Phụ lục/demo | [demo-runbook.md](demo-runbook.md), [screenshots/README.md](screenshots/README.md) |

## Cách Dùng Phase Log

- Dùng để lấy timeline, commit, mục tiêu, cách triển khai, test tại thời điểm đó và quyết định phát sinh.
- Khi trích số liệu test, ghi rõ đó là checkpoint lịch sử hay baseline hiện tại.
- Nếu phase cũ ghi failure/gap đã được phase sau sửa, trình bày như diễn biến phát triển, không ghi thành lỗi hiện hành.
- Phase 09–23 phù hợp làm case study feature; phase 24 mô tả lần audit tài liệu report-ready, không phải feature code mới.

## Các claim có đủ phạm vi

- Dự án dùng Ports & Adapters theo hướng Hexagonal; giải thích trách nhiệm và trade-off từ [architecture](architecture.md).
- Code có catalog 15 quyền, projections và UI mới; backend acceptance/activation còn HOLD. Không viết thành toàn bộ bảo mật đã nghiệm thu.
- Kết quả UI/local gần nhất lấy đúng source và môi trường trong [testing](testing.md); không cộng counts giữa phase hoặc gọi tree-equivalence là một lần test mới.
- Mô hình nền order/payment/menu/floor có thêm ledger, audit, catalog và registry quyền; không gọi tổng hệ thống là “15 bảng cuối cùng”. [Data model](data-model.md) phân biệt source candidate với database đích.
- Online-only, cash-only, browser print; không claim offline, QR processing, máy in POS thật hoặc SLA đồng bộ cứng.
- Instant Pay là tách đơn độc lập; retained/new giữ snapshot giá. Giữ lý do và hệ quả ở ADR thay vì kể migration trong báo cáo.
- Seam/schema/proposal chưa có luồng dùng được phải đưa vào giới hạn/hướng phát triển, không đưa vào bảng tính năng đã nghiệm thu.

## Artefact Còn Cần Bổ Sung Ngoài Nhánh Docs

- File Word theo mẫu của trường, trang bìa, thông tin sinh viên/giảng viên và quy định định dạng.
- Screenshot mới theo source đã chọn và ghi ngày, sơ đồ kiến trúc/ERD đã render và hình minh họa demo.
- URL deployment live, ngày kiểm tra, cấu hình môi trường đã che secret.
- Tài liệu tham khảo học thuật/chính thức cho React, PostgreSQL, Supabase, realtime, RLS và kiến trúc.
- Kết quả khảo sát người dùng hoặc benchmark nếu báo cáo yêu cầu; lượt này chưa xác minh hồ sơ ngoài repo; không coi đây là yêu cầu mới của giảng viên.

## Checklist Trước Khi Viết Word

- Chốt baseline main/docs và ghi ngày.
- Chỉ đưa tính năng `Đã triển khai` từ [requirements.md](requirements.md).
- Dẫn các tính năng hoãn sang chương hướng phát triển, không mô tả như chức năng hiện có.
- Dùng [testing.md](testing.md) làm nguồn duy nhất cho số liệu baseline kiểm thử.
- Chuyển evidence kỹ thuật thành mô tả thiết kế; không sao chép code, đường dẫn file, symbol, commit, migration hoặc lệnh terminal.
- Chụp lại UI/diagram theo checklist và lưu trong artefact báo cáo riêng.
- Rà lại deployment URL và cloud migration trước ngày nộp/bảo vệ.
