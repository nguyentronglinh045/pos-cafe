# Triển khai giới hạn vòng kiểm thử — bàn giao ngày 21/10/2026

## Đã dừng19:48 — CI18 FAIL, chưa hoàn tất

Source `90e30f2b2b0f046c549b268b32f1840ad99c2409` giữ nguyên/trackedsạch. [CI25](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39600415703) terminalFAIL sau4phút42giây: bảyphase đầuPASS (Node823, originalreporter4 vàdiagnostic7/20 đúngsource), phase8EdgeFAIL7giây; phần còn lại chưa chạy. Backend khôngdispatch trên90. Preparer thực từchốiCI_NOT_PASS, khôngmanifest/dispatch hoặc tăngcounts.

[Điều tra failure và cách sửa tiếp](../../reviews/2026-10-21-permission-edge-cleanup-incident.md): archive có directories0555, probe nonroot gọi rmSync không chuẩn bị quyền nên cleanupEACCES; finally che primary vàmapper thành0. Đã xác minh defect chắc chắn đủ làmFAIL; nativeversion/bundle/closure/bad-SRI outcome chưa biết. Không nhận lockresolverPASS hoặc Edge rootRemoved; PG16NOT_PRESENT chỉ đúngPG16. Unit/job đãterminal/released, không có activejobs hoặc loop18GiB mới.

V3 đã **CLOSED**, spent publication2/2,CI2/2,heavy1/3,review6/6; haiheavy còn nhưng bịchặn bởiCI vàCLOSED. Dừng sớm đúngownergrant, không tựretry hoặc xin thêmlượt trongcloseout. Hạn23:00 không bịgia hạn. [Kế hoạch](permission-edge-resolution-remediation-2026-10-21.md) và state2300 lưu mọireceipt/hash/history. Lần tiếp tục phải sửa owned-directory cleanup, giữprimary/cleanup riêng, thêm fixtureLinuxnonroot0555 trướcdownload; chưa áp dụng/review bản sửa này. Khôngmerge/Supabasewrites, khônggiảmcoverage.

## Lịch sử checkpoint19:33 — source publication, CI lúc đó đang chạy

Code `90e30f2b2b0f046c549b268b32f1840ad99c2409` đã commit/push đúng18file qua admission; tracked source sạch, giữ nguyên15private recoveryhelpers. Candidate06 SHA256 `a0a8e556aca511b753a9919b55af11cdf61bc85107dd231b4154f8b150b772b2` được cả source/operations APPROVE; fulllocal823PASS0skip,21budgettests. [Review và hai blocker đã đóng](../../reviews/2026-10-21-permission-edge-resolution.md).

[CI25 run39600415703](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39600415703) **đang chạy, chưa PASS**. Source90, đủ17 gate cũ cộng Edge gate18; observer duy nhất `cloud-light25`, cutoff gốc20:04:27+07. Không dispatch CI lại nếu observer mất kết nối: kiểm actualAPI của chính runID này và collect bằng helper có sẵn. Publication2/2,CI2/2,heavy1/3,review6/6; không còn publication/CI/review, còn2heavy nhưng chỉ được dùng nếu CI18/nativecleanup/current-input proof đạt. Nếu lượt kiểm chứng mới FAIL thì dừng phần phụ thuộc theo ownergrant.

Chưa có backend mới trên90. T04/PIN chỉ tiến sau terminal CI/receipt, globalactivejobs0, priorreclaim và freshadmission. State máy: `permission-loop-prevention-2026-10-21-2300-state.json`. Windows retained269.243.473bytes; C193,69GB/D98,54GB free; khôngWSL/runtime mới. Deadline23:00SE Asia Standard Time=16:00UTC, giữreserve37/42phút. Khôngmerge/Supabasewrites hoặc giảmcoverage.

## Đang tiếp tục từ18:11 đến hạn23:00

**Cập nhật bổ sung18:59:** owner đồng ý thêm tối đa1publication/1CI/1heavy/2review. V3 successor `budget-edge-resolution-2300.json` giữspent1/1/1/4, tổng trần2/2/3/6 và deadline23:00; V2 đã đóng, không reset. [Kế hoạch và bản sửa Edge](permission-edge-resolution-remediation-2026-10-21.md): runtime-only lock20pins, native resolver preflight thêm gate18, input/public receipt/admission và guardgrant đã có local821NodePASS0skip; chưa actual native CI hoặc backend mới, sourceWIP trêned73. Hai scope review phải duyệt exact packet trước publication bổ sung. Các mục phía dưới giữ lịch sử lượt đầu.

