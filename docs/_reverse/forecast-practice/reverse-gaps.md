# forecast-practice — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Trạng thái thật của feature là gì? Roadmap ghi mục 20 là "Next" và bị khóa, plan `status: pending`, nhưng code đã có màn web đầy đủ luồng và API danh sách chạy được kèm test. — *(liên quan: Mục 0.3, Conflict C1 · cần: PO)*
* [ ] OQ-2: Tiến độ đã luyện (band theo chủ đề, band và số lần theo câu) và độ phủ lấy từ đâu? Hiện không có đoạn code nào ghi các giá trị này nên "Chưa luyện" khớp mọi chủ đề, độ phủ luôn 0, thẻ gợi ý luôn là chủ đề nhiều báo nhất. Plan nói "Độ phủ tính từ bài luyện thật". — *(liên quan: Mục 3 FR-017, FR-018, FR-019 · cần: PO/dev)*
* [ ] OQ-3: Danh sách ôn có cần lưu theo tài khoản (plan nói có) hay chấp nhận mất khi tải lại trang như hiện tại? — *(liên quan: Mục 3 FR-016, Conflict C3 · cần: PO)*
* [ ] OQ-4: Học viên "báo gặp chủ đề" bằng cách nào khi web không có nút nào? Cũng cần xác nhận cách gọi: chức năng này là "báo đã gặp chủ đề trong kỳ thi" (test dùng ghi chú "Met this topic in IDP Hanoi"), không phải "báo lỗi nội dung đề". Có cần chức năng báo lỗi nội dung đề riêng không? — *(liên quan: Mục 3 FR-025, Conflict C2 · cần: PO)*
* [ ] OQ-5: Mốc 200 thí sinh cho nhãn "Hay gặp" dựa trên đâu? 178 chủ đề trong bộ seed (`packages/db/scripts/seed-forecast-prod.sql`, test nạp vào cơ sở dữ liệu thử) có số báo ban đầu 0 và chưa xác nhận đã áp vào môi trường thật (OQ-18), và web chưa thấy đường báo; nhãn "Hay gặp", bộ lọc "Hay gặp", thứ tự gợi ý và nút "Bốc ngẫu nhiên đề hot" có thể không có hiệu lực thật. — *(liên quan: Mục 5 BR-002 · cần: PO)*
* [ ] OQ-6: Quý hiển thị là hằng số "2026-Q3", nhãn "Quý 3/2026", khoảng "Tháng 9 – Tháng 12", ngày cập nhật "26/10/2026". Ai đổi quý và ngày cập nhật khi sang quý mới, có nên lấy từ dữ liệu không? "Tháng 9 – Tháng 12" có đúng ý của "Quý 3"? — *(liên quan: Mục 3 FR-008, BR-020, Conflict C5 · cần: PO/dev)*
* [ ] OQ-7: "Gặp gần nhất" / "Gặp …" luôn là chữ "Gần đây" cố định. Là placeholder hay thông tin cố ý? Có cần ngày thật không? — *(liên quan: Mục 5 BR-039 · cần: PO)*
* [ ] OQ-8: Ai được luyện forecast: miễn phí hay theo gói, có trừ hạn mức không? Code của feature không có kiểm tra gói/hạn mức; chỉ có cổng pilot ở bước mở lượt thi. Plan ghi tiêu chí "trừ hạn mức đúng" và "phân quyền theo gói kiểm tra ở server" và câu hỏi mở về gói trả phí. — *(liên quan: Mục 11, Conflict C3 · cần: PO)*
* [ ] OQ-9: API danh sách chủ đề đã đăng không yêu cầu đăng nhập (công khai) trong khi màn web yêu cầu đăng nhập và onboarding. Có chủ ý để khách thấy đề không (ví dụ trang giới thiệu)? — *(liên quan: Mục 2, NFR-002 · cần: PO)*
* [ ] OQ-10: Sau trang kết quả, "Luyện câu kế tiếp" và "Quay lại chủ đề" (và mở lại chi tiết chủ đề) chỉ hiện khi có "phiên luyện cuối", nhưng không có đoạn code nào đặt phiên này. Đây là luồng đã bị bỏ, chưa nối, hay sẽ nối từ nơi khác? — *(liên quan: Mục 3 FR-026, FR-027 · cần: dev/PO)*
* [ ] OQ-11: Với chủ đề Part 2 và 3 luyện cả chủ đề, lượt thi được mở ở chế độ "Part 2" dù phiên có cả câu Part 3. Có chủ ý, và máy chủ chấm các câu Part 3 ở chế độ này thế nào? (phần chấm thuộc `scoring-results`/`mock-exam`) — *(liên quan: Mục 5 BR-030 · cần: dev)*
* [ ] OQ-12: Ghi chú khi báo gặp không giới hạn độ dài, không giới hạn tần suất báo trên nhiều chủ đề, và không có quy tắc nội dung. Có cần giới hạn? — *(liên quan: Mục 5 BR-016 · cần: PO/dev)*
* [ ] OQ-13: Khi quý chưa có chủ đề đã đăng, màn dùng chung câu "Không có chủ đề nào khớp bộ lọc." Có cần thông báo riêng như "Quý này chưa có đề"? Chủ đề đã đăng nhưng nội dung hỏng cũng hiện thẻ "0 câu". — *(liên quan: Mục 6 E-009, E-014 · cần: PO)*
* [ ] OQ-14: Chủ đề Part 1 không bao giờ có nhãn "Mới" (chỉ Part 2 và 3 có), nên bộ lọc "Mới trong quý" ở tab Part 1 luôn rỗng. Có chủ ý? — *(liên quan: Mục 5 BR-003 · cần: PO)*
* [ ] OQ-15: Dòng "Có thể có câu hỏi nối tiếp tùy câu trả lời" không bao giờ hiện với dữ liệu từ máy chủ (không gán thông tin nối tiếp). Có cần dữ liệu câu nối tiếp trong chủ đề không? — *(liên quan: Mục 5 BR-036 · cần: PO)*
* [ ] OQ-16: Mục tiêu nghiệp vụ, chỉ số thành công, mức ưu tiên (P0/P1/P2) của từng FR: code không nói. Plan của mục này ghi `priority: P2` ở mức cả mục (plans/261105-0910-wi20-forecast-practice/plan.md:5), không phải theo từng FR. — *(liên quan: Mục 3, Mục 7 · cần: PO/BA)*
* [ ] OQ-17: Dòng mô tả đầu trang nói "Tổng hợp từ báo cáo của thí sinh vừa thi" nhưng 178 chủ đề đang có đến từ nguồn web; số liệu "báo gặp" mới là báo cáo thật. Có sửa câu chữ? — *(liên quan: Mục 3 FR-008, Conflict C4 · cần: PO)*
* [ ] OQ-18: Bộ seed 178 chủ đề quý 2026-Q3 trong repo (`packages/db/scripts/seed-forecast-prod.sql`) đã được áp vào môi trường thật chưa, và số báo gặp thật hiện là bao nhiêu? Mọi mô tả về "178 chủ đề" và "số báo ban đầu 0" chỉ đúng với dữ liệu seed/test. — *(liên quan: Mục 11, NFR-001, OQ-5 · cần: PO/dev)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 3 FR-017, FR-018 | Nơi ghi tiến độ đã luyện (theo chủ đề và theo câu) | Độ phủ, "Chưa luyện", band trên thẻ không hoạt động thật | PO/dev |
| Mục 3 FR-016 | Lưu danh sách ôn theo tài khoản (không có bảng/endpoint) | Danh sách lưu mất khi tải lại | PO/dev |
| Mục 3 FR-025 | Điểm gọi "báo gặp" từ giao diện | Số thí sinh báo gặp (cơ sở của "Hay gặp") không tăng từ web | PO/dev |
| Mục 11 | Kiểm tra gói/hạn mức cho luyện forecast | Không có phân quyền theo gói như tiêu chí plan | PO |
| Mục 7 | Chỉ số đo thành công | Không đo được mục tiêu | PO |
| Mục 4 | Mốc hiệu năng, phân trang, giới hạn tải (danh sách trả một lần 178 chủ đề) | Không có tiêu chí chấp nhận | PO/dev |
| Mục 6 | Câu chữ thật của lỗi kiểm tra dữ liệu vào (Part ngoài khoảng, sai kiểu) | Không viết được wording chính xác | dev |
| Mục 6 | Thông báo riêng cho "quý chưa có đề" và "nội dung chủ đề hỏng" | Học viên thấy trạng thái chung, khó hiểu | PO |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| C1 Trạng thái triển khai | Code có màn web, API danh sách và báo gặp, test phủ (S1, S6, S2, S10) | Roadmap mục 20 "Next", khóa 🔒, phụ thuộc mục 12, 13, 14, 15, 19; plan `status: pending`, hai phase `Pending` (S23: docs/roadmap-work-items.md:35, plans/261105-0910-wi20-forecast-practice/plan.md:4, plans/261105-0910-wi20-forecast-practice/plan.md:41-42) | Chỉ ghi nhận mâu thuẫn; không tự chọn bên. Mục 19 (`forecast-curation`) ghi đã hoàn thành cùng tài liệu (docs/roadmap-work-items.md:34) |
| C2 Tên chức năng "báo" | Tên gọi trong yêu cầu giao việc: "báo lỗi chủ đề" | Code và test: học viên báo "đã gặp chủ đề" kèm ghi chú (S1:87-135; S2:115-118 ghi chú "Met this topic in IDP Hanoi"); số báo hiển thị là "thí sinh báo gặp" (S9 topic-detail-modal.tsx:50) | Tên "báo lỗi" trong brief là cách gọi của người giao việc, không có trong code; spec dùng "báo đã gặp chủ đề" |
| C3 Tiêu chí plan so với code | Plan: "danh sách ôn được lưu theo tài khoản", "Độ phủ tính từ bài luyện thật", "Phân quyền theo gói kiểm tra ở server", "trừ hạn mức đúng" (S23 plans/261105-0910-wi20-forecast-practice/plan.md:44-49) | Code: danh sách lưu trong bộ nhớ trình duyệt (S14 store.tsx:94-106), không có đoạn ghi tiến độ (S14 initial-state.ts:16-17), không có kiểm tra gói/hạn mức trong feature (negative-search N6) | Plan chưa tick tiêu chí nào; có thể plan là đích còn code là bản prototype nối một phần |
| C4 Lời mô tả đầu trang so với nguồn đề | Màn: "Tổng hợp từ báo cáo của thí sinh vừa thi, cập nhật 26/10/2026" (S6:139) | Test (trên bộ seed nạp vào cơ sở dữ liệu thử): 178 chủ đề đều có nguồn loại web, đường dẫn `https://luyennoi.com` (S2:97-106) | Có thể cả hai đúng ở thời điểm khác nhau; chỉ ghi nhận |
| C5 Nhãn quý so với khoảng tháng | Nhãn "Quý 3/2026" (S8:10) | Khoảng "Tháng 9 – Tháng 12" (S8:11) | Cả hai bị test ghim nguyên văn (S12 state-and-data.test.ts:45-52); quý 3 theo lịch thường là tháng 7 đến tháng 9, nhưng "quý" ở đây có thể là quý thi riêng, không suy được từ code |

