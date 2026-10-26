# Đối chiếu hình với code — 26/10/2026

Đây là chỉ mục nguồn và kết quả review ngữ nghĩa của 16 hình. [Bộ hình hiện hành](../../figures/README.md) sử dụng main đã push làm nguồn chính; những khác biệt WIP và DB bên dưới vẫn mở. [Handoff sửa hình](../../workflow/tasks/docs-flow-corrections-2026-10-26.md) ghi phiên bản sửa và review cuối của lượt cập nhật.

## Kết quả và lịch sử

Chat chuyên trách đã đối chiếu đủ 8 ERD và 8 luồng: 36 cạnh FK và 54 claim luồng. Tám ERD và F01–F03/F05–F08 khớp source được ghim khi dùng cùng chú thích. F04 có một lỗi nhãn làm nhầm kết quả get với execute. Ba reviewer kiểm chéo đã APPROVE **hồ sơ mô tả kết quả**, trong đó lỗi F04 vẫn mở ở checkpoint docs `27f8cfb`; đó không phải verdict duyệt nguyên bộ hình.

Lượt sửa được chủ dự án đồng ý sau review: F04 đổi điểm rẽ và nhãn cạnh để retry dùng kết quả execute, lookup dùng get; F05 hiện rõ các kết quả đổi PIN; F07 có nhánh bỏ response cũ; F08 hiện rõ ACK/signal không có thứ tự nhận bảo đảm và signal có thể bị bỏ lỡ. Các phần còn lại tiếp tục đọc cùng chú thích và giới hạn nguồn, không coi SVG là mô tả mọi edge case của hệ thống.

| Hồ sơ gốc đóng băng | Mục đích |
| --- | --- |
| [Kết luận từng hình](original/README.md) | Kết luận trước sửa trên docs `27f8cfb`, origin và snapshot WIP |
| [Bảng truy vết](original/traceability.md) | 36 cạnh ERD và 54 claim luồng → file/symbol/dòng; số dòng hình thuộc bản trước sửa |
| [Findings](original/findings.md) | FIN-01, FIN-WIP-02, ID-P1–P5 và đề xuất chưa áp dụng tại thời điểm review |
| [Kiểm chứng và recipe](original/verification.md) | Test mock thực chạy, so body/catalog, giới hạn chưa kiểm |
| [Review ERD](reviewers/financial-cross-erd-v2.md), [review tài chính](reviewers/identity-cross-financial.md), [review phiên/quyền/signal](reviewers/erd-cross-identity-v2.md) | Ba verdict cho candidate manifest SHA256 `13110a1ad65090f34c7f5bf6a650ff6e9efd5a6ae05f6d2779e28695e880cd51` |

Các file gốc/receipt được nhập nguyên byte; [manifest nhập](import-manifest.json) giữ hash và đường dẫn artifact ban đầu. Câu “F04 cần sửa”, “chưa push” hoặc “đề xuất chưa áp dụng” trong hồ sơ gốc mô tả checkpoint trước lượt sửa, không được viết lại để đổi lịch sử. Các link tuyệt đối trong hồ sơ gốc là provenance local, chỉ dùng trên máy còn artifact; khi clone repo nơi khác cần xin bộ evidence được ghim. [Source manifest](source-manifest.json) giữ hash từng file O/W, không chứa source WIP; [candidate manifest gốc](candidate-manifest.json) giữ hash bốn file báo cáo. Không đặt source ứng dụng hoặc credential lên nhánh docs.

<a id="sources"></a>
## Nguồn được phân biệt

| Ký hiệu | Identity | Phạm vi |
| --- | --- | --- |
| O | `origin/main@711a22e71983e3d6aa17799649af05ce4c762555` | Nguồn chính của các hình; đã xác minh remote lúc review và trước sửa |
| W | Local HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e` cộng snapshot WIP | HEAD riêng không nhận diện W; dùng source manifest SHA256 `2929925805096f6dc2873fea2f076e9f84a395e83cb57257f316f1f9bdac2282` |
| S | Staging `ineckiashpwloncxnbqx` | Catalog/function definitions chỉ đọc trong chat review, ngày 26/10; không phải giao dịch thử |
| L | Host `kfqjdfwxhkdwihjobpny.supabase.co` trong cấu hình frontend local đã quan sát | Chưa đọc catalog L hoặc xác minh browser/build/Vercel đang dùng cấu hình đó |

Khi bắt đầu lượt sửa, 544 file checkout đã có hash trong manifest W vẫn khớp snapshot review. Đây là kiểm nguồn không trôi, không phải chạy lại test hoặc kiểm lại DB.

<a id="wip"></a>
## FIN-WIP-02 — Khoảng chờ quyền trước begin

O chụp `captureContinuationGuard()` trước khi đợi authority và kiểm lại sau await; W được review thiếu guard này. Đóng drawer trong lúc authority đang chờ có thể không chặn W tiếp tục tạo attempt khi response hợp lệ về. Guard callback UI chỉ ngăn cập nhật màn cũ; nó không thay guard trước begin. Sau begin, guard coordinator và callback UI vẫn có hiệu lực ở cả O/W; không suy mọi phản hồi muộn ở W đều chạy tiếp.

Căn cứ O: [guard coordinator](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/writeOperationFlow.ts#L44), [thanh toán](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L274), [chọn toàn bộ/một phần](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/features/pos/orderFlow.ts#L358), [rời vòng đời](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/WriteLifecycle.tsx#L20). Căn cứ W là snapshot cùng các path, hash trong source manifest và vị trí trong FIN-WIP-02 của hồ sơ gốc; không tạo link GitHub giả cho code chưa commit.

Chat review đã chạy cùng 12 oracle mock về khoảng chờ authority: O đạt 12/12, W lỗi 12/12. Assertions/fixture giữ nguyên; chỉ hai import của test copy đổi để chạy trên từng snapshot. Có hai lần chuẩn bị harness lỗi trước run chính, không tính là lỗi nghiệp vụ. Không kết luận 12 giao dịch W đều tạo hiệu ứng thành công: ca void dùng đơn open, còn kết luận chung là không bị chặn bằng `WRITE_RESULT_UNKNOWN` như oracle yêu cầu. Lượt sửa docs này không chạy lại test đó; evidence gốc và recipe giữ nguyên. Finding code vẫn mở, chưa refactor hoặc sửa WIP.

<a id="db"></a>
## DB và ACL — giới hạn bắt buộc

[Quan sát cấu hình đã loại secret](runtime-observation.json) phân biệt S với L. Kết quả so body/catalog S không chứng minh DB L giống S, cũng không chứng minh frontend đang chạy/Vercel dùng S. Không đổi `.env.local`, cấu hình MCP, grants, schema hoặc DB để làm hai nguồn giống nhau.

W còn có delta ACL: `permission-read.sql` chỉ revoke SELECT, trong khi [O revoke ALL ở table/column](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-read.sql#L357). Đường RPC trong F08 có thể giống nhau nhưng không suy bề mặt quyền DB của hai recipe giống hoàn toàn. Delta seed `credential_changed` cũng được ghi trong hồ sơ nguồn; không thuộc sửa hình lần này.

Không có runtime PASS mới cho Supabase, concurrency/lock waits, mất ACK thật, subscription delivery, deployment hoặc hardware. P1-03/N4/H1–H4 và các gate backend/deploy vẫn mở. Review và sửa cách mô tả không thay expected hoặc hợp thức hóa khác biệt code.
