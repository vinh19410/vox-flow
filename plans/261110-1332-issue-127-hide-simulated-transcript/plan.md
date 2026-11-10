---
title: "Ẩn transcript giả lập khi ghi âm (issue #127)"
description: "Thay chữ transcript giả lập từ đáp án mẫu bằng UI trung thực: label 'Đang ghi âm…', không chữ giả, sau ghi hiển thị thời lượng + ghi chú transcript ở màn kết quả."
status: completed
priority: P1
effort: 2h
issue: 127
branch: vinh19410/fix/hide-simulated-transcript
tags: [bugfix, frontend]
blockedBy: []
blocks: []
created: 2026-11-10
---

# Ẩn transcript giả lập khi ghi âm (issue #127)

## Overview

Issue #127: label "Đang ghi âm & nhận dạng giọng nói…" hiển thị transcript **giả lập** — văn bản chạy lên là đáp án mẫu của câu hỏi (2.6 từ/giây), không theo micro. PO đã chốt hướng **"Ẩn chữ giả lập"**: khi ghi chỉ giữ label trung thực; sau ghi hiển thị thời lượng thật; chữ thay bằng câu ghi chú trung lập. Không dùng Web Speech API. (Red-team đã hạ copy từ "(Transcript hiển thị ở kết quả)" xuống trung lập — user duyệt — vì promise đó sai ở nhánh `local_only`, scoring `failed`, và flag `VITE_FEATURE_SCORING` off.)

Root cause (đã verify code, commit `b335a85`):
- `apps/web/src/features/exam/use-exam-session.ts:16` — `WPS = 2.6` (simulated words-per-second).
- `use-exam-session.ts:184-185` — `words` = `step.answer.split(" ")` (đáp án **mẫu**); `spoken = min(words.length, floor(recT*WPS))`.
- `components/live-transcript.tsx:38` — label hàm ý nhận dạng thật; `:43` render `words.slice(0, shown)`; `:40` bộ đếm "{shown} từ" cũng giả (cả phase answered: `shown = ans?.words`, mà `ans.words` đến từ simulation tại `use-exam-session.ts:151-152,244-245`).

Transcript thật chỉ tồn tại phía server (kênh chấm điểm, hiển thị ở màn kết quả) — không sai dữ liệu chấm, chỉ sai kỳ vọng người dùng.

## Scope

**Trong scope:**
- Panel `LiveTranscript` (phase `recording` + `answered`) — bỏ chữ giả lập, bỏ bộ đếm từ giả, label trung thực, hiển thị thời lượng thật sau ghi với câu ghi chú TRUNG LẬP.
- Dọn dead code do thay đổi: props `words`/`spoken` của `LiveTranscript`, export `words`/`spoken` khỏi `ExamSessionValue`, call-site `exam-screen.tsx:215`.
- Test mới: `apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx` (chưa tồn tại — chưa có test nào ghim UI cũ).

