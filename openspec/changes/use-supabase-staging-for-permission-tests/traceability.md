> **Đối chiếu xuất bản 25/10/2026.** Hồ sơ thiết kế và checkpoint staging lịch sử; không mở lại bootstrap/grant/cutoff. Routing hoặc local PASS không thay SQL/hosted/full acceptance; task này chỉ xuất bản tài liệu. [Nguồn, trạng thái và giới hạn](../../../docs/workflow/tasks/docs-wip-publication-2026-10-25.md). Các yêu cầu SHALL/expected bên dưới được giữ; không đổi để hợp thức hóa code.

# Truy vết

Change tooling không có usecase sản phẩm; mỗi requirement có test tương ứng.

| Requirement | Tests | Bằng chứng/phạm vi |
| --- | --- | --- |
| STG-01 | T02,T07,T08 | Guardnegative; actualproject riêng chỉ sau observedref |
| STG-02 | T03,T06,T12 | Explicitprivateconfig, redaction, boundedbody, không ambientfallback |
| STG-03 | T01,T05,T09 | Full inventory và unioncoverage; T09 chưa thực hiện ởslice đầu |
| STG-04 | T08,T09 | Khôngmutationtransport trongslice đầu; provideradapter/SQLproof làdependency |
| STG-05 | T04,T08,T10,T13 | Deadline peroperation, fixed workstream claim, explicit additivegrant và oldledgerhash/counts unchanged |
| STG-06 | T01,T06,T07,T09,T11,T12 | Receipt/source/configfingerprints và providercontract; không nhận routing/offline làbusinessPASS |

Mọi row chưa chạy vẫn REQUIRED/PENDING; không đổi acceptance. Các test planned chưa có receipt không là PASS.
