---
phase: 2
title: "Implement Green — sửa LiveTranscript + dọn hook"
status: done
priority: P1
effort: "1h15m"
dependencies: [1]
---

# Phase 2: Implement Green — sửa LiveTranscript + dọn hook

## Goal
`LiveTranscript` hiển thị trung thực (AC1–AC6 của plan.md), dead code `words`/`spoken` được dọn khỏi public API của hook, mọi test liên quan xanh, `pnpm check-types` xanh, follow-up issue cho heuristic `ans.words` đã tạo (AC9).

## Files to Create / Modify
- Modify: `apps/web/src/features/exam/components/live-transcript.tsx`
- Modify: `apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx` (gỡ placeholder props)
- Modify: `apps/web/src/features/exam/exam-screen.tsx` (dòng ~215)
- Modify: `apps/web/src/features/exam/use-exam-session.ts` (interface + return)
- Modify: `apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx` (dòng ~206, ~237-238)

## Context (kết quả đã verify từ Phase 1 + investigation + red-team)
- `mmss` import từ `@/lib/format` (`apps/web/src/lib/format.ts:5`), nhận GIÂY, trả `"m:ss"`.
- `words`/`spoken` trong `ExamSessionValue` chỉ có MỘT consumer: `exam-screen.tsx:215` (đã grep toàn src).
- Giữ NỘI BỘ trong hook: `words` (tokens đáp án mẫu, làm cap) và `spoken` (gán vào `ans.words` ở stopRec/restore — heuristic ngoài scope, slice-c ghim hành vi này).
- Copy sau-ghi là câu TRUNG LẬP "(Transcript không hiển thị trong phòng thi.)" — KHÔNG hứa "ở màn kết quả" vì ≥3 nhánh không bao giờ có transcript: `local_only` (`scoring-screen.tsx:101-111`), scoring `failed` (`results-screen.tsx:164-169`), flag `VITE_FEATURE_SCORING` off (`results-screen.tsx:185-198`). Red-team F2/F3 đã duyệt.
- KHÔNG đổi: nhánh `examiner-thinking`, heuristic `ans.words`, `MIN_WORDS`, pre-submit modal.
- Dấu "…" là U+2026.

## Tasks & Steps

### Task 2.1 — Viết lại `live-transcript.tsx`
- Target file: `apps/web/src/features/exam/components/live-transcript.tsx`
- Steps: thay toàn bộ nội dung file bằng:

```tsx
import { mmss } from "@/lib/format";

import type { ExamAnswer, ExamPhase } from "../use-exam-session";

export interface LiveTranscriptProps {
  phase: Extract<ExamPhase, "recording" | "answered" | "examiner-thinking">;
  ans?: ExamAnswer;
}

export function LiveTranscript({ phase, ans }: LiveTranscriptProps) {
  if (phase === "examiner-thinking") {
    return (
      <div className="mt-8 animate-fade rounded-3xl border border-brand/20 bg-brand/[0.04] p-5">
        <div className="flex items-center gap-2 text-xs text-brand">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-brand" />
          <span>Giám khảo AI đang phân tích câu trả lời…</span>
        </div>
        <p className="mt-3 text-sm text-white/60">
          Hệ thống đang chuẩn bị câu hỏi nối tiếp bám sát ý tưởng bạn vừa chia sẻ.
        </p>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="mt-8 animate-fade rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <div className="flex items-center gap-0.5" aria-hidden="true">
            <span className="inline-block h-3 w-1 animate-pulse rounded-full bg-brand" />
            <span className="inline-block h-4 w-1 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
            <span className="inline-block h-2 w-1 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
          </div>
          <span role="status">Đang ghi âm…</span>
        </div>
      </div>
    );
  }

  const secs = ans ? Math.round((ans.durationMs ?? ans.secs * 1000) / 1000) : 0;
  return (
    <div className="mt-8 animate-fade rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs text-white/45">
        <span>Đã ghi âm{secs > 0 ? ` · ${mmss(secs)}` : ""}</span>
      </div>
      <p className="mt-3 text-sm italic text-white/35">(Transcript không hiển thị trong phòng thi.)</p>
    </div>
  );
}
```

- Success criteria: không còn props `words`/`spoken`; không còn chuỗi "(Không nhận được giọng nói)"; nhánh recording không có phần tử `<p>`.
- Verify: gộp vào Task 2.6.

### Task 2.2 — Gỡ placeholder props khỏi test file (API đã đổi)
- Target file: `apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx`
- Steps:
  1. Xoá hằng `sampleWords` (không còn dùng).
  2. Test 1: `<LiveTranscript phase="recording" words={sampleWords} spoken={2} />` → `<LiveTranscript phase="recording" />`.
  3. Test 2: `<LiveTranscript phase="answered" words={sampleWords} spoken={5} ans={ans} />` → `<LiveTranscript phase="answered" ans={ans} />`.
  4. Test 3: `<LiveTranscript phase="answered" words={sampleWords} spoken={0} />` → `<LiveTranscript phase="answered" />`.
  5. GIỮ NGUYÊN mọi assertion, kể cả `queryByText(/quite tidy/)` (documentation) và `container.querySelector("p")` (structural guard thật — bảo vệ chống tái nhập body text khi recording).
- Success criteria: không còn `sampleWords`/`words=`/`spoken=` trong file; 4 test giữ nguyên số lượng assertion như Phase 1.
- Verify: gộp vào Task 2.6.

