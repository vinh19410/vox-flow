---
title: "Plan hardening generation cho upload audio (#96)"
date: 2026-11-10
summary: "Tạo plan fix #96 trong worktree fix/96-*. Kongming counsel + red-team 2 reviewer phát 13 findings (2 Critical) — đã áp tất cả: key <qk>.<gen>.<ext>, legacy copy gen=0, stale giữ device copy, xoá tRPC uploadAnswer, erasure prefix+pagination."
---

# Plan hardening generation cho upload audio (#96)

## What happened
Tạo plan `plans/261110-0654-audio-generation-order/` trong worktree `vox-flow-96-audio-upload-generation-order` (branch `fix/96-audio-upload-generation-order`, base `dev`) cho issue #96: server cần từ chối upload audio bản cũ hơn bản đã lưu (race last-write-wins giữa R1/R2 cùng câu).

Điều tra chứng minh root cause: route `POST .../answers/:questionKey/audio` upsert `attempt_answer` không điều kiện sau `bucket.put`; ngoài ra còn phát hiện (qua counsel kongming) đường ghi thứ hai không guard — tRPC `attempt.uploadAnswer` (web không gọi, code chết) — và `attempt.erase` xoá blob theo row nên sẽ sót blob generation cũ.

Kongming (checkpoint sau investigation) chốt hướng generation dựa trên timestamp có chặn tăng dần, và red-team 2 reviewer (Security Adversary, Assumption Destroyer) phá thêm 13 findings — nghiêm trọng nhất:
- Chuẩn hoá legacy device copy bằng `Date.now()` lúc flush sẽ hồi sinh đúng bug #96 (bản cũ thành mới nhất) → phải gán 0.
- `409 stale` + xoá device copy = mất dữ liệu im lặng khi false-stale (đồng hồ lệch cross-device) → stale chỉ clearFailed, giữ copy.
- Key `-<gen>` trùng key legacy (`p1`+gen1 ≡ `p1-1`) → đổi sang `.<gen>` và nới regex một segment số.
- Literal `stopRec` trong `use-exam-session` sẽ TS2322 khi `generation` required; nhánh `!attemptId` bypass `trackAnswerUpload` → phải gán gen ngay lúc tạo qua `withGeneration`.
- Thiếu test composite route+SQLite thật cho luồng thua race.

## Decision
- Generation = `max(Date.now(), lastGenLocal + 1)` gán lúc tạo record; server chặn 2 lớp (pre-read fast-path 409 + `setWhere stored <= excluded.generation` trên upsert, `returning()` 0 row → xoá blob + 409 `stale_generation`); trần `Date.now() + 5 phút` → 400.
- Xoá tRPC `attempt.uploadAnswer` (clean cutover); bỏ `mustResend`/`settleSuperseded` phía client (thừa sau khi server bảo đảm thứ tự).
- Erasure: `list` bắt buộc trên `EraseContext.audioBucket`, loop pagination.
- Chấp nhận 2 rủi ro có documentation: bundle cũ 409-loop trong cửa sổ chuyển tiếp; criterion "reload 200" phụ thuộc đồng hồ đơn điệu.

## Next steps
- Thực thi theo phase: server trước (schema → audio key → helper SQLite thật → route → composite test → xoá tRPC → erasure), client sau.
- Khi merge: `ak plan close`; POT lên #96.
