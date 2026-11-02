# T02 — chốt triển khai attribution và công bố hồ sơ, 02/11/2026

- Phạm vi: bản sửa tooling phương án A, summary v2 và consumer v1/v2; không đổi ứng dụng/SQL/quyền, acceptance, coverage, retry/timeout/skip hoặc gate.
- [PR16](https://github.com/nguyentronglinh045/pos-cafe/pull/16) merge `9ec6b056eeecc2be0cbedcb0f19282b8e30d9955` vào `28a3dc54a846463ba150d50ab323658d6ed1372c`; tree `472590b8df3c40359b7e4e9dddb98b64a544ad4a` bằng head đã review và synthetic merge PR CI. Tám file thay đổi, ba trust hash cập nhật, trusted path-set64 giữ nguyên.
- U/P local đã review; C branch41379094743/a1, PR41384287830/a1 và main41385640659/a1 đều18/18PASS. Main nativePG16 30/30, cleanup/reclaim/corepattern restoration đạt. Mỗi event một attempt, không rerun thủ công. Xem [analysis12](analysis.md#merged-20261102) và [sources.json](sources.json) cho binding/hash và projection.
- Nhánh T02 remote/local đã xóa sau merge. Working data và hai harness giữ nguyên; raw log/evidence riêng tư không xuất bản.
- Phần triển khai attribution hoàn tất. T02 tổng thể còn R-APP NOT_RUN/UI UNKNOWN; full business backend acceptance không được light CI thay thế. Hướng dẫn đọc code đã chuẩn bị, chưa xác nhận người dùng đã đọc/hiểu.
- Hồ sơ này chỉ đi trên nhánh docs, parent docs9916522. **Không bao giờ merge docs vào main**; cập nhật quy tắc trong AGENTS.md trên docs. Không chạy app/CI mới trong lượt công bố tài liệu.

## Review độc lập

Candidate kỹ thuật được cả hai reviewer chấp thuận: manifest SHA-256 `6585e967fb44e401385c4e1a3dbe9b59d3898a5b1dd88497d2f930fa68118c1d`, đúng 10 file.

| Phạm vi reviewer | Kết quả | Finding và đối chiếu |
| --- | --- | --- |
| Contract, trạng thái, privacy và mô hình nhánh | APPROVE | DC-01 đã đóng: chỉ mục có mục hiện hành02/11 riêng, các mục28/10 giữ nguyên nghĩa lịch sử. Không có đường dẫn máy, thông tin điều phối cá nhân hoặc raw error mới trong nội dung công bố. Quy tắc không merge docs vào main được ghi ở AGENTS.md trên docs. |
| Nguồn, schema, metric và bằng chứng | APPROVE | DC-02 đã đóng: schemaDecision đã xác nhận v2/consumer v1-v2, currentMain trỏ main28a3dc5/run41385640659; giá trị cũ được giữ dưới historicalSchemaDecision20261028/historicalRuns20261028. Hash tài liệu, lineage U/P–branch–PR–main và cleanup khớp receipt đã kiểm. |

Hai scope cùng giữ giới hạn R-APP NOT_RUN/UI UNKNOWN/full business backend chưa nghiệm thu, không có finding chặn còn mở. Kiểm local của lượt docs gồm exact allowlist/byte/hash, whitespace, liên kết và anchor mới, schema/source metadata, privacy của phần thêm. Không chạy lại app/CI. Sau APPROVE chỉ bổ sung metadata review này; không đổi nội dung kỹ thuật đã được review.
