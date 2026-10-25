# BP4A-NEXT — 46 archive → exact-lock install → build → full unit

Ngày 23/10/2026, Asia/Bangkok. **Kế hoạch chờ owner duyệt; chưa cấp quyền thực thi.** Yêu cầu hiện tại chỉ lập kế hoạch, nêu thời gian/ngân sách, giữ coverage, chưa push main hoặc chạm DB. Hạn cũ 11:30:43 đã kết thúc; không tái dùng grant hết hạn. Lượt lập kế hoạch này chỉ đọc code/cấu hình/tài liệu công khai và ghi docs, không sửa operations/app hoặc chạy npm/test.

## Điểm xuất phát đã kiểm

- Code sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`; lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. Docs HEAD lúc khảo sát `495490e1cd9ae7c10c319d64ad54f67df4322902`.
- [Offline outcome](../../implementation-log/permission-breakpoint-review-20261023/bp04a-offline-outcome03.md): parser PASS 309 archive cache đúng SRI + 23 controls. Parser hiện tại `00c8948c16b10b76160cc722acf937942225e793f6c7a10b5e9456ee2bd509f2`; main02 `89ecc22136dca53882b716c0b7a0921cbc3070e1e1ff2d8689a5f22cb95c6c5f` vẫn [PREPARATION_ONLY](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local02.mjs:6).
- 46 archive còn lại **chưa xác minh thành công**. [Actual01](../../implementation-log/permission-breakpoint-review-20261023/bp04a-local01.json) đã tiêu 1 archive attempt và FAIL_OR_UNKNOWN; không biết chính xác item gây lỗi. Install/build/unit app đều chưa chạy; không biến offline result thành application PASS.
- Helper Job `794b81dfc28b798bc8341765f58403c4e3d8acf3aada8f6098c114fe81c4315f` đã có normal/nonzero và [orphan02 PASS](../../implementation-log/permission-breakpoint-review-20261023/bp04a-guard-orphan02.json). Không cần chạy lại control không bị ảnh hưởng; mỗi command mới vẫn phải có proof release riêng.
- Storage đọc 11:41:03: task 51.560.722 B, tăng 251.592 B từ baseline gốc 51.309.130 B; retained bảy roots 333.386.674 B. C/D khoảng 193,84/98,51 GB trống; chưa có node_modules/cache/temp-bp4. Bốn link hiện hữu chỉ được bỏ qua để thống kê; chưa có publication admission.

## Quyền và ngân sách đề nghị

**Một grant mới tối đa 60 phút từ lúc coordinator ghi nhận owner trả lời (T0), dừng bất kể hoàn tất hay chưa tại T0+60 phút.** Record timestamp và giờ dừng theo Asia/Bangkok trước thao tác. Dành 10 phút cuối để thu hồi/review/lưu bằng chứng; chỉ admit bước mới khi còn đủ cap bước đó, release và reserve. Không bắt owner duyệt lại sau từng bước PASS trong grant này.

| Hành động | Cấp cho lượt mới | Lịch sử sau cấp |
| --- | ---: | --- |
| Archive preflight cho đúng 46 archive | Thêm tối đa 1 attempt | Tổng 2 attempt, giữ FAIL01 |
| Exact-lock npm ci | Tối đa 1 invocation | Lượt đầu tiên nếu bắt đầu |
| Build | Tối đa 1 lượt | Lượt đầu tiên nếu bắt đầu |
| Full src unit + coverage | Tối đa 1 lượt | Lượt đầu tiên nếu bắt đầu |
| Chuẩn bị recipe, controls offline điều phối, review | Trong 15 phút đầu | Giữ từng snapshot/receipt, không reset lịch sử |
| Push bất kỳ nhánh, CI, backend nặng, SQL/DB, Auth/Edge/deploy | **0** | Không dùng quota cũ hoặc tự mở thêm |

Phạm vi ghi được đề nghị: operations/receipt/namespace của lượt mới, dependencies/cache/artifacts local của chính task và docs. Không đổi app source, package/lock, config coverage hoặc acceptance. Không cài công cụ/browser/WSL/Docker, không đổi npm hệ thống, không dùng owner node_modules. Không đụng DB gốc `kfqjdfwxhkdwihjobpny` hoặc staging `ineckiashpwloncxnbqx`, kể cả SELECT.

## Thời gian và các breakpoint

Ước lượng lập lịch **30–45 phút khi không có blocker**, không phải benchmark của build/unit source này. Trần toàn lượt **60 phút**, gồm chuẩn bị và review, không chỉ thời gian lệnh.

| Breakpoint | Cap trong grant | Điều kiện đi tiếp |
| --- | ---: | --- |
| R0 — chuẩn bị, kiểm offline phần điều phối, hai review recipe | 15 phút | Grant/pins/namespace/budget đúng; cả hai reviewer APPROVE exact hash |
| R1 — kiểm đủ 46 archive | 4 phút toàn phase | 46/46 SRI/tar/count PASS và storage forecast/admission đạt |
| R2 — một npm ci + kiểm version/native | npm tối đa 8 phút; phase ≤9 phút kể cả kiểm/release | Exit 0, đúng lock/version, binary Windows load được, Job release xác minh |
| R3 — một build | child ≤8 phút; phase ≤9 phút | Exit 0 và Job release xác minh |
| R4 — full unit/coverage | child ≤8 phút; phase ≤9 phút | Đúng 110 file, zero fail/skip/todo/retry, lines ≥90%, release xác minh |
| R5 — review kết quả và lưu docs | 10 phút dự phòng cuối | Kết luận chính xác, raw hashes/source/environment gắn đúng |

Các cap cộng 56 phút, còn 4 phút cho chuyển bước và bất định nhỏ; tổng không vượt 60. Nếu R0 quá 15 phút hoặc chưa đủ review thì dừng trước remote. Trước R1 phải còn đủ worst-case 4 + 9×3 + 10 = 41 phút; các bước sau tính lại phần còn lại, không lấy reserve chạy thêm. Không chạy command mới sau T0+50 phút. Command/Job phải kết thúc và release trong phase cap; UNKNOWN release chặn mọi bước tiếp.

Trong R0, được sửa tooling/recipe và lặp controls offline cần thiết trong cap, giữ bằng chứng từng lượt. Sau khi bắt đầu R1, **bất kỳ phase FAIL/UNKNOWN, timeout, drift hoặc chạm ngân sách đều dừng phần phụ thuộc; không tự sửa app/recipe rồi tải/cài/chạy lại**. Chỉ điều tra chỉ đọc và lưu kết quả trong thời gian còn lại. Những breakpoint PASS không tự mở PR/main/full backend gate.

## R0 — đóng lỗi có thể kiểm trước

1. Tạo receipt grant mới, deadline và namespace mới; giữ baseline/storage scope và toàn bộ grant/marker/FAIL trước. Chỉ kích hoạt candidate recipe sau review, không chỉ xóa dòng PREPARATION_ONLY để chạy lại marker/grant cũ. Không sửa framework ngân sách external phase03; local grant có chuỗi lịch sử riêng gắn predecessor.
2. Giữ parser đã PASS và helper Job nếu hash/runtime không đổi. Không lặp 309/23 hoặc 955 Node checks chỉ để tăng số PASS. Kiểm pins và phạm vi reuse; nếu module/helper đổi thì kiểm lại phần bị ảnh hưởng trước remote trong R0.
3. Sửa collector có lỗi [actualCounts](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local02.mjs:69): ghi `countFailure {metric,expected,actual}` hoặc đủ actual counters, không gắn nhãn counters cho object khác schema. Ghi lockPath, stage, bytes, status, bounded error code, firstFailure; peer abort không được che nguyên nhân đầu tiên. Global timeout/storage stop cũng phải có nguyên nhân riêng trước abort.
4. Kiểm offline bằng fake transport/clock/budget trên chính logic sẽ dùng: HTTP503; SRI failure giữa bốn worker; COUNTS failure; peer-abort giữ firstFailure; byte-limit; timeout; budget/deadline stop. Không gọi mạng thật hoặc tạo runner tổng mới; chỉ tách hàm cần inject để kiểm được logic hiện hữu. Một batch controls có report bounded, không app unit.
5. Fresh paths/absence check: whole/phase markers, stdout/stderr, config/proof, JSON unit và coverage dir đều mới và exclusive; từ chối stale artifact. Unit explicit `--config vitest.config.ts`, coverage/report vào namespace task mới; không đọc summary cũ để PASS nguồn mới. Giữ nguyên cấu hình include/exclude/threshold.
6. Pin Node24.16.0/npm11.13.0, source/lock/parser/helper/recipe và các package facts. Kiểm C/D thật, retained bảy roots, source sạch, không có .env thực/config credential, không có runner khác của task. Hai reviewer phân scope authority/storage và collector/test evidence, APPROVE exact candidate trước R1.

## R1–R4 — lệnh và giới hạn thực tế

R1 đọc đúng 46 tarball URL/SRI từ lock, concurrency ≤4, không redirect/retry; request/body timeout ≤15 giây, tổng body ≤32MiB, từng archive nén ≤16MiB, gunzip ≤32MiB. Kiểm checksum/path/type/root, metadata byte/file counts và forecast; kết quả từng item hoặc firstFailure phải được lưu. Fact pg-int8 đã có và 309 cache facts được giữ đúng phạm vi. Chỉ sau PASS đủ46 mới bắt đầu cài.

R2 dùng Node/npm có sẵn, `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --include=dev --include=optional` tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`; cache mới riêng task trên D. Public registry, config task rỗng, clean child env; `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, `VITE_DATA_MODE=mock`, HTTP fetch retries=0, fetch-timeout hữu hạn 30 giây, maxsockets=4. Kiểm version đúng lock, đặc biệt Vite/Vitest/TS/coverage/SDK/pg/Playwright và optional native bindings Rolldown/LightningCSS; load probe nhỏ có timeout ≤10 giây và release proof, tính trong phase R2.

**Một npm invocation không có nghĩa zero internal retry.** Npm11.13.0/Pacote21.5.0 có [một retry tarball tích hợp](D:/tools/nodejs/node_modules/npm/node_modules/pacote/lib/fetcher.js:322) khi corruption/ENOENT và [tối đa năm retry bin-link Windows](D:/tools/nodejs/node_modules/npm/node_modules/@npmcli/arborist/lib/arborist/rebuild.js:385). Đề nghị owner cho phép hành vi stock npm hữu hạn này trong cùng process/trần8phút; coordinator không retry phase, không sửa npm để vô hiệu hóa. Nếu owner yêu cầu zero retry ở mọi lớp thì phương án này chưa phù hợp, phải lập slice cache/offline riêng; không tự chọn thay hoặc tuyên bố fetch-retries=0 đã tắt mọi retry.

Preflight hiện giữ RAM, không seed npm cache: **npm ci với cache D mới sẽ tải lại graph Windows dự kiến356 package cùng metadata/fallback**, không chỉ46. Đề xuất giữ kiến trúc này cho lượt kế để tránh thêm cache-seeding chưa kiểm. Public npm network được cấp riêng; 0 push/CI/DB không có nghĩa 0 network.

R3 dùng `npm run build` theo [package scripts](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/package.json:14). R4 dùng toàn suite với flags `vitest run --config vitest.config.ts --coverage --maxWorkers=1 --no-file-parallelism --retry=0 --reporter=json` và output paths mới. [Vitest config](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/vitest.config.ts:10) include toàn src test/spec; [coverage threshold](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/vitest.config.ts:31) lines90 trong phạm vi logic hiện có. So đúng tập 110 tracked file với JSON, tất cả assertion passed, numFailed/numPending/numTodo=0, total=passed; summary lines≥90. Không grep/focus/skip/nới timeout hoặc threshold để xanh.

Helper giữ toàn cây tiến trình trong Job không breakaway. Mỗi command mới cần proof activeProcesses=0/releaseVerified và exit đúng; proof cũ chỉ chứng minh helper đã kiểm, không thay proof của command mới.

## Dung lượng và chi phí

**LỚN HƠN 1 GB — dự trù bảo thủ 1–2GiB đỉnh** gồm node_modules/cache/temp/build/coverage/log. Nơi ghi thật là ổ D trong task, không tạo môi trường thứ hai. Đây là planning allowance, không phải quota OS hoặc cam kết actual sẽ dùng hết.

- Preflight ≤32MiB body tải vào RAM; npm fresh cache thông thường ước 50–80MB tarball theo facts hiện có, còn metadata/recovery. Tổng network nên dự trù khoảng100–200MB; đây là ước lượng, không phải technical cap đo traffic npm. Không trả phí cloud/CI trong scope.
- Giữ **C/D ≥30GiB trống, task tăng mới ≤2GiB so với baseline gốc, retained bảy roots ≤768MiB**; refresh trước từng bước, monitor trong lệnh và checkpoint. Bound retained thường chặt hơn 2GiB; không loại root/link để lách.
- Recipe cũ cho log tối đa192MiB nhưng forecast chỉ dành64MiB report: R0 phải sửa nhất quán. Đề xuất stdout/stderr mỗi file ≤4MiB, ba command chính tổng ≤24MiB; dự phòng32MiB cho dist/coverage/reports và32MiB cho metadata/temp/probe/receipt. Forecast mới tính **88MiB** phụ phí sau payload+tarball thực đo. Các mục này phải được monitor; chạm bound thì dừng với bằng chứng, không cắt log rồi tiếp tục nhận PASS.
- Regular payload dự kiến212.512.248B cho356package; forecast gồm retained hiện tại + payload + compressed tarballs +88MiB. Chỉ admit install nếu còn dưới768MiB với số actual R1. Dữ liệu sinh đồng thời/Windows allocation còn bất định: không nhận forecast/monitor là quota cứng không vượt; free-volume guard vẫn bắt buộc.
- Không tự dọn cache/fixture. Giữ runtime đúng-lock nếu còn dùng ở bước sau; nếu phát hiện nhóm tái tạo được hết nhu cầu thì hỏi dọn riêng với đường dẫn/size. Không đụng owner checkout/cache để làm trống guard.

## Kết quả sẽ bàn giao và giới hạn

Một outcome source-bound cho archive/install/build/full unit, command/exit/timestamps/versions/native proof/raw hashes/disk/history và hai review kết quả; docs commit chỉ owned paths. Nếu dừng thì ghi PASS/FAIL/UNKNOWN/NOT_RUN từng breakpoint và lý do cụ thể, không tạo green tổng.

PASS lượt này **không** là full permission gate, CI candidate, hosted staging hoặc quyền push main. Build chỉ phủ tsconfig hiện tại; ba runtime TS ngoài phạm vi vẫn chưa được chứng minh. Mọi source change sau đó phải đánh giá lại bằng chứng; giữ coverage và các gate hiện hành. Hướng dẫn đọc code: grant/marker → collector/parser → Job release → unit JSON/summary → outcome; đã cung cấp, chưa nhận owner đã đọc/nghiệm thu.

## Quyết định cần owner

Đề nghị duyệt một gói **60 phút từ T0, +1 archive attempt và install/build/full unit mỗi việc1, R0 tooling/offline/review trong15phút; cho phép retry stock npm nội bộ hữu hạn trong cùng invocation8phút; zero coordinator phase retry; 0 push/CI/backend/DB/deploy; giữ lịch sử/coverage/storage**. Chưa có trả lời thì không sửa/kích hoạt recipe hoặc chạy. Lựa chọn khác: chỉ duyệt R0 chuẩn bị recipe, chưa cấp remote/install/build/unit.

Nguồn chính thức đã đối chiếu: [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) về frozen lock, [npm config](https://docs.npmjs.com/cli/v11/using-npm/config/) về ignore-scripts/fetch retry; giới hạn internal retry nêu trên được đọc từ đúng npm cài trên máy, không suy từ config docs. Kế hoạch này đang chờ hai review độc lập và owner approval, không phải receipt mở quyền.
