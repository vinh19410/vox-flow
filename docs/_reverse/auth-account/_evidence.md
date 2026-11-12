# auth-account — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| GET, POST | `/api/auth/*` (thư viện xác thực xử lý các đường con: sign-up/email, sign-in/email, sign-in/social, sign-out, get-session, update-user, callback/google) | `/auth` (đăng ký, đăng nhập, Google), mọi guard (hỏi phiên), đăng xuất, hồ sơ (cập nhật ảnh) | công khai tới khi có phiên; cookie phiên cho get-session/sign-out/update-user | Toàn bộ vòng đời xác thực | apps/server/src/index.ts:50 · apps/web/src/lib/auth-client.ts:5-6 |
| (tên đường con suy từ test) POST | `/api/auth/sign-in/email` | test gọi trực tiếp handler | công khai | Đăng nhập email, trả Set-Cookie chứa `session_token=` | packages/api/src/test/auth.test.ts:145-160 |
| (client) | `authClient.signUp.email`, `authClient.signIn.email`, `authClient.signIn.social`, `authClient.signOut`, `authClient.getSession`, `authClient.useSession` | `/auth`, hook đăng xuất, guard | — | Các lời gọi client phía web | apps/web/src/features/auth/auth-screen.tsx:102,127-128 · apps/web/src/hooks/use-sign-out.ts:17 · apps/web/src/lib/auth-guard.ts:25 · apps/web/src/routes/_proto/route.tsx:31 |
| tRPC query | `privateData` (protectedProcedure) | (chỉ dùng trong test API sau khi gỡ legacy ở #134) | phiên | Kiểm chứng thủ tục riêng tư trả thông điệp và user hiện tại | packages/api/src/routers/index.ts:15-20 · packages/api/src/routers/index.test.ts:20-40 |
| tRPC query | `disputeAdmin.checkAdmin`, `forecastAdmin.checkAdmin` (adminProcedure) | `/admin/disputes`, `/admin/forecast` | phiên + admin | Cho biết người gọi là admin | packages/api/src/routers/dispute-admin.ts:90 · packages/api/src/routers/forecast-admin.ts:17 · apps/web/src/routes/admin/disputes.tsx:17-18 · apps/web/src/routes/admin/forecast.tsx:17-18 |
| tRPC query | `profile.get` | Guard onboarding | phiên | Đọc `onboardedAt` | apps/web/src/lib/auth-guard.ts:49 |
| POST | `/api/attempts/:attemptId/answers/:questionKey/audio` | ghi âm (mock-exam) | phiên (401 nếu thiếu) | Tham chiếu: kiểm tra phiên | apps/server/src/index.ts:79-84 |
| GET | `/api/attempts/:attemptId/answers/:answerId/audio` | nghe lại (mock-exam) | phiên (401 nếu thiếu) | Tham chiếu: kiểm tra phiên | apps/server/src/index.ts:301-306 |
| Route web | `/auth` | màn hình đăng nhập/đăng ký | công khai (chuyển hướng nếu đã onboard và không có `?error=`) | Hiển thị AuthScreen, nhận `error`, `redirect`, gọi `redirectIfOnboarded` | apps/web/src/routes/_proto/auth.tsx:6-28 · apps/web/src/lib/auth-guard.ts:77-105 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| Email (`/auth`) | bắt buộc, kiểu email | `required`, `type="email"` | câu chữ HTML5 gốc theo trình duyệt | apps/web/src/features/auth/auth-screen.tsx:221-225 | ✅ |
| Mật khẩu (`/auth`, đăng ký) | bắt buộc, tối thiểu 8 | `minLength` = 8 chỉ khi đăng ký; đăng nhập không đặt | câu chữ HTML5 gốc theo trình duyệt | apps/web/src/features/auth/auth-screen.tsx:239-240 | ✅ |
| Tên hiển thị (`/auth` & máy chủ) | bắt buộc; dài `1..50` sau `trim()` | `required`, `maxLength=50` ở UI; `MAX_USER_NAME_LENGTH = 50` ở hook máy chủ | `INVALID_NAME` → `"Tên hiển thị không hợp lệ (1–50 ký tự)."` | apps/web/src/features/auth/auth-screen.tsx:48-50,208-209 · packages/auth/src/name-validation.ts:8,16-28 | ✅ |
| Email (`/auth`) | cắt khoảng trắng | `email.trim()` | — | apps/web/src/features/auth/auth-screen.tsx:124 | ✅ |
| Redirect (`/auth`) | chuỗi, nội bộ, an toàn | bắt đầu "/", không "//", không "/\", không "/auth", không "/login" | bị bỏ, dùng đích mặc định | apps/web/src/features/auth/auth-screen.tsx:27-39 | ✅ |
| Redirect (route `/auth`) | phải là chuỗi | không phải chuỗi → undefined | bỏ giá trị | apps/web/src/routes/_proto/auth.tsx:14-15 | ✅ |
| Error (route `/auth`) | chuỗi hoặc mảng chuỗi (lấy phần tử đầu) | — | bỏ giá trị | apps/web/src/routes/_proto/auth.tsx:7-13 | ✅ |
| Ảnh đại diện (user.image) | độ dài tối đa | `MAX_USER_IMAGE_LENGTH` = 32000 (so sánh lớn hơn) | `INVALID_IMAGE` | packages/auth/src/image-validation.ts:8,24 | ✅ |
| Ảnh đại diện | định dạng data URL | `^data:image/(webp|jpeg|png);base64,` | `INVALID_IMAGE` | packages/auth/src/image-validation.ts:10,27 | ✅ |
| Ảnh đại diện | kiểu giá trị | chuỗi không rỗng; `null` = xóa; `undefined` = giữ | `INVALID_IMAGE` | packages/auth/src/image-validation.ts:20-23 | ✅ |
| Ảnh đại diện | https hoặc `/avatars/` | `startsWith("https://")`, `startsWith("/avatars/")` | `INVALID_IMAGE` nếu khác | packages/auth/src/image-validation.ts:26-30 | ✅ |
| Email (CSDL) | duy nhất | unique | USER_ALREADY_EXISTS (422) | packages/db/src/schema/auth.ts:7 · packages/api/src/test/auth.test.ts:280-283 | ✅ |
| ADMIN_EMAILS | danh sách phân tách phẩy, trim, thường hóa | — | không phải admin | packages/api/src/auth-utils.ts:6-12 | ✅ |
| Mật khẩu (máy chủ) | độ dài `8..128`, băm `scrypt` | `minPasswordLength: 8`, `maxPasswordLength: 128` | `PASSWORD_TOO_SHORT` / `PASSWORD_TOO_LONG` (400) | packages/auth/src/index.ts:86-88 | ✅ |
| Giới hạn tốc độ (`rateLimit`) | `/sign-in*`, `/sign-up*` và chung | `3 lần/10s` (auth) / `100 lần/10s` (chung), `storage: "memory"`, `ipAddressHeaders: ["cf-connecting-ip"]` | HTTP `429` | packages/auth/src/index.ts:89-94,114-116 · packages/api/src/test/auth.test.ts:349-386 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-auth-account-001 | `INVALID_EMAIL_OR_PASSWORD` | Sai email hoặc mật khẩu. | Gửi lại | apps/web/src/features/auth/auth-screen.tsx:42 · test packages/api/src/test/auth.test.ts:217-220 | ✅ |
| E-auth-account-002 | mã bắt đầu `USER_ALREADY_EXISTS` | Email đã được sử dụng. | Đổi email | apps/web/src/features/auth/auth-screen.tsx:43 · test packages/api/src/test/auth.test.ts:251-254 | ✅ |
| E-auth-account-003 | mã khác, chế độ đăng nhập | Đăng nhập không thành công. Vui lòng thử lại. | Thử lại | apps/web/src/features/auth/auth-screen.tsx:45 | ✅ |
| E-auth-account-004 | mã khác, chế độ đăng ký | Đăng ký không thành công. Vui lòng thử lại. | Thử lại | apps/web/src/features/auth/auth-screen.tsx:46 | ✅ |
| E-auth-account-005 | ngoại lệ mạng | Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau. | Thử lại sau | apps/web/src/features/auth/auth-screen.tsx:114,141 | ✅ |
| E-auth-account-006 | Google trả lỗi ngay | Đăng nhập Google không thành công. Vui lòng thử lại. | Thử lại | apps/web/src/features/auth/auth-screen.tsx:110 | ✅ |
| E-auth-account-007 | `error` khác `account_not_linked` | Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại. | Thử lại | apps/web/src/features/auth/auth-screen.tsx:88 | ✅ |
| E-auth-account-008 | `error` = `account_not_linked` | Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu. | Đăng nhập email | apps/web/src/features/auth/auth-screen.tsx:86 | ✅ |
| E-auth-account-009 | đăng xuất lỗi | Đăng xuất thất bại. Vui lòng thử lại. | Bấm lại | apps/web/src/hooks/use-sign-out.ts:8,22 | ✅ |
| E-auth-account-010 | UNAUTHORIZED | Authentication required (cause: No session) | Đăng nhập | packages/api/src/index.ts:17-21 | ✅ |
| E-auth-account-011 | FORBIDDEN | Admin access required | Dùng tài khoản admin | packages/api/src/index.ts:34-37 | ✅ |
| E-auth-account-012 | BAD_REQUEST | `INVALID_IMAGE` (UI hiển thị thuộc `onboarding-profile`) | Chọn ảnh hợp lệ | packages/auth/src/index.ts:47-54 | ✅ |
| E-auth-account-013 | thiếu phiên ở điểm audio | `{"error":"Unauthorized"}` (tải lên, 401) · `Unauthorized` (tải xuống, 401) | Đăng nhập | apps/server/src/index.ts:83,305 · apps/server/src/index.test.ts:151,830 | ✅ |
| E-auth-account-014 | kiểm tra gốc trình duyệt | Câu chữ HTML5 do trình duyệt sinh theo ngôn ngữ máy người dùng | Sửa trường | apps/web/src/features/auth/auth-screen.tsx:208-241 | ✅ |
| E-auth-account-015 | HTTP `429` (rate-limit) | Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây. | Chờ ít giây rồi thử lại | apps/web/src/features/auth/auth-screen.tsx:45,119-121 | ✅ |
| E-auth-account-016 | BAD_REQUEST `INVALID_NAME` | Tên hiển thị không hợp lệ (1–50 ký tự). | Nhập tên 1..50 ký tự | packages/auth/src/index.ts:35-41 · apps/web/src/features/auth/auth-screen.tsx:48-50 | ✅ |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Đích mặc định đăng nhập | đăng nhập thành công | `/app/dashboard` | có (apps/web/src/features/__tests__/slice-a.test.tsx:501-503) | apps/web/src/features/auth/auth-screen.tsx:20,73 | ✅ |
| Đích mặc định đăng ký | đăng ký thành công | `/onboarding` | có (apps/web/src/features/__tests__/slice-a.test.tsx:582-586) | apps/web/src/features/auth/auth-screen.tsx:21,74 | ✅ |
| Chống open redirect | mọi nơi dùng redirect | tiền tố bị chặn: `//`, `/\`, `/auth`, `/login` | có (slice-a.test.tsx:612-643,700-717) · chưa có test cho `/\`, `/auth`, `/login` | apps/web/src/features/auth/auth-screen.tsx:27-39 | ✅ |
| Tự đăng nhập sau đăng ký | đăng ký | `autoSignIn: true` | có (packages/api/src/test/auth.test.ts:59-65) | packages/auth/src/index.ts:36 | ✅ |
| Cookie phiên | mọi phản hồi cấp phiên | SameSite=None, Secure, HttpOnly | có (packages/api/src/test/auth.test.ts:157-164) | packages/auth/src/index.ts:117-121 | ✅ |
| Origin tin cậy | mọi yêu cầu auth | `CORS_ORIGIN` bỏ "/" cuối (đã gỡ `desktopOrigins` ở #134) | có (packages/api/src/test/auth.test.ts:41-42) | packages/auth/src/index.ts:68,82 | ✅ |
| Hook ảnh chỉ khi có trường image | tạo/cập nhật user | `"image" in data` | có (packages/api/src/test/auth.test.ts:133-193) | packages/auth/src/index.ts:50,62 | ✅ |
| Ảnh Google https được nhận | đăng ký có ảnh | https | có (packages/api/src/test/auth.test.ts:89-102) | packages/auth/src/image-validation.ts:26 | ✅ |
| Admin theo email | thủ tục quản trị | ADMIN_EMAILS (mặc định rỗng) | có (packages/api/src/auth-utils.test.ts:5-24) | packages/api/src/auth-utils.ts:1-13 · packages/infra/alchemy.run.ts:52 | ✅ |
| Quyền audio | truy cập audio | chủ luôn được; admin khi `disputeShareConsent === true` | có (packages/api/src/auth-utils.test.ts:35-109) | packages/api/src/auth-utils.ts:23-37 | ✅ |
| Guard phiên → /auth | route bảo vệ | `to: "/auth"`, search `{ redirect }` nếu có | có (apps/web/src/lib/__tests__/auth-guard.test.ts:24-74) | apps/web/src/lib/auth-guard.ts:24-33 | ✅ |
| Guard onboarding → /onboarding | `/app`, `/exam`, `/scoring` | `onboardedAt` rỗng | có (route-guards.test.ts:59-81) | apps/web/src/lib/auth-guard.ts:50-56 | ✅ |
| Cache onboarding | lần vào sau | Set theo userId, chỉ lưu dương | có (auth-guard.test.ts:188-215) | apps/web/src/lib/auth-guard.ts:10,45-47,57-59 | ✅ |
| Fail-open | lỗi hồ sơ | cho qua, `console.warn` | có (auth-guard.test.ts:217-237) | apps/web/src/lib/auth-guard.ts:62-67 | ✅ |
| Đăng xuất | bấm Đăng xuất | xóa `vox-flow-proto-state-v3` + `clearOnboardedUserCache()`; đích `/auth` | có (use-sign-out.test.tsx:37-100) | apps/web/src/hooks/use-sign-out.ts:26-33 | ✅ |
| Reset state khi mất user | phiên không còn | giữ mode, voice | có (onboarding-route.test.ts:132) | apps/web/src/features/app-state/use-profile-hydration.ts:33-40 | ✅ |
| Admin web guard | `/admin/*` | thiếu phiên → `/auth`; lỗi kiểm tra → `/app/dashboard` | có (route-guards.test.ts:280-375) | apps/web/src/routes/admin/disputes.tsx:9-27 · apps/web/src/routes/admin/forecast.tsx:9-27 | ✅ |
| Onboarding đã xong → dashboard | `/onboarding` & `/auth` (khi không có `?error=`) | `onboardedAt` có → `/app/dashboard` (hoặc `safeRedirect` ở `/auth`); hoàn tất gọi `markUserOnboarded` | có (onboarding-route.test.ts:47 · route-guards.test.ts:165-270 · auth-guard.test.ts:240-360) | apps/web/src/routes/_proto/onboarding.tsx:14-17 · apps/web/src/routes/_proto/auth.tsx:19-22 · apps/web/src/features/onboarding/onboarding-screen.tsx:27-34 | ✅ |
| State: phiên (đăng nhập/đăng xuất/mất phiên) | — | hạn `7 ngày`, gia hạn trượt `24 giờ` (xem srs/auth-account-reverse-states.md) | có | packages/auth/src/index.ts · apps/web/src/routes/_proto/route.tsx:30-35 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| user | id, name, email (unique), emailVerified (mặc định false), image, createdAt, updatedAt | 1–n session, 1–n account | packages/db/src/schema/auth.ts:4-17,88-98 |
| session | id, token (unique), expiresAt, ipAddress, userAgent, userId | n–1 user (cascade) | packages/db/src/schema/auth.ts:19-38,99-104 |
| account | id, accountId, providerId, userId, access/refresh/id token, hạn token, scope, password | n–1 user (cascade) | packages/db/src/schema/auth.ts:40-68,105-110 |
| verification | id, identifier, value, expiresAt | — | packages/db/src/schema/auth.ts:70-86 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

> Single repo (monorepo) nhưng feature trải nhiều tiến trình: trình duyệt ↔ Worker ↔ D1 ↔ Google.

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| H-1 Trình duyệt (auth-client) | Worker `/api/auth/*` | gọi HTTP có cookie, baseURL từ `VITE_SERVER_URL` | Đăng ký, đăng nhập, đăng xuất, hỏi phiên | apps/web/src/lib/auth-client.ts:5-6 · apps/server/src/index.ts:50 |
| H-2 Worker (auth) | D1 (user/session/account/verification) | ghi/đọc qua adapter SQLite | Mọi thao tác xác thực | packages/auth/src/index.ts:29-32 · apps/server/src/services.ts:6-11 |
| H-3 Trình duyệt | Google OAuth → callback về Worker → chuyển về web | chuyển hướng trình duyệt, redirect URI `.../api/auth/callback/google` | Đăng nhập Google | apps/web/src/features/auth/auth-screen.tsx:97-106 · packages/api/src/test/auth.test.ts:54-56 |
| H-4 Guard web | tRPC `profile.get` (Worker) | gọi truy vấn có cookie | Guard onboarding | apps/web/src/lib/auth-guard.ts:49 · packages/api/src/routers/index.ts:23 |
| H-5 Route admin web | tRPC `checkAdmin` (Worker) | gọi truy vấn có cookie, so sánh ADMIN_EMAILS | Khu quản trị | apps/web/src/routes/admin/disputes.tsx:17-18 · packages/api/src/index.ts:31-45 |
| H-6 tRPC context (Worker) | thư viện auth `getSession` | đọc cookie → phiên | Mọi thủ tục API | apps/server/src/context.ts:12-18 · packages/api/src/index.ts:15-29 |

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Quên/đặt lại mật khẩu, xác minh email, magic link — *(chốt ngoài MVP, xếp Later theo quyết định `D-03` tại `docs/product-decisions.md:7`, N-1)*
* Bảng `verification` chưa có luồng gọi ở MVP — *(bảng do Better Auth quản lý, dự phòng cho tính năng Later theo `D-03`, N-3)*
* Các điểm nghi ngờ ban đầu khác (`G-1`, `N-2`, `N-4`..`N-8`) đã được giải quyết và khóa test tại Issue #134 (xem `reverse-gaps.md`).
