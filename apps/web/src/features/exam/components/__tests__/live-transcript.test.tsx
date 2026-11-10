import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveTranscript } from "../live-transcript";
import type { ExamAnswer } from "../../use-exam-session";

const ans: ExamAnswer = { secs: 32, words: 5, durationMs: 32_000 };

describe("LiveTranscript honesty (#127)", () => {
  it("labels recording honestly and never renders sample-answer text or a word counter", () => {
    const { container } = render(<LiveTranscript phase="recording" />);

    expect(screen.getByText("Đang ghi âm…")).toBeTruthy();
    expect(screen.queryByText(/nhận dạng giọng nói/)).toBeNull();
    expect(screen.queryByText(/quite tidy/)).toBeNull();
    expect(screen.queryByText(/\d+ từ/)).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("shows real duration and a neutral note after recording, with no fake words", () => {
    render(<LiveTranscript phase="answered" ans={ans} />);

    expect(screen.getByText("Đã ghi âm · 0:32")).toBeTruthy();
    expect(screen.getByText("(Transcript không hiển thị trong phòng thi.)")).toBeTruthy();
    expect(screen.queryByText(/quite tidy/)).toBeNull();
    expect(screen.queryByText(/\d+ từ/)).toBeNull();
  });

  it("renders no voice-detected fallback string at all", () => {
    render(<LiveTranscript phase="answered" />);

    expect(screen.getByText("Đã ghi âm")).toBeTruthy();
    expect(screen.queryByText("(Không nhận được giọng nói)")).toBeNull();
  });

  it("keeps the examiner-thinking block unchanged", () => {
    render(<LiveTranscript phase="examiner-thinking" />);

    expect(screen.getByText("Giám khảo AI đang phân tích câu trả lời…")).toBeTruthy();
  });
});
