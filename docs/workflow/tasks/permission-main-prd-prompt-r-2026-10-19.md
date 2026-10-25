# Prompt R — PERM60 pure stage/aggregate collectors

PREPARED_NOT_DISPATCHED. Dùng [bộ giao việc](permission-main-prd-prep-2026-10-19.md) và [D mapping](permission-main-prd-integration-d-2026-10-19.md); chỉ kích hoạt sau human launch/worktree grant+root registry. Không coi prompt là quyền mở runtime/chat/callback.

Bạn là tác giả R; đọc authority trên D:/Workspace/pos-cafe-docs. Base567af2191400ef559e90b3eccae0a0e4992f82e5/tree5b8667b4c421a7e6c47f566e1634129799a5f83d. Worktree dự kiến D:/Workspace/pos-cafe-permission-r-20261019, branch ci/permission-perm60-20261019. Explicit workdir, kiểm HEAD/tree/status/path/collision; không tự tạo/switch hoặc ghi original đang dirty/ci11WIP/runner/docs/A/B/L/P. Baseline original hiện473 entries,510 là số lịch sử; không khôi phục thay đổi ngoài task.

## Ownership, contract và nguồn

Chỉ4file mới scripts/permission-full-perm-plan.mjs và .test.mjs; scripts/permission-full-perm-collect.mjs và .test.mjs. Safe artifact namespace artifacts/permission-full-perm-next/. Manifest tests/permissions/permissionAggregateCases.json SHA2566571509a877e3bee7f75efa6bc6488667952b6639a9abbf7fbb7d6f86c43156d bất biến; expected/original test/shared helper/config/workflow chỉ đọc. Xuất đề xuất delta cho D/root, không copy11WIP hoặc đổi expected để collectorPASS.

Nguồn567: [aggregate](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-aggregate-verify.mjs:85), [strict execution collector](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-execution-evidence.mjs:60), verifySuite trong permission-verify.mjs, runtimepolicy, preflightcore/fingerprint, actual configs/helpers và ba rollbackDBtests. Đọc như text; không import/call modules có filesystem, childprocess, environment/preflight hoặc testfixtures. Canonical28blob inventory và frozen docs xem [source-inputs](D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-prd-prep-review01/source-inputs.json); augment tracked dependencies bằng exact567, không dùng raw HP1/env/evidence cũ.

## Inventory bắt buộc và mapping

60case TC01…TC60 đều REQUIRED,726variant occurrences,27unique stages. Occurrence là mapping trongcase, không726unique actual tests. Phải giữ sourceHints, variant profile/file/name/project/runner và reuse giữa cases; không dedupe occurrences làm rơi coverage hoặc nhân bản actual run để nhận27stage. Exactly one execution mỗi required stage/profile; no missing/extra/duplicate run hoặc declared gap/PENDING_T16 trong full.

| Runtime profile | Required stage set |
|---|---|
| STATIC,4 | candidate-unit; foundation-unit; legacy-t01-tools; candidate-seed-tools |
| PG16_T01,1 | legacy-t01-database |
| SUPABASE_T02,3 | bridge-bridge-database; candidate-bridge-database; foundation-database |
| SUPABASE_T04,19 | identity-database; candidate-images-service; administration-database; read-database; clear-demo-database; candidate-signals-database; financial-database; candidate-print-database; candidate-bulk-concurrency-database; candidate-e2e; candidate-seed-recovery-database; candidate-roles-e2e; realtime-e2e; rollback-additive-database; rollback-preflight-database; rollback-recovery-database; transition-database; transition-e2e; transition-compatibility-database |

Các profile trên là runtime taxonomy; PERM manifest/attestation vẫn profile legacy/bridge/candidate/transition. Stage-map của R phải giữ hai field riêng và pin config/helper/selection/runner identity cho từng stage; D review mapping rồi gọi existing verifiers bằng profile gốc. Thứ tự19T04 theo runtimepolicy, giữ cùng physical backend kể cả rollback/transition; reset logic chỉ đúng reviewed boundary. Aggregate hiện có so candidate bindings chưa đủ chứng minh physical19stage. R model reject mixed declared durable backend/storage identity/overlapping service intervals; D/E sẽ tự đo thực, không gọi supplied tuple là observed. T01PG16 observer-only không chứng minh API/Auth/Storage/Realtime; T02/T04 đúngPG17 và service topology.

TC53 bắt buộc đúng ba mappings trong manifest: rollback-additive-database/permissionRollbackAdditive.contract.test.ts (B revert giữ business+phase27grants); rollback-preflight-database/permissionRollbackPreflight.contract.test.ts (wrongbinding chặn trước businessread, valid read-only); rollback-recovery-database/permissionRollbackRecovery.contract.test.ts (postbackupQ chặn restore, forwardfix giữQ/K/R1). Model giữ hashes/scope/phase/time evidence; fixture logical snapshot không tự thành physical restore/PITR hoặc DELIVERY-03/live cleanup PASS.

