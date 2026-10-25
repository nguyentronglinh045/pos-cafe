# Ý kiến chuyển sang kiểm web + staging trước báo cáo

Ngày 23/10/2026, Asia/Bangkok. **Khuyến nghị để owner quyết định; thực thi vẫn PAUSED.** Owner đề xuất khẩn cấp quay về logic DB + web nối DB/testcase, hoặc xử lý dứt điểm framework hiện tại một lần. Lượt này chỉ đọc code/hồ sơ, tham khảo docs Supabase và review ý kiến; không sửa app/SQL/env/config, query DB, chạy test, deploy hoặc push. Không tự đổi cổng nghiệm thu.

## Khuyến nghị

**Ưu tiên hướng 1 cho mốc báo cáo thứ Bảy: kiểm chức năng trên web nối staging, kèm testcase gọi API/RPC trực tiếp để xác minh quyền ở máy chủ.** Dùng lại code e422 và SQL b2 đã có, tạm dừng đầu tư thêm framework orchestration hiện tại. Không viết lại phân quyền, quay lui DB hàng loạt hoặc xóa bộ test/bằng chứng cũ.

Lý do là các vòng gần đây đang bị tooling/env cản trước khi kiểm ứng dụng; tiếp tục sửa framework không có ETA hoàn tất đáng tin. Cách 1 đưa phép kiểm về luồng người dùng sẽ báo cáo. Đây là lựa chọn ưu tiên dưới hạn thời gian, **không chứng minh sẽ xong trước thứ Bảy**. Không có cơ sở hứa cách 2 “sửa một lần hết mọi lỗi”; có thể chốt một lượt sửa hữu hạn và kết luận rõ kết quả, không tự gia hạn hoặc mở vòng mới.

## Hướng 1 cần có gì để đáng tin

