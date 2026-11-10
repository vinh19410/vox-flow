import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MODES } from "@/features/exam/data";
import { ModeGrid } from "@/features/select/components/mode-grid";
import { SelectSetupScreen } from "@/features/select/select-setup-screen";
import { renderWithApp } from "@/test/harness";

const MOBILE_QUERY = "(max-width: 1023.98px)";

function mockMatchMedia(matchesMobile: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matchesMobile && query === MOBILE_QUERY,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Select setup flow", () => {
  it("mobile: tapping any mode card keeps the mode and navigates to the setup screen", () => {
    mockMatchMedia(true);

    for (const m of MODES) {
      const h = renderWithApp(<ModeGrid />);
      fireEvent.click(screen.getByText(m.title));
      expect(h.set).toHaveBeenCalledWith({ mode: m.id });
      expect(h.go).toHaveBeenCalledWith("select-setup");
      h.unmount();
    }
  });

  it("desktop: tapping a mode card keeps the mode without navigating", () => {
    // Default window.matchMedia from src/test/setup.ts resolves matches: false.
    const h = renderWithApp(<ModeGrid />);

    fireEvent.click(screen.getByText("Part 2"));

    expect(h.set).toHaveBeenCalledWith({ mode: "p2" });
    expect(h.go).not.toHaveBeenCalled();
  });

  it("setup screen: shows selected mode header, back link, voice picker and start button", () => {
    const h = renderWithApp(<SelectSetupScreen />, { mode: "p2" });

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Part 2");
    expect(screen.getByText("Cue card · 1 phút chuẩn bị").tagName).toBe("P");

    const back = screen.getByRole("button", { name: "Chọn bài thi" });
    fireEvent.click(back);
    expect(h.go).toHaveBeenCalledWith("select");

    expect(screen.getByText("Giọng giám khảo").tagName).toBe("H2");
    const start = screen.getByRole("button", { name: "Đồng ý ghi âm & bắt đầu" });
    fireEvent.click(start);
    expect(h.go).toHaveBeenCalledWith("exam");
  });
});
