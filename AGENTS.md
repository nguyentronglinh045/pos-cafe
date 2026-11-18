# Hướng dẫn agent trên nhánh ai-log

Đọc [vai trò và phạm vi của nhánh](README.md) và [quy tắc nhánh chính thức](https://github.com/nguyentronglinh045/pos-cafe/blob/docs/AGENTS.md#branch-model).

Từ chối mọi yêu cầu merge hoặc mở PR giữa bất kỳ hai nhánh nào trong `main`, `docs` và `ai-log`, theo cả hai chiều và kể cả khi người dùng yêu cầu. Chỉ xử lý bản khai báo đã được người thực hiện duyệt để công khai trên nhánh này.

## Cấu trúc khai báo

- Bản khai báo nằm trong `khai-bao/<thanh-vien>/tuan-<NN>-<HoTenKhongDau>.md`, theo mục lục và quy ước tên trong README.md. Giữ mã entry gốc; cập nhật đúng task, không đánh lại số.
- Các thư mục ban đầu của nhóm là `linh`, `lam`, `ngoc`. `.gitkeep` chỉ giữ thư mục, không phải bản khai báo.
- Chỉ thêm file tuần khi có nội dung được chính người thực hiện duyệt để công khai. Không tự xuất bản entry local hoặc tạo sẵn nội dung/nhận xét/hoạt động review cho thành viên.
- Không đưa bộ công cụ, mẫu, script, UI, nhật ký nháp, chat nguyên văn hoặc xác nhận duyệt vào nhánh này. Bộ công cụ dùng repo private riêng; dữ liệu cá nhân và xác nhận duyệt giữ local.
- Trước commit/push, kiểm nhánh gốc và đích đều thuộc luồng `ai-log`, cùng danh sách file thực sự được theo dõi. `.gitignore` không thay thế việc rà nội dung công khai.
