import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { isAlreadySubmittedError, isBadRequestError } from "@/features/scoring/use-scoring-job";
import { trpcClient } from "@/utils/trpc";
import { flushAnswerUploads } from "./answer-uploads";
import { isShortAnswer } from "./data";
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

const MISSING_UPLOADS_MESSAGE = "Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại.";
const PERMANENT_SUBMIT_MESSAGE = "Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi.";
const SUBMIT_NETWORK_MESSAGE = "Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại.";

export function ExamScreen() {
  const session = useExamSession();
  const { s, go, set, setPendingSubmission } = useApp();
  const { step, phase, answers, steps } = session;

  // Submit pipeline for mock attempts: flush → submit → leave. `submitPhase`
  // drives the modal's busy/error UI; `submitRunRef` invalidates a run whose
  // flush was abandoned (modal closed mid-flush); `exitedRef` pins the whole
  // pipeline down once the learner left the exam, so no late completion ever
  // navigates in the background.
  const [submitPhase, setSubmitPhase] = useState<"idle" | "flushing" | "submitting">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  // Synchronous mirror of submitPhase: close/exit handlers must see the phase
  // the pipeline actually moved to, even when the state update has not committed.
  const submitPhaseRef = useRef<"idle" | "flushing" | "submitting">("idle");
  const submitBusyRef = useRef(false);
  const submitRunRef = useRef(0);
  const exitedRef = useRef(false);
  // Latest committed modal visibility, read when a submit settles.
  const reviewOpenRef = useRef(session.review);

  useEffect(() => {
    reviewOpenRef.current = session.review;
  });

  const goPhase = (next: "idle" | "flushing" | "submitting") => {
    submitPhaseRef.current = next;
    setSubmitPhase(next);
  };

  const ans = answers[step.key];
  const short = (k: string, p: Part) => isShortAnswer(answers[k], p);
  const flagged = steps.filter((st) => answers[st.key] && short(st.key, st.part));
  const doneCount = Object.keys(answers).length;

  const doSubmit = async (attemptId: string) => {
    goPhase("submitting");
    setSubmitError(null);
    setStorageWarning(false);
    try {
      await trpcClient.attempt.submit.mutate({ attemptId });
    } catch (err) {
      console.warn("Attempt submit failed:", err);
      if (exitedRef.current) return;
      if (!isAlreadySubmittedError(err)) {
        goPhase("idle");
        // The modal may have been closed mid-submit: the plan's discard
        // contract keeps that failure silent instead of leaking into a later
        // reopen. Errors only surface when the learner can still see the modal.
        if (reviewOpenRef.current) {
          setSubmitError(isBadRequestError(err) ? PERMANENT_SUBMIT_MESSAGE : SUBMIT_NETWORK_MESSAGE);
        }
        return;
      }
      // A lost response may hide a successful submit: the server already
      // finalized this attempt, so treat the rejection as success below.
    }
    if (exitedRef.current) return;
    goPhase("idle");
    setSubmitError(null);
    setStorageWarning(false);
    // Mock attempts are scored: hand the real scoring job to the scoring screen
    // so it starts polling immediately instead of submitting a second time.
    set({ scoringAttempt: { kind: "attempt", attemptId, submitted: true } });
    setPendingSubmission(true);
    go("scoring");
  };

  const beginRun = (body: (attemptId: string, runValid: () => boolean) => Promise<void>, attemptId: string) => {
    if (submitBusyRef.current) return;
    submitBusyRef.current = true;
    const run = ++submitRunRef.current;
    const runValid = () => submitRunRef.current === run;
    void (async () => {
      try {
        await body(attemptId, runValid);
      } finally {
        if (runValid()) submitBusyRef.current = false;
      }
    })().catch(() => {
      // Bodies are total (doSubmit catches its own errors; flush never rejects);
      // this keeps the contract explicit if that ever changes.
    });
  };

  const flushThenSubmit = async (attemptId: string, runValid: () => boolean) => {
    goPhase("flushing");
    setSubmitError(null);
    setStorageWarning(false);
    const result = await flushAnswerUploads(attemptId);
    if (!runValid()) return;
    if (result.failedQuestionKeys.length > 0) {
      goPhase("idle");
      setSubmitError(MISSING_UPLOADS_MESSAGE);
      return;
    }
    if (result.storageUnreadable) {
      // Nothing proven missing — every upload this page knows about settled.
      // Only the device copies could not be read, so submit is an informed choice.
      goPhase("idle");
      setStorageWarning(true);
      return;
    }
    await doSubmit(attemptId);
  };

  const submit = () => {
    if (session.attemptStatus === "pending") return;
    if (s.practice && session.attemptId) {
      // Forecast practice is scored: the scoring screen submits the attempt itself so a
      // failed submit surfaces there with a retry instead of being swallowed here.
      set({ scoringAttempt: { kind: "attempt", attemptId: session.attemptId, submitted: false } });
      setPendingSubmission(true);
      go("scoring");
      return;
    }
    if (s.scoringAttempt) set({ scoringAttempt: null });
    if (!session.attemptId) {
      // Attempt bootstrap failed or timed out (#106): nothing is on the server,
      // so the scoring screen must say so instead of claiming success (#119).
      set({ scoringAttempt: { kind: "local_only" } });
      setPendingSubmission(true);
      go("scoring");
      return;
    }
    beginRun(flushThenSubmit, session.attemptId);
  };

  const submitAnyway = () => {
    if (!session.attemptId) return;
    // Same hand-off hygiene as submit(): a stale scoring job (persisted across
    // reloads) would hijack the scoring screen instead of this mock attempt.
    if (s.scoringAttempt) set({ scoringAttempt: null });
    beginRun(doSubmit, session.attemptId);
  };

  const abandonActiveRun = () => {
    submitRunRef.current += 1;
    submitBusyRef.current = false;
    goPhase("idle");
    setSubmitError(null);
    setStorageWarning(false);
  };

  const closeReview = () => {
    session.setReview(false);
    // Closing mid-flush abandons the run: the attempt is still in_progress, so
    // submitting again later just flushes and submits normally. Mid-submit the
    // run must survive — the server may finalize while the modal is closed, and
    // completion has to navigate (or discard) accordingly.
    if (submitPhaseRef.current === "flushing") abandonActiveRun();
  };

  const exitExam = () => {
    exitedRef.current = true;
    if (submitPhaseRef.current === "flushing") abandonActiveRun();
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
              <LiveTranscript phase={phase} ans={ans} />
            )}

            {phase === "answered" && ans && short(step.key, step.part) && (
              <div className="mt-4 flex animate-rise items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
                <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                <div>
                  <b>Câu trả lời khá ngắn ({ans.secs} giây).</b>{" "}
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
        onClose={closeReview}
        steps={steps}
        answers={answers}
        short={short}
        flaggedCount={flagged.length}
        onRetry={session.retryStep}
        onSubmit={submit}
        submitLocked={session.attemptStatus === "pending"}
        submitPhase={submitPhase}
        submitError={submitError}
        allowSubmitAnyway={storageWarning}
        onSubmitAnyway={submitAnyway}
      />
      <ExitExamModal open={session.exitOpen} onClose={() => session.setExitOpen(false)} onExit={exitExam} />
    </div>
  );
}
