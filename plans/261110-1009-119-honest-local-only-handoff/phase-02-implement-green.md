---
title: "Phase 2: Implement — union ScoringJob + LocalOnlyState đến toàn bộ xanh"
status: completed
priority: P1
effort: "1h"
dependencies: ["phase-01-tdd-red"]
---

# Phase 2: Implement — union ScoringJob + LocalOnlyState đến toàn bộ xanh

## Goal
`ScoringJob` là discriminated union (`attempt` | `local_only`); mọi constructor mang `kind`; ScoringScreen render `LocalOnlyState` trung thực cho `local_only`; schema sessionStorage migrate payload cũ. Toàn bộ test xanh + `check-types` exit 0.

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

## Files to Create / Modify
- Modify: `apps/web/src/features/app-state/types.ts`
- Modify: `apps/web/src/features/app-state/store.tsx`
- Modify: `apps/web/src/features/exam/exam-screen.tsx`
- Modify: `apps/web/src/features/scoring/scoring-screen.tsx`
- Modify: `apps/web/src/features/scoring/use-scoring-job.ts`
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify (Task 2.7, shape sweep): `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx`, `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`, `apps/web/src/features/results/__tests__/scored-results.test.tsx`

## Tasks & Steps

### Task 2.1 — types.ts: union + docstring
- Goal: `ScoringJob` thành union; TS ép mọi constructor thêm `kind`.
- Target files: `apps/web/src/features/app-state/types.ts` (interface `ScoringJob` dòng ~42-47, field `scoringAttempt` dòng ~79-80).
- Steps:
  1. Thay interface `ScoringJob` bằng:
     ```ts
     /** Scorable attempt handed from the exam to the scoring screen. */
     export type AttemptJob = {
       kind: "attempt";
       attemptId: string;
       /** True once `attempt.submit` succeeded (or the server already shows the attempt as submitted). */
       submitted: boolean;
     };
     /** Submit happened with no server attempt id: nothing was uploaded, honest state required (#119). */
     export type LocalOnlyJob = { kind: "local_only" };
     export type ScoringJob = AttemptJob | LocalOnlyJob;
     ```
  2. Cập nhật comment field `AppState.scoringAttempt`: `/** Attempt the scoring screen should submit/poll; local_only when submitted with no server attempt; null for unscored modes. */`
- Success criteria: `pnpm check-types` (chạy từ root worktree) báo lỗi TS tại các constructor thiếu `kind` — đúng danh sách Task 2.4-2.6. KHÔNG dùng `pnpm --filter web exec tsc --noEmit -p apps/web` — `--filter exec` đặt cwd là `apps/web` nên `-p apps/web` trỏ vào đường dẫn không tồn tại (red-team finding). Nếu cần chẩn đoán nhanh trong package: `pnpm --filter web exec tsc --noEmit`. (Lỗi TS lúc này là dự kiến, chỉ phục vụ định vị; không yield ở đây.)
- Verify: gộp vào Verify phase.

### Task 2.2 — store.tsx: schema discriminated union + legacy transform + bump key v3
- Goal: payload sessionStorage mới round-trip nguyên vẹn; payload cũ thiếu `kind` hydrate thành `attempt`; payload hỏng fallback base; rollback-deploy an toàn nhờ key mới.
- Target files: `apps/web/src/features/app-state/store.tsx` (`ScoringJobSchema` dòng ~44-47, `PROTO_STORAGE_KEY` dòng ~10).
- Steps:
  1. Bump `PROTO_STORAGE_KEY` từ `"vox-flow-proto-state-v2"` thành `"vox-flow-proto-state-v3"` (red-team: schema cũ không đọc được payload mới — key mới cô lập 2 chiều; giá trị v2 bị bỏ, mất preference một lần, chấp nhận ở beta).
  2. Thay `ScoringJobSchema` bằng:
     ```ts
     const ScoringJobSchema = z.preprocess(
       // Payload trước #119 không có `kind` — luôn là variant attempt.
       (raw) =>
         raw && typeof raw === "object" && !("kind" in raw)
           ? { kind: "attempt", ...(raw as Record<string, unknown>) }
           : raw,
       z.discriminatedUnion("kind", [
         z.object({ kind: z.literal("attempt"), attemptId: z.string().min(1), submitted: z.boolean() }),
         z.object({ kind: z.literal("local_only") }),
       ]),
     );
     ```
  3. Nếu TS báo `z.infer` không khớp `ScoringJob` khi gán vào `hydrateState`, thêm `satisfies`/annotation cần thiết — KHÔNG đổi shape runtime.
