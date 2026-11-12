---
type: reverse-srs
feature: forecast-practice
status: draft
updated: 2026-11-11
confidence_summary: "✅89 🔵0 🟡26"
links:
  - docs/_reverse/forecast-practice/reverse-sources.md
  - docs/_reverse/forecast-practice/reverse-gaps.md
  - docs/_reverse/forecast-practice/_evidence.md
  - docs/_reverse/forecast-practice/srs/forecast-practice-reverse-flows.md
  - docs/_reverse/forecast-practice/srs/forecast-practice-reverse-states.md
  - docs/_reverse/forecast-practice/srs/forecast-practice-reverse-erd.md
  - docs/_reverse/forecast-practice/usecases/forecast-practice-reverse-usecase-index.md
---

# forecast-practice — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập từ source code, CHƯA duyệt). Nhãn: ✅ chắc chắn (code/test khẳng định) · 🔵 suy đoán có từ 2 chỗ code hậu thuẫn · 🟡 cần xác nhận (code không nói). Mọi Priority đều `TBD`: code không cho biết mức ưu tiên nghiệp vụ (OQ-16).

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái tài liệu:** bản tái lập tự động từ code, CHƯA duyệt bởi Product Owner/BA. Không dùng làm nguồn chính thức cho tới khi duyệt.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md) (S1–S25).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Audit độc lập:** đã chạy 2026-11-11, hạ 20 claim, sửa 21 cite.
- **Quy ước:** tên endpoint/hàm/bảng chỉ xuất hiện ở cột Nguồn; chuỗi lỗi và chuỗi giao diện được trích nguyên văn (tiếng Anh hoặc tiếng Việt đúng như code).
- **Cảnh báo đọc code (quan trọng):** màn web có những phần trông như tính năng hoàn chỉnh nhưng nguồn dữ liệu của chúng không được ghi ở bất kỳ đâu trong code: tiến độ đã luyện (band theo chủ đề / theo câu), độ phủ, bộ lọc "Chưa luyện", nhãn "Gặp gần nhất", "Luyện câu kế tiếp" và "Quay lại chủ đề" sau kết quả. Các phần này được gắn 🟡 và ghi negative-search ở `reverse-gaps.md` (OQ-2, OQ-7, OQ-10). Chức năng "báo chủ đề" có ở máy chủ nhưng web không gọi (OQ-4).

### 0.3 Khác biệt với tài liệu chính

| Điểm | Reverse nói (từ nguồn) | Doc chính nói (`docs/roadmap-work-items.md`, `docs/_product/roadmap.md`, `plans/261105-0910-wi20-forecast-practice/plan.md`) | Đề xuất |
|------|------------------------|------------------------------------------------------------------------------------------------------------------------------|---------|
| Trạng thái triển khai | Có màn web đầy đủ luồng duyệt/lọc/xem/luyện và API danh sách đã đăng chạy được, có test phủ [S1, S6, S2, S10] | Mục 20 ghi "Next", khóa 🔒 (chờ mục 12, 13, 14, 15, 19); plan `status: pending` [S23] | Xác nhận trạng thái thật rồi `/cr` (OQ-1, Conflict C1) |
| Danh sách ôn | Danh sách lưu chỉ nằm trong bộ nhớ trình duyệt của phiên, mất khi tải lại trang [S14] | Tiêu chí plan: "danh sách ôn được lưu theo tài khoản" [S23] | `/gap` (OQ-3, Conflict C3) |
| Độ phủ | Độ phủ đọc từ bản ghi tiến độ nhưng không có đoạn code nào ghi bản ghi này [S9, S14] | Tiêu chí plan: "Độ phủ tính từ bài luyện thật" [S23] | `/gap` (OQ-2, Conflict C3) |
| Phân quyền theo gói | Không có kiểm tra gói/hạn mức riêng cho forecast; chỉ có cổng pilot ở bước mở lượt thi [S17] | Tiêu chí plan: "Phân quyền theo gói kiểm tra ở server" và câu hỏi mở về gói trả phí [S23] | `/gap` (OQ-8, Conflict C3) |

## 1. Scope

Tính năng cho phép học viên đã đăng nhập xem danh sách chủ đề dự đoán đề thi IELTS Speaking của một quý, lọc/tìm theo nhu cầu, xem chi tiết từng chủ đề, lưu chủ đề vào danh sách ôn, và bắt đầu luyện cả chủ đề hoặc từng câu thông qua phòng thi và chấm điểm. ✅ [S6, S9, S10]

Hệ thống chỉ hiển thị chủ đề đã được quản trị đăng; mỗi chủ đề kèm số thí sinh đã báo gặp. ✅ [S1:38, S1:56-69]

Máy chủ cho phép học viên đã đăng nhập báo "đã gặp chủ đề" (mỗi người một lần cho mỗi chủ đề, kèm ghi chú tùy chọn); web hiện không có nút nào dùng chức năng này. ✅ [S1:87-135] · không có người gọi phía web 🟡 [OQ-4]

Quý hiển thị cố định là "2026-Q3" (nhãn "Quý 3/2026"). ✅ [S8:8-13]

**Boundary (ngoài scope):**

- Biên soạn, duyệt, đăng, lưu trữ chủ đề và thu thập nguồn: thuộc `forecast-curation`; ở đây chỉ nêu điểm bàn giao (chủ đề phải ở trạng thái đã đăng mới hiện ra). ✅ [S20:276-325]
- Ghi âm, nộp bài, chấm điểm, hiển thị kết quả: thuộc `mock-exam` và `scoring-results`; ở đây chỉ nêu điểm nối. ✅ [S17, S18, S19]
- Hạn mức miễn phí, thanh toán theo gói: không thấy trong code của feature này. 🟡 [OQ-8]
- Nhắc luyện, gợi ý việc mỗi ngày: không thấy trong code của feature này (plan ghi thuộc mục khác). 🟡 [S23]

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Học viên đã đăng nhập và đã hoàn tất onboarding | người | Duyệt, lọc, xem chi tiết, lưu và luyện chủ đề dự đoán (suy luận từ các thao tác trên màn) | Có | S13 (apps/web/src/routes/_proto/app/route.tsx:6-9), S6 | 🟡 |
| Khách chưa đăng nhập | người | Xem danh sách chủ đề đã đăng (API cho phép), nhưng màn web chuyển hướng về trang đăng nhập (mục tiêu của việc mở API công khai: suy luận, xem OQ-9) | Có (một phần) | S1:28 (không yêu cầu phiên), S13 | 🟡 |
| Quản trị viên | người | Soạn, duyệt, đăng chủ đề (suy luận từ các thao tác quản trị) | Không (thuộc `forecast-curation`) | S20:276-325 | 🟡 |
| Phòng thi (mock-exam) | hệ thống | Nhận phiên luyện, mở lượt thi có chủ đề, kiểm tra khóa câu hỏi (suy luận từ hành vi) | Không (bàn giao) | S17:23-125, S18 | 🟡 |
| Chấm điểm (scoring-results) | hệ thống | Nhận bài luyện đã nộp và chấm (suy luận từ hành vi) | Không (bàn giao) | S18 exam-screen.tsx:131-139, S19 | 🟡 |
| Mục tiêu nghiệp vụ của feature (vì sao có, ai hưởng lợi, chỉ số) | — | Code không nói | — | — | 🟡 |

