# Chạy và đọc phép đo UI remake

Công cụ v1 so sánh hai trang **local** đã render: normalized reference độc lập và actual UI. Nó báo pixel, anchor, font, token và kiểm responsive có phạm vi; `productAcceptance` luôn là **`NOT_ASSESSED`**. Dùng cùng [quy trình](README.md), [palette](palette.md) và [mẫu nghiệm thu](templates.md#nghiem-thu).

Source: [run.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/run.mjs#L1), [config.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/config.mjs#L1), [metrics.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/metrics.mjs#L1), [capture.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/capture.mjs#L1). Nhánh có thể di chuyển; mỗi lần chạy phải ghi commit/fingerprint cụ thể.

## 1. Chuẩn bị checkout và ngân sách

Chạy lệnh trong worktree **code** có thư mục `ui-remake/`, không phải nhánh `docs`. Không checkout đè thay đổi đang làm. Công cụ dùng Playwright sẵn có qua dependency dự án, font cục bộ và Node; không thêm npm package, không tự tải browser.

Kiểm trước, trên PowerShell:

```powershell
git status --short
git rev-parse HEAD
node --version
npm --version
Get-Volume -DriveLetter C,D | Select-Object DriveLetter,Size,SizeRemaining
npm config get cache
node -p "require('./package-lock.json').packages['node_modules/playwright'].version"
node -p "require('./node_modules/playwright/package.json').version"
node -e "const fs=require('node:fs');const p=require('playwright');console.log(p.chromium.executablePath());console.log(fs.existsSync(p.chromium.executablePath()))"
```

Nếu chưa có dependency, hai lệnh `node` cuối có thể thất bại; đó là thiếu môi trường, không phải kết quả đo UI. Xác định thêm ổ thật chứa npm cache, `PLAYWRIGHT_BROWSERS_PATH` hoặc browser cache và mọi runtime; đo các ổ đó ngoài C/D khi khác. Giữ ≥30 GiB trống trên C và ổ runtime, task tăng ≤20 GiB, một môi trường nặng; pilot đặt ≤0,5 GiB evidence và ≤1 GiB tăng ở đỉnh.

**Chỉ nếu thiếu**, sau khi đã công bố tên/mục đích/nơi cài/ổ thật cùng ước tính tải về, tăng sau cài gồm cache và đỉnh, mới chạy phần tương ứng:

```powershell
npm ci
.\node_modules\.bin\playwright.cmd install chromium
```

Không chạy lại `npm ci` trên môi trường đang dùng chỉ để có vẻ sạch; lệnh này thay dependency tree. Không dùng `npx` kéo thêm package hoặc tải mọi engine. Bản công bố này **không có số đo dung lượng một lượt cài sạch** để áp dụng cho mọi máy: phải ước tính bằng lockfile, cache hiện có và browser đúng phiên bản trước khi chạy. Nếu chưa biết mức tăng tối đa hoặc không giữ được dự trữ thì dừng phần cài và báo phần thiếu. Nếu bất kỳ ước tính hoặc tổng lượt cài vượt 1 GB, thông báo nổi bật **LỚN HƠN 1 GB** kèm số/khoảng; kích thước source/font không phải ước tính cài dependency.

Lần tác giả kiểm công cụ import **`playwright`1.60.0**, cùng phiên bản [lockfile dự án](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/package-lock.json#L831). Khảo sát ban đầu thấy **`@playwright/test`1.62.1** ở checkout dùng chung, nhưng đó không phải module mà runner này import. Báo cáo ghi phiên bản đúng module thực dùng; không suy toàn bộ dependency tree sạch hoặc các phiên bản tương đương. Team vẫn phải chạy lại unit/selftest/calibration trên môi trường của mình. `UI_REMAKE_PLAYWRIGHT_MODULE` cho phép trỏ tường minh tới module đã cài khi cần; ghi phiên bản/đường dẫn thực, không tự giải quyết dependency từ config.

## 2. Kiểm công cụ bằng fixture tổng hợp

```powershell
npm run test:ui-remake
node ui-remake/run.mjs --selftest
# Lựa chọn tương đương dùng config tường minh; chọn output mới mỗi lần:
node ui-remake/run.mjs --config ui-remake/examples/selftest.json --out artifacts/ui-remake/example-<run-id>
```

Selftest có **11 controls**: 5 positive (minimum, phone, tablet, desktop, tiếng Việt dài) và 6 negative (dịch vị trí, sai palette, overlay trong suốt, target nhỏ, sai font, overflow). Selftest PASS nghĩa là từng kết quả đo khớp expectation PASS/FAIL; negative controls phải thực sự FAIL phép đo. Đây là fixture, không phải màn hình thanh toán đã được làm lại hoặc nghiệm thu ứng dụng.

Overlay trong suốt là phản ví dụ quan trọng: pixel diff có thể bằng **0** nhưng control không bấm tới được, nên kiểm responsive phải FAIL. Một điểm số ảnh không thay kiểm tương tác. Selftest hiện được xác minh trên **Chromium**; không suy PASS Firefox/WebKit. `browser` cho phép `chromium` (mặc định), `firefox`, `webkit` nếu engine đó đã có; runner không tự cài.

## 3. Chuẩn bị reference và config thật

V1 không có mode nhận bitmap làm expected trực tiếp. Nếu chỉ có ảnh: giữ raw, dựng normalized HTML độc lập với actual, ghi phần suy đoán và được chủ dự án duyệt; hoặc đánh giá thủ công và ghi fidelity **`NOT_ASSESSED`**. Không lấy actual UI làm reference, không kéo giãn ảnh một viewport thành reference của viewport khác.

Xuất source Stitch và assets về local. Localize font, ảnh, icon và CSS trước: target chỉ nhận `http://localhost`, `http://127.0.0.1` hoặc `http://[::1]`; request HTTP(S) ra ngoài loopback bị chặn khi capture. Đây không phải sandbox cho HTML tùy ý và không bảo đảm chặn WebSocket hay mọi kênh mạng khác; chỉ chạy export/mock đã kiểm nguồn. `designUrl` HTTPS chỉ là metadata truy nguồn, runner không mở nó. URL có username/password bị từ chối.

Đặt bản export, normalized HTML và assets trong `artifacts/stitch/SCREEN/`. Khi cần một static server không thêm dependency, chạy ở terminal riêng:

```powershell
node ui-remake/serve-reference.mjs --root artifacts/stitch/SCREEN --port 4174
```

Mở đúng file như `http://127.0.0.1:4174/normalized.html`; server không liệt kê thư mục. Nó chỉ bind loopback, chặn hidden/traversal/symlink thoát root, chỉ GET/HEAD và asset allowlist, file tối đa16MiB. Đây là server tĩnh, không chạy backend hoặc chuyển đổi Stitch. Nhấn Ctrl+C sau khi đo. Font chuẩn có thể được copy kèm normalized assets để dùng local; ghi file đó trong `referenceFiles`, không gọi CDN khi đo.

Sao chép [screen-remake.template.json](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/examples/screen-remake.template.json#L1) vào một config task mới trong root code. Thay mọi placeholder. Template chỉ minh họa **3 viewports** và đặt ngưỡng pixel/hình học **0**; nó chưa là ma trận responsive hay ngưỡng nghiệm thu production. Dùng schema dưới cùng ma trận trong README.

| Trường | Hợp đồng v1 |
| --- | --- |
| `version`, `kind`, `title` | `1`, `screen-remake`, tên có nghĩa |
| `designUrl` | HTTPS của thiết kế gốc, metadata |
| `actualSourceRoot`, `dataMode`, `serverRecipe` | Root source app khai báo; `mock`; recipe khởi động rõ ràng. Runner không khởi động server app/reference hộ người chạy |
| `clock` | Chuỗi thời điểm ISO cố định cho lần capture |
| `browser` | `chromium` / `firefox` / `webkit`, tùy chọn |
| `referenceFiles` | Danh sách file nguồn/assets/raw/normalized/CSS cần đóng băng, đường dẫn trong root code; không tự khám phá đủ dependency của HTML |
| `referenceApproval` | `by`, `at`, `sourceSha256`, `contractSha256` gắn quyết định duyệt thật, theo bước dưới |
| `defaults`, `cases` | Default và 1–32 case; mỗi case có `id` duy nhất, `viewport`, hai target và phép đo |
| `actual`, `reference` | `{url, ready, steps?}`; `ready` phải tới đúng một element visible; actual/reference không được cùng URL |
| `steps` | Tối đa 50 bước/target: `{action, selector, value?}`; `click`, `fill` (value chuỗi), `waitFor` (visible), `scrollIntoView` |
| `reference.normalizationCss` | File CSS chỉ áp vào reference, phải nằm trong `referenceFiles`; actual normalization bị từ chối |
| `anchors` | 1–64 cặp `{id, actual, reference}`; CSS selector hoặc `@name` tương đương `data-testid="name"` |
| `criticalSelectors` | 1–64 controls `{id, selector, reference?}`; reference selector mặc định dùng `selector` |
| `thresholds` | Bắt buộc cả `channelThreshold`, `maxDiffRatio`, `geometryTolerancePx`, `minTargetPx` |
| `regions` | Tùy chọn: `{id,x,y,width,height,maxDiffRatio}`, tọa độ nguyên trong ảnh, ratio gate riêng |

`id` dùng chữ/số, `_`, `-`, bắt đầu bằng chữ/số, tối đa 64 ký tự. Viewport nguyên CSS px, width ≥568, height ≥320, width > height. `channelThreshold` nguyên 0–255; `maxDiffRatio` 0–1; `geometryTolerancePx` 0–100; `minTargetPx` 1–200. Không coi miền giá trị hợp lệ là lựa chọn ngưỡng được duyệt. `selftestExpectation` bị cấm trong `screen-remake`.

`defaults` merge nông vào case; chỉ `thresholds` merge theo trường. Nếu override `actual`/`reference` trong case, khai báo lại trọn target (`url`, `ready`, `steps` cần thiết); không trông chờ merge từng bước. Selector anchor/critical phải khớp đúng **một** element; mất/ambiguous selector là lỗi, không tự giảm coverage. Các nội dung này được kiểm ở [config.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/config.mjs#L31).

## 4. Calibration, phê duyệt và chạy

1. Xác nhận normalized reference độc lập, source/assets/font/token đầy đủ, state đúng. Viết expected từ yêu cầu trước khi đo actual.
2. Chọn anchor theo cấu trúc và thao tác quan trọng; thêm vùng trọng yếu để một nút/giá trị nhỏ không bị chìm trong tổng diện tích. Chốt viewport/state và nội dung biên cần phủ.
3. Calibration trên môi trường sẽ dùng: lặp capture cùng nguồn để thấy nhiễu, rồi thử thay đổi có chủ đích (dịch chuyển, sai màu/font, target bị che/nhỏ, overflow). Ghi mức thay đổi phải phát hiện, kết quả và lý do chọn ngưỡng. Không chọn ngưỡng để hợp thức hóa actual.
4. Khởi động local reference server và app mock theo recipe; kiểm người vận hành đã gắn đúng source với server. Ghi lệnh/cwd/port/commit và cách xác minh. Runner không chứng thực server thật đang phục vụ source đã khai báo.
5. In kế hoạch và hash, chưa chạy browser capture:

```powershell
node ui-remake/run.mjs --config ui-remake/task-<id>.json --plan
```

Chủ dự án duyệt normalized reference, deviations, threshold/cases/environment của kế hoạch. Sau xác nhận thật, điền `referenceApproval`:

```json
{
  "by": "<người duyệt, có nguồn quyết định>",
  "at": "<thời điểm ISO>",
  "sourceSha256": "<referenceSourceSha256 từ --plan>",
  "contractSha256": "<contractSha256 từ --plan>"
}
```

`sourceSha256` ràng buộc reference files cùng palette/font; `contractSha256` ràng buộc hợp đồng đo gồm các case/ngưỡng/môi trường cấu hình. Hash là định danh nội dung, không phải chữ ký chứng minh người đó đã duyệt: lưu nguồn xác nhận trong hồ sơ docs. Thay source hoặc hợp đồng đã duyệt phải tạo quyết định mới trước phần phụ thuộc; không tự chép hash mới vào approval cũ.

```powershell
node ui-remake/run.mjs --config ui-remake/task-<id>.json --out artifacts/ui-remake/<task-id>-<run-id>
```

Output phải nằm trong `artifacts/ui-remake/` và **chưa tồn tại**; runner không ghi đè. Không có lệnh update reference/baseline. Giữ output cũ cho đến khi được phép dọn; chọn thư mục mới cho mỗi lần chạy.

<a id="capture"></a>
## 5. Capture và cách tính

Mỗi side/case dùng browser context mới: đúng viewport, **DPR 1**, `vi-VN`, `Asia/Ho_Chi_Minh`, light scheme, reduced motion, service workers bị chặn. `Date` được cố định theo `clock`; dữ liệu và hành vi theo timer vẫn cần fixture ổn định. Runner chờ steps/readiness, `document.fonts.ready`, ảnh decode, tắt CSS animation/transition/caret rồi chờ frame. Hai lần chụp PNG viewport liên tiếp phải giống byte; khác nhau báo `UNSTABLE_CAPTURE`, không biến thành thiết kế sai. Không chụp full-page trong v1. Nguồn: [run.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/run.mjs#L1), [stabilizePage](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/capture.mjs#L204).

| Phép đo | Ý nghĩa và điều kiện đạt |
| --- | --- |
| Pixel | Một pixel khác nếu **bất kỳ** kênh RGBA có trị tuyệt đối chênh lệch `> channelThreshold`; `diffRatio = số pixel khác / tổng pixel`; đạt khi `≤ maxDiffRatio` và mọi region đạt ngưỡng riêng |
| Geometry | So `x,y,width,height` theo CSS px của mỗi anchor; từng chênh lệch phải `≤ geometryTolerancePx`; thiếu/thừa anchor FAIL |
| Anchor styles | So chính xác `fontFamily,fontSize,fontWeight,lineHeight,color,backgroundColor`; tolerance hình học không miễn sai style |
| Token | Đủ 22 CSS variables của palette và giá trị màu bằng chuẩn sau canonicalize; không chứng minh mọi element dùng đúng token |
| Font | Có face Be Vietnam Pro đã khai báo/tải và family đầu tiên tại mọi anchor đúng tên; không chứng minh mọi glyph/element của trang đều dùng font này |
| Scoped responsive | Horizontal overflow document ≤1 CSS px; controls đã khai báo đủ size `minTargetPx`, visible, cuộn tới được và center hit-test tới control/descendant |

Region dùng cùng channel threshold, có ratio gate độc lập; global PASS vẫn FAIL nếu một region FAIL. `diffRatio` **không là phần trăm chính xác thiết kế**; v1 không có SSIM, điểm “95% giống”, perceptual score hoặc masks. Xem công thức tại [metrics.mjs](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/metrics.mjs#L70).

Responsive helper chỉ đo controls được chọn và trang top-level, kiểm hit tại tâm sau scroll rồi khôi phục vị trí cuộn. Nó không chứng minh toàn bộ vùng nút dùng được, keyboard/focus, mọi clipping/scroll container, iframe, contrast, ngữ nghĩa accessibility hay nghiệp vụ. Phải kiểm thủ công và chạy rendered UI audit theo README. Nguồn: [observePage](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/capture.mjs#L44).

## 6. Budget, output và provenance

Giới hạn đầu vào: 32 cases, tối đa 64 anchors và 64 critical controls/case, tối đa **16.777.216 pixels/ảnh**. Tổng ước tính bảo thủ `Σ(width × height × 24 bytes)` phải **≤512 MiB**; file xuất thực cũng bị chặn ở 512 MiB. Đây là giới hạn image/output của runner, không phải quota bộ nhớ/ổ đĩa toàn task hoặc bảo đảm peak ≤1 GiB. Nếu ma trận vượt giới hạn, chia thành config/run tường minh, giữ đủ coverage và tổng ngân sách đã chốt. [Nguồn giới hạn](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/config.mjs#L6).

Run thành công xuất `report.json`, `report.md` và bốn ảnh/case: `<id>-reference.png`, `<id>-actual.png`, `<id>-diff.png`, `<id>-overlay.png`. Case lỗi có thể chưa có ảnh; đọc `error` trong JSON thay vì nhận thiếu ảnh là PASS. Báo cáo ghi config/reference hashes, manifests source công cụ và source app khai báo, Node/OS/browser/engine/locale/timezone/DPR/clock, thời gian, thresholds, từng kết quả và số bytes artifact.

Manifest source đọc file Git tracked + untracked không bị ignore, cùng HEAD; file tham chiếu được hash riêng. Runner kiểm source công cụ, source app khai báo và reference trước/sau để phát hiện drift. Nó không lưu hộ toàn bộ source snapshot và không chứng thực dev server/source binding; operator vẫn phải lưu candidate khôi phục được và bằng chứng server đúng nguồn. Không thay file giữa lúc đo. [Nguồn manifest](https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-code/ui-remake/run.mjs#L35).

Exit **0**: toàn bộ phép đo app PASS, hoặc selftest khớp mọi expectation; **1**: kết quả không đạt/lỗi capture trong run; **2**: bị chặn trước run (config, approval, path, thiếu điều kiện). Luôn đọc report/console, không quy mọi exit khác 0 thành một loại lỗi. Dù exit 0, gate audit/logic/nghiệp vụ/quyền/review và nghiệm thu chủ dự án vẫn chưa được runner đánh giá.

Nếu checkout không có `ui-audit/`/scripts bắt buộc: ghi `NOT_RUN` và chặn nghiệm thu sản phẩm, không coi runner này thay thế. Khi có, phải `ui-audit:selftest` đúng 23 findings + `selftest OK`, rồi audit, đọc report và xem ảnh/phân loại kể cả warning. Không tự cập nhật audit baseline.

Đo lại ổ Windows ở checkpoint/sau chạy, đóng browser/server của task khi hết nhu cầu. Đề xuất cleanup đúng nhóm artifact tái tạo được kèm đường dẫn, logical/allocated size và tác động; xin phép trước khi xóa. Không xóa reference gốc, đầu ra cuối hoặc evidence bắt buộc như temp. Ghi kết quả theo [mẫu](templates.md#nghiem-thu), chỉ hoàn tất sau review độc lập đúng candidate và các gate bắt buộc thực đạt.
