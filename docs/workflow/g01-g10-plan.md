# Kế hoạch kỹ thuật G01–G10 của POS Cafe

Cập nhật **02/11/2026** (sau merge và CI main T02), dựa trên mã nguồn `28a3dc54a846463ba150d50ab323658d6ed1372c` và tài liệu đầu vào `991652224afcd125065d92ad0d657abf289f1842`. Riêng T04 cập nhật 08/11/2026. Kế hoạch tổng hợp ưu tiên, phụ thuộc, đầu ra và trạng thái kỹ thuật; yêu cầu chi tiết và bằng chứng nằm trong các hồ sơ được dẫn.

<a id="next"></a>
## Ưu tiên triển khai tiếp theo

**Gói sửa attribution T02 đã merge và kiểm chứng U/P/C, PR CI và CI main**, đủ 18 phase trên mỗi event. Phần còn mở của T02 là recipe R-APP và nguyên nhân UI lịch sử UNKNOWN; không cần lặp khảo sát hoặc CI chỉ để chuyển việc. [Hồ sơ T02](tasks/g01-g10-t02-2026-10-28.md) ghi source/giới hạn. **T04 — hoàn thiện đặc tả owner/email** đã viết xong và merge vào docs ngày 08/11/2026 (PR #18), chưa triển khai; các task tiếp nhận khác tuân theo ưu tiên hiện hành của chủ dự án. T01 và T03-A đã khảo sát xong, T03-A giữ NO_CHANGE; không làm lại inventory. Readiness không tạo quyền triển khai, chạy backend hoặc đổi yêu cầu owner.

Bằng chứng hiện có gồm build, unit, coverage trong phạm vi cấu hình, mock/UI, kiểm tĩnh và native PG16. Các phần còn mở gồm toàn bộ `SUPABASE_T04`, bảy service profiles, kiểm chứng bổ sung PIN, owner/email, hồi quy sản phẩm và vận hành trên nguồn cuối. **T04 trong kế hoạch là đặc tả owner; `SUPABASE_T04` là profile kiểm thử backend.**

Tính đến 12/11/2026, T06 đã thử backend OTP và tạo quán trên Supabase staging. Bản sửa `f7de5a4` đạt 18/18 bước ở CI push nhánh và CI PR lượt 2. PR #24 chờ chủ dự án quyết định merge. Protected Preview chờ commit trên `main` với CI push đạt. [PR #24](https://github.com/nguyentronglinh045/pos-cafe/pull/24) · [Hồ sơ T06](tasks/g01-g10-t06-owner-implementation-2026-11-11.md)

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
| G05 owner/email/tạo quán | Backend OTP, tạo quán, Store Key và PIN chủ đã thử trên staging. PR T06 đang mở, còn kiểm luồng trình duyệt trên Protected Preview. | T04/T05/T06: OTP/email thật, owner–store, server provisioning, hạn mức/lỗi và kiểm bypass theo spec đã chốt. |
| G06 recovery/chuyển chủ | Operator recovery chuyển tiếp chưa thay quên/cấp lại Store Key, đổi email và chuyển sở hữu | T08/T09: đủ các luồng trong change owner, invalidation/audit và nhánh lỗi. |
| G07 đổi PIN mặc định | Có code owner bootstrap/operator recovery; full gate nguồn cuối và ảnh hưởng từ owner mới còn mở | T04/T06/T07/T08/T15; không tự mở non-owner. Quyết định thay PIN tạm phải theo delta được chốt. |
| G08 bốn luồng UI | B01–B03 đã tích hợp; cần chốt phần mang đi, thiết bị thật và findings có căn cứ | T11/T15/T16; đủ bốn luồng trên nguồn và thiết bị/môi trường đã ghi. |
| G09 nhiều thiết bị | Có signal/refetch, còn giới hạn join-only modifier và phép đo source cuối | T12/T15; hai phiên, reconnect, đổi quyền, join-only và độ trễ theo expected được chốt. |
| G10 triển khai/vận hành | Chưa có gói release nguồn cuối gồm backup/restore, bảo mật, hiệu năng và web hoạt động | T05/T13/T14/T15/T16; DB+ảnh+khóa/recipe được phục hồi và release đúng phạm vi, không nhận URL mở được là PASS chức năng. |

Nguồn chi tiết: [features/G01–G12](../features.md#đối-chiếu-12-mục-tiêu-tốt-nghiệp), [audit mục tiêu](tasks/docs-thesis-audit-2026-10-25.md), [spec reconciliation](../spec-reconciliation.md), [regression map](../regression-map.md). Bảng này không tạo requirement/TC thay thế FR/NFR/PERM/PIN hiện hữu.

<a id="board"></a>
## Danh mục công việc và tiêu chí hoàn thành

**P0:** mở đường hoặc xử lý rủi ro cốt lõi. **P1:** hoàn thiện mục tiêu. **P2:** hỗ trợ và tinh gọn khi có lợi ích. Thứ tự thực hiện phụ thuộc cả mức ưu tiên và điều kiện của từng công việc.

| ID | Ưu tiên / việc | Trạng thái ngày 29/10/2026 (riêng T04: 08/11/2026) | Phụ thuộc để thực hiện | Đầu ra phải có |
| --- | --- | --- | --- | --- |
| T01 | P0 — Ma trận khoảng thiếu, source và môi trường | HOÀN TẤT KHẢO SÁT — [kết quả 28/10](tasks/g01-g10-t01-2026-10-28.md) | Source052a7d1/docs9fbd đã đối chiếu; không chạy kiểm thử mới | Có bảng kiểm chứng, 35 stage/config và 12 nghĩa vụ bổ sung, nguồn/fixture/điều kiện môi trường; không đóng acceptance sản phẩm. |
| T02 | Phần còn mở: chẩn đoán UI lịch sử | ATTRIBUTION ĐÃ MERGE/KIỂM U-P-C-PR-MAIN; R-APP NOT_RUN/UI UNKNOWN | [Hồ sơ T02](tasks/g01-g10-t02-2026-10-28.md); main28a3dc5, PR16, main CI41385640659/a1 | Đóng gói sửa CI và hồ sơ; không đóng toàn T02, không dùng light CI thay full backend. R-APP cần phạm vi thực thi riêng. |
| T03 | P2 — Inventory source/script/config | HOÀN TẤT KHẢO SÁT T03-A — NO_CHANGE; chưa triển khai | [Kết quả ngày29/10](tasks/g01-g10-t03-a-2026-10-29.md); chỉ mở thay đổi khi có lợi ích, caller rõ và phạm vi được giao | 374 mục đã đối chiếu; R-I-02 đóng, bản tổng hợp đã hiệu đính điều kiện output JSON. Giữ 96 chương trình/104 thư viện/11 reporter, 354 KEEP/20 UNKNOWN và runtime NOT_RUN. Chưa khép toàn bộ T03 hoặc mở NC-08. |
| T04 | P1 (sau phần T02 đang ưu tiên) — Hoàn thiện spec owner và thống nhất khóa store/PIN | XONG phần đặc tả — [PR #18](https://github.com/nguyentronglinh045/pos-cafe/pull/18) merge 08/11/2026; chưa triển khai | [Ma trận T01](tasks/g01-g10-t01-2026-10-28.md); phần đọc/spec không chờ lab | Rà proposal/design theo runtime mới; đã viết đủ usecases/testplan/traceability và cập nhật bộ spec ngày 2026-11-05; chốt câu hỏi thật sự còn mở. |
| T05 | P0 — Môi trường, email và dữ liệu thử | ĐÃ KIỂM TRÊN STAGING. Hồ sơ T05 còn ở worktree riêng. Hộp thư dành riêng cho dự án còn mở | T01; contract email từ T04; đích/quyền/ngân sách được xác minh | Dùng project staging theo quyết định 44 của owner; email test, fixture hai store/vai trò, cấu hình đã redacted; đo dung lượng và chứng minh chạy lane cần thiết. |
| T06 | P0 — G05 danh tính owner, provisioning và nền khóa store | BACKEND STAGING ĐÃ THỬ, CI BẢN SỬA PR #24 ĐẠT, CHỜ MERGE | T04, T05 và phạm vi T06 đã duyệt. Protected Preview cần `main` và CI push đạt | Backend/ports/mock/UI theo từng slice; OTP, verified email, owner–store, hạn mức, rollback phần ghi DB, giữ suất và chống tạo trùng khi chưa rõ kết quả, ghép thiết bị và PIN đúng contract. Bắt buộc có nền trạng thái store, DB chặn dữ liệu nghiệp vụ khi suspended, ngoại lệ thiết bị đã ghép đọc trạng thái quán, audit đổi trạng thái và direct-call tests trước khi đóng giai đoạn 1. Hai vòng trình duyệt TC-OWNER-104 và R07 hosted còn chờ. [Minh chứng](tasks/g01-g10-t06-owner-implementation-2026-11-11.md) |
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

1. **T02 trước:** checkpointU/P/C02/11 đãcónguồn/evidence; báo kết quảC18/18PASS/phầnthiếu,reviewdelta vàchờgiao; khôngtựmerge/R-APP/rerun. T04 sau phần T02 đang ưu tiên, dùng kết quả T01 và checkpoint owner đã có. T03-A giữ NO_CHANGE, không mở vòng rà soát mới khi chưa có source hoặc căn cứ thay đổi mới.
2. **Chuẩn bị môi trường:** T05 sau khi xác nhận đích, quyền, contract email, fixture và ngân sách. Việc chuẩn bị môi trường không chặn phần đặc tả của T04.
3. **G05 và nền khóa store:** FE/mock T06 đã bàn giao. Backend staging đã thử Auth, DB và email thật. Sau khi PR #24 được duyệt merge và CI push trên `main` đạt, kiểm Protected Preview khi signup còn bật, rồi tắt signup và chạy lại ma trận FE và Auth. T07 kiểm mỗi phần. Giai đoạn 1 phải có trạng thái store, DB enforce, ngoại lệ thiết bị đã ghép đọc trạng thái quán. T08/T09 phụ thuộc cổng này.
4. **G06/G04:** sau T06, thực hiện T08 → T09. T10 chỉ xử lý R06-C và hành vi còn thiếu sau đối chiếu T04; phần chưa chốt của T10 không làm hoãn nền khóa store thuộc T06. Provider-admin console nằm ngoài phạm vi.
5. **Sản phẩm và vận hành:** T11/T12/T13/T14 theo phụ thuộc. Phân tích UI/Report có thể làm sớm; đo backend và restore thực hiện lần lượt trong môi trường đã xác nhận.
6. **Tích hợp và bản giao:** T15 → T16. Thay đổi sau kiểm chứng cần kiểm lại phần bị ảnh hưởng và cổng bắt buộc. G11/G12 giữ ở giai đoạn cuối theo kế hoạch; khoảng thiếu G01–G10 được ghi rõ tại mốc chuyển giai đoạn.

Thời lượng T05–T16 còn phụ thuộc môi trường, các quyết định owner/store-lock và workload kiểm thử.

<a id="details"></a>
## Ràng buộc kỹ thuật theo nhóm

- **T01/T05/T07:** [testing](../testing.md), [chiến lược](../test-strategy.md), [permission/PIN reconciliation](../spec-reconciliation.md) và [backend handoff](tasks/permission-backend-web-release-2026-10-23.md) xác định các cổng bắt buộc. `SUPABASE_T04`, bảy service profiles, PIN19/PERM60 và các nghĩa vụ bổ sung phải có bằng chứng đúng nguồn, fixture và môi trường. Tên runner hoặc config có sẵn chưa chứng minh đã thực thi.
- **T02:** [hồsơ](tasks/g01-g10-t02-2026-10-28.md) phânbiệt bản sửa attribution đãkiểmU/P/C trênnhánh9ec6b05 với nguyênnhânUIUNKNOWN. C41379094743/a1 đủ18phasePASS/PG16cleanup; chưa merge,docs publication hoặcR-APP. Expected/coverage/retry/timeout/skip/gate giữnguyên.
- **T03:** tiếp nối NC-02/08 và RF-09; operator guides đi cùng công cụ trên main. Kiểm consumer qua CLI, glob, CI, trust, phase và đường dùng ngoài import tĩnh. NO_CHANGE là kết luận hợp lệ khi chưa đủ căn cứ thay đổi; bằng chứng cần giữ được phân biệt với dữ liệu có thể tái tạo. [Khảo sát T03-A](tasks/g01-g10-t03-a-2026-10-29.md) đã đóng lỗi vai trò, đường output và R-I-02. Nhãn TOP_LEVEL_CALL_UNCHECKED chỉ nhận diện lời gọi/vòng lặp, không suy có hay không có I/O. Bản tổng hợp ghi đủ điều kiện tên file của JSON reporter. Bảng phân loại dựa trên quét source, không bảo đảm module an toàn để import hoặc chứng minh đã chạy. Trước thay đổi cần đối chiếu lại caller, source và điều kiện kiểm chứng; b01/b02 vẫn UNKNOWN/HOLD.
- **T04/T06/T08/T09:** dùng [change owner hiện hữu](../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md). `usecases.md`, `testplan.md` và `traceability.md` đã viết đủ ngày 2026-11-05; tại nguồn khảo sát còn khung. Các quyết định đã chốt là cơ sở hoàn thiện bộ đặc tả theo [SPEC-STANDARD](../../openspec/SPEC-STANDARD.md); các mô tả runtime cũ cần đối chiếu với contract quyền hiện hành.
- **Owner/PIN/store:** [PIN delta](../../openspec/changes/force-default-pin-change/proposal.md), [R06-C](../spec-reconciliation.md#r06-decisions) và [store-isolation](../../openspec/changes/add-owner-account-and-store-provisioning/specs/store-isolation/spec.md) cùng tác động lifecycle. Quyết định 11/18 đã đặt nền khóa DB, ngoại lệ thiết bị đã ghép đọc trạng thái quán và audit vào T06. T04 làm rõ hành vi phiên đang mở/khôi phục, actor/đường đổi trạng thái còn mở và các trường chủ ngoài email. Ngưỡng OTP/quota giữ theo quyết định hiện hành.
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
| 29/10/2026 | [Rà soát T03-A](tasks/g01-g10-t03-a-2026-10-29.md), code052a7d1/docs4e85598 | Revision 3 đóng R-I-02: đúng 20 mục chỉ đổi roleBasis, 374 identity và khuyến nghị giữ nguyên. Bản tổng hợp hiệu đính riêng R3-D01 về tên file JSON; nguồn khảo sát gốc được giữ để đối chiếu. Hoàn tất khảo sát T03-A, giữ NO_CHANGE/NOT_RUN và ưu tiên T04. |
| 01/11/2026 | [Tiếp nhận T02](tasks/g01-g10-t02-2026-10-28.md), main052/docs9916522 | Đối chiếu targeted source/consumer và integrity TC17; TC17 PASS phạm vi probe Windows30/10. Summary v2 đã chọn; candidate A chờ phạm vi/acceptance; production/U/P/C bản sửa chưa chạy, UI UNKNOWN. Không tạo execution mới từ việc cập nhật tài liệu. |
| 02/11/2026 | [T02local](tasks/g01-g10-t02-2026-10-28.md), baseline052+manifestworking | Đã hiện thực scopeA/v2 và kiểm U/P local; node1056PASS,tooling567PASS+1manual-defer,P66expected,discovery86. GiữFAILWindowsbanđầu và recipe sửa điều kiện môi trường. C/R-APP NOT_RUN,UIUNKNOWN; chưacommit/push/CI. |
| 02/11/2026 — C | [T02C41379094743/a1](tasks/g01-g10-t02-2026-10-28.md),branch9ec6b05 | Commit/pushđúng8file;18/18phasePASS,PG16native30/30+cleanup;source/lockkhớpGit. MộtlượtC,khôngPR/dispatch/rerun/merge;main/docs/WIP/TC17giữnguyên. R-APPNOT_RUN/UIUNKNOWN;docs candidate chưa xuấtbản. |
| 05/11/2026 | [PR #18](https://github.com/nguyentronglinh045/pos-cafe/pull/18), chủ dự án | T04: viết đủ đặc tả owner, 44 quyết định, 13 use case, 102 test case chưa chạy; chờ duyệt merge. Chuyển hẳn sang staging, không dùng database gốc. |
| 08/11/2026 | [PR #18 merge](https://github.com/nguyentronglinh045/pos-cafe/commit/4b068b4356eb75ce5e2195e3b17941557cf8bbd1), chủ dự án | T04: đặc tả owner đã vào docs. Chủ dự án trả lời câu hỏi kiểm thử tuần 5 của Ngọc và Lâm; quy tắc và việc chưa xử lý ghi ở [hồ sơ 08/11](tasks/team-week05-answers-2026-11-08.md). |
| 10/11/2026 | [Change owner, quyết định 45–48](../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md#quyết-định-đã-chốt), chủ dự án trong chat rà PR #18 | Candidate T04 local cập nhật F5, chống lạm dụng và thứ tự mock → staging → tắt signup → hồi quy. Đã chốt T06 giữ suất và chống tạo trùng khi kết quả Auth chưa rõ. Tự động đối soát, dọn dẹp và cảnh báo lượt tạo dở để sau đồ án. 106 ca là kế hoạch, chưa chạy. T05 còn cần xác minh đường gửi và ngân sách thư thật. Phần tích hợp T06 chờ cổng mock, T05 và phạm vi triển khai. |
| 10/11/2026 | T06 FE/mock phase 1 local, code `f2b486e` + candidate v3, spec v2 có quyết định 49 | Xong lát form, gửi/gửi lại OTP giả và F5 trước Xác nhận. Build đạt, 1.247 unit và 10 smoke đạt, UI audit đủ 54/54 với 0 phát hiện, OpenSpec strict đạt. Hai reviewer APPROVE đúng candidate. Worktree `D:/Workspace/pos-cafe-owner-mock-local`. Manifest, bằng chứng và handoff ở `.git/local-notes/reviews/owner-fe-mock-phase1-20261110/` của checkout chính. Phase 2 và 3 còn mở. Ca TC-OWNER-08 F5 sau Xác nhận do Claude xử lý riêng. Tích hợp vẫn chờ hoàn tất mock và T05. |
| 10/11/2026 | T06 FE/mock phase 1, kiểm non-UI local v2 | Node đạt 8 test gửi OTP mock và 5 test ranh giới kiến trúc, TypeScript đạt. Hai reviewer APPROVE, thay đổi giới hạn ở hai file test. Chi tiết và manifest ở `.git/local-notes/reviews/owner-fe-mock-non-ui-20261110/`. Đã nhận checklist Claude cho TC-OWNER-08(b) sau hạn. Ca này chưa chạy và chờ mock xác minh, operation và tra trạng thái. Kiểm UI tiếp theo sau khi luồng mock vượt cổng non-UI. |
| 10/11/2026 | [T06 đánh giá non-UI luồng OTP tạo quán](tasks/g01-g10-t06-owner-mock-non-ui-2026-11-10.md) | Node đạt 28 test và build đạt. Đã kiểm xác minh, quota, replay và tra cứu trong mô hình, gồm cả hai nhánh TC-OWNER-08 ở phía server giả. Hai reviewer APPROVE code v3 và đánh giá v4. Log, manifest và review ở `.git/local-notes/reviews/owner-provisioning-non-ui-20261110/`. Cổng HTTP xác minh/tra cứu, Store Key, seed, F5 thật trên UI và kiểm chứng DB/Auth/SMTP vẫn còn mở. |
| 10/11/2026 | [T06 HTTP mock xác minh và tra trạng thái](tasks/g01-g10-t06-owner-mock-non-ui-2026-11-10.md#bổ-sung-cổng-http-mock-local) | Cổng mock local đã nối port xác minh và tra cứu. 35 test Node, build và OpenSpec strict đạt. Hai reviewer APPROVE HTTP v3 và bản đánh giá v3. Log, manifest và review ở `.git/local-notes/reviews/owner-mock-http-20261110/`. Tiếp theo kiểm Store Key và retry seed R06-A bằng mock; UI F5 và staging còn mở. |
| 10/11/2026 | [T06 Store Key, R06-A và bàn giao UI tạm](tasks/g01-g10-t06-owner-mock-ui-handoff-2026-11-10.md) | Mock local v5 kiểm nhận/lưu Store Key, ghép thủ công, PIN owner, retry seed và F5/điều hướng. 48 test Node, toàn bộ 1.278 unit, hai nhóm smoke 10/10, build và OpenSpec strict đạt. UI audit 54/54, 0 phát hiện trên ma trận hiện tại. Hai reviewer APPROVE code và handoff. Hồ sơ `.git/local-notes/reviews/owner-mock-closeout-20261110/`. Còn giao thiết kế UI chính thức và kiểm DB/Auth/SMTP theo T05. |
| 10/11/2026 | [T06 công bố gói giao UI](https://github.com/nguyentronglinh045/pos-cafe/blob/8827aa64efecda565fdedbed50ebb411df43d406/docs/workflow/tasks/g01-g10-t06-owner-mock-ui-handoff-2026-11-10.md) | Đã push hai nhánh bàn giao theo yêu cầu chủ dự án. Code `a1292b4` trên `owner-mock-ui-handoff-20261110`, docs `8827aa6` trên `docs-owner-mock-ui-handoff-20261110`. Build, 29 test Node, 10 lượt smoke và OpenSpec strict đạt trên gói bàn giao. Hai reviewer APPROVE phạm vi công bố. CI tự động của nhánh code đang chạy lúc kiểm. |
| 10/11/2026 | [CI nhánh bàn giao 42782759920](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/42782759920) | CI `a1292b4` FAIL tại `node-tools`. Tái hiện `FRONTEND_RELEASE_BLOCKED` bằng `node --test scripts/permission-full-target-policy.test.mjs`. Đối chiếu blob Git cho thấy ba fingerprint lệch ở `playwright.config.ts`, `package.json` và `ui-audit/config.json`. Ưu tiên xử lý chênh lệch bằng review policy trước khi dùng nhánh làm nguồn tích hợp. T05 tiếp theo là rà quyền staging, đường gửi mail và fixture. |
| 10/11/2026 | [POS light CI nhánh bàn giao 42791589749](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/42791589749), T05 rà chỉ đọc | CI `2ff217f` PASS 18/18. Hai commit đã review cập nhật ba fingerprint và kỳ vọng ma trận audit từ 16 lên 18 trạng thái trên ba viewport. Local đạt 1.278 unit trên `9a79f5c` và 103 UI tools trên `2ff217f`. T05 xác nhận đúng staging, gặp lỗi làm mới OAuth MCP và chưa có bằng chứng fixture hoặc TLS, giao thư và ngân sách SMTP. Khôi phục quyền đọc staging rồi xác minh fixture và đường gửi trước khi mở tích hợp T06. Checkpoint ở `.git/local-notes/reviews/owner-mock-ci-t05-20261110/` của checkout chính. |

| 02/11/2026 — merge/main CI | [T02 sau merge](tasks/g01-g10-t02-2026-10-28.md), main28a3dc5 | PR16 merged, tree bằng nguồn đã review/PR CI; branch T02 remote/local đã xóa. Main CI41385640659/a1 đủ18/18PASS, PG16 30/30 và cleanup đạt. Docs công bố riêng; không merge docs vào main. R-APP NOT_RUN/UI UNKNOWN/full backend chưa nghiệm thu. |


<a id="verification"></a>

Mốc 11/11/2026: [Rà lược đồ và luồng OTP T06](tasks/g01-g10-t06-schema-otp-review-2026-11-11.md) đã chốt dùng quán thử tạo mới, kiểm bảng `stores` rỗng sau khi dọn đúng phạm vi được duyệt rồi mới áp ràng buộc chủ sở hữu bắt buộc. Còn các điểm mở về hợp đồng provisioning, OTP/Store Key và quyền khi tạm ngưng. Chưa chạy migration, xóa dữ liệu hay tích hợp thật.

Cùng ngày, chủ dự án chốt quyết định 50 về server tự khởi chạy sau khi commit quán và quyết định 51 về màn chờ POS. Cả bộ mẫu ghi trong một giao dịch riêng. Sau lỗi, chủ có thể thử lại hoặc chọn vào quán trống khi server đã xác nhận. Đã cập nhật đặc tả và TC-OWNER-03/09. Các ca mới chưa chạy.

R02 đã bổ sung hợp đồng giữ số và ghi quán phía server. Điểm ghi quán liên kết số đã giữ với UUID đã xác minh từ đúng lần gọi Auth. Còn cách ghi audit hệ thống cho lần seed tự động và việc kiểm phản hồi Auth khi triển khai.

R03 đã ghi quyết định 52 về tự gửi tiếp thư OTP tạo quán còn chờ. Server giữ bản mã tạm cho thư chưa được nhận gửi và dùng hạn của mã gốc. TC-OWNER-107 bao phủ mất kích hoạt, tranh lượt gửi, hết hạn và mất kết quả SMTP. Ca kiểm thử chưa chạy.

R04 đã ghi quyết định 53 về đọc giờ DB sau khóa và khóa OTP tạo quán ở lần sai thứ năm. TC-OWNER-108 kiểm chờ khóa qua hạn OTP, chờ khóa hạn mức, tranh lượt sai cuối và bộ đếm qua nửa đêm. Các ca runtime chưa chạy.

R05 đã ghi quyết định 54 về mở nhiều tab, giữ kết quả của lượt đã bị từ chối và liên kết chỉ tra cho lượt mới cùng intent. TC-OWNER-109 bao phủ F5, tranh chỗ liên kết và quyền Store Key. Mock cần đồng bộ nhánh gửi lại một lượt đã từ chối. Ca runtime chưa chạy.

R06 đã ghi quyết định 55 về Store Key trong phản hồi Xác nhận gốc qua hạn OTP. TC-OWNER-110 bao phủ gửi lại, F5, thư lỗi và hạn xử lý. Mock cần bổ sung lời gọi gốc còn chờ sau hạn OTP. Ca runtime chưa chạy.

R07 đã ghi quyết định 56 về khóa quán qua RPC nghiệp vụ, ngoại lệ đọc trạng thái của thiết bị, audit và giới hạn của cổng ảnh. [Hồ sơ R04–R07](tasks/g01-g10-t06-schema-otp-review-2026-11-11.md#r04--mốc-hết-hạn-và-lần-sai-thứ-năm) lưu quyết định, căn cứ và review. TC-OWNER-95/111 chưa chạy.

[T06 hiện thực ngày 11/11/2026](tasks/g01-g10-t06-owner-implementation-2026-11-11.md) đã kiểm PostgreSQL loopback, Auth/SMTP giả lập, cổng ký IP và các ca chờ khóa. Sau mốc local, staging đã được backup, cutover đúng ba quán thử và thử thành công OTP, ghép Store Key, PIN chủ và seed trên quán `0004`. Protected Preview và R07 hosted còn chờ.

## Phạm vi kết luận

Kế hoạch được đối chiếu với source, đặc tả và hồ sơ được dẫn. Mốc 28/10/2026 gồm khảo sát T01 và phân tích T02; mốc 29/10 kiểm lại revision 3 của khảo sát tĩnh T03-A và bản tổng hợp đã hiệu đính, đóng R-I-02 và hoàn tất phần khảo sát. T03 tổng thể chưa được ghi nhận hoàn tất. Các mốc khảo sát trước không tạo execution mới; riêng02/11 đã kiểm U/P local trên workingcandidate T02. C nhánh/PR/main đều18/18PASS; bản sửa đã merge tại28a3dc5. R-APP chưa chạy, UI UNKNOWN; full backend và các phần sản phẩm chưa được nghiệm thu bằng lane này. Kết quả lịch sử, tiêu chí nghiệm thu và trạng thái phát hành giữ nguyên.
