---
type: api-tests
feature: auth-account
api_type: own
status: draft
updated: 2026-11-12
setup_login_path: /api/auth/sign-in/email
setup_origin_var: "{{TRUSTED_ORIGIN}}"
links:
  - docs/auth-account/test/api/api-checklist.md
  - docs/auth-account/srs/auth-account-spec.md
  - docs/_reverse/auth-account/auth-account-reverse-spec.md
  - docs/_reverse/auth-account/_evidence.md
---

# API Tests — auth-account

> **Bảng test case = source of truth cho TEST-CASE SPECIFICATION (kiểm thế nào).** Coverage + intent đã khóa tại `docs/auth-account/test/api/api-checklist.md` (41 ACL items → mở rộng cùng intent thành **52 TC**: 50 Auto + 2 Manual/Rate-limit). Kết quả run là **evidence theo từng lần chạy** (env + thời điểm), KHÔNG phải trạng thái đặc tả.

## Test cases

<!-- TC:START -->
| TC | Auth | Method | Path | Headers | Body | HTTP | Assert | Ref | Kết quả | Lần chạy |
|----|------|--------|------|---------|------|------|--------|-----|---------|----------|
| TC-01 | public | GET | /trpc/healthCheck | — | — | 200 | result.data=OK | ACL#1 | — | — |
| TC-02 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Hoc Vien Moi"} | 200 | token=isString;user.emailVerified=false;header.set-cookie*=session_token= | ACL#2 FR-auth-account-001 FR-auth-account-002 BR-auth-account-005 NFR-auth-account-001 | — | — |
| TC-03 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"QA.Trim+{{runId}}@VoxFlow.Local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"  Nguyen Van A  "} | 200 | user.name=Nguyen Van A;user.email=qa.trim+{{runId}}@voxflow.local | ACL#3 FR-auth-account-001 BR-auth-account-003 | — | — |
| TC-04 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.avatar+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Hoc Vien Avatar","image":"{{VALID_IMAGE_HTTPS}}"} | 200 | user.image={{VALID_IMAGE_HTTPS}} | ACL#4 FR-auth-account-028 BR-auth-account-013 BR-auth-account-017 | — | — |
| TC-05 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Ban Ghi Trung"} | 422 | code^=USER_ALREADY_EXISTS | ACL#5 FR-auth-account-004 BR-auth-account-004 E-auth-account-002 | — | — |
| TC-06 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"password":"{{process.env.TEST_USER_PASSWORD}}","name":"Thieu Email"} | 400 | code=isString | ACL#6 FR-auth-account-001 E-auth-account-014 | — | — |
| TC-07 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.nopass+{{runId}}@voxflow.local","name":"Thieu Mat Khau"} | 400 | code=isString | ACL#6 FR-auth-account-001 E-auth-account-014 | — | — |
| TC-08 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.noname+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}"} | 400 | code=isString | ACL#6 FR-auth-account-001 E-auth-account-014 | — | — |
| TC-09 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"khong-phai-email","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Sai Dinh Dang Email"} | 400 | code=INVALID_EMAIL | ACL#7 FR-auth-account-001 E-auth-account-014 | — | — |
| TC-10 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.short7+{{runId}}@voxflow.local","password":"Abc123!","name":"Mat Khau Ngan"} | 400 | code=PASSWORD_TOO_SHORT | ACL#8 FR-auth-account-003 NFR-auth-account-006 E-auth-account-014 | — | — |
| TC-11 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.bound8+{{runId}}@voxflow.local","password":"{{PASS_8}}","name":"Bien Duoi 8"} | 200 | token=isString | ACL#9 FR-auth-account-003 NFR-auth-account-006 | — | — |
| TC-12 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.bound128+{{runId}}@voxflow.local","password":"{{PASS_128}}","name":"Bien Tren 128"} | 200 | token=isString | ACL#9 FR-auth-account-003 NFR-auth-account-006 | — | — |
| TC-13 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.long129+{{runId}}@voxflow.local","password":"{{PASS_129}}","name":"Vuot 128 Ky Tu"} | 400 | code=PASSWORD_TOO_LONG | ACL#10 FR-auth-account-003 NFR-auth-account-006 E-auth-account-004 | — | — |
| TC-14 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.wsname+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"   "} | 400 | code=INVALID_NAME | ACL#11 FR-auth-account-001 BR-auth-account-003 E-auth-account-016 | — | — |
| TC-15 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.name50+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"{{NAME_50_PADDED}}"} | 200 | user.name={{NAME_50_TRIMMED}} | ACL#12 FR-auth-account-001 BR-auth-account-003 | — | — |
| TC-16 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.name51+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"{{NAME_51}}"} | 400 | code=INVALID_NAME | ACL#13 FR-auth-account-001 BR-auth-account-003 E-auth-account-016 | — | — |
| TC-17 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.svg+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Chan SVG XSS","image":"{{INVALID_IMAGE_SVG}}"} | 400 | code=INVALID_IMAGE | ACL#14 FR-auth-account-028 NFR-auth-account-004 BR-auth-account-014 BR-auth-account-016 E-auth-account-012 | — | — |
| TC-18 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa.bigimg+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Anh Qua Lon","image":"{{OVERSIZE_IMAGE_DATA_URL}}"} | 400 | code=INVALID_IMAGE | ACL#15 FR-auth-account-028 NFR-auth-account-004 BR-auth-account-012 E-auth-account-012 | — | — |
| TC-19 | public | POST | /api/auth/sign-up/email | Origin: {{UNTRUSTED_ORIGIN}} | {"email":"qa.badorg+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Sai Origin"} | 403 | code=INVALID_ORIGIN | ACL#16 NFR-auth-account-002 | — | — |
| TC-20 | public | POST | /api/auth/sign-up/email | Origin: {{TRUSTED_ORIGIN}}; cf-connecting-ip: 203.0.113.10 | {"email":"qa.rl+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}","name":"Rate Limit SignUp"} | — | — | ACL#17 FR-auth-account-012 NFR-auth-account-006 BR-auth-account-032 E-auth-account-015 | — | — |
| TC-21 | public | POST | /api/auth/sign-in/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}"} | 200 | redirect=false;token=isString;header.set-cookie*=session_token= | ACL#18 FR-auth-account-006 NFR-auth-account-001 NFR-auth-account-006 | — | — |
| TC-22 | public | POST | /api/auth/sign-in/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa+{{runId}}@voxflow.local","password":"SaiMatKhau999!"} | 401 | code=INVALID_EMAIL_OR_PASSWORD | ACL#19 FR-auth-account-007 BR-auth-account-006 E-auth-account-001 | — | — |
| TC-23 | public | POST | /api/auth/sign-in/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"chua-ton-tai-9999@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}"} | 401 | code=INVALID_EMAIL_OR_PASSWORD | ACL#20 FR-auth-account-007 BR-auth-account-006 E-auth-account-001 | — | — |
| TC-24 | public | POST | /api/auth/sign-in/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"email-sai-dinh-dang","password":"{{process.env.TEST_USER_PASSWORD}}"} | 400 | code=INVALID_EMAIL | ACL#21 FR-auth-account-006 E-auth-account-014 | — | — |
| TC-25 | public | POST | /api/auth/sign-in/email | Origin: {{TRUSTED_ORIGIN}} | {"email":"qa+{{runId}}@voxflow.local","password":"{{PASS_129}}"} | 400 | code=PASSWORD_TOO_LONG | ACL#22 FR-auth-account-003 NFR-auth-account-006 E-auth-account-003 | — | — |
| TC-26 | public | POST | /api/auth/sign-in/email | Origin: {{UNTRUSTED_ORIGIN}} | {"email":"qa+{{runId}}@voxflow.local","password":"{{process.env.TEST_USER_PASSWORD}}"} | 403 | code=INVALID_ORIGIN | ACL#23 NFR-auth-account-002 | — | — |
| TC-27 | public | POST | /api/auth/sign-in/email | Origin: {{TRUSTED_ORIGIN}}; cf-connecting-ip: 203.0.113.10 | {"email":"qa+{{runId}}@voxflow.local","password":"SaiMatKhau999!"} | — | — | ACL#24 FR-auth-account-012 NFR-auth-account-006 BR-auth-account-032 E-auth-account-015 | — | — |
| TC-28 | public | POST | /api/auth/sign-in/social | Origin: {{TRUSTED_ORIGIN}} | {"provider":"google","callbackURL":"{{TRUSTED_ORIGIN}}/app/dashboard","newUserCallbackURL":"{{TRUSTED_ORIGIN}}/onboarding","errorCallbackURL":"{{TRUSTED_ORIGIN}}/auth"} | 200 | redirect=true;url^=https://accounts.google.com;url*=%2Fapi%2Fauth%2Fcallback%2Fgoogle | ACL#25 FR-auth-account-013 BR-auth-account-002 BR-auth-account-031 | — | — |
| TC-29 | public | POST | /api/auth/sign-in/social | Origin: {{TRUSTED_ORIGIN}} | {"provider":"github"} | 404 | code=PROVIDER_NOT_FOUND | ACL#26 FR-auth-account-013 E-auth-account-006 | — | — |
| TC-30 | public | POST | /api/auth/sign-in/social | Origin: {{TRUSTED_ORIGIN}} | {"provider":"google","callbackURL":"https://evil.example.com/pwn"} | 403 | code=INVALID_CALLBACK_URL | ACL#27 FR-auth-account-009 NFR-auth-account-002 NFR-auth-account-003 | — | — |
| TC-31 | session | GET | /api/auth/get-session | — | — | 200 | session.token=isString;user.email=isString;header.cache-control*=no-store | ACL#28 FR-auth-account-019 NFR-auth-account-006 | — | — |
| TC-32 | public | GET | /api/auth/get-session | — | — | 200 | $body=null;header.cache-control*=no-store | ACL#29 FR-auth-account-019 BR-auth-account-021 | — | — |
| TC-33 | public | GET | /api/auth/get-session | Cookie: better-auth.session_token=gia_mao | — | 200 | $body=null;header.cache-control*=no-store | ACL#29 FR-auth-account-019 BR-auth-account-021 | — | — |
| TC-34 | public | POST | /api/auth/get-session | Origin: {{TRUSTED_ORIGIN}} | {} | 405 | code=METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED | ACL#30 | — | — |
| TC-35 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"name":"  Ten Da Cap Nhat  "} | 200 | status=true | ACL#31 FR-auth-account-001 BR-auth-account-003 | — | — |
| TC-36 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"image":"{{VALID_IMAGE_PRESET}}"} | 200 | status=true | ACL#32 FR-auth-account-028 BR-auth-account-010 BR-auth-account-014 BR-auth-account-015 | — | — |
| TC-37 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"image":"{{VALID_IMAGE_DATA_URL}}"} | 200 | status=true | ACL#32 FR-auth-account-028 BR-auth-account-010 BR-auth-account-014 BR-auth-account-015 | — | — |
| TC-38 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"image":null} | 200 | status=true | ACL#32 FR-auth-account-028 BR-auth-account-010 BR-auth-account-014 BR-auth-account-015 | — | — |
| TC-39 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"name":"   "} | 400 | code=INVALID_NAME | ACL#33 FR-auth-account-001 BR-auth-account-003 E-auth-account-016 | — | — |
| TC-40 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"name":"{{NAME_51}}"} | 400 | code=INVALID_NAME | ACL#33 FR-auth-account-001 BR-auth-account-003 E-auth-account-016 | — | — |
| TC-41 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"image":"javascript:alert(1)"} | 400 | code=INVALID_IMAGE | ACL#34 FR-auth-account-028 NFR-auth-account-004 BR-auth-account-013 BR-auth-account-015 BR-auth-account-016 E-auth-account-012 | — | — |
| TC-42 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"image":"http://example.com/a.png"} | 400 | code=INVALID_IMAGE | ACL#34 FR-auth-account-028 NFR-auth-account-004 BR-auth-account-013 BR-auth-account-015 BR-auth-account-016 E-auth-account-012 | — | — |
| TC-43 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"image":"/etc/passwd"} | 400 | code=INVALID_IMAGE | ACL#34 FR-auth-account-028 NFR-auth-account-004 BR-auth-account-013 BR-auth-account-015 BR-auth-account-016 E-auth-account-012 | — | — |
| TC-44 | session | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"email":"new-email@voxflow.local"} | 400 | code=EMAIL_CAN_NOT_BE_UPDATED | ACL#35 BR-auth-account-004 | — | — |
| TC-45 | public | POST | /api/auth/update-user | Origin: {{TRUSTED_ORIGIN}} | {"name":"Anonymous"} | 401 | code=UNAUTHORIZED | ACL#36 FR-auth-account-025 FR-auth-account-028 | — | — |
| TC-46 | public | GET | /trpc/privateData | — | — | 401 | error.data.code=UNAUTHORIZED;error.message=Authentication required | ACL#39 FR-auth-account-025 E-auth-account-010 | — | — |
| TC-47 | public | GET | /trpc/disputeAdmin.checkAdmin | — | — | 401 | error.data.code=UNAUTHORIZED;error.message=Authentication required | ACL#40 FR-auth-account-026 E-auth-account-010 | — | — |
| TC-48 | session | GET | /trpc/privateData | — | — | 200 | result.data.message=This is private;result.data.user.email=isString | ACL#38 FR-auth-account-025 | — | — |
| TC-49 | session | GET | /trpc/disputeAdmin.checkAdmin | — | — | 403 | error.data.code=FORBIDDEN;error.message=Admin access required | ACL#41 FR-auth-account-026 BR-auth-account-018 BR-auth-account-019 E-auth-account-011 | — | — |
| TC-50 | session | POST | /api/auth/sign-out | Origin: {{TRUSTED_ORIGIN}} | {} | 200 | success=true;header.set-cookie*=session_token= | ACL#37 FR-auth-account-016 BR-auth-account-026 | — | — |
| TC-51 | session | GET | /api/auth/get-session | — | — | 200 | $body=null | ACL#37 FR-auth-account-016 BR-auth-account-026 | — | — |
| TC-52 | session | GET | /trpc/privateData | — | — | 401 | error.data.code=UNAUTHORIZED | ACL#39 FR-auth-account-025 E-auth-account-010 | — | — |
<!-- TC:END -->

