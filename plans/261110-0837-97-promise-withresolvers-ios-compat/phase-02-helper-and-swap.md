---
phase: 2
title: "Phase 2: Helper + thay 6 call-site (green + verify)"
status: pending
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: Helper + thay 6 call-site (green + verify)

## Goal

Prod code của `apps/web` không còn gọi builtin `Promise.withResolvers`; 3 test phase 1 chuyển green; bundle rebuild sạch API.

## Files to Create / Modify

- Create: `apps/web/src/lib/promise-with-resolvers.ts`
- Modify: `apps/web/src/features/exam/storage.ts` (4 chỗ: dòng 27, 56, 97, 128)
- Modify: `apps/web/src/hooks/use-recorder.ts` (1 chỗ: dòng 104)
- Modify: `apps/web/src/features/profile/utils/image-compress.ts` (1 chỗ: dòng 23)

KHÔNG sửa: test Node-only (`exam-submit.test.tsx`, `packages/api/src/scoring/score-attempt.test.ts`), `vite.config.ts`, tsconfig, `package.json`.

## Tests After (green)

Cả 3 test phase 1 phải pass sau phase này — chúng là acceptance, không phải mock echo.

## Tasks & Steps

### Task 2.1 — Tạo helper

- Goal: module helper tương thích, đúng signature builtin.
- Target: `apps/web/src/lib/promise-with-resolvers.ts` (file mới).
- Steps: tạo file với nội dung chính xác:

```ts
export function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve!: PromiseWithResolvers<T>["resolve"];
  let reject!: PromiseWithResolvers<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
```

- Invariant kiểu: trả về **global type** `PromiseWithResolvers<T>` của lib (đã có vì code hiện tại compile được với builtin) — KHÔNG định nghĩa interface local trùng tên, KHÔNG đổi signature (`reject` nhận `reason?: any` theo lib).
- Success criteria: file tồn tại; không có lỗi unused/unknown type khi check-types (Task 2.3 verify).
- Verify: `no verification needed` riêng lẻ — được phủ bởi Verify của Task 2.3.

### Task 2.2 — Thay 6 call-site

- Goal: không còn `Promise.withResolvers` nào trong src prod của `apps/web`.
- Target: `storage.ts` ×4, `use-recorder.ts` ×1, `image-compress.ts` ×1.
- Steps (lặp cho từng file):
  1. Thêm import: `import { promiseWithResolvers } from "@/lib/promise-with-resolvers";` — alias `@/*` đã có trong `apps/web/tsconfig.json` (`"paths": { "@/*": ["./src/*"] }`) và là convention hiện hữu (`import { cx } from "@/lib/cx"` trong `apps/web/src/components/ds/*`).
  2. Thay `Promise.withResolvers<X>()` → `promiseWithResolvers<X>()` tại đúng các dòng nêu trên. Giữ nguyên destructure và mọi logic khác.
- Success criteria: destructure `{ promise, resolve, reject }` (hoặc `{ promise, resolve }` ở `use-recorder.ts`) hoạt động không đổi nhờ đúng kiểu trả về.
- Verify: `! grep -rn "Promise\.withResolvers(" apps/web/src --include='*.ts' --include='*.tsx' --exclude-dir=__tests__` → **exit 0** (call-site = có dấu `(`; doc comment nói về API không phải call).

### Task 2.3 — Green + gate

- Goal: mọi kiểm chứng cơ học đạt.
- Target: không sửa code; chỉ chạy lệnh.
- Steps + Verify (so sánh máy móc, từng lệnh):
  1. `pnpm --filter web test src/features/exam/__tests__/storage.test.ts` → exit 0, test mới phase 1 pass.
  2. `pnpm --filter web test src/hooks/__tests__/use-recorder.test.ts` → exit 0, test mới phase 1 pass.
  3. `pnpm --filter web test src/features/profile/__tests__/image-compress.test.ts` → exit 0, test mới phase 1 pass.
  4. `pnpm --filter web check-types` → exit 0.
  5. `pnpm --filter web build && test "$(grep -roh "Promise.withResolvers" apps/web/dist/assets | wc -l)" = "0"` → exit 0 (in `0`; in `5` nghĩa là build chưa lấy code mới — xem Root cause, tree-shaking của `getAudioBlob`).
  6. `pnpm --filter web test` → exit 0 — **full web suite**, cover mọi caller (storage, answer-uploads, avatar-modal, exam-submit, use-recorder, image-compress); đây là lệnh cuối cùng trước khi báo xong phase.
- Success criteria: cả 6 lệnh đạt pass condition.

## Regression gate

Lệnh 6 ở Task 2.3 (full web suite) + lệnh 4 (check-types) là regression gate của plan — khớp với điều CI repo thực sự chạy khi merge vào `dev` (`turbo run test` + build). Nếu fail → Failure Protocol.

## Risk Assessment

- Settle-đôi trong `transactionDone` (`onabort` + `onerror`): an toàn — executor giữ native `resolve`/`reject` idempotent (counsel kongming đã đối chiếu spec).
- Timing/microtask: executor chạy đồng bộ, promise trả về là native `Promise` — không khác biệt quan sát được so với builtin.

## Security Considerations

Không đổi auth, network, storage schema. Helper thuần cục bộ, không patch global `Promise`.

## Failure Protocol

Nếu bất kỳ Verify step nào không đạt pass condition đã nêu, STOP phase này.
Không tự sửa tạm, không retry mù, không lý lẽ vòng qua failure.
Spawn subagent `kongming` để xin counsel bước tiếp theo, kèm:
- phase + task id,
- các bước đã chạy,
- lệnh đúng và output đầy đủ,
- pass condition mà nó không đạt.
Áp dụng guidance của kongming rồi chạy lại Verify step.
Nếu không spawn được `kongming` trong môi trường này, STOP và báo cùng evidence đó cho user. Không tự tiếp tục bằng suy luận.
