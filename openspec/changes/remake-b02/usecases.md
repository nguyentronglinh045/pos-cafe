# B02 — Use cases đề xuất

## UC-B02-01 — Tìm và chọn món

Actor: admin/cashier có modulePOS. Mục tiêu: chọn đúng món đang bán. Tiền điều kiện: login hợp lệ, drawer/context tại bàn đã mở.

| Input | Kiểu/ràng buộc | Ví dụ |
|---|---|---|
| categoryId | UUID thuộc menu.categories; giữ fallback danh mục đầu | c68d7fbd-c06a-42a4-8140-476da8ebbf74 |
| search | string Unicode, cho rỗng; không thêm trim/maxlength mới; so includes lower-case toàn menu | Americano |
| itemId | UUID thuộc menu.menuItems; isAvailable=true để thêm | 80cfbd5a-a538-4da6-888d-2f732b7b8e2d |

Luồng chính: chọn danh mục → hệ thống lọc; nhập search → tìm toàn menu; bấm món không modifier → thêm nháp. Thay thế: món có modifier mở popup hiện hữu, confirm mới thêm; cancel giữ draft. Ngoại lệ UNKNOWN query: giữ “Không tải được menu”/“Thử tải lại” theo OrderMenuPane; sold-out disabled, không phát sinh ghi. validateModifierSelection trong core/orderDraft.ts trả boolean. Khi invalid, ModifierPickerPopup khóa nút Thêm vào đơn và handleConfirm return; không throw/toast hoặc thêm mã lỗi từ validation này.

| Output | Kiểu/tác dụng |
|---|---|
| draftItems | SubmitOrderDraftItem[], item/options/quote hiện hành; chỉ local trước gửi |
| category/search | UUID/string UI state; đổi danh mục xóa search |

Acceptance: đúng item/price/modifiers; không thêm unavailable; popup target/focus tới được. Truy vết B02-02,03,06,08.

## UC-B02-02 — Sửa giỏ và ghi chú

Actor: admin/cashier. Mục tiêu: chỉnh lượng và ghi chú giữ đúng giá. Tiền điều kiện: cart/draft đã được dựng, không write-blocked.

| Input | Kiểu/ràng buộc | Ví dụ |
|---|---|---|
| lineId | string ID có trong draft; saved giữ sourceItemId UUID | dòng Cà phê sữa |
| delta | integer -1/+1; nhánh saved+ gọi addDraftMenuItem, saved−/new± clamp0…999 như orderFlow | -1 |
| note | string Unicode hoặc null; không thêm maxlength chưa có | Ít đá |

Luồng chính: saved+ KHÔNG tăng quantity của dòng saved: giữ nguyên snapshot/sourceItemId của dòng cũ, kiểm menu/options hiện hành rồi addDraftMenuItem một dòng gọi thêm (hoặc tăng dòng thêm tương thích) với quotedBasePrice/quotedPriceDelta hiện hành. Saved− và new± mới clamp quantity0…999 của dòng được chọn. Sau đó buildCartLines/calculateCartTotal; Ghi chú chỉ cập nhật note của dòng. Thay thế: quantity0 dòng mới bị loại; saved0 vẫn còn draft để gửi thay đổi, cart không hiển thị. Ngoại lệ MENU_ITEM_UNAVAILABLE khi tăng saved: “Món không còn khả dụng. Vui lòng chọn lại.”; OPTION_VALUE_UNAVAILABLE giữ mapping hiện tại.

| Output | Kiểu/tác dụng |
|---|---|
| draftItems | mảng draft, sourceItemId/options/snapshot không bị tái tạo sai |
| total | number VND từ calculateCartTotal, không tính riêng cho UI |

Acceptance: saved+ giữ nguyên qty/giá/options cũ và thêm lượng mới theo giá/options hiện hành; saved−/new± ở0/1/999 đúng, ghi chú/option và tiền đúng; không thay đổi DB trước submit. Truy vết B02-04,08.

## UC-B02-03 — Gửi đơn hoặc đi thanh toán

Actor: nhân viên có order.create/update/voidOpen hoặc payment.take tương ứng. Mục tiêu: xác nhận đúng hành động hiện hành. Tiền điều kiện: context, employee session và dữ liệu cần thiết; không pending/blocked/remoteConflict/priceChanged.

