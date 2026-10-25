# BP2 — Ba nhóm sửa nhỏ, 23/10/2026

Kết quả trong phạm vi: **đã sửa source, kiểm nhẹ và hai reviewer đã APPROVE source**. Chưa có Vitest/SQL/browser/backend PASS cho nguồn mới, chưa ready để push/CI. Review cuối cả hồ sơ được ghi tại `bp02-final-review.json` khi có verdict. Tác giả điều phối `/root`; tác giả PIN `/root/bp2_pin_builder`.

## Quyền, giới hạn và snapshot

Owner chọn **“phương án 1, nhưng sau khi xong hãy xóa đi nếu có thể”** cho BP2 tối đa60phút, không cài mới;0push/CI/backend/DB/deploy. Bắt đầu08:34:29, dừng muộn nhất09:34:29 ngày23/10/2026 Asia/Bangkok. [Authorization](bp02-authorization.json), SHA256 `5e48a6b700ad76ff1e998a2c529e7e071e79f70ef7069c2e196ebd235fde1a74`, giữ snapshot lúc ACTIVE; checkpoint kết thúc sẽ đóng riêng, không sửa lịch sử quyền.

- Code worktree: `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, branch `fix/operator-indexeddb-evidence-20261022`.
- Local commit mới **`5dee19836a81f42e020a0175672da9601044869d`**, parent `4f8772667fc0607c77451e5b0c5ddbedfe7b63b5`, tree `aafc005faebd518fdd6cb6763e0489df712c01bd`. Code sạch sau commit;5file/118insertions/2deletions. Không push commit này, không sửa checkout tích hợp của owner.
- Lock giữ SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. Catalog vẫn35stage/760required;12nghĩa vụ PIN và D19/R0/R1 giữ nguyên. Không đổi acceptance, tên required PIN cases, config, timeout, guard hoặc production SQL.
- Toàn bộ5raw file hashes trong receipt đã so với bytes commit mới và working tree, khớp5/5. Source nằm trong Git commit có thể khôi phục; không tạo thêm archive toàn repo.

## Đã sửa gì

| Nhóm | Thay đổi | Vì sao cần / giới hạn |
| --- | --- | --- |
| CORS | [`menuImageHttp.ts:8`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/supabase/functions/_shared/menuImageHttp.ts:8) thêm đúng `x-client-info`; mở rộng `menuImageHttp.test.ts` và `client.test.ts` | SDK header không bị allow-list chặn. Có focused tests cho header preservation và strip REST marker khỏi functions. Không đổi SDK/graph/JWT/privacy/cache/methods. Native check không thay real browser OPTIONS |
| PIN07 complete/recovery | [`serverRuntime:68`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:68) thêm controls TTL/rehash; fault cases chụp exact baseline trước fault và so sau lỗi | Hash/cờ/revision/toàn session rows+signals không bị rút thành crypt/live-count. Snapshot raw ở PostgreSQL; Node chỉ nhận boolean/count. Savepoint rollback phải trả toàn baseline |
| PIN07 employee seed | Ba fault variants bỏ fault→explicit retry generation2→committed receipt; replay giữ exact employee/audit/signal digest và counts | Đóng bước retry có sẵn trong yêu cầu, trong chính cases cũ. Không thêm identity hoặc bỏ assertion cũ |
| PIN15 collision | [`closeout:3105`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/ownerPinOnboardingCloseout.spec.ts:3105) chụp full-row digest trước login/seed; control đổi sort_order rồi rollback; so sau failure và reload. Employee collision dùng pg_temp raw snapshot và SQL boolean equality | Không chấp nhận baseline đã bị đổi sau lỗi. Bao gồm cả employee/menu/floor; không in passcode hash/session rows ra test log |

Production delta chỉ là một CORS header. Phần PIN là tăng độ chặt của test; BP1 chưa tìm thấy product SQL bug để sửa. Các SQL controls được viết trong test fixture nhưng **không được thực thi trong BP2** vì owner cấp0DB/backend.

## Kiểm chứng đã thực hiện

[Receipt gốc và lệnh tái hiện](bp02-light-check01.json), SHA256 `6515ed4f1be10cd73a0304b787691e6e47aede5053cb5fc5e1c36ce04e2655a9`:

| Phép kiểm | Kết quả | Phạm vi thực tế |
| --- | --- | --- |
| Production shared CORS helper | PASS5checks: allow-header/method contract;401/403/503 giữ header và no-store; old-header mutant bị từ chối vì thiếu x-client-info | Node native import TypeScript helper và Response. Request-header set là contract fixture, không phải SDK network capture hoặc handler/browser đã chạy |
| TypeScript syntactic transpile | PASS5/5file,0syntactic errors | TypeScript5.9.3 sẵn có, đúng lock; không cài/copy. Không phải full typecheck, Vitest execution hoặc SQL parsing |
| Source pin before/after và commit | MATCH5/5 | Receipt bind baseline+exact worktree pins; sau commit so lại chính những bytes đó. Không gán receipt parent4f thành PASS toàn nguồn5dee |
| Git whitespace và catalog declaration | PASS;35/760 giữ nguyên | Kiểm tĩnh, không là runtime proof |

Không chạy optional whole938Node tooling: runner cũ kiểm `scripts/*.test.mjs`, không execute năm file TypeScript đang sửa. Reviewer đã xác nhận chạy lại không đóng các gap BP2; tránh tiêu lượt kiểm vô ích.938PASS trước thuộc4f, chỉ giữ lịch sử.

**NOT_RUN/PENDING:** hai focused Vitest cases mới và các Vitest cases liên quan, full build/typecheck, SQL/seed/lock/fault runtime, browser CORS, staging, CI và cả8wholebackend trên5dee. CI03/LIGHT của4f là lịch sử nguồn cũ; không kế thừa thành PASS5dee. Main chỉ được push sau full gate theo các quyết định còn hiệu lực và grant mới phù hợp.

Receipt lưu nguyên invocation của lượt gốc gồm deadline cũ và output flag wx. Khi tái hiện sau này, cần quyền/hạn mới và output path mới; không sửa receipt gốc hoặc chạy lại nguyên command sau cutoff. Khi đủ dependency đúng lock, focused Vitest phải chạy source hiện hành; không dùng node_modules lệch phiên bản để gọi là locked-client verification.

## Những việc đã được bắt trước runtime

- Bản control rehash đầu tiên giả session còn nguyên, trái trigger migration014 thu hồi session khi hash đổi. Root source-review bắt trước mọi DB/test/CI; sửa control chỉ kiểm hash thay đổi/PIN cũ còn đúng, rồi rollback so toàn baseline. Hai reviewer đọc bản sửa cuối. Không có lượt backend thất bại do control này.
- Một lệnh đọc tree dùng HEAD^{tree} chưa quote bị PowerShell diễn giải braces thành scriptblock argument cho Git. Lệnh đọc lỗi đã dừng; dùng literal quoted ref để đọc lại đúng tree. Commit không bị thay hoặc push; không có DB/CI effect. Đây là lỗi lệnh khảo sát, không phải lỗi app/test.
- Đã đọc changelog Supabase hiện hành và giữ locked SDK/graph; bản sửa không thay TLS/runtime/dependency. Những breaking-change không liên quan không được dùng làm lý do mở rộng task.

## Dọn dữ liệu và trạng thái tiếp tục

Đã thông báo cách hiểu yêu cầu xóa: dọn riêng temp/fixture mới do BP2 tạo sau lưu bằng chứng, giữ code/evidence và dependency còn hữu ích. Lượt này **không tạo fixture/temp riêng**; mutant chỉ nằm trong RAM, không chạy whole-node runner nên không sinh night-node06. Không có nhóm temp xác định để xóa hoặc dung lượng thu hồi để báo. Không xóa archive/runtime cũ, useful Playwright packages, report/TAP, code hoặc branch chưa merge.

Không cài gói, WSL/Docker; không browser process, DB consumer hay background test do BP2 tạo còn chạy. Chỉ thêm source Git và hồ sơ nhỏ; không nhận stop process hoặc rename là đã thu hồi đĩa. C/D vẫn vượt30GiB reserve; trạng thái đo cuối được lưu trong checkpoint.

**Breakpoint kế tiếp:** BP3 closure ảnhTC45/46/47 và chuẩn bị measurement/fixture theo [BP1B](bp01b-preparation.md); exact implementation/controls còn chưa được cấp. Không push sau BP2 khi ảnh còn OPEN. Helper Auth/Edge cũ vẫn sai source/window/grant và cần recipe mới; không tự cập nhật DB hoặc deploy. Sau khi mọi source change bắt buộc được gom/freeze/review mới chốt candidate publication/CI rồi từng whole backend; không reset spent hoặc mở lại phase03CLOSED.

Walkthrough đã chuẩn bị: CORS required header→shared helper→focused checks; PIN07 baseline→savepoint control→fault comparison→retry; PIN15 pre-login row→failure/reload equality. Chưa nhận owner đã đọc hoặc nghiệm thu. BP2 hoàn tất source/light-check trong phạm vi không đồng nghĩa hoàn tất phân quyền hoặc toàn bộ code đã qua runtime.