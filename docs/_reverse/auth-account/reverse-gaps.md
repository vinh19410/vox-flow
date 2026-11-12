# auth-account — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Chính sách mật khẩu phía máy chủ (tối thiểu, tối đa, độ mạnh) là gì? Form chỉ ràng buộc ≥ 8 ký tự ở chế độ đăng ký (apps/web/src/features/auth/auth-screen.tsx:228) và code máy chủ không đặt tham số nào (packages/auth/src/index.ts:34-37). — *(liên quan: Mục 3 FR-003, Mục 11 Assumptions · cần: PO/dev quyết)* — blocking
* [ ] OQ-2: Thời hạn phiên và cookie (có "ghi nhớ đăng nhập" không)? Không cấu hình trong repo. — *(Mục 4 NFR-006, States · cần: PO/dev)* — blocking
* [ ] OQ-3: Có cần xác minh email khi đăng ký? Cờ xác minh mặc định "chưa" (packages/db/src/schema/auth.ts:8) và không có luồng gửi email. — *(Mục 8 · cần: PO)* — blocking
* [ ] OQ-4: Quên mật khẩu / đặt lại / đổi mật khẩu có thuộc sản phẩm không? Hiện không có (N-1). — *(Mục 1 Boundary · cần: PO)* — blocking
* [ ] OQ-5: Khu vực legacy (`/login`, `/dashboard`, form tiếng Anh, header Home/Dashboard) giữ hay gỡ? README ghi "kept unchanged" (README.md:129) nhưng không có liên kết vào từ giao diện chính (N-4) và không có test. — *(Mục 3 FR-030, FR-031 · cần: PO/dev)* — blocking
* [ ] OQ-6: Đăng nhập Google thuộc feature này hay feature riêng (WI-07 trong docs/roadmap-work-items.md:22 ghi "Code hiện chỉ có email + mật khẩu")? Code có Google (C-1). — *(Mục 1 Scope · cần: PO)* — blocking
* [ ] OQ-7: Priority P0/P1/P2 của toàn bộ FR/NFR (code không có). — *(Mục 3, 4 · cần: PO)* — blocking
* [ ] OQ-8: Người đã có phiên mở `/auth` có cần bị chuyển đi (vào dashboard) không? Hiện route `/auth` không kiểm tra phiên (N-2). — *(Mục 3 FR-015 · cần: PO/UX)*
* [ ] OQ-9: Route admin: mọi lỗi của bước kiểm tra quyền (kể cả lỗi mạng hoặc máy chủ) đều đẩy về `/app/dashboard` (apps/web/src/routes/admin/disputes.tsx:20-24) — có chủ ý không? Không có test cho hai route này (N-7). — *(Mục 3 FR-024 · cần: dev)*
* [ ] OQ-10: Guard onboarding "fail-open" khi lỗi tải hồ sơ hoặc dịch vụ hồ sơ không khả dụng (apps/web/src/lib/auth-guard.ts:35,62-67) — chấp nhận rủi ro cho qua người chưa onboarding không? Test xác nhận hành vi nhưng không nói lý do. — *(FR-022 · cần: PO)*
* [ ] OQ-11: Tên hiển thị: giới hạn độ dài/ký tự hợp lệ? Màn hình chính chỉ bắt buộc nhập (apps/web/src/features/auth/auth-screen.tsx:196), legacy yêu cầu ≥ 2 ký tự (apps/web/src/components/sign-up-form.tsx:47). — *(FR-001, BR-003 · cần: PO)*
* [ ] OQ-12: Chống dò mật khẩu (giới hạn tốc độ), khóa tài khoản sau N lần sai: không thấy cấu hình (N-8). Có yêu cầu không? — *(NFR-006 · cần: PO/security)*
* [ ] OQ-13: Sau đăng nhập Google luôn về `/app/dashboard` kể cả tài khoản Google mới (không qua `/onboarding`); guard onboarding sẽ chặn sau đó. Có chủ ý không? (apps/web/src/features/auth/auth-screen.tsx:73,97) — *(BR-002 · cần: PO)*
* [ ] OQ-14: Thông điệp "Không cần thẻ thanh toán. Band tổng luôn miễn phí." (apps/web/src/features/auth/auth-screen.tsx:154) là cam kết kinh doanh — nguồn chính thức nằm ở đâu? — *(Mục 10 · cần: PO)*
* [ ] OQ-15: Câu chữ khi người dùng gặp INVALID_IMAGE ở UI hồ sơ (thuộc `onboarding-profile`) và câu chữ kiểm tra gốc của trình duyệt trên form `/auth` chưa resolve. — *(E-012, E-014 · cần: dev/UX)*
* [ ] OQ-16: Tham số nguồn desktop (`desktopOrigins`) của hàm tạo auth chưa thấy nơi truyền vào (N-5): còn kế hoạch dùng ứng dụng desktop không? — *(NFR-002 · cần: dev)*
* [ ] OQ-17: Đăng nhập bằng email không tồn tại có trả cùng lỗi với mật khẩu sai không (chống dò email)? Test chỉ có ca mật khẩu sai (packages/api/src/test/auth.test.ts:195-221); phần còn lại là hành vi thư viện. — *(BR-006, FR-007 · cần: dev/security)*
* [ ] OQ-18: Thư viện có áp đúng SameSite=none/Secure/HttpOnly khai báo (packages/auth/src/index.ts:74-80) lên cookie phiên không? Test chỉ kiểm tên cookie (packages/api/src/test/auth.test.ts:160). — *(NFR-001 · cần: dev)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| G-1 Mục 4, 11 | Mặc định của thư viện xác thực (độ dài mật khẩu, thời hạn phiên, thuật toán băm mật khẩu, chuỗi lỗi `INVALID_EMAIL_OR_PASSWORD`/`USER_ALREADY_EXISTS`/`account_not_linked`) — thư viện nằm ngoài repo và không đọc được | NFR bảo mật và FR-003 chỉ xác nhận được phía form | dev đọc tài liệu thư viện và ghi lại (kể cả việc áp `defaultCookieAttributes` và lỗi cho email không tồn tại) |
| G-2 Mục 3 (Priority) | P0/P1/P2, mục tiêu nghiệp vụ của từng actor người, KPI cho đăng ký/đăng nhập | Không xếp ưu tiên được; SC-01..03 chỉ là 🟡 | PO |
| G-3 Mục 7 | Chỉ tiêu thành công (tỷ lệ đăng ký thành công, thời gian đăng nhập) | Không đo được | PO |
| G-4 Mục 6 | Câu chữ kiểm tra gốc của trình duyệt cho `required` / `type=email` / `minLength` (E-014) và thông điệp lỗi legacy từ máy chủ (E-016) | Không có wording nguyên văn | dev/UX |
| G-5 Test | Không có test cho: route `/auth` (validate query), hai route admin, mã 401 của điểm tải xuống audio (apps/server/src/index.test.ts chỉ phủ tải lên), nhóm legacy (form, header, user-menu, route `/login`), `markUserOnboarded`; không có e2e | Hành vi các phần này chỉ dựa vào code, không có kiểm chứng tự động | dev |
| G-6 Mục 3 | Không có test biên cho độ dài ảnh đúng 32.000 ký tự | Biên "lớn hơn" chưa được khóa bằng test | dev |
| G-7 Mục 3 | Luồng đổi/quên mật khẩu, xác minh email, xóa tài khoản, xuất dữ liệu cá nhân | Thiếu vòng đời tài khoản (có thể liên quan feature privacy-controls) | PO |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| C-1 Có đăng nhập Google hay không | Code cấu hình Google và có nút + test: packages/auth/src/index.ts:38-43; apps/web/src/features/auth/auth-screen.tsx:91-116; apps/web/src/features/__tests__/slice-a.test.tsx:661-717 | docs/roadmap-work-items.md:22 ghi "Code hiện chỉ có email + mật khẩu", trạng thái 🔒 | Đã kiểm lại bằng cite thật: cấu hình Google packages/auth/src/index.ts:38-43, nút Google apps/web/src/features/auth/auth-screen.tsx:162-179, test OAuth packages/api/src/test/auth.test.ts:10,31-57 (tiêu đề test nhắc WI-07). Code là nguồn fact; doc chỉ để đối chiếu. KHÔNG tự chọn bên về ý định sản phẩm — OQ-6 |
| C-2 Legacy có dead không | README.md:129 nói khu legacy được giữ nguyên có chủ ý | Không có liên kết từ giao diện chính vào `/login`, `/dashboard` và không có test (N-4) | Route vẫn được đăng ký trong cây route (apps/web/src/routeTree.gen.ts:44-48) nên truy cập trực tiếp bằng URL vẫn chạy — không phải dead theo nghĩa kỹ thuật; 🟡 về ý định — OQ-5 |
| C-3 Điểm thoát sau đăng xuất | Hook mặc định điều hướng `/auth` (apps/web/src/hooks/use-sign-out.ts:10) và mọi nơi gọi trong giao diện chính dùng mặc định | Test cho phép đích tùy chọn `/login` (apps/web/src/hooks/__tests__/use-sign-out.test.tsx:79-90) và menu legacy cũng gọi hook mặc định (apps/web/src/components/user-menu.tsx:18) nên người dùng legacy đăng xuất sẽ về `/auth` chứ không về `/login` | Hành vi thực tế của legacy là đăng xuất về `/auth`. Test `/login` không phản ánh nơi gọi thật |
| C-4 Mô tả hook ảnh | Chú thích trong code nói kiểm tra ảnh dùng cho "sign-up email, /update-user" (packages/auth/src/image-validation.ts:13) | Hook gắn trên mọi thao tác tạo/cập nhật user, gồm cả khi Google tạo user mới (suy ra 🔵 từ cơ chế hook tạo user, packages/auth/src/index.ts:46-72) | Cùng một quy tắc; ảnh Google https được chấp nhận. Không mâu thuẫn hành vi, chỉ lệch mô tả |

