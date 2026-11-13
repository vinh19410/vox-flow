# Phase 01: Đồng bộ chiều cao & chân card cho 3 lưới card + kiểm chứng 3 viewport

## Mục tiêu
Áp dụng `h-full flex-col` và `mt-auto` đẩy chân card xuống đáy trên 3 phân vùng tệp độc lập (`TopicCard`, `ModeGrid`, `PlanGrid`), khóa bằng unit test, đo tọa độ thực tế trên Chromium (`<= 1px`) kèm chụp ảnh POT 3 viewport và merge vào `dev`.

## Tệp sở hữu theo từng Slice
- **Slice A (`forecast`):**
  - `apps/web/src/features/forecast/components/topic-card.tsx`
  - `apps/web/src/features/forecast/__tests__/topic-card.test.tsx`
- **Slice B (`select`):**
  - `apps/web/src/features/select/components/mode-grid.tsx`
  - `apps/web/src/features/select/__tests__/select-setup-flow.test.tsx`
- **Slice C (`billing`):**
  - `apps/web/src/features/billing/components/plan-grid.tsx`
  - `apps/web/src/features/billing/__tests__/plan-grid.test.tsx`

## Các bước thực hiện
1. **Slice A (`TopicCard`):**
   - Thêm `h-full` cho `<Card>` gốc (`flex h-full cursor-pointer flex-col ...`).
   - Giữ nguyên `<h3>` (`mt-4 text-lg leading-snug font-bold`), không thêm `line-clamp`.
   - Thêm `mb-5` vào `<p>` gợi ý (`mt-1.5 mb-5 line-clamp-2 ...`) để giữ khoảng đệm tối thiểu `20px` phía trên `border-t` trên card cao nhất hàng.
   - Đổi `mt-5` của footer (`border-t border-line pt-4 ...`) sang `mt-auto`.
   - Tạo `topic-card.test.tsx` kiểm tra đầy đủ class layout, tiêu đề không bị cắt, sự kiện click card/bookmark và hiển thị band/CTA.
2. **Slice B (`ModeGrid`):**
   - Thêm `h-full` cho `<button>` chế độ thi (`relative flex h-full flex-col ...`).
   - Đổi dòng thời lượng `<Clock /> {m.time}` từ `mt-6` sang `mt-auto ... pt-6`.
   - Bổ sung test case kiểm tra layout `h-full flex-col` và `mt-auto pt-6` trong `select-setup-flow.test.tsx`.
3. **Slice C (`PlanGrid`):**
   - Thêm `h-full` cho `<button>` gói cước (`group relative flex h-full flex-col ...`).
   - Đổi `<span>` `Chọn gói →` từ `mt-4` sang `mt-auto ... pt-4`.
   - Tạo `plan-grid.test.tsx` kiểm tra cả chế độ thường lẫn `compact` (`examDate` có/không), class layout và sự kiện `onPick`.
4. **Verify:**
   - `pnpm --filter web test src/features/forecast/__tests__/topic-card.test.tsx`
   - `pnpm --filter web test src/features/forecast/__tests__/forecast-flow.test.tsx`
   - `pnpm --filter web test src/features/select/__tests__/select-setup-flow.test.tsx`
   - `pnpm --filter web test src/features/billing/__tests__/plan-grid.test.tsx`
   - `pnpm --filter web test src/features/billing/__tests__/billing-gate.test.tsx`
   - `pnpm --filter web test`
   - `pnpm check-types`
   - Kiểm chứng Chromium DOM `getBoundingClientRect()` (`<= 1px`) + xuất ảnh 3 viewport (`1280x900`, `768x1024`, `390x844`) cho `/app/forecast`, `/app/select`, `/app/billing`.

## Failure Protocol
Nếu bất kỳ lệnh verify nào thất bại hai lần liên tiếp, không nới lỏng assertion hay xóa test; dừng lại ngay, thu thập nguyên nhân và tham vấn `kongming` hoặc quay lại planning nếu vượt phạm vi đã chốt.
