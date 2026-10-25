> **Đối chiếu xuất bản 25/10/2026.** Các ngân sách, deadline, spent counters và authorization21/10 bên dưới là lịch sử đã kết thúc. Xuất bản hồ sơ không cấp lượt CI/backend/retry mới và không reset ledger. [Nguồn, trạng thái và giới hạn](../../../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Yêu cầu

- R1: Giữ failed/timedOut/interrupted và runner-origin metadata hữu hạn; không đổi nghĩa failedTests, không gán lỗi runner giả cho testcase.
- R2: Controls phải đi qua pinned reporter, parent/parser/export và collector trước reclaim. Metadata thiếu, stale/malformed/oversized và sentinel riêng phải bị từ chối hoặc giữ UNKNOWN; không làm PASS.
- R3: Một workstream giữ original start/deadline, allowance và spent xuyên source/profile/chat. Không tự cấp lại publication/CI/heavy khi đổi identity. Số đếm token chỉ cộng unique per-response; reasoning thuộc output, cache thuộc input.
- R4: Admission giữ own-source CI17, actual diagnostic controls, hai source/operations review, native/prior reclaim, diskC/D>=30GiB và một runtime; chỉ branch run/permissions-20261020. Không merge/live.
- R5: Lưu quyết định, recipe, snapshot/hash, evidence và giới hạn trên docs; operator guide/code ở checkout code. Hết budget bàn giao chưa hoàn tất.

- R3a (owner override21/10 lúc15:59:29): continuation SHALL dùng deadline tuyệt đối17:00+07, không token cap, giữ originalStart/allowance/spent/usage/identity qua predecessor CLOSED được pin hash. Ledger cũ không được sửa/mở lại. Head độc lập SHALL phát hiện journal cắt đuôi/mất hoặc cập nhật dang dở và từ chối thay vì tự phục hồi bộ đếm. Admission SHALL giữ thêm5phút ngoài timeout để collect/cleanup/checkpoint; điều phối dừng mọi công việc trước deadline.

- R3b (owner18:11/18:13): successor đến23:00+07 SHALL chỉ tăng allowance.reviewRounds đúng2 qua additionalReviewRounds:2 và reviewGrantReference gắn reply owner. Tổng batchA tối đa4review; execution allowance1publication/1CI/2heavy, start/spent/usage/identity SHALL giữ nguyên. Thiếu/sai grant hoặc tái dùng authorization cũ SHALL từ chối. Tất cả gate hiện hữu giữ nguyên; không nhận review/CI cũ thành PASS source mới.

- R3c: mỗi predecessor CLOSED SHALL được bind với một successor duy nhất bằng receipt path/hash bền vững. Successor sibling, kể cả policy và ownergrant byteidentical, SHALL không được init để táchspent; missing/drift receipt SHALL failclosed. Lineage lịch sử chỉseal từ exacthash đã kiểm, không sửa journal/counters.

- R3d (owner reply18:59:12 ngày21/10): V3 SHALL chỉ cấp thêm publication1/CI1/heavy1/review2, tổng trần batchA2/2/3/6; giữ spent, identities, usage, originalStart và deadline23:00. Chỉ kế thừa một V2 CLOSED qua exact hash/single-successor claim. Authorization SHALL mới hơn grant trước và mọi reservation trước; có thể có trước checkpoint close. Không có grant tương ứng, tăng sai, reset, sibling, V3 cấp tiếp V3 hoặc gia hạn SHALL bị từ chối.
- R6: graph Edge SHALL được đưa vào resolver bằng config/lock đã review, đủ20 exact version/SRI và dependency ID rõ ràng, giữ hai nhánh Node types riêng. Cả service/T04 SHALL kiểm input trước/sau bundle và giữ strict cache proof cùng hai replay offline thật. CI nguồn mới SHALL giữ17 gate cũ và thêm gate18 Edge native fresh-cache/hai entrypoint/actual bad-SRI control/closure20/cleanup. Heavy admission SHALL so source và input hashes của gate này với source hiện tại. Native proof không thay OCI backend acceptance; frozen flag chưa được runtime thực thi SHALL không được nhận là bảo vệ độc lập.

## Đóng lượt sau CI25FAIL

Kết quả quan sát cuối lượt: R4/R6 chưa đạt acceptance vìCI25phase8FAIL. R3d/SINGLE lineage đãđóngđúngspent2/2/1/6 và khôngcóheavy mới; R5lưuincident và state. Phần sửa0555/primary-cleanup đượcđềxuất trongincident, chưaápdụng/review; không dùng phầnPASS trướcphase8 thayfullCI18 hoặcbackend.
