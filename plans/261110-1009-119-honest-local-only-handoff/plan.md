---
title: "ScoringScreen trung thực khi nộp không có attemptId — local_only hand-off"
description: "Nộp bài khi attempt sync treo/fail hiện render RecordedState 'đã ghi nhận toàn bộ' dù 0 byte audio rời thiết bị. Thêm variant local_only vào ScoringJob, ScoringScreen render state trung thực, giữ nguyên RecordedState cho các path hợp lệ."
status: in-progress
priority: P1
effort: 2h
issue: 119
branch: fix/119-honest-submit-copy
tags: [bugfix, frontend]
blockedBy: []
blocks: []
created: 2026-11-10
---

# 119-honest-local-only-handoff

## Nguồn

- Issue: https://github.com/vinh19410/vox-flow/issues/119 (bugfix route; debt từ red-team plan #106 / PR #117, tồn tại từ #105).
- Route: **bugfix** qua `/ak-fix --auto`. Ship mode: **beta** (PR → `dev`).
- Product decision (chốt với product owner 2026-11-10): **chỉ Hướng 1** — copy trung thực + hand-off state. Hướng 2 (persist clientSessionId + flush cross-screen) và Hướng 3 (API nhận clientSessionId) nằm ngoài scope, mở issue riêng theo dõi.
- Counsel kongming (pre-plan checkpoint, agent SolidAngelfish): union state trên `scoringAttempt`, copy nói 2 sự thật không hứa tương lai, không gộp Hướng 2 vì ambiguity adopt của `getActive` (không phân biệt attempt "ma" của session trước với attempt của lần retake → nguy cơ trộn audio phiên cũ vào bài mới).

## Root cause (đã chứng minh bằng code trace trên dev HEAD 4b46fca)

