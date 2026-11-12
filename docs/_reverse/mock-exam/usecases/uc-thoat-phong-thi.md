# UC: Thoát phòng thi giữa chừng

> Tái lập chưa duyệt (draft).

## a. Tóm tắt / mục tiêu
Học viên rời phòng thi trước khi nộp. ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:178-184]

## b. Actor
- Chính: Học viên.

## c. Tiền điều kiện
- Đang ở phòng thi (bất kỳ bước nào) ✅

## d. Hậu điều kiện
- Học viên về màn chọn bài thi (hoặc forecast nếu đang luyện theo chủ đề) ✅
- Không có yêu cầu nào gửi lên máy chủ: lượt thi vẫn "đang làm", audio đã lên và bản sao thiết bị còn nguyên ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:178-184] 🟡 chính sách lưu/xóa (OQ-7)
- Lượt đẩy audio đang chạy bị hủy; lượt gửi nộp đang chạy (nếu có) không còn điều hướng hay đặt cờ chờ nộp, nhưng máy chủ vẫn có thể chốt bài ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:400-454]

## e. Luồng chính
1. Học viên bấm "Thoát" ở đầu trang. Mọi đồng hồ tạm dừng. ✅ [S21: apps/web/src/features/exam/components/exam-header.tsx:21-26]
2. Hộp thoại "Thoát phòng thi?" nêu: "Các câu đã trả lời sẽ không được chấm." ✅ [S21: apps/web/src/features/exam/components/exit-exam-modal.tsx:14-15]
3. Học viên bấm "Thoát". ✅
4. Hệ thống xóa phiên luyện theo chủ đề và chuyển màn. ✅

## f. Luồng thay thế
- 3a. Học viên bấm "Ở lại": đóng hộp thoại, đồng hồ chạy tiếp. ✅
- 3b. Đang đẩy audio khi thoát: lượt chạy bị hủy, không nộp sau đó. ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:427-454]
- 3c. Đang gửi nộp khi thoát: nếu máy chủ trả về sau đó, hệ thống không điều hướng. (Việc nộp có thể đã được máy chủ chốt) ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:400-425]

## g. Ngoại lệ
- Không có.

## h. Quy tắc & truy vết
- FR: FR-mock-exam-047, FR-mock-exam-048. BR: BR-018.
- Screens: Hộp thoại Thoát phòng thi. Errors: —. OQ: OQ-4, OQ-7.
