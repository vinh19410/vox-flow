import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectSupportedMimeType, useRecorder, type RecordedAudio } from "../use-recorder";
import { withoutPromiseWithResolvers } from "@/test/without-promise-with-resolvers";

describe("useRecorder", () => {
  let originalMediaRecorder: typeof MediaRecorder;
  let originalMediaDevices: typeof navigator.mediaDevices;

  class MockMediaRecorder {
    static isTypeSupported = vi.fn((type: string) => type.includes("webm") || type.includes("mp4"));
    state = "inactive";
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    mimeType: string;

    constructor(_stream: MediaStream, options?: { mimeType?: string }) {
      this.mimeType = options?.mimeType ?? "audio/webm";
    }

    start() {
      this.state = "recording";
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(["chunk1"], { type: this.mimeType }) });
      }
    }

    stop() {
      this.state = "inactive";
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(["chunk2"], { type: this.mimeType }) });
      }
      if (this.onstop) {
        this.onstop();
      }
    }
  }

  beforeEach(() => {
    originalMediaRecorder = window.MediaRecorder;
    originalMediaDevices = navigator.mediaDevices;

    // @ts-expect-error mock MediaRecorder
    window.MediaRecorder = MockMediaRecorder;

    const mockTrack = { stop: vi.fn() };
    const mockStream = {
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });
  });

  afterEach(() => {
    window.MediaRecorder = originalMediaRecorder;
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: originalMediaDevices,
    });
  });

  it("detects supported MIME types correctly", () => {
    expect(detectSupportedMimeType()).toContain("audio/");
  });

  it("starts and stops recording successfully, returning audio Blob", async () => {
    const { result } = renderHook(() => useRecorder());

    expect(result.current.status).toBe("idle");
    expect(result.current.isRecording).toBe(false);

    let started = false;
    await act(async () => {
      started = await result.current.start();
    });

    expect(started).toBe(true);
    expect(result.current.status).toBe("recording");
    expect(result.current.isRecording).toBe(true);

    let recorded: RecordedAudio | null = null;
    await act(async () => {
      recorded = await result.current.stop();
    });

    expect(result.current.status).toBe("stopped");
    expect(result.current.isRecording).toBe(false);
    expect(recorded).toBeDefined();
    const audio = recorded as unknown as RecordedAudio;
    expect(audio.blob).toBeInstanceOf(Blob);
    expect(audio.durationMs).toBeGreaterThanOrEqual(0);
  });
  it("sets status to denied when microphone permission is rejected", async () => {
    const permissionError = new Error("Permission denied");
    permissionError.name = "NotAllowedError";

    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(permissionError);

    const { result } = renderHook(() => useRecorder());

    let started = true;
    await act(async () => {
      started = await result.current.start();
    });

    expect(started).toBe(false);
    expect(result.current.status).toBe("denied");
    expect(result.current.isRecording).toBe(false);
  });

  it("stops and returns audio when Promise.withResolvers is unavailable (iOS Safari < 17.4)", async () => {
    const restore = withoutPromiseWithResolvers();
    try {
      const { result } = renderHook(() => useRecorder());

      let started = false;
      await act(async () => {
        started = await result.current.start();
      });
      expect(started).toBe(true);

      let recorded: RecordedAudio | null = null;
      await act(async () => {
        recorded = await result.current.stop();
      });

      expect(recorded).toBeDefined();
      const audio = recorded as unknown as RecordedAudio;
      expect(audio.blob).toBeInstanceOf(Blob);
      expect(audio.durationMs).toBeGreaterThanOrEqual(0);
    } finally {
      restore();
    }
  });
});
