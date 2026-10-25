# BP4 — môi trường đúng lock trước khi chạy tiếp

Ngày 23/10/2026, Asia/Bangkok. Trạng thái: **đã khảo sát; phần cài và chạy kiểm tra đang chờ owner chọn**. Code vẫn `e42215044b4faf7e90f787ae8e975937ad3e4479`, sạch. User yêu cầu tiếp BP4 theo breakpoint, giữ coverage và đợi quyết định. BP3 đã đóng ở source/kiểm nhẹ; không kéo ngân sách hoặc hạn 90 phút của BP3 sang BP4. Không có publication, CI, backend hay DB mới trong bước khảo sát này.

## Phục hồi và dữ kiện hiện hành

Checkout task và operations/evidence local ban đầu không còn tại đường dẫn cũ. Đã tìm thấy đúng một mục `pos-cafe-permission-timeonly-20261022` từ `D:/Workspace` trong Recycle Bin. Owner trả lời `call_22d0d089d59943ce876be5140ea1615e`: cho phép khôi phục đúng thư mục task. Đã Restore về cùng ổ D, xác minh HEAD sạch, 7 source pins và TAP/stderr gốc của 955 Node checks khớp. [Receipt phục hồi](bp04-restoration.json). Không coi việc khôi phục là chạy lại test hoặc thu hồi dung lượng.

Restore cả thư mục cũng đưa `temp/night-node06` trở lại. Hai junction `docs-link`/`docs-alias` trong fixture làm publication admission từ chối LINK. Quyền xóa riêng fixture đã có; exec policy từng chặn cả thao tác xóa và gỡ junction trước khi process bắt đầu, nên không tự thử lại hoặc hỏi quyền xóa lặp. Khi cần publication, owner có thể tự xóa **chỉ** `D:/Workspace/pos-cafe-permission-timeonly-20261022/temp/night-node06`; việc này không chặn kiểm local trước mắt. Không đổi allowlist/retained roots để giấu junction.

Dependency trong owner checkout khác lock: Vitest 4.1.10/4.1.11, Vite 8.2.1/8.0.16, SDK 2.112.3/2.108.1 và Playwright test 1.62.1/1.60.0 (actual/expected). Candidate chưa có node_modules. Không dùng owner node_modules làm locked evidence.

[Package facts](bp04-package-size-facts01.json): lock có 382 package paths, Windows x64 subset 356. Cache C có 309 archive đúng SRI, 42.450.298 byte nén/205.602.781 byte nội dung. 47 package thiếu cache:46 có metadata tổng 6.906.281 byte/1.579 file; HEAD không trả Content-Length. [pg-int8 fact](bp04-pg-int8-size-fact01.json) bổ sung gói còn thiếu metadata size: archive 1.508 byte, 4 file/3.186 byte nội dung, SRI khớp; chỉ đọc RAM, không cài. Tổng regular payload dự kiến của subset là 212.512.248 byte, chưa gồm allocation/cache/temp/build/report. Win subset không có hasInstallScript theo lock; hai fsevents có script thuộc Darwin.

## BP4A được đề xuất để owner chọn

**Một lượt local, tối đa 60 phút từ lúc coordinator ghi nhận trả lời cấp quyền (recordedAtUtc, không nhận là giờ click chính xác)**, rồi dừng ở kết quả/review. Không push/CI/backend/SQL/Auth/Edge/Supabase/Vercel. Không sửa source hoặc lock trong lượt này. Nếu phát hiện cần sửa, ghi lỗi và trình slice sửa riêng.

1. Tiền kiểm source sạch, lock hash, disk C/D, kích thước retained, env/config và recipe. Giữ evidence955Node cũ đúng source; không chạy lại để tăng số PASS. Không đọc hoặc dùng credential DB từ env. Child env được giới hạn; unit dùng mock, không có .env thực trong candidate.
2. Một lượt kiểm dung lượng archive còn thiếu: đọc đúng các URL/SRI trong lock, concurrency≤4, tổng tải≤32MiB, từng archive≤16MiB, gunzip từng archive≤32MiB; tính actual compressed/unpacked size và kiểm path/header trước cài. Không extract code hoặc chạy script ở bước này. Sai SRI, vượt bound, thiếu dữ kiện hay lỗi mạng: dừng, không retry. Fact pg-int8 đã có được giữ; không cần đọc lại gói đó. Đây là bước admission còn thiếu, **chưa được thực hiện** cho46archive còn lại.
3. Chỉ sau admission kích thước đạt: tối đa **1 lần npm ci** đúng lock tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/code/node_modules`. Cache riêng `D:/Workspace/pos-cafe-permission-timeonly-20261022/npm-cache-bp4`, cùng ổ D. Dùng `--ignore-scripts --no-audit --no-fund --prefer-offline`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`; public registry, config task rỗng để không dùng registry/credential riêng của owner. Không cài browser/WSL/Docker. Không copy hoặc link owner node_modules. Cache C được đọc để ước lượng; cache mới trên D dự kiến tải lại các tarball đúng lock để giữ ownership rõ ràng.
4. Tối đa **1 build** (`npm run build`) và **1 lượt đầy đủ unit/coverage src** bằng flags CI: `vitest run --coverage --maxWorkers=1 --no-file-parallelism --retry=0`, JSON output. Giữ 110 src test files theo config, coverage lines ≥90%, không grep/skip/thay threshold/config để xanh. Build và unit mỗi bước có cap 8 phút trong 60 phút tổng; FAIL/UNKNOWN dừng phần phụ thuộc, không tự chạy lại.
5. Lưu source/lock/dependency versions, command/exit/timestamps/counts/coverage/log hashes và disk trước/sau; kiểm source không đổi, hai review độc lập source/operations, rồi kết thúc BP4A. Không nhận local result thành own-source CI hoặc runtime PASS.

