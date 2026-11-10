# Ma trận truy vết

Cập nhật 2026-11-10. Cả 106 test case chưa chạy. Bảng được lập từ cột Truy vết của `testplan.md` và dòng Truy vết của `usecases.md`.

| Requirement | Use case | Test case |
| --- | --- | --- |
| REQ-OWNER-01 — Xác minh email riêng cho mỗi lần tạo quán | UC-OWNER-01, 02, 05 | TC-OWNER-07, 27, 39, 103, 104 |
| REQ-OWNER-02 — Gửi mã tạo quán | UC-OWNER-01, 02 | TC-OWNER-01, 11, 12, 15, 16, 19, 20, 31, 32, 35, 06, 103 |
| REQ-OWNER-03 — Kiểm mã trước, kiểm thông tin sau | UC-OWNER-02 | TC-OWNER-02, 12, 17, 18, 20, 21, 23, 25, 37, 45, 103 |
| REQ-OWNER-04 — Gửi lại an toàn khi mất phản hồi | UC-OWNER-01, 02, 03, 04, 09, 10, 11, 12, 13 | TC-OWNER-04, 05, 13, 14, 22, 34, 45, 55, 74, 96, 106 |
| REQ-OWNER-05 — Mỗi email làm chủ tối đa 5 quán | UC-OWNER-02, 05, 06, 12 | TC-OWNER-07, 24, 33, 66, 81, 103, 105 |
| REQ-OWNER-06 — F5 bỏ form, giữ mã tra sau Xác nhận | UC-OWNER-01, 02, 03, 04 | TC-OWNER-06, 28, 101, 104, 106 |
| REQ-OWNER-07 — Quy tắc chung của mã xác nhận | UC-OWNER-01, 02, 09, 10, 11, 12, 13 | TC-OWNER-19, 20, 31, 32, 64, 75, 76, 80, 83, 84, 97, 99, 102, 06, 103 |
| REQ-OWNER-08 — Thao tác của chủ quán trong Cài đặt | UC-OWNER-09, 11, 12, 13 | TC-OWNER-77, 85, 86, 97 |
| REQ-OWNER-09 — Quên Store Key | UC-OWNER-08 | TC-OWNER-49, 50, 51, 100 |
| REQ-OWNER-10 — Cấp lại Store Key | UC-OWNER-09 | TC-OWNER-52, 53, 54, 55, 87 |
| REQ-OWNER-11 — Quên PIN chỉ dành cho chủ quán | UC-OWNER-10 | TC-OWNER-56, 57, 58, 59, 86, 97 |
| REQ-OWNER-12 — Đổi email chủ | UC-OWNER-11 | TC-OWNER-60, 61, 62, 63, 64, 88, 99 |
| REQ-OWNER-13 — Chuyển quyền sở hữu quán | UC-OWNER-12 | TC-OWNER-65, 66, 67, 68, 69, 84, 88, 89, 90, 97, 98, 99 |
| REQ-OWNER-14 — Reset dữ liệu quán | UC-OWNER-13 | TC-OWNER-70, 71, 72, 73, 74, 102 |
| REQ-OWNER-15 — Nhật ký thao tác quản trị | UC-OWNER-11, 12, 13 | TC-OWNER-60, 65, 79 |
| REQ-OWNER-16 — Chặn thư mẫu của Supabase Auth | UC-OWNER-02 | TC-OWNER-78 |
| REQ-STORE-01 — Tạo cửa hàng ở phía server | UC-OWNER-02, 06 | TC-OWNER-02, 27, 47, 103, 104 |
| REQ-STORE-02 — Tài khoản kỹ thuật không gửi thư, không bị chiếm | UC-OWNER-02, 06 | TC-OWNER-02, 40, 41, 104 |
| REQ-STORE-03 — Giữ an toàn khi chưa rõ kết quả tạo quán | UC-OWNER-03, 06 | TC-OWNER-08, 29, 30, 42, 46, 47, 48, 105 |
| REQ-STORE-04 — Giao Store Key cho chủ | UC-OWNER-02, 03, 04, 06 | TC-OWNER-02, 05, 10, 26, 36, 38, 44, 82, 101, 104, 106 |
| REQ-STORE-05 — Bảo mật Store Key | UC-OWNER-02 | TC-OWNER-43 |
| REQ-STORE-06 — Dữ liệu mẫu tùy chọn | UC-OWNER-02, 07 | TC-OWNER-03, 09 |
| REQ-SESSION-01 — Ba tầng danh tính tách bạch | UC-OWNER-02 | TC-OWNER-91, 104 |
| REQ-SESSION-02 — Nhân viên vai trò chủ quán | UC-OWNER-10, 12 | TC-OWNER-59, 90, 92, 98 |
| REQ-ISOLATION-01 — Cô lập ở tầng database | Không có use case; xem giải trình | TC-OWNER-93 |
| REQ-ISOLATION-02 — Phạm vi của mô hình cô lập | UC-OWNER-05 | TC-OWNER-94 |
| REQ-ISOLATION-03 — Khóa cửa hàng ở tầng database | Không có use case; xem giải trình | TC-OWNER-95 |

