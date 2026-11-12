---
type: reverse-srs-states
feature: landing-page
updated: 2026-11-11
---

# landing-page — States tái lập (reverse)

## Không vẽ stateDiagram — lý do

Feature không có thực thể nghiệp vụ nhiều trạng thái: trang chủ và trang điều khoản là nội dung tĩnh, không lưu dữ liệu, không có vòng đời bản ghi. Trạng thái duy nhất ở phía giao diện là phiên đăng nhập đang tải/có/không có (thuộc khung chứa, không thuộc feature) và đường dẫn hiện tại. Trong các file đã đọc không có state máy (không `useState` trong landing, không enum trạng thái). ✅ [apps/web/src/features/landing/landing-screen.tsx:9-47; apps/web/src/features/landing/components/hero.tsx:14-93; apps/web/src/routes/_proto/route.tsx:29-44]

Gói dịch vụ (Plan) chỉ là dữ liệu tĩnh, không có trạng thái; trạng thái thanh toán (waiting/received/active) thuộc feature billing, ngoài scope. ✅ [apps/web/src/features/billing/components/payment-panel.tsx:14]

Lược bỏ có chủ đích theo brief ("feature đơn giản được lược states/erd nếu code không đủ").

**Ghi chú trạng thái hiển thị (không phải entity):**

| Trạng thái | Ý nghĩa | Vào bằng | Ra bằng | Nguồn | Nhãn |
|-----------|---------|----------|---------|-------|------|
| Phiên đang tải | Người dùng coi là chưa xác định | Khung proto khởi tạo | Phiên trả kết quả | apps/web/src/routes/_proto/route.tsx:32-33 | ✅ |
| Có phiên / không có phiên | Hồ sơ được nạp vào trạng thái ứng dụng nếu có phiên; trang vẫn như nhau | Phiên trả kết quả | — | apps/web/src/routes/_proto/route.tsx:33-35 | ✅ |
