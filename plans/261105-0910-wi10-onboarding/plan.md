---
title: "Tài khoản & mục tiêu (`onboarding`)"
description: "Học viên mới đăng nhập, lưu band mục tiêu và ngày thi thật, kiểm tra micro thật, rồi vào được lần ghi âm đầu tiên."
status: pending
priority: P1
effort: 2d
issue: 14
branch: vinh19410/feat/onboarding
tags: [backend, frontend, advice]
blockedBy: [project:261105-0909-wi02-reconcile-prd-roadmap, project:261105-0910-wi07-google-login]
blocks: [project:261105-0910-wi11-privacy-controls, project:261105-0910-wi12-mock-exam, project:261105-0910-wi15-billing-qr, project:261105-0910-wi17-first-real-students-gate]
created: 2026-11-05
---

# Tài khoản & mục tiêu (`onboarding`)

Tracking: #14

Mục 10 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `onboarding`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên mới đăng nhập, lưu band mục tiêu và ngày thi thật, kiểm tra micro thật, rồi vào được lần ghi âm đầu tiên.

## Phụ thuộc
- Phải chờ: #6, #11; #13 (mềm)
- Mở khóa: #15, #16, #19, #21

## Constraints
- Sao lưu D1 trước khi áp migration lên môi trường thật.
- Luồng phải ít bước nhất có thể; rủi ro chính là học viên bỏ đi trước lần ghi âm đầu.

## Non-goals
- Lưu đồng ý dữ liệu; thuộc #15 dù bước đồng ý nằm trong luồng onboarding.
- Báo band thật sau ngày thi, trừ khi #6 quyết định đưa vào.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Backend hồ sơ học viên](./phase-01-backend-ho-so-hoc-vien.md) | Pending |
| 2 | [Phase 2: Nối giao diện onboarding](./phase-02-noi-giao-dien-onboarding.md) | Pending |

## Acceptance Criteria
- [ ] Band mục tiêu và ngày thi được lưu trong D1 và còn nguyên sau khi tải lại trang hoặc đổi thiết bị.
- [ ] Người đã hoàn tất không phải làm lại onboarding.
- [ ] Micro bị chặn thì hiện hướng dẫn xử lý và không cho qua bước; không còn "Chế độ mô phỏng" ở bản thật.
- [ ] Test và kiểm tra kiểu đều qua.

## Câu hỏi mở
- SRS `onboarding` đang `stale` theo work items, nhưng không có PRD gốc (người sở hữu xác nhận ngày 2026-11-05) và SRS, brainstorm cũng không có trong repo, nên phải viết lại phạm vi trong plan trước khi code. PRD được dựng lại ở #6.

<!-- slug: wi10-onboarding -->
