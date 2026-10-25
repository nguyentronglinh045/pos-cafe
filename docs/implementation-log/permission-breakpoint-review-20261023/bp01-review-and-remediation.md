# BP1 — Review trước thực thi và gói sửa đề xuất, 23/10/2026

Trạng thái: **Gói khảo sát và kế hoạch sửa BP1A; verdict độc lập được lưu trong `bp01-final-review.json` khi có kết quả**. Đây là breakpoint khảo sát và chuẩn bị sửa; không phải source đã sửa, quyền chạy mới hoặc nghiệm thu phân quyền. Tác giả hồ sơ: `/root`.

## Quyền và snapshot

Chủ dự án yêu cầu làm theo từng breakpoint để dễ kiểm soát, cần sớm phục vụ báo cáo thứ Bảy24/10. Sau câu hỏi phạm vi, chủ dự án chọn: **“Review code và chuẩn bị bản sửa; chốt ngân sách chạy sau (khuyến nghị)”**. Lựa chọn này cấp phạm vi BP1; chưa cấp sửa application/helper, local tests, publication/CI, backend hoặc ghi staging. Không dùng thời gian linh hoạt làm quyền mở lại ledger đã CLOSED. Không hỏi lại các quyết định đang còn hiệu lực.

- Code: `D:/Workspace/pos-cafe-permission-timeonly-20261022/code`, HEAD `4f8772667fc0607c77451e5b0c5ddbedfe7b63b5`, tree `95013ef246608c96239b8ac31e8e5ea3fa744cef`, checkout sạch trước khảo sát. Không đụng checkout tích hợp có thay đổi của chủ dự án.
- Lock SHA256 `85969c1c161f74e9f68563182d99d1b0ac6fb5f17f5074444f329675ffd34e18`. [Baseline](bp01-source-baseline.json), SHA256 `46dbf948e7896fe1383aea9a7d8737417e952aaf6ffe5ae30fd99ccde9e144df`, kiểm1.107 canonical Git blob pins và catalog35stage/760required. Đây là kiểm khai báo và identity, **không phải đã review đủ mọi assertion hoặc có runtime PASS**.
- Ngữ nghĩa baseline: `catalogSHA256` là hash file `scripts/permission-runtime-catalog.mjs` (packet05:1785–1786), không phải hash `permissionAggregateCases.json` hoặc JSON catalog đã serialize. `verifiedGitBlobPins.bytes=41.697.989` là tổng buffer giao thức `git cat-file --batch` gồm header/newline, đúng producer [`verifyGitBlobPins:86–107`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-admission.mjs:86). Tổng payload canonical blobs là41.640.069byte theo reviewer đối chiếu; chênh57.920byte là framing, không là dung lượng source hoặc CRLF. Baseline được ghi01:03:09UTC trước owner trả lời câu hỏi scope; authority còn pending ở đó là snapshot lịch sử. Quyền hiện hành là lựa chọn owner đã ghi ở đoạn đầu, không sửa lịch sử baseline để tạo quyền.
- [Kế hoạch đã review](../../workflow/tasks/permission-phased-preflight-plan-2026-10-23.md), SHA256 `cc3075bf16566a2d258abd6d49ef1e0b2c708a72d68f7ffdee902b98e166eb82` giữ thứ tự T04 trước7service, một heavy tại một thời điểm, giữ35/760/12+D19/R0/R1.
- CI03 của4f đạt18pha; LIGHT6stage/343required. Cả8backend trên4f vẫn NOT_RUN. Local938/Chrome6 là kết quả trước, không có phép chạy mới trong BP1. [Bàn giao lịch sử](../permission-main-staging-night-20261022/continuation03.md).
- Staging duy nhất `ineckiashpwloncxnbqx`; DB gốc `kfqjdfwxhkdwihjobpny` cấm đọc/ghi. Không Auth/Edge/SQL/Vercel/main mutation trong BP1. Snapshot staging22/10 chỉ là lịch sử, không giả live readback hôm nay.

