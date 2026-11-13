---
phase: 1
title: "Phase 1: Conditional Email Verified Badge"
status: completed
priority: P2
effort: 1h
dependencies: []
---

# Phase 1: Conditional Email Verified Badge

## Goal
Chỉ render `<Badge tone="good" className="shrink-0 text-[11px]">Đã xác thực</Badge>` trong `ProfileScreen` khi `Boolean(sessionEmail && session?.user?.emailVerified === true)` (với `sessionEmail = session?.user?.email?.trim() ?? ""`) và bảo vệ hành vi này bằng unit test viết theo TDD.

## Files to Create / Modify
- Modify: `apps/web/src/features/profile/__tests__/profile-screen.test.tsx`
- Modify: `apps/web/src/features/profile/profile-screen.tsx`

## Tests Before
Trước khi chỉnh sửa `apps/web/src/features/profile/profile-screen.tsx`, bổ sung 5 unit test mới vào cuối `describe("ProfileScreen component", ...)` trong `apps/web/src/features/profile/__tests__/profile-screen.test.tsx` (sau dòng 303):
1. Hiển thị badge `"Đã xác thực"` khi `session.user.emailVerified === true` và `session.user.email` có giá trị hợp lệ.
2. Không hiển thị badge `"Đã xác thực"` khi `session.user.emailVerified === false`.
3. Không hiển thị badge `"Đã xác thực"` khi `session` là `null` (hoặc `emailVerified` là `undefined`), kể cả khi `s.email` có giá trị fallback.
4. Không hiển thị badge `"Đã xác thực"` và hiển thị `"Chưa thiết lập"` khi `email` rỗng (`""`) kể cả nếu `session.user.emailVerified === true`.
5. Không hiển thị badge `"Đã xác thực"` khi `session.user.email` rỗng (`""` hoặc chỉ có khoảng trắng) và `session.user.emailVerified === true`, kể cả khi fallback client state `s.email` có giá trị (`"fallback@example.com"`).

## Refactor
- Giữ nguyên `const email = session?.user?.email || s.email;` tại `apps/web/src/features/profile/profile-screen.tsx:39` để hiển thị email, đồng thời khai báo `const sessionEmail = session?.user?.email?.trim() ?? "";` ngay sau đó.
<!-- Updated: Red Team Finding 1 - gate verified badge on trimmed session.user.email instead of client fallback s.email -->
- Bọc `<Badge tone="good" className="shrink-0 text-[11px]">Đã xác thực</Badge>` tại `apps/web/src/features/profile/profile-screen.tsx:253-255` trong điều kiện `{Boolean(sessionEmail && session?.user?.emailVerified === true) && (...)}`.
- Không sửa mock `beforeEach` mặc định tại `apps/web/src/features/profile/__tests__/profile-screen.test.tsx:67-79` để các test hiện tại vẫn đại diện cho session chưa có `emailVerified`.

## Tests After
- Chạy lại `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx` để xác nhận toàn bộ 18 test (13 test cũ + 5 test mới) pass.
- Chạy `pnpm check-types` để xác nhận `session?.user?.emailVerified` hợp lệ trên kiểu suy diễn của `authClient.useSession()` và `vite build` thành công.

## Tasks & Steps

