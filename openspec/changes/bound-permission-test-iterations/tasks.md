> **Đối chiếu xuất bản 25/10/2026.** Các ngân sách, deadline, spent counters và authorization21/10 bên dưới là lịch sử đã kết thúc. Xuất bản hồ sơ không cấp lượt CI/backend/retry mới và không reset ledger. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Việc tiếp tục

- [x] Lưu quyết định owner và ngân sách gốc, không reset bằng SHA/chat mới.
- [x] Viết WIP projection/transport, reporter controls và data admission/ledger.
- [x] Targeted58PASS0skip,syntax0errors; giữ snapshot/patch.
- [x] Sửa journal suffix rollback và kiểm reserve/deadline/recovery counterexamples — candidate02.
- [x] Nối collector thật; hoàn thiện controls/mutation và operator guide ở code — candidate02.
- [x] Full Node805PASS0skip, source/operations review cùng APPROVE candidate02.
- [ ] Chỉ publish/CI/heavy nếu owner cấp ngân sách tiếp rõ ràng và guard đạt; batch này giữspent, không tự mở lại.
- [ ] Lưu actual CI/pinned reporter/guard verdict; sau đó mới quyết định affected backend.

STOP trước publication/CI/heavy. Không merge, giảm coverage, public raw logs hoặc cập nhật Supabase.

## Continuation đến17:00 theo owner

- [x] Lưu authorization mới, V2 kế thừa frozenledger, không reset allowance/spent.
- [x] Fix suffix/head/crash và reserve counterexamples;12budgettestsPASS.
- [x] Nối2collector thực với helper; actualpinned7controls/20mutationsPASS; operatorguide ởcode.
- [x] FullscriptsNode804PASS0skip; giữ lịch sử lần thiếu environment.
- [x] Hai independentreview scopes source/operations trên candidate02; ba blocker đã đóng, cả hai finalAPPROVE.
- [ ] Chỉ publication/CI nếu reviewPASS và còn>=37phút, chỉbackend sauown-sourceCI17/cleanup nếu còn>=42phút. Không chạy bù quá17:00.
- [ ] Thu tất cả run/evidence, đóngledger, snapshot/patch/handoff và trạng thái tiến trình trước17:00 dù chưa xong.

Kết quả16:23: admission thực từ chối vì DEADLINE khi reserve37phút. Không có publication/CI/heavy nên không có run mới để thu. Code đã commit315a31e0 cục bộ; source snapshots/patch/805Node/actualpinned7/20 và hai verdict giữ đầy đủ. Handoff hiện tại là điểm tiếp tục; policy cũ không được sửa hoặc tự mở lại. Không coi thời gian còn dưới37phút là ngân sách cho CI mới.

## Continuation23:00 theo owner18:11/18:13

- [x] Xác minh88pins/source315a31e0, remote31693d7, ledgerCLOSED2reviewspent, khôngactivejobs/WSL.
- [x] Nhận explicitgrant thêm2review; execution allowance giữ1/1/2, khôngreset.
- [x] Guard grant2/single-successor,17budgettests/fullNode810, diagnosticsunchanged7/20, candidate04 haiAPPROVE.
- [x] Publication1 lần qua actualadmission, sourceed73a415; ownCI17 run39592119259 đang chạy.
- [x] CI17 terminalPASS17phase; finalcontrols4+7/20, collect/nativecleanup và unchangedskipcomparison đã đạt.
- [x] PIN_ONBOARD actualpreflight đạt, dispatch1/2backend run39593847459, đang chạy.
- [ ] Chỉ sau mọi guard/preflight đạt mới chạy affectedT04/PIN profiles, mỗi lượt đủscope và budget.
- [ ] Đóngsổ/handoff/cleanup trước23:00 bất kể kết quả.

## Bổ sung Edge và grant18:59

- [x] Điều tra shared Edge blocker; tái hiện cả hai proof validators, giữ T04HOLD và reclaim evidence.
- [x] Owner cấp thêm1/1/1/2; guard local tests PASS, actual V3 giữspent và same deadline.
- [x] Draft lock/helper/CI native preflight, public transport/admission và đầy đủ821NodePASS0skip; chưa actual native resolver.
- [ ] Hai scope APPROVE exact frozen candidate.
- [ ] Một publication và own-sourceCI18; nếu FAIL dừng phụ thuộc, không chạy backend để rediscover.
- [ ] PIN48+7 rồiT0419 theo gate, một runtime, terminal/reclaim giữa lượt; gặp lỗi tiếp dừng và giữevidence.
- [ ] Closeout trước23:00, kể cả chưa hoàn tất.

