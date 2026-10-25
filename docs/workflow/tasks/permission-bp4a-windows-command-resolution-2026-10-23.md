# BP4A — sửa command resolution Windows, giữ install rồi build/unit

Ngày 23/10/2026, Asia/Bangkok. **ĐỀ NGHỊ CHỜ OWNER DUYỆT; chưa có quyền sửa/chạy.** [LOCAL75 outcome](../../implementation-log/permission-breakpoint-review-20261023/bp04a-local75-01-outcome.md) có 46/46 archive, npm ci và native PASS, nhưng build dừng ở `tsc not recognized`, unit NOT_RUN. Không đổi app hoặc giảm coverage để vượt lỗi tooling.

## Phạm vi và ngân sách xin thêm

Một cửa sổ **60 phút từ khi ghi nhận câu trả lời duyệt tiếp theo**, thay vì dùng giờ hết hạn cũ. Cho sửa riêng tooling/env và fixture của guard; thêm **1 batch command-resolution guard** (negative + positive), **1 native probe ≤10 giây**, **1 build**, **1 full unit/coverage**. Không chạy lại archive hoặc npm ci; không network, không cài package/tool. Không cần budget tải/cài 1–2 GiB mới.

**0 push mọi nhánh, CI/backend/SQL/DB (kể cả SELECT), Auth/Edge/deploy/cleanup.** Giữ lịch sử thực tế 3 full preflight/1 npm ci/1 build FAIL/0 unit. Nếu dùng lượt mới, build lifetime tối đa 2, unit tối đa 1; negative control dự kiến thất bại chỉ tính PASS control khi khớp oracle đã review, không xóa lỗi build thật cũ.

| Bước | Cap | Điều kiện chuyển tiếp |
| --- | ---: | --- |
| R0 | ≤20 phút | Fresh identity/storage admission; recipe/env/fixture mới, controls offline phần đổi và hai reviewer APPROVE exact bytes trước command guard. |
| R1 | ≤2 phút | Một guard batch ≤60 giây qua cùng npm/Job/env; native probe child ≤10 giây, fresh release proof mỗi child, phần release nằm trong phase. |
| R2 | ≤9 phút | Một `npm run build`, child ≤8 phút, release proof PASS. |
| R3 | ≤9 phút | Một full unit/coverage, child ≤8 phút, release proof PASS và acceptance bên dưới. |
| R4 | Dự phòng 10 phút cuối | Review kết quả, giữ raw/hash, lưu docs và bàn giao. |

Worst-case 50 phút, thêm 10 phút cho chuyển bước. Trước R1 còn ít nhất 30 phút (2+9+9+10). Không bắt đầu command mới sau T0+50 phút hoặc khi thiếu cap phase + reserve. Hard stop T0+60 phút bất kể kết quả. R0 được sửa/lặp controls offline liên quan trong cap, giữ toàn bộ lịch sử; sau R1, unexpected FAIL/UNKNOWN/timeout/drift/storage/release stop thì dừng phụ thuộc và không tự sửa hoặc retry.

## Fresh admission để tái dùng kết quả đã đạt

1. Source vẫn sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. Node/npm/Job helper đúng version/hash cũ. Không `.env` thực hoặc credential trong child; không runner task khác.
2. Kiểm receipt LOCAL75 `6113b5da8866bc1b11cb53cb4afb3bf00ec9e33b5de6d46590b6a903cc1143df`, archive admission, install/native logs/proofs và grant/source pins nguyên bytes. Cả archive và npm ci đã PASS đúng source, nên không rerun chỉ vì build chưa tìm được command.
3. Đọc lại/hash **toàn bộ** file tree `code/node_modules`, so exact path/type/size/SHA256 với [snapshot 19.068 file](../../implementation-log/permission-breakpoint-review-20261023/bp4a-local75-01-dependency-snapshot.json), manifest SHA256 `1589438b4344c922690cbe1f84cf75b9250e22950032f23c37d82a68da6a409f`; không thêm/mất file hoặc link. So hidden lock 351 package rows với source lock, exact phiên bản công cụ và targets/shims `tsc.cmd`, `vite.cmd`. Không coi “351” là thiếu coverage hoặc giả có 356 package đã cài.
4. Chỉ reuse phần được chứng minh: archive/install/native lịch sử, hash baseline dependency. Build/unit vẫn phải chạy mới. Kiểm lại exact dependency snapshot sau guard và trước build. Sau build/unit, giữ mọi file baseline nguyên hash; chỉ nhận các output mới đã liệt kê trong recipe/admission và có cap. Hai output TypeScript đã biết là `node_modules/.cache/tsconfig.app.tsbuildinfo` và `node_modules/.cache/tsconfig.node.tsbuildinfo`; Vite/Vitest cache mới phải được chỉ rõ trước command, không ignore toàn bộ metadata hoặc chấp nhận link. Nếu identity sai/không đủ bằng chứng thì STOP, báo đúng drift, không tải/cài sửa chữa trong gói này. Không dùng checkpoint cũ thành PASS nguồn mới.

## Sửa và guard trước build

Nguyên nhân nghi ngờ mạnh là runner tạo env sạch nhưng bỏ `PATHEXT`. Chỉ sửa tooling copy trong `operations`, giữ recipe/grants cũ bất biến. Env helper mới loại các key trùng case của `PATHEXT`, đặt một key canonical với `.COM;.EXE;.BAT;.CMD`; không sửa environment hệ thống hoặc copy thêm toàn bộ env của người dùng. Giữ các biến mock/no-browser-download/cache/temp/public registry/no-audit của recipe. Để tuân thủ phạm vi 0 network, đặt **`NPM_CONFIG_UPDATE_NOTIFIER=false` và `NPM_CONFIG_OFFLINE=true`** trong cùng env trước mọi npm child; npm có thể kiểm bản cập nhật ngay cả ở `npm run`. Kiểm hai flag này trong offline controls và observer allowlist, không chỉ kỳ vọng script build không tải gì. Không đổi `package.json`, lock, tsconfig, app hoặc unit/coverage config.

