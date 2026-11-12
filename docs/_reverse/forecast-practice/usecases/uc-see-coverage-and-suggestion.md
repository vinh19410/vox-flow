---
type: reverse-usecase
feature: forecast-practice
slug: see-coverage-and-suggestion
status: draft
updated: 2026-11-11
---

# UC: Xem độ phủ và nhận gợi ý chủ đề luyện tiếp (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên biết mình đã luyện bao nhiêu chủ đề của quý và được gợi ý chủ đề nên luyện tiếp (mục tiêu suy luận từ hành vi màn). 🟡 [S9: apps/web/src/features/forecast/components/coverage-banner.tsx:10-45; S6: apps/web/src/features/forecast/forecast-screen.tsx:58-63]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên đã đăng nhập | S13: apps/web/src/routes/_proto/app/route.tsx:6-9 | ✅ |
| Tiền điều kiện | Danh sách chủ đề đã tải; ngày thi lấy từ hồ sơ (nếu có) | S14: apps/web/src/features/app-state/use-profile-hydration.ts:71-76 | ✅ |

**c. Trigger.** Mở màn forecast. ✅ [S6: apps/web/src/features/forecast/forecast-screen.tsx:148-149]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Khung "Độ phủ đề forecast của bạn": số chủ đề đã luyện trên tổng, thanh tiến độ Part 1 và Part 2 và 3 | FR-forecast-practice-018 | S9: apps/web/src/features/forecast/components/coverage-banner.tsx:16-39 | 🟡 |
| 2 | Nếu có ngày thi và còn chủ đề chưa luyện: "Còn N ngày đến ngày thi — luyện khoảng M chủ đề/ngày" | FR-forecast-practice-018 | S9: apps/web/src/features/forecast/components/coverage-banner.tsx:41-44 | 🟡 |
| 3 | Thẻ "Gợi ý luyện tiếp" nêu chủ đề chưa luyện có nhiều thí sinh báo nhất | FR-forecast-practice-019 | S6: apps/web/src/features/forecast/forecast-screen.tsx:157-172 | ✅ |
| 4 | Bấm "Luyện ngay" bắt đầu luyện cả chủ đề (xem uc-practice-topic-or-question) | FR-forecast-practice-019, FR-forecast-practice-021 | S12: apps/web/src/features/__tests__/slice-b.test.tsx:204-215 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Đang tải | Thẻ gợi ý hiện khung chờ | — | S6: apps/web/src/features/forecast/forecast-screen.tsx:150-156 | ✅ |
| Mọi chủ đề đã luyện | "Bạn đã phủ hết đề quý này!" | — | S6: apps/web/src/features/forecast/forecast-screen.tsx:173-181 | ✅ |
| Lỗi hoặc danh sách rỗng | Không hiện thẻ gợi ý | E-forecast-practice-005 | S6: apps/web/src/features/forecast/forecast-screen.tsx:173 | ✅ |
| Hiện tại | Độ phủ luôn 0 và thẻ gợi ý luôn là chủ đề nhiều báo nhất vì không có nơi ghi tiến độ | — | S14: apps/web/src/features/app-state/initial-state.ts:16-17 | 🟡 |

**f. Hậu điều kiện.** Không đổi dữ liệu. ✅ [S9: apps/web/src/features/forecast/components/coverage-banner.tsx:10-47]

**g. Quy tắc liên quan.** BR-forecast-practice-023, 025, 027. Công thức số chủ đề mỗi ngày là hằng số giao diện, không có lý do đi kèm. 🟡

**h. Nguồn và câu hỏi mở.** S6, S9, S14. OQ-2, OQ-5. 🟡