## 4. Inferred assumptions (suy đoán cần verify)

* Mã `account_not_linked` do thư viện trả về khi email Google trùng email tài khoản mật khẩu chưa liên kết — *validate: đọc tài liệu thư viện hoặc chạy thử đăng nhập Google với email đã đăng ký mật khẩu · nếu sai: BR-008/E-008 hiển thị sai ngữ cảnh* 🟡 (chỉ có phía hiển thị: apps/web/src/features/auth/auth-screen.tsx:85-86 và test UI apps/web/src/features/__tests__/slice-a.test.tsx:726-729; test server packages/api/src/test/auth.test.ts:223-255 chỉ phủ đăng ký email trùng, không phủ Google)
* Quản trị viên được xác định chỉ bằng email, không có vai trò trong CSDL — *validate: hỏi PO · nếu sai: BR-018 và NFR bảo mật cần thêm vai trò* 🔵 (hậu thuẫn: packages/api/src/index.ts:32-33; packages/api/src/auth-utils.ts:1-13; schema không có cột vai trò packages/db/src/schema/auth.ts:4-17)
* Mật khẩu được lưu trong cột của tài khoản đăng nhập dưới dạng đã băm — *validate: đọc tài liệu thư viện · nếu sai: rủi ro lưu mật khẩu thô* 🟡 (code chỉ thấy cột `password`: packages/db/src/schema/auth.ts:59)
* Khu legacy là scaffold từ template khởi tạo — *validate: lịch sử commit `git log -- apps/web/src/routes/_app-legacy` (commit 95b4456 "clone vox-flow-prototype UI", 572b79f "extract shared useSignOut hook") · nếu sai: có thể còn người dùng thật* 🟡 (ý định giữ lại chưa có bằng chứng ngoài README.md:129)

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

