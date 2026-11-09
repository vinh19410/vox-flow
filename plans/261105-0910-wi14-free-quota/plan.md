---
title: "Hạn mức miễn phí (`free-quota`)"
description: "Chi phí chấm của gói miễn phí nằm trong tầm kiểm soát: mỗi học viên 3 điểm/ngày, có trần toàn hệ thống, và học viên luôn thấy số điểm còn lại."
status: pending
priority: P1
effort: 2d
issue: 18
branch: vinh19410/feat/free-quota
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi20-forecast-practice]
created: 2026-11-05
---

# Hạn mức miễn phí (`free-quota`)

Tracking: #18

Mục 14 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `free-quota`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Chi phí chấm của gói miễn phí nằm trong tầm kiểm soát: mỗi học viên 3 điểm/ngày, có trần toàn hệ thống, và học viên luôn thấy số điểm còn lại.

## Phụ thuộc
- Phải chờ: #17
- Mở khóa: #21, #24

## Constraints
- 3 điểm/ngày và trần toàn hệ thống đã chốt ở OQ-1.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Trang quản trị trần; đổi bằng biến môi trường.
- Sửa lời hứa ở landing; thuộc #13.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Ghi nhận hạn mức ở server](./phase-01-ghi-nhan-han-muc-o-server.md) | Pending |
| 2 | [Phase 2: Hiển thị điểm còn lại](./phase-02-hien-thi-diem-con-lai.md) | Pending |

## Acceptance Criteria
- [ ] Full Test trừ 3 điểm, mỗi Part trừ 1 điểm, tối đa 3 điểm/ngày.
- [ ] Điểm đặt lại theo giờ Việt Nam.
- [ ] Hết trần toàn hệ thống thì học viên miễn phí chờ hôm sau; học viên trả phí không bị chặn.
- [ ] Hai yêu cầu đồng thời không thể vượt hạn mức.
- [ ] Học viên thấy điểm còn lại trước khi bắt đầu.

## Câu hỏi mở
- Có hoàn điểm khi chấm thất bại không? Plan đề xuất có, cần xác nhận.
- Điểm chưa dùng có cộng dồn không? Plan giả định không.

<!-- slug: wi14-free-quota -->
