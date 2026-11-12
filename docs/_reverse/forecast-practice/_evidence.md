# forecast-practice — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| query | forecast.listPublished | SCR-01 `/app/forecast` | công khai (không cần phiên) | Danh sách chủ đề đã đăng, kèm số thí sinh báo gặp | packages/api/src/routers/forecast.ts:28-85 · apps/web/src/features/forecast/forecast-screen.tsx:33 |
| mutation | forecast.reportTopic | không có màn gọi | cần phiên (UNAUTHORIZED nếu thiếu) | Báo đã gặp chủ đề, lũy đẳng | packages/api/src/routers/forecast.ts:87-135 · packages/api/src/index.ts:15-24 |
| mutation | attempt.start | phòng thi `/exam` (bàn giao mock-exam) | cần phiên + cổng pilot | Mở lượt thi gắn chủ đề và khóa câu | packages/api/src/routers/attempt.ts:23-125 · apps/web/src/features/exam/use-exam-session.ts:160-166 |
| route | /app/forecast | SCR-01 | phiên + onboarding | Hiển thị màn | apps/web/src/routes/_proto/app/forecast.tsx:5-7 · apps/web/src/routes/_proto/app/route.tsx:6-9 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| listPublished.quarter | chuỗi, tùy chọn | không giới hạn độ dài | — | packages/api/src/routers/forecast.ts:32 | ✅ |
| listPublished.part | số nguyên, tùy chọn | min 1, max 3 | lỗi kiểm tra dữ liệu vào (⚠️ chưa resolve câu chữ) | packages/api/src/routers/forecast.ts:33 | ✅ |
| listPublished input | toàn bộ tham số tùy chọn | có thể bỏ trống | — | packages/api/src/routers/forecast.ts:29-36 | ✅ |
| reportTopic.topicId | chuỗi bắt buộc | không giới hạn độ dài | lỗi kiểm tra dữ liệu vào (⚠️ chưa resolve câu chữ) | packages/api/src/routers/forecast.ts:90 | ✅ |
| reportTopic.notes | chuỗi tùy chọn | không có max | — | packages/api/src/routers/forecast.ts:91 | ✅ |
| forecast_topic.status | enum | draft, published, archived; mặc định draft | — | packages/db/src/schema/forecast.ts:16-18 | ✅ |
| forecast_topic.part | integer không null | mặc định 1 | — | packages/db/src/schema/forecast.ts:14 | ✅ |
| forecast_topic.questions | text không null | mặc định "[]" | — | packages/db/src/schema/forecast.ts:15 | ✅ |
| forecast_report (user, topic) | duy nhất | chỉ số duy nhất | ghi trùng bị bỏ qua | packages/db/src/schema/forecast.ts:78 · packages/api/src/routers/forecast.ts:132 | ✅ |
| attempt.start.topicId / questionKey | regex định dạng; khóa cần chủ đề | thông điệp "Invalid topicId format", "Invalid questionKey format", "questionKey requires topicId" | BAD_REQUEST | packages/api/src/routers/attempt.ts:26-35 | ✅ |
| Số bước phiên cả chủ đề | không quá min(số khóa hợp lệ, 18) | 18 | test đỏ | apps/web/src/features/forecast/__tests__/keys-parity.test.ts:97-103 | ✅ |
| Ngưỡng nhãn "Hay gặp" | số báo >= 200 | 200 | — | apps/web/src/features/forecast/builders.ts:48 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-forecast-practice-001 | báo gặp không có phiên | UNAUTHORIZED · "Authentication required" | đăng nhập | packages/api/src/index.ts:16-21 | ✅ |
| E-forecast-practice-002 | báo gặp chủ đề không có/chưa đăng | NOT_FOUND · "Published forecast topic not found" | chọn chủ đề đã đăng | packages/api/src/routers/forecast.ts:101-105 | ✅ |
| E-forecast-practice-003 | part ngoài 1..3 | BAD_REQUEST (⚠️ chưa resolve câu chữ) | sửa tham số | packages/api/src/routers/forecast.ts:33 | ✅ |
| E-forecast-practice-004 | báo gặp sai kiểu | BAD_REQUEST (⚠️ chưa resolve câu chữ) | sửa tham số | packages/api/src/routers/forecast.ts:89-92 | ✅ |
| E-forecast-practice-005 | tải danh sách lỗi | "Không thể tải danh sách đề forecast" + câu lỗi hoặc "Lỗi kết nối máy chủ" + nút "Thử lại" | thử lại | apps/web/src/features/forecast/forecast-screen.tsx:213-224 | ✅ |
| E-forecast-practice-006 | rỗng sau lọc | "Không có chủ đề nào khớp bộ lọc." | xem tất cả | apps/web/src/features/forecast/forecast-screen.tsx:246-251 | ✅ |
| E-forecast-practice-007 | rỗng khi tìm | `Không tìm thấy chủ đề nào cho "<q>". Thử tìm kiếm với từ khóa khác.` | đổi từ khóa | apps/web/src/features/forecast/forecast-screen.tsx:256 | ✅ |
| E-forecast-practice-008 | "Đã lưu" rỗng | "Chưa có chủ đề nào được lưu" | lưu chủ đề | apps/web/src/features/forecast/forecast-screen.tsx:249 | ✅ |
| E-forecast-practice-009 | quý chưa có chủ đề | không có thông báo riêng | chờ đăng | packages/api/src/routers/forecast.ts:52-54 | 🟡 |
| E-forecast-practice-010 | cổng pilot đóng | FORBIDDEN · "Mock exam is currently restricted to pilot candidates." | xin vào danh sách | packages/api/src/routers/attempt.ts:53-56 | ✅ |
| E-forecast-practice-011 | chủ đề luyện không có/chưa đăng | BAD_REQUEST · "Unknown or unpublished forecast topic" | chọn chủ đề khác | packages/api/src/routers/attempt.ts:71-76 | ✅ |
| E-forecast-practice-012 | khóa câu sai chủ đề | BAD_REQUEST · "Invalid questionKey for topic" | chọn lại câu | packages/api/src/routers/attempt.ts:79-84 | ✅ |
| E-forecast-practice-013 | sai định dạng/khóa thiếu chủ đề | BAD_REQUEST · "Invalid topicId format" / "Invalid questionKey format" / "questionKey requires topicId" | sửa tham số | packages/api/src/routers/attempt.ts:26-35 | ✅ |
| E-forecast-practice-014 | nội dung chủ đề hỏng | không lỗi, 0 câu | quản trị sửa | packages/api/src/forecast/questions.ts:59-61 | 🟡 |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Chỉ chủ đề đã đăng | liệt kê/báo/mở lượt | status = published | có (packages/api/src/routers/forecast-admin.test.ts:281-295) | packages/api/src/routers/forecast.ts:38 | ✅ |
| Đếm học viên khác nhau | trả danh sách | countDistinct userId | có (packages/api/src/routers/forecast-admin.test.ts:219-267) | packages/api/src/routers/forecast.ts:56-69 | ✅ |
| Nhãn Hay gặp | ánh xạ | 200 | không trực tiếp (xem N10) | apps/web/src/features/forecast/builders.ts:48 | ✅ |
| Nhãn Mới chỉ Part 2 và 3 | ánh xạ | hot thắng new | một phần (slice-b.test.tsx:158-171) | apps/web/src/features/forecast/builders.ts:72-77 | ✅ |
| Báo gặp lũy đẳng | báo | alreadyReported | có (forecast-admin.test.ts:239-245) | packages/api/src/routers/forecast.ts:119-134 | ✅ |
| Quý cố định | mở màn | "2026-Q3" | có (state-and-data.test.ts:45-52) | apps/web/src/features/forecast/data.ts:8-13 | ✅ |
| Độ phủ và gợi ý mỗi ngày | hiển thị | ceil(còn lại / max(ngày,1)), tối thiểu 1 | không | apps/web/src/features/forecast/components/coverage-banner.tsx:41-44 | ✅ |
| Cổng pilot | mở lượt thi | LAUNCH_OPEN, LAUNCH_ALLOWED_EMAILS | không thấy test trong phạm vi đọc | packages/api/src/routers/attempt.ts:43-56 | ✅ |
| Khóa câu hỏi | mở lượt/phiên | -c, -p3-i, -i, -f | có (forecast-keys.test.ts:69-160; keys-parity.test.ts:71-104) | packages/api/src/scoring/forecast-keys.ts:81-95 | ✅ |
| Tiến độ đã luyện không có nguồn ghi | mở màn | — | không | apps/web/src/features/app-state/initial-state.ts:16-17 | 🟡 |
| Transition trạng thái chủ đề (phía quản trị) | publish/archive | draft → published, archived | có (forecast-admin.test.ts:182-215) | packages/api/src/routers/forecast-admin.ts:276-362 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| Chủ đề dự đoán (forecast_topic) | title, quarter, part, questions, status, reviewedBy, reviewedAt | 1 chủ đề có nhiều nguồn, nhiều báo gặp; người duyệt là user (set null khi xóa) | packages/db/src/schema/forecast.ts:6-36 |
| Báo gặp (forecast_report) | topicId, userId, notes, createdAt | thuộc chủ đề và học viên (cascade); duy nhất theo cặp | packages/db/src/schema/forecast.ts:60-82 |
| Nguồn chủ đề (forecast_source) | sourceType, sourceUrl, rawContent | thuộc chủ đề (cascade) | packages/db/src/schema/forecast.ts:38-58 |
| Lượt thi (attempt) | topicId, questionKey | liên kết lỏng (không khóa ngoại) | packages/db/src/schema/attempt.ts:22-23 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Màn forecast (trình duyệt) | API danh sách | gọi tRPC (đọc) | Xem, lọc chủ đề | apps/web/src/features/forecast/forecast-screen.tsx:33 · packages/api/src/routers/forecast.ts:28 |
| API danh sách | D1 (forecast_topic, forecast_report) | đọc | Xem, lọc chủ đề | packages/api/src/routers/forecast.ts:46-64 |
| Màn forecast | phòng thi (state phiên luyện + điều hướng) | ghi state, đổi route | Luyện chủ đề/câu | apps/web/src/features/forecast/forecast-screen.tsx:100-120 · apps/web/src/features/exam/use-exam-session.ts:83-100 |
| Phòng thi | API mở lượt thi | gọi tRPC (ghi) | Luyện chủ đề/câu | apps/web/src/features/exam/use-exam-session.ts:160-166 · packages/api/src/routers/attempt.ts:23 |
| API mở lượt thi | D1 (forecast_topic, attempt) | đọc chủ đề, ghi lượt | Luyện chủ đề/câu | packages/api/src/routers/attempt.ts:61-112 |
| Phòng thi | màn chấm (state + route) | ghi state, đổi route | Nộp bài luyện | apps/web/src/features/exam/exam-screen.tsx:133-139 |
| forecast-curation (quản trị) | D1 forecast_topic | ghi status published | Chủ đề xuất hiện | packages/api/src/routers/forecast-admin.ts:276-320 · packages/api/src/routers/forecast.ts:38 |
| Trang kết quả | màn forecast (reopenTopicId) | ghi state, đổi route | Quay lại chủ đề (🟡 không có phiên cuối) | apps/web/src/features/results/results-screen.tsx:349-361 · apps/web/src/features/forecast/forecast-screen.tsx:40-49 |

