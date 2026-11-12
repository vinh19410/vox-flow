# dispute-admin — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Mức ưu tiên P0/P1/P2 của từng FR/NFR? — *(liên quan: Mục 3, 4 · cần: PO/BA quyết; code không nói)*
* [ ] OQ-2: Khi admin chấp nhận và chọn band mới, điểm chính thức của bài thi có được cập nhật ở đâu không? Code chỉ lưu band mới vào ca và học viên chỉ thấy huy hiệu "Báo lỗi đã xử lý". — *(liên quan: BR-016, SC-04, Mục 11 giả định · cần: PO quyết · BLOCKING)*
* [ ] OQ-3: Có cần thông báo chủ động không: (a) cho học viên khi ca xử lý xong, (b) cho admin khi ca sắp quá hạn? Hiện thời điểm cảnh báo chỉ là một dấu trong dữ liệu, không có kênh nhắn; không rõ ai là "người nhận cảnh báo". — *(liên quan: FR-018, BR-024, Mục 2 · cần: PO · BLOCKING)*
* [ ] OQ-4: Trạng thái "đang xem xét" (reviewing) do ai/khi nào đặt? Schema và truy vấn công nhận trạng thái này nhưng không có code ghi trạng thái đó. Có dead state không? — *(liên quan: Mục 8, states · cần: dev/PO)*
* [ ] OQ-5: Có cần biết admin nào xử lý ca (trường người xử lý, log hành động)? Thông báo xung đột "bởi người khác" ngụ ý nhiều admin, nhưng không lưu ai xử lý. — *(liên quan: NFR-006, E-007 · cần: PO)*
* [ ] OQ-6: Lý do chọn hạn 72 giờ (phía học viên) và ngưỡng cảnh báo 12 giờ? Cảnh báo chạy mỗi giờ nên dấu cảnh báo có thể muộn tới ~1 giờ so với mốc 12 giờ (còn huy hiệu ở hàng đợi tính theo hạn nên không trễ). Có chấp nhận không? — *(liên quan: BR-004, BR-022 · cần: PO)*
* [ ] OQ-7: Hai ngưỡng "tìm thêm người" (> 5 ca/tuần, tỷ lệ đúng hạn < 90%) chỉ có trong runbook; code chỉ có dòng chữ "> 5 cần tìm thêm người" và không có cảnh báo tự động nào. Cần cảnh báo tự động không? Ngưỡng 90% có cần hiển thị không? — *(liên quan: Mục 7 SC-01/02 · cần: PO)*
* [ ] OQ-8: Admin có được nghe audio sau khi ca đã xử lý không (hiện được, vì cổng audio không xét trạng thái ca)? Học viên có thu hồi đồng ý được không (không có luồng thu hồi trong code đã đọc)? — *(liên quan: BR-008, NFR-001 · cần: PO/pháp lý quyền riêng tư)*
* [ ] OQ-9: Nguồn dữ liệu để admin đối chiếu khi không có audio là gì? UI và mẫu trả lời nói "dựa trên bản ghi văn bản transcript" nhưng chi tiết ca không trả transcript, điểm AI hay phản hồi AI (chỉ có câu hỏi, thời lượng, loại tệp), dù cột transcript tồn tại. — *(liên quan: FR-007, FR-029, Conflict C-2 · cần: PO/dev · BLOCKING)*
* [ ] OQ-10: Vì sao band mới chỉ trong 5.0-8.0? Ca dưới 5.0 hoặc trên 8.0 không xử lý được. Cũng không kiểm tra band mới khác/cao hơn band cũ. — *(liên quan: BR-011, BR-013 · cần: PO)*
* [ ] OQ-11: Band cũ là chuỗi tự do do học viên khai khi gửi và admin có thể sửa tay; đâu là nguồn sự thật của "điểm hiện tại"? — *(liên quan: FR-013 · cần: PO/dev)*
* [ ] OQ-12: Cờ báo lỗi tắt mặc định nhưng toàn bộ chức năng admin và cron vẫn hoạt động; có chủ đích không? Có cần ẩn route admin khi cờ tắt? — *(liên quan: BR-027 · cần: PO)*
* [ ] OQ-13: Với bộ lọc "Đã xử lý"/"Tất cả", ca vẫn sắp theo hạn xử lý tăng dần thay vì theo thời điểm xử lý mới nhất; có chủ đích không? — *(liên quan: FR-005 · cần: PO)*
* [ ] OQ-14: Ca đã xử lý nhưng thiếu thời điểm xử lý được tính là đúng hạn; không có ca đã xử lý thì tỷ lệ là 100%. Có chủ đích? — *(liên quan: BR-017, BR-018 · cần: PO)*
* [ ] OQ-15: Mọi lỗi tải (kể cả mất mạng) đều hiện "Truy cập bị từ chối" và không có nút thử lại; có chấp nhận không? — *(liên quan: E-015, BR-031 · cần: PO/UX)*
* [ ] OQ-16: Bản chuẩn của ba mẫu trả lời là bản trong giao diện hay trong runbook (hai bản khác nhau)? — *(liên quan: Conflict C-1 · cần: PO)*
* [ ] OQ-17: Khi số ca cần cảnh báo rất lớn, câu cập nhật theo danh sách mã có thể vượt giới hạn tham số của cơ sở dữ liệu; có cần chia lô? (giới hạn cụ thể không có trong code) — *(liên quan: E-020 · cần: dev)*
* [ ] OQ-18: Hộp thoại kết quả đã xử lý hiện trạng thái thô ("resolved"/"rejected") thay vì nhãn tiếng Việt; có chủ đích? — *(liên quan: Mục 10 SCR-02 · cần: UX)*
* [ ] OQ-19: Không có test nào cho: nhánh xung đột khi hai admin xử lý, lỗi thiếu band, từ chối với band gửi kèm, ca không tồn tại, bộ lọc open/resolved, số liệu tính chính xác (chỉ kiểm tra ">="), giao diện gửi quyết định. Cần bổ sung khi phát triển tiếp? — *(liên quan: Mục 3-6 · cần: dev)*
* [ ] OQ-20: Định nghĩa "đã xử lý" của hàng đợi (có thời điểm xử lý hoặc trạng thái) khác của số liệu (chỉ trạng thái); có cần thống nhất? — *(liên quan: BR-003, BR-019, BR-021 · cần: dev)*
* [ ] OQ-21: Khi một bài thi có nhiều ca (ca cũ đã xử lý, ca mới), danh sách chi tiết dùng đồng ý của ca đang mở còn cổng tải audio dùng đồng ý của ca tạo gần nhất; hai giá trị có thể khác nhau. Có chủ đích không? — *(liên quan: BR-007, NFR-001 · cần: PO/dev; đối chiếu `packages/api/src/routers/dispute-admin.ts:210-224` với `apps/server/src/index.ts:322-331`)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 3, 4 | Priority P0/P1/P2 | Không xếp thứ tự được khi cắt phạm vi | PO |
| Mục 7 | Mốc đạt định lượng (tỷ lệ đúng hạn tối thiểu, số ca sắp quá hạn chấp nhận được) | Không biết thế nào là đạt | PO |
| Mục 2 | Danh tính thật của admin, số lượng admin, quy trình khi vắng mặt | Không rõ trách nhiệm xử lý trong 72 giờ | PO |
| Mục 4 | Yêu cầu hiệu năng, tải dự kiến, phân trang | Hàng đợi/số liệu đọc toàn bộ bảng | PO/dev |
| Mục 4 | Yêu cầu audit (ai xử lý, khi nào, lý do) | Không truy vết được quyết định | PO |
| Mục 6 | Thông điệp lỗi tầng kiểm tra dữ liệu đầu vào cho các trường khác ngoài phản hồi | Wording chưa resolve (E-009) | dev |
| Mục 3 | Test cho nhánh xung đột, từ chối, thiếu band, bộ lọc, giao diện gửi quyết định | Không có bằng chứng test cho các hành vi này | dev |
| Mục 9 | Luồng từ "ca xử lý xong" tới "điểm bài thi" và tới "thông báo học viên" | OQ-2, OQ-3 | PO/dev |
| Mục 10 | Thiết kế (wireframe/Figma) của màn admin | Không đối chiếu được UI với thiết kế | UX |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| C-1 Văn bản 3 mẫu trả lời | Giao diện: mẫu 1 kết thúc "Chúc bạn ôn tập tốt!", mẫu 2 không có cụm "(về ngữ pháp, từ vựng hoặc phát âm)", mẫu 3 nêu "chúng tôi chỉ có thể đối chiếu qua bản ghi văn bản transcript" (S11:87-100) | Runbook: mẫu 1 "Chúc bạn ôn tập tốt và đạt mục tiêu thi sắp tới!", mẫu 2 có cụm trên, mẫu 3 "ban chuyên môn chỉ có thể đối chiếu bài thi dựa trên dữ liệu văn bản transcript" (S21:46-52) | Code là nguồn fact; runbook medium. Không tự chọn bên → OQ-16 |
| C-2 Admin đối chiếu theo transcript | Code: chi tiết ca không trả transcript/điểm AI (S1:195-209) | Runbook: "chỉ đối chiếu dựa trên bản ghi văn bản transcript đã lưu trữ" (S21:21); UI nói "chỉ xem xét dựa trên dữ liệu văn bản" (S11:519-521) | → OQ-9 |
| C-3 Học viên xem kết quả | Code: màn kết quả học viên chỉ hiện huy hiệu trạng thái (S18:329-338) | Runbook: "Học viên có thể xem kết quả trực tiếp trên màn hình kết quả bài thi" (S21:29) | Có thể đúng một phần (xem trạng thái); nội dung phản hồi/band mới không hiện trong file đã đọc → OQ-2, OQ-3 |
| C-4 Ngưỡng tìm thêm người | Code: chỉ có dòng chữ "> 5 cần tìm thêm người", không có ngưỡng 90% (S11:277) | Runbook: hai ngưỡng > 5/tuần và < 90% (S21:60-61) | → OQ-7 |
| C-5 Biên 12 giờ | Tác vụ cảnh báo: hạn đúng bằng hiện tại + 12 giờ được cảnh báo (nhỏ hơn hoặc bằng) (S3:33, S4:96-136) | Hàng đợi/số liệu: sắp quá hạn khi nhỏ hơn 12 giờ thuần túy (S1:136, S1:313); chú thích trong code nói "within 12 hours", test nói "< 12 hours" | Trong thực tế mốc đúng 12 giờ sẽ được đánh dấu ngay lần chạy giờ đó nên hàng đợi vẫn hiện; lệch chỉ ở khoảng giữa hai lần chạy (suy luận, chưa kiểm bằng test). Ghi nhận, nằm trong OQ-6 |
| C-6 Mô tả "hàng đợi cảnh báo màu vàng" | Code: ca sắp quá hạn có viền `border-l-warn` và huy hiệu tone `warn` (S11:355, S11:373) | Runbook: "cảnh báo màu vàng" (S21:14) | Không mâu thuẫn rõ; màu thực của token `warn` không đọc được trong phạm vi này |

