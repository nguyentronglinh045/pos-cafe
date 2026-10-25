# Rà cuối và xuất bản candidate permission — 23/10/2026

## Phạm vi và quyền

Owner yêu cầu: “kiểm tra nhanh code lần cuối, sau khi ổn thì push lên main hoặc nhánh mới, sau đó làm tiếp phần cần thiết tiếp theo”. Chọn nhánh review mới, không merge `main`: diff thực gồm683files/81commits, full release gates còn mở. Quyền mới này cho phép publication nhánh và CI tự động; không lấy các giới hạn no-push của nhiệm vụ lịch sử làm lệnh cấm publication mới.

Source: `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, clean HEAD `e42215044b4faf7e90f787ae8e975937ad3e4479`, base remote main `2da0d7e10d65ed4e79c8628d65220582a6cbd32b` là ancestor. Package-lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. Không thay source để xử lý cảnh báo định dạng; không đụng dirty work của checkout chính/docs. [Binding](../../implementation-log/permission-final-push-20261023/source-before-push01.json).

## Rà trước publication

Ba subagent độc lập, read-only, đều APPROVE publication đúng e422 vào nhánh mới: audit_technical_review kiểm các critical paths app/Auth/DB/quyền; technical_blockers kiểm tooling/workflow/private artifacts; audit_process_review kiểm quyền và giới hạn bằng chứng. Đây là rà trọng điểm, không phải audit toàn bộ683files. Reviewer không sửa candidate hoặc tự deploy.

Build và unit trên đúng e422 đã đạt ở lượt trước:110files,1177tests PASS,0skip, line coverage92,65%, threshold90 không đổi; không rerun chỉ vì có yêu cầu publication, vì source/lock không thay. [Hồ sơ gốc](permission-staging-functional-2026-10-23.md). Luồng ảnh trên DB mới đã kiểm trong [task riêng](permission-menu-images-2026-10-23.md), không replay upload/payment/bootstrap trong lượt publication.

`git diff --check` exit2 có955cảnh báo whitespace/EOF ở19files, không được gọi PASS. Reviewer phân loại không chặn publication nhánh; file admission test dùng CRLF. Quét tracked paths hiện tại/lịch sử81commits không thấy private/env thực/cache/node_modules/artifact; signature scan chỉ khớp fixture giả kiểm chặn service credentials. Phép quét này không chứng nhận không có mọi dạng bí mật.

## Publication và CI

Đã non-force push đúng e422 lên [review/permission-staging-20261023](https://github.com/nguyentronglinh045/pos-cafe/tree/review/permission-staging-20261023); remote readback trùng SHA. `main` vẫn2da0d7e. [Receipt](../../implementation-log/permission-final-push-20261023/publication01.json).

Một push kích hoạt [POS light CI run39967856503](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39967856503), event push, exact e422, attempt1. **Terminal success**,14:13:55–14:27:53UTC,18phases PASS, sourcePreserved=true. [API terminal](../../implementation-log/permission-final-push-20261023/ci-terminal01.json), [actual log](../../implementation-log/permission-final-push-20261023/ci-completed01.log), [summary trích nguyên JSON từ log](../../implementation-log/permission-final-push-20261023/ci-summary01.json).

Unit1177/1177; tooling567PASS/1skip/1manualDeferred; node-tools955/955; permission-static480/480; isolatedPG16T01 30/30; smoke44PASS/37skip/0fail; UI audit48/48 (16states×3viewports, gồm required-pin-change),6acceptedFindings hiện có. Không cộng các số khác nghĩa thành tổng acceptance, không gọi CI là zero-skip/zero-UI-findings. Native Edge resolver graph20packages PASS (17observed/3metadata,2warmbundles), không nhận thành kiểm graph thực của deployment hosted. UI detector selftest tìm23findings đúng oracle.

Workflow job tối đa30phút/service25phút, RAM8GiB/3CPU, operational disk5GiB trên GitHub hosted. Tên light không có nghĩa chỉ build/unit: có npmci, Chromium, native Edge resolver, isolated nativePG16 T01. Env mock, không có Supabase staging credentials. Backend/Preview/release là workflow_dispatch, Preview/release main-only; Vercel Git deployment disabled. Không dispatch workflow khác, không deploy hoặc PR-trigger thêm run. Không có rerun CI trong lượt này.

## Việc tiếp theo: Auth tạo quán

Đã xác nhận trước khi thực hiện: Dashboard mới cho thấy Confirm email ON, public GET `/auth/v1/settings` có mailer_autoconfirm=false, signup/email provider enabled. [Readback](../../implementation-log/permission-final-push-20261023/auth-public-settings-before01.json), [ảnh](../../implementation-log/permission-final-push-20261023/auth-confirm-email-before.png).

Code [storeKey.ts:34](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/storeKey.ts:34) tạo `storeN@store.pos.local`; [authRepo.ts:82](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/authRepo.ts:82) yêu cầu session trước bootstrap. Spec store-onboarding giữ StoreKey, không thêm email owner. [Proposal owner/provisioning:9](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md:9) giải thích mô hình hiện tại cần confirmation OFF; email thật là change riêng. Cấu hình ON chặn tạo quán mới; đây chưa phải lỗi SQL/ảnh.

Owner trước chỉ cho OFF tạm rồi khôi phục; đã khôi phục18:52:33 và giữ ON trong test ảnh. Quyền mới tại `call_1da3d032c42b43639c755357f41ac285 item0`: **“Cho tắt để dùng Store Key hiện tại”**, giữ OFF đến khi triển khai owner email thật. Root đã tắt/lưu qua Dashboard đúng project; public readback14:21:10UTC mailer_autoconfirm=true, disable_signup=false, emailProvider=true. [Readback và grant](../../implementation-log/permission-final-push-20261023/auth-public-settings-after01.json), [ảnh committed](../../implementation-log/permission-final-push-20261023/auth-confirm-email-committed.png). Không đổi SQL/RLS/ACL hoặc app source.

Root không có Supabase tools trong inventory tại lần discovery này. Subagent technical_blockers có MCP cùng server; đã đọc project config override để chứng minh pinned ineckiashpwloncxnbqx, không dùng hai global servers trỏ DB gốc. **MCP SELECT thành công**, role supabase_read_only_user/transaction_read_only=on; không OAuth/login/reconfig/retry. [Before](../../implementation-log/permission-final-push-20261023/auth-mcp-inventory01.json):2confirmedAuth/2stores/3employees,0orphans/unconfirmed. Aggregate không chứng minh browser-memory pending context hoặc reservation-only attempts.

## Kiểm một quán TEST sau sửa cấu hình

Root là executor. UI tại origin `localhost:5173` riêng với tab người dùng `127.0.0.1:5173` tạo đúng1quán `TEST-AUTH-20261023-2122`, seedDemo=false, một submit. UI báo thành công, StoreKey được lưu vào file riêng trong private folder đã bảo vệ trước ACK; không lưu key/PIN/token mới vào docs. [UI result đã che key](../../implementation-log/permission-final-push-20261023/auth-create-ui-success-redacted.txt), [private custody ACL](../../implementation-log/permission-final-push-20261023/auth-test-private-custody01.json).

MCP after-create14:24:12UTC:3confirmedAuth/3stores/4employees, delta đúng+1/+1/+1,0orphans; storeNo3 ID6b2e76fd-b8f8-4fa9-b784-faee8eb4af36, owner0feee792-8784-54d0-bc2f-ef944e95b2a4, pinChangeRequired=true. Seedskipped/stages0; categories/menu/floor/tables/orders/payments đều0. [MCP actual](../../implementation-log/permission-final-push-20261023/auth-mcp-inventory-after01.json), [roster](../../implementation-log/permission-final-push-20261023/auth-created-roster.png).

UI chọnowner/PINtạm vào đúng [màn bắt buộc đổiPIN](../../implementation-log/permission-final-push-20261023/auth-new-owner-pin-gate.png). Node API sign-in cùngStoreKey, storeSession/roster match, restricted session TTL5phút không có authority và normal authority bị PIN_CHANGE_REQUIRED đúng SQL:176. [Before PIN proof](../../implementation-log/permission-final-push-20261023/auth-new-owner-before-pin01.json).

Đổi PIN TEST qua API một request đã lưu private requestId/PIN trước khi gửi: applied/revision0→1/pinChangeRequired=false; old restricted token bị EMPLOYEE_SESSION_REQUIRED. PIN mới nhận normal owner session TTL12h, normal authority đúngstore/owner/revision1. [Proof](../../implementation-log/permission-final-push-20261023/auth-new-owner-pin-complete01.json). Đây là API completion, không claim đã dùng UI form đổi credential. Sau ACK và API completion mới reload UI, pairing tự khôi phục; login PIN mới vào [quán trống với owner](../../implementation-log/permission-final-push-20261023/auth-new-owner-normal-ui.png).

Closeout Node: revoke normal employee session, oldtoken refused; Auth logoutlocal204. UI riêng: Khoá→Gỡghép→home rồi đóng tab. [Node11RPCrecords](../../implementation-log/permission-final-push-20261023/auth-node-session-closeout01.json), [UI closeout](../../implementation-log/permission-final-push-20261023/auth-ui-closeout.png). Giữ TESTfixture và private credential cho tái hiện; không xóa user/quán hoặc dữ liệu ngoài quyền. Tab127 và devserver gốc giữ nguyên.

[MCP closeout14:33:38UTC](../../implementation-log/permission-final-push-20261023/auth-mcp-closeout01.json) xác nhận owner3pinChangeRequired=false/revision1,4employeeSessions revoked/0active; Auth3confirmed/0unconfirmed, stores3/employees4; seedskipped và businessrows0. Auth session rows0 không được nhận thành bằng chứng accessJWT bị vô hiệu. Các SELECT MCP do subagent thực hiện read-only; các mutation của slice chỉ do root qua Dashboard/UI/API.

Ba lỗi phép kiểm được giữ, không sửa app hoặc tạo lại tenant: helper lần đầu thiếu x-pos-permission-contract nên RPC426 WRITE_PROTOCOL_UNSUPPORTED; cell sửa tham chiếu binding bị redeclare trước assignment nên0remote calls; expected trướcđổiPIN nhầm EMPLOYEE_SESSION_REQUIRED trong khi actual PIN_CHANGE_REQUIRED khớp SQL:176. Root đọc lại source và giữ actual response, không replay RPC để thay kết quả; sau đổiPIN/revoke mới expected EMPLOYEE_SESSION_REQUIRED. Không ghép tool-completed thành testcasePASS. Phạm vi11RPCrecords không phải tổng Auth/UI/MCP requests.

[Owner messages](../../implementation-log/permission-final-push-20261023/owner-messages01.json) trích từ chat hiện tại và [36exact selected executed cells](../../implementation-log/permission-final-push-20261023/executed-cells01.json) giữ arguments/status gốc của Node/CUA; runtime secret values không được expand. Snapshot provenance này có các cell mutation/assertion chính, không phải toàn bộ tool history hoặc network capture; cell cleanup UI sau snapshot có actual closeout UI/MCP riêng. [Source/Auth closeout](../../implementation-log/permission-final-push-20261023/source-auth-closeout01.json): e422/lock/remoteheads không drift, ConfirmOFF giữ đúng quyết định. [Secret scan](../../implementation-log/permission-final-push-20261023/secret-scan01.json) không thấy exactkey/PIN mới hoặc token signature trong text evidence tại checkpoint; PNG đã chụp ở các màn không hiển thị credential.

Để tránh vòng sửa không có căn cứ: kiểm cấu hình Auth trước signup; chỉ chạy một slice sau quyết định; giữ exactsource, assertions và actual failure. Không sửa runner/SQL để chữa một config mismatch; không nhận reachability PASS là new-store readiness. Existing staging preflight chỉ chứng minh Auth route reachable, không kiểm mailer_autoconfirm.

## Giới hạn và bàn giao

Full35/760,12+D19/R0/R1 và hosted/release gates chưa đóng, tiếp tục chặn merge/main hoặc production readiness; quick publication không thay acceptance. Chưa đổi Vercel binding/DB chính, chưa triển khai owner email/provisioning. Không cài thêm dependency/runtime local; C/D checkpoint182,27/92,10GiB trống.

Walkthrough ngắn cho owner: StoreKey → authRepo xác nhận Auth user/session → identity bootstrap/PIN gate; menu ảnh: admin UI → gateway xác thực actor → registry/publish RPC → public reader chỉ ảnh được công bố. Đây là đường đọc code được cung cấp, không khẳng định owner đã đọc/hiểu hoặc nghiệm thu.

Publication nhánh, CI terminal và Auth functional slice đã thực hiện; review delta cuối còn chờ. Không phát sinh app commit saue422. Hồ sơ/docs index chưa commit/push, giữ nguyên các dirty work không thuộc task. Metadata verdict cuối được bổ sung sau khi reviewer kiểm actual candidate/evidence.

## Metadata bàn giao cuối

Hai reviewer audit_technical_review và audit_process_review đều **APPROVE** candidate handoff SHA256 `901795ec28c938f050f8942681b7ec71e230ff7c3b90a5243cbc9371042c9267` và manifest `6192811fb6290f349ada34edcf5d2db63e2b7762013c320dd715fd4132877f4a`. [Verdict và nguyên văn snapshot được review](../../implementation-log/permission-final-push-20261023/final-review01.json).

Bàn giao publication nhánh/CI/Auth functional trong phạm vi đã giao hoàn tất. Finding nhãn48UIchecks đã đóng; không còn finding chặn trong scope. Metadata này thay trạng thái chờ review của snapshot phía trên, không cấp thêm quyền merge/main hoặc phát hành. Chỉ thêm metadata sau review; source/evidence functional không đổi. Hồ sơ docs vẫn lưu local, chưa commit/push cùng các dirty work khác.
