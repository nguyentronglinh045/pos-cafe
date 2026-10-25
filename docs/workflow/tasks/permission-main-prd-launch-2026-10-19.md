# Khởi chạy P/R/D0 pure và thiết kế transport — 19/10/2026

Live registry tiếp nối [bộ giao việc đã review](permission-main-prd-prep-2026-10-19.md) và [biên bản APPROVE03](permission-main-prd-review-2026-10-19.md). Các trạng thái PREPARED_NOT_DISPATCHED trong snapshot03 phản ánh trước grant mới, không phải trạng thái hiện hành. Không sửa snapshot, contract hay acceptance đã review.

## DEC-PRD-LAUNCH-01 / DEC-TRANSPORT-DESIGN-01

User trực tiếp chọn hai câu hỏi của request_user_input_async/call_f1a01afd0f04461b91af78efc178e091/items0,1:

- “Mở P/R + D0 pure, có callback an toàn (Khuyến nghị)”. Cho mở đúng ba chat/worktree D từ567 theo bộ đã review, kiểm dung lượng/setup trước tạo, chỉ analysis/pure; worker được gửi kết quả/câu hỏi an toàn về chính coordinator này.
- “Thiết kế adapter khác GPG, đối chiếu operator offline (Khuyến nghị)”. Chỉ concrete design để review; không cài tool, key/ACL/passphrase/export hoặc mã hóa/giải mã thật. GPG2FAIL/STOP/additional0 được giữ.

Nguồn human đã root tự read_thread: coordinator01a151f6-cec4-78e2-ae17-25f3f8069213/hostlocal, turn01a1526f-af2d-78b3-8d08-fc9f243807bc, item01a1526f-af57-7613-a053-152b850d8087, ngày19/10/2026. Worker tự xác minh direct human source trước callback; report root/agent không tạo quyền mới. Không gửi chat cũ. Callback một báo cáo meaningful mỗi READY_FOR_REVIEW/NEEDS_USER/FAILED/PARTIAL, không heartbeat/service hoặc progress spam; root dùng bounded wait_threads/afterCursor khi cần. Read_thread tối đa10turns; không lặp lỗi schema để kiểm lại grant đã đủ.

Không mở D1/D2/E, shared integration, install/download, network runtime, DB/browser, actual transport/ACK/cleanup, commit/import/push/deploy/merge. Tối đa ba author active; root làm design và điều phối, hai nonauthor reviewers theo cổng trước DONE. HP1 RETIRED, Windows fixture delete2blocks/6remain, max2failedchecks cùngissue toàn task,20GiB/reserve30GiB/one-heavy và mọi lịch sử B/L giữ nguyên.

## Preflight thực và worktree

[Receipt preflight](D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-prd-launch01/before.json) và recipe preflight.mjs cùng thư mục pin packet03SHA25676d76e5bac37b9ba71b075304f82989cf9c53c5da6a04864029e8c6bb03f42b7, bốn live/snapshot payloads. Runner567/tree5b866 sạch;28canonical source đã pin trong packet. Không core.hooksPath override/post-checkout hook, không attribute/filter trên tracked index, không .codex/.worktreeinclude/.gitattributes/.gitmodules tại original/runner. D:/Workspace và các nguồn không symlink/reparse. Không tự copy ignored/env/deps hay chạy setup.

Đã kiểm cả Windows C/D trước mỗi checkout; baseline C195720941568B/D98995707904B free. Estimate ba checkout351940830B + pureoutputs12582912B + control16777216B =381300958B, dưới0.5GiB. Đây là operating estimate, không quotaOS hoặc global runtime fit. Node D:/tools/nodejs/node.exe v24.16.0 đã có, installs0. Chỉ tạo Git worktree bằng exact branch/path/base567, không clone/network.

Mỗi worktree mới readback919files, HEAD567af2191400ef559e90b3eccae0a0e4992f82e5/tree5b8667b4c421a7e6c47f566e1634129799a5f83d, clean và không node_modules. P/R38228902B mỗi bản, D038228912B (khác10bytes .git pointer); tổng114686716logicalB, allocationUNKNOWN. Sau ba checkout C195719720960B/D98872152064B free. Original/ci/runner/A/B/L HEAD/tree/status/index đúng baseline preflight, không nhận510/395 lịch sử làm số hiện tại. Metadata discovery age/rage/openssl không thấy trênPATH, Get-Command kết thúc exit1 do no-match; không chạy binary hoặc gọi đó là crypto/runtimeFAIL, không kết luận toàn máy chưa cài và không retry discovery đó.

