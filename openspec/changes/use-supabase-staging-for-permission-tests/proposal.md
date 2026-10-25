> **Đối chiếu xuất bản 25/10/2026.** Hồ sơ thiết kế và checkpoint staging lịch sử; không mở lại bootstrap/grant/cutoff. Routing hoặc local PASS không thay SQL/hosted/full acceptance; task này chỉ xuất bản tài liệu. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Supabase staging riêng cho kiểm thử phân quyền — 21/10/2026

Change công cụ kiểm thử, không đổi hành vi sản phẩm; bỏ `usecases.md` theo ngoại lệ tooling của SPEC-STANDARD. Mức nhạy cảm: định danh môi trường, SQL migration và phân quyền.

## Đề bài và quyền

Owner trong chat này giao: “lập kế hoạch dùng Supabase staging riêng, cho các subagent review kỹ rồi triển khai. Giữ nguyên coverage, không chạm DB gốc, lưu kế hoạch và bằng chứng trên docs; vẫn dừng trước 23h.” Đây là quyền tạo và cấu hình staging riêng, không là quyền sửa project gốc, merge, phát hành production hoặc mở lại CI/backend đã đóng.

## Vấn đề và kết quả cần đạt

Giảm công dựng lại toàn bộ Supabase cho các kiểm thử nghiệp vụ thường xuyên bằng một project staging riêng. Giữ các kiểm thử yêu cầu môi trường có thể phá/dựng lại trong lane isolated. Chưa có số đo tốc độ của staging; không hứa mức giảm thời gian trước phép đo.

Kế hoạch triển khai đầy đủ gồm kiểm kê coverage → guard riêng → project và identity → bootstrap đúng source → adapter hosted → kiểm thử và đối chiếu toàn bộ coverage. Mỗi bước có trạng thái riêng; không gọi một preflight/seed thành full backend PASS.

## Hiện trạng và nguồn

- Code baseline `90e30f2b2b0f046c549b268b32f1840ad99c2409`, worktree `D:/Workspace/pos-cafe-permission-run-20261020/code`.
- Catalog hiện có 35 stage, 760 required execution rows: STATIC313, PIN_ONBOARD58, PIN_IDENTITY50, PIN_CANARY1, PG16_T01 30, SUPABASE_T02 17, SUPABASE_T04 291. Đây là số row runtime, không thay số logical cases hoặc occurrence ở các inventory gốc. Nguồn: `scripts/permission-runtime-catalog.mjs:18`, `:35`.
- Runner hiện khóa loopback/Docker và snapshot/reset: `scripts/permission-full-runtime-policy.mjs:18`, `:66`; env PIN local: `tests/supabase/permissionPinOnboardEnvironment.ts:31`. Không đổi các guard đó để nhận cloud.
- Khảo sát độc lập xác nhận cả30backend stage/447runtime row chưa chạy unchanged trên hosted. T04 kiểm `supabase_admin`/`rolsuper=true` và dùng Docker dump/restore/drop schema (`scripts/permission-runtime-t04-fixture.mjs:238`,`:325`); module tên hosted hiện có `CERTIFIED_HOSTED_PROFILES=[]` (`scripts/permission-hosted-profile.mjs:6`) và executor luôn từ chối (`scripts/permission-hosted-runtime.mjs:79`). Không nhận đây là adapter sẵn dùng.
- DB gốc bị cấm: `kfqjdfwxhkdwihjobpny`, origin `https://kfqjdfwxhkdwihjobpny.supabase.co`; không SQL/API, kể cả read-only, vào project này trong workstream mới.

## Quyết định đã chốt