## Đóng lượt sau CI25FAIL

- [x] Candidate06 haiAPPROVE; publicationbổsungduynhất source90, CI25 đãterminal/collect.
- [x] GặpFAIL phase8thìdừng; khôngbackend/retry. Xácminh0555cleanupdefect, ghi primaryUNKNOWN và EdgecleanupNOTPROVEN.
- [x] GuarddatahelperREFUSE thực; counts2/2/1/6 và V3CLOSED, noactivejobs, source90giữnguyên.
- [ ] Sửa owned-directory cleanup, primary/cleanup facts và Linux0555control ở lần được cấp tiếp; chưaápdụng/review.
- [ ] Own-sourceCI18PASS/nativecleanup rồiPIN48+7/T0419; chưahoànthành.

Đãdừngtrước23:00doactionbudgetexhausted, khônggia hạn hoặcreset lịch sử.

## Continuation V4 đến00:00 đầu23/10 — checkpoint 20:13 ngày 22/10/2026

- [x] Pin actual grant 2 candidate push +2CI +8 whole backend; deadline17:00UTC, không token cap; giữ lịch sử.
- [x] Hai non-author scopes APPROVE plan exact SHA bd8f385942656ce48c5ac437e62d3a608097dc4cb5e6946f21419a93cb5c26f7; post-gate CI annex và extra2 automatic CI PR/main có grant riêng, chưa tiêu.
- [x] Implement đúng 5 file; targeted guards trước test nặng; whole 69 tracked Node files 935/935 PASS, fail/skip0 trên source ad265321144521c0669500fea9be0f96ebacb769.
- [x] Freeze candidate/packet/policy, hai final review; init V4 giữ historical4/4/1/6. Giữ refusal ENOBUFS source f351 trước reserve làm lịch sử: 1MiB vs PNG1.743.309B; fix binary64MiB giữ1107pins/batch41.686.492B, fresh935+hai review; không CI/backend spent cho refusal.
- [x] Một atomic candidate publication/CI; own-source CI18 run39780944907 terminal PASS, full collection night-ci01-*, terminal/reclaim validated và intent đã settle. CI node-tools935/935; không gọi toàn CI zero-skip.
- [x] Fresh admission và dispatch T04 nguyên19-stage profile, run39783325574: tại checkpoint đang active, 1/8 backend profiles đã khởi chạy.
- [ ] Collect T04 terminal/reclaim và settle; nếu lỗi dừng dependent actions, giữ spent/evidence, không retry cùng source.
- [ ] Chỉ khi T04 PASS và guard đạt mới chạy 7 whole service profiles tuần tự; fresh admission và terminal/reclaim/settlement giữa từng lượt, max1heavy.
- [ ] Đủ actual35/760 +12obligations và final D19/R0/R1; hiện CHƯA PASS. Source mapping và UI photo review không thay runtime.
- [ ] Chỉ xét PR/main sau fullgate và hai final review; automatic CI đã được owner cho phép vẫn phải reserve/collect/settle riêng, kiểm production hold mới.
- [x] Lưu owner-fixture-cleanup-grant01.json: owned temp/night-nodeNN tới00:00, process nhả và report/hash được giữ; không xóa source/evidence.
- [x] Lưu owner-auth-test-grant01.json: Auth/TEST riêng21:00–21:45, new writes stop21:30, một restorative Confirm ON rollback trước21:45 nếu cần; chưa bắt đầu, Edge không được cấp.
- [ ] Dừng trước17:00UTC, giữ actual source/run/spent/blocker/handoff dù chưa xong; không tự nới ngân sách.

Evidence mới: `D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/night-node02.json`, `publication-reviews02.json`, `night-ci01-*`, `heavy-t04-admission01.json`; [incidents/grants lượt đêm](../../../docs/implementation-log/permission-main-staging-night-20261022/). Hosted staging đã có schema từ lượt17h; không rerun bootstrap, không nhận staging populated làm pristine fixture. DB gốc vẫn cấm; Vercel/production ngoài phạm vi. Các mục trước section này là lịch sử checkpoint cũ, không bị đổi verdict.
