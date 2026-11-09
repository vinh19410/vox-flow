---
phase: 1
title: "Kiểm tra và ký xác nhận"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Kiểm tra và ký xác nhận

## Goal
Có bằng chứng cho từng điều kiện và một quyết định.

## Files to Create / Modify
- Create: `docs/launch/go-live-checklist.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 8 13 14 15 16 17 18 19 20; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Kiểm tra không còn dữ liệu giả trên luồng chính.
- Goal: Kiểm tra không còn dữ liệu giả trên luồng chính.
- Target files and symbols: `apps/web/src/features/billing/components/payment-panel.tsx`, `apps/web/src/features/scoring/scoring-screen.tsx`, `apps/web/src/hooks/use-mic-level.ts`
- Steps:
  1. Chạy lệnh tìm bên dưới.
  2. Nếu có kết quả, mở lại issue của tính năng tương ứng. Không tự sửa trong mốc này.
- Success criteria: Không còn dấu vết mô phỏng trên luồng chính.
- Verify: `grep -rlE 'Prototype:|Chế độ mô phỏng|fake-qr' apps/web/src/features --include='*.tsx' | wc -l` in `0`.

### Task 1.2 — Lập checklist có bằng chứng.
- Goal: Lập checklist có bằng chứng.
- Target files and symbols: `docs/launch/go-live-checklist.md`
- Steps:
  1. Mỗi điều kiện một dòng `- [x] <điều kiện> — Bằng chứng: <đường dẫn>`: tư vấn pháp lý, landing, onboarding, quyền riêng tư và xóa trong 24 giờ, ghi âm, độ chính xác chấm, hạn mức, thanh toán, đối soát.
  2. Chạy thử toàn bộ luồng với một giao dịch thật do người sở hữu thực hiện, ghi kết quả.
  3. Kiểm tra dashboard chi phí AI so với ngân sách dưới 1 triệu/tháng.
  4. Với điều kiện xóa dữ liệu, ghi theo câu trả lời ở #8 và quyết định của người sở hữu về F-21.
- Success criteria: Không còn điều kiện chưa đạt.
- Verify: `grep -c '^- \[ \]' docs/launch/go-live-checklist.md` in `0` và `grep -c '^- \[x\]' docs/launch/go-live-checklist.md` in số lớn hơn hoặc bằng `9`.

### Task 1.3 — Ghi quyết định.
- Goal: Ghi quyết định.
- Target files and symbols: `docs/launch/go-live-checklist.md`
- Steps:
  1. Người sở hữu thêm dòng `Quyết định: mở` hoặc `Quyết định: chưa mở`, kèm ngày.
  2. Agent không được tự ghi dòng này.
  3. Nếu luật sư yêu cầu hồ sơ chuyển dữ liệu, ghi ngày chuyển đầu tiên và hạn 60 ngày.
  4. Sau dòng `Quyết định: mở`, người sở hữu đặt `LAUNCH_OPEN=true` và triển khai lại. Đây là cấu hình, không phải code mới.
- Success criteria: Có quyết định.
- Verify: `grep -c '^Quyết định: mở' docs/launch/go-live-checklist.md` in `1`.

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
