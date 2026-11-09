import { TriangleAlert } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { trpcClient } from "@/utils/trpc";
import { MIN_WORDS } from "./data";
import { CueCardPanel } from "./components/cue-card-panel";
import { ExamControls } from "./components/exam-controls";
import { ExamHeader } from "./components/exam-header";
import { ExamIntro } from "./components/exam-intro";
import { ExitExamModal } from "./components/exit-exam-modal";
import { LiveTranscript } from "./components/live-transcript";
import { PreSubmitModal } from "./components/pre-submit-modal";
import { QuestionStage } from "./components/question-stage";
import { useExamSession } from "./use-exam-session";
import type { Part } from "./types";

export function ExamScreen() {
  const session = useExamSession();
  const { s, go, set, setPendingSubmission } = useApp();
  const { step, phase, answers, steps } = session;

  const ans = answers[step.key];
  const short = (k: string, p: Part) => (answers[k]?.words ?? 0) < MIN_WORDS[p];
  const flagged = steps.filter((st) => answers[st.key] && short(st.key, st.part));
  const doneCount = Object.keys(answers).length;

  const submit = () => {
    if (session.attemptId) {
      void trpcClient.attempt.submit
        .mutate({ attemptId: session.attemptId })
        .catch((err) => {
          console.warn("Attempt submit in background failed:", err);
        });
    }
    setPendingSubmission(true);
    go("scoring");
  };

  const exitExam = () => {
    const target = s.practice ? "forecast" : "select";
    set({ practice: null });
    go(target);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-paper">
      <ExamHeader
        parts={session.parts}
        activePart={step.part}
        partT={session.partT}
        muted={session.muted}
        onToggleMuted={session.toggleMuted}
        onExit={() => session.setExitOpen(true)}
      />
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
        {phase === "intro" ? (
          <ExamIntro part={step.part} onBegin={session.begin} />
        ) : (
          <div key={step.key} className="flex flex-1 animate-rise flex-col">
            <QuestionStage voice={session.voice} phase={phase} typed={session.typed} step={step} />

            {step.cue && (
              <CueCardPanel
                cue={step.cue}
                prep={phase === "prep"}
                prepT={session.prepT}
                notes={session.notes}
                onNotes={session.setNotes}
              />
            )}

            {(phase === "recording" || phase === "answered") && (
              <LiveTranscript phase={phase} words={session.words} spoken={session.spoken} ans={ans} />
            )}

            {phase === "answered" && ans && short(step.key, step.part) && (
              <div className="mt-4 flex animate-rise items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
                <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                <div>
                  <b>Câu trả lời khá ngắn ({ans.words} từ).</b>{" "}
                  {step.part === 1
                    ? "Part 1 vẫn hợp lệ nếu đủ ý — thử thêm 1 lý do hoặc ví dụ để giữ band Fluency."
                    : step.part === 2
                      ? "Part 2 nên nói 1.5–2 phút. Nói quá ngắn sẽ ảnh hưởng điểm Fluency."
                      : "Part 3 cần lập luận: ý chính → lý do → ví dụ."}
                </div>
              </div>
            )}

            <ExamControls
              phase={phase}
              level={session.level}
              recT={session.recT}
              maxRec={session.maxRec}
              nextLabel={
                session.returnToReview ? "Về danh sách nộp" : session.idx === steps.length - 1 ? "Hoàn thành" : "Câu tiếp theo"
              }
              onStartRec={session.startRec}
              onStopRec={session.stopRec}
              onRestart={session.restart}
              onNext={session.next}
            />
          </div>
        )}
      </main>

      <PreSubmitModal
        open={session.review}
        onClose={() => session.setReview(false)}
        steps={steps}
        answers={answers}
        short={short}
        flaggedCount={flagged.length}
        onRetry={session.retryStep}
        onSubmit={submit}
      />
      <ExitExamModal open={session.exitOpen} onClose={() => session.setExitOpen(false)} onExit={exitExam} />
    </div>
  );
}
