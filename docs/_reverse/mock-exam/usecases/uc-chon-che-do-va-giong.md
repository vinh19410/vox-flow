# UC: Chọn chế độ thi và giọng giám khảo

> Tái lập chưa duyệt (draft). Nguồn tra ở `../reverse-sources.md`.

## a. Tóm tắt / mục tiêu
Học viên chọn một trong 4 chế độ thi (Full Test, Part 1, Part 2, Part 3) và một trong 3 giọng giám khảo, có thể nghe thử, rồi bắt đầu vào phòng thi. ✅ [S22: apps/web/src/features/exam/data.ts:5-16] Lý do kinh doanh của lựa chọn này không có trong code 🟡 (OQ-1).

## b. Actor
- Chính: Học viên (đã đăng nhập, đã onboarding) ✅ [S25: apps/web/src/routes/_proto/app/route.tsx:6-9]
- Phụ: Giám khảo ảo (giọng đọc trình duyệt) ✅ [S24: apps/web/src/lib/speech.ts:17-43]

## c. Tiền điều kiện
- Học viên đã đăng nhập và hoàn tất onboarding; nếu lỗi lấy hồ sơ thì vẫn vào được ✅ [S25: apps/web/src/lib/auth-guard.ts:49-67]

## d. Hậu điều kiện
- Chế độ và giọng được ghi nhớ trong phiên trình duyệt ✅ [S26: apps/web/src/features/app-state/store.tsx:96-102]
- Khi bắt đầu: phiên luyện theo chủ đề cũ bị xóa, cờ chờ nộp đặt lại, vào phòng thi ✅ [S23: apps/web/src/features/select/components/pre-exam-card.tsx:33-35]

## e. Luồng chính
1. Học viên mở màn "Chọn bài thi". ✅
2. Hệ thống hiện 4 thẻ chế độ; thẻ Full Test có nhãn "Khuyên dùng". ✅ [S23: apps/web/src/features/select/components/mode-grid.tsx:25-29]
3. Học viên bấm một thẻ; hệ thống lưu chế độ. Màn hình rộng: ở lại. ✅ [S23: apps/web/src/features/select/components/mode-grid.tsx:17-22]
4. Học viên chọn một thẻ giọng (Emma, James hoặc Olivia). ✅ [S23: apps/web/src/features/select/components/voice-picker.tsx:46-48]
5. (Tùy chọn) Học viên bấm nghe thử; hệ thống đọc câu chào theo giọng đó. ✅
6. Học viên đọc khối "Trước khi bắt đầu" và bấm "Đồng ý ghi âm & bắt đầu". ✅
7. Hệ thống đưa học viên vào phòng thi (xem `uc-bat-dau-thi-thu`). ✅

## f. Luồng thay thế
- 3a. Màn hình hẹp (tối đa 1023,98 px): sau khi chọn chế độ, hệ thống chuyển sang màn "Thiết lập bài thi" rồi tiếp bước 4. ✅ [S27: apps/web/src/features/select/__tests__/select-setup-flow.test.tsx:32-52]
- 3b. Học viên mở thẳng địa chỉ màn thiết lập: hiển thị đúng màn thiết lập. ✅ [S27: apps/web/src/features/select/__tests__/select-setup-route.test.tsx:84-93]
- 5a. Trình duyệt không hỗ trợ đọc to: không có âm thanh, không báo lỗi. ✅ [S24: apps/web/src/lib/speech.ts:17-43]
- 3c. Giá trị chế độ đã lưu không khớp chế độ nào: màn thiết lập dùng Full Test. ✅ [S23: apps/web/src/features/select/select-setup-screen.tsx:12]

## g. Ngoại lệ
- Chưa onboarding: chuyển hướng sang onboarding ✅ [S25: apps/web/src/lib/auth-guard.ts:49-56].
- Chưa đăng nhập: không vào được màn (xử lý bởi guard chung) 🟡 chi tiết ở feature auth.
- Không có lỗi hiển thị riêng cho UC này.

## h. Quy tắc & truy vết
- FR: FR-mock-exam-001..009. BR: không có BR riêng.
- Screens: Chọn bài thi, Thiết lập bài thi. Errors: —. OQ: OQ-1, OQ-13.
- Priority: TBD 🟡.
