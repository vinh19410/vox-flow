---
phase: 2
title: "Triển khai lên Cloudflare"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Triển khai lên Cloudflare

## Goal
Worker và D1 chạy thật, cách làm được ghi lại.

## Files to Create / Modify
- Read: `packages/infra/alchemy.run.ts`
- Create: `docs/runbooks/cloudflare-deploy.md`

## Tasks & Steps

### Task 2.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Xác nhận với người sở hữu sản phẩm đã có: Thông tin xác thực tài khoản Cloudflare.
- Success criteria: các điều kiện được xác nhận.
- Verify: `no verification needed` — người sở hữu sản phẩm xác nhận bằng lời điều kiện ở mục Steps.

### Task 2.1 — Triển khai lần đầu.
- Goal: Triển khai lần đầu.
- Target files and symbols: `packages/infra/alchemy.run.ts`
- Steps:
  1. Người sở hữu cung cấp thông tin xác thực Cloudflare và giá trị `BETTER_AUTH_SECRET`, `CORS_ORIGIN`. Không in hay commit các giá trị này.
  2. Hỏi xác nhận trước khi chạy vì lệnh tạo tài nguyên thật trên Cloudflare.
  3. Chạy `pnpm --filter @vox-flow/infra run deploy`, không dùng `pnpm deploy` vì đó là lệnh dựng sẵn của pnpm. Ghi lại URL `server` và `web`. Đặt `CORS_ORIGIN` bằng URL web rồi chạy lại nếu lần đầu chưa biết URL.
- Success criteria: API hoạt động và D1 có đủ bảng.
- Verify: `curl -s <server-url>/trpc/healthCheck | jq -r .result.data` in `OK`, và `pnpm dlx wrangler d1 execute <tên-d1> --remote --command "SELECT count(*) AS n FROM sqlite_master WHERE name IN ('user','session','account','verification')" --json | jq '.[0].results[0].n'` in `4`.

### Task 2.2 — Ghi runbook.
- Goal: Ghi runbook.
- Target files and symbols: `docs/runbooks/cloudflare-deploy.md`
- Steps:
  1. Ghi: cách lấy thông tin xác thực, biến môi trường cần có (chỉ tên), lệnh triển khai, cách kiểm tra, cách rollback.
  2. Ghi nguồn lấy secret; không ghi giá trị.
- Success criteria: Runbook có đủ các mục.
- Verify: `grep -c '^## ' docs/runbooks/cloudflare-deploy.md` in số lớn hơn hoặc bằng `4`.

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
