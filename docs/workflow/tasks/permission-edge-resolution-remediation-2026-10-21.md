# Sửa resolution Edge sau failure ngày 21/10/2026

**Đã dừng sau CI25FAIL; chưa hoàn tất.** Owner reply18:59:12+07 đã cấp ngân sách bổ sung, candidate06 hai scope APPROVE và local823Node0skip, source90e30f2 đã publication. CI25 run39600415703 FAIL tại native Edge preflight, backend khôngdispatch; [incident/cách sửa cụ thể](../../reviews/2026-10-21-permission-edge-cleanup-incident.md). LedgerCLOSED spent2publication/2CI/1heavy/6review, không tự dùng2heavycòn. Hạn23:00giữnguyên, dừngsớm vìactionbudgethết. Các bước/estimate phía dưới giữ lịch sử kế hoạch đã review, không phải chứng nhận đã đạt.

[Review05 và xử lý hai blocker](../../reviews/2026-10-21-permission-edge-resolution.md): source CHANGES_REQUESTED/operations APPROVE. Đã sửa version banner và max cumulative timestamp, giữ policy/ledger và spent. Candidate06 cần hai scope APPROVE trước publication. Archive releasev1.74.3 được pin bằng SHA256; banner dự kiến theo source là CLI0.1.0/Deno2.1.4, chưa phải quan sát native thật.

## Bằng chứng và nguyên nhân

Source `ed73a415737aaf6d460e90f1756148a6be4d19dc`, CI run39592119259 đủ17 phase PASS. PIN_ONBOARD run39593847459 FAIL tại setup `edge-network-warm / EDGE_CACHE_PROOF / EDGE_CACHE_PIN`, trước stage nghiệp vụ. Ordinal9 là `@types/phoenix`; pin1.6.7, thực tế1.6.8. Cleanup thành công, reclaim đo19.327.365.120 bytes. T04 dùng chung bước này nên đang HOLD.

`supabase-js@2.45.0 → realtime-js@2.10.2 → @types/phoenix@^1.5.4` vẫn resolve online; exact allowlist được kiểm sau bundle, không là đầu vào khóa resolution. CI npm lock SDK2.108.1 không kiểm graph Edge2.45.0. Phép tái hiện gọi cả hai validator thật bằng adapter trong bộ nhớ trả cùng failure, chưa phải thực nghiệm resolver thật. Report, script và metadata npm chính thức (5.702 bytes) được giữ tại `evidence/loop-prevention-20261021/edge-drift-investigation.json`, SHA256 `aa8aca4added5340eeadc3823e4e9c43783606bd9952d29e602f950300acd801`.

Đúng runtime Edgev1.74.3, source commit `47d04fdd22e33ea3fd904576cf3248d963d903a9`, có đọc lockfile npm snapshot. Tuy nhiên implementation frozen-check còn bị comment, nên không coi cờ frozen là bảo vệ đã có. Phải kiểm input/closure độc lập và tiếp tục exact cache proof/SRI/offline replay. Nguồn chính thức: `cli/src/main.rs:303–374`, `deno/npm/managed/mod.rs:162–207,397–407` tại commit này.

## Delta đề xuất

1. Tạo lock snapshot toàn graph đã review từ manifest hiện có; giữ exact version/SRI/tarball/dependencies. Cấu hình test runtime trỏ rõ vào snapshot. Không sửa nghiệp vụ, production ACL hoặc tự nâng dependency lên1.6.8.
2. Kiểm closure, thiếu/thừa edge, SRI và cấu hình trước bundle; hash input trước/sau. Dùng cùng helper cho service và T04. Giữ exact cache proof, cache512MiB và hai offline replay. Không dựa vào frozen-check chưa được runtime thực thi.
3. Thêm tiền kiểm resolver Edge gọn vào cùng lượt CI của source mới, giữ nguyên17 gate và thêm một gate. Chạy hai entrypoint thật với cache mới, phiên bản runtime đúngv1.74.3, các negative controls về lock bị thiếu/drift, rồi kiểm cache thật. Không cần PostgreSQL, Supabase stack hoặc image loop18GiB. Native binary và Docker image là hai artifact khác nhau; tiền kiểm native không thay proof runtime image của backend.
4. Sau hai scope review độc lập APPROVE đúng candidate và own-source CI PASS, chạy lại PIN_ONBOARD đầy đủ48+7. T04 đầy đủ19stage chỉ mở sau terminal receipt/reclaim của PIN và đánh giá blocker chung. Không chạy song song, không tự retry khi FAIL.

