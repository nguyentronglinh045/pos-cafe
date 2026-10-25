# Thông số hệ thiết kế — Hướng A "Teal Chuẩn Hoá", bản 1

Ngày lập: 2026-09-15. Trạng thái: **chờ chủ dự án duyệt**, chưa triển khai.

File này là artefact triển khai, không phải nguồn nội dung báo cáo. Khi viết báo cáo, mô tả ở mức nguyên tắc thiết kế và khả dụng, không chép bảng giá trị hay định danh kỹ thuật vào chương nội dung.

Mọi tỉ lệ tương phản ghi dưới đây là số đo WCAG 2.1 thật, tính trên cặp màu cụ thể, không ước lượng. Ngưỡng áp dụng: chữ thường **4,5:1**, chữ lớn và thành phần giao diện **3:1**.

---

## 1. Màu

### 1.1 Thang teal

| Token | Mã | Tương phản trên `#FFFFFF` | Được dùng cho |
| --- | --- | --- | --- |
| `--teal-50` | `#F0FDFA` | 1,04 | Nền nhạt, nền badge |
| `--teal-100` | `#CCFBF1` | 1,13 | Nền |
| `--teal-200` | `#99F6E4` | 1,26 | Kẻ nhấn, viền badge |
| `--teal-300` | `#5EEAD4` | 1,48 | Nền |
| `--teal-400` | `#2DD4BF` | 1,86 | Nền |
| `--teal-500` | `#14B8A6` | 2,49 | Nền |
| `--teal-600` | `#0D9488` | 3,74 | Viền và icon — **không đủ cho chữ** |
| `--teal-700` | `#0F766E` | 5,47 | Chữ màu chính, nền nút chính |
| `--teal-800` | `#115E59` | 7,58 | Hover nút chính |
| `--teal-900` | `#134E4A` | 9,48 | Active nút chính |

Quy tắc: chữ màu chính chỉ lấy từ `teal-700` trở xuống.

### 1.2 Thang trung tính

| Token | Mã | Trên `#FFFFFF` | Trên `#F4F6F9` | Được dùng cho |
| --- | --- | --- | --- | --- |
| `--nt-0` | `#FFFFFF` | — | — | Bề mặt thẻ, panel |
| `--nt-25` | `#F8FAFC` | — | — | Bề mặt phụ, chân panel |
| `--nt-50` | `#F4F6F9` | — | — | Nền ứng dụng |
| `--nt-100` | `#EAEEF4` | — | — | Nền chìm, control vô hiệu |
| `--nt-200` | `#D5DCE6` | 1,38 | — | **Kẻ phân cách** — không có ngưỡng bắt buộc |
| `--nt-300` | `#BFC8D6` | 1,69 | — | Nền |
| `--nt-400` | `#7F8A9D` | 3,49 | 3,22 | **Viền điều khiển** — đạt ngưỡng 3:1 trên cả hai nền |
| `--nt-500` | `#667183` | 4,94 | 4,56 | Chữ cấp ba |
| `--nt-600` | `#5B6678` | 5,81 | 5,36 | Chữ phụ |
| `--nt-700` | `#414B5C` | 8,80 | — | Chữ nhấn |
| `--nt-800` | `#2A3345` | 12,67 | — | Dự phòng |
| `--nt-900` | `#16202F` | 16,38 | 15,13 | Chữ chính |

Hai giá trị `nt-400` và `nt-500` đã được chỉnh so với đề xuất ban đầu: `#8A94A6` chỉ đạt 2,82 trên nền ứng dụng và `#6E7A8E` chỉ đạt 4,34 trên nền trắng — cả hai đều trượt ngưỡng.

### 1.3 Màu ngữ nghĩa

| Token | Mã | Trên `#FFFFFF` | Trên nền nhạt cùng cặp |
| --- | --- | --- | --- |
| `--success` | `#15803D` | 5,02 | 4,76 trên `#ECFDF3` |
| `--warning` | `#9A5B08` | 5,42 | 4,97 trên `#FDF4E7` |
| `--danger` | `#B4251E` | 6,51 | 5,91 trên `#FEF1F0` |

