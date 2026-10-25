# Review Supabase staging — 21/10/2026

## Kế hoạch, candidate01

Hai reviewer không viết candidate: `/root/continuation_source_review` kiểm coverage/source và `/root/continuation_operations_review` kiểm vận hành/cách ly/budget.

Finding chung: mô tả redirect yêu cầu0request là không thể; phải phân biệt input sai bị chặn trước network với response3xx từ exact staging origin. Đã sửa Scenario STG-01 và STG-T02. Không đổi acceptance nghiệp vụ.

Sau khi đọc lại bản sửa, cả hai explicit **APPROVE kế hoạch slice S02–S05**. Source reviewer xác nhận spec SHA256 `d610f344750117cfc3d5ba5a103f6713ce7cef54b8419d41d670f44e52b7c442`, testplan `65be94aa21d76ca72c5ed192817033fb9927b5a3722ce62fa2aa72693f1dc4ca`. Operations reviewer xác nhận inventory/guard/project Free riêng/tối đa2GET; SQL/bootstrap/seed/reset và business suites vẫn bị chặn bởi gate riêng.

Approval này không chứng nhận implementation, provider identity hoặc bất kỳ kết quả hosted nào.

## Implementation, candidate01 — findings và bản sửa cuối

Code mới chỉ4file: `scripts/permission-staging.mjs`, `scripts/permission-staging-cli.mjs`, `scripts/permission-staging.test.mjs`, `scripts/permission-staging.README.md`. Không sửa test/config/runner cũ, env hoặc application.

Lượt local21:07+07: `node --test scripts/permission-staging.test.mjs`, exit0, **25PASS/0FAIL/0SKIP**,774.3027ms; syntax check2module exit0. Fake transport được ghi `SYNTHETIC_TRANSPORT`; có test timeout thật15ms và filesystem receipt thật. Không request Supabase trong lượt local.

Evidence: [log](../implementation-log/permission-staging-20261021/local-guard-tests01.log), [inventory](../implementation-log/permission-staging-20261021/inventory.json). Inventory canonical SHA256 `0943976f676dcfcecfd76f79c117c81a3ab8cb8d016320484b4593602cbd0e7e`,35stage/760runtime rows, giữ counts726PERM+111PINmapping và test/config hashes. 29backend stage cần adapter,1nativePG16,5STATIC; chưa có adapter hosted hoàn chỉnh.

Chưa có actual staging ref, manifest chạy thật, credential mới, remote preflight hoặc SQL. Owner đã chọn sẽ kết nối Supabase; trạng thái công cụ mới chưa xác nhận. OldV3 vẫn CLOSED/hash không đổi. Deadline23:00+07; không mở mutation từ22:30 hoặc test từ22:45.

Hai finding chặn đầu tiên:

- Operations: cap1attempt chỉ chống trùng receipt path, đổi output vẫn có thể gọi thêm. Đã thêm claim exclusive theo workstream tại path cố định, trước network; actual HTTP không inject store. Regression filesystem kiểm đổi receipt vẫn `STAGING_ATTEMPT_USED`,0request bổ sung.
- Source: inventory hash chưa bao phủ application/SQL/fixture/lock, baseline SHA hằng số chưa là source hiện hành. Đã thêm source fingerprint riêng bind actual HEAD và mọi file tracked+4file staging; kiểm trước/sau GET. Reader giả lập trong bộ nhớ chứng minh thay SQL đổi hash, không sửa source thật.

Hai reviewer đã đọc đúng4hash cuối và explicit **APPROVE implementation slice S02–S05**: core `826d6aa156a7094e0475fd22392dcb35146e82cc5695fad4beca09d4c83daa03`; CLI `087c5ee930d6d6a6c9ae31eb95a0e74369a478f7d99e2677837a68a1283f8e4d`; test `25b2881f5e92b09407ae3f1ad76af7a24bf46ae2b40a6180163bb85d9a0791ec`; README `886f1559cad1f24f707a696e594ec519a958a2bf061e0ef3d1933df5cedc5488`.

Final log03 trước commit:27PASS/0FAIL/0SKIP,18.2763142s. Sau commit local `02a118285c4b88c62237bd3db8086207db8eb30f` giữ nguyên4file bytes đã review, chạy lại đúng bộ guard để bind actual HEAD mới: [log04](../implementation-log/permission-staging-20261021/local-guard-tests04.log),27PASS/0FAIL/0SKIP,17.3063038s. [Fingerprint04](../implementation-log/permission-staging-20261021/source-fingerprint04.json) canonical `35ef7b6781bcfc5ed1b91875f5b129f5c0ee07ef7955509ed98e73231ee8807c`,1.097file, tracked tree sạch. Không push hoặc CI.

