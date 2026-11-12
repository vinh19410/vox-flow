import { Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { VOICES } from "@/features/exam/data";
import { cancelSpeech, speakText } from "@/lib/speech";
import { buildPreviewTtsUrl } from "@/lib/tts-url";
import { cx } from "@/lib/cx";

const PREVIEW_MS = 8000;

export function VoicePicker() {
  const { s, set } = useApp();
  const [preview, setPreview] = useState<string | null>(null);
  const previewTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimer.current !== null) {
        window.clearTimeout(previewTimer.current);
      }
      cancelSpeech();
    };
  }, []);

  const playVoice = (id: string) => {
    const v = VOICES.find((x) => x.id === id);
    if (!v) return;
    if (previewTimer.current !== null) {
      window.clearTimeout(previewTimer.current);
    }
    setPreview(id);
    speakText(`Hello, my name is ${v.name}. I will be your examiner today.`, {
      audioUrl: buildPreviewTtsUrl(v.id),
      lang: id.startsWith("uk") ? "en-GB" : id.startsWith("au") ? "en-AU" : "en-US",
      onEnd: () => {
        if (previewTimer.current !== null) {
          window.clearTimeout(previewTimer.current);
          previewTimer.current = null;
        }
        setPreview((p) => (p === id ? null : p));
      },
    });
    previewTimer.current = window.setTimeout(() => setPreview((p) => (p === id ? null : p)), PREVIEW_MS);
  };

  return (
    <Card className="p-7">
      <h2 className="text-lg font-bold">Giọng giám khảo</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {VOICES.map((v) => {
          const on = s.voice === v.id;
          return (
            <div key={v.id} onClick={() => set({ voice: v.id })} className={cx("cursor-pointer rounded-2xl border p-4 transition-all", on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/30")}>
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-paper-2 font-bold">{v.name[0]}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playVoice(v.id);
                  }}
                  className={cx("grid h-8 w-8 place-items-center rounded-full", preview === v.id ? "bg-brand text-white" : "bg-paper text-ink hover:bg-paper-2")}
                  aria-label={`Nghe thử ${v.name}`}
                >
                  {preview === v.id ? <Volume2 size={14} /> : <Play size={13} />}
                </button>
              </div>
              <div className="mt-3 font-semibold">{v.name}</div>
              <div className="text-xs text-subtle">{v.accent}</div>
              <div className="mt-1 text-xs text-ink-2">{v.tone}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
