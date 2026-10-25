# B03 — Gói trình duyệt reference v3

Ngày:2026-10-22. **PENDING_OWNER; chưa triển khai app.**

- Code source: 5348e3e92f02ec69e734972c4758828f1ed2a83ad91a5de8e09b5e3a297ba090
- Reference source: a93da9b3d6ef11aee464ac5b7b0b6ae6982fd0daeb1d0c956ab178e8b29cc9e8
- Measurement contract: aa0226344d736a948ffe28656d75d92ae35a78ee3171d99d932e5a6448c3f92a
- Preview: http://127.0.0.1:4177/review.html
- Source raw:9318af8ff7f3f703d8e229a4e4bacb98ff4ece21f0dea46f6f949ebd80779317.

## Đề xuất cần duyệt

Xem proposal.md cho DEV-01…08; Palette/font đã chốt. Cấu hình giữ referenceApproval=null. Fidelity3FHD state;38anchors,33controls,49regions. Channel16/global0,015/geometry2px/min44; regions0pixel sau channel threshold. Font/styles/tokens so chính xác. Không lấy ảnh actual làm expected.

Ma trận20 viewport được kiểm bản reference độc lập, không suy PASS ứng dụng. <=760 một cột và amount/keypad cạnh nhau khi đủ chiều rộng; contract mô tả rõ stack tại761..1100 và cạnh nhau tại<=760; normalized.css giữ cùng quy tắc. Height<=480 body cuộn và footer một hàng. V1/calibration01 giữ discovery vùng món bị che1101×600; V2 sửa và bổ sung bảo vệ nội dung tiền/control.

## Kết quả trước duyệt

| Gate | Kết quả | Phạm vi |
| --- | --- | --- |
| Tool tests | PASS77,0skip,0fail | Source 5348e3e92f02ec69e734972c4758828f1ed2a83ad91a5de8e09b5e3a297ba090 |
| Tool selftest | PASS11,0error; negativeFAIL theo kỳ vọng | Fixture tổng hợp |
| Reference calibration03 | PASS29 controls:3positive/26negative;source preserved | Không đo app actual |
| Reference preview | 3FHD+20matrix,repeat giống byte | Font/hit/target/overflow có phạm vi |
| Fidelity/responsive app | NOT_RUN | Chờ owner duyệt |
| Build/unit/smoke/ui-audit | NOT_RUN | Chưa đổi app |
| Product acceptance/push/merge/deploy | NOT_DONE | Chưa được giao riêng |

Review độc lập vẫn phải đọc đúng package/hashes; ghi verdict riêng sau khi package đóng băng. Lời duyệt reference không phải nghiệm thu sản phẩm hay merge/deploy.
