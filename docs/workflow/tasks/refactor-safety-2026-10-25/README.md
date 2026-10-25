# Kế hoạch refactor cấu trúc và file lớn — 25/10/2026

**Trạng thái: kế hoạch đề xuất, chưa triển khai.** Yêu cầu của chủ dự án: “bạn lên kế hoạch kĩ giúp tôi, việc refactor file lớn này cũng tìm ẩn rủi ro, cần kĩ lưỡng cao nhất”.

Đích đến là trách nhiệm module rõ hơn và dễ bảo trì, đồng thời giữ nguyên hành vi đã được chốt. Không dùng số dòng/file hay số thư mục giảm được làm tiêu chí thành công. “Cẩn trọng cao” nghĩa là mỗi phần có bằng chứng trước/sau, phản ví dụ và đường hoàn tác; không thể hứa không còn rủi ro.

- [Danh mục phần việc, file và điểm tách](slices.md).
- [Bất biến, ma trận kiểm thử và điều kiện qua cổng](regression-matrix.md).
- [Biên bản review độc lập](review.md) được bổ sung sau khi hai reviewer chốt candidate.
- Tiếp nối đánh giá main và chương trình NC-02/03/07/08/10/11; không thay quyền hay mở các phần NC-04…06 đang giữ riêng.

## 1. Nguồn và phạm vi đã kiểm

| Nguồn | Trạng thái tại khảo sát |
| --- | --- |
| Remote main và origin/main | 711a22e71983e3d6aa17799649af05ce4c762555, kiểm bằng git ls-remote |
| Checkout dùng đọc code | D:/Workspace/pos-cafe-permission-timeonly-20261022/code, cùng SHA, sạch tracked/untracked |
| Checkout gốc | D:/Workspace/pos-cafe, main5156820f7d6679cd6f8051bdc38419737ffa0c7e, 553 mục trạng thái, chậm 131 commit |
| Docs đầu lượt | Local563abe2ba8ca7eaa805b5d44157ccdcf1a90257f; remote9b4fd3acb626a27b3561f3e3d2bfd0d8cad51088. Local có hồ sơ mới chưa push; đọc chỉ dẫn từ local đã đối chiếu |
| Bằng chứng có trước | 5 boundary tests đạt trên 711a22e ở task đánh giá; không thay baseline chức năng/UI/backend của chương trình này |

Số đo từ file đã track: 1.185 file toàn repo; root68, gồm32 Vitest+20 Playwright configs; scripts298,297 cùng cấp; src336. Độ dài source trong phụ lục bỏ newline cuối, không đo độ phức tạp thuật toán.

Checkpoint docs trong lúc soạn đã tiến đến7e2928787d9b2f5d259162819a1fa49586f80947, bổ sung khung15tuần và mốc hồi quy tiểu luận. Đã đọc delta; quy tắc AGENTS/workflow/SPEC-STANDARD không đổi. Kế hoạch bổ sung map hành trình cũ còn hiệu lực ở RF-01/RF-I15, giữ các cập nhật docs song song bằng CAS khi ghi hồ sơ.

Lượt này chỉ đọc source/tests/config/docs và soạn kế hoạch, không chạy app/test/backend/browser, không cài gói, không đổi file ứng dụng hay WIP. Bản kế hoạch và review được ghi trên docs bằng index riêng, không checkout docs, không push. Các lệnh trong phụ lục là recipe cho lượt triển khai được giao, chưa thực hiện trong lượt lập kế hoạch.

## 2. Những điều phải giữ

