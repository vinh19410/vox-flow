# landing-page — Evidence base (truy vết code → luồng)

## §1. Endpoints (điểm vào)

Feature không gọi API nghiệp vụ. Điểm vào là route trình duyệt:

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| GET (route client) | `/` | Landing (S01) | Không (không guard) | Giới thiệu sản phẩm | apps/web/src/routes/_proto/index.tsx:5-7 |
| GET (route client) | `/terms` | Điều khoản (S25) | Không (không guard) | Đọc điều khoản | apps/web/src/routes/_proto/terms.tsx:7-9 |
| điều hướng | `/auth` | Đích của CTA | Không | Đăng nhập/đăng ký | apps/web/src/features/app-state/routes.ts:9 |
| đọc phiên (client SDK) | phiên Better Auth | Khung `_proto` | Không bắt buộc | Nạp hồ sơ vào state nếu có phiên | apps/web/src/routes/_proto/route.tsx:31-35 |

## §2. Validation (ràng buộc field)

Không có field nhập liệu trên trang chủ/điều khoản. — không áp dụng.

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| — | — | — | — | — | — |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-landing-page-001 | Hook ngữ cảnh gọi ngoài provider | "useApp must be used within AppStateProvider" | Không (lỗi lập trình) | apps/web/src/features/app-state/types.ts:116-118 · không có catalog | ✅ |
| E-landing-page-002 | Phiên lỗi/chưa đăng nhập | Không có thông báo | Trang vẫn hiển thị | apps/web/src/routes/_proto/route.tsx:32-33 | 🔵 |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Quota hiển thị "3 điểm/ngày" (Full Test 3, Part 1) | Hiển thị | 3 | có (apps/web/src/features/__tests__/slice-a.test.tsx:143) | apps/web/src/features/landing/components/pricing-teaser.tsx:22 | ✅ (UI) |
| Quota backend thử chấm lại | Retry chấm | 3/ngày, 1/bài, ngày VN UTC+7 | không đọc (chỉ UI landing) | packages/api/src/routers/scoring.ts:72-74; packages/api/src/routers/scoring.ts:119; packages/api/src/scoring/retry-limits.ts:1-17 | ✅ |
| Số lần chấm | Chấm bài | mặc định 3, hợp lệ 1-7 | không đọc | packages/api/src/scoring/config.ts:2-3; packages/api/src/scoring/config.ts:63-68 | ✅ |
| Tổng hợp band | Chấm bài | trung vị từng tiêu chí, trung bình 4 trung vị, làm tròn IELTS | không đọc | packages/api/src/scoring/aggregate.ts:34-73 | ✅ |
| Gói "month" bị lọc khỏi landing | Hiển thị giá | id "month" | có (slice-a.test.tsx:126-127) | apps/web/src/features/landing/components/pricing-teaser.tsx:30 | ✅ |
| Giá các gói | Hiển thị giá | 49.000 / 99.000 / 349.000 / 249.000 (ẩn) | có một phần (tên gói) | apps/web/src/features/billing/data.ts:14,21,28,36 | ✅ |
| Mở khoá kết quả đã chấm trong Beta | Xem kết quả | pro=true khi đã chấm | không đọc | apps/web/src/features/results/results-screen.tsx:258-259 | ✅ |
| Cờ billing | Chọn gói | `VITE_FEATURE_BILLING === "true"` | có (billing-gate.test.tsx:9-18) | apps/web/src/lib/feature-flags.ts:1-4 | ✅ |
| Cờ báo lỗi chấm | Gửi báo lỗi | `SCORE_DISPUTE_ENABLED === "true"`, mặc định "false" | không đọc | packages/infra/alchemy.run.ts:56; packages/api/src/routers/dispute.ts:27 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| Gói dịch vụ (tĩnh, phía client) | id, name, price, unit, perks, best | Không có quan hệ DB | apps/web/src/features/billing/data.ts:1-40 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

— không có hop chéo repo. Feature chạy một tiến trình (trình duyệt); nội dung tĩnh, chỉ điều hướng phía client tới `/auth` và `/terms`. Phiên đăng nhập đọc qua SDK client của khung chứa, không phải hop riêng của feature (apps/web/src/routes/_proto/route.tsx:31-35).

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Cơ chế thật của "3 điểm miễn phí mỗi ngày" — *(negative-search: `FREE_DAILY|freeDaily|DAILY_.*(POINT|CREDIT|QUOTA)|dailyPoints|daily_points` trong apps, packages · loại: code-câm)*
* Khoảng tin cậy không trả cho kết quả chấm thật — *(results-screen.tsx:254-255, scoring.ts:56 · loại: lệch UI/hệ thống)*
* Cổng thanh toán tắt theo cờ, dữ liệu QR giả (thành phần `FakeQR` trong billing) — *(payment-panel.tsx:10,28 · loại: dead-code-nghi/cờ tắt)*
* Cờ báo lỗi chấm mặc định tắt — *(alchemy.run.ts:56 · loại: cờ tắt)*
* Dữ liệu thẻ xem trước hero là cứng (prototype/minh hoạ) — *(hero.tsx:8-13,53-89 · loại: fake-data minh hoạ)*
* Không có test riêng cho trang điều khoản và nav anchor; `it.skip/todo`: không có trong khối landing — *(slice-a.test.tsx:119-176 · loại: code-câm)*
