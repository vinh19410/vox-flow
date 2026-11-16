---
title: "Mua gói & QR (`billing`)"
description: "Học viên mua một trong 4 gói qua QR và gói tự kích hoạt khi tiền về, trừ điểm gói nguyên tử trong reserve(), nhờ đó có doanh thu nuôi chi phí chấm."
status: completed
priority: P1
effort: 4d
issue: 19
branch: vinh19410/plan-15-mua-g-i-qr-billing
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0910-wi08-sepay-setup, project:261105-0910-wi10-onboarding, project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi16-payment-reconciliation, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi20-forecast-practice, project:261105-0910-wi23-practice-reminder]
created: 2026-11-05
updated: 2026-11-16
---

# Mua gói & QR (`billing`)

Tracking: #19

Mục 15 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `billing`

> **Handover Contract (`--advice`):** Plan này đã cập nhật theo kết quả phiên `/ak-advise` ngày `2026-11-16` trên #19, runbook `docs/runbooks/sepay-setup.md` (#12), và đã qua cổng Red-Team & Validation ngày `2026-11-16`.

## Outcome
Học viên mua một trong 4 gói qua VietQR (SePay), gói tự kích hoạt đúng một lần khi tiền về; gói thời gian cấp tổng điểm `P` cấu hình được (`48/120/180`) trừ nguyên tử trong `reserve()`, tách biệt khỏi `canViewDetail`, hết điểm hoặc hết hạn tự về mức miễn phí `3 điểm/ngày`.

## Phụ thuộc
- Đã hoàn tất (`CLOSED`): #9, #12, #14, #17, #18.
- Mở khóa: #20, #21, #24, #27.

## Constraints
- Không thu tiền thật cho tới khi #20 xong và #21 đạt: tách riêng cổng `BILLING_ENABLED` (mặc định `'false'`) / `BILLING_ALLOWED_EMAILS` trên server khỏi `LAUNCH_OPEN` (cổng mock exam), kết hợp cờ build `VITE_FEATURE_BILLING` (mặc định `false`).
- Không commit secret; `SEPAY_WEBHOOK_API_KEY`, `SEPAY_BANK_ACCOUNT`, `SEPAY_SUB_ACCOUNT` khai báo `Config.Redacted` qua Worker secret / GitHub `beta` secrets. Không lưu `accumulated`, `description` hay `content` sao kê cá nhân dư thừa vào `payment_event` (chỉ lưu `extractedCode` không chứa PII).
- Sao lưu D1 trước khi áp migration lên môi trường thật; không sửa tay migration đã sinh trong `packages/db/src/migrations`.
- Gói "Đến ngày thi" tối đa 60 ngày, không vượt ngày thi đã đặt (trừ khi nối đuôi gói dài hơn đang còn hạn), hết hạn tự dừng không tự gia hạn.
- Không giữ nhánh `bypassed: true` cho gói trả phí; không ghép 1 bài bằng cả điểm gói lẫn điểm miễn phí.

## Non-goals
- Đối soát tiền sai hoặc trễ (cron/API v2 SePay); thuộc #20.
- Hóa đơn VAT (v1 chỉ cấp biên nhận điện tử theo D-11).
- Nhắc hết hạn gói; thuộc #27.
- Đổi giá gói hoặc đặt trần theo ngày/tuần cho gói trả phí.

