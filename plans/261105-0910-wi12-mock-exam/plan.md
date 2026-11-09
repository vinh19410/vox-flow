---
title: "Thi thử AI (`mock-exam`)"
description: "Học viên thi Full Test hoặc từng Part với câu hỏi nối tiếp do AI tạo và ghi âm thật, tạo ra bài nói đủ chất lượng để chấm."
status: completed
priority: P1
effort: 6d
issue: 16
branch: vinh19410/vox-flow-ai-16
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0909-wi03-scoring-eval-oq5, project:261105-0910-wi10-onboarding, project:261105-0910-wi11-privacy-controls]
blocks: [project:261105-0910-wi13-scoring-results, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi20-forecast-practice]
created: 2026-11-05
---

# Thi thử AI (`mock-exam`)

Tracking: #16

Mục 12 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `mock-exam`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên thi Full Test hoặc từng Part với câu hỏi nối tiếp do AI tạo và ghi âm thật, tạo ra bài nói đủ chất lượng để chấm.

## Phụ thuộc
- Phụ thuộc nghiệp vụ: #7 (OQ-5 eval), #14 (onboarding), #15 (privacy-controls).
- Cơ chế giải phóng phụ thuộc: Tách rời phụ thuộc cứng; dùng adapter nội bộ `packages/api/src/exam/consent.ts` và dữ liệu dự phòng nội bộ `packages/api/src/exam/fallback-data.ts` để không làm bế tắc pipeline khi #7/#14/#15 chưa đóng trên GitHub.
- Mở khóa: #17, #21, #24

## Constraints
- Chỉ thử với người đã đồng ý (hoặc qua gate `LAUNCH_ALLOWED_EMAILS` / `LAUNCH_OPEN`).
- Lưu trữ audio trên Cloudflare R2 riêng tư, không bật public URL `r2.dev`, truy cập qua proxy Hono có xác thực chủ sở hữu (`attempt.userId === ctx.session.user.id`).
- Không gửi audio nhị phân qua tRPC JSON batch link (`httpBatchLink`); dùng endpoint nhị phân native của Hono `POST /api/attempts/:attemptId/answers/:questionKey/audio`.
- Lưu trữ audio trên client bằng IndexedDB trước khi tải lên để đảm bảo không mất dữ liệu khi mất mạng hoặc reload trang.
- Sao lưu D1 trước khi áp migration lên môi trường thật.
## Non-goals
- Chấm điểm; thuộc #17.
- Đếm hạn mức; thuộc #18.
- Luyện theo đề forecast; thuộc #24.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Lưu trữ và mô hình lượt thi](./phase-01-luu-tru-va-mo-hinh-luot-thi.md) | Completed |
| 2 | [Phase 2: Câu hỏi nối tiếp](./phase-02-cau-hoi-noi-tiep.md) | Completed |
| 3 | [Phase 3: Ghi âm thật trong phòng thi](./phase-03-ghi-am-that-trong-phong-thi.md) | Completed |

## Acceptance Criteria
- [x] Mỗi câu trả lời được ghi âm thật và tải lên kho lưu trữ, được gắn với đúng lượt thi.
- [x] Câu hỏi nối tiếp bám theo câu trả lời trước và có phương án dự phòng khi AI lỗi.
- [x] Mất mạng không làm mất các câu đã trả lời.
- [x] Không có đồng ý thì không ghi âm được.
- [x] Chạy được trên Chrome, Android và Safari trên iPhone.

## Câu hỏi mở
- Mới có brainstorm và cần chạy `/srs`, nhưng không có PRD gốc (người sở hữu xác nhận ngày 2026-11-05) và SRS, brainstorm cũng không có trong repo, nên phải viết lại phạm vi trong plan trước khi code. PRD được dựng lại ở #6.


## Red Team Review

