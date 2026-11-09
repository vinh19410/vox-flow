---
phase: 2
title: "Nối giao diện"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Nối giao diện

## Goal
Màn gói và thanh toán dùng dữ liệu thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/billing/billing-screen.tsx`
- Modify: `apps/web/src/features/billing/components/payment-panel.tsx`
- Delete: `apps/web/src/features/billing/components/fake-qr.tsx`
- Modify: `apps/web/src/features/billing/components/paywall-modal.tsx`
- Modify: `apps/web/src/features/results/components/soft-paywall.tsx`
- Modify: `apps/web/src/features/billing/plan-utils.ts`

## Tasks & Steps

### Task 2.1 — Thay QR và webhook giả.
- Goal: Thay QR và webhook giả.
- Target files and symbols: `payment-panel.tsx`, `fake-qr.tsx`
- Steps:
  1. Hiện QR thật và mã đơn. Theo dõi trạng thái đơn tới khi kích hoạt hoặc hết hạn.
  2. Xóa nút giả lập webhook ở `payment-panel.tsx:102` và xóa `fake-qr.tsx`.
- Success criteria: Không còn QR giả.
- Verify: `test ! -f apps/web/src/features/billing/components/fake-qr.tsx` thoát với mã 0 và `pnpm --filter web test` thoát với mã 0.

### Task 2.2 — Sửa lời hứa và quản lý gói.
- Goal: Sửa lời hứa và quản lý gói.
- Target files and symbols: `billing-screen.tsx:34`, `paywall-modal.tsx:49`
- Steps:
  1. Đổi "Band tổng không giới hạn" ở `billing-screen.tsx:34` theo hạn mức 3 điểm/ngày, và rà câu band tổng ở `paywall-modal.tsx:49`.
  2. Hiện gói đang dùng và ngày hết hạn. Gọi chứng từ theo quyết định D-11 của #6: biên nhận hay hóa đơn.
  3. Trong `results/components/soft-paywall.tsx`, nếu còn lượt thì hiện nút dùng 1 lượt để mở bài này kèm số lượt còn lại. Màn gói hiện số lượt còn lại thay vì ngày hết hạn.
- Success criteria: Không còn lời hứa sai.
- Verify: `grep -c 'không giới hạn' apps/web/src/features/billing/billing-screen.tsx` in `0` và `pnpm check-types` thoát với mã 0.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
