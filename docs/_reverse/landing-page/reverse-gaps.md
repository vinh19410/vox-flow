# landing-page — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)" có cơ chế hệ thống nào thực hiện không? Backend chỉ có hạn mức thử chấm lại thủ công 3 lần/ngày (lịch Việt Nam), 1 lần/bài — khác đối tượng. — *(liên quan: Mục 5 BR-005, FR-010/013/015 · cần: PO + dev quyết)*
* [ ] OQ-2: Lời hứa "khoảng tin cậy" (hero, thẻ miễn phí, lời hứa 1 và 3) có cần giữ hay sửa, khi kết quả chấm thật chỉ trả một band và không trả khoảng? — *(liên quan: BR-010, FR-009/012/013/015 · cần: PO)*
* [ ] OQ-3: Lời hứa "chi tiết 4 tiêu chí mới cần trả phí" lệch với chế độ Beta đang mở khoá toàn bộ kết quả đã chấm. Trang nên mô tả theo hiện trạng Beta hay theo mô hình thương mại dự kiến? — *(liên quan: BR-006 · cần: PO)*
* [ ] OQ-4: Cổng thanh toán QR: biến build `VITE_FEATURE_BILLING` ở môi trường thật là bật hay tắt? Nếu tắt, bảng giá và câu "Thanh toán QR tự kích hoạt trong vài giây" có nên kèm ghi chú "sắp ra mắt"? — *(liên quan: BR-007 · cần: PO + dev)*
* [ ] OQ-5: Cờ máy chủ `SCORE_DISPUTE_ENABLED` ở môi trường thật là bật hay tắt? (mặc định `false`). Nếu tắt, lời hứa "Bấm “Báo lỗi chấm”" và đoạn điều khoản về phúc khảo mô tả tính năng chưa có. — *(liên quan: BR-008, BR-016 · cần: PO + dev)*
* [ ] OQ-6: Người đã đăng nhập mở lại trang gốc có nên được chuyển vào ứng dụng không? Hiện không chuyển và vẫn thấy nút "Đăng nhập". — *(liên quan: FR-002, BR-019 · cần: PO)*
* [ ] OQ-7: Nút "Thi thử miễn phí" và "Thi thử ngay — miễn phí" dẫn tới màn đăng nhập, không phải thi thử thật cho khách; "Không cần thẻ" có nghĩa chỉ là chưa thu thẻ lúc đăng ký? — *(liên quan: BR-001, FR-008/010 · cần: PO)*
* [ ] OQ-8: Số liệu "±0.5 độ chênh mục tiêu giữa 3 lần chấm" và "< 2s từ lúc vào trang đến lúc ghi âm" lấy từ đâu (đo hay mục tiêu)? Ai chịu trách nhiệm cập nhật? — *(liên quan: BR-014, FR-011 · cần: PO/BA)*
* [ ] OQ-9: Lời hứa "AI hỏi tiếp dựa trên chính câu trả lời của bạn — kể cả Part 1": backend có thủ tục sinh câu hỏi nối tiếp bằng mô hình ngôn ngữ (có dự phòng câu cố định), nhưng mã web không gọi nó. Thủ tục này có được nối tới giao diện thi ở bản thật không, và khoá API có được đặt không? — *(liên quan: BR-012, FR-013 · cần: dev)*
* [ ] OQ-10: "0 giọng nói dùng huấn luyện nếu bạn không bật" — khoá `train` chỉ là bí danh của đồng ý hiệu chỉnh và bài thi luôn đặt cờ hiệu chỉnh là tắt; cam kết "nếu bạn không bật" hiện không có nút bật nào. Cần xác nhận cam kết này với bên pháp chế. — *(liên quan: BR-013, FR-011 · cần: PO/pháp chế)*
* [ ] OQ-11: Ai sở hữu và duyệt nội dung điều khoản, và "Cập nhật lần cuối: Tháng 11/2026" cập nhật khi nào? Trang không có kênh liên hệ cụ thể (email/biểu mẫu). — *(liên quan: FR-022/024 · cần: PO/pháp chế)*
* [ ] OQ-12: Vì sao gói "30 ngày" (249.000đ) bị ẩn khỏi trang chủ nhưng vẫn có trong danh sách gói? Vì sao "Đến ngày thi" là gói "Phổ biến"? — *(liên quan: BR-002/003 · cần: PO)*
* [ ] OQ-13: Mục tiêu nghiệp vụ và chỉ số thành công của trang chủ (chuyển đổi đăng ký, v.v.) là gì? Không có sự kiện phân tích nào trong code của feature. — *(liên quan: Mục 7 SC-01 · cần: PO)*
* [ ] OQ-14: Priority P0/P1/P2 của từng FR/NFR. — *(liên quan: Mục 3, 4 · cần: PO)*
* [ ] OQ-15: Ai là owner nghiệp vụ của danh sách gói/giá (billing), màn đăng nhập (auth) và khung proto? Code chỉ cho biết vị trí module, owner là suy luận. — *(liên quan: Mục 11 Dependencies · cần: PO)*
* [ ] OQ-16: Việc không có Open Graph, canonical, sitemap, robots cho trang chủ là có chủ đích hay chưa làm? — *(liên quan: NFR-007 · cần: PO/dev)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 2 Actors | Persona thật của "học viên" (trình độ, mục tiêu) | Không đánh giá được nội dung phù hợp | PO |
| Mục 3 Priority | Priority từng FR | Không xếp thứ tự triển khai/kiểm thử | PO |
| Mục 4 NFR | Ngưỡng hiệu năng, a11y, SEO (Open Graph, canonical) có chủ đích | NFR chỉ là mô tả hiện trạng | PO/dev |
| Mục 7 Success | Chỉ số đo hiệu quả trang và nguồn đo | Không xác định "thành công" | PO |
| Mục 8 | Không có thực thể dữ liệu máy chủ; ERD rút gọn | — | — |
| Điều khoản | Phiên bản, ngày hiệu lực, cơ chế người dùng chấp nhận điều khoản (không thấy lưu sự đồng ý điều khoản) | Không chứng minh được việc chấp nhận | pháp chế/dev |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói (UI trang chủ) | Nguồn B nói (hành vi hệ thống thật) | Ghi chú (ngày/độ tin cậy) |
|------|----------------------------|-------------------------------------|---------------------------|
| Hạn mức miễn phí | "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)" (apps/web/src/features/landing/components/pricing-teaser.tsx:22) | Không có cơ chế điểm theo ngày; chỉ có hạn mức thử chấm lại 3 lần/ngày, 1 lần/bài (packages/api/src/routers/scoring.ts:72-74) | Chưa kết luận lệch hay thiếu cơ chế; xem OQ-1 |
| Khoảng tin cậy | "Mỗi bài có band tổng + khoảng tin cậy"; thẻ mẫu 6.0 – 7.0 (apps/web/src/features/landing/components/promises-section.tsx:13; apps/web/src/features/landing/components/hero.tsx:64) | Kết quả đã chấm không có khoảng (apps/web/src/features/results/results-screen.tsx:254-255); máy chủ không trả khoảng (packages/api/src/routers/scoring.ts:56) | Lệch rõ; OQ-2 |
| Chi tiết 4 tiêu chí trả phí | "chi tiết 4 tiêu chí mới cần trả phí" (apps/web/src/features/landing/components/promises-section.tsx:13) | Kết quả đã chấm mở khoá toàn bộ trong Beta (apps/web/src/features/results/results-screen.tsx:258-259) | Lệch; OQ-3 |
| Thanh toán QR | "Thanh toán QR tự kích hoạt trong vài giây" (apps/web/src/features/landing/components/pricing-teaser.tsx:15) | Cổng tắt theo cờ, hiện "Cổng thanh toán sắp ra mắt" (apps/web/src/features/billing/components/payment-panel.tsx:28-35); không CI/hạ tầng nào đặt biến cờ (chỉ apps/web/src/lib/feature-flags.ts:3) | Phụ thuộc cờ môi trường thật; OQ-4 |
| Báo lỗi chấm | "Bấm “Báo lỗi chấm”" (apps/web/src/features/landing/components/promises-section.tsx:14) | Cờ máy chủ mặc định tắt, workflow beta cũng mặc định tắt khi biến repo trống; lỗi "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" (packages/infra/alchemy.run.ts:56; .github/workflows/deploy-beta.yml:85; packages/api/src/routers/dispute.ts:30-31) | Phụ thuộc cờ môi trường thật; OQ-5 |
| Số lần chấm | "Chấm 3 lần lấy trung vị" (apps/web/src/features/landing/components/hero.tsx:28) | Mặc định 3 khớp, nhưng cấu hình 1-7 (packages/api/src/scoring/config.ts:2-3; packages/api/src/scoring/config.ts:63-68) | Khớp theo mặc định; sai nếu môi trường đặt giá trị khác |
| Điều khoản và cờ báo lỗi | Điều khoản mục 3 nhắc "hỗ trợ phúc khảo (dispute) khi bạn yêu cầu" (apps/web/src/routes/_proto/terms.tsx:62) | Tính năng mặc định tắt (packages/infra/alchemy.run.ts:56) | Không diễn giải pháp lý; OQ-5 |

