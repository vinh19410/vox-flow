import { describe, expect, it } from "vitest";

import { FEATURES } from "../feature-flags";

describe("FEATURES", () => {
  it("defaults scoring and billing to false when env vars are not set to 'true'", () => {
    expect(FEATURES.scoring).toBe(false);
    expect(FEATURES.billing).toBe(false);
  });
});
