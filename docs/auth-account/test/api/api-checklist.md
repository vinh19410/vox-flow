---
type: api-checklist
feature: auth-account
api_type: own
status: draft
updated: 2026-11-12
links:
  - docs/_reverse/auth-account/auth-account-reverse-spec.md
  - docs/_reverse/auth-account/_evidence.md
  - docs/_reverse/auth-account/srs/auth-account-reverse-erd.md
  - docs/_reverse/auth-account/srs/auth-account-reverse-flows.md
  - docs/_reverse/auth-account/usecases/auth-account-reverse-usecase-index.md
---

# API Test Checklist — auth-account

> Ghi chú nhật ký: `[own] discovery 3 round → 41 items, 2 OQ (9 endpoint)`

## 1. Hiểu API (Discovery Summary)

Cụm API `auth-account` là hệ thống xác thực và phân quyền nội bộ (`api_type: own`) của sản phẩm Vox Flow, phục vụ đăng ký tài khoản bằng email/mật khẩu, đăng nhập bằng email hoặc Google OAuth, truy vấn/hủy phiên làm việc, cập nhật tên hiển thị & ảnh đại diện người dùng, và chặn quyền truy cập đối với các thủ tục riêng tư hoặc khu vực quản trị.

- **Môi trường & Base URL:** Mặc định chạy trên máy chủ phát triển cục bộ `http://localhost:3000` (giao diện tin cậy `Origin: http://localhost:3001`); hỗ trợ cấu hình chuyển đổi sang môi trường Cloudflare Staging/Production (`https://api.vox.vinhtran.io.vn`, `Origin: https://vox.vinhtran.io.vn`) qua biến trong `bruno/.env`.
- **Cơ chế xác thực & Phiên:** Cookie phiên ký số (`session_token`) mang thuộc tính bắt buộc `HttpOnly`, `Secure`, `SameSite=None`, thời hạn 7 ngày (gia hạn trượt mỗi 24 giờ). Các yêu cầu thay đổi trạng thái kiểm tra chặt header `Origin` theo `CORS_ORIGIN`.
- **Độ phủ tài liệu nguồn:** Đã đối chiếu đầy đủ từ đặc tả được duyệt `docs/_reverse/auth-account/auth-account-reverse-spec.md` (Issue #134) và hợp đồng HTTP thực tế; toàn bộ ngưỡng kiểm tra tên (`1..50` ký tự sau cắt khoảng trắng), mật khẩu (`8..128` ký tự), ảnh đại diện (`<= 32.000` ký tự, danh sách định dạng cho phép), giới hạn tốc độ (`3 lần/10s` theo `cf-connecting-ip`) và phân quyền `ADMIN_EMAILS` đều xác định rõ ràng.
- **9 Endpoint trong phạm vi (In-Scope):**
  1. `GET /trpc/healthCheck` — Kiểm tra trạng thái sống của máy chủ API (công khai).
  2. `POST /api/auth/sign-up/email` — Đăng ký tài khoản bằng email, mật khẩu, tên hiển thị (tự động cấp phiên).
  3. `POST /api/auth/sign-in/email` — Đăng nhập bằng email và mật khẩu.
  4. `POST /api/auth/sign-in/social` — Khởi tạo luồng đăng nhập mạng xã hội (Google OAuth).
  5. `GET /api/auth/get-session` — Truy vấn thông tin phiên đăng nhập và người dùng hiện tại.
  6. `POST /api/auth/update-user` — Cập nhật tên hiển thị hoặc ảnh đại diện của người dùng đang đăng nhập.
  7. `POST /api/auth/sign-out` — Hủy phiên đăng nhập hiện tại và xóa cookie phiên.
  8. `GET /trpc/privateData` — Thủ tục đại diện kiểm chứng cổng bảo vệ yêu cầu phiên đăng nhập (`UNAUTHORIZED` khi thiếu phiên).
  9. `GET /trpc/disputeAdmin.checkAdmin` — Thủ tục đại diện kiểm chứng cổng phân quyền quản trị viên (`UNAUTHORIZED` khi thiếu phiên, `FORBIDDEN` khi không thuộc `ADMIN_EMAILS`).

*(Hai điểm tải/ghi audio `POST/GET /api/attempts/.../audio` giữ tại tính năng `mock-exam` theo quyết định chốt phạm vi).*

## 2. Fixtures (Dữ liệu mẫu & Môi trường)

<!-- FIX:START -->
| Loại | Tên | Value | Ghi chú |
|------|-----|-------|---------|
| env | BASE_URL | http://localhost:3000 | Mặc định local; biến STAGING_BASE_URL (https://api.vox.vinhtran.io.vn) khai báo ở bruno/.env |
| env | TRUSTED_ORIGIN | http://localhost:3001 | Header Origin hợp lệ khớp CORS_ORIGIN; STAGING_ORIGIN=https://vox.vinhtran.io.vn |
| env | UNTRUSTED_ORIGIN | https://evil.example.com | Header Origin ngoài danh sách tin cậy để kiểm tra chặn CSRF/Origin |
| dynamic account | DYNAMIC_STUDENT_EMAIL | qa+{{timestamp}}@voxflow.local | Email học viên sinh động mỗi lần chạy để tạo mới không đụng dữ liệu cũ |
| auth secret | TEST_USER_PASSWORD | (bruno/.env) | Mật khẩu hợp lệ (8..128 ký tự) dùng cho tài khoản test — KHÔNG ghi giá trị thật vào tài liệu |
| auth secret | TEST_ADMIN_EMAIL | (bruno/.env) | Email nằm trong danh sách biến ADMIN_EMAILS của máy chủ test để kiểm tra quyền quản trị |
| auth secret | TEST_ADMIN_PASSWORD | (bruno/.env) | Mật khẩu của tài khoản TEST_ADMIN_EMAIL lưu tại bruno/.env |
| session state | SESSION_COOKIE | session_token={{captured}} | Trích tự động từ header Set-Cookie sau sign-up/sign-in (lưu ý cờ Secure khi chạy qua HTTP local) |
| boundary value | PASSWORD_SHORT_7 | Abc123! | Chuỗi mật khẩu 7 ký tự (< ngưỡng tối thiểu 8) |
| boundary value | PASSWORD_BOUND_8_128 | 8 ký tự và 128 ký tự | Chuỗi mật khẩu đúng biên dưới (8) và biên trên (128) |
| boundary value | PASSWORD_LONG_129 | Chuỗi lặp 129 ký tự | Vượt ngưỡng tối đa 128 ký tự của máy chủ |
| boundary value | NAME_WHITESPACE | "   " | Chuỗi chỉ gồm khoảng trắng (sau trim còn 0 ký tự) |
| boundary value | NAME_BOUND_50 | Chuỗi 50 ký tự (kèm khoảng trắng 2 đầu) | Đúng biên tối đa 50 ký tự sau khi cắt khoảng trắng |
| boundary value | NAME_LONG_51 | Chuỗi 51 ký tự | Vượt ngưỡng tối đa 50 ký tự của tên hiển thị |
| image sample | VALID_IMAGE_HTTPS | https://lh3.googleusercontent.com/a/ACg8ocK-example=s96-c | URL ảnh đại diện HTTPS hợp lệ (mô phỏng ảnh Google) |
| image sample | VALID_IMAGE_PRESET | /avatars/owl-scholar.svg | Đường dẫn ảnh đại diện tĩnh nội bộ thuộc nhóm 6 mẫu hợp lệ |
| image sample | VALID_IMAGE_DATA_URL | data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA= | Data URL định dạng webp base64 hợp lệ <= 32.000 ký tự |
| image sample | INVALID_IMAGE_PAYLOADS | data:image/svg+xml;base64,... ; javascript:alert(1) ; http://example.com/a.png ; >32000 ký tự | Các mẫu ảnh vi phạm quy tắc bảo mật hoặc vượt độ dài 32.000 ký tự |
| rate limit | TEST_CLIENT_IP | cf-connecting-ip: 203.0.113.10 | Header IP giả lập để kích hoạt giới hạn 3 lần / 10 giây mà không khóa IP thật |
<!-- FIX:END -->

## 3. Checklist Kiểm thử API

<!-- ACL:START -->
| # | API | Dir | Endpoint | Dimension | Scenario | Trigger | HTTP | Expected Result | Ref | P | Auto | Conf |
|---|-----|-----|----------|-----------|----------|---------|------|--------------|-----|---|------|------|
| 1 | own | out | GET /trpc/healthCheck | Env-smoke | Kiểm tra máy chủ API sẵn sàng phản hồi công khai | Gọi tới BASE_URL không kèm cookie phiên | 200 | result.data="OK"; máy chủ hoạt động bình thường | — | 1 | Yes | 🟢 |
| 2 | own | out | POST /api/auth/sign-up/email | Happy | Đăng ký tài khoản mới thành công và tự động cấp phiên đăng nhập | Gửi DYNAMIC_STUDENT_EMAIL, TEST_USER_PASSWORD, name="Hoc Vien Moi" kèm Origin=TRUSTED_ORIGIN | 200 | Trả token khác rỗng và đối tượng user (emailVerified=false); header Set-Cookie chứa session_token kèm đủ HttpOnly, Secure, SameSite=None | FR-auth-account-001, FR-auth-account-002, BR-auth-account-005, NFR-auth-account-001 | 1 | Yes | 🟢 |
| 3 | own | out | POST /api/auth/sign-up/email | Happy | Tự động cắt khoảng trắng đầu-cuối của tên hiển thị và chuẩn hóa email | Gửi email mới và name="  Nguyen Van A  " có khoảng trắng hai đầu | 200 | Tài khoản được tạo với user.name="Nguyen Van A" (đã cắt khoảng trắng) và user.email viết thường | FR-auth-account-001, BR-auth-account-003 | 2 | Yes | 🟢 |
| 4 | own | out | POST /api/auth/sign-up/email | Happy | Đăng ký kèm ảnh đại diện HTTPS hợp lệ | Gửi thông tin đăng ký hợp lệ kèm trường image=VALID_IMAGE_HTTPS | 200 | Tạo tài khoản thành công; user.image lưu đúng URL VALID_IMAGE_HTTPS | FR-auth-account-028, BR-auth-account-013, BR-auth-account-017 | 2 | Yes | 🟢 |
| 5 | own | out | POST /api/auth/sign-up/email | Business error | Từ chối đăng ký khi email đã tồn tại trong hệ thống | Gửi lại cùng DYNAMIC_STUDENT_EMAIL đã tạo thành công ở mục #2 | 422 | Mã lỗi bắt đầu bằng USER_ALREADY_EXISTS; không tạo bản ghi người dùng trùng và không cấp phiên mới | FR-auth-account-004, BR-auth-account-004, E-auth-account-002 | 1 | Yes | 🟢 |
| 6 | own | out | POST /api/auth/sign-up/email | Validation | Từ chối đăng ký khi thiếu trường bắt buộc (email, password hoặc name) | Bỏ trống lần lượt một trong các trường bắt buộc trong JSON body | 400 | Phản hồi lỗi kiểm tra dữ liệu đầu vào; không tạo tài khoản và không trả Set-Cookie phiên | FR-auth-account-001, E-auth-account-014 | 1 | Yes | 🟢 |
| 7 | own | out | POST /api/auth/sign-up/email | Validation | Từ chối đăng ký khi định dạng email không hợp lệ | Gửi email="khong-phai-email" kèm mật khẩu và tên hợp lệ | 400 | Mã lỗi INVALID_EMAIL; không tạo tài khoản | FR-auth-account-001, E-auth-account-014 | 1 | Yes | 🟢 |
| 8 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Từ chối đăng ký khi mật khẩu ngắn hơn 8 ký tự | Gửi password=PASSWORD_SHORT_7 (7 ký tự) | 400 | Mã lỗi PASSWORD_TOO_SHORT; không tạo tài khoản | FR-auth-account-003, NFR-auth-account-006, E-auth-account-014 | 1 | Yes | 🟢 |
| 9 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Chấp nhận mật khẩu ở đúng hai giá trị biên 8 ký tự và 128 ký tự | Đăng ký tài khoản mới với mật khẩu dài đúng 8 ký tự và 128 ký tự (PASSWORD_BOUND_8_128) | 200 | Tạo tài khoản và cấp phiên thành công cho cả hai mốc biên độ dài mật khẩu | FR-auth-account-003, NFR-auth-account-006 | 2 | Yes | 🟢 |
| 10 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Từ chối đăng ký khi mật khẩu vượt quá 128 ký tự | Gửi password=PASSWORD_LONG_129 (129 ký tự) | 400 | Mã lỗi PASSWORD_TOO_LONG; không tạo tài khoản | FR-auth-account-003, NFR-auth-account-006, E-auth-account-004 | 2 | Yes | 🟢 |
| 11 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Từ chối đăng ký khi tên hiển thị chỉ chứa khoảng trắng | Gửi name=NAME_WHITESPACE ("   ") | 400 | Mã lỗi INVALID_NAME; thao tác tạo tài khoản bị hủy hoàn toàn | FR-auth-account-001, BR-auth-account-003, E-auth-account-016 | 1 | Yes | 🟢 |
| 12 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Chấp nhận tên hiển thị dài đúng 50 ký tự sau khi cắt khoảng trắng | Gửi name=NAME_BOUND_50 (50 ký tự có khoảng trắng bao ngoài) | 200 | Tạo tài khoản thành công; user.name lưu đúng 50 ký tự đã cắt khoảng trắng | FR-auth-account-001, BR-auth-account-003 | 3 | Yes | 🟢 |
| 13 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Từ chối đăng ký khi tên hiển thị dài 51 ký tự sau khi cắt khoảng trắng | Gửi name=NAME_LONG_51 (51 ký tự) | 400 | Mã lỗi INVALID_NAME; không tạo tài khoản | FR-auth-account-001, BR-auth-account-003, E-auth-account-016 | 2 | Yes | 🟢 |
| 14 | own | out | POST /api/auth/sign-up/email | Validation | Từ chối đăng ký khi ảnh đại diện là SVG data URL chứa mã kịch bản | Gửi trường image dạng data:image/svg+xml;base64 thuộc INVALID_IMAGE_PAYLOADS | 400 | Mã lỗi INVALID_IMAGE; hủy tạo tài khoản để chống vector XSS | FR-auth-account-028, NFR-auth-account-004, BR-auth-account-014, BR-auth-account-016, E-auth-account-012 | 1 | Yes | 🟢 |
| 15 | own | out | POST /api/auth/sign-up/email | Enum-boundary | Từ chối đăng ký khi chuỗi ảnh đại diện vượt quá 32.000 ký tự | Gửi image data:image/webp;base64 có tổng độ dài > 32.000 ký tự | 400 | Mã lỗi INVALID_IMAGE; không tạo tài khoản | FR-auth-account-028, NFR-auth-account-004, BR-auth-account-012, E-auth-account-012 | 2 | Yes | 🟢 |
| 16 | own | out | POST /api/auth/sign-up/email | Auth | Từ chối yêu cầu đăng ký gửi từ Origin không nằm trong danh sách tin cậy | Gửi header Origin=UNTRUSTED_ORIGIN | 403 | Mã lỗi INVALID_ORIGIN; không tạo tài khoản | NFR-auth-account-002 | 1 | Yes | 🟢 |
| 17 | own | out | POST /api/auth/sign-up/email | Rate-limit | Chặn yêu cầu đăng ký vượt ngưỡng 3 lần trong 10 giây trên cùng địa chỉ IP | Gửi liên tiếp 4 yêu cầu đăng ký trong < 10s kèm cùng header TEST_CLIENT_IP | 429 | Yêu cầu thứ 4 bị từ chối vì vượt giới hạn tốc độ; IP khác vẫn gọi được bình thường | FR-auth-account-012, NFR-auth-account-006, BR-auth-account-032, E-auth-account-015 | 2 | No | 🟡 |
| 18 | own | out | POST /api/auth/sign-in/email | Happy | Đăng nhập thành công với email và mật khẩu hợp lệ | Gửi DYNAMIC_STUDENT_EMAIL và TEST_USER_PASSWORD kèm Origin=TRUSTED_ORIGIN | 200 | Trả token phiên mới, redirect=false và thông tin user; header Set-Cookie chứa session_token kèm HttpOnly, Secure, SameSite=None | FR-auth-account-006, NFR-auth-account-001, NFR-auth-account-006 | 1 | Yes | 🟢 |
| 19 | own | out | POST /api/auth/sign-in/email | Business error | Từ chối đăng nhập khi nhập sai mật khẩu của tài khoản đã tồn tại | Gửi DYNAMIC_STUDENT_EMAIL kèm mật khẩu sai "SaiMatKhau999!" | 401 | Mã lỗi INVALID_EMAIL_OR_PASSWORD; không phát sinh cookie phiên | FR-auth-account-007, BR-auth-account-006, E-auth-account-001 | 1 | Yes | 🟢 |
| 20 | own | out | POST /api/auth/sign-in/email | Business error | Trả cùng mã lỗi khi đăng nhập bằng email chưa từng tồn tại (chống dò email) | Gửi email="chua-ton-tai-9999@voxflow.local" kèm TEST_USER_PASSWORD | 401 | Trả đúng cùng mã lỗi INVALID_EMAIL_OR_PASSWORD như trường hợp sai mật khẩu; không tiết lộ sự tồn tại của email | FR-auth-account-007, BR-auth-account-006, E-auth-account-001 | 1 | Yes | 🟢 |
| 21 | own | out | POST /api/auth/sign-in/email | Validation | Từ chối đăng nhập khi định dạng email không hợp lệ | Gửi email="email-sai-dinh-dang" kèm mật khẩu bất kỳ | 400 | Mã lỗi INVALID_EMAIL; không cấp phiên | FR-auth-account-006, E-auth-account-014 | 2 | Yes | 🟢 |
| 22 | own | out | POST /api/auth/sign-in/email | Enum-boundary | Từ chối đăng nhập khi mật khẩu vượt quá 128 ký tự | Gửi DYNAMIC_STUDENT_EMAIL kèm password=PASSWORD_LONG_129 (129 ký tự) | 400 | Mã lỗi PASSWORD_TOO_LONG; từ chối trước bước kiểm tra băm mật khẩu | FR-auth-account-003, NFR-auth-account-006, E-auth-account-003 | 3 | Yes | 🟢 |
| 23 | own | out | POST /api/auth/sign-in/email | Auth | Từ chối yêu cầu đăng nhập gửi từ Origin không hợp lệ | Gửi thông tin đăng nhập đúng nhưng kèm header Origin=UNTRUSTED_ORIGIN | 403 | Mã lỗi INVALID_ORIGIN; không cấp phiên | NFR-auth-account-002 | 1 | Yes | 🟢 |
| 24 | own | out | POST /api/auth/sign-in/email | Rate-limit | Chặn dò mật khẩu vượt 3 lần trong 10 giây nhưng không khóa cứng tài khoản | Gửi 4 yêu cầu đăng nhập liên tiếp trong < 10s cùng header TEST_CLIENT_IP, sau đó thử từ IP khác hoặc sau 10s | 429 | Yêu cầu thứ 4 trả 429; tài khoản không bị khóa cứng (đăng nhập đúng mật khẩu sau cửa sổ 10s vẫn thành công) | FR-auth-account-012, NFR-auth-account-006, BR-auth-account-032, E-auth-account-015 | 1 | No | 🟡 |
| 25 | own | out | POST /api/auth/sign-in/social | Happy | Khởi tạo luồng đăng nhập Google trả về URL chuyển hướng hợp lệ | Gửi provider="google", callbackURL="http://localhost:3001/app/dashboard", newUserCallbackURL="http://localhost:3001/onboarding", errorCallbackURL="http://localhost:3001/auth" | 200 | redirect=true; trường url bắt đầu bằng https://accounts.google.com và chứa redirect_uri trỏ về /api/auth/callback/google | FR-auth-account-013, BR-auth-account-002, BR-auth-account-031 | 1 | Yes | 🟢 |
| 26 | own | out | POST /api/auth/sign-in/social | Business error | Từ chối khi yêu cầu nhà cung cấp OAuth chưa được cấu hình | Gửi provider="github" kèm Origin=TRUSTED_ORIGIN | 404 | Mã lỗi PROVIDER_NOT_FOUND | FR-auth-account-013, E-auth-account-006 | 3 | Yes | 🟢 |
| 27 | own | out | POST /api/auth/sign-in/social | Auth | Chặn open redirect khi callbackURL hoặc newUserCallbackURL trỏ ra domain ngoài | Gửi provider="google" kèm callbackURL="https://evil.example.com/pwn" | 403 | Mã lỗi INVALID_CALLBACK_URL; hủy khởi tạo phiên OAuth | FR-auth-account-009, NFR-auth-account-002, NFR-auth-account-003 | 1 | Yes | 🟢 |
| 28 | own | out | GET /api/auth/get-session | Happy | Trả về thông tin phiên và người dùng khi đính kèm cookie phiên hợp lệ | Gửi header Cookie chứa SESSION_COOKIE hợp lệ | 200 | Body chứa đối tượng session (token, expiresAt) và user khớp tài khoản đang đăng nhập; header cache-control="no-store" | FR-auth-account-019, NFR-auth-account-006 | 1 | Yes | 🟢 |
| 29 | own | out | GET /api/auth/get-session | Auth | Trả về rỗng an toàn khi không gửi cookie hoặc gửi token phiên giả mạo | Gọi không kèm Cookie hoặc kèm Cookie="better-auth.session_token=gia_mao" | 200 | Body JSON trả giá trị null; header cache-control="no-store" | FR-auth-account-019, BR-auth-account-021 | 1 | Yes | 🟢 |
| 30 | own | out | GET /api/auth/get-session | Contract | Từ chối phương thức POST trên điểm truy vấn phiên | Gửi yêu cầu POST /api/auth/get-session | 405 | Mã lỗi METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED | — | 3 | Yes | 🟢 |
| 31 | own | out | POST /api/auth/update-user | Happy | Cập nhật tên hiển thị hợp lệ và tự động cắt khoảng trắng | Gửi Cookie=SESSION_COOKIE, Origin=TRUSTED_ORIGIN và body name="  Ten Da Cap Nhat  " | 200 | Phản hồi status=true; gọi lại GET /api/auth/get-session xác nhận user.name="Ten Da Cap Nhat" | FR-auth-account-001, BR-auth-account-003 | 2 | Yes | 🟢 |
| 32 | own | out | POST /api/auth/update-user | Happy | Cập nhật ảnh đại diện bằng mẫu tĩnh /avatars/*, data URL nén và xóa ảnh về null | Lần lượt gửi image=VALID_IMAGE_PRESET, image=VALID_IMAGE_DATA_URL rồi image=null kèm SESSION_COOKIE | 200 | Cả 3 lần đều trả status=true; get-session phản ánh đúng đường dẫn preset, chuỗi data URL và cuối cùng user.image=null | FR-auth-account-028, BR-auth-account-010, BR-auth-account-014, BR-auth-account-015 | 2 | Yes | 🟢 |
| 33 | own | out | POST /api/auth/update-user | Enum-boundary | Từ chối cập nhật tên hiển thị rỗng khoảng trắng hoặc dài quá 50 ký tự | Gửi name=NAME_WHITESPACE hoặc name=NAME_LONG_51 kèm SESSION_COOKIE | 400 | Mã lỗi INVALID_NAME; tên hiển thị cũ trong phiên được giữ nguyên | FR-auth-account-001, BR-auth-account-003, E-auth-account-016 | 2 | Yes | 🟢 |
| 34 | own | out | POST /api/auth/update-user | Validation | Từ chối ảnh đại diện dùng giao thức không an toàn hoặc đường dẫn nội bộ trái phép | Gửi image="javascript:alert(1)", "http://example.com/a.png" hoặc "/etc/passwd" kèm SESSION_COOKIE | 400 | Mã lỗi INVALID_IMAGE; ảnh đại diện hiện tại của người dùng không bị ghi đè | FR-auth-account-028, NFR-auth-account-004, BR-auth-account-013, BR-auth-account-015, BR-auth-account-016, E-auth-account-012 | 1 | Yes | 🟢 |
| 35 | own | out | POST /api/auth/update-user | Validation | Không cho phép đổi địa chỉ email qua endpoint cập nhật hồ sơ | Gửi body chứa trường email="new-email@voxflow.local" kèm SESSION_COOKIE | 400 | Mã lỗi EMAIL_CAN_NOT_BE_UPDATED; địa chỉ email của tài khoản giữ nguyên | BR-auth-account-004 | 2 | Yes | 🟢 |
| 36 | own | out | POST /api/auth/update-user | Auth | Từ chối cập nhật hồ sơ khi không có phiên đăng nhập | Gửi body name="Anonymous" nhưng không đính kèm Cookie phiên | 401 | Từ chối truy cập UNAUTHORIZED; không thay đổi dữ liệu | FR-auth-account-025, FR-auth-account-028 | 1 | Yes | 🟢 |
| 37 | own | out | POST /api/auth/sign-out | Happy | Đăng xuất hủy phiên trên máy chủ và xóa cookie phiên | Gửi POST kèm Cookie=SESSION_COOKIE và Origin=TRUSTED_ORIGIN | 200 | Phản hồi success=true kèm Set-Cookie hết hạn xóa session_token; gọi lại GET /api/auth/get-session với token cũ trả null | FR-auth-account-016, BR-auth-account-026 | 1 | Yes | 🟢 |
| 38 | own | out | GET /trpc/privateData | Happy | Cho phép truy cập thủ tục riêng tư khi có phiên đăng nhập hợp lệ | Gửi yêu cầu kèm Cookie=SESSION_COOKIE | 200 | result.data.message="This is private" và result.data.user.email khớp người dùng đang đăng nhập | FR-auth-account-025 | 1 | Yes | 🟢 |
| 39 | own | out | GET /trpc/privateData | Auth | Chặn truy cập thủ tục riêng tư khi không có phiên đăng nhập | Gọi không đính kèm Cookie phiên (hoặc dùng token đã sign-out ở mục #37) | 401 | error.data.code="UNAUTHORIZED", thông điệp "Authentication required" | FR-auth-account-025, E-auth-account-010 | 1 | Yes | 🟢 |
| 40 | own | out | GET /trpc/disputeAdmin.checkAdmin | Auth | Chặn truy cập thủ tục quản trị với mã 401 khi chưa đăng nhập | Gọi không đính kèm Cookie phiên | 401 | error.data.code="UNAUTHORIZED", thông điệp "Authentication required" | FR-auth-account-026, E-auth-account-010 | 1 | Yes | 🟢 |
| 41 | own | out | GET /trpc/disputeAdmin.checkAdmin | Auth | Chặn học viên thường (403 FORBIDDEN) và chỉ cho phép tài khoản thuộc ADMIN_EMAILS | (a) Gọi bằng SESSION_COOKIE của DYNAMIC_STUDENT_EMAIL → 403; (b) riêng với phiên của TEST_ADMIN_EMAIL (khi máy chủ cấu hình ADMIN_EMAILS) trả 200 isAdmin=true | 403 | Với học viên không thuộc ADMIN_EMAILS: trả 403 error.data.code="FORBIDDEN", thông điệp "Admin access required" | FR-auth-account-026, BR-auth-account-018, BR-auth-account-019, E-auth-account-011 | 1 | Yes | 🟡 |
<!-- ACL:END -->

> *Ghi chú kịch bản #41:* Mã HTTP chính cần khóa tự động trên mọi môi trường mặc định (`ADMIN_EMAILS=""`) là `403 FORBIDDEN` cho học viên thường; nhánh `200 {isAdmin: true}` cho quản trị viên được đánh dấu `🟡` vì phụ thuộc máy chủ đích đã nạp biến `ADMIN_EMAILS` chứa `TEST_ADMIN_EMAIL`.

## 4. Ma trận độ phủ (Coverage Matrix)

| Endpoint | Env-smoke | Happy | Validation | Enum-boundary | Business error | Auth | Rate-limit | Contract | Tổng |
|---|---|---|---|---|---|---|---|---|---|
| `GET /trpc/healthCheck` | 1 | — | — | — | — | — | — | — | **1** |
| `POST /api/auth/sign-up/email` | — | 3 | 3 | 7 | 1 | 1 | 1 | — | **16** |
| `POST /api/auth/sign-in/email` | — | 1 | 1 | 1 | 2 | 1 | 1 | — | **7** |
| `POST /api/auth/sign-in/social` | — | 1 | — | — | 1 | 1 | — | — | **3** |
| `GET /api/auth/get-session` | — | 1 | — | — | — | 1 | — | 1 | **3** |
| `POST /api/auth/update-user` | — | 2 | 2 | 1 | — | 1 | — | — | **6** |
| `POST /api/auth/sign-out` | — | 1 | — | — | — | — | — | — | **1** |
| `GET /trpc/privateData` | — | 1 | — | — | — | 1 | — | — | **2** |
| `GET /trpc/disputeAdmin.checkAdmin` | — | — | — | — | — | 2 | — | — | **2** |
| **Tổng cộng** | **1** | **10** | **6** | **9** | **4** | **8** | **2** | **1** | **41** |

## 5. Câu hỏi mở (Open Questions)

- [ ] OQ: Có bổ sung script seed dữ liệu local tạo sẵn tài khoản "chỉ liên kết Google, không có mật khẩu" (`google-only@voxflow.local`) để chạy tự động qua Bruno cho 2 kịch bản `BR-auth-account-004` (đăng ký mật khẩu trùng email Google → `422`) và `BR-auth-account-006` (đăng nhập mật khẩu vào email chỉ có Google → `401 INVALID_EMAIL_OR_PASSWORD`), hay giữ nguyên kiểm chứng ở tầng integration test hiện có?
- [ ] OQ: Xác nhận ranh giới kiểm thử cho callback `GET /api/auth/callback/google` (nhánh đổi mã `code` thật với Google để phân luồng `callbackURL` / `newUserCallbackURL`, và nhánh lỗi `?error=account_not_linked` theo `BR-auth-account-008`) sẽ kiểm chứng ở tầng E2E trình duyệt / manual trên Staging thay vì bộ Bruno HTTP?

## 6. Nhật ký thay đổi (Changelog)

| Ngày | Phiên bản | Tóm tắt thay đổi |
|------|-----------|------------------|
| 2026-11-12 | v1.0 (draft) | `[own] discovery 3 round → 41 items, 2 OQ (9 endpoint)` — Khởi tạo từ SRS tái lập đã duyệt (#134). |
