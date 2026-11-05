---
phase: 2
title: "Ghi kết quả tư vấn luật sư và đóng OQ-6"
status: blocked
priority: P1
effort: "1 buổi"
dependencies: ["phase-01"]
external_blocker: "Buổi tư vấn với luật sư"
---

# Phase 2: Ghi kết quả tư vấn luật sư và đóng OQ-6

## Goal
Sau khi buổi làm việc với luật sư hoàn tất và có câu trả lời bằng văn bản từ luật sư, ghi nhận câu trả lời chính thức vào `docs/legal/oq-6-tu-van-luat-su.md`, lập danh sách việc phải làm kèm người phụ trách/thời hạn, và đóng OQ-6 trong roadmap để mở khóa các mốc tiếp theo.

## Files to Create / Modify
- Modify: `docs/legal/oq-6-tu-van-luat-su.md`
- Modify: `docs/roadmap-chamro.md`
- Modify: `docs/roadmap-work-items.md`

## External Dependency Gate
Phase này bị chặn cho đến khi diễn ra buổi tư vấn với luật sư ngoài đời thực.
Agent KHÔNG được tự ý thực thi phase này nếu chưa có tín hiệu xác nhận của Người sở hữu sản phẩm (Product Owner).
Tín hiệu hợp lệ gồm một trong các điều kiện:
1. Comment trên GitHub issue #8 từ tài khoản `@vinh19410` bắt đầu bằng `Đã tư vấn:` kèm ngày và hình thức biên bản (văn bản/email).
2. Tài liệu biên bản trả lời bằng văn bản được người sở hữu sản phẩm cung cấp trực tiếp trong phiên làm việc.

## Tasks & Steps

### Task 2.0 — Kiểm tra cổng phụ thuộc buổi tư vấn
- Goal: Đảm bảo có biên bản/ý kiến tư vấn chính thức từ luật sư trước khi ghi nhận.
- Target files and symbols: GitHub issue #8 hoặc file biên bản người sở hữu cung cấp.
- Steps:
  1. Kiểm tra comment xác nhận của `@vinh19410` trên issue #8 hoặc biên bản trả lời do người sở hữu cung cấp.
  2. Nếu chưa có tín hiệu, DỪNG LẠI và thông báo "Chờ phụ thuộc ngoài: Buổi tư vấn với luật sư". Không coi đây là lỗi kỹ thuật.
- Verify: PO xác nhận trực tiếp trong phiên hoặc lệnh `gh issue view 8 --json comments --jq '.comments[].body' | grep 'Đã tư vấn:'` có kết quả.

### Task 2.1 — Ghi nhận câu trả lời của luật sư
- Goal: Cập nhật câu trả lời chính thức của luật sư vào từng câu hỏi trong `docs/legal/oq-6-tu-van-luat-su.md`.
- Target files and symbols: `docs/legal/oq-6-tu-van-luat-su.md`
- Steps:
  1. Dưới mỗi `## Câu 1` đến `## Câu 7` và các mục bổ sung, ghi nhận mục `### Trả lời: <nội dung lời khuyên của luật sư>`.
  2. Ghi rõ `Nguồn: Luật sư [Tên/Văn phòng], ngày [YYYY-MM-DD], hình thức [Email/Văn bản tư vấn]`.
  3. Nếu luật sư từ chối hoặc câu hỏi nằm ngoài phạm vi, ghi rõ `Trả lời: Ngoài phạm vi buổi tư vấn — [Hướng xử lý/chuyển tiếp]`.
  4. Tuyệt đối không tự suy diễn hoặc thay thế kết luận luật định bằng ý kiến cá nhân của AI.
- Success criteria: Đủ câu trả lời cho các câu hỏi với nguồn dẫn chứng.
- Verify: `grep -c '^### Trả lời:' docs/legal/oq-6-tu-van-luat-su.md` in ít nhất `7`.

### Task 2.2 — Lập danh mục việc phải làm và đóng OQ-6
- Goal: Chuyển kết luận tư vấn thành danh mục hành động cụ thể cho dự án và đóng OQ-6.
- Target files and symbols: `docs/legal/oq-6-tu-van-luat-su.md`, `docs/roadmap-chamro.md`, `docs/roadmap-work-items.md`
- Steps:
  1. Thêm mục `## Việc phải làm` trong `docs/legal/oq-6-tu-van-luat-su.md` liệt kê rõ:
     - Đăng ký Hộ kinh doanh trước khi thu tiền qua SePay (nếu luật sư yêu cầu).
     - Thời hạn nộp hồ sơ chuyển dữ liệu ra nước ngoài (A05) tính từ ngày chuyển dữ liệu đầu tiên (nếu có chuyển audio ra nước ngoài).
     - Phạm vi quyền xóa dữ liệu và công tắc hiệu chuẩn.
  2. Cập nhật `docs/roadmap-chamro.md`: chuyển `- [ ] OQ-6` thành `- [x] OQ-6: Resolved: ... (xem chi tiết tại docs/legal/oq-6-tu-van-luat-su.md)`.
  3. Cập nhật `docs/roadmap-work-items.md`: chuyển trạng thái mục 04 sang `🟢` hoặc `✅`.
  4. Đóng GitHub issue #8 sau khi PR của Phase 2 được duyệt và merge.
- Success criteria: OQ-6 được đóng chính thức với đầy đủ căn cứ và danh mục hành động.
- Verify: `grep -c '^- \[x\] OQ-6' docs/roadmap-chamro.md` in `1`.

## Verification
1. `grep -c '^### Trả lời:' docs/legal/oq-6-tu-van-luat-su.md` >= 7.
2. `grep -c '^- \[x\] OQ-6' docs/roadmap-chamro.md` in `1`.
## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Nếu thiếu kết quả tư vấn từ người sở hữu sản phẩm, đây là trạng thái CHỜ PHỤ THUỘC NGOÀI, không phải lỗi kỹ thuật. Không kích hoạt vòng lặp sửa lỗi hay phỏng đoán ý kiến luật sư. Báo cáo rõ trạng thái cho người sở hữu sản phẩm.
