# POT — Issue #64: refactor(branding) ChấmRõ → Vox Flow (D-01)

## Acceptance criteria & Bằng chứng

### 1. Component `Logo` (`apps/web/src/components/ds/logo.tsx`) render chính xác "Vox Flow" với chữ "Flow" mang class `text-brand`
```diff
-        Chấm<span className="text-brand">Rõ</span>
+        Vox <span className="text-brand">Flow</span>
```
File: `apps/web/src/components/ds/logo.tsx:56` (commit `a4f27cf`).

### 2. Document title trong `apps/web/src/routes/__root.tsx` là "Vox Flow — Thi thử IELTS Speaking AI"
```diff
-        title: "ChấmRõ — Thi thử IELTS Speaking AI",
+        title: "Vox Flow — Thi thử IELTS Speaking AI",
```
File: `apps/web/src/routes/__root.tsx:19` (commit `a4f27cf`).

### 3. `grep -ri "chấmrõ" apps/web/src` trả về 0 kết quả
```console
$ grep -ri "chấmrõ" apps/web/src
(0 kết quả — sạch hoàn toàn)
```

### 4. Unit test primitives pass 100%
```console
$ pnpm --filter web test src/components/ds/__tests__/primitives.test.tsx
 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  11.07s
```
Test liên quan cập nhật:
```diff
-    expect(screen.getByText("Rõ").className).toContain("text-brand");
+    expect(screen.getByText("Flow").className).toContain("text-brand");
```

Các test suite liên quan khác cũng pass:
```console
$ pnpm --filter web test src/layouts/__tests__/app-shell.test.tsx
 Tests  8 passed (8)
$ pnpm --filter web test src/features/__tests__/slice-a.test.tsx
 Tests  30 passed (30)
```

### 5. `pnpm check-types` vượt qua sạch sẽ
```console
$ pnpm check-types
 Tasks:    7 successful, 7 total
Cached:    6 cached, 7 total
  Time:    1m13.313s
```
Gói `web` chạy lại từ đầu (`cache miss`) và bao gồm cả `vite build` + `tsc --noEmit` — không có lỗi kiểu hay lỗi build.

## PR & Gates
- PR: https://github.com/vinh19410/vox-flow/pull/68
- Commit SHA: `a4f27cf`
- Isolated code review (subagent `code-reviewer`): Verdict **CLEAN** — 17/17 test files pass (156/156 tests trong `apps/web`), không phát hiện blocking finding.

## Quyết định đã thực hiện thay người sở hữu
- Định dạng logo: chọn phương án có khoảng trắng, giữ kiểu nhấn màu thương hiệu — `Vox <span className="text-brand">Flow</span>` (đã hỏi và được xác nhận ở Gate 1 của ak-atoz).
- Không sửa các file tài liệu lịch sử trong `docs/` (ví dụ `docs/roadmap-chamro.md`) vì đó là nơi lưu vết quyết định D-01, không phải giao diện người dùng (phạm vi issue giới hạn ở `apps/web`).