## Quyết định đã chốt (2026-11-16 `/ak-advise` + Red-Team)
1. Tổng điểm `P` cấu hình được: `pack` = `0` điểm thi (`3` lượt mở chi tiết, không hạn, không miễn quota/trần hệ thống); `week` = `48` điểm / 7 ngày; `month` = `120` điểm / 30 ngày; `exam` = `180` điểm / đến hết ngày thi (≤ 60 ngày; nếu `examDate === null` thì mặc định 60 ngày).
2. Không trần ngày/tuần cho gói trả phí và phần trừ điểm từ gói không tính vào trần hệ thống `FREE_DAILY_BUDGET_VND`.
3. Mua chồng (stacking): cộng dồn `points_remaining += P`, `plan_points_total += P`, nối đuôi `expires_at = max(now, expires_at) + ngày`. Riêng gói `exam` tính `Math.max(currentExpiresAt, Math.min(endOfExamDateVn, now + 60d))` để không cắt ngắn gói còn hạn dài hơn; `examDate` được snapshot vào `payment_order` lúc tạo đơn để tránh TOCTOU.
4. Hết `P` hoặc hết hạn tự chuyển sang nhánh miễn phí `3 điểm/ngày` (có tính trần hệ thống). `canViewDetail` chỉ kiểm tra gói còn hạn (`expires_at > now`) hoặc `detail_unlock`.
5. `attempt.submit` (`refreshHoldOnSubmit`) chỉ kiểm tra theo `quota_reservation.source === 'free'`; `scoring.retry` re-reserve theo `subscription` trước rồi rơi về `free`, tách khỏi `getEntitlement()`.
6. `release()` và `reclaimOnLateDone()` trả/thu hồi điểm về đúng `source` (`'subscription'` hoặc `'free'`) của `quota_reservation` một cách nguyên tử (`db.batch` + guard idempotent), giữ nguyên giới hạn tối đa 3 lần hoàn điểm/ngày.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Đơn hàng, webhook và hạn mức gói](./phase-01-don-hang-va-webhook.md) | Pending |
| 2 | [Phase 2: Nối giao diện và tài liệu](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] 4 gói đúng giá: 49k (`pack`), 99k (`week`, P=48), 249k (`month`, P=120), 349k (`exam`, P=180). Gói "Đến ngày thi" tối đa 60 ngày và không tự gia hạn.
- [ ] QR VietQR thật (`vietqr.app`), mỗi đơn có mã riêng khó đoán (hỗ trợ `SEVQR` cho VietinBank và `SEPAY_SUB_ACCOUNT` cho Official VA), tiền về tự kích hoạt nguyên tử trong 1 `db.batch`; hỗ trợ mua chồng cộng dồn điểm và ngày.
- [ ] Webhook `POST /webhooks/sepay` xác thực `Authorization: Apikey` timing-safe, bắt buộc `SEPAY_BANK_ACCOUNT` (fail-closed), trả `HTTP 200 {"success": true}`, chống xử lý trùng theo `sepayId`, không lưu `accumulated`/`content`/`description`.
- [ ] `reserve()` trừ điểm gói nguyên tử (bỏ `bypassed`), test 5 yêu cầu đồng thời không vượt `P`, hết `P` về nhánh miễn phí; `attempt.submit` và `scoring.retry` tôn trọng `source`; `release()` và `reclaimOnLateDone()` hoàn/thu hồi điểm đúng nguồn.
- [ ] `canViewDetail` mở chi tiết khi gói còn hạn (kể cả hết `P`) hoặc có `detail_unlock`; gói "Theo lượt" 49k = 3 lượt mở chi tiết (trừ nguyên tử không double-charge), không thêm lượt thi.
- [ ] UI hiện rõ `"Còn X/P điểm · hết hạn dd/mm"` hoặc trạng thái hết điểm gói đang dùng mức miễn phí; không còn `"không giới hạn"` trên bất kỳ màn nào (`billing`, `select`, `forecast`, `profile`), không còn nút giả lập hay `fake-qr.tsx`; mua gói hoặc mở lượt tự động làm mới kết quả đang xem.
- [ ] Cập nhật PRD §4.6 F-18 và `docs/product-decisions.md` với quyết định tổng điểm `P` và quy tắc cộng dồn.

## Red Team Review

