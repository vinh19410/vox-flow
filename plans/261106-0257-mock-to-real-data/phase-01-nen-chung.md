---
phase: 1
title: "Nền chung: cờ tính năng, bỏ mock khỏi state"
status: pending
priority: P1
effort: 1d
dependencies: []
---

# Phase 1: Nền chung — cờ tính năng, bỏ mock khỏi state

## Goal
Có một module cờ tính năng duy nhất (mặc định tắt) và trạng thái khởi tạo của app không còn chứa tên, email, lịch sử hay consent giả.

## Files to Create / Modify
- Create: `apps/web/src/lib/feature-flags.ts`
- Create: `apps/web/src/lib/feature-flags.test.ts`
- Modify: `apps/web/src/env.ts` (khai báo biến công khai tùy chọn), `apps/web/src/env.public.ts`
- Modify: `apps/web/src/features/app-state/initial-state.ts`
- Modify: `apps/web/src/features/app-state/store.tsx` (hàm `hydrateState`, hằng `PROTO_STORAGE_KEY`)
- Create: `apps/web/src/features/app-state/initial-state.test.ts`

## Tasks & Steps

### Task 1.1 — Module cờ tính năng
- Goal: một nơi duy nhất quyết định `scoring` và `billing` bật hay tắt, mặc định tắt.
- Target files and symbols: `apps/web/src/lib/feature-flags.ts` (export `FEATURES`), `apps/web/src/env.ts`, `apps/web/src/env.public.ts`.
- Steps:
  1. Đọc `apps/web/src/env.ts` và `env.public.ts` để theo đúng mẫu khai báo biến `VITE_*`.
  2. Thêm hai biến tùy chọn `VITE_FEATURE_SCORING` và `VITE_FEATURE_BILLING` theo mẫu đó.
  3. Tạo `feature-flags.ts` export `FEATURES = { scoring: <biến> === "true", billing: <biến> === "true" }`. Biến vắng mặt thì giá trị là `false`.
  4. Viết `feature-flags.test.ts`: khi không đặt biến, `FEATURES.scoring` và `FEATURES.billing` đều `false`.
- Success criteria: `FEATURES` có đúng hai khóa và cả hai là `false` khi không đặt biến môi trường.
- Verify: `pnpm --filter web test src/lib/feature-flags.test.ts` exits 0 và in `1 passed` hoặc nhiều hơn, không có `failed`.

### Task 1.2 — Trạng thái khởi tạo trung tính
- Goal: `createInitialState()` không còn dữ liệu giả.
- Target files and symbols: `apps/web/src/features/app-state/initial-state.ts` (`createInitialState`, `INITIAL_STATE`).
- Steps:
  1. Bỏ `import { HISTORY }`.
  2. Đặt `name: ""`, `email: ""`, `attempts: []`, `practiced: {}`, `saved: []`, `plan: null`, `practice: null`.
  3. Đặt `consent: { save: false, calibration: false, train: false }` (mặc định an toàn về riêng tư; phase 3 nạp giá trị thật từ `privacy.getConsent`).
  4. Giữ `target` kiểu `number` và `examDate: null`. Không hardcode ngày thi. Với `target`, giữ giá trị mặc định hiện tại làm mặc định hiển thị và ghi chú trong code ngắn rằng WI10 sẽ ghi đè từ hồ sơ.
  5. Viết `initial-state.test.ts` kiểm tra: `name === ""`, `email === ""`, `attempts` rỗng, `practiced` rỗng, `saved` rỗng, `examDate === null`.
- Success criteria: không còn chuỗi "Minh Anh" hay "minhanh@" trong `apps/web/src`, trừ file test nếu cần.
- Verify: `pnpm --filter web test src/features/app-state/initial-state.test.ts` exits 0; và `rg -n "Minh Anh|minhanh@" apps/web/src --glob '!**/*.test.*'` in ra 0 dòng.

### Task 1.3 — Không còn khôi phục dữ liệu giả từ `sessionStorage`
- Goal: trình duyệt đã từng lưu state mock không đưa dữ liệu cũ trở lại.
- Target files and symbols: `apps/web/src/features/app-state/store.tsx` (`PROTO_STORAGE_KEY`, `hydrateState`, effect ghi `sessionStorage`).
- Steps:
  1. Đổi giá trị `PROTO_STORAGE_KEY` thành `"vox-flow-proto-state-v2"` để bỏ qua bản lưu cũ.
  2. Trong effect ghi `sessionStorage` và trong `hydrateState`, chỉ lưu và khôi phục các trường là tùy chọn của giao diện: `mode`, `voice`, `practice`. Các trường do server sở hữu (`name`, `email`, `target`, `examDate`, `consent`, `plan`, `attempts`, `practiced`, `saved`) luôn lấy từ `createInitialState()` rồi do phase 3 và các WI nạp.
  3. Cập nhật `PersistedAppStateSchema` cho khớp.
- Success criteria: sau khi nạp một chuỗi `sessionStorage` chứa `name: "X"`, `hydrateState()` vẫn trả `name: ""`.
- Verify: `pnpm --filter web test src/features/app-state` exits 0 (thêm một ca vào `initial-state.test.ts` hoặc test store hiện có cho trường hợp trên).

### Task 1.4 — Kiểm tra kiểu
- Goal: không có lỗi kiểu phát sinh từ việc đổi state.
- Target files and symbols: toàn bộ `apps/web`.
- Steps: chạy kiểm tra kiểu; sửa các chỗ đọc `s.attempts`, `s.name` giả định có dữ liệu (Dashboard đã có nhánh rỗng ở `dashboard-screen.tsx:14`).
- Success criteria: kiểm tra kiểu qua.
- Verify: `pnpm check-types` exits 0.

## Verification
- `pnpm --filter web test src/lib/feature-flags.test.ts` exits 0.
- `pnpm --filter web test src/features/app-state` exits 0.
- `rg -n "Minh Anh|minhanh@|from \"\.\./history/data\"" apps/web/src --glob '!**/*.test.*'` in ra 0 dòng.
- `pnpm check-types` exits 0.

## Risk
Dashboard, lịch sử và thanh bên sẽ trống cho đến khi phase 3 và các WI nạp dữ liệu thật. Đây là hành vi đúng; không thêm dữ liệu tạm.

## Rollback
`git revert` các commit của phase này; không có migration hay dữ liệu cần khôi phục.

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
