# Phản biện kế hoạch và ngăn vòng lặp kiểm thử phân quyền

Ngày 21/10/2026. Owner yêu cầu root và các subagent phân tích lại nguyên nhân lãng phí token, rồi kiểm xem kế hoạch xử lý có ngăn tái diễn không. Đây là phân tích và đề xuất, chưa áp dụng guard, đổi quyền, acceptance, model hay dispatch CI. Phần khuyến nghị này thay thế dòng 97–111 của [báo cáo trước](session-investigation-2026-10-21.md); giữ nguyên bằng chứng lịch sử.

## Kết luận

**Kế hoạch trước chưa đủ ngăn tái diễn.** Checkpoint “45–60 phút có tiến bộ” cho phép vô hạn vòng tìm thêm ordinal hoặc lỗi mới. “Chạy affected nhỏ nhất” chưa có entrypoint cho T04. Giảm full CI chưa được nối với gate thực tế. Source hiện vẫn mất chẩn đoán timeout/interrupted; chỉ dặn kiểm reporter không khắc phục được lỗi này.

Cần sửa khả năng quan sát của runner và giới hạn tổng chu kỳ xuyên source/chat/tên lỗi, rồi mới đóng các lỗi và nghiệm thu. Có thể chặn chu kỳ chi tiêu vô hạn sau khi controls được triển khai và kiểm chứng. Không thể bảo đảm hết bug hoặc hoàn thành phần mềm trong một ngân sách cố định. Chạm trần mà chưa đạt phải bàn giao chưa hoàn tất, không đổi nghĩa PASS.

Ba nhánh phản biện: failure loops; actual gates/đường thực thi; token/context overhead. Nhánh token trả kết quả ban đầu rồi lỗi `Selected model is at capacity`; root hoàn tất phép tính bằng script, không retry hoặc đổi model. Các contributor không làm reviewer độc lập của phương án cuối. [Evidence và source pins](../../implementation-log/permission-loop-prevention-2026-10-21-evidence.json).

## Các phản ví dụ quyết định

| Lỗ hổng | Bằng chứng | Sửa kế hoạch |
| --- | --- | --- |
| Facts mất sau reporter | [reporter:15](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-playwright-reporter.mjs:15) giữ failed/timedOut/interrupted, [error-facts:46](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-error-facts.mjs:46) chỉ chọn failed, [T04:181](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-t04.mjs:181) dùng projection đó | Kiểm toàn chuỗi trước backend nặng |
| “Affected nhỏ nhất” chưa chạy được | [T04:57](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-t04.mjs:57) đi toàn catalog 19; hai lượt11/12 đều17 PASS/8 reset rồiFAIL, tốn39,27 phút | Không hứa có lệnh chạy riêng stage18; probe chỉ tạo khi có giả thuyết và tiền điều kiện rõ |
| Đổi source lại trả full CI | [preflight13:18](D:/Workspace/pos-cafe-permission-run-20261020/runtime-preflight13.mjs:18) yêu cầu17 phase đúng SHA | Một candidate trong batch; cùng SHA dùng lại receipt CI, không chạy lại trước từng profile |
| Helper vẫn bị clone | [prepare-preflight13:2](D:/Workspace/pos-cafe-permission-run-20261020/prepare-preflight13.mjs:2), [prepare-publication24:7](D:/Workspace/pos-cafe-permission-run-20261020/prepare-publication24.mjs:7) clone/replace nguồn cũ | Tách dữ liệu binding khỏi helper hiện có; không sinh helper theo ordinal |
| Budget được “reset” ngầm | [preflight13:21](D:/Workspace/pos-cafe-permission-run-20261020/runtime-preflight13.mjs:21) kiểm disk/job/reclaim, chưa giới hạn tổng chu kỳ; T0403→05 cùng9 PASS/0 reset dù biết thêm thông tin | Ledger theo workstream, xuyên SHA/lỗi/chat; chạm trần ngừng dispatch mới |

Root đã chạy một phép kiểm thuần Node trên chính `runtimeRunnerFailureFacts`, không DB/browser/network/filewrite. Cùng một synthetic required case có code 31/line 68:

| Input | Output hiện tại |
| --- | --- |
| failed | required ordinal 1, failedTests 1, code 31, line 68 |
| timedOut | required ordinal 0, failedTests 0, không code/line |
| interrupted | required ordinal 0, failedTests 0, không code/line |
| case passed + runner error có top-level facts | runnerErrors 1, không code/line |

Đây là phản ví dụ của hàm thật, chưa phải tái hiện job cũ hay chứng minh toàn pipeline. [Selftest:18](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-reporter-selftest.mjs:18) có pass/retry/Vitest hook, chưa chứng minh các outcome trên qua T04 exporter/collector/cleanup. Vì vậy không khuyến nghị dispatch ngay PIN/T04 chỉ dựa trên Node783 và CI23.

## Token và chi phí điều phối

Stream 2.423 `token_usage_record`, 2.423 responseID duy nhất của parent. Tổng per-response khớp chính xác `thread_token_usage` cuối:

- Input 434.112.063, cached 426.342.144, input không cached 7.769.919.
- Output 2.265.463, trong đó reasoning 1.052.876; không cộng reasoning lần nữa.
- Context input median 176.926 token/response, max 341.377. Điều tra trước ghi20 compactions,254 review followups và117 messages.

Đây không phải tổng billing/all-child hoặc USD. `event_msg.token_count` có tổng khác nên không trộn hai bộ đếm. Child totals chưa hợp nhất. Khi triển khai budget phải thu từng session/responseID, tránh cộng lại cumulative snapshots; reasoning thuộc output, cached thuộc input.

