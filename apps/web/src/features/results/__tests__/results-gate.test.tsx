import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithApp } from "@/test/harness";

import { ResultsScreen } from "../results-screen";

describe("ResultsScreen (Beta Gate: FEATURES.scoring = false)", () => {
  it("renders coming soon state and hides mock band score and criteria", () => {
    renderWithApp(<ResultsScreen attemptId="latest" />);

    expect(
      screen.getByText("Tính năng chấm điểm AI sắp ra mắt"),
    ).toBeTruthy();
    expect(screen.queryByText(/Bạn đạt band/)).toBeNull();
    expect(screen.queryByText("Fluency & Coherence")).toBeNull();
  });
});
