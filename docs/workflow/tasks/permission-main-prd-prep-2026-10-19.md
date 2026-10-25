# Bộ giao việc P/R và kế hoạch tích hợp D — 19/10/2026

Trạng thái nội dung: candidate chuẩn bị, chờ hai review tại [biên bản](permission-main-prd-review-2026-10-19.md). Đây là bước tiếp của [A/B/L initial pure đã hoàn tất](permission-main-abl-initial-review-2026-10-19.md), không phải full gate phân quyền đã đạt.

## Đề bài, quyền và đích đóng

User giao trực tiếp: “tiếp tục chuẩn bị bộ giao việc P/R và kế hoạch tích hợp D”, “vẫn chỉ phân tích/pure code”, “chưa chạy runtime nặng hay thử lại GPG”, “Review xong báo tôi các điểm cần chốt”. Mục tiêu là đóng phần phân quyền để chuyển sang phần khác. Nguồn đã tự đọc: chat01a151f6-cec4-78e2-ae17-25f3f8069213/hostlocal, turn01a1524a-c91a-7af0-bde1-4527c1a59d6b, human item01a1524a-c942-7602-95b1-8f7cbdb07a8b ngày19/10/2026.

Đợt hiện tại chỉ khảo sát, viết bộ giao việc/thiết kế và review. Không tạo chat tác giả/worktree P/R/D, không dispatch, không viết code ứng dụng hoặc chạy collector thật. Pure code trong các prompt là phạm vi đề xuất cho bước thực hiện sau, chưa được kích hoạt bằng tài liệu này. Hai reviewer không tác giả được giao theo cổng review hiện hành. Không đổi requirement hoặc tiêu chí để đóng sớm; task này bổ sung kế hoạch của change phân quyền hiện có, không mở change nghiệp vụ mới hay tạo lại bộ bảy artifact.

Đóng kỹ thuật cho đường merge hiện hành cần: P/R collectors và coverage được review → D tích hợp cùng nguồn → budget/transport/admission thật đủ điều kiện → E full PIN19/PERM60/ba TC53 và preservation/custody/retention → CI còn hiệu lực và hai final integration reviews → merge trong quyền hiện hành. Nghiệm thu owner và phát hành được ghi riêng. Production/live DB/Edge/cutover, HP1 producer/API/CLI/harness/capture/replay và các gate release ngoài đường merge vẫn tách theo [kế hoạch gốc](permission-main-session-plan-2026-10-19.md); không gọi chúng đã hoàn tất hoặc bỏ chúng để đóng feature.

## Nguồn đã khóa để chuẩn bị

Code: D:/Workspace/pos-cafe-full-runner-20261018, branch ci/permission-full-runner-20261018, commit567af2191400ef559e90b3eccae0a0e4992f82e5, tree5b8667b4c421a7e6c47f566e1634129799a5f83d, sạch khi baseline. Docs worktree D:/Workspace/pos-cafe-docs, branchdocs, HEAD2ad68003ca3de719c5dc4746a706dc600028dc2b, dirty sẵn. Dùng bytes làm việc của spec/authority đã snapshot; không giả chúng đều nằm trong refdocs. Baseline lượt này: original473 status entries, docs347, ci11; số original510/docs395 trong các bàn giao trước là lịch sử. Không khôi phục hoặc sửa thay đổi đồng thời của task khác.

[Source inventory](D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-prd-prep-review01/source-inputs.json) chứa28 canonical Git blobs (LF),10 snapshot docs thực và7 hash pin A/B/L đã đối chiếu. Canonical source567 giữ manifest PERM SHA2566571509a877e3bee7f75efa6bc6488667952b6639a9abbf7fbb7d6f86c43156d:60 TC,726 variant occurrences,27 stages, ba DB variants TC53. Đây là inventory bắt buộc, không số ca đã chạy trên code mới.

Đầu vào đã review: A01 manifest2686c9384422bba462c60482ad48fa6b91622c1710c30b5b087cd6207f1fdb0a; B03 manifest2216e89b5997629e6464da8b44d027f5deeb7a353740ab1cdfe16a0ccb377250; L02 manifest37c1ce63a05855a3029067eafd11ac4a2ab43467e20bc0de088fe98a07f5df27. [Receipt tổng hợp A/B/L](D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-abl-review01/review-results.json) SHA25665796cc465bd09fc457d6995d03c046479f420409d0e51b036fae05d570cebae. Review model không chứng minh runtime/authentication/allocated maxima. A/L bounds còn UNKNOWN; B vẫn STOP. Không sửa các candidate này.

