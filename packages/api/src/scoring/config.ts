export const DEFAULT_SCORING_MODEL = "gpt-6-luna";
export const DEFAULT_SCORING_RUNS = 3;
const MAX_SCORING_RUNS = 7;

export type ScoringConfig = {
  apiKey: string | undefined;
  model: string;
  /** Number of independent grading runs aggregated by median. */
  runs: number;
  /** USD per 1M input tokens; null when pricing is not configured. */
  priceInputPer1M: number | null;
  /** USD per 1M output tokens; null when pricing is not configured. */
  priceOutputPer1M: number | null;
};

function readString(env: Record<string, unknown>, key: string): string | undefined {
  const value = env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPrice(env: Record<string, unknown>, key: string): number | null {
  const raw = readString(env, key);
  if (raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a non-negative number`);
  }
  return value;
}

/**
 * Reads scoring settings from the worker env. Unset or empty values fall back
 * to defaults; values that are set but invalid throw so a misconfigured deploy
 * fails loudly instead of grading with surprising settings.
 */
export function readScoringConfig(env: Record<string, unknown>): ScoringConfig {
  const runsRaw = readString(env, "SCORING_RUNS");
  let runs = DEFAULT_SCORING_RUNS;
  if (runsRaw !== undefined) {
    runs = Number(runsRaw);
    if (!Number.isInteger(runs) || runs < 1 || runs > MAX_SCORING_RUNS) {
      throw new Error(`SCORING_RUNS must be an integer between 1 and ${MAX_SCORING_RUNS}`);
    }
  }

  return {
    apiKey: readString(env, "OPENAI_API_KEY"),
    model: readString(env, "SCORING_MODEL") ?? DEFAULT_SCORING_MODEL,
    runs,
    priceInputPer1M: readPrice(env, "SCORING_PRICE_INPUT_PER_1M"),
    priceOutputPer1M: readPrice(env, "SCORING_PRICE_OUTPUT_PER_1M"),
  };
}

/** Cost of one request, or null unless both prices and both token counts are known. */
export function computeCostUsd(
  config: Pick<ScoringConfig, "priceInputPer1M" | "priceOutputPer1M">,
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  if (
    config.priceInputPer1M === null ||
    config.priceOutputPer1M === null ||
    inputTokens === null ||
    outputTokens === null
  ) {
    return null;
  }
  return (inputTokens * config.priceInputPer1M + outputTokens * config.priceOutputPer1M) / 1_000_000;
}
