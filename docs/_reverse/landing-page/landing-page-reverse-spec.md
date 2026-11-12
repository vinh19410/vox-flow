---
type: reverse-srs
feature: landing-page
status: draft
updated: 2026-11-11
confidence_summary: "✅49 🔵2 🟡21"
links:
  - docs/_reverse/landing-page/reverse-sources.md
  - docs/_reverse/landing-page/reverse-gaps.md
  - docs/_reverse/landing-page/_evidence.md
  - docs/_reverse/landing-page/srs/landing-page-reverse-flows.md
  - docs/_reverse/landing-page/srs/landing-page-reverse-states.md
  - docs/_reverse/landing-page/srs/landing-page-reverse-erd.md
  - docs/_reverse/landing-page/usecases/landing-page-reverse-usecase-index.md
---

# landing-page — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập, **CHƯA duyệt**). Nhãn: ✅ chắc chắn (code/test khẳng định) · 🔵 suy đoán (>=2 chỗ code hậu thuẫn) · 🟡 cần xác nhận.

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái duyệt:** CHƯA duyệt. Mọi nội dung là tái lập từ source code, chưa có BA/PO xác nhận.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md).
- **Cách đếm nhãn:** đếm một nhãn cho mỗi dòng bảng ở Mục 2-7, 10, 11 (nhãn là ô cuối của dòng); không đếm Mục 0, 1, 8, 9, 12 và các file srs/usecases. Kết quả: ✅49 · 🔵2 · 🟡21 (tổng 72 dòng). Quy ước thống nhất: cột "Mục tiêu" của actor, cột "Owner" của dependency và các assumption là suy luận nên 🟡; bảng Constraints giữ nhãn của chính ràng buộc và cột đổi tên thành "Cơ chế áp đặt".
- **Audit độc lập:** đã chạy 2026-11-11, hạ 7 claim, sửa 6 cite.
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Quy ước nhãn cho nội dung hiển thị:** một lời hứa/số liệu hiển thị trên trang là fact UI (✅ "UI hiển thị đúng chuỗi này"). Việc lời hứa đó **đúng hay sai so với hành vi hệ thống thật** được đối chiếu riêng ở các BR có chữ "Đối chiếu"; chỗ lệch ghi ở mục Conflict của `reverse-gaps.md`.
- **Lược bỏ có chủ đích:** `states` và `erd` ở dạng rút gọn (feature gần như tĩnh, không có entity/trạng thái nghiệp vụ riêng) — lý do ghi trong từng file.

### 0.3 Khác biệt với tài liệu chính

Không đối chiếu với PRD/roadmap trong phiên này (không có tài liệu chính được cung cấp cho feature này). Bỏ qua. Các lệch giữa nội dung trang và hành vi hệ thống nằm ở `reverse-gaps.md` mục 3 (Conflicts).

## 1. Scope

Trang chủ giới thiệu sản phẩm cho khách chưa đăng nhập, hiển thị tại đường dẫn gốc của ứng dụng, gồm: thanh đầu trang (logo, hai liên kết cuộn tới mục "Cách chấm" và "Bảng giá", hai nút dẫn vào đăng nhập), khối hero (tiêu đề, mô tả, nút kêu gọi, ba số liệu, thẻ xem trước kết quả mẫu), khối bốn lời hứa và bốn bước sử dụng, khối bảng giá (một thẻ miễn phí và ba thẻ trả phí), chân trang (bản quyền, liên kết điều khoản, câu miễn trừ). Kèm theo là trang "Điều khoản dịch vụ & Chính sách sử dụng". ✅ [S1, S2, S3, S4, S6, S8]

Trang được hiển thị trong khung giao diện ép chế độ sáng, và gắn tiêu đề/mô tả tab trình duyệt ở cấp gốc ứng dụng. ✅ [S7, S9]

Mọi nút "Đăng nhập", "Thi thử miễn phí", "Thi thử ngay — miễn phí" đều dẫn tới cùng một đích (màn đăng nhập/đăng ký), không có đích riêng cho đăng ký. ✅ [S1, S2, S11]

**Boundary (out of scope — thuộc feature khác, chỉ nêu điểm giao):**
- Màn đăng nhập/đăng ký và xác thực (đích của các nút) — feature auth. ✅ [S19]
- Thanh toán, kích hoạt gói, cổng QR — feature billing; landing chỉ hiển thị bảng giá, không có nút mua. ✅ [S4, S16]
- Chấm điểm, màn kết quả, báo lỗi chấm — feature scoring/results; landing chỉ hứa hẹn về chúng. ✅ [S3, S14]
- Nội dung pháp lý của điều khoản: trích nguyên văn ở FR, **không diễn giải pháp lý**.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Khách truy cập (chưa đăng nhập) | người | Mục tiêu của khách là suy luận từ các thành phần trên trang (xem giới thiệu, bấm vào đăng nhập hoặc thi thử, xem bảng giá, đọc điều khoản); code không nói vì sao khách tới trang. Sự hiện diện của actor và các hành động khả dụng thì code xác nhận | Có | apps/web/src/features/landing/landing-screen.tsx:20-21 | 🟡 |
| Người dùng đã đăng nhập mở lại trang gốc | người | (Hành vi quan sát được, không phải mục tiêu) Code không xử lý riêng: trang vẫn hiển thị như khách, không tự chuyển hướng | Có (hành vi hiện tại) | apps/web/src/routes/_proto/index.tsx:5-7 | ✅ |
| Học viên IELTS Speaking (đối tượng mục tiêu của nội dung) | người | Câu chữ trang nhắm tới người luyện thi IELTS Speaking; ai là "đối tượng mục tiêu" ở mức nghiệp vụ code không nói (OQ-13, Gap persona) | Có | apps/web/src/features/landing/components/hero.tsx:19-21 | 🟡 |
| Hệ thống phiên đăng nhập (Better Auth, phía client) | hệ thống | (Hành vi quan sát được, không phải mục tiêu) Cung cấp phiên để nạp hồ sơ vào trạng thái ứng dụng khi vào bất kỳ trang trong khung proto, kể cả trang chủ | Có | apps/web/src/routes/_proto/route.tsx:31-35 | ✅ |
| Chủ sản phẩm / pháp chế (người sở hữu nội dung giá và điều khoản) | người | Code không nói ai sở hữu và duyệt nội dung giá, hạn mức, điều khoản (OQ-11) | Không rõ | — | 🟡 |