**Mỗi use case có test case:** UC-OWNER-01 (01, 06, 103, 104, 04, 11, 12, 13, 14, 15, 16, 32, 34, 35, 37, 45, 80); UC-OWNER-02 (02, 28, 103, 104, 03, 10, 12, 17, 18, 19, 20, 21, 22, 23, 25, 27, 31, 37, 39, 40, 43, 45, 46, 78, 91); UC-OWNER-03 (05, 101, 104, 106, 10, 22, 26, 30, 34, 36, 38, 48, 82); UC-OWNER-04 (06, 28, 101, 104, 106); UC-OWNER-05 (07, 24, 33, 81, 94, 103, 105); UC-OWNER-06 (08, 29, 30, 41, 42, 44, 46, 47, 105); UC-OWNER-07 (09); UC-OWNER-08 (49, 50, 51, 100); UC-OWNER-09 (52, 53, 54, 55, 75, 77, 83, 85, 86, 87, 97); UC-OWNER-10 (56, 57, 58, 59, 75, 86, 96, 97); UC-OWNER-11 (60, 61, 62, 63, 64, 77, 83, 85, 86, 88, 96, 97, 99); UC-OWNER-12 (65, 66, 67, 68, 69, 77, 79, 83, 84, 85, 86, 88, 89, 90, 96, 97, 98, 99); UC-OWNER-13 (70, 71, 72, 73, 74, 76, 77, 79, 83, 85, 86, 97, 102).

**Mỗi mã lỗi trong `design.md` có test case:** `A_EMAIL_INVALID` 11, 35; `A_REQUEST_INVALID` 12, 35, 57, 106; `A_REQUEST_ID_STALE` 13, 34; `A_REQUEST_ID_REUSED` 14; `CREATE_INTENT_ID_REUSED` 15; `A_SEND_UNAVAILABLE` 16; `A_OTP_FORMAT_INVALID` 17, 39, 78; `A_OTP_INVALID` 18, 20, 22, 39, 78; `A_OTP_EXPIRED` 19, 31, 67; `A_OTP_ATTEMPTS_EXCEEDED` 20; `A_OTP_UNAVAILABLE` 21, 64, 83, 85, 99, 102; `A_ATTEMPT_ID_REUSED` 22, 45; `CREATE_INTENT_CONFLICT` 22, 23; `OWNER_STORE_LIMIT_REACHED` 24, 33, 81; `RECIPIENT_STORE_LIMIT_REACHED` 66; `CREATE_VERIFY_UNAVAILABLE` 25, 74, 85, 87, 106; `CONFIRM_REJECTED` 26; `CREATE_PROOF_REQUIRED` 27, 39; `OWNER_ROLE_REQUIRED` 77; `STORE_NAME_MISMATCH` 53, 71; `NEW_EMAIL_UNAVAILABLE` 63; `TRANSFER_TARGET_INVALID` 68; `TRANSFER_EMPLOYEE_INVALID` 89, 98; `OWNER_PROOF_REQUIRED` 88; `STORE_SUSPENDED` 86; `STORAGE_UNAVAILABLE` 28. Trạng thái `failed` 29, 48; `unknown` 30, 47, 87. Mã có sẵn dùng lại: `PERMISSION_UPDATE_UNAVAILABLE` 09; `EMPLOYEE_SESSION_REQUIRED` 09, 74, 85, 96; `PIN_CHANGE_REQUIRED` 98; `OWNER_PROTECTED` 59, 92.

| Chỉ số | Giá trị | Ngưỡng |
| --- | --- | --- |
| Số requirement chưa có test case | 0 / 27 | Phải bằng 0 |
| Số use case chưa có test case | 0 / 13 | Phải bằng 0 |
| Số requirement chưa có use case | 2 / 27 | Nên bằng 0 |

Giải trình requirement không có use case: REQ-ISOLATION-01, REQ-ISOLATION-03 là ràng buộc kiến trúc, không phải thao tác của một người dùng; đã có test case.

## Ngoài bảng

| Phần | Tình trạng | Ghi chú |
| --- | --- | --- |
| Đăng nhập chủ bằng mã, phiên chủ, mặt web riêng của chủ | Đã bỏ | Quyết định 23, 24 |
| Tự động đối soát, dọn dẹp và cảnh báo lượt tạo quán chưa rõ | Sau đồ án | Quyết định 48. Các ca REQ-STORE-03 kiểm an toàn, giữ suất và chống trùng trong phạm vi đồ án |
