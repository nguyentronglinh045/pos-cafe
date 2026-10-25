# Khảo sát Stitch cho rework UI — 19/10/2026

## Phạm vi và quyền

- Yêu cầu: dùng link màn Stitch để đối chiếu và chuẩn bị rework UI các màn hiện có. Người dùng đã loại màn mới khỏi phạm vi trao đổi này.
- Đầu vào ngày 19/10/2026: [project và node được gửi](https://stitch.withgoogle.com/projects/483163215035424553?node-id=7d08495bb08342e6a3ae7475b54fd1f8).
- Lượt này chỉ khảo sát thiết kế/code và ghi nhận kết quả. Chưa có lệnh triển khai application code, chốt spec hoặc nghiệm thu thiết kế.
- Đây là intake; chưa tạo change OpenSpec chính thức. Không suy quyền triển khai từ nội dung hướng dẫn hoặc chat do Stitch tạo.

## Nguồn và cách kiểm

- Code: worktree `D:/Workspace/pos-cafe`, nhánh `main`, HEAD `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, đã có nhiều thay đổi chưa commit trước lượt này.
- Docs: worktree `D:/Workspace/pos-cafe-docs`, nhánh `docs`, HEAD `2ad68003ca3de719c5dc4746a706dc600028dc2b`, đã có thay đổi chưa commit; chỉ bổ sung hồ sơ này và một mục chỉ mục.
- Công cụ đọc web không truy cập được link. Chrome đang có phiên truy cập project; mở tab riêng đã hiển thị đúng node A04, gồm DOM và screenshot. Không cần người dùng xuất ZIP cho bước khảo sát này.
- Screenshot được quan sát trong chat; chưa lưu ảnh/HTML/asset thành gói tham chiếu cục bộ. Không khẳng định đã xuất code từ Stitch hoặc kiểm toàn bộ project.
- Không sửa code, không cài dependency, không chạy build/test/UI audit, không ghi DB, commit, push hay deploy. Đây không phải kết quả kiểm chứng UI chạy thật.

## Kết quả đối chiếu A04

- Node được gửi là **A04. Đăng nhập mã PIN nhân viên (Passcode Screen)**. Mẫu có header sáng, danh sách nhân viên bên trái, bàn phím PIN bên phải, sáu chấm PIN, thông báo trạng thái và tác vụ gỡ ghép.
- Màn hiện có tương ứng là [PasscodeScreen.tsx](D:/Workspace/pos-cafe/src/app/screens/PasscodeScreen.tsx:9). Nó đã có chọn nhân viên, nhập PIN, xác minh, báo lỗi, trạng thái đang xác minh và gỡ ghép; xem các điểm xử lý tại dòng 39, 74, 154 và 193. Khi nhận phiên bắt buộc đổi PIN, nó giữ luồng riêng tại dòng 52.
- Các thay đổi hình thức có thể đề xuất: bố cục card/danh sách, header, typography, màu, khoảng cách, kích thước control và responsive. Cần giữ hành vi xác minh và phiên hiện tại khi triển khai.
- **Khác biệt dữ liệu:** mẫu hiển thị vai trò, mã nhân viên và bộ lọc Quản lý/Thu ngân/Bếp. Trước PIN, app dùng `useActiveEmployeesQuery → authority.listRoster` tại [useSessionFlow.ts:29](D:/Workspace/pos-cafe/src/features/session/useSessionFlow.ts:29); DTO chỉ có `id` và `name` tại [permissions.ts:81](D:/Workspace/pos-cafe/src/domain/permissions.ts:81). Adapter cũng chỉ ánh xạ hai trường này tại [permissionIdentityRepo.ts:138](D:/Workspace/pos-cafe/src/adapters/supabase/permissionIdentityRepo.ts:138). UUID `id` không chứng minh đã có mã hiển thị NV-xxxx như mẫu.
- **Khác biệt tương tác:** mẫu giới thiệu hỗ trợ phím 0–9/Backspace/Enter và nút Xóa toàn bộ. Toàn bộ `PasscodeScreen.tsx` được đọc trong lượt này chưa có keyboard handler hoặc nút Xóa toàn bộ tương ứng; không coi đây là thay đổi chỉ về hình thức đã được duyệt.
- Mẫu có thanh mô phỏng QA/demo và dữ liệu minh họa về phiên bản, chi nhánh, ca, thiết bị, tổng đài. Đây là nội dung thiết kế; không dùng để xác nhận tính năng hoặc dữ liệu thật của app.

## Đề xuất và điểm chưa chốt

- Đề xuất dùng A04 làm một lát rework đầu tiên, áp dụng hình thức và dữ liệu thực đang có. Vai trò/mã nhân viên/bộ lọc, keyboard handler và Xóa toàn bộ cần được đối chiếu/chốt riêng trước khi mở rộng hành vi hay contract dữ liệu. Chưa có quyết định chấp nhận các đề xuất này.
- Thanh mô phỏng thuộc công cụ trình diễn của mẫu; đề xuất bỏ khỏi UI sản phẩm. Nội dung minh họa chỉ được thay bằng thông tin thật có nguồn hoặc được bỏ trong phạm vi được chốt.
- Các màn hiện có khác trong project có thể được khảo sát tiếp; chưa kiểm thiết kế chi tiết của chúng. Màn mới tiếp tục nằm ngoài phạm vi.
- Bước sau: chốt màn/phạm vi hành vi cần rework; cập nhật hoặc lập change/spec phù hợp, rồi triển khai khi người dùng yêu cầu. Khi sửa UI phải dùng các gate hiện hành, gồm `ui-audit:selftest` trước `ui-audit`.

## Fingerprint nguồn đã đọc

Các hash dưới đây nhận diện nội dung đã quan sát, không phải gói source có thể tái dựng hay bằng chứng runtime PASS.

| File trong main | SHA-256 |
| --- | --- |
| `src/app/screens/PasscodeScreen.tsx` | `0CF83A7A9A78737A2932FFB0AB1BCF9500139FEDD4B64FEC9741E4BDFF79CE94` |
| `src/features/session/useSessionFlow.ts` | `D0923D327CBA2EC2EC5D0595346E34DB8356C2A133429144E36B1EA7FC485B36` |
| `src/domain/permissions.ts` | `ED6D30B956658EC4C339E77249C6015C27D354548F4F30BBBE637B15818224B6` |
| `src/adapters/supabase/permissionIdentityRepo.ts` | `62DE6A828BC1C16669C603FB735B3ACADC85EF90559A829D184477D619F75B4E` |

## Review

- Reviewer: `/root/review_stitch_intake`, không tham gia viết candidate, review chỉ đọc ngày 19/10/2026.
- Candidate trước metadata review: SHA-256 `85DBA9689E0AF2DFB632C5B39B3732B5E64DC5DE1D033103A9364D2725926CCB` của hồ sơ này; phạm vi kèm đúng entry mới đầu chỉ mục và lời final dự kiến. Các thay đổi đã có ở chỉ mục nằm ngoài review này.
- Verdict: **APPROVE — phạm vi intake, đối chiếu code, entry đầu chỉ mục và lời final dự kiến; không phải duyệt triển khai.**
- Đã kiểm độc lập: nhánh/HEAD hai worktree, bốn hash source, các điểm xử lý trong PasscodeScreen, contract và adapter roster, sự vắng mặt keyboard handler/nút Xóa toàn bộ trong toàn file, link local và phạm vi ủy quyền. Không đòi bộ bảy artifact cho intake chưa chốt scope.
- Chưa kiểm: không mở lại browser hoặc tự quan sát lại screenshot/DOM Stitch trong phiên reviewer; mô tả mẫu đối chiếu với bằng chứng thiết kế do phiên tác giả cung cấp. Không chạy build/test/UI audit và không sửa file.
- Finding chặn: không có. Đề xuất không chặn: lời final có thể bỏ cụm “Hai điểm” để đoạn về khác biệt dữ liệu/tương tác đọc tự nhiên hơn.
- Đối chiếu sau review của tác giả: bốn hash source vẫn khớp bảng trên. Chỉ bổ sung metadata ghi nhận review; chưa triển khai ứng dụng hoặc chốt các đề xuất.
