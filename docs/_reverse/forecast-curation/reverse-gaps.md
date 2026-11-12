# forecast-curation — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Mức ưu tiên P0/P1/P2 của từng FR/NFR là gì? — *(liên quan: Mục 3, 4 · cần: PO)*
* [ ] OQ-2: Nhập nguồn thô hàng loạt chỉ có điểm vào API (`packages/api/src/routers/forecast-admin.ts:368`), màn hình `/admin/forecast` không gọi. Người vận hành thực tế gọi bằng cách nào (công cụ nào, ai), và có cần màn hình nhập không? — *(liên quan: Mục 1, 3 FR-027..033, 10 · cần: PO/dev)*
* [ ] OQ-3: Có cần gộp trùng bằng mô hình AI thật không? Code vận hành chỉ có heuristic độ giống token (ngưỡng 0,25) và không truyền dịch vụ AI (`packages/api/src/routers/forecast-admin.ts:394`); runbook/roadmap nói "AI". Ai sẽ cài dịch vụ AI (giao diện `packages/api/src/forecast/dedupe.ts:27-43`) và khi nào? — *(liên quan: Mục 0.3, 3 FR-034 · cần: PO/dev)*
* [ ] OQ-4: Quy tắc "câu hỏi nguồn web phải được viết lại" được bảo đảm thế nào? Code chỉ viết IN HOA toàn bộ từ hỏi đầu câu (What thành WHAT) và đổi "describe" đầu tiêu đề thành "Describe" (`packages/api/src/forecast/dedupe.ts:217-223`), áp cả cho câu từ nguồn không phải web; không có bước viết lại nội dung hay kiểm tra người duyệt đã viết lại. Với quyết định pháp lý D-04, mức này có đủ không? — *(liên quan: Mục 5 BR-026, 11 · cần: PO/pháp lý)*
* [ ] OQ-5: Màn hình có 4 quý cố định 2026-Q1..Q4 (`apps/web/src/features/admin/forecast-admin-screen.tsx:278-281`), runbook mô tả 3 đợt/quý trong năm. Quý định nghĩa thế nào, và năm 2027 trở đi thêm quý bằng cách nào (hiện phải sửa mã)? — *(liên quan: Mục 0.3, 3 FR-010, 11 · cần: PO/dev)*
* [ ] OQ-6: Nguồn "học viên báo" của bản nháp (loại nguồn student) và báo cáo "đã gặp" của học viên (bảng riêng, `packages/api/src/routers/forecast.ts:87-133`) là hai thứ tách rời trong code. Báo cáo học viên có nhằm tạo nguồn/bản nháp mới không (runbook nói "hệ thống tự động ghi nhận")? — *(liên quan: Mục 0.3, 2, 8 · cần: PO)*
* [ ] OQ-7: Có chủ ý cho phép: sửa đề đã duyệt mà không duyệt lại, duyệt lại đề đã duyệt (ghi đè người duyệt), duyệt đề đã lưu trữ (đưa về đã duyệt) hay không? Máy chủ không kiểm tra trạng thái hiện tại ở cả ba thao tác; giao diện chỉ che bằng nút. Ngược lại không có đường bỏ lưu trữ trên giao diện. — *(liên quan: Mục 5 BR-003..006, 11 · cần: PO)*
* [ ] OQ-8: Bản nháp tạo từ nhập nguồn thô luôn lưu mảng phẳng, kể cả Part 2 (`packages/api/src/routers/forecast-admin.ts:405`), trong khi tạo tay tách cue card/Part 3. Phía học viên hiển thị và chấm điểm đề Part 2 dạng mảng phẳng có đúng ý đồ không? — *(liên quan: Mục 9 bàn giao · cần: PO/dev `forecast-practice`)*
* [ ] OQ-9: Cờ "đề mới" (isNew) chỉ được ghi bởi script seed (`packages/db/scripts/seed-forecast.ts:127`); quản trị không có chỗ đặt hay xem cờ này, chỉ giữ khi sửa Part 2. Quản trị viên có cần đặt cờ này không? — *(liên quan: Mục 5 BR-011 · cần: PO)*
* [ ] OQ-10: Nhập nguồn thô không đối chiếu với đề đã có trong kho và không chặn nhập lặp; nhập cùng lô hai lần tạo bản nháp trùng. "Loại trùng" có phải chỉ trong một lô? — *(liên quan: Mục 5 BR-018 · cần: PO)*
* [ ] OQ-11: Việc tạo bản nháp, ghi nguồn và nhập lô không nằm trong giao dịch; lỗi giữa chừng để lại đề thiếu nguồn hoặc lô nhập dở. Chấp nhận được không? — *(liên quan: Mục 4 NFR-008 · cần: dev/PO)*
* [ ] OQ-12: Màn hình sửa chỉ đổi tiêu đề và câu hỏi (không đổi quý, part). Để tạo đề Part 2 có phần Part 3 từ màn hình phải gõ tiền tố "[Part 3] " nhưng màn hình không hướng dẫn tiền tố này. Có cần thêm hướng dẫn / trường riêng không? — *(liên quan: Mục 3 FR-013, 022 · cần: PO/UX)*
* [ ] OQ-13: Danh sách không phân trang; giới hạn số đề mỗi quý dự kiến là bao nhiêu? — *(liên quan: Mục 4 NFR-006 · cần: PO/dev)*
* [ ] OQ-14: Biến `ADMIN_EMAILS` được nạp vào ngữ cảnh (`apps/server/src/context.ts:19-28`) và truyền ở workflow beta (`.github/workflows/deploy-beta.yml:84`), nhưng file schema biến môi trường không đọc được (bị chặn). Ai quản lý danh sách và quy trình thêm/bớt quản trị viên? — *(liên quan: Mục 11 · cần: PO/devops)*
* [ ] OQ-15: Có lối vào (menu, liên kết) tới `/admin/forecast` không? Không tìm thấy trong `apps/web/src` ngoài định nghĩa route. — *(liên quan: Mục 10 · cần: PO/UX)*
* [ ] OQ-16: Nhánh dự phòng trong màn hình (khi máy khách API thiếu thao tác thì cập nhật cục bộ, tạo đề `draft_<thời gian>`) có còn cần ở môi trường thật không, hay chỉ cho test/prototype? — *(liên quan: Mục 3 FR-036 · cần: dev)*
* [ ] OQ-17: Bước vào route chuyển người dùng về `/app/dashboard` với MỌI lỗi khi kiểm tra quyền (kể cả lỗi mạng, không chỉ FORBIDDEN) và bỏ qua kiểm tra nếu máy khách thiếu thao tác (`apps/web/src/routes/admin/forecast.tsx:16-24`). Lỗi mạng gây chuyển trang có chấp nhận được? — *(liên quan: Mục 3 FR-003 · cần: dev/UX)*
* [ ] OQ-18: Quý khi sửa không có ràng buộc độ dài (cho phép rỗng) và không ai kiểm tra định dạng quý ở bất kỳ thao tác nào. Có cần ràng buộc dạng `YYYY-Qn` không? — *(liên quan: Mục 5 BR-009 · cần: PO/dev)*
* [ ] OQ-19: Màn hình không hiển thị người duyệt và thời điểm duyệt dù máy chủ trả về; sau khi duyệt chỉ cập nhật cục bộ thời điểm duyệt (người duyệt không cập nhật). Có cần hiển thị cho kiểm toán không? — *(liên quan: Mục 3 FR-024, 4 NFR-004 · cần: PO)*
* [ ] OQ-20: Giá trị 0,25 của ngưỡng gộp, danh sách 33 từ dừng và 3 từ đồng nghĩa (elderly/aged/senior) dựa trên căn cứ nào, đã thử trên dữ liệu thật chưa? — *(liên quan: Mục 5 BR-015 · cần: PO/dev)*
* [ ] OQ-21: Đề Part 3 tạo tay (`packages/api/src/routers/forecast-admin.ts:138,156-165`) và đề Part 2 nhập nguồn thô (`packages/api/src/routers/forecast-admin.ts:405`) lưu mảng phẳng không tiền tố. Phía học viên, `parseTopicQuestions` trả toàn bộ mảng này làm cue card và không có câu Part 3 (`packages/api/src/scoring/forecast-keys.ts:48-55`), nên khóa hợp lệ chỉ gồm khóa cue card (`packages/api/src/scoring/forecast-keys.ts:117-120`). Có chủ ý không, và đề Part 3 độc lập có được dùng không? — *(liên quan: Mục 9 bàn giao, FR-014, FR-033 · cần: PO/dev `forecast-practice`)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 3, 4 | Mức ưu tiên các yêu cầu | Không xếp được thứ tự kiểm thử/nghiệm thu | PO |
| Mục 7 | Mục tiêu đo lường (số đề duyệt mỗi quý, thời hạn duyệt, tỷ lệ có người báo) | Success Criteria chỉ là suy luận | PO |
| Mục 2 | Danh tính thật của quản trị viên (số người, vai trò) ngoài "Product Owner" suy từ chữ trên màn hình | Không rõ có cần phân quyền theo vai trò | PO |
| Mục 3 | Định nghĩa "đề mới" (isNew) và ai đặt | Cờ có thể không bao giờ được đặt cho đề tạo qua quản trị | PO |
| Mục 10 | Lối vào điều hướng và thiết kế màn nhập nguồn thô | Quản trị viên không thể dùng chức năng nhập lô nếu không biết gọi API | PO/UX |
| Mục 6 | Thông điệp zod mặc định của các lỗi E-forecast-curation-009 chưa resolve (thư viện sinh, không có trong code) | Không đặc tả được chữ lỗi chính xác | dev (chạy thử) |
| Mục 9 | Hành vi phía học viên với đề Part 2 mảng phẳng do nhập lô sinh ra và đề Part 3 tạo tay (OQ-8, OQ-21) | Có thể sai thứ tự câu hỏi/khóa chấm điểm | dev `forecast-practice` |

