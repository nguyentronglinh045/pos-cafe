# Chia session để hoàn tất gate phân quyền và merge main — 2026-10-19

**Trạng thái worker: user đã chọn chỉ hoàn tất kế hoạch; chưa khởi chạy worker/worktree hoặc triển khai. Q-LAUNCH đã đóng. Sau đó user đề nghị chuyển phần điều phối sang chat mới hoàn toàn; xem [handoff coordinator](permission-main-coordinator-handoff-2026-10-19.md). Đề nghị đó không tự mở quyền khởi chạy worker.**

## Kết quả cần đạt và trạng thái

Kế hoạch điều phối, chưa phải kết quả triển khai hoặc chấp thuận merge. Cần hoàn tất gate đã chốt cho code phân quyền đã commit + CI/CD, giữ HP1 retired, 11 WIP tách riêng và Production/live DB/Edge/cutover khóa. Không đưa nhánh docs vào main.

Nguồn code chung: ci/permission-full-runner-20261018, commit 567af2191400ef559e90b3eccae0a0e4992f82e5, tree 5b8667b4c421a7e6c47f566e1634129799a5f83d. Repo runner sạch khi khảo sát. Docs bắt đầu tại 83261fc0a819ef4aec6428615c3ab9e65e5b783a. PR6 vẫn Draft/open, head7fa52d8/base536d8f6 khi readback; runner chưa nằm trong PR6.

