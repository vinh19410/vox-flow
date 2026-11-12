import { describe, expect, it } from "vitest";

import {
  MAX_USER_IMAGE_LENGTH,
  MAX_USER_NAME_LENGTH,
  validateUserImage,
  validateUserName,
} from "./index";

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

  it("accepts images at exact MAX_USER_IMAGE_LENGTH (32_000) and rejects 32_001", () => {
    const httpsPrefix = "https://example.com/";
    const exactHttps =
      httpsPrefix + "a".repeat(MAX_USER_IMAGE_LENGTH - httpsPrefix.length);
    expect(exactHttps.length).toBe(MAX_USER_IMAGE_LENGTH);
    expect(validateUserImage(exactHttps)).toBeUndefined();
    expect(validateUserImage(`${exactHttps}a`)).toBe(false);

    const dataPrefix = "data:image/webp;base64,";
    const exactDataUrl =
      dataPrefix + "A".repeat(MAX_USER_IMAGE_LENGTH - dataPrefix.length);
    expect(exactDataUrl.length).toBe(MAX_USER_IMAGE_LENGTH);
    expect(validateUserImage(exactDataUrl)).toBeUndefined();
    expect(validateUserImage(`${exactDataUrl}A`)).toBe(false);
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

describe("validateUserName", () => {
  it("returns undefined when name is undefined (giữ nguyên tên hiện có)", () => {
    expect(validateUserName(undefined)).toBeUndefined();
  });

  it("trims surrounding whitespace and returns normalized name", () => {
    expect(validateUserName("  Lan  ")).toEqual({ data: { name: "Lan" } });
  });

  it("accepts names of length 1 and exact MAX_USER_NAME_LENGTH (50)", () => {
    expect(MAX_USER_NAME_LENGTH).toBe(50);
    expect(validateUserName("A")).toEqual({ data: { name: "A" } });

    const exact50 = "A".repeat(MAX_USER_NAME_LENGTH);
    expect(validateUserName(exact50)).toEqual({ data: { name: exact50 } });
    expect(validateUserName(`  ${exact50}  `)).toEqual({
      data: { name: exact50 },
    });
  });

  it("rejects names exceeding MAX_USER_NAME_LENGTH (51 chars after trim)", () => {
    expect(validateUserName("A".repeat(MAX_USER_NAME_LENGTH + 1))).toBe(false);
  });

  it("rejects empty and whitespace-only strings", () => {
    expect(validateUserName("")).toBe(false);
    expect(validateUserName("   \t\n  ")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(validateUserName(null)).toBe(false);
    expect(validateUserName(123)).toBe(false);
    expect(validateUserName({})).toBe(false);
    expect(validateUserName([])).toBe(false);
    expect(validateUserName(true)).toBe(false);
  });
});
