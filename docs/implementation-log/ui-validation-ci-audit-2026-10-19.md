# D7 — CI cho bộ đo UI và publish ui-audit, 19/10/2026

Trạng thái cuối của code: [PR#9](https://github.com/nguyentronglinh045/pos-cafe/pull/9) đã merge vào main2da0d7e, tree khớp candidate đã review; cả hai CI trước merge và CI trên main sau merge đều SUCCESS đủ12phase. Bộ đo/calibration đã kiểm trên checkout Linux sạch. Operational audit COMPLETE39/39 và findings được phân loại, không nhận thành nghiệm thu UI. Hồ sơ11Markdown được phát hành riêng qua [PR#10→docs](https://github.com/nguyentronglinh045/pos-cafe/pull/10); kết quả merge/readback chính hồ sơ này xem metadata PR sau thực thi. Các checkpoint bên dưới giữ đúng lịch sử từng source, không thay kết quả cuối.

## Phạm vi được giao

Chủ dự án yêu cầu làm nốt CI và publish ui-audit, kiểm kỹ rồi push/merge code vào main, hồ sơ vào docs như task trước. Pilot màn remake thật để task riêng. [Quyết định D7 và spec](../../openspec/changes/add-stitch-ui-remake-workflow/proposal.md), [requirements SUI09–10](../../openspec/changes/add-stitch-ui-remake-workflow/specs/stitch-ui-remake/spec.md), [testplan T17–23](../../openspec/changes/add-stitch-ui-remake-workflow/testplan.md).

Tái dùng hai worktree sạch với branch mới `workflow/ui-validation-ci` từ mainfc7d454 và `workflow/ui-validation-ci-docs` từ docs81e1f99; không stage/push WIP app/phân quyền hoặc15commit docs ở checkout gốc. Local source app không thay đổi; không deploy, DB/backend thật, updatebaseline hay remake màn.

## Thay đổi và nguồn

- POS light CI9→12phase: ui-tools Node tests + remake selftest + audit selftest sau browser. Strict reader riêng kiểm inventory, nguồn/config/ref/contract/font/runtime mới và images; không nhận stdoutOK/exit0 là đủ. Public summary vẫn chỉ counts/hashes/codes hữu hạn.
- Chromium full channel thay default headless-shell, khớp browser hiện cài --no-shell. Channel được gắn vào contract và environment; approval cũ phải replan/duyệt lại, không cập nhật ngầm.
- Publish ui-audit detector/runner/config/calibration/docs và tests. Giữ13state có counterpart trên main×3viewport=39; bỏ khỏi gói main ba state và hai HTML import unpublished permissioncomponents, không copy app WIP.
- Detector raw SHA256 `cb775fb2b9ff0517d4fd9137870f9192457b1695ba9dda5858af57647ec9d7e6` giữ bytes của checkout nguồn hiện có; không nhận đó là detector nguyên bản của commit lịch sử. Baseline publish giữ 36 key và bytes CRLF checkout nguồn:7197bytes, SHA256 `79fe315c36c21db23a66724939b085e5ac4065d16780e2a0d26e1f9da5c87080`, Git blob `51633aa2aa0246e459276b97d53942e608542ae5`. Nguồn key là commit `d78c929c9ce6f6c09790bbfa4135b1cc47d0f1b1`; file Git lịch sử dùng LF:7160bytes, blob `2861d0ef1d0d556afb4508f4d5344ce8583171e1`, SHA256 `bf94db0428557376481f01a3cabea474c73eef156a95218ae09cbf960d4ffd42`. Hai baseline khác line ending nhưng cùng 36 key; không regenerate/nhận finding mới. Baseline là ledger lịch sử, không là bằng chứng đã sửa/nghiệm thu app mới.
- Siết exact23finding/14requiredclass/16effective-target controls. Khắc phục CLI/matrix0PASS, reportoverwrite/junction, tự dùng cổng đang có và cleanup khi lỗi. FailOnerror/warningsreport vẫn giữ đúng semantics.
- CI policy pin được cập nhật từ canonical Git blobs, chỉ runner/results/package/helper mới. Drift package.json có sẵn từ lần thêmaliasesui-remake trước; không refresh toàn bộ trustedfiles theo checkoutCRLF. Owner/protection/productionEnabled=false và các resourceguards giữ nguyên.

Nguồn kit ngoài chưa có URL/version/license được xác minh trong repo; giữ UPSTREAM-README như tài liệu lịch sử, không tự thêm license/attribution. Source trong lịch sử repo bắt đầu ở bccec3af9c1ea501dcbdf166deec6dd8d52e2941.

## Môi trường và ngân sách

Không cài package/browser mới trên máy. Tái dùng Playwright1.60.0 và Chromium148.0.7778.96 đã có; Node24.16.0. Vite8.2.1/Vitest4.1.10/TypeScript5.9.3 quan sát từ dependency đang cài; không gọi đó là clean npmci hoặc tự suy toàn bộ tree khớp lock.

Đã tạo view node_modules gồm262directoryjunctions tới package có sẵn, không copy package bytes; thư mụcnode_modules của worktree là physical để cacheVite mới nằm riêng trong task. Giữ một app mock devserver đang dùng, không WSL/Docker. Đầu ra dự kiến≤0,5GiB, peak dữ liệu local≤1GiB; đó là budget vận hành, không phải quotaOS. C≈182,5GiB/D≈92,24GiB trước chạy. CIhosted giữ cap5GiB task/reserve30GiB/RAM8GiB/3CPU/1024PID, không thêmbrowserthứhai.

## Checkpoint phát triển — chưa thay kết quả source cuối

Builder CI chạy107targeted Node tests PASS; builder audit chạy19tests PASS và selftestthật23/14/16. Đây là development slices chưa commit; chỉ dùng để hướng dẫn kiểm tích hợp. Chưa nhận các số này là PASS của finalsource. Fresh tests/calibration/39targetaudit, independentreviews, remoteCI/mergestatus được ghi sau freeze.

## Checkpoint kiểm thử trước review

Candidate trước review là `6f9cd7f9e6ec81b4a0411b46996a59bf2b4444d6` (base `fc7d454979f049dcdb266e1e42dde4bd056ce9ff`). Chạy mới trên worktree sạch nguồn, không dùng report phát triển làm PASS. Candidate này chưa được duyệt; các kết quả dưới không thay kiểm lại source sau sửa review:

| Kiểm tra | Kết quả | Bằng chứng local, tương đối với code checkout |
| --- | --- | --- |
| `node --test --test-reporter=tap scripts/project-ci-results.test.mjs scripts/project-ui-results.test.mjs scripts/project-preview.test.mjs` | 124/124 PASS, 0 fail/skip/cancel/todo | `artifacts/ui-audit/d7-verification/node-tests.log` |
| Inventory `uiTestInventory(git ls-files)` → Node test concurrency1, đủ 8 file UI | 96/96 PASS, 0 fail/skip/cancel/todo (77 remake +19 audit) | `artifacts/ui-audit/d7-verification/ui-tests.log` |
| `npm run ui-remake:selftest -- --out artifacts/ui-remake/d7-final-01` | 11/11 đối chứng đúng: 5 PASS, 6 lỗi cố ý bị phát hiện, 0 ERROR; exit0 | `artifacts/ui-remake/d7-final-01/report.json`, `.md`, 44 PNG |
| `npm run ui-audit:selftest -- --selftest-report artifacts/ui-audit/d7-final-01/selftest.json` | Đúng 23 findings, 14 lớp bắt buộc, 16/16 đối chứng; `selftest OK`, exit0 | `artifacts/ui-audit/d7-final-01/selftest.json` |

Hai report calibration cùng ghi source HEAD trên, Node v24.16.0, Windows 10.0.26300 x64, full Chromium channel `chromium` 148.0.7778.96 và Playwright1.60.0. Đã mở ảnh `minimum-reference.png` (568×320) và `detect-palette-diff.png` của lượt này: đối chứng tối thiểu hiển thị đủ, vùng đổi màu nút được đánh dấu. Đây là fixture kiểm bộ đo, không phải màn app hay nghiệm thu sản phẩm.

CI chọn test ở `scripts/project-ci.mjs:297`, chạy hai calibration ở dòng303 và309; reader kiểm provenance/artifact ở `scripts/project-ui-results.mjs:57`, `:114`, `:162`. Contract Chromium nằm ở `ui-remake/run.mjs:18`, launch thực ở dòng204. Selftest audit kiểm chính xác ở `ui-audit/run.mjs:244`; baseline app không được cập nhật.

`git diff fc7d454 --check` sạch trên candidate này. `.gitattributes` giữ nguyên bytes CRLF của detector/baseline, đồng thời mô tả đúng whitespace; lần kiểm trước khi thêm attributes có báo CR ở hai file lịch sử, không được ghi nhận là PASS. Policy được kiểm theo canonical Git blob; kiểm Linux sạch và CI đang chờ trước publication/merge.

## Findings trước publication và xử lý

Reviewer CI yêu cầu sửa candidate6f9: (F1) producer audit ghi OS đầy đủ nhưng reader chờ platform, nên calibration hợp lệ bị từ chối; (F2) reader không chặn `sourcePreserved:false` hoặc `errors` không rỗng/thiếu. Đã sửa context đọc OS audit chính xác độc lập, giữ schema remake riêng; thêm mutation tests và đưa report Chromium thật qua reader, không lấy expected từ chính report.

Reviewer audit yêu cầu làm rõ raw provenance: baseline Git lịch sử dùng LF, checkout nguồn hiện tại CRLF; đã ghi riêng hai blob/hash/bytes và nội dung36keys. Không đổi detector hoặc baseline để sửa lời mô tả.

Lượt operational đầu trên6f9 dừng sau5/39cặp (tablet landing/store-pairing/passcode/floor/order-drawer) vì navigation của target tiếp theo timeout cả networkidle và fallback. Exit1; chưa tạo report.md/json nên **không đạt** kiểm vận hành39cặp và không có appPASS. Browser/server5178 do task tạo đã đóng. Log giữ tại `artifacts/ui-audit/d7-verification/app-audit.log`. Đường lỗi runner đang được bổ sung report/checkpoint/coverage không đầy đủ, không tăng timeout, đổi detector hay sửa app. Lượt mới và candidate cuối được ghi riêng sau khi hoàn tất.

Candidate028c32f sau sửa reader/runtime đạt132script tests và99UItests, hai calibration11 và23/14/16 PASS (`d7-final-02`), cả hai reviewer APPROVE code theo scope. Operational lượt2 ghi được checkpoint:6/39completed, lỗi navigation ở menu-editor/report, `INCOMPLETE`. Root đã xác minh PID33028 và dừng đúng cây process do lượt này tạo; không nhận checkpoint hoặc source-validation chưa kết thúc là PASS.

Điều tra read-only tìm8junction fixture `artifacts/stitch/server-test-*/public/escape` trỏ về gốc repo (test bảo vệ đường dẫn cố ý giữ lại). Vite local8.2.1 mặc định theo symlink, ignore .git/node_modules nhưng không artifacts; process đã lên4,14GiB private RAM/239.573handles và gần98%CPU. Đã thêm ignore cho artifacts, out/report audit vào `vite.config.ts` (cấu hình watcher dev tooling, không đổi giao diện hoặc build output), giữ các fixture không xóa. Regression test sẽ mở Vite thật với backlink và kiểm watcher/HTTP trong thời hạn, rồi chạy lại39cặp. Vite thực tế local8.2.1 khác lock8.0.16; CI sạch là bằng chứng môi trường lock, không gọi dependency local là khớp toàn bộ lock.

## Candidate code được duyệt và kiểm mới

Candidate C9 trước CI Linux là `c9afd1c66176ce9642501a04fb4924119a5925f5`, tree `4b74c996c346b6b10f1eaaf3f3ba6581ee31634e`, base mainfc7d454. Hai reviewer không là tác giả APPROVE đúng SHA này: `review_final_ui_code` kiểm CI/integrity/privacy/resource/policy/dev tooling; `review_d7_audit_docs` kiểm audit/lifecycle/operator/baseline. F1/F2 đã đóng, nit exitcode README đã sửa. Review là review subagent độc lập theo quy ước dự án, không gọi đó là approval trên GitHub hoặc owner acceptance.

| Kiểm mới trên C9 | Kết quả | Bằng chứng local |
| --- | --- | --- |
| Ba file scripts CI/results/preview tests như command checkpoint trước |132/132 PASS, 0 fail/skip/cancel/todo | `artifacts/ui-audit/d7-verification/c9-node-tests.log` |
| `uiTestInventory(git ls-files)` → 9 Node test files UI, concurrency1 |100/100 PASS:77remake +23audit, 0 fail/skip/cancel/todo | `artifacts/ui-audit/d7-verification/c9-ui-tests.log` |
| `npm run ui-remake:selftest -- --out artifacts/ui-remake/d7-final-03` |11/11controls đúng (5PASS/6seededFAIL/0ERROR), exit0 | `d7-final-03/report.json` SHA256 `de5b84a619c181bfdefb24e177eed194587640342759c29b5c44b4f028e3b2c8` |
| `npm run ui-audit:selftest -- --selftest-report artifacts/ui-audit/d7-final-03/selftest.json` |23findings/14requiredclasses/16controls, sourcePreservedtrue/errors[], exit0 | JSON SHA256 `11c0c71281a6ef9b765bacfb0af9134f2570c8522e96586ceac18a27a4f1005a` |
| Canonical policy/source |19trusted hashes khớp Git blob; productionfalse; src và lockfile không có diff; detector/baseline raw hashes giữ nguyên; diffcheck sạch | so GitHEAD với base, không hash theo normalization tùy ý |

Remake source manifest SHA256 `a8b7e1922870a1eef98c45ff5200898beaaa6584de634c91fe0f25ffbe4dd82a`; reference `9cf839d41f8f7a4e67973f91a7402fb3d3b1a106227afecf0a3a75dab4e313d0`; contract `bc848d475e5925a958296d220fac5cc1f6f7d9172cf5cab9419ac04629b39dfd`. Cả hai report ghi HEAD C9 và runtime local đã nêu. Đã mở lại minimum-reference568×320 và detect-palette-diff của chính lượt03. Không dùng ảnh02 thay ảnh03.

Regression Vite thật đạt1/1 (nằm trong23audit tests); reviewer CI tự chạy lại1/1 PASS. Sau sửa, server audit ở5target đầu quan sát≈0,38GiB private RAM/927handles so với4,14GiB/239.573 trước sửa; không nhận số này là quota hoặc giới hạn kỹ thuật. Các fixture backlink/cache vẫn giữ, không xóa dữ liệu để làm xanh test.

Code đã push [PR#9→main](https://github.com/nguyentronglinh045/pos-cafe/pull/9), HEAD C9. Run028 `39198826457` hủy vì source đã bị thay thế, không PASS. Push runC9 `39199475231` hủy bản chạy trùng để chỉ giữ [PR CI39199479883](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39199479883); cần SUCCESS trên đúng candidate trước merge. Hosted CI dự kiến2–5GiB (**LỚN HƠN1GB**), cap/reserve giữ nguyên; không tải runtime vào máy local.

## Operational audit và phân loại

Lượt C9 `2026-10-19T04:25:25.914Z` → `04:28:58.627Z` đã COMPLETE39/39, attempted39/completed39, setup0, source before/after khớp C9, baselineSHA giữ79fe315c…, source.preservedtrue. Exit1 đúng vì6nhóm error mới ngoài baseline; đây là kết quả đo app, không phải lỗi vận hành bộ đo hoặc appPASS. Tổng42nhóm (27warn/10error/5info),20nhóm ngoài baseline (14warn/6error).

Đã đọc report và mở19ảnh annotated của C9 (6tablet/6desktop/7mobile). Kết quả C9:32nhóm đo thật theo ngưỡng cấu hình,3cảnh báo biên Ghi chú,7dương tính giả ở nhãn nav sr-only trên mobile. [Bảng phân loại đủ42nhóm](ui-audit-classification-2026-10-19.md) hiện ghi lượt mới7f bên dưới, không thay source của evidence C9. Không đổi severity/threshold/detector hoặc36keybaseline. Checkbox payment thiếu tên và control bị clip cần task UI riêng; không tự sửa src trong D7. Không nhận các threshold của detector là chứng nhậnWCAG.

Evidence C9 được giữ gọn tại `artifacts/ui-audit/d7-verification/operational-c9/` (Markdown/JSON/status/19PNG), log `c9-app-audit.log`; đây là source C9, không tự đổi tên thành PASS của candidate sau này.

## Checkpoint CI Linux và diagnostic

[PR CI39199479883](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39199479883) của C9 **FAIL** ở ui-tools (exit1); build/unit637/tooling36/node132/browser đã PASS. Không đủ bằng chứng từ public summary để chỉ ra assertion worker nào lỗi. `coreFileCount1/4096bytes` không chứng minh nativecrash: unit test CI có cố ý tạo corefixture. Không giảm coverage, bỏ test Vite hoặc nới timeout để qua gate.

Đã thêm diagnostic hữu hạn vào candidate `030976347c38d1cd6e6fcd693638e15827a0f71d`, tree `5d04500779c1b130ee56aabc4b4c145daa61f1c2`: stage/HTTP/watcher/sourcewatch/close/exit/timeout chỉ xuất số nguyên trong miền cho phép; reader giới hạn marker2048ký tự và bỏ raw error/path/workerJSON. Assertion/timeout/cap giữ nguyên; policy pin results theo canonical Git bytes. Local133script tests và100UItests PASS, hai reviewer không phải tác giả APPROVE exactHEAD theo hai scope, nhưng chưa là quyền merge với CI đỏ. [CI diagnostic39200254390](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39200254390) đang kiểm; pushrun39200250228 hủy bản trùng, không PASS.

## Kiểm mới trên candidate7f

Candidate `7f51a4f2ce2c034c70969c938c5272aa7a630e6a`, tree `ec3692e9bc29d80986e24633bcc2670ce4f5d336`. Diagnostic030 xác định đúng failureStage5: HTMLHTTP200/generatedwatch0/closed1/timeouts0 nhưng appSourceWatched0/45paths. Probe trước đó chỉ tải HTML. Bản7f tải module `/src/main.tsx` thực, kiểm HTTP200/JavaScript/bootstrap trước khi đo watcher, chờ đăng ký trong cùng ngân sách HTTP2giây. Không nới assertion sourcewatch/noartifacts hay timeout5/3/11/16giây. Không khẳng định hmr:false hoặc nativecrash là nguyên nhân khi chưa có bằng chứng.

Fresh local7f:133/133script tests,100/100UItests PASS,0fail/skip/cancel/todo (`final-v2-node-tests.log`, `final-v2-ui-tests.log` trong thư mục verification). Remake11controls đúng,0ERROR, exit0 tại `artifacts/ui-remake/d7-final-04/report.json`, rawSHA256 `8256da9a8f47688f757b70dc0b443eda47a95c41764f3663994073274a98a272`, source manifest `b425c18cc6af056cc3dad621a2aaf5c15da846031d6c98f2831198b15377f2ed`; reference9cf839d4…/contractbc848d47… không đổi. Audit calibration23/14/16/sourcePreservedtrue/errors[]/exit0, `artifacts/ui-audit/d7-final-04/selftest.json` rawSHA256 `a8d0f2186bd492e057dd09b51f1a0344a06131bbcd66c9781ca0ef5ae8249749`. Cả hai report ghi đúng HEAD7f, Node24.16.0/Windows10.0.26300/Chromium148/PW1.60.0 local như đã khai báo, không nhận đó là clean npmci Linux.

Operational7f chạy mới04:43:51.337Z→04:47:22.025Z: COMPLETE39/39, setup0, source/baselinepreservedtrue, exit1 do findings (không là runtimeFAIL).42nhóm/20mới/6newerror như C9; [classifier hiện tại](ui-audit-classification-2026-10-19.md) rawSHA256 `8f3bc087f7817b285b45d26451a473417ad400ad1ebf0be0a52a334f0ea895d1`, reviewer APPROVE nội dung chính xác. Đã so byte19PNG:6khớp ảnh C9 đã đọc,13khác đã mở lại (root11tablet/mobile, reviewer2desktop). Tất cả finding được đọc theo chính ảnh/range của lượt mới, không giả ảnh cũ là ảnh mới. Evidence giữ riêng tại `artifacts/ui-audit/d7-verification/operational-7f/` và `final-v2-app-audit.log`.

Hai reviewer APPROVE exact7f trong hai scope CI/privacy/policy và audit/operator/lifecycle. [PR CI39201005242](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39201005242) đang chạy; pushrun39201000345 hủy bản trùng. CI C9/030 đỏ vẫn ghiFAIL; chưa dùng approval code thay CI hoặc nghiệm thu app.

## Linux CI thành công và gate phát hành

[PR run39201005242](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39201005242) **SUCCESS**, đủ12phasePASS, trên PR head7f. Checkout kiểm thử là PR merge ref `5af07e28823063114417f2b2f7dd33b91a681487`, không nhầm với commit head7f. SourcePreservedtrue, UI100/100 và Node133/133 khôngskip; remake11/11controls và audit23findings/16controls được strictreader chấp nhận. Unit637/637 PASS. Tooling37discovered/36PASS/1manualDeferred theo allowlist backend-only sẵn có; smoke66discovered/35PASS/31skip theo profile MAIN_CURRENT_APP. Không đổi applicability/backend allowlist, không tuyên bố31permissioncase hoặc test DB thật đã chạy. Deferred gates vẫn PERMISSION_FULL và UI_AUDIT_APP_ACCEPTANCE.

GitHub strict required check tính cả push lẫn PR check cùng tên. Việc hủy pushrun để tránh chạy trùng khiến PR vẫn BLOCKED dù PR CI đã SUCCESS; đã rerun đúng pushrun `39201000345` attempt2 trên cùng7f, không dùng admin/force hoặc thay branch protection. Cần cả haiSUCCESS trước merge. C9/030FAIL và các run đã hủy không thay thànhPASS.

Pushrun attempt2 kết thúc **FAIL** lúc04:54:11Z ở ui-tools. Diagnostic xác định lỗi mới tại cleanup: stage6/HTTP200/generatedwatch0/appSourceWatched1/watched679/closed0/exit2/timeoutOrdinal2. Probe bootstrap và watcher đã đạt, nhưng `server.close()` vượt3giây. Đây không phải SUCCESS của cả candidate7f; merge tiếp tục bị chặn. Đang điều tra lifecycle Vite/optimizer; không nới timeout hoặc bỏ regression để qua gate. Log giữ tại `artifacts/ui-audit/d7-verification/ci-push-7f-attempt2.log`.

Các kết quả7f trên là checkpoint lịch sử. Candidate sửa cleanup và kết quả mới được ghi bên dưới; PRPASS7f không thay pushFAIL7f hoặc CI của candidate khác.

## Candidate b581 — drain request trước teardown

Candidate `b581afeb0e68da468b7d4b642778e905984ffa8d`, tree `eca218246ad910ed0f934e27482eb13ad836b13a`. Delta so7f chỉ5dòng trong `ui-audit/watch.test.mjs`: sau tải module app, chờ `server.waitForRequestsIdle()` bằng API công khai trước snapshot/teardown, trong phần còn lại của cùng ngân sách HTTP2giây. Vite còn xử lý static imports sau response entry; đóng ngay có thể đụng lifecycle optimizer/plugin đang làm việc. Đây là căn cứ sửa race trong test; chưa khẳng định một lỗi native cụ thể. Không tắt optimizer, hmr hoặc nới5/3/11/16giây, không giảm assertions/guard.

Hai reviewer không phải tác giả (`review_final_ui_code`, `review_d7_audit_docs`) đã APPROVE exactb581 trong hai scope CI/privacy/policy và audit/operator/lifecycle, cho push kiểm Linux. Fresh local cùng môi trường đã khai báo:133/133script tests,100/100UItests,0fail/skip/cancel/todo (`final-v3-node-tests.log`, `final-v3-ui-tests.log`).19trustedpolicyhashes khớp canonicalGit, productionfalse, diffsrc/lock rỗng, detector/baseline rawSHA giữ nguyên, diffcheck sạch.

Calibration mới sourceHEADb581/dirtyfalse: remake11controls đúng5PASS/6seededFAIL/0ERROR, exit0; `artifacts/ui-remake/d7-final-05/report.json` SHA256 `f480ee03839770924f983a44024e1876db07361a8e615fef2b50565ab1e9143d`, source manifest `a7cb57e00cb1b6c73fde0dfb09f9d5e357f9df2fc1e4f63005d71a317bbbf0d4`; ref9cf839d4…/contractbc848d47… giữ nguyên. Đã mở minimum-reference568×320 và detect-palette-diff của lượt05. Audit selftest23findings/14classes/16controls/sourcePreservedtrue/errors[]/exit0; `artifacts/ui-audit/d7-final-05/selftest.json` SHA256 `da3885ad8770a1a1f4c6f136158a002e0ded500f2aa8a490d7e0402b9ca9a04a`, `selftest OK`. Log tương ứng `final-v3-remake-selftest.log`, `final-v3-audit-selftest.log`.

Operationalb581 chạy mới05:00:00.854Z→05:03:31.345Z, COMPLETE39/39/attempted39/setup0/sourcebefore–afterpreservedtrue, baseline79fe315c… không đổi. Exit1 do6newerrorgroups;42nhóm/20mới,27warn/10error/5info. Đã đọc report.md; toàn bộ JSON findings deep-equal7f.19PNG đều có timestamp lượt mới,10byte-identical ảnh7f đã đọc,9khác đã mở lại (root7tablet/mobile, reviewer2desktop). Reviewer audit APPROVE phân loại32đo thật/3biên/7sr-only; classifier sourceb581 SHA256 `142e426b3d820145243e3dc3c07c593bcde048441a4f4174c62529dbc1b87603`. Evidence giữ riêng tại `artifacts/ui-audit/d7-verification/operational-b581/`, log `final-v3-app-audit.log`. Port5178 đã nhả, không để lại server. Đây là kiểm vận hành công cụ, không nhận appPASS/nghiệm thu hoặc đổibaseline.

Đã push exactb581. [Push CI39202240244](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202240244) và [PR CI39202244254](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202244254) đều **SUCCESS**, đủ12phasePASS/sourcePreservedtrue, cùng sourceFingerprint `4b2e7d6c597b3910553b15dfe815010e2e43175759f594f1049877485342d3c3`. PushsourceSHA là b581; PRcheckout là merge ref `3c777b195da41d40400160bf3ba0fb9c3c910b97` với headb581, không gán sai SHA. Unit637/637, Node133/133, UI100/100, remake11/11, audit23/16 và preflight1PASS. Tooling36PASS/1manualDeferred; smoke35PASS/31notapplicable theo cùng allowlist/profile, không gọi31case chưaápdụng là đã chạy. Deferred vẫn PERMISSION_FULL/UI_AUDIT_APP_ACCEPTANCE. PeakOwned push968.097.792bytes, PR1.011.822.592bytes, dưới cap5GiB/reserve30GiB; không nhận đó là quotaOS. Log và publicsummaryJSON lưu `ci-b581-{push,pr}-{success.log,summary.json}` dưới verification.

Live readback PR#9 trước merge: headb581/base main, cả hai requiredchecksPASS, CLEAN/MERGEABLE. Không hủy run mới, bypass protection hoặc dùng7fPASS thay kết quả hiện tại.

## Publication code và readback

Sau khi đủ gate và reviewer CI đối chiếu độc lập hai live logs/summary/source/ref/protection, đã merge [PR#9→main](https://github.com/nguyentronglinh045/pos-cafe/pull/9) lúc `2026-10-19T05:07:39Z`, dùng `--merge --match-head-commit b581afeb0e68da468b7d4b642778e905984ffa8d`, không admin/force. Merge commit `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`; fetch/readback xác minh stateMERGED, đúngbase/head, b581 là ancestor và tree `eca218246ad910ed0f934e27482eb13ad836b13a` bằng reviewedtree, `git diff b581 origin/main` rỗng. Không pull/switch/reset hai worktree WIP gốc.

GitHub Contents trên main đọc được và blob khớp candidate: ui-audit/README `2e57d1e4921af3f18d85364640a5caec9963a161`, ui-remake/README `8651d3b9dea37dfad212bab13bfd0000f1f27433`, ui-audit/run.mjs `e3e5f406e708d920c50725faddd627189c790878`. [CI sau merge39202923597](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39202923597) đã **SUCCESS** trên exactmain2da0d7e, kết thúc05:13:04Z. Đủ12phasePASS/sourcePreservedtrue, fingerprint4b2e7d6c… khớp cả hai lượt trước merge. Unit637/637, Node133/133, UI100/100, remake11/11, audit23/16, preflight1PASS; tooling36PASS/1manualDeferred, smoke35PASS/31notapplicable giữ đúngprofile. Deferred vẫn PERMISSION_FULL/UI_AUDIT_APP_ACCEPTANCE; peakOwned982.638.592bytes. Log `ci-main-2da-success.log`, publicsummary `ci-main-2da-summary.json` dưới verification, không ghép source cũ thành PASS mới.

Docs candidate chỉ mang11Markdown/spec/handoff từ branch `workflow/ui-validation-ci-docs`, base docs81e1f99; không nhập15commit/WIP ở checkout gốc. Đã push và tạo [PR#10→docs](https://github.com/nguyentronglinh045/pos-cafe/pull/10), ban đầu exacthead041a58c. Kết quả execution/metadata hậu merge docs được ghi tại PR#10 sau thực thi, không nhận commit chứa chính biên bản đã merge trước khi thực hiện. Không deploy, sửaUI, cập nhậtbaseline hoặc làm pilot.

## Review độc lập cuối

Hai reviewer không tham gia tạo code/docs của sliceD7 đã APPROVE nội dung cuối: code `b581afeb0e68da468b7d4b642778e905984ffa8d`/treeeca218…; docs `041a58c35c1e9751b64a4962fea69452477a1176`/tree `6234c82e371bc589f82b2ba33b7bd6ac1ce48842`. Metadata ghi chính review/push/merge/readback thực tế được bổ sung sau, không thay hợp đồng/test/expected hoặc verdict.

| Reviewer, scope | Kiểm độc lập và verdict |
| --- | --- |
| review_final_ui_code — CI/integrity/privacy/resource/policy/ủy quyền | APPROVE exactcodeb581 cho merge với match-head sau đối chiếu hai liveCI/JSONsummary/fingerprint, syntheticmergereftree và requiredchecks. APPROVE exactdocs041: hashes/local133/100/calibration/39audit, phân biệtappacceptance, lịch sửFAIL/cancel, actualcodemergeparents/tree/3blobs và scopecleanup. Không finding chặn còn mở. |
| review_d7_audit_docs — audit/operator/lifecycle/spec/test/classifier/evidence | APPROVE exactcodeb581 và exactdocs041; kiểm6filedelta từ checkpoint48,32relative/crossbranchlinks/diffcheck, source/counts/hashclassifier142e426…, hai ảnhdesktop mới và4ảnhbyte-identical7f, đầy đủ42dòng classification. Không finding chặn còn mở. |

Cả hai ghi mainCI39202923597 còn đang chạy tại thời điểm review; yêu cầu chờ kết quả, không suyPASS hoặc cấp quyền sửaapp/updatebaseline/deploy. Các finding readerOS/sourcePreserved và provenance trước đó đã xử lý, review lại đúng candidate; không bỏ reviewer bất đồng hoặc thay approval bằng majority. Chủ dự án chưa xác nhận đã xem/hiểu code; gói hướng dẫn đọc đã chuẩn bị, không gán owneracceptance.

## Cách đọc và tái hiện

Trong code checkout: `ui-remake/README.md`, `ui-audit/README.md` → scripts/project-ci.mjs và project-ui-results.mjs → báo cáo calibration/app audit. Tests có lệnh và dữ liệu cụ thể trong testplan T17–23. Đã chuẩn bị hướng dẫn đọc; chưa có xác nhận chủ dự án đã xem/hiểu code.

## Tài nguyên và dọn fixture

Chủ dự án đã cho phép dọn đúng20thư mục fixture tạm trong `artifacts/stitch/server-test-*` và `artifacts/ui-audit/watch-test-*` tại checkpoint04:57Z:252file,31junction/symlink,62.096.985bytes logic (≈59,22MiB; chưa đo dung lượng cấp phát thực). Đã xác minh20đường dẫn tuyệt đối, ownership từ hai test tạo fixture và target của31link, không đi theo backlink. Lệnh PowerShell chỉ xóa phạm vi đã duyệt bị automatic approval review từ chối với lý do **blocked by policy** trước khi chạy. Không thử cách khác để vượt chặn; dữ liệu vẫn nguyên, chưa thu hồi dung lượng. Manifest local `artifacts/ui-audit/d7-verification/cleanup-approved-manifest.json`; report/ảnh cuối, dependencies và fixture mới sau checkpoint được giữ. C≈182,2GiB/D≈92,0GiB trống tại checkpoint; không tạo WSL/Docker hay cài thêm local.
