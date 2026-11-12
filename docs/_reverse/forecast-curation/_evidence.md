# forecast-curation — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

Giao thức tRPC qua router `forecastAdmin` (gắn tại `packages/api/src/routers/index.ts:27`). Mọi thao tác dùng middleware quản trị.

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| query | forecastAdmin.checkAdmin | route `/admin/forecast` (bước vào) | quản trị viên | Kiểm tra quyền | packages/api/src/routers/forecast-admin.ts:17; apps/web/src/routes/admin/forecast.tsx:17 |
| query | forecastAdmin.listDrafts | màn hình quản trị (tải/đổi quý/làm mới) | quản trị viên | Danh sách đề kèm nguồn và số báo | packages/api/src/routers/forecast-admin.ts:21; apps/web/src/features/admin/forecast-admin-screen.tsx:78 |
| mutation | forecastAdmin.createDraft | hộp thoại "Thêm bản nháp đề mới" | quản trị viên | Tạo bản nháp tay | packages/api/src/routers/forecast-admin.ts:107; apps/web/src/features/admin/forecast-admin-screen.tsx:193 |
| mutation | forecastAdmin.updateDraft | hộp thoại "Chỉnh sửa đề thi nháp" | quản trị viên | Sửa tiêu đề/quý/part/câu hỏi | packages/api/src/routers/forecast-admin.ts:195; apps/web/src/features/admin/forecast-admin-screen.tsx:146 |
| mutation | forecastAdmin.publish | nút "Duyệt" | quản trị viên | Duyệt/xuất bản | packages/api/src/routers/forecast-admin.ts:276; apps/web/src/features/admin/forecast-admin-screen.tsx:106 |
| mutation | forecastAdmin.archive | nút "Lưu trữ" | quản trị viên | Lưu trữ | packages/api/src/routers/forecast-admin.ts:325; apps/web/src/features/admin/forecast-admin-screen.tsx:125 |
| mutation | forecastAdmin.ingestRawFeed | KHÔNG có màn gọi (chỉ test) | quản trị viên | Nhập nguồn thô, gộp trùng | packages/api/src/routers/forecast-admin.ts:368; packages/api/src/routers/forecast-admin.test.ts:300 |
| route (web) | /admin/forecast | — | phiên + checkAdmin ở beforeLoad | Màn hình quản trị | apps/web/src/routes/admin/forecast.tsx:7-29 |

