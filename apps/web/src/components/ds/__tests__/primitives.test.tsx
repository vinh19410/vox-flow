import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageHead } from "@/layouts/page-head";

import { Badge } from "../badge";
import { BandRange } from "../band-range";
import { Button } from "../button";
import { Card } from "../card";
import { Logo } from "../logo";
import { Modal } from "../modal";
import { Toggle } from "../toggle";
import { Wave } from "../wave";

describe("design-system primitives", () => {
  it("renders Button variant='accent' with bg-brand and focus-visible:outline-brand", () => {
    render(<Button variant="accent">Bắt đầu</Button>);
    const btn = screen.getByRole("button", { name: "Bắt đầu" });
    expect(btn.className).toContain("bg-brand");
    expect(btn.className).toContain("focus-visible:outline-brand");
    expect(btn.className).not.toContain("bg-accent");
  });

  it("renders Badge tone='accent' with bg-brand-soft and text-brand", () => {
    render(<Badge tone="accent">Mới</Badge>);
    const badge = screen.getByText("Mới");
    expect(badge.className).toContain("bg-brand-soft");
    expect(badge.className).toContain("text-brand");
    expect(badge.className).not.toContain("bg-accent-soft");
  });

  it("toggles Toggle switch state via onChange(!on) and reflects aria-checked", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Toggle on={false} onChange={onChange} label="Lưu lịch sử" />,
    );
    const toggle = screen.getByRole("switch", { name: "Lưu lịch sử" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<Toggle on={true} onChange={onChange} label="Lưu lịch sử" />);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("closes Modal on Escape keydown and backdrop click", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open={true} onClose={onClose}>
        <div>Chi tiết modal</div>
      </Modal>,
    );

    expect(screen.getByText("Chi tiết modal")).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(
      <Modal open={false} onClose={onClose}>
        <div>Chi tiết modal</div>
      </Modal>,
    );
    expect(screen.queryByText("Chi tiết modal")).toBeNull();
  });

  it("renders BandRange integer ticks 4..9 with text-subtle and brand bar classes", () => {
    const { container } = render(
      <BandRange band={6.5} range={[6.0, 7.0]} target={7.5} />,
    );

    for (const tick of [4, 5, 6, 7, 8, 9]) {
      expect(screen.getByText(String(tick))).toBeDefined();
    }
    expect(screen.queryByText("4.5")).toBeNull();

    const tickRow = screen.getByText("4").parentElement;
    expect(tickRow?.className).toContain("text-subtle");
    expect(container.querySelector(".bg-brand\\/35")).not.toBeNull();
    expect(container.querySelector(".border-brand")).not.toBeNull();
  });

  it("renders Card, Logo, Wave, and PageHead with renamed brand and subtle classes", () => {
    const { container } = render(
      <Card>
        <Logo />
        <PageHead eyebrow="S06 · Tổng quan" title="Trang chủ" sub="Mô tả" />
        <Wave level={0.6} active={true} bars={8} />
      </Card>,
    );

    expect(screen.getByText("Flow").className).toContain("text-brand");
    expect(screen.getByText("S06 · Tổng quan").className).toContain(
      "text-subtle",
    );
    expect(container.querySelectorAll(".bg-brand").length).toBe(8);
  });
});
