import type { Attempt } from "./types";

export const HISTORY: Attempt[] = [
  { id: "a1", date: "2025-04-02", mode: "full", band: 5.5, range: [5.0, 6.0], topic: "Work · A place you visited" },
  { id: "a2", date: "2025-04-06", mode: "p1", band: 6.0, range: [5.5, 6.0], topic: "Hometown · Music" },
  { id: "a3", date: "2025-04-10", mode: "p2", band: 5.5, range: [5.5, 6.0], topic: "A useful skill" },
  { id: "a4", date: "2025-04-15", mode: "full", band: 6.0, range: [5.5, 6.5], topic: "Travel · A gift" },
  { id: "a5", date: "2025-04-19", mode: "p3", band: 6.0, range: [6.0, 6.5], topic: "Technology & society" },
  { id: "a6", date: "2025-04-23", mode: "p1", band: 6.5, range: [6.0, 6.5], topic: "Weather · Sports" },
];

export interface ResolvedAttemptView {
  isDefaultLatest: boolean;
  attempt: Attempt | null;
}

export function resolveAttemptView(
  attempts: Attempt[],
  attemptId: string,
  transientAttempt: Attempt | null = null,
): ResolvedAttemptView {
  if (attemptId === "latest") {
    return { isDefaultLatest: true, attempt: null };
  }
  if (transientAttempt && transientAttempt.id === attemptId) {
    return { isDefaultLatest: false, attempt: transientAttempt };
  }
  const found = attempts.find((a) => a.id === attemptId);
  if (found) {
    return { isDefaultLatest: false, attempt: found };
  }
  return { isDefaultLatest: true, attempt: null };
}
