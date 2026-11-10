---
title: "Hardening export dữ liệu & giới hạn bind D1 (#92)"
date: 2026-11-10
---

# Hardening export dữ liệu & giới hạn bind D1 (#92)

## Bối cảnh
Issue #92: hai lỗi ở `packages/api/src/data-registry.ts` — (1) export cá nhân lộ trường vận hành (attempt_score full row, score_run full row với payloadJson/model/costUsd); (2) 4 chỗ `inArray` IN-list id attempt vỡ trần 100 bind parameters của D1 ở attempt thứ 101.

## Quyết định kỹ thuật
- Subquery `attempt_id IN (SELECT id FROM attempt WHERE user_id = ?)` thay IN-list: 1 bind param bất kể số attempt, xóa tận gốc không cần batch.
- `score_run.export` trả `[]` (dữ liệu vận hành, schema ghi "Never shown to the learner directly"); erase vẫn xóa đầy đủ.
- `attempt_score` export projection 7 trường kết quả học viên.
- Hai quyết định chốt với Chủ sản phẩm trong phiên tư vấn (báo cáo `plans/reports/92-hardening-export-d1-bind-advise.md`).

## Bài học
- Miniflare 4.20260730.0 CÓ enforce `SQLITE_MAX_VARIABLE_NUMBER=100` ở tầng SQLite C (ném lúc execute, không phải prepare) — fact-check ban đầu kết luận ngược; bằng chứng runtime ở RED phase đã đảo claim, và giúp test bind-limit có bằng chứng runtime thật chứ không chỉ shape assertion.
- Handler drizzle là hàm `async`: không thể lấy query builder từ giá trị trả về để assert `toSQL()` — phải wrap ở tầng driver D1 (`prepare`/`bind`).
- Chunk seed test: đếm theo binds/hàng thực tế của drizzle (attempt = 6 binds kể cả cột default), không phải số cột khai báo.
- Known limitation còn lại: `attempt.erase` N+1 có thể vượt trần 50 subrequest Workers Free với user lớn; `inArray` không giới hạn còn 1 chỗ ở `disputes/overdue.ts:55` (issue #101).

## Kết quả
RED đạt chuẩn (assertion 120 > 100 + shape) → GREEN 4/4 + full api 193/193 → check-types 7/7 → code review SHIP (0C/0I/3M đã sửa) → kongming GO pre-ship. Branch `fix/92-hardening-export-d1-bind`, plan `vox-flow/261110-0626`.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
