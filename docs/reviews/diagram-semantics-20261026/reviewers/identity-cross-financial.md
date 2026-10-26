# Receipt kiểm chéo F01–F04 — candidate v2

Reviewer: `/root/review_identity`, ngày 2026-10-26. Reviewer không viết bảng tài chính ban đầu và không sửa candidate. Scope: 31 hàng F01-A…I, F02-A…I, F03-A…E, F04-A…H; FIN-01, FIN-WIP-02; các kết luận tài chính, nguồn và test tương ứng trong cả bốn file README.md, traceability.md, findings.md, verification.md.

**Verdict: APPROVE hồ sơ review trong scope được giao, đúng candidate v2 dưới đây.** Không có finding mới chặn tính chính xác của hồ sơ tài chính. Đây không phải APPROVE F04 hiện hữu, bản sửa hình chưa render, WIP application, backend local, hoặc nghiệm thu giao dịch/runtime.

## Identity đã kiểm trực tiếp

- Candidate manifest SHA256: `13110a1ad65090f34c7f5bf6a650ff6e9efd5a6ae05f6d2779e28695e880cd51`.
- Evidence manifest SHA256: `6d8c701c3f2d3e94023f4c435766f141ce4d0950320229284d436001f8b313ea`.
- Source manifest SHA256: `2929925805096f6dc2873fea2f076e9f84a395e83cb57257f316f1f9bdac2282`.
- Đã tính SHA256 và byte length thực của cả 4 candidate files và cả 1.272 entry trong evidence manifest v2: không thiếu file, không mismatch. Không chỉ đọc giá trị hash được khai báo.
- So v2 với `history/v1`: README, findings, verification giữ nguyên byte; traceability chỉ đổi đúng ba reference dòng F07 trong `correct-trace-v2.cjs`. Phần F01–F04 không đổi. Receipt này không ký manifest v1.
- O là `711a22e71983e3d6aa17799649af05ce4c762555`; W là HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` cộng nội dung WIP snapshot; D là `27f8cfb89b52b2a562bf3c59d1806c3ccdd02c1a`. Đã dùng source snapshot, không lấy live WIP thay cho source được test.

## Đối chiếu độc lập và kết luận

Đã tự đọc flow/coordinator, UI recovery/payment, runtime composition, adapter/port và SQL trước khi tham khảo `review-financial.md`. Các path dưới là relative trong `source/origin-main` (O) hoặc `source/checkout` (W), như đã định nghĩa trong candidate. Đã rà từng hàng tài chính trong candidate và đối chiếu các vị trí quan trọng lại với dòng thực.

| Phạm vi | Evidence trực tiếp và kết luận |
| --- | --- |
| F01 payment/split | `src/app/drawers/pos/PaymentDrawer.tsx` O:169–211/W:184–223 → `src/features/pos/useOrderPaymentFlow.ts:46–57` → `orderFlow.ts` O:274–406/W:270–400. Selection, số lượng, amount, nhánh đủ 100% và cash validation được mô tả đúng. `supabase/migrations/015_write_business_helpers.sql:66–94,117–154,208–231,276–305` kiểm lock/version/status và số tiền từ snapshot; split giữ source ID/open/table, paid order dùng số cũ, source nhận số mới theo business_date; payment/receipt cùng transaction apply. Hàng tài chính không nhận UI validation thay cho OCC/DB validation. |
| F02 composition/protocol | `src/app/runtimePorts.ts:24–34`, `src/adapters/supabase/repos.ts:17–28`, `newPermissionRuntime.ts:15–33`, `src/ports/index.ts:67–75,154–175` nối production permission runtime với write adapter. `src/adapters/supabase/writeOperationRepo.ts:13–44` và coordinator O:72–100/W:67–95 giữ UUID/frozen payload, capabilities rồi register rồi execute. `supabase/candidate/permission-financial.sql:33–54,61–144,146–153` xác nhận hai RPC ghi riêng, K/TTL, khóa, quyền, mismatch, final clock, apply/audit/result/grant và rollback/rejected có điều kiện. Candidate không suy unexpected SQL thành durable rejected. |
| F03 state machine | `permission-financial.sql:76–114,116–143,179–204` xác nhận pending/terminal, expiry trước cancel/apply, terminal execute chỉ replay lịch sử và tăng replay count. `unknown` là local coordinator, không phải ledger state. Get/list có thể materialize expiry; không có claim đó là pure SELECT hay cron. Cancel không đảo giao dịch applied; void là intent mới. |
| FIN-01 / F04 | Coordinator O:105–120/W:100–115 thực hiện get rồi execute cùng K/payload và trả kết quả execute. `WriteAttemptNotice.tsx:20–29` xử lý kết quả đó. Resume O:129–138/W:124–133 lại chỉ execute khi get còn pending. Phản ví dụ get=pending rồi execute=applied chứng minh diamond “Get thấy trạng thái nào?” sai cho đường retry. Candidate giữ finding mở, đề xuất patch chưa áp dụng/chưa render; đúng. |
| F04 recovery/lifetime sau begin | `WriteRecoveryDrawer.tsx:77–108`, `WriteLifecycle.tsx:20–40`, coordinator O:33–100,129–173/W:33–95,124–168 xác nhận explicit recovery, current order đọc riêng, không hydrate từ R1, không tự gửi lại/in lại khi reconnect, timeout không abort server. Candidate giữ giới hạn session leave có thể clear local; không đồng nhất unknown với server thất bại. |
| FIN-WIP-02 trước begin | O `orderFlow.ts:277–279,362–364` chụp/check guard O `writeOperationFlow.ts:44–48` quanh authority await. W `orderFlow.ts:272–280,354–360` thiếu guard đó. `src/features/shared/permissionSession.ts:64–71` không kiểm generation của coordinator. `WriteLifecycle.tsx:24–29` có thể leave trước attempt; W `PaymentDrawer.tsx:197–198` chỉ chặn callback UI cũ. Candidate phân biệt khoảng hở trước begin với guard còn hiệu lực sau begin; đúng. |

Đã tính lại phép so body SQL trực tiếp trong bộ nhớ, không chạy script ghi đè evidence: lấy body source của bốn file tài chính/print/014/015, so chuỗi LF-normalized với body từ `pg_get_functiondef` trong hai JSON catalog. Cả O lẫn W có 37/47 function declarations/overloads khớp byte body; 10 khai báo legacy không có trong catalog được thu, không có trường hợp đã quan sát mà body mismatch. Kết quả phù hợp `finance-db-comparison.json`; không suy toàn bộ 47 hàm đều đang active hay toàn bộ catalog đã được kiểm.

## Test evidence đã kiểm, không chạy lại

- Đã đọc `checks/recipe.json`, `prepare-tests.cjs`, cả hai config, original test, test copy, fixture và cả bốn JSON report. Tính lại transformation đúng tuyệt đối: chỉ hai import `./orderFlow` và `./writeOperationFlow` đổi sang `@/features/pos/...`; toàn bộ phần còn lại, assertions và fixture nguyên vẹn.
- Original test SHA256 `2bb78c632365f1b76bfbd69f6ca72655096d4d8593945b1d2fb0730d561cd2eb`; copy SHA256 `e4ac088fb15c9af70b44a030e7594d490ea893c74b56572754a348eabb1182e7`; khớp recipe. Alias `@` trỏ lần lượt toàn source O/W; dependency aliases sau alias này giống nhau, dùng dependency có sẵn; cấu hình jsdom, một worker, cùng test include và assertions.
- Report chính W: 12 tests, 0 pass, 12 fail, 0 pending; O: 12 tests, 12 pass, 0 fail, 0 pending. Hai attempt chuẩn bị có 0 assertions và success=false; candidate phân loại đúng là harness failure, không gộp thành business failure.
- Test bao gồm leave/suspend khi authority lookup chờ và lần lookup thứ hai ở full-selection. Seed order cho void đang open; do đó chỉ kết luận 12 oracle lifetime của W không nhận `WRITE_RESULT_UNKNOWN` như yêu cầu. Không kết luận cả 12 ca tạo thành công hiệu ứng tài chính. Candidate đã nêu rõ giới hạn này.
- Đây là kết quả mock in-memory đã được root chạy, reviewer kiểm lại inputs/recipe/outputs; reviewer không tự thực thi lại. Không có browser race, Postgres lock/concurrency, mất ACK thật hay giao dịch Supabase nào được kiểm bằng phép thử này.

## Hình và provenance

Trong lượt kiểm chéo này đã trực tiếp xem **F04 PNG**, sau khi SHA256 thực `bcdc4058181d44b96700735e7214222070c11fd16d5a91d317c28c4fbab2dc65` khớp `source/docs/docs/figures/2026-10-26/manifest.json`. Nhìn thấy rõ cả retry và lookup cùng đổ vào diamond có nhãn sai được FIN-01 chỉ ra. Không xem lại F01–F03 PNG trong lượt kiểm chéo; evidence visual ban đầu của financial reviewer được giữ riêng. Không mở HTML cũ, browser hoặc chạy renderer.

Đã đọc config/probe/runtime observation: staging metadata qua project MCP `ineckiashpwloncxnbqx` khác frontend local env `kfqjdfwxhkdwihjobpny`. Body comparison thuộc staging đã quan sát; không chứng minh backend mà frontend local đang gọi. Project MCP config read-only và catalog metadata không là runtime acceptance. Candidate giữ phân biệt này và không dùng historical renderer APPROVE để tuyên bố semantic correctness.

Không sửa application, DB, tests, figure/Mermaid hay candidate. Không gọi RPC nghiệp vụ. Chỉ tạo receipt này ngoài candidate/evidence đã chốt. FIN-01 và FIN-WIP-02 tiếp tục mở như candidate mô tả; **APPROVE** áp cho hồ sơ phản ánh trung thực chúng, không đóng các finding đó.
