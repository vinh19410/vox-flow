---
type: reverse-srs
feature: onboarding-profile
status: draft
updated: 2026-11-11
confidence_summary: "✅101 🔵8 🟡6"
links:
  - docs/_reverse/onboarding-profile/reverse-sources.md
  - docs/_reverse/onboarding-profile/reverse-gaps.md
  - docs/_reverse/onboarding-profile/_evidence.md
  - docs/_reverse/onboarding-profile/srs/onboarding-profile-reverse-flows.md
  - docs/_reverse/onboarding-profile/srs/onboarding-profile-reverse-states.md
  - docs/_reverse/onboarding-profile/srs/onboarding-profile-reverse-erd.md
  - docs/_reverse/onboarding-profile/usecases/onboarding-profile-reverse-usecase-index.md
---

# onboarding-profile — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập từ source code, **CHƯA duyệt**). Nhãn: ✅ chắc chắn (code/test khẳng định) · 🔵 suy đoán (≥2 chỗ code hậu thuận) · 🟡 cần xác nhận (code không nói). Priority luôn 🟡 vì code không mang P0/P1/P2 (cột Priority không tính vào confidence_summary, chỉ đếm cột Nhãn).

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái tài liệu:** bản tái lập nháp, **CHƯA duyệt** bởi PO/BA. Không dùng làm baseline hợp đồng.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md) (S1-S35).
- **Audit độc lập:** đã chạy 2026-11-11, hạ 1 claim, sửa 10 cite.
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Bằng chứng code → luồng:** xem [`_evidence.md`](./_evidence.md).
- Test không được chạy; các khẳng định "test phủ" dựa trên đọc assertion.

### 0.3 Khác biệt với tài liệu chính

| Điểm | Reverse nói (từ nguồn) | Doc chính nói | Đề xuất |
|------|------------------------|---------------|---------|
| Số bước onboarding | 2 bước: mục tiêu rồi kiểm tra mic ✅ [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:34] | Quyết định D-10 loại bỏ bước đồng ý dữ liệu khỏi Onboarding [S35: docs/product-decisions.md:14 D-10] — khớp | Không cần đổi |
| Mục đích ngày thi | Grep không thấy logic nhịp luyện hằng ngày hay nhắc báo band; ngày thi chỉ được lưu và dùng cho đếm ngược/thời hạn gói (negative-search ở reverse-gaps.md). Văn bản giao diện nêu mục đích khác: "so sánh tiến độ và gợi ý việc cần luyện mỗi ngày" [S9: apps/web/src/features/onboarding/components/goal-step.tsx:57] và "đo lường độ lệch và gợi ý bài tập trọng tâm" [S17: apps/web/src/features/profile/profile-screen.tsx:272] 🟡 | PRD F-03: dùng để tính nhịp luyện tập hằng ngày và nhắc báo điểm thật sau ngày thi [S35: docs/_product/prd.md:79] | 🟡 `/gap` — OQ-2 |
| Kiểm tra mic | Mic thật qua trình duyệt, đạt khi có tín hiệu trong 5 giây ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:43-54] | PRD F-04 test mic [S35: docs/_product/prd.md:46]; roadmap ghi "thật (mic)" [S35: docs/roadmap-chamro.md:54] | Khớp, không cần đổi |
| Priority | Code không có priority | Roadmap ghi nhóm "Must" cho `onboarding` ở mức feature [S35: docs/roadmap-chamro.md:54] | 🟡 OQ-1 — không quy đổi sang P0/P1/P2 |

## 1. Scope

Feature cho phép **học viên đã có tài khoản** (đăng nhập bằng phương thức nào là ngoài phạm vi) hoàn tất thiết lập ban đầu rồi quản lý hồ sơ cá nhân:

1. Chọn band mục tiêu (5.0 đến 9.0, bước 0.5) và ngày thi dự kiến (tùy chọn) khi onboarding. ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:9-90]
2. Kiểm tra micro 5 giây trước khi vào ứng dụng; chỉ khi đạt mới hoàn tất onboarding. ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:43-54, 161-164]
3. Hệ thống ghi nhận thời điểm hoàn tất onboarding (một lần, không đổi về sau) và dùng nó để chặn vào khu vực ứng dụng khi chưa onboard. ✅ [S1: packages/api/src/routers/profile.ts:108-118] [S14: apps/web/src/lib/auth-guard.ts:52-56]
4. Xem hồ sơ; sửa tên hiển thị, mục tiêu band/ngày thi; đổi ảnh đại diện (mẫu có sẵn, tải lên, link https). ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:70-158] [S18: apps/web/src/features/profile/components/avatar-modal.tsx:26-67]
5. Đồng bộ mục tiêu từ hồ sơ đã lưu vào trạng thái ứng dụng mỗi khi đăng nhập. ✅ [S13: apps/web/src/features/app-state/use-profile-hydration.ts:55-77]

**Boundary (ngoài phạm vi):**
- Đăng ký/đăng nhập/đăng xuất (chỉ nhắc: đăng ký mới mặc định được chuyển tới onboarding ✅ [S32: apps/web/src/features/auth/auth-screen.tsx:21, 74]).
- Thẻ "Gói hiện tại" và nút "Quản lý & Nâng cấp gói" trên màn Hồ sơ thuộc feature thanh toán; nút "Đăng xuất tài khoản" thuộc feature xác thực. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:373-455]
- Ghi âm bài thi, chấm điểm, đồng ý dữ liệu (đã loại khỏi onboarding theo D-10).
- Gửi nhắc/đếm ngược ngày thi (chỉ lưu giá trị; consumer nằm ở dashboard/billing). 🟡 OQ-2

## 2. Actors & Stakeholders