1. Giữ kiến trúc Ports & Adapters: app → feature hook/flow → port → adapter; domain/core/ports giữ ranh giới hiện hành. Ý định tách UI và công nghệ lưu trữ đã được chủ dự án xác nhận trong docs/architecture.md.
2. Giữ nghiệp vụ, thông báo lỗi, payload/RPC/DTO, quyền, giá lịch sử, thứ tự hiệu ứng và lifecycle. Nếu thấy lỗi cũ, ghi finding rồi sửa bằng phần việc riêng; không tiện tay sửa trong commit tách file.
3. Giữ test hiện có và tiêu chí nghiệm thu. Không làm xanh bằng bỏ suite/case/viewport, tăng retry, nới threshold, đổi fixture/trust hash hàng loạt hoặc chấp nhận baseline mới tự động.
4. Giữ code WIP, dữ liệu riêng, ACL, trạng thái claim/ledger và bằng chứng lịch sử. Không chạy reset/clean/prune, không xóa cache/backup phát sinh từ kế hoạch này.
5. Giữ docs trên docs; operator guides tiếp tục cạnh tool trên main. Không nhân đôi tài liệu kiến trúc vào main.
6. Không đổi dependencies/framework/database, tên nghiệp vụ, chuẩn tiền/thời gian, schema/RLS/migration, live activation hoặc deploy. Nếu cần các thay đổi đó, mở scope riêng trước khi làm.
7. T04/backend acceptance và các profile/supplemental obligations chưa đóng vẫn giữ trạng thái riêng. Không dùng refactor hoặc mock PASS để đóng chúng.

## 3. Thứ tự đề xuất và điểm dừng

Ưu tiên khảo sát tooling trước vẫn giữ, nhưng **không đổi công cụ đo cùng lúc với code đang được đo**. Chuyển config/runner thực tế đi sau khi có danh sách suite và baseline độc lập. Đây là điều chỉnh thứ tự thực hiện từ đánh giá sơ bộ, dựa trên việc code có trust hash, đường dẫn cố định và hồ sơ bất biến.

| Đợt | Kết quả cần có | Điều kiện đi tiếp |
| --- | --- | --- |
| RF-00: chốt nguồn | Một nguồn thực hiện; manifest WIP; scope và baseline code/docs | Không drift, không trộn WIP, không nhầm checkout cũ là main mới |
| RF-01: bản đồ và baseline | Danh sách public API/consumer/state owner; test inventory; phân loại đường dẫn/trust | Mỗi file dự kiến sửa nối được với contract và phép kiểm; phần UNKNOWN giữ HOLD |
| RF-02: bổ sung kiểm thử còn thiếu | Characterization trên bản chưa refactor, oracle theo spec/ca thực tế | Kiểm hiện hành đủ chứng minh phần sẽ tách; lỗi nền tách riêng; reviewer chốt oracle |
| RF-03: thử Report presentation | Một hoặc vài phần JSX thuần nhận props; data/controller giữ nguyên | Gate logic + UI + hai review đạt; pilot có lợi ích thật và không tăng indirection vô ích |
| RF-04: history presentation | Một phần filters/detail/display; giữ void/reprint controller và lifetime | Gates history/lifecycle/permission/UI đạt; không dời await/guard trong cùng phần |
| RF-05a/05b: menu rồi floor | Mỗi editor một nhánh phần việc; giữ draft ownership và changeset | Draft/refetch/upload/geometry/tombstone tests + UI đạt; không sửa cả hai editor đồng thời |
| RF-06: shared query ownership | Di chuyển usePurposeQuery với compatibility export tạm | Giữ query-key/cache/purpose/permission semantics; test cả POS và admin, không đổi query behavior |
| RF-07: orderFlow helpers thuần | Tách một nhóm helper cart/selection/receipt khi có nhu cầu rõ | Tiền/snapshot/source identity và public API giữ nguyên; coordinator/async flows vẫn nguyên |
| RF-08: employees/adapter | **Để sau; mặc định HOLD** đối với tách controller/adapter nhạy cảm | Có mục tiêu lợi ích cụ thể, test sequence/lifetime/contract đủ, môi trường/gate tương ứng đã được giao |
| RF-09: tooling/config | Từng family, theo thứ tự rủi ro trong slices.md | Discovery parity đầy đủ, đường dẫn/trust/CLI đúng; không hạ guard hay sửa ledger |
| RF-10: bàn giao từng phần và toàn phạm vi | Candidate tích hợp, docs hiện hành, receipts, phần còn HOLD | Đủ gate trên candidate cuối, hai reviewer APPROVE, rollback recipe rõ |

