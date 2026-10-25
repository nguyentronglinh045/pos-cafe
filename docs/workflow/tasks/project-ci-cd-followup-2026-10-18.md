# Lưu hồ sơ, kiểm Preview và rà gate phân quyền — 18/10/2026

## Quyền và thứ tự

Owner giao lần lượt: commit riêng hồ sơ CI/CD → test nhanh Preview → rà các gate còn thiếu của bản phân quyền; dùng subagent, hỏi và đợi khi có uncertainty material. Mỗi vấn đề chỉ tối đa hai lần sửa không thành công; sau hai lần phải dừng hướng sửa đó và chuyển sang chẩn đoán/tiếp cận khác. Không lấy yêu cầu rà gate làm quyền rebase/merge, chạy full gate/HP1, cài runtime hoặc phát hành Production. Không push khi owner mới giao commit.

## Bước1 — đã commit local

Commit docs `1c75b7a1374566ffb0c3dc70208983d5a0179606`, parent `e47862b1dfed68d783dc07a2a1fd51ecdabc1b19`, tree `7f4594394ca89d4baf059977099c713ddf35d7f4`. Đúng12file CI/CD,1994dòng thêm. Index ban đầu và sau commit sạch; README working tree ngoài phạm vi giữ nguyên hash. Không push.

Candidate DOCS-ARCHIVE02 manifestSHA256 `6e2b4511cba9e5518706c7a105bbec833d6a9ee5be9f123ea486ebf9b7f81690`, ở D:/Workspace/pos-cafe-ci-main/artifacts/docs-archive02. EVC/status_independent_review và SEC/docs_commit_security đều APPROVE exactcandidate cho local commit. Gate thực: canonical12payload417.570B, plannedtree/index khớp;20relative links không thiếu,3externalhistorical links pin published1d87c409…; không kéo unrelated README/permission source/private payload. Có1whitespaceEOF sửa một lần đạt;1câu index/workingtree sai sửa một lần đạt, không có lần sửa thất bại lặp. Receipt commit-receipt.json gắn đúngcommit/tree/12paths và pushed=false.

## Bước2 — smoke Preview đã chạy, 3/3 PASS

Target duy nhất: https://pos-cafe-kgnrohp1y-24tx810010-hcmutes-projects.vercel.app/ ; deploymentdpl_EsvP4kTkNG6JoKva2yNT523epBjr, source536d8f6497403ace1193af4586a89b4862c730fd, CI39101826725/Preview39102130352attempt1 đã PASS. Source scripts/project-preview.mjs:58–61 ép mock và blank Supabase; src/app/runtimePorts.ts:15–36 chọn seeded mock khi mode=mock. Dùng trình duyệt đã có, không cài browser/SDK/runtime, không gọi backend hosted.

| Case | Input và thao tác | Kỳ vọng |
| --- | --- | --- |
| PV01 | Recipe synthetic tests/smoke/helpers.ts:4–19: StoreKey0001-X8F3QA, chọn admin test, PIN123456 | Vào floor; không dùng credential người thật hoặc tạo quán thật |
| PV02 | Tạo một đơn mới trên bàn trống hoặc luồng mang về; chọn một món không modifier với qty1; đọc giá hiển thị trước khi lưu | Đơn/món/số lượng/tổng khớp; chỉ thao tác đơn thử mới, không sửa/xóa đơn có sẵn |
| PV03 | Thanh toán tiền mặt đơn thử; nhập số tiền >=tổng, đối chiếu tiền thừa; tắt in nếu có; kiểm kết quả/lịch sử | Thanh toán thành công, tổng/tiền khách đưa/tiền thừa khớp và đơn đã thanh toán; không coi test ngắn là full smoke/UI audit/backend PASS |

Chụp bằng chứng gọn tại checkpoint; không sửa source để qua test, không reset storage hoặc xóa dữ liệu của người dùng. Nếu không chắc mock/target hoặc phát hiện luồng không rõ thì dừng phần phụ thuộc và hỏi. Một issue tối đa2lần sửa không thành công, ghi triệu chứng/giả thuyết/kiểm định và chuyển cách tiếp cận.

Kết quả thực chạy bằng CUA trên đúng Preview, giữ cùng page/session:

