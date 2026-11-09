import type { Database } from "@vox-flow/db";

export type ExamConsentResult = {
  inHistory: boolean;
  calibrationGranted: boolean;
};

export async function requireExamConsent(
  _db: Database,
  _userId: string,
): Promise<ExamConsentResult> {
  // D-10 reversal: Exam attempts are always persisted unconditionally.
  // Calibration opt-in toggle is removed from UI, defaulting to false.
  return {
    inHistory: true,
    calibrationGranted: false,
  };
}