## 4. Inferred assumptions (suy đoán cần verify)

* Giá/gói trên trang là dự kiến thương mại, chưa thu tiền vì ứng dụng ở Beta — *validate: PO xác nhận lộ trình bật thanh toán · nếu sai: bảng giá phải đổi hoặc ghi chú* (🟡, ý đồ sản phẩm; dựa trên apps/web/src/features/billing/components/payment-panel.tsx:35 và apps/web/src/features/results/results-screen.tsx:258).
* Thẻ xem trước ở hero là minh hoạ marketing, không phải kết quả thật — *validate: PO · nếu sai: cần lấy dữ liệu thật* (🟡, ý định minh hoạ là suy luận; dữ liệu cứng ở apps/web/src/features/landing/components/hero.tsx:8-13 và :55).

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

- `beforeLoad|requireSession|requireOnboarded` trong `apps/web/src/routes/_proto/index.tsx`: không có → trang gốc không dùng guard; `requireOnboarded` được dùng ở `apps/web/src/routes/_proto/app/route.tsx:7`, `exam.tsx:7`, `scoring.tsx:7`; `requireSession` ở `onboarding.tsx:9`. `auth-guard.ts` chỉ chuyển hướng người CHƯA đăng nhập (`apps/web/src/lib/auth-guard.ts:24-33`), không có đường chuyển hướng người đã đăng nhập khỏi trang gốc.
- `openPaywall|go\("billing"\)|PaywallModal|ScreenMap` trong `apps/web/src/features/landing/`: không có.
- `FREE_DAILY|freeDaily|DAILY_.*(POINT|CREDIT|QUOTA)|dailyPoints|daily_points` trong `apps`, `packages` (trừ node_modules): không có → không thấy hằng số "3 điểm/ngày".
- `quota|credit|entitle|allowance` trong `packages/api/src`: chỉ gặp quota thử chấm lại (`scoring.ts`, `retry-limits.ts`); không có entitlement/credit theo gói. Không có router billing trong `packages/api/src/routers` (liệt kê: attempt, dispute, dispute-admin, forecast, forecast-admin, index, privacy, profile, scoring).
- `train` trong `packages/api/src` (trừ test): chỉ ở `routers/privacy.ts` (lược đồ, bí danh của `calibration` tại :83 và :110), không có chỗ đọc để huấn luyện; `requireExamConsent` (packages/api/src/exam/consent.ts:12-18) luôn trả cờ hiệu chỉnh tắt.
- `getFollowUp|generateFollowUp` trong `apps/web/src` (trừ test): không có nơi gọi; định nghĩa ở `packages/api/src/routers/attempt.ts:144` và `packages/api/src/exam/follow-up.ts:24`.
- `VITE_FEATURE_BILLING` trong `.github`, `packages/infra`, cấu hình vite, toàn repo (trừ `.env*`, `plans`, `node_modules`): chỉ ở `apps/web/src/lib/feature-flags.ts:3`. Các file `.env*` không được đọc.
- `og:|canonical|sitemap` trong `apps/web` (ts, tsx, html): không có thẻ nào liên quan trang chủ.
- `analytics|gtag|posthog|plausible` trong `apps/web/src/features/landing`: không có.
- Test skip/todo trong khối `describe("LandingScreen")` của `apps/web/src/features/__tests__/slice-a.test.tsx:119-176`: không có `it.skip`/`it.todo`. Không có test riêng cho trang điều khoản (chỉ test liên kết tới điều khoản ở màn đăng nhập, slice-a.test.tsx:765-771 và từ footer, :174-176).
- `ScreenMap` (bản đồ màn hình): chỉ dev (`apps/web/src/routes/_proto/route.tsx:41`), không phải hành vi sản phẩm.

</details>
