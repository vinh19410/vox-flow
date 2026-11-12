---
type: reverse-srs
feature: auth-account
status: draft
updated: 2026-11-11
confidence_summary: "✅88 🔵0 🟡29"
links:
  - reverse-sources.md
  - reverse-gaps.md
  - _evidence.md
  - srs/auth-account-reverse-flows.md
  - srs/auth-account-reverse-states.md
  - srs/auth-account-reverse-erd.md
  - usecases/auth-account-reverse-usecase-index.md
---

# auth-account — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập từ code, **CHƯA duyệt**). Nhãn: ✅ chắc chắn (code/test khẳng định) · 🔵 suy đoán có ≥2 chỗ code hậu thuẫn · 🟡 cần xác nhận (code không nói). Priority luôn 🟡 vì code không có P0/P1/P2.

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái duyệt:** CHƯA duyệt. Toàn bộ nội dung là bản tái lập từ source code và test, chờ BA/PO xác nhận.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md) (S1..S23).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Quy ước cite:** `[S?: đường-dẫn-repo:dòng]` đặt ở cột Nguồn. Tên endpoint/hàm/bảng chỉ xuất hiện ở cột Nguồn, `_evidence.md` và ERD, không nằm trong prose FR/BR.
- **Phạm vi đọc:** repo `/root/projects/vox-flow` (read-only). Mặc định của thư viện xác thực bên thứ ba không đọc được (xem Gap G-1) nên không được khẳng định ✅.
- **Audit độc lập:** đã chạy 2026-11-11, hạ 10 claim, sửa 3 cite.

### 0.3 Khác biệt với tài liệu chính (chỉ khi feature trùng doc hiện có)

| Điểm | Reverse nói (từ nguồn) | Doc chính nói (`docs/roadmap-work-items.md` mục 07, chỉ tham khảo) | Đề xuất |
|------|------------------------|---------------------------------------------------------------------|---------|
| Đăng nhập Google | Code CÓ nút "Tiếp tục với Google" và cấu hình nhà cung cấp Google (S1:38-43, S3:162-179), có test (S17:661-717) | Ghi "Code hiện chỉ có email + mật khẩu" và trạng thái 🔒 (S23) | `/gap` — doc roadmap lỗi thời so với code, hỏi PO (OQ-6) |

## 1. Scope

Feature `auth-account` đặc tả việc học viên và quản trị viên **tạo tài khoản, đăng nhập, đăng xuất** và việc hệ thống **chặn truy cập** vào các khu vực cần tài khoản.

- Đăng ký tài khoản bằng email + mật khẩu + tên hiển thị; sau đăng ký hệ thống tự đăng nhập. ✅ [S1:34-37; S3:128]
- Đăng nhập bằng email + mật khẩu trên cùng một màn hình với đăng ký (chuyển qua lại giữa hai chế độ). ✅ [S3:118-148]
- Đăng nhập bằng tài khoản Google nằm trên cùng màn hình; được mô tả ở mức vừa đủ vì dùng chung màn hình, thông báo lỗi và luồng chuyển hướng. ✅ [S3:91-116; S1:38-43] — việc có tách thành feature riêng hay không là 🟡 (OQ-6).
- Đăng xuất từ nhiều điểm vào; thất bại thì giữ nguyên người dùng ở trang hiện tại. ✅ [S6:16-30]
- Bảo vệ route phía giao diện: yêu cầu phiên, yêu cầu đã hoàn tất onboarding, và yêu cầu quyền quản trị cho khu vực admin. ✅ [S5:24-70; S8; S9]
- Bảo vệ phía máy chủ: thủ tục API riêng tư yêu cầu phiên; thủ tục quản trị yêu cầu email nằm trong danh sách admin. ✅ [S11: packages/api/src/index.ts:15-45]
- Quy tắc hợp lệ của ảnh đại diện tại thời điểm tạo/cập nhật tài khoản. ✅ [S1:46-72; S2:17-31] (phần chỉnh sửa hồ sơ/avatar do feature `onboarding-profile` sở hữu — tham chiếu chéo, không đặc tả lại màn hình hồ sơ).
- Khu vực "legacy scaffold" (route `/login`, `/dashboard` cũ với form tiếng Anh): mô tả ở mức nghi dead-code, KHÔNG viết như hành vi chắc. 🟡 [S13]

**Boundary (out of scope — code không có hoặc thuộc feature khác):**

- Quên mật khẩu / đặt lại mật khẩu, đổi mật khẩu, xóa tài khoản, xác minh email, đăng nhập bằng liên kết/magic link, xác thực hai lớp: không tìm thấy trong code (negative-search ở `reverse-gaps.md` mục N-1). Test còn khẳng định "no magic link" cho màn hình đăng nhập. ✅ [S17: apps/web/src/features/__tests__/slice-a.test.tsx:456]
- Màn hình hồ sơ, chọn avatar, onboarding: feature `onboarding-profile`.
- Cổng khai trương (launch gate theo `LAUNCH_OPEN`/`LAUNCH_ALLOWED_EMAILS`) và quyền sở hữu attempt: feature `mock-exam`.
- Quyền truy cập audio của quản trị viên khi có đồng ý chia sẻ: chỉ trích quy tắc nền ở BR-auth-account-020, chi tiết thuộc `dispute-admin`/`mock-exam`.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Khách (chưa có phiên) | người | Tạo tài khoản hoặc đăng nhập để vào ứng dụng (suy ra từ màn hình, không có tài liệu mục tiêu) | Có | S3:53-275; S5:24-33 | 🟡 |
| Học viên (đã có phiên) | người | Dùng ứng dụng, đăng xuất khi cần (suy ra từ luồng, không có tài liệu mục tiêu) | Có | S6:10-31; S15 | 🟡 |
| Quản trị viên (email nằm trong danh sách admin) | người | Vào khu vực quản trị (suy ra từ tên route, không có tài liệu mục tiêu) | Có (chỉ phần kiểm soát truy cập) | S9; S11: packages/api/src/index.ts:31-45 | 🟡 |
| Máy chủ xác thực (Worker) | hệ thống | Cấp, kiểm tra và hủy phiên; lưu tài khoản | Có | S10: apps/server/src/index.ts:50; S1:28-82 | ✅ |
| Dịch vụ đăng nhập Google | ngoài | Xác thực danh tính người dùng Google | Có (mô tả tối thiểu) | S1:38-43; S17:661-678 | ✅ |
| Dịch vụ tải hồ sơ onboarding (profile) | hệ thống | Cho biết học viên đã hoàn tất onboarding chưa | Có (phụ thuộc của guard) | S5:50-60 | ✅ |
| Người dùng khu vực legacy | người | Dùng form đăng nhập/đăng ký bản cũ | 🟡 nghi dead | S13 | 🟡 |
| Chủ sản phẩm / BA | người | Duyệt đặc tả, quyết định các OQ | Không (stakeholder) | — | 🟡 |

## 3. Functional Requirements (FR)

