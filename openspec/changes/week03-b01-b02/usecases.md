# Use cases

Ngày 24/10/2026. Phạm vi được chủ dự án chốt: chỉ B01 và B02, repo nguyentronglinh045/pos-cafe, tác giả commit và người tạo PR 24tx610002-VoVanNgoc. Màu/font/reference đã duyệt giữ nguyên. Hai runtimecontract app5191/ref4185 được duyệt qua phản hồi “Duyệt hai hợp đồng runtime B01–B02”. Không merge/deploy.

## UC01 — chọn khu vực và mở bàn
Actor: nhân viên đã có phiên mock/phiên hiện hữu; precondition FloorPlan tải thành công,landscape>=568×320.

| Input | Kiểu/điều kiện | Ví dụ |
| --- | --- | --- |
| areaId | UUID/string ID hiện hữu trong FloorPlan.areas | ID Tầng trệt hoặc Lầu1 |
| name | string hiện hữu, không cắt dữ liệu; stress>=80ký tự | Khu vực tầng5… |
| tableId | UUID thuộc area đang chọn | B02 |
| filter | enum all/empty/occupied | all |

Chọn lầu→đọc tablecount→lọc→cuộn canvas khi cần→mở bàn. Nút cuộn không chọn lầu. Khi resize giữ active và hit targets. Exception: dữ liệu lỗi/loading/empty giữ trạng thái đang có; TABLE_NOT_FOUND/NOT_FOUND/UNKNOWN được xử lý theo src/core/appError.ts:4–19 và businessUC remake-b01,không thêm errorcode.

| Output | Kết quả chấp nhận |
| --- | --- |
| activeAreaId/tables | cùng ID,đúng filter/count,tọa độ logic giữ |
| orderContext | bàn/đơn cũ được refetch và mở đúng |

## UC02 — gọi món và quản lý đơn
Actor: nhân viên có quyền hiện hữu; precondition menu/đơn tải được và bảnggiá/modifier từ ports hiện hữu.

| Input | Kiểu/điều kiện | Ví dụ |
| --- | --- | --- |
| menuItemId | UUID có trong menu và available | Americano |
| quantity | số nguyên theo validator đang có |1;stress999 |
| modifier IDs | danh sách UUID thuộc optiongroup hiện hữu | SizeL |
| note | string theo giới hạn hiện hữu; stress120ký tự | Ít đá |
| exitDecision | enum keep/discard |keep |

Tìm/chọn món→modifier→thêm giỏ→đổi số lượng/ghi chú→giữ hoặc bỏdraft khi đóng→lưu/gửi→đóng inbếp→B01cùng lầu. Đơn đã lưu có thể bàn giaoPaymentDrawer hiệnmain rồi quay lại, không remakepayment. Exception giữ code/state/message theo remake-b02 và core:AUTH_REQUIRED/FORBIDDEN,ORDER_VERSION_CONFLICT,MENU_ITEM_UNAVAILABLE,OPTION_VALUE_UNAVAILABLE,INVALID_ORDER_ITEMS/UNKNOWN;không thêm/mở rộng quyền. BypassUI dùng bộcore/mockprotocoltest hiện có.

| Output | Kết quả chấp nhận |
| --- | --- |
| draft/total |125k+Americano35k=160k;discardtrở125k |
| savedorder/receipt |càphêsữaSizeL36k;inbếp36k |
| area/tablecontext |giữ Lầu1 vàID/tọađộ sauclose/lưu/return |

## UC03 — kiểm chứng và tạo PR tuần3
Actor: developer/agent; precondition hai runtimecontractđãduyệt và GitHub API xácminhlogin24tx610002-VoVanNgoc,id227207168,pushtrue. Input:branch/sourcefingerprint,referencebundle,gatecommands. Chạy tất cảgate/đọc ảnh/classify→hai review→kiểm blob scope→commitASCII Tuan3→push hai nhánhriêng→tạo draftPR vềmain/docs đúngaccount. Output:commit/PRlinks với author kiểm lại. Thiếu xác thực hoặcgateFAIL không hợp lệ phải dừng xuấtbản; không giấu lỗi/auditFAIL, khôngmerge/deploy.
