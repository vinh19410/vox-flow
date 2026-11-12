---
type: reverse-usecase
feature: progress-history
slug: uc-open-attempt-detail
status: draft
updated: 2026-11-11
---

# UC: Mở chi tiết một lượt thi

> Tái lập chưa duyệt. Nhãn: ✅. Ở production danh sách lượt thi luôn rỗng (OQ-1), nên các bước "có dữ liệu" chỉ được xác nhận bằng test giả lập.

**a. Mục tiêu / mô tả:** Mở chi tiết một lượt thi. 🟡 apps/web/src/features/history/data.ts:17-33

**b. Actor chính:** Học viên đã đăng nhập, đã onboarding ✅ [apps/web/src/routes/_proto/app/route.tsx:7-8]

**c. Tiền điều kiện:**
1. Học viên đang ở Lịch sử hoặc Trang chủ và nhìn thấy ít nhất một lượt (chỉ đạt trong dữ liệu giả lập) 🔵 [apps/web/src/features/history/components/attempt-list.tsx:15].

**d. Hậu điều kiện:**
1. Học viên xem chi tiết kết quả của lượt, hoặc thấy thông báo lỗi/đang chấm ✅ [apps/web/src/features/results/results-screen.tsx:111-160].

**e. Luồng chính:**
1. Học viên bấm một dòng lượt (hoặc thẻ bài gần nhất) ✅ [apps/web/src/features/history/components/attempt-list.tsx:15; apps/web/src/features/dashboard/components/recent-attempt-card.tsx:43].
2. Hệ thống điều hướng tới trang chi tiết theo mã lượt ✅ [apps/web/src/features/app-state/routes.ts:28-33].
3. Hệ thống xét mã "latest" trước, rồi lượt chưa lưu, rồi danh sách; không thấy thì tải trạng thái và kết quả từ máy chủ ✅ [apps/web/src/features/history/data.ts:17-33; apps/web/src/features/results/results-screen.tsx:55-57].
4. Hệ thống hiện chi tiết kết quả (thuộc feature chấm điểm) 🔵 [apps/web/src/features/results/results-screen.tsx:252].

**f. Luồng thay thế / ngoại lệ:**
- 3a. Mã không tồn tại: "Không tìm thấy bài thi" (E-006) ✅ [apps/web/src/features/results/results-screen.tsx:130].
- 3b. Mã của tài khoản khác: "Bạn không có quyền xem bài thi này" (E-007) ✅ [apps/web/src/features/results/results-screen.tsx:130].
- 3c. Lỗi mạng: "Không tải được kết quả" + Tải lại (E-008) ✅ [apps/web/src/features/results/results-screen.tsx:148-154].
- 3d. Cờ chấm điểm tắt và chưa có kết quả: "Bài thi đã được lưu" (E-010) 🟡 [apps/web/src/features/results/results-screen.tsx:223-228; apps/web/src/lib/feature-flags.ts:2] (giá trị cờ ở môi trường thật chưa kiểm chứng, OQ-17).
- 3e. Đang chấm: "Bài thi đang được chấm" ✅ [apps/web/src/features/results/results-screen.tsx:162-169].

**g. Quy tắc & yêu cầu liên quan:** FR-progress-history-014, 020, 023; BR-progress-history-015. Màn: Lịch sử (S19), Trang chủ, Chi tiết lượt (route /app/history/$attemptId). Lỗi: E-progress-history-005..008, 010.

**h. Câu hỏi mở:** OQ-1, OQ-16, OQ-17
