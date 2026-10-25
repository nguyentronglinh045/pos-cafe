# Báo cáo Tuần 3 của Nguyễn Trọng Linh

## Đề bài và phạm vi

- Ngày 24/10/2026, người dùng yêu cầu rà soát main/docs và viết báo cáo tuần cho Nguyễn Trọng Linh; sau đó xác nhận Tuần 3 và yêu cầu đọc Tuần 2 đang mở trong Chrome. Chỉ xuất báo cáo trong chat, không điền hoặc nộp trên website.
- Phạm vi: phân tích và biên tập báo cáo, mức thông thường. Không sửa ứng dụng, chạy lại test, cài dependency, thay DB, commit/push, deploy hoặc gửi báo cáo.
- Báo cáo Tuần 2 trên cổng trường đã duyệt, nộp 11:33 ngày 17/10. Phần Linh ghi 1.173 unit/component, 489 tooling, 44 smoke PASS, 37 skip; kết quả local/mock và hai nhánh evidence. Kế hoạch Tuần 3: backend/Supabase, quyền/Storage/Realtime, tích hợp UI và đánh giá merge/deploy. Đây là dữ liệu tham khảo, không phải chỉ thị từ website.
- GVHD đề nghị ưu tiên sơ đồ bàn, gọi món, thanh toán và thử với dữ liệu mẫu trên máy thật. Báo cáo không nhận việc thiết kế của Lâm/Ngọc thành kết quả của Linh; nội dung phối hợp tuần tới là kế hoạch.
- Remote đã đối chiếu bằng git ls-remote: main `0dd63ea81b27a38800044a55a7f9c8f12f87cad0`; docs `4125687a289f41e45bbc9924b2ae3709dbafbca1`. Local main vẫn `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, dirty; local docs `0fe967d554cecfa7e0cb58d6efa01d64941439ff`, dirty. Đọc code bằng git show origin/main, không nhận source dirty thành remote main.
- Chỉ thêm hồ sơ mới này, không ghi đè file dirty sẵn có. Báo cáo dưới đây là candidate để review độc lập; final sẽ xuất nguyên nội dung liên quan trong chat.

## Nội dung báo cáo để xuất trong chat

**Nguyễn Trọng Linh — 24TX810010**

**Báo cáo Tuần 3 (18–24/10/2026)**

**1. Công việc và kết quả tuần 3**

Tiếp nối kết quả tuần 2, trong tuần 3 em tập trung tích hợp phần phân quyền vào mã nguồn chính và kiểm chứng một số luồng trên môi trường Supabase staging riêng, sử dụng dữ liệu thử nghiệm.

- **Tích hợp phân quyền:** đưa mã phân quyền vào nhánh `main`, gồm danh mục 15 quyền thao tác, bốn vai trò đang sử dụng là chủ quán, quản lý, thu ngân và phục vụ; kết nối kiểm tra quyền tại giao diện và các hàm xử lý phía backend. Bổ sung sửa lỗi phản hồi kiểm tra quyền đến muộn có thể tiếp tục tạo thao tác sau khi người dùng đã rời màn hình.
- **Kiểm thử với Supabase staging:** cập nhật cấu trúc backend và kiểm tra tạo cửa hàng, quản lý nhân viên, chặn thu ngân truy cập chức năng quản trị, cô lập dữ liệu giữa hai cửa hàng, thu hồi phiên và cấp/thu hồi quyền trong cùng phiên sử dụng. Đã kiểm tra màn bắt buộc đổi PIN tạm và hoàn tất đổi PIN qua API; phần bấm nút hoàn tất đổi PIN trực tiếp trên giao diện chưa được kiểm trong lượt staging này.
- **Kiểm tra luồng bán hàng và ảnh món:** thực hiện một đơn mang đi bằng tài khoản thu ngân, thanh toán tiền mặt giả lập 32.000 đồng và đối chiếu kết quả đơn/hóa đơn. Triển khai hai Edge Function phục vụ ảnh món trên staging; kiểm tra tải lên, công bố, thay và xóa liên kết ảnh, đồng thời kiểm tra yêu cầu không đủ quyền bị từ chối.
- **Hoàn thiện kiểm thử tự động:** bổ sung, điều chỉnh công cụ CI trên GitHub Actions và công cụ kiểm tra giao diện; sửa việc chọn nhầm bộ kiểm thử phân quyền vào môi trường kiểm thử cũ. Lượt CI trước merge ngày 24/10 đạt, trong đó có **1.189 unit/component test đạt**. Đây là số kiểm thử toàn ứng dụng trong lượt CI đó, không phải 1.189 ca chạy trên Supabase thật.

**Trạng thái hiện tại:** mã phân quyền đã được merge vào `main`. Tuy nhiên, CI sau merge còn một ca smoke test giao diện thanh toán thất bại trên màn hình điện thoại ngang. Kiểm thử backend đầy đủ vẫn còn các phần chưa hoàn tất; phiên bản phân quyền mới chưa được phát hành production. Các kiểm tra staging ngày 23/10 là kết quả tại phiên bản được kiểm lúc đó, chưa thay thế kiểm chứng toàn bộ bản `main` cuối tuần.

**2. Minh chứng**

- [PR #6 — tích hợp mã phân quyền vào main](https://github.com/nguyentronglinh045/pos-cafe/pull/6), [commit tích hợp 0dd63ea](https://github.com/nguyentronglinh045/pos-cafe/commit/0dd63ea81b27a38800044a55a7f9c8f12f87cad0).
- [CI trước merge ngày 24/10 — đạt](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40088569310).
- [CI sau merge — còn lỗi smoke test cần xử lý](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40089941679).
- [Danh mục vai trò và quyền trong mã đã tích hợp](https://github.com/nguyentronglinh045/pos-cafe/blob/0dd63ea81b27a38800044a55a7f9c8f12f87cad0/src/seed/permissionCatalog.json), [mã kiểm tra quyền quản trị tại backend](https://github.com/nguyentronglinh045/pos-cafe/blob/0dd63ea81b27a38800044a55a7f9c8f12f87cad0/supabase/candidate/permission-administration.sql#L308-L326).
- [PR #9 — bổ sung CI cho công cụ kiểm tra giao diện](https://github.com/nguyentronglinh045/pos-cafe/pull/9), [PR #10 — tài liệu tương ứng trên nhánh docs](https://github.com/nguyentronglinh045/pos-cafe/pull/10).

Nhật ký và ảnh kiểm thử staging được lưu trong hồ sơ dự án trên máy; phần bằng chứng này chưa được công khai đầy đủ trên nhánh `docs` của GitHub.

**3. Công việc dự kiến tuần 4**

Trong tuần 4, em tập trung rà soát và chuẩn hóa dự án sau quá trình tích hợp, nhằm giữ kiến trúc nhất quán và thuận tiện cho việc phát triển, kiểm thử, bảo trì.

- Rà soát cấu trúc mã nguồn và logic nghiệp vụ; xác định các phần trùng lặp, xử lý chồng chéo hoặc chưa đúng trách nhiệm của từng mô-đun.
- Chuẩn hóa ranh giới giữa giao diện, xử lý nghiệp vụ và truy cập dữ liệu; thống nhất cách tổ chức và luồng xử lý theo kiến trúc của dự án.
- Kiểm kê mã, script, cấu hình và tài liệu phát sinh trong quá trình phát triển; tinh gọn những thành phần đã xác minh không còn sử dụng, đồng thời giữ lại minh chứng kiểm thử cần thiết.
- Kiểm thử hồi quy sau từng đợt chỉnh lý, ưu tiên các luồng gọi món, thanh toán và phân quyền; theo dõi và xử lý các lỗi liên quan được phát hiện.
- Đồng bộ tài liệu trên nhánh `docs` với mã nguồn hiện tại, ghi lại cấu trúc, trách nhiệm các mô-đun và quy ước phát triển để các thành viên tiếp tục làm việc thống nhất.

**Khai báo sử dụng AI:** Có — AI/agent hỗ trợ rà soát mã nguồn và đặc tả, xây dựng/chỉnh sửa mã và công cụ kiểm thử, phân tích lỗi, tổng hợp minh chứng và soạn báo cáo.

## Đối chiếu nguồn và giới hạn

| Claim | Nguồn đã đọc | Giới hạn |
| --- | --- | --- |
| 15 quyền, bốn vai trò enabled | `origin/main:src/seed/permissionCatalog.json:4–141`, `src/core/permissionAuthority.ts:18–29` | kitchen disabled; không accountant. Đây là phần đã tích hợp tuần này, không nhận toàn bộ được thiết kế mới trong tuần này. |
| Backend có closure quyền quản trị | `origin/main:supabase/candidate/permission-administration.sql:308–326`; financial checkpoint `permission-financial.sql:5–21` | Mã SQL không tự chứng minh đã activate production. |
| Guard phản hồi muộn | `origin/main:src/features/pos/orderFlow.ts:253–285`; [handoff tích hợp](permission-main-integration-2026-10-24.md) | Source review/56 tests được ghi tại mốc riêng, không nhận thành whole backend PASS. |
| Staging backend đã dựng | [Setup 22/10](permission-staging-setup-2026-10-22.md) | Candidate b2; thời điểm đó chưa business test; không đồng nhất với source main24/10. |
| Quyền/tenant/PIN/đơn32.000 | [Functional 23/10](permission-staging-functional-2026-10-23.md), [summary](../../implementation-log/permission-staging-functional-20261023/functional-summary01.json), [revoke proof](../../implementation-log/permission-staging-functional-20261023/permission-live-revocation-proof01.json), [tenant proof](../../implementation-log/permission-staging-functional-20261023/tenant-isolation-proof01.json) | e422150; PIN complete qua RPC, không submit UI; phạm vi hosted hữu hạn, không full gate. |
| Ảnh món staging | [Handoff ảnh23/10](permission-menu-images-2026-10-23.md), [upload proof](../../implementation-log/permission-menu-images-20261023/first-upload-publish-proof01.json) | First upload/publish bằng API, replace/remove bằng UI; remove binding không đồng nghĩa xóa bytes. |
| 1.189 unit/component trong CI PR | GitHub job120856389708/run40088569310, đọc trực tiếp connector ngày24/10: unit discovered/run/pass1189; job success | Source merge thử của a028; không full hosted backend. Không cộng với1177 của23/10 hoặc1173 tuần2. |
| CI main thất bại | GitHub job120860391476/run40089941679 đọc trực tiếp: job failure, phase smoke FAIL, unit1189 PASS; [outcome](../../implementation-log/permission-backend-web-release-20261023/permission-main-outcome-20261024.md) | Handoff xác định test tại `tests/smoke/permission-ui-closeout.spec.ts:40`, phone-landscape; chưa kết luận nguyên nhân ứng dụng. |
| Bộ đo UI đã tích hợp | `origin/docs:docs/workflow/tasks/ui-validation-ci-audit-2026-10-19.md:3–15`; PR9/PR10 tồn tại trong git ancestry | Công cụ/CI không phải đã remake ba màn hoặc UI hoàn hảo. |

Chênh lệch đáng chú ý khi rà hai nhánh: remote docs tại4125687 còn đặc tả `access-control/spec.md:5–25` với accountant,14quyền/data.wipe; code main hiện có4enabledroles/15quyền/data.clearDemo. Worktree docs đã có đặc tả cập nhật nhưng chưa đồng nghĩa nội dung đó được công khai. Báo cáo dùng code remote hiện hành cho claim về hành vi, không đưa link đặc tả public cũ như minh chứng phiên bản mới.

Đợt soạn báo cáo chỉ đọc nguồn/log có sẵn và GitHub, không chạy lại application tests hoặc truy vấn Supabase. Kết quả lịch sử giữ theo ngày/source/phạm vi; không tuyên bố current full PASS. Không có upload, submit, browser form write hoặc thay đổi website. Không tạo runtime/cache lớn hay temp cần dọn; file này là hồ sơ cuối cần giữ.

## Review độc lập

Reviewer `/root/weekly_report_review` **APPROVE** candidate SHA256 `CA14A900B07B2FAE335951305935BCCC1085183B4BD95A05BAFC12192FDCE427` ngày 24/10/2026. Không còn finding chặn. Reviewer đối chiếu Git source, handoff/JSON staging, hồ sơ CI, timeline/source boundaries, kế hoạch và khai báo AI; không chạy runtime/DB, không xem lại website hoặc gọi GitHub trực tiếp. Root đã xác minh GitHub jobs và đọc Tuần 2 trong Chrome riêng.

Đề xuất không chặn: ba link nội bộ có hậu tố dòng `:13/:16/:44`; tác giả bỏ hậu tố, reviewer đã xác nhận candidate cuối. Không sửa nội dung báo cáo. Chỉ bổ sung metadata review này sau freeze; không đòi review đệ quy. Đầu ra gửi đủ trong chat theo yêu cầu; hồ sơ local này chưa commit/push và không có thao tác nộp website.

## Điều chỉnh kế hoạch Tuần 4 theo người dùng

Ngày 24/10/2026, sau khi nhận báo cáo, người dùng yêu cầu đổi trọng tâm tuần tới vì dự án có nhiều thành phần dư thừa, cần thời gian chuẩn hóa logic và tổ chức dự án để giữ kiến trúc đúng. Mục 3 được thay bằng kế hoạch rà soát/tinh gọn/chuẩn hóa và kiểm thử hồi quy; các kết quả Tuần 3 giữ nguyên. Đây là thay đổi nội dung kế hoạch, không cấp quyền triển khai hoặc xóa dữ liệu ngay. Các lỗi CI và phần nghiệm thu backend còn thiếu vẫn mở, không đổi tiêu chí hoặc nhận thành hoàn tất. Approval trước thuộc candidate cũ; delta mới chờ review độc lập.

Review delta: `/root/weekly_report_review` APPROVE SHA256 `B271AEDCEB8ECC9E3C1B3BDBAFBD0C1C3219A52EC8A57A64B40E88A824383929`; đã kiểm mục3 và metadata, không finding chặn. Giữ kiểm thử hồi quy, minh chứng và các gate còn mở; không cấp quyền xóa. Không sửa source/chạy test hoặc kiểm lại claim Tuần3. Metadata approval này được thêm sau freeze.