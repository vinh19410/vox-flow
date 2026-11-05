---
phase: 1
title: "Lưu đồng ý có lịch sử"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Lưu đồng ý có lịch sử

## Goal
Đồng ý được lưu theo từng lần thay đổi và các tính năng khác kiểm tra được.

## Files to Create / Modify
- Create: `packages/db/src/schema/consent.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/routers/privacy.ts`
- Modify: `packages/api/src/routers/index.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 6 14; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo bảng `consent_event`.
- Goal: Tạo bảng `consent_event`.
- Target files and symbols: `packages/db/src/schema/consent.ts`
- Steps:
  1. Chỉ thêm dòng mới, không sửa dòng cũ: `userId`, `kind` (`save` hoặc `calibration`), `granted`, `policyVersion`, `createdAt`.
  2. Chạy `pnpm --filter @vox-flow/db db:generate`.
- Success criteria: Migration có bảng mới.
- Verify: `grep -rl --include=migration.sql 'consent_event' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.2 — Tạo API đồng ý.
- Goal: Tạo API đồng ý.
- Target files and symbols: `packages/api/src/routers/privacy.ts` (`getConsent`, `setConsent`, helper `requireConsent`); test: `packages/api/src/routers/privacy.test.ts`
- Steps:
  1. `getConsent` trả giá trị mới nhất; chưa có bản ghi thì coi là tắt.
  2. `requireConsent(db, userId)` được export cho #16, ném `FORBIDDEN` chỉ khi chưa có `consent_event` nào `kind='save'`, tức chưa qua bước đồng ý. `granted=false` vẫn được thi nhưng bài không hiện trong lịch sử; không tự xóa dữ liệu. `calibration` không ảnh hưởng quyền thi.
  3. Viết test: mặc định tắt, đổi rồi đọc lại đúng, không đọc được của người khác.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/privacy.test.ts` thoát với mã 0.

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