> Cột Priority: toàn bộ 🟡 `<!-- TBD -->` (code không có P0/P1/P2). Cột Verify by là cách kiểm chứng gợi ý dựa trên test hiện có.

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-auth-account-001 | Đăng ký bằng email + mật khẩu + tên hiển thị | Khách điền Tên hiển thị, Email, Mật khẩu rồi bấm "Tạo tài khoản". Hệ thống tạo tài khoản với tên và email đã được cắt khoảng trắng đầu/cuối; mật khẩu giữ nguyên. | 🟡 TBD | test | S3:124-128,187-203,238-245; S17: apps/web/src/features/__tests__/slice-a.test.tsx:545-568 | ✅ |
| FR-auth-account-002 | Tự đăng nhập sau đăng ký | Đăng ký thành công thì hệ thống cấp luôn phiên đăng nhập (không bắt đăng nhập lại) và trả về token phiên. | 🟡 TBD | test | S1:34-37; S20: packages/api/src/test/auth.test.ts:59-87 | ✅ |
| FR-auth-account-003 | Gợi ý và ràng buộc độ dài mật khẩu khi đăng ký (phía giao diện) | Ở chế độ đăng ký, ô mật khẩu yêu cầu tối thiểu 8 ký tự và hiển thị dòng gợi ý "Tối thiểu 8 ký tự."; ở chế độ đăng nhập không đặt ràng buộc độ dài. Giá trị tối thiểu/tối đa do máy chủ áp dụng: code không nói <!-- TBD --> (OQ-1). | 🟡 TBD | test | S3:226-236; S17: apps/web/src/features/__tests__/slice-a.test.tsx:553 | ✅ |
| FR-auth-account-004 | Từ chối email đã tồn tại | Đăng ký với email đã có tài khoản (kể cả tài khoản được tạo qua Google) bị từ chối; màn hình hiển thị "Email đã được sử dụng." và không chuyển trang. | 🟡 TBD | test | S3:43; S20: packages/api/src/test/auth.test.ts:223-284; S17: apps/web/src/features/__tests__/slice-a.test.tsx:596-610 | ✅ |
| FR-auth-account-005 | Chuyển trang sau đăng ký | Sau đăng ký thành công, trình duyệt tải lại toàn trang tới đường dẫn đích hợp lệ do khách yêu cầu; nếu không có thì tới `/onboarding`. | 🟡 TBD | test | S3:74,136-138; S17: apps/web/src/features/__tests__/slice-a.test.tsx:545-593 | ✅ |
| FR-auth-account-006 | Đăng nhập bằng email + mật khẩu | Khách điền Email, Mật khẩu rồi bấm "Đăng nhập". Email được cắt khoảng trắng; mật khẩu giữ nguyên. | 🟡 TBD | test | S3:124-127,205-245; S17: apps/web/src/features/__tests__/slice-a.test.tsx:492-508 | ✅ |
| FR-auth-account-007 | Từ chối thông tin đăng nhập sai | Mật khẩu sai khiến máy chủ trả mã lỗi `INVALID_EMAIL_OR_PASSWORD` (HTTP 401, có test); màn hình hiển thị "Sai email hoặc mật khẩu." và không chuyển trang, nút đăng nhập hoạt động lại. Trường hợp email không tồn tại chưa có test và là hành vi thư viện nên chưa xác nhận (🟡, OQ-17). | 🟡 TBD | test | S3:42; S20: packages/api/src/test/auth.test.ts:195-221; S17: apps/web/src/features/__tests__/slice-a.test.tsx:510-526 | ✅ |
| FR-auth-account-008 | Chuyển trang sau đăng nhập | Sau đăng nhập thành công, trình duyệt tải lại toàn trang tới đường dẫn đích hợp lệ do khách yêu cầu; nếu không có thì tới `/app/dashboard`. | 🟡 TBD | test | S3:20,73,136-138; S17: apps/web/src/features/__tests__/slice-a.test.tsx:492-508 | ✅ |
| FR-auth-account-009 | Chỉ chấp nhận đích chuyển trang nội bộ an toàn | Đường dẫn đích (tham số redirect) chỉ được dùng khi bắt đầu bằng "/", không bắt đầu bằng "//", không bắt đầu bằng "/\", không bắt đầu bằng "/auth" và không bắt đầu bằng "/login"; ngược lại bị bỏ qua và dùng đích mặc định. | 🟡 TBD | test | S3:27-39; S17: apps/web/src/features/__tests__/slice-a.test.tsx:612-643,700-717 | ✅ |
| FR-auth-account-010 | Chuyển đổi chế độ đăng nhập ↔ đăng ký | Một nút chuyển qua lại giữa "Chưa có tài khoản? Đăng ký" và "Đã có tài khoản? Đăng nhập"; khi chuyển, thông báo lỗi cục bộ bị xóa, các giá trị đã nhập (email, mật khẩu, tên) được giữ nguyên. Mặc định mở ở chế độ đăng nhập. | 🟡 TBD | test | S3:66,145-148,248-255; S17: apps/web/src/features/__tests__/slice-a.test.tsx:552-554 | ✅ |
| FR-auth-account-011 | Khóa thao tác khi đang xử lý | Khi một yêu cầu đăng nhập/đăng ký/Google đang chạy, mọi ô nhập và nút trên màn hình bị vô hiệu hóa và các lần bấm/gửi thêm bị bỏ qua; khi lỗi thì mở khóa lại. | 🟡 TBD | test | S3:71,92,120,165,199,216,240,251; S17: apps/web/src/features/__tests__/slice-a.test.tsx:523-525,763 | ✅ |
| FR-auth-account-012 | Thông báo lỗi tổng quát | Lỗi đăng nhập/đăng ký có mã không nhận diện được hiển thị câu chung theo chế độ ("Đăng nhập không thành công. Vui lòng thử lại." hoặc "Đăng ký không thành công. Vui lòng thử lại."); lỗi kết nối/ngoại lệ hiển thị "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau."; không chuyển trang. | 🟡 TBD | test | S3:44-46,139-142; S17: apps/web/src/features/__tests__/slice-a.test.tsx:528-543,646-658 | ✅ |
| FR-auth-account-013 | Đăng nhập bằng Google | Nút "Tiếp tục với Google" yêu cầu chuyển khách sang Google; giao diện truyền đích thành công là đích hợp lệ (mặc định `/app/dashboard`) và đích lỗi/hủy là `/auth` (giữ tham số redirect hợp lệ). Việc thư viện thực sự chuyển hướng đúng như vậy là 🟡 (G-1). Khi nhấn, nút hiển thị "Đang kết nối...". Lỗi trả về ngay hiển thị "Đăng nhập Google không thành công. Vui lòng thử lại."; ngoại lệ hiển thị câu lỗi kết nối. | 🟡 TBD | test | S3:91-116,162-179; S1:38-43; S17: apps/web/src/features/__tests__/slice-a.test.tsx:661-717,744-764 | ✅ |
| FR-auth-account-014 | Hiển thị lỗi Google từ địa chỉ trang | Khi trang `/auth` được mở với tham số lỗi: giá trị `account_not_linked` hiển thị "Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu."; mọi giá trị khác hiển thị "Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại."; lỗi cục bộ (nếu có) được ưu tiên hơn. Nếu tham số lỗi lặp lại (mảng) thì lấy phần tử đầu. | 🟡 TBD | test | S3:75-89; S4:6-17; S17: apps/web/src/features/__tests__/slice-a.test.tsx:719-742 | ✅ |
| FR-auth-account-015 | Màn hình nhận tham số redirect/error | Route `/auth` chấp nhận hai tham số tùy chọn `error` và `redirect`; `redirect` không phải chuỗi thì bị bỏ. | 🟡 TBD | kiểm tra | S4:5-17 | ✅ |
| FR-auth-account-016 | Đăng xuất | Người dùng chọn Đăng xuất: hệ thống hủy phiên; thành công thì xóa dữ liệu trạng thái prototype lưu trong phiên trình duyệt rồi điều hướng tới `/auth` (có thể truyền đích khác). Hủy phiên thất bại (HTTP lỗi hoặc lỗi mạng) thì hiện toast "Đăng xuất thất bại. Vui lòng thử lại." và ở nguyên trang, không điều hướng. | 🟡 TBD | test | S6:8-31; S19: apps/web/src/hooks/__tests__/use-sign-out.test.tsx:37-90 | ✅ |
| FR-auth-account-017 | Các điểm vào đăng xuất | Đăng xuất khả dụng ở: thẻ người dùng sidebar (nút "Đăng xuất"), thanh điều hướng dưới (mobile), màn hình hồ sơ, và menu người dùng của khu vực legacy. | 🟡 TBD | test | S15; S19: apps/web/src/layouts/__tests__/user-card.test.tsx:139; apps/web/src/layouts/__tests__/bottom-nav.test.tsx:148 | ✅ |
| FR-auth-account-018 | Reset trạng thái học viên khi mất phiên | Khi không còn người dùng đăng nhập, trạng thái ứng dụng phía học viên được đặt về ban đầu nhưng giữ lại hai tùy chọn giao diện (mode, voice); khi phiên đang tải thì không đụng tới trạng thái. | 🟡 TBD | test | S16: apps/web/src/features/app-state/use-profile-hydration.ts:30-40; S18: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:132,186 | ✅ |
| FR-auth-account-019 | Route cần phiên: chuyển về đăng nhập | Trang `/onboarding` yêu cầu có phiên. Không có phiên (hoặc kiểm tra phiên gặp lỗi mạng) thì chuyển tới `/auth` kèm tham số redirect bằng địa chỉ trang đang định vào. | 🟡 TBD | test | S5:24-33; S8: apps/web/src/routes/_proto/onboarding.tsx:9; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:24-74; apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:31 | ✅ |
| FR-auth-account-020 | Route cần phiên + đã onboarding | Các trang `/app/*`, `/exam`, `/scoring` yêu cầu có phiên; không có phiên thì xử lý như FR-auth-account-019. Có phiên nhưng chưa có hồ sơ hoặc hồ sơ chưa hoàn tất onboarding thì chuyển tới `/onboarding` (không kèm tham số). | 🟡 TBD | test | S5:41-56; S8: apps/web/src/routes/_proto/app/route.tsx:7; apps/web/src/routes/_proto/exam.tsx:7; apps/web/src/routes/_proto/scoring.tsx:7; S18: apps/web/src/lib/__tests__/route-guards.test.ts:44-99 | ✅ |
| FR-auth-account-021 | Ghi nhớ trạng thái đã onboarding trong phiên làm việc | Sau khi xác nhận một học viên đã onboarding, hệ thống nhớ trong bộ nhớ trình duyệt và các lần vào trang được bảo vệ sau đó không hỏi lại hồ sơ. | 🟡 TBD | test | S5:10,45-47,57-59; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:188-215 | ✅ |
| FR-auth-account-022 | Cho qua khi không kiểm tra được hồ sơ | Nếu việc tải hồ sơ onboarding gặp lỗi không phải chuyển hướng (vd lỗi máy chủ), hệ thống vẫn cho học viên có phiên đi tiếp và ghi cảnh báo ở console; nếu dịch vụ tải hồ sơ không khả dụng thì cũng cho qua. | 🟡 TBD | test | S5:49-70; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:217-237 | ✅ |
| FR-auth-account-023 | Trang onboarding đẩy học viên đã xong sang dashboard | Học viên có phiên và đã hoàn tất onboarding mở `/onboarding` thì bị chuyển tới `/app/dashboard`; lỗi khi tải hồ sơ ở bước này bị bỏ qua. | 🟡 TBD | test | S8: apps/web/src/routes/_proto/onboarding.tsx:11-24; S18: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:47,70 | ✅ |
| FR-auth-account-024 | Khu vực quản trị | Các trang `/admin/disputes` và `/admin/forecast`: không có phiên thì chuyển `/auth`; có phiên nhưng bước kiểm tra quyền quản trị phía máy chủ ném bất kỳ lỗi nào thì chuyển `/app/dashboard`. | 🟡 TBD | kiểm tra | S9: apps/web/src/routes/admin/disputes.tsx:9-27; apps/web/src/routes/admin/forecast.tsx:9-27 | ✅ |
| FR-auth-account-025 | API riêng tư yêu cầu phiên | Mọi thủ tục API đánh dấu riêng tư từ chối người gọi không có phiên với lỗi UNAUTHORIZED, thông điệp "Authentication required". | 🟡 TBD | test | S11: packages/api/src/index.ts:15-29; S21: packages/api/src/routers/index.test.ts:30-40; packages/api/src/routers/profile.test.ts:61 | ✅ |
| FR-auth-account-026 | API quản trị yêu cầu quyền admin | Thủ tục quản trị yêu cầu có phiên rồi kiểm tra email người dùng thuộc danh sách admin; không thuộc thì FORBIDDEN với thông điệp "Admin access required"; không có phiên thì UNAUTHORIZED như FR-auth-account-025. | 🟡 TBD | test | S11: packages/api/src/index.ts:31-45; S21: packages/api/src/routers/dispute-admin.test.ts:95-110; packages/api/src/routers/forecast-admin.test.ts:82-100 | ✅ |
| FR-auth-account-027 | Điểm tải/ghi audio yêu cầu phiên | Hai điểm vào HTTP thô cho audio của câu trả lời từ chối khi không có phiên: tải lên trả JSON `{"error":"Unauthorized"}` mã 401, tải xuống trả chữ "Unauthorized" mã 401. Test hiện chỉ phủ mã 401 của điểm tải lên (G-5). (Phần còn lại thuộc `mock-exam`.) | 🟡 TBD | test | S10: apps/server/src/index.ts:79-84,301-306; S21: apps/server/src/index.test.ts:151 | ✅ |
| FR-auth-account-028 | Hợp lệ hóa ảnh đại diện khi tạo/cập nhật tài khoản | Khi yêu cầu tạo hoặc cập nhật người dùng có kèm trường ảnh, hệ thống áp quy tắc BR-auth-account-009..BR-auth-account-017; vi phạm thì hủy thao tác với lỗi BAD_REQUEST, thông điệp `INVALID_IMAGE` (đăng ký thất bại, hồ sơ giữ ảnh cũ). Tải lên avatar chi tiết thuộc `onboarding-profile`. | 🟡 TBD | test | S1:46-72; S2:17-31; S20: packages/api/src/test/auth.test.ts:89-193; packages/auth/src/image-validation.test.ts:5-76 | ✅ |
| FR-auth-account-029 | Mở màn hình đăng nhập từ trang giới thiệu/điều khoản/onboarding | Nút "Đăng nhập" ở landing, nút CTA hero, nút ở trang điều khoản (nút quay lại chỉ về `/auth` khi không có lịch sử trước đó) và nút quay lại ở bước đầu của onboarding đều dẫn tới màn hình `/auth`; màn hình `/auth` có nút quay lại trang giới thiệu và liên kết sang Điều khoản dịch vụ. | 🟡 TBD | kiểm tra | S3:151,257-271; apps/web/src/features/landing/landing-screen.tsx:20; apps/web/src/features/landing/components/hero.tsx:31; apps/web/src/routes/_proto/terms.tsx:19,95; apps/web/src/features/onboarding/onboarding-screen.tsx:35 | ✅ |
| FR-auth-account-030 | Khu vực legacy: form đăng ký/đăng nhập tiếng Anh | Truy cập trực tiếp `/login` hiển thị form "Create Account" (mặc định) hoặc "Welcome Back" với kiểm tra Email hợp lệ, mật khẩu ≥ 8, tên ≥ 2 (chỉ đăng ký); thành công thì toast "Sign up successful"/"Sign in successful" và chuyển `/dashboard`; lỗi thì toast thông điệp của máy chủ (hoặc statusText). KHÔNG có liên kết vào route này từ giao diện sản phẩm chính — nghi dead (OQ-5). | 🟡 TBD | kiểm tra | S13: apps/web/src/routes/_app-legacy/login.tsx:12-18; apps/web/src/components/sign-in-form.tsx:30-47; apps/web/src/components/sign-up-form.tsx:33-50; apps/web/src/routeTree.gen.ts:44-48 | 🟡 |
| FR-auth-account-031 | Khu vực legacy: dashboard cần phiên | Trang `/dashboard` (legacy) yêu cầu phiên, không có thì chuyển `/login`; hiển thị "Welcome {tên}" và thông điệp lấy từ API riêng tư. Header legacy có menu người dùng (Sign In / My Account / Sign Out). | 🟡 TBD | kiểm tra | S13: apps/web/src/routes/_app-legacy/_auth/route.tsx:7-15; apps/web/src/routes/_app-legacy/_auth/dashboard.tsx:10-21; apps/web/src/components/user-menu.tsx:21-51 | 🟡 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-auth-account-001 | security | Cấu hình khai báo thuộc tính cookie mặc định SameSite=none, Secure, HttpOnly. Việc thư viện áp đúng vào cookie phiên và tác dụng thực tế (web và API khác origin, chỉ qua HTTPS, không đọc được từ script) chưa xác nhận từ repo (G-1, OQ-18). | 🟡 TBD | kiểm tra cookie ở phản hồi đăng nhập <!-- TBD: ngưỡng chấp nhận --> | S1:74-80 | 🟡 |
| NFR-auth-account-002 | security | Chỉ một nguồn web (CORS_ORIGIN, đã bỏ dấu "/" cuối) và các nguồn desktop được truyền vào mới được tin cậy; CORS cho phép GET/POST/OPTIONS, header Content-Type/Authorization, có credentials. | 🟡 TBD | test (kiểm tra bỏ dấu "/" cuối) | S1:27,33; S10: apps/server/src/index.ts:40-48; S20: packages/api/src/test/auth.test.ts:31-42 | ✅ |
| NFR-auth-account-003 | security | Đích chuyển trang sau đăng nhập/đăng ký phải là đường dẫn nội bộ (chống open redirect). | 🟡 TBD | test | S3:23-39; S17: apps/web/src/features/__tests__/slice-a.test.tsx:612-643 | ✅ |
| NFR-auth-account-004 | security | Ảnh đại diện không được chứa vector script: chỉ https, data URL webp/jpeg/png, hoặc đường dẫn tĩnh nội bộ; tối đa 32.000 ký tự. | 🟡 TBD | test | S2:7-31; S2 test: packages/auth/src/image-validation.test.ts:36-48 | ✅ |
| NFR-auth-account-005 | security | Khóa bí mật ký phiên và thông tin OAuth Google nạp từ biến môi trường BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (không nằm trong source). | 🟡 TBD | kiểm tra cấu hình triển khai | S1:39-44; S14: packages/infra/alchemy.run.ts:49,57-58 | ✅ |
| NFR-auth-account-006 | security | Thuật toán băm và chính sách lưu mật khẩu, giới hạn tốc độ thử đăng nhập (chống dò mật khẩu), thời hạn phiên: code repo không cấu hình — dựa mặc định thư viện, không xác nhận được. | 🟡 TBD | <!-- TBD --> | S1:34-37 (chỉ bật email/password, không tham số thêm); S12:59 (cột password) | 🟡 |
| NFR-auth-account-007 | availability | Mất kết nối tới máy chủ xác thực không làm treo giao diện: lỗi được bắt, nút mở khóa, hiện thông báo kết nối. Guard route coi lỗi mạng khi hỏi phiên như chưa đăng nhập. | 🟡 TBD | test | S3:139-142; S5:25; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:60-74 | ✅ |
| NFR-auth-account-008 | usability / i18n | Màn hình sản phẩm chính dùng tiếng Việt; khu vực legacy dùng tiếng Anh. Ô nhập có nhãn gắn với ô (label–input) và gợi ý autocomplete đúng chế độ (current-password / new-password / email / name). | 🟡 TBD | kiểm tra | S3:189-233; S13: apps/web/src/components/sign-in-form.tsx:57 | ✅ |
| NFR-auth-account-009 | compatibility | Tải lại toàn trang (không điều hướng SPA) sau đăng nhập/đăng ký để ứng dụng khởi động với phiên mới. | 🟡 TBD | test | S3:136-138; S17: apps/web/src/features/__tests__/slice-a.test.tsx:501-503 | ✅ |
| NFR-auth-account-010 | performance | Thời gian phản hồi đăng nhập/đăng ký, số người dùng đồng thời: code không nêu. | 🟡 TBD | <!-- TBD --> | — | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-auth-account-001 | Đích chuyển trang chỉ hợp lệ khi: (a) có giá trị, (b) bắt đầu bằng "/", (c) không bắt đầu bằng "//", (d) không bắt đầu bằng "/\", (e) không bắt đầu bằng "/auth", (f) không bắt đầu bằng "/login". Ví dụ "//evil.com/hack" bị bỏ. Lưu ý (e)(f) cũng chặn mọi đường dẫn có tiền tố đó (vd "/authors"). | Mở màn hình đăng nhập có tham số redirect; bấm đăng nhập/đăng ký/Google | FR-auth-account-009, FR-auth-account-005, FR-auth-account-008, FR-auth-account-013 | S3:27-39; S17: apps/web/src/features/__tests__/slice-a.test.tsx:618-625,633-642,706-716 | ✅ |
| BR-auth-account-002 | Đích mặc định: sau đăng nhập (email hoặc Google) là `/app/dashboard`; sau đăng ký bằng email là `/onboarding`; đích hợp lệ do khách yêu cầu ghi đè cả hai. Đăng nhập Google luôn dùng đích đăng nhập (kể cả khi tài khoản Google mới) <!-- TBD: có chủ ý? --> | Hoàn tất xác thực | FR-auth-account-005, FR-auth-account-008, FR-auth-account-013 | S3:20-21,73-74,97,137; S17: apps/web/src/features/__tests__/slice-a.test.tsx:570-593,661-678 | ✅ |
| BR-auth-account-003 | Tên hiển thị và email được cắt khoảng trắng đầu/cuối trước khi gửi; mật khẩu không bị cắt. Không có kiểm tra độ dài tối thiểu của tên ở màn hình chính (chỉ bắt buộc nhập). | Gửi form | FR-auth-account-001, FR-auth-account-006 | S3:124,128,196; S17: apps/web/src/features/__tests__/slice-a.test.tsx:499-507,556-567 | ✅ |
| BR-auth-account-004 | Mỗi email chỉ thuộc một tài khoản; đăng ký bằng mật khẩu với email đã thuộc tài khoản (kể cả tài khoản Google) bị từ chối với lỗi nhóm "USER_ALREADY_EXISTS" (nhận diện theo tiền tố mã). | Đăng ký | FR-auth-account-004 | S12:7; S3:43; S20: packages/api/src/test/auth.test.ts:223-284 | ✅ |
| BR-auth-account-005 | Đăng ký thành công kèm đăng nhập tự động (autoSignIn bật). | Đăng ký | FR-auth-account-002 | S1:34-37; S20: packages/api/src/test/auth.test.ts:59-87 | ✅ |
| BR-auth-account-006 | Giao diện dùng cùng một thông báo "Sai email hoặc mật khẩu." cho mã lỗi `INVALID_EMAIL_OR_PASSWORD`; việc máy chủ trả cùng mã cho email không tồn tại (không tiết lộ email nào có tài khoản) chưa có test và là hành vi thư viện (OQ-17). | Đăng nhập | FR-auth-account-007 | S3:42; S20: packages/api/src/test/auth.test.ts:217-220 (chỉ ca mật khẩu sai) | 🟡 |
| BR-auth-account-007 | Lỗi có mã không thuộc hai mã đã biết hiển thị thông báo chung theo chế độ (đăng nhập hoặc đăng ký). | Đăng nhập/đăng ký lỗi | FR-auth-account-012 | S3:41-47; S17: apps/web/src/features/__tests__/slice-a.test.tsx:528-543 | ✅ |
| BR-auth-account-008 | Tài khoản Google không được tự gắn vào tài khoản mật khẩu có sẵn cùng email: giao diện hướng dẫn "đăng nhập bằng email và mật khẩu" khi nhận mã `account_not_linked`. (Việc máy chủ trả mã này là hành vi của thư viện, chưa xác nhận; code chỉ chứng minh phần hiển thị.) | Quay về `/auth?error=account_not_linked` | FR-auth-account-014 | S3:85-86; S17: apps/web/src/features/__tests__/slice-a.test.tsx:726-729 | 🟡 |
| BR-auth-account-009 | Trường ảnh không có trong yêu cầu (không gửi) thì không kiểm tra và giữ nguyên ảnh. | Tạo/cập nhật user | FR-auth-account-028 | S1:50,62; S2:20; S2 test: packages/auth/src/image-validation.test.ts:6-8 | ✅ |
| BR-auth-account-010 | Ảnh = null nghĩa là xóa ảnh đại diện và được chấp nhận. | Cập nhật user | FR-auth-account-028 | S2:21; S20: packages/api/src/test/auth.test.ts:179-182 | ✅ |
| BR-auth-account-011 | Ảnh không phải chuỗi hoặc là chuỗi rỗng bị từ chối. | Tạo/cập nhật user | FR-auth-account-028 | S2:23; S2 test: packages/auth/src/image-validation.test.ts:25-29 | ✅ |
| BR-auth-account-012 | Ảnh dài hơn 32.000 ký tự bị từ chối; đúng 32.000 ký tự vẫn qua bước kiểm tra độ dài (so sánh "lớn hơn"). Không có test cho đúng biên 32.000. | Tạo/cập nhật user | FR-auth-account-028 | S2:8,24; S2 test: packages/auth/src/image-validation.test.ts:31-34 | ✅ |
| BR-auth-account-013 | Ảnh bắt đầu bằng "https://" được chấp nhận; "http://" bị từ chối. | Tạo/cập nhật user | FR-auth-account-028 | S2:26,30; S2 test: packages/auth/src/image-validation.test.ts:11-13,44 | ✅ |
| BR-auth-account-014 | Data URL ảnh chỉ chấp nhận định dạng webp, jpeg, png dạng base64; SVG (kể cả base64 hoặc utf8) và scheme khác (vd javascript:) bị từ chối. | Tạo/cập nhật user | FR-auth-account-028 | S2:10,27,30; S2 test: packages/auth/src/image-validation.test.ts:15-19,36-48; S20: packages/api/src/test/auth.test.ts:104-117,185-190 | ✅ |
| BR-auth-account-015 | Đường dẫn bắt đầu bằng "/avatars/" (avatar mẫu tĩnh) được chấp nhận; đường dẫn nội bộ khác (vd "/etc/passwd") bị từ chối. Sáu avatar mẫu của web đều phải qua kiểm tra. | Tạo/cập nhật user | FR-auth-account-028 | S2:28,30; S2 test: packages/auth/src/image-validation.test.ts:21-23,47,64-68; S20: packages/api/src/test/auth.test.ts:163-170 | ✅ |
| BR-auth-account-016 | Mọi giá trị ảnh còn lại bị từ chối; khi bị từ chối thì thao tác tạo/cập nhật user bị hủy với lỗi BAD_REQUEST "INVALID_IMAGE" và dữ liệu cũ giữ nguyên. | Tạo/cập nhật user | FR-auth-account-028 | S1:51-56,63-68; S2:30; S20: packages/api/src/test/auth.test.ts:119-131,191-192 | ✅ |
| BR-auth-account-017 | Quy tắc ảnh áp dụng cả khi tạo tài khoản (đăng ký có kèm ảnh) lẫn cập nhật hồ sơ; ảnh https (kể cả URL dạng ảnh Google) được chấp nhận khi đăng ký bằng email; việc luồng Google tạo user mới cũng đi qua hook này là hành vi thư viện chưa xác nhận (C-4). | Đăng ký / cập nhật user | FR-auth-account-028 | S1:46-72; S20: packages/api/src/test/auth.test.ts:89-102 | ✅ |
| BR-auth-account-018 | Một người dùng là quản trị viên khi email (cắt khoảng trắng, không phân biệt hoa/thường) nằm trong danh sách ADMIN_EMAILS (phân tách bằng dấu phẩy, bỏ phần tử rỗng). | Gọi thủ tục quản trị | FR-auth-account-026 | S11: packages/api/src/auth-utils.ts:1-13; S21: packages/api/src/auth-utils.test.ts:5-12 | ✅ |
| BR-auth-account-019 | Email người dùng rỗng/thiếu hoặc danh sách admin rỗng/thiếu thì không ai là admin (mặc định danh sách rỗng khi không cấu hình). | Gọi thủ tục quản trị | FR-auth-account-026 | S11: packages/api/src/auth-utils.ts:5; packages/api/src/index.ts:32; S14: packages/infra/alchemy.run.ts:52; S21: packages/api/src/auth-utils.test.ts:14-24 | ✅ |
| BR-auth-account-020 | Quyền nghe audio của một attempt: chủ attempt luôn được; quản trị viên chỉ được khi học viên đã đồng ý chia sẻ (đồng ý phải đúng là true); người khác không được kể cả khi có đồng ý. Danh sách admin rỗng thì admin không có quyền. | Truy cập audio | FR-auth-account-026 | S11: packages/api/src/auth-utils.ts:23-37; S21: packages/api/src/auth-utils.test.ts:35-109 | ✅ |
| BR-auth-account-021 | Guard phiên: không có dữ liệu phiên (hoặc việc hỏi phiên lỗi) thì chuyển `/auth`; tham số redirect chỉ gắn khi nơi gọi cung cấp địa chỉ đích. | Vào route bảo vệ | FR-auth-account-019, FR-auth-account-020 | S5:24-33; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:24-58 | ✅ |
| BR-auth-account-022 | Guard onboarding: hồ sơ vắng hoặc `onboardedAt` rỗng thì chuyển `/onboarding` (không kèm redirect); có `onboardedAt` thì cho qua. | Vào route `/app`, `/exam`, `/scoring` | FR-auth-account-020 | S5:50-60; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:116-186 | ✅ |
| BR-auth-account-023 | Chỉ ghi nhớ kết quả dương ("đã onboarding") theo mã người dùng; kết quả âm không được ghi nhớ nên lần vào sau vẫn hỏi lại. | Vào route bảo vệ | FR-auth-account-021 | S5:45-47,57-59; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:188-215 | ✅ |
| BR-auth-account-024 | Guard onboarding "fail-open": lỗi tải hồ sơ không phải chuyển hướng thì cho qua kèm cảnh báo console; lỗi chuyển hướng được ném tiếp. | Vào route bảo vệ | FR-auth-account-022 | S5:62-67; S18: apps/web/src/lib/__tests__/auth-guard.test.ts:217-237 | ✅ |
| BR-auth-account-025 | Đăng xuất thất bại (phản hồi lỗi hoặc ngoại lệ mạng) coi như phiên còn nguyên: báo lỗi, không xóa state cục bộ, không điều hướng. | Đăng xuất | FR-auth-account-016 | S6:12-24; S19: apps/web/src/hooks/__tests__/use-sign-out.test.tsx:50-77 | ✅ |
| BR-auth-account-026 | Đăng xuất thành công: xóa khóa trạng thái prototype trong sessionStorage (lỗi khi xóa bị bỏ qua) rồi điều hướng tới `/auth` (hoặc đích truyền vào). | Đăng xuất | FR-auth-account-016 | S6:25-30; S16: apps/web/src/features/app-state/store.tsx:7; S19: apps/web/src/hooks/__tests__/use-sign-out.test.tsx:37-48,79-90 | ✅ |
| BR-auth-account-027 | Route admin: không có phiên → `/auth`; mọi lỗi từ bước kiểm tra admin (kể cả lỗi mạng) → `/app/dashboard`; chỉ khi bước kiểm tra thành công mới vào; nếu dịch vụ kiểm tra không khả dụng thì cũng cho vào. | Vào `/admin/*` | FR-auth-account-024 | S9: apps/web/src/routes/admin/disputes.tsx:9-27; apps/web/src/routes/admin/forecast.tsx:9-27 | ✅ |
| BR-auth-account-028 | Học viên đã hoàn tất onboarding không ở lại `/onboarding` mà bị chuyển `/app/dashboard`. | Vào `/onboarding` | FR-auth-account-023 | S8: apps/web/src/routes/_proto/onboarding.tsx:14-17; S18: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:47 | ✅ |
| BR-auth-account-029 | Khi người dùng không còn phiên, giữ lại tùy chọn giao diện (mode, voice), xóa phần dữ liệu còn lại của state học viên. | Phiên chuyển thành không có người dùng | FR-auth-account-018 | S16: apps/web/src/features/app-state/use-profile-hydration.ts:33-40; S18: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:132 | ✅ |
| BR-auth-account-030 | Khu vực legacy dùng quy tắc riêng: mật khẩu ≥ 8, tên ≥ 2, email hợp lệ (kiểm tra ở form khi bấm gửi); form đăng ký hiện trước form đăng nhập. | Gửi form legacy | FR-auth-account-030 | S13: apps/web/src/components/sign-up-form.tsx:47-49; apps/web/src/components/sign-in-form.tsx:44-47; apps/web/src/routes/_app-legacy/login.tsx:12 | 🟡 |
| BR-auth-account-031 | Khi đăng nhập Google lỗi hoặc bị hủy, người dùng được đưa về `/auth`; nếu đích hợp lệ thì giữ lại đích (đã mã hóa URL) để dùng lại ở lần thử sau, nếu không hợp lệ thì quay về `/auth` trơn. | Đăng nhập Google | FR-auth-account-013 | S3:98-100; S17: apps/web/src/features/__tests__/slice-a.test.tsx:690-698,706-716 | ✅ |

