# Kế hoạch kỹ thuật G01–G10 của POS Cafe

Cập nhật **28/10/2026**, dựa trên mã nguồn `052a7d1e156425ea82ed1c9cf978d7ef4d4f3571` và tài liệu đầu vào `9fbd68657884155feb9f7680875f5da1356919e9`. Kế hoạch tổng hợp ưu tiên, phụ thuộc, đầu ra và trạng thái kỹ thuật; yêu cầu chi tiết và bằng chứng nằm trong các hồ sơ được dẫn.

<a id="next"></a>
## Ưu tiên triển khai tiếp theo

**T04 — hoàn thiện đặc tả owner/email cho G05–G06** là công việc ưu tiên. [Khảo sát T01](tasks/g01-g10-t01-2026-10-28.md) đã xác định các phần kiểm chứng còn thiếu trên mã nguồn hiện tại. T04 có thể tiến hành độc lập với việc chuẩn bị môi trường backend; T02 phân tích lỗi CI lịch sử có thể thực hiện song song. T03 chỉ trở thành phụ thuộc khi có phát hiện ảnh hưởng trực tiếp.

Bằng chứng hiện có gồm build, unit, coverage trong phạm vi cấu hình, mock/UI, kiểm tĩnh và native PG16. Các phần còn mở gồm toàn bộ `SUPABASE_T04`, bảy service profiles, kiểm chứng bổ sung PIN, owner/email, hồi quy sản phẩm và vận hành trên nguồn cuối. **T04 trong kế hoạch là đặc tả owner; `SUPABASE_T04` là profile kiểm thử backend.**

<a id="authority"></a>
## Phạm vi và cơ sở kế hoạch

