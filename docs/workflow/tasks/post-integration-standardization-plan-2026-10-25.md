# Kế hoạch rà soát và chuẩn hóa sau tích hợp — 25/10/2026

## Điểm điều phối mới — 27/10/2026

Khi hỏi cần làm gì tiếp, đọc [bảng G01–G10 hiện hành](../g01-g10-plan.md#next) và handoff task được chọn. Kế hoạch NC bên dưới giữ phạm vi/tiêu chí và lịch sử; không dùng các dòng chưa thực hiện ngày25/10 để yêu cầu làm lại merge UI, dọn worktree hoặc [đợt refactor đã chốt](refactor-safety-2026-10-25/merge-20261027.md#closure-20261027). Các gap nghiệp vụ/kiểm chứng, inventory và HOLD được nối vào bảng mới, không tự đóng hoặc mở quyền thực hiện.

## Ưu tiên đang áp dụng — docs trước refactor

Ngày25/10/2026, sau tích hợp UI, chủ dự án giao **kiểm tra và chỉnh lý nhánh docs**, không chỉ lập kế hoạch. [Handoff docs-first](docs-normalization-2026-10-25.md) ghi source, phạm vi, kết quả và phần WIP/evidence cần giữ. Quyết định này đưa NC-10 và **phần kiểm kê tài liệu của NC-02** lên trước refactor. Không mở NC-04…08, deploy, backend acceptance hoặc cleanup worktree.

Phần spec/evidence WIP được xử lý tiếp tại [handoff xuất bản](docs-wip-publication-2026-10-25.md); có inventory/hash và đề nghị dọn bản lặp chờ duyệt. Không mở refactor hoặc cho xóa worktree từ kết quả tài liệu này.

Trình tự hiện hành: nguồn UI đã merge711a22e → docs-first (NC-10 + docs inventory NC-02) → NC-02 bản đồ code/NC-03 chốt slice khi được giao → refactor có gate. NC-01 và NC-11 toàn hệ thống vẫn chưa đóng. NC-10 tiếp tục đồng bộ theo từng slice sau này; hoàn tất chỉnh lý docs không có nghĩa toàn NC-02/NC-10 của chương trình đã hoàn tất.

Các phần quyết định NC-UI và kế hoạch cũ dưới đây được giữ làm lịch sử/phạm vi tham chiếu; ưu tiên mới ở mục này thay thứ tự khởi đầu cũ.


## Quyết định thực hiện NC-UI ngày 25/10/2026

Chủ dự án đã giao phiên mới **merge UI vào main và docs, xử lý hậu quả rồi xóa đúng nhánh đã merge; chưa cần chủ động CI**. [Handoff thực hiện](ui-main-docs-integration-2026-10-25.md) là nguồn trạng thái hiện hành. Quyền này thay các dòng chỉ-lập-kế-hoạch/không-merge bên dưới cho NC-UI; những dòng đó được giữ làm lịch sử phiên lập kế hoạch. Không mở refactor, cleanup worktree, deploy hay backend holds.

Dependency đang áp dụng: NC-00 bảo toàn nguồn UI → NC-UI-B (#11/#12) → NC-UI-C/D (#13/#14, retarget main) → chốt SHA nguồn mới cho NC-02/03/10. Không yêu cầu chủ động CI trước merge; kiểm protection và các check tự kích hoạt, không bypass. Review độc lập và kiểm local mục tiêu vẫn áp dụng. NC-01 CI diagnosis và NC-11 nghiệm thu toàn hệ thống vẫn chưa hoàn tất chỉ vì merge UI.

**Kết quả NC-UI ngày25/10:** đã hòa giải, được hai reviewer độc lập APPROVE, merge đủ #11/#12/#13/#14 và xóa đúng bốn source branches local+remote. Nguồn code để NC-02/03 đọc lại là main `711a22e71983e3d6aa17799649af05ce4c762555`; docs B03 merge `8114a25f5b95625d8907b570820b38afef58a152`, receipt tiếp tục trên docs. NC-00/10 chỉ được hoàn tất trong phạm vi bảo toàn và hồ sơ UI này; các task rộng hơn và backend/deploy holds giữ nguyên. Required checks của PR tự chạy và PASS, không dispatch/rerun thủ công. Hai cache watcher được phép dọn nhưng còn nguyên do bộ duyệt tự động từ chối; chưa thực hiện NC-09 dọn worktree. Các mục “chưa thực hiện” bên dưới là lịch sử kế hoạch trước quyền triển khai NC-UI.

## Đề bài, quyền và trạng thái — lịch sử phiên lập kế hoạch

- Chủ dự án yêu cầu rà cấu trúc/nghiệp vụ, chuẩn hóa UI–nghiệp vụ–dữ liệu, tinh gọn thành phần hết dùng nhưng giữ minh chứng, hồi quy gọi món/thanh toán/phân quyền, đồng bộ nhánh `docs`, và dọn worktree liên quan trong `D:/Workspace`.
- Giới hạn trực tiếp: **“session này chỉ tập trung lên kế hoạch, không xử lý trực tiếp ở đây”**. Phiên này chỉ đọc nguồn và ghi kế hoạch/review; không sửa ứng dụng, chạy test/CI, cài gói, đổi Git refs, dọn dữ liệu hoặc tác động backend.
- Trạng thái: **kế hoạch đề xuất để giao việc**, chưa phải spec triển khai được duyệt hay quyền thực hiện các task dưới đây. Tất cả task NC-00…NC-11 và nhóm bổ sung **NC-UI** đều **CHƯA THỰC HIỆN**. Khảo sát sơ bộ của phiên này chỉ cung cấp đầu vào.
- Bổ sung theo yêu cầu tiếp ngày 25/10/2026: kiểm kê PR UI đang mở và xếp việc review chúng vào kế hoạch; vẫn chỉ lập kế hoạch, chưa review đầy đủ code, sửa/merge/retarget PR hoặc gửi nhận xét lên GitHub.
- Phân mức: chương trình có phần nhạy cảm về tiền, quyền và bảo toàn dữ liệu; mỗi slice xác định mức riêng. Kế hoạch dùng hai reviewer độc lập trước bàn giao. Không tạo chat, nhánh hoặc worktree mới trong phiên lập kế hoạch.
- Quy trình: [workflow](../README.md), [mẫu task](../templates.md), [chuẩn spec](../../../openspec/SPEC-STANDARD.md). Đây là hồ sơ kế hoạch/bàn giao, không mở một change OpenSpec giả đủ bảy file. NC-03 chọn change hiện hữu hoặc change chính thức cần bổ sung trước mỗi phần triển khai.

Các liên kết tài liệu của phiên kế hoạch đã được chuyển sang bản xuất bản khi nhập WIP25/10; đường code/evidence ngoài repo vẫn giữ nguồn lịch sử. Không suy trạng thái tại ngày lập thành kết quả kiểm lại source hiện hành.

## Hiện trạng đã khảo sát và giới hạn

Mốc khảo sát ban đầu: 25/10/2026, UTC+7; Git/filesystem local. Phần PR UI bổ sung bên dưới dùng GitHub API chỉ đọc trong cùng ngày; không `git fetch` hoặc thay refs local. Số liệu không thay cho kiểm lại khi bắt đầu triển khai.

| Nguồn | Kết quả tại lần đọc | Ý nghĩa đối với kế hoạch |
| --- | --- | --- |
| `D:/Workspace/pos-cafe` | `main@5156820f7d6679cd6f8051bdc38419737ffa0c7e`; 124 tracked changes và 429 untracked files theo `status -uno` + `ls-files --others --exclude-standard` | Checkout gốc có WIP; không lấy toàn bộ thư mục làm nguồn sau tích hợp hoặc reset/pull đè lên |
| Ref local `origin/main` | `0dd63ea81b27a38800044a55a7f9c8f12f87cad0`, tree `12e8e64bd3df60ee3b1be55ec42f3cd5de35b746` | Mốc tích hợp có sẵn để đọc; chưa khẳng định là HEAD remote hiện thời |
| `D:/Workspace/pos-cafe-permission-timeonly-20261022/code` | `a028cc5b07bf3a02e3b837d8aec2b832325503a2`; cùng tree với ref trên; 0 tracked/untracked changes, chưa tính ignored | Nguồn khảo sát mã trong kế hoạch; vẫn giữ checkout/evidence cho đến kiểm retention |
| `D:/Workspace/pos-cafe-docs` | `docs@0fe967d554cecfa7e0cb58d6efa01d64941439ff`; 39 tracked changes và 918 untracked files trước kế hoạch | Nội dung docs đang đọc gồm WIP, không đồng nhất với committed ref `docs`; không gom commit hoặc ghi đè hồ sơ cũ |
| Git worktree registry | 15 worktree; 14 HEAD code là ancestor của **ref local** `origin/main`; docs là nhánh riêng | Ancestor chỉ nói về commit, không chứng minh WIP/artifacts đã được tích hợp hoặc có thể xóa |
| Tree sau tích hợp | 1.126 tracked files, gồm 321 dưới `src/`, 298 dưới `scripts/`, 165 dưới `tests/`, 32 cấu hình `vitest*.ts` ở root | Cần kiểm kê runner/config và đường gọi thực, không đồng nghĩa các file này thừa |
| Dung lượng Windows | C khoảng 179,20 GiB trống; D khoảng 92,25 GiB trống | Số đo tham khảo; chưa đo dung lượng từng worktree hoặc mức có thể thu hồi |

Các điểm vào đã đọc, đều thuộc tree `12e8…` tại checkout `timeonly` trên:

- `src/app/runtimePorts.ts:24` chọn/composition mock hoặc Supabase. `src/ports/index.ts:154` định nghĩa `AppPorts` gồm permission/write/auth/seed/print; `:162` giữ `LegacyAppPorts` cho test legacy. **Không xóa surface legacy chỉ vì UI mới không gọi nó.**
- `src/architectureBoundaries.test.ts:121` kiểm foundation layers; `:148` kiểm chiều phụ thuộc; `:185` kiểm boundary permission; `:199` kiểm helper/adapter đã nghỉ. Đây là guard hiện có cần giữ, không mặc định đã PASS trong phiên này.
- `src/features/pos/orderFlow.ts:250`, `:274`, `:358`, `:422` chứa các entry point ghi đơn/thu tiền/tách-thu tiền/hủy đơn đã trả; `writeOperationFlow.ts:44` ràng buộc continuation với lifecycle trước register. Đây là vùng cần kiểm sâu, **chưa kết luận là trùng lặp hoặc sai trách nhiệm**.
- `src/app/drawers/pos/PaymentDrawer.tsx:53`, `:184` và `src/features/pos/useOrderPaymentFlow.ts:38` là đường UI → hook → flow cần lập bản đồ ownership của selection, validation, submit, invalidation và in.
- `vitest.config.ts:10` chỉ include tests dưới `src`; `package.json` có các runner riêng idempotency và permission T01–T07. Không suy `npm test` phủ contracts/backend/browser.
- `scripts/project-ci.mjs:363` chạy smoke với retries=0; `:367`/`:372` là các bước UI sau smoke. `tests/smoke/permission-ui-closeout.spec.ts:40` kiểm thao tác selection/quantity, **không thực hiện giao dịch thanh toán**.
- [Handoff tích hợp](permission-main-integration-2026-10-24.md), dòng 3, và [chẩn đoán main CI](../../implementation-log/permission-backend-web-release-20261023/permission-main-main01-diagnosis.md) ghi main CI `40089941679` FAIL trên phone-landscape; nguyên nhân ứng dụng UNKNOWN và diagnostics có lỗi attribution. Đây là kết quả lịch sử, chưa rerun trong phiên này.
- Handoff trên giữ T04/backend acceptance DEFERRED/NOT_ACCEPTED, bảy service profiles và supplemental obligations chưa đóng; không deploy/migration/live activation. Không biến việc merge thành nghiệm thu backend.
- [CLAUDE.md](../../../CLAUDE.md), dòng 88, vẫn mô tả `AppPorts` kiểu cũ, trong khi source đã tách legacy; [architecture](../../architecture.md), dòng 3, có ghi candidate mới nhưng các đoạn baseline vẫn cần đối chiếu. Đây là chênh lệch tài liệu đã thấy, không phải kết luận toàn bộ tài liệu sai.
- [Dọn worktree 23/10](worktree-cleanup-2026-10-23.md) đã loại chín checkout và giữ 15 vì WIP/evidence. Bản lưu 84 file ở `D:/Workspace/pos-cafe-worktree-cleanup-20261023` là đầu ra cần giữ, không tự phân loại temp.

## Thứ tự và cách chia người/phần việc

Mỗi task có một người/agent chịu trách nhiệm chính và reviewer không phải tác giả. Các cột vai trò dưới đây là **phân công đề xuất cho phiên sau**, không phải agent đang thực thi. Giữ mã 12 task cũ, bổ sung một nhóm NC-UI gồm bốn phần; không cần tạo hàng loạt chat, mở theo task đến lượt.

| Task | Ưu tiên, phụ thuộc | Vai trò chính | Kết quả cần bàn giao |
| --- | --- | --- | --- |
| **NC-00 — Chốt nguồn, bảo toàn WIP** | P0, làm đầu tiên | Điều phối/Git | Source manifest; phân biệt main tích hợp, WIP riêng và docs WIP; chọn một nơi thực hiện |
| **NC-01 — Khôi phục baseline kiểm thử đáng tin** | P0, sau NC-00 | QA/tooling + tác giả phần lỗi | Chẩn đoán terminal chính xác; xử lý hoặc giữ rõ blocker smoke; baseline cùng source |
| **NC-UI — Review và chuẩn bị tích hợp PR UI** | P0, sau NC-00; đọc/review song song chẩn đoán NC-01, chốt trước refactor | UI/POS + QA + reviewer độc lập | Review #11/#12 trước, #13/#14 sau; giải quyết giao nhau với phân quyền; tích hợp chỉ khi được giao và đủ gate; chốt lại baseline |
| **NC-02 — Bản đồ kiến trúc và kiểm kê** | Phần docs P0 cùng NC-10; phần code còn sau NC-00 | Phân tích kiến trúc | Bản đồ modules/flows; findings có nguồn; danh mục code/script/config/evidence |
| **NC-03 — Chốt quy ước và chia slice** | P1, sau NC-02 và quyết định phạm vi UI ở NC-UI; cập nhật theo nguồn UI đã chọn | Kiến trúc/spec | Ownership, contracts, ma trận hồi quy, danh sách giữ/gộp/di chuyển/loại bỏ có căn cứ |
| **NC-04 — Session, quyền và cổng dữ liệu** | P1, sau NC-01 + NC-03 | Backend/security | Ranh giới permission/session/read/write nhất quán, guard và adapter contract được kiểm |
| **NC-05 — Luồng gọi món** | P1, sau NC-04 | POS/domain | UI–hook–flow rõ trách nhiệm; giữ giá lịch sử, OCC và giao thức ghi |
| **NC-06 — Thanh toán, recovery và in** | P1, sau NC-05 | POS/payment | Luồng trả đủ/trả chọn món/hủy/in/recovery nhất quán, không tạo hiệu ứng lặp |
| **NC-07 — UI và các module quản trị còn lại** | P2, sau NC-06 | UI/admin | Chuẩn hóa phần có finding: menu/floor/employees/report/settings, loading/error/dirty-exit |
| **NC-08 — Tinh gọn code, script và cấu hình** | P2, sau NC-04…07 | Tooling/maintenance | Loại đúng phần hết dùng; CI/test discovery/recipe và đường tham chiếu còn nguyên |
| **NC-09 — Dọn worktree theo nhóm đã xác minh** | P1 kiểm kê sớm; xóa theo điều kiện dưới | Git/retention | Allowlist cụ thể, WIP/evidence được giữ, receipt và mức thu hồi đo được |
| **NC-10 — Đồng bộ kiến thức trên docs** | P0 docs-first trước refactor; sau đó tiếp tục theo từng slice | Tài liệu + từng tác giả | Kiến trúc/trách nhiệm/quy ước/test/status đúng source và giới hạn thực |
| **NC-11 — Hồi quy cuối và bàn giao** | Sau các slice đã giao + NC-10 | QA + reviewer độc lập | Ma trận đạt/chưa đạt/chưa chạy, nguồn tái hiện, review và danh sách còn mở |

Luồng chính sau bổ sung: **NC-00 → [NC-01 chẩn đoán + NC-UI-A/B/C review + NC-02 khảo sát] → NC-UI-D chốt nguồn UI/baseline → NC-03 → NC-04 → NC-05 → NC-06 → NC-07 → NC-08 → NC-11**; NC-10 cập nhật tại từng checkpoint. NC-03 có thể soạn sớm nhưng phải rebind theo nguồn UI đã chọn. **Chưa mở refactor NC-04 khi baseline liên quan chưa đáng tin hoặc quyết định nhận/hoãn PR UI còn bỏ ngỏ.** Nếu sửa lỗi NC-01, tách patch sửa lỗi nền khỏi refactor. Nếu chứng minh B03 sửa đúng lỗi cũ, dùng correction đó với regression trên candidate mới; không sửa giao diện cũ rồi viết lại vô ích, cũng không coi thay UI tự làm lỗi cũ biến mất.

NC-09 tách hai bước: kiểm kê sau NC-00, đối chiếu danh mục NC-02 và PR inventory NC-UI; chỉ dọn nhóm không còn là dependency của công việc đang chạy. Checkout/nhánh/evidence phục vụ #11–#14, WIP chưa phân loại, bằng chứng còn bị tham chiếu hoặc HOLD chưa giải quyết phải giữ; không cần đợi toàn bộ chương trình để dọn một nhóm độc lập đủ điều kiện. Các task ghi source chung làm tuần tự; chỉ song song đọc/soạn docs hoặc review không xung đột. Không chạy đồng thời các suite dùng cùng DB và không nhân bản môi trường nặng.

## NC-UI — Bổ sung PR UI vào đường thực hiện

### Kiểm kê PR ngày 25/10/2026

Đọc collection `/repos/nguyentronglinh045/pos-cafe/pulls?state=open&per_page=100` qua GitHub connector: **4 PR mở, đều Draft; 2 PR code + 2 PR docs, bao phủ 3 màn B01/B02/B03**. Tìm kiếm issue ban đầu trả rỗng, nên số lượng này lấy từ collection PR trực tiếp và danh sách files, không lấy từ search index. API `branches/main` xác nhận `0dd63ea81b27a38800044a55a7f9c8f12f87cad0` tại lần đọc.

| PR | Phạm vi, đích và source đã đọc | Nhận định để xếp việc |
| --- | --- | --- |
| [#11 — B01 sơ đồ bàn + B02 gọi món](https://github.com/nguyentronglinh045/pos-cafe/pull/11) | Code, 59 file; `ui/week03-b01-b02-20261024@bbd5be763196b12db45281d6314e2e835cdc0785` → `main` | Review trước. API trả `mergeable=false`, `mergeable_state=dirty`; metadata baseSHA là `2da0d7e…`, trong khi main hiện `0dd63ea…`. Cần hòa giải với mã phân quyền đã tích hợp; chưa xác định từng conflict hunk |
| [#12 — tài liệu/bằng chứng B01/B02](https://github.com/nguyentronglinh045/pos-cafe/pull/12) | Docs, 269 file; `ui-week03-b01-b02-docs-20261024@f6d54d182c42f0c13eb832b6411affefbd4c9f03` → `docs` | Review cùng #11; kiểm spec/owner decisions, evidence source binding và retention; không coi docs này là mã UI |
| [#13 — B03 thanh toán](https://github.com/nguyentronglinh045/pos-cafe/pull/13) | Code, 32 file; `ui/week03-b03-20261024@a2a619a1144c71e1a73f6328071c422e5750cc2e` → **nhánh #11**, base `bbd5be7…` | Đây là PR nối tiếp #11. API `mergeable=true`, state `unstable` chỉ áp dụng base hiện tại, không chứng minh sẵn sàng vào main. Sau #11 cần kiểm/cập nhật base và review lại diff cuối |
| [#14 — tài liệu/kiểm thử B03](https://github.com/nguyentronglinh045/pos-cafe/pull/14) | Docs, 19 file; `ui-week03-b03-docs-20261024@59a9d8cb0dcaae6eda3463977df5bb6ca013d0fc` → `docs` | Review cùng #13; phân biệt evidence B03 riêng ngày 22/10 với bản nối tiếp B01/B02 ngày 24/10 |

Nguồn là metadata/body/file lists, **chưa phải review từng dòng, chạy lại tests hoặc xác nhận các số PASS do tác giả ghi**. Các claim audit FAIL/false-positive, Windows/thiết bị/Supabase chưa kiểm trong body phải được kiểm và phân loại lại ở task review; không tự nhận nhãn false-positive. B03 pixel/audit cũ chưa được đo lại trên nhánh nối tiếp theo chính mô tả #13; kết quả cũ không thay gate source cuối.

Đã giao danh sách file PR với diff local `2da0d7e… → 0dd63ea…` của đợt tích hợp phân quyền: **#11 trùng 12 đường dẫn**, gồm OrderDrawer/OrderCartPane/OrderMenuPane, AppShell/FloorWorkspace/LeftNav, PortalDrawer và smoke config/helpers; **#13 trùng 9 đường dẫn**, gồm PaymentDrawer/PaymentSummaryPane/paymentShared, ReceiptPreview/PortalDrawer, useAppStore và tests. Đây là **overlap theo đường dẫn**, chưa phải số xung đột Git hay bằng chứng regression. Các phần dùng chung này cần review tích hợp trước refactor NC-04…07.

### Bốn phần giao việc

| Phần | Thực hiện ở phiên được giao | Điều kiện hoàn thành |
| --- | --- | --- |
| **NC-UI-A — Intake và bản đồ ảnh hưởng** | Sau NC-00: xác minh lại số PR/head/base, review threads/checks/CI, spec và quyết định UI; nối #11↔#12, #13↔#14; lập overlap main/UI/permission, worktree và artifact nào cần giữ | Chốt danh sách review, source manifest, findings/gaps và cặp code/docs; không suy “Draft” hoặc test count là kết luận chất lượng |
| **NC-UI-B — Review B01/B02 và #12** | Đọc #12/spec rồi review toàn diff #11; đối chiếu theme/fonts, floor geometry, gọi món/modifier/draft/focus, state quyền và async lifecycle với main mới; kiểm tooling/test coverage. Chuẩn bị phương án giải conflict, chỉ sửa khi được giao | Các finding có path:line và expected/test; candidate hòa giải giữ cả UI đã chốt và quyền/lifecycle của main; review cuối và gate bắt buộc đúng candidate trước đề xuất merge |
| **NC-UI-C — Review B03 và #14** | Có thể đọc delta B03 sớm song song B, nhưng review tích hợp cuối sau khi source B01/B02 ổn định; kiểm selection/partial/full payment/OCC/K/recovery/in/permission và theme/PortalDrawer chung. Đối chiếu main CI failure phone-landscape trong NC-01 | Evidence mới cho candidate có cả phân quyền+B01/B02+B03; phân biệt mock/real và legacy counts; pixel/audit được kiểm lại nếu gate yêu cầu; không lấy kết quả B03 riêng ngày 22/10 để đóng bản mới |
| **NC-UI-D — Quyết định nhận/hoãn, tích hợp và chốt lại baseline** | Kết quả review phải dẫn đến đề xuất rõ cho mỗi PR: nhận sau sửa / còn blocker / hoãn có lý do. Nếu chủ dự án giao merge và đủ gate: code **#11 trước → cập nhật/retarget #13 sang main, kiểm diff/review lại; chỉ quan sát CI tự kích hoạt → #13**; docs #12/#14 xử lý trên docs theo trạng thái code, giữ WIP hiện có | Sau mỗi merge kiểm source và check tự kích hoạt nếu có; không chủ động CI trong lượt NC-UI này; bản cuối qua chuỗi B01→B02→B03, full/partial payment, quyền, viewport nhỏ/phone-landscape, boundary và UI gates. Cập nhật NC-00/02/03/10 theo source cuối; NC-01 đóng bằng bằng chứng lỗi nền được xử lý. Nếu chọn hoãn PR thì ghi quyết định, giữ evidence/worktree cần thiết và lập baseline cho source được chọn; không để cả chương trình chờ vô thời hạn |

**Gate và giới hạn:** ít nhất hai reviewer khác trọng tâm cho gói tích hợp UI chạm tiền/quyền: (1) UI/flow/accessibility, (2) permission/financial invariants/test evidence. Không hạ expected, bỏ các test phân quyền mới hoặc nhận số 642/645 unit của nhánh UI cũ là coverage của main mới; cũng không coi chênh số test đơn thuần là lỗi. Không đổi UI baseline để che audit failure. Các skip phải đối chiếu applicability/gate, không biến thành PASS. NC-UI-D là kế hoạch có điều kiện, không phải lệnh merge/push/retarget/review-comment trong phiên hiện tại. T04/backend/release holds giữ nguyên.

Docs PR có thể review song song code; merge vào nhánh docs phải phản ánh đúng trạng thái đã chọn và giữ nguyên WIP local, không ép chép nội dung branch remote lên worktree đang bẩn. Nếu một PR bị hoãn thì NC-03 phải chọn rõ refactor phần nào tránh đụng phạm vi UI còn đang làm. Review UI hiện hữu trong NC-UI không mở thêm yêu cầu remake khác ở NC-07.

## Thẻ giao việc và tiêu chí xong

### NC-00 — Chốt nguồn và bảo toàn phần đang làm

- **Đầu vào:** mốc Git ở trên, handoff tích hợp và cleanup 23/10. Kiểm lại HEAD/branch/index, untracked/ignored, nhánh/commit riêng và hoạt động còn dùng từng checkout; nếu cần remote hiện thời thì đọc metadata có thẩm quyền và ghi thời điểm.
- **Đầu ra:** manifest phân biệt mốc main, từng WIP có thể phục hồi, test/evidence và docs chưa commit; danh sách KEEP/HOLD/CANDIDATE. Đối chiếu từng delta với nguồn đã tích hợp, không nhận commit ancestor là WIP đã được merge. Chọn dùng checkout đã có nếu phù hợp, không mặc định tạo mới.
- **Hoàn thành khi:** có nguồn chuẩn để bắt đầu, snapshot/patch gồm cả file mới cho phần cần bảo toàn và recipe khôi phục đã kiểm hash; không mất WIP/refs; nêu file chưa xác minh. Việc cần chủ dự án chọn về WIP mâu thuẫn được hỏi riêng; không reset/clean/stash hoặc gom commit thay quyết định đó.

### NC-01 — Baseline và lỗi CI sau merge

- **Đầu vào:** source NC-00; failure/diagnosis đã ghi. Tách lỗi reporter attribution, lỗi test/fixture và lỗi UI ứng dụng; không suy nguyên nhân từ marker polling đầu hoặc fixture `core.*`.
- **Đầu ra:** sửa attribution hữu hạn theo kết quả cuối từng test nếu được giao; regression cho polling cuối PASS, nhiều test, terminal khác marker đầu. Tái hiện ca payment closeout trên phone-landscape, retries=0 và giữ expected/timeout. Nếu không tái hiện: kết luận UNKNOWN, không gọi là đã sửa; chuyển từ thử phỏng đoán sang chẩn đoán có giả thuyết/phép thử.
- **Hoàn thành khi:** nguyên nhân đã có bằng chứng và correction được kiểm hoặc blocker còn mở rõ ràng; chạy lại build/unit/tooling/smoke và UI gate phù hợp trên nguồn sửa cuối. CI toàn pipeline chỉ chạy khi được giao kèm ngân sách; không tự mở heavy backend. Kết quả xanh đơn lẻ không xóa failure cũ. NC-04 bị chặn nếu baseline liên quan chưa đáng tin.
- **Liên hệ NC-UI:** lưu bằng chứng lỗi trên main trước tích hợp để so sánh với B03; chẩn đoán có thể chạy song song review PR. Chốt baseline lần cuối trên nguồn UI được nhận hoặc được quyết định hoãn; mọi merge vẫn phải qua gate hiện hành, không dùng UI mới để bỏ qua lỗi chưa hiểu.

### NC-02 — Rà kiến trúc, nghiệp vụ và tồn kho phát triển

- **Đầu vào:** tree NC-00, code điểm vào ở trên, change phân quyền/phase 27 và các runner hiện có.
- **Đầu ra:** bản đồ `screen/drawer → hook → flow/core → port → adapter → RPC`; ownership của UI state, server state, session/authority, validation, tiền, idempotency, error mapping, invalidation, in/ảnh. Sổ findings gồm path:line, ca tái hiện/đường gọi, ảnh hưởng, mức ưu tiên, test bảo vệ và module đích.
- **Kiểm kê:** code, public assets, scripts, npm commands, workflows, config, migration/candidate SQL, operator guides, fixtures, raw outputs và docs. Mỗi mục ghi consumer (kể cả dynamic/glob/CLI/CI/docs), owner, trạng thái đang dùng/legacy có chủ đích/hết dùng/chưa biết và cách dựng lại nếu là generated.
- **Hoàn thành khi:** ba luồng trọng yếu đều được truy vết; nghi vấn trùng lặp được phân biệt với bằng chứng xác nhận. Không dùng độ dài file, tên `legacy`, không có import trực tiếp hoặc ngày cũ làm bằng chứng xóa.

### NC-03 — Chuẩn hóa quy ước và thiết kế các đợt nhỏ

- **Đầu ra:** giữ Ports & Adapters hiện có; UI lo hiển thị/intent, hooks lo async/cache, flow/core lo quy tắc, ports lo contract, adapters lo SDK/mapping; DB giữ transaction/quyền/tính toàn vẹn cần thực thi phía server. Ghi ngoại lệ hợp lệ tại composition/lifecycle thay vì di chuyển máy móc.
- **Quy ước cần chốt:** tên và nơi đặt module, public exports, DTO/AppError, query key và invalidation, validation UI so với server, mock tương ứng production. Không gom các kiểm tra ở hai trust boundary thành một chỉ vì nhìn giống nhau.
- **Hoàn thành khi:** mỗi finding có quyết định giữ/sửa/hoãn và lý do; mỗi slice có file phạm vi, expected, test, rollback và docs đích; câu hỏi đổi nghiệp vụ/quyền/dữ liệu đã được chốt. Bổ sung change hiện hữu hoặc bộ spec chính thức theo chuẩn; chỉ lập sâu phần sắp làm, không tạo bảy artifact cho mọi task nhỏ. Một slice không có finding đủ căn cứ có thể kết thúc NO_CHANGE qua review.

### NC-04 — Session, quyền và truy cập dữ liệu

- **Phạm vi:** `runtimePorts`, `AppPorts/LegacyAppPorts`, `features/shared/permissionSession`, lifecycle, permission ports, mock/Supabase adapters và mapping lỗi/DTO; chỉ sửa finding NC-03 đã được giao. Không gộp production với adapter legacy dùng cho regression hoặc mở lại đường bypass.
- **Hoàn thành khi:** source quyền duy nhất và trách nhiệm session/cache rõ; revoke/đổi phiên/chậm response không phục hồi dữ liệu hoặc quyền cũ; frontend kiểm UX và backend kiểm quyền cùng contract; mock không che khác biệt semantics. Giữ các điều kiện compatibility/rollback đang cần.
- **Kiểm:** boundary guard, permission unit/component và contract thực tương ứng, deny bằng lời gọi trực tiếp ngoài UI/cross-store, quyền thay đổi giữa await. Thay SQL/schema phải mở spec/migration/recovery và skill Postgres liên quan trước khi làm. Nếu cần gate backend đang hoãn, dừng phần phụ thuộc và xin quyết định mở lại đúng phạm vi; không công nhận mock là nghiệm thu backend.

### NC-05 — Gọi món

- **Phạm vi:** order drawer/takeaway, order draft, `orderFlow`, query/mutation hooks và order invalidation; giảm orchestration lặp khi đã chứng minh cùng ý nghĩa. Refactor từng slice, không viết lại toàn module.
- **Hoàn thành khi:** tạo/sửa đơn tại bàn và mang đi giữ cùng hành vi; retained lines giữ giá/options/ID lịch sử; món thêm dùng giá được xác nhận; lỗi validation/OCC/session/lifecycle giữ đúng mã và thông báo; retry/recovery không đổi K/payload.
- **Kiểm:** unit flow và các biên/exception; component cho nháp và response muộn; smoke gọi món; financial/idempotency contract tương ứng nếu bị ảnh hưởng. Bổ sung regression cho finding trước hoặc cùng fix, cập nhật docs của slice.

### NC-06 — Thanh toán, recovery, hóa đơn

- **Phạm vi:** `PaymentDrawer`, payment selection/summary, hook/flow, coordinator recovery, quyền in và receipt; tách trình bày khỏi quyết định nghiệp vụ theo NC-03.
- **Hoàn thành khi:** thu đủ, trả chọn món/tách đơn, thiếu tiền, số lượng biên, bấm lặp/mất ACK/OCC, đổi phiên trong await và void giữ bất biến tiền/atomicity; mỗi click in qua quyền hiện hành, receipt lịch sử không lấy giá hiện tại. Không thêm thanh toán điện tử, giảm giá hoặc offline.
- **Kiểm:** unit/component + mock smoke thật sự thực hiện thu tiền, bên cạnh ca selection/quantity; idempotency/financial/server-deny phù hợp; UI audit trên các viewport. Không bỏ case vì refactor làm test khó chạy; không thay tiêu chí để baseline xanh.

### NC-07 — Module UI/quản trị còn lại

- **Phạm vi:** menu, floor, employees, report/history, settings; hook/flow chia sẻ, loading/error/empty, dirty-exit và overlay theo findings. Không remake giao diện hoặc thêm framework trong chương trình chuẩn hóa.
- **Đầu ra:** mỗi module có responsibility rõ; xác minh gap dirty-exit EmployeesDrawer được handoff tích hợp ghi trước khi sửa. Floor editor không chiếm ownership trạng thái bàn của nghiệp vụ; reports không tự dựng lại công thức tiền ngoài contract.
- **Hoàn thành khi:** các slice đã chọn có hồi quy quyền + nghiệp vụ liên quan; UI selftest trước audit, đọc ảnh và phân loại true/false positives. Không tự chạy `ui-audit:update` để chấp nhận lỗi. Module không có lỗi/trùng lặp xác nhận được giữ nguyên với lý do.

### NC-08 — Tinh gọn source, tooling và cấu hình

- **Đầu vào:** inventory NC-02, bản đồ sau refactor, toàn bộ entry point npm/CI/config/glob/operator docs.
- **Đầu ra:** bảng DELETE/RETAIN/ARCHIVE/UNKNOWN có bằng chứng và người chịu trách nhiệm. Chỉ loại code/script/config đã xác minh hết consumer và nghĩa vụ release/recovery/test. Migration đã dùng, rollback, legacy contract, extension seam và evidence không bị xóa theo tuổi/tên.
- **Hoàn thành khi:** test discovery trước/sau không mất case bắt buộc; npm/workflow/config/operator guide không còn tham chiếu đứt; các lệnh bị đổi có recipe cập nhật. Generated cache/raw/test data theo quy tắc hỏi trước khi xóa nhóm cụ thể, không trộn với xóa source đã duyệt trong diff. Không tạo một runner mới nếu runner hiện có đáp ứng.

### NC-09 — Worktree và dữ liệu giữ lại

Danh sách khởi đầu từ registry hiện tại; mọi đường dẫn dưới đây tính từ `D:/Workspace/`. Đây là phân nhóm **để kiểm tra**, chưa là allowlist xóa:

| Nhóm | Đường dẫn | Trạng thái và bước tiếp theo |
| --- | --- | --- |
| Giữ hai gốc | `pos-cafe`, `pos-cafe-docs` | Có WIP, là nơi làm việc gốc; xử lý nguồn qua NC-00 |
| Source sạch, kiểm retention trước | `pos-cafe-ci-fix`, `pos-cafe-ci-main`, `pos-cafe-permission-a-20261019`, `pos-cafe-ui-workflow` | 0 tracked/untracked changes; ignored artifacts và liên kết evidence chưa kiểm hết, không đồng nghĩa rỗng |
| Source sạch, giữ cho đường kiểm chứng gần nhất | `pos-cafe-permission-ci-fix-20261022/code`, `pos-cafe-permission-timeonly-20261022/code` | Không dọn trước khi NC-00/01 xác định checkout thay thế và evidence cần giữ; không xóa cả parent vì chỉ child `code` là worktree |
| Có thay đổi riêng | `pos-cafe-ci` (11), `pos-cafe-permission-b-20261019` (4), `pos-cafe-permission-l-20261019` (2), `pos-cafe-permission-p-20261019` (5), `pos-cafe-permission-r-20261019` (4), `pos-cafe-permission-integration-20261019` (111), `pos-cafe-permission-run-20261020/code` (15) | Số trong ngoặc là tracked changes + untracked files, chưa tính ignored. Giữ đến khi từng delta được phân loại và bảo toàn |
| Thư mục liên quan ngoài 15 đăng ký | `pos-cafe-code`, `pos-cafe-db-probe-runtime-private`, `pos-cafe-db-readonly-private`, `pos-cafe-permission-verify`, `pos-cafe-review-business`, `pos-cafe-review-harness`, `pos-cafe-review-harness-final`, `pos-cafe-review-security`, `pos-cafe-worktree-cleanup-20261023` | Kiểm loại/ownership/dependency riêng; không suy từ tên là worktree hay temp. Private runtime và bản lưu cleanup giữ nguyên cho đến khi có quyết định đúng nhóm |

- **Đầu ra giai đoạn kiểm kê:** manifest từng đường dẫn tuyệt đối, Git common-dir/HEAD/refs/reflog/WIP/untracked/ignored, logical bytes và dung lượng chiếm ổ khi đo được, hoạt động/process/chat đang dùng, evidence refs và điều kiện KEEP/HOLD/CANDIDATE. Kiểm nested repo, reparse point, lock và path ownership; không quét nội dung credential để ghi vào hồ sơ.
- **Trước xóa:** trình allowlist cuối với đường dẫn, dữ liệu/số lượng/dung lượng, lý do và tác động; hỏi quyền dọn nhóm đó theo quy tắc máy. Lệnh lập kế hoạch hiện tại không cấp quyền xóa. Giữ nhánh/commit hoặc ref phục hồi cần thiết, WIP snapshot và evidence tại nơi bảo vệ tương đương; không đổi ACL/privacy để tiện di chuyển. Link cần thiết phải được cập nhật hoặc có mapping phục hồi.
- **Thực thi ở phiên được giao:** kiểm lại không drift, runtime đã nhả dữ liệu, target nằm đúng `D:/Workspace` và repository dự kiến. Ưu tiên `git worktree remove` không force; không `git clean`, reset, prune toàn hệ thống, hoặc xóa branch để dọn checkout. Prune metadata chỉ sau dry-run đúng allowlist. Path không phải worktree là nhóm riêng, không `git worktree remove` theo tên thư mục.
- **Hoàn thành khi:** receipt mỗi mục đã giữ/xóa, WIP/evidence/refs kiểm lại, khôi phục có recipe và mức kiểm thử recipe được ghi đúng; đo C/D trước/sau để báo mức trống tăng thực, không dùng tổng logical bytes làm số đã thu hồi. Có thể hoàn tất một nhóm độc lập; mục HOLD vẫn được nêu rõ.

### NC-10 — Docs đồng bộ trong từng đợt

- **Đầu ra:** cập nhật `docs/architecture.md`, `features.md`, `data-model.md` nếu thay contract, `testing.md`, `limitations.md`, `roadmap.md`, `report-source-map.md` khi liên quan; sửa đoạn lỗi thời trong `CLAUDE.md` của **worktree docs**. Không sửa file con trỏ tại code root.
- **Cách làm:** mỗi slice ghi source/file:line, trách nhiệm module, decision/lý do, test thực chạy, giới hạn và handoff. Operator guide/commands/setup contract vẫn cạnh tooling trên code; docs giữ link. Không nhập nhánh docs vào main hoặc chép source vào docs.
- **Hoàn thành khi:** một đường đọc chính từ task index → kiến trúc → feature/test/decision; liên kết được kiểm; lịch sử giữ rõ mốc. Tách **đã tích hợp / đã kiểm chứng / đã nghiệm thu / đã phát hành**. Không để mô tả legacy đứng như contract runtime mới, cũng không đổi mọi câu “candidate” thành “production”.

### NC-11 — Kiểm chứng cuối và bàn giao

- **Đầu vào:** candidate cuối chứa toàn bộ slice được giao, manifest source/spec/environment và các findings/holds. Không ghép PASS từ nhiều fingerprint để nhận cùng một bản đã đạt.
- **Hoàn thành khi:** build/unit/boundary, smoke toàn phạm vi đã duyệt và các contract/backend/UI gates bị ảnh hưởng đạt trên source phù hợp; expected/exception/boundary/permission đều được truy vết; test counts/skip/fail/NOT_RUN có giải thích. Hai reviewer khác trọng tâm cho phần tiền/quyền/dữ liệu xác nhận APPROVE đúng candidate; findings chặn được đóng. Tác vụ docs nhẹ tối thiểu một reviewer theo workflow.
- **Bàn giao:** cấu trúc module cuối, cách chạy test, recipe môi trường/khôi phục, dữ liệu giữ lại, việc hoãn, walkthrough code/test để chủ dự án có thể giải thích. Ghi đúng đã đề nghị/đã thực hiện/chờ phản hồi, không tự nhận chủ dự án đã hiểu/nghiệm thu.
- Nếu backend gate bắt buộc cho slice còn NOT_RUN/DEFERRED thì slice đó và kết luận toàn hệ thống **chưa hoàn tất**; phần độc lập có thể bàn giao riêng với giới hạn. T04, bảy profiles và supplemental obligations vẫn nằm trong hồ sơ phân quyền; cần quyết định mở lại nếu muốn đóng chúng. Chương trình này không tự cho phép deploy, migration hoặc live activation.

## Ma trận hồi quy tối thiểu cho mỗi đợt triển khai

| Phạm vi thay đổi | Kiểm bắt buộc theo ảnh hưởng | Bằng chứng cần giữ |
| --- | --- | --- |
| Import, tách module, flow/core | Build/typecheck, boundary guard, unit/flow liên quan; suite chung theo gate | Source SHA hoặc fingerprint + snapshot phục hồi; lệnh, lockfile, counts/exit |
| Gọi món | Dine-in/takeaway, sửa/giá lịch sử, nháp, lỗi/biên/OCC, quyền và continuation | Unit/component + smoke + contract thực nếu ảnh hưởng server |
| Thanh toán | Full/partial, tiền thừa/thiếu, empty selection, bấm lặp/ACK loss, void, in/recovery | Oracle tiền/state, unit/browser và idempotency/financial backend tương ứng |
| Session/phân quyền/adapters | Grant/revoke, session generation, cross-store, direct calls ngoài UI, lỗi SDK/DTO | Contract/permission tests với đúng fixture/schema/profile; mock ghi rõ là mock |
| UI | `npm run ui-audit:selftest` → `npm run ui-audit`, ảnh đã kiểm và smoke viewport | Selftest đúng 23 findings/OK theo quy định hiện hành; phân loại findings, không tự đổi baseline |
| Tooling/config | Discovery và runner selftests/negative controls liên quan, commands/docs links | Danh sách suite bắt buộc trước/sau, no unintended drop, report đúng test/source |
| Chỉ docs/worktree | Đối chiếu source, link, manifest/hash/path/refs/WIP và dung lượng phù hợp | Không cần chạy app tests nếu không đổi source/runtime phục vụ test |

Các lệnh là kế hoạch, **chưa chạy**. Dùng lại dependencies/runner hiện có sau khi kiểm phiên bản và cấu hình; không mặc định `npm ci` hoặc browser install. Không chạy full pipeline chỉ để lấy một phép đo nếu nó tải thêm runtime không cần thiết.

## Ngân sách, giữ bằng chứng và điểm phải hỏi khi thực thi

- Một môi trường kiểm thử nặng tại một thời điểm; không tự cài/import WSL hoặc Docker. Trước lượt cài/copy/archive/DB nặng: đo ổ Windows C và data-root, ước tính download/tăng sau cài/peak, giữ tối thiểu 30 GiB mỗi ổ liên quan và tối đa 20 GiB dữ liệu tăng thêm của task. Chưa biết trần tăng thì dừng phần ghi lớn để làm rõ; vượt 1 GB phải thông báo nổi bật theo luật máy.
- Evidence tối thiểu phải có source có thể phục hồi, lệnh/environment/lock/schema/fixture, kết quả và failure liên quan, review, hash/index và recipe. Raw đang cần chứng minh hoặc còn HOLD được giữ; không coi mọi log/backup là temp. Đánh giá retention sau từng checkpoint, xin phép nhóm dọn cụ thể trước xóa.
- Không cần quyết định nghiệp vụ mới để **bàn giao kế hoạch này**. Các điểm phải giải quyết đúng lúc: WIP xung đột ở NC-00; finding đòi đổi hành vi/quyền/data/acceptance ở NC-03; môi trường/gate backend đang hoãn ở NC-04…06/11; allowlist xóa cụ thể ở NC-09. Không dùng sự im lặng làm đồng ý.
- Ưu tiên giữ hành vi đã chốt; không đưa các feature mới (offline, kitchen đầy đủ, chuyển/gộp bàn, thanh toán điện tử) vào chương trình này dưới tên “chuẩn hóa”.

## Giao việc cho phiên tiếp theo

**Hướng dẫn lịch sử trước quyết định docs-first:** khi đó đề nghị bắt đầu bằng NC-00, sau đó NC-01 chẩn đoán song song NC-UI-A/B và NC-02 khảo sát. Ưu tiên xử lý quyết định nhận/hoãn hai PR code UI trước refactor sâu; #11/#12 trước, #13/#14 sau. Không bắt đầu bằng xóa worktree hoặc đổi hàng loạt cấu trúc thư mục.

Mẫu mở phiên khảo sát đầu tiên:

> Đọc `D:/Workspace/pos-cafe-docs/AGENTS.md`, workflow, chuẩn spec và kế hoạch `docs/workflow/tasks/post-integration-standardization-plan-2026-10-25.md`. Thực hiện NC-00 ở mức khảo sát và chuẩn bị manifest/recipe bảo toàn: xác minh nguồn sau tích hợp, WIP và checkout sẽ dùng; báo phần cần quyết định trước mọi thao tác Git có thể thay đổi công việc đang làm. Chưa sửa ứng dụng, cài gói, chạy heavy backend, xóa hoặc phát hành. Cập nhật handoff trên docs và review độc lập đúng phạm vi.

Với task sau: giao rõ NC-ID/slice, source vừa xác minh, file phạm vi, quyền sửa/chạy/môi trường, expected/tests, budget, docs đích và reviewer; không chỉ giao “dọn sạch toàn bộ dự án”.

## Kiểm chứng của phiên lập kế hoạch

- Đã đọc Git/status/worktree registry, code điểm vào, package/config, handoff tích hợp và cleanup; đối chiếu hai tree bằng Git. Lượt bổ sung đọc PR collection/metadata/file lists và main ref qua GitHub API, giao file lists với diff tích hợp local. Không chạy ứng dụng/test, không đọc backend hoặc thay trạng thái remote.
- Đầu ra mới: kế hoạch này và biên bản review tại `docs/implementation-log/post-integration-standardization-plan-review-2026-10-25.md`; task index chỉ thêm link, giữ nguyên nội dung trước đó. Không commit/push.
- Review độc lập và hash candidate được ghi trong biên bản riêng; review chỉ xác nhận chất lượng kế hoạch, không xác nhận hệ thống PASS hay cấp quyền triển khai. Chủ dự án chưa nghiệm thu kế hoạch tại thời điểm soạn.