Cả ba cặp chữ/nền đều đạt 4,5:1, nên badge và banner không cần đổi màu chữ theo nền.

### 1.4 Token theo vai trò

Component **chỉ được tham chiếu nhóm này**, không tham chiếu thang màu trực tiếp. Đây là tiền đề để thêm dark mode và theme riêng theo cửa hàng về sau mà không phải sửa component.

| Vai trò | Trỏ tới | Ghi chú |
| --- | --- | --- |
| `--bg` | `nt-50` | Nền ứng dụng |
| `--surface` | `nt-0` | Bề mặt chính |
| `--surface-2` | `nt-25` | Chân panel, vùng tổng kết |
| `--surface-sunk` | `nt-100` | Control vô hiệu |
| `--ink` | `nt-900` | Chữ chính |
| `--ink-2` | `nt-700` | Chữ nhấn |
| `--ink-3` | `nt-500` | Chữ cấp ba |
| `--muted` | `nt-600` | Chữ phụ, nhãn |
| `--line` | `nt-200` | Kẻ phân cách |
| `--line-control` | `nt-400` | Viền ô nhập và nút |
| `--primary` | `teal-700` | Hành động chính |
| `--primary-hover` | `teal-800` | |
| `--primary-soft` | `teal-50` | Nền trạng thái đang chọn |
| `--primary-line` | `teal-200` | Viền trạng thái đang chọn |

**Lỗi đang sửa:** hiện tại một token `--line` (`#d7dee8`, 1,35:1) dùng cho cả kẻ phân cách lẫn viền ô nhập. Viền điều khiển phải đạt 3:1 theo WCAG 1.4.11. Hệ mới tách làm hai.

---

## 2. Chữ

Bộ chữ: **Be Vietnam Pro**, dựng riêng cho dấu tiếng Việt. Dự phòng: `"Segoe UI", system-ui, -apple-system, sans-serif`. Không đưa Georgia hoặc serif web mặc định vào chuỗi dự phòng — các face đó vỡ dấu tiếng Việt.

### 2.1 Sáu bậc, theo breakpoint

| Bậc | compact `< 900px` | default `900–1279px` | wide `≥ 1280px` | line-height | Dùng cho |
| --- | --- | --- | --- | --- | --- |
| `display` | 24px | 28px | 32px | 1.15 | Số tiền tổng, số tiền phải trả |
| `title` | 18px | 22px | 24px | 1.2 | Tiêu đề drawer |
| `subtitle` | 16px | 17px | 17px | 1.3 | Tiêu đề panel, nhãn nút cỡ xl |
| `body` | 14px | 15px | 15px | 1.5 | Chữ thân, tên món |
| `small` | 12px | 13px | 13px | 1.45 | Chữ phụ, ghi chú, meta |
| `label` | 11px | 11px | 11px | 1.3 | Nhãn trường, tiêu đề nhóm |

`label` luôn viết hoa, `letter-spacing: .08em`, màu `--muted`.

### 2.2 Bốn độ đậm và nơi được phép dùng

| Độ đậm | Giá trị | Chỉ dùng cho |
| --- | --- | --- |
| `regular` | 400 | Mọi chữ thân, tên món, giá trị dòng tiền thường |
| `medium` | 500 | Nhãn trường, trạng thái, chip, nút cấp thấp |
| `semibold` | 600 | Tiêu đề, tên món trong giỏ, nhãn nút |
| `bold` | 700 | **Chỉ** số tiền tổng và nhãn nút hành động chính |

Hiện trạng dùng 328 lượt in đậm và không một lượt nào ở mức 400 hay 500, trong đó 103 lượt ở mức 900. Đây là thay đổi tạo khác biệt thị giác lớn nhất — lớn hơn cả đổi màu.

---

## 3. Khoảng cách và gap

Thang gốc 4px: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48**. Không dùng giá trị ngoài thang.

