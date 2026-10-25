# COUNTDIAG01 — recipe đã review, GET chưa được admission

Ngày 23/10/2026, Asia/Bangkok. **NOT_ADMITTED_READINESS_EXPIRED; diagnostic GET0.** Chưa có archive mới hoặc kết luận mới về chênh lệch9/7. Không coi control giả lập là chẩn đoán package thật.

## Quyền và thực tế

Owner tại `request_user_input_async call_a52e0b478fa04806ac6e58203f1711ed item0` cho “Mở cửa sổ 15 phút mới (khuyến nghị)”, thay hạn12:54:18 đã hết. [Grant](bp04a-countdiag01-owner-grant.json) ghi nhận **13:41:54**, readiness **13:48:54**, last execution admission **13:51:54**, hard stop **13:56:54**. Phạm vi/caps khác của [plan](../../workflow/tasks/permission-bp4a-archive-count-diagnosis-2026-10-23.md) giữ nguyên.

Source sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. [Snapshot](bp04a-countdiag01-readiness-observation.json)13:43:34: task51.609.345B, tăng300.215B từ baseline; retained333.481.233B, C/D trống193.691.303.936/98.505.093.120B, không runner task khác. Snapshot là logical bytes và quan sát, không phải quota OS.

## Chuẩn bị đã hoàn tất

- Viết recipe chẩn đoán riêng, không đổi main03/parser/collector admission cũ. Một bounded GET, lưu raw/error body, SRI trước parse; parser cũ giữ count9/19802 và diagnostic counters riêng; node-tar7.5.13 list-only trên tar đã bounded-inflate≤1MiB, không extract/chạy payload.
- Review phát hiện và sửa trước remote: lỗi cấu trúc phải chặn parser tham chiếu; pin reference module trước GET; chặn khi hết readiness; fixture phải có đúng19.802byte để thật sự kiểm FILES9/7 thay vì chỉ lỗi BYTES.
- [Controls01](bp04a-countdiag01-controls.json) hoàn tất13:46:55,11/11PASS fake transport. Hai control count lúc đó chỉ chứng minh tách regular/directory/PAX; payload7byte nên chưa chứng minh đúng lỗi FILES9/7. Giữ report/marker cũ, không dùng oracle thiếu đó thay result02.
- [Controls02](bp04a-countdiag01-controls02.json) hoàn tất **13:48:24.093**,11/11PASS offline; hai fixture đúng19.802byte và assert `BP4_COUNTS_FILES expected9 actual7`; traversal dừng trước reference. Zero network. Đây là report của final executable hashes, không phải22 case khác nhau.

Final recipe tại [operations](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/bp4-countdiag01.mjs) SHA256 `c18e42c0813590497f424f1864e57985bfdd5bb5a588fca79e9634e3ed73a082`; [controls](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/check-bp4-countdiag01.mjs) `90a3c3b442599ffea41de8efa61c9d97c64ea51766d4a8d51b3327f3a33b7173`; report02 `6b16c4818a9395370b06269e6de31b4eb668a10a1ecdb7764cb96bc1c0db17a6`. Hai reviewer khác tác giả đã APPROVE exact final package; không có bằng chứng coordinator hoàn tất admission trước readiness.

## Vì sao vẫn chưa chạy

Coordinator kiểm clock lúc **13:48:59**, sau cutoff13:48:54 năm giây, trước khi tạo admission/GET. [Stop receipt](bp04a-countdiag01-stop.json) ghi rõ không có admission/start/body/actual receipt. Không gọi main để thử vượt guard, không sửa deadline hoặc retry.

**Nguyên nhân thuộc kế hoạch điều phối:** trần7phút gồm viết tooling mới, controls và hai review đã ước lượng thiếu. R0 cũng phát hiện hai lỗi cần sửa thật: structural-stop và count oracle. Việc pin cứng clock/hash grant trong executable làm lần mở cửa sổ tiếp phải cập nhật binding dù logic không đổi; tránh lặp lại toàn bộ thiết kế/controls chỉ vì thay thời gian.

Lịch sử vẫn2/2 full-preflight attempts đã dùng; diagnosticGET0, actual analysis0, install/build/unit0. Không push/CI/backend/DB/deploy, không thay coverage/acceptance hoặc cleanup. Raw copies và hashes tại [manifest](bp04a-countdiag01-manifest.json). Report01 chỉ gắn source hash cũ; executable giữ tại operations là bản final02, không tuyên bố có snapshot executable cũ để tái chạy report01.

## Đề nghị cửa sổ tiếp — CHỜ OWNER

Mở **15 phút mới từ lần ghi nhận trả lời kế tiếp**, không tái dùng grant COUNTDIAG01. Chỉ cập nhật binding grant/time/output namespace trong recipe đã review; giữ nguyên logic fetch/parse/caps. Giữ bản final01 và các receipts; tạo bản/namespace mới, không overwrite. Hai reviewer kiểm đúng diff binding và exact hashes trước GET. Nếu cần đổi logic chức năng thì dừng, không tự mở scope.

Readiness mới tối đa **T0+8phút45giây**, dành tối đa75giây cho GET≤15giây + một analysis batch≤60giây và giữ nguyên5phút cuối review/docs. Tổng vẫn15phút; không admit khi không đủ75giây+reserve. Không đặt thêm hard stop tuyệt đối từ cửa sổ cũ. Giữ một GET≤64KiB, output inflate≤1MiB, disk diagnostic≤1MiB, C/D≥30GiB và task/retained budget cũ. Đúng một request/invocation, không retry, kể cả lỗi.

Controls02 chỉ được reuse cho logic không đổi, cùng runtime/reference/parser pins; không gọi11fake checks là PASS của wrapper thời gian mới hoặc archive thật. Review diff binding/source và fresh time/storage/namespace là điều kiện riêng; không rerun controls không bị ảnh hưởng để tăng số PASS. Bất kỳ thay đổi thực vào logic cần kiểm lại phần ảnh hưởng và review trong cửa sổ, nếu không kịp thì dừng.

Lượt tiếp vẫn **0 full46preflight/npm ci/build/appunit/push/CI/backend/DB/deploy/cleanup**, không waive count, không đổi parser/lock. Mục tiêu chỉ có exact retained archive và kết luận hai parser trên cùng bytes. Đề nghị này chưa là quyền chạy; quota GET chưa dùng không tự mở lại admission đã hết hạn. Hai review cuối outcome/proposal và raw evidence lưu riêng trước bàn giao.
