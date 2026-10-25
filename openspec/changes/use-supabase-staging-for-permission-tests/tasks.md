> **Đối chiếu xuất bản 25/10/2026.** Hồ sơ thiết kế và checkpoint staging lịch sử; không mở lại bootstrap/grant/cutoff. Routing hoặc local PASS không thay SQL/hosted/full acceptance; task này chỉ xuất bản tài liệu. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Thứ tự triển khai và trạng thái

- [x] Đọc source/docs và quyền; xác minh oldV3CLOSED, không có credentials staging/CLI; Dashboard cóphiên đăngnhập, FreeOrg1project. Owner sẽkết nốiSupabase, chưaconfirmed.
- [x] S01: Inventory được xác định đầy đủ; cả hai reviewer APPROVE kế hoạch slice S02–S05 sau khi sửa finding redirect. Xem `docs/reviews/2026-10-21-permission-staging.md`.
- [x] S02: Đã có guard, inventory và preflight read-only riêng; giữ nguyên runner/test/env cũ. Local25PASS/0FAIL/0SKIP và syntax check đạt; chưa có remote execution.
- [x] S03: Hai reviewer APPROVE đúng4hash cuối; code commit local02a1182, final27PASS. Walkthrough đã có ở README của tool, chưa có xác nhận owner đọc.
- [x] S04: owner tự tạo project Free riêng, Chrome observedrefineckiashpwloncxnbqx/Healthy/Nano/Sydney. Manifest01 và privateconfig riêng đã xác minh; không dùngconnector hoặc DBgốc.
- [x] S05: lượt đầu FAIL(Auth200/RESTroot401) giữ nguyên; owner cấp thêm1candidate×2scope+1preflight/2GET. Bản sửa dd8efd4/local37PASS được hai reviewerAPPROVE; actualslotbổsung PASSrouting-only(Auth200,REST404/PGRST205),2940ms/exit0. Tổng2attempt/4GET đãtiêu, còn0; khôngdataaccess/businessproof hoặcSQL.
- [ ] S06: Provider/DBidentity+emptytarget+SQLbundle review và bootstrap riêng; đangBLOCKED dependency, không mở chỉvìS05PASS.
- [ ] S07: Hostedadapter +fixtures +exactfullsuites; giữisolated choreset/rollback/restore; đangPENDING, không giảmcoverage.
- [ ] S08: Unioncoverageproof +so sánhthờigian thực; đangPENDING.
- [x] S09: checkpoint02 đãlưu trước22:55: source59b611.../dd8efd4, actualreceipt01FAIL/02routingPASS,0SQL/business,oldledgerunchanged vàbướctiếptheo. Finaldeliveryreview/provenance ởpacket02/reviewrecord; khôngđóngtoànbộchange(S06–S08pending). Hardstop23:00.

Không tự tạo vòngretry. Plan/implementation review tốiđa2candidate×2scope; finding chưa xửlý đủthìghiBLOCKED tạicheckpoint. Việc hếtallocation cũkhông bịxóa bằngworkstreamnày; các bước CI/heavycũ vẫnkhôngđượcdispatch.

Ngoại lệ bổ sung được owner cấp rõ sau S05FAIL: đúng1candidate sửa/2scope và1actualpreflight/2GET theo DEC-STG-07, không reset lượt cũ hoặc mở bootstrap. Hết grant bổ sung hoặc remote lại lỗi thì dừng và checkpoint.