## 3. Functional Requirements (FR)

> Priority luôn 🟡 (code không nói P0/P1/P2) nên cột Priority ghi `TBD` (OQ-14); nhãn cuối dòng thể hiện độ chắc của hành vi, không phải của priority.

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-landing-page-001 | Hiển thị trang chủ tại đường dẫn gốc | Khi mở đường dẫn gốc `/`, hệ thống hiển thị trang chủ giới thiệu. Đường dẫn này không có bước kiểm tra phiên đăng nhập hay hồ sơ trước khi hiển thị. | TBD | demo | apps/web/src/routes/_proto/index.tsx:5-7 | ✅ |
| FR-landing-page-002 | Không chuyển hướng người đã đăng nhập | Hệ thống không tự chuyển người đã đăng nhập khỏi trang chủ (khác với các trang bên trong ứng dụng vốn bị chặn bằng kiểm tra phiên và hoàn tất onboarding). Người dùng đã đăng nhập vẫn thấy nút "Đăng nhập" và "Thi thử miễn phí". | TBD | kiểm tra | apps/web/src/routes/_proto/index.tsx:5-7; apps/web/src/routes/_proto/app/route.tsx:7 | ✅ |
| FR-landing-page-003 | Ép giao diện sáng | Trong khung chứa trang chủ, hệ thống gỡ chế độ tối khỏi trang và đặt màu hệ thống là sáng. Nền trang là màu giấy, chữ màu mực. | TBD | demo | apps/web/src/routes/_proto/route.tsx:16-19; apps/web/src/routes/_proto/route.tsx:38 | ✅ |
| FR-landing-page-004 | Nạp hồ sơ từ phiên khi vào trang | Khung chứa trang chủ đọc phiên đăng nhập hiện tại và nạp hồ sơ vào trạng thái ứng dụng; khi phiên còn đang tải, người dùng được coi là chưa xác định và trạng thái không bị đụng tới; khi phiên đã xong mà không có người dùng, trạng thái ứng dụng được đặt lại về ban đầu (giữ chế độ thi và giọng đọc). | TBD | kiểm tra | apps/web/src/routes/_proto/route.tsx:31-35; apps/web/src/features/app-state/use-profile-hydration.ts:29-41 | ✅ |
| FR-landing-page-005 | Tiêu đề và mô tả tab trình duyệt | Tab trình duyệt hiển thị tiêu đề "Vox Flow — Thi thử IELTS Speaking AI" và mô tả "Giám khảo AI cho IELTS Speaking — Chấm 3 lần lấy trung vị, có bằng chứng rõ ràng." (đặt ở cấp gốc ứng dụng, áp cho mọi trang). | TBD | kiểm tra | apps/web/src/routes/__root.tsx:20-25 | ✅ |
| FR-landing-page-006 | Thanh đầu trang | Hiển thị logo, hai liên kết "Cách chấm" (cuộn tới khối lời hứa) và "Bảng giá" (cuộn tới khối bảng giá). Hai liên kết này bị ẩn ở màn hình hẹp dưới ngưỡng md. | TBD | demo | apps/web/src/features/landing/landing-screen.tsx:14-18; apps/web/src/features/landing/components/promises-section.tsx:5; apps/web/src/features/landing/components/pricing-teaser.tsx:9 | ✅ |
| FR-landing-page-007 | Nút "Đăng nhập" | Bấm nút "Đăng nhập" ở đầu trang chuyển người dùng tới màn đăng nhập/đăng ký. Test xác nhận gọi điều hướng "auth" đúng 1 lần. | TBD | test | apps/web/src/features/landing/landing-screen.tsx:20; apps/web/src/features/__tests__/slice-a.test.tsx:169-173 | ✅ |
| FR-landing-page-008 | Nút "Thi thử miễn phí" | Bấm nút "Thi thử miễn phí" ở đầu trang chuyển tới cùng màn đăng nhập/đăng ký (không có đích thi thử trực tiếp cho khách). | TBD | test | apps/web/src/features/landing/landing-screen.tsx:21; apps/web/src/features/__tests__/slice-a.test.tsx:164-167 | ✅ |
| FR-landing-page-009 | Khối hero: tiêu đề và mô tả | Hiển thị nhãn "Giám khảo AI cho IELTS Speaking", tiêu đề "Biết rõ vì sao bạn được 6.5." (từ "vì sao" nhấn màu thương hiệu) và đoạn mô tả: "Mỗi tiêu chí đều có band, lý do và trích đúng câu bạn đã nói làm bằng chứng. Chấm 3 lần lấy trung vị, nên điểm không nhảy lung tung giữa các lần thử." Test kiểm tiêu đề chứa "Biết rõ" và "vì sao". | TBD | test | apps/web/src/features/landing/components/hero.tsx:19-29; apps/web/src/features/__tests__/slice-a.test.tsx:122-124 | ✅ |
| FR-landing-page-010 | Hero: nút kêu gọi chính | Nút "Thi thử ngay — miễn phí" dẫn tới màn đăng nhập/đăng ký; kèm dòng "Không cần thẻ · 3 điểm miễn phí mỗi ngày". | TBD | test | apps/web/src/features/landing/components/hero.tsx:31-34; apps/web/src/features/__tests__/slice-a.test.tsx:157-161; apps/web/src/features/__tests__/slice-a.test.tsx:145 | ✅ |
| FR-landing-page-011 | Hero: ba số liệu cam kết | Hiển thị ba ô số liệu: "±0.5" — "độ chênh mục tiêu giữa 3 lần chấm"; "< 2s" — "từ lúc vào trang đến lúc ghi âm"; "0" — "giọng nói dùng huấn luyện nếu bạn không bật". Các số này là chuỗi cứng trong giao diện. | TBD | kiểm tra | apps/web/src/features/landing/components/hero.tsx:36-47 | ✅ |
| FR-landing-page-012 | Hero: thẻ xem trước kết quả mẫu | Hiển thị thẻ minh hoạ với dữ liệu mẫu cứng: "Full Test · 23/04", "Chấm 3 lần · trung vị", band 6.5, "Khoảng tin cậy 6.0 – 7.0", bốn ô tiêu chí FC 6.5, LR 6.0, GRA 6.0, PRON 6.5, và một trích dẫn bằng chứng "Also people there is very friendly." kèm nhận xét "Lỗi hòa hợp chủ–vị lặp lại 3 lần → people there are". Đây là dữ liệu minh hoạ, không đọc từ bài thi thật. | TBD | demo | apps/web/src/features/landing/components/hero.tsx:8-13; apps/web/src/features/landing/components/hero.tsx:53-89 | ✅ |
| FR-landing-page-013 | Khối "Khác biệt": bốn lời hứa | Dưới tiêu đề "Không còn điểm số “hộp đen”." hiển thị 4 thẻ: (1) "Band tổng miễn phí trong hạn mức" — "Mỗi ngày 3 điểm miễn phí: Full Test 3 điểm, mỗi Part 1 điểm. Mỗi bài có band tổng + khoảng tin cậy; chi tiết 4 tiêu chí mới cần trả phí."; (2) "Chấm minh bạch" — "Mỗi tiêu chí có band, lý do và đoạn trích câu bạn nói. Không tin? Bấm “Báo lỗi chấm”."; (3) "Chấm ổn định" — "Chấm 3 lần với đầu ra có cấu trúc, lấy trung vị và hiển thị khoảng tin cậy như 6.0–6.5."; (4) "Giám khảo hỏi nối tiếp" — "AI hỏi tiếp dựa trên chính câu trả lời của bạn — kể cả Part 1. Học vẹt sẽ lộ ngay." | TBD | test | apps/web/src/features/landing/components/promises-section.tsx:8-16; apps/web/src/features/__tests__/slice-a.test.tsx:146-149 | ✅ |
| FR-landing-page-014 | Khối bốn bước sử dụng | Hiển thị 4 bước đánh số 01-04: "Chọn Full Test hoặc từng Part"; "Trả lời giám khảo AI — có câu hỏi nối tiếp"; "Nhận band tổng ngay, trong vài giây"; "Xem bằng chứng & luyện lại câu yếu". | TBD | kiểm tra | apps/web/src/features/landing/components/promises-section.tsx:28-35 | ✅ |
| FR-landing-page-015 | Bảng giá: thẻ Miễn phí | Hiển thị thẻ "Miễn phí", giá "0đ", ba gạch đầu dòng: "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)", "Band tổng + khoảng tin cậy", "1 câu nhận xét mỗi bài". Nội dung thẻ không chứa cụm "không giới hạn", "mọi lượt", "hết lượt free" (test ngăn). | TBD | test | apps/web/src/features/landing/components/pricing-teaser.tsx:18-29; apps/web/src/features/__tests__/slice-a.test.tsx:139-143 | ✅ |
| FR-landing-page-016 | Bảng giá: ba thẻ trả phí | Từ danh sách gói, hệ thống bỏ gói "30 ngày" và hiển thị 3 thẻ: "Theo lượt" 49.000đ "3 lượt chi tiết"; "7 ngày" 99.000đ "/ tuần"; "Đến ngày thi" 349.000đ "trọn gói". Mỗi thẻ liệt kê quyền lợi của gói. Test khẳng định đúng 3 thẻ trả phí và tên từng gói có mặt. | TBD | test | apps/web/src/features/landing/components/pricing-teaser.tsx:30-47; apps/web/src/features/billing/data.ts:10-40; apps/web/src/features/__tests__/slice-a.test.tsx:126-130 | ✅ |
| FR-landing-page-017 | Bảng giá: gói nổi bật | Gói được đánh dấu nổi bật ("Đến ngày thi") hiển thị nền tối và nhãn "Phổ biến". | TBD | kiểm tra | apps/web/src/features/landing/components/pricing-teaser.tsx:31-32; apps/web/src/features/billing/data.ts:31 | ✅ |
| FR-landing-page-018 | Bảng giá không có nút mua | Các thẻ giá chỉ để xem: không có nút/ liên kết mua hay chọn gói trong khối bảng giá. | TBD | kiểm tra | apps/web/src/features/landing/components/pricing-teaser.tsx:17-48 | ✅ |
| FR-landing-page-019 | Định dạng giá | Giá hiển thị theo định dạng số vi-VN kèm ký hiệu "đ" (vd 49.000đ). | TBD | kiểm tra | apps/web/src/lib/format.ts:1; apps/web/src/features/landing/components/pricing-teaser.tsx:35 | ✅ |
| FR-landing-page-020 | Chân trang | Hiển thị "© 2026 Vox Flow", liên kết "Điều khoản dịch vụ & Chính sách sử dụng" và câu "Điểm chỉ mang tính tham khảo, không thay thế kỳ thi IELTS chính thức." Năm bản quyền là chuỗi cứng. | TBD | test | apps/web/src/features/landing/landing-screen.tsx:28-44; apps/web/src/features/__tests__/slice-a.test.tsx:133 | ✅ |
| FR-landing-page-021 | Mở trang điều khoản từ chân trang | Bấm thường vào liên kết điều khoản thì chuyển trang trong ứng dụng tới trang điều khoản. Giữ phím Ctrl hoặc Meta khi bấm thì không chặn, để trình duyệt mở liên kết theo cách mặc định (vd tab mới; hành vi Ctrl/Meta do mã xác nhận, test chỉ phủ lần bấm thường). | TBD | test | apps/web/src/features/landing/landing-screen.tsx:31-42; apps/web/src/features/__tests__/slice-a.test.tsx:174-176 | ✅ |
| FR-landing-page-022 | Trang điều khoản: khung và điều hướng | Trang điều khoản có nút "Quay lại": nếu lịch sử trình duyệt có hơn 1 mục thì quay lại trang trước, ngược lại chuyển tới màn đăng nhập. Có nhãn "Điều khoản & Chính sách", nhãn "Cập nhật lần cuối: Tháng 11/2026" (chuỗi cứng), tiêu đề "Điều khoản dịch vụ & Chính sách sử dụng" và lời mở đầu "Chào mừng bạn đến với Vox Flow. Khi đăng ký hoặc sử dụng dịch vụ luyện thi IELTS Speaking của chúng tôi, bạn đồng ý với các điều khoản dưới đây." | TBD | kiểm tra | apps/web/src/routes/_proto/terms.tsx:17-39 | ✅ |
| FR-landing-page-023 | Trang điều khoản: sáu mục nội dung | Trích nguyên văn, không diễn giải pháp lý. Mục "1. Phạm vi dịch vụ": "Vox Flow cung cấp nền tảng thi thử và chấm điểm kỹ năng IELTS Speaking ứng dụng trí tuệ nhân tạo (AI). Điểm số, phản hồi tiêu chí và các phân tích ngữ âm do hệ thống cung cấp mang tính chất tham khảo, giúp học viên định hướng luyện tập và không thay thế kết quả thi chính thức của các đơn vị khảo thí IELTS." Mục "2. Tài khoản và quyền truy cập": "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Bạn cam kết cung cấp thông tin chính xác và không chia sẻ tài khoản cho người khác để trục lợi hạn mức thi thử." Mục "3. Xử lý và lưu trữ dữ liệu bài làm": "Để thực hiện việc nhận dạng giọng nói, phân tích lỗi phát âm và trả kết quả chấm thi, Vox Flow ghi âm và lưu trữ các đoạn trả lời của bạn trong suốt quá trình làm bài. Các đoạn ghi âm và kết quả chấm điểm được lưu vào lịch sử tài khoản của bạn để phục vụ việc xem lại tiến trình học tập." và "Dữ liệu âm thanh của bạn được truyền tải qua kết nối bảo mật (HTTPS) và chỉ được xử lý cho mục đích cung cấp tính năng chấm thi, đánh giá phát âm và hỗ trợ phúc khảo (dispute) khi bạn yêu cầu." Mục "4. Quy định sử dụng hợp lý": "Người dùng cam kết không sử dụng hệ thống vào các mục đích:" với 3 gạch đầu dòng "Ghi âm hoặc tải lên nội dung vi phạm pháp luật, quấy rối, xúc phạm hoặc kích động thù địch.", "Can thiệp, phá hoại hoặc cố ý làm gián đoạn hạ tầng máy chủ, dịch vụ chấm thi của Vox Flow.", "Sử dụng các công cụ tự động hóa trái phép (bot, crawler) để khai thác đề thi hoặc hạn mức miễn phí." Mục "5. Quyền sở hữu trí tuệ": "Toàn bộ giao diện, thuật toán chấm điểm, hệ thống câu hỏi, đề forecast và tài liệu hướng dẫn trên Vox Flow thuộc quyền sở hữu của Vox Flow. Người dùng giữ quyền sở hữu đối với nội dung phát ngôn cá nhân của mình trong các bài thi thử." Mục "6. Thay đổi điều khoản": "Chúng tôi có thể cập nhật Điều khoản dịch vụ này theo thời gian để phản ánh các cải tiến sản phẩm hoặc quy định pháp luật mới. Những thay đổi quan trọng sẽ được thông báo rõ ràng trên ứng dụng." | TBD | kiểm tra | apps/web/src/routes/_proto/terms.tsx:42-90 | ✅ |
| FR-landing-page-024 | Trang điều khoản: khối liên hệ và nút quay lại đăng nhập | Cuối trang: "Nếu bạn có bất kỳ câu hỏi nào về Điều khoản dịch vụ hoặc thực hành dữ liệu, vui lòng liên hệ đội ngũ Vox Flow." kèm nút "Quay lại Đăng nhập" dẫn tới màn đăng nhập. Không có địa chỉ/kênh liên hệ cụ thể nào trong trang. | TBD | kiểm tra | apps/web/src/routes/_proto/terms.tsx:92-98 | ✅ |
| FR-landing-page-025 | Điều khoản cũng được liên kết từ màn đăng nhập | Màn đăng nhập có câu "Bằng việc tiếp tục, bạn đồng ý với" cùng liên kết tới cùng trang điều khoản (cùng cách xử lý Ctrl/Meta). Điểm giao với feature auth, nêu để truy vết. | TBD | test | apps/web/src/features/auth/auth-screen.tsx:257-270; apps/web/src/features/__tests__/slice-a.test.tsx:765-771 | ✅ |
| FR-landing-page-026 | Mục đích của từng khối trang | Code chỉ nói trang hiển thị gì; code không nói mục tiêu nghiệp vụ (chuyển đổi đăng ký, giảm thắc mắc về giá...) hay chỉ số đo hiệu quả. | TBD | phân tích | apps/web/src/features/landing/landing-screen.tsx:9-47 | 🟡 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-landing-page-001 | responsive | Bố cục co giãn: hero một cột ở màn hẹp, hai cột từ ngưỡng lg; bảng giá 4 cột từ ngưỡng md; lời hứa 2 cột md, 4 cột lg; thanh điều hướng giữa ẩn dưới md. | TBD | Kiểm tra giao diện ở 3 viewport | apps/web/src/features/landing/components/hero.tsx:17; apps/web/src/features/landing/components/pricing-teaser.tsx:17; apps/web/src/features/landing/components/promises-section.tsx:11; apps/web/src/features/landing/landing-screen.tsx:15 | ✅ |
| NFR-landing-page-002 | theme | Chỉ có chế độ sáng cho trang chủ và trang điều khoản (ép light). | TBD | Bật chế độ tối hệ điều hành, trang vẫn sáng | apps/web/src/routes/_proto/route.tsx:16-19 | ✅ |
| NFR-landing-page-003 | semantics / a11y | Trang dùng thẻ ngữ nghĩa header, nav, footer, h1, h2, h3; test truy cập heading cấp 1, nút và liên kết theo vai trò. Chưa có đo kiểm a11y nào khác trong test. | TBD | Test theo role đạt | apps/web/src/features/landing/landing-screen.tsx:13-28; apps/web/src/features/__tests__/slice-a.test.tsx:122-171 | ✅ |
| NFR-landing-page-004 | performance | Nội dung trang là tĩnh, không gọi API khi hiển thị (ngoài phiên đăng nhập của khung chứa). Hero có hoạt ảnh vào trang. Cam kết "< 2s từ lúc vào trang đến lúc ghi âm" chỉ là chữ trên giao diện; không có đo/ngưỡng nào trong code. | TBD | Đo thực tế (chưa có) | apps/web/src/features/landing/components/hero.tsx:18; apps/web/src/features/landing/components/hero.tsx:38-39; apps/web/src/routes/_proto/route.tsx:31-35 | 🟡 |
| NFR-landing-page-005 | language / content | Toàn bộ nội dung trang bằng tiếng Việt (thuật ngữ band, Part, Full Test giữ tiếng Anh). Không có cơ chế đa ngôn ngữ trong các file của feature. | TBD | Kiểm tra nội dung | apps/web/src/features/landing/landing-screen.tsx:15-21 | 🔵 |
| NFR-landing-page-006 | tooling | Công cụ nhà phát triển (bản đồ màn hình) chỉ hiển thị khi chạy môi trường phát triển, không có trên bản chạy thật. | TBD | Kiểm tra bản build | apps/web/src/routes/_proto/route.tsx:41 | ✅ |
| NFR-landing-page-007 | seo | Trang có tiêu đề và mô tả meta (xem FR-005). Tìm `og:`, `canonical`, `sitemap`, `robots` trong `apps/web` (html, ts, tsx, txt, xml; trừ node_modules) không có kết quả, và `apps/web/public` chỉ có thư mục avatars; có chủ đích hay không là chưa rõ (OQ-16). | TBD | Kiểm tra head | apps/web/src/routes/__root.tsx:17-33; apps/web/index.html | 🟡 |

