---
phase: 1
title: "Sửa lời hứa và kiểm tra luồng vào"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Sửa lời hứa và kiểm tra luồng vào

## Goal
Landing nói đúng hạn mức và dẫn vào app.

## Files to Create / Modify
- Modify: `apps/web/src/features/landing/components/pricing-teaser.tsx`
- Modify: `apps/web/src/features/landing/components/promises-section.tsx`
- Modify: `apps/web/src/features/landing/components/hero.tsx`
- Modify: `apps/web/src/features/__tests__/slice-a.test.tsx`

## Tasks & Steps

### Task 1.1 — Sửa nội dung trái hạn mức.
- Goal: Sửa nội dung trái hạn mức.
- Target files and symbols: `pricing-teaser.tsx:22`, `promises-section.tsx:13`, `hero.tsx:29`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Thay "Thi thử không giới hạn" ở `pricing-teaser.tsx:22` bằng "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)".
  2. Sửa "Band tổng miễn phí, mọi lượt" ở `promises-section.tsx:13` và câu band tổng ở `hero.tsx:29` để nêu rõ là trong hạn mức.
  3. Trong test `LandingScreen`, thêm khẳng định không có chữ "không giới hạn".
- Success criteria: Không còn chữ "không giới hạn" trong landing.
- Verify: `grep -rc 'không giới hạn' apps/web/src/features/landing --include='*.tsx' | grep -v ':0' | wc -l` in `0` và `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` thoát với mã 0.

### Task 1.2 — Xác nhận nút chính dẫn vào app.
- Goal: Xác nhận nút chính dẫn vào app.
- Target files and symbols: `apps/web/src/features/landing/components/hero.tsx`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Đảm bảo nút chính chuyển tới `/auth`.
  2. Thêm khẳng định vào test `LandingScreen`.
- Success criteria: Nhấn nút chính tới `/auth`.
- Verify: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