| Case | Kết quả quan sát | Trạng thái |
| --- | --- | --- |
| PV01 | Ghép Store Key synthetic, chọn Quản lý, mở khóa bằng PIN fixture; vào floor tại viewport1280×800 | PASS |
| PV02 | B01 ban đầu trống; thêm Americano1×35.000₫ không modifier; gửi đơn, thấy phiếu bếp; mở lại B01 vẫn đúng đơn #27 và tổng35.000₫ | PASS |
| PV03 | Tiền mặt50.000₫, tiền thừa15.000₫, tổng35.000₫; bỏ chọn in, chỉ submit thanh toán một lần. Toast “Đã thanh toán. Bàn đã trống.”; B01 trở lại trống. Dòng paid mới nhất trong lịch sử là B01/Americano1, đúng35.000/50.000/15.000₫ | PASS |

Lịch sử hiển thị “#2”, khác số đơn mở “#27”: code tính `historyDisplayNo = total - (page - 1) * pageSize - index`, rồi giữ `order.id` riêng tại `D:/Workspace/pos-cafe-ci-main/src/features/pos/historyHelpers.ts:107–125`; caller `src/app/drawers/admin/OrderHistoryDrawer.tsx:113–118` truyền total2/index0. Đây là thứ tự danh sách hiện có, không tự sửa hành vi đánh số. Đối chiếu chính dòng mới bằng bàn, ngày, món, qty, trạng thái và các số tiền; không dùng đơn fixture L01/77.000₫ làm bằng chứng.

Bằng chứng local tại `D:/Workspace/pos-cafe-ci-main/artifacts/followup01/`: `preview-smoke.json`, cặp `pv02-order.jpg/.ax.txt`, `pv03-beforepay.jpg/.ax.txt`, `pv03-history.jpg/.ax.txt`. Ảnh lịch sử đã mở kiểm bằng mắt. Viewport tạm1280×800 đã reset sau khi lưu bằng chứng; tab Preview giữ cho owner. Không reload/reset state hoặc sửa/xóa đơn cũ. Screenshot/AX là mock synthetic; không có hosted DB hoặc giao dịch tiền thật.

Có một lỗi locator role/name khi nhập tiền, chưa đổi state: quan sát lại input ID thực tế rồi dùng đúng ID đã nhập thành công ngay. Không thay source; không có hai lần sửa thất bại cùng vấn đề. Màn hình xoay ngang ở viewport dọc là hướng dẫn hiện có; kiểm tại landscape theo mục tiêu tablet, sau đó khôi phục viewport. Không diễn giải ba ca này thành full smoke/UI audit, refresh persistence, backend/permission hay Production PASS.

## Bước3 — phạm vi rà gate, bắt đầu sau bước2

Chỉ đọc source/evidence/spec và lập bảng gate đạt/thiếu/lỗi/chưa chạy gắn fingerprint thật, cùng ảnh hưởng khi tích hợp với main có CI mới. Nhánh phân quyền c898/HP1WIP giữ riêng; không nhận pilot4/4 là fullPIN19/PERM60/HP1, không thực thi gate nặng hoặc thay acceptance. Production/DB/Edge/upload quota/cleanup vẫn giữ ranh giới trước.

### Đối chiếu tích hợp với main hiện tại

Readback `D:/Workspace/pos-cafe-ci` HEAD vẫn `c898d7602d83e1e6d444e0c22259bd141bef85a4`,6tracked HP1 edits và5new modules/helpers chưa commit. `D:/Workspace/pos-cafe-ci-main` HEAD `691b0d4de11979fef742d35f0df4bd5ff447918a`, tree `a67dc3557f378be996f37b554badf92645f84f6c`, tracked clean; đây là tree cùng actual main `536d8f6497403ace1193af4586a89b4862c730fd`, không nhận local branch691 là merge commit main.

CI main hiện khai báo9phase tại `D:/Workspace/pos-cafe-ci-main/scripts/project-ci-results.mjs:10`; summary ghi `MAIN_CURRENT_APP` và defer `PERMISSION_FULL`/`UI_AUDIT_FEATURE_BRANCH` tại `scripts/project-ci.mjs:312–313`. Nhánh c898 có thêm ui-selftest/ui-audit tại `D:/Workspace/pos-cafe-ci/scripts/project-ci.mjs:289–294`; không lấy CI9phase của main thay CI11phase hay full gate phân quyền. Main đã có `gitCommitParents` và source binding parent graph tại `scripts/project-ci.mjs:142–176`; diff cho thấy branchc898 chưa có delta này. Đây là điều cần giữ/kiểm khi tạo candidate tích hợp sau, không phải patch đã thực hiện trong lượt rà.

