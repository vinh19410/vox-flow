# onboarding-profile — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| tRPC query | `profile.get` | Cổng chặn route, đồng bộ trạng thái, cổng trang onboarding | Cần phiên | Đọc hồ sơ mục tiêu (hoặc null) | packages/api/src/routers/profile.ts:42-51 |
| tRPC mutation | `profile.upsert` | Onboarding bước 1, màn Hồ sơ | Cần phiên | Tạo/ghi đè band + ngày thi | packages/api/src/routers/profile.ts:53-89 |
| tRPC mutation | `profile.completeOnboarding` | Onboarding bước 2 | Cần phiên | Ghi nhận thời điểm onboard (idempotent) | packages/api/src/routers/profile.ts:91-134 |
| Auth client | `authClient.updateUser` (tên, ảnh) | Màn Hồ sơ | Cần phiên | Lưu tên và/hoặc ảnh đại diện; hook kiểm tra ảnh phía máy chủ | apps/web/src/features/profile/profile-screen.tsx:83-86, 115; packages/auth/src/index.ts:60-71 |
| Auth hook | tạo người dùng (đăng ký) | Màn đăng nhập/đăng ký | — | Kiểm tra ảnh khi tạo người dùng | packages/auth/src/index.ts:48-58 |
| Route | `/onboarding` | — | Cần phiên; đã onboard thì về `/app/dashboard` | Màn onboarding 2 bước | apps/web/src/routes/_proto/onboarding.tsx:7-26 |
| Route | `/app/profile` | Sidebar | Cần phiên + đã onboard (qua `/app`) | Màn Hồ sơ | apps/web/src/routes/_proto/app/profile.tsx:5-7; apps/web/src/routes/_proto/app/route.tsx:6-9 |
| Route guard | `/exam`, `/scoring` | — | Cần phiên + đã onboard | Chặn khi chưa onboard | apps/web/src/routes/_proto/exam.tsx:7; apps/web/src/routes/_proto/scoring.tsx:7 |
| Middleware | protectedProcedure | — | — | Chặn không có phiên | packages/api/src/index.ts:15-22 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| targetBand | số thuộc tập | 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0 | "Target band must be between 5.0 and 9.0 in 0.5 increments" | packages/api/src/routers/profile.ts:8, 11-15 | ✅ |
| examDate | regex định dạng | `^\d{4}-\d{2}-\d{2}$` | "Invalid date format (YYYY-MM-DD)" | packages/api/src/routers/profile.ts:18 | ✅ |
| examDate | nullable + optional | null hoặc vắng = hợp lệ, lưu NULL | — | packages/api/src/routers/profile.ts:19-20, 64 | ✅ |
| examDate | ngày lịch thật | parse `${d}T00:00:00Z` rồi so ISO với chuỗi gốc | "Exam date must be a valid calendar date and cannot be in the past" | packages/api/src/routers/profile.ts:23-28, 37 | ✅ |
| examDate | không quá khứ | d >= ngày UTC hôm nay (so chuỗi) | như trên | packages/api/src/routers/profile.ts:30-35 | ✅ |
| examDate (UI onboarding) | min = hôm nay giờ địa phương | `min={todayStr}` | không có thông báo riêng | apps/web/src/features/onboarding/components/goal-step.tsx:51-52, 85 | ✅ |
| examDate (UI Hồ sơ) | không quá khứ UTC, không có `min` | so chuỗi `dateToSend < todayUtc` | "Ngày thi dự kiến không thể ở trong quá khứ." | apps/web/src/features/profile/profile-screen.tsx:132-138 | ✅ |
| name (UI) | trim, không rỗng, maxLength 50 | 50 | "Tên hiển thị không được để trống" | apps/web/src/features/profile/profile-screen.tsx:72-76, 222, 229 | ✅ |
| image (server) | undefined → giữ; null → xóa | — | — | packages/auth/src/image-validation.ts:20-21 | ✅ |
| image (server) | phải là chuỗi không rỗng | — | "INVALID_IMAGE" (BAD_REQUEST) | packages/auth/src/image-validation.ts:23; packages/auth/src/index.ts:52-56 | ✅ |
| image (server) | độ dài tối đa | 32_000 | "INVALID_IMAGE" | packages/auth/src/image-validation.ts:8, 24 | ✅ |
| image (server) | tiền tố cho phép | `https://`, `data:image/(webp|jpeg|png);base64,`, `/avatars/` | "INVALID_IMAGE" | packages/auth/src/image-validation.ts:10, 26-28, 30 | ✅ |
| avatar tệp (UI) | loại image/*, tối đa 5MB | 5 * 1024 * 1024 | E-020, E-021 | apps/web/src/features/profile/utils/image-compress.ts:15-22 | ✅ |
| avatar nén | 180x180, chất lượng 0.85, đầu ra ≤ 32000 | maxDimension=180, quality=0.85, MAX_USER_IMAGE_LENGTH | E-028 | apps/web/src/features/profile/utils/image-compress.ts:9-14, 71, 86-93 | ✅ |
| avatar URL (UI) | không rỗng, bắt đầu https:// | — | E-018, E-019 | apps/web/src/features/profile/components/avatar-modal.tsx:51-59 | ✅ |
| mic | mức đỉnh ≥ 0.05, thời gian ≥ 5 (bước 0.1/100ms) | 0.05; 5 | "Không nghe thấy tiếng" | apps/web/src/features/onboarding/components/mic-check.tsx:39, 44-45 | ✅ |
| mic level | rms*4, giới hạn 1; fftSize 512 | 4; 512 | — | apps/web/src/hooks/use-mic-level.ts:65, 76-77 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-001 | Không có phiên | `UNAUTHORIZED` — "Authentication required" | Đăng nhập | packages/api/src/index.ts:15-22 | ✅ |
| E-002 | Band sai | "Target band must be between 5.0 and 9.0 in 0.5 increments" (mã `BAD_REQUEST` ⚠️ do thư viện gán, chưa resolve trong code) | Chọn lại | packages/api/src/routers/profile.ts:13-15 | ✅ |
| E-003 | Định dạng ngày | "Invalid date format (YYYY-MM-DD)" | Nhập lại | packages/api/src/routers/profile.ts:18 | ✅ |
| E-004 | Ngày không hợp lệ/quá khứ | "Exam date must be a valid calendar date and cannot be in the past" | Đổi ngày | packages/api/src/routers/profile.ts:37 | ✅ |
| E-005 | Không đọc lại được hồ sơ sau lưu | `INTERNAL_SERVER_ERROR` — "Failed to persist profile" | Thử lại | packages/api/src/routers/profile.ts:81-86 | ✅ |
| E-006 | Hoàn tất khi chưa có hồ sơ | `PRECONDITION_FAILED` — "Target band must be set before completing onboarding" | Lưu mục tiêu trước | packages/api/src/routers/profile.ts:101-106 | ✅ |
| E-007 | Không đọc lại sau hoàn tất | `INTERNAL_SERVER_ERROR` — "Failed to complete onboarding" | Thử lại | packages/api/src/routers/profile.ts:126-131 | ✅ |
| E-008 | Lưu mục tiêu lỗi (onboarding) | "Không thể lưu mục tiêu. Vui lòng kiểm tra kết nối và thử lại." | Bấm lại | apps/web/src/features/onboarding/components/goal-step.tsx:45 | ✅ |
| E-009 | Hoàn tất lỗi | "Không thể hoàn tất onboarding. Vui lòng thử lại." | Bấm lại | apps/web/src/features/onboarding/onboarding-screen.tsx:26 | ✅ |
| E-010 | Mic bị chặn | "Micro bị chặn" / "Chưa cấp quyền truy cập micro" / "Trình duyệt đang chặn micro." / "Vui lòng bấm vào biểu tượng ổ khóa trên thanh địa chỉ, bật quyền Micro, sau đó bấm nút “Thử lại quyền micro”." | Thử lại quyền | apps/web/src/features/onboarding/components/mic-check.tsx:98, 109, 137-139 | ✅ |
| E-011 | Mic quá nhỏ | "Không nghe thấy tiếng" / "Tín hiệu âm thanh quá nhỏ" / "Không nghe thấy tiếng micro." / "Vui lòng kiểm tra micro không bị tắt tiếng (mute), nói to hơn gần micro và bấm nút “Thử lại âm thanh”." | Thử lại âm thanh | apps/web/src/features/onboarding/components/mic-check.tsx:100, 111, 147-149 | ✅ |
| E-012 | Lưu mục tiêu lỗi (Hồ sơ) | "Không thể lưu mục tiêu. Vui lòng kiểm tra lại kết nối." | Bấm lại | apps/web/src/features/profile/profile-screen.tsx:154 | ✅ |
| E-013 | Ngày quá khứ (Hồ sơ) | "Ngày thi dự kiến không thể ở trong quá khứ." | Đổi ngày | apps/web/src/features/profile/profile-screen.tsx:136 | ✅ |
| E-014 | Tên trống | "Tên hiển thị không được để trống" | Nhập tên | apps/web/src/features/profile/profile-screen.tsx:74 | ✅ |
| E-015 | Lỗi cập nhật thông tin | "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại." | Thử lại | apps/web/src/features/profile/profile-screen.tsx:95 | ✅ |
| E-016 | Lỗi lưu ảnh | "Không thể lưu ảnh đại diện. Vui lòng thử lại." | Thử lại | apps/web/src/features/profile/profile-screen.tsx:121 | ✅ |
| E-017 | Ảnh bị từ chối | `BAD_REQUEST` — "INVALID_IMAGE" (không hiển thị nguyên văn; UI hiện E-015/E-016) | Chọn ảnh khác | packages/auth/src/index.ts:53-55, 65-67 | ✅ |
| E-018..019 | Link ảnh | "Vui lòng nhập đường dẫn URL ảnh hợp lệ." / "URL phải bắt đầu bằng https:// (hoặc dùng tab Tải ảnh lên)." | Sửa link | apps/web/src/features/profile/components/avatar-modal.tsx:53, 57 | ✅ |
| E-020..029 | Nén ảnh | Xem Mục 6 spec (nguyên văn tại apps/web/src/features/profile/utils/image-compress.ts:16, 21, 28, 34, 41, 48, 56, 64, 83, 89, 97) | Chọn ảnh khác | apps/web/src/features/profile/utils/image-compress.ts:15-98 | ✅ |
| E-030 | Lỗi xử lý ảnh không có thông điệp | "Không thể xử lý ảnh này." | Chọn ảnh khác | apps/web/src/features/profile/components/avatar-modal.tsx:42 | ✅ |
| E-031 | Cổng chặn fail-open | console: "requireOnboarded: failed to fetch profile, failing open" | — | apps/web/src/lib/auth-guard.ts:66 | ✅ |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Tập band hợp lệ | upsert | 9 giá trị 5.0..9.0 bước 0.5 | có (packages/api/src/routers/profile.test.ts:78-83) | packages/api/src/routers/profile.ts:8-15 | ✅ |
| Ngày thi không quá khứ (UTC) | upsert | so chuỗi ngày UTC | có (packages/api/src/routers/profile.test.ts:85-90) — chỉ ca 2020-01-01; KHÔNG có test ngày 'hôm nay' và ngày lịch giả | packages/api/src/routers/profile.ts:30-35 | ✅ |
| upsert ghi đè theo userId | upsert | khóa chính user_id | có (packages/api/src/routers/profile.test.ts:99-141) | packages/api/src/routers/profile.ts:66-73 | ✅ |
| onboardedAt bất biến, idempotent | completeOnboarding | — | có (packages/api/src/routers/profile.test.ts:118-127) | packages/api/src/routers/profile.ts:108-118 | ✅ |
| Cần hồ sơ trước khi hoàn tất | completeOnboarding | — | có (packages/api/src/routers/profile.test.ts:92-97) | packages/api/src/routers/profile.ts:101-106 | ✅ |
| Cách ly hồ sơ giữa người dùng | mọi thủ tục | userId từ phiên | có (packages/api/src/routers/profile.test.ts:143-155) | packages/api/src/routers/profile.ts:43, 56, 92 | ✅ |
| Cổng onboarding | truy cập /app, /exam, /scoring | — | có (apps/web/src/lib/__tests__/route-guards.test.ts:59-100; apps/web/src/lib/__tests__/auth-guard.test.ts:116-215) | apps/web/src/lib/auth-guard.ts:41-70 | ✅ |
| Fail-open cổng | lỗi hỏi hồ sơ | — | có (apps/web/src/lib/__tests__/auth-guard.test.ts:217-238) | apps/web/src/lib/auth-guard.ts:62-66 | ✅ |
| Về Dashboard nếu đã onboard | vào /onboarding | — | có (apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:47-68) | apps/web/src/routes/_proto/onboarding.tsx:14-17 | ✅ |
| Đạt mic: 5 giây và đỉnh ≥ 0.05 | ghi thử | 5; 0.05; 100 ms | có (apps/web/src/features/__tests__/slice-a.test.tsx:283-392) | apps/web/src/features/onboarding/components/mic-check.tsx:39, 43-54 | ✅ |
| Mic chặn/không có thiết bị | ghi thử | — | có (apps/web/src/features/__tests__/slice-a.test.tsx:253-281; apps/web/src/hooks/__tests__/use-mic-level.test.ts:38-51) | apps/web/src/hooks/use-mic-level.ts:40-45, 91-98 | ✅ |
| Giải phóng micro | dừng/rời màn/lỗi | — | có (apps/web/src/hooks/__tests__/use-mic-level.test.ts:53-100) | apps/web/src/hooks/use-mic-level.ts:32-38, 102-106 | ✅ |
| Ảnh: whitelist + 32000 | tạo/cập nhật người dùng | 32_000 | có (packages/auth/src/image-validation.test.ts:5-76); KHÔNG có test hook tạo/cập nhật người dùng đầu-cuối | packages/auth/src/image-validation.ts:17-31 | ✅ |
| Nén ảnh | tải ảnh | 5MB; 180; 0.85 | có (apps/web/src/features/profile/__tests__/image-compress.test.ts:7-237) | apps/web/src/features/profile/utils/image-compress.ts:9-106 | ✅ |
| 6 mẫu ảnh khớp whitelist | chọn mẫu | 6 | có (apps/web/src/features/profile/__tests__/preset-avatars.test.ts:6-17; packages/auth/src/image-validation.test.ts:63-68) | apps/web/src/features/profile/data/preset-avatars.ts:9-46 | ✅ |
| Nạp hồ sơ một lần mỗi người dùng | phiên đổi | mặc định 7.0 / null | có (apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:85-131) — KHÔNG có test cho nhánh chưa có hồ sơ (mặc định 7.0) | apps/web/src/features/app-state/use-profile-hydration.ts:51, 69-77 | ✅ |
| Lưu ảnh không gửi tên rỗng | chọn ảnh | — | KHÔNG có test cho nhánh tên rỗng (test hiện có chỉ ca tên có giá trị: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:209-232) | apps/web/src/features/profile/profile-screen.tsx:104-114 | ✅ |
| Hoàn tất khi band rỗng | completeOnboarding | — | không | packages/api/src/routers/profile.ts:101 (không thể xảy ra vì NOT NULL: packages/db/src/schema/profile.ts:10) | 🔵 |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| user_profile | user_id (khóa chính), target_band (bắt buộc), exam_date (chuỗi, tùy chọn), onboarded_at (ms, tùy chọn), created_at (mặc định hiện tại), updated_at | 1-1 với user, xóa dây chuyền | packages/db/src/schema/profile.ts:6-17; packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql:1-9 |
| user (phần liên quan) | id, name, email, emailVerified, image | 1-0..1 user_profile | packages/api/src/routers/profile.test.ts:11-19; packages/auth/src/index.ts:60-71 |
| AppState (trình duyệt) | target, examDate, name, email | không bền vững | apps/web/src/features/app-state/initial-state.ts:5-8 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Onboarding bước 1 "Tiếp tục" | API → bảng user_profile | gọi mutation, ghi (upsert) | Flow 1 | apps/web/src/features/onboarding/components/goal-step.tsx:37 · packages/api/src/routers/profile.ts:59-73 |
| Onboarding bước 2 "Micro ổn, tiếp tục" | API → bảng user_profile | gọi mutation, ghi onboarded_at | Flow 2 | apps/web/src/features/onboarding/onboarding-screen.tsx:22 · packages/api/src/routers/profile.ts:112-118 |
| Cổng chặn route / trang onboarding / đồng bộ trạng thái | API → bảng user_profile | gọi query, đọc | Flow 3, Flow 4 | apps/web/src/lib/auth-guard.ts:51; apps/web/src/routes/_proto/onboarding.tsx:13; apps/web/src/features/app-state/use-profile-hydration.ts:61 · packages/api/src/routers/profile.ts:43-48 |
| Màn Hồ sơ "Lưu mục tiêu" | API → bảng user_profile | gọi mutation, ghi | Flow 5 | apps/web/src/features/profile/profile-screen.tsx:144 · packages/api/src/routers/profile.ts:59-73 |
| Màn Hồ sơ lưu tên/ảnh | Dịch vụ xác thực → hook kiểm tra ảnh → bảng user | gọi cập nhật người dùng, ghi | Flow 6, Flow 7 | apps/web/src/features/profile/profile-screen.tsx:83, 115 · packages/auth/src/index.ts:60-71 |
| Xuất/xóa dữ liệu người dùng (feature quyền riêng tư) | bảng user_profile | đọc/xóa | ngoài phạm vi, chỉ tham chiếu | packages/api/src/data-registry.ts:57-65 · packages/db/src/schema/profile.ts:6 |

> Ghi chú: mic không phải hop chéo tiến trình (chạy trong trình duyệt, không gửi dữ liệu đi). Tổng 6 hop (5 trong phạm vi + 1 tham chiếu).

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Nhãn "Đã xác thực" cứng, không đọc `emailVerified` — *(negative-search: `emailVerified` trong apps/web/src → 0 kết quả · loại: dead-code-nghi/fake-data)*
* `markUserOnboarded`, `clearOnboardedUserCache` không có caller ngoài test — *(negative-search: tên hàm trong apps/web/src trừ test → chỉ định nghĩa · loại: dead-code-nghi)*
* Prop `compact` của MicCheck không có nơi truyền — *(negative-search: `MicCheck` ngoài apps/web/src/features/onboarding → 0 kết quả · loại: dead-code-nghi)*
* Nhánh "không có kênh gọi máy chủ thì coi như thành công" (`if (trpcClient?.profile...mutate)`) ở 3 nơi — *(loại: dead-code-nghi/prototype fallback; xem OQ-7)* apps/web/src/features/onboarding/components/goal-step.tsx:36, apps/web/src/features/onboarding/onboarding-screen.tsx:21, apps/web/src/features/profile/profile-screen.tsx:143
* Lời khuyên "50 dB" là chữ tĩnh, không đo — *(loại: code-câm/fake-data; OQ-15)* apps/web/src/features/onboarding/components/mic-check.tsx:156
* Ảnh đổi trên màn Hồ sơ không hoàn lại khi lưu lỗi — *(loại: code-câm; OQ-10)* apps/web/src/features/profile/profile-screen.tsx:103
* Không có `it.skip`/`it.todo` trong các test của feature — *(negative-search: `it.skip|it.todo|describe.skip|xit(|test.skip` trên các file test S6, S7, S21-S28 → 0 kết quả)*
* Không có cờ `FEATURES.*` nào chi phối feature — *(negative-search: apps/web/src/lib/feature-flags.ts:1-4 chỉ có `scoring`, `billing`)*
* Dữ liệu fake/prototype: tên mặc định "Học viên Vox Flow" và 6 mô tả ảnh mẫu mang tính quảng bá ("Vững vàng mục tiêu 8.0+") — *(loại: nội dung tĩnh, không phải dữ liệu giả)* apps/web/src/features/profile/profile-screen.tsx:37, apps/web/src/features/profile/data/preset-avatars.ts:11-44
