# BP4A — full local sau countfix, đề nghị75phút

Ngày23/10/2026, Asia/Bangkok. **CHỜ OWNER DUYỆT, không phải grant chạy.** [Countfix26/26offline](../../implementation-log/permission-breakpoint-review-20261023/bp04a-countfix01-outcome.md) đã có module/collector mới, app vẫn e422150 sạch. Main03 cũ đã hết hạn; chưa có full consumer mới được admit. Không dùng quota cũ hoặc giả bộ còn1 preflight.

## Ngân sách và thời gian cần thêm

Đề nghị **một cửa sổ75phút từ lúc ghi nhận owner trả lời**, không gắn giờ tuyệt đối của lượt cũ; dừng bất kể đã xong hay chưa. Cấp thêm **1 full archive preflight** (lịch sử tối đa3, giữ2FAIL), **1 npm ci invocation**, **1 build**, **1 full unit**. Install/build/unit thực tế trước đây đều0; giữ toàn bộ grant/marker/proof. **0push mọi nhánh,0CI/backend/SQL/DB/Auth/Edge/deploy/cleanup**, kể cả DB SELECT.

| Bước | Cap | Điều kiện đi tiếp |
| --- | ---: | --- |
| R0 consumer mới, tiền kiểm chỉ đọc, control offline phần thay đổi và hai review | ≤25phút | Exact recipe/helper/collector/fact/controls/admission APPROVE trước remote |
| R1 full46archive | ≤4phút | 46SRI/tar/count/bytes đạt;45GET +1retained body được kiểm mới trong phase; storage forecast đạt |
| R2 npm ci + versions/native | child≤8phút, phase≤9phút | Exit0, đúng lock, native probe≤10s và Job release trong cap |
| R3 build | child≤8phút, phase≤9phút | Exit0/release proof |
| R4 full src unit/coverage | child≤8phút, phase≤9phút | Đúng110tracked file, zero fail/pending/todo/retry, lines≥90%, release proof |
| R5 review kết quả/docs | Reserve10phút cuối | Ghi đúng PASS/FAIL/UNKNOWN/NOT_RUN, raw/source hashes |

Tổng worst-case66phút,9phút cho chuyển bước/bất định. Trước R1 phải còn≥41phút (4+9×3+10); tính lại trước mỗi phase. Không admit command mới sauT0+65phút hoặc khi không đủ phase+release+reserve. R0 cho sửa/lặp control offline cần thiết trong25phút, giữ reports/markers và snapshot liên quan; sau R1 bất kỳ FAIL/UNKNOWN/timeout/drift/storage stop đều dừng phụ thuộc, không tự fix/retry phase thật. Nếu R0 chưa đủ review thì dừng trước remote. Không bắt owner duyệt lại sau từng bước PASS trong gói.

## R0 — đóng lỗi có thể kiểm trước

1. Tạo recipe/grant/namespace mới, không sửa/bật lại main03 hoặc reset history. Source pin `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`; Node24.16.0/npm11.13.0 đã có. Không sửa app/lock/config coverage hoặc cài tool/browser/WSL/Docker. Kiểm source sạch, không env thực/credentials trong child, không runner task khác, C/D và retained roots.
2. Consumer mới phải gọi `deriveRegularCountFacts` để dùng enriched46items và cả `assertRegularFileTotal` trên46results, giữ raw total1579/regular expected1577 riêng. Byte total graph212.512.248B giữ nguyên; unknown package không được áp fact7. Fact/helper/collector pins từ countfix và nguyên bản registry facts đều phải khớp.
3. Target `@types/pg` dùng lại body5484B đã giữ, nhưng kiểm lại SRI/bodySHA/path/type/byte/count trong R1 bằng adapter; ghi nguồn retained, không giả HTTP200 mới. Chỉ45item khác GET từ URLs/SRI lock, concurrency≤4, no redirect/retry, request≤15s, từng body≤16MiB, tổng remote body≤32MiB. R1 vẫn là full46verification, không lấy report cũ thay parse source mới. Pg-int8/cache309 reuse chỉ đúng pins/phạm vi đã chứng minh.
4. Để không lặp lỗi mất archive khi COUNT/TAR/SRI fail, thêm lưu **body lỗi đầu tiên** đã nhận đủ và còn trong bound, exclusive namespace,≤16MiB; lưu lockPath/stage/firstFailure/countFailure/raw hash/source/status. Không thêm GET để lấy body, không lưu body của mọi peer abort, không extract payload. Nếu không lưu được thì ghi UNKNOWN và dừng; không đi tiếp. Nếu lỗi HTTP trước body thì giữ status/code đã có, không fetch lại. R0 phải kiểm fake body/count failure + preservation/no-overwrite +cap/abort để không thêm cơ chế chưa review trước remote.
5. Reuse26countfix controls,13transport controls và Job controls cũ chỉ phần logic/hash/runtime không đổi. Kiểm riêng consumer composition45+retained/aggregate và retention mới bằng fake transport/offline fixtures; các controls arithmetic/mock không thay46archive hoặc application PASS. Hai reviewer khác tác giả APPROVE exact recipe và controls trước R1.
6. Mọi marker/stdout/stderr/report/coverage/config/proof phải fresh và exclusive, pin lại trước phase; consumer không đọc stale summary. Native/load probe và Job helper reuse nếu hash không đổi, nhưng mỗi command thật cần proof release riêng. No drift hoặc UNKNOWN release.

