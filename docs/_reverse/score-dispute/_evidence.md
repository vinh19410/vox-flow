# score-dispute — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| tRPC mutation | `dispute.submit` | Form "Báo lỗi chấm" trên trang kết quả | protectedProcedure (cần phiên) | Học viên gửi báo lỗi chấm | packages/api/src/routers/dispute.ts:24-131; gọi từ apps/web/src/features/results/components/report-modal.tsx:46-54; đăng ký packages/api/src/routers/index.ts:24 |
| tRPC query | `dispute.get` | Trang kết quả (tải trạng thái) | protectedProcedure | Xem báo lỗi mới nhất + cờ bật/tắt | packages/api/src/routers/dispute.ts:133-169; gọi từ apps/web/src/features/results/results-screen.tsx:77-79 |
| GET (HTTP) | `/api/attempts/:attemptId/answers/:answerId/audio` | Không có màn trong feature; quản trị dùng (dispute-admin) | Cần phiên; chủ bài thi hoặc quản trị có đồng ý chia sẻ | Điểm bàn giao: dùng shareConsent quyết định quyền nghe | apps/server/src/index.ts:301-344; packages/api/src/auth-utils.ts:23-37 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| attemptId | chuỗi, ít nhất 1 ký tự | min(1) | ⚠️ chưa resolve (thông điệp mặc định thư viện) | packages/api/src/routers/dispute.ts:9 | ✅ |
| targetCriterion | enum | "ALL","FC","LR","GRA","PRON"; hoặc "P" quy đổi "PRON" | ⚠️ chưa resolve | packages/api/src/routers/dispute.ts:10-12 | ✅ |
| expectedBand | enum bắt buộc | "5.0","5.5","6.0","6.5","7.0","7.5","8.0" | ⚠️ chưa resolve | packages/api/src/routers/dispute.ts:13 | ✅ |
| previousBand | chuỗi tùy chọn | không ràng buộc | — | packages/api/src/routers/dispute.ts:14 | ✅ |
| reason | chuỗi tùy chọn, trim | max 1000; rỗng sau trim → null | ⚠️ chưa resolve | packages/api/src/routers/dispute.ts:15,93 | ✅ |
| shareConsent | boolean | mặc định false | ⚠️ chưa resolve | packages/api/src/routers/dispute.ts:16 | ✅ |
| Giao diện: reason | maxLength | 1000, bộ đếm `n/1000` | — (chặn nhập) | apps/web/src/features/results/components/report-modal.tsx:118,122 | ✅ |
| Giao diện: expectedBand | dropdown | 5.0..8.0 bước 0.5; mặc định "6.5" | — | apps/web/src/features/results/components/report-modal.tsx:28,109 | ✅ |
| Giao diện: tiêu chí | chọn 1 trong 5 nút; mặc định GRA | ALL, FC, LR, GRA, P | — | apps/web/src/features/results/components/report-modal.tsx:11-17,27 | ✅ |
| Cột DB | không CHECK cho tiêu chí/band/trạng thái | text thuần | — | packages/db/src/migrations/20261105123206_careful_paladin/migration.sql:5-8 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-score-dispute-001 | Cờ khác "true" (FORBIDDEN) | "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" | Chờ bật cờ | packages/api/src/routers/dispute.ts:28-32 · packages/api/src/routers/dispute.test.ts:60 | ✅ |
| E-score-dispute-002 | Không có phiên (UNAUTHORIZED) | "Authentication required" | Đăng nhập | packages/api/src/index.ts:16-21 | ✅ |
| E-score-dispute-003 | Bài thi không tồn tại (NOT_FOUND) | "Không tìm thấy bài thi" | — | packages/api/src/routers/dispute.ts:41-46 | ✅ |
| E-score-dispute-004 | Không phải chủ (FORBIDDEN) | "Bạn không có quyền báo lỗi cho bài thi này" | — | packages/api/src/routers/dispute.ts:48-53 · packages/api/src/routers/dispute.test.ts:148 | ✅ |
| E-score-dispute-005 | Chưa nộp (BAD_REQUEST) | "Chỉ bài thi đã nộp mới có thể gửi báo lỗi" | Nộp bài | packages/api/src/routers/dispute.ts:55-60 · packages/api/src/routers/dispute.test.ts:184 | ✅ |
| E-score-dispute-006 | Có báo lỗi hoạt động (CONFLICT) | "Bài thi này đã có báo lỗi đang được xử lý" | Chờ xử lý | packages/api/src/routers/dispute.ts:73-78 · packages/api/src/routers/dispute.test.ts:229 | ✅ |
| E-score-dispute-007 | Vi phạm chỉ mục duy nhất (CONFLICT) | "Bài thi này đã có báo lỗi đang được xử lý" | Như trên | packages/api/src/routers/dispute.ts:120-128 | ✅ |
| E-score-dispute-008 | Không có bản ghi sau lưu (INTERNAL_SERVER_ERROR) | "Không thể lưu báo lỗi" | Thử lại | packages/api/src/routers/dispute.ts:101-106 | ✅ |
| E-score-dispute-009 | Lỗi DB khác | ⚠️ chưa resolve | Thử lại | packages/api/src/routers/dispute.ts:129 | 🟡 |
| E-score-dispute-010 | Đầu vào sai | ⚠️ chưa resolve | Sửa giá trị | packages/api/src/routers/dispute.ts:8-17 | 🟡 |
| E-score-dispute-011 | Xem: bài thi không tồn tại (NOT_FOUND) | "Không tìm thấy bài thi" | — | packages/api/src/routers/dispute.ts:144-149 | ✅ |
| E-score-dispute-012 | Xem: không phải chủ (FORBIDDEN) | "Bạn không có quyền xem thông tin bài thi này" | — | packages/api/src/routers/dispute.ts:151-156 · packages/api/src/routers/dispute.test.ts:310 | ✅ |
| E-score-dispute-013 | Tải trạng thái thất bại | console: "Failed to load dispute status:" (không hiện cho học viên) | Tải lại trang | apps/web/src/features/results/results-screen.tsx:83-85 | ✅ |
| E-score-dispute-014 | Lỗi không có message ở form | "Không thể gửi báo lỗi. Vui lòng thử lại sau." | Thử lại | apps/web/src/features/results/components/report-modal.tsx:60 | ✅ |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Cờ phải đúng chuỗi "true" | submit | `=== "true"` | có (packages/api/src/routers/dispute.test.ts:29-64 cho "false"; nhánh thiếu/khác chưa test) | packages/api/src/routers/dispute.ts:27 | ✅ |
| Hạn phản hồi = lúc gửi + 72 giờ | submit | 72 * 60 * 60 * 1000 ms | có (packages/api/src/routers/dispute.test.ts:66-118, dung sai 1 giây) | packages/api/src/routers/dispute.ts:81-82 | ✅ |
| Trạng thái khởi tạo = open | submit | "open" | có (packages/api/src/routers/dispute.test.ts:105) | packages/api/src/routers/dispute.ts:96 | ✅ |
| Một báo lỗi hoạt động / bài thi | submit | open, reviewing | có (packages/api/src/routers/dispute.test.ts:190-233) | packages/api/src/routers/dispute.ts:62-78; packages/db/src/schema/dispute.ts:44-46 | ✅ |
| Bài thi phải `submitted` | submit | "submitted" | có (packages/api/src/routers/dispute.test.ts:154-188) | packages/api/src/routers/dispute.ts:55 | ✅ |
| Chủ bài thi | submit/get | userId khớp | có (packages/api/src/routers/dispute.test.ts:120-152, 288-315) | packages/api/src/routers/dispute.ts:48,151 | ✅ |
| Lấy báo lỗi mới nhất | get | order createdAt desc, limit 1 | có một phần (packages/api/src/routers/dispute.test.ts:235-286 chỉ có 1 bản ghi) | packages/api/src/routers/dispute.ts:158-163 | ✅ |
| get không bị chặn bởi cờ | get | trả `enabled` | có (packages/api/src/routers/dispute.test.ts:258-260) | packages/api/src/routers/dispute.ts:136,165-168 | ✅ |
| Nút hiện khi: enabled, không phải bản mặc định, có mã khác "latest", chưa có báo lỗi | render | — | có (apps/web/src/features/results/__tests__/report-modal.test.tsx:179-193) | apps/web/src/features/results/results-screen.tsx:339 | ✅ |
| Badge theo trạng thái | render | open/reviewing → vàng; resolved → xanh; rejected → xám | có cho open, resolved (report-modal.test.tsx:195-232); rejected không có test | apps/web/src/features/results/results-screen.tsx:319-338 | ✅ |
| Quyền nghe audio theo đồng ý của báo lỗi mới nhất | phát audio | shareConsent === true và là quản trị | có (packages/api/src/auth-utils.test.ts:57-101) | apps/server/src/index.ts:322-331; packages/api/src/auth-utils.ts:23-37 | ✅ |
| Xuất/xóa dữ liệu cá nhân gồm báo lỗi | privacy | theo userId | có (packages/api/src/data-registry.test.ts:274,312,324) | packages/api/src/data-registry.ts:227-235 | ✅ |
| Trạng thái "reviewing" không có nơi gán | — | — | không | packages/db/src/schema/dispute.ts:25 | 🟡 |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| score_dispute (báo lỗi chấm) | targetCriterion, expectedBand, reason, shareConsent, status, dueAt, createdAt, previousBand, (resolvedBand, replyText, resolvedAt, warnedAt, updatedAt do dispute-admin) | N-1 attempt (xóa dây chuyền), N-1 user (xóa dây chuyền); tối đa 1 báo lỗi hoạt động / attempt | packages/db/src/schema/dispute.ts:8-47 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| H1: Form báo lỗi (web) | API: gửi báo lỗi | gọi tRPC qua HTTP | Gửi báo lỗi | apps/web/src/features/results/components/report-modal.tsx:48 · packages/api/src/routers/dispute.ts:24 |
| H2: Trang kết quả (web) | API: xem báo lỗi | gọi tRPC qua HTTP | Xem trạng thái | apps/web/src/features/results/results-screen.tsx:78 · packages/api/src/routers/dispute.ts:133 |
| H3: API | D1 (bảng score_dispute, attempt) | đọc/ghi SQL qua ORM | Gửi + xem | packages/api/src/routers/dispute.ts:35,62,85,138,158 · packages/db/src/schema/dispute.ts:8 |
| H4: shareConsent đã lưu | Máy chủ phát audio (apps/server) → quản trị nghe audio | đọc bản ghi báo lỗi mới nhất khi phát audio | Chia sẻ audio (bàn giao dispute-admin) | packages/api/src/routers/dispute.ts:94 · apps/server/src/index.ts:322-331 |
| H5: dueAt/status đã lưu | Tác vụ định kỳ mỗi giờ (cảnh báo trước hạn 12 giờ) | đọc + ghi warnedAt | dispute-admin | packages/api/src/routers/dispute.ts:82 · packages/api/src/disputes/overdue.ts:16-52 |
| H6: Bảng score_dispute | Quy trình xuất/xóa dữ liệu cá nhân | đọc/xóa theo userId | Quyền riêng tư | packages/db/src/schema/dispute.ts:8 · packages/api/src/data-registry.ts:227-235 |

Tổng: 6 hop (web→API 2, API→D1 1, các hop sang feature khác 3). Không có hàng đợi (queue) hay lưu trữ đối tượng (R2) trong luồng GỬI/XEM của feature này.

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Giá trị cờ ở môi trường thật — *(negative-search: `SCORE_DISPUTE_ENABLED` trong apps/ + packages/ chỉ thấy khai báo mặc định tắt · loại: dead-code-nghi/cờ tắt)*
* Nút/badge có thể không tới được học viên thật (BR-018) — *(negative-search: `attempts:`, `setLastUnpersistedAttempt(` trong apps/web/src ngoài test · loại: dead-code-nghi)*
* Trạng thái "reviewing" không có nơi gán — *(negative-search: gán `reviewing` trong apps/ + packages/ · loại: code-câm)*
* Không thấy thông báo email/push, rate-limit, kiểm tra transcript — *(xem negative-search trong reverse-gaps.md · loại: code-câm)*
* Nhánh "không có hàm gửi vẫn báo thành công" — *(apps/web/src/features/results/components/report-modal.tsx:46-58 · loại: dead-code-nghi / dấu vết prototype)*
