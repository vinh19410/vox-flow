---
title: "Fix 94: upload bù bản ghi âm khi attemptId trả về muộn"
description: "Drain registry bản ghi âm pending đồng bộ ngay khi attemptId về, kèm attemptStatus tri-state khoá nộp khi đang đồng bộ, để câu trả lời luôn được chấm và có trong lịch sử."
status: completed
priority: P1
effort: 4h
issue: 94
branch: vinh19410/fix/94-attempt-start-race-upload
tags: [bugfix, frontend]
blockedBy: []
blocks: []
created: 2026-11-10
---

# Fix 94: upload bù bản ghi âm khi attemptId trả về muộn

## Overview

Nếu học viên trả lời xong một câu trước khi `attempt.start` trả về `attemptId` (mạng chậm khi vào phòng thi), `stopRec()` trong `apps/web/src/features/exam/use-exam-session.ts` lưu bản ghi vào IndexedDB dưới client session id và không upload. `flushAnswerUploads(attemptId)` lúc submit chỉ quét theo `attemptId` thật nên bản ghi bị mồ côi: không có trong `attempt_answer`, không được chấm, không có trong lịch sử. UI cũng cho phép nộp khi `attemptId` chưa về (`exam-screen.tsx` rơi xuống nhánh mock → dead-end scoring screen).

Hướng sửa (phương án 1 của issue #94; kongming advise 2 checkpoint; red-team 2 persona): hook giữ **registry in-memory** cho bản ghi pending; **drain đồng bộ ngay trong `applyAttemptId`** (trước cả `setAttemptId`) — ticket và `inFlight` cấp trước mọi thao tác ghi lại/submit theo cấu trúc. Thêm **`attemptStatus` tri-state**: `pending` (khoá nộp) / `ready` / `failed` (giữ nguyên luồng cũ — không regression offline). `answer-uploads.ts` **không đổi**.

## Root cause (đã chứng minh, ak-debug)

1. `use-exam-session.ts` `stopRec()`: khi `attemptId === null`, record mang `attemptId = clientSessionIdRef.current` và nhánh else chỉ gọi `saveAudioBlob` — không upload, không track.
2. Effect khởi tạo chỉ `setAttemptId` khi `attempt.start`/`attempt.getActive` trả kết quả; không có upload bù; `.catch(() => {})` nuốt lỗi offline/mock.
3. `flushAnswerUploads(attemptId)` chỉ quét in-flight/`failedUploads`/IndexedDB theo `attemptId` thật → bản ghi dưới session id không bao giờ được quét.
4. `exam-screen.tsx submit()`: khi `session.attemptId` null, mọi nhánh bỏ qua → vẫn `setPendingSubmission(true); go("scoring")` → dead-end + registry chết cùng unmount.

## Thiết kế cuối (kongming checkpoint #2 sau red-team)

- **Registry + drain đồng bộ trong `applyAttemptId`** (không qua passive effect): `attemptIdRef` gán → drain registry (trackAnswerUpload cho từng entry) → `setAttemptId`. Toàn bộ chạy trong một khối đồng bộ → cửa sổ ticket inversion và cửa sổ submit-giữa-commit-và-effect biến mất do cấu trúc; microtask handler chạy trước drain thì thấy ref null (vào registry), chạy sau thì thấy ref set (direct-track, ticket muộn hơn) — bất biến giữ đúng theo cả hai hướng.
- **`attemptStatus: "pending" | "ready" | "failed"`** (điều kiện bắt buộc của kongming): `.catch(() => {})` của init effect làm `attemptId` null vĩnh viễn khi offline/mock-test — nếu khoá nộp theo `attemptId == null` thì học viên offline không bao giờ nộp được (regression). Chỉ khoá khi `pending`; `failed` → fall-through giữ nguyên hành vi cũ; `ready` → bình thường.
- **Registry entry resolve sau khi session save settle**: giá trị registry là `saveAudioBlob(record).catch(() => {}).then(() => record)` — delete sau upload không bao giờ chạy giữa lúc ghi device copy (không orphan mid-write).
- **Xoá session copy chỉ khi `trackAnswerUpload(...) === true`** (server xác nhận): `serializeStorage` nuốt lỗi save; không xoá khi chưa có xác nhận.
- **Cleanup unmount chỉ clear Map in-memory, KHÔNG xoá device copy** (mâu thuẫn F5 ElegantFrog[PII] vs kongming[data-safety] — chọn data-safety: session copy có thể là bản duy nhất, follow-up recovery F7 sẽ cần).
- **Nhánh stopRec quyết theo `attemptIdRef` lúc encode resolve**; nhánh direct-track xoá entry registry trước khi track (phòng thủ); nhánh đồng bộ khi đã có id giữ nguyên thời điểm track (test cũ không đổi).
- **StrictMode**: app không wrap StrictMode; drain chạy đúng một lần trong `applyAttemptId` nên không cần disposed-flag.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Registry pending + drain đồng bộ trong use-exam-session (TDD)](./phase-01-start.md) | Pending |
| 2 | [attemptStatus + chặn nộp khi đang đồng bộ (TDD)](./phase-02-submit-gate.md) | Pending |
| 3 | [Regression gates toàn exam/scoring + check-types](./phase-03-regression.md) | Pending |

## Non-goals (Advisor Scope Lock) — follow-up đã ghi nhận

