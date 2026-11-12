# auth-account — Gaps & Open Questions

> Trạng thái sau Issue #134 (2026-11-12): **toàn bộ OQ đã chốt, Gap/Conflict/Assumption đã giải quyết**. Căn cứ chốt: quyết định sản phẩm `docs/product-decisions.md` (D-03 tại dòng 7, D-04 tại dòng 8), PRD `docs/_product/prd.md` (dòng 14, 29, 69, 77, 103, 106) và đối chiếu mã nguồn thư viện `better-auth@1.7.12`.

## 1. Open Questions

* [x] OQ-1: Chính sách mật khẩu phía máy chủ (tối thiểu, tối đa, độ mạnh) là gì? — **Chốt (#134):** máy chủ cấu hình tường minh `minPasswordLength: 8`, `maxPasswordLength: 128`; mật khẩu băm `scrypt` (mặc định `better-auth@1.7.12`, cấu hình tại `packages/auth/src/index.ts`). Khớp ràng buộc `minLength=8` phía form đăng ký. — *(FR-003, NFR-006)*
* [x] OQ-2: Thời hạn phiên và cookie (có "ghi nhớ đăng nhập" không)? — **Chốt:** phiên kéo dài `7 ngày` (604800s), gia hạn trượt mỗi `24 giờ` (86400s); cookie luôn lưu bền vững, không có hộp kiểm "ghi nhớ đăng nhập" (mặc định `better-auth@1.7.12`). — *(NFR-006, States)*
* [x] OQ-3: Có cần xác minh email khi đăng ký? — **Chốt theo D-03 (`docs/product-decisions.md:7`, `docs/_product/prd.md:29,69`):** không xác minh email trong MVP; cờ `emailVerified` mặc định "chưa" và bảng `verification` chỉ dự phòng cho tính năng Later. — *(Mục 8)*
* [x] OQ-4: Quên mật khẩu / đặt lại / đổi mật khẩu có thuộc sản phẩm không? — **Chốt theo D-03 (`docs/product-decisions.md:7`, `docs/_product/prd.md:69`):** nằm ngoài MVP, xếp Later. — *(Mục 1 Boundary)*
* [x] OQ-5: Khu vực legacy (`/login`, `/dashboard`, form tiếng Anh, header Home/Dashboard) giữ hay gỡ? — **Chốt (#134):** gỡ bỏ hoàn toàn khu `_app-legacy` (`/login`, `/dashboard` và 6 component riêng: sign-in-form, sign-up-form, user-menu, header…) cùng ghi chú "kept unchanged" khỏi README. — *(FR-030, FR-031 đã xóa khỏi spec)*
* [x] OQ-6: Đăng nhập Google thuộc feature này hay feature riêng? — **Chốt theo D-03 / PRD F-02 (`docs/_product/prd.md:78`):** thuộc `auth-account`; ghi chú lỗi thời "Code hiện chỉ có email + mật khẩu" tại `docs/roadmap-work-items.md:22` đã được cập nhật (#134). — *(Mục 1 Scope)*
* [x] OQ-7: Priority P0/P1/P2 của toàn bộ FR/NFR, mục tiêu actor và KPI? — **Chốt (#134):** đã gán Priority và điền mục tiêu nghiệp vụ/KPI theo PRD Mục 1–2 trong `auth-account-reverse-spec.md` (Mục 2, 3, 4, 7). — *(Mục 3, 4)*
* [x] OQ-8: Người đã có phiên mở `/auth` có bị chuyển đi không? — **Chốt (#134):** route `/auth` tự chuyển người dùng đã có phiên VÀ đã hoàn tất onboarding (khi không có tham số `?error=`) sang `safeRedirect ?? "/app/dashboard"`; người chưa onboard vẫn mở được `/auth` để giữ nút "Quay lại" từ bước 1 của `/onboarding`. — *(FR-015)*
* [x] OQ-9: Route admin đẩy mọi lỗi kiểm tra quyền về `/app/dashboard` có chủ ý không? — **Chốt (#134):** là *fail-closed* an toàn có chủ ý (không lộ trạng thái quyền khi lỗi); đã bổ sung unit test cho hai route admin (#134). — *(FR-024)*
* [x] OQ-10: Guard onboarding "fail-open" có chấp nhận không? — **Chốt (#134):** giữ *fail-open* (không lưu cache khi lỗi) có chủ ý để tránh đá nhầm học viên cũ khi mạng chập chờn; kết hợp `newUserCallbackURL` đưa tài khoản Google mới vào thẳng `/onboarding` nên ca cho-quá chỉ xảy ra khi lỗi mạng ngắn. — *(FR-022, BR-024)*
* [x] OQ-11: Giới hạn độ dài/ký tự tên hiển thị? — **Chốt (#134):** đồng bộ `1..50` ký tự (sau `trim()`) ở cả ô `#auth-name` (`maxLength=50`) lẫn hook máy chủ `databaseHooks.user.{create,update}.before` qua `validateUserName` (`packages/auth/src/name-validation.ts`, lỗi `INVALID_NAME`). — *(FR-001, BR-003)*
* [x] OQ-12: Chống dò mật khẩu, khóa tài khoản sau N lần sai? — **Chốt (#134):** bật tường minh `rateLimit` in-memory của Better Auth — `3 lần/10s` cho `/sign-in*`, `/sign-up*` và `100 lần/10s` chung — đọc địa chỉ từ header `cf-connecting-ip`; giao diện hiển thị báo lỗi tiếng Việt khi gặp `429`; KHÔNG khóa cứng tài khoản (tránh bị lợi dụng DoS khi chưa có Quên mật khẩu theo D-03). Giới hạn kiến trúc: bộ đếm `memory` hoạt động theo từng Worker isolate (reset khi tạo isolate mới) và header `cf-connecting-ip` chỉ đáng tin khi lưu lượng đi qua domain được Cloudflare proxy (`api.vox.vinhtran.io.vn`). — *(NFR-006, BR-032)*
* [x] OQ-13: Google tài khoản mới luôn về `/app/dashboard`, không qua onboarding? — **Chốt (#134):** truyền `newUserCallbackURL` trỏ về `safeRedirect ?? "/onboarding"` cho Google OAuth để tài khoản Google mới vào thẳng `/onboarding`; tài khoản cũ vẫn về `callbackURL` (`safeRedirect ?? "/app/dashboard"`). — *(BR-002, FR-013)*
* [x] OQ-14: Nguồn chính thức của cam kết "Không cần thẻ thanh toán. Band tổng luôn miễn phí."? — **Chốt:** D-04 (`docs/product-decisions.md:8`) và PRD F-01/F-10/F-11 (`docs/_product/prd.md:77,103,106`) — miễn phí band tổng + bằng chứng câu yếu nhất, chi tiết 4 tiêu chí còn lại khóa sau paywall. — *(Mục 10, 11)*
* [x] OQ-15: Câu chữ INVALID_IMAGE ở UI và câu chữ kiểm tra trình duyệt? — **Chốt (#134):** câu chữ cho `INVALID_IMAGE` ở UI đổi ảnh thuộc feature `onboarding-profile` (không phải auth-account); trên form `/auth` các kiểm tra HTML5 gốc (required / type=email / minLength / maxLength) hiển thị theo ngôn ngữ trình duyệt của người dùng, không tự đặt câu chữ. — *(E-012, E-014)*
* [x] OQ-16: `desktopOrigins` — còn kế hoạch ứng dụng desktop không? — **Chốt (#134):** xóa tham số `desktopOrigins` khỏi `createAuth()`; v1 chỉ làm Web theo PRD 3.2 (`docs/_product/prd.md:69`). — *(NFR-002)*
* [x] OQ-17: Email không tồn tại có trả cùng lỗi với mật khẩu sai không? — **Chốt (#134):** đã xác minh trong mã `better-auth@1.7.12` (`sign-in.mjs`) và khóa bằng test tích hợp: email không tồn tại trả cùng `401 INVALID_EMAIL_OR_PASSWORD` như mật khẩu sai (chống dò email). — *(BR-006, FR-007)*
* [x] OQ-18: Thư viện có áp đúng SameSite=none/Secure/HttpOnly lên cookie phiên không? — **Chốt (#134):** đã xác minh trong mã `better-auth@1.7.12` (`cookies/index.mjs`) và khóa bằng test tích hợp: `Set-Cookie` chứa đủ `SameSite=None`, `Secure`, `HttpOnly`. — *(NFR-001)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Kết quả (#134) |
|----------|----------|--------------------------|----------------|
| G-1 Mục 4, 8, 11 | Mặc định của thư viện xác thực (độ dài mật khẩu, thời hạn phiên, thuật toán băm, chuỗi lỗi) | NFR bảo mật và FR-003 chỉ xác nhận được phía form | **Đã giải quyết (#134):** đối chiếu `better-auth@1.7.12` — mật khẩu máy chủ 8..128 + băm `scrypt`, phiên 7 ngày / gia hạn trượt 24h, `INVALID_EMAIL_OR_PASSWORD` / `USER_ALREADY_EXISTS` / `account_not_linked`, `defaultCookieAttributes` — đã ghi vào spec Mục 4, 8, 11 và khóa bằng test tích hợp |
| G-2 Mục 3 (Priority) | P0/P1/P2, mục tiêu actor, KPI | Không xếp ưu tiên được | **Đã giải quyết (#134):** gán theo PRD Mục 1–2 (OQ-7); xem spec Mục 2..4 |
| G-3 Mục 7 | Chỉ tiêu thành công | Không đo được | **Đã giải quyết (#134):** SC-01..03 có tiêu chí đo được neo PRD Mục 1 (spec Mục 7) |
| G-4 Mục 6 | Câu chữ kiểm tra trình duyệt (E-014) và thông điệp lỗi legacy (E-016) | Không có wording nguyên văn | **Đã giải quyết (#134):** E-014 chốt là câu chữ HTML5 do trình duyệt sinh (theo ngôn ngữ trình duyệt); các dòng lỗi legacy E-015/E-016 cũ đã xóa cùng khu legacy |
| G-5 Test | Thiếu test route `/auth`, hai route admin, 401 tải audio, `markUserOnboarded`, nhóm legacy | Chỉ dựa vào code | **Đã giải quyết (#134):** bổ sung test route `/auth` (chuyển hướng khi đã onboard), hai route admin, 401 điểm tải audio, `markUserOnboarded`; nhóm legacy gỡ bỏ cùng test của nó |
| G-6 Mục 3 | Test biên đúng 32.000 ký tự cho ảnh | Biên "lớn hơn" chưa khóa bằng test | **Đã giải quyết (#134):** đã bổ sung test biên đúng `32.000` ký tự (được chấp nhận) và `32.001` ký tự (bị từ chối) trong `packages/auth/src/image-validation.test.ts` |
| G-7 Mục 3 | Luồng đổi/quên mật khẩu, xác minh email, xóa tài khoản, xuất dữ liệu | Thiếu vòng đời tài khoản | **Đã giải quyết theo D-03 (`docs/_product/prd.md:69`):** ngoài MVP, xếp Later; xuất dữ liệu cá nhân thuộc `privacy-controls` |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Kết quả (#134) |
|------|-------------|-------------|----------------|
| C-1 Có đăng nhập Google hay không | Code cấu hình Google, có nút và test | `docs/roadmap-work-items.md:22` ghi "Code hiện chỉ có email + mật khẩu" | **Đã giải quyết (#134):** code là nguồn fact; doc roadmap lỗi thời đã sửa thành "Code đã có Google OAuth bên cạnh email + mật khẩu (D-03)" |
| C-2 Legacy có dead không | README nói giữ nguyên có chủ ý | Không có liên kết vào và không có test | **Đã giải quyết (#134):** khu legacy gỡ bỏ hoàn toàn (routes `_app-legacy`, 6 component, ghi chú README) — không còn mục cần phân xử |
| C-3 Điểm thoát sau đăng xuất | Hook mặc định điều hướng `/auth`; test cho phép đích tùy chọn | Menu legacy gọi hook mặc định nên người legacy về `/auth` | **Đã giải quyết (#134):** menu legacy gỡ bỏ; mọi nơi gọi sản phẩm dùng đích mặc định `/auth` của hook |
| C-4 Mô tả hook ảnh | Chú thích code nói hook dùng cho "sign-up email, /update-user" | Hook gắn trên mọi thao tác tạo/cập nhật user, gồm cả Google tạo user mới | **Đã giải quyết:** không phải mâu thuẫn hành vi — một quy tắc ảnh áp cho mọi tạo/cập nhật user (cơ chế hook xác nhận khi đọc `better-auth@1.7.12`); BR-017 giữ bản mô tả đầy đủ |

## 4. Inferred assumptions (suy đoán cần verify)

* ~~Mã `account_not_linked` do thư viện trả về khi email Google trùng email tài khoản mật khẩu chưa liên kết~~ — **Đã xác nhận (#134):** đọc mã `better-auth@1.7.12` khẳng định thư viện trả mã này; BR-008 / E-008 ✅.
* Quản trị viên được xác định chỉ bằng email, không có vai trò trong CSDL — **Đã xác nhận:** schema không có cột vai trò và RBAC theo danh sách `ADMIN_EMAILS` khớp ranh giới vai trò ở PRD Mục 2.2 (`docs/_product/prd.md:31-35`). Chuyển ✅.
* ~~Mật khẩu được lưu trong cột của tài khoản đăng nhập dưới dạng đã băm~~ — **Đã xác nhận (#134):** `account.password` lưu băm `scrypt` (`better-auth@1.7.12`). Chuyển ✅.
* ~~Khu legacy là scaffold từ template khởi tạo~~ — **Đã giải quyết (#134):** khu legacy gỡ bỏ hoàn toàn; giả định không còn cần thiết.

<details>
<summary>Negative-search (pattern + scope đã grep — mục N-2, N-4..N-8 hết hiệu lực sau #134)</summary>

* **N-1** Quên/đặt lại/đổi mật khẩu, xác minh email, magic link: pattern `forgot|reset-password|resetPassword|quên mật khẩu|verify-email|emailVerification|magic` trong `apps` và `packages` (`*.ts`, `*.tsx`, trừ `node_modules`) → chỉ khớp test khẳng định "no magic link". Không có cấu hình gửi email trong `packages/auth/src/index.ts`. Vẫn đúng sau #134 (D-03 xếp Later). Loại: code-câm.
* **N-2** Chuyển hướng khi đã có phiên ở `/auth`: tại thời điểm reverse ban đầu route `/auth` không kiểm tra phiên. **#134:** route đã tự chuyển người có phiên + đã onboard (OQ-8) — mục này hết hiệu lực.
* **N-3** Bảng `verification`: không có luồng dùng trong code sản phẩm; bảng do thư viện tạo và dự phòng cho các tính năng Later theo D-03 (xác minh email, quên/đổi mật khẩu). Loại: dead-code-nghi (đã ghi nhận trong spec Mục 8).
* **N-4** Liên kết vào khu legacy: không có liên kết từ giao diện chính và không có test. **#134:** khu legacy gỡ bỏ hoàn toàn — mục này hết hiệu lực.
* **N-5** Nơi truyền `desktopOrigins`: không thấy nơi gọi truyền tham số. **#134:** tham số xóa khỏi `createAuth()` (OQ-16) — mục này hết hiệu lực.
* **N-6** Gọi `clearOnboardedUserCache` / `markUserOnboarded`: tại thời điểm reverse chỉ có trong test/mock. **#134:** `clearOnboardedUserCache` được gọi khi đăng xuất thành công; `markUserOnboarded` được gọi ngay khi hoàn tất onboarding — mục này hết hiệu lực.
* **N-7** Test route admin: chưa có test cho `beforeLoad` hai route admin. **#134:** đã bổ sung unit test (OQ-9) — mục này hết hiệu lực.
* **N-8** Giới hạn tốc độ: không thấy cấu hình. **#134:** `rateLimit` bật tường minh (OQ-12) — mục này hết hiệu lực.
* **N-9** `it.skip|it.todo|describe.skip|xit(` trong các test của feature → không có. Không có test bị bỏ qua.
* **N-10** Cờ tính năng: `apps/web/src/lib/feature-flags.ts` chỉ có `scoring` và `billing`; không cờ nào điều khiển đăng nhập/đăng ký. Cờ `SCORE_DISPUTE_ENABLED` không liên quan feature này.

</details>