* **N-1** Quên/đặt lại/đổi mật khẩu, xác minh email, magic link: pattern `forgot|reset-password|resetPassword|quên mật khẩu|verify-email|emailVerification|magic` trong `apps` và `packages` (`*.ts`, `*.tsx`, trừ `node_modules`) → chỉ khớp 1 file `apps/web/src/features/__tests__/slice-a.test.tsx` (test khẳng định "no magic link", dòng 447-457). Không có cấu hình gửi email trong `packages/auth/src/index.ts`. Loại: code-câm.
* **N-2** Chuyển hướng khi đã có phiên ở `/auth`: pattern `useSession|getSession|beforeLoad` trong `apps/web/src/routes/_proto/auth.tsx` và `apps/web/src/features/auth/auth-screen.tsx` → không khớp. Loại: code-câm.
* **N-3** Bảng `verification`: pattern `\bverification\b` trong `apps` và `packages` (`*.ts`, `*.tsx`) loại trừ schema và test → chỉ khớp `packages/api/src/data-registry.ts:248-249` (mô tả "token OTP/email tạm thời") và một chú thích không liên quan trong `packages/api/src/scoring/prompt.ts:59`. Có trong snapshot migration. Loại: dead-code-nghi (bảng do thư viện yêu cầu).
* **N-4** Liên kết vào khu legacy: pattern `"/login"`, `'/login'`, `/login\b` trong `apps/web/src` (`*.ts`, `*.tsx`) → chỉ khớp bên trong khu legacy (`routes/_app-legacy/login.tsx`, `routes/_app-legacy/_auth/route.tsx`, `components/sign-in-form.tsx`, `components/sign-up-form.tsx`, `components/user-menu.tsx`), `features/auth/auth-screen.tsx:34` (chỉ để chặn redirect), và test `hooks/__tests__/use-sign-out.test.tsx`. Pattern `components/header`, `user-menu`, `sign-in-form`, `sign-up-form` chỉ được import trong khu legacy. Không có test cho khu legacy. Loại: dead-code-nghi.
* **N-5** Nơi truyền `desktopOrigins`: pattern `desktopOrigins|createAuth\(` trong `apps`, `packages` (trừ test, `node_modules`) → hàm gọi ở `apps/server/src/services.ts:10` chỉ truyền 2 tham số, nên danh sách luôn rỗng. Loại: dead-code-nghi.
* **N-6** Gọi `clearOnboardedUserCache` / `markUserOnboarded`: pattern cả hai trong `apps/web/src` → ngoài `lib/auth-guard.ts` chỉ khớp trong test (`auth-guard.test.ts`, `route-guards.test.ts`, mock ở `select-setup-route.test.tsx:22-23`). `markUserOnboarded` không có caller sản phẩm. Loại: dead-code-nghi.
* **N-7** Test route admin: pattern `routes/admin|/admin/disputes|/admin/forecast` trong `apps/web/src/**/__tests__` → chưa tìm thấy test cho `beforeLoad` hai route admin (đã đọc các test guard hiện có: `auth-guard.test.ts`, `route-guards.test.ts`). Loại: test-thiếu.
* **N-8** Giới hạn tốc độ: pattern `rateLimit|rate_limit` trong `apps`, `packages` (`*.ts`) → không khớp. Loại: code-câm.
* **N-9** `it.skip|it.todo|describe.skip|xit(` trong các test của feature (slice-a, hooks, lib, layouts, packages/auth, packages/api/src/test/auth.test.ts, auth-utils.test.ts) → không có. Không có test bị bỏ qua.
* **N-10** Cờ tính năng: `apps/web/src/lib/feature-flags.ts:1-4` chỉ có `scoring` và `billing`; không cờ nào điều khiển đăng nhập/đăng ký. Cờ `SCORE_DISPUTE_ENABLED` không liên quan feature này.

</details>
