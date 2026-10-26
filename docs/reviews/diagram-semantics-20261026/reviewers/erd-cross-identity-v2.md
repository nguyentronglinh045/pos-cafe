# Review chéo cuối — F05–F08 và provenance — vòng 2

Reviewer `/root/review_erd`, 26/10/2026. Phạm vi không đổi: F05–F08, source/DB provenance, giới hạn và preservation, tính nhất quán tổng kết bốn file hồ sơ. Tôi không tác giả candidate hoặc bảng trace identity.

**APPROVE** hồ sơ review trong phạm vi trên, trên đúng candidate-manifest SHA256 **13110a1ad65090f34c7f5bf6a650ff6e9efd5a6ae05f6d2779e28695e880cd51**, evidence-manifest SHA256 **6d8c701c3f2d3e94023f4c435766f141ce4d0950320229284d436001f8b313ea**. Source-manifest giữ nguyên **2929925805096f6dc2873fea2f076e9f84a395e83cb57257f316f1f9bdac2282**.

CR-ID-01 đã đóng bằng chứng: diff trực tiếp với history/v1 chỉ đổi đúng ba tham chiếu của traceability.md: F07-01→permissionIdentityRepo.ts:129–136; F07-02→:27–33,123–136; F07-05→:26,123–136. Đã đối chiếu lại source: getAuthority123–127, getRevision129–136, guard hậu await127/133. README.md/findings.md/verification.md giữ nguyên hash so với v1; không có đổi verdict hay phạm vi để qua gate. Receipt CHANGES_REQUESTED v1 được giữ ở erd-cross-identity-v1.md.

Kế thừa phần đọc độc lập của vòng1: đủ23 row F05–F08 qua UI/flow/port/adapter/SQL; PIN/restricted/expiry/receipt/lost ACK; authority timers/errors/purge/generation; signal loss/publication/purpose/refetch. Tôi cũng đã kiểm hash và trực tiếp xem4 PNG F05–F08; nhận xét đúng khi giữ caption. Không thấy lỗi ngữ nghĩa mới chặn trong phạm vi này.

Kiểm lại lúc09:35:32UTC bằng erd-cross-check.cjs: **1276 manifest entries** khớp; **1133 snapshot entries** khớp source manifest; **11 source then chốt** khớp trực tiếp git711a22e và live checkout; **21 body identity/read/signal** so lại khớp catalog đã thu; **36 bảng/335 cột**. HEAD5156820, status và index tiếp tục bằng baseline. Không có hash mismatch. Kết quả máy đọc ở erd-cross-check.json; không thực thi lại product tests hoặc RPC.

Provenance đúng: S=inecki… theo cấu hình MCP project và probe read-only; L=kfq… theo cấu hình local được lược secret, chưa được kiểm DB/runtime. Mỗi SELECT catalog là quan sát riêng, không được gọi là một transaction snapshot đồng thời. N1/N2 cũ vẫn là lịch sử. Hai invariant helpers chỉ captured, không bị cộng vào21 body comparison. ACL W/O và seed audit delta được giữ riêng; không lấy source candidate làm chứng cứ activation.

APPROVE này xác nhận **hồ sơ mô tả kết quả và giới hạn có căn cứ**, không duyệt nguyên bộ hình: F04 vẫn cần sửa; W lifetime issue vẫn ghi riêng. Không có giao dịch/lock-wait/staging E2E, subscription delivery, deployed build, DB L, Word/PDF/in hay hardware acceptance. Không đóng P1-03/N4/H1–H4/backend/deploy/hardware và không xác nhận chủ dự án đã nghiệm thu. Không còn finding chặn thuộc phạm vi review chéo của tôi.
