# billing — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Mô hình đơn hàng / giao dịch / người đăng ký sẽ lưu những gì? Hiện chưa có bảng hay API nào. — *(Mục 8 Data Entities · cần: PO/dev)*
* [ ] OQ-2: Gói của người dùng lưu ở đâu để bền vững (hiện chỉ trong trạng thái phiên, mất khi tải lại trang)? — *(FR-billing-025, Mục 8 · cần: PO/dev)*
* [ ] OQ-3: Cổng thanh toán chính thức có phải SePay/VietQR như thông báo trên giao diện? Ai sở hữu việc nối và khi nào? — *(Mục 11 Dependencies · cần: PO)*
* [ ] OQ-4: Khi nào bật cờ billing, và điều kiện bắt buộc trước khi bật (bỏ nút giả lập, QR thật, đối soát)? — *(BR-billing-003, Mục 11 · cần: PO/dev)*
* [ ] OQ-5: "3 lượt chi tiết" của gói Theo lượt được đếm và trừ thế nào, một lượt là gì? — *(BR-billing-010 · cần: PO/BA)*
* [ ] OQ-6: Hết hiệu lực gói thì hệ thống làm gì (tự về Miễn phí, thông báo)? Hiện hiệu lực chỉ là chữ. — *(BR-billing-011 · cần: PO/BA)*
* [ ] OQ-7: Gói 7 ngày và 30 ngày có tự gia hạn không? Giao diện vừa nói "Không tự gia hạn ngầm" vừa ghi "/ tuần", "/ tháng", "Hủy bất cứ lúc nào". — *(BR-billing-012 · cần: PO)*
* [ ] OQ-8: Khi mã thanh toán hết 10 phút, hành vi mong muốn là gì (làm mới mã, đóng, báo lỗi)? — *(E-billing-002 · cần: PO)*
* [ ] OQ-9: Chỉ số thành công của feature (tỷ lệ chuyển đổi, doanh thu)? Code không đo gì. — *(SC-billing-01 · cần: PO)*
* [ ] OQ-10: Hạn mức thật của gói Miễn phí là gì? Màn billing ghi "Band tổng không giới hạn", trang giới thiệu ghi "3 điểm miễn phí mỗi ngày", hồ sơ ghi "chi tiết bằng chứng của 1 câu yếu nhất". — *(Mục 0.3, FR-billing-004, 023, 026 · cần: PO/BA)*
* [ ] OQ-11: "Hóa đơn" là biên nhận hay hóa đơn VAT, gửi qua email hay tải PDF? Quyết định D-11 nói biên nhận tự động, chưa xuất VAT. — *(FR-billing-014, 018 · cần: PO)*
* [ ] OQ-12: Mức ưu tiên (P0/P1/P2) của từng FR. Code không nói. — *(Mục 3 · cần: PO)*
* [ ] OQ-13: Gói "Đến ngày thi" có giới hạn 60 ngày khi đã có ngày thi không (nhãn "Tối đa 60 ngày" nhưng tính hiệu lực không giới hạn)? Ngày thi ở quá khứ xử lý ra sao? — *(BR-billing-013 · cần: PO/BA)*
* [ ] OQ-15: Paywall chỉ tới được khi `FEATURES.scoring` bật và kết quả không phải chấm thật (apps/web/src/features/results/results-screen.tsx:223); hiện cả hai gần như không xảy ra ở Beta. Paywall là tính năng sống hay chuẩn bị cho sau Beta? — *(FR-billing-019, BR-billing-005 · cần: PO)*
* [ ] OQ-14: Ai là người được mua gói (mọi tài khoản đăng nhập hay chỉ nhóm được phép dùng Beta)? Code không phân biệt quyền. — *(Mục 2 · cần: PO)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| G-1: Mục 8 / Mục 11 | Toàn bộ backend thanh toán: đơn hàng, thông báo ngân hàng, lưu gói, đối soát (xem negative-search). Hạng mục 15, 16 trong lộ trình ghi trạng thái 🔒 | Không thu được tiền thật; "kích hoạt tự động" trên giao diện không có thật | PO + dev |
| G-2: Mục 6 | Lỗi mạng, từ chối, trùng thanh toán, sai số tiền, thanh toán muộn: không có wording | Không có SRS lỗi để viết test | PO/BA |
| G-3: Mục 11 | Giá trị cờ build thực tế ở môi trường chạy (không đọc `.env`, không thấy trong CI) | Không biết người dùng thật có thấy QR giả hay không | DevOps |
| G-4: FR-billing-014 | Cơ chế gửi hóa đơn qua email (câu "Hóa đơn đã gửi tới {email}" không có mã gửi) | Giao diện hứa điều không có | dev |
| G-5: FR-billing-018 | Hóa đơn thật (ngày mua, mã giao dịch, tệp PDF). Hiện ngày là ngày hiện tại, nút tải chỉ hiện thông báo "Đã tải hóa đơn PDF" | Người dùng không nhận được chứng từ | PO/dev |
| G-6: Mục 8 | Không có test cho nút "Về gói miễn phí", mục Hóa đơn, tính toán dòng phụ ngày thi, tự đóng paywall khi đổi trang | Rủi ro hồi quy khi sửa | dev |
| G-7: FR-billing-017 | Hoàn tiền / hủy gói / xác nhận khi về gói miễn phí | Chưa có quy tắc nghiệp vụ | PO |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| Hạn mức Miễn phí | Màn billing: nhãn "Band tổng không giới hạn" (apps/web/src/features/billing/billing-screen.tsx:35) | Trang giới thiệu: "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)" (apps/web/src/features/landing/components/pricing-teaser.tsx:22); hồ sơ: "xem chi tiết bằng chứng của 1 câu yếu nhất" (apps/web/src/features/profile/profile-screen.tsx:398) | Hai nguồn trong code mâu thuẫn; doc lộ trình (docs/roadmap-work-items.md:30) yêu cầu sửa màn billing. Không chọn bên. |
| Tự gia hạn | Phụ đề: "Không tự gia hạn ngầm" (apps/web/src/features/billing/billing-screen.tsx:27) | Gói 30 ngày: "Hủy bất cứ lúc nào"; đơn vị "/ tháng" (apps/web/src/features/billing/data.ts:36-38) | Chưa xác định gói chu kỳ có tự gia hạn |
| Giới hạn gói Đến ngày thi | Nhãn "Tối đa 60 ngày" (apps/web/src/features/billing/components/plan-grid.tsx:38) | Hiệu lực = ngày thi, không cắt 60 ngày (apps/web/src/features/billing/plan-utils.ts:5) | Chỉ nhãn khi chưa có ngày thi nói 60 ngày |
| Lời hứa "kích hoạt tự động" | Văn bản: "Gói kích hoạt tự động ngay khi nhận tiền" (apps/web/src/features/billing/components/payment-panel.tsx:81) | Kích hoạt do nút giả lập "Prototype: giả lập webhook ngân hàng" (apps/web/src/features/billing/components/payment-panel.tsx:120-123) | Giao diện phóng đại so với năng lực thật |
| Chứng từ | D-11: biên nhận điện tử tự động (docs/product-decisions.md:15) | Mục "Hóa đơn" giả lập, 1 dòng tính tại chỗ (apps/web/src/features/billing/billing-screen.tsx:58-92) | Doc là cam kết, code chưa thực hiện |
| Phạm vi hạng mục 15 | Lộ trình: gói 49k "3 lượt mở chi tiết, không hết hạn, không miễn hạn mức" (docs/roadmap-work-items.md:30) | Code chỉ có chữ quyền lợi, không thực thi hạn mức (BR-billing-010) | Lộ trình mô tả đích, code là prototype |

