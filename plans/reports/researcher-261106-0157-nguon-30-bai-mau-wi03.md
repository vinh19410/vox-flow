# Nguồn thu 30 bài mẫu cho đánh giá chấm điểm (WI-03, Issue #7)

Thời điểm nghiên cứu: 2026-11-06. Phạm vi: tìm nguồn audio nói tiếng Anh có điểm người chấm, phục vụ chọn dịch vụ chấm. Mức tin cậy: vừa, vì chỉ có kết quả tìm kiếm, chưa đọc nguyên văn các giấy phép.

## Kết luận

Không có bộ dữ liệu công khai nào vừa là IELTS Speaking, vừa do giám khảo thật chấm band, vừa của học viên Việt, vừa cho phép dùng thương mại. Vì vậy nguồn chính phải là học viên thật có đồng ý bằng văn bản, đúng như plan WI-03 đã yêu cầu. Dữ liệu công khai chỉ nên là bước kiểm tra phụ.

## Dữ liệu công khai đã xét

| Nguồn | Có gì | Vấn đề |
|---|---|---|
| [Speak & Improve Corpus 2025](https://researchdatasets.cambridge.org/datasets/speak-and-improve-corpus-2025) | Khoảng 315 giờ, mức A2–C1, có điểm CEFR do giám khảo không chính thức chấm | Giấy phép chỉ cho nghiên cứu và giáo dục phi thương mại, phải đăng ký, không được chia sẻ lại. Chỉ được dùng với LLM tự host hoặc API không giữ dữ liệu để huấn luyện. Thang CEFR chứ không phải band IELTS. Chưa xác nhận có người nói tiếng Việt. |
| [LearnerVoice](https://arxiv.org/pdf/2407.04280) | Lời nói tự nhiên của 58 người Hàn | Nhãn band do công cụ dự đoán, không phải giám khảo. Sai số RMSE 0.66 so với nhãn gốc, lớn hơn ngưỡng 0.5 của bạn. |
| [L2-ARCTIC](https://psi.engr.tamu.edu/l2-arctic-corpus/) | Có 4 người nói tiếng Việt | Chỉ là giọng đọc, không có điểm trình độ. Chỉ dùng được để thử riêng phần phát âm. |
| [Seedhouse et al. 2014](https://ielts.org/cdn/Research/relationship-between-speaking-features-and-band-descriptors-seedhouse-et-al-2014.pdf) | 60 bài IELTS Speaking thật, band 5–8 | Chưa xác nhận có công bố audio. Cần hỏi tác giả hoặc chương trình nghiên cứu của IELTS. |
| [Corpus của EdUHK](https://corpus.eduhk.hk/english_speaking/?p=59) | 24 bộ audio, phần lớn từ trang IELTS chính thức | Quy mô nhỏ, không rõ giấy phép và điểm. |

## Nguồn nên dùng: học viên thật

Các kênh dưới đây là đề xuất của tôi, chưa được kiểm chứng bằng tìm kiếm. Hãy xem như giả thuyết để thử:

1. Người quen và học viên đang luyện IELTS trong mạng lưới của bạn. Đây là kênh nhanh và dễ xin đồng ý nhất.
2. Nhóm Facebook, Zalo, Discord luyện IELTS Speaking. Đăng lời mời, tặng đổi lại một bản nhận xét miễn phí.
3. Trung tâm luyện thi hoặc giáo viên IELTS tự do. Họ có sẵn học viên và có thể cho điểm tham chiếu thứ hai.
4. Câu lạc bộ tiếng Anh ở trường đại học.

Cách làm để phủ đủ dải band: nhắm tới khoảng 5–8 band, mỗi band tối thiểu vài bài, và trộn Part 1, 2, 3 theo cột `mode` của `samples.csv`. Nếu cả 30 bài đều band 6, kết quả sẽ không phân biệt được các cấu hình.

## Điều kiện bắt buộc cho mỗi bài

- Văn bản đồng ý phải nêu rõ audio được gửi sang nhà cung cấp nước ngoài (Azure, OpenAI, SpeechSuper, Anthropic), như `plan.md` đã ghi.
- Mã hóa danh tính trong `samples.csv`, không lưu tên.
- Tính mốc 60 ngày theo Luật 91/2025/QH15 kể từ lần đầu chuyển audio ra nước ngoài.

## Rủi ro đáng nói thẳng

Plan hiện để người sở hữu sản phẩm tự điền `human_band` cho cả 30 bài. Đó là một người chấm duy nhất, và chưa chắc là giám khảo IELTS chính thức. Nếu điểm chuẩn lệch, ngưỡng "80% trong 0.5 band" sẽ không có ý nghĩa. Nên nhờ thêm ít nhất một giáo viên IELTS chấm độc lập, hoặc lấy học viên đã có kết quả thi thật.

## Bước tiếp theo

1. Soạn mẫu văn bản đồng ý (chờ luật sư xác nhận nếu cần) và kêu gọi tình nguyện viên qua kênh 1 và 2.
2. Hẹn một giáo viên IELTS làm người chấm thứ hai.
3. Song song, đăng ký Speak & Improve để thử phụ phần ổn định, nhưng chỉ khi đọc giấy phép thấy việc đánh giá nhà cung cấp cho sản phẩm thương mại không bị coi là dùng thương mại.

## Câu hỏi còn mở

- Speak & Improve có người nói tiếng Việt không, và việc dùng nó để chọn nhà cung cấp cho sản phẩm có tính là thương mại không?
- Seedhouse và cộng sự có chia sẻ audio của 60 bài không?
- Ai là người chấm chuẩn: chỉ người sở hữu sản phẩm, hay thêm giáo viên IELTS?
