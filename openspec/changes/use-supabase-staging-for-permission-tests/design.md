> **Đối chiếu xuất bản 25/10/2026.** Hồ sơ thiết kế và checkpoint staging lịch sử; không mở lại bootstrap/grant/cutoff. Routing hoặc local PASS không thay SQL/hosted/full acceptance; task này chỉ xuất bản tài liệu. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thiết kế — staging riêng

## Các lớp và thứ tự

1. Giữ nguyên catalog/runner/tests local. Xuất inventory có hashes, review mapping từng stage; chưa chuyển row nào thành PASS.
2. Thêm công cụ staging riêng dùng Node built-in. Guard kiểm explicit manifest và private config trước mọi network, không nhận SQL hoặc lệnh tùy ý. CLI đầu chỉ có `inventory` và `preflight` read-only.
3. Sau plan được cả2scope APPROVE: tạo đúng1project mới tên `pos-cafe-permission-staging`, Free nếu thực sự có slot. Không GitHub auto-deploy. Không copy production data. Kiểm default grants/RLS của provider; không tự thay acceptance hoặc bật auto-RLS để sửa test. Credential entry qua browser thuộc bước owner tự thực hiện; plugin chỉ dùng sau xác minh kết nối/quyền.
4. Ghi actual ref/origin/provider metadata và attestation; preflight Auth reachability/REST routing đọc với explicit key đúng staging. Chỉ kiểm phạm vi đó, chưa chứng minh đọc dữ liệu hoặc DB identity/logic. S05 đầu đã FAIL vì chọn OpenAPIroot; bản sửa thay bằng typedmissingresource theo contract provider, giữ lịch sử FAIL.
5. Bootstrap riêng sau review exact bundle001–016 + prepare/activation theo controller hiện có, kiểm quyền managed Postgres, migrations/current schema, extensions, Auth/Storage/Realtime/Edge config. Không chạy glob, `db push` hoặc local fixture bootstrap trên cloud. Có marker riêng cùng connection và lock trước writes. Bước này chờ adapter/provider proof, không được mở bằng preflight PASS.
6. Chuyển các kiểm nghiệp vụ đủ điều kiện sang hosted adapter riêng. Giữ assertions/reporters/negative cases/role isolation. Các bài reset/rollback/restore/provider ownership giữ lane isolated cho đến khi chứng minh tương đương. Chỉ công bố full backend khi union kết quả current-source phủ đủ mọi required row và gate gốc.

## Inputs và outputs của slice đầu

| Trường | Kiểu và ràng buộc |
| --- | --- |
| manifest.version | literal `permission-staging-v1` |
| manifest.projectRef | string20ký tự `a-z`, khác `kfqjdfwxhkdwihjobpny`; phải là ref vừa tạo được owner xác nhận hoặc provider observed |
| manifest.apiOrigin | HTTPS exact origin của ref, không slash cuối/port/query/credentials |
| manifest.baselineSource | exact SHA40 `90e30f2b2b0f046c549b268b32f1840ad99c2409`; source hiện thực bổ sung bind bằng fingerprints riêng |
| manifest.coverageSha256 | SHA256 của inventory canonical; không nhận inventory rỗng hoặc bỏ row |
| manifest.sourceFingerprintSha256 | SHA256 riêng của actual git HEAD+nội dung mọi file tracked+4tool staging mới; kiểm trước/sau GET |
| manifest.deadlineUtc | exact `2026-10-21T16:00:00.000Z` |
| privateConfig | JSON file tuyệt đối, đúng2keys `projectRef`,`anonKey`; key không rỗng, không newline, tối đa8192ký tự; không log value |
| receipt | JSON allowlist, không raw error/body/headers; ghi source/config/tool hash và target/operation/time/status |

Public manifest không chứng minh provider identity cho SQL. Vì vậy công cụ slice đầu không có phương thức SQL/seed/reset, không cấp `mutationReady=true`.

Guard attempt ban đầu (đã tiêu): actual HTTP ghi exclusive `D:/Workspace/pos-cafe-permission-run-20261020/evidence/staging-20261021/remote-preflight.claim.json` trước network, bind workstream/manifest/source/target/time. Path không phụ thuộc receipt path hoặc hash manifest; đã tồn tại thì `STAGING_ATTEMPT_USED`, không retry/reset. Synthetic test có store riêng được ghi synthetic, actual HTTP không được inject store. Đây là guard ứng dụng Windows, không là quota OS.