## Bộ giao việc và ownership đề xuất

| Task | File được ghi sau kích hoạt | Worktree/branch dự kiến, chưa tạo | Đầu ra kiểm được |
|---|---|---|---|
| P | tests/permissions/full-pin19-cases.json; scripts/permission-full-pin-plan.mjs, .test.mjs; permission-full-pin-collect.mjs, .test.mjs | D:/Workspace/pos-cafe-permission-p-20261019 / ci/permission-pin19-20261019, base567 | [Prompt P](permission-main-prd-prompt-p-2026-10-19.md):19 case và expanded identities, pure collector/oracles, bounds UNKNOWN có nguồn |
| R | scripts/permission-full-perm-plan.mjs, .test.mjs; permission-full-perm-collect.mjs, .test.mjs | D:/Workspace/pos-cafe-permission-r-20261019 / ci/permission-perm60-20261019, base567 | [Prompt R](permission-main-prd-prompt-r-2026-10-19.md):27 stage/60 TC/726 occurrences, ba TC53, same-backend contract và bounds |
| D0 | Chỉ kế hoạch hiện tại. Nếu được giao pure implementation: scripts/permission-full-integration-plan.mjs và .test.mjs mới | D:/Workspace/pos-cafe-permission-integration-20261019 / ci/permission-full-integration-20261019, base567 | [Kế hoạch D](permission-main-prd-integration-d-2026-10-19.md): mapping thuần từ reviewed input, chưa áp dụng shared deltas |

R JSON stage-map/bounds là safe artifact trong artifacts/permission-full-perm-next; P dùng artifacts/permission-full-pin-next. Không mở rộng ownership bằng prefix chung. Mọi shared helper, workflow/config, expected manifest, original test, A/B/L và11WIP chỉ đọc; đề xuất delta về D/root. Tối đa3 tác giả hoạt động; P/R độc lập, D0 có thể mapping các input đã có và missing-input matrix, không chờ giả transport. D1 tích hợp chỉ sau P/R exact candidates được review.

Trước launch thực sự: kiểm path/branch chưa tồn tại hoặc không có collision, runner567 sạch, Windows C/D reserve, setup/hooks/.worktreeinclude không tự cài/copy dependency; dùng explicit workdir/path để không ghi vào checkout gốc đang dirty hoặc ci11WIP. Hai checkout P/R source tracked38,119,461B/918files: estimate bảo thủ2×(2×sourceBytes+8192×918+32MiB)=234,627,220B; D0 thêm117,313,610B, tổng351,940,830B trước output/control. Đợt pure đề xuất thêm4MiB/task, control≤16MiB, tổng dưới0.5GiB; phải đo lại trước tạo. Đây là operating bound, chưa quotaOS, không phải runtime admission. Không cài gói hay tạo môi trường nặng. Nếu vị trí/setup/max không xác minh được thì phần tạo STOP, tiếp tục đọc source.

## Contract preparation, không sửa execution schema

Envelope mới cho đợt này là permission-main-prep-prd-v1, taskId enum P/R/D0. Không gán P/R vào permission-main-prep-v1: bản P0 đó chỉ cho A/B/L và được giữ nguyên. Đây là envelope chuẩn bị riêng, không đổi execution, custody hoặc manifest PERM.

