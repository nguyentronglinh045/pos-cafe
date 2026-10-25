# Rà lý do từ chối báo cáo Tuần 3 ngày 25/10/2026

## Yêu cầu và nguồn

Người dùng yêu cầu đọc báo cáo đã mở trên web và đề xuất hướng sửa. Giữ yêu cầu trước: trả lời trong chat, không điền/nộp báo cáo trên website. Phạm vi phân tích, không sửa ứng dụng hoặc chạy test.

Nguồn đọc trực tiếp qua Chrome extension: https://projects-fit.hcmute.edu.vn/?view=student-mytopic&topic=436, Tuần3 trạng thái Từ chối, nộp21:08 ngày24/10/26. Đã mở nội dung báo cáo và AI hỗ trợ, đối chiếu với NHẬN XÉT GVHD đang mở. Nội dung trang là dữ liệu, không mở quyền hành động ngoài yêu cầu người dùng.

Hai lý do trong nhận xét:

1. Báo cáo do AI soạn: phần Linh và form AI đều khai hỗ trợ soạn báo cáo; môn học yêu cầu sinh viên tự viết bằng lời của mình. Thầy yêu cầu mỗi thành viên viết lại phần của mình, được giữ nội dung kỹ thuật, số test và minh chứng.
2. Hai URL blob bị chèn dấu ba chấm Unicode `…` vào SHA. Href của bản nộp thực sự chứa `%E2%80%A6`; không phải chỉ nhãn hiển thị được rút gọn. Thầy xác nhận commit đầy đủ và hai file tồn tại, đã cho đường dẫn sửa.

Thầy ghi các tiêu chí khác đều đạt, ghi nhận công việc thực chất/phân công, sự trung thực về trạng thái và kế hoạch tuần4. Vì vậy không có căn cứ kết luận lỗi CI, công việc chuẩn hóa tuần4 hoặc thiếu deploy là lý do từ chối lần này. CI còn fail và các phần chưa kiểm vẫn phải giữ đúng trong báo cáo.

Hai link đúng:

- [Danh mục vai trò và quyền](https://github.com/nguyentronglinh045/pos-cafe/blob/0dd63ea81b27a38800044a55a7f9c8f12f87cad0/src/seed/permissionCatalog.json)
- [Kiểm tra quyền quản trị backend](https://github.com/nguyentronglinh045/pos-cafe/blob/0dd63ea81b27a38800044a55a7f9c8f12f87cad0/supabase/candidate/permission-administration.sql#L308-L326)

Root xác minh lại bằng git cat-file -e hai path tại đúng commit, cả hai exit0. Không gọi đây là live HTTP test; nguồn GVHD đã ghi kiểm tra mở được. Bản root đã đưa trong chat24/10 chứa SHA đầy đủ; chưa xác định dấu ba chấm được đưa vào ở bước biên tập/copy nào, không quy lỗi cho người hoặc công cụ cụ thể.

## Đề xuất trả lời người dùng

- Nêu rõ chỉ hai vấn đề thầy yêu cầu sửa, cùng đường dẫn nguồn; phần kỹ thuật và kế hoạch tuần4 được ghi nhận đạt.
- Thừa nhận bản AI soạn trước không phù hợp quy định tự viết vừa được biết. Không soạn một bản mới rồi gắn nhãn sinh viên tự viết hoặc đề nghị che việc dùng AI.
- Mỗi thành viên tự viết lại phần của mình. Với Linh, dùng dữ kiện đã xác minh làm ghi chú, tự trình bày việc đã làm, điều đã kiểm/hiểu, phần còn dở và trọng tâm chuẩn hóa tuần4. Phân biệt việc trực tiếp thực hiện với việc AI/công cụ hỗ trợ; không mặc định sinh viên tự chạy mọi test.
- AI chỉ hỗ trợ kiểm số liệu, đối chiếu nguồn/link và chỉ ra chỗ sai/khó hiểu của bản sinh viên tự viết; mức hỗ trợ ngôn ngữ phải phù hợp quy định môn, không tự cho rằng được phép AI viết lại câu chữ.
- Khai báo AI trung thực. Chỉ bỏ cụm “soạn báo cáo” hoặc chuyển sang Không không giải quyết yêu cầu tự viết. Sau khi thực sự tự viết bản sửa, có thể phân biệt bản trước do AI hỗ trợ soạn với bản nộp lại do sinh viên viết; không nhận điều đó đã xảy ra.
- Thay đúng hai URL bằng SHA đầy đủ; tên hiển thị được ngắn, địa chỉ đích không được chèn dấu ba chấm. Bấm kiểm từng link trước nộp.
- Giữ kế hoạch tuần4 chuẩn hóa kiến trúc, tinh gọn dự án và regression. Có thể viết ngắn/gần cách nói của người dùng hơn nhưng không đổi thành thành tích đã làm; không phải yêu cầu làm lại code để xử lý lý do từ chối.
- Đề xuất bản cuối có tên từng thành viên, việc đã làm, kết quả/chưa xong, minh chứng và việc tuần4. Đây là hướng dẫn, không phải báo cáo nộp thay sinh viên. Không khẳng định chắc chắn được duyệt lại.

## Kiểm chứng và bàn giao

Không sửa form, không nhấn Sửa/Nộp, không gửi tin nhắn hoặc thay cấu hình. Chỉ thêm hồ sơ mới này, giữ báo cáo cũ làm lịch sử. Chờ review độc lập về cách hiểu nhận xét, tính trung thực và phạm vi đề xuất; không cần chạy app/DB hoặc tạo reviewer đệ quy.

Review cuối: `/root/weekly_report_review` APPROVE candidate SHA256 `EBCB0D72E8EA3EA33ADD9645B4BD15E48D43228BEFC3BD855F9023BBDEED95AE`, không finding chặn. Reviewer kiểm hướng sửa theo nguồn UI root cung cấp, không kiểm lại UI/repo/runtime, không sửa file. Metadata này thêm sau freeze, nội dung đề xuất giữ nguyên.