**Ngoài scope (known limitation, ghi nhận trên issue #127):**
- Heuristic `ans.words` (giả lập) vẫn feed cảnh báo "Câu trả lời khá ngắn (N từ)" (`exam-screen.tsx:218-225`) và "N từ" ở `pre-submit-modal.tsx:78`. Đây là heuristic nội bộ, không tuyên bố là nhận dạng giọng nói. Kongming lưu ý thêm: `spoken = min(len(answer), floor(recT*2.6))` nên cảnh báo "ngắn" thực chất hoạt động như ngưỡng thời gian trá hình; và khi restore (reload trang) code hardcode `words: 20` (`use-exam-session.ts:151-152`) → mọi bài Part 2/3 khôi phục **luôn** bị gắn cờ "khá ngắn (20 từ)". Sửa đúng = đổi sang ngưỡng thời lượng (MIN_SECS) — cần quyết định sản phẩm → **follow-up issue riêng** (AC9), không phình scope PR này.
- Nhận dạng giọng nói thật phía client (Web Speech API) — PO không chọn hướng này.
- Pulse bars trang trí trong header panel (CSS animation, không tuyên bố là sóng micro).
- Nhánh `examiner-thinking` của LiveTranscript khả năng là dead code (exam-screen chỉ render panel khi `recording`/`answered`) — giữ nguyên, ngoài scope issue.
- a11y: label ghi âm dùng `role="status"` (đọc một lần khi vào trạng thái ghi); không gắn `aria-live` lên timer.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Khi ghi âm: không hiển thị văn bản đáp án mẫu; label "Đang ghi âm…" | P1 |
| 2 | Sau khi ghi: thời lượng thật + câu ghi chú trung lập, không promise điều không verifiable | P1 |
| 3 | Không còn chữ/bộ đếm giả nào trong panel; dead code được dọn | P2 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [TDD Red — test trung thực cho LiveTranscript](./phase-01-tdd-red.md) | Pending |
| 2 | [Implement Green — sửa LiveTranscript + dọn hook](./phase-02-implement-green.md) | Pending |

## Acceptance Criteria

- [ ] AC1: khi `phase === "recording"`, panel không render `<p>` body (assertion cấu trúc) và không render bất kỳ từ nào của `step.answer`. Bảo vệ chính là xoá prop `words` khỏi API component (type-level); assertion "quite tidy" giữ làm documentation — red-team F4: nó không thể fail vì không có kênh truyền text.
- [ ] AC2: label khi ghi là "Đang ghi âm…" — không chứa "nhận dạng giọng nói"; caret nhấp nháy bị xoá (một phần của ảo giác transcript).
- [ ] AC3: không còn bộ đếm "N từ" trong panel (kể cả sau ghi).
- [ ] AC4: khi `phase === "answered"` và có `ans`, panel hiển thị "Đã ghi âm · {mmss}" với thời lượng từ `ans.durationMs ?? ans.secs*1000` (`mmss` từ `lib/format.ts`, format `"0:32"`) và câu TRUNG LẬP "(Transcript không hiển thị trong phòng thi.)" — đúng ở mọi nhánh kể cả `local_only`, scoring failed, flag scoring off (red-team F2/F3).
- [ ] AC5: chuỗi "(Không nhận được giọng nói)" — điều kiện giả dựa trên số từ simulation — bị xoá khỏi LiveTranscript; assertion vô nghĩa tại `forecast-flow.test.tsx:238` bị thay bằng check thật `getByText(/Đã ghi âm/)`; comment/tên test không còn claim "valid transcript".
- [ ] AC6: phase `examiner-thinking` không đổi ("Giám khảo AI đang phân tích câu trả lời…").
- [ ] AC7: `ExamSessionValue` không còn export `words`/`spoken`; `exam-screen.tsx` không truyền chúng nữa; `pnpm check-types` xanh.
- [ ] AC8: `pnpm --filter web test src/features` exit 0 — gồm canary scope `slice-c.test.tsx` ("Câu trả lời khá ngắn (2 từ)." + 8× `^\d+ từ$` trong pre-submit giữ nguyên), `pre-submit-modal`, `exam-submit`, `forecast-flow` và mọi test khác dưới `src/features`.
- [ ] AC9: follow-up issue (label `ai-handle`, vào project vinh19410/projects/15) được tạo cho heuristic `ans.words` + bug `words: 20` (mục Known limitations).

## Validation Log

### Verification Results (Fact Checker, Light tier — 2026-11-10)
- Claims checked: 12 | Verified: 12 | Failed: 0 | Unverified: 0 | Tier: Light (1-2 phases, 5 claims/phase)
- Phase 1: (1) props LiveTranscript `{phase, words, spoken, ans}` — verified `live-transcript.tsx:3-11`; (2) label cũ line 38 — verified; (3) `mmss(32)` = `"0:32"` — verified `lib/format.ts:5-6`; (4) test conventions `pre-submit-modal.test.tsx` — verified (vitest + @testing-library/react); (5) `ExamAnswer {secs, words, durationMs?}` — verified `types.ts:49-53`; (6) chưa có test LiveTranscript — verified `find …exam -name "*.test.*"`.
- Phase 2: (1) `session.words`/`session.spoken` chỉ 1 consumer `exam-screen.tsx:215` — verified `grep -rn` toàn src; (2) `ans.words` simulation `use-exam-session.ts:151-152,244-245` — verified; (3) slice-c canary "Câu trả lời khá ngắn (2 từ)." + `getAllByText(/^\d+ từ$/)`×8 — verified `features/__tests__/slice-c.test.tsx:219,251,290`; (4) assertion forecast-flow.test.tsx:238 — verified; (5) alias `@/lib/format` dùng đúng kiểu ở `exam-controls.tsx:6` — verified.
- Interview: bỏ qua câu hỏi validate — không còn decision point genuinely mở (hướng xử lý do PO chốt qua ask; scope/known-limitations do kongming counsel chốt; mọi còn lại là mechanical). Ghi nhận theo validate-workflow "if plan is simple, fewer than min questions is okay".
- Giả định "Transcript hiển thị ở màn kết quả" luôn đúng trong ngữ cảnh hiển thị: **SUPERSEDED bởi red-team F2/F3** — nhánh `local_only` (`scoring-screen.tsx:101-111`), scoring `failed` (`results-screen.tsx:164-169`) và flag `VITE_FEATURE_SCORING` off (`results-screen.tsx:185-198`, "Tính năng chấm điểm AI sắp ra mắt") đều không bao giờ hiển thị transcript. Xử lý: copy trung lập "(Transcript không hiển thị trong phòng thi.)" — đúng mọi nhánh (user đã duyệt).

## Test Commands (chạy từ repo root)

- Gate chính: `pnpm --filter web test src/features` — chạy toàn bộ feature tests (precedent `plans/261110-0654-audio-generation-order/reports/94-pr-body.md:32`; AGENTS.md chỉ cấm name-filter `test -- <tên>`, không cấm đường dẫn).
- Một file (red phase): `pnpm --filter web test src/features/exam/components/__tests__/live-transcript.test.tsx`
- Types: `pnpm check-types`

## Red Team Review

### Session — 2026-11-10
**Findings:** 6 (6 accepted, 0 rejected) — dedupe từ 2 reviewer (Security Adversary, Assumption Destroyer), Light tier Fact Checker (5 claims/phase): 19/19 + 10/10 truy vết line-number ĐÚNG.
**Severity breakdown:** 1 Critical, 2 High, 3 Medium
**User review:** duyệt apply tất cả + chọn copy trung lập (2026-11-10).

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Gate RED vô nghĩa: component cũ crash TypeError ở `words.slice` trước assertion | Critical | Accept | Phase 1 (placeholder props `words={[]} spoken={0}`, criteria đo bằng assertion) |
| 2 | Promise "(Transcript hiển thị ở màn kết quả.)" sai ở nhánh local_only / scoring failed / flag off | High | Accept | plan.md AC4, Overview, Task 2.1 (copy trung lập) |
| 3 | AC9 mồ côi — không task nào sở hữu | High | Accept | Phase 2 Task 2.7 + verify mechanical |
| 4 | AC1 phantom assertion ("quite tidy" không có kênh truyền vào) | Medium | Accept | AC1 reword + structural assertion `querySelector("p")` |
| 5 | Claim "test theo thư mục không dùng được" sai so với repo rule + precedent | Medium | Accept | Test Commands, Task 2.6 (gate `src/features`) |
| 6 | forecast-flow: comment/tên test nói dối sau khi xoá assertion; Task 2.4 tự mâu thuẫn | Medium | Accept | Task 2.5 (viết lại comment, đổi tên test, thêm check thật) |

### Whole-Plan Consistency Sweep — 2026-11-10
- Decision delta: copy trung lập; gate test `src/features` 1 lệnh; AC1 structural; Task 2.7 follow-up issue; Task 2.2 trim placeholder props.
- Sweep `plan.md` + 2 phase files: không còn "(Transcript hiển thị ở màn kết quả.)" ngoài ngữ cảnh SUPERSEDED/lịch sử; không còn claim "KHÔNG dùng được"; không còn "Thời lượng: "; cross-references Task 2.2 (phase-01 ↔ phase-02) khớp; chấp nhận được, không còn mâu thuẫn.

<!-- slug: issue-127-hide-simulated-transcript -->