Approval không chứng nhận actual HTTP, DB identity, bootstrap hoặc business suites. Actual preflight claim vẫn absent; remote còn chờ owner kết nối Supabase và actual target/config.

## Actual target và closure lượt đầu —21/10,22:10–22:16+07

Owner chọn Chrome trực tiếp, tự tạo project `pos-cafe-permission-staging`, ref `ineckiashpwloncxnbqx`; screenshot/metadata cho Healthy/Free/Nano/Sydney. Cả source reviewer và operations reviewer APPROVE actualmanifest01 canonical `a58a52d7855bf071827350b78619b86a3a56ad030b1721511655ab4346397e1b` trước S05; privateconfig ngoài code/docs, ACL chỉ owner+SYSTEM.

Lượt01 FAIL(Auth200,RESTroot401),2101ms, exit1. Hai reviewer kiểmreceipt/claim/source và primarydocs; explicit **APPROVE evidence closure ở trạng thái FAIL**, không đổi PASS hoặc mở retry. Finding chặn: predicate2xx ở OpenAPIroot trái hợp đồng provider hiện hành. Đây là thiếu sót trong thiết kế và review trước.401 phù hợp documentedrestriction nhưng không chứng minh thông điệp chính xác vì bodykhônglưu.

## Candidate sửa sau grant bổ sung —21/10, trước22:25+07

Owner trả lời async `call_273da3df6f9f4595b0eb472cb27063ba`: “Đồng ý sửa, review và thêm tối đa 1 preflight”. Allocation thêm1candidate×2scope và1actualattempt/2GET, không reset lịch sử, không SQL/CI/heavy.

Candidate localcommit `dd8efd4908c14f851fb56623761ca0e5abd26af8`, chỉ4script:

| File | SHA256 bytes đã review |
| --- | --- |
| permission-staging.mjs | f23543a4db92eef39e9b557db748b71efeae008164a335e07b05a64504b46ed9 |
| permission-staging-cli.mjs | b7e59ba19fa2b4c3eddac56767dcbd27cedaada69dad9a5d39cb99892780bd99 |
| permission-staging.test.mjs | de6dce3fde8677faca26991ea5b8dd81cd18ba65495afefd67827c6e9656424d |
| permission-staging.README.md | 6a04324d3156842b858b05eff31813881e4dc25b09fefdb22c2ebf12e63feef6 |

Source fingerprint05 canonical `59b611459df5ec751528f27a675bbe32740971eaf52d0dd039ac7a74eda7e849`, manifest02 `75461dda2633adbb981a414964d1bde0a72c62d702e9d92afc82c59bdd01f9a4`, grant `179959c4b6608cc17807c3150f806cae6afe31036c73018ba5c2c93e92e1803b`. Log05:37PASS/0FAIL/0SKIP, exit0,26419.879ms. Không sửa application/test nghiệp vụ/runner/env; inventoryhash35stage/760identity giữ nguyên.

Source reviewer explicit **APPROVE** scope source/security/providercontract; operations reviewer explicit **APPROVE** scope grant/budget/isolation/provenance. Cả hai tự đối chiếu primarydocs: RESTresource404+JSONcodePGRST205; không nhận generic404/401, body4096bytes/timeoutgồmđọcbody và khôngrawlog. Grantfixedslot giữ claimcũ/target/deadline; không mở lượt thứ ba. Approval nhận trướcactualexecution; không còn finding chặn trong candidate.

## Kết quả actual bổ sung và finaldelta

Lượt02 lúc22:25:21–24+07: Auth200; RESTreservedresource404/PGRST205; **PASS routing-only**,2940ms, exit0. Receipt02SHA256 `9f8b7ab73cf40ff8e925aadff39ec435406bf68d188fe7de63d37e0c3be0d510`. `restDataAccessVerified=false`, `mutationReady=false`, `businessTestsRun=false`. Không SQL/bootstrap, không DBgốc, không business hoặc fullbackendPASS. Tổng2attempt/4GET đã tiêu; originalclaimrawSHA2563cd550...f766 còn nguyên; oldledger/journal CLOSED/hash/counts không đổi.

Finalpacket02 bind actualreceipt/claim/source và các docs cập nhật; approval metadata được lưu riêng ở `docs/implementation-log/permission-staging-20261021/review-packet02-approvals.json` sau khi hai reviewer xác nhận delta. Packet01 cùng docscommit5bac7c5 là lịch sử trướcactual, không kiểm file docs hiện tại bằng hash cũ. Không dùng record này cấp thêmbudget hoặc bootstrap.
