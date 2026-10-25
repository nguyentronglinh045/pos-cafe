> **Đối chiếu xuất bản 25/10/2026.** Hồ sơ thiết kế và checkpoint staging lịch sử; không mở lại bootstrap/grant/cutoff. Routing hoặc local PASS không thay SQL/hosted/full acceptance; task này chỉ xuất bản tài liệu. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Kế hoạch kiểm chứng

| ID | Nhóm | Bước và kết quả bắt buộc |
| --- | --- | --- |
| STG-T01 | Luồng chính | Xuất inventory từ current catalog:35stage/760row; giữ stage/file/name/project, source hashes và2inventory gốc; output stable. |
| STG-T02 | Quyền | Exact staging ref/origin hợp lệ mới tới fake transport; ref gốc, origin gốc, mismatch, credentials/port/query/path/fragment có0network calls. HTTP3xx từ exact staging origin bị từ chối, không có request follow redirect. |
| STG-T03 | Lỗi | Thiếu explicit config, extra key, wrong ref, key rỗng/newline/quá8192 → INPUT_REFUSED trước network; `.env`/PG* không ảnh hưởng. |
| STG-T04 | Biên |22:44:59.999 còn admission read-only;22:45:00 từ chối. Deadline field sai/hard stop quá hạn từ chối. Clock kiểm trước từng GET; tối đa2GET/attempt, khôngretry. |
| STG-T05 | Hồi quy | Bỏ/thêm/đổi một required row hoặc input hash → COVERAGE_DRIFT; inventory nhánh khác/candidate cũ không thành proof nguồn mới. |
| STG-T06 | Lỗi/quyền | HTTP lỗi ngoài typed404/PGRST205 đã chốt, timeout, network exception có chứa key và redirect → mã hữu hạn; serialized receipt/stdout không có canary key, DSN, headers hoặc body. |
| STG-T07 | Luồng chính thực | Sau hai reviewer APPROVE, project Free mới quan sát được, ref khácgốc. Private config đúngtarget;1preflight thực tối đa2GET, receipt bindfingerprints. Chưa có access thì NOT_RUN. |
| STG-T08 | Quyền thực | Bootstrap bị chặn khi chưa provider/DBidentity/empty-target/exactSQL/source/marker proof. Không dùng preflight HTTP để cấp mutation. Legacyledgerhash vẫn đúng/CLOSED. |
| STG-T09 | Tích hợp sau | Khi có hosted adapters: chạy nguyên full files/cases/reporters, zero required skip/retry; so union hosted+isolated với inventory gốc. Không claim full coverage từ slice đầu. |
| STG-T10 | Ngân sách/quyền | Cùng workstream đổi receipt path/manifest sau attempt đầu vẫn bị ATTEMPT_USED trước network; test filesystem store thật. Actual HTTP không được inject synthetic store. |
| STG-T11 | Source | Fingerprint riêng chứa HEAD và app/SQL/fixture/lock. Thay nội dung SQL bằng reader giả lập trong bộ nhớ làm file hash/fingerprint khác; manifest cũ/mismatch bị SOURCE_DRIFT với0request. Không sửa source thật để làm test. |
| STG-T12 | Provider contract/biên | Auth2xx và REST reservedresource404+JSON/PGRST205 đạt routing-only. Từ chối401 giả dạngexpectedJSON, generic404, sai mã, HTML, malformedJSON, >4096bytes và200/resourcecollision; chấp nhận đúng4096bytes qua nhiều chunk. Bodytreo hết5giây/request; không retry, không body trong receipt. Kiểm currentprimarydocs trước remote. |
| STG-T13 | Grant bổ sung | Thiếu/sai grant, đổi additionalAttempts/target, sửa một byte claim cũ đều từ chối trước claim mới/network. Grant đúng ghi đúng1fixedslot, giữ byte claim cũ; đổi manifest/receipt không mở lượt tiếp. Actual grant dùng fixed directory và compile-pinned policy. |

Kiểm local tối thiểu: `node --test scripts/permission-staging.test.mjs`, syntax check các tool mới; không chạy npm/CI nặng để kiểm một guard built-in. Test security negative là điều kiện cần trước remote. Receipts ghi lệnh/exit/source/tool hashes và phân biệt synthetic transport vớiactual remote.
