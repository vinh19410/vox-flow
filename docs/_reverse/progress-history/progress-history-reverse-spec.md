---
type: reverse-srs
feature: progress-history
status: draft
updated: 2026-11-11
confidence_summary: "✅54 🔵7 🟡18"
links: [reverse-sources.md, reverse-gaps.md, _evidence.md, srs/progress-history-reverse-flows.md, srs/progress-history-reverse-states.md, srs/progress-history-reverse-erd.md, usecases/progress-history-reverse-usecase-index.md]
---

# progress-history — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập, **CHƯA duyệt**). Nhãn: ✅ chắc chắn · 🔵 suy đoán · 🟡 cần xác nhận.
> **Cảnh báo độ tin cậy thấp:** UI của feature tồn tại đầy đủ nhưng **không có đường nạp dữ liệu lượt thi thật**: danh sách lượt thi phía web khởi tạo rỗng và không có nơi nào gán giá trị ngoài test; máy chủ không có thủ tục liệt kê lượt thi/điểm theo thời gian. Toàn bộ hành vi "có dữ liệu" dưới đây là hành vi của UI khi được cấp dữ liệu giả lập (prototype/test), không phải hành vi quan sát được ở production. Xem Mục 1, OQ-1, `_evidence.md` §7.

## 0. Truy vết nguồn & độ tin cậy

- **CHƯA duyệt.** Bộ tài liệu này tái lập từ source code, chưa qua BA/PO.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Audit độc lập:** đã chạy 2026-11-11, hạ 8 claim, sửa 20 cite.
- **Cách đếm nhãn:** đếm cột Nhãn (cột cuối) của các bảng Mục 2-7, 10, 11; không đếm Mục 0.3, 8, 9, cột Priority, các file srs/ và usecases/.

### 0.3 Khác biệt với tài liệu chính

| Điểm | Reverse nói (từ nguồn) | Doc chính nói | Đề xuất |
|------|------------------------|---------------|---------|
| Trạng thái triển khai | Màn Dashboard và Lịch sử đã có UI, nhưng không có nguồn dữ liệu lượt thi thật ✅ [S1, S6, S11] | `docs/roadmap-work-items.md:33`: mục 18 "Tiến độ band" trạng thái 🔒, phụ thuộc mục 11 (đã xong) và mục 13 (chưa xong), chưa làm ✅ | `/gap`: xác nhận UI hiện tại là prototype, chưa tính là đã làm |
| Phạm vi nội dung dashboard | Dashboard có band ước lượng, ngày thi, bài gần nhất, việc hôm nay; **không có** "điểm mạnh và cần cải thiện" ✅ [S6-S10] | `docs/_product/roadmap.md:77`: "dashboard band ước lượng, điểm mạnh và cần cải thiện, lịch sử và biểu đồ band" ✅ | `/cr` hoặc `/gap`: thêm phần điểm mạnh/cần cải thiện hay bỏ khỏi roadmap (OQ-11) |
| Phân biệt tiến bộ thật với dao động | Mô tả trên màn Lịch sử có câu về khoảng tin cậy, nhưng khoảng đó là dữ liệu đi kèm mỗi lượt, không có phép tính phân biệt tiến bộ thật ✅ [S1:22] | `docs/_product/roadmap.md:38`: "phân biệt tiến bộ thật với dao động giữa các bài" | `/gap` (OQ-10) |
| Mô tả PRD | PRD [F-16, F-17] là theo dõi tiến độ band và biểu đồ theo thời gian ✅ [S24: docs/_product/prd.md:56] | Code có biểu đồ band theo thời gian (khớp nội dung) nhưng thiếu dữ liệu thật | Không đổi; ghi nhận |

## 1. Scope

Feature cho học viên đã đăng nhập và hoàn tất onboarding ✅ [S15: apps/web/src/routes/_proto/app/route.tsx:7-8] xem tiến độ luyện thi gồm hai màn: (a) bảng điều khiển "Trang chủ" với mức sẵn sàng (band ước lượng so với mục tiêu), đếm ngược ngày thi, bài gần nhất và khu vực "Việc hôm nay" ✅ [S6, S7, S8, S9, S10]; (b) màn "Lịch sử bài làm" với bộ lọc theo chế độ thi, biểu đồ band theo thời gian kèm khoảng tin cậy và đường mục tiêu, danh sách các lượt, và mở chi tiết từng lượt ✅ [S1, S4, S5].

Mục tiêu band và ngày thi lấy từ hồ sơ học viên trên máy chủ khi vào ứng dụng; nếu chưa có hồ sơ thì dùng mục tiêu 7.0 và không có ngày thi ✅ [S12: apps/web/src/features/app-state/use-profile-hydration.ts:61-77].

**Điều quan trọng về dữ liệu:** danh sách lượt thi mà hai màn dùng khởi tạo rỗng, không được lưu qua tải lại trang, bị xóa khi đăng xuất, và trong code ứng dụng (không tính test) không có nơi nào gán danh sách này 🔵 [S11: apps/web/src/features/app-state/initial-state.ts:13; apps/web/src/features/app-state/store.tsx:94-106; apps/web/src/features/app-state/use-profile-hydration.ts:36-40; negative-search ở `reverse-gaps.md`]. Hệ quả: ở production hiện tại học viên luôn thấy trạng thái trống ở cả hai màn (OQ-1). Bộ dữ liệu mẫu 6 lượt (tháng 4/2025) chỉ được dùng trong test ✅ [S2: apps/web/src/features/history/data.ts:3-10; S18: apps/web/src/features/app-state/__tests__/state-and-data.test.ts:162-163].

