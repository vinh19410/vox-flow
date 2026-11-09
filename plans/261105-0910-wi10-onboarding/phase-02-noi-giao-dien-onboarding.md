---
phase: 2
title: "Nối giao diện onboarding"
status: completed
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Nối giao diện onboarding

## Goal
Onboarding dùng dữ liệu thật và xử lý đúng khi micro bị chặn.

## Files to Create / Modify
- Modify: `apps/web/src/routes/_proto/onboarding.tsx`
- Modify: `apps/web/src/features/onboarding/onboarding-screen.tsx`
- Modify: `apps/web/src/features/onboarding/components/goal-step.tsx`
- Modify: `apps/web/src/features/onboarding/components/mic-check.tsx`
- Modify: `apps/web/src/features/onboarding/components/consent-step.tsx`
- Modify: `apps/web/src/hooks/use-mic-level.ts`
- Modify: `apps/web/src/hooks/__tests__/use-mic-level.test.ts`
- Modify: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Modify: `apps/web/src/routes/_proto/route.tsx`
## Tasks & Steps

### Task 2.1 — Bảo vệ route onboarding và lưu mục tiêu qua API.
- Goal: Bảo vệ route onboarding bằng auth guard, lưu mục tiêu vào D1, và hoàn tất onboarding ở consent step.
- Target files and symbols: `apps/web/src/routes/_proto/onboarding.tsx`, `apps/web/src/features/onboarding/components/goal-step.tsx`, `apps/web/src/features/onboarding/components/consent-step.tsx`, `apps/web/src/routes/_proto/route.tsx`; test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Trong `beforeLoad` của `_proto/onboarding.tsx`:
     - Kiểm tra auth session qua `authClient.getSession()`. Nếu chưa đăng nhập thì `throw redirect({ to: "/auth" })`.
     - Đọc profile qua `trpcClient.profile.get.query()`. Nếu `profile?.onboardedAt` đã có thì `throw redirect({ to: "/app/dashboard" })`.
  2. Trong `goal-step.tsx`: Cập nhật danh sách `BANDS` đầy đủ từ 5.0 đến 9.0 theo PRD §4.1 F-03 (`[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]`). Khi nhấn "Tiếp tục", gọi `trpcClient.profile.upsert.mutate({ targetBand, examDate })`, đồng thời cập nhật `set({ target, examDate })` vào AppState. Xử lý lỗi nếu API thất bại.
  3. Trong `consent-step.tsx`: Khi nhấn "Xác nhận và tiếp tục" (`onDone`), gọi `trpcClient.profile.completeOnboarding.mutate()`.
  4. Hydrate profile: Trong `_proto/route.tsx` (layout chung của ứng dụng proto), khi có session, gọi `profile.get.query()` để hydrate `target` và `examDate` vào `AppState` nếu trong DB đã có dữ liệu, đảm bảo sau khi reload trang hoặc đăng nhập máy khác thông tin mục tiêu vẫn còn nguyên.
  5. Cập nhật `slice-a.test.tsx` để mock các lời gọi `trpcClient.profile.upsert` và `trpcClient.profile.completeOnboarding`.
- Success criteria: Route được bảo vệ, dữ liệu lưu D1 và hydrate lại sau khi reload trang.
- Verify: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` thoát với mã 0.

### Task 2.2 — Xử lý quyền micro thật và loại bỏ chế độ mô phỏng / nút bỏ qua.
- Goal: Bỏ tín hiệu giả khi micro bị chặn, loại bỏ nút "Bỏ qua" để bắt buộc kiểm tra micro thật, hiển thị hướng dẫn khi bị từ chối.
- Target files and symbols: `apps/web/src/hooks/use-mic-level.ts`, `apps/web/src/features/onboarding/components/mic-check.tsx`; test: `apps/web/src/hooks/__tests__/use-mic-level.test.ts`, `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Trong `use-mic-level.ts`: Khi `navigator.mediaDevices?.getUserMedia` bị từ chối hoặc không có, không còn gọi hàm `simulate()`. Thay vào đó, trả về trạng thái `denied: true` và `real: false`, `level: 0`.
  2. Trong `mic-check.tsx`:
     - Bỏ hoàn toàn chuỗi "Chế độ mô phỏng (trình duyệt chặn micro)".
     - Khi micro bị từ chối (`denied === true`): hiện cảnh báo màu đỏ/vàng hướng dẫn học viên bấm icon ổ khóa trên thanh địa chỉ để cấp quyền micro, kèm nút "Thử lại".
     - Bỏ hoàn toàn nút "Bỏ qua" (Skip button) trong luồng onboarding; học viên chỉ có thể tiếp tục sang bước tiếp theo khi đã kiểm tra micro thành công (`phase === "done"`).
  3. Cập nhật `use-mic-level.test.ts` để kiểm thử trạng thái `denied === true` và không có tín hiệu mô phỏng khi bị từ chối.
  4. Cập nhật `slice-a.test.tsx` tương ứng với giao diện mic-check mới (không còn nút "Bỏ qua", bước chuyển tiếp sau khi ghi xong).
- Success criteria: Từ chối micro thì không thể qua bước, không còn "Chế độ mô phỏng", test qua 100%.
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
