---
title: "Hardening export dữ liệu & giới hạn bind D1 trong data-registry"
description: "Sửa #92: export chỉ chứa trường dữ liệu cá nhân của học viên; mọi query trong DATA_REGISTRY dùng subquery theo userId thay vì IN-list id để không vượt 100 bind parameters của D1."
status: completed
priority: P1
effort: 4h
issue: 92
branch: fix/92-hardening-export-d1-bind
tags: [bugfix, api, database, auth]
blockedBy: []
blocks: []
created: 2026-11-10
---

# Hardening export dữ liệu & giới hạn bind D1 (`packages/api/src/data-registry.ts`)

## Overview

Hai lỗi đã kiểm chứng ở `packages/api/src/data-registry.ts` (phát hiện khi review #90, tư vấn đầy đủ trong `plans/reports/92-hardening-export-d1-bind-advise.md`):

1. **Leak trường vận hành:** `attempt_score` export nguyên row (`model`, `tries`, `lastError`, `costUsd`, `updatedAt`) và `score_run` export toàn bộ row (`payloadJson` — output thô từng run chấm, `model`, `costUsd`, token usage), trong khi schema ghi rõ score_run *"Never shown to the learner directly"*. PRD F-21 chỉ cam kết export "toàn bộ dữ liệu lịch sử bài làm và bản gỡ băng".
2. **Vỡ giới hạn bind D1:** D1 giới hạn **100 bind parameters/query**. `inArray(col, attemptIds)` với `attemptIds` lấy toàn bộ attempt của user vỡ ở attempt thứ 101 (4 chỗ: `score_run.export`, `score_run.erase`, `attempt_answer.export`, `attempt_answer.erase`). Học viên dùng đều 3 lượt/ngày (WI-14) vượt mốc sau ~34 ngày.

**Quyết định đã chốt với Chủ sản phẩm** (xem comment tư vấn trên issue #92):

- Chính sách trường = A: bỏ `score_run` khỏi export cá nhân; `attempt_score` chỉ export trường kết quả học viên; `score_run` vẫn bị xóa đầy đủ khi erase.
- Phạm vi sửa = cả 4 chỗ IN-list (export + erase).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `attempt_score` export trả đúng 7 trường kết quả học viên, không rò trường vận hành | P1 |
| 2 | `score_run` không còn row nào trong payload export nhưng vẫn bị xóa đầy đủ khi erase | P1 |
| 3 | Cả 4 chỗ IN-list dùng subquery theo `userId` (1 bind param bất kể số attempt) | P1 |
| 4 | Test regression: fixture >100 attempts, assert bind params ≤ 100 và shape export mới | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Hardening data-registry export & D1 bind limit](./phase-01-start.md) | Pending |

## Success Criteria

- [ ] `attempt_score` export trả đúng 7 trường: `attemptId`, `status`, `overall`, `criteriaJson`, `oneLiner`, `createdAt`, `scoredAt`.
- [ ] `data.score_run` trong payload export luôn rỗng; `eraseUserData` vẫn xóa vật lý mọi row `score_run` của user.
- [ ] Cả 4 chỗ IN-list thay bằng subquery `attempt_id IN (SELECT id FROM attempt WHERE user_id = ?)`; helper `userAttemptIds` bị xóa (không còn caller).
- [ ] Test mới: fixture ≥ 120 attempts (seed `user` trước vì FK); mọi captured query qua recordingD1 (wrap `prepare`/`bind` tầng driver) assert `params.length <= 100` (cả export lẫn erase); assert shape export mới; erase sạch với >100 attempts.
- [ ] `pnpm --filter @vox-flow/api test src/data-registry.test.ts` pass; `pnpm check-types` pass.

## Known Limitations

- Trần subrequest của `attempt.erase` (N+1 per-attempt) trên Workers thật: known-limitation ngoài scope, cần ticket riêng trước khi nối luồng erase vào router (chi tiết trong phase-01-start.md §Known Limitations).
- "Erase sạch với >100 attempts" là bằng chứng runtime local cho bind limit (Miniflare enforce 100 SQL variables); trần 50 subrequest của Workers Free thì Miniflare KHÔNG enforce — vẫn là known-limitation (bullet 1).

## Out of Scope

- Migration/đổi schema; đổi semantics erase; sửa các handler bảng khác trong `DATA_REGISTRY`.
- Kết luận pháp lý về phân loại dữ liệu (OQ-6, hold — thuộc luật sư).
- UI export trong `apps/web` (chưa có client gọi `privacy.exportData`).
- Chia batch 100 id (subquery xóa tận gốc; tránh vòng lặp query trên trần 50 subrequests Workers Free).
- Đưa `score_run` vào `NON_PERSONAL_TABLES` (nó gắn user và bắt buộc erase).
- Cờ config export đầy đủ/rút gọn (YAGNI).

## Unverified cần xác nhận khi triển khai

- `inArray(col, subquery)` trên drizzle 1.0.0-rc.5: **đã xác nhận ở mức type** (`sql/expressions/conditions.d.ts:170-172` chấp nhận `SQLWrapper`; delete where nhận `SQL`); runtime D1 xác nhận bằng test mới + check-types trong phase. Fallback nếu runtime lỗi: `innerJoin` (SELECT) hoặc raw `sql` template (DELETE).
- Hành vi D1 thật với >100 binds: **tái hiện được local** — Miniflare 4.20260730.0 CÓ enforce (giới hạn 100 biến nằm ở tầng SQLite C `SQLITE_MAX_VARIABLE_NUMBER`, ném `too many SQL variables` lúc execute, không phải lúc prepare — kiểm chứng runtime ở RED phase; lần đầu plan ghi "không enforce" là sai và đã đảo). Bằng chứng local: assert `params.length` qua recordingD1 + lỗi runtime D1.

## Validation Log

### Session — 2026-11-10
- **Gate:** `ak plan validate plans/261110-0626-hardening-export-d1-bind` → `[OK]` (exit 0).
- **Verification (tier Light, Fact Checker ×2 reviewers):**
  - Claims checked: 47 · Verified: 40 · Failed: 3 · Unverified: 4
  - Failed (đã xử lý): lệnh gate qua `--filter web` không collect được test (`apps/web/vitest.config.ts:19` include `src/**`); claim "handler trả thenable builder" sai (handler `async` → `Promise`, `data-registry.ts:33,125,162`); fixture thiếu row `user` cha (FK ON, `test/db.ts:41` + `attempt.ts:12-14`).
  - Failed (xử lý tại RED phase 2026-11-10, claim #4): "Miniflare không enforce trần 100 bind" **bị đảo** bằng runtime — insert 50×4 cột ném `D1_ERROR: too many SQL variables at offset 1581` (`SQLITE_MAX_VARIABLE_NUMBER=100` tầng SQLite C, ném lúc execute). Xử lý: chunk seed theo quy tắc rows×cột ≤ 100 (20 attempts, 10 answers); test bind-limit bắt lỗi runtime bằng `.then(() => null, e => e)` + assert `err` null ở GREEN (counsel kongming, chấp nhận kèm 3 ràng buộc).
  - Unverified: trần 100 bind D1 production (external — docs Cloudflare, xem báo cáo tư vấn; đã có tương đương runtime local qua Miniflare); quyết định Chủ sản phẩm (ngoài codebase — xem comment issue #92); runtime `inArray` subquery (type đã OK, runtime chờ test).

## Red Team Review

### Session — 2026-11-10
**Reviewers:** Security Adversary + Assumption Destroyer (tier Light — vai trò Fact Checker)
**Findings:** 11 báo cáo → 8 unique sau dedup (8 accepted, 0 rejected)
**Severity breakdown:** 2 Critical, 3 High, 3 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Gate test sai package: `--filter web` không collect file test `packages/api` (include `src/**`) → RED/GREEN đều chết | Critical | Accept | Task 1.1/1.2 Verify, Verification, plan.md Success Criteria → `pnpm --filter @vox-flow/api test src/data-registry.test.ts` |
| 2 | Task 1.1 assert `score_run.export` 120 row vs Task 1.2 biến nó thành `[]` → GREEN không thể pass | Critical | Accept | Task 1.1 redesign: bind-limit test dùng sweep `exportUserData`/`eraseUserData`, không đo per-handler `score_run.export` |
| 3 | Handler `async` tự resolve thenable → không lấy được `toSQL()` từ giá trị trả về (TypeError) | High | Accept | Cơ chế chung: capture qua Proxy db tại `.where()`, không cast giá trị trả về |
| 4 | FK cascade làm assertion đếm row sau erase thành vacuous; `attempt_answer.erase` là no-op do thứ tự handler | High | Accept | Task 1.1 step 3: đếm vật lý chỉ là behavior-lock; bằng chứng handler = Proxy capture; Known Limitations ghi no-op ordering |
| 5 | Capture sai thời điểm (trước `.where`) → `params.length = 0`, pass trắng; thiếu guard số capture | Medium | Accept | Task 1.1: wrap `.where` post-call; assert captured ≥ 3 (export) / ≥ 2 (erase); tripwire RED `> 100` |
| 6 | Fixture thiếu row `user` cha → FK violation giết fixture trước assertion | Medium | Accept | Task 1.1 step 1-2: seed `user` trước |
| 7 | Thiếu đếm vật lý `attempt_answer` sau erase | Medium | Accept | Task 1.1 step 3: đếm `attemptAnswer` att_reg_1 = 0 / att_reg_2 = 1 |
| 8 | `attempt.erase` N+1 vượt trần 50 subrequests Workers Free với user lớn → criterion "erase sạch" không production-safe | Medium | Accept | Known Limitations (plan.md + phase); follow-up ticket cần mở trước khi wire erase vào router |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md (sau khi áp findings)
- Decision deltas checked: 4 (đổi lệnh gate; đổi cơ chế đo bind sang Proxy sweep; hạ vai trò đếm vật lý thành behavior-lock; thêm Known Limitations)
- Reconciled stale references: mọi chỗ còn lại nhất quán (không còn `--filter web`, không còn claim "thenable trả về", không còn assert `score_run.export` trả 120 row)
- Unresolved contradictions: 0

### Kongming post-gate counsel — 2026-11-10
**Verdict: GO có điều kiện.** Điều chỉnh bắt buộc đã áp vào phase file:
- (A) `score_run.export` thành `async () => []` (không giữ `db, userId` — `noUnusedParameters` tại `tsconfig.base.json:18` sẽ fail check-types).
- (B) Cơ chế đo bind đổi từ Proxy tầng builder sang wrap tầng driver D1 (`prepare`/`bind`, dựng db bằng `createDb({ DB: recordingD1 })`) — Proxy builder chỉ còn là fallback.
Nên làm (đã áp): (C) tạo recordingDb sau seed / reset trước sweep; (D) stop rule cấm nới assert bind; (E) comment convention viết chung "bảng mới trỏ tới attempt/user" thay vì đích danh `push_subscription`.
Risk watch: executor không được coi đếm row sau erase là bằng chứng chính (cascade); guard captured-count + tripwire RED là tripwire chống capture rỗng.