Checkpoint sau review05: source tìm sai VERSION guard và timestamp không monotonic; operations APPROVE scope riêng. Hai blocker đã sửa, full Node mới `edge-full-node-04.tap`823/823PASS0skip; 21budgettests. Candidate05 không được publish. Candidate06 là final review trong allowance6; không có lượt publication/CI/backend mới đến thời điểm đóng snapshot. Sau closeV3, resume time-only cần ownerdeadline mới và guard/spec/review tương ứng; không tự tạo ledger/reset.

Owner message11:11:38.011UTC cho tiếp tục đến23:00thiếtbị; reply11:13:46.625UTC cấp thêm tối đa2review và nhấn mạnh kiểm kỹ trước CI/backend. Ledger mới budget-continuation-2300.json kế thừa CLOSED17:00, chỉ review allowance tăng2→4, không reset. Candidate03 bị source reviewer chặn sibling replay; đã sửa single-successor receipt và thêm counterexamples. Candidate04 hash6bba1b1f9044d79ecb94e4a6f6e926fbe2c48bbca667f7aa1ff96f7524b3243e được cả source/operations APPROVE. Full Node810PASS0skip; diagnostic code không đổi, actual7/20 và CI mới vẫn giữ đủ gate.

Code mới commit `ed73a415737aaf6d460e90f1756148a6be4d19dc`, đúng3file budget/test/guide trên315. Origin/88committedpins và freshpublishadmission đã đạt; publication qua helper thành công18:27. [CI17 run39592119259](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39592119259) **PASS đủ17phase**; original4controls và diagnostic7/20 source/lockbound còn trong finalpublicSummary; Node810PASS0skip, unit1175PASS. Tooling567PASS/1manualDeferred và smoke44PASS/37applicabilityskip giữ đúngbaseline, không giảm coverage. Native cleanup uniqueNOT_PRESENT/rootRemoved/processReleased đã bindcùngrun/source; peak1.281.101.824bytes<5GiB, sourcePreservedtrue.

PIN_ONBOARD dispatch qua helper18:41; [run39593847459](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39593847459) terminal **FAIL ở setup `edge-network-warm`**, trước mọi stage nghiệp vụ. `EDGE_CACHE_PROOF / EDGE_CACHE_PIN`, package ordinal9, version1.6.8: manifest chỉ pin `@types/phoenix@1.6.7`. Completed chỉ loop/source-tools/npm-images; observation NOT_OBSERVED, không có evidence nghiệp vụ. Cleanup thành công, measured reclaim **19.327.365.120 bytes**. Không còn job này đang chạy.

**HOLD T04:** cùng image Edge v1.74.3, hai entrypoint và cache validator nên cũng gặp blocker này. Chuỗi dependency là SDK2.45.0 → realtime-js2.10.2 → @types/phoenix^1.5.4; warm đang resolve online rồi mới so exact allowlist. Allowlist không khóa resolver. CI17 kiểm npm lock SDK2.108.1 và fixture cache giả, vì vậy PASS CI không chứng minh graph Edge2.45.0 còn tái hiện được. Hai investigator độc lập xác nhận; source investigator tái hiện cùng EDGE_CACHE_PIN ở cả hai validator thật bằng adapter cache trong bộ nhớ, không Docker/DB.

Counts publication1/1, CI1/1, heavy1/2, review4/4. Giữ lượt heavy cuối; chưa dispatch lại hoặc thêm pin để vượt guard. Đang xác minh cơ chế khóa graph mà đúng runtime hỗ trợ và phép kiểm Edge gọn trước môi trường18GiB. Mọi bản sửa nguồn mới phải có review và CI đúng nguồn; muốn publish/CI/review thêm cần owner cấp ngân sách rõ ràng, giữ spent và hạn23:00. Không merge/Supabase writes, không giảm coverage.

[Review continuation và xử lý blocker](../../reviews/2026-10-21-permission-loop-prevention-continuation-2300.md). Packet/reviews/publishmanifest/dispatchreceipt trong evidence/loop-prevention-20261021/candidate04; policy2300 hashff981880a4b4d350c0748b4759d1b9e888738fe6c9532a61112039aae4afbce6, successorclaims giữ cùng ledger bundle. Trướcbackend phải chờ finalCIreceipt/nativecleanup rồi freshadmission từngprofile.

Không có run đang chạy;88pins checkpoint/remote31693d7 và khôngWSL đã được xác minh lúc18:13. Trướcbackend cần CI17 đúngsource, reporter4gốc+7diagnostic/20mutation, nativecleanup/priorreclaim, disk và actualpreflight. Không dùng CI cũ hoặc selector riêng; dừng theo mọi gate và hạn23:00.

