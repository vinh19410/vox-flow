# Nợ kỹ thuật

Các việc đã biết là cần làm nhưng tạm hoãn có chủ đích. Mỗi mục ghi rõ hệ quả khi chưa trả và điều kiện bắt buộc phải trả.

| # | Ngày ghi | Hạng mục | Issue | Người chịu trách nhiệm | Trạng thái |
|---|---|---|---|---|---|
| TD-01 | 2026-11-11 | Bộ 30 bài mẫu đánh giá chấm điểm (OQ-5) | [#7](https://github.com/vinh19410/vox-flow/issues/7) | Người sở hữu sản phẩm | Đang nợ |

## TD-01: Bộ 30 bài mẫu đánh giá chấm điểm (OQ-5)

**Nợ gì:** #7 cần 30 bài nói có văn bản đồng ý và điểm chuẩn đáng tin để đo độ chính xác của AI chấm. Khung đánh giá đã có trên `dev` (`scripts/scoring-eval/`, PR #33), nhưng chưa chạy lượt chấm thật nào.

**Vì sao hoãn:** Chưa có nguồn nhãn chuẩn đáng tin. OQ-5 (`docs/roadmap-chamro.md`) đang ghi người sở hữu sản phẩm tự chấm mù, trong khi PRD (`docs/_product/prd.md`, Mục chỉ số) yêu cầu so với điểm của giám khảo thật. Người sở hữu sản phẩm hiện chưa cung cấp được bài mẫu và điểm giám khảo.

**Hệ quả khi chưa trả:**
- Chưa có bằng chứng AI chấm đạt ngưỡng "≥ 80% bài lệch trong 0.5 band". Mọi điểm hiển thị trên beta là điểm chưa kiểm chứng.
- OQ-5 vẫn mở: chưa chọn chính thức dịch vụ nhận dạng giọng nói và chấm phát âm.
- Trần miễn phí toàn hệ thống và giá gói vẫn dựa trên ước tính 8.000đ/Full Test, chưa đo thật.
- #17 (`scoring-results`) chưa thể đóng phần độ chính xác, kéo theo #18, #19 và mốc #21.

**Phải trả trước khi:** mở cho học viên thật (mốc #21) hoặc thu tiền thật (#19, #20).

**Hướng trả nợ đã bàn:**
1. Sửa OQ-5 để nhãn chuẩn là điểm của giám khảo có chứng chỉ, khớp với PRD. Đây là quyết định của người sở hữu sản phẩm.
2. Tùy chọn làm sớm, không thay thế bước 3: chạy thử trên bài mẫu công khai có band chính thức để loại cấu hình kém và đo chi phí thật. Không đủ để đóng OQ-5.
3. Bài thật của học viên Việt, có đồng ý, chấm độc lập bởi 1–2 cựu giám khảo. Có thể tuyển chung với đợt phỏng vấn #9. Cần kết quả #8 trước khi gửi âm thanh ra nước ngoài.
