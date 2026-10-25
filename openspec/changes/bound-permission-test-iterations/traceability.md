> **Đối chiếu xuất bản 25/10/2026.** Các ngân sách, deadline, spent counters và authorization21/10 bên dưới là lịch sử đã kết thúc. Xuất bản hồ sơ không cấp lượt CI/backend/retry mới và không reset ledger. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Truy vết

| Requirement | Test | Trạng thái checkpoint |
|---|---|---|
| R1 | T1,T2 | localactualpinned7/7 và finitepipelinePASS; backend chưa chạy |
| R2 | T3,T8,T9 | actualworkerexport/collector,20mutationsPASS; publicSummary→admissionPASS; CI17 pending |
| R3,R3a | T4,T5,T6 |12budgettestsPASS gồm suffix/head/successor; actualtimeadmissionREFUSED đúng16:23 |
| R4 | T7,T8,T9 |3admissiontestsPASS; hai reviewerAPPROVE; actualCI/backend còn pending |
| R5 | T9 và handoff | code315a31e0/packet02/snapshot/patch/805Node/reviews/recipe đã lưu; chưa hoàn tấtCI/backend |

R3b→T10: grant2review và successor23:00 đang triển khai; source/checks/review mới phải ghi riêng. CI17 và affectedbackend không bị bỏ hoặc thay bằng kết quả local.

R3c→T11: single-successor receipt, siblinggrant/time-onlyfork, missing/driftclaim đượckiểm ởcandidate04. Giữ candidate03 sourceCHANGES_REQUESTED/operationsAPPROVE và counterexample làm lịch sử.

Checkpoint16:14 thay trạng thái WIP ở trên: R1/R2 actual pinned controls7/7 và20mutationsPASS local, collectorhelper đã nối; R3/R3a budget12PASS gồm head/successor; R4 admission negativesPASS nhưng own-sourceCI/reviews pending. R5 operatorguide nằm scripts/permission-runtime-iteration.md ở code; bộ spec/decision/evidence/handoff ởdocs. Chưa tuyên bố cả change hoàn tất.

## Bổ sung Edge và grant18:59

| Requirement mới | Test | Bằng chứng/trạng thái |
|---|---|---|
| R3d | T12 |20 budget tests PASS trong full821; actual successor grant-receipt giữ counts1/1/1/4, deadline23:00; review pending |
| R6 | T13,T7,T9 |local graph/archive/pipeline/admission counterexamples PASS,821Node0skip; actual native CI18/OCI backend pending |

R1–R5 và T1–T11 giữ acceptance; CI17ed73 đã PASS, PIN setupFAIL do drift, T04HOLD. Đối với source thay đổi, CI18 là17 gate cũ cộng Edge, không được dùng CIed73 thay PASS nguồn mới.

## Đóng lượt sau CI25FAIL

| Requirement | Kết quả cuối lượt23:00 |
|---|---|
| R1,R2 | Own-sourceCI25 actualreporter4/diagnostic7/20PASS; nativeprobe mới còn I/Oreason0gap, khôngsuy toànpipeline hoàn tất |
| R3d |21budgettests/full823PASS, actualCLOSED lineage/spent2/2/1/6; mọireservationmax đãkiểm |
| R4,R6 |CI18FAILphase8, remainingNOTRUN; actualpreparerREFUSE CI_NOT_PASS, khôngbackend mới; nativebundle/cleanup chưaPROVEN |
| R5 |Source90/packet06/reviews/log/modes/incident/state/recipe đãlưu; taskchưahoàntất, nextcleanupfixunapplied/unreviewed |

## Continuation V4 — checkpoint 20:13 ngày 22/10/2026

| Requirement giữ nguyên / phần mở rộng theo grant | Test | Trạng thái checkpoint, source ad265321144521c0669500fea9be0f96ebacb769 |
|---|---|---|
| R3/R3a/R3b/R3c/R3d: lịch sử không reset, deadline và successor | T14 / V4-01…08,10,11,13 | Implemented; whole tracked Node 935/935 PASS, fail/skip 0; hai final scopes APPROVE; V4 giữ historical 4/4/1/6. Own publication/CI intent đã settle, T04 có intent riêng đang pending |
| R4: admission source/review/disk/runtime trước external action | T14 / V4-08…13 | Refusal source f351 trước reserve không tiêu external budget; fix binary 64 MiB giữ 1.107 pins/41.686.492 bytes, fresh 935 + hai review. Publication và heavy T04 đã qua fresh admission; không miễn admission lượt sau |
| R1/R2/R6: diagnostics và Edge giữ acceptance | T7–9,T13,T14 / V4-09,14 | Actual CI18 run39780944907 terminal PASS, CI node-tools 935/935, reporters4 + diagnostics7/20, native20/cleanup được collect và settle. T04 run39783325574 active 1/8 đã khởi chạy; 7 service profiles NOT_RUN; full35/760 +12obligations chưa PASS |
| R5: hồ sơ và recipe tiếp tục | T14 / V4-14 | Packet/reviews02, night-node02, night-ci01-* ở evidence source mới; immutable plan/history giữ nguyên. Owner cleanup grant tới00:00; Auth/TEST21:00–21:45 riêng, chưa bắt đầu; chưa merge main/nghiệm thu fullgate |

Đây là tooling/operational invariants, không có use case sản phẩm mới. Evidence: `D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/`; [incidents](../../../docs/implementation-log/permission-main-staging-night-20261022/preparation-incidents01.json), [cleanup grant](../../../docs/implementation-log/permission-main-staging-night-20261022/owner-fixture-cleanup-grant01.json), [Auth/TEST grant](../../../docs/implementation-log/permission-main-staging-night-20261022/owner-auth-test-grant01.json). Các grant chỉ mở đúng scope/window đã ghi, không đổi acceptance cũ. CI có smoke applicability skips/manualDeferred được chấp nhận; không tuyên bố toàn CI zero-skip hoặc full coverage. Tình trạng backend là checkpoint do điều phối báo, không phải API được gọi lại trong lượt sửa docs này.