## 5. Business Rules

> Các BR có nhãn "Đối chiếu" so sánh lời hứa/số liệu trên trang với hành vi hệ thống thật. Nhãn của dòng là nhãn của **kết luận đối chiếu**.

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-landing-page-001 | Mọi nút kêu gọi trên trang chủ (Đăng nhập, Thi thử miễn phí, Thi thử ngay — miễn phí) cùng dẫn tới màn đăng nhập/đăng ký; trang chủ không phân biệt đăng nhập với đăng ký. | Bấm nút | FR-landing-page-007, 008, 010 | apps/web/src/features/landing/landing-screen.tsx:20-21; apps/web/src/features/landing/components/hero.tsx:31; apps/web/src/features/app-state/routes.ts:9 | ✅ |
| BR-landing-page-002 | Giá và quyền lợi các gói lấy từ một danh sách gói dùng chung với feature billing (không phải dữ liệu riêng của landing); gói "30 ngày" 249.000đ tồn tại trong danh sách nhưng bị lọc khỏi trang chủ. Lý do bỏ gói tháng code không nói. | Hiển thị bảng giá | FR-landing-page-016 | apps/web/src/features/billing/data.ts:10-40; apps/web/src/features/landing/components/pricing-teaser.tsx:30 | ✅ |
| BR-landing-page-003 | Lý do loại gói "30 ngày" khỏi trang chủ, và vì sao "Đến ngày thi" là gói nổi bật (OQ-12). | — | FR-landing-page-016, 017 | apps/web/src/features/billing/data.ts:31 | 🟡 |
| BR-landing-page-004 | Ngôn từ về hạn mức miễn phí trên trang là "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)". Test của repo (tên test: "states quota accurately and contains no misleading promises") chặn các cụm "không giới hạn", "mọi lượt", "hết lượt free" trong thẻ miễn phí và hero. | Hiển thị thẻ miễn phí, hero, lời hứa 1 | FR-landing-page-010, 013, 015 | apps/web/src/features/__tests__/slice-a.test.tsx:136-152 | ✅ |
| BR-landing-page-005 | **Đối chiếu — hạn mức "3 điểm miễn phí mỗi ngày":** trong các file backend đã đọc không có cơ chế cấp/trừ "điểm" theo ngày cho chấm điểm. Hạn mức theo ngày duy nhất tìm thấy là giới hạn **thử chấm lại thủ công: tối đa 3 lần mỗi ngày theo lịch ngày Việt Nam (UTC+7) và 1 lần mỗi bài** — khác bản chất với "3 điểm/ngày". Số "3" trùng nhau nhưng khác đối tượng. Chưa kết luận được con số trên trang có cơ sở hệ thống hay không (OQ-1). | Hiển thị hạn mức | FR-landing-page-010, 013, 015 | packages/api/src/routers/scoring.ts:72-74; packages/api/src/routers/scoring.ts:119; packages/api/src/scoring/retry-limits.ts:1-17; packages/db/src/schema/score.ts:84 | 🟡 |
| BR-landing-page-006 | **Đối chiếu — "chi tiết 4 tiêu chí mới cần trả phí":** với bài đã chấm, màn kết quả đang mở khoá toàn bộ ("Beta: every scored result is fully unlocked") nên người dùng thấy chi tiết 4 tiêu chí không cần trả phí; lớp khoá chỉ áp cho dữ liệu chưa chấm. Lời hứa trên trang chủ (chi tiết 4 tiêu chí cần trả phí) **lệch** với hành vi hiện tại (OQ-3). | Xem kết quả | FR-landing-page-013, 015, 016 | apps/web/src/features/results/results-screen.tsx:258-259 | ✅ |
| BR-landing-page-007 | **Đối chiếu — "Thanh toán QR tự kích hoạt trong vài giây":** cổng thanh toán tắt khi cờ tính năng thanh toán của bản build không bằng "true" (tên biến ở cột Nguồn); khi tắt, chọn gói hiển thị "Cổng thanh toán sắp ra mắt" và nêu "Trong thời gian thử nghiệm Beta, toàn bộ tính năng đều được mở miễn phí." Test xác nhận không hiện mã QR. Lời hứa thanh toán QR trên trang chủ **lệch** với hành vi khi cờ tắt. Giá trị cờ ở môi trường thật chưa biết: không workflow CI hay cấu hình hạ tầng nào trong repo đặt biến này (tìm `VITE_FEATURE_BILLING` trong `.github`, `packages/infra`, cấu hình vite: chỉ có ở `feature-flags.ts`), nên bản build từ CI mặc định là tắt; các file `.env*` không được đọc (OQ-4). | Chọn gói | FR-landing-page-016, 018 | apps/web/src/lib/feature-flags.ts:1-4 (biến VITE_FEATURE_BILLING); apps/web/src/features/billing/components/payment-panel.tsx:28-44; apps/web/src/features/billing/__tests__/billing-gate.test.tsx:9-18 | ✅ |
| BR-landing-page-008 | **Đối chiếu — "Báo lỗi chấm":** nút chỉ hiện khi máy chủ báo tính năng đã bật; cờ máy chủ (tên ở cột Nguồn) có giá trị mặc định tắt trong cấu hình hạ tầng và trong workflow triển khai beta (lấy từ biến repo, nếu trống thì tắt), và khi gọi mà cờ tắt, hệ thống trả lỗi "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt". Lời hứa "Bấm “Báo lỗi chấm”" lệch khi cờ tắt. Giá trị cờ môi trường thật chưa biết (OQ-5). | Xem kết quả | FR-landing-page-013 | packages/infra/alchemy.run.ts:56 (biến SCORE_DISPUTE_ENABLED); .github/workflows/deploy-beta.yml:85; packages/api/src/routers/dispute.ts:27-33; packages/api/src/routers/dispute.ts:166; apps/web/src/features/results/results-screen.tsx:339 | ✅ |
| BR-landing-page-009 | **Đối chiếu — "Chấm 3 lần lấy trung vị":** số lần chấm mặc định là 3, có thể cấu hình qua biến môi trường số lần chấm (tên ở cột Nguồn) với giá trị nguyên từ 1 đến 7 (ngoài khoảng thì báo lỗi cấu hình); hạ tầng đặt mặc định "3". Mỗi tiêu chí lấy trung vị các lượt chấm, band tổng là trung bình của 4 trung vị làm tròn theo quy tắc IELTS. Lời hứa khớp mặc định; nhưng nếu cấu hình khác 3 thì trang sai. | Chấm bài | FR-landing-page-009, 013 | packages/api/src/scoring/config.ts:2-3 (biến SCORING_RUNS); packages/api/src/scoring/config.ts:63-68; packages/infra/alchemy.run.ts:43; packages/api/src/scoring/aggregate.ts:51-54; packages/api/src/scoring/aggregate.ts:61-74 | ✅ |
| BR-landing-page-010 | **Đối chiếu — "khoảng tin cậy" (hero, lời hứa 1 và 3, thẻ miễn phí):** với bài đã chấm bằng hệ thống thật, màn kết quả đặt khoảng tin cậy là không có ("Scored results show a single band: no confidence range or per-run values"), và máy chủ có chú thích khoảng/ giá trị từng lượt chấm "deliberately never returned to the learner". Lời hứa "hiển thị khoảng tin cậy như 6.0–6.5" và thẻ mẫu "6.0 – 7.0" **lệch** với kết quả chấm thật. Khoảng chỉ còn cho dữ liệu mẫu chưa chấm (OQ-2). | Xem kết quả | FR-landing-page-009, 012, 013, 015 | apps/web/src/features/results/results-screen.tsx:254-256; packages/api/src/routers/scoring.ts:56 | ✅ |
| BR-landing-page-011 | **Đối chiếu — "Band tổng + khoảng tin cậy" là phần miễn phí:** nhãn "Band tổng · Miễn phí" có trên màn kết quả; phần "khoảng tin cậy" xem BR-010. | Xem kết quả | FR-landing-page-015 | apps/web/src/features/results/components/band-hero.tsx:28 | ✅ |
| BR-landing-page-012 | **Đối chiếu — "Giám khảo hỏi nối tiếp... kể cả Part 1":** màn chọn Part 1 mô tả "Giám khảo có thể hỏi nối tiếp theo câu trả lời của bạn" (có thể, không chắc chắn). Phía máy chủ có thủ tục sinh câu hỏi nối tiếp bằng mô hình ngôn ngữ từ lời thí sinh (số Part từ 1 đến 3, mặc định Part 1); khi thiếu khoá API, lời thí sinh rỗng hoặc gọi lỗi/quá 4 giây thì trả câu hỏi cố định theo từ khoá. Trong mã web không thấy nơi nào gọi thủ tục này (tìm `getFollowUp`, `followUp` ngoài test), nên chưa xác nhận được câu hỏi nối tiếp động có tới được người dùng và khoá API ở môi trường thật có được đặt hay không. Lời hứa có cơ sở ở backend nhưng chưa chứng minh được đầu-cuối (OQ-9). | Làm bài | FR-landing-page-013, 014 | apps/web/src/features/exam/data.ts:68; packages/api/src/routers/attempt.ts:144-193; packages/api/src/exam/follow-up.ts:24-35; packages/api/src/exam/follow-up.ts:55-69; packages/api/src/exam/follow-up.ts:82-88; packages/api/src/exam/fallback-data.ts:14-20 | 🟡 |
| BR-landing-page-013 | **Đối chiếu — "0 giọng nói dùng huấn luyện nếu bạn không bật":** trạng thái ban đầu phía giao diện: đồng ý huấn luyện (khoá `train`) tắt, đồng ý lưu bài (`save`) bật. Phía máy chủ, khoá `train` chỉ là bí danh của đồng ý hiệu chỉnh (`calibration`), được ghi thành sự kiện đồng ý; khi bắt đầu bài thi, máy chủ luôn lưu bài vào lịch sử và đặt cờ hiệu chỉnh của bài là tắt, không đọc đồng ý của người dùng (chú thích mã: nút bật hiệu chỉnh đã bị gỡ khỏi giao diện). Không thấy nơi nào dùng đồng ý này để đưa âm thanh vào huấn luyện, nên lời hứa "0" không bị mã phản bác nhưng cũng chưa có cơ chế "bật" nào hoạt động. Điều khoản mục 3 nói âm thanh được ghi và lưu. Cần xác nhận với pháp chế (OQ-10). | Đăng ký, làm bài | FR-landing-page-011, 023 | apps/web/src/features/app-state/initial-state.ts:9; packages/api/src/routers/privacy.ts:47; packages/api/src/routers/privacy.ts:83; packages/api/src/routers/privacy.ts:110; packages/api/src/exam/consent.ts:12-18; packages/api/src/routers/attempt.ts:88-100 | 🟡 |
| BR-landing-page-014 | **Số liệu "±0.5" và "< 2s":** không có hằng số, kiểm thử hay đo lường nào trong các file đã đọc xác nhận hai số này. Là cam kết hiển thị trên trang mà chưa có cơ sở trong code (OQ-8). | Hiển thị hero | FR-landing-page-011 | apps/web/src/features/landing/components/hero.tsx:38-39 | 🟡 |
| BR-landing-page-015 | Năm bản quyền "2026", nhãn "Cập nhật lần cuối: Tháng 11/2026" và dữ liệu mẫu "Full Test · 23/04" là chuỗi cứng, không lấy từ ngày hệ thống hay dữ liệu thật; không tự đổi theo thời gian. | Hiển thị | FR-landing-page-012, 020, 022 | apps/web/src/features/landing/landing-screen.tsx:29; apps/web/src/routes/_proto/terms.tsx:32; apps/web/src/features/landing/components/hero.tsx:55 | ✅ |
| BR-landing-page-016 | Điều khoản mục 3 nói dữ liệu âm thanh dùng để "hỗ trợ phúc khảo (dispute) khi bạn yêu cầu"; trong khi tính năng báo lỗi chấm có cờ mặc định tắt (xem BR-008). Điều khoản nhắc một khả năng đang có thể chưa bật. Không diễn giải pháp lý (OQ-5). | Đọc điều khoản | FR-landing-page-023 | apps/web/src/routes/_proto/terms.tsx:62; packages/infra/alchemy.run.ts:56 | ✅ |
| BR-landing-page-017 | Điều khoản mục 2 và 4 nhắc "hạn mức thi thử"/"hạn mức miễn phí" nhưng không nêu giá trị hạn mức; con số duy nhất nằm ở trang chủ (xem BR-005). | Đọc điều khoản | FR-landing-page-023 | apps/web/src/routes/_proto/terms.tsx:52; apps/web/src/routes/_proto/terms.tsx:74 | ✅ |
| BR-landing-page-018 | Landing không có nhánh dành riêng cho người đã đăng nhập, không có điểm gọi mở paywall hay điều hướng tới trang thanh toán từ các thẻ giá (xem negative-search). | — | FR-landing-page-002, 018 | apps/web/src/features/landing/landing-screen.tsx:9-47 | ✅ |
| BR-landing-page-019 | Việc cố ý không chuyển hướng người đã đăng nhập, và việc nút "Thi thử miễn phí" chưa dẫn thẳng vào thi thử cho khách, có phải chủ ý sản phẩm hay không (OQ-6, OQ-7). | — | FR-landing-page-002, 008 | apps/web/src/routes/_proto/index.tsx:5-7 | 🟡 |

