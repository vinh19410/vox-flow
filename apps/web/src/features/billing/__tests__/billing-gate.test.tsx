import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithApp } from "@/test/harness";

import { PaymentPanel } from "../components/payment-panel";
import { PLANS } from "../data";

describe("PaymentPanel (Beta Gate: FEATURES.billing = false)", () => {
  it("renders coming soon state and hides FakeQR and transfer activation", () => {
    const onBack = vi.fn();
    const onDone = vi.fn();
    renderWithApp(<PaymentPanel plan={PLANS[0]!} onBack={onBack} onDone={onDone} />);

    expect(screen.getByText("Cổng thanh toán sắp ra mắt")).toBeTruthy();
    expect(screen.queryByText("Quét mã để thanh toán")).toBeNull();
    expect(screen.queryByText("Đã chuyển khoản")).toBeNull();
  });
});
