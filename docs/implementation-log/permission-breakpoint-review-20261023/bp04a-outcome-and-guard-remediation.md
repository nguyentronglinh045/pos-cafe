# BP4A — dừng tại control của guard, chưa cài dependency

Ngày 23/10/2026, Asia/Bangkok. **BP4A chưa hoàn thành. Đã dừng sau một lượt calibration FAIL; không sửa recipe hoặc chạy lại sau lỗi.** Source sạch `e42215044b4faf7e90f787ae8e975937ad3e4479`, lock không đổi. [Receipt dừng](bp04a-stop01.json), [grant của owner](bp04a-owner-grant01.json), [kế hoạch đã duyệt](bp04-readiness-and-plan.md).

## Quyền và kết quả thực tế

Owner cấp BP4A qua `call_2e42cfdf45f74910ba94b30c0d5ca07e`: tối đa 60 phút từ coordinator ghi nhận 10:30:43; hạn cố định **11:30:43**, giữ 10 phút cuối cho review/bàn giao. Có tối đa một archive preflight, một exact-lock install, một build và một full src unit/coverage ≥90%; FAIL/UNKNOWN thì dừng, không tự retry/sửa source. Không push, CI/backend, SQL/DB hay deploy.

Hai reviewer độc lập đã APPROVE recipe cuối trước chạy: `/root/bp1_authority_final_review` kiểm quyền, hạn, storage và thu hồi cây tiến trình; `/root/bp1_evidence_final_review` kiểm archive, unit oracle và tính xác thực bằng chứng. Source review không thay runtime proof. Ba thiếu sót đã sửa **trước** lượt thử: thu hồi cây tiến trình bằng Windows Job Object, pin retained-roots packet và tắt npm fetch retries; đồng thời bọc lỗi ghi log. Hai MJS qua `node --check`, PowerShell qua parser, chưa coi đó là thực thi chức năng.

