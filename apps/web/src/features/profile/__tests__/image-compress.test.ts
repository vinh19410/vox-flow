import { describe, expect, it, vi } from "vitest";

import { compressImageFile } from "../utils/image-compress";
import { withoutPromiseWithResolvers } from "@/test/without-promise-with-resolvers";

describe("compressImageFile", () => {
  it("rejects non-image files with a Vietnamese error message", async () => {
    const textFile = new File(["hello world"], "test.txt", { type: "text/plain" });

    await expect(compressImageFile(textFile)).rejects.toThrow(
      "Tệp được chọn không phải là hình ảnh hợp lệ",
    );
  });

  it("rejects images larger than 5MB with an error message", async () => {
    // Create a 6MB mock file
    const largeBlob = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([largeBlob], "huge.jpg", { type: "image/jpeg" });

    await expect(compressImageFile(largeFile)).rejects.toThrow(
      "Kích thước tệp vượt quá 5MB",
    );
  });

  it("compresses a valid image file through canvas into a squared WebP data URL", async () => {
    const drawImageMock = vi.fn();
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage: drawImageMock } as never);
    const toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/webp;base64,AAA");
    // jsdom never fires img.onload for blob/data sources — stub Image to load synchronously.
    const imageSpy = vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 400;
        naturalHeight = 300;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    try {
      const pngContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const imageFile = new File([pngContent], "avatar.png", {
        type: "image/png",
      });

      const result = await compressImageFile(imageFile, 180, 0.85);

      expect(result).toBe("data:image/webp;base64,AAA");
      expect(toDataURLSpy).toHaveBeenCalledWith("image/webp", 0.85);

      // Canvas was resized to the max dimension square
      const createdCanvas = toDataURLSpy.mock.instances[0] as HTMLCanvasElement;
      expect(createdCanvas.width).toBe(180);
      expect(createdCanvas.height).toBe(180);

      // Center-cropped square source: 300x300 starting at (50, 0)
      expect(drawImageMock).toHaveBeenCalledWith(
        expect.anything(),
        50,
        0,
        300,
        300,
        0,
        0,
        180,
        180,
      );
    } finally {
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
      vi.unstubAllGlobals();
      void imageSpy;
    }
  });

  it("compresses when Promise.withResolvers is unavailable (iOS Safari < 17.4)", async () => {
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage: vi.fn() } as never);
    const toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/webp;base64,AAA");
    const imageSpy = vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 400;
        naturalHeight = 300;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    const restore = withoutPromiseWithResolvers();
    try {
      const pngContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const imageFile = new File([pngContent], "avatar.png", {
        type: "image/png",
      });

      await expect(compressImageFile(imageFile, 180, 0.85)).resolves.toBe(
        "data:image/webp;base64,AAA",
      );
    } finally {
      restore();
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
      vi.unstubAllGlobals();
      void imageSpy;
    }
  });

  it("rejects when the compressed data URL exceeds the max output length", async () => {
    const drawImageMock = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: drawImageMock,
    } as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/webp;base64," + "A".repeat(64),
    );
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 400;
        naturalHeight = 300;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    try {
      const pngContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const imageFile = new File([pngContent], "big-output.png", {
        type: "image/png",
      });

      await expect(compressImageFile(imageFile, 180, 0.85, 16)).rejects.toThrow(
        "vượt quá giới hạn dung lượng",
      );
      expect(drawImageMock).not.toHaveBeenCalledTimes(0);
    } finally {
      vi.mocked(HTMLCanvasElement.prototype.getContext).mockRestore();
      vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("rejects when the browser fails to decode the image", async () => {
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 0;
        naturalHeight = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );

    try {
      const pngContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const imageFile = new File([pngContent], "broken.png", {
        type: "image/png",
      });

      await expect(compressImageFile(imageFile)).rejects.toThrow(
        "Không thể tải và phân giải hình ảnh này.",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects instead of returning the uncompressed original when canvas is unavailable", async () => {
    const originalImage = globalThis.Image;
    // Simulate an environment without Image support (e.g. SSR) — the caller
    // must get an error, never the raw original data URL.
    // @ts-expect-error deliberately removing Image
    delete globalThis.Image;

    try {
      const pngContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const imageFile = new File([pngContent], "avatar.png", {
        type: "image/png",
      });

      await expect(compressImageFile(imageFile)).rejects.toThrow(
        "Trình duyệt không hỗ trợ xử lý ảnh",
      );
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it("rejects when the decoded image has zero dimensions", async () => {
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 0;
        naturalHeight = 0;
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    try {
      const pngContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const imageFile = new File([pngContent], "empty.png", {
        type: "image/png",
      });

      await expect(compressImageFile(imageFile)).rejects.toThrow(
        "Hình ảnh không hợp lệ hoặc rỗng.",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
