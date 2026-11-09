# Quyết định: Đánh giá điều kiện mở rộng xử lý báo lỗi điểm thi (WI-26)

- **Dự án:** Vox Flow — Luyện thi IELTS Speaking với AI
- **Mã công việc:** WI-26 (`#30` — `dispute-handling-extended`, GAP-03 bản mở rộng)
- **Giai đoạn roadmap:** Later (P3, 🔒 Chờ điều kiện kích hoạt)
- **Phụ thuộc tiên quyết:** #29 (GAP-03 bản tối thiểu) — Đã hoàn thành (CLOSED)
- **Ngày đánh giá:** 2026-11-05
- **Tác giả:** Product Owner & Vibe Pipeline (Kongming Advisory Supervision)

---

## 1. Tóm tắt kết quả đánh giá (Evaluation Summary)

Theo quy định tại PRD (mục 3.2, 4.5), Roadmap (`docs/roadmap-work-items.md:41`), và Kế hoạch thực hiện `plans/261105-0910-wi26-dispute-handling-extended/`:
- **Điều kiện kích hoạt mở rộng:** Chỉ bắt đầu triển khai vai trò giám khảo cộng tác viên và cơ chế phân công khi lượng báo lỗi vượt quá khả năng xử lý của 1 người, cụ thể là: **quá 5 báo lỗi/tuần hoặc tỷ lệ phản hồi đúng hạn (SLA 72 giờ) dưới 90%**.
- **Hiện trạng hệ thống:**
  - Cờ tính năng `SCORE_DISPUTE_ENABLED` mặc định `false` trong mã nguồn tại `packages/infra/alchemy.run.ts:29`, chưa kiểm tra giá trị đã triển khai.
  - Hệ thống đang trong giai đoạn phát triển tiền ra mắt (pre-launch), chưa mở cổng tiếp nhận khiếu nại công khai cho người dùng diện rộng.
  - Số liệu thực tế từ hệ thống:
    - Báo lỗi/tuần: chưa có dữ liệu thật (cờ `SCORE_DISPUTE_ENABLED` mặc định `false` tại `alchemy.run.ts:29`, chưa kiểm tra giá trị đã triển khai)
    - Tỷ lệ đúng hạn: chưa có dữ liệu thật

---

## 2. Số liệu & Quyết định

Báo lỗi/tuần: chưa có dữ liệu thật (cờ `SCORE_DISPUTE_ENABLED` mặc định `false` tại `alchemy.run.ts:29`, chưa kiểm tra giá trị đã triển khai)
Tỷ lệ đúng hạn: chưa có dữ liệu thật
Quyết định mở rộng: không

---

## 3. Lý do & Căn cứ kỹ thuật

1. **Tuân thủ cam kết tinh gọn (D-09 & PRD):**
   Quyết định D-09 (`docs/product-decisions.md`) đã chốt: Người sở hữu sản phẩm trực tiếp xử lý các khiếu nại chấm điểm (với chuyên môn IELTS) và đảm bảo cam kết SLA 72 giờ. Bản tối thiểu (GAP-03 tối thiểu tại WI-25 / #29) với hàng đợi quản trị, cảnh báo quá hạn 12 giờ qua Cloudflare Cron và bảo vệ quyền riêng tư audio theo `shareConsent` đã đáp ứng đầy đủ nhu cầu vận hành hiện tại.

2. **Tránh xây dựng suy đoán (Anti-speculative engineering):**
   Việc phân quyền vai trò giám khảo (`assignedTo`, `examinerProcedure`) và xuất bộ dữ liệu hiệu chuẩn (`calibration-export.ts`) thuộc nhóm tính năng Later. Việc viết mã trước khi có áp lực vận hành thực tế vi phạm nguyên tắc không làm trước khi đạt điều kiện kích hoạt ("Không làm trước khi đạt điều kiện kích hoạt" — Constraint của WI-26).

3. **Thực thi Failure Protocol của Phase 1:**
   Theo `phase-01-xac-nhan-dieu-kien-kich-hoat.md` (Task 1.1, Bước 3): *"Nếu chưa đạt điều kiện, dừng plan ở đây."*
   Dừng thực thi tại Phase 1 và giữ nguyên hiện trạng mã nguồn là hành vi đúng theo thiết kế của quy trình, không phải lỗi kỹ thuật.

---

## 4. Điều kiện xem xét lại (Re-evaluation Trigger)

Đánh giá mở rộng (Phase 2) sẽ được xem xét mở lại khi thỏa mãn một trong hai điều kiện:
- Số lượng báo lỗi mới trong tuần (`weeklyCount` từ `disputeAdmin.metrics`) > 5.
- Tỷ lệ xử lý đúng hạn 72 giờ (`onTimeRate` từ `disputeAdmin.metrics`) < 90%.

Khi đạt điều kiện trên, thực hiện kích hoạt lại plan `plans/261105-0910-wi26-dispute-handling-extended/` để triển khai Phase 2.