## Phát hiện có thể xử lý trước chạy

### BP1-CORS-01 — mismatch header của browser SDK, chặn source readiness

[`menuImageHttp.ts:8`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/supabase/functions/_shared/menuImageHttp.ts:8) thiếu `x-client-info` trong Access-Control-Allow-Headers. [`permissionMenuImagePort.ts:61`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/permissionMenuImagePort.ts:61) dùng `functions.invoke`; [`client.ts:21`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/src/adapters/supabase/client.ts:21) giữ header SDK. Lock pin supabase-js/functions-js2.108.1. Exact SDK tag mặc định X-Client-Info và truyền global headers sang FunctionsClient. Local supabase-js2.112.3 không được dùng thay phiên bản locked để chứng minh.

Đây là **lỗi hợp đồng tĩnh đã xác nhận**, chưa phải đã tái hiện browser hosted. [`T09:14`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/permissionImagesRuntime.contract.test.ts:14) tự dựng headers qua Node fetch, không SDK hoặc browser OPTIONS. PASS T09 hiện tại không đóng finding này.

Sửa nhỏ nhất: thêm đúng `x-client-info` vào shared allow-list; giữ SDK, dependency graph20, JWT flags, Storage privacy và các route. Không thêm `x-pos-permission-contract`: wrapper strip header này ngoài REST; gateway tự chèn khi gọi REST. Không tự thêm expose headers/cookie credentials vì chưa có nhu cầu sản phẩm.

Kiểm quyết định sau khi có quyền sửa/chạy: (1) header-set/OPTIONS với danh sách request thực tế của exact locked SDK + app wrapper; (2) browser hai origin phải đọc được actual response, kể cả response auth-denied không gây image mutation; (3) negative control bỏ x-client-info phải làm browser từ chối. Local header check chỉ chứng minh contract; browser Node fetch không thay được browser proof và local browser không chứng minh hosted deployment. Dùng dependencies/browser đã có đúng phiên bản trước khi cân nhắc cài; mọi tải mới vẫn phải kiểm dung lượng.