### Session — 2026-11-05
**Findings:** 12 (12 accepted, 0 rejected)
**Severity breakdown:** 4 Critical, 5 High, 3 Medium
**Reviewers:** Security Adversary, Assumption Destroyer, Failure Mode Analyst
**Advisory Supervisor:** Kongming (Autonomous Advisor)

| # | Finding | Reviewer | Severity | Disposition | Applied To |
|---|---|---|---|---|---|
| 1 | Bế tắc cơ học ở Task 1.0 vì #7, #14, #15 chưa đóng | AssumptionDestroyer | Critical | Accept | Phase 1 (Task 1.0) |
| 2 | Thiếu các symbol `requireConsent` và `data-registry.ts` từ #15 | AssumptionDestroyer | Critical | Accept | Phase 1 (Task 1.2) |
| 3 | Không thể transcode WebM/MP4 sang 16kHz WAV trong Cloudflare Worker | FailureModeAnalyst | Critical | Accept | Phase 2 (Task 2.1) |
| 4 | Tải audio nhị phân qua tRPC httpBatchLink gây lỗi JSON/OOM Worker | AssumptionDestroyer | High | Accept | Phase 1 & 3 (Task 1.2, 3.2) |
| 5 | Thiếu endpoint phát lại audio R2 có xác thực quyền sở hữu (IDOR) | SecurityReviewer | Critical | Accept | Phase 1 (Task 1.2) |
| 6 | Lưu audio tạm trong RAM làm mất dữ liệu khi rớt mạng / reload Safari | FailureModeAnalyst | Critical | Accept | Phase 3 (Task 3.1, 3.2) |
| 7 | Thiếu ràng buộc UNIQUE(attemptId, questionKey) dẫn đến trùng lặp khi retry | FailureModeAnalyst | High | Accept | Phase 1 (Task 1.1) |
| 8 | Vi phạm ranh giới monorepo khi server import dữ liệu từ apps/web | FailureModeAnalyst | Medium | Accept | Phase 2 (Task 2.1) |
| 9 | Thiếu vòng đời attempt (`start`, `submit`) ở giao diện web | AssumptionDestroyer | High | Accept | Phase 3 (Task 3.2) |
| 10 | Nguy cơ prompt injection qua lời nói của thí sinh vào LLM | SecurityReviewer | High | Accept | Phase 2 (Task 2.1) |
| 11 | Thiếu lưu trạng thái đồng ý hiệu chuẩn D-10 trong attempt | SecurityReviewer | Medium | Accept | Phase 1 (Task 1.1) |
| 12 | LiveTranscript mô phỏng chữ hỏng khi dùng audio thật | FailureModeAnalyst | Medium | Accept | Phase 3 (Task 3.2) |

### Whole-Plan Consistency Sweep
- **Ranh giới dữ liệu:** Dữ liệu dự phòng chuyển về `packages/api/src/exam/fallback-data.ts`.
- **Giao thức tải audio:** Hono streaming endpoint `POST /api/attempts/:attemptId/answers/:questionKey/audio` và `GET /api/attempts/:attemptId/answers/:answerId/audio`.
- **Trạng thái client:** IndexedDB lưu blob cục bộ trước khi upload; `useExamSession` quản lý dynamic steps và `"examiner-thinking"`.
- **Đồng bộ toàn plan:** Cả 3 phase đã được đồng bộ hóa với các quyết định trên, không còn xung đột.

## Validation Log

### Verification Results
- Claims checked: 15
- Verified: 15 | Failed: 0 | Unverified: 0
- Tier: Standard (Fact Checker + Contract Verifier)

### Whole-Plan Consistency Sweep
- Không còn câu lệnh kiểm tra trạng thái GitHub Issue chặn ngang việc code.
- Toàn bộ các API và endpoint được chỉ định đường dẫn và kiểu dữ liệu rõ ràng.
- Đảm bảo tính nhất quán giữa client, server, database schema và Cloudflare Worker environment.
<!-- slug: wi12-mock-exam -->
