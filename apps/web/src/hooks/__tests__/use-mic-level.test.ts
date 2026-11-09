import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMicLevel } from "../use-mic-level";

describe("useMicLevel", () => {
  const originalAudioContext = globalThis.AudioContext;
  const originalMediaDevices = Object.getOwnPropertyDescriptor(
    navigator,
    "mediaDevices",
  );

  const setGetUserMedia = (
    impl: () => Promise<MediaStream>,
  ) => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn(impl),
      },
    });
  };

  afterEach(() => {
    (globalThis as Record<string, unknown>).AudioContext = originalAudioContext;
    if (originalMediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", originalMediaDevices);
    } else {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        writable: true,
        value: undefined,
      });
    }
  });

  it("reports denied status and zero level when getUserMedia rejects", async () => {
    setGetUserMedia(() => Promise.reject(new Error("Permission denied")));

    const { result, unmount } = renderHook(() => useMicLevel(true));

    await waitFor(() => {
      expect(result.current.real).toBe(false);
      expect(result.current.denied).toBe(true);
      expect(result.current.status).toBe("denied");
    });
    expect(result.current.level).toBe(0);

    unmount();
  });

  it("stops MediaStream tracks immediately if AudioContext constructor throws", async () => {
    const stop = vi.fn();
    const mockStream = {
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;

    setGetUserMedia(() => Promise.resolve(mockStream));

    class ThrowingAudioContext {
      constructor() {
        throw new Error("AudioContext suspended by policy");
      }
    }
    (globalThis as Record<string, unknown>).AudioContext = ThrowingAudioContext;

    const { result, unmount } = renderHook(() => useMicLevel(true));

    await waitFor(() => {
      expect(result.current.real).toBe(false);
    });
    expect(stop).toHaveBeenCalledTimes(1);

    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("stops MediaStream tracks and closes AudioContext on unmount and resets when inactive", async () => {
    const stop = vi.fn();
    const close = vi.fn(() => Promise.resolve());
    const mockStream = {
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;

    setGetUserMedia(() => Promise.resolve(mockStream));

    class WorkingAudioContext {
      createAnalyser() {
        return {
          fftSize: 512,
          getByteTimeDomainData: (buf: Uint8Array) => buf.fill(160),
        };
      }
      createMediaStreamSource() {
        return { connect: () => {} };
      }
      close = close;
    }
    (globalThis as Record<string, unknown>).AudioContext = WorkingAudioContext;

    const { result, rerender, unmount } = renderHook(
      ({ active }) => useMicLevel(active),
      { initialProps: { active: true } },
    );

    await waitFor(() => {
      expect(result.current.real).toBe(true);
    });
    expect(result.current.level).toBeGreaterThan(0);

    rerender({ active: false });
    expect(stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(result.current.level).toBe(0);
    expect(result.current.real).toBeNull();

    rerender({ active: true });
    await waitFor(() => {
      expect(result.current.real).toBe(true);
    });

    unmount();
    expect(stop).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(2);
  });
});
