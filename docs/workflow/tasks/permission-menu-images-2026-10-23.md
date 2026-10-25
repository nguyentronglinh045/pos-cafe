# Kiểm luồng ảnh món trên DB mới — 23/10/2026

**Kết quả cuối:** luồng hosted functional đã đạt trong phạm vi kiểm dưới đây. Đã bổ sung đúng hai Edge Functions còn thiếu bằng source sẵn có; không sửa tracked app/SQL/ACL/Auth hoặc merge/push main. Hai PNG thử đã xóa theo xác nhận riêng; món TEST trở về không ảnh. Full release gate vẫn mở. [Summary](../../implementation-log/permission-menu-images-20261023/functional-summary01.json).

## Đề bài và giới hạn

Owner yêu cầu: “kiểm tra luồng ảnh món trên DB mới … phần nào đã có thì dùng lại, chỉ sửa phần còn thiếu … ưu tiên xác nhận vấn đề trước khi thực sự chạy”. Đây là scoped hosted functional check, không thay thế hoặc hạ gate phát hành. Owner cũng đã xác nhận không cần chuyển dữ liệu từ DB cũ; lượt này không truy cập DB cũ hoặc đổi binding main/production.

- Code: `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, HEAD sạch `e42215044b4faf7e90f787ae8e975937ad3e4479` khi khảo sát.
- Target duy nhất: `ineckiashpwloncxnbqx` / `pos-cafe-permission-staging`.
- Không bootstrap/tạo quán, sửa SQL/ACL/Auth hoặc bật legacy direct Storage writes. Dùng TEST-A/B/cashier sẵn có nếu chuyển sang kiểm chức năng.
- Hồ sơ bằng chứng: [permission-menu-images-20261023](../../implementation-log/permission-menu-images-20261023/).

## Xác nhận trước khi chạy nghiệp vụ

| Thành phần | Bằng chứng thực tế | Kết luận |
| --- | --- | --- |
| UI/adapter ảnh | `src/adapters/supabase/repos.ts:17`, `newPermissionRuntime.ts:28`, `permissionMenuImagePort.ts:57`; feature legacy merge `fe91e1d` từ22/06 | Đã có code; không viết lại tính năng |
| Gateway/public handler | `supabase/functions/menu-image-gateway/index.ts`, `menu-image-public/index.ts`, `_shared/menuImageHttp.ts`; SDK exact2.45.0, CORS có x-client-info | Dùng lại source hiện có |
| Buckets | Dashboard + SELECT: legacy public `menu-item-images`, private `menu-item-image-staging`, mỗi bucket limit5242880 và JPEG/PNG/WebP | Đã có, không tạo lại/mở public staging |
| RPC và registry | SELECT catalog:5public RPC,2private tables,1withdrawal trigger. authenticated execute4staging RPC, service execute public_lookup, không ngược lại. storage.objects không có policy | Phần DB đã có cấu trúc và ACL kỳ vọng; chưa thay bằng kiểm quyền actor thật |
| Edge deployment | Dashboard “Deploy your first edge function”; OPTIONS gateway, GET gateway và GET public với UUID giả đều404 `Requested function was not found` | Hai function chưa triển khai; chưa chạy upload/save để lặp lại lỗi đã biết |

[Probe](../../implementation-log/permission-menu-images-20261023/edge-readonly-probes01.json), [SELECT và kết quả](../../implementation-log/permission-menu-images-20261023/db-image-inventory01.json), [functions](../../implementation-log/permission-menu-images-20261023/functions-before.png), [buckets](../../implementation-log/permission-menu-images-20261023/buckets-before.png).

MCP Supabase vẫn lỗi OAuth refresh lúc khởi tạo; không đổi approval policy/config hoặc xin lại OAuth trong vòng lặp. Fallback Dashboard đã đăng nhập và API GET/OPTIONS đúng target. SQL Editor chỉ chạy SELECT catalog do root viết, không chạy function nghiệp vụ/DDL. Query draft private được lưu tự động bởi Dashboard.

## Phần bổ sung đã triển khai

[deployment-payload01.json](../../implementation-log/permission-menu-images-20261023/deployment-payload01.json) có hai package, mỗi package4files: index.ts, menuImageHttp.ts, deno.json, deno.lock. Chỉ đổi relative import `../_shared/menuImageHttp.ts` thành `./menuImageHttp.ts` cho bố cục file-local của Dashboard; body nghiệp vụ/shared helper/SDK import giữ nguyên. Mỗi file có bytes/hash, source index hash riêng.

- Gateway `verify_jwt=true`, vẫn cần store JWT và employee token/current menu.manage qua caller RPC.
- Public `verify_jwt=false` riêng function public: anonymous GET chỉ asset đang published, không đọc staging hoặc nhận arbitrary bucket/path; OPTIONS metadata, method khác405.
- Chỉ dùng server env Supabase cấp sẵn; không đọc/set/reveal service key hoặc thêm secret vào web.
- Không sửa app/SQL chỉ vì endpoint chưa triển khai. Không install SDK/runtime/WSL/Docker.

Owner trả lời “Cho triển khai và kiểm thử” tại question `call_8915dbe231684992bbf635b6092326ea`, item0; [receipt](../../implementation-log/permission-menu-images-20261023/owner-deploy-authorization01.json). Hai reviewer đã APPROVE payload trước deploy: [prepared review](../../implementation-log/permission-menu-images-20261023/prepared-plan-review01.json). First-deploy hai function qua Dashboard; public mặc định JWT ON rồi được đặt OFF riêng theo grant, gateway giữ ON. Đọc lại cả8file từ Code tab bằng clipboard đầy đủ, đối chiếu hash khớp payload (chỉ normalize CRLF). [Gateway readback](../../implementation-log/permission-menu-images-20261023/gateway-deployed-source-readback01.json), [public readback](../../implementation-log/permission-menu-images-20261023/public-deployed-source-readback01.json), [JWT readback](../../implementation-log/permission-menu-images-20261023/deployed-jwt-config-readback01.json), [function list sau deploy](../../implementation-log/permission-menu-images-20261023/functions-after.png).

Dependency limit: config+lock là input được pin từ source, **chưa chứng minh hosted resolver thực tế dùng exact20/SRI**. Official Studio gửi files/config trong multipart; lock input không tự là runtime graph proof. Provider deployment version/EZBR digest chưa capture; source/JWT được readback trực tiếp sau deploy. Không nhận deployment/functional PASS thành full CI/backend/release gate. Investigator không tìm thấy normative requirement bắt graph20 trước mọi scoped hosted functional deploy; điều kiện đó nằm trong đề xuất cũ chưa được cấp quyền ngày22/10, không tự trở thành gate mới của task hôm nay. Giữ phạm vi kiểm chức năng đã giao, không mở framework resolver mới.

## Kiểm chức năng sau khi phần thiếu được bổ sung

Chỉ dùng một món TEST của quán A, hai file ảnh nhỏ có sẵn; không tạo thêm tenant/employee hoặc thử bằng service role. Baseline ID/binding/counts trước ghi. Giữ UI demo và dữ liệu nghiệp vụ ngoài món TEST.

1. Owner chọn ảnh, Save menu; xác nhận gateway201, handle, menu RPC và refetch persisted assetKey; preview blob trước save không là PASS persistence.
2. Anonymous public GET200 với MIME/body/ETag/cache; conditional304; unpublished/unknown404 no-store.
3. Cashier POST/read staging/publish bị chặn; binding/registry/object không đổi do các request denied. Privileged SELECT chỉ là observer, không chứng minh user quyền.
4. Replace bằng ảnh khác; assetKey mới, ảnh cũ fresh GET/conditional404; ảnh mới decode được trên UI sau reopen/refetch.
5. Remove qua UI và Save; persisted binding null, UI không còn ảnh, oldURL404. Remove binding không tuyên bố xóa Storage bytes; giữ ownership/counts để cleanup đúng phạm vi khi được phép.
6. Revoke các session API riêng của lượt kiểm; không revoke UI session người dùng. Auth Confirm email giữ nguyên ON.

Recipe được thực hiện với điều chỉnh phép kiểm có chủ đích: lần upload/publish đầu dùng owner API để kiểm được chính handle thật **trước publication**; lần thay ảnh dùng file chooser và Save menu của UI, phủ browser upload/CORS/persistence. Không nhận lần đầu là UI upload-to-empty-slot PASS. Cả hai dùng cùng món, hai PNG sẵn có68B và10109B; không tạo fixture/ảnh/runtime mới. Không chạy whole synthetic T09/fixture/destructive suite vào DB đang populated.

## Kết quả thực thi

| Ca | Actual / bằng chứng |
| --- | --- |
| JWT/CORS/public method | GET thiếu JWT401 AUTH_REQUIRED; JWT store ES256 hợp lệ nhưng thiếu employee401 EMPLOYEE_SESSION_REQUIRED; OPTIONS204 có custom headers; public unknown404 no-store, public POST405. [JWT probes](../../implementation-log/permission-menu-images-20261023/gateway-auth-readonly01.json), [negative paths](../../implementation-log/permission-menu-images-20261023/negative-paths01.json). |
| Cashier denial | Upload403, staging GET/DELETE403, apply_menu_changes FORBIDDEN; thử cả UUID không tồn tại và handle ảnh tồn tại thật. SELECT trước/sau giữ nguyên binding, registry, Storage. [Owned handle](../../implementation-log/permission-menu-images-20261023/owned-handle-denials01.json), [state sau denial đầu](../../implementation-log/permission-menu-images-20261023/state-after-denials01.json), [sau denial handle thật](../../implementation-log/permission-menu-images-20261023/state-after-owned-denials01.json). Không dùng service role làm actor. |
| Upload/publish/read | Owner API upload201, known unpublished handle public404, owner staged read200 đúngbytes; publish qua apply_menu_changes, RPC refetch đúngassetKey; anonymous public200 đúngPNG/hash/cache/ETag, conditional304. [Proof](../../implementation-log/permission-menu-images-20261023/first-upload-publish-proof01.json). |
| UI persistence/render | Menu mở từ DB sau API publish; img public URL decode1×1. [DOM proof](../../implementation-log/permission-menu-images-20261023/first-image-ui-decode01.json). Preview blob không được dùng làm persistence proof. |
| Replace | Owner UI chọn PNG thứ hai qua file chooser và Save menu; refetch assetKey mới, anonymous GET đúng10109bytes; UI public URL mới decode được. URL cũ và conditional cũ đều404/no-store. [API proof](../../implementation-log/permission-menu-images-20261023/ui-replace-proof01.json), [DOM](../../implementation-log/permission-menu-images-20261023/replacement-ui-decode01.json), [ảnh](../../implementation-log/permission-menu-images-20261023/replacement-detail-ui.png). |
| Remove | Owner UI Xóa ảnh + Save menu + reopen: Chưa có ảnh, imageAssetKey null; tên TEST - Cà phê/giá32000 giữ nguyên. Removed URL và conditional đều404/no-store. [Proof](../../implementation-log/permission-menu-images-20261023/ui-remove-proof01.json), [ảnh cuối](../../implementation-log/permission-menu-images-20261023/removed-menu-ui.png). |
| Closeout | Hai session employee Node revoke xong, old tokens bị từ chối; UI owner session riêng được giữ. Confirm email ON readback, không đổi Auth. [Sessions](../../implementation-log/permission-menu-images-20261023/api-session-closeout01.json), [Auth](../../implementation-log/permission-menu-images-20261023/auth-settings-closeout01.json). |

Node log có32records:14RPC,18Edge; gồm một RPC404 do generic helper gọi nhầm prefix. Không phải tổng request browser/Auth/observer/Dashboard hoặc số testcases của fullgate. [Log](../../implementation-log/permission-menu-images-20261023/functional-request-log01.json), [26exact selected executed cells](../../implementation-log/permission-menu-images-20261023/executed-cells01.json), [raw owner messages](../../implementation-log/permission-menu-images-20261023/owner-message-extract01.json). Tool completion không tự là testcase PASS; records và assertions phải đọc cùng actual proofs.

Các lỗi phép kiểm cục bộ được giữ riêng: Node REPL không có FormData global nên dùng multipart chuẩn, chưa gửi upload ở cell diagnostic đó; helper thêm permission_ nhầm cho RPC apply_menu_changes nên404, sau đó gọi đúng route từ source, không replay các Edge denial đã đạt. UI reload hiển thị màn đầu trong lúc restore pairing, sau đó tự về roster; agent không tạo quán mới. Đây không là lỗi tính năng ảnh và không sửa app để chữa harness.

## Dọn đúng hai ảnh TEST

Owner trả lời “Xóa hai file TEST này” tại `call_279be53eb96f4d4ebd16b13779b2f2a3`, item0. [Grant với2exactpaths](../../implementation-log/permission-menu-images-20261023/owner-cleanup-authorization01.json). Root đối chiếu đúng project/bucket/store/item/2UUID filenames, chọn2files, dùng Dashboard Storage Delete và xác nhận2items; không SQL DELETE metadata, không xóa bucket/folder hoặc registry. [Cleanup executed cells/raw reply](../../implementation-log/permission-menu-images-20261023/cleanup-executed-cells01.json), [UI sau dọn](../../implementation-log/permission-menu-images-20261023/storage-cleanup-after.png).

Final SELECT: hai PNG không còn; registry giữ2uploads và2assets published=false; target image null. Storage còn **1object0byte .emptyFolderPlaceholder** do Dashboard giữ folder rỗng, không phải PNG còn sót. Giả định ban đầu “tổng storage rows phải0” đã bị actual bác bỏ; không đổi lịch sử hoặc xóa object thứ ba ngoài quyền để làm xanh. [Actual cleanup state](../../implementation-log/permission-menu-images-20261023/state-after-storage-cleanup01.json). [Official Studio source](https://github.com/supabase/supabase/blob/77805f7ecbca8dee5613b8b92f8f9a9d66403a85/apps/studio/state/storage-explorer.tsx) có nhánh khôi phục placeholder khi xóa file làm folder rỗng. Tổng payload PNG đã xóa10177B; chưa đo physical bytes/billing của provider. Giữ evidence nhỏ và registry lịch sử để review/tái hiện.

## Giới hạn và tái hiện

- Chưa full matrix cross-store/fault/Storage bypass/expiry/race của feature; chưa full CI/backend/release gate. Không ghép functional PASS vào35/760 hoặc nhận graph20 đã đạt.
- Không UI upload lần đầu vào empty slot trong lượt này; API initial publish và UI replacement upload/save đã được tách rõ. UI remove/reopen và DOM decode đã kiểm thật.
- Không merge/push main, đổi Vercel env, DB gốc hoặc chuyển production binding. App checkout vẫn e422 sạch, package-lock hash giữ nguyên. [Source binding](../../implementation-log/permission-menu-images-20261023/source-binding01.json).
- Dùng lại web local5173 và TEST-A hiện có. Muốn tái kiểm: đọc owner credential từ private folder được bảo vệ của task trước, đăng nhập bình thường; chọn đúngmón TEST id442499a3-0950-4b6f-a2f4-3ad664897141 và2fixtures trong test-inputs01.json. Không replay create/pay/bootstrap; không lấy credential từ docs. Cấu hình function/source ở deployment-payload01.json, actual requests/oracles ở proofs/executed-cells.
- Không cài dependency/runtime/WSL/Docker, không dựng runner/resolver mới. C/D gần checkpoint còn179,28GiB/92,04GiB trống; đây là free-volume snapshot, không quota OS hoặc số thu hồi do remote cleanup.

## Trạng thái và review

Inventory trước-run, hai Edge deployment, functional checks và cleanup đã thực hiện trong phạm vi owner giao. Root là executor/author; `/root/technical_blockers` chỉ đọc source/docs/official sources để đối chiếu, không DB/HTTP mutation. Hai reviewer độc lập kiểm đúng handoff/manifest cuối; verdict được ghi trong final-review01.json, metadata review không mở thêm quyền phát hành. Hồ sơ/index chưa commit/push, giữ nguyên dirty work khác.
