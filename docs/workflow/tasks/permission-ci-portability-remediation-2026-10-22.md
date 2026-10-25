# Sửa CI portability và khả năng định vị lỗi —22/10/2026

**Hiện trạng10:12:** CI39713372721 đã **PASS18/18phase**, attempt1, đúngcandidateb2e3122; xem checkpoint terminal cuối tài liệu. Hai publication/CI đã dùng và không được reset. Các mục chuẩn bị, câu “chưa có quyền/chưa push/chưa chạy CI thứ hai” và checkpoint IN_PROGRESS bên dưới là **lịch sử**, không phải trạng thái cuối. Đây là Linux light/nativePG16/EdgePASS; fullbackend29stage/417identity vẫnNOT_RUN. SQL item1 vẫn chưa có xác nhận và chưaRun; main/DBgốc không đổi.

## Sự cố và bằng chứng

Candidate `38a55aab775e1d70dba4b62d6658f41e28f8aef1` đã push đúng một lần, [CI39709124524](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39709124524) **FAIL** ở node-tools. Install/build PASS; unit1175/1175PASS,0skip; tooling567PASS và một manual-deferred case đã nằm trong allowlist trước task, không phải full backendPASS. Node child exit1/13.606s/countsnull. Các phase sau node-tools chưa chạy, bao gồm Edge/nativePG16/UI. [Log](../../implementation-log/permission-release-20261022/ci01-workflow.log), [summary](../../implementation-log/permission-release-20261022/ci01-summary.json).

Windows chạy cùng rawcandidate trướccommit:889PASS/0FAIL/0SKIP/31.31s. CI sourcePreservedtrue, peakOwned496705536B, không có OOM/pid-limit event; không có bằng chứng resourcecap gây lỗi. Child TAP nằm trên VM tạm đã kết thúc; publicreport chỉ có broadcodes và failedFiles rỗng, không thể hồi cứu case lỗi duy nhất bằng dữ liệu còn lại.

Root và hai reviewer độc lập đã xác nhận **một precondition defect tất định**, chưa khẳng định là lỗi duy nhất thực sự xảy ra: `scripts/permission-staging-cli.mjs:9` suy ra siblingdocs, :54 gọi `realpathSync(DOCS)` vô điều kiện. Workflow chỉ checkout code, không tạo `/home/runner/work/pos-cafe-docs`. Synthetic positive CLI ở `scripts/permission-staging.test.mjs:275` vì vậy nhận ENOENT→REFUSED trước fakeGET, khác expectedexit0/2request. Windows có `D:/Workspace/pos-cafe-docs` nên không bộc lộ. Review trước đã bỏ sót giả định layout này.

Một blindspot thứ hai: `project-ci-results.mjs:424–455` quét cả output theo từ khóa, nên tên/payload negative controls có thể tạo timeout/type/protocolcodes; chỉ lấy failedFiles từ Vitest và không cho scriptspath. NodeCounts:580–590 vẫn từ chối đúng failure/skip; đây không là căn cứ để đổiFAIL thànhPASS. Cần xuất metadata lỗi TAP hữu hạn, không rawlogs/secrets.

## Phạm vi sửa đã được giao trong task hiện tại

1. Bỏ phụ thuộc vào sự tồn tại của docs worktree: nếu docs tồn tại thì kiểm canonical path như cũ; chỉ khi thực sự không tồn tại mới bảo vệ expected lexical boundary. Không fallback khi EACCES/ENOTDIR/danglinglink. Config vẫn không được trong code/docs, không ambientfallback.
2. Regression docsabsent/present/inside/dangling. Di chuyển synthetic fixtures từ sibling `../evidence` vào taskTMPDIR để CI đo đúng; không reset/xóa actualclaims hay actualevidence. Giữ35stage/760identity và toàn bộ case trước đó.
3. Định vị actualTAPfailure bằng filepath trong trackedallowlist, line/column/finitecodes; không public rawname/error/stack/body/credential hoặc path ngoài source. Passing negative-control payload không được giả làm failingrecord. Giữ nodeCounts/fullgates, thêm positive/negative/privacycontrols.
4. Chuẩn bị successor guard **chỉ hoạt động sau owner grant bổ sung**: thêm tối đa một publication và một automaticCI, giữ nguyên claim1/policy1/oldV3 và storagebaseline. Fixednewclaim cho remediation01, không reset hoặc retry claim1. Không có đường main/DB/deploy/heavy. Chưa có ownergrant thì REFUSE trước network.