| Actor | Loại | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|------|----------|--------------|-------|------|
| Học viên mới (chưa onboard) | người | Đặt mục tiêu, kiểm tra mic, vào ứng dụng | Có | [S15: apps/web/src/routes/_proto/onboarding.tsx:14-17] [S14: apps/web/src/lib/auth-guard.ts:52-56] | ✅ |
| Học viên đã onboard | người | Xem/sửa hồ sơ, mục tiêu, tên, ảnh đại diện | Có | [S16: apps/web/src/routes/_proto/app/profile.tsx:5-7] [S30: apps/web/src/routes/_proto/app/route.tsx:7] | ✅ |
| Trình duyệt/thiết bị micro | ngoài | Cấp quyền và cung cấp tín hiệu âm thanh | Có (phụ thuộc) | [S12: apps/web/src/hooks/use-mic-level.ts:40] | ✅ |
| Dịch vụ xác thực (phiên + cập nhật tên/ảnh) | hệ thống | Xác thực phiên; lưu tên/ảnh; kiểm tra ảnh | Có (phụ thuộc) | [S5: packages/auth/src/index.ts:46-73] [S17: apps/web/src/features/profile/profile-screen.tsx:83-86] | ✅ |
| Quản trị viên | người | Không có thao tác nào trong feature này | Không | [S29: packages/api/src/index.ts:15-22] (chỉ có thủ tục dành cho người dùng đã đăng nhập, không có thủ tục admin cho hồ sơ) | 🔵 |
| Chủ sản phẩm/BA | người | Chốt priority, mục đích ngày thi, hành vi bắt buộc kiểm tra mic | Có (stakeholder) | — code không nói | 🟡 |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-onboarding-profile-001 | Chọn band mục tiêu | Học viên chọn đúng một trong 9 mức band: 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, hiển thị một chữ số thập phân. Mức đang chọn được đánh dấu. Mặc định ban đầu là 7.0 khi chưa có hồ sơ. Không có mức dưới 5.0 hay trên 9.0 để chọn. | 🟡 | test/demo | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:9, 59-77] [S34: apps/web/src/features/app-state/initial-state.ts:7] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:181-204] | ✅ |
| FR-onboarding-profile-002 | Nhập ngày thi dự kiến (tùy chọn) khi onboarding | Học viên có thể chọn ngày thi bằng ô chọn ngày, nhãn "Ngày thi", ghi chú "Không bắt buộc". Ô chọn ngày chặn chọn ngày trước hôm nay (theo ngày địa phương của trình duyệt). Có nút "Bỏ qua ngày thi" xóa ngày đã chọn và lưu tiếp với ngày trống. | 🟡 | test/demo | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:51-52, 78-90, 99-110] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:206-220, 283-302] | ✅ |
| FR-onboarding-profile-003 | Lưu mục tiêu rồi sang bước kiểm tra mic | Khi bấm "Tiếp tục" hoặc "Bỏ qua ngày thi", hệ thống lưu band + ngày thi lên máy chủ. Trong lúc lưu: các nút band, ô ngày, nút bỏ qua, nút tiếp tục bị khóa và nút hiện "Đang lưu…". Lưu thành công thì cập nhật trạng thái ứng dụng và sang bước 2. Lưu thất bại thì ở lại bước 1 và hiện thông báo lỗi E-onboarding-profile-008. | 🟡 | test | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:31-49, 64, 86, 102, 112-124] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:394-404] | ✅ |
| FR-onboarding-profile-004 | Máy chủ chỉ nhận band hợp lệ | Hệ thống từ chối lưu mục tiêu nếu band không thuộc 9 mức nêu ở FR-001 (kể cả 4.5, 9.5, 6.3). | 🟡 | test | [S1: packages/api/src/routers/profile.ts:8-15] [S6: packages/api/src/routers/profile.test.ts:78-83] | ✅ |
| FR-onboarding-profile-005 | Máy chủ kiểm tra ngày thi | Ngày thi (nếu có) phải đúng định dạng YYYY-MM-DD, là ngày lịch có thật (ví dụ 2029-02-30 bị loại), và không sớm hơn ngày hôm nay theo UTC. Ngày thi được phép trống/vắng. | 🟡 | test | [S1: packages/api/src/routers/profile.ts:16-38] [S6: packages/api/src/routers/profile.test.ts:85-90] | ✅ |
| FR-onboarding-profile-006 | Lưu mục tiêu là ghi đè, mỗi người một hồ sơ | Lưu mục tiêu tạo hồ sơ nếu chưa có, hoặc cập nhật band + ngày thi nếu đã có; mỗi học viên chỉ có đúng một hồ sơ. Ngày thi không gửi được lưu thành rỗng. Cập nhật không thay đổi thời điểm onboard đã có. Kết quả trả về là hồ sơ sau khi lưu. | 🟡 | test | [S1: packages/api/src/routers/profile.ts:59-73, 75-88] [S2: packages/db/src/schema/profile.ts:7-9] [S6: packages/api/src/routers/profile.test.ts:99-116, 129-141] | ✅ |
| FR-onboarding-profile-007 | Kiểm tra micro 5 giây | Ở bước 2, học viên bấm "Ghi thử 5 giây". Hệ thống xin quyền micro, hiển thị sóng âm theo mức âm thời gian thực và đồng hồ "x.x s / 5.0s". Đồng hồ chỉ chạy khi micro đã ở trạng thái đang nghe. Đồng hồ cộng dồn 0.1 mỗi 100 ms (sai số dấu phẩy động khiến điều kiện "từ 5" thỏa ở nhịp thứ 51, tức khoảng 5.1 giây thực). Khi đồng hồ chạm 5, nếu mức âm đỉnh trong lúc ghi đạt từ 0.05 trở lên thì đạt ("Đã nhận tín hiệu micro thành công", nút "Micro ổn, tiếp tục"). Câu mẫu cho học viên đọc: "I usually spend my weekends reading books and meeting friends." Không có bản ghi nào được lưu hay gửi đi. | 🟡 | test/demo | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:23-54, 71, 118-130, 160-164] [S12: apps/web/src/hooks/use-mic-level.ts:64-80] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:283-322, 361-392] | ✅ |
| FR-onboarding-profile-008 | Xử lý micro bị chặn/không khả dụng | Nếu trình duyệt từ chối quyền, hoặc không có thiết bị/API micro, hoặc khởi tạo xử lý âm thanh lỗi, màn hình hiện trạng thái "Micro bị chặn" cùng hướng dẫn bật quyền và nút "Thử lại quyền micro"; nút thử lại đặt lại bộ đo và ghi lại từ đầu. Không có nút bỏ qua bước. | 🟡 | test | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:29-36, 56-62, 133-142, 165-168] [S12: apps/web/src/hooks/use-mic-level.ts:40-45, 81-98] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:253-281] | ✅ |
| FR-onboarding-profile-009 | Xử lý micro quá nhỏ | Nếu sau 5.0 giây mức âm đỉnh dưới 0.05, hệ thống không cho qua: hiện "Không nghe thấy tiếng" / "Không nghe thấy tiếng micro." cùng hướng dẫn kiểm tra mute và nói to hơn; trả về trạng thái chờ và nút "Thử lại âm thanh". | 🟡 | test | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:43-54, 143-152, 169-172] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:324-359] | ✅ |
| FR-onboarding-profile-010 | Hoàn tất onboarding sau khi mic đạt | Chỉ khi mic đạt, nút "Micro ổn, tiếp tục" xuất hiện. Bấm nút: khóa nút và hiện "Đang hoàn tất…", yêu cầu máy chủ ghi nhận hoàn tất; thành công thì chuyển tới Dashboard. | 🟡 | test | [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:17-24, 52] [S10: apps/web/src/features/onboarding/components/mic-check.tsx:161-164] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:283-322] | ✅ |
| FR-onboarding-profile-011 | Máy chủ ghi nhận hoàn tất onboarding | Hệ thống yêu cầu đã tồn tại hồ sơ mục tiêu mới cho hoàn tất. Lần đầu: ghi thời điểm hoàn tất và thời điểm cập nhật. Gọi lại: trả về hồ sơ hiện có, giữ nguyên thời điểm hoàn tất cũ (bất biến). | 🟡 | test | [S1: packages/api/src/routers/profile.ts:91-134] [S6: packages/api/src/routers/profile.test.ts:92-97, 118-127] | ✅ |
| FR-onboarding-profile-012 | Báo lỗi khi hoàn tất thất bại | Nếu việc ghi nhận hoàn tất thất bại, hệ thống ở lại bước 2, hiện banner E-onboarding-profile-009 phía trên khối kiểm tra mic và không chuyển trang; học viên có thể bấm lại. | 🟡 | test | [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:25-29, 47-51] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:406-444] | ✅ |
| FR-onboarding-profile-013 | Điều hướng giữa 2 bước | Thanh đầu trang hiển thị "Bước x/2" và 2 chấm tiến độ. Nút "Quay lại": ở bước 2 về bước 1 (ngày thi đã chọn được giữ); ở bước 1 chuyển về màn đăng nhập. | 🟡 | test | [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:12-13, 32-36] [S11: apps/web/src/features/onboarding/components/onboarding-frame.tsx:19-30, 34-38] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:222-251] | ✅ |
| FR-onboarding-profile-014 | Điều kiện vào trang onboarding | Trang onboarding yêu cầu phiên đăng nhập (không có thì chuyển tới đăng nhập, kèm đường dẫn quay lại). Nếu hồ sơ đã có thời điểm onboard thì chuyển thẳng tới Dashboard. Nếu không đọc được hồ sơ (lỗi) thì coi như chưa onboard và cho vào. | 🟡 | test | [S15: apps/web/src/routes/_proto/onboarding.tsx:9-24] [S21: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:31-81] | ✅ |
| FR-onboarding-profile-015 | Chặn khu vực ứng dụng khi chưa onboard | Khu vực /app, trang thi và trang chấm điểm yêu cầu phiên và hồ sơ đã onboard; chưa có hồ sơ hoặc chưa onboard thì chuyển tới trang onboarding. Học viên đã xác nhận onboard được ghi nhớ trong bộ nhớ phiên làm việc để khỏi hỏi máy chủ lại. Nếu hỏi hồ sơ gặp lỗi bất ngờ, cho vào (fail-open) và ghi cảnh báo console. | 🟡 | test | [S14: apps/web/src/lib/auth-guard.ts:41-70] [S30: apps/web/src/routes/_proto/app/route.tsx:7] [S27: apps/web/src/lib/__tests__/auth-guard.test.ts:116-238] [S27: apps/web/src/lib/__tests__/route-guards.test.ts:59-100] | ✅ |
| FR-onboarding-profile-016 | Đăng ký mới được dẫn tới onboarding | Sau đăng ký, đường dẫn quay lại mặc định là trang onboarding (trừ khi có đường dẫn quay lại an toàn được chỉ định). | 🟡 | kiểm tra | [S32: apps/web/src/features/auth/auth-screen.tsx:21, 74, 137] | ✅ |
| FR-onboarding-profile-017 | Đồng bộ mục tiêu khi đăng nhập | Khi có phiên người dùng, hệ thống đọc hồ sơ một lần cho mỗi người dùng và nạp band + ngày thi vào trạng thái ứng dụng; chưa có hồ sơ thì dùng mặc định band 7.0, ngày thi trống. Nếu đọc lỗi thì không đánh dấu đã nạp để thử lại sau. Khi đăng xuất thì đặt lại dữ liệu của người dùng nhưng giữ chế độ (mode) và giọng (voice). Khi phiên đang tải thì không đụng trạng thái. Tên và email từ phiên cũng được nạp vào trạng thái. | 🟡 | test | [S13: apps/web/src/features/app-state/use-profile-hydration.ts:29-77] [S21: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:85-192] | ✅ |
| FR-onboarding-profile-018 | Xem hồ sơ cá nhân | Màn "Hồ sơ cá nhân" hiển thị: ảnh đại diện (hoặc chữ cái đầu của tên), tên hiển thị, email tài khoản (hoặc "Chưa thiết lập"), band mục tiêu hiện tại dạng "Mục tiêu hiện tại: x.x Overall", ngày thi, trạng thái "Đang đăng nhập" và ID người dùng rút gọn 12 ký tự + "..." (hoặc "Khách" nếu không có phiên). Tên mặc định "Học viên Vox Flow" khi cả phiên và trạng thái đều trống. | 🟡 | test/demo | [S17: apps/web/src/features/profile/profile-screen.tsx:36-67, 160-166, 188-199, 251, 290, 434-444] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:82-88] | ✅ |
| FR-onboarding-profile-019 | Sửa tên hiển thị | Học viên sửa tên trong ô tối đa 50 ký tự rồi bấm "Lưu tên". Tên được cắt khoảng trắng hai đầu; tên rỗng bị chặn (nút khóa và báo lỗi E-onboarding-profile-014). Lưu thành công thì cập nhật trạng thái, toast thành công và nút hiện "Đã lưu" trong 2.5 giây; thất bại thì toast E-onboarding-profile-015 và không cập nhật trạng thái. Lúc lưu tên vẫn gửi kèm ảnh đại diện hiện tại (nếu có). | 🟡 | test | [S17: apps/web/src/features/profile/profile-screen.tsx:70-99, 217-240] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:90-107, 136-157] | ✅ |
| FR-onboarding-profile-020 | Sửa mục tiêu trên màn Hồ sơ | Học viên chọn lại band (9 mức), chọn/xóa ngày thi ("Xóa ngày") rồi bấm "Lưu mục tiêu". Ngày thi trước hôm nay (UTC) bị chặn ngay ở trình duyệt với E-onboarding-profile-013 và không gọi máy chủ. Thành công: cập nhật trạng thái, toast "Đã cập nhật mục tiêu luyện thi IELTS!", nút hiện "Đã lưu mục tiêu" 2.5 giây. Thất bại: banner E-onboarding-profile-012. Ô ngày không đặt thuộc tính chặn ngày quá khứ. | 🟡 | test | [S17: apps/web/src/features/profile/profile-screen.tsx:126-158, 283-366] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:109-134, 159-193] | ✅ |
| FR-onboarding-profile-021 | Đổi ảnh đại diện qua hộp thoại | Nút máy ảnh trên ảnh mở hộp thoại "Chọn ảnh đại diện" với 3 tab: "Mẫu có sẵn" (6 mẫu: Cú thông thái, Cáo sắc sảo, Mèo bình tĩnh, Gấu kiên trì, Gấu trúc lưu loát, Cá heo linh hoạt; nhãn dưới ảnh chỉ hiện từ đầu của tên nên hai mẫu Gấu trùng nhãn), "Tải ảnh lên", "Link URL". Có xem trước tròn; ảnh đang chọn mặc định là ảnh hiện tại hoặc mẫu đầu tiên. "Xác nhận đổi ảnh" áp dụng ngay và tự lưu (chỉ gửi ảnh, kèm tên nếu tên không rỗng); "Hủy" đóng không áp dụng. Thành công: toast "Đã cập nhật ảnh đại diện mới!". Ảnh hiển thị đổi ngay trước khi lưu xong và KHÔNG tự hoàn lại nếu lưu lỗi. | 🟡 | test | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:26-67, 104-153, 162-196, 255-262] [S20: apps/web/src/features/profile/data/preset-avatars.ts:9-46] [S17: apps/web/src/features/profile/profile-screen.tsx:102-123] [S24: apps/web/src/features/profile/__tests__/avatar-modal.test.tsx:46-68, 100-118] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:209-232] | ✅ |
| FR-onboarding-profile-022 | Tải ảnh lên và nén | Tab tải ảnh nhận PNG, JPG, WebP, GIF (thuộc tính accept) tối đa 5MB. Hệ thống cắt vuông phần giữa ảnh, thu về 180x180 px, xuất WebP (dự phòng JPEG) chất lượng 0.85; kết quả không vượt 32000 ký tự. Không bao giờ lưu ảnh gốc chưa nén. Trong lúc xử lý nút xác nhận bị khóa. Lỗi hiển thị theo E-onboarding-profile-020..029. | 🟡 | test | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:32-48, 199-231, 259] [S19: apps/web/src/features/profile/utils/image-compress.ts:9-14, 15-22, 51-95] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:7-24, 122-209] | ✅ |
| FR-onboarding-profile-023 | Dùng ảnh từ link | Tab "Link URL": học viên dán link rồi bấm "Xem thử" để áp dụng vào xem trước. Link rỗng hoặc không bắt đầu bằng https:// bị từ chối (E-onboarding-profile-018, 019). Link chỉ được áp dụng sau khi bấm "Xem thử"; bấm "Xác nhận đổi ảnh" mà chưa "Xem thử" thì link đang gõ không được dùng. | 🟡 | test | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:50-62, 234-252] [S24: apps/web/src/features/profile/__tests__/avatar-modal.test.tsx:70-98] | ✅ |
| FR-onboarding-profile-024 | Máy chủ chỉ chấp nhận ảnh đại diện hợp lệ | Khi tạo hoặc cập nhật người dùng, trường ảnh chỉ được chấp nhận nếu: vắng mặt (giữ nguyên), null (xóa ảnh), hoặc chuỗi không rỗng dài tối đa 32000 ký tự và là một trong: link https://, ảnh data URL base64 dạng webp/jpeg/png, hoặc đường dẫn nội bộ bắt đầu /avatars/. Mọi trường hợp khác (http, data SVG, javascript:, đường dẫn tuyệt đối khác, không phải chuỗi, chuỗi rỗng, quá dài) bị từ chối với lỗi E-onboarding-profile-017. | 🟡 | test | [S4: packages/auth/src/image-validation.ts:8-30] [S5: packages/auth/src/index.ts:49-70] [S7: packages/auth/src/image-validation.test.ts:5-48] | ✅ |
| FR-onboarding-profile-025 | Chỉ người đã đăng nhập mới dùng được hồ sơ | Đọc hồ sơ, lưu mục tiêu và hoàn tất onboarding đều yêu cầu phiên đăng nhập; thiếu phiên bị từ chối E-onboarding-profile-001. Hồ sơ gắn theo định danh người dùng từ phiên, không nhận định danh từ đầu vào. | 🟡 | test | [S29: packages/api/src/index.ts:15-22] [S1: packages/api/src/routers/profile.ts:43, 56, 92] [S6: packages/api/src/routers/profile.test.ts:61-70, 143-155] | ✅ |
| FR-onboarding-profile-026 | Đọc hồ sơ khi chưa có | Đọc hồ sơ của người chưa lưu mục tiêu trả về "không có" (không phải lỗi). | 🟡 | test | [S1: packages/api/src/routers/profile.ts:42-51] [S6: packages/api/src/routers/profile.test.ts:72-76] | ✅ |
| FR-onboarding-profile-027 | Hoàn tất onboarding khi hệ thống chưa có kết nối máy chủ | Nếu phía trình duyệt không có kênh gọi máy chủ cho thao tác lưu mục tiêu hoặc hoàn tất, bước vẫn được coi là thành công và trình duyệt tiếp tục (không báo lỗi, không lưu). Đây có vẻ là nhánh dự phòng cho môi trường không có máy chủ. | 🟡 | kiểm tra | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:36-43] [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:21-24] [S17: apps/web/src/features/profile/profile-screen.tsx:143-149] | 🔵 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-onboarding-profile-001 | security | Mỗi học viên chỉ đọc/ghi hồ sơ của chính mình; hồ sơ của hai người không lẫn nhau. | 🟡 | Test hai người dùng: B lưu 6.0 không làm đổi hồ sơ A (7.5) | [S6: packages/api/src/routers/profile.test.ts:143-155] | ✅ |
| NFR-onboarding-profile-002 | security | Ảnh đại diện không được mang mã chạy được: ảnh SVG dạng data URL và các scheme khác bị từ chối; chỉ các mẫu SVG tĩnh nội bộ dưới /avatars/ được chấp nhận. (Comment trong file test ghi lý do: SVG có thể chứa script; đây là ghi chú của dev, không phải yêu cầu đã duyệt.) | 🟡 | Test: SVG base64 và SVG utf8 có onload, http://, javascript:, /etc/passwd đều bị từ chối | [S7: packages/auth/src/image-validation.test.ts:36-48, 70-76] [S4: packages/auth/src/image-validation.ts:10, 26-28] | ✅ |
| NFR-onboarding-profile-003 | privacy | Âm thanh thử micro chỉ dùng để đo mức âm tại chỗ; luồng micro được giải phóng khi dừng ghi, khi rời màn, hoặc khi khởi tạo lỗi; không có upload. | 🟡 | Test: track dừng khi AudioContext lỗi và khi gỡ màn. Đọc code: mic-check.tsx và use-mic-level.ts không gọi mạng (không có test riêng cho điều này) | [S12: apps/web/src/hooks/use-mic-level.ts:32-38, 81-83, 91-93, 102-106] [S28: apps/web/src/hooks/__tests__/use-mic-level.test.ts:53-100] | ✅ |
| NFR-onboarding-profile-004 | reliability | Cổng chặn onboarding "fail-open": lỗi mạng/máy chủ khi hỏi hồ sơ không khóa học viên ra khỏi ứng dụng; chỉ ghi cảnh báo console. Cổng của trang onboarding cũng coi lỗi đọc hồ sơ là chưa onboard. | 🟡 | Test: hỏi hồ sơ lỗi vẫn cho qua, console.warn có thông điệp | [S14: apps/web/src/lib/auth-guard.ts:62-66] [S27: apps/web/src/lib/__tests__/auth-guard.test.ts:217-238] [S15: apps/web/src/routes/_proto/onboarding.tsx:13] | ✅ |
| NFR-onboarding-profile-005 | performance | Trạng thái "đã onboard" được nhớ trong bộ nhớ phiên làm việc để các lần chuyển trang trong khu vực ứng dụng không hỏi lại hồ sơ. | 🟡 | Test: lần thứ hai không gọi đọc hồ sơ | [S14: apps/web/src/lib/auth-guard.ts:6-10, 45-47, 57-59] [S27: apps/web/src/lib/__tests__/auth-guard.test.ts:188-215] | ✅ |
| NFR-onboarding-profile-006 | compatibility | Nén ảnh vẫn chạy khi trình duyệt thiếu hàm tạo promise có chốt (iOS Safari trước 17.4). | 🟡 | Test nén thành công khi thiếu hàm đó | [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:83-120] [S19: apps/web/src/features/profile/utils/image-compress.ts:24] | ✅ |
| NFR-onboarding-profile-007 | usability | Ô ngày thi trên màn Hồ sơ không tràn ngang trên màn hình hẹp (class chống tràn, cỡ chữ 16px trên mobile). | 🟡 | Test kiểm tra các class min-w-0, max-w-full, w-full, appearance-none, text-base, sm:text-sm | [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:234-244] [S17: apps/web/src/features/profile/profile-screen.tsx:325-331] | ✅ |
| NFR-onboarding-profile-008 | data-protection | Hồ sơ được xuất và xóa trong cơ chế xuất/xóa dữ liệu người dùng; xóa người dùng cũng xóa hồ sơ (xóa dây chuyền). | 🟡 | Đọc code | [S33: packages/api/src/data-registry.ts:57-65] [S2: packages/db/src/schema/profile.ts:7-9] [S3: packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql:8] | ✅ |
| NFR-onboarding-profile-009 | accessibility | Một số điều khiển có nhãn truy cập (ô ngày "Ngày thi", nút "Đổi ảnh đại diện", nút band có trạng thái bấm); không có kiểm tra a11y tự động trong test. | 🟡 | — | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:65, 84] [S17: apps/web/src/features/profile/profile-screen.tsx:204] | 🔵 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-onboarding-profile-001 | Tập band hợp lệ gồm đúng 9 giá trị 5.0 đến 9.0 bước 0.5; danh sách này được lặp ở ba nơi (máy chủ, bước onboarding, màn Hồ sơ) và phải đồng nhất. Giá trị mặc định khi chưa có hồ sơ là 7.0. | Chọn/lưu band | FR-001, 004, 020 | [S1: packages/api/src/routers/profile.ts:8] [S9: apps/web/src/features/onboarding/components/goal-step.tsx:9] [S17: apps/web/src/features/profile/profile-screen.tsx:29] [S34: apps/web/src/features/app-state/initial-state.ts:7] | ✅ |
| BR-onboarding-profile-002 | Ngày thi là tùy chọn; có thể xóa về rỗng. | Lưu mục tiêu | FR-002, 006, 020 | [S1: packages/api/src/routers/profile.ts:19-20, 64] [S6: packages/api/src/routers/profile.test.ts:134-140] | ✅ |
| BR-onboarding-profile-003 | Ngày thi không được ở quá khứ; so sánh theo ngày UTC ở máy chủ và ở màn Hồ sơ, theo ngày địa phương ở ô chọn ngày của onboarding. Ngày hôm nay được chấp nhận. | Lưu mục tiêu | FR-002, 005, 020 | [S1: packages/api/src/routers/profile.ts:30-35] [S17: apps/web/src/features/profile/profile-screen.tsx:132-138] [S9: apps/web/src/features/onboarding/components/goal-step.tsx:51-52] | ✅ |
| BR-onboarding-profile-004 | Lệch múi giờ có thể khiến ngày hôm nay theo giờ địa phương bị máy chủ coi là quá khứ (khi múi giờ địa phương chậm hơn UTC và đã sang ngày UTC mới). | Chọn "hôm nay" ở onboarding | FR-002, 005 | suy ra từ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:51-52] và [S1: packages/api/src/routers/profile.ts:30-35] | 🔵 |
| BR-onboarding-profile-005 | Mỗi học viên có tối đa một hồ sơ mục tiêu (khóa chính theo người dùng); lưu lần sau ghi đè. | Lưu mục tiêu | FR-006 | [S2: packages/db/src/schema/profile.ts:7-9] [S1: packages/api/src/routers/profile.ts:66-73] | ✅ |
| BR-onboarding-profile-006 | Thời điểm hoàn tất onboarding chỉ ghi một lần và bất biến; sửa mục tiêu về sau không xóa hay đổi nó. | Hoàn tất / sửa mục tiêu | FR-006, 011 | [S1: packages/api/src/routers/profile.ts:108-118] [S6: packages/api/src/routers/profile.test.ts:118-141] | ✅ |
| BR-onboarding-profile-007 | Hoàn tất onboarding đòi hỏi đã có hồ sơ mục tiêu; điều kiện "band rỗng" trong code không thể xảy ra vì cột band bắt buộc có giá trị. | Hoàn tất onboarding | FR-011 | [S1: packages/api/src/routers/profile.ts:101-106] [S2: packages/db/src/schema/profile.ts:10] [S3: packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql:3] | 🔵 |
| BR-onboarding-profile-008 | Không cho hoàn tất onboarding nếu chưa vượt kiểm tra micro; bước kiểm tra không có lối bỏ qua. Lý do nghiệp vụ code không nói. | Bước 2 | FR-007..010 | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:161-186] | ✅ |
| BR-onboarding-profile-009 | Quy tắc đạt kiểm tra mic: thời lượng ghi 5.0 giây tính từ lúc micro bắt đầu nghe (đếm bước 0.1 giây mỗi 100 ms), và mức âm đỉnh đạt ít nhất 0.05 (thang 0 đến 1, mức = căn bậc hai trung bình bình phương tín hiệu nhân 4, tối đa 1). Ý nghĩa của con số 0.05 và 5 giây: code không nói. | Ghi thử | FR-007, 009 | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:39, 44-45] [S12: apps/web/src/hooks/use-mic-level.ts:76-77] | ✅ |
| BR-onboarding-profile-010 | Lời khuyên "độ ồn trên 50 dB" là văn bản tĩnh; hệ thống không đo dB. | Hiển thị bước 2 | FR-007 | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:154-157] | ✅ |
| BR-onboarding-profile-011 | Khu vực /app, trang thi, trang chấm điểm chỉ mở khi hồ sơ có thời điểm onboard; chưa thì chuyển onboarding. Nếu hỏi hồ sơ lỗi thì cho qua. | Truy cập trang | FR-015 | [S14: apps/web/src/lib/auth-guard.ts:50-66] [S30: apps/web/src/routes/_proto/scoring.tsx:7] [S30: apps/web/src/routes/_proto/exam.tsx:7] | ✅ |
| BR-onboarding-profile-012 | Học viên đã onboard mà vào lại trang onboarding thì được chuyển tới Dashboard. | Vào /onboarding | FR-014 | [S15: apps/web/src/routes/_proto/onboarding.tsx:14-17] | ✅ |
| BR-onboarding-profile-013 | Tên hiển thị: cắt khoảng trắng, không rỗng, tối đa 50 ký tự ở giao diện. Máy chủ của feature không có luật độ dài tên. | Lưu tên | FR-019 | [S17: apps/web/src/features/profile/profile-screen.tsx:72-76, 222, 229] | ✅ |
| BR-onboarding-profile-014 | Khi lưu ảnh từ hộp thoại, không bao giờ gửi tên rỗng để tránh ghi đè tên; khi lưu tên thì gửi kèm ảnh nếu có. | Lưu ảnh/tên | FR-019, 021 | [S17: apps/web/src/features/profile/profile-screen.tsx:104-114, 83-86] | ✅ |
| BR-onboarding-profile-015 | Ảnh upload: tối đa 5MB đầu vào, cắt vuông giữa, 180x180 px, WebP chất lượng 0.85 (dự phòng JPEG), đầu ra tối đa 32000 ký tự; trình duyệt không nén được thì từ chối chứ không lưu ảnh gốc. | Tải ảnh | FR-022 | [S19: apps/web/src/features/profile/utils/image-compress.ts:9-14, 20, 40-43, 68-95] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:188-207] | ✅ |
| BR-onboarding-profile-016 | Có 6 ảnh đại diện mẫu cố định, mỗi ảnh là file tĩnh /avatars/<id>.svg; cả 6 phải được máy chủ chấp nhận (hợp đồng được kiểm bằng test). | Chọn mẫu | FR-021, 024 | [S20: apps/web/src/features/profile/data/preset-avatars.ts:9-46] [S26: apps/web/src/features/profile/__tests__/preset-avatars.test.ts:6-17] [S7: packages/auth/src/image-validation.test.ts:54-68] | ✅ |
| BR-onboarding-profile-017 | Ảnh đại diện từ link ngoài chỉ chấp nhận https; máy chủ không kiểm tra tên miền hay nội dung ảnh đích, chỉ kiểm tiền tố và độ dài. | Dùng link | FR-023, 024 | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:56-59] [S4: packages/auth/src/image-validation.ts:26] | ✅ |
| BR-onboarding-profile-018 | Khi phiên chuyển từ không có người dùng sang có, hoặc đổi người dùng, hồ sơ được nạp lại một lần; cùng người dùng render lại không nạp lại. | Thay đổi phiên | FR-017 | [S13: apps/web/src/features/app-state/use-profile-hydration.ts:51, 69] [S21: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:85-131] | ✅ |
| BR-onboarding-profile-019 | Phiên đang tải: không đụng trạng thái ứng dụng. | Phiên pending | FR-017 | [S13: apps/web/src/features/app-state/use-profile-hydration.ts:30-31] [S21: apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:186-192] | ✅ |
| BR-onboarding-profile-020 | Lưu ảnh đại diện từ màn Hồ sơ chỉ ghi nhận ở phía đồng bộ hiển thị khi phiên có ảnh; phiên không có ảnh không xóa ảnh đang hiển thị (không có đường xóa ảnh trên giao diện). | Phiên tải xong | FR-018, 021 | [S17: apps/web/src/features/profile/profile-screen.tsx:48-55, 83-86] | 🔵 |
| BR-onboarding-profile-021 | Nút "Xác nhận đổi ảnh" luôn gọi lưu với ảnh đang chọn, kể cả khi chưa đổi gì (mặc định là ảnh hiện tại hoặc mẫu đầu tiên). | Xác nhận trong hộp thoại | FR-021 | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:27, 64-67] | ✅ |

