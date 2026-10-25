# BP3 — bổ sung bằng chứng ảnh, source và kiểm nhẹ

Ngày 23/10/2026, Asia/Bangkok. Tác giả `/root`; ba builder phụ trách HTTP/Storage, browser và measurement; hai reviewer độc lập không sửa candidate. Quyền chủ dự án: [BP3 authorization](bp03-authorization.json), tối đa 90 phút từ 08:56:22 đến 10:26:22. Đây là phần tiếp theo của [kế hoạch đã review](bp01b-preparation.md), sau [BP2](bp02-outcome.md).

**Kết quả kỹ thuật: source đã chuẩn bị, kiểm nhẹ đạt; runtime chưa kiểm chứng.** Candidate local sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, parent `5dee19836a81f42e020a0175672da9601044869d`, nhánh `fix/operator-indexeddb-evidence-20261022`, checkout `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`. Chỉ 7 file, 976 thêm/11 xóa; chưa push. Hai reviewer đã APPROVE source chính commit này; review hồ sơ cuối được lưu tại `bp03-final-review.json` sau khi đối chiếu.

## Bản sửa và mục đích

| Phạm vi | Source hiện hành | Bằng chứng được chuẩn bị |
| --- | --- | --- |
| TC45 — authority, bypass, MIME và biên | [T09 case](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/permissionImagesRuntime.contract.test.ts:100), [fixture](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/permissionImagesFixture.ts:160) | JWT thiếu/sai/hết hạn có chữ ký cùng positive control; employee thiếu/sai/revoked, cashier thiếu menu.manage; POST/upsert/PUT/remove/copy trực tiếp Storage với object có thật và metadata/bytes invariant; positive mutation controls bằng service role trên hai key riêng, tracking trước ghi; PNG đúng 5 MiB và 5 MiB+1, GIF/empty/path/store/upsert refusal; JPEG/WebP upload→đọc staging→xóa |
| TC46 — giữ A-old sau revoke/finalize thất bại | [T09 case](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/permissionImagesRuntime.contract.test.ts:299) | Bắt đầu bằng ảnh đã publish; revoke menu.manage trước finalize, giữ exact registry/assets/item binding và bytehash, handle mới còn ready và không public |
| TC47 — browser và lỗi ảnh | [candidate browser](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidate.spec.ts:138) | File input→production SDK POST201, x-client-info phiên bản đúng lock/runtime web, RPC payload→URL ổn định→ảnh decode; OPTIONS kiểm khi quan sát được, không nhận thiếu event thành PASS. Inject 503/no-store duy nhất ở browser cho ảnh đó → placeholder giữ kích thước/tên/giá→đơn mang đi→payment/receipt cùng orderNo. Giữ đơn tại bàn cũ cho clear-demo |
| TC47 — origin, cache và fault | [helper](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:82), [T04 integration](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.mjs:65) | Sau candidate-e2e PASS, trước storage observe/restore, dùng chính physical backend. Tạo/revoke session theo RPC; publish PNG thật, origin200/304, Storage/lookup503 cho cả ordinary/conditional GET; upload metadata fault và cleanup fault chỉ owned keys; control/sentinels; CDP cold/warm cache, unlink, fresh client404 và sample59/60/61giây |
| Bằng chứng và failure propagation | [validator](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.mjs:37), [unit controls](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-t04-image-measurement.test.mjs:29), [orchestrator controls](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04.test.mjs:178) | Binding đúng 6 trường sourceSHA/sourceFingerprint/lockSHA/runId/attempt/physicalBackendSHA; projection hữu hạn không raw secrets; UNIT_SIMULATION bị từ chối. Thiếu/fail measurement làm candidate stage FAIL, stage sau NOT_RUN và close; renderer giữ proof qua worker/export/collector/settler |

Không đổi code ứng dụng, production SQL, lock, danh tính case hoặc timeout: T09 vẫn 30s, 6 case browser vẫn 45s, T04 unit 30 phút và dự phòng cleanup hiện hành. Helper chỉ nhận endpoint synthetic `http://127.0.0.1:62421`, hai STORE_IDS cố định và Linux source/root/physical identity đúng guard. Admission cần 225s còn lại, measurement tối đa 180s và reserve cleanup 45s trong deadline cha, không cộng thêm thời gian cho runner.

