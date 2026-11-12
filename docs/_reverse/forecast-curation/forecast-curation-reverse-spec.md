---
type: reverse-srs
feature: forecast-curation
status: draft
updated: 2026-11-11
confidence_summary: "✅85 🔵2 🟡24"
links:
  - reverse-sources.md
  - reverse-gaps.md
  - _evidence.md
  - srs/forecast-curation-reverse-flows.md
  - srs/forecast-curation-reverse-states.md
  - srs/forecast-curation-reverse-erd.md
  - usecases/forecast-curation-reverse-usecase-index.md
---

# forecast-curation — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập từ code, **CHƯA duyệt**). Nhãn: ✅ chắc chắn (code/test active khẳng định) · 🔵 suy đoán (>=2 chỗ code hậu thuẫn) · 🟡 cần xác nhận (code không nói).

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái tài liệu:** draft, CHƯA duyệt. Mọi nội dung sinh từ source code + test; không có đầu vào từ PO/BA.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md) (S1..S20).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Cách đếm `confidence_summary`:** đếm nhãn ở cột cuối (cột "Nhãn") của các bảng Mục 2, 3, 4, 5, 6, 7, 10, 11. Nhãn inline ở prose Mục 1 và Mục 9 không tính.
- **Audit độc lập:** đã chạy 2026-11-11, hạ 12 claim, sửa 17 cite.
- **Quy ước cố định:** Priority (P0/P1/P2) luôn là TBD vì code không nói mức ưu tiên (🟡, OQ-1). Severity ở Error Matrix là đề xuất của người tái lập (🟡), chỉ trigger/wording mới là fact.
- **Test:** không chạy test. Hành vi lấy từ test = test active đọc được; không có `it.skip` / `it.todo` nào trong các file test của feature (đã đọc S2, S4, S9).

### 0.3 Khác biệt với tài liệu chính

Feature có tài liệu vận hành [`docs/runbooks/forecast-update.md`](../../runbooks/forecast-update.md) (S14) và dòng roadmap (S19). Các điểm lệch (chi tiết ở `reverse-gaps.md` mục 3):

| Điểm | Reverse nói (từ nguồn) | Doc chính nói | Đề xuất |
|------|------------------------|---------------|---------|
| Cách gộp trùng | Gộp theo độ giống token (Jaccard) trong cùng quý + part, không gọi mô hình AI nào [S3: packages/api/src/forecast/dedupe.ts:174] | Runbook: "AI thực hiện đối sánh ngữ nghĩa" [S14: docs/runbooks/forecast-update.md:33] | `/gap` (OQ-3) |
| Viết lại câu hỏi web | Chỉ viết IN HOA từ hỏi đầu câu (What thành WHAT) và đổi "describe" đầu tiêu đề thành "Describe", không diễn đạt lại [S3: packages/api/src/forecast/dedupe.ts:217-223] | Runbook: "viết lại hoàn toàn, không sao chép nguyên văn" [S14: docs/runbooks/forecast-update.md:59-61] | `/gap` (OQ-4) |
| Số quý trong năm | Màn quản trị có 4 quý 2026-Q1..Q4 [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:278-281] | Runbook mô tả 3 đợt/quý 1-3 mỗi năm [S14: docs/runbooks/forecast-update.md:10-18] | `/cr` (OQ-5) |
| Nguồn "học viên báo" | Báo cáo học viên ghi ở bảng riêng, không tự tạo nguồn của bản nháp [S15: packages/api/src/routers/forecast.ts:87-133] | Runbook coi là một trong 3 nguồn thu thập, "hệ thống tự động ghi nhận" [S14: docs/runbooks/forecast-update.md:28] | `/gap` (OQ-6) |
| Nhập nguồn thô | Chỉ có điểm vào API, màn hình không gọi [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:73-233] | Runbook bước 2 mô tả "đưa nguồn thô vào module" không nói cách [S14: docs/runbooks/forecast-update.md:33] | `/gap` (OQ-2) |

## 1. Scope

Feature cho phép **quản trị viên** (người có email nằm trong danh sách quản trị cấu hình) chuẩn bị đề forecast IELTS Speaking theo quý: nhập đề thô từ nhiều nguồn, để hệ thống gộp đề trùng thành bản nháp, chỉnh sửa bản nháp, duyệt để xuất bản cho học viên hoặc lưu trữ, và xem danh sách đề kèm nguồn và số học viên đã báo gặp. ✅ [S1: packages/api/src/routers/forecast-admin.ts:21-438, S3: packages/api/src/forecast/dedupe.ts:124-239, S7: apps/web/src/features/admin/forecast-admin-screen.tsx:47-631]

Chi tiết phạm vi:

- Tạo bản nháp bằng tay (tiêu đề, quý, part 1-3, danh sách câu hỏi, kèm nguồn). ✅ [S1: packages/api/src/routers/forecast-admin.ts:107-193]
- Nhập hàng loạt nguồn thô và gộp thành bản nháp. ✅ [S1: packages/api/src/routers/forecast-admin.ts:368-438]
- Xem, lọc, sửa, duyệt, lưu trữ bản nháp trên màn hình quản trị. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:102-164,249-460]
- Bất biến an toàn: bản nháp mới luôn ở trạng thái nháp; không có đường tự xuất bản. ✅ [S1: packages/api/src/routers/forecast-admin.ts:162, S3: packages/api/src/forecast/dedupe.ts:233]

**Boundary (out of scope của feature này):**