## 4. Inferred assumptions (suy đoán cần verify)

* Nhãn "Hay gặp", bộ lọc "Hay gặp", thứ tự thẻ, thẻ gợi ý và nút bốc ngẫu nhiên đều dựa vào số thí sinh báo gặp; vì web không gọi được chức năng báo và dữ liệu seed bắt đầu từ 0, các tính năng này có thể gần như không có hiệu lực thật cho tới khi có đường báo khác. 🔵 — *validate: đếm báo gặp thực tế trong cơ sở dữ liệu và kiểm tra có kênh báo khác không · nếu sai: nhãn "Hay gặp" vẫn có ý nghĩa*
* Phiên luyện thật nối được với phòng thi và chấm điểm (có mở lượt thi gắn chủ đề, nộp sang chấm) nhưng kết quả không quay lại cập nhật tiến độ trên màn forecast. 🔵 — *validate: tìm nơi lấy bài chấm theo chủ đề để tính độ phủ (chưa thấy) · nếu sai: độ phủ được tính ở nơi khác*
* Đây là bản màn từ prototype được nối API một phần (còn dấu vết: dữ liệu mẫu cũ qua hàm dựng chủ đề chỉ dùng trong test, tên đường dẫn `_proto`). 🟡 — *validate: hỏi người sở hữu sản phẩm · nếu sai: các phần trống là tính năng chưa làm, không phải prototype*
* Báo gặp ghi đồng thời của cùng một học viên có thể trả "chưa báo trước đó" dù bản ghi đã tồn tại (kết quả trả không phản ánh việc ghi bị bỏ qua do trùng). 🔵 — *validate: test đồng thời · nếu sai: không ảnh hưởng số đếm vì ràng buộc duy nhất*

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