## Lịch sử checkpoint trước17:00 (đã được phần tiếp tục ở trên thay thế)

**Đã hiện thực và qua hai review độc lập; chưa hoàn tất gate CI/backend.** Code được lưu ở commit `315a31e08591580772b151d6374feb07b90d70b1`, nhánh `run/permissions-20261020`, checkout `D:/Workspace/pos-cafe-permission-run-20261020/code`. Remote vẫn ở `31693d704fc3a7341d15e2843d4d12220883577a`; chưa push, merge hoặc cập nhật Supabase. 15 helper recovery riêng có từ trước được giữ nguyên, không đưa vào commit.

18 file code/test/guide; full Node **805/805 PASS, 0 fail, 0 skip**. Actual Playwright **1.60.0 đúng lock**: 7/7 control chẩn đoán PASS, phát hiện 20 mutation qua parser, exporter worker thật và collector. Chạy lại control trên commit315a31e0 có tracked source sạch; đây là kiểm chứng local, không thay CI17 hoặc backend. Không giảm coverage/acceptance.

Candidate02: `evidence/loop-prevention-20261021/candidate02/packet.json`, SHA256 `23df868f25781596df1406603f965c0df7688663280082ced9be1d309efbc667`. Có snapshot 18 source, 7 docs, 2 collector bên ngoài, test evidence, patch và 88 effective Git pins. Hai reviewer `loop_source_final_review` và `loop_operations_final_review` cùng **APPROVE** chính hash này. [Biên bản và xử lý findings](../../reviews/2026-10-21-permission-loop-prevention-implementation.md).

**Admission thật từ chối lúc16:23:00+07 do không còn đủ37phút trước hạn17:00.** Không dispatch sau từ chối, không giảm mức dự trữ. Evidence: `evidence/loop-prevention-20261021/admission-refusal-1700.json`; budget check xác nhận `DEADLINE`. Backend cần42phút và own-source CI17/cleanup nên cũng chưa được mở. Không có job mới hoặc runtime đang chạy từ lượt này.

Ledger cũ `budget.json` đã CLOSED vì token stop, giữ nguyên. Owner message15:59:29 thay bằng token thoải mái/hạn17:00; successor `budget-continuation-1700.json` kế thừa original start, counts và usage, pin ba hash predecessor. Counts hiện tại: publication0/1, CI0/1, heavy0/2, reviewRounds2/2. Không tự cấp lại hoặc khởi tạo root ledger mới khi đổi chat/SHA.

## Tiếp tục mà không chạy trùng

1. Cần hạn mới được owner cho phép; policy17:00 không tự gia hạn. Lập successor kế thừa ledger CLOSED, giữ lịch sử/spent. Nếu thay packet/budget cần review mới, phải có allocation review rõ ràng vì2/2 vòng đã dùng; không reset bộ đếm. Các approval hiện tại giữ giá trị cho source không đổi, không tự áp cho policy khác.
2. Đọc packet02 và xác minh code HEAD315a31e0/remote31693d7, 88 pins, trạng thái jobs, disk và reclaim; không sửa locator/fixture lại hoặc clone thêm helper. Publication manifest đã chuẩn bị tại `candidate02/publish-manifest.json`, nhưng nó pin policy cũ nên không dùng thẳng sau deadline.
3. Dùng cùng `scripts/permission-runtime-admission.mjs` với manifest và policy mới đã được ràng buộc vào packet/review. Dry-run trước; publication duy nhất tự tạo một lượt CI. Không push thủ công để né admission. Giữ CI17 đầy đủ; local805/control7 không thay PASS own-source.
4. Sau CI terminal, dùng collector hiện có để lưu receipt/log/metadata, đọc control7/20 từ final publicSummary, xác minh native PG16 reclaim. Cùng receipt đúng SHA được tái dùng cho các profile.
5. Chỉ khi gate đạt và còn>=42phút mới chạy backend. T04 phải đủ19stage; TC18 phải đi qua profile PIN đầy đủ. Không nhận profile đơn lẻ thành full35/34chains/20cells PASS. Nếu FAIL, dùng finite outcome/code/line để xác định điểm hỏng trước khi cấp lượt mới; không đổi source hoặc identity chỉ để có thêm lượt.

Recipe và hợp đồng manifest nằm cạnh code: `scripts/permission-runtime-iteration.md`. Full Node trên Windows cần `PERMISSION_STATIC_TEST_TMP` là owned directory trênD; danh sách là tracked `scripts/*.test.mjs` cộng3 test mới ở source315. Không dùng broad glob để đưa15 private helpers vào gate.

