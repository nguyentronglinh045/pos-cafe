# T02 — Chẩn đoán CI payment cũ: gán lỗi của reporter và lỗi UI

Ngày lập: 28/10/2026. Phạm vi: đối chiếu source và bằng chứng CI hiện có, phân tích cách gán thông tin lỗi và đề xuất sửa. **Phân tích đã hoàn tất; chưa sửa code, chưa chạy test/app/CI/backend và chưa cập nhật trust pin.** Mọi lệnh trong [kế hoạch kiểm chứng](verification-plan.md) ở trạng thái `NOT_RUN`. [Bản bàn giao kỹ thuật](../../workflow/tasks/g01-g10-t02-2026-10-28.md) ghi phần việc tiếp theo.

Ký hiệu dùng trong tài liệu:

- `@052` = main hiện hành `052a7d1e156425ea82ed1c9cf978d7ef4d4f3571`.
- `@0dd` = main của lần FAIL `0dd63ea81b27a38800044a55a7f9c8f12f87cad0` (tree `12e8e64bd3df60ee3b1be55ec42f3cd5de35b746`).
- `@docs` = docs đầu vào `9fbd68657884155feb9f7680875f5da1356919e9`, dùng cho các hồ sơ lịch sử.
- `@docs7df` = docs hiện hành `7df10ada2b66628ab14b51f953fc7dd111d762dc` (T01 đã xuất bản); chỉ dùng cho quy tắc bằng chứng `docs/workflow/README.md:78` và số execution của T01.
- `PW` = bản thư viện Playwright 1.60.0 đã cài, chỉ đọc; version trong `package.json` khớp `package-lock.json` của `@052`, chưa đối chiếu integrity archive. Số dòng trích dẫn thuộc bản thư viện này. `RHT` = `react-hot-toast/dist/index.js` 2.6.0; đây là file nén 178 dòng, số dòng trích là dòng của file nén.
- Số dòng `scripts/*`, `playwright*.config.ts` là của `@052`; các file này giống từng byte ở `@0dd` (mục 4). Số dòng `src/*` và `tests/*` là của `@0dd` trừ khi ghi khác.

## 1. Kết luận ngắn

1. **Lỗi gán thông tin chẩn đoán: có căn cứ từ source và thư viện.** Tooling không gắn marker với test thất bại: reporter không ghi danh tính test, parser lấy marker hợp lệ đầu tiên của toàn lượt. Marker đã công bố (`smokeFailureLine=6`, `smokeFailureColumn=3`, `smokeStepCategoryOrdinal=2`, `smokeStepDurationMs=8`) phù hợp với **một vòng poll** của helper `expectUncovered`; helper này dùng chung cho hai test closeout ở bốn project landscape. Vòng đó có thể thuộc một poll đã PASS ở test khác, một poll đã PASS trước đó trong chính test payment (E2, mục 5.1), hoặc là vòng đầu của chính poll hết hạn; dữ liệu hiện có không phân biệt được. Marker 8 ms **không thể** là step poll tổng hết hạn (hạn 5000 ms). `smokeProgressIndex=81/81` chỉ là số test đã bắt đầu, không phải vị trí test fail. Nhãn `TEST_TIMEOUT` là regex trên toàn bộ text; status thật là `failed`, không phải `timedOut`.
2. **Cơ chế gán sai còn nguyên trên `@052`**: reporter, parser, collector và hai Playwright config không đổi byte nào từ `@0dd`. Run PASS 40442640979 trên `@052` không chứng minh đã sửa nguyên nhân cũ.
3. **Metric core không phải bằng chứng crash**: fixture `core.1` + hardlink `core.2` do test node-tools tạo trong `TMPDIR` của task và không được dọn, giải thích đúng `coreFileCount=1`, `coreAllocatedBytes=4096`. Guard còn bắt buộc giới hạn core dump bằng 0.
4. **Nguyên nhân lỗi ứng dụng: UNKNOWN, chưa có giả thuyết dẫn đầu.**
   - Đã bác bằng dữ liệu: test **không** hết timeout toàn test (status `failed` sau 11.310 ms, hạn 60.000 ms); test **không** thực hiện payment write hoặc authority continuation (spec :40-83 không bấm trả tiền).
   - Không quan sát được nhưng **chưa loại trừ**: crash trình duyệt và áp lực tài nguyên. Dữ liệu còn giữ không có signature crash nào parser nhận diện, counter cgroup OOM/PID bằng 0, và metric core là fixture. Tuy vậy smoke không bật `pw:protocol`, output thô không còn, và counter cgroup không phủ mọi dạng áp lực CPU/RAM. Vì vậy chỉ ghi "chưa có căn cứ quy lỗi cho crash/tài nguyên" (S12).
   - Suy luận mức trung bình: lỗi cuối không nằm trong `loginAsAdmin`, không phải `toBeVisible/toBeHidden`, và không phải một thao tác phải chờ actionability.
   - Còn mở bốn hướng H1–H4, chưa xếp hạng; H5 (tranh chấp CPU) chỉ là yếu tố khuếch đại. H1: toast trên luồng ghép thiết bị/đăng nhập (hai nguồn đã xác định: "Đã ghép thiết bị" và toast chào mừng) che control trong cửa sổ poll; cần thêm một điều kiện giữ toast, ví dụ toaster bị pause chung khi hover, mà chưa xác định được. H2: bố cục cuộn lồng nhau. H3: chuyển động/animation che tạm thời. H4: trạng thái chọn món chưa cập nhật kịp hoặc thao tác lỗi nhanh.

## 2. Nguồn, mốc và cách xác minh