- Success criteria: test state-and-data (Task 1.3) chuyển xanh.
- Verify: gộp vào Verify phase.

### Task 2.3 — use-scoring-job.ts: param AttemptJob
- Goal: hook chỉ nhận variant `attempt`.
- Target files: `apps/web/src/features/scoring/use-scoring-job.ts` (dòng ~3 import, ~129 signature).
- Steps:
  1. Đổi import: `import type { AttemptJob } from "@/features/app-state/types";`
  2. Đổi signature: `export function useScoringJob(job: AttemptJob | null, handlers: ScoringJobHandlers): ScoringJobValue`. Thân hàm không đổi (`job?.attemptId`, `job?.submitted` giờ type-check).
- Success criteria: file biên dịch; test use-scoring-job vẫn xanh.
- Verify: gộp vào Verify phase.

### Task 2.4 — scoring-screen.tsx: nhánh local_only + LocalOnlyState
- Goal: `local_only` render state trung thực; không phá `null`/`not_scorable`/attempt flow.
- Target files: `apps/web/src/features/scoring/scoring-screen.tsx`.
- Steps:
  1. Dòng ~29 giữ nguyên (`const [job] = useState(() => s.scoringAttempt);`).
  2. Dòng ~39: `const scoring = useScoringJob(job?.kind === "attempt" ? job : null, { … });`
  3. Handler `onSubmitted` (dòng ~40-45): guard `prev.scoringAttempt?.kind === "attempt" && prev.scoringAttempt.attemptId === attemptId` → set `{ scoringAttempt: { kind: "attempt", attemptId, submitted: true } }`.
  4. Sửa `content` (dòng ~53-68): đặt nhánh `local_only` LÊN TRƯỚC:
     ```tsx
     const content =
       job?.kind === "local_only" ? (
         <LocalOnlyState onHome={() => go("dashboard")} onMore={() => go("forecast")} />
       ) : !job || scoring.view.kind === "not_scorable" ? (
         <RecordedState onHome={() => go("dashboard")} onMore={() => go("forecast")} />
       ) : (
         <ScoringJobState … />
       );
     ```
  5. Thêm component mới cạnh `RecordedState` (dùng `TriangleAlert` — đã import sẵn):
     ```tsx
     /** Submitted with no server attempt: nothing was uploaded. Honest state — no success icon, no retry promise (#119). */
     function LocalOnlyState({ onHome, onMore }: { onHome: () => void; onMore: () => void }) {
       return (
         <EmptyState
           size="lg"
           icon={TriangleAlert}
           title="Chưa gửi được bài thi lên máy chủ"
           description="Phiên thi chưa đồng bộ được với máy chủ nên câu trả lời của bạn chưa được ghi nhận. Bản ghi âm có thể vẫn còn lưu tạm trên thiết bị này nhưng chưa thể chấm điểm hay khôi phục tự động."
           action={{ label: "Về trang chủ", onClick: onHome }}
           secondaryAction={{ label: "Luyện thêm đề khác", onClick: onMore, variant: "outline" }}
           bordered
           className="bg-white p-8"
         />
       );
     }
     ```
  6. Cập nhật docstring `RecordedState` thành trung thực về cả 2 case null (red-team: deep-link `/scoring` khi chưa có job cũng rơi vào đây): `/** Unscored modes and no-job entry: a saved unscored attempt on the server, or no attempt at all (e.g. deep link). */`.
- Success criteria: test scoring-screen Task 1.2 xanh; 2 test RecordedState cũ vẫn xanh. Các test KHÁC trong file có thể đỏ tạm thời (seed thiếu `kind` → narrow làm hook nhận `null`) — không phải verify fail; chúng được vá ở Task 2.7 và Verify chỉ chạy cuối phase.
- Verify: gộp vào Verify phase.

