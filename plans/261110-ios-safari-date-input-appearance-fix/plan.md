---
title: "Khắc phục triệt để lỗi hiển thị input ngày thi trên iOS Safari khi đã chọn và chưa chọn ngày"
description: "Thêm appearance: none, -webkit-appearance: none, và reset pseudo-element ::-webkit-date-and-time-value cho input temporal trong @layer base, kèm text-base mobile trên trang profile nhằm ngăn chặn WebKit MenulistButton intrinsic min-width và tràn viền"
status: in_progress
priority: P1
effort: "XS"
tags: [profile, ui, fix, mobile, ios-safari, webkit, css]
created: 2026-11-10
---

# Khắc phục triệt để lỗi hiển thị input ngày thi trên iOS Safari khi đã chọn và chưa chọn ngày

## Overview

Trên iOS Safari (WebKit trên iOS), thẻ `<input type="date">` mặc định mang giao diện hệ thống `StyleAppearance::MenulistButton`.
Bộ máy kết xuất của WebKit (hàm `adjustInputElementButtonStyle` trong `RenderThemeIOS.mm`):
1. Tự động tính toán `min-width` tối thiểu dựa trên chuỗi ngày dài nhất của ngôn ngữ máy (trong tiếng Việt là "ngày 30 tháng 12, 2026", tương đương ~250px).
2. Tự động ép `box-sizing: content-box` (ghi đè `box-sizing: border-box` của CSS).
3. Do đó, khi cộng thêm `pl-10` (40px) và `pr-3` (12px), tổng chiều rộng của input vượt quá phần không gian còn lại (~230px) khi nút "Xóa ngày" xuất hiện bên cạnh, khiến input date đè lên nút "Xóa ngày" (chỉ lòi ra chữ "ngày" như ảnh thực tế của người dùng).
4. Ở trạng thái chưa chọn ngày (`value=""`), WebKit gặp lỗi 198959 khiến nội dung rỗng bị co rút chiều cao, căn giữa chữ theo mặc định của iOS, và trên màn hình hẹp vẫn có thể tràn viền Card.

Giải pháp chuẩn kỹ thuật của WebKit:
- Thêm `-webkit-appearance: none; appearance: none;` cho các input temporal bên trong `@layer base` của `prototype-theme.css`. Khai báo này làm hàm `RenderTheme::adjustStyle` trả về sớm, ngăn chặn toàn bộ logic ép `min-width`, ép `content-box` và `min-height` của `MenulistButton`.
- Thiết lập quy tắc cho `::-webkit-date-and-time-value`: `margin: 0; text-align: left; min-height: 1.25em; min-height: 1lh;` để căn lề trái văn bản và chống xẹp chiều cao khi rỗng.
- Thêm `appearance-none text-base sm:text-sm` trên thẻ input trong `profile-screen.tsx` để ngăn iOS tự động phóng to (zoom in) màn hình khi focus vào input dưới 16px.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Khắc phục triệt để lỗi tràn ngang và đè lên nút "Xóa ngày" khi đã chọn ngày trên iOS Safari | P1 |
| 2 | Đảm bảo chiều cao, căn lề và hiển thị đồng bộ khi chưa chọn ngày (rỗng) trên iOS Safari | P1 |
| 3 | Ngăn chặn iOS zoom-in khi người dùng chạm vào ô input (font-size 16px trên mobile) | P1 |
| 4 | Toàn bộ unit tests, regression tests và `pnpm check-types` pass 100% | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Reset CSS appearance và styling cho date input](./phase-01-ios-date-appearance-reset.md) | In Progress |

## Success Criteria

- [x] `prototype-theme.css` chứa đầy đủ `-webkit-appearance: none; appearance: none;` bên trong `@layer base` và reset `::-webkit-date-and-time-value` (min-height, text-align: left, margin: 0).
- [x] `profile-screen.tsx` bổ sung `appearance-none` và `text-base sm:text-sm` cho input ngày thi.
- [ ] Khi đã chọn ngày: input ngày thi và nút "Xóa ngày" phân tách rõ ràng, không đè lên nhau, không tràn viền (chờ xác nhận trên iPhone thật sau deploy beta).
- [ ] Khi chưa chọn ngày: input hiển thị chuẩn chiều cao, không bị xẹp, căn trái thẳng hàng với calendar icon (chờ xác nhận trên iPhone thật sau deploy beta).
- [x] `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx` pass 100%.
- [x] `pnpm check-types` pass không có lỗi.

<!-- slug: ios-safari-date-input-appearance-fix -->