Release policy cũng khác: main chỉ chấp nhận source main và có18trusted pins cùng Preview target; c898 còn policy cũ và chưa có `scripts/project-preview.mjs`. Verifier so exact file-set và SHA256 tại `D:/Workspace/pos-cafe-ci-main/scripts/project-release.mjs:33–36`; Preview chỉ nhận main và policy production=false tại `scripts/project-preview.mjs:26–40,134`. Do đó một candidate tích hợp làm đổi package/lock/tooling phải được đối chiếu lại pin/profile và review đúng tree; không chép nguyên policy nhánh cũ hoặc nới verifier để chạy. Trong scope audit chưa tạo merge tree, chưa merge/rebase/cherry-pick hoặc dispatch workflow mới.

Đối với IDEM087, quyết định hiện hành ở [completion dòng187](project-ci-cd-completion-2026-10-18.md#giảm-phạm-vi-phát-sinh-theo-steering-owner) đã bỏ dựng runtime087 mới khỏi recipe: giữ manual/NOT_RUN riêng của change idempotency, không tự thêm làm gate merge phân quyền. Điều này không miễn legacyT01/T02/PIN19/PERM60/HP1.

### Bảng gate — kết quả rà chỉ đọc

Investigator `/root/permission_gate_investigator` chỉ đọc source/spec/evidence, không tạo kết quả runtime mới. Các nguồn spec phân quyền bên dưới đang nằm trong working tree `docs` có phần sửa chưa commit; không nhận chúng thành nội dung của commitCI/CD1c75 hoặc nguồn đã xuất bản. Code/evidence phân quyền thuộc `D:/Workspace/pos-cafe-ci`; nguồn CI/Preview mới thuộc `D:/Workspace/pos-cafe-ci-main`. Mọi trạng thái PASS lịch sử giữ đúng fingerprint, không ghép thành PASS candidate tích hợp chưa tồn tại.

| Nhóm | Đã có và giới hạn | Thiếu để kết luận merge-ready |
| --- | --- | --- |
| Source/tích hợp | HEADc898 +6tracked edits/5newfiles HP1/proof; giữ riêng khỏi main536d8 | Chưa chọn hết WIP cần giữ, chưa có application merge tree đã resolve/freeze/review; review evidence package cũ không thay application review |
| Core/build/tooling/UI | LightCI39095564040 trên c898 SUCCESS11phase: unit1173, tooling566+1manualDeferred, Node111, smoke44PASS+37declaredskip, selftest23findings đúng detector, UI48/48state với6baselinefindings; sourcePreserved=true | Các số này không chứng minh source có WIP/candidate tích hợp đã PASS. Không nói6baselinefindings đã được sửa. Cần kiểm profile phù hợp trên finalsource |
| Forced PIN/PIN19 | Full gate source57 PASS lịch sử, gồm55browser/41SQL/1canary/2operator/110focused | Chưa có fullPIN19/strict aggregate trên c898+WIP/candidate tích hợp cuối, gồm onboarding/identity/canary/operator/focused/browser theo manifest |
| PERM60/T15–T16 | Manifest actual60REQUIREDTC/726variants/27stages; candidate638,legacy58,bridge17,transition13. Fullsource57 là lịch sử | Chưa chạy toàn bộ đúng profile/fingerprint, candidate service trên cùng backend, activation/rollback/K preservation và strict aggregate trên finalsource |
| Worker/runtime | Backend39096247811 trên c898 SUCCESS4/4: T09=1,T10=3; chỉ pilot | Worker chưa điều phối fullPIN19/PERM60/HP1. Chưa chứng minh recipe chạy tuần tự đủ coverage, thời gian và mọi writer fit20GiB/reserve30GiB. Không tạo WSL/Docker hoặc nhiều stack để thử dò |
| HP1 LOCAL tối thiểu | Source58 từng75HP1PASS, thiếu fullgate/review cuối cùng nguồn; generator/scope/guard mới vẫn WIP. Registry certified hosted rỗng; LOCAL không được dùng cho release | Negative boundaries, wiring/recipe và75checks+hai fresh capture graphs+offline replay trên finalsource còn NOT_RUN. Giữ từ chối đưa historical scope vào secret; không đổi pin hosted/quyền release để qua CI |
| Proof/replay/preservation | Proof-package02 có133NodePASS/haiAPPROVE riêng utility checkpoint; WIP snapshot giữ nguyên | Actual Windows/MSYS GPG roundtrip/FD3, collector graph closure/global retention chưa chứng minh; quota/hardstop chưa xác minh nên chưa upload. Fullrun mới cần source/recipe/raw/trust refs tái hiện được cùng DB/Storage metadata+bytes preservation và owned teardown; không lấy gói source thay raw proof đã mất |
| Final review/phát hành | Chưa có SEC→EVC cho exact application candidate tích hợp cuối; HP1 review cũ chưa được thay bằng finalapproval đầy đủ | Cần hai review exact finalcandidate sau đủ gate. HP2/hosted certification/live migration/Production vẫn HELD thuộc phạm vi riêng; không thêm chúng thành điều kiện mới cho merge-only |

Nguồn đối chiếu chính, có thể mở trực tiếp tại máy:

- `D:/Workspace/pos-cafe-ci/artifacts/project-ci-completion/fixture03/ci-39095564040.json:3–165`; `backend-39096247811.json:9–67` cùng thư mục: hai receipt lịch sử đúng c898.
- `D:/Workspace/pos-cafe-ci/scripts/permission-ci1-policy.mjs:14–20`, `scripts/permission-ci1-harness.mjs:96–100`: worker chỉ pilotT09/T10; `tests/permissions/permissionAggregateCases.json:4` và `scripts/permission-aggregate-verify.mjs:85–145`: requiredTC/variants/stages và kiểm exactfingerprint/discovery/options/profile, không pending/mixed backend/source drift.
- `D:/Workspace/pos-cafe-docs/openspec/changes/redesign-permission-model/tasks.md:215–230,290–293` và `openspec/changes/force-default-pin-change/tasks.md:3,24`: acceptance của aggregate/PIN/HP1, không thay bằng CIlight.
- `D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-hosted-hp1-2026-10-14.md:139`; `docs/workflow/tasks/permission-hosted-hp1-2026-10-14.md:5,15,22–23`: source57/source58 và finalreview/fullgate còn thiếu. `docs/implementation-log/permission-progress-audit-2026-10-15.md:48–53` ghi giới hạn package/runtime cũ.
- [HP1 input policy](project-ci-cd-hp1-input-policy-2026-10-18.md):3,20,43–49 và [completion](project-ci-cd-completion-2026-10-18.md):187,195,197–199: scope tối thiểu/defer087/proof/quota và quyền hiện hành; `D:/Workspace/pos-cafe-ci/scripts/permission-hosted-profile.mjs:6`, `scripts/permission-backup-dispatch.mjs:17`: LOCAL/hosted boundary.

### Nguồn WIP được giữ, không coi là restore đã chạy

Snapshot `D:/Workspace/pos-cafe-ci/artifacts/project-ci-completion/permission-wip-split01/manifest.json`, SHA256 `18b3a18d39b6ef72c8df4fc729ca6e8edffc56dc26c7e4f3c05439d5b7c17fa3`, basec898. Investigator đối chiếu5/5newfiles actual/snapshot/hash khớp; `tracked.patch` hash khớp manifest `d876c07e7828103b9e23007447b342baa472551404a2ea20f1bd5c7cfa1393fd`. Patch hiện tại và bản lưu chỉ khác CRLF, normalized202lines giống nhau; `git apply --reverse --check --whitespace=nowarn -` trên savedpatch exit0, không mutate. Base object tồn tại. Chưa dựng checkout để restore thực, nên chỉ kết luận các đầu vào phục hồi còn có, không báo restore/runtimePASS.

Lock canonical85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18 khớp c898/pilot/source58; working raw hash khác do CRLF, không đủ căn cứ gọi dependency drift. Các dependency findings ngày15/10 là checkpoint lịch sử, không báo thành lỗi current hoặc tự update package trong audit này.

### Hành động tiếp theo được đề xuất, chưa triển khai

1. Khi owner giao tiếp, chốt danh sách source/WIP sẽ giữ và kế hoạch tích hợp main hiện hành, bảo toàn CI guards/Preview policy/UI acceptance. Chưa tự merge/rebase source.
2. Lập recipe coverage/resources/private proof đủ các gate, giữ ranh giới HP1 sửa tối thiểu và quyết định không dùng historical scope trên Actions. Chỉ giải quyết lựa chọn ảnh hưởng scope/runtime/cost sau khi hỏi và đợi owner; không bắt đầu fullrunner port rộng để thử.
3. Nếu recipe đủ điều kiện, hoàn tất đúng wiring/negative checks còn thiếu; freeze source rồi chạy tuần tự core→PIN19→PERM60/activation→HP1 graphs/replay→preservation/closure theo dependency thực. Sau đó SEC→EVC exact finalcandidate trước xét merge. IDEM087 vẫn manual/NOT_RUN riêng.

Kết luận audit: **chưa đủ bằng chứng merge bản phân quyền**. Đây là gate thiếu trên finalsource/candidate, không phải một lỗi backend đang FAIL được suy từ log cũ. Task hiện tại chỉ bàn giao danh sách và ranh giới; chưa có quyền/fullrun/candidate mới phát sinh từ bảng này.

## Trạng thái

Bước1 và2 đã thực hiện, bước3 rà chỉ đọc đã có bảng kết quả. Reviewer EVC đã APPROVE phạm vi ba ca mockhappy-path bằng receipt/AX/ảnh; login ban đầu/single-submit/toast dựa receipt operator, ảnh tĩnh không tự chứng minh toàn bộ trình tự. Final review toàn hồ sơ sẽ ghi sau khi khóa candidate. Không đổi application source, chạy gate nặng, push/upload artifact hoặc deploy mới.

Dung lượng checkpoint C202.197.090.304B/D99.421.708.288B free;7bằng chứng smoke206.502B logical. Gói review local chỉ copy hai tài liệu và bằng chứng mock, dự kiến<1MiB trên D, không cài gói/cache/runtime. Đây là số đo/ước lượng task, không claim quota kỹ thuật. Nhóm372temp roots được hỏi trước vẫn chưa có quyền xóa; giữ nguyên, không dọn trong lượt này.

## Review cuối — FOLLOWUP01

Candidate manifest SHA256 `d64ca21be9e82a3170a0868d8ad53959684db0564180554fa0768b77be14cad4`, parent1c75b7a, plannedtree `e2170fd1e62c3a0a862818490337b85e3b9eb772`, tại `D:/Workspace/pos-cafe-ci-main/artifacts/followup-review01`. Hai canonicaldocs+bảy mockevidence tổng225.453B;9relative links hợp lệ/0thiếu, diff-checkPASS, index thật sạch khi review. README165dòng ngoài phạm vi không vào plannedtree; workingREADME giữ nguyên từ checkpoint khóa candidate.

- EVC `/root/status_independent_review`: **APPROVE FOLLOWUP01** đúng manifest trên; xác minh bước1receipt, ba manualmockcases, gate matrix/fingerprint/60TC-726variants-27stages so pilot4, WIP giữ và giới hạn lịch sử/finalsource. Không có finding chặn. Không chạy lại browser/runtime/tests hoặc xác minh toàn bộ rawproof lịch sử.
- SEC `/root/docs_commit_security`: **APPROVE FOLLOWUP01** đúng manifest trên; xác minh hai payload/bảy evidence/hash/bytes, dữ liệu synthetic, không private key/token/customer thật/historicalscope; source/target/mock binding, HP1/LOCAL-hosted/quota/Production boundaries giữ nguyên. Không có finding chặn; không xác minh lại provider trực tuyến.

Hai reviewer không tham gia author candidate và chỉ review, không sửa/deploy. Phạm vi được duyệt là bàn giao kết quả và local commit đúng hai tài liệu. Không cấp thêm quyền push, merge phân quyền, fullgate/HP1, xóa temp hoặc Production. Mục này chỉ ghi metadata verdict đúng candidate đã duyệt; không đổi nội dung được review. Commit receipt sau thực thi lưu cùng bundle; không nhận commit là push.
