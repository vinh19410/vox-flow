import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TopicCard } from "../components/topic-card";
import type { ForecastTopic } from "../types";

const baseTopic: ForecastTopic = {
  id: "p23-long-title",
  kind: "p23",
  title:
    "Describe a person you know who loves to grow plants and spends a lot of time caring for a community garden in the neighborhood",
  category: "People",
  tag: "hot",
  reports: 420,
  lastSeen: "2 ngày trước",
  items: [
    {
      id: "q-cue",
      part: 2,
      text: "Describe a person you know who loves to grow plants.",
      cue: {
        title: "Describe a person who grows plants",
        points: ["Who this person is", "What they grow", "Why they enjoy it"],
        ending: "And explain how you feel about their hobby.",
      },
    },
    {
      id: "q-p3-1",
      part: 3,
      text: "Is growing plants popular in your country?",
    },
  ],
};

describe("TopicCard", () => {
  it("renders card root with h-full and flex-col for equal-height grid alignment", () => {
    const { container } = render(
      <TopicCard topic={baseTopic} saved={false} onOpen={vi.fn()} onToggleSave={vi.fn()} />,
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.classList.contains("h-full")).toBe(true);
    expect(card.classList.contains("flex-col")).toBe(true);
  });

  it("renders full multi-line heading without line-clamp classes", () => {
    render(
      <TopicCard topic={baseTopic} saved={false} onOpen={vi.fn()} onToggleSave={vi.fn()} />,
    );

    const heading = screen.getByRole("heading", { level: 3, name: baseTopic.title });
    expect(heading.textContent).toBe(baseTopic.title);
    expect(heading.className).not.toMatch(/line-clamp/);
  });

  it("renders description paragraph with mb-5 and line-clamp-2", () => {
    const { container } = render(
      <TopicCard topic={baseTopic} saved={false} onOpen={vi.fn()} onToggleSave={vi.fn()} />,
    );

    const desc = container.querySelector("p");
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toBe("Who this person is · What they grow · Why they enjoy it");
    expect(desc?.classList.contains("mb-5")).toBe(true);
    expect(desc?.classList.contains("line-clamp-2")).toBe(true);
  });

  it("pins footer container to bottom with mt-auto instead of mt-5", () => {
    const { container } = render(
      <TopicCard topic={baseTopic} saved={false} onOpen={vi.fn()} onToggleSave={vi.fn()} />,
    );

    const footer = container.querySelector("div.border-t");
    expect(footer).toBeTruthy();
    expect(footer?.classList.contains("mt-auto")).toBe(true);
    expect(footer?.classList.contains("mt-5")).toBe(false);
  });

  it("handles card click, bookmark click stopPropagation, and band CTA states", () => {
    const onOpen = vi.fn();
    const onToggleSave = vi.fn();

    const { container, rerender } = render(
      <TopicCard topic={baseTopic} saved={false} onOpen={onOpen} onToggleSave={onToggleSave} />,
    );

    expect(screen.getByText("Luyện →")).toBeTruthy();
    const ctaSlot = screen.getByText("Luyện →").parentElement as HTMLElement;
    expect(ctaSlot.classList.contains("min-h-7")).toBe(true);
    expect(ctaSlot.classList.contains("items-center")).toBe(true);

    const bookmarkBtn = screen.getByRole("button", { name: "Lưu chủ đề" });
    fireEvent.click(bookmarkBtn);
    expect(onToggleSave).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(
      <TopicCard
        topic={baseTopic}
        band={7}
        saved={true}
        onOpen={onOpen}
        onToggleSave={onToggleSave}
      />,
    );

    const bandBadge = screen.getByText("Band 7.0");
    expect(bandBadge).toBeTruthy();
    expect(bandBadge.parentElement?.classList.contains("min-h-7")).toBe(true);
    expect(screen.queryByText("Luyện →")).toBeNull();
  });
});