Recipe được giữ nguyên sau lỗi, tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/operations`:

| File | SHA256 |
| --- | --- |
| `run-bp4-local.mjs` | `5be26766ccca112d28c7341939d1febc4c8253fa727530e4c23c8bb2f8d47361` |
| `bp4-child-job.ps1` | `794b81dfc28b798bc8341765f58403c4e3d8acf3aada8f6098c114fe81c4315f` |
| `check-bp4-job-guard.mjs` | `fed1ec858c09e46da3fdc00d9432507b80dad47e229b63d14036c7027fbbaf2f` |

Lệnh đã chạy một lần: `D:/tools/nodejs/node.exe D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/check-bp4-job-guard.mjs 794b81dfc28b798bc8341765f58403c4e3d8acf3aada8f6098c114fe81c4315f`, cwd checkout code. [Kết quả gốc](bp04a-guard-controls01.json): 10:50:11.043–10:50:14.554, exit 1.

| Control | Mong đợi | Thực tế | Kết luận |
| --- | --- | --- | --- |
| Normal | root 0, wrapper 0, active 0 | Khớp | PASS |
| Nonzero | root 7, wrapper 1, active 0 | Khớp | PASS cho từ chối có chủ ý |
| Orphan | root 0, wrapper 1, orphan=true, active 0 sau thu hồi | wrapper 0, orphan=false, active 0 | FAIL; chưa chứng minh được nhánh orphan |

Các [proof normal](bp04a-guard-normal01.proof.json), [nonzero](bp04a-guard-nonzero01.proof.json), [orphan](bp04a-guard-orphan01.proof.json) và config gốc được giữ byte chính xác. Tất cả proof báo `activeProcesses=0`; [quan sát CIM sau chạy](bp04a-process-release01.json) không thấy các root PID hoặc command guard còn chạy. Leaf PID ban đầu không được ghi nên không nhận kiểm tra PID riêng cho leaf là đã thực hiện.

**Archive/install/build/unit đều 0 lượt**, chưa có whole-run/phase marker, node_modules hoặc npm cache mới. Source/lock không sửa; push/CI/backend/DB/deploy đều 0. Giữ 955 Node checks cũ đúng phạm vi/source, không nhận thành kết quả mới. Runtime TS ngoài build, browser và full permission gate vẫn chưa được xác minh trong BP4A.

## Chẩn đoán và phần chưa chắc

Control do coordinator chuẩn bị dùng `spawn(..., {stdio:'ignore'}).unref(); process.exit(0)`, không đặt `detached:true`, không ghi READY hoặc PID của con. Tôi đã bỏ sót hành vi Windows này khi viết control; review trước chạy cũng chưa bắt được. Đây là thiếu sót của fixture kiểm chứng, chưa phải bằng chứng lỗi ứng dụng hoặc Job helper.

Nguồn đúng phiên bản [Node v24.16.0 / libuv](https://github.com/nodejs/node/blob/v24.16.0/deps/uv/src/win/process.c#L65-L91) tạo Job riêng với KILL_ON_JOB_CLOSE; [nhánh non-detached](https://github.com/nodejs/node/blob/v24.16.0/deps/uv/src/win/process.c#L1016-L1035) gắn con vào Job đó. Vì vậy khi cha thoát, Node có thể tự kết thúc con trước lúc guard ngoài kiểm orphan. `.unref()` không thay cách gắn Job. Đây là **suy luận có căn cứ source**, phù hợp kết quả active=0 rất sớm; chưa chứng minh riêng vòng đời leaf trong lượt đã chạy. Do không có READY/error/PID, cũng chưa loại trừ spawn/startup không thành công trước khi cha thoát.

Nguồn [nhánh detached](https://github.com/nodejs/node/blob/v24.16.0/deps/uv/src/win/process.c#L988-L1000) ghi rõ không dùng CREATE_BREAKAWAY_FROM_JOB. Có thể tạo con sống qua cha bằng detached mà vẫn giữ nó trong BP4 outer Job. Chưa chạy để xác nhận thực nghiệm cách sửa này.

## Đề xuất sửa nhỏ, đang chờ owner

Chỉ sửa **fixture calibration** ở file/lượt `02` mới; giữ nguyên main recipe, helper, source/lock, toàn bộ evidence FAIL01 và deadline. Không giảm acceptance orphan, không xóa marker/evidence để thử lại.

1. Dùng `detached:true`, `windowsHide:true`, `stdio:'ignore'`; worker Node chỉ ghi READY gồm nonce cố định của lượt, PID, parent PID vào thư mục guard02 riêng rồi chờ tối đa 30 giây. Không mạng, package, DB hoặc code app.
2. Parent chỉ exit 0 sau sự kiện spawn và READY đúng nonce/PID/parent PID, đồng thời worker còn sống. Error/không READY trong tối đa 2 giây thì FAIL. `.unref()` chỉ để parent thoát sau xác minh, không dùng để chứng minh orphan.
3. Chỉ chạy **một corrected orphan control**, helper root timeout tối đa 5 giây và wrapper cap 30 giây để chứa cả drain 15 giây cùng thời gian khởi động helper. Phải có wrapper=1, root=0, orphan=true, releaseVerified=true, activeProcesses=0; sau đó xác nhận worker PID đã kết thúc. Không kill PID ngoài owned Job, không có fallback/retry. Normal/nonzero evidence01 giữ đúng helper hash không đổi.
4. Hai reviewer kiểm recipe02 trước chạy. Chỉ nếu corrected control PASS mới tiếp tục các quota local chưa dùng: tối đa 1 archive, 1 install, 1 build, 1 full unit/coverage ≥90%. Giữ guard từng bước, 2GiB tăng mới, retained 768MiB, C/D ≥30GiB và hạn **11:30:43**. Không đủ thời gian admission thì dừng phần chưa chạy; không hứa tất cả sẽ kịp.
5. Bất kỳ FAIL/UNKNOWN mới đều dừng, giữ evidence và hỏi quyết định; không tự sửa/rerun. Không mở push/CI/backend/DB/deploy.

Đây là đề xuất để owner chọn **cho phép sửa fixture + thêm một corrected guard control rồi tiếp tục phần local chưa dùng trong hạn cũ**, hoặc **giữ dừng**. Grant cũ yêu cầu dừng khi FAIL nên không tự coi proposal/review là quyền chạy lại. Không tăng thời gian hoặc reset lịch sử. Hướng dẫn đọc code/giải thích các proof đã được đưa trong tài liệu này; chưa nhận owner đã đọc hoặc nghiệm thu.

Guard temp hiện rỗng; report/config/proof chỉ vài KB và cần giữ để giải thích lỗi, chưa có dependency/runtime mới cần dọn. Junction night-node06 sau khôi phục vẫn là blocker cho publication về sau; không né bằng thay retained roots/allowlist và không thử lại thao tác xóa từng bị policy chặn.