### Task 2.3 — Cập nhật call-site `exam-screen.tsx`
- Target file: `apps/web/src/features/exam/exam-screen.tsx` (~dòng 215)
- Steps: đổi `<LiveTranscript phase={phase} words={session.words} spoken={session.spoken} ans={ans} />` thành `<LiveTranscript phase={phase} ans={ans} />`.
- Success criteria: không còn `session.words`/`session.spoken` nào trong file.
- Verify: gộp vào Task 2.6 (`pnpm check-types` lỗi nếu còn).

### Task 2.4 — Dọn export khỏi hook `use-exam-session.ts`
- Target file: `apps/web/src/features/exam/use-exam-session.ts`
- Steps:
  1. Xoá `words: string[];` và `spoken: number;` khỏi interface `ExamSessionValue` (dòng ~24 — dòng `typed: number; recT: number; spoken: number; words: string[];` thành `typed: number; recT: number;`).
  2. Xoá `spoken,` và `words,` khỏi object return (dòng ~375: `parts, steps, step, idx, phase, typed, recT, spoken, words, maxRec,` thành `parts, steps, step, idx, phase, typed, recT, maxRec,`).
  3. KHÔNG xoá biến nội bộ `words`/`spoken` (dòng ~184-185) — vẫn cấp dữ liệu cho `ans.words` ở stopRec/restore.
  4. Cập nhật comment dòng 16 thành: `const WPS = 2.6; // simulated words-per-second; feeds only the min-words heuristic (#127 removed the live display)`
- Success criteria: `grep -rn "session.words\|session.spoken" apps/web/src` rỗng.
- Verify: gộp vào Task 2.6.

### Task 2.5 — Sửa forecast-flow test: bỏ assertion/comment/tên-test nói dối
- Target file: `apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx` (~dòng 200-240)
- Steps:
  1. Đọc dòng 200-245 để thấy ngữ cảnh chính xác (tên test ở ~206, comment ở 237, assertion ở 238).
  2. Xoá assertion dòng 238: `expect(screen.queryByText("(Không nhận được giọng nói)")).toBeNull();` — nó chưa từng ghim gì (fixture không có `answer`, chuỗi bị ẩn chỉ vì `ans.words = 5 > 0` — artefact simulation).
  3. Viết lại comment dòng 237 phản ánh đúng điều test còn assert, ví dụ: `// Verify no runtime throw occurred and the answered panel reflects the recording`.
  4. Nếu tên test (dòng ~206) tuyên bố "records words" (vd `...records words...`): đổi tên bỏ claim đó (giữ phần tên còn đúng).
  5. Thay assertion đã xoá bằng check THẬT cho nhánh answered: `expect(screen.getByText(/Đã ghi âm/)).toBeTruthy();` (regex vì có thể kèm ` · m:ss`).
- Success criteria: chuỗi "Không nhận được giọng nói" không còn trong file; file có assertion mới `/Đã ghi âm/`; comment không còn claim "valid transcript".
- Verify: gộp vào Task 2.6.

### Task 2.6 — Verify toàn bộ (mechanical)
Chạy từ repo root, mỗi lệnh phải đạt điều kiện:
1. `pnpm --filter web test src/features/exam/components/__tests__/live-transcript.test.tsx` → exit 0, 4/4 pass.
2. `pnpm --filter web test src/features` → exit 0, 0 failed (gate duy nhất phủ toàn bộ feature tests — precedent `plans/261110-0654-audio-generation-order/reports/94-pr-body.md:32`; slice-c canary "Câu trả lời khá ngắn (2 từ)." + 8× `^\d+ từ$` trong pre-submit phải còn pass trong output).
3. `pnpm check-types` → exit 0 (ở apps/web lệnh này chạy cả vite build).

### Task 2.7 — Tạo follow-up issue cho heuristic `ans.words` (AC9)
- Steps:
  1. Tạo file body tạm `plans/261110-1332-issue-127-hide-simulated-transcript/followup-body.md` mô tả: heuristic `ans.words` giả lập (`use-exam-session.ts:184-185` WPS khi ghi, `:151-152` hardcode `words: 20` khi restore) feed cảnh báo "Câu trả lời khá ngắn (N từ)" (`exam-screen.tsx:218-225`) và "N từ" (`pre-submit-modal.tsx:78`); bug cụ thể: mọi bài Part 2/3 khôi phục sau reload luôn bị gắn cờ "khá ngắn (20 từ)"; đề xuất: đổi sang ngưỡng thời lượng MIN_SECS theo part + bỏ hiển thị số từ; cần quyết định sản phẩm về ngưỡng. Link về issue #127 và plan.
  2. `gh issue create --title "Exam: heuristic số từ giả (ans.words) — restore luôn gắn cờ 'khá ngắn (20 từ)' ở Part 2/3" --body-file plans/261110-1332-issue-127-hide-simulated-transcript/followup-body.md --label ai-handle` — lưu URL.
  3. Thêm vào project: `gh project item-add 15 --owner vinh19410 --url <url-issue>`.
  4. Xoá file body tạm sau khi tạo xong (body đã nằm trên issue).
- Success criteria: issue tồn tại, có label `ai-handle`, nằm trong project 15.
- Verify (mechanical):
  - `gh issue view <số-issue> --json labels --jq '[.labels[].name]'` → output chứa `ai-handle`.
  - `gh project item-list 15 --owner vinh19410 --format json | grep <số-issue>` → có kết quả (hoặc lệnh item-add exit 0).

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
