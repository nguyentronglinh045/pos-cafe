# Phân quyền — rà điểm chặn và cách kết thúc vòng lặp kiểm thử

Checkpoint 18:06 ngày 20/10/2026 (Asia/Bangkok). Owner yêu cầu tiếp tục, kiểm tra kỹ vì task kéo dài và đề xuất cách xử lý triệt để. Đây là phân tích hiện trạng và kế hoạch kỹ thuật trong D19, chưa phải kết quả sửa xong restore, full test PASS, merge hoặc cập nhật Supabase.

## Kết luận dựa trên bằng chứng

**Điểm chặn kỹ thuật đang lặp lại là cơ chế reset fixture T04. Chưa có bằng chứng xác định lỗi SQL gây ra nó.** Hai lượt gần nhất dừng ở boundary15, `pg_restore` exit1. Lượt05 xác định loại lệnh `ALTER TABLE … DROP CONSTRAINT`, còn error category là UNKNOWN. Không thể kết luận từ đây rằng nghiệp vụ phân quyền sai, rằng E2E đã PASS, hoặc rằng một giả thuyết PostgreSQL đã được chứng minh.

Nguồn đã publish: `7ce1b5c26591a955088022491d609241018b35b5`, branch `run/permissions-20261020`. CI riêng nguồn này PASS17/17; T04 PASS9 stage/275 checks rồi FAIL stage10 quanh reset, 9 stage sau NOT_RUN, **0 reset thành công**. Tổng hiện có **15/35 stage thực tế PASS** trên nguồn7ce (STATIC5 + Native1 + T04 đầu9). Bảy service profile/10 stage chưa chạy. Required coverage, 34 message contexts và 20 operation/outcome cells chưa được đóng bằng runtime cuối.

Hiện working tree còn **11 file chưa publish**: sáu file sửa seed audit theo spec đã được hai reviewer duyệt ở packet13; năm file T04 diagnostics (gồm một module mới) chưa có final source approval. Targeted Node checks đạt25/25; chưa chạy full Node718 hoặc CI/runtime trên aggregate này. Kết quả7ce không được gắn thành PASS của working tree.

## Vì sao mất thời gian

Tính từ thời điểm job thực tế trong metadata đã lưu, không cộng queue/review vào thời gian chạy:

| T04 | Nguồn | Phút job | Điểm dừng / điều đã biết |
| --- | --- | ---: | --- |
| 01 | 7642af4 | 13,68 | Bootstrap; đã sửa canonical mount identity |
| 02 | 3b1314b | 14,82 | Read stage; đã bổ sung readiness probe, không nhận đây là nguyên nhân duy nhất đã chứng minh |
| 03 | 7c52b9a | 18,53 | Reset boundary11; sửa kiểm membership ADMIN-only do PG17 tạo |
| 04 | 7d3b232 | 19,48 | Reset boundary15; phát hiện thiếu việc tái tạo initdb public schema |
| 05 | 7ce1b5c | 16,90 | Vẫn boundary15; loại lệnh DROP CONSTRAINT, nguyên nhân chính UNKNOWN |

Năm job T04 cộng **83,42 phút**. Mười bốn receipt light02–15 có job đúng tên cộng **132,03 phút**; không nhận đây là toàn bộ traffic/thời gian task. Không phải mọi lượt đều vô ích: có lỗi thật đã được sửa. Tuy nhiên, cách thực hiện hiện tại có ba nhược điểm rõ:

1. Chuẩn bị lại môi trường nặng cho từng sửa nhỏ. Cold setup lặp lại, trong khi cơ chế reset chưa được chứng minh hoạt động trước các business stages.
2. Chẩn đoán quá ít: raw stderr chỉ sống trong runtime tạm; cleanup đúng quy định đã xóa môi trường. Số ordinal hiện tại không đủ tái dựng thông báo SQL. Sửa theo một lỗi nguồn xác định được không chứng minh đã sửa nguyên nhân thực tế của lần fail trước.
3. Công việc đang tuần tự hóa rộng hơn dependency kỹ thuật: chưa chạy các service profile độc lập chỉ vì T04 đang fail; nguồn lại tiếp tục thay đổi trước khi có một candidate ổn định. Review/metadata và full light CI lặp qua nhiều vòng sửa, tạo thêm thời gian ngoài job. Không có receipt đủ để quy toàn bộ khoảng thời gian còn lại cho một nguyên nhân cụ thể.

Giới hạn dung lượng **không phải blocker hiện tại**: cloud05 RECLAIMED/imageUnlinked=true, đo thu hồi19.327.401.984B; Windows lúc rà C194.971.918.336B và D98.659.352.576B trống. Không có job branch đang chạy ở readback mới. Không cần tái tạo WSL hoặc tăng quota để chẩn đoán T04.

## Phân biệt đúng các điều kiện còn thiếu

| Việc | Điều thực sự còn thiếu | Chặn bước nào |
| --- | --- | --- |
| Sửa/chạy synthetic tests | T04 reset + diagnostics hữu ích; candidate cuối; đủ35 stage và oracle bắt buộc, không skip/retry-to-green | Full runtime PASS |
| Merge code | Candidate cuối tương thích main, required CI, hai final reviews; actual Vercel Production hold cho mọi route/trigger/alias; quyền merge cụ thể | Merge main |
| Cập nhật Supabase live | Recovery recipe/loader hợp lệ; fresh exact79 cleanup scope so với80 preservation identities; schema/global roles/sequence consumer/Storage API recovery còn thiếu; actor/control/maintenance/window và cutover/postflight cụ thể | Live DDL/DML/Auth/Storage và deploy |

Backup DB/Storage đã capture, private offline restore81/81 đã thực thi và runtime WSL đã dọn. Đó là bằng chứng có giá trị, nhưng chưa tự làm `cleanupEligible=true`. Phần bổ sung recovery live **không phải gate mới cho merge**. Các grant AUDIT/C/C2 cũ đã dùng hết không phải lý do chặn sửa/test thông thường trong quyền execution D19 hiện có. Không mở lại HP1/HP2, full D1/753 graph rows, GPG transport của raw public evidence hoặc yêu cầu owner tuyên bố đã hiểu code.

Read-only Vercel UI mới trong lượt rà xác nhận đúng project/repo,0deployhooks, Ignored Build Step=`Don’t build anything`/`exit 0`, Production hiện vẫn deployment ngày17/10 từ commit4a89cc3. Production branch còn làmain, Auto-assign Custom Production Domains đangON; domain project liệt kê `pos-cafe-azure.vercel.app`→Production. Đây là **partial actual readback**, không còn chỉ biết source flags. Tuy nhiên, chưa có complete alias/routing/protection snapshot hoặc proof cho mọi đường manual/API promotion; không nhận partial này thành all-route hold PASS. Auto-assignON cũng không tự chứng minh merge sẽ bypass ignore hoặc đã deploy. Không thay setting/đọc giá trị env; hai tab tạm đã đóng. Receipt `evidence/provider-ui-readback02.json`.

## Hướng xử lý được đề xuất

**Đổi thứ tự phản hồi và đóng candidate; giữ nguyên yêu cầu sản phẩm và bảo vệ dữ liệu.** Không chạy thêm một full T04 chỉ với hy vọng hai ordinal mới sẽ đủ giải thích.