Code sửa ở worktree `D:/Workspace/pos-cafe-permission-ci-fix-20261022/code`, branch `fix/permissions-ci-portability-20261022`, base38a55aa. Trackedsource41.5MB, estimatedcopy/metadatapeak<60MB; D còn98.7GB/C195.6GB khi tạo. Không copy `node_modules`, không tạo runtime/WSL/Docker mới. Checkout cũ ở source38 và gói SQL hash0094140c…073e giữ nguyên, vì owner còn chờ trả lời action-time SQL confirmation. Không tự sửa gói đang chờ duyệt.

## Kiểm chứng và cổng chạy tiếp

- Tác giả chỉ sửa phạm vi riêng; sourcefingerprinttests chạy sau khi các tác giả freeze để tránh tạo SOURCE_DRIFT giả do sửa đồng thời.
- Local focusednegativecontrols và fulltrackedNode saufreeze, syntax/diff/trustedpins; không gọi kết quả Windows là LinuxPASS.
- Hai non-author reviewers khác scope APPROVE exactcandidate/plan/guard trước đề nghị lượtCI mới. Chuẩn bị concretecommit/policy/receipt trước câu hỏi owner.
- Phasepublication1/CI1 đã tiêu. **Chưa có quyền thực thi remediationpublication/CI** theo successor đang đề xuất; không dispatch/rerun/deleteclaim. Sau ownerchọn cấp bổ sung thì pin nguồn/authorizationactual, review delta rồi freshadmission/onepush. Gặp lỗi thì dừng, giữ failingreceipt.
- Deadline vẫn11:00+07, cutoffpublication10:15; không kéo hạn, không giảm coverage, không pushmain khi fullgate thiếu. SQLstaging còn pending câu hỏiitem1 của `call_99d94cd4e85d4c3ab6b7dbb319943229`, không coi câu trả lời hủyworkflowitem0 là đồng ýSQL.

## Trạng thái

**Đang chuẩn bị offline; chưa chạy lượtCI thứ hai.** Author CLI/bootstrap: `bootstrap_provider_design_20261022`; Node diagnostics: `continuation_source_review`; successor guard: `release_gate_feasibility_20261022`; root record/trustedpins. Review cuối phải do người không thuộc danh sách tác giả này. Hashcandidate/localtests/actualownergrant được bổ sung saufreeze, không điền giả.

## Kiểm thử local và sửa thiết lập kiểm thử

Bản sửa đã freeze đúng8file; [manifest nguồn](../../implementation-log/permission-release-20261022/ci-portability/candidate-source01.json) ghi riêng rawSHA và Git canonicalLF SHA, cùng danh sách tác giả. Hai trusted pins của CI results được cập nhật theo canonicalLF; các giới hạn release và productionEnabled không đổi. Node diagnostics có7test mới, gồm child Node24.16.0 thực sự thất bại với ENOENT;58test của file này PASS. Bốn test boundary CLI và bốn test continuation guard là bổ sung, không bỏ case cũ.

Root đã có hai lượt fullNode local chưa đạt và giữ nguyên bằng chứng:

- [Lượt01](../../implementation-log/permission-release-20261022/ci-portability/local-node-tools-remediation01.json): exit1; reporter mặc định là spec nên bộ đọc TAP trả countsnull. Log spec thực tế904case,868PASS/36FAIL/0skip. Agent đã bỏ sót env `PERMISSION_STATIC_TEST_TMP` trên D và checkout mới có CRLF ở các fixture khóa theo byteLF.
- [Lượt02](../../implementation-log/permission-release-20261022/ci-portability/local-node-tools-remediation02.json): reporterTAP và ownedDtemp đã đúng;904case,875PASS/29FAIL/0skip. Lệnh checkout-index của [setup correction01](../../implementation-log/permission-release-20261022/ci-portability/local-setup-correction01.json) **không thực sự thay bytes**; sourcefingerprint vẫn như01. Không được dùng receipt đó làm bằng chứng canonical hóa thành công. Các lỗi còn lại gồm binding manifest và test đọc dấu xuống dòng trong source không sửa.

