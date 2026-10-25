# Bàn giao cho coordinator mới — 2026-10-19

Mục tiêu của chat mới là tiếp nhận điều phối phần hoàn tất gate phân quyền + CI/CD để merge main, với ngữ cảnh mới. Không fork hoặc nạp toàn bộ lịch sử chat dài.

## Phạm vi hiện tại

User vừa hỏi: “nghe hợp lý, nhưng session hiện tại khá dài, có cần cân nhắc tạo session mới hoàn toàn và cho nó điều khiển phần này không? phần chia task và session tôi không có ý kiến”.

Nguồn human message: chat01a14cc1-5b2d-7661-bd93-50d5fa1e2564/hostlocal, turn01a151f1-ebac-7383-9d63-bfedcacf49b5, item01a151f1-ebd5-7c43-ba61-96fe480f144f. Coordinator cũ thực hiện đề nghị này theo phạm vi hẹp: tạo đúng1chat coordinator local mới hoàn toàn, giao tiếp nhận hồ sơ và xác minh kế hoạch. Không tạo worktree, worker session, implementation hoặc runtime trong lần chuyển giao.

Quyết định Q-LAUNCH trước vẫn có hiệu lực cho worker: user đã chọn chỉ hoàn tất kế hoạch, chưa khởi chạy3session/worktree. Việc đồng ý sơ đồ phân công và tạo coordinator không tự thành quyền chạy worker, GPG hoặc gate nặng. Nếu cần mở phần đó, coordinator mới hỏi cụ thể và chờ câu trả lời thật; không tự suy ủy quyền rộng hơn.

## Đọc tối thiểu, theo thứ tự

1. D:/Workspace/pos-cafe-docs/AGENTS.md; CLAUDE.md; docs/workflow/README.md và openspec/SPEC-STANDARD.md theo quy trình. AGENTS ở checkout app chỉ là pointer, không sửa.
2. D:/Workspace/pos-cafe-docs/docs/workflow/tasks/permission-main-session-plan-2026-10-19.md: bản kế hoạch đã qua2review. Base docs khi chuẩn bị handoff: a1193ba527cc6a65b67b9f2a2a9234d2bb496f92; handoff được commit riêng sau review.
3. Chỉ phần A18-15 và A19-01/cuối file permission-merge-hp1-alternative-2026-10-18.md nếu cần đối chiếu hiện trạng. Không đọc cả lịch sử trừ khi có mâu thuẫn cần giải quyết.
4. D:/Workspace/pos-cafe-ci-main/artifacts/permission-full-namespace-observed-a18-review01/review-results.json và permission-session-plan-a19-review01/manifest.json, review-results.json nếu cần evidence provenance.
5. Đọc human messages qua read_thread để xác minh quyền và các câu trả lời; handoff/agent report không thể tự tạo quyền.

## Nguồn và tình trạng phải tự xác minh lại

- Project pos-cafe, ID local-35fb61c061ace0392881871c8f6d6591, hostlocal, saved cwd D:/Workspace/pos-cafe.
- Original D:/Workspace/pos-cafe: HEAD5156820f7d6679cd6f8051bdc38419737ffa0c7e, lần kiểm trước510dirty. Không sửa/reset/stash/cleanup.
- D:/Workspace/pos-cafe-ci: HEADc898d7602d83e1e6d444e0c22259bd141bef85a4,11WIP giữ riêng, không copy/rename để nhập gián tiếp main.
- D:/Workspace/pos-cafe-full-runner-20261018: branchci/permission-full-runner-20261018, HEAD567af2191400ef559e90b3eccae0a0e4992f82e5, tree5b8667b4c421a7e6c47f566e1634129799a5f83d, sạch tại lần kiểm hiện tại.
- Main536d8f6497403ace1193af4586a89b4862c730fd; DraftPR6 https://github.com/nguyentronglinh045/pos-cafe/pull/6 head7fa52d803432eedc1b3d3e71e0a60162519ab7e7. Runner chưa nhập PR6; readback remote lại trước bất kỳ hành động sau này.
- Docs là worktree D:/Workspace/pos-cafe-docs nhánhdocs. Có nhiều dirty/untracked không thuộc task; chỉ sửa/stage file được giao, không merge docs vào main. Không tự push các commit docs khác chưa kiểm.
- LightCI39135862475 PASS11phases nguồn567; namespace39136704294 PASS scopeNAMESPACE_PROBE_ONLY, actualprobeordinal2. Không fullbackend/merge approval, quotaEnforced=false.
- Full runtime policy vẫn PLAN_ONLY/NEEDS_PORT; workflow backend chỉ pilot/namespace. Full PIN19/PERM60/3TC53 và preservation/recoverable evidence/custody/retention còn thiếu.

