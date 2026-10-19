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
