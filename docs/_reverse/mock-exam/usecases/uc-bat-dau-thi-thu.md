# UC: Bắt đầu hoặc nối lại một lượt thi thử

> Tái lập chưa duyệt (draft).

## a. Tóm tắt / mục tiêu
Khi vào phòng thi, hệ thống nối lại lượt thi đang dở khớp chế độ hoặc tạo lượt thi mới trên máy chủ để audio và bài nộp có chỗ gắn vào. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:120-181]

## b. Actor
- Chính: Học viên (thuộc danh sách pilot hoặc cổng đã mở) ✅ [S1: packages/api/src/routers/attempt.ts:43-57]
- Phụ: Máy chủ API, cơ sở dữ liệu.

## c. Tiền điều kiện
- Học viên vừa bấm "Đồng ý ghi âm & bắt đầu" ✅ [S23: apps/web/src/features/select/components/pre-exam-card.tsx:28-39]
- Cổng mở ("true") hoặc email trong danh sách cho phép ✅ [S1: packages/api/src/routers/attempt.ts:44-57]

## d. Hậu điều kiện
- Thành công: có mã lượt thi, trạng thái đồng bộ "sẵn sàng", nút nộp mở khóa ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:103-118]
- Lượt thi mới: trạng thái "đang làm", lưu lịch sử = có, calibration = không ✅ [S1: packages/api/src/routers/attempt.ts:92-102]
- Thất bại/quá 15 giây: trạng thái "thất bại", học viên vẫn làm bài ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:128-130, 171-174]

## e. Luồng chính
1. Phòng thi hỏi máy chủ lượt thi "đang làm" mới nhất. ✅
2. Không có lượt khớp, phòng thi gửi yêu cầu tạo lượt thi với chế độ tương ứng (p1→part1…). ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:82-101]
3. Máy chủ kiểm cổng pilot, tạo lượt thi, trả mã. ✅
4. Phòng thi lưu mã, đưa các bản ghi đang chờ lên máy chủ, mở khóa nút nộp. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:103-118]

## f. Luồng thay thế
- 2a. Có lượt dở không gắn chủ đề, không gắn mã câu, cùng chế độ: dùng lại mã, hiển thị lại các câu đã trả lời (số từ 20), vẫn bắt đầu từ câu đầu. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:137-158] 🟡 hành vi bắt đầu từ câu đầu (OQ-12)
- 2b. Có lượt dở khác chế độ: tạo lượt mới; lượt cũ ở lại "đang làm". ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:143-145]
- 4a. Mã đến muộn sau 15 giây: vẫn áp dụng và chuyển "sẵn sàng". ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:746-781]

## g. Ngoại lệ
- Cổng đóng và email không nằm trong danh sách: FORBIDDEN "Mock exam is currently restricted to pilot candidates." (E-mock-exam-001). Phòng thi không hiện thông báo; chuyển "thất bại" 🟡 (OQ-6). ✅ [S1: packages/api/src/routers/attempt.ts:52-57]
- Dữ liệu tạo lượt thi sai định dạng (E-mock-exam-004) — chỉ xảy ra với luyện theo chủ đề (thi thử chỉ gửi chế độ đã ánh xạ). ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:82-101]
- Treo quá 15 giây: "thất bại" ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:724-744]

## h. Quy tắc & truy vết
- FR: FR-mock-exam-010..016. BR: BR-001, BR-002.
- Screens: Phòng thi. Errors: E-001..E-004. OQ: OQ-6, OQ-12, OQ-14.