Tạo fixture JS/package riêng dưới **`code/artifacts/bp4-cmdguard01`** trong worktree cô lập, không sửa tracked app hay `node_modules`. `.gitignore:2` hiện đã ignore `artifacts/`; kiểm lại rule và identity đường dẫn trước tạo. Chỉ thư mục fixture mới có exact file/content hashes được nhận vào admission, giữ lại sau chạy vì chưa có quyền cleanup. **Job helper giữ `config.cwd=code`** như contract dòng 8; gọi npm CLI bằng `--prefix <fixture> run guard` để npm script cwd ở fixture và cơ chế ancestor PATH tìm đúng `code/node_modules/.bin` như build. Không sửa helper chỉ để cho phép cwd khác. Kiểm không có `node_modules/.bin` khác trong fixture hoặc `code/artifacts` che đường dẫn thực. Fixture/observer chỉ ghi các trường env/path/version đã allowlist, không dump credential hoặc toàn environment.

Một batch gồm hai case qua **cùng Job helper và npm runtime**, fresh namespace/proofs/logs:

- **Negative:** env bỏ `PATHEXT` theo runner cũ; observer được gọi bằng absolute Node path, xác nhận omission. Lệnh bare `tsc --version` phải không được tìm thấy, exit khác 0 với thông báo command-not-found của CMD, không được in TypeScript version. Nếu negative không tái hiện đúng, ghi giả thuyết chưa được chứng minh và STOP, không chạy build để “thử xem”.
- **Positive:** env có đúng PATHEXT canonical; observer rồi `tsc --version && vite --version` phải resolve từ shims/targets của isolated code, in đúng TypeScript 5.9.3/Vite 8.0.16 và exit 0. Kiểm đường dẫn resolve thực, không chỉ nhận version từ package toàn cục. Positive và build phải dùng chung env helper; build vẫn gọi nguyên `npm run build` ở code cwd, không né bằng absolute compiler command.

Các control offline trước đó phải kiểm output chỉ còn một key PATHEXT canonical sau chuẩn hóa và từ chối output còn duplicate env keys, thiếu `.CMD`, thiếu shim/target, global command thay local, sai version/path, stale proof hoặc bad release. Những negative này là test của guard, không giả là app unit PASS. Guard batch phải có tổng deadline và Job release chứng minh child đã nhả; **expected negative có exit khác 0 không được bỏ qua timeout/orphan/release lỗi**. Nếu PowerShell tự bổ sung PATHEXT hoặc negative khác oracle thì UNKNOWN/STOP. Sau positive, native load probe mới ≤10 giây theo env/grant mới; kết quả cũ không thay fresh proof này.

## Build và unit giữ acceptance

Chỉ khi R1 PASS mới chạy một `npm run build` với script hiện tại `tsc -b && vite build`; không đổi scope typecheck. Build chưa chứng minh ba runtime TS ngoài tsconfig hiện hành.

Unit dùng toàn src suite, đúng **110 tracked test files**, explicit `vitest.config.ts`, coverage v8, `--maxWorkers=1 --no-file-parallelism --retry=0`, JSON/coverage đường dẫn mới exclusive. So exact file set; total=passed, failed/pending/todo=0, từng assertion PASS; line coverage **≥90%** trong scope hiện hành. Không grep/focus/skip/nới threshold/timeout hoặc lấy JSON cũ. Kiểm source/lock/dependencies và ngân sách ở mỗi checkpoint; namespace mới không reset history.

## Dung lượng và lưu giữ

Không cài/tải/generate môi trường thứ hai. Dùng lại dependency/cache đang có trên D. Dự trù **tăng thêm tối đa 96 MiB** gồm build/coverage/log/fixture/tooling/raw copies/docs; giữ task cumulative tăng ≤2 GiB từ baseline 51.309.130 B, retained bảy roots ≤768 MiB, C và D ≥30 GiB free. Fresh admission phải tính cả docs mới khoảng 3,45 MB ngoài bảy roots; không gọi retained snapshot là tổng dung lượng mọi nơi. Giữ cap mỗi stream 4 MiB, main logs 24 MiB, reports/build/coverage 32 MiB và meta/temp 32 MiB; các cap nhóm không tự cấp quyền vượt tổng 96 MiB.

Monitor/free-volume checks là guard vận hành, chưa phải quota OS. Chạm ngưỡng thì dừng ghi phụ thuộc, không cleanup hoặc nới cap. Giữ dependency/cache vì còn dùng để tiết kiệm lượt sau; việc dọn cần quyền riêng. Kết quả và proposal này phải qua hai reviewer; approval review không tự là owner execution grant.

## Vì sao không lặp toàn bộ lượt cũ

Lỗi xảy ra trước compiler, trong command resolution của runner; archive/install đã đạt và có thể giữ nếu identity không đổi. Negative + positive trên đúng shell kiểm giả thuyết trước khi dùng lượt build/unit; source review một mình chưa đủ. Sau PASS local vẫn còn các full security/backend/hosted gates ngoài phạm vi, chưa được push main hoặc chạm DB. Không hứa main sẵn sàng chỉ từ breakpoint local này.