## Lịch sử chạy

*(Chưa có lần chạy nào được ghi nhận qua CLI `--run`.)*

## Ý nghĩa nghiệp vụ & Hướng dẫn kiểm thử theo cụm

### 1. Sức khỏe máy chủ & Vòng đời đăng ký (`TC-01` → `TC-20`)
- **`TC-01` (`ACL#1`)**: Xác nhận Worker API sống và trả phản hồi công khai `result.data="OK"` trước khi chạy các luồng xác thực.
- **`TC-02`..`TC-04` (`ACL#2`..`ACL#4`)**: Kiểm chứng luồng đăng ký tài khoản học viên mới (`FR-auth-account-001`, `FR-auth-account-002`): tự động cấp phiên ngay sau khi tạo (`BR-auth-account-005`), cắt khoảng trắng đầu-cuối của tên hiển thị + chuẩn hóa chữ thường địa chỉ email (`BR-auth-account-003`), và chấp nhận ảnh đại diện HTTPS hợp lệ (`BR-auth-account-017`).
- **`TC-05` (`ACL#5`)**: Khóa quy tắc email duy nhất (`BR-auth-account-004`) — đăng ký lặp lại cùng email của `TC-02` trả `422` kèm mã lỗi bắt đầu bằng `USER_ALREADY_EXISTS` (hiển thị `E-auth-account-002`: *"Email đã được sử dụng."*).
- **`TC-06`..`TC-18` (`ACL#6`..`ACL#15`)**: Mở rộng cùng intent cho toàn bộ biên kiểm tra dữ liệu đầu vào ở tầng máy chủ:
  - Thiếu lần lượt `email`, `password`, `name` (`TC-06`..`TC-08`) và sai định dạng email (`TC-09` → `INVALID_EMAIL`).
  - Biên độ dài mật khẩu `8..128` ký tự (`FR-auth-account-003`): `7` ký tự bị chặn (`TC-10`), `8` và `128` ký tự được chấp nhận (`TC-11`, `TC-12`), `129` ký tự bị chặn (`TC-13` → `PASSWORD_TOO_LONG`).
  - Biên độ dài tên hiển thị `1..50` ký tự sau `trim()` (`BR-auth-account-003`): chuỗi toàn khoảng trắng (`TC-14`) và chuỗi `51` ký tự (`TC-16`) bị chặn với `INVALID_NAME` (`E-auth-account-016`); đúng `50` ký tự bao ngoài bởi khoảng trắng được lưu sạch (`TC-15`).
  - Bảo mật ảnh đại diện (`NFR-auth-account-004`): chặn SVG chứa script XSS (`TC-17`) và chặn data URL vượt ngưỡng `32.000` ký tự (`TC-18`) với `INVALID_IMAGE` (`E-auth-account-012`).
