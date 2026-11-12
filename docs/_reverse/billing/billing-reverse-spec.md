---
type: reverse-srs
feature: billing
status: draft
updated: 2026-11-11
confidence_summary: "✅44 🔵0 🟡23"
links:
  - docs/_reverse/billing/reverse-sources.md
  - docs/_reverse/billing/reverse-gaps.md
  - docs/_reverse/billing/_evidence.md
  - docs/_reverse/billing/srs/billing-reverse-flows.md
  - docs/_reverse/billing/srs/billing-reverse-states.md
  - docs/_reverse/billing/srs/billing-reverse-erd.md
  - docs/_reverse/billing/usecases/billing-reverse-usecase-index.md
---

# billing — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập, CHƯA duyệt). Nhãn: ✅ chắc chắn (code/test khẳng định) · 🔵 suy đoán (>=2 chỗ code hậu thuẫn) · 🟡 cần xác nhận.

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái duyệt:** CHƯA duyệt. Bộ tài liệu này tái lập từ source code, chưa qua PO/BA.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Kết luận quan trọng nhất (độ tin cậy thấp về phần "thanh toán thật"):** toàn bộ feature hiện là **giao diện prototype chạy phía trình duyệt**. Không có backend thanh toán (không đơn hàng, không webhook, không bảng gói/giao dịch), mã QR là hình mô phỏng cố định, bước "nhận tiền" do nút giả lập bấm tay. Cờ `FEATURES.billing` mặc định TẮT; khi tắt, bảng thanh toán chỉ hiện thông báo "sắp ra mắt" (trang gói và danh sách gói vẫn hiển thị). Chi tiết negative-search (đã chạy lặp lại khi audit) ở [`reverse-gaps.md`](./reverse-gaps.md).
- **Phạm vi nhãn ✅ về giá, gói, quyền lợi:** chỉ là fact của giao diện prototype (dữ liệu cố định phía trình duyệt), CHƯA phải giá/gói/quyền lợi chính thức do PO chốt. Chỉ giá 49.000đ và chữ "3 lượt mở chi tiết, không hết hạn" có đối chiếu doc lộ trình (mục 0.3).
- **Cách đếm nhãn:** đếm theo cột Nhãn của các bảng Mục 2-7, 10, 11 (67 dòng: ✅44 · 🔵0 · 🟡23); không đếm bullet trong Mục 1, 8, 9, bảng 0.3 hay file phụ. Trước audit, theo cùng cách đếm: ✅51 · 🔵3 · 🟡13.
- **Audit độc lập:** đã chạy 2026-11-11, hạ 11 claim, sửa 7 cite.

### 0.3 Khác biệt với tài liệu chính (chỉ khi feature trùng doc hiện có)

| Điểm | Reverse nói (từ nguồn) | Doc chính nói | Đề xuất | Nguồn | Nhãn |
|------|------------------------|---------------|---------|-------|------|
| Hạn mức của người dùng miễn phí | Màn billing hiển thị badge "Band tổng không giới hạn" cho gói Miễn phí (apps/web/src/features/billing/billing-screen.tsx:35), trong khi trang giới thiệu bảng giá ghi "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)" (apps/web/src/features/landing/components/pricing-teaser.tsx:22) | docs/roadmap-work-items.md:30 yêu cầu sửa chỗ ghi "Band tổng không giới hạn" tại màn billing, vì gói 49k "không miễn hạn mức" | `/cr`: BA xác định hạn mức miễn phí chuẩn, sửa copy | S2, S19, S21 | 🟡 |
| Gói 49.000đ | Nhãn "3 lượt chi tiết", quyền lợi "Không hết hạn" (apps/web/src/features/billing/data.ts:14-16) khớp doc | Doc: "3 lượt mở chi tiết, không hết hạn" (docs/roadmap-work-items.md:30) | Giữ; bộ đếm lượt chưa có trong code (xem BR-010) | S1, S21 | 🟡 |
| Chứng từ thanh toán | Màn billing có danh sách "Hóa đơn" với 1 dòng và nút tải (toast), không có biên nhận thật (apps/web/src/features/billing/billing-screen.tsx:58-92) | D-11: cung cấp biên nhận điện tử tự động sau khi thanh toán QR thành công (docs/product-decisions.md:15) | `/gap`: biên nhận thật chưa có | S2, S22 | 🟡 |
| Phạm vi hạng mục | Code chỉ có giao diện; chưa có đơn hàng/webhook/đối soát | docs/roadmap-work-items.md:30-31 xếp hạng mục 15 (mua gói & QR) và 16 (đối soát) trạng thái 🔒 | Xem Gap G-1 | S20, S21 | 🔵 |

## 1. Scope

Feature mô tả những gì giao diện hiện cho phép người dùng làm về gói và thanh toán:

- Xem 4 gói trả phí với giá, đơn vị và quyền lợi. ✅ [S1 apps/web/src/features/billing/data.ts:10-40]
- Chọn một gói để mở bảng thanh toán dạng cửa sổ. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:56,93-95]
- Xem bảng thanh toán QR (mô phỏng) với đồng hồ đếm ngược 10 phút, nội dung chuyển khoản và nút giả lập "đã chuyển khoản"; sau đó gói được kích hoạt trong phiên làm việc (chỉ khi cờ billing bật; test mock cờ = bật). ✅ [S4 apps/web/src/features/billing/components/payment-panel.tsx:22-126]
- Khi cờ tính năng tắt (mặc định), bảng thanh toán chỉ hiện thông báo "Cổng thanh toán sắp ra mắt". ✅ [S4 apps/web/src/features/billing/components/payment-panel.tsx:28-44, S8 apps/web/src/features/billing/__tests__/billing-gate.test.tsx:9-18]
- Xem gói hiện tại, hiệu lực, hóa đơn mô phỏng, và quay về gói Miễn phí. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:30-92]
- Cửa sổ paywall mềm mở từ màn kết quả cho kết quả chưa mở khóa; chỉ tới được khi `FEATURES.scoring` bật (mặc định tắt) và kết quả không phải chấm thật, xem OQ-15. 🟡 [S11 apps/web/src/features/results/components/soft-paywall.tsx:17, S6 apps/web/src/features/billing/components/paywall-modal.tsx:18-53, S12 apps/web/src/features/results/results-screen.tsx:223]

**Boundary (ngoài phạm vi, vì code không có):**

- Thu tiền thật, đơn hàng, nhận thông báo từ ngân hàng/cổng thanh toán, đối soát, hoàn tiền, gia hạn, hủy, xuất hóa đơn/biên nhận thật. Không có trong code, xem negative-search ở [`reverse-gaps.md`](./reverse-gaps.md). ✅ (negative) [S4 apps/web/src/features/billing/components/payment-panel.tsx:1-127, S20 packages/infra/alchemy.run.ts:51]
- Đếm và trừ "lượt chi tiết" của gói Theo lượt, tự động hết hạn gói. 🟡 OQ-5, OQ-6 [S1 apps/web/src/features/billing/data.ts:14-16, S13 apps/web/src/features/app-state/types.ts:53-57]
- Chấm điểm, cờ `FEATURES.scoring` (feature khác).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Người học đã đăng nhập (xem gói, chọn gói, thanh toán, về gói miễn phí) | người | Mở khóa chi tiết 4 tiêu chí và bằng chứng (suy từ nhãn giao diện "Nâng cấp để xem chi tiết 4 tiêu chí và bằng chứng."; mục tiêu thật cần PO xác nhận) | Có | S2 apps/web/src/features/billing/billing-screen.tsx:38, S14 apps/web/src/routes/_proto/app/route.tsx:7, apps/web/src/lib/auth-guard.ts:24-30,41-57 | 🟡 |
| Người dùng chưa trả phí bấm "Mở khóa" ở kết quả | người | Mở khóa chi tiết từ màn kết quả (suy từ nhãn nút, cần PO xác nhận) | Có | S11 apps/web/src/features/results/components/soft-paywall.tsx:17 | 🟡 |
| Ngân hàng / cổng thanh toán (SePay theo thông báo trên giao diện) | ngoài | Báo "đã nhận tiền" để kích hoạt gói. Trong code chỉ được thay bằng nút giả lập, chưa có kết nối | Không (chưa nối) | S4 apps/web/src/features/billing/components/payment-panel.tsx:35,120-123 | 🟡 |
| Quản trị viên / vận hành | người | Không có chức năng quản trị gói/thanh toán trong code | Không | S4 apps/web/src/features/billing/components/payment-panel.tsx:1-127 | 🟡 |

## 3. Functional Requirements (FR)