### Task 2.5 — exam-screen.tsx: hand-off local_only + constructor attempt
- Target files: `apps/web/src/features/exam/exam-screen.tsx` (dòng ~133, ~139-143).
- Steps:
  1. Dòng ~133 (forecast): `set({ scoringAttempt: { kind: "attempt", attemptId: session.attemptId, submitted: false } });`
  2. Nhánh `!session.attemptId` (dòng ~139-143): thay comment #94 và thêm set job:
     ```ts
     if (!session.attemptId) {
       // Attempt bootstrap failed or timed out (#106): nothing is on the server,
       // so the scoring screen must say so instead of claiming success (#119).
       set({ scoringAttempt: { kind: "local_only" } });
       setPendingSubmission(true);
       go("scoring");
       return;
     }
     ```
  3. KHÔNG đổi `submitAnyway` (guard `!session.attemptId` đã return sớm) và KHÔNG đổi nhánh mock-có-attemptId.
- Success criteria: 2 test Task 1.1 chuyển xanh; các test mock-flush (job null sau submit có attemptId) vẫn xanh.
- Verify: gộp vào Verify phase.

### Task 2.6 — results-screen.tsx: constructor attempt
- Target files: `apps/web/src/features/results/results-screen.tsx` (`openScoring` dòng ~77-80).
- Steps: `set({ scoringAttempt: { kind: "attempt", attemptId, submitted: true } });`
- Success criteria: test scored-results xanh.
- Verify: gộp vào Verify phase.

### Task 2.7 — shape sweep toàn bộ test files + dọn TS (red-team finding Critical/High)
- Goal: mọi object literal `scoringAttempt` mang `kind` — production và test — vì call-site narrow biến `kind` thành runtime-load-bearing: seed thiếu `kind` khiến `useScoringJob` nhận `null` và ~22/24 test scoring-screen vỡ; `tsc` cũng fail vì tsconfig không exclude `__tests__`.
- Target files (CHỈ những literal còn thiếu `kind`, tối thiểu):
  - `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx` — 21 seed dòng 74, 108, 127, 153, 168, 181, 193, 200, 213, 234, 246, 262, 284, 297, 309, 348, 399, 412, 429, 459, 473 (thêm `kind: "attempt"`) + mọi assertion `toEqual` chứa `attemptId:` (ví dụ dòng 84, 132, 144, 173, 312; dòng `toBeNull` như 476 giữ nguyên).
  - `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` — assertion dòng ~93, ~673, ~761 và seed `renderWithApp` dòng ~123, ~187 (thêm `kind: "attempt"`).
  - `apps/web/src/features/results/__tests__/scored-results.test.tsx` — assertion dòng ~144, ~158 (thêm `kind: "attempt"`).
- Steps:
  1. Tìm hết literal còn thiếu: `grep -rn "scoringAttempt: {" apps/web/src --include="*.tsx" --include="*.ts"` và `grep -rn "scoringAttempt)" apps/web/src --include="*.test.*"`. Mỗi literal có `attemptId:` phải mang `kind: "attempt"`; mỗi literal chỉ có `kind: "local_only"` giữ nguyên; mọi `toEqual({ attemptId: … })` thêm `kind: "attempt"`.
  2. Chạy `pnpm check-types` từ root worktree — phải exit 0 trước khi tuyên bố success (không đánh giá bằng mắt).
- Success criteria: grep không còn literal `attemptId` thiếu `kind`; check-types exit 0.
- Verify: gộp vào Verify phase.

## Verification
1. Lệnh: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx src/features/scoring/__tests__/scoring-screen.test.tsx src/features/scoring/__tests__/use-scoring-job.test.ts src/features/results/__tests__/scored-results.test.tsx src/features/app-state/__tests__/state-and-data.test.ts` — Pass condition: exit 0, tất cả test trong 5 file pass (0 failed).
2. Lệnh: `pnpm --filter web test` — Pass condition: exit 0, toàn bộ suite pass (không test nào fail so với baseline dev).
3. Lệnh: `pnpm check-types` — Pass condition: exit 0 (web bao gồm vite build).
