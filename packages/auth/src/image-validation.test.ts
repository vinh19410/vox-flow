import { describe, expect, it } from "vitest";

import { MAX_USER_IMAGE_LENGTH, validateUserImage } from "./index";

describe("validateUserImage", () => {
  it("accepts undefined and null (giữ nguyên / xóa avatar)", () => {
    expect(validateUserImage(undefined)).toBeUndefined();
    expect(validateUserImage(null)).toEqual({ data: { image: null } });
  });

  it("accepts https URLs", () => {
    expect(validateUserImage("https://lh3.googleusercontent.com/a/photo")).toBeUndefined();
  });

  it("accepts compressed data URLs (webp/jpeg/png base64)", () => {
    expect(validateUserImage("data:image/webp;base64,AAAA")).toBeUndefined();
    expect(validateUserImage("data:image/jpeg;base64,AAAA")).toBeUndefined();
    expect(validateUserImage("data:image/png;base64,AAAA")).toBeUndefined();
  });

  it("accepts internal /avatars/ static paths", () => {
    expect(validateUserImage("/avatars/owl-scholar.svg")).toBeUndefined();
  });

  it("rejects non-string and empty values", () => {
    expect(validateUserImage(123)).toBe(false);
    expect(validateUserImage("")).toBe(false);
    expect(validateUserImage({})).toBe(false);
  });

  it("rejects images exceeding the size cap", () => {
    const huge = `data:image/webp;base64,${"A".repeat(MAX_USER_IMAGE_LENGTH)}`;
    expect(validateUserImage(huge)).toBe(false);
  });

  it("rejects script-bearing SVG data URLs and other schemes", () => {
    expect(
      validateUserImage("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="),
    ).toBe(false);
    expect(
      validateUserImage(
        "data:image/svg+xml;utf8,%3Csvg%20onload%3D%22alert(1)%22%3E%3C%2Fsvg%3E",
      ),
    ).toBe(false);
    expect(validateUserImage("http://insecure.example.com/a.png")).toBe(false);
    expect(validateUserImage("javascript:alert(1)")).toBe(false);
    expect(validateUserImage("/etc/passwd")).toBe(false);
  });
});

// Đường dẫn tĩnh của bộ avatar mẫu phía web (apps/web/src/features/profile/data/preset-avatars.ts).
// Hợp đồng: mọi avatar mẫu phải được server-side hook chấp nhận, nếu không
// tính năng "chọn avatar mẫu" trong màn hình hồ sơ sẽ lỗi khi lưu.
const WEB_PRESET_AVATAR_URLS = [
  "/avatars/owl-scholar.svg",
  "/avatars/fox-sharp.svg",
  "/avatars/cat-cool.svg",
  "/avatars/bear-resilient.svg",
  "/avatars/panda-fluent.svg",
  "/avatars/dolphin-agile.svg",
];

describe("web preset avatars pass server-side image validation", () => {
  it("every preset avatar url is accepted by validateUserImage", () => {
    for (const url of WEB_PRESET_AVATAR_URLS) {
      expect(validateUserImage(url)).toBeUndefined();
    }
  });

  it("does not allow svg data URLs even though preset files are svg", () => {
    // Preset là file tĩnh tin cậy (/avatars/*.svg); data URL SVG do người dùng
    // nhập vẫn phải bị chặn vì SVG có thể chứa script.
    expect(
      validateUserImage("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="),
    ).toBe(false);
  });
});