## 3. Conflicts (nguồn mâu thuẫn)

Không chọn bên. Code là nguồn fact; tài liệu chỉ ghi để BA quyết.

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| Cơ chế gộp trùng | Heuristic Jaccard trên tiêu đề, không gọi AI; router không truyền dịch vụ AI (`packages/api/src/forecast/dedupe.ts:174`, `packages/api/src/routers/forecast-admin.ts:394`) | "AI thực hiện đối sánh ngữ nghĩa giữa các đề có cùng quý và phần thi" (`docs/runbooks/forecast-update.md:33`); roadmap ghi "dedupe AI" (`docs/roadmap-work-items.md:34`) | Code là fact (high), runbook/roadmap (medium) có thể mô tả ý định |
| Viết lại câu hỏi web | Chỉ viết IN HOA từ hỏi đầu câu (What thành WHAT) và đổi "describe" đầu tiêu đề thành "Describe" (`packages/api/src/forecast/dedupe.ts:217-223`) | "Hệ thống và PO bắt buộc phải viết lại (rewrite/paraphrase) toàn bộ câu hỏi" (`docs/runbooks/forecast-update.md:59-61`) | Cùng chủ đề pháp lý D-04; code không thực thi |
| Số quý/năm | Màn hình 4 quý 2026-Q1..Q4 (`apps/web/src/features/admin/forecast-admin-screen.tsx:278-281`) | Runbook mô tả 3 đợt "Quý 1 (Tháng 1-4), Quý 2 (Tháng 5-8), Quý 3 (Tháng 9-12)" (`docs/runbooks/forecast-update.md:10-18`) | Dữ liệu seed dùng 2026-Q3 (`packages/db/scripts/seed-forecast-prod.sql:70`); chưa rõ Q4 có dùng không |
| Nguồn học viên | Báo cáo học viên ghi vào bảng báo cáo, không tạo nguồn (`packages/api/src/routers/forecast.ts:87-133`) | "Hệ thống tự động ghi nhận báo cáo ... vào bảng forecast_report" như một nguồn thu thập (`docs/runbooks/forecast-update.md:28`) | Có thể nhất quán nếu "nguồn" = tín hiệu đếm; chưa chắc |
| Nhập nguồn thô | Không có màn hình, chỉ điểm vào API | Runbook bước 2 "Đưa các nguồn thô vào module" không nói bằng cách nào (`docs/runbooks/forecast-update.md:33`) | Thiếu hướng dẫn thao tác cho PO |

