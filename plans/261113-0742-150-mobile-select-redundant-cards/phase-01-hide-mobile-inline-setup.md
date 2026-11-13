# Phase 01: Đồng bộ breakpoint & TDD ẩn inline setup `< 1024px`

## Mục tiêu
Chia sẻ một hằng số và hook `matchMedia` (`(max-width: 1023.98px)`) giữa `ModeGrid` và `SelectScreen` để vừa không mount `VoicePicker` + `PreExamCard` trên `/app/select` ở viewport `< 1024px`, vừa bảo vệ thêm bằng `hidden lg:grid`, đồng thời phản ứng đúng khi resize cửa sổ qua ngưỡng `1024px`.

## Tệp sở hữu & Biểu tượng
- `apps/web/src/features/select/use-select-mobile-viewport.ts`:
  - `SELECT_MOBILE_QUERY = "(max-width: 1023.98px)"`
  - `isSelectMobileViewport(): boolean`
  - `useSelectMobileViewport(): boolean` (dùng `useSyncExternalStore`)
- `apps/web/src/features/select/components/mode-grid.tsx`:
  - `ModeGrid` dùng `isSelectMobileViewport()` khi click card.
- `apps/web/src/features/select/select-screen.tsx`:
  - `SelectScreen` đọc `const isMobileViewport = useSelectMobileViewport()` và chỉ mount `<div className="mt-5 hidden gap-5 lg:grid lg:grid-cols-[1.4fr_1fr]">` chứa `<VoicePicker />` + `<PreExamCard />` khi `!isMobileViewport`.
- `apps/web/src/features/select/__tests__/select-setup-flow.test.tsx`
- `apps/web/src/features/select/__tests__/select-setup-route.test.tsx`

## Các bước (TDD Red -> Green)
1. **Red:** Bổ sung unit test cho `SelectScreen` ở `< 1024px` (đủ 4 mode card + giữ highlight `s.mode`, vắng mặt `Giọng giám khảo`, `Trước khi bắt đầu`, nút `Đồng ý ghi âm & bắt đầu`) và test resize động qua ngưỡng `1024px` trong `select-setup-flow.test.tsx`, cùng kiểm tra router integration trong `select-setup-route.test.tsx`. Chạy test để xác nhận thất bại trước khi sửa code.
2. **Green:** Tạo `use-select-mobile-viewport.ts`, cập nhật `mode-grid.tsx` và `select-screen.tsx`.
3. **Verify:**
   - `pnpm --filter web test src/features/select/__tests__/select-setup-flow.test.tsx`
   - `pnpm --filter web test src/features/select/__tests__/select-setup-route.test.tsx`
   - `pnpm --filter web test src/features/__tests__/slice-b.test.tsx`
   - `pnpm --filter web check:no-mock`
   - `pnpm check-types`

## Failure Protocol
Nếu bất kỳ lệnh verify nào thất bại hai lần liên tiếp hoặc phát hiện xung đột/giả định sai ngoài phạm vi brief, dừng triển khai ngay, ghi lại lỗi thực tế và tham vấn `kongming` (hoặc dừng hỏi người dùng nếu chạm stop condition).
