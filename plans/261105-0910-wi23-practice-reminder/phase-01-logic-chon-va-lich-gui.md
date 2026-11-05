---
phase: 1
title: "Logic chọn và lịch gửi"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: Logic chọn và lịch gửi

## Goal
Quyết định gửi đúng theo OQ-3 và không gửi trùng.

## Files to Create / Modify
- Create: `packages/db/src/schema/reminder.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/reminders/select.ts`
- Create: `packages/api/src/reminders/dispatch.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `apps/server/src/scheduled.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 19 25 26; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Viết logic thuần chọn kênh và tần suất.
- Goal: Viết logic thuần chọn kênh và tần suất.
- Target files and symbols: `packages/api/src/reminders/select.ts` (`decideReminder`); test: `packages/api/src/reminders/select.test.ts`
- Steps:
  1. Viết test cho: đã nhắc hôm nay, đẩy đã bật, đẩy chưa bật nên dùng email, 7 ngày không mở nên giảm xuống tuần, giờ chọn theo giờ Việt Nam, đã tắt nhắc.
  2. Thông báo hết hạn nằm ở hàm riêng và không tính vào giới hạn.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/reminders/select.test.ts` thoát với mã 0.

### Task 1.2 — Gửi qua dịch vụ đã chọn.
- Goal: Gửi qua dịch vụ đã chọn.
- Target files and symbols: `packages/api/src/reminders/dispatch.ts`, `packages/db/src/schema/reminder.ts`, `apps/server/src/index.ts`; test: `packages/api/src/reminders/dispatch.test.ts`
- Steps:
  1. Dùng dịch vụ đã chốt trong `docs/decisions/email-push-provider.md`.
  2. Bảng `reminder_log` có khóa duy nhất theo người, loại và ngày, để chạy lại không gửi trùng.
  3. Bảng `reminder_preference` (`userId`, `hourVn`, `enabled`, `lastOpenedAt`). 'Mở' nghĩa là mở app hoặc bấm vào thông báo hoặc link trong email; ghi qua `reminder.markOpened`, gọi khi vào app và ở link có token.
  4. Bảng `push_subscription` lưu đăng ký đẩy; đăng ký hết hiệu lực thì xóa và dùng email.
  5. Chạy `pnpm --filter @vox-flow/db db:generate`, đăng ký bảng vào `data-registry.ts`, khai báo cron theo giờ.
  6. Thêm việc vào `apps/server/src/scheduled.ts` do #15 tạo, không đổi kiểu export.
  7. Khai secret email, VAPID và khóa ký unsubscribe trong `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`.
- Success criteria: Test gửi với client giả lập qua, gồm chạy trùng.
- Verify: `pnpm --filter @vox-flow/api test src/reminders/dispatch.test.ts` thoát với mã 0.

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