| Input | Kiểu/ràng buộc | Ví dụ |
|---|---|---|
| context | orderId UUID|null, tableId UUID|null, orderType dine_in/takeaway; giữ hiện hữu | B02/order24 |
| actor | Employee với quyền hiệu lực tại flow/server | admin/cashier |
| items/version | SubmitOrderDraftItem[]; expectedVersion integer|null theo editingOrder | version3 |

Luồng chính: clean order mở → Thanh toán → openPayment đúng id; dirty → In/Gửi đơn → useSubmitOrderMutation với payload/K hiện hữu → success đúng view mới previewbếp phần thêm và đóng drawer. Thay thế: closed disabled; recovery/retry không preview lặp, giữ immutableK/payload.

Ngoại lệ FORBIDDEN: “Tài khoản hiện tại không có quyền thực hiện thao tác này.”; ORDER_VERSION_CONFLICT: “Dữ liệu đơn vừa được cập nhật từ thiết bị khác. Tải lại đơn trước khi tiếp tục.”; PRICE_CHANGED/WRITE_RESULT_UNKNOWN giữ notice+recovery hiện hữu, không tự gửi lại. Không thêm mã/thông báo mới. UNKNOWN fallback: “Thao tác chưa hoàn tất. Hãy thử lại hoặc kiểm tra kết nối.”

| Output | Kiểu/tác dụng |
|---|---|
| navigation | payment(orderId) hoặc đóng drawer sau success hiện hữu |
| write/receipt | kết quả giao thức hiện hữu; phần đã lưu giữsource ID, previewbếp initialSuccess một lần |

Acceptance: nhãn/disabled đúng primaryAction; thiếu quyền gọi trực tiếp flow cũng bị từ chối; duplicate/retry/price/conflict không đổi giao thức. Truy vết B02-05,06,09,10.

## UC-B02-04 — Đóng nháp

Actor: nhân viên đang ở drawer. Mục tiêu: rời màn không mất nháp ngoài ý muốn. Tiền điều kiện: exit guard đã đăng ký.

| Input | Kiểu/ràng buộc | Ví dụ |
|---|---|---|
| action | close / pending navigation callback theo drawerNavigation hiện hữu | Đóng |
| decision | keep/discard chỉ khi guard phát hiện draftChanged | Tiếp tục chỉnh sửa |

Luồng chính: nhấn Đóng → nếu dirty và coordinator cho phép, hiện “Bỏ đơn chưa gửi?”/“Các món vừa chọn sẽ không được lưu.” → keep giữ draft, discard chạy pending navigation. Thay thế: clean đóng ngay; blocked attempt theo guard hiện có. Không có ngoại lệ domain mới cho cancel/keep.

| Output | Kiểu/tác dụng |
|---|---|
| drawer/draft | giữ nguyên khi keep; navigation/discard như useAppStore/guard hiện tại |

Acceptance: không bypass dirty guard bằng thay đổi layout; popup/CTA có thể thao tác ở568×320. Truy vết B02-01,07,08.

## UC-B02-05 — Dùng UI theo viewport và theme chung

Actor: admin/cashier. Mục tiêu: tới được món, giỏ và CTA trên thiết bị ngang. Tiền điều kiện: chuẩn Palette A/Be Vietnam Pro đã chốt.

| Input | Kiểu/ràng buộc | Ví dụ |
|---|---|---|
| viewport | integer CSSpx width>=568,height>=320,width>height | 568×320 |
| palette | canonical JSON gồm22semanticcolors; không tạo palette B02 | primary từ palette-a-v1.json |
| modality | pointer/touch/keyboard; scroll containers độc lập | Tab/Enter, chạm |

Luồng chính: mở drawer → categories/menu/cart bố trí theo contract → cuộn/focus/thêm/sửa/CTA tới được. Thay thế: các breakpoint chuyển categories ngang; danh sách/tên dài cuộn hoặc ellipsis có tên đầy đủ. Không có ngoại lệ domain mới từ viewport/theme.

| Output | Kiểu/tác dụng |
|---|---|
| rendered UI | targets>=44, không overflowpage/che CTA, CSS/Tailwind/MUI cùng token/font |

Acceptance: matrix/sweep/biên và runtime token update đạt, không suy emulator thành máy thật. Truy vết B02-08,09,10.
