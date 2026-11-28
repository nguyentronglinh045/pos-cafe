# Báo cáo kiểm thử giao diện tạo quán tuần 8

**Thành viên phụ trách:** Trần Thị Lâm — 24TX610006  

**Phạm vi:** Owner Create trên mock, OTP, trạng thái chưa rõ, Store Key, ghép thiết bị và responsive UI  
**Trạng thái:** Có kết quả kiểm tra bổ sung và patch CSS thử nghiệm; **chưa phải lượt Lâm tự chạy, chưa tạo Pull Request, chưa phải kết quả kiểm thử trên nhánh Lâm**.

## 1. Tóm tắt kết quả

| Việc kiểm tra | Kết quả có bằng chứng | Giới hạn |
| --- | --- | --- |
| `npm.cmd run smoke:owner-create` (trong Linux dùng `npm run smoke:owner-create`) | Đã gọi lệnh, Playwright phát hiện **10 lượt = 2 kịch bản × 5 viewport** | **10/10 không khởi chạy được trình duyệt**: thiếu `chromium_headless_shell-1223`; đây là lỗi môi trường, **không phải 10 lỗi nghiệp vụ** |
| Unit/component/middleware liên quan | **39/39 test đạt**, 4 tệp test | Bao phủ logic nhưng không thay thế E2E GUI |
| Build sau chỉnh CSS | `npm run build` **thành công** | Còn cảnh báo bundle JavaScript lớn trên 500 kB, không phải lỗi build |
| Tương tác GUI ở 5 viewport | Form, OTP, Store Key được xem/chụp trực tiếp | Iframe cùng origin, đúng viewport CSS; **không mô phỏng cảm ứng hoặc DPR** |
| OTP sai và chờ gửi lại | Nhập `000001` hiện thông báo sai; nút Gửi lại bị khóa với bộ đếm khoảng 600 giây | Không chờ hết 10 phút thật trong GUI |
| OTP đúng, Store Key và ghép | OTP fixture `012345` tạo quán mock; sao chép clipboard khớp; bấm **Tôi đã lưu Store Key** mới sang màn ghép; ô ghép rỗng, nhập Key vào thì tới màn PIN | Không thử Supabase/email production |
| F5 khi xác minh chưa rõ, rời màn tra cứu | Có test tự động mô tả và các test mô hình trạng thái `unknown`/`unconfirmed` đạt | **Chưa thể chấm PASS bằng thao tác GUI** do E2E không khởi chạy |
| OTP hết hạn, gửi lại đúng mốc | Test mô hình xác nhận `A_OTP_EXPIRED` và chặn gửi lại trong 10 phút; thuộc 39 test đạt | Chưa thao tác GUI thật tới mốc hết hạn |

## 2. Nguồn và điều kiện

- Dùng mã nguồn hiện có trong bản sao lưu `tuan8ngoc.rar`, thư mục `pos-cafe-main/pos-cafe-main`. Đây là **snapshot `main` đi kèm hồ sơ của Ngọc**, không phải bằng chứng về commit/nhánh riêng tuần 8 của Lâm; bản sao không có metadata `.git` để xác minh hash.
- Kịch bản `tests/owner-create/owner-create-closeout.spec.ts` có hai trường hợp: (1) OTP sai rồi đúng, lost response, lưu Store Key, ghép và seed; (2) F5/rời màn, chỉ tra cứu attempt cũ, rồi nhận kết quả cuối. Config chạy 1366×768, 1024×600, 844×390, 740×360 và 390×844.
- Trong container Linux, lệnh tương đương `npm.cmd` của Windows là `npm run smoke:owner-create`. Đầu ra đầu tiên báo `browserType.launch: Executable doesn't exist ... chromium_headless_shell-1223`, nên không có assertion nghiệp vụ nào được chạy tới.
- Để kiểm chứng giao diện, mở Vite mock fixture tại localhost (chỉ dữ liệu giả), dùng iframe cùng origin với vùng nhìn CSS đúng kích thước. Bộ ảnh ghi lại thao tác qua Chromium; không điều khiển Playwright bằng lệnh screenshot headless.
- Chỉ dùng email `@example.com`, PIN mẫu và Store Key của fixture. Không có yêu cầu/thao tác trên quán thật, email thật hay cơ sở dữ liệu production.

