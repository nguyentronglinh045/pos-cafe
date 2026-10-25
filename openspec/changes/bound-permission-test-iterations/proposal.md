> **Đối chiếu xuất bản 25/10/2026.** Các ngân sách, deadline, spent counters và authorization21/10 bên dưới là lịch sử đã kết thúc. Xuất bản hồ sơ không cấp lượt CI/backend/retry mới và không reset ledger. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Giới hạn vòng kiểm thử phân quyền

Hồ sơ chính để cải tiến quy trình và giữ bằng chứng. Đây là công cụ/quy trình, không tạo hành vi sản phẩm nên bỏ usecases.md theo SPEC-STANDARD.

## Quyết định đã chấp nhận — 21/10/2026

Owner trực tiếp: “Ok, triển khai ba sửa theo kế hoạch đã review, áp dụng ngân sách đề xuất và kiểm chứng guard trước khi chạy test nặng. Không giảm coverage, không merge hay cập nhật Supabase; chạm ngưỡng thì dừng và báo rõ.” Owner yêu cầu lưu kế hoạch để cải tiến và làm bằng chứng tương lai.

Nguồn: chat01a15d53-1c67-7350-a326-1cd9f8119b72, turn01a15d8a-1a97-7e91-a1e2-91c279922487. [Kế hoạch đã review](../../../docs/workflow/tasks/permission-loop-prevention-2026-10-21.md), [điều tra gốc](../../../docs/workflow/tasks/session-investigation-2026-10-21.md).

Chọn ba sửa: giữ outcome/facts qua pipeline; kiểm reporter thực trước backend; một admission/helper dùng manifest dữ liệu và ledger chung xuyên SHA/chat. Giữ own-source CI17, coverage, privacy và các gate sản phẩm. Không chọn CI rút gọn vì tạo thêm workstream admission.

BatchA bắt đầu15:18:14, deadline16:48:14 ngày21/10. Trần1publication/1CI/2heavy/2vòng review; cảnh báo output30k hoặc uncachedinput100k, dừng cấp việc mới output50k hoặc uncachedinput150k. Đây không phải native model hardcap; response đang chạy có thể vượt. Xem [checkpoint triển khai](../../../docs/workflow/tasks/permission-loop-prevention-implementation-2026-10-21.md).

## Hiện trạng

Source mới `ed73a415737aaf6d460e90f1756148a6be4d19dc` đã publish qua admission; candidate04 được cả hai reviewerAPPROVE, fullNode810PASS0skip. Own-sourceCI17 run39592119259 đãPASS, original4controls/diagnostic7/20 còn trong finalsummary, nativecleanup được xác minh. PIN_ONBOARD run39593847459 đang chạy; T04còn pending. Chưa tuyên bố backendPASS hoặc change hoàn tất. Không merge/Supabasewrites hoặc giảmcoverage. Checkpoint315/candidate02/17:00 và candidate03 siblingfinding giữ nguyên lịch sử. [Bàn giao hiện tại](../../../docs/workflow/tasks/permission-loop-prevention-implementation-2026-10-21.md) giữ snapshot/patch, counters và recipe tiếp tục.

Mọi lần tiếp tục phải ghi tổng spent, nguồn, điều đã sửa và kết quả mới; không ghi đè verdict cũ hoặc tự reset ngân sách. Mọi cải tiến tiếp theo cập nhật design/testplan/traceability cùng evidence tương ứng.

## Quyết định tiếp tục theo thời gian — 21/10/2026 lúc15:59:29

Owner thay trần token bằng hạn dừng tuyệt đối: “tôi cho phép sử dụng token thoải mái, nhưng về mặt thời gian phải bị giới hạn lại… hạn dừng (bất kể là hoàn thành hay chưa) là17h hôm nay theo giờ của thiết bị… trước thời gian này, hãy chuẩn bị sao cho lần tiếp tục sẽ không gây vấn đề”. Nguồn cùng chat, user message timestamp2026-10-21T08:59:29.676Z. Thiết bị xác minh16:03:15+07:00, SE Asia Standard Time; hạn là2026-10-21T10:00:00Z.