Middleware: chưa đăng nhập thì UNAUTHORIZED (packages/api/src/index.ts:15-22); không là quản trị viên thì FORBIDDEN (packages/api/src/index.ts:31-38).

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| sourceUrl (mọi nơi) | URL hợp lệ + khớp /^https?:\/\//i | http/https | "Only HTTP/HTTPS URLs are allowed" | packages/api/src/routers/forecast-admin.ts:9-14 | ✅ |
| sourceType | enum | manual, student, web | zod mặc định ⚠️ chưa resolve | packages/api/src/routers/forecast-admin.ts:118,374 | 🟡 |
| sourceUrl khi sourceType = web | bắt buộc, không rỗng | — | "sourceUrl is required for web sources" | packages/api/src/routers/forecast-admin.ts:122-129,382-389 | ✅ |
| createDraft.title | min 1 ký tự | 1 | "Title is required" | packages/api/src/routers/forecast-admin.ts:110 | ✅ |
| createDraft.quarter | min 1 ký tự | 1 | "Quarter is required" | packages/api/src/routers/forecast-admin.ts:111 | ✅ |
| part (tạo / nhập) | số nguyên 1..3, mặc định 1 | 1, 3, default 1 | zod mặc định ⚠️ chưa resolve | packages/api/src/routers/forecast-admin.ts:112,380 | 🟡 |
| part (sửa) | số nguyên 1..3, tùy chọn | 1, 3 | zod mặc định ⚠️ chưa resolve | packages/api/src/routers/forecast-admin.ts:201 | 🟡 |
| questions (tạo) | mảng chuỗi, mặc định [] ; không giới hạn độ dài/số lượng/chuỗi rỗng | [] | — | packages/api/src/routers/forecast-admin.ts:113 | ✅ |
| updateDraft.title | min 1, tùy chọn | 1 | zod mặc định ⚠️ chưa resolve | packages/api/src/routers/forecast-admin.ts:199 | 🟡 |
| updateDraft.quarter | chuỗi, không min | — | — | packages/api/src/routers/forecast-admin.ts:200 | ✅ |
| ingest.rawTitle | min 1 | 1 | zod mặc định ⚠️ chưa resolve | packages/api/src/routers/forecast-admin.ts:376 | 🟡 |
| ingest.quarter | min 1 | 1 | zod mặc định ⚠️ chưa resolve | packages/api/src/routers/forecast-admin.ts:379 | 🟡 |
| ingest.items | mảng, cho phép rỗng, không giới hạn | [] | — | packages/api/src/routers/forecast-admin.ts:371,433-437 | ✅ |
| UI tiêu đề tạo | trim, không rỗng | — | "Vui lòng nhập tiêu đề cho chủ đề." | apps/web/src/features/admin/forecast-admin-screen.tsx:168-171 | ✅ |
| UI URL nguồn web | trim, không rỗng và /^https?:\/\//i | — | "Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://)." | apps/web/src/features/admin/forecast-admin-screen.tsx:173-176 | ✅ |
| UI câu hỏi | tách theo xuống dòng, cắt khoảng trắng, bỏ dòng rỗng | — | — | apps/web/src/features/admin/forecast-admin-screen.tsx:138-141,178-181 | ✅ |
| Tiền tố câu hỏi Part 2 | "[Cue] " (6 ký tự) → cueCards; "[Part 3] " (9 ký tự) → part3; còn lại → cueCards | — | — | packages/api/src/routers/forecast-admin.ts:143-149,241-247 | ✅ |
| Email quản trị | khớp không phân biệt hoa thường, trim, tách dấu phẩy | — | — | packages/api/src/auth-utils.ts:1-13 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-forecast-curation-001 | Không phiên | UNAUTHORIZED — "Authentication required" | Đăng nhập | packages/api/src/index.ts:17-21 (không có catalog riêng) | ✅ |
| E-forecast-curation-002 | Không là quản trị viên | FORBIDDEN — "Admin access required" | Dùng tài khoản quản trị | packages/api/src/index.ts:34-37 | ✅ |
| E-forecast-curation-003 | Mã đề không tồn tại | NOT_FOUND — "Forecast topic not found" | Làm mới | packages/api/src/routers/forecast-admin.ts:213-216,290-293,339-342 | ✅ |
| E-forecast-curation-004 | Đọc lại sau ghi trống | INTERNAL_SERVER_ERROR — "Failed to create forecast topic" / "Failed to update forecast topic" / "Failed to publish forecast topic" / "Failed to archive forecast topic" | Thử lại | packages/api/src/routers/forecast-admin.ts:187-190,268-271,317-320,360-363 | ✅ |
| E-forecast-curation-005 | Tiêu đề rỗng | "Title is required" | Nhập | packages/api/src/routers/forecast-admin.ts:110 | ✅ |
| E-forecast-curation-006 | Quý rỗng | "Quarter is required" | Nhập | packages/api/src/routers/forecast-admin.ts:111 | ✅ |
| E-forecast-curation-007 | URL sai giao thức | "Only HTTP/HTTPS URLs are allowed" | Nhập lại | packages/api/src/routers/forecast-admin.ts:12-14 | ✅ |
| E-forecast-curation-008 | Web thiếu URL | "sourceUrl is required for web sources" | Nhập | packages/api/src/routers/forecast-admin.ts:127,387 | ✅ |
| E-forecast-curation-009 | Sai định dạng khác (zod) | ⚠️ chưa resolve (thông điệp mặc định thư viện) | Sửa nhập | packages/api/src/routers/forecast-admin.ts:112,199,201,376,379,380 | 🟡 |
| E-forecast-curation-010 | UI tiêu đề rỗng | "Vui lòng nhập tiêu đề cho chủ đề." | Nhập | apps/web/src/features/admin/forecast-admin-screen.tsx:169 | ✅ |
| E-forecast-curation-011 | UI URL web sai | "Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://)." | Nhập | apps/web/src/features/admin/forecast-admin-screen.tsx:174 | ✅ |
| E-forecast-curation-012 | UI lỗi không phải Error | "Duyệt đề thất bại" / "Lưu trữ đề thất bại" / "Lưu thay đổi thất bại" / "Tạo bản nháp thất bại" | Thử lại | apps/web/src/features/admin/forecast-admin-screen.tsx:116,131,161,230 | ✅ |
| E-forecast-curation-013 | UI tải lỗi khác | hiển thị thông điệp lỗi thô | Làm mới | apps/web/src/features/admin/forecast-admin-screen.tsx:89 | ✅ |
| (UI) Từ chối truy cập | Lỗi chứa "Admin access required" hoặc "FORBIDDEN" | "Truy cập bị từ chối" / "Chỉ người sở hữu sản phẩm mới có quyền truy cập vào công cụ quản trị duyệt đề forecast." | — | apps/web/src/features/admin/forecast-admin-screen.tsx:86-87,241-244 | ✅ |
| (UI) Danh sách rỗng | Không đề khớp bộ lọc | "Không có đề nào phù hợp với bộ lọc." | — | apps/web/src/features/admin/forecast-admin-screen.tsx:338 | ✅ |