## 6. Error Matrix

> Cột Severity là phân loại của người soạn (code không mang mức nghiêm trọng), chỉ để tham khảo. Wording nguyên văn từ code. Mã tRPC ghi kèm; thông điệp máy chủ KHÔNG được hiển thị nguyên văn cho học viên ở các luồng này (giao diện bắt lỗi chung và hiện câu cố định) — xem cột Screen state.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-onboarding-profile-001 | Chưa đăng nhập | Gọi đọc/lưu/hoàn tất khi không có phiên. Mã `UNAUTHORIZED`, thông điệp "Authentication required" | major | FR-025 | Không có câu riêng; luồng onboarding/hồ sơ rơi vào E-008, E-009, E-012 | Đăng nhập lại | [S29: packages/api/src/index.ts:15-22] [S6: packages/api/src/routers/profile.test.ts:61-70] | ✅ |
| E-onboarding-profile-002 | Band sai | Band ngoài 9 mức. Thông điệp "Target band must be between 5.0 and 9.0 in 0.5 increments". Mã tRPC không được gán trong code (thư viện kiểm tra đầu vào tự gán; suy đoán `BAD_REQUEST`, xem Inferred assumptions trong reverse-gaps.md) | minor | FR-004 | Giao diện không cho chọn band sai; nếu xảy ra sẽ hiện E-008 hoặc E-012 | Chọn lại band | [S1: packages/api/src/routers/profile.ts:11-15] [S6: packages/api/src/routers/profile.test.ts:78-83] | ✅ |
| E-onboarding-profile-003 | Định dạng ngày sai | Ngày không khớp YYYY-MM-DD. Thông điệp "Invalid date format (YYYY-MM-DD)" | minor | FR-005 | Ô ngày kiểu date nên ít khi xảy ra; nếu xảy ra hiện E-008 hoặc E-012 | Nhập lại | [S1: packages/api/src/routers/profile.ts:18] | ✅ |
| E-onboarding-profile-004 | Ngày thi không hợp lệ hoặc quá khứ | Ngày không tồn tại trên lịch hoặc sớm hơn hôm nay (UTC). Thông điệp "Exam date must be a valid calendar date and cannot be in the past" | minor | FR-005 | Ở onboarding hiện E-008 (câu chung về kết nối, xem OQ-6); ở Hồ sơ thường bị chặn trước bởi E-013 | Chọn ngày hôm nay hoặc tương lai | [S1: packages/api/src/routers/profile.ts:21-38] [S6: packages/api/src/routers/profile.test.ts:85-90] | ✅ |
| E-onboarding-profile-005 | Không lưu được hồ sơ | Sau khi ghi, đọc lại không thấy hồ sơ. Mã `INTERNAL_SERVER_ERROR`, "Failed to persist profile" | critical | FR-006 | E-008 hoặc E-012 | Thử lại | [S1: packages/api/src/routers/profile.ts:81-86] | ✅ |
| E-onboarding-profile-006 | Hoàn tất khi chưa có hồ sơ | Chưa có hồ sơ khi hoàn tất. Mã `PRECONDITION_FAILED`, "Target band must be set before completing onboarding" | major | FR-011 | E-009 | Quay lại bước 1 lưu mục tiêu | [S1: packages/api/src/routers/profile.ts:101-106] [S6: packages/api/src/routers/profile.test.ts:92-97] | ✅ |
| E-onboarding-profile-007 | Không hoàn tất được onboarding (máy chủ) | Sau cập nhật, đọc lại không thấy hồ sơ. Mã `INTERNAL_SERVER_ERROR`, "Failed to complete onboarding" | critical | FR-011 | E-009 | Bấm lại nút | [S1: packages/api/src/routers/profile.ts:126-131] | ✅ |
| E-onboarding-profile-008 | Lỗi lưu mục tiêu (onboarding) | Mọi lỗi khi lưu ở bước 1 | major | FR-003 | Banner đỏ: "Không thể lưu mục tiêu. Vui lòng kiểm tra kết nối và thử lại." Ở lại bước 1 | Bấm lại | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:44-46, 92-97] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:394-404] | ✅ |
| E-onboarding-profile-009 | Lỗi hoàn tất onboarding | Mọi lỗi khi hoàn tất | major | FR-012 | Banner: "Không thể hoàn tất onboarding. Vui lòng thử lại." Ở lại bước 2, không chuyển trang | Bấm lại | [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:25-27, 47-51] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:406-444] | ✅ |
| E-onboarding-profile-010 | Micro bị chặn / không khả dụng | Từ chối quyền, thiếu API/thiết bị micro, hoặc khởi tạo âm thanh lỗi | major | FR-008 | Tiêu đề "Micro bị chặn"; phụ đề "Chưa cấp quyền truy cập micro"; khung "Trình duyệt đang chặn micro." / "Vui lòng bấm vào biểu tượng ổ khóa trên thanh địa chỉ, bật quyền Micro, sau đó bấm nút “Thử lại quyền micro”."; nút "Thử lại quyền micro" | Bật quyền rồi bấm thử lại | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:97-98, 108-109, 137-139, 165-168] [S12: apps/web/src/hooks/use-mic-level.ts:41-45, 84-87, 94-97] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:253-281] | ✅ |
| E-onboarding-profile-011 | Micro quá nhỏ | Mức âm đỉnh dưới 0.05 sau 5.0 giây | minor | FR-009 | Tiêu đề "Không nghe thấy tiếng"; phụ đề "Tín hiệu âm thanh quá nhỏ"; khung "Không nghe thấy tiếng micro." / "Vui lòng kiểm tra micro không bị tắt tiếng (mute), nói to hơn gần micro và bấm nút “Thử lại âm thanh”."; nút "Thử lại âm thanh" | Nói to hơn rồi thử lại | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:99-100, 110-111, 147-149, 169-172] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:324-359] | ✅ |
| E-onboarding-profile-012 | Lỗi lưu mục tiêu (Hồ sơ) | Mọi lỗi khi lưu mục tiêu trên màn Hồ sơ | major | FR-020 | Banner: "Không thể lưu mục tiêu. Vui lòng kiểm tra lại kết nối." | Bấm lại | [S17: apps/web/src/features/profile/profile-screen.tsx:153-155, 277-281] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:159-175] | ✅ |
| E-onboarding-profile-013 | Ngày thi trong quá khứ (Hồ sơ) | Ngày thi sớm hơn hôm nay UTC | minor | FR-020 | Banner: "Ngày thi dự kiến không thể ở trong quá khứ." Không gọi máy chủ | Đổi ngày | [S17: apps/web/src/features/profile/profile-screen.tsx:135-138] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:177-193] | ✅ |
| E-onboarding-profile-014 | Tên trống | Bấm lưu tên khi tên rỗng sau khi cắt khoảng trắng | minor | FR-019 | Toast: "Tên hiển thị không được để trống" (nút "Lưu tên" thường đã bị khóa trước đó) | Nhập tên | [S17: apps/web/src/features/profile/profile-screen.tsx:73-76, 229] | ✅ |
| E-onboarding-profile-015 | Lỗi cập nhật thông tin cá nhân | Dịch vụ xác thực trả lỗi hoặc không khả dụng | major | FR-019 | Toast: "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại." Không cập nhật trạng thái | Thử lại | [S17: apps/web/src/features/profile/profile-screen.tsx:80-95] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:136-157] | ✅ |
| E-onboarding-profile-016 | Lỗi lưu ảnh đại diện | Dịch vụ xác thực trả lỗi hoặc không khả dụng | major | FR-021 | Toast: "Không thể lưu ảnh đại diện. Vui lòng thử lại." (ảnh trên màn đã đổi, không hoàn lại) | Thử lại | [S17: apps/web/src/features/profile/profile-screen.tsx:107-122] | ✅ |
| E-onboarding-profile-017 | Ảnh đại diện bị máy chủ từ chối | Ảnh vi phạm luật FR-024. Mã `BAD_REQUEST`, thông điệp "INVALID_IMAGE" | major | FR-024 | Hiện E-015 (lưu tên) hoặc E-016 (lưu ảnh); mã không hiển thị | Chọn ảnh khác | [S5: packages/auth/src/index.ts:52-56, 64-68] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:136-157] | ✅ |
| E-onboarding-profile-018 | Link ảnh trống | "Xem thử" khi ô link rỗng | minor | FR-023 | "Vui lòng nhập đường dẫn URL ảnh hợp lệ." | Nhập link | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:51-55] | ✅ |
| E-onboarding-profile-019 | Link ảnh không https | Link không bắt đầu bằng https:// | minor | FR-023 | "URL phải bắt đầu bằng https:// (hoặc dùng tab Tải ảnh lên)." | Dùng https hoặc tải ảnh lên | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:56-59] | ✅ |
| E-onboarding-profile-020 | Tệp không phải ảnh | Loại tệp không bắt đầu bằng image/ | minor | FR-022 | "Tệp được chọn không phải là hình ảnh hợp lệ (PNG, JPG, WebP...)." | Chọn tệp khác | [S19: apps/web/src/features/profile/utils/image-compress.ts:15-17] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:7-13] | ✅ |
| E-onboarding-profile-021 | Ảnh quá 5MB | Kích thước tệp lớn hơn 5MB | minor | FR-022 | "Kích thước tệp vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn." | Chọn ảnh nhỏ hơn | [S19: apps/web/src/features/profile/utils/image-compress.ts:20-22] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:15-24] | ✅ |
| E-onboarding-profile-022 | Không đọc được tệp | Lỗi đọc tệp | minor | FR-022 | "Không thể đọc tệp ảnh đã chọn." | Chọn lại | [S19: apps/web/src/features/profile/utils/image-compress.ts:27-29] | ✅ |
| E-onboarding-profile-023 | Dữ liệu ảnh không hợp lệ | Kết quả đọc không phải chuỗi | minor | FR-022 | "Dữ liệu hình ảnh không hợp lệ." | Chọn lại | [S19: apps/web/src/features/profile/utils/image-compress.ts:33-36] | ✅ |
| E-onboarding-profile-024 | Trình duyệt không hỗ trợ xử lý ảnh | Không có Image/window hoặc canvas không có ngữ cảnh 2D | minor | FR-022 | "Trình duyệt không hỗ trợ xử lý ảnh. Vui lòng dùng trình duyệt khác." | Đổi trình duyệt | [S19: apps/web/src/features/profile/utils/image-compress.ts:40-43, 63-66] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:188-207] | ✅ |
| E-onboarding-profile-025 | Không giải mã được ảnh | Ảnh lỗi khi tải | minor | FR-022 | "Không thể tải và phân giải hình ảnh này." | Chọn ảnh khác | [S19: apps/web/src/features/profile/utils/image-compress.ts:47-49] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:160-186] | ✅ |
| E-onboarding-profile-026 | Ảnh rỗng/kích thước 0 | Chiều rộng hoặc cao bằng 0 | minor | FR-022 | "Hình ảnh không hợp lệ hoặc rỗng." | Chọn ảnh khác | [S19: apps/web/src/features/profile/utils/image-compress.ts:55-58] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:209-237] | ✅ |
| E-onboarding-profile-027 | Trình duyệt không nén được | Canvas không xuất WebP/JPEG | minor | FR-022 | "Trình duyệt không hỗ trợ nén ảnh." | Đổi trình duyệt | [S19: apps/web/src/features/profile/utils/image-compress.ts:82-85] | ✅ |
| E-onboarding-profile-028 | Ảnh sau nén vẫn quá lớn | Chuỗi kết quả dài hơn 32000 ký tự | minor | FR-022 | "Ảnh sau khi nén vẫn vượt quá giới hạn dung lượng cho phép. Vui lòng chọn ảnh nhỏ hơn." | Chọn ảnh nhỏ/đơn giản hơn | [S19: apps/web/src/features/profile/utils/image-compress.ts:86-93] [S25: apps/web/src/features/profile/__tests__/image-compress.test.ts:122-158] | ✅ |
| E-onboarding-profile-029 | Lỗi nén không xác định | Ngoại lệ khi vẽ/nén | minor | FR-022 | "Không thể nén hình ảnh này. Vui lòng chọn ảnh khác." | Chọn ảnh khác | [S19: apps/web/src/features/profile/utils/image-compress.ts:96-98] | ✅ |
| E-onboarding-profile-030 | Lỗi không có thông điệp khi xử lý ảnh | Ngoại lệ không phải Error | minor | FR-022 | "Không thể xử lý ảnh này." | Chọn ảnh khác | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:41-43] | ✅ |
| E-onboarding-profile-031 | Cổng chặn không đọc được hồ sơ | Lỗi bất ngờ khi hỏi hồ sơ trong cổng chặn. Console: "requireOnboarded: failed to fetch profile, failing open" | minor | FR-015 | Không hiển thị cho học viên; cho qua | Không cần | [S14: apps/web/src/lib/auth-guard.ts:62-66] [S27: apps/web/src/lib/__tests__/auth-guard.test.ts:217-238] | ✅ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-onboarding-profile-01 | Học viên mới đi hết onboarding và vào Dashboard | Hồ sơ có thời điểm onboard; điều hướng tới Dashboard | Code chỉ cho biết điều kiện hoàn tất, KHÔNG có mục tiêu tỷ lệ | [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:17-24] [S1: packages/api/src/routers/profile.ts:111-118] | 🟡 |
| SC-onboarding-profile-02 | Học viên bỏ đi trước lần ghi âm đầu là rủi ro chính của feature | Không có chỉ số trong code | Không rõ (roadmap nêu rủi ro này) | [S35: docs/roadmap-chamro.md:54] | 🟡 |
| SC-onboarding-profile-03 | Mọi học viên vào ứng dụng đều có mục tiêu band hợp lệ | Cổng chặn buộc có thời điểm onboard; hồ sơ luôn có band | Code không nêu mốc đạt. Lưu ý cổng chặn fail-open khi hỏi hồ sơ lỗi (FR-015) nên không đảm bảo tuyệt đối — OQ-19 | [S14: apps/web/src/lib/auth-guard.ts:50-66] [S2: packages/db/src/schema/profile.ts:10] | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/onboarding-profile-reverse-erd.md`)

- **Hồ sơ mục tiêu (user_profile):** một dòng cho mỗi học viên; có band mục tiêu (bắt buộc), ngày thi (tùy chọn, dạng chữ YYYY-MM-DD), thời điểm onboard (rỗng nếu chưa hoàn tất), thời điểm tạo, thời điểm cập nhật. Xóa người dùng thì xóa hồ sơ. ✅ [S2: packages/db/src/schema/profile.ts:6-17] [S3: packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql:1-9]
- **Người dùng (user) — chỉ phần liên quan:** tên hiển thị và ảnh đại diện (chuỗi: https, data URL, hoặc đường dẫn /avatars/). Bảng do feature xác thực sở hữu. ✅ [S5: packages/auth/src/index.ts:46-73] [S6: packages/api/src/routers/profile.test.ts:11-19]
- **Trạng thái ứng dụng phía trình duyệt:** target, examDate, name, email (không bền vững). ✅ [S34: apps/web/src/features/app-state/initial-state.ts:5-8]

## 9. Flows (tóm tắt — chi tiết ở `srs/onboarding-profile-reverse-flows.md`)

1. Thiết lập mục tiêu khi onboarding (bước 1).
2. Kiểm tra mic và hoàn tất onboarding (bước 2).
3. Cổng truy cập: trang onboarding và khu vực ứng dụng.
4. Đồng bộ hồ sơ khi đăng nhập/đăng xuất.
5. Sửa mục tiêu trên màn Hồ sơ.
6. Sửa tên hiển thị.
7. Đổi ảnh đại diện.

## 10. Screens (tóm tắt)

| Screen | Route | Mô tả | Nguồn | Nhãn |
|--------|-------|-------|-------|------|
| Onboarding — bước 1 "Mục tiêu của bạn là gì?" | /onboarding | Lưới 9 band, ô ngày thi tùy chọn, nút "Bỏ qua ngày thi" và "Tiếp tục" | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:54-126] [S15: apps/web/src/routes/_proto/onboarding.tsx:26] | ✅ |
| Onboarding — bước 2 "Kiểm tra micro & môi trường" | /onboarding | Sóng âm, đồng hồ 5.0s, câu mẫu, thông báo chặn/quá nhỏ/lời khuyên ồn, nút ghi thử/thử lại/tiếp tục | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:66-188] | ✅ |
| Hồ sơ cá nhân | /app/profile | Thẻ thông tin cá nhân, thẻ mục tiêu IELTS (cùng thẻ gói và thẻ phiên thuộc feature khác) | [S16: apps/web/src/routes/_proto/app/profile.tsx:5-7] [S17: apps/web/src/features/profile/profile-screen.tsx:160-458] | ✅ |
| Hộp thoại "Chọn ảnh đại diện" | (modal trong /app/profile) | 3 tab: Mẫu có sẵn, Tải ảnh lên, Link URL | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:69-265] | ✅ |

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Ảnh đại diện tối đa 32000 ký tự, chỉ https / data URL webp-jpeg-png / đường dẫn /avatars/ | Máy chủ xác thực | [S4: packages/auth/src/image-validation.ts:8-28] | ✅ |
| Band chỉ 9 mức 5.0 đến 9.0 | Máy chủ + giao diện | [S1: packages/api/src/routers/profile.ts:8] | ✅ |
| Một hồ sơ cho mỗi người dùng | Cơ sở dữ liệu | [S2: packages/db/src/schema/profile.ts:7-9] | ✅ |
| Ngày thi lưu dạng chữ YYYY-MM-DD, không có múi giờ | Cơ sở dữ liệu + máy chủ | [S2: packages/db/src/schema/profile.ts:11] [S1: packages/api/src/routers/profile.ts:18] | ✅ |
| Cần trình duyệt hỗ trợ getUserMedia và AudioContext, và học viên cấp quyền micro, để qua bước 2 | Trình duyệt | [S12: apps/web/src/hooks/use-mic-level.ts:40-66] | ✅ |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Dịch vụ xác thực/phiên (lấy phiên, cập nhật tên/ảnh) | Feature xác thực | Không vào được onboarding; không đổi được tên/ảnh | [S14: apps/web/src/lib/auth-guard.ts:24-33] [S17: apps/web/src/features/profile/profile-screen.tsx:83-86] | ✅ |
| Cơ sở dữ liệu người dùng (bảng user) | Feature xác thực | Hồ sơ không tạo được (khóa ngoài) | [S2: packages/db/src/schema/profile.ts:7-9] | ✅ |
| File ảnh mẫu /avatars/*.svg trong thư mục public | Giao diện web | Mẫu ảnh không hiển thị | [S20: apps/web/src/features/profile/data/preset-avatars.ts:5-6] | ✅ |
| Cơ chế xuất/xóa dữ liệu người dùng | Feature quyền riêng tư | Hồ sơ không được xuất/xóa theo yêu cầu | [S33: packages/api/src/data-registry.ts:57-65] | ✅ |
| Dashboard/Billing đọc ngày thi và band mục tiêu | Feature khác | Giá trị mục tiêu không có nơi dùng | grep nơi dùng: apps/web/src/features/dashboard/dashboard-screen.tsx:59-60, apps/web/src/features/billing/plan-utils.ts:5 | 🔵 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Học viên luôn có phiên hợp lệ khi vào onboarding (phiên do feature xác thực cấp) | Cổng chặn chuyển về đăng nhập | [S15: apps/web/src/routes/_proto/onboarding.tsx:9] | ✅ |
| Việc bắt buộc qua kiểm tra mic là chủ ý sản phẩm | BR-008, FR-010: nếu không chủ ý thì cần đường bỏ qua | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:161-186] | 🟡 |
| Ngưỡng 0.05 và 5 giây phù hợp thiết bị phổ biến | FR-007, FR-009: có thể chặn nhầm học viên micro nhỏ | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:44-45] | 🟡 |
| Máy học viên có múi giờ không chậm hơn UTC khi chọn "hôm nay" | BR-004: lưu ngày hôm nay có thể bị từ chối | [S1: packages/api/src/routers/profile.ts:30-35] | 🔵 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây chỉ trích các OQ blocking.

- [ ] OQ-1: Priority P0/P1/P2 của từng FR/NFR (roadmap chỉ ghi nhóm "Must" ở mức feature) — cần PO.
- [ ] OQ-2: Ngày thi được dùng để làm gì (PRD nói nhịp luyện hằng ngày + nhắc báo band; văn bản giao diện nói "gợi ý việc cần luyện mỗi ngày"/"gợi ý bài tập trọng tâm"; grep chỉ thấy đếm ngược/thời hạn gói) — cần PO.
- [ ] OQ-3: Bắt buộc qua kiểm tra mic (không có đường bỏ qua) và ngưỡng 5 giây / 0.05 có chủ ý không — cần PO.
- [ ] OQ-5: Lệch múi giờ giữa ô chọn ngày (giờ địa phương) và máy chủ (UTC) — cần dev/PO.
- [ ] OQ-6: Lỗi máy chủ (ví dụ ngày không hợp lệ) hiện chung là "kiểm tra kết nối" — có chấp nhận không.
- [ ] OQ-19: Cổng chặn fail-open (lỗi hỏi hồ sơ, hoặc không có kênh máy chủ) cho học viên vào ứng dụng khi chưa chắc có hồ sơ/band; chấp nhận không — cần dev/PO. (không blocking)
