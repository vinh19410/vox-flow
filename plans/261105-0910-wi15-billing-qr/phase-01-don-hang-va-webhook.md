---
phase: 1
title: "Đơn hàng, webhook và hạn mức gói"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Đơn hàng, webhook và hạn mức gói

## Goal
Đơn hàng QR thật, webhook SePay kích hoạt nguyên tử đúng một lần, trừ điểm gói nguyên tử trong `reserve()`, hoàn/thu hồi điểm đúng nguồn trong `release()`/`reclaimOnLateDone()`, xử lý đúng `attempt.submit`/`scoring.retry`, và phân quyền xem chi tiết tách khỏi điểm thi.

## Files to Create / Modify
- Create: `packages/db/src/schema/billing.ts`
- Modify: `packages/db/src/schema/quota.ts` (thêm cột `source: 'free' | 'subscription'`)
- Modify: `packages/db/src/schema/index.ts`
- Generate: `packages/db/src/migrations/*` (qua `pnpm --filter @vox-flow/db db:generate`)
- Create: `packages/api/src/billing/plans.ts` & `packages/api/src/billing/plans.test.ts`
- Create: `packages/api/src/billing/sepay-webhook.ts` & `packages/api/src/billing/sepay-webhook.test.ts`
- Create: `packages/api/src/routers/billing.ts` & `packages/api/src/routers/billing.test.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/api/src/routers/profile.ts` & `packages/api/src/routers/profile.test.ts` (đồng bộ kiểm tra `examDate` theo `vnDay`)
- Modify: `packages/api/src/context.ts`
- Modify: `packages/api/src/data-registry.ts` & `packages/api/src/data-registry.test.ts`
- Modify: `packages/api/src/entitlements.ts` & `packages/api/src/entitlements.test.ts`
- Modify: `packages/api/src/quota/quota.ts` & `packages/api/src/quota/quota.test.ts`
- Modify: `packages/api/src/routers/attempt.ts` & `packages/api/src/routers/attempt.test.ts`
- Modify: `packages/api/src/routers/scoring.ts` & `packages/api/src/routers/scoring.test.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `apps/server/.env.schema`
- Modify: `.github/workflows/deploy-beta.yml`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: Xác nhận các issue phụ thuộc đã `CLOSED`.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy `for n in 12 14 17 18; do gh issue view $n --json state -q .state; done`.
  2. Kiểm tra trạng thái #9.
- Success criteria: mọi dòng đều `CLOSED`.
- Verify: `for n in 12 14 17 18; do gh issue view $n --json state -q .state; done` trả về `CLOSED` trên mọi dòng.

### Task 1.1 — Định nghĩa gói, tính hạn nối đuôi và VietQR trên server
- Goal: Server là nguồn chân lý duy nhất cho giá, thời hạn, tổng điểm `P` (cấu hình được qua env), nội dung chuyển khoản và VietQR URL.
- Target files and symbols: `packages/api/src/billing/plans.ts` (`BILLING_PLANS`, `resolveBillingPlans`, `computeSubscriptionExpiry`, `formatTransferContent`, `extractTransferCode`, `generateVietQrUrl`), `packages/api/src/routers/profile.ts` (`upsertProfileSchema`), test `packages/api/src/billing/plans.test.ts`.
- Steps:
  1. Định nghĩa 4 gói: `pack` (49.000đ, `detailCredits: 3`, `points: 0`, `durationDays: null`), `week` (99.000đ, `points: 48`, `durationDays: 7`), `month` (249.000đ, `points: 120`, `durationDays: 30`), `exam` (349.000đ, `points: 180`, `durationDays: 60` cap). Cho phép ghi đè `P` qua `BILLING_POINTS_WEEK`, `BILLING_POINTS_MONTH`, `BILLING_POINTS_EXAM` (mặc định `48/120/180`).
  2. Viết `computeSubscriptionExpiry({ planId, now, currentExpiresAt, examDate })`:
     - `week` / `month`: `Math.max(nowMs, currentExpiresAtMs ?? 0) + durationDays * 86_400_000`.
     - `exam`: nếu `examDate` có giá trị, tính `endOfExamDateVn = Date.parse(`${examDate}T23:59:59.999+07:00`)`; nếu `examDate === null`, lấy `nowMs + 60 * 86_400_000`. Kết quả khi mua mới là `Math.min(targetEndMs, nowMs + 60 * 86_400_000)`; khi cộng dồn trên gói còn hạn, lấy `Math.max(currentExpiresAtMs ?? 0, Math.min(targetEndMs, nowMs + 60 * 86_400_000))` để không cắt ngắn gói dài hơn đang có.
     - Hàm `validateExamDateForOrder(examDate, nowMs)` dùng trong `createOrder` từ chối `BAD_REQUEST` nếu `examDate` đã qua (`endOfExamDateVn <= nowMs`). Đồng thời cập nhật `upsertProfileSchema` ở `profile.ts` dùng `vnDay()` thay cho `todayUtc` để khớp múi giờ VN.
  3. Viết `formatTransferContent(transferCode, bankCode)` (thêm tiền tố `SEVQR ` khi `bankCode` là `ICB` / `VietinBank` cho cả QR `des=` lẫn bản hiển thị/copy trên UI), `extractTransferCode(code, content)` khớp regex `/\bVF[A-Z0-9]{10,12}\b/i`, và `generateVietQrUrl({ account, subAccount, bankCode, amountVnd, transferContent })` ưu tiên `subAccount || account` làm tham số `acc=` của `https://vietqr.app/img`.