| Nhóm trường | Ràng buộc của PRD v1 |
|---|---|
| contractVersion, taskId, status | Đúng permission-main-prep-prd-v1; P/R/D0; tác giả chỉ READY_FOR_REVIEW/NEEDS_USER/FAILED/PARTIAL, không tự DONE |
| baseCommit, baseTree; candidate; sourceInventory | Giữ nguyên kiểu/ràng buộc của [P0](permission-main-p0-2026-10-19.md#contract-p0-v1-lớp-chuẩn-bị-không-đổi-schema-thực-thi): exact567/tree5b866; recoverable commit hoặc patch+payload+inventory gồm new/ignored files; canonical Git bytes hoặc snapshot representation rõ |
| evidenceMode, execution, runtimeAdmission, custodyObserved, runtimeBinding | PLAN_ONLY/SIMULATION; ba execution fields đúng NOT_RUN; binding runId/attempt/profile/stage/nonce/backendIdentity chưa có là null. Synthetic IDs chỉ trong fixture SIMULATION riêng |
| observations, checks, issues, pendingDecisions, dependencies, notRun, safeReceipts | Giữ đúng semantics P0: fact có source/date; command/cwd/runtime/exit/count/hash; sổ lỗi toàn task; thiếu dependency=UNKNOWN+owner; safe relative receipt paths/bytes/SHA256. Dùng notRun, không tạo alias remainingNOT_RUN |
| inputBindings | Mảng owner A/B/L/P/R/D, version, path và sha256; thiếu dùng version UNKNOWN/path null/hash null+missingInputs. Path nguồn là tham chiếu đọc đã đăng ký, không capability filesystem của model. Owner D0 của task map thành owner D trong B, không chèn D0 vào B enum |
| files, interfaces, missingInputs, bounds | Repo-relative own file descriptors gắn payload/hash; interface schema/error/API receipt được version; từng missing input ghi owner/field/reason/nextAction; bounds theo bảng dưới. Exact nested schemas phải công bố trước implementation và review cùng candidate |

Runtime runId/attempt/nonce/backendIdentity chưa chạy không được bịa rồi feed verifier. Byte/count/time dùng safe integer không âm, bytes/seconds; thiếu upper bound=null+UNKNOWN, không0. SHA25664hex lowercase, Git SHA/tree40hex lowercase. P/R/D0 phải kiểm unknown/extra keys theo schema đã công bố; không suy tính tương thích chỉ từ tên version.

API mới nhận primitive JSON UTF-8 text≤262144B mỗi argument; không nhận object/getter/proxy/function để khỏi chạy code caller. Từ chối duplicate keys, extra/missing fields, sai type/enum/hash/path, duplicates/alias/traversal và overflow bằng mã lỗi hữu hạn an toàn; không echo input/raw secret. Cap này áp dụng fixture/model đầu, không được cắt manifest/output runtime để vừa cap. Nếu dữ liệu thật lớn hơn, đề xuất adapter streaming/chunking giữ closure cho D review trước thực thi.

Kết quả model có modelDecision MATCH/STOP, evidenceMode PLAN_ONLY/SIMULATION, execution/fullGate/runtimeAdmission/custodyObserved NOT_RUN, valid:false, authentication NOT_PROVEN và effects0. MATCH không là actual PASS. P/R không tạo report valid:true kiểu permission-execution-report-v1 từ synthetic facts hoặc nhập synthetic receipt vào verifier thực. Proposed input schema/error enums phải ghi trong interface receipt và review; không thay AppErrorCode hay custody17fields. P/R chỉ dẫn compatibility adapter của D, không tự port shared code.

Bounds xuất theo owner P/R, version, source commit+manifest/config/helper hashes; từng writer/member có profile/stage, kind, maximumBytes hoặc null, state BOUNDED/UNKNOWN, boundSource hoặc null, lifetime/overlap/placement/time và unknownReason. Giá trị0 chỉ khi có chứng cứ không có writer; file nhỏ/test timeout/cipher cap không chứng minh maximum thực. B03 dùng schema khác: D mapping rõ từng field và WRITER_CATALOG, không Object.assign envelope vào B. Không yêu cầu P/R làm ADMITTED để READY phần pure.

## Kiểm chứng và tiêu chí nhận đợt thực hiện sau

P/R tự rà import effects rồi chỉ Node builtin đã có: node --check từng own module; node --test --test-concurrency=1 đúng hai own tests. Không import/call runtime/bootstrap/config/TC18 wrapper, verifier có filesystem/child process hoặc broad suites để discovery. Chỉ đọc text/JSON Git và metadata được chỉ định; không npm/npx/Vitest/Playwright list/build/network/DB. Fixture RAM mỗi input≤256KiB, tổng sống≤4MiB; output/receipts≤4MiB/task, không xóa temp để né cap. Chưa có dependency thì báo STOP có căn cứ.

READY_FOR_REVIEW đòi source + recoverable patch/payload/snapshot/inventory gồm new/ignored files; contract/API/error enums; identity/coverage matrix; full check commands/counts/exit/hash; bounds/missing input; sổ lỗi và NOT_RUN. Test phải phủ main/exception/boundary/security, thêm phản ví dụ độc lập có ý nghĩa, không chỉ mirror implementation. Root lấy đủ EVC+SEC APPROVE exact candidate rồi recheck mới nhận DONE_IN_SCOPE_INITIAL_PURE. Pure tests không thay full PIN19/PERM60/TC53/CI tích hợp.

## Sổ lỗi và ranh giới kế thừa

GPG2actualFAIL/STOP/additional0; Windows fixture delete2auto-reviewBLOCK/6remain/0deleted/không lần3; namespace1FAIL1PASS chỉ namespace; registry1unverified/0verified. B-SEC-01 CLOSED B03 sau check/fix2, L-SEC-01 CLOSED L02 cycle1; giữ lịch sử và không mở lại quỹ2lượt. B-TOOL-READ-THREAD-LIMIT3schema rejects/capBreachtrue/noFurtherRetry đã ghi, không chuyển thành codeFAIL hoặc reset khi đổi chat. Mọi issue mới giữ tối đa2failed fix/check toàn task; đủ2 thì STOP nhánh, chẩn đoán/hướng khác; material change đợi user thật. Timeout/callback agent không approval.

Root đợt chuẩn bị có hai read-only search requests sai đường dẫn/glob Windows (một giả tên file, một đọc spec bằng cwd code).0mutation. Đã dừng nhánh đoán path sau request2, xác định spec chỉ ở docs và dùng inventory đường dẫn đã có; không tiếp tục cùng search/retry hoặc reset count. Không có code/runtime test FAIL trong đợt này.

Giữ20GiB tổng task,30GiB reserve C và ổ runtime thật, một heavy environment; không WSL/Docker Desktop mới, không raw HP1/env/private report, không key/ACL/passphrase/export, không cleanup/commit/import/push/deploy/merge. Mọi dữ liệu hiện tạo là source/recipe/evidence cần giữ; không có temp hết nhu cầu được nhận diện để đề nghị xóa.

## Các điểm cần chốt sau review

| ID | Quyết định và khuyến nghị | Chặn phần nào; phần tiếp tục được |
|---|---|---|
| Q-PRD-LAUNCH | Sau khi bộ này APPROVE, giao thực hiện P/R pure trong hai path trên; D0 pure mapping trong path thứba là tùy chọn khuyến nghị cùng đợt. Cần user giao rõ mở chat/worktree và nếu muốn, safe callback P/R/D về chính chat này. Không suy grant A/B/L áp dụng worker mới. Root-only wait_threads là phương án không callback. | Chỉ chặn việc tạo/khởi chạy tác giả mới. Bộ chuẩn bị/review này đã được giao; không hỏi lại quyền hiện tại. |
| Q-TRANSPORT-DESIGN | GPG giữ STOP. Khuyến nghị bước thuần kế tiếp là làm concrete design cho adapter mã hóa recipient không phụ thuộc GPG agent, đối chiếu với phương án operator offline; chưa chọn tool, key/trust hoặc cài/chạy. ALT2 so ALT3 có trong A; ALT1 là thử GPG thứba và bị loại khỏi phạm vi user mới giao. | Không chặn P/R/D0 contracts. Thiết kế concrete/size/auth/privacy phải review trước câu hỏi actual; không đưa lựa chọn thực thi còn mơ hồ cho user. |
| Q-RUNTIME-EXECUTION — chưa hỏi ngay | Host/workflow/tools/maxima/retained placement/enforcement/time và strategy thực chưa đủ. Root/D phải thu thập được bằng metadata/source hoặc lập phép đo có trần cụ thể; trình action/chi phí/lưu trữ/điều kiện STOP rõ để user chốt actual sau. | Chặn E/heavy/custody thực, không chặn prep/pure. Không yêu cầu user đoán bytes hoặc giảm coverage. |

Không cần user quyết định lại PIN19/PERM60/baTC53,19stageT04 cùng backend, privacyC/cipherD, reserve/quota/HP1 hay reuse lock: đây là bất biến giữ nguyên. Không hứa ngày đóng khi runtime fit/transport chưa đủ căn cứ. Đường ngắn nhất là đóng các input kỹ thuật song song và chỉ hỏi quyết định có tác động thật.

## Registry và bàn giao

P/R/D0 hiện PREPARED_NOT_DISPATCHED; threadId/host/cursor=null, actual worktree chưa tạo. Root đọc completion bằng bounded wait_threads/afterCursor sau launch; không heartbeat/service hoặc gửi chat cũ. Prompt không tự cho phép send_message_to_thread; worker cần human routing grant trực tiếp, thiếu thì UNSENT và root lấy qua wait. Không hỏi lại human grant đã còn hiệu lực; read_thread≤10turns, lỗi schema thì dùng metadata đúng thay vì lặp requests.

Walkthrough chuẩn bị: nguồn/scope → P manifest/TC18/TC19 → R27stage/TC53 → D mapping/closure → missing bounds/transport → điều kiện E và final reviews. Owner chưa xác nhận đọc, hiểu hay nghiệm thu. Source/fullgate/main vẫn IN_PROGRESS; kết quả review của bộ chuẩn bị được lưu riêng, không cấp quyền launch hay actual.