## 6. Error Matrix

Trang chủ và trang điều khoản không có trạng thái lỗi hướng người dùng (không form, không gọi API). Chỉ có lỗi lập trình khi ngữ cảnh ứng dụng thiếu.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-landing-page-001 | Thiếu ngữ cảnh trạng thái ứng dụng | Thành phần trang gọi hook lấy ngữ cảnh ngoài khung cung cấp ngữ cảnh | major (lỗi lập trình, không phải lỗi người dùng) | FR-landing-page-001 | Thông điệp lỗi chuẩn của JS: "useApp must be used within AppStateProvider" (không có giao diện lỗi riêng) | Không có đường phục hồi trong code; trong ứng dụng, khung chứa luôn bọc nội dung nên người dùng không gặp | apps/web/src/features/app-state/types.ts:114-119; apps/web/src/routes/_proto/route.tsx:21-25 | ✅ |
| E-landing-page-002 | Phiên đăng nhập tải lỗi/chưa có | Đọc phiên thất bại hoặc chưa đăng nhập | minor | FR-landing-page-004 | Trang vẫn hiển thị bình thường như khách; người dùng coi là chưa đăng nhập | Không cần; trang không phụ thuộc phiên. Không có thông báo lỗi nào cho người dùng; khi phiên xong mà không có người dùng, trạng thái ứng dụng được đặt lại về ban đầu. | apps/web/src/routes/_proto/route.tsx:31-35; apps/web/src/features/app-state/use-profile-hydration.ts:33-41 | 🔵 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-landing-page-01 | Khách bấm vào đăng nhập/thi thử (OQ-13) | <!-- TBD --> chưa có sự kiện phân tích hay chỉ số trong code | <!-- TBD --> | apps/web/src/features/landing/landing-screen.tsx:20-21 | 🟡 |
| SC-landing-page-02 | Nội dung giá và hạn mức trên trang khớp hành vi hệ thống (OQ-1, OQ-3, OQ-4) | Đối chiếu thủ công (xem Conflicts) | <!-- TBD --> | reverse-gaps.md mục 3 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/landing-page-reverse-erd.md`)

Feature không đọc/ghi dữ liệu máy chủ. Chỉ có một cấu trúc dữ liệu tĩnh dùng chung: **Gói dịch vụ** (mã, tên, giá, đơn vị, danh sách quyền lợi, cờ nổi bật) gồm 4 gói (Theo lượt, 7 ngày, Đến ngày thi, 30 ngày), trang chủ hiển thị 3 trong 4. ✅ [apps/web/src/features/billing/data.ts:1-40]. Chi tiết và lý do ERD rút gọn ở file ERD.

## 9. Flows (tóm tắt — chi tiết ở `srs/landing-page-reverse-flows.md`)

1. Khách mở trang chủ và duyệt nội dung (có nạp phiên) ✅.
2. Khách bấm nút kêu gọi để vào màn đăng nhập/đăng ký ✅.
3. Khách cuộn tới Cách chấm / Bảng giá bằng liên kết đầu trang ✅.
4. Khách mở và đọc trang điều khoản, quay lại ✅.

## 10. Screens (tóm tắt)

| Màn | Đường dẫn | Mã màn | Thành phần chính | Nguồn | Nhãn |
|-----|-----------|--------|------------------|-------|------|
| Landing | `/` | S01 | Header (logo, 2 liên kết neo, 2 nút), Hero (nhãn, tiêu đề, mô tả, nút chính, 3 số liệu, thẻ xem trước), Khối "Khác biệt" (4 thẻ + 4 bước), Bảng giá (1 thẻ miễn phí + 3 thẻ trả phí), Footer | apps/web/src/layouts/screen-map.tsx:16; apps/web/src/layouts/screen-map.tsx:88; apps/web/src/features/landing/landing-screen.tsx:9-47 | ✅ |
| Điều khoản | `/terms` | S25 | Header (Quay lại, nhãn), nhãn cập nhật, tiêu đề, 6 mục, khối liên hệ + nút "Quay lại Đăng nhập" | apps/web/src/layouts/screen-map.tsx:29; apps/web/src/layouts/screen-map.tsx:101; apps/web/src/routes/_proto/terms.tsx:11-102 | ✅ |

Màn hình đích của điều hướng: màn đăng nhập (`/auth`) thuộc feature auth. ✅ [apps/web/src/features/app-state/routes.ts:9]

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Cơ chế áp đặt | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Tên sản phẩm hiển thị là "Vox Flow" | CLAUDE.md (quyết định D-01) | apps/web/src/features/landing/landing-screen.tsx:29 | ✅ |
| Trang không được dùng cụm gây hiểu nhầm hạn mức ("không giới hạn", "mọi lượt", "hết lượt free") | Test của repo | apps/web/src/features/__tests__/slice-a.test.tsx:136-152 | ✅ |
| Nội dung điều khoản phải do chủ sản phẩm/pháp chế duyệt; code không nói ai duyệt (OQ-11) | — | apps/web/src/routes/_proto/terms.tsx:32 | 🟡 |

**Dependencies (deliverable do bên khác sở hữu):** phụ thuộc kỹ thuật được code xác nhận, nhưng cột Owner là suy luận từ vị trí module nên mọi dòng gắn 🟡 (OQ-15).

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Danh sách gói và giá (dùng chung với billing) | feature billing | Bảng giá trang chủ | apps/web/src/features/billing/data.ts:10-40 | 🟡 |
| Màn đăng nhập/đăng ký | feature auth | Mọi nút kêu gọi | apps/web/src/features/app-state/routes.ts:9 | 🟡 |
| Khung chứa proto (state ứng dụng, phiên, paywall) | layout `_proto` | Hiển thị trang chủ (hook ngữ cảnh) | apps/web/src/routes/_proto/route.tsx:15-44 | 🟡 |
| Thư viện biểu tượng và thành phần giao diện dùng chung | design system | Giao diện | apps/web/src/features/landing/landing-screen.tsx:1-3 | 🟡 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Giá, hạn mức, tên gói trên trang là phản ánh sản phẩm dự kiến, không phải dữ liệu mẫu (ý đồ sản phẩm, code không nói; OQ-12) | BR-005/006/007 và bảng giá | apps/web/src/features/billing/data.ts:10-40; apps/web/src/features/billing/components/payment-panel.tsx:35 | 🟡 |
| Ứng dụng đang ở giai đoạn Beta, nhiều tính năng mở miễn phí (giả định về vòng đời sản phẩm; chuỗi "Beta" xuất hiện trong code nhưng không có tài liệu xác nhận; OQ-3) | BR-006, 007 | apps/web/src/features/billing/components/payment-panel.tsx:35; apps/web/src/features/results/results-screen.tsx:258 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md); số OQ ở đây trùng số trong file đó. Dưới đây chỉ trích các OQ blocking và OQ mới thêm khi audit.

- [ ] OQ-1: "3 điểm miễn phí mỗi ngày" trên trang có cơ chế hệ thống thực hiện không? Backend chỉ có hạn mức thử chấm lại 3 lần/ngày. (BR-005)
- [ ] OQ-2: Lời hứa "khoảng tin cậy" có cần giữ khi kết quả chấm thật không trả khoảng? (BR-010)
- [ ] OQ-3: Lời hứa "chi tiết 4 tiêu chí mới cần trả phí" có cần sửa khi Beta mở khoá toàn bộ kết quả đã chấm? (BR-006)
- [ ] OQ-4: Cờ thanh toán của bản build ở môi trường thật đang bật hay tắt? Nếu tắt, câu "Thanh toán QR tự kích hoạt trong vài giây" có cần ghi chú "sắp ra mắt"? (BR-007)
- [ ] OQ-5: Cờ báo lỗi chấm ở máy chủ thật đang bật hay tắt (mặc định tắt)? Ảnh hưởng lời hứa "Báo lỗi chấm" và đoạn điều khoản về phúc khảo. (BR-008, BR-016)
- [ ] OQ-6: Người đã đăng nhập vào trang gốc có nên được chuyển hướng không? (FR-002, BR-019)
- [ ] OQ-9: Câu hỏi nối tiếp sinh động ở backend có được nối tới giao diện thi không? (BR-012)
- [ ] OQ-15 (mới, audit): Ai là owner nghiệp vụ của danh sách gói/giá (billing), màn đăng nhập (auth) và khung proto? Code chỉ cho biết vị trí module. (Mục 11 Dependencies)
- [ ] OQ-16 (mới, audit): Việc không có thẻ Open Graph, canonical, sitemap, robots là có chủ đích hay chưa làm? (NFR-007)
