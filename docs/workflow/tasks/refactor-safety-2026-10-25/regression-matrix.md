# Phụ lục B — Bất biến, kiểm thử và bằng chứng

## Bằng chứng thực hiện ngày27/10/2026

[Hồ sơ triển khai](implementation-20261027.md) và [receipt/hash](implementation-20261027-evidence.json) gắn từng gate với source `c6ff3c795616dfa84379be85feeca29927d173c9` đã merge PR15 vào main `052a7d1e156425ea82ed1c9cf978d7ef4d4f3571`, environment local mock, test identity, configured skips và failure đã điều tra. Matrix dưới đây giữ nguyên bất biến/acceptance; các gate backend hoặc scope chưa chọn không được biến thành PASS bằng coverage/UI. [Review](implementation-20261027-review.md) ghi hai phạm vi độc lập và những gap đã đóng.


Nguồn code và test: main711a22e71983e3d6aa17799649af05ce4c762555. Trạng thái mọi phép chạy dưới đây: **CHƯA CHẠY trong lượt lập kế hoạch**. Đọc tên/nội dung test chỉ xác nhận test tồn tại và phạm vi dự kiến; không nhận test PASS hay coverage đầy đủ. [Kế hoạch](README.md) · [Phần việc](slices.md).

**Bổ sung đầu vào ngày 26/10/2026:** đọc [bàn giao nguồn](README.md#handoff-20261026), dùng [regression map 21 FR/8 NFR](../../../regression-map.md), [spec reconciliation](../../../spec-reconciliation.md) và [testing](../../../testing.md#bản-đồ-bằng-chứng) để hoàn thiện RF-I15/impact map. Các mốc docs7e29287 bên dưới giữ nguồn khảo sát cũ; ưu tiên quyết định hiện hành đã truy vết trong bảng hòa giải. FIN-WIP-02 và delta ACL gắn snapshot WIP, chưa gán cho source main. Lượt cập nhật chỉ chuẩn bị tài liệu, không chạy lại baseline, miễn gate hay đổi expected.

## B1. Bất biến và oracle

| ID | Điều phải giữ; phản ví dụ phải bắt được | Nguồn/test hiện có cần dùng | Phần áp dụng; bổ sung khi có gap |
| --- | --- | --- | --- |
| RF-I01 | Hướng import, exports/types, một instance cho singleton; bắt import vòng/adapter lọt feature hoặc façade tạo store/coordinator thứ hai | src/architectureBoundaries.test.ts; runtimePorts.ts:24; writeOperationFlow.ts:160 | Mọi extraction; public-export/type smoke và duplicate-module/cycle check theo seam |
| RF-I02 | Quyền kiểm đúng actor/store/revision; query key chứa store/employee/generation/purpose; response cũ không nhập cache/UI; guard trước/sau await | permissionSession.ts:64–95; permissionUi.test.tsx; orderFlow.lifecycle.test.ts; relevant permissionSession/read tests theo inventory | RF-03…08; direct invocation không chỉ hidden button; giữ partial-right revocation |
| RF-I03 | Tiền, quantity, option delta, giá/tên snapshot, phần cũ/mới và rounding giữ nguyên; không gộp nguồn giá khác | orderFlow.test.ts:41–133,330–426; writeOperationFlow.test.ts:184–261; ReceiptPreview.test.tsx:14–45 | RF-07/receipt/adapter; expected độc lập, thiếu/đúng/dư cash, quantity0/1/999/ngoài biên/fraction/unknown ID, option quantity>1, menu đổi giá |
| RF-I04 | Một confirmation chỉ có K/payload đã đóng băng; không double-submit, retry tự động hay tạo K mới khi ACK mất; OCC/version giữ | writeOperationFlow.test.ts:47–169; writeOperationFlow.ts:72–137; contract/backend idempotency theo approved spec | Bất kỳ thay write seam; mock không thay transaction/DB oracle; full vs split phải giữ đúng mode/sourceOrderId |
| RF-I05 | Late async không thay view mới sau navigation/lock/offline/actor/revision/context change; guard đúng vị trí trước/sau await | orderFlow.lifecycle.test.ts:7–47; writeHistoryLifetime.test.tsx:53–126; useViewLifetime.ts:7–30; writeReviewRegressions.test.tsx | History/menu/floor/employees/shared/payment; deferred promise ở từng stage, success và error, confirm A→B và selected A→B |
| RF-I06 | Refetch snapshot/version trước khi mở confirmation; sau xác nhận gửi đúng snapshot/version đã hiển thị, không tự refetch/rebuild payload; stale callback không đóng confirmation mới, current error/refetch giữ | OrderHistoryDrawer.tsx:207–255; writeHistoryLifetime.test.tsx:93–126; permissionUi.test.tsx:109 | RF-04 và bất kỳ void controller; version đổi khi popup mở phải xử lý OCC conflict theo contract, không tự lấy version mới; giữ reason/note và permission revoke giữa read/confirm/mutate |
| RF-I07 | Receipt từ immutable snapshot; initial print grant/reprint permission khác recovery; đọc/retry không tự in hoặc tạo payment | ReceiptPreview.test.tsx; writeReviewRegressions.test.tsx:85; writeHistoryLifetime.test.tsx:53–81; orderFlow.test.ts:141–193 | RF-04/07/receipt; kiểm call-count print, đúng paid portion, revoke giữa await, replay không phát grant mới |
| RF-I08 | Draft/base/dirty/cancel/no-op/selection/focus không bị remount hoặc background refetch phá; effects/listener cleanup giữ | menuEditorDrawer.test.tsx; floorEditorDrawer.test.tsx; permissionUi.test.tsx:38–54; reportHistoryDrawer.test.tsx | RF-03…06/08; characterize dirty→refetch, save→reseed, reopen, failed save, keyboard/focus và pending state |
| RF-I09 | Report range/timezone/day semantics, aggregate từ CoreReport, UUID selection và paging history giữ; loading/error/empty không bị đổi | reportHelpers.test.ts:7,59; historyHelpers.test.ts:5,16; reportHistoryDrawer.test.tsx:110–235 | RF-03/04; chart selection reset/range/section, query error/retry và zero/void aggregates theo spec, không “sửa” top-item semantics trong refactor |
| RF-I10 | Menu/floor changeset giữ tombstones/order/asset refs; image upload-before-save; geometry logical pixels; không overwrite table status | menuEditorDrawer.test.tsx:67–204; floorEditorDrawer.test.tsx:177–354; adminFlow tests theo inventory | RF-05a/b; dirty-refetch/no-op/conflict/failure/permission, resize/rotation/locked/pointer capture |
| RF-I11 | Mọi test vẫn được discover/run đúng lane/project/variant và expected skip; coverage/tsconfig resolution không đổi | vitest.config.ts:10,19–31; vitest.project-tooling.config.ts:14; project-ci.mjs:297–300; project-ci-results.mjs:25; tsconfig.node.json:13 | Mọi move và RF-09; so multiset identity, not counts only, forbidden empty suite và missing config |
| RF-I12 | CLI/API/path/realpath/trust hash/provenance giữ; không tái mở phase/ledger hoặc đổi pinned baseline thành current | release-policy.json:10; project-preview:43–44; project-release:34–35; namespace-probe:229–230; phase-admission:4–16; full-perm-plan:3–5,128–148 | RF-09; tampered path/hash/source phải bị từ chối, wrapper dispatch đúng một lần, trustedFiles migration review trước |
| RF-I13 | UI public contract: testid/text/disabled/loading/error, tab/focus/portal/ref, dimensions/layout/responsive; không giảm acceptance | existing smoke/UI-remake/audit operator contract; app component tests | Mọi TSX/UI seam; selftest23/OK rồi rendered audit + ảnh phân loại; giữ tất cả relevant configured projects |
| RF-I14 | Code WIP/private/claims/evidence và Git identity không bị tác động ngoài allowlist; revert chỉ source | git status/head/index + scoped manifest/ACL/claims identity; archive cleanup receipts | RF-00…10; publication docs index riêng/CAS, không overwrite concurrent docs, không reset WIP |
| RF-I15 | Các hành trình của tiểu luận cũ còn hiệu lực không bị mất khi refactor; expected theo spec/quyết định hiện hành, không khôi phục hành vi đã bỏ | docs/phase-scope.md và docs/test-strategy.md tại docs7e29287; ứng viên code c7f2f4e và snapshot docs21/08 có21FR/8NFR, chưa xác nhận đúng bản demo | RF-01 map hành trình→requirement hiện hành→source→test→gap; RF-10 kiểm toàn phạm vi bị ảnh hưởng, unknown lineage không được nhận đã phủ |

Tests có tham số/loop/it.each phải lấy execution identities từ runner khi có môi trường phù hợp; grep it() không đếm được đầy đủ. Một assertion có thể chứng minh nhiều invariant nhưng phải giải thích mapping.

## B2. Ma trận theo phần việc

Gates nền là bắt buộc theo docs/test-strategy.md, ngoài các gate chuyên biệt trong bảng: mỗi phần code/tooling cần npm run build + npm test; chạm core/features cần npm run test:coverage (đặc biệt RF-06/RF-07, kể cả hook nằm ngoài vùng đo); chạm UI cần npm run smoke toàn suite/project/variant hiện hành. Focused tests không thay các gate này. Command thay thế chỉ hợp lệ khi chứng minh full parity; không dùng subset affected để nhận phần UI hoàn tất. Kế hoạch/docs-only dùng review/đối chiếu theo workflow và không cần các app gates.

| Phần | Gate logic và oracle bắt buộc | UI/contract/tooling | Điều kiện chặn rõ |
| --- | --- | --- | --- |
| RF-00/01 | Manifest/diff/source identity; graph/path classification; test inventory | Không cần chạy heavy backend để “kiểm kê”; runtime discovery chỉ sau side-effect review | Checkout/source/WIP hoặc consumer unknown |
| RF-02R/03 | Report/history/helper tests; characterization mới phải chạy trên pre-refactor trước; type/build/boundary | Browser state report + ui-audit; kiểm query calls/data mapping không đổi | Chưa có baseline loading/error/empty/selection cần cho diff |
| RF-04 | Report/history + writeHistoryLifetime + permissionUi + receipt/writeReviewRegressions | Browser history/reprint/void UX; backend gate nếu execution seam thay | Dời guard/await/mutation ngoài presentation scope |
| RF-05a | menuEditor/adminFlow + lifecycle/permission; upload→save/failure/dirty/cancel | Browser editor và audit; contract nếu port/upload execution boundary thay | Dirty draft bị refetch ghi đè hoặc ảnh/changeset ngoài expected |
| RF-05b | floorEditor/adminFlow + transforms/changeset/permission; status không ghi đè | Browser pointer geometry + audit; contract nếu write boundary thay | Sai tọa độ/status/tombstone/ref/lifetime |
| RF-06 | Query cache/permission/session/UI tests cả POS/admin; exports và module identity | Relevant read contract nếu guard/adapter boundary thay; UI smoke affected | Key/purpose/polling/authority semantics drift |
| RF-07 | orderFlow + lifecycle + writeOperationFlow + receipt tests; public API và pure oracle | Payment browser gates relevant; idempotency/financial/direct permission contract nếu async/port/DTO thay | Expected tiền/selection hoặc side-effect sequence thay; thiếu backend gate khi bắt buộc |
| RF-08 | Employees sequence/revision/self-PIN/late-completion; independent mock/DTO fixtures | T05/T06/T07/T04/profile gates tùy actual seam được chọn; phải được phép và đủ environment | Backend HOLD không được tự gỡ; mock-only không đủ cho changed backend/authority contract |
| RF-09a/b/c | Resolved config + multiset discovery, selftests/negative controls, import/CLI API | Cả Windows path handling và CI Linux nơi có hợp đồng; test setup/reporter/cleanup semantics | Missing test, altered skip/retry/output ownership, unresolved consumer |
| RF-09d/e | Trusted path-set/hash transaction; tamper/namespace/source negative controls; historical preservation | Reviewer độc lập oracle/trust; controlled fixture-only invocation | Auto-rehash/rebaseline historical/deadline/claims; unknown realpath binding |
| RF-10 | Tổng hợp candidate cuối cùng của các phần đã chọn; full src/build/boundary và applicable suites; RF-I15 kiểm hành trình cũ còn hiệu lực theo impact map | Required CI/protection và UI/contract gates relevant; docs/current pointers | Không ghép PASS nhiều source để nhận toàn candidate; unresolved blocking finding hoặc hành trình bị ảnh hưởng chưa có oracle |

Gate có thể ghi NOT_APPLICABLE chỉ khi impact map và reviewer xác nhận lý do; không dùng label này để né test liên quan. Backend không bắt buộc cho một extraction thuần đã chứng minh giữ execution seam; kết luận phải ghi giới hạn. Backend bắt buộc mà chưa có quyền/môi trường → BLOCKED phần đó.

## B3. Các khoảng cần characterization, không khẳng định “chưa có test” toàn repo

1. Report: file reportHistoryDrawer.test.tsx đã có daily/7day và history. Trước pilot, tìm toàn suite rồi bổ sung phần chưa phủ về chart selection reset, section switches, loading/error/empty/retry. Snapshot JSX đơn thuần không đủ.
2. Floor: đã có test geometry, resize/rotate và changesets. Cần map dirty background refetch/no-op/save→reseed/cancel tới test; nếu chưa có, thêm trước tách state/controller.
3. Menu: đã có upload/oversize/category/ordering/tombstones. Kiểm map upload failure/late response và draft retention; không viết lại test đã đủ.
4. Employees: đã có partial revocation ở permissionUi.test.tsx:84 và no-op/applied/self-PIN ở EmployeesDrawer.permission.test.tsx. Cần map combined update→reset PIN với revision mới và stale completion; không gọi tất cả lifecycle hiện có là thiếu.
5. usePurposeQuery: chưa kết luận không có test vì không có file cùng tên. Tìm permission read/session/cache integration; bổ sung nếu move chưa được khóa enabled/live/any-of/generation semantics.
6. Tooling: pinned manifest/allowlist không được tự đổi expected khi đường dẫn đổi. Tạo mapping kiểm độc lập baseline/candidate; phân biệt test coupling với representation và yêu cầu bảo mật thực trước sửa assertion.

Mỗi gap được đóng bằng test sẵn có có bằng chứng hoặc test mới có expected độc lập. Negative control có mục tiêu: bỏ một guard/đổi một path/loại một case trong fixture cô lập phải làm verifier đỏ. Không sửa source thật hay làm hàng loạt mutation tests vô ích chỉ để đủ quy trình.

## B4. Recipe chạy — chỉ thực hiện khi bước tương ứng đã được giao

Cwd là checkout candidate sạch được chọn tại RF-00, không mặc định D:/Workspace/pos-cafe. Đọc package/config hiện thời trước dùng lại command; dependencies/browser phải đã có hoặc được phép cài với ngân sách.

- Build/type: npm run build (hiện tsc -b && vite build).
- Unit src: npm test; coverage: npm run test:coverage. Include/exclude của coverage phải giữ tương đương; lines threshold hiện90. Config này không phủ mọi hooks/TSX/backend nên không dùng90% làm chứng cứ chung.
- Boundary riêng: node node_modules/vitest/vitest.mjs run src/architectureBoundaries.test.ts --reporter=verbose.
- Pilot logic: node node_modules/vitest/vitest.mjs run src/app/reportHistoryDrawer.test.tsx src/features/admin/reportHelpers.test.ts src/features/pos/historyHelpers.test.ts --reporter=verbose, cộng test characterization được chốt.
- Payment helper logic: cùng entry Vitest, chọn orderFlow.test.ts, orderFlow.lifecycle.test.ts, writeOperationFlow.test.ts và ReceiptPreview.test.tsx bằng đường đầy đủ trong src; thêm tests của importer liên quan.
- UI: npm run ui-audit:selftest → xác nhận23 findings/selftest OK → npm run ui-audit với state config/harness đã inspect → đọc report và mở ảnh. npm run smoke đầy đủ là gate UI bắt buộc; Playwright config focused chỉ bổ sung, hoặc command tương đương phải chứng minh full suite/project/variant parity. Đọc app setup/fixtures trước chạy; giữ configured project list.
- Tooling: đọc vitest.project-tooling.config.ts và runner inventory để chạy đúng tests/**/*.tool.test.{ts,mjs}; scripts/**/*.test.mjs là lane Node riêng. Không thay bằng npm test.
- Discovery: dùng API/CLI list của runner cài hiện tại sau khi đọc config/setup/side effects; ghi chính command và resolved config vào receipt. Không kê một lệnh --list chung rồi mặc định an toàn.
- Backend: dùng runner/recipe hiện có gắn với approved spec và dedicated fixture đã được giao. Không chạy npm run test:permission:t04 hay aggregate runner để “thử xem” trong lượt kế hoạch; không dùng credential/data production. Không cấp command mutation backend từ tài liệu này.
- Mốc roadmap/demo: docs/test-strategy.md còn quy định smoke:supabase theo checkpoint và trước demo. RF-10 phải kiểm phần được nhận có đóng mục roadmap/mốc đó hay không; nếu có thì gate này và các gate chuyên biệt hiện hành phải đủ hoặc checkpoint vẫn BLOCKED. Không tự chạy khi chưa có môi trường/ủy quyền; một phần extraction độc lập không tự được ghi là đã đóng roadmap hay backend acceptance.

Bốn lane phải hiện trong manifest cho RF-I11: src Vitest; tests tool Vitest; scripts Node tests; Playwright projects/variants. Các specialized backend configs bổ sung gate theo contract/environment của chúng, không nhập bừa vào default src suite.

## B5. Manifest kết quả và so sánh

Mỗi lần chạy giữ:
- source SHA/tree hoặc fingerprint+snapshot phục hồi gồm tests/new files; base/candidate mapping; lockfile hash; runtime/tool versions;
- config resolved paths, project/browser, env names đã redacted, cwd, schema/fixture version và clock/timezone/seed;
- danh sách dự kiến và thực chạy: {lane, config, file→mapping, fullName, project, variant, expected skip/backend requirement}; dùng multiset để bắt trùng/thất thoát;
- counts executed/pass/fail/skip/deferred, exit, start/end, retry/timeout, artifacts/source attribution, failure đầu tiên và các lần tiếp theo;
- before/after oracle values hoặc port-call traces đối với invariant liên quan; screenshots cho state/viewport;
- reviewer, findings, exact candidate và phạm vi APPROVE.

Khi file test đổi đường, chuẩn hóa bằng allowlist old→new rồi so identity; không bỏ qua mọi thay đổi path. Test mới tăng count phải có requirement/gap; test mất bắt buộc giải thích và giữ invariant, không tự bỏ vì rename. Artifact logs không được ghi credential/raw private payload.

## B6. Review checklists ngắn

Reviewer nghiệp vụ/lifecycle:
- Có guard, payload, singleton, async timing, state mount nào đổi ngoài seam không?
- Oracle độc lập hay copy logic mới? Existing tests còn kiểm public behavior không?
- Có kiểm current và stale success/error, full/split/void/reprint, dirty/refetch/revision không?
- Backend gate yêu cầu đã đúng phạm vi và trạng thái?

Reviewer tooling/Git:
- Consumer map đủ runtime/CLI/config/docs/fixture/trust không?
- Test multiset, coverage paths, setup/reporter/output/skip/retry có tương đương không?
- Historical pins/ledger/private giữ nguyên? Wrapper/realpath/platform contracts giữ?
- Baseline/candidate/rollback/docs publication đúng identity, không ghi đè WIP/concurrent docs?

Kết luận reviewer chỉ xác nhận candidate/phạm vi được đọc và kiểm; không thay acceptance của chủ dự án hoặc deployment permission.