## 4. Inferred assumptions (suy đoán cần verify)

* Cảnh báo `warnedAt` chỉ phục vụ huy hiệu trong hàng đợi, vì hàng đợi đọc cờ này (S1:134) và không có nơi nào khác đọc/gửi — *validate: grep tiêu thụ `warnedAt` · nếu sai: thiếu luồng thông báo*. 🟡
* Admin có thể có nhiều người (thông báo xung đột "bởi người khác"; danh sách email nhiều phần tử) — *validate: hỏi PO · nếu sai: E-007 chỉ xảy ra với double-click/2 tab*. 🟡
* Admin "người sở hữu sản phẩm" giai đoạn đầu (UI nêu "người sở hữu sản phẩm (admin)") — *validate: PO · nếu sai: nội dung màn từ chối truy cập sai*. 🟡

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

* **N1** — Ghi band mới vào điểm bài thi: grep `resolvedBand` trên `apps/` và `packages/` (loại node_modules, test, `dispute-admin.ts`, `disputes-screen.tsx`) → 0 kết quả tiêu thụ ngoài schema. Ngoài ra `resolvedBand` chỉ có trong `dispute-admin.ts`, `disputes-screen.tsx`, schema, test. Không có ghi vào bảng điểm. → Gap OQ-2.
* **N2** — Thông báo học viên/admin: grep `-i "notify|email|webhook|send"` trên `packages/api/src/disputes/` → chỉ khớp tên trường email trong test; không có gọi gửi. `scheduled.ts` chỉ log. → OQ-3.
* **N3** — Hiển thị phản hồi/band mới cho học viên: grep `replyText|resolvedBand` trong `apps/web/src/features/results/` → 0 kết quả; chỉ `results-screen.tsx:329-338` hiện huy hiệu theo trạng thái. → C-3.
* **N4** — Đặt trạng thái "reviewing": grep `"reviewing"` trong `apps/` và `packages/` (loại test/migration) → chỉ gặp trong enum, bộ lọc `inArray`, điều kiện hiển thị; không có `set({ status: "reviewing" })`. → OQ-4.
* **N5** — Cờ báo lỗi ở phía admin: grep `SCORE_DISPUTE_ENABLED` trong `packages/api/src`, `apps/server/src`, `apps/web/src` (loại test) → chỉ `context.ts:16` (kiểu) và `dispute.ts:27,136`; không có trong `dispute-admin.ts`, `scheduled.ts`, route web. `FEATURES` ở `apps/web/src/lib/feature-flags.ts` chỉ có `scoring`, `billing`. → BR-027, OQ-12.
* **N6** — Phân trang/giới hạn hàng đợi: đọc `dispute-admin.ts:94-146`, không có `limit`/`offset`. → NFR-005.
* **N7** — Thu hồi đồng ý chia sẻ: grep `shareConsent` trong `apps/` và `packages/` (loại test) → chỉ `dispute.ts` và `report-modal.tsx` (nhập), `dispute-admin.ts`/`apps/server/src/index.ts`/`disputes-screen.tsx` (đọc), schema; không có `update shareConsent`. → OQ-8.
* **N8** — Người xử lý: schema `dispute.ts:7-38` không có cột `resolvedBy`/`handledBy`. → OQ-5.
* **N9** — Test bị bỏ qua: grep `it.skip|it.todo|describe.skip|xit` trong 6 file test của feature → 0 kết quả.
* **N10** — Cờ tắt/dead code: không phát hiện route no-caller; `checkAdmin` được route web gọi (`disputes.tsx:17`). Màn `DisputesScreen` có prop `initialQueue/initialMetrics/accessDeniedForTest` chỉ phục vụ test (không có caller truyền trong app: route dùng `component: DisputesScreen` không truyền prop). → ghi nhận, không phải dead code.
* **N11** — Dữ liệu giả/prototype: các giá trị mock chỉ nằm trong `disputes-screen.test.tsx` và `dispute-admin.test.ts`; code ứng dụng không chứa dữ liệu giả.
* **N12** — Tiêu thụ `warnedAt` ngoài hàng đợi/số liệu: grep `warnedAt` trong `apps/` và `packages/` (loại test) → `dispute-admin.ts`, `overdue.ts`, `disputes-screen.tsx` (kiểu), schema. Không có kênh nào khác.

</details>