| Biến | compact `< 900px` | default `900–1279px` | wide `≥ 1280px` | ultra `≥ 1600px` |
| --- | --- | --- | --- | --- |
| `--page-pad` — lề vùng nội dung | 8px | 12px | 16px | 20px |
| `--pane-gap` — gap giữa hai vùng | 8px | 10px | 12px | 12px |
| `--card-pad` — lề trong thẻ | 10px | 12px | 14px | 14px |
| Gap bàn phím số | 8px | 8px | 8px | 8px |
| Gap lưới món trong thực đơn | 8px | 8px | 8px | 8px |
| Gap giữa các nút trong nhóm | 8px | 8px | 8px | 8px |
| Padding dòng danh sách | 10px / 12px | 10px / 12px | 10px / 12px | 10px / 12px |

Hiện trạng dùng 955 giá trị px tuỳ ý và ở bậc `≤ 900px` bóp gap bàn phím xuống 4px — đây là lúc ngón tay cần khoảng cách nhất.

---

## 4. Bo góc, đổ bóng, vùng chạm

| Biến | Giá trị | Dùng cho |
| --- | --- | --- |
| `--radius-control` | 6px | Nút, ô nhập, tab, chip, phím số |
| `--radius-surface` | 10px | Thẻ, panel, drawer, popup |
| `--radius-pill` | 999px | Ngoại lệ duy nhất — badge trạng thái |
| `--elev-1` | `0 1px 2px rgb(22 32 47 / .06)` | Control nổi, hover |
| `--elev-2` | `0 4px 12px rgb(22 32 47 / .10)` | Popup, dropdown |
| `--elev-3` | `0 16px 40px rgb(22 32 47 / .16)` | Drawer, modal |

Hiện trạng có 7 bán kính (5, 6, 7, 8, 9, 10, 20px) và 35 đổ bóng tự chế.

### Chiều cao control — sàn 44px

| Biến | compact `< 900px` | default và wide | Dùng cho |
| --- | --- | --- | --- |
| `--ctl-md` | 44px | 44px | Mặc định cho mọi control, kể cả trong bảng quản trị |
| `--ctl-lg` | 52px | 52px | Hành động POS, phím số |
| `--ctl-xl` | 52px | 60px | Xác nhận tiền — hạ ở compact vì màn thấp |

Nút biểu tượng: 44 × 44px. Ô đánh dấu trong danh sách chọn món: 24 × 24px, đặt trong dòng cao tối thiểu 44px.

Hiện trạng có 52 control dưới 44px; nút liên quan tiền trong đầu màn thanh toán là 36px và hạ xuống 30px ở bậc `≤ 900px`.

---

## 5. Breakpoint

Bốn mốc, thay cho 10 mốc tự đặt hiện tại và bỏ hẳn việc trộn với lớp `sm:` `md:` `xl:` mặc định.

| Tên | Ngưỡng | Thiết bị mục tiêu |
| --- | --- | --- |
| `bp-compact` | `< 900px` | Điện thoại ngang, tablet nhỏ |
| `bp-default` | `≥ 900px` | Tablet ngang — mốc 1024 × 768 nằm trong vùng này |
| `bp-wide` | `≥ 1280px` | Desktop |
| `bp-ultra` | `≥ 1600px` | Màn rộng, giới hạn bề ngang nội dung |

Dưới 640px và ở hướng dọc: hiện hướng dẫn xoay máy, không bố trí lại.

---

## 6. Bố cục

Một biến duy nhất cho mọi bố cục chính–phụ:

```
--pane-side: clamp(300px, 30%, 380px);
```

| Bậc | Hành vi |
| --- | --- |
| `< 900px` | Hai vùng xếp dọc, một cột |
| `≥ 900px` | `minmax(0, 1fr)` cho vùng chính, `--pane-side` cho vùng phụ |

Biến thể danh sách bên trái dùng đúng con số đó, chỉ đổi thứ tự cột.

Hiện trạng dùng năm tỉ lệ khác nhau cho cùng một dạng bố cục, và ở màn thanh toán còn đặt `min-width: 720px` khiến vùng nội dung cuộn ngang thay vì xếp dọc ở bậc nhỏ.

---

## 7. Thông số theo từng màn

### 7.1 Thanh toán — `01-thanh-toan.html`

