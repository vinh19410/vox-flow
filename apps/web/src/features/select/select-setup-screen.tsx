import { ArrowLeft } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { MODES } from "@/features/exam/data";
import { PageHead } from "@/layouts/page-head";

import { PreExamCard } from "./components/pre-exam-card";
import { VoicePicker } from "./components/voice-picker";

export function SelectSetupScreen() {
  const { s, go } = useApp();
  const mode = MODES.find((m) => m.id === s.mode) ?? MODES[0];

  return (
    <>
      <button
        onClick={() => go("select")}
        className="mb-4 flex items-center gap-1.5 text-sm text-subtle hover:text-ink"
      >
        <ArrowLeft size={16} /> Chọn bài thi
      </button>

      <PageHead eyebrow="S07 · Thi thử" title={mode.title} sub={mode.sub} />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <VoicePicker />
        <PreExamCard />
      </div>
    </>
  );
}
