import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MODES } from "@/features/exam/data";
import { ModeGrid } from "@/features/select/components/mode-grid";
import { SelectScreen } from "@/features/select/select-screen";
import { SelectSetupScreen } from "@/features/select/select-setup-screen";
import { SELECT_MOBILE_QUERY } from "@/features/select/use-select-mobile-viewport";
import { renderWithApp } from "@/test/harness";

function mockMatchMedia(matchesMobile: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matchesMobile && query === SELECT_MOBILE_QUERY,
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

function createStatefulMatchMedia(initialMobile: boolean) {
  let matchesMobile = initialMobile;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const isTarget = query === SELECT_MOBILE_QUERY;
    return {
      get matches() {
        return isTarget ? matchesMobile : false;
      },
      media: query,
      onchange: null,
      addListener: (cb: (event: MediaQueryListEvent) => void) => {
        if (isTarget) listeners.add(cb);
      },
      removeListener: (cb: (event: MediaQueryListEvent) => void) => {
        if (isTarget) listeners.delete(cb);
      },
      addEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
        if (isTarget && type === "change" && typeof cb === "function") {
          listeners.add(cb as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
        if (isTarget && type === "change" && typeof cb === "function") {
          listeners.delete(cb as (event: MediaQueryListEvent) => void);
        }
      },
      dispatchEvent: () => false,
    } as MediaQueryList;
  });

  return {
    listenerCount: () => listeners.size,
    setMobile(next: boolean) {
      matchesMobile = next;
      const event = { matches: next, media: SELECT_MOBILE_QUERY } as MediaQueryListEvent;
      for (const cb of [...listeners]) {
        cb(event);
      }
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Select setup flow", () => {
  it("mobile: SelectScreen hides and unmounts VoicePicker and PreExamCard while preserving all 4 mode cards", () => {
    mockMatchMedia(true);
    renderWithApp(<SelectScreen />, { mode: "p1" });

    for (const m of MODES) {
      expect(screen.getByRole("button", { name: new RegExp(m.title) })).toBeTruthy();
    }
    const part1Btn = screen.getByRole("button", { name: /Part 1/ });
    expect(part1Btn.className).toContain("bg-ink");

    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();
    expect(screen.queryByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ })).toBeNull();
  });

  it("desktop: SelectScreen renders VoicePicker and PreExamCard inside a hidden lg:grid wrapper", () => {
    mockMatchMedia(false);
    renderWithApp(<SelectScreen />);

    const voiceHeading = screen.getByText("Giọng giám khảo");
    const preExamHeading = screen.getByText("Trước khi bắt đầu");
    const wrapper = voiceHeading.closest("div.lg\\:grid");

    expect(wrapper).toBeTruthy();
    expect(wrapper?.className).toContain("hidden");
    expect(wrapper?.className).toContain("lg:grid");
    expect(wrapper?.contains(preExamHeading)).toBe(true);
  });

  it("dynamic viewport resize across 1024px mounts and unmounts VoicePicker and PreExamCard", () => {
    const media = createStatefulMatchMedia(true);
    const { unmount } = renderWithApp(<SelectScreen />);

    expect(media.listenerCount()).toBe(1);
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();

    act(() => {
      media.setMobile(false);
    });

    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
    expect(screen.getByText("Trước khi bắt đầu")).toBeTruthy();

    act(() => {
      media.setMobile(true);
    });

    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("falls back to legacy addListener/removeListener when addEventListener is unavailable", () => {
    let matchesMobile = true;
    const legacyListeners = new Set<(event: MediaQueryListEvent) => void>();

    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          get matches() {
            return query === SELECT_MOBILE_QUERY ? matchesMobile : false;
          },
          media: query,
          onchange: null,
          addListener: (cb: (event: MediaQueryListEvent) => void) => {
            if (query === SELECT_MOBILE_QUERY) legacyListeners.add(cb);
          },
          removeListener: (cb: (event: MediaQueryListEvent) => void) => {
            if (query === SELECT_MOBILE_QUERY) legacyListeners.delete(cb);
          },
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );

    const { unmount } = renderWithApp(<SelectScreen />);
    expect(legacyListeners.size).toBe(1);
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();

    act(() => {
      matchesMobile = false;
      const event = { matches: false, media: SELECT_MOBILE_QUERY } as MediaQueryListEvent;
      for (const cb of [...legacyListeners]) cb(event);
    });

    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();

    unmount();
    expect(legacyListeners.size).toBe(0);
  });
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

  it("aligns mode cards with h-full flex-col and bottom-pins duration footer with mt-auto", () => {
    renderWithApp(<ModeGrid />);

    for (const m of MODES) {
      const btn = screen.getByRole("button", { name: new RegExp(m.title) });
      expect(btn.className).toContain("h-full");
      expect(btn.className).toContain("flex-col");

      const durationEl = within(btn).getByText(m.time);
      expect(durationEl.className).toContain("mt-auto");
      expect(durationEl.className).toContain("pt-6");
      expect(durationEl.className).not.toContain("mt-6");
    }
  });
});
