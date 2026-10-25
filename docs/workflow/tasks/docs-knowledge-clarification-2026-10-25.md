# Làm rõ mục đích kho docs và nguồn quyết định — 25/10/2026

## Phạm vi và nguồn xác nhận

Chủ dự án yêu cầu hỏi theo nhóm, ghi nhận câu trả lời và cập nhật docs cho phù hợp. Nội dung được biên tập thành thông tin dự án, không chép nguyên văn hội thoại. Nguồn là ba nhóm câu trả lời trong chat ngày 25/10/2026: Q01–Q03 về người đọc docs, 12 mục tiêu tốt nghiệp và chủ thể quyết định; Q04–Q06 về động cơ chọn kiến trúc, phương án từng cân nhắc và đánh đổi; Q07–Q09 về thời gian thực hiện, mức triển khai và kiểm chứng cần đạt. Chỉ ghi chắc phần chủ dự án xác nhận; phần được nhớ lại kèm yêu cầu kiểm tra vẫn giữ trạng thái cần đối chiếu.

Đây là hồ sơ đang được bổ sung trong quá trình làm rõ. Ngày25/10 là ngày xác nhận thông tin, không tự là ngày ra quyết định kiến trúc ban đầu hoặc ngày giảng viên phê duyệt mục tiêu. Checklist theo dõi vẫn giữ local, không đưa lên Git. Việc cập nhật tài liệu không mở refactor, triển khai chức năng, chạy backend hoặc thay gate nghiệm thu.

## DEC-DOCS-01 — AI là đối tượng khai thác trực tiếp chủ yếu

- **Trạng thái:** đã xác nhận ngày25/10/2026 bởi chủ dự án.
- **Mục đích:** nhánh docs lưu kiến thức về tính năng, quy tắc, thiết kế, quyết định và bằng chứng của dự án. Khi người dùng hỏi về một tính năng, AI tìm thông tin liên quan trong docs và đối chiếu với mã nguồn trên nhánh code khi có implementation phù hợp.
- **Vai trò với báo cáo:** docs cung cấp nguyên liệu có nguồn để tổng hợp báo cáo về sau; bản thân kho tài liệu không phải bản báo cáo tốt nghiệp.
- **Hệ quả biên tập:** ưu tiên tiêu đề/chỉ mục theo tính năng và chủ đề; mỗi nội dung có trạng thái, nguồn và liên kết tới spec, quyết định, code hoặc evidence liên quan. AI cần tìm đúng phần thông tin mà không phải đọc lại toàn bộ nhật ký.
- **Ranh giới nguồn:** yêu cầu và quyết định đã duyệt xác định điều mong muốn; code xác định phần đã hiện thực; evidence xác định điều đã kiểm. Tính năng mới có spec chưa có code vẫn được mô tả với trạng thái thích hợp. Những quy tắc phân biệt nguồn này kế thừa [workflow](../README.md), không phải một cơ chế ưu tiên code hơn requirement mới.
- **Phần chưa chốt:** chưa lựa chọn công cụ tìm kiếm, định dạng dữ liệu mới hay cơ chế tự động hóa nào từ xác nhận này. Cách bố trí file cụ thể tiếp tục theo checklist chỉnh lý và nguồn hiện có.

## DEC-DOCS-02 — Khung12 mục tiêu tốt nghiệp được giảng viên xác nhận