Hop chéo tiến trình: trình duyệt ↔ Worker API ↔ D1 (3 hop mạng); ngoài ra các hop trong trình duyệt. Không có queue, cron, R2 trong phạm vi đọc của feature này.

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Báo gặp không có người gọi phía web — *(negative-search N1 · loại: dead-code-nghi)*
* Không có nơi ghi tiến độ đã luyện — *(N2 · code-câm / dead-code-nghi)*
* Không có nơi đặt phiên luyện cuối nên "Quay lại chủ đề"/"Luyện câu kế tiếp" không hiện ở production — *(N3 · dead-code-nghi)*
* Không có cờ riêng cho forecast; không có kiểm tra gói/hạn mức — *(N4, N6 · code-câm)*
* Dòng "câu hỏi nối tiếp" không bao giờ hiện với dữ liệu thật — *(N7 · dead-code-nghi)*
* Quý và nhãn gắn cứng, "Gặp gần nhất" luôn "Gần đây" — *(N9, S7:59,86 · dữ liệu prototype/fake)*
* Hàm dựng chủ đề mẫu cũ (builders.ts:9-36) chỉ dùng trong test — *(grep `p1(` ngoài builders.ts: chỉ apps/web/src/features/app-state/__tests__/state-and-data.test.ts · dead-code-nghi)*
* Không có test skip/todo — *(N8)*
