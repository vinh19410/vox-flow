---
phase: 1
title: "Sửa lời hứa và kiểm tra luồng vào"
status: completed
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
- Goal: Sửa nội dung trái hạn mức, loại bỏ mọi cam kết vô hạn ("không giới hạn", "mọi lượt", "hết lượt free vẫn có band").
- Target files and symbols: `pricing-teaser.tsx:22`, `promises-section.tsx:13`, `hero.tsx:29`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Thay "Thi thử không giới hạn" ở `pricing-teaser.tsx:22` bằng "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)".
  2. Sửa `promises-section.tsx:13`:
     - Tiêu đề: "Band tổng miễn phí trong hạn mức".
     - Mô tả: "Mỗi ngày 3 điểm miễn phí: Full Test 3 điểm, mỗi Part 1 điểm. Mỗi bài có band tổng + khoảng tin cậy; chi tiết 4 tiêu chí mới cần trả phí."
     - Loại bỏ hoàn toàn "Hết lượt free vẫn có band".
  3. Sửa `hero.tsx:29` thành: "Không cần thẻ · 3 điểm miễn phí mỗi ngày".
  4. Trong test `LandingScreen` tại `slice-a.test.tsx`:
     - Thêm khẳng định thẻ "Miễn phí" không chứa "không giới hạn" hay "mọi lượt".
     - Thêm khẳng định hiển thị đúng "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)".
- Success criteria: Không còn các cụm "không giới hạn", "mọi lượt", "hết lượt free" trong `apps/web/src/features/landing`.
- Verify: `grep -rniE 'không giới hạn|mọi lượt|hết lượt free' apps/web/src/features/landing | wc -l` in `0` và `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` thoát với mã 0.

### Task 1.2 — Xác nhận nút chính dẫn vào app.
- Goal: Xác nhận nút chính và các CTA trên landing chuyển đúng vào app (`/auth`).
- Target files and symbols: `apps/web/src/features/landing/components/hero.tsx`, `apps/web/src/features/landing/landing-screen.tsx`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Đảm bảo nút chính trong Hero chuyển tới `auth` (`go("auth")`).
  2. Xác nhận các nút CTA phụ trên LandingScreen (Đăng nhập, Thi thử miễn phí) đều chuyển tới `auth`.
  3. Thêm khẳng định vào test `LandingScreen` cho các nút điều hướng.
- Success criteria: Nhấn nút chính và CTA dẫn tới `auth`.
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
