import { afterEach, describe, expect, it, vi } from "vitest";

import { cx } from "../cx";
import { daysUntil, fmtBand, mmss, vnd } from "../format";
import { cancelSpeech, speakText } from "../speech";

describe("cx", () => {
  it("joins truthy class names and drops falsy entries", () => {
    expect(cx("a", false, null, undefined, "b")).toBe("a b");
    expect(cx(false, null, undefined, "")).toBe("");
  });
});

describe("format helpers", () => {
  it("formats seconds as mm:ss and clamps negative inputs to 0:00", () => {
    expect(mmss(0)).toBe("0:00");
    expect(mmss(-5)).toBe("0:00");
    expect(mmss(125)).toBe("2:05");
  });

  it("formats band scores to one decimal place", () => {
    expect(fmtBand(6.5)).toBe("6.5");
    expect(fmtBand(7)).toBe("7.0");
  });

  it("formats VND currency ending with đ", () => {
    const formatted = vnd(49000);
    expect(formatted.endsWith("đ")).toBe(true);
    expect(formatted).toMatch(/^49[.,]000đ$/);
  });

  it("computes daysUntil for null, future, and past ISO dates", () => {
    expect(daysUntil(null)).toBeNull();

    const futureIso = new Date(Date.now() + 5 * 86400000).toISOString();
    const futureDays = daysUntil(futureIso);
    expect(futureDays).not.toBeNull();
    expect(futureDays).toBeGreaterThanOrEqual(5);

    const pastIso = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(daysUntil(pastIso)).toBe(0);
  });
});

describe("speech helpers", () => {
  const originalSpeechSynthesis = globalThis.speechSynthesis;
  const originalUtterance = globalThis.SpeechSynthesisUtterance;

  afterEach(() => {
    (globalThis as Record<string, unknown>).speechSynthesis =
      originalSpeechSynthesis;
    (globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
      originalUtterance;
  });

  it("cancels and speaks utterances when Web Speech API is present", () => {
    const spokenUtterances: SpeechSynthesisUtterance[] = [];
    const cancel = vi.fn();
    const speak = vi.fn((u: SpeechSynthesisUtterance) => {
      spokenUtterances.push(u);
    });
    const onEnd = vi.fn();

    (globalThis as Record<string, unknown>).speechSynthesis = {
      cancel,
      speak,
    };

    cancelSpeech();
    expect(cancel).toHaveBeenCalledTimes(1);

    speakText("Hello examiner", { lang: "en-GB", rate: 0.95, onEnd });
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(spokenUtterances).toHaveLength(1);
    const utterance = spokenUtterances[0]!;
    expect(utterance.text).toBe("Hello examiner");
    expect(utterance.lang).toBe("en-GB");
    expect(utterance.rate).toBe(0.95);

    utterance.onend?.call(utterance, new Event("end") as SpeechSynthesisEvent);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("does not throw when globalThis.speechSynthesis is undefined or throws", () => {
    (globalThis as Record<string, unknown>).speechSynthesis = undefined;
    expect(() => cancelSpeech()).not.toThrow();
    expect(() => speakText("Unavailable speech")).not.toThrow();

    (globalThis as Record<string, unknown>).speechSynthesis = {
      cancel: () => {
        throw new Error("Blocked");
      },
      speak: () => {
        throw new Error("Blocked");
      },
    };
    expect(() => cancelSpeech()).not.toThrow();
    expect(() => speakText("Throwing speech")).not.toThrow();
  });
});
