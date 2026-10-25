# Kết quả diagnostics/helper, fresh CI và whole T04 — 24/10/2026

Đã triển khai và review candidate `90824f7cb81660818ab247f7dccf55b8a111d471`, chạy đúng một fresh CI và một dispatch whole T04 theo ủy quyền. **CI PASS; T04 FAIL và không thu được bằng chứng nghiệp vụ bên trong. Diagnostics chưa đạt yêu cầu xuyên suốt: phát hiện lỗi giới hạn đọc receipt 8 KiB sau lượt chạy. Candidate hiện CHANGES_REQUESTED cho phần transport, chưa được coi là sửa xong.** Không sửa tiếp source hoặc chạy lại sau kết quả này; chưa PR/merge/deploy.

Nguồn ủy quyền, ngân sách và acceptance: [brief](diagnostics-execution-20261024.md), [packet03](execution-packet03.json). Main giữ `2da0d7e10d65ed4e79c8628d65220582a6cbd32b`; review branch giữ `90824f7`, checkout sạch. Tree `7f33dd64e2a17b56277698840a4e43bb39f2f844`, fingerprint `bd50735607395b09db1c0da701df193d6b2e180da946016d0b44a0d62abe1d74`, lock `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`, 1.115 blobs/45 trusted pins.

## Kết quả thực chạy

| Phạm vi | Kết quả của source90824f7 | Bằng chứng và giới hạn |
|---|---|---|
| Fresh CI | [40051559979](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40051559979), attempt1, PASS18/18 | `night-ci06-collection.json`, summary/rawlog/API/cleanup cùng source; sourcePreserved=true |
| LIGHT | 6 stages/343 required identities đạt | STATIC5/313 required, thực chạy480PASS; PG16T01 30/30PASS. Không cộng các test ngoài LIGHT vào số required |
| Diagnostics tooling | CI reporter4/4, diagnostic7/7,20mutations đạt | Ba control Playwright mới nằm trong nhóm failed; các kiểm này **không đi qua giới hạn đọc file8KiB** |
| PIN UI | Ba ảnh mock mới được root và hai reviewer mở trực tiếp | [review](light-reviews03.json); hashes/schema/CRC/source binding đạt. Mobile fullpage844×419 từ viewport844×390, hai input mask không thuộc kết luận trực quan |
| Whole T04 | [40052956373](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40052956373), attempt1, FAIL | `cloud-t0405.json` có một wrapper failure, không có business receipt, không có diagnostic facts. Tiến độ từng business stage **UNKNOWN/NOT_ACCEPTED**, không khẳng định19stage thực tế NOT_RUN |
| Acceptance tổng | Chưa đạt | Giữ35stages/760required,12obligations/34contexts,A18/D19. Bảy service profiles tiếp tục HELD; không dùng kết quả cũ để lấp bằng chứng source mới |

Evidence local nằm tại `D:/Workspace/pos-cafe-permission-timeonly-20261022/evidence/`. CI collection SHA256 `f7cd75b48c70ae4227016aeba5e21b653271c099f3e10163b80146223e5e91c6`; T04 receipt `f9c8305a09b07991884bd6cb8b5f1af63b4e3001f8a4a6cefc3f7b21aba6f4d7`, log `16e2a6fcdb028db645b3ed002aeff97f9419bc8e23d7b5d652c5766d091fd4ba` (31.433B), metadata `4cce20bc1e482aba4b801d33c6740681cebe31b84cec5a3e434de186620abc90`. [API terminal](t04-terminal-api03.json) xác nhận đúng repo/source/workflow/event/attempt, zero artifacts và zero active runs.

Local137 Node tests và ba control thực trước freeze được giữ trong [validation](diagnostics-repair-validation01.json) và [recipe](diagnostics-local-recipes01.json). Binding parent49e của ba control là context tổng hợp, không phải business receipt của49e hay908. CI mới xác nhận các tooling checks trên908, nhưng không khắc phục khoảng trống coverage vừa phát hiện.

## Nguyên nhân xác định được và điều chưa biết

Quan sát của lượt T04: wrapper báo `offline-edge`, operation=null, `COMMAND_FAILED`, command=`unshare`, exitCode78; `completed` chỉ gồm sáu nhãn setup, `facts={imageOrdinal:12}`. Không có `isolatedFailureSeen`, không có D12 business receipt. Đây là kết quả tổng của nhánh offline, không chứng minh syscall unshare, Edge image hoặc một test cụ thể là nguyên nhân.

`imageOrdinal` là bộ đếm prefetch giữ nguyên từ vòng tải12images, không phải identity image bị lỗi: [worker:666](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:666), [worker:788](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:788). Nhánh `offline-edge` bao gồm cả khởi động stack và business harness tại [worker:622](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:622) và [worker:638](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:638). Vì vậy không được chuyển sáu setup nhãn thành sáu business PASS hoặc suy rằng business chưa bắt đầu.

**Lỗi source đã chứng minh:** writer ghi toàn bộ finite facts tại [worker:654](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:654), nhưng reader tại [worker:823](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-t04-worker.mjs:823) chỉ đọc `isolated-failure.json` khi `info.size <= 8192`. Phép serialize read-only từ ba report control Playwright đang lưu cho kết quả766fields, envelope34.157/34.157/34.182B; cả ba vượt trần. [Kết quả và input hashes](diagnostics-envelope-analysis01.json) là chứng minh source bằng dữ liệu synthetic, không phải facts của T04 vừa chạy.