- Success criteria: Các test biên ngày thi (cả null, quá khứ, hôm nay, >60 ngày, cộng dồn không cắt ngắn), cấu hình `P`, `SEVQR`, regex bóc mã, và VietQR URL đều pass.
- Verify: `pnpm --filter @vox-flow/api test src/billing/plans.test.ts` và `pnpm --filter @vox-flow/api test src/routers/profile.test.ts` thoát với mã 0.

### Task 1.2 — Schema D1, đơn hàng QR, mở chi tiết theo lượt và Data Registry
- Goal: Tạo bảng billing, router `billing` (`createOrder`, `getOrder`, `listOrders`, `status`, `unlockDetail`), đăng ký `DATA_REGISTRY` / `NON_PERSONAL_TABLES`, và sinh migration Drizzle.
- Target files and symbols: `packages/db/src/schema/billing.ts` (`paymentOrder`, `subscription`, `paymentEvent`, `detailCredit`, `detailUnlock`), `packages/db/src/schema/quota.ts` (`quotaReservation.source`), `packages/api/src/routers/billing.ts`, `packages/api/src/data-registry.ts`, `packages/infra/alchemy.run.ts`, `apps/server/.env.schema`, `.github/workflows/deploy-beta.yml`, test `packages/api/src/routers/billing.test.ts`.
- Steps:
  1. Tạo `packages/db/src/schema/billing.ts`:
     - `payment_order`: `id`, `userId` (`onDelete: "cascade"`), `planId`, `amountVnd`, `transferCode` (UNIQUE), `examDateSnapshot` (text nullable — giữ ngày thi tại lúc tạo đơn để webhook không bị TOCTOU), `status` (`pending | paid | expired | refunded`), `sepayId`, `expiresAt`, `paidAt`, `createdAt`.
     - `subscription`: `userId` (PK, `onDelete: "cascade"`), `planId`, `pointsRemaining`, `planPointsTotal`, `expiresAt`, `lastReservationId`, `lastOrderId`, `createdAt`, `updatedAt`.
     - `payment_event`: `id`, `sepayId` (UNIQUE), `transferType` (`in | out`), `gateway`, `accountNumber`, `subAccount`, `transferAmount`, `extractedCode` (nullable — chỉ mã `VF...`, tuyệt đối KHÔNG lưu `accumulated`, `content` hay `description` sao kê cá nhân), `referenceCode`, `transactionDate`, `orderId` (nullable, `onDelete: "set null"`), `matchStatus`, `createdAt`.
     - `detail_credit`: `userId` (PK, `onDelete: "cascade"`), `remaining`, `lastUnlockAttemptId`, `updatedAt`.
     - `detail_unlock`: `id`, `userId` (`onDelete: "cascade"`), `attemptId` (`onDelete: "cascade"`), `createdAt`, unique index `(userId, attemptId)`.
     - Thêm `source` (`'free' | 'subscription'`, default `'free'`) và `lastRefundToken` (text nullable) vào `quota_reservation` (`packages/db/src/schema/quota.ts`).
  2. Chạy `pnpm --filter @vox-flow/db db:generate` để sinh migration; không sửa tay file SQL sinh ra.
  3. Cập nhật `packages/api/src/data-registry.ts`: đăng ký `detail_unlock` (trước `attempt`), `detail_credit`, `subscription`, `payment_order` vào `DATA_REGISTRY`, và `payment_event` vào `NON_PERSONAL_TABLES`; bổ sung test vào `data-registry.test.ts`.
  4. Khai `SEPAY_BANK_ACCOUNT` (`Config.Redacted`), `SEPAY_SUB_ACCOUNT` (`Config.Redacted` default `""`), `SEPAY_BANK_CODE`, `BILLING_ENABLED` (default `"false"`), `BILLING_ALLOWED_EMAILS` (default `""`), `BILLING_POINTS_WEEK/MONTH/EXAM` trong `packages/infra/alchemy.run.ts`, `packages/api/src/context.ts`, `apps/server/.env.schema` và `.github/workflows/deploy-beta.yml` (cũng truyền `VITE_FEATURE_BILLING: ${{ vars.VITE_FEATURE_BILLING || 'false' }}` nếu cần bật thử nghiệm qua GitHub vars mà mặc định vẫn `false`).
  5. Viết `billingRouter`:
     - `createOrder`: kiểm tra cổng riêng `BILLING_ENABLED === 'true'` hoặc email thuộc `BILLING_ALLOWED_EMAILS` (không dùng chung `LAUNCH_OPEN` của mock exam), ngược lại trả `FORBIDDEN`. Nếu đã có đơn `pending` chưa hết hạn cùng `(userId, planId, amountVnd)` (và cùng `examDate` với gói `exam`) thì tái sử dụng đơn đó để tránh spam; ngược lại kiểm tra `validateExamDateForOrder` và tạo đơn mới với `transferCode` (`VF...`), `examDateSnapshot`, `expiresAt = now + 15 phút`, trả về `qrUrl`, `transferContent` (có `SEVQR ` nếu VietinBank), `bankCode`, `accountNumber` (lưu ý chỉ hiển thị số tài khoản nhận chuyển khoản cần thiết trên phiên checkout đã xác thực), `amountVnd`, `expiresAt`.
     - `getOrder`: chỉ chủ đơn mới xem được.
     - `listOrders`: trả danh sách đơn `paid` của user làm biên nhận thanh toán (D-11).
     - `status`: trả `{ subscription: { planId, planName, pointsRemaining, planPointsTotal, expiresAt } | null, detailCredits: number }`.
     - `unlockDetail`: chỉ chủ bài, chỉ khi `attempt_score.status === 'done'`. Chạy trong 1 `db.batch` nguyên tử: `UPDATE detail_credit SET remaining = remaining - 1, last_unlock_attempt_id = ? WHERE user_id = ? AND remaining > 0 AND NOT EXISTS (SELECT 1 FROM detail_unlock WHERE user_id = ? AND attempt_id = ?)` -> `INSERT INTO detail_unlock ... SELECT ... FROM detail_credit WHERE user_id = ? AND last_unlock_attempt_id = ? ON CONFLICT DO NOTHING`; nếu đã mở trước đó thì trả `{ unlocked: true, alreadyUnlocked: true }` mà không trừ thêm.
