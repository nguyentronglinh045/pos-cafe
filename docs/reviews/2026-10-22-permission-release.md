# Review — tiếp tục phân quyền22/10/2026

Đây là hồ sơ review đang diễn ra; PENDING không phải APPROVE. Main giữ full security/backend gate theo câu trả lời owner22/10. Hạn11:00+07, chỉ DB staging; không DB gốc/Vercel/production.

## Terminal CI02 — APPROVE bằng chứng giới hạn

CI39713372721/sourceb2e3122/attempt1 đãsuccess,18orderedphasePASS. Non-author source `investigation_plan_review` và operations `continuation_operations_review` đều **APPROVE** actuallog/summary/1106Gitblobs/sourceFP/Edgeinputpins/PG16physical+cleanup. [Terminal result](../implementation-log/permission-release-20261022/ci-portability/ci02-result.json), [summary](../implementation-log/permission-release-20261022/ci-portability/ci02-summary.json), [nativePG16](../implementation-log/permission-release-20261022/ci-portability/ci02-pg16-runtime.json). SummarySHA488dfb30…f823/log49fad609…8c6b/PG16receipt12f22b83…dd80/nativecleanupc45296de…1f81. ToolingmanualDeferred1/smokeapplicabilityskips37 được giữ đúng; fullbackend29/417 cònNOT_RUN.

Root và operations đã mở đủbaảnh và kiểm rawZIP/manifest/source/baseline/CRC. **APPROVE giới hạn visibleunmasked mock UI**: [inspection](../implementation-log/permission-release-20261022/ci-portability/pin-ui02-inspection.json), không tìm thấy visiblelayoutfinding. HaiPINmask mỗiảnh và mobilefullpage419px/viewport390px được ghi giới hạn; không claimmaskedinputs/nativePIN/businessPASS. Rawmanifest không sửa.

Các mục bên dưới là checkpoint lịch sử trước terminal. [Kế hoạch tiếp tục](../workflow/tasks/permission-next-release-session-2026-10-22.md) và [source mapping12nghĩavụ](../implementation-log/permission-release-20261022/fullgate-obligation-map01.json) không cấpheavygrant. Main/DBgốc/SQLstaging chưa đổi; backup/restore target+ownerconfirmation vẫn làgate trướcLIVE riêng theoD19, không thêmgate trướcmerge bằng suy luận.

Mapping reviewer độc lập `investigation_evidence_review` **APPROVE boundedsource mapping** hash2851f3ec…7c74:12ID/6mapped/6unknown, toàncitation hợp lệ, không phải12runtimePASS. [Status sidecar](../implementation-log/permission-release-20261022/fullgate-obligation-map01-status.json) làm rõ các dòng currentLightNOT_TERMINAL/Waitforterminal trong snapshot cũ đã được actualCI02 supersede. PlanfindingNEXT-01 đã sửa, reviewer source APPROVE ranhgiới merge/live theoD19; operations APPROVE kế hoạch/currentreceipts, không cấpheavy. [Cutoff10:15](../implementation-log/permission-release-20261022/cutoff1015-checkpoint.json) đãREFUSED/DEADLINE; SQL/chạyheavy/main không xảy ra.

## Hiện trạng sau publication bổ sung09:50

Các checkpoint phía dưới giữ nguyên trạng thái tại thời điểm ghi. Kết luận hiện tại:

