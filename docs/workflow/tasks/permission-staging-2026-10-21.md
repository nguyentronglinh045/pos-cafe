# Bàn giao — Supabase staging riêng, 21/10/2026

## Hiện trạng22:27+07 — dùng mục này khi tiếp tục

**S04 đã xong; S05 Auth/REST routing đã PASS; S06–S08 chưa thực hiện. Full backend chưa đạt.** Owner tự tạo project `pos-cafe-permission-staging`, ref `ineckiashpwloncxnbqx`, Healthy/Free/Nano/Sydney. Dùng Chrome trực tiếp theo lựa chọn owner, không dùng Supabaseconnector, không truy cập DB gốc.

Lượt đầu Auth200/RESTroot401 **FAIL**,2101ms, exit1. Lỗi probe do agent chọn OpenAPIroot với publishable/anon và đòi2xx; endpoint này đã bị provider hạn chế. Receipt không giữbody nên không suy thông điệp chính xác từ401. Hai reviewer đã đối chiếu primarydocs, nhận thiếu sót contract ở review trước. [Kế hoạch sửa và nguồn](permission-staging-rest-probe-remediation-2026-10-21.md).

Owner cấp thêm đúng1candidate review/2scope và1preflight/2GET qua async `call_273da3df6f9f4595b0eb472cb27063ba`: “Đồng ý sửa, review và thêm tối đa 1 preflight”. Bản sửa local `dd8efd4908c14f851fb56623761ca0e5abd26af8` được cả hai reviewer APPROVE trước actual. [Log05](../../implementation-log/permission-staging-20261021/local-guard-tests05.log): **37PASS/0FAIL/0SKIP**, exit0,26419.879ms. Chỉ4script thay đổi, application/test nghiệp vụ/runner/env giữ nguyên.

Lượt bổ sung lúc22:25:21–24+07 **PASS routing-only**,2940ms, exit0: Auth200; reservedRESTresource404 cùng JSONcode`PGRST205`. Đây là expectedmissingresource contract, không phải đọc bảng thành công. Receipt ghi `restDataAccessVerified=false`, `mutationReady=false`, `businessTestsRun=false`. [Receipt01 FAIL](../../implementation-log/permission-staging-20261021/remote-preflight01.json), [receipt02 routingPASS](../../implementation-log/permission-staging-20261021/remote-preflight02.json).

Source fingerprint05 canonical `59b611459df5ec751528f27a675bbe32740971eaf52d0dd039ac7a74eda7e849`,1.097file; manifest02 canonical `75461dda2633adbb981a414964d1bde0a72c62d702e9d92afc82c59bdd01f9a4`. Coverage hash vẫn `0943976f676dcfcecfd76f79c117c81a3ab8cb8d016320484b4593602cbd0e7e`,35stage/760runtimeidentities;726PERM+111PINmappings vẫn riêng và required. Chưa row nghiệp vụ nào được đổi thành hostedPASS.

Hai actualclaim đều đã tiêu: tổng2attempt/4GET, **còn0lượt**. Giữ claimgốc rawSHA `3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766` và claimbổsung cố định, không reset/xóa/đổi tên để retry. [Checkpoint02](../../implementation-log/permission-staging-20261021/checkpoint02.json) lưu trạng thái. OldV3 ledger vẫn CLOSED/spent2/2/1/6, policy/journal hashes không đổi.

Count4GET chỉ tính hai lượt CLIpreflight được giới hạn. Dashboard có các request nền/metadata riêng khi xem project; không lấy số này làm tổng traffic hoặc tuyên bố đã test các dịch vụ hiện trên biểu đồ Dashboard.

Privateconfig giữ ở `D:/Workspace/pos-cafe-permission-run-20261020/private/staging-20261021/config.json`, ngoài code/docs; ACL chỉ currentowner+SYSTEM. Chỉ córef/publishablekey, không mật khẩu hoặc secret/service-role. Không lưu value trong docs. Giữ project/config/recipe để lần sau tái sử dụng; không tạo project/môi trường mới mặc định. Không cài dependency, WSL/Docker hoặc dispatchCI, không SQL/bootstrap/seed/reset/merge/push.

## Bước tiếp theo đã xác định, chưa được phép chạy bằng PASS này

1. Không chạy lại S05: cap đã hết. Deadline cứng vẫn21/10/2026; sang ngày khác guard hiện tại sẽ từ chối. Cần quyết định deadline/ngân sách mới cụ thể, giữ toàn bộ lịch sử; không tự sửa thời gian trongmanifest để vượt guard.
2. Chuẩn bị đúng S06: kiểm provider/DBidentity và empty-target; exactSQLbundle001–016 +prepare/activation theo controller, managedrole/extension/grants/Auth/Storage/Realtime/Edge. Không copy production data, chạy migrationglob/dbpush hoặc localresetfixture trên cloud. HTTP/metadataHealthy không là DBidentity hoặc proofempty.
3. Thiết kế guard SQL/marker/lock trong cùng connection và review exactbundle trước bất kỳ writes nào. Hiện chưa có transport/bootstrapadapter đã duyệt; grant sửa probe là0SQL/0CI/0heavy.
4. Sau đó mới hostedadapter và nguyênfullsuites;29backendstage cầnadapter,1nativePG16 giữgate riêng,5STATIC không thay backendproof. Chỉ fullunioncurrent-source với0requiredskip mới xét kết luận toàn bộ.
5. Ngày21/10 không mở mutation sau22:30, test sau22:45; checkpoint trước22:55 và dừng trước23:00. Không dùng thời gian còn lại để tự mở scope/ngân sách.

