---
title: "Bỏ nút Mở bộ ảnh đại diện và sửa lỗi UI input ngày thi dự kiến"
description: "Loại bỏ nút dư thừa 'Mở bộ chọn ảnh đại diện' trên trang Profile và khắc phục lỗi tràn chiều ngang (overflow) của input type='date' trên mobile Safari"
status: pending
priority: P1
effort: "S"
tags: [profile, ui, fix, mobile, ios-safari]
created: 2026-11-09
---

# Bỏ nút Mở bộ ảnh đại diện và sửa lỗi UI input ngày thi dự kiến

## Overview

Trang hồ sơ cá nhân (`/app/profile`) hiện có hai điểm cần tinh chỉnh UI:
1. Nút "Mở bộ chọn ảnh đại diện" xuất hiện dư thừa bên cạnh nút Camera overlay đã có sẵn trên vòng tròn avatar. Cần bỏ nút riêng này để tinh gọn giao diện.
2. Input nhập "Ngày thi dự kiến (tuỳ chọn)" sử dụng `<input type="date">` bên trong một flexbox mà không có `min-w-0` / `max-w-full`. Trên trình duyệt di động (đặc biệt là iOS Safari), shadow DOM của native date picker có `min-content` intrinsic width lớn hơn độ rộng còn lại của Card trên màn hình hẹp (390px), dẫn đến input bị tràn (overflow) vượt ra ngoài viền phải của Card.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Bỏ nút "Mở bộ chọn ảnh đại diện" dư thừa, giữ lại nút camera overlay `Đổi ảnh đại diện` trên avatar | P1 |
| 2 | Khắc phục triệt để lỗi tràn ngang của input ngày thi dự kiến trên mobile và iOS Safari | P1 |
| 3 | Cập nhật và đảm bảo test suite cùng type check pass 100% | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Loại bỏ nút avatar và sửa lỗi CSS date input](./phase-01-cleanup-and-ui-fix.md) | Pending |

## Success Criteria

- [ ] Nút "Mở bộ chọn ảnh đại diện" không còn hiển thị trên trang `/app/profile`.
- [ ] Nút Camera overlay trên avatar (`aria-label="Đổi ảnh đại diện"`) vẫn hoạt động bình thường để mở AvatarModal.
- [ ] Khung input ngày thi dự kiến nằm gọn hoàn toàn trong Card trên mọi kích thước màn hình (mobile 390px, tablet, desktop) và không bị tràn sang phải.
- [ ] Toàn bộ unit test liên quan pass (`pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx`).
- [ ] `pnpm check-types` pass không có lỗi.

<!-- slug: profile-date-input-and-avatar-cleanup -->
