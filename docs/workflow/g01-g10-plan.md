# Kế hoạch kỹ thuật G01–G10 của POS Cafe

**Nguồn điều phối hiện hành.** Cập nhật 27/10/2026; code nền `052a7d1e156425ea82ed1c9cf978d7ef4d4f3571`, docs trước kế hoạch `13d359e4cf37bd7817e9fdaf8f1e889fd2e3487d`. Khi tiếp tục phải đối chiếu refs và tiến độ mới. Bảng này giữ trạng thái/ưu tiên; requirement, quyết định và kết quả chi tiết vẫn ở spec/handoff được dẫn.

<a id="next"></a>
## Khi hỏi “cần làm gì tiếp?”

**Đề xuất hiện tại: T01 — chốt ma trận khoảng thiếu và điều kiện kiểm chứng.** Đầu ra là danh sách gate nào còn thiếu trên nguồn cuối, môi trường dùng được và phần bị chặn; chưa chạy full backend. Sau đó bắt đầu T04 — hoàn thiện hồ sơ owner/email G05–G06. T04 có thể khảo sát độc lập trong lúc chờ môi trường; không cần đợi dọn toàn bộ scripts.


AI không trả lời từ đoạn đề xuất này một cách máy móc. Mỗi lần chủ dự án hỏi việc tiếp theo:
1. Đọc bảng này, chỉ mục task và handoff mới nhất; kiểm source/nhánh và các quyết định mới. Yêu cầu cụ thể hiện tại của chủ dự án được ưu tiên hơn thứ tự mặc định.
2. Ưu tiên tiếp tục phần đang làm của đúng người khi không bị chặn; nếu không, chọn việc P0 rồi P1/P2 có dependency đã đạt. “Sẵn sàng phân tích” không có nghĩa đã được sửa code/chạy backend.
3. Đề xuất tối đa một việc chính, kèm lý do, đầu ra và điều kiện bắt đầu. Không gợi ý lại việc XONG/GIỮ NGUYÊN hoặc G11/G12 trước giai đoạn đã chốt.
4. Nếu việc đứng đầu bị chặn, nêu đúng điều kiện cần giải quyết và chọn phần độc lập (ví dụ T04 khi T05 chưa có môi trường). Không chạy lại gate cũ chỉ để tạo hoạt động.
5. Cập nhật bảng khi có quyết định/kết quả mới trước khi bàn giao. Nếu chưa xác minh được tiến độ hoặc source mới, ghi CHƯA XÁC MINH; không đoán DONE.

<a id="authority"></a>
## Phạm vi đã chốt và nguồn

Kế hoạch phần còn lại G01–G10 được lập ngày 27/10/2026: xác định thứ tự kỹ thuật, cập nhật docs và duy trì trạng thái để tư vấn việc tiếp theo.