## 6. Error Matrix

> Chuỗi lỗi trích nguyên văn từ code. Thông điệp thô của máy chủ (vd "Invalid email or password") không hiển thị ở màn hình chính nên không liệt kê như wording người dùng.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-auth-account-001 | Sai email hoặc mật khẩu | Đăng nhập: máy chủ trả mã `INVALID_EMAIL_OR_PASSWORD` (HTTP 401) | major | FR-auth-account-007 | Banner lỗi đỏ: "Sai email hoặc mật khẩu." | Nhập lại và gửi lại | S3:42; S20: packages/api/src/test/auth.test.ts:217-220; S17: apps/web/src/features/__tests__/slice-a.test.tsx:520 | ✅ |
| E-auth-account-002 | Email đã được sử dụng | Đăng ký: mã bắt đầu bằng `USER_ALREADY_EXISTS` (HTTP 422) | major | FR-auth-account-004 | Banner lỗi: "Email đã được sử dụng." | Đổi email hoặc chuyển sang đăng nhập | S3:43; S20: packages/api/src/test/auth.test.ts:251-254,280-283; S17: apps/web/src/features/__tests__/slice-a.test.tsx:607 | ✅ |
| E-auth-account-003 | Đăng nhập không thành công (chung) | Đăng nhập trả lỗi có mã khác hai mã trên (vd 500) hoặc không có mã | major | FR-auth-account-012 | Banner: "Đăng nhập không thành công. Vui lòng thử lại." | Thử lại | S3:44-45; S17: apps/web/src/features/__tests__/slice-a.test.tsx:539 | ✅ |
| E-auth-account-004 | Đăng ký không thành công (chung) | Đăng ký trả lỗi có mã khác hai mã trên hoặc không có mã | major | FR-auth-account-012 | Banner: "Đăng ký không thành công. Vui lòng thử lại." | Thử lại | S3:44,46 | ✅ |
| E-auth-account-005 | Không kết nối được máy chủ xác thực | Ngoại lệ khi gọi đăng nhập/đăng ký/Google (vd mất mạng) | major | FR-auth-account-012, FR-auth-account-013 | Banner: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." | Thử lại sau | S3:112-115,139-142; S17: apps/web/src/features/__tests__/slice-a.test.tsx:654 | ✅ |
| E-auth-account-006 | Đăng nhập Google không thành công (trả về ngay) | Khởi tạo đăng nhập Google trả lỗi | major | FR-auth-account-013 | Banner: "Đăng nhập Google không thành công. Vui lòng thử lại."; nút Google mở khóa lại | Thử lại | S3:108-111; S17: apps/web/src/features/__tests__/slice-a.test.tsx:760-763 | ✅ |
| E-auth-account-007 | Đăng nhập Google lỗi hoặc bị hủy (quay lại `/auth`) | Địa chỉ trang có tham số `error` khác `account_not_linked` | major | FR-auth-account-014 | Banner: "Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại." | Thử lại Google hoặc dùng email | S3:87-88; S17: apps/web/src/features/__tests__/slice-a.test.tsx:719-742 | ✅ |
| E-auth-account-008 | Email đã đăng ký bằng mật khẩu (Google không liên kết) | Tham số `error` = `account_not_linked` | major | FR-auth-account-014 | Banner: "Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu." | Đăng nhập bằng email + mật khẩu | S3:85-86; S17: apps/web/src/features/__tests__/slice-a.test.tsx:726-729 | ✅ |
| E-auth-account-009 | Đăng xuất thất bại | Hủy phiên trả lỗi hoặc ném ngoại lệ | major | FR-auth-account-016 | Toast: "Đăng xuất thất bại. Vui lòng thử lại."; ở nguyên trang | Bấm đăng xuất lại | S6:8,21-24; S19: apps/web/src/hooks/__tests__/use-sign-out.test.tsx:50-77 | ✅ |
| E-auth-account-010 | Yêu cầu xác thực (API) | Gọi thủ tục API riêng tư khi không có phiên: UNAUTHORIZED | major | FR-auth-account-025 | Không có màn hình riêng; phía gọi nhận lỗi UNAUTHORIZED với thông điệp "Authentication required" | Đăng nhập rồi gọi lại | S11: packages/api/src/index.ts:17-21; S21: packages/api/src/routers/index.test.ts:38-40 | ✅ |
| E-auth-account-011 | Cần quyền quản trị (API) | Thủ tục quản trị bởi người không thuộc danh sách admin: FORBIDDEN | major | FR-auth-account-026 | Phía gọi nhận FORBIDDEN "Admin access required"; route admin chuyển `/app/dashboard` | Dùng tài khoản admin | S11: packages/api/src/index.ts:34-37; S21: packages/api/src/routers/dispute-admin.test.ts:97-101; S9 | ✅ |
| E-auth-account-012 | Ảnh đại diện không hợp lệ | Tạo/cập nhật user với ảnh vi phạm BR-auth-account-011..BR-auth-account-016: BAD_REQUEST | major | FR-auth-account-028 | Phía gọi nhận thông điệp `INVALID_IMAGE`; hiển thị cho người dùng ⚠️ chưa resolve (xem hồ sơ/profile, OQ-15) | Chọn ảnh khác (nén lại, dùng https hoặc avatar mẫu) | S1:53-55,65-67; S20: packages/api/src/test/auth.test.ts:116,130,190 | 🟡 |
| E-auth-account-013 | Không có phiên (HTTP 401) ở điểm audio | Tải lên/xuống audio khi không có phiên | major | FR-auth-account-027 | Tải lên: JSON `{"error":"Unauthorized"}`; tải xuống: chữ "Unauthorized" | Đăng nhập lại | S10: apps/server/src/index.ts:83,305; S21: apps/server/src/index.test.ts:151-163 | ✅ |
| E-auth-account-014 | Lỗi kiểm tra trình duyệt (required / email hợp lệ / ≥ 8 ký tự) | Gửi form `/auth` thiếu trường bắt buộc, email sai định dạng hoặc mật khẩu đăng ký ngắn hơn 8 ký tự | minor | FR-auth-account-001, FR-auth-account-003, FR-auth-account-006 | Câu chữ do trình duyệt sinh ra — ⚠️ chưa resolve, code không có chuỗi | Sửa trường theo gợi ý trình duyệt | S3:196,213,227-228 | 🟡 |
| E-auth-account-015 | Legacy: lỗi kiểm tra form | Legacy: email sai, mật khẩu < 8, tên < 2 | minor | FR-auth-account-030 | Dòng chữ đỏ dưới ô: "Invalid email address" / "Password must be at least 8 characters" / "Name must be at least 2 characters" | Sửa trường | S13: apps/web/src/components/sign-in-form.tsx:45-46; apps/web/src/components/sign-up-form.tsx:47-49 | 🟡 |
| E-auth-account-016 | Legacy: lỗi từ máy chủ | Legacy: đăng nhập/đăng ký trả lỗi | major | FR-auth-account-030 | Toast lỗi hiển thị thông điệp của máy chủ, nếu không có thì statusText ⚠️ chưa resolve câu cụ thể | Thử lại | S13: apps/web/src/components/sign-in-form.tsx:37-39; apps/web/src/components/sign-up-form.tsx:39-41 | 🟡 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-auth-account-01 | Khách mới tạo được tài khoản và đi tiếp vào onboarding mà không phải đăng nhập lại | <!-- TBD: code không có metric --> | <!-- TBD --> | S3:137; S1:36 (hành vi có, chỉ tiêu không có) | 🟡 |
| SC-auth-account-02 | Người dùng cũ đăng nhập được và vào đúng trang đích | <!-- TBD --> | <!-- TBD --> | S3:136-138 | 🟡 |
| SC-auth-account-03 | Khu vực cần phiên/admin không truy cập được khi chưa đủ điều kiện | <!-- TBD: tỷ lệ chặn đúng --> | <!-- TBD --> | S5:24-33; S9; S11 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/auth-account-reverse-erd.md`)

- **Người dùng**: tên, email (duy nhất), cờ đã xác minh email (mặc định chưa), ảnh đại diện, thời điểm tạo/cập nhật. ✅ [S12:4-17]
- **Phiên đăng nhập**: token duy nhất, hạn dùng, địa chỉ IP, user agent; thuộc một người dùng và bị xóa khi người dùng bị xóa. ✅ [S12:19-38]
- **Tài khoản đăng nhập (credential/nhà cung cấp)**: mã nhà cung cấp (mật khẩu hoặc Google), mã tài khoản ngoài, mật khẩu (cột `password`; cách băm chưa xác nhận, G-1), token/hạn token của nhà cung cấp; một người dùng có nhiều tài khoản đăng nhập. ✅ [S12:40-68]
- **Xác minh (verification)**: định danh, giá trị, hạn; **chưa thấy nơi dùng** trong code (negative-search N-3). 🟡 [S12:70-86]
- Hồ sơ học viên (`onboardedAt`) thuộc `onboarding-profile`, chỉ được đọc bởi guard. ✅ [S5:50-52]

## 9. Flows (tóm tắt — chi tiết ở `srs/auth-account-reverse-flows.md`)

1. Đăng ký bằng email (FR-auth-account-001..005, 012).
2. Đăng nhập bằng email (FR-auth-account-006..008, 012).
3. Đăng nhập bằng Google (FR-auth-account-013..014).
4. Đăng xuất (FR-auth-account-016..018).
5. Bảo vệ route theo phiên + onboarding (FR-auth-account-019..023).
6. Truy cập khu vực quản trị (FR-auth-account-024, 026).
7. Hợp lệ hóa ảnh đại diện khi tạo/cập nhật user (FR-auth-account-028).
8. Khu vực legacy `/login` → `/dashboard` (FR-auth-account-030..031) — 🟡 nghi dead.

## 10. Screens (tóm tắt)

| Màn hình | Route | Thành phần chính | Trạng thái màn hình | Nguồn | Nhãn |
|----------|-------|------------------|---------------------|-------|------|
| S-1 Đăng nhập / đăng ký | `/auth` | Tiêu đề "Đăng nhập Vox Flow"; dòng phụ "Không cần thẻ thanh toán. Band tổng luôn miễn phí."; nút "Tiếp tục với Google"; dải phân cách "hoặc"; form Email, Mật khẩu (+ Tên hiển thị ở chế độ đăng ký); nút "Đăng nhập" / "Tạo tài khoản"; nút chuyển chế độ; liên kết Điều khoản dịch vụ & Chính sách sử dụng; nút quay lại trang giới thiệu | Chế độ đăng nhập (mặc định) · chế độ đăng ký · đang xử lý (khóa tất cả, spinner) · có banner lỗi | S3:150-273; S4 | ✅ |
| S-2 Menu người dùng (legacy) | header của khu legacy | Skeleton khi tải phiên; nút "Sign In" khi chưa có phiên; tên người dùng + "My Account" + email + "Sign Out" khi đã có phiên | đang tải · chưa đăng nhập · đã đăng nhập | S13: apps/web/src/components/user-menu.tsx:21-51 | 🟡 |
| S-3 Form đăng ký / đăng nhập (legacy) | `/login` | "Create Account" (mặc định) / "Welcome Back"; Name, Email, Password; nút "Sign Up"/"Sign In"; liên kết chuyển đổi; câu điều khoản; hiển thị loader khi phiên đang tải | mặc định · đang gửi ("Submitting...") · lỗi dưới ô | S13: apps/web/src/components/sign-up-form.tsx:60,154-157; apps/web/src/components/sign-in-form.tsx:57 | 🟡 |
| S-4 Dashboard (legacy) | `/dashboard` | "Dashboard", "Welcome {tên}", "API: {thông điệp}" | cần phiên | S13: apps/web/src/routes/_app-legacy/_auth/dashboard.tsx:15-21 | 🟡 |

Điểm vào đăng xuất trên các màn hình khác (sidebar, bottom nav, hồ sơ): xem FR-auth-account-017.

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Chỉ dùng email + mật khẩu và Google; không có magic link | Code và test chỉ có hai cách này (test khẳng định "no magic link"); việc đó là quyết định sản phẩm có chủ ý hay không, người sở hữu: chưa rõ | S1:34-43; S17: apps/web/src/features/__tests__/slice-a.test.tsx:447-457 | 🟡 |
| Lưu người dùng/phiên/tài khoản trong CSDL SQLite (D1) | Hạ tầng | S1:29-32; S12; packages/infra/alchemy.run.ts:24; packages/db/src/index.ts:1 | ✅ |
| Địa chỉ gốc của máy chủ xác thực phía web lấy từ biến môi trường VITE_SERVER_URL, mặc định `http://localhost:3000` | Cấu hình web | S7:5-6 | ✅ |
| Biến môi trường không có mặc định khi triển khai: BETTER_AUTH_SECRET, CORS_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET; địa chỉ gốc của máy chủ xác thực lấy từ URL của Worker (không phải biến môi trường); ADMIN_EMAILS mặc định rỗng | Hạ tầng | S14: packages/infra/alchemy.run.ts:48-52,57-58; turbo.json:43-48 | ✅ |
| Cấu hình khai báo cookie SameSite=none kèm Secure (tức chỉ chạy qua HTTPS) | Cấu hình auth | S1:74-80 | ✅ |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Google OAuth (client id/secret, redirect URI `.../api/auth/callback/google` trên máy chủ) | Google / người cấu hình | Đăng nhập Google | S1:38-43; S20: packages/api/src/test/auth.test.ts:54-56 | ✅ |
| Dịch vụ hồ sơ học viên (`onboardedAt`) | feature `onboarding-profile` | Guard onboarding (nếu lỗi thì cho qua) | S5:50-60 | ✅ |
| Khai báo nhà cung cấp OAuth: Google cần bật trong cấu hình triển khai | Hạ tầng | Đăng nhập Google | S14: packages/infra/alchemy.run.ts:57-58 | ✅ |
| Trang Điều khoản dịch vụ `/terms` | chưa rõ | Liên kết trên màn hình đăng nhập | S3:257-271; apps/web/src/routes/_proto/terms.tsx | ✅ |
| Tham số desktopOrigins của hàm tạo auth | Chưa thấy nơi truyền (xem N-5) | Nguồn desktop được tin cậy | S1:25,33; S10: apps/server/src/services.ts:9-11 | 🟡 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Máy chủ áp mật khẩu tối thiểu 8 ký tự (mặc định thư viện) giống ràng buộc ở form | FR-auth-account-003, E-auth-account-014 (nếu khác thì form và server lệch) | S3:228 (chỉ phía form) | 🟡 |
| Thư viện trả mã `INVALID_EMAIL_OR_PASSWORD`, tiền tố `USER_ALREADY_EXISTS`, `account_not_linked` đúng như UI kỳ vọng | FR-auth-account-004, FR-auth-account-007, FR-auth-account-014 | S20: packages/api/src/test/auth.test.ts:217-220,251-254 (test xác nhận hai mã đầu cho ca mật khẩu sai và email trùng; `account_not_linked` chỉ ở test UI nên chưa có bằng chứng phía thư viện) | 🟡 |
| Phiên cookie còn hiệu lực đủ lâu cho một buổi học; thời hạn mặc định thư viện | FR-auth-account-019, FR-auth-account-020 | — | 🟡 |
| Khu vực legacy là scaffold ban đầu giữ lại có chủ ý | FR-auth-account-030, FR-auth-account-031, S-2..S-4 | S22: README.md:129 (chỉ nói "kept unchanged", không nói lý do) | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây chỉ trích các OQ blocking.

