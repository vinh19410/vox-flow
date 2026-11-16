---
phase: 1
title: "Tạo tài khoản và lưu cấu hình"
status: completed
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Tạo tài khoản và lưu cấu hình

## Goal
SePay hoạt động và có runbook.

## Files to Create / Modify
- Đã hoàn tất ở PR #37 (`988c131b`, đã merge vào `dev`): tạo `docs/runbooks/sepay-setup.md` bản đầu, khai báo `SEPAY_WEBHOOK_API_KEY` trong `packages/infra/alchemy.run.ts` và schema biến môi trường của `server` / `infra`.
- Cập nhật trong đợt hoàn thiện #12: `docs/runbooks/sepay-setup.md` (đồng bộ kết quả PO ngày `2026-11-16` và 5 điểm gia cố kỹ thuật cho #19/#20); kiểm chứng đối chiếu `packages/infra/alchemy.run.ts`, `apps/server/src/env.ts` và `.github/workflows/deploy-beta.yml` (không sửa file infra/code).

<!-- Updated: Validation & Red-Team Session 1 (2026-11-16) — Đồng bộ 3 quyết định PO và 5 phát hiện Red-Team/Kongming -->

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Xác nhận với người sở hữu sản phẩm đã có: Tài khoản ngân hàng cá nhân nhận tiền và đăng ký SePay (PO xác nhận ngày `2026-11-16`).
  2. Đọc trạng thái #8: Issue #8 đã `CLOSED` ngày `2026-11-16` theo quyết định PO (không tư vấn luật sư; chuyển điều khoản sang `/terms` tại PR #163; dùng tài khoản cá nhân cho Beta/MVP trước cổng #21).
- Success criteria: các điều kiện được xác nhận.
- Verify: `gh issue view 8 --json state -q .state` in `CLOSED`.

### Task 1.1 — Đăng ký, liên kết tài khoản và chuẩn hóa Runbook.
- Goal: Đăng ký, liên kết tài khoản cá nhân trên SePay và hoàn thiện runbook đầy đủ thông số vận hành cho #19 và #20.
- Target files and symbols: `docs/runbooks/sepay-setup.md`
- Steps:
  1. Đọc skill `ak-payment-integration` và tài liệu SePay hiện hành (`overview.md`, `webhooks.md`, `qr-codes.md`) trước khi làm.
  2. PO đăng ký SePay và liên kết tài khoản ngân hàng cá nhân nhận tiền. Agent không nhập hoặc lưu thông tin ngân hàng đầy đủ.
  3. Hoàn thiện runbook với đủ 4 mục (`## Tài khoản`, `## Webhook`, `## Giao dịch thử`, `## Xoay khóa`), bổ sung URL Beta `https://api.vox.vinhtran.io.vn/webhooks/sepay`, hợp đồng phản hồi `HTTP 200/201` + `{"success": true}`, `Auto retry = ON`, `skip_if_no_code = OFF`, `bank_mode = single`, Cloudflare WAF allowlist IP outbound SePay, quy tắc tương thích ngân hàng (VA cho BIDV/OCB/MSB/KienLongBank, `SEVQR` cho VietinBank), cô lập dữ liệu cá nhân (không lưu `accumulated` thô vào D1), và quản trị `SEPAY_API_TOKEN` cho #20.
- Success criteria: Runbook có đủ 4 mục và không còn giữ chỗ.
- Verify: `grep -cE '^## (Tài khoản|Webhook|Giao dịch thử|Xoay khóa)' docs/runbooks/sepay-setup.md` in `4` và `! grep -qE 'Chờ kiểm thử|Chờ người sở hữu|chờ #8|<server-domain>' docs/runbooks/sepay-setup.md`.

### Task 1.2 — Khai báo khóa webhook và đồng bộ CI Beta.
- Goal: Khai báo khóa webhook redacted trong hạ tầng Worker, đồng bộ schema môi trường và GitHub Actions Environment `beta`.
- Target files and symbols: `packages/infra/alchemy.run.ts` (`SEPAY_WEBHOOK_API_KEY`), `apps/server/src/env.ts` (`CoercedEnvSchema.SEPAY_WEBHOOK_API_KEY`), `.github/workflows/deploy-beta.yml` (`secrets.SEPAY_WEBHOOK_API_KEY`)
- Steps:
  1. Giữ khai báo `SEPAY_WEBHOOK_API_KEY: Config.Redacted("SEPAY_WEBHOOK_API_KEY")` trong `packages/infra/alchemy.run.ts` (đã merge từ PR #37) và kiểu sinh tương ứng trong `apps/server/src/env.ts`.
  2. Xác minh secret `SEPAY_WEBHOOK_API_KEY` đã tồn tại trong GitHub Actions Environment `beta` (`gh secret list --env beta`) và được truyền tại `.github/workflows/deploy-beta.yml`, đồng thời cập nhật quy trình xoay khóa đồng bộ `beta` + sao lưu D1 + `ALCHEMY_STAGE=prod` trong runbook.
- Success criteria: Biến có trong cấu hình, có trong GitHub Environment `beta`, không lộ giá trị và `pnpm check-types` đạt.
- Verify: `grep -c 'SEPAY_WEBHOOK_API_KEY' packages/infra/alchemy.run.ts` in `1`, `grep -c 'SEPAY_WEBHOOK_API_KEY:' apps/server/src/env.ts` in `1`, và `pnpm check-types` thoát với mã `0`.

### Task 1.3 — Xác nhận giao dịch thử và tình trạng pháp lý.
- Goal: Ghi nhận kết quả giao dịch thử thực tế trên SePay và tình trạng hộ kinh doanh sau khi đóng #8.
- Target files and symbols: `docs/runbooks/sepay-setup.md`
- Steps:
  1. Ghi nhận kết quả chuyển khoản thử `10.000 VND` ngày `2026-11-16` xuất hiện trạng thái `Thành công` trên `my.sepay.vn` dưới mục `## Giao dịch thử` (lưu ý bước kiểm tra phản hồi `HTTP 200` + `{"success": true}` của `POST /webhooks/sepay` thuộc phạm vi E2E của #19; giữ webhook ở trạng thái Inactive trước khi #19 deploy).
  2. Cập nhật dòng `Tình trạng hộ kinh doanh:` theo quyết định của PO ngày `2026-11-16` khi đóng #8 (dùng tài khoản cá nhân cho Beta/MVP, chưa đăng ký hộ kinh doanh, chưa thu tiền học viên thật trước cổng #21).
- Success criteria: Có dòng tình trạng chính xác và không còn chuỗi giữ chỗ.
- Verify: `grep -c '^Tình trạng hộ kinh doanh:' docs/runbooks/sepay-setup.md` in `1`, `grep -c '2026-11-16' docs/runbooks/sepay-setup.md` >= `1`, và `! grep -qE 'Chờ kiểm thử|Chờ người sở hữu|chờ #8|<server-domain>' docs/runbooks/sepay-setup.md`.

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
