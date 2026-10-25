> **Đối chiếu xuất bản 25/10/2026.** Các mục “hiện hành”18/23-10 bên dưới là checkpoint của nguồn lúc đó. M24 ngày24/10 thay gate full-backend-before-merge riêng cho tích hợp mã; điều kiện đủ gate trước functional deployment vẫn giữ. A18 hoãn thực thi HP1, D19 điều chỉnh kiểm chứng/bàn giao; không xóa nghĩa vụ nghiệm thu. Các grant/counter/cutoff cũ không mở lại. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thứ tự triển khai

## Image hook/JWT repair — 23/10/2026

- [x] Phân loại T04FAIL thực, kiểm reclaim và vendor source trước sửa; không blindretry.
- [x] Chuẩn bị bounded diagnostics/compatible helper, giữ actual T09 assertions; local63/63+actualreporter controls PASS.
- [ ] Hai review finalsource/pins/finite cumulativepacket02; freeze Hprime và nonforcepublication2.
- [ ] Fresh ownsource CI18 và wholeT04 once; chỉ tiếp7profiles khi PASS/reclaim; giữ failed03 và globalhistory.


## Slice hiện hành — 23/10/2026

- [x] Xác minh workflow/source/provider facts; owner chọn đủ gate dù qua đêm.
- [x] Chuẩn bị helper/config/readiness tests và hợp đồng functional Preview; chưa nhận livePASS.
- [x] Hai review độc lập candidate/packet,44canonical trusted pins và chốt H=eac4359/lock/source binding; publication1 vàCI39980641660 đủ18phasePASS.
- [ ] CI nhẹ +35runtime stages/760required identities và oracle bổ sung; tám profile nặng tuần tự, terminal/reclaim trước lượt tiếp; FAIL/UNKNOWN phải chẩn đoán trước retry.
- [ ] Review actual acceptance/binding; PR/main không bypass protection, main pushCI trên SHA thực; không relabel runtime source H thành M.
- [ ] Chuẩn bị đúng ba public Preview-only config, giữ VITE cũ/Production; protected dispatch và receipt thật sau fullgates.
- [ ] Browser functional trên deployment mới; hai review cuối và handoff trung thực, cleanup đúng ownership/quyền.

- [x] **S1** Xác minh evidence remote, tạo CI worktree riêng, ghi ba quyết định owner; lập bộ spec tooling.
- [x] **S2 — triển khai** CI auto/controller/reporters đã publish/review; source0781f75,104/104localPASS/lint3. Actual CI30 thuộc S4.
- [x] **S3 — triển khai** Backend manual workflow, exact repo allowlist và worker/resource/privacy guards đã publish/review; actual backend18 chạy thật. Pilot FAIL là gate riêng, không nhận đã đạt.
- [x] **S4** Source0781f75 hai APPROVE/local104PASS/lint3; actual CI30attempt1 full11phasePASS, source preserved/core restored. Không thay baseline/acceptance.
- [x] **S5 — kiểm việc chạy workflow** Bootstrap tooling-only/main và provider trigger đã kiểm; backend18 thực thi exactsource0781f75 với strict envelope. Kết quả pilot FAIL/cleanupReadFixture/catalog drift; owner chốt chuyển sửa fixture sang phiên phân quyền theo DEC-CICD-06, không hạ acceptance.
- [x] **S6** CD held đã kiểm thật: protected Production/main-only/no-admin-bypass; negative39002739692 chặn CI FAIL; positive39028263852 preflightPASS/approvalwaiting exactsource0781f75/CI30attempt1. Cũ39021837504 cancelled vì obsolete. Không approve/deploy, production=false.
- [x] **S7 — nội dung hồ sơ** Ghi actual source/evidence/blocker/DEC06, resources và owner walkthrough. Gate công bố độc lập: chỉ tạo nhánh docs sau hai final APPROVE exact manifest/helper; commit message và receipt ghi approvals/manifest sau freeze. Không merge docs vào main.

Không đánh dấu actual CI/backend/CD protected hoàn tất khi mới có YAML/tests local. Main/app update, secret provisioning hoặc hành động ngoài scope rõ phải có concrete diff/target rồi mới trình quyết định; không tự lấy quyền từ handoff/reviewer. Đã được giao tiếp tục setup và CI thật; không hỏi lại các lựa chọn CI nhẹ auto/backend manual/CD frontend/no production.

- [ ] **Gate backend phân quyền, ngoài mốc CI/CD theo DEC06:** T09suitePASS và T10đủ3casesPASS, preservation/cleanupPASS trên source sửa mới; full backend/legacy gates vẫn giữ.

**DEC-CICD-06 — 17/10/2026:** owner trả lời câu 0 của `call_801a8f97fddc4f58a5825cd0bbfe23e5`: “Chốt CI/CD; ghi backend FAIL, sửa fixture ở phiên phân quyền (khuyến nghị)”. Mốc bàn giao này xác nhận CI/CD đã cấu hình và chạy thật; giữ nguyên backend acceptance FAIL, chuyển việc điều tra/sửa cleanup fixture sang phiên phân quyền. Không giảm coverage, đổi baseline/ACL hoặc nhận backend PASS; chưa phát hành production.

Hồ sơ này được freeze trước công bố. Nhánh đích `docs-ci-cd-20261017` chỉ được tạo sau khi hai reviewer độc lập APPROVE exact manifest và helper công bố; commit message của nhánh ghi manifest cùng hai approvals. Trạng thái công bố cuối được đối chiếu bằng [lịch sử commit của nhánh](https://github.com/nguyentronglinh045/pos-cafe/commits/docs-ci-cd-20261017) và receipt local `artifacts/project-ci-local/docs-published.json`, không tự nhận sự kiện sau freeze trong nội dung snapshot.
# Bước tiếp CI-only — 18/10/2026

- [x] DEC-COMP-06: tách CI/CD, giữ nhánh phân quyền chờ đủ gate; tạo isolated checkout từ mainf9c.
- [x] Ghi profile9phase trước code; app/SQL/lock/base Playwright giữ nguyên. Test có ngoại lệ2line pathhelper tailwindMigration theo actualLinuxFAIL, không đổi assertions/coverage.
- [x] Đóng băng CI-only04a,46NodePASS và hai review độc lập APPROVE.
- [x] Actual8de push39100508272/PR39100510030 SUCCESS, strict required check policy đã áp/PR đỏ BLOCKED; PR4 merge10e0348, actualmain39100947815 PASS9phase.
- [x] Preview02 hai APPROVE/63NodePASS, PR5 merge536d8; mainCI39101826725 PASS; actual protected Preview39102130352 READY/targetnull/source đúng/routing-protection không đổi. HTTP khôngauth302; browser authenticated landing renderPASS, businessflowsNOT_RUN.
- [x] Production khóa; backend/UI/fullpermission giữ riêng/NOT_RUN hoặc deferred. Handoff ghi actualsource/environment/evidence, docs còn local chưa commit/push.
- [x] Final EVC/SEC APPROVE exactcloseout02 manifestD068C52F0F16FC7075AB50FC27CC9C63C180AA13C70211DFD5E3D638CDBBA329; metadataapproval saufreeze, scopeautoCI+protectedmockPreview/landing, không production/fullpermission/owneracceptance.