- DEC-STG-01, 21/10: owner chọn project staging riêng; dữ liệu tổng hợp, không clone dữ liệu/tài khoản/secret production; giữ schema, chính sách và assertions cần kiểm.
- DEC-STG-02: env/config staging riêng, không fallback `.env`, `.env.local`, `PG*` hoặc liên kết CLI hiện có. Guard local và acceptance giữ nguyên.
- DEC-STG-03: owner sẽ kết nối Supabase trong Codex (trả lời async trong chat); đây là ý định, chưa là bằng chứng đã kết nối hoặc có quyền trên staging.
- DEC-STG-04, agent chọn trong phạm vi được giao: chỉ dùng Free Plan nếu UI/quyền thực cho phép; không nâng gói, add-on hoặc phát sinh chi phí định kỳ khi chưa có quyết định mới. Ưu tiên region giống đích hiện hành; phải quan sát trước khi chọn.
- DEC-STG-05: thời hạn tuyệt đối `2026-10-21T23:00:00+07:00`; dừng mở mutation từ22:30, dừng test từ22:45, checkpoint xong trước22:55. Nếu không đủ thời gian/quyền/identity thì dừng đúng phần phụ thuộc.
- DEC-STG-06,21/10, owner chọn Chrome trực tiếp thay plugin, tự tạo project; refobserved `ineckiashpwloncxnbqx`, Healthy/Free/Nano/Sydney. Q-ACCESS đã giải quyết cho HTTPpreflight qua explicitprivateconfig; không suy cóSQL/providerprivilege. Không gọi Supabaseconnector hoặc DBgốc.
- DEC-STG-07,21/10, sau S05FAIL vì badOpenAPIprobe, owner trả lời async `call_273da3df6f9f4595b0eb472cb27063ba`: “Đồng ý sửa, review và thêm tối đa 1 preflight”. Cấp thêm đúng1candidate review×2scope và1attempt/2GET; giữ claim cũ/cutoffs/coverage,0SQL/CI/heavy. Chọn typedmissingresource làm routingprobe, không nhận401/generic404 làPASS, không nâng key/ACL; xem [kế hoạch sửa](../../../docs/workflow/tasks/permission-staging-rest-probe-remediation-2026-10-21.md).

## Câu hỏi phải chốt trước khi làm

- Q-ACCESS: HTTPpreflight đã có target và explicitprivateconfig. Quyền SQL/bootstrap/provider identity vẫn thuộc Q-PROVIDER; không cần mở lại kết nối plugin.
- Q-PROVIDER: quyền thực thi migrations/candidate SQL trên managed PostgreSQL chưa chứng minh. Không suy quyền superuser từ local; chặn bootstrap/adapter phụ thuộc cho đến khi kiểm chứng.
- Q-COVERAGE: phân loại hosted-compatible là kế hoạch, không công nhận kết quả; giữ mọi row ở trạng thái pending/isolated cho đến khi adapter đạt cùng assertions, fixture và reporter.

## Ngân sách thực hiện mới, không reset lịch sử

Ledger V3 cũ `budget-edge-resolution-2300.json` SHA256 `3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c` giữ CLOSED, spent publication2/2, CI2/2, heavy1/3, review6/6. Scope staging không cho chạy lại các job cũ.

Trần do agent chọn cho scope mới: 1 project Free, 2 candidate review (mỗi candidate2scope), 1 lượt preflight remote tối đa2GET, không retry tự động; 0 publication/CI/heavy local hoặc isolated. Bootstrap tối đa1attempt chỉ sau exact manifest/identity/empty-target và review; nếu chưa đủ dependency thì NOT_RUN. Local chỉ dùng Node built-in, không cài dependency; dữ liệu Windows mới dự kiến dưới10MB, task tổng vẫn trong ngân sách cũ20GiB và giữ30GiB free mỗi ổ. Bộ test đầy đủ chưa mở trong lượt đầu nếu chưa có adapter/review và ngân sách cụ thể.

## Phương án và hệ quả

Chỉ đổi env bị loại vì guard/SQL reset giả định local. Clone production bị loại vì không cần dữ liệu thật và không sao chép đủ Auth/Edge/Storage. Thay toàn bộ isolated bằng staging bị loại vì rollback/restore cần lifecycle khác. Kết hợp hai lane giữ coverage nhưng phải bảo trì mapping và đồng bộ migrations/config có kiểm chứng.

Nguồn chính thức: [Managing environments](https://supabase.com/docs/guides/deployment/managing-environments), [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project). Phạm vi hướng dẫn không thay quyền thực tế của project.
