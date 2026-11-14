---
phase: 2
title: "Hiển thị điểm còn lại"
status: completed
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Hiển thị điểm còn lại

## Goal
Học viên thấy điểm còn lại, chi phí điểm từng chế độ, giờ đặt lại 00:00 theo giờ Việt Nam và thông báo trung tính khi chạm trần hệ thống trước khi bắt đầu ở cả desktop, mobile, Forecast, Exam và Results.

## Files to Create / Modify
- Create: `apps/web/src/features/select/use-quota-status.ts`
- Create: `apps/web/src/features/select/components/quota-banner.tsx`
- Modify: `apps/web/src/features/select/select-screen.tsx`
- Modify: `apps/web/src/features/select/select-setup-screen.tsx`
- Modify: `apps/web/src/features/select/components/mode-grid.tsx`
- Modify: `apps/web/src/features/select/components/pre-exam-card.tsx`
- Modify: `apps/web/src/features/forecast/forecast-screen.tsx`
- Modify: `apps/web/src/features/forecast/components/topic-detail-modal.tsx`
- Modify: `apps/web/src/features/exam/use-exam-session.ts`
- Modify: `apps/web/src/features/exam/exam-screen.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/scoring/use-scoring-job.ts`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Modify: `apps/web/src/features/select/__tests__/select-setup-flow.test.tsx`
- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`
- Modify: `apps/web/src/features/scoring/__tests__/use-scoring-job.test.ts`
- Modify: `apps/web/src/features/results/__tests__/scored-results.test.tsx`

## Tasks & Steps

### Task 2.1 — Hook `useQuotaStatus`, `QuotaBanner`, `SelectScreen`, `SelectSetupScreen` & `Forecast` (`--tdd`)
- Goal: Hiển thị điểm còn lại, số điểm từng chế độ, giờ đặt lại 00:00 (giờ Việt Nam), tự động chọn chế độ khả dụng và chặn kèm CTA `"Xem gói trả phí"` khi thiếu điểm hoặc chạm trần toàn hệ thống.
- Target files and symbols:
  - `apps/web/src/features/select/use-quota-status.ts` (`useQuotaStatus`, `modePointCost`, `GLOBAL_CAP_NEUTRAL_MESSAGE`, `QUOTA_EXCEEDED_MESSAGE`)
  - `apps/web/src/features/select/components/quota-banner.tsx` (`QuotaBanner`)
  - `apps/web/src/features/select/select-screen.tsx`, `select-setup-screen.tsx`, `mode-grid.tsx`, `pre-exam-card.tsx`
  - `apps/web/src/features/forecast/forecast-screen.tsx`, `components/topic-detail-modal.tsx`
- Steps:
  1. Thiết kế `useQuotaStatus()` an toàn tuyệt đối khi thiếu `QueryClientProvider` (trường hợp `select-setup-flow.test.tsx`) hoặc khi `useQuery` bị mock trả về mảng (`slice-b.test.tsx`, `forecast-flow.test.tsx`).
  2. Xây dựng `QuotaBanner`: hiển thị `"Còn X/3 điểm hôm nay"`, `"Đặt lại lúc 00:00 (giờ Việt Nam)"`; với `paid` hiển thị `"Gói trả phí · Luyện không giới hạn"`; với `globalCapReached` hiển thị thông báo trung tính `role="alert"` + nút `"Xem gói trả phí"` (`go("billing")`).
  3. Gắn `QuotaBanner` vào `SelectScreen`, `SelectSetupScreen` (mobile) và `ForecastScreen`.
  4. Cập nhật `ModeGrid`: hiện `{cost} điểm` trong footer từng thẻ (giữ nguyên node text `m.time` và class `mt-auto pt-6`), làm mờ thẻ không đủ điểm/chạm trần, tự chuyển `full -> p1` khi điểm còn 1 hoặc 2.
  5. Cập nhật `PreExamCard`: vô hiệu hóa nút `"Đồng ý ghi âm & bắt đầu"` khi không đủ điểm hoặc chạm trần hệ thống, hiển thị lý do + nút `"Xem gói trả phí"`.
  6. Cập nhật `ForecastScreen` & `TopicDetailModal`: hiện chi phí `1 điểm` (P1 / câu lẻ) hoặc `2 điểm` (P2&3) và chặn khi thiếu điểm / chạm trần.
- Success criteria: Tất cả trạng thái 3đ, 2đ, 0đ, `globalCapReached` và `paid` hiển thị chuẩn xác và các test cũ không vỡ.
- Verify:
  - `pnpm --filter web test src/features/__tests__/slice-b.test.tsx`
  - `pnpm --filter web test src/features/select/__tests__/select-setup-flow.test.tsx`
  - `pnpm --filter web test src/features/forecast/__tests__/forecast-flow.test.tsx`

### Task 2.2 — Chặn hạn mức tại `ExamScreen`, `ResultsScreen` & `useScoringJob` (`--tdd`)
- Goal: Khi `attempt.start`, `attempt.submit`, `scoring.retry` hoặc `retakeOf` bị từ chối với mã `QUOTA_EXCEEDED` / `GLOBAL_CAP_REACHED`, hiển thị màn hình/thông báo tiếng Việt rõ ràng thay vì rơi im lặng sang `local_only` hoặc báo lỗi mạng chung chung.
- Target files and symbols:
  - `apps/web/src/features/exam/use-exam-session.ts` (`quotaBlock`)
  - `apps/web/src/features/exam/exam-screen.tsx`
  - `apps/web/src/features/results/results-screen.tsx`
  - `apps/web/src/features/scoring/use-scoring-job.ts`
- Steps:
  1. Trong `useExamSession`: phân biệt `QUOTA_EXCEEDED` / `GLOBAL_CAP_REACHED` từ `attempt.start` -> đặt `quotaBlock` và invalidate query (optional-chain `queryClient?.invalidateQueries?.()`). Mọi lỗi mạng/timeout khác vẫn giữ `quotaBlock = null` để luồng `local_only` hoạt động nguyên vẹn.
  2. Trong `ExamScreen`: khi `session.quotaBlock` khác `null`, render `data-testid="exam-quota-blocked"` (`role="alert"`) với nút `"Xem gói trả phí"` và `"Quay lại"`; trong `doSubmit` hiển thị thông báo hạn mức nếu gặp `QUOTA_EXCEEDED`/`GLOBAL_CAP_REACHED`.
  3. Trong `useScoringJob` và `ResultsScreen`: bổ sung ánh xạ `QUOTA_EXCEEDED` & `GLOBAL_CAP_REACHED` cho `retryScoring` và `handleRetakeWeakest`.
  4. Bổ sung unit test trong `exam-submit.test.tsx`, `use-scoring-job.test.ts` và `scored-results.test.tsx`.
- Success criteria: Toàn bộ test web và kiểm tra kiểu pass hoàn toàn.
- Verify:
  - `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx`
  - `pnpm --filter web test src/features/results/__tests__/scored-results.test.tsx`
  - `pnpm --filter web test src/features/scoring/__tests__/use-scoring-job.test.ts`
  - `pnpm check-types`

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu, sau đó chạy checkpoint `kongming`.

## Failure Protocol
Nếu bất kỳ lệnh Verify nào thất bại: DỪNG NGAY (không tự ý sửa mò hoặc xóa/nới lỏng test), ghi lại lệnh + output lỗi và gọi `kongming` để phân tích nguyên nhân gốc trước khi sửa.
