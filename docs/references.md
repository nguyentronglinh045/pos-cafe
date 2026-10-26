# Tài liệu tham khảo theo luận điểm

Cập nhật **26/10/2026**. Đây là kho nguồn đầu vào cho báo cáo, không phải danh mục trích dẫn cuối. Danh mục ban đầu được lập ngày12/09/2026 để bổ sung sách/bài báo cho phần tham khảo thiên về tài liệu công cụ của báo cáo tiểu luận; bối cảnh đó được giữ trong lịch sử Git.

## Cách dùng và trạng thái đọc

- **Đã đọc phần liên quan**: tám nguồn R01–R08 bên dưới có vị trí đọc, luận điểm hỗ trợ và giới hạn. Không đồng nghĩa đã đọc toàn bộ sách/bài báo, hoặc chủ dự án đã tự đọc các nguồn này.
- **Chuẩn đối chiếu**: S01–S02 là NIST/OWASP, không tính như bài báo nghiên cứu. Chỉ đối chiếu các mục được ghi; chưa đánh giá tuân thủ hệ thống.
- Nguồn lý thuyết giải thích nguyên lý; code/spec/evidence xác định thực tế dự án. Mọi liên hệ trong bảng là **phân tích áp dụng hiện tại**, không chứng minh nguồn đã được dùng lúc ra quyết định ban đầu.
- Mã R/S và C là mã tra cứu nội bộ, không phải số trích dẫn IEEE. Giữ tác giả, nhan đề, năm, ấn phẩm, phiên bản, vị trí và URL; định dạng IEEE/APA chờ mẫu trường. Ngày truy cập/đọc lại: **26/10/2026**.
- Ưu tiên diễn giải, không sao chép hình hoặc đoạn dài. Trang PDF đếm từ1 và trang in được ghi riêng; không suy trang in khi chỉ đọc HTML hoặc bản tác giả không đánh số theo tạp chí.

<a id="claims"></a>
## Bản đồ luận điểm

Các nguồn dự án dưới đây ghim code **main711a22e**; [N1](implementation-log/staging-schema-20261026/README.md) và [N2](implementation-log/critical-flows-20261026/README.md) giữ phạm vi đối chiếu metadata staging trước đó. N3 không đọc lại DB hoặc chạy kiểm thử sản phẩm.

