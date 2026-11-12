# landing-page — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | apps/web/src/features/landing/landing-screen.tsx:1-48 | code (tsx) | — | high | OK | Mục 3 (header, CTA, footer), Mục 10 |
| S2 | apps/web/src/features/landing/components/hero.tsx:1-93 | code (tsx) | — | high | OK | Mục 3, 5 (hero, số liệu, thẻ xem trước), Mục 10 |
| S3 | apps/web/src/features/landing/components/promises-section.tsx:1-39 | code (tsx) | — | high | OK | Mục 3, 5 (4 lời hứa, 4 bước) |
| S4 | apps/web/src/features/landing/components/pricing-teaser.tsx:1-51 | code (tsx) | — | high | OK | Mục 3, 5 (bảng giá) |
| S5 | apps/web/src/features/billing/data.ts:1-40 | code (ts, dữ liệu gói) | — | high | OK | Mục 3, 5 (giá, perks) |
| S6 | apps/web/src/routes/_proto/index.tsx:1-7 | code (route) | — | high | OK | Mục 1, 10 (route `/`) |
| S7 | apps/web/src/routes/_proto/route.tsx:1-44 | code (layout route) | — | high | OK | Mục 11 (layout, ép light, session hydration), Mục 10 |
| S8 | apps/web/src/routes/_proto/terms.tsx:1-103 | code (route + nội dung điều khoản) | — | high | OK | Mục 3, 5, 10 (trang điều khoản) |
| S9 | apps/web/src/routes/__root.tsx:15-34 | code (root route, meta) | — | high | OK | Mục 3 (title/description) |
| S10 | apps/web/src/lib/auth-guard.ts:1-70 | code (guard) | — | high | OK | Mục 5 (landing KHÔNG dùng guard — đối chiếu) |
| S11 | apps/web/src/features/app-state/routes.ts:7-22; apps/web/src/features/app-state/types.ts:7-21; apps/web/src/features/app-state/app-state-provider.tsx:22-24 | code (điều hướng) | — | high | OK | Mục 3, 9 (đích điều hướng) |
| S12 | apps/web/src/features/__tests__/slice-a.test.tsx:119-176 | test active (landing) | — | high | OK | Mục 3, 5, Evidence |
| S13 | packages/api/src/scoring/config.ts:1-70; packages/api/src/scoring/aggregate.ts:34-73 | code backend (chấm điểm) | — | high | OK | Đối chiếu "chấm 3 lần lấy trung vị" |
| S14 | apps/web/src/features/results/results-screen.tsx:254-259,332-340; apps/web/src/features/results/components/band-hero.tsx:16-28; apps/web/src/features/results/components/soft-paywall.tsx:6-24 | code (màn kết quả) | — | high | OK | Đối chiếu "khoảng tin cậy", "chi tiết 4 tiêu chí cần trả phí", "Báo lỗi chấm" |
| S15 | packages/api/src/routers/dispute.ts:24-33; packages/infra/alchemy.run.ts:56 | code backend (cờ báo lỗi chấm) | — | high | OK | Đối chiếu "Báo lỗi chấm" |
| S16 | apps/web/src/features/billing/components/payment-panel.tsx:22-44; apps/web/src/lib/feature-flags.ts:1-4; apps/web/src/features/billing/__tests__/billing-gate.test.tsx:9-18 | code + test (cổng thanh toán, cờ) | — | high | OK | Đối chiếu "Thanh toán QR tự kích hoạt" |
| S17 | packages/api/src/routers/scoring.ts:55-110; packages/api/src/scoring/retry-limits.ts:1-17 | code backend (quota retry) | — | high | OK | Đối chiếu "3 điểm miễn phí mỗi ngày" |
| S18 | apps/web/src/features/app-state/initial-state.ts:1-20; packages/api/src/routers/privacy.ts:1-70 | code (consent mặc định) | — | high | OK | Đối chiếu "0 giọng nói dùng huấn luyện" |
| S19 | apps/web/src/features/auth/auth-screen.tsx:255-272; apps/web/src/routes/_proto/auth.tsx:1-22 | code (điểm vào/ra auth) | — | high | OK | Mục 3 (đích CTA), liên kết điều khoản |
| S20 | apps/web/src/layouts/screen-map.tsx:16,29,88,101; apps/web/src/layouts/__tests__/app-shell.test.tsx:30 | code + test | — | high | OK | Mã màn S01, S25 |
| S21 | apps/web/src/features/billing/data.ts:1-40 và apps/web/src/lib/format.ts:1 | code | — | high | OK | Định dạng giá `vnd` |
| S22 | apps/web/src/features/exam/data.ts:68; packages/api/src/exam/fallback-data.ts:14-20 | code | — | medium | OK | Đối chiếu "hỏi nối tiếp kể cả Part 1" |

## Ghi chú nguồn

- Không có tài liệu sản phẩm (PRD/roadmap) được đối chiếu trong phiên này; mọi "vì sao/cho ai" để 🟡.
- Phạm vi: chỉ đọc source, không chạy test, không đọc node_modules.
