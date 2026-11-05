---
phase: 3
title: "Nối giao diện"
status: completed
priority: P1
effort: ""
dependencies: [1, 2]
---

# Phase 3: Nối giao diện

## Goal
Màn quyền riêng tư và bước đồng ý dùng dữ liệu thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/privacy/privacy-screen.tsx`
- Modify: `apps/web/src/features/onboarding/components/consent-rows.tsx`
- Modify: `apps/web/src/features/onboarding/components/consent-step.tsx`
- Modify: `apps/web/src/features/app-state/types.ts`
- Modify: `apps/web/src/features/app-state/store.tsx`
- Modify: `apps/web/src/features/app-state/initial-state.ts`
- Modify: `apps/web/src/features/select/components/pre-exam-card.tsx`
- Modify: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`

## Tasks & Steps

### Task 3.1 — Thay trạng thái giả bằng API.
- Goal: Thay trạng thái giả bằng API.
- Target files and symbols: `privacy-screen.tsx`, `consent-rows.tsx`, `consent-step.tsx`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Xóa câu "Tắt thì bài sẽ bị xóa sau khi bạn đóng màn kết quả." ở `consent-rows.tsx:8` và sửa mô tả thành: tắt thì bài không hiện trong lịch sử. Không làm việc tự xóa bài; chính sách và điều khoản sử dụng sẽ biên soạn sau.
  2. Công tắc gọi `privacy.setConsent` và hiện trạng thái lỗi nếu lưu thất bại, không tự bật lại.
  3. Nút xuất tải file JSON. Nút xóa có xác nhận và hiện hạn 24 giờ.
  4. Dùng từ ngữ đã chốt ở #6 (D-10). Đổi tên trường `train` trong `ConsentSettings` tương ứng.
  5. Sửa test `ConsentRows` và `PrivacyScreen`.
- Success criteria: Màn hình phản ánh dữ liệu thật.
- Verify: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` và `pnpm check-types` đều thoát với mã 0. `grep -c 'sẽ bị xóa' apps/web/src/features/onboarding/components/consent-rows.tsx` in `0`.

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
