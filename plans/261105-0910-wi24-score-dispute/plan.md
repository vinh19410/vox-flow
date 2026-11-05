---
title: "Báo lỗi chấm (`score-dispute`)"
description: "Học viên có quyền phản biện điểm: gửi báo lỗi kèm audio và transcript, khi đã đồng ý chia sẻ, và theo dõi được trạng thái."
status: pending
priority: P2
effort: 2d
issue: 28
branch: vinh19410/feat/score-dispute
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi11-privacy-controls, project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi25-dispute-handling-minimal]
created: 2026-11-05
---

# Báo lỗi chấm (`score-dispute`)

Tracking: #28

Mục 24 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `score-dispute`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên có quyền phản biện điểm: gửi báo lỗi kèm audio và transcript, khi đã đồng ý chia sẻ, và theo dõi được trạng thái.

## Phụ thuộc
- Phải chờ: #15, #17
- Mở khóa: #29

## Constraints
- Không ra mắt riêng trước #29: bật cho học viên chỉ khi có người xử lý.
- Theo OQ-4: giữ cam kết 72 giờ.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Hàng đợi xử lý; thuộc #29.
- Dùng dữ liệu báo lỗi để hiệu chuẩn; thuộc #30.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: API báo lỗi](./phase-01-api-bao-loi.md) | Pending |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Gửi báo lỗi được từ màn kết quả, kèm lý do.
- [ ] Audio và transcript chỉ đính kèm khi học viên đồng ý rõ cho lần báo đó.
- [ ] Mỗi bài chỉ có một báo lỗi đang mở.
- [ ] Hiện cam kết phản hồi trong 72 giờ và trạng thái.
- [ ] Không ra mắt trước #29.

## Câu hỏi mở
- Có giới hạn số báo lỗi mỗi học viên để tránh lạm dụng không?

<!-- slug: wi24-score-dispute -->