Các đợt sau RF-03 chỉ là backlog đề xuất, không bắt buộc sửa tất cả. Sau pilot, đánh giá lại lợi ích và phạm vi. Một file vẫn dài nhưng trách nhiệm nhất quán có thể được giữ nguyên.

Luồng mặc định tuần tự: RF-00 → RF-01 → RF-02 của pilot → RF-03 → đánh giá pilot → RF-04 → RF-05a → RF-05b → RF-06 → RF-07 → RF-09 → RF-10. RF-08 cần được chọn riêng. RF-02 lặp phần bổ sung còn thiếu trước mỗi đợt, không viết hàng loạt test xa phạm vi. RF-01 tooling có thể khảo sát song song đọc UI; mọi sửa source chung và suite dùng chung DB phải tuần tự.

Các độc lập được phép khi triển khai đã được giao: phần trình bày không thay backend contract có thể bàn giao giới hạn UI/mock mà không nhận full backend PASS; hễ thay seam thực thi tiền/quyền/adapter thì gate thật tương ứng trở thành điều kiện chặn phần đó. Không suy UI đổi tên là luôn không ảnh hưởng backend: phải lập impact map.

## 4. Hợp đồng của mỗi phần refactor

Mỗi phần có một phiếu, điền trước khi viết code:

| Trường | Nội dung bắt buộc |
| --- | --- |
| Identity | Mã RF + substep; base SHA/tree; nhánh/checkout; spec và version; tác giả/reviewer |
| Allowlist | File cũ → mới; export giữ/đổi; importer/CLI/config/fixture/doc consumer; test/helper phải chỉnh |
| Lý do | Trách nhiệm đang trộn, lợi ích quan sát được; phương án giữ nguyên và vì sao chưa đủ |
| Invariants | Các RF-I trong matrix; input/output/error/side effect/state lifetime phải giữ |
| Oracle | Existing test nào phủ gì; gap nào cần bổ sung; expected từ spec hay characterization; dữ liệu cố định |
| Environment | Runtime/lockfile, browser/backend/schema/fixture cần; cost/disk và quyền hiện có |
| Acceptance | Test identities và số execution theo runner; visual checks; review; điều kiện FAIL/HOLD |
| Rollback | Commit trước phần việc; các bước hoàn tác source; test xác nhận; dữ liệu không được động tới |
| Evidence | Source có thể phục hồi, log/ảnh, result manifest, failure history, findings và verdict |
| Handoff | Docs cần đổi, API tạm/wrapper + điều kiện gỡ, việc hoãn, quyền cần cho bước kế |

Quy mô mặc định: một trách nhiệm hoặc một family config mỗi PR/commit độc lập. Khoảng 2–5 file production là mục tiêu đọc diff thuận tiện, không phải quota; test và compatibility shim có thể nhiều hơn. Nếu diff có nhiều thay đổi ngữ nghĩa không giải thích được bằng một câu, tách phần. Không dùng giới hạn dòng để cắt hàm đang giữ giao dịch/lifecycle thống nhất.

Tách các loại thay đổi: (a) test bảo vệ; (b) extraction cơ học + export compatibility; (c) consumer update; (d) gỡ compatibility sau kiểm consumer. Có thể gom (b)+(c) khi tách ra không build được, nhưng phải là một phần đồng bộ nhỏ được review. Rename/move và format không trộn với đổi logic; không reformat toàn file lớn.

Mỗi commit phải build/test được trong phạm vi. Không xếp nhiều commit “sẽ sửa sau” vào main rồi mới chạy test cuối. Public wrapper không được tạo instance thứ hai của store/coordinator, import cycle hoặc tác dụng phụ mới. Không dùng junction/symlink để giả tương thích đường dẫn.

## 5. Phương pháp chứng minh hành vi không đổi

