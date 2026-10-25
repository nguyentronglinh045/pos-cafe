# HP1 trên CI — đề xuất chính sách đầu vào, 18/10/2026

Trạng thái hiện hành: **dừng phần HP1 theo DEC-COMP-06: owner chọn tách CI/CD trước, phân quyền tiếp tục chờ đủ gate**. Các sửa LOCAL đã làm giữ WIP ở `D:/Workspace/pos-cafe-ci`, chưa tích hợp local-run/recipe hoặc review/gate runtime, không merge vào main. Owner đã từ chối metadata scope79 lịch sử lên Actions; quyền đó vẫn giữ nguyên. Phần dưới giữ lịch sử đề xuất/steering, không là chỉ thị tiếp tục triển khai trong CI-only.

## Vướng mắc đã xác minh

File duyệt phạm vi lịch sử 23.508B có hash `362883c12c6d5a1666258572fc7acb32d283c702725520dc06d8a1705ed8ddb8`, chứa UUID quán và metadata Storage gắn hosted. Nó không phải dump giao dịch nhưng vẫn là đầu vào riêng tư owner chưa cho phép đưa lên CI.

Contract HP1 hiện cố ý dùng approval này cả ở LOCAL: [runbook](https://github.com/nguyentronglinh045/pos-cafe/blob/1d87c409f8e8902f0397eb3ab27f7021309c3b0b/docs/runbooks/permission-hosted-hp1-2026-10-14.md) dòng7/35 quy định binding là đích dự kiến và mang exact approval bytes; `scripts/permission-hosted-backup.mjs:38` pin hash, `:48` đưa bytes vào graph; `permission-hosted-schema.mjs:79` áp pin cho binding. Comparator `permission-hosted-compare.mjs:64` kiểm ref/hash, chưa parse và so approved UUIDs với fixture tổng hợp. Đổi sang file tổng hợp là thay đổi chính sách, không phải config thông thường.

Historical v2 cũng pin file tại `permission-backup-v2-plan.mjs:3–11` và `permission-backup-v2-core.mjs:173`; đề xuất không thay các nhánh này. Dispatcher và `observePermissionReleaseProofs` kiểm proof trước controller connect; `requireHostedCutover`, certified registry rỗng và eligibility false tiếp tục chặn admission. Tuy nhiên, `runPermissionReleaseLegacyInflight` tại `permission-release-rehearsal.mjs:386–427` tạo Client, connect và bootstrap query trước `runReleaseCutover`; không có cơ sở nói mọi entrypoint đã chặn trước connect. Phương án A phải bao phủ riêng entrypoint này, không lấy các guard đã có thay cho kiểm ranh giới profile mới.

Các đường dẫn code trên thuộc `D:/Workspace/pos-cafe-ci` tại sourcec898d7602d83e1e6d444e0c22259bd141bef85a4. Đây là khảo sát code và tài liệu hiện có, chưa có thực nghiệm profile mới.

## Phương án A — profile LOCAL riêng, khuyến nghị

1. Thêm profile có tên riêng, dự kiến `supabase-local-synthetic-logical-v1`. Chỉ dùng LOCAL_SYNTHETIC và runtime owned/network-none đã kiểm; không chọn chỉ bằng một cờ caller. Giữ graph schema3, comparator và offline loader. Profile hosted hiện tại tiếp tục pin scope79, không fallback và không nhận approval LOCAL.
2. Sinh approval LOCAL có kind riêng trong worker từ generator tracked và fixture mới; không đọc approval lịch sử hoặc nhận file approval ngoài. Closed schema bind source/method/run/namespace/target/fixture/diversity/schema hashes. Exact sets là synthetic77+2/79 approved stores/Auth,66 preserved Auth/145 tổng,3 Storage objects với2 selected/1 preserved. UUID/path thuộc namespace tổng hợp đã khóa, không sao chép provenance hay quyết định cleanup hosted.
3. Producer và offline verifier độc lập parse approval, kiểm exact bytes/hash và so identity sets với actual inventory/fixture; không chỉ kiểm counts hoặc tin field synthetic=true. Không chấp nhận bất kỳ SHA64 nào chỉ vì modeLOCAL. Profile/approval/provenance sai cặp phải từ chối.
4. Release/rehearsal explicitly reject profile LOCAL trước controller/inventory/connect dù có external LOCAL pin, nhãn assurance giả hay manifest được rehash. Bao gồm `runPermissionReleaseLegacyInflight`: admission phải chạy trước tạo Client/connect/bootstrap query, có negative test chứng minh không gọi các bước này khi nhận profile LOCAL; không chỉ trông vào dispatcher gọi muộn. Giữ registry certified rỗng và coverageComplete/cleanupEligible/executionReady=false. Scope tổng hợp không thay NEW79/hosted scope hoặc các proof C/Storage/L/window.

Bước triển khai sau khi owner duyệt hướng: cập nhật đúng spec/runbook/schema/binding/producer/verifier/release admission và negative tests; hai review sensitive trên exact candidate trước chạy. Không mở hosted certification hoặc phát hành trong task này.

## Gate giữ nguyên và kiểm thêm

- Giữ toàn bộ75 HP1 checks, hai capture graph và offline replay; ít nhất35/63 bảng nonempty theo HP1 task, PIN19/PERM60/IDEM087 và SEC→EVC cùng final source. Thêm negative/preflight không thay gate; không relabel evidence cũ.
- Kiểm thiếu/thêm/trùng/ngoài namespace UUID, source/run/target/fixture/hash drift, extra fields/path traversal và lệch77+2/79/66/145/2+1.
- Cross-profile: LOCAL↔HOSTED, synthetic approval vào hosted, hosted approval vào LOCAL; đổi profile+environment rồi rehash vẫn reject. Release/rehearsal/hosted transport từ chối trước connect/credential access; riêng legacy-inflight phải kiểm không tạo Client/connect/bootstrap query trước admission.
- Fresh schema/diversity phải giữ Auth/Storage/Realtime/partition/LO/ACL và exact consumers; recipe/runtime fit20GiB và private evidence retention còn cần chứng minh riêng. Không nhận thay chính sách là đã có fullgate PASS.

Rủi ro cần review: nhánh LOCAL vô tình nới hosted hoặc scope tự khai không khớp DB. Profile tách rõ, closed schema, kiểm độc lập actual sets và test trước connect là điều kiện bắt buộc của phương án.

## Phương án B — giữ nguyên contract

Không sửa policy hiện có. HP1 tiếp tục BLOCKED vì owner chưa cho phép đầu vào lịch sử lên CI. Chỉ tiếp tục khi owner cho phép một môi trường riêng phù hợp dùng metadata đó; chưa tạo môi trường mới và không tự tạo WSL/Docker Desktop. Bản phân quyền chưa đủ gate để merge chung trong lúc HP1 còn bị chặn.

## Quyết định cần owner

Duyệt A để lập spec/review, triển khai profile LOCAL với scope tổng hợp mới, giữ nguyên hosted và toàn bộ gate; hoặc giữ B, tiếp tục chặn phần HP1. Đề xuất này không tạo quyền thực thi hoặc miễn gate. Các phần fixture backend và công cụ mã hóa độc lập vẫn tiếp tục theo quyền hiện có.

## Steering 18/10 — giới hạn triển khai tối thiểu

Owner nghiêng A với điều kiện HP1 phải xử lý tối thiểu vì đã có sự cố nghiêm trọng, để dành thời gian cho phần khác. Hướng triển khai được khoanh: tái dùng local-run/runtime/inventory/comparator, chỉ tách input LOCAL và guard release cần thiết; nếu cần mở rộng hoặc tái cấu trúc lớn thì dừng trình lại. Chưa coi đây là gatePASS, quyền upload hoặc thay quyền hosted.

Trần khoanh việc HP1 nội bộ dự kiến12 đường dẫn: helper LOCAL, generator tổng hợp; schema/profile/producer/comparator/dispatcher/rehearsal; hai file test; local-run và điểm gọi recipe. Không đổi runtime/catalog/globals/controls, SQL ứng dụng, dependency hoặc certified registry. Ước tính riêng policy320–480 dòng, chưa tính generator/tests; chưa phải cam kết runtime fit. Không xây framework chứng thực mới.

Contract đầu vào mới không nhận approval hoặc fixture/diversity SQL lịch sử. Generator tracked nhận fixtureRunId/namespace và metadata partition từ schema synthetic hiện quan sát, sinh SQL và exact synthetic identities. Approval từng graph đóng, bind source/method/fixtureRunId/captureRunId/namespace/target; giữ scopeApprovalRef hiện có, thêm hai leafSQLrefs và trỏ lại schemaSource ref sẵn có, không thêm top-level evidence keys. Producer và offline verifier kiểm independently actual identity sets và bytes generator. FixtureRunId khác captureRunId: hai capture dùng cùng dataset nhưng runId khác, không đổi IDs theo captureRunId. Khóa approval/hash binding sau khi đã biết schemaSource, tránh vòng hash giữa scope và binding.

Rà scope độc lập xác nhận IDEM087 là requirement riêng đã được CI routing sang manual/NOT_RUN theo DEC-CICD02; chưa có căn cứ biến nó thành một runtime mới bắt buộc của merge phân quyền từ draft recipe18/10. Giữ nguyên routing/status, không miễn gate fullbackend/release hoặc nhận087PASS. Gate merge vẫn fullPIN19/PERM60/HP1/core/UI/exactreview theo các nguồn bắt buộc; không dùng production mutation/hosted certification/HP2 làm điều kiện merge-only mới.


## DEC-MERGE-A18 — thay phần thực thi HP1, 18/10/2026

Owner đã chọn A và yêu cầu không chạy HP1, chỉ đảm bảo mã giữ lại không gây lỗi. Không triển khai LOCAL profile, không đọc/upload scope lịch sử, không capture/graphs/replay; giữ HP1 dormant với chặn trước input/runtime, chỉ unit/import/build/negative admission. Không mặc định chạy lại HP1 cho release nếu chưa có yêu cầu mới. Các gate nonHP1, bằng chứng riêng tư/custody/quota, scope79/bảo toàn66Auth+Storage và mọi khóa Production/DB/cutover không đổi. Backup chuẩn + restore cách ly cần xác minh riêng. Chi tiết và trạng thái candidate tại [hồ sơ quyết định](permission-merge-hp1-alternative-2026-10-18.md#dec-merge-a18--a-đã-duyệt-hp1-không-đưa-vào-vận-hành); phần đề xuất cũ chỉ còn giá trị lịch sử ở điểm đã bị thay thế này.