1. **Làm xong chẩn đoán trước lượt cloud kế tiếp.** Review năm file diagnostics hiện có, kiểm bằng counterexamples và thêm kiểm khả năng lấy log thực ngay đầu fixture. Cần chứng minh actual log driver/destination/prefix và đối chiếu một lỗi kiểm soát được với đúng session/SQL; không chỉ dựa trên unit parser hoặc một ERROR gần thời điểm restore. Chỉ xuất finite allowlist; không SQL, PID, token, ID hay free text vào public log. Nếu không có kênh quan sát phù hợp thì dừng diagnostic tại đây, ghi chính xác capability thiếu; không chạy275 business checks rồi mới phát hiện log không dùng được.
2. **Kiểm roundtrip reset ngay sau checkpoint trên cùng backend synthetic.** Đây là kiểm runner, không được tính vào19 business stages hay10 reset bắt buộc. Vẫn giữ physical DB/container/volume, original baseline và Storage checks; không đổi archive, ownership/ACL, bỏ `--clean` hoặc bỏ single transaction chỉ để PASS. Nếu roundtrip fail, lấy nguyên nhân có thể hành động rồi cleanup; không chạy tiếp bộ nghiệp vụ trên fixture hỏng. Nếu pass, vẫn phải chạy đủ19 stage/10 reset và kiểm lỗi chỉ xuất hiện sau mutation thực.
3. **Chốt một đợt sửa dựa trên lỗi thực tế.** Gom seed audit false đã xác nhận với sửa runner có bằng chứng. Diagnostics phải chỉ ra đủ để phân biệt cơ chế lỗi và chọn sửa; chỉ SQLSTATE chung chung vẫn có thể chưa đủ để biết constraint/dependency nào. Trước khi xem xét kênh private mới, dùng phương án D19 hiện có: parse DUY NHẤT toàn bộ lệnh DROP CONSTRAINT thực thất bại (đúng quoted identifiers PostgreSQL), đối chiếu archive TOC/session, rồi query parameterized read-only trên cùng physicalDB sau rollback. Chỉ khi đúng một constraint khớp mới xuất các giá trị hữu hạn đã định nghĩa trong source cho nhóm schema/type/local/inheritance/parent/dependency; không identifier/SQL. Zero/multiple/unsupported giữ UNKNOWN. Catalog lúc này là trạng thái SAU manual schema drop đã commit nên target có thể thiếu; không hứa cách này luôn đủ. Nếu các cách finite này vẫn chưa cho nguyên nhân có thể hành động, dừng nhánh T04 và nêu capability còn thiếu; không tự mở privacy/raw artifact, nới guard hoặc thêm lượt chẩn đoán mù. Không sửa toàn bộ platform schema theo giả thuyết.
4. **Freeze candidate và chạy các phần độc lập có thứ tự.** Sau review nguồn, publication và local checks thích hợp, chạy own light CI, T04 và bảy service envelopes tuần tự; một heavy environment, reclaim xác minh trước môi trường tiếp theo. Ưu tiên service liên quan seed vừa sửa để phát hiện lỗi sản phẩm sớm; không coi T04 FAIL là dependency kỹ thuật của mọi profile. Khi phải đổi nguồn, xác định phần bị ảnh hưởng từ dependency thực và gate hiện hành; chỉ tái sử dụng phần độc lập nếu chứng minh được và contract cho phép. Mặc định không chuyển PASS nguồn cũ sang candidate mới.
5. **Đóng hai đường bàn giao riêng.** Chuẩn bị merge candidate và đọc actual provider hold; đồng thời chỉ đọc/chuẩn bị phần recovery live còn thiếu. Không chờ live recovery để hoàn tất mọi việc merge. Khi đủ bằng chứng, owner phê duyệt đúng hành động merge/live cụ thể; quyền hiện tại không bao gồm hai hành động đó.

Đây là điều chỉnh thực thi do agent đề xuất, chưa phải code preflight đã hiện thực hoặc quyết định owner thay acceptance. Review phải xác nhận preflight không làm yếu same-backend/coverage/guard. Không xây thêm bộ graph/certification/controller tổng quát cho kế hoạch này.

## Điều kiện để thoát vòng lặp

