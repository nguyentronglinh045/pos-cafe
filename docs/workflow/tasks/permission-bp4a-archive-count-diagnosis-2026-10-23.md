# BP4A — đề xuất chẩn đoán chênh lệch 9/7 của @types/pg

Ngày23/10/2026, Asia/Bangkok. **CHỜ OWNER DUYỆT; không phải grant thực thi.** [NEXT01](../../implementation-log/permission-breakpoint-review-20261023/bp04a-next01-outcome.md) đã dừng R1 và dùng2/2 archive attempts. Npm ci/build/unit chưa chạy. Không sửa acceptance hoặc tiếp tục full preflight bằng quyền còn lại của lượt đã dừng.

## Mục tiêu và bằng chứng cần bổ sung

Phân xử metadata `fileCount=9` với parser `regularFiles=7` trên **cùng exact archive khớp SRI lock**. Log hiện tại chứng minh lỗi count, chưa giữ body/header inventory để giải thích chênh lệch. [npm registry contract](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#dist) nói count loại trừ folder; không mặc định đổi sang đếm directory hoặc PAX/GNU headers.

Source `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18` giữ nguyên. URL từ lock tại `node_modules/@types/pg`: `https://registry.npmjs.org/@types/pg/-/pg-8.23.1.tgz`; integrity `sha512-fKVHpikPdg4GKks3JuLEhvwSyvwzF23hnabPy6DD8ljVbC7+6J5dQzdv4arV6jqq57djnMgs1HKBxX4P8aBI3A==`.

## Ngân sách đề nghị

**Một breakpoint chẩn đoán tối đa15phút từ lúc ghi nhận owner trả lời, và không vượt12:54:18 hôm nay.** Chỉ bắt đầu khi còn đủ15phút trước hạn; nếu trả lời quá muộn thì lưu quyết định và dừng, không tự mở thời gian mới. Ghi deadline mới bằng giá trị nhỏ hơn T0+15phút và hạn cũ. Reserve cuối5phút cho review/lưu docs; không admission command mới khi còn dưới5phút.

| Hành động | Trần đề nghị |
| --- | --- |
| Chuẩn bị diagnostic recipe, kiểm offline cần thiết, hai review trước network | Trong7phút đầu; không chỉnh main03/parser/collector admission hiện tại |
| HTTP archive | **Tối đa1 GET đúng URL trên, body≤64KiB, timeout≤15giây, redirect0/retry0**, kể cả lỗi cũng không GET lại |
| Giải nén đọc RAM | gzip output≤1MiB; không extract filesystem hoặc chạy nội dung package |
| Phân tích offline cùng body | Tối đa1 batch≤60giây; giữ output cả mismatch/error, không retry batch để lấy PASS |
| Dung lượng sinh | ≤1MiB tổng receipt/body/inventory/log trên D của task và docs, peakRAM≤8MiB cho diagnostic data; C/D vẫn≥30GiB, giữ budget task/retained cũ |
| Full46 preflight / npm ci / build / app unit / push / CI / backend / DB / deploy / cleanup | **0** |

Đây là thêm đúng1 **diagnostic request**, không reset2 archive attempts cũ, không cấp thêm một full preflight. Dự kiến archive5.484B từ receipt, nhưng bound64KiB là giới hạn chạy; không cài/thay Node/npm/tar/công cụ hoặc browser. Ghi ở namespace mới `evidence/bp4a-countdiag01-*` và raw copy docs; giữ nguyên tất cả markers/receipts cũ.

## Cách làm và tiêu chí kết luận

1. Kiểm pins nguồn/lock/parser cũ, volume C/D, remaining time, absence của namespace mới và không có runner task khác. Dùng Node/npm đã có. Diagnostic recipe và offline controls phải được hai reviewer APPROVE exact hash trước GET; không lấy review của main03 thay cho recipe mới. Không đạt readiness trong7phút thì dừng, chưa GET.
2. GET duy nhất với bounded streaming và abort/time/size caps. Ghi HTTP status, bytes, exact URL, timestamps, SHA256, SHA512/SRI; dùng exclusive files. Không status200/SRI match thì dừng phân tích tar. Giữ body nhỏ và receipt kể cả lỗi trong bound, tuyệt đối không extract hoặc chạy payload.
3. Trên cùng body đã xác minh, chạy parser hiện tại để ghi nguyên lỗi count; dùng chế độ quan sát riêng không cấp admission (gọi parser không truyền expected counts để lấy counters cũng chỉ là diagnostic, không phải PASS thay điều kiện count). Đối chiếu với `node-tar` đang có trong npm bằng list/onentry, không extract: type/name/size và tổng regular/directory/logical entries; ghi warnings/errors. Thêm inventory physical headers bounded để nhận diện PAX/GNU nếu cần. Pin đúng module tham chiếu và giải thích khác nhau giữa physical header/logical entry, không coi chúng là cùng metric.
4. Lưu raw body và hai kết quả cùng SRI để lần sau không phải tải lại; so counts/bytes/names, metadata fact9/19802 đã có. Parser bất đồng, unknown hoặc bất kỳ lỗi an toàn thì ghi rõ và dừng; không nới path/type/checksum/byte guard để đọc tiếp. Một mismatch đã biết không được trình bày như suite application PASS.
5. Hai reviewer khác tác giả kiểm kết luận: nguồn mismatch, giới hạn bằng chứng và disposition đề nghị. Không tự sửa parser/metadata expectation hoặc đổi acceptance trong breakpoint này. Nếu cần sửa, trình owner bản sửa và ngân sách lần sau; không tự chuyển từ chẩn đoán sang cài/build/unit.

## Vì sao cần quyết định mới

[Grant owner hiện tại](../../implementation-log/permission-breakpoint-review-20261023/bp04a-next01-owner-grant.json) quy định sau R1 FAIL/UNKNOWN phải dừng, không tự fix/retry; quota archive đã2/2. Do đó thời gian còn lại không cấp quyền tự tải lại. Cơ sở yêu cầu quyết định là chính grant đã duyệt, không phải npm yêu cầu xin quyền. Quy tắc [AGENTS.md](../../../AGENTS.md) và [workflow](../README.md#review-doc-lap) yêu cầu review độc lập final deliverable; review không thay sự đồng ý mở lượt mới của owner.