**Boundary (ngoài scope của bộ này):**

- Chấm điểm, chi tiết kết quả, tranh chấp điểm: thuộc feature chấm điểm; ở đây chỉ ghi điểm vào chi tiết một lượt ✅ [S16: apps/web/src/features/results/results-screen.tsx:55-57].
- Đặt mục tiêu/ngày thi ở onboarding và hồ sơ: thuộc feature hồ sơ ✅ [S25: apps/web/src/features/onboarding/components/goal-step.tsx:31-47; apps/web/src/features/profile/profile-screen.tsx:141-152].
- Việc luyện hằng ngày ("Việc hôm nay" thực sự): thuộc `daily-practice` (roadmap mục 21) 🟡 (OQ-5).
- Thi thử, chọn đề, luyện forecast: chỉ là đích điều hướng ✅ [S10: apps/web/src/features/dashboard/components/today-tasks.tsx:27; S6: apps/web/src/features/dashboard/dashboard-screen.tsx:52].
- Xuất dữ liệu lịch sử JSON (PRD): không thấy trong code của feature này 🟡 (xem gaps).

## 2. Actors & Stakeholders

| Actor | Loại | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|------|----------|--------------|-------|------|
| Học viên đã đăng nhập, đã onboarding | người | Xem mức sẵn sàng, ngày thi, bài gần nhất, lịch sử và biểu đồ band (suy từ nội dung màn hình) | Có | S15: apps/web/src/routes/_proto/app/route.tsx:7-8; S6: apps/web/src/features/dashboard/dashboard-screen.tsx:13-69 | 🟡 |
| Mục tiêu nghiệp vụ của học viên (thấy tiến bộ thật) | người | Theo dõi tiến bộ qua thời gian | Có | S1: apps/web/src/features/history/history-screen.tsx:22 (câu mô tả) | 🟡 |
| Hồ sơ học viên (nguồn mục tiêu, ngày thi) | hệ thống | Cấp band mục tiêu và ngày thi (vai trò suy từ mã nạp hồ sơ) | Có (phụ thuộc) | S12: apps/web/src/features/app-state/use-profile-hydration.ts:61-77 | 🟡 |
| Nguồn lượt thi/điểm (hệ thống chấm điểm) | hệ thống | Cấp danh sách lượt thi có band và khoảng tin cậy | Có (chưa nối) | S11: apps/web/src/features/app-state/initial-state.ts:13; S21: packages/api/src/routers/index.ts:11-28 | 🟡 |
| Quản trị viên | người | — | Không (không thấy chức năng admin cho feature này) | S15: apps/web/src/routes/_proto/app/dashboard.tsx:5-7 (không có route admin trong thư mục routes/_proto/app cho dashboard/history) | 🟡 |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-progress-history-001 | Trang chủ khi chưa có lượt thi | Khi học viên chưa có lượt thi nào, Trang chủ chỉ hiện lời chào, câu "Chưa có bài làm nào. Làm bài đầu tiên để có band ước lượng và việc cần luyện mỗi ngày." và nút "Thi thử bài đầu tiên" dẫn tới màn chọn bài thi; các thẻ band ước lượng, đếm ngược, việc hôm nay, bài gần nhất **không hiển thị** | 🟡 | test | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:17-40; S17: apps/web/src/features/__tests__/slice-b.test.tsx:296-301 | ✅ |
| FR-progress-history-002 | Lời chào theo tên | Tiêu đề chào bằng từ cuối của họ tên (tách theo khoảng trắng); không có tên thì "Chào bạn!" (trạng thái trống) hoặc "Chào bạn, sẵn sàng nói chưa?" (có dữ liệu); có tên thì "Chào {tên}!" / "Chào {tên}, sẵn sàng nói chưa?" | 🟡 | kiểm tra | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:15,22,50 | ✅ |
| FR-progress-history-003 | Tiêu đề ngày hiện tại | Khi có dữ liệu, dòng trên tiêu đề hiện thứ, ngày, tháng của hôm nay theo định dạng Việt Nam | 🟡 | kiểm tra | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:49 | ✅ |
| FR-progress-history-004 | Nút thi thử nhanh | Khi có dữ liệu, Trang chủ có nút "Thi thử ngay" dẫn tới màn chọn bài thi | 🟡 | demo | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:51-55 | ✅ |
| FR-progress-history-005 | Band ước lượng hiện tại | Hệ thống tính band ước lượng bằng trung bình band của tối đa 4 lượt thi cuối trong danh sách, làm tròn đến 0.5 gần nhất | 🟡 | test | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:42-44; S17: apps/web/src/features/__tests__/slice-b.test.tsx:311 (6 lượt mẫu cho 6.0, mục tiêu 7.0, thiếu 1.0) | ✅ |
| FR-progress-history-006 | Thẻ mức sẵn sàng | Thẻ hiện band ước lượng (một chữ số thập phân), khoảng tin cậy ghi chú "khoảng tin cậy · 4 bài gần nhất", mục tiêu band, và thanh thang điểm có đánh dấu ước lượng, khoảng và mục tiêu | 🟡 | demo | S7: apps/web/src/features/dashboard/components/readiness-card.tsx:21-31,39,46; S14: apps/web/src/lib/format.ts:3 | ✅ |
| FR-progress-history-007 | Chênh lệch với mục tiêu | Nếu mục tiêu lớn hơn band ước lượng, hiện "còn thiếu {chênh lệch}"; nếu không (bằng hoặc thấp hơn) hiện "đã đạt" | 🟡 | test | S7: apps/web/src/features/dashboard/components/readiness-card.tsx:13,41; S17: apps/web/src/features/__tests__/slice-b.test.tsx:311 | ✅ |
| FR-progress-history-008 | Nhãn khi chưa đủ dữ liệu ở thẻ sẵn sàng | Nếu band ước lượng rỗng hoặc không dương, thẻ hiện "—", "Chưa đủ dữ liệu", "cần tối thiểu 1 bài thi" và "Làm bài thi thử để hệ thống bắt đầu ước lượng band"; nhánh này không đạt được từ Trang chủ vì trạng thái trống đã được xử lý trước | 🟡 | phân tích | S7: apps/web/src/features/dashboard/components/readiness-card.tsx:12,21,27,30,55-57; S6: apps/web/src/features/dashboard/dashboard-screen.tsx:17 | 🔵 |
| FR-progress-history-009 | Đếm ngược ngày thi | Khi có ngày thi, thẻ hiện số ngày còn lại kèm "ngày nữa" và ngày thi dạng dd/mm/yyyy theo định dạng Việt Nam | 🟡 | test | S8: apps/web/src/features/dashboard/components/countdown-card.tsx:10,16-24; S14: apps/web/src/lib/format.ts:8-11; S17: apps/web/src/features/__tests__/slice-b.test.tsx:312-313 | ✅ |
| FR-progress-history-010 | Nhập ngày thi khi chưa có | Khi chưa có ngày thi, thẻ hiện câu mời thêm ngày thi và ô chọn ngày; chọn ngày cập nhật trạng thái ngay trên trang, xóa ô thì đặt lại là chưa có ngày thi | 🟡 | demo | S8: apps/web/src/features/dashboard/components/countdown-card.tsx:38-46 | ✅ |
| FR-progress-history-011 | Ngày thi nhập ở thẻ đếm ngược chỉ lưu cục bộ | Thao tác nhập ngày thi ở thẻ đếm ngược không gửi lên hồ sơ trên máy chủ (khác với màn hồ sơ/onboarding có lưu); lần nạp hồ sơ kế tiếp có thể ghi đè | 🟡 | phân tích | S8: apps/web/src/features/dashboard/components/countdown-card.tsx:43; S25: apps/web/src/features/profile/profile-screen.tsx:144-147; S12: apps/web/src/features/app-state/use-profile-hydration.ts:70-74 | 🔵 |
| FR-progress-history-012 | Nhịp luyện đề xuất (tĩnh) | Khi có ngày thi, thẻ hiện cố định "Nhịp luyện đề xuất: 1 bài / ngày", bảy thanh trống và câu "Duy trì đều đặn để đạt mục tiêu"; các thanh không phản ánh số bài đã làm | 🟡 | kiểm tra | S8: apps/web/src/features/dashboard/components/countdown-card.tsx:26-35 | ✅ |
| FR-progress-history-013 | Việc hôm nay (luôn trống) | Khu "Việc hôm nay" luôn hiện trạng thái trống "Chưa có việc cần làm hôm nay" với mô tả và nút khác nhau theo có/không có lượt thi: có lượt thi thì nút "Luyện đề forecast" dẫn tới forecast, chưa có thì "Làm bài thi thử" dẫn tới chọn bài thi; không có danh sách nhiệm vụ nào | 🟡 | test | S10: apps/web/src/features/dashboard/components/today-tasks.tsx:14-30; S17: apps/web/src/features/__tests__/slice-b.test.tsx:315 | ✅ |
| FR-progress-history-014 | Bài gần nhất | Thẻ hiện lượt cuối danh sách: chế độ, ngày dd/mm, band, khoảng band, chủ đề; bấm vào mở chi tiết lượt đó; nút "Tất cả" mở màn Lịch sử | 🟡 | test | S9: apps/web/src/features/dashboard/components/recent-attempt-card.tsx:34-57; S17: apps/web/src/features/__tests__/slice-b.test.tsx:318-319 | ✅ |
| FR-progress-history-015 | Cột band 8 lượt gần nhất | Dưới thẻ bài gần nhất vẽ tối đa 8 cột, mỗi cột ứng một lượt với nhãn band một chữ số thập phân; chiều cao cột tỷ lệ với (band trừ 4) | 🟡 | kiểm tra | S9: apps/web/src/features/dashboard/components/recent-attempt-card.tsx:58-65 | ✅ |
| FR-progress-history-016 | Thẻ bài gần nhất khi rỗng | Thẻ có nhánh trống "Chưa có bài thi nào" + nút "Thi thử ngay"; không đạt được từ Trang chủ vì trạng thái trống được xử lý trước | 🟡 | phân tích | S9: apps/web/src/features/dashboard/components/recent-attempt-card.tsx:13-31; S6: apps/web/src/features/dashboard/dashboard-screen.tsx:17 | 🔵 |
| FR-progress-history-017 | Bộ lọc chế độ thi ở Lịch sử | Màn có nút lọc "Tất cả" và bốn chế độ thi (Full Test, Part 1, Part 2, Part 3); chọn chế độ thì cả biểu đồ lẫn danh sách chỉ gồm các lượt cùng chế độ; mặc định "Tất cả" | 🟡 | test | S1: apps/web/src/features/history/history-screen.tsx:17-18,25-30; S17: apps/web/src/features/__tests__/slice-b.test.tsx:238-246 | ✅ |
| FR-progress-history-018 | Biểu đồ band theo thời gian | Biểu đồ vẽ đường band qua từng lượt (theo thứ tự trong danh sách), vùng mờ là khoảng tin cậy của từng lượt, đường nét đứt là mục tiêu, nhãn trục ngang là ngày dd/mm; chú giải gồm "Band", "Khoảng tin cậy", "Mục tiêu" | 🟡 | demo | S4: apps/web/src/features/history/components/trend-chart.tsx:16-41; S1: apps/web/src/features/history/history-screen.tsx:34-46 | ✅ |
| FR-progress-history-019 | Danh sách lượt thi | Danh sách liệt kê từng lượt theo thứ tự đảo ngược của dữ liệu (lượt cuối đứng đầu), mỗi dòng có band, chế độ, chủ đề, khoảng band (ẩn ở màn hẹp), ngày; lượt đầu danh sách (sau lọc) mang nhãn "Mới nhất" | 🟡 | test | S5: apps/web/src/features/history/components/attempt-list.tsx:14-27 (không có test phủ thứ tự hay nhãn Mới nhất) | ✅ |
| FR-progress-history-020 | Mở chi tiết một lượt | Bấm một dòng ở danh sách (hoặc thẻ bài gần nhất) điều hướng tới trang chi tiết của lượt theo mã lượt | 🟡 | test | S5: apps/web/src/features/history/components/attempt-list.tsx:15; S13: apps/web/src/features/app-state/routes.ts:28-33; S17: apps/web/src/features/__tests__/slice-b.test.tsx:244-245 | ✅ |
| FR-progress-history-021 | Trạng thái trống: bộ lọc không có lượt | Khi bộ lọc không còn lượt nào, vùng biểu đồ hiện "Chưa có bài nào cho bộ lọc này." kèm gợi ý đổi bộ lọc hoặc làm thêm bài; danh sách không hiện | 🟡 | test | S1: apps/web/src/features/history/history-screen.tsx:47-57; S17: apps/web/src/features/__tests__/slice-b.test.tsx:248-257 | ✅ |
| FR-progress-history-022 | Trạng thái trống: chưa có lịch sử | Khi chưa có lượt thi nào, ngoài trạng thái ở vùng biểu đồ còn hiện thẻ "Chưa có lịch sử làm bài" kèm nút "Thi thử ngay" dẫn tới màn chọn bài thi | 🟡 | kiểm tra | S1: apps/web/src/features/history/history-screen.tsx:60-75 | ✅ |
| FR-progress-history-023 | Chi tiết lượt: nguồn dữ liệu | Trang chi tiết tải kết quả thật từ máy chủ khi mã lượt khác "latest" và không khớp lượt chưa lưu hay lượt trong danh sách trên máy khách; Mã "latest" không tải máy chủ (hiển thị kết quả mặc định của prototype). Theo negative-search ở OQ-1, danh sách web rỗng nên trên thực tế mọi mã khác "latest" đều tải máy chủ 🔵 | 🟡 | test | S2: apps/web/src/features/history/data.ts:17-33; S16: apps/web/src/features/results/results-screen.tsx:55-57; S18: apps/web/src/features/app-state/__tests__/state-and-data.test.ts:165-190 | ✅ |
| FR-progress-history-024 | Nạp mục tiêu & ngày thi từ hồ sơ | Khi vào ứng dụng với phiên đăng nhập, hệ thống đọc hồ sơ để đặt band mục tiêu và ngày thi cho Dashboard/Lịch sử; chưa có hồ sơ thì mục tiêu 7.0 và không có ngày thi; lỗi mạng thì giữ nguyên và thử lại lần sau (test chỉ phủ nhánh có hồ sơ; nhánh chưa có hồ sơ và lỗi mạng chỉ xác nhận từ code) | 🟡 | test | S12: apps/web/src/features/app-state/use-profile-hydration.ts:57-77; S19: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:85-109 | ✅ |
| FR-progress-history-025 | Xóa dữ liệu khi đăng xuất | Khi phiên chuyển sang chưa đăng nhập, hệ thống đặt lại toàn bộ dữ liệu người dùng (gồm danh sách lượt thi) về rỗng, giữ lại chế độ thi và giọng đọc | 🟡 | test | S12: apps/web/src/features/app-state/use-profile-hydration.ts:33-41; S19: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:179-182 | ✅ |
| FR-progress-history-026 | Chặn khi chưa onboarding | Vào màn trong khu ứng dụng khi chưa hoàn tất onboarding thì bị chuyển tới onboarding; lỗi đọc hồ sơ thì cho vào (fail open) | 🟡 | test | S15: apps/web/src/routes/_proto/app/route.tsx:7-8; apps/web/src/lib/auth-guard.ts:49-56,66; apps/web/src/lib/__tests__/auth-guard.test.ts:116-163,217 | ✅ |
| FR-progress-history-027 | Lịch sử/điểm không tải từ máy chủ | Hệ thống hiện chưa có chức năng nạp danh sách lượt thi và band theo thời gian từ máy chủ vào hai màn này; lượt thi và điểm tổng đã được lưu ở máy chủ nhưng không có đường đọc theo danh sách | 🟡 | phân tích | S21: packages/api/src/routers/index.ts:11-28; S23: packages/db/src/schema/attempt.ts:5-24; packages/db/src/schema/score.ts:24 | 🔵 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-progress-history-001 | localization | Ngày hiển thị theo locale Việt Nam: thẻ đếm ngược dd/mm/yyyy có đệm số 0; biểu đồ và thẻ bài gần nhất dd/mm; danh sách lượt dùng định dạng mặc định vi-VN không đệm số 0 (ví dụ 2/4/2025); tiêu đề Trang chủ dạng thứ-ngày-tháng | 🟡 | kiểm tra giao diện | S5: apps/web/src/features/history/components/attempt-list.tsx:27; S8: apps/web/src/features/dashboard/components/countdown-card.tsx:23; S6: apps/web/src/features/dashboard/dashboard-screen.tsx:49 | ✅ |
| NFR-progress-history-002 | usability | Bố cục Trang chủ chia cột trên màn lớn (lưới 3 cột), một cột trên màn hẹp; khoảng band trong danh sách ẩn ở màn hẹp | 🟡 | kiểm tra giao diện | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:58,63; S5: apps/web/src/features/history/components/attempt-list.tsx:24 | ✅ |
| NFR-progress-history-003 | accuracy | Trục dọc biểu đồ cố định từ 4.5 đến 8.0, đường lưới tại 5.0, 6.0, 7.0, 8.0 | 🟡 | kiểm tra giao diện | S4: apps/web/src/features/history/components/trend-chart.tsx:14-15,23 | ✅ |
| NFR-progress-history-004 | persistence | Danh sách lượt thi không được lưu qua tải lại trang (chỉ chế độ, giọng, phiên luyện, tác vụ chấm đang chờ được lưu trong phiên trình duyệt) | 🟡 | test | S11: apps/web/src/features/app-state/store.tsx:94-106; S18: apps/web/src/features/app-state/__tests__/state-and-data.test.ts:257-258 | ✅ |
| NFR-progress-history-005 | performance | Không có phân trang, giới hạn số lượt hay yêu cầu hiệu năng cho danh sách và biểu đồ | 🟡 | — | S1, S4, S5 (không có logic giới hạn) | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-progress-history-001 | Band ước lượng = trung bình band của tối đa 4 lượt cuối trong danh sách (thứ tự mảng), làm tròn 0.5 gần nhất (ví dụ trung bình 6.25 thành 6.5) | Hiển thị Trang chủ có dữ liệu | FR-progress-history-005 | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:42-44 | ✅ |
| BR-progress-history-002 | Khoảng hiển thị trên Trang chủ là từ (ước lượng trừ 0.5) đến ước lượng, không đối xứng quanh ước lượng. Mã có nhánh "ước lượng cộng 0.5 vượt 9 thì cận trên là 9, ngược lại là ước lượng"; do ước lượng làm tròn 0.5 nên nhánh này chỉ xảy ra khi ước lượng bằng 9.0 và vẫn cho cận trên bằng ước lượng. Cấu trúc nhánh gợi ý ý định ban đầu là cận trên bằng ước lượng cộng 0.5 (🟡, OQ-2) | Hiển thị thẻ sẵn sàng | FR-progress-history-006 | S7: apps/web/src/features/dashboard/components/readiness-card.tsx:26,46 | ✅ |
| BR-progress-history-003 | Chênh lệch = mục tiêu trừ ước lượng; dương thì "còn thiếu", không dương thì "đã đạt" | Hiển thị thẻ sẵn sàng | FR-progress-history-007 | S7: apps/web/src/features/dashboard/components/readiness-card.tsx:13,41 | ✅ |
| BR-progress-history-004 | Số ngày còn lại = làm tròn lên của (ngày thi trừ hiện tại) theo ngày; ngày thi đã qua hiển thị 0, không âm; không có ngày thi thì không đếm | Hiển thị thẻ đếm ngược | FR-progress-history-009 | S14: apps/web/src/lib/format.ts:8-11; S20: apps/web/src/lib/__tests__/format.test.ts:33-41 | ✅ |
| BR-progress-history-005 | Chế độ lọc "Tất cả" giữ mọi lượt; chế độ khác giữ lượt cùng chế độ | Bấm nút lọc | FR-progress-history-017 | S1: apps/web/src/features/history/history-screen.tsx:18 | ✅ |
| BR-progress-history-006 | Thứ tự lượt thi dựa hoàn toàn vào thứ tự phần tử trong danh sách (cũ trước, mới sau); không có bước sắp xếp theo ngày ở Trang chủ, biểu đồ, danh sách | Mọi hiển thị | FR-progress-history-005, 014, 018, 019 | S5: apps/web/src/features/history/components/attempt-list.tsx:14; S9: apps/web/src/features/dashboard/components/recent-attempt-card.tsx:34; S4: apps/web/src/features/history/components/trend-chart.tsx:16-18 (không có sort; kết luận theo vắng mặt) | 🔵 |
| BR-progress-history-007 | Nhãn "Mới nhất" gắn cho phần tử đầu của danh sách đã lọc (sau đảo ngược), không phải lượt mới nhất toàn cục | Hiển thị danh sách | FR-progress-history-019 | S5: apps/web/src/features/history/components/attempt-list.tsx:14,20 | ✅ |
| BR-progress-history-008 | Trục ngang biểu đồ chia đều theo chỉ số lượt, không theo khoảng cách thời gian thực; một lượt duy nhất đặt giữa biểu đồ | Vẽ biểu đồ | FR-progress-history-018 | S4: apps/web/src/features/history/components/trend-chart.tsx:16 | ✅ |
| BR-progress-history-009 | Giá trị band ngoài 4.5-8.0 có tọa độ nằm ngoài vùng vẽ 4.5-8.0 (không có kẹp giá trị, phần ngoài khung nhìn có thể bị cắt); đường mục tiêu cũng vậy | Vẽ biểu đồ | FR-progress-history-018 | S4: apps/web/src/features/history/components/trend-chart.tsx:17,31 (không có clamp; kết luận theo vắng mặt) | 🔵 |
| BR-progress-history-010 | Chiều cao cột band = (band trừ 4) nhân 14 điểm ảnh; tối đa 8 lượt cuối | Hiển thị thẻ bài gần nhất | FR-progress-history-015 | S9: apps/web/src/features/dashboard/components/recent-attempt-card.tsx:59,61 | ✅ |
| BR-progress-history-011 | Trạng thái trống Trang chủ được xét theo danh sách lượt thi rỗng, nên thẻ đếm ngược chỉ hiển thị khi có ít nhất 1 lượt thi, dù đã có ngày thi | Vào Trang chủ | FR-progress-history-001, 009 | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:17,60 | ✅ |
| BR-progress-history-012 | Mục tiêu mặc định 7.0 và ngày thi rỗng khi chưa có hồ sơ | Nạp hồ sơ | FR-progress-history-024 | S12: apps/web/src/features/app-state/use-profile-hydration.ts:76; S11: apps/web/src/features/app-state/initial-state.ts:8 | ✅ |
| BR-progress-history-013 | Band mục tiêu hợp lệ trong hồ sơ chỉ gồm 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0 (thông tin tham chiếu từ feature hồ sơ) | Lưu hồ sơ | FR-progress-history-024 | S22: packages/api/src/routers/profile.ts:8,11-15 | ✅ |
| BR-progress-history-014 | Ngày thi trong hồ sơ phải đúng định dạng YYYY-MM-DD, là ngày lịch hợp lệ và không nằm trong quá khứ (so theo ngày UTC) (tham chiếu từ feature hồ sơ) | Lưu hồ sơ | FR-progress-history-024 | S22: packages/api/src/routers/profile.ts:16-38 | ✅ |
| BR-progress-history-015 | Khi chọn chi tiết: mã "latest" được xét trước và coi là mặc định; sau đó lượt chưa lưu (tạm) khớp mã; rồi tìm trong danh sách; không thấy thì coi là mặc định | Mở chi tiết | FR-progress-history-023 | S2: apps/web/src/features/history/data.ts:22-33; S18: apps/web/src/features/app-state/__tests__/state-and-data.test.ts:165-190 | ✅ |
| BR-progress-history-016 | Ngày lượt thi dạng chuỗi ngày không giờ được phân tích khi hiển thị; hành vi theo múi giờ chưa được quy định | Hiển thị ngày | FR-progress-history-019 | S5: apps/web/src/features/history/components/attempt-list.tsx:27; S4: apps/web/src/features/history/components/trend-chart.tsx:38 | 🟡 |