## Pure APIs và receipt

Proposed APIs planPerm60(manifestJson,sourceInventoryJson), checkPermStage(stageMapJson,evidenceJson), checkPermAggregate(manifestJson,stageResultsJson), perm60Bounds(stageMapJson,outputCatalogJson). Mỗi input primitive JSON≤262144B, exactschema/duplicatekeys/type/hash/enum/path/safeinteger trước native lookup/interpolation/Set; object/proxy/getter bị từ chối trước access. Error enum PERM_PLAN_/PERM_EVIDENCE_ fixed safe codes khai rõ tại interface receipt; không đổi AppErrorCode hay actual schemas.

Check strict discovery/results/options/attestation/source/manifest/config/lock/recipe/profile/stage/run/time, raw byte+content hashes; exact fullName/file/project, no retries/repeats/fails/requiredskip/todo/focus; service backend/API/fixture/catalog/schema/applied artifact pins. Không nhận selected test PASS trong file khi full-file discovery/options/result còn unexpected/skipped/extra/duplicate. Wrong-source/mixedprofile/latehash/source drift/false service observer hoặc options thiếu là STOP/finite refusal. Schema actual giữ nguyên; pure result valid:false/modelDecision MATCH hoặcSTOP, modeSIMULATION/PLAN_ONLY và execution/runtimeAdmission/fullGate/custody NOT_RUN/authNOT_PROVEN. Không tạo actual reportvalidtrue từ synthetic.

Artifact stage-map.json/coverage.json/bounds-to-b.json có source567/hash/version,27stage contract,60×726mapping accounting và nguồn file:dòng của mỗi hook/reset/preservation. Bounds gồm4static+T01/T02/T04, output/member count/bytes/discovery/results/options/attestation/observer/DBdata+WAL/reset/StorageGET/preservation/stdout/browserprofiles/traces/temp, runtime duration và overlap/retention/failure. Unknownmax/null+reason+owner; sốvariant/count không là boundbytes, timeout không là total bound, fixturebytes không là runtime. D sẽ map schema này vào B03, không sửa B trong task R.

## Checks, evidence và bàn giao

Chỉ Node builtin đã có sau auditimports/effects: node --check4own modules; node --test --test-concurrency=1 hai own tests. Không npm/npx/Vitest/Playwright list/build/network/image/WSL/Docker/DB/browser/service/GPG/key/ACL/cleanup. Fixture RAM≤256KiB/input và4MiB total live; generated≤4MiB/slice, đo C/D trước/cuối. Missing tool/dependency không fetch; STOP có nguồn.

Meaningful positives/negatives: canonical60/726/27 mapping, occurrence reuse không doublecountactual; drop/duplicate/swapcase/stage/name/project/config; source/byte/content drift; native-coercion hostilevalues; required skip/retry/expected-fail; threeTC53 mất1; T04 transition/rollback đổi physicalidentity dù candidate bindings giữ; overlap intervals; logicalreset sai boundary; false observer/API và samecount/differentbytes preservation. Đối chứng phải phát hiện dựa vào requirement, không chỉ đếm field cố định. Không tạo hàng trăm fakePASS run receipts gắn actual schema.

READY_FOR_REVIEW gồm envelope permission-main-prep-prd-v1/taskId R theo bộ chung (P0v1 chỉ A/B/L, giữ nguyên),4recoverable sources+patch/payload/snapshots/inventory, interfaces/stage-map/coverage/bounds/missingInputs, commands/exit/counts/receipts/hash/issues/notRun. Root lấy hai nonauthor EVC/SEC APPROVE exactcandidate+readback rồi mới DONE_IN_SCOPE_INITIAL_PURE; không nhận unit model là PERM60 runtimePASS.

Kế thừa GPG2STOP/Windowsdelete2blocked/HP1RETIRED/global20GiB/reserve30GiB/one-heavy và toànissuehistory bộ chung. Sameissue tốiđa2failedfixchecks toàntask, không reset; đủ2STOP/diagnosis/hướng khác. Không gửi raw private/chat cũ hoặc tự quyết material scope/data/privacy/ACL/cost/acceptance; phầnphụthuộc đợi userthật. Callback về coordinator01a151f6-cec4-78e2-ae17-25f3f8069213/hostlocal chỉ sau human grant choR và tự xác minh; thiếu=UNSENT/root boundedwait, không heartbeat. Actual collectors/provision/custody/ACK/cleanup/CI/merge chưa chạy.
