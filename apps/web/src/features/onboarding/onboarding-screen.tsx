import { useState } from "react";

import { useApp } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";
import { markUserOnboarded } from "@/lib/auth-guard";
import { trpcClient } from "@/utils/trpc";

import { GoalStep } from "./components/goal-step";
import { MicCheck } from "./components/mic-check";
import { OnboardingFrame } from "./components/onboarding-frame";

export function OnboardingScreen() {
  const { go } = useApp();
  const sessionUserId = authClient.useSession?.()?.data?.user?.id;
  const [step, setStep] = useState(0);
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const handleFinish = async () => {
    setIsFinishing(true);
    setFinishError(null);
    try {
      if (trpcClient?.profile?.completeOnboarding?.mutate) {
        await trpcClient.profile.completeOnboarding.mutate();
      }
      if (sessionUserId) {
        markUserOnboarded(sessionUserId);
      } else if (authClient.getSession) {
        const sess = await authClient.getSession()?.catch(() => null);
        if (sess?.data?.user?.id) {
          markUserOnboarded(sess.data.user.id);
        }
      }
      go("dashboard");
    } catch {
      setFinishError("Không thể hoàn tất onboarding. Vui lòng thử lại.");
    } finally {
      setIsFinishing(false);
    }
  };
  return (
    <OnboardingFrame
      step={step}
      total={2}
      onBack={step > 0 ? () => setStep(step - 1) : () => go("auth")}
    >
      <div key={step} className="animate-rise">
        {step === 0 && (
          <GoalStep
            chosenDate={chosenDate}
            onDateChange={setChosenDate}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <div>
            {finishError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {finishError}
              </div>
            )}
            <MicCheck onNext={handleFinish} isSubmitting={isFinishing} />
          </div>
        )}
      </div>
    </OnboardingFrame>
  );
}