> Nhãn mỗi dòng áp cho cột "Mục tiêu", vốn là suy luận từ hành vi của code. Sự tồn tại của actor có căn cứ ở cột Nguồn.

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-forecast-practice-001 | Chỉ liệt kê chủ đề đã đăng | Hệ thống chỉ trả về các chủ đề ở trạng thái "đã đăng". Chủ đề nháp hoặc đã lưu trữ không bao giờ xuất hiện trong danh sách học viên. | TBD | test | S1:38 | ✅ |
| FR-forecast-practice-002 | Lọc danh sách theo quý | Khi yêu cầu có quý, hệ thống chỉ trả chủ đề thuộc đúng quý đó. Không có quý thì trả chủ đề của mọi quý. Web luôn gửi quý cố định "2026-Q3". | TBD | test | S1:32, S1:39-41, S6:33, S2:41-45 | ✅ |
| FR-forecast-practice-003 | Lọc danh sách theo Part | Khi yêu cầu có Part, hệ thống chỉ trả chủ đề thuộc Part đó. Part phải là số nguyên từ 1 đến 3. Web không gửi Part; web tách Part 1 và Part 2 và 3 bằng hai tab ở phía trình duyệt. | TBD | test | S1:33, S1:42-44, S2:54-95 | ✅ |
| FR-forecast-practice-004 | Thứ tự trả về của máy chủ | Máy chủ trả chủ đề mới tạo trước. Web sắp xếp lại theo số thí sinh báo gặp giảm dần (FR-012). | TBD | kiểm tra | S1:50, S6:96 | ✅ |
| FR-forecast-practice-005 | Số thí sinh đã báo gặp | Mỗi chủ đề kèm số học viên khác nhau đã báo gặp chủ đề đó; chủ đề chưa ai báo có số 0. Trả danh sách rỗng khi không có chủ đề nào khớp. | TBD | test | S1:52-69, S1:82, S2:108-124, S20:219-267 | ✅ |
| FR-forecast-practice-006 | Chuẩn hóa nội dung câu hỏi trả về | Nội dung chủ đề được trả về dạng danh sách câu (Part 1) hoặc dạng gồm các thẻ gợi ý và các câu Part 3 (Part 2 và 3), kèm cờ chủ đề mới. Nội dung hỏng được trả thành danh sách rỗng, không báo lỗi. | TBD | test | S1:71-84, S3:34-63, S3 test:20-31 (questions.test.ts) | ✅ |
| FR-forecast-practice-007 | Ánh xạ chủ đề sang dạng hiển thị | Chủ đề Part 1 hiển thị là danh sách câu hỏi. Chủ đề Part 2 và 3 hiển thị là một thẻ chủ đề (Part 2) cộng các câu Part 3. Mỗi câu có khóa riêng ổn định. | TBD | test | S7:38-105, S12 state-and-data.test.ts:54-89 | ✅ |
| FR-forecast-practice-008 | Tiêu đề màn và phạm vi quý | Màn hiển thị "Đề forecast · Quý 3/2026 · Tháng 9 – Tháng 12", tiêu đề "Luyện theo đề dự đoán" và dòng mô tả có ngày "cập nhật 26/10/2026". Các giá trị này là hằng số trong code, không lấy từ dữ liệu (xem OQ-6, OQ-17). | TBD | kiểm tra | S6:137-139, S8:8-13, S12 state-and-data.test.ts:45-52 | ✅ |
| FR-forecast-practice-009 | Hai tab Part kèm số lượng | Hai tab "Part 1" và "Part 2 & 3", mỗi tab hiện số chủ đề của nhóm đó (tính trên toàn bộ chủ đề đã tải, không phụ thuộc bộ lọc hay ô tìm kiếm). Mặc định mở tab Part 1. | TBD | test | S9 forecast-toolbar.tsx:28-34, S6:22, S6:50-55, S12 slice-b.test.tsx:141-149 | ✅ |
| FR-forecast-practice-010 | Năm bộ lọc nhanh | Các bộ lọc: "Tất cả", "Hay gặp", "Mới trong quý", "Chưa luyện", "Đã lưu"; mặc định "Tất cả". Bộ lọc áp lên tab Part đang chọn. | TBD | test | S9 forecast-toolbar.tsx:8-14, S6:23, S6:68-82, S12 slice-b.test.tsx:158-171 | ✅ |
| FR-forecast-practice-011 | Tìm kiếm chủ đề hoặc câu hỏi | Ô tìm kiếm với gợi ý "Tìm chủ đề hoặc câu hỏi…" lọc theo nội dung tiêu đề, nhóm, câu hỏi, điểm gợi ý và phần kết của thẻ, trong phạm vi tab Part đang chọn. | TBD | test | S9 forecast-toolbar.tsx:38, S6:83-94, S12 slice-b.test.tsx:217-226 | ✅ |
| FR-forecast-practice-012 | Sắp xếp danh sách hiển thị | Danh sách trên màn được sắp theo số thí sinh báo gặp giảm dần. | TBD | kiểm tra | S6:96 | ✅ |
| FR-forecast-practice-013 | Trạng thái tải, lỗi, rỗng | Khi đang tải: hiện khung chờ 6 thẻ và thẻ gợi ý chờ. Khi lỗi: hiện thông báo lỗi kèm nút "Thử lại" để tải lại. Khi không có kết quả: hiện trạng thái rỗng (khác nhau cho bộ lọc "Đã lưu", tìm kiếm có từ khóa và trường hợp còn lại), kèm nút "Xem tất cả chủ đề" nếu đang lọc hoặc tìm. | TBD | test | S6:150-156, S6:196-225, S6:242-266, S12 slice-b.test.tsx:173-226 | ✅ |
| FR-forecast-practice-014 | Thẻ chủ đề | Mỗi thẻ hiện nhóm (Part), nhãn "Hay gặp" hoặc "Mới", tiêu đề, tóm tắt (các điểm gợi ý nối bằng dấu chấm giữa, hoặc nội dung câu), số thí sinh báo, số câu, "Gặp …" và nút lưu. Chạm vào thẻ mở chi tiết. | TBD | kiểm tra | S9 topic-card.tsx:19-53 | ✅ |
| FR-forecast-practice-015 | Chi tiết chủ đề | Cửa sổ chi tiết hiện nhóm, nhãn, tiêu đề, số thí sinh báo, "Gặp gần nhất", thẻ gợi ý Part 2 ("You should say: …"), danh sách câu kèm nút luyện từng câu, ghi chú "Câu hỏi thật có thể khác cách diễn đạt…", nút lưu và nút luyện cả chủ đề. | TBD | test | S9 topic-detail-modal.tsx:34-131, S10:245-284 | ✅ |
| FR-forecast-practice-016 | Lưu và bỏ lưu chủ đề vào danh sách ôn | Học viên bấm biểu tượng lưu (trên thẻ hoặc trong chi tiết) để lưu hoặc bỏ lưu; hệ thống hiện thông báo "Đã lưu vào danh sách ôn" hoặc "Đã bỏ khỏi danh sách ôn". Danh sách lưu chỉ tồn tại trong bộ nhớ của phiên màn hình, không gửi lên máy chủ. | TBD | test | S6:122-126, S9 topic-card.tsx:30-39, S14 store.tsx:94-106, S12 slice-b.test.tsx:228-235 | ✅ |
| FR-forecast-practice-017 | Hiển thị tiến độ đã luyện | Thẻ và chi tiết có chỗ hiện "Band x.x" của chủ đề và "Band x.x · n lần luyện" của từng câu, và nút đổi thành "Luyện lại". Dữ liệu tiến độ này luôn rỗng trong code hiện tại vì không có chỗ nào ghi vào. | TBD | kiểm tra | S9 topic-card.tsx:51, S9 topic-detail-modal.tsx:53,74-83, S14 initial-state.ts:16-17, S10:245-284 (chỉ test với dữ liệu gán sẵn) | 🟡 |
| FR-forecast-practice-018 | Độ phủ đề forecast | Khung đầu trang hiện số chủ đề đã luyện trên tổng, thanh tiến độ riêng cho Part 1 và Part 2 và 3, và (khi học viên có ngày thi và còn chủ đề chưa luyện) gợi ý số chủ đề cần luyện mỗi ngày. Tính theo bản ghi tiến độ nên hiện luôn là 0 chủ đề đã luyện. | TBD | kiểm tra | S9 coverage-banner.tsx:10-45, S14 initial-state.ts:16 | 🟡 |
| FR-forecast-practice-019 | Gợi ý luyện tiếp | Hiện thẻ "Gợi ý luyện tiếp" với chủ đề chưa luyện có nhiều thí sinh báo nhất (cả hai Part), kèm nút "Luyện ngay". Khi mọi chủ đề đã luyện (và có chủ đề) hiện "Bạn đã phủ hết đề quý này!". | TBD | test | S6:58-63, S6:150-181, S12 slice-b.test.tsx:204-215 | ✅ |
| FR-forecast-practice-020 | Bốc ngẫu nhiên đề hot | Nút "Bốc ngẫu nhiên đề hot" mở chi tiết một chủ đề ngẫu nhiên: ưu tiên chủ đề "Hay gặp" chưa luyện; nếu không còn thì chọn ngẫu nhiên trong mọi chủ đề. Nút bị vô hiệu khi đang tải hoặc không có chủ đề. | TBD | kiểm tra | S6:128-133, S6:140-144 | ✅ |
| FR-forecast-practice-021 | Luyện cả chủ đề | Bấm "Luyện chủ đề này" (hoặc "Luyện ngay" ở thẻ gợi ý) tạo phiên luyện gồm toàn bộ câu của chủ đề (không kèm đáp án mẫu) rồi chuyển sang phòng thi. | TBD | test | S6:100-103, S10:138-243 | ✅ |
| FR-forecast-practice-022 | Luyện từng câu | Trong chi tiết, mỗi câu Part 1 và Part 3 có nút "Luyện câu này" (hoặc "Luyện lại"); phiên chỉ gồm câu đó (bỏ thẻ gợi ý) và lưu kèm danh sách câu của chủ đề. Thẻ gợi ý Part 2 không có nút luyện riêng. | TBD | test | S6:105-121, S9 topic-detail-modal.tsx:59-104, S10:245-313 | ✅ |
| FR-forecast-practice-023 | Mở lượt thi cho phiên luyện chủ đề | Khi vào phòng thi từ phiên luyện, hệ thống mở một lượt thi gắn với chủ đề (và khóa câu hỏi nếu luyện từng câu) với chế độ phù hợp (xem BR-031). Máy chủ từ chối nếu chủ đề không tồn tại/chưa đăng hoặc khóa câu không thuộc chủ đề. | TBD | test | S17:61-86, S18:83-100, S18:158-166, S10:315-368 | ✅ |
| FR-forecast-practice-024 | Nộp bài luyện và thoát phòng thi | Khi nộp bài trong phiên luyện và lượt thi đã mở được trên máy chủ, học viên được chuyển sang màn chấm với bài chưa nộp để màn chấm tự nộp; nếu chưa có lượt thi trên máy chủ thì chuyển sang màn chấm ở trạng thái chỉ lưu cục bộ. Khi thoát phòng thi giữa chừng trong phiên luyện, học viên quay về màn forecast và phiên luyện bị xóa. | TBD | test | S18 exam-screen.tsx:131-148, S18 exam-screen.tsx:178-184, S12 slice-c.test.tsx:312-328 | ✅ |
| FR-forecast-practice-025 | Báo đã gặp chủ đề | Học viên đã đăng nhập báo mình đã gặp một chủ đề đã đăng, kèm ghi chú tùy chọn. Mỗi học viên chỉ tính một lần cho mỗi chủ đề; báo lần nữa vẫn thành công nhưng không ghi thêm và kết quả cho biết đã báo trước đó. Số báo là cơ sở của "số thí sinh báo gặp". Chưa thấy nút hay màn nào trên web gọi chức năng này 🟡 (negative-search N1, OQ-4). | TBD | test | S1:87-135, S2:108-124, S20 test:219-267 | ✅ |
| FR-forecast-practice-026 | Quay lại chủ đề sau kết quả | Từ trang kết quả của bài luyện từng câu, nút "Quay lại chủ đề" đưa học viên về màn forecast, tự chuyển đúng tab Part và mở lại chi tiết chủ đề. Điều kiện hiển thị nút phụ thuộc phiên luyện cuối, nhưng không có đoạn code nào đặt phiên này. | TBD | test | S19 results-screen.tsx:349-361, S6:40-49, S10:462-472 | 🟡 |
| FR-forecast-practice-027 | Luyện câu kế tiếp sau kết quả | Từ trang kết quả của bài luyện từng câu, nút "Luyện câu kế tiếp trong chủ đề" mở phiên luyện câu kế (bỏ qua thẻ gợi ý); không hiện khi xem bài khác. Điều kiện hiển thị phụ thuộc phiên luyện cuối, nhưng không có đoạn code nào đặt phiên này. | TBD | test | S19 results-screen.tsx:262-292, S19 results-screen.tsx:344-348, S10:390-460 | 🟡 |
| FR-forecast-practice-028 | Điều kiện truy cập màn | Chỉ học viên có phiên đăng nhập và đã hoàn tất onboarding mới vào được màn; ngược lại bị chuyển về trang đăng nhập hoặc onboarding. | TBD | kiểm tra | S13 route.tsx:6-9, S13 auth-guard.ts:24-66 | ✅ |
| FR-forecast-practice-029 | Lối vào màn | Màn có mục "Đề forecast" trong thanh điều hướng, nút "Luyện đề forecast" ở khu việc hôm nay của trang chính (khi khu này trống và học viên đã có bài thi), và nút điều hướng về màn từ màn chấm. | TBD | kiểm tra | S22 apps/web/src/layouts/nav-items.ts:40-46, S22 apps/web/src/features/dashboard/components/today-tasks.tsx:26-28, S19 apps/web/src/features/scoring/scoring-screen.tsx:55-57 | ✅ |
| FR-forecast-practice-030 | Xuất và xóa dữ liệu báo gặp | Dữ liệu "báo gặp" của một học viên nằm trong gói xuất dữ liệu cá nhân và bị xóa khi xóa dữ liệu người dùng. | TBD | kiểm tra | S21:106-123 | ✅ |
| FR-forecast-practice-031 | Khóa câu hỏi ổn định giữa web và máy chủ | Khóa của mỗi câu do web sinh ra phải luôn là khóa máy chủ chấp nhận cho chủ đề đó; số bước của phiên luyện cả chủ đề không vượt quá giới hạn của máy chủ. | TBD | test | S4:81-95, S4:105-127, S7:61, S7:89-104, S11:71-103 | ✅ |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-forecast-practice-001 | performance | Danh sách đã đăng được trả một lần, không phân trang, kèm số báo của toàn bộ chủ đề khớp bộ lọc; bộ dữ liệu mẫu có 178 chủ đề. Chưa có mục tiêu thời gian. | TBD | Code không nêu mốc | S1:46-84, S2:41-52 | 🟡 |
| NFR-forecast-practice-002 | security | Báo đã gặp chủ đề yêu cầu phiên đăng nhập (mã lỗi chưa đăng nhập); xem danh sách thì không yêu cầu. | TBD | Báo khi chưa đăng nhập bị từ chối (E-001) | S1:28, S1:87, S16:15-24 | ✅ |
| NFR-forecast-practice-003 | reliability | Báo đã gặp có tính lũy đẳng: báo lặp không tạo bản ghi thứ hai và có ràng buộc duy nhất ở cơ sở dữ liệu; ghi trùng đồng thời bị bỏ qua nhưng kết quả vẫn trả "chưa báo trước đó". | TBD | Báo hai lần chỉ đếm một | S1:119-134, S5:78, S20 test:239-245 | ✅ |
| NFR-forecast-practice-004 | privacy | Báo gặp gắn với tài khoản và thuộc nhóm dữ liệu được xuất/xóa theo yêu cầu người dùng; bảng chủ đề được ghi chú là không chứa dữ liệu định danh. | TBD | Xuất/xóa bao gồm báo gặp | S21:106-123, S21:250-253 | ✅ |
| NFR-forecast-practice-005 | usability | Màn có trạng thái tải, lỗi (có thử lại) và rỗng; lưới thẻ 1/2/3 cột theo kích thước màn; nút lưu có nhãn trợ năng "Lưu chủ đề", nút luyện câu có nhãn trợ năng "Luyện câu này: …" / "Luyện lại: …". | TBD | Có đủ trạng thái | S6:196-266, S9 topic-card.tsx:36, S9 topic-detail-modal.tsx:93 | ✅ |
| NFR-forecast-practice-006 | availability | Phiên luyện đang chọn được giữ trong bộ nhớ phiên của trình duyệt (sessionStorage) nên vẫn còn sau khi tải lại trang; danh sách lưu và tiến độ thì không. | TBD | Tải lại giữ phiên luyện, mất danh sách lưu | S14 store.tsx:34-42, S14 store.tsx:66-106 | ✅ |
| NFR-forecast-practice-007 | localization | Giao diện tiếng Việt; nội dung câu hỏi hiển thị nguyên như lưu trữ. Tìm kiếm so khớp chuỗi con không chuẩn hóa dấu. | TBD | Code không nêu yêu cầu | S6:83-94 | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-forecast-practice-001 | Chỉ chủ đề ở trạng thái "đã đăng" được liệt kê, được báo gặp và được dùng để mở lượt thi. | Xem danh sách / báo gặp / mở lượt thi | FR-001, FR-023, FR-025 | S1:38, S1:101, S17:68-70 | ✅ |
| BR-forecast-practice-002 | Chủ đề được gắn nhãn "Hay gặp" khi số thí sinh báo gặp từ 200 trở lên. Chưa thấy test khẳng định đúng mốc 199/200 (test hiện chỉ dùng dữ liệu giả 412 so với 180, 198 và 175). | Ánh xạ chủ đề khi hiển thị | FR-007, FR-010, FR-014 | S7:48, S12 slice-b.test.tsx:28-80 | ✅ |
| BR-forecast-practice-003 | Nhãn "Mới" chỉ có ở chủ đề Part 2 và 3 và chỉ khi cờ mới bật; nếu chủ đề đã "Hay gặp" thì nhãn "Hay gặp" thắng, không hiện "Mới". Chủ đề Part 1 không bao giờ có nhãn "Mới". | Ánh xạ chủ đề khi hiển thị | FR-007, FR-010 | S7:48-58, S7:72-77 | ✅ |
| BR-forecast-practice-004 | Cờ chủ đề mới được đọc từ nội dung dạng đối tượng, kể cả đối tượng thiếu thẻ hoặc thiếu câu Part 3; cờ này được giữ nguyên khi quản trị sửa câu hỏi của chủ đề Part 2 (nhánh sửa chỉ áp cho Part bằng 2). | Trả danh sách / quản trị sửa nháp | FR-006 | S3:34-55, S3 test:20-25 (questions.test.ts), S2:126-158, S20:225-253 | ✅ |
| BR-forecast-practice-005 | Nội dung chủ đề không đọc được (JSON hỏng hoặc dạng lạ) được coi là không có câu hỏi và cờ mới tắt; không báo lỗi cho học viên. | Trả danh sách | FR-006 | S3:38-39, S3:59-61, S3 test:26-31 (questions.test.ts) | ✅ |
| BR-forecast-practice-006 | Nội dung Part 2 và 3 chỉ được nhận là có cấu trúc khi có đủ cả hai phần "thẻ gợi ý" và "câu Part 3"; thiếu một trong hai thì danh sách câu hỏi trả về rỗng (cờ mới vẫn được đọc nếu có). | Trả danh sách | FR-006 | S3:47-55 | ✅ |
| BR-forecast-practice-007 | "Số thí sinh báo gặp" đếm số học viên khác nhau; báo lặp của cùng một học viên không làm tăng số. | Báo gặp / trả danh sách | FR-005, FR-025 | S1:56-69, S20 test:219-267 | ✅ |
| BR-forecast-practice-008 | Chủ đề Part 1 hiển thị mỗi phần tử của danh sách là một câu, khóa dạng "mã chủ đề, gạch nối, thứ tự từ 0"; nhóm hiển thị "Part 1". | Ánh xạ chủ đề khi hiển thị | FR-007, FR-031 | S7:51-66, S4:81-83 | ✅ |
| BR-forecast-practice-009 | Chủ đề Part 2 và 3 có từ hai thẻ gợi ý trở lên: thẻ cuối là "phần kết" (ending), các thẻ còn lại là "điểm gợi ý" (points). Có đúng một thẻ: thẻ đó là điểm gợi ý, phần kết rỗng. Nhóm hiển thị "Part 2 & 3". | Ánh xạ chủ đề khi hiển thị | FR-007 | S7:68-71, S10:166-204, S12 state-and-data.test.ts:80-89 | ✅ |
| BR-forecast-practice-010 | Câu Part 2 lấy chính tiêu đề chủ đề làm nội dung; các câu Part 3 lấy từ danh sách Part 3 theo thứ tự, khóa dạng "mã chủ đề, p3, thứ tự từ 0"; thẻ Part 2 có khóa "mã chủ đề, c". | Ánh xạ chủ đề khi hiển thị | FR-007, FR-031 | S7:88-104, S4:85-91 | ✅ |
| BR-forecast-practice-011 | Với chủ đề không phải Part 1 mà nội dung là danh sách phẳng không có tiền tố, danh sách đó được coi toàn bộ là thẻ gợi ý và không có câu Part 3; máy chủ chỉ chấp nhận khóa thẻ gợi ý cho chủ đề này. | Ánh xạ chủ đề / kiểm tra khóa | FR-007, FR-031 | S4:44-55, S4:115-120, S4 test:115-125 (forecast-keys.test.ts) | ✅ |
| BR-forecast-practice-012 | Nội dung dạng danh sách cũ có tiền tố "[Cue] " (thẻ gợi ý) và "[Part 3] " (câu Part 3) vẫn được đọc đúng ở web và ở bước kiểm tra khóa; phần tử không tiền tố trong danh sách có tiền tố được coi là thẻ gợi ý. Máy chủ trả danh sách này nguyên trạng, việc tách tiền tố làm ở web. | Ánh xạ chủ đề / kiểm tra khóa | FR-006, FR-007, FR-031 | S4:23-24, S4:48-67, S3:9-12, S3:28-33, S4 test:31-43,127-136 (forecast-keys.test.ts) | ✅ |
| BR-forecast-practice-013 | Quy tắc khóa: Part 1 "mã, thứ tự"; thẻ Part 2 "mã, c"; Part 3 "mã, p3, thứ tự"; câu nối tiếp thêm hậu tố "-f". Khóa của web phải là tập con khóa hợp lệ của máy chủ và số bước phiên cả chủ đề không quá min(số khóa hợp lệ, 18). | Luyện cả chủ đề / mở lượt thi | FR-031 | S4:9-14, S4:81-95, S4:105-127, S11:71-103, S25:5, S25:32 | ✅ |
| BR-forecast-practice-014 | Mỗi học viên chỉ có tối đa một bản ghi báo gặp cho mỗi chủ đề (ràng buộc duy nhất). | Báo gặp | FR-025 | S5:78, S5 migration.sql:35 | ✅ |
| BR-forecast-practice-015 | Báo gặp lần hai của cùng học viên cho cùng chủ đề trả thành công với cờ "đã báo trước đó" và không ghi thêm. | Báo gặp | FR-025 | S1:108-122, S20 test:239-245 | ✅ |
| BR-forecast-practice-016 | Ghi chú khi báo gặp là tùy chọn, bỏ trống thì không lưu ghi chú (giá trị rỗng/null); code không giới hạn độ dài ghi chú. | Báo gặp | FR-025 | S1:92, S1:130 | ✅ |
| BR-forecast-practice-017 | Không báo gặp được chủ đề không tồn tại hoặc chưa đăng. | Báo gặp | FR-025 | S1:101-105, S20 test:281-295 | ✅ |
| BR-forecast-practice-018 | Khi chủ đề hoặc tài khoản bị xóa, các báo gặp liên quan bị xóa theo. | Xóa chủ đề / xóa người dùng | FR-030 | S5:66-71, S5 migration.sql:7-8 | ✅ |
| BR-forecast-practice-019 | Tìm kiếm không phân biệt hoa thường, khớp chuỗi con trên: tiêu đề, nhóm hiển thị, nội dung câu hỏi, các điểm gợi ý và phần kết của thẻ. Ô trống thì không lọc. | Gõ vào ô tìm | FR-011 | S6:83-94 | ✅ |
| BR-forecast-practice-020 | Quý hiển thị là hằng số "2026-Q3" với nhãn "Quý 3/2026", khoảng "Tháng 9 – Tháng 12", ngày cập nhật "26/10/2026"; test ghim đúng các giá trị này. | Mở màn | FR-002, FR-008 | S8:8-13, S12 state-and-data.test.ts:45-52 | ✅ |
| BR-forecast-practice-021 | Vào màn cần phiên đăng nhập và đã hoàn tất onboarding; nếu truy vấn hồ sơ lỗi mạng/máy chủ không dự kiến thì cho vào (fail-open). | Mở màn | FR-028 | S13 route.tsx:6-9, S13 auth-guard.ts:41-70 | ✅ |
| BR-forecast-practice-022 | Chỉ chế độ thi, giọng đọc, phiên luyện đang chọn và công việc chấm được giữ ở bộ nhớ phiên trình duyệt; danh sách lưu, band đã luyện và lịch sử luyện từng câu không được giữ (mất khi tải lại). | Tải lại trang | FR-016, FR-017 | S14 store.tsx:58-66, S14 store.tsx:94-106 | ✅ |
| BR-forecast-practice-023 | Không có đoạn code nào ghi "band đã luyện" theo chủ đề hay theo câu vào trạng thái; chỉ có khởi tạo rỗng. Hệ quả: "Chưa luyện" khớp mọi chủ đề, độ phủ luôn 0, không có band trên thẻ/chi tiết. | Mở màn | FR-017, FR-018, FR-019 | S14 initial-state.ts:16-17 (negative-search trong reverse-gaps.md) | 🟡 |
| BR-forecast-practice-024 | "Chưa luyện" = chủ đề chưa có band đã luyện; "Đã lưu" = chủ đề nằm trong danh sách lưu; "Hay gặp" = nhãn hot; "Mới trong quý" = nhãn new. | Chọn bộ lọc | FR-010 | S6:68-82 | ✅ |
| BR-forecast-practice-025 | Gợi ý luyện tiếp chọn chủ đề chưa luyện có số báo cao nhất; khi còn chủ đề nhưng không còn chủ đề chưa luyện thì hiện "Bạn đã phủ hết đề quý này!"; khi danh sách rỗng hoặc đang lỗi/tải thì không hiện lời chúc. | Mở màn | FR-019 | S6:58-63, S6:173-181 | ✅ |
| BR-forecast-practice-026 | Bốc ngẫu nhiên chỉ mở chi tiết chủ đề, không tự bắt đầu luyện; ưu tiên nhóm "Hay gặp" chưa luyện, nếu nhóm rỗng thì chọn trong mọi chủ đề. | Bấm nút bốc | FR-020 | S6:128-133 | ✅ |
| BR-forecast-practice-027 | Độ phủ: số chủ đề đã luyện trên tổng; tiến độ mỗi Part tối đa 100 phần trăm (0 nếu Part không có chủ đề). Khi học viên có ngày thi và còn chủ đề chưa luyện, gợi ý số chủ đề mỗi ngày là phần nguyên làm tròn lên của (số còn lại chia số ngày còn lại, với số ngày tối thiểu 1), tối thiểu 1. Số ngày còn lại làm tròn lên và không âm (0 nếu đã qua ngày thi). | Hiển thị khung độ phủ | FR-018 | S9 coverage-banner.tsx:11-13, S9 coverage-banner.tsx:25, S9 coverage-banner.tsx:41-44, S22 apps/web/src/lib/format.ts:8-11 | ✅ |
| BR-forecast-practice-028 | Luyện cả chủ đề đưa toàn bộ câu của chủ đề vào phiên (Part 1: mọi câu; Part 2 và 3: thẻ Part 2 và mọi câu Part 3), không kèm đáp án mẫu. | Bấm "Luyện chủ đề này" | FR-021 | S6:100-103, S10:206-243 | ✅ |
| BR-forecast-practice-029 | Luyện từng câu đưa đúng một câu vào phiên, xóa thẻ gợi ý khỏi câu đó, lưu mã câu đang luyện và danh sách câu cả chủ đề. Thẻ Part 2 không có nút luyện riêng. | Bấm "Luyện câu này" | FR-022 | S6:105-121, S9 topic-detail-modal.tsx:59-64, S10:286-313 | ✅ |
| BR-forecast-practice-030 | Chế độ lượt thi suy từ phiên luyện: luyện từng câu thì Part 3 nếu câu thuộc Part 3, ngược lại Part 1; luyện cả chủ đề thì Part 1 cho chủ đề Part 1, và "Part 2" cho chủ đề Part 2 và 3 (dù phiên có cả câu Part 3). | Vào phòng thi | FR-023 | S18 use-exam-session.ts:83-97, S10:315-368 | ✅ |
| BR-forecast-practice-031 | Máy chủ chỉ mở lượt thi có chủ đề khi chủ đề tồn tại và đã đăng; nếu có khóa câu thì khóa phải nằm trong tập khóa hợp lệ của chủ đề (kể cả câu nối tiếp). Có khóa mà thiếu chủ đề bị từ chối ngay ở bước kiểm tra dữ liệu vào. | Mở lượt thi | FR-023 | S17:26-35, S17:61-86 | ✅ |
| BR-forecast-practice-032 | Mở lượt thi chỉ cho phép khi cổng pilot mở (biến môi trường LAUNCH_OPEN bằng "true") hoặc email học viên nằm trong LAUNCH_ALLOWED_EMAILS (so khớp không phân biệt hoa thường); ngược lại bị từ chối. Quy tắc thuộc mock-exam nhưng quyết định học viên có luyện được hay không. | Mở lượt thi | FR-023 | S17:43-56 | ✅ |
| BR-forecast-practice-033 | Nộp bài trong phiên luyện (khi đã có lượt thi trên máy chủ) không nộp tại phòng thi mà chuyển sang màn chấm với việc "chưa nộp"; màn chấm tự nộp và có thể thử lại nếu lỗi. Khi chưa có lượt thi trên máy chủ, màn chấm nhận trạng thái chỉ lưu cục bộ. | Bấm nộp | FR-024 | S18 exam-screen.tsx:131-148 | ✅ |
| BR-forecast-practice-034 | Thoát phòng thi khi đang trong phiên luyện thì xóa phiên và về màn forecast (không về màn chọn thi). | Thoát phòng thi | FR-024 | S18 exam-screen.tsx:178-184, S12 slice-c.test.tsx:312-328 | ✅ |
| BR-forecast-practice-035 | Khi màn chấm nhận bài luyện, phiên luyện bị xóa khỏi trạng thái để lần vào sau không lặp lại. | Vào màn chấm | FR-024 | S19 scoring-screen.tsx:31-37, S10:370-388 | ✅ |
| BR-forecast-practice-036 | Dòng "Có thể có câu hỏi nối tiếp tùy câu trả lời" chỉ hiện khi câu có thông tin câu nối tiếp; việc ánh xạ từ dữ liệu máy chủ không gán thông tin này nên dòng này có vẻ không hiện với dữ liệu thật (negative-search N7, OQ-15). | Xem chi tiết | FR-015 | S9 topic-detail-modal.tsx:108-111, S7:38-105 (không có followUp) | 🟡 |
| BR-forecast-practice-037 | Mở lại chủ đề: khi có mã chủ đề cần mở lại và danh sách đã tải, nếu khớp một chủ đề thì chuyển sang tab Part của chủ đề và mở chi tiết; mã luôn được xóa sau khi xử lý, kể cả khi không khớp chủ đề nào. | Quay về màn forecast | FR-026 | S6:40-49, S10:462-472 | ✅ |
| BR-forecast-practice-038 | Nút "Quay lại chủ đề" và "Luyện câu kế tiếp" chỉ hiện khi đang xem đúng bài vừa luyện từng câu (mã bài khớp phiên cuối, hoặc là bài mới nhất khi xem "mới nhất"); câu kế là câu đầu tiên sau câu hiện tại không phải thẻ gợi ý; không có câu kế thì ẩn nút "câu kế tiếp". | Mở trang kết quả | FR-026, FR-027 | S19 results-screen.tsx:262-292, S19 results-screen.tsx:344-361, S10:390-460 | ✅ |
| BR-forecast-practice-039 | Thông tin "Gặp gần nhất"/"Gặp …" của mọi chủ đề lấy từ API đều là chữ "Gần đây" cố định, không phải ngày thật. | Ánh xạ chủ đề khi hiển thị | FR-014, FR-015 | S7:59, S7:86 | ✅ |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-forecast-practice-001 | Chưa đăng nhập khi báo gặp | Gọi báo gặp không có phiên. Mã lỗi UNAUTHORIZED, câu: "Authentication required" | major | FR-025 | Chưa thấy màn gọi chức năng này (negative-search N1, OQ-4) | Đăng nhập rồi báo lại | S16:15-24 | ✅ |
| E-forecast-practice-002 | Chủ đề báo gặp không tồn tại hoặc chưa đăng | Báo gặp với mã chủ đề không có hoặc chủ đề không ở trạng thái đã đăng. Mã lỗi NOT_FOUND, câu: "Published forecast topic not found" | minor | FR-025 | Chưa thấy màn gọi chức năng này (negative-search N1, OQ-4) | Chọn chủ đề đã đăng | S1:101-105, S20 test:281-295 | ✅ |
| E-forecast-practice-003 | Part lọc ngoài khoảng cho phép | Gửi Part không phải số nguyên 1 đến 3. Lỗi kiểm tra dữ liệu vào (mã BAD_REQUEST do thư viện kiểm tra sinh ra); ⚠️ chưa resolve câu chữ thật | minor | FR-003 | Web không gửi Part nên không gặp ở UI | Sửa tham số | S1:33 | ✅ |
| E-forecast-practice-004 | Dữ liệu báo gặp sai kiểu | Thiếu mã chủ đề, mã chủ đề hoặc ghi chú không phải chuỗi. Lỗi kiểm tra dữ liệu vào; ⚠️ chưa resolve câu chữ thật | minor | FR-025 | Chưa thấy màn gọi chức năng này (negative-search N1, OQ-4) | Sửa tham số | S1:89-92 | ✅ |
| E-forecast-practice-005 | Không tải được danh sách đề | Truy vấn danh sách thất bại. Màn hiện tiêu đề "Không thể tải danh sách đề forecast", dòng chi tiết là câu lỗi trả về hoặc "Lỗi kết nối máy chủ", nút "Thử lại" | major | FR-013 | Trạng thái lỗi của màn (thay lưới thẻ; khung độ phủ vẫn hiện) | Bấm "Thử lại" để tải lại | S6:213-224, S12 slice-b.test.tsx:186-202 | ✅ |
| E-forecast-practice-006 | Không có chủ đề khớp bộ lọc | Danh sách sau lọc rỗng. Tiêu đề "Không có chủ đề nào khớp bộ lọc." với mô tả "Thử chọn bộ lọc khác hoặc chuyển sang tab Part khác." | minor | FR-013 | Trạng thái rỗng | Bấm "Xem tất cả chủ đề" (xóa lọc và tìm) | S6:242-266, S12 slice-b.test.tsx:217-226 | ✅ |
| E-forecast-practice-007 | Không tìm thấy kết quả tìm kiếm | Ô tìm có từ khóa và danh sách rỗng. Mô tả: `Không tìm thấy chủ đề nào cho "<từ khóa>". Thử tìm kiếm với từ khóa khác.` | minor | FR-011, FR-013 | Trạng thái rỗng | Đổi từ khóa hoặc "Xem tất cả chủ đề" | S6:253-257 | ✅ |
| E-forecast-practice-008 | Chưa lưu chủ đề nào | Bộ lọc "Đã lưu" mà danh sách lưu rỗng. Tiêu đề "Chưa có chủ đề nào được lưu", mô tả "Bấm biểu tượng đánh dấu trên các thẻ chủ đề để lưu lại và ôn tập sau." | minor | FR-013, FR-016 | Trạng thái rỗng | Lưu chủ đề hoặc đổi bộ lọc | S6:246-255 | ✅ |
| E-forecast-practice-009 | Máy chủ chưa có chủ đề nào cho quý | Danh sách trả rỗng. Không có thông báo riêng; màn dùng chung câu rỗng của bộ lọc (E-006) | minor | FR-013 | Trạng thái rỗng, nút luyện ngẫu nhiên vô hiệu | Chờ quản trị đăng chủ đề | S1:52-54, S6:141, S6:242-266 | 🟡 |
| E-forecast-practice-010 | Mở lượt thi bị chặn bởi cổng pilot | Học viên không thuộc danh sách thử nghiệm khi cổng đóng. Mã lỗi FORBIDDEN, câu: "Mock exam is currently restricted to pilot candidates." Phòng thi bắt lỗi và tiếp tục ở chế độ không có lượt trên máy chủ (không hiện câu lỗi này cho học viên) | major | FR-023 | Phòng thi (bài chạy không lưu máy chủ) | Liên hệ để được vào danh sách thử nghiệm | S17:46-56, S18 use-exam-session.ts:170-174 | ✅ |
| E-forecast-practice-011 | Chủ đề luyện không tồn tại hoặc chưa đăng | Mở lượt thi với mã chủ đề không có hoặc không ở trạng thái đã đăng. Mã lỗi BAD_REQUEST, câu: "Unknown or unpublished forecast topic" | major | FR-023 | Phòng thi (bắt lỗi như E-010) | Quay về danh sách chọn chủ đề khác | S17:61-76 | ✅ |
| E-forecast-practice-012 | Khóa câu hỏi không thuộc chủ đề | Mở lượt thi với khóa không nằm trong tập khóa hợp lệ. Mã lỗi BAD_REQUEST, câu: "Invalid questionKey for topic" | major | FR-023, FR-031 | Phòng thi (bắt lỗi như E-010) | Chọn lại câu từ chủ đề | S17:77-86 | ✅ |
| E-forecast-practice-013 | Khóa hoặc mã chủ đề sai định dạng / khóa không kèm chủ đề | Mở lượt thi với mã chủ đề, khóa sai định dạng hoặc có khóa mà không có mã chủ đề. Mã lỗi BAD_REQUEST do kiểm tra dữ liệu vào, các câu: "Invalid topicId format", "Invalid questionKey format", "questionKey requires topicId" | major | FR-023 | Phòng thi (bắt lỗi như E-010) | Sửa tham số | S17:26-35 | ✅ |
| E-forecast-practice-014 | Nội dung chủ đề hỏng | Nội dung câu hỏi lưu sai định dạng. Không báo lỗi: danh sách trả chủ đề với 0 câu và thẻ hiện "0 câu" | minor | FR-006 | Thẻ chủ đề không có câu | Quản trị sửa nội dung | S3:59-61, S9 topic-card.tsx:49 | 🟡 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-forecast-practice-01 | Học viên luyện đúng chủ đề có khả năng gặp trong quý và thấy độ phủ đề (nguyên văn Outcome của plan) | Code không có chỉ số hay sự kiện đo | Code không nêu | S23 plan.md (Outcome) | 🟡 |
| SC-forecast-practice-02 | "Số thí sinh báo đã gặp" chỉ đếm báo cáo thật từ học viên (ràng buộc ghi trong plan) | Số học viên khác nhau trong bảng báo gặp | Code không nêu ngưỡng "đủ tin cậy"; ngưỡng "Hay gặp" là 200 | S1:56-69, S7:48, S23 | 🟡 |
| SC-forecast-practice-03 | Học viên bắt đầu luyện được từ danh sách chủ đề (outcome suy luận từ hành vi) | Test: phiên luyện được tạo và chuyển sang phòng thi cho chủ đề Part 1, Part 2 và 3, từng câu | Test pass (mốc do test, không phải mốc nghiệp vụ đã duyệt) | S10:138-313 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/forecast-practice-reverse-erd.md`)

- **Chủ đề dự đoán**: tiêu đề, quý, Part (1 đến 3, mặc định 1), nội dung câu hỏi (JSON), trạng thái (nháp / đã đăng / lưu trữ, mặc định nháp), người duyệt và thời điểm duyệt. ✅ [S5:6-36]
- **Báo gặp chủ đề**: chủ đề, học viên, ghi chú tùy chọn, thời điểm; duy nhất theo cặp học viên-chủ đề. ✅ [S5:60-82]
- **Nguồn của chủ đề**: loại nguồn (tự soạn / học viên / web), đường dẫn, nội dung thô; dùng cho quản trị (`forecast-curation`), học viên không thấy. ✅ [S5:38-58]
- **Lượt thi gắn chủ đề**: lượt thi có thể mang mã chủ đề và khóa câu (không có khóa ngoại tới chủ đề). ✅ [packages/db/src/schema/attempt.ts:22-23, S17:97-112]
- **Phiên luyện / danh sách lưu / tiến độ đã luyện** (phía trình duyệt, không phải bảng): phiên luyện giữ ở sessionStorage; danh sách lưu và band đã luyện chỉ ở bộ nhớ. ✅ [S14]

## 9. Flows (tóm tắt — chi tiết ở `srs/forecast-practice-reverse-flows.md`)

1. **Xem, lọc và tìm chủ đề**: web xin danh sách đã đăng của quý cố định, sắp theo số báo, lọc theo Part/bộ lọc/ô tìm; trạng thái tải-lỗi-rỗng. ✅ [S6]
2. **Xem chi tiết và lưu chủ đề**: mở chi tiết từ thẻ hoặc từ "bốc ngẫu nhiên"; lưu/bỏ lưu trong bộ nhớ phiên. ✅ [S6, S9]
3. **Luyện chủ đề hoặc từng câu**: tạo phiên luyện, sang phòng thi, mở lượt thi có chủ đề (máy chủ kiểm tra), nộp sang màn chấm hoặc thoát về forecast. ✅ [S6, S17, S18]
4. **Báo đã gặp chủ đề**: chỉ có ở máy chủ, lũy đẳng, không có điểm gọi từ web. ✅ [S1] · 🟡 [OQ-4]
5. **Quay lại chủ đề / luyện câu kế sau kết quả**: có code và test nhưng phiên cuối không bao giờ được đặt. 🟡 [S19, OQ-10]

## 10. Screens (tóm tắt)

- **SCR-01 Màn "Luyện theo đề dự đoán"** (đường dẫn `/app/forecast`): đầu trang (tiêu đề, nút bốc ngẫu nhiên), khung độ phủ, thẻ gợi ý, thanh công cụ (tab Part, ô tìm, năm bộ lọc), lưới thẻ chủ đề, các trạng thái tải/lỗi/rỗng. ✅ [S6, S13 apps/web/src/routes/_proto/app/forecast.tsx:5-7]
- **SCR-02 Cửa sổ chi tiết chủ đề**: nhãn, tiêu đề, số báo, "Gặp gần nhất", thẻ gợi ý Part 2, danh sách câu với nút luyện từng câu, ghi chú, nút lưu và luyện cả chủ đề. ✅ [S9 topic-detail-modal.tsx]
- Màn phòng thi, chấm và kết quả là của feature khác; chỉ là điểm đến của FR-021..027. ✅ [S18, S19]

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Cơ chế áp đặt (đọc từ code, không phải bên sở hữu) | Nguồn | Nhãn |
|-----------|------------------------------------------------------|-------|------|
| Quý hiển thị cố định là "2026-Q3"; đổi quý cần sửa code và test | Hằng số trong web | S8:8-13, S12 state-and-data.test.ts:45-52 | ✅ |
| Mỗi học viên một báo gặp cho mỗi chủ đề | Ràng buộc duy nhất ở cơ sở dữ liệu | S5:78 | ✅ |
| Số bước phiên cả chủ đề không quá 18 hoặc số khóa hợp lệ, lấy giá trị nhỏ hơn | Hằng số giới hạn số câu trả lời của lượt thi chủ đề; test đối chiếu seed | S25:5, S25:32, S11:97-103 | ✅ |
| Mở lượt thi cần cổng pilot mở hoặc email được phép | Cấu hình môi trường (tên biến LAUNCH_OPEN, LAUNCH_ALLOWED_EMAILS) | S17:43-56 | ✅ |
| Danh sách đã đăng không yêu cầu đăng nhập ở API, nhưng màn web yêu cầu | API và route guard | S1:28, S13 | ✅ |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner (suy luận từ vị trí code, chưa có xác nhận về bên sở hữu) | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Chủ đề đã đăng (quản trị soạn, duyệt, đăng) | `forecast-curation` | Không có gì để hiển thị; bộ seed trong repo có 178 chủ đề quý 2026-Q3 từ nguồn web, chưa xác nhận đã áp vào môi trường thật (OQ-18) | S20:276-325, S2:41-52, S2:97-106, S24 | 🟡 |
| Mở lượt thi, ghi âm, nộp bài | `mock-exam` | Không luyện được | S17:23-125, S18 | 🟡 |
| Chấm điểm và hiển thị kết quả | `scoring-results` | Không có kết quả sau luyện | S18 exam-screen.tsx:131-139, S19 | 🟡 |
| Hồ sơ học viên (ngày thi, band mục tiêu) và onboarding | `onboarding` | Khung độ phủ không có gợi ý mỗi ngày; không vào được màn | S14 use-profile-hydration.ts:70-77, S13 | 🟡 |
| Nguồn ghi tiến độ đã luyện (band theo chủ đề / câu) | Chưa có chủ sở hữu trong code | Độ phủ, "Chưa luyện", band trên thẻ không hoạt động thật | S14 initial-state.ts:16-17 | 🟡 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Chủ đề đã đăng đã được duyệt đúng chất lượng bởi quản trị | Nội dung luyện sai thì kết quả chấm lệch | S20:276-325 | 🟡 |
| Số thí sinh báo gặp phản ánh báo cáo thật; hiện không có đường báo từ web nên số này phụ thuộc kênh khác | Nhãn "Hay gặp", thứ tự gợi ý và bốc ngẫu nhiên mất ý nghĩa nếu số luôn gần 0 | S1:56-69, S7:48 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây chỉ trích các OQ blocking.

- [ ] OQ-1: Trạng thái thật của feature: roadmap ghi chưa làm nhưng code đã có màn và API; coi là đã hoàn thành, một phần hay bản nháp?
- [ ] OQ-2: Tiến độ đã luyện (band theo chủ đề và theo câu, độ phủ) lấy từ đâu? Hiện không có chỗ ghi nên độ phủ và "Chưa luyện" không hoạt động thật.
- [ ] OQ-3: Danh sách ôn có phải lưu theo tài khoản (plan nói có) hay chấp nhận mất khi tải lại?
- [ ] OQ-4: "Báo gặp chủ đề" được học viên dùng bằng cách nào khi web không có nút? Có cần chức năng "báo lỗi nội dung đề" tách riêng không?
- [ ] OQ-8: Ai được luyện forecast (miễn phí, gói trả phí, hạn mức)? Hiện chỉ có cổng pilot.
- [ ] OQ-10: Sau kết quả, "Luyện câu kế tiếp" và "Quay lại chủ đề" có được kích hoạt ở đâu không (phiên cuối không bao giờ được đặt)?
- [ ] OQ-18: Bộ seed 178 chủ đề quý 2026-Q3 trong repo đã được áp vào môi trường thật chưa, và số báo gặp thật hiện là bao nhiêu? Nếu chưa thì danh sách học viên thấy khác mô tả ở đây.