### Session — 2026-11-16
**Reviewers:** Security Adversary (`d8c9826a`), Assumption Destroyer (`3c3beff8`)
**Findings:** 9 deduplicated findings (2 Critical, 6 High, 1 Medium — 9 accepted, 0 rejected)
**Severity breakdown:** 2 Critical, 6 High, 1 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---|---|---|---|
| 1 | `getEntitlement()` trả `"paid"` lúc `pointsRemaining === 0` làm `scoring.retry` & `attempt.submit` bỏ qua quota/trần hoặc chặn nhầm | Critical | Accept | Phase 1 Task 1.3 |
| 2 | Webhook ghi `payment_event` tách rời khỏi `payment_order`/`subscription`, lỗi giữa chừng mất kích hoạt vĩnh viễn + `out` chưa dedup | Critical | Accept | Phase 1 Task 1.3 |
| 3 | Kiểm tra `expires_at > now` trong webhook làm rớt giao dịch chuyển trễ hoặc retry ~33 phút của SePay | High | Accept | Phase 1 Task 1.2 & 1.3 |
| 4 | `SEPAY_BANK_ACCOUNT` có thể fail-open, thiếu `Config.Redacted`, `SEPAY_SUB_ACCOUNT` (`acc=`), `SEVQR` bản copy tay & regex `VF...` | High | Accept | Phase 1 Task 1.1–1.3 |
| 5 | Thiếu guard `FIRST_RETAKE_TAKEN` trong `subscription` reserve; `release()`/`reclaimOnLateDone()` cần nguyên tử + chống âm điểm | High | Accept | Phase 1 Task 1.3 |
| 6 | `createOrder` dùng chung `LAUNCH_OPEN` dễ lộ QR tiền thật trước #20/#21; thiếu tái sử dụng đơn `pending` | High | Accept | Plan, Phase 1 Task 1.2 |
| 7 | `unlockDetail` có thể trừ trùng 2 lượt khi bấm đồng thời; `payment_event` không được lưu `content`/PII & phải `onDelete: set null` | High | Accept | Phase 1 Task 1.2 |
| 8 | Gói `exam`: thiếu quy định `examDate = null`, TOCTOU khi sửa profile, cắt ngắn gói dài hơn đang có, lệch múi giờ UTC vs VN ở `profile.ts` | High | Accept | Plan, Phase 1 Task 1.1–1.3 |
| 9 | Hợp đồng refresh `useScoredResult` (không dùng React Query), `s.plan` ở `profile`/`user-card`/`bottom-nav`/`paywall-modal`, chữ `"Không giới hạn"` ở 6 file UI khác & migrate test `attempt.test.ts`/`quota.test.ts` | Medium/High | Accept | Phase 1 Task 1.3, Phase 2 Task 2.1–2.2 |

## Validation Log

### Verification Results
- **Tier:** Light (2 phases)
- **Claims checked:** 16
- **Verified:** 16 | **Failed:** 0 | **Unverified:** 0
- Checked paths & symbols: `packages/api/src/quota/quota.ts` (`reserve`, `buildReserveStatement`, `buildReserveOnRetryStatement`, `release`, `reclaimOnLateDone`, `refreshHoldOnSubmit`, `getQuotaStatus`), `packages/api/src/routers/attempt.ts` (`insertAttemptWithQuota`, `tryReserveAndInsertAttempt`, `submit`), `packages/api/src/routers/scoring.ts` (`retry`, `getResult`), `packages/api/src/entitlements.ts` (`getEntitlement`, `canViewDetail`), `packages/api/src/data-registry.ts`, `packages/api/src/routers/profile.ts`, `apps/server/src/index.ts`, `packages/infra/alchemy.run.ts`, `.github/workflows/deploy-beta.yml`, `apps/web/src/features/results/use-scored-result.ts`, `apps/web/src/features/select/components/mode-grid.tsx`, `apps/web/src/features/select/components/quota-banner.tsx`, `apps/web/src/features/billing/*`, `docs/runbooks/sepay-setup.md`.

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-don-hang-va-webhook.md`, `phase-02-noi-giao-dien.md`
- Decision deltas checked: 9 (cổng `BILLING_ENABLED`, webhook single `db.batch`, bỏ check `expires_at > now` trong webhook, `SEVQR`/`SEPAY_SUB_ACCOUNT`/fail-closed bank account, `scoring.retry` & `attempt.submit` tách `getEntitlement()`, `release`/`reclaimOnLateDone` nguyên tử, `unlockDetail` nguyên tử & `payment_event` không lưu PII, `exam` stacking floor + snapshot `examDate` + `vnDay()` ở `profile.ts`, React Query `useScoredResult` + bỏ `s.plan` + xóa `"Không giới hạn"` toàn bộ UI).
- Reconciled stale references: 0 remaining
- Unresolved contradictions: 0

<!-- slug: wi15-billing-qr -->
