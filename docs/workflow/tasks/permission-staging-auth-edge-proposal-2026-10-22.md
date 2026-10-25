# Staging Auth/Edge — đề nghị hữu hạn, chưa được cấp quyền

Author `/root/budget_time_guard_fix`; cần hai reviewer rồi owner chốt trước ghi. Chỉ target `ineckiashpwloncxnbqx`; không đọc/ghi DB gốc. Chưa rerun bootstrap hoặc sửa app/SQL/Auth/Edge.

**Hiện trạng:** root readback Confirm email ON, password min6/không thêm character classes, CAPTCHA OFF. Edge UI hiện “Deploy your first function”, chưa chứng minh đã có function. Editor thêm/đổi tên được file; root đã discard draft, không Deploy. MCP hiện chỉ5tool database/docs, không có Auth/Edge write. Candidate sạch `ad265321144521c0669500fea9be0f96ebacb769`.

`D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/storeKey.ts:34` dùng `storeN@store.pos.local`; `authRepo.ts:81–100` đòi user và session cùng id ngay sau signup. Vì địa chỉ tổng hợp không nhận email, Confirm ON chặn luồng tạo quán hiện tại. Source Edge gồm gateway/public index và `_shared/menuImageHttp.ts`, SDK exact2.45.0; manifest20packages+lock đã pin. Source chưa chứng minh hosted PASS.

## Cửa sổ và quyền đề nghị

Đề nghị **21:00–21:45 ngày22/10, Asia/Bangkok**. **21:30 dừng mọi ghi mới**; chỉ ngoại lệ một rollback Confirm OFF→ON đã được owner cho phép, hoàn tất trước21:45. **21:45 dừng mọi thao tác**. Bắt đầu sau owner reply+hai review; không tự gia hạn.

1. Một lần Confirm email ON→OFF trên staging, giữ nguyên password/CAPTCHA/SMTP/signing keys. Readback trước/sau. Đề nghị owner cho phép rollback trên nếu kiểm tra thất bại; nếu thành công giữ OFF cho luồng app, hết cửa sổ chỉ đóng quyền thao tác.
2. Nếu gate bundle đủ: một first-deploy/function `menu-image-gateway` với JWT verification **true**, `menu-image-public` **false**; không template SDK mới, không set/reveal service-role/secret/API keys. Không redeploy/retry khi unknown.
3. Tối đa **2 TEST stores +2 Auth users**, **6 employees tổng cộng kể cả owners**, **2 PNG≤64KiB/ảnh,≤4 owned Storage objects/256KiB**. Tạo qua app/RPC hiện có, không SQL seed hoặc admin-create để bỏ qua signup. Lưu ownership IDs và baseline counts; giữ TEST data cho review, xóa cần quyền riêng.

Đây là supplemental hosted flow; không đổi hoặc thay thế full35/760, Docker fixture/T04, nativePG16, restore và isolated physical-preservation gates. Staging đã populated không được nhận là pristine fixture.

## Gate triển khai Edge thực tế

[Docs dependencies](https://supabase.com/docs/guides/functions/dependencies) khuyến nghị deno.json riêng từng function; chưa bảo đảm hosted builder dùng đúng test deno.lock. [CLI](https://supabase.com/docs/reference/cli/supabase-functions-deploy) có `--use-api` bundle server-side không Docker; UI hoặc cờ này **không tự chứng minh graph20**. Local resolver proof cũng không chứng minh graph online.

Ưu tiên bundle bằng resolver/cache đã kiểm exact20/SRI từ3sourcefiles+reviewed config/lock; hash bytes trước upload. [API update](https://supabase.com/docs/reference/api/v1-update-a-function) nhận EZBR+SHA256; [CLI source](https://github.com/supabase/cli/blob/develop/apps/cli/src/shared/functions/deploy.ts) dùng binary create/update. First-create deprecated: review exact version/transport trước chọn route; không thử deploy để tìm hiểu.

**Chưa xác minh transport graph20 qua MCP/UI.** Nếu Editor/server builder không cung cấp bundle/graph readback phù hợp thì Edge giữ BLOCKED. Cần chốt riêng authenticated transport và recipe payload trước owner cấp action; không tự cài CLI/Docker/WSL, lấy PAT/secret hoặc tạo môi trường mới. Nếu cần tải công cụ, phải báo download/install/peak, đo C/D và xin đúng quyền còn thiếu. Auth/TEST flow có thể xin riêng; image flow còn PENDING khi Edge blocked.

## Kiểm chứng và dừng

Recheck đúng project, source/config/lock hashes và baseline. Signup trả user+session; bootstrap/owner đổi PIN, pair/logout, hai-store isolation và denied staff thao tác. Nếu Edge đủ proof: JWT/no-employee bị401, cross-store bị403/404 không effects; upload/read/public/unpublish đúng cache và object ownership. Đọc lại JWT flags, deployment version/digest, owned row/object counts; ngoài TEST scope phải giữ nguyên. Không lưu StoreKey/PIN/JWT vào chat/evidence chung.

Mismatch, incident, lỗi/timeout/unknown, vượt quota hoặc thiếu readback: dừng phần phụ thuộc, giữ request/run IDs và kết quả; không identity mới để retry. Không rollback/xóa ngoài quyền. [Auth headers](https://supabase.com/docs/guides/functions/auth-headers) hiện hỗ trợ HS256 lẫn asymmetric JWT ở verify_jwt; không đổi signing policy.