Sau khi kiểm byte trực tiếp, root lấy các blob từ index qua một gitcat-file batch đã kiểm framing và SHA1, rồi chỉ ghi lại1098file vốn không có thay đổi trong worktree mới. Có858file thực sự đổi line endings; cả1098file được so byte với index,8file tác giả giữ nguyên rawhash và diff vẫn đúng8path. [Receipt canonical thực tế](../../implementation-log/permission-release-20261022/ci-portability/local-canonical-bytes01.json) ghi rõ lần trước chưa canonical hóa. Reviewer `investigation_plan_review` kiểm độc lập toàn1098file bằng indexblob và8authorpins, đều khớp. Checkout gốc38 và gói SQL chờ xác nhận không đổi.

Lượt03 dùng Node24.16.0, `--test --test-concurrency=2 --test-reporter=tap`, đủ69tracked scripts testfiles và `PERMISSION_STATIC_TEST_TMP=D:/Workspace/pos-cafe-permission-ci-fix-20261022/temp`. Chỉ nhận kết quả sau khi đọc receipt thực tế và sourcefingerprint trước/sau; chưa có Linux/DB/fullgatePASS từ các lượt Windows này. Các lỗi thiết lập trên là lỗi thao tác của agent; không sửa assertion hoặc fixture acceptance để che chúng.

Recipe tiếp tục phải kiểm đủ **canonical bytes + ownedDtemp + explicitTAP** trước fullNode; không chỉ tin exit0 của lệnh chuẩn bị. Node-tools trong CI hiện đã có explicitTAP trong `project-ci.mjs`, nên lỗi reporter của lượt local01 không được gán thành nguyên nhân CI1. Nguyên nhân CI được xác nhận qua source vẫn là docs sibling bị thiếu; vì raw childTAP của CI1 không còn, chưa khẳng định đây là nguyên nhân duy nhất.

## Candidate chuẩn bị xong — chờ quyết định chạy tiếp

[Lượt03 thực tế](../../implementation-log/permission-release-20261022/ci-portability/local-node-tools-remediation03.json) đã đạt **904/904PASS,0FAIL/skip/cancel/todo**,31.326s; source raw fingerprint trước/sau đều `b975bb44c79aae23b8c971777046111200f1e89e1ef59009c283c713f03e6b87`. Reviewer source/plan `investigation_plan_review` và operations `continuation_operations_review` đã kiểm độc lập log, receipt,8pins và1098unmodified canonical blobs, đều APPROVE việc chuẩn bị offline. Không dùng kết quả này thành Linux hoặc full backendPASS.

Đã lưu localcommit `b2e3122866f5b6108f026f381f4f12614c98027c`, parent38a55aa, đúng8paths/458insertions/32deletions, branch `fix/permissions-ci-portability-20261022`. [Receipt commit](../../implementation-log/permission-release-20261022/ci-portability/candidate-commit01.json): tracked/untracked sạch;43trusted committedGitblobpins khớp, productionEnabledfalse. Chưa push commit này.

[Proposed policy](../../implementation-log/permission-release-20261022/ci-portability/publication-policy-remediation01.proposed.json) SHA `68071f2edde0465678481f2313374e82c50680d5d5563055e48ab133ed53dd03` và [proposed packet](../../implementation-log/permission-release-20261022/ci-portability/publication-packet-remediation01.proposed.json) SHA `2f2c7da12cf9ae7a47ca95098001e005205f7ebfc3d4a5c0419b11b6f0a3615a` khóa commit và8Gitpins. Đây là bản đề nghị có ownerAuthorization **PENDING**, reviews cũng là placeholderPENDING; không phải policy được phép dispatch. [Pure-model pregrant refusal](../../implementation-log/permission-release-20261022/ci-portability/admission-pregrant-refusal01.json) trả `OWNER_GRANT_REQUIRED` trước mọi remote facts/claim. Sau ownergrant phải tạo finalpacket/policy/reviews mới, giữ nguyên bản proposed, để hai reviewer kiểm exactdelta authorization trước admission.

