# COUNTDIAG02 — đã giải thích chênh lệch9/7 trên exact archive

Ngày23/10/2026, Asia/Bangkok. **Chẩn đoán hoàn tất: 7file thường +2directory =9entry; không cấp application/install admission.** Lỗi ở hợp đồng đối chiếu count của tiền kiểm, chưa phải kết quả test phân quyền.

## Quyền và thời gian

Owner tại `request_user_input_async call_1a52e7704f6b48f0abcf59b40bccf772 item0` duyệt15phút dùng recipe đã sẵn, theo [phần cuối outcome01](bp04a-countdiag01-outcome.md). [Grant02](bp04a-countdiag02-owner-grant.json) ghi nhận **13:55:49**, readiness14:04:34, last execution admission14:05:49, hard stop **14:10:49**. Grant mới thay mốc13:56:54 cũ, giữ quota/caps/exclusions và lịch sử.

Chỉ đổi binding grant/time/namespace/report-path trên bản đã review; không đổi logic fetch/parse hoặc acceptance. Recipe02 SHA256 `e2c1aadf6da3219131a4c4c2ea8586c0f2f41c4a36a747daf352a611be8e8dbd`; hai reviewer khác tác giả APPROVE exact diff/grant trước [admission](bp04a-countdiag02-admission.json) **13:58:44.365**. Controls02 cũ chỉ reuse cho logic/pins không đổi; wrapper02 có syntax check và source review, không nhận controls cũ thành wrapper execution PASS.

[Receipt thật](bp04a-countdiag02.json) **13:58:44.678–13:58:45.158**, exit0: một GET HTTP200,5.484B, không retry/redirect/truncate. Từ T0 đến hoàn tất chẩn đoán khoảng2phút56giây; network+analysis ghi nhận0,480giây. Không dùng thời gian còn lại để chạy bước chưa được cấp.

## Kết quả trên cùng body