Giữ 3 gói JS Playwright đúng pin trong `code/node_modules` (17.410.590 bytes) để chạy control lần sau, không tải browser. Owner cho giữ dữ liệu còn hữu ích và xóa dữ liệu hết mục đích; đã xóa3 archive tải về (3.699.770 bytes logic), giữ receipt/integrity, report và snapshot. Không tự dọn evidence hoặc runtime lịch sử khác.

Walkthrough chưa được owner đọc/nghiệm thu: projection/error facts → parent binding/parser → actual worker export → collector; reporter controls → CI publicSummary → admission; immutable policy → journal/head → predecessor successor. Không tuyên bố owner đã hiểu code hoặc chấp nhận kết quả.

## Lịch sử checkpoint trước khi owner đổi ngân sách

Hồ sơ chính: [proposal và bộ spec](../../../openspec/changes/bound-permission-test-iterations/proposal.md). Kế hoạch được owner chấp nhận trong turn01a15d8a-1a97-7e91-a1e2-91c279922487; không mở merge/Supabase hoặc giảm coverage.

Budget gốc:15:18:14–16:48:14 ngày21/10, workstream permission-loop-prevention-20261021, batchA. Ledger/anchor/journal/usage tại D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021. Cảnh báo đã tới; dừng cấp việc mới trước CI/heavy để giữ ngân sách và khóa bằng chứng. Bộ đếm cuối được lưu trong journal, không tự reset khi resume.

**Chưa hoàn tất.** SourceWIP16file trên HEAD31693d704fc3a7341d15e2843d4d12220883577a, không stage/commit/push. Targeted58/58PASS0fail0skip,syntax0errors; không full regression/review hoặc actual pinned reporter. Publication0/CI0/heavy0.

[Checkpoint/source pins](D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021/checkpoint.json), [patch](D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021/checkpoint.patch), [TAP](D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021/checkpoint-targeted.tap). Snapshot/source giữ trong cùng thư mục. 15private recovery helpers và originals giữ nguyên.

Open: journal suffix truncation có thể rollback spent; collector CLI chưa nối helper; actual pinned controls và hai reviewer chưa chạy. Không được dispatch backend từ WIP này. Hướng dẫn đóng task chưa đạt nằm trong tasks.md; chưa có guard approval nên không nhận ba sửa đã xong.

Walkthrough: projection/facts → transport/selftest → admission/budget; chưa được owner đọc hoặc nghiệm thu. Không cài dependency mới; Windows đang có PW1.62.1/Vitest4.1.10 khác lock, nên không dùng làm proof phiên bản đã pin.

## Tiếp tục theo hạn17:00 — owner15:59:29 ngày21/10

Owner cho token thoải mái, yêu cầu dừng bất kể hoàn thành lúc17:00thiếtbị (+07,10:00UTC); thay giới hạn token cũ. Frozenledger cũ vẫn CLOSED. Policy V2 budget-continuation-1700.json kế thừa originalstart/allowance/counts/usage/identities; không cấp thêm số lượt. Chi tiết quyết định và hash tại proposal.

Đã fix journalhead/suffix/crash, mutationthật4boundary, hai collector cloud dùng cùng finitehelper, admission pin phạmvi và CIidentity/17phase/thứtự/exit0; guidecode scripts/permission-runtime-iteration.md. Budget12,transport7,admission2testsPASS. FullscriptsNode804PASS0fail0skip trên delta trước tightenadmission (targeted deltaPASS); finalfull sẽ ghi trong candidate. Lần đầy đủ đầu8FAIL do thiếu tempenv/pinCI, giữ loglịch sử, đã sửa recipe/pinđúngfile.

Đã tải riêng3góiJS Playwright1.60.0 theo lock/integrity, download3.70MB/installed17.41MB trênD, khôngbrowser. Actualdiagnosticcontrols7/7PASS và20mutation đượcpháthiện. Evidence pinned-diagnostic-controls.json là localbase316+WIPsnapshot, không nhận base316CI/backendPASS. Các attemptedcontrols không dùng SIGINTWindows trướcđó đượcgiữnhật ký; bảncuối dùng parentCLI tựemitSIGINTsaukhi casebắtđầu.

Trước17:00 phải giữ candidate/patch, reviewerfindings/verdict, source/remote/runIDs, counts và nextstep. Reserve37phút CI/42backend gồm5phút đóngsổ: hết thời gian thì giữ gatePENDING và không dispatch. Khôngmerge/Supabasewrites, không giảmcoverage. Chưađạt cuối cho tới review và ownsourceCI.
