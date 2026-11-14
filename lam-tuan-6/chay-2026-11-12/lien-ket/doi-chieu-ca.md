| Mã | File:dòng | Loại | Kết quả 12/11 | Ghi chú |
| --- | --- | --- | --- | --- |
| FR-01 | `src/app/createStoreCloseout.test.tsx:25` | unit (U) | 1 passed | TC-PIN-12 warning acknowledgement gates creation before network |
| FR-01 | `src/app/createStoreCloseout.test.tsx:35` | unit (U) | 1 passed | TC-PIN-11 pending submit rejects a second click and locks the canonical payload |
| FR-02 | `src/features/session/sessionFlow.test.ts:23` | unit (U) | 1 passed | pairs store and returns a StoreSession without raw store key |
| FR-02 | `src/features/session/sessionFlow.test.ts:53` | unit (U) | 1 passed | fails if pairStore does not produce a session |
| FR-03 | `src/app/requiredPinChange.test.tsx:52` | unit (U) | 1 passed | keeps restricted identity out of normal authority and completes once |
| FR-03 | `src/app/requiredPinChange.test.tsx:68` | unit (U) | 1 passed | does not replay a completion whose acknowledgement is unknown |
| FR-04 | `src/app/permissionUi.test.tsx:29` | unit (U) | 1 passed | shows baseline floor but hides unavailable modules and rejects direct drawer opening |
| FR-04 | `src/app/permissionUi.test.tsx:54` | unit (U) | 1 passed | revocation closes the dirty affected editor, purges its cache, retains unrelated draft and session |
| FR-04 | `tests/contracts/permissionAdministration.contract.test.ts:122` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| FR-05 | `src/app/drawers/admin/EmployeesDrawer.permission.test.tsx:35` | unit (U) | 1 passed | TC-PERM-59 renders exact field validation and never calls create for invalid input |
| FR-05 | `src/app/drawers/admin/EmployeesDrawer.permission.test.tsx:53` | unit (U) | 1 passed | TC-PERM-59 distinguishes no-op, applied update and reset-PIN outcomes with exact messages |
| FR-06 | `tests/smoke/pos-cafe.spec.ts:150` | smoke (S) | 4 passed, 1 skipped | desktop:passed tablet-landscape:passed phone-landscape:passed small-landscape:passed portrait:skipped |
| FR-06 | `tests/ui-remake/integration/areas.spec.ts:46` | browser (B) | KHÔNG CHẠY ĐƯỢC | file cần artifacts/stitch/B01/v3/responsive-contract.proposed.json, không có trong repo |
| FR-07 | `src/features/pos/orderFlow.test.ts:41` | unit (U) | 1 passed | preserves source identity and immutable price/name snapshots in drafts |
| FR-07 | `src/features/pos/orderFlow.test.ts:105` | unit (U) | 1 passed | increments simple menu lines and removes zero quantity lines |
| FR-07 | `tests/ui-remake/integration/journey.spec.ts:59` | browser (B) | 2 passed | floor to new modifier order to kitchen to payment 568 \| floor to new modifier order to kitchen to payment 1920 |
| FR-08 | `src/app/shell/LeftNav.test.tsx:33` | unit (U) | 1 passed | link trỏ vào bên trong ca dòng 23; owns the sidebar navigation and drawer selection actions |
| FR-08 | `src/app/drawers/pos/TakeawayDrawer.tsx:73` | không phải ca kiểm | — | link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng |
| FR-09 | `src/features/pos/modifier.test.ts:30` | unit (U) | 1 passed | requires a pick for required groups |
| FR-09 | `src/features/pos/modifier.test.ts:59` | unit (U) | 1 passed | multiplies option price delta by its quantity in snapshot total |
| FR-09 | `tests/smoke/pos-cafe.spec.ts:131` | smoke (S) | 4 passed, 1 skipped | desktop:passed tablet-landscape:passed phone-landscape:passed small-landscape:passed portrait:skipped |
| FR-10 | `src/features/pos/orderFlow.test.ts:57` | unit (U) | 1 passed | diffs only the newly added kitchen lines when re-submitting an order |
| FR-10 | `tests/ui-remake/integration/journey.spec.ts:59` | browser (B) | 2 passed | floor to new modifier order to kitchen to payment 568 \| floor to new modifier order to kitchen to payment 1920 |
| FR-11 | `tests/smoke/demo-runbook.spec.ts:103` | smoke (S) | 1 passed | link trỏ vào bên trong ca dòng 4; demo-runbook:passed |
| FR-11 | `tests/contracts/permissionFinancialRegression.contract.test.ts:216` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| FR-12 | `tests/ui-remake/integration/journey.spec.ts:15` | browser (B) | 2 passed | floor to order dirty-exit to split/full payment to floor 568 \| floor to order dirty-exit to split/full payment to floor |
| FR-12 | `tests/contracts/permissionFinancialRegression.contract.test.ts:237` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| FR-13 | `src/app/components/ReceiptPreview.test.tsx:14` | unit (U) | 1 passed | TC-IDEM-050/core prints 2 × 40000 from the original option quantity and original metadata |
| FR-13 | `src/app/components/ReceiptPrintLifecycle.test.tsx:46` | unit (U) | 10 passed | ca có tham số, 10 biến thể; TC-IDEM-051/core/print=${stage}/transition=${transition} invalidates the old print before it |
| FR-13 | `src/app/components/ReceiptPrintLifecycle.test.tsx:65` | unit (U) | 1 passed | TC-IDEM-051/core/print=positive a current authorized click prints exactly once |
| FR-14 | `src/app/reportHistoryDrawer.test.tsx:160` | unit (U) | 1 passed | shows paid order payment snapshot in the receipt summary |
| FR-14 | `src/app/reportHistoryDrawer.test.tsx:178` | unit (U) | 1 passed | keeps open orders out of the order history view |
| FR-14 | `tests/smoke/demo-runbook.spec.ts:141` | smoke (S) | 1 passed | link trỏ vào bên trong ca dòng 4; demo-runbook:passed |
| FR-15 | `tests/smoke/demo-runbook.spec.ts:161` | smoke (S) | 1 passed | link trỏ vào bên trong ca dòng 4; demo-runbook:passed |
| FR-16 | `src/app/menuEditorDrawer.test.tsx:67` | unit (U) | 1 passed | saves new menu items through menu changesets |
| FR-16 | `src/app/menuEditorDrawer.test.tsx:145` | unit (U) | 1 passed | warns about the menu image size limit and blocks oversized files |
| FR-17 | `src/app/floorEditorDrawer.test.tsx:177` | unit (U) | 1 passed | saves new tables through floor changesets without table status |
| FR-17 | `src/app/floorEditorDrawer.test.tsx:200` | unit (U) | 1 passed | saves logical table updates without overwriting status |
| FR-18 | `src/app/floorEditorDrawer.test.tsx:149` | unit (U) | 1 passed | selects one of 11 table backgrounds and persists the asset key |
| FR-18 | `tests/smoke/pos-cafe.spec.ts:362` | smoke (S) | 1 passed, 4 skipped | desktop:passed tablet-landscape:skipped phone-landscape:skipped small-landscape:skipped portrait:skipped |
| FR-19 | `src/app/reportHistoryDrawer.test.tsx:224` | unit (U) | 1 passed | expands 7-day report ranges into daily report calls without changing the port contract |
| FR-19 | `tests/smoke/demo-runbook.spec.ts:141` | smoke (S) | 1 passed | link trỏ vào bên trong ca dòng 4; demo-runbook:passed |
| FR-20 | `src/adapters/mock/permissionChangesRepo.test.ts:31` | unit (U) | 1 passed | allows delegated settings with unchanged timezone but owner-only timezone change rolls back the whole request |
| FR-20 | `src/adapters/mock/permissionChangesRepo.test.ts:42` | unit (U) | 1 passed | keeps clear-demo semantics, owner-only authority, and permission identity state |
| FR-21 | `src/adapters/supabase/permissionSignalPort.test.ts:28` | unit (U) | 1 passed | decodes only minimal same-store store and catalog signals |
| FR-21 | `src/adapters/supabase/permissionSignalPort.test.ts:50` | unit (U) | 1 passed | requests authority verification only after reconnect and cleans up once |
| NFR-01 | `tests/contracts/permissionFinancialRegression.contract.test.ts:216` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| NFR-01 | `tests/contracts/permissionFinancialRegression.contract.test.ts:237` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| NFR-02 | `tests/contracts/permissionAdministration.contract.test.ts:122` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| NFR-02 | `tests/contracts/permissionAdministration.contract.test.ts:644` | contract (cần backend PG16) | CHƯA CHẠY | cần cơ sở dữ liệu thật; ngoài phạm vi máy này |
| NFR-03 | `src/architectureBoundaries.test.ts:124` | unit (U) | 1 passed | keeps foundation layers pure and dependency-light |
| NFR-03 | `src/architectureBoundaries.test.ts:148` | unit (U) | 1 passed | keeps feature, adapter, and app layers pointed in the right direction |
| NFR-04 | `tests/smoke/pos-cafe.spec.ts:150` | smoke (S) | 4 passed, 1 skipped | desktop:passed tablet-landscape:passed phone-landscape:passed small-landscape:passed portrait:skipped |
| NFR-04 | `tests/smoke/permission-ui-closeout.spec.ts:86` | smoke (S) | 4 skipped, 1 passed | desktop:skipped tablet-landscape:skipped phone-landscape:skipped small-landscape:skipped portrait:passed |
| NFR-05 | `src/core/permissionLifecycle.test.ts:24` | unit (U) | 1 passed | reads only revisions every 30s and does not reapply a no-op snapshot |
| NFR-05 | `src/features/pos/writeOperationFlow.test.ts:109` | unit (U) | 1 passed | TC-IDEM-054/core refuses offline confirmations without a write, outbox, or automatic reconnect work |
| NFR-06 | `package.json:14` | không phải ca kiểm | — | link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng |
| NFR-06 | `tsconfig.app.json:10` | không phải ca kiểm | — | link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng |
| NFR-07 | `vitest.config.ts:10` | không phải ca kiểm | — | link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng |
| NFR-07 | `package.json:18` | không phải ca kiểm | — | link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng |
| NFR-07 | `tests/smoke/demo-runbook.spec.ts:4` | smoke (S) | 1 passed | demo-runbook:passed |
| NFR-08 | `vercel.json:1` | không phải ca kiểm | — | link tới mã/cấu hình, chỉ đối chiếu link còn đúng dòng |
