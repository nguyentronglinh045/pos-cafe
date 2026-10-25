# HP1: hiện trạng và điểm kẹt — 18/10/2026

Phạm vi: giải thích theo câu hỏi owner sau audit CI/CD/Preview; chỉ đọc source và hồ sơ. Không đổi acceptance, không tiếp tục implementation/fullrun hoặc mở quyền hosted. Source phân quyền vẫn c898d7602d83e1e6d444e0c22259bd141bef85a4 cộng WIP đã giữ; [audit trước](../workflow/tasks/project-ci-cd-followup-2026-10-18.md) là nguồn tổng hợp các gate khác. Bản này phân tích rủi ro/phụ thuộc, không có phép đo thời gian để xếp hạng critical path.

**HP1 hiện là cụm công việc phức tạp và nhiều bất định nhất trong những phần đã rà.** Đánh giá này gồm cả môi trường chạy và cách giữ bằng chứng của HP1. PIN19/PERM60, source tích hợp và review cuối vẫn là các gate độc lập còn thiếu trên candidate cuối; gỡ HP1 chưa tự làm bản phân quyền đủ điều kiện merge.

HP1 chuẩn bị và kiểm chứng **gói bằng chứng backup phục vụ migration/cutover phân quyền**. Nó phải chứng minh dữ liệu được chụp nhất quán, archive có thể phục hồi đúng trong môi trường cách ly và bộ kiểm tra có thể đọc lại bằng chứng để tính lại kết quả. Bộ tạo gói, schema, comparator và offline loader đã có; kết quả LOCAL vẫn không cấp quyền cutover hoặc chứng nhận provider hosted. Code giữ certified registry rỗng tại `D:/Workspace/pos-cafe-ci/scripts/permission-hosted-profile.mjs:6`; release dispatcher từ chối LOCAL trước đường release tại `scripts/permission-backup-dispatch.mjs:17–20`. [Hợp đồng HP1](../runbooks/permission-hosted-hp1-2026-10-14.md#phân-biệt-implementation-và-certification).

Độ khó nằm ở các phép chứng minh liên quan nhau: các bước đọc/dump phải dùng cùng snapshot PostgreSQL; dữ liệu, schema, role/quyền và bộ cấp số phải khớp; restore pristine và clone để thử cấp số được tách riêng; refs/hash/identity/phạm vi phải được kiểm độc lập. “Hai capture graphs” là hai bộ bằng chứng từ hai lần chụp; offline replay là đọc lại chính các tệp đã lưu và tính lại kết quả, không cần kết nối DB. Các yêu cầu này có tại [runbook dòng15](D:/Workspace/pos-cafe-docs/docs/runbooks/permission-hosted-hp1-2026-10-14.md:15), producer `D:/Workspace/pos-cafe-ci/scripts/permission-hosted-backup.mjs:61` và comparator `scripts/permission-hosted-compare.mjs:60,133`.

| Phần | Đã có | Đang kẹt ở đâu |
| --- | --- | --- |
| Lõi HP1 | Producer/schema/comparator/offline loader; source58 có75kiểm tra LOCAL PASS lịch sử | Chưa có full gate và SEC→EVC cuối trên cùng source mới. Không chuyển75PASS cũ sang c898+WIP |
| Đầu vào | Trước đây LOCAL cũng pin file duyệt phạm vi lịch sử23.508B; owner đã từ chối đưa file này lên Actions | Profile LOCAL với scope/fixture tổng hợp đã có code WIP, nhưng chưa nối đủ local-run/recipe và kiểm negative/runtime. Phải giữ nguyên pin/quyền hosted |
| Môi trường chạy | Worker backend đã chạy pilotT09/T10,4/4PASS | Chưa điều phối đủ PIN19/PERM60/HP1 hoặc chứng minh full recipe fit20GiB/reserve30GiB. Không tự dựng lại WSL/Docker |
| Bằng chứng/replay | Utility mã hóa có133NodePASS/hai review APPROVE riêng checkpoint; khóa đã tạo | Actual Windows/MSYS GPG roundtrip, collector đủ các refs và kiểm tổng dung lượng giữ lại chưa chứng minh. Upload artifact còn chờ quota/hardstop |
| Đóng gate | Có snapshot source/WIP và nhiều receipt lịch sử | Chưa có candidate tích hợp cuối với toàn bộ gate, bằng chứng phục hồi/replay và hai review cuối phù hợp |

Các trạng thái trong bảng được đối chiếu tại [audit source58 dòng48](D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-progress-audit-2026-10-15.md:48), [chính sách đầu vào HP1](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/project-ci-cd-hp1-input-policy-2026-10-18.md:3), [giới hạn sửa tối thiểu](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/project-ci-cd-hp1-input-policy-2026-10-18.md:43), [pilot suite definitions](D:/Workspace/pos-cafe-ci/scripts/permission-ci1-policy.mjs:14) và [proof-package checkpoint](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/project-ci-cd-completion-2026-10-18.md:197). Utility mã hóa thuộc cách giữ bằng chứng cho fullgate; nó không phải toàn bộ lõi thuật toán HP1.

HP1 từng có **finding thật về độ tin cậy của bộ kiểm tra**: ở candidate cũ, dữ liệu mô tả có thể thiếu bảng/sequence hoặc nhận dạng phiên xuất dữ liệu chưa ràng buộc đầy đủ với log thực mà bộ kiểm vẫn báo PASS. Đã có các lượt sửa và kiểm mới sau đó; source58 có75LOCALPASS, nhưng chưa có review cuối đủ để đóng toàn bộ gate trên source hiện tại. Không báo các finding lịch sử này thành lỗi đang tái hiện ở c898+WIP. [Lịch sử SEC và các lượt sửa](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/permission-hosted-hp1-2026-10-14.md:45).

Sự cố173,924GiB cũng là vấn đề vận hành kiểm thử đã ghi nhận: nhiều môi trường/clone/archive/volume tích lũy; dừng container vẫn giữ dữ liệu trên ổ. Ubuntu đã xóa theo yêu cầu owner; raw/runtime chỉ có trong distro đã mất. Hồ sơ15/10 cũng ghi gói private source56 không còn ở đường dẫn đã lưu; source58 tar không thay được raw proof đó. Đây là lý do phải kiểm khả năng chạy và giữ bằng chứng trước khi chạy nặng, không tự dựng lại lab cũ. [Sự cố và quyết định dung lượng](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/permission-hosted-hp1-2026-10-14.md:53), [giới hạn bằng chứng còn giữ](D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-progress-audit-2026-10-15.md:49).

Theo giới hạn owner đã chọn, bước nhỏ hợp lý tiếp theo là **rà tĩnh đường LOCAL từ entrypoint → generator/scope → capture → offline loader → các test từ chối trước kết nối release**, trả danh sách wiring/test còn thiếu và phạm vi sửa ước tính. Sau đó mới đánh giá recipe/runtime/proof có khả thi trong ngân sách hay không. Nếu phát hiện phải mở rộng đáng kể hơn hướng HP1 tối thiểu thì hỏi owner trước phần phụ thuộc. Không thêm HP2/hosted certification/Production hoặc runtime IDEM087 vào điều kiện merge-only mới; IDEM087 vẫn manual/NOT_RUN riêng theo [quyết định hiện hành](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/project-ci-cd-completion-2026-10-18.md:187).

Candidate giải thích HP1-EXPLAIN01: kết luận đánh giá nút thắt dựa trên số lớp phụ thuộc chưa khép và rủi ro chạy lại, không phải ước lượng giờ/ngày. Không có code/test/runtime mới trong lượt giải thích này; quy tắc tối đa hai lần sửa thất bại cho một vấn đề vẫn giữ nguyên.

## Metadata review HP1-EXPLAIN01

Bản đã review SHA256 `81f81b8bc6bf143320fff1d504a261bcdccfd1dab92415815a6ce22252f73dc8`, snapshot `D:/Workspace/pos-cafe-ci-main/artifacts/hp1-explain01/analysis-reviewed.md`.

- EVC `/root/status_independent_review`: **APPROVE** exact candidate; xác minh đánh giá rủi ro khác ước lượng thời gian, source58/75PASS khác finalsource, pilot4/utility133 khác fullgate, finding lịch sử và phạm vi đề xuất. Không blocker; không chạy runtime/raw replay.
- SEC `/root/docs_commit_security`: **APPROVE** exact candidate; xác minh LOCAL/hosted boundary, historical findings/evidence loss, không lộ private payload/không mở thêm quyền hoặc thêm HP2/IDEM087 làm gate merge. Không blocker; chỉ đọc, không runtime/test mới.

Kiểm liên kết12/12 tồn tại tại máy, whitespace PASS. Mục này chỉ bổ sung metadata verdict, không đổi phần phân tích đã review. Hồ sơ giải thích mới chưa commit/push; không sửa source hoặc chạy HP1 trong lượt này.

## Có thể hoãn HP1 và dùng unit test không — đề xuất, chưa chốt

Owner hỏi có thể bỏ HP1/dùng unit test để tránh làm chậm các phần khác. Đây là câu hỏi điều chỉnh ưu tiên/phạm vi, chưa là quyết định miễn gate hoặc giao sửa source. **Có thể hoãn riêng HP1 và làm tiếp các phần độc lập; unit-only chưa đủ để nghiệm thu toàn bộ phân quyền hoặc phát hành migration trên dữ liệu hiện có.**

HP1 đã dừng trong scope CI/CD theo DEC-COMP-06; CI/CD và mock Preview vừa đạt không chờ HP1. Vì vậy không cần biến HP1 thành điều kiện để bắt đầu mọi feature khác. Việc hoãn giữ code/bằng chứng, ghi DEFERRED/NOT_RUN và giữ khóa các hành động phụ thuộc; không xóa tests hay đổi trạng thái thành PASS. [Quyết định tách CI/CD](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/project-ci-cd-completion-2026-10-18.md:9).

| Mục tiêu | Có thể hoãn HP1? | Kiểm chứng vẫn cần |
| --- | --- | --- |
| Phát triển UI/tính năng không phụ thuộc HP1 và xem mock Preview | Có; kiểm dependency của từng phần | Build/unit và smoke/UI/integration phù hợp phần thay đổi; không cần chạy HP1 cho mọi thay đổi. Unit có thể đủ cho một hàm thuần nhỏ, không tự đủ cho toàn ứng dụng |
| Merge bản phân quyền đang giữ riêng | Có thể đề xuất đổi phạm vi, nhưng chưa tự mở merge | Rà phần HP1 giữ/loại và dependency, chốt candidate/gate mới với owner; vẫn cần kiểm DB/runtime/security, PIN/permission, preservation và review theo phạm vi được duyệt. Hiện chưa chứng minh source tách được an toàn |
| Migration/cleanup/cutover hoặc phát hành trên dữ liệu hiện có | Không dùng unit test thay bằng chứng backup/restore và runtime | Phải có cơ chế backup/khôi phục đã kiểm chứng và gate dữ liệu/quyền/rollout phù hợp. Có thể xem xét giải pháp thay HP1 được duyệt riêng; chưa xác minh một giải pháp tương đương cho dự án |

Unit test hữu ích để giữ logic parser/schema/comparator/generator của HP1 và bắt hồi quy, kể cả khi HP1 bị hoãn. Nó không thực thi đầy đủ SQL grants/RPC/transaction, Auth/PostgREST/Storage/Realtime, snapshot dump/restore hoặc activation/rollback. T15–T16 hiện yêu cầu những phép kiểm runtime đó; kết quả mock/unit không chứng minh quyền và bảo toàn giao dịch trên backend thật. [T15/T16](D:/Workspace/pos-cafe-docs/openspec/changes/redesign-permission-model/tasks.md:215), [gói đề nghị/phát hành](D:/Workspace/pos-cafe-docs/openspec/changes/redesign-permission-model/tasks.md:237).

HP1 là giải pháp đã chọn để đáp ứng yêu cầu backup/proof; có thể đề xuất thay cách đáp ứng. Yêu cầu bảo toàn dữ liệu vẫn phải có bằng chứng phù hợp khi thực hiện hành động trên dữ liệu hiện có. Không khẳng định bắt buộc hoàn thành mã HP1 tự xây bằng mọi giá, cũng không coi một phương án khác mặc nhiên tương đương/chạy được/miễn phí. Hiện gate merge còn HP1 theo [scope hiện hành](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/project-ci-cd-hp1-input-policy-2026-10-18.md:49); muốn bỏ khỏi gate phải ghi và duyệt lại phạm vi trước khi áp dụng, không sửa acceptance để hợp thức hóa kết quả cũ.

Khuyến nghị về tiến độ: đóng băng công việc HP1 và hosted backup/cleanup/migration/cutover phụ thuộc nó, tiếp tục feature/Preview độc lập. Nếu còn cần merge phân quyền để mở đường cho feature mới, bước riêng tiếp theo là rà khả năng tách candidate và đề xuất gate cần giữ; không quay lại sửa HP1 và không tự chuyển sang unit-only. Không thêm HP2/hosted certification/IDEM087 thành gate merge mới. Nội dung này là đề xuất để owner quyết định, chưa triển khai đổi code/CI/spec acceptance hoặc chạy test/runtime.

### Metadata review HP1-DEFER-PROPOSAL01

Candidate SHA256 `715f67460292cb74282f9600ff67ab70b282819465a63904f50f7a59be193f14`; phần HP1-EXPLAIN01 giữ nguyên, chỉ thêm đề xuất theo câu hỏi owner. EVC `/root/status_independent_review` và SEC `/root/docs_commit_security` đều **APPROVE** exact candidate, không finding chặn. EVC đối chiếu T15–T18/unit-vs-runtime/current merge gate; SEC kiểm scope/security/no authority expansion và preservation nội dung cũ. Cả hai chỉ đọc, không test/runtime mới. APPROVE là review tính đúng của đề xuất, không thay quyết định owner hoặc mở quyền triển khai/merge. Mục này chỉ ghi metadata verdict; đề xuất chưa được owner chốt, chưa commit/push.
