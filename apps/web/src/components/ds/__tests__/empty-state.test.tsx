import { fireEvent, render, screen } from "@testing-library/react";
import { Inbox, Sparkles } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "../empty-state";

describe("EmptyState component", () => {
  it("renders title and description properly", () => {
    render(
      <EmptyState
        title="Chưa có bài thi nào"
        description="Làm bài thi thử đầu tiên để bắt đầu theo dõi tiến độ."
      />,
    );

    expect(screen.getByText("Chưa có bài thi nào")).toBeTruthy();
    expect(
      screen.getByText(
        "Làm bài thi thử đầu tiên để bắt đầu theo dõi tiến độ.",
      ),
    ).toBeTruthy();
  });

  it("renders icon when provided as component or element", () => {
    const { rerender } = render(
      <EmptyState
        icon={Inbox}
        title="Không có kết quả"
      />,
    );

    expect(screen.getByTestId("empty-state")).toBeTruthy();

    rerender(
      <EmptyState
        icon={<span data-testid="custom-icon">✨</span>}
        title="Không có kết quả"
      />,
    );

    expect(screen.getByTestId("custom-icon")).toBeTruthy();
  });

  it("handles action object with label and click handler", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="Chưa có dữ liệu"
        action={{
          label: "Thi thử ngay",
          onClick: handleClick,
          icon: Sparkles,
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Thi thử ngay" });
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders secondary action alongside primary action", () => {
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();

    render(
      <EmptyState
        title="Chưa có mục nào"
        action={{
          label: "Hành động chính",
          onClick: handlePrimary,
        }}
        secondaryAction={{
          label: "Hành động phụ",
          onClick: handleSecondary,
          variant: "outline",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Hành động chính" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hành động phụ" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hành động phụ" }));
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it("supports size variants and bordered styling", () => {
    const { rerender } = render(
      <EmptyState
        title="Compact state"
        size="sm"
        bordered
      />,
    );

    const container = screen.getByTestId("empty-state");
    expect(container.className).toContain("py-6");
    expect(container.className).toContain("border-dashed");

    rerender(
      <EmptyState
        title="Large state"
        size="lg"
      />,
    );
    expect(container.className).toContain("py-16");
  });
});
