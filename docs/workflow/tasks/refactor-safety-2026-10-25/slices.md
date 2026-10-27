# Phụ lục A — Danh mục phần refactor và điểm tách

## Quyết định thực hiện ngày27/10/2026

Xem [kết quả theo slice](implementation-20261027.md): RF-02/03 bổ sung oracle và tách Report chart/summary; RF-06 chuyển shared query với export tương thích; RF-07 tách snapshot/cart thuần. RF-04/05 và RF-09a–c NO_CHANGE vì chưa có lợi ích đủ rõ từ migration tiếp; RF-08/09d–e cùng security/payment/backend gates giữ HOLD. Đã tích hợp source `c6ff3c795616dfa84379be85feeca29927d173c9` vào main `052a7d1e156425ea82ed1c9cf978d7ef4d4f3571` qua PR15; [biên bản](merge-20261027.md). Bảng kế hoạch dưới đây là lựa chọn/điều kiện mở lại, không phải checklist buộc tách mọi file.


Nguồn mọi đường code tương đối trong tài liệu: main711a22e71983e3d6aa17799649af05ce4c762555 tại D:/Workspace/pos-cafe-permission-timeonly-20261022/code. Các tên file đích là đề xuất; chốt bằng consumer map trước triển khai. Không tạo cây thư mục trống hàng loạt. Xem [kế hoạch](README.md) và [matrix](regression-matrix.md).

## A1. Danh mục rủi ro file lớn

| File; dòng thực đo | Trách nhiệm/ràng buộc quan sát | Điểm tách có thể cân nhắc | Mức và quyết định |
| --- | --- | --- | --- |
| src/app/drawers/admin/ReportDrawer.tsx;506 | Range/timezone, query, dataset, navigation, chart, KPI, orders | Chart/summary/section presentation nhận props, giữ state/query tại drawer | Vừa; pilot RF-03 sau characterization |
| src/app/drawers/admin/OrderHistoryDrawer.tsx;501 | Filters/pagination/UUID selection, receipt, fresh void snapshot, async action lifetime | Filters/confirmation display; tận dụng ListPane/DetailPane hiện có | Cao; RF-04 chỉ presentation; action controller giữ |
| src/app/drawers/admin/FloorEditorDrawer.tsx;441 | Draft/base/dirty, assets, logical geometry, transform refs, changeset | Phần render/picker sau map state; không tách draft ownership trong cùng bước | Cao; RF-05b |
| src/app/drawers/admin/MenuEditorDrawer.tsx;399 | Category/item/modifier draft, images, save, dirty exit | View/selection presentation; tận dụng DetailPane và modifier hook hiện có | Cao; RF-05a |
| src/app/components/ReceiptPreview.tsx;383 | Dựng receipt và render; có dữ liệu snapshot/legacy/provisional | Chỉ renderer thuần nếu có lợi ích; snapshot builder giữ oracle tiền | Cao; không bắt buộc pilot; phụ thuộc RF-I03/I07 |
| src/app/drawers/admin/EmployeesDrawer.tsx;364 | Form/permissions/revision/lifetime, update/reset PIN, self-PIN logout | Đã có panes; cân nhắc form controller sau đủ sequence tests | Rất cao; RF-08 HOLD |
| src/features/pos/orderFlow.ts;441 | Cart/modifier/snapshot helpers + submit/pay/split/void orchestration | cart helpers; payment selection; receipt mapping, từng nhóm riêng | Rất cao về tiền; RF-07 chỉ helper thuần |
| src/adapters/mock/permissionAdminRepo.ts;726 | Mock administration là một phần oracle test quyền | Chỉ tách nhóm có contract độc lập; không thay mock cùng oracle | Rất cao; RF-08 HOLD |
| src/adapters/mock/permissionIdentityRepo.ts;370 | Identity/session mock | Giữ behavioral contract và fixture isolation | Rất cao; RF-08 HOLD |
| src/adapters/supabase/mappers.ts;357 | DTO/error/mapping | Nhóm mapper theo contract, giữ exported API | Cao; chỉ khi có fixture contract đầy đủ |
| src/adapters/supabase/permissionAdminRepo.ts;323; permissionReadRepo.ts;320 | RPC/permission/read surface | Không refactor nội bộ trong đợt đầu | Rất cao; cần contract/backend gate |
| src/domain/models.ts;308 | Kiểu dùng xuyên lớp | Độ dài kiểu không chứng minh trộn trách nhiệm | Giữ; không chia chỉ vì LOC |
| scripts/permission-runtime-service-worker.mjs;936; permission-runtime-t04-worker.mjs;911; permission-ci1-worker.mjs;856 | Runtime/evidence/lifecycle orchestration | Inventory/pure leaf helper trước; không tách worker trong pilot | Rất cao; RF-09 phần cuối, backend HOLD áp dụng |
| scripts/project-ci-results.mjs;786; permission-release-cutover.mjs;705 | Kết quả kiểm/trust/release control | Đổi cùng verifier/trust có nguy cơ tự xác nhận sai | Rất cao; gate riêng |

