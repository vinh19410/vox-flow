---
phase: 1
title: "TDD Red — test trung thực cho LiveTranscript"
status: done
priority: P1
effort: "45m"
dependencies: []
---

# Phase 1: TDD Red — test trung thực cho LiveTranscript

## Goal
Tạo test mới cho `LiveTranscript` mô tả hành vi TRUNG THỰC đích (không chữ giả lập, không bộ đếm từ giả, label thật, thời lượng thật) và xác nhận chúng ĐỎ trên code hiện tại **bằng assertion failure** (không phải crash TypeError).

## Files to Create / Modify
- Create: `apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx`

## Context
- Component hiện tại: `apps/web/src/features/exam/components/live-transcript.tsx` — props `{ phase, words, spoken, ans }`, gọi `words.slice(0, shown)` KHÔNG guard (red-team F1: nếu không truyền `words`, component crash TypeError trước mọi assertion → đỏ sai cách).
- **Vì vậy: mọi test ở phase này render qua API CŨ với placeholder props (`words`, `spoken`) — có test recording truyền cả đáp án mẫu thật để assertion "không render đáp án mẫu" có giá trị phản chứng ở red.** Ở Phase 2, khi API đổi, placeholder props sẽ được gỡ khỏi test file (Task 2.2).
- Test conventions tham khảo: `apps/web/src/features/exam/components/__tests__/pre-submit-modal.test.tsx` (vitest + `@testing-library/react`, assert chuỗi tiếng Việt literal).
- `mmss(s)` nhận GIÂY, trả `"m:ss"` (vd `mmss(32)` = `"0:32"`) — `apps/web/src/lib/format.ts:5`.

## Tasks & Steps

### Task 1.1 — Tạo file test với đúng nội dung sau
- Target file: `apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx`
- Steps: tạo file với nội dung chính xác dưới đây (placeholder `words`/`spoken` là CỐ Ý — dùng API cũ để red có nghĩa):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveTranscript } from "../live-transcript";
import type { ExamAnswer } from "../../use-exam-session";

const ans: ExamAnswer = { secs: 32, words: 5, durationMs: 32_000 };
const sampleWords = "Yes I am quite tidy".split(" ");

describe("LiveTranscript honesty (#127)", () => {
  it("labels recording honestly and never renders sample-answer text or a word counter", () => {
    const { container } = render(
      <LiveTranscript phase="recording" words={sampleWords} spoken={2} />,
    );

    expect(screen.getByText("Đang ghi âm…")).toBeTruthy();
    expect(screen.queryByText(/nhận dạng giọng nói/)).toBeNull();
    expect(screen.queryByText(/quite tidy/)).toBeNull();
    expect(screen.queryByText(/\d+ từ/)).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("shows real duration and a neutral note after recording, with no fake words", () => {
    render(<LiveTranscript phase="answered" words={sampleWords} spoken={5} ans={ans} />);

    expect(screen.getByText("Đã ghi âm · 0:32")).toBeTruthy();
    expect(screen.getByText("(Transcript không hiển thị trong phòng thi.)")).toBeTruthy();
    expect(screen.queryByText(/quite tidy/)).toBeNull();
    expect(screen.queryByText(/\d+ từ/)).toBeNull();
  });

  it("renders no voice-detected fallback string at all", () => {
    render(<LiveTranscript phase="answered" words={sampleWords} spoken={0} />);

    expect(screen.getByText("Đã ghi âm")).toBeTruthy();
    expect(screen.queryByText("(Không nhận được giọng nói)")).toBeNull();
  });

  it("keeps the examiner-thinking block unchanged", () => {
    render(<LiveTranscript phase="examiner-thinking" />);

    expect(screen.getByText("Giám khảo AI đang phân tích câu trả lời…")).toBeTruthy();
  });
});
```

- Success criteria: file tồn tại, đúng nội dung trên.
- Verify: bước Task 1.2.

### Task 1.2 — Chạy test, xác nhận ĐỎ vì đúng lý do (assertion failure)
- Steps:
  1. Từ repo root chạy: `pnpm --filter web test src/features/exam/components/__tests__/live-transcript.test.tsx`
  2. Đọc output từng test.
- Success criteria:
  - Test 1 ĐỎ vì assertion: `getByText("Đang ghi âm…")` không tìm thấy (thực tế render "Đang ghi âm & nhận dạng giọng nói…").
  - Test 2 ĐỎ vì assertion: `getByText("Đã ghi âm · 0:32")` không tìm thấy (thực tế render "Transcript" + "5 từ").
  - Test 3 ĐỎ vì assertion: "(Không nhận được giọng nói)" được render nhưng queryByText kỳ vọng null.
  - Test 4 XANH ngay ở red — bình thường (nhánh examiner-thinking không đổi).
  - KHÔNG được có TypeError (`Cannot read properties of undefined`) — nếu thấy TypeError nghĩa là placeholder props bị bỏ sót.
- Verify (mechanical): lệnh trên exit ≠ 0; output có ≥3 assertion failure (test 1, 2, 3); không có lỗi "Cannot find module" và không có TypeError.

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