| Mục | Giá trị | Xác minh ngày 28/10/2026 |
| --- | --- | --- |
| Code hiện hành | `@052` | `git ls-remote origin refs/heads/main` khớp; source đối chiếu bằng `git show` tại SHA này |
| Docs đầu vào | `@docs` | Mốc khảo sát ban đầu; các hồ sơ lịch sử được đọc bằng `git show` tại SHA này |
| Docs hiện hành | `@docs7df` | Đối chiếu `refs/heads/docs`; hồ sơ T01 đã xuất bản tại mốc này |
| Source của lần FAIL | `@0dd`, tree `12e8e64…`, là tổ tiên của `@052`, cách 22 commit | `git merge-base --is-ancestor`, `git rev-list --count` |
| Run FAIL | [40089941679/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40089941679), push, head `@0dd`, `completed/failure` | GitHub API chỉ đọc |
| Run PR cùng tree | [40088569310/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40088569310), pull_request, head `a028cc5b…`, `completed/success` | GitHub API chỉ đọc; tree trùng `12e8` theo [diagnosis lịch sử](https://github.com/nguyentronglinh045/pos-cafe/blob/9fbd68657884155feb9f7680875f5da1356919e9/docs/implementation-log/permission-backend-web-release-20261023/permission-main-main01-diagnosis.md) |
| Run PASS trên main hiện hành | [40442640979/a1](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40442640979), push, head `@052`, `completed/success` | GitHub API chỉ đọc |
| Summary lịch sử | `permission-main-main01-summary.json` (bản bằng chứng lưu trữ), SHA256 `4077a48c71e2f9626ee4b8b883c0bed14985a4b4fba26bc7aceb079c5454582d` | Hash khớp hồ sơ |
| Collection lịch sử | `permission-main-main01-collection.json` (bản bằng chứng lưu trữ), SHA256 `a4ae874731d17dbf56964a81db871afb0d645f9410f2d410c19e6ef998c28fd7` | Hồ sơ không ghi hash collection; ghi lại để tham chiếu. Hash summary và workflow log ghi trong collection đều khớp file thực |
| Workflow log | `permission-main-main01-workflow.log` (bản bằng chứng lưu trữ), SHA256 `cbd23d4eb673e31474652c3187bdb93d9fcf57c8397cf1a89a6cfbaea2408820` | Gồm các bước setup, dòng phase, JSON evidence pg16 và JSON summary; không có output Playwright thô |
| Bảng nguồn | [sources.json](sources.json) | SHA nguồn, run và hash các bằng chứng lưu trữ; không chứa output thô |
| Output smoke thô | Không tồn tại ngoài runner | `scripts/project-ci.mjs:1` giữ output thô trên runner dùng một lần |
| Trace của test fail | Không có | `playwright.config.ts:13` là `on-first-retry`; smoke chạy `--retries=0` (`scripts/project-ci.mjs:363`) |
| Hồ sơ lịch sử đã đọc | diagnosis main01; `docs/workflow/tasks/permission-main-integration-2026-10-24.md`; `docs/workflow/tasks/refactor-safety-2026-10-25/merge-20261027.md`; `docs/workflow/tasks/ui-main-docs-integration-2026-10-25.md`; `docs/implementation-log/ui-main-docs-integration-review-2026-10-25.md`; `docs/implementation-log/permission-ui-audit-triage-2026-09-28.md` | Đọc tại `@docs` bằng `git show` |

## 3. Evidence: quan sát, suy ra, giả thuyết, chưa biết

### 3.1 Quan sát được

| ID | Nội dung | Nguồn |
| --- | --- | --- |
| O1 | 15 phase trước smoke PASS; smoke FAIL exit 1; `ui-selftest`, `ui-audit` không có trong summary (không chạy) | summary; `scripts/project-ci.mjs:286` dừng sau phase FAIL |
| O2 | 43 expected / 1 unexpected / 37 skipped / 0 flaky; `failedFiles=[tests/smoke/permission-ui-closeout.spec.ts]`; `smokeTestLine=40`; `smokeFailureProjectOrdinal=3` | summary; ordinal 3 = `phone-landscape` theo `scripts/project-ci-results.mjs:14` |
| O3 | `smokeResultStatusOrdinal=1` (= `failed`), `smokeResultDurationMs=11310`, `smokeConfiguredTimeoutMs=60000` | summary; `scripts/project-ci-results.mjs:401-403` |
| O4 | `codes=[COMMAND_FAILED, TEST_TIMEOUT, RESULT_INVALID]` | summary |
| O5 | Marker: `smokeFailureLine=6`, `smokeFailureColumn=3`, `smokeStepSourceOrdinal=3`, `smokeStepCategoryOrdinal=2`, `smokeStepDurationMs=8`; không có `smokeStepLocatorOrdinal`, `smokeStepApiOrdinal`, `smokeHelperLine`, `browserCrashBeforeFailedStep` | summary; ordinal 3 = `tests/smoke/permission-ui-closeout.spec.ts` (`scripts/project-ci-results.mjs:89-90`), ordinal 2 = `expect` (:99) |
| O6 | `smokeProgressIndex=81`, `smokeProgressTotal=81` | summary |
| O7 | `oomEvents=0`, `oomKills=0`, `pidsLimitEvents=0`, `peakMemoryBytes=3369963520` (giới hạn cgroup 8 GiB), `coreFileCount=1`, `coreAllocatedBytes=4096`, `kernelCorePipe=0` | summary; giới hạn tại `scripts/project-ci.mjs:183`; ba counter đọc từ `memory.events` và `pids.events` của cgroup (:206-208) |
| O8 | Cùng tree `12e8` đã PASS ở PR CI 40088569310 | API (`success`) và hồ sơ diagnosis/integration tại `@docs` |
| O9 | Test payment thuộc phạm vi chạy ở desktop, tablet-landscape, phone-landscape, small-landscape; chỉ portrait bị skip theo applicability. Với 1 unexpected ở phone-landscape, ba project còn lại PASS | `ci/smoke-applicability.json` tại `@0dd` (key `portrait\|permission-ui-closeout.spec.ts\|40\|…`); O2 |
| O10 | Main `@052` có run 40442640979 PASS trong phạm vi light CI | API; hồ sơ merge-20261027 |

### 3.2 Suy ra từ source/thư viện

| ID | Suy ra | Căn cứ | Độ mạnh |
| --- | --- | --- | --- |
| S1 | Test không hết timeout toàn test. `TEST_TIMEOUT` khớp các thông điệp `Timeout: 5000ms` hoặc `Timeout 5000ms exceeded while waiting on the predicate` của assertion tự chờ | O3; regex `scripts/project-ci-results.mjs:500` quét toàn `privateText`; thông điệp poll `PW/lib/matchers/expect.js:12583`; config không đặt `expect.timeout` (mặc định 5000 ms) | Mạnh |
| S2 | `RESULT_INVALID` là hệ quả của test fail, không phải lỗi riêng: `smokeCounts` từ chối report có `unexpected≠0` | `scripts/project-ci-results.mjs:706-708`, `guardFailureCode` :363; collector gọi `readCounts` cả khi exit≠0 rồi gán `failureCode` (`scripts/project-ci.mjs:233,236`) | Mạnh |
| S3 | Marker 8 ms là step `expect` của **một vòng poll**, không phải step poll tổng hết hạn | Mỗi vòng `expect.poll` gọi `callMatcherAsStep` với `poll: undefined` (`PW/lib/matchers/expect.js:12938-12955`), tạo step `category: "expect"` (:12875-12881), `complete({error})` khi lỗi (:12886) rồi poll tiếp. Điều này đúng cả với vòng đầu của một poll mà cuối cùng hết hạn. Step có error luôn gửi `onStepEnd` (`PW/lib/worker/workerProcessEntry.js:2399-2465`). Step poll tổng chỉ fail khi tới hạn 5000 ms | Mạnh |
| S4 | Marker có thể đến từ **bất kỳ** lần gọi `expectUncovered`, ở bất kỳ test closeout và project nào, **kể cả chính test fail** | Helper `tests/smoke/permission-ui-closeout.spec.ts:4-11` được gọi ở :30, :33 (employees) và :51, :62, :66, :81 (payment); reporter bỏ qua tham số test (`scripts/project-ci-results.mjs:131`); parser lấy marker đầu toàn lượt (:480-499); smoke chạy `--workers=2` với `fullyParallel` (`scripts/project-ci.mjs:363`, `playwright.config.ts:10`) | Mạnh |
| S5 | `smokeProgressIndex=81/81` là bộ đếm test đã bắt đầu, không phải vị trí test fail | Line reporter tăng `_current` ở `onTestBegin` và in `[current/total]` (`PW/lib/runner/index.js:4402-4404, 4443`); parser lấy lần khớp cuối `.at(-1)` (`scripts/project-ci-results.mjs:478-479`) | Mạnh |
| S6 | Metric core được giải thích đầy đủ bởi fixture; metric này không phải crash dump | Test tạo `core.1` 32 byte + hardlink `core.2` trong `os.tmpdir()`, không dọn (`scripts/project-ci-results.test.mjs:751-759`); node-tools chạy với `TMPDIR=<task>/tmp` (`scripts/project-ci.mjs:65, 190, 300`); guard quét thư mục task (:218), nhận core theo tên (:97), khử trùng inode (:90-92). Guard bắt `Max core file size 0 0` và `core_pattern=core` (:79-82, 198-201) nên tiến trình được giám sát không ghi core dump của kernel. S6 chỉ vô hiệu việc dùng `coreFileCount` làm bằng chứng crash, không chứng minh không có crash | Mạnh |
| S7 | Text được quét không chứa mẫu nào của `expect(locator).toBeVisible/toBeHidden`, not-found/hidden, browser-closed/context-destroyed/protocol, renderer crash, hay `locator.click/fill/press/check/waitFor`; suy ra lỗi cuối không thuộc các mẫu đó | Các regex `scripts/project-ci-results.mjs:504-523` quét cả message/stack của kết quả fail trong JSON report (:412-413), nhưng không code nào xuất hiện. `LOCATOR_ACTION` (:512) **không** bắt `uncheck`, `focus`, `getAttribute`, `innerText`, `scrollIntoViewIfNeeded`, `evaluate` | Trung bình (suy luận từ việc vắng mặt) |
| S8 | Lỗi cuối không phải một thao tác đang chờ actionability | Config không đặt `actionTimeout` (`playwright.config.ts:11-17`), nên thao tác chờ actionability chỉ dừng ở timeout toàn test 60.000 ms và cho status `timedOut`. Status thực là `failed` sau 11.310 ms (O3). Chưa loại trừ thao tác **lỗi nhanh** (ví dụ `uncheck` :52 báo trạng thái không đổi) | Trung bình |
| S9 | Lỗi cuối không nằm trong `loginAsAdmin` (beforeEach) | Không có `smokeHelperLine`; regex :474-477 sẽ bắt `tests/smoke/helpers.ts:N:M` nếu stack lỗi đi qua helper | Trung bình |
| S10 | Lỗi phụ thuộc thời gian/thứ tự có khả năng cao hơn lỗi bố cục xác định thuần túy | O8 (cùng tree từng PASS) và O9 (small-landscape 740×360 nhỏ hơn vẫn PASS trong cùng run). Chỉ có hai lượt quan sát | Trung bình |
| S11 | Điểm thất bại cuối thuộc một trong các nhóm sau, chưa chọn được dòng cụ thể: (a) assertion tự chờ 5000 ms trong test payment (`:49`, `:51/:62/:66/:81` qua helper, `:53`, `:54`, `:61`, `:64`, `:69`, `:72-74`, `:77-79`); (b) assertion tức thời `:56`; (c) thao tác lỗi nhanh không bị regex bắt. Với (b) và (c), text khớp `TEST_TIMEOUT` phải đến từ nơi khác trong output | S1, S7, S8, S9; thời lượng 11.310 ms gồm cả đăng nhập | Yếu |
| S12 | Khả năng quan sát crash của phase smoke hẹp hơn preflight; vắng signature không chứng minh không có crash | Smoke đặt `DEBUG='pw:browser,pw:webserver'` (`scripts/project-ci.mjs:361`), preflight có thêm `pw:protocol` (:356). Không có `pw:protocol` thì hai đường `Inspector.targetCrashed`/`Target.targetCrashed` (`scripts/project-ci-results.mjs:448-461`) không có dữ liệu; không có `pw:api` thì regex `Page crashed` (:465) cũng không có dòng để khớp. Còn lại dòng `Received signal` của `pw:browser` (:446-447) và các regex trên message lỗi. O7 chỉ là ba counter cgroup | Mạnh (về phạm vi quan sát) |

### 3.3 Giả thuyết về lỗi ứng dụng (chưa chứng minh, chưa xếp hạng chắc)

| ID | Giả thuyết | Ủng hộ | Chống / khoảng trống |
| --- | --- | --- | --- |
| H1 | Toast trên luồng ghép thiết bị/đăng nhập còn hiển thị và che control đang được `expectUncovered` kiểm, khiến `elementFromPoint` trả về toast trong suốt cửa sổ poll 5000 ms. Hai nguồn đã xác định: `PAIRING_TOAST` "Đã ghép thiết bị" và `LOGIN_TOAST` chào mừng | **Chuỗi phát toast tại `@0dd`:** runtime mock bắt đầu với `state.paired = false` (`src/app/runtimePorts.ts:37-38`), nên `loginAsAdmin` đi nhánh ghép thiết bị khi màn landing hiển thị (`tests/smoke/helpers.ts:7-11`). Ghép thành công phát `toast.success("Đã ghép thiết bị")` (`src/app/screens/StorePairingScreen.tsx:33`). Sau đó mở khóa phát toast chào mừng (`src/app/screens/PasscodeScreen.tsx:55`). **Toaster:** `bottom-right`, `duration: 2400`, chưa có `pointerEvents: "none"` (`src/app/AppProviders.tsx:48-53`). **RHT 2.6.0:** `pausedAt` là trạng thái chung của toaster, `pauseDuration` cộng cho mọi toast khi hết pause (dòng 2); container gắn `onMouseEnter: startPause`, `onMouseLeave: endPause` và xếp chồng toast bằng `calculateOffset` (dòng 178). Vì vậy khi con trỏ nằm trong vùng toaster, **cả hai** toast cùng dừng đếm giờ, và hai toast chiếm vùng cao hơn một toast. **Bố cục:** ở viewport <900 px, các control được kiểm nằm ở cột phải (`src/app/drawers/pos/PaymentSummaryPane.tsx:66-258`), cùng phía với toaster. **Lịch sử:** hồ sơ tại `@docs` ghi lượt local `69c516c` từng FAIL vì "toast chào mừng che nút thanh toán (hover giữ toast)" (`docs/workflow/tasks/ui-main-docs-integration-2026-10-25.md:23`). Commit `cf8e304` thêm `pointerEvents: "none"`, có regression RED→GREEN ở 844×390. Triage 28/09 ghi toast đăng nhập che một phần nút hoàn tất | Không có quan sát nào từ run 40089941679 về toast, con trỏ hay thời điểm. Chưa biết hai toast còn hiển thị hay chồng nhau lúc fail. Cả hai được phát trước :41 và tự ẩn sau 2400 ms nếu không bị pause; để fail, ít nhất một toast phải được giữ qua các click :41/:42 và cả cửa sổ poll, và chưa xác định cơ chế giữ nào khớp với status `failed` sau 11.310 ms. Bàn B02 có sẵn đơn `open` trong mock (`src/adapters/mock/mockData.ts:137-153`); draft không đổi nên hành động chính là `"payment"` (`src/features/pos/orderFlow.ts:225-234`), và click :42 gọi `openPayment` mà không bắn toast (`src/app/drawers/pos/OrderDrawer.tsx:175-184`); toast `"Đã in/gửi đơn."` (:166) chỉ thuộc nhánh submit. Chưa rà mọi nguồn toast khác có thể xuất hiện trên luồng; recipe vẫn phân loại `OTHER_TOAST`. `69c516c` có giao diện thanh toán B03 khác `@0dd`, và bằng chứng thô của lượt đó nằm ngoài phạm vi đối chiếu này; nhận định ở đây chỉ dựa vào tài liệu lịch sử đã dẫn |
| H2 | Bố cục cuộn lồng nhau làm control vẫn bị phần khác che sau `scrollIntoViewIfNeeded` | `src/app/drawers/pos/PaymentDrawer.tsx:264` vùng `overflow-auto`; :278 lưới `min-w-[720px]` và `[@media(max-height:600px)]:min-h-[560px]` (viewport cao 390); `PaymentSummaryPane.tsx:66` `overflow-hidden`, :98 danh sách `overflow-y-auto`. Triage 28/09 ghi checkbox món bị phần tổng tiền che ở màn hẹp (source cũ hơn) | Bố cục thuần túy phải fail ổn định, nhưng cùng tree đã PASS ở PR CI và small-landscape PASS trong cùng run (S10). Có thể chỉ gây lỗi khi kết hợp với thời điểm tải dữ liệu hoặc cuộn |
| H3 | Chuyển động hoặc animation (drawer mở, toast trượt vào/ra, cuộn mượt) che control tạm thời | Poll có vòng lỗi trung gian (S3). Drawer có animation 180 ms (`src/app/components/PortalDrawer.tsx:45-48`); toast có keyframes riêng (RHT dòng 173) | Chuyển động thường hết trong cửa sổ 5000 ms; khó tự gây fail cuối |
| H4 | Trạng thái chọn món/số lượng không cập nhật kịp (`toHaveAttribute` :53/:64/:69/:73/:74/:77/:78, `toBeDisabled` :54), hoặc thao tác lỗi nhanh (`uncheck` :52) | Tương thích với S1, S7, S8 | Chưa khảo sát logic chọn món; phần source được đối chiếu ở đây giới hạn ở UI/hit-test/layout |
| H5 | Tranh chấp CPU (2 worker, `cpu.max` 3 CPU) khuếch đại H1, H2 hoặc H3 | `scripts/project-ci.mjs:183, 363` | Chỉ là yếu tố khuếch đại, không phải nguyên nhân độc lập |

S10 nghiêng nhẹ về các hướng có yếu tố thời gian (H1, H3, H5) hơn là bố cục xác định thuần túy (H2), nhưng chỉ dựa trên hai lượt quan sát nên không đủ để xếp hạng. H1 phải xét cả toast chào mừng, toast ghép thiết bị và cơ chế pause chung của toaster. Dù vậy H1 vẫn thiếu điều kiện giữ toast đã quan sát, nên tài liệu này **không chọn giả thuyết dẫn đầu**. Phát hiện về toast thứ hai chỉ mở rộng tập giả thuyết, không chứng minh toast nào là nguyên nhân.

**Đã bác bằng dữ liệu:** hết timeout toàn test (S1, O3); payment write và authority continuation (spec :40-83 không bấm trả tiền).

**Không quan sát được, chưa có căn cứ quy lỗi:** crash Chromium (S6, S7, S12), cạn RAM/PID theo phạm vi counter cgroup (O7), mất dữ liệu. Các mục này không được coi là đã loại trừ tuyệt đối.

### 3.4 Chưa biết

| ID | Điều chưa biết | Vì sao | Cách làm rõ |
| --- | --- | --- | --- |
| U1 | Dòng, assertion và thông điệp của lỗi cuối | Output thô không được giữ; vị trí từ stack (:466-473) bị marker ghi đè (:493-498); không có trace | Sửa attribution, sau đó chạy recipe R-APP |
| U2 | Có chạm trần 32 marker hay không, tổng số marker | Không có output thô | TC-T02-08 sau khi sửa |
| U3 | Test/project nào phát marker đầu, kể cả có phải chính test fail hay không | Marker không mang danh tính test | TC-T02-02, TC-T02-07 |
| U4 | Lúc fail có toast nào (`PAIRING_TOAST`, `LOGIN_TOAST`, `OTHER_TOAST`) đang hiển thị hay không, toaster có đang pause không, con trỏ ở đâu, control nào bị che, phần tử che là gì | Không có diagnostics hit-test hoặc vòng đời toast | R-APP V1/V2/V4 |
| U5 | Tần suất fail trên `@0dd` | Chỉ có 1 PASS (PR) và 1 FAIL (main) | R-APP V1, đếm số lượt payment thực chạy |
| U6 | `@052` (UI B03 + sửa toast) còn fail không định kỳ hay không | Chỉ có 1 run PASS | R-APP V5 |
| U7 | Có crash trình duyệt hoặc áp lực tài nguyên ngoài phạm vi counter cgroup trong run lịch sử hay không | S12; output thô không còn | Không làm rõ được cho run lịch sử; recipe chỉ quan sát lượt mới |

## 4. Delta source `@0dd` → `@052`

| Nhóm | File | Liên quan | Nhận xét |
| --- | --- | --- | --- |
| Reporter/parser/collector/config | `scripts/project-ci-results.mjs`, `scripts/project-ci-results.test.mjs`, `scripts/project-ci.mjs`, `playwright.config.ts`, `playwright.project-ci.config.ts` | Trực tiếp với attribution | **Giống từng byte.** Lỗi gán còn nguyên |
| Test closeout | `tests/smoke/permission-ui-closeout.spec.ts` | Có | :25-26 đổi đếm hàng employees sang `expect.poll` (thêm một nguồn vòng poll trung gian); :59 đổi `locator("h4")` sang `getByRole("heading")` theo UI mới. Các dòng 1-21 và 40-83 giữ số dòng |
| Spec smoke khác | `tests/smoke/pos-cafe.spec.ts` (viết lại phần lớn), `tests/smoke/report-presentation.spec.ts` (mới, 88 dòng) | Gián tiếp | Không nằm trên đường test payment. Đổi số execution: 81 ở `@0dd` (43+1+37, O2) thành 86 theo T01 (`@docs7df` `docs/workflow/tasks/g01-g10-t01-2026-10-28.md:32`). `report-presentation.spec.ts` chưa có trong `SMOKE_STEP_FILES` (`scripts/project-ci-results.mjs:89-90`) |
| Helper smoke | `tests/smoke/helpers.ts` | Không trực tiếp | Chỉ đổi `waitForStageFit`; test closeout không gọi. Nhánh ghép thiết bị :7-11 giữ nguyên |
| Toast | `src/app/AppProviders.tsx` (`cf8e304`) | Trực tiếp với H1 | Thêm `style: { pointerEvents: "none" }` tại `@052` :54 |
| Giao diện thanh toán | `PaymentDrawer.tsx`, `PaymentSummaryPane.tsx`, `PaymentCashierPane.tsx`, `paymentShared.tsx`, `paymentRemake.css` (+828 dòng), `usePaymentViewport.ts`, `usePaymentDialogFocus.ts`; `tailwind.config.ts`, `tailwind.posCafeStyles.ts`, `tailwind.remakeStyles.ts` (+806 dòng) | Trực tiếp với H2 | Bố cục và style được làm lại (B03); cấu trúc cuộn của `@0dd` không còn |
| Đường đi của test | `PortalDrawer.tsx`, `OrderDrawer.tsx`, `OrderCartPane.tsx`, `FloorWorkspace.tsx`, `src/features/pos/orderFlow.ts` (tách helper sang `orderDraft.ts`) | Gián tiếp | Thay đổi vị trí control/drawer trên luồng mở thanh toán; `orderFlow` giữ orchestration theo hồ sơ refactor |
| Applicability và pin | `ci/smoke-applicability.json`, `ci/release-policy.json` | Gián tiếp | Cập nhật key B03 và pin của applicability, helpers, ui-audit; pin reporter/parser không đổi |
| Không liên quan | Refactor report, `usePurposeQuery`, theme, `LeftNav`, tài liệu/đo lường `ui-remake/` | Không | Không nằm trên đường test payment |

Vì `@052` đồng thời có bản sửa toast, UI thanh toán mới và có thể chỉ gặp thời điểm thuận lợi, **lượt PASS 40442640979 không phân biệt được** ba khả năng đó. Lỗi cũ chỉ tái hiện có ý nghĩa trên `@0dd`.

## 5. Chẩn đoán reporter, tách khỏi lỗi ứng dụng

### 5.1 Chuỗi sự kiện cụ thể dẫn tới gán sai

1. Worker A chạy một test closeout bất kỳ ở một project landscape. Vòng đầu của `expect.poll` trong `expectUncovered` trả `false` (ví dụ trong lúc cuộn) rồi vòng sau trả `true`; test PASS.
2. Vòng lỗi tạo step `expect` có error (`PW/lib/matchers/expect.js:12881-12886`). Reporter nhận `onStepEnd` và in `PROJECT_SMOKE_FAILED_STEP {categoryOrdinal:2,file:"tests/smoke/permission-ui-closeout.spec.ts",line:6,column:3,durationMs:8,…}` (`scripts/project-ci-results.mjs:126-131`). Bộ đếm `emitted` tăng; trần 32 tính cho **toàn lượt** (:125-127).
3. Các vòng poll trung gian khác tiếp tục tiêu thụ trần. Khi đạt 32, mọi marker sau đó, kể cả lỗi cuối, đều bị bỏ.
4. Worker B chạy test payment phone-landscape; một assertion hết hạn 5000 ms. Nếu còn trần, step lỗi cuối và các `test.error` của `onTestEnd` (:132-135) được in **sau** marker của bước 2.
5. Parser: :466-473 lấy vị trí đầu tiên dạng `tests/smoke/<file>:L:C` trong output + message (có thể là vị trí lỗi thật; không xác minh được vì output không được giữ), rồi vòng marker :480-499 **ghi đè** bằng marker hợp lệ đầu tiên. Các metric step dùng `??=` riêng từng key (:486-492) và vị trí dùng điều kiện riêng (:493-498), nên các metric này cũng không có bảo đảm cùng một event. `browserCrashBeforeFailedStep` (:443, :463) cũng so với marker đầu.
6. `smokeProgressIndex` lấy dòng `[n/m]` cuối (:478) nên ra `81/81`. `TEST_TIMEOUT` lấy từ regex trên toàn text (:500).
7. Public summary chỉ lọc theo allowlist (:748-779), không kiểm các metric có cùng một test hay không.

Biến thể cũng sai:

- E2: vòng poll trung gian trong chính test fail, rồi lỗi cuối ở dòng khác. Marker trỏ đúng test nhưng sai vị trí.
- E3: hai test fail ở hai file. Khi đó `smokeTestLine` theo thứ tự duyệt report còn `smokeFailureLine` theo thứ tự thời gian của marker.
- E4: khi `retries>0`, `failed[0]` là lần thử đầu chứ không phải kết quả cuối (:402-403). CI hiện dùng `--retries=0`.
- E5: timeout/duration/status (:401-403) lấy từ test fail đầu tiên bất kể file, còn `smokeTestLine`/project (:405-410) lấy từ test fail đầu tiên có file hợp lệ. Khi test fail đầu tiên có file ngoài danh sách, hai nhóm metric thuộc hai test khác nhau.

Với run 40089941679, kịch bản 1-7 và E2 đều khớp dữ liệu; U3 vẫn mở. Đây là phản ví dụ từ source, chưa phải tái hiện run lịch sử.

### 5.2 Tests hiện có bảo vệ gì

| Test (`scripts/project-ci-results.test.mjs`) | Bảo vệ | Chưa bảo vệ |
| --- | --- | --- |
| :409-438 "failure reporter retains the actual failed step location…" | Một step lỗi + `onTestEnd` của cùng lỗi; trần 32; loại bỏ text riêng tư; marker giả bị bỏ qua; reporter không có `onEnd` (:418). Test truyền report `null` và lấy metric từ marker | Poll trung gian rồi PASS; nhiều test; thứ tự; lỗi cuối khác marker đầu; trần bị tiêu thụ trước lỗi cuối |
| :379-398 "smoke timeout exposes only finite API stage…" | Vị trí từ stack trong report khi không có marker | Có marker cạnh tranh |
| :640-651 "failed Playwright diagnostics…" | `[9/81]` khi chỉ có một dòng tiến độ | Nhiều dòng tiến độ; khẳng định ngầm ngữ nghĩa "dòng cuối" |
| :179-196 (:185-189), :218-230 (:224-226) | Thứ tự crash so với marker `PROJECT_SMOKE_FAILED_STEP` cho `browserCrashBeforeFailedStep`; text protocol không tạo lỗi giả | Marker trung gian của test khác làm sai thứ tự |
| :705-717 "failed Vitest diagnostics…" | Vitest `failureMessage` có text hết hạn vẫn cho `TEST_TIMEOUT`; `failedFiles` từ `testResults`; không lộ text riêng tư | Phương án A không được làm đổi kết quả của test này (mục 6.1, A9) |
| :751-759 "allocation facts deduplicate…" | Khử trùng inode/hardlink | Chính test này để lại fixture core trong `TMPDIR` của CI |

Phase `runtime-reporters` kiểm một reporter khác của permission runtime. Ngoài `scripts/project-ci.mjs` (phase `smoke-preflight` :358 và `smoke` :363) và các file test/consumer ở mục 6.2, không file nào dùng `scripts/project-ci-results.mjs` làm reporter Playwright. Không có test nào chạy `SmokeFailureReporter` với Playwright thật.

## 6. Kế hoạch sửa tối thiểu (đề xuất, chưa áp dụng)

### 6.1 Phương án

| Phương án | Nội dung | Đánh đổi |
| --- | --- | --- |
| **A — khuyến nghị** | Xem đặc tả A1–A11 bên dưới | Hai file runtime (riêng `scripts/project-ci.mjs` chỉ đổi một lời gọi, A6) và một file test, tức ba pin; giữ tên key public và danh mục code; thêm một marker nội bộ mới; ngữ nghĩa metric smoke đơn trị đổi từ SHA áp dụng |
| B | A + gắn code với test được chọn (ví dụ mask code của error cuối), key public mới cho dòng gọi helper và số marker trung gian bị bỏ, code `EXPECT_TIMEOUT` riêng | Đổi allowlist (:757-758, :768) và danh mục code (:350-359); thêm việc review consumer và docs. Chỉ nên làm nếu A chưa đủ cho chẩn đoán |
| C | Chỉ sửa parser, giữ reporter | Reporter vẫn in marker trung gian và tiêu thụ trần; dễ bị dùng sai lại |
| D | Giữ code, chỉ ghi giới hạn vào docs | Metric public tiếp tục gây hiểu sai. **Không khuyến nghị** |

**Nguyên tắc của A:** mọi metric smoke đơn trị của một phase lấy từ **một test entry duy nhất** trong JSON report Playwright và kết quả cuối của entry đó. Reporter chỉ bổ sung các metric step, qua một bản ghi khớp đúng entry đó bằng khóa duy nhất. Không trộn dữ liệu của test khác, attempt khác, output toàn phase hoặc marker cũ. Khi không xác định được chắc chắn thì metric vắng mặt; status, exit và FAIL của phase không đổi.

**Đặc tả phương án A:**

- **A1 — Phạm vi.** Chỉ đổi reporter (`scripts/project-ci-results.mjs:124-136`), nhánh Playwright của `privateDiagnostics` (report có `suites` là mảng, :394-415), và các đoạn :443-499 dùng marker, vị trí, helper, tiến độ. Hai phase nạp reporter là `smoke-preflight` (`scripts/project-ci.mjs:358`) và `smoke` (:363). Ở collector chỉ đổi lời gọi `privateDiagnostics` tại `scripts/project-ci.mjs:243` để truyền thêm cờ `outputComplete` (A6). **Không đổi:** nhánh Node TAP (early return khi không có report, :383), nhánh Vitest (`testResults`, :418-423), metric pg16/edge (:387-388), UI watch control, `browserRuntimeControlFacts`, `browserNativeFatalFacts`, cách nhận crash signal/protocol (:444-462), bảng regex code (:500-525) và `failedFiles` (:526-530).
  - **Thay đổi ở mọi phase, không chỉ smoke:** tại `@052`, bất kỳ phase FAIL nào cũng có thể sinh `smokeHelperLine` (:474-477, vì `expectedFiles` là toàn bộ đường dẫn tracked), `smokeProgressIndex/Total` (:478-479) và metric marker (:480-499) từ output. Theo A3, A6 và A8, các metric này chỉ còn xuất hiện khi chọn được T từ report Playwright, nên chúng biến mất khỏi diagnostics của các phase khác. Codes, `failedFiles`, `num*`, metric Node TAP/pg16/edge và crash facts của các phase đó không đổi, trừ `browserCrashBeforeFailedStep` vắng mặt vì không có bản ghi khớp T (A7).
- **A2 — Chọn test T.** Duyệt `report.suites` như hiện tại (BFS, tối đa 10.000 suite). T là test entry đầu tiên thỏa đồng thời: file spec hợp lệ theo quy tắc :404-405 hiện có, và kết quả cuối `R = results.at(-1)` có status `failed` hoặc `timedOut`. Chỉ khi không có entry nào như vậy mới chọn entry đầu tiên có `R.status = interrupted`. Lý do: test `interrupted` là hệ quả của việc dừng lượt chạy, ví dụ sau `--max-failures`, khi runner gán `status = interrupted` và `errors = []` (`PW/lib/runner/index.js:5276-5278`); nó không phải lỗi gốc và không có error để lấy vị trí.
  - **Duyệt report đầy đủ** (`reportComplete`) khi BFS dừng với hàng đợi rỗng và không suite nào bị bỏ vì trần 10.000. Ba chỗ có thể bỏ suite là cắt mảng `report.suites` ban đầu (:394), dừng vòng lặp khi hàng đợi còn phần tử (:395) và cắt mảng `suites` con (:397). Khi duyệt chưa đầy đủ, T vẫn có thể là test `failed`/`timedOut` đã gặp, và status, vị trí, duration vẫn lấy từ chính T. Tuy vậy, nhánh `interrupted` ở trên không được áp dụng, vì không chứng minh được phần chưa duyệt không có test `failed`/`timedOut`. Mọi metric dựa vào bản ghi cũng vắng mặt (A6).
  - Test có kết quả cuối `passed` hoặc `skipped` không bao giờ được chọn, kể cả khi attempt trước fail. Trường hợp fail→pass vì vậy không có metric terminal; `smokeCounts` vẫn từ chối mọi test có hơn một kết quả (:699).
  - Từ T và R: `smokeTestLine` = `spec.line`; `smokeFailureProjectOrdinal` theo `test.projectName`; `smokeResultStatusOrdinal` theo `R.status`; `smokeResultDurationMs` = `R.duration`; `smokeConfiguredTimeoutMs` = `test.timeout`.
  - `failedFiles` giữ cách tính hiện tại (mọi file có test fail, ≤32).
- **A3 — Vị trí lỗi.** `smokeFailureLine/Column`, `smokeStepSourceOrdinal` và `smokeHelperLine` chỉ lấy từ **error đầu tiên của R**: cặp `R.errors[0]` (đã format) và `R.error` (thô) mô tả cùng một error; khi `errors` rỗng thì chỉ còn `R.error`. Các nguồn xét theo thứ tự dưới đây. Một nguồn vắng hoặc bị A4 từ chối thì chuyển sang nguồn kế tiếp **của cùng error đó**; hết nguồn thì vắng mặt. Không bao giờ dùng `errors[1..]`, test khác, output toàn phase hoặc marker.
  1. `R.errors[0].location` trong JSON (khi `errors` rỗng: `R.error.location`). JSON reporter tạo phần tử này bằng `formatError`: lấy `error.location`, thiếu thì lấy vị trí suy từ stack (`PW/lib/runner/index.js:1436-1460`). Phần tử `errors[]` đã format chỉ có `location` và `message`, **không có `stack`** (:4017).
  2. `R.errorLocation`: JSON reporter tính từ `R.error.stack` thô bằng `prepareErrorStack` (:4031-4032; :1472-1473).
  3. Frame đầu tiên hợp lệ theo A4 trong `R.error.stack` thô; JSON giữ nguyên `result.error` (:4016).

  `smokeHelperLine` = dòng của nguồn đã nhận nếu file là `tests/smoke/helpers.ts`, nếu không thì dòng của frame `helpers.ts` đầu tiên trong `R.error.stack`; vắng nếu không có. **Giới hạn:** lỗi bên trong helper dùng chung, ví dụ `expectUncovered` (spec :4-11), cho dòng của helper (:6), không cho dòng gọi (:51/:62/:66/:81). A không tự suy ra call site; việc đó thuộc phương án B.
- **A4 — Kiểm hợp lệ đường dẫn.** Chuẩn hóa `\` thành `/`, bỏ tiền tố `root`. Từ chối đường dẫn có phần `.` hoặc `..`, có `%2e`, `%2f`, `%5c`, hoặc là `file:` URL có host/search/hash (theo cách `nodeTapFailureDiagnostics` đang làm, :63-71). Đường dẫn tương đối phải khớp `^tests/smoke/[A-Za-z0-9_./-]+\.(?:ts|mjs)$`, thuộc `expectedFiles` (collector truyền danh sách `git ls-files`, `scripts/project-ci.mjs:169, 243`), **và** thuộc `SMOKE_STEP_FILES`. Danh sách này được mở rộng chỉ bằng cách **thêm vào cuối** `tests/smoke/report-presentation.spec.ts` (ordinal 5), để ordinal 1-4 giữ nguyên nghĩa. `smokeStepSourceOrdinal` là ordinal file của vị trí đã nhận. `smokeFailureLine/Column` chỉ xuất cùng `smokeStepSourceOrdinal`. Dòng và cột nằm trong 1..1.000.000.
- **A5 — Reporter.**
  - `onBegin(config)`: lưu `config.rootDir`. Đây là thư mục mà JSON reporter dùng để tính `spec.file` (`_relativeLocation`, `PW/lib/runner/index.js:3945-3953`).
  - **Khóa error.** `errorKey(e)` là SHA-256 hex của `JSON.stringify([e.message, e.stack])`. Khóa chỉ được tính khi `message` và `stack` đều là chuỗi, mỗi chuỗi dài không quá 1 MiB, và `stack` có ít nhất một dòng frame. Không cắt chuỗi rồi mới băm, để hai error khác nhau không trùng khóa chỉ vì trùng phần đầu. Thiếu một điều kiện thì error đó không có khóa.
    - Căn cứ trên PW 1.60.0: step lỗi và test lỗi mang cùng một error, được serialize theo cùng một cách. Worker gán `step.error = testInfoError(result.error)` (`PW/lib/worker/workerProcessEntry.js:2435-2439`), và `_failWithError` đưa `testInfoError(error)` vào `errors` (:2512-2520). Payload IPC giữ nguyên `message` và `stack` (`PW/lib/common/index.js:1824-1835`). Runner gán thẳng `step.error` (`PW/lib/runner/index.js:5348-5349`) và `result.errors` (:5288-5289). `addLocationAndSnippetToError` chỉ thêm `location`/`snippet`, không đổi `stack` (:1781-1800).
    - `ExpectError` đặt message ở đầu `stack`, tiếp theo là frame tại chỗ gọi assertion (`PW/lib/matchers/expect.js:11622-11629`). Vì vậy hai assertion cùng message ở hai dòng khác nhau có khóa khác nhau.
    - Step `box`: worker viết lại `stack` của step bằng `message` đã serialize cộng frame của box (`workerProcessEntry.js:2436-2438`), và viết lại `stack` của test error bằng `name: message` của error thô cộng cùng frame (:2517-2519). Message đã serialize vốn có tiền tố `name: ` (`filterStackTrace`, :1429-1437), và step con kế thừa `boxedStack` của step cha (:2408). Vì vậy khi `error.name` không rỗng, hai `stack` bằng nhau, khóa khớp step trong cùng và metric step có mặt. Chỉ khi `error.name` rỗng thì hai chuỗi lệch nhau (`message` so với `: message`), khóa không khớp và metric step vắng.
  - `onStepEnd(test, result, step)`: không in gì. Chỉ xét step có `step.error` và error đó có khóa. Bộ đệm gắn với **chính đối tượng `TestResult`**; mỗi attempt là một đối tượng riêng. Bộ đệm của một result là `Map` từ khóa error tới `{count, step, fields}`. `fields` là các trường hữu hạn của `smokeStepDiagnostic` hiện có (category/API/locator ordinal, duration). `step` là tham chiếu tới đối tượng `TestStep` trong bộ nhớ, chỉ dùng để so quan hệ cha–con và không bao giờ được in.
    - **Khóa đã có trong map.** Đi ngược `parent` từ step đã lưu, tối đa 64 cấp (quá 64 cấp thì coi như không gặp); runner đặt `parent` cho step ở `PW/lib/runner/index.js:5323`. Nếu gặp step hiện tại, step hiện tại là step cha mang lại cùng error, nên bỏ qua, không đếm. Hai đường lan như vậy là soft error lan lên step cha (`workerProcessEntry.js:2447-2453`) và lỗi ném xuyên qua `test.step`. Nếu không gặp, tăng `count`, bão hòa ở 2. Step con luôn kết thúc trước step cha, nên step được lưu đầu tiên của một khóa là step trong cùng nhất.
    - **Khóa chưa có.** Lưu với `count = 1` nếu map còn dưới 128 khóa. Map đã đủ 128 khóa thì khóa mới **không được lưu, và không khóa cũ nào bị loại**. Hệ quả: `count` của mọi khóa đang lưu là chính xác, vì một khóa chỉ vào map ở lần xuất hiện đầu và mọi lần xuất hiện sau đều được đếm. Khóa không có trong map thì không biết `count`.
    - Tối đa 64 `TestResult` đang mở. Khi đã đủ 64, result mới không được đệm. Phần dữ liệu reporter tự tạo trong bộ đệm (khóa của map, `count`, `fields`) chỉ gồm khóa SHA-256 dạng 64 ký tự hex và số nguyên; **không chứa chuỗi thô** (message, stack, title, đường dẫn). Tham chiếu `step` là tham chiếu không trong suốt tới đối tượng Playwright vốn đã nằm trong bộ nhớ suốt lượt chạy. Reporter chỉ dùng nó để so danh tính khi đi ngược `parent`, không đọc trường chuỗi, không sao chép và không in; tham chiếu được bỏ ở `onTestEnd`. Bộ đệm không ảnh hưởng status.
    - Trần 128 khóa nhằm chứa các lần poll lỗi tạm của nhiều assertion trong một test trước lỗi cuối. Lỗi tạm của một assertion lặp lại cùng message và stack nên chỉ chiếm một khóa. Nếu trần vẫn đầy trước lỗi cuối thì metric step vắng, không bị ghép sai.
  - `onTestEnd(test, result)`: lấy rồi xóa bộ đệm của `result`. Chỉ khi `result.status` là `failed`, `timedOut` hoặc `interrupted` thì in một dòng `PROJECT_SMOKE_TERMINAL_STEP {...}` với đúng các khóa:
    - `schemaVersion: "pos-smoke-terminal-v1"`;
    - `caseDigest`: SHA-256 hex của chuỗi `${projectName}|${file}|${line}|${title}`. Đây là cùng định dạng khóa discovery của `smokeCases` (:671). Trong đó `projectName = test.parent.project()?.name`, `file` là đường dẫn POSIX tương đối với `config.rootDir`, `line = test.location.line`, `title = test.title`. Chỉ in digest, không in title hay file;
    - `retry`: `result.retry`, số nguyên 0..100;
    - `statusOrdinal`: 1/2/3 cho `failed`/`timedOut`/`interrupted`;
    - `step`: `fields` của khóa `errorKey(result.errors[0])`, chỉ gồm `categoryOrdinal`, `apiOrdinal`, `locatorOrdinal`, `durationMs`. Chỉ có giá trị khi đồng thời: result đã được đệm, `result.errors[0]` có khóa, map có khóa đó và `count = 1`.
    - Mọi trường hợp khác cho `null`. Cụ thể: error đầu không có khóa (thiếu stack, dài hơn 1 MiB, giá trị ném ra không phải `Error`); khóa không có trong map (không step nào mang error đó, ví dụ test timeout, hoặc map đầy trước khi step đó kết thúc); `count = 2` (hai step không lồng nhau có cùng message và stack, ví dụ assertion lặp ở cùng dòng); result không được đệm.
    - Không chọn theo thứ tự "mới nhất" hay "đầu tiên". Thứ tự chỉ dùng để biết step nào kết thúc trước khi so quan hệ cha–con.
  - Các trường hợp cần phân biệt:
    - Hai soft assertion cùng message ở dòng X và Y có stack khác nhau, nên khóa khác nhau. Error đầu là X, nên `step` là step của X, không bao giờ là của Y.
    - Poll hết hạn: mỗi vòng poll là một step con với lỗi riêng (`PW/lib/matchers/expect.js:12947-12957`), còn step poll tổng mang message cuối có thêm call log (:12958-12965). Error đầu của test là error của step poll tổng, nên khóa khớp step poll tổng; các vòng con có khóa khác và không ảnh hưởng.
    - Poll lỗi tạm ở dòng X rồi PASS, sau đó lỗi cuối cùng message ở dòng Y: hai stack khác dòng nên khóa khác nhau, `step` là step của Y. Nếu lỗi tạm và lỗi cuối cùng dòng, cùng message và không lồng nhau thì `count = 2`, `step = null`.
  - Mỗi dòng tối đa 512 byte. Trần 32 dòng mỗi lượt chỉ tính dòng terminal. Không thêm `onEnd`, không đổi status.
- **A6 — Parser khớp bản ghi với T.**
  - Tính `digest(T)` từ JSON bằng `${test.projectName}|${spec.file}|${spec.line}|${spec.title}`.
  - **Mô hình dòng, dùng chung cho A6 và A7.** A6 và A7 có luồng dòng riêng `outputLines`: lấy **riêng** tham số `output`, bỏ chuỗi điều khiển ANSI/VT bằng `stripVTControlCharacters`, rồi tách theo `/\r\n|\r|\n/` (cùng regex với :428). Chỉ số dòng của A6 và A7 là chỉ số trong `outputLines`. Text lấy từ report không bao giờ thuộc luồng này.
    - Không suy vùng output từ `rawLines`. `rawLines` được tạo bằng cách nối `output` với text report bằng `\n` (:393, :412-413, :424) rồi mới tách (:428). Khi `output` kết thúc bằng `\r`, ký tự này ghép với `\n` được chèn thành một CRLF, nên dòng đầu của report rơi vào số dòng tính từ output riêng (xem TC-T02-18 và TC-T02-25).
    - Các scanner khác giữ nguyên phạm vi trên `rawLines`/`privateText`: crash facts (:445-462), regex code (:500-525) và UI watch control.
    - Thứ tự xử lý cố định: strip toàn bộ `output` trước, rồi mới tách dòng, giống cách `rawLines` strip trước khi tách (:424, :428). Nếu tách trước rồi strip từng dòng, `X\r\x1b[0m\nY` cho `["X", "", "Y"]` thay vì `["X", "Y"]`. Thứ tự tương đối và số ứng viên không đổi, nhưng chỉ số tuyệt đối thì đổi, nên triển khai phải theo đúng thứ tự trên.
  - **Dòng ứng viên** là mọi dòng của `outputLines` có chứa chuỗi `PROJECT_SMOKE_TERMINAL_STEP` ở bất kỳ vị trí nào, kể cả dòng dài, sai định dạng hoặc nằm giữa text khác. Parser đếm ứng viên trên **toàn bộ** `outputLines` mà không parse JSON. Marker xuất hiện trong text report không phải ứng viên và không làm tăng số ứng viên. Có hơn 64 ứng viên thì trạng thái là OVERFLOW và không parse dòng nào.
  - Khi có tối đa 64 ứng viên, một ứng viên là **bản ghi** khi thỏa cả ba điều kiện: phần sau khoảng trắng đầu dòng bắt đầu bằng `PROJECT_SMOKE_TERMINAL_STEP `; dòng dài tối đa 1024 byte; JSON có đúng tập khóa ở A5 và đúng miền giá trị. Ứng viên không thỏa bị bỏ qua nhưng vẫn tính vào trần. Dòng định dạng cũ `PROJECT_SMOKE_FAILED_STEP` không phải ứng viên và bị bỏ qua hoàn toàn.
  - Một bản ghi khớp T khi `caseDigest = digest(T)`, `retry = R.retry` và `statusOrdinal` trùng `R.status`.
  - **Chỉ nhận bản ghi khi thỏa đồng thời bốn điều kiện:**
    1. `outputComplete` là `true`;
    2. report được duyệt đầy đủ (A2) và `digest(T)` xuất hiện đúng một lần trong report;
    3. không OVERFLOW;
    4. có đúng một bản ghi khớp T.

    Khi đó `smokeStepCategoryOrdinal`, `smokeStepApiOrdinal`, `smokeStepLocatorOrdinal`, `smokeStepDurationMs` lấy từ `step` của bản ghi; `step` là `null` thì các metric này vắng.
  - Thiếu bất kỳ điều kiện nào thì trạng thái là AMBIGUOUS: mọi metric step và `browserCrashBeforeFailedStep` (A7) vắng mặt. Các trường hợp gồm: không có bản ghi khớp; hai bản ghi khớp trở lên (trùng lặp, giả, hoặc `--repeat-each` cùng khóa); `digest(T)` không duy nhất; report duyệt chưa đầy đủ; OVERFLOW; output không đầy đủ. Nguyên tắc: một match trong phần đã đọc không chứng minh có đúng một match trong toàn bộ dữ liệu, nên phần chưa đọc hoặc đã bị cắt không bao giờ được coi là không có bản ghi trùng. `smokeCases` đã từ chối khóa trùng trong CI (:677-678), nhưng parser vẫn tự kiểm.
  - **Cờ `outputComplete`** là tham số mới, đặt cuối của `privateDiagnostics`, mặc định `true` để giữ hành vi của các lời gọi hiện có (test, `permission-edge-probe.test.mjs:76`, `permission-runtime-pg16.test.mjs:12-13`, probe điều khiển `scripts/project-ci.mjs:263` với report `null`). Collector truyền `result.blocked === false` tại `scripts/project-ci.mjs:243`.
    - Lý do: khi collector dừng lệnh vì `OUTPUT_LIMIT` (:126), `COMMAND_TIMEOUT` (:131) hoặc guard (:130), `blocked` được bật (:116-118) và mọi chunk đến sau đó bị bỏ (:124-128). Phần bị bỏ có thể chứa bản ghi terminal mà reporter in khi Playwright xử lý tín hiệu dừng. Parser không tự biết output đã bị cắt.
    - Khi lệnh ném lỗi trước khi có kết quả, `result` giữ giá trị khởi tạo `blocked: true` (:230), nên cờ cũng là `false`.
  - Vị trí (A3) **không** lấy từ bản ghi, nên thứ tự dòng trong output không ảnh hưởng vị trí. Ở mọi trạng thái trên, status, vị trí và duration vẫn lấy từ JSON của T theo A2–A3, phase vẫn FAIL, và không trạng thái nào biến FAIL thành PASS.
  - Bộ nhớ: bản strip của `output` là thêm một bản sao tối đa 32 MiB, vì collector đã giới hạn output ở mức đó (`scripts/project-ci.mjs:109`), cộng với mảng dòng của nó. Tối đa 64 lần parse, mỗi lần tối đa 1024 byte.

  Lý do không dựa vào `spec.id`: JSON reporter chỉ gộp spec của các project khi phép so đường dẫn tại `PW/lib/runner/index.js:3969` khớp; phép so này gọi `path.relative(config.rootDir, spec.file)` trên `spec.file` vốn đã tương đối, nên phụ thuộc thư mục làm việc. Với cấu hình CI (`rootDir` = `<root>/tests/smoke` theo `lib/common/index.js:563`, cwd = `<root>` theo `scripts/project-ci.mjs:232`), spec **không** được gộp: mỗi project có spec riêng và `spec.id` = `test.id` của project đó, đúng hình dạng fixture hiện có (`scripts/project-ci-results.test.mjs:616-629`). Khi cwd trùng `rootDir`, spec được gộp (:3968-3974) và chỉ còn id của project đầu (:3994). Khóa digest ở trên phân biệt được hai file cùng dòng (khác `file`), test tham số hóa cùng vị trí (khác `title`), project khác nhau và attempt khác nhau (`retry`), và đúng với cả hai hình dạng report.
- **A7 — `browserCrashBeforeFailedStep`** (:443, :463, allowlist :768). Nghĩa mới: dòng crash đầu tiên mà parser đã nhận (`Received signal` của `pw:browser`, hoặc event protocol khi có `pw:protocol`) đứng trước dòng `PROJECT_SMOKE_TERMINAL_STEP` **đã được nhận cho T** theo A6. Cả hai chỉ số lấy trong `outputLines` theo mô hình dòng của A6: parser áp cùng các mẫu crash của :446 (`Received signal`) và :448-456 (event `Inspector.targetCrashed`/`Target.targetCrashed`) lên `outputLines` để tìm dòng crash đầu tiên của output. Dòng crash chỉ nằm trong text của report không được dùng cho metric này, kể cả khi output kết thúc bằng `\r`. Crash facts khác vẫn quét `rawLines` như cũ (A1). Không có bản ghi được nhận thì vắng, kể cả khi A6 cho AMBIGUOUS vì OVERFLOW, report duyệt chưa đầy đủ hoặc output không đầy đủ. Metric chỉ nói thứ tự trong output so với `onTestEnd` của T. Nó không chứng minh crash thuộc T, xảy ra trước assertion lỗi, hay là nguyên nhân lỗi. Ở phase smoke chỉ còn đường `Received signal` (S12).
- **A8 — `smokeProgressIndex/Total`.** Không điền nữa vì không có nguồn gắn với test fail. Áp dụng ở mọi phase. Key vẫn nằm trong allowlist (:774); vắng mặt là hợp lệ.
- **A9 — Code chẩn đoán: không đổi.** Mọi code giữ phạm vi quét hiện tại: output phase cộng message/stack của mọi error trong report (:393, :412-413, :418-423, :500-525). `TEST_TIMEOUT` vẫn nghĩa là "có text hết hạn ở đâu đó trong phase". Phân biệt test timeout với assertion hết hạn bằng `smokeResultStatusOrdinal` của T.
  - Lý do giữ phạm vi code hiện tại: nếu chỉ quét error của test được chọn ở mọi "phase có JSON report" thì sẽ chạm cả unit/tooling (Vitest JSON, `scripts/project-ci.mjs:296-299`) và làm hỏng regression :705-717. Code là tập đa trị và không tạo metric đơn trị ghép sai. Gắn code với test chuyển sang phương án B.
  - Các nhóm code giữ nguyên phạm vi: (a) Vitest/coverage: `VITEST_ASSERTION`, `VITEST_RUNTIME`, `COVERAGE_LINES`; (b) message lỗi: `TEST_TIMEOUT`, `ASSERTION_ERROR`, `TYPE_ERROR`, `REFERENCE_ERROR`, `ASSERTION_VISIBLE`, `LOCATOR_*`, `SELECTOR_*`, `EXPECT_LOCATOR_REQUIRED`, `PAGE_NAVIGATION`, `FIXTURE_SETUP/TEARDOWN`; (c) trình duyệt/tiến trình: `BROWSER_*`, `BROWSER_CLOSED`, `CONTEXT_DESTROYED`, `PROTOCOL_ERROR`, `OUT_OF_MEMORY`, `MODULE_NOT_FOUND`, `BROWSER_RENDERER_CRASH` và các metric crash/native fatal; (d) `REPORT_MISSING`, `NODE_TEST_FAILURE`, các code guard/collector.
- **A10 — `smoke-preflight`.** Dùng cùng reporter với `--workers=1`, một test, `DEBUG` có `pw:protocol` (`scripts/project-ci.mjs:356-359`). Diagnostics preflight theo A2–A8; phần trace diagnostics (:244-248) không đổi. Kiểm bằng TC-T02-19.
- **A11 — Report thiếu hoặc hỏng.** Khi report `null` (thiếu file, JSON lỗi, :241-242) hoặc `suites` không phải mảng: không chọn được T, nên mọi metric smoke đơn trị, kể cả metric step từ bản ghi, vắng mặt. `REPORT_MISSING`, codes và crash facts giữ như hiện tại, trừ `browserCrashBeforeFailedStep` vắng mặt vì không có bản ghi khớp T (A7). So với code hiện tại, việc này mất metric step khi thiếu report. Chấp nhận mất mát này vì không xác minh được bản ghi thuộc test nào.

Điều kiện tiên quyết của A (TC-T02-17): trên Playwright 1.60.0 thật, xác nhận hình dạng `errors[0].location`, `errorLocation`, `error.stack` cho poll hết hạn, `toHaveAttribute` hết hạn và test timeout. Đồng thời xác nhận `caseDigest` của reporter bằng `digest(T)` tính từ JSON, với cùng test chạy ở ít nhất hai project. Xác nhận thêm rằng khóa error của step mang lỗi bằng khóa của `result.errors[0]` với poll hết hạn, `toHaveAttribute` hết hạn và soft assertion, và ghi số step cùng khóa. Nếu nguồn vị trí không có, metric vắng mặt theo A3. Nếu khóa không bằng ở loại lỗi nào, metric step của loại đó vắng theo A5; ghi lại và báo trước khi viết code, không nới quy tắc, không quay lại marker toàn lượt.

Metric core (S6): sửa ở test, không sửa collector. Dọn thư mục fixture bằng `t.after` trong `scripts/project-ci-results.test.mjs:751-759`, hoặc tạo fixture ngoài cây được guard quét. Không đổi `allocatedBytes`. Ghi rõ trong docs rằng `coreFileCount` chỉ là đếm theo tên.

### 6.2 Tập file ảnh hưởng

| File | Thay đổi | Ghi chú trust/schema |
| --- | --- | --- |
| `scripts/project-ci-results.mjs` | `SMOKE_STEP_FILES` :89-90 (thêm cuối một file); reporter :124-136; chữ ký `privateDiagnostics` :380 (thêm tham số cuối `outputComplete = true`); nhánh Playwright :394-415; :443, :463 (thứ tự crash); :466-499 (vị trí, helper, tiến độ, marker). Không đổi :383, :418-423, :500-530 | Được pin tại `ci/release-policy.json:14` |
| `scripts/project-ci.mjs` | Chỉ lời gọi :243 truyền thêm `result.blocked === false` (A6). Không đổi capture, guard, phase, reporter nạp ở :358 và :363, lời gọi probe :263 | Được pin tại `ci/release-policy.json:13` |
| `scripts/project-ci-results.test.mjs` | Thêm regression TC-T02-01…26 (kể cả 03b–03e, 05a–d, 07b, 07c) thuộc tầng U; sửa kỳ vọng :185-189, :224-226, :409-438 (đang dùng report `null` + marker), :640-651; sửa fixture :379-398 để truyền `root='/private/source'` (A4 bỏ tiền tố root), giữ nguyên kỳ vọng 121/14 và các assert riêng tư; giữ nguyên :705-717; dọn fixture :751-759 | Được pin tại `ci/release-policy.json:39` |
| `ci/release-policy.json` | Cập nhật đúng ba hash trên (:13, :14, :39) trong **cùng thay đổi đã review** | `scripts/permission-full-target-policy.test.mjs:5` buộc pin khớp canonical Git bytes; `scripts/project-release.mjs:33-37` so cả tập đường dẫn lẫn hash; `scripts/project-preview.mjs:39-41` giới hạn ≤64 file (hiện đúng 64). Không thêm/bớt đường dẫn pin |
| Hai Playwright config, workflow | Không đổi | Pin giữ nguyên |
| Consumer khác của `project-ci-results.mjs` | Không đổi code; phải chạy lại node-tools | `permission-edge-probe.test.mjs`, `permission-runtime-pg16.test.mjs`, `permission-runtime-admission(.test).mjs`, `permission-batch-budget(.test).mjs`, `permission-runtime-pin-ui(.test).mjs`, `permission-runtime-pg16-cleanup.mjs`, `permission-full-target-policy.test.mjs`, `project-preview(.test).mjs`, `project-release.mjs` |
| Docs (`testing.md`, `regression-map.md`, kế hoạch G01–G10) | Ghi ngữ nghĩa mới của metric smoke đơn trị, `browserCrashBeforeFailedStep`, giới hạn dòng helper và việc bỏ `smokeProgressIndex` kể từ SHA áp dụng | Không so metric trước/sau như cùng nghĩa |

**Schema: cần chủ dự án chốt trước khi giao triển khai** (điều kiện G10 trong kế hoạch kiểm chứng). Tài liệu đề xuất giữ `schemaVersion: pos-cafe-light-ci-v1`, kèm mốc SHA ghi trong docs.

- Lý do: `scripts/permission-batch-budget.mjs:243,323` và `scripts/permission-runtime-admission.mjs:48` chỉ chấp nhận đúng `v1`. Nâng version buộc sửa thêm hai consumer này và test của chúng.
- Đánh đổi: với `v1`, các key `smokeFailureLine/Column`, `smokeStepSourceOrdinal`, `smokeStep*`, `smokeHelperLine`, `browserCrashBeforeFailedStep` đổi nghĩa và `smokeProgressIndex/Total` thôi xuất hiện, trong khi tên schema không đổi. Người đọc summary phải đối chiếu `sourceSHA` với mốc trong docs. Nếu chủ dự án muốn tách bạch bằng version, chọn `v2` và mở rộng phạm vi sửa sang hai consumer đó.
- Lựa chọn nào cũng áp dụng nhất quán cho toàn bộ A1–A11; không trộn.
- B cần quyết định riêng về schema.

### 6.3 Rủi ro và cách giữ an toàn

- **Trust:** cập nhật hash chỉ hợp lệ khi diff của ba file đã được review độc lập; không cập nhật pin chỉ để qua gate.
- **Không làm xanh giả:** reporter chỉ quan sát, không có `onEnd` (giữ assert `scripts/project-ci-results.test.mjs:418`), không đổi status/exit. Collector vẫn FAIL khi exit≠0 (`scripts/project-ci.mjs:235, 279-286`). Không đổi retries, timeout, expected, skip hoặc applicability.
- **Riêng tư:** bản ghi chỉ gồm ordinal, số nguyên và một SHA-256 của khóa discovery. So khớp error chỉ dùng khóa SHA-256 của message và stack trong bộ nhớ reporter; dữ liệu reporter tự tạo trong bộ đệm không chứa chuỗi thô, còn tham chiếu step chỉ dùng để so danh tính. Không thêm message, title, đường dẫn tuyệt đối, DOM hay PIN vào output hoặc summary; giữ trần byte hiện có.
- **Mất thông tin:** bỏ marker trung gian làm mất dấu "đã có poll lỗi tạm"; thông tin này không phải bằng chứng lỗi. Thiếu report làm mất metric step (A11). Metric step còn vắng khi không chứng minh được step mang đúng error đầu (A5: error có `name` rỗng trong step `box`, assertion lặp cùng dòng cùng message, bộ đệm đầy) hoặc không chứng minh được bản ghi duy nhất (A6: OVERFLOW, report hoặc output chưa đầy đủ). Đây là đánh đổi có chủ ý: vắng metric thay vì ghép metric của error khác. Lỗi trong helper dùng chung chỉ cho dòng helper (A3). Nếu cần các thông tin này, B có thể thêm key hữu hạn.
- **Đổi nghĩa metric crash:** `browserCrashBeforeFailedStep` đổi mốc so sánh (A7) và vẫn không phải bằng chứng nhân quả. Nếu chủ dự án muốn giữ nghĩa cũ thì cần thêm bản ghi "step lỗi cuối" có thời điểm, tức phương án B.
- **Phụ thuộc thư viện:** cấu trúc step của `expect.poll`, việc step lỗi và test lỗi giữ cùng `message`/`stack`, quan hệ `parent` của step, cách JSON reporter gộp hoặc tách spec theo project (phụ thuộc cwd), hình dạng `errors[]`/`error`/`errorLocation` và `config.rootDir` là hành vi của Playwright 1.60.0. Nâng version phải chạy lại TC-T02-01 và TC-T02-17 ở tầng P.

## 7. Phần UNKNOWN và phép thử phân biệt

Nguyên nhân ứng dụng giữ **UNKNOWN** cho tới khi recipe R-APP trong [verification-plan.md](verification-plan.md) được giao và chạy trên `@0dd`. Các phép thử phân biệt:

- So V1 (nguyên `@0dd` + diagnostics) với V2 (V1 + chỉ dòng `pointerEvents: "none"`). H1 được ủng hộ nếu thỏa cả ba điều kiện:
  - V1 có fail với phân loại hit-test là `PAIRING_TOAST`, `LOGIN_TOAST` hoặc `OTHER_TOAST`;
  - vòng đời toast và trạng thái pause (V1/V4) cho thấy toast đó còn hiển thị lúc fail, cùng điều kiện giữ toast (ví dụ con trỏ trong vùng toaster);
  - V2 không fail qua cùng số lượt payment thực chạy.
- Phân loại phần tử che là phần khác trong drawer (tổng tiền/footer) ở cả V1 và V2: ủng hộ H2.
- V3 đổi `reducedMotion`, tác động **cả** animation drawer lẫn animation toast; V3 PASS không tách riêng hai nguồn chuyển động.
- Fail ở `toHaveAttribute/toBeDisabled` hoặc thao tác lỗi nhanh, không kèm che khuất: ủng hộ H4.
- Không tái hiện sau số lượt đã định: giữ UNKNOWN; không coi là đã sửa.

## 8. Trạng thái và bước tiếp theo

Phân tích source/evidence và phương án kiểm chứng đã hoàn tất. Cơ chế gán sai thông tin lỗi vẫn còn tại `@052`; nguyên nhân lỗi UI lịch sử vẫn **UNKNOWN**. Kết quả CI PASS về sau không chứng minh lỗi cũ đã được xác định hoặc sửa.

1. Chốt schema `v1`/`v2` theo mục 6.2 và phạm vi triển khai phương án A.
2. Kiểm pipeline Playwright ở TC-T02-17, triển khai phần được chấp thuận với regression tương ứng; rà diff trước khi cập nhật ba pin.
3. Thực hiện các tầng U/P/C và recipe R-APP theo phạm vi, nguồn và điều kiện đã xác nhận. Không tái hiện được thì giữ UNKNOWN.
4. Sau khi có bản sửa và kết quả kiểm chứng, cập nhật `docs/testing.md` và `docs/regression-map.md` với TC-T02-01…26, nghĩa mới của metric, giới hạn dòng helper, việc bỏ `smokeProgressIndex` và ý nghĩa của `coreFileCount`/`TEST_TIMEOUT`.

Chi tiết trạng thái ở [bản bàn giao T02](../../workflow/tasks/g01-g10-t02-2026-10-28.md); mọi expected trong kế hoạch vẫn là tiêu chí chưa thực thi.