## Registry kích hoạt

| Task | State | Actual worktree / branch | Thread/host/cursor |
|---|---|---|---|
| P | ACTIVE_INITIAL_PURE | D:/Workspace/pos-cafe-permission-p-20261019 / ci/permission-pin19-20261019 | 01a15272-aaac-7003-b025-4b1e5f97f562/local/cursor chưa lấy |
| R | ACTIVE_INITIAL_PURE | D:/Workspace/pos-cafe-permission-r-20261019 / ci/permission-perm60-20261019 | 01a15272-adff-7d90-a935-580166c2eb45/local/cursor chưa lấy |
| D0 | ACTIVE_INITIAL_PURE | D:/Workspace/pos-cafe-permission-integration-20261019 / ci/permission-full-integration-20261019 | 01a15272-b188-76b1-bde5-a5a01bc1dff3/local/cursor chưa lấy |

Root điền threadId/host/cursor từ tool thật và gửi activation sau registryACTIVE. Chat mở projectlocal sau khi worktree GitD đã tạo; UI mặc định có thể vẫn cwdoriginal, nên mọi shell/Git phải truyền explicit ownworkdir, mọi edit dùng absolute path dưới ownroot. Không dùng editor/defaultcwd vào original. Initial prompt chỉ cho đọc authority/packet/registry/human source, không ghi trước activation; mismatch/collision thì STOP phần ghi.

## P và R

Dùng nguyên [prompt P](permission-main-prd-prompt-p-2026-10-19.md) và [prompt R](permission-main-prd-prompt-r-2026-10-19.md), envelope permission-main-prep-prd-v1/taskIdP/R. Ownership đúng5fileP/4fileR và artifactnamespace/cap4MiB mỗi slice. No install/network/Vitest/Playwright list/broad suites/DB/GPG/cleanup. Nodebuiltinpure checks sau auditimports/effects; không nhận synthetic receipt thành actual valid:true. Root tự lấy exact candidate rồi EVC+SEC review và readback mới DONE_IN_SCOPE_INITIAL_PURE.

## Activation prompt D0

Bạn là tác giả D0 của pos-cafe. Đọc authority AGENTS/CLAUDE/workflow/SPEC trên D:/Workspace/pos-cafe-docs, [bộ PRD](permission-main-prd-prep-2026-10-19.md) và [kế hoạch D đã review](permission-main-prd-integration-d-2026-10-19.md), packet03 exacthash ở trên và user grant live này. Dùng explicit ownworkdir D:/Workspace/pos-cafe-permission-integration-20261019, branch ci/permission-full-integration-20261019, base567/tree5b866; tự kiểm Git/path/status/collision/registry trước ghi. Không sửa originaldirty/ci11WIP/sharedrunner/docs/A/B/L/P/R.

Chỉ hai file mới scripts/permission-full-integration-plan.mjs và .test.mjs, safe outputs artifacts/permission-full-integration-next/; ownership không mở sang shared helper/config/workflow/controller thực hoặc D1. Proposed pure APIs integrationPlan(inputJson), mapBudgetInputs(inputJson), custodyLifecyclePlan(inputJson). Nhận primitiveJSON≤256KiB, duplicatekeys/exactkeys/type/enum/path/hash/safeinteger trước lookup/interpolation/nativeops; reject callerobjects/proxies/getters trước access, finiteINTEGRATION_*codes ghi trong interfacereceipt. Không import/call app/config/runtime/collector hoặc module ngoài ownworktree; nhận safe metadata/contracts bằng JSON, không run frozen A/B/L code.

