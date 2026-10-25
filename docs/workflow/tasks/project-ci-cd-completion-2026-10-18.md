# Hoàn tất CI/CD — tiếp tục 18/10/2026

## Checkpoint hiện hành 18/10 — hoàn tất CI tự động và protected mock Preview

CI-only source `8de965aaf15e154adbe8a691a8ccebd72cb41e85`, PR[#4](https://github.com/nguyentronglinh045/pos-cafe/pull/4): push39100508272 và PR39100510030 đều SUCCESS; 9phase của MAIN_CURRENT_APP đã chạy. CI04a manifest `0A09850B629C86454F8C4DDA46875E322D0238CB1A88DB5BF6152C67B3A7B669` được SEC/EVC APPROVE. Đã áp main required check strict, App15368, enforce_admins, PR required/0human approvals cho soloowner, noforce/nodelete/conversation resolution. Preview đã có requiredowner review, main-only và admin bypass=false. Negative control trên PR4 khi PR CI còn đỏ cho mergeStateStatus=BLOCKED, không thử bypass. PR4 đã merge bình thường, không bypass, ngày18/10/2026 05:33:11UTC thành `10e0348d0f756dd6a6ac53a24ab53391ed4d31b4`. Actual main push39100947815 SUCCESS đủ9phase: unit637/637, tooling36PASS+1manualDeferred, Node46PASS, smoke35PASS+31applicabilityskip/66; sourcePreserved=true, peakOwned926.687.232B. Safe receipt `D:/Workspace/pos-cafe-ci-fix/artifacts/ci-main04a/main-39100947815.json`. Production không thay đổi.

Preview candidate local `98f3afc8d674ee0a55044047e8981f42b2ede917`, tree `7c7903c4e2b444446016f46f92da551d743807e1`, có đúng5file delta so CI8de: manual workflow, builtin REST controller, regression test, vercel.json, release-policy. Node61PASS, chưa push/API auth/deploy. Đã rebase sạch thành `638ee233c85142caf2348d5db6d4a8f25832b74a` trên actualmain10e0348, tree byte-identical7c7903c; delta đúng5file. Cả EVC/SEC trả CHANGES_REQUESTED cho Preview01 manifest CFFAD0A8F872F3B349543D549DD5A703C5843534F8ECB6B4C2D0708FFA95A977: thiếu redirect/redirectStatusCode/gitBranch trong production route snapshot và sai casing alias.target. Đã sửa2module/test và reseal18canonicalpins thành local candidate02 `691b0d4de11979fef742d35f0df4bd5ff447918a`, tree `a67dc3557f378be996f37b554badf92645f84f6c`, parentactualmain10e0348. Root chạy lại63NodePASS/0fail/0skip, receipt artifacts/preview02/node-tests.txt SHA F72B5E93BF531653274E72532303DE3AD083925C919705F8178810CB07560FE8. Cả EVC và SEC đã APPROVE exactPreview02 manifest34C945E4F5F56F9ADB0A510B6E50B8C2B5DDBB0DD769A7264EE8E857537C2B27. Push39101476078/PR39101479663 đều SUCCESS9phase: unit637, tooling36+1manualDeferred, Node63, smoke35+31applicabilityskip/66, sourcePreserved=true. PR5 đã merge thường ngày18/10 05:48:34UTC thành `536d8f6497403ace1193af4586a89b4862c730fd`, tree vẫn exacta67dc355 đã review. Actual main push39101826725 attempt1 SUCCESS đủ9phase, Node63PASS/sourcePreserved=true/peakOwned997.208.064B. Manual Preview39102130352 attempt1 SUCCESS trên exact536d8, deploymentdpl_EsvP4kTkNG6JoKva2yNT523epBjr READY, targetnull/source đã kiểm trong controller, production routing và6declared protection fields không đổi. URL https://pos-cafe-kgnrohp1y-24tx810010-hcmutes-projects.vercel.app . HTTP không đăng nhập302→vercel.com; browser có phiên Vercel render landing POS Cafe PASS. Business flows tại Preview NOT_RUN; không đổi Production. Hai final reviewers EVC/SEC đã APPROVE exactcloseout02 (manifest D068C52F0F16FC7075AB50FC27CC9C63C180AA13C70211DFD5E3D638CDBBA329). Hoàn tất kỹ thuật trong scope đã chốt; chưa nhận owner nghiệm thu/đọc source.

**DEC-COMP-06 hiện hành:** owner chọn “Tách CI/CD để hoàn tất sớm; bản phân quyền tiếp tục chờ đủ gate”. Thay yêu cầu merge chung của DEC-COMP-01; không miễn gate phân quyền. Source cũ `c898d7602d83e1e6d444e0c22259bd141bef85a4` và HP1 WIP giữ riêng tại `D:/Workspace/pos-cafe-ci`; pilot light11phase/backend4/4 không thay fullPIN19/PERM60/HP1/integration review. Không tiếp tục fullrunner/HP1/GPG smoke trong scope mới.

**DEC-COMP-07:** owner đã chọn “Dùng Vercel Preview” trong câu hỏi chuẩn bị và chạy lần Preview đầu. GitHub Preview giữ ownerreview/mainonly; operator có thể thực thi thay owner trong quyền này, ghi acting-on-behalf, không nhận owner đã đọc source. Production tiếp tục khóa. Owner trả lời sẽ tự lưu VERCEL_TOKEN vào environment Preview; GET ban đầu0secret; sau UI hướng dẫn, owner trả lời “Tôi đã lưu xong VERCEL_TOKEN”. Readback mới count1/hasVercelToken=true, không đọc giá trị. Đây là credential presence, chưa là auth/API/deployment PASS. Không cần hỏi lại quyền Preview đã cấp; chỉ dùng qua protected environment.

Utility proof-package02 có hai APPROVE/133NodePASS nhưng chưa actual Windows/MSYS GPG roundtrip, chưa hoàn tất. Khóa DEC04 giữ private C, D chỉ có public recipient/receipt. Billing quota/hard stop chưa xác minh và upload vẫn chặn; CI-only/Preview hiện không dùng Actions artifact. Các checkpoint sau giữ lịch sử tại thời điểm ghi, không thay hiện trạng đầu hồ sơ.

## Đề bài, phạm vi và quyền

Owner yêu cầu: “vậy bạn tiến hành xử lý lần lượt đi, sử dụng subagent. có gì không hiểu hãy đợi tôi trả lời rồi mới làm nhé”. Đây là quyền thực hiện lần lượt kế hoạch [trao đổi tiếp](../../implementation-log/project-ci-cd-status-audit-2026-10-18.md#trao-đổi-tiếp-làm-gì-để-hoàn-tất-và-tái-sử-dụng-lâu-dài), giữ các quyết định còn hiệu lực. Mọi uncertainty material phải hỏi và chờ trước phần phụ thuộc; không coi yêu cầu chung là chọn source main, môi trường deploy hoặc phát hành production cụ thể.

Change/spec nền: [setup-project-ci-cd](../../../openspec/changes/setup-project-ci-cd/proposal.md), [tasks/gates](../../../openspec/changes/setup-project-ci-cd/tasks.md), [hồ sơ setup](../../implementation-log/project-ci-cd-setup-2026-10-17.md). Sửa fixture là bảo trì test theo acceptance hiện có; không tạo yêu cầu nghiệp vụ mới, không giảm coverage, thay baseline/ACL hoặc thay PASS semantics.

## Nguồn và hiện trạng khởi động

- Code sửa fixture: `D:/Workspace/pos-cafe-ci`, nhánh `ci/project-pipeline-20261017`, HEAD `0781f755737747fc8cc810ac5484b12d892013a4`, sạch trước sửa. Không dùng checkout main5156820 đang dirty để stage/cài.
- Remote main `f9c566999c4367a5ca54a879fe3b06b5870f26f2`; source CI khác main561files, gồm209src và15Supabase, không phải diff tooling đơn thuần. Application/SQL của CI khớp evidence43921c7; chưa được nhận release acceptance.
- CI30 `39026804330` PASS; backend18 `39027568904` FAIL; CD `39028263852` preflight PASS/approval waiting. Đối chiếu live đầu lượt18/10, không có run mới hơn.
- Backend18: T09 assertion1PASS nhưng hookFAIL, nhánh cleanup-read/phase4/step13/code17generic, catalog driftmask1/financial0; T10 NOT_RUN. Chưa có root cause duy nhất.
- Docs worktree `e47862b1...` có thay đổi cũ. Chỉ thêm hồ sơ task mới này, giữ các thay đổi không thuộc task.
- Windows free disk khởi động đã đo trên C/D; trước mọi cài/chạy lớn sẽ đo lại và ước tính download/retained/peak. Không tạo WSL hoặc Docker Desktop. Dùng lại GitHub-hosted runner theo mô hình đã chọn; không giữ nhiều heavy environments.

## Các bước và câu hỏi chặn

| Bước | Trạng thái / điều kiện |
| --- | --- |
| 1. Sửa fixture backend | Đã sửa c898d76; pilot backend39096247811 PASS4/4 và lightCI39095564040 PASS. Fullgate phân quyền còn thiếu. |
| 2. CI trên main | Đã merge PR4 thành10e0348; actual main CI39100947815 PASS9phase, main protection/negative BLOCKED đã kiểm. Phân quyền chờ gate riêng. |
| 3. CD thực | Main536d8/CI39101826725 PASS; actual Preview39102130352 SUCCESS/READY, routing/protection không đổi; production giữ khóa. |
| 4. Kiểm end-to-end | Luồng CI→protected environment→Preview READY đã chạy; landing render PASS bằng phiên Vercel, HTTP không auth302. Business smoke trên URL Preview NOT_RUN; fullpermission/backend riêng vẫn hoãn. Final EVC/SEC APPROVE closeout02. |

Q-COMP-01 được cập nhật theo DEC-COMP-06; Q-COMP-02 đã trả lời Preview theo DEC-COMP-07. Không hỏi lại lựa chọn này hoặc CI nhẹ auto/backend manual/CD frontend/DB-Edge riêng.

## Kế hoạch kiểm bước1

1. Xác định nguyên nhân bằng code, regression có ý nghĩa và/hoặc finite diagnostics trên runner cách ly; phân biệt raw ACL representation drift với thay đổi quyền thật, không tự bỏ hash/grant checks.
2. Sửa nhỏ theo bằng chứng, giữ test assertions/gates/limits/privacy. Chạy local checks không cài khi có thể; nếu thiếu dependency, kiểm bản sẵn có và dự trù trước mọi cài.
3. Hai reviewer độc lập kiểm candidate sensitive về bảo toàn dữ liệu/quyền và evidence/privacy. Không công bố source mới để chạy CI trước khi các reviewer bắt buộc APPROVE đúng candidate.
4. Công bố đúng source, chờ light CI terminal, rồi backend manual cùng source; không chạy hai heavy runtimes cùng lúc. Ghi run/attempt/source/counts/cleanup/preservation, không nâng proof local thành runtime PASS.

## Điều phối và bàn giao khởi động (lịch sử)

- `/root/ci_docs_evidence`: investigator fixture/root cause, không sửa code.
- `/root/ci_config_investigation`: investigator source main/integration, không sửa code.
- Parent thực hiện hoặc giao builder trong scope đã rõ; reviewer không sửa candidate/deploy.
- Trạng thái ở checkpoint khởi động: **đang thực hiện**, chưa có source mới, chưa test runtime mới, chưa hoàn tất CI/CD. Walkthrough sẽ cung cấp khi có candidate; không nhận owner đã đọc/hiểu. Hiện trạng mới nhất nằm ở đầu hồ sơ và DEC-COMP-06.

## Checkpoint diagnostic01 — local, chưa công bố

Owner hỏi thêm điều kiện merge và chỉ muốn merge bản phân quyền nếu đủ. Điều tra độc lập chưa xác nhận đủ: backend hiện FAIL; full PIN19/PERM60 thuộc source57, không thay bằng chứng final source58/43921/0781; review gói evidence không phải exact application merge review. Chưa có quyết định miễn/tách gate merge-only hiện hành. Q-COMP-01 tiếp tục cần kết quả và/hoặc lựa chọn; Q-COMP-02 chưa trả lời.

Candidate diagnostic01 trên baseline0781f75 sửa9paths, chỉ thêm quan sát và giữ primary/finalizer errors. Chưa sửa root cause hoặc đổi acceptance:

- `scripts/permission-fixture-diagnostics.mjs`: giữ lỗi main/finalizer qua AggregateError nội bộ, giới hạn flatten32/depth4; catalog drift mask8bit: missing/added1, relationACL2, columnACL4, effectivegrants8, routine16, structure32, policy/publication/Storage64, unknown128.
- Read/financial/identity cleanup dùng helper giữ cả lỗi trước và lỗi finally; thứ tự SQL/finalization giữ nguyên. Fingerprint identity vẫn so full hash với cách normalize routineACL cũ; helper mask không tham gia PASS.
- Images cleanup chiếu lỗi thành fixed code/SQLSTATE whitelist; raw error/object/SQL/names vẫn không public. Private permission report giữ các lỗi; marker CI ưu tiên catalog mask nếu có. Marker này không tuyên bố primary/root cause.
- Code ordinal1–19 giữ nghĩa cũ. Ordinals20READ_DRIFT/21FINANCIAL_DRIFT/22BUSINESS_DRIFT/23IDENTITY_CATALOG_DRIFT; ordinal24–278 tương ứng `23 + mask`1–255. Không thêm trường public tự do, không đổi stage/matrix/counts/skip/retry/limits.
- 6 regression tests mới: từng field/mask, invalid/bounded inputs, primary+finally, chạy chính body cleanup read/financial/identity trong VM với fake DB, chạy chính body semantic hash để chứng minh drift vẫn FAIL, và255mask đi qua reporter/marker không lộ private strings.
- Local: Node24.16.0; `node --test --test-concurrency=2 --test-reporter=dot` trên toàn bộ7files `scripts/*.test.mjs`:110PASS/0fail/0skip, exit0; `git diff --check` exit0. Không DB/WSL/Docker/browser/backend thật, không cài thêm dependency. Tests có fixture giả chỉ chứng minh helpers/transport, không chứng minh backend PASS.

Candidate/snapshot và hai review độc lập cần hoàn tất trước công bố và actual CI/backend mới. Chưa nhận local diagnostics là đã sửa backend.

## Checkpoint diagnostic02 — sửa findings, chưa công bố

Diagnostic01 manifest `b8bd829417932a7794c319bf68ee3c0e3138e9404630349f95f1346e127fe4bd`: SEC APPROVE đúng privacy/resource scope; EVC CHANGES_REQUESTED. Hai finding chặn: matching theo ID giấu ordering/residual drift (ACL+same-surface column reorder ra2 thay130; outer reorder ra0 thay128), và spec/design36 còn giới hạn code19/firstdetail.

Đã sửa helper nhận diện common surface/column ordering riêng, thêm regression hai phản ví dụ và đồng bộ superseding extension18 trong spec/design/testplan/trace. Giữ fullhash/SQL/ACL/acceptance như cũ. Chạy lại toàn bộ Node:110PASS/0fail/0skip/exit0; diff-check exit0. Diagnostic02 sẽ freeze9codepaths+4specpaths+task này, cần cả EVC/SEC APPROVE exact candidate cuối. Không dùng approval01 để công bố02.

## Checkpoint công bố diagnostic02

- Final manifest `b6a1f949c3e1b450d96f667a124eebcc5e9d136ab2bbab9518bf196d8e4eec16` tại `D:/Workspace/pos-cafe-ci/artifacts/project-ci-completion/diagnostic02/manifest.json`, có9snapshot code+4spec+task. `/root/status_independent_review` APPROVE correctness/evidence; `/root/ci_config_investigation` APPROVE SEC/privacy/resource. Cả hai kiểm exactcandidate và chạy110NodePASS; finding01 đã đóng. Scope approvals: đúng9codepaths lênCIbranch, lightCI terminal rồi backend manual cùngSHA, không main/provider/deploy.
- Đã commit/push `708f9569e54d505eae1431e0df285c01f8a3edb9`, parent0781f75, đúng9paths/284insertions/17deletions; worktreeCI sạch. Không đổi workflow/checker19pins hoặc application `src`/candidateSQL.
- [Actual CI mới39094065332](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39094065332) tự chạy từpush, source708f956; tại checkpoint đangin_progress, chưa PASS. Backend mới chưa dispatch. Không nâng kết quả backend18 cũ thành kết quả source708f956.
- Estimate trướcpush: **LỚN HƠN1GB** cho batch; lightdownload0,4–0,7GB/peak1–2GB; backenddownload2,3–3GB, runtimeallocated18GiB+overhead trong taskguard20GiB/reserve30GiB, chạy tuần tự trênGitHubhostedtạm. Căn cứ12pinnedmanifest receipt có tổngcompressedlayers2.005.271.138B, npmarchives195.942.868B, tools112.621.911B và Edgecachebound512MiB; image/tool/lockpins không đổi. Bound không phải hứa mọi hostwrite đều bị quota20GiB; runner vẫn phải đo/guard thật và core disabled theo recipe.
- Windows không cài thêm: source/28artifactfiles hiện393.819B logical, chưa đo allocated riêng; C/D checkpoint trướcpublish198.299.312.128/99.564.158.976Bfree, saupublishC202.931.744.768/D99.563.503.616Bfree. Không quy biến động free ngoài task cho cleanup; không xóa dữ liệu.
- Walkthrough đã nêu: fixture cleanup→giữprimary/finally→strictfullhash mismatch→finitemask→reporter/marker. Chưa có owner read/understand acknowledgement.

## Khảo sát độc lập trong lúc CI chạy

- `git merge-tree --write-tree --name-only main-f9c5669 CI-708f956` tạo object preview `a19e10eaa8bf26be943cbd93bca96e729c30d7bd`, exit1 với add/add conflicts `.github/workflows/backend.yml` và `scripts/project-ci-results.mjs`. Đây chỉ là khảo sát vào Git object store, không checkout/merge main và không phải candidate đã resolve/review. Main có backend bootstrap guard, CI có đầy đủ runtime; integration phải xử lý rõ hai version và trusted pins.
- Investigator rà merge readiness: full PIN19/PERM60 gần nhất là source57; source58 chỉ HP1harness75PASS, thiếu fullgate/finalreviews. Hồ sơ publication cũ chỉ duyệt evidence package; chưa có exact application merge tree review. Online backend còn legacy là release/cutover gap riêng; không buộc production mutation để xét merge-only.
- Q-COMP-01 được owner hỏi lại “nếu đủ thì merge một lần”; đã trả lời chưa đủ bằng chứng và gửi câu hỏi kế tiếp: hoàn tất fullgate bản phân quyền rồi merge chung, hay chỉ CI/CD main hiện tại. Chưa có lựa chọn, không suy im lặng là scope mở rộng.
- Feasibility fullgate: test/checkers có trong Git nhưng orchestration source57 và profile/cache nằm ở artifacts/lab cũ; cần5Supabase profiles tuần tự+nativePG16T01. Worker hiện chỉ T09/T10; chưa có proof portfullgate giữ budget20GiB. Không tạo lại WSL/Docker hoặc nhận pilot4cases thay fullgate.

## DEC-COMP-01 — source main và mở rộng fullgate, 18/10/2026

- Trạng thái: **quyết định lịch sử đã được DEC-COMP-06 thay về điều kiện merge chung**. Tại checkpoint này owner trả lời: “Hoàn tất gate bản phân quyền rồi merge chung một lần (Khuyến nghị theo ý muốn gộp một lần)”. Sau kết quả readiness, owner khi đó chọn source phân quyền và mở rộng task sang hoàn tất các gate của source đó trước tích hợp main; không chọn CI main legacy riêng.
- Lý do/phương án: giữ một lần tích hợp bản code sẽ duy trì, thay phương án chỉ pipeline main cũ. Hệ quả: cần fullgate PIN19/PERM60/HP1/legacy đúng finalsource và exact merge-tree review; pilot4cases/CIlight không đủ. Điều tra runtime/evidence/budget trước port là phần công việc được giao.
- Giữ giới hạn: không tự hạ acceptance/privacy/ACL; không tạo lại WSL/Docker; taskbudget20GiB/reserve30GiB, một heavyenvironment. Nếu fullrecipe chưa có upperbound an toàn thì dừng phần cấp phát, khảo sát nhỏ được tiếp tục.
- Merge được owner yêu cầu có điều kiện “nếu đủ”; không miễn gate/review, không nhận deployOFF là đã kiểm app. Production và quyết định Preview/production vẫn chưa được duyệt riêng. Database/Edge giữ quy trình riêng.
- Tiếp theo: diagnostic actual→fixrootcause→portfullrecipe có budget/proofretention rõ→fullgatefinalsource→reviewintegrationcandidate→merge và requiredCI. CD phụ thuộc câu trả lời môi trường và quyền phát hành cụ thể.

## Checkpoint actual diagnostic02 — light PASS, backend FAIL

- [Light CI39094065332](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39094065332) hoàn tất SUCCESS trên exact source708f956, job117576693217. 11phases PASS: unit1173/1173; tooling566PASS/1manualDeferred; Node110PASS; browserpreflight1; smoke44PASS/37applicabilityskip; UIselftest23; UIaudit48PASS với6baselinefindings hiện hành. SourcePreserved=true; peakOwnedBytes966660096. Không cập nhật UIbaseline. Safe public summary lưu tại `artifacts/project-ci-completion/diagnostic02/ci-39094065332.json` trong worktreeCI.
- Sau khi xác minh light terminal và remoteCIhead708f956, dispatch [backend39094768210](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39094768210) cùngSHA, job117578795020; hoàn tất FAILURE. Bootstrap/Auth/API/sourcepreservation PASS, outercleanup=true, coreRestored=true. T09 assertion1PASS nhưng afterAllFAIL/exit1; T10 NOT_RUN, overallFAIL.
- Diagnostic actual: phase4/step13/code25 = `23 + mask2`, chỉ relationACL trong normalized semantic surfaces thay đổi; preservation catalogmask1/financialmask0. Đây là bằng chứng khoanh vùng raw relation ACL, chưa chứng minh bảng nào hoặc nguyên nhân là ordering/grantor/grant-option/service_role. Không normalize/bỏ relationACLhash và không coi observedGrants không đổi là toàn quyền không đổi.
- Public summaries có sourceFingerprint463499df18a5cd84ae9ac512a3d40404fed5e74009dfa5a21c168005cfdafe61, lock85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18. Lưu safe JSON tại `artifacts/project-ci-completion/diagnostic02/backend-39094768210.json`; không lưu/công bố raw private logs.
- Hai runner đã terminal, không có local heavyruntime mới. Windows checkpoint: C202835611648Bfree/D99562901504Bfree; không cài/xóa dữ liệu.

## DEC-COMP-02 — giữ bằng chứng fullgate, 18/10/2026

- Trạng thái: **đã chấp nhận**. Owner chọn “Giữ gói mã hóa trên D, giải mã/replay tại thư mục private trên C theo guard hiện có (Khuyến nghị)”. Ciphertext được giữ trênD; plaintext/replay chỉ dưới `LOCALAPPDATA/pos-cafe-release`, ACL current-user+SYSTEM theo guard. Không tự nới allowedroot sangD.
- Quyết định xác định đích và privacy; không tự cấp quyền upload dump lịch sử, công khai raw evidence, thay billing, tạo WSL/Docker, hoặc giảm bằng chứng/gate. Ưu tiên input tổng hợp mới từ trackedsource; chưa chứng minh backup lịch sử không có dữ liệu thật nên chưa vận chuyển.
- Gói tối thiểu cần exact source/spec bytes, full execution/discovery/options/attestations và hai graph HP1 với transitive refs để replay. Safe Job Summary không đủ. Kích thước tổng/resource upperbound và phương thức vận chuyển còn phải chốt trước fullrun; không nhận package56 lịch sử4,327GB là minimum hoặc hứa gói mới dưới1GB. Nếu vượt cap vận hành thì dừng, không truncate.
- Đang khảo sát dùng GPG sẵn ở `D:/Git/usr/bin/gpg.exe` để tránh cài trùng; chưa tạo key/config, upload, giữ asset hoặc đổi billing. Actions artifact account allowance/usage vẫn UNKNOWN; draftrelease có giới hạn/quyền/lifecycle riêng, chưa chọn mặc định.

## Candidate fixture03 — khôi phục đủ privilege PostgreSQL17

- Root và hai investigator đối chiếu [PostgreSQL17 information_schema source](https://raw.githubusercontent.com/postgres/postgres/REL_17_STABLE/src/backend/catalog/information_schema.sql): table_privileges lọc7privileges, bỏ MAINTAIN; role_table_grants đọc view này. [Privileges17](https://www.postgresql.org/docs/17/ddl-priv.html) định nghĩa ALLTABLE gồm MAINTAIN. Đây là lỗi thật trong snapshot, chưa phải actualreadback khẳng định baseline của run39094768210 chứa quyền đó.
- `tests/contracts/permissionIdentityFixture.ts` trước sửa: employeeAcl snapshot qua role_table_grants, sau đó REVOKEALL3approles, cleanup chỉ grant lại snapshot. Migration016 dòng203 giữ service_role; vì thế baseline service_role.MAINTAIN là giả thuyết có căn cứ cho relationACL-onlydrift. observedGrants hiện không đo service_role/MAINTAIN/grantoption/grantor/order nên mask8khônglệch không phủ định giả thuyết.
- Candidate chỉ đổi employee table snapshot sang pg_class/aclexplode(coalesce(relacl,acldefault)), cùng3roles và đúngemployees; lưu is_grantable, restore WITHGRANTOPTION chỉ nếu baseline true. Không GRANTALL/hardcodeMAINTAIN, sửa inventoryhash hoặc nới acceptance. Grantor/order residual vẫn được stricthash phát hiện, chưa thay bằng genericACLrebuild.
- Thêm Node regression chạy chính đoạn capture/restore trong VM với catalog8privileges, MAINTAIN và SELECTgrantoption; mô phỏng view17 bỏ MAINTAIN để bản cũ không đạt. Đây là unitmodel theo tài liệu chính thức, không giả PostgreSQL đã chạy thật. Toàn bộ111NodePASS/0fail/0skip, diff-checkexit0, không cài mới. Actual lightCI→backend samefinalSHA còn cần review và chạy mới.
- Candidate cần SEC/correctness APPROVE exactsnapshot trước commit/push. Nếu backend vẫnFAIL sẽ giữFAIL và chẩn đoán tiếp phần còn lại; không normalize relationACL để lấyPASS.

## Công bố fixture03

- Frozenmanifest `3c62a25952977bec39e2298d64f6386c68ecde86f475c2ead0198744474b880d` tại `artifacts/project-ci-completion/fixture03/manifest.json`, baseline708f956, đúng2codepaths+taskdoc. `/root/status_independent_review` APPROVE correctness/evidence; `/root/ci_config_investigation` APPROVE SEC/privacy/resource. Hai reviewer độc lập kiểm111NodePASS, hashes/live/snapshot vàdiffcheck. Metadata tại reviews.json; không dùng approvaldiagnostic02 thay03.
- Đã commit/push `c898d7602d83e1e6d444e0c22259bd141bef85a4`, đúng2files/37insertions/2deletions; CIworktree sạch. [LightCI39095564040](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39095564040), job117581169826 đang chạy, chưa nhậnPASS. Chỉ dispatchbackend sau lightterminal và sourcehead readback.
- Estimate tiếp tục theo batch trước: **LỚN HƠN1GB**, backenddownload2,3–3GB, filesystem18GiB/taskguard20GiB/reserve30GiB trên GitHubhosted, tuần tự. Không Windowsinstall. Checkpoint C202752798720Bfree/D99562749952Bfree. Không xóa dữ liệu.

## Fullgate preparation — thứ tự và giới hạn còn thiếu

- Chuỗi dự kiến cùngsource/lock/spec, không chạy heavyprofiles song song: light/static + typecheckonboard/canary → PINonboard/identity/canary/focused → PERMT01(nativePG16)/T02 → toànT04candidate trong mộtbackend → HP1hai graph/replay → IDEM087dedicatedlegacyAuth/REST → strictPIN/PERMaggregate/preservation/stop/evidenceverification → hai exactfinalreviews. Đây là recipe đang port, chưa là workflow thực thi hoặc gatePASS.
- Nguồn commandmap cũ ngoàiGit: `artifacts/permission-hosted-hp1-gates-source57-20261014/run-final-gates.py`, `remaining-gates.py`; các wrappers/aliases/templates/browser/PG16 cần đưa về recipe reviewed và exactpin, không dùng runtime/receipt nguồn57 làmPASSsource mới.
- Budget thiết kế đang xét: loop18GiB, **globalciphertext≤256MiB toànlượt**, plaintextreplay≤256MiB, ngoài-loop≤1GiB, margin0,5GiB. Đây chưa là quota/guard đã triển khai và chưa chứng minh fullT04/HP1fit hoặc timeout đủ. Nếu cần vượt cap thì dừng, không bỏ refs/giảmcoverage.
- Pilot20GiB taskBytes chủ yếu preallocatefreecheck; supervisor giữreserve30GiB, không là totaloutsidequota. Ngoài-loop còn checkout/setup-node/toolcache, action/runnerlogs, control/status/safeexport và transfertemp. Port phải bound/đo những writer này; không gọi18GiBloop là quota toànjob. Browser/PGdata/HP1clone/privateproof phải chứng minh cùngloop.
- Retention dự kiến dùngGPG có sẵn, chỉ publicrecipient pin trênCI và privatekeyC, completeinventory≤4096members; membertotal/archive/cipher mỗi≤256MiB và globalcipher≤256MiB. TrênD downloadZIP+cipher transient≤514MiB; trênC staging/extract dự trù1GiB, phải protectedownedchild, không giả baseCroot đã private. GPGexit/auth/hash/source/graphclosure phải đạt trước replay, partialoutput không được nhận.
- Actions artifact là public-access ciphertext trong publicrepo, không phải privateartifact. Tổngcap256MiB/retention1day vẫn chưa bảo đảm0phí khi accountpooledquota/overageUNKNOWN. Alternative draftrelease cần exactsource-tag/contentspermission/lifecycle review; chưa chọn/chưa tạo/uploadasset. Không dùng targetmain để giả sourcebinding.

## DEC-COMP-03/04 — transport và khóa, 18/10/2026

- DEC03: owner chọn “Actions artifact; tôi sẽ xác nhận quota miễn phí và chặn phí vượt mức trước khi upload”. Đã chọn transport ciphertext, retention1day/globalcap256MiB; **chưa nhận đây là xác nhận quota/overage thực tế**. Upload vẫn chặn đến khi có xác nhận hoặc readback phù hợp, không tự đổi billing/plan/giới hạn chi tiêu.
- DEC04: owner chọn “Khóa không mật khẩu, chỉ bảo vệ bằng ACL private C để replay tự động; mất khóa trên C sẽ không giải mã được gói”. Dedicated GPGkey không passphrase được giữ trong ownedprotectedchild dưới privateCguard; CI chỉ publicrecipient. Đây là quyết định keycustody/recovery đã chấp nhận, không hỏi lại passphrase/backupD và không tự xuất privatekey lênD/CI.
- Được chuẩn bị/review helper seal/open độc lập, không upload/keygen trước candidate review. DùngGPG sẵn; helper không tự cài, tạoWSL, thayACLrootchung hoặc tạokey. Tool/hash/version/publicrecipient/source/binding phải pin; không rawplaintextD, không bỏref đểvừacap.
- Reviewer điều tra tìm được tiền lệ trực tiếp ở `docs/implementation-log/permission-hosted-hp1-2026-10-14.md` dòng67: diagnostic04 cũ ghi freshPG17 service_role.MAINTAIN/employees và information_schema cleanup bỏ quyền, source55 dùng establishedACL ở syntheticsetup. Đây là lịch sử hỗ trợ giả thuyết03, không thay runtimePASS mới.

## DEC-COMP-05 — chưa cho phép metadata scope79 lên CI

- Owner trả lời: “Chưa cho phép; dừng phần HP1 phụ thuộc file này để rà lại chính sách đầu vào”. Đã dừng đúng phần HP1 phụ thuộc, không upload/Actionssecret, không chạy HP1 hoặc sửa/bỏ pin362883 để né quyết định. Không dừng những phần fixture backend/mã hóa độc lập.
- File scope79 là23.508B metadata private gắn hosted, không phải dump giao dịch nhưng vẫn cần quyền riêng. Giữ nguyên source/bytes private, không đọc thêm payload theo task sau quyết định.
- [Đề xuất chính sách cụ thể](project-ci-cd-hp1-input-policy-2026-10-18.md) tách profile LOCAL với scope tổng hợp sinh mới và kiểm actual sets, giữ hosted/v2 fixedpin, release preconnect refusal và toàn bộ gates. Đây là đề xuất cần review và owner duyệt, chưa là quyền triển khai.

## Actual fixture03 — light terminal, backend đang chạy

- [LightCI39095564040](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39095564040) SUCCESS, 11phases PASS, sourcePreserved=true, exactsourcec898d76. SafeJSON tại `artifacts/project-ci-completion/fixture03/ci-39095564040.json`.
- Sau terminal/source/remoteheadreadback, dispatch [backend39096247811](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39096247811) cùngSHA. Đangin_progress tại checkpoint; chưa nhậnPASS/rootcause duy nhất. Windows C202795732992Bfree/D99562426368Bfree, không cài/xóa dữ liệu.
- Helper mã hóa do subagent hiện thực đúng2file mới, chưa commit/keygen/upload. Parent chuẩn bị `scripts/setup-ci-proof-key.ps1`: mặc địnhPlan/noeffects, Create chỉ sau exactreview, pinGPG2.4.9/hash, tạo riêng Cchild/keyring ACLuser+SYSTEM, không privatekeyexport. Plan/syntaxPASS và xác minh keyroot/publicoutput chưa tồn tại; chưa có key thực.

## Review đề xuất input-policy HP1

- Proposal01 SHA6d3e64fea79190a11f424238bc716ae13c2eb8afe9003e0b2702d1226ab65b68: EVCAPPROVE nhưng SECCHANGES_REQUESTED/SEC-HP1-POL-01. Claim mọi release/rehearsal preconnectguard quá rộng: legacy-inflight tạoClient/connect/bootstrap trước runReleaseCutover. Không dùng approval01 để trình proposal còn lỗi.
- Proposal02 SHAbe0b6cc5ec9d6b4d4df74d26eea94f527b330a0736e202f6ef9986c5482f6166 sửa hiện trạng và yêu cầu admissionLOCAL trướcClient/connect/bootstrap cho legacyentrypoint cùng negative test. `/root/status_independent_review` EVCAPPROVE, `/root/hp1_policy_security_review` SECAPPROVE đúng02; finding01CLOSED. Scopechỉ trìnhlựachọnchínhsách, không cấpquyềntriểnkhai/upload/chạyHP1/merge.
- Đã hỏi owner duyệt hướngLOCAL riêng hay giữcontractvàtiếptụcchặn. Chưa có câu trả lời tại checkpoint, phần HP1/policyimplementation phụ thuộc vẫn dừng. Không tạo credential/secret hoặc coi quyết định giữciphertext là quyền đổi contract.

## Steering owner — HP1 tối thiểu và backend pilot đã PASS

- Owner trả lời nghiêng phương án1 nhưng nhắc sự cốHP1 nghiêm trọng trước đây và yêu cầu xử lý tối thiểu để dành thời gian phần khác. Tiếp tục theo hướng LOCAL riêng với phạm vi nhỏ: chỉ inputscope/guard cần thiết, dùng lại checkers/gates, không đại tu nền tảng HP1 hay tạo lại labWindows. Nếu cần mở rộng/tái cấu trúc lớn phải dừng trình lại. Không diễn giải thành quyền giảm gate/đưa metadata lịch sử lên CI.
- [Backend39096247811](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39096247811) đã SUCCESS trên c898d76, job117583200330; bootstrap/Auth/API/sourcepreservation/cleanup đềuPASS, coreRestored=true. T09=1/1 vàT10=3/3, totals4PASS/0fail/0skip. SourceFingerprinta3a04afbb61914130d70b2692906a24a9c62805999150e94f1475403208c9c11; lock85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18. SafeJSON tại `artifacts/project-ci-completion/fixture03/backend-39096247811.json`. Đây là CI1pilotPASS, không fullpermissiongate/HP1/merge/deployPASS.
- Key-setup01 manifest0139aac2e156f9aec9d8c48227921b18ab24fc6782b90815d3bb94762229dc85: SECAPPROVE, EVCCHANGES_REQUESTED vì lệnhversion/list/export cũng ghi stdin có thểbrokenpipe và đểprocess/partialstate. Sửa02 chỉ gửi newline khi passphrase-fd, finally thu hồi invocation nếu lỗi trướcWaitForExit; chưakeygen, cần exact02reviews.
- Helper2file đã hiện thực,130NodePASS (19mới), chưa realGPG/WindowsFD3/ACLroundtrip và chưa commit. Việc đóng gói/mã hóa không tự chứng minh fullclosure/gatePASS; không upload khi quota chưa xác nhận.

## Key setup02 actual — fail trước tạo khóa; candidate03

- Sau hai exact02APPROVE đã chạy Create; dừng vớiPROOF_KEY_GPG_FAILED. Postcheck chỉ có ownedCroot vàhai thư mụcgpg/temp rỗng, logicalfilebytes0/privatekeycount0, ACLprotected. PublicDoutput chưa tạo, không có gpg-agent được thấy; không upload/install/delete/retrykeygen.
- Probe metadata-only trên emptyhome chứng minh GPG2.4.9 của Git làMSYS: nativeC:\\ path bị coi relative dưới /d/Workspace/pos-cafe-ci, không mở keyring; version vẫnexit0 nên versioncheck không phát hiện. Không cóprivatekey/businessinput được đọc trong probe. cygpath có sẵn xác nhận mapping/c/Users/…; chưa tải công cụ.
- Candidate03 chỉ thêm mapper nativeC/D→MSYSCLI/env, giữ nativepaths choWindowsACL/filesystem và pinbinaryhash. ResumeEmpty chỉ cho chính rootprivate đã biết với đúng2childgpg/temp hoàn toànrỗng, đúngowner/protected2SIDACL, khônglink/extrafile/overwrite/resetACL. Nếu cókeyring/key/file thì từchối, không tựxóa state.
- Plan-ResumeEmpty vàsyntax đãPASS/noeffects; actualresume cần hai exact03reviews. GPGhelper cũng được author bổ sungpathStyle/msysmapping; realFD3compatibility chưa chứng minh. Budgetgiữ0download/≤1MiBestimate, chưa làquota kỹthuật.

## Key setup03a actual — cert tạo được, dừng ở ACL API; candidate04

-03 có stale manifest field keyRootExists=false, hai reviewer yêu cầu sửa metadata; immutable03a SHA1c5811822403a360b10926370a0d6d155fc64679b4c21700299ceff5afd8ae2e sửa đúngroottrue/twoemptydirs/files0. SEC/EVC đềuAPPROVE03a trước actualResumeEmptyCreate.
-03a chạy thật đã tạo1cert-onlyprimary, chưa cóencryption subkey/publicDoutput. Dừng ở PROOF_KEY_SETUP_FAILED; điều tra ACL idempotent chứng minh Set-Acl yêu cầu SeSecurityPrivilege với một sốMSYS-createdfiles. Không xin/nâng privilege. Postcheck actual:5directories/9files/3537B logical, tất cả owner/protected2SIDuser+SYSTEM; privateC custody vẫn đạt, chưa phải packagekey hoàn chỉnh.
- Publicmetadata-only xác nhận đúng1primary/0subkey, UIDdedicatedđúng, fingerprint6383B59C2BE449F9E5AAD9F4A4A47689A32B4B6D. Không đọc/exportprivatekeypayload, không tái tạo primary. GPGagent riêng PID10920 hiện từlượt này, sẽ dừng đúnghomedir khi khôngcần; không coi dừngagent làcleanupdisk.
- Candidate04 dùng FileSystemAclExtensions.SetAccessControl để chỉ áp owner/DACL như nativeguard có sẵn, không chạm SACL. Đã kiểm idempotent trên chính publickeyring:PASS/không cần extrapropilege. ResumePrimary chỉ nhận ownedprivate treewhitelist và đúng1key, expectedprimaryfingerprint+UID+1pub/0sub được kiểm trước add-encryption; không tạo lạiprimary, overwrite hoặcxóa. Plan/syntaxPASS; actualresume cần hai exact04reviews.
- C vẫntrống>202GB/D>99GB; taskkeylogical3537B, chưa đoallocated riêng; budget≤1MiBestimate/0download giữ nguyên. Không fullHP1/WSL/Docker/runtime mới hoặc upload.

## Giảm phạm vi phát sinh theo steering owner

Audit độc lập `/root/hp1_policy_security_review` đối chiếu PERMT15/T16, HP1task21–23 và CIsetupDEC02: IDEM087 đã phân tuyến manual/NOT_RUN, không được tự đóng nhưng chưa là gate riêng bắt buộc để merge phân quyền. Bỏ việc dựng runtime087 mới khỏi recipe dự kiến18/10; giữ nguyên status/routing/acceptance củachangeidempotency. Không bỏ legacyT01/T02/PIN19/PERM60/HP1 hoặc dùng chứng cứ cũ thay nguồn mới.

[Policyproposal](project-ci-cd-hp1-input-policy-2026-10-18.md) có supplement khoanh tối thiểu12pathsHP1 nội bộ, tận dụng harness/currentinventory, không framework/runtime mới; draft cũ nguyên lịch sử, chưa thay bằng implementationPASS. Nếu vượt ranh giới này, dừng báo owner trước mở rộng.

## DEC-COMP-06 — tách CI/CD khỏi bản phân quyền, 18/10/2026

- **Đã chấp nhận, hiện hành.** Nguồn quyền là câu trả lời mới của owner trong chat đang thực hiện: “Tách CI/CD để hoàn tất sớm; bản phân quyền tiếp tục chờ đủ gate”. Quyết định này thay điều kiện hoàn tất fullgate phân quyền rồi merge chung trong DEC-COMP-01. Không đổi acceptance, nhận gate thiếu thành PASS hoặc cấp quyền deploy.
- Nguồn cho CI/CD riêng: main `f9c566999c4367a5ca54a879fe3b06b5870f26f2`; isolated checkout `D:/Workspace/pos-cafe-ci-main`, nhánh `ci/main-pipeline-20261018`, sạch tại readback khởi tạo. Port phải được kiểm trên candidate CI-only kế thừa nền main này và review exact candidate trước bước tích hợp. Hiện chưa port xong, chưa có full CI trên source mới, chưa merge main hoặc CD thực.
- Nhánh `ci/project-pipeline-20261017` tại `D:/Workspace/pos-cafe-ci` giữ commit `c898d7602d83e1e6d444e0c22259bd141bef85a4`, các receipt CI/backend và HP1 WIP chưa commit. Không merge source phân quyền/SQL hoặc WIP vào CI-only checkout. Bản phân quyền tiếp tục chờ full gate và review đúng nguồn của nó; pilot4/4 không thay PIN19/PERM60/HP1. IDEM087 giữ manual route/NOT_RUN, không dựng runtime mới từ quyết định này.
- Điều phối đã thu hẹp: dừng các phần subagent fullrunner/HP1 và GPG smoke; giữ code, proposal, snapshots và evidence để bàn giao. Không tiếp tục cấp phát môi trường, cài công cụ hoặc chạy các phần đó nhằm hoàn tất task CI-only. Không reset/stash/clean/xóa dữ liệu đã giữ.
- Utility `proof-package02` được SEC `/root/ci_docs_evidence` và EVC `/root/status_independent_review` APPROVE exact manifest SHA `52fce0103ec5a69cd89c4df19b4af1691ebc7326f66da924f6420213403f1dc7`, có133NodePASS. Actual Windows/MSYS GPG roundtrip vẫn **NOT_RUN**, FD3 chưa được chứng minh; collector/full-proof closure/global retention ledger chưa hoàn tất. Đây là code/unit/review checkpoint, không phải utility hoàn tất hoặc fullgate PASS; không chạy smoke tiếp theo trong scope mới.
- Key setup04 đã actual exit0 sau hai exact reviews. Private key giữ tại `C:/Users/nguye/AppData/Local/pos-cafe-release/ci-proof-key-20261018`; primary `6383B59C2BE449F9E5AAD9F4A4A47689A32B4B6D`, encryption subkey `096A830D7CE2A0535717E942922DE36C1F80EE4F`. SEC metadata-only checkpoint:5dirs/11files/2private-key files,53.775B logical, owner hiện tại+SYSTEM/protected ACL. Public recipient tại `D:/Workspace/pos-cafe-ci/artifacts/project-ci-completion/key-material01`: ASC660B/JSON463B, ASC SHA256 `bd8246c1a9fc4df208dacd84e2adadeb6d29c613fbd9c49853dd7ffe59f8bdb7`. Giữ nguyên, không private export/upload hoặc xóa; các số trên là checkpoint đo, không claim quota kỹ thuật hay allocated bytes.
- Billing chỉ được khảo sát đọc: repository public, danh sách artifact trả0artifact/0bytes; `user.plan=null` và GET billing đã thử trả404. Các kết quả này không xác minh account allowance, pooled usage hoặc hard stop. Không đổi billing/plan/budget/payment, không upload artifact. Tài liệu chính thức phân biệt [Actions runner và artifact storage billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [mức sử dụng theo plan](https://docs.github.com/en/enterprise-cloud%40latest/billing/reference/product-usage-included) và [budget có tùy chọn chặn usage](https://docs.github.com/en/billing/how-tos/set-up-budgets); public standard runner miễn phí không chứng minh artifact allowance hoặc cơ chế chặn phí của account đã được xác minh.
- Bước tiếp theo chỉ trong CI-only: candidate port tối thiểu đã có43NodePASS/15canonical pins PASS, chờ hai review và actual cloudCI trước tích hợp. CD đã được chọn Preview theo DEC-COMP-07, chưa triển khai; cần đường xác thực và current target/mock readback. No WSL/Docker Desktop mới; task20GiB/reserve30GiB và một heavy environment giữ nguyên.

## DEC-COMP-07 — kiểm CD bằng Vercel Preview, 18/10/2026

Owner trả lời “Dùng Vercel Preview”. Đây là quyền chuẩn bị và chạy frontend Preview trên source đã CI/review trong phạm vi CI/CD tách riêng; production giữ khóa và không đổi quyền DB/Edge/hosted. Chưa có credential Vercel trong các vị trí thông thường đã kiểm, không connector/session trình duyệt dùng được. GitHub repo và environment Preview đều0secret tại readback; không suy ra token không tồn tại ở mọi nơi. Chưa current project/system-env/protection readback hoặc deployment thực. Cần chuẩn bị route xác thực và Preview build ép mock; không gửi token qua chat, không tự export credential cá nhân sang GitHub.

## Chuẩn bị credential Preview qua UI — 18/10/2026

Owner hỏi “tôi tưởng đã có rồi? nếu chưa thì tạo giúp tôi hoặc thao tác giúp tôi tới bước tạo token”. Đã kiểm metadata GitHub repository và environment Preview: đều0secret, không đọc giá trị token nào. Browser Vercel có phiên Dashboard đăng nhập; không coi Dashboard session là Actions secret.

Đã mở form tạo token tại https://vercel.com/account/settings/tokens, điền `pos-cafe-preview-20261018`, chọn team rồi riêng project `pos-cafe` (scope hẹp hơn team đã đề xuất), expiration1Day/19Oct. Dừng trước Create, chưa tạo token. Mở tiếp GitHub Preview16790483292/Add environment secret, điền Name=VERCEL_TOKEN, Value để trống; owner có thể tạo/copy/dán/Add secret trực tiếp. Không xuất credential ra local/chat. Ảnh biểu mẫu không chứa secret ở ignored artifacts/preview01/token-form.jpg và github-secret-form.jpg trên worktree Preview, chỉ để hướng dẫn. Không chụp/đọc lại trang khi owner đang có token trên màn hình.

Token1ngày cần tạo/lưu mới khi chạy manual Preview sau ngày hết hạn; không nhận đây là credential vận hành dài hạn đã provision xong. Actual Vercel auth/project readback/POST vẫn NOT_RUN. Hai tab được giữ làm output cho owner, không dùng Playwright MCP server.
## Review và cách vận hành sau mốc CI trên main

| Candidate | Reviewer/phạm vi | Verdict và giới hạn |
| --- | --- | --- |
| CI-main04a, manifest0A09850B… | status_independent_review/EVC; hp1_policy_security_review/SEC | Cả hai APPROVE exact recipes/code/docs. Main policy chỉ áp sau hai approvals; PR đỏ bị BLOCKED, sau exactgreen merge thường. Main10e actual CI39100947815 PASS là evidence sau merge, không nâng permission gate. |
| Preview01, manifestCFFAD0A8…; local638ee/tree7c7903 | status_independent_review/EVC; hp1_policy_security_review/SEC | Cả hai CHANGES_REQUESTED, chỉ offline/unit; hai findings routing nêu ở checkpoint đã tái hiện độc lập. Không publish/deploy01. |
| Preview02, local691b0d4/treea67dc355, manifest34C945E4… | status_independent_review/EVC; hp1_policy_security_review/SEC | Cả hai APPROVE exact candidate. EVC fresh63NodePASS, SEC17PreviewPASS;13snapshots/18canonicalpins khớp; counterexamples01 đã đóng. Approval publish5files → exactpush/PR/mainCI → Preview theoDEC07 khi credential/guards hợp lệ. Không production/fullpermission/runtimePASS. |

CI dùng lại tự động cho push nhánh code và PR. Required check trên main yêu cầu PR và candidate cập nhật; sửa code thường không cần dựng pipeline lại. Khi thay package/lock, workflow/checker/config đã pin hoặc thêm gate/backend feature, phải cập nhật canonical trusted pins và kiểm đúng profile/source; không nhận default9phase là full permission acceptance.

Vận hành Preview sau khi source hiện hành có main push CI PASS: mở workflow Frontend Preview (manual), chọn main và nhập đúng source_sha, ci_run_id, ci_attempt=attempt thành công. Environment Preview giữ owner gate/main-only. Chỉ READY với source/target/routing/protection đã kiểm mới là deployment PASS; HTTP401/redirect và applicationSmoke NOT_RUN phải báo riêng. Lần đầu owner đã cho chuẩn bị và chạy theo DEC07; operator approval ghi acting-on-behalf. Những lần hoặc scope khác cần dùng quyền thực tế còn hiệu lực, không lấy handoff làm quyền mới. Token1Day hết hạn thì owner lưu token mới; workflow không đọc/export token về máy. Production enable=false và DB/Edge tách riêng.

Walkthrough đã được cung cấp dưới dạng đường đọc: CI workflow → launcher/controller → parser/evidence → requiredcheck; Preview workflow → source/CI/pins → mock build guard → một POST Preview → READY/routing/protection. Chưa nhận owner đã đọc hoặc hoàn thành walkthrough tương tác.
## Readback trước publish Preview02

UI Vercel read-only xác minh project/team hiện hành: connected repo nguyentronglinh045/pos-cafe,0deployhooks, globalIgnoredBuildStep=Don’t build anything/exit0, Preview BranchTrackingOFF, Enable access to System Environment VariablesON, Node24.x và on-demand concurrentbuildsOFF. Không sửa settings/đọc env values. Receipt nhỏ `D:/Workspace/pos-cafe-ci-main/artifacts/preview02/provider-ui-readback.json`; tab kiểm tra đã đóng. Cấu hình source git.deploymentEnabled=false tiếp tục giữ. Authenticated REST snapshot trong deployment vẫn chưa chạy và sẽ là bằng chứng tách biệt, UI không thay proof POST/poll.

Owner đã tự lưu secret; GET metadata Previewcount1/hasVercelToken=true. Hai form UI là hướng dẫn đã hoàn thành, không tạo credential thay owner hoặc ghi token ra chat/máy. Cleanup question đang chờ: chỉ372temp roots synthetic đúngmanifest18Oct/~9,16MiBlogical ở artifacts/preview02/temp-inventory.json, allocated unknown; chưa xóa.208roots17Oct bị loại khỏi phạm vi, không coi là temp của lượt này.
## Actual PR5 merge

PR5 head691b0d4/base10e0348 có exact push/PR SUCCESS; statusCLEAN trước merge. Merge thường, không adminbypass, thành536d8f6497403ace1193af4586a89b4862c730fd. API Gitcommit xác minh orderedparents[10e0348,691b0d4] và treea67dc355 byte-identical candidate02; PR testmergefe5792eb7f6ce4160aef03216943d19145a16912 cũng cùng tree. EVC tự đối chiếu hai safe receipts, refs/tree và currentmain/Preview/Production protections/secret metadata: factual checkPASS, chưa actualCDPASS. MainCI39101826725 cần terminal trước dispatch. Original dirty worktree D:/Workspace/pos-cafe không pull/reset/stage.
## Actual closeout — 18/10/2026, trước final review

- Current remote main `536d8f6497403ace1193af4586a89b4862c730fd`, treea67dc355; PR4 và PR5 merge thường, không bypass. Original dirty workspace giữ nguyên, không pull/reset/stage. Isolated worktree Preview còn branch691b0d4 cùng tree; source identity của execution là main536d8.
- [Main CI39101826725](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39101826725), attempt1, source536d8: 9/9phasePASS; 637/637unit,36toolingPASS+1exactbackend-onlymanualDeferred,63/63Node, preflight1/1, smoke35PASS+31declaredapplicabilityskip/66. sourcePreserved=true, peakOwned997.208.064B; operatingcap5GiB vẫn là monitored cap, không hardquota. Safe receipt artifacts/preview02/main-39101826725.json.
- [Frontend Preview39102130352](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39102130352), attempt1, source536d8/CI39101826725attempt1: thực sự WAITING requiredreviewer trước secret use. Operator duyệt qua pending_deployments API, acting-on-behalf theo quyền owner DEC07; không admin bypass hoặc nhận owner đã đọc source. GitHub deployment7150627531/environmentPreview và approval payload/readback ở artifacts/preview02/environment-approval*.json.
- CD job hoàn tất SUCCESS 05:55:11UTC. Safe stages đủSOURCE/CI/FILES/PRODUCTION_GUARD/PREVIEW_GUARD/PROJECT/CREATE/POLL/RECHECK/COMPLETE. Controller gửi một POST Git-source Preview, poll đúngID và kiểm explicit target:null, project/source536d8/READY, live main đúng, production routing và6fieldprotection observed không đổi. Deployment `dpl_EsvP4kTkNG6JoKva2yNT523epBjr`; receipt artifacts/preview02/deploy-39102130352.json, stages deploy-stages.json. Không gọi production promote/alias/settings hoặc DB/Edge.
- Preview URL: https://pos-cafe-kgnrohp1y-24tx810010-hcmutes-projects.vercel.app . HTTP headers-only khôngauth302 với redirectHostvercel.com; không bypass. Browser dùng phiên Vercel đã đăng nhập mở được trang titlePOS Cafe, headingPOS quán cà phê và hai nútĐã có quán/Tạo quán mới. Landing renderedPASS, chưa ghép store/đăng nhập PIN/thực hiện nghiệp vụ trên URL này. Controller applicationSmoke=NOT_RUN vẫn đúng; CI mocksmoke35PASS không biến thành Preview businesssmokePASS. browser-check.json/http-check.json và preview-landing.jpg lưu riêng, tab Preview giữ làm output cho owner.
- Production routing digest `04e3195f471411e76b816a4a8350caeb500f78ee6fbe921d244aaa8a42704f2c`;6fieldprotection digest `f886f296a37858e2cba766fa278b3fcc3f24bc68a4b649371309fa9365093288`. Chỉ hash/booleans công bố, không raw project response/bypass values. Final GitHub readback main/requiredchecks/Preview+Production protections/secret presence ở final-github-state.json, không có token. Chưa đổi mọi provider protection field ngoài sáu field thành claim đã audit toàn bộ provider.
- Windows checkpoint C202.153.598.976B/D99.426.013.184Bfree; không cài npm/browser/SDK/WSL/Docker local. Không upload Actions artifact hoặc đổi billing. Cleanup372temp roots/~9,16MiBlogical còn chờ owner; chưa xóa và không gồm evidence/key/WIP/208roots17Oct. Node reviewer reruns có thể sinh thêm temp ngoài manifest; không mở rộng scope xóa ngầm.
- Phạm vi kỹ thuật đã đạt: auto light CI trên currentmain + required check + protected manual mockfrontendPreview với actual READY/URL landing. Production release, DB/Edge, full backend/PIN/PERM/HP1, nhánh phân quyền c898, utility/GPG smoke và billing artifactquota/hardstop giữ trạng thái riêng chưa hoàn tất/hoãn theo DEC06. Không lấy mốc CI/CD này làm approval merge phân quyền.
- Walkthrough đã cung cấp đường đọc và cách vận hành trong chat/hồ sơ; owner chưa xác nhận hoàn thành walkthrough hoặc nghiệm thu. Tài liệu hiện ở worktree docs chưa commit/push, có nhiều thay đổi khác có trước; không stage/publish toàn README có169dòng thay đổi ngoài task chưa stage. Final candidate sẽ freeze đúng8docs+5code+safe evidence và cần EVC/SEC APPROVE actualclaims trước bàn giao hoàn tất trong scope đã chọn.
## Metadata final review và bàn giao — 18/10/2026

Final candidate `ci-cd-closeout02`, manifest SHA256 `D068C52F0F16FC7075AB50FC27CC9C63C180AA13C70211DFD5E3D638CDBBA329`, tại `D:/Workspace/pos-cafe-ci-main/artifacts/ci-cd-closeout02/manifest.json`:28snapshots/code+docs+safeevidence, executionmain536d8/treea67dc355, CI39101826725attempt1 và CD39102130352attempt1. Gói01 có EVC APPROVE/SEC CHANGES_REQUESTED vì câu docs stale/ngoại lệ helper;02 sửa đúng4docs,24snapshots còn lại byte-identical, không thay code/test/evidence/deploy.

- `/root/status_independent_review` **APPROVE exact02**, EVC: verify28hash/bytes,4docsdelta, source/tree/run/attempt/counts/approvalhistory/screenshot/HTTP302 vs landing/businessNOT_RUN đã kiểm01 và carried; không blocker. Không rerun tests không đổi.
- `/root/hp1_policy_security_review` **SEC APPROVE exact02**: verify28hash/bytes/live8docs và24snapshots không đổi; câu stale/2linehelper đã đóng, sourceproof536d8/treea67 đúngcandidate đã review. Token/rawproviderresponse không trong evidence; acting-on-behalf đúng quyền; Production/fullpermission/HP1/GPG/billingupload/cleanup/docspublication boundaries giữ nguyên. Không blocker, không mutation/retest.

Trạng thái bàn giao: **HOÀN TẤT KỸ THUẬT trong scope auto light CI trên main + required check + protected manual mock Vercel Preview READY và authenticated landing render**. Không mở production, không merge phân quyền, không nhận Preview businessflows hoặc owner nghiệm thu/đọc code. Owner có thể xem URL/tab Preview đang mở; token ngắn hạn cần còn hiệu lực cho lần manual tiếp theo. Docs được cập nhật local trên worktree docs, chưa commit/push tại checkpoint này vì working tree/README có thay đổi ngoài task chưa stage; không công bố toàn index. Cleanup question372temp roots còn chờ, giữ nguyên. Metadata này chỉ ghi kết quả review sau freeze, không thay candidate/code/evidence/acceptance.