Đề nghị quyết định duy nhất cho nhánh CI: bổ sung tối đa **một publication + một automaticCI** cho commit b2e3122, không thêm heavy/backend/SQL. Giữ lịch sử claim1 và oldV3, originalstoragebaseline, cutoff10:15/deadline11:00, không retry nếu lỗi. Việc SQL staging vẫn nằm ở câu hỏi xác nhận riêng item1 đã gửi; không gộp quyền SQL vào grant CI.

Walkthrough kỹ thuật cho owner đang chờ: config boundary vẫn kiểm canonical path; TAP chỉ công khai file/dòng/errno hữu hạn; successor guard cần actualgrant và một claim mới cố định. Tài liệu này cùng source/test links là phần trình bày có thể kiểm lại; chưa ghi nhận owner đã đọc hoặc hiểu code.

## Owner đã cấp bổ sung; actual CI đang chạy

Owner chọn “Cấp thêm1push candidate+1CI” qua `USER_REPLY_call_31849df3bfad47f7aec74d3d7155420c:item0`. [Authorization record](../../implementation-log/permission-release-20261022/ci-portability/owner-authorization-remediation01.json) phân biệt thời điểm agent quan sát/lưu câu trả lời với timestamp server; reviewer source còn đọc độc lập chính userreply trong parent transcript. Quyết định không cấp SQL/heavy/main hoặc thay fullgate.

Hai reviewer source/operations đã APPROVE actualgrant delta và kiểm checksum cuối: [packet](../../implementation-log/permission-release-20261022/ci-portability/publication-packet-remediation01.json) SHA `88cdaef84606ad227ac15cb41a8940da4672cd3da803bbc4e787f71f32a1eea2`; [policy](../../implementation-log/permission-release-20261022/ci-portability/publication-policy-remediation01.json) SHA `18325065527ac125f670932e4cbdee3846466cf7045b36790438dac6bf04ab55`; [reviews](../../implementation-log/permission-release-20261022/ci-portability/publication-reviews-remediation01.json) SHA `685fb6c398c214968527184a9b778e5db1ac5672a0e44e7dba4c499fb9b75c0f`. Proposed/draft và reviewsPENDING được giữ riêng, không dùng thay approval thật.

[Fresh dryrun](../../implementation-log/permission-release-20261022/ci-portability/admission-remediation01-dryrun.json) ADMITTED; [dispatch một lần](../../implementation-log/permission-release-20261022/ci-portability/admission-remediation01-dispatch.json) ADMITTED sau khi guard kiểm lại nguồn/parenthash/clock/jobs/PR/disk và ghi exclusiveclaim. Windowsgrowth506499072B, còn trong20GiB với5GiB reserveCI; C/D đều qua30GiB. [Claim mới](../../implementation-log/permission-release-20261022/ci-portability/publication-autoci-remediation01.claim.json) rawSHA `d5fb2f7205a1651f68223d70b4a1f21e68c580149c4e98ff63fe02903d1be99c` đã tiêu; claim1 và oldV3 không đổi.

[Readback](../../implementation-log/permission-release-20261022/ci-portability/publication-readback01.json)02:48:42UTC xác nhận remote run branch đúng b2e3122 và đúng một automaticpush CI [39713372721](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39713372721), attempt1, lúc đó IN_PROGRESS. Không rerun/forcepush/resetclaim. Chưa ghi nhận LinuxPASS từ trạng thái đang chạy. Phase22Oct hiện dùng publication2/CI2 dưới hai grant riêng; lịch sử21Oct giữ nguyên CLOSED. Main/SQLstaging/DBgốc không đổi.

Chỉnh lý metadata Git: sau canonical hóa, `git status` từng báo858entry do indexstat dù contentdiff0. [Index-only refresh receipt](../../implementation-log/permission-release-20261022/ci-portability/index-stat-refresh01.json) xác nhận status0, staged contentdiff0, rawsourceb975bb44…6b87 giữ nguyên; không tạo commit mới. Reviewer kiểm status sạch thực tế trước admission.

