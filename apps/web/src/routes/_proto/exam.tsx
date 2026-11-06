import { createFileRoute } from "@tanstack/react-router";

import { ExamScreen } from "@/features/exam/exam-screen";
import { requireOnboarded } from "@/lib/auth-guard";

export const Route = createFileRoute("/_proto/exam")({
  beforeLoad: ({ location }) => requireOnboarded(location.href),
  component: ExamScreen,
});
