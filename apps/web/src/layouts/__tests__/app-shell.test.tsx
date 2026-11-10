import { describe, expect, it } from "vitest";

import { screenToRoute, resolveRouteTarget } from "@/features/app-state/routes";
import { NAV_ITEMS, resolveActiveNav } from "@/layouts/nav-items";
import { SCREEN_MAP } from "@/layouts/screen-map";

describe("resolveActiveNav", () => {
  it("resolves each shell route by exact match", () => {
    expect(resolveActiveNav("/app/dashboard")).toBe("dashboard");
    expect(resolveActiveNav("/app/select")).toBe("select");
    expect(resolveActiveNav("/app/forecast")).toBe("forecast");
    expect(resolveActiveNav("/app/history")).toBe("history");
    expect(resolveActiveNav("/app/billing")).toBe("billing");
  });

  it("highlights history for dynamic attemptId routes", () => {
    expect(resolveActiveNav("/app/history/a6")).toBe("history");
    expect(resolveActiveNav("/app/history/latest")).toBe("history");
  });

  it("returns null outside shell routes", () => {
    expect(resolveActiveNav("/")).toBeNull();
    expect(resolveActiveNav("/exam")).toBeNull();
    expect(resolveActiveNav("/app/unknown")).toBeNull();
  });
});

describe("screenToRoute", () => {
  it("maps standalone screens to top-level paths", () => {
    expect(screenToRoute("landing")).toBe("/");
    expect(screenToRoute("auth")).toBe("/auth");
    expect(screenToRoute("onboarding")).toBe("/onboarding");
    expect(screenToRoute("exam")).toBe("/exam");
    expect(screenToRoute("scoring")).toBe("/scoring");
  });

  it("maps results to parametrized attempt route", () => {
    const target = screenToRoute("results", "a6");
    expect(target).toEqual({
      to: "/app/history/$attemptId",
      params: { attemptId: "a6" },
    });
  });

  it("supports replace option through resolveRouteTarget", () => {
    expect(resolveRouteTarget("/scoring", { replace: true })).toEqual({
      to: "/scoring",
      replace: true,
    });
  });
});

describe("SCREEN_MAP", () => {
  it("covers all 14 prototype screens with feature-map codes", () => {
    expect(SCREEN_MAP).toHaveLength(14);
    expect(SCREEN_MAP.map((entry) => entry.code)).toEqual([
      "S01",
      "S02",
      "S03–05",
      "S06",
      "S07",
      "S07c",
      "S07b",
      "S08–10",
      "S11",
      "S12–15",
      "S19",
      "S22–24",
      "S21",
      "S25",
    ]);
  });
});

describe("NAV_ITEMS", () => {
  it("matches prototype sidebar order and labels", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Trang chủ",
      "Thi thử",
      "Đề forecast",
      "Lịch sử",
      "Gói & thanh toán",
    ]);
  });
});
