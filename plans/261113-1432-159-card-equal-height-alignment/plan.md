---
title: "Align card heights and bottom-pin footers across TopicCard, ModeGrid, and PlanGrid"
description: "Use h-full flex-col and mt-auto footers on TopicCard, ModeGrid, and PlanGrid so cards in the same CSS Grid row share equal height and aligned footers without truncating topic titles."
status: in_progress
priority: P2
effort: 1h
issue: 159
branch: fix/159-card-equal-height-alignment
tags: [frontend, ui, layout, forecast, select, billing]
blockedBy: []
blocks: []
created: 2026-11-13
---

# Đồng bộ chiều cao & căn đáy chân card cho `TopicCard`, `ModeGrid` và `PlanGrid`

Tracking: #159

## Bối cảnh & Mục tiêu
Trên 3 lưới card có thanh chân card (`TopicCard` ở `/app/forecast`, `ModeGrid` ở `/app/select`, `PlanGrid` ở `/app/billing` và `PaywallModal`), các card trong cùng một hàng CSS Grid đã được kéo cao bằng nhau nhưng phần chân card lại dùng margin-top cố định (`mt-5`, `mt-6`, `mt-4`) thay vì đẩy xuống đáy (`mt-auto`), khiến đường kẻ ngang và CTA/thời lượng ở chân card bị lệch tầng khi nội dung phía trên dài ngắn khác nhau.

Plan này chuẩn hóa cả 3 component theo đúng pattern đang dùng ở `CriteriaGrid` và `CountdownCard`: `h-full flex-col` trên container card kết hợp `mt-auto` trên footer (và giữ `mb-5` ở mô tả `TopicCard` để bảo toàn khoảng hở trên vạch kẻ).

## Done means
1. `TopicCard` (`apps/web/src/features/forecast/components/topic-card.tsx`) có `h-full flex-col`, giữ đủ tiêu đề `h3` không cắt chữ, đoạn mô tả có `mb-5` và footer (`border-t ... Luyện →`) dùng `mt-auto`; các card cùng hàng cao bằng nhau và vạch kẻ + chân card lệch `<= 1px`.
2. `ModeGrid` (`apps/web/src/features/select/components/mode-grid.tsx`) và `PlanGrid` (`apps/web/src/features/billing/components/plan-grid.tsx`, cả thường và `compact`) có `h-full flex-col` và khối footer (thời lượng `Clock` / `Chọn gói →`) dùng `mt-auto`; các card cùng hàng cao bằng nhau và chân card lệch `<= 1px`.
3. Unit test cập nhật cho cả 3 nhóm component chạy pass; toàn bộ `pnpm --filter web test` và `pnpm check-types` thoát `0`.
4. Issue #159 (gắn `ai-handle`, thuộc Project 15) đi hết vòng đời nhãn tới `shipped`; PR nhắm nhánh `dev` vượt qua isolated review và được merge qua `ak-review-pr --fix --reply --merge`; comment POT trên issue có đủ bằng chứng test + ảnh chụp 3 viewport (`1280x900`, `768x1024`, `390x844`) nhúng bằng permalink commit SHA.

## Phạm vi tệp sở hữu (3 slice độc lập)
- **Slice A — Forecast `TopicCard`:**
  - `apps/web/src/features/forecast/components/topic-card.tsx`
  - `apps/web/src/features/forecast/__tests__/topic-card.test.tsx` (mới)
- **Slice B — Select `ModeGrid`:**
  - `apps/web/src/features/select/components/mode-grid.tsx`
  - `apps/web/src/features/select/__tests__/select-setup-flow.test.tsx`
- **Slice C — Billing `PlanGrid`:**
  - `apps/web/src/features/billing/components/plan-grid.tsx`
  - `apps/web/src/features/billing/__tests__/plan-grid.test.tsx` (mới)

## Các phase thực thi
| Phase | Tên | Tệp | Trạng thái |
|---|---|---|---|
| 01 | Đồng bộ chiều cao & chân card + kiểm chứng 3 viewport | [phase-01-align-card-footers.md](./phase-01-align-card-footers.md) | `in_progress` |
