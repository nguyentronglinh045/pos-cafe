# Chẩn đoán độc lập stage10 T04 — 24/10/2026

Trạng thái: fallback có điều kiện đã kích hoạt sau whole T0440068845295/a1 FAIL; thiết kế/triển khai công cụ đang chuẩn bị, chưa có diagnostic run.

## Bằng chứng và ủy quyền

Người dùng đã chỉ đạo: “cho phép 1 lượt, nhưng nếu lượt đó thất bại, hãy chỉ rõ ra vấn đề lỗi và phương án sửa. nếu khong được thì tiến hành tách t04 đó ra nhỏ hơn và chạy độc lập thay vì cố chạy 1 lượt”. Whole run đã dùng một lần, source34db1b13/fpfa38, CI40067504649 PASS18. [Observed failure](t04-hardening-observed-failure01.json) giữ evidence: Candidate full6 PASS một lần, parentphase5/helperphase3 runtime.measure FAIL, internal oracle UNKNOWN; first9 stages/275required PASS, next9 NOT_RUN, inner/outer cleanup thành công, một reclaim/imageUnlinked đo19327393792B. Hai reviewer độc lập đã xác nhận integrity và giới hạn attribution; không coi đây là test TC47/clear-demo cũ lại fail.

Điều kiện fallback được root đánh giá đã thỏa: lỗi trong runtime.measure không xuất chi tiết đủ để xác định nguyên nhân. Người dùng đã cho phép chia nhỏ để chạy độc lập; không hỏi lại quyền đó. Phạm vi thực thi tiếp theo là công cụ diagnostic, regression/local review và publication/CI cần thiết để chạy một segment trên source mới đã kiểm. Quyền có điều kiện này không cấp thêm whole T04, không reset cumulative6/6/6 đã dùng, không cho merge/deploy hoặc bảy profile khác. Ghi riêng số publication/CI/segment của fallback, không gọi chúng là lượt whole thứ7. Không tạo vòng lặp cloud vô hạn; đầu tiên chỉ một fresh segment, quyết định sửa theo evidence rồi ghi lại bước xác nhận cần thiết trong phạm vi đã giao.

## Segment nhỏ nhất và bất biến

Chọn duy nhất whole-stage `candidate-e2e` (stage10 hiện hành). Dựng một owned synthetic backend mới, baseline/checkpoint/preflight đúng recipe, chạy nguyên full-file six Candidate tests một lần, sau đó helper đo ảnh hiện tại, observe, restore original và physical/storage verification. Không dùng test-name grep, không thay fixture bằng một activated shortcut chưa chứng minh tương đương, không bỏ clear-demo hoặc giả observations. Chín stage trước không chạy lại trong segment; chín stage sau chưa được xác nhận.

Receipt/schema/scope của segment phải khác whole T04 và luôn ghi `DIAGNOSTIC_ONLY`. PASS segment chỉ chứng minh phạm vi này trên backend riêng, không đóng whole19/291 hoặc full35/760. Renderer whole T04 giữ nguyên yêu cầu19ordered stages/same physical backend/checkpoint/10resets/image proof/cleanup; không ghép275PASS cũ với segment backend mới. Acceptance12obligations/34contexts,A18/D19, retries0, existing deadlines/time windows và expected errors giữ nguyên.

## Observability hữu hạn

Thêm fixed internal measure-step/failing-predicate ordinal, completed mask của24observations và exception-kind allowlist/UNKNOWN nếu cần. Preserve first failure và sticky cleanup bit; quan sát chưa đến vẫn UNKNOWN. Chỉ emit bounded diagnostic facts khi failure, không raw exception/stack/SQL/URL/header/object key/token/DOM hoặc log liên tục. Phải chứng minh actual helper failure → marker → root-owned file → outer recovery → collector; cap receipt131072B/attachment16384B không tăng. Temporary exploratory logging nếu có phải bỏ khi fix được xác nhận; retained finite diagnostic guards và bằng chứng lịch sử không tự là temp.

## Verification và vận hành

Builder backend_acceptance đề xuất file design trước sửa. Root điều phối brief/pins/packet/source freeze; main_integration và final_diagnostic_review giữ vai trò non-author độc lập. Kiểm targeted regression về selector/scope rejection, wrong/duplicate stage, wrong binding, unsafe transport, timeout, cleanup và whole renderer không nhận subset. Chạy existing dependencies/browser, không cài thêm local. Hai reviewers phải APPROVE source/recipe/packet trước publication/CI/segment; kiểm actual CI mới gắn source thay đổi, không nhận PASS34db cho source mới.

Mỗi lần chỉ một heavy environment, cloud loop18GiB/outside1GiB/task20GiB/reserve30GiB và deadline gốc, không cấp lại đồng hồ giữa phase. Đo ổ Windows C/D trước ghi lớn và checkpoint; retained cap805306368B, không theo symlink. Runtime trước đã thu hồi trước segment mới. Không tạo local WSL/Docker. Source/log/evidence giữ gọn; năm control mới chưa được phép xóa vẫn giữ,36control cũ từng bị automatic approval review chặn không thử đường vòng.

## Đầu ra cần có

Một segment command và receipt đúng scope; bounded evidence xác định bước/predicate lỗi hoặc nói rõ UNKNOWN còn lại; root-cause/fix có regression phù hợp; kết quả xác nhận riêng của phần đã chạy. Báo cáo cuối giữ whole T0440068845295 FAIL lịch sử, toàn bộ stage chưa chạy/acceptance chưa đóng, và chưa merge/deploy. Không hứa fix triệt để trước khi bằng chứng runtime xác nhận.
