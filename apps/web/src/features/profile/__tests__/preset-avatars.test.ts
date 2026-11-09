import { describe, expect, it } from "vitest";

import { PRESET_AVATARS } from "../data/preset-avatars";

describe("preset-avatars", () => {
  it("contains 6 unique preset avatars served from the static /avatars/ directory", () => {
    expect(PRESET_AVATARS).toHaveLength(6);

    const ids = new Set(PRESET_AVATARS.map((p) => p.id));
    expect(ids.size).toBe(6);

    for (const preset of PRESET_AVATARS) {
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      // Phải là đường dẫn tĩnh khớp file trong apps/web/public/avatars/
      expect(preset.url).toBe(`/avatars/${preset.id}.svg`);
    }
  });
});
