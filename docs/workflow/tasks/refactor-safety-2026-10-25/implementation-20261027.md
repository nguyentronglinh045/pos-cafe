# Triển khai refactor — 27/10/2026

**Đã hoàn tất phạm vi code được chọn và kiểm chứng tại `c6ff3c795616dfa84379be85feeca29927d173c9`; chưa merge/deploy.** Docs đang qua review/xuất bản riêng. Đây là bản ghi mới, không đổi trạng thái lịch sử của kế hoạch25/10 và bàn giao26/10; không nhận toàn backlog hoặc sản phẩm đã nghiệm thu.

## Quyền thực hiện và nguồn

Chủ dự án giao triển khai code và cập nhật docs tại chat `01a17892-41ab-7bc0-a7db-b488ce10ccac` ngày27/10; bàn giao nguyên văn sang chat Refactor pos-cafe-code. Quyền mới thay giới hạn chỉ lập kế hoạch, giữ nguyên bất biến, gates và các mục HOLD. Cho phép tiếp tục những extraction thông thường đủ điều kiện sau pilot; không tự deploy, apply migration hoặc viết lại controller tiền/quyền/trust.

- Remote main đầu vào: `711a22e71983e3d6aa17799649af05ce4c762555`; docs: `c8073a9edceac208ec299eb80eac23afa04e2ef1`, đã đối chiếu remote.
- Nhánh làm việc: `refactor/structure-safe-20261027` trong checkout sạch có sẵn `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`. Không tạo thêm worktree/runtime.
- Checkout `D:/Workspace/pos-cafe` giữ HEAD5156820 và553 trạng thái WIP; không nhập vào candidate. Main index SHA256 `45849e5188d12f3f52a0354e354e0a8e8d836fa37d68223a1e455d2f8c429352` giữ nguyên tại checkpoint.
- Lock SHA256 `2126d979a7a6c3146cd2ed7b0d718558d5f695efb2707b13a9ec8dd519328477`; Node24.16.0, Playwright1.60.0, Chromium có sẵn. Không cài gói/WSL/Docker. Đầu lượt C~186GiB vàD~97GiB trống.
- Kho bằng chứng: `D:/Workspace/pos-cafe-archive/_refactor-20261027`. `before/manifest.json` ghi733 trạng thái,731file/14.136.687byte, gồm WIP và output cũ; main.index được lưu riêng, không nằm trong số đếm manifest. Kiểm SHA256 và effective ACL; hai deletion được ghi nhận, không tự phục hồi. Backup đóng băng inheritance để giữ quyền hiệu lực; SDDL gốc còn trong manifest. Không di chuyển/xóa dữ liệu gốc.

## Phạm vi và trách nhiệm