File nhỏ nhưng rủi ro cao giữ nguyên: src/features/pos/writeOperationFlow.ts (173 dòng), useOrderPaymentFlow.ts (75 dòng), features/shared/permissionSession.ts. Kích thước không phản ánh mức nguy hiểm.

## A2. RF-00/01 — Nguồn, consumer và baseline

Đầu ra trước mọi extraction:
- WIP map checkout515: tracked/untracked/ignored cần giữ; đối chiếu main711 và kho backup, không restore/merge tự động.
- Source manifest code/docs/lockfile và người đang dùng checkout. Recheck refs khi bắt đầu mỗi phần.
- Module map gồm imports/exports/types/barrels và dependency side effects, không chỉ grep tên file.
- Consumer inventory: src/tests, npm scripts, GitHub workflows, test config/setup/reporter, node CLI, docs/operator guide, fixture/manifest, external path/claims. UNKNOWN không được xóa/di chuyển.
- State ownership map cho UI: state/ref/store/query keys/effects/subscribe, async lifecycle, mounted component key/portal và event listeners.
- Config inventory: 52 root (32 Vitest+20 Playwright) **cộng 5 config dưới tests**; đọc cả config imports/inheritance. Không suy root count là toàn bộ.
- Classification cho từng đường: CURRENT_EXECUTABLE; HISTORICAL_PINNED; EXTERNAL_CONTROL_PRIVATE; UNKNOWN. Lập old→new, caller, resolution basis (cwd/import.meta.url/repo root/realpath), trust pins và migration/retention action.
- Baseline result có từng test identity/project/variant/expected skip; không chạy config discovery khi chưa kiểm top-level side effects.
- Map hồi quy tiểu luận: kế thừa [bản đồ 21 FR/8 NFR đã chuẩn hóa](../../../regression-map.md) và [spec reconciliation](../../../spec-reconciliation.md), đọc cùng [phase scope](../../../phase-scope.md)/[test strategy](../../../test-strategy.md). Bổ sung đường requirement/quyết định còn hiệu lực → hành trình → source/test/gap theo phần được chọn. Mốc docs7e29287 của khảo sát 25/10 là lịch sử; code c7f2f4e vẫn chỉ là ứng viên bản demo. Không nhận mapping tài liệu là baseline đã chạy, không nhận đã phủ mọi chức năng cũ. Xem [bàn giao nguồn 26/10](README.md#handoff-20261026); phần độc lập có oracle hiện hành rõ vẫn chuẩn bị được.

Đọc nguồn minh họa: [runtimePorts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/runtimePorts.ts:24), [boundary guard](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/architectureBoundaries.test.ts:129), [query key](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/shared/permissionSession.ts:74).

RF-00/01 hoàn tất khảo sát không tự cấp quyền sửa test/source, nghỉ dùng tool hay đổi trust.

## A3. RF-02/03 — Pilot Report

Đọc source: [ReportDrawer](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/drawers/admin/ReportDrawer.tsx:31), chart:96; [reportHelpers](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/admin/reportHelpers.ts:25); test reportHistoryDrawer.test.tsx:210,224 và reportHelpers.test.ts:7,59.

Phiếu thử đề xuất:
1. RF-02R: khảo sát coverage hiện có, bổ sung ca range→selection reset, các section, loading/error/empty/retry và quyền ở đúng lớp nếu chưa có. Khóa clock/timezone, dữ liệu ngày/tiền và expected theo semantics hiện hành. Dùng UI public interactions, không gọi private function để test giống implementation.
2. RF-03a: tách chart từ JSX thuần sang app/drawers/admin/report/ReportChart.tsx, typed props; giữ hàm chọn giờ và state tại parent. Giữ DOM/event/ref semantics; không dùng index làm key hay đổi data aggregation.
3. Nếu 03a đạt và lợi ích rõ, 03b tách một phần summary/section tiếp theo. Không nhất thiết tạo mọi component trong đề xuất.
4. Giữ đường export ReportDrawer để importer không đổi; không di chuyển report queries/date helpers trong cùng phần. Không tách useReportController ở pilot.
5. Nếu module mới cần nhiều setter/state không liên quan hoặc phải đổi effect để hoạt động: dừng, xem lại seam; giữ file gốc là lựa chọn hợp lệ.

Allowlist dự kiến 03a: ReportDrawer.tsx; report/ReportChart.tsx; các test/harness liên quan đã chốt. Không sửa usePosData, reportHelpers, permissionSession, port/RPC, global theme hoặc config test.
Gates: RF-I01,02,08,09,13; bộ test report/helper/history liên quan + toàn src suite ở checkpoint; build; ui-audit selftest/audit và browser states bị ảnh hưởng. Không nhận benchmark/performance cải thiện nếu chưa đo.
Rollback: revert extraction 03a; characterization RF-02R vẫn giữ nếu còn đúng contract.

## A4. RF-04 — History presentation

Đã có OrderHistoryListPane.tsx và OrderHistoryDetailPane.tsx; ưu tiên boundary còn trộn thật sự. Không tạo thêm layer trung gian chỉ để giảm501 dòng.

- Giữ selectedId là UUID, presentation number không thay identity; giữ filters/page reset và total count.
- Giữ handlers reprint/void trong drawer: [reprint:189](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/drawers/admin/OrderHistoryDrawer.tsx:189), [confirmation:207](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/drawers/admin/OrderHistoryDrawer.tsx:207).
- Không di chuyển useViewLifetime, voidGeneration, kiểm quyền sau await. Refetch rồi clone snapshot/version trước khi mở confirmation; sau xác nhận gửi đúng snapshot đã hiển thị. Nếu version đổi trong khi popup mở thì xử lý OCC conflict theo contract, không âm thầm refetch/rebuild payload sau xác nhận.
- Chỉ tách controls/confirmation view nhận props, callbacks. Giữ portal/focus/cancel/no-op semantics.
- Test mạnh hiện có: writeHistoryLifetime.test.tsx:53–126; permissionUi.test.tsx:109; reportHistoryDrawer.test.tsx:110–188. Bổ sung theo diff, không tuyên bố thiếu toàn bộ lifecycle tests.
- Gates: RF-I02,05,06,07,08,09; cả lịch sử trả về muộn và trạng thái hiện hành; UI audit. Hễ đổi mutation/reprint/read contract thì rời presentation scope và mở gate thật trước.

## A5. RF-05a — Menu; RF-05b — Floor

Làm riêng từng editor; giữ core adminFlow/change builders hiện hành. Không đổi định dạng draft, payload hoặc nghiệp vụ để tiện tách view.

Menu:
- Giữ seed một lần/base snapshot riêng, dirty khi sửa; background refetch không tự ghi đè nháp.
- Giữ item/category ordering, đổi category, modifier links và tombstones.
- Images: giữ validate size/type, upload-before-save, remove behavior, lifecycle/permission check; không dọn ảnh/Storage như tác dụng phụ của refactor.
- Chọn seam presentation cạnh MenuEditorDetailPane hiện có trước; tách controller chỉ ở phiếu tiếp nếu đủ oracle.
- Existing: src/app/menuEditorDrawer.test.tsx:67–204; src/features/admin/adminFlow.test.ts; các lifetime/read/write tests map ở RF-01.
- Gates RF-I02,05,08,10,13; test draft/refetch/cancel, upload fail, save fail/retry và revoked permission.

Floor:
- Giữ draft seed/base snapshot [FloorEditorDrawer:69](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/drawers/admin/FloorEditorDrawer.tsx:69), changeset/save/reseed :222.
- Giữ logical pixel coordinates, rotation/resize/snap, locked object, stage ref và pointer capture. DOM node/portal đổi có thể ảnh hưởng tính tọa độ.
- Giữ tombstones; changeset editor không ghi đè trạng thái bàn đang được POS cập nhật.
- Đã có Toolbar/InspectorPane/TableNode/DecorNode/useFloorObjectTransforms: khảo sát các seam này trước khi tạo hook mới.
- Existing floorEditorDrawer.test.tsx:177–354 khóa changeset/geometry; cần đối chiếu và bổ sung draft giữ qua background refetch, no-op/save→reseed/cancel nếu chưa được suite khác phủ.
- Gates RF-I02,05,08,10,13; kiểm drag/resize/rotate tại các viewport; không chỉ snapshot DOM.

## A6. RF-06 — Shared query helper

Đề xuất features/shared/usePurposeQuery.ts; giữ export cũ ở features/pos/usePosData.ts trong giai đoạn chuyển, giữ barrel features/pos/index.ts không tạo cycle. Consumer admin tại useAdminData.ts:3 đổi trong phần nhỏ sau.

Hợp đồng bắt buộc giữ: query-key identity/generation/purpose/args; permissionRead guard trước/sau; any-of codes; enabled flag; live polling5000ms; no background/focus/reconnect refetch; callback và cache behavior. Nguồn [usePosData:8](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/pos/usePosData.ts:8), [permissionSession:74](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/shared/permissionSession.ts:74), purposePermissions src/app/permissionUi.ts:5.

Không gộp luôn report/history hooks hay sửa tên purpose. Không tạo singleton/store/query client mới. Partial permissions, revocation và old response tests phải chạy cả POS/admin. Nếu wrapper làm module instance/store identity khác, dừng.

Gates RF-I01,02,05,13; reader tests + permission UI/lifecycle + query behavior characterization trước move. Thay read/authority boundary cần mở contract gate phù hợp, không che dưới nhãn di chuyển file.

## A7. RF-07 — orderFlow helper thuần

Đọc [orderFlow](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/pos/orderFlow.ts:72), selection:302, flows:250; [coordinator](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/features/pos/writeOperationFlow.ts:44).
Bước riêng có thể chọn: cart/price-snapshot helpers → payment selection helpers → receipt mapping. Không buộc làm đủ ba; mỗi bước giữ API xuất từ orderFlow và importer cũ, test qua façade lẫn boundary mới khi cần.

Không chạm submitOrderAndPrint/payOrderAndPrint/payOrderItemsAndPrint/voidPaidOrder, writeOperationFlow, requireCurrentPermission, useOrderPaymentFlow ở lượt extraction thuần. Helper có UUID generation không phải thuần tuyệt đối: giữ số/thứ tự cấp ID, test bằng fake generator chỉ trong test; không đổi dependency injection runtime vô cớ.

Đặc biệt giữ:
- Giá/tên/sourceQuantity snapshot cũ; thêm phần mới theo giá mới, không gộp các phần có nguồn giá khác.
- Selection invalid/empty/out-of-range/fraction; full đi full, partial đi split; không đổi payload order/quantity/version.
- Initial receipt grant và rendering từ immutable server snapshot; không biến preview/recovery thành print.
- Guard trước authority await và sau await, kể cả lần lookup thứ hai trong full delegation.
- Singleton WeakMap coordinator theo repo; frozen operationId/payload; 15s timeout, unknown/retry/resume/cancel semantics. Các module này giữ nguyên.

Existing tests: orderFlow.test.ts, orderFlow.lifecycle.test.ts, writeOperationFlow.test.ts, ReceiptPreview.test.tsx; src/app/writeReviewRegressions.test.tsx và browser payment gates liên quan. Gates RF-I03…07/13. Nếu đổi async flow/contract, RF-07 dừng và cần phần nhạy cảm riêng với backend idempotency/financial/permission gate tương ứng.

## A8. RF-08 — Employees và adapters: chọn riêng, HOLD mặc định

Employees đã chia panes; lợi ích phải lớn hơn chi phí tách controller. Trước khi triển khai phải khóa:
- Dirty baseline, chọn đối tượng mới, partial permission revocation; quyền còn lại không bị mất draft sai nhóm.
- update→reset PIN tuần tự, reset dùng employee revision mới; không Promise.all hai mutation.
- Owner self-PIN noop không logout, applied thì logout đúng lúc; đổi selected/authority trong lúc chờ làm callback cũ vô hiệu.
- Existing EmployeesDrawer.permission.test.tsx:53–82, permissionUi.test.tsx:84–107; thêm combined update+reset và late-completion nếu mapping chưa có.

Adapters/mock:
- Không sửa mock implementation cùng expected oracle trong một phần. Dùng fixture/assertions độc lập và backend contract tương ứng.
- Public factories/runtime wiring/DTO/RPC/error mapping giữ; legacy factory còn contract tests, không coi unused.
- Tách pure mappers nếu có input-output/error fixtures đủ trước; stateful permission/identity repo chỉ khi đặc tả và fixture/backend được mở rõ.
- Không đổi SQL/schema/RLS/migration. Nếu cần chạm những phần đó, scope mới, đọc supabase và supabase-postgres-best-practices trước viết.

## A9. RF-09 — Tooling/config theo family

Giữ scripts/ làm gốc trước: scripts/<family>/... ít thay đổi CI discovery hơn chuyển toàn bộ sang tooling/. Cây dự kiến là hướng tổ chức, không phải allowlist triển khai:
- config chuyên biệt: config/vitest và config/playwright, sau khi chốt absolute repoRoot semantics.
- scripts/idempotency, scripts/permissions/<family>, scripts/ci; helper/test đi cùng family khi runner hỗ trợ.
- vitest.config.ts/playwright.config.ts mặc định ở root; trust-bound files có thể giữ root façade dài hạn.
- Historical/pinned phase scripts và external controls giữ vị trí mặc định; “archive/legacy” không phải đích bắt buộc.

Thứ tự phần việc:
1. RF-09a: từ inventory RF-01, chọn một config không trust-bound và ít phụ thuộc; resolved paths trước/sau, local discovery an toàn. Không load candidateEnvironment/backend setup chỉ để list.
2. RF-09b: một pure helper family + importers/test liên quan; node test regex hiện ^scripts/.*\.test\.mjs$ recursive. Giữ đường dưới scripts nếu phù hợp; cập nhật diagnostics/coverage/tsconfig có căn cứ.
3. RF-09c: runner/reporter cluster; compatibility CLI wrapper phải dispatch thực sự. import file không đủ khi main guard dựa import.meta.url==argv[1]. Giữ argv/env/cwd/stdout/stderr/exit/signal, chỉ chạy một lần, cleanup và artifact path.
4. RF-09d: CI/release/trust-bound family là phần nhạy cảm riêng. Old→new trust allowlist và bytes review trước; giữ productionEnabled:false. Không tự refresh trustedFiles để xanh. Policy/consumer/negative-control changes phải cùng một transaction được duyệt; verifier độc lập ngoài phần đang sửa.
5. RF-09e: phase/historical chỉ retain-frozen trước. Chỉ relocate nếu đã chứng minh không phá provenance/realpath/claim; không đổi deadline/commit/hash cũ thành hiện tại. Consumer UNKNOWN giữ HOLD.
6. Gỡ wrapper khi full consumer inventory không còn dùng và compatibility check đã qua trên Windows+CI target; docs links current cập nhật, historical receipts giữ nguyên với relocation map nếu có.

Nguồn nhạy cảm:
- ci/release-policy.json:10; scripts/project-preview.mjs:43–44; project-release.mjs:34–35 pin path set/hash.
- scripts/permission-full-namespace-probe.mjs:229–230 kiểm self realpath; permission-ci1-source.mjs:31–40 kiểm containment/link.
- scripts/permission-full-perm-plan.mjs:3–5,128–148 giữ commit/manifest lịch sử, không rebaseline.
- scripts/permission-release-phase-admission.mjs:4–16,53,63–65 giữ root/deadline/ledger/claims.
- vitest.project-tooling.config.ts:4 dùng import.meta.url cho ci path; nhiều alias dùng ./src; Playwright có testDir/globalSetup/reporter/inheritance.
- scripts/project-ci.mjs:297–300 và project-ci-results.mjs:25 inventory/diagnostics; package.json:16,19 auto-discover defaults.
- .github/workflows/backend.yml có nhiều runner trực tiếp; npm/static import graph không bao phủ hết.

Gates RF-I11,12,13/14, tất cả lane discovery và runner negative controls. **Không move runner và verifier duy nhất của nó trong cùng phần mà thiếu oracle độc lập từ trước.** Self-path guards chưa có phương án tương đương thì giữ file tại chỗ là kết quả hợp lệ.

## A10. Các file và khu vực chủ động giữ nguyên ban đầu

WriteOperationCoordinator/permissionSession internals; async payment/void orchestration; backend SQL/migrations/functions; shared store ownership; historical manifests/source inventories/claims/ledger; private/config directories ngoài repo; dependency/lock versions; root defaults/trusted entrypoints cho đến phiếu riêng.

Không xóa file “không còn import” trước khi kiểm CLI/config/dynamic import/reflection/barrel/docs/external consumers. Không gộp test chỉ để trông gọn. Không thay đổi hành vi UI để giảm lượng props. Bất cứ ngoại lệ nào cần ghi scope và expected trước khi triển khai.