### Task 1.1 — Write failing unit tests for `emailVerified` badge visibility (TDD Red)
- **Goal:** Bổ sung 5 test case kiểm chứng hành vi ẩn/hiện badge `"Đã xác thực"` vào `profile-screen.test.tsx` và xác nhận test thất bại trước khi sửa code sản phẩm.
- **Target files and symbols:** `apps/web/src/features/profile/__tests__/profile-screen.test.tsx` (`describe("ProfileScreen component")` tại lines `64-304`, mock `authClient.useSession` từ line `21`).
- **Steps:**
  1. Mở `apps/web/src/features/profile/__tests__/profile-screen.test.tsx`, đọc lines `285-304`.
  2. Trước dấu `});` đóng `describe("ProfileScreen component")` tại line `304`, thêm 5 test `it(...)`:
     - `renders 'Đã xác thực' badge when session user has email and emailVerified is true`: mock `authClient.useSession` trả về `data.user` có `email: "lan@example.com"` và `emailVerified: true`, render `renderProfile()`, kiểm tra `expect(screen.getByText("Đã xác thực")).toBeTruthy()`.
     - `hides 'Đã xác thực' badge when session user has emailVerified false`: mock `authClient.useSession` trả về `data.user` có `email: "lan@example.com"` và `emailVerified: false`, render `renderProfile()`, kiểm tra `expect(screen.queryByText("Đã xác thực")).toBeNull()`.
     - `hides 'Đã xác thực' badge when session is null or emailVerified is undefined`:
       - Subcase 1 (default `beforeEach` thiếu `emailVerified`): gọi `const { unmount } = renderProfile()`, kiểm tra `expect(screen.queryByText("Đã xác thực")).toBeNull()`, sau đó gọi `unmount()` để dọn DOM trước Subcase 2.
       - Subcase 2 (`authClient.useSession` trả về `data: null` với `renderProfile({ email: "fallback@example.com" })`, dùng `mockReturnValue`): kiểm tra `expect(screen.getByText("fallback@example.com")).toBeTruthy()` và `expect(screen.queryByText("Đã xác thực")).toBeNull()`.
     - `hides 'Đã xác thực' badge when email is empty even if emailVerified is true`: mock `authClient.useSession` trả về `data.user` có `email: ""` và `emailVerified: true`, render `renderProfile({ email: "" })`, kiểm tra `expect(screen.getByText("Chưa thiết lập")).toBeTruthy()` và `expect(screen.queryByText("Đã xác thực")).toBeNull()`.
     - `hides 'Đã xác thực' badge when session email is empty and display falls back to s.email`: mock `authClient.useSession` trả về `data.user` có `email: ""` và `emailVerified: true`, render `renderProfile({ email: "fallback@example.com" })`, kiểm tra `expect(screen.getByText("fallback@example.com")).toBeTruthy()` và `expect(screen.queryByText("Đã xác thực")).toBeNull()`.
  3. Chạy lệnh kiểm tra TDD Red: `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx`.
- **Success criteria:** 4 test mới (các nhánh ẩn badge) FAIL vì `"Đã xác thực"` đang luôn được render cứng, còn 13 test cũ và test `emailVerified: true` PASS.
- **Verify:** `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx` exits non-zero (exit code 1) with assertion failure on `queryByText("Đã xác thực")` returning an element instead of `null`; a zero exit code at this Red step is a failure.

### Task 1.2 — Gate `<Badge tone="good">Đã xác thực</Badge>` on `sessionEmail` and `session?.user?.emailVerified === true` (TDD Green)
- **Goal:** Sửa `ProfileScreen` để chỉ hiển thị huy hiệu `"Đã xác thực"` khi `session?.user?.email?.trim()` khác rỗng và `session?.user?.emailVerified === true`.
- **Target files and symbols:** `apps/web/src/features/profile/profile-screen.tsx` (`ProfileScreen` tại line `31`, biến `session` tại line `34`, biến `email` tại line `39`, JSX email field tại lines `248-256`).
- **Steps:**
  1. Đọc `apps/web/src/features/profile/profile-screen.tsx` lines `34-42` và `244-258`.
  2. Ngay sau `const email = session?.user?.email || s.email;` tại line `39`, thêm `const sessionEmail = session?.user?.email?.trim() ?? "";`.
  3. Tại lines `253-255`, thay:
     ```tsx
     <Badge tone="good" className="shrink-0 text-[11px]">
       Đã xác thực
     </Badge>
     ```
     bằng:
     ```tsx
     {Boolean(sessionEmail && session?.user?.emailVerified === true) && (
       <Badge tone="good" className="shrink-0 text-[11px]">
         Đã xác thực
       </Badge>
     )}
     ```
  4. Không thay đổi class của container `div` tại line `248` hay các thành phần khác ngoài lines `39` và `253-255`.
- **Success criteria:** Huy hiệu `"Đã xác thực"` chỉ xuất hiện trong DOM khi `session?.user?.email?.trim()` khác rỗng và `session?.user?.emailVerified === true`.
- **Verify:** `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx` exits 0 and prints `18 passed (18)`.

### Task 1.3 — Regression Gate & Type Check
- **Goal:** Xác minh không có lỗi kiểu TypeScript (`session?.user?.emailVerified`), build `apps/web` thành công và không gây hồi quy cho suite profile.
- **Target files and symbols:** Toàn workspace (đặc biệt `apps/web/src/features/profile/profile-screen.tsx` và `apps/web/src/features/profile/__tests__/profile-screen.test.tsx`).
- **Steps:**
  1. Chạy `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx`.
  2. Chạy `pnpm check-types` ở root worktree.
- **Success criteria:** Toàn bộ test trong `profile-screen.test.tsx` pass và `pnpm check-types` (bao gồm `vite build` ở `apps/web`) thoát với mã 0.
- **Verify:** `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx && pnpm check-types` exits 0 with `18 passed (18)` and no TypeScript/Vite build errors.

## Verification
- `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx` (exits 0, 18 passed)
- `pnpm check-types` (exits 0)

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