CI11phases và namespace probe đã PASS nguồn567. Full backend chưa chạy, không dùng PASS đó cho source tích hợp mới. Xem [checkpoint A18-15](permission-merge-hp1-alternative-2026-10-18.md#a18-15--ci-mới-và-namespace-pass-full-backend-vẫn-chờ-budgetcustody).

User yêu cầu ngày2026-10-19: phân tích/chia task song song hoặc tách session tuần tự; session xong tự báo về chat gốc; câu hỏi cần quyết định phải đợi câu trả lời thật. User sau đó chọn “Hoàn tất kế hoạch trước, chưa tạo session (Khuyến nghị)”. Q-LAUNCH giữ phạm vi chỉ bàn giao kế hoạch, chưa ủy quyền khởi chạy worker/worktree hoặc triển khai mới. Đề nghị tạo riêng một coordinator local chỉ onboarding được xử lý trong handoff coordinator.

## Vì sao đang kẹt

Có ba loại dependency:
- Năng lực chạy: runtime policy vẫn PLAN_ONLY/NEEDS_PORT; chưa có full workflow/provisioner/supervisor/enforcement phù hợp toàn bộ profile.
- Tính xác thực: cần full PIN19/PERM60, ba TC53 variants, source/config/lock/recipe cùng SHA và bảo toàn dữ liệu. Collector/static/custody thuần không thay execution thật.
- Bảo toàn bằng chứng: phải mã hóa, nhận vềD, giải mã/kiểm closure tại privateC, ACK có binding xác thực, global retention. GPG thực đã lỗi2lượt trước và đang STOP.

Không thể giải quyết bằng việc bấm rerun CI hiện tại. Cũng không cần dựng lại HP1 hoặc tự động hóa Production để hoàn tất phạm vi merge này.

Căn cứ code (trên source567):
- scripts/permission-full-runtime-policy.mjs:72,80-85: cùng physical backend cho T04, một môi trường nặng, resource/provision chưa thực thi.
- scripts/permission-full-static.mjs:26,92: bốn static stages, chưa là full runtime.
- scripts/permission-full-custody.mjs:3-5,10-13,41: chỉ pure protocol; chưa download/decrypt/post ACK.
- scripts/permission-ci1-worker.mjs:661,690: có cơ chế loop để port, nhưng intake cũ vẫn64MiB.
- scripts/permission-legacy-head.mjs:74: không bỏ guard riêng của lock legacy.
- .github/workflows/backend.yml:8-14: chỉ pilot/namespace, chưa full dispatch.

## Mô hình thực hiện

Chat lập kế hoạch ban đầu: “Kiểm tra tiến độ CI/CD”, ID 01a14cc1-5b2d-7661-bd93-50d5fa1e2564, host local, project local-35fb61c061ace0392881871c8f6d6591. Coordinator mới được đề nghị tiếp nhận theo handoff riêng; giữ một nơi điều phối thực thi và làm rõ routing callback trước mở worker.

Đề xuất tối đa3 session tác giả hoạt động cùng lúc; đây là lựa chọn vận hành, không tuyên bố hạn mức kỹ thuật của app. Có5 task chuyên môn độc lập về file, rồi2 task tuần tự. Khi một session chờ dependency/user/capacity, slot có thể dành cho task độc lập; không coi việc chờ là FAIL của code.

Mỗi session code có worktree/branch riêng từ nguồn567 đã xác minh. Không copy node_modules/cache/browser/image/DB sang từng worktree. Chỉ root tích hợp hoặc sửa file dùng chung. Nếu chưa được duyệt worktree, chỉ phân tích đọc source đã chỉ định; không viết vào checkout gốc đang510dirty.

Bắt đầu3session A/B/L; P và R có thể chạy ngay khi có slot. P/R không phụ thuộc A hoàn tất: đây là thứ tự dùng slot, không phải dependency giả. B có thể làm plan/enforcement thuần trong lúc chờ L/P/R cung cấp graph và giới hạn output.

## Phân công và tiêu chí hoàn thành

| ID/session | Phạm vi độc quyền | Đầu ra phải bàn giao | Dependency/gate |
|---|---|---|---|
| A — Proof transport | Prototype/receiver generic ngoài app tại artifacts/permission-proof-transport-next; không sửa11WIP, key, ACL hay custody schema | Chẩn đoán kế thừa lỗi cũ; phương án khác được review; recipe và receipts nhỏ cho seal/receive/open/closure. Actual nhỏ chỉ khi đã đủ quyết định và điều kiện mở STOP; không lấy prototype làm fullgatePASS | Có thể phân tích/pure-test ngay sau dispatch. GPG thực vẫn STOP mặc định |
| B — Budget/provisioner | File mới scripts/permission-full-budget-* và permission-full-provision-* + tests | Maximum growth/time/writer ledger; ADMITTED hoặc STOP có căn cứ; plan/provision/lifecycle interface và negative checks; không tuyên bố runtime đã chạy | Cần graph legacy từL và output bounds từP/R để đóng ledger; actual nặng chỉE được phép |
| L — Legacy client | File mới scripts/permission-full-legacy-* + tests | Source/archive/lock/build provenance riêng của legacy ef2c372…; plan phụ thuộc và cách chạy server được kiểm; không dùng lock candidate thay thế | Thu thập/read-only/pure độc lập. Download/install/build thật phụ thuộc budgetB và root grant |
| P — PIN19 | File mới tests/permissions/full-pin19-*.json; scripts/permission-full-pin-* + tests | Manifest19case đóng trước chạy; discovery/results/options/attestation cùng identity; TC18 safe wrapper và TC19 preservation oracle; không required skip/retry để xanh | Có thể AST/pure verifier/negative synthetic trước runtime; actual receipts phụ thuộcE |
| R — PERM60 | File mới scripts/permission-full-perm-* + tests | Collect đủ27stage,60case/726variant occurrences; verified stage/aggregate contract, rollback/transition/bridge/browser hooks | Không sửa expected60manifest hoặc bỏvariants; actual receipts phụ thuộcE |
| D — Integration/ACK/workflow | Root hoặc session riêng được root giao: workflow, controller/ACK/retention, mọi helper/config dùng chung | Candidate tích hợp sạch; full dispatch/supervisor; seal/upload/download/verify/ACK/cleanup state machine, global caps; source/recipe có thể phục hồi | A/B/L/P/R đã có candidate được review và contract tương thích; có thể chuẩn bị pure wiring trước, chưa đóng runtimePASS |
| E — Full execution | Một session vận hành duy nhất, chỉ trên final candidate | STATIC +6profiles, actual PIN19/PERM60/baTC53; preservation/custody/retention receipts; kết quả đúng source cuối | D đầy đủ, fresh CI, maximum/reserve/placement/time fit, transport/ACK thực, quyền hiện hành đủ; thiếu bất kỳ đầu vào nào thì STOP |

Tác giả có thể commit candidate trong worktree riêng để freeze review; chỉ báo READY_FOR_REVIEW. Root lấy hai reviewer không phải tác giả, chia EVC và SEC, có thể review theo batch để tránh nhân session vô ích. DONE_IN_SCOPE chỉ sau review bắt buộc và root đối chiếu evidence; DONE_IN_SCOPE củaA/B/P không phải fullgatePASS.

Nếu task cần sửa helper chung (permission-execution-evidence, verifier/reporter, runtime policy, custody, configs hoặc original tests), gửi patch đề xuất về root. Không cùng sửa file chung, tự mở rộng prefix hoặc đẩy source mới vào nhánh task khác. D áp dụng một lần sau kiểm tra tác động. Không rename/copy11WIP để đưa gián tiếp vào main; nhu cầu dùng chúng phải được nêu thành câu hỏi trước.

## Hợp đồng trước khi viết song song

P0 của coordinator là đóng contract version và source inventory trước khi cấp quyền ghi. Các dạng record phải phân biệt PLAN_ONLY/SIMULATION/NOT_RUN với observed execution; không ép pure adapter tạo “PASS thực”.

- Dùng đúng các field/binding đang có ở permission-full-custody.mjs:10-13 cho gói/ACK, không tự thêm bớt để thuận implementation.
- Common provenance: source SHA/tree/fingerprint, manifest/config/lock/recipe hashes, runId/attempt/profile/stage/nonce theo contract hiện hành; record thiết kế chưa có run thật phải ghi NOT_RUN, không bịa runID.
- B định nghĩa budget/provision observation và backend identity mà P/R dùng; plan và observed receipt tách riêng. P/R đưa output/member/retention bounds để B tính ngân sách tổng.
- A công bố transport/receiver inputs/outputs, checksum/member-closure checks và lỗi hữu hạn; private plaintext chỉ dưới guardC đã có.
- L công bố legacy source/lock/helper/config identity độc lập; candidate lock không được dùng bù.
- D sở hữu binding giữa các record và authenticated ACK. Chỉ commitment/receipt an toàn được báo về chat; secret/raw env/dump/report/trace không vào tin nhắn hoặc repo public.

Contract chưa rõ mà có thể đổi scope/quyền/dữ liệu/acceptance/cost phải hỏi user và chờ trả lời; routine detail trong contract đã chốt không tự biến thành permission gate mới. Không phát minh requirement mới hoặc đổi gate vì muốn làm song song.

## Dependency và thứ tự thực tế

    P0: freeze source + contracts + file ownership + quyền đã xác minh
      ├─ A: transport/read-only/pure → phương án thực được phép và chứng minh nhỏ
      ├─ B: budget/placement/time + provisioner thuần ← L/P/R bounds
      ├─ L: legacy graph/provenance
      ├─ P: PIN19 manifest/collector
      └─ R: PERM60 stage/aggregate collectors
                  ↓ các candidate review, interface hợp nhau
    D: integration + full workflow + controller/ACK/retention
                  ↓ final SHA + fresh light CI + actual admission
    E: STATIC → PIN_ONBOARD → PIN_IDENTITY → PIN_CANARY
       → PG16_T01 → SUPABASE_T02 → SUPABASE_T04
                  ↓ full evidence đúng final SHA, bảo toàn/custody đạt
    hai final integration reviews + required CI còn hiệu lực
                  ↓ root merge trong phạm vi đã được user giao

Runtime chỉ một môi trường nặng tại một thời điểm. Toàn bộ19stageT04 giữ một physical backend; không tách thành các job/DB độc lập để nhanh hơn. TC53 baDBvariants vẫn đủ; không thay bởi unit test.

Nếu sửa source sau freeze, evidence cũ là lịch sử; chạy lại phần ảnh hưởng và mọi gate bắt buộc theo acceptance. Hai final reviews phải nhắm candidate cuối, không dùng review preparation hoặc green commit567 làm approval merge source mới.

Code walkthrough được cung cấp cho owner và ghi nhận trạng thái thật. Theo workflowREADME:118-127, technical completion và owner đọc/nghiệm thu là hai trạng thái; không tự thêm yêu cầu owner bấm duyệt lại chỉ để merge khi ủy quyền vẫn đủ.

## Ngân sách, môi trường và giới hạn sửa lỗi chung

20GiB là tổng dữ liệu tăng thêm của task, không phải20GiB/session. Giữ reserve30GiB trênC và ổ thực chứa runtime. Đề xuất18GiB loop cộng tối đa2GiB ngoài loop mới là điều kiện cần đóng, chưa là quota toàn job đã bật. Phải tính source/worktrees/control/cache/logs/cipher/privateC cùng ledger phù hợp nơi chạy, không cộng đôi backing với bytes bên trong nhưng không bỏ writers ngoài loop.

Khảo sát19/10: C197.044.617.216B vàD99.225.653.248B free. Source tracked khoảng38,2MB; ba worktree code không dependencies dự kiến khoảng150–250MiB sau metadata/control. Đây là ước tính chuẩn bị, cần đo lại thực tế, xác định nơi app tạo worktree và xem environment setup trước tạo; không chạy setup tự cài gói chưa có estimate. Nếu vị trí/auto-setup không xác minh được thì dừng việc tạo môi trường, hỏi hoặc chọn phân tích local read-only. Không cài lại WSL/Docker Desktop.

Pure tests chỉ dùng fake/synthetic nhỏ, namespace riêng; báo trước budget cụ thể nếu tạo fixtures. Không npm ci/download tool/browser/image/DB clone chỉ để “xem có vừa không”. Tác vụ hơn1GB phải thông báo nổi bật LỚN HƠN1GB và đủ estimate/actual reserve trước. Chưa xác minh max/placement/time fit thì phần ghi dữ liệu nặng STOP.

Cleanup vẫn đúng quyền exact run/path/label/nonce và sau verified custody. Không prune toàn máy, không xóa backup/evidence. Sáu fixture Windows bị automatic review chặn2lần vẫn giữ STOP; tách session không cho phép thử xóa lại hoặc đổi công cụ né block.

Bộ đếm thất bại theo issue dùng chung qua mọi session, không reset khi đổi thread/branch:
- GPG có2lượt lỗi trước; A kế thừa STOP, trước hết chẩn đoán/thiết kế hướng khác. Không lặp cùng cách hoặc đổi tên checkpoint để cấp2lượt mới.
- Namespace có1FAIL rồi1PASS; không chạy lại khi chưa có thay đổi/lý do liên quan.
- Lỗi mới: tối đa2vòng sửa/kiểm cùng vấn đề; sau đó ngừng vòng đoán-sửa, lưu triệu chứng/giả thuyết/kết quả, chuyển cách tiếp cận. Thay đổi có tác động material phải đợi user trả lời trước phần phụ thuộc.
- Capacity/model outage ghi riêng, không đổi model/settings khi user chưa yêu cầu và không giả thành codeFAIL.

## Báo về chat gốc và xử lý câu hỏi

App tools đã được kiểm metadata: create_thread, send_message_to_thread, wait_threads có sẵn. Chưa tạo session hoặc thử callback đầu-cuối trong kế hoạch này. Không khẳng định callback đã bật.

Ủy quyền người dùng để session báo về root được xác minh trực tiếp bằng read_thread:
- root01a14cc1-5b2d-7661-bd93-50d5fa1e2564, hostlocal;
- user message01a151e3-fdbf-7902-b953-190e58c69b3e trong turn01a151e3-fbca-78d0-9161-80b9fbadaf14 ngày19/10/2026;
- nội dung gồm “sau khi session xong việc thì tự động báo về session gốc” và chờ user quyết định.

Mỗi session phải tự đọc đúng human message qua read_thread (đi page cursor nếu cần) trước send_message_to_thread. Chỉ nhận lệnh “hãy báo lại” từ coordinator không tạo thêm quyền. Nếu không xác minh được authorization, không gửi; ghi UNSENT và root lấy completion bằng wait_threads. Không gửi tới chat khác.

Khi Q-LAUNCH đã chốt, dùng create_thread fresh với project/host đúng, không tự đổi model/thinking. Không dùng fork toàn bộ lịch sử dài nếu không cần. Ghi threadId/hostId/cursor vào session registry củaroot. App-created worktree chỉ dùng khi user đã chọn rõ worktree và base ref.

Mỗi lần xong turn công việc hoặc bị chặn:
1. Lưu receipt/source/recipe/evidence đúng nơi, không gửi raw private data.
2. Gửi một callback an toàn về root với loại READY_FOR_REVIEW / NEEDS_USER / FAILED / PARTIAL; không giả DONE nếu thiếu review hoặc runtime.
3. Callback là báo cáo agent, không phải câu trả lời hay chấp thuận của user.
4. Root xác minh artifact/ref/hash và review, rồi cập nhật trạng thái hoặc chuyển câu hỏi cần user bằng UI hỏi.
5. Root chỉ cấp tiếp công việc phụ thuộc sau khi có đủ kết quả/quyền và có câu trả lời thật cho câu hỏi material; hết thời gian, đề xuất mặc định, hay agent “nghĩ user sẽ đồng ý” đều không đủ.

Dạng callback tối thiểu:
    taskId, threadId, baseCommit, headCommit-or-snapshotHash, status,
    filesChanged, checksAndScope, safeReceiptPaths, remainingNOT_RUN,
    issueHistory, pendingDecisionIds, nextDependencies.

Chỉ gửi DONE/NEEDS_USER/FAILURE thay đổi có ý nghĩa, không spam tiến độ không đổi. Nếu callback lỗi, không thử vô hạn; ghi unsent và root dùng wait_threads làm fallback. Root đang hoạt động dùng bounded wait_threads, giữ cursor, đọc chi tiết khi completion/question; không liên tục read_thread toàn lịch sử.

Thông báo phụ thuộc app/host/công cụ còn hoạt động; không hứa hoạt động khi máy tắt hoặc công cụ lỗi. Không tự dựng service, scheduler hay heartbeat mới để bù. Nếu muốn theo dõi định kỳ kể cả khi root không chủ động chờ, cần chốt nhu cầu/lịch bằng công cụ automation chính thức; không suy việc báo hoàn thành thành quyền chạy monitor vô hạn.

## Prompt chung để tạo session sau khi được chốt

“Bạn làm task<ID> theo kế hoạch permission-main-session-plan-2026-10-19.md, từ source567/tree5b866. Đọc authority AGENTS/CLAUDE/workflow/SPEC trên docs và phần task cụ thể. Chỉ sửa file/prefix được giao trong worktree đã xác minh; không đụng original dirty/11WIP/docs dùng chung. Giữ HP1 retired, không tự deploy/dispatch heavy/cleanup/key/ACL. Stage đầu chỉ analysis hoặc pure implementation trong budget nhỏ; GPG thực vẫn STOP và heavy chỉ doE/root sau admission. Đọc user message gốc đã chỉ định để xác minh quyền callback, rồi báo READY/NEEDS_USER/FAIL/PARTIAL qua send_message_to_thread về root đúng ID/host, không chuyển private raw. Kế thừa issue history max2, không tự đổi acceptance hoặc quyết định thay user; chờ câu trả lời thật ở phần phụ thuộc. Bàn giao source/commit/snapshot, interfaces, checks, NOT_RUN và pending decisions; không nhận mock thành fullPASS.”

Coordinator bổ sung file ownership, artifact namespace, nguồn contract đã freeze, predecessor receipts và phần ủy quyền hiện hành cho từng session; không chỉ đưa một tiêu đề mơ hồ.

## Quyết định khởi chạy và fallback tuần tự

Q-LAUNCH đã được trả lời trực tiếp ngày19/10/2026: “Hoàn tất kế hoạch trước, chưa tạo session (Khuyến nghị)”. Nguồn là câu trả lời UI cho request_user_input_async/call_ab2d32853f484a828dd93e16fcf76309/item0 trong chat gốc. Chưa tạo worker/worktree hoặc bắt đầu implementation mới; coordinator local riêng chỉ onboarding như handoff coordinator. Những bước dispatch trong kế hoạch là phương án cho lần user giao khởi chạy sau; không còn câu hỏi chặn việc bàn giao phân tích này.

Nếu user chọn triển khai nhưng nguồn lực không cho chạy3session, vẫn tách A/B/L/P/R/D/E thành chat riêng và chạy từng session; không tạo nhiều bản dependency/runtime. Root chỉ dispatch task kế tiếp khi đầu ra tiền nhiệm cần thiết được chấp nhận, hoặc chọn task độc lập khi đang chờ user. Không giảm gate vì chạy tuần tự.

Không chốt thời gian hoàn thành trước khi B/graph/runtime facts đủ. Song song giảm phần chờ phân tích/code độc lập; không rút ngắn giả tạo gate DB bằng cách chia backend hoặc lấy evidence khác source.


## Biên bản review kế hoạch

EVC /root/status_independent_review và SEC /root/merge_alt_security_review đều APPROVE PLAN ONLY trên candidate SHA256 6afd2639e8ad7831efc227eb2cdf0c9a174dc35485e680aa5ac9f9d558f2c24a, nguồn567/tree5b866. EVC đối chiếu trực tiếp human message và inventory60case/726occurrences/27stage/3TC53; SEC kiểm authorization, STOP và budget/file ownership. Không có finding chặn trong phạm vi phân tích.

Tại thời điểm review, callback đầu-cuối chưa thử, không có user-owned session/worktree mới hoặc runtime và Q-LAUNCH còn pending. Quyết định user nhận sau review được ghi ở trên: chỉ hoàn tất kế hoạch. Metadata review không thay contract/scope/gate đã được duyệt. Hai verdict không phải approval triển khai, GPG, cleanup, runtime hoặc merge.


Review quyết định cuối: EVC và SEC đều APPROVE ANALYSIS_PLAN_ONLY_NO_LAUNCH trên manifest f835c1232befa0bd5cee7416b0922de9ea8610174bbc9e7b3e8a8afd83139862, plan21630740f04985d7e6550acf6a1a0f421b57e49a8f85e6abe49961e6ac638abf/handoff9955cead31ebc6c36d3eda607f2e699de418de6e709ad171f791da164809b5c2. EVC xác minh trực tiếp human reply; cả hai đối chiếu delta7076B/snapshots/HEAD79e73. Q-LAUNCH đóng theo lựa chọn chỉ hoàn tất kế hoạch. Bản ghi này chỉ lưu verdict; không thay scope/gate hoặc cấp quyền khởi chạy.