## 4. Inferred assumptions (suy đoán cần verify)

* "Quản trị viên" trong thực tế là Product Owner (chữ trên màn hình "Chỉ người sở hữu sản phẩm") — *validate: hỏi PO · nếu sai: Mục 2 sai tên actor.*
* Nhập nguồn thô do dev/PO gọi API trực tiếp (🔵) — *validate: hỏi người vận hành · nếu sai: thêm UC và màn hình.*
* Cho phép sửa nóng đề đã duyệt là thiếu sót hơn là chủ ý (🟡) — *validate: PO · nếu đúng ý: bỏ OQ-7 phần sửa.*
* Cột "Mục tiêu" của actor (Mục 2) và cột Owner/Source của Mục 11 là suy luận của người tái lập, không có trong code (🟡) — *validate: hỏi PO · nếu sai: sửa mục tiêu/owner, không ảnh hưởng hành vi đã đối chiếu.*
* Cờ "đề mới" chỉ có ý nghĩa với dữ liệu seed Q3 (🟡) — *validate: PO · nếu sai: cần UI đặt cờ.*

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

- **Người gọi nhập nguồn thô (`ingestRawFeed`):** `grep -rn "ingestRawFeed" --include=*.ts --include=*.tsx --include=*.md --include=*.json .` (trừ node_modules, .turbo) → 3 hit: định nghĩa ở `packages/api/src/routers/forecast-admin.ts:368` và test ở `packages/api/src/routers/forecast-admin.test.ts:297,300`. Không có hit trong `apps/web`, không có trong runbook. → không có caller giao diện.
- **Triển khai dịch vụ AI (`AICurationClient`, `clusterAndSynthesize`, `rewriteWebQuestions`):** cùng lệnh grep. Chỉ xuất hiện ở `packages/api/src/forecast/dedupe.ts`, `packages/api/src/forecast/dedupe.test.ts` (đối tượng giả trong test). Không có bản cài đặt thật; `grep -n "OPENAI\|SCORING_MODEL" packages/api/src/forecast/*.ts` → 0 hit. Router gọi hàm gộp với một đối số (`packages/api/src/routers/forecast-admin.ts:394`).
- **Chuyển trạng thái về nháp / bỏ lưu trữ / xóa đề:** đọc toàn bộ `packages/api/src/routers/forecast-admin.ts`; chỉ có 4 chỗ ghi `status` (dòng 162, 303, 347, 406). Không có thao tác xóa đề, đưa về nháp.
- **Lối vào điều hướng `/admin/forecast`:** `grep -rn 'admin/forecast\|"/admin' apps/web/src --include=*.tsx --include=*.ts` → (loại routeTree.gen.ts) chỉ định nghĩa route trong `apps/web/src/routes/admin/forecast.tsx:7` và `apps/web/src/routes/admin/disputes.tsx:7`. Không thấy liên kết menu.
- **Nơi ghi cờ isNew:** `grep -rn "isNew" packages apps scripts --include=*.ts --include=*.tsx --include=*.sql` (trừ test/snapshot) → router quản trị chỉ giữ; ghi ở `packages/db/scripts/seed-forecast.ts` và `packages/db/scripts/seed-forecast-prod.sql`.
- **`it.skip` / `it.todo`:** đọc toàn bộ `packages/api/src/routers/forecast-admin.test.ts`, `packages/api/src/forecast/dedupe.test.ts`, `apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx` → không có.
- **Cờ tính năng (`FEATURES.*`) cho màn hình này:** `grep -n "admin" apps/web/src/lib/feature-flags.ts` → 0 hit; không có cờ tắt.
- **Test gọi hành vi chưa có:** không có test cho: sửa đề đã duyệt, duyệt lại đề đã duyệt/lưu trữ, mã không tồn tại (NOT_FOUND), lọc theo trạng thái ở máy chủ, nguồn ngoài phạm vi AI (chỉ số sai). Các hành vi này lấy từ code (✅) nhưng không có test phủ.
- **Chữ lỗi mặc định thư viện kiểm tra:** không có trong repo (không đọc node_modules).
- **File schema biến môi trường apps/server:** không đọc (hook bảo vệ).

</details>
