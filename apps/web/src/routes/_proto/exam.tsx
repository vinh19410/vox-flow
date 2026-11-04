import { createFileRoute } from "@tanstack/react-router";

import { ExamScreen } from "@/features/exam/exam-screen";

export const Route = createFileRoute("/_proto/exam")({
  component: ExamScreen,
});
