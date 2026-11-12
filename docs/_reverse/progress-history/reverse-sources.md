# progress-history — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | apps/web/src/features/history/history-screen.tsx:1-78 | code (tsx) | repo HEAD 3a0150c | high | OK | Màn Lịch sử: lọc chế độ, biểu đồ, danh sách, trạng thái trống (Mục 3, 6, 10) |
| S2 | apps/web/src/features/history/data.ts:1-33 | code (ts) | repo HEAD | high | OK | Dữ liệu mẫu HISTORY (6 lượt) và quy tắc chọn lượt chi tiết (Mục 5, 8, gaps) |
| S3 | apps/web/src/features/history/types.ts:1-10 | code (ts) | repo HEAD | high | OK | Hình dạng một lượt thi phía web (Mục 8, ERD) |
| S4 | apps/web/src/features/history/components/trend-chart.tsx:1-44 | code (tsx) | repo HEAD | high | OK | Biểu đồ band theo thời gian (Mục 3, 5) |
| S5 | apps/web/src/features/history/components/attempt-list.tsx:1-33 | code (tsx) | repo HEAD | high | OK | Danh sách lượt thi, thứ tự, huy hiệu, điều hướng (Mục 3, 5) |
| S6 | apps/web/src/features/dashboard/dashboard-screen.tsx:1-69 | code (tsx) | repo HEAD | high | OK | Bảng điều khiển: trạng thái trống, band ước lượng, bố cục (Mục 3, 5, 10) |
| S7 | apps/web/src/features/dashboard/components/readiness-card.tsx:1-62 | code (tsx) | repo HEAD | high | OK | Thẻ mức sẵn sàng: band ước lượng, khoảng, thiếu/đã đạt (Mục 3, 5) |
| S8 | apps/web/src/features/dashboard/components/countdown-card.tsx:1-50 | code (tsx) | repo HEAD | high | OK | Đếm ngược ngày thi, nhập ngày thi, nhịp luyện tĩnh (Mục 3, 5) |
| S9 | apps/web/src/features/dashboard/components/recent-attempt-card.tsx:1-68 | code (tsx) | repo HEAD | high | OK | Thẻ bài gần nhất và cột band 8 lượt (Mục 3, 5) |
| S10 | apps/web/src/features/dashboard/components/today-tasks.tsx:1-33 | code (tsx) | repo HEAD | high | OK | Thẻ "Việc hôm nay" luôn trống (Mục 3, gaps) |
| S11 | apps/web/src/features/app-state/initial-state.ts:1-24; apps/web/src/features/app-state/store.tsx:66-106 | code (ts/tsx) | repo HEAD | high | OK | Giá trị khởi tạo (attempts rỗng, target 7.0), phần state được lưu sessionStorage |
| S12 | apps/web/src/features/app-state/use-profile-hydration.ts:17-106 | code (ts) | repo HEAD | high | OK | Nạp target/examDate từ hồ sơ máy chủ; reset khi đăng xuất (Mục 5, 11) |
| S13 | apps/web/src/features/app-state/types.ts:65-110; apps/web/src/features/app-state/routes.ts:1-36 | code (ts) | repo HEAD | high | OK | Trường attempts trong state, điều hướng history/results |
| S14 | apps/web/src/lib/format.ts:1-11 | code (ts) | repo HEAD | high | OK | Định dạng band (1 chữ số thập phân), tính số ngày còn lại |
| S15 | apps/web/src/routes/_proto/app/dashboard.tsx:1-7; apps/web/src/routes/_proto/app/history.index.tsx:1-7; apps/web/src/routes/_proto/app/history.$attemptId.tsx:1-13; apps/web/src/routes/_proto/app/route.tsx:1-17 | code (route) | repo HEAD | high | OK | Route màn hình và guard hoàn tất onboarding |
| S16 | apps/web/src/features/results/results-screen.tsx:48-260; apps/web/src/features/results/use-scored-result.ts:1-45 | code (tsx/ts) | repo HEAD | high | OK | Chi tiết một lượt: nguồn dữ liệu, các trạng thái tải/lỗi (thuộc feature chấm điểm, chỉ tham chiếu) |
| S17 | apps/web/src/features/__tests__/slice-b.test.tsx:18-25,237-257,295-322 | test (active) | repo HEAD | high | OK | Hành vi Lịch sử/Dashboard dựa trên dữ liệu giả lập trong test |
| S18 | apps/web/src/features/app-state/__tests__/state-and-data.test.ts:151-190,244-262 | test (active) | repo HEAD | high | OK | HISTORY 6 lượt, quy tắc chọn lượt, attempts không khôi phục sau remount |
| S19 | apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:84-184 | test (active) | repo HEAD | high | OK | Nạp hồ sơ, reset attempts khi đăng xuất |
| S20 | apps/web/src/lib/__tests__/format.test.ts:32-41 | test (active) | repo HEAD | high | OK | Quy tắc đếm ngược (null, tương lai, quá khứ về 0) |
| S21 | packages/api/src/routers/index.ts:11-28; packages/api/src/routers/attempt.ts:21,115,144,203; packages/api/src/routers/scoring.ts:58,78,179 | code (ts, negative-search) | repo HEAD | high | OK | Danh sách thủ tục máy chủ hiện có, không có thủ tục liệt kê lượt thi/điểm theo thời gian |
| S22 | packages/api/src/routers/profile.ts:9-51 | code (ts) | repo HEAD | high | OK | Ràng buộc band mục tiêu, ngày thi; đọc hồ sơ |
| S23 | packages/db/src/schema/attempt.ts:5-30; packages/db/src/schema/score.ts:11-45; packages/db/src/schema/profile.ts:6-18 | code (schema) | repo HEAD | high | OK | Bảng lượt thi, điểm tổng, hồ sơ (ERD, không nối vào feature này) |
| S24 | docs/roadmap-work-items.md:33; docs/_product/roadmap.md:38,77; docs/_product/prd.md:56 | md (doc chính) | 2026-11-11 | medium | OK | Đối chiếu Conflict: roadmap/PRD mô tả mục tiêu feature |
| S25 | apps/web/src/features/onboarding/components/goal-step.tsx:31-47; apps/web/src/features/profile/profile-screen.tsx:135-157 | code (tsx) | repo HEAD | high | OK | Nơi duy nhất ghi mục tiêu/ngày thi lên hồ sơ máy chủ (so với thẻ đếm ngược chỉ ghi local) |
| S26 | apps/web/src/layouts/screen-map.tsx:19,26,91-98; apps/web/src/layouts/page-head.tsx:10-14 | code (tsx) | repo HEAD | medium | OK | Mã màn S06/S19 và eyebrow hiển thị |
| S27 | apps/web/src/lib/feature-flags.ts:1-4 | code (ts) | repo HEAD | high | OK | Cờ scoring quyết định E-010 (Mục 6) |

## Ghi chú nguồn

- **Confidence mỗi nguồn:** high = code/test active; medium = tài liệu sản phẩm trạng thái draft hoặc file layout phụ trợ.
- Không có nguồn mojibake. Không có test `skip/todo` trong các file đã đọc cho feature này.
- Không có test riêng cho `trend-chart.tsx`, `readiness-card.tsx` (khoảng tin cậy), `countdown-card.tsx` (nhập ngày), `today-tasks.tsx`, `recent-attempt-card.tsx` (cột band): hành vi các phần này chỉ từ code, không có test xác nhận.
- Mọi bản ghi lượt thi trong test (`TEST_ATTEMPTS`, `HISTORY`) là dữ liệu giả lập, không phải dữ liệu máy chủ.