- **Trạng thái:** chủ dự án xác nhận ngày25/10/2026 rằng danh sách12 mục tiêu đã được giảng viên xác nhận và là định hướng đích của đồ án.
- **Nguồn và mức xác minh:** đây là thông tin do chủ dự án cung cấp; lượt này chưa đối chiếu một văn bản xác nhận trực tiếp của giảng viên. Không tự ghi thêm ngày phê duyệt, trọng số chấm điểm, tiêu chí đạt hoặc deadline.
- **Áp dụng:** dùng đúng danh sách G01–G12 trong [bản rà soát](docs-thesis-audit-2026-10-25.md#đối-chiếu-12-mục-tiêu) để đối chiếu tiến độ và khoảng thiếu. Danh sách bao gồm kiểm thử/môi trường, chống trùng/khôi phục thanh toán, vai trò/quyền, kiểm quyền DB, tài khoản chủ/email/tạo quán, recovery/chuyển sở hữu, đổi PIN mặc định, UI, realtime, vận hành/backup/bảo mật/hiệu năng, nguồn học thuật và báo cáo/tài liệu.
- **Giới hạn:** xác nhận mục tiêu không tự xác nhận mọi chi tiết nghiệp vụ trong từng proposal, không thay các quyết định phạm vi đã chốt và không chứng nhận mục tiêu đã hoàn thành. Nếu diễn giải mục tiêu mâu thuẫn với spec đang có, phải chỉ ra và làm rõ phần mâu thuẫn.
- **Hệ quả biên tập:** bảng mục tiêu cần chỉ ra phần đã có, bằng chứng, phần còn thiếu và câu hỏi đang mở; không tự chuyển một mục tiêu sang tùy chọn hoặc hoãn chỉ để khớp hiện trạng code.

## DEC-ARCH-01 — Nguồn của quyết định lựa chọn kiến trúc

- **Trạng thái:** đã xác nhận người quyết định và động cơ chính; thông tin về phương án DDD và đánh đổi còn có giới hạn nguồn như bên dưới.
- **Lựa chọn và người chốt:** dùng Ports & Adapters theo hướng Hexagonal. Chủ dự án xác nhận mình đưa ra quyết định cuối cùng dựa trên thông tin AI cung cấp. Xác nhận này chỉ áp dụng cho lựa chọn kiến trúc đang được hỏi, không bao hàm mọi quyết định kỹ thuật trong kho.
- **Động cơ đã xác nhận qua Q04:** chủ dự án muốn tách rõ trách nhiệm giữa các phần ngay từ đầu, vì giao diện có thể thay đổi và hệ thống có thể chuyển sang công nghệ cơ sở dữ liệu khác. Lựa chọn kiến trúc hướng tới giảm phụ thuộc giữa nghiệp vụ với UI và hạ tầng, để các thay đổi đó có phạm vi tác động dễ kiểm soát hơn. Đây là lý do chủ dự án đánh giá lựa chọn phù hợp với dự án.
- **Giới hạn của động cơ:** đó là khả năng muốn giữ cho tương lai, không phải quyết định đổi UI framework hoặc DB ngay trong lượt này, cũng không phải bằng chứng rằng thay DB chỉ cần đổi một adapter. Phần kiểm thử/demo trong tài liệu cũ là lý do đã được tài liệu ghi nhận; Q04 chưa xác nhận đó là động cơ quyết định của chủ dự án.
- **Phương án nhớ lại qua Q05:** chủ dự án nhớ từng cân nhắc DDD và khi đó đánh giá phương án được trình bày chưa phù hợp tổng thể với dự án, đồng thời yêu cầu kiểm tra lại. Chưa đủ nguồn để xác định phương án cụ thể, tiêu chí so sánh hoặc lý do không chọn. Không chuyển ký ức này thành kết luận chung “DDD không phù hợp” hoặc “Hexagonal loại trừ DDD”.
- **Đánh đổi nhớ lại qua Q06:** chủ dự án nhớ phải viết nhiều code hơn, kèm yêu cầu đối chiếu. Tài liệu Git ngày 21/06/2026 đã ghi chi phí interface, mapper và adapter bổ sung, hỗ trợ nội dung kỹ thuật của ký ức này; chưa chứng minh chi phí đó được trình bày và chấp nhận ra sao trong cuộc trao đổi ban đầu. Chưa đo số dòng code, thời gian hoặc chi phí so với một phương án khác.
- **Ngày và phần chưa rõ:** 25/10/2026 là ngày xác nhận hồi cứu; chưa xác định ngày lựa chọn ban đầu hoặc người/AI đề xuất ban đầu. Ngày commit tài liệu không thay ngày ra quyết định.
- **Điểm tra cứu:** [tech-stack](../../tech-stack.md#architectural-pattern-hexagonal-architecture--ports--adapters) tóm tắt lý do và đánh đổi; [architecture](../../architecture.md#hexagonal-architecture--ports--adapters) mô tả hiện trạng kỹ thuật. Hồ sơ này giữ nguồn xác nhận và phần chưa rõ.

### Đối chiếu lịch sử và thuật ngữ ngày 25/10/2026

| Căn cứ đã kiểm | Kết quả và giới hạn |
| --- | --- |
| Commit [7413fc4 ngày 21/06/2026](https://github.com/nguyentronglinh045/pos-cafe/commit/7413fc4213e1988f023922c4aca6af5633b1d540), [tech-stack dòng 7–13](https://github.com/nguyentronglinh045/pos-cafe/blob/7413fc4213e1988f023922c4aca6af5633b1d540/docs/tech-stack.md#L7) | Đã có lựa chọn Ports & Adapters, lý do tách SDK/backend và đánh đổi thêm interface, mapper, adapter. Đây là ghi chép lịch sử, không phải biên bản phê duyệt của chủ dự án hoặc số đo độ phức tạp. |
| Tìm `DDD` / `domain.driven` trong Markdown của docs local `0eb33e1`, rồi tìm thay đổi nội dung cùng từ khóa trong lịch sử mọi ref local hiện có | Bản hiện tại chỉ thấy tài liệu tham khảo Evans; lịch sử trả về các commit `d62aa4b` và `9f93b93`. Chưa tìm thấy trong phạm vi này một hồ sơ so sánh DDD với phương án được chọn. Không kết luận cuộc so sánh chưa từng diễn ra; chưa kiểm toàn bộ chat cũ, file ngoài Git hoặc nội dung dùng thuật ngữ khác. |
| Cockburn, *Hexagonal Architecture*, mục Intent / Motivation / Nature of the Solution, [bài gốc](https://alistair.cockburn.us/hexagonal-architecture) | Nguồn lý thuyết cho việc tách tương tác với UI và DB qua port/adapter. Được tra cứu bổ sung ở hiện tại, không chứng minh đây là nguồn chủ dự án đã dùng lúc quyết định. |
| Vernon, *Implementing Domain-Driven Design*, Guide to This Book → Architecture, trang xxxviii, [bản mẫu từ nhà xuất bản](https://ptgmedia.pearsoncmg.com/images/9780321834577/samplepages/0321834577.pdf) | Mô tả Hexagonal là một kiểu kiến trúc có thể chứa mô hình miền của một Bounded Context. Vì vậy DDD và Hexagonal có thể kết hợp; cần xác định cụ thể cách áp dụng DDD từng được đề xuất trước khi ghi phương án bị loại. Nguồn học thuật này không chứng minh lịch sử lựa chọn của dự án. |

### Trạng thái câu hỏi kiến trúc

| Mã | Nội dung | Trạng thái |
| --- | --- | --- |
| Q04 | Động cơ quyết định khi chọn kiến trúc | Đã trả lời: tách rõ các phần từ đầu để thích ứng thay đổi UI hoặc công nghệ DB. |
| Q05 | Phương án thực sự từng cân nhắc và lý do không chọn | Đã nhận ký ức về DDD; còn cần hồ sơ gốc để xác định phương án và lý do. |
| Q06 | Đánh đổi được nhận biết và chấp nhận khi quyết định | Đã nhận ký ức về lượng code tăng; tài liệu cũ có căn cứ cho interface/mapper/adapter bổ sung. Chưa xác minh bối cảnh chấp nhận hoặc đo chi phí. |

Q05–Q06 còn mở ở phần lịch sử, không chặn ghi nhận động cơ đã xác nhận hoặc làm rõ mục tiêu đồ án. Tiếp tục tìm nguồn khi có manh mối; không yêu cầu chủ dự án đoán lại hoặc tự kiểm code. Nếu không khôi phục được hồ sơ gốc, giữ nhãn chưa xác minh; phân tích so sánh mới phải ghi rõ là hồi cứu.

## DEC-THESIS-01 — Thời gian và mức hoàn thành đồ án

Nguồn: câu trả lời Q07–Q09 của chủ dự án ngày 25/10/2026. Đây là thông tin lập kế hoạch và mục tiêu đầu ra, không là chứng nhận hệ thống đã đạt hoặc quyền triển khai ngay trong lượt chỉnh lý docs.

### Thời gian đã xác nhận và ngày quy đổi

Chủ dự án xác nhận thời gian thực hiện là **15 tuần bắt đầu từ 05/10/2026**, hiện ở tuần 3; **tuần 16 bảo vệ trực tiếp với giảng viên**. Quy đổi bên dưới tính các tuần 7 ngày liên tiếp từ ngày bắt đầu; chưa có lịch nghỉ/điều chỉnh của trường để áp dụng.

| Mốc | Khoảng ngày quy đổi | Nguồn và giới hạn |
| --- | --- | --- |
| Tuần 1 | 05–11/10/2026 | Bắt đầu 05/10 theo chủ dự án. |
| Tuần 3 | 19–25/10/2026 | Khớp thông tin tuần hiện tại tại ngày trao đổi 25/10. |
| Tuần 15 | 11–17/01/2027 | Kết thúc 15 tuần thực hiện vào 17/01 nếu lịch liên tục. |
| Tuần 16 | 18–24/01/2027 | Tuần bảo vệ; chưa xác nhận ngày/giờ cụ thể. |

Chưa có hạn nộp báo cáo riêng hoặc lịch kiểm tra giữa kỳ. Không coi ngày cuối tuần 15 là hạn nộp báo cáo chính thức. Khung này được đặt làm mốc hiện hành trong [roadmap](../../roadmap.md#khung-thời-gian-đồ-án--xác-nhận-2026-10-25); lịch cũ bắt đầu 28/08 và hạn 21/12/2026 giữ làm lịch sử, không dùng để suy tiến độ đồ án mới. Chưa phân bổ lại số tuần cho từng chức năng hoặc tự đổi gate.

### Mức triển khai và kiểm chứng cần đạt

- **Triển khai:** các chức năng đã đăng ký cần chạy được trên bản triển khai Vercel. Đây là mục tiêu chức năng hoạt động trên môi trường triển khai, không chỉ có build hoặc trang web mở được. Phạm vi đăng ký đọc cùng 12 mục tiêu và spec/quyết định tương ứng; các đầu ra báo cáo/tài liệu không được diễn giải thành chức năng web.
- **Kiểm thử local:** cần chứng minh có thể thực hiện kiểm thử ở môi trường local. Tài liệu phải dẫn tới cách chuẩn bị, lệnh chạy, phạm vi và kết quả gắn đúng source/môi trường theo [chiến lược kiểm thử](../../test-strategy.md). Không tự diễn giải thành chỉ cần unit/mock, hoặc yêu cầu mọi thành phần backend đều phải được cài trực tiếp trên máy cá nhân; lựa chọn môi trường vẫn theo gate và giới hạn tài nguyên đã có.
- **Giới hạn xác nhận:** chưa có yêu cầu thử nghiệm/vận hành thường xuyên tại quán thật từ câu trả lời này. Không tự thêm hợp đồng vận hành thương mại, cũng không bỏ các mục backup, bảo mật, hiệu năng đã đăng ký. URL/version của bản dùng để bảo vệ và kết quả kiểm chứng vẫn cần xác định khi thực hiện.
- **Minh chứng bổ sung từ giảng viên:** theo chủ dự án, giảng viên không đưa thêm yêu cầu minh chứng cụ thể ngoài các mục tiêu đã trao đổi. Không tự đặt thêm rubric của giảng viên; các tiêu chí, coverage và gate kỹ thuật đã được duyệt vẫn giữ hiệu lực.
- **Hồi quy tính năng cũ:** chủ dự án nêu mong muốn các tính năng của đợt trước tiếp tục hoạt động tốt. Ghi đây là định hướng bảo toàn chức năng khi phát triển tiếp, không phải một rubric bổ sung đã được giảng viên xác nhận. Phần kiểm thử cần có phạm vi hồi quy cho bản cũ sau khi xác định mốc đối chiếu; chưa chốt tag/commit hoặc danh mục chỉ bằng câu trả lời này. Các thay đổi nghiệp vụ/UI đã được duyệt vẫn là expected mới, không khôi phục hành vi cũ đã bị thay thế chỉ để khớp baseline.

### Trạng thái câu hỏi về đích đồ án

| Mã | Nội dung | Trạng thái |
| --- | --- | --- |
| Q07 | Mốc thực hiện và bảo vệ | Đã có khung 15 tuần từ 05/10, bảo vệ tuần 16; chưa có ngày bảo vệ và hạn nộp báo cáo cụ thể. |
| Q08 | Mức triển khai cần đạt | Đã trả lời: chức năng đăng ký chạy trên Vercel, chứng minh chạy kiểm thử ở local. Chưa là bằng chứng triển khai/test đã đạt. |
| Q09 | Yêu cầu minh chứng bổ sung và bảo toàn phần cũ | Không có yêu cầu bổ sung từ giảng viên theo chủ dự án; đã ghi định hướng hồi quy tính năng đợt trước, mốc baseline còn cần xác định. |

## Câu hỏi tiếp theo

| Mã | Thông tin cần làm rõ | Trạng thái |
| --- | --- | --- |
| Q10 | “Đợt trước” cần bảo toàn là bản đã nộp/bảo vệ tiểu luận trước giai đoạn tốt nghiệp, hay một mốc khác? Có ngày/tên bản để tra lại không? | Chưa trả lời. AI tự đối chiếu Git/docs sau khi nhận diện mốc, không yêu cầu chủ dự án tìm commit hoặc lập danh mục từ đầu. |

Q10 chặn việc chốt chính xác phạm vi hồi quy mang nhãn “đợt trước”, không chặn giữ gate hiện hành hoặc cập nhật lịch và mục tiêu triển khai đã xác nhận. Q05–Q06 tiếp tục mở ở phần lịch sử kiến trúc.

## Ghi nhận cập nhật

Đợt này bổ sung hồ sơ xác nhận; đồng bộ phần mục đích ở docs README, nguồn mục tiêu ở project-overview và chủ thể quyết định ở tech-stack; thêm đường vào task index. Không tích hoàn tất P0-01/P0-02 vì danh mục tính năng, chỉ mục quyết định và các chi tiết kiến trúc còn phải thực hiện tiếp.

### Review đợt ghi nhận đầu

- Reviewer độc lập: `/root/review_preservation`; toàn bộ5file docs và delta checklist local.
- Docs candidate đầu `53d52e8e43bff44b639eae8eb0b7dba5d7d55c39` và candidate sau rebase `2bbfa2c3c6592bdfe5c3a3008dbe2cf398e34b9e`: **APPROVE**, không finding. Đã kiểm tính trung thực với câu trả lời, phạm vi xác nhận, ngày hồi cứu, trạng thái Q04–06, diff và link/anchor; không chạy ứng dụng/backend.
- Checklist candidate đầu `e706da317202427f18fb89b6ec855363be4725a8ae7b936aeab9362746109c6c`: CHANGES_REQUESTED do câu metadata review cũ chưa giới hạn checkpoint. Đã sửa riêng câu đó; candidate `6a07e1a5d69587c307e9ddf221854df87176cc8341980c369fbd96d9d1f4bd4a` được **APPROVE**, finding đóng, không còn finding khác. Checklist không nằm trong commit docs.
- Rebase chỉ giữ thêm hồ sơ đánh giá main và dòng chỉ mục từ công việc đồng thời; reviewer xác nhận4file nội dung và mục chỉ mục của lượt này không đổi, không review lại nội dung công việc kia.
- Kiểm tác giả: `git diff --check` PASS;65link tương đối trong5file sửa không có lỗi path/anchor. Sau APPROVE chỉ bổ sung metadata review này và metadata tương ứng ở checklist.
- Đợt ghi nhận đã được kiểm; hồ sơ vẫn mở để nhận câu trả lời tiếp theo. Verdict không chứng nhận đã hoàn tất P0–P2 hoặc mở quyền triển khai/phát hành.

### Đợt ghi nhận Q04–Q06

Đồng bộ động cơ lựa chọn vào tech-stack và architecture; cập nhật trạng thái câu hỏi, chỉ mục và nguồn học thuật đã đọc đúng phần liên quan. Giữ ký ức về DDD/chi phí code với mức xác minh riêng, không tự đóng các mục P0 hoặc mở refactor. Checklist chỉ bổ sung tiến độ local. Đợt này chỉ kiểm nội dung và liên kết, không chạy ứng dụng/backend.

### Review đợt Q04–Q06

- Reviewer độc lập `/root/review_preservation`: **APPROVE** docs candidate `04f67d957f7f4ccdee146db34c2139f17ab5b0cc` và checklist local candidate SHA256 `d5810c048b5ea6a3448de2b1217998caba5e30d7de8b454aad96ae5b8a5d24b7`; không có finding chặn hoặc không chặn.
- Đã đối chiếu câu trả lời, commit lịch sử `7413fc4`, tìm kiếm Git, bài Cockburn và phần Architecture trang xxxviii của bản mẫu Vernon. Q04 được ghi đúng; Q05–Q06 còn giới hạn xác minh, Q07–Q09 vẫn mở; không suy quyết định loại DDD, chấp nhận toàn bộ đánh đổi hoặc đổi DB thành công.
- Kiểm tác giả: `git diff --check` đạt; 44 liên kết tương đối trong 5 file sửa không có lỗi path/anchor. Reviewer kiểm lại diff và link/anchor, không có lỗi. Không chạy ứng dụng/backend.
- Sau APPROVE chỉ bổ sung metadata review này và metadata tương ứng vào checklist. Lượt này lưu trên docs local, chưa push; checklist ngoài repository, các mục P0 chưa được tích hoàn tất.

### Đợt ghi nhận Q07–Q09

Đồng bộ khung thời gian và mức hoàn thành vào roadmap/project-overview; bổ sung vai trò kiểm thử local và hồi quy vào test-strategy; cập nhật task index và tiến độ checklist local. Chỉ sửa tài liệu theo thông tin mới, giữ lịch sử và gate. Kiểm ngày bằng phép cộng tuần, kiểm diff và liên kết; không chạy ứng dụng/backend, deploy, cài môi trường hoặc refactor.
