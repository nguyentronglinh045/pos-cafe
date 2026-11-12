# T06 · Rà lược đồ và luồng OTP tạo quán

Ngày 11/11/2026 · Rà tĩnh trước khi viết migration và nối backend. Phạm vi gồm lược đồ, các bước phát và kiểm OTP, tạo tài khoản kỹ thuật, ghi quán, tra trạng thái, giao Store Key và cổng khóa quán của giai đoạn 1. Không chạy migration, thay đổi staging hoặc nhận kết quả mock là kết quả DB/Auth thật.

Nguồn đối chiếu: `docs@e8a1810`, đặc tả bổ sung quyết định 45–49 và bàn giao mock tại `8827aa6` trên nhánh riêng, code hiện hành `main@cd35439`, mock `2ff217f`, cùng hồ sơ `g01-g10-t05-staging-readonly-2026-11-11.md` đang lưu ở checkout T05. Quyết định 45–49 và kết quả T05 cần được tập hợp cùng bản đặc tả dùng để triển khai; không suy ra chúng đã vào `docs` từ tên nhánh.

## Thứ tự xử lý

### R01 · Trình tự chuyển đổi staging — đã chốt và sửa tài liệu

[Thiết kế gốc](https://github.com/nguyentronglinh045/pos-cafe/blob/8827aa64efecda565fdedbed50ebb411df43d406/openspec/changes/add-owner-account-and-store-provisioning/design.md#L389) đặt migration trước bước xóa và yêu cầu `owner_account_id` bắt buộc, trong khi không backfill quán cũ. Hai quán `0001`/`0002` đã có trên staging. [PostgreSQL](https://www.postgresql.org/docs/current/sql-altertable.html) chỉ cho áp `NOT NULL` khi không còn dòng vi phạm. Đặt giá trị chủ giả để qua migration sẽ đổi mô hình danh tính.

Chủ dự án chọn dùng quán tạo mới, cho phép đưa việc bỏ hai quán thử cũ vào kế hoạch vì đồ án chưa vận hành. Đã cập nhật [proposal](../../../openspec/changes/add-owner-account-and-store-provisioning/proposal.md), [design](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#migration-plan), [tasks](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md) và [testplan](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md): chuẩn bị migration trước; tới lần chuyển đổi thì xác nhận phạm vi xóa và backup, chặn ghi cũ, dọn đúng phạm vi, xác minh `stores` rỗng rồi mới áp lược đồ cuối và dựng fixture mới. Quyết định 45 về thứ tự tắt signup vẫn giữ. Phép kiểm migration thực tế và cổng xóa còn **chưa chạy** tại mốc đặc tả.

Cập nhật lúc triển khai ngày 11/11/2026: MCP chỉ đọc thấy staging có 0001, 0002 và 0003. Chủ dự án xác nhận 0003 cũng là quán thử và cho đưa cả ba quán vào phạm vi dọn sau backup. Xem [hồ sơ hiện thực](g01-g10-t06-owner-implementation-2026-11-11.md). Chưa xóa dữ liệu.

### R02 · Hợp đồng ghi quán và giữ số phía server

RPC hiện hành lấy ID quán từ `auth.uid()` và chèn owner với PIN mặc định, bắt đổi. Chuyển nguyên RPC sang server không đáp ứng luồng mới, vì cần dùng Auth UUID của **quán vừa được tạo cho operation đã giữ chỗ** và PIN chủ đã xác minh. Bộ giữ số hiện hành trả cùng số cho cùng ID, còn thiết kế cần phân biệt gửi lại cùng lượt với chuyển số sau xung đột Auth chắc chắn không có tác dụng phụ. [SQL hiện hành](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate/permission-identity.sql#L448) · [REQ-STORE-01/02/03](https://github.com/nguyentronglinh045/pos-cafe/blob/8827aa64efecda565fdedbed50ebb411df43d406/openspec/changes/add-owner-account-and-store-provisioning/specs/store-onboarding/spec.md#L7)

Đã ghi hợp đồng cho điểm vào nội bộ và mở rộng TC-OWNER-27/30/41/47. Cùng một lần chọn số đọc lại cùng bản giữ số. Chỉ khi lệnh Auth xác nhận xung đột email và chắc chắn không tạo tài khoản thì lượt gốc còn hạn mới chọn số khác. Điểm ghi quán lấy số và UUID từ bản phát lệnh đã xác minh, rồi ghi quán, cấu hình, owner, workflow seed, audit, thư chờ và `created` cùng giao dịch. Lỗi chưa rõ giữ suất theo quyết định 48. Cần kiểm ý nghĩa mã xung đột của Admin API khi triển khai. Các ca mới chưa chạy.

**Mốc xử lý R02 · Đã chốt cách chuẩn bị dữ liệu mẫu.** Quyết định 50 giao lần đầu cho server sau khi commit quán, độc lập với việc trả Store Key. Quyết định 51 thêm màn chờ trước POS và ghi cả bộ mẫu trong một giao dịch riêng. Nếu có lỗi, chủ chọn thử lại cả bộ hoặc vào quán trống sau khi server xác nhận lượt cũ đã kết thúc và dữ liệu trống. TC-OWNER-03/09 bao phủ đổi thiết bị, mất kích hoạt, rollback, mất phản hồi commit và lượt cũ trở lại. Quyết định 57 chốt audit tác nhân `system` kèm ID lượt tạo quán. Lần Thử lại do chủ bấm ghi theo phiên chủ. Các ca seed mới chưa chạy.

### R03 · Thư OTP chưa gửi khi tiến trình dừng sau commit

[Thiết kế cũ](https://github.com/nguyentronglinh045/pos-cafe/blob/8827aa64efecda565fdedbed50ebb411df43d406/openspec/changes/add-owner-account-and-store-provisioning/design.md#L199) ghi hash OTP, lượt và thư chờ trước khi gọi SMTP. Nếu tiến trình dừng ngay sau commit, tác vụ gửi không thể dựng lại mã từ hash. Chủ dự án đã chọn tự gửi tiếp thư OTP tạo quán còn chờ trong chat T06 ngày 11/11/2026. Quyết định 52 lưu bản mã tạm trong thư `queued` cùng giao dịch phát mã. Tác vụ server chỉ nhận thư một lần và trong hạn gốc. Thư đã nhận gửi mà mất kết quả vẫn giữ trạng thái chưa rõ. TC-OWNER-107 bổ sung kiểm mất kích hoạt, tranh lượt, hết hạn và mất phản hồi SMTP. Ca kiểm thử chưa chạy. [Giới hạn tác vụ nền của Edge Functions](https://supabase.com/docs/guides/functions/background-tasks)

### R04 · Mốc hết hạn và lần sai thứ năm

Quyết định 53 chốt giờ DB thực sau khóa của OTP tạo quán. Yêu cầu tới trước hạn nhưng lấy khóa khi đã tới hạn bị từ chối. Khi cần đợi khóa hạn mức theo email, kiểm lại hạn sau khóa trước khi giữ suất hoặc trả lỗi hạn mức. TC-OWNER-108 bao phủ cả hai điểm đợi, hai lượt tranh lần sai cuối và việc sang ngày mới không đặt lại số sai. [Đồng hồ PostgreSQL](https://www.postgresql.org/docs/16/functions-datetime.html)

Chủ dự án chọn khóa ngay ở lần sai thứ năm, kể cả khi OTP đúng nhưng PIN hoặc thông tin tạo quán khác lúc gửi mã. Mọi lỗi được tính dùng chung bộ đếm của challenge. Lần thứ năm vẫn trả lỗi của lần đó. Khi OTP còn trong hạn, lần xác minh mới tiếp theo báo mã bị khóa. Gửi lại đúng ràng buộc của lần đã lưu chỉ đọc kết quả. TC-OWNER-20/22/23/31 và TC-OWNER-108 mô tả các biến thể. Các ca runtime chưa chạy.

### R05 · Hai lần Xác nhận khác ID trên cùng intent

Quyết định 54 cho mở nhiều tab. Form, OTP và kết quả của mỗi lượt không tự đồng bộ giữa các tab. B chưa có kết quả chỉ tra được trạng thái A qua F5 khi liên kết B đã commit. Giữ tối đa 64 liên kết mỗi operation trong giai đoạn 1. B đã bị từ chối giữ lỗi cũ và tra `not_accepted`. Chỉ lượt A đã được chấp nhận mới có thể nhận lại Store Key với đủ bằng chứng.

[Mock đã có liên kết và trần 64](https://github.com/nguyentronglinh045/pos-cafe/blob/2ff217fee9bfabf54143243dde5f017ee62a507c/src/adapters/mock/ownerProvisioningModel.ts#L148). Mock còn khác đặc tả ở nhánh B đã bị từ chối: gửi lại có thể đọc trạng thái A trong khi tra B vẫn trả `not_accepted`. Sửa nhánh này khi triển khai và kiểm TC-OWNER-109. Các ca runtime chưa chạy.

### R06 · Store Key ở phản hồi gốc đến sau hạn OTP

Chủ dự án chốt quyết định 55 ngày 11/11/2026. Nếu server xác minh OTP lúc 10:09:58, OTP hết hạn lúc 10:10:00 và quán commit lúc 10:10:05, lời gọi gốc nhận kết quả của lần ghi và còn trả được phản hồi sẽ giao Store Key khi quyền giao còn hiệu lực. Quyền chỉ nằm trong lần xử lý đó. Gửi lại hoặc tra trạng thái sau hạn không có key. Thư gửi độc lập và trường hợp mất cả phản hồi gốc lẫn thư trên quán thử vẫn theo quyết định 47.

Mock hiện dùng chung hàm trả kết quả và kiểm hạn nhận lại, chưa mô phỏng lời gọi gốc còn chờ commit sau hạn OTP. TC-OWNER-110 kiểm ca này, mất phản hồi, thư lỗi, thu hồi và hết hạn xử lý. Chưa chạy ca runtime.

### R07 · Khóa quán phải qua các RPC nghiệp vụ

Quyết định 56 làm rõ nền giai đoạn 1 dựa trên quyết định 11, 12, 23 và [R06-C](../../spec-reconciliation.md#r06-decisions). [Baseline tại `main@cd3543996fb4`](https://github.com/nguyentronglinh045/pos-cafe/tree/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/candidate) đã đóng quyền bảng thô. RPC phiên quán chỉ trả ID và số quán. Helper phiên nhân viên kiểm nhân viên active và token, còn các đường đọc/ghi dùng hàm có đặc quyền. Có cờ `is_active` ở nguồn cũ chưa chứng minh được khóa quán.

Đặc tả yêu cầu checkpoint trạng thái cho RPC, kể cả phiên đã mở, và khóa cùng hàng quán cho giao dịch nghiệp vụ và đổi trạng thái. Giữ ngoại lệ ba trường của RPC phiên quán. Đổi trạng thái và audit commit cùng giao dịch. Chủ dự án chốt chặn GET mới và revalidate ảnh của quán tạm ngưng ở cổng hiện hành. Ảnh đã tải và URL Storage công khai đời cũ còn giới hạn nêu trong thiết kế.

Ma trận đường đọc, ghi, phiên, Storage và Realtime cùng liên kết nguồn nằm ở [thiết kế](../../../openspec/changes/add-owner-account-and-store-provisioning/design.md#5-chính-sách-bảo-mật-giữ-nguyên-nhánh-thiết-bị-không-thêm-nhánh-chủ). TC-OWNER-95/111 là điều kiện nghiệm thu giai đoạn 1, chưa chạy. T10 còn xử lý chính sách phiên đang mở, cache và khôi phục theo R06-C. Chưa cấp quyền đổi trạng thái cho client.

## Bàn giao

R01, hợp đồng giữ số và ghi quán của R02, hành vi tạo dữ liệu mẫu và R03–R07 đã có trong đặc tả. Cách ghi audit cho seed tự động đã chốt ở quyết định 57. Khi bước vào hiện thực T06, dùng ma trận quyền và testplan đã chốt, đối chiếu lại nguồn và môi trường theo cổng triển khai. Các ca runtime chưa chạy.


## Review độc lập

Hai reviewer APPROVE bản tài liệu `c9c0dcb7d70a868d039381c8ac24bf8daa76447208f59d76a5196afaf69193d2`. Đã đối chiếu đủ sáu file với snapshot và chạy `git diff --check`. `openspec validate add-owner-account-and-store-provisioning --strict` đạt. Kiểm tĩnh, không có kết quả runtime.

| Reviewer | Phạm vi | Điều chỉnh sau vòng trước |
| --- | --- | --- |
| `/root/t06_schema_check` | Trình tự chuyển đổi, hợp đồng provisioning và quyền khi tạm ngưng | Ghi cách xử lý tài khoản Auth và phiên cũ trong phạm vi cần duyệt; kiểm quyền truy cập POS cũ. Thiếu lane kiểm cô lập thì cổng chuyển đổi vẫn chưa đạt. |
| `/root/t06_flow_check` | OTP, tra trạng thái, thư và Store Key | R06 ghi rõ hành vi phản hồi gốc sau hạn là khuyến nghị cần chốt. Hai vòng staging vẫn giữ. |

Verdict tại mốc này chỉ duyệt tính đúng của hồ sơ và thay đổi đặc tả R01. Lúc đó R02–R07 còn mở, trước khi có quyết định 50. Snapshot trước phản hồi review là `c9445ae03f9590d56532b058b1de7d9324d6b612d9a7466465e23183cc4a7dc9`.


### Review quyết định 50

Hai reviewer APPROVE manifest tám file `b5bad18c50193ee15a8b2a46ccd6bdf20a335873afb2abd0391375e94a65d036`. `openspec validate add-owner-account-and-store-provisioning --strict` và `git diff --check` đạt. Chưa chạy runtime.

| Reviewer | Phạm vi | Kết quả |
| --- | --- | --- |
| `/root/t06_schema_check` | Giao dịch, workflow và quyền/audit server | Làm rõ ràng buộc audit hiện hành và cổng chốt cách ghi tác nhân hệ thống. |
| `/root/t06_flow_check` | REQ-STORE-06, use case và TC-OWNER-03/09 | Xác nhận ca không chọn seed và cashier bị từ chối retry, giữ các nhánh đóng trang, đổi máy và lượt cũ. |

Các điều chỉnh xử lý phản hồi từ manifest trước `e0bfac20fe273c123edb0c58dfe864b49709dcc1d4f4d59778bd9b7ca848d6c8`. Verdict chỉ duyệt đặc tả phần seed, không đóng toàn bộ R02.


### Review quyết định 51

Hai reviewer APPROVE manifest chín file `db60f8cc53ed834c65ac8f1172dcdb1e04695629d532dbe13a54c146a0c48e0f`. OpenSpec strict và `git diff --check` đạt. Các ca trong testplan chưa chạy.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | Giao dịch, điều kiện mở POS và quyền theo phiên | Thêm trạng thái đọc tối thiểu cho nhân viên cùng quán và kiểm hai lựa chọn tranh quyền xử lý. |
| `/root/t06_flow_check` | Màn chờ, màn lỗi và TC-OWNER-03/09 | Kiểm cả thử lại và bỏ mẫu khi kết quả commit chưa rõ hoặc đã commit mà mất phản hồi. |

Snapshot trước khi sửa theo review là `28ea5d70401f755646bd7e3685d34db343749b678c58dca42d22e51be3b48965`. Phạm vi review là thay đổi đặc tả quyết định 51.


### Review hợp đồng giữ số và ghi quán R02

Hai reviewer APPROVE manifest chín file `13565988ff2c53de050c8079add227430611f939b2c6e9ebca9354a015cec383`. OpenSpec strict và `git diff --check` đạt. Các ca runtime chưa chạy.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | Giữ số, ràng buộc Auth và giao dịch ghi quán | Đối chiếu lại bản ghi Auth thực dưới khóa và kiểm quyền của lượt theo đồng hồ DB trước khi ghi. TC-47(c) tách trường hợp chỉ UUID sai. |
| `/root/t06_flow_check` | Các ca truy cập trực tiếp, rollback, đổi số và gọi lại | TC-47(d) gọi lại chính điểm ghi nội bộ sau khi mất phản hồi và đối chiếu đúng UUID, số quán và số bản ghi. |

Snapshot trước khi sửa theo review là `81d70083674c39eef7b6df25834939e050adb79213f7c59ed1d1461a065a399f`. Phạm vi review là hợp đồng giữ số và ghi quán.


### Review quyết định 52

Hai reviewer APPROVE manifest mười file `e41cf6356a6dfa597966ee407d8e1f765142fc3502dcf478236fea206ebfa500`. OpenSpec strict và `git diff --check` đạt. Testplan có 107 mã ca duy nhất. TC-OWNER-107 chưa chạy.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | Giao dịch, quyền gửi, hạn mã và dọn bản mã | Kiểm lại challenge và quyền gửi ngay trước khi cấp quyền bắt đầu SMTP. |
| `/root/t06_flow_check` | Phản hồi chung, quota, TC-OWNER-107 và truy vết | Bổ sung nhánh hủy mã hoặc hết hạn sau nhận việc. Đồng bộ số ca và truy vết ngược. |

Snapshot trước khi sửa theo review là `7ee303a23db67c22260d898439124e940419f39b32ad9c74c77d2ba5271ef24e`. Phạm vi review là đặc tả thư OTP tạo quán theo quyết định 52.

### Review quyết định 53

Hai reviewer APPROVE manifest mười file `ddf70b8d73d5c107b7140762c1c5abc68af9bcf744ccfa47a37b2d05d5670b79`. OpenSpec strict, `git diff --check` và kiểm tra truy vết R04 đạt. Testplan có 108 mã ca duy nhất. Ca DB và staging chưa chạy.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | Giờ DB, thứ tự khóa, giao dịch đếm sai | Đọc ràng buộc trước khi chọn khóa. ID đã gắn chỉ chọn challenge và intent gốc kể cả khi mã được thay. Tách khóa email giữ lượt phát khỏi khóa email giữ suất quán. |
| `/root/t06_flow_check` | Hành vi lần sai thứ năm, replay và ca kiểm thử | TC-20 kiểm lần nhập mới đúng hạn sau khóa mã. TC-22 dùng hai email chuẩn hóa khác nhau. TC-108(f) và (g) kiểm đổi chéo phạm vi và thử lại sau khi phát mã thay thế. |

Hai bản trước có manifest `b515b443805db5d28c6603d7ed5c52ec5e7b6824b34a1aeeda8e2d25c47af91f` và `763c14415460760bd7ee3dbaf6f74681da82fddb5a7b05021132f93e7defdf4a`. Phạm vi review là đặc tả xác minh OTP tạo quán theo quyết định 53.

### Review quyết định 54

Hai reviewer APPROVE manifest mười file `f1d93f5fa37f5f55609f0c1a72f7fd59d15dd0445c9f71a4b6abdd833cc9241a`. OpenSpec strict, `git diff --check` và kiểm tra truy vết TC-OWNER-109 đạt. Testplan có 109 mã ca duy nhất. Chưa chạy runtime hoặc staging.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | Phạm vi ID, khóa, dữ liệu và trần 64 | Đọc và đếm bằng câu SQL mới sau khóa ở READ COMMITTED. Giữ khóa đến commit và kiểm thực sự chờ khóa ở TC-109(b/c). |
| `/root/t06_flow_check` | Lỗi đã lưu, F5, Store Key và mock | TC-109(a) dùng fixture riêng cho từng trạng thái. TC-109(f) kiểm xác nhận đã lưu khi cửa sổ mở và sau khi đóng. TC-10 ghi rõ a9 chưa có liên kết. |

Bản trước có manifest `14e29d3e757f0780a3bc4381004f66420bdcf1487a045b9b0d5d1346d9b4353c`. Verdict áp dụng cho đặc tả R05.

### Review quyết định 55

Hai reviewer APPROVE manifest mười file `e12b6ce749c55a72289a92bcf6b75d55f29a49a4a7df1b052fee4c9c90aefad3`. OpenSpec strict, `git diff --check` và kiểm tra truy vết TC-OWNER-110 đạt. Testplan có 110 mã ca duy nhất. Chưa chạy mock, DB hoặc staging cho R06.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | Quyền giao trong lời gọi gốc, commit, khóa và thu hồi | Dùng cùng khóa hàng operation cho quyết định giao và thu hồi. Đọc dấu sau khóa và nhả khóa trước khi gửi HTTP. |
| `/root/t06_flow_check` | Phản hồi gốc, gửi lại, F5, thư và nút đã lưu | TC-110(e) giữ phản hồi gốc qua hạn OTP và kiểm cả hai thứ tự tranh quyền giao với thu hồi. |

Bản trước có manifest `1e0427df46c8194607bf60058538cc0a3f443b5d7cdd0c0919534dae5db41588`. Verdict áp dụng cho đặc tả R06.

### Review quyết định 56

Hai reviewer APPROVE manifest mười một file `62240ac6dcb6efbe766d5dac4ebf9cdfcd06ac966d9fde91f0df5a717b308da0`. OpenSpec strict, `git diff --check` và truy vết TC-OWNER-95/111 đạt. Testplan có 111 mã ca duy nhất. Chưa chạy DB, Storage, Realtime hay staging cho R07.

| Reviewer | Phạm vi | Điểm đã xử lý |
| --- | --- | --- |
| `/root/t06_schema_check` | ACL/RLS, khóa, audit và publication | Helper cùng quán giữ ACL `stores` đóng. Publication chỉ phát INSERT/UPDATE. Đường cập nhật `stores` chọn mức khóa ngay tại điểm lấy khóa. |
| `/root/t06_flow_check` | Quyết định ảnh, đối chứng và truy vết | TC-111 kiểm Realtime thật với đối chứng, GET/304 và phản hồi 404 cùng dạng, toàn bộ đường ảnh private và ca suspend giữa upload và mark-ready. |

Khi hiện thực, kiểm ánh xạ lỗi gateway ảnh private. Baseline dùng HTTP 400 cho mã RPC chưa ánh xạ. Test cần xác nhận `STORE_SUSPENDED`/403 ở đường private đủ quyền và 404 ở đường GET công khai. [Gateway tại baseline](https://github.com/nguyentronglinh045/pos-cafe/blob/cd3543996fb4d06f022dcf4a6829fba43645daff/supabase/functions/menu-image-gateway/index.ts)

Bản trước có manifest `bab0c1d97b61a51949ec82379d484795ca8b68c2e699ecd414732d223a67e99b`. Verdict áp dụng cho đặc tả R07.