- Bootstrap source38 và actualSQL0094140c…073e đã được hai non-author reviewer `continuation_source_review` và `continuation_operations_review` APPROVE exactoutput/transport. Owner mới trả lời item0 hủyworkflow; câu hỏi action-time SQL item1 vẫn chưa có trả lời. **ChưaRun SQL**, không DBwrite/businessPASS.
- Candidate38 đã có CI39709124524FAIL node-tools. Install/build/unit1175/tooling567PASS không thay các phase13NOT_RUN và backendfullgate.
- Remediation localcommit `b2e3122866f5b6108f026f381f4f12614c98027c` đúng8file,43trustedGitpins khớp, productionfalse. Tác giả: root records/pins, `bootstrap_provider_design_20261022` CLI, `continuation_source_review` diagnostics, `release_gate_feasibility_20261022` successor guard. Hai reviewer mới `investigation_plan_review` source/plan và `continuation_operations_review` operations không thuộc danh sách tác giả.
- Cả hai reviewer explicit APPROVE [source manifest](../implementation-log/permission-release-20261022/ci-portability/candidate-source01.json) rawSHA `b260122b9485c841df120eeee5c4184a71f92fa0c2bf6f1d3a26f411d91235de`, patchSHA `43bb7309f50033ffa99a536ae5747faa2f86079b2f943810bf72c7159e2e8510`, [receipt03](../implementation-log/permission-release-20261022/ci-portability/local-node-tools-remediation03.json) SHA `eaf4e6239b452cf937b27c0391415c933dab1aa27edc59c7f2ab0b596fbb185b`:904PASS/0FAIL/0SKIP và sourceb975bb44…6b87 giữ nguyên. Reviewer tự kiểm8pins và1098unmodified indexblobs. Hai lượt FAIL local trước được giữ; đây không phải CI/Linux/fullbackendPASS.
- Owner cấp thêm đúng1publication+1CI qua `call_31849df3bfad47f7aec74d3d7155420c:item0`. Source reviewer còn đối chiếu actualuserreply trong parent transcript. Hai reviewer APPROVE actualgrant delta, rồi APPROVE checksumclosure của finalpolicy/reviews/packet. Chỉ thay authorization và references của record approval, không đổi nguồn/coverage/baseline/caps/deadline/claim1.
- [Final policy](../implementation-log/permission-release-20261022/ci-portability/publication-policy-remediation01.json) SHA `18325065527ac125f670932e4cbdee3846466cf7045b36790438dac6bf04ab55`; [reviews](../implementation-log/permission-release-20261022/ci-portability/publication-reviews-remediation01.json) SHA `685fb6c398c214968527184a9b778e5db1ac5672a0e44e7dba4c499fb9b75c0f`; [packet](../implementation-log/permission-release-20261022/ci-portability/publication-packet-remediation01.json) SHA `88cdaef84606ad227ac15cb41a8940da4672cd3da803bbc4e787f71f32a1eea2`.
- Actualdryrun và dispatch ADMITTED; [readback](../implementation-log/permission-release-20261022/ci-portability/publication-readback01.json) xác nhận remote b2 và đúngmột [CI39713372721](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/39713372721), attempt1, lúcreadback IN_PROGRESS. Claimremediation rawSHA `d5fb2f7205a1651f68223d70b4a1f21e68c580149c4e98ff63fe02903d1be99c` đã tiêu. Không rerun/resetclaim. Main/DBgốc/SQLstaging không đổi.

[Kế hoạch remediation và toàn bộ checkpoint](../workflow/tasks/permission-ci-portability-remediation-2026-10-22.md) là đường dẫn review walkthrough; owner chưa xác nhận đã đọc/hiểu. Final CI/backend readiness phải được ghi bằng terminalreceipts riêng; approval tool/plan không thay kết quả thực thi.

## A. Introspection chỉ đọc — APPROVE hai scope trước actual

Source SQL rawSHA `a5097677e0f2c27e764b10768061b5d0cd368ee643b282eca6826caa13fb284b`, manifest `796d0073885dafaada5b852675227742c584f6ad4cd8a0020dbefca6c6f1fcaa`. Non-author source `release_code_inventory_20261022` và operations `continuation_operations_review` đều explicit APPROVE. UI transport153LF→CRLF được tính độc lập bởi hai reviewer:9183B/hash `ab5dc5589947832bf61e0720a14f0f21e629f35c38db15dc418f63dc96f18b53`, normalized exact full text match. Không đổi SQL. Actual một Run08:26; [receipt và raw export](../implementation-log/permission-release-20261022/introspection01-result.json). Đây chỉ là metadata/counts, không hosted business PASS.

## B. Edge cleanup — APPROVE hẹp, Linux actual NOT_RUN

Author `release_gate_feasibility_20261022`; non-author source `release_code_inventory_20261022`, operations `continuation_operations_review` APPROVE3file rawSHA:

| File | SHA256 |
| --- | --- |
| scripts/permission-edge-probe.mjs | ae736d05e728ad0d6cc0f3f4cd9d7935890c3e6f2764be319a01138275e74367 |
| scripts/permission-edge-probe.test.mjs | e4efc11da74fd1c80bc0f3a1165068eaeac44df8fde4986ebfff6742a3f2b257 |
| scripts/permission-edge-resolution.mjs | 7795136a7a533e93c550cec3df09a846fee58ed5ff1eb6fb6237a2b60c4b1178 |