## 3. Phiếu đối chiếu tương tác GUI

| Mã | Thao tác thực tế | Quan sát | Kết luận |
| --- | --- | --- | --- |
| L08-01 | Mở Tạo quán mới trên khung 740×360 rồi chuyển 5 kích thước | Form có Email, Tên quán, Địa chỉ, PIN và checkbox mẫu; không tràn ngang | **Đúng**, hai màn ngang thấp phải cuộn dọc |
| L08-02 | Nhập email thử, tên quán, PIN rồi Gửi mã | Chuyển sang Xác minh email, hiện thông báo mã 10 phút, Gửi lại sau khoảng 600 giây bị khóa | **Đúng** |
| L08-03 | Nhập OTP sai `000001`, bấm Xác nhận | Hiện cảnh báo đỏ **“Mã xác minh không đúng. Vui lòng kiểm tra và nhập lại.”**; vẫn ở màn nhập OTP | **Đúng** |
| L08-04 | Nhập OTP fixture `012345`, xác nhận | Hiện **Đã tạo quán** và một Store Key mock | **Đúng** trên fixture |
| L08-05 | Chuyển 5 kích thước khi Store Key hiện | Key không tràn ngang; ở 390×844 xuống 2 dòng; nút Sao chép / Tôi đã lưu hiện đủ | **Đúng** |
| L08-06 | Bấm Sao chép Store Key, đọc clipboard | Nội dung clipboard khớp nguyên Key và hiện “Đã sao chép Store Key.” | **Đúng** |
| L08-07 | Bấm Tôi đã lưu Store Key | Mới chuyển sang màn Ghép thiết bị; ô Store Key rỗng, không tự điền ngầm | **Đúng** |
| L08-08 | Dán Key mock vào Ghép thiết bị và bấm ghép | Chuyển sang màn Chọn nhân viên / nhập PIN của quán mock #0042 | **Đúng** |
| L08-09 | F5 trong lúc yêu cầu xác minh chưa có kết quả cuối; rời màn, quay lại tra cứu | Kịch bản E2E có mô tả điều kiện kiểm, test mô hình có xử lý `unknown` | **Chưa xác minh bằng GUI** |
| L08-10 | Để OTP hết hạn và gửi lại đúng mốc 10 phút | Test mô hình kiểm tra mã hết hạn và giới hạn chờ | **Đạt ở unit; chưa chứng thực GUI hết hạn** |

## 4. Kết quả 5 kích thước màn hình

| Viewport CSS | Form trước patch | Store Key | Nhận xét |
| --- | --- | --- | --- |
| **1366×768** | Không tràn ngang/dọc; nút Gửi mã cao 36,5px | Không tràn | Đọc dễ trên desktop |
| **1024×600** | Không tràn; nút cao 36,5px | Không tràn | Bố cục ổn |
| **844×390** | Không tràn ngang; cần cuộn dọc **75px** | Không tràn | Cần cuộn để tiếp cận cuối form |
| **740×360** | Không tràn ngang; cần cuộn dọc **105px**; OTP sai cần cuộn **83px** | Không tràn | Nút Xác nhận ở dưới nếp gấp, dễ bị bỏ sót |
| **390×844** | Không tràn ngang/dọc | Key xuống 2 dòng, vẫn đọc được | Có thể thao tác qua chuột; chưa thử cảm ứng |

**Cách đo:** viewport là `window.innerWidth × window.innerHeight` của iframe, đo `scrollHeight - clientHeight` và bounding box bằng đọc-only DOM của trình duyệt. Nút Gửi mã trước patch 36,5px, nút Quay lại/OTP trước patch khoảng 32–37px. Mốc 44px là **ngưỡng mục tiêu tham khảo**, cần nhóm duyệt như acceptance criterion; không tự kết luận đây là lỗi bắt buộc theo đặc tả.

## 5. Điều chỉnh giao diện thử nghiệm

Mình chuẩn bị patch riêng [lam-owner-ui-tuan8.patch](lam-owner-ui-tuan8.patch) trên snapshot, chỉ thêm CSS trong `src/tailwind.css`, không sửa handler, API, mock model hoặc `data-testid`. Các thay đổi:

- Nút thuộc màn Tạo quán/Trạng thái tạo quán có chiều cao tối thiểu **44px**; vùng trường nhập (MUI OutlinedInput root) cũng tối thiểu **44px**.
- Ở màn hình thấp hơn hoặc bằng 420px chiều cao, giảm padding/gap và căn khung lên trên để người dùng đỡ cuộn.
- Không giấu nút và không chuyển form sang kiểu fixed/sticky có thể che trường nhập.

| So sánh tại 740×360 | Trước | Sau patch CSS |
| --- | --- | --- |
| Nút Quay lại | 32px | **44px** |
| Nút Gửi mã / Xác nhận | khoảng 36,5px | **44px** |
| Cuộn dọc ở form tạo quán | 105px | **60px** |
| Cuộn dọc khi OTP sai | 83px | **50px** |
| Cuộn ngang | 0px | 0px |

**Đối chiếu sau sửa:** ảnh [form trước](anh/form-740x360.jpg) / [form sau](anh/form-740x360-sau-css.jpg); [OTP sai trước](anh/otp-sai-740x360.jpg) / [OTP sai sau](anh/otp-sai-740x360-sau-css.jpg). Nút Xác nhận vẫn cần cuộn một chút ở trạng thái OTP có thông báo lỗi và fixture debug; chưa tuyên bố giải quyết hoàn toàn.

Sau CSS: `npm run build` đạt và 4 file Vitest với **39/39 ca đạt**. Chưa được xem là CI/E2E PASS vì browser của runner còn thiếu.

## 6. Điểm tồn tại cần tiếp tục

1. **Môi trường E2E:** cài đúng Playwright Chromium theo lockfile (`npx playwright install chromium`) trên máy chạy thật và chạy lại `npm.cmd run smoke:owner-create`. Ghi commit, Node/npm và phiên bản trình duyệt cùng log mới; không gọi 10 lượt khởi tạo lỗi là test nghiệp vụ FAIL.
2. **OTP hết hạn/gửi lại:** có xác nhận tại unit; cần một lượt GUI có clock fixture hoặc môi trường staging được phép để quan sát thông báo hết hạn, giữ/đổi mã và nút Gửi lại sau đúng thời điểm. Không rút ngắn cooldown production chỉ để quay ảnh.
3. **F5 / chưa rõ / rời màn:** cần E2E hoặc GUI kiểm tra chính xác attemptId không mất và không tạo thêm quán khi reload/tra cứu; hiện chưa đủ căn cứ đánh dấu hoàn tất.
4. **Thiết bị thật:** thử touch/kích thước vật lý, bàn phím ảo, zoom chữ và cuộn trên thiết bị 390×844, 740×360. Các screenshot hiện là CSS viewport trong iframe.
5. **Nhánh và Pull Request:** nguồn đang kiểm tra là snapshot `main`; quy ước trước đó của Lâm nêu nhánh nền `owner-mock-ui-handoff-20261110`. Cần hỏi Linh xác nhận lại base/target và commit mới nhất, sau đó áp patch trên đúng nhánh, xem diff và chạy CI trước PR. **Chưa push, chưa PR, chưa báo đã gửi Linh.**

## 7. Hình minh chứng

Gói hồ sơ có **16 ảnh JPEG**: 5 ảnh form trước chỉnh, 5 ảnh Store Key theo viewport, OTP chờ mã / OTP sai, trạng thái sau lưu / ghép, và 2 ảnh đối chiếu sau CSS. Ảnh có email/Store Key giả của fixture; không dùng làm dữ liệu ghép quán thật.

- [Form 1366×768](anh/form-1366x768.jpg), [1024×600](anh/form-1024x600.jpg), [844×390](anh/form-844x390.jpg), [740×360](anh/form-740x360.jpg), [390×844](anh/form-390x844.jpg).
- [OTP trên 390×844](anh/otp-390x844.jpg), [OTP sai trên 740×360](anh/otp-sai-740x360.jpg), [sau chỉnh CSS](anh/otp-sai-740x360-sau-css.jpg).
- [Store Key tại 390×844](anh/store-key-390x844.jpg), [kết quả ghép tới PIN](anh/ghep-thiet-bi-thanh-cong.jpg).


