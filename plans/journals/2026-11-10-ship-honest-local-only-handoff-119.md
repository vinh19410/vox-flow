---
title: "Ship fix #119: ScoringScreen trung thực khi submit không có attemptId vào beta"
date: 2026-11-10
summary: "PR #125 merged vào dev (2438510); ScoringJob thành union attempt|local_only, LocalOnlyState hedged copy, schema v3; red-phase 6/6 test đỏ đúng plan, 320/320 test, check-types 0; kongming advisory 0/4 checkpoint do hạn mức Cursor (USAGE_PRICING_REQUIRED) — controller thay thế, ghi nhận non-fatal."
---

# Ship fix #119: ScoringScreen trung thực khi submit không có attemptId vào beta

## What happened

Ship fix #119 qua PR #125 (branch `fix/119-honest-submit-copy`, mode beta) vào dev ngày 2026-11-10, merge commit `2438510`. Bug: khi attempt sync treo >15s (#106) hoặc `attempt.start` reject, `attemptStatus: "failed"` mở khoá nộp; submit khi `attemptId == null` đi vào fallback #94 ("offline, không có gì trên server") — nhưng giả định đó sai từ #106 — và ScoringScreen render `RecordedState` "Bài thi đã được ghi nhận! Hệ thống đã lưu lại toàn bộ câu trả lời của bạn" trong khi 0 byte audio rời thiết bị; device copies nằm trong IndexedDB dưới `clientSessionId` (UUID mỗi mount) không có đường flush.

Fix (chỉ Hướng 1 theo product decision — recovery tách #123): `ScoringJob` thành discriminated union `{ kind: "attempt", attemptId, submitted } | { kind: "local_only" }`; nhánh `!attemptId` set `{ kind: "local_only" }`; `ScoringScreen` render `LocalOnlyState` — `TriangleAlert`, copy nói 2 sự thật chắc chắn (chưa lên server; bản ghi **có thể** còn lưu tạm trên máy — hedge vì `saveAudioBlob` có memory-fallback), không hứa khôi phục, không nút "Gửi lại". `null` giữ nguyên nghĩa (unscored đã lưu / `not_scorable`). Schema Zod (sessionStorage) thành discriminated union + `z.preprocess` inject `kind: "attempt"`; `PROTO_STORAGE_KEY` bump v2→v3 để rollback deploy không hard-fail toàn bộ persisted state (red-team finding: schema cũ không đọc được payload mới).

## Decision

- **Chỉ Hướng 1 hôm nay** (product owner chốt): recovery qua prompt tường minh là feature riêng (#123); flush ngầm lúc mount bị loại vì adopt ambiguity — `getActive` match theo mode/topic không phân biệt attempt ma vs retake, nguy cơ trộn audio phiên cũ vào bài mới. Ma-attempt adoption + deep-link `/scoring` success giả: track #124.
- **Union trên `scoringAttempt`, không thêm field riêng**: một nguồn sự thật; TS ép mọi constructor (production + test seeds) — sweep 21 seed là rào chắn compile-time thật, không phải defensive.
- **Bump key v3 thay vì tolerant schema 2 chiều**: chiều ngược lại không thể tolerant (schema cũ là code cũ); mất preference một lần, chấp nhận ở beta.
- Red-team plan bắt 6 findings (Critical nhất: 21 seed thiếu `kind` sẽ vỡ green phase + `tsc` fail vì tsconfig không exclude `__tests__`) — tất cả đã áp trước khi implement; không finding nào sống sót tới review diff.

## Verification

TDD: red phase 6/6 test đỏ đúng danh sách pass condition của plan (2 hand-off exam-submit, 1 render scoring-screen, 3 schema state-and-data), 69 test khác xanh → green: full suite **38 file / 320 test pass**, `check-types` exit 0 (kèm vite build) tại revision cuối `96f5787`. Review local fresh-context: 0 Critical / 0 Important / 4 Minor (M2 icon guard + M3 schema note đã vá; M1 decline — hợp đồng được TS enforce; M4 track #124). PR #125 không có PR CI (workflow duy nhất `deploy-beta` trigger push→dev) — gate là local verification + Deploy Beta run `42794393405` cho merge commit `2438510`.

Điều phải nói thẳng: kongming advisory chỉ thành công 1/5 lần spawn (pre-plan counsel; 4 checkpoint sau fail `USAGE_PRICING_REQUIRED` — hạn mức Cursor). Các checkpoint bị fail đã do controller tự adjudicate với bằng chứng đầy đủ (red-team fresh-context 2 reviewer, review diff fresh-context 1 reviewer, suite+types xanh) — nhưng đây vẫn là self-grading nhiều hơn contract `--advice` mong muốn; nếu muốn bắt chước đúng, cần kongming sống lại ở checkpoint post-PR.

## Next steps

- Smoke tay trên beta: thi mock với mạng chặn tRPC (nộp khi sync fail) → ScoringScreen phải hiện "Chưa gửi được bài thi lên máy chủ", không phải success copy.
- #123: recovery device-copy qua prompt tường minh (persist clientSessionId, user chủ động).
- #124: recency guard cho adopt attempt + guard deep-link `/scoring`.
- Khi làm recovery: cân nhắc dịch key v3 một lần nữa hoặc migration đọc-ghi 2 key.
