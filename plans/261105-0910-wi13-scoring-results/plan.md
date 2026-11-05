---
title: "Chấm điểm & bằng chứng (`scoring-results`)"
description: "Mọi lượt thi được chấm thật 3 lần độc lập, lấy trung vị và có khoảng tin cậy; học viên xem band tổng miễn phí, còn chi tiết 4 tiêu chí kèm bằng chứng nằm sau paywall."
status: pending
priority: P1
effort: 6d
issue: 17
branch: vinh19410/feat/scoring-results
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0909-wi03-scoring-eval-oq5, project:261105-0910-wi11-privacy-controls, project:261105-0910-wi12-mock-exam]
blocks: [project:261105-0910-wi14-free-quota, project:261105-0910-wi15-billing-qr, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi18-progress-history, project:261105-0910-wi20-forecast-practice, project:261105-0910-wi21-daily-practice, project:261105-0910-wi24-score-dispute]
created: 2026-11-05
---

# Chấm điểm & bằng chứng (`scoring-results`)

Tracking: #17

Mục 13 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `scoring-results`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Mọi lượt thi được chấm thật 3 lần độc lập, lấy trung vị và có khoảng tin cậy; học viên xem band tổng miễn phí, còn chi tiết 4 tiêu chí kèm bằng chứng nằm sau paywall.

## Phụ thuộc
- Phải chờ: #7, #15, #16
- Mở khóa: #18, #19, #21, #22, #24, #25, #28

## Constraints
- Chấm 3 lần áp dụng cho mọi lượt, kể cả gói miễn phí.
- Ngưỡng đạt theo OQ-5, không tự hạ.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Đếm hạn mức; thuộc #18.
- Luyện lại câu yếu, trừ khi #6 (D-05) đưa vào đây.
- Báo lỗi chấm; thuộc #28.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Pipeline chấm](./phase-01-pipeline-cham.md) | Pending |
| 2 | [Phase 2: Kiểm tra độ chính xác và phân quyền](./phase-02-kiem-tra-do-chinh-xac-va-phan-quyen.md) | Pending |
| 3 | [Phase 3: Nối giao diện](./phase-03-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Mọi lượt chấm 3 lần độc lập, lấy trung vị, có khoảng tin cậy.
- [ ] Bằng chứng trích đúng câu học viên đã nói.
- [ ] Phân quyền paywall kiểm tra ở server, không chỉ ẩn trên giao diện.
- [ ] Chấm lỗi có trạng thái rõ ràng, thử lại được và không mất bài.
- [ ] Trên bộ mẫu của #7 đạt ≥ 80% bài lệch trong 0.5 band và ≥ 90% bài có độ chênh 3 lần ≤ 0.5 band.

## Câu hỏi mở
- Chưa có tài liệu BA cho tính năng này; cần chạy `/srs scoring-results` trước khi code không?
- Nếu pipeline thật không đạt ngưỡng dù #7 đạt thì xử lý thế nào?

<!-- slug: wi13-scoring-results -->