Owner đã cấp đúng1slot bổ sung sau FAIL bằng `REST_PROBE_REMEDIATION_01`, grant canonical `179959c4b6608cc17807c3150f806cae6afe31036c73018ba5c2c93e92e1803b`. Claim cũ giữ nguyên rawSHA256 `3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766`; guard đọc grant exactpolicy+predecessorhash+targetineckiashpwloncxnbqx trước khi exclusivewrite fixedslot `remote-preflight-remediation01.claim.json`. Claim mới bind grant/hash/source/manifest/time. Không tạo lượt mới bằng đổioutputpath, source hoặc mấtprocess; không mở attemptthứba. Đây là quyết định bổ sung riêng, không reset cap ban đầu.

## Network và lỗi

Chỉ2GET `/auth/v1/settings` (2xx) và `/rest/v1/__permission_staging_probe_20261021__?select=*&limit=0` (404+JSONcode`PGRST205`) vào exact origin; redirect=`error`, proxy không tự cấu hình từ input, timeout mỗi request5giây gồm body, tổng cửa sổ15giây. RESTbody chỉ parse tối đa4096bytes và chỉ giữ mã/classification allowlist, không lưu rawbody/message/hint. Từ chối mọi lỗi khác, generic404 và resourcecollision200; `restDataAccessVerified=false` kể cả PASS. Lỗi hữu hạn gồm `STAGING_TARGET_REFUSED`, `STAGING_INPUT_REFUSED`, `STAGING_COVERAGE_DRIFT`, `STAGING_SOURCE_DRIFT`, `STAGING_GRANT_REFUSED`, `STAGING_ATTEMPT_USED`, `STAGING_DEADLINE`, `STAGING_REMOTE_REFUSED`, `STAGING_NETWORK_FAILED`. Không network khi local guard fail.

Nguồn currentcontract: [Supabase OpenAPI restriction](https://supabase.com/changelog/42949-breaking-change-removing-access-to-openapi-spec-via-the-anon-key), [PostgREST error contract](https://docs.postgrest.org/en/stable/references/errors.html#group-2-schema-cache). Roleanon/publishable không được kỳ vọng đọc OpenAPIroot. Reviewer phải kiểm method/path/role/expected/currentprimarysource trước actualattempt; syntheticfixture không tự chọn expectedsuccess mà thiếu contract.

## Coverage và bằng chứng

Inventory có tất cả row IDs tạo từ stage/file/name/project, thứ tự và duplicate policy của catalog giữ nguyên; lưu hash các inputs catalog/controller/plan/full PIN inventory. Mapping là planned-only, phân biệt STATIC/ISOLATED_REQUIRED/HOSTED_ADAPTATION_REQUIRED. Default bảo thủ: chưa có adapter thì mọi service row vẫn phải chạy lane cũ và mang `hostedStatus=NOT_IMPLEMENTED`.

Khảo sát độc lập:5stageSTATIC/313row;29stagebackend cần hostedadapter và target cô lập;1stagePG16 giữ acceptance native. A/I có thể đồng thời: isolated không nhất thiết Docker, nhưng không giả định managed Postgres cung cấp quyền `supabase_admin` superuser mà T04 đang yêu cầu. T04 cùng physical backend19stage, PIN19 pristine target và các ACL/fault injection giữ nguyên acceptance. Full inventories có726PERM occurrence+111PINmapping=837; catalog deduplicate trong stage còn760identity, không mất row do đổi lane.

Evidence gọn ở docs/implementation-log: inventory JSON, local guard receipt, review packets/hash, provider/project metadata khi có; secrets ngoài docs/repo. Không ghi raw UI chứa password/key. Evidence của DB gốc trước đây chỉ là context, không dùng thành actual staging proof.

## Ngân sách và khôi phục

Không cài package/runtime, không WSL/Docker, không publish/CI trong slice đầu. Không sửa/xóa V3 cũ. Nếu có remote lỗi, giữ project mới để tiếp tục, không tự xóa project hoặc đổi credential; lưu stage đã commit và failed/unknown. Stop mutation22:30/test22:45/checkpoint22:55. Hết thời gian thì `NOT_RUN` đúng phần, không đổi scope để nhận hoàn tất.
