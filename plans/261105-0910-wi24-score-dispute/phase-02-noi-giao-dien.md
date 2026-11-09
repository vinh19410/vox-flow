---
phase: 2
title: "Nối giao diện"
status: completed
priority: P2
effort: ""
dependencies: [1]
---

# Phase 2: Nối giao diện

## Goal
Modal báo lỗi gửi thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/results/components/report-modal.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`

## Tasks & Steps

### Task 2.1 — Nối modal và hiển thị trạng thái trên giao diện kết quả.
- Goal: Modal báo lỗi gửi dữ liệu thật tới API, quản lý sự đồng ý chia sẻ âm thanh/bản ghi, cập nhật trạng thái cam kết 72 giờ trên màn hình kết quả và tuân thủ cờ tính năng `SCORE_DISPUTE_ENABLED`.
- Target files and symbols: `apps/web/src/features/results/components/report-modal.tsx`, `apps/web/src/features/results/results-screen.tsx`; test: `apps/web/src/features/results/__tests__/report-modal.test.tsx`
- Steps:
  1. Cập nhật `ReportModalProps` để nhận `attemptId: string`, `open: boolean`, `onClose: () => void`, cùng callback `onSubmitted?: () => void`.
  2. Trong `report-modal.tsx`:
     - Xóa bỏ văn bản sai lệch "và hiệu chuẩn hệ thống"; giải thích rõ việc chia sẻ âm thanh và transcript chỉ phục vụ rà soát bài chấm hiện tại.
     - Thêm ô checkbox xác nhận đồng ý chia sẻ âm thanh và bản ghi (`shareConsent`), mặc định chưa chọn (`checked = false`).
     - Gọi mutation `dispute.submit` khi submit form, truyền đúng `attemptId`, `targetCriterion` (`crit`), `expectedBand` (`expect`), `reason`, và `shareConsent`.
     - Cập nhật thông báo toast thành: "Đã gửi báo lỗi. Chúng tôi cam kết phản hồi trong vòng 72 giờ."
     - Xử lý các mã lỗi: `CONFLICT` ("Bài thi này đã có báo lỗi đang được xử lý"), `FORBIDDEN` ("Tính năng chưa được kích hoạt hoặc không có quyền").
  3. Trong `results-screen.tsx`:
     - Nếu `isDefaultLatest` là `true` hoặc `attemptId` là kết quả mẫu / chưa lưu, ẩn hoặc vô hiệu hóa nút "Báo lỗi chấm".
     - Truy vấn trạng thái báo lỗi qua `dispute.get` với `attemptId`.
     - Nếu tính năng chưa bật (`enabled === false`), ẩn nút "Báo lỗi chấm".
     - Nếu đã có báo lỗi (`dispute` khác `null`): hiển thị badge/thông báo trạng thái báo lỗi (ví dụ: "Báo lỗi đang xử lý · Cam kết phản hồi trước [thời gian do dueAt quy định]") thay vì cho phép mở lại form gửi mới.
  4. Viết bài test toàn diện trong `apps/web/src/features/results/__tests__/report-modal.test.tsx`:
     - Kiểm tra checkbox `shareConsent` mặc định tắt (`false`).
     - Kiểm tra submit gọi đúng payload và hiện toast 72 giờ.
     - Kiểm tra hiển thị thông báo lỗi khi API trả lỗi.
     - Kiểm tra ẩn nút hoặc modal khi cờ tắt hoặc khi attempt là prototype `"latest"`.
- Success criteria: Modal gửi dữ liệu chuẩn xác, tôn trọng quyền riêng tư và giao diện phản ánh đúng trạng thái 72h.
- Verify: `pnpm --filter web test src/features/results/__tests__/report-modal.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
