# Mapping coverage staging — 21/10/2026

Kế hoạch phân lane, chưa có kết quả hosted. Giữ đủ35stage/760runtime identities; các manifest gốc có726PERM occurrences+111PINmappings=837 với ngữ nghĩa khác. Không nhận một smoke/preflight thành full backend PASS.

| Stage | Required runtime identities | Lane hiện tại | Hosted |
| --- | ---: | --- | --- |
| candidate-unit | 171 | Độc lập backend | NOT_APPLICABLE |
| foundation-unit | 108 | Độc lập backend | NOT_APPLICABLE |
| legacy-t01-tools | 28 | Độc lập backend | NOT_APPLICABLE |
| candidate-seed-tools | 4 | Độc lập backend | NOT_APPLICABLE |
| pin-static-operator | 2 | Độc lập backend | NOT_APPLICABLE |
| pin-onboard-closeout | 48 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| pin-tc18-wrapper | 7 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| pin-onboard-race | 2 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| pin-onboard-expiry | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| pin-identity-server | 41 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| pin-identity-onboarding | 9 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| pin-canary-empty | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| legacy-t01-database | 30 | Giữ native PG16 | NOT_IMPLEMENTED |
| bridge-bridge-database | 10 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-bridge-database | 3 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| foundation-database | 4 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| identity-database | 42 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-images-service | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| administration-database | 55 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| read-database | 120 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| clear-demo-database | 9 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-signals-database | 3 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| financial-database | 37 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-print-database | 4 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-bulk-concurrency-database | 4 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-e2e | 2 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-seed-recovery-database | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| candidate-roles-e2e | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| realtime-e2e | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| rollback-additive-database | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| rollback-preflight-database | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| rollback-recovery-database | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| transition-database | 4 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| transition-e2e | 1 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |
| transition-compatibility-database | 3 | Cần hosted adapter; hiện giữ isolated | NOT_IMPLEMENTED |

Mọi stage vẫn required.29backend stage cần adapter và target cô lập;1nativePG16 giữ acceptance riêng;5STATIC chạy độc lập. Các rào cản provider, reset/rollback/fault injection được ghi trong proposal/design và khảo sát review. Source để tái tạo từng row, test/config hash: inventory.json cạnh file này.
