---
title: "Nhắc luyện & hết hạn gói (`practice-reminder`)"
description: "Học viên được nhắc đúng lúc và không bị làm phiền: tối đa 1 nhắc luyện/ngày trên mọi kênh, cộng với thông báo hết hạn gói."
status: pending
priority: P2
effort: 4d
issue: 27
branch: vinh19410/feat/practice-reminder
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi15-billing-qr, project:261105-0910-wi21-daily-practice, project:261105-0910-wi22-email-push-provider]
blocks: []
created: 2026-11-05
---

# Nhắc luyện & hết hạn gói (`practice-reminder`)

Tracking: #27

Mục 23 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `practice-reminder`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên được nhắc đúng lúc và không bị làm phiền: tối đa 1 nhắc luyện/ngày trên mọi kênh, cộng với thông báo hết hạn gói.

## Phụ thuộc
- Phải chờ: #19, #25, #26

## Constraints
- Quy tắc tần suất đã chốt ở OQ-3.
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Nhắc qua SMS hay Zalo.
- Email marketing.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Logic chọn và lịch gửi](./phase-01-logic-chon-va-lich-gui.md) | Pending |
| 2 | [Phase 2: Cài đặt của học viên](./phase-02-cai-dat-cua-hoc-vien.md) | Pending |

## Acceptance Criteria
- [ ] Tối đa 1 nhắc luyện/ngày trên mọi kênh, ưu tiên đẩy nếu đã bật, nếu không thì email, vào giờ học viên chọn.
- [ ] Sau 7 ngày không mở lần nào thì giảm còn 1 lần/tuần.
- [ ] Thông báo hết hạn gửi trước 3 ngày và vào ngày hết hạn, không tính vào giới hạn.
- [ ] Học viên tắt được nhắc, và email có link hủy đăng ký.
- [ ] Chạy lại cron không gửi trùng.

## Câu hỏi mở
- Effort S trong roadmap tính cho chỉ email; plan đổi thành 4 ngày vì có thêm thông báo đẩy. Có cần cập nhật Effort và điểm của mục này không?

<!-- slug: wi23-practice-reminder -->