## 6. Error Matrix

> Feature không có lỗi nghiệp vụ dạng validate/throw; phần dưới là các trạng thái trống/lỗi hiển thị cho học viên. Wording trích nguyên văn.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-progress-history-001 | Chưa có lượt thi (Trang chủ) | Danh sách lượt thi rỗng | minor | FR-progress-history-001 | Trang chủ trống: "Chưa có bài làm nào. Làm bài đầu tiên để có band ước lượng và việc cần luyện mỗi ngày." / "Bắt đầu bài thi thử đầu tiên" | Bấm "Thi thử bài đầu tiên" | S6: apps/web/src/features/dashboard/dashboard-screen.tsx:23,28 | ✅ |
| E-progress-history-002 | Bộ lọc không có lượt | Chọn chế độ không có lượt | minor | FR-progress-history-021 | "Chưa có bài nào cho bộ lọc này." / "Hãy thử chọn bộ lọc chế độ thi khác hoặc làm thêm bài thi để xem biểu đồ tiến độ." | Đổi bộ lọc | S1: apps/web/src/features/history/history-screen.tsx:53-54; S17: apps/web/src/features/__tests__/slice-b.test.tsx:255 | ✅ |
| E-progress-history-003 | Chưa có lịch sử | Danh sách rỗng | minor | FR-progress-history-022 | "Chưa có lịch sử làm bài" / "Mọi bài thi thử và kết quả đánh giá sẽ được ghi nhận tại đây để bạn tiện theo dõi sự tiến bộ." | Bấm "Thi thử ngay" | S1: apps/web/src/features/history/history-screen.tsx:67-68 | ✅ |
| E-progress-history-004 | Chưa có việc hôm nay | Luôn (khu việc hôm nay không có dữ liệu) | minor | FR-progress-history-013 | "Chưa có việc cần làm hôm nay" | Bấm "Luyện đề forecast" hoặc "Làm bài thi thử" | S10: apps/web/src/features/dashboard/components/today-tasks.tsx:19 | ✅ |
| E-progress-history-005 | Đang tải chi tiết lượt | Tải kết quả máy chủ | minor | FR-progress-history-023 | "Đang tải kết quả…" | Chờ | S16: apps/web/src/features/results/results-screen.tsx:116 | ✅ |
| E-progress-history-006 | Không tìm thấy lượt | Mã lượt không tồn tại (NOT_FOUND) | major | FR-progress-history-023 | "Không tìm thấy bài thi" / "Bài thi không tồn tại hoặc đã bị xoá. Hãy kiểm tra lại đường dẫn." | "Về trang chủ" | S16: apps/web/src/features/results/results-screen.tsx:130-134; apps/web/src/features/results/use-scored-result.ts:21-26 | ✅ |
| E-progress-history-007 | Lượt thuộc tài khoản khác | Mã lượt của người khác (FORBIDDEN) | major | FR-progress-history-023 | "Bạn không có quyền xem bài thi này" / "Bài thi này thuộc về một tài khoản khác. Hãy kiểm tra lại đường dẫn hoặc tài khoản đang đăng nhập." | "Về trang chủ" | S16: apps/web/src/features/results/results-screen.tsx:130-134 | ✅ |
| E-progress-history-008 | Không tải được chi tiết | Lỗi mạng hoặc kết quả không đọc được | major | FR-progress-history-023 | "Không tải được kết quả" / "Kết nối gặp sự cố. Bài thi của bạn vẫn được lưu, hãy thử tải lại." (hoặc "Bài thi đã chấm xong nhưng chưa đọc được kết quả. Bài thi của bạn vẫn được lưu, hãy thử tải lại." khi kết quả không đọc được) | "Tải lại" hoặc "Về trang chủ" | S16: apps/web/src/features/results/results-screen.tsx:148-152 | ✅ |
| E-progress-history-009 | Lỗi nạp hồ sơ | Lỗi mạng/máy chủ khi đọc hồ sơ | minor | FR-progress-history-024 | Không hiện thông báo; giữ mục tiêu/ngày thi hiện có, thử lại lần sau | Tự thử lại khi phiên/effect chạy lại | S12: apps/web/src/features/app-state/use-profile-hydration.ts:60-65 | ✅ |
| E-progress-history-010 | Chấm điểm chưa sẵn sàng (cờ tắt) | Không có kết quả chấm và cờ tính năng chấm điểm tắt (cờ đọc từ biến môi trường VITE_FEATURE_SCORING, mặc định tắt khi không đặt; giá trị thật ở môi trường chạy chưa kiểm chứng) | minor | FR-progress-history-023 | "Bài thi đã được lưu" / "Hệ thống đã ghi nhận toàn bộ phần nói của bài thi." (và thẻ "Tính năng chấm điểm AI sắp ra mắt") | "Về trang chủ", "Luyện đề khác" | S16: apps/web/src/features/results/results-screen.tsx:223,228,235,242; apps/web/src/lib/feature-flags.ts:2 | 🟡 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-progress-history-01 | Học viên thấy tiến bộ thật qua thời gian | Chưa xác định | `<!-- TBD -->` | S24: docs/_product/roadmap.md:38 (mục đích), code không đo | 🟡 |
| SC-progress-history-02 | Học viên biết còn cách mục tiêu bao nhiêu band | Hiển thị chênh lệch trên thẻ sẵn sàng | Có hiển thị "còn thiếu"/"đã đạt" khi có lượt thi | S7: apps/web/src/features/dashboard/components/readiness-card.tsx:41 | 🟡 |
| SC-progress-history-03 | Học viên biết còn bao nhiêu ngày đến ngày thi | Hiển thị số ngày | Có khi đã có ngày thi và ít nhất 1 lượt thi | S8: apps/web/src/features/dashboard/components/countdown-card.tsx:19; S6: apps/web/src/features/dashboard/dashboard-screen.tsx:17 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/progress-history-reverse-erd.md`)

- **Lượt thi (góc nhìn web):** mã, ngày, chế độ (Full/Part 1/Part 2/Part 3), band, khoảng band (thấp-cao), chủ đề ✅ [S3: apps/web/src/features/history/types.ts:3-10]. Đây là mô hình giả lập, không khớp trực tiếp với bảng ở máy chủ (không có ngày dạng chuỗi hay khoảng band) 🔵 [S23].
- **Hồ sơ học viên:** band mục tiêu, ngày thi, thời điểm onboarding ✅ [S23: packages/db/src/schema/profile.ts:6-12].
- **Lượt thi (máy chủ) và điểm tổng:** trạng thái, chế độ, thời điểm bắt đầu/nộp; điểm tổng làm tròn 0.5 ✅ [S23: packages/db/src/schema/attempt.ts:12-21; packages/db/src/schema/score.ts:20-24]; chưa nối vào feature 🔵.

## 9. Flows (tóm tắt — chi tiết ở `srs/progress-history-reverse-flows.md`)

1. Xem Trang chủ (nạp hồ sơ, trạng thái trống hoặc có dữ liệu) ✅.
2. Xem Lịch sử và lọc theo chế độ ✅.
3. Mở chi tiết một lượt ✅.
4. Nhập ngày thi từ thẻ đếm ngược (chỉ cục bộ) ✅.

## 10. Screens (tóm tắt)

| Màn | Mã / route | Nội dung | Nguồn | Nhãn |
|-----|-----------|----------|-------|------|
| Trang chủ (Dashboard) | S06, `/app/dashboard` | Trạng thái trống hoặc: lời chào, "Thi thử ngay", thẻ sẵn sàng, đếm ngược, việc hôm nay, bài gần nhất | S26: apps/web/src/layouts/screen-map.tsx:19; S15: apps/web/src/routes/_proto/app/dashboard.tsx:5 | ✅ |
| Lịch sử bài làm | S19, `/app/history` | Tiêu đề, nút lọc, biểu đồ, danh sách | S26: apps/web/src/layouts/screen-map.tsx:26; S1: apps/web/src/features/history/history-screen.tsx:22 | ✅ |
| Chi tiết lượt thi | `/app/history/$attemptId` | Dùng màn kết quả (thuộc feature chấm điểm) | S15: apps/web/src/routes/_proto/app/history.$attemptId.tsx:5-13 | ✅ |
| Mã màn "S19" hiện ra như dòng nhỏ trên tiêu đề ở UI người dùng | — | Có thể là dấu vết prototype (chưa rõ ý định) | S1: apps/web/src/features/history/history-screen.tsx:22; S26: apps/web/src/layouts/page-head.tsx:14-18 | 🟡 |

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Cơ chế áp đặt | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Roadmap xếp feature ở nhóm "Next", trạng thái 🔒, phụ thuộc mục 11 (đã xong) và 13 (chưa xong) | Bảng thứ tự công việc trong tài liệu roadmap | S24: docs/roadmap-work-items.md:26,28,33 | ✅ |
| Dữ liệu người dùng (mục tiêu, ngày thi) lấy từ hồ sơ; danh sách lượt thi phía máy khách không bền | Mã nạp state và lưu sessionStorage phía web | S12: apps/web/src/features/app-state/use-profile-hydration.ts:57-77; S11: apps/web/src/features/app-state/store.tsx:94-106 | ✅ |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Chấm điểm & kết quả (`scoring-results`, mục 13): cấp band, khoảng band theo lượt | Feature chấm điểm (suy từ tên mục 13) | Mọi hiển thị band thật | S24: docs/roadmap-work-items.md:28,33; S23: packages/db/src/schema/score.ts:11-39 | 🟡 |
| Quyền riêng tư/lưu bài (mục 11 `privacy-controls`, đã xong theo bảng công việc) | Chưa rõ | Dữ liệu lịch sử được lưu | S24: docs/roadmap-work-items.md:26,33; docs/_product/roadmap.md:77 ("Phụ thuộc: `scoring-results`, `privacy-controls`") | 🟡 |
| Thủ tục máy chủ liệt kê lượt thi/điểm | Chưa có | Nạp dữ liệu thật | S21: packages/api/src/routers/index.ts:11-28 | 🟡 |
| Luyện mỗi ngày (`daily-practice`, mục 21) | Feature luyện hằng ngày | "Việc hôm nay" có nội dung | S24: docs/roadmap-work-items.md:33,36 (mục 18 ghi chạy song song với 21; mục 21 tên `daily-practice`) | 🟡 |

**Assumptions:**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Danh sách lượt thi phía web sẽ được gán từ máy chủ ở bước phát triển sau | Nếu sai (vẫn rỗng), mọi UI trong Mục 3 từ FR-005 đến FR-022 vô hiệu | S11: apps/web/src/features/app-state/initial-state.ts:13; S21: packages/api/src/routers/index.ts:11-28 | 🟡 |
| Danh sách theo thứ tự thời gian tăng dần | BR-001, 006, 007 | S5: apps/web/src/features/history/components/attempt-list.tsx:14; S9: apps/web/src/features/dashboard/components/recent-attempt-card.tsx:34 | 🔵 |
| Khoảng band mỗi lượt do hệ thống chấm cấp | Hiển thị vùng mờ và khoảng band | S3: apps/web/src/features/history/types.ts:8 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây là các OQ blocking.

- [ ] OQ-1: Danh sách lượt thi lấy từ đâu ở production (cần thủ tục liệt kê lượt thi + điểm), hay UI này chỉ là prototype?
- [ ] OQ-2: Công thức band ước lượng (trung bình 4 lượt cuối, làm tròn 0.5) và khoảng tin cậy (ước lượng trừ 0.5 đến ước lượng, nhánh `+0.5 > 9` gợi ý ý định cận trên là ước lượng cộng 0.5) có phải quy tắc chốt hay là lỗi?
- [ ] OQ-3: Khoảng tin cậy mỗi lượt (trường `range`) do ai/phép tính nào cấp?
- [ ] OQ-5: "Việc hôm nay" lấy nhiệm vụ từ đâu (phụ thuộc `daily-practice`)?
- [ ] OQ-6: Ngày thi nhập ở thẻ đếm ngược chỉ lưu cục bộ có chủ ý không?
- [ ] OQ-7: Thẻ đếm ngược chỉ hiện khi có lượt thi có chủ ý không?
- [ ] OQ-17: Cờ `VITE_FEATURE_SCORING` bật hay tắt ở môi trường chạy thật (quyết định E-010 và nội dung chi tiết lượt)?
