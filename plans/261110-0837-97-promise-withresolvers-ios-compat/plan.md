---
title: "Fix: Promise.withResolvers thiếu trên iOS Safari < 17.4 (ghi âm có thể lỗi)"
description: "Thay 6 lời gọi Promise.withResolvers trong apps/web bằng helper local tương thích; bundle không còn API chỉ có từ Safari 17.4."
status: completed
priority: P1
effort: 2h
issue: 97
branch: fix/97-promise-withresolvers-ios
tags: [bugfix, frontend, web]
blockedBy: []
blocks: []
created: 2026-11-10
mode: --tdd --advice
advice: kongming-counsel-applied
---

# Fix: Promise.withResolvers thiếu trên iOS Safari < 17.4

Tracking: #97. Route: **bugfix** qua `/ak-fix --auto`. Ship: **beta** (PR vào `dev`). Phase 1 + 2 land trong **một PR duy nhất** vào `dev` — không bao giờ push riêng trạng thái red của Phase 1, vì CI duy nhất của repo (`deploy-beta.yml`) chạy full test trên push `dev`.

## Outcome

Học viên trên iOS Safari < 17.4 (và Chrome < 119 / Firefox < 121) ghi âm, lưu bản ghi và nén ảnh avatar bình thường: không còn `TypeError: Promise.withResolvers is not a function` tại runtime.

## Root cause (đã chứng minh, không phỏng đoán)

- 6 call-site production gọi `Promise.withResolvers` (Chrome 119+/Firefox 121+/Safari 17.4+; caniuse 93.46% global):
  `apps/web/src/features/exam/storage.ts:27,56,97,128` — `apps/web/src/hooks/use-recorder.ts:104` — `apps/web/src/features/profile/utils/image-compress.ts:23`.
- Bundle đã build chứa 5 lời gọi verbatim trong 3 chunk ship thật (`exam`, `answer-uploads`, `profile`) — chứng minh bằng `grep` trên `apps/web/dist/assets` **ở checkout chính `/root/projects/vox-flow`** (worktree này chưa có dist; Phase 2 build lại để verify). 5 ≠ 6 vì `getAudioBlob` (dòng 97) **không có prod importer nào** (chỉ `answer-uploads.ts`, `use-exam-session.ts` import `./storage`, không hàm này) → bị tree-shaken. Vẫn sửa dòng 97 vì nó là exported API và test trực tiếp dùng nó.
- Không browserslist, không `build.target`, tsconfig `ESNext`; Vite chỉ hạ cú pháp, không polyfill API.
- Sàn iOS thực tế của sản phẩm: ~14.3 (MediaRecorder); `docs/decisions/email-push-provider.md` chủ động thiết kế fallback cho cohort iOS ≤ 16.3 → **không được** chọn hướng "khai min iOS 17.4".

## Quyết định (gồm counsel kongming — checkpoint sau investigation, 2026-11-10)

- **Helper local** `promiseWithResolvers<T>()` tại `apps/web/src/lib/promise-with-resolvers.ts`, cài bằng `new Promise` executor, trả về **global type** `PromiseWithResolvers<T>` (không định nghĩa interface local trùng tên). Thay đủ 6 call-site; destructure giữ nguyên. Native `resolve`/`reject` idempotent nên nhánh settle-đôi (`onabort` + `onerror` trong `transactionDone`) vẫn an toàn, không cần đổi logic.
- **Kongming scan thêm lớp lỗi ES2024/2025** (`Object.groupBy`, `Promise.try`, `Array.fromAsync`, `toSorted`, Set methods, iterator helpers…): 0 hit trên `apps/web/src`; **đã re-run grep repo-wide trong worktree** (apps + packages, loại file test) — kết quả chỉ đúng 6 site `Promise.withResolvers` → scope đóng trên toàn repo. AC2 chỉ là backstop cho `withResolvers`; các API khác của workspace packages không có AC riêng (ngoài scope issue).
- Giữ nguyên builtin trong các test chạy trên Node 22 (vitest/jsdom: `exam-submit.test.tsx`, `score-attempt.test.ts`) — builtin tồn tại ở runtime test (CI pin `node-version: 22`), không ship cho browser.
- KHÔNG thêm core-js, KHÔNG thêm browserslist/`build.target` (Vite bỏ qua cho API — decorative), KHÔNG thêm guard script (ngoài phạm vi issue, YAGNI). Khi Safari < 17.4 tự tuyệt chủng, xoá helper + revert 6 import là toàn bộ rollback.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Regression tests tương thích (red)](./phase-01-regression-tests.md) | Pending |
| 2 | [Helper + thay 6 call-site (green + verify)](./phase-02-helper-and-swap.md) | Pending |