- Luyện tập forecast phía học viên (xem danh sách đề đã duyệt, báo "đã gặp đề này", phân giải khóa câu hỏi cho chấm điểm) thuộc feature `forecast-practice`; chỉ nêu điểm bàn giao ở Mục 9. ✅ [S15: packages/api/src/routers/forecast.ts:27-133, S5: packages/api/src/forecast/questions.ts:79-111]
- Không có xóa vĩnh viễn đề, khôi phục đề đã lưu trữ về nháp, hay lịch sử thay đổi trong code. ✅ [S1: packages/api/src/routers/forecast-admin.ts:16-439 — không có thao tác tương ứng; negative-search trong `reverse-gaps.md`]
- Gọi mô hình AI thật để gộp/viết lại không có trong code vận hành (chỉ có giao diện cắm vào, chưa có bản cài đặt; negative-search trong `reverse-gaps.md`). ✅ [S3: packages/api/src/forecast/dedupe.ts:27-43, S1: packages/api/src/routers/forecast-admin.ts:394]
- Màn hình không có chức năng nhập hàng loạt nguồn thô. 🟡 (OQ-2) [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:73-233 và negative-search `ingestRawFeed` trong `reverse-gaps.md`]

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu (suy luận từ hành vi, trừ ca bị chặn) | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Quản trị viên (email nằm trong danh sách quản trị) | người | Chuẩn bị, chỉnh sửa, duyệt, lưu trữ đề forecast theo quý | Có | S10 packages/api/src/index.ts:31-45; S11 packages/api/src/auth-utils.ts:1-13 | 🟡 |
| Người dùng chưa đăng nhập | người | Không có quyền; bị chặn | Có (ca bị từ chối) | S10 packages/api/src/index.ts:15-22 | ✅ |
| Người dùng đã đăng nhập không phải quản trị viên (học viên) | người | Không có quyền; bị chặn, UI hiển thị "Truy cập bị từ chối" hoặc chuyển về dashboard | Có (ca bị từ chối) | S10 packages/api/src/index.ts:33-38; S8 apps/web/src/routes/admin/forecast.tsx:20-24 | ✅ |
| Hệ thống gộp trùng | hệ thống | Gộp đề thô trùng thành bản nháp, luôn ở trạng thái nháp | Có | S3 packages/api/src/forecast/dedupe.ts:124-239 | ✅ |
| Dịch vụ AI gộp/viết lại | ngoài | Gộp theo cụm và viết lại câu hỏi web nếu được cắm vào | Không rõ (chưa có bản cài đặt) | S3 packages/api/src/forecast/dedupe.ts:27-43 | 🟡 |
| Học viên (báo đã gặp đề) | người | Báo đề đã gặp; số lượng hiển thị cho quản trị viên | Không (thuộc `forecast-practice`), chỉ là nguồn số liệu | S1 packages/api/src/routers/forecast-admin.ts:65-78; S15 packages/api/src/routers/forecast.ts:87-133 | 🟡 |
| Product Owner (người sở hữu sản phẩm) | người | Là quản trị viên thực tế: màn hình ghi "Chỉ người sở hữu sản phẩm mới có quyền truy cập" | Có | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:242-244 | 🟡 |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-forecast-curation-001 | Chặn người chưa đăng nhập | Hệ thống từ chối mọi thao tác quản trị đề forecast khi không có phiên đăng nhập, trả lỗi mã UNAUTHORIZED, thông điệp "Authentication required". | TBD | test | S10 packages/api/src/index.ts:15-22 (mã và chữ lỗi); S2 packages/api/src/routers/forecast-admin.test.ts:82-88 (test chỉ khẳng định bị từ chối bằng TRPCError, không so mã/chữ) | ✅ |
| FR-forecast-curation-002 | Chỉ quản trị viên được thao tác | Hệ thống từ chối người đã đăng nhập nhưng email không nằm trong danh sách quản trị, mã FORBIDDEN, thông điệp "Admin access required". Áp dụng cho xem danh sách, tạo, sửa, duyệt, lưu trữ, nhập nguồn thô và kiểm tra quyền. | TBD | test | S10 packages/api/src/index.ts:31-38 (mã và chữ lỗi); S2 packages/api/src/routers/forecast-admin.test.ts:90-103,269-279 (test chỉ khẳng định TRPCError với xem danh sách, tạo và kiểm tra quyền) | ✅ |
| FR-forecast-curation-003 | Kiểm tra quyền khi vào màn hình | Khi vào đường dẫn quản trị đề forecast: chưa đăng nhập thì chuyển sang màn đăng nhập; đăng nhập nhưng không là quản trị viên (kiểm tra quyền lỗi bất kỳ) thì chuyển về dashboard học viên; còn lại vào màn hình. | TBD | demo | S8 apps/web/src/routes/admin/forecast.tsx:9-27 | ✅ |
| FR-forecast-curation-004 | Hiển thị màn hình từ chối truy cập | Nếu tải danh sách trả lỗi có chứa "Admin access required" hoặc "FORBIDDEN", màn hình hiển thị khối "Truy cập bị từ chối" thay cho nội dung. | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:84-90,235-247; S9 apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:154-163 | ✅ |
| FR-forecast-curation-005 | Xem danh sách bản nháp theo quý | Quản trị viên xem danh sách đề (mọi trạng thái) lọc theo quý và tùy chọn theo trạng thái, sắp xếp mới tạo trước. Màn hình luôn truyền quý đang chọn, không truyền trạng thái. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:21-63; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:78-80; S2 packages/api/src/routers/forecast-admin.test.ts:132-141 | ✅ |
| FR-forecast-curation-006 | Danh sách rỗng | Khi không có đề nào khớp truy vấn, hệ thống trả danh sách rỗng; màn hình hiển thị "Không có đề nào phù hợp với bộ lọc." | TBD | demo | S1 packages/api/src/routers/forecast-admin.ts:47-50; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:336-340 | ✅ |
| FR-forecast-curation-007 | Thông tin hiển thị cho mỗi đề | Mỗi đề hiển thị: Part, tiêu đề, nhãn trạng thái (Bản nháp / Đã duyệt / Lưu trữ), danh sách câu hỏi, số "N thí sinh báo đã gặp", các nguồn (Tự soạn / Học viên báo / Web kèm liên kết mở tab mới). | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:345-412; S9 apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:76-97 | ✅ |
| FR-forecast-curation-008 | Số học viên báo đã gặp | Mỗi đề trong danh sách kèm số học viên khác nhau đã báo gặp đề đó; một học viên báo lặp không làm tăng số. Đề chưa ai báo có số 0. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:65-78,102; S2 packages/api/src/routers/forecast-admin.test.ts:219-267 | ✅ |
| FR-forecast-curation-009 | Lọc theo trạng thái trên màn hình | Màn hình lọc đã tải theo Tất cả / Bản nháp / Đã duyệt / Lưu trữ ngay tại trình duyệt, không gọi lại máy chủ. | TBD | test | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:249-252,284-306; S9 apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:107-127 | ✅ |
| FR-forecast-curation-010 | Chọn quý và làm mới | Màn hình cho chọn một trong bốn quý 2026-Q1..2026-Q4 (mặc định 2026-Q1); đổi quý hoặc nhấn "Làm mới" thì tải lại danh sách. | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:52,96-100,273-282,309-319 | ✅ |
| FR-forecast-curation-011 | Hiển thị câu hỏi dạng nhãn | Câu hỏi của đề Part 2 lưu dạng nhóm (cue card + Part 3) được hiển thị phẳng với tiền tố "[Cue] " và "[Part 3] "; đề lưu dạng mảng hiển thị nguyên chuỗi; dữ liệu câu hỏi hỏng hoặc hình dạng khác hiển thị rỗng. | TBD | kiểm tra | S1 packages/api/src/routers/forecast-admin.ts:80-96 | ✅ |
| FR-forecast-curation-012 | Tạo bản nháp thủ công | Quản trị viên tạo bản nháp gồm tiêu đề, quý, part (1-3, mặc định 1), danh sách câu hỏi (mặc định rỗng) và tùy chọn danh sách nguồn. Bản nháp tạo ra luôn ở trạng thái nháp, chưa có người duyệt/thời gian duyệt. Hệ thống trả bản ghi vừa tạo. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:107-193; S2 packages/api/src/routers/forecast-admin.test.ts:105-142,182-195 | ✅ |
| FR-forecast-curation-013 | Phân nhóm câu hỏi Part 2 khi tạo | Với bản nháp Part 2, câu hỏi có tiền tố "[Cue] " vào nhóm cue card, tiền tố "[Part 3] " vào nhóm Part 3 (bỏ tiền tố khi lưu), câu không tiền tố vào nhóm cue card. Nếu cả hai nhóm rỗng, lưu mảng rỗng. | TBD | kiểm tra | S1 packages/api/src/routers/forecast-admin.ts:138-154 | ✅ |
| FR-forecast-curation-014 | Lưu câu hỏi Part 1 và Part 3 | Với bản nháp Part 1 hoặc Part 3, danh sách câu hỏi lưu nguyên văn dạng mảng, kể cả khi có tiền tố "[Cue] "/"[Part 3] ". | TBD | kiểm tra | S1 packages/api/src/routers/forecast-admin.ts:138,156-165 | ✅ |
| FR-forecast-curation-015 | Ghi nguồn cho bản nháp | Mỗi nguồn gửi kèm được lưu gắn với bản nháp: loại nguồn (manual / student / web), liên kết (tùy chọn), nội dung thô (tùy chọn). Loại nguồn web bắt buộc có liên kết. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:114-131,167-178; S2 packages/api/src/routers/forecast-admin.test.ts:105-142 | ✅ |
| FR-forecast-curation-016 | Chỉ nhận liên kết http/https | Liên kết nguồn phải là URL hợp lệ và bắt đầu bằng http:// hoặc https:// (không phân biệt hoa thường); `javascript:` bị từ chối. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:9-14; S2 packages/api/src/routers/forecast-admin.test.ts:144-159 | ✅ |
| FR-forecast-curation-017 | Form tạo bản nháp trên màn hình | Form "Thêm bản nháp đề mới" gồm: tiêu đề, Part (1/2/3), loại nguồn (Tự soạn / Học viên báo / Thu thập từ Web), đường dẫn nguồn web (chỉ hiện khi chọn Web), ghi chú nguồn/nội dung thô, câu hỏi mỗi dòng một câu. Quý lấy từ quý đang chọn ở màn hình. Mỗi lần tạo gửi đúng một nguồn. | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:166-233,511-628 | ✅ |
| FR-forecast-curation-018 | Kiểm tra form tạo phía màn hình | Tiêu đề rỗng (sau khi bỏ khoảng trắng) hiện "Vui lòng nhập tiêu đề cho chủ đề."; loại Web mà URL rỗng hoặc không bắt đầu http(s):// hiện "Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://)." và không gọi máy chủ. | TBD | test | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:167-176; S9 apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:165-186 | ✅ |
| FR-forecast-curation-019 | Sau khi tạo bản nháp | Sau khi tạo thành công, đề mới được chèn đầu danh sách (số báo = 0), form đóng và các ô tiêu đề, câu hỏi, URL, ghi chú, loại nguồn được xóa/đặt lại; ô Part không đặt lại. | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:200-228 | ✅ |
| FR-forecast-curation-020 | Sửa bản nháp (máy chủ) | Quản trị viên sửa tiêu đề (không rỗng), quý, part (1-3), danh sách câu hỏi của một đề theo mã. Chỉ các trường được gửi mới đổi; thời điểm cập nhật luôn đổi. Việc sửa không thay đổi trạng thái của đề. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:195-274; S2 packages/api/src/routers/forecast-admin.test.ts:161-180 | ✅ |
| FR-forecast-curation-021 | Phân nhóm câu hỏi Part 2 khi sửa | Khi sửa câu hỏi mà part đích (part mới nếu có, nếu không là part hiện tại) là 2: phân nhóm giống lúc tạo và giữ cờ "đề mới" đã lưu trước đó; nếu cả hai nhóm rỗng thì lưu mảng rỗng (mất cờ "đề mới"). Part đích khác 2 lưu mảng phẳng. | TBD | kiểm tra | S1 packages/api/src/routers/forecast-admin.ts:225-257 | ✅ |
| FR-forecast-curation-022 | Form sửa trên màn hình | Nút "Sửa" mở hộp thoại "Chỉnh sửa đề thi nháp" với tiêu đề và câu hỏi (mỗi dòng một câu, dòng trống bị bỏ, cắt khoảng trắng); "Lưu thay đổi" gửi tiêu đề và câu hỏi, không gửi quý hay part; "Hủy" đóng hộp thoại. | TBD | test | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:136-164,463-508; S9 apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:129-143 | ✅ |
| FR-forecast-curation-023 | Duyệt (xuất bản) đề | Quản trị viên duyệt một đề theo mã: trạng thái chuyển thành "published", ghi mã quản trị viên đang đăng nhập làm người duyệt và thời điểm duyệt, cập nhật thời điểm sửa. Hệ thống trả bản ghi sau duyệt. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:276-323; S2 packages/api/src/routers/forecast-admin.test.ts:182-202 | ✅ |
| FR-forecast-curation-024 | Nút Duyệt trên màn hình | Nút "Duyệt" chỉ hiện với đề có trạng thái nháp; sau khi thành công màn hình cập nhật cục bộ trạng thái thành đã duyệt và thời điểm duyệt, không cập nhật người duyệt. | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:102-119,432-441 | ✅ |
| FR-forecast-curation-025 | Lưu trữ đề | Quản trị viên lưu trữ một đề theo mã: trạng thái chuyển thành "archived", cập nhật thời điểm sửa; người duyệt/thời điểm duyệt cũ được giữ nguyên. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:325-366; S2 packages/api/src/routers/forecast-admin.test.ts:204-217 | ✅ |
| FR-forecast-curation-026 | Nút Lưu trữ trên màn hình | Nút "Lưu trữ" hiện với mọi đề chưa lưu trữ (cả nháp lẫn đã duyệt); sau khi thành công màn hình đổi nhãn thành "Lưu trữ". Nút "Sửa" hiện với mọi trạng thái. | TBD | demo | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:121-134,417-454 | ✅ |
| FR-forecast-curation-027 | Nhập nguồn thô và gộp trùng | Quản trị viên gửi danh sách nguồn thô (loại nguồn, tiêu đề thô, nội dung thô, câu hỏi, quý, part, liên kết). Hệ thống gộp các nguồn giống nhau thành các bản nháp, ghi mọi bản nháp vào kho với trạng thái nháp cùng nguồn gốc, và trả về số nguồn đã xử lý, số bản nháp tạo ra và danh sách bản nháp (mã, tiêu đề, quý, part, trạng thái). | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:368-438; S2 packages/api/src/routers/forecast-admin.test.ts:297-337 | ✅ |
| FR-forecast-curation-028 | Điều kiện đầu vào nhập nguồn thô | Mỗi nguồn thô: tiêu đề thô không rỗng, quý không rỗng, part 1-3 (mặc định 1), câu hỏi mặc định rỗng, liên kết http/https tùy chọn nhưng bắt buộc khi loại nguồn là web. Danh sách rỗng được chấp nhận (xử lý 0, tạo 0). | TBD | kiểm tra | S1 packages/api/src/routers/forecast-admin.ts:370-391,433-437; S3 packages/api/src/forecast/dedupe.ts:128-130; S4 packages/api/src/forecast/dedupe.test.ts:145-148 | ✅ |
| FR-forecast-curation-029 | Tiêu chí gộp các nguồn thô | Hai nguồn thô được gộp khi cùng quý, cùng part (thiếu part coi là 1) và độ giống token tiêu đề đạt từ 0,25 trở lên so với cụm đã có; so khớp với cụm đầu tiên đủ điều kiện. Nguồn không khớp cụm nào tạo cụm mới. | TBD | test | S3 packages/api/src/forecast/dedupe.ts:165-195; S4 packages/api/src/forecast/dedupe.test.ts:10-74 | ✅ |
| FR-forecast-curation-030 | Cách tính độ giống tiêu đề | Tiêu đề được chuẩn hóa: chữ thường, ký tự ngoài a-z, 0-9 và khoảng trắng bị thay bằng khoảng trắng, bỏ từ dưới 2 ký tự và 33 từ dừng (vd. describe, talk, about, the), quy elderly/aged/senior về "older". Độ giống = giao chia hợp của hai tập từ; tiêu đề không còn từ nào thì độ giống 0 (không bao giờ gộp). | TBD | kiểm tra | S3 packages/api/src/forecast/dedupe.ts:48-114 | ✅ |
| FR-forecast-curation-031 | Thành phần của bản nháp gộp | Bản nháp gộp lấy tiêu đề của nguồn đầu tiên trong cụm; gộp tập từ của các nguồn mới vào cụm để so khớp tiếp; câu hỏi là hợp của câu hỏi các nguồn, loại câu trùng khớp tuyệt đối; mỗi nguồn thô thành một nguồn gốc (nội dung thô thiếu thì dùng tiêu đề thô; liên kết được giữ). | TBD | test | S3 packages/api/src/forecast/dedupe.ts:181-236; S4 packages/api/src/forecast/dedupe.test.ts:62-73 | ✅ |
| FR-forecast-curation-032 | Chuẩn hóa chữ cho cụm có nguồn web | Với cụm có ít nhất một nguồn web (và không có dịch vụ AI), tiêu đề bắt đầu bằng "describe" được đổi thành "Describe " và các câu hỏi bắt đầu bằng what/why/how/when/who có từ hỏi đó bị viết IN HOA toàn bộ (vd. "What did you do" thành "WHAT did you do"); mọi câu hỏi trong cụm (kể cả từ nguồn không phải web) chịu cùng phép đổi. Nội dung câu hỏi không được diễn đạt lại. | TBD | kiểm tra | S3 packages/api/src/forecast/dedupe.ts:207-223 | ✅ |
| FR-forecast-curation-033 | Lưu câu hỏi của bản nháp nhập từ nguồn thô | Bản nháp tạo từ nhập nguồn thô lưu câu hỏi dạng mảng phẳng bất kể part (không tách cue card/Part 3). | TBD | kiểm tra | S1 packages/api/src/routers/forecast-admin.ts:400-409 | ✅ |
| FR-forecast-curation-034 | Cổng cắm dịch vụ AI | Hàm gộp trùng nhận tùy chọn một dịch vụ AI (gộp cụm hoặc viết lại câu hỏi web); khi có, kết quả AI được dùng, trạng thái luôn ép về nháp, mọi trạng thái "tiêm" bị bỏ, chỉ số nguồn ngoài phạm vi bị bỏ qua. Luồng nhập nguồn thô không truyền dịch vụ AI nào. | TBD | test | S3 packages/api/src/forecast/dedupe.ts:124-154,213-216; S4 packages/api/src/forecast/dedupe.test.ts:76-143; S1 packages/api/src/routers/forecast-admin.ts:394 | ✅ |
| FR-forecast-curation-035 | Kiểm tra quyền quản trị qua một lệnh nhẹ | Hệ thống có thao tác kiểm tra quyền trả kết quả "là quản trị viên" cho quản trị viên và báo FORBIDDEN cho người khác; màn hình dùng nó ở bước vào route. | TBD | test | S1 packages/api/src/routers/forecast-admin.ts:17-19; S2 packages/api/src/routers/forecast-admin.test.ts:269-279; S8 apps/web/src/routes/admin/forecast.tsx:16-24 | ✅ |
| FR-forecast-curation-036 | Màn hình dự phòng khi thiếu máy khách API | Nếu máy khách API không có thao tác tương ứng, màn hình vẫn cập nhật danh sách cục bộ (tạo đề giả `draft_<thời gian>`, đổi trạng thái, sửa) mà không gọi máy chủ. Nghi là nhánh dự phòng cho test/prototype. | TBD | phân tích | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:105-107,124-126,145-151,192-221 | 🟡 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-forecast-curation-001 | security | Mọi thao tác quản trị yêu cầu phiên đăng nhập và email thuộc danh sách quản trị cấu hình qua biến môi trường; danh sách trống thì không ai là quản trị viên. | TBD | Gọi không phiên: UNAUTHORIZED. Gọi bằng học viên: FORBIDDEN. | S10 packages/api/src/index.ts:31-38; S11 packages/api/src/auth-utils.test.ts:14-24 | ✅ |
| NFR-forecast-curation-002 | security | Liên kết nguồn chỉ nhận http/https để tránh liên kết thực thi script khi hiển thị. | TBD | `javascript:alert(1)` bị từ chối. | S1 packages/api/src/routers/forecast-admin.ts:9-14; S2 packages/api/src/routers/forecast-admin.test.ts:144-159 | ✅ |
| NFR-forecast-curation-003 | security | Liên kết nguồn web mở tab mới với `rel="noopener noreferrer"`. | TBD | Kiểm tra thuộc tính liên kết. | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:398-403 | ✅ |
| NFR-forecast-curation-004 | auditability | Người duyệt lấy từ phiên đăng nhập máy chủ (không nhận từ đầu vào) và thời điểm duyệt được ghi. | TBD | `reviewedBy` bằng mã quản trị viên gọi. | S1 packages/api/src/routers/forecast-admin.ts:297-308; S2 packages/api/src/routers/forecast-admin.test.ts:195-201 | ✅ |
| NFR-forecast-curation-005 | data-integrity | Không đường nào (tạo tay, nhập nguồn thô, dịch vụ AI) tạo đề ở trạng thái khác nháp. | TBD | Mọi đề mới trả về `status = draft`. | S1 packages/api/src/routers/forecast-admin.ts:162,406,429; S3 packages/api/src/forecast/dedupe.ts:150,233; S4 packages/api/src/forecast/dedupe.test.ts:113-143 | ✅ |
| NFR-forecast-curation-006 | performance | Danh sách đề không phân trang, không giới hạn số bản ghi; nguồn và số báo được tải bằng các truy vấn riêng cùng điều kiện lọc. Chưa có mục tiêu hiệu năng/độ lớn dữ liệu nào được nêu. | TBD | TBD | S1 packages/api/src/routers/forecast-admin.ts:41-73 | 🟡 |
| NFR-forecast-curation-007 | localization | Giao diện quản trị dùng tiếng Việt; thông điệp lỗi máy chủ bằng tiếng Anh và được hiển thị nguyên văn trên banner lỗi của màn hình. | TBD | Banner hiển thị đúng thông điệp lỗi trả về. | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:85-90,116-117,263-267; S1 packages/api/src/routers/forecast-admin.ts:214-215 | ✅ |
| NFR-forecast-curation-008 | data-integrity | Tạo bản nháp, ghi nguồn và nhập nguồn thô được thực hiện bằng nhiều lệnh ghi tuần tự, không bọc giao dịch; lỗi giữa chừng có thể để lại bản nháp không đủ nguồn. Có chủ ý hay không chưa rõ. | TBD | TBD | S1 packages/api/src/routers/forecast-admin.ts:156-178,398-423 | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-forecast-curation-001 | Mọi bản nháp mới (tạo tay, nhập nguồn thô, kết quả AI) có trạng thái nháp; người duyệt và thời điểm duyệt để trống. | Tạo / nhập | FR-forecast-curation-012, 027, 034 | S1 packages/api/src/routers/forecast-admin.ts:162,406; S3 packages/api/src/forecast/dedupe.ts:150,233; S2 packages/api/src/routers/forecast-admin.test.ts:189-193 | ✅ |
| BR-forecast-curation-002 | Việc duyệt là thao tác duy nhất đưa đề sang trạng thái đã duyệt; mã người duyệt lấy từ phiên của quản trị viên đang gọi. | Duyệt | FR-forecast-curation-023 | S1 packages/api/src/routers/forecast-admin.ts:298-308; S2 packages/api/src/routers/forecast-admin.test.ts:182-202 | ✅ |
| BR-forecast-curation-003 | Duyệt không kiểm tra trạng thái hiện tại: duyệt lại đề đã duyệt ghi đè người duyệt và thời điểm duyệt; duyệt đề đã lưu trữ đưa đề trở lại trạng thái đã duyệt. Giao diện chỉ hiện nút Duyệt cho đề nháp. | Duyệt | FR-forecast-curation-023, 024 | S1 packages/api/src/routers/forecast-admin.ts:283-308; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:432 | ✅ |
| BR-forecast-curation-004 | Lưu trữ không kiểm tra trạng thái hiện tại (nháp, đã duyệt, đã lưu trữ đều được) và không xóa người duyệt/thời điểm duyệt. | Lưu trữ | FR-forecast-curation-025 | S1 packages/api/src/routers/forecast-admin.ts:332-351 | ✅ |
| BR-forecast-curation-005 | Không có thao tác đưa đề về nháp hoặc bỏ lưu trữ; trạng thái chỉ chuyển qua duyệt và lưu trữ. | Mọi | FR-forecast-curation-023, 025 | S1 packages/api/src/routers/forecast-admin.ts:162,303,347,406 (4 nơi duy nhất gán trạng thái: nháp ở tạo/nhập, đã duyệt, lưu trữ) | ✅ |
| BR-forecast-curation-006 | Sửa đề được phép ở mọi trạng thái (kể cả đã duyệt, đã lưu trữ) và không đổi trạng thái; sửa đề đã duyệt thay đổi nội dung đang xuất bản mà không qua duyệt lại. | Sửa | FR-forecast-curation-020, 026 | S1 packages/api/src/routers/forecast-admin.ts:206-259; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:417-430 | ✅ |
| BR-forecast-curation-007 | Nguồn loại web bắt buộc có liên kết không rỗng; liên kết (mọi loại nguồn) phải là URL hợp lệ bắt đầu http(s)://. | Tạo / nhập | FR-forecast-curation-015, 016, 028 | S1 packages/api/src/routers/forecast-admin.ts:9-14,122-129,382-389 | ✅ |
| BR-forecast-curation-008 | Part là số nguyên 1 đến 3, mặc định 1 khi tạo tay và nhập nguồn thô; khi sửa là tùy chọn. | Tạo / sửa / nhập | FR-forecast-curation-012, 020, 028 | S1 packages/api/src/routers/forecast-admin.ts:112,201,380 | ✅ |
| BR-forecast-curation-009 | Tạo mới: tiêu đề và quý không được rỗng; sửa: tiêu đề không rỗng nhưng quý không có ràng buộc độ dài (cho phép chuỗi rỗng). Không kiểm tra định dạng quý. | Tạo / sửa | FR-forecast-curation-012, 020 | S1 packages/api/src/routers/forecast-admin.ts:110-111,199-200 | ✅ |
| BR-forecast-curation-010 | Câu hỏi Part 2 lưu thành hai nhóm (cue card, Part 3) theo tiền tố; câu hỏi Part 1 và Part 3 lưu mảng phẳng nguyên văn. | Tạo / sửa | FR-forecast-curation-013, 014, 021 | S1 packages/api/src/routers/forecast-admin.ts:138-154,225-257 | ✅ |
| BR-forecast-curation-011 | Khi sửa câu hỏi Part 2, cờ "đề mới" đã lưu được giữ; tạo mới và nhập nguồn thô không bao giờ ghi cờ này. Trong code quản trị, cờ chỉ được giữ chứ không có chỗ đặt. | Sửa | FR-forecast-curation-021 | S1 packages/api/src/routers/forecast-admin.ts:228-252; S18 packages/db/scripts/seed-forecast.ts:127 | ✅ |
| BR-forecast-curation-012 | Đổi part mà không gửi lại câu hỏi thì định dạng lưu của câu hỏi giữ nguyên (không chuyển giữa mảng phẳng và nhóm). | Sửa | FR-forecast-curation-020 | S1 packages/api/src/routers/forecast-admin.ts:222-257 | ✅ |
| BR-forecast-curation-013 | Số học viên báo đã gặp = số tài khoản học viên khác nhau đã báo đề; báo lặp không tăng số. | Xem danh sách | FR-forecast-curation-008 | S1 packages/api/src/routers/forecast-admin.ts:65-78; S2 packages/api/src/routers/forecast-admin.test.ts:238-259 | ✅ |
| BR-forecast-curation-014 | Chỉ gộp các nguồn thô cùng quý và cùng part (thiếu part coi là 1). | Nhập nguồn thô | FR-forecast-curation-029 | S3 packages/api/src/forecast/dedupe.ts:172 | ✅ |
| BR-forecast-curation-015 | Ngưỡng gộp: độ giống token tiêu đề >= 0,25 (viết bằng chữ: lớn hơn hoặc bằng một phần tư). Hằng số chưa có lý giải. | Nhập nguồn thô | FR-forecast-curation-029 | S3 packages/api/src/forecast/dedupe.ts:174 | ✅ |
| BR-forecast-curation-016 | Cụm đầu tiên đạt ngưỡng thắng (không chọn cụm giống nhất); tập từ của cụm được hợp dần nên chuỗi nguồn có thể bắc cầu vào một cụm dù hai đầu chuỗi ít giống nhau. | Nhập nguồn thô | FR-forecast-curation-029, 031 | S3 packages/api/src/forecast/dedupe.ts:171-185 | ✅ |
| BR-forecast-curation-017 | Tiêu đề không còn từ hợp lệ sau chuẩn hóa không bao giờ gộp với ai và tạo cụm riêng. | Nhập nguồn thô | FR-forecast-curation-030 | S3 packages/api/src/forecast/dedupe.ts:105,187-193 | ✅ |
| BR-forecast-curation-018 | Việc gộp chỉ so tiêu đề; nội dung câu hỏi không tham gia so khớp, và không so với các đề đã có trong kho (mỗi lần nhập luôn tạo bản nháp mới). | Nhập nguồn thô | FR-forecast-curation-027, 029 | S3 packages/api/src/forecast/dedupe.ts:168; S1 packages/api/src/routers/forecast-admin.ts:394-409 | ✅ |
| BR-forecast-curation-019 | Câu hỏi của bản nháp gộp được loại trùng tuyệt đối (so sánh chuỗi nguyên văn, phân biệt hoa thường). | Nhập nguồn thô | FR-forecast-curation-031 | S3 packages/api/src/forecast/dedupe.ts:232 | ✅ |
| BR-forecast-curation-020 | Mỗi nguồn thô trở thành một nguồn gốc của bản nháp; nội dung thô thiếu thì dùng tiêu đề thô; liên kết nguồn được giữ nguyên. | Nhập nguồn thô | FR-forecast-curation-031 | S3 packages/api/src/forecast/dedupe.ts:200-204; S4 packages/api/src/forecast/dedupe.test.ts:62-73 | ✅ |
| BR-forecast-curation-021 | Nếu dịch vụ AI gộp cụm trả kết quả: tiêu đề, quý, part, câu hỏi lấy theo AI không kiểm tra lại; trạng thái luôn nháp. Quy tắc cùng quý/cùng part không được áp cho kết quả AI. | Nhập nguồn thô (khi có AI) | FR-forecast-curation-034 | S3 packages/api/src/forecast/dedupe.ts:133-154; S4 packages/api/src/forecast/dedupe.test.ts:113-143 | ✅ |
| BR-forecast-curation-022 | Danh sách sắp xếp theo thời điểm tạo giảm dần; có thể lọc theo quý (khớp chính xác) và trạng thái. | Xem danh sách | FR-forecast-curation-005 | S1 packages/api/src/routers/forecast-admin.ts:31-45 | ✅ |
| BR-forecast-curation-023 | Chỉ đề đã duyệt hiển thị cho học viên và nhận báo cáo "đã gặp"; lưu trữ hoặc nháp thì học viên không thấy/không báo được. | Học viên xem/báo | (bàn giao Mục 9) | S15 packages/api/src/routers/forecast.ts:38,101-106; S2 packages/api/src/routers/forecast-admin.test.ts:281-295 | ✅ |
| BR-forecast-curation-024 | Quản trị viên = email người dùng khớp một mục trong danh sách cấu hình, so sánh không phân biệt hoa thường, bỏ khoảng trắng hai đầu, danh sách phân cách dấu phẩy, bỏ mục rỗng. Email rỗng hoặc danh sách rỗng thì không phải quản trị viên. | Mọi thao tác | FR-forecast-curation-002 | S11 packages/api/src/auth-utils.ts:1-13; S11 packages/api/src/auth-utils.test.ts:5-24 | ✅ |
| BR-forecast-curation-025 | Màn hình: nút Duyệt chỉ ở đề nháp; nút Lưu trữ ẩn ở đề đã lưu trữ; nút Sửa luôn hiện. | Xem danh sách | FR-forecast-curation-024, 026 | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:417-454 | ✅ |
| BR-forecast-curation-026 | Câu hỏi nguồn web phải được viết lại, không sao chép nguyên văn; nguồn web chỉ làm tín hiệu chủ đề và phải giữ URL để đối chiếu. Code chỉ nhắc ở dòng chú thích trên form và không kiểm tra/ép buộc. | Nhập nguồn web | FR-forecast-curation-015, 032 | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:582-584; S3 packages/api/src/forecast/dedupe.ts:217-223 | 🟡 |
| BR-forecast-curation-027 | Mức ưu tiên xử lý các đề khi duyệt (vd. ưu tiên đề có nhiều học viên báo) không có trong code: số báo chỉ hiển thị, không dùng sắp xếp hay điều kiện. | Duyệt | FR-forecast-curation-008 | S1 packages/api/src/routers/forecast-admin.ts:41-45,102; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:375-381 | 🟡 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-forecast-curation-001 | Chưa đăng nhập | Gọi thao tác quản trị khi không có phiên. Mã UNAUTHORIZED, thông điệp "Authentication required" | major (đề xuất) | FR-001 | Route: chuyển sang màn đăng nhập | Đăng nhập | S10 packages/api/src/index.ts:17-20; S8 apps/web/src/routes/admin/forecast.tsx:9-14 | ✅ |
| E-forecast-curation-002 | Không có quyền quản trị | Người dùng đã đăng nhập, email không thuộc danh sách. Mã FORBIDDEN, thông điệp "Admin access required" | major (đề xuất) | FR-002, 003, 004 | Route: chuyển về /app/dashboard; hoặc khối "Truy cập bị từ chối" kèm câu "Chỉ người sở hữu sản phẩm mới có quyền truy cập vào công cụ quản trị duyệt đề forecast." | Dùng tài khoản quản trị / nhờ thêm email vào danh sách cấu hình | S10 packages/api/src/index.ts:33-38; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:235-247; S8 apps/web/src/routes/admin/forecast.tsx:20-24 | ✅ |
| E-forecast-curation-003 | Không tìm thấy đề | Sửa / duyệt / lưu trữ với mã không tồn tại. Mã NOT_FOUND, thông điệp "Forecast topic not found" | minor (đề xuất) | FR-020, 023, 025 | Banner lỗi đầu trang hiển thị thông điệp | Làm mới danh sách | S1 packages/api/src/routers/forecast-admin.ts:213-216,290-293,339-342; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:263-267 | ✅ |
| E-forecast-curation-004 | Không đọc lại được bản ghi sau khi ghi | Sau tạo/sửa/duyệt/lưu trữ không đọc lại được dòng. Mã INTERNAL_SERVER_ERROR, thông điệp tương ứng: "Failed to create forecast topic", "Failed to update forecast topic", "Failed to publish forecast topic", "Failed to archive forecast topic" | critical (đề xuất) | FR-012, 020, 023, 025 | Banner lỗi (sửa/duyệt/lưu trữ) hoặc lỗi trong form tạo | Thử lại, kiểm tra dữ liệu | S1 packages/api/src/routers/forecast-admin.ts:187-190,268-271,317-320,360-363 | ✅ |
| E-forecast-curation-005 | Thiếu tiêu đề (máy chủ, tạo) | Tiêu đề rỗng khi tạo. Thông điệp "Title is required" | minor (đề xuất) | FR-012 | Lỗi trong form tạo | Nhập tiêu đề | S1 packages/api/src/routers/forecast-admin.ts:110 | ✅ |
| E-forecast-curation-006 | Thiếu quý (máy chủ, tạo) | Quý rỗng khi tạo. Thông điệp "Quarter is required" | minor (đề xuất) | FR-012 | Lỗi trong form tạo (màn hình luôn gửi quý đang chọn nên khó xảy ra từ UI) | Chọn quý | S1 packages/api/src/routers/forecast-admin.ts:111 | ✅ |
| E-forecast-curation-007 | Liên kết nguồn không phải http/https | Liên kết là URL hợp lệ nhưng sai giao thức. Thông điệp "Only HTTP/HTTPS URLs are allowed" | major (đề xuất) | FR-016 | Lỗi trong form tạo | Nhập lại liên kết | S1 packages/api/src/routers/forecast-admin.ts:12-14; S2 packages/api/src/routers/forecast-admin.test.ts:144-159 | ✅ |
| E-forecast-curation-008 | Nguồn web thiếu liên kết | Loại web nhưng liên kết thiếu/rỗng. Thông điệp "sourceUrl is required for web sources" | major (đề xuất) | FR-015, 028 | Lỗi trong form tạo | Nhập liên kết | S1 packages/api/src/routers/forecast-admin.ts:122-129,382-389 | ✅ |
| E-forecast-curation-009 | Giá trị đầu vào sai định dạng (zod mặc định) | Part ngoài 1-3 hoặc không nguyên; tiêu đề rỗng khi sửa; tiêu đề thô rỗng / quý rỗng khi nhập nguồn thô; liên kết không phải URL; loại nguồn ngoài manual/student/web. Mã lỗi xác thực đầu vào của tRPC; ⚠️ chưa resolve wording thông điệp mặc định của thư viện kiểm tra (code không tự đặt chữ) | minor (đề xuất) | FR-012, 020, 028 | Banner/lỗi form hiển thị thông điệp thô của máy chủ | Sửa dữ liệu nhập | S1 packages/api/src/routers/forecast-admin.ts:112,199,201,376,379,380 | 🟡 |
| E-forecast-curation-010 | Thiếu tiêu đề (màn hình) | Tiêu đề rỗng sau cắt khoảng trắng. Thông điệp "Vui lòng nhập tiêu đề cho chủ đề." | minor (đề xuất) | FR-018 | Khung lỗi trong hộp thoại tạo | Nhập tiêu đề | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:168-171 | ✅ |
| E-forecast-curation-011 | Nguồn web thiếu / sai URL (màn hình) | Loại Web, URL rỗng hoặc không khớp /^https?:\/\//i. Thông điệp "Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://)." | minor (đề xuất) | FR-018 | Khung lỗi trong hộp thoại tạo | Nhập URL hợp lệ | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:173-176; S9 apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:165-186 | ✅ |
| E-forecast-curation-012 | Lỗi thao tác không có thông điệp | Lỗi ném ra không phải đối tượng Error: duyệt "Duyệt đề thất bại"; lưu trữ "Lưu trữ đề thất bại"; sửa "Lưu thay đổi thất bại"; tạo "Tạo bản nháp thất bại" | minor (đề xuất) | FR-017, 022, 024, 026 | Banner lỗi đầu trang (tạo: khung lỗi hộp thoại) | Thử lại | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:116,131,161,230 | ✅ |
| E-forecast-curation-013 | Tải danh sách thất bại (không phải từ chối quyền) | Tải danh sách lỗi mà thông điệp không chứa "Admin access required" hoặc "FORBIDDEN". Hiển thị thông điệp lỗi thô | minor (đề xuất) | FR-005 | Banner lỗi đầu trang | Nhấn "Làm mới" | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:84-90 | ✅ |
| E-forecast-curation-014 | Lỗi sửa hiển thị sau hộp thoại | Lỗi khi lưu thay đổi hiển thị ở banner đầu trang, hộp thoại sửa vẫn mở và không có khung lỗi riêng | minor (đề xuất) | FR-022 | Banner ngoài hộp thoại | Sửa dữ liệu rồi lưu lại | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:160-163,263-267,463-508 | 🔵 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-forecast-curation-01 | Mọi đề đến tay học viên đều đã qua duyệt của một quản trị viên cụ thể (suy luận: chữ trên màn hình "Mọi đề phải được duyệt trước khi đăng" chỉ là mô tả, không phải mục tiêu đo được) | Tỷ lệ đề đã duyệt có người duyệt và thời điểm duyệt | 100% (suy từ bất biến; con số mục tiêu không có trong code) | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:259; S1 packages/api/src/routers/forecast-admin.ts:298-308 | 🟡 |
| SC-forecast-curation-02 | Bộ đề mỗi quý được chuẩn bị và duyệt đúng hạn | TBD | TBD (runbook nêu hạn 15 của tháng đầu mỗi đợt nhưng code không đo) | S14 docs/runbooks/forecast-update.md:10-18 | 🟡 |
| SC-forecast-curation-03 | Số học viên báo đã gặp được dùng làm tín hiệu chọn đề | TBD | TBD | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:375-381 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/forecast-curation-reverse-erd.md`)

- **Chủ đề forecast:** tiêu đề, quý, part, câu hỏi (JSON), trạng thái nháp/đã duyệt/lưu trữ, người duyệt, thời điểm duyệt, thời điểm tạo/sửa. ✅ [S12: packages/db/src/schema/forecast.ts:6-36]
- **Nguồn của chủ đề:** loại nguồn manual/student/web, liên kết, nội dung thô; xóa chủ đề thì xóa nguồn. ✅ [S12: packages/db/src/schema/forecast.ts:38-58]
- **Báo cáo của học viên:** mỗi (học viên, chủ đề) tối đa một báo cáo, ghi chú; feature này chỉ đọc để đếm. ✅ [S12: packages/db/src/schema/forecast.ts:60-82]
- Cột trạng thái chỉ ràng buộc ở tầng ứng dụng (kiểu liệt kê trong code), bản migration không có ràng buộc CHECK. ✅ [S13: packages/db/src/migrations/20261105120834_parallel_zzzax/migration.sql:21-33]

## 9. Flows (tóm tắt — chi tiết ở `srs/forecast-curation-reverse-flows.md`)

1. Vào màn hình quản trị (kiểm tra đăng nhập và quyền). ✅
2. Xem danh sách đề theo quý. ✅
3. Tạo bản nháp thủ công. ✅
4. Nhập nguồn thô và gộp trùng (điểm vào API, chưa có màn hình). ✅ / 🟡 cho phần không có UI
5. Sửa bản nháp. ✅
6. Duyệt (xuất bản). ✅
7. Lưu trữ. ✅

**Điểm bàn giao sang `forecast-practice` (chỉ nêu, không đặc tả):**

- Học viên chỉ thấy đề có trạng thái đã duyệt, lọc tùy chọn theo quý và part, kèm số học viên báo và cờ "đề mới". ✅ [S15: packages/api/src/routers/forecast.ts:38-84]
- Học viên chỉ báo "đã gặp" được đề đã duyệt; đề không tồn tại hoặc chưa duyệt báo lỗi NOT_FOUND "Published forecast topic not found". ✅ [S15: packages/api/src/routers/forecast.ts:101-106]
- Việc phân giải khóa câu hỏi cho chấm điểm đọc cột câu hỏi của đề (mảng phẳng hay nhóm cue card/Part 3), nên định dạng lưu do feature này tạo (Mục 5 BR-010, BR-011) là hợp đồng dữ liệu với `forecast-practice`. ✅ [S5: packages/api/src/forecast/questions.ts:79-111, packages/api/src/scoring/forecast-keys.ts:45-79,105-128]
- Đề Part 2 từ nhập nguồn thô lưu mảng phẳng (BR/FR-033), khác định dạng nhóm của tạo tay; phía chấm điểm đọc mảng phẳng không tiền tố của đề Part 2/3 thành toàn bộ cue card và không có câu Part 3 (`packages/api/src/scoring/forecast-keys.ts:48-55,117-120`). Mức độ hiển thị và chấm đúng của đề này phía học viên chưa xác nhận. 🟡 (OQ-8) [S5: packages/api/src/scoring/forecast-keys.ts:45-79, packages/api/src/forecast/questions.ts:79-111]
- Đề Part 3 tạo tay cũng lưu mảng phẳng (FR-014) nên cùng đi vào nhánh trên: phía học viên chỉ nhận khóa cue card, không có khóa câu Part 3. Chưa rõ đề Part 3 độc lập có được dùng không. 🟡 (OQ-21) [S1: packages/api/src/routers/forecast-admin.ts:138,156-165; S5: packages/api/src/scoring/forecast-keys.ts:105-128]

## 10. Screens (tóm tắt)

Route `/admin/forecast`, một màn hình quản trị cùng hai hộp thoại. ✅ [S8: apps/web/src/routes/admin/forecast.tsx:7-29]

| Màn / vùng | Nội dung chính | Nguồn | Nhãn |
|------------|----------------|-------|------|
| Danh sách đề (PageHead "Duyệt đề Forecast", eyebrow "Quản trị") | Chọn quý, 4 tab trạng thái, Làm mới, Thêm bản nháp, thẻ đề (Part, tiêu đề, huy hiệu trạng thái, câu hỏi, số báo, nguồn, nút Sửa/Duyệt/Lưu trữ) | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:254-460 | ✅ |
| Hộp thoại "Chỉnh sửa đề thi nháp" | Tiêu đề, câu hỏi mỗi dòng một câu, Hủy / Lưu thay đổi | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:462-508 | ✅ |
| Hộp thoại "Thêm bản nháp đề mới" | Tiêu đề, Part, nguồn, URL web, ghi chú, câu hỏi, Hủy / Tạo bản nháp | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:510-628 | ✅ |
| Khối "Truy cập bị từ chối" | Biểu tượng khiên cảnh báo + giải thích | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:235-247 | ✅ |
| Lối vào màn hình từ điều hướng | Không tìm thấy liên kết điều hướng tới `/admin/forecast` trong `apps/web/src` ngoài định nghĩa route (negative-search trong `reverse-gaps.md`) | S8 apps/web/src/routes/admin/forecast.tsx:7 | 🟡 |

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):** cột Source / Owner là suy luận của người tái lập (code không ghi chủ sở hữu), nên mọi dòng đều 🟡 dù bản thân ràng buộc đã đối chiếu code.

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Danh sách quản trị viên cấu hình qua biến môi trường `ADMIN_EMAILS` (chuỗi email phân cách dấu phẩy); thiếu biến thì mặc định rỗng và không ai là quản trị viên | Cấu hình triển khai (suy luận) | S16 apps/server/src/context.ts:19-28; S20 .github/workflows/deploy-beta.yml:84 | 🟡 |
| Dữ liệu lưu SQLite/D1; trạng thái chỉ được ép bởi tầng ứng dụng, không có CHECK trong migration | Kỹ thuật (suy luận) | S12 packages/db/src/schema/forecast.ts:16-18; S13 packages/db/src/migrations/20261105120834_parallel_zzzax/migration.sql:21-33 | 🟡 |
| Màn hình chỉ có 4 quý 2026-Q1..Q4 cố định trong mã nguồn | Mã nguồn UI (suy luận) | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:278-281 | 🟡 |
| Nguồn web không được sao chép nguyên văn (quyết định pháp lý D-04 / OQ-6 theo runbook) | Pháp lý / PO (suy luận) | S14 docs/runbooks/forecast-update.md:50-62 | 🟡 |

**Dependencies (deliverable do bên khác sở hữu):** cột Owner là suy luận từ ranh giới feature trong kế hoạch tái lập (`docs/_reverse/reverse-plan.json`), không phải từ code, nên mọi dòng đều 🟡 dù phụ thuộc kỹ thuật đã đối chiếu code.

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Phiên đăng nhập (mã và email người dùng) từ hệ thống xác thực | feature `auth-account` | Không xác định được quản trị viên và người duyệt | S10 packages/api/src/index.ts:15-45; S1 packages/api/src/routers/forecast-admin.ts:298 | 🟡 |
| Bảng người dùng (khóa ngoại người duyệt, xóa người dùng thì đặt rỗng) | feature `auth-account` | Ghi người duyệt | S12 packages/db/src/schema/forecast.ts:19-22 | 🟡 |
| Phía học viên đọc đề đã duyệt và ghi báo cáo | feature `forecast-practice` | Số báo hiển thị, đề đến tay học viên | S15 packages/api/src/routers/forecast.ts:27-133 | 🟡 |
| Dịch vụ AI gộp/viết lại (chưa có bản cài đặt trong code) | chưa rõ | Không chặn; luồng chạy bằng heuristic | S3 packages/api/src/forecast/dedupe.ts:27-43 | 🟡 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Nhập nguồn thô được người vận hành gọi trực tiếp qua API vì màn hình không có chức năng này | FR-027..033 sẽ cần Mục 10 bổ sung màn hình nhập | S7 apps/web/src/features/admin/forecast-admin-screen.tsx:73-233; S1 packages/api/src/routers/forecast-admin.ts:368 | 🟡 |
| "Mỗi quý" trong tên lô đề có dạng `YYYY-Qn` | Lọc quý khớp chính xác chuỗi nên sai định dạng làm đề không hiện | S1 packages/api/src/routers/forecast-admin.ts:32-34; S7 apps/web/src/features/admin/forecast-admin-screen.tsx:278-281 | 🔵 |
| Việc sửa đề đã duyệt (xuất bản) là chủ ý cho phép sửa nóng | BR-006 cần chặn hoặc yêu cầu duyệt lại | S1 packages/api/src/routers/forecast-admin.ts:206-259 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây chỉ trích các OQ blocking.

- [ ] OQ-1: Mức ưu tiên (P0/P1/P2) của từng FR? Code không nói.
- [ ] OQ-2: Nhập nguồn thô hàng loạt hiện chỉ có điểm vào API, không có màn hình. Người vận hành gọi bằng cách nào, và có cần màn hình không?
- [ ] OQ-3: "AI gộp trùng" có thật sự cần mô hình AI không? Code chỉ có heuristic token (ngưỡng 0,25) và router không truyền dịch vụ AI; runbook và roadmap nói AI.
- [ ] OQ-4: Câu hỏi nguồn web được "viết lại" thế nào? Code chỉ viết IN HOA từ hỏi đầu câu (What thành WHAT) và "Describe" đầu tiêu đề, áp cả cho câu từ nguồn không phải web. Đây có phải chủ ý, và có rủi ro bản quyền (D-04) nếu coi đó là đủ?
- [ ] OQ-7: Sửa đề đã duyệt/đã lưu trữ và duyệt lại đề đã lưu trữ có chủ ý cho phép không, hay thiếu kiểm tra trạng thái?
- [ ] OQ-21: Đề Part 3 (tạo tay) và đề Part 2 (nhập nguồn thô) lưu mảng phẳng; phía học viên chỉ nhận khóa cue card, không có khóa câu Part 3. Có chủ ý không, và đề Part 3 độc lập có được dùng không?