| Vùng | Giá trị |
| --- | --- |
| Bố cục | `master-detail`: món trong đơn ở vùng chính, quầy thu ngân ở vùng phụ `--pane-side`. Xếp dọc dưới 900px. |
| Đầu màn | Nền `--surface`, kẻ dưới `--line`, padding `--sp-3`. Nhãn nhóm `label`, tiêu đề `title` / 600, meta `small` / `--muted`. |
| Dòng món | Lưới `auto minmax(0,1fr) auto auto`, gap `--sp-3`, padding `10px --sp-3`, kẻ dưới `--line`. Ô đánh dấu 24px. Tên món `body` / 400. Số tiền `body` / 500, `tabular-nums`. |
| Món chưa chọn | Nền `--surface-2`, tên và số tiền chuyển `--ink-3`. Không dùng riêng màu — dòng vẫn còn ô đánh dấu bỏ trống. |
| Nút tăng giảm | 44 × 44px, viền `--line-control`, bo `--radius-control`. |
| Chân vùng chính | Nền `--surface-2`, hai dòng tiền cỡ `small`, hàng in ấn gồm ô đánh dấu và một nút phụ. |
| Khối tiền phải trả | Nền `--primary-soft`, kẻ dưới `--primary-line`, nhãn `label` màu `--primary`, số tiền `display` / 700. |
| Ô tiền khách đưa | `input--money`: cao 44px, viền `--line-control`, cỡ `title`, căn phải, `tabular-nums`. |
| Bàn phím số | Lưới 3 cột, gap `--sp-2` ở **mọi** bậc, phím cao `--ctl-lg` 52px, cỡ `subtitle` / 600. |
| Gợi ý mệnh giá | Lưới 3 cột, gap `--sp-2`, chip cao 44px. |
| Khối kết toán | Nền `--surface-2`, kẻ trên `--line`. "Phải trả" dùng `money-row--grand`: nhãn `body` / 600, số `display` / 700. "Tiền thối" dùng `money-row--change`: cả nhãn và số màu `--success`, số cỡ `subtitle` / 600. |
| Nút thanh toán chân màn | `btn--xl btn--block`: cao 60px (52px ở compact), nền `--primary`, chữ `--primary-ink`, cỡ `subtitle` / 700. |

### 7.2 Đơn hàng — `02-don-hang.html`

| Vùng | Giá trị |
| --- | --- |
| Bố cục | `master-detail`: thực đơn ở vùng chính, giỏ hàng ở vùng phụ `--pane-side`. |
| Dải nhóm món | Chip cao 44px, gap `--sp-2`, padding `--sp-3`, cuộn ngang khi tràn. |
| Lưới món | `repeat(auto-fill, minmax(150px, 1fr))`, gap `--sp-2`. Ở compact: `minmax(132px, 1fr)`. |
| Thẻ món | Cao tối thiểu 76px, padding `10px --sp-3`, viền `--line-control`, bo `--radius-control`. Tên `body` / 500, giá `small` / `--muted`, nhãn "Tuỳ chọn" cỡ `label` màu `--primary`. |
| Món hết hàng | Nền `--surface-sunk`, viền `--line`, chữ `--ink-3`, `aria-disabled="true"`. Có chữ "Tạm hết", không chỉ làm mờ. |
| Dòng giỏ hàng | Hai hàng: hàng trên tên và tiền, hàng dưới nhóm tăng giảm cùng nút bỏ món. Nhờ vậy nút tăng giảm giữ đủ 44px kể cả khi tên món dài. |
| Cảnh báo chưa lưu | `banner--warning`, nền `--warning-soft`, chữ `--warning`, cỡ `small`, luôn kèm chữ "Chưa lưu". |
| Chân giỏ hàng | "Tạm tính" cỡ `small` / 400; "Tổng" dùng `money-row--grand`, số cỡ `display` / 700. Nút gửi đơn `btn--xl btn--block`. |

### 7.3 Sơ đồ bàn — `03-so-do-ban.html`

