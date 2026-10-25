# BP1B — Rà phần còn mở và chuẩn bị bước sửa, 23/10/2026

Gói tiếp nối chỉ đọc của [BP1A](bp01-review-and-remediation.md), đã lưu commit docs `4c6d12845c8dd29d436c53e10365cb5d392d17cf`. Verdict độc lập của BP1B được lưu riêng khi có. Tác giả `/root`. Quyền hiện hành vẫn là owner chọn **review code và chuẩn bị bản sửa; chốt ngân sách chạy sau**. Chưa sửa source, chạy test/CI/backend hoặc truy cập DB. Candidate vẫn4f8772667fc0607c77451e5b0c5ddbedfe7b63b5; các PASS cũ và các mục OPEN của BP1A giữ nguyên.

## Kết quả rà bổ sung

### BP1-PIN-15 — collision oracle chưa giữ toàn hàng cũ

[TC15 testplan:151](../../../openspec/changes/force-default-pin-change/testplan.md:151) yêu cầu ENTITY_ID_CONFLICT không overwrite. [`closeout:3102`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/ownerPinOnboardingCloseout.spec.ts:3102) tạo collision row với name='TC15 collision', sort_order=99, seed_key=null. Sau lỗi, [`:3142`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/ownerPinOnboardingCloseout.spec.ts:3142) chỉ so name/seed_key. Snapshot cho reload tại:3149 được chụp sau operation lỗi.

Phản ví dụ: operation làm sort_order99→0 trước trả ENTITY_ID_CONFLICT, giữ name/seed_key. Những assertion này vẫn đạt, rồi baseline sau lỗi nhận trạng thái đã đổi; row cuối cùng bị xóa theo fixture. Current SQL kiểm tồn tại trước insert, chưa tìm product bug; đây là **assertion gap so yêu cầu không overwrite**, đã có trước4f.

Chuẩn bị sửa cùng hai menu/floor collision cases hiện hữu: chụp exact collision row **sau insert nhưng trước login/seed**, so row nguyên trạng sau failure và reload, giữ receipt pending và retry sau dọn collision có kiểm soát. SQL equality/digest an toàn ưu tiên hơn in raw row; giữ name/count/cleanup checks có sẵn. Có thể thêm cùng control vào employee collision ở server runtime:855 nếu assertion hiện hữu cũng chỉ kiểm error. Negative control thay một field không đổi count/name/seed_key phải bị oracle bắt. Không tạo testcase identity hoặc suite mirror để làm counts xanh.

### Những nghi vấn đã có coverage đối chứng

| Scope | Chuỗi đã review thêm | Kết luận và giới hạn |
| --- | --- | --- |
| TC10 | Closeout2125–2314, storeKey helpers/tests, bootstrap SQL và app | String/null storeNo đã có identity contract:229; không báo thiếu chỉ vì một file không chứa variant. Chưa thấy product defect mới |
| TC15/16 | Closeout2805–3495, server519–623; shared stage/status/snapshot/lock/fault helpers748–922; InitialSeedLifecycle, seed adapter, SQL get/begin/run | Có tenant GET/begin/run, spoofed storeId, S2token-under-S1 và nonowner fullseed/session checks. TC15 gap riêng ở trên; không biến source review thành runtime PASS |
| T02 | Bridge6144 comparison:124; migration017:161; REST positive:234, denial:268, revoked K:276; foundation:59 và revert:53 | Đối chiếu independent oracle/helper/wrapper/UI, raw REST và K payload/TTL/status/result. Không thấy lỗi tĩnh mới. Ba stage có17required; hai bridge stages chạy nguyên file52tests,17 không phải actual executions |
| Canary activation | Bundle11fragments, activation steps, compatibility prepare, locked recheck; runtime:189/279 | EmptyActivation contract:102 và tooltest:166 đã kiểm indirect bootstrap/admin/seed-stage/print/image/audit/signal registries. Không báo thiếu closure từ canary file riêng. Actual locks/Auth/CLI/teardown vẫn cần runtime |

Phạm vi chưa đọc của slice T02/activation: toàn migrations001–016, mọi implementation phase27 dưới protocol, provider/kernel cleanup và backup/live release. Không dùng TC19 synthetic activation thay bằng chứng release. Delta4f reader/control đã review ở BP1A; chưa có runtime hiện hành mới.

## Môi trường kiểm nhẹ: không dùng dependency lệch lock làm bằng chứng exact

Khảo sát read-only các package.json đã có và package-lock candidate, không install hoặc chạy package:

| Package | Lock candidate | `D:/Workspace/pos-cafe/node_modules` |
| --- | --- | --- |
| vitest | 4.1.11 | 4.1.10 |
| @supabase/supabase-js | 2.108.1 | 2.112.3 |
| @supabase/functions-js | 2.108.1 | 2.108.1 |
| @playwright/test | 1.60.0 | 1.62.1 |
| playwright-core | 1.60.0 | 1.60.0 |

Isolated code không có những package dirs này. Retained `D:/Workspace/pos-cafe-permission-run-20261020/code/node_modules` có @playwright/test/playwright-core1.60.0, còn dùng được làm nguồn kiểm tiếp; chưa chứng minh đủ dependencies/integrity/exact invocation để chạy candidate. Chrome/Edge đã có, version155; không tải browser binary mới trong BP1. Node hiện có24.16.0.

Đây là **readiness gap**, không phải lý do tự npm ci hoặc sửa lock. Trước sửa/chạy, phân loại phép kiểm thuần Node, exact-version Vitest/SDK/browser; xác minh cache/package closure có sẵn, disk/time và cài riêng chỉ nếu đã được giao. Không link whole owner node_modules vào candidate hoặc coi PASS trên phiên bản khác là locked-client proof. Chưa có ước tính peak install được kiểm đủ, nên phần install chưa admitted.

Một lệnh đọc lock ban đầu dùng PowerShell ConvertFrom-Json không hỗ trợ key rỗng ở mode object; đã dừng phần đọc đó và dùng -AsHashtable thành công. Không chạy test, thay lock hay ghi ứng dụng từ lỗi chuẩn bị này. Đây là lỗi parser của lệnh khảo sát, không phải package-lock hỏng hoặc một lượt test fail.

## Thiết kế closure ảnh phải giữ đúng ranh runtime

BP1A đã nêu các assertions ngắn có thể mở rộng trong T09 và candidate E2E hiện hữu. T09 timeout30s không chứa được TTL61s; không chuyển TTL vào hook hoặc tăng timeout ngầm. Đã xác định một điểm nối nhỏ: [`permission-runtime-t04.mjs:196`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:196), sau executeRuntimeStage PASS cho `candidate-e2e`, trước afterStage/restore. Candidate đang activated; stage này thuộc reset set. Nối sau T09 sẽ phải dựng lại candidate vì fixture ảnh đã trả về legacy, nên không chọn đường đó.

Helper đề xuất `scripts/permission-t04-image-measurement.mjs` dùng synthetic boundary sẵn có; không tạo backend/stage/framework mới. Inputs hữu hạn: exact source/lock/run/attempt/physical identity, hai store IDs được review, owned item/handle IDs, guard/deadline và private output path. Credentials truyền trong RAM theo quyền boundary, không log hoặc nhận URL/secret tùy ý; hosted hostname phải refuse. Positive lifecycle dùng gateway+RPC và PNG thật có thể decode, không chèn published registry rồi gọi đó là app flow.

Measurement đo cold/warm/origin/conditional, Storage và lookupRPC failures, uncached client sau unlink, các mốc59/60,25/61,5s cùng image-error→order→payment. Không bắt59s nhất thiết cache hit vì clock/revalidation có thể sớm. Receipt cố định lưu status/cache flags/timing và equality booleans, không raw credentials; cần một field/validator hữu hạn trong T04 renderer/exporter hiện khóa exact keys. Thiếu/fail measurement không được chỉ ghi JSON rồi bỏ qua: phải làm stage/profile FAIL trong phạm vi yêu cầu ảnh đang chứng minh. Stage19 và35/760/12 không đổi.

Cap đề xuất riêng180s +45s cleanup reserve phải **nằm trong absolute deadline hiện hành**; không đủ thì refuse trước mutation. Chưa phải cap đã được owner duyệt hoặc cam kết whole T04 đủ giờ. Giữ timeout test/hook/worker. Xóa đúng owned Storage bytes, phục hồi ACL/fault bindings, đóng browser trước parent observe; fixture kiểm baseline3buckets/6objects/payload hashes trước full DB restore. Cleanup/equality/terminal UNKNOWN dừng phần phụ thuộc. Controls sai source/physical/hostedURL/deadline phải zero effects. Mutation/counterexample controls cho oracle thực hiện ngoài immutable heavy source; không sửa Git source đang chạy để thử regression.

### Hai injector có căn cứ exact-version source, chưa có runtime proof