Review source/security và operations đã APPROVE code/manifest/grant trước actual; finalreceipt/checkpoint được reviewdelta riêng trong cùng candidate. Verdict cuối và packet hiện tại xem [reviewrecord](../../reviews/2026-10-21-permission-staging.md). Packet01/commitdocs5bac7c5 là snapshot lịch sử, không dùng hash cũ để kiểm file docs đã cập nhật.

Walkthrough code/tests có ở README cạnhtool; owner chưa xác nhận đã đọc/hiểu. Code commitlocal chưa push; docs chỉ commit đúng scope, giữ mọi dirty không liên quan.

## Lịch sử checkpoint21:24 — không dùng làm hiện trạng

Trạng thái21:24+07: **kế hoạch và implementation slice S02–S05 đã được hai reviewer APPROVE; đang chờ kết nối Supabase. Chưa tạo project hoặc chạy test hosted.**

Owner giao kế hoạch → subagent review → triển khai staging riêng, giữ coverage, không chạm DB gốc và dừng trước23h. Sau đó owner chọn “Tôi sẽ kết nối Supabase trong Codex”; hiện chưa có bằng chứng kết nối đã hoàn tất. Không xin lại quyền tạo staging đã được giao; remote chỉ chờ access và identity thực tế.

Kế hoạch canonical: [proposal](../../../openspec/changes/use-supabase-staging-for-permission-tests/proposal.md), [thiết kế](../../../openspec/changes/use-supabase-staging-for-permission-tests/design.md), [testplan](../../../openspec/changes/use-supabase-staging-for-permission-tests/testplan.md), [tasks](../../../openspec/changes/use-supabase-staging-for-permission-tests/tasks.md).

Code hiện tại: commit local `02a118285c4b88c62237bd3db8086207db8eb30f`, baseline trước đó `90e30f2b2b0f046c549b268b32f1840ad99c2409`, checkout `D:/Workspace/pos-cafe-permission-run-20261020/code`. Chỉ thêm4file staging; tracked tree sạch sau commit, chưa push/CI/merge.15recovery helpers untracked có trước được giữ nguyên ngoài candidate.

Source fingerprint cuối `35ef7b6781bcfc5ed1b91875f5b129f5c0ee07ef7955509ed98e73231ee8807c` bind actual HEAD02a1182 và nội dung1.097file. Inventory canonical `0943976f676dcfcecfd76f79c117c81a3ab8cb8d016320484b4593602cbd0e7e` giữ35stage/760runtime rows;726PERM occurrence và111PINmapping giữ riêng. Không có row nào được bỏ hoặc nhận là hosted PASS.

Final kiểm sau commit: Node24.16.0, `node --test scripts/permission-staging.test.mjs`, **27PASS/0FAIL/0SKIP**, exit0,17.3063038s. [Log cuối](../../implementation-log/permission-staging-20261021/local-guard-tests04.log), [source fingerprint](../../implementation-log/permission-staging-20261021/source-fingerprint04.json), [inventory](../../implementation-log/permission-staging-20261021/inventory.json), [review](../../reviews/2026-10-21-permission-staging.md).

DB gốc `kfqjdfwxhkdwihjobpny` bị cấm SQL/API dữ liệu. V3 cũ giữ CLOSED, SHA256 `3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c`; không reopen hoặc CI retry. Guard staging có fixed claim riêng nhưng actual claim chưa tồn tại, chưa tiêu lượt preflight thật.

Hiện trạng access: không có SupabaseCLI/psql trên PATH, không có process env staging; code local chỉ có3gói Playwright đã giữ, không pg/supabase-js. Không cài thêm. C free195.816.411.136B/D free98.833.633.280B ở snapshot khảo sát, không phải số sau khi viết. Dashboard org `eyuomtfcfhfpayzuefyt` Free có1project ở lúc khảo sát. Form mới đã chuẩn bị tên `pos-cafe-permission-staging`, Sydney, Data API bật, tự expose bảng mới tắt, auto-RLS tắt; chưa nhập mật khẩu hoặc submit. Default ACL còn phải đối chiếu bằng SQL/proof trên staging, không nhận bằng việc chọn checkbox.

## Tiếp tục đúng điểm

1. Xác minh kết nối Supabase mới và quyền quản lý staging; kiểm project theo tên/ref trước khi tạo để tránh trùng. Nếu chưa có, chỉ tạo1project Free theo plan. Mật khẩu mới trên browser phải do owner tự nhập/xác nhận/submit theo quy tắc điều khiển trình duyệt; không lấy key/password qua chat.
2. Quan sát actual staging ref khác project gốc và provider metadata. Tạo manifest riêng bind actual ref, inventory hash và source fingerprint hiện tại; private config ngoài code/docs, không thay env hoặc CLI link hiện có.
3. Kiểm source/manifest/review/giờ và actual claim còn absent. Chạy tối đa1preflight thực,2GET. Claim cố định độc lập receipt/manifest; lỗi hoặc mất process vẫn không tự retry/reset claim.
4. HTTP PASS chưa mở SQL. Bootstrap/seed/test nghiệp vụ phải qua S06/provider identity/empty target/exact SQL/adapter và review riêng.29backend stage cần adapter,1nativePG16 và5STATIC vẫn đủ required. Không dùng runner local bằng cách đổi hostname.
5. Dừng mở mutation22:30, test22:45; checkpoint22:55, hard stop23:00+07. Nếu access tới sau cutoff, lưu ref/metadata và chờ lượt được giao tiếp theo, không sửa deadline để chạy.

Walkthrough sẵn ở [hướng dẫn gắn với tool](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-staging.README.md); chưa có xác nhận owner đã đọc hoặc hiểu. Docs worktree có nhiều dirty không liên quan; chỉ stage/commit đúng file của scope này, không reset/switch/stageall.