## Acceptance Criteria

- [x] AC1: `! grep -rn "Promise\.withResolvers(" apps/web/src --include='*.ts' --include='*.tsx' --exclude-dir=__tests__` → **exit 0** (không call-site nào; comment/doc và `src/test/without-promise-with-resolvers.ts` đọc tên builtin không có `(` nên không tính).
- [x] AC2: sau `pnpm --filter web build`, `test "$(grep -roh "Promise.withResolvers" apps/web/dist/assets | wc -l)" = "0"` → **exit 0** (in ra `0`; nếu in `5` thì build chưa lấy code mới — xem Root cause).
- [x] AC3: 3 regression test mới (storage / use-recorder / image-compress) pass khi builtin bị xoá khỏi `Promise`.
- [x] AC4: full suite web `pnpm --filter web test` exit 0 (covers mọi caller: storage, answer-uploads, avatar-modal, exam-submit, use-recorder, image-compress) + `pnpm --filter web check-types` exit 0.

## Conditional steps đã eval

- Research: **skip** — API đã hiểu rõ, support matrix có nguồn (caniuse/MDN + counsel), không phụ thuộc docs mới.
- Debug: **đã chạy** — root cause chứng minh bằng dist grep + code + decision doc (mục Root cause).
- Test: `--tdd` của plan chính là phần tạo test; sau cook đánh giá lại xem có cần `/ak-test` không.
- Docs: beta mode — chỉ chạy `/ak-docs update` nếu public contract đổi; fix này không đổi contract nào (đánh giá lại sau implement).

## Red Team Review

### Session — 2026-11-10
**Findings:** 8 (8 accepted, 0 rejected) — 2 reviewer (Security Adversary + Assumption Destroyer), Light tier/Fact Checker; 1 Critical, 1 High, 6 Medium.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Red test storage không thể fail — `storage.ts` nuốt lỗi `openDatabase()` và degrade về `memoryStore` (catch ở `saveAudioBlob:81-88`, memory-first ở `getAudioBlob:96-97`, `db=null` ở `listPendingUploads:108-112`) | Critical | Accept | Phase 1 Task 1.1 (thêm assert `idb.rows.size === 1`) |
| 2 | Regression gate bỏ `answer-uploads.test.ts` + `avatar-modal.test.tsx` trong khi claim "toàn bộ caller" | High | Accept | AC4 + Phase 2 Task 2.3 (full web suite) |
| 3 | 5 ≠ 6 bundle occurrences chưa giải thích; dist evidence không tái tạo được trong worktree | Medium | Accept | plan.md Root cause (provenance + tree-shake của `getAudioBlob`) |
| 4 | Task 1.2 sai cơ chế mock — `MockMediaRecorder.stop()` tự fire events đồng bộ | Medium | Accept | Phase 1 Task 1.2 (steps reword) |
| 5 | Trạng thái red Phase 1 không được đẩy riêng lên `dev` (CI duy nhất chạy full test trên push `dev`) | Medium | Accept | plan.md header (single-PR invariant) |
| 6 | Claim "scope đóng" chỉ scan `apps/web/src`, thiếu workspace packages | Medium | Accept | plan.md Quyết định (re-run repo-wide → chỉ 6 site) |
| 7 | AC/Verify dùng pipeline grep có exit code ngược — script `&&` đọc nhầm success thành failure | Medium | Accept | AC1/AC2 + Phase 2 Task 2.2/2.3 (exit-code tường minh) |
| 8 | Label "Node-only" sai cho `exam-submit.test.tsx` (chạy jsdom) | Medium | Accept | plan.md Quyết định (đổi thành "chạy trên Node 22/vitest+jsdom") |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-regression-tests.md, phase-02-helper-and-swap.md (sau khi áp findings).
- Decision deltas checked: 4 — (1) Task 1.1 thêm assert IndexedDB thật; (2) gate chuyển sang full web suite; (3) exit-code tường minh cho AC1/AC2/Verify; (4) single-PR invariant.
- Reconciled stale references: Verify của Task 1.1 vẫn hợp lệ (TypeError từ `openDatabase` vẫn là lỗi đầu tiên của test mới — assert `idb.rows.size` fail ngay sau đó; cả hai đều là failure kỳ vọng red). Task 2.3 step cũ 1–4 (4 suite riêng lẻ) được thay bằng full suite — cập nhật trong phase-02.
- Unresolved contradictions: 0.


<!-- slug: 97-promise-withresolvers-ios-compat -->
