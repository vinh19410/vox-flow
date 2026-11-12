# billing — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | apps/web/src/features/billing/data.ts:1-40 | code (dữ liệu gói) | — | high | OK | Mục 3 FR-001..003, Mục 5 BR-001, Mục 8 |
| S2 | apps/web/src/features/billing/billing-screen.tsx:1-98 | code (màn) | — | high | OK | Mục 3 FR-004,005,017,018, Mục 10 |
| S3 | apps/web/src/features/billing/plan-utils.ts:1-9 | code | — | high | OK | Mục 3 FR-015, Mục 5 BR-002 |
| S4 | apps/web/src/features/billing/components/payment-panel.tsx:1-127 | code (bảng thanh toán) | — | high | OK | Mục 3 FR-006..016, Mục 5, Mục 6, Flows, States |
| S5 | apps/web/src/features/billing/components/plan-grid.tsx:1-62 | code | — | high | OK | Mục 3 FR-002,003,005 |
| S6 | apps/web/src/features/billing/components/paywall-modal.tsx:1-54 | code | — | high | OK | Mục 3 FR-020..022 |
| S7 | apps/web/src/features/billing/components/fake-qr.tsx:1-36 | code (QR mô phỏng) | — | high | OK | Mục 3 FR-008 |
| S8 | apps/web/src/features/billing/__tests__/billing-gate.test.tsx:1-19 | test (active) | — | high | OK | FR-006, E-billing-001 |
| S9 | apps/web/src/lib/feature-flags.ts:1-4 | code (cờ) | — | high | OK | BR-003, Mục 11 |
| S10 | apps/web/src/lib/__tests__/feature-flags.test.ts:5-9 | test (active) | — | high | OK | BR-003 |
| S11 | apps/web/src/features/results/components/soft-paywall.tsx:1-24 | code | — | high | OK | FR-019 |
| S12 | apps/web/src/features/results/results-screen.tsx:223,259,306-308,402; apps/web/src/features/results/components/review-list.tsx:60-62 | code | — | high | OK | FR-019, BR-005 |
| S13 | apps/web/src/features/app-state/types.ts:53-57,71,96-98; store.tsx:7,94-107,123-124; initial-state.ts:10; app-state-provider.tsx:15-20 | code (state) | — | high | OK | FR-013,022,025, Mục 8, States |
| S14 | apps/web/src/routes/_proto/route.tsx:7,30,40; apps/web/src/routes/_proto/app/route.tsx:7; apps/web/src/lib/auth-guard.ts:24-57; apps/web/src/routes/_proto/app/billing.tsx:1-7; apps/web/src/layouts/nav-items.ts:54-60 | code (route/mount/menu) | — | high | OK | FR-024, Mục 10 |
| S15 | apps/web/src/lib/format.ts:1-11 | code (helper định dạng) | — | high | OK | FR-002,010 |
| S16 | apps/web/src/features/__tests__/slice-c.test.tsx:5-9,413-455 | test (active, cờ bị mock = true) | — | high | OK | FR-005..014, FR-020 |
| S17 | apps/web/src/features/app-state/__tests__/state-and-data.test.ts:124-148 | test (active) | — | high | OK | FR-015, BR-002 |
| S18 | apps/web/src/layouts/user-card.tsx:38; apps/web/src/layouts/bottom-nav.tsx:58; apps/web/src/features/profile/profile-screen.tsx:378-401 | code (nơi hiển thị gói) | — | high | OK | FR-023, Conflict |
| S19 | apps/web/src/features/landing/components/pricing-teaser.tsx:10-45; apps/web/src/features/__tests__/slice-a.test.tsx:118-135 | code + test | — | high | OK | FR-026, Conflict |
| S20 | packages/infra/alchemy.run.ts:51; apps/server/src/env.ts:34-37 | code (khai báo biến môi trường) | — | high | OK | Mục 11 Dependencies, gaps negative-search |
| S21 | docs/roadmap-work-items.md:30-31 | doc (đối chiếu Conflict, không dùng làm fact) | — | medium | OK | Mục 0.3, Conflict |
| S22 | docs/product-decisions.md:15 (D-11) | doc (đối chiếu, không dùng làm fact) | 2026-11-05 | medium | OK | Mục 0.3, Conflict |
| S23 | plans/261105-0910-wi15-billing-qr/phase-01-don-hang-va-webhook.md:59,68 | plan (nháp thiết kế backend, chỉ để 🔵) | — | low | OK | Inferred (backend chưa dựng) |
| S24 | apps/web/src/components/ds/modal.tsx:19-37 | code (cửa sổ dùng chung: Escape/nền mờ đóng) | — | high | OK | FR-005 |

## Ghi chú nguồn

- Fact lấy từ code/test (S1..S20). S21..S23 là tài liệu, chỉ dùng đối chiếu Conflict/Inferred; không nâng thành fact.
- Test duy nhất cho gate tắt cờ là S8 (chạy với cờ mặc định tắt). Các test luồng thanh toán (S16) mock cờ = bật (`slice-c.test.tsx:5-9`), nên chứng minh hành vi khi cờ bật, không chứng minh hành vi production mặc định.
- Không đọc `apps/web/.env*` (bị chặn quyền riêng tư): giá trị thực của cờ ở môi trường build không xác minh được.
