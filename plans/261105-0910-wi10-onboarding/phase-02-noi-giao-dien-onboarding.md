---
phase: 2
title: "Nối giao diện onboarding"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Nối giao diện onboarding

## Goal
Onboarding dùng dữ liệu thật và xử lý đúng khi micro bị chặn.

## Files to Create / Modify
- Modify: `apps/web/src/features/onboarding/onboarding-screen.tsx`
- Modify: `apps/web/src/features/onboarding/components/goal-step.tsx`
- Modify: `apps/web/src/features/onboarding/components/mic-check.tsx`
- Modify: `apps/web/src/hooks/use-mic-level.ts`
- Modify: `apps/web/src/hooks/__tests__/use-mic-level.test.ts`
- Modify: `apps/web/src/routes/_proto/onboarding.tsx`
- Modify: `apps/web/src/features/onboarding/components/consent-step.tsx`

## Tasks & Steps

### Task 2.1 — Lưu mục tiêu qua API.
- Goal: Lưu mục tiêu qua API.
- Target files and symbols: `onboarding-screen.tsx`, `goal-step.tsx`, `apps/web/src/utils/trpc.ts`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Bước mục tiêu gọi `profile.upsert`, thay vì chỉ ghi vào app state. `upsert` không ghi `onboardedAt`. Gọi `profile.completeOnboarding` tại `onDone` của `ConsentStep`, để tải lại trang giữa chừng không bỏ qua bước đồng ý.
  2. Trong `beforeLoad` của route: nếu đã có `onboardedAt` thì chuyển tới `/app/dashboard`.
- Success criteria: Dữ liệu còn sau khi tải lại trang.
- Verify: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` thoát với mã 0.

### Task 2.2 — Bỏ tín hiệu giả khi micro bị chặn.
- Goal: Bỏ tín hiệu giả khi micro bị chặn.
- Target files and symbols: `use-mic-level.ts`, `mic-check.tsx:44`; test: `apps/web/src/hooks/__tests__/use-mic-level.test.ts`
- Steps:
  1. Hiện tại khi `getUserMedia` bị từ chối, hook tạo tín hiệu giả (`real === false`). Đổi thành trả trạng thái `denied`.
  2. `mic-check.tsx` hiện hướng dẫn bật quyền micro, có nút thử lại, không cho sang bước sau.
  3. Sửa test `falls back to simulated signal` thành khẳng định trạng thái `denied`.
- Success criteria: Từ chối micro thì không qua được bước.
- Verify: `pnpm --filter web test src/hooks/__tests__/use-mic-level.test.ts` thoát với mã 0 và `grep -c 'Chế độ mô phỏng' apps/web/src/features/onboarding/components/mic-check.tsx` in `0`.

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