Nguồn công khai: [Supabase CORS](https://supabase.com/docs/guides/functions/cors), [constants SDK2.108.1](https://raw.githubusercontent.com/supabase/supabase-js/v2.108.1/packages/core/supabase-js/src/lib/constants.ts), [SupabaseClient SDK2.108.1](https://raw.githubusercontent.com/supabase/supabase-js/v2.108.1/packages/core/supabase-js/src/SupabaseClient.ts). Kết luận là suy luận contract từ source và tài liệu, không phải remote FAIL.

### BP1-CLEAN-01 — test bỏ kết quả đóng kết nối

[`permissionCanaryEmptyRuntime.contract.test.ts:408`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/permissionCanaryEmptyRuntime.contract.test.ts:408) await Promise.allSettled ba end() nhưng bỏ statuses. Phản ví dụ: mọi business assertion đạt, một end() reject, finally vẫn resolve; testcase có thể PASS dù việc đóng ba connection chưa được xác nhận. Race có kiểm rejection tại [`:552`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/supabase/permissionPinCompletionRace.spec.ts:552). Service chỉ đóng connection riêng tại [`permission-runtime-service.mjs:179`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-service.mjs:179).

Đây là lỗi báo cáo/cleanup của test đã có trước4f, **không phải bằng chứng product leak hoặc SQL sai**. Phân loại **NON-BLOCKING diagnostic/reporting** theo hợp đồng hiện tại: reclaim độc lập kiểm unit inactive/failed, cgroup không còn process, không mount/loop thuộc task; workflow luôn chạy reclaim và không bỏ qua lỗi. Xem [`reclaim:19`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-service-reclaim.mjs:19), [`:64`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/scripts/permission-runtime-service-reclaim.mjs:64), [`workflow:152`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/.github/workflows/backend.yml:152). Reclaim không chứng minh từng end() đã resolve, nhưng ngăn suy rằng việc nuốt rejection tự làm whole-environment cleanup PASS sai. Không thêm yêu cầu từng close thành merge gate mới.

Sửa đề xuất: vẫn gọi đủ ba end(), đọc kết quả và buộc failure nếu bất kỳ close bị reject; giữ mã lỗi tĩnh không in credential/error raw. Không làm mất thông tin business failure trước đó. Kiểm quyết định hữu hạn bằng injected closer resolve/reject: mỗi closer đều được gọi; reject ở bất kỳ vị trí không thể cho testcase PASS; trường hợp business failure + cleanup failure vẫn giữ cả hai trạng thái an toàn. Không cần DB thật chỉ để kiểm nhánh điều khiển cleanup này. Cách trích helper/test cụ thể phải giữ ít file và được review trước khi viết.

### BP1-IMG-01 — TC45/46/47 chưa đủ bằng chứng để nhận toàn yêu cầu

[TC45](../../../openspec/changes/redesign-permission-model/testplan.md#tc-perm-45--storage-http-bypass-và-biên-ảnh) tại testplan:1308–1334 và [TC47](../../../openspec/changes/redesign-permission-model/testplan.md#tc-perm-47--lỗi-storage-và-cleanup-không-công-bố-hoặc-xóa-nhầm-ảnh) tại:1360–1386 yêu cầu HTTP bypass, biên5MiB/MIME, authority/JWT, lỗi/cleanup và cache/UI variant. REQUIRED mapping [`:3939`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/permissions/permissionAggregateCases.json:3939) và [`:4023`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/permissions/permissionAggregateCases.json:4023) chủ yếu nối mocked adapter tests, hai DOM unit tests và một T09 runtime.

T09 có bằng chứng hữu ích: private staging, publish/unpublish,304, revoked-before-finalize, missing Storage503/no-store. Nhưng một owner PNG8byte không phát hiện server bỏ guard5MiB/MIME hoặc cho employee thiếu menu.manage upload. Adapter reject trước network không thay server bypass test. Các nhánh cần đóng:

| Yêu cầu hiện hữu | Chỗ thiếu hoặc chưa xác nhận trên candidate |
| --- | --- |
| TC45 direct Storage writes | Runtime mới có direct POST; chưa remove/update/copy và token variants |
| TC45 gateway boundary/authority | Chưa C thiếu menu.manage, 5.242.880/5.242.881byte, GIF qua HTTP, bad/expired JWT, employee revoked, caller path/upsert matrix |
| TC45 browser transport | Node fetch không kiểm actual SDK/browser preflight; xử lý cùng BP1-CORS-01 |
| TC46 revoke giữa stage/finalize | Runtime hiện dùng item mới; cần đối chứng A-old đang published, handle-ready không được publish sau deny |
| TC47 fault/cleanup | Có Storage-missing503; chưa đủ lookup RPC/DB fault, upload/cleanup failure, owned orphan và S2/published object preservation |
| TC47 cache/UI | Chưa current-source browser59/60/61s + uncached origin sau unlink, và image-error→order→payment variant |

**Không kết luận implementation hiện cho bypass hoặc xóa nhầm ảnh.** Đây là lỗ hổng oracle/evidence so với yêu cầu hiện hữu. Không nhận TC45/47 full PASS chỉ từ counts của T04. Giữ35/760/12; bổ sung assertion vào case/fixture hiện hữu hoặc source-bound recipe cần thiết, không giảm acceptance và không tạo bộ mirror chỉ để tăng số test.

Evidence lịch sử [source26](../../workflow/tasks/permission-close2-source26-tc47-2026-10-13.md) và [source31](../permission-close2-source31-2026-10-13.md) có TTL/UI/RPC fault. Chúng không mặc định là PASS4f. Chỉ tái dùng component evidence nếu gate cho phép và chứng minh đủ source/component/config/environment binding; nếu không, replay phần ảnh hưởng trong runtime cách ly. [12 supplemental obligations](../../workflow/tasks/permission-delivery-r0-r1-2026-10-19.md) thuộc PIN, không tự đóng ảnh. Chưa thêm hosted supplemental thành merge gate mới.

Đối chứng reuse: public Edge file hiện có SHA256 `65111eb092aa247413389631c2a862c8404a73774f9d6bee0d74f81c9587cf3e`, khớp component TTLsource26→31 đã được [SEC/EVC review](../../reviews/2026-10-13-permission-close2-source31.md). Đây là tiền lệ dùng lại một component, không bắt đo lại chỉ vì SHA commit khác. Shared helper cũng khớp raw file cũ theo audit; lock/client/UI khác raw hashes, chưa phân loại khác biệt semantic hay EOL và chưa có current closure receipt. Bước chuẩn bị tiếp theo là một bảng old receipt/recipe→component/dependency/config/SQL/UI→unchanged/affected→disposition. Chỉ replay phần chưa đủ binding hoặc bị ảnh hưởng, không đổi fingerprint của receipt cũ.

T09 hiện có testTimeout30s tại [`vitest.permission-images-runtime.config.ts:2`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/vitest.permission-images-runtime.config.ts:2). TTL thực59/60/61s không fit một testcase30s; không nhét vào hook, fake timer thay HTTP, hoặc tự tăng timeout. Thiết kế closure phải dùng measurement recipe hữu hạn được review/admit với fixture và whole-profile execution window hiện hành; nếu chưa có route thì giữ gap mở. Không đưa fault injection vào staging.

### BP1-PIN-07 — fault oracle chưa đối chiếu toàn snapshot

[`ownerPinServerRuntime.contract.test.ts:334`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:334) và [`:366`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:366) kiểm crypt(oldPIN), flag/revision, live-session count và counts evidence sau complete/recovery fault ở audit/signal/registry. Các kiểm này không tương đương toàn snapshot PIN hash và session rows mà TC-PIN-07 yêu cầu tại [`testplan:78`](../../../openspec/changes/force-default-pin-change/testplan.md:78).

Phản ví dụ tĩnh: lỗi đường rollback đổi issued_at/expires_at cùng+60s, giữ token/purpose/count; các assertion trên vẫn có thể đạt. Rehash cùng PIN với salt khác cũng vẫn crypt-match dù hash đã đổi. TC18 có full snapshot cho audit-fault, không tự đóng signal/registry fault targets. Đây là **oracle/evidence gap đã có trước4f**, chưa tìm thấy SQL product defect.

Sửa đề xuất trong cùng các fault cases: snapshot chính xác employee hash/flag/revision, toàn session rows/TTL/revoked fields và evidence trước mỗi injected fault; so unchanged sau lỗi, rồi giữ retry thành công và rollback/fixture cleanup. Tái dùng [`capturePinDenialBaseline():44`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:44) và [`pinDenialSnapshot():54`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:54): giữ raw snapshot trong PostgreSQL, chỉ trả boolean equality/count, không log hash/token/raw state. Negative control phải chứng minh same-count TTL/token-field mutation hoặc rehash-same-PIN bị bắt. Giữ required identities; không tạo suite mirror. Chưa viết hoặc chạy phép kiểm này.

Cùng TC07, ba employee-seed fault variants tại [`serverRuntime:387`](D:/Workspace/pos-cafe-permission-timeonly-20261022/code/tests/contracts/ownerPinServerRuntime.contract.test.ts:387) chưa bỏ fault và thực hiện explicit retry trong từng variant trước fixture rollback:411, khác bước4 testplan. Menu/floor variants có retry tại:452. Thêm bỏ fault→explicit retry→kiểm prior-stage không reapply trong cùng case employee hiện hữu; chưa kết luận implementation retry bị lỗi.

### BP1-HOST-01 — recipe cũ không tiếp tục được nguyên trạng

[`staging-auth-rpc-consumer01.mjs:8`](D:/Workspace/pos-cafe-permission-timeonly-20261022/operations/staging-auth-rpc-consumer01.mjs:8) pin source ad265;:12–13 ngày22/10;:129 grant cũ. Recipe Auth loại Edge/images, G0 yêu cầu counts0; consumer:309–324 revoke/logout và bỏ credentials. Vì vậy không thể chạy Auth xong rồi nối image bằng identity ngầm giữ lại, replay trên staging có TEST hoặc gọi Node53slots là quota đủ cho browser SDK/refresh/OPTIONS.

Recipe mới phải chọn trước: chuỗi Auth→image dùng chung custody và final revoke, hoặc hai cửa sổ với re-auth/re-pair đúng TEST IDs được cho phép. Cần menu fixture cho publish/public/unpublish. Ghi riêng external consumer requests và Edge→Auth/RPC/Storage; tính lại cửa sổ, quota và margin. Upload/mark-ready hoặc registry-discard/Storage-remove có thể có partial effects; quan sát owned handles/object IDs cả khi mất ACK. Fault injection thuộc backend synthetic, không đưa vào staging. Deploy graph/payload/transport20, JWT mode và postdeploy digest vẫn cần proof riêng. Lượt BP1 không chọn hộ các quyết định dữ liệu/quyền này.

## Phạm vi code đã rà và giới hạn

Ba agent độc lập chỉ đọc: `/root/bp1_t04_code_audit`, `/root/bp1_pin_code_audit`, `/root/bp1_hosted_cors_audit`. Root đối chiếu finding vào source và yêu cầu. “Đã lần theo” dưới đây không có nghĩa mọi dòng/variant đã được chứng minh đúng. Mọi backend runtime của4f vẫn NOT_RUN.

| Profile / stage groups | Required | Chuỗi trọng yếu đã đọc | Phần còn mở |
| --- | ---: | --- | --- |
| SUPABASE_T04 /19stage | 291 | Identity/admin/read/clear-demo/signals/financial/print/bulk→production ports→candidate SQL; E2E/roles/realtime, seed recovery, rollback/transition; collector exact identities/source/config và fixture boundaries | ẢnhTC45/46/47 ở trên; không claim full semantic review của mọi variant từ một bảng mapping |
| PIN_ONBOARD /closeout+TC18wrapper | 55 | App gate→memory credential→adapter→identity/seed SQL; generic/operator real IDB reader; nested-value negative control, finally delete and clean reread | TC04/07/17 có slice bổ sung bên dưới; TC10/15/16 và mọi exact-error trigger TC18 chưa đọc hết |
| SUPABASE_T02 /3stage | 17 | Foundation1280/core and bridge6144 oracle, grants, REST v1/pending K; migration017 và runtime fixture cleanup | Toàn bộ bridge SQL/REST assertions chưa review hết |
| PIN_RACE /1stage | 2 | Hai lock orders, actual wait graph, pre-MVCC unchanged, winner/loser snapshots, old-token replay, close-error handling | Helper graph chưa đọc toàn bộ; runtime thật cần mới |
| PIN_EXPIRY /1stage | 1 | DB clock độc lập browser, exact expiry denial/no replay, fresh restricted session, catalog-clock restoration và cleanup errors | Runtime exact ordering/restore chưa được chứng minh hôm nay |
| PIN_IDENTITY_SERVER /1stage | 41 | Identity complete lock+reread/TTL/revoke/atomic audit-receipt; recovery transitions, bootstrap/seed fixtures and catalog/ACL restoration | BP1-PIN-07; concurrency/fault variants còn một phần, không blanket approve |
| PIN_IDENTITY_ONBOARDING /1stage | 9 | T04 identity engine; seed lostACK/reload, fixture and service binding | Create/Key boundary assertions chưa đọc hết; không giả có sáu Storage service |
| PIN_CANARY /1stage | 1 | Empty-only activation/schema lock, unrelated66Auth/Storage preservation, new owner300s restricted, sink negative control | BP1-CLEAN-01; activation dependency closure chưa review đủ |
| Auth/Edge hosted | Không thay counts | Production SDK/adapter→gateway/public→Auth/RPC/private Storage; config/custody/partial effects | Live state/provider/session, transport graph/deploy, browser and request-budget proof chưa chạy |

29backendstage/417required cộng LIGHT6/343 thành35/760. Đây là catalog counts, không phải số test BP1 chạy. Bảy service execution envelopes gồm PIN_ONBOARD, T02, PIN_RACE, PIN_EXPIRY, PIN_IDENTITY_SERVER, PIN_IDENTITY_ONBOARDING, PIN_CANARY; logical runtimeProfile groups trong baseline không được dùng thay execution envelopes.

IDB Blob/ArrayBuffer được ghi nhận là robustness suggestion: oracle/serializer có thể không đọc opaque payload, nhưng chưa xác minh serializer thực, không thấy app tự ghi PIN vào browser storage và chưa có requirement riêng cho những kiểu này. Không dùng giả thuyết này làm blocker mới hoặc mở thêm acceptance. Delta4f real IDB reader/control đã được đọc; chưa tìm blocker mới trong delta.

Slice bổ sung TC04/07/17: malformed payload server và UI unit, unchanged denial baseline, weak PIN000000/111111 và normal self/admin PIN đã được đọc. Không có lỗi thiếu session revoke khi PIN hash đổi: trigger migration014 thực hiện revoke. TC07 phát hiện gap snapshot ở trên. Phạm vi đã đọc không thay runtime; các phần TC10/15/16/T02/activation chưa hoàn tất vẫn được ghi mở.

## Breakpoint tiếp theo và điều kiện chuyển

Phạm vi sửa tối thiểu đã xác định để tác giả tiếp theo không dò lại từ đầu:

| Slice | Files hiện hữu / phép kiểm | Mức sẵn sàng của thiết kế |
| --- | --- | --- |
| CORS | `supabase/functions/_shared/menuImageHttp.ts`; mở rộng `src/adapters/supabase/menuImageHttp.test.ts`, `client.test.ts` và adapter tests khi cần | Một header; cheap contract control rõ. Browser exact SDK kiểm riêng; không cài/thay graph ngầm |
| PIN07 | `tests/contracts/ownerPinServerRuntime.contract.test.ts`: dùng helper44/54 cho complete/recovery và thêm retry employee-seed | Đường snapshot/retry đã có; preserve names/counts và không in raw secret |
| Ảnh ngắn trong T04 | `permissionImagesRuntime.contract.test.ts`, `permissionImagesFixture.ts` và browser `permissionCandidate.spec.ts` | Dùng object có thật cho direct denial; published A-old/S2 controls, bounded auth/file/method matrix, exact ACL restoration. Theo dõi30s/45s timeout hiện hành, không thêm tình huống vô hạn |
| Ảnh TTL/fault/UI | Historical recipe logic, gắn source/config/fixture hiện hành | Chưa chốt điểm nối nhỏ trong whole T04 window; upload/cleanup fault injector chưa đủ thiết kế/restore proof. Giữ OPEN, không tự tạo framework mới hoặc bypass hook timeout |
| Cleanup per-client | `permissionCanaryEmptyRuntime.contract.test.ts` | Optional diagnostic fix, không chặn heavy chỉ vì chưa làm |

Không phải mọi ý tưởng trong bảng đã thành execution-ready packet. Phần OPEN phải được chuẩn bị/review trước action phụ thuộc; không thể dùng APPROVE hồ sơ khảo sát này làm APPROVE một injector hoặc lệnh runtime chưa được viết.

1. **BP1A — findings/plan:** chốt hồ sơ này sau hai independent review. Kết quả là inventory và kế hoạch sửa, không là APPROVE source4f để chạy heavy. Review còn thiếu ghi rõ để tiếp tục đúng TC, không lặp đọc toàn repo.
2. **BP1B — hoàn tất slice review còn mở và chuẩn bị execution packet:** ưu tiên TC04/07/10/15/16/17, T02 và activation closure; chốt đường assertion/fixture của ảnh. Mỗi slice có phạm vi và kết luận, không kéo một cuộc review vô hạn. Không chạy source mutation/runtime từ hồ sơ này.
3. **BP2 — sửa/kiểm nhỏ sau quyền mới:** gom các thay đổi source bắt buộc trước freeze: CORS, PIN07 snapshot và closure ảnh giữ yêu cầu gốc; cleanup reporting là cải thiện không chặn, không trì hoãn runtime chỉ vì thiếu cải thiện này. Chốt exact files, cheap decisive tests/controls, hai review final candidate rồi mới xin/tiêu candidate publication+CI nếu cần. Không push code còn known blocking error. Source đổi thì CI03 là lịch sử của4f, không là PASS nguồn mới.
4. **BP3 — admission và thực thi từng phần sau grant riêng:** backend synthetic và hosted preparation độc lập. Trước mỗi action kiểm grant/guard/live source/disk, mapping12/34contexts/149selectors và producer→collector→settler, không chỉ tên preflight. Giữ T04 trước bảy whole profiles, terminal→collect/oracles→reclaim→settle/pending[] trước profile sau. Không hỏi lặp nếu một grant đã đủ phạm vi và điều kiện còn đúng.
5. **BP4 — join/release:** chỉ push main khi đủ full gate, final review và quyền PR/mainCI còn hiệu lực; kiểm mainCI/merge tree rồi xóa task branches đã merge. Không Vercel/DB gốc. Hosted-first chỉ là tối ưu có điều kiện trong kế hoạch, không tự thêm một gate mới hoặc chờ Edge vô hạn.

Ngân sách và hard window thực thi sẽ chốt sau BP1 theo lựa chọn owner. Giữ mọi spent/history; không dùng năm heavy/hai CI hoãn của phase cũ thành quyền mới. Không cam kết hoàn tất bằng một thời lượng test ngắn:8jobs có thể dùng tối đa280phút job-time, ngoài queue/CI/collect/review và reserve42phút. Có thể dừng ở bất kỳ breakpoint với source/evidence/owned state đã ghi; không cần cố chạy hết một lần.

## Kiểm soát công việc và bàn giao

BP1 không install, browser automation, test fixture, DB/network consumer hoặc temp cleanup. C/D tại checkpoint khoảng191,3GB/98,5GB trống; chỉ thêm hồ sơ nhỏ. Không đổi guard, budget ledger, code, SQL hoặc dữ liệu để làm review xanh. Không tạo WSL/Docker hoặc mirror environment. Baseline và tài liệu này là bằng chứng cần giữ, không là temp để tự xóa.

Nguyên nhân có thể tránh của các lượt kéo dài hiện rõ hơn: review delta/mapping chưa phủ mọi production path của TC; browser transport khác Node runtime; oracle/cleanup có thể cho kết luận thiếu; helper pin source/window cũ làm continuation không dùng lại được. Sửa ở BP2 trước freeze và chuẩn bị recipe/collector trước runtime giúp giảm rủi ro chạy nặng xong mới đổi source. Không bảo đảm loại hết lỗi runtime.

Đường đọc giải thích cho chủ dự án: TC45 requirement→adapter invoke→shared CORS→T09 headers; TC47 requirement→fault/cache assertions; TC19 finally→cleanup result→service reclaim. Walkthrough đã được chuẩn bị, chưa nhận là owner đã đọc hoặc nghiệm thu. Metadata review cuối lưu riêng; không sửa lại lịch sử kết quả cũ.
