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

### Task 2.1 — Soạn thảo Runbook triển khai Cloudflare.
- Goal: Ghi lại đầy đủ quy trình cấu hình, chuẩn bị secret, triển khai qua Alchemy và phương án rollback.
- Target files and symbols: `docs/runbooks/cloudflare-deploy.md`
- Steps:
  1. Ghi chi tiết: cách lấy và cấu hình thông tin xác thực (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`), các biến môi trường bắt buộc (`BETTER_AUTH_SECRET`, `CORS_ORIGIN`).
  2. Hướng dẫn lệnh triển khai chuẩn qua `pnpm --filter @vox-flow/infra run deploy` (giải thích tại sao không dùng `pnpm deploy`).
  3. Hướng dẫn quy trình xử lý CORS cho lần triển khai đầu tiên (deploy lần 1 lấy URL web -> set CORS_ORIGIN -> deploy lần 2).
  4. Hướng dẫn sao lưu D1 trước khi áp migration mới và quy trình rollback.
- Success criteria: Runbook có đủ các mục thiết yếu và tuân thủ nguyên tắc bảo mật (không ghi giá trị secret).
- Verify: `grep -c '^## ' docs/runbooks/cloudflare-deploy.md` in số lớn hơn hoặc bằng `4`.

### Task 2.2 — Triển khai thực tế lên Cloudflare (Chặn bởi yếu tố ngoài).
- Goal: Triển khai backend Worker và database D1 lên môi trường Cloudflare thật.
- Target files and symbols: `packages/infra/alchemy.run.ts`
- Steps:
  1. Yêu cầu người sở hữu sản phẩm cung cấp thông tin xác thực Cloudflare và giá trị `BETTER_AUTH_SECRET`, `CORS_ORIGIN`. Không in hay commit các giá trị này.
  2. Xin xác nhận trực tiếp từ người sở hữu sản phẩm trước khi chạy triển khai theo quy định trong `AGENTS.md`.
  3. Sao lưu D1 trước khi áp migration lên môi trường thật (nếu database đã tồn tại).
  4. Chạy `pnpm --filter @vox-flow/infra run deploy`, không dùng `pnpm deploy` vì đó là lệnh dựng sẵn của pnpm. Ghi lại URL `server` và `web`. Đặt `CORS_ORIGIN` bằng URL web rồi chạy lại nếu lần đầu chưa biết URL.
- Success criteria: API hoạt động và D1 có đủ 4 bảng.
- Verify: `curl -s <server-url>/trpc/healthCheck | jq -r .result.data` in `OK`, và `pnpm dlx wrangler d1 execute <tên-d1> --remote --command "SELECT count(*) AS n FROM sqlite_master WHERE name IN ('user','session','account','verification')" --json | jq '.[0].results[0].n'` in `4`.
- Note: Task này tạm dừng chờ cung cấp thông tin xác thực tài khoản bên ngoài.

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