Root cập nhật đúng2trusted source pins ở `ci/release-policy.json`; cần finalcandidate review, chưa coi approvalB là duyệt publication. Log local root chạy3testfiles:50PASS/0FAIL/0SKIP/24.63s, [receipt](../implementation-log/permission-release-20261022/local-edge-staging-guards01.json). Không Linux native/business PASS.

## Provider source

Allowlist01 được root tạo từ đúng raw UI observation, không phải cơ chế tạo bằng chứng review. [Observation](../implementation-log/permission-release-20261022/provider-observation01.json), [allowlist](../implementation-log/permission-release-20261022/provider-allowlist01.json). Non-author factual/source reviewer `bootstrap_provider_design_20261022` đã explicit **APPROVE** observation SHA `b7e1defe89c76d85a0aa7c3d529bb424bc8b5369b0462ec404d10014dff70d8b` và allowlist SHA `1b4fe8bc65a9e516a3aa7d41176d47bc4c6e065b46035f38be2a589aaf7d63f7`: exact providerCatalog trừidentity, đúng binding/managedcapabilities/freshcount; giữ defaultACLrisk. Reviewer này là tác giả bootstrap, nên verdict chỉ factual-copy input, không tự review tool/output của mình. Trường reviewReferences chỉ trỏ biên bản, không tự là APPROVE.

## Provider operations

Non-author `continuation_operations_review` explicit **APPROVE** cùng observation/allowlist hashes nêu trên và receipt chain cho generation. Freshness phải recheck có lock trong transaction; pure metadata08:26 không đủ cho mutation sau đó. One top-level DO tránh phụ thuộc ranh giới transaction giữa nhiều request; server timeout2min khác request60s, timeout/unknown chỉ reconcile read-only, không replay. Source/raw vs generated canonicalLF phải ghi riêng. Exactbundle, two non-author output reviews, UI source hash và action-time confirmation còn **PENDING**.

## ACL closure, bootstrap và publication phase

ACL author `release_code_inventory_20261022`; bootstrap author `bootstrap_provider_design_20261022`; phaseguard/Edge author `release_gate_feasibility_20261022`; root author records/trusted pin update. Không lấy review tác giả hoặc tool unit PASS làm approval triển khai.

Operations reviewer `continuation_operations_review` APPROVE final16paths: ACL SQL raw `3afe1a03ee7b37ec5b8b63b192803cbd8efdc8c47049b8732321e72e30a524fa`, fixture raw `d4c2da01fef77b80f9bfd7a429de83e58e9ded9321a32c87edf169749dad8d50`/LF `9a23883bd7a3e476875ea1af3baf179b78cb6d35a208a25b6c943dd719b2c378`, test raw `15f2fc2355a59bdaa8db7b793ce09a7493375e0ee57a6b5c274dcde022f98a40`; bootstrap4file d1b12788…/bf4867a3…/89d32ffa…/d2288c69…; phaseguard cccf0019…/ec2f3b46…/e6bdbe7b…; trustedpolicy `d673d481c637c685d9bf56fac7e5bc9294f2c036853be9138703326e5f8100ea` chỉ2pin đổi. Full hashes16canonicalGitblobs ở publicationpacket01.

Root đã chạy69trackedNode testfiles: **889PASS/0FAIL/0SKIP**,31.31s, nguồn tracked giữ nguyên trong test. [Receipt](../implementation-log/permission-release-20261022/local-node-tools01.json). Đây precommit source-content proof, không tự đổi thành Linux/hosted/runtimePASS khi commit. Code được lưu candidate `38a55aab775e1d70dba4b62d6658f41e28f8aef1`;16paths, không recoveryhelper. Source review độc lập đầy đủ, actualpublicationpacket và generatedSQL còn **PENDING**.

Lỗi đã xác minh qua code: migration016 revokeALL cho PUBLIC/anon/authenticated trên stores nhưng bỏ service_role; read closure chỉSELECT, changesclosure khôngstores, nên còn lỗ hổng rawprivilege theo providerdefaults/columnUPDATE. Chưa chứng minh actualTRUNCATECASCADE thành công và không thực hiện phá dữ liệu để thử. Cách sửa thu hồi ALL đúng23allowlistedapprelations+columns, không thay providerglobaldefaultACL/unknownextension; tests tăng assertion trong casecũ và fixture phải restore đầy đủ ACL/provenance sau lượt chạy. Linux/T07/fullsuite vẫn NOT_RUN.
