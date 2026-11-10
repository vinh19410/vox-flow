import { beforeEach, describe, expect, it, vi } from "vitest";

const { scoreAttempt, markScoreFailed } = vi.hoisted(() => ({
  scoreAttempt: vi.fn(),
  markScoreFailed: vi.fn(),
}));

vi.mock("./env.server", () => ({
  ENV: { OPENAI_API_KEY: "test-key", SCORING_RUNS: "3" },
}));

vi.mock("./services", () => ({
  getDb: () => ({}),
}));

vi.mock("@vox-flow/api/scoring/score-attempt", () => ({
  scoreAttempt,
  markScoreFailed,
  describeScoringError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import { handleScoringQueue, SCORING_QUEUE_MAX_RETRIES } from "./queue";

function makeMessage(body: unknown, attempts = 1) {
  return { body, attempts, ack: vi.fn(), retry: vi.fn() };
}

describe("handleScoringQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acks after scoring succeeds", async () => {
    scoreAttempt.mockResolvedValue("done");
    const message = makeMessage({ attemptId: "att-1" });

    await handleScoringQueue({ messages: [message] });

    expect(scoreAttempt).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining({ runs: 3 }) }), "att-1");
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it("retries on error before the last delivery", async () => {
    scoreAttempt.mockRejectedValue(new Error("upstream 500"));
    const message = makeMessage({ attemptId: "att-1" }, 1);

    await handleScoringQueue({ messages: [message] });

    expect(message.retry).toHaveBeenCalledOnce();
    expect(message.ack).not.toHaveBeenCalled();
    expect(markScoreFailed).not.toHaveBeenCalled();
  });

  it("marks the score failed and acks on the last delivery", async () => {
    const error = new Error("upstream 500");
    scoreAttempt.mockRejectedValue(error);
    const message = makeMessage({ attemptId: "att-1" }, SCORING_QUEUE_MAX_RETRIES + 1);

    await handleScoringQueue({ messages: [message] });

    expect(markScoreFailed).toHaveBeenCalledWith(expect.anything(), "att-1", error);
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it("drops malformed messages without scoring", async () => {
    const message = makeMessage({ nope: true });

    await handleScoringQueue({ messages: [message] });

    expect(scoreAttempt).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it("handles each message of a batch independently", async () => {
    scoreAttempt.mockResolvedValueOnce("done").mockRejectedValueOnce(new Error("boom"));
    const ok = makeMessage({ attemptId: "a" });
    const bad = makeMessage({ attemptId: "b" });

    await handleScoringQueue({ messages: [ok, bad] });

    expect(ok.ack).toHaveBeenCalledOnce();
    expect(bad.retry).toHaveBeenCalledOnce();
  });
});
