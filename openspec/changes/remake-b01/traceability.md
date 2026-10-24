# B01 — Truy vết

| Requirement | Use case | Test case |
|---|---|---|
| B01-01 | UC-B01-01 | TC-B01-01, TC-B01-07 |
| B01-02 | UC-B01-01 | TC-B01-02, TC-B01-07, TC-B01-08 |
| B01-03 | UC-B01-02 | TC-B01-03, TC-B01-09 |
| B01-04 | UC-B01-01, UC-B01-03 | TC-B01-02, TC-B01-04 |
| B01-05 | UC-B01-02, UC-B01-04 | TC-B01-05, TC-B01-09 |
| B01-06 | UC-B01-04 | TC-B01-06 |
| B01-07 | UC-B01-01, UC-B01-04, UC-B01-05 | TC-B01-07, TC-B01-08, TC-B01-09 |
| B01-08 | UC-B01-01, UC-B01-03, UC-B01-04, UC-B01-05 | TC-B01-04, TC-B01-07, TC-B01-08 |
| B01-09 | UC-B01-01 | TC-B01-01 |
| B01-10 | UC-B01-01, UC-B01-04 | TC-B01-10 |

| Chỉ số | Kết quả |
|---|---|
| Requirement chưa có test | 0 |
| Use case chưa có test | 0 |
| Requirement chưa có use case | 0 |

## Evidence cuối

Candidate d34101d8cda0bec82e98e60d94773a976f39654fc85ff3d8a3d10b81df95017b; manifest 58f133136aeb153864beaf2bb67cfdac51e2936f98531c2baa191967bb0e8f3a. Xem testplan cho file/lệnh/testcase cụ thể và docs/workflow/tasks/remake-b01-2026-10-19-implementation.md cho từng verdict. Không dùng bảngtruyvết để đổi auditFAIL thànhPASS. TC-B01-10 yêu cầu chạy/xem/phânloại audit, không tựchấp nhận37finding.