Fault upload bám Storagev1.72.1: bỏ qua metadata permission probe `version='1'`, làm lỗi metadata thật sau backend write; bounded sequence counters chứng minh hai nhánh khi chạy thật. Cleanup fault xảy ra trước metadata delete trên exact owned key, control key vẫn phải xóa được. Trigger/function/sequence được đặt tên theo run/attempt, chỉ rõ namespace, revoke EXECUTE và phải xóa; lookup definition/ACL và sentinels phải phục hồi. Nguồn: [uploader](https://github.com/supabase/storage/blob/v1.72.1/src/storage/uploader.ts#L118-L295), [delete lifecycle](https://github.com/supabase/storage/blob/v1.72.1/src/storage/object.ts#L195-L224). Đây là căn cứ thiết kế source, chưa phải bằng chứng runtime.

## Lỗi bắt được trước backend

1. PNG nhúng ban đầu của browser inflate được nhưng IDAT CRC sai. Native preflight đã phát hiện; thay bằng PNG 68 byte có CRC đúng và giải mã1×1.
2. Asset `public/floor-assets/walls/img-color-cell.png` thực chất là JPEG/JFIF, nên helper dựng PNG biên sẽ ném `IMAGE_PNG_FIXTURE_INVALID` trước HTTP. Đã bỏ giả định theo đuôi file, dùng PNG 68 byte đã kiểm để chèn ancillary chunk có CRC đúng. Không sửa asset ứng dụng.
3. Reviewer phát hiện denial chỉ kiểm status<500 có thể nhận404/405/validation lỗi thành auth proof. Đã thêm bounded service positive controls chứng minh cùng route/body thật sự mutate và xóa đúng key trước deny matrix. Exact metadata/byte invariants vẫn giữ.

Hai lỗi fixture và gap oracle đã sửa trước mọi CI/backend. Các lỗi khảo sát đường dẫn/cwd của lệnh đọc được sửa tại chỗ, không phải lỗi sản phẩm hoặc lượt backend; không dùng chúng để reset ngân sách.

## Kiểm chứng thực tế và bằng chứng

| Kiểm | Kết quả và phạm vi |
| --- | --- |
| Targeted Node | 46/46 đạt:14 unit helper + 32 T04 orchestration/guard/export controls. Phần này được chạy lại cùng toàn bộ suite dưới đây; không phải backend |
| Toàn bộ tracked Node suite | **955/955 PASS**, fail/skip/cancel/todo=0, exit 0, 47,669s, Node 24.16.0; source sạch trước/sau. Command `node operations/run-local-node.mjs night-node06 e42215044b4faf7e90f787ae8e975937ad3e4479` tại `D:/Workspace/pos-cafe-permission-timeonly-20261022`. [Receipt](bp03-node-local01.json), [TAP](bp03-node-local01.tap) |
| TypeScript 5.9.3 | 3 file TS transpileModule syntax PASS; **không phải typecheck**, không resolve dependency, không Vitest |
| PNG native | 5 mẫu: helper, browser, thường, đúng5MiB,5MiB+1; kiểm framing/CRC từng chunk và zlib inflate PASS |
| Giải mã native | System.Drawing đọc helper/browserPNG và JPEG do source dựng, cả 3 mẫu 1×1 PASS. WebP project: RIFF/WEBP length/header hợp lệ; **decode WebP NOT_RUN** |
| Runtime/CI | Vitest, browser ứng dụng, SQL, TTL/fault trên backend,8 profile backend, CI nguồn mới: **NOT_RUN**. Không truy cập DB gốc hoặc staging, không install/push/deploy |

[Light receipt](bp03-light-check01.json) SHA256 `6ba037b463b3d5d8a5dd428cc570f16323f71f26e10cecbd491ed8d9d0a56787`; chứa 7 raw source pins, khớp Git blobs của commit e422. Full Node receipt SHA256 `c2957f4eba90ef5ba4281906a34d7d48df2d9bed017a5e590d2069ffae308ea5`; TAP SHA256 `08d136a5a14959962dd4e9bf9d8e9ec40d8fc96e3f774e4275c3ce10d8da4457`. Stderr rỗng. Native recipe giữ tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp3-light-check.mjs`, SHA256 `c61ec27519db6be70b607aca5c873a523a69ddc1640385a0d85510c6df4b59c2`; chỉ đọc initializer bằng TS AST rồi kiểm ảnh trong RAM và System.Drawing, không import fixture DB.

## Giới hạn phải giữ cho breakpoint tiếp

- **Chưa đủ điều kiện push main.** Giữ nguyên full gate 35 stage/760 required và 12 PIN obligations+D19/R0/R1 trên cùng nguồn;955 Node không thay các gate này. PASS CI trên 4f hoặc kết quả BP2 không phải PASS runtime của e422. Ngân sách publication/CI/backend cũ CLOSED, không reset hoặc tự dùng lượt dư.
- T09 hiện khoảng 150 HTTP calls tuần tự và thêm payload 5 MiB; 30s fit **UNKNOWN**. Browser flow mở rộng 45s fit **UNKNOWN**. Helper thực tế 180s/cleanup 45s, driver/CDP, PostgREST privilege reload và fault counters chưa đo; không tăng timeout hay giảm coverage để làm xanh.
- Sample đặt target 59000/60000/61000ms, receipt lưu actual dispatch theo cùng browser clock sau cold response hoàn tất. Mỗi mẫu phải trong `[target,target+750ms)`; đến muộn thì fail, không thay target 60s thành 60,25s. Không tuyên bố đo đúng khoảnh khắc 60000ms; chỉ chấp nhận và báo timestamp thực tế. TTL contract vẫn 60 giây.
- Upload lỗi sau backend write có queue cleanup không chắc chắn: receipt cố ý ghi **QUEUE_CLEANUP_UNCERTAIN**. Owned-storage cleanup qua API/metadata không chứng minh không còn raw orphan; phải có whole-owned-runtime reclaim/resource evidence theo gate. Không dùng metadata trống làm bằng chứng raw bytes đã hết.
- Browser route 503 là biến thể UI duy nhất, không chứng minh lỗi Storage/DB; origin faults được đo riêng trong helper. Helper chỉ chạy sau browser stage PASS; nếu browser fail sau upload, T04 phải fail/close và whole-runtime reclaim xử lý môi trường. Không nhận success-only helper là per-test cleanup khi chạy standalone.
- Locked Vitest/SDK/Playwright closure chưa sẵn sàng ở checkout; bản owner node_modules có version lệch đã ghi ở BP1. Không link cả thư mục hoặc chạy nhầm dependency rồi nhận locked proof. Không tạo WSL/Docker hoặc cài gì trong BP3.

## Điểm dừng và bước tiếp theo

BP3 dừng ở source + kiểm nhẹ + review. Đề xuất BP4 tách riêng: kiểm admission/dependency/disk/guard và review code cho TC45/46 trước, xin ngân sách thực thi cụ thể rồi chạy một slice, đọc lỗi và dừng tại breakpoint trước khi profile tiếp. Full runtime trên nguồn cuối cùng vẫn bắt buộc; không hứa main trước khi có đủ evidence. Không chạm DB gốc `kfqjdfwxhkdwihjobpny`; staging `ineckiashpwloncxnbqx` cần grant mới nếu có thao tác.

Fixture Node `D:/Workspace/pos-cafe-permission-timeonly-20261022/temp/night-node06`:45 file/40.919 byte nội dung, 21 thư mục tính cả gốc và 2 junction, không tăng tốc lần sau. TAP/receipt/hash đã giữ; đã hỏi owner quyền dọn riêng theo AGENTS.md, chưa có trả lời thì giữ. Không dọn dependency còn hữu ích hoặc dữ liệu cũ. Checkpoint 09:24: C còn 192.381.583.360 byte, D còn 98.509.778.944 byte; đây là dung lượng trống ổ Windows, không quy toàn bộ biến động cho task.

Walkthrough code cho chủ dự án: **đã chuẩn bị, chờ owner chọn thời điểm**, chưa tuyên bố owner đã đọc/hiểu. Thứ tự ngắn: T09 direct positive→denial invariant; browser upload→fallback→same-order receipt; helper admission→fault/caches→cleanup; renderer từ chối proof sai và suite controls. Không phát hành trong BP3.