Priority: code không nói mức ưu tiên; mọi dòng ghi `P? (chưa gán)` và cần PO xác nhận (OQ-12).

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-billing-001 | Danh mục 4 gói | Hệ thống có đúng 4 gói theo thứ tự hiển thị: "Theo lượt" 49.000đ (đơn vị "3 lượt chi tiết"), "7 ngày" 99.000đ ("/ tuần"), "Đến ngày thi" 349.000đ ("trọn gói", gói nổi bật), "30 ngày" 249.000đ ("/ tháng"). Quyền lợi từng gói theo danh sách văn bản cố định (xem Mục 8). | P? (chưa gán) | test | S1 apps/web/src/features/billing/data.ts:10-40, S17 apps/web/src/features/app-state/__tests__/state-and-data.test.ts:126 (chỉ kiểm số lượng 4, không kiểm giá hay thứ tự) | ✅ |
| FR-billing-002 | Thẻ gói | Mỗi thẻ gói hiển thị tên, giá định dạng tiền Việt (dấu chấm ngăn nghìn, hậu tố "đ"), đơn vị, và nút "Chọn gói". Ở màn Gói & thanh toán thẻ có thêm danh sách quyền lợi; ở cửa sổ paywall dạng gọn thì không hiện quyền lợi. Bố cục 1 cột trên điện thoại, 2 cột, 4 cột trên màn rộng (màn gói); 2 cột ở dạng gọn. | P? (chưa gán) | demo | S5 apps/web/src/features/billing/components/plan-grid.tsx:16-61, S15 apps/web/src/lib/format.ts:1 | ✅ |
| FR-billing-003 | Gói nổi bật và dòng phụ ngày thi | Gói "Đến ngày thi" mang nhãn "Khuyên dùng". Dòng phụ dưới tên gói này: nếu người dùng đã có ngày thi thì "{số ngày còn lại} ngày, đến {ngày thi theo định dạng vi-VN}", nếu chưa có thì "Tối đa 60 ngày". Số ngày còn lại tính theo làm tròn lên, tối thiểu 0. | P? (chưa gán) | demo | S5 apps/web/src/features/billing/components/plan-grid.tsx:30-40, S15 apps/web/src/lib/format.ts:8-11 | ✅ |
| FR-billing-004 | Hiển thị gói hiện tại | Khi chưa có gói: tên "Miễn phí", nhãn "Band tổng không giới hạn", dòng "Nâng cấp để xem chi tiết 4 tiêu chí và bằng chứng.". Khi có gói: tên gói, nhãn "Đang hoạt động", dòng "Hiệu lực đến: {hiệu lực}". Tiêu đề trang "Gói & thanh toán", phụ đề "Trả theo ngày thi hoặc theo lượt. Không tự gia hạn ngầm, không cần nhắn tin xác nhận chuyển khoản." | P? (chưa gán) | demo | S2 apps/web/src/features/billing/billing-screen.tsx:24-40 | ✅ |
| FR-billing-005 | Chọn gói mở bảng thanh toán | Bấm một thẻ gói mở cửa sổ thanh toán cho gói đó. Cửa sổ đóng bằng phím Escape, bấm nền mờ, hoặc nút X (nhãn truy cập "Đóng"). | P? (chưa gán) | test | S2 apps/web/src/features/billing/billing-screen.tsx:56,93-95, S5 apps/web/src/features/billing/components/plan-grid.tsx:24, S16 apps/web/src/features/__tests__/slice-c.test.tsx:415-416, S24 apps/web/src/components/ds/modal.tsx:20-52 | ✅ |
| FR-billing-006 | Cổng thanh toán tắt (mặc định) | Khi cờ billing không bật, bảng thanh toán chỉ hiện tiêu đề "Cổng thanh toán sắp ra mắt", mô tả "Gói {tên gói} đang được tích hợp cổng thanh toán tự động VietQR qua SePay. Trong thời gian thử nghiệm Beta, toàn bộ tính năng đều được mở miễn phí." và nút "Đóng". Không hiện mã QR, không hiện nút "Đã chuyển khoản", không kích hoạt được gói. | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:28-44, S8 apps/web/src/features/billing/__tests__/billing-gate.test.tsx:9-18 | ✅ |
| FR-billing-007 | Bảng thanh toán QR (cờ bật) | Khi cờ bật, bảng hiện tiêu đề "Quét mã để thanh toán", câu "Dùng app ngân hàng hoặc ví bất kỳ. Gói kích hoạt tự động ngay khi nhận tiền.", mã QR, và 3 dòng: "Gói" (tên gói), "Số tiền" (giá gói), "Nội dung CK" (mã chuyển khoản). Có nút quay lại "Đổi gói". | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:75-101, S16 apps/web/src/features/__tests__/slice-c.test.tsx:416 | ✅ |
| FR-billing-008 | Mã QR chỉ là hình mô phỏng | Mã QR là hình sinh cố định từ hằng số khởi tạo, lưới 25x25, 3 ô định vị và 1 ô logo cam ở giữa; nội dung không phụ thuộc gói, số tiền hay người dùng nên không quét được thành lệnh chuyển khoản thật. | P? (chưa gán) | kiểm tra | S7 apps/web/src/features/billing/components/fake-qr.tsx:3-35 | ✅ |
| FR-billing-009 | Mã nội dung chuyển khoản | Mã = "CR" + 4 ký tự đầu của email người dùng viết hoa (nếu chưa có email thì dùng "USER") + "7Q". Hậu tố "7Q" là hằng số, mã không chứa mã gói hay mã đơn. | P? (chưa gán) | kiểm tra | S4 apps/web/src/features/billing/components/payment-panel.tsx:26 | ✅ |
| FR-billing-010 | Đồng hồ đếm ngược | Bảng thanh toán đếm ngược từ 600 giây, trừ 1 mỗi giây, hiển thị "Đang chờ thanh toán · hết hạn sau {mm:ss}" (mở ra hiện 10:00). Giá trị hiển thị không xuống dưới 0:00. Khi về 0 không có hành vi nào khác (không đóng bảng, không khóa nút, không đổi trạng thái). | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:24,46-49,109, S15 apps/web/src/lib/format.ts:5-6, S16 apps/web/src/features/__tests__/slice-c.test.tsx:417 | ✅ |
| FR-billing-011 | Nút giả lập đã chuyển khoản | Có dòng ghi "Prototype: giả lập webhook ngân hàng" cùng nút "Đã chuyển khoản". Bấm nút chuyển trạng thái thanh toán từ "đang chờ" sang "đã nhận tiền". Nút bị vô hiệu khi trạng thái không còn là "đang chờ". | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:119-124, S16 apps/web/src/features/__tests__/slice-c.test.tsx:419 | ✅ |
| FR-billing-012 | Trạng thái đã nhận tiền | Ở trạng thái "đã nhận tiền": hiện lớp phủ vòng xoay trên mã QR và dải trạng thái "Đã nhận tiền, đang kích hoạt…" (nền xanh). Sau 1200 ms, trạng thái chuyển sang "đã kích hoạt". | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:50-58,85-89,102-116, S16 apps/web/src/features/__tests__/slice-c.test.tsx:420-425 | ✅ |
| FR-billing-013 | Kích hoạt gói | Khi chuyển sang "đã kích hoạt", hệ thống ghi gói đang dùng (mã gói, tên gói, hiệu lực) vào trạng thái phiên của người dùng và hiện thông báo `Đã kích hoạt gói {tên gói}`. | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:52-56, S16 apps/web/src/features/__tests__/slice-c.test.tsx:426-427 | ✅ |
| FR-billing-014 | Màn kích hoạt thành công | Tiêu đề "Đã kích hoạt gói {tên gói}", câu "Hiệu lực: {hiệu lực}. Hóa đơn đã gửi tới {email}." và nút "Xem chi tiết 4 tiêu chí". Bấm nút chỉ đóng cửa sổ, không điều hướng. Việc "gửi hóa đơn tới email" không có cơ chế nào trong code. | P? (chưa gán) | test | S4 apps/web/src/features/billing/components/payment-panel.tsx:60-73, S2 apps/web/src/features/billing/billing-screen.tsx:94, S6 apps/web/src/features/billing/components/paywall-modal.tsx:28, S16 apps/web/src/features/__tests__/slice-c.test.tsx:425,429-430 | ✅ |
| FR-billing-015 | Tính hiệu lực gói | "Theo lượt": "Không hết hạn · 3 lượt". "Đến ngày thi": ngày thi của người dùng nếu có, nếu không có thì hôm nay + 60 ngày. "7 ngày": hôm nay + 7 ngày. "30 ngày": hôm nay + 30 ngày. Ngày hiển thị theo định dạng vi-VN. | P? (chưa gán) | test | S3 apps/web/src/features/billing/plan-utils.ts:3-8, S17 apps/web/src/features/app-state/__tests__/state-and-data.test.ts:131-147 | ✅ |
| FR-billing-016 | Quay lại đổi gói | Nút "Đổi gói" đóng bảng thanh toán, về danh sách gói. Nếu bấm khi đang ở trạng thái "đã nhận tiền" thì việc kích hoạt đang chờ bị hủy (bảng bị gỡ nên bộ đếm 1200 ms bị dừng). | P? (chưa gán) | kiểm tra | S4 apps/web/src/features/billing/components/payment-panel.tsx:50-58,77-79, S2 apps/web/src/features/billing/billing-screen.tsx:93-95 | ✅ |
| FR-billing-017 | Về gói miễn phí | Chỉ khi đang có gói mới hiện nút "Về gói miễn phí". Bấm: xóa gói đang dùng và hiện thông báo "Đã chuyển về gói Miễn phí (prototype)". Không có bước xác nhận và không có hoàn tiền. Không có test phủ nút này. | P? (chưa gán) | demo | S2 apps/web/src/features/billing/billing-screen.tsx:41-52 | ✅ |
| FR-billing-018 | Mục Hóa đơn | Khi có gói: 1 dòng "Gói {tên}" kèm ngày hiện tại (không phải ngày mua), số tiền là giá niêm yết của gói, nhãn "Đã thanh toán" và nút tải; bấm nút chỉ hiện thông báo "Đã tải hóa đơn PDF", không tải tệp. Khi chưa có gói: trạng thái rỗng "Chưa có hóa đơn nào" với mô tả "Lịch sử các hóa đơn thanh toán gói luyện thi sẽ được lưu trữ tại đây.". | P? (chưa gán) | demo | S2 apps/web/src/features/billing/billing-screen.tsx:58-92 | ✅ |
| FR-billing-019 | Paywall mềm ở màn kết quả | Dải "Xem vì sao bạn được từng band" kèm nút "Mở khóa từ 49.000đ" và dòng "Thanh toán QR · kích hoạt tự động trong vài giây" hiện ở vùng chi tiết khi kết quả chưa mở khóa. Bấm nút mở cửa sổ paywall. Cửa sổ paywall còn được mở từ hai chỗ khác khi chưa mở khóa: bấm chọn một tiêu chí, và nút "Mở khóa đánh dấu lỗi" ở danh sách xem lại. Kết quả đã chấm thật luôn coi là đã mở khóa nên không hiện dải này. Màn kết quả không phải chấm thật chỉ hiển thị khi `FEATURES.scoring` bật; khi tắt (mặc định) màn kết quả hiện thông báo "sắp ra mắt" nên paywall không tới được (OQ-15). Giá "49.000đ" viết cứng trong chữ, không lấy từ danh mục gói. | P? (chưa gán) | test | S11 apps/web/src/features/results/components/soft-paywall.tsx:15-20, S12 apps/web/src/features/results/results-screen.tsx:223,258-259,306-308,402, apps/web/src/features/results/components/review-list.tsx:60-62, S16 apps/web/src/features/__tests__/slice-c.test.tsx:435 (test mock cờ scoring = bật) | 🟡 |
| FR-billing-020 | Cửa sổ paywall | Nội dung: nhãn "Mở khóa chi tiết"; tiêu đề `Biết chính xác cần sửa gì để lên {band mục tiêu, 1 chữ số thập phân}`; 4 ý "Band + khoảng tin cậy cho 4 tiêu chí", "Lý do kèm trích dẫn câu bạn nói", "Đánh dấu lỗi ngữ pháp, từ vựng, phát âm", "Câu gợi ý nâng band cho từng lỗi"; danh sách gói dạng gọn; chân trang "Band tổng vẫn miễn phí cho mọi lượt, kể cả khi bạn không nâng cấp.". Chọn gói trong cửa sổ này đi cùng luồng thanh toán như FR-billing-007..014. | P? (chưa gán) | test | S6 apps/web/src/features/billing/components/paywall-modal.tsx:26-52, S16 apps/web/src/features/__tests__/slice-c.test.tsx:446-453 | ✅ |
| FR-billing-021 | Paywall ẩn khi đã có gói | Nếu người dùng đã có gói và chưa đang ở bước thanh toán thì cửa sổ paywall không hiển thị gì. Mỗi lần cửa sổ mở lại, lựa chọn gói trước đó được xóa. | P? (chưa gán) | kiểm tra | S6 apps/web/src/features/billing/components/paywall-modal.tsx:20-24 | ✅ |
| FR-billing-022 | Paywall tự đóng khi đổi trang | Khi đường dẫn trang thay đổi mà paywall đang mở, hệ thống đóng paywall. | P? (chưa gán) | kiểm tra | S13 apps/web/src/features/app-state/app-state-provider.tsx:15-20 | ✅ |
| FR-billing-023 | Hiển thị gói ở nơi khác | Thẻ người dùng hiển thị "Gói {tên}" hoặc "Miễn phí"; menu dưới (bottom nav) hiển thị "Gói {tên}" hoặc "Gói Miễn phí"; hồ sơ hiển thị tên gói hoặc "Gói Miễn phí", nhãn "Đang hoạt động" hoặc "Cơ bản", và dòng quyền lợi (có gói: "Mở chi tiết 4 tiêu chí không giới hạn đến ngày {hiệu lực}."; chưa có: "Mở band tổng và xem chi tiết bằng chứng của 1 câu yếu nhất."). | P? (chưa gán) | test | S18 apps/web/src/layouts/user-card.tsx:38, apps/web/src/layouts/bottom-nav.tsx:58, apps/web/src/features/profile/profile-screen.tsx:378-401, test apps/web/src/layouts/__tests__/user-card.test.tsx:127-131, apps/web/src/layouts/__tests__/bottom-nav.test.tsx:176, apps/web/src/features/profile/__tests__/profile-screen.test.tsx:302 | ✅ |
| FR-billing-024 | Lối vào feature | Có mục menu "Gói & thanh toán" (nhãn ngắn "Gói") dẫn tới trang gói; trang này nằm dưới `/app`, được chặn bởi yêu cầu đã đăng nhập và đã onboarding. | P? (chưa gán) | demo | S14 apps/web/src/layouts/nav-items.ts:54-60, apps/web/src/routes/_proto/app/billing.tsx:5-7, apps/web/src/routes/_proto/app/route.tsx:7, apps/web/src/lib/auth-guard.ts:24-30,41-57 | ✅ |
| FR-billing-025 | Gói không lưu qua tải lại | Gói đang dùng chỉ nằm trong trạng thái phiên trên trình duyệt; phần được lưu vào bộ nhớ phiên chỉ gồm chế độ, giọng, phiên luyện, và lượt chấm; không có gói. Tải lại trang thì gói về "chưa có". | P? (chưa gán) | kiểm tra | S13 apps/web/src/features/app-state/store.tsx:94-107, apps/web/src/features/app-state/initial-state.ts:10 | ✅ |
| FR-billing-026 | Bảng giá ở trang giới thiệu | Trang giới thiệu dùng chung danh mục gói, hiển thị cột "Miễn phí" (0đ) và 3 gói (không gồm "30 ngày"). | P? (chưa gán) | test | S19 apps/web/src/features/landing/components/pricing-teaser.tsx:19-30, apps/web/src/features/__tests__/slice-a.test.tsx:126-131 | ✅ |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-billing-001 | usability | Bố cục đáp ứng: lưới gói 1/2/4 cột theo độ rộng; cửa sổ thanh toán có chiều rộng giới hạn. | P? (chưa gán) | Chưa xác định (gợi ý của người soạn: kiểm tra giao diện 3 viewport) | S5 apps/web/src/features/billing/components/plan-grid.tsx:20, S2 apps/web/src/features/billing/billing-screen.tsx:93 | ✅ |
| NFR-billing-002 | security | Giá trị khóa webhook của SePay được khai báo là bí mật ở hạ tầng, nhưng không có mã nào dùng nó; không có kiểm tra chữ ký hay xác thực nào cho thanh toán trong code đang chạy. | P? (chưa gán) | Chưa xác định | S20 packages/infra/alchemy.run.ts:51, apps/server/src/env.ts:34-37 | ✅ |
| NFR-billing-003 | performance / reliability | Không có yêu cầu hiệu năng, độ tin cậy, idempotency hay thời gian xử lý thanh toán; các mốc 600 giây và 1200 ms là hằng số mô phỏng. | P? (chưa gán) | Chưa xác định | S4 apps/web/src/features/billing/components/payment-panel.tsx:24,56 | 🟡 |
| NFR-billing-004 | a11y | Nút tải hóa đơn có nhãn truy cập "Tải hóa đơn". Các điều khiển khác dùng nút chuẩn. Không có yêu cầu a11y nào khác trong code. | P? (chưa gán) | Chưa xác định | S2 apps/web/src/features/billing/billing-screen.tsx:76 | ✅ |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-billing-001 | Giá niêm yết cố định: Theo lượt 49.000, 7 ngày 99.000, Đến ngày thi 349.000, 30 ngày 249.000 (đồng). Giá nằm trong dữ liệu cố định phía giao diện, không có khuyến mãi, thuế hay giá theo người dùng. | Hiển thị gói, thanh toán, hóa đơn | FR-billing-001, 007, 018 | S1 apps/web/src/features/billing/data.ts:14,21,28,36 | ✅ |
| BR-billing-002 | Hiệu lực gói: "Theo lượt" không hết hạn và gắn 3 lượt; "Đến ngày thi" đến ngày thi nếu có, nếu không là 60 ngày kể từ hôm nay; "7 ngày" 7 ngày; "30 ngày" 30 ngày. Không giới hạn 60 ngày khi có ngày thi, không kiểm tra ngày thi nằm trong quá khứ. | Kích hoạt gói | FR-billing-015 | S3 apps/web/src/features/billing/plan-utils.ts:3-8, S17 apps/web/src/features/app-state/__tests__/state-and-data.test.ts:131-147 | ✅ |
| BR-billing-003 | Cờ billing chỉ bật khi biến môi trường build tương ứng đúng bằng chuỗi "true"; mặc định tắt. | Khởi tạo ứng dụng | FR-billing-006 | S9 apps/web/src/lib/feature-flags.ts:3, S10 apps/web/src/lib/__tests__/feature-flags.test.ts:6-8 | ✅ |
| BR-billing-004 | Khi cờ billing tắt, không có đường nào trong giao diện ghi gói đang dùng: việc ghi gói chỉ xảy ra trong bảng thanh toán sau kiểm tra cờ. Nhánh duy nhất còn lại là xóa gói. | Chọn gói khi cờ tắt | FR-billing-006, 013 | S4 apps/web/src/features/billing/components/payment-panel.tsx:28-44,52-56 | ✅ |
| BR-billing-005 | Kết quả đã chấm thật luôn được coi là mở khóa (chú thích trong code: "Beta: every scored result is fully unlocked"); dải paywall chỉ hiện ở kết quả không phải kết quả chấm thật và chưa có gói, và chỉ khi `FEATURES.scoring` bật (xem FR-billing-019, OQ-15). | Hiển thị màn kết quả | FR-billing-019 | S12 apps/web/src/features/results/results-screen.tsx:223,258-259,402 | ✅ |
| BR-billing-006 | Hạn 10 phút của mã thanh toán chỉ là số hiển thị; hết hạn không chặn thanh toán hay làm mới mã. | Đồng hồ về 0 | FR-billing-010 | S4 apps/web/src/features/billing/components/payment-panel.tsx:24,46-49 | ✅ |
| BR-billing-007 | Chuyển trạng thái thanh toán một chiều: chờ -> đã nhận tiền (do bấm nút giả lập) -> đã kích hoạt (sau 1200 ms). Không có nhánh thất bại, từ chối, trùng hay số tiền sai. | Bấm nút giả lập | FR-billing-011..013 | S4 apps/web/src/features/billing/components/payment-panel.tsx:14,25,50-58,121 | ✅ |
| BR-billing-008 | Số tiền ghi trên hóa đơn lấy từ giá niêm yết theo mã gói đang dùng, nếu không tìm thấy mã thì 0. Ngày hóa đơn là ngày hiện tại lúc xem, không phải ngày mua. | Xem mục Hóa đơn | FR-billing-018 | S2 apps/web/src/features/billing/billing-screen.tsx:62-66 | ✅ |
| BR-billing-009 | Paywall không hiện khi đã có gói, trừ khi đang trong luồng thanh toán của chính cửa sổ đó. | Mở paywall | FR-billing-021 | S6 apps/web/src/features/billing/components/paywall-modal.tsx:24 | ✅ |
| BR-billing-010 | Quyền lợi "3 lượt chi tiết" của gói Theo lượt chỉ là chữ trên giao diện; trong code không có bộ đếm, trừ lượt hay kiểm tra lượt. Gói hiện chỉ được coi là có/không có (đối tượng gói chỉ gồm mã, tên, hiệu lực dạng chữ). | Dùng gói | FR-billing-001, 015 | S13 apps/web/src/features/app-state/types.ts:53-57, S1 apps/web/src/features/billing/data.ts:14-16 | 🟡 |
| BR-billing-011 | Hiệu lực gói là chuỗi chữ đã định dạng, không có bước kiểm tra hết hạn hay tự dừng; câu "Hết hạn tự dừng, không tự gia hạn" chỉ là quyền lợi dạng chữ. | Gói qua ngày hiệu lực | FR-billing-015 | S13 apps/web/src/features/app-state/types.ts:53-57, S1 apps/web/src/features/billing/data.ts:30 | 🟡 |
| BR-billing-012 | Gói 7 ngày và 30 ngày ghi đơn vị "/ tuần", "/ tháng", gói 30 ngày ghi "Hủy bất cứ lúc nào", nhưng phụ đề trang nói "Không tự gia hạn ngầm". Code không có cơ chế gia hạn hay hủy nên chưa xác định gói chu kỳ có tự gia hạn không. | Chọn gói chu kỳ | FR-billing-001, 004 | S1 apps/web/src/features/billing/data.ts:22,38, S2 apps/web/src/features/billing/billing-screen.tsx:27 | 🟡 |
| BR-billing-013 | Gói "Đến ngày thi" ghi "Tối đa 60 ngày" khi chưa có ngày thi nhưng khi đã có ngày thi, hiệu lực chạy đến ngày thi bất kể xa bao nhiêu. | Chọn gói Đến ngày thi | FR-billing-003, 015 | S5 apps/web/src/features/billing/components/plan-grid.tsx:38, S3 apps/web/src/features/billing/plan-utils.ts:5 | 🟡 |

