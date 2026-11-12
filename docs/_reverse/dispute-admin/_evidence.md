# dispute-admin — Evidence base (truy vết code → luồng)

Số dòng đã đối chiếu bằng `sed -n`/`grep -n`. Tiền tố `S?` xem `reverse-sources.md`.

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| tRPC query | `disputeAdmin.checkAdmin` | route `/admin/disputes` (beforeLoad) | adminProcedure | Xác nhận người dùng là admin; trả `{ isAdmin: true }` | `packages/api/src/routers/dispute-admin.ts:90-92`, `apps/web/src/routes/admin/disputes.tsx:16-24` |
| tRPC query | `disputeAdmin.queue` | `DisputesScreen` (tải dữ liệu) | adminProcedure | Hàng đợi, lọc all/open/resolved, sắp theo `dueAt` tăng | `packages/api/src/routers/dispute-admin.ts:94-146`, `apps/web/src/features/admin/disputes-screen.tsx:136-139` |
| tRPC query | `disputeAdmin.getCase` | `DisputesScreen` (mở hộp thoại) | adminProcedure | Chi tiết ca + bài thi + câu trả lời + cờ nghe audio | `packages/api/src/routers/dispute-admin.ts:148-226`, `apps/web/src/features/admin/disputes-screen.tsx:166-171` |
| tRPC mutation | `disputeAdmin.resolve` | `DisputesScreen` (nút xác nhận) | adminProcedure | Chấp nhận/từ chối ca, lưu band, phản hồi | `packages/api/src/routers/dispute-admin.ts:228-288`, `apps/web/src/features/admin/disputes-screen.tsx:200-211` |
| tRPC query | `disputeAdmin.metrics` | `DisputesScreen` (tải dữ liệu) | adminProcedure | 6 số liệu vận hành | `packages/api/src/routers/dispute-admin.ts:290-336`, `apps/web/src/features/admin/disputes-screen.tsx:131-134` |
| HTTP GET | `/api/attempts/:attemptId/answers/:answerId/audio` | thẻ `<audio>` trong hộp thoại | session cookie + `canAccessAudio` | Phát audio: chủ bài, hoặc admin khi có đồng ý chia sẻ | `apps/server/src/index.ts:301-394`, `apps/web/src/features/admin/disputes-screen.tsx:497-507` |
| Cron | `0 * * * *` | — | nền tảng | Chạy kiểm tra cảnh báo sắp quá hạn | `apps/server/src/scheduled.ts:8`, `:42-55`, `packages/infra/alchemy.run.ts:61-62` |
| Cron | `*/5 * * * *` | — | nền tảng | Chỉ quét chấm điểm (không chạy cảnh báo) | `apps/server/src/scheduled.ts:14`, `:47-50` |
| Router đăng ký | `disputeAdmin` | — | — | Gắn router vào app | `packages/api/src/routers/index.ts:4`, `:25` |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| resolve.id | chuỗi, tối thiểu 1 ký tự | `min(1)` | thông điệp mặc định của thư viện ⚠️ chưa resolve | `packages/api/src/routers/dispute-admin.ts:9` | ✅ |
| resolve.status | enum 2 giá trị | `"resolved"`, `"rejected"` | ⚠️ chưa resolve | `packages/api/src/routers/dispute-admin.ts:10` | ✅ |
| resolve.resolvedBand | optional, enum 7 giá trị | `"5.0","5.5","6.0","6.5","7.0","7.5","8.0"` | ⚠️ chưa resolve | `packages/api/src/routers/dispute-admin.ts:11` | ✅ |
| resolve.previousBand | optional, chuỗi tự do | không ràng buộc định dạng | — | `packages/api/src/routers/dispute-admin.ts:12` | ✅ |
| resolve.replyText | chuỗi, trim, tối thiểu 1 | `trim().min(1, ...)` | "Nội dung trả lời không được để trống" | `packages/api/src/routers/dispute-admin.ts:13` | ✅ |
| getCase.id | chuỗi, tối thiểu 1 | `min(1)` | ⚠️ chưa resolve | `packages/api/src/routers/dispute-admin.ts:16-18` | ✅ |
| queue.status | optional object; enum all/open/resolved, mặc định "all" | `["all","open","resolved"]` | ⚠️ chưa resolve | `packages/api/src/routers/dispute-admin.ts:20-24`, `:97` | ✅ |
| ADMIN_EMAILS | danh sách ngăn dấu phẩy, trim, lowercase, bỏ rỗng | so khớp bằng tập hợp | email/danh sách rỗng → không phải admin | `packages/api/src/auth-utils.ts:1-13` | ✅ |
| Biến `ADMIN_EMAILS` | mặc định chuỗi rỗng | `Config.withDefault("")` | — | `packages/infra/alchemy.run.ts:52` | ✅ |
| Biến `SCORE_DISPUTE_ENABLED` | mặc định "false" | `Config.withDefault("false")` | — | `packages/infra/alchemy.run.ts:56` | ✅ |
| UI replyText | nút xác nhận khóa khi rỗng sau trim hoặc đang gửi | `disabled={resolving \|\| !replyText.trim()}` | — | `apps/web/src/features/admin/disputes-screen.tsx:625` | ✅ |
| UI band mới | 7 lựa chọn | `["5.0",...,"8.0"]` | — | `apps/web/src/features/admin/disputes-screen.tsx:577` | ✅ |
| UI band cũ | ô văn bản tự do, placeholder "6.0" | không kiểm tra | — | `apps/web/src/features/admin/disputes-screen.tsx:558-565` | ✅ |
| score_dispute.targetCriterion | enum | `ALL, FC, LR, GRA, PRON` | — | `packages/db/src/schema/dispute.ts:19-21` | ✅ |
| score_dispute.status | enum, mặc định "open" | `open, reviewing, resolved, rejected` | — | `packages/db/src/schema/dispute.ts:25-27` | ✅ |
| score_dispute unique | một ca đang mở/xem xét cho mỗi bài | chỉ mục duy nhất một phần `status IN ('open','reviewing')` | — | `packages/db/src/schema/dispute.ts:44-46`, `packages/db/src/migrations/20261105123206_careful_paladin/migration.sql:20` | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-dispute-admin-001 | Không có phiên | `UNAUTHORIZED` — "Authentication required" | Đăng nhập | `packages/api/src/index.ts:16-22` · test `packages/api/src/routers/dispute-admin.test.ts:103-109` | ✅ |
| E-dispute-admin-002 | Không phải admin | `FORBIDDEN` — "Admin access required" | Dùng tài khoản admin | `packages/api/src/index.ts:33-38` · test `packages/api/src/routers/dispute-admin.test.ts:95-101` | ✅ |
| E-dispute-admin-003 | getCase không thấy | `NOT_FOUND` — "Không tìm thấy hồ sơ khiếu nại" | Làm mới | `packages/api/src/routers/dispute-admin.ts:176-181` | ✅ |
| E-dispute-admin-004 | resolve không thấy | `NOT_FOUND` — "Không tìm thấy hồ sơ khiếu nại" | Làm mới | `packages/api/src/routers/dispute-admin.ts:237-242` | ✅ |
| E-dispute-admin-005 | Ca đã chấp nhận/từ chối | `BAD_REQUEST` — "Báo lỗi này đã được xử lý trước đó" | Làm mới | `packages/api/src/routers/dispute-admin.ts:244-249` · test `packages/api/src/routers/dispute-admin.test.ts:250-263` (chỉ kiểm tra mã) | ✅ |
| E-dispute-admin-006 | Chấp nhận thiếu band | `BAD_REQUEST` — "Vui lòng chọn band điểm cập nhật khi chấp nhận khiếu nại" | Chọn band | `packages/api/src/routers/dispute-admin.ts:251-256` (không có test) | ✅ |
| E-dispute-admin-007 | Xung đột đồng thời | `CONFLICT` — "Báo lỗi này đã được xử lý bởi người khác" | Làm mới | `packages/api/src/routers/dispute-admin.ts:277-282` (không có test) | ✅ |
| E-dispute-admin-008 | Phản hồi rỗng | "Nội dung trả lời không được để trống"; mã ⚠️ chưa resolve | Nhập nội dung | `packages/api/src/routers/dispute-admin.ts:13` | 🔵 |
| E-dispute-admin-009 | Đầu vào khác sai | ⚠️ chưa resolve | Sửa đầu vào | `packages/api/src/routers/dispute-admin.ts:8-24` | 🟡 |
| E-dispute-admin-010 | Audio chưa đăng nhập | HTTP 401 "Unauthorized" | Đăng nhập | `apps/server/src/index.ts:304-306` | ✅ |
| E-dispute-admin-011 | Audio bị cấm | HTTP 403 "Forbidden" | — | `apps/server/src/index.ts:318-320`, `:342-344`, `:361-363`; `packages/api/src/audio.ts:150-152` | ✅ |
| E-dispute-admin-012 | Không có câu trả lời | HTTP 404 "Not found" | — | `apps/server/src/index.ts:357-359` | ✅ |
| E-dispute-admin-013 | Không có tệp trong kho | HTTP 404 "Audio not found" | — | `packages/api/src/audio.ts:154-156`, `apps/server/src/index.ts:386-388` | ✅ |
| E-dispute-admin-014 | Kho audio chưa cấu hình | HTTP 503 "Storage unavailable" | Cấu hình kho | `apps/server/src/index.ts:365-368` | ✅ |
| E-dispute-admin-015 | UI tải dữ liệu lỗi | "Truy cập bị từ chối" / "Chỉ người sở hữu sản phẩm (admin) mới có quyền truy cập vào hàng đợi xử lý báo lỗi." | Tải lại trang | `apps/web/src/features/admin/disputes-screen.tsx:141-143`, `:234-246` · test `apps/web/src/features/admin/__tests__/disputes-screen.test.tsx:199-204` | ✅ |
| E-dispute-admin-016 | UI mở ca lỗi (không có message) | "Không thể tải chi tiết hồ sơ" | Thử lại | `apps/web/src/features/admin/disputes-screen.tsx:173` | ✅ |
| E-dispute-admin-017 | UI gửi quyết định lỗi (không có message) | "Lỗi khi xử lý báo lỗi" | Thử lại | `apps/web/src/features/admin/disputes-screen.tsx:217` | ✅ |
| E-dispute-admin-018 | Cron lỗi | log "[scheduled] Error processing scheduled event:" | Lần chạy sau | `apps/server/src/scheduled.ts:21` · test `apps/server/src/scheduled.test.ts:46-50` | ✅ |
| E-dispute-admin-019 | Hàng đợi rỗng | "Không có báo lỗi nào trong hàng đợi." | — | `apps/web/src/features/admin/disputes-screen.tsx:346-349` | ✅ |
| E-dispute-admin-020 | Quá nhiều ca khi cảnh báo | không có wording; giới hạn tham số CSDL chưa xác định | — | `packages/api/src/disputes/overdue.ts:44-59` | 🟡 |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Ngưỡng cảnh báo sắp quá hạn | cron và hàng đợi | 12 x 3600 x 1000 ms | có (`packages/api/src/disputes/overdue.test.ts:30-136`) cho cron; hàng đợi có 1 ca 10 giờ (`packages/api/src/routers/dispute-admin.test.ts:172-200`) | `packages/api/src/disputes/overdue.ts:5`, `packages/api/src/routers/dispute-admin.ts:136`, `:313` | ✅ |
| Biên cron: đúng 12 giờ được cảnh báo, +1 giây thì không | cron | `lte(dueAt, now+12h)` | có (`packages/api/src/disputes/overdue.test.ts:96-136`) | `packages/api/src/disputes/overdue.ts:33` | ✅ |
| Cảnh báo không lặp | cron | cập nhật có `isNull(warnedAt)` | có (`packages/api/src/disputes/overdue.test.ts:90-93`) | `packages/api/src/disputes/overdue.ts:31`, `:53-58` | ✅ |
| Loại ca đã xử lý khỏi cảnh báo | cron | status open/reviewing và `resolvedAt` null | có (`packages/api/src/disputes/overdue.test.ts:67-83` ca disp_ovd_3 không bị cảnh báo) | `packages/api/src/disputes/overdue.ts:29-32` | ✅ |
| isNearOverdue | queue | `warnedAt` hoặc `dueAt - now < 12h` | có một phần (`packages/api/src/routers/dispute-admin.test.ts:198-199`) | `packages/api/src/routers/dispute-admin.ts:134-136` | ✅ |
| isOverdue | queue | `dueAt < now` | không | `packages/api/src/routers/dispute-admin.ts:137` | ✅ |
| Sắp theo dueAt tăng | queue | `asc(dueAt)` | có (`packages/api/src/routers/dispute-admin.test.ts:194-196`) | `packages/api/src/routers/dispute-admin.ts:130` | ✅ |
| Lọc open/resolved | queue | open → {open, reviewing}; resolved → {resolved, rejected} | không | `packages/api/src/routers/dispute-admin.ts:100-105` | ✅ |
| Audio chỉ cấp URL khi có đồng ý | getCase | `audioPlayable = audioUrl != null = shareConsent` | có (`packages/api/src/routers/dispute-admin.test.ts:204-220`) | `packages/api/src/routers/dispute-admin.ts:210-224` | ✅ |
| Quyền tải audio | audio route | owner → true; admin && consent === true → true; else false | có (`packages/api/src/auth-utils.test.ts:35-114`) | `packages/api/src/auth-utils.ts:23-37` | ✅ |
| Đồng ý chia sẻ lấy từ ca mới nhất của bài | audio route | `orderBy desc(createdAt) limit 1`; chỉ khi người tải không phải chủ | không | `apps/server/src/index.ts:322-331` | ✅ |
| Chỉ xử lý ca open/reviewing | resolve | kiểm tra trước + điều kiện ghi | có một phần (`packages/api/src/routers/dispute-admin.test.ts:250-263`, chỉ mã BAD_REQUEST) | `packages/api/src/routers/dispute-admin.ts:244-249`, `:269-275` | ✅ |
| Chấp nhận cần band | resolve | `status === "resolved" && !resolvedBand` | không | `packages/api/src/routers/dispute-admin.ts:251-256` | ✅ |
| Từ chối đặt band null | resolve | `resolvedBand = status==="resolved" ? band : null` | không | `packages/api/src/routers/dispute-admin.ts:263` | ✅ |
| Band cũ fallback | resolve | `input ?? existing ?? null` | có (`packages/api/src/routers/dispute-admin.test.ts:236-237`, nhánh input) | `packages/api/src/routers/dispute-admin.ts:264` | ✅ |
| Đúng hạn | metrics | `resolvedAt(0 nếu null) <= dueAt` | không (chỉ `>= 0`) | `packages/api/src/routers/dispute-admin.ts:306-310` | ✅ |
| Tỷ lệ đúng hạn | metrics | làm tròn 1 chữ số; 100 nếu chưa có ca đã xử lý | không (chỉ `>= 0`, `packages/api/src/routers/dispute-admin.test.ts:271`) | `packages/api/src/routers/dispute-admin.ts:323-326` | ✅ |
| Ca tuần | metrics | 7 x 24 x 3600 x 1000 ms | một phần (`>= 2`, `packages/api/src/routers/dispute-admin.test.ts:272`) | `packages/api/src/routers/dispute-admin.ts:293`, `:318-320` | ✅ |
| Định tuyến cron | scheduled | 5 phút → chỉ sweep; giờ → chỉ dispute; khác → cả hai | có (`apps/server/src/scheduled.test.ts:28-44`) | `apps/server/src/scheduled.ts:47-54` | ✅ |
| Cron khớp hạ tầng | triển khai | `"0 * * * *"`, `"*/5 * * * *"` | có (`apps/server/src/scheduled.test.ts:52-56`) | `apps/server/src/scheduled.ts:8`, `:14`, `packages/infra/alchemy.run.ts:62` | ✅ |
| Chuyển trạng thái ca | resolve | open/reviewing → resolved/rejected (một chiều) | có một phần | `packages/api/src/routers/dispute-admin.ts:259-275` | ✅ |
| Thời điểm xử lý đặt cùng `updatedAt` | resolve | `now` | có một phần (`defined`, `packages/api/src/routers/dispute-admin.test.ts:239`) | `packages/api/src/routers/dispute-admin.ts:258`, `:266-267` | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| score_dispute | tiêu chí, band kỳ vọng, lý do, đồng ý chia sẻ, trạng thái, hạn xử lý, band cũ/mới, phản hồi, thời điểm xử lý/cảnh báo/tạo/sửa | thuộc bài thi (xóa dây chuyền), thuộc người dùng (xóa dây chuyền) | `packages/db/src/schema/dispute.ts:7-38` |
| attempt | chế độ, trạng thái, giờ bắt đầu/nộp | 1-N câu trả lời | `packages/api/src/routers/dispute-admin.ts:183-193` |
| attempt_answer | khóa câu hỏi, nội dung câu hỏi, phần thi, thứ tự, khóa audio, thời lượng, loại tệp, transcript | thuộc bài thi | `packages/db/src/schema/attempt.ts:32-57` |
| user | tên, email | 1-N ca | `packages/api/src/routers/dispute-admin.ts:112-113`, `:128` |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Trình duyệt `apps/web` hộp thoại ca | máy chủ API tRPC | gọi query/mutation | xem hàng đợi, chi tiết, xử lý, số liệu | `apps/web/src/features/admin/disputes-screen.tsx:131-171`, `:200-211` · `packages/api/src/routers/dispute-admin.ts:89-337` |
| Thẻ `<audio>` trong trình duyệt | máy chủ `apps/server` (HTTP) | GET tệp, cookie đăng nhập | nghe audio theo đồng ý | `apps/web/src/features/admin/disputes-screen.tsx:497-507` · `apps/server/src/index.ts:301-394` |
| Máy chủ `apps/server` | kho R2 `AUDIO_BUCKET` | đọc đối tượng (có Range) | nghe audio | `apps/server/src/index.ts:365-373` |
| Máy chủ / API | D1 (SQLite) | đọc/ghi bảng ca, bài, câu trả lời, người dùng | mọi luồng | `packages/api/src/routers/dispute-admin.ts:107-130`, `:259-275` |
| Cron của nền tảng (Cloudflare) | `handleScheduled` trong `apps/server` | sự kiện lịch | cảnh báo sắp quá hạn | `packages/infra/alchemy.run.ts:61-62` · `apps/server/src/index.ts:403` (`scheduled: handleScheduled`) · `apps/server/src/scheduled.ts:42-55` |
| `apps/server` (cron) | `packages/api` (hàm kiểm tra) | gọi hàm dùng chung trong cùng tiến trình | cảnh báo | `apps/server/src/scheduled.ts:1`, `:18` · `packages/api/src/disputes/overdue.ts:16-65` |
| Feature `score-dispute` (học viên) | feature này | ghi bảng ca → admin đọc | điểm bàn giao: tạo ca, hạn 72 giờ, đồng ý chia sẻ | `packages/api/src/routers/dispute.ts:82-100` · `packages/api/src/routers/dispute-admin.ts:107-130` |
| Feature này | màn kết quả học viên | ghi trạng thái ca → học viên đọc | điểm bàn giao: huy hiệu, `replyText`/`resolvedBand` có trong dữ liệu ca nhưng màn kết quả chỉ hiện huy hiệu | `packages/api/src/routers/dispute-admin.ts:259-268` · `apps/web/src/features/results/results-screen.tsx:329-338` |

(Tất cả hop nằm trong cùng monorepo `vox-flow`; không có repo ngoài. Có 8 hop xuyên tiến trình/thành phần.)

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Điểm chính thức của bài thi có đổi sau khi chấp nhận không — *(negative-search N1: `resolvedBand` trong `apps/`, `packages/`; loại: code-câm)*
* Không có kênh thông báo — *(N2: `notify|email|webhook|send` trong `packages/api/src/disputes/`; loại: code-câm)*
* Trạng thái `reviewing` không có chỗ đặt — *(N4; loại: dead-code-nghi)*
* Chi tiết ca không trả transcript/điểm AI — *(đọc `dispute-admin.ts:195-209` so với `attempt.ts:51`; loại: code-câm)*
* Không có test cho nhánh CONFLICT, thiếu band, từ chối, bộ lọc, số liệu chính xác — *(đọc 6 file test; loại: test-thiếu)*
* Không có `it.skip/todo` — *(N9)*
* Kiểm tra giá trị cờ tắt: `SCORE_DISPUTE_ENABLED` không ảnh hưởng admin — *(N5; loại: cờ)*
