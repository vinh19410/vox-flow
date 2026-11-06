import { createFileRoute } from "@tanstack/react-router";

import { ExamScreen } from "@/features/exam/exam-screen";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/_proto/exam")({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: ExamScreen,
});
