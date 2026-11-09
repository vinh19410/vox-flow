---
phase: 2
title: "Cài đặt của học viên"
status: pending
priority: P2
effort: ""
dependencies: [1]
---

# Phase 2: Cài đặt của học viên

## Goal
Học viên chọn giờ, bật đẩy và tắt nhắc được.

## Files to Create / Modify
- Create: `apps/web/src/features/dashboard/components/reminder-settings.tsx`
- Create: `apps/web/public/sw.js`
- Create: `packages/api/src/routers/reminder.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `apps/web/src/features/dashboard/dashboard-screen.tsx`

## Tasks & Steps

### Task 2.1 — Tạo cài đặt và hủy đăng ký.
- Goal: Tạo cài đặt và hủy đăng ký.
- Target files and symbols: `reminder-settings.tsx`, `apps/web/public/sw.js`, `packages/api/src/routers/reminder.ts`; test: `packages/api/src/routers/reminder.test.ts`; test: `apps/web/src/features/dashboard/__tests__/reminder-settings.test.tsx`
- Steps:
  1. Gắn `reminder-settings.tsx` vào `dashboard/dashboard-screen.tsx`.
  2. Chọn giờ, bật đẩy qua service worker, tắt nhắc.
  3. Trên iPhone chưa thêm vào màn hình chính thì giải thích và dùng email.
  4. Thêm route công khai `GET /unsubscribe` dùng token ký, và kiểm tra token sai bị từ chối.
- Success criteria: Cài đặt và hủy đăng ký hoạt động.
- Verify: `pnpm --filter @vox-flow/api test src/routers/reminder.test.ts` và `pnpm --filter web test src/features/dashboard/__tests__/reminder-settings.test.tsx` đều thoát với mã 0; `pnpm check-types` thoát với mã 0.

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
