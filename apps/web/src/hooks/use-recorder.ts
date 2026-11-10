import { useCallback, useEffect, useRef, useState } from "react";

import { promiseWithResolvers } from "@/lib/promise-with-resolvers";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "stopped"
  | "denied"
  | "unsupported";

export type RecordedAudio = {
  blob: Blob;
  durationMs: number;
  mimeType: string;
};

export interface UseRecorderResult {
  status: RecorderStatus;
  isRecording: boolean;
  mimeType: string;
  start: () => Promise<boolean>;
  stop: () => Promise<RecordedAudio | null>;
  cancel: () => void;
}

export function detectSupportedMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  return "audio/webm";
}

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>(detectSupportedMimeType());

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return false;
    }

    setStatus("requesting");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = detectSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
      startTimeRef.current = performance.now();
      setStatus("recording");
      return true;
    } catch (err: unknown) {
      cleanupStream();
      const isNotAllowed =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setStatus(isNotAllowed ? "denied" : "unsupported");
      return false;
    }
  }, [cleanupStream]);

  const stop = useCallback(async (): Promise<RecordedAudio | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setStatus("idle");
      cleanupStream();
      return null;
    }

    const { promise, resolve } = promiseWithResolvers<RecordedAudio | null>();
    const durationMs = Math.round(performance.now() - startTimeRef.current);
    const mimeType = mimeTypeRef.current;

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      cleanupStream();
      setStatus("stopped");
      resolve({
        blob,
        durationMs,
        mimeType,
      });
    };

    recorder.stop();
    return promise;
  }, [cleanupStream]);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    cleanupStream();
    chunksRef.current = [];
    setStatus("idle");
  }, [cleanupStream]);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [cleanupStream]);

  return {
    status,
    isRecording: status === "recording",
    mimeType: mimeTypeRef.current,
    start,
    stop,
    cancel,
  };
}
