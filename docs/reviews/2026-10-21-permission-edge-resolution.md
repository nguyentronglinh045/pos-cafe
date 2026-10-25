# Review sửa resolution Edge — 21/10/2026

Owner reply11:59:12.234UTC cho thêm tối đa1publication/1CI/1heavy/2review, giữ spent và hạn23:00. Gate review vẫn hai scope độc lập, read-only; không install hoặc dispatch. [Kế hoạch/bằng chứng](../workflow/tasks/permission-edge-resolution-remediation-2026-10-21.md).

Candidate05 SHA256 `a29ac688c35c2a1ffbd34121c271e9b74b6da896c47598aa07f0d718a076c485`: operations APPROVE; source **CHANGES_REQUESTED**. Không publication/CI/backend từ candidate này.

Source reviewer phát hiện hai blocker: (1) archive releasev1.74.3 nhưng source CLI crate0.1.0/Deno2.1.4, matcher dùng1.74.3 sẽ fail trước bundle; (2) V3 so timestamp reservation cuối thay vì timestamp lớn nhất, tái hiện bằng API thật append thời gian không theo thứ tự. Operations kiểm51snapshots/96pins/821TAP, actualgrant/counts5 và tài nguyên/cleanup không thấy blocker trong scope. Approval operations không ghi đè source finding.

Bản sửa sau05 giữ archive SHA256; matcher dùng exact source-derived banner và test sai CLI/Deno/profile/architecture. Grant so max timestamp của mọi cumulative reservation; invalid timestamp failclosed, thêm API regression non-monotonic. Policy/ledger/spent không đổi. Candidate05/reviews.json và snapshots giữ nguyên lịch sử. Native binary chưa được chạy trên Windows; actual CI nguồn mới vẫn là gate bắt buộc.

V3 được giữ hẹp: chưa hỗ trợ time-only successor từ V3. Sau close23:00, lần sau cần ownerdeadline mới và guard/spec/review phù hợp, kế thừa exact history; không tạo root/reset. Không mở thêm cơ chế chưa cần chỉ để giải quyết lần tiếp tục giả định.

Candidate06 SHA256 `a0a8e556aca511b753a9919b55af11cdf61bc85107dd231b4154f8b150b772b2`: **source APPROVE và operations APPROVE**. 55snapshots/96canonicalpins khớp, source độc lập33testsPASS, fullTAP823PASS0skip, maxALLtimestamp và exactbanner đã đóng cả hai finding. Actualpolicy vẫn3c222cb, counts1/1/1/6 trướcpublication, deadline23:00.

Sauapproval, helper đã commit/push source90e30f2 đúng18file qua actualadmission. CI25 run39600415703 đang chạy; counts2/2/1/6, own-sourceCI18/native/backend cònPENDING. Approval không biến dispatch thànhPASS; không có thêmpublication/CI/review được cấp.

Kết quả cuối: CI25FAIL tạiphase8Edge; sevenpriorphasesPASS không thay fullCI18. [Incident độc lập và gap cleanup0555](2026-10-21-permission-edge-cleanup-incident.md). Approval06 không bị viết lại; record rõ actualgate chưa đạt. Khôngbackend/retry, V3CLOSED counts2/2/1/6. Bản sửa cleanup tiếp theo chưa áp dụng/review.
