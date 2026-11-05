---
phase: 3
title: "G2: Hydrate state từ session và quyền riêng tư"
status: pending
priority: P1
effort: 1d
dependencies: [1]
---

# Phase 3: G2 — Hydrate state từ session và quyền riêng tư

## Goal
Tên, email và trạng thái đồng ý dữ liệu trong `AppState` lấy từ phiên đăng nhập Better Auth và API `privacy.getConsent`, không còn từ giá trị cứng.

## Phạm vi
- Làm ngay được: `name`, `email` từ session (`authClient.useSession`), `consent` từ `privacy.getConsent` (API đã có, web chưa gọi).
- Không thuộc phase này: `target`, `examDate` (WI10 tạo bảng `user_profile` và router `profile`), `attempts` (WI18), `plan` (WI15), `practiced`/`saved` (WI20). Các trường đó giữ giá trị trung lập của phase 1 cho đến khi WI tương ứng nạp.

## Files to Create / Modify
- Create: `apps/web/src/features/app-state/use-server-state.ts`, `use-server-state.test.ts`
- Modify: `apps/web/src/features/app-state/app-state-provider.tsx`, `apps/web/src/layouts/user-card.tsx` (chỉ nếu cần xử lý tên rỗng)
- Read-only tham chiếu: `apps/web/src/lib/auth-client.ts`, `packages/api/src/routers/privacy.ts` (hình dạng kết quả `getConsent`)

## Tasks & Steps

### Task 3.1 — Hook nạp state từ server
- Goal: một hook duy nhất cập nhật `AppState` từ session và `privacy.getConsent`.
- Target files and symbols: `use-server-state.ts` (export `useServerState`), `app-state-provider.tsx`.
- Steps:
  1. Đọc `privacy.ts` (`getConsent`) để biết hình dạng kết quả và cách ánh xạ sang `ConsentSettings` (`save`, `calibration`, `train`).
  2. Viết `useServerState()`: khi `authClient.useSession()` có người dùng, gọi `set({ name, email })`; gọi `trpcClient.privacy.getConsent.query()` rồi `set({ consent })`. Lỗi mạng hiện toast lỗi, không điền giá trị giả.
  3. Gắn hook vào `app-state-provider.tsx`.
  4. Viết `use-server-state.test.ts` với `trpcClient` và `authClient` được thay bằng bản giả trong test: nạp xong thì `name`, `email`, `consent` khớp bản giả.
- Success criteria: sau khi session có người dùng, `s.name` và `s.email` bằng dữ liệu session; `s.consent` bằng kết quả `getConsent`.
- Verify: `pnpm --filter web test src/features/app-state/use-server-state.test.ts` exits 0.

### Task 3.2 — Giao diện chịu được tên rỗng khi chưa nạp xong
- Goal: thanh bên không hiện ký tự lỗi khi `name` còn rỗng.
- Target files and symbols: `apps/web/src/layouts/user-card.tsx`.
- Steps: nếu `s.name` rỗng, hiện phần đầu của `s.email`; nếu cả hai rỗng, hiện bộ xương (skeleton) hoặc dấu "—".
- Success criteria: render với `name=""`, `email=""` không ném lỗi.
- Verify: `pnpm --filter web test src/layouts` exits 0 nếu đã có test cho thư mục này; nếu chưa có thì thêm một test render `UserCard` với state rỗng và chạy lại lệnh.

### Task 3.3 — Kiểm tra cuối phase
- Goal: không còn nguồn hardcode cho hồ sơ.
- Steps: chạy các lệnh trong mục Verification.
- Success criteria: tất cả đều đạt.
- Verify: xem mục Verification.

## Verification
- `pnpm --filter web test src/features/app-state` exits 0.
- `rg -n "Minh Anh|minhanh@" apps/web/src --glob '!**/*.test.*'` in ra 0 dòng.
- `pnpm check-types` exits 0.

## Risk
- Đăng nhập `_proto` chưa dùng `authClient` (WI07). Cho đến khi WI07 xong, `useSession` trả `null` ở `_proto` nên `name`/`email` vẫn rỗng. Đây là hành vi đúng; ghi vào bảng truy vết, không giả lập.

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
