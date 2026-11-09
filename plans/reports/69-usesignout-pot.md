## POT — refactor useSignOut (#69)

PR: #72 · Commit: 572b79f · Review isolated (sub-session riêng): **APPROVED, 0 blocking**.

### Done-means → bằng chứng

**1. Không còn logic signOut nội bộ ngoài hook — cả 3 component dùng `useSignOut`**

```
$ grep -rn "authClient.signOut" apps/web/src
apps/web/src/hooks/__tests__/use-sign-out.test.tsx   (mock)
apps/web/src/layouts/__tests__/bottom-nav.test.tsx   (mock)
apps/web/src/hooks/use-sign-out.ts                   (hook duy nhất)
```

`user-card.tsx`, `user-menu.tsx`, `bottom-nav.tsx` gọi `useSignOut()`; `handleSignOut` nội bộ đã xoá hết (diff của PR #72).

**2. Hook xử lý đúng 2 nhánh lỗi, chỉ navigate khi thành công** — unit test 4/4:

```
$ pnpm --filter web test src/hooks/__tests__/use-sign-out.test.tsx
 ✓ src/hooks/__tests__/use-sign-out.test.tsx (4 tests) 4 passed
   - navigates to /auth after successful signOut
   - shows error toast and stays on page when signOut resolves with error
   - shows error toast and stays on page when signOut rejects
   - navigates to custom redirect target
```

**3. Full suite + check-types (gate repo):**

```
$ pnpm --filter web test
 Test Files  19 passed (19)
      Tests  165 passed (165)

$ pnpm check-types
 Tasks:    7 successful, 7 total
```

(`pnpm check` không tồn tại ở root của repo; gate lint của turbo không có task nào gắn với `apps/web`.)

**4. Toaster sonner đúng một instance, phủ cả proto + legacy**: mounted tại `apps/web/src/routes/__root.tsx:41`; bản ở `apps/web/src/routes/_app-legacy/route.tsx` đã gỡ để tránh toast nhân đôi.

### Quyết định trong run

- PR #70 merge vào `dev` giữa chừng → branch tái căn thẳng lên `dev` (b4bfca3), không còn cần stack.
- Đích mặc định sau đăng xuất: `/auth` (nhất quán với route guard `requireSession`), ghi đè được qua tham số.
- Thất bại đăng xuất: toast lỗi + ở lại trang (session và UI không lệch nhau).

### Ghi nhận non-blocking (chưa sửa, ngoài scope)

- Double-click nút đăng xuất có thể gửi nhiều request (hành vi cũ cũng vậy; endpoint idempotent).
- Tham số `redirect` nhận `string` tự do (check-types pass; giữ linh hoạt giữa 2 cây route).

### Chưa kiểm chứng

- Flow đăng xuất thủ công trên trình duyệt end-to-end (cần backend session thật); hành vi hook đã được phủ bởi unit test ở trên.