- **`TC-19` (`ACL#16`)**: Chặn tấn công CSRF khi `Origin` không khớp `CORS_ORIGIN` (`403 INVALID_ORIGIN`, `NFR-auth-account-002`).

### 2. Đăng nhập Email & Khởi tạo Google OAuth (`TC-21` → `TC-30`)
- **`TC-21` (`ACL#18`)**: Đăng nhập hợp lệ cấp token phiên mới và cookie `HttpOnly; Secure; SameSite=None` (`NFR-auth-account-001`).
- **`TC-22`, `TC-23` (`ACL#19`, `ACL#20`)**: Chống dò tài khoản (`BR-auth-account-006`) — sai mật khẩu và email chưa từng tồn tại đều trả đồng nhất `401 INVALID_EMAIL_OR_PASSWORD` (`E-auth-account-001`).
- **`TC-24`..`TC-26` (`ACL#21`..`ACL#23`)**: Chặn sớm email sai định dạng (`400`), mật khẩu `129` ký tự trước bước băm (`400 PASSWORD_TOO_LONG`), và `Origin` lạ (`403 INVALID_ORIGIN`).
- **`TC-28`..`TC-30` (`ACL#25`..`ACL#27`)**: Khởi tạo Google OAuth trả `redirect=true` kèm URL `https://accounts.google.com` chứa `redirect_uri` về `/api/auth/callback/google` (`BR-auth-account-031`); từ chối nhà cung cấp chưa cấu hình `github` (`404 PROVIDER_NOT_FOUND`); chặn open redirect khi `callbackURL` trỏ ra domain ngoài (`403 INVALID_CALLBACK_URL`, `NFR-auth-account-003`).