Catalog thông điệp tập trung: không có (thông điệp rải trong router và component). Test chỉ khẳng định kiểu `TRPCError`, không so khớp chữ (packages/api/src/routers/forecast-admin.test.ts:82-103,276-278).

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Đề mới luôn nháp | Tạo / nhập / AI | status = draft | có (packages/api/src/routers/forecast-admin.test.ts:126-127,189-193; packages/api/src/forecast/dedupe.test.ts:58,142) | packages/api/src/routers/forecast-admin.ts:162,406; packages/api/src/forecast/dedupe.ts:150,233 | ✅ |
| Duyệt ghi reviewer + time | publish | reviewedBy = id phiên; reviewedAt = now | có (packages/api/src/routers/forecast-admin.test.ts:199-201) | packages/api/src/routers/forecast-admin.ts:297-308 | ✅ |
| Duyệt/lưu trữ/sửa không kiểm tra trạng thái | publish/archive/updateDraft | — | không | packages/api/src/routers/forecast-admin.ts:283-308,332-351,206-259 | ✅ |
| draft → published (duy nhất publish) | publish | — | có (packages/api/src/routers/forecast-admin.test.ts:195-201) | packages/api/src/routers/forecast-admin.ts:303 | ✅ |
| any → archived | archive | — | có (packages/api/src/routers/forecast-admin.test.ts:212-216) | packages/api/src/routers/forecast-admin.ts:347 | ✅ |
| Tách câu hỏi Part 2 | create / update | "[Cue] " cắt 6, "[Part 3] " cắt 9 | không (test tạo Part 2 không có tiền tố, không khẳng định định dạng lưu) | packages/api/src/routers/forecast-admin.ts:139-154,226-253 | ✅ |
| Giữ isNew khi sửa Part 2 | update | isNew mặc định false; mất khi cả hai nhóm rỗng | không | packages/api/src/routers/forecast-admin.ts:226-253 | ✅ |
| Đếm học viên khác nhau | listDrafts | countDistinct(userId) | có (packages/api/src/routers/forecast-admin.test.ts:255-259) | packages/api/src/routers/forecast-admin.ts:65-78 | ✅ |
| Ngưỡng gộp | ingest | Jaccard >= 0.25 | có gián tiếp (packages/api/src/forecast/dedupe.test.ts:50; packages/api/src/routers/forecast-admin.test.ts:328) | packages/api/src/forecast/dedupe.ts:174 | ✅ |
| Cùng quý + part mới gộp | ingest | part mặc định 1 | không có test khác quý/part | packages/api/src/forecast/dedupe.ts:172 | ✅ |
| Chuẩn hóa token | ingest | 33 từ dừng; bỏ từ dài 1 ký tự; elderly/aged/senior → older | có gián tiếp (packages/api/src/forecast/dedupe.test.ts:11-35: "older"/"elderly"/"someone older") | packages/api/src/forecast/dedupe.ts:49-96 | ✅ |
| Bỏ chỉ số nguồn ngoài phạm vi, bỏ trạng thái tiêm (đường AI) | ingest có AI | — | có một phần (packages/api/src/forecast/dedupe.test.ts:113-143, chỉ trạng thái tiêm) | packages/api/src/forecast/dedupe.ts:136-152 | ✅ |
| Cụm có web: đổi "describe" đầu tiêu đề thành "Describe " và viết IN HOA toàn bộ từ hỏi đầu câu (What thành WHAT) | ingest | regex /^describe\s+/i, /^(what|why|how|when|who)\s+/i | không (test dùng đường AI giả) | packages/api/src/forecast/dedupe.ts:217-223 | ✅ |
| Loại câu hỏi trùng tuyệt đối | ingest | Set | không | packages/api/src/forecast/dedupe.ts:232 | ✅ |
| Quản trị = email khớp danh sách | mọi thao tác | — | có (packages/api/src/auth-utils.test.ts:5-24) | packages/api/src/auth-utils.ts:1-13 | ✅ |
| Học viên chỉ thấy/báo đề published | học viên | status = published | có (packages/api/src/routers/forecast-admin.test.ts:281-295) | packages/api/src/routers/forecast.ts:38,101-106 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| Chủ đề (forecast_topic) | title, quarter, part, questions (JSON), status, reviewedBy, reviewedAt, createdAt, updatedAt | reviewedBy → user (xóa user: set null) | packages/db/src/schema/forecast.ts:6-36 |
| Nguồn (forecast_source) | topicId, sourceType, sourceUrl, rawContent, createdAt | N-1 chủ đề (xóa chủ đề: cascade) | packages/db/src/schema/forecast.ts:38-58 |
| Báo cáo (forecast_report) | topicId, userId, notes, createdAt; unique (userId, topicId) | N-1 chủ đề, N-1 user (cascade cả hai) | packages/db/src/schema/forecast.ts:60-82 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

