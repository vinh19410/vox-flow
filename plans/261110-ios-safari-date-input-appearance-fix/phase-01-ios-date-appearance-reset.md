---
title: "Phase 1: Reset CSS appearance và styling cho date input"
status: in_progress
---

# Phase 1: Reset CSS appearance và styling cho date input

## Context

Trên iOS Safari, thẻ `<input type="date">` yêu cầu `-webkit-appearance: none; appearance: none;` để gỡ bỏ hoàn toàn `StyleAppearance::MenulistButton`, qua đó vô hiệu hóa logic tính `min-width` tối thiểu và ép `box-sizing: content-box` của WebKit. Đồng thời, `::-webkit-date-and-time-value` cần được định kiểu `text-align: left` và `min-height: 1.25em` để tránh căn giữa và tránh sụt chiều cao khi chưa chọn ngày.

Các quy tắc cần được đặt trong `@layer base` để không ghi đè lên các Tailwind utilities (như `w-full` hay `w-auto`).

## Requirements

- [x] Cập nhật `apps/web/src/styles/prototype-theme.css`:
  - Đặt bên trong `@layer base`.
  - Thêm `-webkit-appearance: none; appearance: none;` và `text-align: left;` cho `input[type="date"]`, `input[type="time"]`, `input[type="datetime-local"]`, `input[type="month"]`, `input[type="week"]`.
  - Thêm quy tắc cho `::-webkit-date-and-time-value`: `margin: 0; text-align: left; min-height: 1.25em; min-height: 1lh;`.
  - Thêm reset padding cho `input::-webkit-datetime-edit`, `input::-webkit-datetime-edit-fields-wrapper`, và `input::-webkit-calendar-picker-indicator`.
- [x] Cập nhật `apps/web/src/features/profile/profile-screen.tsx`:
  - Bổ sung `appearance-none` và `text-base sm:text-sm` cho `#user-exam-date`.
- [x] Cập nhật tests:
  - Bổ sung test kiểm tra `prototype-theme.test.ts` về `appearance: none` và `::-webkit-date-and-time-value` bên trong `@layer base`.
  - Cập nhật test trong `profile-screen.test.tsx` xác nhận classes mới.
- [x] Chạy kiểm thử:
  - `pnpm --filter web test`
  - `pnpm check-types`

## Success Criteria

- [x] Unit tests pass 100%.
- [x] `pnpm check-types` pass không có lỗi.
- [ ] Giao diện trên iPhone thật xác nhận hết lỗi sau khi deploy beta.
