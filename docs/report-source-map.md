# Thesis Report Source Map

[R06-A/B/C](spec-reconciliation.md#r06-detail) là nguồn cho phân tích chênh lệch yêu cầu–hiện thực: retry seed, reseed sau xóa và khóa cửa hàng; chưa dùng các phần này làm tính năng đã nghiệm thu.

Nguồn phân tích/thiết kế bổ sung: [permission15](../openspec/changes/redesign-permission-model/proposal.md), [forced-PIN](../openspec/changes/force-default-pin-change/proposal.md), [catalog evidence](workflow/evidence/docs-wip-publication-20261025/catalog.md). [Nguồn theo luận điểm](references.md#claims) có tám nguồn R01–R08 đã đọc phần liên quan và hai chuẩn S01–S02 đối chiếu mục cụ thể. Danh mục chỉ giữ nguồn đã đọc phần liên quan và có luận điểm sử dụng. Kiểu trích dẫn cuối chờ mẫu trường; không suy danh mục là bằng chứng hệ thống đạt chuẩn.

Nhánh `docs` là **nguồn dữ liệu để viết báo cáo**, không phải bản Word hoàn chỉnh. Nguồn implementation đối chiếu ngày **26/10/2026** là `main@711a22e`. Source code, expected của spec và kết quả kiểm là ba loại bằng chứng khác nhau; main không mặc nhiên là bản đã phát hành. Lượt này hoàn thiện đường tra cứu đầu vào, không tạo báo cáo Word, chạy lại tests hoặc thêm kết quả triển khai.

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

Các hàng dưới là chủ đề để tra cứu, chưa phải mục lục chương của trường. Mỗi hàng nối yêu cầu/quyết định với hiện trạng, hình, cơ sở và bằng chứng; [danh mục G01–G12](features.md#đối-chiếu-12-mục-tiêu-tốt-nghiệp) vẫn là điểm tra trạng thái mục tiêu, không tạo bộ yêu cầu thứ hai ở đây.

| Chủ đề / mục tiêu liên quan | Nguồn yêu cầu và quyết định | Hiện trạng, hình và cơ sở để diễn giải | Evidence và giới hạn khi viết |
| --- | --- | --- | --- |
| Bài toán, đối tượng và phạm vi chung | [Tổng quan](project-overview.md), [requirements](requirements.md), [phạm vi](phase-scope.md), [nguồn chốt mục tiêu](workflow/decisions.md#phạm-vi-kiểm-chứng-và-giao-sản-phẩm) | [Features](features.md) phân biệt chức năng hiện hành, kế hoạch và phần hoãn; [thuật ngữ](glossary.md) thống nhất cách gọi. | Khung mục tiêu theo xác nhận chủ dự án; không thêm rubric/UAT mới như yêu cầu của giảng viên. Bản demo tiểu luận chưa xác định chính xác source. |
| Kiến trúc và lựa chọn công nghệ | [Quyết định kiến trúc](workflow/decisions.md#kiến-trúc-và-công-nghệ), [tech stack](tech-stack.md) | [Kiến trúc](architecture.md), [A01/A02](architecture-diagrams.md), [C01–C03](references.md#claims). | Hình được kiểm theo code; [review A01/A02](workflow/tasks/docs-architecture-overview-2026-10-26.md). Động cơ thay UI/DB không phải số đo chi phí chuyển đổi; ký ức DDD không thành biên bản thử nghiệm. |
| Thiết kế dữ liệu và ràng buộc | [Spec reconciliation](spec-reconciliation.md), [quyết định giao dịch/quyền](workflow/decisions.md#nghiệp-vụ-và-quyền) | [Mô hình/8 ERD](data-model.md#erd-rút-gọn), [từ điển](data-dictionary.md); quy tắc nghiệp vụ và FK/CHECK phải phân biệt. | [Catalog staging N1](implementation-log/staging-schema-20261026/README.md) chỉ xác nhận phần metadata đã kiểm. Mô hình candidate không tự là schema mọi môi trường hoặc nghiệm thu quyền. |
| Chống trùng và khôi phục — G02 | [Proposal/design giao thức](../openspec/changes/add-idempotent-write-operations/proposal.md), [quyết định](workflow/decisions.md#nghiệp-vụ-và-quyền) | [F01–F04](critical-flows.md#f01), [C04–C05](references.md#claims): tách đơn, ranh giới giao dịch, trạng thái bền vững, mất phản hồi. | [E-PH27/E-BACKEND](testing.md#bản-đồ-bằng-chứng) giữ nguồn riêng; [FIN-WIP-02](reviews/diagram-semantics-20261026/INDEX.md#wip) chưa sửa. Không suy exactly-once đầu cuối hoặc coi mất phản hồi là thất bại giao dịch. |
| Phân quyền, DB và PIN — G03/G04/G07 | [Permission proposal](../openspec/changes/redesign-permission-model/proposal.md), [PIN proposal](../openspec/changes/force-default-pin-change/proposal.md) | [F05–F07](critical-flows.md#f05), ERD-01/05 trong [gallery](figures/README.md), [C06–C07/C10–C11](references.md#claims). | [N2 fingerprint staging](implementation-log/critical-flows-20261026/README.md) và [E-BACKEND](testing.md#bản-đồ-bằng-chứng) không thay nhau. Ẩn UI, có RLS hoặc có catalog không tự chứng minh mọi đường truy cập an toàn. |
| Chủ cửa hàng và sở hữu — G05/G06 | [Quyết định owner](../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#quyết-định-đã-chốt), [recovery chuyển tiếp](workflow/decisions.md#nghiệp-vụ-và-quyền) | [Hiện trạng/kế hoạch](features.md#tài-khoản-chủ-và-sở-hữu), [phần spec còn thiếu](spec-reconciliation.md#phần-còn-thiếu-và-phân-loại). | Chưa có evidence nghiệm thu email owner/chuyển chủ. F05/F06 mô tả phiên nhân viên/PIN, không dùng thay hình hoặc kết quả cho khối owner còn kế hoạch. |
| Giao diện chính — G08 | [Handoff B01–B03](workflow/tasks/ui-main-docs-integration-2026-10-25.md), [screens](screens.md) | [Features UI](features.md#shared-ui-behavior), [chỉ mục screenshot](screenshots/README.md), [demo runbook](demo-runbook.md). | [E-UI](testing.md#bản-đồ-bằng-chứng) ghi source/phạm vi đã kiểm; không gọi mọi ảnh trong current là ảnh main mới. Mang đi chưa có batch remake riêng được nhận hoàn tất. |
| Đồng bộ nhiều thiết bị — G09 | [Delta sync](spec-reconciliation.md#multi-device-sync), [quyết định realtime](workflow/decisions.md#nghiệp-vụ-và-quyền) | [F08](critical-flows.md#f08), [kiến trúc realtime](architecture.md#realtime), nguồn code/contract tại trang hình. | [E-BACKEND](testing.md#bản-đồ-bằng-chứng); còn giới hạn signal liên kết món–nhóm và phạm vi poll. Chưa dùng khoảng cấu hình làm độ trễ thực đo hoặc SLA. |
| Kiểm thử và đánh giá — G01 | [Chiến lược](test-strategy.md), [quyết định kiểm thử](workflow/decisions.md#phạm-vi-kiểm-chứng-và-giao-sản-phẩm) | [21 FR/8 NFR → scenario/TC](regression-map.md), [C08–C09](references.md#claims). | [Testing](testing.md) và [N5](implementation-log/test-traceability-20261026/README.md) phân biệt có test, đã chạy và còn thiếu. Không cộng counts giữa source hoặc dùng coverage/mock thay backend acceptance. |
| Triển khai, backup, bảo mật, hiệu năng — G10 | [Roadmap](roadmap.md), [CI/CD proposal](../openspec/changes/setup-project-ci-cd/proposal.md) | [Giới hạn hiện hành](limitations.md), [E-CICD/E-OPS](testing.md#bản-đồ-bằng-chứng). | Cần receipt đúng source/đích cho Vercel, restore và đo tải. LOCAL/hosted/provider readiness tách biệt; chưa suy RPO/RTO từ một gói backup. |
| Cơ sở tham khảo — G11 | [Bản đồ C01–C11](references.md#claims), [quyết định dự án](workflow/decisions.md) | Thẻ R01–R08 và S01–S02 ghi phần đã đọc, phiên bản/trang/mục và giới hạn. Không lập lại danh mục nguồn chờ. | Nguồn lý thuyết không chứng minh kết quả hệ thống. Kiểu trích dẫn/format trường sẽ áp khi làm báo cáo; không nhận đọc phần liên quan là đọc toàn tài liệu. |
| Báo cáo và tài liệu — G12 | Trang này, [quy tắc kho docs](README.md), [bàn giao gói đầu vào](workflow/tasks/docs-report-inputs-2026-10-26.md) | [18 hình và chú thích](figures/README.md#chu-thich), các nguồn ở từng hàng trên. | Hoàn thiện đầu vào docs không phải hoàn thành Word/slide hoặc nghiệm thu đồ án. [Phần còn thiếu](#ngoai-docs) ghi điều kiện và nơi bổ sung. |

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

<a id="ngoai-docs"></a>
## Artefact Còn Cần Bổ Sung Ngoài Nhánh Docs

Các mục dưới là việc phụ thuộc đầu vào hoặc task riêng. Chúng không biến một bản đồ nguồn đã đầy đủ thành báo cáo hoàn chỉnh, và cũng không được lấy việc thiếu Word/runtime để phủ nhận phần kiểm tài liệu đã xong.

| Việc còn lại | Đầu vào/điều kiện cần | Nơi ghi khi có kết quả |
| --- | --- | --- |
| Bản Word/slide, bìa, mục lục, kiểu trích dẫn và dàn trang | Mẫu trường/thông tin nộp và giao việc tạo báo cáo; trong lượt này chưa có mẫu định dạng được chọn. | Artifact báo cáo riêng; chỉ cập nhật con trỏ/source map nếu cần. Không tự chọn IEEE/APA hoặc sửa kho docs thành luận văn. |
| Nhãn hình và screenshot cho báo cáo | Chọn đúng source và hình phù hợp luận điểm; dùng [chú thích 18 hình](figures/README.md#chu-thich), đổi nhãn file/symbol sang vai trò thiết kế khi cần. Screenshot cần ngày, source, backend/mode, màn/viewport; ảnh lịch sử giữ nhãn lịch sử. | Artifact báo cáo, theo [quy tắc screenshot](screenshots/README.md). SVG kỹ thuật gốc/manifest giữ nguyên để truy nguồn. Chưa có bản Word/PDF/in được kiểm. |
| Runtime/backend/deployment, restore và hiệu năng | Task kiểm chứng được giao, đúng source/môi trường/gate; chưa tự dựng lab hoặc chạy suite từ task docs. | Receipt thật và [testing](testing.md#bản-đồ-bằng-chứng), sau đó nối [regression map](regression-map.md). Không dùng số dự kiến làm kết quả. |
| Chi tiết N4 và owner khi tới lượt triển khai | [Quyết định R06](spec-reconciliation.md#r06-decisions) giữ hiệu lực; chốt chi tiết còn mở của store lock/owner trong change được chọn. | Spec/usecases/testplan/traceability tương ứng, rồi cập nhật hiện trạng theo code và evidence. Không tự điền quyết định còn thiếu. |
| HTML kiến trúc H1–H4 | Kiểm hiển thị/tương tác/in và receipt theo checklist local. Preview tự động trước đây bị từ chối; không lách qua bề mặt khác. Chủ dự án có thể tự kiểm và ghi nhận. | [Handoff HTML](workflow/tasks/docs-reorganization-2026-10-26.md) và checklist local. Hai hình SVG mới không thay phép kiểm HTML. |

Nguồn học thuật hiện có đáp ứng phần mapping C01–C11 đã chọn. Nếu báo cáo bổ sung luận điểm khác hoặc cần dẫn hành vi của một thư viện/dịch vụ, đọc đúng tài liệu gốc rồi cập nhật [references](references.md); không thêm danh sách chưa đọc hoặc xem việc tìm thêm nguồn là kết quả đã có. Khảo sát người dùng/benchmark chỉ bổ sung theo yêu cầu thực tế; không tự biến khuyến nghị cũ thành yêu cầu của giảng viên.

## Checklist Trước Khi Viết Word

- Chốt baseline main/docs và ghi ngày.
- Đọc trạng thái từng tính năng từ [features](features.md) cùng [requirements](requirements.md): có code, đã kiểm, đã nghiệm thu và đã phát hành là các nhận định khác nhau. Phần kết quả chỉ dùng nhận định có bằng chứng đúng phạm vi.
- Dẫn các tính năng hoãn sang chương hướng phát triển, không mô tả như chức năng hiện có.
- Bắt đầu từ [testing.md](testing.md), mở receipt gốc để lấy số liệu đúng source/ngày/môi trường và giữ PASS/FAIL/skip/NOT_RUN; không lấy số từ câu tóm tắt đã lỗi thời.
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

Khi chuyển thành báo cáo, dùng diễn giải nghiệp vụ/thuật toán và sơ đồ phù hợp mẫu trường; bỏ chi tiết file/symbol/lệnh khỏi phần văn bản báo cáo theo quy tắc ở đầu trang. [Bộ SVG 26/10](figures/README.md) đã được parser/renderer kiểm và rà 16 ảnh ở kích thước gốc. Gói đầu vào P1-03 được rà theo điều kiện tài liệu tại [handoff](workflow/tasks/docs-report-inputs-2026-10-26.md). Chuyển nhãn/dàn trang theo mẫu và thu thập evidence runtime là phần tiếp theo có điều kiện, không phải kết quả được suy từ bộ hình. [Handoff N2](workflow/tasks/docs-critical-flows-2026-10-26.md) giữ kiểm tra, review và commit.

Bộ hình hiện hành đã sửa F04 và làm rõ F05/F07/F08 theo [review ngữ nghĩa](reviews/diagram-semantics-20261026/INDEX.md). Khi dùng trong báo cáo, ghi source O riêng với snapshot WIP; không lấy metadata staging S làm chứng minh DB local L hoặc deployment. FIN-WIP-02 chưa sửa code.

## Nguồn lý thuyết theo luận điểm — 26/10/2026

[Bản đồ C01–C11](references.md#claims) là điểm tra cứu; các thẻ R/S giữ đúng bản, mục/trang, ngày đọc và giới hạn. Bảng này chỉ dẫn đường, tránh tạo danh mục tham khảo thứ hai.

| Phần báo cáo | Luận điểm / nguồn | Dữ liệu dự án cần đi kèm |
| --- | --- | --- |
| Lựa chọn kiến trúc | C01–C03 / R01–R03 | Hồ sơ người chốt, mục tiêu tách UI/DB, ranh giới port và SQL; không bịa lịch sử chọn/loại DDD |
| Giao dịch và khôi phục | C04–C05 / R04–R05 | F02–F04, transaction riêng, K/R1, unknown và giới hạn hiệu ứng |
| Phân quyền và bảo mật | C06–C07 / R06–R07; C10–C11 / S01–S02 | F05–F07, catalog/overrides, enforcement, phạm vi metadata staging; không tuyên bố tuân thủ NIST/ASVS |
| Chiến lược và kết quả kiểm thử | C08–C09 / R08 và R02 | Test strategy, evidence đúng source/môi trường; mock/coverage không thay acceptance backend |

Nguồn học thuật và chuẩn không thay nguồn chính thức về hành vi React/PostgreSQL/Supabase. Khi viết, chọn đúng luận điểm trước, đọc vị trí đã ghi, giữ giới hạn áp dụng và dẫn evidence riêng cho kết quả dự án. [Handoff N3](workflow/tasks/docs-academic-references-2026-10-26.md).

## Nguyên liệu kiến trúc bổ sung — 26/10/2026

[A01](architecture-diagrams.md#a01) phân biệt lời gọi ở trình duyệt với thực thi RPC/SQL và signal; [A02](architecture-diagrams.md#a02) giải thích chiều import, composition và các ranh giới thực tế. Bảng truy nguồn là dữ liệu kiểm chứng nội bộ. Khi viết báo cáo, đổi nhãn module/file/symbol thành vai trò thiết kế, giữ ý nghĩa mũi tên và giới hạn nguồn. Không dùng hình để khẳng định thay DB/UI đã được chứng minh, toàn bộ features là use case thuần, RLS là cơ chế kiểm quyền duy nhất, hoặc mọi backend đã activate. Bộ hình không đóng FIN-WIP-02, N4, H1–H4 hay gate runtime/deployment. Trạng thái hoàn thiện đường tra cứu đầu vào được ghi riêng ở handoff P1-03, không đổi các gate này.