- Gates nền của docs/test-strategy.md áp dụng cho mỗi phần code/tooling trước nhận hoàn tất: npm run build và npm test; chạm core/features thêm npm run test:coverage; chạm UI thêm npm run smoke đầy đủ. Focused tests dùng trong vòng lặp và bổ sung kiểm sâu, không thay gate nền. Chỉ chấp nhận command tương đương nếu chứng minh cùng toàn bộ suite/project/variant và expected. Task kế hoạch/docs hiện tại dùng đọc đối chiếu và review theo workflow, không cần chạy app tests.
- Chốt expected theo spec đã duyệt trước. Characterization bổ sung ghi hành vi đang có nhưng không tự hợp thức hóa lỗi. Nếu source và spec khác nhau, ghi hai phía, tách bugfix/decision khỏi refactor.
- Chạy baseline cùng source, lockfile, fixture, timezone/clock/random seed và môi trường phù hợp trước sửa. Lưu danh sách test và kết quả kể cả fail/skip; không chỉ lưu tổng PASS.
- Giữ test public behavior chạy qua entry point cũ khi extraction. So sánh output/payload/errors và trace port calls: số lần, thứ tự, tham số, thời điểm guard trước/sau await. Dữ liệu nhạy cảm được redacted; fixture giả thay data thật.
- Pure functions có fixture biên với expected độc lập. Test tiền không lấy expected bằng chính hàm vừa tách; không dùng cùng mock helper làm cả implementation lẫn oracle. Differential old/new là bằng chứng phụ, không thay expected theo contract.
- Với async: chủ động điều khiển deferred promise/timer; đổi actor/authority/navigation/offline ở giữa await; kiểm không phát sinh write/print/toast/preview lỗi thời và không che mất kết quả của thao tác mới.
- Với React: giữ owner state, component identity/key, vị trí mount, ref/portal, cleanup và effect dependencies. Tách component có thể gây remount dù JSX giống nhau; kiểm focus, draft, selection và subscription. Không thêm useMemo/useCallback hay đổi store subscription chỉ vì đang tách file.
- Với UI: thêm đúng trạng thái cần đo vào harness hiện có khi còn thiếu; selftest ui-audit phải cho 23 findings và selftest OK, sau đó audit màn bị ảnh hưởng, xem ảnh rồi phân loại. Không chạy ui-audit:update tự động. Giữ testid, text, keyboard/tab order, portal containment, responsive behavior và chuẩn tối thiểu 568×320; kiểm thêm các viewport thực có trong config, không tự giảm danh sách.
- Với path/tooling: so danh tính test (file, suite/case, project/browser, variant), include/exclude, skip/defer allowances, setup/teardown/reporter/artifact root, argv/env/cwd và timeout/retry. Count bằng nhau chưa chứng minh parity. Có ánh xạ 1:1 cho file test đổi đường dẫn; tên/expected không đổi trong move.
- Không chạy aggregate permission runners, imports/config hay --list khi chưa đọc tác dụng phụ; một số config/setup đòi fixture/backend ngay lúc load. Thiếu quyền/môi trường thì phần discovery runtime đó HOLD, không ghi “không có test”.

## 6. Baseline lỗi và điều kiện dừng

Dừng phần phụ thuộc ngay khi có một trong các tình huống:

1. Source/lock/schema/fixture đổi ngoài allowlist; branch main/docs drift chưa đối chiếu; WIP không xác định.
2. Test relevant không xanh trước refactor, hoặc lỗi lịch sử chưa rõ có tác động phần đang sửa. Tách chẩn đoán/bugfix có gate riêng; không nhận một lần rerun xanh là lỗi đã giải quyết.
3. Test bị thiếu, suite chạy rỗng, skip tăng, retry/timeout/threshold thay mà chưa có lý do duyệt; reporter không quy đúng source/case.
4. Payload/RPC/query key/error code/permission check order, số lần write/print hoặc kết quả tiền thay ngoài kế hoạch.
5. UI mất draft/focus, remount không chủ ý, thu hồi quyền không dọn đúng scope, response cũ còn cập nhật UI.
6. Cần backend gate đang HOLD, tải môi trường ngoài quyền, dung lượng không đủ, hoặc có consumer/trust path chưa phân loại.
7. Reviewer chưa APPROVE hoặc bất đồng expected còn mở. Không lấy đa số hay hết thời gian thay cho kết luận.

