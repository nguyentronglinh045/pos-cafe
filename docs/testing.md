# Kiểm thử và kiểm chứng

Bộ [test plan/traceability permission15](../openspec/changes/redesign-permission-model/testplan.md) và [hồ sơ lịch sử WIP](workflow/tasks/docs-wip-publication-2026-10-25.md) đã được hòa giải. Kế hoạch không là kết quả; FAIL/spent/NOT_RUN giữ source riêng, không đóng gate backend hiện hành.

Đây là nơi tổng hợp kết quả theo **source + ngày + môi trường**. [Chiến lược](test-strategy.md) quy định cách kiểm; [workflow](workflow/README.md) quy định review/bàn giao. Trang này không biến kết quả cũ thành lần chạy mới.

## Bản đồ bằng chứng

Bản đồ này nối nhóm tính năng với nguồn đã có, không tạo một lần chạy mới hoặc thay testplan. Xem [regression map](regression-map.md) để nối FR/NFR cũ; [spec reconciliation](spec-reconciliation.md) giữ expected hiện hành. “Chưa có bằng chứng ở nguồn đã khảo sát” không khẳng định artifact ngoài repo không tồn tại.

| Mã / phần được hỗ trợ | Source, môi trường và kết quả | Giới hạn và nơi lấy hồ sơ |
| --- | --- | --- |
| **E-UI** — B01–03, local unit/browser/mock, guard và UI regression | Candidate cf8e304 ngày25/10, tree bằng main711a22e; bảng nguồn tích hợp phía dưới giữ counts/pass/skip riêng. | Không backend/thiết bị thật/deploy. [Handoff/source và đường raw](workflow/tasks/ui-main-docs-integration-2026-10-25.md), [review](implementation-log/ui-main-docs-integration-review-2026-10-25.md). Receipt/review trong Git; một phần raw là local, chưa coi toàn bộ đã có artifact truy cập chung. |
| **E-PH27** — chống trùng, recovery và contract tài chính lịch sử | Source3ada48c ngày10/09; runtime loopback PostgreSQL/PostgREST/GoTrue; kết quả và coverage ở [checkpoint nghiệm thu lịch sử](testing-history.md#nghiệm-thu-giao-thức-chống-trùng--2026-09-10). | Không Storage/Realtime, không tự áp PASS cho permission/main mới. [Verification](implementation-log/phase-27-evidence/verification.md), [recipe lịch sử](implementation-log/phase-27-test-runtime.md). Không tự cài lại runtime đã dọn. |
| **E-BACKEND** — quyền, PIN, ảnh, signal, lifecycle và giao thức cùng nguồn | Nhiều candidate/slice và execution profile, phải đọc fingerprint của từng receipt. Main integration không tạo full acceptance mới. | [Backend/web23/10](workflow/tasks/permission-backend-web-release-2026-10-23.md), [integration24/10](workflow/tasks/permission-main-integration-2026-10-24.md), [catalog evidence WIP](workflow/evidence/docs-wip-publication-20261025/catalog.md). Giữ FAIL/spent/NOT_RUN; T04, bảy profiles và supplemental obligations chưa được miễn. |
| **E-CICD** — pipeline và kiểm nguồn PR | Có CI/Preview/release tooling; E-UI dẫn CI source head/synthetic cụ thể; các mốc CI trước đó giữ riêng. | [CI/CD proposal và hồ sơ nguồn](../openspec/changes/setup-project-ci-cd/proposal.md), [completion18/10](workflow/tasks/project-ci-cd-completion-2026-10-18.md). CI xanh không chứng minh functional Vercel/backend hiện hành đã phát hành. |
| **E-OPS** — backup, restore, vận hành | [Backup v2](workflow/tasks/permission-backup-v2-2026-10-14.md) và [backup audit](workflow/tasks/permission-backup-audit-2026-10-13.md) giữ source/phạm vi từng lần; LOCAL/hosted/provider readiness phải tách biệt. | Không nhận thành restore production nguồn cuối hoặc RPO/RTO đã đạt. Secrets/private artifacts không được sao chép vào docs; reader cần quyền truy cập theo hồ sơ. Performance source cuối chưa có kết quả đầy đủ tại bản đồ này. |
| **E-DOCS** — chất lượng kho tài liệu | [Lượt chỉnh lý hiện tại](workflow/tasks/docs-knowledge-reconciliation-2026-10-25.md) ghi candidate/checks/review; [hỏi đáp](workflow/tasks/docs-knowledge-clarification-2026-10-25.md) ghi nguồn xác nhận. | Chỉ kiểm tài liệu, không là acceptance sản phẩm. Checklist theo dõi vẫn local. |

**Khả năng truy cập:** các link tương đối ở bảng dẫn tới receipt/spec/review trong docs. Với đường checkout cũ hoặc raw local, tra [hồ sơ gom kho và relocation](workflow/tasks/archive-consolidation-2026-10-25.md) trước khi kết luận file mất. Chưa xác minh lại từng file ngoài Git; không gọi đường local là bản evidence đã xuất bản. Không sửa byte frozen receipt để cập nhật đường dẫn.

**Phần cần thu thập khi thực hiện:** evidence backend đủ gate trên source được chọn; URL/version Vercel và smoke chức năng; measurement hiệu năng/realtime theo kịch bản; restore/backup gắn scope và điều kiện; kiểm thiết bị thật; traceability từng TC. Dữ liệu thiếu giữ trạng thái thiếu, không chạy thêm suite chỉ để điền bảng tài liệu.

## Nguồn tích hợp UI — 25/10/2026

Main `711a22e71983e3d6aa17799649af05ce4c762555` có tree bằng candidate B03 `cf8e304869ad0e92c491736790f59bff1b6f9dcc`. Đây là đối chiếu tree, **không có lần chạy test mới trên merge SHA** trong lượt docs.

| Kiểm | Nguồn và kết quả đã ghi |
| --- | --- |
| Build, unit, browser local | cf8e304: build PASS; 1.201 unit / 113 files PASS; 26 browser PASS |
| Full mock smoke | cf8e304: 44 PASS / 37 skip theo applicability; map normalizer mới PASS81, không tăng skip |
| Rendered UI | cf8e304: 48/48 COMPLETE, 0 findings; strict counts 48 PASS / 0 fail / 0 skip |
| Detector/policy | 24 tool tests; selftest 23 findings/14 rules/16 controls; policy 2 PASS; 64 canonical pins khớp |
| Required CI trước merge | PR13 pull_request PASS trên synthetic `aadae07397db20012d9786141ec71f2195081831`, head cf8e304; push PASS trên cf8e304 |
| Backend/toàn hệ thống | Không nghiệm thu trong gói này; T04, bảy profiles và supplemental obligations giữ HOLD |
| Thiết bị thật/deploy | Hardware/browser zoom/printer chưa kiểm; không deploy/migration/live activation |

[Handoff nguồn và lệnh/evidence](workflow/tasks/ui-main-docs-integration-2026-10-25.md), [review](implementation-log/ui-main-docs-integration-review-2026-10-25.md). Không cộng số B01/B02 cũ hoặc phase 27 vào tổng cf8e304. Raw local tại đường dẫn trong handoff không tự là artifact đã xuất bản.

## Chiến Lược

Chiến lược kiểm thử — sáu tầng, tiêu chí "bao nhiêu là đủ" theo loại thay đổi, cổng chất lượng, ngưỡng độ phủ và quy ước đặt tên — nằm ở [test-strategy.md](test-strategy.md).

File này chỉ chứa **nhật ký kết quả chạy** và **checklist thủ công**. Hai file tách nhau vì nhịp cập nhật khác nhau: chiến lược đổi hiếm, nhật ký đổi mỗi lần chạy lại.

## Checklist Thủ Công

Hai việc dưới đây đang được giữ ở checklist thủ công của dự án; chưa có lần kiểm mới trong lượt docs. Phân tầng và phạm vi xem [test-strategy.md](test-strategy.md) mục "Phần Giữ Thủ Công".

Chạy trước mỗi mốc đóng mục roadmap và trước ngày demo. Ghi ngày ngay khi chạy; **chưa chạy được thì ghi rõ lý do, không bỏ trống**.

| Việc | Ngày chạy gần nhất | Kết quả và ghi chú |
| --- | --- | --- |
| Gửi một email thử qua đường gửi đang cấu hình, xác nhận vào hộp thư chính chứ không vào thư rác | *chưa chạy* | Chưa dựng đường gửi email. Thuộc `add-owner-account-and-store-provisioning` nhóm 1 |
| Mở ứng dụng trên thiết bị thật ở chế độ ngang, kiểm thao tác chạm và bàn phím ảo | *chưa chạy* | Ghi rõ loại và kích thước thiết bị khi chạy |

Diễn tập kịch bản demo trước đây nằm ở đây, nay **đã chuyển sang tự động** thành `tests/smoke/demo-runbook.spec.ts`.

## Cách Chạy

```text
npm run build
npm test
npm run test:coverage
npm run smoke
npm run smoke:supabase
```

Bốn lệnh đầu là cổng chất lượng, chạy được cục bộ và không cần hạ tầng ngoài. Lệnh thứ năm là cổng theo mốc.

`smoke:supabase` cần cấu hình `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, migration/storage/realtime đúng phiên bản và Supabase Auth cho phép signup nhận session phù hợp với flow demo.

## Khoảng Trống Kiểm Thử

- ~~Chưa có số liệu code coverage chính thức~~ **Đã có từ 2026-09-07**, xem [checkpoint Độ Phủ Nền](testing-history.md#độ-phủ-nền-đo-ngày-2026-09-07). Khi ghi vào báo cáo phải kèm **phạm vi đo**, vì con số là của phần logic nghiệp vụ thuần chứ không phải của toàn bộ `src`.
- Chưa có load/performance test hoặc đo latency realtime có kiểm soát.
- Polling 5 giây là khoảng cấu hình, không phải cam kết mọi thiết bị hội tụ dưới 5 giây.
- Reconnect self-heal có unit test nhưng lần kiểm chứng cross-device gần nhất vẫn cần diễn tập thủ công.
- Chưa có test cho thiết bị in thật, offline, QR/bank processing hoặc kitchen queue vì các phần đó ngoài scope.
- URL Vercel/live deployment và ngày kiểm tra live phải được bổ sung riêng trước khi đưa vào báo cáo như bằng chứng triển khai.

## Quy Tắc Ghi Vào Báo Cáo

- Luôn ghi dạng: `baseline + ngày + môi trường + lệnh + kết quả`.
- Kết quả phase cũ là evidence lịch sử, không thay cho baseline hiện tại.
- Failure lịch sử đã được phase sau sửa phải ghi là “tại checkpoint”, không mô tả như lỗi hiện hành.
- Phân biệt rõ automated test, manual verification và cấu hình/deployment readiness.


## Kiểm tài liệu — 26/10/2026

[Handoff](workflow/tasks/docs-reorganization-2026-10-26.md) ghi kiểm liên kết/anchor, bảo toàn lịch sử/evidence, kiểm DOM/controls HTML cùng giới hạn chưa xác minh render/layout và review của lượt tổ chức docs. Đây không là một lần chạy app/backend hoặc kết quả chấp nhận sản phẩm.

## Tra cứu mục cũ

Các điểm neo được giữ để liên kết cũ vẫn tới được đúng bối cảnh.

| Mục lịch sử | Nguồn nguyên bản |
| --- | --- |
| <a id="kiểm-tài-liệu--25102026"></a>Kiểm tài liệu — 25/10/2026 | [Đọc lịch sử](testing-history.md#kiểm-tài-liệu--25102026) |
| <a id="kết-quả-lịch-sử"></a>Kết quả lịch sử | [Đọc lịch sử](testing-history.md#kết-quả-lịch-sử) |
| <a id="nghiệm-thu-giao-thức-chống-trùng--2026-09-10"></a>Nghiệm thu giao thức chống trùng — 2026-09-10 | [Đọc lịch sử](testing-history.md#nghiệm-thu-giao-thức-chống-trùng--2026-09-10) |
| <a id="kịch-bản-demo-và-cổng-chất-lượng-chạy-ngày-2026-09-07"></a>Kịch Bản Demo Và Cổng Chất Lượng, Chạy Ngày 2026-09-07 | [Đọc lịch sử](testing-history.md#kịch-bản-demo-và-cổng-chất-lượng-chạy-ngày-2026-09-07) |
| <a id="độ-phủ-nền-đo-ngày-2026-09-07"></a>Độ Phủ Nền, Đo Ngày 2026-09-07 | [Đọc lịch sử](testing-history.md#độ-phủ-nền-đo-ngày-2026-09-07) |
| <a id="chạy-lại-ngày-2026-08-21"></a>Chạy Lại Ngày 2026-08-21 | [Đọc lịch sử](testing-history.md#chạy-lại-ngày-2026-08-21) |
| <a id="baseline-local-lịch-sử-2026-08-12"></a>Baseline Local Lịch Sử 2026-08-12 | [Đọc lịch sử](testing-history.md#baseline-local-lịch-sử-2026-08-12) |
| <a id="bằng-chứng-cloud-gần-nhất"></a>Bằng Chứng Cloud Gần Nhất | [Đọc lịch sử](testing-history.md#bằng-chứng-cloud-gần-nhất) |
| <a id="nhóm-bằng-chứng-quan-trọng"></a>Nhóm Bằng Chứng Quan Trọng | [Đọc lịch sử](testing-history.md#nhóm-bằng-chứng-quan-trọng) |
| <a id="tuần3-b01b02"></a>Tuần3 B01/B02 | [Đọc lịch sử](testing-history.md#tuần3-b01b02) |
