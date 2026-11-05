---
phase: 1
title: "Tạo tài khoản và lưu cấu hình"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Tạo tài khoản và lưu cấu hình

## Goal
SePay hoạt động và có runbook.

## Files to Create / Modify
- Create: `docs/runbooks/sepay-setup.md`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Xác nhận với người sở hữu sản phẩm đã có: Tài khoản ngân hàng nhận tiền và đăng ký SePay.
  2. Đọc trạng thái #8. Đây là phụ thuộc mềm: nếu chưa xong thì ghi nhận rủi ro và tiếp tục.
- Success criteria: các điều kiện được xác nhận.
- Verify: `no verification needed` — người sở hữu sản phẩm xác nhận bằng lời điều kiện ở mục Steps.

### Task 1.1 — Đăng ký và liên kết tài khoản.
- Goal: Đăng ký và liên kết tài khoản.
- Target files and symbols: `docs/runbooks/sepay-setup.md`
- Steps:
  1. Đọc skill `ak-payment-integration` và tài liệu SePay hiện hành trước khi làm.
  2. Người sở hữu đăng ký SePay và liên kết tài khoản nhận tiền. Agent không nhập thông tin ngân hàng.
  3. Ghi vào runbook các mục: `## Tài khoản`, `## Webhook`, `## Giao dịch thử`, `## Xoay khóa`. Không ghi số tài khoản đầy đủ hay khóa.
- Success criteria: Runbook có đủ 4 mục.
- Verify: `grep -cE '^## (Tài khoản|Webhook|Giao dịch thử|Xoay khóa)' docs/runbooks/sepay-setup.md` in `4`.

### Task 1.2 — Khai báo khóa webhook.
- Goal: Khai báo khóa webhook.
- Target files and symbols: `packages/infra/alchemy.run.ts`, `apps/server/.env.schema`
- Steps:
  1. Thêm `SEPAY_WEBHOOK_API_KEY` bằng `Config.Redacted` vào `env` của Worker.
  2. Khai báo tên biến trong `.env.schema`, không kèm giá trị.
- Success criteria: Biến có trong cấu hình và không lộ giá trị.
- Verify: `grep -c 'SEPAY_WEBHOOK_API_KEY' packages/infra/alchemy.run.ts` in `1` và `pnpm check-types` thoát với mã 0.

### Task 1.3 — Xác nhận giao dịch thử và tình trạng pháp lý.
- Goal: Xác nhận giao dịch thử và tình trạng pháp lý.
- Target files and symbols: `docs/runbooks/sepay-setup.md`
- Steps:
  1. Chuyển một khoản nhỏ, xác nhận SePay ghi nhận, ghi ngày và kết quả dưới `## Giao dịch thử`.
  2. Thêm dòng `Tình trạng hộ kinh doanh: <kết quả>` theo trả lời trong #8. Nếu #8 chưa xong, ghi `chờ #8`.
- Success criteria: Có dòng tình trạng.
- Verify: `grep -c '^Tình trạng hộ kinh doanh:' docs/runbooks/sepay-setup.md` in `1`.

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
