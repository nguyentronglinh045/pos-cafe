# N1 — Chuẩn hóa thuật ngữ, ERD và từ điển dữ liệu

Ngày 26/10/2026. Phạm vi: phần 1 trong thứ tự chỉnh lý docs được chủ dự án chọn; không refactor code.

## Đề bài và quyền thực hiện

Chủ dự án xác nhận bốn nhóm công việc là chỉnh lý trên nhánh docs, đọc code/SQL để đối chiếu, rồi giao: “làm lần lượt … phần 1 trước”. Lượt này chuẩn hóa thuật ngữ và mô hình dữ liệu; không đổi yêu cầu, schema, grants/RLS, chạy migration/app test, triển khai hoặc thực hiện N2–N5. Chỗ mô hình và hợp đồng chưa chứng minh được giữ nhãn giới hạn. Checklist ưu tiên vẫn local-only ngoài repo.

Nguồn docs đầu vào `4191e2126f8558839d0a02f2422389c798ab5079`; code `711a22e71983e3d6aa17799649af05ce4c762555` được xác minh cùng remote lúc bắt đầu. Main local có WIP ở `5156820f7d6679cd6f8051bdc38419737ffa0c7e`, không dùng làm baseline hoặc đổi trạng thái. Không tạo lại docs worktree; candidate qua index riêng và Git objects.

## Đầu ra và cách đọc

1. [Thuật ngữ](../../glossary.md): cách gọi thống nhất, phân biệt thuật ngữ dễ nhầm và dẫn nguồn.
2. [Mô hình](../../data-model.md): tám ERD theo nhóm, chỉ vẽ FK thật, danh sách liên kết logic và giải thích ràng buộc/nghiệp vụ.
3. [Từ điển](../../data-dictionary.md): 35 bảng/332 cột của mô hình source sau preparation/activation candidate; dữ liệu nền/bridge/chuyển đổi có nhãn. Không tính ba bảng legacy controller loại hoặc bảng nền tảng Auth/Storage.
4. README, requirements và report source map thêm đường đọc; nội dung requirement giữ nguyên. N1 sẽ được tích sau kiểm/review; P1-03 còn mở cho N2/N3 và phần nguyên liệu còn lại.

## Các phân biệt quan trọng

- FK cùng-store khác ID logic trong audit/signal/registry. Không dùng nét đứt Mermaid làm ký hiệu “không có FK”; quan hệ logic chỉ ghi ở bảng riêng.
- ERD cardinality theo PK/UNIQUE/nullability; đúng một owner hoạt động còn có constraint trigger cuối transaction. Singleton PK chỉ bảo đảm tối đa một dòng.
- Payment một lần/đơn paid là invariant đường nghiệp vụ; DDL không unique order_id. Lệnh tạo đơn có thể đăng ký trước đơn nên generated order_id không có FK.
- Role text/candidate không bị trộn với enum admin legacy: controller chuyển role, áp fragments và dọn bridge. Danh sách migrations không phải recipe replay.
- CHECK JSON không thay NOT NULL; từ điển giữ đúng nullability của receipt seed/snapshot cũ. Không chạy phép thử bypass để nhận đây là lỗ hổng đã tái hiện.
- Có schema/role owner không có nghĩa owner email/recovery/ownership transfer đã hiện thực. R06 seed lại/khóa store vẫn ở [đối chiếu spec](../../spec-reconciliation.md).

## Kiểm chứng và giới hạn

Đã kiểm offline các khai báo DDL, ALTER và controller: đủ 35 bảng/332 cột trong từ điển; tám khối ERD/36 quan hệ đối chiếu FK, PK/UNIQUE và nullability; liên kết nội bộ/nguồn ghim hợp lệ. Quy tắc cú pháp ERD dùng trong tám khối đã được kiểm theo tập cú pháp nhỏ đã chọn; không có Mermaid renderer/parser đầy đủ được chạy. Main WIP và nội dung FR/NFR gốc giữ nguyên. Candidate đã qua hai review độc lập; số kiểm cuối và verdict ghi trong receipt bên dưới. Kiểm kê đủ bảng/cột không là kiểm tất cả function/policy/trigger hoặc chứng nhận bảo mật.

