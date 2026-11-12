---
type: reverse-srs
feature: auth-account
status: approved
updated: 2026-11-12
confidence_summary: "✅128 🔵0 🟡0"
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

> Trạng thái: **ĐÃ DUYỆT (2026-11-12, Issue #134)** — đối chiếu `docs/product-decisions.md` (D-03, D-04), PRD `docs/_product/prd.md` và mã nguồn `better-auth@1.7.12`. Nhãn: ✅ chắc chắn (code/test/quyết định đã duyệt khẳng định). Không còn 🟡: toàn bộ OQ đã chốt (xem `reverse-gaps.md`) và khu legacy đã gỡ khỏi sản phẩm.

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái duyệt:** ĐÃ DUYỆT 2026-11-12 (Issue #134). Nội dung là bản tái lập từ source code, test, quyết định sản phẩm đã duyệt và đối chiếu thư viện `better-auth@1.7.12`.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md) (S1..S12, S14..S21, S23..S26; S13/S22 đã xóa cùng khu legacy ở #134).
- **Câu hỏi mở / khác biệt:** đã đóng toàn bộ — xem [`reverse-gaps.md`](./reverse-gaps.md) (OQ-1..18, Gap G-1..G-7, Conflict C-1..C-4 đều "Đã giải quyết").
- **Quy ước cite:** `[S?: đường-dẫn-repo]` đặt ở cột Nguồn. Tên endpoint/hàm/bảng chỉ xuất hiện ở cột Nguồn, `_evidence.md` và ERD, không nằm trong prose FR/BR.
- **Phạm vi đọc:** mã nguồn repo và mã `better-auth@1.7.12` trong `node_modules` (đã đối chiếu ở #134: `sign-in.mjs`, `cookies/index.mjs`, cấu hình `emailAndPassword`, `session`, `rateLimit`).
- **Audit độc lập:** đã chạy 2026-11-11, hạ 10 claim, sửa 3 cite; vòng duyệt #134 (2026-11-12) cập nhật lại theo quyết định đã chốt.

### 0.3 Khác biệt với tài liệu chính (chỉ khi feature trùng doc hiện có)

| Điểm | Reverse nói (từ nguồn) | Doc chính nói (`docs/roadmap-work-items.md` mục 07, chỉ tham khảo) | Trạng thái |
|------|------------------------|---------------------------------------------------------------------|---------|
| Đăng nhập Google | Code CÓ nút "Tiếp tục với Google" và cấu hình nhà cung cấp Google (S1, S3), có test (S17, S20) | ~~Ghi "Code hiện chỉ có email + mật khẩu"~~ — đã sửa ở #134: "Code đã có Google OAuth bên cạnh email + mật khẩu (D-03); chờ 06 để gắn thông tin xác thực Cloudflare thật." (`docs/roadmap-work-items.md:22`) | ✅ Đã giải quyết (#134) |

## 1. Scope

Feature `auth-account` đặc tả việc học viên và quản trị viên **tạo tài khoản, đăng nhập, đăng xuất** và việc hệ thống **chặn truy cập** vào các khu vực cần tài khoản. Mục tiêu nghiệp vụ (theo PRD Mục 1–2, S25/S26): mở đường cho chỉ tiêu "60% học viên đăng ký hoàn thành bài thi thử đầu tiên" (`docs/_product/prd.md:14`) — khách tạo tài khoản được đưa thẳng vào `/onboarding`, học viên giữ phiên an toàn giữa các buổi luyện, quản trị viên vào được khu quản trị.

- Đăng ký tài khoản bằng email + mật khẩu + tên hiển thị; sau đăng ký hệ thống tự đăng nhập. ✅ [S1; S3]
- Đăng nhập bằng email + mật khẩu trên cùng một màn hình với đăng ký (chuyển qua lại giữa hai chế độ). ✅ [S3]
- Đăng nhập bằng tài khoản Google nằm trên cùng màn hình; dùng chung màn hình, thông báo lỗi và luồng chuyển hướng; thuộc feature này theo D-03 / PRD F-02 (`docs/_product/prd.md:78`). ✅ [S3; S1]
- Đăng xuất từ nhiều điểm vào; thất bại thì giữ nguyên người dùng ở trang hiện tại. ✅ [S6]
- Bảo vệ route phía giao diện: yêu cầu phiên, yêu cầu đã hoàn tất onboarding, và yêu cầu quyền quản trị cho khu vực admin. ✅ [S5; S8; S9]
- Bảo vệ phía máy chủ: thủ tục API riêng tư yêu cầu phiên; thủ tục quản trị yêu cầu email nằm trong danh sách admin. ✅ [S11]
- Quy tắc hợp lệ của ảnh đại diện và tên hiển thị tại thời điểm tạo/cập nhật tài khoản. ✅ [S1; S2; S24] (phần chỉnh sửa hồ sơ/avatar do feature `onboarding-profile` sở hữu — tham chiếu chéo, không đặc tả lại màn hình hồ sơ).
- Chống dò mật khẩu bằng giới hạn tốc độ in-memory của thư viện; không khóa cứng tài khoản. ✅ [S1; OQ-12]

**Boundary (out of scope — code không có hoặc thuộc feature khác):**

- Quên mật khẩu / đặt lại mật khẩu, đổi mật khẩu, xóa tài khoản, xác minh email, đăng nhập bằng liên kết/magic link, xác thực hai lớp, liên kết tài khoản: ngoài MVP theo D-03 (`docs/product-decisions.md:7`; `docs/_product/prd.md:29,69`), xếp Later. ✅
- Màn hình hồ sơ, chọn avatar, onboarding: feature `onboarding-profile` (kể cả câu chữ hiển thị cho `INVALID_IMAGE` khi đổi ảnh — OQ-15).
- Cổng khai trương (launch gate theo `LAUNCH_OPEN`/`LAUNCH_ALLOWED_EMAILS`) và quyền sở hữu attempt: feature `mock-exam`.
- Quyền truy cập audio của quản trị viên khi có đồng ý chia sẻ: chỉ trích quy tắc nền ở BR-auth-account-020, chi tiết thuộc `dispute-admin`/`mock-exam`.
- Khu vực legacy `_app-legacy` (`/login`, `/dashboard`): đã gỡ bỏ hoàn toàn ở #134, không còn trong phạm vi.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Khách (chưa có phiên) | người | Tạo tài khoản hoặc đăng nhập để vào ứng dụng và đi tiếp tới onboarding/bài thi thử đầu tiên (PRD Mục 2.1: `docs/_product/prd.md:25-29`) | Có | S3; S26: `docs/_product/prd.md:29` | ✅ |
| Học viên (đã có phiên) | người | Luyện thi với phiên ổn định giữa các buổi, đăng xuất khi cần (PRD Mục 2.1) | Có | S6; S15; S16 | ✅ |
| Quản trị viên (email nằm trong danh sách admin) | người | Vào khu vực quản trị duyệt đề forecast, xử lý báo lỗi chấm (PRD Mục 2.2: `docs/_product/prd.md:31-35`) | Có (chỉ phần kiểm soát truy cập) | S9; S11 | ✅ |
| Máy chủ xác thực (Worker) | hệ thống | Cấp, kiểm tra và hủy phiên; lưu tài khoản | Có | S10; S1 | ✅ |
| Dịch vụ đăng nhập Google | ngoài | Xác thực danh tính người dùng Google | Có (mô tả tối thiểu) | S1; S17 | ✅ |
| Dịch vụ tải hồ sơ onboarding (profile) | hệ thống | Cho biết học viên đã hoàn tất onboarding chưa | Có (phụ thuộc của guard) | S5 | ✅ |
| Chủ sản phẩm / BA | người | Duyệt đặc tả, quyết định các OQ | Không (stakeholder) | — | ✅ |

## 3. Functional Requirements (FR)

> Cột Priority gán theo PRD Mục 1–2 (#134): `P0` cho đăng ký/đăng nhập/đăng xuất/guards/API auth; `P1` cho hiển thị lỗi chi tiết, hợp lệ hóa tên & ảnh và điều hướng phụ. Verify by là cách kiểm chứng dựa trên test hiện có.

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-auth-account-001 | Đăng ký bằng email + mật khẩu + tên hiển thị | Khách điền Tên hiển thị, Email, Mật khẩu rồi bấm "Tạo tài khoản". Hệ thống tạo tài khoản với tên và email đã được cắt khoảng trắng đầu/cuối; mật khẩu giữ nguyên. Tên hiển thị hợp lệ khi dài 1..50 ký tự sau cắt khoảng trắng: ô nhập đặt `maxLength=50` và máy chủ từ chối tên vi phạm với lỗi `INVALID_NAME`. | P0 | test | S3; S24; S20 | ✅ |
| FR-auth-account-002 | Tự đăng nhập sau đăng ký | Đăng ký thành công thì hệ thống cấp luôn phiên đăng nhập (không bắt đăng nhập lại) và trả về token phiên. | P0 | test | S1; S20 | ✅ |
| FR-auth-account-003 | Gợi ý và ràng buộc độ dài mật khẩu khi đăng ký | Ở chế độ đăng ký, ô mật khẩu yêu cầu tối thiểu 8 ký tự và hiển thị dòng gợi ý "Tối thiểu 8 ký tự."; ở chế độ đăng nhập không đặt ràng buộc độ dài. Máy chủ áp cùng ngưỡng: mật khẩu dài 8..128 ký tự (`minPasswordLength: 8`, `maxPasswordLength: 128`). | P0 | test | S3; S1 | ✅ |
| FR-auth-account-004 | Từ chối email đã tồn tại | Đăng ký với email đã có tài khoản (kể cả tài khoản được tạo qua Google) bị từ chối; màn hình hiển thị "Email đã được sử dụng." và không chuyển trang. | P0 | test | S3; S20; S17 | ✅ |
| FR-auth-account-005 | Chuyển trang sau đăng ký | Sau đăng ký thành công, trình duyệt tải lại toàn trang tới đường dẫn đích hợp lệ do khách yêu cầu; nếu không có thì tới `/onboarding`. | P0 | test | S3; S17 | ✅ |
| FR-auth-account-006 | Đăng nhập bằng email + mật khẩu | Khách điền Email, Mật khẩu rồi bấm "Đăng nhập". Email được cắt khoảng trắng; mật khẩu giữ nguyên. | P0 | test | S3; S17 | ✅ |
| FR-auth-account-007 | Từ chối thông tin đăng nhập sai | Máy chủ trả mã lỗi `INVALID_EMAIL_OR_PASSWORD` (HTTP 401) cho cả ba trường hợp: mật khẩu sai, email không tồn tại, và email thuộc tài khoản chỉ có Google (không tiết lộ email nào có tài khoản — chống dò email; khóa bằng test tích hợp và mã `better-auth@1.7.12`). Màn hình hiển thị "Sai email hoặc mật khẩu." và không chuyển trang, nút đăng nhập hoạt động lại. | P0 | test | S3; S20; S17 | ✅ |
| FR-auth-account-008 | Chuyển trang sau đăng nhập | Sau đăng nhập thành công, trình duyệt tải lại toàn trang tới đường dẫn đích hợp lệ do khách yêu cầu; nếu không có thì tới `/app/dashboard`. | P0 | test | S3; S17 | ✅ |
| FR-auth-account-009 | Chỉ chấp nhận đích chuyển trang nội bộ an toàn | Đường dẫn đích (tham số redirect) chỉ được dùng khi bắt đầu bằng "/", không bắt đầu bằng "//", không bắt đầu bằng "/\", không bắt đầu bằng "/auth" và không bắt đầu bằng "/login"; ngược lại bị bỏ qua và dùng đích mặc định. | P0 | test | S3; S17 | ✅ |
| FR-auth-account-010 | Chuyển đổi chế độ đăng nhập ↔ đăng ký | Một nút chuyển qua lại giữa "Chưa có tài khoản? Đăng ký" và "Đã có tài khoản? Đăng nhập"; khi chuyển, thông báo lỗi cục bộ bị xóa, các giá trị đã nhập (email, mật khẩu, tên) được giữ nguyên. Mặc định mở ở chế độ đăng nhập. | P1 | test | S3; S17 | ✅ |
| FR-auth-account-011 | Khóa thao tác khi đang xử lý | Khi một yêu cầu đăng nhập/đăng ký/Google đang chạy, mọi ô nhập và nút trên màn hình bị vô hiệu hóa và các lần bấm/gửi thêm bị bỏ qua; khi lỗi thì mở khóa lại. | P1 | test | S3; S17 | ✅ |
| FR-auth-account-012 | Thông báo lỗi tổng quát | Lỗi đăng nhập/đăng ký có mã không nhận diện được hiển thị câu chung theo chế độ ("Đăng nhập không thành công. Vui lòng thử lại." hoặc "Đăng ký không thành công. Vui lòng thử lại."); lỗi kết nối/ngoại lệ hiển thị "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau."; lỗi `429` hiển thị "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."; không chuyển trang. | P1 | test | S3; S17 | ✅ |
| FR-auth-account-013 | Đăng nhập bằng Google | Nút "Tiếp tục với Google" yêu cầu chuyển khách sang Google. Giao diện truyền: đích thành công `callbackURL` là đích hợp lệ (mặc định `/app/dashboard`) cho tài khoản đã có; `newUserCallbackURL` trỏ về `safeRedirect ?? "/onboarding"` cho tài khoản Google mới; đích lỗi/hủy là `/auth` (giữ tham số redirect hợp lệ). Khi nhấn, nút hiển thị "Đang kết nối...". Lỗi `429` hiển thị "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."; lỗi trả về ngay khác hiển thị "Đăng nhập Google không thành công. Vui lòng thử lại."; ngoại lệ hiển thị câu lỗi kết nối. | P0 | test | S3; S1; S17 | ✅ |
| FR-auth-account-014 | Hiển thị lỗi Google từ địa chỉ trang | Khi trang `/auth` được mở với tham số lỗi: giá trị `account_not_linked` hiển thị "Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu."; mọi giá trị khác hiển thị "Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại."; lỗi cục bộ (nếu có) được ưu tiên hơn. Nếu tham số lỗi lặp lại (mảng) thì lấy phần tử đầu. | P1 | test | S3; S4; S17 | ✅ |
| FR-auth-account-015 | Màn hình nhận tham số redirect/error và chuyển người đã onboard đi | Route `/auth` chấp nhận hai tham số tùy chọn `error` và `redirect`; `redirect` không phải chuỗi thì bị bỏ. Khi không có tham số `error`, người dùng đã có phiên VÀ đã hoàn tất onboarding được tự chuyển sang đích hợp lệ (mặc định `/app/dashboard`); người chưa onboard vẫn ở lại `/auth` để giữ nút "Quay lại" từ bước 1 của `/onboarding`. | P0 | test | S4; S5 | ✅ |
| FR-auth-account-016 | Đăng xuất | Người dùng chọn Đăng xuất: hệ thống hủy phiên; thành công thì xóa dữ liệu trạng thái prototype lưu trong phiên trình duyệt, xóa thêm bộ nhớ đệm trạng thái onboarding (`clearOnboardedUserCache`) rồi điều hướng tới `/auth` (có thể truyền đích khác). Hủy phiên thất bại (HTTP lỗi hoặc lỗi mạng) thì hiện toast "Đăng xuất thất bại. Vui lòng thử lại." và ở nguyên trang, không điều hướng. | P0 | test | S6; S19 | ✅ |
| FR-auth-account-017 | Các điểm vào đăng xuất | Đăng xuất khả dụng ở: thẻ người dùng sidebar (nút "Đăng xuất"), thanh điều hướng dưới (mobile), và màn hình hồ sơ. | P0 | test | S15; S19 | ✅ |
| FR-auth-account-018 | Reset trạng thái học viên khi mất phiên | Khi không còn người dùng đăng nhập, trạng thái ứng dụng phía học viên được đặt về ban đầu nhưng giữ lại hai tùy chọn giao diện (mode, voice); khi phiên đang tải thì không đụng tới trạng thái. | P1 | test | S16; S18 | ✅ |
| FR-auth-account-019 | Route cần phiên: chuyển về đăng nhập | Trang `/onboarding` yêu cầu có phiên. Không có phiên (hoặc kiểm tra phiên gặp lỗi mạng) thì chuyển tới `/auth` kèm tham số redirect bằng địa chỉ trang đang định vào. | P0 | test | S5; S8; S18 | ✅ |
| FR-auth-account-020 | Route cần phiên + đã onboarding | Các trang `/app/*`, `/exam`, `/scoring` yêu cầu có phiên; không có phiên thì xử lý như FR-auth-account-019. Có phiên nhưng chưa có hồ sơ hoặc hồ sơ chưa hoàn tất onboarding thì chuyển tới `/onboarding` (không kèm tham số). | P0 | test | S5; S8; S18 | ✅ |
| FR-auth-account-021 | Ghi nhớ trạng thái đã onboarding trong phiên làm việc | Sau khi xác nhận một học viên đã onboarding (guard đọc hồ sơ thành công, hoặc ngay khi hoàn tất onboarding qua `markUserOnboarded`), hệ thống nhớ trong bộ nhớ trình duyệt và các lần vào trang được bảo vệ sau đó không hỏi lại hồ sơ. | P0 | test | S5; S18 | ✅ |
| FR-auth-account-022 | Cho qua khi không kiểm tra được hồ sơ | Nếu việc tải hồ sơ onboarding gặp lỗi không phải chuyển hướng (vd lỗi máy chủ), hệ thống vẫn cho học viên có phiên đi tiếp và ghi cảnh báo ở console; nếu dịch vụ tải hồ sơ không khả dụng thì cũng cho qua. | P0 | test | S5; S18 | ✅ |
| FR-auth-account-023 | Trang onboarding đẩy học viên đã xong sang dashboard | Học viên có phiên và đã hoàn tất onboarding mở `/onboarding` thì bị chuyển tới `/app/dashboard`; lỗi khi tải hồ sơ ở bước này bị bỏ qua. | P0 | test | S8; S18 | ✅ |
| FR-auth-account-024 | Khu vực quản trị | Các trang `/admin/disputes` và `/admin/forecast`: không có phiên thì chuyển `/auth`; có phiên nhưng bước kiểm tra quyền quản trị phía máy chủ ném bất kỳ lỗi nào thì chuyển `/app/dashboard`. | P0 | test | S9 | ✅ |
| FR-auth-account-025 | API riêng tư yêu cầu phiên | Mọi thủ tục API đánh dấu riêng tư từ chối người gọi không có phiên với lỗi UNAUTHORIZED, thông điệp "Authentication required". | P0 | test | S11; S21 | ✅ |
| FR-auth-account-026 | API quản trị yêu cầu quyền admin | Thủ tục quản trị yêu cầu có phiên rồi kiểm tra email người dùng thuộc danh sách admin; không thuộc thì FORBIDDEN với thông điệp "Admin access required"; không có phiên thì UNAUTHORIZED như FR-auth-account-025. | P0 | test | S11; S21 | ✅ |
| FR-auth-account-027 | Điểm tải/ghi audio yêu cầu phiên | Hai điểm vào HTTP thô cho audio của câu trả lời từ chối khi không có phiên: tải lên trả JSON `{"error":"Unauthorized"}` mã 401, tải xuống trả chữ "Unauthorized" mã 401. (Phần còn lại thuộc `mock-exam`.) | P0 | test | S10; S21 | ✅ |
| FR-auth-account-028 | Hợp lệ hóa ảnh đại diện khi tạo/cập nhật tài khoản | Khi yêu cầu tạo hoặc cập nhật người dùng có kèm trường ảnh, hệ thống áp quy tắc BR-auth-account-009..BR-auth-account-017; vi phạm thì hủy thao tác với lỗi BAD_REQUEST, thông điệp `INVALID_IMAGE` (đăng ký thất bại, hồ sơ giữ ảnh cũ). Tải lên avatar chi tiết thuộc `onboarding-profile`. | P1 | test | S1; S2; S20 | ✅ |
| FR-auth-account-029 | Mở màn hình đăng nhập từ trang giới thiệu/điều khoản/onboarding | Nút "Đăng nhập" ở landing, nút CTA hero, nút ở trang điều khoản (nút quay lại chỉ về `/auth` khi không có lịch sử trước đó) và nút quay lại ở bước đầu của onboarding đều dẫn tới màn hình `/auth`; màn hình `/auth` có nút quay lại trang giới thiệu và liên kết sang Điều khoản dịch vụ. | P1 | kiểm tra | S3; S17 | ✅ |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-auth-account-001 | security | Cookie phiên được áp thuộc tính mặc định SameSite=None, Secure, HttpOnly (đã xác minh trong mã `better-auth@1.7.12`, `cookies/index.mjs`, và khóa bằng test tích hợp: `Set-Cookie` chứa đủ ba thuộc tính). Web và API khác origin nên cần SameSite=None; chỉ chạy qua HTTPS; script không đọc được cookie. | P0 | test tích hợp Set-Cookie | S1; S20 | ✅ |
| NFR-auth-account-002 | security | Chỉ một nguồn web tin cậy (`CORS_ORIGIN`, đã bỏ dấu "/" cuối); tham số `desktopOrigins` đã gỡ khỏi `createAuth()` (#134, v1 chỉ làm Web theo PRD 3.2). CORS cho phép GET/POST/OPTIONS, header Content-Type/Authorization, có credentials. | P0 | test (kiểm tra bỏ dấu "/" cuối) | S1; S10; S20 | ✅ |
| NFR-auth-account-003 | security | Đích chuyển trang sau đăng nhập/đăng ký phải là đường dẫn nội bộ (chống open redirect). | P0 | test | S3; S17 | ✅ |
| NFR-auth-account-004 | security | Ảnh đại diện không được chứa vector script: chỉ https, data URL webp/jpeg/png, hoặc đường dẫn tĩnh nội bộ; tối đa 32.000 ký tự. | P0 | test | S2 | ✅ |
| NFR-auth-account-005 | security | Khóa bí mật ký phiên và thông tin OAuth Google nạp từ biến môi trường BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (không nằm trong source). | P0 | kiểm tra cấu hình triển khai | S1; S14 | ✅ |
| NFR-auth-account-006 | security | Mật khẩu băm `scrypt`; mật khẩu dài 8..128 ký tự. Phiên kéo dài 7 ngày (604800s) với gia hạn trượt mỗi 24 giờ (86400s); cookie luôn lưu bền vững (không có "ghi nhớ đăng nhập"). Chống dò mật khẩu bằng `rateLimit` in-memory của Better Auth: `3 lần/10s` cho `/sign-in*`, `/sign-up*` và `100 lần/10s` chung, đọc địa chỉ từ header `cf-connecting-ip`; gặp `429` giao diện hiển thị báo lỗi tiếng Việt; KHÔNG khóa cứng tài khoản (tránh bị lợi dụng DoS khi chưa có Quên mật khẩu theo D-03). Giới hạn kiến trúc: bộ đếm `memory` hoạt động theo từng Worker isolate của Cloudflare Workers (reset khi tạo isolate mới) và header `cf-connecting-ip` chỉ đáng tin khi lưu lượng đi qua domain được Cloudflare proxy (`api.vox.vinhtran.io.vn`). | P0 | test tích hợp (scrypt/phiên/cookie) + kiểm tra cấu hình rateLimit | S1 | ✅ |
| NFR-auth-account-007 | availability | Mất kết nối tới máy chủ xác thực không làm treo giao diện: lỗi được bắt, nút mở khóa, hiện thông báo kết nối. Guard route coi lỗi mạng khi hỏi phiên như chưa đăng nhập. | P0 | test | S3; S5; S18 | ✅ |
| NFR-auth-account-008 | usability / i18n | Màn hình sản phẩm dùng tiếng Việt. Ô nhập có nhãn gắn với ô (label–input) và gợi ý autocomplete đúng chế độ (current-password / new-password / email / name); câu chữ kiểm tra HTML5 gốc (required / type=email / minLength / maxLength) do trình duyệt sinh, hiển thị theo ngôn ngữ trình duyệt của người dùng. | P1 | kiểm tra | S3 | ✅ |
| NFR-auth-account-009 | compatibility | Tải lại toàn trang (không điều hướng SPA) sau đăng nhập/đăng ký để ứng dụng khởi động với phiên mới. | P1 | test | S3; S17 | ✅ |
| NFR-auth-account-010 | performance | Thời gian phản hồi đăng nhập/đăng ký, số người dùng đồng thời: chưa đặt chỉ tiêu ở MVP; theo dõi khi mở cho học viên thật (mốc #17 của roadmap). | P2 | theo dõi vận hành | — | ✅ |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-auth-account-001 | Đích chuyển trang chỉ hợp lệ khi: (a) có giá trị, (b) bắt đầu bằng "/", (c) không bắt đầu bằng "//", (d) không bắt đầu bằng "/\", (e) không bắt đầu bằng "/auth", (f) không bắt đầu bằng "/login". Ví dụ "//evil.com/hack" bị bỏ. Lưu ý (e)(f) cũng chặn mọi đường dẫn có tiền tố đó (vd "/authors"). | Mở màn hình đăng nhập có tham số redirect; bấm đăng nhập/đăng ký/Google | FR-auth-account-009, FR-auth-account-005, FR-auth-account-008, FR-auth-account-013 | S3; S17 | ✅ |
| BR-auth-account-002 | Đích mặc định: sau đăng nhập (email hoặc Google) là `/app/dashboard`; sau đăng ký bằng email là `/onboarding`; đích hợp lệ do khách yêu cầu ghi đè cả hai. Đăng nhập Google bằng tài khoản mới đi tới `newUserCallbackURL` = `safeRedirect ?? "/onboarding"`; tài khoản Google đã có đi tới `callbackURL` = `safeRedirect ?? "/app/dashboard"`. | Hoàn tất xác thực | FR-auth-account-005, FR-auth-account-008, FR-auth-account-013 | S3; S17 | ✅ |
| BR-auth-account-003 | Tên hiển thị và email được cắt khoảng trắng đầu/cuối trước khi gửi; mật khẩu không bị cắt. Tên hiển thị hợp lệ khi dài 1..50 ký tự sau cắt khoảng trắng: giao diện chặn bằng `maxLength=50`, hồ sơ Google OAuth được chuẩn hóa về `1..50` ký tự qua `normalizeOAuthUserName`, và máy chủ chặn nghiêm ngặt bằng `validateUserName` (lỗi `INVALID_NAME`). | Gửi form / Tạo hoặc cập nhật user | FR-auth-account-001, FR-auth-account-006, FR-auth-account-013 | S3; S24; S1 | ✅ |
| BR-auth-account-004 | Mỗi email chỉ thuộc một tài khoản; đăng ký bằng mật khẩu với email đã thuộc tài khoản (kể cả tài khoản Google) bị từ chối với lỗi nhóm "USER_ALREADY_EXISTS" (nhận diện theo tiền tố mã). | Đăng ký | FR-auth-account-004 | S12; S3; S20 | ✅ |
| BR-auth-account-005 | Đăng ký thành công kèm đăng nhập tự động (autoSignIn bật). | Đăng ký | FR-auth-account-002 | S1; S20 | ✅ |
| BR-auth-account-006 | Máy chủ trả cùng mã `INVALID_EMAIL_OR_PASSWORD` (HTTP 401) cho mật khẩu sai, email không tồn tại và tài khoản chỉ có Google — không tiết lộ email nào có tài khoản (đã xác minh `better-auth@1.7.12` và khóa bằng test tích hợp). Giao diện dùng cùng một thông báo "Sai email hoặc mật khẩu.". | Đăng nhập | FR-auth-account-007 | S3; S20 | ✅ |
| BR-auth-account-007 | Lỗi có mã không thuộc các mã đã biết hiển thị thông báo chung theo chế độ (đăng nhập hoặc đăng ký). | Đăng nhập/đăng ký lỗi | FR-auth-account-012 | S3; S17 | ✅ |
| BR-auth-account-008 | Tài khoản Google không được tự gắn vào tài khoản mật khẩu có sẵn cùng email: thư viện trả mã `account_not_linked` (đã xác minh `better-auth@1.7.12`) và giao diện hướng dẫn "đăng nhập bằng email và mật khẩu". | Quay về `/auth?error=account_not_linked` | FR-auth-account-014 | S3; S17 | ✅ |
| BR-auth-account-009 | Trường ảnh không có trong yêu cầu (không gửi) thì không kiểm tra và giữ nguyên ảnh. | Tạo/cập nhật user | FR-auth-account-028 | S1; S2 | ✅ |
| BR-auth-account-010 | Ảnh = null nghĩa là xóa ảnh đại diện và được chấp nhận. | Cập nhật user | FR-auth-account-028 | S2; S20 | ✅ |
| BR-auth-account-011 | Ảnh không phải chuỗi hoặc là chuỗi rỗng bị từ chối. | Tạo/cập nhật user | FR-auth-account-028 | S2 | ✅ |
| BR-auth-account-012 | Ảnh dài hơn 32.000 ký tự bị từ chối; đúng 32.000 ký tự vẫn qua bước kiểm tra độ dài (so sánh "lớn hơn"). | Tạo/cập nhật user | FR-auth-account-028 | S2 | ✅ |
| BR-auth-account-013 | Ảnh bắt đầu bằng "https://" được chấp nhận; "http://" bị từ chối. | Tạo/cập nhật user | FR-auth-account-028 | S2 | ✅ |
| BR-auth-account-014 | Data URL ảnh chỉ chấp nhận định dạng webp, jpeg, png dạng base64; SVG (kể cả base64 hoặc utf8) và scheme khác (vd javascript:) bị từ chối. | Tạo/cập nhật user | FR-auth-account-028 | S2; S20 | ✅ |
| BR-auth-account-015 | Đường dẫn bắt đầu bằng "/avatars/" (avatar mẫu tĩnh) được chấp nhận; đường dẫn nội bộ khác (vd "/etc/passwd") bị từ chối. Sáu avatar mẫu của web đều phải qua kiểm tra. | Tạo/cập nhật user | FR-auth-account-028 | S2; S20 | ✅ |
| BR-auth-account-016 | Mọi giá trị ảnh còn lại bị từ chối; khi bị từ chối thì thao tác tạo/cập nhật user bị hủy với lỗi BAD_REQUEST "INVALID_IMAGE" và dữ liệu cũ giữ nguyên. | Tạo/cập nhật user | FR-auth-account-028 | S1; S2; S20 | ✅ |
| BR-auth-account-017 | Quy tắc ảnh áp dụng cho mọi thao tác tạo/cập nhật user, gồm cả khi đăng ký bằng email có kèm ảnh và khi luồng Google tạo user mới (cơ chế hook của thư viện, đã xác minh `better-auth@1.7.12`); ảnh https (kể cả URL dạng ảnh Google) được chấp nhận. | Đăng ký / cập nhật user | FR-auth-account-028 | S1; S20 | ✅ |
| BR-auth-account-018 | Một người dùng là quản trị viên khi email (cắt khoảng trắng, không phân biệt hoa/thường) nằm trong danh sách ADMIN_EMAILS (phân tách bằng dấu phẩy, bỏ phần tử rỗng). | Gọi thủ tục quản trị | FR-auth-account-026 | S11; S21 | ✅ |
| BR-auth-account-019 | Email người dùng rỗng/thiếu hoặc danh sách admin rỗng/thiếu thì không ai là admin (mặc định danh sách rỗng khi không cấu hình). | Gọi thủ tục quản trị | FR-auth-account-026 | S11; S14; S21 | ✅ |
| BR-auth-account-020 | Quyền nghe audio của một attempt: chủ attempt luôn được; quản trị viên chỉ được khi học viên đã đồng ý chia sẻ (đồng ý phải đúng là true); người khác không được kể cả khi có đồng ý. Danh sách admin rỗng thì admin không có quyền. | Truy cập audio | FR-auth-account-026 | S11; S21 | ✅ |
| BR-auth-account-021 | Guard phiên: không có dữ liệu phiên (hoặc việc hỏi phiên lỗi) thì chuyển `/auth`; tham số redirect chỉ gắn khi nơi gọi cung cấp địa chỉ đích. | Vào route bảo vệ | FR-auth-account-019, FR-auth-account-020 | S5; S18 | ✅ |
| BR-auth-account-022 | Guard onboarding: hồ sơ vắng hoặc `onboardedAt` rỗng thì chuyển `/onboarding` (không kèm redirect); có `onboardedAt` thì cho qua. | Vào route `/app`, `/exam`, `/scoring` | FR-auth-account-020 | S5; S18 | ✅ |
| BR-auth-account-023 | Chỉ ghi nhớ kết quả dương ("đã onboarding") theo mã người dùng; kết quả âm không được ghi nhớ nên lần vào sau vẫn hỏi lại. | Vào route bảo vệ | FR-auth-account-021 | S5; S18 | ✅ |
| BR-auth-account-024 | Guard onboarding "fail-open" có chủ ý: lỗi tải hồ sơ không phải chuyển hướng thì cho qua kèm cảnh báo console, và không lưu cache khi lỗi (tránh đá nhầm học viên cũ khi mạng chập chờn); lỗi chuyển hướng được ném tiếp. | Vào route bảo vệ | FR-auth-account-022 | S5; S18 | ✅ |
| BR-auth-account-025 | Đăng xuất thất bại (phản hồi lỗi hoặc ngoại lệ mạng) coi như phiên còn nguyên: báo lỗi, không xóa state cục bộ, không điều hướng. | Đăng xuất | FR-auth-account-016 | S6; S19 | ✅ |
| BR-auth-account-026 | Đăng xuất thành công: xóa khóa trạng thái prototype trong sessionStorage (lỗi khi xóa bị bỏ qua), xóa thêm bộ nhớ đệm trạng thái onboarding (`clearOnboardedUserCache`) rồi điều hướng tới `/auth` (hoặc đích truyền vào). | Đăng xuất | FR-auth-account-016 | S6; S16; S19 | ✅ |
| BR-auth-account-027 | Route admin: không có phiên → `/auth`; mọi lỗi từ bước kiểm tra admin (kể cả lỗi mạng) → `/app/dashboard` (fail-closed có chủ ý); chỉ khi bước kiểm tra thành công mới vào. | Vào `/admin/*` | FR-auth-account-024 | S9 | ✅ |
| BR-auth-account-028 | Học viên đã hoàn tất onboarding không ở lại `/onboarding` mà bị chuyển `/app/dashboard`. | Vào `/onboarding` | FR-auth-account-023 | S8; S18 | ✅ |
| BR-auth-account-029 | Khi người dùng không còn phiên, giữ lại tùy chọn giao diện (mode, voice), xóa phần dữ liệu còn lại của state học viên. | Phiên chuyển thành không có người dùng | FR-auth-account-018 | S16; S18 | ✅ |
| BR-auth-account-031 | Khi đăng nhập Google lỗi hoặc bị hủy, người dùng được đưa về `/auth`; nếu đích hợp lệ thì giữ lại đích (đã mã hóa URL) để dùng lại ở lần thử sau, nếu không hợp lệ thì quay về `/auth` trơn. | Đăng nhập Google | FR-auth-account-013 | S3; S17 | ✅ |
| BR-auth-account-032 | Giới hạn tốc độ đăng nhập/đăng ký: vượt `3 lần/10s` cho `/sign-in*`, `/sign-up*` (ngưỡng chung `100 lần/10s`) thì máy chủ trả HTTP `429` và giao diện hiển thị "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."; không khóa cứng tài khoản. Bộ đếm in-memory theo từng Worker isolate; địa chỉ client lấy từ header `cf-connecting-ip` (đáng tin khi lưu lượng đi qua domain được Cloudflare proxy `api.vox.vinhtran.io.vn`). | Gửi đăng nhập/đăng ký quá nhanh | FR-auth-account-012 | S1; OQ-12 | ✅ |
| BR-auth-account-033 | Route `/auth` khi không có tham số `error`: người dùng đã có phiên VÀ đã hoàn tất onboarding được tự chuyển sang đích hợp lệ (`safeRedirect ?? "/app/dashboard"`); người chưa onboard vẫn ở lại `/auth` (giữ nút "Quay lại" từ bước 1 của `/onboarding`). | Mở `/auth` khi đã có phiên | FR-auth-account-015 | S4; S5; OQ-8 | ✅ |

## 6. Error Matrix

> Chuỗi lỗi trích nguyên văn từ code. Thông điệp thô của máy chủ (vd "Invalid email or password") không hiển thị ở màn hình chính nên không liệt kê như wording người dùng.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-auth-account-001 | Sai email hoặc mật khẩu | Đăng nhập: máy chủ trả mã `INVALID_EMAIL_OR_PASSWORD` (HTTP 401) — gồm cả email không tồn tại và tài khoản chỉ có Google | major | FR-auth-account-007 | Banner lỗi đỏ: "Sai email hoặc mật khẩu." | Nhập lại và gửi lại | S3; S20; S17 | ✅ |
| E-auth-account-002 | Email đã được sử dụng | Đăng ký: mã bắt đầu bằng `USER_ALREADY_EXISTS` (HTTP 422) | major | FR-auth-account-004 | Banner lỗi: "Email đã được sử dụng." | Đổi email hoặc chuyển sang đăng nhập | S3; S20; S17 | ✅ |
| E-auth-account-003 | Đăng nhập không thành công (chung) | Đăng nhập trả lỗi có mã khác các mã đã biết (vd 500) hoặc không có mã | major | FR-auth-account-012 | Banner: "Đăng nhập không thành công. Vui lòng thử lại." | Thử lại | S3; S17 | ✅ |
| E-auth-account-004 | Đăng ký không thành công (chung) | Đăng ký trả lỗi có mã khác các mã đã biết hoặc không có mã | major | FR-auth-account-012 | Banner: "Đăng ký không thành công. Vui lòng thử lại." | Thử lại | S3 | ✅ |
| E-auth-account-005 | Không kết nối được máy chủ xác thực | Ngoại lệ khi gọi đăng nhập/đăng ký/Google (vd mất mạng) | major | FR-auth-account-012, FR-auth-account-013 | Banner: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." | Thử lại sau | S3; S17 | ✅ |
| E-auth-account-006 | Đăng nhập Google không thành công (trả về ngay) | Khởi tạo đăng nhập Google trả lỗi khác `429` | major | FR-auth-account-013 | Banner: "Đăng nhập Google không thành công. Vui lòng thử lại."; nút Google mở khóa lại | Thử lại | S3; S17 | ✅ |
| E-auth-account-007 | Đăng nhập Google lỗi hoặc bị hủy (quay lại `/auth`) | Địa chỉ trang có tham số `error` khác `account_not_linked` | major | FR-auth-account-014 | Banner: "Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại." | Thử lại Google hoặc dùng email | S3; S17 | ✅ |
| E-auth-account-008 | Email đã đăng ký bằng mật khẩu (Google không liên kết) | Tham số `error` = `account_not_linked` | major | FR-auth-account-014 | Banner: "Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu." | Đăng nhập bằng email + mật khẩu | S3; S17 | ✅ |
| E-auth-account-009 | Đăng xuất thất bại | Hủy phiên trả lỗi hoặc ném ngoại lệ | major | FR-auth-account-016 | Toast: "Đăng xuất thất bại. Vui lòng thử lại."; ở nguyên trang | Bấm đăng xuất lại | S6; S19 | ✅ |
| E-auth-account-010 | Yêu cầu xác thực (API) | Gọi thủ tục API riêng tư khi không có phiên: UNAUTHORIZED | major | FR-auth-account-025 | Không có màn hình riêng; phía gọi nhận lỗi UNAUTHORIZED với thông điệp "Authentication required" | Đăng nhập rồi gọi lại | S11; S21 | ✅ |
| E-auth-account-011 | Cần quyền quản trị (API) | Thủ tục quản trị bởi người không thuộc danh sách admin: FORBIDDEN | major | FR-auth-account-026 | Phía gọi nhận FORBIDDEN "Admin access required"; route admin chuyển `/app/dashboard` | Dùng tài khoản admin | S11; S21; S9 | ✅ |
| E-auth-account-012 | Ảnh đại diện không hợp lệ | Tạo/cập nhật user với ảnh vi phạm BR-auth-account-011..BR-auth-account-016: BAD_REQUEST | major | FR-auth-account-028 | Phía gọi nhận thông điệp `INVALID_IMAGE`; câu chữ hiển thị cho người dùng thuộc feature `onboarding-profile` (màn hồ sơ/avatar) | Chọn ảnh khác (nén lại, dùng https hoặc avatar mẫu) | S1; S20 | ✅ |
| E-auth-account-013 | Không có phiên (HTTP 401) ở điểm audio | Tải lên/xuống audio khi không có phiên | major | FR-auth-account-027 | Tải lên: JSON `{"error":"Unauthorized"}`; tải xuống: chữ "Unauthorized" | Đăng nhập lại | S10; S21 | ✅ |
| E-auth-account-014 | Lỗi kiểm tra trình duyệt (required / email hợp lệ / minLength mật khẩu) | Gửi form `/auth` thiếu trường bắt buộc, email sai định dạng, hoặc mật khẩu đăng ký ngắn hơn 8 ký tự (`minLength=8`; ô tên cắt ở `maxLength=50`, còn cận trên 128 ký tự của mật khẩu do máy chủ chặn và rơi vào E-003/E-004) | minor | FR-auth-account-001, FR-auth-account-003, FR-auth-account-006 | Câu chữ do trình duyệt sinh theo ngôn ngữ trình duyệt của người dùng (không tự đặt chuỗi) | Sửa trường theo gợi ý trình duyệt | S3 | ✅ |
| E-auth-account-015 | Thao tác quá nhanh (giới hạn tốc độ) | Đăng nhập/đăng ký/Google vượt `3 lần/10s` (`100 lần/10s` chung): máy chủ trả HTTP `429` | major | FR-auth-account-012, FR-auth-account-013, BR-auth-account-032 | Banner: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."; không khóa tài khoản | Chờ ít giây rồi thử lại | S1; S3; OQ-12 | ✅ |
| E-auth-account-016 | Tên hiển thị không hợp lệ | Đăng ký/cập nhật user với tên ngoài 1..50 ký tự sau `trim()`: BAD_REQUEST `INVALID_NAME` từ hook máy chủ | major | FR-auth-account-001, BR-auth-account-003 | Banner: "Tên hiển thị không hợp lệ (1–50 ký tự)."; giao diện đã chặn trước bằng `maxLength=50` | Nhập tên dài 1..50 ký tự | S24; S1 | ✅ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-auth-account-01 | Khách mới tạo được tài khoản và đi tiếp vào onboarding mà không phải đăng nhập lại | Đăng ký thành công → tự đăng nhập và vào `/onboarding` đúng 100% ca trong bộ test tích hợp; đóng góp vào chỉ tiêu PRD Mục 1 "60% học viên đăng ký hoàn thành bài thi thử đầu tiên" (`docs/_product/prd.md:14`), đo trên sản phẩm khi có học viên thật | 100% ca test tích hợp; theo dõi chỉ tiêu PRD | S3; S1; S26: `docs/_product/prd.md:14` | ✅ |
| SC-auth-account-02 | Người dùng cũ đăng nhập được và vào đúng trang đích | Đăng nhập email/Google chuyển hướng đúng đích 100% ca test (redirect hợp lệ, mặc định `/app/dashboard`, Google mới qua `newUserCallbackURL` về `/onboarding`) | 100% ca test chuyển hướng | S3; S17; S20 | ✅ |
| SC-auth-account-03 | Khu vực cần phiên/admin không truy cập được khi chưa đủ điều kiện | 100% truy cập trái phép bị chặn bằng `401`/`403`/redirect trong bộ test guard & API (`auth-guard`, `route-guards`, hai route admin, UNAUTHORIZED/FORBIDDEN của API, 401 điểm audio) | 100% ca test guard & API | S5; S9; S11; S18; S21 | ✅ |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/auth-account-reverse-erd.md`)

- **Người dùng**: tên, email (duy nhất), cờ đã xác minh email (mặc định chưa — tính năng Later theo D-03), ảnh đại diện, thời điểm tạo/cập nhật. ✅ [S12]
- **Phiên đăng nhập**: token duy nhất, hạn dùng (7 ngày, gia hạn trượt 24 giờ), địa chỉ IP, user agent; thuộc một người dùng và bị xóa khi người dùng bị xóa. ✅ [S12; NFR-006]
- **Tài khoản đăng nhập (credential/nhà cung cấp)**: mã nhà cung cấp (mật khẩu hoặc Google), mã tài khoản ngoài, mật khẩu lưu dạng băm `scrypt` trong cột `password` (`better-auth@1.7.12`), token/hạn token của nhà cung cấp; một người dùng có nhiều tài khoản đăng nhập. ✅ [S12]
- **Xác minh (verification)**: định danh, giá trị, hạn; bảng do thư viện tạo, **dự phòng cho các tính năng Later** (xác minh email, quên/đổi mật khẩu theo D-03 — `docs/_product/prd.md:69`), chưa dùng trong MVP. ✅ [S12]
- Hồ sơ học viên (`onboardedAt`) thuộc `onboarding-profile`, chỉ được đọc bởi guard. ✅ [S5]

## 9. Flows (tóm tắt — chi tiết ở `srs/auth-account-reverse-flows.md`)

1. Đăng ký bằng email (FR-auth-account-001..005, 012).
2. Đăng nhập bằng email (FR-auth-account-006..009, 012).
3. Đăng nhập bằng Google (FR-auth-account-013..014).
4. Đăng xuất (FR-auth-account-016..018).
5. Bảo vệ route theo phiên + onboarding (FR-auth-account-019..023, 015).
6. Truy cập khu vực quản trị (FR-auth-account-024, 026).
7. Hợp lệ hóa ảnh đại diện và tên hiển thị khi tạo/cập nhật user (FR-auth-account-001, 028).

## 10. Screens (tóm tắt)

| Màn hình | Route | Thành phần chính | Trạng thái màn hình | Nguồn | Nhãn |
|----------|-------|------------------|---------------------|-------|------|
| S-1 Đăng nhập / đăng ký | `/auth` | Tiêu đề "Đăng nhập Vox Flow"; dòng phụ "Không cần thẻ thanh toán. Band tổng luôn miễn phí." (nguồn cam kết: D-04, `docs/product-decisions.md:8`); nút "Tiếp tục với Google"; dải phân cách "hoặc"; form Email, Mật khẩu (+ Tên hiển thị `maxLength=50` ở chế độ đăng ký); nút "Đăng nhập" / "Tạo tài khoản"; nút chuyển chế độ; liên kết Điều khoản dịch vụ & Chính sách sử dụng; nút quay lại trang giới thiệu | Chế độ đăng nhập (mặc định) · chế độ đăng ký · đang xử lý (khóa tất cả, spinner) · có banner lỗi | S3; S4 | ✅ |

Điểm vào đăng xuất trên các màn hình khác (sidebar, bottom nav, hồ sơ): xem FR-auth-account-017. Khu màn hình legacy (`/login`, `/dashboard`) đã gỡ bỏ ở #134.

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Chỉ dùng email + mật khẩu và Google; không có magic link, không xác minh email, không quên/đổi mật khẩu ở MVP | Quyết định D-03 (`docs/product-decisions.md:7`; `docs/_product/prd.md:29,69`) | S25; S26 | ✅ |
| v1 chỉ làm Web (không ứng dụng desktop) | PRD 3.2 (`docs/_product/prd.md:69`) | S26 | ✅ |
| Lưu người dùng/phiên/tài khoản trong CSDL SQLite (D1) | Hạ tầng | S1; S12; S14 | ✅ |
| Địa chỉ gốc của máy chủ xác thực phía web lấy từ biến môi trường VITE_SERVER_URL, mặc định `http://localhost:3000` | Cấu hình web | S7 | ✅ |
| Biến môi trường không có mặc định khi triển khai: BETTER_AUTH_SECRET, CORS_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET; địa chỉ gốc của máy chủ xác thực lấy từ URL của Worker (không phải biến môi trường); ADMIN_EMAILS mặc định rỗng | Hạ tầng | S14 | ✅ |
| Cấu hình cookie SameSite=None kèm Secure (tức chỉ chạy qua HTTPS) — đã xác minh thư viện áp đúng | Cấu hình auth + `better-auth@1.7.12` | S1; S20 | ✅ |
| Miễn phí band tổng + bằng chứng câu yếu nhất; chi tiết 4 tiêu chí còn lại sau paywall | Quyết định D-04 (`docs/product-decisions.md:8`) | S25; S26 | ✅ |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Google OAuth (client id/secret, redirect URI `.../api/auth/callback/google` trên máy chủ) | Google / người cấu hình | Đăng nhập Google | S1; S20 | ✅ |
| Dịch vụ hồ sơ học viên (`onboardedAt`) | feature `onboarding-profile` | Guard onboarding (nếu lỗi thì cho qua) | S5 | ✅ |
| Khai báo nhà cung cấp OAuth: Google cần bật trong cấu hình triển khai | Hạ tầng | Đăng nhập Google | S14 | ✅ |
| Trang Điều khoản dịch vụ `/terms` | feature `landing-page` | Liên kết trên màn hình đăng nhập | S3 | ✅ |
| Domain được Cloudflare proxy (`api.vox.vinhtran.io.vn`) để header `cf-connecting-ip` đáng tin | Hạ tầng | Độ chính xác của giới hạn tốc độ | S1; OQ-12 | ✅ |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Máy chủ áp mật khẩu 8..128 ký tự khớp ràng buộc 8 ký tự của form (đã cấu hình tường minh) | FR-auth-account-003, E-auth-account-014 (nếu khác thì form và server lệch) | S1; NFR-006 | ✅ |
| Thư viện trả mã `INVALID_EMAIL_OR_PASSWORD`, tiền tố `USER_ALREADY_EXISTS`, `account_not_linked` đúng như UI kỳ vọng (đã xác minh `better-auth@1.7.12` và khóa bằng test tích hợp cho hai mã đầu) | FR-auth-account-004, FR-auth-account-007, FR-auth-account-014 | S20 | ✅ |
| Phiên cookie hiệu lực 7 ngày, gia hạn trượt 24 giờ — đủ cho các buổi luyện trong tuần | FR-auth-account-019, FR-auth-account-020 | NFR-006 | ✅ |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Toàn bộ đã chốt ở Issue #134 (2026-11-12).

- [x] OQ-1: Chính sách mật khẩu phía máy chủ — chốt: 8..128 ký tự, băm `scrypt` (`better-auth@1.7.12`), khớp form.
- [x] OQ-2: Thời hạn phiên và "ghi nhớ đăng nhập" — chốt: 7 ngày, gia hạn trượt 24 giờ, cookie luôn bền vững, không có hộp kiểm.
- [x] OQ-3: Xác minh email — chốt: không có trong MVP theo D-03.
- [x] OQ-4: Quên/đặt lại mật khẩu — chốt: ngoài MVP theo D-03, xếp Later.
- [x] OQ-5: Khu legacy giữ hay gỡ — chốt: gỡ bỏ hoàn toàn ở #134.
- [x] OQ-6: Đăng nhập Google thuộc feature nào — chốt: thuộc `auth-account` theo D-03 / PRD F-02; roadmap đã đồng bộ.
- [x] OQ-7: Priority và mục tiêu actor — chốt: gán theo PRD Mục 1–2 (Mục 2..4, 7 của spec này).
- [x] OQ-17: Email không tồn tại trả cùng lỗi? — chốt: cùng `401 INVALID_EMAIL_OR_PASSWORD` (xác minh `better-auth@1.7.12` + test tích hợp).
- [x] OQ-18: Cookie có đúng SameSite/Secure/HttpOnly? — chốt: có (xác minh `better-auth@1.7.12`, `cookies/index.mjs` + test tích hợp Set-Cookie).
