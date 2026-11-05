---
phase: 5
title: "Cổng chặn mock cho tính năng bị hold và đối soát"
status: pending
priority: P1
effort: 0.5d
dependencies: [1, 2, 3, 4]
---

# Phase 5: Cổng chặn mock cho tính năng bị hold và đối soát

## Goal
Khi chấm điểm và thanh toán chưa có backend thật, bản production hiện trạng thái "sắp có" thay vì điểm hoặc QR giả, và có kiểm tra cơ học chứng minh mock không lọt vào bản production.

## Bối cảnh
- Chấm điểm (WI13) chờ WI03/OQ-5; thanh toán (WI15/16) chờ WI08/WI13. Hai nhóm này không thể thay bằng dữ liệu thật trong plan này.
- Quyết định đã chốt: cờ mặc định tắt; mock chỉ tồn tại ở test fixture và nhánh `import.meta.env.DEV`.
- `attempt.submit` vẫn chạy thật (đổi status sang `submitted`).

## Files to Create / Modify
- Modify: `apps/web/src/features/scoring/scoring-screen.tsx`, `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/billing/billing-screen.tsx`, `apps/web/src/features/billing/components/payment-panel.tsx`, `apps/web/src/features/billing/components/paywall-modal.tsx`
- Modify: `apps/web/src/features/results/data.ts`, `review-data.ts`, `scoring/data.ts`, `billing/data.ts` (chuyển vào thư mục fixture của test)
- Create: `apps/web/src/features/results/results-gate.test.tsx`, `apps/web/src/features/billing/billing-gate.test.tsx`
- Create: `apps/web/scripts/check-no-mock-in-dist.mjs`
- Modify: `apps/web/package.json` (thêm script `check:no-mock`)

## Tasks & Steps

### Task 5.1 — Kết quả khi cờ `scoring` tắt
- Goal: không hiển thị band, tiêu chí hay bằng chứng giả.
- Target files and symbols: `scoring-screen.tsx`, `results-screen.tsx`, `FEATURES.scoring` từ `apps/web/src/lib/feature-flags.ts`.
- Steps:
  1. Khi `FEATURES.scoring` là `false`: `scoring-screen` bỏ các bước chấm giả và `setTimeout`; hiện "Bài của bạn đã được lưu. Chấm điểm sắp ra mắt." kèm nút về Dashboard.
  2. `results-screen` hiện cùng thông điệp, không import `RESULT` hay `REVIEW`.
  3. Khi `FEATURES.scoring` là `true`, nhánh hiện tại giữ nguyên cho đến khi WI13 thay bằng API (nhánh này ghi rõ trong code là chờ WI13).
  4. Viết `results-gate.test.tsx`: cờ tắt → có chữ "sắp ra mắt" và không có số band.
- Success criteria: với cờ mặc định, không còn đường nào render `RESULT`.
- Verify: `pnpm --filter web test src/features/results/results-gate.test.tsx` exits 0.

### Task 5.2 — Thanh toán khi cờ `billing` tắt
- Goal: không hiển thị QR giả hay giả lập "thanh toán thành công".
- Target files and symbols: `billing-screen.tsx`, `payment-panel.tsx` (`setTimeout` ở khoảng dòng 34, `FakeQR`), `paywall-modal.tsx`.
- Steps:
  1. Khi `FEATURES.billing` là `false`: `billing-screen` hiện bảng giá chỉ để đọc và thông báo "Thanh toán sắp mở"; nút chọn gói bị vô hiệu; `PaywallModal` không mở `PaymentPanel`.
  2. Đưa `FakeQR` và logic `setTimeout` giả lập ra khỏi đường production: chỉ render khi `import.meta.env.DEV && FEATURES.billing`.
  3. Viết `billing-gate.test.tsx`: cờ tắt → không có `FakeQR`, nút chọn gói bị vô hiệu.
- Success criteria: với cờ mặc định, `FakeQR` không được render.
- Verify: `pnpm --filter web test src/features/billing/billing-gate.test.tsx` exits 0.

