---
title: "Timeout 15s cho attempt sync — mở khoá nút nộp (fix #106)"
description: "Chuyển attemptStatus sang failed sau ~15s nếu chuỗi getActive/attempt.start treo không settle, giữ phục hồi khi id về muộn trong lúc màn thi còn mounted."
status: completed
priority: P1
effort: 2h
issue: 106
branch: vinh19410/fix/106-attempt-sync-timeout
tags: [bugfix, frontend]
blockedBy: []
blocks: []
created: 2026-11-10
---

# Timeout 15s cho attempt sync (fix #106)

## Overview

Nút nộp bài khoá vô hạn khi `attempt.getActive`/`attempt.start` treo: `httpBatchLink` của tRPC dùng `fetch` trần không timeout, request không bao giờ resolve/reject nên `attemptStatus` kẹt `"pending"` và `submitLocked` giữ nút nộp ở trạng thái "Đang đồng bộ phiên thi…". Plan thêm một timer trạng thái UI 15s: hết hạn mà bootstrap chưa settle thì chuyển `attemptStatus: "failed"` để người dùng nộp được; id attempt về muộn vẫn được áp dụng qua `applyAttemptId` **trong lúc ExamScreen còn mounted** (guard `active`, drain `pendingSessionRef`).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Nút nộp không khoá quá ~15s khi attempt sync treo | P1 |
| 2 | Id attempt về muộn phục hồi trạng thái ready + drain recording khi màn thi còn mounted | P1 |

## Gốc rễ (đã xác minh bằng đọc mã)

- `apps/web/src/features/exam/use-exam-session.ts:119-165` — effect bootstrap: chuỗi `trpcClient.attempt.getActive.query().then(...).catch(...)`; `.catch` chỉ chạy khi **reject**. Request treo → không bao giờ settle → `attemptStatus` stays `"pending"`.
- `apps/web/src/utils/trpc.ts:20-29` — `httpBatchLink` với `fetch` trần, không timeout/abort.
- `apps/web/src/features/exam/exam-screen.tsx:28,130` — `submit()` return sớm khi `pending`; `submitLocked={session.attemptStatus === "pending"}`.
- `apps/web/src/features/exam/components/pre-submit-modal.tsx:66-67` — nút hiện "Đang đồng bộ phiên thi…" khi locked.
- Repro: test đỏ 1.1 mới (never-resolving `start` + `advanceTimersByTimeAsync(15_000)` → nút vẫn locked) chứng minh trực tiếp hiện tượng trên code chưa fix.

## Quyết định thiết kế

