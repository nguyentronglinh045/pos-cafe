# Thiết kế công cụ và quy trình

## Ranh giới

Workflow vận hành/templates/palette/measurement và runner/config/metrics/capture/fixtures/font, script aliases nằm trên code; spec, quyết định và biên bản nằm trên docs. `metrics.mjs` thuần ESM dùng được Node/browser; `capture.mjs` nhận Playwright Page; `run.mjs` phối hợp, không import adapter hay sửa `src/`. Fixture thanh toán chỉ là đối chứng tổng hợp, không triển khai UI sản phẩm.

## Hợp đồng đầu vào

Schema chi tiết và mẫu tại [measurement](https://github.com/nguyentronglinh045/pos-cafe/blob/main/ui-remake/measurement.md). Các trường bắt buộc:

| Trường | Kiểu/ràng buộc |
| --- | --- |
| version/kind | integer1; selftest hoặc screen-remake |
| cases | array1..32; id duy nhất regex`^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$` |
| viewport | integers width≥568,height≥320,width>height; tối đa16.777.216pixels |
| actual/reference | localhttpURL, ready selector; steps click/fill/waitFor/scrollIntoView; tối đa50steps |
| anchors / criticalSelectors | mỗi array1..64; selectors phải đúng một phần tử; IDs duy nhất trong array |
| thresholds | channelThreshold integer0..255; maxDiffRatio0..1; geometryTolerancePx0..100; minTargetPx1..200, đều finite và explicit |
| referenceFiles | screen mode: danh sách file local bất biến gồm raw/normalized/assets/normalizationCSS cần thiết |
| referenceApproval | screen mode: by, ISO at, sourceSha256 và contractSha256 trùng output`--plan` |
| actualSourceRoot/dataMode/serverRecipe | screen mode: repo thực cần hash, mock, recipe công bố; không tự chứng minh server binding |

`defaults` chỉ tránh lặp case; merge trước validate, thresholds override từng trường. Ngưỡng0 trong template là scaffold hiệu chuẩn, không phải nghiệm thu phổ quát. Những file/font/palette/contract khác nhau không được ghép PASS.

## Đo và đầu ra

Expected và actual được chụp trong context mới. Font/image decode/readiness được kiểm; Date fixed, timers vẫn chạy; screenshot viewport, không fullPage vô hạn. Các capture phải ổn định trước so. Browser canvas decode PNG, module metrics so byte RGBA tại threshold; không dùng package pixelmatch private của Playwright hay cài image library mới. Các vùng pixel độc lập không bị tỷ lệ toàn nền trống che lỗi.

Geometry/typography/color anchors là phép kiểm riêng pixel; semantic root variables kiểm riêng. Critical control được scroll vào khung, hit-test tâm và kiểm minimum target; sau đó phục hồi scroll. Phạm vi này không thay accessibility audit toàn DOM. Ảnh chỉ chứa viewport; nội dung ngoài fold cần case scroll riêng để có fidelity evidence.

Report JSON/MD và bốnPNG/case; case ERROR không được tính là expected FAIL trong selftest. Exit0 chỉ có nghĩa measurement hoặc đối chứng bộ đo đạt đúng phạm vi; productAcceptance luôn NOT_ASSESSED. Không có command update reference.

## Bảo toàn và tài nguyên

Output folder mới dưới artifacts/ui-remake, không overwrite. Dự toán24bytes/pixel tổngcase và limit512MiB/run; không giả đó là quota của cả process/hệ điều hành. Source read budget256MiB tổng,64MiB/member,10.000members; relative input không thoát repo. Hash source/reference trước–sau, report source khai báo của app tách tool source. Actual screenshots chưa tự chứng minh backend/mock hay server binding; operator kiểm recipe/env thật.

Tái sử dụng dependency/browser sẵn bằng module env explicit; report môi trường thực. Lần tác giả chạy import `playwright` 1.60.0, khớp lockfile; `@playwright/test` 1.62.1 quan sát ở checkout dùng chung là package khác, không phải runtime của runner. Nhóm cài theo recipe môi trường của mình sau preflight disk; khác OS/browser/font thì phải hiệu chuẩn, không đem golden tùy ý sang môi trường khác.

## Vị trí tài liệu vận hành — D5

`ui-remake/README.md`, `templates.md`, `palette.md` và `measurement.md` trên nhánh code là bản gốc vận hành, version cùng runner/fixtures/font. Các liên kết source trong gói này là relative để theo đúng checkout. Nhánh `docs` giữ toàn bộ change OpenSpec, nguồn quyết định, biên bản review/kiểm thử và handoff; con trỏ cũ chỉ dẫn sang code. AGENTS/CLAUDE trên `docs` mô tả ngoại lệ này, không nhân đôi cả bộ quy tắc dự án vào code.

## Đánh đổi

- Chọn reference HTML local v1 để đo DOM/font/anchors, thay cho suy ngược thông số từ bitmap. Bitmap-only cần bước normalized reference được review hoặc ghi phép đo thiếu.
- Chọn metrics riêng, minh bạch mẫu số thay cho một điểm “giống95%”. Không có pixel metric nào chứng minh nghiệp vụ/quyền đúng.
- Ship workflow bằng hai PR với base riêng, giữ dirty WIP phân quyền ngoài payload. D6 cho phép merge đúng hai PR sau kiểm source/review/CI; Vercel Git deployment đang disabled và các release workflow chạy thủ công, không gọi deploy trong task này.
- D1–D6 ở proposal là lựa chọn owner; chi tiết phép đo do AI chọn trong phạm vi công cụ, kiểm bằng unit/browser/negative controls và hai reviewer trước bàn giao.

## Slice D7 — CI và audit được publish

POS light CI có12phase theo thứ tự: install → build → unit → tooling → node-tools → browser → ui-tools → ui-remake-selftest → ui-audit-selftest → smoke-discovery → smoke-preflight → smoke. Phase mới tái sử dụng wrapper source/resource/privacy hiện có; public summary chỉ xuất số liệu hữu hạn, không upload report/ảnh/raw log. Các Node test bắt buộc được lấy từ tracked inventory, không chỉ dựa vào exit0 của một lệnh rỗng.

`scripts/project-ui-results.mjs` độc lập với runner đang được đo: đọc regular files mới trong output riêng invocation, chặn symlink/junction/path escape và file quá giới hạn, kiểm source/config/reference/contract/font/runtime/images. Nó phân biệt đúng positive/negative control và lý do FAIL được gieo; expected FAIL của fixture không là appPASS. CI vẫn defer PERMISSION_FULL và UI_AUDIT_APP_ACCEPTANCE; không thêm gate tự nghiệm thu app qua selftest.

| Gói | Hợp đồng D7 |
| --- | --- |
| Remake |11IDs duy nhất,5PASS/6seededFAIL,0ERROR; đủ44PNG+MD/JSON, sourceHEAD/manifest/config/ref/contract và Chromiumchannel đúng invocation |
| Audit calibration |JSON version1/kindui-audit-selftest/status/productAcceptanceNOT_ASSESSED, startedAt/finishedAt; count đúng23,14requiredclasses và16targetChecks=true; sourceHEAD/sáuSHA nguồn, runtime/browser/channel |
| Audit CLI |Options được allowlist; target/viewport matrix không rỗng, stateextends không cycle, chỉ localorigin/mock; process và browser/context luôn cleanup trong finally |
| Audit output |Selftest report tùy chọn dưới artifacts/ui-audit, tên mới, không overwrite, max1MiB. Report app legacy và annotated PNG nằm ui-audit/report.* và out/, bị git-ignore |
| Historical baseline | Giữ 36 key từ d78c929 (Git LF blob2861d0e, raw SHA256bf94db04…); publish bytes CRLF checkout nguồn, raw SHA25679fe315c…/blob51633aa. Hai raw bytes khác line ending, cùng keys; không update hoặc dùng baseline6finding nhánh permission; ledger không thay bằng chứng runtime mới |

Chromium dùng channel `chromium` headless (full binary đã cài với --no-shell), ghi trong report và contractDigest. Approval cũ không có channel phải được duyệt lại, không tự đổi hash. Không thêm dependency hay browser binary thứ hai. UI-audit13state×3viewport có selector/login recipe lấy từ main; ba state tương thích/requiredPIN chưa có source main được ghi ngoài coverage, không copy app WIP.

Trusted CI policy cập nhật đúng canonical Git blobSHA của runner/results/package và helper mới; không hash hàng loạt checkout CRLF. Không thay productionEnabled=false, owner/protection, resource cap5GiB/8GiBRAM/3CPU/1024PID, reserve30GiB hay clock/budget của gate khác. Source/baseline thay đổi sau đo phải kiểm lại phần bị ảnh hưởng.

Reader phân biệt schema OS: remake ghi platform, audit ghi platform+release+arch; expected được đọc độc lập từ runtime chạy CI, không suy từ report. Audit `sourcePreserved` phải true và `errors` phải là mảng rỗng. Integration test đưa report từ Chromium thật qua reader để bắt mismatch producer/consumer.

Operational audit ghi checkpoint `report.md`, finding-array `report.json` và `out/status.json`: expected/attempted/completed, setup failures và trạng thái INCOMPLETE cho tới khi đủ matrix. Navigation/detector/annotation/screenshot/cleanup lỗi phải được ghi, tiếp tục cặp sau khi có thể và exit2 khi thiếu coverage; không nhận phần report cũ thành PASS hoặc cập nhật baseline từ matrix không đầy đủ. Bounded log tail chỉ thuộc devserver do runner tạo để chẩn đoán, không dump biến môi trường.

Vite dev watcher bỏ qua `artifacts/**`, `ui-audit/out/**` và report audit; `optimizeDeps.entries` là `index.html` duy nhất của SPA, không glob mọi HTML fixture. Fixture kiểm đường dẫn cố ý tạo backlink/junction về repo; git-ignore không tự loại nó khỏi watcher hoặc dependency discovery. Hai guard tránh vòng theo junction và HMR từ checkpoint, không bỏ source app khỏi build/test hoặc giảm ma trận/threshold audit. Test Vite thật có backlink, startup/HTTP và kiểm inventory watcher trong thời hạn.