— không có hop chéo repo. Toàn bộ feature chạy trong cùng monorepo và cùng tiến trình máy chủ API; web gọi API qua tRPC (cùng repo) và API ghi/đọc một kho dữ liệu D1. Không có hàng đợi, cron, R2, gọi dịch vụ ngoài trong code quản trị (xác nhận: `grep -n "fetch(\|queue\|R2\|OPENAI" packages/api/src/routers/forecast-admin.ts packages/api/src/forecast/dedupe.ts` → 0 hit).

Quan hệ dữ liệu liên feature (không phải hop tiến trình): chủ đề đã duyệt do feature này tạo được `forecast-practice` đọc (packages/api/src/routers/forecast.ts:38-84) và số báo của học viên được feature này đếm (packages/api/src/routers/forecast-admin.ts:65-78).

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Nhập nguồn thô không có caller giao diện — *(negative-search: `ingestRawFeed` trong repo, trừ node_modules · loại: dead-code-nghi / code-câm)*
* Giao diện dịch vụ AI không có bản cài đặt, router không truyền — *(negative-search: `AICurationClient|clusterAndSynthesize|rewriteWebQuestions` · loại: dead-code-nghi)*
* Nhánh dự phòng cục bộ trong màn hình khi máy khách thiếu thao tác (tạo đề giả `draft_<thời gian>`) — *(apps/web/src/features/admin/forecast-admin-screen.tsx:105-107,209-221 · loại: dead-code-nghi / fake-data)*
* Không có test cho NOT_FOUND, sửa đề đã duyệt, duyệt lại, lọc trạng thái máy chủ — *(đọc toàn bộ file test · loại: code-câm)*
* Thông điệp zod mặc định không resolve — *(thư viện ngoài, không đọc node_modules · loại: code-câm)*
* File schema biến môi trường apps/server không đọc được (hook chặn) — *(loại: nguồn thiếu)*