Mỗi STOP ghi: nguồn, triệu chứng, phần an toàn đã xong, phần phải chờ, giả thuyết và phép kiểm tiếp theo. Các phần độc lập thật sự có thể tiếp tục nếu impact map chứng minh không dựa vào phần lỗi. Không lập trình tiếp bằng phỏng đoán để “xong kế hoạch”.

## 7. Hoàn tác và quản lý Git

- RF-00 phân loại WIP: đã có trên main, khác biệt riêng cần giữ, conflict hoặc không rõ. Đối chiếu snapshot dọn worktree đã lưu; không cho rằng được backup đồng nghĩa đã merge. Không reset/pull/rebase checkout5156820.
- Khi được giao triển khai, chọn một checkout sạch và nhánh refactor từ main vừa kiểm; ưu tiên dùng lại checkout sạch hiện có sau khi kiểm claims/path bindings. Không tự tái tạo nhiều worktree. Nếu checkout hiện có bị ràng buộc evidence thì đề xuất đúng một checkout tối thiểu, đo peak trước khi tạo.
- Một tác giả ghi source tại một thời điểm. Reviewer đọc candidate bất biến. Trước mỗi phần chốt base/source manifest; nếu upstream thay phần liên quan, hòa giải rồi chạy lại gates bị ảnh hưởng, xin review candidate mới.
- Lưu checkpoint tốt bằng commit/ref riêng, không dựa vào thư mục backup chứa dependency. Revert commit phần refactor trên nhánh làm việc để hoàn tác source; nếu đã có phần phụ thuộc thì revert theo thứ tự ngược hoặc chặn merge để xử lý. Không dùng reset --hard trên checkout của chủ dự án.
- Sau revert, xác minh import/discovery và test của trạng thái phục hồi. Hoàn tác code không hoàn tác DB/payment/claim/ledger; kế hoạch này tránh production mutation. Nếu lệnh kiểm thử có state, phải dùng fixture cô lập đã được giao và recipe cleanup riêng.
- Không xóa nhánh, WIP, guard state hay evidence trong phần refactor. Retention/cache cleanup là nhóm riêng khi có danh sách và ủy quyền.
- Merge/push/deploy là quyền riêng theo nhiệm vụ được giao sau này; kế hoạch này không cấp quyền. Các required checks/protection giữ nguyên; không bypass.

## 8. Review và kết quả phải bàn giao

Kế hoạch này dùng hai reviewer không tham gia soạn: một về nghiệp vụ/lifecycle/kiểm thử, một về tooling/path/trust/Git. Khi triển khai, mỗi candidate nhạy cảm cần hai reviewer khác trọng tâm; mọi reviewer bắt buộc APPROVE đúng fingerprint cuối. Thay đổi nội dung sau review phải rebind; metadata ghi verdict không tạo vòng review vô hạn.

Mỗi phần bàn giao gồm: diff và bản đồ old→new, lý do boundary, public API/consumer còn lại, matrix pass/fail/skip/not-run, source/environment/evidence, findings đã đóng, rollback recipe, cập nhật docs và hướng dẫn đọc code cho chủ dự án. Không tự nhận người dùng đã hiểu/duyệt/nghiệm thu.

Kết thúc toàn phạm vi được chọn chỉ khi:
- Không mất suite/case/guard; các gate relevant trên candidate tích hợp cuối đạt.
- Các runtime boundaries giữ; wrappers tạm có owner và điều kiện gỡ, hoặc đã gỡ với bằng chứng consumer.
- Không có bug hành vi mới hoặc finding chặn chưa xử lý; baseline failures còn lại được tách rõ, không làm ảnh hưởng tính đúng của phần được nhận.
- Code/private/WIP/claims/evidence không bị mất; docs không lẫn implementation với release acceptance.
- Có bảng việc giữ nguyên/HOLD và lý do. Không ép RF-08 hoặc mọi file dài phải được tách để tuyên bố xong.

## 9. Ngân sách và lịch

