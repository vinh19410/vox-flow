# billing — Evidence base (truy vết code -> luồng)

## §1. Endpoints (điểm vào)

Feature không có endpoint HTTP/RPC (không gọi mạng, xem negative-search N4, N5 ở `reverse-gaps.md`). Điểm vào là route và component giao diện:

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| (route giao diện) | /app/billing | Menu "Gói & thanh toán" | Cần phiên đăng nhập và đã onboarding (`requireOnboarded` ở route cha `/app`) | Xem gói, chọn gói, thanh toán QR mô phỏng | apps/web/src/routes/_proto/app/billing.tsx:5-7 · apps/web/src/routes/_proto/app/route.tsx:7 · apps/web/src/lib/auth-guard.ts:41-57 · apps/web/src/layouts/nav-items.ts:54-60 |
| (mount toàn cục) | cửa sổ paywall | Nút "Mở khóa từ 49.000đ" ở kết quả | như trên | Mở khóa chi tiết từ kết quả | apps/web/src/routes/_proto/route.tsx:30,40 · apps/web/src/features/results/components/soft-paywall.tsx:17 |

## §2. Validation (ràng buộc field)

Không có form nhập liệu. Chỉ có các giá trị suy ra:

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| Nội dung chuyển khoản | "CR" + 4 ký tự đầu email viết hoa hoặc "USER" + "7Q" | hằng số "CR", "USER", "7Q", độ dài 4 | không có | apps/web/src/features/billing/components/payment-panel.tsx:26 | ✅ |
| Đồng hồ đếm ngược | khởi tạo 600, giảm 1 mỗi 1000 ms, hiển thị không dưới 0 | 600 s | không có (không xử lý hết hạn) | apps/web/src/features/billing/components/payment-panel.tsx:24,46-49 · apps/web/src/lib/format.ts:5-6 | ✅ |
| Độ trễ kích hoạt | sau khi nhận tiền 1200 ms | 1200 ms | không có | apps/web/src/features/billing/components/payment-panel.tsx:56 | ✅ |
| Ngày thi | dùng cho hiệu lực "Đến ngày thi" | không kiểm tra quá khứ / giới hạn 60 ngày | không có | apps/web/src/features/billing/plan-utils.ts:5 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-billing-001 | Cờ billing tắt, chọn gói | Tiêu đề `Cổng thanh toán sắp ra mắt`; mô tả `Gói ${plan.name} đang được tích hợp cổng thanh toán tự động VietQR qua SePay. Trong thời gian thử nghiệm Beta, toàn bộ tính năng đều được mở miễn phí.`; nút `Đóng` | Bấm Đóng | apps/web/src/features/billing/components/payment-panel.tsx:28-44 (không có catalog lỗi riêng) · test apps/web/src/features/billing/__tests__/billing-gate.test.tsx:15 | ✅ |
| E-billing-002 | Đồng hồ về 0:00 | Không có thông báo (dải vẫn ghi "hết hạn sau 0:00") | Không có | apps/web/src/features/billing/components/payment-panel.tsx:109 | 🟡 |
| E-billing-003 | Lỗi mạng / từ chối / sai số tiền | Không tồn tại (không có gọi mạng) | — | apps/web/src/features/billing/components/payment-panel.tsx:1-127 | 🟡 |

Không có `TRPCError` hay mã lỗi server nào cho feature này.

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Giá 4 gói | Hiển thị / thanh toán | 49000, 99000, 349000, 249000 | có: PLANS có 4 phần tử (apps/web/src/features/app-state/__tests__/state-and-data.test.ts:126); giá chưa test trực tiếp | apps/web/src/features/billing/data.ts:14,21,28,36 | ✅ |
| Hiệu lực gói | Kích hoạt | pack: "Không hết hạn · 3 lượt"; week +7; month +30; exam: ngày thi hoặc +60 | có (apps/web/src/features/app-state/__tests__/state-and-data.test.ts:131-147) | apps/web/src/features/billing/plan-utils.ts:3-8 | ✅ |
| Cờ billing mặc định tắt | Khởi tạo | so sánh chuỗi "true" | có (apps/web/src/lib/__tests__/feature-flags.test.ts:8) | apps/web/src/lib/feature-flags.ts:3 | ✅ |
| Cổng tắt không hiện QR / nút giả lập | Mở bảng thanh toán | — | có (apps/web/src/features/billing/__tests__/billing-gate.test.tsx:15-17) | apps/web/src/features/billing/components/payment-panel.tsx:28-44 | ✅ |
| Chuyển trạng thái chờ -> nhận tiền -> kích hoạt | Bấm nút giả lập | 1200 ms | có, cờ bị mock bật (apps/web/src/features/__tests__/slice-c.test.tsx:419-427) | apps/web/src/features/billing/components/payment-panel.tsx:50-58,121 | ✅ |
| Kết quả chấm thật luôn mở khóa | Hiển thị kết quả | — | không | apps/web/src/features/results/results-screen.tsx:258-259 | ✅ |
| Paywall ẩn khi đã có gói | Mở paywall | — | không | apps/web/src/features/billing/components/paywall-modal.tsx:24 | ✅ |
| Paywall đóng khi đổi route | Đổi đường dẫn | — | không | apps/web/src/features/app-state/app-state-provider.tsx:15-20 | ✅ |
| Gói không persist | Tải lại trang | chỉ lưu mode, voice, practice, scoringAttempt | không | apps/web/src/features/app-state/store.tsx:94-107 | ✅ |
| Đếm lượt của gói Theo lượt, hết hạn tự dừng | Dùng gói | — | không có mã | apps/web/src/features/billing/data.ts:14-16,30 | 🟡 |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| Plan (cố định phía giao diện) | id, name, price, unit, perks[], best? | — | apps/web/src/features/billing/data.ts:1-8 |
| ActivePlan (trạng thái phiên) | id, name, until | AppState.plan 0..1 | apps/web/src/features/app-state/types.ts:53-57,71 |
| PaymentStatus (cục bộ) | waiting, received, active | thuộc bảng thanh toán | apps/web/src/features/billing/components/payment-panel.tsx:14 |
| paywallOpen (trạng thái phiên) | boolean | điều khiển cửa sổ paywall | apps/web/src/features/app-state/types.ts:96-98 |

## §6. Cross-repo hops (điểm nghiệp vụ -> luồng liên quan)

— không có hop chéo repo. Toàn bộ chạy trong một tiến trình (trình duyệt, trạng thái React). Khóa webhook SePay được khai báo ở hạ tầng (packages/infra/alchemy.run.ts:51) và kiểu môi trường server (apps/server/src/env.ts:34-37) nhưng không có mã nào dùng (N1, N2), nên chưa tạo hop.

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Backend thanh toán vắng hoàn toàn — *(negative-search N1..N5, N8 trong reverse-gaps.md · loại: code-câm)*
* QR giả, nút "Đã chuyển khoản" giả lập webhook — *(apps/web/src/features/billing/components/fake-qr.tsx:3, apps/web/src/features/billing/components/payment-panel.tsx:120 · loại: dead-code-nghi / prototype)*
* Cờ FEATURES.billing mặc định tắt, giá trị thực ở môi trường chạy không xác minh được — *(N7 · loại: cờ tắt)*
* Hóa đơn tính tại chỗ, nút tải chỉ có toast — *(apps/web/src/features/billing/billing-screen.tsx:58-92 · loại: fake-data)*
* Thông báo "Hóa đơn đã gửi tới {email}" không có mã gửi — *(apps/web/src/features/billing/components/payment-panel.tsx:67 · loại: code-câm)*