## 6. Error Matrix

Code không có xử lý lỗi thanh toán (không có gọi mạng, không có nhánh thất bại). Chỉ có các trạng thái đặc biệt dưới đây.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-billing-001 | Cổng thanh toán chưa mở | Cờ billing tắt và người dùng chọn một gói. Wording exact: tiêu đề `Cổng thanh toán sắp ra mắt`; mô tả `Gói {tên gói} đang được tích hợp cổng thanh toán tự động VietQR qua SePay. Trong thời gian thử nghiệm Beta, toàn bộ tính năng đều được mở miễn phí.` | minor | FR-billing-006 | Cửa sổ thanh toán, trạng thái rỗng | Bấm nút "Đóng" (đóng cửa sổ) | S4 apps/web/src/features/billing/components/payment-panel.tsx:28-44, S8 apps/web/src/features/billing/__tests__/billing-gate.test.tsx:15 | ✅ |
| E-billing-002 | Mã thanh toán hết thời gian | Đồng hồ về 0:00 | minor | FR-billing-010 | Dải trạng thái hiện "hết hạn sau 0:00" | Không có thông báo lỗi hay xử lý, người dùng vẫn bấm được nút giả lập. Chưa rõ hành vi mong muốn (OQ-8) | S4 apps/web/src/features/billing/components/payment-panel.tsx:46-49,109, S15 apps/web/src/lib/format.ts:5-6 | 🟡 |
| E-billing-003 | Lỗi mạng / từ chối / sai số tiền | Không tồn tại trong code (không có gọi mạng) | — | FR-billing-007..013 | — | — Không có wording; đánh dấu Gap G-2 | S4 apps/web/src/features/billing/components/payment-panel.tsx:1-127 | 🟡 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-billing-01 | Người dùng kích hoạt được gói sau thanh toán | Không có số đo trong code (không có đo lường, không có sự kiện phân tích) | `<!-- TBD -->` OQ-9 | S4 apps/web/src/features/billing/components/payment-panel.tsx:1-127 | 🟡 |
| SC-billing-02 | Người dùng thấy đúng gói sau kích hoạt (suy từ test, chưa phải chỉ tiêu do PO chốt) | Test luồng (cờ bật bằng mock): hiển thị "Đã kích hoạt gói 7 ngày", trạng thái có gói tên "7 ngày", toast; test không kiểm hiệu lực hay hóa đơn | Test pass | S16 apps/web/src/features/__tests__/slice-c.test.tsx:413-427 | 🟡 |
| SC-billing-03 | Khi cổng tắt, người dùng không thấy QR và không kích hoạt được gói (suy từ test, chưa phải chỉ tiêu do PO chốt) | Test: thấy "Cổng thanh toán sắp ra mắt", không thấy "Quét mã để thanh toán" và "Đã chuyển khoản" | Test pass | S8 apps/web/src/features/billing/__tests__/billing-gate.test.tsx:15-17 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/billing-reverse-erd.md`)

Chỉ có dữ liệu phía giao diện, không có bảng cơ sở dữ liệu cho feature này (xem negative-search):

- **Gói**: mã, tên, giá (đồng), đơn vị, danh sách quyền lợi, cờ nổi bật. 4 bản ghi cố định. ✅ [S1 apps/web/src/features/billing/data.ts:1-40]
- **Gói đang dùng của người dùng**: mã, tên, hiệu lực (chuỗi). Nằm trong trạng thái phiên, tối đa 1. ✅ [S13 apps/web/src/features/app-state/types.ts:53-57,71]
- **Phiên thanh toán (trạng thái cục bộ)**: trạng thái {chờ, đã nhận tiền, đã kích hoạt}, giây còn lại, mã chuyển khoản. Chỉ tồn tại khi bảng mở. ✅ [S4 apps/web/src/features/billing/components/payment-panel.tsx:14,24-26]
- **Hóa đơn**: không phải thực thể lưu trữ; một dòng được tính từ gói đang dùng. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:60-81]
- **Đơn hàng, giao dịch, người đăng ký, thông báo ngân hàng**: không có trong code. 🟡 OQ-1, OQ-2.

## 9. Flows (tóm tắt — chi tiết ở `srs/billing-reverse-flows.md`)

1. **Xem và chọn gói, thanh toán QR mô phỏng, kích hoạt** (cờ bật) hoặc thấy thông báo "sắp ra mắt" (cờ tắt). ✅
2. **Mở khóa từ màn kết quả qua paywall** (cùng bảng thanh toán). ✅
3. **Về gói miễn phí và xem hóa đơn**. ✅

## 10. Screens (tóm tắt)

| Màn / cửa sổ | Mô tả | Nguồn | Nhãn |
|--------------|-------|-------|------|
| Trang Gói & thanh toán (nhãn "S22–S24") | Gói hiện tại, danh sách gói, hóa đơn | S2 apps/web/src/features/billing/billing-screen.tsx:18-98 | ✅ |
| Cửa sổ thanh toán (trong trang) | Bảng QR hoặc thông báo "sắp ra mắt", màn kích hoạt thành công | S4 apps/web/src/features/billing/components/payment-panel.tsx:22-126 | ✅ |
| Cửa sổ paywall (nhãn "S15") | Lợi ích mở khóa, danh sách gói dạng gọn, chuyển sang bảng thanh toán | S6 apps/web/src/features/billing/components/paywall-modal.tsx:17-53 | ✅ |
| Dải paywall mềm trong màn kết quả | Nút "Mở khóa từ 49.000đ" | S11 apps/web/src/features/results/components/soft-paywall.tsx:6-23 | ✅ |
| Bảng giá trang giới thiệu | Cột Miễn phí và 3 gói | S19 apps/web/src/features/landing/components/pricing-teaser.tsx:10-45 | ✅ |

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Cơ chế áp đặt | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Cờ billing đọc lúc build từ biến môi trường `VITE_FEATURE_BILLING`; chỉ bật khi giá trị là "true" | Biến môi trường lúc build web | S9 apps/web/src/lib/feature-flags.ts:3 | ✅ |
| Không tìm thấy nơi nào trong workflow CI hay hạ tầng đặt biến `VITE_FEATURE_BILLING` (đã tìm ở `.github`, `packages/infra`, `apps/web/package.json`, `apps/web/vite.config.ts`); tệp `.env` không đọc được | Chưa xác định (không thấy trong CI/hạ tầng) | S9 apps/web/src/lib/feature-flags.ts:3 | 🟡 |
| Văn bản giao diện tuyên bố giai đoạn "thử nghiệm Beta" mở miễn phí toàn bộ tính năng; code chỉ thực thi phần mở khóa kết quả chấm thật (BR-billing-005), phần "toàn bộ" chưa kiểm chứng | Văn bản giao diện và cờ pro ở màn kết quả | S4 apps/web/src/features/billing/components/payment-panel.tsx:35, S12 apps/web/src/features/results/results-screen.tsx:258-259 | 🟡 |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Cổng thanh toán VietQR qua SePay (nhắc trong thông báo trên giao diện; khóa webhook khai báo ở hạ tầng; chưa có mã dùng) | Chưa rõ (OQ-3) | Thu tiền thật, kích hoạt tự động | S4 apps/web/src/features/billing/components/payment-panel.tsx:35, S20 packages/infra/alchemy.run.ts:51 | 🟡 |
| Backend đơn hàng, webhook, lưu gói theo người dùng, đối soát | Chưa dựng (hạng mục 15, 16 trong lộ trình) | Kích hoạt gói bền vững và đúng người | S21 docs/roadmap-work-items.md:30-31 | 🟡 |
| Ngày thi của người dùng | Hồ sơ người dùng (suy từ nơi gán examDate: apps/web/src/features/app-state/use-profile-hydration.ts:73) | Hiệu lực gói "Đến ngày thi" và dòng phụ | S3 apps/web/src/features/billing/plan-utils.ts:5, S5 apps/web/src/features/billing/components/plan-grid.tsx:18 | 🟡 |
| Email người dùng | Đăng nhập / hồ sơ (suy từ apps/web/src/features/app-state/use-profile-hydration.ts:47) | Mã chuyển khoản, câu "Hóa đơn đã gửi tới" | S4 apps/web/src/features/billing/components/payment-panel.tsx:26,67 | 🟡 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Cờ billing đang TẮT ở môi trường Beta thật, nên người dùng không bao giờ thấy QR | Nếu bật, người dùng sẽ thấy QR giả và tự kích hoạt gói bằng nút giả lập (xem Gap G-3) | S9 apps/web/src/lib/feature-flags.ts:3, S10 apps/web/src/lib/__tests__/feature-flags.test.ts:8 | 🟡 |
| Nhãn "Band tổng không giới hạn" của gói Miễn phí đã lỗi thời | Hạn mức miễn phí mô tả ở FR-billing-004 | S2 apps/web/src/features/billing/billing-screen.tsx:35, S21 docs/roadmap-work-items.md:30 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây là các OQ blocking.

- [ ] OQ-1: Mô hình đơn hàng/giao dịch/người đăng ký sẽ lưu gì (hiện chưa có bảng nào)?
- [ ] OQ-2: Gói của người dùng lưu ở đâu và bền vững thế nào (hiện mất khi tải lại trang)?
- [ ] OQ-3: Cổng thanh toán chính thức là SePay/VietQR? Ai chịu trách nhiệm, khi nào nối?
- [ ] OQ-4: Khi nào bật cờ billing, và điều kiện nào bắt buộc trước khi bật (xóa nút giả lập, QR thật, đối soát)?
- [ ] OQ-15: Paywall chỉ tới được khi cờ `FEATURES.scoring` bật và kết quả không phải chấm thật; cả hai điều kiện hiện đều gần như không xảy ra ở Beta. Paywall là tính năng sống hay chuẩn bị cho sau Beta?
