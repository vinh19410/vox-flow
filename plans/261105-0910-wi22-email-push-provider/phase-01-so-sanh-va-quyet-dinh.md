---
phase: 1
title: "So sánh và quyết định"
status: pending
priority: P3
effort: ""
dependencies: []
---

# Phase 1: So sánh và quyết định

## Goal
Có quyết định dựa trên thử nghiệm.

## Files to Create / Modify
- Create: `docs/decisions/email-push-provider.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Xác nhận với người sở hữu sản phẩm đã có: Tên miền gửi email.
- Success criteria: các điều kiện được xác nhận.
- Verify: `no verification needed` — người sở hữu sản phẩm xác nhận bằng lời điều kiện ở mục Steps.

### Task 1.1 — Lập bảng so sánh.
- Goal: Lập bảng so sánh.
- Target files and symbols: `docs/decisions/email-push-provider.md`
- Steps:
  1. So sánh theo: chạy được trên Workers, giá ở mức dự kiến, gửi được tới Gmail, tiếng Việt, xử lý hủy đăng ký.
  2. Dùng bảng giá và tài liệu hiện hành, ghi đường dẫn nguồn và ngày tra cứu.
  3. Ghi cách đẩy qua Web Push và giới hạn iPhone theo OQ-3.
- Success criteria: Có đủ các mục.
- Verify: `grep -cE '^## (So sánh email|Thông báo đẩy|Chi phí)' docs/decisions/email-push-provider.md` in `3`.

### Task 1.2 — Gửi thử và chốt.
- Goal: Gửi thử và chốt.
- Target files and symbols: `docs/decisions/email-push-provider.md`
- Steps:
  1. Gửi thử từ tên miền thật, ghi kết quả vào mục `## Gửi thử`.
  2. Người sở hữu xác nhận lựa chọn, thêm dòng `Quyết định: <dịch vụ>`.
- Success criteria: Có quyết định.
- Verify: `grep -c '^Quyết định:' docs/decisions/email-push-provider.md` in `1`.

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
