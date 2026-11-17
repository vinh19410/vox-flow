import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkAndWarnOverdueDisputes, requeueStaleScores, sweepTransactions } = vi.hoisted(() => ({
  checkAndWarnOverdueDisputes: vi.fn(),
  requeueStaleScores: vi.fn(),
  sweepTransactions: vi.fn(),
}));

vi.mock("./env.server", () => ({ ENV: { SCORING_QUEUE: { send: vi.fn() } } }));
vi.mock("./services", () => ({ getDb: () => ({}) }));
vi.mock("@vox-flow/api/disputes/overdue", () => ({ checkAndWarnOverdueDisputes }));
vi.mock("@vox-flow/api/scoring/requeue", () => ({ requeueStaleScores }));
vi.mock("@vox-flow/api/billing/reconcile", () => ({ sweepTransactions }));

import { handleScheduled, HOURLY_CRON, SCORING_SWEEP_CRON } from "./scheduled";

const ctx = { waitUntil: () => {} };
const run = (cron: string) => handleScheduled({ scheduledTime: Date.now(), cron }, {}, ctx);

describe("handleScheduled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAndWarnOverdueDisputes.mockResolvedValue({ warnedCount: 0 });
    requeueStaleScores.mockResolvedValue({ requeued: 0, failed: 0 });
    sweepTransactions.mockResolvedValue({ fetched: 0, inserted: 0, skipped: 0 });
  });

  it("runs only the scoring sweep on the 5-minute schedule", async () => {
    await run(SCORING_SWEEP_CRON);
    expect(requeueStaleScores).toHaveBeenCalledOnce();
    expect(checkAndWarnOverdueDisputes).not.toHaveBeenCalled();
    expect(sweepTransactions).not.toHaveBeenCalled();
  });

  it("keeps the dispute check and payment sweep hourly and leaves the scoring sweep to the 5-minute schedule", async () => {
    await run(HOURLY_CRON);
    expect(checkAndWarnOverdueDisputes).toHaveBeenCalledOnce();
    expect(sweepTransactions).toHaveBeenCalledOnce();
    expect(requeueStaleScores).not.toHaveBeenCalled();
  });

  it("runs every job for an unrecognised trigger", async () => {
    await run("manual");
    expect(checkAndWarnOverdueDisputes).toHaveBeenCalledOnce();
    expect(sweepTransactions).toHaveBeenCalledOnce();
    expect(requeueStaleScores).toHaveBeenCalledOnce();
  });

  it("does not let a failing dispute check stop anything else", async () => {
    checkAndWarnOverdueDisputes.mockRejectedValue(new Error("d1 down"));
    await expect(run("manual")).resolves.toBeUndefined();
    expect(requeueStaleScores).toHaveBeenCalledOnce();
  });

  it("matches the crons deployed in the infra stack", () => {
    const stack = readFileSync(
      path.resolve(import.meta.dirname, "../../../packages/infra/alchemy.run.ts"),
      "utf-8",
    );
    const crons = stack.match(/crons:\s*\[([^\]]*)\]/)?.[1] ?? "";
    expect(crons).toContain(`"${HOURLY_CRON}"`);
    expect(crons).toContain(`"${SCORING_SWEEP_CRON}"`);
  });
});