Tham chiếu [matrix](regression-matrix.md), [regression map](../../../regression-map.md), [reporting reconciliation](../../../spec-reconciliation.md#reporting). Phần này tác động FR-19, FR-04, FR-07/09 và NFR-03/04/06/07; không tạo requirement mới.

| Phần | Trách nhiệm trước → sau | Trạng thái |
| --- | --- | --- |
| RF-02R | Bổ sung characterization qua App/QueryClient/permission fixture và SVG thật trên Chromium | Đã kiểm, hai reviewer APPROVE; commit `fd7ccb0173da694f3c5852872a1fb717d9ce9432` |
| RF-03a | JSX chart trong ReportDrawer → `report/ReportChart.tsx`; drawer giữ query/state/permission/effect/selection/date/dataset | Đã kiểm, hai reviewer APPROVE; commit `a4a84dcb67a3fc1546569d3ad3093068b5f776c5` |
| RF-03b | Summary/sparkline → `report/ReportSummary.tsx` nhận props; nav/KPI/controller giữ | Đã kiểm, hai reviewer APPROVE; commit `4cffac4a9cce86fb9e33e61c79f5006955ba4e9d` |
| RF-06 | Hook dùng chung → features/shared, giữ export cũ và function identity | Đã kiểm, hai reviewer APPROVE; commit `08bac495f15c2c909c280ddf3253b75513954377` |
| RF-07 | Bốn helper snapshot/cart và hai type → features/pos/orderDraft.ts, giữ façade | Đã kiểm, hai reviewer APPROVE; commit `c6ff3c795616dfa84379be85feeca29927d173c9` |

[ReportChart](https://github.com/nguyentronglinh045/pos-cafe/blob/a4a84dcb67a3fc1546569d3ad3093068b5f776c5/src/app/drawers/admin/report/ReportChart.tsx#L14) là component thuần, không hook/effect/store. Props: hourly, height210/260, selectedHour, hasData, peakHourLabel, onSelectHour. [ReportDrawer](https://github.com/nguyentronglinh045/pos-cafe/blob/a4a84dcb67a3fc1546569d3ad3093068b5f776c5/src/app/drawers/admin/ReportDrawer.tsx#L31) giữ API và controller. Parent506→495dòng; lợi ích là tách trách nhiệm, không nhận giảm tổng LOC hay cải thiện hiệu năng.

## Bằng chứng mới

Mỗi thư mục run có `source-before.json`, `source-after.json`, patch/file mới, command, lock, thời gian, exit và console. Mọi gate cuối bên dưới exit0/sourceUnchanged:true. Không đổi retries, timeout, threshold, skip allowlist, UI baseline hoặc trust hash.

| Candidate | Build | Unit | Full smoke | Selftest / Report audit |
| --- | --- | --- | --- | --- |
| Baseline711a22e | PASS |113file/1201PASS|81executions:44PASS/37configuredskip|23findings/14rules/16controlsPASS;3/3COMPLETE/0finding|
| RF-02R final | PASS |114file/1210PASS|86executions:49PASS/37configuredskip|23/14/16PASS;3/3COMPLETE/0finding|
| RF-03a | PASS |114file/1210PASS|86executions:49PASS/37configuredskip|23/14/16PASS;3/3COMPLETE/0finding|
| RF-03b | PASS |114file/1214PASS|86executions:49PASS/37configuredskip|23/14/16PASS;3/3COMPLETE/0finding|
| RF-06 | PASS |115file/1228PASS|86executions:49PASS/37configuredskip|23/14/16PASS;full48/48COMPLETE/0finding|
| RF-07 / final code | PASS |116file/1240PASS|86executions:49PASS/37configuredskip|23/14/16PASS;full48/48COMPLETE/0finding|

Nguồn lần lượt `runs/baseline`, `runs/characterization-final`, `runs/chart`, `runs/summary`, `runs/shared`, `runs/draft`; JSON unit đặt cùng kho với tên tương ứng. RF-02R riêng thêm9unit và5browser executions. Toàn candidate cuối giữ đủ1201unit cũ, thêm39 thành1240; smoke giữ81executions cũ, thêm5 thành86. `final-inventory.json` đối chiếu chính xác identities/status. Mỗi smoke execution một attempt, retry0, không flaky. Build còn cảnh báo bundle>500kB có từ baseline.

RF-03b có thêm4case summary; trước tách đã chạy13unit và5browser trên code chưa tách summary. Sau tách kiểm đầy đủ tại `runs/summary`; các ca cũ giữ nguyên. Summary46dòng, drawer còn468dòng; child không hook/effect. Reviewer xác nhận5ảnh summary568×320 trước/sau giống byte. Snapshot output cố định ở `summary-fixed-outputs`. Hoàn tác riêng4cffac4 sẽ trở lại chart checkpoint.

Các ca mới khóa ngày UTC khác ngày quán; selection toggle/reset/same date bounds;4section; monthly/custom/reversed bounds; loading/error từng nguồn; retry mọi daily query và projection; empty refresh; màu normal/peak/selected; tooltip; heights210/260; reopen; disabled export. Chúng không nghiệm thu top-item semantics cũ.

Browser giữ6projects. Ca Report mới dùng4landscape profiles và projectportrait đổi sang844×390 **trước login**; không nhận ca mới là kiểm overlay xoay màn hình. Tất cả thêm568×320 để kiểm chart trong vùng cuộn, giới hạn ngang, click cột và đóng drawer; không chứng nhận toàn bộ accessibility/thiết bị thật. Đã đọc audit và xem ảnh mới; các audit chỉ Report không xuất ảnh finding mới khi0findings. Full audit còn xuất ảnh PIN riêng như phần retention bên dưới. Ảnh cũ còn trong ui-audit/out không được đổi nhãn. Một số ảnh overview có notification ghép thiết bị không che thao tác đang kiểm; không nhận pixel-identical mọi ảnh.

Output cố định được snapshot/hash trước ghi đè tại `baseline-fixed-outputs`, `characterization-fixed-outputs`, `chart-fixed-outputs`. Kết quả local mock/UI không thay gate backend, tài chính, Storage, Realtime hoặc nghiệm thu production.

## Review và hoàn tác

Hai reviewer độc lập: `refactor_behavior` (semantics/lifecycle/oracle), `refactor_verification` (boundary/inventory/evidence/bảo toàn). Cả hai APPROVE RF-02R final và RF-03a đúng hashes:

- RF-02R unit `19a09f3dae64dab54eef5c6b8df61f953b8cba9394da59703af5651c5f01f311`; smoke `462997fa1e29a10cde780abef83419585f9e2119224988a08f1afd7a2775ba8a`.
- RF-03a drawer `e71c7a17f43583196a2423a97a4fd0b1e619e6da0930d89d6da09ed6f3aabf63`; chart `f64cacc3e5438e806b1233c5a6608dcb174f78c2e462bfc844b0c4778dfef9fc`.

Gap màu normal/peak của reviewer đã thêm và chạy lại trước approval. Những approval hash cũ chỉ là lịch sử. Rollback RF-03a bằng revert riêng a4a84dc, giữ test fd7ccb0. Không reset checkoutWIP hoặc restore cache để rollback source.

Commit RF-02R có hai thông báo pack index unavailable thoáng qua. Commit thành công; pack/MIDX đổi timestamp cùng thời điểm. Sau đó connectivity fsck, full fsck và MIDX verify đều exit0/không lỗi; indexWIP không đổi. Chưa xác lập nguyên nhân; không tự sửa pack/prune/gc. Lưu quan sát thay vì suy ra mất dữ liệu.

## Những việc không hợp thức hóa trong refactor

- Top món hiện đếm số ngày là top và gán doanh thu cả ngày; chưa phải quantity/revenue thật theo từng món.
- Daily report dates bị cap31 trong helper trong khi order projection nhận toàn khoảng.
- Nhãn tháng nói “theo tuần”, dataset lại theo ngày.

Ba điểm trên có trước extraction, cần phần nghiệp vụ/contract riêng; không sửa expected hoặc công nhận đã đáp ứng spec để qua gate. FIN-WIP-02 thuộc WIPW bị loại khỏi candidate; không gán cho mainO. Metadata staging/ACL không chứng minh local/Vercel tương đương. RF-08, payment coordinator, permissionSession internals, SQL/migrations và trust còn HOLD.

## Shared query, draft và phần giữ nguyên

RF-06 chuyển nguyên declaration/body sang `features/shared/usePurposeQuery.ts:5`, admin đổi import, POS import và re-export trực tiếp. Giữ identity qua barrel, query key store/employee/generation/purpose/args, any-of quyền, enabled/verified, foreground polling5s và guard trước/sau await.14ca hook kiểm disabled/denied/unverified, manual refetch, cache identity, polling và phản hồi muộn qua generation/logout/revision/revoke. Coverage92,70%(1208/1303) giữ scope core/non-hook: **không đo hook**, không dùng tỷ lệ đó thay bằng chứng contract.

RF-07 chuyển nguyên snapshotToDraft/orderDetailToDraft/buildCartLines/calculateCartTotal và type CartLine/OrderFlowOrder. `features/pos/orderDraft.ts` chỉ import type domain; `core/orderDraft.ts` vẫn là validation/snapshot từ catalog hiện hành, không gộp hai chiều. `orderFlow.ts` giữ ID creation, quantity/modifier validation, dirty check, write/payment/receipt/selection và coordinator; façade/barrel giữ identity. Consumer gồm OrderDrawer/OrderCartPane, useServerOrderDraft, flow/recovery/modifier tests; UI-remake B02 harness cũng đi qua façade. Không nhận đã biết mọi consumer ngoài repo.

Trước move,4file/62ca PASS gồm11ca mới kiểm nested copy, ID/sourceQuantity, note, quote0, giá/tên lịch sử, option×item quantity, fallback và tổng/rỗng. Sau move chỉ thêm identity case:63ca focused. Fallback0 và quantity âm chỉ characterize helper hiển thị; không là quyền gửi đơn không hợp lệ hoặc bỏ validation server. Mapping bổ sung FR-07/09, IDEM-26/27; không nhận đã kiểm toàn requirement backend. Full coverage sau move116file/1240PASS; module mới18/18lines và16/16branches trong scope cũ, tổng vẫn1208/1303lines. Build/unit/coverage/smoke/selftest/full audit đều hoàn tất trên đúng source, hai reviewer APPROVE.

| Phần | Quyết định ngày27/10 và căn cứ | Điều kiện mở lại |
| --- | --- | --- |
| RF-04 History | NO_CHANGE. Đã có List/DetailPane và shared control; parent giữ selection, fresh void snapshot, generation/view guard và reprint lifetime. | Có vấn đề trách nhiệm cụ thể, đủ oracle lifecycle; không tách vì501dòng. |
| RF-05a Menu | NO_CHANGE. Catalog/Detail panes, modifier hook/editor, draft/image/change helpers đã riêng; parent giữ base/draft/dirty/upload→check→save→refetch. | Lợi ích vượt chi phí prop/state indirection; giữ upload và lifetime. |
| RF-05b Floor | NO_CHANGE. Toolbar/Inspector/transforms/pickers/nodes đã riêng; parent giữ draft/base/stageRef/geometry/save. | Có seam hữu ích và oracle geometry/draft tương ứng. |
| RF-08 | HOLD như phạm vi ban đầu. | Quyền/phạm vi và backend/lifecycle gates riêng đủ. |
| RF-09a–c | NO_CHANGE trong đợt này;32rootVitest+20rootPlaywright+5nested config giữ. | Chứng minh lợi ích, discovery/CLI/path parity trước di chuyển. |
| RF-09d–e | HOLD/frozen;64trusted paths, productionEnabled:false giữ. Không đổi trust hashes/ledger/phase paths. | Scope riêng đáp ứng realpath/namespace/trust/external bindings. |

Đây là quyết định đã rà theo code, không phải khẳng định các controller không có lỗi hoặc RF-09 đã di chuyển xong. Parent Report còn468dòng và OrderFlow giảm441→380dòng; các phần còn lại giữ trách nhiệm điều phối. Không tuyên bố mọi file lớn đã được xử lý.

## Các lần kiểm chưa đạt và bảo toàn bằng chứng

Các iteration lỗi selector, stale SVG, format tiền và fixture top-item của RF-02 chỉ sửa test harness; không sửa app để khớp expected sai. RF-06 coverage lần đầu1223PASS/1timeout ở architecture test5000ms khi chạy cùng audit. Giữ log, chạy lại riêng maxWorkers2 đạt1224; không nới timeout/retry/config và không khẳng định CPU là nguyên nhân. Baseline coverage1224case thuộc bản10hookcase; sau đó13focused trước move đạt, bản14case sau move/full1228 đạt. Không đổi nhãn baseline thành số ca về sau.

Hai thử nghiệm manual-refetch ban đầu subscribe status quá muộn; sửa harness quan sát status trước action và assert returned error/read0, không đổi guard. RF-06 selftest đầu truyền thừa `--` qua wrapper và dừng ở parser; corrected invocation `shared/audit-selftest-final` đạt23/14/16. Mọi failure vẫn có receipt riêng.

Full audits còn xuất3ảnh PIN dù0finding. Reviewer phát hiện bản lưu12file chưa gồm ảnh; đã bổ sung cho shared-before và shared, kiểm đúng hash trong status của từng lần. Supplement ghi thời gian sao chép thực sau RF-06, không giả đã sao chép tại baseline. Helper snapshot được sửa để giữ pinPhotos ở lần sau. RF-07 coverage/build dùng output mặc định `coverage/` và `dist/`; không mô tả là output đã cách ly. Đã copy/hash vào kho task: `draft-coverage-output`56file/728.304byte, `draft-dist-output`160file/8.114.672byte, `draft-fixed-outputs`15file. Dist cũ đã có bản before.

Raw logs/source manifests/ảnh giữ ngoài repo tại kho task; [evidence compact](implementation-20261027-evidence.json) và [review](implementation-20261027-review.md) ghi liên kết, hash và giới hạn. Không đưa WIP/private ACL/credential vào docs.

## Hướng dẫn đọc và hoàn tác

1. Đọc `ReportDrawer` trước, rồi `report/ReportChart` và `ReportSummary`: dữ liệu đi xuống bằng props, callback hour đi lên; state/effect/query vẫn ở drawer.
2. Đọc `usePurposeQuery`, POS compatibility export và admin import: một owner cho query policy, cùng function identity. So14case contract và existing permission/cache suite.
3. Đọc `orderDraft` rồi phần import/re-export trong `orderFlow`: helper nhận dữ liệu và trả dữ liệu; luồng async không di chuyển. So12case mới, retained-price/tombstone và lifecycle tests cũ.
4. Đọc bảng gate với source manifest trước/sau; mock PASS không thay backend nghiệm thu. Xem ba finding Report đang mở trước khi dùng số liệu cho báo cáo nghiệp vụ.

Walkthrough được cung cấp bằng đường đọc này và bàn giao cuối; chưa có phản hồi xác nhận chủ dự án đã đọc/hiểu hoặc nghiệm thu. Rollback mặc định dùng revert nguyên từng commit trên nhánh refactor phù hợp, từ mới đến cũ khi hoàn tác toàn đợt; không reset mainWIP. RF-03b4cffac4 phụ thuộc charta4a84dc; hoàn tác summary trước chart. Shared08bac49 độc lập presentation. Revert nguyên RF-03b/RF-06/RF-07 cũng gỡ test bổ sung đi kèm; test đã có ở parent vẫn giữ. Nếu muốn giữ characterization mới, đó là phương án khác: khôi phục riêng bản test pre-move từ patch/file đã lưu (summary-before/unit-focused, shared-before/unit-final-3 hoặc draft-before/unit-focused), không giữ identity imports/assertions trỏ tới module đã gỡ, rồi chạy lại gates và review. Không tuyên bố revert tự giữ mọi test, không copy runtime/DB cũ để rollback code.

Code cuối `c6ff3c795616dfa84379be85feeca29927d173c9` có5commit/12file thay đổi so với main711a22e. Source giữa các gate không đổi; commit chỉ ghi đúng candidate đã review. Checkout gốc giữ551file WIP cùng hash/ACL,2deletions,553status,HEAD và index theo kiểm lại cuối. Không cài dependency/runtime, không sửa config/trust/SQL, không mở backend HOLD. Nhánh refactor và docs được xuất bản sau review; main vẫn711a22e, chưa merge/deploy. Trạng thái push cụ thể được xác minh trong bàn giao cuối.

<!-- generated-source-map -->
## Nguồn code có mốc và dòng

| Trách nhiệm | Nguồn |
| --- | --- |
| Report controller | [src/app/drawers/admin/ReportDrawer.tsx:32](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/app/drawers/admin/ReportDrawer.tsx#L32) |
| Chart / summary | [src/app/drawers/admin/report/ReportChart.tsx:14](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/app/drawers/admin/report/ReportChart.tsx#L14) |
| Summary props | [src/app/drawers/admin/report/ReportSummary.tsx:13](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/app/drawers/admin/report/ReportSummary.tsx#L13) |
| Shared query policy | [src/features/shared/usePurposeQuery.ts:5](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/features/shared/usePurposeQuery.ts#L5) |
| POS compatibility export | [src/features/pos/usePosData.ts:8](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/features/pos/usePosData.ts#L8) |
| Admin import shared | [src/features/admin/useAdminData.ts:3](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/features/admin/useAdminData.ts#L3) |
| Snapshot / cart / total | [src/features/pos/orderDraft.ts:13](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/features/pos/orderDraft.ts#L13) |
| Flow facade; submit189/pay213/split297/void361 giữ | [src/features/pos/orderFlow.ts:31](https://github.com/nguyentronglinh045/pos-cafe/blob/c6ff3c795616dfa84379be85feeca29927d173c9/src/features/pos/orderFlow.ts#L31) |
| History NO_CHANGE: panes và lifetime | [src/app/drawers/admin/OrderHistoryDrawer.tsx:33](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/OrderHistoryDrawer.tsx#L33) |
| Menu NO_CHANGE: panes/draft/lifetime | [src/app/drawers/admin/MenuEditorDrawer.tsx:26](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/MenuEditorDrawer.tsx#L26) |
| Floor NO_CHANGE: panes/transforms/draft | [src/app/drawers/admin/FloorEditorDrawer.tsx:27](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/drawers/admin/FloorEditorDrawer.tsx#L27) |
