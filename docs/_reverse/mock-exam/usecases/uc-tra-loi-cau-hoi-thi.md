# UC: Trả lời các câu hỏi trong phòng thi

> Tái lập chưa duyệt (draft).

## a. Tóm tắt / mục tiêu
Học viên nghe giám khảo ảo hỏi từng câu, ghi âm câu trả lời, có thể nói lại, và đi hết các câu của chế độ đã chọn. Mỗi bản ghi được lưu trên thiết bị rồi tải lên máy chủ. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:191-372] [S18: apps/web/src/features/exam/answer-uploads.ts:242-268]

## b. Actor
- Chính: Học viên.
- Phụ: Giám khảo ảo (giọng đọc), bộ ghi âm trình duyệt, kho thiết bị, máy chủ lưu trữ audio.

## c. Tiền điều kiện
- Đã vào phòng thi (có hoặc chưa có mã lượt thi) ✅
- Trình duyệt cấp quyền micro (nếu không, xem ngoại lệ) ✅ [S24: apps/web/src/hooks/use-recorder.ts:59-96]

## d. Hậu điều kiện
- Mỗi câu đã ghi có bản ghi trên thiết bị và (khi có mã lượt thi) có bản trên máy chủ ✅ [S18: apps/web/src/features/exam/answer-uploads.ts:226-229]
- Hết bước cuối: mở hộp thoại kiểm tra trước khi nộp ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:326-330]

## e. Luồng chính
1. Hệ thống hiện màn giới thiệu Part; học viên bấm "Bắt đầu Part n". ✅ [S21: apps/web/src/features/exam/components/exam-intro.tsx:11-25]
2. Giám khảo hỏi: câu hiện dần, đồng thời đọc to nếu chưa tắt tiếng. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:191-206]
3. Hỏi xong, chuyển "sẵn sàng". ✅
4. Học viên bấm micro hoặc Space; hệ thống bắt đầu ghi, hiện đồng hồ và sóng âm. ✅ [S21: apps/web/src/features/exam/components/exam-controls.tsx:30-56]
5. Học viên bấm dừng (hoặc chạm giới hạn 40/120/60 giây); hệ thống nhận file, gắn phiên bản, lưu bản sao thiết bị và tải lên. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:238-307]
6. Hệ thống hiện "Đã ghi âm · mm:ss"; nếu số từ ước lượng thấp hơn ngưỡng, hiện cảnh báo "Câu trả lời khá ngắn (n từ)." ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:221-233]
7. Học viên bấm "Câu tiếp theo" (hoặc Enter) và lặp lại từ bước 2 cho đến hết; ở câu cuối nút là "Hoàn thành". ✅

## f. Luồng thay thế
- 2a. Part 2 (không phải nối tiếp): hiện cue card, chuẩn bị 60 giây có ghi chú nháp; hết giờ hoặc bấm "Sẵn sàng, bắt đầu nói" thì ghi. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:204-206, 316-318]
- 2b. Câu có nối tiếp cố định (p1-1, p3-1): sau câu chính hỏi thêm câu nối tiếp với chip "Hỏi nối tiếp · dựa trên “…”" ✅ [S10: packages/api/src/scoring/mock-exam-bank.ts:26-70] 🟡 nội dung cố định (OQ-2).
- 4a. Học viên tắt tiếng bằng nút loa: không đọc to nữa. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:356-359]
- 6a. Học viên bấm "Nói lại": hủy bản ghi, về "sẵn sàng". ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:361-365]
- 5a. Chưa có mã lượt thi: bản ghi được giữ chờ và tải lên ngay khi có mã. ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:103-118, 281-306]
- 5b. Tải lên lỗi (mạng, 4xx/5xx): chỉ ghi console; tự thử lại khi nộp (E-mock-exam-038). ✅ [S18: apps/web/src/features/exam/answer-uploads.ts:197-206]
- 5c. Máy chủ trả 409 do bản ghi mới hơn đã thắng: coi là kết quả cuối, giữ bản sao thiết bị. ✅ [S18: apps/web/src/features/exam/answer-uploads.ts:221-229]

## g. Ngoại lệ
- Micro bị từ chối / không hỗ trợ: không có thông báo; không có file nào được tải lên (E-mock-exam-037) 🟡 (OQ-5). ✅ [S24: apps/web/src/hooks/use-recorder.ts:59-63, 88-95]
- Lỗi từ máy chủ khi tải lên (E-mock-exam-014..031): xem bảng Mục 6; học viên không thấy lỗi tại chỗ ✅ [S13: apps/server/src/index.ts:79-299].
- Dung lượng/số câu vượt giới hạn: bị từ chối (E-028, E-029) ✅.

## h. Quy tắc & truy vết
- FR: FR-mock-exam-017..031 (và FR-032..038 phía máy chủ). BR: BR-003..008, BR-012..016, BR-019..020.
- Screens: Phòng thi. Errors: E-014..031, E-037, E-038. OQ: OQ-2, OQ-3, OQ-5, OQ-11, OQ-15.
