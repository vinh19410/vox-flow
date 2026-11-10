---
title: ship fix 127 hide simulated live transcript
date: 2026-11-10
summary: "Ẩn transcript giả lập khi ghi âm (issue #127): LiveTranscript chỉ hiển thị label trung thực + thời lượng thật; red-team 6 findings đã xử lý; 250/250 tests; smoke browser pass."
---

# ship fix 127 hide simulated live transcript

## Ship fix #127 — Ẩn transcript giả lập khi ghi âm

**Vấn đề:** Panel "Đang ghi âm & nhận dạng giọng nói…" hiển thị transcript giả lập từ đáp án mẫu (2.6 từ/giây, `use-exam-session.ts` WPS) — QA smoke beta 2026-11-10 phát hiện (#127).

**Quyết định sản phẩm:** PO chọn "Ẩn chữ giả lập" (không Web Speech API). Copy sau-ghi trung lập "(Transcript không hiển thị trong phòng thi.)" — red-team chứng minh promise "ở màn kết quả" sai ở nhánh local_only / scoring failed / flag VITE_FEATURE_SCORING off; user duyệt copy trung lập.

**Thay đổi:** `LiveTranscript` bỏ props words/spoken (recording = label + pulse bars, không <p>; answered = "Đã ghi âm · m:ss" qua mmss(durationMs ?? secs*1000)); dọn export words/spoken khỏi ExamSessionValue; forecast-flow test thay assertion vô nghĩa "(Không nhận được giọng nói)" bằng check thật /Đã ghi âm/; heuristic ans.words giữ nguyên nội bộ (follow-up #128).

**Quy trình:** ak-vibe --ship --beta --advice. Plan TDD 2 phase, red-team 2 reviewer (6 findings: 1 Critical gate-RED TypeError, 2 High — promise + AC9 mồ côi; 3 Medium) — tất cả accepted + user duyệt. kongming 4 checkpoint: investigation GO, plan-gate GO, impl-gate GO (+ pins: commit structure, PR body, browser smoke, xoá issue-comment.md).

**Verify:** TDD red 3 assertion-fail đúng cách (placeholder props tránh TypeError); green 250/250 src/features (slice-c canary "khá ngắn (2 từ)" giữ nguyên); check-types exit 0 (7/7, vite build); local review fresh-context 0 Critical / 0 Important / 6 Minor không blocker; browser smoke trên vite dev (stub get-session CORS): recording = "Đang ghi âm…" + timer thật, answered = "Đã ghi âm · 0:02" + cảnh báo khá ngắn vẫn chạy — screenshots lưu /tmp/smoke127-*.png.

**Follow-up:** #128 — heuristic ans.words giả lập (restore hardcode words:20 → Part 2/3 khôi phục luôn bị cờ "khá ngắn (20 từ)"); đề xuất MIN_SECS.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
