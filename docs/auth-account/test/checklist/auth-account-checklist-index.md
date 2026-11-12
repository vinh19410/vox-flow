---
type: test-checklist-index
feature: auth-account
status: draft
updated: 2026-11-12
next_chk_id: 111
links:
  - docs/auth-account/srs/auth-account-spec.md
  - docs/_reverse/auth-account/auth-account-reverse-spec.md
  - docs/_reverse/auth-account/srs/auth-account-reverse-flows.md
  - docs/_reverse/auth-account/srs/auth-account-reverse-states.md
  - docs/_reverse/auth-account/srs/auth-account-reverse-erd.md
  - docs/_reverse/auth-account/usecases/auth-account-reverse-usecase-index.md
  - docs/_product/prd.md
  - docs/auth-account/test/api/api-checklist.md
  - docs/auth-account/test/test-strategy.md
---

# Test Checklists — auth-account

## Checklists

| Scope | Target | File | Items | P1 | P2 | P3 | P4 | Auto | Status | Updated |
|-------|--------|------|-------|----|----|----|----|------|--------|---------|
| feature | — | [checklist-feature.md](checklist-feature.md) | 110 | 48 | 50 | 12 | 0 | 107/3 | draft | 2026-11-12 |

## Coverage

> Đối chiếu nghĩa vụ test ↔ CHK (per-obligation). Nguồn edge VERIFIES cho KG. Coverage table là **bản đồ điều hướng**, KHÔNG phải nguồn nội dung TC. Tầng: UI · API · —. Trạng thái: covered · excluded-approved · blocked · tbd · partial.