Storage image pin là `storage-api:v1.72.1` tại [`ci1-images.json:73`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/permissions/runtime/ci1-images.json:73), manifest digest `sha256:c2b7d1c10948bed6b5335cfa600d85f0d490511eddc87560f00911e7b04c3388`. Tra primary source đúng tag để giảm lỗi thiết kế trước test, không tự coi tag source là readback compiled binary.

- **Cleanup fault:** source route DELETE gọi deleteObjects; DB DELETE trong transaction xảy ra trước backend byte deletion. Đề xuất BEFORE DELETE trigger chỉ cho exact owned bucket/key U, refuse tên trigger/function đã tồn tại. Gateway DELETE503 phải đi cùng registry discarded **và metadata/byte hash U còn nguyên**. Owned control key khác xóa được; S2/published sentinels không đổi. Finally drop đúng fault objects, phục hồi catalog/ACL, operator cleanup explicit U; không retry gateway hoặc broad cleanup. Nếu bytes không còn hoặc predicate không đúng thì injector FAIL, không gọi orphan proof. Nguồn: [route](https://github.com/supabase/storage/blob/v1.72.1/src/http/routes/object/deleteObjects.ts#L66-L89), [thứ tự delete](https://github.com/supabase/storage/blob/v1.72.1/src/storage/object.ts#L195-L224), [SQL delete](https://github.com/supabase/storage/blob/v1.72.1/src/storage/database/pg.ts#L1011-L1036).
- **Upload fault:** BEFORE INSERT/UPDATE metadata trigger chỉ cho owned namespace, phải bỏ qua permission probe `version="1"`; real-version metadata completion fail xảy ra sau backend upload. Đòi probe được qua, gateway503, registry uploading, không ready/published và item/asset cũ nguyên vẹn; khóa exact handle/key từ owned row. Cuối cùng tháo fault và phục hồi catalog. Đây là Storage upload metadata failure, không giả disk/network outage. Source enqueue ObjectAdminDelete sau lỗi; queue không chứng minh bytes đã mất hoặc còn. Không suy baseline6objects là không có raw backend orphan: cần readback phù hợp hoặc giữ trạng thái uncertainty và whole-owned-runtime reclaim proof. Nguồn: [probe](https://github.com/supabase/storage/blob/v1.72.1/src/storage/uploader.ts#L72-L96), [upload/metadata/catch](https://github.com/supabase/storage/blob/v1.72.1/src/storage/uploader.ts#L118-L295).

Bucket file_size_limit có thể dùng boundary/refusal control, không thay upload-I/O fault bằng một lỗi400. Các thiết kế trên là candidate để tác giả hiện thực/kiểm controls sau grant; không nhận SQL source reasoning làm runtime PASS. Nếu restore hoặc injector không đúng thì dừng và báo, không đổi daemon/proxy/network để cố hoàn tất. Mọi fault/ACL/bucket thao tác chỉ synthetic, không đưa lên staging. Recipe hosted Auth/Edge vẫn phải lập grant/window/custody riêng.

## Điều kiện chuyển bước

Sau hai review hồ sơ cuối, đề xuất một grant **BP2 ba nhóm sửa nhỏ và kiểm nhẹ trong worktree cách ly**, tối đa60phút: CORS một header; PIN07 exact snapshot/retry; PIN15 collision preservation. Publication0/CI0/heavy0/DB0; không deploy hoặc cài thêm nếu chưa đủ admission dung lượng/phiên bản. Dừng khi phát hiện cần đổi acceptance/quyền/dữ liệu hoặc hết timebox; giữ diff/report và báo breakpoint. Chỉ giới hạn công việc của slice, không đổi timeout/gate. Grant này vẫn chờ owner, không được tạo bởi tài liệu.

Chuẩn bị measurement/ảnh ở trên tách thành BP3 source/fixture/tooling lớn hơn, còn phải review exact diff và controls trước chạy. Hoàn thành BP2 **chưa** làm candidate ready để push/CI khi closure ảnh còn mở. Gom mọi source change bắt buộc trước freeze/publication tránh CI rồi lại sửa tiếp. Cleanup per-client vẫn optional diagnostic, không tự làm chậm full gate. Không push khi còn known blocking source/oracle issue.

Bất kỳ phần cần source change phải gom trước freeze; unit/guard controls và independent reviews trước candidate CI. Candidate CI/backend sẽ chốt ngân sách riêng sau source đủ chuẩn bị; giữ lịch sử spent, không mở lại grant CLOSED, không dùng hai CI PR/main cho candidate. Thứ tự T04→7service,35/760/12+D19/R0/R1, DB gốc/Vercel cấm và chỉ main sau full gate giữ nguyên.