## 4. Inferred assumptions (suy đoán cần verify)

* Cờ billing TẮT ở môi trường Beta thật, nên người dùng thấy "Cổng thanh toán sắp ra mắt" — *validate: kiểm tra biến build `VITE_FEATURE_BILLING` ở pipeline triển khai · nếu sai: người dùng thấy QR giả và tự kích hoạt gói bằng nút giả lập* 🟡
* Backend thanh toán đã được lên kế hoạch nhưng chưa dựng (khóa webhook khai báo ở hạ tầng, plan wi15 nói thêm route webhook và đơn hàng) — *validate: hỏi dev · nếu sai: có backend nằm ngoài repo* 🔵 [packages/infra/alchemy.run.ts:51, plans/261105-0910-wi15-billing-qr/phase-01-don-hang-va-webhook.md:68]
* Mã QR giả và bộ đếm 10 phút là chỗ giữ chỗ cho QR động theo đơn hàng của SePay — *validate: PO/dev · nếu sai: yêu cầu QR tĩnh* 🟡 (ý định, chỉ có comment "mock" và hằng số 600 làm bằng chứng) [apps/web/src/features/billing/components/fake-qr.tsx:3, apps/web/src/features/billing/components/payment-panel.tsx:24]
* Phần phạm vi "S22–S24" và "S15" là mã màn của bản thiết kế prototype — *validate: BA đối chiếu bản thiết kế · nếu sai: mã màn khác* 🟡 [apps/web/src/features/billing/billing-screen.tsx:18,25, apps/web/src/features/billing/components/paywall-modal.tsx:17]

