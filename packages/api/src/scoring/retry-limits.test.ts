import { describe, expect, it } from "vitest";

import { startOfVietnamDayMs } from "./retry-limits";

describe("startOfVietnamDayMs", () => {
  it("returns the instant itself at Vietnam midnight", () => {
    const midnight = new Date("2026-11-10T00:00:00.000+07:00").getTime();
    expect(startOfVietnamDayMs(midnight)).toBe(midnight);
  });

  it("maps every moment of a Vietnam day to the same start marker", () => {
    const dayStart = startOfVietnamDayMs(new Date("2026-11-10T10:30:00.000+07:00").getTime());
    expect(startOfVietnamDayMs(new Date("2026-11-10T02:00:00.000Z").getTime())).toBe(dayStart);
    expect(startOfVietnamDayMs(new Date("2026-11-10T16:59:59.999Z").getTime())).toBe(dayStart);
  });

  it("treats 23:59 and next-day 00:01 Vietnam time as different days", () => {
    // 23:59 on Nov 9 in Vietnam is 16:59 UTC.
    const lateEvening = new Date("2026-11-09T16:59:00.000Z").getTime();
    // 00:01 on Nov 10 in Vietnam is 17:01 UTC the same UTC day.
    const justPastMidnight = new Date("2026-11-09T17:01:00.000Z").getTime();

    expect(startOfVietnamDayMs(lateEvening)).toBe(Date.UTC(2026, 10, 9) - 7 * 60 * 60 * 1000);
    expect(startOfVietnamDayMs(justPastMidnight)).toBe(Date.UTC(2026, 10, 10) - 7 * 60 * 60 * 1000);
    expect(startOfVietnamDayMs(justPastMidnight) - startOfVietnamDayMs(lateEvening)).toBe(
      24 * 60 * 60 * 1000,
    );
  });
});