Nếu inner receipt vượt trần, reader bỏ qua nó và rethrow lỗi ngoài `unshare/78`, làm mất operation và facts. [Gate export:46](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/project-backend-t04.mjs:46) chỉ nhận business-failure evidence khi operation=PILOT_HARNESS/command=node/exitCode1; nó cũng từ chối wrapper null/unshare/78 dù harness có thể đã ghi partial public evidence. Chuỗi này giải thích được dạng triệu chứng quan sát. **Chưa chứng minh đây là nguyên nhân thực tế của run40052956373:** không còn private receipt để đo và chưa có telemetry về lý do reader từ chối. Không khẳng định lỗi clear-demo/settings đã hết, tái hiện hay không tái hiện; cả hai vẫn chưa xác minh trên908.

Các control trước đó gọi validator/object roundtrip và kiểm marker dưới64KiB, không đi qua reader file8KiB. Tác giả và hai reviewer ban đầu đã bỏ sót chênh lệch này. Approval source trước chạy được giữ làm lịch sử; nhận định “full transport proven” bị rút lại. Không sửa kết quả test cũ thành FAIL giả, nhưng thu hẹp đúng ý nghĩa bằng chứng và đánh dấu candidate cần sửa.

Thông báo tiến độ đầu tiên sau FAIL đã suy quá mức “trước test nghiệp vụ”; đã đính chính ngay trong chat khi phát hiện chênh lệch. Báo cáo này thay thế suy luận đó. Trường `full35BusinessRuntime: NOT_RUN` nguyên gốc của collector chỉ nói whole35 không được thực thi/xác nhận như một gói, không cung cấp trạng thái từng stage bên trong T04.

## Hướng sửa tiếp theo, chưa thực hiện

1. Dùng một giới hạn serialized envelope chung cho writer và reader, suy từ schema finite hiện tại và kiểm kích thước tối đa. Nếu chọn64KiB phải chứng minh đủ cho worst case và ghi rõ thay đổi giới hạn diagnostics; không tăng mù các giới hạn khác. Phương án giữ8KiB cần encoding gọn không mất dữ kiện, phức tạp hơn.
2. Giữ nguyên uid/mode/regular-file/no-symlink/realpath/source/run/attempt/schema guards. Writer kiểm byte bound trước ghi; reader dùng cùng bound trước parse. Không bỏ gate `backendFailureEvidence`, không nhận unshare78 là business receipt hợp lệ.
3. Xuất trạng thái finite cho inner receipt missing/oversize/unsafe/malformed và byte count có giới hạn. Không xuất raw stderr, token, request body hoặc đường dẫn riêng.
4. Thêm control đi qua **đường đọc file thực**, dùng valid full six-test inventory và kiểm dưới/tại/trên trần, unsafe path/mode, malformed/binding drift; đi tiếp đến outer evidence gate. Giữ nguyên business assertions, catalog, required identities, privacy, timeouts/retries.
5. Review độc lập source mới rồi xin lượt CI/T04 mới theo ngân sách mới nếu tiếp tục. Không tự dùng lại grant đã tiêu hết, không chỉ chạy test lỗi để thay whole acceptance.

## Walkthrough phần đã sửa

- [Helper:10](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidateUi.ts:10): floor vẫn có thể hiển thị sau overlay nên không chứng minh drawer đã đóng. Helper chọn nút close trong header, đợi drawer hidden và count0 rồi mới xác nhận floor; [save:36](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidateUi.ts:36) đợi nhãn hoàn tất, dirty badge hết và nút disabled. Không discard draft để làm test xanh. Hành vi backend sau sửa chưa được xác nhận do thiếu receipt T04.
- [Inventory:6](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-candidate-diagnostic.mjs:6) cố định sáu identity; [projection:76](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-candidate-diagnostic.mjs:76) giữ state/line/milestone/checkpoints từng test và UNKNOWN khi thiếu. Đây là phần làm envelope lớn hơn, dẫn tới giới hạn file cần sửa tiếp.
- [Probe:17](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidateDiagnostics.ts:17) chỉ đọc owned synthetic fixture, có timeout; API được quan sát thụ động, không mint session. Bốn boundary DB/API/UI và failure DOM giúp phân biệt persist/seed/clear/UI khi transport hoạt động đầy đủ.

Walkthrough đã cung cấp trong hồ sơ; chưa có phản hồi xác nhận người dùng đã đọc/hiểu hoặc nghiệm thu.

## Cleanup, ngân sách và bàn giao

CI native PG16 giải phóng process/root, đo50.741.248B thu hồi; final receipt NOT_PRESENT. T04 wrapper cleanup=true/cleanupFailure=null, đúng một RECLAIMED/imageUnlinked=true: loop18GiB logical,19.327.381.504B allocated, host free tăng19.327.389.696B. Outside admission568.696.832B dưới1GiB trừ16MiB dự phòng; đây không phải OS quota. Sau lượt chạy C còn193.058.217.984B, D98.871.734.272B. Không dựng môi trường local/WSL/Docker mới. [Checkpoint cuối](diagnostics-run-checkpoint02.json).

Hai thư mục control I5Zvys/B7roIZ (32files/57.032B logical) đã được người dùng cho xóa, nhưng cơ chế duyệt tự động chặn lệnh trước thực thi với “blocked by policy”, không nêu lý do chi tiết. Chúng vẫn còn; không tuyên bố thu hồi dung lượng. [Receipt](diagnostics-control-cleanup01.json). B7 được dùng read-only cho phân tích byte bound sau đó; không chạy lại control.

Cumulative publication3/CI3/T043 đã tiêu hết, không reset lịch sử. Bảy profile khác, PR/merge/deploy tiếp tục HELD. Bản triển khai diagnostics còn blocker8KiB; phần chạy và phân tích kết quả của lượt được giao đã kết thúc. [Bàn giao](../../workflow/tasks/permission-diagnostics-t04-2026-10-24.md); review cuối được ghi riêng trong `diagnostics-outcome-reviews01.json`, không tự xem báo cáo này là approval source.