- Success criteria: Test `billing.test.ts` (gồm concurrency test `unlockDetail` không trừ 2 lần, reuse pending order, `BILLING_ENABLED` / `BILLING_ALLOWED_EMAILS` gate) và `data-registry.test.ts` pass.
- Verify: `pnpm --filter @vox-flow/api test src/routers/billing.test.ts` và `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát với mã 0.

### Task 1.3 — Webhook SePay nguyên tử, `reserve()`/`release()`/`scoring.retry` và `canViewDetail`
- Goal: Xử lý webhook SePay idempotent trong một `db.batch`, thay nhánh `bypassed` bằng trừ điểm gói nguyên tử, cập nhật `attempt.submit` & `scoring.retry` theo `source`, hoàn/thu hồi điểm đúng nguồn, và tách `canViewDetail`.
- Target files and symbols: `packages/api/src/billing/sepay-webhook.ts`, `apps/server/src/index.ts`, `packages/api/src/entitlements.ts`, `packages/api/src/quota/quota.ts`, `packages/api/src/routers/attempt.ts`, `packages/api/src/routers/scoring.ts`, tests `sepay-webhook.test.ts`, `entitlements.test.ts`, `quota.test.ts`, `attempt.test.ts`, `scoring.test.ts`.
- Steps:
  1. Tạo `POST /webhooks/sepay` trong `apps/server/src/index.ts` gọi `handleSepayWebhook`:
     - Từ chối `401` nếu `SEPAY_WEBHOOK_API_KEY` rỗng hoặc header `Authorization: Apikey <key>` không khớp (`timingSafeEqual`).
     - Validate JSON payload; **fail-closed** nếu `SEPAY_BANK_ACCOUNT` rỗng/chưa cấu hình (ghi log cấu hình thiếu, trả 500 hoặc không bao giờ kích hoạt đơn).
     - Pre-read (chỉ đọc): kiểm tra `payment_event` theo `sepayId`; kiểm tra `transferType === 'out'`, kiểm tra `accountNumber` (và `subAccount` nếu `SEPAY_SUB_ACCOUNT` được cấu hình), bóc `extractedCode = extractTransferCode(payload.code, payload.content)`, tìm `payment_order` theo `transferCode` (chấp nhận mọi đơn `status === 'pending'` khớp `transferCode` & `transferAmount >= order.amountVnd` mà **không** từ chối theo `order.expiresAt`, tránh mất tiền do chuyển trễ hoặc retry 33 phút của SePay). Nếu `order` là gói thời gian, đọc trước `subscription` hiện tại (hoặc dùng SQL upsert).
     - Thực thi ghi **trong một `db.batch` duy nhất**:
       - Stmt 1: `INSERT INTO payment_event (...) VALUES (...) ON CONFLICT(sepay_id) DO NOTHING RETURNING id`.
       - Khi đủ điều kiện kích hoạt (`matchStatus === 'matched'`):
         - Stmt 2: `UPDATE payment_order SET status='paid', sepay_id=?, paid_at=? WHERE id=? AND status='pending' RETURNING id`.
         - Stmt 3 (gói `pack`): `INSERT INTO detail_credit ... ON CONFLICT(user_id) DO UPDATE SET remaining = detail_credit.remaining + 3 ... WHERE EXISTS (SELECT 1 FROM payment_order WHERE id=? AND sepay_id=?)` (hoặc điều kiện idempotent theo `order.id`).
         - Stmt 3 (gói `week | month | exam`): tính `newExpiresAt` dùng `order.examDateSnapshot` (không phụ thuộc biến động profile sau đó), thực thi `INSERT INTO subscription (...) VALUES (...) ON CONFLICT(user_id) DO UPDATE SET points_remaining = CASE WHEN subscription.expires_at > ? THEN subscription.points_remaining + ? ELSE ? END, plan_points_total = CASE WHEN subscription.expires_at > ? THEN subscription.plan_points_total + ? ELSE ? END, expires_at = CASE WHEN subscription.expires_at > ? THEN ... ELSE ... END, plan_id = ?, last_order_id = ?, updated_at = ? WHERE COALESCE(subscription.last_order_id, '') <> ?`.
     - Mọi request qua được bước auth đều trả `HTTP 200` và body JSON chính xác `{"success": true}`.
  2. Cập nhật `packages/api/src/entitlements.ts`:
     - `getEntitlement(db, userId, now)` trả `"paid"` khi có `subscription` với `expiresAt > now` (chỉ đại diện quyền xem chi tiết / UI; KHÔNG dùng để bypass `reserve()`, `attempt.submit`, hay `scoring.retry`).
     - `canViewDetail(db, userId, attemptId, now)` trả `true` nếu có `subscription` còn hạn (`expiresAt > now`, kể cả khi `pointsRemaining === 0`) HOẶC có bản ghi `detail_unlock(userId, attemptId)`.
  3. Cập nhật `packages/api/src/quota/quota.ts`, `packages/api/src/routers/attempt.ts`, và `packages/api/src/routers/scoring.ts`:
     - Bỏ hoàn toàn nhánh `bypassed: true` không trừ điểm trong `reserve()` và `insertAttemptWithQuota()`.
     - Thêm `buildSubscriptionReserveStatements(db, ...)`: dùng trong `db.batch` để trừ `points` nguyên tử trên `subscription` (`SET points_remaining = points_remaining - ?, last_reservation_id = ? WHERE user_id = ? AND expires_at > ? AND points_remaining >= ?` kèm guard `NOT EXISTS (... retake_of_attempt_id ...)` cho first retake) -> chèn `quota_reservation` (`source = 'subscription'`, `costVnd = 0`, `WHERE last_reservation_id = ?`) -> chèn `attempt`.
     - Nếu batch subscription không chèn được dòng (không có gói, hết hạn, hoặc `points_remaining < points`), nếu không phải lỗi `FIRST_RETAKE_TAKEN` thì tự động rơi sang nhánh miễn phí `3 điểm/ngày` (`source = 'free'`, có kiểm tra trần hệ thống). Không bao giờ chia 1 bài cho cả 2 nguồn điểm.
     - Cập nhật `usedPointsSubquery` & `usedPointsExcludingSubquery` chỉ đếm `AND source = 'free'` để điểm đã dùng từ gói không chiếm mất 3 điểm miễn phí sau khi hết gói.
     - Cập nhật `attempt.submit` (`attempt.ts:1002-1012`) và `refreshHoldOnSubmit`: chỉ áp dụng `refreshHoldOnSubmit` khi `quota_reservation.source === 'free'` (bỏ qua nếu `source === 'subscription'`), không phụ thuộc `getEntitlement()`.
     - Cập nhật `scoring.retry` (`scoring.ts:165-256`): bỏ nhánh `if (entitlement === "free") ... else bypass`. Nếu `quota_reservation.status === 'active'`, chỉ cần log + update `attempt_score`; nếu đã `'released'` (hoặc thiếu), thử `db.batch` trừ từ `subscription` (`points_remaining >= effectivePoints`) trước rồi mới rơi về `buildReserveOnRetryStatement` (`source = 'free'`, có `DAILY_FREE_POINTS` và `budgetCapVnd`).
     - Cập nhật `release()` và `reclaimOnLateDone()`: dùng `db.batch` + `lastRefundToken` để khi `source === 'subscription'` chuyển `'active' -> 'released'` (vẫn tôn trọng `MAX_DAILY_REFUNDS = 3`), điểm được hoàn nguyên tử đúng 1 lần vào `subscription.points_remaining`; khi `reclaimOnLateDone()` chạy với `source === 'subscription'`, trừ `MAX(0, points_remaining - points)` để không bị âm nếu người dùng đã tiêu điểm vừa hoàn.
     - Cập nhật `getQuotaStatus()` trả thêm `subscription: { planId, planName, pointsRemaining, planPointsTotal, expiresAt } | null` và `usingFreeFallback: boolean` (true khi còn hạn gói nhưng `pointsRemaining === 0` hoặc chưa đủ điểm).
     - Migrate `packages/api/src/quota/quota.test.ts` (bỏ test `bypassed: true`, thêm test concurrency 5 request không vượt `P`, hết `P` về free, retake guard, `release()` & `reclaimOnLateDone()` trên gói) và `packages/api/src/routers/attempt.test.ts:1772-1803` (dùng fixture `subscription` thay cho mock `getEntitlement: "paid"`), plus tests cho `scoring.retry`.
- Success criteria: Tất cả test webhook, entitlements, quota, attempt, và scoring đều pass.
- Verify: `pnpm --filter @vox-flow/api test src/billing/sepay-webhook.test.ts`, `pnpm --filter @vox-flow/api test src/quota/quota.test.ts`, `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts`, `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts`, `pnpm --filter @vox-flow/api test src/entitlements.test.ts` đều thoát với mã 0.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

## Failure Protocol
Nếu bất kỳ Verify nào không đạt điều kiện pass, dừng phase để kiểm tra nguyên nhân gốc trước khi sửa tiếp.