| Source ID | Nghĩa vụ (obligation) | Scope | CHK-ID | Tầng | Trạng thái | Lý do (nếu excluded) |
|-----------|----------------------|-------|--------|------|-----------|----------------------|
| FR-auth-account-001 | happy: đăng ký email + mật khẩu + tên hiển thị (1..50 ký tự, cắt khoảng trắng) | feature | CHK-auth-account-018, CHK-auth-account-020, CHK-auth-account-023 | UI | covered | — |
| FR-auth-account-001 | alternate/error: tên rỗng khoảng trắng / vượt biên 50 ký tự / thiếu trường (API ACL#2,3,6,7,11,12,13,31,33) | feature | CHK-auth-account-010, CHK-auth-account-069, CHK-auth-account-070, CHK-auth-account-072, CHK-auth-account-107 | UI, API | covered | — |
| FR-auth-account-002 | happy: tự đăng nhập và cấp phiên ngay sau đăng ký (API ACL#2) | feature | CHK-auth-account-018 | UI, API | covered | — |
| FR-auth-account-003 | happy/boundary: gợi ý tối thiểu 8 ký tự khi đăng ký, biên 8..128 ký tự (API ACL#8,9,10,22) | feature | CHK-auth-account-010, CHK-auth-account-021, CHK-auth-account-022, CHK-auth-account-031, CHK-auth-account-071, CHK-auth-account-073, CHK-auth-account-074 | UI, API | covered | — |
| FR-auth-account-004 | error: từ chối đăng ký trùng email mật khẩu & email Google (API ACL#5) | feature | CHK-auth-account-025, CHK-auth-account-026 | UI, API | covered | — |
| FR-auth-account-005 | happy/alternate: tải lại toàn trang sau đăng ký về `/onboarding` hoặc `redirect` hợp lệ | feature | CHK-auth-account-018, CHK-auth-account-019, CHK-auth-account-024 | UI | covered | — |
| FR-auth-account-006 | happy: đăng nhập bằng email (cắt khoảng trắng) + mật khẩu nguyên bản (API ACL#18,21) | feature | CHK-auth-account-007, CHK-auth-account-028, CHK-auth-account-030, CHK-auth-account-031, CHK-auth-account-068, CHK-auth-account-070, CHK-auth-account-107 | UI, API | covered | — |
| FR-auth-account-007 | error/security: từ chối mật khẩu sai, email không tồn tại, tài khoản chỉ Google cùng thông báo (API ACL#19,20) | feature | CHK-auth-account-033, CHK-auth-account-034, CHK-auth-account-035 | UI, API | covered | — |
| FR-auth-account-008 | happy/alternate: tải lại toàn trang sau đăng nhập về `/app/dashboard` hoặc `redirect` hợp lệ | feature | CHK-auth-account-028, CHK-auth-account-029, CHK-auth-account-032 | UI | covered | — |
| FR-auth-account-009 | security: chỉ chấp nhận đích chuyển trang nội bộ an toàn (API ACL#27) | feature | CHK-auth-account-019, CHK-auth-account-029, CHK-auth-account-045, CHK-auth-account-084, CHK-auth-account-085 | UI, API | covered | — |
| FR-auth-account-010 | happy: chuyển đổi chế độ đăng nhập ↔ đăng ký, xóa lỗi cục bộ, giữ giá trị đã nhập | feature | CHK-auth-account-007, CHK-auth-account-010, CHK-auth-account-011, CHK-auth-account-012, CHK-auth-account-013 | UI | covered | — |
| FR-auth-account-011 | happy/recovery: khóa ô nhập & nút khi đang xử lý, chống bấm đúp, mở khóa khi lỗi | feature | CHK-auth-account-027, CHK-auth-account-095, CHK-auth-account-096, CHK-auth-account-102 | UI | covered | — |
| FR-auth-account-012 | error: thông báo lỗi chung theo chế độ, lỗi mạng kết nối và lỗi giới hạn tốc độ 429 (API ACL#17,24) | feature | CHK-auth-account-073, CHK-auth-account-074, CHK-auth-account-075, CHK-auth-account-076, CHK-auth-account-077, CHK-auth-account-078 | UI, API | covered | — |
| FR-auth-account-013 | happy/alternate: khởi tạo & hoàn tất đăng nhập Google cho tài khoản cũ/mới, lỗi khởi tạo/mạng/429 (API ACL#25,26) | feature | CHK-auth-account-007, CHK-auth-account-036, CHK-auth-account-037, CHK-auth-account-038, CHK-auth-account-039, CHK-auth-account-044, CHK-auth-account-077, CHK-auth-account-078, CHK-auth-account-096 | UI, API | covered | — |
| FR-auth-account-014 | error/alternate: hiển thị lỗi Google từ URL (`account_not_linked`, lỗi khác, mảng tham số, ưu tiên lỗi cục bộ) | feature | CHK-auth-account-017, CHK-auth-account-040, CHK-auth-account-041, CHK-auth-account-042, CHK-auth-account-043 | UI | covered | — |
| FR-auth-account-015 | happy/alternate: nhận tham số `redirect`/`error`, chuyển người đã onboard đi, giữ người chưa onboard ở lại `/auth` | feature | CHK-auth-account-014, CHK-auth-account-015, CHK-auth-account-016, CHK-auth-account-017, CHK-auth-account-086, CHK-auth-account-105 | UI | covered | — |
| FR-auth-account-016 | happy/error: đăng xuất hủy phiên, xóa `sessionStorage` + cache onboarding, điều hướng `/auth`; lỗi thì hiện toast giữ nguyên trang (API ACL#37) | feature | CHK-auth-account-046, CHK-auth-account-047, CHK-auth-account-048, CHK-auth-account-049, CHK-auth-account-052, CHK-auth-account-053, CHK-auth-account-103 | UI, API | covered | — |
| FR-auth-account-017 | happy: đăng xuất khả dụng đủ 3 điểm vào (sidebar desktop, menu header mobile, màn hình hồ sơ) | feature | CHK-auth-account-046, CHK-auth-account-047, CHK-auth-account-048, CHK-auth-account-099, CHK-auth-account-101 | UI | covered | — |
| FR-auth-account-018 | side-effect: reset trạng thái học viên khi mất phiên (giữ `mode`, `voice`); không reset khi đang tải phiên | feature | CHK-auth-account-050, CHK-auth-account-051 | UI | covered | — |
| FR-auth-account-019 | guard: route cần phiên (`/onboarding`) chuyển khách không phiên hoặc lỗi mạng về `/auth?redirect=...` (API ACL#28,29) | feature | CHK-auth-account-054, CHK-auth-account-055, CHK-auth-account-056, CHK-auth-account-106 | UI, API | covered | — |
| FR-auth-account-020 | guard: route `/app/*`, `/exam`, `/scoring` yêu cầu phiên + đã hoàn tất onboarding | feature | CHK-auth-account-055, CHK-auth-account-057, CHK-auth-account-058, CHK-auth-account-103, CHK-auth-account-104 | UI | covered | — |
| FR-auth-account-021 | happy: ghi nhớ trạng thái đã onboarding trong bộ nhớ phiên làm việc, không lưu kết quả âm | feature | CHK-auth-account-058, CHK-auth-account-059 | UI | covered | — |
| FR-auth-account-022 | recovery: fail-open cho qua kèm cảnh báo console khi lỗi tải hồ sơ không phải redirect | feature | CHK-auth-account-060 | UI | covered | — |
| FR-auth-account-023 | guard/alternate: `/onboarding` đẩy học viên đã xong sang `/app/dashboard`; bỏ qua lỗi tải hồ sơ | feature | CHK-auth-account-061, CHK-auth-account-062 | UI | covered | — |
| FR-auth-account-024 | guard: khu vực quản trị `/admin/disputes` & `/admin/forecast` chặn không phiên về `/auth`, lỗi kiểm tra admin về `/app/dashboard` | feature | CHK-auth-account-063, CHK-auth-account-064, CHK-auth-account-066, CHK-auth-account-067 | UI | covered | — |
| FR-auth-account-025 | security: thủ tục API riêng tư từ chối không phiên với `UNAUTHORIZED` (API ACL#36,38,39) | feature | CHK-auth-account-090, CHK-auth-account-106 | UI, API | covered | — |
| FR-auth-account-026 | security: thủ tục quản trị kiểm tra phiên + `ADMIN_EMAILS`, trả `FORBIDDEN` nếu không phải admin (API ACL#40,41) | feature | CHK-auth-account-064, CHK-auth-account-065, CHK-auth-account-067, CHK-auth-account-090, CHK-auth-account-093, CHK-auth-account-094 | UI, API | covered | — |
| FR-auth-account-027 | security: điểm tải lên & tải xuống audio trả HTTP `401` khi không có phiên | feature | CHK-auth-account-091, CHK-auth-account-092 | UI | covered | — |
| FR-auth-account-028 | validation/security: hợp lệ hóa ảnh đại diện khi tạo/cập nhật tài khoản (API ACL#4,14,15,32,34,36) | feature | CHK-auth-account-079, CHK-auth-account-080, CHK-auth-account-081, CHK-auth-account-082, CHK-auth-account-083 | UI, API | covered | — |
| FR-auth-account-029 | happy: điều hướng mở `/auth` từ Landing, Terms, Onboarding bước 1 và điều hướng ra khỏi `/auth` | feature | CHK-auth-account-001, CHK-auth-account-002, CHK-auth-account-003, CHK-auth-account-004, CHK-auth-account-005, CHK-auth-account-006, CHK-auth-account-008, CHK-auth-account-009, CHK-auth-account-108 | UI | covered | — |
| NFR-auth-account-001 | security: cookie phiên có đủ `SameSite=None`, `Secure`, `HttpOnly` (API ACL#2,18) | feature | CHK-auth-account-087 | UI, API | covered | — |
| NFR-auth-account-002 | security: chỉ chấp nhận nguồn web tin cậy `CORS_ORIGIN` đã bỏ `/` cuối (API ACL#16,23,27) | feature | CHK-auth-account-089 | UI, API | covered | — |
| NFR-auth-account-003 | security: chống open redirect trên mọi đích chuyển trang sau xác thực (API ACL#27) | feature | CHK-auth-account-084, CHK-auth-account-085 | UI, API | covered | — |
| NFR-auth-account-004 | security: ảnh đại diện chống vector XSS/script, tối đa 32.000 ký tự (API ACL#14,15,34) | feature | CHK-auth-account-080, CHK-auth-account-081, CHK-auth-account-082, CHK-auth-account-083 | UI, API | covered | — |
| NFR-auth-account-005 | security: bí mật ký phiên và khóa OAuth Google nạp từ biến môi trường, không lộ ở client | feature | CHK-auth-account-088 | UI | covered | — |
| NFR-auth-account-006 | security: mật khẩu 8..128 ký tự, phiên 7 ngày trượt 24h, rate-limit `3 lần/10s` không khóa cứng tài khoản (API ACL#8,9,10,17,18,22,24,28) | feature | CHK-auth-account-021, CHK-auth-account-022, CHK-auth-account-073, CHK-auth-account-074, CHK-auth-account-078, CHK-auth-account-087 | UI, API | covered | — |
| NFR-auth-account-007 | availability: mất kết nối không treo giao diện; guard coi lỗi mạng hỏi phiên như chưa đăng nhập | feature | CHK-auth-account-056, CHK-auth-account-077 | UI | covered | — |
| NFR-auth-account-008 | usability/a11y: tiếng Việt, gắn nhãn `label`–`input`, đúng `autoComplete`, HTML5 validation gốc | feature | CHK-auth-account-097, CHK-auth-account-107 | UI | covered | — |
| NFR-auth-account-009 | compatibility: tải lại toàn trang (full page load) sau đăng nhập/đăng ký | feature | CHK-auth-account-024, CHK-auth-account-032 | UI | covered | — |
| NFR-auth-account-010 | performance: ngưỡng thời gian phản hồi & tải người dùng đồng thời | feature | — | — | excluded-approved | SRS Mục 4 ghi chưa đặt chỉ tiêu ở MVP, theo dõi khi mở học viên thật; ngoài profile Core-functional (BA duyệt 2026-11-12) |
| NFR-auth-account-011 | compliance: chỉ chủ sở hữu tài khoản xem được thông tin phiên của mình (API ACL#28) | feature | CHK-auth-account-110 | UI, API | covered | — |
| BR-auth-account-001 | branch: lọc đường dẫn `redirect` hợp lệ (bắt đầu `/`, chặn `//`, `/\`, `/auth`, `/login`) | feature | CHK-auth-account-015, CHK-auth-account-019, CHK-auth-account-029, CHK-auth-account-037, CHK-auth-account-084, CHK-auth-account-085, CHK-auth-account-086 | UI | covered | — |
| BR-auth-account-002 | branch: đích mặc định đăng nhập `/app/dashboard`, đăng ký `/onboarding`, Google cũ/mới & ghi đè bởi `safeRedirect` (API ACL#25) | feature | CHK-auth-account-018, CHK-auth-account-019, CHK-auth-account-028, CHK-auth-account-029, CHK-auth-account-036, CHK-auth-account-037, CHK-auth-account-038, CHK-auth-account-039 | UI, API | covered | — |
| BR-auth-account-003 | branch: cắt khoảng trắng tên/email, giữ nguyên mật khẩu, chuẩn hóa tên 1..50 ký tự (API ACL#3,11,12,13,31,33) | feature | CHK-auth-account-020, CHK-auth-account-023, CHK-auth-account-030, CHK-auth-account-038, CHK-auth-account-072 | UI, API | covered | — |
| BR-auth-account-004 | branch: mỗi email một tài khoản, từ chối đăng ký trùng và chặn đổi email (API ACL#5,35) | feature | CHK-auth-account-025, CHK-auth-account-026 | UI, API | covered | — |
| BR-auth-account-005 | branch: đăng ký thành công bật `autoSignIn` tự động cấp phiên (API ACL#2) | feature | CHK-auth-account-018 | UI, API | covered | — |
| BR-auth-account-006 | branch: trả cùng mã `INVALID_EMAIL_OR_PASSWORD` & cùng câu chữ cho sai mật khẩu / email lạ / chỉ Google (API ACL#19,20) | feature | CHK-auth-account-033, CHK-auth-account-034, CHK-auth-account-035 | UI, API | covered | — |
| BR-auth-account-007 | branch: mã lỗi ngoài danh mục hiển thị thông báo chung theo chế độ đăng nhập/đăng ký | feature | CHK-auth-account-075, CHK-auth-account-076 | UI | covered | — |
| BR-auth-account-008 | branch: không tự gắn Google vào tài khoản mật khẩu cùng email (`account_not_linked`) | feature | CHK-auth-account-040 | UI | covered | — |
| BR-auth-account-009 | branch: không gửi trường `image` thì bỏ qua kiểm tra và giữ nguyên ảnh | feature | CHK-auth-account-079 | UI | covered | — |
| BR-auth-account-010 | branch: `image = null` xóa ảnh đại diện hợp lệ (API ACL#32) | feature | CHK-auth-account-080 | UI, API | covered | — |
| BR-auth-account-011 | branch: `image` không phải chuỗi hoặc là chuỗi rỗng bị từ chối | feature | CHK-auth-account-083 | UI | covered | — |
| BR-auth-account-012 | branch: `image` dài đúng 32.000 ký tự qua kiểm tra, `> 32.000` ký tự bị từ chối (API ACL#15) | feature | CHK-auth-account-081, CHK-auth-account-082 | UI, API | covered | — |
| BR-auth-account-013 | branch: `https://` chấp nhận, `http://` bị từ chối (API ACL#4,34) | feature | CHK-auth-account-080, CHK-auth-account-083 | UI, API | covered | — |
| BR-auth-account-014 | branch: data URL chỉ nhận `webp`/`jpeg`/`png` base64; từ chối SVG và scheme khác (API ACL#14,32) | feature | CHK-auth-account-080, CHK-auth-account-083 | UI, API | covered | — |
| BR-auth-account-015 | branch: chấp nhận 6 mẫu `/avatars/*`, từ chối đường dẫn nội bộ khác như `/etc/passwd` (API ACL#32,34) | feature | CHK-auth-account-080, CHK-auth-account-083 | UI, API | covered | — |
| BR-auth-account-016 | branch: giá trị ảnh không hợp lệ hủy thao tác với `INVALID_IMAGE` và giữ nguyên dữ liệu cũ (API ACL#14,34) | feature | CHK-auth-account-083 | UI, API | covered | — |
| BR-auth-account-017 | branch: quy tắc ảnh áp cho cả đăng ký email kèm ảnh và tạo user mới qua Google (API ACL#4) | feature | CHK-auth-account-038 | UI, API | covered | — |
| BR-auth-account-018 | branch: khớp email quản trị theo `ADMIN_EMAILS` đã cắt khoảng trắng, không phân biệt hoa/thường (API ACL#41) | feature | CHK-auth-account-064, CHK-auth-account-067 | UI, API | covered | — |
| BR-auth-account-019 | branch: email rỗng hoặc `ADMIN_EMAILS` rỗng/chưa cấu hình thì không ai là admin (API ACL#41) | feature | CHK-auth-account-064, CHK-auth-account-065 | UI, API | covered | — |
| BR-auth-account-020 | branch: quyền nghe audio attempt (chủ attempt luôn được; admin chỉ khi đồng ý chia sẻ `true`; người khác bị chặn) | feature | CHK-auth-account-093, CHK-auth-account-094 | UI | covered | — |
| BR-auth-account-021 | branch: guard phiên chuyển `/auth` kèm `redirect` khi thiếu phiên hoặc lỗi hỏi phiên (API ACL#29) | feature | CHK-auth-account-054, CHK-auth-account-055, CHK-auth-account-056 | UI, API | covered | — |
| BR-auth-account-022 | branch: guard onboarding chuyển `/onboarding` khi thiếu `onboardedAt`, cho qua khi đã có | feature | CHK-auth-account-057, CHK-auth-account-058 | UI | covered | — |
| BR-auth-account-023 | branch: chỉ cache kết quả dương đã onboarding theo `userId`, không cache kết quả âm | feature | CHK-auth-account-058, CHK-auth-account-059 | UI | covered | — |
| BR-auth-account-024 | branch: guard onboarding fail-open khi lỗi tải hồ sơ không phải redirect, không lưu cache | feature | CHK-auth-account-060 | UI | covered | — |
| BR-auth-account-025 | branch: đăng xuất thất bại coi như phiên còn nguyên, hiện lỗi và giữ nguyên trang | feature | CHK-auth-account-052, CHK-auth-account-053 | UI | covered | — |
| BR-auth-account-026 | branch: đăng xuất thành công xóa `sessionStorage` + `clearOnboardedUserCache` và điều hướng `/auth` (API ACL#37) | feature | CHK-auth-account-046, CHK-auth-account-047, CHK-auth-account-048, CHK-auth-account-049, CHK-auth-account-103 | UI, API | covered | — |
| BR-auth-account-027 | branch: route admin thiếu phiên về `/auth`, lỗi kiểm tra bất kỳ về `/app/dashboard` (fail-closed) | feature | CHK-auth-account-063, CHK-auth-account-064, CHK-auth-account-066, CHK-auth-account-067 | UI | covered | — |
| BR-auth-account-028 | branch: học viên đã hoàn tất onboarding vào `/onboarding` bị đẩy sang `/app/dashboard` | feature | CHK-auth-account-061 | UI | covered | — |
| BR-auth-account-029 | branch: mất phiên giữ lại `mode`, `voice` và xóa phần state học viên còn lại | feature | CHK-auth-account-050 | UI | covered | — |
| BR-auth-account-031 | branch: lỗi/hủy Google đưa về `/auth` kèm `redirect` đã mã hóa nếu hợp lệ, hoặc `/auth` trơn (API ACL#25) | feature | CHK-auth-account-036, CHK-auth-account-037, CHK-auth-account-045 | UI, API | covered | — |
| BR-auth-account-032 | branch: giới hạn tốc độ `3 lần/10s` trả HTTP `429`, hiện thông báo tiếng Việt, không khóa cứng tài khoản (API ACL#17,24) | feature | CHK-auth-account-078 | UI, API | covered | — |
| BR-auth-account-033 | branch: `/auth` không có `?error=` tự chuyển người đã onboard đi, giữ người chưa onboard ở lại | feature | CHK-auth-account-006, CHK-auth-account-014, CHK-auth-account-015, CHK-auth-account-016, CHK-auth-account-017 | UI | covered | — |
| BR-auth-account-034 | branch: bất biến địa chỉ email của tài khoản khi cập nhật người dùng (API ACL#35) | feature | CHK-auth-account-109 | UI, API | covered | — |
| E-auth-account-001 | message + recovery: banner đỏ "Sai email hoặc mật khẩu.", mở khóa nút gửi lại (API ACL#19,20) | feature | CHK-auth-account-033, CHK-auth-account-034, CHK-auth-account-035 | UI, API | covered | — |
| E-auth-account-002 | message + recovery: banner "Email đã được sử dụng.", giữ dữ liệu form (API ACL#5) | feature | CHK-auth-account-025, CHK-auth-account-026, CHK-auth-account-027 | UI, API | covered | — |
| E-auth-account-003 | message + recovery: banner "Đăng nhập không thành công. Vui lòng thử lại." (API ACL#22) | feature | CHK-auth-account-074, CHK-auth-account-075 | UI, API | covered | — |
| E-auth-account-004 | message + recovery: banner "Đăng ký không thành công. Vui lòng thử lại." (API ACL#10) | feature | CHK-auth-account-073, CHK-auth-account-076 | UI, API | covered | — |
| E-auth-account-005 | message + recovery: banner "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.", mở khóa nút | feature | CHK-auth-account-077 | UI | covered | — |
| E-auth-account-006 | message + recovery: banner "Đăng nhập Google không thành công. Vui lòng thử lại.", mở khóa nút Google (API ACL#26) | feature | CHK-auth-account-044 | UI, API | covered | — |
| E-auth-account-007 | message + recovery: banner lỗi/hủy Google quay lại `/auth?error=...` khác `account_not_linked` | feature | CHK-auth-account-041 | UI | covered | — |
| E-auth-account-008 | message + recovery: banner hướng dẫn đăng nhập mật khẩu khi `?error=account_not_linked` | feature | CHK-auth-account-040 | UI | covered | — |
| E-auth-account-009 | message + side-effect: toast "Đăng xuất thất bại. Vui lòng thử lại.", giữ nguyên trang & state | feature | CHK-auth-account-052, CHK-auth-account-053 | UI | covered | — |
| E-auth-account-010 | message: API trả `UNAUTHORIZED` "Authentication required" khi thiếu phiên (API ACL#39,40) | feature | CHK-auth-account-090 | UI, API | covered | — |
| E-auth-account-011 | message + side-effect: API trả `FORBIDDEN` "Admin access required", route admin chuyển `/app/dashboard` (API ACL#41) | feature | CHK-auth-account-064, CHK-auth-account-065 | UI, API | covered | — |
| E-auth-account-012 | message + side-effect: trả `BAD_REQUEST` `INVALID_IMAGE`, giữ nguyên dữ liệu cũ (API ACL#14,15,34) | feature | CHK-auth-account-081, CHK-auth-account-082, CHK-auth-account-083 | UI, API | covered | — |
| E-auth-account-013 | message: điểm audio trả HTTP `401` (`{"error":"Unauthorized"}` khi tải lên, `"Unauthorized"` khi tải xuống) | feature | CHK-auth-account-091, CHK-auth-account-092 | UI | covered | — |
| E-auth-account-014 | message + recovery: trình duyệt chặn gửi form với câu chữ HTML5 gốc (thiếu trường, sai email, mật khẩu `< 8`) (API ACL#6,7,8,21) | feature | CHK-auth-account-068, CHK-auth-account-069, CHK-auth-account-070, CHK-auth-account-071 | UI, API | covered | — |
| E-auth-account-015 | message + side-effect: HTTP `429` hiện banner "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.", không khóa tài khoản (API ACL#17,24) | feature | CHK-auth-account-078 | UI, API | covered | — |
| E-auth-account-016 | message + side-effect: `INVALID_NAME` hiện banner "Tên hiển thị không hợp lệ (1–50 ký tự)." (API ACL#11,13,33) | feature | CHK-auth-account-072 | UI, API | covered | — |
| E-auth-account-017 | message + side-effect: `EMAIL_CAN_NOT_BE_UPDATED` từ chối đổi email và giữ nguyên email gốc (API ACL#35) | feature | CHK-auth-account-109 | UI, API | covered | — |

## Retired CHK-IDs

> ID của item đã xóa — KHÔNG reuse, KHÔNG lấp gap. List máy-đọc (validator reject nếu item sống mang ID ở đây).

| CHK-ID | Retired date | Lý do |
|--------|--------------|-------|

## Changelog

| Ngày | Scope | Tóm tắt thay đổi |
|------|-------|------------------|
| 2026-11-12 | `[feature]` | generated 110 items (12 categories) từ SRS `auth-account` + 6 UC + đối chiếu 41 API checklist items |