- Lượt cloud kế tiếp có mục đích rõ: chứng minh kênh chẩn đoán + roundtrip, rồi mới business checks. Nếu fail mà thông tin không đủ hành động, không dispatch lại cùng cách chạy.
- Không retry test/SQL để đổi đỏ thành xanh. Mỗi lỗi giữ receipt cũ; bản sửa có phạm vi và counterexample, hai scoped reviews cho sensitive candidate, rồi kiểm đúng phần ảnh hưởng và gate bắt buộc.
- Một danh sách blocker hiện hành thay cho tăng số chứng chỉ: restore runner; full runtime/oracles; final source/CI/reviews; provider hold; live recovery/cutover và quyền riêng. Chỉ thêm blocker khi có requirement hoặc lỗi thực, ghi rõ chặn bước nào.

## Dự toán có điều kiện

Chưa có số đo thời lượng bảy service profiles, nên **chưa có ETA toàn task đáng tin**. Các khoảng dưới là planning assumptions, không phải cam kết hoặc suy timeout thành thời gian xong:

| Phần | Cơ sở / dự trù |
| --- | --- |
| Hoàn thiện chẩn đoán/preflight và review | Dự trù45–90 phút công việc; có thể tăng nếu kênh log không bảo đảm hoặc cần cơ chế private mới |
| Own light CI của candidate cuối | Các lượt PASS gần đây khoảng10–14 phút, chưa tính queue |
| T04 sau sửa | Các lượt cũ13,7–19,5 phút nhưng đều FAIL sớm; full19 chưa có số đo. Budget job35 phút, không phải ETA |
| Bảy service profiles | Nếu giả định15–25 phút/profile thì105–175 phút runtime; chưa có dữ liệu xác nhận. Mỗi job vẫn cap35 phút, chạy tuần tự |
| Merge/live | Provider/owner wait tách riêng. Live còn các phần chưa hiện thực/đo nên chưa chốt giờ cập nhật Supabase |

Không cộng các khoảng giả định thành cam kết giờ xong. Tám backend jobs hiện có cap35phút/job, tổng trần cấu hình4giờ40phút cho một lượt mỗi job; đây cũng không phải ETA hay trần toàn task. Nếu roundtrip hoặc service phát hiện lỗi mới, phải sửa và điều chỉnh dự toán. Queue/owner/provider ghi riêng.

## Bằng chứng và đường đọc

- [CI7ce PASS](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39393379047), [T0405 FAIL](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39395000047); metadata/receipts ở `D:/Workspace/pos-cafe-permission-run-20261020/evidence/cloud-{light15,t0401..05}*`.
- [Runner:54](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-t04.mjs:54) chỉ ghi stage PASS sau restore; [fixture:259](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-t04-fixture.mjs:259) là reset; [workflow:109](D:/Workspace/pos-cafe-permission-run-20261020/code/.github/workflows/backend.yml:109) tách T04/service, chưa có `needs` giữa chúng; [service profiles:7](D:/Workspace/pos-cafe-permission-run-20261020/code/scripts/permission-runtime-service-profile.mjs:7) chọn bảy envelopes.
- [D19 plan](permission-delivery-replan-2026-10-19.md), [execution handoff](permission-execution-2026-10-20.md); `merge-live-recovery-review01.json`, `seed-audit-13.json`, `private-checkpoint01.json` trong evidence cùng root. Phần source line dùng working tree đang thay đổi, không phải hash commit final.
- PostgreSQL ghi nhận lịch sử lỗi clean partition drops trong [release17.5](https://www.postgresql.org/docs/17/release-17-5.html), nhưng không có actual message/catalog ở lần fail05 để gán lỗi đó cho task. Đây chỉ là lý do tránh khẳng định nguyên nhân từ loại lệnh.

Không cài thêm gói/runtime, không dispatch CI nặng hoặc ghi Supabase/merge/deploy để lập bản rà này. Giữ backup/source/evidence cuối. Các temp cũ từng bị automatic approval review từ chối `blocked by policy` được giữ nguyên, không retry/bypass; không ảnh hưởng khả năng chạy hiện tại trong ngân sách.
