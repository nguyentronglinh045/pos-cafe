# Thesis Report Source Map

Nguồn phân tích/thiết kế bổ sung: [permission15](../openspec/changes/redesign-permission-model/proposal.md), [forced-PIN](../openspec/changes/force-default-pin-change/proposal.md), [catalog evidence](workflow/evidence/docs-wip-publication-20261025/catalog.md). [Nguồn theo luận điểm](references.md#claims) có tám nguồn R01–R08 đã đọc phần liên quan và hai chuẩn S01–S02 đối chiếu mục cụ thể; danh sách chưa đọc tách riêng. Kiểu trích dẫn cuối chờ mẫu trường; không suy danh mục là bằng chứng hệ thống đạt chuẩn.

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
| Thiết kế cơ sở dữ liệu | [Mô hình và ERD](data-model.md), [từ điển dữ liệu](data-dictionary.md), [thuật ngữ](glossary.md); phân biệt mô hình source và DB đích |
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

## Nguyên liệu dữ liệu bổ sung — 26/10/2026

- [Thuật ngữ](glossary.md): dùng cách gọi cửa hàng/tenant, owner, đơn/bill/payment/receipt, lệnh/retry/recovery nhất quán; giữ từ gốc khi trích lịch sử.
- [ERD theo nhóm](data-model.md#erd-rút-gọn): quan hệ FK và cardinality từ source; liên kết logic audit/tín hiệu được ghi riêng. Các hình bao quát 35 bảng dự án của mô hình candidate sau chuyển đổi, không phải ảnh chụp DB đang chạy.
- [Từ điển](data-dictionary.md): 332 cột với kiểu, NULL, PK/FK/UNIQUE/CHECK và nguồn; phân biệt constraint với invariant do luồng nghiệp vụ bảo đảm.
- [Handoff N1](workflow/tasks/docs-data-model-2026-10-26.md) ghi cách kiểm, giới hạn và review. [Đối chiếu catalog staging](implementation-log/staging-schema-20261026/README.md) xác nhận phạm vi bảng/cột/khóa đã kiểm, phân biệt thêm bảng marker vận hành; không xác nhận mọi CHECK/default/function body, runtime hoặc production. Bộ sơ đồ luồng N2 được bổ sung bên dưới; nguồn học thuật theo luận điểm N3 được nối ở phần cuối trang. Hình/bảng xuất sang báo cáo cần theo mẫu và nguồn được chọn lúc viết.

## Nguyên liệu luồng bổ sung — 26/10/2026

[Bộ tám sơ đồ](critical-flows.md) mô tả code main711a22e ngày26/10/2026, với [đối chiếu fingerprint function/publication/trigger staging](implementation-log/critical-flows-20261026/README.md). Chỉ dùng những gì phạm vi bằng chứng cho phép; không ghi đây là kiểm chạy E2E, mất mạng, race hoặc realtime đa thiết bị.

| Hình | Dùng cho luận điểm/phần báo cáo | Giới hạn phải giữ khi tổng hợp |
| --- | --- | --- |
| [F01](critical-flows.md#f01) | Quy trình thanh toán và thiết kế tách đơn theo món | Ví dụ là minh họa thuật toán, không phải dữ liệu thử staging |
| [F02](critical-flows.md#f02) | Ranh giới giao dịch, OCC, kiểm quyền sau chờ khóa, audit/R1 | Register và execute là hai transaction; in trình duyệt là tác vụ riêng |
| [F03](critical-flows.md#f03) | Máy trạng thái và chống lặp hiệu ứng | Unknown thuộc client; expiry không hàm ý có cron |
| [F04](critical-flows.md#f04) | Khôi phục khi mất phản hồi và phân biệt retry/resume | Không tự gửi lại khi reconnect; lịch sử khác dữ liệu hiện tại |
| [F05](critical-flows.md#f05) | Hai lớp danh tính và phiên đổi PIN bắt buộc | Không đại diện cho owner email/recovery/ownership transfer chưa hoàn thiện |
| [F06](critical-flows.md#f06) | Giao dịch đổi PIN, thu hồi phiên và mất ACK | Thành công không tự cấp phiên normal; credential cũ không replay thành quyền |
| [F07](critical-flows.md#f07) | Đồng bộ/thu hồi quyền và chặn response cũ | Chu kỳ và deadline là cấu hình source, chưa là số đo hiệu năng |
| [F08](critical-flows.md#f08) | Đồng bộ theo signal và projection có quyền | Có giới hạn join-only menu, mất signal và poll chỉ ở một số purpose |

Khi chuyển thành báo cáo, dùng diễn giải nghiệp vụ/thuật toán và sơ đồ phù hợp mẫu trường; bỏ chi tiết file/symbol/lệnh khỏi phần văn bản báo cáo theo quy tắc ở đầu trang. N2 chưa xuất ảnh hoặc visual-verify Mermaid; P1-03 còn các hình xuất bản, định dạng tham khảo cuối và công việc khác. [Handoff N2](workflow/tasks/docs-critical-flows-2026-10-26.md) giữ kiểm tra, review và commit.

## Nguồn lý thuyết theo luận điểm — 26/10/2026

[Bản đồ C01–C11](references.md#claims) là điểm tra cứu; các thẻ R/S giữ đúng bản, mục/trang, ngày đọc và giới hạn. Bảng này chỉ dẫn đường, tránh tạo danh mục tham khảo thứ hai.

| Phần báo cáo | Luận điểm / nguồn | Dữ liệu dự án cần đi kèm |
| --- | --- | --- |
| Lựa chọn kiến trúc | C01–C03 / R01–R03 | Hồ sơ người chốt, mục tiêu tách UI/DB, ranh giới port và SQL; không bịa lịch sử chọn/loại DDD |
| Giao dịch và khôi phục | C04–C05 / R04–R05 | F02–F04, transaction riêng, K/R1, unknown và giới hạn hiệu ứng |
| Phân quyền và bảo mật | C06–C07 / R06–R07; C10–C11 / S01–S02 | F05–F07, catalog/overrides, enforcement, phạm vi metadata staging; không tuyên bố tuân thủ NIST/ASVS |
| Chiến lược và kết quả kiểm thử | C08–C09 / R08 và R02 | Test strategy, evidence đúng source/môi trường; mock/coverage không thay acceptance backend |

Nguồn học thuật và chuẩn không thay nguồn chính thức về hành vi React/PostgreSQL/Supabase. Khi viết, chọn đúng luận điểm trước, đọc vị trí đã ghi, giữ giới hạn áp dụng và dẫn evidence riêng cho kết quả dự án. Các nguồn backlog chưa được xác minh không tự vào danh mục cuối. [Handoff N3](workflow/tasks/docs-academic-references-2026-10-26.md).
