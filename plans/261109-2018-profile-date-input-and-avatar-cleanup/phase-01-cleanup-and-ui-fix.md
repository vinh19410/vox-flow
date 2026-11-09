---
title: "Phase 1: Loại bỏ nút avatar và sửa lỗi CSS date input"
status: completed
---

# Phase 1: Loại bỏ nút avatar và sửa lỗi CSS date input

## Overview

Loại bỏ phần tử nút "Mở bộ chọn ảnh đại diện" trong `profile-screen.tsx`, cập nhật bộ test tương ứng, và cấu hình các thuộc tính CSS chống tràn (`w-full min-w-0 max-w-full`, `shrink-0`, và rule toàn cục cho `input[type="date"]`) để input ngày thi dự kiến co dãn mượt mà trong flex container trên mobile.

## Requirements

- [x] Xóa bỏ khối nút `Mở bộ chọn ảnh đại diện` ở dòng ~260-270 của `profile-screen.tsx`.
- [x] Đảm bảo nút Camera overlay với `aria-label="Đổi ảnh đại diện"` tiếp tục mở `AvatarModal`.
- [x] Thêm `w-full min-w-0` vào container flex của input ngày thi và `min-w-0 flex-1` cho wrapper input.
- [x] Thêm `min-w-0 max-w-full` vào thẻ `<input id="user-exam-date" type="date">`.
- [x] Thêm `shrink-0` vào nút "Xóa ngày" để tránh co méo.
- [x] Thêm rule `input[type="date"] { min-width: 0; max-width: 100%; }` vào `prototype-theme.css`.
- [x] Cập nhật unit test trong `profile-screen.test.tsx` tương thích với thay đổi và bổ sung assertion kiểm tra nút cũ đã biến mất.

## Implementation Steps

1. Sửa `apps/web/src/features/profile/profile-screen.tsx`:
   - Gỡ bỏ khối button "Mở bộ chọn ảnh đại diện".
   - Cập nhật styling của khối input ngày thi dự kiến.
2. Bổ sung CSS phòng ngừa trong `apps/web/src/styles/prototype-theme.css`.
3. Sửa test trong `apps/web/src/features/profile/__tests__/profile-screen.test.tsx`:
   - Đổi selector test mở avatar modal từ "Mở bộ chọn ảnh đại diện" sang "Đổi ảnh đại diện".
   - Thêm test case khẳng định nút "Mở bộ chọn ảnh đại diện" không còn tồn tại trên trang.
4. Chạy kiểm tra:
   - `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx`
   - `pnpm check-types`

## Todo

- [x] Gỡ bỏ nút "Mở bộ chọn ảnh đại diện" trong `profile-screen.tsx`
- [x] Sửa CSS flexbox và input `type="date"` chống tràn màn hình
- [x] Cập nhật và bổ sung test cases trong `profile-screen.test.tsx`
- [x] Chạy và xác thực toàn bộ test cùng `pnpm check-types`

## Success Criteria

- [x] Test suite `profile-screen.test.tsx` pass 100%.
- [x] `pnpm check-types` pass không có lỗi.
- [x] Giao diện profile sạch sẽ, không còn nút thừa, input ngày thi không tràn trên mobile.