Không cài gì trong lượt lập kế hoạch. Khi triển khai: kiểm dependency sẵn có, đo ổ C và ổ chứa runtime thực trước cài/copy/build/DB lớn; tối đa tăng20GiB/task và giữ ít nhất30GiB trống trên các ổ liên quan theo quy tắc máy. Một môi trường nặng đang dùng; không cài/import WSL/Docker nếu chưa được yêu cầu rõ. Ước tính download/tăng sau cài/peak; >1GB phải thông báo nổi bật; không biết peak thì dừng phần lớn.

Giữ evidence gọn: source đã commit, manifest, logs cần thiết và ảnh của states liên quan. Không clone dependency cho mỗi phần. Dữ liệu riêng không đưa vào artifact/review.

Không chốt thời hạn theo số dòng. Sau RF-01 lập ước lượng từng phần gồm viết test, extraction, gates và review; sau pilot điều chỉnh theo kết quả thực. Backend HOLD hoặc flaky baseline là dependency, không được cắt test để giữ lịch.

Khung đồ án vừa được ghi trên docs/roadmap.md:15tuần từ05/10/2026, tuần16 bảo vệ18–24/01/2027 theo cách tính tuần liên tiếp; ngày bảo vệ/hạn nộp cụ thể chưa xác nhận. Mục tiêu chức năng đã đăng ký chạy trên Vercel và chứng minh kiểm thử local không cấp quyền deploy trong task này. Refactor chỉ chiếm phần ngân sách còn phù hợp sau ưu tiên sản phẩm/báo cáo; sau pilot có thể dừng với phần cải thiện đã kiểm, không ép triển khai toàn backlog.

## 10. Quyết định đề xuất và bàn giao phiên tiếp

| Quyết định | Khuyến nghị và lý do | Trạng thái |
| --- | --- | --- |
| RF-D01: giữ kiến trúc | Giữ Ports & Adapters; chỉ chỉnh ownership/seam có căn cứ. Rewrite tăng phạm vi mà chưa có lợi ích chứng minh | Đề xuất phù hợp định hướng kiến trúc đã xác nhận |
| RF-D02: pilot | Report presentation, giữ controller/data. Có seam JSX khá rõ, ít side effect hơn tiền/quyền; vẫn phải thêm characterization thiếu | Chưa duyệt triển khai |
| RF-D03: giới hạn nhạy cảm | Không tách WriteOperationCoordinator, permissionSession hay async payment orchestration trong đợt đầu | Đề xuất; xem lại chỉ khi có finding/lợi ích cụ thể và gate |
| RF-D04: tooling | Kiểm kê đầu tiên, chuyển runner sau; family trust/security riêng, historical pins giữ bất biến | Đề xuất; không cho phép refresh trust hoặc mở lại ledger |
| RF-D05: cách giao việc | Giao RF-00/01 trước, tiếp đến một pilot; không giao “refactor sạch toàn bộ” trong một lượt | Khuyến nghị để giữ phạm vi kiểm chứng nhỏ |

Không còn câu hỏi chặn việc hoàn tất bản kế hoạch. Trước triển khai cần chủ dự án giao phạm vi (khuyến nghị RF-00/01 rồi pilot); việc chọn checkout được quyết định sau kiểm ràng buộc. Những điểm phát hiện về nghiệp vụ/guard/môi trường phải hỏi ở phần phụ thuộc, không hỏi lặp quyền đã có.

Prompt bàn giao đề xuất:

> Đọc AGENTS.md/workflow/SPEC-STANDARD từ docs và kế hoạch refactor-safety-2026-10-25/README.md cùng hai phụ lục. Thực hiện RF-00/01 trong phạm vi khảo sát/chốt nguồn và baseline inventory trước; giữ nguyên main WIP, code/private/evidence. Báo phiếu pilot RF-03 có allowlist, gaps/tests và rollback cụ thể. Chỉ viết test/refactor khi phạm vi đó được giao; không tự mở backend HOLD, cài runtime nặng, di chuyển trust paths hoặc phát hành.

Các hướng triển khai này chưa được thực thi. Bản kế hoạch là đầu vào để chọn phần việc, không phải chứng nhận toàn hệ thống an toàn.