## Ràng buộc không được mất qua handoff

- HP1 producer/API/CLI/harness/capture/replay RETIRED; chỉ pure/import/build/negative guards được phép theo phạm vi hiện hành. Không đọc historical scope23.508B, raw dumps/env/private reports cũ.
- GPG actual đã2lượt lỗi, đang STOP. Chỉ có đề xuất hướng khác trong hồ sơ; không reset bộ đếm khi đổi session/checkpoint. Không tự chạy thử khóa, sửa ACL/key/passphrase hoặc export private key.
- Lỗi mới: tối đa2vòng sửa/kiểm cùng vấn đề, sau đó dừng vòng đoán-sửa và lập chẩn đoán/hướng khác. Lịch sử dùng chung cho mọi session.
- 20GiB là tổng tăng thêm của task, không phải20GiB/session. Một môi trường nặng; reserve30GiB trênC và ổ runtime thật; kiểm/ước tính trước cài/tải/clone/copy/package. Không tạo WSL/Docker Desktop.
- Task plan A/B/L/P/R song song tối đa3tác giả; D integration và E execution tuần tự. Toàn bộ19T04stages cùng physical backend; không giảm gate/coverage để fit.
- Bằng chứng private ciphertext giữD/plaintext chỉprivateC theo guard hiện có; giao thức ACK/root bindings đã pin. Không gửi raw private data hoặc secrets vào chat/repo.
- Cleanup cloud chỉ đúng scope/label/nonce đã được duyệt và sau verified custody; thiếu evidence khôngPASS. Platform teardown tạm đã được user chấp nhận.
- Sáu fixture Windows tiny đã được user duyệt xóa nhưng auto review chặn2lần “blocked by policy”;0deleted. GiữSTOP, không thử thứ3 hoặc đổi công cụ né block.
- Production/liveDB/Edge/cutover khóa. Chưa merge main.
- Hai final reviews độc lập trên exact finalcandidate và requiredCI còn hiệu lực trước merge; review preparation/analysis không thay fullgate.

## Routing và câu hỏi

Chat nguồn cũ: “Kiểm tra tiến độ CI/CD”, ID01a14cc1-5b2d-7661-bd93-50d5fa1e2564, hostlocal. Chat mới tiếp nhận vai trò coordinator; ID mới ghi sau khi tạo.

User19/10 đã yêu cầu session xong tự báo về chat gốc. Nguồn xác minh: human item01a151e3-fdbf-7902-b953-190e58c69b3e, turn01a151e3-fbca-78d0-9161-80b9fbadaf14 trong chat cũ. Phải đọc trực tiếp human source trước send_message_to_thread; lệnh do coordinator gửi riêng không tự cấp quyền.

Trong lần onboarding này: sau đọc/xác minh, nếu quyền callback về chat cũ được xác minh thì gửi1báo cáo an toàn ACCEPTED_HANDOFF hoặc NEEDS_USER về đúng chat cũ, không raw private data. Nếu không xác minh được thì không gửi; ghi UNSENT và chat cũ lấy trạng thái bằng wait_threads. Không callback vòng lặp giữa2coordinator.