- [DEC-THESIS-02](tasks/docs-knowledge-clarification-2026-10-25.md#dec-thesis-02): ưu tiên G01–G10; G11/G12 dành cho khoảng hai tuần cuối hoặc bước cuối cùng. Docs kỹ thuật/spec/decision/evidence cập nhật theo từng phần ngay từ bây giờ.
- [Khung thời gian](../roadmap.md#khung-thời-gian-đồ-án--xác-nhận-2026-10-25): 15 tuần từ05/10, tuần16 bảo vệ. Các đợt dưới là thứ tự phụ thuộc, không phải ngày nộp mới. Lịch tuần của biểu mẫu báo cáo không tự được đổi từ phép tính trong roadmap.
- **Phạm vi lập kế hoạch:** kế hoạch kỹ thuật và liên kết đọc/cập nhật docs. Không triển khai tính năng, tạo tài khoản/dịch vụ, đổi DB/SMTP/quyền, chạy gate nặng hoặc phát hành. Khi mở một task sau này phải kế thừa quyền còn hiệu lực; chỉ hỏi phần thiếu, không hỏi lại quyền đã có.
- Giữ kiến trúc hiện tại, nghiệp vụ tiền mặt/online-only và phạm vi PIN đã chốt. Không mở offline, kitchen thật, payment provider, chuỗi cửa hàng hoặc remake toàn bộ admin.
- Bảng này là nguồn trạng thái kỹ thuật chuẩn trên nhánh docs. Không tạo bản local thứ hai của trạng thái sản phẩm. Checklist local/hồ sơ NC cũ giữ giá trị lịch sử; bảng này là nơi chọn ưu tiên G01–G10, không tự đánh dấu checklist cũ DONE.

<a id="baseline"></a>
## Đã xong và không cần làm lại

| Phần | Kết quả đã có / giới hạn |
| --- | --- |
| Tích hợp UI, nhánh | NC-UI đã merge #11–#14 và dọn đúng source branches; [biên bản](tasks/ui-main-docs-integration-2026-10-25.md). |
| Worktree/tài liệu | Đã dọn checkout theo allowlist; còn root WIP và checkout code sạch. [Code cleanup](tasks/code-worktree-cleanup-2026-10-25.md), [docs cleanup](tasks/docs-worktree-cleanup-2026-10-25.md). Không mở lại một đợt dọn diện rộng. |
| Refactor cấu trúc | Report chart/summary, shared query và helper snapshot/cart đã merge PR15, CI sau merge PASS. History/Menu/Floor và RF09a–c NO_CHANGE, phần nhạy cảm HOLD. [Chốt phạm vi](tasks/refactor-safety-2026-10-25/merge-20261027.md#closure-20261027). |
| Docs/nguồn báo cáo | Đã chuẩn hóa thuật ngữ, bản đồ spec/requirement/test, nguồn học thuật và 18 hình. Giữ lại để dùng; không dành giai đoạn hiện tại mở thêm chiến dịch G11/G12. [Đầu vào](tasks/docs-report-inputs-2026-10-26.md). |
| Bằng chứng hiện tại | Build/unit/coverage/mock smoke/UI đã có trên candidate refactor và CI merge. Chúng không đóng backend, thiết bị thật, email, restore, realtime/performance hay Vercel nguồn cuối. [Testing](../testing.md), [giới hạn](../limitations.md). |

Root `D:/Workspace/pos-cafe` còn main5156820 +553 mục WIP; checkout `D:/Workspace/pos-cafe-permission-timeonly-20261022/code` sạch tại052a7d1 ở lần kiểm này. Không tự nhập/reset/pull WIP. Việc phân loại/nhận WIP nếu phát sinh là phần riêng có manifest và quyết định, không phải điều kiện buộc dọn hết trước owner.

<a id="goals"></a>
## G01–G10 còn gì và nối tới việc nào?

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
## Bảng điều phối

**P0** mở đường hoặc rủi ro cốt lõi; **P1** hoàn thiện mục tiêu; **P2** hỗ trợ/tinh gọn khi có lợi ích. Ưu tiên không thay dependency. Mọi việc trong bảng chưa được ghi XONG đều chưa có kết quả nghiệm thu từ kế hoạch này.

| ID | Ưu tiên / việc | Trạng thái ban đầu | Phụ thuộc để thực hiện | Đầu ra phải có |
| --- | --- | --- | --- | --- |
| T01 | P0 — Ma trận khoảng thiếu, source và môi trường | SẴN SÀNG PHÂN TÍCH | Đọc source/handoff hiện hành | Gate→source→fixture/môi trường→PASS/FAIL/NOT_RUN→bước kế; danh sách đúng backend holds, quyền còn hiệu lực, 1 môi trường và ngân sách. |
| T02 | P1 — Khép chẩn đoán CI cũ | SẴN SÀNG PHÂN TÍCH | T01 cho phần chạy kiểm; khảo sát độc lập | Đối chiếu failure40089941679 với source/tests/reporter hiện tại; correction có regression nếu được giao, hoặc giữ UNKNOWN có phép thử tiếp theo. CI xanh không xóa lỗi lịch sử. |
| T03 | P2 — Inventory source/script/config | SẴN SÀNG PHÂN TÍCH | Dùng kết quả kiểm đường đọc/inventory khi có; không bắt buộc đợi | Bảng consumer/owner/lifecycle KEEP/REMOVE-CANDIDATE/ARCHIVE/UNKNOWN. Không có phần đủ căn cứ thì kết luận NO_CHANGE; không buộc relocation. |
| T04 | P0 — Hoàn thiện spec owner và thống nhất khóa store/PIN | SẴN SÀNG PHÂN TÍCH | T01 là nguồn input; phần đọc/spec không chờ lab | Rà proposal/design theo runtime mới; viết usecases/testplan/traceability còn khung, cập nhật đủ bộ spec theo phần; chốt câu hỏi thật sự còn mở. |
| T05 | P0 — Môi trường, email và dữ liệu thử | CHỜ ĐIỀU KIỆN | T01; contract email từ T04; đích/quyền/ngân sách được xác minh | Recipe một môi trường cô lập, email test, fixture hai store/roles, cấu hình đã redacted; đo dung lượng và chứng minh chạy lane cần thiết. Không tự tạo WSL/Docker. |
| T06 | P0 — G05 danh tính owner, provisioning và nền khóa store | CHỜ PHỤ THUỘC | T04 + T05; được giao code/phạm vi | Backend/ports/mock/UI theo từng slice; OTP, verified email, owner–store, hạn mức, rollback provisioning, ghép thiết bị và PIN đúng contract. Bắt buộc có nền trạng thái store, DB chặn dữ liệu nghiệp vụ khi suspended, ngoại lệ owner đọc metadata/trạng thái, audit đổi trạng thái và direct-call tests trước khi đóng giai đoạn 1. Tests/docs theo từng slice. |
| T07 | P0 — Kiểm/fix quyền, giao dịch và PIN liên quan | CHỜ PHỤ THUỘC | T01/T05; chạy theo impact của mỗi slice T06–T10, không đợi cuối mới kiểm | Direct deny, cross-store, revoke/late response, cash full/split/void/recovery/receipt, PIN. Findings có regression và gate tương ứng; giữ các obligations bắt buộc. |
| T08 | P1 — G06 khôi phục Store Key và owner PIN | CHỜ PHỤ THUỘC | T06 đã qua gate giai đoạn 1, gồm nền khóa store; spec recovery đã chốt + T05 | Quên Key khác cấp lại Key; cảnh báo/reauth/audit, phiên và thiết bị cũ, restricted PIN/recovery và nhánh thất bại theo spec. |
| T09 | P1 — G06 đổi thông tin/email và chuyển chủ | CHỜ PHỤ THUỘC | T06 đã qua gate giai đoạn 1, gồm nền khóa store; spec tương ứng; tiếp nối T08 | Đổi email/chuyển sở hữu, owner cũ/mới, quyền/PIN/session, audit, lỗi/đồng thời; không tự thêm màn profile hoặc trường chưa chốt. |
| T10 | P1 — G04 đối chiếu R06-C và hành vi khóa/mở còn thiếu | CHỜ QUYẾT ĐỊNH PHẦN CÒN MỞ | T04 xác định phần chưa chốt; nền trạng thái/DB/ngoại lệ/audit đã thuộc T06; T05 cho phần chạy thử | Hoàn thiện hành vi phiên đang mở, thông báo và khôi phục theo contract được chốt; direct-call/UI tests phần bị ảnh hưởng. Phần đã đáp ứng ghi GIỮ NGUYÊN có evidence. Actor/đường thao tác đổi trạng thái chỉ triển khai khi được giao; không mở provider-admin console. |
| T11 | P1 — G08 UI còn thiếu và findings Report | SẴN SÀNG PHÂN TÍCH | Kết quả kiểm UI khi có; spec phần sửa được chốt | Checklist mang đi/bốn luồng; kiểm dirty-exit Employees trước kết luận lỗi. Chốt rồi sửa riêng cap31, nhãn tháng/tuần/ngày và nghĩa top món nếu thuộc phần được giao. UI gates + hồi quy. |
| T12 | P1 — G09 đồng bộ hai thiết bị | CHỜ ĐIỀU KIỆN | T01/T05; contract/quyền của phần được thử | Ma trận signal/reconnect/revoke/join-only, phép đo và fix nếu được giao; không dùng khoảng polling làm số đo hoặc tự thay requirement latency. |
| T13 | P1 — G10 backup và restore | CHỜ ĐIỀU KIỆN | T05; schema candidate phù hợp sau T06/T08–T10 | Backup DB+ảnh và recipe/khóa cần thiết được bảo vệ; restore vào đích cô lập, kiểm đọc/nghiệp vụ, đo RPO/RTO theo tiêu chí đã chốt. Không ghi đè đích đang dùng. |
| T14 | P1 — G10 bảo mật/hiệu năng/vận hành | CHỜ ĐIỀU KIỆN | T01/T05; source/quyền của phần được đo | Inventory bề mặt, test theo spec hiện hành; workload/ngưỡng/chi phí được chốt trước benchmark, số đo và findings. Không nhận “đã an toàn/nhanh” từ cấu hình. |
| T15 | P0 tại checkpoint cuối — Hồi quy tích hợp | CHỜ PHỤ THUỘC | Các slice đã chọn T06–T14 hoàn tất theo phạm vi; source/spec/env khóa | Ma trận G01–G10 và FR/NFR/PERM/PIN đủ bằng chứng nguồn cuối; full required gates, skips/NOT_RUN rõ; 2 review cho phần nhạy cảm, walkthrough. |
| T16 | P1 — Vercel và kiểm bản giao | CHỜ GATE/QUYỀN | T15 và release gates/đích được giao | URL/version/source/config đúng; bốn luồng và owner/recovery trên web thật; phương án rollback, docs vận hành. Production đang held không tự bật. |

Mọi hàng T05–T16 có tác động hệ thống chỉ được thực hiện khi được giao và đủ điều kiện; bảng không cấp quyền từ trạng thái. T07 là lane kiểm/fix đi cùng từng slice, không là vòng phụ thuộc buộc T06 phải chờ T07 toàn bộ rồi T07 lại chờ T06. T15 tái kiểm tích hợp source cuối, không ghép PASS của nhiều source. Gate bắt buộc trước mỗi slice vẫn giữ; không trì hoãn tất cả kiểm thử đến T15.

<a id="sequence"></a>
## Thứ tự thực hiện và checkpoint

1. **Khép phần chuẩn hóa còn hữu ích trong tuần 4:** T01; chẩn đoán T02 và kiểm kê T03 theo từng phần nhỏ. Các kết quả merge/refactor/cleanup đã xong dùng lại hồ sơ, không làm lại. T03 không chặn T04 nếu chưa có finding ảnh hưởng.
2. **Chuẩn bị khối còn thiếu lớn nhất:** T04; T05 khi đủ đích/quyền/ngân sách. Nếu lab HOLD, vẫn tiến được spec, kịch bản, inventory và câu hỏi nghiệp vụ. Không bắt đầu bằng chạy toàn bộ backend.
3. **G05 và nền khóa store:** T06 chia thành contract/backend, ports/mock, UI rồi tích hợp; T07 kiểm đúng phần cùng mỗi slice. Gate giai đoạn 1 phải bao gồm trạng thái store, DB enforce, ngoại lệ owner đọc metadata/trạng thái và audit theo quyết định 11/18 của change owner. Chưa qua phần nền này thì không đóng T06 hoặc bắt đầu triển khai T08/T09. Nghiệm thu G05 không được gọi là đã xong G06.
4. **G06/G04:** sau gate T06, T08 → T09; T10 chỉ xử lý phần R06-C/hành vi còn thiếu sau đối chiếu ở T04. T10 chờ quyết định không được dùng để hoãn nền khóa store bắt buộc của T06. Có thể điều chỉnh thứ tự phần còn lại của T10 khi impact map chứng minh độc lập; không tự chọn schema khác owner hoặc mở provider-admin console.
5. **Hoàn thiện sản phẩm và vận hành:** T11/T12/T13/T14 theo dependency; phần phân tích độc lập của T11 có thể làm sớm, phần đo/restore dùng cùng môi trường lần lượt. Giữ một môi trường nặng, không nhân stack theo task.
6. **Nguồn cuối và bản giao:** T15 → T16. Lặp gate bị ảnh hưởng nếu có fix; cập nhật bằng chứng/giới hạn và trạng thái từng G. Sau đó chuyển trọng tâm G11/G12 vào giai đoạn cuối đã chốt; nếu gần mốc mà G01–G10 còn thiếu, báo rõ khoảng thiếu để chủ dự án quyết định, không tự giảm scope hoặc nhận DONE.

Không cam kết số ngày cho T05–T16 khi chưa có môi trường, câu hỏi owner/store-lock và workload.

<a id="details"></a>
## Điểm cần giữ khi mở từng nhóm

- **T01/T05:** bắt đầu từ [testing](../testing.md), [strategy](../test-strategy.md), [permission/PIN reconciliation](../spec-reconciliation.md), [backend handoff](tasks/permission-backend-web-release-2026-10-23.md) và receipts mới hơn trong index. T04 backend, bảy service profiles, PIN19/PERM60 và supplemental obligations được kiểm theo phiên bản spec thực tế; không coi tên run/tool có sẵn là gate đã đạt. Xác minh công cụ/credential/môi trường có sẵn, nguồn schema và dữ liệu; ghi rõ đích chưa truy cập được. Không chạy aggregate/config discovery có side effect chỉ để kiểm kê.
- **T02:** [diagnosis lịch sử](../implementation-log/permission-backend-web-release-20261023/permission-main-main01-diagnosis.md) phân biệt reporter attribution và lỗi ứng dụng UNKNOWN. Đối chiếu source hiện tại trước khi sửa; retries/timeout/expected không bị nới để xanh.
- **T03:** nối NC-02/08 và RF-09, giữ operator guides trên main. Import tĩnh rỗng không chứng minh không consumer; xét CLI/glob/CI/trust/phase/external paths. Reviewer chốt diff source; temp/cache chỉ xóa nhóm có quyền, giữ evidence. Kết luận giữ nguyên có căn cứ là đầu ra hợp lệ.
- **T04/T06/T08/T09:** dùng cùng [change owner](../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md), không mở change cạnh tranh. Proposal có nhiều quyết định đã chốt, không hỏi lại; `usecases.md/testplan.md/traceability.md` còn placeholder tại base. Lời mô tả runtime/lịch tuần/“làm ngay” trong tasks cũ phải được đối chiếu với runtime permission mới. Hoàn thiện spec đúng thứ tự và gates của SPEC-STANDARD, không viết toàn bộ feature xa lịch chỉ để đủ file.
- **Owner/PIN/store:** [PIN delta](../../openspec/changes/force-default-pin-change/proposal.md) và [R06-C](../spec-reconciliation.md#r06-decisions) có thể chạm cùng lifecycle. Quyết định 11/18 của change owner và [delta store-isolation](../../openspec/changes/add-owner-account-and-store-provisioning/specs/store-isolation/spec.md) đã chốt nền khóa DB, ngoại lệ owner đọc metadata và audit trong giai đoạn 1: T06 phải nghiệm thu phần này, không hỏi lại hoặc chuyển sang T10. T04 chỉ làm rõ cách khớp runtime permission hiện tại, hành vi phiên đang mở/khôi phục, actor/đường thao tác chưa chốt và các trường thông tin chủ ngoài email. Màn quản trị nhà cung cấp thuộc change riêng, không được kế hoạch này tự đưa vào scope. Chỉ báo ngưỡng OTP/quota theo quyết định hiện hành, không tự đổi.
- **Email/data:** đường gửi, hạn mức và dịch vụ miễn phí phải kiểm lại khi triển khai bằng tài liệu chính thức; không tự đăng ký tài khoản hoặc cấu hình SMTP từ checklist lịch sử. Quyết định xử lý dữ liệu cũ trong proposal không thay xác nhận đúng đích/phạm vi tại bước phá hủy; backup DB/ảnh/khóa, recovery và review vẫn áp dụng. Chỉ cấp thông tin thử nghiệm tối thiểu theo phạm vi được giao; giữ bí mật dịch vụ ngoài tài liệu.
- **T11:** các finding Report và giới hạn ở [biên bản refactor](tasks/refactor-safety-2026-10-25/merge-20261027.md#closure-20261027) còn mở; không sửa test expected để hợp thức hóa code. Mang đi là một trong bốn luồng G08; không coi ba batch B01–B03 là đã kiểm tất cả bốn.
- **T12–T16:** [limitations](../limitations.md), [CI/CD change](../../openspec/changes/setup-project-ci-cd/proposal.md), backup/release receipts hiện hành là input. Chốt phạm vi/target và giữ protection/productionEnabled:false khi chưa có quyền đổi. Public staging hoặc Vercel đang mở không tự là đích được phép thử ghi.
- **Dung lượng:** trước tải/copy/cài/build/DB lớn đo ổ C và data-root Windows; tối đa +20GiB/task và giữ tối thiểu30GiB trống theo quy tắc máy. Chưa biết đỉnh thì dừng phần ghi lớn. Không tái tạo WSL/Docker ngoài quyền; cleanup chỉ theo nhóm được phép, không hạ coverage/ACL/acceptance để tiết kiệm.

<a id="updates"></a>
## Cách đọc, cập nhật và xác nhận hoàn thành

- Đọc bảng này khi bắt đầu/tiếp tục task liên quan G01–G10 và khi tư vấn việc tiếp theo; dùng `git show docs:docs/workflow/g01-g10-plan.md` sau xác minh ref. Đọc cả spec/handoff của task được chọn, không chỉ bảng tổng.
- Trước sửa, kiểm task/handoff hiện hành và source/dirty state. Một tác giả cập nhật cùng file/source ở một thời điểm; kết quả đầu vào phải được kiểm trước khi cập nhật trạng thái kỹ thuật.
- Trạng thái dùng: **SẴN SÀNG PHÂN TÍCH**, **CHỜ PHỤ THUỘC/ĐIỀU KIỆN/QUYẾT ĐỊNH/GATE**, **ĐANG LÀM**, **CHỜ REVIEW**, **XONG**, **GIỮ NGUYÊN**, **HOÃN**, **CHƯA XÁC MINH**. Bổ sung handoff, việc đang làm và bước kế trong ô trạng thái khi task được mở. Không chuyển sẵn sàng phân tích thành code đã được duyệt.
- Mỗi checkpoint có thay đổi: sửa hàng task, blocker/dependency, evidence/source và đoạn “việc tiếp theo”; thêm dòng nhật ký bên dưới. Ghi ngày, việc đã làm/chưa làm, source/env và link handoff kỹ thuật. Nếu không đổi trạng thái, ghi trong handoff task; không tạo commit chỉ để đổi ngày.
- XONG cần đầu ra/kiểm/review đúng workflow và source; việc nhạy cảm cần hai reviewer. Duyệt spec, code merge, technical PASS, nghiệm thu và phát hành là các trạng thái khác nhau. Một task XONG không đóng cả G nếu phần bắt buộc khác chưa xong. Kết quả đầu vào phải được xác minh; không tự tính phiếu/ảnh là backend PASS.
- Sau sửa code cập nhật spec/kiến trúc/testing/limitations liên quan ngay, không đợi G12. Trước bàn giao docs kiểm link/diff và review; commit/push trong quyền đã có. Nếu chưa xuất bản được, ghi rõ candidate/ref/đường lưu và lý do; không tuyên bố bảng remote đã cập nhật.
- Cơ chế này là quy tắc làm việc trong AGENTS/workflow/start-task, không phải chương trình chạy nền hay bảo đảm mọi AI ngoài dự án tự đọc. Với chat/máy mới gửi đường đọc hoặc prompt mở đầu; không tạo bản local thứ hai có trạng thái độc lập.

| Ngày | Sự kiện / nguồn | Thay đổi trạng thái |
| --- | --- | --- |
| 27/10/2026 | Khởi tạo kế hoạch kỹ thuật G01–G10 theo DEC-THESIS-02 | Các task sản phẩm chưa được nghiệm thu bởi việc lập kế hoạch; thứ tự kỹ thuật có thể điều chỉnh theo kết quả thực. |

<a id="verification"></a>
## Kiểm và bàn giao kế hoạch

Bảng này điều phối công việc kỹ thuật; việc chỉnh tài liệu không đóng gate sản phẩm. Khi cập nhật phải kiểm các đường đọc, trạng thái và tình huống chọn việc bị chặn/đã xong/source thay đổi. Giữ nguyên bằng chứng, phạm vi review và giới hạn của từng task. Lượt chỉnh ngày 27/10/2026 chỉ thay tổ chức tài liệu, không chạy app/backend hoặc thay ứng dụng.


Review ngày 27/10/2026: hai reviewer độc lập **APPROVE** candidate `d7c20e5db7bc170e20a066ba55f12f587c51fb83`, tree `756e938f1d1c2a9488a9abd5f14ebb72c1c1d5cf`, trong phạm vi tổ chức tài liệu và bảo toàn kế hoạch kỹ thuật. Không còn finding chặn; không có kiểm thử app/backend trong lượt này. Receipt chi tiết được giữ local theo quy tắc AGENTS. Dòng này chỉ bổ sung metadata review, không thay nội dung đã duyệt.
