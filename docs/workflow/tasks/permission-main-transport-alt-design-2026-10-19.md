# Thiết kế transport khác GPG và đối chiếu operator offline — 19/10/2026

Candidate thiết kế, trạng thái review hiện hành tại [biên bản đợt P/R/D0](permission-main-prd-initial-review-2026-10-19.md). Nguồn giao việc/launch và human turn/item tại [live registry](permission-main-prd-launch-2026-10-19.md). User giao thiết kế adapter khác GPG để review, đối chiếu operator offline; không giao chọn key/trust thực, cài tool hoặc crypto thật. GPG2FAIL/STOP/additional0 giữ nguyên. Tài liệu này là design/spec trên docs, không phải operator guide đã ship với code.

## Mục tiêu và căn cứ

Đề xuất AGE_AUTO: dùng age CLI v1.3.2 được pin làm lớp mã hóa opaque closed archive; receiver local kiểm origin, ciphertext, giải mã vào RAM, kiểm toàn bộ archive/member closure rồi mới ghi privateC. AGE_OPERATOR dùng cùng ciphertext và cùng verifier/ACK, nhưng operator tự thao tác phần mở trong guard được duyệt. Không dùng lời người thao tác thay proof. Cả hai là proposal, actual NOT_RUN; chưa tạo adapter hoặc data/key.

Đầu vào địa phương: reviewed A01 model/receiver (98pure tests, synthetic và authNOT_PROVEN), A interface/diagnosis/bounds; B03 budget/provision (24pure tests, UNKNOWN→STOP); L02 provenance (19pure tests). Các hash tại [source-inputs PRD](D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-prd-prep-review01/source-inputs.json). Source567 [custody:3](D:/Workspace/pos-cafe-full-runner-20261018/scripts/permission-full-custody.mjs:3) nói rõ future adapters phải tự lấy authenticated GitHub responses/local verified decryption, không cấp filesystem permission hoặc download/decrypt/POST/delete. Existing A model hash conventions không được nhận là actual archive format.

Safe summary [A18-04](permission-merge-hp1-alternative-2026-10-18.md) giữ plaintext trong RAM đến sau authentication/binding/archive verification; design này giữ yêu cầu đó. Chưa đọc/nhập11WIP, raw HP1/private report/env/key hoặc cipher cũ. Không giả private path guard/actual archive verifier đã có trong runner567: chúng là dependency D1 cần source/pin/review và actual compatibility. Adapter không phát minh manifest/archive/closure format mới hoặc dùng JSON model thay format thật.

Nguồn ngoài đã đọc ngày19/10/2026, đều primary:

- [README age v1.3.2](https://github.com/FiloSottile/age/blob/v1.3.2/README.md): native recipient/identity, CLI streams, predefined binary và default overwrite output; không dùng shell string hay ghi outputpath có sẵn.
- [Đặc tả ổn định age v1.1.0](https://c2sp.org/age@v1.1.0): file header/MAC, native X25519,16B payload nonce,64KiB chunks và final authentication. Design dùng implementation upstream, không tự viết crypto.
- [Release v1.3.2](https://github.com/FiloSottile/age/releases/tag/v1.3.2): hardening, headers/recipients limits và binary compatibility plugins. Đây là candidate version tại ngày khảo sát, không dùng latest khi thực thi sau.
- [GitHub artifact REST](https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28): artifact ID/digest/size/expiry/workflow-run metadata và download redirect. Response digest là của artifact container, không tự là inner cipher hash.
- [GitHub artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations): provenance là cơ chế riêng, cần workflow permissions và có hạn chế plan/repo visibility. Không coi việc feature tồn tại là đã enabled ở repo này.

Suy luận thiết kế: ai có public recipient cũng có thể tạo ciphertext hợp lệ cho recipient đó. Vì vậy decrypt thành công chứng minh tính toàn vẹn theo file key, chưa chứng minh người gửi/nguồn CI. Origin phải được kiểm độc lập; kết luận này không đến từ một actual crypto test.

## Lựa chọn và các điểm chưa quyết định thay owner

| Phương án | Lợi ích | Chi phí/giới hạn | Đánh giá thiết kế |
|---|---|---|---|
| AGE_AUTO, native X25519 | Tách khỏi GPG agent/pinentry; workflow chỉ có public recipient, receiver giữ private identity local | Cần toolchain pin, human xác nhận recipient/trust, guard và RAM verifier thật; chưa có size/peak toàn đường | Đề xuất ưu tiên để đóng đường tự động sau khi đủ điều kiện |
| AGE_OPERATOR offline | Operator có thể dùng identity có tương tác mà agent không truy cập; không tự probe key | Vẫn cần tool/guard, output-source binding và actual closure verifier; phải giữ plaintext RAM tới verified checks, GUI giải nén thẳng ra folder không đạt | Phương án đối chiếu; không là fallback tự động sau lỗi |
| GPG lại | Dùng đường cũ | Đã2actualFAIL/STOP, không được thử lần3 hoặc nhờ operator làm thay mà coi là ngoài counter | Ngoài grant hiện hành |

Native X25519 là cấu hình proposal hẹp để đơn giản hóa adapter; không tuyên bố chống lượng tử. Nếu owner yêu cầu hybrid PQ, phải đổi design/pins/bounds/test trước actual; không trộn recipient types hoặc key mới vào một gói đã freeze. Không dùng SSH recipient/profile keys tự tra từGitHub, plugins/hardware, scrypt/passphrase hoặc agent fallback trong AGE_AUTO. Identity/recipient thực chưa chọn; không generate/export/read/reprotect/chmod/chown bất kỳ key nào.

Trust binding đề xuất nằm trong input recipe ngoài custody17fields: tool digest/version/platform và provenance do owner chấp nhận; đúng một public recipient cùng SHA256 của bytes canonical, recipient source/owner approval; private identity reference được guard local nhưng không serialize secret/path nhạy cảm vào safe report. AGE_AUTO chỉ nhận một native X25519 identity đã được provider kiểm và gắn đúng public recipient; không nhận identity/plugin/SSH/hardware/multiple-key tự động hoặc truyền environment có thể mở plugin fallback. AGE_OPERATOR có thể đề xuất native identity được bảo vệ bằng passphrase, nhưng kiểu/provider và thao tác cụ thể cần review/grant riêng; không mở arbitrary plugin qua chữ offline. Không suy existing GPG identity tương thích age. Nếu cần tạo identity hoặc thay ACL, phải trình exact riêng và đợi user; grant thiết kế/pure không bao các thao tác đó.

## Input/output của future adapter

Không sửa17custodyfields: repository, repositoryId, runId, attempt, sourceSha, profile, nonce, permissionFingerprint, lockSha256, recipeSha256, artifactId, cipherSha256, cipherBytes, archiveSha256, manifestSha256, closureSha256, closedAt. Dùng nguyên custodyAckDescriptor/verifyCustodyAck, repositoryId1263057386, ownerId54500418/typeUser và latest-context case-insensitive/exactSHA/query-complete/time checks. Workflow runId decimal và stageExecutionRunId UUID vẫn có namespace riêng theo [kế hoạch D](permission-main-prd-integration-d-2026-10-19.md).

| Input/record | Kiểu và điều kiện trước future actual |
|---|---|
| source/recipe descriptor | Exact final source40hex/tree/fingerprint64hex, config/lock/recipe/manifest/closure hashes64hex; reviewed clean source hoặc recoverable snapshot đầy đủ |
| closedArchive descriptor | Existing exact format/packager/verifier version+source hashes, archiveBytes safe integer>0, archiveSHA256, member manifest/closure, max expanded bytes/member count/path constraints. Opaque bytes cho crypto layer, không tự tạo format mới |
| tool descriptor | Version đúng1.3.2/platform và binary/archive hash đã pin; no arbitrary executable/argv override; exact installed binary+parent ownership/integrity readbacks. Hiện chưa installed/verified |
| origin descriptor | Repo/run/attempt/headsha/workflow ID+path/recipe hash+artifactId+API container digest/size/expiry và completeness; trusted GitHub responses/provenance, không caller-claimed authentication |
| key reference | Human-approved recipient pin và local private guard provider; missing/unconfirmed=STOP; secret không nằm JSON/report/argv/stdout. Path/reference không tự cấp quyền mở file |
| budget/admission | Bound tool/source/outerZIP/cipher/archive/expanded/privateC/RAM/log/status/retention/failure/time và physical placement; actual permission+enforcement đủ. Cipher≤268435456B vẫn chỉ là custody cap |

Actual output về sau phải có verified safe receipts của từng bước và commitment theo custody; chưa có trong đợt này. Design report chỉ PLAN_ONLY/NOT_RUN/authNOT_PROVEN/validfalse/cleanupfalse, mọi maximum chưa chứng minh là null+UNKNOWN. API wrapper trước actual cần exact schema/finite TRANSPORT_* errors, duplicate keys/type/enum/path/hash/overflow checks và reject object/getter/proxy trước access theo chuẩn pure đã review.

## Luồng AGE_AUTO đề xuất

1. **Admit và close:** xác minh scope/source/recipe, guard, tool và recipient trust; freeze archive format+member closure từ packager đúng source. Không self-reference: ciphertext hash/artifactId tạo sau, không chèn ngược chúng vào bytes archive đã hash. Dependency packager/format chưa đóng thì STOP, không lấy A model schema làm bằng chứng.
2. **Seal:** future adapter gọi pinned CLI bằng argv array, public recipient duy nhất; plaintext qua stdin, ciphertext stdout vào writer độc quyền có byte cap/ownership/nonce. Không shell, TTY, auto plugin hoặc command fallback. Không dùng CLI outputpath mặc định overwrite file đã có. Nonzero/timeout/prompt/partial/write cap → partial safe receipt và STOP, không publish success.
3. **Upload/fetch:** chỉ ciphertext và safe descriptor; không upload plaintext/raw report/env/trace. Pin run/attempt/source/artifact; nhận outer artifact ZIP vềD theo budget; verify API container digest/size/expiry/origin trước đọc payload. ZIP chỉ cho exactcipher entry/safe metadata theo reviewed closure, không traversal/ADS/reparse/link/extra/duplicate/case alias. Innercipher SHA256/bytes phải đúng custody binding, không so nhầm với digest của ZIP.
4. **Open trong RAM:** xác minh ciphertext/origin/tool/recipient/private guard trước key use. Pinned CLI stdout là bounded RAM buffer, stderr chỉ finite safe diagnostic, tuyệt đối không temp stdout file/TTY/report. Decryptor có thể phát chunk trước final authentication; wrapper không consume/parse/extract/ghi plaintext từ chunk đó. Chờ child exit0+EOF/final authentication, expected archive length/hash và toàn bộ existing format/member closure checks trongRAM. Truncated/tamper/wrongidentity/prompt/finaltag missing/limit overflow →STOP, không tạo plaintext file.
5. **Private write/readback:** chỉ sau tất cả checks trên, sử dụng exact guard provider đã review để ghi exclusive privateC, không reparse/ancestor escape/alias; byte hashes/closure thực trước-sau phải khớp. Không tự sửa ACL để ghi được. Current runner chưa có provider/verifier actual đã được chứng minh; future action cần explicit compatibility/purity/source review và budget đủ.
6. **ACK/retention:** receiver tạo authenticated owner ACK sau verified private readback; producer query exactSHA/paginate complete/repository and latestowner context/time/binding. Không chấp nhận commitgreen, oldsuccess hoặc human “đã mở”. Chỉ đánh cleanupeligible sau ACK+retention evidence; actual delete vẫn cần exactscopegrant/processreleased, không tự xóa hoặc prune. Fail/cancel/platformteardown không thành PASS.

Origin tối thiểu đề xuất dùng authenticated GitHub metadata/TLS, expected repository/head run/attempt/workflow pin và actual artifact digest; trust model này cần review với workflow/credential permissions ở D1. Nếu dùng signed artifact attestation, xác minh signer/workflow/source predicate+subject digest chứ không chỉ attestation tồn tại; eligibility repo/plan và tools hiện UNKNOWN. Không bật public logs/attestation field có raw private data. Không thêm attestation vào acceptance hiện hành chỉ để tạo blocker; không âm thầm coi API digest là chữ ký sender. Nếu trust model tối thiểu không đáp ứng yêu cầu nguồn đã chốt thì STOP và trình lựa chọn cụ thể.

## AGE_OPERATOR và kiểm độc lập

Operator lấy đúng ciphertext/source/recipe/receipt đã kiểm origin theo cùng bước3, dùng tool+identity được họ chấp thuận qua private RAM wrapper; không gửi key/passphrase hoặc plaintext về chat. Agent không gọi GPG hộ hoặc điều khiển hộ UI key. Operator thao tác trong offline phase sau khi đã có trusted metadata và tools; không tự download khi đang mở dữ liệu. Nếu công cụ thao tác ghi plaintext trực tiếp ra file trước authentication/closure, không dùng phương án đó.

Operator handoff chỉ gồm safe action outcome và sealed invocation receipt/tool hash/cipher hash/source binding; receiver verifier vẫn phải trực tiếp kiểm archive và member bytes/closure trongRAM, guard private write/readback, sau đó owner ACK thật qua đúng API. Chữ “offline” không thay receipt hoặc làm callback của operator thành authenticated owner status. Online origin/ACK có thể do receiver phase được giao riêng thực hiện; thiếu permission/network hoặc receipt thì giữ STOP. Manual path không giải quyết tự động tool budget/identity trust/guard chưa có.

## Budget, công cụ và lifetime phải đóng trước actual

[Release metadata receipt](D:/Workspace/pos-cafe-ci-main/artifacts/permission-main-prd-launch01/transport-release-metadata.json) là các field công khai đã chọn từ GitHub release API, đã đọc31,091B vào RAM, không download binary/proof. Raw response hash chỉ thông tin lần đọc, không thay raw response recoverable; selected fields thực dùng đã lưu nguyên trong receipt và sẽ snapshot cho review. Versionv1.3.2 published2026-08-29, assets:

| Asset | Transfer bytes | SHA256 theo metadata upstream |
|---|---:|---|
| linux-amd64.tar.gz | 19405817 | cbe24006683f8eb669266162894b9a522a1af52f2665fbc63a4bb032ed26ac10 |
| windows-amd64.zip | 20250704 | f48d8f8f9ebe903ab5027ed067652f2cc1db94bc206976430133b905dcd8e8c7 |
| linux proof / windows proof | 1921 mỗi asset | 98402fa59b4e433426156b4a7e74a32e44902e0434c61158f7de18ffc84f1f97 / 00ae35a24a47b9bace52ec62f06d402f38f6ecba4ca099d060a137e82ef0bc1d |

Nếu sau này được giao setup: mục đích dùng binary upstream pinned để seal trên Linux runtime và open trên Windows; proposed public tool root Windows trênD, Linux dưới owned loop. Exact paths/extraction/identity/trust và commands phải có recipe được review trước cài; không globalpackage manager/Go build hoặc copy runtime cho mỗi worktree. PATH discovery hiện không thấyage/rage/openssl, không chứng minh toàn máy vắng. Không chạy chúng, không cài bản trùng.

Tổng transfer hai archives+proof=39660363B, nhưng expanded/allocated maximum, peak unzip/copy/cache, verifier tooling dependencies và actual process RAM/time đềuUNKNOWN. Chưa có căn cứ khẳng định tổng install/peak dưới1GB. Đây chưa phải thông báo cho phép install. Không download/extract để “xem có vừa”; D phải đưa cách xác minh maxima hoặc phép đo có cap đủ ngân sách trước khi xin actual. Nếu estimate tương lai vượt1,000,000,000B thì ghi nổi bật LỚN HƠN1GB trước thao tác. Không dùng metadata compressed sum thành upper bound cài đặt.

Bound toán học đề xuất cho envelope crypto, chưa là benchmark hoặc admission: với archiveAbytes, nativeX25519 binaryheaderH≤4096B được future adapter kiểm độc lập, C≤A+4096+16+16×max(1,ceil(A/65536)). Đây là suy luận từ age chunk format/tag; headercap là design limit mới cho cấu hình hẹp, cần compatibility check trên pinnedversion trước dùng. Armor/multiple recipient/plugin/PQ thuộc recipe khác nên không dùng công thức đó. Không cắt archive/evidence để fit custodyC≤268435456B; không fit thì STOP. A bytes và expanded member maximum vẫn do P/R/D packager cung cấp.

Writer ledger bổ sung cần explicit mapping:

- Transfer/archive/tool extraction/cache/proof-verifier của Linux và Windows, current source/worktree/control, binary process RAM/temp/stdout/stderr/time. B03 chưa có row riêng cho transport tool; D1 phải đề xuất catalog extension hoặc mapping có chứng cứ bao đủ maxima+đúngowner, review cùng source mới. D0 hiện giữ đủ134rows, không âm thầm đổi catalog hoặc khai writer mới=0.
- Outer artifact ZIP trênD và inner ciphertextD là hai allocation có overlap, không đồng nhất digest/bytes; downloadbuffer/partial/retry và giữ bản cũ đến ACK/retention phải tính. ZIP chứa chỉciphertext/safe metadata; archive/plaintext không vàoD.
- Decrypted archive RAM, decompression/parser/member expanded memory, CLI/pipe buffers và process ceiling; không giữ thêm bảncopy ngoài ledger. Chưa có max expanded/memory thì STOP trước open. Current pure trial không tạo archive, private folder hoặc identity.
- PrivateC full verified output+manifest/closure/readback, receiver log/status safe, ACK query receipts/controller/globalretention/failure/cancel và last verified copy. Không lấy planned delete credit, không coi stopdaemon là thu hồi ổ.

Giữ global20GiB/reserve30GiBC+physicalruntime, mộtheavyenvironment, loop18+outside2GiB chỉ phương án chưaquotaOS; runtime resource/time1800s theo policy hiện hành. Bổ sung transport không cấp quyền tăng cap/đổi privacy/ACL hoặc bỏ stage. D2 chưa có globalretained/placement/time fit nên actual vẫnSTOP.

## Verification plan / traceability

Finite error codes đề xuất của adapter: TRANSPORT_INPUT_INVALID, TRANSPORT_TOOL_UNVERIFIED, TRANSPORT_RECIPIENT_UNTRUSTED, TRANSPORT_ORIGIN_UNVERIFIED, TRANSPORT_SOURCE_MISMATCH, TRANSPORT_BUDGET_STOP, TRANSPORT_CIPHER_MISMATCH, TRANSPORT_DECRYPT_FAILED, TRANSPORT_ARCHIVE_MISMATCH, TRANSPORT_MEMBER_CLOSURE_MISMATCH, TRANSPORT_PRIVATE_GUARD_REFUSED, TRANSPORT_ACK_UNVERIFIED, TRANSPORT_RETENTION_UNVERIFIED. Bảng dưới bỏ prefix TRANSPORT_ để dễ đọc. Không echo stderr/rawpaths/secret. Đây là error namespace công cụ mới, không AppErrorCode/UI mới.

| Requirement | Đối chứng quyết định | Expected / evidence tương lai |
|---|---|---|
| R-ORIGIN | Cipher hợp lệ nhưng wrongrepo/run/attempt/source/workflow hoặc không có trustedAPI/provenance | ORIGIN_UNVERIFIED, không gọi key/decrypt hoặc ACK; publicrecipient không tự xác thực sender |
| R-TOOL-KEY | Wrongbinary/version/hash/parentguard/recipient pin; encryptedidentity đòi prompt trongAUTO | TOOL_UNVERIFIED/RECIPIENT_UNTRUSTED/DECRYPT_FAILED, không fallback/agent/ACL/keychange |
| R-CIPHER | WrongAPIcontainerdigest dùinnercipherkhớp; hoặc ZIPđúng/innercipher sai/extra/pathalias/truncated | CIPHER_MISMATCH, no plaintextwrite, không lẫn hai hashdomains |
| R-AUTH-BEFORE-WRITE | Badfinaltag/EOF/nonzerochild; child đã emit plaintext chunk rồi fail | DECRYPT_FAILED, plaintext file creations0, logs chỉsafeerror; RAMpartial không được consume |
| R-CLOSURE | Samecounts/differentbytes, duplicate/extra/missing/traversal/ADS/link/membertree/casealias, decompressionbomb | ARCHIVE_MISMATCH/MEMBER_CLOSURE_MISMATCH, verify hoàn toàn trongRAM trước privatewrite |
| R-PRIVATE | Guard refused/ancestor/reparse/owner/nonce mismatch hoặc API muốn ghiDplaintext | PRIVATE_GUARD_REFUSED, không tự sửaACL hay fallbackpath |
| R-ACK | Oldsuccess/newfailure, wrongcreator/description/source/closedAt/queryincomplete/casealias | ACK_UNVERIFIED, cleanupfalse và retentiongiữ; dùng originalverifier |
| R-RETENTION | Fail/cancel/timeout, extra retained/outerzip/expandedRAM vượtcap hoặc plannedcleanupcredit | BUDGET_STOP/RETENTION_UNVERIFIED, missingproof không thànhPASS; no delete |
| R-OPERATOR | Operator báo “đã mở” nhưng missing actualmemberclosure hoặc unsafeplaintextfile | STOP và chưaACK; không chấp nhận lời báo như actualverifier |

Design chỉ được kiểm bằng primarysource/read-onlymetadata/compatibility và arithmetic; không viết crypto code, chạy cipher negative tests thật hoặc gọi GPG dưới tên “test”. Future implementation/pure negative models phải review exactsource. Future actual bounded roundtrip là gate khác: đề xuất sau tool/recipient/trust/guard/budget đủ, dùng synthetic nonsecret≤32KiB và≤8members, archive≤64KiB/cipher≤128KiB, ownedwritesC≤2MiB/D≤2MiB, safe receipts≤1MiB, duration≤60s; RAMmax phải đo/đóng riêng cho binary thực. Các cap nhỏ chỉ trial crypto, không thay full PIN/PERM output/coverage; chưa có grant để tạo fixture/key/tool hoặc chạy trial này.

## Điểm cần chốt và dependency còn mở

User đã giao hướng thiết kế khácGPG so operator; không hỏi lại hướng đó. Đề xuất ưu tiên AGE_AUTO ở bước review/implementation sau; AGE_OPERATOR chỉ lựa chọn nếu owner muốn tham gia, không fallback saufailedattempt. Cần concrete approval trước actual về: version/platform/tooltrust/install recipe có full growth/peak estimate; recipient ownership/publicpin/privateidentity action chính xác; origin trust/permissions và guardprovider/actual archive verifier/preservedformat. Nếu những facts này đọc được từ source/metadata thì root tự làm trước khi hỏi, không bắt user đoán bytes.

Các thiếu hụt kỹ thuật chưa biến thành câu hỏi owner ngay: P/R output/member/DB-WAL/time bounds, D1 clean tracked packager/verifier/guard portability, explicit mapping/catalog đầy đủ, actualglobalretained/storage/resource/time, workflowpermission/attestation eligibility, tool expanded maxima. Source/algorithm/identity chưa chọn choexecution; mọi quyền cài/key/ACL/crypto/DB/network upload/ACK/delete/merge giữ theo grant thật.

Walkthrough: tool/recipient/origin độc lập → closedopaquearchive → seal/cipherD → origin+fullauthRAM → archive/memberclosure → guardedprivateCreadback → ownerACK/retention. Owner chưa xác nhận đọc/nghiệm thu; reviewdesign không chứng minh runtime/fullgate. Đợt này chỉ thiết kế, selectedpublicmetadata và arithmetic receipt; không tạo temp hết nhu cầu để dọn. Hai web-provider opens (manpage và releaseAPI) trả InternalError: manpage không dùng làm evidence/khôngretry; releaseAPI đổi sang boundedJSONread cùng URL ở lần2 thành công, không requestlần3. Không coi webfetch lỗi là crypto/code/runtimeFAIL hoặc resetissuecounter.