- **Timer trạng thái UI, KHÔNG abort request**: request phải được chạy tiếp để id về muộn kịp `applyAttemptId` (đúng đề xuất của issue #106). Abort ở link level sẽ giết luôn id muộn → loại.
- Một timer duy nhất phủ cả chuỗi `getActive` → `start` (15s tổng từ mount), đặt trong effect bootstrap, clear ở `.finally` và ở cleanup unmount.
- Callback timer dùng functional update chỉ chuyển `pending → failed`: timer bắn muộn không thể ghi đè `ready`/`failed` hiện có.
- Hằng số `ATTEMPT_SYNC_TIMEOUT_MS = 15_000` ngay trong `use-exam-session.ts` (scope cục bộ, không cần config).

## Biên phục hồi id muộn (red-team finding #2)

Recovery qua `applyAttemptId` chỉ sống khi ExamScreen còn mounted (`use-exam-session.ts:126,158` guard `active`; unmount reset `active` tại `:168` và xoá `pendingSessionRef` tại `:299`). Kịch bản user submit ngay sau unlock rồi id về muộn hơn: id bị bỏ, bản ghi chỉ còn device-copy không đường flush, và ScoringScreen hiển thị "Hệ thống đã lưu lại toàn bộ câu trả lời của bạn" (`scoring-screen.tsx:88`) trong khi chưa có gì lên server. Đây là hành vi **đã tồn tại** ở nhánh reject tức thị (đã ship từ #105) và issue #106 chấp nhận rõ ("trước đây vẫn nộp được dù mất bài"). Fix này không mở rộng cũng không thu hẹp biên đó — xem Risk Assessment.

## Non-goals

- Không thêm retry/re-sync UI sau `failed` (path nộp khi `failed` đã tồn tại và có test "re-enables submit when attempt.start fails").
- Không đổi hành vi post-unmount của id muộn (flush cross-screen, persist `clientSessionId`) — đề xuất issue riêng nếu product muốn.
- Không đổi thông báo của ScoringScreen khi submit không có attemptId — hành vi có sẵn của nhánh reject; nêu trong PR làm follow-up candidate.
- Không đổi timeout của `postAnswerAudio` (`UPLOAD_TIMEOUT_MS` — cơ chế khác, đã có).
- Không đổi server lifecycle (`start` insert vô điều kiện, `getActive` lấy `in_progress` mới nhất — có từ trước, fix này không ảnh hưởng).
- Không sửa `routeTree.gen.ts`, không đụng migration.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Test đỏ — timeout attempt sync](./phase-01-start.md) | Completed |
| 2 | [Implement timer + gates xanh](./phase-02-implement-timer.md) | Completed |

## Acceptance Criteria

- [x] AC1: `start`/`getActive` không phản hồi → sau 15s `attemptStatus` chuyển `"failed"`; nút trong pre-submit modal chuyển từ "Đang đồng bộ phiên thi…" (disabled) sang enabled với label khớp `/nộp & chấm/i` (biến thể "Vẫn nộp & chấm" khi có câu ngắn — fixture test dùng câu ngắn), submit đi tiếp `go("scoring")` không gọi `attempt.submit`.
- [x] AC2: Id attempt về muộn **sau mốc 15s nhưng trước khi user rời màn thi** vẫn áp dụng: trước `resolve` phải thấy nút đã unlocked (assert đỏ trước fix), sau resolve `attemptStatus` → `"ready"`, bản ghi pending được `trackAnswerUpload` dưới attempt thật, submit practice tạo `scoringAttempt` với id đó. (Ngoài cửa sổ mounted: xem "Biên phục hồi id muộn".)
- [x] AC3: Bootstrap settle thành công (id về sớm) → timer được clear/guard chặn, `attemptStatus` giữ `"ready"` qua mốc 15s (kiểm chứng bằng hook-probe test — UI không phân biệt ready/failed).
- [x] AC4: Không regression: toàn bộ suite web `pnpm --filter web test` pass (gồm `slice-c.test.tsx`, `forecast-flow.test.tsx` — cũng mount ExamScreen với fake timers).
- [x] AC5: `pnpm check-types` exit 0.

## Verification (tổng)

```bash
pnpm --filter web test        # exit 0 (full suite web)
pnpm check-types              # exit 0
```

## Risk Assessment

- **Id muộn sau submit (biên đã ghi trên)**: user mất bài server-side nhưng device-copy còn; đề xuất follow-up: cảnh báo trung thực khi submit không attemptId hoặc flush cross-screen. Nêu trong PR + issue.
- **Timer bắn giữa chừng request chậm nhưng hợp lệ (≈15s)** → `failed` tạm thời, id về thì `ready` lại; chấp nhận theo đề xuất issue.
- **Unmount qua điều hướng** (submit/rời màn thi): cleanup clear timer + `active = false` — timer không bắn vào component đã chết.
- **Orphan `in_progress` rows**: `attempt.start` insert vô điều kiện (`packages/api/src/routers/attempt.ts:89-102`), `getActive` trả `in_progress` mới nhất — hành vi server có từ trước, không đổi bởi fix này.

## Red Team Review

### Session — 2026-11-10
**Reviewers:** Security Adversary + Assumption Destroyer (song song, Light tier / Fact Checker)
**Findings:** 8 sau dedupe (0 Critical giữ nguyên danh mục gốc 1 Critical + 3 High + 4 Medium/minor)
**Severity breakdown:** 1 Critical, 3 High, 4 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Phase 1 gate tự khoá: Task 1.2 xanh trước fix (advance 15s pre-fix là no-op); "đúng 2 test fail" bất khả thi | Critical | Accept | Phase 1 Goal, Task 1.2, Verification |
| 2 | AC2 oversell: id muộn chết khi user submit → unmount (`active=false`, `pendingSessionRef` xoá, không đường flush device-copy); RecordedState nói "đã lưu" | High | Accept (modified) — thu hẹp AC2 vào cửa sổ mounted + ghi biên; không xây drain cross-screen (ngoài scope #106) | plan.md Overview/Goals/AC2/section Biên; phase-02 Risk |
| 3 | Fail-mode đỏ mô tả sai: `getByText(/nộp & chấm/i)` ném TestingLibraryElementError, không phải assertion "disabled" | Medium | Accept | Phase 1 Task 1.1/1.2 Verify |
| 4 | AC1 literal "Nộp & chấm điểm" không đạt được với fixture (flagged → "Vẫn nộp & chấm") | Medium | Accept | AC1 wording |
| 5 | AC3 không có đường verify (UI không phân biệt ready/failed) | Medium | Accept (modified) — hook-probe test ở Phase 2 | AC3, Phase 2 Tests After |
| 6 | Regression gate chỉ 1 file; `slice-c.test.tsx`, `forecast-flow.test.tsx` cũng mount ExamScreen với fake timers | Medium | Accept | AC4, Phase 2 Verification |
| 7 | Orphan `in_progress` + silent resume `getActive` — hành vi server có sẵn | Medium | Accept (doc-only) | Risk Assessment, Non-goals |
| 8 | Risk nhắc StrictMode nhưng app không dùng StrictMode (`main.tsx` render trần) | Minor | Accept | Risk Assessment (framing unmount-điều hướng) |

Findings bị loại sau evidence filter: 0.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02-implement-timer.md (sau khi áp findings).
- Decision deltas checked: 5 — (a) recovery scoped "mounted-only" xuyên suốt Overview/Goals/AC2/phase-02; (b) Task 1.2 đỏ bằng assert unlock-trước-resolve, Verification Phase 1 yêu cầu đúng 2 test đỏ với đúng cơ chế; (c) AC4 đổi thành full web suite; (d) AC3 map vào probe test; (e) bỏ nhắc StrictMode.
- Reconciled stale references: 4 ("2 test mới fail" cũ trong phase-01; "vô điều kiện an toàn" trong Overview cũ; claim repro dựa trên test "keeps the recording device-only"; AC1 label literal).
- Unresolved contradictions: 0.
