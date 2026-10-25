# Điều tra độc lập vòng lặp session phân quyền — 23/10/2026

Trạng thái: bản phân tích chờ review cuối; không phải phê duyệt triển khai hoặc thay cổng nghiệm thu.

## Đề bài, phạm vi và nguồn

User yêu cầu dùng subagent điều tra [Điều tra session xử lý lâu và lỗi](codex://threads/01a15d53-1c67-7350-a326-1cd9f8119b72): nguyên nhân vòng lặp, tầng đang kẹt, hướng sửa/ngăn tái diễn và phương án cho hạn hôm nay 23/10. Đây là task phân tích; không giao sửa ứng dụng, chạy test, truy vấn DB hoặc phát hành.

Hai investigator chỉ đọc: `/root/session_history` đọc đủ 47 turn từ 21/10 14:21 đến 23/10 15:50 (Asia/Bangkok); `/root/technical_blockers` đối chiếu code, hồ sơ và đường chạy thay thế. Root đối chiếu nguồn và viết bản này. Không gửi lệnh hoặc tin nhắn vào chat mục tiêu.

Source xác minh: checkout hiện tại `D:/Workspace/pos-cafe` main `5156820f7d6679cd6f8051bdc38419737ffa0c7e`; candidate thực của task là checkout sạch `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, commit `e42215044b4faf7e90f787ae8e975937ad3e4479`. Docs baseline `0fe967d554cecfa7e0cb58d6efa01d64941439ff` có nhiều thay đổi sẵn từ các task khác; bản này là file mới riêng, không sửa/index/commit các thay đổi đó. Không xem cwd main là source đã kiểm của feature.

Đọc workflow và chuẩn spec trên docs; đây là hồ sơ phân tích/bàn giao, không tạo change hay yêu cầu sản phẩm mới. Các khuyến nghị phía dưới chưa được owner chọn. Trạng thái tạm dừng của task triển khai vẫn giữ.

## Kết luận và cơ chế vòng lặp

Nút thắt gần nhất nằm ở tooling chạy kiểm thử và điều phối do agent chuẩn bị. Không có bằng chứng để kết luận DB nghiệp vụ liên tục hỏng. Đồng thời, chưa kiểm đủ để kết luận DB/tính năng an toàn hoặc sẵn sàng phát hành.

Chuỗi lặp quan sát được: phát hiện gap → thêm/sửa runner, parser, guard hoặc oracle → chạy bằng tooling có giả định chưa được chứng minh → gặp lỗi mới → điều kiện FAIL/UNKNOWN-stop kích hoạt → lập gói/review/xin cửa sổ mới. Nếu sửa tracked source thì phải đánh giá lại evidence trên candidate mới. Dừng theo grant là đúng; lựa chọn nhiều lớp công cụ tự viết, cửa sổ quá nhỏ và kế hoạch thiếu toàn đường tới đích đã làm việc dừng lặp lại.

| Nguyên nhân | Bằng chứng và tác động |
| --- | --- |
| Công cụ kiểm tra tự tạo lỗi trước ứng dụng | Orphan fixture Windows không tạo đúng tình huống; parser giả định tar root `package/`; mismatch count7/9; runner lọc env bỏ PATHEXT. [Audit trước:30](permission-breakpoint-review-20261023/paused-root-cause-audit.md:30). |
| Thu lỗi không đủ | Catch đầu thiếu stage/item/cause; archive thất bại không giữ body nên phải lấy lại để phân xử. Hai parser sau thấy7file+2directory và SRI đúng; không phải bằng chứng tải hỏng. [Count diagnosis:25](permission-breakpoint-review-20261023/bp04a-countdiag02-outcome.md:25). |
| Review chưa thử đúng boundary thực thi | Manifest/native probe bằng absolute Node không thử npm→CMD→bare `.cmd`; hai reviewer vẫn bỏ sót command resolution. [Outcome:43](permission-breakpoint-review-20261023/bp04a-local75-01-outcome.md:43). |
| Quyền thực thi quá vụn và thời gian ghim vào executable | COUNTDIAG01 có7phút để viết/control/hai review; trễ admission5giây, GET0. Mỗi FAIL-stop hoặc cửa sổ hết hạn lại đòi quyết định mới. Không phải mọi lần hỏi lại đều vô cớ, nhưng thiết kế gói công việc tạo overhead. [Audit:36](permission-breakpoint-review-20261023/paused-root-cause-audit.md:36). |
| Gap được phát hiện muộn và candidate liên tục đổi | Sau backend partial PASS mới tìm thiếu IndexedDB oracle; tiếp CORS/PIN/ảnh làm nguồn đổi4d1→4f→e422. PASS cũ không tự thành full PASS mới. Không được sửa lại lịch sử để giảm phần còn thiếu. [Audit:22](permission-breakpoint-review-20261023/paused-root-cause-audit.md:22), [BP3:44](permission-breakpoint-review-20261023/bp03-outcome.md:44). |

LOCAL75: khoảng18phút14giây từ grant tới admission, execution khoảng29giây; npm cài13giây rồi build dừng trong khoảng1,5giây. NEXT01 chuẩn bị10phút33giây, chạy archive0,916giây rồi fail. Đây là hai ví dụ về overhead lớn hơn execution, không phải phân rã toàn bộ47turn thành thời gian lãng phí. Không có cơ sở quy nguyên nhân chính hiện tại cho token, thiếu disk hay CI queue. [LOCAL75:47](permission-breakpoint-review-20261023/bp04a-local75-01-outcome.md:47), [NEXT01:22](permission-breakpoint-review-20261023/bp04a-next01-outcome.md:22).

## Tầng đang kẹt và cách sửa cụ thể

| Tầng | Hiện trạng đã đối chiếu | Hướng xử lý có căn cứ, chưa thực thi |
| --- | --- | --- |
| Local tooling/build | Archive46/46, npm ci/native load PASS; `tsc not recognized`; chưa có TypeScript diagnostics,110file app unit/coverage NOT_RUN. Tooling Node955 PASS không thay app unit. [Outcome:18](permission-breakpoint-review-20261023/bp04a-local75-01-outcome.md:18), [BP3:34](permission-breakpoint-review-20261023/bp03-outcome.md:34). | [operations runner:105](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/run-bp4-local75-01.mjs:105) bỏ PATHEXT dù shim tồn tại. Nguyên nhân mạnh nhưng chưa chứng minh nhân quả. Kiểm bare `tsc --version`/`vite --version` ở đúng npm/CMD/env, âm/dương; nếu đúng thì sửa env helper, dùng lại dependency/source phù hợp, không reinstall hoặc sửa app để né. |
| CI/backend | CI03/LIGHT PASS thuộc4f; CI và cả8whole backend profile e422 NOT_RUN. Có backend PASS trên source cũ, không phải8profile hiện đang FAIL. [CI03:3](permission-main-staging-night-20261022/continuation03.md:3), [BP3:34](permission-breakpoint-review-20261023/bp03-outcome.md:34). | Sau source freeze, kiểm phần bị ảnh hưởng và các gate bắt buộc trên đúng candidate; không cộng các SHA thành full PASS. Gói60phút chỉ build/unit, không phải ETA đóng main+DB. |
| DB staging | Schema/RPC/RLS b2 đã apply và marker khớp, COMMITTED_NOT_READY; chưa functional acceptance. [Setup:19](../workflow/tasks/permission-staging-setup-2026-10-22.md:19). | Giữ DB hiện có; đối chiếu delta/source, không replay bootstrap hoặc viết lại phân quyền để sửa lỗi shell. Lượt này không query live. |
| Auth/hosted/ảnh | Auth/session và Edge hosted chưa đủ bằng chứng. Snapshot Confirm email ON ngày22/10 là lịch sử. Code dùng email tổng hợp [storeKey:34](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/storeKey.ts:34) và yêu cầu user/session khớp [authRepo:81](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/authRepo.ts:81). | Readback trong phạm vi được cấp; nếu confirmation còn ON, xử lý tương thích Auth theo quyết định staging cụ thể rồi kiểm create/login/session thật. Edge deployment/ảnh là việc còn riêng; lỗi CORS thiếu `x-client-info` cũ đã được sửa ở [menuImageHttp:8](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/supabase/functions/_shared/menuImageHttp.ts:8); hosted PASS vẫn chưa có. |
| Main/phát hành | Full gate35stage/760required/12nghĩa vụ+D19/R0/R1 còn thiếu cho candidate mới. | Giữ gate hiện hành tới khi owner quyết định thay đổi nghiệm thu. Staging hoạt động không tự cho merge main, DB gốc hoặc production. |

## Ngăn tái diễn

1. Định nghĩa một đầu ra hữu hạn trước khi chạy: source, môi trường, testcase, evidence và điểm dừng. Báo hoàn thành từng mốc thực tế, không dùng “thêm60phút” cho gói chỉ sửa một blocker như ETA hoàn tất tính năng.
2. Ưu tiên CLI/test sẵn có. Ngừng mở rộng parser/archive/controller tổng trong đường găng của demo; không xóa guard, history hoặc giảm coverage. Nếu thay tooling, giữ lock/SRI, ngân sách và quyền tương đương, review phạm vi thay đổi.
3. Chuẩn bị runner trước cửa sổ execution. Tách deadline/grant thành dữ liệu admission có kiểm chứng thay vì copy logic mỗi lần đổi giờ. Đề nghị một gói sửa môi trường có giới hạn và quyền rõ, thay vì xin từng lệnh; không áp dụng ngược vào grant FAIL-stop đã kích hoạt.
4. Trước suite dài, chạy chuỗi thật nhỏ trên đúng boundary shell→client→Auth→RPC/browser. Lưu stage, cause, request identity, exit và bounded raw evidence ngay lỗi đầu. Không nhận kiểm manifest thay kiểm đường chạy.
5. Freeze source trước gate tốn thời gian; gom findings thành batch hữu hạn. Tái dùng chỉ phần evidence hợp lệ mà gate cho phép; sửa operations không tự buộc cài lại dependency hoặc đổi tracked app SHA. Dùng một executor, reviewer rà nguồn/evidence ổn định; không nhiều writer vào cùng DB.

Các biện pháp này xử lý những cơ chế lặp đã thấy, không bảo đảm mọi lỗi runtime được tìm trước. Không có cơ sở hứa “fix một lần duy nhất là full pipeline luôn PASS”.

## Phương án cho hạn hôm nay

Khuyến nghị: ưu tiên web local nối staging và testcase quyền API/RPC trực tiếp, giữ code/SQL hiện có. Đây là đề xuất đầu ra demo/báo cáo có phạm vi, chưa phải thay tiêu chí phát hành.

Điểm rút ngắn đã kiểm bằng code: [package.json:13](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/package.json:13) có `dev=vite`, build riêng là `tsc -b && vite build`. [playwright.supabase.config.ts:36](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/playwright.supabase.config.ts:36) tự mở Vite dev, không build. Vì vậy demo local không bắt buộc sửa custom build runner trước; có thể dùng shell chuẩn giữ env hoặc absolute Node gọi Vite đã cài. Chưa chạy, nên đây là tính khả thi từ source, chưa phải web đã khởi động PASS. Dev server không thay typecheck/build release.

Recipe đề xuất khi owner giao triển khai:

1. Giữ e422/dependencies hiện có; explicit `VITE_DATA_MODE=supabase`, đúng URL/key công khai staging và quan sát request thật để tránh demo mock. [runtimePorts:16](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/runtimePorts.ts:16), [:61](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/app/runtimePorts.ts:61). Không thêm WSL/Docker/runtime mới.
2. Kiểm ngay một chuỗi create/pair→employee PIN→đọc/ghi được phép→bị cấm tại server. Auth là dependency không thể né bằng Vite. Thay Auth config, tạo tenant và dữ liệu test cần phạm vi/quyền staging mới; user hiện chỉ yêu cầu điều tra.
3. Chốt ma trận theo permission thực tế: cho phép/từ chối, gọi thẳng RPC bỏ UI, hai quán, đổi/thu hồi quyền, PIN/session cũ, các luồng tiền thuộc scope. Mỗi ca giữ expected/actual/source/evidence; khi bị từ chối, kiểm các bất biến nghiệp vụ/credential/session và audit/registry/signals theo expected của từng ca. Một số semantic denial hợp lệ phải ghi audit/registry, không yêu cầu mọi bảng đứng yên. [PIN reuse:147](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:147), [administration:410](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/permissionAdministration.contract.test.ts:410). Calls cần JWT quán và token nhân viên, không dùng request đặc quyền thay user. Pattern headers đã có tại [permissionCandidate.spec.ts:323](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidate.spec.ts:323), không cần xây framework tổng mới.
4. Không trỏ nguyên suite cách ly vào hosted: [permissionCandidateEnvironment:7](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionCandidateEnvironment.ts:7) và [identity runtime:49](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-identity-runtime.mjs:49) có binding fixture/local; setup có tác động DB. `smoke:supabase` cũng gom nhiều test cũ; phải chọn recipe phù hợp, không chạy nguyên bộ mặc định. Edge/ảnh chỉ nhận đã đạt sau kiểm thật; muốn hoãn phần đó phải owner chốt phạm vi.
5. Đề nghị một lượt hữu hạn tối đa3giờ, gồm tối đa45phút mở được chuỗi thật đầu tiên,90phút case/sửa liên quan trong scope,45phút kiểm lại+evidence+review. Đây là trần điều phối đề xuất, không ETA bảo đảm hoặc ngân sách đã được cấp. Đến mốc đầu mà không có chuỗi thật thì ghi blocker và chọn fallback, không tiếp nối vô hạn bằng gói tooling mới.

Nếu web không chạy nhưng Auth/API staging dùng được: bàn giao bằng chứng testcase API/DB với đúng actor và phần giao diện chưa kiểm. Nếu hosted cũng bị chặn: dùng demo mock đã xác minh riêng cho UI, ghi rõ không chứng minh phân quyền server, cùng code/SQL và ma trận NOT_RUN; phương án này chỉ phục vụ trình bày tiến độ, có thể không đáp ứng yêu cầu bàn giao của owner. Không có phương án thay thế nào bảo đảm mục tiêu bắt buộc là full gate/main/production ngay hôm nay từ evidence hiện có.

## Tham chiếu chính thức và giới hạn

[Supabase password auth](https://supabase.com/docs/guides/auth/passwords) xác nhận verification ảnh hưởng signin; [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#bypassing-row-level-security) phân biệt request đặc quyền với quyền user; [database testing](https://supabase.com/docs/guides/database/testing) cho phép kiểm logic qua API hoặc SQL, không chứng minh matrix mới tương đương gate riêng của dự án. [OpenAI Docs về task dài](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex) hỗ trợ mục tiêu/tiêu chí/mốc kiểm rõ; không dùng bài này làm bằng chứng nguyên nhân của chat cụ thể. Supabase changelog markdown không fetch được; đã mở index HTML, không thấy thay đổi liên quan đủ để thay kết luận từ source.

Đã kiểm bằng đọc source/hồ sơ/thread và link chính thức. Không chạy app, build, test, CI, SQL, Auth, Edge hoặc deploy; không cài/xóa dữ liệu. Hai ổ đo trong lượt này: C193.211.121.664B, D98.185.760.768B trống; không có thao tác ghi lớn. File mới là đầu ra phân tích cần giữ, không phải temp đề nghị xóa.

Reviewer cuối sẽ đọc exact SHA256 của file này và trả verdict ở metadata riêng; chưa nhận owner đã đọc/nghiệm thu hoặc cấp quyền triển khai. Bàn giao của task này là bản điều tra và khuyến nghị; phần implementation vẫn PAUSED, gate và coverage giữ nguyên.
