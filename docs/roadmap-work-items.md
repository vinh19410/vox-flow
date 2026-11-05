---
type: roadmap-work-items
status: draft
updated: 2026-11-05
links: [docs/roadmap-chamro.md]
---

# Vox Flow (ChấmRõ) — Danh sách công việc theo roadmap

**Trạng thái:** ✅ Xong · 🟢 Làm được ngay · ⏸️ Hold (chờ quyết định hoặc yếu tố ngoài) · 🔒 Chờ việc khác

**Phụ thuộc:** số là việc phải xong trước; "(mềm)" là nên chờ nhưng không chặn.

| # | Công việc | Giai đoạn | Trạng thái | GitHub issue | Phải chờ | Ghi chú |
|---|---|---|---|---|---|---|
| 01 | Clone UI prototype vào `apps/web` | Nền | ✅ | [#1](https://github.com/vinh19410/vox-flow/issues/1) (đang mở) | – | PR #2 đã vào `dev`, chưa lên `main`; đóng issue khi code lên `main`. Vẫn còn dữ liệu giả. Chưa thử đăng nhập thật. |
| 02 | Chốt 12 điểm lệch, cập nhật PRD, thay roadmap cũ | Nền | 🟢 | Chưa có | – | Mở khóa việc viết SRS. PRD và feature map còn lệch về đăng nhập, paywall và nhiều điểm khác. |
| 03 | Thử chấm 30 bài mẫu, chọn dịch vụ giọng nói + AI (OQ-5) | Nền | ⏸️ | Chưa có | 30 bài mẫu có đồng ý bằng văn bản | Rủi ro lớn nhất. Kết quả cũng quyết định trần miễn phí và giá. |
| 04 | Tư vấn luật sư về chuyển audio ra nước ngoài (OQ-6) | Nền | ⏸️ | Chưa có | Buổi tư vấn | Không chặn việc xây sản phẩm, chỉ chặn mở cho học viên thật. |
| 05 | Kiểm chứng mức sẵn lòng trả | Nền | 🟢 | Chưa có | – | `billing` đang dựa trên giả định. |
| 06 | Dựng môi trường backend Cloudflare | Nền | 🟢 | Chưa có | – | Thêm ngoài roadmap. Báo cáo so giao diện ghi backend chưa chạy được vì thiếu thông tin xác thực Cloudflare. |
| 07 | Đăng nhập Google | Nền | 🔒 | Chưa có | 06 | Thêm ngoài danh sách tính năng (roadmap chỉ coi là phụ thuộc ngoài). Code hiện chỉ có email + mật khẩu. |
| 08 | Thiết lập SePay | Nền | 🟢 | Chưa có | 04 (mềm) | Nên chờ luật sư trả lời có cần đăng ký hộ kinh doanh trước khi thu tiền không. |
| 09 | Landing (`landing-page`) | Now | 🟢 | Chưa có | – | Chưa có tài liệu BA. `pricing-teaser.tsx:22` ghi "Thi thử không giới hạn", trái với hạn mức đã chốt. |
| 10 | Tài khoản & mục tiêu (`onboarding`) | Now | 🔒 | Chưa có | 07, 02, 09 (mềm) | SRS đang `stale`, cần cập nhật theo 02. |
| 11 | Quyền riêng tư (`privacy-controls`) | Now | 🔒 | Chưa có | 10, 02 | Có đủ bộ tài liệu nháp. Còn phải chốt cách gọi "huấn luyện AI" hay "hiệu chuẩn". |
| 12 | Thi thử AI (`mock-exam`) | Now | 🔒 | Chưa có | 03, 10, 11 | Mới có brainstorm, cần chạy `/srs`. |
| 13 | Chấm điểm & bằng chứng (`scoring-results`) | Now | 🔒 | Chưa có | 03, 11, 12 | Chưa có tài liệu. Ngưỡng đạt: ≥ 80% bài lệch trong 0.5 band. |
| 14 | Hạn mức miễn phí (`free-quota`) | Now | 🔒 | Chưa có | 13 | Đã chốt 3 điểm/ngày. Trần toàn hệ thống còn chỉnh theo 03. |
| 15 | Mua gói & QR (`billing`) | Now | 🔒 | Chưa có | 08, 10, 13, 05 (mềm) | Sửa `billing-screen.tsx:34`, đang ghi "Band tổng không giới hạn". |
| 16 | Đối soát thanh toán (`payment-reconciliation`) | Now | 🔒 | Chưa có | 08, 15 | Phải xong trước khi thu tiền thật. |
| 17 | **Mốc: mở cho học viên thật đầu tiên** | Now | 🔒 | Chưa có | 04, 09–16 | Thêm ngoài roadmap theo OQ-6. Đây là cổng kiểm tra, không phải tính năng. |
| 18 | Tiến độ band (`progress-history`) | Next | 🔒 | Chưa có | 11, 13 | Có thể làm song song với 21 và 24. |
| 19 | Cập nhật đề forecast (`forecast-curation`) | Next | 🟢 | Chưa có | 04 (mềm) | Không vướng phụ thuộc cứng. Luật sư cần trả lời rủi ro bản quyền của nguồn web. |
| 20 | Luyện forecast (`forecast-practice`) | Next | 🔒 | Chưa có | 12, 13, 15, 19 | Chờ nhiều việc nhất trong nhóm Next. |
| 21 | Luyện mỗi ngày (`daily-practice`) | Next | 🔒 | Chưa có | 13 | Cần bám lỗi thật của học viên. |
| 22 | Chọn dịch vụ email + thông báo đẩy | Next | 🟢 | Chưa có | – | Chưa cần làm sớm, vì chỉ 23 phụ thuộc vào việc này. |
| 23 | Nhắc luyện & hết hạn gói (`practice-reminder`) | Next | 🔒 | Chưa có | 15, 21, 22 | Tối đa 1 nhắc/ngày. Effort S có thể đã thấp so với phạm vi mới. |
| 24 | Báo lỗi chấm (`score-dispute`) | Next | 🔒 | Chưa có | 11, 13 | Không ra mắt riêng trước 25. |
| 25 | Xử lý báo lỗi bản tối thiểu (GAP-03) | Next | 🔒 | Chưa có | 24 | Hàng đợi, mẫu trả lời, cảnh báo quá hạn; giữ cam kết 72 giờ. |
| 26 | Xử lý báo lỗi bản mở rộng (GAP-03) | Later | 🔒 | Chưa có | 25 | Tìm thêm người khi quá 5 báo lỗi/tuần hoặc đúng hạn dưới 90%. |