Nguồn giải nghĩa kỹ thuật: [PostgreSQL 16 constraints](https://www.postgresql.org/docs/16/ddl-constraints.html), [Mermaid ER syntax](https://mermaid.js.org/syntax/entityRelationshipDiagram.html). Dùng cho nullability/PK và ký hiệu ERD, không nhận đã hoàn thiện danh mục học thuật N3. Source code ghim theo file/dòng trong ba trang đầu ra.

Không chạy app/backend, không cài dependency hay dựng WSL/Docker. Không sửa HTML kiến trúc hoặc thử lại đường preview file bị browser policy chặn ở task trước. Các sơ đồ mới là Mermaid trong Markdown; kiểm cú pháp/quan hệ được ghi riêng, không tự nhận kiểm render/ảnh xuất bản nếu chưa thực hiện.

## Review và bàn giao

Hai review độc lập đã hoàn tất: tính đúng mô hình/source và preservation/phạm vi/checklist. Bảng findings và verdict gắn đúng candidate ở receipt bên dưới. Đường đọc để chủ dự án kiểm: thuật ngữ → nhóm ERD → các cột/ràng buộc tương ứng; chưa nhận chủ dự án đã đọc/hiểu.

| Finding | Nguồn phát hiện và xử lý |
| --- | --- |
| SELF-01 — R1 bị diễn đạt chung với lỗi terminal | Tác giả tự rà proposal v1: sửa glossary để R1 chỉ là BusinessResult khi applied lần đầu; rejected giữ lỗi riêng. Replay được giải thích thành dòng riêng. |
| N1-R01 — Tên lệnh hủy paid kế thừa trong data-model không đúng giao thức v1 | Reviewer knowledge đối chiếu source: sửa `action void_paid` thành `kind void_order`; làm rõ giỏ toàn số lượng 0 chuyển thành action void_open, DB mark removed và giữ raw quantity/options. Dẫn domain contract, flow và SQL helper; không đổi requirement/code. |

Việc tiếp theo: N2 sơ đồ các luồng quan trọng, rồi N3 nguồn học thuật theo luận điểm; chỉ thực hiện theo phạm vi lượt tiếp theo. Lượt N1 commit trên docs local, không tự mở lượt triển khai hoặc nhận quyền push mới từ receipt năm nhóm đã hoàn tất.

## Receipt hoàn tất N1 — 26/10/2026

Candidate nội dung `87f849c0221bf99c135f58d412d092d20b679a70`, base `4191e2126f8558839d0a02f2422389c798ab5079`. Hai reviewer xác nhận **APPROVE** đúng candidate và checklist SHA256 `5290d09e07d496c9fd51f37220a2af1417210a2968f19acefdb4d661e12fa886`:

| Reviewer | Phạm vi và kết quả |
| --- | --- |
| `/root/review_knowledge` | Tám file, DDL/controller/contract source711a22e; kiểm kê độc lập 35 bảng/332 cột không lệch; ERD/PK/FK/NULL/cardinality/constraint và thuật ngữ. N1-R01 đã đóng; SELF-01 đã sửa đúng. APPROVE, không còn finding. |
| `/root/review_preservation` | Phạm vi, bảo toàn requirement/evidence, liên kết/anchor, khả năng tra cứu và checklist. Đã xác nhận lại delta tên lệnh hủy và bản ghi findings. APPROVE, không còn finding chặn. |

Kiểm cuối: 203 liên kết nội bộ và 550 tham chiếu source ghim hợp lệ; 35 bảng/332 cột; tám ERD/36 quan hệ FK; `git diff --check` sạch. Main WIP, các normative spec và evidence gốc giữ nguyên. Không introspect DB, chạy app/backend hoặc Mermaid renderer/parser đầy đủ; các giới hạn này không bị đổi thành PASS. Sau verdict chỉ cập nhật metadata review trong handoff.

N1 hoàn tất đầu ra tài liệu trên docs local; checklist ngoài Git chỉ tích N1, P1-03/N2–N5/H1–H4 còn mở. Không push trong lượt này. Đây không phải quyết định nghiệm thu backend hoặc phát hành sản phẩm.
