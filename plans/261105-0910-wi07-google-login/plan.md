---
title: "Đăng nhập Google"
description: "Học viên đăng nhập thật bằng Google qua Better Auth, và màn `/auth` không còn đường email + mật khẩu theo quyết định chỉ dùng Google ở MVP."
status: pending
priority: P1
effort: 1d
issue: 11
branch: vinh19410/feat/google-login
tags: [auth, backend, frontend, advice]
blockedBy: [project:261105-0909-wi06-cloudflare-backend-env]
blocks: [project:261105-0910-wi10-onboarding, project:261105-0910-wi19-forecast-curation]
created: 2026-11-05
---

# Đăng nhập Google

Tracking: #11

Mục 07 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên đăng nhập thật bằng Google qua Better Auth, và màn `/auth` không còn đường email + mật khẩu theo quyết định chỉ dùng Google ở MVP.

## Phụ thuộc
- Phải chờ: #10
- Yếu tố ngoài: OAuth client trên Google Cloud Console
- Mở khóa: #14, #23

## Constraints
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Giữ `sameSite: none`, `secure` và `httpOnly` của cookie hiện tại.
- Chỉ Google, theo quyết định trong feature map.

## Non-goals
- Đăng nhập bằng link email (PRD đang ghi; xử lý ở #6).
- Xóa `_app-legacy` trừ khi cần để code biên dịch.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Bật Google ở backend](./phase-01-bat-google-o-backend.md) | Pending |
| 2 | [Phase 2: Nối màn đăng nhập](./phase-02-noi-man-dang-nhap.md) | Pending |

## Acceptance Criteria
- [ ] Nhấn "Tiếp tục với Google" tạo session thật và vào được route cần đăng nhập.
- [ ] `emailAndPassword` không còn bật trong `createAuth`.
- [ ] Route cần đăng nhập chuyển người chưa đăng nhập về `/auth`.
- [ ] Test và kiểm tra kiểu đều qua.

## Câu hỏi mở
- Có xóa luôn `sign-in-form.tsx`, `sign-up-form.tsx` và `_app-legacy/login.tsx` vì không còn đường email không?

<!-- slug: wi07-google-login -->