## Install/build/unit giữ coverage

Một `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --include=dev --include=optional`, fresh cache/TEMP trênD trong cùng task, clean child env, public npm registry, mock data mode, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`; no-audit/no-fund, HTTP fetch-retries0, fetch-timeout30s, maxsockets4. Cho phép stock npm recovery hữu hạn trong **cùng invocation8phút** (Pacote corruption/ENOENT và Windows bin-link), không coordinator retry. Nếu owner không cho internal recovery thì chưa chạy phương án này. Preflight không seed npm cache, nên npm có thể tải lại toàn Windows graph356package, không chỉ45.

Kiểm versions theo lock và load native Rolldown/LightningCSS bằng probe bounded≤10s tính trong R2. `npm run build` theo scripts hiện tại; unit dùng toàn Vitest src suite110tracked file, explicit config, `--coverage --maxWorkers=1 --no-file-parallelism --retry=0`, JSON/coverage vào namespace mới. So đúng tập110file, total=passed, failed/pending/todo0, từng assertionpassed; linecoverage≥90% trong đúng scope hiện hành. Không grep/focus/skip/nới timeout/threshold. Build chỉ phủ tsconfig hiện tại;3runtimeTS ngoài scope vẫn chưa được chứng minh.

## Dung lượng, mạng và điều kiện dừng

**LỚN HƠN1GB — dự trù1–2GiB đỉnh** cho dependency/cache/temp/build/coverage/log trên ổD thật. Không tạo môi trường thứ hai, không dùng owner node_modules hoặc thay npm hệ thống. Đây là allowance/ước lượng, không quota OS. Node/npm/tar/Job helper đã có; chỉ cài dependency đúng lock.

Trước từng bước lớn và trong lệnh: **C/D≥30GiB free, task tăng≤2GiB từ baseline51.309.130B, retained7roots≤768MiB**; giữ forecast overhead88MiB (logs24+reports32+temp/meta32), mỗi stream≤4MiB. Body lỗi tối đa16MiB tính vào nhóm meta và retained, không loại khỏi guard. Logical bytes không phải allocated disk; free-volume check vẫn bắt buộc, monitor không phải hard OS quota. Không vượt gate để cố hoàn tất.

R1≤32MiB tải vào RAM; archive lỗi đầu tiên có thể giữ thêm≤16MiB trênD, target cũ5,5KB reuse. Npm fresh cache dự kiến50–80MB tarballs theo facts, thêm metadata/recovery; tổng network ước100–200MB, không phải technical cap của stock npm. Regular payload graph212.512.248B; forecast gồm retained hiện tại +regular payload +compressed actual +88MiB và chỉ cho install nếu vẫn≤768MiB. Dự phòng/monitor không bảo đảm mọi write không vượt tức thời; chạm ngưỡng dừng, hỏi dọn đúng temp nếu cần, không tự xóa.

Không full security/backend/hosted gate hoặc main publication trong grant này. PASS local chỉ mở căn cứ cho breakpoint kế tiếp; không hứa main sẵn sàng, không merge/Vercel/DB. Outcome và raw evidence phải được review rồi lưu docs commit local. Kế hoạch này chỉ là đề nghị; owner chưa duyệt thì không sửa recipe hoặc chạy bước nào của nó.
