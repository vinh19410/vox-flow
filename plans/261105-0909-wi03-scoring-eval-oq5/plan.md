---
title: "Thử chấm 30 bài mẫu và chọn dịch vụ giọng nói + AI (OQ-5)"
description: "Có số liệu đo được để chọn một tổ hợp dịch vụ nhận dạng, chấm phát âm và mô hình chấm, đồng thời có chi phí thật để chỉnh trần miễn phí và kiểm tra mức giá."
status: pending
priority: P1
effort: 5d
issue: 7
branch: vinh19410/feat/scoring-eval-oq5
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
- Không commit audio hay transcript.
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.

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
- Dịch vụ nhận dạng riêng của Hướng B dùng nhà cung cấp nào?
- Nếu không cấu hình nào đạt ngưỡng thì dừng sản phẩm, hạ phạm vi chấm hay thử thêm hướng khác?

<!-- slug: wi03-scoring-eval-oq5 -->
