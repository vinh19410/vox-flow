import { useEffect, useRef, useState } from "react";

export interface MicLevelState {
  level: number;
  real: boolean | null;
}

/** Live mic level. Uses the real microphone when allowed, otherwise falls back to a simulated signal. */
export function useMicLevel(active: boolean): MicLevelState {
  const [level, setLevel] = useState(0);
  const [real, setReal] = useState<boolean | null>(null);
  const raf = useRef(0);
  useEffect(() => {
    if (!active) {
      setLevel(0);
      setReal(null);
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
    const simulate = () => {
      if (cancelled) return;
      setReal(false);
      const t0 = performance.now();
      const loop = () => {
        if (cancelled) return;
        const t = (performance.now() - t0) / 1000;
        const wave = Math.abs(Math.sin(t * 3.1)) * Math.abs(Math.sin(t * 1.3));
        setLevel(0.35 + 0.3 * wave + Math.random() * 0.2);
        raf.current = requestAnimationFrame(loop);
      };
      loop();
    };
    const mediaPromise = navigator.mediaDevices?.getUserMedia?.({ audio: true });
    if (!mediaPromise) {
      simulate();
    } else {
      mediaPromise
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          media.stream = s;
          const audioCtx = new AudioContext();
          media.ctx = audioCtx;
          const an = audioCtx.createAnalyser();
          an.fftSize = 512;
          audioCtx.createMediaStreamSource(s).connect(an);
          const buf = new Uint8Array(an.fftSize);
          setReal(true);
          const loop = () => {
            if (cancelled) return;
            an.getByteTimeDomainData(buf);
            let sum = 0;
            for (const v of buf) sum += ((v - 128) / 128) ** 2;
            setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
            raf.current = requestAnimationFrame(loop);
          };
          loop();
        })
        .catch(() => {
          releaseMedia();
          if (!cancelled) simulate();
        });
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      releaseMedia();
    };
  }, [active]);

  return { level, real };
}
