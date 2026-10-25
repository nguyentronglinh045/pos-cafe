# Review triển khai giới hạn vòng kiểm thử — 21/10/2026

Owner giao ba sửa theo kế hoạch đã review; giữ coverage, không merge/Supabase, kiểm guard trước backend. User message15:59:29 cho token thoải mái, dừng bất kể hoàn thành lúc17:00 theo thiết bị (+07). Không mở thêm allowance action/review.

Candidate01 SHA256 `ad37d29e9a1d20b5fd94d5c18d7b3764c80f45851a84e05ea46bcf5e7925da92`: hai reviewer độc lập trả CHANGES_REQUESTED. Snapshot và verdict cũ giữ tại evidence/loop-prevention-20261021/candidate01; không ghi lại thành APPROVE.

| Finding chặn | Bằng chứng | Xử lý ở candidate02 |
|---|---|---|
| Source: selftest không đi qua exporter worker thật | diagnostic-selftest chỉ gọi finiteDiagnosticFacts, nên worker làm mất facts mà control vẫn xanh | Import/call trực tiếp hai ci1FailureExport, gồm wrapper; mutation sau actual export; actual pinned7/7 và20mutation PASS |
| Operations: thay ledger/workstream phía sau approval | pure validator chấp nhận manifest dùng ledger mới trong khi packet pin ledger cũ | So khớp chính xác packet.budget.path/hash và workstream; negative alternateledger/hash/workstream |
| Operations: final CI summary bỏ diagnosticControls | publicSummary từ source316 chỉ xuất bốn control cũ, loại object nested | Projection hữu hạn source/lock-bound; test actual publicSummary → admission, raw sentinel và stale metadata bị từ chối |

Candidate02 SHA256 `23df868f25781596df1406603f965c0df7688663280082ced9be1d309efbc667` tại `D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021/candidate02/packet.json`. Bao gồm18source,7docs,2externalcollectors và3checks,88effectivepins, snapshot/patch có thể phục hồi. FullscriptsNode805/805PASS0fail0skip; actual Playwright1.60.0 controls7/7/20mutation. Sourcebase316 + snapshot WIP được commit thành315a31e0, canonicalpins đã đối chiếu toàn bộ.

**loop_source_final_review — APPROVE source scope trên candidate02.** Đã kiểm độc lập27tests PASS0skip, đọc lại5actualrunnerreports và chạy pipeline/20mutation; snapshot/source/pins khớp. Xác nhận blocker exporter đã đóng, không có blocker khác trong scope.

**loop_operations_final_review — APPROVE operations/budget/docs scope trên candidate02.** Đã chạy3admissiontests từ frozen snapshot PASS0skip, gồm actualproducer→consumer và alternateledger;44referencedhashes và18canonicalchangedpins khớp. Xác nhận hai blocker của scope đã đóng và docs giữ đúng ranh giới local/CI/backend.

Reviewer chỉ đọc/chạy phép kiểm local, không sửa candidate, cài môi trường, commit hoặc dispatch. Cả hai approval chỉ cho phép tiến tới một publication nếu actual admission còn đạt; không thay PASS own-sourceCI/backend và không ghi đè thời hạn.

Sau approval, commit18file315a31e0 được tạo cục bộ. Actual publish dry-run từ chối lúc16:23:00.696+07 với PERMISSION_RUNTIME_ADMISSION_REFUSED/BATCH_BUDGET; budgetinspect xác nhận DEADLINE khi reserve37phút. Không publication/CI/backend phát sinh. Control chẩn đoán7/7/20 được chạy lại trên commit315 có trackedsource sạch; kết quả local giữ riêng, không đổi verdict lịch sử hoặc làm PASS CI.

Counts kế thừa: publication0/1,CI0/1,heavy0/2,reviewRounds2/2. Bằng chứng và lệnh tiếp tục ở [bàn giao](../workflow/tasks/permission-loop-prevention-implementation-2026-10-21.md). Hồ sơ này ghi đúng các verdict đã nhận và các sự kiện sau review; không tạo review đệ quy cho metadata review.
