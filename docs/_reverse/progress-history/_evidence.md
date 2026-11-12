# progress-history — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

Feature này **không gọi** thủ tục máy chủ nào để lấy danh sách lượt thi. Điểm vào là route web và một lần đọc hồ sơ.

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| (route web) | /app/dashboard | Trang chủ | Phiên + đã onboarding | Hiển thị Dashboard | apps/web/src/routes/_proto/app/dashboard.tsx:5-7; apps/web/src/routes/_proto/app/route.tsx:7-8 |
| (route web) | /app/history | Lịch sử bài làm | Phiên + đã onboarding | Hiển thị Lịch sử | apps/web/src/routes/_proto/app/history.index.tsx:5-7 |
| (route web) | /app/history/$attemptId | Chi tiết lượt thi (màn kết quả) | Phiên + đã onboarding | Xem một lượt | apps/web/src/routes/_proto/app/history.$attemptId.tsx:5-13 |
| tRPC query | profile.get | Hydrate state khi vào khu `_proto` | protectedProcedure | Đọc band mục tiêu và ngày thi | apps/web/src/features/app-state/use-profile-hydration.ts:61; packages/api/src/routers/profile.ts:42-51 |
| tRPC query | profile.get | Guard `requireOnboarded` | protectedProcedure | Kiểm tra onboardedAt | apps/web/src/lib/auth-guard.ts:50-56 |
| tRPC query | scoring.status, scoring.getResult | Chi tiết lượt (khi mã lượt không có trong state) | protectedProcedure | Đọc trạng thái và kết quả chấm của lượt | apps/web/src/features/results/use-scored-result.ts:42-45; packages/api/src/routers/scoring.ts:58,179 |
| (không có) | — | Danh sách lượt thi / band theo thời gian | — | **Không tồn tại** (xem §7) | packages/api/src/routers/index.ts:11-28 |

## §2. Validation (ràng buộc field)

