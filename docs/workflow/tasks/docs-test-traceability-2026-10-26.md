# N5 — Truy vết kiểm chứng và xuất bản gói docs

Ngày26/10/2026. [Ma trận chuẩn](../../regression-map.md) · [Evidence đã lập chỉ mục](../../implementation-log/test-traceability-20261026/README.md).

## Phạm vi được giao

Sau đề xuất làm N5, chủ dự án đồng ý tiến hành và yêu cầu kiểm cuối với các subagent trước khi push. Quyền lần này gồm cập nhật docs theo source/evidence và **push phần docs đã review**, bao gồm N3/N4 đang local. Không có quyền sửa code/DB, refactor, chạy suite, deploy sản phẩm, tạo lab hoặc đổi yêu cầu. Checklist ngoài Git tiếp tục local-only.

Docs đầu lượt`3834a5501eedfc3e697f7763802a1d184c2769dd`; origin/docs trước lượt`d75e41ec40a3287da054b023594fb087d412d983`; code đối chiếu`711a22e71983e3d6aa17799649af05ce4c762555`. Main local HEAD`5156820f7d6679cd6f8051bdc38419737ffa0c7e` có WIP, được giữ nguyên. Snapshot tài liệu và index riêng nằm ngoài checkout; không tạo worktree docs hoặc switch/reset/stash/clean.

## Kết quả và giới hạn

- Mở rộng bản đồ hồi quy hiện có thành21 FR/8 NFR, nối scenario/UC/TC chính thức hoặc ca source với assertion cụ thể, đúng mức evidence và khoảng thiếu. Không tạo taxonomy requirement/TC mới, không giảm SHALL hoặc threshold.
- Đọc log unit/build và hai JSON browser cf8e304 còn local; xác minh Git tree bằng main711a22e. Chỉ mục browser giữ107 bản ghi (26 targeted +81 smoke, trong đó37 skip); unit chỉ có tổng113 files/1.201 tests. Không nhận tổng này là kết quả từng TC hoặc coverage.
- Evidence mới là manifest/hash và chỉ mục đã bỏ config/log/payload. Raw cũ giữ nguyên; các receipt frozen và spec không đổi trong N5. Không gọi MCP, kiểm lại DB, chạy app/test hoặc cài công cụ.
- Các điểm mỏng được ghi rõ: mang đi trọn luồng; phiếu bếp không giá; phủ đủ filters/report/editor; backend/PIN/Storage/Realtime/transaction; coverage nguồn hiện hành; Vercel/hardware/backup/restore/performance. R06-B vẫn hoãn, R06-C và owner spec vẫn mở. HTML chưa render vẫn chưa render.

## Gói xuất bản được review

Phạm vi so sánh **origin/docs d75e41e → candidate cuối**, gồm N3 nguồn học thuật đã chỉnh gọn (không còn26 nguồn chưa đọc), N4 đối chiếu/ba quyết định R06 và N5 ở đây. Receipt lịch sử của N3/N4 giữ nguyên; ghi chú đầu hồ sơ chỉ rõ quyền xuất bản mới. Chỉ các file docs/OpenSpec được phép đã liệt kê trong diff được xuất bản; không push main hoặc checklist.

Kiểm cuối: liên kết/anchor, source ghim/file/dòng, đủ29 dòng không trùng, manifest và107 bản ghi đối chiếu raw, bảo toàn evidence cũ và giới hạn N4, diff-check, trạng thái main/checklist. Hai reviewer độc lập kiểm semantics/traceability và preservation/nguồn quyền trên cùng candidate; kết quả thật ghi ở receipt cuối. Push thực hiện sau cả hai APPROVE và kiểm remote không trôi, không force. Receipt ngoài Git giữ kết quả remote sau push để tránh ghi thành công trước khi hành động.

## Theo dõi tiếp

N5 chỉ đóng **đầu ra kiểm kê tài liệu** sau kiểm/review. N4, P1-03, H1–H4 và các gate sản phẩm không tự đóng. Khi được giao triển khai hoặc thu evidence, chọn đúng source/environment rồi bổ sung receipt vào ma trận, không chạy suite ngay trong phiên docs. Đường đọc được cung cấp ở ma trận và sơ đồ; chưa có phản hồi xác nhận chủ dự án đã đọc/hiểu code.
