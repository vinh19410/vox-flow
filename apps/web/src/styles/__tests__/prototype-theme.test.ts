import { describe, expect, it } from "vitest";

import themeCss from "../prototype-theme.css?raw";

describe("prototype-theme.css tokens", () => {
  it("defines renamed brand and subtle tokens without overriding shadcn accent/muted", () => {
    expect(themeCss).toContain("--color-brand: #ff5b24;");
    expect(themeCss).toContain("--color-brand-soft: #ffe4d8;");
    expect(themeCss).toContain("--color-subtle: #747887;");
    expect(themeCss).toContain("--color-paper: #f5f3ee;");
    expect(themeCss).toContain("--color-ink: #12141c;");
    expect(themeCss).not.toContain("--color-accent");
    expect(themeCss).not.toContain("--color-muted");
  });

  it("scopes prototype base rules inside @layer base and .proto-root", () => {
    expect(themeCss).toContain("@layer base");
    expect(themeCss).toContain(".proto-root");
    expect(themeCss).toContain(".tnum");
  });
});
