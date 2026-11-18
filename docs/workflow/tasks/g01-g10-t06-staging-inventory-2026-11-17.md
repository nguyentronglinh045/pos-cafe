# T06 mục 9.5 — Đối chiếu staging và danh sách giữ/dọn

Kiểm kê chỉ đọc ngày 17/11/2026, UTC+7. Bảng dưới đây ghi hiện trạng và đề xuất tại thời điểm kiểm kê. **Linh đã chốt giữ `0005`, `0017`, `0018` và xác nhận cách xử lý này đủ để đóng 9.5.** [Quyết định hiện hành](g01-g10-t06-cleanup-preflight-2026-11-17.md#t06-retention-decision-2026-11-17).

## Phạm vi và nguồn

- Yêu cầu lượt này: đối chiếu bằng chứng đã có với testplan, kiểm kê quán thử và trình danh sách giữ/dọn. Chưa được phép xóa, thu hồi phiên, suspend, ghi fixture, triển khai, gửi thư hoặc tạo quán mới.
- Hướng dẫn: remote `docs` đã xác minh bằng `git ls-remote` tại `fc2e23167343f4f0caa71708acb051533cfb3482`. Ref `docs` local còn ở `5417a76`; đã đọc delta hướng dẫn, gồm quy tắc ba nhánh độc lập. Không chuyển nhánh hay ghi đè WIP.
- Hồ sơ thực dùng: `D:/Workspace/pos-cafe-t06-docs-review`, nhánh `docs-t06-r07-evidence-20261115`, HEAD `8928fdd526ee9c5096a0dbe545f5645982709b45` **cộng thay đổi chưa commit**. [Hồ sơ T06](g01-g10-t06-owner-implementation-2026-11-11.md), [checklist](../../../openspec/changes/add-owner-account-and-store-provisioning/tasks.md#9-kiểm-thử-giai-đoạn-1), [testplan](../../../openspec/changes/add-owner-account-and-store-provisioning/testplan.md#cách-chạy).
- Code candidate: `D:/Workspace/pos-cafe-t06-local`, base `610f198`, có sửa hồi quy chưa commit. Không sửa code trong lượt này. Preview lịch sử là `610f198`; backend staging đã có các lần áp riêng trong hồ sơ. Không gộp chúng thành một nguồn cuối đã qua full gate.
- Nguồn mới: SQL Editor trên project `ineckiashpwloncxnbqx` / `pos-cafe-permission-staging`. Bốn truy vấn dùng `BEGIN READ ONLY … ROLLBACK`, đọc catalog, quán, Auth, phiên, ảnh và phụ thuộc. Kết quả có `transaction_read_only=on`; không gọi RPC nghiệp vụ. Mốc catalog 15:19:24, quán 15:20:14, Auth/ảnh 15:21:13, liên kết/phụ thuộc 15:23:09 ngày 17/11. Các truy vấn là những snapshot nối tiếp, không phải một snapshot nguyên tử chung.
- Dữ kiện lịch sử dưới đây lấy từ hồ sơ; dữ kiện hiện tại lấy từ các truy vấn trên. Không chạy lại bài staging hay PostgreSQL cô lập, không khởi động runtime hoặc cài dependency.

## Đối chiếu danh sách bắt buộc của 9.5

`tasks.md` mục 9 chỉ yêu cầu các ca **thuộc giai đoạn 1**. Danh sách ở “Cách chạy” của testplan bao gồm cả hai giai đoạn; không thể coi mọi ID trong danh sách đó là việc T06 còn thiếu.

| Ca bắt buộc có liên quan | Bằng chứng đã ghi và giới hạn | Kết luận đối chiếu |
| --- | --- | --- |
| 02; luồng tạo → nhận key → ghép máy khác → PIN; 104 | Hai vòng FE-01…06 ngày 12–13/11, signup bật rồi tắt. FE-06 đầy đủ dùng `0008` và `0019`. `0005` chỉ là lượt đầu chưa đủ chuỗi sai→đúng/bấm đúp. [Hồ sơ hai vòng, mục Protected Preview](g01-g10-t06-owner-implementation-2026-11-11.md) | Có bằng chứng staging lịch sử. |
| 03(a,e), bổ sung giai đoạn 1 | `0029` seed hoàn tất trước ghép, 0 phiên tại mốc đó; client gọi seed nội bộ bị chặn. [Rà soát 16/11](g01-g10-t06-owner-implementation-2026-11-11.md#t06-evidence-audit-2026-11-16) | Có staging. Các nhánh ép lỗi/rollback/hai thiết bị/mất phản hồi của 03/09 thuộc DB cô lập; TC-09 ngày 17/11 đạt 3/3 không được ghi thành staging. |
| 27 | Năm RPC nội bộ bị từ chối ở ba loại caller; thiếu proof kiểm riêng trên loopback. [Rà soát 16/11](g01-g10-t06-owner-implementation-2026-11-11.md#t06-evidence-audit-2026-11-16) | Có staging cho ACL; giữ ranh giới lane. |
| 43 | ACL, ba cửa sổ log, dump mười bảng và trạng thái dọn bí mật tạm; không phải chứng minh mọi log/bảng/mốc thời gian. [TC-43](g01-g10-t06-owner-implementation-2026-11-11.md#tc43-92-2026-11-16) | Có bằng chứng trong phạm vi lấy mẫu. Dump kiểm trong bộ nhớ không thay backup phục hồi trước dọn. |
| 45 | (a) trong TC-103; (b) hai intent tranh attempt ID, chỉ `0031` tạo; (c) cùng request ID chỉ một receipt/challenge/thư. Có mốc lời gọi chồng thời gian. [Rà soát](g01-g10-t06-owner-implementation-2026-11-11.md#t06-evidence-audit-2026-11-16) | Có staging; không suy hết mọi lỗi tranh chấp từ một lần chạy. |
| 78 | Thư Auth invite thật, hai API ứng dụng từ chối token native; 0 owner/quán của mailbox đối chứng. [TC-78/103](g01-g10-t06-owner-implementation-2026-11-11.md#tc-owner-78-103-2026-11-16) | Có staging. Tài khoản invite được kiểm kê riêng, không phải quán. |
| 92 | Phiên quản lý ở `0004` không khóa được chủ (`OWNER_PROTECTED`), chủ/revision không đổi. DELETE trực tiếp và ràng buộc đúng một chủ kiểm trên PostgreSQL cô lập theo tiêu chí đã chốt 17/11. [Khóa staging](g01-g10-t06-owner-implementation-2026-11-11.md#tc43-92-2026-11-16), [DELETE/constraint local](g01-g10-t06-owner-implementation-2026-11-11.md#tc47d-92-local-2026-11-17) | Có đúng hai loại bằng chứng; **không có phép DELETE staging** và không có RPC xóa nhân viên. |
| 93, 94 | `0022/0023` đọc chéo bị cô lập; `0029/0030` cùng owner, hai key khác nhau. [Rà soát](g01-g10-t06-owner-implementation-2026-11-11.md#t06-evidence-audit-2026-11-16) | Có staging. Lượt này chỉ xác nhận lại cùng owner, không đọc key. |
| 95, 111 | R07 `0023` là A, `0022` là B; RPC, PIN hạn chế, seed, phiên bị thu hồi, Realtime và byte Storage; I/O không tải khi lookup từ chối đo bằng handler local. [R07](g01-g10-t06-owner-implementation-2026-11-11.md#r07-hosted-2026-11-15), [bổ sung](g01-g10-t06-owner-implementation-2026-11-11.md#r07-hosted-2026-11-16) | Có staging theo các nhánh đã ghi; không quy phép đo Storage giả thành hosted. |
| 103, 106 | Bypass/IP tự khai và xác minh đồng thời trên staging; trạng thái thật 106 trong rà soát. Tranh lượt cuối, đồng hồ và mất phản hồi theo lane cô lập/mock. [TC-78/103](g01-g10-t06-owner-implementation-2026-11-11.md#tc-owner-78-103-2026-11-16), [checklist](g01-g10-t06-owner-implementation-2026-11-11.md#t06-checklist-9-2026-11-16) | Có phần staging bắt buộc; giữ các nhánh còn lại ở đúng lane. |
| 49, 52, 56, 59, 60, 65, 70, 72, 77, 83, 84, 85, 88, 90, 98, 102 | Thuộc giai đoạn 2, `tasks.md` mục 11–16: khôi phục key/PIN, cấp lại, đổi email/chuyển chủ/reset. | Ngoài phạm vi đóng 9.5 của T06; vẫn giữ nguyên nghĩa vụ staging khi triển khai giai đoạn 2, không đánh PASS. |

FE-01 vòng 2 lịch sử chỉ có SMTP `submitted` cho Gửi lại. Lượt 16/11 trên alias mới sau khi tắt signup có hai thư Inbox; không gán việc nhận thư đó ngược về ngày 13/11. Biên 600 giây chính xác là kiểm đồng hồ giả; staging chỉ quan sát sát hạn.

Đối chiếu hash local: **93 tham chiếu tệp/hash** trong các bảng hồ sơ có tệp tương ứng ở `D:/Workspace/pos-cafe-t06-pg16-runtime` và khớp SHA-256. Đây là kiểm tính toàn vẹn tệp đã ghi, không phải 93 TC hoặc một lần chạy lại. Không phát hiện ca staging bắt buộc giai đoạn 1 còn thiếu sau khi áp đúng lane và quyết định TC-92 đã chốt. Kết luận này không đóng 9.5 hay giai đoạn 1.

## Kết quả đọc staging mới

26 quán, 17 owner account, 29 Auth user. Có 24 quán active và hai quán suspended (`0007`, `0011`). Từng quán có đúng một owner active, một operation `created`, một Auth user cùng ID đã xác nhận email; cả 26 email kỹ thuật và marker dispatch khớp liên kết. Toàn project có **0 dòng `auth.sessions`, 0 phiên nhân viên chưa thu hồi và chưa hết hạn**, 0 operation `accepted`; 26 operation đều `created`. Hàng phiên cũ có thể còn lưu; ví dụ `0005` còn một hàng phiên nhân viên hết hiệu lực.

69 dòng mail: 43 OTP và 26 Store Key, đều `submitted`. Đây là trạng thái DB; không khẳng định 69 thư đều còn trong hộp thư. Không đọc OTP, PIN, Store Key, token, mật khẩu hay địa chỉ email đầy đủ.

### Theo từng quán

Mọi dòng dưới đây có liên kết Auth và trạng thái phiên như đoạn trên. “Giữ” và “dọn A” đều là **đề xuất chưa được duyệt**. `A` = active, `S` = suspended. Ca sử dụng là dữ kiện lịch sử; cột hiện tại là kết quả mới ngày 17/11.

| Quán | Ca sử dụng / nguồn lịch sử | Hiện tại đã xác minh | Đề xuất và ảnh hưởng bằng chứng |
| --- | --- | --- | --- |
| 0004 | Backend đầu tiên; TC-43 dump và TC-92 khóa chủ | A; seed completed; 4 nhân viên; 0 đơn/ảnh | Giữ riêng. Không có nhãn `+` ở email owner; không suy là dữ liệu được phép dọn từ tên quán. |
| 0005 | TC-104 R1 FE-06 lượt chưa đủ, sau đó đã ghép/PIN | A; seed skipped; 1 nhân viên; 0 đơn/ảnh | **Dọn A** sau duyệt; `0008` thay thế ca đầy đủ. Mất fixture kiểm lại lượt đầu, hồ sơ lịch sử vẫn giữ. |
| 0006 | R1 FE-05B F5 đạt | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ đối chứng F5 vòng signup bật. |
| 0007 | R1 FE-04, quán quota 1/5 tạm ngưng | S; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ cùng bộ R1; xóa một quán làm mất trạng thái đủ 5 quán. |
| 0008 | R1 FE-06 sai→đúng/bấm đúp/copy/ghép/PIN; TC-40 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ ca đầy đủ vòng signup bật. |
| 0009 | R1 FE-04, quota 2/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R1. |
| 0010 | R1 FE-04, quota 3/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R1. |
| 0011 | R2 FE-04, quota 1/5 tạm ngưng | S; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R2. |
| 0012 | R1 FE-04, quota 4/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R1. |
| 0013 | R2 FE-04, quota 2/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R2. |
| 0014 | R1 FE-04, quota 5/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R1. |
| 0015 | R2 FE-04, quota 3/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R2. |
| 0016 | R2 FE-04, quota 4/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R2. |
| 0017 | R2 FE-02 nhập nhầm OTP thật, không tính ca | A; skipped; 1 nhân viên; 0 đơn/ảnh | **Dọn A**; không bỏ một lượt PASS. Giữ ghi nhận lỗi/lượt không tính trong hồ sơ. |
| 0018 | R2 FE-05B đóng tab khi còn tra, chưa trọn | A; skipped; 1 nhân viên; 0 đơn/ảnh | **Dọn A**; `0021` là lượt thay thế đạt. Mất fixture lượt dở, giữ lịch sử. |
| 0019 | R2 FE-06 đầy đủ, TC-40 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ ca đầy đủ vòng signup tắt. |
| 0020 | R2 FE-04, quota 5/5 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ bộ R2. |
| 0021 | R2 FE-05C F5 đạt | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ đối chứng F5 hoàn chỉnh. |
| 0022 | R07 quán B; đối chứng ACL, Realtime, ảnh | A; skipped; 1 nhân viên; 2 đơn/1 payment; 1 upload published, 1 asset published, 1 object 68 B | **Giữ** cùng `0023` cho hồi quy; xóa làm mất quán đối chứng và dữ liệu tiền/ảnh thử. |
| 0023 | R07 quán A; TC-95/111 và đọc chéo | A; skipped; 1 nhân viên; 2 đơn/1 payment; 4 upload, 1 asset published, 3 object private 68 B/object | **Giữ** cả registry/object và ảnh legacy liên quan. Không xem upload discarded là quyền tự dọn. |
| 0025 | TC-41 lượt v1, Auth xung đột số 0024 | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ đối chứng trước cảnh báo v2 và Auth `0024`. Có thể trình dọn đợt sau nếu Linh bỏ nhu cầu đối soát sống. |
| 0027 | TC-41 v2, Auth xung đột số 0026, warning thật | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ cùng Auth `0026` để hồi quy xung đột. |
| 0028 | TC-103 xác minh đồng thời/replay; TC-109 tra ID liên kết | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ cho hồi quy tạo một lần và tra trạng thái. |
| 0029 | Seed trước phiên; TC-02/03/10/27/40/43; TC-94 | A; completed; 2 nhân viên; 0 đơn/ảnh | Giữ cùng `0030`, đối chứng có mẫu/không mẫu và cùng chủ. |
| 0030 | TC-94 chủ sở hữu nhiều quán | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ; cùng owner với `0029` đã được xác nhận lại. |
| 0031 | TC-45(b), intent thắng khi trùng attempt ID | A; skipped; 1 nhân viên; 0 đơn/ảnh | Giữ cho đối soát ca đồng thời. |

Bộ quota R1 = `0007/0009/0010/0012/0014`; R2 = `0011/0013/0015/0016/0020`. Truy vấn owner xác nhận đúng năm quán cùng chủ trong mỗi bộ. Không xóa riêng một quán của bộ nếu còn cần thử trần năm quán; các OTP/cooldown cũ không được coi là fixture còn dùng được.

### Auth không gắn quán và ảnh ngoài liên kết trực tiếp

| Tài nguyên | Dữ kiện mới | Đề xuất / giới hạn |
| --- | --- | --- |
| Auth chiếm số 0024, tham chiếu `c5082ab7e620` | Không có quán; confirmed; banned; mật khẩu rỗng; 0 phiên | Giữ cặp TC-41 v1 với `0025`. Đây không phải quán 0024 và không thuộc 26 quán. |
| Auth chiếm số 0026, tham chiếu `837b9a0a1683` | Không có quán; confirmed; banned; mật khẩu rỗng; 0 phiên | Giữ cặp TC-41 v2 với `0027`. |
| Auth invite, tham chiếu `bd2c1b32e75e` | Tạo 16/11 10:35:30 UTC+7; invited, chưa confirmed; 0 phiên; không trùng email owner nào | Khớp thời điểm/đặc tính TC-78 trong hồ sơ, chưa đối chiếu định danh đầy đủ trong lượt này. Giữ; nằm ngoài dọn A, cần xác nhận identity riêng nếu dọn sau. |
| 4 object private gắn `0022/0023` | `0022`: 1; `0023`: 3; mỗi object metadata size 68 B; không archived/delete marker | Giữ. Chỉ đọc metadata, không tải lại byte hay gọi gateway. |
| `menu-item-images/r07-0023-20261115-legacy-probe.png` | 68 B theo metadata, bucket public | Giữ cùng bằng chứng ngoại lệ URL legacy của R07. Gắn `0023` theo tên và hồ sơ, không bằng FK. |
| Placeholder private 0 B, prefix `b4e6bfcd-21fb-41a8-8718-6fe26430a2cf` | Không khớp quán hiện tại; object `.emptyFolderPlaceholder` còn tồn tại | Giữ ngoài scope T06. Receipt backup 11/11 ghi `retainHostedObject=true`; không suy object mồ côi là temp được phép xóa. |

Tổng 6 object Storage, **340 byte logic theo metadata**, chưa đo dung lượng vật lý/provider billing. Registry `0023`: một `published`, một `ready`, một `uploading`, một `discarded`. Hai asset đều published. Không suy mọi registry có byte hoặc cứ discarded là object đã mất.

## Danh sách trình Linh chốt

**Khuyến nghị A:** dọn đúng ba quán `0005`, `0017`, `0018` cùng ba Auth kỹ thuật gắn trực tiếp; giữ 23 quán còn lại và toàn bộ ba Auth không gắn quán, sáu object Storage. Đây là đề xuất phạm vi, chưa phải lệnh thực thi.

| Quán dọn A | UUID quán = UUID Auth kỹ thuật | Dữ liệu phụ thuộc mới đã đọc |
| --- | --- | --- |
| 0005 | `6197d34f-debe-4101-a0d3-25b22bbd3e27` | 1 nhân viên; 1 operation created; 1 mail theo operation; 1 seed workflow skipped; 1 store audit; 1 signal; 1 phiên nhân viên cũ; 0 đơn/payment/ảnh/categories/menu/bàn/write operation/employee audit/attempt hiện lưu theo operation |
| 0017 | `5a4fec83-f262-4c53-b614-372a4e380cf3` | Như trên nhưng 0 phiên nhân viên cũ |
| 0018 | `a82af1d0-701c-4200-a2b7-054d18fe191c` | Như `0017` |

Phạm vi A cần xử lý quan hệ dữ liệu chứ không chỉ xóa `auth.users`: catalog có FK không cascade từ create operation, phiên nhân viên, store audit và các bảng khác tới stores; mail/reservation/attempt tham chiếu operation. Audit/signal có bảng không dùng FK nên không thể dựa cascade để coi đã sạch. Mã nguồn liên quan: `supabase/migrations/001_schema_enums.sql:18`, `supabase/candidate/permission-identity.sql:47`, `supabase/candidate/owner-provisioning-schema.sql:113` tại worktree code T06. Lượt này chưa lập/kiểm recipe DELETE hoặc duyệt xóa owner account, mail/audit lịch sử; **không tắt constraint/trigger để dọn**.

Sau quyết định phạm vi, bước tiếp theo là lập manifest dependency đầy đủ và backup có thể phục hồi cho đúng A, xác minh dữ liệu mới phát sinh/phiên và tác động owner quota, trình rõ phần mail/audit/owner cần xử lý trước khi thực thi. Không dùng backup trước cutover 11/11 hoặc kết quả dump TC-43 như backup đầy đủ của ba quán này. Nếu Linh chọn giữ toàn bộ thì ghi quyết định giữ có lý do, không tự đổi checkbox 9.5 thành đạt thay cho yêu cầu dọn.

## Bàn giao tại mốc kiểm kê

- Ở mốc kiểm kê, phạm vi A chưa được duyệt. Sau đó Linh đã chọn giữ ba quán, kết thúc phương án dọn trong lượt này. [Quyết định](g01-g10-t06-cleanup-preflight-2026-11-17.md#t06-retention-decision-2026-11-17).
- Chưa xác minh lại cấu hình signup, phiên bản triển khai và hành vi API/UI hôm nay; các nhận định đó trong ma trận là bằng chứng lịch sử có ngày/source. Hai nhãn mock trên Preview vẫn là vấn đề đã ghi, chưa sửa trong lượt này.
- Chưa kiểm toàn bộ phụ thuộc và cơ chế phục hồi cho xóa. Chưa mở/tải byte ảnh, đọc lại hộp thư hoặc giải mã dữ liệu. Auth invite cần xác nhận identity nếu đưa vào phạm vi sau.
- Tại mốc kiểm kê, 9.1–9.4 và 9.6 đã được đánh dấu, còn 9.5 và nhóm tài liệu mục 10 đang mở. [Hồ sơ tiếp nối](g01-g10-t06-owner-implementation-2026-11-11.md#t06-con-lai-2026-11-17) ghi tình trạng sau quyết định và cập nhật tài liệu.
- Bằng chứng mới và truy vấn: `D:/Workspace/pos-cafe-t06-pg16-runtime/t06-inventory-20261117/`. Hồ sơ, kế hoạch và liên kết checklist đã bổ sung local; không commit/push. Review độc lập của gói này lưu trong [biên bản review](g01-g10-t06-staging-inventory-2026-11-17-review.md).
