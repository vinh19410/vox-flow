import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithApp } from "@/test/harness";

import { PlanGrid } from "../components/plan-grid";
import { PLANS } from "../data";

function assertCardLayout() {
  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(PLANS.length);

  for (const button of buttons) {
    const classes = button.className.split(/\s+/);
    expect(classes).toContain("h-full");
    expect(classes).toContain("flex-col");
  }

  const ctas = screen.getAllByText("Chọn gói");
  expect(ctas).toHaveLength(PLANS.length);

  for (const cta of ctas) {
    expect(cta.tagName).toBe("SPAN");
    const classes = cta.className.split(/\s+/);
    expect(classes).toContain("mt-auto");
    expect(classes).toContain("pt-4");
    expect(classes).not.toContain("mt-4");
  }
}

describe("PlanGrid", () => {
  it.each([
    { label: "with examDate", examDate: "2026-12-20" },
    { label: "with examDate: null", examDate: null },
  ])("renders full-height cards, bottom-pinned CTA, perks, and handles onPick in default mode ($label)", ({ examDate }) => {
    const onPick = vi.fn();
    renderWithApp(<PlanGrid onPick={onPick} />, { examDate });

    assertCardLayout();

    if (examDate === null) {
      expect(screen.getByText("Tối đa 60 ngày")).toBeTruthy();
    } else {
      expect(screen.queryByText("Tối đa 60 ngày")).toBeNull();
    }

    for (const plan of PLANS) {
      for (const perk of plan.perks) {
        expect(screen.getAllByText(perk).length).toBeGreaterThan(0);
      }
    }

    const buttons = screen.getAllByRole("button");
    PLANS.forEach((plan, index) => {
      fireEvent.click(buttons[index]!);
      expect(onPick).toHaveBeenLastCalledWith(plan);
    });
    expect(onPick).toHaveBeenCalledTimes(PLANS.length);
  });

  it("renders full-height cards and bottom-pinned CTA while hiding perks in compact mode", () => {
    const onPick = vi.fn();
    renderWithApp(<PlanGrid onPick={onPick} compact />);

    assertCardLayout();

    for (const plan of PLANS) {
      for (const perk of plan.perks) {
        expect(screen.queryByText(perk)).toBeNull();
      }
    }
  });
});
