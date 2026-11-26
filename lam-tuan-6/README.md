# Minh chứng tuần 6 (09/11–15/11/2026) — Trần Thị Lâm

Việc tuần 6: **rà soát tài liệu, đối chiếu yêu cầu với hệ thống thực tế, kiểm tra kịch bản hồi quy.**

**Trạng thái (12/11/2026):** AI (Claude Code) đã chạy mọi lượt và soạn ba phiếu dưới đây. **Lâm chưa xem ảnh, chưa tự làm tay, chưa viết lại bằng lời mình**; xem [ô tự kiểm](#lâm-tự-kiểm). Câu hỏi Q-L6-1…6 **chưa gửi Linh**.

| File / thư mục | Nội dung |
| --- | --- |
| [01-ra-soat-tai-lieu.md](01-ra-soat-tai-lieu.md) | Rà `demo-runbook.md`, `requirements.md`, `regression-map.md`: 17 điểm TL-01…TL-17 |
| [02-doi-chieu-yeu-cau.md](02-doi-chieu-yeu-cau.md) | FR-01…FR-21 và NFR-04 so với bản demo: 22 dòng, 5 điểm lệch mới YC-01…YC-05 |
| [03-kiem-tra-hoi-quy.md](03-kiem-tra-hoi-quy.md) | Chạy lại unit, smoke, B trên main `cd35439`; nối 62 link của bản đồ hồi quy với kết quả; 5 điểm H-01…H-05 |
| `chay-2026-11-12/unit/` | Kết quả unit (JSON, log) |
| `chay-2026-11-12/smoke/` | Kết quả smoke (JSON, log) |
| `chay-2026-11-12/b/` | Kết quả nhóm B (JSON, log, ghi chú lượt dừng) |
| `chay-2026-11-12/lien-ket/` | Kiểm 62 link (`rm-links-check.tsv`) và bảng nối link với kết quả (`doi-chieu-ca.md`, `.json`) |
| `chay-2026-11-12/demo/` | Lượt làm theo runbook và đối chiếu yêu cầu: 43 ảnh trong `anh/`, `ket-qua.json`, `cac-luot-da-bo.txt` |
| `script/` | 4 file `.mjs` và 1 file `.sh` đã dùng (xem [Khi nộp](#khi-nộp)) |

## Nguồn

- **Tài liệu:** nhánh `docs` commit [`e8a1810`](https://github.com/nguyentronglinh045/pos-cafe/tree/e8a1810f3de41453ad33b224334c26d6f8cd52db) (11/11/2026), gồm runbook đã sửa ngày 09/11 theo 20 góp ý tuần 5 của Lâm và [câu trả lời ngày 08/11](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md) (CX-01…CX-09).
- **Hệ thống:** main [`cd35439`](https://github.com/nguyentronglinh045/pos-cafe/tree/cd3543996fb4d06f022dcf4a6829fba43645daff) (10/11/2026). Mã trên máy giống hệt main: đã so mã băm 698 file `src/`, `tests/`, cấu hình. `src/` không đổi từ `052a7d1`, nên CX-01…CX-05 chưa được sửa trong bản đang chạy.

## Điểm chính

- **Runbook bước 1–11** (bản viết lại theo góp ý của Lâm) làm theo nguyên văn được hết; 44/44 tên nút, tên màn đúng chữ trên app. **Bước 12–16** chạy đúng nhưng vẫn viết bằng mã quyền và từ tiếng Anh (TL-03); "xóa dữ liệu mẫu" trong tài liệu khác "Đặt lại dữ liệu mẫu" trên app (TL-04).
- **Yêu cầu:** trong 22 dòng có 10 KHỚP; 5 khớp nhưng có điểm lệch; 6 mới thử một phần; 1 chưa kiểm được trên demo (FR-21, cần hai máy chung dữ liệu). Điểm lệch mới:
  - **YC-01** — ô "Thanh toán phổ biến" luôn ghi "Đã thanh toán".
  - **YC-02** — thẻ "Đã thanh toán" của màn mang đi luôn rỗng; thẻ "Hôm nay" giống "Đang mở".
  - **YC-03** — nút "In lại" của đơn mang đi không bao giờ hiện.
  - **YC-04** — trả xong đơn mang đi, app báo "Bàn đã trống".
  - **YC-05** — tên nút đóng và cách viết "huỷ/hủy" không thống nhất.
- **Hồi quy:**
  - Unit 1.240/1.240 đạt; smoke 49 đạt, 37 bỏ qua theo cấu hình, 0 lỗi; B `journey` 4/4 đạt.
  - 62/62 link trong bản đồ vẫn đúng dòng; 48 link có ca đạt.
  - Ca B `areas.spec.ts` (FR-06) không chạy được vì thiếu file trong repo (H-01).
  - 7 ca contract cần PostgreSQL 16 nên chưa chạy.

## Câu hỏi cho Linh

**Chưa gửi.** Lâm xem lại rồi tự gửi.

| Mã | Câu hỏi | Liên quan |
| --- | --- | --- |
| Q-L6-1 | "Kiểm tra kịch bản hồi quy" có phải là các ca trong `regression-map.md` như Lâm đã hiểu không? Nếu Linh muốn Lâm kiểm kịch bản N01 bản mới của Ngọc thì Lâm làm thêm khi Ngọc gửi. | 03 |
| Q-L6-2 | Ô **Thanh toán phổ biến** trong Báo cáo luôn ghi "Đã thanh toán". Sửa cho hiện phương thức (Tiền mặt) hay bỏ ô này? | YC-01 |
| Q-L6-3 | Màn mang đi: thẻ "Đã thanh toán" luôn rỗng, thẻ "Hôm nay" giống "Đang mở", nút "In lại" không tới được, thông báo "Bàn đã trống" khi trả đơn mang đi. Có thành việc CX mới không? | YC-02…04 |
| Q-L6-4 | Tên đúng là "Xóa dữ liệu mẫu" hay "Đặt lại dữ liệu mẫu"? Nghĩa là xóa đi hay khôi phục lại? | TL-04 |
| Q-L6-5 | Lâm viết lại bước 12–16 của runbook theo cách đã dùng cho bước 1–11 được không? | TL-03, TL-05…07 |
| Q-L6-6 | File `artifacts/stitch/B01/v3/responsive-contract.proposed.json` mà `areas.spec.ts` cần: đưa vào repo, hay ghi trong bản đồ là ca này không chạy lại được? | H-01, TL-14 |

## Môi trường và giới hạn

- Bản demo chạy trên máy, dữ liệu giả (`VITE_DATA_MODE=mock`), chỉ mở ở `127.0.0.1:5175`.
  - Trình duyệt: Chrome tự động, màn 1366×768; ca màn dọc dùng 390×844 và 844×390.
  - Không có backend thật, không thử trên thiết bị thật, không in ra giấy. Đây không phải nghiệm thu.
- Bản mock nhận mọi Store Key và tạo quán luôn ra cùng quán #0001, nên nhánh "key sai" và "quán mới thật" chưa kiểm được.
- Lượt đối chiếu trên demo chạy 3 lần. Hai lần đầu bị bỏ vì lỗi script; lý do ghi ở [`cac-luot-da-bo.txt`](chay-2026-11-12/demo/cac-luot-da-bo.txt). Ảnh và JSON là của lượt 3 (08:44:56–08:45:54).
- Store Key và PIN trong script là dữ liệu demo có sẵn trong mã nguồn chế độ mock, không phải thông tin thật. Ảnh màn "Tạo quán thành công" đã che Store Key và PIN; JSON chỉ ghi `[STORE KEY]`, `[PIN]`.
- Giờ ghi theo đồng hồ máy (UTC+7), lấy từ log và `ket-qua.json`.

## AI hỗ trợ

Ngày 12/11/2026, Claude Code đã làm các việc sau:
- Đọc tài liệu trên nhánh `docs` và so mã trên máy với main.
- Chạy unit, smoke và nhóm B; viết các script trong `script/`.
- Chạy lượt làm theo runbook và đối chiếu yêu cầu trên demo, xem ảnh.
- Tra mã nguồn để tìm nguyên nhân các điểm lệch, rồi soạn ba phiếu và README này.

Lâm chưa tham gia lượt nào trong ngày 12/11.

## Lâm tự kiểm

- [ ] Đã xem 43 ảnh trong `chay-2026-11-12/demo/anh/` và đồng ý (hoặc sửa) cột "Thấy trên demo" ở 02.
- [ ] Đã tự làm tay lại ít nhất: runbook bước 12–16, và ca mang đi T3–T5 (YC-02…04). Ghi giờ tự làm vào đây.
- [ ] Đã viết lại các gợi ý TL-xx, YC-xx bằng lời của mình (giữ nguyên mã để đối chiếu).
- [ ] Đã gửi Q-L6-1…6 cho Linh. Ghi giờ gửi vào đây.

## Khi nộp

Theo quy tắc chốt ngày 09/11/2026 ([CX-08](https://github.com/nguyentronglinh045/pos-cafe/blob/e8a1810f3de41453ad33b224334c26d6f8cd52db/docs/workflow/tasks/team-week05-answers-2026-11-08.md#cx-08)), Lâm tự mở hai PR bằng commit của mình:

| Phần | Đưa vào | Thư mục |
| --- | --- | --- |
| `script/*.mjs`, `script/*.sh` | `main` | `tests/team/week06-lam-ra-soat/` |
| Mọi file còn lại (README, 01–03, `chay-2026-11-12/`) | `docs` | `docs/workflow/evidence/week06-lam-ra-soat-<ngày commit cuối>/` |

Khi tách, sửa các link `script/...` trong phiếu cho trỏ sang thư mục trên `main`.