| Vùng | Giá trị |
| --- | --- |
| Khung ứng dụng | Rail điều hướng 176px, thu còn 68px ở bậc `< 900px` với nhãn chữ ẩn theo lối trợ năng. |
| Thanh công cụ | Cao tối thiểu 56px, nền `--surface`, kẻ dưới `--line`. Nhóm khu vực và nhóm lọc ngăn nhau bằng một vạch `--line` rộng 1px. Nút làm mới đẩy về cuối. |
| Vùng sơ đồ | Giữ đúng dạng sân khấu không gian hiện hành: bàn đặt theo toạ độ, có vật trang trí. Nền `--surface-2`, lưới ô 32px vẽ bằng `--nt-100`, viền `--line`, bo `--radius-control`. |
| Bàn vuông | 92 × tối thiểu 68px, viền `--line-control`, bo `--radius-control`. |
| Bàn tròn | 86 × 86px, bo `--radius-pill`. |
| Bàn đang phục vụ | Nền `--primary-soft`, viền `--primary`, **kèm chữ** "Đang phục vụ" cỡ `label` màu `--primary` và số tiền cỡ `small` / 700. |
| Bàn trống | Nền `--surface`, viền `--line-control`, **kèm chữ** "Trống". Không có số tiền. |
| Chú giải | Đặt ngay dưới sơ đồ, nêu rõ trạng thái không truyền bằng riêng màu. |
| Rail đơn đang mở | `clamp(196px, 22%, 240px)`, xếp xuống dưới ở bậc `< 900px`. Thẻ đơn padding 10px, mã đơn `small` / 600, số tiền `small` / 700, meta `label` / `--muted`. |

---

## 8. Ràng buộc đã tuân thủ

| Ràng buộc | Cách tuân thủ |
| --- | --- |
| Giữ nguyên số bước nghiệp vụ | Bộ hành động trên cả ba màn giữ nguyên: không thêm, không bớt. Chỉ đổi vị trí, nhóm và thứ bậc thị giác. |
| Landscape-first | Bố cục hai vùng ở `≥ 900px`; xếp dọc ở compact; dưới 640px và hướng dọc vẫn hiện hướng dẫn xoay máy. |
| Tối đa hai vùng nội dung mỗi màn | Cả ba màn đều đúng hai vùng. |
| Không dùng từ nội bộ trong giao diện | Không xuất hiện các từ nội bộ trong mọi nhãn của ba bản mẫu. |
| Dense, hướng vận hành | Giữ mật độ cao; không dùng ảnh lớn hay khối trang trí chiếm chỗ thông tin. |
| Không truyền trạng thái chỉ bằng màu | Trạng thái bàn, món chưa chọn, món hết hàng và cảnh báo chưa lưu đều kèm nhãn chữ. |

## 9. Hợp đồng định danh phần tử

Đo trên 85 tệp kiểm thử, 11.035 dòng: 873 trong 991 lượt chọn phần tử bám `data-testid`, vốn **không phụ thuộc vị trí**. Phần gãy khi đổi bố cục là 55 lượt bám quan hệ cha con, 34 lượt kiểm tra nội dung trên khối bao, và 9 khẳng định hình học trong kiểm thử đầu cuối.

Quy tắc bắt buộc khi triển khai:

1. Phần tử **đổi chỗ** thì **giữ nguyên** định danh kiểm thử.
2. Chỉ đổi định danh khi phần tử thực sự bị xoá hoặc gộp, và phải khai trong đặc tả kèm lý do.
3. Ba bản mẫu trong thư mục này đã giữ nguyên toàn bộ định danh của các phần tử tương ứng, để đối chiếu trực tiếp.

## 10. Ranh giới kỹ thuật

| Phần | Quyết định |
| --- | --- |
| Tailwind | Nguồn sự thật duy nhất cho màu, khoảng cách, bo góc, chữ, bố cục và bảy primitive. |
| MUI giữ lại | Các widget khó làm trợ năng đúng: hộp chọn, công tắc, chú giải nổi, trình đơn, và phần quản lý tiêu điểm của hộp thoại. |
| MUI bỏ | Nút và ô nhập văn bản chuyển về primitive. Đây là 142 chỗ đang gây lệch chiều cao, tiêu điểm và hiệu ứng nhấn so với 114 nút tự chế. |
| Theme MUI | Suy ra từ token, không khai màu riêng. Hiện chỉ đồng bộ đúng ba thuộc tính. |
