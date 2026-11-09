---
title: "Thử chấm 30 bài mẫu và chọn dịch vụ giọng nói + AI (OQ-5)"
description: "Có số liệu đo được để chọn một tổ hợp dịch vụ nhận dạng, chấm phát âm và mô hình chấm, đồng thời có chi phí thật để chỉnh trần miễn phí và kiểm tra mức giá."
status: pending
priority: P1
effort: 5d
issue: 7
branch: vinh19410/vox-flow-ai-7
tags: [experimental, advice]
blockedBy: []
blocks: [project:261105-0910-wi12-mock-exam, project:261105-0910-wi13-scoring-results]
created: 2026-11-05
---

# Thử chấm 30 bài mẫu và chọn dịch vụ giọng nói + AI (OQ-5)

Tracking: #7

Mục 03 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Có số liệu đo được để chọn một tổ hợp dịch vụ nhận dạng, chấm phát âm và mô hình chấm, đồng thời có chi phí thật để chỉnh trần miễn phí và kiểm tra mức giá.

## Phụ thuộc
- Phải chờ: Không có
- Yếu tố ngoài: 30 bài mẫu có đồng ý bằng văn bản; Tài khoản dùng thử Azure Speech, dịch vụ nhận dạng riêng, SpeechSuper và Anthropic API
- Mở khóa: #16, #17

## Constraints
- Theo OQ-6, thử bằng bài mẫu có đồng ý không bị chặn bởi buổi tư vấn luật sư, nhưng chỉ dùng người đã đồng ý bằng văn bản.
- Pháp lý & chuyển dữ liệu ra nước ngoài: cần xác nhận văn bản đồng ý bao gồm cả việc xử lý bởi nhà cung cấp nước ngoài (Azure, OpenAI, SpeechSuper, Anthropic). Lưu ý mốc 60 ngày theo Luật 91/2025/QH15 kể từ lần đầu chuyển dữ liệu âm thanh ra nước ngoài.
- Không commit audio, transcript hay kết quả thô vào git.
- Không commit secret; dùng `.env` cục bộ (được gitignore) và kiểm tra qua `scripts/scoring-eval/.env.schema` bằng varlock; không dùng secret của Cloudflare Worker cho script CLI này.
## Non-goals
- Xây pipeline chấm thật; việc đó thuộc #17.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Chuẩn bị bài mẫu và điểm chuẩn](./phase-01-chuan-bi-bai-mau-va-diem-chuan.md) | Pending |
| 2 | [Phase 2: Chạy đánh giá và chọn cấu hình](./phase-02-chay-danh-gia-va-chon-cau-hinh.md) | Pending |

## Acceptance Criteria
- [ ] Đủ 30 bài mẫu có đồng ý bằng văn bản, được người sở hữu sản phẩm chấm mù trước khi xem kết quả AI.
- [ ] Đánh giá đủ 6 cấu hình: 2 hướng dịch vụ nhân 3 mô hình, mỗi bài chấm 3 lần.
- [ ] Báo cáo nêu rõ tỷ lệ lệch trong 0.5 band, tỷ lệ độ chênh giữa 3 lần chấm ≤ 0.5 band, và chi phí mỗi Full Test và Part.
- [ ] OQ-5 trong `docs/roadmap-chamro.md` được đóng với cấu hình đã chọn, hoặc ghi rõ không cấu hình nào đạt.

## Câu hỏi mở
1. Dịch vụ nhận dạng riêng của Hướng B dùng nhà cung cấp nào? -> Đề xuất mặc định: OpenAI Whisper API kết hợp SpeechSuper (ước tính ~11.908đ/Full Test), người sở hữu sản phẩm có thể đổi trước khi chạy.
2. Nếu không cấu hình nào đạt ngưỡng thì dừng sản phẩm, hạ phạm vi chấm hay thử thêm hướng khác? -> Xử lý theo 3 nhánh rõ ràng trong Task 2.2: nếu không cấu hình nào đạt hoặc chi phí vượt 12.000đ, báo cáo ghi `Đạt ngưỡng: không`, giữ OQ-5 mở `[ ]` và chuyển người sở hữu sản phẩm quyết định.

## Red Team Review

### Phiên rà soát — 2026-11-05
**Kết quả:** 3 phát hiện trọng yếu đã được xử lý (Security Adversary & Assumption Destroyer).

| # | Phát hiện | Mức độ | Xử lý | Áp dụng vào |
|---|-----------|--------|-------|-------------|
| 1 | Bế tắc cơ học trong lệnh Verify của Task 2.2 khi kết quả đánh giá là không đạt ngưỡng | Critical | Chấp nhận | Phase 2 (tách 3 nhánh kết quả: đạt, không đạt độ chính xác, vượt trần chi phí) |
| 2 | Lệch kiến trúc quản lý secret giữa Cloudflare Worker và script CLI cục bộ | Critical | Chấp nhận | Plan & Phase 1, 2 (dùng varlock `scripts/scoring-eval/.env.schema` thay vì Worker secret) |
| 3 | Nguy cơ prompt injection qua transcript âm thanh và định danh model Anthropic | Critical | Chấp nhận | Phase 2 (thêm ranh giới XML `<candidate_transcript>`, Zod schema cho band 0.0-9.0, cấu hình map model) |
<!-- slug: wi03-scoring-eval-oq5 -->