## Checkpoint terminal10:12 — CI Linux đã PASS

[CI39713372721](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39713372721) kết thúc success sau12m54s, attempt1; [metadata](../../implementation-log/permission-release-20261022/ci-portability/ci02-terminal-metadata.json), [safe summary](../../implementation-log/permission-release-20261022/ci-portability/ci02-summary.json), [result receipt](../../implementation-log/permission-release-20261022/ci-portability/ci02-result.json). Log raw88689B/SHA `49fad6090482462ef5850aba941cf631189d8bb6eed4e9dcc94b7d4c1deb8c6b`; summarySHA `488dfb3016d5a4404b50db010db859702839e3883abd85b480ab257c4b30f823`. Root và hai non-author reviewer đã đối chiếu nguồn/summary/nativeproof; sourcefingerprint Linux `afb5a57c1a2c02076ed8f340ccfcbc89ed88dcca40da9a8c76699f54dea310f4` khớp1106committedGitblobs.

Đủ18phasePASS; unit1175/1175, Node904/904, static480, nativePG16T0130, reporter4+diagnostic7/20mutationchecks. PG16 actualserver160015, physicalidentity/zero requiredskip/retry, process/root cleanup và50.741.248B reclaimed có [receipt](../../implementation-log/permission-release-20261022/ci-portability/ci02-pg16-runtime.json). FinalcleanupNOT_PRESENT được bind minh bạch bằng samejoblog, không dùng trạng thái này một mình để suy actualPG16đãchạy. Edge17observed+3metadata/20packages, haiwarmbundles vàbadSRIcontrol đềuPASS, root/processreleased. Peakowned1.316.163.584B dưới5GiB, sourcePreservedtrue.

Tooling giữ1manual-deferred case có allowlist; smoke44PASS/37applicabilityskips. Không tuyên bố toànCI zero-skip và không đổi coverage. Fullpermissions vẫnPENDING, còn29backendstage/417requiredidentities; main không push.

Artifact ảnhPIN rawZIP66520B/SHA `5ad1de5f3d5b03b3af84fcbd1b11d4a2455666f9a3d444e82f1259f7d586ec2a`, bốnallowlistedfiles65916B. [Validation](../../implementation-log/permission-release-20261022/ci-portability/pin-ui02-validation.json) kiểm binding/4sourcepins/baseline/PNGCRC/dimensions. Root và operationsreviewer đã mở đủbaảnh; [inspection riêng](../../implementation-log/permission-release-20261022/ci-portability/pin-ui02-inspection.json) ghi không thấy lỗi layout ở vùng nhìn được, mỗiảnh haiPINprivacy masks không đánhgiá nội dung/chi tiết. Ảnhmobile fullpage419px so vớiviewport390px, không nhận thành zeroverticalscroll. Rawmanifest photoInspectedfalse/visualReviewNOT_RUN giữ nguyên; actualinspection là receipt riêng. Đây chỉ credential-free mock, không nativePINbusinessPASS.

[Kế hoạch lượt tiếp tục](permission-next-release-session-2026-10-22.md) giữD19/R0R1, đủcoverage, đườngrunner cósẵn,12nghĩavụ bổ sung và giới hạn quyền/thờigian. Không mở lại wholeD1 hoặc viết hostedadapter chỉ để chạy stage rows. Ngân sách heavy time-only cần successor được review; hiện chưa cóheavygrant và không đổi sourceb2 để tự mở lượt. SQLstaging vẫn chờ xác nhận riêng trướccutoff10:15.

**Cutoff đã đóng:** [localreceipt03:15:38UTC](../../implementation-log/permission-release-20261022/cutoff1015-checkpoint.json) trảREFUSED/DEADLINE, không network hoặc claim mới. Tới thời điểm đó chưa nhận SQLitem1; khôngRun/khôngheavy/main. Câu “chờ xác nhận trước10:15” phía trên là snapshot trước cutoff; lượt sau cần cửa sổ/policy/output còn hiệu lực, không chạy lại gói hết hạn hoặc coi im lặng là đồng ý.