Giảm số vòng, context đọc lại và việc reviewer lặp mới giảm nguồn tiêu hao chính. 35 turn_context dùng xhigh; chưa có A/B để quy lượng lãng phí cho effort. Đề xuất đánh giá medium cho điều phối thao tác, high cho debugging khó; chỉ dùng xhigh khi lợi ích đo được. Chưa đổi setting. [OpenAI Docs](https://developers.openai.com/api/docs/guides/reasoning) mô tả đánh đổi effort/latency/cost; `max_output_tokens` của API không tự là giới hạn cho chat desktop này.

## Phương án chọn để chuẩn bị

**Giữ gate own-source17 phase hiện hành trong bước đầu.** Không mở thêm đường CI debug rút gọn: đổi gate ngay tạo thêm workstream admission/quyền. Gom sửa quan sát, trả một lượt CI cho candidate mới, rồi dùng receipt đó cho mọi profile cùng SHA. Chỉ đề xuất đổi lịch CI sau nếu số đo mới vẫn cho thấy nó là nút thắt; phải duyệt delta trước áp dụng.

Ba sửa có đầu ra cụ thể, dùng công cụ hiện có:

1. Sửa projection/parser/exporter để phân biệt failed, timedOut, interrupted, runner-error, wrapper-failure và missing/invalid report. Giữ `failedTests` đúng nghĩa; thêm outcome/count hữu hạn. Không gán lỗi cấp runner giả cho testcase. Giữ strict validation của source/run/invocation/identity/attempt và privacy allowlist.
2. Mở rộng selftest bằng actual pinned reporter, đưa safe facts qua đúng parent/parser/export/collector trước reclaim. Kiểm metadata có/không có, report malformed/oversized/stale, secret sentinel không ra public. Negative control phải phát hiện khi bỏ bước giữ facts. Không chỉ chạy unit parser. Controls nhỏ không cần Supabase backend; recipe chi tiết và actual controls chưa có. Không chuẩn bị được thì dừng trước backend nặng.
3. Bổ sung batch budget/binding vào admission/helper hiện hữu. Một manifest dữ liệu chứa workstreamID, original deadline, candidate, receipt/review refs, allowance và spent; cùng helper dùng qua nhiều profile. Giữ packet cũ immutable/provenance. Kiểm hai manifest kế tiếp cùng helper, sai/mất binding và hết allowance phải bị từ chối. Đây là thiết kế đề xuất, chưa là guard đã bật.

Raw stage logs hiện0600/cap 1 MiB, [stage:47](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-stage.mjs:47). Runner được phép đọc raw trong môi trường để tạo finite facts trước cleanup; collector/root nhận allowlist. Không tải raw leak/PIN/SQL/stack về public/Windows. Nếu thiếu capability để xác định leak, ghi rõ và xin đúng quyền; giữ scanner và custody hiện hành.

## Batch hữu hạn

Các ngưỡng dưới là đề xuất ban đầu của agent, chưa được owner chấp nhận, chưa là quota kỹ thuật hoặc ETA.

| Batch | Kết quả | Trần vận hành đề xuất |
| --- | --- | --- |
| A: quan sát và hai lỗi mở | Candidate S gom 316+diagnostic fix; actual controls PASS; own CI17 PASS; một PIN_ONBOARD và một full T04 trên S, thu/reclaim | 90 phút wall gồm code/review/queue/job; tối đa1 publication,1own CI mới,2 heavy invocation;2 reviewer, tối đa2 vòng findings |
| B: nghiệm thu S | Chỉ sau A đạt: sáu service profiles còn lại, oracle bắt buộc và final actual reviews | 180 phút wall; tối đa6 heavy invocation;0 publication/0 CI lại cùng SHA; gom actual review cuối |

Budget model mỗi batch: cảnh báo ở output 30.000 hoặc uncached input 100.000; ngừng cấp việc mới ở output 50.000 hoặc uncached input 150.000. Từ cảnh báo phải dành ngân sách còn lại cho cleanup/handoff. Tính cả contributor/reviewer/session trong ledger chung. Bộ đếm tree thiếu thì ghi UNKNOWN, không tuyên bố đang dưới quota; vẫn áp trần thời gian/lượt job. Đọc usage ở ranh giới việc, không tạo vòng polling chỉ để đo token.

Token stop hiện chỉ điều phối tại tool/message boundaries, có thể vượt do response/child đang chạy. Chưa có native aggregate budget stopper được cấu hình/kiểm. Admission chỉ chặn dispatch/child nó kiểm soát, không tự dừng model. Muốn hardcap toàn tree phải xác minh harness hỗ trợ và kiểm riêng; không hứa50.000 là trần tuyệt đối.

A/B cùng một workstream phân quyền. Đổi SHA/lỗi/helper/chat không tạo allowance. Sau FAIL chỉ chạy profile thứ hai đã ghi nếu độc lập, còn budget và giá trị phép đo đã nêu trước. Hết batch/budget ngừng dispatch mới, giữ receipt, thu/reclaim trong quyền rồi bàn giao blocker. Mở vòng sửa tiếp cần quyết định rõ scope/ngân sách bổ sung; vẫn ghi tổng lũy kế, không reset bằng lời “tiếp tục” chung chung.

Không dispatch khi deadline không còn đủ timeout/cleanup reserve. Job35 phút không phải ETA; full T04 PASS 19 stage chưa đo. Queue có thể khiếnA hết giờ. Không kill DB/cleanup giữa chừng để giữ con số90 phút: job đang chạy theo timeout/reclaim hiện hành, ghi overrun; đây không phải hardkill tuyệt đối. Budget hết không cho phép bỏ test hoặc nhận PASS.

## Thứ tự và điều kiện đóng việc

1. Thu đúng CI23 đã SUCCESS/source 316/Native cleanup và ảnh theo contract; không rerun vì Windows observer bị tắt. Dùng checkout và handoff hiện có, không WSL mới, không đọc lại toàn bộ 74 MB transcript.
2. Trước publication, chốt outputs của controls và cách thu actual evidence cho oracle cuối. Receipts hiện ghi `NOT_PROVEN_BY_STAGE_COUNTS`:35 stage PASS không tự chứng minh34 message chains/20 cells. Đối chiếu mapping/runner liên quan; thiếu extractor/capability báo ngay trong A, không chờ hết job rồi tạo dự án mới. Không audit lại toàn graph 652/753 rows.
3. Gom patch diagnostic và admission dữ liệu/budget thành S; targeted Node/pinned reporter controls, hai scoped reviews, exact publication vàown CI một lượt. CI FAIL thì dừng phần cần sửa nguồn vì publication allowance đã dùng; giữ lỗi, không tự mởcandidate kế tiếp.
4. Cùng S chạy PIN_ONBOARD vàfull T04 tuần tự, collect/reclaim. Không có stage18 selector hiện hữu. Chỉ chuẩn bị probe khi một lỗi có giả thuyết và tiền điều kiện đủ; probe được review và chỉ diagnostic, không thay19 stage/10 reset nghiệm thu.
5. Vào B khi A đủ gate và kế hoạch/budget được chấp nhận. Source không đổi thì PASS của A thuộc cùngS được dùng; PASS 206/84fc không được đổi nhãn. Final validation FAIL thì ngừng dispatch mới, đóng receipt/reclaim và báo phép sửa quyết định, không tự quay vềA vô hạn.
6. Phân biệt runner quan sát đã sửa; runtime/oracle closure; merge readiness; actual merge; live recovery/cutover/Supabase. A/B không tự cấp quyền merge/live. Định nghĩa đạt giữ nguyên các acceptance còn hiệu lực.

## Giảm việc phụ

Root giữ một ledger hiện hành: tối đa hai lỗi affected, một candidate, spent và next action; lịch sử giữlink. Handoff mục tiêu khoảng 600 từ có path/hash, không cắt bằng chứng trọng yếu để đạt số từ. Hai reviewer chia source/correctness và operations/evidence, gom findings theo candidate; người không bị ảnh hưởng đối chiếu delta theo workflow. Sau 2 vòng chưa đồng thuận bàn giao CHANGES_REQUESTED/BLOCKED, không ép APPROVE hay thay reviewer. Gom actual receipts cuối; không review lại cùng blob/ảnh mỗi profile nếu gate không đòi.

Watcher hiện có tự poll API 30 giây. Một watcher/run; LLM không cần lặp đọc log hoặc sửa watcher để chờ. Thu terminal result/exception với cutoff gốc. Chỉ dùng cơ chế thông báo/wakeup đã được ủy quyền; không tự tạo automation hoặc hứa tự resume khi chưa cấu hình. Checkpoint giao tiếp không kích hoạt thêm review/audit.

Không clone freeze/publish/watch/preflight theo số lượt. Helper version và manifest data được review đúng phạm vi; không xây controller/graph/chứng chỉ tổng quát ngoài ba sửa trên.

## Thử kế hoạch bằng phản ví dụ

Đây là tabletop analysis, chưa là PASS của guard chưa viết:

| Kịch bản | Quyết định phải có |
| --- | --- |
| timeout/interrupted bị bỏ facts | Control FAIL, không mở backend nặng |
| Unit parser PASS nhưng bỏ parent/export/collector | Negative control toàn chuỗi phải FAIL |
| Biết thêm ordinal nhưng thiếu discriminator | Không đủ lý do mở attempt mới; allowance giữ nguyên |
| Đổi SHA/lỗi/chat sau 2 attempt | Ledger giữ spent, không tự cấp thêm |
| Observer bịkill, GitHub PASS | Thu run cũ, không dispatch lại |
| Cùng SHA chuyển PIN→T04 | Reuse CI receipt; vẫn fresh disk/noactive/reclaim |
| Artifact leak chưa giải thích được | Giữ FAIL/scanner/privacy; báo capability thiếu |
| Reviewer bất đồng sau 2 vòng | Giữ finding và trạng thái chưa đạt, không thay reviewer |
| 35 stage PASS, oracle chưa actual binding | Không nhận full acceptance; gap phải biết trước dispatch |
| Chạmdeadline/token khijob cleanup | Không dispatch mới; reclaim đúng quyền, ghi overrun/UNKNOWN |

## Trạng thái bàn giao

Phương án ngăn các đường lặp đã tìm thấy sau khi ba sửa được hiện thực, controls có counterexamples thực và ledger/admission được kiểm. Hiện chỉ tái hiện lỗi hàm thuần và phân tích kịch bản; chưa thể tuyênbố xử lý dứt điểm. Bug chưa biết, outage hoặc giới hạn công cụ vẫn có thể khiến phần mềm chưa hoàn thành; cần dừng có bằng chứng/ngân sách rõ, giữ acceptance.

Disk lúc kiểm C192.315.633.664B/D98.642.595.840 B free. Không cài gói, CI/backend/DB/browser hoặc sửa source/settings. Thay admission/điều kiện mở thực thi là phần nhạy cảm cần review và quyết định owner trước áp dụng. [Biên bản review](../../reviews/2026-10-21-permission-loop-prevention.md) chỉ duyệt phân tích, không thay owner chốt ngân sách hay quyền triển khai.