### Task 5.3 — Chuyển dữ liệu mock thành fixture của test
- Goal: file mock không nằm trong đường nhập của code production.
- Target files and symbols: `results/data.ts`, `results/review-data.ts`, `scoring/data.ts`, `billing/data.ts` và các file import chúng.
- Steps:
  1. Với `PLANS`: giữ ở `billing/data.ts` vì là bảng giá hiển thị (cấu hình sản phẩm đã chốt, PRD) — không phải mock; WI15 sẽ chuyển sang nguồn server.
  2. Với `RESULT`, `REVIEW`, `MARK`, `SCORING_STEPS`: chuyển sang `apps/web/src/test/fixtures/` và chỉ để test import. Code production dùng nhánh WI13 hoặc nhánh "sắp ra mắt".
  3. Dọn import không còn dùng.
- Success criteria: không có file ngoài test import `RESULT`, `REVIEW`, `SCORING_STEPS`.
- Verify: `rg -n "RESULT|REVIEW|SCORING_STEPS" apps/web/src --glob '!**/*.test.*' --glob '!**/test/**'` chỉ khớp ở nhánh được bọc `FEATURES.scoring`/`import.meta.env.DEV`; ghi lại danh sách các khớp vào báo cáo hoàn thành để người duyệt xem.

### Task 5.4 — Chốt chặn trên bản production
- Goal: chứng minh cơ học rằng chuỗi đặc trưng của mock không có trong bản build.
- Target files and symbols: `apps/web/scripts/check-no-mock-in-dist.mjs`, `apps/web/package.json`.
- Steps:
  1. Tạo script đọc mọi file `.js` trong `apps/web/dist` và báo lỗi (exit 1) nếu thấy một trong các chuỗi: `Minh Anh`, `District 3`, `minhanh@gmail.com`, `Trả lời trôi chảy, có mở rộng ý`, `128 từ/phút`.
  2. Thêm script `"check:no-mock": "node scripts/check-no-mock-in-dist.mjs"` vào `apps/web/package.json`.
  3. Chạy `pnpm check-types` (lệnh này chạy bước dựng của Vite) rồi chạy script.
- Success criteria: script in "OK: no mock markers in dist" và exit 0.
- Verify: `pnpm --filter web check-types && pnpm --filter web check:no-mock` exits 0 và in `OK: no mock markers in dist`.

### Task 5.5 — Đối soát bảng truy vết
- Goal: bảng 8 nhóm trong `plan.md` phản ánh đúng hiện trạng.
- Target files and symbols: `plans/261106-0257-mock-to-real-data/plan.md`.
- Steps: với mỗi nhóm, chạy `rg -n "<file mock>" apps/web/src` và cập nhật cột "Điều kiện để xóa mock" thành "Đã xong" hoặc giữ nguyên kèm WI còn chờ. Đánh `status: completed` cho plan chỉ khi nhóm 2, 4 (phần G2) và 8 đã xong; các nhóm do WI sở hữu nằm ngoài tiêu chí hoàn thành của plan này.
- Success criteria: bảng khớp kết quả `rg`.
- Verify: `rg -n "ITEMS|HISTORY|Minh Anh" apps/web/src --glob '!**/*.test.*' --glob '!**/test/**'` in ra 0 dòng.

## Verification
- `pnpm --filter web test src/features/results/results-gate.test.tsx` exits 0.
- `pnpm --filter web test src/features/billing/billing-gate.test.tsx` exits 0.
- `pnpm check-types` exits 0.
- `pnpm --filter web check:no-mock` exits 0.

## Risk
- Học viên thấy "sắp ra mắt" ở chấm điểm và thanh toán: đúng với thực tế sản phẩm, và phù hợp mốc WI17 (cổng mở cho học viên thật).
- Nếu PO quyết định `_proto` chỉ là bản nội bộ, có thể nới Task 5.1–5.2 thành giữ mock sau `import.meta.env.DEV`; hỏi PO trước khi nới.

## Rollback
`git revert`; không có migration.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