- Không chặn **ghi âm** khi chưa có `attemptId` (phương án 2 của issue).
- Không đổi `answer-uploads.ts`/API server.
- Không khôi phục bản ghi qua reload (meta trail cross-mount) — follow-up.
- Không sửa race submit-vs-in-flight-upload của nhánh mock — pre-existing, follow-up.
- Không chuyển `questionText` khỏi URL query — pre-existing, follow-up.
- Không đổi fallback `"session-local"` — pre-existing, follow-up.
- Không xử lý `attempt.start` treo vĩnh viễn (không resolve không reject) — `pending` kéo dài; độ hiếm chấp nhận được, ghi nhận follow-up nếu xảy ra thực tế.

## Acceptance Criteria

- [ ] AC1: Trả lời xong khi `attemptId` còn null, sau đó `attempt.start` resolve → đúng 1 lần track dưới id thật, record resolve dưới id thật; xoá session copy **đúng 1 lần, dưới session id** (assert chính xác), chỉ sau khi track resolve `true`.
- [ ] AC2: Encode race — encode resolve sau khi id về → track dưới id thật, không qua registry, không save session copy.
- [ ] AC3: Offline/mock (`attempt.start` không bao giờ resolve) → không track/POST, bản ghi device-only.
- [ ] AC4: Nhánh `attempt.getActive` (resume) cũng drain registry — test runtime riêng.
- [ ] AC5: Hai take cùng câu pending → registry last-write-wins, chỉ take MỚI được track (test khóa).
- [ ] AC6: Nộp ngay khi id vừa về → đăng ký backfill đã chạy trước handler submit (drain đồng bộ trước `setAttemptId`; test khóa `trackUploadSpy` đã gọi sau click).
- [ ] AC7: Tri-state — `pending`: nút nộp khoá "Đang đồng bộ phiên thi…" + click vô hiệu; `ready`: mở khoá, hai path (practice/mock) nộp bình thường; `failed`: nút mở khoá với nhãn thường, nộp theo fall-through cũ (không regression offline).
- [ ] AC8: Unmount khi còn pending → chỉ clear registry in-memory, KHÔNG xoá device copy session.
- [ ] AC9: `pnpm check-types` pass; toàn bộ test `src/features/exam` và `src/features/scoring` pass.

## Validation Log

### Verification Results
- Claims checked: 12 (root cause 3 + thiết kế 6 + test conventions 3)
- Verified: 12 | Failed: 0 | Unverified: 0
- Tier: Light (Fact Checker inline bởi controller; red-team reviewer kiểm chứng lại khi đối chiếu code)
- Failures: không có. Claim "submit ngoài tầm với" bị red-team BÁC (F1) → đã sửa thành Phase 2.

### Kongming checkpoint #2 (sau plan gates) — điều chỉnh áp vào plan
1. `attemptStatus` tri-state bắt buộc (offline khoá vĩnh viễn nếu khoá theo attemptId null) → Phase 2 + Test 7.
2. Xoá session copy chỉ khi upload `true`; entry registry resolve sau session save → Phase 1 steps 5–6.
3. Drain đồng bộ trong `applyAttemptId`, không qua effect → Phase 1 step 6; Test 5 chuyển thành last-write-wins; bỏ backfilledAttemptRef.
4. Cleanup unmount memory-only → Phase 1 step 7; AC8 revised.

## Red Team Review

| # | Finding | Severity | Nguồn | Disposition |
|---|---------|----------|-------|-------------|
| F1 | Submit khi `attemptId === null` khả thi (nhánh mock fall-through) → dead-end scoring + mất registry | Critical | ExtremeTuna #1, ElegantFrog #1 | **Accept** — Phase 2 (submit gate tri-state) |
| F2 | AC4 (getActive resume) không có test runtime | High | ExtremeTuna #2, ElegantFrog #6 | **Accept** — Phase 1 Test 4 |
| F3 | Assertion xoá device copy dùng `expect.any(String)` che bug xoá nhầm id thật | High/Medium | ElegantFrog #2, ExtremeTuna #3 | **Accept** — Phase 1 Test 1 assert chính xác + `toHaveBeenCalledTimes(1)` |
| F4 | Ticket inversion ở cửa sổ ref-set → effect-flush | Critical | ExtremeTuna #4 | **Accept (superseded by kongming #3)** — drain đồng bộ trong `applyAttemptId` đóng bằng cấu trúc; Test 5 pin last-write-wins |
| F5 | Unmount trước khi id về để lại audio trên device | Medium | ExtremeTuna #5 | **Accept (modified)** — cleanup memory-only per kongming #4 (data-safety thắng PII-hygiene; follow-up recovery sẽ tận dụng) |
| F6 | Invariant "đăng ký trước submit" không có test khóa | Medium | ElegantFrog #4 | **Accept** — Test 6; phần integration test với module thật bị loại (đã có test `inFlight` hiện có) |
| F7 | Reload trước khi id về → bản ghi thật stranded | Medium | ElegantFrog #3 | **Reject cho PR** — follow-up (meta trail cross-mount) |
| F8 | Mock path background submit không chờ flush → 400 sau finalize | Medium | ElegantFrog #5 | **Reject cho PR** — pre-existing, follow-up |
| F9 | `questionText` trong URL query (privacy/access log) | Low | ElegantFrog #8, ExtremeTuna #6 | **Reject cho PR** — pre-existing, follow-up |
| F10 | Fallback `"session-local"` va chạm cross-tab | Low | ElegantFrog #7 | **Reject cho PR** — pre-existing, follow-up |

### Whole-Plan Consistency Sweep (sau adjudication + kongming #2)
- Term cũ (`wire-hook-and-regression`, `backfillSessionUploads`, scan-IDB, "ngoài tầm với") — sạch; phases table khớp file phase-01/02/03.
- AC mapping: AC1–AC5, AC8 → Phase 1; AC6, AC7 → Phase 2; AC9 → Phase 3. `attemptStatus` nhất quán giữa plan và phase-01/02.
