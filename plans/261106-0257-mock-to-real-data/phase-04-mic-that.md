---
phase: 4
title: "G3: Mic thật"
status: pending
priority: P2
effort: 0.5d
dependencies: [1]
---

# Phase 4: G3 — Mic thật

## Goal
Kiểm tra micro và sóng âm chỉ dùng tín hiệu thật; khi không có micro thì hiện hướng dẫn và không cho qua bước, thay vì mô phỏng.

## Bối cảnh đã kiểm
- `hooks/use-mic-level.ts` rơi về `simulate()` khi không có `getUserMedia` hoặc bị từ chối.
- `features/onboarding/components/mic-check.tsx` cứng `const noise = 32 // dB, simulated ambient reading`.
- `mic-check.tsx` nằm trong luồng onboarding của WI10 (`plans/261105-0910-wi10-onboarding/phase-02-noi-giao-dien-onboarding.md`); phase này nhận phần mic và ghi chú sang WI10.

## Files to Create / Modify
- Modify: `apps/web/src/hooks/use-mic-level.ts`
- Modify: `apps/web/src/features/onboarding/components/mic-check.tsx`
- Create: `apps/web/src/hooks/use-mic-level.test.ts`
- Modify: `plans/261105-0910-wi10-onboarding/phase-02-noi-giao-dien-onboarding.md` (ghi chú bàn giao)

## Tasks & Steps

### Task 4.1 — `useMicLevel` không mô phỏng
- Goal: hook trả trạng thái lỗi thay vì tín hiệu giả.
- Target files and symbols: `use-mic-level.ts` (`MicLevelState`, `simulate`).
- Steps:
  1. Xóa hàm `simulate` và mọi lời gọi.
  2. Đổi `MicLevelState` thành `{ level: number; status: "idle" | "ready" | "denied" | "unavailable" }`; thay trường `real`.
  3. Không có `navigator.mediaDevices?.getUserMedia` → `status: "unavailable"`; bị từ chối → `status: "denied"`; thành công → `status: "ready"`.
  4. Cập nhật mọi nơi dùng `real` (dùng `rg -n "real\b" apps/web/src` để tìm).
  5. Viết `use-mic-level.test.ts` với `getUserMedia` giả: từ chối → `denied`; vắng mặt → `unavailable`.
- Success criteria: hook không còn đường nào sinh `level` ngẫu nhiên.
- Verify: `pnpm --filter web test src/hooks/use-mic-level.test.ts` exits 0; `rg -n "Math.random|simulate" apps/web/src/hooks/use-mic-level.ts` in ra 0 dòng.

### Task 4.2 — `MicCheck` dùng mức ồn đo được
- Goal: bỏ `noise = 32` cứng.
- Target files and symbols: `mic-check.tsx` (`noise`, nhánh hiển thị).
- Steps:
  1. Tính mức ồn nền từ `level` thật trong khoảng đầu của lần thử (trung bình `level` trong 1 giây đầu), hiển thị dạng mức tương đối ("Yên tĩnh" / "Hơi ồn" / "Ồn") thay vì số dB giả. Ngưỡng là cấu hình hằng số ở đầu file.
  2. Khi `status` là `denied` hoặc `unavailable`: hiện hướng dẫn cấp quyền micro, nút thử lại, và không cho gọi `onNext`.
- Success criteria: không còn chuỗi "simulated" hay `noise = 32` trong file.
- Verify: `rg -n "simulated|noise = 32" apps/web/src` in ra 0 dòng; `pnpm check-types` exits 0.

### Task 4.3 — Phòng thi dùng `status`
- Goal: phòng thi không chạy khi không có micro.
- Target files and symbols: `use-exam-session.ts` (nơi gọi `useMicLevel`), `exam-controls.tsx`.
- Steps: khi `status` là `denied` hoặc `unavailable`, vô hiệu nút bắt đầu ghi và hiện hướng dẫn cấp quyền.
- Success criteria: không thể bắt đầu ghi khi `status !== "ready"`.
- Verify: `pnpm --filter web test src/features/exam` exits 0 (thêm một ca cho trạng thái `denied` nếu chưa có).

### Task 4.4 — Ghi chú bàn giao cho WI10
- Goal: hai plan không cùng sửa `mic-check.tsx`.
- Target files and symbols: `plans/261105-0910-wi10-onboarding/phase-02-noi-giao-dien-onboarding.md`.
- Steps: thêm một đoạn ngắn nêu rằng phần mic thật (bỏ mô phỏng) do `plans/261106-0257-mock-to-real-data` phase 4 nhận; WI10 chỉ nối bước mic vào luồng onboarding.
- Success criteria: có đoạn ghi chú kèm đường dẫn plan này.
- Verify: `rg -n "261106-0257-mock-to-real-data" plans/261105-0910-wi10-onboarding/phase-02-noi-giao-dien-onboarding.md` in ra ít nhất 1 dòng.

## Verification
- `pnpm --filter web test src/hooks/use-mic-level.test.ts` exits 0.
- `rg -n "simulated|Math.random" apps/web/src/hooks apps/web/src/features/onboarding` in ra 0 dòng.
- `pnpm check-types` exits 0.

## Risk
Người dùng trên trình duyệt không hỗ trợ `getUserMedia` hoặc bị chặn quyền sẽ không vào được phòng thi. Đây là hành vi đúng cho sản phẩm chấm giọng nói; hướng dẫn phải rõ.

## Rollback
`git revert`; không có migration.

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
