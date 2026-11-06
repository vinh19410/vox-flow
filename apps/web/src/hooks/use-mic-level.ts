import { useEffect, useRef, useState } from "react";

export type MicStatus = "idle" | "listening" | "denied" | "unavailable";

export interface MicLevelState {
  level: number;
  real: boolean | null;
  status: MicStatus;
  denied: boolean;
}

/** Live mic level. Uses real MediaStream without simulation when denied or unavailable. */
export function useMicLevel(active: boolean): MicLevelState {
  const [level, setLevel] = useState(0);
  const [real, setReal] = useState<boolean | null>(null);
  const [status, setStatus] = useState<MicStatus>("idle");
  const [denied, setDenied] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      setReal(null);
      setStatus("idle");
      setDenied(false);
      return;
    }

    const media: { stream: MediaStream | null; ctx: AudioContext | null } = { stream: null, ctx: null };
    let cancelled = false;

    const releaseMedia = () => {
      const { stream, ctx } = media;
      media.stream = null;
      media.ctx = null;
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close()?.catch(() => {});
    };

    const mediaPromise = navigator.mediaDevices?.getUserMedia?.({ audio: true });
    if (!mediaPromise) {
      setReal(false);
      setStatus("unavailable");
      setDenied(true);
      setLevel(0);
    } else {
      mediaPromise
        .then(async (s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          media.stream = s;
          try {
            const audioCtx = new AudioContext();
            media.ctx = audioCtx;
            if (audioCtx.state === "suspended") {
              await audioCtx.resume().catch(() => {});
            }
            if (cancelled) {
              releaseMedia();
              return;
            }
            const an = audioCtx.createAnalyser();
            an.fftSize = 512;
            audioCtx.createMediaStreamSource(s).connect(an);
            const buf = new Uint8Array(an.fftSize);
            setReal(true);
            setStatus("listening");
            setDenied(false);

            const loop = () => {
              if (cancelled) return;
              an.getByteTimeDomainData(buf);
              let sum = 0;
              for (const v of buf) sum += ((v - 128) / 128) ** 2;
              setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
              raf.current = requestAnimationFrame(loop);
            };
            loop();
          } catch {
            releaseMedia();
            if (!cancelled) {
              setReal(false);
              setStatus("unavailable");
              setDenied(true);
              setLevel(0);
            }
          }
        })
        .catch(() => {
          releaseMedia();
          if (!cancelled) {
            setReal(false);
            setStatus("denied");
            setDenied(true);
            setLevel(0);
          }
        });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      releaseMedia();
    };
  }, [active]);

  return { level, real, status, denied };
}