1. **Dùng trạng thái hiện có.** SQL schema/RPC/RLS đã bootstrap trên staging `ineckiashpwloncxnbqx`, COMMITTED_NOT_READY; không cần apply lại toàn bộ chỉ vì build local lỗi. Web local nối staging giúp tránh thêm phụ thuộc hosting/Vercel. Cần đối chiếu schema/source và chỉ chuẩn bị delta thực sự cần nếu được cấp quyền. [Setup:3,19–21,55](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/permission-staging-setup-2026-10-22.md:3)
2. **Xác minh đang test hệ thật.** Explicit `VITE_DATA_MODE=supabase` và đúng project/config; thiếu env có thể chạy mock. Luồng tạo quán/PIN/session cần kiểm qua app thật. [runtimePorts:16](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/runtimePorts.ts:16)
3. **UI và máy chủ cùng được kiểm.** Ma trận cần nhóm quyền thực tế, thao tác được phép/bị cấm, đổi/thu hồi quyền, PIN/session hết hạn/thu hồi, tải lại trang và cô lập hai quán. Mỗi testcase có ID, input, expected, actual, candidate và evidence; denial phải kiểm dữ liệu không bị đổi. Happy path và nút bị ẩn không đủ chứng minh phân quyền.
4. **Gọi API/RPC trực tiếp với danh tính đúng.** App dùng cả JWT tài khoản quán và credential nhân viên `x-pos-employee-token`; PostgREST còn có contract header 2. Cần kiểm bỏ qua UI/giả mạo đầu vào vẫn bị từ chối. Query bằng postgres hoặc request đặc quyền service_role không thay kết quả quyền người dùng. [client:22,45](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/client.ts:22); Supabase nêu request đặc quyền có thể bypass RLS trong [RLS reference](https://supabase.com/docs/guides/database/postgres/row-level-security#bypassing-row-level-security). Không đưa secret/service key vào browser.
5. **Dùng công cụ và testcase sẵn có.** Chỉ thêm test hẹp cho lỗ hổng chưa phủ, không dựng thêm tổng runner/cache/archive parser, WSL hoặc Docker. SQL/RPC giữ trong file versioned; thao tác tay trên dashboard phải có delta và evidence, tránh drift không truy nguyên được. Không thay toàn bộ 760 identities bằng một bộ demo nhỏ rồi gọi coverage tương đương.

## Những blocker vẫn phải giải quyết

- Build local chưa chạy được do command resolution; đổi DB không tự sửa lỗi đó. Dependency đã cài có thể giữ nếu identity khớp. [LOCAL75](bp04a-local75-01-outcome.md:17)
- Auth staging chưa có functional PASS. Snapshot Confirm ON là lịch sử; app dùng email tổng hợp và đòi session sau signup nên cần kiểm/điều chỉnh Auth theo quyền mới. Không admin-create để lách luồng cần kiểm. [storeKey:34](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/storeKey.ts:34), [authRepo:81](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/authRepo.ts:81)
- Luồng ảnh cần Edge gateway/public; chưa có đủ deployment/transport proof. Sau khi có quyền mới, có thể kiểm core Auth/RPC trước khi hoàn tất Edge; phần ảnh còn phải ghi PENDING và không tự bỏ khỏi nghiệm thu. [Edge proposal:25](D:/Workspace/pos-cafe-docs/docs/workflow/tasks/permission-staging-auth-edge-proposal-2026-10-22.md:25)

Chưa query live Supabase trong lượt ý kiến này; không nhận snapshot cũ thành tình trạng hiện tại.

## Cách chặn vòng lặp về tổ chức công việc

- Chốt một scope bàn giao và ma trận testcase trước khi chạy. Hai reviewer phụ trách ranh giới quyền/DB và luồng web/API; một executor vận hành staging. Không tăng số writer hoặc xây thêm công cụ tổng.
- Kiểm một chuỗi ngắn có positive/negative bằng đúng client/env trước lượt kiểm dài. Tập hợp lỗi thành một danh sách có nguyên nhân; sửa theo batch hữu hạn đã được cấp, version candidate và kiểm lại phần ảnh hưởng/hồi quy cần thiết. Không reset toàn bộ evidence hoặc quay lại cài đặt khi source/dependency không đổi.
- Thống nhất trần thời gian/lượt sửa trong **grant mới**. Lỗi còn tồn tại ở ngưỡng thì báo blocker và phần bàn giao được; không xin nối tiếp vô hạn hoặc gắn thêm gate sau mỗi lượt. Hiện chưa có quyền sửa/retry/ghi staging mới; điều kiện STOP cũ vẫn giữ.

## Main, coverage và báo cáo phải tách rõ

Giữ toàn bộ test, coverage config và evidence cũ. Những phép kiểm chưa chạy vẫn NOT_RUN; việc hoãn thực thi không phải đã đạt coverage. Hosted/manual không thay chứng cứ restore/physical isolation/race/full 35/760/12.

Nếu owner giữ nguyên cổng merge cũ, hướng 1 có thể tạo mốc staging cho báo cáo nhưng **main vẫn phải đợi full gate**. Nếu owner muốn dùng tiêu chí khác để cập nhật main trước báo cáo, đó là thay đổi nghiệm thu: phải ghi rõ phạm vi, nghĩa vụ nào được kiểm bằng cách khác, phần nào hoãn và giới hạn chấp nhận, rồi review/duyệt trước. Không âm thầm coi đề xuất khẩn cấp này là đã bỏ gate.

Mốc giao hợp lý để đề nghị là web nối staging hoạt động theo phạm vi đã kiểm, ma trận quyền có actual/evidence, danh sách lỗi và nghĩa vụ còn thiếu. Main merge, DB gốc và production là các quyết định riêng, chưa được cấp ở lượt này. Tránh tiếp tục hứa “chỉ còn 60 phút” cho mục tiêu hoàn thành toàn bộ phân quyền.

Đối chiếu chính thức: [Supabase testing](https://supabase.com/docs/guides/database/testing) hỗ trợ kiểm logic/schema ở DB; [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) xác định quyền thực thi tại DB. Các nguồn này không chứng minh matrix mới tương đương gate riêng của dự án. Hai reviewer độc lập rà ý kiến process và technical path; approval tài liệu không cấp execution.
