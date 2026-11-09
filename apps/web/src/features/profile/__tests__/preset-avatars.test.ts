import { describe, expect, it } from "vitest";

import { PRESET_AVATARS } from "../data/preset-avatars";

describe("preset-avatars", () => {
  it("contains 6 unique preset avatars with valid SVG data URIs", () => {
    expect(PRESET_AVATARS).toHaveLength(6);

    const ids = new Set(PRESET_AVATARS.map((p) => p.id));
    expect(ids.size).toBe(6);

    for (const preset of PRESET_AVATARS) {
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.url).toMatch(/^data:image\/svg\+xml;utf8,/);
    }
  });
});
