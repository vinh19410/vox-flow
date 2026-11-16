---
phase: 2
title: "Nối giao diện và tài liệu"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Nối giao diện và tài liệu

## Goal
Toàn bộ màn hình gói, thanh toán QR, banner hạn mức, chọn chế độ thi, hồ sơ, thanh điều hướng, mở khóa chi tiết và kết quả dùng dữ liệu thật từ backend; xóa hoàn toàn QR giả, nút giả lập và mọi chữ `"không giới hạn"`; cập nhật PRD §4.6 F-18 và `docs/product-decisions.md`.

## Files to Create / Modify
- Create: `apps/web/src/features/billing/use-billing-status.ts`
- Modify: `apps/web/src/features/billing/data.ts`
- Modify: `apps/web/src/features/billing/plan-utils.ts`
- Modify: `apps/web/src/features/billing/billing-screen.tsx`
- Modify: `apps/web/src/features/billing/components/plan-grid.tsx`
- Modify: `apps/web/src/features/billing/components/payment-panel.tsx`
- Delete: `apps/web/src/features/billing/components/fake-qr.tsx`
- Modify: `apps/web/src/features/billing/components/paywall-modal.tsx`
- Modify: `apps/web/src/features/select/use-quota-status.ts`
- Modify: `apps/web/src/features/select/components/quota-banner.tsx`
- Modify: `apps/web/src/features/select/components/mode-grid.tsx`
- Modify: `apps/web/src/features/select/components/pre-exam-card.tsx`
- Modify: `apps/web/src/features/forecast/forecast-screen.tsx`
- Modify: `apps/web/src/features/forecast/components/topic-card.tsx`
- Modify: `apps/web/src/features/forecast/components/topic-detail-modal.tsx`
- Modify: `apps/web/src/features/results/use-scored-result.ts`
- Modify: `apps/web/src/features/results/components/soft-paywall.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/profile/profile-screen.tsx`
- Modify: `apps/web/src/layouts/user-card.tsx`
- Modify: `apps/web/src/layouts/bottom-nav.tsx`
- Modify: `apps/web/src/features/app-state/types.ts` (bỏ/dọn `s.plan` prototype nếu không còn consumer)
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`, `apps/web/src/features/billing/__tests__/*`, `apps/web/src/features/select/__tests__/select-setup-flow.test.tsx`, `apps/web/src/features/results/__tests__/*`
- Modify: `docs/_product/prd.md` (§4.6 F-18)
- Modify: `docs/product-decisions.md`

## Tasks & Steps

### Task 2.1 — Thay QR & webhook giả bằng VietQR thật và đồng bộ React Query cho Results/Billing
- Goal: `PaymentPanel` gọi `billing.createOrder`, hiển thị VietQR thật, nội dung CK (kèm `SEVQR` nếu VietinBank), đếm ngược hết hạn và poll `billing.getOrder`; `useScoredResult` chuyển sang React Query để thanh toán/mở khóa tự động làm mới màn hình kết quả; xóa `fake-qr.tsx` và nút giả lập.
- Target files and symbols: `apps/web/src/features/billing/use-billing-status.ts`, `apps/web/src/features/billing/components/payment-panel.tsx`, `apps/web/src/features/billing/components/fake-qr.tsx` (xóa), `apps/web/src/features/results/use-scored-result.ts`.
- Steps:
  1. Tạo `useBillingStatus` & `invalidateBillingStatus()` (dùng pattern `QueryClientContext` fallback như `use-quota-status.ts` để test không có `QueryClientProvider` vẫn chạy an toàn).
  2. Chuyển `useScoredResult` (`apps/web/src/features/results/use-scored-result.ts`) sang `useQuery` với `trpc.scoring.getResult.queryOptions` (cùng pattern `QueryClientContext` fallback) và `invalidateScoredResult(attemptId)`, để bất kỳ component nào (`PaywallModal` / `PaymentPanel` / `SoftPaywall`) đều tự động làm mới kết quả sau khi thanh toán hoặc mở khóa chi tiết mà không cần truyền `attemptId` qua `_proto/route.tsx`.
  3. Giữ beta gate `FEATURES.billing` sạch quy tắc React hooks (tách wrapper `PaymentPanel` kiểm tra `!FEATURES.billing` trước khi render `<PaymentPanelInner />`) để `billing-gate.test.tsx` tiếp tục pass.
  4. Khi `FEATURES.billing === true`, `PaymentPanelInner` gọi `trpcClient.billing.createOrder.mutate({ planId: plan.id })`, xử lý `FORBIDDEN` (`BILLING_ENABLED` chưa mở — hiện thông báo sắp ra mắt) và `BAD_REQUEST` (ví dụ `examDate` đã qua). Hiển thị `<img src={order.qrUrl} ... />`, số tiền, `order.transferContent` (có nút copy), tên ngân hàng, đếm ngược hết hạn và poll `billing.getOrder.query({ orderId })` mỗi 3 giây.
  5. Khi `order.status === 'paid'`, invalidate `quota.status`, `billing.status`, `billing.listOrders` và `scoring.getResult`, rồi hiện màn thành công kèm thông tin biên nhận (D-11). Xóa nút `"Đã chuyển khoản"` và xóa `apps/web/src/features/billing/components/fake-qr.tsx`.
- Success criteria: Không còn `fake-qr.tsx` và nút giả lập; thanh toán xong tự refresh trạng thái gói và kết quả đang xem; test web pass.
- Verify: `test ! -f apps/web/src/features/billing/components/fake-qr.tsx` thoát với mã 0 và `pnpm --filter web test` thoát với mã 0.

### Task 2.2 — Bỏ toàn bộ chữ `"không giới hạn"`, hiển thị `"Còn X/P điểm"`, mở khóa theo lượt, biên nhận và thay `s.plan`
- Goal: Cập nhật toàn bộ UI dùng dữ liệu thật từ `useBillingStatus` & `useQuotaStatus`, loại bỏ hoàn toàn `"không giới hạn"` ở mọi màn hình, nối `SoftPaywall` với `billing.unlockDetail`, và hiển thị biên nhận thanh toán (D-11).
- Target files and symbols: `data.ts`, `billing-screen.tsx`, `plan-grid.tsx`, `paywall-modal.tsx`, `use-quota-status.ts`, `quota-banner.tsx`, `mode-grid.tsx`, `pre-exam-card.tsx`, `forecast-screen.tsx`, `topic-card.tsx`, `topic-detail-modal.tsx`, `soft-paywall.tsx`, `results-screen.tsx`, `profile-screen.tsx`, `user-card.tsx`, `bottom-nav.tsx`, `app-state/types.ts`.
- Steps:
  1. Trong `data.ts`, bỏ `"Không giới hạn lượt chi tiết"`, ghi rõ `48 điểm thi + mở mọi chi tiết trong 7 ngày`, `120 điểm thi + mở mọi chi tiết trong 30 ngày`, `180 điểm thi + mở mọi chi tiết đến ngày thi`. Trên `BillingScreen` / `PlanGrid`, ghi chú rõ `"Điểm chưa dùng hết sẽ mất khi gói hết hạn"`.
  2. Trong `billing-screen.tsx`: bỏ `"Band tổng không giới hạn"`, bỏ nút prototype `"Về gói miễn phí"`, hiển thị trạng thái thật (`"Còn X/P điểm · hết hạn dd/mm"`, `"Đã dùng hết điểm gói, đang dùng mức miễn phí"`, hoặc số lượt mở chi tiết còn lại). Đổi `"Hóa đơn"` -> `"Biên nhận thanh toán"` (D-11) đọc từ `billing.listOrders` kèm nút tải biên nhận `.txt`.
  3. Trong `paywall-modal.tsx`: bỏ guard `if (s.plan && !plan) return null;` để người có gói `pack` hoặc đã hết điểm vẫn mở modal mua thêm được; rà câu line 49 cho khớp hạn mức `3 điểm/ngày`.
  4. Trong `use-quota-status.ts`: cập nhật `canStartMode` / `canStartForecast` dựa theo `subscription` (`pointsRemaining >= cost` -> cho phép không bị global cap chặn) và rơi về logic `free` (kèm `globalCapReached` & `remainingPoints`) khi hết `P` hoặc hết hạn.
  5. Trong `quota-banner.tsx`: bỏ `"Gói trả phí · Luyện không giới hạn"` và `"Không áp dụng giới hạn điểm ngày & trần hệ thống"`. Khi `subscription && pointsRemaining > 0` hiện `"Gói {planName} · Còn {pointsRemaining}/{planPointsTotal} điểm · hết hạn {dd/mm}"`; khi `subscription && pointsRemaining === 0` hiện `"Đã dùng hết điểm gói · Đang dùng mức miễn phí ({remainingPoints}/{dailyLimit} điểm hôm nay)"` (hoặc cảnh báo hết điểm / chạm trần hệ thống).
  6. Bỏ `"Không giới hạn"` và dùng `pointsRemaining` / `usingFreeFallback` ở `mode-grid.tsx` (luôn hiện `{check.cost} điểm` và giữ auto-fallback khi đang dùng mức miễn phí), `pre-exam-card.tsx`, `forecast-screen.tsx`, `topic-card.tsx`, `topic-detail-modal.tsx`.
  7. Thay `s.plan` bằng `useBillingStatus` / `useQuotaStatus` ở `profile-screen.tsx` (bỏ `"không giới hạn"`), `user-card.tsx`, `bottom-nav.tsx`, `results-screen.tsx`.
  8. Trong `soft-paywall.tsx` và `results-screen.tsx`: nếu `detailCredits > 0` và đang xem bài `attemptId` bị khóa, hiện nút `"Dùng 1 lượt mở bài này (còn N lượt)"` gọi `billing.unlockDetail({ attemptId })`, invalidate `scoring.getResult` và `billing.status`.
  9. Cập nhật toàn bộ test web liên quan (`slice-c.test.tsx`, `billing-gate.test.tsx`, `plan-grid.test.tsx`, `select-setup-flow.test.tsx`, `scored-results.test.tsx`, `profile-screen.test.tsx`).
- Success criteria: Không còn chuỗi `'không giới hạn'` ở bất kỳ file nào trong `apps/web/src/features/` hoặc `apps/web/src/layouts/`; `pnpm check-types` và `pnpm --filter web test` đều pass.
- Verify: `! grep -rn 'không giới hạn' apps/web/src/features/ apps/web/src/layouts/` thoát với mã 0 và `pnpm check-types` và `pnpm --filter web test` thoát với mã 0.

### Task 2.3 — Cập nhật tài liệu sản phẩm (PRD & product-decisions)
- Goal: Ghi nhận tổng điểm `P` từng gói và quy tắc cộng dồn vào PRD §4.6 F-18 và `docs/product-decisions.md`.
- Target files and symbols: `docs/_product/prd.md`, `docs/product-decisions.md`.
- Steps:
  1. Cập nhật `docs/_product/prd.md` Mục 4.6 F-18 với bảng điểm `P` (48/120/180) và quy tắc mở chi tiết khi còn hạn.
  2. Bổ sung quyết định (ngày `2026-11-16`, Issue #19) vào `docs/product-decisions.md`.
- Success criteria: Tài liệu khớp hoàn toàn với code và quyết định `/ak-advise`.
- Verify: Đọc lại 2 file xác nhận đầy đủ, chính xác, không mâu thuẫn với Mục 7 `docs/roadmap-chamro.md`.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

## Failure Protocol
Nếu bất kỳ Verify nào không đạt điều kiện pass, dừng phase để kiểm tra nguyên nhân gốc trước khi sửa tiếp.