Đối chiếu reviewed A01/B03/L02 từ metadata đã pin, không tự sửa hoặc wiring các source đó. Map A/L/P/R/D bounds/version/hash/profile/writer/lifetime/physicalplacement thành134Bcatalogrows đúngowner, preserveUNKNOWN/null/STOP. P/R đang làm độc lập nên input thiếu phải missingInputs(owner/field/reason/nextaction), không chờ giả để viết model và không giả dependencyBOUNDED. D0taskId map thành BownerD, không chèn D0 vào Benum. Phân biệt workflowdecimalrunId với stageExecutionUUID; PERMtaxonomy với runtimeprofiles, mỗi requiredstage/profile tuple có đúng một runtimeProfile, nhiều stage cùng runtime. Giữ19T04 cảrollback/transition cùng declaredphysicalbackend, suppliedtuple không gọi actualobserved.

Lifecycle là plan: sourcefreeze/admission/profile/close/seal/receivecipherD/verifiedopenprivateC/memberclosure/authenticatedlatestownerACK/retention/cleanupeligible; không thêm bớt17custodyfields và không fake actualACK. Mọi output modelDecisionMATCH/STOP, envelope permission-main-prep-prd-v1/taskIdD0, evidenceModePLAN_ONLY/SIMULATION, validfalse/authNOTPROVEN/execution-runtimeAdmission-fullGate-custodyObservedNOT_RUN/effects0; intentionalCleanupAllowed luônfalse trongD0. No network/command adapter, no GPG/key/ACL/privatefile read. Concrete transport design do root làm riêng, chưa dependency của pure model này.

Giữ20GiB/reserve30GiBC+physicalruntime/loop18+outside2 chưatechnicalquota,3CPU/10GiBRAM/swap0/PIDs2048/time1800s, backingđếm1lần, retainedglobal/writeroutside/time/failure paths không bỏ. NamespacePASS khôngadmission; missingmax/writer/retained/placement/time STOP. PIN_IDENTITYprivateabsent/canary16CLImigrations+emptyseed/T01PG16observer/T02T04PG17 và topologies/aliases/deviceinode/norbind phải được mô hình/traceability giữ theo contracts, không provision thật.

Chỉ node --check own2files và node --test --test-concurrency=1 owntest sau ràimports/effects; RAMfixture≤256KiB/input/tổngsống4MiB, generated/receipts≤4MiB. Negative meaningful: malformed/getter/proxy/duplicatekeys/source/version/hash/profile/runID/tuple; missingP/R; dropwriter/retained/max; wrongplacement/doublebacking/time; mixedbackend ở transition/rollback dùcandidatebindingsgiữ; synthetic/staleownerACK/incompletequery; cleanupfalse/forbidden adapter. Khôngmirror tests chỉ để tăngcount, không broadapp/runtime checks.

Báo READY_FOR_REVIEW (chưaDONE):2recoverable sources/patch/payload/snapshots/inventory, versionedinterfaces/errors/mapping/missingInputs/closureledger, allcheckscommands/cwd/runtime/counts/exit/hash, safe receipts, issues và NOT_RUN. Kế thừa max2sameissue xuyênsession, GPG2STOP/delete2STOP/HP1retired, không autochangeacceptance; materialunknown đợi user thật ở root, độc lậppure tiếp tục. Callback safe về coordinator01a151f6-cec4-78e2-ae17-25f3f8069213/hostlocal chỉ sau tựreadhuman turn/item ở trên; thiếuverification=UNSENT/rootwait. Root lấy hai nonauthorEVC/SEC APPROVE exactcandidate rồi readback; D0DONE không integration/fullgatePASS.

## Điều phối và phần chưa làm

Root trực tiếp làm design transport khácGPG so với operatoroffline, chỉ sources/metadata/recipe spec; không chọn tool/algorithm/key/trust thực bằng grant thiết kế. Source/API/docs kỹ thuật phải primary và current khi có thể đổi. Thiết kế phải giữ authentication/recipientidentity/memberclosure/privacyC-cipherD/custody17/latestownerACK/retention cùngmaximum/install/peak/time và failurepaths; thiết kế chưa có số chứng minh vẫnUNKNOWN/STOP. Review thiết kế cùng hai reviewer riêng trước bàn giao.

Không tự báo toàn task hoàn tất khi chỉ khởi chạy. Root tiếp tục theo dõi, review và nhận các initial pure slices; registry và receipts cập nhật meaningful, không thay decisions bằng callback. Câu hỏi material mới sẽ đưa user ở đây, không xin lại grant launch/pure/callback đang hiệu lực.