| Mã | Luận điểm có thể dùng khi viết báo cáo | Nguồn và vị trí đọc | Liên hệ dự án / giới hạn cần giữ |
| --- | --- | --- | --- |
| C01 | Phân chia module quanh quyết định dễ thay đổi giúp hạn chế phần biết chi tiết đó. | [R01](#r01), The Criteria; Conclusion | [Động cơ kiến trúc](architecture.md#hexagonal-architecture--ports--adapters); [composition:24](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/app/runtimePorts.ts#L24). Đây là cơ sở phân tích, chưa đo được chi phí thay UI/DB. |
| C02 | Port mô tả tương tác; adapter chuyển đổi công nghệ ở biên. | [R02](#r02), Intent; Nature of the Solution | [AppPorts:154](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/ports/index.ts#L154), [factory:17](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/repos.ts#L17). Nghiệp vụ giao dịch còn nằm trong SQL; không hứa đổi DB chỉ cần viết adapter. |
| C03 | DDD và Hexagonal có thể kết hợp, không phải hai lựa chọn loại trừ nhau. | [R03](#r03), Guide → Architecture, trang xxxviii | [Hồ sơ quyết định](workflow/tasks/docs-knowledge-clarification-2026-10-25.md#dec-arch-01--nguồn-của-quyết-định-lựa-chọn-kiến-trúc). Không suy rằng dự án đã áp dụng DDD đầy đủ hoặc đã thử rồi loại DDD. |
| C04 | Các cập nhật tạo thành một thao tác nhất quán cần được xét trong ranh giới transaction và lỗi của nó. | [R04](#r04), §1.1, trang in288–290 | [F02](critical-flows.md#f02), [dispatcher:61](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-financial.sql#L61). Register/execute là hai transaction; DB commit không bao trùm mạng hay in vật lý. Không suy isolation level hoặc độ bền triển khai từ bài báo. |
| C05 | Lỗi liên lạc có thể để bên gọi chưa biết lệnh đã chạy; định danh lời gọi hỗ trợ nhận diện bản gửi lại. | [R05](#r05), §3.1–3.2, trang in49–50 | [F03–F04](critical-flows.md#f03), [terminal replay:79](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-financial.sql#L79). Ledger K/R1 là thiết kế riêng: replay còn kiểm quyền và có thể tăng replay_count. Không gọi toàn bộ request bất biến hay bảo đảm exactly-once đầu cuối. |
| C06 | Tách người dùng, vai trò, quyền và phiên giúp mô tả quyền theo trách nhiệm công việc. | [R06](#r06), §4/§4.1 | [Permission](architecture.md#permission), [mô hình:1](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/domain/permissions.ts#L1). Catalog/overrides của dự án không tự đồng nhất với RBAC0–3; chưa có chứng minh conformance hoặc role hierarchy đầy đủ. |
| C07 | Kiểm quyền phải đặt tại biên đáng tin cậy, tính cả quyền thay đổi và các đường khôi phục. | [R07](#r07), I.A.3(b,c,f) | [F02](critical-flows.md#f02), [F07](critical-flows.md#f07), [recheck:76](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-financial.sql#L76). Ẩn UI không đủ; bài báo không chứng minh ACL/RLS/RPC hiện tại an toàn trên mọi đường truy cập. |
| C08 | Độ phủ giúp tìm phần ít được kiểm; cần thêm bằng chứng về lỗi/kịch bản, không dùng phần trăm làm kết luận chất lượng duy nhất. | [R08](#r08), Abstract; §5–6 | [Bản đồ kiểm thử](testing.md#bản-đồ-bằng-chứng), [chiến lược](test-strategy.md). Kết quả nghiên cứu Java không phải số đo TypeScript/SQL của dự án; không dùng để giảm ngưỡng/gate đã duyệt. |
| C09 | Có thể dùng adapter giả để kiểm logic độc lập, rồi kiểm tích hợp với thiết bị/DB thật. | [R02](#r02), Structure, các bước1–4 | [Các tầng kiểm](test-strategy.md), [evidence thực tế](testing.md). Mock PASS không chứng minh RPC, policy, mạng hoặc đa thiết bị PASS. |
| C10 | Phải phân loại đúng bí mật xác thực trước khi viện dẫn yêu cầu PIN/password. | [S01](#s01), §3.1.1; §3.2.10 | [F05–F06](critical-flows.md#f05); [adapter gửi PIN:35](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/src/adapters/supabase/permissionIdentityRepo.ts#L35), [RPC kiểm6chữ số:226](https://github.com/nguyentronglinh045/pos-cafe/blob/711a22e71983e3d6aa17799649af05ce4c762555/supabase/candidate/permission-identity.sql#L226). Không lấy yêu cầu mã mở khóa cục bộ để hợp thức hóa PIN máy chủ; không tuyên bố AAL/tuân thủ. |
| C11 | Checklist kiểm quyền nên chỉ rõ chức năng, đối tượng, tầng thực thi và ranh giới tenant. | [S02](#s02), v5.0.0-8.1.1, 8.2.1–2, 8.3.1, 8.4.1 | [Testplan permission](../openspec/changes/redesign-permission-model/testplan.md), [E-BACKEND](testing.md#bản-đồ-bằng-chứng). Đây là điểm đối chiếu tài liệu, chưa là kết quả kiểm từng ASVS ID hoặc chứng nhận level. |

## Nguồn đã đọc phần liên quan

<a id="r01"></a>
### R01 — Tiêu chí phân chia module

D. L. Parnas. “On the Criteria To Be Used in Decomposing Systems into Modules.” *Communications of the ACM*, 15(12), 1972, pp.1053–1058. [Metadata/DOI](https://doi.org/10.1145/361598.361623); [bản số hóa tại Lafayette](https://www.cs.lafayette.edu/~gexia/cs301/resources/parnas.html).

**Đã đọc:** The Criteria và Conclusion trên bản HTML. Bài báo nghiên cứu; bản số hóa tự cảnh báo có thể sai khác bản gốc, nên chỉ ghi tên mục, chưa gán số trang cho đoạn trích. Hỗ trợ C01. Không chứng minh Hexagonal tối ưu cho mọi dự án, không cung cấp số đo lợi ích của pos-cafe. Muốn trích nguyên văn/số trang cần đối chiếu bản in hoặc PDF gốc trước.

<a id="r02"></a>
### R02 — Ports & Adapters và kiểm độc lập

Alistair Cockburn. *Hexagonal Architecture*, HaT Technical Report2005.02, bản0.9 ngày04/09/2005 theo trang tác giả. [Bài gốc](https://alistair.cockburn.us/hexagonal-architecture).

**Đã đọc lại:** Intent, Motivation, Nature of the Solution và Structure (các bước1–4). Đây là bài kỹ thuật gốc của tác giả, không gán nhãn bài báo phản biện. Hỗ trợ C02/C09. Mô hình cho phép thay cách tương tác ở port; tính thay thế thực tế còn phụ thuộc hợp đồng và triển khai. Không suy rằng mock và backend có hành vi tương đương chỉ vì cùng interface.

<a id="r03"></a>
### R03 — Quan hệ giữa DDD và Hexagonal

Vaughn Vernon. *Implementing Domain-Driven Design*. Addison-Wesley, 2013, ISBN978-0-321-83457-7. [Bản mẫu nhà xuất bản](https://ptgmedia.pearsoncmg.com/images/9780321834577/samplepages/0321834577.pdf).

**Đã đọc lại và kiểm trang:** Guide to This Book → Architecture, trang inxxxviii, trang PDF39/109, FigureG.3. Sách chuyên môn; chỉ đọc phần này, không nhận đã đọc toàn chương4. Hỗ trợ C03: mô hình miền trong Bounded Context có thể đặt trong kiến trúc Hexagonal. Không dùng để gán lại lịch sử quyết định hoặc xác nhận mọi khái niệm DDD đã hiện thực.

<a id="r04"></a>
### R04 — Giao dịch và phục hồi DB

Theo Härder (metadata ACM: Haerder); Andreas Reuter. “Principles of Transaction-Oriented Database Recovery.” *ACM Computing Surveys*, 15(4), 1983, pp.287–317. [DOI](https://doi.org/10.1145/289.291); [bản bài báo tại Boston University](https://cs-people.bu.edu/mathan/reading-groups/papers-classics/recovery.pdf).

**Đã đọc:** §1.1 What Is a Transaction?, trang in288–290/PDF2–4; kiểm ảnh trang289–290. Bài khảo cứu học thuật; định nghĩa atomicity, consistency, isolation, durability là nền cho C04. Không suy mọi hệ dùng transaction đều đúng nghiệp vụ, không đồng nhất ACID với serializable hiện hành hay xác nhận backup/restore đã đạt.

<a id="r05"></a>
### R05 — Mất phản hồi và nhận diện lời gọi trùng

Andrew D. Birrell; Bruce Jay Nelson. “Implementing Remote Procedure Calls.” *ACM Transactions on Computer Systems*, 2(1), 1984, pp.39–59. [Hồ sơ Microsoft Research](https://www.microsoft.com/en-us/research/publication/implementing-remote-procedure-calls/); [bản bài báo tại Cambridge](https://www.cl.cam.ac.uk/teaching/0708/DigiCommI/birrell1984rpc.pdf).

**Đã đọc và kiểm trang:** §3.1 Requirements, §3.2 Simple Calls, trang in49–50/PDF11–12, đặc biệt ngữ nghĩa khi lỗi và call identifier. Bài báo nghiên cứu về một triển khai RPC cụ thể; hỗ trợ C05. Không chuyển nguyên bảo đảm của giao thức Xerox sang HTTP/PostgREST; không khẳng định mọi RPC có cùng ngữ nghĩa. K/R1, lưu bền và phạm vi hiệu ứng của dự án phải dẫn source riêng.

<a id="r06"></a>
### R06 — Mô hình RBAC

Ravi S. Sandhu; Edward J. Coyne; Hal L. Feinstein; Charles E. Youman. “Role-Based Access Control Models.” *IEEE Computer*, 29(2), 1996, pp.38–47. [Bản tác giả do NIST lưu](https://csrc.nist.gov/csrc/media/projects/role-based-access-control/documents/sandhu96.pdf).

**Đã đọc:** §4 A Family of Reference Models và §4.1 Base Model, trang đánh số5–8/PDF6–9 của bản revised26/10/1995 được chấp nhận đăng. Đây không phải pagination38–47 của bản tạp chí. Đọc qua text PDF; chưa kiểm ảnh trang bản này. Hỗ trợ C06; mô hình cơ sở gắn quyền qua vai trò và phiên, còn hierarchy/constraints được phân biệt. Không gọi grants/denies riêng từng nhân viên là nguyên xi RBAC96; không tự suy least privilege từ việc có roles.

<a id="r07"></a>
### R07 — Nguyên tắc kiểm soát truy cập

Jerome H. Saltzer; Michael D. Schroeder. “The Protection of Information in Computer Systems.” *Proceedings of the IEEE*, 63(9), 1975. [Bản tác giả tại MIT](https://web.mit.edu/Saltzer/www/publications/protection/); [phần đã đọc](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html).

**Đã đọc:** I. Basic Principles of Information Protection → A. Considerations Surrounding the Study of Protection →3) Design Principles, các mục(b), (c), (f): fail-safe defaults, complete mediation, least privilege; gồm lưu ý cache kết quả kiểm quyền khi quyền thay đổi. Bài khảo cứu học thuật; hỗ trợ C07. Không coi đây là chuẩn riêng cho PIN, RLS hay PostgreSQL; không suy an toàn toàn hệ thống từ vài đường kiểm quyền. Dùng locator mục HTML, chưa đối chiếu số trang in.

<a id="r08"></a>
### R08 — Giới hạn của độ phủ kiểm thử

Laura Inozemtseva; Reid Holmes. “Coverage Is Not Strongly Correlated with Test Suite Effectiveness.” *ICSE2014*, 2014. [Bản tác giả tại University of Waterloo](https://cs.uwaterloo.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf).

**Đã đọc:** Abstract, §5 Discussion, §6 Threats to Validity; PDF1,8–10/11, ảnh đã kiểm1,8,9. Bản đọc không hiện pagination proceedings; dùng mục/PDF, chưa gán trang in. Nghiên cứu31.000 bộ test trên5hệ Java, dùng mutation để ước lượng khả năng phát hiện lỗi. Khi kiểm soát số test, tương quan thường thấp đến vừa. Hỗ trợ C08; không suy quan hệ nhân quả, không ngoại suy số đo sang TypeScript/SQL hoặc kết luận coverage vô ích.

## Chuẩn đối chiếu, không phải chứng minh tuân thủ

<a id="s01"></a>
### S01 — NIST SP800-63B-4

David Temoshok và cộng sự. *Digital Identity Guidelines: Authentication and Authenticator Management*. NIST SP800-63B-4, bản final31/07/2025. [Metadata](https://csrc.nist.gov/pubs/sp/800/63/B/4/final), [DOI](https://doi.org/10.6028/NIST.SP.800-63b-4), [nội dung HTML](https://pages.nist.gov/800-63-4/sp800-63b.html).

**Đã đọc:** §3.1.1 (gồm3.1.1.1–2) và §3.2.10. Hỗ trợ C10: password xác minh tập trung khác activation secret chỉ dùng cục bộ. §3.1.1.2 quy định tối thiểu15ký tự cho single-factor,8khi chỉ dùng trong MFA; không thể lấy mức PIN4/6ký tự của3.2.10 để chứng minh PIN máy chủ phù hợp. Ép đổi PIN tạm là quyết định/yêu cầu dự án, không là kết quả tuân thủ NIST. Chưa phân loại AAL toàn hệ thống, rà đủ authenticator hay đo chống thử sai; lượt này không đổi chính sách PIN.

<a id="s02"></a>
### S02 — OWASP ASVS5.0.0

OWASP Foundation. *Application Security Verification Standard*, **v5.0.0**, 2025. [V8 Authorization tại tag cố định](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md); [bản text đã đọc](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x17-V8-Authorization.md).

**Đã đọc:** V8, chọn8.1.1 (tài liệu quyền),8.2.1–2 (chức năng/đối tượng),8.3.1 (trusted service layer),8.4.1 (cross-tenant), tương ứng level1,1,1,1,2. Đây là checklist chuẩn thực hành hỗ trợ C11. Chỉ lập ánh xạ chủ đề; chưa map từng ID tới TC/kết quả, chưa chứng minh đạt bất kỳ level nào hoặc toàn bộ ASVS. Khi dùng phải giữ prefix phiên bản `v5.0.0-` để tránh lẫn ID phiên bản khác.

## Việc còn lại trước khi viết báo cáo

1. Chốt mẫu trường và kiểu trích dẫn; chỉ đưa nguồn thực sự dùng vào danh mục cuối. Nếu yêu cầu nguồn tiếng Việt thì bổ sung theo yêu cầu đó, chưa tự coi là bắt buộc.
2. Đọc bản gốc/bản in cho những chỗ cần trích nguyên văn hoặc số trang in. Tên mục/URL đã đủ để tra cứu hiện tại, không bịa số trang.
3. Bổ sung lý thuyết cho luận điểm mới khi được chọn (ví dụ chuẩn hóa dữ liệu, kiểm soát đồng thời, hiệu năng, backup hoặc offline). N3 chưa phải khảo cứu mọi chủ đề trong đồ án.
4. Khi nguồn code/DB thay đổi, kiểm lại cột liên hệ dự án và evidence; bài báo không tự cập nhật trạng thái thực thi. [Handoff N3](workflow/tasks/docs-academic-references-2026-10-26.md) giữ phạm vi kiểm và review.