Các ràng buộc dưới đây thuộc feature hồ sơ nhưng quyết định giá trị mà Dashboard/Lịch sử đọc.

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| targetBand | Thuộc danh sách | 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0 | "Target band must be between 5.0 and 9.0 in 0.5 increments" | packages/api/src/routers/profile.ts:9,12-15 | ✅ |
| examDate | Regex ngày | `^\d{4}-\d{2}-\d{2}$` | "Invalid date format (YYYY-MM-DD)" | packages/api/src/routers/profile.ts:16-19 | ✅ |
| examDate | Ngày lịch hợp lệ, không quá khứ (so ngày UTC) | d >= hôm nay (UTC) | "Exam date must be a valid calendar date and cannot be in the past" | packages/api/src/routers/profile.ts:20-37 | ✅ |
| examDate (ô nhập thẻ đếm ngược) | Không có ràng buộc ở thẻ; chuỗi rỗng thành null | `e.target.value || null` | — | apps/web/src/features/dashboard/components/countdown-card.tsx:43 | ✅ |
| Lượt thi (web) | Không có validator (kiểu TypeScript thuần) | band: number, range: [number, number] | — | apps/web/src/features/history/types.ts:3-10 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-progress-history-001 | Danh sách rỗng (Trang chủ) | "Chưa có bài làm nào. Làm bài đầu tiên để có band ước lượng và việc cần luyện mỗi ngày." | "Thi thử bài đầu tiên" | apps/web/src/features/dashboard/dashboard-screen.tsx:23,28 | ✅ |
| E-progress-history-002 | Bộ lọc rỗng | "Chưa có bài nào cho bộ lọc này." | Đổi bộ lọc | apps/web/src/features/history/history-screen.tsx:53 | ✅ |
| E-progress-history-003 | Lịch sử rỗng | "Chưa có lịch sử làm bài" | "Thi thử ngay" | apps/web/src/features/history/history-screen.tsx:67 | ✅ |
| E-progress-history-004 | Luôn | "Chưa có việc cần làm hôm nay" | Nút điều hướng | apps/web/src/features/dashboard/components/today-tasks.tsx:19 | ✅ |
| E-progress-history-006/007 | Chi tiết lượt NOT_FOUND / FORBIDDEN | "Không tìm thấy bài thi" / "Bạn không có quyền xem bài thi này" | "Về trang chủ" | apps/web/src/features/results/results-screen.tsx:130; apps/web/src/features/results/use-scored-result.ts:23-24 | ✅ |
| E-progress-history-008 | Lỗi mạng hoặc kết quả không đọc được | "Không tải được kết quả" | "Tải lại" | apps/web/src/features/results/results-screen.tsx:148-152 | ✅ |
| E-progress-history-009 | Lỗi đọc hồ sơ | (không có thông báo) | Thử lại ở lần effect sau | apps/web/src/features/app-state/use-profile-hydration.ts:62-65 | ✅ |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Band ước lượng = TB 4 lượt cuối, làm tròn 0.5 | Có lượt thi | 4 lượt; 0.5 | Gián tiếp (kết quả 6.0, thiếu 1.0): apps/web/src/features/__tests__/slice-b.test.tsx:311 | apps/web/src/features/dashboard/dashboard-screen.tsx:42-44 | ✅ |
| Khoảng hiển thị = [ước lượng - 0.5, ước lượng], hoặc cận trên 9 nếu ước lượng + 0.5 > 9 | Thẻ sẵn sàng | 0.5; 9 | Không | apps/web/src/features/dashboard/components/readiness-card.tsx:26,46 | ✅ |
| Còn thiếu / đã đạt | Thẻ sẵn sàng | mục tiêu - ước lượng > 0 | Có (còn thiếu 1.0): apps/web/src/features/__tests__/slice-b.test.tsx:311 | apps/web/src/features/dashboard/components/readiness-card.tsx:13,41 | ✅ |
| Số ngày = max(0, ceil((ngày thi - bây giờ)/86400000)) | Thẻ đếm ngược | 86400000 ms | Có: apps/web/src/lib/__tests__/format.test.ts:32-41 | apps/web/src/lib/format.ts:8-11 | ✅ |
| Nhịp luyện "1 bài / ngày" + 7 thanh trống | Có ngày thi | hằng số 1; 7 | Không | apps/web/src/features/dashboard/components/countdown-card.tsx:28,31 | ✅ |
| Cột band: tối đa 8 lượt; cao = (band - 4) * 14 px | Thẻ bài gần nhất | 8; 4; 14 | Không | apps/web/src/features/dashboard/components/recent-attempt-card.tsx:59,61 | ✅ |
| Biểu đồ: W 720, H 220, min 4.5, max 8; lưới 5-8 | Vẽ biểu đồ | 4.5; 8 | Không | apps/web/src/features/history/components/trend-chart.tsx:11-15,23 | ✅ |
| Trục ngang chia đều theo chỉ số lượt; 1 lượt đặt giữa | Vẽ biểu đồ | — | Không | apps/web/src/features/history/components/trend-chart.tsx:16 | ✅ |
| Danh sách: đảo ngược mảng; "Mới nhất" k=0 | Danh sách lọc | — | Không | apps/web/src/features/history/components/attempt-list.tsx:14,20 | ✅ |
| Chọn lượt chi tiết: tạm trước, rồi danh sách, "latest"/không thấy thì mặc định | Mở chi tiết | — | Có: apps/web/src/features/app-state/__tests__/state-and-data.test.ts:165-190 | apps/web/src/features/history/data.ts:17-33 | ✅ |
| Mục tiêu mặc định 7.0, ngày thi null | Không có hồ sơ | 7.0 | Có (đường có hồ sơ): apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:85-109 | apps/web/src/features/app-state/use-profile-hydration.ts:76; apps/web/src/features/app-state/initial-state.ts:8 | ✅ |
| Đăng xuất reset dữ liệu người dùng, giữ mode/voice | Phiên mất | — | Có: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:179-182 | apps/web/src/features/app-state/use-profile-hydration.ts:33-41 | ✅ |
| Danh sách lượt thi không lưu sessionStorage | Tải lại | Chỉ lưu mode, voice, practice, scoringAttempt | Có: apps/web/src/features/app-state/__tests__/state-and-data.test.ts:257-258 | apps/web/src/features/app-state/store.tsx:96-101 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| Attempt (view web) | id, date, mode, band, range[2], topic | Nằm trong AppState.attempts | apps/web/src/features/history/types.ts:3-10 |
| AppState | name, target, examDate, attempts, scoringAttempt | Chứa Attempt[] | apps/web/src/features/app-state/types.ts:65-85 |
| user_profile | user_id, target_band, exam_date, onboarded_at | 1-1 với user | packages/db/src/schema/profile.ts:6-18 |
| attempt (máy chủ) | id, user_id, mode, status (in_progress/submitted/abandoned), in_history, started_at, submitted_at, topic_id | N-1 user; 1-N attempt_answer | packages/db/src/schema/attempt.ts:5-24 |
| attempt_score | attempt_id, status (queued/processing/done/failed), overall (làm tròn 0.5), scored_at | 1-1 attempt | packages/db/src/schema/score.ts:11-39 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Hydrate state khi vào khu ứng dụng (web) | Router hồ sơ (api) → bảng hồ sơ (D1) | Gọi truy vấn đọc | Nạp mục tiêu/ngày thi | apps/web/src/features/app-state/use-profile-hydration.ts:61 · packages/api/src/routers/profile.ts:42-51 |
| Mở chi tiết lượt (web) | Router chấm điểm (api) → bảng điểm + câu trả lời (D1) | Gọi truy vấn trạng thái + kết quả | Xem kết quả một lượt (thuộc feature chấm điểm) | apps/web/src/features/results/use-scored-result.ts:42-45 · packages/api/src/routers/scoring.ts:58,179 |
| Danh sách lượt thi / band theo thời gian | — | **Không có hop** (không có thủ tục nào) | — | packages/api/src/routers/index.ts:11-28 |

Hop không tính danh sách lịch sử: 2 hop (hồ sơ, chi tiết lượt). Cả hai trong cùng monorepo, không vượt repo khác.

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Không có đường nạp danh sách lượt thi cho state — *(negative-search: `grep -rnE "\battempts\b" apps/web/src packages ... --exclude-dir=__tests__` · loại: dead-code-nghi / dữ liệu prototype)*.
* `HISTORY` (6 lượt tháng 4/2025) chỉ dùng trong test — *(negative-search: `grep -rnE "HISTORY\b" apps packages` · loại: dữ liệu giả lập)*.
* `setLastUnpersistedAttempt` không có nơi gọi — *(negative-search: `grep -rn "setLastUnpersistedAttempt" apps/web/src --exclude-dir=__tests__ --exclude-dir=test` · loại: dead-code-nghi)*.
* Không có thủ tục máy chủ liệt kê lượt thi — *(negative-search: danh sách procedure attempt/scoring/profile · loại: code-câm)*.
* Thẻ đếm ngược chỉ cập nhật state cục bộ — *(`apps/web/src/features/dashboard/components/countdown-card.tsx:43` · loại: code-câm về ý định)*.
* Không có test cho biểu đồ, khoảng tin cậy, nhãn "Mới nhất", nhập ngày thi — *(loại: test-thiếu)*.
* Khoảng tin cậy Trang chủ không đối xứng — *(`readiness-card.tsx:26` · loại: nghi bug)*.