* **N1 — người gọi chức năng báo gặp phía web.** Pattern `reportTopic`, scope `apps` và `packages` (`*.ts`, `*.tsx`, bỏ `node_modules`). Kết quả: chỉ `packages/api/src/routers/forecast.ts`, `packages/api/src/routers/forecast.test.ts`, `packages/api/src/routers/forecast-admin.test.ts`. Không có file trong `apps/web`. Loại: dead-code-nghi (không có người gọi).
* **N2 — nơi ghi tiến độ đã luyện.** Pattern `practiced(Questions)?\s*:` và `practiced(Questions)?\s*=`, scope `apps/web/src` bỏ thư mục `__tests__` và `*.test.*`. Kết quả: chỉ khai báo kiểu (`apps/web/src/features/app-state/types.ts:78-79`), khởi tạo rỗng (`apps/web/src/features/app-state/initial-state.ts:16-17`) và truyền tham số đọc ở `apps/web/src/features/forecast`. Không có chỗ gán giá trị. Loại: code-câm / dead-code-nghi.
* **N3 — nơi đặt phiên luyện cuối.** Pattern `lastPracticeSession`, scope `apps/web/src` bỏ `__tests__`. Kết quả: đọc ở `apps/web/src/features/results/results-screen.tsx:262`, xóa (đặt null) ở dòng 292, 367, 419, khởi tạo null ở `apps/web/src/features/app-state/initial-state.ts:15`, kiểu ở `types.ts:77`. Không có chỗ đặt giá trị khác null (các test tự gán qua dữ liệu khởi tạo, ví dụ `apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:402-413`). Loại: dead-code-nghi.
* **N4 — cờ tính năng cho forecast.** Pattern `FEATURES` (phân biệt hoa thường, nguyên từ), scope `apps/web/src/features/forecast` và `packages/api/src/routers/forecast.ts` bỏ test: 0 kết quả. `apps/web/src/lib/feature-flags.ts:1-4` chỉ có khóa `scoring` và `billing`; nơi dùng `FEATURES.` là `apps/web/src/features/billing/components/payment-panel.tsx:28` và `apps/web/src/features/results/results-screen.tsx:223`. Loại: không có cờ riêng; nhưng bài luyện forecast đi qua màn kết quả chịu cờ `scoring` (xem phần chấm).
* **N5 — người gọi danh sách đã đăng.** Pattern `listPublished`, scope `apps` và `packages`: web chỉ có `apps/web/src/features/forecast/forecast-screen.tsx`; còn lại là router và test. Màn quản trị dùng danh sách riêng (không gọi hàm này). Loại: ghi nhận.
* **N6 — kiểm tra gói, hạn mức, paywall trong feature.** Pattern `\b(plan|quota|paywall|openPaywall)\b` (không phân biệt hoa thường), scope `packages/api/src/routers/forecast.ts` và `apps/web/src/features/forecast` bỏ test: 0 kết quả. Cổng duy nhất trên đường luyện là cổng pilot ở mở lượt thi (`packages/api/src/routers/attempt.ts:43-56`). Loại: code-câm.
* **N7 — thông tin câu nối tiếp trong ánh xạ từ máy chủ.** Pattern `followUp`, scope `apps/web/src/features/forecast` bỏ test: chỉ `builders.ts:31` (trong hàm dựng mẫu cũ chỉ dùng ở test, `apps/web/src/features/app-state/__tests__/state-and-data.test.ts:85-100`) và điều kiện hiển thị `topic-detail-modal.tsx:108`. Hàm ánh xạ từ máy chủ (`builders.ts:38-105`) không gán `followUp`. Loại: dead-code-nghi.
* **N8 — test bị bỏ qua.** Pattern `\.skip|\.todo|xit\(|xdescribe`, scope `packages/api/src/routers/forecast.test.ts`, `forecast-admin.test.ts`, `packages/api/src/forecast/questions.test.ts`, `packages/api/src/scoring/forecast-keys.test.ts`, `apps/web/src/features/forecast/__tests__`, `apps/web/src/features/__tests__/slice-b.test.tsx`: 0 kết quả. Không có test skip/todo.
* **N9 — migration riêng cho quý.** Quý chỉ được lọc bằng chuỗi: pattern `quarter` trong `apps/web/src` bỏ test: web chỉ gửi `QUARTER.id` (`apps/web/src/features/forecast/forecast-screen.tsx:33`); màn quản trị dùng giá trị khởi tạo riêng "2026-Q1" (`apps/web/src/features/admin/forecast-admin-screen.tsx:52`). Không có đoạn tính "quý hiện tại" từ ngày. Loại: code-câm.
* **N10 — test cho mốc 200.** Pattern `200`, `>= 200`, `hot` trong `apps/web/src/features/forecast/__tests__` và `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`: không có khẳng định mốc; `apps/web/src/features/__tests__/slice-b.test.tsx:28-80` dùng số 412, 180, 198, 175 và test lọc "Hay gặp" ở dòng 158-171. Mốc 199/200 không được kiểm thử trực tiếp.

</details>