Theo [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), install dùng lock và từ chối mismatch thay vì sửa lock. `--ignore-scripts` chỉ áp cho lifecycle install; build/unit được gọi rõ, không bỏ test. Cách dùng cache và [prefer-offline](https://docs.npmjs.com/cli/v11/using-npm/config/#prefer-offline) không thay version/SRI. Recipe thực thi phải được review trước khi chạy; tài liệu này không tuyên bố đã bật controller/quota.

### Dung lượng và điểm dừng

**LỚN HƠN 1 GB:** dự trù bảo thủ **1–2GiB đỉnh** cho dependencies/cache/temp/build/coverage/log, trong tổng task 20GiB hiện hành. Đây là khoảng kế hoạch, chưa phải quota filesystem hay upper bound đã kiểm đủ; chỉ admit install sau bước archive ở trên. Download dự kiến khoảng 50–70MB cho cache mới và tối đa 32MiB cho preflight còn thiếu; cần cập nhật bằng actual archive facts trước install. Giữ tối thiểu 30GiB trống trên C/D, theo dõi kích thước trong lượt chạy và dừng ghi khi chạm ngân sách; không hứa monitor là quota OS không thể vượt.

Retained roots của packet05 hiện đo 332.987.959 byte (bỏ qua link **chỉ để thống kê**, không nhận admission PASS), dưới 768MiB. Dependencies/cache/report mới phải tính tiếp vào ngân sách; không bỏ root hoặc nới guard. C khoảng 192,4GB và D 98,5GB trống tại khảo sát. Nếu không giữ được retained/storage bound thì dừng và trình nhóm temp có thể dọn, không tự xóa hoặc chuyển chỗ để né đo.

## Phạm vi chưa được chứng minh

- Build hiện chỉ typecheck src và config được tsconfig include; không typecheck ba file runtime TS mới trong tests/contracts và tests/supabase. BP4A build PASS không thay kiểm tra các file đó. Scoped compile/import recipe cho chúng cần được chuẩn bị và phân loại baseline/new diagnostics trước backend; không tạo gate giả từ lỗi config/compiler không tương thích.
- TC45/46, HTTP/Storage thật, browser TC47, fault/TTL 59/60/61 và cleanup raw orphan vẫn NOT_RUN. Timeout T09 30s/browser 45s/helper 180s+45s không đổi; khả năng fit chưa đo.
- Full gate 35 stage/760 required và 12 PIN obligations+D19/R0/R1 vẫn mở. Cùng-source 955 Node/BP3 chỉ giữ đúng phạm vi đã kiểm; CI 4f không áp cho e422.
- Bản thân CI18 hiện hữu chạy install, Chromium, Edge resolver, **PostgreSQL16 synthetic trên runner**, mock UI và các phase còn lại: [workflow](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/.github/workflows/ci.yml:20), [phase commands](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/project-ci.mjs:294). Không gọi candidate CI là bước không chạy DB; nó không truy cập DB gốc/staging nhưng vẫn có DB synthetic.

## BP4B sau khi đọc kết quả BP4A

Chỉ là đề xuất, chưa cấp quyền: một candidate publication + một automatic CI18, heavy0, không PR/main/Vercel/hosted DB. Cần owner receipt và deadline mới; V4 successor độc quyền của phase03 CLOSED, giữ lifetime 7 publication/7 CI/5 heavy/10 review và pending[]. Reserve strict hơn 42 phút, một pending intent, không retry cùng nguồn. Packet05/settlerCI03 pin4f/run39811728040 nên phải rebind source/packet/reviews/reservation mới, không chạy script cũ nguyên trạng.

Trước publication cần fresh remote refs/main ancestry, active candidate runs và backend repository-wide đủ pagination/statuses, prior reclaim, junction cleanup, actual storage/source pins và hai reviewer APPROVE. Không fetch/run remote trong BP4A để thay claim. Các gate này chưa đạt; chưa hứa main sẵn sàng. DB gốc `kfqjdfwxhkdwihjobpny` vẫn cấm truy cập; staging `ineckiashpwloncxnbqx` không thuộc BP4A/B.

Lựa chọn trình owner: **BP4A local 60 phút như trên (khuyến nghị)**; hoặc chỉ giữ khảo sát và chưa cài/chạy. Quyết định còn chờ phải được ghi cùng receipt; im lặng không mở quyền thực thi. Hai reviewer đang review bản đề xuất này, không phải tự cấp ngân sách.
