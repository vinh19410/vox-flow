---
title: "Hide redundant inline setup cards below lg on /app/select"
description: "Hide and unmount VoicePicker and PreExamCard on /app/select when viewport < 1024px, sharing the matchMedia breakpoint with ModeGrid."
status: completed
priority: P2
effort: 1h
issue: 150
branch: fix/150-mobile-select-redundant-cards
tags: [frontend, ui, mobile, tdd, select]
blockedBy: []
blocks: []
created: 2026-11-13
---

# Ẩn khối Giọng giám khảo & Trước khi bắt đầu bị dư trên `/app/select` ở viewport `< 1024px`

Tracking: #150 (liên quan #85)

## Bối cảnh & Mục tiêu
Sau #85, ở viewport `< 1024px` khi người dùng chạm vào một card loại bài thi (`Full Test`, `Part 1`, `Part 2`, `Part 3`) trên `/app/select`, hệ thống điều hướng sang `/app/select/setup` (`SelectSetupScreen`). Tuy nhiên `SelectScreen` (`apps/web/src/features/select/select-screen.tsx`) vẫn đang mount cố định `<VoicePicker />` ("Giọng giám khảo") và `<PreExamCard />` ("Trước khi bắt đầu") bên dưới `ModeGrid` ở mọi viewport.

Plan này đồng bộ ranh giới hiển thị của `SelectScreen` với ranh giới điều hướng của `ModeGrid` (`(max-width: 1023.98px)`).

## Done means
1. Ở viewport `< 1024px`, `/app/select` hiển thị `PageHead` và đủ 4 button `ModeGrid` (giữ nguyên highlight `s.mode`), và không mount `VoicePicker` hay `PreExamCard` (đồng thời giữ class `hidden lg:grid`).
2. Ở viewport `< 1024px`, chạm vào bất kỳ card `ModeGrid` nào chuyển sang `/app/select/setup`, nơi nút quay lại, tiêu đề mode, `VoicePicker` và `PreExamCard` hoạt động bình thường.
3. Ở viewport `>= 1024px` (và khi resize qua ngưỡng `1024px`), `/app/select` hiển thị inline `VoicePicker` + `PreExamCard`, bấm card không điều hướng.
4. Unit test và router integration test cho `< 1024px`, `>= 1024px` và resize pass (`pnpm --filter web test ...`); `pnpm check-types` thoát mã `0`.
5. Review độc lập sạch lỗi chặn, PR merge vào `dev` với CI xanh và comment POT đính kèm ảnh 3 viewport (`390x844`, `768x1024`, `1280x900`).

## Phạm vi tệp sở hữu
- `apps/web/src/features/select/use-select-mobile-viewport.ts` (mới)
- `apps/web/src/features/select/components/mode-grid.tsx`
- `apps/web/src/features/select/select-screen.tsx`
- `apps/web/src/features/select/__tests__/select-setup-flow.test.tsx`
- `apps/web/src/features/select/__tests__/select-setup-route.test.tsx`

## Các phase thực thi
| Phase | Tên | Tệp | Trạng thái |
|---|---|---|---|
| 01 | Đồng bộ breakpoint & TDD ẩn inline setup `< 1024px` | [phase-01-hide-mobile-inline-setup.md](./phase-01-hide-mobile-inline-setup.md) | `completed` |
