# Màn chấm điểm + kết quả thật cho luyện đề Forecast (beta)

Branch: `worktree-agent-aa72a258b2ec98df6` (base `d75b018`, `feat/scoring-pipeline-forecast`). Chỉ sửa `apps/web/**`.

## Thay đổi

- **App state**: thêm `scoringAttempt: { attemptId, submitted } | null` vào `AppState`, lưu kèm sessionStorage để F5 ở `/scoring` vẫn tiếp tục theo dõi.
- **Nộp bài** (`exam-screen.tsx`): luyện Forecast có attemptId → ghi `scoringAttempt` và chuyển `/scoring`, không gọi submit ngầm nữa. Chế độ khác giữ nguyên submit ngầm, chỉ xoá `scoringAttempt` cũ nếu còn.
- **Màn chấm** (`scoring/use-scoring-job.ts`, `scoring-screen.tsx`):
  - Màn chấm tự gọi `attempt.submit`. Nếu lỗi, kiểm tra `scoring.status` để không báo lỗi nhầm khi submit thực ra đã thành công.
  - "Gửi lại": nếu server báo `BAD_REQUEST` (bài đã nộp nhưng chưa vào hàng chấm) thì gọi `scoring.retry`.
  - Poll `scoring.status` mỗi 2,5 giây và dừng khi done, failed hoặc unmount. Khi `done` thì `goResult(id, {replace})`.
  - `failed` hiển thị nút "Chấm lại" (gọi `scoring.retry` rồi poll tiếp) và nút "Về trang chủ".
  - Lỗi mạng 3 lần liên tiếp hiển thị "Thử lại". Trạng thái `not_scored` kéo dài 4 lượt poll được coi là failed.
  - `scorable=false` hoặc không có job thì giữ nguyên EmptyState "đã ghi nhận".
  - Các data-testid: `scoring-progress`, `scoring-status`, `scoring-step`, `scoring-failed`, `scoring-submit-error`, `scoring-connection-error`.
- **Màn kết quả** (`results-screen.tsx`, `use-scored-result.ts`, `scored-result.ts`):
  - Attempt từ server (khác `latest`, không có `resultData`, không có trong state local) thì gọi `scoring.status` và `scoring.getResult`.
  - Có kết quả thì hiển thị bản thật, bất kể `FEATURES.scoring`: band tổng, 4 tiêu chí đã mở khoá (không paywall), evidence kèm `where`, improve, và ReviewList dựng từ câu hỏi + transcript (không có nút phát giả lập).
  - Trạng thái khác: đang tải; lỗi kèm nút "Tải lại"; queued/processing có nút "Xem tiến trình chấm" về `/scoring`; failed có "Chấm lại"; không chấm thì giữ EmptyState "đã lưu".
- **Component**: `BandHero` và các trường `range`/`runs`/`metrics` trong `CriteriaGrid`/`CriterionDetail` chuyển thành tuỳ chọn và bị ẩn khi không có. Prototype vẫn truyền đủ nên hiển thị như cũ (giá trị mặc định `runs` chuyển sang nơi gọi). `ReviewList` sửa lỗi gọi hook sau `return` sớm, thêm prop `playback`, và ẩn chú giải đánh dấu khi không có đánh dấu nào. Nhãn `where` của evidence giờ hiện cả trên mobile.

## Kiểm chứng

- Test mới: `scoring/__tests__/scoring-screen.test.tsx` (11), `results/__tests__/scored-results.test.tsx` (7), `exam/__tests__/exam-submit.test.tsx` (2); thêm 1 case persist vào `state-and-data.test.ts`, cập nhật kỳ vọng shape persisted (thêm `scoringAttempt: null`).
- `pnpm --filter web test`: 33 files / 238 tests pass. `pnpm check-types`: 7/7 tasks pass.

## Chưa kiểm chứng

- Chưa chụp màn hình ở 375/768/1440 vì cần backend chấm thật và phiên đăng nhập. Layout chỉ dùng token/lớp có sẵn (`max-w-md`, `grid lg:`…).
- Dark mode: layout `_proto` ép light (`routes/_proto/route.tsx` xoá class `dark`), nên các màn này không có biến thể dark.
- Chưa chạy end-to-end với backend thật. `scoring.retry` khi trạng thái là `not_scored` phụ thuộc vào phần backend đang được làm song song.