### 3. Truy vấn phiên, Cập nhật hồ sơ, Phân quyền & Đăng xuất (`TC-31` → `TC-52`)
- **Cơ chế phiên tự động (`_setup/login.bru`)**: Đăng nhập bằng `SEED_EMAIL` / `SEED_PASSWORD` ở đầu lượt chạy, trích `session_token` từ `Set-Cookie` vào biến phiên `{{sessionCookie}}` để vượt rào cờ `Secure` khi chạy qua `http://localhost:3000`.
- **`TC-31`..`TC-34` (`ACL#28`..`ACL#30`)**: Có phiên hợp lệ trả `session` + `user` kèm `cache-control: no-store`; không có cookie (`TC-32`) hoặc cookie giả mạo (`TC-33`) trả `200` với body `null` an toàn (`BR-auth-account-021`); gọi sai phương thức `POST` trả `405`.
- **`TC-35`..`TC-45` (`ACL#31`..`ACL#36`)**: Cập nhật tên hiển thị tự cắt khoảng trắng (`TC-35`); cập nhật ảnh bằng mẫu tĩnh `/avatars/*` (`TC-36`), chuỗi nén `webp` base64 (`TC-37`), xóa ảnh về `null` (`TC-38`); chặn tên rỗng/quá `50` ký tự (`TC-39`, `TC-40`); chặn giao thức độc hại `javascript:`, `http://` không mã hóa và đường dẫn hệ thống `/etc/passwd` (`TC-41`..`TC-43`); cấm sửa email (`TC-44` → `400 EMAIL_CAN_NOT_BE_UPDATED`); chặn người dùng chưa đăng nhập (`TC-45` → `401 UNAUTHORIZED`).
- **`TC-46`..`TC-49` (`ACL#38`..`ACL#41`)**: Kiểm chứng cổng bảo vệ thủ tục riêng tư `privateData` (`401` khi thiếu phiên ở `TC-46`, `200` khi có phiên ở `TC-48`) và cổng quản trị `disputeAdmin.checkAdmin` (`401` khi thiếu phiên ở `TC-47`, `403 FORBIDDEN` cho học viên thường không nằm trong `ADMIN_EMAILS` ở `TC-49` — lưu ý Conf 🟡 cho nhánh `200 {isAdmin: true}` bên dưới).
- **`TC-50`..`TC-52` (`ACL#37`, `ACL#39`)**: Đặt ở cuối chuỗi phiên — `TC-50` gọi `sign-out` hủy phiên trên máy chủ; ngay sau đó `TC-51` gọi lại `get-session` với cùng token cũ nhận `null`, và `TC-52` gọi `privateData` với token đã hủy bị chặn `401 UNAUTHORIZED`.