Archive giữ nguyên tại [raw body](bp04a-countdiag02.tgz), SHA256 `f8e5fab1d222a3475d6c481ae85446d165b28f24f2ce05b170e7edc880b34ddc`. SHA512/SRI khớp exact lock của `@types/pg@8.23.1` trong source sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`.

| Quan sát | Parser hiện tại | node-tar7.5.13 tham chiếu |
| --- | ---: | ---: |
| Regular files | 7 | 7 |
| Regular payload bytes | 19.802 | 19.802 |
| Tổng entries | 9 physical headers | 9 logical entries |
| Directory | Không có counter riêng; phần chênh2entry | 2: `pg/`, `pg/lib/`, size0 |
| Warnings tham chiếu | Không áp dụng | 0 |

Inventory tham chiếu liệt kê đúng7file: LICENSE, README.md, index.d.mts, index.d.ts, package.json, lib/connection-parameters.d.ts, lib/type-overrides.d.ts dưới root `pg/`. Tar đã inflate27.648B, trong cap1MiB; chỉ list, không extract hoặc chạy payload. Gọi parser cũ với expectedBytes19802/expectedFiles9 vẫn ghi **`BP4_COUNTS_FILES expected9 actual7`**, không sửa hoặc waive guard để nhận PASS.

Mã thực thi [analyzeArchive](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-countdiag02.mjs:35) thực hiện SRI, parser cũ, diagnostic counters không cấp admission, rồi parser tham chiếu trên cùng bounded body. Các module reference được pin; actual receipt giữ đầy đủ hashes và entry types. Một actual analysis batch đã dùng; reviewer sau đó chỉ đọc/hash, không parse lại.

## Nguyên nhân và giới hạn kết luận

Expected9 đến từ metadata fact registry cũ `fileCount=9`; collector so nó với **regularFiles7** của parser. Trên exact archive này,9 trùng tổng7file+2directory;19.802byte cũng khớp. Vì vậy guard dừng do **so hai số đếm khác nhau trong dữ liệu thực tế**, không phải HTTP lỗi, SRI sai hay body bị tải thiếu trong lượt này.

[npm registry contract](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#dist) mô tả fileCount loại trừ folder, nên metadata của package này vẫn có mâu thuẫn với định nghĩa được công bố. Kết quả quan sát không chứng minh thuật toán publisher tạo9, không cho phép suy mọi metadata fileCount đều tính directory, không tự đổi comparator sang tổng physical headers (PAX/GNU cũng có thể làm lệch tổng đó). Không gán ngược kết luận cho FAIL01 cũ không giữ body.

Đã phân xử được nghi vấn parser làm mất hai file: hai reader độc lập đều thấy7file và hai mục còn lại được reference xác định là directory. SRI chứng minh raw body giữ lại đúng bytes mà lock yêu cầu. Điều này không chứng minh ứng dụng/phân quyền đúng hoặc registry đã sửa metadata.

## Trạng thái và bằng chứng

- Diagnostic GET **1/1**, actual analysis1/1 đã dùng; full archive preflight vẫn2/2 từ trước. Không chạy lại46archive; install/native/build/full unit/CI/backend/DB/deploy đều NOT_RUN trong lượt này. Main chưa được cập nhật bởi lượt này.
- Source/lock và sáu phase03 ledger hashes giữ nguyên. [Snapshot sau chạy](bp04a-countdiag02-post-observation.json) ghi process release/volumes và absence của dependencies/build/coverage; đây là quan sát, không quota OS. Không cleanup; giữ archive nhỏ để lần sau không tải lại.
- [Raw-copy manifest](bp04a-countdiag02-manifest.json) pin7file receipt/grant/admission/snapshots/marker/body. Wrapper01 và reports01/02 trước vẫn giữ. Coverage/acceptance/gate phát hành giữ nguyên;110file unit và full permission gate chưa được chứng minh bởi chẩn đoán này.

## Bước sửa đề nghị — CHỜ OWNER, chưa thực thi

Đề nghị breakpoint **tối đa30phút mới từ lúc ghi nhận owner duyệt**, dành5phút cuối review/lưu docs. Chỉ sửa tooling/facts derived trong namespace mới và kiểm offline archive đã giữ + negative controls liên quan; **0network,0full46preflight,0install/build/appunit/push/CI/backend/DB/deploy/cleanup**. Không đặt cap chuẩn bị7phút cho phần còn phải viết; dừng toàn lượt khi hết30phút hoặc gặp FAIL/UNKNOWN. Hai review exact candidate trước bàn giao, chưa mở lượt chạy thật.

Hướng sửa cụ thể: giữ metadata gốc `fileCount=9` và nguồn/hash, thêm riêng `expectedRegularFiles=7` cho đúng package/version/SRI/bodySHA đã được hai parser xác nhận. Chỉ áp dụng fact theo exact SRI, không quy đổi mọi fileCount thành entryCount, không hardcode “trừ2” hoặc tắt count check. Parser/path/type/checksum/SRI/byte guards giữ nguyên; equality regular count tiếp tục kiểm với fact7 được chứng thực. Nếu SRI/version/body khác thì override không được áp dụng và phải dừng. Review phải đánh giá rõ đây là sửa binding metric trên inventory đã chứng minh, không phải nới acceptance nghiệp vụ.

Kiểm offline phần ảnh hưởng: exact archive phải giữ raw metadata9 nhưng đối chiếu regular7 đúng; sai SRI/version không được dùng fact; count bất đồng giữa parser/fact vẫn FAIL; phân biệt7file+2directory với7file+2PAX để không lấy tổng headers làm countfile; giữ negative path/type/SRI. Không rerun hoặc nhận955Node/110unit là đã chạy. Nếu xuất hiện case khác cần đổi acceptance hoặc thêm ngoại lệ thì dừng hỏi owner, không tự tổng quát hóa.

Phương án giữ nguyên comparator9==regular7 sẽ tiếp tục chặn archive này; phương án nâng package/đổi lock làm thay đổi source cần đánh giá lại gates. Đề nghị ưu tiên fact regular theo SRI vì đã có exact body/inventory và không cần tải lại. Full46preflight/cài/build/unit cần kế hoạch/ngân sách riêng sau khi sửa được review; không hứa main đã sẵn sàng.

Walkthrough đã cung cấp: owner grant → binding diff/admission → raw SRI → hai counters/inventory → nguyên nhân comparator → đề nghị fact riêng. Chưa nhận owner nghiệm thu hoặc cho sửa. Hai review cuối outcome/proposal được ghi riêng trước bàn giao.