1. `apps/web/src/features/exam/use-exam-session.ts:127-130` — timeout 15s (#106) flip `attemptStatus → "failed"` khi `attempt.getActive`/`attempt.start` treo; `submit()` chỉ chặn khi `"pending"` → nút nộp mở khoá với `attemptId == null`. Request gốc vẫn chạy: `attempt.start` có thể tạo attempt phía server sau đó (client không bao giờ nhận id).
2. `apps/web/src/features/exam/exam-screen.tsx:139-143` — nhánh `!session.attemptId` giữ fallback #94 ("no server attempt exists") → chỉ `setPendingSubmission(true); go("scoring")`, **không set `scoringAttempt`**. Giả định #94 (offline) không còn đúng sau #106: server có thể có attempt "ma" 0 answers, hoặc chưa có gì.
3. `apps/web/src/features/scoring/scoring-screen.tsx:29,53-55` — `job = s.scoringAttempt` = null → render `RecordedState` với copy "Bài thi đã được ghi nhận! Hệ thống đã lưu lại toàn bộ câu trả lời của bạn." (`scoring-screen.tsx:88-99`) — SAI.
4. Không có đường cứu dữ liệu: recording khi chưa có id được lưu IndexedDB dưới key `clientSessionId` (UUID mỗi mount, không persist — `use-exam-session.ts:71-73,269-306`); unmount xoá `pendingSessionRef` (`use-exam-session.ts:309`); `flushAnswerUploads` cần attemptId thật, chỉ 2 callee đều guard theo attemptId (exam submit, `use-scoring-job.ts:159-163`).
5. `RecordedState` ĐÚNG cho 2 case khác: unscored mode (mock có attemptId — server đã nhận, chỉ không chấm AI) và `not_scorable` (forecast attempt không chấm được). Không được phá 2 case này.

## Thiết kế chốt (product decision + kongming counsel)

1. **`ScoringJob` thành discriminated union** (`apps/web/src/features/app-state/types.ts`):
   ```ts
   export type AttemptJob = { kind: "attempt"; attemptId: string; submitted: boolean };
   export type LocalOnlyJob = { kind: "local_only" };
   export type ScoringJob = AttemptJob | LocalOnlyJob;
   ```
   `null` giữ nguyên nghĩa hiện có: unscored mode có bài đã lưu trên server, hoặc đơn giản là chưa có job nào (deep-link `/scoring` cũng rơi vào đây — copy success giả của case này được track ở issue hardening riêng, ngoài scope).
2. **Zod schema** (`apps/web/src/features/app-state/store.tsx`): `z.preprocess` inject `kind: "attempt"` cho payload cũ thiếu `kind` (sessionStorage của phiên trước) → `z.discriminatedUnion("kind", [attempt, local_only])`. Payload hỏng → parse fail → fallback base (hành vi hiện tại giữ nguyên). **Đồng thời bump `PROTO_STORAGE_KEY` lên `-v3`**: chiều ngược lại (rollback deploy) không thể tolerant vì schema cũ là code cũ — payload mới `{kind:"local_only"}` sẽ làm schema cũ hard-fail toàn bộ `PersistedAppStateSchema` và reset mode/voice/practice; key mới cô lập sạch 2 chiều (giá trị cũ v2 bị bỏ — mất preference một lần, chấp nhận ở beta).
3. **Nhánh submit không có attemptId** (`exam-screen.tsx`): set `scoringAttempt: { kind: "local_only" }` thay vì bỏ trống; xóa comment #94 đã sai. Không flush, không submit (giữ nguyên — không có gì để flush lên).
4. **ScoringScreen** (`scoring-screen.tsx`): branch `job?.kind === "local_only"` render `LocalOnlyState` MỚI, đặt trước check `!job`; `useScoringJob` nhận `AttemptJob | null` (narrow tại call-site); `onSubmitted` guard thêm `kind === "attempt"`.
5. **Copy `LocalOnlyState`** (nguyên tắc kongming — nói 2 sự thật chắc chắn, không hứa 1 tương lai; red-team: `saveAudioBlob` có memory-fallback nên KHÔNG khẳng định tuyệt đối bản ghi còn trên máy):
   - Icon `TriangleAlert` (KHÔNG `CheckCircle2` success).
   - Title: `Chưa gửi được bài thi lên máy chủ`
   - Description: `Phiên thi chưa đồng bộ được với máy chủ nên câu trả lời của bạn chưa được ghi nhận. Bản ghi âm có thể vẫn còn lưu tạm trên thiết bị này nhưng chưa thể chấm điểm hay khôi phục tự động.`
   - Action: `Về trang chủ` (dashboard) + `Luyện thêm đề khác` (forecast) — chỉ offer action thật. KHÔNG nút "Gửi lại" (promise của Hướng 2 chưa build).
6. **Các constructor `ScoringJob` khác thêm `kind: "attempt"`** (TS ép cập nhật hết): `exam-screen.tsx:133` (forecast hand-off), `scoring-screen.tsx:40-45` (`onSubmitted`), `results-screen.tsx:77-78` (`openScoring`).
7. **Giữ nguyên**: `RecordedState` cho `null`/`not_scorable`; mock có attemptId (flush → submit → job null → RecordedState — server đã nhận, copy đúng); cơ chế `saveAudioBlob`/IndexedDB (ràng buộc #3 của issue — nguyên liệu phục hồi tương lai).

## Non-goals (Advisor Scope Lock)

- KHÔNG persist `clientSessionId`, KHÔNG flush device-copy cross-screen (Hướng 2 — issue riêng).
- KHÔNG đổi API/server (Hướng 3).
- KHÔNG đổi copy của `RecordedState`, không đổi bất kỳ flow có attemptId.

## Acceptance Criteria

1. Submit khi `attemptStatus: "failed"` (start reject hoặc sync treo >15s) → ScoringScreen hiện title `Chưa gửi được bài thi lên máy chủ`, KHÔNG hiện `Bài thi đã được ghi nhận!` / `Hệ thống đã lưu lại`.
2. Copy nêu đúng 2 sự thật chắc chắn: chưa lên server + bản ghi **có thể** còn lưu tạm trên thiết bị (hedged — `saveAudioBlob` có memory-fallback); không hứa khôi phục tự động; icon cảnh báo, không icon success; không nút "Gửi lại".
3. Unscored mode (`scoringAttempt: null`) và `not_scorable` giữ nguyên `RecordedState` — test hiện có `falls back to the recorded state…` và `keeps the unchanged recorded state…` vẫn xanh.
4. Schema sessionStorage round-trip giữ nguyên `kind` ở cả 2 variant; payload cũ thiếu `kind` hydrate thành `attempt`; storage key là `-v3` (cô lập rollback). (Không gắn narrative reload-UX: screen không persist, sau reload app luôn về màn đầu.)
5. Forecast hand-off, mock có attemptId, results "Xem tiến trình chấm" — hành vi không đổi (chỉ thêm `kind: "attempt"`).
6. `pnpm --filter web test` toàn bộ xanh; `pnpm check-types` exit 0.

## Non-goals (Advisor Scope Lock)

- KHÔNG persist `clientSessionId`, KHÔNG flush device-copy cross-screen (Hướng 2 — issue #123).
- KHÔNG đổi API/server (Hướng 3).
- KHÔNG đổi copy của `RecordedState`, không đổi bất kỳ flow có attemptId.
- KHÔNG xử lý attempt "ma" bị mock-retake kế tiếp adopt (`isMockMatch` chỉ match mode, không check recency — `use-exam-session.ts:146-150`) và deep-link `/scoring` hiện `RecordedState` khi chưa có job: cả hai được track ở issue hardening riêng, không thuộc scope này.
- KHÔNG thêm guard/redirect mới cho `/scoring`.

## Phases

- `phase-01-tdd-red.md` — test đỏ khóa hành vi trung thực + shape union mới.
- `phase-02-implement-green.md` — implement union + LocalOnlyState đến toàn bộ xanh + check-types.

## Red Team Review

### Session — 2026-11-10
**Reviewers:** Security Adversary (`RedSec`), Assumption Destroyer (`RedAssume`) — cả hai kèm vai trò Fact Checker (Light tier, 2 phases).
**Findings:** 8 (sau dedupe: 6 duy nhất) — 7 accepted, 0 rejected cứng; 2 finding trùng nội dung giữa 2 reviewer gộp làm 1.
**Severity breakdown:** 1 Critical, 2 High, 5 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Claim "xanh-at-red" sai cho `toEqual` (expected-value phải khớp 2 chiều; production chưa emit `kind` → các assertion vá shape sẽ ĐỎ ở red) — RedSec F1 + RedAssume F2 | High | Accept | Phase 1 Task 1.1/1.4 (dời shape-vá assertion sang phase-02), Verification phase-01 |
| 2 | 21 seed `scoring-screen.test.tsx` thiếu `kind` → narrow tại call-site biến `kind` thành runtime-load-bearing → ~22/24 test vỡ green + `tsc` fail (tsconfig không exclude `__tests__`) — RedAssume F1 | Critical | Accept | Phase 2 Task 2.7 (mở rộng thành shape sweep toàn bộ test files trước check-types) |
| 3 | Copy khẳng định tuyệt đối "bản ghi còn lưu tạm trên thiết bị" trong khi `saveAudioBlob` memory-fallback (lost on reload) — RedSec F2 + RedAssume F3 | High/Medium | Accept | plan.md thiết kế điểm 5, AC-2, Task 2.4 bước 5 |
| 4 | AC-4 hứa reload-UX không tồn tại (screen không persist; `local_only` job không bao giờ render lại sau reload) — RedSec F3 | Medium | Accept | AC-4 hạ thành schema round-trip |
| 5 | Rollback deploy: schema cũ hard-fail payload mới `{kind:"local_only"}` → reset mode/voice/practice — RedAssume F4 | Medium | Accept | Task 2.2 thêm bump `PROTO_STORAGE_KEY` → v3 |
| 6 | Attempt "ma" bị mock-retake kế tiếp adopt (`isMockMatch` không check recency) + deep-link `/scoring` hiện success copy giả khi chưa có job — RedSec F4 + RedAssume F5 | Medium | Accept (track ngoài scope) | Non-goals + issue hardening riêng; docstring Task 2.4 bước 6 sửa thành trung thực |
| 7 | Lệnh TS diagnosis Task 2.1 sai cwd (`-p apps/web` dưới `pnpm --filter web exec`) — RedSec F5 + RedAssume F6 | Medium | Accept | Task 2.1 sửa lệnh |

**Fact-check tổng:** 31/32 claim địa chỉ (file/symbol/line) VERIFIED; 3 claim hành vi FAILED (đã xử lý ở finding 1, 2, 6).

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-tdd-red.md`, `phase-02-implement-green.md` (sau khi áp accepted findings).
- Decision deltas checked: 7 — (1) shape-vá assertion/seed dời phase-01 → phase-02 Task 2.7 (trừ seeds `use-scoring-job` — tham số hook, xanh-an-toàn); (2) copy hedged "có thể vẫn còn lưu tạm" (plan.md + Task 2.4.5 + Task 1.2.3); (3) AC-4 hạ thành schema round-trip + key v3; (4) bump `PROTO_STORAGE_KEY` v2→v3 (plan.md 2, Task 2.2.1); (5) docstring `RecordedState` trung thực về null (Task 2.4.6); (6) lệnh TS diagnosis sửa cwd (Task 2.1); (7) non-goals thêm ma-attempt adoption + deep-link `/scoring` (track issue riêng).
- Reconciled stale references: 4 — pass condition phase-01 (6 đỏ, bỏ scored-results khỏi lệnh verify phase-01); "Files to Modify" phase-02 thêm 3 test files; success criteria Task 2.4 ghi chú đỏ-tạm-thời giữa 2.4→2.7; step numbering Task 2.2.
- Unresolved contradictions: 0.