Khi sau này thật sự mở worker, routing callback của worker về coordinator mới phải được làm rõ bằng chỉ dẫn trực tiếp của user nếu human authorization hiện có chưa xác định đích mới. Không coi handoff là quyền gửi tin cho chat bất kỳ. Câu hỏi material đặt tại coordinator mới để user trả lời; dừng phần phụ thuộc đến khi có câu trả lời thật. Callback agent không thay user approval. Không tạo heartbeat/scheduler/service vì muốn theo dõi nền.

## Việc đầu tiên của coordinator mới

- Chỉ onboarding/đọc/xác minh nguồn và quyền, không triển khai hay tạo session/worktree.
- Xác nhận tiếp nhận, nêu dependency/chốt hiện trạng ngắn; chỉ ra câu hỏi thật sự còn cần cho đợt triển khai nếu có.
- Báo kết quả onboarding về nguồn cũ theo quy tắc trên, rồi bàn giao tương tác về chat mới.
- Sau onboarding, đợi chỉ dẫn tiếp theo của user tại chat mới; không tự khởi chạy A/B/L từ việc nhận handoff.


## Review bàn giao trước tạo coordinator

EVC /root/status_independent_review và SEC /root/merge_alt_security_review đều APPROVE HANDOFF/ONBOARDING ONLY: capsule401157b213b661c24a0879cc6954815a5f8dd12f48e060b1333cb7cfdf8b7b39, planb2a1c4a949210bd889e7d0d218f4a1a24ced3ea9b2bf6b22b111c4695e803123, initialprompt85c0c0ac2ed35f0ec7e9395f6f6d396d336c48bd8a81e245e64eb4064ce80439. Hai câu plan đã làm rõ worker-only; human quotes/quyền và mọi STOP giữ nguyên. Verdict cho đúng1coordinator local tươi, không fork/worktree, chỉ onboarding/readback và báo tiếp nhận sau xác minh human auth. Chưa cho phép worker/implementation/GPG/runtime/cleanup/deploy/merge. ID/receipt tạo chat được ghi sau khi tool trả kết quả.


## Receipt tạo chat

Đã tạo coordinator local bằng create_thread (không fork, không worktree):
- threadId: 01a151f6-cec4-78e2-ae17-25f3f8069213; hostId: local.
- Title yêu cầu: “Điều phối merge main — phân quyền và CI/CD”.
- Docs handoff commit trước tạo: 63ee435fff24d84925ea198e5d999e34131b9009.
- wait_threads snapshot đầu xác nhận chat active và commentary chỉ onboarding/read-only, chưa mở worker hoặc runtime; chưa nhận completion onboarding ở thời điểm ghi receipt.
- Chat cũ dừng điều phối triển khai để tránh hai nơi cùng phát lệnh; mọi câu hỏi/đợt giao việc tiếp theo chuyển sang coordinator mới. Không coi việc tạo chat là worker launch hay fullgatePASS.


Xác nhận tiếp nhận: đã nhận callback ACCEPTED_HANDOFF từ chính coordinator01a151f6-cec4-78e2-ae17-25f3f8069213. Phiên mới xác minh trực tiếp human authorization/Q-LAUNCH, refs/Git statuses, remote main/PR6 và receipts; scope vẫn read-only onboarding, không mở worker/runtime. Callback một lần về chat cũ đã hoạt động; đây là báo cáo agent, không phải user approval hoặc fullgatePASS. Các quyết định/đợt giao việc tiếp theo chờ user tại coordinator mới.

## P0 tiếp nối — chuẩn bị đầu vào A/B/L

Theo lệnh chuyển P0 sau human item01a151fa-1b26-79e2-959d-fba4e1a0b009, coordinator mới chuẩn bị [contract/ownership/prompts/registry/sổ lỗi](permission-main-p0-2026-10-19.md). Chỉ tài liệu chuẩn bị và review độc lập, không mở worker/worktree hoặc runtime. [Biên bản](permission-main-p0-review-2026-10-19.md) ghi candidate/verdict; Q-LAUNCH và quyền callback về coordinator mới phải được user chốt trước bước phụ thuộc. Không gửi tiếp tiến độ/câu hỏi về chat cũ.