- [ ] OQ-1: Chính sách mật khẩu phía máy chủ (độ dài tối thiểu/tối đa, độ mạnh) là gì và có đồng bộ với ràng buộc 8 ký tự ở form không?
- [ ] OQ-2: Thời hạn phiên đăng nhập và có "ghi nhớ đăng nhập" không?
- [ ] OQ-3: Có cần xác minh email khi đăng ký không (hiện cờ xác minh mặc định chưa và không thấy luồng gửi email)?
- [ ] OQ-4: Quên/đặt lại mật khẩu có nằm trong phạm vi sản phẩm không (hiện không có)?
- [ ] OQ-5: Khu vực legacy (`/login`, `/dashboard`) giữ hay gỡ?
- [ ] OQ-6: Đăng nhập Google thuộc feature này hay là feature riêng (WI-07 trong roadmap ghi "chỉ email + mật khẩu")?
- [ ] OQ-7: Priority P0/P1/P2 của toàn bộ FR (code không có) và mục tiêu nghiệp vụ của từng actor người.
- [ ] OQ-17: Đăng nhập bằng email không tồn tại có trả cùng lỗi với mật khẩu sai không (chống dò email)? Chưa có test, phụ thuộc thư viện.
- [ ] OQ-18: Thư viện có áp đúng SameSite=none/Secure/HttpOnly khai báo lên cookie phiên không (kiểm tra phản hồi đăng nhập thật)?