- [DEC-THESIS-02](tasks/docs-knowledge-clarification-2026-10-25.md#dec-thesis-02): ưu tiên G01–G10; G11/G12 dành cho khoảng hai tuần cuối hoặc bước cuối cùng. Tài liệu kỹ thuật, đặc tả, quyết định và bằng chứng được cập nhật cùng từng phần công việc.
- [Khung thời gian](../roadmap.md#khung-thời-gian-đồ-án--xác-nhận-2026-10-25): 15 tuần từ 05/10, tuần 16 bảo vệ. Các đợt dưới thể hiện thứ tự phụ thuộc, chưa phải cam kết ngày hoàn thành.
- Giữ kiến trúc hiện tại, nghiệp vụ tiền mặt, online-only và phạm vi PIN đã chốt. Offline, kitchen thật, payment provider, chuỗi cửa hàng và remake toàn bộ admin nằm ngoài kế hoạch.
- Kế hoạch ghi nhận trạng thái kỹ thuật. Triển khai tính năng, thay đổi dữ liệu/dịch vụ và phát hành có điều kiện phê duyệt riêng; trạng thái sẵn sàng phân tích chưa xác nhận các điều kiện đó.

<a id="baseline"></a>
## Kết quả nền đã có

| Phần | Kết quả đã có / giới hạn |
| --- | --- |
| Tích hợp UI, nhánh | NC-UI đã merge #11–#14 và dọn đúng source branches; [biên bản](tasks/ui-main-docs-integration-2026-10-25.md). |
| Refactor cấu trúc | Report chart/summary, shared query và helper snapshot/cart đã merge PR15, CI sau merge PASS. History/Menu/Floor và RF09a–c NO_CHANGE, phần nhạy cảm HOLD. [Chốt phạm vi](tasks/refactor-safety-2026-10-25/merge-20261027.md#closure-20261027). |
| Docs/nguồn báo cáo | Đã chuẩn hóa thuật ngữ, bản đồ spec/requirement/test, nguồn học thuật và 18 hình. Giữ lại để dùng; không dành giai đoạn hiện tại mở thêm chiến dịch G11/G12. [Đầu vào](tasks/docs-report-inputs-2026-10-26.md). |
| Bằng chứng hiện tại | Build/unit/coverage/mock smoke/UI đã có trên candidate refactor và CI merge. Chúng không đóng backend, thiết bị thật, email, restore, realtime/performance hay Vercel nguồn cuối. [Testing](../testing.md), [giới hạn](../limitations.md). |

<a id="goals"></a>
## Khoảng thiếu theo mục tiêu G01–G10

| Mục tiêu | Khoảng thiếu được ghi trong hồ sơ | Task / tiêu chí khép mục tiêu |
| --- | --- | --- |
| G01 kiểm thử/môi trường | Có runners/strategy; còn ma trận nguồn cuối, recipe tái hiện, môi trường/gate còn HOLD và chẩn đoán CI lịch sử | T01/T02/T05/T15: đủ required gate đúng source, lệnh/fixture/skip rõ; local có recipe kiểm được. |
| G02 chống trùng/khôi phục | Có code và acceptance phase27 lịch sử; cần kiểm luồng tiền/ACK/recovery theo quyền và source mới | T07/T15: hồi quy full/partial/void/OCC/retry/receipt/giá lịch sử trên các tầng bị ảnh hưởng. |
| G03 vai trò/quyền | Catalog15 đã có; còn đóng ma trận quản trị/trần quyền/thu hồi phiên theo các profile bắt buộc | T07/T15; kiểm thay quyền giữa await, quyền UI và gọi trực tiếp. |
| G04 kiểm quyền DB | Candidate và metadata không thay acceptance; còn khóa store R06-C và tương thích owner mới | T04/T06/T07/T10/T15; direct deny/cross-store/Storage/Realtime và contract khóa store được kiểm thực. |
| G05 owner/email/tạo quán | Chưa có luồng email owner hoàn chỉnh; ba artifact owner còn khung | T04/T05/T06: OTP/email thật, owner–store, server provisioning, hạn mức/lỗi và kiểm bypass theo spec đã chốt. |
| G06 recovery/chuyển chủ | Operator recovery chuyển tiếp chưa thay quên/cấp lại Store Key, đổi email và chuyển sở hữu | T08/T09: đủ các luồng trong change owner, invalidation/audit và nhánh lỗi. |
| G07 đổi PIN mặc định | Có code owner bootstrap/operator recovery; full gate nguồn cuối và ảnh hưởng từ owner mới còn mở | T04/T06/T07/T08/T15; không tự mở non-owner. Quyết định thay PIN tạm phải theo delta được chốt. |
| G08 bốn luồng UI | B01–B03 đã tích hợp; cần chốt phần mang đi, thiết bị thật và findings có căn cứ | T11/T15/T16; đủ bốn luồng trên nguồn và thiết bị/môi trường đã ghi. |
| G09 nhiều thiết bị | Có signal/refetch, còn giới hạn join-only modifier và phép đo source cuối | T12/T15; hai phiên, reconnect, đổi quyền, join-only và độ trễ theo expected được chốt. |
| G10 triển khai/vận hành | Chưa có gói release nguồn cuối gồm backup/restore, bảo mật, hiệu năng và web hoạt động | T05/T13/T14/T15/T16; DB+ảnh+khóa/recipe được phục hồi và release đúng phạm vi, không nhận URL mở được là PASS chức năng. |

Nguồn chi tiết: [features/G01–G12](../features.md#đối-chiếu-12-mục-tiêu-tốt-nghiệp), [audit mục tiêu](tasks/docs-thesis-audit-2026-10-25.md), [spec reconciliation](../spec-reconciliation.md), [regression map](../regression-map.md). Bảng này không tạo requirement/TC thay thế FR/NFR/PERM/PIN hiện hữu.

<a id="board"></a>
## Danh mục công việc và tiêu chí hoàn thành

**P0:** mở đường hoặc xử lý rủi ro cốt lõi. **P1:** hoàn thiện mục tiêu. **P2:** hỗ trợ và tinh gọn khi có lợi ích. Thứ tự thực hiện phụ thuộc cả mức ưu tiên và điều kiện của từng công việc.

| ID | Ưu tiên / việc | Trạng thái ngày 28/10/2026 | Phụ thuộc để thực hiện | Đầu ra phải có |
| --- | --- | --- | --- | --- |
| T01 | P0 — Ma trận khoảng thiếu, source và môi trường | HOÀN TẤT KHẢO SÁT — [kết quả 28/10](tasks/g01-g10-t01-2026-10-28.md) | Source052a7d1/docs9fbd đã đối chiếu; không chạy kiểm thử mới | Có bảng kiểm chứng, 35 stage/config và 12 nghĩa vụ bổ sung, nguồn/fixture/điều kiện môi trường; không đóng acceptance sản phẩm. |
| T02 | P1 — Khép chẩn đoán CI cũ | PHÂN TÍCH HOÀN TẤT — chưa triển khai/kiểm chứng; nguyên nhân UI UNKNOWN | [Hồ sơ T02](tasks/g01-g10-t02-2026-10-28.md); chốt schema và phạm vi triển khai trước bước code | Triển khai phương án A và regression theo kế hoạch khi được chấp thuận; kiểm TC-T02-17, các tầng U/P/C và recipe UI theo điều kiện tương ứng. Không mở lại phần khảo sát đã hoàn tất hoặc nhận CI xanh là đã sửa lỗi cũ. |
| T03 | P2 — Inventory source/script/config | SẴN SÀNG PHÂN TÍCH | Dùng kết quả kiểm đường đọc/inventory khi có; không bắt buộc đợi | Bảng consumer/owner/lifecycle KEEP/REMOVE-CANDIDATE/ARCHIVE/UNKNOWN. Không có phần đủ căn cứ thì kết luận NO_CHANGE; không buộc relocation. |
| T04 | P0 — Hoàn thiện spec owner và thống nhất khóa store/PIN | SẴN SÀNG PHÂN TÍCH — việc chính tiếp theo | [Ma trận T01](tasks/g01-g10-t01-2026-10-28.md); phần đọc/spec không chờ lab | Rà proposal/design theo runtime mới; viết usecases/testplan/traceability còn khung, cập nhật đủ bộ spec theo phần; chốt câu hỏi thật sự còn mở. |
| T05 | P0 — Môi trường, email và dữ liệu thử | CHỜ ĐIỀU KIỆN — chưa có backend admission/credential/đích được xác minh lại; có recipe GitHub synthetic | T01; contract email từ T04; đích/quyền/ngân sách được xác minh | Recipe một môi trường cô lập, email test, fixture hai store/roles, cấu hình đã redacted; đo dung lượng và chứng minh chạy lane cần thiết. Môi trường phải được xác nhận trước khi dựng. |
| T06 | P0 — G05 danh tính owner, provisioning và nền khóa store | CHỜ PHỤ THUỘC | T04 + T05; phạm vi triển khai được phê duyệt | Backend/ports/mock/UI theo từng slice; OTP, verified email, owner–store, hạn mức, rollback provisioning, ghép thiết bị và PIN đúng contract. Bắt buộc có nền trạng thái store, DB chặn dữ liệu nghiệp vụ khi suspended, ngoại lệ owner đọc metadata/trạng thái, audit đổi trạng thái và direct-call tests trước khi đóng giai đoạn 1. Tests/docs theo từng slice. |
| T07 | P0 — Kiểm/fix quyền, giao dịch và PIN liên quan | CHỜ PHỤ THUỘC | T01/T05; chạy theo impact của mỗi slice T06–T10, không đợi cuối mới kiểm | Direct deny, cross-store, revoke/late response, cash full/split/void/recovery/receipt, PIN. Findings có regression và gate tương ứng; giữ các obligations bắt buộc. |
| T08 | P1 — G06 khôi phục Store Key và owner PIN | CHỜ PHỤ THUỘC | T06 đã qua gate giai đoạn 1, gồm nền khóa store; spec recovery đã chốt + T05 | Quên Key khác cấp lại Key; cảnh báo/reauth/audit, phiên và thiết bị cũ, restricted PIN/recovery và nhánh thất bại theo spec. |
| T09 | P1 — G06 đổi thông tin/email và chuyển chủ | CHỜ PHỤ THUỘC | T06 đã qua gate giai đoạn 1, gồm nền khóa store; spec tương ứng; tiếp nối T08 | Đổi email/chuyển sở hữu, owner cũ/mới, quyền/PIN/session, audit, lỗi/đồng thời; màn profile và trường chưa chốt cần quyết định riêng. |
| T10 | P1 — G04 đối chiếu R06-C và hành vi khóa/mở còn thiếu | CHỜ QUYẾT ĐỊNH PHẦN CÒN MỞ | T04 xác định phần chưa chốt; nền trạng thái/DB/ngoại lệ/audit đã thuộc T06; T05 cho phần chạy thử | Hoàn thiện hành vi phiên đang mở, thông báo và khôi phục theo contract được chốt; direct-call/UI tests phần bị ảnh hưởng. Phần đã đáp ứng ghi GIỮ NGUYÊN có evidence. Actor/đường thao tác đổi trạng thái chỉ triển khai khi phạm vi được phê duyệt; provider-admin console ngoài phạm vi. |
| T11 | P1 — G08 UI còn thiếu và findings Report | SẴN SÀNG PHÂN TÍCH | Kết quả kiểm UI khi có; spec phần sửa được chốt | Checklist mang đi/bốn luồng; kiểm dirty-exit Employees trước kết luận lỗi. Chốt rồi sửa riêng cap31, nhãn tháng/tuần/ngày và nghĩa top món nếu thuộc phạm vi được phê duyệt. UI gates + hồi quy. |
| T12 | P1 — G09 đồng bộ hai thiết bị | CHỜ ĐIỀU KIỆN | T01/T05; contract/quyền của phần được thử | Ma trận signal/reconnect/revoke/join-only, phép đo và fix trong phạm vi được phê duyệt; không dùng khoảng polling làm số đo hoặc tự thay requirement latency. |
| T13 | P1 — G10 backup và restore | CHỜ ĐIỀU KIỆN | T05; schema candidate phù hợp sau T06/T08–T10 | Backup DB+ảnh và recipe/khóa cần thiết được bảo vệ; restore vào đích cô lập, kiểm đọc/nghiệp vụ, đo RPO/RTO theo tiêu chí đã chốt. Không ghi đè đích đang dùng. |
| T14 | P1 — G10 bảo mật/hiệu năng/vận hành | CHỜ ĐIỀU KIỆN | T01/T05; source/quyền của phần được đo | Inventory bề mặt, test theo spec hiện hành; workload/ngưỡng/chi phí được chốt trước benchmark, số đo và findings. Không nhận “đã an toàn/nhanh” từ cấu hình. |
| T15 | P0 tại checkpoint cuối — Hồi quy tích hợp | CHỜ PHỤ THUỘC | Các slice đã chọn T06–T14 hoàn tất theo phạm vi; source/spec/env khóa | Ma trận G01–G10 và FR/NFR/PERM/PIN đủ bằng chứng nguồn cuối; full required gates, skips/NOT_RUN rõ; 2 review cho phần nhạy cảm, walkthrough. |
| T16 | P1 — Vercel và kiểm bản giao | CHỜ GATE/QUYỀN | T15 và release gates/đích được phê duyệt | URL/version/source/config đúng; bốn luồng và owner/recovery trên web thật; phương án rollback, docs vận hành. Production tiếp tục HOLD theo chính sách phát hành. |

T07 kiểm thử theo từng phần triển khai T06–T10. T15 kiểm tích hợp trên nguồn cuối; kết quả từ nhiều nguồn khác nhau không được ghép thành một lần đạt kiểm chứng chung. Các cổng kiểm chứng bắt buộc vẫn áp dụng trước mỗi phần triển khai.

<a id="sequence"></a>
## Trình tự và mốc kiểm chứng

1. **Chuẩn bị đặc tả:** dùng kết quả T01 để hoàn thiện T04. Phân tích T02 đã hoàn tất; bước triển khai tiếp theo chờ schema và phạm vi được chấp thuận. Phân tích T03 có thể tiến hành độc lập và không chặn T04 khi chưa có phát hiện liên quan.
2. **Chuẩn bị môi trường:** T05 sau khi xác nhận đích, quyền, contract email, fixture và ngân sách. Việc chuẩn bị môi trường không chặn phần đặc tả của T04.
3. **G05 và nền khóa store:** T06 gồm contract/backend, ports/mock, UI và tích hợp; T07 kiểm mỗi phần. Giai đoạn 1 phải có trạng thái store, DB enforce, ngoại lệ owner đọc metadata/trạng thái và audit theo quyết định 11/18. T08/T09 phụ thuộc cổng này.
4. **G06/G04:** sau T06, thực hiện T08 → T09. T10 chỉ xử lý R06-C và hành vi còn thiếu sau đối chiếu T04; phần chưa chốt của T10 không làm hoãn nền khóa store thuộc T06. Provider-admin console nằm ngoài phạm vi.
5. **Sản phẩm và vận hành:** T11/T12/T13/T14 theo phụ thuộc. Phân tích UI/Report có thể làm sớm; đo backend và restore thực hiện lần lượt trong môi trường đã xác nhận.
6. **Tích hợp và bản giao:** T15 → T16. Thay đổi sau kiểm chứng cần kiểm lại phần bị ảnh hưởng và cổng bắt buộc. G11/G12 giữ ở giai đoạn cuối theo kế hoạch; khoảng thiếu G01–G10 được ghi rõ tại mốc chuyển giai đoạn.

Thời lượng T05–T16 còn phụ thuộc môi trường, các quyết định owner/store-lock và workload kiểm thử.

<a id="details"></a>
## Ràng buộc kỹ thuật theo nhóm

- **T01/T05/T07:** [testing](../testing.md), [chiến lược](../test-strategy.md), [permission/PIN reconciliation](../spec-reconciliation.md) và [backend handoff](tasks/permission-backend-web-release-2026-10-23.md) xác định các cổng bắt buộc. `SUPABASE_T04`, bảy service profiles, PIN19/PERM60 và các nghĩa vụ bổ sung phải có bằng chứng đúng nguồn, fixture và môi trường. Tên runner hoặc config có sẵn chưa chứng minh đã thực thi.
- **T02:** [hồ sơ phân tích](tasks/g01-g10-t02-2026-10-28.md) và [chẩn đoán lịch sử](../implementation-log/permission-backend-web-release-20261023/permission-main-main01-diagnosis.md) tách lỗi gán thông tin của reporter khỏi nguyên nhân UI còn UNKNOWN. Phương án và ma trận kiểm đã có; chưa sửa code/chạy recipe. Expected, timeout và retries giữ theo contract.
- **T03:** tiếp nối NC-02/08 và RF-09; operator guides đi cùng công cụ trên main. Kiểm consumer qua CLI, glob, CI, trust, phase và đường dùng ngoài import tĩnh. NO_CHANGE là kết luận hợp lệ khi chưa đủ căn cứ thay đổi; bằng chứng cần giữ được phân biệt với dữ liệu có thể tái tạo.
- **T04/T06/T08/T09:** dùng [change owner hiện hữu](../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md). `usecases.md`, `testplan.md` và `traceability.md` còn khung tại nguồn khảo sát. Các quyết định đã chốt là cơ sở hoàn thiện bộ đặc tả theo [SPEC-STANDARD](../../openspec/SPEC-STANDARD.md); các mô tả runtime cũ cần đối chiếu với contract quyền hiện hành.
- **Owner/PIN/store:** [PIN delta](../../openspec/changes/force-default-pin-change/proposal.md), [R06-C](../spec-reconciliation.md#r06-decisions) và [store-isolation](../../openspec/changes/add-owner-account-and-store-provisioning/specs/store-isolation/spec.md) cùng tác động lifecycle. Quyết định 11/18 đã đặt nền khóa DB, ngoại lệ owner metadata và audit vào T06. T04 làm rõ hành vi phiên đang mở/khôi phục, actor/đường đổi trạng thái còn mở và các trường chủ ngoài email. Ngưỡng OTP/quota giữ theo quyết định hiện hành.
- **Email và dữ liệu:** xác minh lại nhà cung cấp, hạn mức và đường gửi khi triển khai. Thay đổi dữ liệu cũ cần đúng đích/phạm vi, backup DB/ảnh/khóa và phương án phục hồi. Tài liệu chỉ chứa cấu hình đã loại bỏ bí mật.
- **T11:** [findings Report](tasks/refactor-safety-2026-10-25/merge-20261027.md#closure-20261027) cần quyết định nghiệp vụ và phép kiểm tương ứng. Mang đi là một trong bốn luồng G08; ba batch B01–B03 chưa chứng minh đủ bốn luồng.
- **T12–T16:** [limitations](../limitations.md), [CI/CD change](../../openspec/changes/setup-project-ci-cd/proposal.md) và hồ sơ release xác định phạm vi vận hành. Production tiếp tục HOLD với `productionEnabled:false`. Truy cập được URL chưa chứng minh chức năng hoặc quyền thử ghi vào đích.
- **Môi trường kiểm thử:** mỗi lần chỉ dùng một môi trường nặng. Ngân sách dung lượng, quyền tạo môi trường và khả năng thu hồi dữ liệu tái tạo cần được kiểm trước thực thi; coverage, ACL và tiêu chí nghiệm thu giữ nguyên khi môi trường chưa đáp ứng.

<a id="updates"></a>
## Trạng thái và tiêu chí ghi nhận

Mỗi cập nhật ghi ngày, nguồn, đầu ra, bằng chứng và phụ thuộc còn mở. Các trạng thái gồm **SẴN SÀNG PHÂN TÍCH**, **CHỜ PHỤ THUỘC/ĐIỀU KIỆN/QUYẾT ĐỊNH/GATE**, **ĐANG LÀM**, **CHỜ REVIEW**, **HOÀN TẤT KHẢO SÁT**, **XONG**, **GIỮ NGUYÊN**, **HOÃN** và **CHƯA XÁC MINH**.

Một công việc hoàn tất khi đầu ra, kiểm chứng và rà soát đáp ứng phạm vi của nó. Hoàn tất khảo sát hoặc đặc tả chưa đồng nghĩa hoàn tất tính năng; duyệt đặc tả, merge mã nguồn, đạt kiểm thử, nghiệm thu và phát hành được ghi riêng. Mục tiêu G chỉ khép khi các phần bắt buộc có đủ bằng chứng. Khi mã nguồn thay đổi, kết quả được đánh giá lại theo tác động và các cổng kiểm chứng liên quan.

| Ngày | Nguồn | Cập nhật |
| --- | --- | --- |
| 27/10/2026 | DEC-THESIS-02 | Lập thứ tự kỹ thuật G01–G10; G11/G12 dành cho giai đoạn cuối. |
| 28/10/2026 | [Khảo sát T01](tasks/g01-g10-t01-2026-10-28.md), code052a7d1/docs đầu vào9fbd | Hoàn tất ma trận khảo sát. Phân biệt bằng chứng hiện có với 29 stage dịch vụ chưa có execution được xác minh trên nguồn này và 12 nghĩa vụ bổ sung chưa đủ closure. Ưu tiên T04; T02 còn mở. Không có lần chạy app/backend mới. |
| 28/10/2026 | [Phân tích T02](tasks/g01-g10-t02-2026-10-28.md), code052a7d1/docs7df10ad | Hoàn tất phân tích reporter/collector và kế hoạch kiểm chứng; chưa triển khai hoặc chạy test mới. Schema còn mở; nguyên nhân UI UNKNOWN. T04 tiếp tục là hướng chính. |

<a id="verification"></a>
## Phạm vi kết luận

Kế hoạch được đối chiếu với source, đặc tả và hồ sơ được dẫn. Mốc 28/10/2026 gồm khảo sát T01 và phân tích T02; không có execution mới từ việc cập nhật tài liệu. Kết quả kiểm thử lịch sử, tiêu chí nghiệm thu và trạng thái phát hành giữ nguyên.
