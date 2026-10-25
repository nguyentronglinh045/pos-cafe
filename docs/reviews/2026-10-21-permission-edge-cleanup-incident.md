# CI25: lỗi dọn thư mục readonly — 21/10/2026

**Task chưa hoàn tất. Đã dừng CI/backend theo ngân sách, giữ nguyên source90e30f2.** Không có publication, CI hoặc review mới sau failure. Không merge/Supabase hoặc giảm acceptance.

## Kết quả thật

[Run39600415703](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39600415703), source `90e30f2b2b0f046c549b268b32f1840ad99c2409`, terminalFAIL lúc19:37:09+07, tổng4phút42giây. Bảy phase đầu PASS: install/build, unit1175/1175, tooling567PASS/1manualDeferred giữ baseline, Node823/823, browser và original reporter4/4 cùng diagnostic7/7/20mutation đúngsource/lock. Phase8 `edge-resolution` FAIL sau7.063ms; phases9–18 chưa chạy. Không coi bảy phase PASS là CI18PASS.

Failure exporter giữ reason0/package0/version0. Không có native success receipt; không biết version/bundle/closure20/bad-SRI control đã đạt hay chưa trước cleanup. Peak observed1.430.507.520bytes; free thấp nhất90.202.615.808bytes, OOM counters0. Không có backend mới trên90, không tạo thêm loop18GiB. Data preparer thực đã từ chối `CI_NOT_PASS`, không tạo manifest hoặc dispatch, counts giữ nguyên.

## Lỗi cleanup chắc chắn đủ làm run FAIL

Đọc lại archive bằng luồng, không giải nén/lưu archive trênWindows, xác minh đúng SHA256 `8b5a0f998a552d80690136de969eaa7ab15175509684a5598a97629afa243db1`: các directory `./`, `./bin/`, `./lib/` đều mode0555. Receipt mới `edge-native-modes-inspection.json` giữ91entries/245.736.752filebytes và mode từngentry. CI launcher chạyUIDkhácroot; tar `--no-same-permissions` không tự thêm owner-write còn thiếu. Probe gọi plain `rmSync(root,{recursive:true})` trong finally, chưa cấp write/search cho directory thuộc task.

Source investigator xác minh [Node24.16 fs.rmSync](https://github.com/nodejs/node/blob/v24.16.0/lib/fs.js) → [binding remove_all](https://github.com/nodejs/node/blob/v24.16.0/src/node_file.cc), không chmod và trảEACCES trênLinux khi không có write permission ở parent directory. Vì vậy cleanup hiện tại không thể hoàn tất với tree này. Exception trong finally có thể thay lỗi primary hoặc hủy kết quả thành công. EACCES chưa nằm mapper nên thànhreason0. Đây là lỗi trong tiền kiểm mới do agent triển khai, không phải bằng chứng bộ lock đã chạy đạt.

Không kết luận lỗi native primary chỉ là cleanup: log đã mất kết quả trước finally. Bản sửa phải khôi phục khả năng quan sát rồi mới biết còn blocker khác hay không.

## Vì sao local tests và review chưa bắt được

Archive checker kiểm path/type/size/hash nhưng chưa kiểm lifecycle của directory mode0555. Node tests chưa có actual Linux nonroot fixture cho cleanup này. Negative controls của reporter bảo vệ pipeline cũ, chưa chứng minh lỗi I/O của native probe mới được giữ đúng. Review05 đã bắt banner sai và timestamp budget; review06 đóng đúng hai finding đó, nhưng không phát hiện gap permission này. Approval/readiness không thay actual runtime gate; gate Edge đã chặn backend trong lượt thật.

## Phần sửa tiếp theo — đề xuất, chưa áp dụng hoặc review

1. Xác minh absolute owned root, owner và từng directory; thêm owner-write/search chỉ cho các directory thuộc probe trước xóa. Không đổi quyền global, Nix store, source hoặc dữ liệu người dùng. Không dùng force:true làm thay thế kiểm quyền.
2. Thu lỗi primary và cleanup riêng; giữ finite stage/I/O codes cho EACCES/EPERM/ENOENT, rootRemoved/processReleased đúng bằng chứng. Cleanup failure không được ghi đè primary; thiếu kết quả native vẫnUNKNOWN.
3. Thêm fixture Linux nonroot rất nhỏ: directory0555 có file con, deliberate primary error và deliberate cleanup error; kiểm riêng kết quả và precedence. Chạy trước tải archive83MB/native. Adapter Windows chỉ chứng minh control flow, không thay actual POSIX semantics.
4. Sau khi owner cấp allocation mới: một finalcandidate được hai scope review, own-sourceCI18 giữ đủ coverage; native probe phải PASS/cleanup receipt thật rồi mới chạy PIN48+7 vàT0419. Không tái dùng CI24ed73 hoặc phần PASS củaCI25 làm fullCI nguồn sửa mới.

Chưa viết source patch này vào checkout; source90 trackedclean/15privatehelpers giữ nguyên. Không tự xin thêm lượt trong closeout. V3 CLOSED không hỗ trợ tự nối tiếp hoặc cấp thêm; lần tiếp tục cần ownerdeadline/allocation rõ và guard/spec/review kế thừa exacthistory, không reset.

## Bằng chứng và giới hạn cleanup

Root `D:/Workspace/pos-cafe-permission-run-20261020/evidence/loop-prevention-20261021`: `edge-cleanup-incident.json` SHA256 `7710f6a4de900283353ee796b771835e1b98eb2a75544b605705387073a87724`; `edge-native-modes-inspection.json`; `backend-held-after-ci25.json`; rawlog/metadata/receipt `../cloud-light25*`; packet/reviews06. Log SHA256 `c96de747b82e12a637feaa24f706f931da1848ade98ed03b1c4dafe18977b890`.

Operations investigator xác nhận unit/process release qua launcher/core-pattern restore và job cleanup orphan processes. Record `NOT_PRESENT` tại log357 chỉ dành cho PG16root, không chứng minh Edge files đã xóa; không có measured Edge reclaim. Backend run14 trước đó đã measured reclaim19.327.365.120bytes, không được dùng thay cleanupCI25. GHAjob đãterminal, không có activejobs; không có runtimeWindows mới để dọn.

Ledger đã CLOSED, spent publication2/2, CI2/2, review6/6, heavy1/3. Hai heavy chưa dùng bị chặn bởi CI FAIL và CLOSED, không tự chạy. Deadline23:00 được giữ; dừng sớm vì action budget exhausted. Usage checkpointunique-response kể từ originalstart: output366.737/uncachedinput1.487.301/449responses/6threads; gồm reasoning trong output, không phải billing hoặc nativehardcap; response đóng sổ còn in-flight chưa nằm đầy đủ trong checkpoint.