### 4. Kịch bản ngoài Suite Auto (`Auto = No` / Phụ thuộc cấu hình 🟡)
1. **Giới hạn tốc độ `3 lần / 10 giây` (`429`)** — ứng với mục `TC-20` (`ACL#17` 🟡) và `TC-27` (`ACL#24` 🟡):
   - Để trống cột `HTTP` nên runner tự động bỏ qua khi chạy batch.
   - **Cách kiểm thử thủ công:** Mở Bruno GUI (hoặc dùng vòng lặp CLI 4 lần liên tiếp trong `< 10 giây`) gửi `TC-20` hoặc `TC-27` với cùng header `cf-connecting-ip: 203.0.113.10`. Xác nhận 3 lần đầu trả mã nghiệp vụ (`200`/`401`), lần thứ 4 trả `429 Too Many Requests` (`E-auth-account-015`), đồng thời gọi từ IP khác (`203.0.113.11`) hoặc chờ qua 10 giây tài khoản vẫn đăng nhập bình thường (không khóa cứng).
2. **Nhánh quản trị viên hợp lệ của `ACL#41` (🟡)**:
   - Mặc định `TC-49` khóa hành vi `403 FORBIDDEN` đối với tài khoản học viên (`SEED_EMAIL`). Để kiểm chứng nhánh `200 {"result":{"data":{"isAdmin":true}}}`, cấu hình máy chủ test nạp `ADMIN_EMAILS` chứa `TEST_ADMIN_EMAIL`, đăng nhập bằng `TEST_ADMIN_EMAIL` trong Bruno GUI rồi gọi `GET /trpc/disputeAdmin.checkAdmin`.

## Phát hiện khi test

*(Ghi nhận lỗi hợp đồng, sai lệch mã lỗi hoặc bất thường môi trường phát hiện qua các lần chạy thực tế tại đây.)*
