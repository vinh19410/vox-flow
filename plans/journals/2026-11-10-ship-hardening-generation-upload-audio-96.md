---
title: "Ship hardening generation upload audio (#96) vào beta"
date: 2026-11-10
summary: "PR #114 merged vào dev; deploy-beta xanh (backup D1 → migration → deploy → smoke). Guard generation server-side với conditional upsert chứng minh trên D1 thật; 3 vòng review; kongming advisory 4 checkpoint (1 fail do hạn mức)."
---

# Ship hardening generation upload audio (#96)

## What happened
Thực thi plan `261110-0654-audio-generation-order` qua ak-vibe (`--ship --beta --advice`): worktree `fix/96-audio-upload-generation-order`, 2 commit (`3b5c906` chính, `4d9cad2` fix review), PR #114 → dev, merged `a0b1576`, Deploy Beta run 42781612519 success.

Điểm kỹ thuật đáng nhớ:
- `upsertAnswerRecording` với `setWhere: generation <= excluded.generation` + `.returning()` — chứng minh trên Miniflare D1 rằng returning rỗng khi thua điều kiện (assumption trung bình của kongming được nâng thành by chứng).
- Winner-cleanup qua `bucket.list` prefix phải **lọc theo segment generation**: xoá theo "key ≠ key thắng" sẽ xoá nhầm blob của upload gen cao hơn đang bay (bắt ở vòng review 3, Critical).
- Rebase lên dev giữa chừng (16 commit: #104/#105/#92 + sizeBytes budget) — merge guard generation với topic validation + fail-closed size + backfill #105; fast-path 409 tái sử dụng `existingAnswers` (bớt 1 query).

## Decision
- Trần generation 5 phút → **24 giờ**: ownership check chặn cross-user nên trần chỉ chặn client bug; trần chặt khoá nộp bài với thiết bị lệch giờ. Deviation ghi trong plan + PR.
- 409 stale phía client = settled (clearFailed, **giữ device copy**) — false-stale do lệch đồng hồ không được biến thành mất dữ liệu.
- `mustResend`/`settleSuperseded` của #94 xoá sạch — server đã bảo đảm thứ tự.

## Next steps
- Verify tay trên beta (ghi âm → re-record → 200, generation tăng).
- Follow-up: smoke upload vào deploy-beta; `clearAttemptAudio` sau submit; TOCTOU budget #91.

> Historical work record — not durable authority.