## 5. Quan sát kỹ thuật (không phải yêu cầu nghiệp vụ)

* Trong bảng thanh toán, các hook `useEffect` nằm sau lệnh `return` sớm của nhánh cờ tắt (apps/web/src/features/billing/components/payment-panel.tsx:28-50). Vì cờ cố định theo bản build nên không đổi thứ tự hook trong một phiên, nhưng lệnh này vi phạm quy tắc hook và có thể bị lint cảnh báo. Test cổng (apps/web/src/features/billing/__tests__/billing-gate.test.tsx:9-18) chạy với cờ tắt. 🟡
* Các test luồng thanh toán mock cờ = bật (apps/web/src/features/__tests__/slice-c.test.tsx:5-9); không có test nào chạy luồng QR với cờ tắt ngoài test cổng.

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

| # | Pattern | Scope | Kết quả |
|---|---------|-------|---------|
| N1 | `webhook\|sepay\|vietqr` (không phân biệt hoa thường) | apps/server/src, packages/api/src, packages/db/src/schema | Chỉ apps/server/src/env.ts:34-37 (kiểu biến môi trường). Không có route, handler hay chỗ đọc giá trị |
| N2 | `env.SEPAY\|SEPAY_WEBHOOK` | apps/server/src, packages/api/src (trừ env.ts) | 0 kết quả: khóa được khai báo nhưng không ai dùng |
| N3 | `\b(plan\|price\|orders?\|payment\|subscription\|entitlement\|quota)\b` | packages/db/src/schema | 0 kết quả: không có bảng gói / đơn hàng / thanh toán |
| N4 | `billing\|plan\b\|payment` (trừ test) | packages/api/src | 0 kết quả: không có API cho billing |
| N5 | `trpc\|fetch` | apps/web/src/features/billing | 0 kết quả: feature không gọi mạng |
| N6 | `plan:` (nơi ghi gói, trừ test) | apps/web/src | Chỉ apps/web/src/features/billing/components/payment-panel.tsx:54 (kích hoạt) và apps/web/src/features/billing/billing-screen.tsx:46 (về Miễn phí) |
| N7 | `VITE_FEATURE_BILLING` | .github, packages/infra, apps/web/package.json, apps/web/vite.config.ts | 0 kết quả. Không đọc apps/web/.env* và apps/server/.env.schema (bị chặn quyền riêng tư) nên giá trị cờ thực không xác minh được |
| N8 | `SEPAY` | toàn repo (ts, md, yml), trừ node_modules | Có trong .github/workflows/deploy-beta.yml:78 (secret CI), docs/runbooks/sepay-setup.md, plans/, packages/infra/alchemy.run.ts:51, apps/server/src/env.ts:34-37. Không có mã nguồn ứng dụng nào dùng |

Loại: dead-code-nghi (nút giả lập, QR giả, đồng hồ không có hành vi hết hạn) và cờ tắt (FEATURES.billing).

</details>