## Ngân sách bổ sung đã được owner đồng ý

Ledger hiện tại đã dùng publication1/1, CI1/1, review4/4 và heavy1/2. Đề xuất cấp thêm tối đa **1 publication, 1 CI, 1 heavy, 2 vòng review**: tổng trần2/2/3/6, spent giữ nguyên. Hai vòng review mỗi vòng có hai scope source/operations; vòng thứ hai chỉ để xử lý finding. Publication thứ hai tạo đúng một own-source CI; nếu tiếp tục FAIL thì dừng, không tự cấp lượt nữa. Hai lượt heavy còn lại sau grant dành cho PIN và T04, không nhận một profile thành toàn bộ acceptance.

Grant được lưu trong V3 successor `budget-edge-resolution-2300.json`, SHA256 `3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c`, kế thừa counts1/1/1/4 từ V2 đã đóng. Pin policy/anchor/journal và claim duy nhất; không sửa policy cũ hoặc tạo sibling. Guard đã bổ sung exact grant1/1/1/2 và có20budgettestsPASS; source này còn chờ review trước publication. Không mở giới hạn chung hoặc bỏ kiểm lịch sử.

## Dung lượng và giới hạn thời gian

Không cài runtime trên Windows. Native archive x86_64-linux chính thức82.997.085 bytes, SHA256 `8b5a0f998a552d80690136de969eaa7ab15175509684a5598a97629afa243db1`. Nơi chạy dự kiến là task root trên ổ ephemeral Linux của CI; tải/archive83MB, giải nén tối đa512MiB, cache tối đa512MiB, **LỚN HƠN 1 GB**: trần đỉnh khoảng1,16GB (1,08GiB). Phải kiểm listing/expanded bound trước giải nén, cộng mọi phụ thuộc vào CI5GiB hiện có; không được chỉ tuyên bố đã có quota kỹ thuật khi mới đo/giám sát. Nếu archive không chạy độc lập hoặc vượt trần, dừng tiền kiểm này và báo, không cài Nix/Docker mới để tiếp tục.

Archive đã stream-inspect trên Windows, đúng SHA256; expanded file245.736.752bytes, không giải nén/giữ archive trên ổ. Bản triển khai giảm cap giải nén xuống256MiB, cache proof512MiB, operating cap riêng của probe1GiB và toànCI5GiB; ước tính đỉnh thận trọng ở trên được giữ làm lịch sử. Chỉ các online warm bundle của native được claim; hai offline replay thật vẫn do backend networknone chứng minh.

Windows lúc khảo sát: C194,35GB/D98,56GB trống, dữ liệu task giữ khoảng263MB, dưới768MiB. Full backend vẫn chỉ một runtime18GiB, cộng outside1GiB và Windows768MiB, không vượt tổng20GiB; reclaim giữa từng lượt bắt buộc.

Đặt checkpoint bản sửa/local checks trước20:15; review và sửa finding trước21:00; CI kết thúc/thu receipt trước21:35; backend cần reserve42phút cho mỗi lượt. Mốc là giới hạn lập kế hoạch, không tự mở gate. Không dispatch heavy khi không đủ42phút trước23:00, không dispatch CI/publication khi không đủ37phút. Kết thúc hoặc checkpoint trước23:00 bất kể PASS hay chưa.

## Tiêu chí chặn

Lock/cấu hình không được runtime đọc, closure không đủ, unknown package, SRI drift, cache vượt bound, negative control không phát hiện lỗi, reviewer chưa APPROVE, CI source sai hoặc không đủ coverage: dừng phần phụ thuộc. Không dùng lại CIed73 cho source thay đổi. Giữ patch, test recipe, snapshot, failure facts và ledger để lần tiếp tục không lặp setup đã biết.
