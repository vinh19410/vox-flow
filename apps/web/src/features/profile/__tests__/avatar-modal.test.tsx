import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AvatarModal } from "../components/avatar-modal";
import { PRESET_AVATARS } from "../data/preset-avatars";

describe("AvatarModal", () => {
  it("renders when open is true and shows preset avatars by default", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <AvatarModal
        open={true}
        onClose={onClose}
        currentAvatar={null}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Chọn ảnh đại diện")).toBeTruthy();
    expect(screen.getByText("Mẫu có sẵn")).toBeTruthy();
    expect(screen.getByText("Tải ảnh lên")).toBeTruthy();
    expect(screen.getByText("Link URL")).toBeTruthy();

    // Presets are rendered
    expect(screen.getByText(PRESET_AVATARS[0].name.split(" ")[0])).toBeTruthy();
  });

  it("does not render content when open is false", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <AvatarModal
        open={false}
        onClose={onClose}
        currentAvatar={null}
        onSelect={onSelect}
      />,
    );

    expect(screen.queryByText("Chọn ảnh đại diện")).toBeNull();
  });

  it("selects a preset avatar and confirms selection", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <AvatarModal
        open={true}
        onClose={onClose}
        currentAvatar={null}
        onSelect={onSelect}
      />,
    );

    // Pick second avatar
    const secondAvatarBtn = screen.getByTitle(new RegExp(PRESET_AVATARS[1].name));
    fireEvent.click(secondAvatarBtn);

    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đổi ảnh" });
    fireEvent.click(confirmBtn);

    expect(onSelect).toHaveBeenCalledWith(PRESET_AVATARS[1].url);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("switches to URL tab, accepts custom image link, and confirms", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <AvatarModal
        open={true}
        onClose={onClose}
        currentAvatar={null}
        onSelect={onSelect}
      />,
    );

    // Switch to URL tab
    const urlTabBtn = screen.getByRole("button", { name: /Link URL/i });
    fireEvent.click(urlTabBtn);

    const input = screen.getByPlaceholderText("https://example.com/avatar.jpg");
    fireEvent.change(input, { target: { value: "https://example.com/my-pic.png" } });

    const previewBtn = screen.getByRole("button", { name: "Xem thử" });
    fireEvent.click(previewBtn);

    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đổi ảnh" });
    fireEvent.click(confirmBtn);

    expect(onSelect).toHaveBeenCalledWith("https://example.com/my-pic.png");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <AvatarModal
        open={true}
        onClose={onClose}
        currentAvatar={null}
        onSelect={onSelect}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: "Hủy" });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
