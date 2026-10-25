# Sửa probe REST staging — đề xuất sau lượt FAIL 21/10/2026

Trạng thái22:27+07: **bản sửa local `dd8efd4908c14f851fb56623761ca0e5abd26af8` đạt37PASS, cả hai reviewer APPROVE trước actual; lượt bổ sung đã PASS routing-only và tiêu hết1/1attempt.** Đây là sửa đúng lỗi S05, không mở bootstrap, SQL hoặc full backend. Nguồn cấp: trả lời async `call_273da3df6f9f4595b0eb472cb27063ba`, “Đồng ý sửa, review và thêm tối đa 1 preflight”.

## Bằng chứng và nguyên nhân

- Staging riêng: `ineckiashpwloncxnbqx`, `https://ineckiashpwloncxnbqx.supabase.co`, Healthy/Free/Nano/Sydney trong Dashboard. Owner tự tạo project; DB gốc không được truy cập.
- [Receipt thực](../../implementation-log/permission-staging-20261021/remote-preflight01.json): Auth200, REST root401; FAIL,2101ms, exit1, một attempt/hai GET; `mutationReady=false`, `businessTestsRun=false`.
- Source đã chạy: `02a118285c4b88c62237bd3db8086207db8eb30f`; fingerprint `35ef7b6781bcfc5ed1b91875f5b129f5c0ee07ef7955509ed98e73231ee8807c`.
- Lỗi thiết kế: `scripts/permission-staging.mjs:180` gọi `/rest/v1/`, `:199` đòi2xx. Đây là OpenAPI schema endpoint. [Changelog Supabase17/02/2026](https://supabase.com/changelog/42949-breaking-change-removing-access-to-openapi-spec-via-the-anon-key) loại quyền anon cho project mới từ11/03, trong khi resource dữ liệu thông thường không bị ảnh hưởng. [API keys](https://supabase.com/docs/guides/getting-started/api-keys) xác nhận publishable không kèm user dùng roleanon.
- Không giữ response body nên401 riêng lẻ chỉ phù hợp thay đổi trên; chưa xác định chính xác thông điệp trả về. Không suy key sai, DB hỏng hoặc lỗi nghiệp vụ từ receipt này.
- Mock2xx và hai review trước chưa đối chiếu hợp đồng endpoint/role hiện hành. Guard đã chặn retry đúng, nhưng kiểm local không phát hiện giả định provider sai.

## Bản sửa đã hiện thực, chờ review thực thi

1. Giữ publishable/anon key, exact origin, TLS, source/coverage/deadline guards và số request. Không đọc secret, mở ACL, sửa env hay dùng OpenAPI root làm healthcheck.
2. Auth vẫn GET `/auth/v1/settings`, bắt buộc2xx.
3. REST routing probe dùng tên resource dành riêng, cố định: `/rest/v1/__permission_staging_probe_20261021__?select=*&limit=0`. Chỉ chấp nhận404 cùng JSON `code=PGRST205` theo [PostgREST error contract](https://docs.postgrest.org/en/stable/references/errors.html#group-2-schema-cache). Đây là bằng chứng router/schema-cache trả lỗi định danh cho resource không tồn tại, **không** chứng minh đọc bảng hoặc logic DB đạt.
4. Giới hạn body tối đa4096bytes, yêu cầu JSON, timeout5giây bao gồm đọc body; tổng cửa sổ15giây. Receipt chỉ lưu mã/classification allowlist, không body/hint/message. Nếu resource vô tình tồn tại và trả200 cũng từ chối, không đọc hàng (`limit=0`).
5. Không nhận401, generic404, HTML, JSON khác mã, body quá giới hạn, body treo, redirect, lỗi TLS, timeout hoặc lỗi source thành PASS. Thêm synthetic negative controls cho các trường hợp này trước khi remote.
6. Kết quả probe tương lai phải ghi `restDataAccessVerified=false`, `mutationReady=false`, `businessTestsRun=false`. Các35stage/760runtime identities và726+111 mappings giữ nguyên; không đổi bất kỳ assertion/test nghiệp vụ hoặc required gate nào.
7. Trước remote đầu tiên của mỗi contract, reviewer kiểm bảng method/path/role/expected response/source chính thức/ngày kiểm chứng. Synthetic fixture phải bám contract này, không tự chọn2xx để chứng minh implementation.

## Ngân sách bổ sung owner đã cấp

- Tối đa1candidate sửa, review bởi2scope hiện có; không mở reviewer mới hoặc vòng lặp review vô hạn.
- Tối đa1actual preflight bổ sung/2GET, sau review và guard tests;0CI/publication/heavy/SQL/bootstrap.
- Giữ nguyên actual claim cũ; không xóa/đổi tên hoặc nhận lại lượt đã tiêu. Nếu owner cấp thêm, guard bổ sung phải bind grant mới với hash claim cũ/source mới/manifest mới, fixed slot độc lập output path và giữ lịch sử cả hai lượt. Chưa có grant thì không tạo slot chạy được.
- Giữ cutoff22:30 cho mutation,22:45 cho test, checkpoint22:55 và hardstop23:00+07 hôm nay. Gặp lỗi remote tiếp thì dừng, giữ receipt, không tự xin thêm lượt nối tiếp trong cùng phương án.
- Không cài dependency; Node có sẵn. Dữ liệu tăng dự kiến dưới1MB, dùng C/D đã còn trên30GiB free.

## Candidate và kiểm chứng offline

- 4file script được sửa, không sửa application/test nghiệp vụ/runner/env. [Log05](../../implementation-log/permission-staging-20261021/local-guard-tests05.log):37PASS/0FAIL/0SKIP, exit0,26419.879ms; syntax/diff check đạt.
- Source fingerprint05 canonical `59b611459df5ec751528f27a675bbe32740971eaf52d0dd039ac7a74eda7e849`; manifest02 canonical `75461dda2633adbb981a414964d1bde0a72c62d702e9d92afc82c59bdd01f9a4`.
- Grant canonical `179959c4b6608cc17807c3150f806cae6afe31036c73018ba5c2c93e92e1803b`, predecessor raw SHA256 `3cd550a64bf676090ea3be7d277287173dbd4063f545a46577a5b3068957f766`. Grant file được lưu ngoài code và bản evidence trên docs; slot bổ sung đã tiêu, không có lượt tiếp theo.
- Test phủ401 giả dạngexpectedJSON, generic404, saiPGRSTcode, HTML, malformedJSON, oversize, resourcecollision200, bodytimeout, exact4096byteschunked, thiếu/sai grant/target/claim và replay với manifest khác.

## Kết quả thực và phạm vi còn lại

[Receipt02](../../implementation-log/permission-staging-20261021/remote-preflight02.json) SHA256 `9f8b7ab73cf40ff8e925aadff39ec435406bf68d188fe7de63d37e0c3be0d510`: bắt đầu22:25:21.485, kết thúc22:25:24.053+07; tổngmonotonic2940ms, exit0. Auth200; reservedRESTresource404/codePGRST205. `restDataAccessVerified=false`, `mutationReady=false`, `businessTestsRun=false`. Không suy đọc bảng/quyền/schema đạt. Lượt01 giữ FAIL, không nhận lại thành PASS sau sửa.

Hai reviewer explicitAPPROVEdd8efd4/manifest02/grant trước execution. Finalreceipt/provenance cầnđối chiếu ở packet02; không là vòng thử/thực thi mới. Tổnghai attempt/bốn GET đã tiêu;0SQL/CI/heavy/business, không truy cập DBgốc. Giữ claims, staging và privateconfig cho lần tiếp tục; không tựmở budget/deadline mới.

## Sau slice này

Provider/DB identity, empty-target proof, exact SQL bootstrap, hosted adapter và full suite vẫn cần gate riêng. Không chạy local reset/migrations glob trên staging. Giữ project và cấu hình riêng để lần sau không tạo lại; mật khẩu vẫn do owner quản lý, key không nằm trong docs/repo.