Quyết định này thay token stop và deadline của allocation đang tiếp tục; không cấp thêm publication/CI/heavy hoặc miễn review, coverage, cleanup. Giữ ledger cũ CLOSED làm lịch sử. V2 kế thừa nguyên originalStart/allowance/spent/usage và identity từ predecessor có hash policy/anchor/journal; không mở lại hay sửa ledger cũ. Policy tiếp tục tại evidence/loop-prevention-20261021/budget-continuation-1700.json, SHA25676ae697a048ddd7b4fcec40fa95ae1fb9ab4b628260fba178b935fee14be34b1. Counts trước review:publication0,CI0,heavy0,reviewRounds0.

Chọn dự trữ37phút cho publish/CI và42phút cho backend, gồm giới hạn quan sát cũ32/37phút và5phút collect/checkpoint. Không dispatch khi không còn đủ thời gian. Guard chặn admission, không phải bộ kill process tự động; điều phối phải đóng mọi lượt chạy và lưu bàn giao trước17:00. Lần tiếp tục sau17:00 cần hạn mới do owner cho phép; không tự kéo deadline.

## Tiếp tục đến23:00 — owner18:11 ngày21/10

Owner message2026-10-21T11:11:38.011Z cho tiếp tục, hạn tối đa23:00 cùng ngày theo thiết bị (+07), tương ứng16:00UTC; yêu cầu ưu tiên xử lý ổn thỏa. Token vẫn không đặt trần. Hỏi đúng phần ngân sách hết:2/2 vòng review đã dùng, còn nguyên1publication/1CI/2backend. Owner reply11:13:46.625Z chọn phương án cấp thêm tối đa2vòng review, giữ số lượt chạy/lịch sử và yêu cầu kiểm kỹ trước CI/backend vì đã fail nhiều lần.

Chọn successor V2 có deadline16:00UTC, pin predecessor17:00 đã CLOSED, giữ start/workstream/usage/spent/identities. Chỉ allowance.reviewRounds tăng2→4 theo grant rõ ràng; publication/CI/heavy giữ1/1/2. Không tạo rootledger hoặc reset counters. Sửa guard hẹp để chấp nhận đúng grant2review, tổng tối đa4; thiếu grant, sai số, authorization cũ/replay hoặc tăng execution allowance bị từ chối. Source315a31e0 là checkpoint trước sửa này, không dùng review cũ làm APPROVE source mới.

Trước backend: candidate mới phải qua review source/operations, full Node và actual pinned controls; publication duy nhất tạo own-source CI17; final publicSummary phải còn diagnostic controls7/20 đúng source/lock; native cleanup xác minh; prior reclaim và disk/preflight thực đạt. Chỉ mở T04 đủ19stage và PIN profile đủscope, mỗi lượt có cùng guard. Không chạy selector riêng hoặc giảm acceptance để có PASS.

## Bổ sung Edge và grant18:59

Owner reply2026-10-21T11:59:12.234Z đồng ý kế hoạch bổ sung và tối đa+1publication/+1CI/+1heavy/+2review; hạn23:00, giữ spent, không merge/Supabase, gặp lỗi kiểm chứng tiếp thì dừng phần phụ thuộc. Nguyên nhân mới: online Edge resolver chọn @types/phoenix1.6.8 nhưng pin1.6.7; CI17 npm graph khác không phát hiện. Phạm vi bổ sung R3d/R6 là khóa resolver và tiền kiểm native gọn trước fullbackend, không đổi nghiệp vụ hoặc giảm coverage. Chi tiết/budget/trade-off tại docs/workflow/tasks/permission-edge-resolution-remediation-2026-10-21.md. Ba optional pins không được chuyển thành bắt buộc, không nâng dependency mù để vượt gate.

## Đóng lượt sau CI25FAIL

Kết thúc lượt được cấp thêm: source90e30f2 publication; CI25FAIL phase8Edgecleanup, bảyphase trướcPASS; backend khôngdispatch. LedgerCLOSED counts2/2/1/6, không tự dùng2heavycòn. Task chưa hoàn tất. Đã xác minh archive directories0555 +nonrootrmSyncEACCES/finallymask/reason0; native primary vẫnUNKNOWN. Sửa tiếp cần owned-directory cleanup, táchprimary/cleanup facts và actualLinuxfixture trướcdownload. Chưaáp dụng/review phần này, không tự xin thêmallocation. Incident và evidence ở docs/reviews/2026-10-21-permission-edge-cleanup-incident.md.
